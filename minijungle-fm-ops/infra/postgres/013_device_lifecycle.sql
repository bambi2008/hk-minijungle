-- DR FOREST OPS sensor, camera and gateway service lifecycle.
CREATE TABLE IF NOT EXISTS ops_device_lifecycle(
  device_id TEXT PRIMARY KEY REFERENCES asset_devices(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  client_id TEXT NOT NULL REFERENCES clients(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  wall_id TEXT NOT NULL REFERENCES living_assets(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  module_id TEXT REFERENCES asset_modules(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  serial_number TEXT NOT NULL UNIQUE,
  manufacturer TEXT,
  model TEXT,
  status TEXT NOT NULL CHECK(status IN ('in_service','fault','quarantined','replaced','retired')),
  calibration_interval_days INTEGER NOT NULL CHECK(calibration_interval_days BETWEEN 1 AND 3650),
  last_calibrated_at TIMESTAMPTZ,
  next_calibration_due_at TIMESTAMPTZ,
  warranty_expires_at TIMESTAMPTZ,
  replacement_device_id TEXT REFERENCES asset_devices(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  lifecycle_note TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_pg_device_lifecycle_scope ON ops_device_lifecycle(client_id,wall_id,module_id,status);
CREATE INDEX IF NOT EXISTS idx_pg_device_lifecycle_calibration ON ops_device_lifecycle(next_calibration_due_at,status);

CREATE TABLE IF NOT EXISTS ops_device_lifecycle_events(
  id TEXT PRIMARY KEY,
  device_id TEXT NOT NULL REFERENCES ops_device_lifecycle(device_id) ON UPDATE CASCADE ON DELETE CASCADE,
  action TEXT NOT NULL,
  from_status TEXT,
  to_status TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  actor_name TEXT NOT NULL,
  event_at TIMESTAMPTZ NOT NULL,
  idempotency_key TEXT NOT NULL,
  work_order_id TEXT,
  evidence_ref TEXT,
  replacement_device_id TEXT,
  note TEXT,
  UNIQUE(device_id,idempotency_key)
);
CREATE INDEX IF NOT EXISTS idx_pg_device_lifecycle_events_time ON ops_device_lifecycle_events(device_id,event_at DESC);

INSERT INTO schema_migrations(version,applied_at)
VALUES('2026-09-04.postgres-device-lifecycle-v1',NOW())
ON CONFLICT(version) DO NOTHING;
