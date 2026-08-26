-- DR FOREST OPS remediation-to-work-order relation.
-- Apply after 003_remediation_tasks.sql for existing PostgreSQL deployments.
ALTER TABLE ops_remediation_tasks
  ADD COLUMN IF NOT EXISTS work_order_id TEXT REFERENCES work_orders(id) ON UPDATE CASCADE ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_pg_remediation_work_order
  ON ops_remediation_tasks(work_order_id);
