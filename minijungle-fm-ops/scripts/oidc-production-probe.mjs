import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { probeOidcProvider } from "../lib/ops-oidc-probe.mjs";

function option(name, fallback = "") { const index = process.argv.indexOf(name); return index >= 0 ? String(process.argv[index + 1] || "").trim() : fallback; }

export async function main() {
  const report = await probeOidcProvider({
    issuer: option("--issuer", process.env.DR_FOREST_IDP_ISSUER),
    jwksUrl: option("--jwks-url", process.env.DR_FOREST_IDP_JWKS_URL),
    audience: option("--audience", process.env.DR_FOREST_IDP_AUDIENCE),
    serviceUrl: option("--url", process.env.DR_FOREST_PRODUCTION_BASE_URL),
    bearerToken: option("--bearer-token", process.env.DR_FOREST_EVIDENCE_BEARER_TOKEN),
    principal: option("--principal", process.env.DR_FOREST_EVIDENCE_PRINCIPAL)
  });
  console.log(JSON.stringify(report, null, 2));
  if (process.argv.includes("--strict") && report.status !== "verified") process.exitCode = 2;
  return report;
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) await main();
