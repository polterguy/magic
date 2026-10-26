#!/bin/bash
set -euo pipefail

# Both can be overridden from the environment, e.g.  IMAGE=servergardens/magic-backend:v24.2.0 ./update-deployments.sh
NAMESPACE="${NAMESPACE:-cloudlets}"
IMAGE="${IMAGE:-servergardens/magic-backend:v24.1.4}"
FSGROUP="999"

# Set ONLY to the name of one deployment to try the script on just that one, e.g.  ONLY=thomastest-team ./update-deployments.sh
ONLY="${ONLY:-}"

# These deployments use a volume that can only be attached to one node at a time. When the new pod lands on another
# node than the old one, it fails with a Multi-Attach error until the old attachment is gone. So a deployment that is
# about to change is scaled to 0 first, and given this many seconds to release its volume before the new pod starts.
DETACH_WAIT="${DETACH_WAIT:-20}"

# How many seconds to wait for one deployment to become ready. When it does not, the script STOPS, and the deployments
# after it are not touched.
ROLLOUT_TIMEOUT="${ROLLOUT_TIMEOUT:-300}"

# Resources. CPU limit is written as "1" (not "1000m") because Kubernetes reports it that way,
# which keeps the idempotence check below from patching on every run.
MAIN_REQ_CPU="50m"
MAIN_REQ_MEM="128Mi"
MAIN_LIM_CPU="1"
MAIN_LIM_MEM="768Mi"

INIT_REQ_CPU="25m"
INIT_REQ_MEM="32Mi"
INIT_LIM_CPU="500m"
INIT_LIM_MEM="256Mi"

# Probes. Magic listens on 4444.
#
#   startup   - gives a booting pod (database migrations, scanning files) up to 60 x 5s = 5 minutes, and
#               holds off the other two probes until it has succeeded once.
#   readiness - [healthz] also checks that the database can be reached, so traffic only reaches a pod that is
#               actually able to serve it, and is taken away while the database is unavailable.
#   liveness  - [ping] only checks that the HTTP pipeline answers. Deliberately NOT [healthz], since a
#               database hiccup must never get the pod restarted - restarting would not fix the database.
PORT="4444"
PROBE_READY_PATH="/magic/system/healthz"
PROBE_LIVE_PATH="/magic/system/ping"

# Forwarded-headers hop count: client → Cloudflare → ingress → pod.
# Makes request.ip/request.scheme resolve the true end user (see
# docs/deploy-kubernetes.md). The middleware itself is on by default.
FWD_LIMIT="2"
FWD_ENV="magic__forwarded-headers__forward-limit"

# Hard cap on the .NET GC heap (hex bytes, 0x20000000 = 512Mi) inside the 768Mi
# container limit, leaving ~256Mi for native memory (SQLite, Python, stacks, JIT).
# The GC collects harder near the cap instead of the pod being OOMKilled.
GC_LIMIT="0x20000000"
GC_ENV="DOTNET_GCHeapHardLimit"

# Make the GC release freed memory sooner on idle tenants (0-9, higher = smaller footprint, a bit more CPU).
GCM_LIMIT="5"
GCM_ENV="DOTNET_GCConserveMemory"

# Cloudlet workloads never call the Kubernetes API, so they get a ServiceAccount with no
# token mounted at all, rather than the namespace's "default" SA every pod gets otherwise.
NOAPI_SA="no-api-access"

echo "========================================="
echo "Safe upgrade of deployments in $NAMESPACE"
echo "Cluster:      $(kubectl config current-context)"
echo "Target image: $IMAGE"
if [[ -n "$ONLY" ]]; then
  echo "Only:         $ONLY"
fi
echo "========================================="

# Make sure the image exists before anything is touched. These deployments use the Recreate strategy, so one whose new
# image cannot be pulled is DOWN until somebody rolls it back.
if command -v docker >/dev/null 2>&1; then
  if ! docker manifest inspect "$IMAGE" >/dev/null 2>&1; then
    echo "❌ Cannot find $IMAGE in the registry (or you are not logged in to it). Nothing was changed."
    exit 1
  fi
  echo "✅ The image exists in the registry."
else
  echo "⚠️  docker is not installed here, so the image could not be checked. Make sure the tag exists before you continue."
fi

