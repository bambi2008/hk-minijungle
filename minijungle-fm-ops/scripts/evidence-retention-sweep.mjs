import { assertProductionReady, productionConfigReport } from "../lib/ops-production-config.mjs";
import { sweepSqliteEvidenceSnapshots } from "../lib/ops-evidence-snapshot-store.mjs";
import { sweepPostgresEvidenceSnapshots } from "../lib/ops-postgres-evidence-snapshot-store.mjs";

const root = process.cwd();
const runtimeRoot = process.env.DR_FOREST_RUNTIME_DIR || `${root}/.ops-data`;
const runtimeDbPath = process.env.DR_FOREST_RUNTIME_DB_PATH || `${runtimeRoot}/ops-runtime.sqlite`;
const report = productionConfigReport();

try {
  if (report.production) assertProductionReady();
  const result = report.production
    ? await sweepPostgresEvidenceSnapshots()
    : await sweepSqliteEvidenceSnapshots(runtimeDbPath);
  console.log(JSON.stringify({ ok: true, mode: report.mode, ...result }, null, 2));
} catch (error) {
  console.error(error.stack || error.message);
  process.exit(1);
}
