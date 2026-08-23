import { createPublicKey, createVerify } from "node:crypto";
import { authContextFromOidcClaims } from "./ops-auth.mjs";

export const oidcMigrationVersion = "2026-08-17.oidc-jwt-v1";
let jwksCache = { url: null, expiresAt: 0, keys: [] };

function error(message, code = "AUTH_OIDC_INVALID", status = 401) {
  const result = new Error(message);
  result.code = code;
  result.status = status;
  return result;
}
function decodePart(value, label) {
  try { return JSON.parse(Buffer.from(value, "base64url").toString("utf8")); } catch { throw error(`OIDC token ${label} is invalid`); }
}
function bearerFromRequest(req) {
  const match = String(req.headers.authorization || "").match(/^Bearer\s+([^\s]+)$/i);
  return match?.[1] || "";
}
async function readJwks(force = false) {
  const url = String(process.env.DR_FOREST_IDP_JWKS_URL || "").trim();
  if (!url) throw error("DR_FOREST_IDP_JWKS_URL is not configured", "AUTH_OIDC_NOT_CONFIGURED", 503);
  if (!force && jwksCache.url === url && jwksCache.expiresAt > Date.now()) return jwksCache.keys;
  const response = await fetch(url, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(5000) });
  if (!response.ok) throw error("OIDC JWKS endpoint is unavailable", "AUTH_OIDC_JWKS_UNAVAILABLE", 503);
  const body = await response.json();
  if (!Array.isArray(body?.keys)) throw error("OIDC JWKS payload is invalid", "AUTH_OIDC_JWKS_INVALID", 503);
  jwksCache = { url, expiresAt: Date.now() + 10 * 60 * 1000, keys: body.keys };
  return jwksCache.keys;
}

async function verifySignature(header, signingInput, signature) {
  if (header.alg !== "RS256") throw error("Only RS256 OIDC tokens are supported", "AUTH_OIDC_ALG_UNSUPPORTED");
  let keys = await readJwks();
  let jwk = keys.find((item) => item.kid === header.kid && item.kty === "RSA");
  if (!jwk) {
    keys = await readJwks(true);
    jwk = keys.find((item) => item.kid === header.kid && item.kty === "RSA");
  }
  if (!jwk) throw error("OIDC signing key was not found", "AUTH_OIDC_KEY_NOT_FOUND");
  let key;
  try { key = createPublicKey({ key: jwk, format: "jwk" }); } catch { throw error("OIDC signing key is invalid", "AUTH_OIDC_KEY_INVALID"); }
  const verifier = createVerify("RSA-SHA256");
  verifier.update(signingInput);
  verifier.end();
  if (!verifier.verify(key, signature)) throw error("OIDC token signature is invalid", "AUTH_OIDC_SIGNATURE_INVALID");
}

export async function resolveOidcAuthContext(req) {
  const token = bearerFromRequest(req);
  if (!token) throw error("Production requests require an OIDC bearer token", "AUTH_OIDC_TOKEN_REQUIRED");
  const parts = token.split(".");
  if (parts.length !== 3 || token.length > 16_384) throw error("OIDC bearer token is malformed");
  const header = decodePart(parts[0], "header");
  const claims = decodePart(parts[1], "claims");
  const signature = Buffer.from(parts[2], "base64url");
  await verifySignature(header, `${parts[0]}.${parts[1]}`, signature);
  const issuer = String(process.env.DR_FOREST_IDP_ISSUER || "").replace(/\/$/, "");
  const audience = String(process.env.DR_FOREST_IDP_AUDIENCE || "");
  if (!claims.sub || claims.iss !== issuer) throw error("OIDC issuer or subject is invalid", "AUTH_OIDC_CLAIMS_INVALID");
  const audiences = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  if (!audiences.includes(audience)) throw error("OIDC audience is invalid", "AUTH_OIDC_AUDIENCE_INVALID");
  const now = Math.floor(Date.now() / 1000);
  if (!Number.isFinite(Number(claims.exp)) || Number(claims.exp) <= now) throw error("OIDC token has expired", "AUTH_OIDC_EXPIRED");
  if (claims.nbf !== undefined && Number(claims.nbf) > now + 30) throw error("OIDC token is not active yet", "AUTH_OIDC_NOT_ACTIVE");
  return authContextFromOidcClaims(claims);
}

export function oidcHealth() {
  return {
    issuer: Boolean(process.env.DR_FOREST_IDP_ISSUER),
    jwks: Boolean(process.env.DR_FOREST_IDP_JWKS_URL),
    audience: Boolean(process.env.DR_FOREST_IDP_AUDIENCE),
    cachedKeys: jwksCache.keys.length,
    cacheExpiresAt: jwksCache.expiresAt ? new Date(jwksCache.expiresAt).toISOString() : null
  };
}
