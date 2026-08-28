BEGIN;

CREATE TABLE IF NOT EXISTS ops_inventory_lots (
  id TEXT PRIMARY KEY,
  sku TEXT NOT NULL REFERENCES ops_inventory_items(sku) ON UPDATE CASCADE ON DELETE RESTRICT,
  lot_code TEXT NOT NULL,
  supplier TEXT NOT NULL,
  received_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active','quarantined','depleted','expired')),
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  UNIQUE(sku,lot_code)
);

CREATE TABLE IF NOT EXISTS ops_inventory_lot_balances (
  location_id TEXT NOT NULL REFERENCES ops_inventory_locations(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  lot_id TEXT NOT NULL REFERENCES ops_inventory_lots(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  on_hand NUMERIC(18,3) NOT NULL DEFAULT 0 CHECK (on_hand >= 0),
  updated_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY(location_id,lot_id)
);

CREATE TABLE IF NOT EXISTS ops_inventory_lot_transactions (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('receipt','transfer-out','transfer-in','consume','count-adjustment')),
  location_id TEXT NOT NULL,
  counterparty_location_id TEXT,
  lot_id TEXT NOT NULL,
  quantity NUMERIC(18,3) NOT NULL,
  work_order_id TEXT,
  capture_batch_id TEXT,
  note TEXT NOT NULL,
  actor TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL,
  metadata_json JSONB NOT NULL,
  FOREIGN KEY(location_id,lot_id) REFERENCES ops_inventory_lot_balances(location_id,lot_id) ON UPDATE CASCADE ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS idx_pg_inventory_lot_expiry ON ops_inventory_lots(status,expiry_date,sku);
CREATE INDEX IF NOT EXISTS idx_pg_inventory_lot_tx_time ON ops_inventory_lot_transactions(occurred_at DESC);

CREATE TABLE IF NOT EXISTS ops_inventory_stock_counts (
  id TEXT PRIMARY KEY,
  location_id TEXT NOT NULL REFERENCES ops_inventory_locations(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  status TEXT NOT NULL CHECK (status IN ('submitted','approved','rejected')),
  note TEXT NOT NULL,
  counted_by TEXT NOT NULL,
  counted_at TIMESTAMPTZ NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL,
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  review_note TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS ops_inventory_stock_count_lines (
  count_id TEXT NOT NULL REFERENCES ops_inventory_stock_counts(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  lot_id TEXT NOT NULL REFERENCES ops_inventory_lots(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  expected_quantity NUMERIC(18,3) NOT NULL CHECK (expected_quantity >= 0),
  counted_quantity NUMERIC(18,3) NOT NULL CHECK (counted_quantity >= 0),
  variance NUMERIC(18,3) NOT NULL,
  reason TEXT,
  PRIMARY KEY(count_id,lot_id)
);

INSERT INTO schema_migrations(version,applied_at)
VALUES('2026-09-05.postgres-inventory-traceability-v1',NOW())
ON CONFLICT(version) DO NOTHING;

COMMIT;
