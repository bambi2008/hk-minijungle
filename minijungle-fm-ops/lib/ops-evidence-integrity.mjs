import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const defaultEvidenceRetentionDays = 365;
export const minEvidenceRetentionDays = 30;
export const maxEvidenceRetentionDays = 3650;

function integrityError(message, code) {
  const error = new Error(message);
  error.code = code;
  error.status = 400;
  return error;
}

export function canonicalEvidenceHash(payload) {
  return createHash("sha256").update(JSON.stringify(payload), "utf8").digest("hex");
}

export function evidenceSignature(snapshotId, sha256, secret) {
  return createHmac("sha256", secret).update(`${snapshotId}.${sha256}`, "utf8").digest("hex");
}

export function normalizeEvidenceRetention(input = {}, baseDate = new Date()) {
  const retentionClass = String(input.retentionClass || "standard").trim().toLowerCase();
  const retentionDays = Number(input.retentionDays ?? process.env.DR_FOREST_EVIDENCE_RETENTION_DAYS ?? defaultEvidenceRetentionDays);
  if (!["standard", "legal-hold"].includes(retentionClass)) throw integrityError("retentionClass is invalid", "EVIDENCE_RETENTION_CLASS_INVALID");
  if (!Number.isInteger(retentionDays) || retentionDays < 1 || retentionDays > maxEvidenceRetentionDays) throw integrityError(`retentionDays must be an integer from 1 to ${maxEvidenceRetentionDays}`, "EVIDENCE_RETENTION_DAYS_INVALID");
  const start = new Date(input.generatedAt || baseDate);
  if (!Number.isFinite(start.getTime())) throw integrityError("generatedAt is invalid", "EVIDENCE_GENERATED_AT_INVALID");
  return {
    retentionClass,
    retentionDays,
    expiresAt: new Date(start.getTime() + retentionDays * 24 * 60 * 60 * 1000).toISOString()
  };
}

export function verifyEvidenceSnapshotIntegrity(snapshot, secret = String(process.env.DR_FOREST_EVIDENCE_SIGNING_SECRET || "").trim()) {
  const actualSha256 = canonicalEvidenceHash(snapshot?.package || {});
  const hashValid = actualSha256 === snapshot?.sha256 && snapshot?.snapshotId === `EVP-${actualSha256.slice(0, 16)}`;
  const signatureStatus = String(snapshot?.signatureStatus || "unsigned").trim().toLowerCase();
  const expectedSignature = signatureStatus === "signed" && secret
    ? evidenceSignature(snapshot.snapshotId, snapshot.sha256, secret)
    : null;
  const storedSignature = String(snapshot?.signature || "").trim().toLowerCase();
  const signatureValid = Boolean(expectedSignature && /^[a-f0-9]{64}$/.test(storedSignature) && timingSafeEqual(Buffer.from(storedSignature, "utf8"), Buffer.from(expectedSignature, "utf8")));
  let verificationStatus = "failed";
  let verificationError = null;
  if (!hashValid) verificationError = "Stored package does not match its SHA-256 fingerprint.";
  else if (signatureStatus === "unsigned") verificationStatus = "unsigned";
  else if (!secret) {
    verificationStatus = "unverifiable";
    verificationError = "Evidence signing secret is not configured for verification.";
  } else if (!signatureValid) verificationError = "Stored HMAC signature does not match the configured signing secret.";
  else verificationStatus = "verified";
  return {
    verificationStatus,
    verificationError,
    hashValid,
    signatureValid,
    expectedSha256: actualSha256,
    expectedSignature
  };
}
