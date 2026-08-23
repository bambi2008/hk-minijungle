import { getPostgresPool } from "./ops-postgres-store.mjs";
import {
  canonicalEvidenceHash,
  normalizeEvidenceRetention,
  verifyEvidenceSnapshotIntegrity
} from "./ops-evidence-integrity.mjs";

export const postgresEvidenceSnapshotMigrationVersion = "2026-08-23.postgres-evidence-snapshot-v3";

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
    signatureAlgorithm: row.signature_algorithm,
    signatureStatus: row.signature_status,
    signatureKeyId: row.signature_key_id || null,
    signature: row.signature || null,
    retentionClass: row.retention_class,
    retentionDays: Number(row.retention_days),
    expiresAt: row.expires_at?.toISOString?.() || row.expires_at,
    verificationStatus: row.verification_status,
    verifiedAt: row.verified_at?.toISOString?.() || row.verified_at || null,
    verifiedBy: row.verified_by || null,
    verificationNote: row.verification_note || null,
    verificationError: row.verification_error || null,
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
      signature_algorithm TEXT NOT NULL DEFAULT 'hmac-sha256',
      signature_status TEXT NOT NULL DEFAULT 'unsigned',
      signature_key_id TEXT,
      signature TEXT,
      retention_class TEXT NOT NULL DEFAULT 'standard',
      retention_days INTEGER NOT NULL DEFAULT 365,
      expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '365 days'),
      verification_status TEXT NOT NULL DEFAULT 'pending',
      verified_at TIMESTAMPTZ,
      verified_by TEXT,
      verification_note TEXT,
      verification_error TEXT,
      package_json JSONB NOT NULL
    );
    ALTER TABLE evidence_snapshots ADD COLUMN IF NOT EXISTS signature_algorithm TEXT NOT NULL DEFAULT 'hmac-sha256';
    ALTER TABLE evidence_snapshots ADD COLUMN IF NOT EXISTS signature_status TEXT NOT NULL DEFAULT 'unsigned';
    ALTER TABLE evidence_snapshots ADD COLUMN IF NOT EXISTS signature_key_id TEXT;
    ALTER TABLE evidence_snapshots ADD COLUMN IF NOT EXISTS signature TEXT;
    ALTER TABLE evidence_snapshots ADD COLUMN IF NOT EXISTS retention_class TEXT NOT NULL DEFAULT 'standard';
    ALTER TABLE evidence_snapshots ADD COLUMN IF NOT EXISTS retention_days INTEGER NOT NULL DEFAULT 365;
    ALTER TABLE evidence_snapshots ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
    ALTER TABLE evidence_snapshots ADD COLUMN IF NOT EXISTS verification_status TEXT NOT NULL DEFAULT 'pending';
    ALTER TABLE evidence_snapshots ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
    ALTER TABLE evidence_snapshots ADD COLUMN IF NOT EXISTS verified_by TEXT;
    ALTER TABLE evidence_snapshots ADD COLUMN IF NOT EXISTS verification_note TEXT;
    ALTER TABLE evidence_snapshots ADD COLUMN IF NOT EXISTS verification_error TEXT;
    UPDATE evidence_snapshots SET expires_at = generated_at + (retention_days * INTERVAL '1 day') WHERE expires_at IS NULL;
    CREATE INDEX IF NOT EXISTS idx_evidence_snapshots_sha256 ON evidence_snapshots(sha256);
    CREATE INDEX IF NOT EXISTS idx_evidence_snapshots_generated ON evidence_snapshots(generated_at DESC);
    INSERT INTO schema_migrations (version, applied_at) VALUES ($1, NOW()) ON CONFLICT (version) DO NOTHING;
  `, [postgresEvidenceSnapshotMigrationVersion]);
}

function validateInput(input) {
  const snapshotId = String(input?.snapshotId || "").trim();
  const sha256 = String(input?.sha256 || "").trim().toLowerCase();
  const signatureAlgorithm = String(input?.signatureAlgorithm || "hmac-sha256").trim().toLowerCase();
  const signatureStatus = String(input?.signatureStatus || "unsigned").trim().toLowerCase();
  const signature = input?.signature ? String(input.signature).trim().toLowerCase() : null;
  const signatureKeyId = input?.signatureKeyId ? String(input.signatureKeyId).trim() : null;
  const payload = input?.package && typeof input.package === "object" ? input.package : null;
  const retention = normalizeEvidenceRetention({ ...input, generatedAt: input?.generatedAt || payload?.generatedAt });
  if (!/^EVP-[a-f0-9]{16}$/.test(snapshotId)) throw storeError("snapshotId is invalid", "EVIDENCE_SNAPSHOT_ID_INVALID");
  if (!/^[a-f0-9]{64}$/.test(sha256)) throw storeError("sha256 is invalid", "EVIDENCE_SNAPSHOT_HASH_INVALID");
  if (signatureAlgorithm !== "hmac-sha256") throw storeError("signatureAlgorithm is invalid", "EVIDENCE_SNAPSHOT_SIGNATURE_ALGORITHM_INVALID");
  if (!["unsigned", "signed"].includes(signatureStatus)) throw storeError("signatureStatus is invalid", "EVIDENCE_SNAPSHOT_SIGNATURE_STATUS_INVALID");
  if (signatureStatus === "signed" && !/^[a-f0-9]{64}$/.test(signature || "")) throw storeError("signed snapshots require a 64-character signature", "EVIDENCE_SNAPSHOT_SIGNATURE_INVALID");
  if (signatureStatus === "unsigned" && signature) throw storeError("unsigned snapshots cannot carry a signature", "EVIDENCE_SNAPSHOT_SIGNATURE_INVALID");
  if (!payload) throw storeError("snapshot package is required", "EVIDENCE_SNAPSHOT_PACKAGE_REQUIRED");
  const actual = canonicalEvidenceHash(payload);
  if (actual !== sha256 || snapshotId !== `EVP-${sha256.slice(0, 16)}`) throw storeError("snapshot package does not match its SHA-256 fingerprint", "EVIDENCE_SNAPSHOT_HASH_MISMATCH");
  return { snapshotId, sha256, signatureAlgorithm, signatureStatus, signatureKeyId, signature, payload, retention };
}

export async function createPostgresEvidenceSnapshot(input) {
  const validated = validateInput(input);
  const pool = getPostgresPool();
  await initialize(pool);
  const existing = await pool.query("SELECT * FROM evidence_snapshots WHERE snapshot_id = $1", [validated.snapshotId]);
  if (existing.rows[0]) return { duplicate: true, snapshot: snapshotFromRow(existing.rows[0]) };
  const result = await pool.query(`INSERT INTO evidence_snapshots (snapshot_id, viewer_role, scope, client_ids, generated_at, persisted_at, hash_algorithm, sha256, signature_algorithm, signature_status, signature_key_id, signature, retention_class, retention_days, expires_at, verification_status, package_json) VALUES ($1,$2,$3,$4::jsonb,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17::jsonb) RETURNING *`, [validated.snapshotId, validated.payload.viewerRole || "unknown", validated.payload.scope || "unknown", JSON.stringify(validated.payload.portfolio?.auth?.clientIds || []), validated.payload.generatedAt || new Date().toISOString(), new Date().toISOString(), input.hashAlgorithm || "sha256", validated.sha256, validated.signatureAlgorithm, validated.signatureStatus, validated.signatureKeyId, validated.signature, validated.retention.retentionClass, validated.retention.retentionDays, validated.retention.expiresAt, validated.signatureStatus === "unsigned" ? "unsigned" : "pending", JSON.stringify(validated.payload)]);
  return { duplicate: false, snapshot: snapshotFromRow(result.rows[0]) };
}

export async function readPostgresEvidenceSnapshot(snapshotId) {
  const pool = getPostgresPool();
  await initialize(pool);
  const result = await pool.query("SELECT * FROM evidence_snapshots WHERE snapshot_id = $1", [snapshotId]);
  return snapshotFromRow(result.rows[0]);
}

export async function verifyPostgresEvidenceSnapshot(snapshotId, options = {}) {
  const pool = getPostgresPool();
  await initialize(pool);
  const existing = await pool.query("SELECT * FROM evidence_snapshots WHERE snapshot_id = $1", [snapshotId]);
  if (!existing.rows[0]) return null;
  const snapshot = snapshotFromRow(existing.rows[0]);
  const integrity = verifyEvidenceSnapshotIntegrity(snapshot, options.secret);
  const expired = snapshot.retentionClass !== "legal-hold" && snapshot.expiresAt && Date.parse(snapshot.expiresAt) <= Date.now();
  const verificationStatus = expired ? "expired" : integrity.verificationStatus;
  const verificationError = expired ? "Evidence snapshot retention period has expired." : integrity.verificationError;
  const verifiedAt = verificationStatus === "verified" ? new Date().toISOString() : null;
  const result = await pool.query("UPDATE evidence_snapshots SET verification_status = $1, verified_at = $2, verified_by = $3, verification_note = $4, verification_error = $5 WHERE snapshot_id = $6 RETURNING *", [verificationStatus, verifiedAt, options.verifiedBy || null, options.note || null, verificationError, snapshotId]);
  return {
    snapshot: snapshotFromRow(result.rows[0]),
    integrity: { ...integrity, verificationStatus, verificationError, expired }
  };
}

export async function sweepPostgresEvidenceSnapshots(now = new Date()) {
  const pool = getPostgresPool();
  await initialize(pool);
  const sweptAt = new Date(now).toISOString();
  const result = await pool.query("UPDATE evidence_snapshots SET verification_status = 'expired', verification_error = 'Evidence snapshot retention period has expired.' WHERE retention_class <> 'legal-hold' AND expires_at IS NOT NULL AND expires_at <= $1 AND verification_status <> 'expired'", [sweptAt]);
  return { sweptAt, expiredCount: result.rowCount };
}

export async function readPostgresEvidenceStorageHealth() {
  const pool = getPostgresPool();
  await initialize(pool);
  const [count, hashes, states, latest] = await Promise.all([
    pool.query("SELECT COUNT(*)::int AS count FROM evidence_snapshots"),
    pool.query("SELECT COUNT(*)::int AS count FROM evidence_snapshots WHERE sha256 IS NOT NULL AND length(sha256)=64"),
    pool.query("SELECT COUNT(*) FILTER (WHERE verification_status='verified')::int AS verified, COUNT(*) FILTER (WHERE verification_status='unsigned')::int AS unsigned, COUNT(*) FILTER (WHERE verification_status='expired')::int AS expired FROM evidence_snapshots"),
    pool.query("SELECT snapshot_id, generated_at, persisted_at, sha256 FROM evidence_snapshots ORDER BY persisted_at DESC, snapshot_id DESC LIMIT 1")
  ]);
  const row = latest.rows[0];
  return {
    backend: "postgresql",
    migrationVersion: postgresEvidenceSnapshotMigrationVersion,
    tables: ["evidence_snapshots"],
    counts: { snapshots: count.rows[0].count, verified: states.rows[0].verified, unsigned: states.rows[0].unsigned, expired: states.rows[0].expired },
    hashCoverage: { snapshotsWithSha256: hashes.rows[0].count },
    latestSnapshot: row ? { id: row.snapshot_id, generatedAt: row.generated_at?.toISOString?.() || row.generated_at, persistedAt: row.persisted_at?.toISOString?.() || row.persisted_at, sha256: row.sha256 } : null
  };
}
