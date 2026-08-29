import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { validateFieldCycleEvidence } from "../lib/ops-field-cycle-evidence.mjs";
import { normalizeFieldCycleCsv } from "../lib/ops-field-cycle-import.mjs";

function option(name, fallback = "") { const index = process.argv.indexOf(name); return index >= 0 ? String(process.argv[index + 1] || "").trim() : fallback; }
function required(value, label) { if (!String(value || "").trim()) throw new Error(`${label} is required`); return String(value).trim(); }

export async function main() {
  const inputPath = resolve(required(option("--input"), "--input"));
  const format = option("--format", inputPath.toLowerCase().endsWith(".csv") ? "csv" : "json").toLowerCase();
  const source = await readFile(inputPath, "utf8");
  const imported = format === "csv" ? normalizeFieldCycleCsv(source) : JSON.parse(source);
  const report = validateFieldCycleEvidence(format === "csv" ? { cycles: imported.cycles } : imported);
  if (format === "csv") {
    report.sourceFormat = imported.sourceFormat;
    report.sourceRecordCount = imported.totalRows;
    report.importErrors = imported.errors;
    report.blockingReasons = [...imported.errors.map((item) => `row ${item.rowNumber}: ${item.messages.join("; ")}`), ...report.blockingReasons];
    if (imported.errors.length) report.status = "blocked";
  }
  const outputPath = option("--out");
  if (outputPath) { await mkdir(dirname(resolve(outputPath)), { recursive: true }); await writeFile(resolve(outputPath), `${JSON.stringify(report, null, 2)}\n`, "utf8"); }
  console.log(JSON.stringify(report, null, 2));
  if (process.argv.includes("--strict") && report.status !== "verified") process.exitCode = 2;
  return report;
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) await main();
