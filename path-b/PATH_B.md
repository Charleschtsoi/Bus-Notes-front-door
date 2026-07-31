# Path B — TransitInk OS on Zectrix Note 4

On-device KMB ETA (~60s). Replaces stock AI firmware until you restore the backup.

## Safety

Stock backup already taken (this machine):

- `path-b/backups/zectrix-note4-stock-20260731-234351.bin`
- `~/Backups/zectrix-note4-stock-20260731-234351.bin`

1. **Always backup first** before any future re-flash:

```bash
cd "/Users/charlescht/Desktop/Vibe code products/Zectrix"
./path-b/scripts/backup-stock.sh
```

2. **Restore stock** if needed:

```bash
./path-b/scripts/restore-stock.sh path-b/backups/zectrix-note4-stock-20260731-234351.bin
```

TransitInk OS **v1.1.3** was flashed via `./path-b/scripts/flash-transitink.sh`.

## Flash TransitInk OS v1.1.3

After a successful backup:

```bash
./path-b/scripts/flash-transitink.sh
```

Or use Chrome/Edge: https://zerie55699.github.io/transitink-os/ → Zectrix Note 4 → 首次安裝.

## First boot

1. Device shows Wi-Fi `TransitInk-xxxx` + password on screen.
2. Join it → open `http://192.168.4.1/`
3. Enter home **2.4 GHz** Wi-Fi.
4. Later: **Volume Up** opens LAN settings portal (IP / QR on screen).

### Keys

| Key | Action |
|---|---|
| Big round | Wake |
| Volume Up | Settings portal |
| Volume Down | Next widget page |
| Up+Down 5s | Factory reset |

## Widget map (青富苑)

### Page 1 — Weekday morning

| Slot | Route | Stop | Direction |
|---|---|---|---|
| 1 | **49M** | 青富苑 (TY107) `333E9F98EEB84849` | 青衣站 |
| 2 | **A32** | 長青邨青桃樓 (TY100) `3D42EBD6AC55A845` | 機場 |
| 3 | **948B** | 青富苑 (TY106) `07F45B3B36DFDDAE` | 天后 |
| 4 | **948A** | 長青邨青桃樓 (TY332) `CA60760D2303E6D0` | 天后 |

### Page 2 — Weekday overflow + weekend

| Slot | Route | Stop | Direction |
|---|---|---|---|
| 1 | **948** | 長青邨青桃樓 (TY332) `CA60760D2303E6D0` | 天后 |
| 2 | **X42C** | 青富苑 (TY106) `07F45B3B36DFDDAE` (early trips: 青桃樓 TY331 `B085DDE8E381E370`) | 油塘 |
| 3 | **42A** | 長青邨青桃樓 (TY331) `B085DDE8E381E370` | 西九龍 |
| 4 | **249X** | 長青邨青桃樓 (TY332) `CA60760D2303E6D0` | 博康 (bound I) |

In the portal, pick **KMB/LWB bus** widgets, then route + stop by name (青富苑 / 青桃樓). Prefer catalogue search; IDs above are for verification.

### Page 3 (optional)

- Weather widget if available
- Extra **49M** for weekend glance

## Power

In 設定:

- Enable **daily awake window** e.g. **06:00–09:30**
- HK bus refresh is ~60s while awake
- Outside window: press Wake for on-demand update

## After Path B is stable

Path A Mac LaunchAgent should be stopped (already removed if install script was used earlier).

Re-enable Path A only after restoring stock firmware:

```bash
./scripts/install-refresh.sh
```
