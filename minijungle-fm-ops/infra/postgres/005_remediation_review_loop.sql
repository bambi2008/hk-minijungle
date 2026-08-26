-- DR FOREST OPS technician acceptance and independent FM review loop.
-- Apply after 004_remediation_work_order_link.sql.
ALTER TABLE ops_remediation_tasks
  ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS accepted_by TEXT,
  ADD COLUMN IF NOT EXISTS review_status TEXT NOT NULL DEFAULT 'not_submitted'
    CHECK (review_status IN ('not_submitted', 'pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS submitted_by TEXT,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reviewed_by TEXT,
  ADD COLUMN IF NOT EXISTS review_note TEXT;

CREATE INDEX IF NOT EXISTS idx_pg_remediation_review
  ON ops_remediation_tasks(review_status, updated_at DESC);
