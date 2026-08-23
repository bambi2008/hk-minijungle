import { timingSafeEqual } from "node:crypto";

export const productionConfigVersion = "2026-08-23.production-gate-v3";

const REQUIRED_PRODUCTION_CONFIG = [
  ["DR_FOREST_DATABASE_URL", "managed relational database URL"],
  ["DR_FOREST_OBJECT_STORAGE_ENDPOINT", "S3-compatible object storage endpoint"],
  ["DR_FOREST_OBJECT_STORAGE_BUCKET", "proof and camera media bucket"],
  ["DR_FOREST_OBJECT_STORAGE_ACCESS_KEY", "object storage access key"],
  ["DR_FOREST_OBJECT_STORAGE_SECRET_KEY", "object storage secret key"],
  ["DR_FOREST_STORAGE_BACKEND", "application persistence backend"],
  ["DR_FOREST_PROOF_MEDIA_BACKEND", "proof media backend"],
  ["DR_FOREST_BACKUP_DESTINATION", "off-host backup destination"],
  ["DR_FOREST_BACKUP_ENCRYPTION_KEY", "backup encryption key"],
  ["DR_FOREST_IDP_ISSUER", "OIDC issuer"],
  ["DR_FOREST_IDP_JWKS_URL", "OIDC JWKS URL"],
  ["DR_FOREST_IDP_AUDIENCE", "OIDC audience"],
  ["DR_FOREST_ALLOWED_ORIGINS", "allowed browser origins"],
  ["DR_FOREST_DEVICE_SIGNING_SECRET", "device request signing secret"],
  ["DR_FOREST_EVIDENCE_SIGNING_SECRET", "evidence snapshot signing secret"],
  ["DR_FOREST_EVIDENCE_RETENTION_DAYS", "evidence snapshot retention period"],
  ["DR_FOREST_ALERT_WEBHOOK_URL", "alert notification webhook URL"],
  ["DR_FOREST_ALERT_WEBHOOK_SECRET", "alert notification webhook signing secret"],
  ["DR_FOREST_FULL_POSTGRES_MIGRATION", "full production database migration evidence"],
  ["DR_FOREST_OFFHOST_RESTORE_DRILL", "off-host restore drill evidence"],
  ["DR_FOREST_REAL_DEVICE_PILOT", "real signed device pilot evidence"],
  ["DR_FOREST_MULTI_CLIENT_PILOT", "repeated multi-client operations evidence"],
  ["DR_FOREST_MONITORING_VERIFIED", "monitoring and alert routing evidence"],
  ["DR_FOREST_AI_PROVIDER_VERIFIED", "AI provider evaluation evidence"],
  ["DR_FOREST_MEDIA_SCAN_VERIFIED", "media malware scanning evidence"]
];

