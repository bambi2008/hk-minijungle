import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import { DatabaseSync } from "node:sqlite";
import { dirname } from "node:path";

export const remediationMigrationVersion = "2026-08-28.remediation-dispatch-sla-v1";
const statuses = new Set(["open", "assigned", "in_progress", "resolved", "cancelled"]);
const priorities = new Set(["critical", "high", "normal", "low"]);
const reviewStatuses = new Set(["not_submitted", "pending", "approved", "rejected"]);
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
      work_order_id TEXT,
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
      accepted_at TEXT,
      accepted_by TEXT,
      review_status TEXT NOT NULL DEFAULT 'not_submitted' CHECK (review_status IN ('not_submitted', 'pending', 'approved', 'rejected')),
      submitted_at TEXT,
      submitted_by TEXT,
      reviewed_at TEXT,
      reviewed_by TEXT,
      review_note TEXT,
      escalation_level INTEGER NOT NULL DEFAULT 0 CHECK (escalation_level BETWEEN 0 AND 3),
      escalated_at TEXT,
      escalation_reason TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON UPDATE CASCADE ON DELETE RESTRICT,
      FOREIGN KEY (wall_id) REFERENCES living_assets(id) ON UPDATE CASCADE ON DELETE RESTRICT,
      FOREIGN KEY (work_order_id) REFERENCES work_orders(id) ON UPDATE CASCADE ON DELETE RESTRICT,
      FOREIGN KEY (module_id) REFERENCES asset_modules(id) ON UPDATE CASCADE ON DELETE RESTRICT
    );
    CREATE INDEX IF NOT EXISTS idx_remediation_scope_status ON ops_remediation_tasks(client_id, wall_id, module_id, status, priority);
    CREATE INDEX IF NOT EXISTS idx_remediation_due ON ops_remediation_tasks(status, due_at);
    CREATE INDEX IF NOT EXISTS idx_remediation_updated ON ops_remediation_tasks(updated_at DESC, id ASC);
  `);
  const columns = new Set(db.prepare("PRAGMA table_info(ops_remediation_tasks)").all().map((row) => row.name));
  if (!columns.has("work_order_id")) {
    db.exec("ALTER TABLE ops_remediation_tasks ADD COLUMN work_order_id TEXT REFERENCES work_orders(id) ON UPDATE CASCADE ON DELETE RESTRICT");
  }
  if (!columns.has("accepted_at")) db.exec("ALTER TABLE ops_remediation_tasks ADD COLUMN accepted_at TEXT");
  if (!columns.has("accepted_by")) db.exec("ALTER TABLE ops_remediation_tasks ADD COLUMN accepted_by TEXT");
  if (!columns.has("review_status")) db.exec("ALTER TABLE ops_remediation_tasks ADD COLUMN review_status TEXT NOT NULL DEFAULT 'not_submitted' CHECK (review_status IN ('not_submitted', 'pending', 'approved', 'rejected'))");
  if (!columns.has("submitted_at")) db.exec("ALTER TABLE ops_remediation_tasks ADD COLUMN submitted_at TEXT");
  if (!columns.has("submitted_by")) db.exec("ALTER TABLE ops_remediation_tasks ADD COLUMN submitted_by TEXT");
  if (!columns.has("reviewed_at")) db.exec("ALTER TABLE ops_remediation_tasks ADD COLUMN reviewed_at TEXT");
  if (!columns.has("reviewed_by")) db.exec("ALTER TABLE ops_remediation_tasks ADD COLUMN reviewed_by TEXT");
  if (!columns.has("review_note")) db.exec("ALTER TABLE ops_remediation_tasks ADD COLUMN review_note TEXT");
  if (!columns.has("escalation_level")) db.exec("ALTER TABLE ops_remediation_tasks ADD COLUMN escalation_level INTEGER NOT NULL DEFAULT 0 CHECK (escalation_level BETWEEN 0 AND 3)");
  if (!columns.has("escalated_at")) db.exec("ALTER TABLE ops_remediation_tasks ADD COLUMN escalated_at TEXT");
  if (!columns.has("escalation_reason")) db.exec("ALTER TABLE ops_remediation_tasks ADD COLUMN escalation_reason TEXT");
  db.exec("CREATE INDEX IF NOT EXISTS idx_remediation_work_order ON ops_remediation_tasks(work_order_id)");
  db.exec("CREATE INDEX IF NOT EXISTS idx_remediation_review ON ops_remediation_tasks(review_status, updated_at DESC)");
  db.exec("CREATE INDEX IF NOT EXISTS idx_remediation_dispatch ON ops_remediation_tasks(status, assigned_to, due_at, escalation_level)");
  db.prepare("INSERT OR IGNORE INTO schema_migrations (version, applied_at) VALUES (?, ?)").run(remediationMigrationVersion, new Date().toISOString());
}
function taskFromRow(row) { return { id: row.id, clientId: row.client_id, wallId: row.wall_id, workOrderId: row.work_order_id || null, moduleId: row.module_id, source: row.source, sourceKey: row.source_key, status: row.status, priority: row.priority, assignedTo: row.assigned_to || null, dueAt: row.due_at || null, reasons: parseJson(row.reason_json, []), resolutionNote: row.resolution_note || null, evidenceRef: row.evidence_ref || null, createdBy: row.created_by, updatedBy: row.updated_by, acknowledgedAt: row.acknowledged_at || null, startedAt: row.started_at || null, resolvedAt: row.resolved_at || null, acceptedAt: row.accepted_at || null, acceptedBy: row.accepted_by || null, reviewStatus: row.review_status || "not_submitted", submittedAt: row.submitted_at || null, submittedBy: row.submitted_by || null, reviewedAt: row.reviewed_at || null, reviewedBy: row.reviewed_by || null, reviewNote: row.review_note || null, escalationLevel: Number(row.escalation_level || 0), escalatedAt: row.escalated_at || null, escalationReason: row.escalation_reason || null, createdAt: row.created_at, updatedAt: row.updated_at }; }
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
    const record = { id, clientId, wallId, workOrderId: optional(input?.workOrderId), moduleId, source, sourceKey, status: "open", priority, assignedTo: optional(input?.assignedTo), dueAt: optional(input?.dueAt), reasons, resolutionNote: null, evidenceRef: optional(input?.evidenceRef), createdBy, updatedBy: createdBy, acknowledgedAt: null, startedAt: null, resolvedAt: null, acceptedAt: null, acceptedBy: null, reviewStatus: "not_submitted", submittedAt: null, submittedBy: null, reviewedAt: null, reviewedBy: null, reviewNote: null, escalationLevel: 0, escalatedAt: null, escalationReason: null, createdAt: now, updatedAt: now };
    try {
      db.prepare(`INSERT INTO ops_remediation_tasks (id,client_id,wall_id,work_order_id,module_id,source,source_key,status,priority,assigned_to,due_at,reason_json,resolution_note,evidence_ref,created_by,updated_by,acknowledged_at,started_at,resolved_at,accepted_at,accepted_by,review_status,submitted_at,submitted_by,reviewed_at,reviewed_by,review_note,escalation_level,escalated_at,escalation_reason,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(record.id, record.clientId, record.wallId, record.workOrderId, record.moduleId, record.source, record.sourceKey, record.status, record.priority, record.assignedTo, record.dueAt, JSON.stringify(record.reasons), record.resolutionNote, record.evidenceRef, record.createdBy, record.updatedBy, record.acknowledgedAt, record.startedAt, record.resolvedAt, record.acceptedAt, record.acceptedBy, record.reviewStatus, record.submittedAt, record.submittedBy, record.reviewedAt, record.reviewedBy, record.reviewNote, record.escalationLevel, record.escalatedAt, record.escalationReason, record.createdAt, record.updatedAt);
    } catch (error) {
      if (String(error?.message || "").includes("constraint failed")) throw validationError("remediation task references an unknown client, wall, work order or module");
      throw error;
    }
    return { duplicate: false, task: taskFromRow(db.prepare("SELECT * FROM ops_remediation_tasks WHERE id = ?").get(record.id)) };
  });
}

