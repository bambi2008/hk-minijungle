import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { enqueueSqliteNotification, claimSqliteNotifications, markSqliteNotificationDelivered, markSqliteNotificationRetry, readSqliteNotificationStorageHealth } from "../lib/ops-notification-store.mjs";

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
  console.log(JSON.stringify({ ok: true, duplicate: duplicate.duplicate, firstAttempt: claimed[0].attempts, finalStatus: delivered.status, delivered: health.counts.delivered }, null, 2));
} finally {
  await rm(root, { recursive: true, force: true });
}
