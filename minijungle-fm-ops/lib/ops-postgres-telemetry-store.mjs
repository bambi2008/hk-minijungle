import { randomBytes } from "node:crypto";
import { getPostgresPool } from "./ops-postgres-store.mjs";

export const postgresTelemetryMigrationVersion = "2026-08-19.postgres-telemetry-v1";
const allowedStatuses = new Set(["ok", "watch", "alert", "offline"]);
const allowedMetrics = new Set(["temperature", "humidity", "co2", "mc"]);

function error(message, code = "TELEMETRY_VALIDATION_ERROR", status = 400) { const result = new Error(message); result.code = code; result.status = status; return result; }
function required(value, field) { const text = String(value || "").trim(); if (!text) throw error(`${field} is required`); return text; }
function numberValue(value, field) { const result = Number(value); if (!Number.isFinite(result)) throw error(`${field} must be a finite number`); return result; }
function iso(value, field) { const date = new Date(value || ""); if (Number.isNaN(date.getTime())) throw error(`${field} must be an ISO date`); return date.toISOString(); }
function parseJson(value, fallback) { if (value && typeof value === "object") return value; try { return JSON.parse(value || ""); } catch { return fallback; } }
function recordFromRow(row) { return { id: row.id, sensorId: row.sensor_id, wallId: row.wall_id, moduleId: row.module_id || null, metric: row.metric || row.type, type: row.type, value: Number(row.value), unit: row.unit, status: row.status, observedAt: row.observed_at, source: row.source, metadata: parseJson(row.metadata_json, {}), createdAt: row.created_at }; }
async function initialize(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL);
    CREATE TABLE IF NOT EXISTS sensor_reading_history (
      id TEXT PRIMARY KEY, sensor_id TEXT NOT NULL, wall_id TEXT NOT NULL, module_id TEXT, metric TEXT, type TEXT NOT NULL,
      value DOUBLE PRECISION NOT NULL, unit TEXT, status TEXT NOT NULL, observed_at TEXT NOT NULL, source TEXT NOT NULL,
      metadata_json TEXT NOT NULL, created_at TEXT NOT NULL, UNIQUE(sensor_id, observed_at)
    );
    CREATE INDEX IF NOT EXISTS idx_pg_sensor_history_wall_time ON sensor_reading_history(wall_id, observed_at);
    CREATE INDEX IF NOT EXISTS idx_pg_sensor_history_sensor_time ON sensor_reading_history(sensor_id, observed_at);
    CREATE INDEX IF NOT EXISTS idx_pg_sensor_history_module_time ON sensor_reading_history(module_id, observed_at);
    CREATE TABLE IF NOT EXISTS health_score_snapshots (
      id TEXT PRIMARY KEY, wall_id TEXT NOT NULL, score DOUBLE PRECISION, score_type TEXT NOT NULL, status TEXT NOT NULL,
      calculated_at TEXT NOT NULL, inputs_json TEXT NOT NULL, method_version TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_pg_health_snapshots_wall_time ON health_score_snapshots(wall_id, calculated_at);
    INSERT INTO schema_migrations (version, applied_at) VALUES ($1, NOW()) ON CONFLICT (version) DO NOTHING;
  `, [postgresTelemetryMigrationVersion]);
}
async function normalized(input, index = null) {
  const prefix = index === null ? "reading" : `readings[${index}]`;
  const metric = String(input?.metric || input?.type || "").trim().toLowerCase();
  const record = { id: required(input?.id, `${prefix}.id`), sensorId: required(input?.sensorId, `${prefix}.sensorId`), wallId: required(input?.wallId, `${prefix}.wallId`), moduleId: input?.moduleId ? String(input.moduleId).trim() : null, metric, type: required(input?.type || metric, `${prefix}.type`), value: numberValue(input?.value, `${prefix}.value`), unit: input?.unit ? String(input.unit).trim() : null, status: String(input?.status || "ok").trim().toLowerCase(), observedAt: iso(input?.observedAt || new Date().toISOString(), `${prefix}.observedAt`), source: String(input?.source || "fm-gateway").trim(), metadata: input?.metadata && typeof input.metadata === "object" ? input.metadata : {}, createdAt: new Date().toISOString() };
  if (record.moduleId && !allowedMetrics.has(record.metric)) throw error(`${prefix}.metric must be one of ${Array.from(allowedMetrics).join(", ")}`);
  if (!allowedStatuses.has(record.status)) throw error(`${prefix}.status must be one of ${Array.from(allowedStatuses).join(", ")}`);
  return record;
}
async function insertReading(client, input, index = null) {
  const record = await normalized(input, index);
  const existing = await client.query("SELECT * FROM sensor_reading_history WHERE id = $1 OR (sensor_id = $2 AND observed_at = $3) LIMIT 1", [record.id, record.sensorId, record.observedAt]);
  if (existing.rows[0]) return { duplicate: true, reading: recordFromRow(existing.rows[0]) };
  await client.query("INSERT INTO sensor_reading_history (id,sensor_id,wall_id,module_id,metric,type,value,unit,status,observed_at,source,metadata_json,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)", [record.id, record.sensorId, record.wallId, record.moduleId, record.metric, record.type, record.value, record.unit, record.status, record.observedAt, record.source, JSON.stringify(record.metadata), record.createdAt]);
  return { duplicate: false, reading: record };
}

export async function appendPostgresSensorReading(dbPath, input) { const pool = getPostgresPool(); await initialize(pool); const client = await pool.connect(); try { await client.query("BEGIN"); const result = await insertReading(client, input); await client.query("COMMIT"); return result; } catch (caught) { await client.query("ROLLBACK"); throw caught; } finally { client.release(); } }
export async function appendPostgresSensorReadings(dbPath, inputs = []) { const pool = getPostgresPool(); await initialize(pool); const client = await pool.connect(); try { await client.query("BEGIN"); const results = []; for (let index = 0; index < inputs.length; index += 1) results.push(await insertReading(client, inputs[index], index)); await client.query("COMMIT"); return results; } catch (caught) { await client.query("ROLLBACK"); throw caught; } finally { client.release(); } }
export async function listPostgresSensorHistory(dbPath, wallId, limit = 200, moduleId = null) { const pool = getPostgresPool(); await initialize(pool); const safeLimit = Math.min(Math.max(Number(limit) || 200, 1), 1000); const result = moduleId ? await pool.query("SELECT * FROM sensor_reading_history WHERE wall_id = $1 AND module_id = $2 ORDER BY observed_at DESC LIMIT $3", [required(wallId, "wallId"), required(moduleId, "moduleId"), safeLimit]) : await pool.query("SELECT * FROM sensor_reading_history WHERE wall_id = $1 ORDER BY observed_at DESC LIMIT $2", [required(wallId, "wallId"), safeLimit]); return result.rows.map(recordFromRow); }
export async function listPostgresModuleLatestReadings(dbPath, moduleId) { const pool = getPostgresPool(); await initialize(pool); const result = await pool.query("SELECT h.* FROM sensor_reading_history h JOIN (SELECT metric, MAX(observed_at) AS latest FROM sensor_reading_history WHERE module_id = $1 GROUP BY metric) latest ON latest.metric = h.metric AND latest.latest = h.observed_at WHERE h.module_id = $1 ORDER BY h.metric ASC", [required(moduleId, "moduleId")]); return result.rows.map(recordFromRow); }
export async function listPostgresLatestReadingsByModules(dbPath, moduleIds = []) { const pool = getPostgresPool(); await initialize(pool); const ids = moduleIds.map((value) => String(value || "").trim()).filter(Boolean); if (!ids.length) return []; const result = await pool.query("SELECT h.* FROM sensor_reading_history h JOIN (SELECT module_id, metric, MAX(observed_at) AS latest FROM sensor_reading_history WHERE module_id = ANY($1::text[]) GROUP BY module_id, metric) latest ON latest.module_id = h.module_id AND latest.metric = h.metric AND latest.latest = h.observed_at ORDER BY h.module_id ASC, h.metric ASC", [ids]); return result.rows.map(recordFromRow); }
export async function calculatePostgresSensorStability(dbPath, wallId) { const pool = getPostgresPool(); await initialize(pool); const result = await pool.query("SELECT h.* FROM sensor_reading_history h JOIN (SELECT sensor_id, MAX(observed_at) AS latest FROM sensor_reading_history WHERE wall_id = $1 GROUP BY sensor_id) latest ON latest.sensor_id = h.sensor_id AND latest.latest = h.observed_at WHERE h.wall_id = $1 ORDER BY h.sensor_id ASC", [wallId]); const rows = result.rows; const score = rows.length ? Math.round(rows.reduce((sum, row) => sum + (row.status === "ok" ? 100 : row.status === "watch" ? 50 : 0), 0) / rows.length) : null; const snapshot = { id: `HSS-${Date.now()}-${randomBytes(4).toString("hex")}`, wallId, score, scoreType: "sensor-stability", status: rows.length ? "measured" : "no-data", calculatedAt: new Date().toISOString(), inputs: { sensorCount: rows.length, latestReadings: rows.map(recordFromRow), formula: "ok=100, watch=50, alert/offline=0; arithmetic mean" }, methodVersion: postgresTelemetryMigrationVersion }; await pool.query("INSERT INTO health_score_snapshots (id,wall_id,score,score_type,status,calculated_at,inputs_json,method_version) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)", [snapshot.id, snapshot.wallId, snapshot.score, snapshot.scoreType, snapshot.status, snapshot.calculatedAt, JSON.stringify(snapshot.inputs), snapshot.methodVersion]); return snapshot; }
export async function readPostgresTelemetryStorageHealth(dbPath) { const pool = getPostgresPool(); await initialize(pool); const [tables, history, snapshots, latest] = await Promise.all([pool.query("SELECT tablename AS name FROM pg_tables WHERE schemaname = current_schema() AND tablename IN ('sensor_reading_history','health_score_snapshots') ORDER BY tablename"), pool.query("SELECT COUNT(*)::int AS count FROM sensor_reading_history"), pool.query("SELECT COUNT(*)::int AS count FROM health_score_snapshots"), pool.query("SELECT id,wall_id,score,calculated_at FROM health_score_snapshots ORDER BY calculated_at DESC LIMIT 1")]); const row = latest.rows[0]; return { backend: "postgresql", migrationVersion: postgresTelemetryMigrationVersion, tables: tables.rows.map((item) => item.name), counts: { sensorReadingHistory: Number(history.rows[0].count), healthScoreSnapshots: Number(snapshots.rows[0].count) }, latestHealthScore: row ? { id: row.id, wallId: row.wall_id, score: Number(row.score), calculatedAt: row.calculated_at } : null };
}
