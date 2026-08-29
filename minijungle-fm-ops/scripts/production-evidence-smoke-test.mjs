import { buildProductionEvidenceReport } from "./production-evidence-report.mjs";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const pilot = buildProductionEvidenceReport({
  baseUrl: "http://pilot.local/",
  healthStatus: 200,
  readyStatus: 200,
  storageStatus: 200,
  ready: { productionGate: { production: false, ready: true, checks: [], failures: [] }, devices: { count: 2 }, aiVision: { diagnoses: 1 } },
  storage: { backend: "sqlite", masterData: { backend: "sqlite" }, mobileCapture: { backend: "sqlite" }, proofMedia: { backend: "sqlite", storageProvider: "local" }, telemetry: { backend: "sqlite" }, modules: { backend: "sqlite" }, reminders: { backend: "sqlite" }, remediation: { backend: "sqlite" }, devices: { backend: "sqlite" }, alerts: { backend: "sqlite" }, aiVision: { backend: "sqlite" }, notifications: { backend: "sqlite" }, evidenceSnapshots: { backend: "sqlite" }, integrations: { backend: "sqlite" }, workforce: { backend: "sqlite" }, maintenancePlanning: { backend: "sqlite" }, inventory: { backend: "sqlite" }, reliability: { backend: "sqlite", counts: { runs: 0, incidents: 0 } }, commissioning: { backend: "sqlite", counts: { records: 0, verified: 0 } }, deviceLifecycle: { backend: "sqlite", counts: { profiles: 0, events: 0 } }, serviceContracts: { backend: "sqlite", counts: { contracts: 0, assets: 0 }, versioning: { backend: "sqlite" } }, healthEsg: { backend: "sqlite" } }
});
assert(pilot.observedMode === "pilot", "Pilot mode was not detected");
assert(pilot.scoreBoundary.officialProductionScore === "65%", "Evidence report must not change the official score");
assert(pilot.evidence.find((item) => item.id === "production-gate")?.status === "pilot-only", "Pilot gate status was not explicit");

const checks = [
  "DR_FOREST_DATABASE_URL", "DR_FOREST_OBJECT_STORAGE_ENDPOINT", "DR_FOREST_IDP_ISSUER", "DR_FOREST_IDP_JWKS_URL",
  "DR_FOREST_FULL_POSTGRES_MIGRATION", "DR_FOREST_OFFHOST_RESTORE_DRILL", "DR_FOREST_REAL_DEVICE_PILOT", "DR_FOREST_MULTI_CLIENT_PILOT",
  "DR_FOREST_MONITORING_VERIFIED", "DR_FOREST_AI_PROVIDER_VERIFIED", "DR_FOREST_MEDIA_SCAN_VERIFIED"
].map((name) => ({ name, valid: true }));
const production = buildProductionEvidenceReport({
  baseUrl: "https://ops.example.test/",
  healthStatus: 200,
  readyStatus: 200,
  storageStatus: 200,
  ready: { productionGate: { production: true, ready: true, checks, failures: [], identity: { provider: "oidc-required" }, storage: { objectStorage: "s3-compatible" } }, devices: { count: 4 }, aiVision: { diagnoses: 2 } },
  storage: { backend: "postgresql", masterData: { backend: "postgresql" }, mobileCapture: { backend: "postgresql" }, proofMedia: { backend: "postgresql", storageProvider: "s3-compatible" }, telemetry: { backend: "postgresql" }, modules: { backend: "postgresql" }, reminders: { backend: "postgresql" }, remediation: { backend: "postgresql" }, devices: { backend: "postgresql" }, alerts: { backend: "postgresql" }, aiVision: { backend: "postgresql" }, notifications: { backend: "postgresql" }, evidenceSnapshots: { backend: "postgresql" }, integrations: { backend: "postgresql" }, workforce: { backend: "postgresql" }, maintenancePlanning: { backend: "postgresql" }, inventory: { backend: "postgresql" }, reliability: { backend: "postgresql", counts: { runs: 10, incidents: 2 } }, commissioning: { backend: "postgresql", counts: { records: 1000, verified: 980 } }, deviceLifecycle: { backend: "postgresql", counts: { profiles: 5000, events: 12000 } }, serviceContracts: { backend: "postgresql", counts: { contracts: 50, assets: 1000 }, versioning: { backend: "postgresql" } }, healthEsg: { backend: "postgresql" } }
});
assert(production.backendObservation.postgresObserved, "All production storage sections should report PostgreSQL");
assert(production.backendObservation.objectStorageObserved, "S3-compatible storage should be observed");
assert(production.evidence.find((item) => item.id === "postgres-migration")?.status === "verified", "Verified PostgreSQL marker was not reported");
assert(production.scoreBoundary.officialProductionScore === "65%", "Production evidence must not auto-promote the official score");
console.log(JSON.stringify({ ok: true, pilotVerified: pilot.summary.verified, productionVerified: production.summary.verified, officialScore: production.scoreBoundary.officialProductionScore }, null, 2));
