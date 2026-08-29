import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import assert from "node:assert/strict";
import { importSqliteFieldServiceCycles, listSqliteFieldServiceCycles, readSqliteFieldServiceStorageHealth } from "../lib/ops-field-service-store.mjs";

const root = await mkdtemp(join(tmpdir(), "dr-forest-field-service-"));
const dbPath = join(root, "field-service.sqlite");
const db = new DatabaseSync(dbPath);
db.exec(`
  PRAGMA foreign_keys=ON;
  CREATE TABLE clients(id TEXT PRIMARY KEY);
  CREATE TABLE living_assets(id TEXT PRIMARY KEY, client_id TEXT NOT NULL);
  CREATE TABLE work_orders(id TEXT PRIMARY KEY, wall_id TEXT NOT NULL);
  CREATE TABLE asset_modules(id TEXT PRIMARY KEY, asset_id TEXT NOT NULL, client_id TEXT NOT NULL);
  INSERT INTO clients VALUES ('client-a'),('client-b');
  INSERT INTO living_assets VALUES ('wall-a','client-a'),('wall-b','client-b');
  INSERT INTO work_orders VALUES ('wo-a-1','wall-a'),('wo-a-2','wall-a'),('wo-b-1','wall-b'),('wo-b-2','wall-b');
  INSERT INTO asset_modules VALUES ('module-a-1','wall-a','client-a'),('module-a-2','wall-a','client-a'),('module-b-1','wall-b','client-b'),('module-b-2','wall-b','client-b');
`);
db.close();

const cycle = (id, clientId, workOrderId, moduleId, daysAgo) => ({ cycleId: id, clientId, workOrderId, moduleId, technicianId: `tech-${clientId}`, serviceAt: new Date(Date.now() - daysAgo * 86_400_000).toISOString(), status: "completed", durationMinutes: 45, source: "airtable", proofRefs: [`evidence://${id}`], outcome: "Service completed" });
const result = await importSqliteFieldServiceCycles(dbPath, { actorId: "fm-lead", cycles: [cycle("cycle-a-1", "client-a", "wo-a-1", "module-a-1", 4), cycle("cycle-a-2", "client-a", "wo-a-2", "module-a-2", 3), cycle("cycle-b-1", "client-b", "wo-b-1", "module-b-1", 2), cycle("cycle-b-2", "client-b", "wo-b-2", "module-b-2", 1)] });
assert.equal(result.inserted, 4);
assert.equal(result.gate.status, "verified");
const duplicate = await importSqliteFieldServiceCycles(dbPath, { actorId: "fm-lead", cycles: [cycle("cycle-a-1", "client-a", "wo-a-1", "module-a-1", 1)] });
assert.equal(duplicate.updated, 1);
await assert.rejects(() => importSqliteFieldServiceCycles(dbPath, { actorId: "fm-lead", cycles: [cycle("cycle-a-3", "client-a", "wo-b-1", "module-a-1", 1)] }), /missing or mismatched/);
const listed = await listSqliteFieldServiceCycles(dbPath, { clientIds: ["client-a"] });
assert.equal(listed.length, 2);
const health = await readSqliteFieldServiceStorageHealth(dbPath);
assert.equal(health.counts.total, 4);
assert.equal(health.relationshipIntegrity.foreignKeyIssues, 0);
await rm(root, { recursive: true, force: true });
console.log(JSON.stringify({ ok: true, inserted: result.inserted, updated: duplicate.updated, gate: result.gate.status, health: health.counts }, null, 2));
