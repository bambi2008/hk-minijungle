import { getPostgresPool } from "./ops-postgres-store.mjs";
import {
  normalizeClientServiceFeedback,
  normalizeClientServiceFeedbackReview,
  postgresClientFeedbackMigrationVersion,
  summarizeClientServiceFeedback
} from "./ops-client-feedback-policy.mjs";

function iso(value) { return value?.toISOString?.() || value; }
function feedbackFromRow(row) {
  return row ? { id: row.id, clientId: row.client_id, serviceRef: row.service_ref, rating: Number(row.rating), outcome: row.outcome, followUpRequired: Boolean(row.follow_up_required), comment: row.comment, source: row.source, status: row.status, submittedBy: row.submitted_by, submittedAt: iso(row.submitted_at), updatedAt: iso(row.updated_at), reviewedBy: row.reviewed_by || null, reviewedAt: iso(row.reviewed_at) || null, reviewNote: row.review_note || null } : null;
}
function feedbackError(message, code, status = 400) { const error = new Error(message); error.code = code; error.status = status; return error; }
async function initialize(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL);
    CREATE TABLE IF NOT EXISTS ops_client_service_feedback (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL REFERENCES clients(id) ON UPDATE CASCADE ON DELETE RESTRICT,
      service_ref TEXT NOT NULL,
      rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
      outcome TEXT NOT NULL CHECK (outcome IN ('satisfied','partially_satisfied','follow_up_required')),
      follow_up_required BOOLEAN NOT NULL DEFAULT FALSE,
      comment TEXT NOT NULL,
      source TEXT NOT NULL CHECK (source IN ('portal','ops','import')),
      status TEXT NOT NULL CHECK (status IN ('submitted','acknowledged','closed')),
      submitted_by TEXT NOT NULL,
      submitted_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL,
      reviewed_by TEXT,
      reviewed_at TIMESTAMPTZ,
      review_note TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_pg_client_feedback_scope_time ON ops_client_service_feedback(client_id, submitted_at DESC, id DESC);
    CREATE INDEX IF NOT EXISTS idx_pg_client_feedback_status ON ops_client_service_feedback(status, follow_up_required, submitted_at DESC);
    INSERT INTO schema_migrations(version, applied_at) VALUES($1,NOW()) ON CONFLICT(version) DO NOTHING;
  `, [postgresClientFeedbackMigrationVersion]);
}

export async function createPostgresClientServiceFeedback(dbPath, input) {
  const record = normalizeClientServiceFeedback(input); const pool = getPostgresPool(); await initialize(pool);
  const existing = await pool.query("SELECT * FROM ops_client_service_feedback WHERE id=$1", [record.id]);
  if (existing.rows[0]) return { duplicate: true, feedback: feedbackFromRow(existing.rows[0]) };
  const result = await pool.query("INSERT INTO ops_client_service_feedback(id,client_id,service_ref,rating,outcome,follow_up_required,comment,source,status,submitted_by,submitted_at,updated_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *", [record.id, record.clientId, record.serviceRef, record.rating, record.outcome, record.followUpRequired, record.comment, record.source, record.status, record.submittedBy, record.submittedAt, record.updatedAt]);
  return { duplicate: false, feedback: feedbackFromRow(result.rows[0]) };
}

export async function listPostgresClientServiceFeedback(dbPath, { clientIds = null, statuses = null, limit = 100 } = {}) {
  const pool = getPostgresPool(); await initialize(pool); const clauses = ["TRUE"]; const values = [];
  if (clientIds && !clientIds.includes("*")) { values.push(clientIds); clauses.push(`client_id=ANY($${values.length}::text[])`); }
  if (Array.isArray(statuses) && statuses.length) { values.push(statuses); clauses.push(`status=ANY($${values.length}::text[])`); }
  const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 500); values.push(safeLimit);
  const result = await pool.query(`SELECT * FROM ops_client_service_feedback WHERE ${clauses.join(" AND ")} ORDER BY submitted_at DESC,id DESC LIMIT $${values.length}`, values);
  return result.rows.map(feedbackFromRow);
}

export async function readPostgresClientServiceFeedback(dbPath, id) { const pool = getPostgresPool(); await initialize(pool); const result = await pool.query("SELECT * FROM ops_client_service_feedback WHERE id=$1", [String(id)]); return feedbackFromRow(result.rows[0]); }

export async function reviewPostgresClientServiceFeedback(dbPath, id, input) {
  const pool = getPostgresPool(); await initialize(pool); const current = await readPostgresClientServiceFeedback(dbPath, id); const review = normalizeClientServiceFeedbackReview(current, input);
  const result = await pool.query("UPDATE ops_client_service_feedback SET status=$1,updated_at=$2,reviewed_by=$3,reviewed_at=$4,review_note=$5 WHERE id=$6 AND updated_at=$7 RETURNING *", [review.nextStatus, review.reviewedAt, review.reviewedBy, review.reviewedAt, review.reviewNote, String(id), review.expectedUpdatedAt]);
  if (!result.rows[0]) throw feedbackError("service feedback changed after this page loaded", "CLIENT_FEEDBACK_STALE", 409);
  return { feedback: feedbackFromRow(result.rows[0]) };
}

export async function readPostgresClientServiceFeedbackHealth(dbPath) {
  const pool = getPostgresPool(); await initialize(pool); const [rows, integrity] = await Promise.all([pool.query("SELECT * FROM ops_client_service_feedback ORDER BY submitted_at DESC,id DESC"), pool.query("SELECT COUNT(*)::int AS count FROM ops_client_service_feedback f LEFT JOIN clients c ON c.id=f.client_id WHERE c.id IS NULL")]);
  const feedback = rows.rows.map(feedbackFromRow);
  return { backend: "postgresql", migrationVersion: postgresClientFeedbackMigrationVersion, tables: ["ops_client_service_feedback"], counts: summarizeClientServiceFeedback(feedback), relationshipIntegrity: { foreignKeyIssues: Number(integrity.rows[0].count) } };
}
