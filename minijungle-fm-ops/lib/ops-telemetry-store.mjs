import { mkdir } from "node:fs/promises";
import { DatabaseSync } from "node:sqlite";
import { dirname } from "node:path";

export const telemetryMigrationVersion = "2026-08-17.telemetry-history-v2";
const allowedStatuses = new Set(["ok", "watch", "alert", "offline"]);
const allowedMetrics = new Set(["temperature", "humidity", "co2", "mc"]);

function error(message, code = "TELEMETRY_VALIDATION_ERROR", status = 400) { const result = new Error(message); result.code = code; result.status = status; return result; }
function required(value, field) { const text = String(value || "").trim(); if (!text) throw error(`${field} is required`); return text; }
function numberValue(value, field) { const result = Number(value); if (!Number.isFinite(result)) throw error(`${field} must be a finite number`); return result; }
function iso(value, field) { const date = new Date(value || ""); if (Number.isNaN(date.getTime())) throw error(`${field} must be an ISO date`); return date.toISOString(); }
function withDatabase(dbPath, callback) {
  return (async () => { await mkdir(dirname(dbPath), { recursive: true }); const db = new DatabaseSync(dbPath); try { initialize(db); return callback(db); } finally { db.close(); } })();
}
function initialize(db) {
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY, applied_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sensor_reading_history (
      id TEXT PRIMARY KEY, sensor_id TEXT NOT NULL, wall_id TEXT NOT NULL, module_id TEXT, metric TEXT,
      type TEXT NOT NULL,
      value REAL NOT NULL, unit TEXT, status TEXT NOT NULL, observed_at TEXT NOT NULL,
      source TEXT NOT NULL, metadata_json TEXT NOT NULL, created_at TEXT NOT NULL,
      UNIQUE(sensor_id, observed_at)
    );
    CREATE INDEX IF NOT EXISTS idx_sensor_history_wall_time ON sensor_reading_history(wall_id, observed_at);
    CREATE INDEX IF NOT EXISTS idx_sensor_history_sensor_time ON sensor_reading_history(sensor_id, observed_at);
    CREATE TABLE IF NOT EXISTS health_score_snapshots (
      id TEXT PRIMARY KEY, wall_id TEXT NOT NULL, score REAL, score_type TEXT NOT NULL,
      status TEXT NOT NULL, calculated_at TEXT NOT NULL, inputs_json TEXT NOT NULL, method_version TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_health_snapshots_wall_time ON health_score_snapshots(wall_id, calculated_at);
  `);
  const columns = new Set(db.prepare("PRAGMA table_info(sensor_reading_history)").all().map((row) => row.name));
  if (!columns.has("module_id")) db.exec("ALTER TABLE sensor_reading_history ADD COLUMN module_id TEXT");
  if (!columns.has("metric")) db.exec("ALTER TABLE sensor_reading_history ADD COLUMN metric TEXT");
  db.exec("CREATE INDEX IF NOT EXISTS idx_sensor_history_module_time ON sensor_reading_history(module_id, observed_at)");
  db.prepare("INSERT OR IGNORE INTO schema_migrations (version, applied_at) VALUES (?, ?)").run(telemetryMigrationVersion, new Date().toISOString());
}
function recordFromRow(row) { return { id: row.id, sensorId: row.sensor_id, wallId: row.wall_id, moduleId: row.module_id || null, metric: row.metric || row.type, type: row.type, value: row.value, unit: row.unit, status: row.status, observedAt: row.observed_at, source: row.source, metadata: JSON.parse(row.metadata_json || "{}"), createdAt: row.created_at }; }

export function appendSqliteSensorReading(dbPath, input) {
  return withDatabase(dbPath, (db) => {
    const metric = String(input?.metric || input?.type || "").trim().toLowerCase();
    const record = { id: required(input?.id, "reading.id"), sensorId: required(input?.sensorId, "reading.sensorId"), wallId: required(input?.wallId, "reading.wallId"), moduleId: input?.moduleId ? String(input.moduleId).trim() : null, metric, type: required(input?.type || metric, "reading.type"), value: numberValue(input?.value, "reading.value"), unit: input?.unit ? String(input.unit).trim() : null, status: String(input?.status || "ok").trim().toLowerCase(), observedAt: iso(input?.observedAt || new Date().toISOString(), "reading.observedAt"), source: String(input?.source || "fm-gateway").trim(), metadata: input?.metadata && typeof input.metadata === "object" ? input.metadata : {}, createdAt: new Date().toISOString() };
    if (record.moduleId && !allowedMetrics.has(record.metric)) throw error(`reading.metric must be one of ${Array.from(allowedMetrics).join(", ")}`);
    if (!allowedStatuses.has(record.status)) throw error(`reading.status must be one of ${Array.from(allowedStatuses).join(", ")}`);
    const existing = db.prepare("SELECT * FROM sensor_reading_history WHERE id = ? OR (sensor_id = ? AND observed_at = ?)").get(record.id, record.sensorId, record.observedAt);
    if (existing) return { duplicate: true, reading: recordFromRow(existing) };
    db.prepare(`INSERT INTO sensor_reading_history (id, sensor_id, wall_id, module_id, metric, type, value, unit, status, observed_at, source, metadata_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(record.id, record.sensorId, record.wallId, record.moduleId, record.metric, record.type, record.value, record.unit, record.status, record.observedAt, record.source, JSON.stringify(record.metadata), record.createdAt);
    return { duplicate: false, reading: record };
  });
}

