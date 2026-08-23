import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runProductionPreflight } from "../lib/ops-production-preflight.mjs";

function option(name, fallback = "") {
  const index = process.argv.indexOf(name);
  return index >= 0 ? String(process.argv[index + 1] || "").trim() : fallback;
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
export async function main() {
  const report = await runProductionPreflight({
    databaseUrl: option("--database-url", undefined) || undefined,
    serviceUrl: option("--url", undefined) || undefined,
    bearerToken: option("--bearer-token", undefined) || undefined,
    principal: option("--principal", undefined) || undefined
  });
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (process.argv.includes("--strict") && report.status !== "ready") process.exitCode = 2;
  return report;
}

if (isMain) await main();
