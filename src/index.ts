import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { ROUTES } from "./config.js";
import { snapshotRoutes } from "./kmb.js";
import { listDevices, pushImage } from "./push.js";
import { pickBest } from "./rank.js";
import { renderPng, renderTextFallback } from "./render.js";
import { activeDaySet, routeActiveToday, type BoardModel } from "./types.js";
import { fetchWeather } from "./weather.js";

function nowHkt(): Date {
  // Node typically uses system TZ; force HKT wall-clock via formatter.
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Hong_Kong",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const g = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return new Date(
    `${g("year")}-${g("month")}-${g("day")}T${g("hour")}:${g("minute")}:${g("second")}+08:00`,
  );
}

async function buildBoard(): Promise<BoardModel> {
  const now = nowHkt();
  const daySet = activeDaySet(now);
  const watches = ROUTES.filter((r) => routeActiveToday(r, now));
  const [routes, weather] = await Promise.all([
    snapshotRoutes(watches, now),
    fetchWeather(),
  ]);
  return {
    now,
    daySet,
    weather,
    routes,
    pick: pickBest(routes),
  };
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const listOnly = process.argv.includes("--list-devices");

  if (listOnly) {
    const apiKey = process.env.ZECTRIX_API_KEY;
    if (!apiKey) throw new Error("Set ZECTRIX_API_KEY in .env");
    console.log(JSON.stringify(await listDevices(apiKey), null, 2));
    return;
  }

  const model = await buildBoard();
  console.log(renderTextFallback(model));

  const outDir = path.resolve("output");
  await mkdir(outDir, { recursive: true });
  const png = await renderPng(model);
  const outFile = path.join(outDir, "frontdoor-bus.png");
  await writeFile(outFile, png);
  console.log(`Wrote ${outFile}`);

  if (dryRun) {
    console.log("Dry run — skipped Zectrix push.");
    return;
  }

  const apiKey = process.env.ZECTRIX_API_KEY;
  const deviceId = process.env.ZECTRIX_DEVICE_ID;
  if (!apiKey || !deviceId) {
    console.log(
      "Missing ZECTRIX_API_KEY / ZECTRIX_DEVICE_ID — preview only. Copy .env.example → .env",
    );
    return;
  }

  const result = await pushImage({ apiKey, deviceId }, png);
  console.log("Pushed to Note 4:", result);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
