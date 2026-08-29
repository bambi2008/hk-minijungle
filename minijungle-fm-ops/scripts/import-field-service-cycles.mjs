import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { normalizeFieldCycleCsv } from "../lib/ops-field-cycle-import.mjs";
import { validateFieldCycleEvidence } from "../lib/ops-field-cycle-evidence.mjs";
import { importSqliteFieldServiceCycles } from "../lib/ops-field-service-store.mjs";
import { importPostgresFieldServiceCycles } from "../lib/ops-postgres-field-service-store.mjs";

function option(name, fallback = "") {
  const index = process.argv.indexOf(name);
  return index >= 0 ? String(process.argv[index + 1] || "").trim() : fallback;
}
function required(value, label) { if (!String(value || "").trim()) throw new Error(`${label} is required`); return String(value).trim(); }

export async function main() {
  const inputPath = resolve(required(option("--input"), "--input"));
  const format = option("--format", inputPath.toLowerCase().endsWith(".csv") ? "csv" : "json").toLowerCase();
  const source = await readFile(inputPath, "utf8");
  const imported = format === "csv" ? normalizeFieldCycleCsv(source) : JSON.parse(source);
  const cycles = format === "csv" ? imported.cycles : imported.cycles;
  if (format === "csv" && imported.errors.length) throw new Error(`field-cycle source contains ${imported.errors.length} invalid row(s); fix Airtable and export again`);
  const gate = validateFieldCycleEvidence({ cycles });
  const backend = option("--backend", String(process.env.DR_FOREST_ENV || "pilot").toLowerCase() === "production" ? "postgres" : "sqlite").toLowerCase();
  const apply = process.argv.includes("--apply");
  const report = { version: "2026-08-29.customer-field-service-import-v1", inputPath, format, backend, apply, sourceRows: format === "csv" ? imported.totalRows : cycles.length, validRows: cycles.length, sourceErrors: format === "csv" ? imported.errors : [], gate, status: gate.status === "verified" ? "verified" : "partial" };
  if (apply) {
    const actorId = required(option("--actor"), "--actor when using --apply");
    const dbPath = resolve(option("--db", process.env.DR_FOREST_RUNTIME_DB_PATH || ".ops-data/ops-runtime.sqlite"));
    const result = backend === "postgres"
      ? await importPostgresFieldServiceCycles("", { cycles, actorId })
      : await importSqliteFieldServiceCycles(dbPath, { cycles, actorId });
    report.persistence = { inserted: result.inserted, updated: result.updated, total: result.total, backend: result.backend };
    report.status = result.gate.status === "verified" ? "verified" : "partial";
  }
  console.log(JSON.stringify(report, null, 2));
  if (process.argv.includes("--strict") && report.status !== "verified") process.exitCode = 2;
  return report;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { await main(); } catch (error) { console.error(JSON.stringify({ status: "blocked", error: error.message, code: error.code || "FIELD_CYCLE_IMPORT_FAILED" }, null, 2)); process.exitCode = 2; }
}
