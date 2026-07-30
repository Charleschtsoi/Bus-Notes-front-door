/** Open-Meteo — no API key. Coords: Tsing Yi / Ching Fu Court area. */

const LAT = 22.348;
const LON = 114.107;

const WMO: Record<number, string> = {
  0: "晴",
  1: "大致晴",
  2: "少雲",
  3: "多雲",
  45: "霧",
  48: "霧",
  51: "微雨",
  53: "微雨",
  55: "毛毛雨",
  61: "雨",
  63: "中雨",
  65: "大雨",
  80: "驟雨",
  81: "驟雨",
  82: "強驟雨",
  95: "雷暴",
};

export async function fetchWeather(): Promise<{ tempC: number; text: string }> {
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${LAT}&longitude=${LON}` +
    `&current=temperature_2m,weather_code` +
    `&timezone=Asia%2FHong_Kong`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Weather HTTP ${res.status}`);
  const body = (await res.json()) as {
    current: { temperature_2m: number; weather_code: number };
  };

  const code = body.current.weather_code;
  return {
    tempC: Math.round(body.current.temperature_2m),
    text: WMO[code] ?? `天氣${code}`,
  };
}
