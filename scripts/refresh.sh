#!/bin/zsh
# Wrapper installed to ~/Library/Application Support (avoids Desktop TCC + spaces issues).
set -euo pipefail

ROOT="/Users/charlescht/Desktop/Vibe code products/Zectrix"
LOG_DIR="$HOME/Library/Logs/ZectrixFrontdoorBus"
LOG_FILE="$LOG_DIR/refresh.log"
LOCK_DIR="$LOG_DIR/refresh.lock"
NODE="/usr/local/bin/node"
TSX="$ROOT/node_modules/tsx/dist/cli.mjs"

# launchd has a tiny PATH
export PATH="/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin"
export CI=1
export NPM_CONFIG_UPDATE_NOTIFIER=false

mkdir -p "$LOG_DIR"

eval "$(/bin/date '+h=%H; m=%M')"
mins=$((10#$h * 60 + 10#$m))
start=$((6 * 60))
end=$((9 * 60)) # inclusive 09:00 → 06:00–09:00

if (( mins < start || mins > end )); then
  exit 0
fi

if ! mkdir "$LOCK_DIR" 2>/dev/null; then
  echo "$(/bin/date '+%Y-%m-%d %H:%M:%S') skip: already running" >>"$LOG_FILE"
  exit 0
fi
trap 'rmdir "$LOCK_DIR" 2>/dev/null || true' EXIT

{
  echo "===== $(/bin/date '+%Y-%m-%d %H:%M:%S %Z') ====="
  cd "$ROOT"
  "$NODE" "$TSX" src/index.ts
  echo
} >>"$LOG_FILE" 2>&1
