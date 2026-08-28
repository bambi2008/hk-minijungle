export const maintenancePlanningMigrationVersion = "2026-08-31.maintenance-planning-v1";
export const postgresMaintenancePlanningMigrationVersion = "2026-08-31.postgres-maintenance-planning-v1";

export function maintenancePlanningError(message, code = "MAINTENANCE_PLAN_INVALID", status = 400) {
  const error = new Error(message);
  error.code = code;
  error.status = status;
  return error;
}

function required(value, field) {
  const result = String(value || "").trim();
  if (!result) throw maintenancePlanningError(`${field} is required`);
  return result;
}

function integer(value, field, min, max) {
  const result = Number(value);
  if (!Number.isInteger(result) || result < min || result > max) throw maintenancePlanningError(`${field} must be an integer from ${min} to ${max}`);
  return result;
}

export function dateOnly(value, field = "date") {
  const result = String(value || "").trim();
  const parsed = new Date(`${result}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(result) || Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== result) throw maintenancePlanningError(`${field} must use YYYY-MM-DD`);
  return result;
}

export function addDays(value, days) {
  const date = new Date(`${dateOnly(value)}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + Number(days));
  return date.toISOString().slice(0, 10);
}

export function cadenceDaysFromLabel(value) {
  const text = String(value || "").trim().toLowerCase();
  if (/weekly/.test(text)) return 7;
  if (/twice|bi[- ]?weekly|fortnight/.test(text)) return 14;
  if (/quarter/.test(text)) return 90;
  return 30;
}

export function legacyNextDue(value, today) {
  const text = String(value || "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return dateOnly(text);
  const match = text.match(/^([A-Za-z]{3,9})\s+(\d{1,2})$/);
  if (!match) return dateOnly(today);
  const year = dateOnly(today).slice(0, 4);
  const parsed = new Date(`${match[1]} ${match[2]}, ${year} 12:00:00 GMT+0800`);
  return Number.isNaN(parsed.getTime()) ? dateOnly(today) : parsed.toISOString().slice(0, 10);
}

function stringList(value, field, fallback = []) {
  const result = Array.isArray(value) ? value.map((item) => String(item || "").trim()).filter(Boolean) : fallback;
  if (!result.length) throw maintenancePlanningError(`${field} must contain at least one item`);
  return [...new Set(result)].slice(0, 30);
}

function planIdFor(wallId, serviceType) {
  const slug = `${wallId}-${serviceType}`.toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 64);
  return `MP-${slug}`;
}

export function normalizeMaintenancePlan(input, existing = null) {
  const now = new Date().toISOString();
  const wallId = required(input?.wallId ?? existing?.wallId, "wallId");
  const serviceType = required(input?.serviceType ?? existing?.serviceType ?? "Preventive plant care", "serviceType");
  const status = String(input?.status ?? existing?.status ?? "active").trim().toLowerCase();
  if (!["active", "paused"].includes(status)) throw maintenancePlanningError("status must be active or paused");
  return {
    id: required(existing?.id ?? input?.id ?? planIdFor(wallId, serviceType), "id"),
    clientId: required(input?.clientId ?? existing?.clientId, "clientId"),
    wallId,
    serviceType,
    cadenceDays: integer(input?.cadenceDays ?? existing?.cadenceDays ?? 30, "cadenceDays", 1, 365),
    nextDueDate: dateOnly(input?.nextDueDate ?? existing?.nextDueDate, "nextDueDate"),
    durationMinutes: integer(input?.durationMinutes ?? existing?.durationMinutes ?? 90, "durationMinutes", 15, 480),
    tasks: stringList(input?.tasks, "tasks", existing?.tasks || ["Plant health check", "Water and nutrient check", "Fixed-angle proof photo"]),
    requiredSkills: stringList(input?.requiredSkills, "requiredSkills", existing?.requiredSkills || ["plant-care"]),
    status,
    source: String(input?.source ?? existing?.source ?? "manual").trim() || "manual",
    createdBy: String(existing?.createdBy || input?.createdBy || input?.updatedBy || "system").trim(),
    updatedBy: required(input?.updatedBy ?? input?.createdBy ?? existing?.updatedBy ?? "system", "updatedBy"),
    createdAt: existing?.createdAt || now,
    updatedAt: now
  };
}

export function normalizeMaintenanceWindow(input = {}) {
  const fromDate = dateOnly(input.fromDate, "fromDate");
  const throughDate = dateOnly(input.throughDate, "throughDate");
  const span = Math.round((Date.parse(`${throughDate}T00:00:00Z`) - Date.parse(`${fromDate}T00:00:00Z`)) / 86400000);
  if (span < 0) throw maintenancePlanningError("throughDate must be on or after fromDate");
  if (span > 90) throw maintenancePlanningError("generation horizon cannot exceed 90 days", "MAINTENANCE_HORIZON_TOO_LARGE");
  return { fromDate, throughDate };
}

export function maintenanceWorkOrderId(planId, serviceDate) {
  const slug = String(planId).replace(/^MP-/, "").replace(/[^A-Za-z0-9]+/g, "-").slice(0, 48);
  return `PM-${slug}-${dateOnly(serviceDate).replaceAll("-", "")}`;
}
