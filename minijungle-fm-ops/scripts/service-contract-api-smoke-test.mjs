import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { mkdir, rm } from "node:fs/promises";
import { join } from "node:path";

const host = "127.0.0.1";
const root = process.cwd();
const runtimeDir = join(root, ".ops-data-contract-api-test");
const headers = (principal, extra = {}) => ({ "x-dr-forest-principal": principal, ...extra });
async function freePort() { return new Promise((resolve, reject) => { const server = createServer(); server.once("error", reject); server.listen(0, host, () => { const address = server.address(); server.close(() => resolve(address.port)); }); }); }
async function waitFor(url) { const deadline = Date.now() + 10000; let error; while (Date.now() < deadline) { try { if ((await fetch(url)).ok) return; } catch (caught) { error = caught; } await new Promise((resolve) => setTimeout(resolve, 150)); } throw error || new Error("service-contract API server did not start"); }
async function json(url, options = {}) { const response = await fetch(url, options); return { response, body: await response.json().catch(() => ({})) }; }
async function stop(server) { if (server.exitCode !== null) return; server.kill(); await new Promise((resolve) => { const timer = setTimeout(resolve, 4000); server.once("exit", () => { clearTimeout(timer); resolve(); }); }); }

await rm(runtimeDir, { recursive: true, force: true });
await mkdir(runtimeDir, { recursive: true });
const port = await freePort();
const baseUrl = `http://${host}:${port}`;
const server = spawn(process.execPath, ["server.mjs", "--port", String(port)], { cwd: root, env: { ...process.env, DR_FOREST_RUNTIME_DIR: runtimeDir }, stdio: "ignore" });

