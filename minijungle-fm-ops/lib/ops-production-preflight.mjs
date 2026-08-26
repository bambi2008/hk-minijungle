import pg from "pg";
import { productionConfigReport } from "./ops-production-config.mjs";

export const productionPreflightVersion = "2026-08-23.production-preflight-v1";

const requiredTables = [
  "schema_migrations",
  "ops_events",
  "ops_state_snapshots",
  "ops_actions",
  "clients",
  "living_assets",
  "asset_modules",
  "asset_devices",
  "sensor_readings",
  "sensor_reading_history",
  "health_score_snapshots",
  "telemetry_alert_rules",
  "telemetry_alerts",
  "device_camera_captures",
  "device_camera_files",
  "mobile_capture_batches",
  "mobile_capture_items",
  "proof_media_objects",
  "proof_media_links",
  "ops_notification_outbox",
  "ops_remediation_tasks",
  "evidence_snapshots"
];

const requiredMigrations = [
  "2026-08-17.postgres-runtime-v1",
  "2026-08-19.postgres-master-data-v1",
  "2026-08-19.postgres-modules-v1",
  "2026-08-19.postgres-device-ingestion-v1",
  "2026-08-19.postgres-telemetry-v1",
  "2026-08-19.postgres-telemetry-alerts-v1",
  "2026-08-19.postgres-ai-visual-diagnosis-v1",
  "2026-08-19.postgres-mobile-capture-v1",
  "2026-08-19.postgres-proof-media-v1",
  "2026-08-19.postgres-mobile-reminder-actions-v1",
  "2026-08-23.postgres-notification-outbox-v1",
  "2026-08-23.postgres-evidence-snapshot-v3",
  "2026-08-25.postgres-remediation-tasks-v1",
  "2026-08-26.postgres-remediation-work-order-link-v1",
  "2026-08-27.postgres-remediation-review-loop-v1",
  "2026-08-28.postgres-remediation-dispatch-sla-v1"
];

function clean(value) { return String(value || "").trim(); }

function safeError(error, secret = "") {
  const raw = String(error?.message || error || "unknown error");
  const message = secret ? raw.replaceAll(secret, "[redacted]") : raw;
  return message.replace(/(postgres(?:ql)?:\/\/)[^@\s]+@/i, "$1[redacted]@");
}

function databaseTlsConfigured(databaseUrl) {
  try {
    const url = new URL(databaseUrl);
    const sslmode = clean(url.searchParams.get("sslmode")).toLowerCase();
    return ["require", "verify-ca", "verify-full"].includes(sslmode) || clean(process.env.DR_FOREST_DATABASE_SSL).toLowerCase() === "true";
  } catch {
    return false;
  }
}

async function probePostgres(databaseUrl) {
  if (!databaseUrl) return { status: "skipped", reason: "DR_FOREST_DATABASE_URL is not configured" };
  if (!databaseTlsConfigured(databaseUrl)) return { status: "failed", reason: "PostgreSQL connection must declare TLS with sslmode=require, verify-ca, verify-full or DR_FOREST_DATABASE_SSL=true" };
  const pool = new pg.Pool({
    connectionString: databaseUrl,
    max: 1,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 5000,
    application_name: "dr-forest-production-preflight"
  });
  try {
    const [identity, tables, migrations] = await Promise.all([
      pool.query("SELECT current_database() AS database, current_user AS user, current_setting('server_version') AS server_version"),
      pool.query("SELECT tablename AS name FROM pg_tables WHERE schemaname = current_schema()"),
      pool.query("SELECT version, applied_at FROM schema_migrations ORDER BY applied_at ASC")
    ]);
    const actualTables = new Set(tables.rows.map((row) => row.name));
    const actualMigrations = new Set(migrations.rows.map((row) => row.version));
    const missingTables = requiredTables.filter((table) => !actualTables.has(table));
    const missingMigrations = requiredMigrations.filter((migration) => !actualMigrations.has(migration));
    const status = missingTables.length || missingMigrations.length ? "failed" : "verified";
    return {
      status,
      tls: true,
      identity: identity.rows[0] || null,
      tableCount: actualTables.size,
      requiredTableCount: requiredTables.length,
      missingTables,
      migrationCount: actualMigrations.size,
      requiredMigrationCount: requiredMigrations.length,
      missingMigrations
    };
  } catch (error) {
    return { status: "failed", tls: true, reason: safeError(error, databaseUrl) };
  } finally {
    await pool.end();
  }
}

