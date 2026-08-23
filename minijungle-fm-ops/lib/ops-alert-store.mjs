import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import { DatabaseSync } from "node:sqlite";
import { dirname } from "node:path";

export const alertMigrationVersion = "2026-08-17.telemetry-alerts-v1";
const metrics = new Set(["temperature", "humidity", "co2", "mc"]);
const severities = new Set(["info", "warning", "critical"]);
const alertStatuses = new Set(["open", "acknowledged", "resolved"]);

function error(message, code = "ALERT_VALIDATION_ERROR", status = 400) { const result = new Error(message); result.code = code; result.status = status; return result; }
function required(value, field) { const text = String(value || "").trim(); if (!text) throw error(`${field} is required`); return text; }
function optionalNumber(value, field) { if (value === null || value === undefined || value === "") return null; const result = Number(value); if (!Number.isFinite(result)) throw error(`${field} must be a finite number`); return result; }
function parseJson(value, fallback) { try { return JSON.parse(value || ""); } catch { return fallback; } }
function withDatabase(dbPath, callback) { return (async () => { await mkdir(dirname(dbPath), { recursive: true }); const db = new DatabaseSync(dbPath); try { initialize(db); return callback(db); } finally { db.close(); } })(); }
function initialize(db) {
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY, applied_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS telemetry_alert_rules (
      id TEXT PRIMARY KEY, client_id TEXT, wall_id TEXT, module_id TEXT, metric TEXT NOT NULL,
      min_value REAL, max_value REAL, severity TEXT NOT NULL, name TEXT NOT NULL,
      enabled INTEGER NOT NULL DEFAULT 1, source TEXT NOT NULL, metadata_json TEXT NOT NULL,
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
      CHECK (metric IN ('temperature', 'humidity', 'co2', 'mc')),
      CHECK (severity IN ('info', 'warning', 'critical')),
      CHECK (min_value IS NOT NULL OR max_value IS NOT NULL),
      CHECK (min_value IS NULL OR max_value IS NULL OR min_value <= max_value),
      FOREIGN KEY (client_id) REFERENCES clients(id) ON UPDATE CASCADE ON DELETE RESTRICT,
      FOREIGN KEY (wall_id) REFERENCES living_assets(id) ON UPDATE CASCADE ON DELETE RESTRICT,
      FOREIGN KEY (module_id) REFERENCES asset_modules(id) ON UPDATE CASCADE ON DELETE SET NULL
    );
    CREATE INDEX IF NOT EXISTS idx_alert_rules_scope ON telemetry_alert_rules(client_id, wall_id, module_id, metric, enabled);
    CREATE TABLE IF NOT EXISTS telemetry_alerts (
      id TEXT PRIMARY KEY, rule_id TEXT NOT NULL, client_id TEXT NOT NULL, wall_id TEXT NOT NULL,
      module_id TEXT, sensor_id TEXT NOT NULL, metric TEXT NOT NULL, value REAL NOT NULL, unit TEXT,
      severity TEXT NOT NULL, status TEXT NOT NULL, reason TEXT NOT NULL, source_reading_id TEXT NOT NULL,
      observed_at TEXT NOT NULL, first_seen_at TEXT NOT NULL, last_seen_at TEXT NOT NULL,
      occurrence_count INTEGER NOT NULL DEFAULT 1, resolution_note TEXT, acknowledged_at TEXT,
      resolved_at TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
      UNIQUE(rule_id, sensor_id, source_reading_id),
      FOREIGN KEY (rule_id) REFERENCES telemetry_alert_rules(id) ON UPDATE CASCADE ON DELETE RESTRICT,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON UPDATE CASCADE ON DELETE RESTRICT,
      FOREIGN KEY (wall_id) REFERENCES living_assets(id) ON UPDATE CASCADE ON DELETE RESTRICT,
      FOREIGN KEY (module_id) REFERENCES asset_modules(id) ON UPDATE CASCADE ON DELETE SET NULL
    );
    CREATE INDEX IF NOT EXISTS idx_alerts_scope_status ON telemetry_alerts(client_id, wall_id, module_id, status, severity);
    CREATE INDEX IF NOT EXISTS idx_alerts_last_seen ON telemetry_alerts(last_seen_at DESC);
  `);
  db.prepare("INSERT OR IGNORE INTO schema_migrations (version, applied_at) VALUES (?, ?)").run(alertMigrationVersion, new Date().toISOString());
}
function ruleFromRow(row) { return { id: row.id, clientId: row.client_id || null, wallId: row.wall_id || null, moduleId: row.module_id || null, metric: row.metric, minValue: row.min_value, maxValue: row.max_value, severity: row.severity, name: row.name, enabled: Boolean(row.enabled), source: row.source, metadata: parseJson(row.metadata_json, {}), createdAt: row.created_at, updatedAt: row.updated_at }; }
function alertFromRow(row) { return { id: row.id, ruleId: row.rule_id, clientId: row.client_id, wallId: row.wall_id, moduleId: row.module_id || null, sensorId: row.sensor_id, metric: row.metric, value: row.value, unit: row.unit || null, severity: row.severity, status: row.status, reason: row.reason, sourceReadingId: row.source_reading_id, observedAt: row.observed_at, firstSeenAt: row.first_seen_at, lastSeenAt: row.last_seen_at, occurrenceCount: row.occurrence_count, resolutionNote: row.resolution_note || null, acknowledgedAt: row.acknowledged_at || null, resolvedAt: row.resolved_at || null, createdAt: row.created_at, updatedAt: row.updated_at }; }

export async function registerSqliteAlertRule(dbPath, input) {
  const metric = required(input?.metric, "rule.metric").toLowerCase();
  const severity = String(input?.severity || "warning").trim().toLowerCase();
  const minValue = optionalNumber(input?.minValue, "rule.minValue");
  const maxValue = optionalNumber(input?.maxValue, "rule.maxValue");
  if (!metrics.has(metric)) throw error("rule.metric must be temperature, humidity, co2 or mc");
  if (!severities.has(severity)) throw error("rule.severity must be info, warning or critical");
  if (minValue === null && maxValue === null) throw error("rule needs minValue or maxValue");
  if (minValue !== null && maxValue !== null && minValue > maxValue) throw error("rule.minValue cannot exceed rule.maxValue");
  const id = required(input?.id, "rule.id");
  const now = new Date().toISOString();
  return withDatabase(dbPath, (db) => {
    const existing = db.prepare("SELECT * FROM telemetry_alert_rules WHERE id = ?").get(id);
    const record = { id, clientId: input?.clientId ? String(input.clientId).trim() : null, wallId: input?.wallId ? String(input.wallId).trim() : null, moduleId: input?.moduleId ? String(input.moduleId).trim() : null, metric, minValue, maxValue, severity, name: String(input?.name || `${metric} threshold`).trim(), enabled: input?.enabled === undefined ? true : Boolean(input.enabled), source: String(input?.source || "fm-config").trim(), metadata: input?.metadata && typeof input.metadata === "object" ? input.metadata : {}, createdAt: existing?.created_at || now, updatedAt: now };
    db.prepare(`
      INSERT INTO telemetry_alert_rules (id, client_id, wall_id, module_id, metric, min_value, max_value, severity, name, enabled, source, metadata_json, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET client_id = excluded.client_id, wall_id = excluded.wall_id, module_id = excluded.module_id,
        metric = excluded.metric, min_value = excluded.min_value, max_value = excluded.max_value, severity = excluded.severity,
        name = excluded.name, enabled = excluded.enabled, source = excluded.source, metadata_json = excluded.metadata_json, updated_at = excluded.updated_at
    `).run(record.id, record.clientId, record.wallId, record.moduleId, record.metric, record.minValue, record.maxValue, record.severity, record.name, record.enabled ? 1 : 0, record.source, JSON.stringify(record.metadata), record.createdAt, record.updatedAt);
    return { duplicate: Boolean(existing), rule: ruleFromRow(db.prepare("SELECT * FROM telemetry_alert_rules WHERE id = ?").get(id)) };
  });
}

export async function listSqliteAlertRules(dbPath, { clientIds = null, wallId = null, moduleId = null } = {}) {
  return withDatabase(dbPath, (db) => {
    const rows = db.prepare("SELECT * FROM telemetry_alert_rules WHERE (? IS NULL OR wall_id = ?) AND (? IS NULL OR module_id = ?) ORDER BY enabled DESC, metric ASC, id ASC").all(wallId, wallId, moduleId, moduleId);
    const allowed = clientIds ? new Set(clientIds) : null;
    return rows.map(ruleFromRow).filter((rule) => !allowed || !rule.clientId || allowed.has(rule.clientId));
  });
}

export async function evaluateSqliteTelemetryAlerts(dbPath, reading, clientId) {
  return withDatabase(dbPath, (db) => {
    const rules = db.prepare(`SELECT * FROM telemetry_alert_rules WHERE enabled = 1 AND metric = ? AND (client_id IS NULL OR client_id = ?) AND (wall_id IS NULL OR wall_id = ?) AND (module_id IS NULL OR module_id = ?) ORDER BY severity DESC, id ASC`).all(reading.metric, clientId, reading.wallId, reading.moduleId || null);
    const now = new Date().toISOString();
    const results = [];
    for (const rule of rules) {
      const violated = (rule.min_value !== null && reading.value < rule.min_value) || (rule.max_value !== null && reading.value > rule.max_value);
      if (!violated) continue;
      const bounds = [rule.min_value === null ? null : `min ${rule.min_value}`, rule.max_value === null ? null : `max ${rule.max_value}`].filter(Boolean).join(", ");
      const reason = `${reading.metric} value ${reading.value}${reading.unit ? ` ${reading.unit}` : ""} is outside ${bounds}.`;
      const existing = db.prepare("SELECT * FROM telemetry_alerts WHERE rule_id = ? AND sensor_id = ? AND status IN ('open', 'acknowledged') ORDER BY last_seen_at DESC LIMIT 1").get(rule.id, reading.sensorId);
      if (existing) {
        db.prepare("UPDATE telemetry_alerts SET value = ?, unit = ?, reason = ?, source_reading_id = ?, observed_at = ?, last_seen_at = ?, occurrence_count = occurrence_count + 1, updated_at = ? WHERE id = ?").run(reading.value, reading.unit || null, reason, reading.id, reading.observedAt, now, now, existing.id);
        results.push({ created: false, alert: alertFromRow(db.prepare("SELECT * FROM telemetry_alerts WHERE id = ?").get(existing.id)) });
        continue;
      }
      const alert = { id: `ALT-${Date.now()}-${randomUUID().slice(0, 8)}`, ruleId: rule.id, clientId, wallId: reading.wallId, moduleId: reading.moduleId || null, sensorId: reading.sensorId, metric: reading.metric, value: reading.value, unit: reading.unit || null, severity: rule.severity, status: "open", reason, sourceReadingId: reading.id, observedAt: reading.observedAt, firstSeenAt: now, lastSeenAt: now, occurrenceCount: 1, resolutionNote: null, acknowledgedAt: null, resolvedAt: null, createdAt: now, updatedAt: now };
      db.prepare(`INSERT INTO telemetry_alerts (id, rule_id, client_id, wall_id, module_id, sensor_id, metric, value, unit, severity, status, reason, source_reading_id, observed_at, first_seen_at, last_seen_at, occurrence_count, resolution_note, acknowledged_at, resolved_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(alert.id, alert.ruleId, alert.clientId, alert.wallId, alert.moduleId, alert.sensorId, alert.metric, alert.value, alert.unit, alert.severity, alert.status, alert.reason, alert.sourceReadingId, alert.observedAt, alert.firstSeenAt, alert.lastSeenAt, alert.occurrenceCount, alert.resolutionNote, alert.acknowledgedAt, alert.resolvedAt, alert.createdAt, alert.updatedAt);
      results.push({ created: true, alert });
    }
    return results;
  });
}

