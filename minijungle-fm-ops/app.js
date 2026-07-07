const dataFiles = {
  clients: "data/clients.json",
  walls: "data/walls.json",
  workorders: "data/workorders.json",
  diagnoses: "data/diagnoses.json",
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
let strategyCards = [];
let architectureLayers = [];

async function loadJson(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Failed to load ${path}: ${response.status}`);
  return response.json();
}

async function loadAppData() {
  const [loadedClients, loadedWalls, loadedWorkorders, loadedDiagnoses, esgMetrics, productModel] = await Promise.all([
    loadJson(dataFiles.clients),
    loadJson(dataFiles.walls),
    loadJson(dataFiles.workorders),
    loadJson(dataFiles.diagnoses),
    loadJson(dataFiles.esgMetrics),
    loadJson(dataFiles.productModel)
  ]);

  clients = loadedClients;
  walls = loadedWalls;
  workorders = loadedWorkorders;
  diagnoses = loadedDiagnoses;
  esgTrend = esgMetrics.trend || [];
  esgMethods = esgMetrics.methods || [];
  esgLedger = esgMetrics.ledger || [];
  reportModes = productModel.reportModes || [];
  strategyCards = productModel.strategyCards || [];
  architectureLayers = productModel.architectureLayers || [];
}

function initializeSelection() {
  state.selectedClientId = clients[0]?.id || null;
  state.selectedWallId = walls[0]?.id || null;
  state.reportMode = reportModes[0]?.id || null;
}

const state = {
  simulatedVisits: 0,
  filter: "all",
  selectedClientId: null,
  selectedWallId: null,
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
  wallGrid: document.querySelector("#wall-grid"),
  wallDetailTitle: document.querySelector("#wall-detail-title"),
  wallDetailStatus: document.querySelector("#wall-detail-status"),
  wallDetail: document.querySelector("#wall-detail"),
  podHealthList: document.querySelector("#pod-health-list"),
  workorderList: document.querySelector("#workorder-list"),
  diagnosisList: document.querySelector("#diagnosis-list"),
  esgGrid: document.querySelector("#esg-grid"),
  esgBars: document.querySelector("#esg-bars"),
  esgMethods: document.querySelector("#esg-methods"),
  esgLedger: document.querySelector("#esg-ledger"),
  reportTabs: document.querySelector("#report-tabs"),
  reportStatus: document.querySelector("#report-status"),
  reportPeriod: document.querySelector("#report-period"),
  reportTitle: document.querySelector("#report-title"),
  reportSummary: document.querySelector("#report-summary"),
  reportMetrics: document.querySelector("#report-metrics"),
  reportEvidence: document.querySelector("#report-evidence"),
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

function riskLabel(level) {
  if (level === "high") return "High risk";
  if (level === "medium") return "Watch";
  return "Healthy";
}

function statusClass(value) {
  if (value === "risk" || value === "high") return "danger";
  if (value === "watch" || value === "medium") return "warn";
  return "";
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
    { label: "Open issues", value: data.issues, detail: "Low light, yellowing, replacement follow-up" },
    { label: "Managed value", value: formatCurrency(data.revenue), detail: "Setup, care and DF Pro base" }
  ]);

  els.proofStrip.innerHTML = [
    ["Green wall area", `${data.greenArea.toFixed(1)} m2`],
    ["Water-saving estimate", `${data.waterSaved} L/mo`],
    ["Wellness reach", `${data.staffReach} people/mo`],
    ["Report readiness", `${data.reportReadiness}%`]
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
          <strong>${wall.id} · ${wall.name}</strong>
          <span class="tag ${statusClass(wall.status)}">${wall.status}</span>
        </div>
        <span>${clientFor(wall).name} · ${wall.location}</span>
        <small>Health ${wall.health} · ${wall.issues} issues · next visit ${wall.nextVisit}</small>
      </button>
    `).join("");

  els.serviceTimeline.innerHTML = workorders.map((order) => {
    const wall = wallById(order.wallId);
    return `
      <button type="button" class="list-item" data-wall-select="${wall.id}">
        <div class="item-row">
          <strong>${order.due}</strong>
          <span class="tag ${statusClass(order.priority === "high" ? "risk" : order.priority)}">${order.status}</span>
        </div>
        <span>${order.id} · ${order.type}</span>
        <small>${clientFor(wall).name} · ${order.tasks.join(", ")}</small>
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
        <span>${client.segment} · ${client.district}</span>
        <small>${clientWalls.length} wall(s) · health ${averageHealth} · renewal ${client.renewalDate}</small>
      </button>
    `;
  }).join("");

  const client = selectedClient();
  const clientWalls = walls.filter((wall) => wall.clientId === client.id);
  els.clientDetailTitle.textContent = client.name;
  els.clientDetailStatus.textContent = `${client.segment} · ${client.district}`;
  els.clientDetail.innerHTML = [
    ["Plan", client.plan],
    ["Contract", client.contract],
    ["Contact", client.contact],
    ["Renewal date", client.renewalDate],
    ["Proof need", client.proofNeed],
    ["Walls", `${clientWalls.length} wall(s), ${sum(clientWalls, (wall) => wall.pods)} Plant Pods`]
  ].map(([label, value]) => `<div><span>${label}</span><strong>${value}</strong></div>`).join("");
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
        <small>${client.name} · ${wall.location}</small>
      </button>
    `;
  }).join("");

  const wall = selectedWall();
  els.wallDetailTitle.textContent = `${wall.id} · ${wall.name}`;
  els.wallDetailStatus.textContent = `${clientFor(wall).name} · ${wall.status}`;
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
        <span>${zone.pods} pods · health ${zone.health}</span>
        <small>${zone.issue}</small>
      </div>
    </div>
  `).join("");
}

