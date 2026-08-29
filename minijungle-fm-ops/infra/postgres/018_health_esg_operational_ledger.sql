BEGIN;

CREATE TABLE IF NOT EXISTS health_score_snapshots (
  id TEXT PRIMARY KEY,
  wall_id TEXT NOT NULL,
  score DOUBLE PRECISION,
  score_type TEXT NOT NULL,
  status TEXT NOT NULL,
  calculated_at TIMESTAMPTZ NOT NULL,
  inputs_json TEXT NOT NULL,
  method_version TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_pg_health_score_snapshots_wall_time ON health_score_snapshots(wall_id, calculated_at);

CREATE TABLE IF NOT EXISTS ops_esg_observations (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  wall_id TEXT REFERENCES living_assets(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  module_id TEXT REFERENCES asset_modules(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  work_order_id TEXT REFERENCES work_orders(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  category TEXT NOT NULL CHECK (category IN ('xponge','pest-disease','chemical-intervention','staff-pulse','brand-touchpoint')),
  value DOUBLE PRECISION,
  unit TEXT,
  rating DOUBLE PRECISION CHECK (rating IS NULL OR (rating >= 0 AND rating <= 100)),
  note TEXT NOT NULL,
  evidence_ref TEXT,
  observed_at TIMESTAMPTZ NOT NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_pg_esg_observations_scope_time ON ops_esg_observations(client_id, observed_at DESC);
CREATE INDEX IF NOT EXISTS idx_pg_esg_observations_category ON ops_esg_observations(category, observed_at DESC);

CREATE TABLE IF NOT EXISTS ops_esg_period_ledgers (
  id TEXT PRIMARY KEY,
  scope_key TEXT NOT NULL,
  client_id TEXT,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('partial','complete')),
  payload_json JSONB NOT NULL,
  method_version TEXT NOT NULL,
  generated_by TEXT NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL,
  UNIQUE(scope_key, period_start, period_end)
);
CREATE INDEX IF NOT EXISTS idx_pg_esg_ledgers_scope_period ON ops_esg_period_ledgers(scope_key, period_end DESC);

INSERT INTO schema_migrations(version, applied_at)
VALUES ('2026-08-29.postgres-health-esg-operational-ledger-v1', NOW())
ON CONFLICT(version) DO NOTHING;

COMMIT;
