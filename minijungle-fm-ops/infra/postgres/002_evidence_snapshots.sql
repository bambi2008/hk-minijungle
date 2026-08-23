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
  package_json JSONB NOT NULL
);
ALTER TABLE evidence_snapshots ADD COLUMN IF NOT EXISTS signature_algorithm TEXT NOT NULL DEFAULT 'hmac-sha256';
ALTER TABLE evidence_snapshots ADD COLUMN IF NOT EXISTS signature_status TEXT NOT NULL DEFAULT 'unsigned';
ALTER TABLE evidence_snapshots ADD COLUMN IF NOT EXISTS signature_key_id TEXT;
ALTER TABLE evidence_snapshots ADD COLUMN IF NOT EXISTS signature TEXT;
CREATE INDEX IF NOT EXISTS idx_evidence_snapshots_sha256 ON evidence_snapshots(sha256);
CREATE INDEX IF NOT EXISTS idx_evidence_snapshots_generated ON evidence_snapshots(generated_at DESC);
