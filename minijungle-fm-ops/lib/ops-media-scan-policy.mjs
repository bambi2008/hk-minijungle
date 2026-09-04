export const mediaScanPolicyVersion = "2026-09-04.media-malware-scan-v1";

export const mediaScanStatuses = ["pending", "clean", "quarantined", "error"];

function validationError(message, code = "PROOF_MEDIA_SCAN_VALIDATION_ERROR") {
  const error = new Error(message);
  error.status = 400;
  error.code = code;
  return error;
}

function required(value, field) {
  const text = String(value || "").trim();
  if (!text) throw validationError(`${field} is required`);
  return text;
}

function timestamp(value, field) {
  const text = required(value, field);
  const date = new Date(text);
  if (!Number.isFinite(date.getTime())) throw validationError(`${field} must be an ISO timestamp`);
  return date.toISOString();
}

export function normalizeProofMediaScan(input, expectedSha256) {
  const scan = {
    scanId: required(input?.scanId, "scan.scanId"),
    provider: required(input?.provider, "scan.provider"),
    status: required(input?.status, "scan.status").toLowerCase(),
    sha256: required(input?.sha256, "scan.sha256").toLowerCase(),
    scannedAt: timestamp(input?.scannedAt, "scan.scannedAt"),
    recordedBy: required(input?.recordedBy, "scan.recordedBy"),
    note: input?.note ? String(input.note).trim() : ""
  };

  if (!mediaScanStatuses.includes(scan.status)) {
    throw validationError(`scan.status must be one of ${mediaScanStatuses.join(", ")}`);
  }
  if (!/^[a-f0-9]{64}$/.test(scan.sha256)) {
    throw validationError("scan.sha256 must be a 64-character hex digest");
  }
  if (expectedSha256 && scan.sha256 !== String(expectedSha256).toLowerCase()) {
    throw validationError("scan.sha256 does not match the proof media ledger", "PROOF_MEDIA_SCAN_HASH_MISMATCH");
  }
  return scan;
}

export function proofMediaScanSummary(scan) {
  if (!scan) return { status: "not-scanned", result: null };
  return { status: scan.status, result: scan };
}