# This is run by hand, so ask first. Set YES=1 to skip the question.
if [[ "${YES:-}" != "1" ]]; then
  read -r -p "Continue? [y/N] " ANSWER
  if [[ "$ANSWER" != "y" && "$ANSWER" != "Y" ]]; then
    echo "Aborted. Nothing was changed."
    exit 1
  fi
fi

kubectl apply -f - <<EOF
apiVersion: v1
kind: ServiceAccount
metadata:
  name: $NOAPI_SA
  namespace: $NAMESPACE
automountServiceAccountToken: false
EOF

# The deployment currently paused by this script. If the script dies half way through, for instance on Ctrl+C or a
# failing kubectl command, it must never leave a deployment paused, since a paused deployment silently ignores
# every change made to it afterwards.
PAUSED=""
resume_paused() {
  if [[ -n "$PAUSED" ]]; then
    kubectl rollout resume deployment/"$PAUSED" -n "$NAMESPACE" >/dev/null 2>&1 || true
    PAUSED=""
  fi
}

# The deployment this script has scaled to 0, and how many replicas it had. If the script dies while a deployment is at 0,
# it is scaled back up, since otherwise that cloudlet stays down.
SCALED=""
SCALED_REPLICAS=""
restore_scale() {
  if [[ -n "$SCALED" ]]; then
    echo "Scaling $SCALED back to $SCALED_REPLICAS replica(s)..."
    kubectl scale deployment/"$SCALED" --replicas="$SCALED_REPLICAS" -n "$NAMESPACE" >/dev/null 2>&1 || true
    SCALED=""
  fi
}

cleanup() {
  resume_paused
  restore_scale
}
trap cleanup EXIT

# Waits for a rollout to finish, but gives up as soon as a pod reports a problem that waiting will not fix, such as an
# image that cannot be pulled, instead of waiting for the whole timeout.
wait_for_rollout() {
  local DEPLOYMENT="$1"
  local WAITED=0
  local REASONS

  while (( WAITED < ROLLOUT_TIMEOUT )); do
    if kubectl rollout status deployment "$DEPLOYMENT" -n "$NAMESPACE" --timeout=10s >/dev/null 2>&1; then
      return 0
    fi
    WAITED=$((WAITED + 10))

    REASONS=$(kubectl get pods -n "$NAMESPACE" -l "app=$DEPLOYMENT" \
      -o jsonpath='{range .items[*]}{.status.containerStatuses[*].state.waiting.reason} {.status.initContainerStatuses[*].state.waiting.reason} {end}' 2>/dev/null || true)
    if [[ "$REASONS" =~ (ErrImagePull|ImagePullBackOff|InvalidImageName|CreateContainerConfigError|CrashLoopBackOff) ]]; then
      echo "   The pod reports: $REASONS"
      return 1
    fi
    echo "   Still waiting ($WAITED/${ROLLOUT_TIMEOUT}s)..."
  done
  return 1
}

for DEP in $(kubectl get deployments -n "$NAMESPACE" -o jsonpath='{.items[*].metadata.name}')
do
  if [[ -n "$ONLY" && "$DEP" != "$ONLY" ]]; then
    continue
  fi

  echo ""
  echo "-----------------------------------------"
  echo "Checking deployment: $DEP"
  echo "-----------------------------------------"

  VOLNAME=$(kubectl get deployment "$DEP" -n "$NAMESPACE" \
    -o jsonpath='{.spec.template.spec.volumes[0].name}')

  # Track whether we actually change anything
  NEEDS_UPDATE=0

  # Every change to the pod template of a deployment starts a rollout of its own, and since these deployments
  # use the Recreate strategy, each one would kill the pod and start a new one - which also runs the init container
  # again. So we pause the deployment, make all our changes, and resume it, which results in ONE rollout.
  # (Pausing a deployment that is already paused is reported as an error, which we don't care about.)
  kubectl rollout pause deployment/"$DEP" -n "$NAMESPACE" >/dev/null 2>&1 || true
  PAUSED="$DEP"

  # ===============================
  # 1) Check image
  # ===============================
  CURIMG=$(kubectl get deployment "$DEP" -n "$NAMESPACE" \
    -o jsonpath='{.spec.template.spec.containers[0].image}')

  if [[ "$CURIMG" != "$IMAGE" ]]; then
    echo "Image needs update: $CURIMG → $IMAGE"
    kubectl set image deployment/"$DEP" "$DEP=$IMAGE" -n "$NAMESPACE"
    NEEDS_UPDATE=1
  else
    echo "Image already correct."
  fi

  # ===============================
  # 2) Check fsGroup
  # ===============================
  CURFS=$(kubectl get deployment "$DEP" -n "$NAMESPACE" \
    -o jsonpath='{.spec.template.spec.securityContext.fsGroup}' 2>/dev/null || true)

  if [[ "$CURFS" != "$FSGROUP" ]]; then
    echo "fsGroup needs update → $FSGROUP"
    kubectl patch deployment "$DEP" -n "$NAMESPACE" --type=merge -p "
