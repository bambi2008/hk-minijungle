import { readPostgresMasterDataHealth } from "../lib/ops-postgres-master-data-store.mjs";
import { readPostgresModuleStorageHealth } from "../lib/ops-postgres-module-store.mjs";
import { readPostgresTelemetryStorageHealth } from "../lib/ops-postgres-telemetry-store.mjs";
import { readPostgresDeviceStorageHealth } from "../lib/ops-postgres-device-store.mjs";
import { fileURLToPath } from "node:url";

if (!process.env.DR_FOREST_DATABASE_URL) {
  console.log(JSON.stringify({ ok: true, skipped: true, reason: "DR_FOREST_DATABASE_URL is not configured in pilot workspace" }, null, 2));
  process.exit(0);
}

const dataRoot = fileURLToPath(new URL("../data/", import.meta.url));
const [masterData, modules, telemetry, devices] = await Promise.all([
  readPostgresMasterDataHealth("", dataRoot),
  readPostgresModuleStorageHealth("", dataRoot),
  readPostgresTelemetryStorageHealth(""),
  readPostgresDeviceStorageHealth("", dataRoot)
]);
for (const [name, health] of Object.entries({ masterData, modules, telemetry, devices })) {
  if (health.backend && health.backend !== "postgresql") throw new Error(`${name} adapter returned ${health.backend}`);
  if (health.relationshipIntegrity && health.relationshipIntegrity.foreignKeyIssues !== 0) throw new Error(`${name} has ${health.relationshipIntegrity.foreignKeyIssues} relationship issues`);
}
console.log(JSON.stringify({ ok: true, skipped: false, backends: { masterData: masterData.source, modules: modules.backend, telemetry: telemetry.backend, devices: devices.backend }, counts: { masterData: masterData.counts, modules: modules.counts, telemetry: telemetry.counts, devices: devices.counts } }, null, 2));
