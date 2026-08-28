-- DR FOREST OPS module commissioning and physical asset lifecycle.
CREATE TABLE IF NOT EXISTS ops_module_commissioning (
  module_id TEXT PRIMARY KEY REFERENCES asset_modules(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  client_id TEXT NOT NULL REFERENCES clients(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  wall_id TEXT NOT NULL REFERENCES living_assets(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  serial_number TEXT NOT NULL UNIQUE,
  public_code TEXT NOT NULL UNIQUE,
  hardware_revision TEXT,
  install_location TEXT,
  status TEXT NOT NULL CHECK(status IN ('planned','installed','verified','suspended','retired')),
  checklist_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  installed_at TIMESTAMPTZ,
  installed_by TEXT,
  verified_at TIMESTAMPTZ,
  verified_by TEXT,
  suspended_at TIMESTAMPTZ,
  retired_at TIMESTAMPTZ,
  lifecycle_note TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_pg_commissioning_scope ON ops_module_commissioning(client_id, wall_id, status);

CREATE TABLE IF NOT EXISTS ops_module_commissioning_events (
  id TEXT PRIMARY KEY,
  module_id TEXT NOT NULL REFERENCES ops_module_commissioning(module_id) ON UPDATE CASCADE ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  actor_name TEXT NOT NULL,
  event_at TIMESTAMPTZ NOT NULL,
  idempotency_key TEXT NOT NULL,
  note TEXT,
  checklist_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE(module_id, idempotency_key)
);
CREATE INDEX IF NOT EXISTS idx_pg_commissioning_events_module_time ON ops_module_commissioning_events(module_id, event_at DESC);

INSERT INTO schema_migrations(version, applied_at)
VALUES ('2026-09-03.postgres-module-commissioning-v1', NOW())
ON CONFLICT(version) DO NOTHING;
