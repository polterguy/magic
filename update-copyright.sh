#!/usr/bin/env bash
# Replaces the copyright owner and licensing contact in the header comment of every source file.
#
#   Thomas Hansen / AINIRO, Ltd and Thomas Hansen   ->  AINIRO.IO, Ltd
#   thomas@ainiro.io                                ->  team@ainiro.io
#
# Only lines that contain "copyright" together with Thomas Hansen or AINIRO are touched, so
# author bylines and other mentions of the email address are left alone. Years are kept as they are.
#
# Usage, from the repo root:
#   ./update-copyright.sh --dry-run   list the files that would change
#   ./update-copyright.sh             change them

set -euo pipefail
cd "$(dirname "$0")"

OWNER="AINIRO.IO, Ltd"
EMAIL="team@ainiro.io"

# A line is a copyright header line when it mentions copyright plus the old owner.
MATCH='copyright.*(Thomas Hansen|AINIRO)'

files=$(grep -rIlEi "$MATCH" . \
  --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=bin --exclude-dir=obj \
  --exclude-dir=etc --exclude=LICENSE --exclude=README.md --exclude=update-copyright.sh || true)

if [ -z "$files" ]; then
  echo "No files to update."
  exit 0
fi

echo "$files" | wc -l | xargs echo "Files with a copyright header to update:"

if [ "${1:-}" = "--dry-run" ]; then
  echo "$files"
  exit 0
fi

echo "$files" | while IFS= read -r f; do
  OWNER="$OWNER" EMAIL="$EMAIL" perl -i -pe '
    if (/copyright.*(Thomas Hansen|AINIRO)/i) {
      s/AINIRO(?:\.IO)?, Ltd(?:, Ltd)? and Thomas Hansen/Thomas Hansen/;
      s/Thomas Hansen/$ENV{OWNER}/g;
      s/thomas\@ainiro\.io/$ENV{EMAIL}/g;
    }
  ' "$f"
done

echo "Done. Review with: git diff --stat"
