import { assertProductionReady, productionConfigReport } from "../lib/ops-production-config.mjs";

const original = new Map(Object.keys(process.env).map((key) => [key, process.env[key]]));
function clearProductionKeys() {
  for (const key of [
    "DR_FOREST_DATABASE_URL", "DR_FOREST_OBJECT_STORAGE_ENDPOINT", "DR_FOREST_OBJECT_STORAGE_STYLE", "DR_FOREST_OBJECT_STORAGE_BUCKET",
    "DR_FOREST_OBJECT_STORAGE_ACCESS_KEY", "DR_FOREST_OBJECT_STORAGE_SECRET_KEY", "DR_FOREST_STORAGE_BACKEND",
    "DR_FOREST_PROOF_MEDIA_BACKEND", "DR_FOREST_BACKUP_DESTINATION", "DR_FOREST_BACKUP_ENCRYPTION_KEY",
    "DR_FOREST_IDP_ISSUER", "DR_FOREST_IDP_JWKS_URL", "DR_FOREST_IDP_AUDIENCE", "DR_FOREST_ALLOWED_ORIGINS",
    "DR_FOREST_DEVICE_SIGNING_SECRET", "DR_FOREST_EVIDENCE_SIGNING_SECRET", "DR_FOREST_EVIDENCE_RETENTION_DAYS", "DR_FOREST_FULL_POSTGRES_MIGRATION", "DR_FOREST_OFFHOST_RESTORE_DRILL",
    "DR_FOREST_REAL_DEVICE_PILOT", "DR_FOREST_MULTI_CLIENT_PILOT", "DR_FOREST_MONITORING_VERIFIED",
    "DR_FOREST_AI_PROVIDER_VERIFIED", "DR_FOREST_MEDIA_SCAN_VERIFIED"
  ]) delete process.env[key];
}

try {
  clearProductionKeys();
  process.env.DR_FOREST_ENV = "production";
  const blocked = productionConfigReport();
  if (blocked.ready || blocked.failures.length < 10) throw new Error("Production gate did not fail closed with missing dependencies");
  process.env.DR_FOREST_OBJECT_STORAGE_ENDPOINT = "https://cos.ap-hongkong.myqcloud.com";
  process.env.DR_FOREST_OBJECT_STORAGE_STYLE = "path";
  const cosPathStyle = productionConfigReport().checks.find((item) => item.name === "DR_FOREST_OBJECT_STORAGE_STYLE");
  if (cosPathStyle?.valid) throw new Error("Tencent COS production configuration must reject path-style addressing");
  process.env.DR_FOREST_OBJECT_STORAGE_STYLE = "virtual";
  const cosVirtualStyle = productionConfigReport().checks.find((item) => item.name === "DR_FOREST_OBJECT_STORAGE_STYLE");
  if (!cosVirtualStyle?.valid) throw new Error("Tencent COS production configuration must accept virtual-hosted addressing");
  let threw = false;
  try { assertProductionReady(); } catch (error) { threw = error.code === "PRODUCTION_CONFIG_INCOMPLETE"; }
  if (!threw) throw new Error("assertProductionReady did not reject incomplete production configuration");
  process.env.DR_FOREST_ENV = "pilot";
  const pilot = productionConfigReport();
  if (!pilot.ready || pilot.production) throw new Error("Pilot configuration unexpectedly failed the production gate");
  console.log(JSON.stringify({ ok: true, blockedFailures: blocked.failures.length, pilotReady: pilot.ready }, null, 2));
} finally {
  for (const key of Object.keys(process.env)) if (!original.has(key)) delete process.env[key];
  for (const [key, value] of original) process.env[key] = value;
}
