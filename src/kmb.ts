import type { RouteWatch, StopChoice } from "./config.js";
import type { Arrival, RouteSnapshot } from "./types.js";

const KMB = "https://data.etabus.gov.hk/v1/transport/kmb";

type EtaRow = {
  route: string;
  dir: string;
  service_type: number | string;
  eta: string | null;
  dest_tc: string;
  rmk_tc: string;
};

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return (await res.json()) as T;
}

function minutesUntil(eta: Date, now: Date): number {
  return Math.max(0, Math.round((eta.getTime() - now.getTime()) / 60_000));
}

async function etasAtStop(
  watch: RouteWatch,
  stop: StopChoice,
  now: Date,
): Promise<Arrival[]> {
  const url = `${KMB}/eta/${stop.id}/${watch.route}/${watch.serviceType}`;
  const body = await fetchJson<{ data: EtaRow[] }>(url);
  const rows = (body.data ?? []).filter(
    (r) => r.dir === watch.bound && r.eta,
  );

  return rows
    .map((r) => {
      const eta = new Date(r.eta as string);
      return {
        eta,
        destTc: r.dest_tc,
        remark: r.rmk_tc ?? "",
        minutes: minutesUntil(eta, now),
      };
    })
    .filter((a) => a.eta.getTime() >= now.getTime() - 30_000)
    .sort((a, b) => a.eta.getTime() - b.eta.getTime())
    .slice(0, 3);
}

/**
 * Prefer 青富苑; if that stop has no usable ETA, try 青桃樓 (and so on).
 */
export async function snapshotRoute(
  watch: RouteWatch,
  now: Date,
): Promise<RouteSnapshot> {
  for (const stop of watch.stops) {
    const arrivals = await etasAtStop(watch, stop, now);
    if (arrivals.length === 0) continue;

    const soonest = arrivals[0];
    const leaveIn = Math.max(0, soonest.minutes - stop.walkMin);
    return { watch, stop, arrivals, leaveIn };
  }

  // Nothing running — still report preferred (first) stop for UI
  return {
    watch,
    stop: watch.stops[0],
    arrivals: [],
    leaveIn: null,
  };
}

export async function snapshotRoutes(
  watches: RouteWatch[],
  now: Date,
): Promise<RouteSnapshot[]> {
  const out: RouteSnapshot[] = [];
  for (const w of watches) {
    out.push(await snapshotRoute(w, now));
  }
  return out;
}