spec:
  template:
    spec:
      securityContext:
        fsGroup: $FSGROUP
"
    NEEDS_UPDATE=1
  else
    echo "fsGroup already correct."
  fi

  # ===============================
  # 2.3) Check serviceAccountName
  # ===============================
  CURSA=$(kubectl get deployment "$DEP" -n "$NAMESPACE" \
    -o jsonpath='{.spec.template.spec.serviceAccountName}' 2>/dev/null || true)

  if [[ "$CURSA" != "$NOAPI_SA" ]]; then
    echo "serviceAccountName needs update → $NOAPI_SA"
    kubectl patch deployment "$DEP" -n "$NAMESPACE" --type=merge -p "
spec:
  template:
    spec:
      serviceAccountName: $NOAPI_SA
"
    NEEDS_UPDATE=1
  else
    echo "serviceAccountName already correct."
  fi

  # ===============================
  # 2.4) Check automountServiceAccountToken
  # ===============================
  CURTOKEN=$(kubectl get deployment "$DEP" -n "$NAMESPACE" \
    -o jsonpath='{.spec.template.spec.automountServiceAccountToken}' 2>/dev/null || true)

  if [[ "$CURTOKEN" != "false" ]]; then
    echo "automountServiceAccountToken needs update → false"
    kubectl patch deployment "$DEP" -n "$NAMESPACE" --type=merge -p "
spec:
  template:
    spec:
      automountServiceAccountToken: false
