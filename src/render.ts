import sharp from "sharp";
import { DISPLAY } from "./config.js";
import { formatEtaParts, formatStop } from "./rank.js";
import { orderedRoutes, type BoardModel, type RouteSnapshot } from "./types.js";

const FONT =
  "PingFang TC, PingFang HK, Noto Sans TC, Heiti TC, Microsoft JhengHei, sans-serif";

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
  return `${now.getMonth() + 1}月${now.getDate()}日 週${days[now.getDay()]}`;
}

function formatTime(now: Date): string {
  return `${pad2(now.getHours())}:${pad2(now.getMinutes())}`;
}

function listRoutes(model: BoardModel): RouteSnapshot[] {
  return orderedRoutes(model.routes, model.mode).slice(0, 5);
}

function buildBusSvg(model: BoardModel): string {
  const { width, height } = DISPLAY;
  const dayLabel = model.mode === "weekend-bus" ? "假日班次" : "平日班次";
  const routes = listRoutes(model);
  const rowH = 45;
  const startY = 74;

  const rows = routes
    .map((r, i) => {
      const y = startY + i * rowH;
      const stop = formatStop(r.stop.name);
      const eta = formatEtaParts(r);
      const hasService = eta.primary !== "—";
      const baseline = y + 22;
      const dividerY = y + 40;

      const etaBlock = hasService
        ? `
        <text x="195" y="${baseline}" font-size="30" font-family="${FONT}" font-weight="700" text-anchor="end">${esc(eta.primary)}</text>
        <text x="199" y="${baseline}" font-size="14" font-family="${FONT}">分</text>
        ${
          eta.secondary
            ? `<text x="232" y="${baseline}" font-size="14" font-family="${FONT}">/${esc(eta.secondary)}分</text>`
            : ""
        }
      `
        : `
        <text x="210" y="${baseline}" font-size="28" font-family="${FONT}" font-weight="700" text-anchor="end">—</text>
      `;

      return `
        <text x="14" y="${baseline}" font-size="28" font-family="${FONT}" font-weight="700">${esc(r.watch.route)}</text>
        ${etaBlock}
        <text x="386" y="${baseline}" font-size="15" font-family="${FONT}" text-anchor="end">${esc(stop)}</text>
        ${
          i < routes.length - 1
            ? `<line x1="14" y1="${dividerY}" x2="386" y2="${dividerY}" stroke="#000" stroke-width="0.7"/>`
            : ""
        }
      `;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="#fff"/>
  <text x="14" y="28" font-size="18" font-family="${FONT}" font-weight="700">青富苑</text>
  <text x="14" y="48" font-size="13" font-family="${FONT}">${esc(String(model.weather.tempC))}°C ${esc(model.weather.text)} · ${esc(dayLabel)}</text>
  <text x="386" y="26" font-size="22" font-family="${FONT}" font-weight="700" text-anchor="end">${esc(formatTime(model.now))}</text>
  <text x="386" y="48" font-size="14" font-family="${FONT}" text-anchor="end">${esc(formatHeaderDate(model.now))}</text>
  <line x1="12" y1="58" x2="388" y2="58" stroke="#000" stroke-width="2"/>
  ${rows}
</svg>`;
}

/**
 * Weekday evening (19:01–05:59): tomorrow commute prep for office workers.
 * Big temps + morning rain chance + one actionable tip.
 */
function buildEveningSvg(model: BoardModel): string {
  const { width, height } = DISPLAY;
  const e = model.evening;
  if (!e) return buildBusSvg(model);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="#fff"/>
  <text x="14" y="28" font-size="18" font-family="${FONT}" font-weight="700">青富苑</text>
  <text x="14" y="48" font-size="13" font-family="${FONT}">${esc(model.mode === "weekend-evening" ? "假日晚間" : "平日晚間")} · 今晚 ${esc(String(model.weather.tempC))}°C ${esc(model.weather.text)}</text>
  <text x="386" y="26" font-size="22" font-family="${FONT}" font-weight="700" text-anchor="end">${esc(formatTime(model.now))}</text>
  <text x="386" y="48" font-size="14" font-family="${FONT}" text-anchor="end">${esc(formatHeaderDate(model.now))}</text>
  <line x1="12" y1="58" x2="388" y2="58" stroke="#000" stroke-width="2"/>

  <text x="14" y="88" font-size="14" font-family="${FONT}">明日通勤</text>
  <text x="14" y="118" font-size="22" font-family="${FONT}" font-weight="700">${esc(e.tomorrowLabel)}</text>
  <text x="386" y="118" font-size="22" font-family="${FONT}" font-weight="700" text-anchor="end">${esc(e.tomorrowText)}</text>

  <text x="80" y="180" font-size="48" font-family="${FONT}" font-weight="700" text-anchor="middle">${esc(String(e.tempMin))}°</text>
  <text x="200" y="170" font-size="18" font-family="${FONT}" text-anchor="middle">—</text>
  <text x="320" y="180" font-size="48" font-family="${FONT}" font-weight="700" text-anchor="middle">${esc(String(e.tempMax))}°</text>
  <text x="80" y="208" font-size="14" font-family="${FONT}" text-anchor="middle">最低</text>
  <text x="320" y="208" font-size="14" font-family="${FONT}" text-anchor="middle">最高</text>

  <line x1="12" y1="224" x2="388" y2="224" stroke="#000" stroke-width="1"/>

  <text x="14" y="256" font-size="16" font-family="${FONT}">上午降雨（06–09）</text>
  <text x="386" y="256" font-size="28" font-family="${FONT}" font-weight="700" text-anchor="end">${esc(String(e.morningRainPct))}%</text>
  <text x="14" y="288" font-size="18" font-family="${FONT}" font-weight="700">建議 ${esc(e.tip)}</text>
</svg>`;
}

export function buildSvg(model: BoardModel): string {
  if (model.mode === "weekday-evening" || model.mode === "weekend-evening") {
    return buildEveningSvg(model);
  }
  return buildBusSvg(model);
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
  if (
    (model.mode === "weekday-evening" || model.mode === "weekend-evening") &&
    model.evening
  ) {
    const e = model.evening;
    const label = model.mode === "weekend-evening" ? "假日晚間" : "平日晚間";
    return [
      `青富苑 ${formatTime(model.now)} ${label}`,
      `今晚 ${model.weather.tempC}°C ${model.weather.text}`,
      `明日 ${e.tomorrowLabel} ${e.tomorrowText}`,
      `最低${e.tempMin}° 最高${e.tempMax}°`,
      `上午降雨 ${e.morningRainPct}%`,
      `建議 ${e.tip}`,
    ].join("\n");
  }

  const dayLabel = model.mode === "weekend-bus" ? "假日" : "平日";
  const lines = [
    `青富苑 ${formatTime(model.now)} ${model.weather.tempC}°C ${model.weather.text} · ${dayLabel}`,
    ...listRoutes(model).map((r) => {
      const stop = formatStop(r.stop.name);
      const eta = formatEtaParts(r);
      const etaText =
        eta.primary === "—"
          ? "—"
          : eta.secondary
            ? `${eta.primary}分 / 下一班${eta.secondary}分`
            : `${eta.primary}分`;
      return `${r.watch.route}  ${etaText}  ${stop}`;
    }),
  ];
  return lines.join("\n");
}
