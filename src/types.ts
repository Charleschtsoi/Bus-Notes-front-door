import type { DaySet, RouteWatch, StopChoice } from "./config.js";

export type Arrival = {
  eta: Date;
  destTc: string;
  remark: string;
  minutes: number;
};

export type RouteSnapshot = {
  watch: RouteWatch;
  stop: StopChoice;
  arrivals: Arrival[];
  leaveIn: number | null;
};

export type CurrentWeather = {
  tempC: number;
  text: string;
};

export type EveningForecast = {
  /** 明日（通勤日） */
  tomorrowLabel: string;
  tomorrowText: string;
  tempMin: number;
  tempMax: number;
  /** 明日早上 06–09 降雨機會 % */
  morningRainPct: number;
  tip: string;
};

export type BoardMode =
  | "weekday-bus"
  | "weekday-evening"
  | "weekend-bus"
  | "weekend-evening";

export type BoardModel = {
  mode: BoardMode;
  now: Date;
  daySet: DaySet;
  weather: CurrentWeather;
  evening: EveningForecast | null;
  routes: RouteSnapshot[];
  pick: RouteSnapshot | null;
};

export function isWeekend(now: Date): boolean {
  const day = now.getDay();
  return day === 0 || day === 6;
}

export function activeDaySet(now: Date): DaySet {
  return isWeekend(now) ? "weekend" : "weekday";
}

/**
 * Always show bus info (device only updates when Mac pushes).
 * 平日 → 平日巴士；週末 → 假日巴士。
 * Evening weather boards remain available via --force-evening flags only.
 */
export function resolveBoardMode(now: Date): BoardMode {
  return isWeekend(now) ? "weekend-bus" : "weekday-bus";
}

export function routeActiveToday(watch: RouteWatch, now: Date): boolean {
  if (watch.days === "everyday") return true;
  return watch.days === activeDaySet(now);
}

/** Display order on each bus board */
export const WEEKDAY_ROUTE_ORDER = ["49M", "A32", "948B", "948A", "948"];
export const WEEKEND_ROUTE_ORDER = ["X42C", "42A", "249X", "49M"];

export function orderedRoutes(
  routes: RouteSnapshot[],
  mode: BoardMode,
): RouteSnapshot[] {
  const order =
    mode === "weekend-bus" ? WEEKEND_ROUTE_ORDER : WEEKDAY_ROUTE_ORDER;
  return [...routes].sort((a, b) => {
    const ia = order.indexOf(a.watch.route);
    const ib = order.indexOf(b.watch.route);
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
  });
}
