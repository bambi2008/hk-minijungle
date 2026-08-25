import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import { DatabaseSync } from "node:sqlite";
import { dirname } from "node:path";

export const remediationMigrationVersion = "2026-08-25.remediation-tasks-v1";
const statuses = new Set(["open", "assigned", "in_progress", "resolved", "cancelled"]);
const priorities = new Set(["critical", "high", "normal", "low"]);
const transitions = {
  open: new Set(["open", "assigned", "in_progress", "resolved", "cancelled"]),
  assigned: new Set(["assigned", "in_progress", "resolved", "cancelled"]),
  in_progress: new Set(["in_progress", "assigned", "resolved", "cancelled"]),
  resolved: new Set(["resolved", "open"]),
  cancelled: new Set(["cancelled", "open"])
};

function validationError(message, status = 400) { const error = new Error(message); error.status = status; error.code = "REMEDIATION_VALIDATION_ERROR"; return error; }
function required(value, field) { const text = String(value || "").trim(); if (!text) throw validationError(`${field} is required`); return text; }
function optional(value) { return value === null || value === undefined || value === "" ? null : String(value).trim(); }
function parseJson(value, fallback) { try { return JSON.parse(value || ""); } catch { return fallback; } }
async function withDatabase(dbPath, callback) { await mkdir(dirname(dbPath), { recursive: true }); const db = new DatabaseSync(dbPath); try { initialize(db); return await callback(db); } finally { db.close(); } }
function initialize(db) {
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY, applied_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS ops_remediation_tasks (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL,
      wall_id TEXT NOT NULL,
      module_id TEXT NOT NULL,
      source TEXT NOT NULL,
      source_key TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('open', 'assigned', 'in_progress', 'resolved', 'cancelled')),
      priority TEXT NOT NULL CHECK (priority IN ('critical', 'high', 'normal', 'low')),
      assigned_to TEXT,
      due_at TEXT,
      reason_json TEXT NOT NULL,
      resolution_note TEXT,
      evidence_ref TEXT,
      created_by TEXT NOT NULL,
      updated_by TEXT NOT NULL,
      acknowledged_at TEXT,
      started_at TEXT,
      resolved_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON UPDATE CASCADE ON DELETE RESTRICT,
      FOREIGN KEY (wall_id) REFERENCES living_assets(id) ON UPDATE CASCADE ON DELETE RESTRICT,
      FOREIGN KEY (module_id) REFERENCES asset_modules(id) ON UPDATE CASCADE ON DELETE RESTRICT
    );
    CREATE INDEX IF NOT EXISTS idx_remediation_scope_status ON ops_remediation_tasks(client_id, wall_id, module_id, status, priority);
    CREATE INDEX IF NOT EXISTS idx_remediation_due ON ops_remediation_tasks(status, due_at);
    CREATE INDEX IF NOT EXISTS idx_remediation_updated ON ops_remediation_tasks(updated_at DESC, id ASC);
  `);
  db.prepare("INSERT OR IGNORE INTO schema_migrations (version, applied_at) VALUES (?, ?)").run(remediationMigrationVersion, new Date().toISOString());
}
function taskFromRow(row) { return { id: row.id, clientId: row.client_id, wallId: row.wall_id, moduleId: row.module_id, source: row.source, sourceKey: row.source_key, status: row.status, priority: row.priority, assignedTo: row.assigned_to || null, dueAt: row.due_at || null, reasons: parseJson(row.reason_json, []), resolutionNote: row.resolution_note || null, evidenceRef: row.evidence_ref || null, createdBy: row.created_by, updatedBy: row.updated_by, acknowledgedAt: row.acknowledged_at || null, startedAt: row.started_at || null, resolvedAt: row.resolved_at || null, createdAt: row.created_at, updatedAt: row.updated_at }; }
function normalizedReasons(input) { const values = Array.isArray(input) ? input : [input]; const reasons = values.map((value) => String(value || "").trim()).filter(Boolean).slice(0, 20); if (!reasons.length) throw validationError("reasons must contain at least one explanation"); return reasons; }

export async function createSqliteRemediationTask(dbPath, input) {
  return withDatabase(dbPath, (db) => {
    const clientId = required(input?.clientId, "clientId");
    const wallId = required(input?.wallId, "wallId");
    const moduleId = required(input?.moduleId, "moduleId");
    const source = required(input?.source || "module-readiness", "source");
    const sourceKey = required(input?.sourceKey, "sourceKey");
    const priority = String(input?.priority || "normal").trim().toLowerCase();
    if (!priorities.has(priority)) throw validationError("priority must be critical, high, normal or low");
    const reasons = normalizedReasons(input?.reasons);
    const existing = db.prepare("SELECT * FROM ops_remediation_tasks WHERE module_id = ? AND source = ? AND source_key = ? AND status NOT IN ('resolved', 'cancelled') ORDER BY updated_at DESC LIMIT 1").get(moduleId, source, sourceKey);
    if (existing) return { duplicate: true, task: taskFromRow(existing) };
    const now = new Date().toISOString();
    const id = String(input?.id || `RMT-${Date.now()}-${randomUUID().slice(0, 8)}`).trim();
    const createdBy = required(input?.createdBy, "createdBy");
    const record = { id, clientId, wallId, moduleId, source, sourceKey, status: "open", priority, assignedTo: optional(input?.assignedTo), dueAt: optional(input?.dueAt), reasons, resolutionNote: null, evidenceRef: optional(input?.evidenceRef), createdBy, updatedBy: createdBy, acknowledgedAt: null, startedAt: null, resolvedAt: null, createdAt: now, updatedAt: now };
    try {
      db.prepare(`INSERT INTO ops_remediation_tasks (id,client_id,wall_id,module_id,source,source_key,status,priority,assigned_to,due_at,reason_json,resolution_note,evidence_ref,created_by,updated_by,acknowledged_at,started_at,resolved_at,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(record.id, record.clientId, record.wallId, record.moduleId, record.source, record.sourceKey, record.status, record.priority, record.assignedTo, record.dueAt, JSON.stringify(record.reasons), record.resolutionNote, record.evidenceRef, record.createdBy, record.updatedBy, record.acknowledgedAt, record.startedAt, record.resolvedAt, record.createdAt, record.updatedAt);
    } catch (error) {
      if (String(error?.message || "").includes("constraint failed")) throw validationError("remediation task references an unknown client, wall or module");
      throw error;
    }
    return { duplicate: false, task: taskFromRow(db.prepare("SELECT * FROM ops_remediation_tasks WHERE id = ?").get(record.id)) };
  });
}