function clean(value) { return String(value || "").trim(); }
function isProduction() { return clean(process.env.DR_FOREST_ENV || "pilot").toLowerCase() === "production"; }
function isHttpsUrl(value) { try { return new URL(value).protocol === "https:"; } catch { return false; } }
function isDatabaseUrl(value) { return /^(postgres|postgresql):\/\//i.test(value); }
function hasMinEntropy(value, bytes = 32) { return Buffer.byteLength(value, "utf8") >= bytes; }

function checkConfig(name, description, value, valid, detail = null) {
  return { name, description, configured: Boolean(value), valid, detail };
}

export function productionConfigReport() {
  const production = isProduction();
  const databaseUrl = clean(process.env.DR_FOREST_DATABASE_URL);
  const objectEndpoint = clean(process.env.DR_FOREST_OBJECT_STORAGE_ENDPOINT);
  const backupDestination = clean(process.env.DR_FOREST_BACKUP_DESTINATION);
  const idpIssuer = clean(process.env.DR_FOREST_IDP_ISSUER);
  const origins = clean(process.env.DR_FOREST_ALLOWED_ORIGINS);
  const checks = REQUIRED_PRODUCTION_CONFIG.map(([name, description]) => {
    const value = clean(process.env[name]);
    let valid = Boolean(value);
    let detail = null;
    if (name === "DR_FOREST_DATABASE_URL") {
      valid = isDatabaseUrl(value);
      detail = valid ? "postgresql" : "must use postgres:// or postgresql://";
    }
    if (name === "DR_FOREST_OBJECT_STORAGE_ENDPOINT") {
      valid = isHttpsUrl(value);
      detail = valid ? "https endpoint" : "must be an https URL";
    }
    if (name === "DR_FOREST_BACKUP_DESTINATION") {
      valid = /^(s3|https):\/\//i.test(value);
      detail = valid ? "off-host destination" : "must be an s3:// or https:// destination";
    }
    if (name === "DR_FOREST_IDP_ISSUER") {
      valid = isHttpsUrl(value);
      detail = valid ? "https issuer" : "must be an https OIDC issuer";
    }
    if (name === "DR_FOREST_ALERT_WEBHOOK_URL") {
      valid = isHttpsUrl(value);
      detail = valid ? "https webhook" : "must be an https alert webhook URL";
    }
    if (name === "DR_FOREST_IDP_JWKS_URL") {
      valid = isHttpsUrl(value);
      detail = valid ? "https JWKS endpoint" : "must be an https JWKS URL";
    }
    if (name === "DR_FOREST_BACKUP_ENCRYPTION_KEY" || name === "DR_FOREST_DEVICE_SIGNING_SECRET" || name === "DR_FOREST_EVIDENCE_SIGNING_SECRET" || name === "DR_FOREST_ALERT_WEBHOOK_SECRET") {
      valid = hasMinEntropy(value);
      detail = valid ? "minimum 32 bytes" : "must contain at least 32 bytes";
    }
    if (name === "DR_FOREST_EVIDENCE_RETENTION_DAYS") {
      const days = Number(value);
      valid = Number.isInteger(days) && days >= 30 && days <= 3650;
      detail = valid ? "30 to 3650 days" : "must be an integer from 30 to 3650";
    }
    if (name === "DR_FOREST_ALLOWED_ORIGINS") {
      valid = value.split(",").map((item) => item.trim()).every((origin) => isHttpsUrl(origin));
      detail = valid ? "https origins" : "all origins must use https://";
    }
    if (name === "DR_FOREST_OBJECT_STORAGE_BUCKET" || name === "DR_FOREST_OBJECT_STORAGE_ACCESS_KEY" || name === "DR_FOREST_OBJECT_STORAGE_SECRET_KEY" || name === "DR_FOREST_IDP_AUDIENCE") {
      detail = valid ? "configured" : "required";
    }
    if (name === "DR_FOREST_STORAGE_BACKEND") {
      valid = value.toLowerCase() === "postgres";
      detail = valid ? "postgres runtime and master data" : "must be postgres in production";
    }
    if (name === "DR_FOREST_PROOF_MEDIA_BACKEND") {
      valid = value.toLowerCase() === "s3";
      detail = valid ? "S3-compatible media" : "must be s3 in production";
    }
    if (["DR_FOREST_FULL_POSTGRES_MIGRATION", "DR_FOREST_OFFHOST_RESTORE_DRILL", "DR_FOREST_REAL_DEVICE_PILOT", "DR_FOREST_MULTI_CLIENT_PILOT", "DR_FOREST_MONITORING_VERIFIED", "DR_FOREST_AI_PROVIDER_VERIFIED", "DR_FOREST_MEDIA_SCAN_VERIFIED"].includes(name)) {
      valid = value.toLowerCase() === "verified";
      detail = valid ? "verified evidence marker" : "must be verified after the corresponding real-world check";
    }
    return checkConfig(name, description, value, valid, detail);
  });
  const failures = production ? checks.filter((item) => !item.valid).map((item) => ({ name: item.name, detail: item.detail })) : [];
  return {
    version: productionConfigVersion,
    mode: production ? "production" : "pilot",
    production,
    ready: failures.length === 0,
    failures,
    checks: checks.map(({ name, description, valid, detail }) => ({ name, description, valid, detail })),
    storage: {
      database: production ? clean(process.env.DR_FOREST_STORAGE_BACKEND) || "postgres-required" : "sqlite-pilot",
      objectStorage: production ? clean(process.env.DR_FOREST_PROOF_MEDIA_BACKEND) || "s3-required" : "local-filesystem-pilot",
      backups: production ? "encrypted-off-host-required" : "local-backup-available"
    },
    identity: {
      provider: production ? "oidc-required" : "pilot-session-or-demo-principal",
      demoPrincipalsAllowed: !production
    },
    deviceSecurity: {
      requestSigning: production ? "hmac-required" : "shared-key-compatible",
      replayWindowSeconds: Number(process.env.DR_FOREST_DEVICE_REPLAY_WINDOW_SECONDS || 300)
    }
  };
}

export function assertProductionReady() {
  const report = productionConfigReport();
  if (!report.ready) {
    const error = new Error(`Production configuration is incomplete: ${report.failures.map((item) => `${item.name} (${item.detail})`).join(", ")}`);
    error.code = "PRODUCTION_CONFIG_INCOMPLETE";
    error.status = 503;
    error.report = report;
    throw error;
  }
  return report;
}

export function requestIp(req) {
  if (process.env.DR_FOREST_TRUST_PROXY === "true") {
    const forwarded = clean(req.headers["x-forwarded-for"]).split(",")[0];
    if (forwarded) return forwarded;
  }
  return clean(req.socket?.remoteAddress || "unknown");
}

const rateBuckets = new Map();
const MAX_RATE_BUCKETS = 5000;
export function enforceRateLimit(req, key, limit, windowMs) {
  const bucketKey = `${key}:${requestIp(req)}`;
  const now = Date.now();
  for (const [existingKey, bucket] of rateBuckets) if (now >= bucket.resetAt) rateBuckets.delete(existingKey);
  if (rateBuckets.size >= MAX_RATE_BUCKETS && !rateBuckets.has(bucketKey)) {
    const oldest = rateBuckets.keys().next().value;
    if (oldest) rateBuckets.delete(oldest);
  }
  const current = rateBuckets.get(bucketKey);
  if (!current || now >= current.resetAt) {
    rateBuckets.set(bucketKey, { count: 1, resetAt: now + windowMs });
    return;
  }
  current.count += 1;
  if (current.count <= limit) return;
  const error = new Error("Too many requests");
  error.status = 429;
  error.code = "RATE_LIMITED";
  error.retryAfter = Math.ceil((current.resetAt - now) / 1000);
  throw error;
}

export function assertBrowserOrigin(req) {
  if (!isProduction()) return;
  const cookie = clean(req.headers.cookie);
  if (!cookie) return;
  const origin = clean(req.headers.origin || req.headers.referer).replace(/\/$/, "");
  const allowed = clean(process.env.DR_FOREST_ALLOWED_ORIGINS).split(",").map((item) => item.trim().replace(/\/$/, "")).filter(Boolean);
  if (!origin || !allowed.includes(origin)) {
    const error = new Error("Browser origin is not allowed for this session");
    error.status = 403;
    error.code = "CSRF_ORIGIN_REJECTED";
    throw error;
  }
}

export function constantTimeEqual(left, right) {
  const a = Buffer.from(String(left || ""));
  const b = Buffer.from(String(right || ""));
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
