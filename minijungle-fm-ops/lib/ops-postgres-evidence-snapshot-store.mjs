import { createHash } from "node:crypto";
import { getPostgresPool } from "./ops-postgres-store.mjs";

export const postgresEvidenceSnapshotMigrationVersion = "2026-08-23.postgres-evidence-snapshot-v1";

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
    clientIds: row.client_ids || [],
    generatedAt: row.generated_at?.toISOString?.() || row.generated_at,
    persistedAt: row.persisted_at?.toISOString?.() || row.persisted_at,
    hashAlgorithm: row.hash_algorithm,
    sha256: row.sha256,
    package: row.package_json || {}
  };
}

async function initialize(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL);
    CREATE TABLE IF NOT EXISTS evidence_snapshots (
      snapshot_id TEXT PRIMARY KEY,
      viewer_role TEXT NOT NULL,
      scope TEXT NOT NULL,
      client_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
      generated_at TIMESTAMPTZ NOT NULL,
      persisted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      hash_algorithm TEXT NOT NULL,
      sha256 TEXT NOT NULL UNIQUE,
      package_json JSONB NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_evidence_snapshots_sha256 ON evidence_snapshots(sha256);
    CREATE INDEX IF NOT EXISTS idx_evidence_snapshots_generated ON evidence_snapshots(generated_at DESC);
    INSERT INTO schema_migrations (version, applied_at) VALUES ($1, NOW()) ON CONFLICT (version) DO NOTHING;
  `, [postgresEvidenceSnapshotMigrationVersion]);
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

export async function createPostgresEvidenceSnapshot(input) {
  const validated = validateInput(input);
  const pool = getPostgresPool();
  await initialize(pool);
  const existing = await pool.query("SELECT * FROM evidence_snapshots WHERE snapshot_id = $1", [validated.snapshotId]);
  if (existing.rows[0]) return { duplicate: true, snapshot: snapshotFromRow(existing.rows[0]) };
  const result = await pool.query(`INSERT INTO evidence_snapshots (snapshot_id, viewer_role, scope, client_ids, generated_at, persisted_at, hash_algorithm, sha256, package_json) VALUES ($1,$2,$3,$4::jsonb,$5,$6,$7,$8,$9::jsonb) RETURNING *`, [validated.snapshotId, validated.payload.viewerRole || "unknown", validated.payload.scope || "unknown", JSON.stringify(validated.payload.portfolio?.auth?.clientIds || []), validated.payload.generatedAt || new Date().toISOString(), new Date().toISOString(), input.hashAlgorithm || "sha256", validated.sha256, JSON.stringify(validated.payload)]);
  return { duplicate: false, snapshot: snapshotFromRow(result.rows[0]) };
}

export async function readPostgresEvidenceSnapshot(snapshotId) {
  const pool = getPostgresPool();
  await initialize(pool);
  const result = await pool.query("SELECT * FROM evidence_snapshots WHERE snapshot_id = $1", [snapshotId]);
  return snapshotFromRow(result.rows[0]);
}

export async function readPostgresEvidenceStorageHealth() {
  const pool = getPostgresPool();
  await initialize(pool);
  const [count, hashes, latest] = await Promise.all([
    pool.query("SELECT COUNT(*)::int AS count FROM evidence_snapshots"),
    pool.query("SELECT COUNT(*)::int AS count FROM evidence_snapshots WHERE sha256 IS NOT NULL AND length(sha256)=64"),
    pool.query("SELECT snapshot_id, generated_at, persisted_at, sha256 FROM evidence_snapshots ORDER BY persisted_at DESC, snapshot_id DESC LIMIT 1")
  ]);
  const row = latest.rows[0];
  return {
    backend: "postgresql",
    migrationVersion: postgresEvidenceSnapshotMigrationVersion,
    tables: ["evidence_snapshots"],
    counts: { snapshots: count.rows[0].count },
    hashCoverage: { snapshotsWithSha256: hashes.rows[0].count },
    latestSnapshot: row ? { id: row.snapshot_id, generatedAt: row.generated_at?.toISOString?.() || row.generated_at, persistedAt: row.persisted_at?.toISOString?.() || row.persisted_at, sha256: row.sha256 } : null
  };
}
