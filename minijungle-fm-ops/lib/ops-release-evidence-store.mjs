import { mkdir } from "node:fs/promises";
import { DatabaseSync } from "node:sqlite";
import { dirname } from "node:path";
import {
  normalizeReleaseEvidenceReview,
  normalizeReleaseEvidenceSubmission,
  releaseEvidenceMigrationVersion,
  releaseEvidenceRequirements,
  releaseEvidenceState
} from "./ops-release-evidence-policy.mjs";

function storeError(message, code = "RELEASE_EVIDENCE_STORE_ERROR", status = 400) { const error = new Error(message); error.code = code; error.status = status; return error; }
function withDatabase(dbPath, callback) { return (async () => { await mkdir(dirname(dbPath), { recursive: true }); const db = new DatabaseSync(dbPath); try { initialize(db); return callback(db); } finally { db.close(); } })(); }
function initialize(db) {
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY, applied_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS ops_release_evidence_requirements (
      requirement_key TEXT PRIMARY KEY, label TEXT NOT NULL, description TEXT NOT NULL,
      hard_cap INTEGER NOT NULL CHECK (hard_cap BETWEEN 0 AND 100), updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS ops_release_evidence_records (
      id TEXT PRIMARY KEY, requirement_key TEXT NOT NULL REFERENCES ops_release_evidence_requirements(requirement_key) ON UPDATE CASCADE ON DELETE RESTRICT,
      status TEXT NOT NULL CHECK (status IN ('submitted','verified','rejected')),
      artifact_ref TEXT NOT NULL, artifact_sha256 TEXT NOT NULL,
      observed_at TEXT NOT NULL, expires_at TEXT, note TEXT NOT NULL,
      submitted_by TEXT NOT NULL, submitted_at TEXT NOT NULL,
      reviewed_by TEXT, reviewed_at TEXT, review_note TEXT,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_release_evidence_requirement ON ops_release_evidence_records(requirement_key, submitted_at DESC, id DESC);
    CREATE INDEX IF NOT EXISTS idx_release_evidence_status ON ops_release_evidence_records(status, updated_at DESC);
    CREATE TABLE IF NOT EXISTS ops_release_evidence_events (
      id TEXT PRIMARY KEY, evidence_id TEXT NOT NULL REFERENCES ops_release_evidence_records(id) ON UPDATE CASCADE ON DELETE RESTRICT,
      type TEXT NOT NULL CHECK (type IN ('submitted','verified','rejected')),
      actor TEXT NOT NULL, note TEXT NOT NULL, occurred_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_release_evidence_events_record ON ops_release_evidence_events(evidence_id, occurred_at DESC);
  `);
  const now = new Date().toISOString();
  const insert = db.prepare("INSERT INTO ops_release_evidence_requirements(requirement_key,label,description,hard_cap,updated_at) VALUES(?,?,?,?,?) ON CONFLICT(requirement_key) DO UPDATE SET label=excluded.label,description=excluded.description,hard_cap=excluded.hard_cap,updated_at=excluded.updated_at");
  for (const requirement of releaseEvidenceRequirements) insert.run(requirement.key, requirement.label, requirement.description, requirement.hardCap, now);
  db.prepare("INSERT OR IGNORE INTO schema_migrations(version,applied_at) VALUES(?,?)").run(releaseEvidenceMigrationVersion, now);
}
function parse(value, fallback = null) { try { return JSON.parse(value); } catch { return fallback; } }
function recordFromRow(row) {
  if (!row) return null;
  return { id: row.id, requirementKey: row.requirement_key, requirementLabel: row.requirement_label || null, status: row.status, artifactRef: row.artifact_ref, artifactSha256: row.artifact_sha256, observedAt: row.observed_at, expiresAt: row.expires_at || null, note: row.note, submittedBy: row.submitted_by, submittedAt: row.submitted_at, reviewedBy: row.reviewed_by || null, reviewedAt: row.reviewed_at || null, reviewNote: row.review_note || null, updatedAt: row.updated_at };
}
function recordRows(db) { return db.prepare("SELECT r.*,q.label AS requirement_label FROM ops_release_evidence_records r JOIN ops_release_evidence_requirements q ON q.requirement_key=r.requirement_key ORDER BY r.submitted_at DESC,r.id DESC").all(); }
function summaryFromRows(rows, now = new Date()) {
  const latestByRequirement = new Map();
  for (const row of rows) if (!latestByRequirement.has(row.requirement_key)) latestByRequirement.set(row.requirement_key, recordFromRow(row));
  const requirements = releaseEvidenceRequirements.map((requirement) => { const record = latestByRequirement.get(requirement.key) || null; return { ...requirement, state: releaseEvidenceState(record, now), latest: record }; });
  const verified = requirements.filter((item) => item.state === "verified").length;
  const expired = requirements.filter((item) => item.state === "expired").length;
  const submitted = requirements.filter((item) => item.state === "submitted").length;
  return { generatedAt: now.toISOString(), ready: verified === requirements.length, requiredCount: requirements.length, verifiedCount: verified, submittedCount: submitted, expiredCount: expired, missingCount: requirements.filter((item) => item.state === "missing").length, requirements };
}
function eventFromRow(row) { return { id: row.id, evidenceId: row.evidence_id, type: row.type, actor: row.actor, note: row.note, occurredAt: row.occurred_at }; }

export async function ensureSqliteReleaseEvidenceSchema(dbPath) { return withDatabase(dbPath, (db) => ({ migrationVersion: releaseEvidenceMigrationVersion, tables: ["ops_release_evidence_requirements", "ops_release_evidence_records", "ops_release_evidence_events"], required: releaseEvidenceRequirements.length, relationshipIntegrity: { foreignKeysEnabled: db.prepare("PRAGMA foreign_keys").get().foreign_keys === 1, foreignKeyIssues: db.prepare("PRAGMA foreign_key_check").all().length } })); }

export async function submitSqliteReleaseEvidence(dbPath, input) {
  return withDatabase(dbPath, (db) => {
    const record = normalizeReleaseEvidenceSubmission(input);
    const existing = db.prepare("SELECT r.*,q.label AS requirement_label FROM ops_release_evidence_records r JOIN ops_release_evidence_requirements q ON q.requirement_key=r.requirement_key WHERE r.id=?").get(record.id);
    if (existing) return { duplicate: true, record: recordFromRow(existing) };
    const requirement = db.prepare("SELECT requirement_key FROM ops_release_evidence_requirements WHERE requirement_key=?").get(record.requirementKey);
    if (!requirement) throw storeError("release evidence requirement was not found", "RELEASE_EVIDENCE_REQUIREMENT_UNKNOWN", 404);
    db.exec("BEGIN IMMEDIATE");
    try {
      db.prepare("INSERT INTO ops_release_evidence_records(id,requirement_key,status,artifact_ref,artifact_sha256,observed_at,expires_at,note,submitted_by,submitted_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)").run(record.id, record.requirementKey, record.status, record.artifactRef, record.artifactSha256, record.observedAt, record.expiresAt, record.note, record.submittedBy, record.submittedAt, record.submittedAt);
      db.prepare("INSERT INTO ops_release_evidence_events(id,evidence_id,type,actor,note,occurred_at) VALUES(?,?,?,?,?,?)").run(`${record.id}:submitted`, record.id, "submitted", record.submittedBy, record.note, record.submittedAt);
      db.exec("COMMIT");
      return { duplicate: false, record: recordFromRow(db.prepare("SELECT r.*,q.label AS requirement_label FROM ops_release_evidence_records r JOIN ops_release_evidence_requirements q ON q.requirement_key=r.requirement_key WHERE r.id=?").get(record.id)) };
    } catch (error) { db.exec("ROLLBACK"); throw error; }
  });
}

export async function listSqliteReleaseEvidence(dbPath, { limit = 100 } = {}) { return withDatabase(dbPath, (db) => recordRows(db).slice(0, Math.min(Math.max(Number(limit) || 100, 1), 500)).map(recordFromRow)); }
export async function readSqliteReleaseEvidenceSummary(dbPath) { return withDatabase(dbPath, (db) => summaryFromRows(recordRows(db))); }

export async function reviewSqliteReleaseEvidence(dbPath, id, input) {
  return withDatabase(dbPath, (db) => {
    const existingRow = db.prepare("SELECT r.*,q.label AS requirement_label FROM ops_release_evidence_records r JOIN ops_release_evidence_requirements q ON q.requirement_key=r.requirement_key WHERE r.id=?").get(String(id || ""));
    if (!existingRow) throw storeError("release evidence record was not found", "RELEASE_EVIDENCE_NOT_FOUND", 404);
    const existing = recordFromRow(existingRow);
    const review = normalizeReleaseEvidenceReview(existing, input);
    db.exec("BEGIN IMMEDIATE");
    try {
      const updated = db.prepare("UPDATE ops_release_evidence_records SET status=?,reviewed_by=?,reviewed_at=?,review_note=?,updated_at=? WHERE id=? AND status='submitted' AND updated_at=?").run(review.decision, review.reviewedBy, review.reviewedAt, review.reviewNote, review.reviewedAt, existing.id, review.expectedUpdatedAt);
      if (!updated.changes) {
        const current = db.prepare("SELECT updated_at,status FROM ops_release_evidence_records WHERE id=?").get(existing.id);
        throw storeError(current?.updated_at !== review.expectedUpdatedAt ? "release evidence changed after this page loaded" : "release evidence is no longer reviewable", current?.updated_at !== review.expectedUpdatedAt ? "RELEASE_EVIDENCE_STALE" : "RELEASE_EVIDENCE_REVIEW_INVALID", 409);
      }
      db.prepare("INSERT INTO ops_release_evidence_events(id,evidence_id,type,actor,note,occurred_at) VALUES(?,?,?,?,?,?)").run(`${existing.id}:${review.decision}:${review.reviewedAt}`, existing.id, review.decision, review.reviewedBy, review.reviewNote, review.reviewedAt);
      db.exec("COMMIT");
      return { record: recordFromRow(db.prepare("SELECT r.*,q.label AS requirement_label FROM ops_release_evidence_records r JOIN ops_release_evidence_requirements q ON q.requirement_key=r.requirement_key WHERE r.id=?").get(existing.id)), event: { type: review.decision, actor: review.reviewedBy, occurredAt: review.reviewedAt } };
    } catch (error) { db.exec("ROLLBACK"); throw error; }
  });
}

export async function listSqliteReleaseEvidenceEvents(dbPath, id) { return withDatabase(dbPath, (db) => db.prepare("SELECT * FROM ops_release_evidence_events WHERE evidence_id=? ORDER BY occurred_at DESC,id DESC").all(String(id || "")).map(eventFromRow)); }
export async function readSqliteReleaseEvidenceHealth(dbPath) { return withDatabase(dbPath, (db) => { const rows = recordRows(db); const status = Object.fromEntries(["submitted", "verified", "rejected"].map((value) => [value, 0])); for (const row of rows) status[row.status] += 1; return { backend: "sqlite", migrationVersion: releaseEvidenceMigrationVersion, tables: ["ops_release_evidence_requirements", "ops_release_evidence_records", "ops_release_evidence_events"], counts: { requirements: releaseEvidenceRequirements.length, records: rows.length, events: Number(db.prepare("SELECT COUNT(*) AS count FROM ops_release_evidence_events").get().count), ...status }, relationshipIntegrity: { foreignKeysEnabled: db.prepare("PRAGMA foreign_keys").get().foreign_keys === 1, foreignKeyIssues: db.prepare("PRAGMA foreign_key_check").all().length } }; }); }
