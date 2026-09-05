-- DR FOREST customer service feedback loop.
CREATE TABLE IF NOT EXISTS ops_client_service_feedback (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  service_ref TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  outcome TEXT NOT NULL CHECK (outcome IN ('satisfied','partially_satisfied','follow_up_required')),
  follow_up_required BOOLEAN NOT NULL DEFAULT FALSE,
  comment TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('portal','ops','import')),
  status TEXT NOT NULL CHECK (status IN ('submitted','acknowledged','closed')),
  submitted_by TEXT NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  review_note TEXT
);
CREATE INDEX IF NOT EXISTS idx_pg_client_feedback_scope_time ON ops_client_service_feedback(client_id, submitted_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_pg_client_feedback_status ON ops_client_service_feedback(status, follow_up_required, submitted_at DESC);
