import { readPostgresAlertStorageHealth } from "../lib/ops-postgres-alert-store.mjs";
import { readPostgresAiVisionStorageHealth } from "../lib/ops-postgres-ai-store.mjs";

if (!process.env.DR_FOREST_DATABASE_URL) {
  console.log(JSON.stringify({ ok: true, skipped: true, reason: "DR_FOREST_DATABASE_URL is not configured in pilot workspace" }, null, 2));
  process.exit(0);
}

const [alerts, aiVision] = await Promise.all([
  readPostgresAlertStorageHealth(""),
  readPostgresAiVisionStorageHealth("")
]);
for (const [name, health] of Object.entries({ alerts, aiVision })) {
  if (health.backend !== "postgresql") throw new Error(`${name} adapter returned ${health.backend}`);
  if (health.relationshipIntegrity.foreignKeyIssues !== 0) throw new Error(`${name} has ${health.relationshipIntegrity.foreignKeyIssues} relationship issues`);
}
console.log(JSON.stringify({ ok: true, skipped: false, backends: { alerts: alerts.backend, aiVision: aiVision.backend }, counts: { alerts: alerts.counts, aiVision: aiVision.counts } }, null, 2));
