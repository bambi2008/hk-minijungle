export const workforceMigrationVersion = "2026-08-30.workforce-dispatch-v1";
export const postgresWorkforceMigrationVersion = "2026-08-30.postgres-workforce-dispatch-v1";
export const workforceAssignmentStatuses = new Set(["planned", "accepted", "in_progress", "completed", "cancelled"]);

export function workforceError(message, code = "WORKFORCE_VALIDATION_ERROR", status = 400) {
  const error = new Error(message);
  error.code = code;
  error.status = status;
  return error;
}

function required(value, field) {
  const text = String(value || "").trim();
  if (!text) throw workforceError(`${field} is required`);
  return text;
}

function timeValue(value, field) {
  const text = required(value, field);
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(text)) throw workforceError(`${field} must use HH:mm`);
  return text;
}

function stringList(value, field, max = 30) {
  const source = Array.isArray(value) ? value : String(value || "").split(",");
  const values = [...new Set(source.map((item) => String(item || "").trim()).filter(Boolean))];
  if (!values.length) throw workforceError(`${field} must contain at least one value`);
  if (values.length > max) throw workforceError(`${field} must contain at most ${max} values`);
  return values;
}

function isoDate(value, field = "serviceDate") {
  const text = required(value, field);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text) || Number.isNaN(Date.parse(`${text}T00:00:00Z`))) throw workforceError(`${field} must use YYYY-MM-DD`);
  return text;
}

function boundedInteger(value, field, min, max) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < min || number > max) throw workforceError(`${field} must be between ${min} and ${max}`);
  return number;
}

export function normalizeTechnicianInput(input, existing = null) {
  const now = new Date().toISOString();
  const status = String(input?.status ?? existing?.status ?? "active").trim().toLowerCase();
  if (!["active", "inactive"].includes(status)) throw workforceError("status must be active or inactive");
  const shiftStart = timeValue(input?.shiftStart ?? existing?.shiftStart ?? "08:00", "shiftStart");
  const shiftEnd = timeValue(input?.shiftEnd ?? existing?.shiftEnd ?? "18:00", "shiftEnd");
  if (shiftStart >= shiftEnd) throw workforceError("shiftEnd must be later than shiftStart");
  return {
    id: required(input?.id ?? existing?.id, "technician.id"),
    displayName: required(input?.displayName ?? existing?.displayName, "technician.displayName"),
    status,
    skills: stringList(input?.skills ?? existing?.skills ?? ["plant-care"], "skills"),
    districts: stringList(input?.districts ?? existing?.districts ?? ["*"], "districts"),
    shiftStart,
    shiftEnd,
    maxDailyMinutes: boundedInteger(input?.maxDailyMinutes ?? existing?.maxDailyMinutes ?? 480, "maxDailyMinutes", 60, 960),
    createdBy: existing?.createdBy || required(input?.createdBy, "createdBy"),
    updatedBy: required(input?.updatedBy ?? input?.createdBy, "updatedBy"),
    createdAt: existing?.createdAt || now,
    updatedAt: now
  };
}

