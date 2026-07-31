#!/bin/zsh
# Restore stock Zectrix Note 4 firmware from a 16 MiB backup.
set -euo pipefail

BIN="${1:?usage: restore-stock.sh <backup.bin> [port]}"
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

PORT="${2:-${ESP32_PORT:-}}"
if [[ -z "$PORT" ]]; then
  PORT="$(detect_port || true)"
fi
if [[ -z "$PORT" ]]; then
  print -u2 "No serial port. Plug in Note 4, then re-run."
  exit 2
fi

SIZE="$(wc -c < "$BIN" | tr -d ' ')"
if [[ "$SIZE" != "16777216" ]]; then
  print -u2 "Refusing restore: $BIN is $SIZE bytes, expected 16777216"
  exit 1
fi

print "Restoring stock firmware from $BIN → $PORT"
"$ESPTOOL" --chip esp32s3 --port "$PORT" --baud "$BAUD" write-flash 0x0 "$BIN"
print "Done. Re-bind device in Zectrix mini-program / cloud if needed."