async function fetchJson(url, headers) {
  try {
    const response = await fetch(url, { headers, signal: AbortSignal.timeout(5000) });
    let body = null;
    try { body = await response.json(); } catch { body = null; }
    return { status: response.status, body };
  } catch (error) {
    return { status: 0, body: null, reason: safeError(error) };
  }
}

async function probeService(serviceUrl, headers = {}) {
  if (!serviceUrl) return { status: "skipped", reason: "DR_FOREST_PRODUCTION_BASE_URL is not configured" };
  const root = `${serviceUrl.replace(/\/$/, "")}/`;
  const [ready, storage] = await Promise.all([
    fetchJson(`${root}api/health/ready`, headers),
    fetchJson(`${root}api/storage`, headers)
  ]);
  const readyBackend = ready.body?.runtime?.database || null;
  const storageBackends = [
    storage.body?.backend,
    storage.body?.masterData?.source,
    storage.body?.mobileCapture?.backend,
    storage.body?.proofMedia?.backend,
    storage.body?.telemetry?.backend,
    storage.body?.modules?.backend,
    storage.body?.remediation?.backend,
    storage.body?.devices?.backend,
    storage.body?.alerts?.backend,
    storage.body?.aiVision?.backend,
    storage.body?.notifications?.backend,
    storage.body?.evidenceSnapshots?.backend
  ].filter(Boolean);
  const postgresStorage = storageBackends.length > 0 && storageBackends.every((backend) => /postgres/i.test(backend));
  const status = ready.status === 200 && storage.status === 200 && ready.body?.status === "ready" && postgresStorage ? "verified" : "failed";
  return {
    status,
    readyStatus: ready.status,
    storageStatus: storage.status,
    readyBackend,
    storageBackends,
    postgresStorage,
    reason: status === "verified" ? null : "Service readiness or PostgreSQL-backed storage observation failed"
  };
}

export async function runProductionPreflight({
  report = productionConfigReport(),
  databaseUrl = clean(process.env.DR_FOREST_DATABASE_URL),
  serviceUrl = clean(process.env.DR_FOREST_PRODUCTION_BASE_URL),
  bearerToken = clean(process.env.DR_FOREST_EVIDENCE_BEARER_TOKEN),
  principal = clean(process.env.DR_FOREST_EVIDENCE_PRINCIPAL)
} = {}) {
  const headers = { Accept: "application/json" };
  if (bearerToken) headers.Authorization = `Bearer ${bearerToken}`;
  if (principal) headers["x-dr-forest-principal"] = principal;
  if (!report.production) {
    return {
      version: productionPreflightVersion,
      status: "pilot",
      mode: report.mode,
      config: { ready: report.ready, failures: report.failures },
      database: { status: "skipped", reason: "Pilot mode is not a production release candidate" },
      service: { status: "skipped", reason: "Pilot mode is not a production release candidate" },
      releaseBlockers: ["DR_FOREST_ENV must be production for this preflight"]
    };
  }
  const database = await probePostgres(databaseUrl);
  const service = await probeService(serviceUrl, headers);
  const releaseBlockers = [
    ...report.failures.map((item) => `${item.name}: ${item.detail}`),
    ...(database.status === "verified" ? [] : [`database: ${database.reason || "PostgreSQL probe did not verify"}`]),
    ...(service.status === "verified" ? [] : [`service: ${service.reason || "service probe did not verify"}`])
  ];
  return {
    version: productionPreflightVersion,
    status: releaseBlockers.length === 0 ? "ready" : "blocked",
    mode: report.mode,
    config: { ready: report.ready, failures: report.failures },
    database,
    service,
    releaseBlockers
  };
}
