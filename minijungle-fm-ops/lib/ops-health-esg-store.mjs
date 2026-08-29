import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import { DatabaseSync } from "node:sqlite";
import { dirname } from "node:path";
import { esgLedgerMigrationVersion, healthScoreSnapshotType, normalizeEsgObservation } from "./ops-health-esg-policy.mjs";

function error(message, code = "HEALTH_ESG_STORE_ERROR", status = 400) { const result = new Error(message); result.code = code; result.status = status; return result; }
function text(value) { return String(value ?? "").trim(); }
function required(value, field) { const result = text(value); if (!result) throw error(`${field} is required`); return result; }
function parse(value, fallback) { try { return JSON.parse(value || ""); } catch { return fallback; } }
function withDatabase(dbPath, callback) { return (async () => { await mkdir(dirname(dbPath), { recursive: true }); const db = new DatabaseSync(dbPath); try { initialize(db); return await callback(db); } finally { db.close(); } })(); }
function initialize(db) {
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY, applied_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS health_score_snapshots (
      id TEXT PRIMARY KEY, wall_id TEXT NOT NULL, score REAL, score_type TEXT NOT NULL,
      status TEXT NOT NULL, calculated_at TEXT NOT NULL, inputs_json TEXT NOT NULL, method_version TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_health_score_snapshots_wall_time ON health_score_snapshots(wall_id, calculated_at);
    CREATE TABLE IF NOT EXISTS ops_esg_observations (
      id TEXT PRIMARY KEY, client_id TEXT NOT NULL, wall_id TEXT, module_id TEXT, work_order_id TEXT,
      category TEXT NOT NULL, value REAL, unit TEXT, rating REAL, note TEXT NOT NULL, evidence_ref TEXT,
      observed_at TEXT NOT NULL, created_by TEXT NOT NULL, created_at TEXT NOT NULL,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON UPDATE CASCADE ON DELETE RESTRICT,
      FOREIGN KEY (wall_id) REFERENCES living_assets(id) ON UPDATE CASCADE ON DELETE RESTRICT,
      FOREIGN KEY (module_id) REFERENCES asset_modules(id) ON UPDATE CASCADE ON DELETE RESTRICT,
      FOREIGN KEY (work_order_id) REFERENCES work_orders(id) ON UPDATE CASCADE ON DELETE RESTRICT
    );
    CREATE INDEX IF NOT EXISTS idx_esg_observations_scope_time ON ops_esg_observations(client_id, observed_at DESC);
    CREATE INDEX IF NOT EXISTS idx_esg_observations_category ON ops_esg_observations(category, observed_at DESC);
    CREATE TABLE IF NOT EXISTS ops_esg_period_ledgers (
      id TEXT PRIMARY KEY, scope_key TEXT NOT NULL, client_id TEXT, period_start TEXT NOT NULL,
      period_end TEXT NOT NULL, status TEXT NOT NULL, payload_json TEXT NOT NULL, method_version TEXT NOT NULL,
      generated_by TEXT NOT NULL, generated_at TEXT NOT NULL, UNIQUE(scope_key, period_start, period_end)
    );
    CREATE INDEX IF NOT EXISTS idx_esg_ledgers_scope_period ON ops_esg_period_ledgers(scope_key, period_end DESC);
  `);
  db.prepare("INSERT OR IGNORE INTO schema_migrations(version, applied_at) VALUES(?, ?)").run(esgLedgerMigrationVersion, new Date().toISOString());
}
function observationFromRow(row) { return { id: row.id, clientId: row.client_id, wallId: row.wall_id || null, moduleId: row.module_id || null, workOrderId: row.work_order_id || null, category: row.category, value: row.value === null ? null : Number(row.value), unit: row.unit || null, rating: row.rating === null ? null : Number(row.rating), note: row.note, evidenceRef: row.evidence_ref || null, observedAt: row.observed_at, createdBy: row.created_by, createdAt: row.created_at }; }
function ledgerFromRow(row) { return { ...parse(row.payload_json, {}), id: row.id, scopeKey: row.scope_key, clientId: row.client_id || null, period: { periodStart: row.period_start, periodEnd: row.period_end }, status: row.status, methodVersion: row.method_version, generatedBy: row.generated_by, generatedAt: row.generated_at }; }
function snapshotFromRow(row) { return { id: row.id, wallId: row.wall_id, score: row.score === null ? null : Number(row.score), scoreType: row.score_type, status: row.status, calculatedAt: row.calculated_at, inputs: parse(row.inputs_json, {}), methodVersion: row.method_version }; }

export async function ensureSqliteHealthEsgSchema(dbPath) { return withDatabase(dbPath, (db) => ({ migrationVersion: esgLedgerMigrationVersion, tables: ["health_score_snapshots", "ops_esg_observations", "ops_esg_period_ledgers"], relationshipIntegrity: { foreignKeysEnabled: db.prepare("PRAGMA foreign_keys").get().foreign_keys === 1, foreignKeyIssues: db.prepare("PRAGMA foreign_key_check").all().length } })); }

export async function saveSqliteOperationalHealthSnapshot(dbPath, snapshot) {
  return withDatabase(dbPath, (db) => {
    const record = { id: required(snapshot?.id, "snapshot.id"), wallId: required(snapshot?.wallId, "snapshot.wallId"), score: snapshot?.score === null || snapshot?.score === undefined ? null : Number(snapshot.score), scoreType: healthScoreSnapshotType, status: required(snapshot?.status, "snapshot.status"), calculatedAt: required(snapshot?.calculatedAt, "snapshot.calculatedAt"), inputs: snapshot?.inputs && typeof snapshot.inputs === "object" ? snapshot.inputs : {}, methodVersion: required(snapshot?.methodVersion, "snapshot.methodVersion") };
    if (record.score !== null && (!Number.isFinite(record.score) || record.score < 0 || record.score > 100)) throw error("snapshot.score must be between 0 and 100");
    const existing = db.prepare("SELECT * FROM health_score_snapshots WHERE id=?").get(record.id);
    if (existing) return { duplicate: true, snapshot: snapshotFromRow(existing) };
    db.prepare("INSERT INTO health_score_snapshots(id,wall_id,score,score_type,status,calculated_at,inputs_json,method_version) VALUES(?,?,?,?,?,?,?,?)").run(record.id, record.wallId, record.score, record.scoreType, record.status, record.calculatedAt, JSON.stringify(record.inputs), record.methodVersion);
    return { duplicate: false, snapshot: record };
  });
}

export async function listSqliteOperationalHealthSnapshots(dbPath, { wallIds = null, limit = 200 } = {}) {
  return withDatabase(dbPath, (db) => {
    const values = [healthScoreSnapshotType]; const conditions = ["score_type=?"];
    if (Array.isArray(wallIds) && wallIds.length) { conditions.push(`wall_id IN (${wallIds.map(() => "?").join(",")})`); values.push(...wallIds.map(text)); }
    const rows = db.prepare(`SELECT * FROM health_score_snapshots WHERE ${conditions.join(" AND ")} ORDER BY calculated_at DESC,id DESC LIMIT ?`).all(...values, Math.min(Math.max(Number(limit) || 200, 1), 1000));
    return rows.map(snapshotFromRow);
  });
}

export async function createSqliteEsgObservation(dbPath, input) {
  return withDatabase(dbPath, (db) => {
    let normalized;
    try { normalized = normalizeEsgObservation(input); } catch (caught) { throw error(caught.message, "ESG_OBSERVATION_INVALID"); }
    normalized.id = normalized.id || `ESG-OBS-${Date.now()}-${randomUUID().slice(0, 8)}`;
    const existing = db.prepare("SELECT * FROM ops_esg_observations WHERE id=?").get(normalized.id);
    if (existing) return { duplicate: true, observation: observationFromRow(existing) };
    const createdAt = new Date().toISOString();
    try {
      db.prepare("INSERT INTO ops_esg_observations(id,client_id,wall_id,module_id,work_order_id,category,value,unit,rating,note,evidence_ref,observed_at,created_by,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)").run(normalized.id, normalized.clientId, normalized.wallId, normalized.moduleId, normalized.workOrderId, normalized.category, normalized.value, normalized.unit, normalized.rating, normalized.note, normalized.evidenceRef, normalized.observedAt, normalized.createdBy, createdAt);
    } catch (caught) { if (String(caught.message).includes("FOREIGN KEY")) throw error("observation references an unknown client, wall, module or work order", "ESG_OBSERVATION_SCOPE_INVALID"); throw caught; }
    return { duplicate: false, observation: { ...normalized, createdAt } };
  });
}

export async function listSqliteEsgObservations(dbPath, { clientIds = null, clientId = null, wallId = null, category = null, limit = 100 } = {}) {
  return withDatabase(dbPath, (db) => {
    const conditions = []; const values = [];
    if (Array.isArray(clientIds)) { if (!clientIds.length) return []; conditions.push(`client_id IN (${clientIds.map(() => "?").join(",")})`); values.push(...clientIds.map(text)); }
    if (clientId) { conditions.push("client_id=?"); values.push(text(clientId)); }
    if (wallId) { conditions.push("wall_id=?"); values.push(text(wallId)); }
    if (category) { conditions.push("category=?"); values.push(text(category)); }
    const rows = db.prepare(`SELECT * FROM ops_esg_observations${conditions.length ? ` WHERE ${conditions.join(" AND ")}` : ""} ORDER BY observed_at DESC,id DESC LIMIT ?`).all(...values, Math.min(Math.max(Number(limit) || 100, 1), 500));
    return rows.map(observationFromRow);
  });
}

export async function saveSqliteEsgPeriodLedger(dbPath, ledger) {
  return withDatabase(dbPath, (db) => {
    const id = required(ledger?.id, "ledger.id"); const scopeKey = required(ledger?.scopeKey, "ledger.scopeKey"); const periodStart = required(ledger?.period?.periodStart || ledger?.periodStart, "ledger.periodStart"); const periodEnd = required(ledger?.period?.periodEnd || ledger?.periodEnd, "ledger.periodEnd"); const generatedBy = required(ledger?.generatedBy, "ledger.generatedBy"); const generatedAt = required(ledger?.generatedAt, "ledger.generatedAt"); const status = required(ledger?.status || "partial", "ledger.status");
    db.prepare("INSERT INTO ops_esg_period_ledgers(id,scope_key,client_id,period_start,period_end,status,payload_json,method_version,generated_by,generated_at) VALUES(?,?,?,?,?,?,?,?,?,?) ON CONFLICT(scope_key,period_start,period_end) DO UPDATE SET id=excluded.id,client_id=excluded.client_id,status=excluded.status,payload_json=excluded.payload_json,method_version=excluded.method_version,generated_by=excluded.generated_by,generated_at=excluded.generated_at").run(id, scopeKey, ledger.clientId || null, periodStart, periodEnd, status, JSON.stringify(ledger), ledger.methodVersion || esgLedgerMigrationVersion, generatedBy, generatedAt);
    return ledgerFromRow(db.prepare("SELECT * FROM ops_esg_period_ledgers WHERE scope_key=? AND period_start=? AND period_end=?").get(scopeKey, periodStart, periodEnd));
  });
}

export async function listSqliteEsgPeriodLedgers(dbPath, { scopeKey = null, limit = 20 } = {}) { return withDatabase(dbPath, (db) => { const rows = scopeKey ? db.prepare("SELECT * FROM ops_esg_period_ledgers WHERE scope_key=? ORDER BY period_end DESC,generated_at DESC LIMIT ?").all(text(scopeKey), Math.min(Math.max(Number(limit) || 20, 1), 100)) : db.prepare("SELECT * FROM ops_esg_period_ledgers ORDER BY period_end DESC,generated_at DESC LIMIT ?").all(Math.min(Math.max(Number(limit) || 20, 1), 100)); return rows.map(ledgerFromRow); }); }

export async function readSqliteHealthEsgStorageHealth(dbPath) { return withDatabase(dbPath, (db) => { const count = (table) => Number(db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get().count); return { backend: "sqlite", migrationVersion: esgLedgerMigrationVersion, tables: ["health_score_snapshots", "ops_esg_observations", "ops_esg_period_ledgers"], counts: { healthSnapshots: count("health_score_snapshots"), observations: count("ops_esg_observations"), ledgers: count("ops_esg_period_ledgers") }, relationshipIntegrity: { foreignKeysEnabled: db.prepare("PRAGMA foreign_keys").get().foreign_keys === 1, foreignKeyIssues: db.prepare("PRAGMA foreign_key_check").all().length } }; }); }
