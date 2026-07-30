/** Home: 青富苑. Prefer 青富苑 stop; fall back to 長青邨青桃樓. */

export type DaySet = "weekday" | "weekend" | "everyday";

export type StopChoice = {
  id: string;
  name: string;
  /** Minutes to walk from 青富苑 home to this stop */
  walkMin: number;
};

export type RouteWatch = {
  route: string;
  /** KMB bound letter used in ETA filtering: O or I */
  bound: "O" | "I";
  serviceType: string;
  /** Prefer first stop that returns a usable ETA */
  stops: StopChoice[];
  days: DaySet;
  destLabel: string;
};

export const HOME = "青富苑";

/** Walk buffers: door → stop */
export const WALK = {
  chingFu: 2,
  chingTao: 6,
} as const;

const CF = (id: string, name = "青富苑"): StopChoice => ({
  id,
  name,
  walkMin: WALK.chingFu,
});

const CT = (id: string, name = "長青邨青桃樓"): StopChoice => ({
  id,
  name,
  walkMin: WALK.chingTao,
});

/**
 * Boarding stops resolved from KMB route-stop data (2026-07).
 * Preference order inside `stops`: 青富苑 first, then 青桃樓.
 */
export const ROUTES: RouteWatch[] = [
  // —— Weekday ——
  {
    route: "49M",
    bound: "O",
    serviceType: "1",
    stops: [CF("333E9F98EEB84849"), CT("B085DDE8E381E370")],
    days: "everyday",
    destLabel: "青衣站",
  },
  {
    route: "A32",
    bound: "O",
    serviceType: "1",
    // No 青富苑 on airport-bound A32 → 青桃樓
    stops: [CT("3D42EBD6AC55A845")],
    days: "weekday",
    destLabel: "機場",
  },
  {
    route: "948B",
    bound: "O",
    serviceType: "1",
    stops: [CF("07F45B3B36DFDDAE"), CT("CA60760D2303E6D0")],
    days: "weekday",
    destLabel: "天后",
  },
  {
    route: "948A",
    bound: "O",
    serviceType: "1",
    // No 青富苑 → 青桃樓
    stops: [CT("CA60760D2303E6D0")],
    days: "weekday",
    destLabel: "天后",
  },
  {
    route: "948",
    bound: "O",
    serviceType: "1",
    // No 青富苑 → 青桃樓
    stops: [CT("CA60760D2303E6D0")],
    days: "weekday",
    destLabel: "天后",
  },

  // —— Weekend leave-home (display order: X42C → 42A → 249X → 49M) ——
  {
    route: "X42C",
    bound: "O",
    serviceType: "1",
    // ≥10:00 trips stop at 青富苑; earlier → 青桃樓 fallback
    stops: [CF("07F45B3B36DFDDAE"), CT("B085DDE8E381E370")],
    days: "weekend",
    destLabel: "油塘",
  },
  {
    route: "42A",
    bound: "O",
    serviceType: "1",
    stops: [CT("B085DDE8E381E370")],
    days: "weekend",
    destLabel: "西九龍",
  },
  {
    route: "249X",
    bound: "I",
    serviceType: "1",
    stops: [CT("CA60760D2303E6D0")],
    days: "weekend",
    destLabel: "博康",
  },
];

/** Local awake window when the Note 4 should be refreshed often (HKT) */
export const AWAKE = {
  morning: { start: "07:00", end: "09:30" },
  evening: { start: "17:30", end: "20:30" },
};

export const DISPLAY = {
  width: 400,
  height: 300,
  pageId: "1",
};
