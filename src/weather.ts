/** Open-Meteo — Tsing Yi / Ching Fu Court. No API key. */

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

export type WeatherBundle = {
  current: { tempC: number; text: string };
  evening: {
    tomorrowLabel: string;
    tomorrowText: string;
    tempMin: number;
    tempMax: number;
    morningRainPct: number;
    tip: string;
  };
};

function wmoText(code: number): string {
  return WMO[code] ?? `天氣${code}`;
}

function dayLabel(dateIso: string): string {
  const d = new Date(`${dateIso}T12:00:00+08:00`);
  const days = ["日", "一", "二", "三", "四", "五", "六"];
  return `${d.getMonth() + 1}月${d.getDate()}日 週${days[d.getDay()]}`;
}

function commuteTip(rainPct: number, tempMin: number, tempMax: number): string {
  const tips: string[] = [];
  if (rainPct >= 60) tips.push("帶傘");
  else if (rainPct >= 35) tips.push("備傘");
  if (tempMin <= 16) tips.push("帶薄外套");
  else if (tempMax >= 33) tips.push("注意高溫");
  if (tips.length === 0) tips.push("輕便出門即可");
  return tips.join(" · ");
}

export async function fetchWeatherBundle(): Promise<WeatherBundle> {
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${LAT}&longitude=${LON}` +
    `&current=temperature_2m,weather_code` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max` +
    `&hourly=precipitation_probability` +
    `&timezone=Asia%2FHong_Kong` +
    `&forecast_days=2`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Weather HTTP ${res.status}`);

  const body = (await res.json()) as {
    current: { temperature_2m: number; weather_code: number };
    daily: {
      time: string[];
      weather_code: number[];
      temperature_2m_max: number[];
      temperature_2m_min: number[];
      precipitation_probability_max: number[];
    };
    hourly: {
      time: string[];
      precipitation_probability: (number | null)[];
    };
  };

  // Index 1 = tomorrow (Open-Meteo daily[0] is today in local TZ)
  const ti = body.daily.time.length > 1 ? 1 : 0;
  const tomorrowDate = body.daily.time[ti];

  const morningHours = [6, 7, 8, 9].map(
    (h) => `${tomorrowDate}T${String(h).padStart(2, "0")}:00`,
  );
  const morningRainValues = morningHours
    .map((t) => {
      const idx = body.hourly.time.indexOf(t);
      if (idx < 0) return null;
      return body.hourly.precipitation_probability[idx];
    })
    .filter((v): v is number => typeof v === "number");

  const morningRainPct =
    morningRainValues.length > 0
      ? Math.round(
          Math.max(...morningRainValues),
        )
      : Math.round(body.daily.precipitation_probability_max[ti] ?? 0);

  const tempMin = Math.round(body.daily.temperature_2m_min[ti]);
  const tempMax = Math.round(body.daily.temperature_2m_max[ti]);
  const code = body.daily.weather_code[ti];

  return {
    current: {
      tempC: Math.round(body.current.temperature_2m),
      text: wmoText(body.current.weather_code),
    },
    evening: {
      tomorrowLabel: dayLabel(tomorrowDate),
      tomorrowText: wmoText(code),
      tempMin,
      tempMax,
      morningRainPct,
      tip: commuteTip(morningRainPct, tempMin, tempMax),
    },
  };
}

/** Back-compat helper for bus header */
export async function fetchWeather(): Promise<{ tempC: number; text: string }> {
  const bundle = await fetchWeatherBundle();
  return bundle.current;
}
