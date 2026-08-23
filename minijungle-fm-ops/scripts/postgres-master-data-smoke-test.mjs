import { fileURLToPath } from "node:url";
import { readPostgresMasterDataHealth } from "../lib/ops-postgres-master-data-store.mjs";

if (!process.env.DR_FOREST_DATABASE_URL) {
  console.log(JSON.stringify({ ok: true, skipped: true, reason: "DR_FOREST_DATABASE_URL is not configured in pilot workspace" }, null, 2));
  process.exit(0);
}

const health = await readPostgresMasterDataHealth(
  process.env.DR_FOREST_RUNTIME_DB_PATH || "",
  fileURLToPath(new URL("../data/", import.meta.url))
);
if (health.source !== "postgres-master-data") throw new Error("PostgreSQL master-data adapter returned an unexpected source");
if (health.relationshipIntegrity.foreignKeyIssues !== 0) throw new Error(`PostgreSQL master-data relationship issues: ${health.relationshipIntegrity.foreignKeyIssues}`);
console.log(JSON.stringify({ ok: true, skipped: false, source: health.source, migrationVersion: health.migrationVersion, counts: health.counts }, null, 2));
