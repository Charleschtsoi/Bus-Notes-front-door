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
  /** minutes until you must leave to catch the soonest bus */
  leaveIn: number | null;
};

export type BoardModel = {
  now: Date;
  daySet: DaySet;
  weather: { tempC: number; text: string };
  routes: RouteSnapshot[];
  pick: RouteSnapshot | null;
};

export function isWeekend(now: Date): boolean {
  const day = now.getDay(); // 0 Sun … 6 Sat
  return day === 0 || day === 6;
}

export function activeDaySet(now: Date): DaySet {
  return isWeekend(now) ? "weekend" : "weekday";
}

export function routeActiveToday(watch: RouteWatch, now: Date): boolean {
  if (watch.days === "everyday") return true;
  return watch.days === activeDaySet(now);
}
