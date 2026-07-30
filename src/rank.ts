import type { RouteSnapshot } from "./types.js";

/**
 * Pick the bus you can still catch with the shortest leave-in time.
 * Skip arrivals you'd already miss (leaveIn would be negative — we clamp
 * those out by requiring leaveIn !== null and arrival after walk).
 */
export function pickBest(routes: RouteSnapshot[]): RouteSnapshot | null {
  const catchable = routes.filter((r) => {
    if (r.leaveIn === null || r.arrivals.length === 0) return false;
    // Must still be able to walk there before the bus
    return r.arrivals[0].minutes >= r.stop.walkMin;
  });

  if (catchable.length === 0) return null;

  catchable.sort((a, b) => {
    const la = a.leaveIn ?? 999;
    const lb = b.leaveIn ?? 999;
    if (la !== lb) return la - lb;
    return (a.arrivals[0]?.minutes ?? 999) - (b.arrivals[0]?.minutes ?? 999);
  });

  return catchable[0];
}

export function formatLeave(minutes: number | null): string {
  if (minutes === null) return "—";
  if (minutes <= 0) return "NOW";
  return `${minutes}′`;
}

export function formatEtaList(r: RouteSnapshot, max = 2): string {
  if (r.arrivals.length === 0) return "—";
  return r.arrivals
    .slice(0, max)
    .map((a) => `${a.minutes}′`)
    .join(" · ");
}
