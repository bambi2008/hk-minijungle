import { mkdtemp, rm } from "node:fs/promises";
import { DatabaseSync } from "node:sqlite";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  buildEsgLedger,
  buildOperationalHealthReport,
  normalizeEsgObservation,
  operationalHealthMethodVersion
} from "../lib/ops-health-esg-policy.mjs";
import {
  createSqliteEsgObservation,
  ensureSqliteHealthEsgSchema,
  listSqliteEsgObservations,
  listSqliteEsgPeriodLedgers,
  listSqliteOperationalHealthSnapshots,
  readSqliteHealthEsgStorageHealth,
  saveSqliteEsgPeriodLedger,
  saveSqliteOperationalHealthSnapshot
} from "../lib/ops-health-esg-store.mjs";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const now = "2026-08-29T10:00:00.000Z";
const wall = { id: "WALL-001", clientId: "client-001", name: "Pilot living wall" };
const module = {
  id: "MOD-001",
  assetId: wall.id,
  clientId: wall.clientId,
  status: "active",
  latestReadings: [
    { id: "READ-T", status: "ok" },
    { id: "READ-RH", status: "ok" },
    { id: "READ-CO2", status: "watch" },
    { id: "READ-MC", status: "ok" }
  ]
};
const capture = {
  id: "CAP-001",
  clientId: wall.clientId,
  wallId: wall.id,
  capturedAt: "2026-08-28T09:00:00.000Z",
  items: [
    { id: "CAP-HEALTH", type: "health-check", value: 92 },
    { id: "CAP-PHOTO", type: "photo", value: "photo-ref" },
    { id: "CAP-WATER", type: "water", value: 3, unit: "L" },
    { id: "CAP-NUTRIENT", type: "nutrient", value: 40, unit: "ml" }
  ]
};

const noData = buildOperationalHealthReport({ walls: [wall], now });
assert(noData.assets[0].score === null, "A wall with only control evidence must not receive a health score");
assert(noData.assets[0].band === "no-data", "Insufficient evidence must be shown as no-data");

const healthReport = buildOperationalHealthReport({ walls: [wall], modules: [module], captures: [capture], now });
assert(healthReport.assets[0].score !== null, "Telemetry and service evidence should produce a health score");
assert(healthReport.assets[0].confidence === 1, "Complete four-factor evidence should have full confidence");
assert(healthReport.assets[0].evidenceRefs.includes("CAP-001"), "Health score must retain evidence references");

const observationInputs = [
  ["xponge", "Root-zone moisture checked; no visible root stress."],
  ["pest-disease", "No visible pest pressure in the inspected zone."],
  ["chemical-intervention", "No chemical intervention required during this visit."],
  ["staff-pulse", "FM contact reported a positive visual experience."],
  ["brand-touchpoint", "Reception team approved the current green presentation."]
].map(([category, note], index) => normalizeEsgObservation({
  id: `OBS-${index + 1}`,
  clientId: wall.clientId,
  wallId: wall.id,
  category,
  rating: 85,
  observedAt: capture.capturedAt,
  note,
  evidenceRef: capture.id,
  createdBy: "fm-lead"
}));
const ledger = buildEsgLedger({
  scopeKey: `client:${wall.clientId}`,
  clientId: wall.clientId,
  periodStart: "2026-08-01T00:00:00.000Z",
  periodEnd: "2026-08-31T23:59:59.999Z",
  walls: [{ ...wall, greenArea: 8, staffReach: 120, waterSaved: 20 }],
  modules: [module],
  captures: [capture],
  observations: observationInputs,
  healthReport
});
assert(ledger.status === "complete", "A ledger with all five observation categories should be complete");
assert(ledger.metrics.find((item) => item.key === "visual-health")?.value === 92, "Visual health must average numeric values only");
assert(ledger.metrics.find((item) => item.key === "water-saved-estimate")?.status === "estimated", "Legacy water saving must remain explicitly estimated");

const tempRoot = await mkdtemp(join(tmpdir(), "dr-forest-health-esg-"));
const dbPath = join(tempRoot, "runtime.sqlite");
try {
  const db = new DatabaseSync(dbPath);
  db.exec(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE clients (id TEXT PRIMARY KEY);
    CREATE TABLE living_assets (id TEXT PRIMARY KEY, client_id TEXT NOT NULL);
    CREATE TABLE asset_modules (id TEXT PRIMARY KEY, asset_id TEXT NOT NULL, client_id TEXT NOT NULL);
    CREATE TABLE work_orders (id TEXT PRIMARY KEY, wall_id TEXT NOT NULL);
    INSERT INTO clients VALUES ('client-001');
    INSERT INTO living_assets VALUES ('WALL-001', 'client-001');
    INSERT INTO asset_modules VALUES ('MOD-001', 'WALL-001', 'client-001');
    INSERT INTO work_orders VALUES ('WO-001', 'WALL-001');
  `);
  db.close();

  const schema = await ensureSqliteHealthEsgSchema(dbPath);
  assert(schema.relationshipIntegrity.foreignKeysEnabled, "SQLite ESG schema must enable foreign keys");
  const snapshotInput = { id: "OHS-001", wallId: wall.id, score: healthReport.assets[0].score, status: healthReport.assets[0].status, calculatedAt: now, inputs: { factors: healthReport.assets[0].factors }, methodVersion: operationalHealthMethodVersion };
  const firstSnapshot = await saveSqliteOperationalHealthSnapshot(dbPath, snapshotInput);
  const duplicateSnapshot = await saveSqliteOperationalHealthSnapshot(dbPath, snapshotInput);
  assert(!firstSnapshot.duplicate && duplicateSnapshot.duplicate, "Health snapshots must be idempotent by ID");
  const savedObservation = await createSqliteEsgObservation(dbPath, observationInputs[0]);
  assert(!savedObservation.duplicate, "A valid ESG observation must persist");
  const duplicateObservation = await createSqliteEsgObservation(dbPath, observationInputs[0]);
  assert(duplicateObservation.duplicate, "ESG observations must be idempotent by ID");
  const savedLedger = await saveSqliteEsgPeriodLedger(dbPath, { ...ledger, id: "ESG-001", generatedBy: "fm-lead", generatedAt: now });
  assert(savedLedger.id === "ESG-001", "ESG ledger must persist with its immutable record ID");
  assert((await listSqliteOperationalHealthSnapshots(dbPath, { wallIds: [wall.id] })).length === 1, "Health snapshot list must be scoped");
  assert((await listSqliteEsgObservations(dbPath, { clientId: wall.clientId })).length === 1, "Observation list must be scoped");
  assert((await listSqliteEsgPeriodLedgers(dbPath, { scopeKey: `client:${wall.clientId}` })).length === 1, "Ledger list must be scoped");
  const storage = await readSqliteHealthEsgStorageHealth(dbPath);
  assert(storage.counts.healthSnapshots === 1 && storage.counts.observations === 1 && storage.counts.ledgers === 1, "Storage health counts must reflect persisted records");
  console.log(JSON.stringify({ ok: true, score: healthReport.assets[0].score, confidence: healthReport.assets[0].confidence, ledgerStatus: ledger.status, storage: storage.counts }, null, 2));
} finally {
  await rm(tempRoot, { recursive: true, force: true });
}
