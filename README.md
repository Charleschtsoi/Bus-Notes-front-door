# Zectrix Frontdoor Bus (Path A)

Glanceable bus board for **Zectrix Note 4**, pushed via the official cloud API. Keeps stock AI firmware.

Home: **青富苑**. Stop preference: **青富苑 → 長青邨青桃樓**.

## What it shows

- Date, time, weather (Tsing Yi)
- Hero recommendation: `TAKE {route} · LEAVE IN {n}′` (walk time baked in)
- Other watched routes with ETA + leave-in
- Auto switches weekday / weekend sets

### Weekday
`49M` (青富苑), `A32` (青桃樓), `948B` (青富苑), `948A` / `948` (青桃樓)

### Weekend
`X42C` (青富苑→青桃樓 fallback), `49M`, `249X` (青桃樓), `42A` (青桃樓)

## Setup

1. Copy env file and fill credentials from [cloud.zectrix.com](https://cloud.zectrix.com) → 開放 API:

```bash
cp .env.example .env
```

2. List devices (MAC = deviceId):

```bash
npm run start -- --list-devices
```

3. Dry-run (fetch live ETA + write `output/frontdoor-bus.png`, no push):

```bash
npm run render-once
```

4. Push to Note 4:

```bash
npm start
```

## Cron (awake windows)

Suggested HKT refresh: every 1–2 min during `07:00–09:30` and `17:30–20:30`.

Example local cron:

```cron
*/2 7-9 * * * cd /path/to/Zectrix && /usr/bin/npm start >> /tmp/frontdoor-bus.log 2>&1
*/2 17-20 * * * cd /path/to/Zectrix && /usr/bin/npm start >> /tmp/frontdoor-bus.log 2>&1
```

## Schedule

Bus info stays on **all day** (Note 4 only changes when this Mac script pushes).

| Day | Routes |
|---|---|
| **Weekday** | 49M / A32 / 948B / 948A / 948 |
| **Weekend** | X42C / 42A / 249X / 49M |

Weekend notes:
- **X42C**: Sat/Sun roughly 09:15–17:45 outbound; trips before ~10:00 may skip 青富苑 → board falls back to 青桃樓
- **42A**: 青桃樓 → 西九龍高鐵
- **249X**: 青桃樓 → 博康（沙田）
- **49M**: 青富苑 → 青衣站

Optional weather board (manual only):

```bash
npm start -- --force-evening
npm start -- --force-weekend
```


| Stop | Minutes from 青富苑 |
|---|---|
| 青富苑 | 2 |
| 長青邨青桃樓 | 6 |

Edit `src/config.ts` if your walk differs.

## Notes

- Uses free KMB/LWB open data + Open-Meteo (no keys).
- Public holidays still use weekday/weekend by calendar day — easy follow-up.
- `948A` / `948B` are morning specials; outside hours the board shows `—`.
