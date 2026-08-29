import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { applyPostgresMigrations, writeMigrationReport } from "../lib/ops-postgres-migrations.mjs";

function option(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? String(process.argv[index + 1] || "").trim() : "";
}

const reportPath = option("--out");
const verifyOnly = process.argv.includes("--verify-only");
try {
  const report = await applyPostgresMigrations({ verifyOnly });
  if (reportPath) {
    await mkdir(dirname(resolve(reportPath)), { recursive: true });
    await writeMigrationReport(reportPath, report);
  }
  console.log(JSON.stringify(report, null, 2));
} catch (error) {
  const report = error.report || { status: "blocked", error: error.message, code: error.code || "POSTGRES_MIGRATION_FAILED" };
  console.error(JSON.stringify(report, null, 2));
  process.exitCode = 2;
}
