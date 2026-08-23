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
  package_json JSONB NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_evidence_snapshots_sha256 ON evidence_snapshots(sha256);
CREATE INDEX IF NOT EXISTS idx_evidence_snapshots_generated ON evidence_snapshots(generated_at DESC);
