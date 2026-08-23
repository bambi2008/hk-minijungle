import { mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { dirname } from "node:path";

export const evidenceSnapshotMigrationVersion = "2026-08-23.evidence-snapshot-v1";

function parseJson(value, fallback) {
  try { return JSON.parse(value || ""); } catch { return fallback; }
}

function storeError(message, code, status = 400) {
  const error = new Error(message);
  error.code = code;
  error.status = status;
  return error;
}

function snapshotFromRow(row) {
  if (!row) return null;
  return {
    snapshotId: row.snapshot_id,
    viewerRole: row.viewer_role,
    scope: row.scope,
    clientIds: parseJson(row.client_ids_json, []),
    generatedAt: row.generated_at,
    persistedAt: row.persisted_at,
    hashAlgorithm: row.hash_algorithm,
    sha256: row.sha256,
    package: parseJson(row.package_json, {})
  };
}

async function withDatabase(dbPath, callback) {
  await mkdir(dirname(dbPath), { recursive: true });
  const db = new DatabaseSync(dbPath);
  try {
    initialize(db);
    return callback(db);
  } finally {
    db.close();
  }
}

function initialize(db) {
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY, applied_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS evidence_snapshots (
      snapshot_id TEXT PRIMARY KEY,
      viewer_role TEXT NOT NULL,
      scope TEXT NOT NULL,
      client_ids_json TEXT NOT NULL,
      generated_at TEXT NOT NULL,
      persisted_at TEXT NOT NULL,
      hash_algorithm TEXT NOT NULL,
      sha256 TEXT NOT NULL UNIQUE,
      package_json TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_evidence_snapshots_sha256 ON evidence_snapshots(sha256);
    CREATE INDEX IF NOT EXISTS idx_evidence_snapshots_generated ON evidence_snapshots(generated_at DESC);
  `);
  db.prepare("INSERT OR IGNORE INTO schema_migrations (version, applied_at) VALUES (?, ?)").run(evidenceSnapshotMigrationVersion, new Date().toISOString());
}

function validateInput(input) {
  const snapshotId = String(input?.snapshotId || "").trim();
  const sha256 = String(input?.sha256 || "").trim().toLowerCase();
  const payload = input?.package && typeof input.package === "object" ? input.package : null;
  if (!/^EVP-[a-f0-9]{16}$/.test(snapshotId)) throw storeError("snapshotId is invalid", "EVIDENCE_SNAPSHOT_ID_INVALID");
  if (!/^[a-f0-9]{64}$/.test(sha256)) throw storeError("sha256 is invalid", "EVIDENCE_SNAPSHOT_HASH_INVALID");
  if (!payload) throw storeError("snapshot package is required", "EVIDENCE_SNAPSHOT_PACKAGE_REQUIRED");
  const actual = createHash("sha256").update(JSON.stringify(payload), "utf8").digest("hex");
  if (actual !== sha256 || snapshotId !== `EVP-${sha256.slice(0, 16)}`) throw storeError("snapshot package does not match its SHA-256 fingerprint", "EVIDENCE_SNAPSHOT_HASH_MISMATCH");
  return { snapshotId, sha256, payload };
}

export async function createSqliteEvidenceSnapshot(dbPath, input) {
  const validated = validateInput(input);
  return withDatabase(dbPath, (db) => {
    const existing = db.prepare("SELECT * FROM evidence_snapshots WHERE snapshot_id = ?").get(validated.snapshotId);
    if (existing) return { duplicate: true, snapshot: snapshotFromRow(existing) };
    const persistedAt = new Date().toISOString();
    const clientIds = validated.payload.portfolio?.auth?.clientIds || [];
    db.prepare(`INSERT INTO evidence_snapshots (snapshot_id, viewer_role, scope, client_ids_json, generated_at, persisted_at, hash_algorithm, sha256, package_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      validated.snapshotId,
      validated.payload.viewerRole || "unknown",
      validated.payload.scope || "unknown",
      JSON.stringify(clientIds),
      validated.payload.generatedAt || persistedAt,
      persistedAt,
      input.hashAlgorithm || "sha256",
      validated.sha256,
      JSON.stringify(validated.payload)
    );
    return { duplicate: false, snapshot: snapshotFromRow(db.prepare("SELECT * FROM evidence_snapshots WHERE snapshot_id = ?").get(validated.snapshotId)) };
  });
}

export async function readSqliteEvidenceSnapshot(dbPath, snapshotId) {
  return withDatabase(dbPath, (db) => snapshotFromRow(db.prepare("SELECT * FROM evidence_snapshots WHERE snapshot_id = ?").get(snapshotId)));
}

export async function readSqliteEvidenceStorageHealth(dbPath) {
  return withDatabase(dbPath, (db) => {
    const count = db.prepare("SELECT COUNT(*) AS count FROM evidence_snapshots").get().count;
    const latest = db.prepare("SELECT snapshot_id, generated_at, persisted_at, sha256 FROM evidence_snapshots ORDER BY persisted_at DESC, snapshot_id DESC LIMIT 1").get();
    return {
      backend: "sqlite",
      migrationVersion: evidenceSnapshotMigrationVersion,
      tables: ["evidence_snapshots"],
      counts: { snapshots: count },
      hashCoverage: { snapshotsWithSha256: count },
      latestSnapshot: latest ? { id: latest.snapshot_id, generatedAt: latest.generated_at, persistedAt: latest.persisted_at, sha256: latest.sha256 } : null
    };
  });
}
