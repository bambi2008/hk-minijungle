import { mkdir } from "node:fs/promises";
import { DatabaseSync } from "node:sqlite";
import { dirname } from "node:path";
import {
  clientFeedbackMigrationVersion,
  normalizeClientServiceFeedback,
  normalizeClientServiceFeedbackReview,
  summarizeClientServiceFeedback
} from "./ops-client-feedback-policy.mjs";

function parseJson(value, fallback) {
  try { return JSON.parse(value || ""); } catch { return fallback; }
}
function feedbackFromRow(row) {
  return row ? {
    id: row.id,
    clientId: row.client_id,
    serviceRef: row.service_ref,
    rating: Number(row.rating),
    outcome: row.outcome,
    followUpRequired: Boolean(row.follow_up_required),
    comment: row.comment,
    source: row.source,
    status: row.status,
    submittedBy: row.submitted_by,
    submittedAt: row.submitted_at,
    updatedAt: row.updated_at,
    reviewedBy: row.reviewed_by || null,
    reviewedAt: row.reviewed_at || null,
    reviewNote: row.review_note || null
  } : null;
}
function feedbackError(message, code, status = 400) {
  const error = new Error(message); error.code = code; error.status = status; return error;
}
let databaseQueue = Promise.resolve();
let initializedDbPath = null;
function initialize(db) {
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY, applied_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS ops_client_service_feedback (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL REFERENCES clients(id) ON UPDATE CASCADE ON DELETE RESTRICT,
      service_ref TEXT NOT NULL,
      rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
      outcome TEXT NOT NULL CHECK (outcome IN ('satisfied','partially_satisfied','follow_up_required')),
      follow_up_required INTEGER NOT NULL DEFAULT 0 CHECK (follow_up_required IN (0,1)),
      comment TEXT NOT NULL,
      source TEXT NOT NULL CHECK (source IN ('portal','ops','import')),
      status TEXT NOT NULL CHECK (status IN ('submitted','acknowledged','closed')),
      submitted_by TEXT NOT NULL,
      submitted_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      reviewed_by TEXT,
      reviewed_at TEXT,
      review_note TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_client_feedback_scope_time ON ops_client_service_feedback(client_id, submitted_at DESC, id DESC);
    CREATE INDEX IF NOT EXISTS idx_client_feedback_status ON ops_client_service_feedback(status, follow_up_required, submitted_at DESC);
  `);
  db.prepare("INSERT OR IGNORE INTO schema_migrations(version, applied_at) VALUES (?, ?)").run(clientFeedbackMigrationVersion, new Date().toISOString());
}
async function withDatabase(dbPath, callback) {
  const operation = databaseQueue.then(async () => {
    await mkdir(dirname(dbPath), { recursive: true });
    const db = new DatabaseSync(dbPath);
    try {
      if (initializedDbPath !== dbPath) { initialize(db); initializedDbPath = dbPath; }
      return await callback(db);
    } finally { db.close(); }
  });
  databaseQueue = operation.catch(() => {});
  return operation;
}

export async function createSqliteClientServiceFeedback(dbPath, input) {
  const record = normalizeClientServiceFeedback(input);
  return withDatabase(dbPath, (db) => {
    const existing = db.prepare("SELECT * FROM ops_client_service_feedback WHERE id = ?").get(record.id);
    if (existing) return { duplicate: true, feedback: feedbackFromRow(existing) };
    db.prepare(`INSERT INTO ops_client_service_feedback (id,client_id,service_ref,rating,outcome,follow_up_required,comment,source,status,submitted_by,submitted_at,updated_at,reviewed_by,reviewed_at,review_note) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(record.id, record.clientId, record.serviceRef, record.rating, record.outcome, record.followUpRequired ? 1 : 0, record.comment, record.source, record.status, record.submittedBy, record.submittedAt, record.updatedAt, null, null, null);
    return { duplicate: false, feedback: feedbackFromRow(db.prepare("SELECT * FROM ops_client_service_feedback WHERE id = ?").get(record.id)) };
  });
}

export async function listSqliteClientServiceFeedback(dbPath, { clientIds = null, statuses = null, limit = 100 } = {}) {
  return withDatabase(dbPath, (db) => {
    const clauses = ["1=1"]; const params = [];
    if (clientIds && !clientIds.includes("*")) {
      if (!clientIds.length) clauses.push("1=0");
      else { clauses.push(`client_id IN (${clientIds.map(() => "?").join(",")})`); params.push(...clientIds); }
    }
    if (Array.isArray(statuses) && statuses.length) { clauses.push(`status IN (${statuses.map(() => "?").join(",")})`); params.push(...statuses); }
    const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 500); params.push(safeLimit);
    return db.prepare(`SELECT * FROM ops_client_service_feedback WHERE ${clauses.join(" AND ")} ORDER BY submitted_at DESC,id DESC LIMIT ?`).all(...params).map(feedbackFromRow);
  });
}

export async function readSqliteClientServiceFeedback(dbPath, id) {
  return withDatabase(dbPath, (db) => feedbackFromRow(db.prepare("SELECT * FROM ops_client_service_feedback WHERE id = ?").get(String(id))));
}

export async function reviewSqliteClientServiceFeedback(dbPath, id, input) {
  return withDatabase(dbPath, (db) => {
    const existing = feedbackFromRow(db.prepare("SELECT * FROM ops_client_service_feedback WHERE id = ?").get(String(id)));
    const review = normalizeClientServiceFeedbackReview(existing, input);
    const result = db.prepare("UPDATE ops_client_service_feedback SET status = ?, updated_at = ?, reviewed_by = ?, reviewed_at = ?, review_note = ? WHERE id = ? AND updated_at = ?").run(review.nextStatus, review.reviewedAt, review.reviewedBy, review.reviewedAt, review.reviewNote, String(id), review.expectedUpdatedAt);
    if (!result.changes) throw feedbackError("service feedback changed after this page loaded", "CLIENT_FEEDBACK_STALE", 409);
    return { feedback: feedbackFromRow(db.prepare("SELECT * FROM ops_client_service_feedback WHERE id = ?").get(String(id))) };
  });
}

export async function readSqliteClientServiceFeedbackHealth(dbPath) {
  return withDatabase(dbPath, (db) => {
    const rows = db.prepare("SELECT * FROM ops_client_service_feedback ORDER BY submitted_at DESC,id DESC").all().map(feedbackFromRow);
    const fk = Number(db.prepare("SELECT COUNT(*) AS count FROM ops_client_service_feedback f LEFT JOIN clients c ON c.id=f.client_id WHERE c.id IS NULL").get().count);
    return { backend: "sqlite", migrationVersion: clientFeedbackMigrationVersion, tables: ["ops_client_service_feedback"], counts: summarizeClientServiceFeedback(rows), relationshipIntegrity: { foreignKeyIssues: fk } };
  });
}
