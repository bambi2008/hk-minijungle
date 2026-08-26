-- DR FOREST OPS remediation task ledger.
-- Apply after 001_runtime_schema.sql and the master-data/module migrations.
CREATE TABLE IF NOT EXISTS ops_remediation_tasks (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  wall_id TEXT NOT NULL REFERENCES living_assets(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  work_order_id TEXT REFERENCES work_orders(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  module_id TEXT NOT NULL REFERENCES asset_modules(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  source TEXT NOT NULL,
  source_key TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('open', 'assigned', 'in_progress', 'resolved', 'cancelled')),
  priority TEXT NOT NULL CHECK (priority IN ('critical', 'high', 'normal', 'low')),
  assigned_to TEXT,
  due_at TIMESTAMPTZ,
  reason_json JSONB NOT NULL,
  resolution_note TEXT,
  evidence_ref TEXT,
  created_by TEXT NOT NULL,
  updated_by TEXT NOT NULL,
  acknowledged_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_pg_remediation_scope_status ON ops_remediation_tasks(client_id, wall_id, module_id, status, priority);
CREATE INDEX IF NOT EXISTS idx_pg_remediation_due ON ops_remediation_tasks(status, due_at);
CREATE INDEX IF NOT EXISTS idx_pg_remediation_updated ON ops_remediation_tasks(updated_at DESC, id ASC);
