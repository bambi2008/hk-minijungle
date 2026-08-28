import { rm } from "node:fs/promises";
import { join } from "node:path";
import { beginSqliteReliabilityRun, finishSqliteReliabilityRun, readSqliteReliabilityHealth, readSqliteReliabilityOverview, scanSqliteReliability, seedSqliteReliabilityJobs } from "../lib/ops-reliability-store.mjs";

const runtimeDir = join(process.cwd(), ".ops-data-reliability-test");
const dbPath = join(runtimeDir, "ops-runtime.sqlite");
const base = new Date("2026-09-02T00:00:00.000Z");
const at = (seconds) => new Date(base.getTime() + seconds * 1000).toISOString();
function assert(condition, message) { if (!condition) throw new Error(message); }

await rm(runtimeDir, { recursive: true, force: true });
try {
  await seedSqliteReliabilityJobs(dbPath, [
    { jobName: "test-delivery", label: "Test delivery", expectedIntervalSeconds: 60, staleAfterSeconds: 120 },
    { jobName: "test-scan", label: "Test scan", expectedIntervalSeconds: 60, staleAfterSeconds: 120 }
  ]);

  const first = await beginSqliteReliabilityRun(dbPath, { id: "RUN-DELIVERY-1", jobName: "test-delivery", ownerId: "worker-a", startedAt: at(0) });
  assert(first.run.status === "running", "Job did not enter running state");
  await finishSqliteReliabilityRun(dbPath, first.run.id, { status: "succeeded", finishedAt: at(10), result: { delivered: 4 } });
  let overview = await readSqliteReliabilityOverview(dbPath, { now: at(60) });
  assert(overview.jobs.find((job) => job.jobName === "test-delivery")?.state === "healthy", "Successful recent job should be healthy");

  const staleScan = await scanSqliteReliability(dbPath, { now: at(200) });
  assert(staleScan.opened.length === 2, "Stale and never-run jobs should open one incident each");
  const repeatedScan = await scanSqliteReliability(dbPath, { now: at(220) });
  assert(repeatedScan.opened.length === 0, "Repeated scan should not duplicate open incidents");

  const recovery = await beginSqliteReliabilityRun(dbPath, { id: "RUN-DELIVERY-2", jobName: "test-delivery", ownerId: "worker-b", startedAt: at(221) });
  await finishSqliteReliabilityRun(dbPath, recovery.run.id, { status: "succeeded", finishedAt: at(225), result: { delivered: 1 } });
  const recoveryScan = await scanSqliteReliability(dbPath, { now: at(230) });
  assert(recoveryScan.recovered.length === 1 && recoveryScan.recovered[0].jobName === "test-delivery", "Healthy rerun should recover the existing incident");

  const failed = await beginSqliteReliabilityRun(dbPath, { id: "RUN-SCAN-1", jobName: "test-scan", ownerId: "worker-c", startedAt: at(231) });
  await finishSqliteReliabilityRun(dbPath, failed.run.id, { status: "failed", finishedAt: at(232), error: "probe failed" });
  const failedScan = await scanSqliteReliability(dbPath, { now: at(233) });
  assert(failedScan.opened.length === 0, "Existing never-run incident should be updated instead of duplicated after failure");
  overview = await readSqliteReliabilityOverview(dbPath, { now: at(233) });
  assert(overview.jobs.find((job) => job.jobName === "test-scan")?.state === "failed", "Failed run state was not preserved");
  assert(overview.summary.openIncidents === 1, "Only the unresolved scan incident should remain open");

  const health = await readSqliteReliabilityHealth(dbPath);
  assert(health.counts.jobs === 2 && health.counts.runs === 3 && health.counts.incidents === 2, "Reliability health counts are incorrect");
  assert(health.relationshipIntegrity.foreignKeyIssues === 0, "Reliability foreign-key integrity failed");
  console.log(JSON.stringify({ ok: true, summary: overview.summary, health }, null, 2));
} finally {
  await rm(runtimeDir, { recursive: true, force: true });
}