export function normalizeAssignmentInput(input, existing = null) {
  const now = new Date().toISOString();
  const status = String(input?.status ?? existing?.status ?? "planned").trim().toLowerCase();
  if (!workforceAssignmentStatuses.has(status)) throw workforceError("assignment status is invalid");
  if (input?.scheduledStart && Number.isNaN(Date.parse(input.scheduledStart))) throw workforceError("scheduledStart must be a valid date-time");
  const scheduledStart = input?.scheduledStart === undefined ? (existing?.scheduledStart || null) : (input.scheduledStart ? new Date(input.scheduledStart).toISOString() : null);
  const serviceDate = isoDate(input?.serviceDate ?? existing?.serviceDate);
  if (scheduledStart && hkDate(scheduledStart) !== serviceDate) throw workforceError("scheduledStart must fall on serviceDate in Hong Kong time");
  return {
    targetType: required(input?.targetType ?? existing?.targetType, "targetType"),
    targetId: required(input?.targetId ?? existing?.targetId, "targetId"),
    technicianId: required(input?.technicianId ?? existing?.technicianId, "technicianId"),
    clientId: required(input?.clientId ?? existing?.clientId, "clientId"),
    wallId: required(input?.wallId ?? existing?.wallId, "wallId"),
    serviceDate,
    scheduledStart,
    estimatedMinutes: boundedInteger(input?.estimatedMinutes ?? existing?.estimatedMinutes ?? 60, "estimatedMinutes", 15, 480),
    requiredSkills: stringList(input?.requiredSkills ?? existing?.requiredSkills ?? ["plant-care"], "requiredSkills"),
    district: required(input?.district ?? existing?.district ?? "*", "district"),
    status,
    assignedBy: required(input?.assignedBy ?? existing?.assignedBy, "assignedBy"),
    createdAt: existing?.createdAt || now,
    updatedAt: now
  };
}

function hkDate(value) {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Hong_Kong", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(value));
  const part = (type) => parts.find((item) => item.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function hkMinutes(value) {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Hong_Kong", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(value));
  const hour = Number(parts.find((part) => part.type === "hour")?.value || 0);
  const minute = Number(parts.find((part) => part.type === "minute")?.value || 0);
  return hour * 60 + minute;
}

function clockMinutes(value) {
  const [hour, minute] = String(value).split(":").map(Number);
  return hour * 60 + minute;
}

function overlaps(startA, minutesA, startB, minutesB) {
  const a = new Date(startA).getTime();
  const b = new Date(startB).getTime();
  return a < b + minutesB * 60000 && b < a + minutesA * 60000;
}

export function evaluateTechnicianCandidate(technician, assignments, context) {
  const reasons = [];
  const activeAssignments = assignments.filter((item) => !["completed", "cancelled"].includes(item.status) && item.serviceDate === context.serviceDate && !(item.targetType === context.targetType && item.targetId === context.targetId));
  const allocatedMinutes = activeAssignments.reduce((sum, item) => sum + Number(item.estimatedMinutes || 0), 0);
  const remainingMinutes = Math.max(0, Number(technician.maxDailyMinutes) - allocatedMinutes);
  if (technician.status !== "active") reasons.push("technician is inactive");
  if (context.district !== "*" && !technician.districts.includes("*") && !technician.districts.includes(context.district)) reasons.push(`district ${context.district} is not covered`);
  const missingSkills = context.requiredSkills.filter((skill) => !technician.skills.includes("*") && !technician.skills.includes(skill));
  if (missingSkills.length) reasons.push(`missing skills: ${missingSkills.join(", ")}`);
  if (allocatedMinutes + context.estimatedMinutes > technician.maxDailyMinutes) reasons.push(`daily capacity exceeded by ${allocatedMinutes + context.estimatedMinutes - technician.maxDailyMinutes} minutes`);
  if (context.scheduledStart) {
    const start = hkMinutes(context.scheduledStart);
    const end = start + context.estimatedMinutes;
    if (start < clockMinutes(technician.shiftStart) || end > clockMinutes(technician.shiftEnd)) reasons.push(`outside shift ${technician.shiftStart}-${technician.shiftEnd}`);
    if (activeAssignments.some((item) => item.scheduledStart && overlaps(context.scheduledStart, context.estimatedMinutes, item.scheduledStart, item.estimatedMinutes))) reasons.push("scheduled time overlaps another assignment");
  }
  return {
    technician,
    eligible: reasons.length === 0,
    reasons,
    workload: {
      serviceDate: context.serviceDate,
      assignmentCount: activeAssignments.length,
      allocatedMinutes,
      remainingMinutes,
      projectedMinutes: allocatedMinutes + context.estimatedMinutes,
      maxDailyMinutes: technician.maxDailyMinutes
    }
  };
}
