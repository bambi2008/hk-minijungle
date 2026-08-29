BEGIN;

CREATE TABLE IF NOT EXISTS ops_service_contract_versions (
  id TEXT PRIMARY KEY,
  contract_id TEXT NOT NULL REFERENCES ops_service_contracts(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  version_no INTEGER NOT NULL CHECK (version_no > 0),
  version_kind TEXT NOT NULL CHECK (version_kind IN ('initial','amendment','renewal')),
  status TEXT NOT NULL CHECK (status IN ('draft','approved','retired')),
  terms_json JSONB NOT NULL,
  note TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  UNIQUE(contract_id, version_no)
);
CREATE INDEX IF NOT EXISTS idx_pg_service_contract_versions_contract ON ops_service_contract_versions(contract_id, version_no DESC);

CREATE TABLE IF NOT EXISTS ops_service_contract_version_assets (
  version_id TEXT NOT NULL REFERENCES ops_service_contract_versions(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  wall_id TEXT NOT NULL REFERENCES living_assets(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  included_by TEXT NOT NULL,
  included_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY(version_id, wall_id)
);
CREATE INDEX IF NOT EXISTS idx_pg_service_contract_version_assets_wall ON ops_service_contract_version_assets(wall_id, version_id);

CREATE TABLE IF NOT EXISTS ops_service_contract_change_requests (
  id TEXT PRIMARY KEY,
  contract_id TEXT NOT NULL REFERENCES ops_service_contracts(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  request_type TEXT NOT NULL CHECK (request_type IN ('amendment','renewal')),
  status TEXT NOT NULL CHECK (status IN ('pending','approved','rejected')),
  base_version_no INTEGER NOT NULL CHECK (base_version_no > 0),
  base_updated_at TIMESTAMPTZ NOT NULL,
  requested_terms_json JSONB NOT NULL,
  note TEXT NOT NULL,
  requested_by TEXT NOT NULL,
  requested_at TIMESTAMPTZ NOT NULL,
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  review_note TEXT,
  resulting_version_id TEXT REFERENCES ops_service_contract_versions(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  updated_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_pg_service_contract_changes_contract ON ops_service_contract_change_requests(contract_id, status, requested_at DESC);

CREATE TABLE IF NOT EXISTS ops_service_contract_sla_links (
  task_id TEXT PRIMARY KEY REFERENCES ops_remediation_tasks(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  contract_id TEXT REFERENCES ops_service_contracts(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  client_id TEXT NOT NULL REFERENCES clients(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  wall_id TEXT NOT NULL REFERENCES living_assets(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  coverage_state TEXT NOT NULL CHECK (coverage_state IN ('active','scheduled','expired','suspended','terminated','missing')),
  priority TEXT NOT NULL CHECK (priority IN ('critical','high','normal','low')),
  committed_due_at TIMESTAMPTZ,
  response_hours NUMERIC(10,2),
  resolution_hours NUMERIC(10,2),
  linked_by TEXT NOT NULL,
  linked_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_pg_service_contract_sla_links_scope ON ops_service_contract_sla_links(client_id, wall_id, linked_at DESC);
CREATE INDEX IF NOT EXISTS idx_pg_service_contract_sla_links_contract ON ops_service_contract_sla_links(contract_id, linked_at DESC);

INSERT INTO schema_migrations(version, applied_at)
VALUES('2026-09-07.postgres-service-contract-versions-v1', NOW())
ON CONFLICT(version) DO NOTHING;

COMMIT;
