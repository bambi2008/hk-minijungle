const dataFiles = {
  clients: "data/clients.json",
  walls: "data/walls.json",
  workorders: "data/workorders.json",
  diagnoses: "data/diagnoses.json",
  dispatch: "data/dispatch.json",
  commercial: "data/commercial.json",
  proof: "data/proof.json",
  sensors: "data/sensors.json",
  supply: "data/supply.json",
  audit: "data/audit.json",
  esgMetrics: "data/esg-metrics.json",
  productModel: "data/product-model.json"
};

let clients = [];
let walls = [];
let workorders = [];
let diagnoses = [];
let esgTrend = [];
let esgMethods = [];
let esgLedger = [];
let reportModes = [];
let reportMonths = [];
let strategyCards = [];
let architectureLayers = [];
let crewMembers = [];
let dispatchRoute = [];
let dispatchInventory = [];
let commercialToday = "2026-07-07";
let commercialAccounts = [];
let commercialPlaybook = [];
let proofRecords = [];
let proofRequirements = [];
let sensorReadings = [];
let sensorRules = [];
let supplyItems = [];
let supplyPolicies = [];
let auditBaselineEvents = [];
let auditControls = [];
let workorderCompletions = {};
let dispatchStaging = {};
let proofApprovals = {};
let sensorAcknowledgements = {};
let supplyRequests = {};
let auditEvents = [];

const workorderCompletionStorageKey = "minijungle-fm-ops.workorder-completions.v1";
const dispatchStagingStorageKey = "minijungle-fm-ops.dispatch-staging.v1";
const proofApprovalStorageKey = "minijungle-fm-ops.proof-approvals.v1";
const sensorAcknowledgementStorageKey = "minijungle-fm-ops.sensor-acknowledgements.v1";
const supplyRequestStorageKey = "minijungle-fm-ops.supply-requests.v1";
const auditEventStorageKey = "minijungle-fm-ops.audit-events.v1";

async function loadJson(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Failed to load ${path}: ${response.status}`);
  return response.json();
}

async function loadAppData() {
  const [
    loadedClients,
    loadedWalls,
    loadedWorkorders,
    loadedDiagnoses,
    dispatchData,
    commercialData,
    proofData,
    sensorData,
    supplyData,
    auditData,
    esgMetrics,
    productModel
  ] = await Promise.all([
    loadJson(dataFiles.clients),
    loadJson(dataFiles.walls),
    loadJson(dataFiles.workorders),
    loadJson(dataFiles.diagnoses),
    loadJson(dataFiles.dispatch),
    loadJson(dataFiles.commercial),
    loadJson(dataFiles.proof),
    loadJson(dataFiles.sensors),
    loadJson(dataFiles.supply),
    loadJson(dataFiles.audit),
    loadJson(dataFiles.esgMetrics),
    loadJson(dataFiles.productModel)
  ]);

  clients = loadedClients;
  walls = loadedWalls;
  workorders = loadedWorkorders;
  diagnoses = loadedDiagnoses;
  crewMembers = dispatchData.crew || [];
  dispatchRoute = dispatchData.route || [];
  dispatchInventory = dispatchData.inventory || [];
  commercialToday = commercialData.today || commercialToday;
  commercialAccounts = commercialData.accounts || [];
  commercialPlaybook = commercialData.playbook || [];
  proofRecords = proofData.records || [];
  proofRequirements = proofData.requirements || [];
  sensorReadings = sensorData.readings || [];
  sensorRules = sensorData.rules || [];
  supplyItems = supplyData.items || [];
  supplyPolicies = supplyData.policies || [];
  auditBaselineEvents = auditData.baselineEvents || [];
  auditControls = auditData.controls || [];
  esgTrend = esgMetrics.trend || [];
  esgMethods = esgMetrics.methods || [];
  esgLedger = esgMetrics.ledger || [];
  reportModes = productModel.reportModes || [];
  reportMonths = productModel.reportMonths || [];
  strategyCards = productModel.strategyCards || [];
  architectureLayers = productModel.architectureLayers || [];
}

function initializeSelection() {
  state.selectedClientId = clients[0]?.id || null;
  state.selectedWallId = walls[0]?.id || null;
  state.selectedReportClientId = clients[0]?.id || null;
  state.selectedReportMonth = reportMonths[0]?.id || null;
  state.reportMode = reportModes[0]?.id || null;
}

function loadWorkorderCompletions() {
  try {
    workorderCompletions = JSON.parse(localStorage.getItem(workorderCompletionStorageKey) || "{}");
  } catch {
    workorderCompletions = {};
  }
}

function saveWorkorderCompletions() {
  localStorage.setItem(workorderCompletionStorageKey, JSON.stringify(workorderCompletions));
}

function loadDispatchStaging() {
  try {
    dispatchStaging = JSON.parse(localStorage.getItem(dispatchStagingStorageKey) || "{}");
  } catch {
    dispatchStaging = {};
  }
}

function saveDispatchStaging() {
  localStorage.setItem(dispatchStagingStorageKey, JSON.stringify(dispatchStaging));
}

function loadProofApprovals() {
  try {
    proofApprovals = JSON.parse(localStorage.getItem(proofApprovalStorageKey) || "{}");
  } catch {
    proofApprovals = {};
  }
}

function saveProofApprovals() {
  localStorage.setItem(proofApprovalStorageKey, JSON.stringify(proofApprovals));
}

function loadSensorAcknowledgements() {
  try {
    sensorAcknowledgements = JSON.parse(localStorage.getItem(sensorAcknowledgementStorageKey) || "{}");
  } catch {
    sensorAcknowledgements = {};
  }
}

function saveSensorAcknowledgements() {
  localStorage.setItem(sensorAcknowledgementStorageKey, JSON.stringify(sensorAcknowledgements));
}

function loadSupplyRequests() {
  try {
    supplyRequests = JSON.parse(localStorage.getItem(supplyRequestStorageKey) || "{}");
  } catch {
    supplyRequests = {};
  }
}

function saveSupplyRequests() {
  localStorage.setItem(supplyRequestStorageKey, JSON.stringify(supplyRequests));
}

function loadAuditEvents() {
  try {
    auditEvents = JSON.parse(localStorage.getItem(auditEventStorageKey) || "[]");
  } catch {
    auditEvents = [];
  }
}

function saveAuditEvents() {
  localStorage.setItem(auditEventStorageKey, JSON.stringify(auditEvents));
}

function isWorkorderCompleted(id) {
  return Boolean(workorderCompletions[id]);
}

function isDispatchStaged(id) {
  return Boolean(dispatchStaging[id]);
}

function isProofApproved(id) {
  return Boolean(proofApprovals[id]);
}

function proofRecordReady(record) {
  return isProofApproved(record.id) || record.tone === "ready";
}

function isSensorAcknowledged(id) {
  return Boolean(sensorAcknowledgements[id]);
}

function isSupplyRequested(sku) {
  return Boolean(supplyRequests[sku]);
}

function clientIdForWorkorder(id) {
  const order = workorders.find((item) => item.id === id);
  if (!order) return null;
  return wallById(order.wallId)?.clientId || null;
}

function clientIdForProof(id) {
  const record = proofRecords.find((item) => item.id === id);
  if (!record) return null;
  return wallById(record.wallId)?.clientId || null;
}

function clientIdForSensor(id) {
  const reading = sensorReadings.find((item) => item.id === id);
  if (!reading) return null;
  return wallById(reading.wallId)?.clientId || null;
}

function allAuditEvents() {
  return [...auditEvents, ...auditBaselineEvents]
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

function auditEventsForClient(clientId) {
  return allAuditEvents().filter((event) => event.clientId === clientId);
}

function recordAuditEvent(event) {
  auditEvents = [{
    id: `AUD-${Date.now()}-${Math.round(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    actor: event.actor || "FM Ops",
    action: event.action,
    entityType: event.entityType,
    entityId: event.entityId,
    clientId: event.clientId || null,
    tone: event.tone || "ready",
    detail: event.detail
  }, ...auditEvents].slice(0, 80);
  saveAuditEvents();
}

