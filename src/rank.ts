import type { RouteSnapshot } from "./types.js";

export function pickBest(routes: RouteSnapshot[]): RouteSnapshot | null {
  const catchable = routes.filter((r) => {
    if (r.leaveIn === null || r.arrivals.length === 0) return false;
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

/** 候車站：固定三字 */
export function formatStop(name: string): string {
  if (name.includes("青富")) return "青富苑";
  if (name.includes("青桃")) return "青桃樓";
  return name.slice(0, 3);
}

export type EtaDisplay = {
  primary: string;
  secondary: string | null;
};

/** 到站：大字主班 + 細字下一班 */
export function formatEtaParts(r: RouteSnapshot): EtaDisplay {
  if (r.arrivals.length === 0) {
    return { primary: "—", secondary: null };
  }
  const primary = `${r.arrivals[0].minutes}`;
  const secondary =
    r.arrivals.length > 1 ? `${r.arrivals[1].minutes}` : null;
  return { primary, secondary };
}