export async function listSqliteRemediationTasks(dbPath, { clientIds = null, statuses: requestedStatuses = null, moduleId = null, assignedTo = null, reviewStatuses: requestedReviewStatuses = null, priorities: requestedPriorities = null, dueBefore = null, before = null, beforeId = null, orderBy = "priority", limit = 100 } = {}) {
  return withDatabase(dbPath, (db) => {
    const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 500);
    const requestedStatusList = Array.isArray(requestedStatuses) ? requestedStatuses.filter((value) => statuses.has(value)) : [];
    const statusList = requestedStatusList.length ? requestedStatusList : Array.from(statuses);
    const clauses = [`status IN (${statusList.map(() => "?").join(",")})`];
    const params = [...statusList];
    if (moduleId) { clauses.push("module_id = ?"); params.push(String(moduleId)); }
    if (assignedTo === "__unassigned__") clauses.push("assigned_to IS NULL");
    else if (assignedTo) { clauses.push("assigned_to = ?"); params.push(String(assignedTo)); }
    const reviewStatusList = Array.isArray(requestedReviewStatuses) ? requestedReviewStatuses.filter((value) => reviewStatuses.has(value)) : [];
    if (reviewStatusList.length) { clauses.push(`review_status IN (${reviewStatusList.map(() => "?").join(",")})`); params.push(...reviewStatusList); }
    const priorityList = Array.isArray(requestedPriorities) ? requestedPriorities.filter((value) => priorities.has(value)) : [];
    if (priorityList.length) { clauses.push(`priority IN (${priorityList.map(() => "?").join(",")})`); params.push(...priorityList); }
    if (dueBefore) { clauses.push("due_at IS NOT NULL AND due_at <= ?"); params.push(String(dueBefore)); }
    if (clientIds && !clientIds.includes("*")) { if (clientIds.length) { clauses.push(`client_id IN (${clientIds.map(() => "?").join(",")})`); params.push(...clientIds); } else clauses.push("1 = 0"); }
    if (orderBy === "updated" && before && beforeId) { clauses.push("(updated_at < ? OR (updated_at = ? AND id > ?))"); params.push(String(before), String(before), String(beforeId)); }
    params.push(safeLimit);
    const ordering = orderBy === "updated" ? "updated_at DESC, id ASC" : "CASE priority WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'normal' THEN 3 ELSE 4 END, updated_at DESC, id ASC";
    return db.prepare(`SELECT * FROM ops_remediation_tasks WHERE ${clauses.join(" AND ")} ORDER BY ${ordering} LIMIT ?`).all(...params).map(taskFromRow);
  });
}

