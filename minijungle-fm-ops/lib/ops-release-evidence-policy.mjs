import { randomUUID } from "node:crypto";

export const releaseEvidenceMigrationVersion = "2026-09-08.release-evidence-ledger-v1";
export const postgresReleaseEvidenceMigrationVersion = "2026-09-08.postgres-release-evidence-ledger-v1";
export const releaseEvidenceStatuses = new Set(["submitted", "verified", "rejected"]);
export const releaseEvidenceDecisions = new Set(["verified", "rejected"]);
export const releaseEvidenceRequirements = Object.freeze([
  { key: "full-postgres-migration", label: "Full PostgreSQL migration", description: "All production master-data and operational migrations are applied and observed.", hardCap: 65 },
  { key: "offhost-restore-drill", label: "Off-host restore drill", description: "An encrypted backup was restored on a separate host and the result was independently checked.", hardCap: 65 },
  { key: "real-device-pilot", label: "Real signed-device pilot", description: "Physical devices sent signed readings/camera captures through the production gateway.", hardCap: 67 },
  { key: "multi-client-pilot", label: "Repeated multi-client pilot", description: "More than one client completed repeated service cycles with retained operational evidence.", hardCap: 78 },
  { key: "monitoring-verified", label: "Monitoring and alert routing", description: "Hosted job monitoring, alert delivery, acknowledgement and recovery were exercised.", hardCap: 70 },
  { key: "ai-provider-verified", label: "AI provider evaluation", description: "A real vision provider was evaluated with labelled captures and human review outcomes.", hardCap: 78 },
  { key: "media-scan-verified", label: "Media malware scanning", description: "Uploaded proof and camera media passed the production malware-scanning path.", hardCap: 66 }
]);

function evidenceError(message, code = "RELEASE_EVIDENCE_VALIDATION_ERROR", status = 400) {
  const error = new Error(message); error.code = code; error.status = status; return error;
}
function required(value, field) { const result = String(value || "").trim(); if (!result) throw evidenceError(`${field} is required`); return result; }
function isoDate(value, field, requiredValue = true) {
  if (!value && !requiredValue) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) throw evidenceError(`${field} must be an ISO date-time`);
  return parsed.toISOString();
}
function requirementFor(key) { return releaseEvidenceRequirements.find((item) => item.key === key) || null; }
function artifactReference(value) {
  const result = required(value, "artifactRef");
  if (result.length > 500) throw evidenceError("artifactRef is too long");
  if (!/^(https:\/\/|s3:\/\/|evidence:\/\/)/i.test(result)) throw evidenceError("artifactRef must use https://, s3:// or evidence://");
  return result;
}
function sha256(value) {
  const result = required(value, "artifactSha256").toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(result)) throw evidenceError("artifactSha256 must be a 64-character SHA-256 hex digest");
  return result;
}

export function requirementByKey(key) { return requirementFor(String(key || "").trim()) || null; }

export function normalizeReleaseEvidenceSubmission(input = {}) {
  const requirementKey = required(input.requirementKey, "requirementKey");
  const requirement = requirementFor(requirementKey);
  if (!requirement) throw evidenceError("requirementKey is not a known production gate", "RELEASE_EVIDENCE_REQUIREMENT_UNKNOWN");
  const observedAt = isoDate(input.observedAt, "observedAt");
  const expiresAt = isoDate(input.expiresAt, "expiresAt", false);
  if (expiresAt && Date.parse(expiresAt) <= Date.parse(observedAt)) throw evidenceError("expiresAt must be after observedAt");
  return {
    id: required(input.id || `RE-${randomUUID()}`, "id"),
    requirementKey,
    artifactRef: artifactReference(input.artifactRef),
    artifactSha256: sha256(input.artifactSha256),
    observedAt,
    expiresAt,
    note: required(input.note, "note").slice(0, 500),
    submittedBy: required(input.submittedBy || "system", "submittedBy"),
    submittedAt: isoDate(input.submittedAt || new Date().toISOString(), "submittedAt"),
    status: "submitted"
  };
}

export function normalizeReleaseEvidenceReview(existing, input = {}) {
  if (!existing) throw evidenceError("release evidence record was not found", "RELEASE_EVIDENCE_NOT_FOUND", 404);
  const decision = required(input.decision, "decision").toLowerCase();
  if (!releaseEvidenceDecisions.has(decision)) throw evidenceError("decision must be verified or rejected");
  if (existing.status !== "submitted") throw evidenceError("only submitted evidence can be reviewed", "RELEASE_EVIDENCE_REVIEW_INVALID", 409);
  const reviewer = required(input.reviewedBy || "system", "reviewedBy");
  if (reviewer === existing.submittedBy) throw evidenceError("the submitter cannot independently verify the same evidence", "RELEASE_EVIDENCE_SEPARATION_OF_DUTIES", 409);
  return {
    decision,
    reviewedBy: reviewer,
    reviewedAt: new Date().toISOString(),
    reviewNote: required(input.reviewNote, "reviewNote").slice(0, 500),
    expectedUpdatedAt: required(input.expectedUpdatedAt, "expectedUpdatedAt")
  };
}

export function releaseEvidenceState(record, now = new Date()) {
  if (!record) return "missing";
  if (record.status === "verified" && record.expiresAt && Date.parse(record.expiresAt) <= now.getTime()) return "expired";
  return record.status;
}