function workorderView(order) {
  const completion = workorderCompletions[order.id] || null;
  return {
    ...order,
    completion,
    displayStatus: completion ? "Completed" : order.status,
    displayPriority: completion ? "completed" : order.priority
  };
}

function completeWorkorder(id) {
  if (!workorderCompletions[id]) {
    workorderCompletions[id] = {
      completedAt: new Date().toISOString(),
      completedBy: "FM Ops demo",
      proof: "Visit tasks completed and ready for report evidence."
    };
    saveWorkorderCompletions();
    recordAuditEvent({
      actor: "FM Ops demo",
      action: "Work order completed",
      entityType: "workorder",
      entityId: id,
      clientId: clientIdForWorkorder(id),
      tone: "completed",
      detail: "Service visit marked complete and report evidence can reference the closure."
    });
  }
  state.reportGenerated = false;
  renderAll();
}

function stageDispatchKit(id) {
  if (!dispatchStaging[id]) {
    dispatchStaging[id] = {
      stagedAt: new Date().toISOString(),
      stagedBy: "Dispatch desk"
    };
    saveDispatchStaging();
    recordAuditEvent({
      actor: "Dispatch desk",
      action: "Dispatch kit staged",
      entityType: "workorder",
      entityId: id,
      clientId: clientIdForWorkorder(id),
      tone: "ready",
      detail: "Technician kit staged for route handoff."
    });
  }
  renderAll();
}

function approveProofRecord(id) {
  if (!proofApprovals[id]) {
    proofApprovals[id] = {
      approvedAt: new Date().toISOString(),
      approvedBy: "Evidence desk"
    };
    saveProofApprovals();
    recordAuditEvent({
      actor: "Evidence desk",
      action: "Proof approved",
      entityType: "proof",
      entityId: id,
      clientId: clientIdForProof(id),
      tone: "approved",
      detail: "Evidence record approved for client-facing report use."
    });
  }
  state.reportGenerated = false;
  renderAll();
}

function acknowledgeSensorAlert(id) {
  if (!sensorAcknowledgements[id]) {
    sensorAcknowledgements[id] = {
      acknowledgedAt: new Date().toISOString(),
      acknowledgedBy: "FM control"
    };
    saveSensorAcknowledgements();
    recordAuditEvent({
      actor: "FM control",
      action: "Sensor alert acknowledged",
      entityType: "sensor",
      entityId: id,
      clientId: clientIdForSensor(id),
      tone: "acknowledged",
      detail: "Telemetry exception acknowledged by operations control."
    });
  }
  renderAll();
}

function requestSupplyReorder(sku) {
  if (!supplyRequests[sku]) {
    supplyRequests[sku] = {
      requestedAt: new Date().toISOString(),
      requestedBy: "Dispatch desk"
    };
    saveSupplyRequests();
    recordAuditEvent({
      actor: "Dispatch desk",
      action: "Supply reorder requested",
      entityType: "supply",
      entityId: sku,
      clientId: null,
      tone: "requested",
      detail: "Stock replenishment request raised for service continuity."
    });
  }
  renderAll();
}

function prepareRenewalPack(clientId) {
  state.selectedReportClientId = clientId;
  state.reportMode = "renewal";
  state.reportGenerated = false;
  recordAuditEvent({
    actor: "Account lead",
    action: "Renewal proof pack prepared",
    entityType: "client",
    entityId: clientId,
    clientId,
    tone: "ready",
    detail: "Report center switched to Renewal Proof mode for the account."
  });
  renderAll();
  document.querySelector("#reports").scrollIntoView({ behavior: "smooth", block: "start" });
}

const state = {
  simulatedVisits: 0,
  filter: "all",
  selectedClientId: null,
  selectedWallId: null,
  selectedReportClientId: null,
  selectedReportMonth: null,
  reportMode: null,
  reportGenerated: false
};

const els = {
  summaryGrid: document.querySelector("#summary-grid"),
  proofStrip: document.querySelector("#proof-strip"),
  riskList: document.querySelector("#risk-list"),
  serviceTimeline: document.querySelector("#service-timeline"),
  strategyGrid: document.querySelector("#strategy-grid"),
  positioningCopy: document.querySelector("#positioning-copy"),
  clientTabs: document.querySelector("#client-tabs"),
  clientList: document.querySelector("#client-list"),
  clientDetailTitle: document.querySelector("#client-detail-title"),
  clientDetailStatus: document.querySelector("#client-detail-status"),
  clientDetail: document.querySelector("#client-detail"),
  commercialStatus: document.querySelector("#commercial-status"),
  commercialGrid: document.querySelector("#commercial-grid"),
  renewalList: document.querySelector("#renewal-list"),
  slaList: document.querySelector("#sla-list"),
  successPlaybook: document.querySelector("#success-playbook"),
  wallGrid: document.querySelector("#wall-grid"),
  wallDetailTitle: document.querySelector("#wall-detail-title"),
  wallDetailStatus: document.querySelector("#wall-detail-status"),
  wallDetail: document.querySelector("#wall-detail"),
  podHealthList: document.querySelector("#pod-health-list"),
  sensorStatus: document.querySelector("#sensor-status"),
  sensorGrid: document.querySelector("#sensor-grid"),
  sensorList: document.querySelector("#sensor-list"),
  sensorRuleList: document.querySelector("#sensor-rule-list"),
  workorderList: document.querySelector("#workorder-list"),
  diagnosisList: document.querySelector("#diagnosis-list"),
  dispatchStatus: document.querySelector("#dispatch-status"),
  dispatchGrid: document.querySelector("#dispatch-grid"),
  dispatchRouteList: document.querySelector("#dispatch-route-list"),
  dispatchCrewList: document.querySelector("#dispatch-crew-list"),
  dispatchInventoryList: document.querySelector("#dispatch-inventory-list"),
  supplyStatus: document.querySelector("#supply-status"),
  supplyGrid: document.querySelector("#supply-grid"),
  supplyList: document.querySelector("#supply-list"),
  supplyPolicyList: document.querySelector("#supply-policy-list"),
  proofStatus: document.querySelector("#proof-status"),
  proofGrid: document.querySelector("#proof-grid"),
  proofRecordList: document.querySelector("#proof-record-list"),
  proofRequirementList: document.querySelector("#proof-requirement-list"),
  auditStatus: document.querySelector("#audit-status"),
  auditGrid: document.querySelector("#audit-grid"),
  auditEventList: document.querySelector("#audit-event-list"),
  auditControlList: document.querySelector("#audit-control-list"),
  esgGrid: document.querySelector("#esg-grid"),
  esgBars: document.querySelector("#esg-bars"),
  esgMethods: document.querySelector("#esg-methods"),
  esgLedger: document.querySelector("#esg-ledger"),
  reportTabs: document.querySelector("#report-tabs"),
  reportClientSelect: document.querySelector("#report-client-select"),
  reportMonthSelect: document.querySelector("#report-month-select"),
  downloadReportBtn: document.querySelector("#download-report-btn"),
  reportClientProfile: document.querySelector("#report-client-profile"),
  reportStatus: document.querySelector("#report-status"),
  reportPeriod: document.querySelector("#report-period"),
  reportTitle: document.querySelector("#report-title"),
  reportSummary: document.querySelector("#report-summary"),
  reportMetrics: document.querySelector("#report-metrics"),
  reportEvidence: document.querySelector("#report-evidence"),
  reportMethods: document.querySelector("#report-methods"),
  architectureLayers: document.querySelector("#architecture-layers"),
  syncStatus: document.querySelector("#sync-status"),
  simulateVisitBtn: document.querySelector("#simulate-visit-btn"),
  generateReportBtn: document.querySelector("#generate-report-btn"),
  filterButtons: Array.from(document.querySelectorAll("[data-filter]")),
  navLinks: Array.from(document.querySelectorAll(".side-nav nav a"))
};

