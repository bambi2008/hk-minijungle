export const commissioningMigrationVersion = "2026-09-03.module-commissioning-v1";
export const postgresCommissioningMigrationVersion = "2026-09-03.postgres-module-commissioning-v1";

export const commissioningStatuses = ["unplanned", "planned", "installed", "verified", "suspended", "retired"];
export const commissioningChecklistKeys = [
  "identityLabelApplied",
  "physicalMountChecked",
  "waterCircuitChecked",
  "electricalSafetyChecked",
  "deviceMappingChecked",
  "cameraViewChecked"
];

const transitions = {
  planned: new Set(["installed", "retired"]),
  installed: new Set(["verified", "suspended", "retired"]),
  verified: new Set(["suspended", "retired"]),
  suspended: new Set(["installed", "verified", "retired"]),
  retired: new Set()
};

export function commissioningError(message, code = "COMMISSIONING_VALIDATION_ERROR", status = 400) {
  const error = new Error(message);
  error.code = code;
  error.status = status;
  return error;
}

function required(value, field) {
  const text = String(value || "").trim();
  if (!text) throw commissioningError(`${field} is required`);
  return text;
}

function optional(value) {
  const text = String(value || "").trim();
  return text || null;
}

export function normalizeCommissioningChecklist(input = {}) {
  return Object.fromEntries(commissioningChecklistKeys.map((key) => [key, input?.[key] === true]));
}

export function validateCommissioningPlan(input = {}) {
  const moduleId = required(input.moduleId, "moduleId");
  const serialNumber = required(input.serialNumber, "serialNumber").toUpperCase();
  const publicCode = required(input.publicCode || `DRF-${moduleId}`, "publicCode").toUpperCase();
  if (!/^[A-Z0-9][A-Z0-9._-]{2,63}$/.test(serialNumber)) throw commissioningError("serialNumber must contain 3-64 letters, numbers, dots, underscores or hyphens");
  if (!/^[A-Z0-9][A-Z0-9._-]{2,63}$/.test(publicCode)) throw commissioningError("publicCode must contain 3-64 letters, numbers, dots, underscores or hyphens");
  return {
    moduleId,
    serialNumber,
    publicCode,
    hardwareRevision: optional(input.hardwareRevision),
    installLocation: optional(input.installLocation),
    note: optional(input.note)
  };
}

export function validateCommissioningTransition(current, input = {}) {
  if (!current || current.status === "unplanned") throw commissioningError("commissioning record not found", "COMMISSIONING_NOT_FOUND", 404);
  const toStatus = required(input.toStatus, "toStatus").toLowerCase();
  if (!commissioningStatuses.includes(toStatus) || toStatus === "unplanned" || toStatus === "planned") throw commissioningError("unsupported commissioning target status");
  if (!transitions[current.status]?.has(toStatus)) throw commissioningError(`cannot move commissioning from ${current.status} to ${toStatus}`, "COMMISSIONING_TRANSITION_INVALID", 409);
  const expectedUpdatedAt = required(input.expectedUpdatedAt, "expectedUpdatedAt");
  const checklist = normalizeCommissioningChecklist(input.checklist || current.checklist);
  const requiredKeys = toStatus === "installed" ? commissioningChecklistKeys.slice(0, 4) : toStatus === "verified" ? commissioningChecklistKeys : [];
  const missingChecks = requiredKeys.filter((key) => !checklist[key]);
  if (missingChecks.length) throw commissioningError(`required checks are incomplete: ${missingChecks.join(", ")}`, "COMMISSIONING_CHECKLIST_INCOMPLETE", 409);
  const note = optional(input.note);
  if (["suspended", "retired"].includes(toStatus) && !note) throw commissioningError(`${toStatus} requires an audit note`);
  return { toStatus, expectedUpdatedAt, checklist, note };
}

export function summarizeCommissioning(records = []) {
  const byStatus = Object.fromEntries(commissioningStatuses.map((status) => [status, 0]));
  for (const record of records) byStatus[record.status] = Number(byStatus[record.status] || 0) + 1;
  return {
    totalModules: records.length,
    ...byStatus,
    commissioned: byStatus.installed + byStatus.verified + byStatus.suspended,
    actionRequired: byStatus.unplanned + byStatus.planned + byStatus.suspended
  };
}
