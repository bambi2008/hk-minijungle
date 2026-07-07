const clients = [
  {
    id: "central-office",
    name: "Central Grade A Office",
    segment: "Office tenant",
    district: "Central",
    contact: "FM Manager: Ms. Lee",
    plan: "Premium Care + DF Pro",
    contract: "HK$12,800 setup + HK$1,280/mo",
    renewalDate: "2026-10-31",
    renewalRisk: "low",
    revenue: 48640,
    proofNeed: "ESG and wellness report for tenant experience review"
  },
  {
    id: "wellness-clinic",
    name: "Wellness Clinic Group",
    segment: "Clinic",
    district: "Causeway Bay",
    contact: "Operations: Dr. Wong",
    plan: "Standard Care",
    contract: "HK$9,800 setup + HK$699/mo",
    renewalDate: "2026-09-15",
    renewalRisk: "medium",
    revenue: 26572,
    proofNeed: "Patient comfort and brand freshness proof"
  },
  {
    id: "show-suite",
    name: "Property Show Suite",
    segment: "Landlord / showroom",
    district: "Tsim Sha Tsui",
    contact: "Asset team: Mr. Chan",
    plan: "Premium Care + DF Pro",
    contract: "HK$11,800 setup + HK$1,280/mo",
    renewalDate: "2026-08-20",
    renewalRisk: "high",
    revenue: 42520,
    proofNeed: "Photo evidence that lobby upgrade remains presentation-ready"
  },
  {
    id: "members-club",
    name: "Private Members Club",
    segment: "Clubhouse",
    district: "Wan Chai",
    contact: "Venue manager: Ms. Ho",
    plan: "Premium Care",
    contract: "HK$10,800 setup + HK$980/mo",
    renewalDate: "2026-12-01",
    renewalRisk: "low",
    revenue: 34320,
    proofNeed: "Consistent premium ambience and low disruption service"
  }
];

const walls = [
  {
    id: "MJ-HK-001",
    clientId: "central-office",
    name: "Reception Living Wall",
    location: "26/F Reception",
    version: "Smart",
    modules: 4,
    pods: 180,
    health: 91,
    survival: 96,
    issues: 3,
    nextVisit: "Jul 08",
    cadence: "Twice monthly",
    greenArea: 8.7,
    waterSaved: 184,
    serviceMilesSaved: 22,
    staffReach: 260,
    co2eProxy: 109,
    status: "stable",
    sensors: ["water level", "temperature", "humidity"],
    tags: ["ESG report ready", "DF Pro"],
    zones: [
      { name: "Left", pods: 45, health: 92, issue: "none" },
      { name: "Center-left", pods: 45, health: 89, issue: "minor yellowing" },
      { name: "Center-right", pods: 45, health: 93, issue: "none" },
      { name: "Right", pods: 45, health: 90, issue: "trim due" }
    ]
  },
  {
    id: "MJ-HK-014",
    clientId: "wellness-clinic",
    name: "Waiting Lounge Wall",
    location: "Patient lounge",
    version: "Standard",
    modules: 2,
    pods: 90,
    health: 84,
    survival: 92,
    issues: 7,
    nextVisit: "Jul 06",
    cadence: "Twice monthly",
    greenArea: 4.4,
    waterSaved: 76,
    serviceMilesSaved: 12,
    staffReach: 180,
    co2eProxy: 55,
    status: "watch",
    sensors: ["manual photo check"],
    tags: ["replacement suggested"],
    zones: [
      { name: "Upper", pods: 30, health: 86, issue: "none" },
      { name: "Middle", pods: 30, health: 81, issue: "yellowing" },
      { name: "Lower", pods: 30, health: 85, issue: "water swing" }
    ]
  },
  {
    id: "MJ-HK-021",
    clientId: "show-suite",
    name: "Lift Lobby Feature Wall",
    location: "Show suite lift lobby",
    version: "Smart",
    modules: 3,
    pods: 135,
    health: 78,
    survival: 88,
    issues: 11,
    nextVisit: "Jul 07",
    cadence: "Weekly until stable",
    greenArea: 6.6,
    waterSaved: 129,
    serviceMilesSaved: 18,
    staffReach: 420,
    co2eProxy: 83,
    status: "risk",
    sensors: ["water level", "temperature", "humidity", "light"],
    tags: ["low light", "renewal risk"],
    zones: [
      { name: "North", pods: 45, health: 73, issue: "low light" },
      { name: "Center", pods: 45, health: 79, issue: "leggy growth" },
      { name: "South", pods: 45, health: 82, issue: "follow-up photo due" }
    ]
  },
  {
    id: "MJ-HK-033",
    clientId: "members-club",
    name: "Pantry Lounge Wall",
    location: "Member pantry lounge",
    version: "Standard",
    modules: 3,
    pods: 135,
    health: 89,
    survival: 95,
    issues: 4,
    nextVisit: "Jul 12",
    cadence: "Monthly",
    greenArea: 6.6,
    waterSaved: 118,
    serviceMilesSaved: 16,
    staffReach: 210,
    co2eProxy: 83,
    status: "stable",
    sensors: ["manual photo check"],
    tags: ["client showcase"],
    zones: [
      { name: "Bar side", pods: 45, health: 90, issue: "none" },
      { name: "Bench side", pods: 45, health: 88, issue: "trim due" },
      { name: "Corner", pods: 45, health: 89, issue: "none" }
    ]
  }
];

