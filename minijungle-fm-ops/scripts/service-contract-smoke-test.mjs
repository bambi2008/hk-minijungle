import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { actionSqliteServiceContract, createSqliteServiceContract, evaluateSqliteServiceContract, listSqliteServiceContractEvents, listSqliteServiceContracts, readSqliteServiceContractHealth } from "../lib/ops-service-contract-store.mjs";

const root = await mkdtemp(join(tmpdir(), "drf-service-contract-"));
const dbPath = join(root, "runtime.sqlite");
const db = new DatabaseSync(dbPath);
db.exec(`PRAGMA foreign_keys=ON;
  CREATE TABLE clients(id TEXT PRIMARY KEY);
  CREATE TABLE living_assets(id TEXT PRIMARY KEY,client_id TEXT NOT NULL REFERENCES clients(id));
  INSERT INTO clients VALUES('CLIENT-1');
  INSERT INTO clients VALUES('CLIENT-2');
  INSERT INTO living_assets VALUES('WALL-1','CLIENT-1');
  INSERT INTO living_assets VALUES('WALL-2','CLIENT-2');`);
db.close();

const base = { id: "SVC-TEST-001", clientId: "CLIENT-1", contractNumber: "DF-HK-TEST-001", planName: "Managed Living Assets", startDate: "2026-01-01", endDate: "2099-12-31", currency: "HKD", monthlyFee: 8800, visitsPerMonth: 2, serviceWindowStart: "09:00", serviceWindowEnd: "18:00", evidenceRequired: true, wallIds: ["WALL-1"], note: "Signed contract entered for test.", createdBy: "fm-lead", sla: { critical: { responseHours: 1, resolutionHours: 3 }, high: { responseHours: 2, resolutionHours: 10 }, normal: { responseHours: 6, resolutionHours: 20 }, low: { responseHours: 12, resolutionHours: 48 } } };

try {
  await assert.rejects(() => createSqliteServiceContract(dbPath, { ...base, id: "SVC-CROSS", contractNumber: "DF-HK-CROSS", wallIds: ["WALL-2"] }), (error) => error.code === "SERVICE_CONTRACT_ASSET_SCOPE_MISMATCH");
  const created = await createSqliteServiceContract(dbPath, base);
  assert.equal(created.contract.status, "draft");
  assert.deepEqual(created.contract.wallIds, ["WALL-1"]);
  const duplicate = await createSqliteServiceContract(dbPath, { ...base, id: "SVC-OTHER" });
  assert.equal(duplicate.duplicate, true);
  assert.equal(duplicate.contract.id, base.id);

  const activated = await actionSqliteServiceContract(dbPath, base.id, { action: "activate", expectedUpdatedAt: created.contract.updatedAt, note: "Signed agreement is effective.", actor: "fm-lead" });
  assert.equal(activated.contract.effectiveState, "active");
  const overlap = await createSqliteServiceContract(dbPath, { ...base, id: "SVC-TEST-OVERLAP", contractNumber: "DF-HK-TEST-OVERLAP" });
  await assert.rejects(() => actionSqliteServiceContract(dbPath, overlap.contract.id, { action: "activate", expectedUpdatedAt: overlap.contract.updatedAt, note: "Overlapping coverage must fail.", actor: "fm-lead" }), (error) => error.code === "SERVICE_CONTRACT_COVERAGE_CONFLICT");
  await actionSqliteServiceContract(dbPath, overlap.contract.id, { action: "terminate", expectedUpdatedAt: overlap.contract.updatedAt, note: "Duplicate draft withdrawn.", actor: "fm-lead" });
  await assert.rejects(() => actionSqliteServiceContract(dbPath, base.id, { action: "suspend", expectedUpdatedAt: created.contract.updatedAt, note: "Stale update must fail.", actor: "fm-lead" }), (error) => error.code === "SERVICE_CONTRACT_STALE");

  const evaluated = await evaluateSqliteServiceContract(dbPath, { clientId: "CLIENT-1", wallId: "WALL-1", priority: "high", at: "2026-08-29T00:00:00.000Z" });
  assert.equal(evaluated.coverageState, "active");
  assert.equal(evaluated.sla.resolutionHours, 10);
  assert.equal(evaluated.sla.dueAt, "2026-08-29T10:00:00.000Z");
  const missing = await evaluateSqliteServiceContract(dbPath, { clientId: "CLIENT-2", wallId: "WALL-2", priority: "normal" });
  assert.equal(missing.coverageState, "missing");

  const suspended = await actionSqliteServiceContract(dbPath, base.id, { action: "suspend", expectedUpdatedAt: activated.contract.updatedAt, note: "Service paused by agreement.", actor: "fm-lead" });
  const resumed = await actionSqliteServiceContract(dbPath, base.id, { action: "resume", expectedUpdatedAt: suspended.contract.updatedAt, note: "Service resumed by agreement.", actor: "fm-lead" });
  const terminated = await actionSqliteServiceContract(dbPath, base.id, { action: "terminate", expectedUpdatedAt: resumed.contract.updatedAt, note: "Contract closed after handover.", actor: "fm-lead" });
  assert.equal(terminated.contract.status, "terminated");
  await assert.rejects(() => actionSqliteServiceContract(dbPath, base.id, { action: "resume", expectedUpdatedAt: terminated.contract.updatedAt, note: "Terminal records cannot resume.", actor: "fm-lead" }), (error) => error.code === "SERVICE_CONTRACT_TRANSITION_INVALID");

  assert.equal((await listSqliteServiceContracts(dbPath, { clientIds: ["CLIENT-1"] })).length, 2);
  assert.equal((await listSqliteServiceContracts(dbPath, { clientIds: ["CLIENT-2"] })).length, 0);
  assert.equal((await listSqliteServiceContractEvents(dbPath, base.id)).length, 5);
  const health = await readSqliteServiceContractHealth(dbPath);
  assert.equal(health.counts.contracts, 2);
  assert.equal(health.counts.assets, 2);
  assert.equal(health.relationshipIntegrity.foreignKeyIssues, 0);
  console.log(JSON.stringify({ ok: true, health }, null, 2));
} finally {
  await rm(root, { recursive: true, force: true });
}
