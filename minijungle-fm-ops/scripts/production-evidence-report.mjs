import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const productionEvidenceReportVersion = "2026-08-29.production-evidence-v2";

const EVIDENCE_DEFINITIONS = [
  ["postgres-migration", "Managed PostgreSQL migration, row counts and relationship checks", "DR_FOREST_FULL_POSTGRES_MIGRATION"],
  ["offhost-restore", "Encrypted off-host backup and isolated restore drill", "DR_FOREST_OFFHOST_RESTORE_DRILL"],
  ["real-device-pilot", "Real signed gateway/module/camera pilot", "DR_FOREST_REAL_DEVICE_PILOT"],
  ["multi-client-pilot", "Repeated service cycles for at least two client accounts", "DR_FOREST_MULTI_CLIENT_PILOT"],
  ["monitoring", "Monitoring, alert routing and recovery notification test", "DR_FOREST_MONITORING_VERIFIED"],
  ["ai-provider", "External AI provider evaluation and operating threshold evidence", "DR_FOREST_AI_PROVIDER_VERIFIED"],
  ["media-scan", "Proof/camera media malware scan and quarantine evidence", "DR_FOREST_MEDIA_SCAN_VERIFIED"]
];

function text(value) { return String(value || "").trim(); }
function isPostgres(value) { return /postgres/i.test(text(value)); }
function isS3(value) { return /s3/i.test(text(value)); }

function gateCheck(gate, name) {
  return Array.isArray(gate?.checks) ? gate.checks.find((item) => item.name === name) || null : null;
}

function markerStatus(gate, name, observed) {
  const check = gateCheck(gate, name);
  if (check?.valid && observed) return "verified";
  if (check?.valid) return "marked-verified-but-not-observed";
  if (observed) return "observed-config-only";
  return "missing";
}

function evidenceItem(id, name, marker, gate, observed, detail) {
  return { id, name, marker, status: markerStatus(gate, marker, observed), detail };
}

function reachable(response) { return Boolean(response && Number(response.status) >= 200 && Number(response.status) < 300); }

export function buildProductionEvidenceReport({
  baseUrl,
  health = null,
  healthStatus = 0,
  ready = null,
  readyStatus = 0,
  storage = null,
  storageStatus = 0,
  generatedAt = new Date().toISOString()
} = {}) {
  const gate = ready?.productionGate || health?.productionGate || {};
  const production = Boolean(gate.production);
  const storageObserved = reachable({ status: storageStatus }) && storage && typeof storage === "object";
  const sections = storageObserved ? [storage, storage.masterData, storage.mobileCapture, storage.proofMedia, storage.telemetry, storage.modules, storage.reminders, storage.remediation, storage.devices, storage.alerts, storage.aiVision, storage.notifications, storage.evidenceSnapshots, storage.integrations, storage.workforce, storage.maintenancePlanning, storage.inventory, storage.reliability, storage.commissioning, storage.deviceLifecycle, storage.serviceContracts, storage.healthEsg] : [];
  const postgresObserved = sections.length > 0 && Boolean(storage?.maintenancePlanning) && Boolean(storage?.inventory) && Boolean(storage?.reliability) && Boolean(storage?.commissioning) && Boolean(storage?.deviceLifecycle) && Boolean(storage?.serviceContracts?.versioning) && Boolean(storage?.healthEsg) && isPostgres(storage?.serviceContracts?.versioning?.backend || storage?.serviceContracts?.versioning?.source) && sections.filter(Boolean).every((section) => isPostgres(section.backend || section.source));
  const s3Observed = isS3(storage?.proofMedia?.storageProvider);
  const oidcConfigured = gate?.identity?.provider === "oidc-required" && gateCheck(gate, "DR_FOREST_IDP_ISSUER")?.valid && gateCheck(gate, "DR_FOREST_IDP_JWKS_URL")?.valid;
  const evidence = [
    {
      id: "production-gate",
      name: "Production configuration gate",
      marker: "productionConfigReport.ready",
      status: reachable({ status: readyStatus }) && production && Boolean(gate.ready) ? "verified" : production ? "missing" : "pilot-only",
      detail: production ? (gate.ready ? "The server reports every configured gate check as valid." : `${Array.isArray(gate.failures) ? gate.failures.length : "Some"} production gate checks are still failing.`) : "The observed server is in pilot mode; production gate is intentionally not active."
    },
    evidenceItem("postgres-migration", "Managed PostgreSQL persistence", "DR_FOREST_FULL_POSTGRES_MIGRATION", gate, postgresObserved, storageObserved ? (postgresObserved ? "All observed storage sections report PostgreSQL-backed persistence." : "At least one observed storage section is not PostgreSQL-backed.") : "Storage endpoint was not observed; provide an authorized storage response."),
    evidenceItem("offhost-restore", "Off-host backup and restore", "DR_FOREST_OFFHOST_RESTORE_DRILL", gate, false, "This requires a dated restore log and checksum record; the HTTP health endpoint cannot prove it."),
    evidenceItem("real-device-pilot", "Real device and camera pilot", "DR_FOREST_REAL_DEVICE_PILOT", gate, Boolean(ready?.devices?.count || storage?.devices?.counts?.devices), "A device count is observable, but real signed traffic, key rotation and camera readback still require the field evidence marker."),
    evidenceItem("multi-client-pilot", "Repeated multi-client operations", "DR_FOREST_MULTI_CLIENT_PILOT", gate, false, "A database count cannot prove repeated service cycles, response times or unresolved exceptions."),
    evidenceItem("monitoring", "Monitoring and alert routing", "DR_FOREST_MONITORING_VERIFIED", gate, Boolean(storage?.reliability?.counts?.runs && storage?.reliability?.counts?.incidents), "Persisted job runs and incidents are observable, but production verification still requires a dated alert-delivery and recovery-notification drill."),
    evidenceItem("ai-provider", "External AI provider evaluation", "DR_FOREST_AI_PROVIDER_VERIFIED", gate, Boolean(ready?.aiVision?.diagnoses || storage?.aiVision?.counts?.diagnoses), "Stored diagnosis tasks are observable; provider accuracy, latency, cost and human override evidence remain external."),
    evidenceItem("media-scan", "Media scan and quarantine", "DR_FOREST_MEDIA_SCAN_VERIFIED", gate, s3Observed, s3Observed ? "Object storage configuration is observable; malware scan/quarantine still needs a dated test artifact." : "S3 media storage was not observed from the available health/storage responses.")
  ];
  evidence.push({
    id: "oidc-mfa",
    name: "OIDC identity, MFA and client scope",
    marker: "external-release-record",
    status: oidcConfigured && production ? "configured-but-not-proven" : production ? "missing" : "pilot-only",
    detail: production ? "Issuer/JWKS configuration is not the same as a successful MFA, role, client-scope and revocation test." : "Pilot identity is active; production OIDC is not being exercised."
  });
  const verified = evidence.filter((item) => item.status === "verified").length;
  return {
    reportVersion: productionEvidenceReportVersion,
    generatedAt,
    baseUrl: text(baseUrl),
    observedMode: production ? "production" : "pilot",
    reachability: {
      health: { status: Number(healthStatus), reachable: reachable({ status: healthStatus }) },
      ready: { status: Number(readyStatus), reachable: reachable({ status: readyStatus }) },
      storage: { status: Number(storageStatus), reachable: Boolean(storageObserved) }
    },
    backendObservation: {
      postgresObserved,
      objectStorageObserved: s3Observed,
      oidcConfigured,
      observedStorageSections: storageObserved ? Object.keys(storage).filter((key) => key !== "generatedAt") : []
    },
    evidence,
    summary: { verified, total: evidence.length, requiresExternalArtifacts: evidence.filter((item) => !["verified", "pilot-only"].includes(item.status)).length },
    scoreBoundary: {
      officialProductionScore: "65%",
      scoreChangeAllowed: false,
      reason: "This report inventories evidence; it never self-promotes the official production score. The score changes only after independent review of dated external artifacts and repeated field operations."
    }
  };
}

