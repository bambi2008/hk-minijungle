CREATE TABLE IF NOT EXISTS ops_job_leases (job_name TEXT PRIMARY KEY, owner_id TEXT NOT NULL, acquired_at TIMESTAMPTZ NOT NULL, heartbeat_at TIMESTAMPTZ NOT NULL, lease_until TIMESTAMPTZ NOT NULL);
CREATE TABLE IF NOT EXISTS ops_idempotency_commands (scope TEXT NOT NULL, command_key TEXT NOT NULL, request_hash TEXT NOT NULL, status TEXT NOT NULL CHECK (status IN ('processing','completed')), owner_id TEXT NOT NULL, lease_until TIMESTAMPTZ NOT NULL, response_json JSONB, created_at TIMESTAMPTZ NOT NULL, updated_at TIMESTAMPTZ NOT NULL, PRIMARY KEY (scope, command_key));
CREATE TABLE IF NOT EXISTS ops_maintenance_imports (id TEXT PRIMARY KEY, source TEXT NOT NULL, source_filename TEXT NOT NULL, checksum TEXT NOT NULL, status TEXT NOT NULL CHECK (status IN ('previewed','applied')), row_count INTEGER NOT NULL, valid_count INTEGER NOT NULL, invalid_count INTEGER NOT NULL, rows_json JSONB NOT NULL, errors_json JSONB NOT NULL, created_by TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL, applied_by TEXT, applied_at TIMESTAMPTZ);
CREATE INDEX IF NOT EXISTS idx_pg_job_lease_until ON ops_job_leases(lease_until);
CREATE INDEX IF NOT EXISTS idx_pg_idempotency_lease ON ops_idempotency_commands(status, lease_until);
CREATE INDEX IF NOT EXISTS idx_pg_maintenance_import_checksum ON ops_maintenance_imports(checksum, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pg_maintenance_import_created ON ops_maintenance_imports(created_at DESC, id DESC);
INSERT INTO schema_migrations(version, applied_at) VALUES ('2026-08-29.postgres-ops-control-import-v1', NOW()) ON CONFLICT(version) DO NOTHING;
