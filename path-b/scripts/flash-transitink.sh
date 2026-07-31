#!/bin/zsh
# Flash TransitInk OS v1.1.3 merged image at offset 0 (after stock backup).
set -euo pipefail

ROOT="/Users/charlescht/Desktop/Vibe code products/Zectrix"
FW="$ROOT/path-b/firmware/transitink-zectrix-note4-v1.1.3.bin"
ESPTOOL="${ESPTOOL:-esptool.py}"
BAUD="${ESP32_BAUD:-460800}"

detect_port() {
  local p
  for p in /dev/cu.usbmodem* /dev/cu.wchusbserial* /dev/cu.SLAB_USBtoUART* /dev/cu.usbserial*; do
    if [[ -e "$p" ]]; then
      print -r -- "$p"
      return 0
    fi
  done
  return 1
}

if [[ ! -f "$FW" ]]; then
  print -u2 "Missing firmware: $FW"
  exit 1
fi

PORT="${1:-${ESP32_PORT:-}}"
if [[ -z "$PORT" ]]; then
  PORT="$(detect_port || true)"
fi
if [[ -z "$PORT" ]]; then
  print -u2 "No serial port. Plug in Note 4 with a USB data cable."
  exit 2
fi

print "Flashing TransitInk OS → $PORT"
print "Firmware: $FW"
"$ESPTOOL" --chip esp32s3 --port "$PORT" --baud "$BAUD" write-flash --flash-mode dio --flash-freq 80m --flash-size 16MB 0x0 "$FW"
print "Flash complete. Device should reboot into TransitInk setup AP."
