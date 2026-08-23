import { productionConfigReport } from "../lib/ops-production-config.mjs";
import { runProductionPreflight } from "../lib/ops-production-preflight.mjs";

const original = new Map(Object.keys(process.env).map((key) => [key, process.env[key]]));
const relevantKeys = [
  "DR_FOREST_ENV",
  "DR_FOREST_DATABASE_URL",
  "DR_FOREST_PRODUCTION_BASE_URL",
  "DR_FOREST_EVIDENCE_BEARER_TOKEN",
  "DR_FOREST_EVIDENCE_PRINCIPAL"
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

try {
  process.env.DR_FOREST_ENV = "pilot";
  const pilot = await runProductionPreflight({ report: productionConfigReport(), databaseUrl: "", serviceUrl: "" });
  assert(pilot.status === "pilot", "Pilot preflight must never report production-ready");

  process.env.DR_FOREST_ENV = "production";
  delete process.env.DR_FOREST_DATABASE_URL;
  delete process.env.DR_FOREST_PRODUCTION_BASE_URL;
  const blocked = await runProductionPreflight({ report: productionConfigReport(), databaseUrl: "", serviceUrl: "" });
  assert(blocked.status === "blocked", "Production preflight must fail closed without external services");
  assert(blocked.database.status === "skipped", "Missing PostgreSQL URL should be reported as skipped, not verified");
  assert(blocked.service.status === "skipped", "Missing service URL should be reported as skipped, not verified");
  assert(blocked.releaseBlockers.some((item) => item.startsWith("DR_FOREST_DATABASE_URL")), "Preflight did not expose the missing database gate");
  assert(!/postgres(?:ql)?:\/\/[^\s]*@/i.test(JSON.stringify(blocked)), "Preflight output should not expose database credentials");
  console.log(JSON.stringify({ ok: true, pilotStatus: pilot.status, productionStatus: blocked.status, blockerCount: blocked.releaseBlockers.length }, null, 2));
} finally {
  for (const key of relevantKeys) {
    if (original.has(key)) process.env[key] = original.get(key);
    else delete process.env[key];
  }
}
