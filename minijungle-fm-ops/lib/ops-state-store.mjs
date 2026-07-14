import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

export const opsStateVersion = "2026-07-14.typed-actions-v1";

const keyedActionCollections = {
  "workorder.complete": "workorderCompletions",
  "dispatch.stage": "dispatchStaging",
  "proof.approve": "proofApprovals",
  "sensor.acknowledge": "sensorAcknowledgements",
  "supply.request": "supplyRequests",
  "invoice.markPaid": "invoicePayments",
  "schedule.confirm": "scheduleConfirmations",
  "incident.resolve": "incidentResolutions",
  "compliance.clear": "complianceClearances",
  "ai.queueRecommendation": "aiQueuedActions"
};

const auditOnlyActionTypes = new Set([
  "portfolio.visitSimulate",
  "renewal.prepare",
  "report.export",
  "report.generate"
]);

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

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function actionValue(action) {
  return plainObject(action.value);
}

function normalizeAction(input) {
  const action = plainObject(input);
  const type = String(action.type || "").trim();
  const entityId = String(action.entityId || "").trim();

  if (!type) {
    const error = new Error("action.type is required");
    error.status = 400;
    throw error;
  }

  if (!entityId) {
    const error = new Error("action.entityId is required");
    error.status = 400;
    throw error;
  }

  return {
    type,
    actor: String(action.actor || "FM Ops").trim(),
    entityType: String(action.entityType || "ops").trim(),
    entityId,
    clientId: action.clientId || null,
    wallId: action.wallId || null,
    note: action.note || "",
    value: actionValue(action),
    auditEvent: plainObject(action.auditEvent)
  };
}

function assertKnownActionType(type) {
  if (keyedActionCollections[type] || type === "role.switch" || type === "quickTask.create" || type === "quickTask.close" || auditOnlyActionTypes.has(type)) {
    return;
  }

  const error = new Error(`Unsupported ops action type: ${type}`);
  error.status = 400;
  throw error;
}

function upsertTask(tasks, task) {
  const existingIndex = tasks.findIndex((item) => item.id === task.id);
  if (existingIndex >= 0) {
    const next = tasks.slice();
    next[existingIndex] = { ...next[existingIndex], ...task };
    return next.slice(0, 200);
  }
  return [task, ...tasks].slice(0, 200);
}

function appendAuditEvent(state, auditEvent) {
  if (!auditEvent.id) return state.auditEvents;
  const existing = state.auditEvents.filter((event) => event.id !== auditEvent.id);
  return [auditEvent, ...existing].slice(0, 500);
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

export function sanitizeSnapshot(input) {
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

export function buildOpsStateSnapshot(currentSnapshot, input, event = null) {
  const current = sanitizeSnapshot(currentSnapshot);
  return {
    version: opsStateVersion,
    revision: current.revision + 1,
    updatedAt: new Date().toISOString(),
    lastEventId: event?.id || current.lastEventId || null,
    state: sanitizeOpsState(input?.state || input)
  };
}

export function reduceOpsStateAction(currentSnapshot, input, event = null) {
  const body = plainObject(input);
  const current = sanitizeSnapshot(currentSnapshot);
  const expectedRevision = body.expectedRevision;

  if (expectedRevision !== undefined && expectedRevision !== null && Number(expectedRevision) !== current.revision) {
    const error = new Error(`Ops state revision conflict: expected ${expectedRevision}, current ${current.revision}`);
    error.status = 409;
    error.code = "REVISION_CONFLICT";
    error.currentRevision = current.revision;
    error.snapshot = current;
    throw error;
  }

  const action = normalizeAction(body.action || body);
  assertKnownActionType(action.type);

  const state = cloneJson(sanitizeOpsState(current.state));
  const collection = keyedActionCollections[action.type];
  const appliedCollections = [];

  if (collection) {
    state[collection] = {
      ...state[collection],
      [action.entityId]: action.value
    };
    appliedCollections.push(collection);
  } else if (action.type === "role.switch") {
    state.activeRoleId = action.value.activeRoleId || action.entityId;
    appliedCollections.push("activeRoleId");
  } else if (action.type === "quickTask.create" || action.type === "quickTask.close") {
    const task = {
      ...action.value,
      id: action.value.id || action.entityId
    };
    state.quickOpsTasks = upsertTask(state.quickOpsTasks, task);
    appliedCollections.push("quickOpsTasks");
  }

  state.auditEvents = appendAuditEvent(state, action.auditEvent);
  if (action.auditEvent.id) appliedCollections.push("auditEvents");

  const next = {
    version: opsStateVersion,
    revision: current.revision + 1,
    updatedAt: new Date().toISOString(),
    lastEventId: event?.id || current.lastEventId || null,
    state: sanitizeOpsState(state)
  };

  return {
    snapshot: next,
    action: {
      type: action.type,
      entityType: action.entityType,
      entityId: action.entityId,
      clientId: action.clientId,
      appliedCollections: [...new Set(appliedCollections)]
    }
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
  const next = buildOpsStateSnapshot(current, input, event);

  await writeOpsState(statePath, next);
  return next;
}

export async function applyOpsStateAction(statePath, input, event = null) {
  const current = await readOpsState(statePath);
  const result = reduceOpsStateAction(current, input, event);

  await writeOpsState(statePath, result.snapshot);
  return result;
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
