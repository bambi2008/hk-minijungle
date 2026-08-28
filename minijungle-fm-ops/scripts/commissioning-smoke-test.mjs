import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import {
  listSqliteCommissioning,
  listSqliteCommissioningEvents,
  planSqliteCommissioning,
  readSqliteCommissioningByCode,
  readSqliteCommissioningHealth,
  transitionSqliteCommissioning
} from "../lib/ops-commissioning-store.mjs";

const root = await mkdtemp(join(tmpdir(), "drf-commissioning-"));
const dbPath = join(root, "runtime.sqlite");
const db = new DatabaseSync(dbPath);
db.exec(`
  PRAGMA foreign_keys=ON;
  CREATE TABLE clients(id TEXT PRIMARY KEY);
  CREATE TABLE living_assets(id TEXT PRIMARY KEY,client_id TEXT NOT NULL REFERENCES clients(id));
  CREATE TABLE asset_modules(id TEXT PRIMARY KEY,asset_id TEXT NOT NULL REFERENCES living_assets(id),client_id TEXT NOT NULL REFERENCES clients(id),label TEXT NOT NULL,zone TEXT,position INTEGER,status TEXT NOT NULL,monitoring_devices_json TEXT NOT NULL,camera_id TEXT,source TEXT NOT NULL,raw_json TEXT NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
  INSERT INTO clients(id) VALUES ('CLIENT-1');
  INSERT INTO living_assets(id,client_id) VALUES ('WALL-1','CLIENT-1');
  INSERT INTO asset_modules VALUES ('MOD-1','WALL-1','CLIENT-1','Module 1','Lobby',1,'active','{}',NULL,'test','{}','2026-09-03T00:00:00.000Z','2026-09-03T00:00:00.000Z');
  INSERT INTO asset_modules VALUES ('MOD-2','WALL-1','CLIENT-1','Module 2','Lobby',2,'active','{}',NULL,'test','{}','2026-09-03T00:00:00.000Z','2026-09-03T00:00:00.000Z');
`);
db.close();

try {
  const initial = await listSqliteCommissioning(dbPath);
  assert.equal(initial.summary.unplanned, 2);

  const planned = await planSqliteCommissioning(dbPath, { moduleId: "MOD-1", serialNumber: "DRF-SN-0001", publicCode: "DRF-HK-0001", hardwareRevision: "A1", installLocation: "Lobby bay 01", actorId: "fm-lead", actorName: "FM Lead", idempotencyKey: "plan-1" });
  assert.equal(planned.record.status, "planned");
  assert.equal(planned.duplicate, false);
  const replay = await planSqliteCommissioning(dbPath, { moduleId: "MOD-1", serialNumber: "CHANGED", publicCode: "CHANGED", actorId: "fm-lead", idempotencyKey: "plan-1" });
  assert.equal(replay.duplicate, true);
  assert.equal(replay.record.serialNumber, "DRF-SN-0001");

  await assert.rejects(() => planSqliteCommissioning(dbPath, { moduleId: "MOD-2", serialNumber: "DRF-SN-0001", publicCode: "DRF-HK-0002", actorId: "fm-lead", idempotencyKey: "plan-2" }), (error) => error.code === "COMMISSIONING_IDENTITY_CONFLICT");
  await assert.rejects(() => transitionSqliteCommissioning(dbPath, "MOD-1", { toStatus: "installed", expectedUpdatedAt: planned.record.updatedAt, checklist: {}, actorId: "field-tech", idempotencyKey: "install-bad" }), (error) => error.code === "COMMISSIONING_CHECKLIST_INCOMPLETE");

  const installChecklist = { identityLabelApplied: true, physicalMountChecked: true, waterCircuitChecked: true, electricalSafetyChecked: true };
  const installed = await transitionSqliteCommissioning(dbPath, "MOD-1", { toStatus: "installed", expectedUpdatedAt: planned.record.updatedAt, checklist: installChecklist, actorId: "field-tech", actorName: "Field Technician", idempotencyKey: "install-1" });
  assert.equal(installed.record.installedBy, "field-tech");
  const fullChecklist = { ...installChecklist, deviceMappingChecked: true, cameraViewChecked: true };
  await assert.rejects(() => transitionSqliteCommissioning(dbPath, "MOD-1", { toStatus: "verified", expectedUpdatedAt: installed.record.updatedAt, checklist: fullChecklist, actorId: "field-tech", idempotencyKey: "verify-self" }), (error) => error.code === "COMMISSIONING_REVIEW_SEPARATION_REQUIRED");
  await assert.rejects(() => transitionSqliteCommissioning(dbPath, "MOD-1", { toStatus: "verified", expectedUpdatedAt: planned.record.updatedAt, checklist: fullChecklist, actorId: "fm-lead", idempotencyKey: "verify-stale" }), (error) => error.code === "COMMISSIONING_VERSION_CONFLICT");

  const verified = await transitionSqliteCommissioning(dbPath, "MOD-1", { toStatus: "verified", expectedUpdatedAt: installed.record.updatedAt, checklist: fullChecklist, actorId: "fm-lead", actorName: "FM Lead", idempotencyKey: "verify-1", note: "Independent FM acceptance complete." });
  assert.equal(verified.record.status, "verified");
  assert.equal((await readSqliteCommissioningByCode(dbPath, "drf-hk-0001")).moduleId, "MOD-1");
  assert.equal((await listSqliteCommissioningEvents(dbPath, "MOD-1")).length, 3);

  const suspended = await transitionSqliteCommissioning(dbPath, "MOD-1", { toStatus: "suspended", expectedUpdatedAt: verified.record.updatedAt, actorId: "fm-lead", idempotencyKey: "suspend-1", note: "Temporary site refurbishment." });
  assert.equal(suspended.record.status, "suspended");
  const retired = await transitionSqliteCommissioning(dbPath, "MOD-1", { toStatus: "retired", expectedUpdatedAt: suspended.record.updatedAt, actorId: "fm-lead", idempotencyKey: "retire-1", note: "Asset removed from service." });
  assert.equal(retired.record.status, "retired");

  const health = await readSqliteCommissioningHealth(dbPath);
  assert.equal(health.counts.records, 1);
  assert.equal(health.counts.events, 5);
  assert.equal(health.relationshipIntegrity.foreignKeyIssues, 0);
  console.log(JSON.stringify({ ok: true, summary: (await listSqliteCommissioning(dbPath)).summary, health }, null, 2));
} finally {
  await rm(root, { recursive: true, force: true });
}