export async function markSqliteRemediationEscalation(dbPath, id, { level, reason, escalatedAt = new Date().toISOString(), updatedBy = "system:sla" } = {}) {
  return withDatabase(dbPath, (db) => {
    const safeLevel = Number(level);
    if (!Number.isInteger(safeLevel) || safeLevel < 1 || safeLevel > 3) throw validationError("escalation level must be 1, 2 or 3");
    const result = db.prepare("UPDATE ops_remediation_tasks SET escalation_level = ?, escalated_at = ?, escalation_reason = ?, updated_by = ?, updated_at = ? WHERE id = ? AND status IN ('open','assigned','in_progress') AND escalation_level < ?").run(safeLevel, required(escalatedAt, "escalatedAt"), required(reason, "reason"), required(updatedBy, "updatedBy"), required(escalatedAt, "escalatedAt"), String(id), safeLevel);
    if (!result.changes) return null;
    return taskFromRow(db.prepare("SELECT * FROM ops_remediation_tasks WHERE id = ?").get(String(id)));
  });
}

export async function readSqliteRemediationDispatchSummary(dbPath, { clientIds = null, assignedTo = null, now = new Date().toISOString() } = {}) {
  return withDatabase(dbPath, (db) => {
    const clauses = ["status IN ('open','assigned','in_progress')"];
    const params = [String(now)];
    if (assignedTo) { clauses.push("assigned_to = ?"); params.push(String(assignedTo)); }
    if (clientIds && !clientIds.includes("*")) { if (clientIds.length) { clauses.push(`client_id IN (${clientIds.map(() => "?").join(",")})`); params.push(...clientIds); } else clauses.push("1 = 0"); }
    const row = db.prepare(`SELECT COUNT(*) AS active, SUM(CASE WHEN assigned_to IS NULL THEN 1 ELSE 0 END) AS unassigned, SUM(CASE WHEN review_status='pending' THEN 1 ELSE 0 END) AS pending_review, SUM(CASE WHEN due_at IS NOT NULL AND due_at <= ? THEN 1 ELSE 0 END) AS overdue, SUM(CASE WHEN escalation_level > 0 THEN 1 ELSE 0 END) AS escalated FROM ops_remediation_tasks WHERE ${clauses.join(" AND ")}`).get(...params);
    return { active: Number(row.active || 0), unassigned: Number(row.unassigned || 0), pendingReview: Number(row.pending_review || 0), overdue: Number(row.overdue || 0), escalated: Number(row.escalated || 0) };
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
    const expectedUpdatedAt = optional(input?.expectedUpdatedAt);
    if (expectedUpdatedAt && existing.updated_at !== expectedUpdatedAt) throw validationError("remediation task changed after it was loaded", 409);
    const submitForReview = input?.submitForReview === true;
    const reviewDecision = optional(input?.reviewDecision)?.toLowerCase() || null;
    if (reviewDecision && !["approved", "rejected"].includes(reviewDecision)) throw validationError("reviewDecision must be approved or rejected");
    if (submitForReview && reviewDecision) throw validationError("submitForReview and reviewDecision cannot be applied together");
    let status = String(input?.status || existing.status).trim().toLowerCase();
    if (submitForReview) status = "in_progress";
    if (reviewDecision === "approved") status = "resolved";
    if (reviewDecision === "rejected") status = "assigned";
    if (!statuses.has(status) || !transitions[existing.status]?.has(status)) throw validationError(`cannot move remediation task from ${existing.status} to ${status}`);
    const priority = String(input?.priority || existing.priority).trim().toLowerCase();
    if (!priorities.has(priority)) throw validationError("priority must be critical, high, normal or low");
    const assignedTo = input?.assignedTo === undefined ? (existing.assigned_to || null) : optional(input.assignedTo);
    if (["assigned", "in_progress"].includes(status) && !assignedTo) throw validationError(`${status} tasks require assignedTo`);
    const resolutionNote = input?.resolutionNote === undefined ? (existing.resolution_note || null) : optional(input.resolutionNote);
    const evidenceRef = input?.evidenceRef === undefined ? (existing.evidence_ref || null) : optional(input.evidenceRef);
    if (submitForReview && !resolutionNote && !evidenceRef) throw validationError("review submission requires resolutionNote or evidenceRef");
    if (reviewDecision && existing.review_status !== "pending") throw validationError("only pending remediation submissions can be reviewed");
    if (status === "resolved" && reviewDecision !== "approved" && existing.review_status !== "approved") throw validationError("remediation tasks can only be resolved by an approved FM review");
    const updatedBy = required(input?.updatedBy, "updatedBy");
    const now = new Date().toISOString();
    const dueAt = input?.dueAt === undefined ? (existing.due_at || null) : optional(input.dueAt);
    const dueChanged = input?.dueAt !== undefined && dueAt !== (existing.due_at || null);
    const acknowledgedAt = existing.acknowledged_at || (status !== "open" ? now : null);
    const startedAt = existing.started_at || (["in_progress", "resolved"].includes(status) ? now : null);
    const resolvedAt = status === "resolved" ? (existing.resolved_at || now) : null;
    const acceptedBy = existing.accepted_by || (status === "in_progress" && input?.acceptedBy ? required(input.acceptedBy, "acceptedBy") : null);
    const acceptedAt = existing.accepted_at || (acceptedBy ? now : null);
    let reviewStatus = existing.review_status || "not_submitted";
    let submittedAt = existing.submitted_at || null;
    let submittedBy = existing.submitted_by || null;
    let reviewedAt = existing.reviewed_at || null;
    let reviewedBy = existing.reviewed_by || null;
    let reviewNote = existing.review_note || null;
    if (submitForReview) {
      submittedBy = required(input?.submittedBy, "submittedBy");
      reviewStatus = "pending";
      submittedAt = now;
      reviewedAt = null;
      reviewedBy = null;
      reviewNote = null;
    }
    if (reviewDecision) {
      reviewedBy = required(input?.reviewedBy, "reviewedBy");
      reviewNote = required(input?.reviewNote, "reviewNote");
      reviewStatus = reviewDecision;
      reviewedAt = now;
    }
    const update = expectedUpdatedAt
      ? db.prepare("UPDATE ops_remediation_tasks SET status = ?, priority = ?, assigned_to = ?, due_at = ?, resolution_note = ?, evidence_ref = ?, updated_by = ?, acknowledged_at = ?, started_at = ?, resolved_at = ?, accepted_at = ?, accepted_by = ?, review_status = ?, submitted_at = ?, submitted_by = ?, reviewed_at = ?, reviewed_by = ?, review_note = ?, escalation_level = ?, escalated_at = ?, escalation_reason = ?, updated_at = ? WHERE id = ? AND updated_at = ?").run(status, priority, assignedTo, dueAt, resolutionNote, evidenceRef, updatedBy, acknowledgedAt, startedAt, resolvedAt, acceptedAt, acceptedBy, reviewStatus, submittedAt, submittedBy, reviewedAt, reviewedBy, reviewNote, dueChanged ? 0 : Number(existing.escalation_level || 0), dueChanged ? null : (existing.escalated_at || null), dueChanged ? null : (existing.escalation_reason || null), now, String(id), expectedUpdatedAt)
      : db.prepare("UPDATE ops_remediation_tasks SET status = ?, priority = ?, assigned_to = ?, due_at = ?, resolution_note = ?, evidence_ref = ?, updated_by = ?, acknowledged_at = ?, started_at = ?, resolved_at = ?, accepted_at = ?, accepted_by = ?, review_status = ?, submitted_at = ?, submitted_by = ?, reviewed_at = ?, reviewed_by = ?, review_note = ?, escalation_level = ?, escalated_at = ?, escalation_reason = ?, updated_at = ? WHERE id = ?").run(status, priority, assignedTo, dueAt, resolutionNote, evidenceRef, updatedBy, acknowledgedAt, startedAt, resolvedAt, acceptedAt, acceptedBy, reviewStatus, submittedAt, submittedBy, reviewedAt, reviewedBy, reviewNote, dueChanged ? 0 : Number(existing.escalation_level || 0), dueChanged ? null : (existing.escalated_at || null), dueChanged ? null : (existing.escalation_reason || null), now, String(id));
    if (!update.changes) throw validationError("remediation task changed during update", 409);
    return { task: taskFromRow(db.prepare("SELECT * FROM ops_remediation_tasks WHERE id = ?").get(String(id))) };
  });
}

