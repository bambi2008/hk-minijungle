-- DR FOREST OPS base tables for a fresh PostgreSQL database.
-- This file must run before the numbered operational migrations because those
-- migrations add foreign keys to the master-data and device tables.

CREATE TABLE IF NOT EXISTS schema_migrations (
  version TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  segment TEXT,
  district TEXT,
  contact TEXT,
  plan TEXT,
  contract TEXT,
  renewal_date TEXT,
  renewal_risk TEXT,
  revenue DOUBLE PRECISION,
  proof_need TEXT,
  raw_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS living_assets (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  name TEXT NOT NULL,
  location TEXT,
  version TEXT,
  modules BIGINT NOT NULL,
  pods BIGINT NOT NULL,
  health DOUBLE PRECISION,
  survival DOUBLE PRECISION,
  issues BIGINT DEFAULT 0,
  next_visit TEXT,
  cadence TEXT,
  green_area DOUBLE PRECISION,
  water_saved DOUBLE PRECISION,
  service_miles_saved DOUBLE PRECISION,
  staff_reach BIGINT,
  co2e_proxy DOUBLE PRECISION,
  status TEXT,
  sensors_json TEXT NOT NULL,
  tags_json TEXT NOT NULL,
  raw_json TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_base_living_assets_client ON living_assets(client_id);

CREATE TABLE IF NOT EXISTS asset_zones (
  asset_id TEXT NOT NULL REFERENCES living_assets(id) ON UPDATE CASCADE ON DELETE CASCADE,
  sequence BIGINT NOT NULL,
  name TEXT NOT NULL,
  pods BIGINT,
  health DOUBLE PRECISION,
  issue TEXT,
  raw_json TEXT NOT NULL,
  PRIMARY KEY (asset_id, sequence)
);

CREATE TABLE IF NOT EXISTS work_orders (
  id TEXT PRIMARY KEY,
  wall_id TEXT NOT NULL REFERENCES living_assets(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  type TEXT NOT NULL,
  due TEXT,
  status TEXT,
  priority TEXT,
  tasks_json TEXT NOT NULL,
  raw_json TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_base_work_orders_wall ON work_orders(wall_id);

CREATE TABLE IF NOT EXISTS proof_records (
  id TEXT PRIMARY KEY,
  workorder_id TEXT NOT NULL REFERENCES work_orders(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  wall_id TEXT NOT NULL REFERENCES living_assets(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  category TEXT,
  captured_at TEXT,
  source TEXT,
  status TEXT,
  tone TEXT,
  reviewer TEXT,
  evidence_json TEXT NOT NULL,
  note TEXT,
  raw_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sensor_readings (
  id TEXT PRIMARY KEY,
  wall_id TEXT NOT NULL REFERENCES living_assets(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  type TEXT,
  value DOUBLE PRECISION,
  unit TEXT,
  target TEXT,
  status TEXT,
  last_seen TEXT,
  action TEXT,
  raw_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS incidents (
  id TEXT PRIMARY KEY,
  wall_id TEXT NOT NULL REFERENCES living_assets(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  source_type TEXT,
  source_id TEXT,
  linked_workorder_id TEXT NOT NULL REFERENCES work_orders(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  category TEXT,
  severity TEXT,
  status TEXT,
  opened_at TEXT,
  due_date TEXT,
  owner TEXT,
  sla_hours BIGINT,
  impact TEXT,
  recommended_action TEXT,
  proof_required_json TEXT NOT NULL,
  raw_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS asset_modules (
  id TEXT PRIMARY KEY,
  asset_id TEXT NOT NULL REFERENCES living_assets(id) ON UPDATE CASCADE ON DELETE CASCADE,
  client_id TEXT NOT NULL REFERENCES clients(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  label TEXT NOT NULL,
  zone TEXT,
  position BIGINT,
  status TEXT NOT NULL,
  monitoring_devices_json TEXT NOT NULL,
  camera_id TEXT,
  source TEXT NOT NULL,
  raw_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_base_asset_modules_asset ON asset_modules(asset_id, position);
CREATE INDEX IF NOT EXISTS idx_base_asset_modules_client ON asset_modules(client_id);

CREATE TABLE IF NOT EXISTS asset_devices (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  wall_id TEXT NOT NULL REFERENCES living_assets(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  module_id TEXT,
  type TEXT NOT NULL,
  label TEXT NOT NULL,
  protocol TEXT NOT NULL,
  status TEXT NOT NULL,
  device_key_hash TEXT NOT NULL UNIQUE,
  endpoint_url TEXT,
  capabilities_json TEXT NOT NULL,
  config_json TEXT NOT NULL,
  metadata_json TEXT NOT NULL,
  last_seen_at TEXT,
  last_ingested_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_base_asset_devices_scope ON asset_devices(client_id, wall_id, module_id);
CREATE INDEX IF NOT EXISTS idx_base_asset_devices_status ON asset_devices(status, last_seen_at);

CREATE TABLE IF NOT EXISTS device_ingestion_log (
  id TEXT PRIMARY KEY,
  device_id TEXT NOT NULL REFERENCES asset_devices(id) ON UPDATE CASCADE ON DELETE CASCADE,
  kind TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  module_id TEXT,
  observed_at TEXT,
  accepted_at TEXT NOT NULL,
  status TEXT NOT NULL,
  payload_hash TEXT,
  error_code TEXT,
  payload_json TEXT NOT NULL,
  UNIQUE (device_id, idempotency_key)
);
CREATE INDEX IF NOT EXISTS idx_base_device_ingestion_device_time ON device_ingestion_log(device_id, accepted_at);

CREATE TABLE IF NOT EXISTS device_request_replays (
  device_id TEXT NOT NULL REFERENCES asset_devices(id) ON UPDATE CASCADE ON DELETE CASCADE,
  nonce TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (device_id, nonce)
);
CREATE INDEX IF NOT EXISTS idx_base_device_replays_expiry ON device_request_replays(expires_at);

CREATE TABLE IF NOT EXISTS device_camera_captures (
  id TEXT PRIMARY KEY,
  device_id TEXT NOT NULL REFERENCES asset_devices(id) ON UPDATE CASCADE ON DELETE CASCADE,
  client_id TEXT NOT NULL,
  wall_id TEXT NOT NULL,
  module_id TEXT NOT NULL,
  workorder_id TEXT,
  captured_at TEXT NOT NULL,
  content_type TEXT NOT NULL,
  byte_size BIGINT,
  sha256 TEXT,
  object_key TEXT,
  image_url TEXT,
  media_status TEXT NOT NULL,
  metadata_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_base_device_camera_scope ON device_camera_captures(client_id, wall_id, module_id, captured_at);

CREATE TABLE IF NOT EXISTS device_camera_files (
  capture_id TEXT PRIMARY KEY REFERENCES device_camera_captures(id) ON UPDATE CASCADE ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  byte_size BIGINT NOT NULL,
  sha256 TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sensor_reading_history (
  id TEXT PRIMARY KEY,
  sensor_id TEXT NOT NULL,
  wall_id TEXT NOT NULL,
  module_id TEXT,
  metric TEXT,
  type TEXT NOT NULL,
  value DOUBLE PRECISION NOT NULL,
  unit TEXT,
  status TEXT NOT NULL,
  observed_at TEXT NOT NULL,
  source TEXT NOT NULL,
  metadata_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE (sensor_id, observed_at)
);
CREATE INDEX IF NOT EXISTS idx_base_sensor_history_wall_time ON sensor_reading_history(wall_id, observed_at);
CREATE INDEX IF NOT EXISTS idx_base_sensor_history_module_time ON sensor_reading_history(module_id, observed_at);

INSERT INTO schema_migrations(version, applied_at)
VALUES ('2026-08-29.postgres-base-master-data-ingestion-v1', NOW())
ON CONFLICT(version) DO NOTHING;
