#!/bin/bash
set -euo pipefail

NAMESPACE="cloudlets"
IMAGE="servergardens/magic-backend:v23.5.0"
FSGROUP="999"

echo "========================================="
echo "Safe upgrade of deployments in $NAMESPACE"
echo "Target image: $IMAGE"
echo "========================================="

for DEP in $(kubectl get deployments -n "$NAMESPACE" -o jsonpath='{.items[*].metadata.name}')
do
  echo ""
  echo "-----------------------------------------"
  echo "Checking deployment: $DEP"
  echo "-----------------------------------------"

  VOLNAME=$(kubectl get deployment "$DEP" -n "$NAMESPACE" \
    -o jsonpath='{.spec.template.spec.volumes[0].name}')

  # Track whether we actually change anything
  NEEDS_UPDATE=0

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
  # Helper function for mounts
  # ===============================
  ensure_mount() {
    local TARGET="$1"
    local PATH_JSON="$2"
    local PATCH_PATH="$3"
    local MOUNT="$4"
    local SUB="$5"

    if kubectl get deployment "$DEP" -n "$NAMESPACE" \
      -o jsonpath="$PATH_JSON" | grep -q "$MOUNT"; then
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
    echo ""
    echo "✅ Deployment $DEP already fully up to date. Skipping rollout."
    continue
  fi

  echo ""
  echo "Changes applied → restarting rollout..."
  kubectl rollout restart deployment "$DEP" -n "$NAMESPACE"

  echo "Waiting for rollout..."
  kubectl rollout status deployment "$DEP" -n "$NAMESPACE"

done

echo ""
echo "========================================="
echo "All deployments processed safely."
echo "Up-to-date deployments were skipped."
echo "========================================="
