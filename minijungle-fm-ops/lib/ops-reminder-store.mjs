import { mkdir } from "node:fs/promises";
import { DatabaseSync } from "node:sqlite";
import { dirname } from "node:path";

export const reminderMigrationVersion = "2026-08-17.mobile-reminder-actions-v1";

function parseJson(value, fallback) { try { return JSON.parse(value || ""); } catch { return fallback; } }
function validationError(message) { const error = new Error(message); error.status = 400; error.code = "REMINDER_ACTION_VALIDATION_ERROR"; return error; }
function requireString(value, field) { const text = String(value || "").trim(); if (!text) throw validationError(`${field} is required`); return text; }
async function withDatabase(dbPath, callback) {
  await mkdir(dirname(dbPath), { recursive: true });
  const db = new DatabaseSync(dbPath);
  try { initialize(db); return callback(db); } finally { db.close(); }
}
function initialize(db) {
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY, applied_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS mobile_reminder_actions (
      reminder_id TEXT PRIMARY KEY,
      status TEXT NOT NULL CHECK (status IN ('acknowledged', 'completed', 'reopened')),
      actor_id TEXT NOT NULL,
      client_id TEXT,
      wall_id TEXT,
      workorder_id TEXT,
      module_id TEXT,
      action_type TEXT NOT NULL,
      capture_batch_id TEXT,
      note TEXT,
      acknowledged_at TEXT,
      completed_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_reminder_actions_wall ON mobile_reminder_actions(wall_id, status);
    CREATE INDEX IF NOT EXISTS idx_reminder_actions_actor ON mobile_reminder_actions(actor_id, status);
  `);
  db.prepare("INSERT OR IGNORE INTO schema_migrations (version, applied_at) VALUES (?, ?)").run(reminderMigrationVersion, new Date().toISOString());
}
function actionFromRow(row) { return { reminderId: row.reminder_id, status: row.status, actorId: row.actor_id, clientId: row.client_id || null, wallId: row.wall_id || null, workorderId: row.workorder_id || null, moduleId: row.module_id || null, actionType: row.action_type, captureBatchId: row.capture_batch_id || null, note: row.note || "", acknowledgedAt: row.acknowledged_at || null, completedAt: row.completed_at || null, createdAt: row.created_at, updatedAt: row.updated_at }; }

export async function saveSqliteReminderAction(dbPath, input) {
  return withDatabase(dbPath, (db) => {
    const reminderId = requireString(input?.reminderId, "reminderId");
    const actorId = requireString(input?.actorId, "actorId");
    const actionType = requireString(input?.actionType, "actionType");
    const status = String(input?.status || "completed").trim().toLowerCase();
    if (!["acknowledged", "completed", "reopened"].includes(status)) throw validationError("status must be acknowledged, completed or reopened");
    const now = new Date().toISOString();
    const existing = db.prepare("SELECT * FROM mobile_reminder_actions WHERE reminder_id = ?").get(reminderId);
    const record = { reminderId, status, actorId, clientId: input?.clientId ? String(input.clientId).trim() : null, wallId: input?.wallId ? String(input.wallId).trim() : null, workorderId: input?.workorderId ? String(input.workorderId).trim() : null, moduleId: input?.moduleId ? String(input.moduleId).trim() : null, actionType, captureBatchId: input?.captureBatchId ? String(input.captureBatchId).trim() : null, note: input?.note ? String(input.note).trim() : "", acknowledgedAt: existing?.acknowledged_at || (status === "acknowledged" || status === "completed" ? now : null), completedAt: status === "completed" ? (existing?.completed_at || now) : null, createdAt: existing?.created_at || now, updatedAt: now };
    db.prepare(`
      INSERT INTO mobile_reminder_actions (reminder_id, status, actor_id, client_id, wall_id, workorder_id, module_id, action_type, capture_batch_id, note, acknowledged_at, completed_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(reminder_id) DO UPDATE SET status = excluded.status, actor_id = excluded.actor_id, client_id = excluded.client_id,
        wall_id = excluded.wall_id, workorder_id = excluded.workorder_id, module_id = excluded.module_id, action_type = excluded.action_type,
        capture_batch_id = excluded.capture_batch_id, note = excluded.note, acknowledged_at = excluded.acknowledged_at,
        completed_at = excluded.completed_at, updated_at = excluded.updated_at
    `).run(record.reminderId, record.status, record.actorId, record.clientId, record.wallId, record.workorderId, record.moduleId, record.actionType, record.captureBatchId, record.note, record.acknowledgedAt, record.completedAt, record.createdAt, record.updatedAt);
    return { duplicate: Boolean(existing), action: actionFromRow(db.prepare("SELECT * FROM mobile_reminder_actions WHERE reminder_id = ?").get(reminderId)) };
  });
}

export async function listSqliteReminderActions(dbPath) { return withDatabase(dbPath, (db) => db.prepare("SELECT * FROM mobile_reminder_actions ORDER BY updated_at DESC, reminder_id ASC").all().map(actionFromRow)); }
export async function readSqliteReminderStorageHealth(dbPath) { return withDatabase(dbPath, (db) => ({ backend: "sqlite", migrationVersion: reminderMigrationVersion, counts: { actions: db.prepare("SELECT COUNT(*) AS count FROM mobile_reminder_actions").get().count }, relationshipIntegrity: { foreignKeyIssues: db.prepare("PRAGMA foreign_key_check").all().length } })); }
