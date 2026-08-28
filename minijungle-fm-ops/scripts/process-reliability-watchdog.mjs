import { randomUUID } from "node:crypto";
import { hostname } from "node:os";
import { productionConfigReport } from "../lib/ops-production-config.mjs";
import { enqueueSqliteNotification } from "../lib/ops-notification-store.mjs";
import { enqueuePostgresNotification } from "../lib/ops-postgres-notification-store.mjs";
import { acquireSqliteJobLease, releaseSqliteJobLease } from "../lib/ops-integration-store.mjs";
import { acquirePostgresJobLease, releasePostgresJobLease } from "../lib/ops-postgres-integration-store.mjs";
import { defaultReliabilityJobs } from "../lib/ops-reliability-policy.mjs";
import { beginSqliteReliabilityRun, finishSqliteReliabilityRun, readSqliteReliabilityOverview, scanSqliteReliability, seedSqliteReliabilityJobs } from "../lib/ops-reliability-store.mjs";
import { beginPostgresReliabilityRun, finishPostgresReliabilityRun, readPostgresReliabilityOverview, scanPostgresReliability, seedPostgresReliabilityJobs } from "../lib/ops-postgres-reliability-store.mjs";

const runtimeDbPath = process.env.DR_FOREST_RUNTIME_DB_PATH || ".ops-data/ops-runtime.sqlite";
const production = productionConfigReport().production;
const ownerId = `${hostname()}:${process.pid}:${randomUUID()}`;
const storage = production
  ? { seed: seedPostgresReliabilityJobs, begin: beginPostgresReliabilityRun, finish: finishPostgresReliabilityRun, scan: scanPostgresReliability, overview: readPostgresReliabilityOverview, enqueue: enqueuePostgresNotification, acquire: acquirePostgresJobLease, release: releasePostgresJobLease }
  : { seed: seedSqliteReliabilityJobs, begin: beginSqliteReliabilityRun, finish: finishSqliteReliabilityRun, scan: scanSqliteReliability, overview: readSqliteReliabilityOverview, enqueue: enqueueSqliteNotification, acquire: acquireSqliteJobLease, release: releaseSqliteJobLease };

await storage.seed(runtimeDbPath, defaultReliabilityJobs());
const lease = await storage.acquire(runtimeDbPath, { jobName: "reliability-watchdog", ownerId, leaseSeconds: 120 });
if (!lease.acquired) {
  console.log(JSON.stringify({ ok: true, skipped: true, reason: "reliability watchdog lease is held", lease: lease.lease }, null, 2));
} else {
  let run = null;
  try {
    run = (await storage.begin(runtimeDbPath, { jobName: "reliability-watchdog", ownerId, details: { trigger: "scheduled-worker", production } })).run;
    const first = await storage.scan(runtimeDbPath);
    await storage.finish(runtimeDbPath, run.id, { status: "succeeded", result: { opened: first.opened.length, recovered: first.recovered.length } });
    const second = await storage.scan(runtimeDbPath);
    const transitions = [...first.opened, ...first.recovered, ...second.opened, ...second.recovered];
    const overview = await storage.overview(runtimeDbPath);
    const jobs = new Map(overview.jobs.map((job) => [job.jobName, job]));
    for (const incident of transitions) {
      const recovered = incident.status === "recovered";
      const job = jobs.get(incident.jobName);
      await storage.enqueue(runtimeDbPath, { id: `NTF-REL-${incident.id}-${recovered ? "RECOVERED" : "OPEN"}`, channel: "webhook", eventType: recovered ? "reliability.job.recovered" : "reliability.job.failed", severity: recovered ? "info" : incident.severity, alertId: incident.id, payload: { incidentId: incident.id, jobName: incident.jobName, label: job?.label || incident.jobName, state: job?.state || incident.openedState, reason: incident.reason, openedAt: incident.openedAt, recoveredAt: incident.recoveredAt } });
    }
    console.log(JSON.stringify({ ok: true, production, runId: run.id, opened: first.opened.length + second.opened.length, recovered: first.recovered.length + second.recovered.length, summary: overview.summary }, null, 2));
  } catch (error) {
    if (run) {
      await storage.finish(runtimeDbPath, run.id, { status: "failed", error: error.message }).catch(() => {});
      await storage.scan(runtimeDbPath).catch(() => {});
    }
    throw error;
  } finally {
    await storage.release(runtimeDbPath, { jobName: "reliability-watchdog", ownerId }).catch(() => {});
  }
}