async function fetchJson(url, headers) {
  try {
    const response = await fetch(url, { headers, signal: AbortSignal.timeout(5000) });
    let body = null;
    try { body = await response.json(); } catch { body = { error: "non-json-response" }; }
    return { status: response.status, body };
  } catch (error) {
    return { status: 0, body: { error: error.message } };
  }
}

function option(name, fallback = "") {
  const index = process.argv.indexOf(name);
  return index >= 0 ? text(process.argv[index + 1]) : fallback;
}

export async function collectProductionEvidenceReport({ baseUrl = text(process.env.DR_FOREST_EVIDENCE_URL) || "http://127.0.0.1:8033/" } = {}) {
  const root = `${text(baseUrl).replace(/\/$/, "")}/`;
  const headers = { Accept: "application/json" };
  if (text(process.env.DR_FOREST_EVIDENCE_BEARER_TOKEN)) headers.Authorization = `Bearer ${text(process.env.DR_FOREST_EVIDENCE_BEARER_TOKEN)}`;
  if (text(process.env.DR_FOREST_EVIDENCE_PRINCIPAL)) headers["x-dr-forest-principal"] = text(process.env.DR_FOREST_EVIDENCE_PRINCIPAL);
  const [health, ready] = await Promise.all([fetchJson(`${root}api/health`, headers), fetchJson(`${root}api/health/ready`, headers)]);
  const storage = await fetchJson(`${root}api/storage`, headers);
  return buildProductionEvidenceReport({ baseUrl: root, health: health.body, healthStatus: health.status, ready: ready.body, readyStatus: ready.status, storage: storage.body, storageStatus: storage.status });
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const report = await collectProductionEvidenceReport({ baseUrl: option("--url", undefined) || undefined });
  const serialized = `${JSON.stringify(report, null, 2)}\n`;
  const output = option("--out");
  if (output) { await mkdir(dirname(resolve(output)), { recursive: true }); await writeFile(output, serialized, "utf8"); }
  process.stdout.write(serialized);
  if (process.argv.includes("--strict") && (!report.reachability.ready.reachable || report.observedMode !== "production" || report.evidence.some((item) => ["missing", "marked-verified-but-not-observed"].includes(item.status)))) process.exitCode = 2;
}
