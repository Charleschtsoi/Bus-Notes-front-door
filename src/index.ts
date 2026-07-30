import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { ROUTES } from "./config.js";
import { snapshotRoutes } from "./kmb.js";
import { listDevices, pushImage } from "./push.js";
import { pickBest } from "./rank.js";
import { renderPng, renderTextFallback } from "./render.js";
import {
  resolveBoardMode,
  type BoardMode,
  type BoardModel,
} from "./types.js";
import { fetchWeatherBundle } from "./weather.js";

function nowHkt(): Date {
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

function forceModeFromArgs(): BoardMode | null {
  if (process.argv.includes("--force-evening")) return "weekday-evening";
  if (process.argv.includes("--force-weekend-evening")) return "weekend-evening";
  if (process.argv.includes("--force-bus")) return "weekday-bus";
  if (process.argv.includes("--force-weekend")) return "weekend-bus";
  return null;
}

async function buildBoard(): Promise<BoardModel> {
  const now = nowHkt();
  const mode = forceModeFromArgs() ?? resolveBoardMode(now);
  const daySet =
    mode.startsWith("weekend") ? ("weekend" as const) : ("weekday" as const);

  const weatherBundle = await fetchWeatherBundle();

  if (mode === "weekday-evening" || mode === "weekend-evening") {
    return {
      mode,
      now,
      daySet,
      weather: weatherBundle.current,
      evening: weatherBundle.evening,
      routes: [],
      pick: null,
    };
  }

  const watches = ROUTES.filter((r) => {
    if (mode === "weekend-bus") {
      return r.days === "weekend" || r.days === "everyday";
    }
    return r.days === "weekday" || r.days === "everyday";
  });

  const routes = await snapshotRoutes(watches, now);
  return {
    mode,
    now,
    daySet,
    weather: weatherBundle.current,
    evening: weatherBundle.evening,
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
  console.log(`mode=${model.mode}`);
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
