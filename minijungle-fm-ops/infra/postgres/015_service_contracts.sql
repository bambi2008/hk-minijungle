BEGIN;

CREATE TABLE IF NOT EXISTS ops_service_contracts (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  contract_number TEXT NOT NULL UNIQUE,
  plan_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft','active','suspended','terminated')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  currency TEXT NOT NULL,
  monthly_fee NUMERIC(18,2) NOT NULL CHECK (monthly_fee >= 0),
  visits_per_month INTEGER NOT NULL CHECK (visits_per_month > 0),
  service_window_start TIME NOT NULL,
  service_window_end TIME NOT NULL,
  evidence_required BOOLEAN NOT NULL,
  sla_json JSONB NOT NULL,
  note TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_pg_service_contract_client_state ON ops_service_contracts(client_id,status,end_date);

CREATE TABLE IF NOT EXISTS ops_service_contract_assets (
  contract_id TEXT NOT NULL REFERENCES ops_service_contracts(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  wall_id TEXT NOT NULL REFERENCES living_assets(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  included_by TEXT NOT NULL,
  included_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY(contract_id,wall_id)
);
CREATE INDEX IF NOT EXISTS idx_pg_service_contract_asset ON ops_service_contract_assets(wall_id,contract_id);

CREATE TABLE IF NOT EXISTS ops_service_contract_events (
  id TEXT PRIMARY KEY,
  contract_id TEXT NOT NULL REFERENCES ops_service_contracts(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  type TEXT NOT NULL,
  from_status TEXT,
  to_status TEXT NOT NULL,
  note TEXT NOT NULL,
  actor TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL,
  payload_json JSONB NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_pg_service_contract_events ON ops_service_contract_events(contract_id,occurred_at DESC);

INSERT INTO schema_migrations(version,applied_at)
VALUES('2026-09-06.postgres-service-contracts-v1',NOW())
ON CONFLICT(version) DO NOTHING;

COMMIT;
