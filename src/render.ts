import sharp from "sharp";
import { DISPLAY } from "./config.js";
import { formatEtaList, formatLeave } from "./rank.js";
import type { BoardModel } from "./types.js";

function esc(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

function formatHeaderDate(now: Date): string {
  const days = ["日", "一", "二", "三", "四", "五", "六"];
  return `${now.getMonth() + 1}/${now.getDate()} 週${days[now.getDay()]}`;
}

function formatTime(now: Date): string {
  return `${pad2(now.getHours())}:${pad2(now.getMinutes())}`;
}

/** 400×300 1-bit-friendly SVG for Note 4 */
export function buildSvg(model: BoardModel): string {
  const { width, height } = DISPLAY;
  const pick = model.pick;
  const dayLabel = model.daySet === "weekend" ? "假日" : "平日";

  const heroRoute = pick ? pick.watch.route : "—";
  const heroLeave = pick ? formatLeave(pick.leaveIn) : "—";
  const heroDest = pick ? pick.watch.destLabel : "暫無班次";
  const heroStop = pick ? pick.stop.name.replace("長青邨", "") : "";
  const heroEta = pick?.arrivals[0]
    ? `到站 ${pick.arrivals[0].minutes}′`
    : "";

  const others = model.routes.filter((r) => r !== pick).slice(0, 5);
  const rows = others
    .map((r, i) => {
      const y = 188 + i * 22;
      const etas = formatEtaList(r);
      const stopShort =
        r.stop.name.includes("青富") ? "富" : r.stop.name.includes("青桃") ? "桃" : "";
      return `
        <text x="16" y="${y}" font-size="16" font-family="sans-serif" font-weight="700">${esc(r.watch.route)}</text>
        <text x="78" y="${y}" font-size="13" font-family="sans-serif">${esc(r.watch.destLabel)}</text>
        <text x="168" y="${y}" font-size="13" font-family="sans-serif">${esc(etas)}</text>
        <text x="280" y="${y}" font-size="12" font-family="sans-serif">${esc(stopShort)} leave ${esc(formatLeave(r.leaveIn))}</text>
      `;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="#fff"/>
  <text x="14" y="24" font-size="15" font-family="sans-serif" font-weight="700">ZECTRIX · 青富苑</text>
  <text x="250" y="24" font-size="14" font-family="sans-serif">${esc(formatHeaderDate(model.now))} ${esc(formatTime(model.now))}</text>
  <text x="14" y="46" font-size="13" font-family="sans-serif">${esc(String(model.weather.tempC))}°C ${esc(model.weather.text)} · ${esc(dayLabel)}</text>
  <line x1="12" y1="56" x2="388" y2="56" stroke="#000" stroke-width="2"/>

  <text x="16" y="84" font-size="14" font-family="sans-serif" font-weight="700">TAKE</text>
  <text x="70" y="92" font-size="42" font-family="sans-serif" font-weight="700">${esc(heroRoute)}</text>
  <text x="250" y="78" font-size="13" font-family="sans-serif">LEAVE IN</text>
  <text x="250" y="118" font-size="40" font-family="sans-serif" font-weight="700">${esc(heroLeave)}</text>
  <text x="16" y="122" font-size="14" font-family="sans-serif">${esc(heroDest)} · ${esc(heroStop)} · ${esc(heroEta)}</text>

  <line x1="12" y1="136" x2="388" y2="136" stroke="#000" stroke-width="1"/>
  <text x="16" y="158" font-size="13" font-family="sans-serif" font-weight="700">其他班次</text>
  <text x="168" y="158" font-size="12" font-family="sans-serif">ETA</text>
  <text x="280" y="158" font-size="12" font-family="sans-serif">出門</text>
  ${rows}
</svg>`;
}

export async function renderPng(model: BoardModel): Promise<Buffer> {
  const svg = buildSvg(model);
  return sharp(Buffer.from(svg))
    .resize(DISPLAY.width, DISPLAY.height, { fit: "fill" })
    .greyscale()
    .png()
    .toBuffer();
}

export function renderTextFallback(model: BoardModel): string {
  const pick = model.pick;
  const lines = [
    `青富苑 ${formatTime(model.now)} ${model.weather.tempC}°C ${model.weather.text}`,
    pick
      ? `TAKE ${pick.watch.route}  leave ${formatLeave(pick.leaveIn)}  (${pick.stop.name})`
      : "暫無合適班次",
    ...model.routes.map(
      (r) =>
        `${r.watch.route} ${formatEtaList(r)}  leave ${formatLeave(r.leaveIn)}`,
    ),
  ];
  return lines.join("\n");
}