const workorders = [
  {
    id: "WO-1042",
    wallId: "MJ-HK-014",
    type: "Bi-weekly care visit",
    due: "Today 10:30",
    status: "Ready",
    priority: "medium",
    tasks: ["Top up water", "Nutrient dose", "Trim", "Capture 12 proof photos"]
  },
  {
    id: "WO-1047",
    wallId: "MJ-HK-021",
    type: "Risk follow-up",
    due: "Today 15:00",
    status: "High priority",
    priority: "high",
    tasks: ["Retake low-light zone", "Check LED schedule", "Replace weak pods"]
  },
  {
    id: "WO-1051",
    wallId: "MJ-HK-001",
    type: "Monthly report capture",
    due: "Tomorrow",
    status: "Scheduled",
    priority: "low",
    tasks: ["Full-wall photo", "Pod sample check", "ESG proof sign-off"]
  },
  {
    id: "WO-1054",
    wallId: "MJ-HK-033",
    type: "Client showcase prep",
    due: "Jul 12",
    status: "Scheduled",
    priority: "low",
    tasks: ["Trim visible edges", "Clean frame", "Capture after photo"]
  }
];

const diagnoses = [
  {
    wallId: "MJ-HK-021",
    finding: "Low light plus leggy growth risk",
    action: "Raise zone 1 LED output to 70% and retake the same angle in 7 days.",
    confidence: 82,
    evidence: "Lower density and elongated stems in the north zone"
  },
  {
    wallId: "MJ-HK-014",
    finding: "Local yellowing, likely water swing",
    action: "Reduce top-up volume this week and replace 6 weak Plant Pods.",
    confidence: 76,
    evidence: "Yellowing concentrated in lower middle zone"
  },
  {
    wallId: "MJ-HK-001",
    finding: "Stable presentation condition",
    action: "Keep current service rhythm and include this wall in the ESG pack.",
    confidence: 91,
    evidence: "High survival rate, low issue count, consistent photos"
  }
];

const esgTrend = [
  { month: "Jan", score: 72 },
  { month: "Feb", score: 76 },
  { month: "Mar", score: 81 },
  { month: "Apr", score: 84 },
  { month: "May", score: 87 },
  { month: "Jun", score: 89 }
];

const reportModes = [
  {
    id: "monthly",
    label: "Monthly ESG",
    title: "Central Portfolio ESG Health Report",
    summary: "A client-facing monthly pack covering wall health, service response, green wall area, water-saving estimates and photo evidence.",
    evidence: ["Full-wall before/after photos", "Health score trend", "Work order closure log", "ESG metric method notes"]
  },
  {
    id: "renewal",
    label: "Renewal Proof",
    title: "Renewal Value and Service Proof Pack",
    summary: "A commercial pack for FM and procurement teams showing service reliability, visible improvement and risks handled before renewal.",
    evidence: ["Issue closure rate", "Replacement history", "Client risk notes", "Contract and attach-rate summary"]
  },
  {
    id: "audit",
    label: "Audit Trail",
    title: "Green Asset Service Audit Trail",
    summary: "A governance pack that shows who visited, what was checked, which photos were captured and how each claim is supported.",
    evidence: ["Technician visit records", "Photo timestamps", "Doctor Forest findings", "Manual override notes"]
  }
];

const strategyCards = [
  {
    title: "Positioning",
    value: "Living Green Wall OS",
    body: "A vertical green asset operating system for HK commercial spaces, not a consumer plant diary."
  },
  {
    title: "Audience",
    value: "FM + ESG + Landlord",
    body: "Designed for facility teams, asset managers and customer-facing venue operators."
  },
  {
    title: "Image",
    value: "Premium, calm, auditable",
    body: "More enterprise dashboard than garden app: restrained UI, proof-first language, clear service actions."
  },
  {
    title: "Moat",
    value: "Pod data + service proof",
    body: "Standardized wall modules, Plant Pod records, Xponge replacement cycles and Doctor Forest diagnosis history."
  }
];

const architectureLayers = [
  {
    name: "Asset Layer",
    items: ["Client", "Site", "Wall", "Module", "Plant Pod", "Xponge Sleeve", "Sensor"]
  },
  {
    name: "Service Layer",
    items: ["Visit schedule", "Work order", "Photo proof", "Replacement record", "Inventory"]
  },
  {
    name: "Health Layer",
    items: ["Health score", "Doctor Forest finding", "Risk queue", "Follow-up standard"]
  },
  {
    name: "ESG Layer",
    items: ["Green area", "Water estimate", "Service miles", "Wellness reach", "Evidence status"]
  },
  {
    name: "Client Proof Layer",
    items: ["Monthly report", "Renewal pack", "Audit trail", "Export API"]
  }
];

const state = {
  simulatedVisits: 0,
  filter: "all",
  selectedClientId: clients[0].id,
  selectedWallId: walls[0].id,
  reportMode: reportModes[0].id,
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
  return reportModes.find((mode) => mode.id === state.reportMode);
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

  els.esgMethods.innerHTML = [
    ["Proven", "Wall count, Plant Pod count, visit records, photos, replacement records."],
    ["Estimated", "Water saving, service miles avoided, wellness reach, CO2e proxy."],
    ["Not claimed", "Carbon credits, formal air purification guarantees, certified WELL/LEED points."]
  ].map(([label, body]) => `
    <div class="method-row">
      <span>${label}</span>
      <strong>${body}</strong>
    </div>
  `).join("");

  els.esgLedger.innerHTML = [
    ["Environmental", `${data.greenArea.toFixed(1)} m2 live green wall area, ${data.waterSaved} L/mo water-saving estimate, Plant Pod replacement traceability.`],
    ["Social", `${data.staffReach} monthly staff and visitor touchpoints supported by visible biophilic space and stable presentation quality.`],
    ["Governance", "Each visit links work orders, photos, Doctor Forest findings, manual actions and report method notes."]
  ].map(([label, body]) => `
    <div class="ledger-card">
      <span>${label}</span>
      <p>${body}</p>
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

renderAll();
