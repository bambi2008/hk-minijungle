import assert from "node:assert/strict";
import { planBackupRetention, readBackupRetentionPolicy } from "../lib/ops-backup-retention-policy.mjs";

const policy = readBackupRetentionPolicy({ DR_FOREST_BACKUP_RETENTION_DAYS: "30", DR_FOREST_BACKUP_RETENTION_COUNT: "2" });
assert.equal(policy.retentionDays, 30);
assert.equal(policy.retentionCount, 2);
const plan = planBackupRetention([
  { path: "backup-3", createdAt: "2026-08-01T00:00:00.000Z" },
  { path: "backup-1", createdAt: "2026-09-03T00:00:00.000Z" },
  { path: "backup-2", createdAt: "2026-09-02T00:00:00.000Z" }
], { now: new Date("2026-09-04T00:00:00.000Z"), ...policy });
assert.deepEqual(plan.keep.map((item) => item.path), ["backup-1", "backup-2"]);
assert.equal(plan.remove[0].path, "backup-3");
console.log(JSON.stringify({ ok: true, policy, keep: plan.keep.map((item) => item.path), remove: plan.remove.map((item) => ({ path: item.path, reason: item.reason })) }, null, 2));
