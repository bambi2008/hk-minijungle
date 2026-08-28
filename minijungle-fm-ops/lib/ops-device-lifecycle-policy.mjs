export const deviceLifecycleMigrationVersion = "2026-09-04.device-lifecycle-v1";
export const postgresDeviceLifecycleMigrationVersion = "2026-09-04.postgres-device-lifecycle-v1";

export const deviceLifecycleStatuses = ["in_service", "fault", "quarantined", "replaced", "retired"];
export const deviceLifecycleActions = ["calibrated", "fault_reported", "quarantined", "returned_to_service", "replaced", "retired"];

export function deviceLifecycleError(message, code = "DEVICE_LIFECYCLE_VALIDATION_ERROR", status = 400) {
  const error = new Error(message);
  error.code = code;
  error.status = status;
  return error;
}

function required(value, field) {
  const text = String(value || "").trim();
  if (!text) throw deviceLifecycleError(`${field} is required`);
  return text;
}

function optional(value) {
  const text = String(value || "").trim();
  return text || null;
}

function positiveInteger(value, field, { min = 1, max = 3650 } = {}) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < min || number > max) throw deviceLifecycleError(`${field} must be an integer from ${min} to ${max}`);
  return number;
}

function iso(value, field) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw deviceLifecycleError(`${field} must be an ISO date/time`);
  return date.toISOString();
}

export function nextCalibrationAt(lastCalibratedAt, intervalDays) {
  return new Date(new Date(lastCalibratedAt).getTime() + Number(intervalDays) * 86400000).toISOString();
}

export function validateDeviceLifecycleProfile(input = {}) {
  const calibrationIntervalDays = positiveInteger(input.calibrationIntervalDays ?? 180, "calibrationIntervalDays");
  const lastCalibratedAt = input.lastCalibratedAt ? iso(input.lastCalibratedAt, "lastCalibratedAt") : null;
  const nextDueAt = input.nextCalibrationDueAt
    ? iso(input.nextCalibrationDueAt, "nextCalibrationDueAt")
    : (lastCalibratedAt ? nextCalibrationAt(lastCalibratedAt, calibrationIntervalDays) : null);
  const serialNumber = required(input.serialNumber, "serialNumber").toUpperCase();
  if (!/^[A-Z0-9][A-Z0-9._-]{2,95}$/.test(serialNumber)) throw deviceLifecycleError("serialNumber must contain 3-96 letters, numbers, dots, underscores or hyphens");
  return {
    serialNumber,
    manufacturer: optional(input.manufacturer),
    model: optional(input.model),
    calibrationIntervalDays,
    lastCalibratedAt,
    nextCalibrationDueAt: nextDueAt,
    warrantyExpiresAt: input.warrantyExpiresAt ? iso(input.warrantyExpiresAt, "warrantyExpiresAt") : null,
    note: optional(input.note)
  };
}

export function validateDeviceLifecycleAction(current, input = {}) {
  if (!current || current.profileStatus === "unmanaged") throw deviceLifecycleError("device lifecycle profile not found", "DEVICE_LIFECYCLE_NOT_FOUND", 404);
  const action = required(input.action, "action").toLowerCase();
  if (!deviceLifecycleActions.includes(action)) throw deviceLifecycleError(`action must be one of ${deviceLifecycleActions.join(", ")}`);
  const expectedUpdatedAt = required(input.expectedUpdatedAt, "expectedUpdatedAt");
  const occurredAt = input.occurredAt ? iso(input.occurredAt, "occurredAt") : new Date().toISOString();
  const note = optional(input.note);
  const evidenceRef = optional(input.evidenceRef);
  const workOrderId = optional(input.workOrderId);
  const replacementDeviceId = optional(input.replacementDeviceId);

  if (["replaced", "retired"].includes(current.status)) throw deviceLifecycleError("terminal device lifecycle record cannot change", "DEVICE_LIFECYCLE_TERMINAL", 409);
  if (["fault_reported", "quarantined", "returned_to_service", "replaced", "retired"].includes(action) && !note) throw deviceLifecycleError(`${action} requires an audit note`);
  if (action === "calibrated" && !evidenceRef) throw deviceLifecycleError("calibrated requires an evidence reference");
  if (action === "replaced" && !replacementDeviceId) throw deviceLifecycleError("replaced requires replacementDeviceId");
  if (action === "returned_to_service" && !["fault", "quarantined"].includes(current.status)) throw deviceLifecycleError("only fault or quarantined devices can return to service", "DEVICE_LIFECYCLE_TRANSITION_INVALID", 409);

  const status = action === "fault_reported" ? "fault"
    : action === "quarantined" ? "quarantined"
      : action === "returned_to_service" || action === "calibrated" ? (action === "calibrated" ? current.status : "in_service")
        : action;
  return { action, status, expectedUpdatedAt, occurredAt, note, evidenceRef, workOrderId, replacementDeviceId };
}

export function summarizeDeviceLifecycle(records = [], now = new Date()) {
  const nowMs = now.getTime();
  const managed = records.filter((record) => record.profileStatus === "managed");
  const due = managed.filter((record) => record.calibrationState === "due");
  return {
    totalDevices: records.length,
    managed: managed.length,
    unmanaged: records.length - managed.length,
    inService: managed.filter((record) => record.status === "in_service").length,
    fault: managed.filter((record) => record.status === "fault").length,
    quarantined: managed.filter((record) => record.status === "quarantined").length,
    calibrationDue: due.length,
    calibrationDueSoon: managed.filter((record) => record.nextCalibrationDueAt && record.calibrationState === "due_soon").length,
    actionRequired: records.length - managed.length + due.length + managed.filter((record) => ["fault", "quarantined"].includes(record.status)).length,
    generatedAt: new Date(nowMs).toISOString()
  };
}

export function calibrationState(record, now = new Date()) {
  if (!record.nextCalibrationDueAt) return "not_scheduled";
  const dueMs = new Date(record.nextCalibrationDueAt).getTime();
  if (dueMs <= now.getTime()) return "due";
  if (dueMs <= now.getTime() + 30 * 86400000) return "due_soon";
  return "current";
}
