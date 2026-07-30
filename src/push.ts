import { DISPLAY } from "./config.js";

const BASE = "https://cloud.zectrix.com/open/v1";

export type PushConfig = {
  apiKey: string;
  deviceId: string;
};

export async function pushImage(
  cfg: PushConfig,
  png: Buffer,
  pageId = DISPLAY.pageId,
): Promise<unknown> {
  const form = new FormData();
  form.append(
    "images",
    new Blob([new Uint8Array(png)], { type: "image/png" }),
    "frontdoor-bus.png",
  );
  form.append("dither", "true");
  form.append("pageId", pageId);

  const res = await fetch(
    `${BASE}/devices/${encodeURIComponent(cfg.deviceId)}/display/image`,
    {
      method: "POST",
      headers: { "X-API-Key": cfg.apiKey },
      body: form,
    },
  );

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Zectrix push failed ${res.status}: ${JSON.stringify(body)}`);
  }
  return body;
}

export async function pushText(
  cfg: PushConfig,
  text: string,
  pageId = DISPLAY.pageId,
): Promise<unknown> {
  const res = await fetch(
    `${BASE}/devices/${encodeURIComponent(cfg.deviceId)}/display/text`,
    {
      method: "POST",
      headers: {
        "X-API-Key": cfg.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text, fontSize: 16, pageId }),
    },
  );
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Zectrix text push failed ${res.status}: ${JSON.stringify(body)}`);
  }
  return body;
}

export async function listDevices(apiKey: string): Promise<unknown> {
  const res = await fetch(`${BASE}/devices`, {
    headers: { "X-API-Key": apiKey },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`List devices failed ${res.status}: ${JSON.stringify(body)}`);
  }
  return body;
}
