#!/bin/zsh
# Backup full 16 MiB stock flash from Zectrix Note 4 before Path B flash.
set -euo pipefail

ROOT="/Users/charlescht/Desktop/Vibe code products/Zectrix"
OUT_DIR="$ROOT/path-b/backups"
STAMP="$(date +%Y%m%d-%H%M%S)"
OUT="$OUT_DIR/zectrix-note4-stock-$STAMP.bin"
COPY="$HOME/Backups/zectrix-note4-stock-$STAMP.bin"
ESPTOOL="${ESPTOOL:-esptool.py}"
BAUD="${ESP32_BAUD:-460800}"

mkdir -p "$OUT_DIR" "$HOME/Backups"

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

PORT="${1:-${ESP32_PORT:-}}"
if [[ -z "$PORT" ]]; then
  PORT="$(detect_port || true)"
fi
if [[ -z "$PORT" ]]; then
  print -u2 "No ESP32 serial port found. Plug in Note 4 with a USB data cable, then re-run:"
  print -u2 "  ./path-b/scripts/backup-stock.sh"
  exit 2
fi

print "Backing up 16 MiB from $PORT → $OUT"
"$ESPTOOL" --chip esp32s3 --port "$PORT" --baud "$BAUD" read-flash 0 0x1000000 "$OUT"
chmod 600 "$OUT"
cp "$OUT" "$COPY"
chmod 600 "$COPY"

SIZE="$(wc -c < "$OUT" | tr -d ' ')"
if [[ "$SIZE" != "16777216" ]]; then
  print -u2 "Backup size mismatch: got $SIZE, expected 16777216"
  exit 1
fi

print "OK backup: $OUT"
print "Copy:      $COPY"
print "Restore later:"
print "  ./path-b/scripts/restore-stock.sh \"$OUT\""