function formatCurrency(value) {
  return `HK$${Math.round(value).toLocaleString("en-HK")}`;
}

function sum(items, selector) {
  return items.reduce((total, item) => total + selector(item), 0);
}

function avg(items, selector) {
  return Math.round(sum(items, selector) / items.length);
}

function clientFor(wall) {
  return clients.find((client) => client.id === wall.clientId);
}

function wallById(id) {
  return walls.find((wall) => wall.id === id);
}

function selectedClient() {
  return clients.find((client) => client.id === state.selectedClientId);
}

function selectedWall() {
  return wallById(state.selectedWallId);
}

function selectedReport() {
  return reportModes.find((mode) => mode.id === state.reportMode) || reportModes[0];
}

function selectedReportClient() {
  return clients.find((client) => client.id === state.selectedReportClientId) || clients[0];
}

function selectedReportMonth() {
  return reportMonths.find((month) => month.id === state.selectedReportMonth) || reportMonths[0];
}

function commercialAccountFor(clientId) {
  return commercialAccounts.find((account) => account.clientId === clientId);
}

function dateValue(dateText) {
  const [year, month, day] = dateText.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

function daysUntil(dateText) {
  return Math.round((dateValue(dateText) - dateValue(commercialToday)) / 86400000);
}

function riskLabel(level) {
  if (level === "high") return "High risk";
  if (level === "medium") return "Watch";
  return "Healthy";
}

function statusClass(value) {
  if (value === "risk" || value === "high") return "danger";
  if (value === "alert" || value === "offline") return "danger";
  if (value === "watch" || value === "medium") return "warn";
  if (value === "needs-review" || value === "review") return "warn";
  if (value === "missing" || value === "blocked") return "danger";
  if (value === "completed" || value === "ready" || value === "approved") return "good";
  if (value === "ok" || value === "acknowledged" || value === "requested") return "good";
  return "";
}

function commercialTone(view) {
  if (
    view.client.renewalRisk === "high" ||
    view.daysToRenewal <= 60 ||
    view.healthGap > 0 ||
    view.data.openWorkorders.length > 0 && view.daysToProof <= 45
  ) return "high";
  if (view.client.renewalRisk === "medium" || view.daysToRenewal <= 90 || view.data.openWorkorders.length > 0) return "medium";
  return "low";
}

function commercialView(client) {
  const account = commercialAccountFor(client.id);
  const data = metricsForClient(client.id);
  const daysToRenewal = daysUntil(client.renewalDate);
  const daysToProof = account ? daysUntil(account.proofPackDue) : daysToRenewal - 30;
  const healthGap = account ? Math.max(0, account.targetHealth - data.health) : 0;
  const view = {
    client,
    account,
    data,
    daysToRenewal,
    daysToProof,
    healthGap
  };
  view.tone = commercialTone(view);
  view.priorityLabel = view.tone === "high" ? "Save plan" : view.tone === "medium" ? "Watch" : "On track";
  return view;
}

function sensorView(reading) {
  const wall = wallById(reading.wallId);
  const client = clientFor(wall);
  const acknowledged = isSensorAcknowledged(reading.id);
  return {
    ...reading,
    wall,
    client,
    acknowledged,
    displayStatus: acknowledged ? "Acknowledged" : reading.status,
    displayTone: acknowledged ? "acknowledged" : reading.status
  };
}

function sensorNeedsAction(reading) {
  return !isSensorAcknowledged(reading.id) && (reading.status === "alert" || reading.status === "offline" || reading.status === "watch");
}

function supplyView(item) {
  const available = item.onHand - item.reserved;
  const requested = isSupplyRequested(item.sku);
  const displayTone = requested ? "requested" : available <= item.reorderAt ? "alert" : available <= item.reorderAt * 2 ? "watch" : "ok";
  return {
    ...item,
    available,
    requested,
    displayTone,
    displayStatus: requested ? "Reorder requested" : available <= item.reorderAt ? "Reorder now" : available <= item.reorderAt * 2 ? "Watch stock" : "Ready"
  };
}

function portfolioMetrics() {
  const activeWalls = walls.length;
  const activeClients = clients.length;
  const pods = sum(walls, (wall) => wall.pods);
  const greenArea = sum(walls, (wall) => wall.greenArea);
  const waterSaved = sum(walls, (wall) => wall.waterSaved);
  const serviceMilesSaved = sum(walls, (wall) => wall.serviceMilesSaved);
  const staffReach = sum(walls, (wall) => wall.staffReach);
  const co2eProxy = sum(walls, (wall) => wall.co2eProxy);
  const health = Math.min(99, avg(walls, (wall) => wall.health + state.simulatedVisits));
  const survival = avg(walls, (wall) => wall.survival);
  const issues = Math.max(0, sum(walls, (wall) => wall.issues) - state.simulatedVisits * 2);
  const revenue = sum(clients, (client) => client.revenue);
  const sensorAlerts = sensorReadings.filter(sensorNeedsAction).length;
  const supplyReorderItems = supplyItems.map(supplyView).filter((item) => item.displayTone === "alert").length;
  const reportReadiness = Math.min(99, Math.round((health * 0.45) + (survival * 0.35) + ((100 - issues) * 0.2)));

  return {
    activeWalls,
    activeClients,
    pods,
    greenArea,
    waterSaved,
    serviceMilesSaved,
    staffReach,
    co2eProxy,
    health,
    survival,
    issues,
    revenue,
    sensorAlerts,
    supplyReorderItems,
    reportReadiness
  };
}

function metricsForClient(clientId) {
  const clientWalls = walls.filter((wall) => wall.clientId === clientId);
  const clientWorkorders = workorders.filter((order) => clientWalls.some((wall) => wall.id === order.wallId));
  const completedWorkorders = clientWorkorders.filter((order) => isWorkorderCompleted(order.id));
  const openWorkorders = clientWorkorders.filter((order) => !isWorkorderCompleted(order.id));
  const clientDiagnoses = diagnoses.filter((diagnosis) => clientWalls.some((wall) => wall.id === diagnosis.wallId));
  const clientProofRecords = proofRecords.filter((record) => clientWalls.some((wall) => wall.id === record.wallId));
  const approvedProofRecords = clientProofRecords.filter((record) => isProofApproved(record.id));
  const reportReadyProofRecords = clientProofRecords.filter(proofRecordReady);
  const proofGaps = clientProofRecords.filter((record) => !proofRecordReady(record));
  const clientSensorReadings = sensorReadings.filter((reading) => clientWalls.some((wall) => wall.id === reading.wallId));
  const openSensorAlerts = clientSensorReadings.filter(sensorNeedsAction);
  const clientAuditEvents = auditEventsForClient(clientId);
  const greenArea = sum(clientWalls, (wall) => wall.greenArea);
  const waterSaved = sum(clientWalls, (wall) => wall.waterSaved);
  const serviceMilesSaved = sum(clientWalls, (wall) => wall.serviceMilesSaved);
  const staffReach = sum(clientWalls, (wall) => wall.staffReach);
  const co2eProxy = sum(clientWalls, (wall) => wall.co2eProxy);
  const health = clientWalls.length ? Math.min(99, avg(clientWalls, (wall) => wall.health + state.simulatedVisits)) : 0;
  const survival = clientWalls.length ? avg(clientWalls, (wall) => wall.survival) : 0;
  const issues = Math.max(0, sum(clientWalls, (wall) => wall.issues) - state.simulatedVisits * 2);
  const reportReadiness = Math.min(99, Math.round((health * 0.45) + (survival * 0.35) + ((100 - issues) * 0.2)));

  return {
    walls: clientWalls,
    workorders: clientWorkorders,
    completedWorkorders,
    openWorkorders,
    diagnoses: clientDiagnoses,
    proofRecords: clientProofRecords,
    approvedProofRecords,
    reportReadyProofRecords,
    proofGaps,
    sensorReadings: clientSensorReadings,
    openSensorAlerts,
    auditEvents: clientAuditEvents,
    greenArea,
    waterSaved,
    serviceMilesSaved,
    staffReach,
    co2eProxy,
    health,
    survival,
    issues,
    reportReadiness
  };
}

function renderStatCards(container, cards, className = "stat-card") {
  container.innerHTML = cards.map((card) => `
    <article class="${className}">
      <span>${card.label}</span>
      <strong>${card.value}</strong>
      <em>${card.detail}</em>
    </article>
  `).join("");
}

function renderOverview() {
  const data = portfolioMetrics();
  renderStatCards(els.summaryGrid, [
    { label: "Active clients", value: data.activeClients, detail: `${data.activeWalls} walls under FM care` },
    { label: "Portfolio health", value: data.health, detail: `${data.survival}% plant survival rate` },
    { label: "Sensor alerts", value: data.sensorAlerts, detail: `${data.issues} plant issue(s) and telemetry exceptions` },
    { label: "Managed value", value: formatCurrency(data.revenue), detail: "Setup, care and DF Pro base" }
  ]);

  els.proofStrip.innerHTML = [
    ["Green wall area", `${data.greenArea.toFixed(1)} m2`],
    ["Water-saving estimate", `${data.waterSaved} L/mo`],
    ["Wellness reach", `${data.staffReach} people/mo`],
    ["Stock reorder flags", data.supplyReorderItems]
  ].map(([label, value]) => `
    <div>
      <span>${label}</span>
      <strong>${value}</strong>
    </div>
  `).join("");

  els.riskList.innerHTML = walls
    .filter((wall) => wall.status !== "stable")
    .sort((a, b) => a.health - b.health)
    .map((wall) => `
      <button type="button" class="list-item" data-wall-select="${wall.id}">
        <div class="item-row">
          <strong>${wall.id} - ${wall.name}</strong>
          <span class="tag ${statusClass(wall.status)}">${wall.status}</span>
        </div>
        <span>${clientFor(wall).name} - ${wall.location}</span>
        <small>Health ${wall.health} - ${wall.issues} issues - next visit ${wall.nextVisit}</small>
      </button>
    `).join("");

  els.serviceTimeline.innerHTML = workorders.map((order) => {
    const wall = wallById(order.wallId);
    const view = workorderView(order);
    return `
      <button type="button" class="list-item" data-wall-select="${wall.id}">
        <div class="item-row">
          <strong>${view.due}</strong>
          <span class="tag ${statusClass(view.displayPriority === "high" ? "risk" : view.displayPriority)}">${view.displayStatus}</span>
        </div>
        <span>${view.id} - ${view.type}</span>
        <small>${clientFor(wall).name} - ${view.tasks.join(", ")}</small>
      </button>
    `;
  }).join("");
}

function renderPositioning() {
  els.strategyGrid.innerHTML = strategyCards.map((card) => `
    <article class="strategy-card">
      <span>${card.title}</span>
      <strong>${card.value}</strong>
      <p>${card.body}</p>
    </article>
  `).join("");

  els.positioningCopy.textContent = "MiniJungle FM Ops sits between smart green wall services, field service management, IoT monitoring and ESG reporting. The product promise is not full automation. It is verified service quality: every wall has an owner, every visit has proof, every plant issue has a follow-up, and every ESG statement has a method note.";
}

function renderClients() {
  els.clientTabs.innerHTML = clients.map((client) => `
    <button type="button" class="${client.id === state.selectedClientId ? "active" : ""}" data-client-tab="${client.id}">
      ${client.district}
    </button>
  `).join("");

  els.clientList.innerHTML = clients.map((client) => {
    const clientWalls = walls.filter((wall) => wall.clientId === client.id);
    const averageHealth = avg(clientWalls, (wall) => wall.health);
    return `
      <button type="button" class="list-item ${client.id === state.selectedClientId ? "selected" : ""}" data-client-select="${client.id}">
        <div class="item-row">
          <strong>${client.name}</strong>
          <span class="tag ${statusClass(client.renewalRisk)}">${riskLabel(client.renewalRisk)}</span>
        </div>
        <span>${client.segment} - ${client.district}</span>
        <small>${clientWalls.length} wall(s) - health ${averageHealth} - renewal ${client.renewalDate}</small>
      </button>
    `;
  }).join("");

  const client = selectedClient();
  const clientWalls = walls.filter((wall) => wall.clientId === client.id);
  els.clientDetailTitle.textContent = client.name;
  els.clientDetailStatus.textContent = `${client.segment} - ${client.district}`;
  els.clientDetail.innerHTML = [
    ["Plan", client.plan],
    ["Contract", client.contract],
    ["Contact", client.contact],
    ["Renewal date", client.renewalDate],
    ["Proof need", client.proofNeed],
    ["Walls", `${clientWalls.length} wall(s), ${sum(clientWalls, (wall) => wall.pods)} Plant Pods`]
  ].map(([label, value]) => `<div><span>${label}</span><strong>${value}</strong></div>`).join("");
}

function renderCommercial() {
  const severity = { high: 0, medium: 1, low: 2 };
  const views = clients
    .map(commercialView)
    .sort((a, b) => severity[a.tone] - severity[b.tone] || a.daysToRenewal - b.daysToRenewal);
  const riskViews = views.filter((view) => view.tone === "high");
  const renewalWindow = views.filter((view) => view.daysToRenewal <= 90);
  const slaExceptions = views.filter((view) => view.healthGap > 0 || view.data.openWorkorders.length > 0);
  const proofDue = views.filter((view) => view.daysToProof <= 45);
  const revenueAtRisk = sum(riskViews, (view) => view.client.revenue);

  els.commercialStatus.textContent = `${riskViews.length} save plan account(s), ${renewalWindow.length} renewal window`;
  els.commercialStatus.classList.toggle("good", riskViews.length === 0);
  renderStatCards(els.commercialGrid, [
    { label: "Revenue at risk", value: formatCurrency(revenueAtRisk), detail: "Setup and recurring value under save plan" },
    { label: "Renewal window", value: renewalWindow.length, detail: "Accounts renewing in 90 days" },
    { label: "SLA exceptions", value: slaExceptions.length, detail: "Health gaps or open work orders" },
    { label: "Proof packs due", value: proofDue.length, detail: "Client evidence due in 45 days" }
  ]);

  els.renewalList.innerHTML = views.map((view) => `
    <div class="list-item commercial-card ${view.tone}" data-commercial-card="${view.client.id}">
      <div class="item-row">
        <strong>${view.client.name}</strong>
        <span class="tag ${statusClass(view.tone)}">${view.priorityLabel}</span>
      </div>
      <span>${view.account.owner} - ${view.account.renewalStage} - renewal in ${view.daysToRenewal} days</span>
      <small>${view.account.nextTouch}</small>
      <div class="commercial-meta">
        <div><span>Revenue</span><strong>${formatCurrency(view.client.revenue)}</strong></div>
        <div><span>Proof due</span><strong>${view.daysToProof} days</strong></div>
        <div><span>QBR</span><strong>${view.account.qbrDate}</strong></div>
      </div>
      <div class="workorder-actions">
        <button type="button" class="mini-action" data-client-select="${view.client.id}">View account</button>
        <button type="button" class="mini-action primary" data-renewal-pack="${view.client.id}">Prepare renewal pack</button>
      </div>
    </div>
  `).join("");

  els.slaList.innerHTML = views.map((view) => `
    <div class="sla-row ${view.tone}" data-sla-card="${view.client.id}">
      <div class="item-row">
        <strong>${view.client.name}</strong>
        <span class="tag ${statusClass(view.tone)}">${view.data.health}/${view.account.targetHealth} health</span>
      </div>
      <span>${view.account.visitsPerMonth} visit(s)/mo - ${view.account.responseTargetHours}h response target</span>
      <small>${view.data.openWorkorders.length} open work order(s) - ${view.data.issues} open issue(s) - ${view.data.survival}% survival</small>
    </div>
  `).join("");

  els.successPlaybook.innerHTML = commercialPlaybook.map((item) => `
    <div class="method-row">
      <span>${item.trigger}</span>
      <strong>${item.action} - ${item.owner}</strong>
    </div>
  `).join("");
}

function podClass(zone) {
  if (zone.health < 78) return "pod risk";
  if (zone.health < 86) return "pod low";
  return "pod";
}

function renderWalls() {
  const filteredWalls = walls.filter((wall) => {
    if (state.filter === "risk") return wall.status !== "stable";
    if (state.filter === "smart") return wall.version === "Smart";
    return true;
  });

  els.wallGrid.innerHTML = filteredWalls.map((wall) => {
    const client = clientFor(wall);
    return `
      <button type="button" class="wall-card ${wall.id === state.selectedWallId ? "selected" : ""}" data-wall-select="${wall.id}">
        <div class="item-row">
          <div>
            <strong>${wall.id}</strong>
            <span>${wall.name}</span>
          </div>
          <span class="tag ${statusClass(wall.status)}">${wall.version}</span>
        </div>
        <div class="wall-visual" aria-label="${wall.name} health map">
          ${wall.zones.flatMap((zone) => Array.from({ length: 9 }, () => `<span class="${podClass(zone)}"></span>`)).join("")}
        </div>
        <div class="wall-meta">
          <div><span>Health</span><strong>${wall.health}</strong></div>
          <div><span>Pods</span><strong>${wall.pods}</strong></div>
          <div><span>Next</span><strong>${wall.nextVisit}</strong></div>
        </div>
        <small>${client.name} - ${wall.location}</small>
      </button>
    `;
  }).join("");

  const wall = selectedWall();
  els.wallDetailTitle.textContent = `${wall.id} - ${wall.name}`;
  els.wallDetailStatus.textContent = `${clientFor(wall).name} - ${wall.status}`;
  els.wallDetail.innerHTML = [
    ["Location", wall.location],
    ["Service cadence", wall.cadence],
    ["Green area", `${wall.greenArea.toFixed(1)} m2`],
    ["Sensors", wall.sensors.join(", ")],
    ["ESG proof", `${wall.waterSaved} L water estimate, ${wall.staffReach} people reach`],
    ["Tags", wall.tags.join(", ")]
  ].map(([label, value]) => `<div><span>${label}</span><strong>${value}</strong></div>`).join("");

  els.podHealthList.innerHTML = wall.zones.map((zone) => `
    <div class="zone-row">
      <div class="zone-map">
        ${Array.from({ length: 15 }, () => `<span class="${podClass(zone)}"></span>`).join("")}
      </div>
      <div>
        <strong>${zone.name}</strong>
        <span>${zone.pods} pods - health ${zone.health}</span>
        <small>${zone.issue}</small>
      </div>
    </div>
  `).join("");
}

function renderSensors() {
  const sensorItems = sensorReadings.map(sensorView);
  const actionItems = sensorItems.filter((item) => sensorNeedsAction(item));
  const acknowledged = sensorItems.filter((item) => item.acknowledged);
  const offline = sensorItems.filter((item) => item.status === "offline" && !item.acknowledged);
  const alertItems = sensorItems.filter((item) => item.status === "alert" && !item.acknowledged);

  els.sensorStatus.textContent = `${actionItems.length} active telemetry exception(s)`;
  els.sensorStatus.classList.toggle("good", actionItems.length === 0);
  renderStatCards(els.sensorGrid, [
    { label: "Sensor readings", value: sensorItems.length, detail: "Water, light and gateway inputs" },
    { label: "Active alerts", value: alertItems.length, detail: "Needs same-day FM review" },
    { label: "Offline gateways", value: offline.length, detail: "Manual-check until restored" },
    { label: "Acknowledged", value: acknowledged.length, detail: "Alerts accepted by control desk" }
  ]);

  els.sensorList.innerHTML = sensorItems.map((item) => `
    <div class="list-item sensor-card ${item.displayTone}" data-sensor-card="${item.id}">
      <div class="item-row">
        <strong>${item.id} - ${item.type}</strong>
        <span class="tag ${statusClass(item.displayTone)}">${item.displayStatus}</span>
      </div>
      <span>${item.client.name} - ${item.wall.location} - ${item.lastSeen}</span>
      <div class="sensor-meter">
        <div><span>Reading</span><strong>${item.value}${item.unit}</strong></div>
        <div><span>Target</span><strong>${item.target}</strong></div>
      </div>
      <small>${item.action}</small>
      <div class="workorder-actions">
        <button type="button" class="mini-action" data-wall-select="${item.wall.id}">Wall detail</button>
        <button type="button" class="mini-action primary" data-ack-sensor="${item.id}" ${item.acknowledged || item.status === "ok" ? "disabled" : ""}>${item.acknowledged ? "Acknowledged" : "Acknowledge alert"}</button>
      </div>
    </div>
  `).join("");

  els.sensorRuleList.innerHTML = sensorRules.map((rule) => `
    <div class="method-row">
      <span>${rule.trigger}</span>
      <strong>${rule.action}</strong>
    </div>
  `).join("");
}

function renderService() {
  els.workorderList.innerHTML = workorders.map((order) => {
    const wall = wallById(order.wallId);
    const view = workorderView(order);
    const completed = Boolean(view.completion);
    return `
      <div class="list-item workorder-item ${completed ? "completed" : ""}" data-workorder-card="${view.id}">
        <div class="item-row">
          <strong>${view.id} - ${view.type}</strong>
          <span class="tag ${statusClass(view.displayPriority === "high" ? "risk" : view.displayPriority)}">${view.displayStatus}</span>
        </div>
        <span>${clientFor(wall).name} - ${wall.location}</span>
        <small>${view.due} - ${view.tasks.join(", ")}</small>
        ${completed ? `<small>Completed by ${view.completion.completedBy} - ${new Date(view.completion.completedAt).toLocaleString("en-HK")}</small>` : ""}
        <div class="workorder-actions">
          <button type="button" class="mini-action" data-wall-select="${wall.id}">Wall detail</button>
          <button type="button" class="mini-action primary" data-complete-workorder="${view.id}" ${completed ? "disabled" : ""}>${completed ? "Completed" : "Complete work order"}</button>
        </div>
      </div>
    `;
  }).join("");

  els.diagnosisList.innerHTML = diagnoses.map((diagnosis) => {
    const wall = wallById(diagnosis.wallId);
    return `
      <button type="button" class="list-item" data-wall-select="${wall.id}">
        <div class="item-row">
          <strong>${diagnosis.wallId} - ${diagnosis.finding}</strong>
          <span class="tag">${diagnosis.confidence}%</span>
        </div>
        <span>${diagnosis.evidence}</span>
        <small>${diagnosis.action}</small>
      </button>
    `;
  }).join("");
}

function crewById(id) {
  return crewMembers.find((member) => member.id === id);
}

function routeView(routeItem) {
  const order = workorders.find((item) => item.id === routeItem.workorderId);
  const wall = wallById(order.wallId);
  const client = clientFor(wall);
  const technician = crewById(routeItem.technicianId);
  const completed = isWorkorderCompleted(order.id);
  const staged = isDispatchStaged(order.id);
  return {
    ...routeItem,
    order,
    wall,
    client,
    technician,
    completed,
    staged,
    displayStatus: completed ? "Completed" : staged ? "Kit staged" : routeItem.readiness,
    statusTone: completed || staged ? "completed" : order.priority
  };
}

function renderDispatch() {
  const routeItems = dispatchRoute
    .map(routeView)
    .sort((a, b) => a.sequence - b.sequence);
  const openStops = routeItems.filter((item) => !item.completed);
  const stagedStops = routeItems.filter((item) => item.staged && !item.completed);
  const highPriorityStops = openStops.filter((item) => item.order.priority === "high");
  const reservedUnits = sum(dispatchInventory, (item) => item.reserved);

  els.dispatchStatus.textContent = `${openStops.length} open stop(s), ${stagedStops.length} kit staged`;
  els.dispatchStatus.classList.toggle("good", openStops.length === 0);
  renderStatCards(els.dispatchGrid, [
    { label: "Route stops", value: routeItems.length, detail: "Sequenced across today and next visits" },
    { label: "Kits staged", value: stagedStops.length, detail: "Ready for technician handoff" },
    { label: "High priority", value: highPriorityStops.length, detail: "Needs same-day attention" },
    { label: "Reserved stock", value: reservedUnits, detail: "Pods, nutrients and tools held for work orders" }
  ]);

  els.dispatchRouteList.innerHTML = routeItems.map((item) => `
    <div class="list-item dispatch-stop ${item.completed ? "completed" : ""}" data-dispatch-card="${item.order.id}">
      <div class="item-row">
        <strong>#${item.sequence} ${item.window}</strong>
        <span class="tag ${statusClass(item.statusTone === "high" ? "risk" : item.statusTone)}">${item.displayStatus}</span>
      </div>
      <span>${item.order.id} - ${item.client.name} - ${item.wall.location}</span>
      <small>${item.technician.name} - ${item.technician.role} - ${item.travelBuffer} min travel buffer</small>
      <div class="kit-list">
        ${item.kit.map((kitItem) => `<em>${kitItem}</em>`).join("")}
      </div>
      <div class="workorder-actions">
        <button type="button" class="mini-action" data-wall-select="${item.wall.id}">Wall detail</button>
        <button type="button" class="mini-action" data-stage-dispatch="${item.order.id}" ${item.staged || item.completed ? "disabled" : ""}>${item.staged ? "Kit staged" : "Stage kit"}</button>
        <button type="button" class="mini-action primary" data-complete-workorder="${item.order.id}" ${item.completed ? "disabled" : ""}>${item.completed ? "Completed" : "Complete stop"}</button>
      </div>
    </div>
  `).join("");

  els.dispatchCrewList.innerHTML = crewMembers.map((member) => {
    const assigned = routeItems.filter((item) => item.technician.id === member.id);
    return `
      <div class="crew-row">
        <div class="item-row">
          <strong>${member.name}</strong>
          <span class="tag ${assigned.length > member.capacity ? "danger" : ""}">${assigned.length}/${member.capacity} stops</span>
        </div>
        <span>${member.role} - ${member.base}</span>
        <small>${member.skills.join(", ")}</small>
      </div>
    `;
  }).join("");

  els.dispatchInventoryList.innerHTML = dispatchInventory.map((item) => {
    const available = item.onHand - item.reserved;
    const risk = available <= item.reorderAt;
    return `
      <div class="method-row inventory-row ${risk ? "at-risk" : ""}">
        <span>${item.sku} - ${item.label}</span>
        <strong>${available} available - ${item.reserved} reserved - reorder at ${item.reorderAt}</strong>
      </div>
    `;
  }).join("");
}

function renderSupply() {
  const supplyRows = supplyItems.map(supplyView);
  const reorderNow = supplyRows.filter((item) => item.displayTone === "alert");
  const watchStock = supplyRows.filter((item) => item.displayTone === "watch");
  const requested = supplyRows.filter((item) => item.requested);
  const reservedUnits = sum(supplyRows, (item) => item.reserved);

  els.supplyStatus.textContent = `${reorderNow.length} reorder flag(s), ${requested.length} request(s) raised`;
  els.supplyStatus.classList.toggle("good", reorderNow.length === 0);
  renderStatCards(els.supplyGrid, [
    { label: "Tracked SKUs", value: supplyRows.length, detail: "Pods, sleeves, nutrients and tools" },
    { label: "Reorder now", value: reorderNow.length, detail: "Available stock at or below threshold" },
    { label: "Watch stock", value: watchStock.length, detail: "Approaching reorder level" },
    { label: "Reserved units", value: reservedUnits, detail: "Held for dispatch and proof continuity" }
  ]);

  els.supplyList.innerHTML = supplyRows.map((item) => `
    <div class="list-item supply-card ${item.displayTone}" data-supply-card="${item.sku}">
      <div class="item-row">
        <strong>${item.sku} - ${item.label}</strong>
        <span class="tag ${statusClass(item.displayTone)}">${item.displayStatus}</span>
      </div>
      <span>${item.category} - ${item.supplier} - ${item.leadTimeDays} day lead time</span>
      <div class="commercial-meta">
        <div><span>Available</span><strong>${item.available}</strong></div>
        <div><span>Reserved</span><strong>${item.reserved}</strong></div>
        <div><span>Reorder point</span><strong>${item.reorderAt}</strong></div>
      </div>
      <small>Recommended reorder quantity: ${item.reorderQty}</small>
      <div class="workorder-actions">
        <button type="button" class="mini-action primary" data-request-supply="${item.sku}" ${item.requested || item.displayTone === "ok" ? "disabled" : ""}>${item.requested ? "Requested" : "Request reorder"}</button>
      </div>
    </div>
  `).join("");

  els.supplyPolicyList.innerHTML = supplyPolicies.map((policy) => `
    <div class="method-row">
      <span>${policy.label}</span>
      <strong>${policy.rule}</strong>
    </div>
  `).join("");
}

function proofView(record) {
  const wall = wallById(record.wallId);
  const client = clientFor(wall);
  const order = workorders.find((item) => item.id === record.workorderId);
  const approved = isProofApproved(record.id);
  return {
    ...record,
    wall,
    client,
    order,
    approved,
    displayStatus: approved ? "Approved" : record.status,
    displayTone: approved ? "approved" : record.tone
  };
}

function renderProof() {
  const proofItems = proofRecords.map(proofView);
  const reportReady = proofItems.filter((item) => proofRecordReady(item));
  const approved = proofItems.filter((item) => item.approved);
  const needsReview = proofItems.filter((item) => item.displayTone === "review");
  const missing = proofItems.filter((item) => item.displayTone === "missing");
  const readiness = proofItems.length ? Math.round((reportReady.length / proofItems.length) * 100) : 0;

  els.proofStatus.textContent = `${readiness}% report-ready evidence`;
  els.proofStatus.classList.toggle("good", missing.length === 0 && needsReview.length === 0);
  renderStatCards(els.proofGrid, [
    { label: "Proof records", value: proofItems.length, detail: "Photos, notes and trace evidence" },
    { label: "Report-ready", value: reportReady.length, detail: "Ready or explicitly approved" },
    { label: "Needs review", value: needsReview.length, detail: "Evidence desk check required" },
    { label: "Missing proof", value: missing.length, detail: "Blocks clean client export" }
  ]);

  els.proofRecordList.innerHTML = proofItems.map((item) => `
    <div class="list-item proof-card ${item.displayTone}" data-proof-card="${item.id}">
      <div class="item-row">
        <strong>${item.id} - ${item.category}</strong>
        <span class="tag ${statusClass(item.displayTone)}">${item.displayStatus}</span>
      </div>
      <span>${item.client.name} - ${item.wall.location} - ${item.capturedAt}</span>
      <small>${item.source} - reviewer: ${item.reviewer}</small>
      <div class="kit-list">
        ${item.evidence.map((evidenceItem) => `<em>${evidenceItem}</em>`).join("")}
      </div>
      <small>${item.note}</small>
      <div class="workorder-actions">
        <button type="button" class="mini-action" data-wall-select="${item.wall.id}">Wall detail</button>
        <button type="button" class="mini-action primary" data-approve-proof="${item.id}" ${item.approved || item.displayTone === "missing" ? "disabled" : ""}>${item.approved ? "Approved" : "Approve proof"}</button>
      </div>
    </div>
  `).join("");

  els.proofRequirementList.innerHTML = proofRequirements.map((item) => `
    <div class="method-row proof-requirement">
      <span>${item.label}</span>
      <strong>${item.scope} - ${item.owner} - ${item.cadence}</strong>
      <small>${item.requiredFor.join(", ")} - ${item.status}</small>
    </div>
  `).join("");
}

function renderAudit() {
  const events = allAuditEvents();
  const localCount = auditEvents.length;
  const clientLinked = events.filter((event) => event.clientId).length;
  const reviewEvents = events.filter((event) => event.tone === "review" || event.tone === "alert").length;
  const latest = events[0];

  els.auditStatus.textContent = latest ? `Latest: ${latest.action}` : "No audit events yet";
  els.auditStatus.classList.toggle("good", localCount > 0);
  renderStatCards(els.auditGrid, [
    { label: "Audit events", value: events.length, detail: `${localCount} local control action(s)` },
    { label: "Client-linked", value: clientLinked, detail: "Events available for client reports" },
    { label: "Review signals", value: reviewEvents, detail: "Events that need management attention" },
    { label: "Control rules", value: auditControls.length, detail: "Traceability rules in force" }
  ]);

  els.auditEventList.innerHTML = events.map((event) => {
    const client = event.clientId ? clients.find((item) => item.id === event.clientId) : null;
    return `
      <div class="list-item audit-card ${event.tone}" data-audit-event="${event.id}">
        <div class="item-row">
          <strong>${event.action}</strong>
          <span class="tag ${statusClass(event.tone)}">${event.entityType}</span>
        </div>
        <span>${event.actor} - ${new Date(event.timestamp).toLocaleString("en-HK")}</span>
        <small>${client ? `${client.name} - ` : ""}${event.entityId}</small>
        <small>${event.detail}</small>
      </div>
    `;
  }).join("");

  els.auditControlList.innerHTML = auditControls.map((control) => `
    <div class="method-row">
      <span>${control.label}</span>
      <strong>${control.rule}</strong>
    </div>
  `).join("");
}

function fillEsgTemplate(template, data) {
  return template
    .replaceAll("{{greenArea}}", data.greenArea.toFixed(1))
    .replaceAll("{{waterSaved}}", String(data.waterSaved))
    .replaceAll("{{staffReach}}", String(data.staffReach));
}

function renderEsg() {
  const data = portfolioMetrics();
  renderStatCards(els.esgGrid, [
    { label: "Green wall area", value: `${data.greenArea.toFixed(1)} m2`, detail: "Directly measured wall ledger metric" },
    { label: "Water saved", value: `${data.waterSaved} L/mo`, detail: "Estimated vs loose-pot service baseline" },
    { label: "Service miles avoided", value: `${data.serviceMilesSaved} km`, detail: "Estimated by optimized FM route planning" },
    { label: "Wellness reach", value: data.staffReach, detail: "Estimated monthly visitor and staff touchpoints" },
    { label: "CO2e proxy", value: `${data.co2eProxy} kg`, detail: "Narrative proxy, not a carbon credit claim" }
  ], "esg-card");

  els.esgBars.innerHTML = esgTrend.map((row) => `
    <div class="bar-row">
      <span>${row.month}</span>
      <div class="bar-track"><div class="bar-fill" style="width: ${row.score}%"></div></div>
      <strong>${row.score}</strong>
    </div>
  `).join("");

  els.esgMethods.innerHTML = esgMethods.map((method) => `
    <div class="method-row">
      <span>${method.label}</span>
      <strong>${method.body}</strong>
    </div>
  `).join("");

  els.esgLedger.innerHTML = esgLedger.map((entry) => `
    <div class="ledger-card">
      <span>${entry.label}</span>
      <p>${fillEsgTemplate(entry.template, data)}</p>
    </div>
  `).join("");
}

function renderReports() {
  const client = selectedReportClient();
  const period = selectedReportMonth();
  const data = metricsForClient(client.id);
  const report = selectedReport();
  els.reportClientSelect.innerHTML = clients.map((item) => `
    <option value="${item.id}" ${item.id === client.id ? "selected" : ""}>${item.name}</option>
  `).join("");
  els.reportMonthSelect.innerHTML = reportMonths.map((month) => `
    <option value="${month.id}" ${month.id === period.id ? "selected" : ""}>${month.label}</option>
  `).join("");
  els.reportTabs.innerHTML = reportModes.map((mode) => `
    <button type="button" class="${mode.id === state.reportMode ? "active" : ""}" data-report-tab="${mode.id}">
      ${mode.label}
    </button>
  `).join("");

  els.reportStatus.textContent = state.reportGenerated ? "Generated" : "Draft pack";
  els.reportStatus.classList.toggle("good", state.reportGenerated);
  els.reportPeriod.textContent = `${period.label} - ${period.period}`;
  els.reportTitle.textContent = `${client.name} - ${report.title}`;
  els.reportSummary.textContent = report.summary;
  els.reportClientProfile.innerHTML = [
    ["Client", client.name],
    ["Segment", `${client.segment} - ${client.district}`],
    ["Plan", client.plan],
    ["Renewal", client.renewalDate],
    ["Proof need", client.proofNeed]
  ].map(([label, value]) => `
    <div>
      <span>${label}</span>
      <strong>${value}</strong>
    </div>
  `).join("");
  els.reportMetrics.innerHTML = [
    ["Health score", data.health],
    ["Report readiness", `${data.reportReadiness}%`],
    ["Green area", `${data.greenArea.toFixed(1)} m2`],
    ["Water estimate", `${data.waterSaved} L/mo`],
    ["Open issues", data.issues],
    ["Open work orders", data.openWorkorders.length],
    ["Completed work orders", data.completedWorkorders.length],
    ["Approved proof", data.approvedProofRecords.length],
    ["Proof gaps", data.proofGaps.length],
    ["Sensor alerts", data.openSensorAlerts.length],
    ["Audit events", data.auditEvents.length]
  ].map(([label, value]) => `
    <div class="report-metric">
      <span>${label}</span>
      <strong>${value}</strong>
    </div>
  `).join("");

  const evidence = [
    ...report.evidence,
    `${data.walls.length} wall ledger record(s)`,
    `${data.diagnoses.length} Doctor Forest finding(s)`,
    `${data.completedWorkorders.length} completed work order(s)`,
    `${data.openWorkorders.length} open or scheduled work order(s)`,
    `${data.reportReadyProofRecords.length} report-ready proof record(s)`,
    `${data.proofGaps.length} proof gap(s)`,
    `${data.openSensorAlerts.length} open sensor alert(s)`,
    `${data.auditEvents.length} client-linked audit event(s)`
  ];
  els.reportEvidence.innerHTML = evidence.map((item) => `
    <div class="evidence-card">
      <span>Included</span>
      <strong>${item}</strong>
    </div>
  `).join("");
  els.reportMethods.innerHTML = esgMethods.map((method) => `
    <div class="method-row">
      <span>${method.label}</span>
      <strong>${method.body}</strong>
    </div>
  `).join("");
}

function buildReportHtml() {
  const client = selectedReportClient();
  const period = selectedReportMonth();
  const report = selectedReport();
  const data = metricsForClient(client.id);
  const evidence = [
    ...report.evidence,
    `${data.walls.length} wall ledger record(s)`,
    `${data.diagnoses.length} Doctor Forest finding(s)`,
    `${data.completedWorkorders.length} completed work order(s)`,
    `${data.openWorkorders.length} open or scheduled work order(s)`,
    `${data.reportReadyProofRecords.length} report-ready proof record(s)`,
    `${data.proofGaps.length} proof gap(s)`,
    `${data.openSensorAlerts.length} open sensor alert(s)`,
    `${data.auditEvents.length} client-linked audit event(s)`
  ];
  const metricRows = [
    ["Health score", data.health],
    ["Report readiness", `${data.reportReadiness}%`],
    ["Green area", `${data.greenArea.toFixed(1)} m2`],
    ["Water estimate", `${data.waterSaved} L/mo`],
    ["Service miles avoided", `${data.serviceMilesSaved} km`],
    ["Wellness reach", `${data.staffReach} people/mo`],
    ["CO2e proxy", `${data.co2eProxy} kg`],
    ["Open work orders", data.openWorkorders.length],
    ["Completed work orders", data.completedWorkorders.length],
    ["Approved proof", data.approvedProofRecords.length],
    ["Proof gaps", data.proofGaps.length],
    ["Sensor alerts", data.openSensorAlerts.length],
    ["Audit events", data.auditEvents.length]
  ];

  return `<!doctype html>
<html lang="en-HK">
<head>
  <meta charset="utf-8">
  <title>${client.name} - ${report.label}</title>
  <style>
    body { margin: 40px; color: #18211d; font-family: Inter, Arial, sans-serif; line-height: 1.5; }
    h1 { margin: 0 0 8px; font-size: 32px; }
    h2 { margin: 28px 0 10px; font-size: 20px; }
    .meta, .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
    .card { border: 1px solid #d8e1d8; border-radius: 8px; padding: 14px; background: #f7faf7; }
    span { display: block; color: #63716a; font-size: 12px; font-weight: 700; text-transform: uppercase; }
    strong { display: block; margin-top: 4px; }
    li { margin: 6px 0; }
  </style>
</head>
<body>
  <span>MiniJungle FM Ops</span>
  <h1>${client.name} - ${report.title}</h1>
  <p>${period.label} (${period.period})</p>
  <p>${report.summary}</p>
  <div class="meta">
    <div class="card"><span>Client</span><strong>${client.segment} - ${client.district}</strong></div>
    <div class="card"><span>Plan</span><strong>${client.plan}</strong></div>
    <div class="card"><span>Renewal</span><strong>${client.renewalDate}</strong></div>
    <div class="card"><span>Proof need</span><strong>${client.proofNeed}</strong></div>
  </div>
  <h2>Metrics</h2>
  <div class="grid">
    ${metricRows.map(([label, value]) => `<div class="card"><span>${label}</span><strong>${value}</strong></div>`).join("")}
  </div>
  <h2>Evidence Included</h2>
  <ul>${evidence.map((item) => `<li>${item}</li>`).join("")}</ul>
  <h2>Method Notes</h2>
  <ul>${esgMethods.map((method) => `<li><strong>${method.label}:</strong> ${method.body}</li>`).join("")}</ul>
</body>
</html>`;
}

function downloadReportHtml() {
  const client = selectedReportClient();
  const period = selectedReportMonth();
  const html = buildReportHtml();
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${client.id}-${period.id}-minijungle-report.html`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  state.reportGenerated = true;
  recordAuditEvent({
    actor: "ESG desk",
    action: "HTML report exported",
    entityType: "report",
    entityId: `${client.id}-${period.id}`,
    clientId: client.id,
    tone: "ready",
    detail: "Client-scoped HTML report was exported from Report Center."
  });
  renderAll();
}

function renderArchitecture() {
  els.architectureLayers.innerHTML = architectureLayers.map((layer, index) => `
    <article class="architecture-card">
      <span>0${index + 1}</span>
      <h3>${layer.name}</h3>
      <div>
        ${layer.items.map((item) => `<em>${item}</em>`).join("")}
      </div>
    </article>
  `).join("");
}

function bindDynamicActions() {
  document.querySelectorAll("[data-client-select], [data-client-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      const clientId = button.dataset.clientSelect || button.dataset.clientTab;
      state.selectedClientId = clientId;
      const firstClientWall = walls.find((wall) => wall.clientId === clientId);
      if (firstClientWall) state.selectedWallId = firstClientWall.id;
      renderAll();
    });
  });

  document.querySelectorAll("[data-wall-select]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedWallId = button.dataset.wallSelect;
      state.selectedClientId = wallById(state.selectedWallId).clientId;
      renderAll();
      document.querySelector("#walls").scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  document.querySelectorAll("[data-report-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      state.reportMode = button.dataset.reportTab;
      renderReports();
    });
  });

  document.querySelectorAll("[data-complete-workorder]").forEach((button) => {
    button.addEventListener("click", () => {
      completeWorkorder(button.dataset.completeWorkorder);
    });
  });

  document.querySelectorAll("[data-stage-dispatch]").forEach((button) => {
    button.addEventListener("click", () => {
      stageDispatchKit(button.dataset.stageDispatch);
    });
  });

  document.querySelectorAll("[data-renewal-pack]").forEach((button) => {
    button.addEventListener("click", () => {
      prepareRenewalPack(button.dataset.renewalPack);
    });
  });

  document.querySelectorAll("[data-approve-proof]").forEach((button) => {
    button.addEventListener("click", () => {
      approveProofRecord(button.dataset.approveProof);
    });
  });

  document.querySelectorAll("[data-ack-sensor]").forEach((button) => {
    button.addEventListener("click", () => {
      acknowledgeSensorAlert(button.dataset.ackSensor);
    });
  });

  document.querySelectorAll("[data-request-supply]").forEach((button) => {
    button.addEventListener("click", () => {
      requestSupplyReorder(button.dataset.requestSupply);
    });
  });
}

function renderAll() {
  renderOverview();
  renderPositioning();
  renderClients();
  renderCommercial();
  renderWalls();
  renderSensors();
  renderService();
  renderDispatch();
  renderSupply();
  renderProof();
  renderEsg();
  renderAudit();
  renderReports();
  renderArchitecture();
  bindDynamicActions();
}

els.simulateVisitBtn.addEventListener("click", () => {
  state.simulatedVisits += 1;
  recordAuditEvent({
    actor: "FM Ops demo",
    action: "Portfolio visit simulated",
    entityType: "portfolio",
    entityId: "visit-simulation",
    clientId: null,
    tone: "completed",
    detail: "Demo visit completion adjusted portfolio health and issue counts."
  });
  els.syncStatus.textContent = `Synced just now after ${state.simulatedVisits} completed visit${state.simulatedVisits > 1 ? "s" : ""}`;
  renderAll();
});

els.reportClientSelect.addEventListener("change", () => {
  state.selectedReportClientId = els.reportClientSelect.value;
  renderReports();
});

els.reportMonthSelect.addEventListener("change", () => {
  state.selectedReportMonth = els.reportMonthSelect.value;
  renderReports();
});

els.downloadReportBtn.addEventListener("click", downloadReportHtml);

els.generateReportBtn.addEventListener("click", () => {
  state.reportGenerated = true;
  state.reportMode = "monthly";
  state.selectedReportClientId = state.selectedClientId || state.selectedReportClientId;
  recordAuditEvent({
    actor: "ESG desk",
    action: "ESG pack generated",
    entityType: "report",
    entityId: state.reportMode,
    clientId: state.selectedReportClientId,
    tone: "ready",
    detail: "Report center marked the ESG pack as generated."
  });
  renderReports();
  document.querySelector("#reports").scrollIntoView({ behavior: "smooth", block: "start" });
});

els.filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.filter = button.dataset.filter || "all";
    els.filterButtons.forEach((item) => item.classList.toggle("active", item === button));
    renderWalls();
    bindDynamicActions();
  });
});

els.navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    els.navLinks.forEach((item) => item.classList.toggle("active", item === link));
  });
});

async function bootstrap() {
  try {
    await loadAppData();
    loadWorkorderCompletions();
    loadDispatchStaging();
    loadProofApprovals();
    loadSensorAcknowledgements();
    loadSupplyRequests();
    loadAuditEvents();
    initializeSelection();
    renderAll();
  } catch (error) {
    console.error(error);
    els.syncStatus.textContent = "Data load failed";
    els.summaryGrid.innerHTML = `
      <article class="stat-card">
        <span>Startup error</span>
        <strong>Data unavailable</strong>
        <em>${error.message}</em>
      </article>
    `;
  }
}

bootstrap();
