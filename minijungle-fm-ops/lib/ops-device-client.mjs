import { createHash, createHmac, randomUUID } from "node:crypto";

export const deviceClientVersion = "2026-08-29.device-client-v1";

function clean(value) { return String(value || "").trim(); }
function bodyBytes(body) {
  if (Buffer.isBuffer(body)) return body;
  if (body === undefined || body === null) return Buffer.alloc(0);
  return Buffer.from(typeof body === "string" ? body : JSON.stringify(body));
}

export function signDeviceRequest({ deviceId, deviceKey, method, path, body = "", timestamp = Date.now(), nonce = randomUUID() }) {
  const id = clean(deviceId);
  const key = clean(deviceKey);
  const verb = clean(method).toUpperCase();
  const requestPath = clean(path);
  if (!id || !key || !verb || !requestPath) throw new Error("deviceId, deviceKey, method and path are required");
  const timestampText = String(timestamp);
  const nonceText = clean(nonce);
  if (!/^\d+$/.test(timestampText) || !nonceText) throw new Error("timestamp must be milliseconds and nonce must be non-empty");
  const payloadHash = createHash("sha256").update(bodyBytes(body)).digest("hex");
  const canonical = `${timestampText}.${nonceText}.${verb}.${requestPath}.${payloadHash}`;
  const signature = createHmac("sha256", key).update(canonical).digest("hex");
  return {
    "x-dr-forest-device-key": key,
    "x-dr-forest-device-id": id,
    "x-dr-forest-timestamp": timestampText,
    "x-dr-forest-nonce": nonceText,
    "x-dr-forest-signature": signature
  };
}

export async function postSignedDeviceJson({ baseUrl, path, deviceId, deviceKey, payload, nonce = randomUUID(), timestamp = Date.now() }) {
  const body = JSON.stringify(payload || {});
  const headers = { "content-type": "application/json", accept: "application/json", ...signDeviceRequest({ deviceId, deviceKey, method: "POST", path, body, nonce, timestamp }) };
  const response = await fetch(`${String(baseUrl).replace(/\/$/, "")}${path}`, { method: "POST", headers, body, signal: AbortSignal.timeout(15_000) });
  let bodyResult = null;
  try { bodyResult = await response.json(); } catch { bodyResult = { error: await response.text() }; }
  return { status: response.status, ok: response.ok, body: bodyResult, request: { path, timestamp, nonce } };
}

export function cameraContentType(path) {
  const value = clean(path).toLowerCase();
  if (value.endsWith(".png")) return "image/png";
  if (value.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}
