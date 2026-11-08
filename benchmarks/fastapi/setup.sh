#!/bin/bash
# Builds Magic "before" and "after", gets Chinook the way Magic does (start Magic, install the sqlite-chinook plugin),
# creates a clean instance of each build, and the FastAPI virtualenv.
# Needs: git, dotnet 10 SDK, python3.13, sqlite3, rsync, curl, wrk.
# MAGIC_START is how Magic is launched, from inside its folder (default "dotnet backend.dll"). CHINOOK_DB skips the plugin step.
set -euo pipefail
WORK="${WORK:-$HOME/hl-bench}"
REPO="${MAGIC_REPO:-https://github.com/polterguy/magic.git}"
BEFORE=27f6711236783178d9e6775aac1fe4eaec3cb5e4   # "Tightening security", the last commit before the optimisation work
AFTER=ffaaac757b6702265d23a3c266f15ca35dc48618    # "Optimising", the last commit of the day
HERE="$(cd "$(dirname "$0")" && pwd)"
MAGIC_START="${MAGIC_START:-dotnet backend.dll}"
mkdir -p "$WORK" && cd "$WORK"

# One bare, blob-less clone of the repository; git archive then fetches only the files it needs.
[ -d magic.git ] || git clone --quiet --bare --filter=blob:none "$REPO" magic.git

build() {   # build <before|after>: publishes that commit's backend into publish-<before|after>
  V=$1; COMMIT=$([ $V = before ] && echo $BEFORE || echo $AFTER)
  rm -rf "src-$V" "publish-$V" && mkdir "src-$V"
  git --git-dir=magic.git archive "$COMMIT" plugins backend/backend.csproj backend/Program.cs backend/Startup.cs backend/Properties backend/slots | tar -x -C "src-$V"
  (cd "src-$V" && dotnet publish backend/backend.csproj -c Release -o "$WORK/publish-$V" -v q)
}

build after
build before

# Magic ships without Chinook. Start a default Magic (the repository's own backend/files, login root/root), install the
# sqlite-chinook plugin through the same API the dashboard uses, and build the database from the SQL the plugin installs.
if [ -z "${CHINOOK_DB:-}" ]; then
  B="$WORK/bootstrap"; rm -rf "$B" && mkdir -p "$B"
  rsync -a --exclude files publish-after/ "$B/"
  git --git-dir=magic.git archive "$AFTER" backend/files | tar -x -C "$B" --strip-components=1
  stop_magic() { kill $(lsof -t -nP -iTCP:5200 -sTCP:LISTEN) 2>/dev/null || true; }   # whatever is listening on the bootstrap port
  (cd "$B" && ASPNETCORE_URLS=http://127.0.0.1:5200 bash -c "$MAGIC_START" > "$WORK/bootstrap.log" 2>&1 &)
  trap stop_magic EXIT
  for _ in $(seq 1 120); do curl -s -o /dev/null http://127.0.0.1:5200/magic/system/ping && break; sleep 1; done
  TOKEN=$(curl -s "http://127.0.0.1:5200/magic/system/auth/authenticate?username=root&password=root" | python3 -c 'import json,sys;print(json.load(sys.stdin)["ticket"])')
  curl -s -X POST http://127.0.0.1:5200/magic/system/bazar/install-plugin -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
       -d '{"url":"https://ainiro.io/magic/modules/bazar/download-bazar-app?name=sqlite-chinook","name":"sqlite-chinook","type":"module"}' > /dev/null
  for _ in $(seq 1 120); do [ -f "$B/files/etc/sqlite/templates/chinook.sql" ] && break; sleep 1; done
  stop_magic; sleep 2
  rm -f "$WORK/chinook.db" && sqlite3 "$WORK/chinook.db" < "$B/files/etc/sqlite/templates/chinook.sql"
  CHINOOK_DB="$WORK/chinook.db"
fi
[ "$(sqlite3 "$CHINOOK_DB" 'select count(*), sum(length(Name)) from Artist')" = "275|5658" ] || { echo "Unexpected Artist table, expected 275 rows and 5,658 name characters"; exit 1; }

for V in before after; do
  rm -rf "magic-$V"

  # A clean instance: published binaries, a bare configuration, Magic's own empty database, Chinook, and the three endpoints.
  I="$WORK/magic-$V"
  mkdir -p "$I/files/config" "$I/files/data" "$I/files/modules/bench"
  rsync -a --exclude files "publish-$V/" "$I/"
  SECRET="$(python3 -c "import secrets,string;print(''.join(secrets.choice(string.ascii_letters+string.digits) for _ in range(137)))")"
  cat > "$I/files/config/appsettings.json" <<JSON
{
  "magic": {
    "auth": { "secret": "$SECRET", "https-only": false, "valid-minutes": 120, "authentication": "crypto.password.verify" },
    "databases": { "default": "sqlite", "sqlite": { "generic": "Data Source=files/data/{database}.db; Pooling=False; Default Timeout=5;" } },
    "culture": { "defaultTimeZone": "none" },
    "lambda": { "maxWhileIterations": 15000 },
    "sockets": { "url": "/sockets" }
  },
  "Logging": { "LogLevel": { "Default": "Warning", "Microsoft.AspNetCore": "Warning" } }
}
JSON
  git --git-dir=magic.git show "$AFTER:backend/files/misc/sqlite/magic.sql" | sqlite3 "$I/files/data/magic.db" > /dev/null
  cp "$CHINOOK_DB" "$I/files/data/chinook.db"
  printf 'return-nodes\n   result:success\n' > "$I/files/modules/bench/ping.get.hl"
  printf '.arguments\n   name:string\nstrings.concat\n   .:"Hello there "\n   get-value:x:@.arguments/*/name\n   .:", and welcome to the farm"\nyield\n   result:x:@strings.concat\n' > "$I/files/modules/bench/hello.get.hl"
  printf 'data.connect:chinook\n   data.read\n      table:Artist\n      order:ArtistId\n      limit:long:10\n   return-nodes:x:@data.read/*\n' > "$I/files/modules/bench/artists.get.hl"
done

# FastAPI, pinned.
mkdir -p fastapi && cp "$HERE/app.py" "$HERE/requirements.txt" fastapi/ && cp "$CHINOOK_DB" fastapi/chinook.db
[ -d fastapi/.venv ] || { python3.13 -m venv fastapi/.venv && fastapi/.venv/bin/pip install -q -r fastapi/requirements.txt; }
echo "Setup done in $WORK"
