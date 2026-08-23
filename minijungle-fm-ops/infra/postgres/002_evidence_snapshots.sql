-- DR FOREST OPS server-generated evidence snapshot registry.
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