function renderService() {
  els.workorderList.innerHTML = workorders.map((order) => {
    const wall = wallById(order.wallId);
    return `
      <button type="button" class="list-item" data-wall-select="${wall.id}">
        <div class="item-row">
          <strong>${order.id} · ${order.type}</strong>
          <span class="tag ${statusClass(order.priority === "high" ? "risk" : order.priority)}">${order.status}</span>
        </div>
        <span>${clientFor(wall).name} · ${wall.location}</span>
        <small>${order.due} · ${order.tasks.join(", ")}</small>
      </button>
    `;
  }).join("");

  els.diagnosisList.innerHTML = diagnoses.map((diagnosis) => {
    const wall = wallById(diagnosis.wallId);
    return `
      <button type="button" class="list-item" data-wall-select="${wall.id}">
        <div class="item-row">
          <strong>${diagnosis.wallId} · ${diagnosis.finding}</strong>
          <span class="tag">${diagnosis.confidence}%</span>
        </div>
        <span>${diagnosis.evidence}</span>
        <small>${diagnosis.action}</small>
      </button>
    `;
  }).join("");
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
  const data = portfolioMetrics();
  const report = selectedReport();
  els.reportTabs.innerHTML = reportModes.map((mode) => `
    <button type="button" class="${mode.id === state.reportMode ? "active" : ""}" data-report-tab="${mode.id}">
      ${mode.label}
    </button>
  `).join("");

  els.reportStatus.textContent = state.reportGenerated ? "Generated" : "Draft pack";
  els.reportStatus.classList.toggle("good", state.reportGenerated);
  els.reportPeriod.textContent = state.reportGenerated ? "Generated today" : "June 2026";
  els.reportTitle.textContent = report.title;
  els.reportSummary.textContent = report.summary;
  els.reportMetrics.innerHTML = [
    ["Health score", data.health],
    ["Report readiness", `${data.reportReadiness}%`],
    ["Green area", `${data.greenArea.toFixed(1)} m2`],
    ["Water estimate", `${data.waterSaved} L/mo`]
  ].map(([label, value]) => `
    <div class="report-metric">
      <span>${label}</span>
      <strong>${value}</strong>
    </div>
  `).join("");

  els.reportEvidence.innerHTML = report.evidence.map((item) => `
    <div class="evidence-card">
      <span>Included</span>
      <strong>${item}</strong>
    </div>
  `).join("");
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
}

function renderAll() {
  renderOverview();
  renderPositioning();
  renderClients();
  renderWalls();
  renderService();
  renderEsg();
  renderReports();
  renderArchitecture();
  bindDynamicActions();
}

els.simulateVisitBtn.addEventListener("click", () => {
  state.simulatedVisits += 1;
  els.syncStatus.textContent = `Synced just now after ${state.simulatedVisits} completed visit${state.simulatedVisits > 1 ? "s" : ""}`;
  renderAll();
});

els.generateReportBtn.addEventListener("click", () => {
  state.reportGenerated = true;
  state.reportMode = "monthly";
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
