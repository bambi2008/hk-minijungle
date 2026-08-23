import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { mkdir, rm } from "node:fs/promises";
import { join } from "node:path";

const host = "127.0.0.1";
const projectRoot = process.cwd();
const runtimeDir = join(projectRoot, ".ops-data-device-test");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function getFreePort() {
  return new Promise((resolve, reject) => {
    const probe = createServer();
    probe.once("error", reject);
    probe.listen(0, host, () => {
      const address = probe.address();
      const port = typeof address === "object" && address ? address.port : 0;
      probe.close(() => resolve(port));
    });
  });
}

async function waitForServer(baseUrl) {
  const deadline = Date.now() + 10000;
  let lastError = null;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${baseUrl}api/health`);
      if (response.ok) return;
      lastError = new Error(`Server returned ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 160));
  }
  throw lastError || new Error("Server did not start");
}

async function request(baseUrl, path, options = {}) {
  const response = await fetch(`${baseUrl}${path.replace(/^\//, "")}`, options);
  let body = null;
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) body = await response.json();
  else body = Buffer.from(await response.arrayBuffer());
  return { response, body };
}

function principalHeaders(principalId, headers = {}) {
  return { ...headers, "x-dr-forest-principal": principalId };
}

function jsonHeaders(principalId, extra = {}) {
  return principalHeaders(principalId, { "Content-Type": "application/json", ...extra });
}

