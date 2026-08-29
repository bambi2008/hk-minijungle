BEGIN;

CREATE TABLE IF NOT EXISTS ops_release_evidence_requirements (
  requirement_key TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  description TEXT NOT NULL,
  hard_cap INTEGER NOT NULL CHECK (hard_cap BETWEEN 0 AND 100),
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS ops_release_evidence_records (
  id TEXT PRIMARY KEY,
  requirement_key TEXT NOT NULL REFERENCES ops_release_evidence_requirements(requirement_key) ON UPDATE CASCADE ON DELETE RESTRICT,
  status TEXT NOT NULL CHECK (status IN ('submitted','verified','rejected')),
  artifact_ref TEXT NOT NULL,
  artifact_sha256 TEXT NOT NULL,
  observed_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ,
  note TEXT NOT NULL,
  submitted_by TEXT NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL,
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  review_note TEXT,
  updated_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_pg_release_evidence_requirement ON ops_release_evidence_records(requirement_key, submitted_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_pg_release_evidence_status ON ops_release_evidence_records(status, updated_at DESC);

CREATE TABLE IF NOT EXISTS ops_release_evidence_events (
  id TEXT PRIMARY KEY,
  evidence_id TEXT NOT NULL REFERENCES ops_release_evidence_records(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  type TEXT NOT NULL CHECK (type IN ('submitted','verified','rejected')),
  actor TEXT NOT NULL,
  note TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_pg_release_evidence_events_record ON ops_release_evidence_events(evidence_id, occurred_at DESC);

INSERT INTO schema_migrations(version, applied_at)
VALUES('2026-09-08.postgres-release-evidence-ledger-v1', NOW())
ON CONFLICT(version) DO NOTHING;

COMMIT;
