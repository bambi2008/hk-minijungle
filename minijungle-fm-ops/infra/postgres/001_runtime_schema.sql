-- DR FOREST OPS production runtime schema.
-- The application applies the same idempotent DDL through lib/ops-postgres-store.mjs.
CREATE TABLE IF NOT EXISTS schema_migrations (
  version TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS ops_events (
  id TEXT PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL,
  type TEXT NOT NULL,
  actor TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  client_id TEXT,
  wall_id TEXT,
  source TEXT NOT NULL,
  note TEXT,
  payload_json JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_ops_events_entity ON ops_events(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_ops_events_client ON ops_events(client_id);

CREATE TABLE IF NOT EXISTS ops_state_snapshots (
  revision INTEGER PRIMARY KEY,
  version TEXT NOT NULL,
  updated_at TIMESTAMPTZ,
  last_event_id TEXT,
  state_json JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS ops_actions (
  id TEXT PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL,
  type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  client_id TEXT,
  wall_id TEXT,
  revision INTEGER NOT NULL,
  event_id TEXT,
  audit_event_id TEXT,
  value_json JSONB NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_ops_actions_revision ON ops_actions(revision);
