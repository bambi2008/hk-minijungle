export const oidcProbeVersion = "2026-08-29.oidc-production-probe-v1";

function clean(value) { return String(value || "").trim(); }
function httpsUrl(value, label) {
  const result = clean(value);
  try { if (new URL(result).protocol !== "https:") throw new Error(); } catch { throw new Error(`${label} must be an https URL`); }
  return result.replace(/\/$/, "");
}
function safeError(error) { return String(error?.message || error || "unknown error").replace(/Bearer\s+[^\s]+/gi, "Bearer [redacted]"); }
async function getJson(url) {
  try {
    const response = await fetch(url, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(8_000) });
    let body = null;
    try { body = await response.json(); } catch { body = null; }
    return { status: response.status, body };
  } catch (error) { return { status: 0, body: null, reason: safeError(error) }; }
}

export async function probeOidcProvider({ issuer, jwksUrl, audience, serviceUrl = "", bearerToken = "", principal = "" } = {}) {
  let issuerUrl;
  let keysUrl;
  try {
    issuerUrl = httpsUrl(issuer, "OIDC issuer");
    keysUrl = httpsUrl(jwksUrl, "OIDC JWKS URL");
  } catch (error) { return { status: "blocked", reason: error.message, discovery: null, jwks: null, service: null, limitations: ["OIDC provider configuration is incomplete or insecure."] }; }
  const audienceValue = clean(audience);
  if (!audienceValue) return { version: oidcProbeVersion, status: "blocked", reason: "OIDC audience is required", discovery: null, jwks: null, service: null, limitations: ["The service cannot verify production tokens without an explicit audience."] };
  const discovery = await getJson(`${issuerUrl}/.well-known/openid-configuration`);
  const jwks = await getJson(keysUrl);
  const discoveryIssuer = clean(discovery.body?.issuer).replace(/\/$/, "");
  const discoveryKeysUrl = clean(discovery.body?.jwks_uri).replace(/\/$/, "");
  const rsaKeys = Array.isArray(jwks.body?.keys) ? jwks.body.keys.filter((item) => item?.kty === "RSA" && item?.kid) : [];
  const providerVerified = discovery.status === 200 && discoveryIssuer === issuerUrl && discoveryKeysUrl === keysUrl && jwks.status === 200 && rsaKeys.length > 0;
  let service = null;
  if (serviceUrl && bearerToken) {
    const base = clean(serviceUrl).replace(/\/$/, "");
    try {
      const response = await fetch(`${base}/api/health/ready`, { headers: { accept: "application/json", authorization: `Bearer ${bearerToken}`, ...(principal ? { "x-dr-forest-principal": principal } : {}) }, signal: AbortSignal.timeout(8_000) });
      let body = null;
      try { body = await response.json(); } catch { body = null; }
      service = { status: response.status, ready: response.status === 200 && body?.status === "ready", identityProvider: body?.productionGate?.identity?.provider || null };
    } catch (error) { service = { status: 0, ready: false, reason: safeError(error) }; }
  } else service = { status: "skipped", ready: false, reason: "A real short-lived bearer token and production service URL are required for token verification" };
  const tokenVerified = service.ready && service.identityProvider === "oidc-required";
  return {
    version: oidcProbeVersion,
    status: providerVerified && tokenVerified ? "verified" : "blocked",
    providerVerified,
    tokenVerified,
    issuer: issuerUrl,
    audience: audienceValue,
    discovery: { status: discovery.status, issuer: discoveryIssuer || null, jwksUri: discoveryKeysUrl || null, reason: discovery.reason || null },
    jwks: { status: jwks.status, rsaKeyCount: rsaKeys.length, reason: jwks.reason || null },
    service,
    limitations: ["This probe proves provider discovery, JWKS reachability and one authenticated service path; MFA enrollment, role transitions, client-scope isolation and revocation still require a dated human acceptance test."]
  };
}