async function verifyDevicePorts(baseUrl) {
  const master = await request(baseUrl, "/api/admin/master-data", { headers: principalHeaders("fm-lead") });
  assert(master.response.ok, "Master data endpoint failed");
  const module = master.body.modules?.[0];
  assert(module?.assetId && module?.clientId, "Seeded module mapping is missing an asset or client");
  const suffix = `SMOKE-${Date.now()}`;
  const tempId = `DEVICE-${suffix}-TEMP`;
  const cameraId = `DEVICE-${suffix}-CAM`;

  const registeredTemperature = await request(baseUrl, "/api/admin/devices", {
    method: "POST",
    headers: jsonHeaders("fm-lead"),
    body: JSON.stringify({ id: tempId, wallId: module.assetId, moduleId: module.id, type: "temperature", label: "Smoke temperature gateway", protocol: "simulator", status: "active" })
  });
  assert(registeredTemperature.response.status === 201, "Temperature device registration did not return 201");
  assert(registeredTemperature.body.device.deviceKey, "Temperature device key was not returned once at registration");
  const temperatureKey = registeredTemperature.body.device.deviceKey;

  const deviceList = await request(baseUrl, `/api/devices?moduleId=${encodeURIComponent(module.id)}`, { headers: principalHeaders("fm-lead") });
  assert(deviceList.response.ok, "Device registry list failed");
  assert(deviceList.body.devices.some((device) => device.id === tempId), "Registered temperature device was not listed");

  const observedAt = new Date().toISOString();
  const reading = { id: `READING-${suffix}`, idempotencyKey: `READING-${suffix}`, moduleId: module.id, wallId: module.assetId, metric: "temperature", value: 23.4, unit: "C", observedAt, source: "simulator" };
  const wrongContentType = await request(baseUrl, "/api/device-ingestion/readings", { method: "POST", headers: { "Content-Type": "text/plain", "x-dr-forest-device-key": temperatureKey }, body: JSON.stringify(reading) });
  assert(wrongContentType.response.status === 415 && wrongContentType.body.code === "JSON_CONTENT_TYPE_REQUIRED", "Device endpoint accepted a non-JSON content type");
  const oversizedBatch = { readings: Array.from({ length: 101 }, (_, index) => ({ ...reading, id: `${reading.id}-BATCH-${index}`, idempotencyKey: `${reading.idempotencyKey}-BATCH-${index}` })) };
  const oversizedBatchResponse = await request(baseUrl, "/api/device-ingestion/readings", { method: "POST", headers: jsonHeaders(null, { "x-dr-forest-device-key": temperatureKey }), body: JSON.stringify(oversizedBatch) });
  assert(oversizedBatchResponse.response.status === 400 && oversizedBatchResponse.body.code === "DEVICE_BATCH_INVALID", "Device endpoint did not reject an oversized reading batch");
  const accepted = await request(baseUrl, "/api/device-ingestion/readings", { method: "POST", headers: jsonHeaders(null, { "x-dr-forest-device-key": temperatureKey }), body: JSON.stringify(reading) });
  assert(accepted.response.status === 201 && accepted.body.accepted === 1, `Temperature reading was not accepted: ${JSON.stringify(accepted.body)}`);

  const duplicate = await request(baseUrl, "/api/device-ingestion/readings", { method: "POST", headers: jsonHeaders(null, { "x-dr-forest-device-key": temperatureKey }), body: JSON.stringify(reading) });
  assert(duplicate.response.status === 200 && duplicate.body.duplicates === 1, "Duplicate temperature reading was not idempotently ignored");

  const history = await request(baseUrl, `/api/telemetry/sensor-history/${encodeURIComponent(module.assetId)}?moduleId=${encodeURIComponent(module.id)}`, { headers: principalHeaders("fm-lead") });
  assert(history.response.ok && history.body.readings.some((item) => item.id === reading.id), "Module telemetry history did not retain device reading");

  const registeredCamera = await request(baseUrl, "/api/admin/devices", {
    method: "POST",
    headers: jsonHeaders("fm-lead"),
    body: JSON.stringify({ id: cameraId, wallId: module.assetId, moduleId: module.id, type: "camera", label: "Smoke module camera", protocol: "camera-http", status: "active" })
  });
  assert(registeredCamera.response.status === 201 && registeredCamera.body.device.deviceKey, "Camera device registration did not return a device key");
  const cameraKey = registeredCamera.body.device.deviceKey;

  const capture = await request(baseUrl, "/api/device-ingestion/camera-captures", {
    method: "POST",
    headers: jsonHeaders(null, { "x-dr-forest-device-key": cameraKey }),
    body: JSON.stringify({ id: `CAPTURE-${suffix}`, idempotencyKey: `CAPTURE-${suffix}`, wallId: module.assetId, moduleId: module.id, capturedAt: observedAt, contentType: "image/png", fileBase64: "iVBORw0KGgo=", metadata: { source: "simulator", purpose: "device-port-smoke" } })
  });
  assert(capture.response.status === 201 && capture.body.capture?.mediaStatus === "stored", `Camera file capture was not stored: ${JSON.stringify(capture.body)}`);

  const captures = await request(baseUrl, `/api/device-ingestion/camera-captures?moduleId=${encodeURIComponent(module.id)}`, { headers: principalHeaders("fm-lead") });
  assert(captures.response.ok && captures.body.captures.some((item) => item.id === capture.body.capture.id), "Camera capture was not listed");
  const file = await request(baseUrl, `/api/device-ingestion/camera-captures/${encodeURIComponent(capture.body.capture.id)}/file`, { headers: principalHeaders("fm-lead") });
  assert(file.response.ok && Buffer.isBuffer(file.body) && file.body.length === 8, "Camera file readback did not return stored bytes");

  const health = await request(baseUrl, "/api/device-health", { headers: principalHeaders("fm-lead") });
  assert(health.response.ok && health.body.health.counts.ingestionLogs >= 2 && health.body.health.counts.cameraCaptures >= 1, "Device health did not report ingestion and camera records");
  const unauthorized = await request(baseUrl, "/api/device-ingestion/readings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(reading) });
  assert(unauthorized.response.status === 401, "Missing device key did not return 401");
}

async function main() {
  await rm(runtimeDir, { recursive: true, force: true });
  await mkdir(runtimeDir, { recursive: true });
  const port = await getFreePort();
  const baseUrl = `http://${host}:${port}/`;
  const serverOutput = [];
  const server = spawn(process.execPath, ["server.mjs", "--port", String(port)], {
    cwd: projectRoot,
    env: { ...process.env, DR_FOREST_RUNTIME_DIR: runtimeDir, DR_FOREST_OPERATOR_EMAIL: "ops@example.test", DR_FOREST_OPERATOR_PASSWORD: "pilot-password-123" },
    stdio: ["ignore", "pipe", "pipe"]
  });
  server.stdout.on("data", (chunk) => serverOutput.push(chunk.toString()));
  server.stderr.on("data", (chunk) => serverOutput.push(chunk.toString()));
  try {
    await waitForServer(baseUrl);
    await verifyDevicePorts(baseUrl);
    console.log(`Device ingestion smoke test passed at ${baseUrl}`);
  } catch (error) {
    if (serverOutput.length) console.error(serverOutput.join(""));
    throw error;
  } finally {
    server.kill();
    await rm(runtimeDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
