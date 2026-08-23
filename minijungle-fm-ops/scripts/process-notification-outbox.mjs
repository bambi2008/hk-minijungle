import { createHmac } from "node:crypto";
import { productionConfigReport } from "../lib/ops-production-config.mjs";
import { claimSqliteNotifications, markSqliteNotificationDelivered, markSqliteNotificationRetry } from "../lib/ops-notification-store.mjs";
import { claimPostgresNotifications, markPostgresNotificationDelivered, markPostgresNotificationRetry } from "../lib/ops-postgres-notification-store.mjs";

const runtimeDbPath = process.env.DR_FOREST_RUNTIME_DB_PATH || ".ops-data/ops-runtime.sqlite";
const production = productionConfigReport().production;
const baseUrl = String(process.env.DR_FOREST_ALERT_WEBHOOK_URL || "").trim();
const secret = String(process.env.DR_FOREST_ALERT_WEBHOOK_SECRET || "").trim();
const maxAttempts = Math.max(1, Number(process.env.DR_FOREST_NOTIFICATION_MAX_ATTEMPTS || 8));

function validWebhook(value) { try { return new URL(value).protocol === "https:" || (!production && new URL(value).protocol === "http:"); } catch { return false; } }
function storageFunctions() { return production ? { claim: claimPostgresNotifications, delivered: markPostgresNotificationDelivered, retry: markPostgresNotificationRetry } : { claim: claimSqliteNotifications, delivered: markSqliteNotificationDelivered, retry: markSqliteNotificationRetry }; }

if (!baseUrl || !validWebhook(baseUrl)) {
  console.log(JSON.stringify({ ok: true, skipped: true, reason: production ? "DR_FOREST_ALERT_WEBHOOK_URL must be an https URL" : "DR_FOREST_ALERT_WEBHOOK_URL is not configured" }, null, 2));
  if (process.argv.includes("--strict")) process.exitCode = 2;
} else if (!secret) {
  throw new Error("DR_FOREST_ALERT_WEBHOOK_SECRET is required when notification delivery is enabled");
} else {
  const storage = storageFunctions();
  const claimed = await storage.claim(runtimeDbPath, Number(process.env.DR_FOREST_NOTIFICATION_BATCH_SIZE || 20), Number(process.env.DR_FOREST_NOTIFICATION_LEASE_SECONDS || 120));
  const results = [];
  for (const notification of claimed) {
    const body = JSON.stringify(notification.payload || {});
    try {
      const response = await fetch(baseUrl, { method: "POST", headers: { "Content-Type": "application/json", "x-dr-forest-notification-id": notification.id, "x-dr-forest-signature": createHmac("sha256", secret).update(body).digest("hex") }, body, signal: AbortSignal.timeout(8000) });
      if (!response.ok) throw new Error(`webhook returned ${response.status}`);
      const updated = await storage.delivered(runtimeDbPath, notification.id);
      results.push({ id: notification.id, status: updated.status, attempts: updated.attempts });
    } catch (error) {
      const updated = await storage.retry(runtimeDbPath, notification.id, error.message, maxAttempts);
      results.push({ id: notification.id, status: updated.status, attempts: updated.attempts, error: updated.lastError });
    }
  }
  console.log(JSON.stringify({ ok: results.every((item) => ["delivered", "retry"].includes(item.status)), production, claimed: claimed.length, results }, null, 2));
  if (results.some((item) => item.status === "failed")) process.exitCode = 2;
}
