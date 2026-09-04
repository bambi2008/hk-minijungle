import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { hostname } from "node:os";
import { join } from "node:path";
import { productionConfigReport } from "../lib/ops-production-config.mjs";
import { acquireSqliteJobLease, releaseSqliteJobLease } from "../lib/ops-integration-store.mjs";
import { acquirePostgresJobLease, releasePostgresJobLease } from "../lib/ops-postgres-integration-store.mjs";
import { defaultReliabilityJobs } from "../lib/ops-reliability-policy.mjs";
import { beginSqliteReliabilityRun, finishSqliteReliabilityRun, seedSqliteReliabilityJobs } from "../lib/ops-reliability-store.mjs";
import { beginPostgresReliabilityRun, finishPostgresReliabilityRun, seedPostgresReliabilityJobs } from "../lib/ops-postgres-reliability-store.mjs";

const runtimeDbPath = process.env.DR_FOREST_RUNTIME_DB_PATH || ".ops-data/ops-runtime.sqlite";
const production = productionConfigReport().production;
const storage = production ? { seed: seedPostgresReliabilityJobs, begin: beginPostgresReliabilityRun, finish: finishPostgresReliabilityRun, acquire: acquirePostgresJobLease, release: releasePostgresJobLease } : { seed: seedSqliteReliabilityJobs, begin: beginSqliteReliabilityRun, finish: finishSqliteReliabilityRun, acquire: acquireSqliteJobLease, release: releaseSqliteJobLease };
const ownerId = `${hostname()}:${process.pid}:${randomUUID()}`;
await storage.seed(runtimeDbPath, defaultReliabilityJobs());
const lease = await storage.acquire(runtimeDbPath, { jobName: "runtime-backup", ownerId, leaseSeconds: Number(process.env.DR_FOREST_BACKUP_LEASE_SECONDS || 7200) });
if (!lease.acquired) {
  console.log(JSON.stringify({ ok: true, skipped: true, reason: "runtime backup lease is held", lease: lease.lease }, null, 2));
} else {
  let run = null;
  try {
    run = (await storage.begin(runtimeDbPath, { jobName: "runtime-backup", ownerId, details: { production } })).run;
    const backupScript = production ? "backup-postgres-runtime.mjs" : "backup-runtime.mjs";
    const backupArgs = [...process.argv.slice(2)];
    if (production && !backupArgs.includes("--upload")) backupArgs.push("--upload");
    const child = spawn(process.execPath, [join(process.cwd(), "scripts", backupScript), ...backupArgs], { cwd: process.cwd(), env: process.env, stdio: "inherit" });
    const exitCode = await new Promise((resolve, reject) => { child.once("error", reject); child.once("exit", (code) => resolve(code ?? 1)); });
    await storage.finish(runtimeDbPath, run.id, exitCode === 0 ? { status: "succeeded", result: { exitCode } } : { status: "failed", result: { exitCode }, error: `Backup process exited with code ${exitCode}` });
    process.exitCode = exitCode;
  } catch (error) {
    if (run) await storage.finish(runtimeDbPath, run.id, { status: "failed", error: error.message }).catch(() => {});
    throw error;
  } finally {
    await storage.release(runtimeDbPath, { jobName: "runtime-backup", ownerId }).catch(() => {});
  }
}
