-- Customer field-service ledger. Import only validated service records.
BEGIN;

CREATE TABLE IF NOT EXISTS ops_field_service_cycles (
  cycle_id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  work_order_id TEXT NOT NULL REFERENCES work_orders(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  module_id TEXT NOT NULL REFERENCES asset_modules(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  technician_id TEXT NOT NULL REFERENCES ops_technicians(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  service_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('completed', 'exception')),
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes BETWEEN 1 AND 1440),
  source TEXT NOT NULL CHECK (source IN ('airtable', 'ops', 'mobile', 'import')),
  outcome TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  proof_refs_json JSONB NOT NULL,
  source_record_json JSONB NOT NULL,
  imported_by TEXT NOT NULL,
  imported_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_field_cycles_client_time ON ops_field_service_cycles(client_id, service_at DESC, cycle_id DESC);
CREATE INDEX IF NOT EXISTS idx_field_cycles_module_time ON ops_field_service_cycles(module_id, service_at DESC, cycle_id DESC);
CREATE INDEX IF NOT EXISTS idx_field_cycles_status_time ON ops_field_service_cycles(status, service_at DESC);

INSERT INTO schema_migrations(version, applied_at)
VALUES ('2026-08-29.postgres-field-service-cycles-v1', NOW())
ON CONFLICT(version) DO NOTHING;

COMMIT;