export async function evaluateSqliteTelemetryAlertsBatch(dbPath, readings = [], clientId) {
  return withDatabase(dbPath, (db) => {
    const results = [];
    db.exec("BEGIN IMMEDIATE");
    try {
      for (const reading of readings) {
        const rules = db.prepare(`SELECT * FROM telemetry_alert_rules WHERE enabled = 1 AND metric = ? AND (client_id IS NULL OR client_id = ?) AND (wall_id IS NULL OR wall_id = ?) AND (module_id IS NULL OR module_id = ?) ORDER BY severity DESC, id ASC`).all(reading.metric, clientId, reading.wallId, reading.moduleId || null);
        for (const rule of rules) {
          const violated = (rule.min_value !== null && reading.value < rule.min_value) || (rule.max_value !== null && reading.value > rule.max_value);
          if (!violated) continue;
          const bounds = [rule.min_value === null ? null : `min ${rule.min_value}`, rule.max_value === null ? null : `max ${rule.max_value}`].filter(Boolean).join(", ");
          const reason = `${reading.metric} value ${reading.value}${reading.unit ? ` ${reading.unit}` : ""} is outside ${bounds}.`;
          const now = new Date().toISOString();
          const existing = db.prepare("SELECT * FROM telemetry_alerts WHERE rule_id = ? AND sensor_id = ? AND status IN ('open', 'acknowledged') ORDER BY last_seen_at DESC LIMIT 1").get(rule.id, reading.sensorId);
          if (existing) {
            db.prepare("UPDATE telemetry_alerts SET value = ?, unit = ?, reason = ?, source_reading_id = ?, observed_at = ?, last_seen_at = ?, occurrence_count = occurrence_count + 1, updated_at = ? WHERE id = ?").run(reading.value, reading.unit || null, reason, reading.id, reading.observedAt, now, now, existing.id);
            results.push({ created: false, alert: alertFromRow(db.prepare("SELECT * FROM telemetry_alerts WHERE id = ?").get(existing.id)) });
          } else {
            const alert = { id: `ALT-${Date.now()}-${randomUUID().slice(0, 8)}`, ruleId: rule.id, clientId, wallId: reading.wallId, moduleId: reading.moduleId || null, sensorId: reading.sensorId, metric: reading.metric, value: reading.value, unit: reading.unit || null, severity: rule.severity, status: "open", reason, sourceReadingId: reading.id, observedAt: reading.observedAt, firstSeenAt: now, lastSeenAt: now, occurrenceCount: 1, resolutionNote: null, acknowledgedAt: null, resolvedAt: null, createdAt: now, updatedAt: now };
            db.prepare(`INSERT INTO telemetry_alerts (id, rule_id, client_id, wall_id, module_id, sensor_id, metric, value, unit, severity, status, reason, source_reading_id, observed_at, first_seen_at, last_seen_at, occurrence_count, resolution_note, acknowledged_at, resolved_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(alert.id, alert.ruleId, alert.clientId, alert.wallId, alert.moduleId, alert.sensorId, alert.metric, alert.value, alert.unit, alert.severity, alert.status, alert.reason, alert.sourceReadingId, alert.observedAt, alert.firstSeenAt, alert.lastSeenAt, alert.occurrenceCount, alert.resolutionNote, alert.acknowledgedAt, alert.resolvedAt, alert.createdAt, alert.updatedAt);
            results.push({ created: true, alert });
          }
        }
      }
      db.exec("COMMIT");
      return results;
    } catch (batchError) {
      db.exec("ROLLBACK");
      throw batchError;
    }
  });
}

export async function listSqliteAlerts(dbPath, { clientIds = null, statuses = null, wallId = null, moduleId = null, limit = 100 } = {}) {
  return withDatabase(dbPath, (db) => {
    const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 500);
    const statusList = Array.isArray(statuses) && statuses.length ? statuses.filter((value) => alertStatuses.has(value)) : Array.from(alertStatuses);
    const placeholders = statusList.map(() => "?").join(", ");
    const rows = db.prepare(`SELECT * FROM telemetry_alerts WHERE status IN (${placeholders}) AND (? IS NULL OR wall_id = ?) AND (? IS NULL OR module_id = ?) ORDER BY CASE severity WHEN 'critical' THEN 1 WHEN 'warning' THEN 2 ELSE 3 END, last_seen_at DESC LIMIT ?`).all(...statusList, wallId, wallId, moduleId, moduleId, safeLimit);
    const allowed = clientIds ? new Set(clientIds) : null;
    return rows.map(alertFromRow).filter((alert) => !allowed || allowed.has(alert.clientId));
  });
}

export async function updateSqliteAlert(dbPath, id, input) {
  const status = String(input?.status || "").trim().toLowerCase();
  if (!alertStatuses.has(status)) throw error("alert.status must be open, acknowledged or resolved");
  return withDatabase(dbPath, (db) => {
    const existing = db.prepare("SELECT * FROM telemetry_alerts WHERE id = ?").get(id);
    if (!existing) throw error("alert not found", "ALERT_NOT_FOUND", 404);
    const now = new Date().toISOString();
    const acknowledgedAt = status === "acknowledged" ? (existing.acknowledged_at || now) : existing.acknowledged_at;
    const resolvedAt = status === "resolved" ? now : (status === "open" ? null : existing.resolved_at);
    db.prepare("UPDATE telemetry_alerts SET status = ?, resolution_note = ?, acknowledged_at = ?, resolved_at = ?, updated_at = ? WHERE id = ?").run(status, input?.resolutionNote ? String(input.resolutionNote).trim() : existing.resolution_note, acknowledgedAt, resolvedAt, now, id);
    return alertFromRow(db.prepare("SELECT * FROM telemetry_alerts WHERE id = ?").get(id));
  });
}

export async function readSqliteAlertStorageHealth(dbPath) {
  return withDatabase(dbPath, (db) => {
    const count = (table) => db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get().count;
    const status = db.prepare("SELECT status, COUNT(*) AS count FROM telemetry_alerts GROUP BY status ORDER BY status ASC").all();
    return { backend: "sqlite", migrationVersion: alertMigrationVersion, tables: ["telemetry_alert_rules", "telemetry_alerts"], counts: { rules: count("telemetry_alert_rules"), alerts: count("telemetry_alerts") }, status: Object.fromEntries(status.map((row) => [row.status, row.count])), relationshipIntegrity: { foreignKeysEnabled: db.prepare("PRAGMA foreign_keys").get().foreign_keys === 1, foreignKeyIssues: db.prepare("PRAGMA foreign_key_check").all().length } };
  });
}