try {
  await waitFor(`${baseUrl}/api/health`);
  const policy = await json(`${baseUrl}/api/auth/policy`, { headers: headers("fm-lead") });
  assert(policy.body.roles["fm-lead"].permissions.includes("contracts.write"));
  assert(policy.body.roles["client-viewer"].permissions.includes("contracts.read"));
  assert(!policy.body.roles["field-tech"].permissions.includes("contracts.write"));

  const overview = await json(`${baseUrl}/api/service-contracts`, { headers: headers("fm-lead") });
  assert.equal(overview.response.status, 200);
  assert.equal(overview.body.contracts.length, 4);
  assert.equal(overview.body.walls.length, 4);
  const scoped = await json(`${baseUrl}/api/service-contracts`, { headers: headers("client-show-suite") });
  assert.equal(scoped.response.status, 200);
  assert(scoped.body.contracts.every((contract) => contract.clientId === "show-suite"));
  assert(scoped.body.walls.every((wall) => wall.clientId === "show-suite"));

  const auditor = await json(`${baseUrl}/api/service-contracts`, { headers: headers("esg-auditor") });
  assert.equal(auditor.response.status, 200);
  assert(auditor.body.contracts.every((contract) => !("monthlyFee" in contract) && !("currency" in contract)));
  const contractInput = { clientId: "show-suite", contractNumber: "DF-HK-API-001", planName: "Vision Care Plus", startDate: "2026-08-21", endDate: "2099-12-31", monthlyFee: 12800, visitsPerMonth: 2, serviceWindowStart: "08:30", serviceWindowEnd: "18:30", evidenceRequired: true, wallIds: ["MJ-HK-021"], note: "API smoke signed agreement.", sla: { critical: { responseHours: 1, resolutionHours: 3 }, high: { responseHours: 2, resolutionHours: 10 }, normal: { responseHours: 6, resolutionHours: 20 }, low: { responseHours: 12, resolutionHours: 48 } } };
  const created = await json(`${baseUrl}/api/service-contracts`, { method: "POST", headers: headers("fm-lead", { "Content-Type": "application/json", "Idempotency-Key": "contract-create-api-001" }), body: JSON.stringify(contractInput) });
  assert.equal(created.response.status, 201);
  assert.equal(created.body.contract.status, "draft");
  const replay = await json(`${baseUrl}/api/service-contracts`, { method: "POST", headers: headers("fm-lead", { "Content-Type": "application/json", "Idempotency-Key": "contract-create-api-001" }), body: JSON.stringify(contractInput) });
  assert([200, 201].includes(replay.response.status));
  assert.equal(replay.body.contract.id, created.body.contract.id);

  const denied = await json(`${baseUrl}/api/service-contracts`, { method: "POST", headers: headers("client-show-suite", { "Content-Type": "application/json", "Idempotency-Key": "contract-client-denied" }), body: JSON.stringify({ ...contractInput, contractNumber: "DF-HK-DENIED" }) });
  assert.equal(denied.response.status, 403);
  const otherWall = overview.body.walls.find((wall) => wall.clientId !== "show-suite");
  const crossScope = await json(`${baseUrl}/api/service-contracts`, { method: "POST", headers: headers("fm-lead", { "Content-Type": "application/json", "Idempotency-Key": "contract-cross-scope" }), body: JSON.stringify({ ...contractInput, contractNumber: "DF-HK-CROSS", wallIds: [otherWall.id] }) });
  assert.equal(crossScope.response.status, 409);

  const actionUrl = `${baseUrl}/api/service-contracts/${encodeURIComponent(created.body.contract.id)}/actions`;
  const activated = await json(actionUrl, { method: "POST", headers: headers("fm-lead", { "Content-Type": "application/json", "Idempotency-Key": "contract-activate-api-001" }), body: JSON.stringify({ action: "activate", expectedUpdatedAt: created.body.contract.updatedAt, note: "Signed contract activated." }) });
  assert.equal(activated.response.status, 200);
  assert.equal(activated.body.contract.effectiveState, "active");
  const stale = await json(actionUrl, { method: "POST", headers: headers("fm-lead", { "Content-Type": "application/json", "Idempotency-Key": "contract-stale-api-001" }), body: JSON.stringify({ action: "suspend", expectedUpdatedAt: created.body.contract.updatedAt, note: "Stale write should fail." }) });
  assert.equal(stale.response.status, 409);
  const events = await json(`${actionUrl.replace(/\/actions$/, "/events")}`, { headers: headers("client-show-suite") });
  assert.equal(events.response.status, 200);
  assert.equal(events.body.events.length, 2);
  const versions = await json(`${baseUrl}/api/service-contracts/${encodeURIComponent(created.body.contract.id)}/versions`, { headers: headers("client-show-suite") });
  assert.equal(versions.response.status, 200);
  assert.equal(versions.body.versions.length, 1);
  assert.equal(versions.body.versions[0].status, "approved");
  const changeTerms = { ...contractInput, planName: "Vision Care Plus · Extended", visitsPerMonth: 3, note: "Amendment terms for API smoke." };
  const change = await json(`${baseUrl}/api/service-contracts/${encodeURIComponent(created.body.contract.id)}/changes`, { method: "POST", headers: headers("fm-lead", { "Content-Type": "application/json", "Idempotency-Key": "contract-change-api-001" }), body: JSON.stringify({ requestType: "amendment", terms: changeTerms, note: "Add a third monthly visit after approval." }) });
  assert.equal(change.response.status, 201);
  assert.equal(change.body.change.status, "pending");
  const pendingChanges = await json(`${baseUrl}/api/service-contracts/changes?statuses=pending`, { headers: headers("fm-lead") });
  assert(pendingChanges.body.changes.some((item) => item.id === change.body.change.id));
  const changeDenied = await json(`${baseUrl}/api/service-contracts/${encodeURIComponent(created.body.contract.id)}/changes`, { method: "POST", headers: headers("client-show-suite", { "Content-Type": "application/json", "Idempotency-Key": "contract-change-client-denied" }), body: JSON.stringify({ requestType: "amendment", terms: changeTerms, note: "Client cannot alter terms." }) });
  assert.equal(changeDenied.response.status, 403);
  const reviewed = await json(`${baseUrl}/api/service-contract-changes/${encodeURIComponent(change.body.change.id)}/review`, { method: "POST", headers: headers("fm-lead", { "Content-Type": "application/json", "Idempotency-Key": "contract-change-review-api-001" }), body: JSON.stringify({ decision: "approve", expectedContractUpdatedAt: activated.body.contract.updatedAt, reviewNote: "Amendment approved for API smoke." }) });
  assert.equal(reviewed.response.status, 200);
  assert.equal(reviewed.body.version.versionNo, 2);
  assert.equal(reviewed.body.contract.planName, "Vision Care Plus · Extended");

  const quality = await json(`${baseUrl}/api/ops/quality`, { headers: headers("fm-lead") });
  const module = quality.body.moduleReadiness.find((item) => item.clientId === "show-suite");
  assert(module);
  const before = Date.now();
  const remediation = await json(`${baseUrl}/api/remediation/tasks`, { method: "POST", headers: headers("fm-lead", { "Content-Type": "application/json" }), body: JSON.stringify({ moduleId: module.moduleId, sourceKey: `contract-api-${Date.now()}`, reasons: ["contract SLA smoke"], priority: "high" }) });
  assert.equal(remediation.response.status, 201);
  const dueMs = new Date(remediation.body.task.dueAt).getTime() - before;
  assert(dueMs >= 9.9 * 3600000 && dueMs <= 10.1 * 3600000, `high-priority SLA due time was ${dueMs}ms`);
  assert.equal(remediation.body.event.payload.serviceContractId, created.body.contract.id);
  assert.equal(remediation.body.event.payload.contractCoverage, "active");
  const performance = await json(`${baseUrl}/api/service-contracts/performance`, { headers: headers("client-show-suite") });
  assert.equal(performance.response.status, 200);
  assert.equal(performance.body.summary.totalTasks, 1);
  assert.equal(performance.body.summary.coveredTasks, 1);
  assert.equal(performance.body.unlinkedTasks, 0);

  const route = await json(`${baseUrl}/api/mobile/route`, { headers: headers("field-tech-show-suite") });
  const stopRecord = route.body.route.find((item) => item.wallId === "MJ-HK-021");
  assert.equal(stopRecord.serviceContract.planName, "Vision Care Plus · Extended");
  assert.equal(stopRecord.serviceContract.serviceWindow, "08:30-18:30");
  const storage = await json(`${baseUrl}/api/storage`, { headers: headers("fm-lead") });
  assert.equal(storage.body.serviceContracts.counts.contracts, 5);
  assert.equal(storage.body.serviceContracts.relationshipIntegrity.foreignKeyIssues, 0);
  assert.equal(storage.body.serviceContracts.versioning.counts.versions, 6);
  assert.equal(storage.body.serviceContracts.versioning.counts.changeRequests, 1);
  assert.equal(storage.body.serviceContracts.versioning.counts.slaLinks, 1);
  console.log(JSON.stringify({ ok: true, contractId: created.body.contract.id, slaDueAt: remediation.body.task.dueAt, storage: storage.body.serviceContracts }, null, 2));
} finally {
  await stop(server);
  await rm(runtimeDir, { recursive: true, force: true });
}
