-- DR FOREST OPS persisted remediation SLA escalation state.
-- Apply after 005_remediation_review_loop.sql.
ALTER TABLE ops_remediation_tasks
  ADD COLUMN IF NOT EXISTS escalation_level INTEGER NOT NULL DEFAULT 0
    CHECK (escalation_level BETWEEN 0 AND 3),
  ADD COLUMN IF NOT EXISTS escalated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS escalation_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_pg_remediation_dispatch
  ON ops_remediation_tasks(status, assigned_to, due_at, escalation_level);
