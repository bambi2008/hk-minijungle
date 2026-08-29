import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { evaluateIdentityAcceptance } from "../lib/ops-identity-acceptance.mjs";

function option(name, fallback = "") { const index = process.argv.indexOf(name); return index >= 0 ? String(process.argv[index + 1] || "").trim() : fallback; }
function required(value, label) { if (!String(value || "").trim()) throw new Error(`${label} is required`); return String(value).trim(); }
async function getJson(baseUrl, path, token) {
  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}${path}`, { headers: { accept: "application/json", authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(10_000) });
    let body = null;
    try { body = await response.json(); } catch { body = null; }
    return { status: response.status, body };
  } catch (error) { return { status: 0, body: null, reason: error.message }; }
}
function roleCheck(id, context, roleId, clientScope) {
  return { id, passed: context.status === 200 && context.body?.auth?.roleId === roleId && context.body?.auth?.clientScope === clientScope, detail: `${id} must resolve as ${roleId} with ${clientScope} scope` };
}
function scopedAssetCheck(id, portfolio, assets, expectedClientId) {
  const listedClients = new Set((assets.body?.assets || []).map((asset) => asset.clientId));
  const onlyExpected = listedClients.size === 0 || (listedClients.size === 1 && listedClients.has(expectedClientId));
  return { id, passed: portfolio.status === 200 && portfolio.body?.auth?.clientScope === "scoped" && portfolio.body?.auth?.clientIds?.length === 1 && portfolio.body.auth.clientIds[0] === expectedClientId && assets.status === 200 && onlyExpected, detail: `${id} must expose only client ${expectedClientId}` };
}

export async function main() {
  const baseUrl = required(option("--url", process.env.DR_FOREST_PRODUCTION_BASE_URL), "--url or DR_FOREST_PRODUCTION_BASE_URL");
  const platformToken = required(option("--platform-token", process.env.DR_FOREST_OIDC_PLATFORM_TOKEN), "--platform-token or DR_FOREST_OIDC_PLATFORM_TOKEN");
  const fmToken = required(option("--fm-token", process.env.DR_FOREST_OIDC_FM_TOKEN), "--fm-token or DR_FOREST_OIDC_FM_TOKEN");
  const clientAToken = required(option("--client-a-token", process.env.DR_FOREST_OIDC_CLIENT_A_TOKEN), "--client-a-token or DR_FOREST_OIDC_CLIENT_A_TOKEN");
  const clientAId = required(option("--client-a-id", process.env.DR_FOREST_OIDC_CLIENT_A_ID), "--client-a-id or DR_FOREST_OIDC_CLIENT_A_ID");
  const clientBToken = required(option("--client-b-token", process.env.DR_FOREST_OIDC_CLIENT_B_TOKEN), "--client-b-token or DR_FOREST_OIDC_CLIENT_B_TOKEN");
  const clientBId = required(option("--client-b-id", process.env.DR_FOREST_OIDC_CLIENT_B_ID), "--client-b-id or DR_FOREST_OIDC_CLIENT_B_ID");
  if (clientAId === clientBId) throw new Error("--client-a-id and --client-b-id must be different for scope isolation testing");
  const [platform, fm, clientA, clientB] = await Promise.all([platformToken, fmToken, clientAToken, clientBToken].map((token) => getJson(baseUrl, "/api/auth/context", token)));
  const [platformPolicy, fmPortfolio, clientAPortfolio, clientBPortfolio, clientAAssets, clientBAssets] = await Promise.all([
    getJson(baseUrl, "/api/auth/policy", platformToken),
    getJson(baseUrl, "/api/portfolio", fmToken),
    getJson(baseUrl, "/api/portfolio", clientAToken),
    getJson(baseUrl, "/api/portfolio", clientBToken),
    getJson(baseUrl, "/api/assets", clientAToken),
    getJson(baseUrl, "/api/assets", clientBToken)
  ]);
  const report = evaluateIdentityAcceptance([
    roleCheck("platform-role", platform, "platform-admin", "all"),
    { id: "platform-policy", passed: platformPolicy.status === 200 && platformPolicy.body?.version, detail: "Platform Admin must be able to read the auth policy endpoint" },
    roleCheck("fm-role", fm, "fm-lead", "all"),
    { id: "fm-portfolio", passed: fmPortfolio.status === 200, detail: "FM Lead must be able to read the portfolio" },
    roleCheck("client-a-role", clientA, "client-viewer", "scoped"),
    roleCheck("client-b-role", clientB, "client-viewer", "scoped"),
    scopedAssetCheck("client-a-scope", clientAPortfolio, clientAAssets, clientAId),
    scopedAssetCheck("client-b-scope", clientBPortfolio, clientBAssets, clientBId),
    { id: "client-scope-separation", passed: clientA.body?.auth?.clientIds?.includes(clientBId) !== true && clientB.body?.auth?.clientIds?.includes(clientAId) !== true, detail: "Client A and Client B tokens must not contain one another's scope" }
  ]);
  console.log(JSON.stringify(report, null, 2));
  if (process.argv.includes("--strict") && report.status !== "verified") process.exitCode = 2;
  return report;
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) await main();