export async function listSqliteRemediationTasks(dbPath, { clientIds = null, statuses: requestedStatuses = null, moduleId = null, limit = 100 } = {}) {
  return withDatabase(dbPath, (db) => {
    const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 500);
    const requestedStatusList = Array.isArray(requestedStatuses) ? requestedStatuses.filter((value) => statuses.has(value)) : [];
    const statusList = requestedStatusList.length ? requestedStatusList : Array.from(statuses);
    const clauses = [`status IN (${statusList.map(() => "?").join(",")})`];
    const params = [...statusList];
    if (moduleId) { clauses.push("module_id = ?"); params.push(String(moduleId)); }
    if (clientIds && !clientIds.includes("*")) { if (clientIds.length) { clauses.push(`client_id IN (${clientIds.map(() => "?").join(",")})`); params.push(...clientIds); } else clauses.push("1 = 0"); }
    params.push(safeLimit);
    return db.prepare(`SELECT * FROM ops_remediation_tasks WHERE ${clauses.join(" AND ")} ORDER BY CASE priority WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'normal' THEN 3 ELSE 4 END, updated_at DESC, id ASC LIMIT ?`).all(...params).map(taskFromRow);
  });
}

export async function readSqliteRemediationTask(dbPath, id) {
  return withDatabase(dbPath, (db) => {
    const row = db.prepare("SELECT * FROM ops_remediation_tasks WHERE id = ?").get(String(id));
    return row ? taskFromRow(row) : null;
  });
}

export async function updateSqliteRemediationTask(dbPath, id, input) {
  return withDatabase(dbPath, (db) => {
    const existing = db.prepare("SELECT * FROM ops_remediation_tasks WHERE id = ?").get(String(id));
    if (!existing) throw validationError("remediation task not found", 404);
    const status = String(input?.status || existing.status).trim().toLowerCase();
    if (!statuses.has(status) || !transitions[existing.status]?.has(status)) throw validationError(`cannot move remediation task from ${existing.status} to ${status}`);
    const priority = String(input?.priority || existing.priority).trim().toLowerCase();
    if (!priorities.has(priority)) throw validationError("priority must be critical, high, normal or low");
    const assignedTo = input?.assignedTo === undefined ? (existing.assigned_to || null) : optional(input.assignedTo);
    if (["assigned", "in_progress"].includes(status) && !assignedTo) throw validationError(`${status} tasks require assignedTo`);
    const resolutionNote = input?.resolutionNote === undefined ? (existing.resolution_note || null) : optional(input.resolutionNote);
    const evidenceRef = input?.evidenceRef === undefined ? (existing.evidence_ref || null) : optional(input.evidenceRef);
    if (status === "resolved" && !resolutionNote && !evidenceRef) throw validationError("resolved tasks require resolutionNote or evidenceRef");
    const updatedBy = required(input?.updatedBy, "updatedBy");
    const now = new Date().toISOString();
    const acknowledgedAt = existing.acknowledged_at || (status !== "open" ? now : null);
    const startedAt = existing.started_at || (["in_progress", "resolved"].includes(status) ? now : null);
    const resolvedAt = status === "resolved" ? (existing.resolved_at || now) : null;
    db.prepare("UPDATE ops_remediation_tasks SET status = ?, priority = ?, assigned_to = ?, due_at = ?, resolution_note = ?, evidence_ref = ?, updated_by = ?, acknowledged_at = ?, started_at = ?, resolved_at = ?, updated_at = ? WHERE id = ?").run(status, priority, assignedTo, input?.dueAt === undefined ? (existing.due_at || null) : optional(input.dueAt), resolutionNote, evidenceRef, updatedBy, acknowledgedAt, startedAt, resolvedAt, now, String(id));
    return { task: taskFromRow(db.prepare("SELECT * FROM ops_remediation_tasks WHERE id = ?").get(String(id))) };
  });
}

export async function readSqliteRemediationStorageHealth(dbPath) {
  return withDatabase(dbPath, (db) => {
    const status = db.prepare("SELECT status, COUNT(*) AS count FROM ops_remediation_tasks GROUP BY status ORDER BY status").all();
    const counts = Object.fromEntries([...statuses].map((value) => [value, 0]));
    for (const row of status) counts[row.status] = Number(row.count);
    return { backend: "sqlite", migrationVersion: remediationMigrationVersion, tables: ["ops_remediation_tasks"], counts: { ...counts, total: Object.values(counts).reduce((sum, value) => sum + value, 0) }, relationshipIntegrity: { foreignKeysEnabled: db.prepare("PRAGMA foreign_keys").get().foreign_keys === 1, foreignKeyIssues: db.prepare("PRAGMA foreign_key_check").all().length } };
  });
}
