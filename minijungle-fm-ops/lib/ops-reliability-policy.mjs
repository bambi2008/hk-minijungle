export const reliabilityMigrationVersion = "2026-09-02.reliability-center-v1";
export const postgresReliabilityMigrationVersion = "2026-09-02.postgres-reliability-center-v1";

const jobStatuses = new Set(["running", "succeeded", "failed", "skipped"]);

function required(value, field) {
  const text = String(value || "").trim();
  if (!text) {
    const error = new Error(`${field} is required`);
    error.code = "RELIABILITY_VALIDATION_ERROR";
    error.status = 400;
    throw error;
  }
  return text;
}

function positiveInteger(value, fallback, field) {
  const number = Number(value ?? fallback);
  if (!Number.isInteger(number) || number < 1) {
    const error = new Error(`${field} must be a positive integer`);
    error.code = "RELIABILITY_VALIDATION_ERROR";
    error.status = 400;
    throw error;
  }
  return number;
}

export function defaultReliabilityJobs(env = process.env) {
  return [
    { jobName: "reliability-watchdog", label: "Reliability watchdog", expectedIntervalSeconds: env.DR_FOREST_WATCHDOG_INTERVAL_SECONDS || 300, staleAfterSeconds: env.DR_FOREST_WATCHDOG_STALE_SECONDS || 900 },
    { jobName: "notification-outbox-delivery", label: "Outbound notification delivery", expectedIntervalSeconds: env.DR_FOREST_NOTIFICATION_INTERVAL_SECONDS || 300, staleAfterSeconds: env.DR_FOREST_NOTIFICATION_STALE_SECONDS || 900 },
    { jobName: "remediation-sla-scan", label: "Remediation SLA scan", expectedIntervalSeconds: env.DR_FOREST_SLA_SCAN_INTERVAL_SECONDS || 3600, staleAfterSeconds: env.DR_FOREST_SLA_SCAN_STALE_SECONDS || 7200 },
    { jobName: "maintenance-generation", label: "Preventive maintenance generation", expectedIntervalSeconds: env.DR_FOREST_MAINTENANCE_GENERATION_INTERVAL_SECONDS || 86400, staleAfterSeconds: env.DR_FOREST_MAINTENANCE_GENERATION_STALE_SECONDS || 93600 },
    { jobName: "runtime-backup", label: "Runtime backup", expectedIntervalSeconds: env.DR_FOREST_BACKUP_INTERVAL_SECONDS || 86400, staleAfterSeconds: env.DR_FOREST_BACKUP_STALE_SECONDS || 93600 }
  ].map(normalizeReliabilityJob);
}

export function normalizeReliabilityJob(input) {
  const expectedIntervalSeconds = positiveInteger(input?.expectedIntervalSeconds, 300, "expectedIntervalSeconds");
  const staleAfterSeconds = positiveInteger(input?.staleAfterSeconds, expectedIntervalSeconds * 3, "staleAfterSeconds");
  if (staleAfterSeconds < expectedIntervalSeconds) {
    const error = new Error("staleAfterSeconds must be greater than or equal to expectedIntervalSeconds");
    error.code = "RELIABILITY_VALIDATION_ERROR";
    error.status = 400;
    throw error;
  }
  return {
    jobName: required(input?.jobName, "jobName"),
    label: required(input?.label, "label"),
    expectedIntervalSeconds,
    staleAfterSeconds,
    active: input?.active !== false
  };
}

export function normalizeJobRun(input) {
  return {
    id: required(input?.id, "run.id"),
    jobName: required(input?.jobName, "run.jobName"),
    ownerId: required(input?.ownerId, "run.ownerId"),
    startedAt: new Date(input?.startedAt || Date.now()).toISOString(),
    details: input?.details && typeof input.details === "object" ? input.details : {}
  };
}

export function normalizeJobCompletion(input) {
  const status = required(input?.status, "completion.status");
  if (!jobStatuses.has(status) || status === "running") {
    const error = new Error("completion.status must be succeeded, failed or skipped");
    error.code = "RELIABILITY_VALIDATION_ERROR";
    error.status = 400;
    throw error;
  }
  return {
    status,
    finishedAt: new Date(input?.finishedAt || Date.now()).toISOString(),
    result: input?.result && typeof input.result === "object" ? input.result : {},
    error: input?.error ? String(input.error).slice(0, 1000) : null
  };
}

export function deriveReliabilityState(job, now = new Date()) {
  if (!job.active) return { state: "disabled", incidentWorthy: false, reason: "Monitoring disabled" };
  const nowMs = new Date(now).getTime();
  const registeredAtMs = Date.parse(job.registeredAt || job.updatedAt || now);
  const heartbeatMs = Date.parse(job.heartbeatAt || job.lastStartedAt || "");
  const finishedMs = Date.parse(job.lastFinishedAt || "");
  const staleMs = Number(job.staleAfterSeconds) * 1000;
  if (!job.lastStartedAt) {
    const warming = Number.isFinite(registeredAtMs) && nowMs - registeredAtMs <= staleMs;
    return { state: warming ? "warming" : "never_run", incidentWorthy: !warming, reason: warming ? "Waiting for first scheduled run" : "No run recorded inside the allowed interval" };
  }
  if (job.lastStatus === "running") {
    const stalled = !Number.isFinite(heartbeatMs) || nowMs - heartbeatMs > staleMs;
    return { state: stalled ? "stalled" : "running", incidentWorthy: stalled, reason: stalled ? "Running job heartbeat is stale" : "Job is currently running" };
  }
  if (job.lastStatus === "failed") return { state: "failed", incidentWorthy: true, reason: job.lastError || "Last run failed" };
  if (job.lastStatus === "skipped") return { state: "skipped", incidentWorthy: false, reason: job.lastError || "Last run was skipped" };
  const stale = !Number.isFinite(finishedMs) || nowMs - finishedMs > staleMs;
  return { state: stale ? "stale" : "healthy", incidentWorthy: stale, reason: stale ? "No successful run inside the allowed interval" : "Last run succeeded inside the allowed interval" };
}

export function reliabilitySeverity(state, consecutiveFailures = 0) {
  if (state === "stalled" || Number(consecutiveFailures) >= 3) return "critical";
  if (["failed", "stale", "never_run"].includes(state)) return "high";
  return "info";
}