export function appendSqliteSensorReadings(dbPath, inputs = []) {
  return withDatabase(dbPath, (db) => {
    const results = [];
    db.exec("BEGIN IMMEDIATE");
    try {
      for (let index = 0; index < inputs.length; index += 1) {
        const input = inputs[index];
        const metric = String(input?.metric || input?.type || "").trim().toLowerCase();
        const record = { id: required(input?.id, `readings[${index}].id`), sensorId: required(input?.sensorId, `readings[${index}].sensorId`), wallId: required(input?.wallId, `readings[${index}].wallId`), moduleId: input?.moduleId ? String(input.moduleId).trim() : null, metric, type: required(input?.type || metric, `readings[${index}].type`), value: numberValue(input?.value, `readings[${index}].value`), unit: input?.unit ? String(input.unit).trim() : null, status: String(input?.status || "ok").trim().toLowerCase(), observedAt: iso(input?.observedAt || new Date().toISOString(), `readings[${index}].observedAt`), source: String(input?.source || "fm-gateway").trim(), metadata: input?.metadata && typeof input.metadata === "object" ? input.metadata : {}, createdAt: new Date().toISOString() };
        if (record.moduleId && !allowedMetrics.has(record.metric)) throw error(`readings[${index}].metric must be one of ${Array.from(allowedMetrics).join(", ")}`);
        if (!allowedStatuses.has(record.status)) throw error(`readings[${index}].status must be one of ${Array.from(allowedStatuses).join(", ")}`);
        const existing = db.prepare("SELECT * FROM sensor_reading_history WHERE id = ? OR (sensor_id = ? AND observed_at = ?)").get(record.id, record.sensorId, record.observedAt);
        results.push(existing ? { duplicate: true, reading: recordFromRow(existing) } : { duplicate: false, reading: record });
        if (!existing) db.prepare(`INSERT INTO sensor_reading_history (id, sensor_id, wall_id, module_id, metric, type, value, unit, status, observed_at, source, metadata_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(record.id, record.sensorId, record.wallId, record.moduleId, record.metric, record.type, record.value, record.unit, record.status, record.observedAt, record.source, JSON.stringify(record.metadata), record.createdAt);
      }
      db.exec("COMMIT");
      return results;
    } catch (batchError) {
      db.exec("ROLLBACK");
      throw batchError;
    }
  });
}

export function listSqliteSensorHistory(dbPath, wallId, limit = 200, moduleId = null) {
  return withDatabase(dbPath, (db) => {
    const safeLimit = Math.min(Math.max(Number(limit) || 200, 1), 1000);
    const rows = moduleId
      ? db.prepare(`SELECT * FROM sensor_reading_history WHERE wall_id = ? AND module_id = ? ORDER BY observed_at DESC LIMIT ?`).all(required(wallId, "wallId"), required(moduleId, "moduleId"), safeLimit)
      : db.prepare(`SELECT * FROM sensor_reading_history WHERE wall_id = ? ORDER BY observed_at DESC LIMIT ?`).all(required(wallId, "wallId"), safeLimit);
    return rows.map(recordFromRow);
  });
}

export function listSqliteModuleLatestReadings(dbPath, moduleId) {
  return withDatabase(dbPath, (db) => db.prepare(`
    SELECT h.*
    FROM sensor_reading_history h
    JOIN (SELECT metric, MAX(observed_at) AS latest FROM sensor_reading_history WHERE module_id = ? GROUP BY metric) latest
      ON latest.metric = h.metric AND latest.latest = h.observed_at
    WHERE h.module_id = ?
    ORDER BY h.metric ASC
  `).all(required(moduleId, "moduleId"), moduleId).map(recordFromRow));
}

export function listSqliteLatestReadingsByModules(dbPath, moduleIds = []) {
  return withDatabase(dbPath, (db) => {
    const ids = moduleIds.map((value) => String(value || "").trim()).filter(Boolean);
    if (!ids.length) return [];
    const placeholders = ids.map(() => "?").join(", ");
    return db.prepare(`
      SELECT h.*
      FROM sensor_reading_history h
      JOIN (
        SELECT module_id, metric, MAX(observed_at) AS latest
        FROM sensor_reading_history
        WHERE module_id IN (${placeholders})
        GROUP BY module_id, metric
      ) latest ON latest.module_id = h.module_id AND latest.metric = h.metric AND latest.latest = h.observed_at
      ORDER BY h.module_id ASC, h.metric ASC
    `).all(...ids).map(recordFromRow);
  });
}

export function calculateSqliteSensorStability(dbPath, wallId) {
  return withDatabase(dbPath, (db) => {
    const rows = db.prepare(`SELECT h.* FROM sensor_reading_history h JOIN (SELECT sensor_id, MAX(observed_at) AS latest FROM sensor_reading_history WHERE wall_id = ? GROUP BY sensor_id) latest ON latest.sensor_id = h.sensor_id AND latest.latest = h.observed_at WHERE h.wall_id = ? ORDER BY h.sensor_id ASC`).all(wallId, wallId);
    const score = rows.length ? Math.round(rows.reduce((sum, row) => sum + (row.status === "ok" ? 100 : row.status === "watch" ? 50 : 0), 0) / rows.length) : null;
    const snapshot = { id: `HSS-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`, wallId, score, scoreType: "sensor-stability", status: rows.length ? "measured" : "no-data", calculatedAt: new Date().toISOString(), inputs: { sensorCount: rows.length, latestReadings: rows.map(recordFromRow), formula: "ok=100, watch=50, alert/offline=0; arithmetic mean" }, methodVersion: telemetryMigrationVersion };
    db.prepare(`INSERT INTO health_score_snapshots (id, wall_id, score, score_type, status, calculated_at, inputs_json, method_version) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(snapshot.id, snapshot.wallId, snapshot.score, snapshot.scoreType, snapshot.status, snapshot.calculatedAt, JSON.stringify(snapshot.inputs), snapshot.methodVersion);
    return snapshot;
  });
}

export function readSqliteTelemetryStorageHealth(dbPath) {
  return withDatabase(dbPath, (db) => {
    const count = (table) => db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get().count;
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('sensor_reading_history', 'health_score_snapshots') ORDER BY name").all().map((row) => row.name);
    const latest = db.prepare("SELECT id, wall_id, score, calculated_at FROM health_score_snapshots ORDER BY calculated_at DESC LIMIT 1").get();
    return { backend: "sqlite", migrationVersion: telemetryMigrationVersion, tables, counts: { sensorReadingHistory: count("sensor_reading_history"), healthScoreSnapshots: count("health_score_snapshots") }, latestHealthScore: latest ? { id: latest.id, wallId: latest.wall_id, score: latest.score, calculatedAt: latest.calculated_at } : null };
  });
}
