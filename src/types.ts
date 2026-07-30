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
 * 平日 06:00–19:00 → 平日巴士
 * 平日 19:01–05:59 → 平日晚間天氣
 * 週末 06:00–19:00 → 假日巴士（X42C / 42A / 249X / 49M）
 * 週末 19:01–05:59 → 假日晚間天氣
 */
export function resolveBoardMode(now: Date): BoardMode {
  const mins = now.getHours() * 60 + now.getMinutes();
  const dayPart =
    mins >= 6 * 60 && mins <= 19 * 60 ? "day" : "evening";

  if (isWeekend(now)) {
    return dayPart === "day" ? "weekend-bus" : "weekend-evening";
  }
  return dayPart === "day" ? "weekday-bus" : "weekday-evening";
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
