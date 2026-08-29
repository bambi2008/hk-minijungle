import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { productionConfigReport } from "../lib/ops-production-config.mjs";
import { runProductionPreflight } from "../lib/ops-production-preflight.mjs";
import { probeOidcProvider } from "../lib/ops-oidc-probe.mjs";
import { validateFieldCycleEvidence } from "../lib/ops-field-cycle-evidence.mjs";
import { buildProductionAcceptanceReport } from "../lib/ops-production-acceptance.mjs";

function option(name, fallback = "") { const index = process.argv.indexOf(name); return index >= 0 ? String(process.argv[index + 1] || "").trim() : fallback; }
function safeRead(path) { return readFile(resolve(path), "utf8").then((value) => JSON.parse(value)).catch(() => null); }

function deviceReport(paths) {
  const reports = paths.filter(Boolean).map((path) => path.report || path).filter((report) => report && report.ok && [200, 201].includes(Number(report.status)));
  const kinds = new Set(reports.map((report) => report.kind));
  return { status: kinds.has("reading") && kinds.has("camera") ? "verified" : "blocked", reports: reports.map((report) => ({ kind: report.kind, status: report.status, mediaStatus: report.mediaStatus || null })) };
}

function backupReport(manifest, restore) {
  const manifestValid = Boolean(manifest?.kind === "postgres-custom-format" && manifest.encryption?.format === "DRFENC1" && manifest.files?.some((item) => item.encrypted && item.plainSha256));
  const restoreValid = Boolean(restore?.ok && restore.verifiedOnly === false && restore.target && restore.source && restore.target !== restore.source);
  return { status: manifestValid && restoreValid ? "verified" : "blocked", manifestValid, restoreValid };
}

export async function main() {
  const config = productionConfigReport();
  const preflight = await runProductionPreflight({ report: config, databaseUrl: option("--database-url", undefined) || undefined, serviceUrl: option("--url", undefined) || undefined, bearerToken: option("--bearer-token", undefined) || undefined, principal: option("--principal", undefined) || undefined });
  const oidc = await probeOidcProvider({ issuer: option("--issuer", process.env.DR_FOREST_IDP_ISSUER), jwksUrl: option("--jwks-url", process.env.DR_FOREST_IDP_JWKS_URL), audience: option("--audience", process.env.DR_FOREST_IDP_AUDIENCE), serviceUrl: option("--url", process.env.DR_FOREST_PRODUCTION_BASE_URL), bearerToken: option("--bearer-token", process.env.DR_FOREST_EVIDENCE_BEARER_TOKEN), principal: option("--principal", process.env.DR_FOREST_EVIDENCE_PRINCIPAL) });
  const identity = (await safeRead(option("--identity-report"))) || { status: "blocked" };
  const deviceReports = await Promise.all([option("--device-reading-report"), option("--device-camera-report")].filter(Boolean).map(async (path) => ({ report: await safeRead(path) })));
  const device = deviceReport(deviceReports);
  const backup = backupReport(await safeRead(option("--backup-manifest")), await safeRead(option("--restore-report")));
  const fieldData = validateFieldCycleEvidence(await safeRead(option("--field-evidence")) || { cycles: [] });
  const report = buildProductionAcceptanceReport({ preflight, oidc, identity, device, backup, fieldData });
  console.log(JSON.stringify({ ...report, inputs: { preflightStatus: preflight.status, oidcStatus: oidc.status, identityStatus: identity.status, deviceReports: device.reports, backupManifestChecked: backup.manifestValid, restoreReportChecked: backup.restoreValid, fieldDataStatus: fieldData.status } }, null, 2));
  if (process.argv.includes("--strict") && report.status !== "candidate") process.exitCode = 2;
  return report;
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) await main();
