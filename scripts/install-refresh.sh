#!/bin/zsh
set -euo pipefail

ROOT="/Users/charlescht/Desktop/Vibe code products/Zectrix"
APP_SUPPORT="$HOME/Library/Application Support/ZectrixFrontdoorBus"
PLIST_DST="$HOME/Library/LaunchAgents/com.zectrix.frontdoor-bus.plist"
LABEL="com.zectrix.frontdoor-bus"
WRAPPER="$APP_SUPPORT/refresh.sh"

mkdir -p "$APP_SUPPORT" "$HOME/Library/LaunchAgents" "$HOME/Library/Logs/ZectrixFrontdoorBus"

# Install wrapper outside Desktop (macOS privacy)
cp "$ROOT/scripts/refresh.sh" "$WRAPPER"
chmod +x "$WRAPPER"

cat >"$PLIST_DST" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.zectrix.frontdoor-bus</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/zsh</string>
    <string>${WRAPPER}</string>
  </array>
  <key>StartInterval</key>
  <integer>60</integer>
  <key>RunAtLoad</key>
  <true/>
  <key>StandardOutPath</key>
  <string>${HOME}/Library/Logs/ZectrixFrontdoorBus/launchd.out.log</string>
  <key>StandardErrorPath</key>
  <string>${HOME}/Library/Logs/ZectrixFrontdoorBus/launchd.err.log</string>
</dict>
</plist>
EOF

launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$PLIST_DST"
launchctl enable "gui/$(id -u)/$LABEL"
launchctl kickstart -k "gui/$(id -u)/$LABEL"

echo "Installed LaunchAgent: $LABEL"
echo "Wrapper: $WRAPPER"
echo "Pushes every minute during 06:00–09:00 HKT (Mac must be awake)."
echo "Logs: ~/Library/Logs/ZectrixFrontdoorBus/refresh.log"
echo
echo "Note 4: set 同步周期 to 1 minute for commute, or press front button to pull."
