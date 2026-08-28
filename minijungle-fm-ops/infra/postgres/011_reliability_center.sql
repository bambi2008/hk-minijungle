BEGIN;

CREATE TABLE IF NOT EXISTS ops_reliability_jobs (
  job_name TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  expected_interval_seconds INTEGER NOT NULL,
  stale_after_seconds INTEGER NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  registered_at TIMESTAMPTZ NOT NULL,
  last_run_id TEXT,
  last_status TEXT CHECK (last_status IS NULL OR last_status IN ('running','succeeded','failed','skipped')),
  last_started_at TIMESTAMPTZ,
  heartbeat_at TIMESTAMPTZ,
  last_finished_at TIMESTAMPTZ,
  last_succeeded_at TIMESTAMPTZ,
  last_failed_at TIMESTAMPTZ,
  last_duration_ms INTEGER,
  last_error TEXT,
  consecutive_failures INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS ops_reliability_runs (
  id TEXT PRIMARY KEY,
  job_name TEXT NOT NULL REFERENCES ops_reliability_jobs(job_name) ON UPDATE CASCADE ON DELETE RESTRICT,
  owner_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('running','succeeded','failed','skipped')),
  started_at TIMESTAMPTZ NOT NULL,
  heartbeat_at TIMESTAMPTZ NOT NULL,
  finished_at TIMESTAMPTZ,
  duration_ms INTEGER,
  details_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  result_json JSONB,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS ops_reliability_incidents (
  id TEXT PRIMARY KEY,
  job_name TEXT NOT NULL REFERENCES ops_reliability_jobs(job_name) ON UPDATE CASCADE ON DELETE RESTRICT,
  status TEXT NOT NULL CHECK (status IN ('open','recovered')),
  severity TEXT NOT NULL CHECK (severity IN ('info','warning','high','critical')),
  reason TEXT NOT NULL,
  opened_at TIMESTAMPTZ NOT NULL,
  last_seen_at TIMESTAMPTZ NOT NULL,
  recovered_at TIMESTAMPTZ,
  opened_state TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_pg_reliability_runs_job ON ops_reliability_runs(job_name, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_pg_reliability_incidents_status ON ops_reliability_incidents(status, opened_at DESC);
INSERT INTO schema_migrations(version, applied_at) VALUES ('2026-09-02.postgres-reliability-center-v1', NOW()) ON CONFLICT(version) DO NOTHING;

COMMIT;