export async function readSqliteRemediationStorageHealth(dbPath) {
  return withDatabase(dbPath, (db) => {
    const status = db.prepare("SELECT status, COUNT(*) AS count FROM ops_remediation_tasks GROUP BY status ORDER BY status").all();
    const counts = Object.fromEntries([...statuses].map((value) => [value, 0]));
    for (const row of status) counts[row.status] = Number(row.count);
    const relationshipTablesReady = Number(db.prepare("SELECT COUNT(*) AS count FROM sqlite_master WHERE type = 'table' AND name IN ('work_orders', 'asset_modules')").get().count) === 2;
    const workOrderScopeIssues = relationshipTablesReady ? db.prepare("SELECT COUNT(*) AS count FROM ops_remediation_tasks t LEFT JOIN work_orders w ON w.id = t.work_order_id LEFT JOIN asset_modules m ON m.id = t.module_id WHERE t.work_order_id IS NOT NULL AND (w.id IS NULL OR w.wall_id <> t.wall_id OR m.asset_id <> t.wall_id)").get().count : 0;
    return { backend: "sqlite", migrationVersion: remediationMigrationVersion, tables: ["ops_remediation_tasks"], counts: { ...counts, total: Object.values(counts).reduce((sum, value) => sum + value, 0) }, relationshipIntegrity: { foreignKeysEnabled: db.prepare("PRAGMA foreign_keys").get().foreign_keys === 1, foreignKeyIssues: db.prepare("PRAGMA foreign_key_check").all().length, workOrderScopeIssues: Number(workOrderScopeIssues) } };
  });
}
