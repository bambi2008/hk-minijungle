import { buildDataQualityReport } from "../lib/ops-data-model.mjs";
import { fileURLToPath } from "node:url";

const dataRoot = fileURLToPath(new URL("../data/", import.meta.url));
const report = await buildDataQualityReport(dataRoot);

console.log(JSON.stringify({
  status: report.status,
  modelVersion: report.modelVersion,
  entityCounts: report.entityCounts,
  relationshipChecks: report.relationshipChecks,
  errors: report.errors,
  warnings: report.warnings
}, null, 2));

if (report.errors.length) {
  process.exit(1);
}
