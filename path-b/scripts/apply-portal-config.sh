#!/bin/zsh
# Apply path-b/config/ching-fu-frontdoor.json via TransitInk setup AP portal.
# Prerequisites: Note 4 showing TransitInk-xxxx + password; Mac joined that AP.
set -euo pipefail

ROOT="/Users/charlescht/Desktop/Vibe code products/Zectrix"
CFG="${1:-$ROOT/path-b/config/ching-fu-frontdoor.json}"
BASE="${TRANSITINK_PORTAL:-http://192.168.4.1}"

if ! grep -q 'REPLACE_HOME_WIFI' "$CFG"; then
  :
else
  print -u2 "Edit Wi-Fi placeholders in: $CFG"
  print -u2 "Set wifi_ssid / wifi_password, then re-run."
  exit 2
fi

print "Fetching portal page for CSRF..."
HTML="$(curl -sS "$BASE/")"
# CSRF may be embedded in page JS/meta — try common patterns
CSRF="$(print -r -- "$HTML" | python3 -c '
import re,sys
html=sys.stdin.read()
for pat in [
  r"csrf[\"\']?\s*[:=]\s*[\"\']([A-Za-z0-9_\-]+)[\"\']",
  r"name=[\"\']csrf[\"\'][^>]*content=[\"\']([^\"\']+)",
  r"X-TransitInk-CSRF[\"\']?\s*,\s*[\"\']([^\"\']+)",
]:
  m=re.search(pat, html, re.I)
  if m:
    print(m.group(1)); break
')"

if [[ -z "$CSRF" ]]; then
  print -u2 "Could not extract CSRF from $BASE/"
  print -u2 "Open $BASE in a browser, configure using WIDGET_SETUP.md instead."
  exit 3
fi

print "Saving config with CSRF=$CSRF"
curl -sS -X POST "$BASE/api/save" \
  -H "Content-Type: application/json" \
  -H "X-TransitInk-CSRF: $CSRF" \
  --data-binary @"$CFG"
print
print "If save succeeded, device will reboot onto home Wi-Fi."
