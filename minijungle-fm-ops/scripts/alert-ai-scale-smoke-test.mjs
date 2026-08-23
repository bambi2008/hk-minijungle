import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { mkdir, rm } from "node:fs/promises";
import { join } from "node:path";

const host = "127.0.0.1";
const projectRoot = process.cwd();
const runtimeDir = join(projectRoot, ".ops-data-alert-ai-test");
function assert(condition, message) { if (!condition) throw new Error(message); }
async function getFreePort() { return new Promise((resolve, reject) => { const probe = createServer(); probe.once("error", reject); probe.listen(0, host, () => { const address = probe.address(); const port = typeof address === "object" && address ? address.port : 0; probe.close(() => resolve(port)); }); }); }
async function waitForServer(baseUrl) { const deadline = Date.now() + 10000; let lastError = null; while (Date.now() < deadline) { try { const response = await fetch(`${baseUrl}api/health`); if (response.ok) return; lastError = new Error(`Server returned ${response.status}`); } catch (error) { lastError = error; } await new Promise((resolve) => setTimeout(resolve, 160)); } throw lastError || new Error("Server did not start"); }
async function request(baseUrl, path, options = {}) { const response = await fetch(`${baseUrl}${path.replace(/^\//, "")}`, options); const contentType = response.headers.get("content-type") || ""; const body = contentType.includes("application/json") ? await response.json() : Buffer.from(await response.arrayBuffer()); return { response, body }; }
function principalHeaders(principalId, headers = {}) { return { ...headers, "x-dr-forest-principal": principalId }; }
function jsonHeaders(principalId, extra = {}) { return principalId ? principalHeaders(principalId, { "Content-Type": "application/json", ...extra }) : { "Content-Type": "application/json", ...extra }; }
async function verify(baseUrl) {
  const master = await request(baseUrl, "/api/admin/master-data", { headers: principalHeaders("fm-lead") });
  assert(master.response.ok, "Master data endpoint failed");
  const target = master.body.modules[0];
  const clientModules = master.body.modules.filter((module) => module.clientId === target.clientId);
  assert(target?.assetId && target?.clientId && clientModules.length > 0, "Module seed is incomplete");
  const suffix = `SMOKE-${Date.now()}`;
  const rule = await request(baseUrl, "/api/admin/telemetry/alert-rules", { method: "POST", headers: jsonHeaders("fm-lead"), body: JSON.stringify({ id: `RULE-${suffix}`, clientId: target.clientId, wallId: target.assetId, moduleId: target.id, metric: "temperature", maxValue: 30, severity: "critical", name: "Smoke high temperature rule" }) });
  assert(rule.response.status === 201 && rule.body.rule.enabled, `Alert rule was not created: ${JSON.stringify(rule.body)}`);

  const gateway = await request(baseUrl, "/api/admin/devices", { method: "POST", headers: jsonHeaders("fm-lead"), body: JSON.stringify({ id: `DEVICE-${suffix}-GW`, wallId: target.assetId, moduleId: target.id, type: "gateway", label: "Alert scale smoke gateway", protocol: "simulator", status: "active" }) });
  assert(gateway.response.status === 201 && gateway.body.device.deviceKey, "Gateway was not registered");
  const gatewayKey = gateway.body.device.deviceKey;
  const reading = { id: `READ-${suffix}-ALERT-1`, idempotencyKey: `READ-${suffix}-ALERT-1`, moduleId: target.id, wallId: target.assetId, metric: "temperature", value: 35.5, unit: "C", observedAt: new Date().toISOString(), source: "alert-simulator" };
  const alertReading = await request(baseUrl, "/api/device-ingestion/readings", { method: "POST", headers: jsonHeaders(null, { "x-dr-forest-device-key": gatewayKey }), body: JSON.stringify(reading) });
  assert(alertReading.response.status === 201 && alertReading.body.alerts?.length === 1, `Out-of-range reading did not open an alert: ${JSON.stringify(alertReading.body)}`);
  const secondReading = { ...reading, id: `READ-${suffix}-ALERT-2`, idempotencyKey: `READ-${suffix}-ALERT-2`, value: 36.1, observedAt: new Date(Date.now() + 1000).toISOString() };
  const mergedReading = await request(baseUrl, "/api/device-ingestion/readings", { method: "POST", headers: jsonHeaders(null, { "x-dr-forest-device-key": gatewayKey }), body: JSON.stringify(secondReading) });
  assert(mergedReading.response.ok && mergedReading.body.alerts?.[0]?.alert?.occurrenceCount === 2, `Repeated alert was not merged: ${JSON.stringify(mergedReading.body)}`);
  const activeAlerts = await request(baseUrl, `/api/telemetry/alerts?moduleId=${encodeURIComponent(target.id)}&statuses=open,acknowledged`, { headers: principalHeaders("fm-lead") });
  assert(activeAlerts.response.ok && activeAlerts.body.alerts.length === 1, "Alert list did not return one active alert");
  const alertId = activeAlerts.body.alerts[0].id;
  const acknowledged = await request(baseUrl, `/api/telemetry/alerts/${encodeURIComponent(alertId)}`, { method: "PUT", headers: jsonHeaders("fm-lead"), body: JSON.stringify({ status: "acknowledged", resolutionNote: "Smoke acknowledgement" }) });
  assert(acknowledged.response.ok && acknowledged.body.alert.status === "acknowledged", "Alert acknowledgement failed");
  const resolved = await request(baseUrl, `/api/telemetry/alerts/${encodeURIComponent(alertId)}`, { method: "PUT", headers: jsonHeaders("fm-lead"), body: JSON.stringify({ status: "resolved", resolutionNote: "Smoke resolution" }) });
  assert(resolved.response.ok && resolved.body.alert.status === "resolved", "Alert resolution failed");

  const camera = await request(baseUrl, "/api/admin/devices", { method: "POST", headers: jsonHeaders("fm-lead"), body: JSON.stringify({ id: `DEVICE-${suffix}-CAM`, wallId: target.assetId, moduleId: target.id, type: "camera", label: "AI smoke camera", protocol: "camera-http", status: "active" }) });
  assert(camera.response.status === 201 && camera.body.device.deviceKey, "Camera was not registered");
  const capture = await request(baseUrl, "/api/device-ingestion/camera-captures", { method: "POST", headers: jsonHeaders(null, { "x-dr-forest-device-key": camera.body.device.deviceKey }), body: JSON.stringify({ id: `CAPTURE-${suffix}`, idempotencyKey: `CAPTURE-${suffix}`, wallId: target.assetId, moduleId: target.id, capturedAt: new Date().toISOString(), contentType: "image/png", fileBase64: "iVBORw0KGgo=", metadata: { source: "ai-smoke" } }) });
  assert(capture.response.status === 201 && capture.body.capture.id, "Camera capture was not accepted");
  const queued = await request(baseUrl, "/api/ai/visual-diagnoses", { method: "POST", headers: jsonHeaders("fm-lead"), body: JSON.stringify({ captureId: capture.body.capture.id, provider: "pending-adapter", model: "not-connected", request: { task: "plant-health-review", output: ["condition", "severity", "recommendedAction"], evidenceOnly: true } }) });
  assert(queued.response.status === 201 && queued.body.diagnosis.status === "queued", `AI diagnosis was not queued: ${JSON.stringify(queued.body)}`);
  const completed = await request(baseUrl, `/api/ai/visual-diagnoses/${encodeURIComponent(queued.body.diagnosis.id)}`, { method: "PUT", headers: jsonHeaders("fm-lead"), body: JSON.stringify({ status: "completed", provider: "smoke-provider", model: "smoke-model", confidence: 0.91, result: { condition: "review_required", severity: "watch", recommendedAction: "Human horticulture review", evidenceBasis: "Camera capture only; no medical or automatic treatment claim." } }) });
  assert(completed.response.ok && completed.body.diagnosis.status === "completed" && completed.body.diagnosis.confidence === 0.91, "AI diagnosis result callback failed");

  const batchStart = Date.now();
  let accepted = 0;
  for (let offset = 0; offset < 1000; offset += 100) {
    const readings = Array.from({ length: 100 }, (_, index) => { const sequence = offset + index; const module = clientModules[sequence % clientModules.length]; return { id: `READ-${suffix}-LOAD-${sequence}`, idempotencyKey: `READ-${suffix}-LOAD-${sequence}`, moduleId: module.id, wallId: module.assetId, metric: "temperature", value: 22 + (sequence % 4) * 0.4, unit: "C", observedAt: new Date(Date.now() + sequence + 2000).toISOString(), source: "scale-simulator" }; });
    const result = await request(baseUrl, "/api/device-ingestion/readings", { method: "POST", headers: jsonHeaders(null, { "x-dr-forest-device-key": gatewayKey }), body: JSON.stringify({ readings }) });
    assert(result.response.status === 201 && result.body.accepted === 100, `Telemetry batch ${offset} was not fully accepted`);
    accepted += result.body.accepted;
  }
  const elapsedMs = Date.now() - batchStart;
  const storage = await request(baseUrl, "/api/storage", { headers: principalHeaders("fm-lead") });
  assert(storage.response.ok && storage.body.telemetry.counts.sensorReadingHistory >= 1002, "Telemetry history did not retain 1,000 batch readings plus alert readings");
  const diagnoses = await request(baseUrl, "/api/ai/visual-diagnoses?statuses=completed", { headers: principalHeaders("fm-lead") });
  assert(diagnoses.response.ok && diagnoses.body.diagnoses.some((item) => item.id === queued.body.diagnosis.id), "Completed AI diagnosis was not queryable");
  console.log(JSON.stringify({ accepted, elapsedMs, historyRows: storage.body.telemetry.counts.sensorReadingHistory, alertRows: storage.body.alerts.counts.alerts, diagnosisRows: storage.body.aiVision.counts.diagnoses }));
}

async function main() {
  await rm(runtimeDir, { recursive: true, force: true });
  await mkdir(runtimeDir, { recursive: true });
  const port = await getFreePort();
  const baseUrl = `http://${host}:${port}/`;
  const output = [];
  const server = spawn(process.execPath, ["server.mjs", "--port", String(port)], { cwd: projectRoot, env: { ...process.env, DR_FOREST_RUNTIME_DIR: runtimeDir, DR_FOREST_OPERATOR_EMAIL: "ops@example.test", DR_FOREST_OPERATOR_PASSWORD: "pilot-password-123" }, stdio: ["ignore", "pipe", "pipe"] });
  server.stdout.on("data", (chunk) => output.push(chunk.toString()));
  server.stderr.on("data", (chunk) => output.push(chunk.toString()));
  try { await waitForServer(baseUrl); await verify(baseUrl); console.log(`Alert, AI and scale smoke test passed at ${baseUrl}`); } catch (error) { if (output.length) console.error(output.join("")); throw error; } finally { server.kill(); await rm(runtimeDir, { recursive: true, force: true }); }
}
main().catch((error) => { console.error(error.stack || error.message); process.exit(1); });
