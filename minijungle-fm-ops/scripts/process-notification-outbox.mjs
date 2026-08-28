import { createHmac, randomUUID } from "node:crypto";
import { hostname } from "node:os";
import { productionConfigReport } from "../lib/ops-production-config.mjs";
import { claimSqliteNotifications, markSqliteNotificationDelivered, markSqliteNotificationRetry } from "../lib/ops-notification-store.mjs";
import { claimPostgresNotifications, markPostgresNotificationDelivered, markPostgresNotificationRetry } from "../lib/ops-postgres-notification-store.mjs";
import { acquireSqliteJobLease, releaseSqliteJobLease } from "../lib/ops-integration-store.mjs";
import { acquirePostgresJobLease, releasePostgresJobLease } from "../lib/ops-postgres-integration-store.mjs";
import { defaultReliabilityJobs } from "../lib/ops-reliability-policy.mjs";
import { beginSqliteReliabilityRun, finishSqliteReliabilityRun, seedSqliteReliabilityJobs } from "../lib/ops-reliability-store.mjs";
import { beginPostgresReliabilityRun, finishPostgresReliabilityRun, seedPostgresReliabilityJobs } from "../lib/ops-postgres-reliability-store.mjs";

const runtimeDbPath = process.env.DR_FOREST_RUNTIME_DB_PATH || ".ops-data/ops-runtime.sqlite";
const production = productionConfigReport().production;
const baseUrl = String(process.env.DR_FOREST_ALERT_WEBHOOK_URL || "").trim();
const secret = String(process.env.DR_FOREST_ALERT_WEBHOOK_SECRET || "").trim();
const maxAttempts = Math.max(1, Number(process.env.DR_FOREST_NOTIFICATION_MAX_ATTEMPTS || 8));
const ownerId = `${hostname()}:${process.pid}:${randomUUID()}`;

function validWebhook(value) { try { return new URL(value).protocol === "https:" || (!production && new URL(value).protocol === "http:"); } catch { return false; } }
function storageFunctions() {
  return production
    ? { claim: claimPostgresNotifications, delivered: markPostgresNotificationDelivered, retry: markPostgresNotificationRetry, acquireLease: acquirePostgresJobLease, releaseLease: releasePostgresJobLease, seedJobs: seedPostgresReliabilityJobs, beginRun: beginPostgresReliabilityRun, finishRun: finishPostgresReliabilityRun }
    : { claim: claimSqliteNotifications, delivered: markSqliteNotificationDelivered, retry: markSqliteNotificationRetry, acquireLease: acquireSqliteJobLease, releaseLease: releaseSqliteJobLease, seedJobs: seedSqliteReliabilityJobs, beginRun: beginSqliteReliabilityRun, finishRun: finishSqliteReliabilityRun };
}

const storage = storageFunctions();
await storage.seedJobs(runtimeDbPath, defaultReliabilityJobs());
let reliabilityRun = null;
let reliabilityFinished = false;
async function start() { if (!reliabilityRun) reliabilityRun = (await storage.beginRun(runtimeDbPath, { jobName: "notification-outbox-delivery", ownerId, details: { production } })).run; return reliabilityRun; }
async function finish(status, result = {}, error = null) { if (reliabilityFinished || !reliabilityRun) return; reliabilityFinished = true; await storage.finishRun(runtimeDbPath, reliabilityRun.id, { status, result, error }); }

try {
  if (!baseUrl || !validWebhook(baseUrl)) {
    const reason = production ? "DR_FOREST_ALERT_WEBHOOK_URL must be an https URL" : "DR_FOREST_ALERT_WEBHOOK_URL is not configured";
    await start();
    await finish("skipped", { reason }, reason);
    console.log(JSON.stringify({ ok: true, skipped: true, reason, reliabilityRunId: reliabilityRun.id }, null, 2));
    if (process.argv.includes("--strict")) process.exitCode = 2;
  } else if (!secret) {
    await start();
    throw new Error("DR_FOREST_ALERT_WEBHOOK_SECRET is required when notification delivery is enabled");
  } else {
    const lease = await storage.acquireLease(runtimeDbPath, { jobName: "notification-outbox-delivery", ownerId, leaseSeconds: Number(process.env.DR_FOREST_NOTIFICATION_WORKER_LEASE_SECONDS || 300) });
    if (!lease.acquired) {
      console.log(JSON.stringify({ ok: true, skipped: true, reason: "notification delivery worker lease is held", lease: lease.lease }, null, 2));
    } else {
      try {
        await start();
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
        const failed = results.filter((item) => item.status === "failed");
        await finish(failed.length ? "failed" : "succeeded", { claimed: claimed.length, delivered: results.filter((item) => item.status === "delivered").length, retry: results.filter((item) => item.status === "retry").length, failed: failed.length }, failed.length ? `${failed.length} notification(s) exhausted delivery attempts` : null);
        console.log(JSON.stringify({ ok: failed.length === 0, production, claimed: claimed.length, results, leaseOwner: ownerId, reliabilityRunId: reliabilityRun.id }, null, 2));
        if (failed.length) process.exitCode = 2;
      } finally {
        await storage.releaseLease(runtimeDbPath, { jobName: "notification-outbox-delivery", ownerId });
      }
    }
  }
} catch (error) {
  await finish("failed", {}, error.message).catch(() => {});
  throw error;
}
