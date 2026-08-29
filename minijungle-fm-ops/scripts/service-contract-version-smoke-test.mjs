import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import {
  actionSqliteServiceContract,
  createSqliteServiceContract
} from "../lib/ops-service-contract-store.mjs";
import {
  ensureSqliteServiceContractVersionSchema,
  linkSqliteServiceContractSla,
  listSqliteServiceContractChanges,
  listSqliteServiceContractVersions,
  readSqliteServiceContractPerformance,
  readSqliteServiceContractVersionHealth,
  requestSqliteServiceContractChange,
  reviewSqliteServiceContractChange,
  syncSqliteServiceContractVersion
} from "../lib/ops-service-contract-version-store.mjs";

const root = await mkdtemp(join(tmpdir(), "drf-service-contract-version-"));
const dbPath = join(root, "runtime.sqlite");
const db = new DatabaseSync(dbPath);
db.exec(`PRAGMA foreign_keys=ON;
  CREATE TABLE clients(id TEXT PRIMARY KEY);
  CREATE TABLE living_assets(id TEXT PRIMARY KEY,client_id TEXT NOT NULL REFERENCES clients(id));
  CREATE TABLE ops_remediation_tasks(id TEXT PRIMARY KEY,client_id TEXT NOT NULL REFERENCES clients(id),wall_id TEXT NOT NULL REFERENCES living_assets(id),status TEXT NOT NULL,review_status TEXT NOT NULL,resolved_at TEXT,due_at TEXT,created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
  INSERT INTO clients VALUES('CLIENT-1');
  INSERT INTO living_assets VALUES('WALL-1','CLIENT-1');
  INSERT INTO ops_remediation_tasks VALUES('TASK-ONTIME','CLIENT-1','WALL-1','resolved','approved','2026-08-29T08:00:00.000Z','2026-08-29T10:00:00.000Z','2026-08-29T06:00:00.000Z','2026-08-29T08:00:00.000Z');
  INSERT INTO ops_remediation_tasks VALUES('TASK-OVERDUE','CLIENT-1','WALL-1','open','not_submitted',NULL,'2026-08-28T10:00:00.000Z','2026-08-28T06:00:00.000Z','2026-08-28T06:00:00.000Z');`);
db.close();

const base = { id: "SVC-VERSION-001", clientId: "CLIENT-1", contractNumber: "DF-HK-VERSION-001", planName: "Managed Living Assets", startDate: "2026-01-01", endDate: "2099-12-31", currency: "HKD", monthlyFee: 8800, visitsPerMonth: 2, serviceWindowStart: "09:00", serviceWindowEnd: "18:00", evidenceRequired: true, wallIds: ["WALL-1"], note: "Signed contract entered for version test.", createdBy: "fm-lead", sla: { critical: { responseHours: 1, resolutionHours: 3 }, high: { responseHours: 2, resolutionHours: 10 }, normal: { responseHours: 6, resolutionHours: 20 }, low: { responseHours: 12, resolutionHours: 48 } } };

try {
  const created = await createSqliteServiceContract(dbPath, base);
  await ensureSqliteServiceContractVersionSchema(dbPath);
  const activated = await actionSqliteServiceContract(dbPath, base.id, { action: "activate", expectedUpdatedAt: created.contract.updatedAt, note: "Signed agreement is effective.", actor: "fm-lead" });
  await syncSqliteServiceContractVersion(dbPath, base.id);
  const versionsBefore = await listSqliteServiceContractVersions(dbPath, base.id);
  assert.equal(versionsBefore.length, 1);
  assert.equal(versionsBefore[0].status, "approved");

  const requested = await requestSqliteServiceContractChange(dbPath, { id: "CHG-VERSION-001", contractId: base.id, requestType: "amendment", requestedBy: "fm-lead", note: "Add a second monthly visit after client approval.", terms: { ...base, planName: "Managed Living Assets Plus", visitsPerMonth: 3, note: "Approved amendment terms." } });
  assert.equal(requested.change.status, "pending");
  assert.equal((await listSqliteServiceContractChanges(dbPath, { statuses: ["pending"] })).length, 1);
  const approved = await reviewSqliteServiceContractChange(dbPath, requested.change.id, { decision: "approve", reviewedBy: "fm-lead", reviewNote: "Commercial amendment approved.", expectedContractUpdatedAt: activated.contract.updatedAt });
  assert.equal(approved.version.versionNo, 2);
  assert.equal(approved.version.status, "approved");
  assert.equal(approved.contract.planName, "Managed Living Assets Plus");
  const versionsAfter = await listSqliteServiceContractVersions(dbPath, base.id);
  assert.deepEqual(versionsAfter.map((item) => [item.versionNo, item.status]), [[2, "approved"], [1, "retired"]]);

  const staleRequest = await requestSqliteServiceContractChange(dbPath, { id: "CHG-VERSION-STALE", contractId: base.id, requestType: "renewal", requestedBy: "fm-lead", note: "Stale renewal should not overwrite a newer contract.", terms: { ...base, planName: "Stale Plan", startDate: "2027-01-01", endDate: "2099-12-31" } });
  await assert.rejects(() => reviewSqliteServiceContractChange(dbPath, staleRequest.change.id, { decision: "approve", reviewedBy: "fm-lead", reviewNote: "Expected stale request rejection.", expectedContractUpdatedAt: activated.contract.updatedAt }), (error) => error.code === "SERVICE_CONTRACT_CHANGE_STALE");

  await linkSqliteServiceContractSla(dbPath, { taskId: "TASK-ONTIME", contractId: base.id, clientId: "CLIENT-1", wallId: "WALL-1", coverageState: "active", priority: "high", committedDueAt: "2026-08-29T10:00:00.000Z", responseHours: 2, resolutionHours: 10, linkedBy: "fm-lead" });
  await linkSqliteServiceContractSla(dbPath, { taskId: "TASK-OVERDUE", contractId: base.id, clientId: "CLIENT-1", wallId: "WALL-1", coverageState: "active", priority: "normal", committedDueAt: "2026-08-28T10:00:00.000Z", responseHours: 6, resolutionHours: 20, linkedBy: "fm-lead" });
  const performance = await readSqliteServiceContractPerformance(dbPath, { clientIds: ["CLIENT-1"], from: "2026-08-01T00:00:00.000Z", through: "2026-09-01T00:00:00.000Z", asOf: "2026-08-29T12:00:00.000Z" });
  assert.equal(performance.summary.totalTasks, 2);
  assert.equal(performance.summary.coveredTasks, 2);
  assert.equal(performance.summary.completedTasks, 1);
  assert.equal(performance.summary.onTimeTasks, 1);
  assert.equal(performance.summary.openOverdueTasks, 1);
  assert.equal(performance.summary.attainmentRate, 1);
  assert.equal(performance.unlinkedTasks, 0);
  const health = await readSqliteServiceContractVersionHealth(dbPath);
  assert.equal(health.counts.versions, 2);
  assert.equal(health.counts.changeRequests, 2);
  assert.equal(health.counts.slaLinks, 2);
  assert.equal(health.relationshipIntegrity.foreignKeyIssues, 0);
  console.log(JSON.stringify({ ok: true, contractId: base.id, approvedVersion: approved.version.versionNo, performance, health }, null, 2));
} finally {
  await rm(root, { recursive: true, force: true });
}
