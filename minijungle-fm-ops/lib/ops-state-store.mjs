import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

export const opsStateVersion = "2026-07-14.server-state-v1";

export function defaultOpsState() {
  return {
    version: opsStateVersion,
    revision: 0,
    updatedAt: null,
    lastEventId: null,
    state: {
      workorderCompletions: {},
      dispatchStaging: {},
      proofApprovals: {},
      sensorAcknowledgements: {},
      supplyRequests: {},
      invoicePayments: {},
      scheduleConfirmations: {},
      incidentResolutions: {},
      complianceClearances: {},
      activeRoleId: null,
      quickOpsTasks: [],
      auditEvents: [],
      aiQueuedActions: {}
    }
  };
}

function plainObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function arrayValue(value) {
  return Array.isArray(value) ? value : [];
}

export function sanitizeOpsState(input = {}) {
  const state = plainObject(input);

  return {
    workorderCompletions: plainObject(state.workorderCompletions),
    dispatchStaging: plainObject(state.dispatchStaging),
    proofApprovals: plainObject(state.proofApprovals),
    sensorAcknowledgements: plainObject(state.sensorAcknowledgements),
    supplyRequests: plainObject(state.supplyRequests),
    invoicePayments: plainObject(state.invoicePayments),
    scheduleConfirmations: plainObject(state.scheduleConfirmations),
    incidentResolutions: plainObject(state.incidentResolutions),
    complianceClearances: plainObject(state.complianceClearances),
    activeRoleId: state.activeRoleId ? String(state.activeRoleId) : null,
    quickOpsTasks: arrayValue(state.quickOpsTasks).slice(0, 200),
    auditEvents: arrayValue(state.auditEvents).slice(0, 500),
    aiQueuedActions: plainObject(state.aiQueuedActions)
  };
}

function sanitizeSnapshot(input) {
  const fallback = defaultOpsState();
  const snapshot = plainObject(input);

  return {
    version: snapshot.version || opsStateVersion,
    revision: Number.isFinite(Number(snapshot.revision)) ? Number(snapshot.revision) : 0,
    updatedAt: snapshot.updatedAt || null,
    lastEventId: snapshot.lastEventId || null,
    state: sanitizeOpsState(snapshot.state || fallback.state)
  };
}

export async function readOpsState(statePath) {
  try {
    const body = await readFile(statePath, "utf8");
    return sanitizeSnapshot(JSON.parse(body));
  } catch (error) {
    if (error.code === "ENOENT") return defaultOpsState();
    throw error;
  }
}

export async function writeOpsState(statePath, snapshot) {
  await mkdir(dirname(statePath), { recursive: true });
  const body = JSON.stringify(sanitizeSnapshot(snapshot), null, 2);
  const tempPath = `${statePath}.${process.pid}.tmp`;
  await writeFile(tempPath, body);
  await rename(tempPath, statePath);
}

export async function saveOpsStateSnapshot(statePath, input, event = null) {
  const current = await readOpsState(statePath);
  const next = {
    version: opsStateVersion,
    revision: current.revision + 1,
    updatedAt: new Date().toISOString(),
    lastEventId: event?.id || current.lastEventId || null,
    state: sanitizeOpsState(input?.state || input)
  };

  await writeOpsState(statePath, next);
  return next;
}

export function summarizeOpsState(snapshot) {
  const state = sanitizeSnapshot(snapshot).state;

  return {
    revision: snapshot.revision || 0,
    updatedAt: snapshot.updatedAt || null,
    completedWorkorders: Object.keys(state.workorderCompletions).length,
    stagedDispatchKits: Object.keys(state.dispatchStaging).length,
    approvedProofRecords: Object.keys(state.proofApprovals).length,
    acknowledgedSensorAlerts: Object.keys(state.sensorAcknowledgements).length,
    supplyRequests: Object.keys(state.supplyRequests).length,
    paidInvoices: Object.keys(state.invoicePayments).length,
    confirmedVisits: Object.keys(state.scheduleConfirmations).length,
    resolvedIncidents: Object.keys(state.incidentResolutions).length,
    clearedComplianceItems: Object.keys(state.complianceClearances).length,
    openQuickTasks: state.quickOpsTasks.filter((task) => task.status !== "closed").length,
    closedQuickTasks: state.quickOpsTasks.filter((task) => task.status === "closed").length,
    localAuditEvents: state.auditEvents.length,
    queuedAiActions: Object.keys(state.aiQueuedActions).length
  };
}
