import { mkdir } from "node:fs/promises";
import { DatabaseSync } from "node:sqlite";
import { dirname } from "node:path";

export const notificationMigrationVersion = "2026-08-23.notification-outbox-v1";
const notificationStatuses = new Set(["pending", "processing", "retry", "delivered", "failed"]);

function error(message, code = "NOTIFICATION_VALIDATION_ERROR", status = 400) { const result = new Error(message); result.code = code; result.status = status; return result; }
function required(value, field) { const text = String(value || "").trim(); if (!text) throw error(`${field} is required`); return text; }
function parseJson(value, fallback) { try { return JSON.parse(value || ""); } catch { return fallback; } }
function withDatabase(dbPath, callback) { return (async () => { await mkdir(dirname(dbPath), { recursive: true }); const db = new DatabaseSync(dbPath); try { initialize(db); return callback(db); } finally { db.close(); } })(); }
function initialize(db) {
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY, applied_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS ops_notification_outbox (
      id TEXT PRIMARY KEY, channel TEXT NOT NULL, event_type TEXT NOT NULL, severity TEXT NOT NULL,
      client_id TEXT, wall_id TEXT, alert_id TEXT, status TEXT NOT NULL DEFAULT 'pending',
      attempts INTEGER NOT NULL DEFAULT 0, next_attempt_at TEXT NOT NULL, locked_at TEXT,
      lease_until TEXT, payload_json TEXT NOT NULL, last_error TEXT, created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL, delivered_at TEXT,
      CHECK (status IN ('pending', 'processing', 'retry', 'delivered', 'failed'))
    );
    CREATE INDEX IF NOT EXISTS idx_notification_due ON ops_notification_outbox(status, next_attempt_at);
    CREATE INDEX IF NOT EXISTS idx_notification_alert ON ops_notification_outbox(alert_id);
  `);
  db.prepare("INSERT OR IGNORE INTO schema_migrations (version, applied_at) VALUES (?, ?)").run(notificationMigrationVersion, new Date().toISOString());
}
function notificationFromRow(row) {
  return { id: row.id, channel: row.channel, eventType: row.event_type, severity: row.severity, clientId: row.client_id || null, wallId: row.wall_id || null, alertId: row.alert_id || null, status: row.status, attempts: Number(row.attempts), nextAttemptAt: row.next_attempt_at, lockedAt: row.locked_at || null, leaseUntil: row.lease_until || null, payload: parseJson(row.payload_json, {}), lastError: row.last_error || null, createdAt: row.created_at, updatedAt: row.updated_at, deliveredAt: row.delivered_at || null };
}
function normalizedInput(input) {
  const now = new Date().toISOString();
  return { id: required(input?.id, "notification.id"), channel: String(input?.channel || "webhook").trim(), eventType: required(input?.eventType, "notification.eventType"), severity: String(input?.severity || "warning").trim(), clientId: input?.clientId ? String(input.clientId).trim() : null, wallId: input?.wallId ? String(input.wallId).trim() : null, alertId: input?.alertId ? String(input.alertId).trim() : null, status: "pending", attempts: 0, nextAttemptAt: input?.nextAttemptAt || now, payload: input?.payload && typeof input.payload === "object" ? input.payload : {}, createdAt: now, updatedAt: now };
}

export async function enqueueSqliteNotification(dbPath, input) {
  return withDatabase(dbPath, (db) => {
    const existing = db.prepare("SELECT * FROM ops_notification_outbox WHERE id = ?").get(input?.id);
    if (existing) return { duplicate: true, notification: notificationFromRow(existing) };
    const record = normalizedInput(input);
    db.prepare("INSERT INTO ops_notification_outbox (id,channel,event_type,severity,client_id,wall_id,alert_id,status,attempts,next_attempt_at,payload_json,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)").run(record.id, record.channel, record.eventType, record.severity, record.clientId, record.wallId, record.alertId, record.status, record.attempts, record.nextAttemptAt, JSON.stringify(record.payload), record.createdAt, record.updatedAt);
    return { duplicate: false, notification: notificationFromRow(db.prepare("SELECT * FROM ops_notification_outbox WHERE id = ?").get(record.id)) };
  });
}

export async function claimSqliteNotifications(dbPath, limit = 20, leaseSeconds = 120) {
  return withDatabase(dbPath, (db) => {
    const now = new Date();
    const nowIso = now.toISOString();
    const leaseUntil = new Date(now.getTime() + Math.max(30, Number(leaseSeconds) || 120) * 1000).toISOString();
    const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
    db.exec("BEGIN IMMEDIATE");
    try {
      const rows = db.prepare("SELECT * FROM ops_notification_outbox WHERE (status IN ('pending','retry') AND next_attempt_at <= ?) OR (status = 'processing' AND lease_until < ?) ORDER BY next_attempt_at ASC, created_at ASC, id ASC LIMIT ?").all(nowIso, nowIso, safeLimit);
      const claimed = [];
      for (const row of rows) {
        db.prepare("UPDATE ops_notification_outbox SET status='processing', attempts=attempts+1, locked_at=?, lease_until=?, updated_at=? WHERE id=?").run(nowIso, leaseUntil, nowIso, row.id);
        claimed.push(notificationFromRow(db.prepare("SELECT * FROM ops_notification_outbox WHERE id = ?").get(row.id)));
      }
      db.exec("COMMIT");
      return claimed;
    } catch (caught) { db.exec("ROLLBACK"); throw caught; }
  });
}

export async function markSqliteNotificationDelivered(dbPath, id) {
  return withDatabase(dbPath, (db) => { const now = new Date().toISOString(); db.prepare("UPDATE ops_notification_outbox SET status='delivered', delivered_at=?, lease_until=NULL, last_error=NULL, updated_at=? WHERE id=?").run(now, now, required(id, "notification.id")); const row = db.prepare("SELECT * FROM ops_notification_outbox WHERE id=?").get(id); if (!row) throw error("notification not found", "NOTIFICATION_NOT_FOUND", 404); return notificationFromRow(row); });
}

export async function markSqliteNotificationRetry(dbPath, id, reason, maxAttempts = 8) {
  return withDatabase(dbPath, (db) => { const row = db.prepare("SELECT * FROM ops_notification_outbox WHERE id=?").get(required(id, "notification.id")); if (!row) throw error("notification not found", "NOTIFICATION_NOT_FOUND", 404); const now = new Date(); const attempts = Number(row.attempts); const exhausted = attempts >= Math.max(1, Number(maxAttempts) || 8); const nextAttemptAt = new Date(now.getTime() + Math.min(3_600_000, 1000 * 2 ** Math.min(attempts, 10))).toISOString(); db.prepare("UPDATE ops_notification_outbox SET status=?, next_attempt_at=?, lease_until=NULL, last_error=?, updated_at=? WHERE id=?").run(exhausted ? "failed" : "retry", nextAttemptAt, String(reason || "notification delivery failed").slice(0, 500), now.toISOString(), row.id); return notificationFromRow(db.prepare("SELECT * FROM ops_notification_outbox WHERE id=?").get(row.id)); });
}

export async function listSqliteNotifications(dbPath, { status = null, limit = 100 } = {}) { return withDatabase(dbPath, (db) => { const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 500); const rows = status && notificationStatuses.has(status) ? db.prepare("SELECT * FROM ops_notification_outbox WHERE status=? ORDER BY created_at DESC, id DESC LIMIT ?").all(status, safeLimit) : db.prepare("SELECT * FROM ops_notification_outbox ORDER BY created_at DESC, id DESC LIMIT ?").all(safeLimit); return rows.map(notificationFromRow); }); }

export async function readSqliteNotificationStorageHealth(dbPath) { return withDatabase(dbPath, (db) => { const status = db.prepare("SELECT status,COUNT(*) AS count FROM ops_notification_outbox GROUP BY status ORDER BY status").all(); const counts = Object.fromEntries([...notificationStatuses].map((value) => [value, 0])); for (const row of status) counts[row.status] = Number(row.count); const due = db.prepare("SELECT COUNT(*) AS count FROM ops_notification_outbox WHERE status IN ('pending','retry') AND next_attempt_at <= ?").get(new Date().toISOString()).count; return { backend: "sqlite", migrationVersion: notificationMigrationVersion, tables: ["ops_notification_outbox"], counts: { ...counts, due: Number(due), total: Object.values(counts).reduce((sum, value) => sum + value, 0) }, relationshipIntegrity: { foreignKeysEnabled: db.prepare("PRAGMA foreign_keys").get().foreign_keys === 1, foreignKeyIssues: db.prepare("PRAGMA foreign_key_check").all().length } }; }); }
