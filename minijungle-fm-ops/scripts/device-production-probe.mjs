import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { cameraContentType, postSignedDeviceJson } from "../lib/ops-device-client.mjs";

function option(name, fallback = "") { const index = process.argv.indexOf(name); return index >= 0 ? String(process.argv[index + 1] || "").trim() : fallback; }
function required(value, label) { if (!String(value || "").trim()) throw new Error(`${label} is required`); return String(value).trim(); }

export async function main() {
  if (!process.argv.includes("--allow-write")) throw new Error("This probe writes one real observation; repeat with --allow-write after reviewing the target and payload");
  const baseUrl = required(option("--url", process.env.DR_FOREST_DEVICE_PROBE_URL || process.env.DR_FOREST_PRODUCTION_BASE_URL), "--url or DR_FOREST_DEVICE_PROBE_URL");
  const deviceId = required(option("--device-id", process.env.DR_FOREST_DEVICE_ID), "--device-id or DR_FOREST_DEVICE_ID");
  const deviceKey = required(option("--device-key", process.env.DR_FOREST_DEVICE_KEY), "--device-key or DR_FOREST_DEVICE_KEY");
  const kind = option("--kind", process.env.DR_FOREST_DEVICE_PROBE_KIND || "reading").toLowerCase();
  if (kind === "reading") {
    const metric = required(option("--metric", process.env.DR_FOREST_DEVICE_METRIC), "--metric or DR_FOREST_DEVICE_METRIC");
    const moduleId = required(option("--module-id", process.env.DR_FOREST_DEVICE_MODULE_ID), "--module-id or DR_FOREST_DEVICE_MODULE_ID");
    const wallId = required(option("--wall-id", process.env.DR_FOREST_DEVICE_WALL_ID), "--wall-id or DR_FOREST_DEVICE_WALL_ID");
    const value = option("--value", process.env.DR_FOREST_DEVICE_VALUE);
    if (value === "") throw new Error("--value or DR_FOREST_DEVICE_VALUE is required");
    const result = await postSignedDeviceJson({ baseUrl, path: "/api/device-ingestion/readings", deviceId, deviceKey, payload: { idempotencyKey: `production-probe:${deviceId}:${Date.now()}`, moduleId, wallId, metric, value: Number.isFinite(Number(value)) ? Number(value) : value, unit: option("--unit", process.env.DR_FOREST_DEVICE_UNIT || ""), observedAt: new Date().toISOString(), source: "production-device-probe" } });
    if (!result.ok || ![200, 201].includes(result.status)) throw new Error(`Signed reading was rejected with HTTP ${result.status}: ${JSON.stringify(result.body)}`);
    return { ok: true, kind, status: result.status, accepted: result.body?.accepted || 0, duplicates: result.body?.duplicates || 0, request: result.request };
  }
  if (kind === "camera") {
    const filePath = resolve(required(option("--file", process.env.DR_FOREST_DEVICE_CAMERA_FILE), "--file or DR_FOREST_DEVICE_CAMERA_FILE"));
    const moduleId = required(option("--module-id", process.env.DR_FOREST_DEVICE_MODULE_ID), "--module-id or DR_FOREST_DEVICE_MODULE_ID");
    const wallId = required(option("--wall-id", process.env.DR_FOREST_DEVICE_WALL_ID), "--wall-id or DR_FOREST_DEVICE_WALL_ID");
    const bytes = await readFile(filePath);
    const contentType = option("--content-type", process.env.DR_FOREST_DEVICE_CAMERA_CONTENT_TYPE || cameraContentType(filePath));
    const captureId = `production-probe:${deviceId}:${Date.now()}`;
    const result = await postSignedDeviceJson({ baseUrl, path: "/api/device-ingestion/camera-captures", deviceId, deviceKey, payload: { id: captureId, idempotencyKey: captureId, moduleId, wallId, capturedAt: new Date().toISOString(), contentType, fileBase64: bytes.toString("base64"), metadata: { source: "production-device-probe", fileName: filePath.split(/[\\/]/).pop() } } });
    if (!result.ok || ![200, 201].includes(result.status)) throw new Error(`Signed camera capture was rejected with HTTP ${result.status}: ${JSON.stringify(result.body)}`);
    return { ok: true, kind, status: result.status, mediaStatus: result.body?.capture?.mediaStatus || null, request: result.request };
  }
  throw new Error("--kind must be reading or camera");
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main().then((result) => console.log(JSON.stringify(result, null, 2))).catch((error) => { console.error(error.stack || error.message); process.exitCode = 1; });
