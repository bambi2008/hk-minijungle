BEGIN;

CREATE TABLE IF NOT EXISTS ops_inventory_locations (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('warehouse','technician-kit','site-buffer')),
  technician_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('active','inactive')),
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_pg_inventory_location_technician ON ops_inventory_locations(technician_id) WHERE technician_id IS NOT NULL AND kind='technician-kit';

CREATE TABLE IF NOT EXISTS ops_inventory_items (
  sku TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  unit TEXT NOT NULL,
  reorder_point NUMERIC(18,3) NOT NULL CHECK (reorder_point >= 0),
  target_level NUMERIC(18,3) NOT NULL CHECK (target_level >= 0),
  active BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS ops_inventory_balances (
  location_id TEXT NOT NULL REFERENCES ops_inventory_locations(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  sku TEXT NOT NULL REFERENCES ops_inventory_items(sku) ON UPDATE CASCADE ON DELETE RESTRICT,
  on_hand NUMERIC(18,3) NOT NULL DEFAULT 0 CHECK (on_hand >= 0),
  reserved NUMERIC(18,3) NOT NULL DEFAULT 0 CHECK (reserved >= 0 AND reserved <= on_hand),
  updated_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY(location_id,sku)
);

CREATE TABLE IF NOT EXISTS ops_inventory_reservations (
  id TEXT PRIMARY KEY,
  work_order_id TEXT NOT NULL,
  sku TEXT NOT NULL,
  source_location_id TEXT NOT NULL,
  technician_id TEXT,
  quantity NUMERIC(18,3) NOT NULL CHECK (quantity > 0),
  remaining_quantity NUMERIC(18,3) NOT NULL CHECK (remaining_quantity >= 0),
  status TEXT NOT NULL CHECK (status IN ('active','consumed','released')),
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  FOREIGN KEY(source_location_id,sku) REFERENCES ops_inventory_balances(location_id,sku) ON UPDATE CASCADE ON DELETE RESTRICT
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_pg_inventory_reservation_active ON ops_inventory_reservations(work_order_id,sku,source_location_id) WHERE status='active';

CREATE TABLE IF NOT EXISTS ops_inventory_transactions (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('receipt','adjustment','transfer-out','transfer-in','consume')),
  location_id TEXT NOT NULL,
  counterparty_location_id TEXT,
  sku TEXT NOT NULL,
  quantity NUMERIC(18,3) NOT NULL,
  work_order_id TEXT,
  capture_batch_id TEXT,
  technician_id TEXT,
  note TEXT NOT NULL,
  actor TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL,
  metadata_json JSONB NOT NULL,
  FOREIGN KEY(location_id,sku) REFERENCES ops_inventory_balances(location_id,sku) ON UPDATE CASCADE ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS idx_pg_inventory_transactions_time ON ops_inventory_transactions(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_pg_inventory_transactions_work_order ON ops_inventory_transactions(work_order_id);
CREATE INDEX IF NOT EXISTS idx_pg_inventory_transactions_capture ON ops_inventory_transactions(capture_batch_id);
CREATE INDEX IF NOT EXISTS idx_pg_inventory_reservation_work_order ON ops_inventory_reservations(work_order_id,status);

INSERT INTO schema_migrations(version,applied_at) VALUES('2026-09-01.postgres-inventory-route-kit-v1',NOW()) ON CONFLICT(version) DO NOTHING;
COMMIT;
