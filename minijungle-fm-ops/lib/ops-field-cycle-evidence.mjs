export const fieldCycleEvidenceVersion = "2026-08-29.customer-field-cycle-evidence-v1";

const statuses = new Set(["completed", "exception"]);
const sources = new Set(["airtable", "ops", "mobile", "import"]);

function clean(value) { return String(value || "").trim(); }
function required(value, field) { const result = clean(value); if (!result) throw new Error(`${field} is required`); return result; }
function iso(value, field) { const parsed = new Date(value); if (Number.isNaN(parsed.getTime())) throw new Error(`${field} must be an ISO date-time`); return parsed.toISOString(); }
function proofRef(value, field) {
  const result = required(value, field);
  if (!/^(https:\/\/|s3:\/\/|evidence:\/\/)/i.test(result)) throw new Error(`${field} must use https://, s3:// or evidence://`);
  return result;
}

export function normalizeFieldCycle(input = {}, index = 0) {
  const status = required(input.status, `cycles[${index}].status`).toLowerCase();
  if (!statuses.has(status)) throw new Error(`cycles[${index}].status must be completed or exception`);
  const source = required(input.source || "airtable", `cycles[${index}].source`).toLowerCase();
  if (!sources.has(source)) throw new Error(`cycles[${index}].source must be airtable, ops, mobile or import`);
  const durationMinutes = Number(input.durationMinutes);
  if (!Number.isFinite(durationMinutes) || durationMinutes <= 0 || durationMinutes > 1440) throw new Error(`cycles[${index}].durationMinutes must be between 1 and 1440`);
  const proofRefs = Array.isArray(input.proofRefs) ? input.proofRefs.map((value, proofIndex) => proofRef(value, `cycles[${index}].proofRefs[${proofIndex}]`)) : [];
  if (!proofRefs.length) throw new Error(`cycles[${index}].proofRefs must contain at least one evidence reference`);
  return {
    cycleId: required(input.cycleId || input.id, `cycles[${index}].cycleId`),
    clientId: required(input.clientId, `cycles[${index}].clientId`),
    workOrderId: required(input.workOrderId, `cycles[${index}].workOrderId`),
    moduleId: required(input.moduleId, `cycles[${index}].moduleId`),
    technicianId: required(input.technicianId, `cycles[${index}].technicianId`),
    serviceAt: iso(input.serviceAt || input.completedAt, `cycles[${index}].serviceAt`),
    status,
    durationMinutes,
    source,
    proofRefs,
    outcome: required(input.outcome || (status === "completed" ? "completed" : "exception"), `cycles[${index}].outcome`).slice(0, 500),
    notes: clean(input.notes).slice(0, 1000)
  };
}

export function validateFieldCycleEvidence(payload = {}, { now = new Date() } = {}) {
  const raw = Array.isArray(payload) ? payload : payload.cycles;
  const errors = [];
  const cycles = [];
  if (!Array.isArray(raw)) errors.push("input must be an array or an object with a cycles array");
  for (const [index, item] of (Array.isArray(raw) ? raw : []).entries()) {
    try {
      const cycle = normalizeFieldCycle(item, index);
      if (Date.parse(cycle.serviceAt) > now.getTime() + 15 * 60 * 1000) throw new Error("serviceAt cannot be materially in the future");
      if (cycles.some((existing) => existing.cycleId === cycle.cycleId)) throw new Error("cycleId is duplicated");
      cycles.push(cycle);
    } catch (error) { errors.push(error.message); }
  }
  const completed = cycles.filter((item) => item.status === "completed");
  const clients = [...new Set(completed.map((item) => item.clientId))];
  const cyclesByClient = Object.fromEntries(clients.map((clientId) => [clientId, completed.filter((item) => item.clientId === clientId).length]));
  const blockingReasons = [...errors];
  if (clients.length < 2) blockingReasons.push("at least two distinct client accounts need completed service cycles");
  if (clients.some((clientId) => cyclesByClient[clientId] < 2)) blockingReasons.push("each client account needs at least two completed service cycles");
  return {
    version: fieldCycleEvidenceVersion,
    status: blockingReasons.length ? "blocked" : "verified",
    sourceRecordCount: Array.isArray(raw) ? raw.length : 0,
    validRecordCount: cycles.length,
    completedCount: completed.length,
    exceptionCount: cycles.filter((item) => item.status === "exception").length,
    clientCount: clients.length,
    clients,
    cyclesByClient,
    blockingReasons,
    cycles
  };
}