"
    NEEDS_UPDATE=1
  else
    echo "automountServiceAccountToken already correct."
  fi

  # ===============================
  # 2.5) Check forwarded-headers limit
  # ===============================
  CURFWD=$(kubectl get deployment "$DEP" -n "$NAMESPACE" \
    -o jsonpath="{.spec.template.spec.containers[0].env[?(@.name=='$FWD_ENV')].value}" 2>/dev/null || true)

  if [[ "$CURFWD" != "$FWD_LIMIT" ]]; then
    echo "Forwarded-headers limit needs update: '${CURFWD:-<unset>}' → $FWD_LIMIT"
    kubectl set env deployment/"$DEP" -c "$DEP" -n "$NAMESPACE" "$FWD_ENV=$FWD_LIMIT"
    NEEDS_UPDATE=1
  else
    echo "Forwarded-headers limit already correct."
  fi

  # ===============================
  # 2.55) Check GC heap hard limit
  # ===============================
  CURGC=$(kubectl get deployment "$DEP" -n "$NAMESPACE" \
    -o jsonpath="{.spec.template.spec.containers[0].env[?(@.name=='$GC_ENV')].value}" 2>/dev/null || true)

  if [[ "$CURGC" != "$GC_LIMIT" ]]; then
    echo "GC heap hard limit needs update: '${CURGC:-<unset>}' → $GC_LIMIT"
    kubectl set env deployment/"$DEP" -c "$DEP" -n "$NAMESPACE" "$GC_ENV=$GC_LIMIT"
    NEEDS_UPDATE=1
  else
    echo "GC heap hard limit already correct."
  fi

  # ===============================
  # 2.56) Check GC conserve-memory level
  # ===============================
  CURGCM=$(kubectl get deployment "$DEP" -n "$NAMESPACE" \
    -o jsonpath="{.spec.template.spec.containers[0].env[?(@.name=='$GCM_ENV')].value}" 2>/dev/null || true)

  if [[ "$CURGCM" != "$GCM_LIMIT" ]]; then
    echo "GC conserve-memory needs update: '${CURGCM:-<unset>}' → $GCM_LIMIT"
    kubectl set env deployment/"$DEP" -c "$DEP" -n "$NAMESPACE" "$GCM_ENV=$GCM_LIMIT"
    NEEDS_UPDATE=1
  else
    echo "GC conserve-memory already correct."
  fi

  # ===============================
  # 2.6) Check CPU/memory requests and limits
  # ===============================
  # $1 = containers | initContainers, $2 = request cpu, $3 = request memory, $4 = limit cpu, $5 = limit memory
  ensure_resources() {
    local KIND="$1"
    local RC="$2"
    local RM="$3"
    local LC="$4"
    local LM="$5"
    local BASE=".spec.template.spec.${KIND}[0].resources"

    local CUR
    CUR=$(kubectl get deployment "$DEP" -n "$NAMESPACE" \
      -o jsonpath="{${BASE}.requests.cpu}/{${BASE}.requests.memory}/{${BASE}.limits.cpu}/{${BASE}.limits.memory}" 2>/dev/null || true)

    if [[ "$CUR" != "$RC/$RM/$LC/$LM" ]]; then
      echo "$KIND resources need update: '${CUR:-<unset>}' → $RC/$RM/$LC/$LM"
      kubectl patch deployment "$DEP" -n "$NAMESPACE" --type=json -p="[
        {
          \"op\": \"add\",
          \"path\": \"/spec/template/spec/${KIND}/0/resources\",
          \"value\": {
            \"requests\": { \"cpu\": \"$RC\", \"memory\": \"$RM\" },
            \"limits\":   { \"cpu\": \"$LC\", \"memory\": \"$LM\" }
          }
        }
      ]"
      NEEDS_UPDATE=1
    else
      echo "$KIND resources already correct."
    fi
  }

  ensure_resources "containers" "$MAIN_REQ_CPU" "$MAIN_REQ_MEM" "$MAIN_LIM_CPU" "$MAIN_LIM_MEM"

  # Only touch the init container if the deployment has one.
  if [[ -n "$(kubectl get deployment "$DEP" -n "$NAMESPACE" \
        -o jsonpath='{.spec.template.spec.initContainers[0].name}' 2>/dev/null || true)" ]]; then
    ensure_resources "initContainers" "$INIT_REQ_CPU" "$INIT_REQ_MEM" "$INIT_LIM_CPU" "$INIT_LIM_MEM"
  fi

  # ===============================
  # 2.7) Check probes
  # ===============================
  # $1 = readinessProbe | livenessProbe | startupProbe, $2 = HTTP path, $3 = period seconds,
  # $4 = timeout seconds, $5 = failure threshold
  ensure_probe() {
    local FIELD="$1"
    local PROBE_PATH="$2"
    local PERIOD="$3"
    local TIMEOUT="$4"
    local FAILURES="$5"
    local BASE=".spec.template.spec.containers[0].${FIELD}"

    local CUR
    CUR=$(kubectl get deployment "$DEP" -n "$NAMESPACE" \
      -o jsonpath="{${BASE}.httpGet.path}:{${BASE}.httpGet.port}/{${BASE}.periodSeconds}/{${BASE}.timeoutSeconds}/{${BASE}.failureThreshold}" 2>/dev/null || true)

    if [[ "$CUR" != "$PROBE_PATH:$PORT/$PERIOD/$TIMEOUT/$FAILURES" ]]; then
      echo "$FIELD needs update: '${CUR:-<unset>}' → $PROBE_PATH:$PORT/$PERIOD/$TIMEOUT/$FAILURES"
      kubectl patch deployment "$DEP" -n "$NAMESPACE" --type=json -p="[
        {
          \"op\": \"add\",
          \"path\": \"/spec/template/spec/containers/0/${FIELD}\",
          \"value\": {
            \"httpGet\": { \"path\": \"$PROBE_PATH\", \"port\": $PORT },
            \"periodSeconds\": $PERIOD,
            \"timeoutSeconds\": $TIMEOUT,
            \"failureThreshold\": $FAILURES
          }
        }
      ]"
      NEEDS_UPDATE=1
    else
      echo "$FIELD already correct."
    fi
  }

  ensure_probe "startupProbe"   "$PROBE_READY_PATH" 5  5 60
  ensure_probe "readinessProbe" "$PROBE_READY_PATH" 10 5 3
  ensure_probe "livenessProbe"  "$PROBE_LIVE_PATH"  20 5 3

  # ===============================
  # Helper function for mounts
  # ===============================
  ensure_mount() {
    local TARGET="$1"
    local PATH_JSON="$2"
    local PATCH_PATH="$3"
    local MOUNT="$4"
    local SUB="$5"

    # The mount paths come back as one space separated line, and must match exactly, so that for instance
    # /magic/files/data is not considered present because /magic/files/database is.
    if kubectl get deployment "$DEP" -n "$NAMESPACE" \
      -o jsonpath="$PATH_JSON" | tr ' ' '\n' | grep -qxF "$MOUNT"; then
      echo "Mount exists: $MOUNT"
    else
      echo "Adding mount: $MOUNT"
      kubectl patch deployment "$DEP" -n "$NAMESPACE" --type=json -p="[
        {
          \"op\": \"add\",
          \"path\": \"$PATCH_PATH\",
          \"value\": {
            \"name\": \"$VOLNAME\",
            \"mountPath\": \"$MOUNT\",
            \"subPath\": \"$SUB\"
          }
        }
      ]"
      NEEDS_UPDATE=1
    fi
  }

  # ===============================
  # 3) Main container mounts
  # ===============================
  echo "Checking main container mounts..."

  ensure_mount "main" \
    '{.spec.template.spec.containers[0].volumeMounts[*].mountPath}' \
    "/spec/template/spec/containers/0/volumeMounts/-" \
    "/magic/files/data" \
    "magic/files/data"

  ensure_mount "main" \
    '{.spec.template.spec.containers[0].volumeMounts[*].mountPath}' \
    "/spec/template/spec/containers/0/volumeMounts/-" \
    "/magic/files/modules" \
    "magic/files/modules"

  # ===============================
  # 4) Init container mounts
  # ===============================
  echo "Checking initContainer mounts..."

  ensure_mount "init" \
    '{.spec.template.spec.initContainers[0].volumeMounts[*].mountPath}' \
    "/spec/template/spec/initContainers/0/volumeMounts/-" \
    "/magic/files/data" \
    "magic/files/data"

  ensure_mount "init" \
    '{.spec.template.spec.initContainers[0].volumeMounts[*].mountPath}' \
    "/spec/template/spec/initContainers/0/volumeMounts/-" \
    "/magic/files/modules" \
    "magic/files/modules"

  # ===============================
  # 5) Restart ONLY if changes happened
  # ===============================
  if [[ "$NEEDS_UPDATE" -eq 0 ]]; then
    resume_paused
    echo ""
    echo "✅ Deployment $DEP already fully up to date. Skipping rollout."
    continue
  fi

  # Releasing the volume first, see DETACH_WAIT. Notice, a paused deployment can still be scaled.
  REPLICAS=$(kubectl get deployment "$DEP" -n "$NAMESPACE" -o jsonpath='{.spec.replicas}')
  if [[ "${REPLICAS:-0}" -gt 0 ]]; then
    SCALED="$DEP"
    SCALED_REPLICAS="$REPLICAS"
    echo "Scaling $DEP to 0 so its volume is released before the new pod starts..."
    kubectl scale deployment/"$DEP" --replicas=0 -n "$NAMESPACE"
    kubectl wait --for=delete pod -l "app=$DEP" -n "$NAMESPACE" --timeout=120s >/dev/null 2>&1 || true
    echo "Giving the volume ${DETACH_WAIT}s to detach..."
    sleep "$DETACH_WAIT"
  fi

  # Resuming starts ONE rollout of the changed template, and since there are no pods, nothing is started yet.
  resume_paused

  # Waiting until the deployment has picked up the new template, since scaling up before that could start a pod from
  # the OLD template, only for it to be replaced a moment later.
  kubectl rollout status deployment/"$DEP" -n "$NAMESPACE" --timeout=60s >/dev/null 2>&1 || true

  # Starting the new pod.
  if [[ -n "$SCALED" ]]; then
    kubectl scale deployment/"$DEP" --replicas="$SCALED_REPLICAS" -n "$NAMESPACE"
    SCALED=""
  fi

  echo ""
  echo "Changes applied → waiting for rollout..."
  if ! wait_for_rollout "$DEP"; then
    echo ""
    echo "❌ Deployment $DEP did not become ready. STOPPING - the remaining deployments were NOT touched."
    echo "   Look at it with:   kubectl describe pod -n $NAMESPACE -l app=$DEP"
    echo "   Roll it back with: kubectl rollout undo deployment/$DEP -n $NAMESPACE"
    exit 1
  fi
  echo "✅ $DEP is ready."

done

echo ""
echo "========================================="
echo "All deployments processed safely."
echo "Up-to-date deployments were skipped."
echo "========================================="
