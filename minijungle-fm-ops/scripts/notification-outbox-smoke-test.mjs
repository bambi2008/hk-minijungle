import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { enqueueSqliteNotification, claimSqliteNotifications, markSqliteNotificationDelivered, markSqliteNotificationRetry, readSqliteNotificationStorageHealth } from "../lib/ops-notification-store.mjs";
import { acquireSqliteJobLease, releaseSqliteJobLease } from "../lib/ops-integration-store.mjs";

function assert(condition, message) { if (!condition) throw new Error(message); }

const root = await mkdtemp(join(tmpdir(), "dr-forest-notification-").replaceAll("\\", "/"));
const dbPath = join(root, "runtime.sqlite");
try {
  const input = { id: "NTF-ALERT-SMOKE-1", channel: "webhook", eventType: "telemetry.alert.opened", severity: "critical", clientId: "client-1", wallId: "wall-1", alertId: "ALT-SMOKE-1", payload: { alertId: "ALT-SMOKE-1" } };
  const created = await enqueueSqliteNotification(dbPath, input);
  const duplicate = await enqueueSqliteNotification(dbPath, input);
  assert(!created.duplicate && duplicate.duplicate, "Notification enqueue must be idempotent by notification ID");
  const claimed = await claimSqliteNotifications(dbPath, 10, 60);
  assert(claimed.length === 1 && claimed[0].status === "processing" && claimed[0].attempts === 1, "Notification claim did not lease one attempt");
  const retried = await markSqliteNotificationRetry(dbPath, claimed[0].id, "simulated webhook failure", 3);
  assert(retried.status === "retry" && retried.lastError.includes("simulated"), "Notification retry state was not persisted");
  const claimedAgain = await claimSqliteNotifications(dbPath, 10, 60);
  assert(claimedAgain.length === 0, "Backoff should prevent immediate re-claim");
  const delivered = await markSqliteNotificationDelivered(dbPath, claimed[0].id);
  assert(delivered.status === "delivered" && delivered.deliveredAt, "Notification delivery state was not persisted");
  const health = await readSqliteNotificationStorageHealth(dbPath);
  assert(health.counts.delivered === 1 && health.counts.retry === 0, "Notification health counts are incorrect");
  const firstWorker = await acquireSqliteJobLease(dbPath, { jobName: "notification-outbox-delivery", ownerId: "worker-a", leaseSeconds: 60 });
  const overlappingWorker = await acquireSqliteJobLease(dbPath, { jobName: "notification-outbox-delivery", ownerId: "worker-b", leaseSeconds: 60 });
  assert(firstWorker.acquired && !overlappingWorker.acquired && overlappingWorker.lease.ownerId === "worker-a", "Job lease did not reject an overlapping notification worker");
  assert(!(await releaseSqliteJobLease(dbPath, { jobName: "notification-outbox-delivery", ownerId: "worker-b" })).released, "A non-owner should not release a job lease");
  assert((await releaseSqliteJobLease(dbPath, { jobName: "notification-outbox-delivery", ownerId: "worker-a" })).released, "Job lease owner could not release its lease");
  assert((await acquireSqliteJobLease(dbPath, { jobName: "notification-outbox-delivery", ownerId: "worker-b", leaseSeconds: 60 })).acquired, "Released job lease could not be acquired by the next worker");
  console.log(JSON.stringify({ ok: true, duplicate: duplicate.duplicate, firstAttempt: claimed[0].attempts, finalStatus: delivered.status, delivered: health.counts.delivered, overlappingWorkerBlocked: !overlappingWorker.acquired }, null, 2));
} finally {
  await rm(root, { recursive: true, force: true });
}
