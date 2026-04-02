#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST_DIR="$ROOT_DIR/dist"
UUID="$(sed -n 's/.*"uuid": "\(.*\)".*/\1/p' "$ROOT_DIR/metadata.json" | head -n 1)"

if [[ -z "$UUID" ]]; then
  echo "Failed to read extension UUID from metadata.json" >&2
  exit 1
fi

if ! command -v gnome-extensions >/dev/null 2>&1; then
  echo "gnome-extensions is required to build the extension bundle" >&2
  exit 1
fi

mkdir -p "$DIST_DIR"

rm -f "$DIST_DIR/$UUID.shell-extension.zip"

gnome-extensions pack "$ROOT_DIR" \
  --force \
  --out-dir "$DIST_DIR" \
  --extra-source src \
  --extra-source assets

echo "Created $DIST_DIR/$UUID.shell-extension.zip"
