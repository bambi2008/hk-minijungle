import { readPostgresOpsStorageHealth } from "../lib/ops-postgres-store.mjs";

if (!process.env.DR_FOREST_DATABASE_URL) {
  console.log(JSON.stringify({ ok: true, skipped: true, reason: "DR_FOREST_DATABASE_URL is not configured in pilot workspace" }, null, 2));
  process.exit(0);
}
const health = await readPostgresOpsStorageHealth();
if (health.backend !== "postgresql") throw new Error("PostgreSQL adapter returned an unexpected backend");
console.log(JSON.stringify({ ok: true, skipped: false, backend: health.backend, migrationVersion: health.migrationVersion }, null, 2));
