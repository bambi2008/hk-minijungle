const portfolio = [
  {
    id: "MJ-HK-001",
    client: "Central Grade A Office",
    site: "中环 | 26/F Reception",
    plan: "Premium Care + DF Pro",
    version: "Smart",
    modules: 4,
    pods: 180,
    health: 91,
    survival: 96,
    greenArea: 8.7,
    waterSaved: 184,
    visits: 2,
    issues: 3,
    nextVisit: "Jul 08",
    renewalRisk: "low",
    tags: ["ESG report", "Smart"]
  },
  {
    id: "MJ-HK-014",
    client: "Wellness Clinic Group",
    site: "铜锣湾 | Waiting Lounge",
    plan: "Standard Care",
    version: "Standard",
    modules: 2,
    pods: 90,
    health: 84,
    survival: 92,
    greenArea: 4.4,
    waterSaved: 76,
    visits: 2,
    issues: 7,
    nextVisit: "Jul 06",
    renewalRisk: "medium",
    tags: ["换植建议"]
  },
  {
    id: "MJ-HK-021",
    client: "Property Show Suite",
    site: "尖沙咀 | Lift Lobby",
    plan: "Premium Care + DF Pro",
    version: "Smart",
    modules: 3,
    pods: 135,
    health: 78,
    survival: 88,
    greenArea: 6.6,
    waterSaved: 129,
    visits: 1,
    issues: 11,
    nextVisit: "Jul 07",
    renewalRisk: "high",
    tags: ["缺光", "复查"]
  },
  {
    id: "MJ-HK-033",
    client: "Private Members Club",
    site: "湾仔 | Pantry Lounge",
    plan: "Premium Care",
    version: "Standard",
    modules: 3,
    pods: 135,
    health: 89,
    survival: 95,
    greenArea: 6.6,
    waterSaved: 118,
    visits: 2,
    issues: 4,
    nextVisit: "Jul 12",
    renewalRisk: "low",
    tags: ["客户展示"]
  }
];

const workorders = [
  {
    id: "WO-1042",
    site: "Wellness Clinic Group",
    type: "半月维护",
    tasks: "加水、营养液、修剪、拍摄 12 张对比照",
    due: "Today 10:30",
    status: "待执行",
    priority: "medium"
  },
  {
    id: "WO-1047",
    site: "Property Show Suite",
    type: "异常复查",
    tasks: "缺光区域复拍，检查 LED 与风道状态",
    due: "Today 15:00",
    status: "高优先级",
    priority: "high"
  },
  {
    id: "WO-1051",
    site: "Central Grade A Office",
    type: "月度报告采集",
    tasks: "全景照、Pod 抽样、ESG 口径确认",
    due: "Tomorrow",
    status: "已排程",
    priority: "low"
  }
];

const diagnoses = [
  {
    wall: "MJ-HK-021",
    finding: "低光 + 徒长风险",
    action: "将 2 区 LED 提升至 70%，7 天后同角度复拍",
    confidence: 82
  },
  {
    wall: "MJ-HK-014",
    finding: "局部黄叶，疑似水分波动",
    action: "减少本周补水量，替换 6 个低活力 Pod",
    confidence: 76
  },
  {
    wall: "MJ-HK-001",
    finding: "状态稳定",
    action: "维持当前维护节奏，月报可直接生成",
    confidence: 91
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

const state = {
  simulatedVisits: 0,
  activeFilter: "all",
  reportGenerated: false
};

const kpiGrid = document.querySelector("#kpi-grid");
const esgGrid = document.querySelector("#esg-grid");
const wallGrid = document.querySelector("#wall-grid");
const riskList = document.querySelector("#risk-list");
const serviceTimeline = document.querySelector("#service-timeline");
const workorderList = document.querySelector("#workorder-list");
const diagnosisList = document.querySelector("#diagnosis-list");
const esgBars = document.querySelector("#esg-bars");
const esgNarrative = document.querySelector("#esg-narrative");
const reportMetrics = document.querySelector("#report-metrics");
const reportStatus = document.querySelector("#report-status");
const reportSummary = document.querySelector("#report-summary");
const syncStatus = document.querySelector("#sync-status");
const simulateVisitBtn = document.querySelector("#simulate-visit-btn");
const generateReportBtn = document.querySelector("#generate-report-btn");
const filterButtons = Array.from(document.querySelectorAll("[data-filter]"));

function sum(values) {
  return values.reduce((total, value) => total + value, 0);
}

function avg(values) {
  return Math.round(sum(values) / values.length);
}

function metrics() {
  const activeWalls = portfolio.length;
  const pods = sum(portfolio.map((wall) => wall.pods));
  const greenArea = sum(portfolio.map((wall) => wall.greenArea));
  const waterSaved = sum(portfolio.map((wall) => wall.waterSaved));
  const issues = sum(portfolio.map((wall) => wall.issues));
  const health = avg(portfolio.map((wall) => wall.health + state.simulatedVisits));
  const survival = avg(portfolio.map((wall) => wall.survival));
  const visits = sum(portfolio.map((wall) => wall.visits)) + state.simulatedVisits;
  const co2eProxy = Math.round(greenArea * 12.5);
  const wellnessReach = activeWalls * 118;

  return {
    activeWalls,
    pods,
    greenArea,
    waterSaved,
    issues: Math.max(0, issues - state.simulatedVisits * 2),
    health: Math.min(99, health),
    survival,
    visits,
    co2eProxy,
    wellnessReach
  };
}

function renderCards(container, cards, className) {
  container.innerHTML = cards.map((card) => `
    <article class="${className}">
      <span>${card.label}</span>
      <strong>${card.value}</strong>
      <em>${card.detail}</em>
    </article>
  `).join("");
}

function renderOverview() {
  const data = metrics();
  renderCards(kpiGrid, [
    { label: "活跃客户墙体", value: `${data.activeWalls}`, detail: `${data.pods} 个 Plant Pod 在管` },
    { label: "组合健康分", value: `${data.health}`, detail: `植物存活率 ${data.survival}%` },
    { label: "本月维护次数", value: `${data.visits}`, detail: "半月/月度服务节奏" },
    { label: "待处理异常", value: `${data.issues}`, detail: "缺光、黄叶、换植复查" }
  ], "kpi-card");

  riskList.innerHTML = portfolio
    .filter((wall) => wall.renewalRisk !== "low")
    .map((wall) => `
      <div class="risk-item">
        <div class="item-row">
          <strong>${wall.client}</strong>
          <span class="tag ${wall.renewalRisk === "high" ? "danger" : "warn"}">${wall.renewalRisk === "high" ? "续费风险高" : "需关注"}</span>
        </div>
        <span>${wall.site}</span>
        <small>健康分 ${wall.health} · 异常 ${wall.issues} · 下一次维护 ${wall.nextVisit}</small>
      </div>
    `).join("");

  serviceTimeline.innerHTML = workorders.map((order) => `
    <div class="timeline-item">
      <div class="item-row">
        <strong>${order.due}</strong>
        <span class="tag ${order.priority === "high" ? "danger" : order.priority === "medium" ? "warn" : ""}">${order.status}</span>
      </div>
      <span>${order.site}</span>
      <small>${order.type} · ${order.tasks}</small>
    </div>
  `).join("");
}

function renderEsg() {
  const data = metrics();
  renderCards(esgGrid, [
    { label: "绿色墙面面积", value: `${data.greenArea.toFixed(1)} m²`, detail: "可展示 living asset 面积" },
    { label: "节水估算", value: `${data.waterSaved} L`, detail: "对比传统散盆维护月度估算" },
    { label: "CO2e 叙事代理值", value: `${data.co2eProxy} kg`, detail: "用于客户沟通，需后续校准" },
    { label: "员工触达", value: `${data.wellnessReach}`, detail: "按前台/休息区日均人流估算" },
    { label: "ESG 报告分", value: `${data.health}`, detail: "健康、响应、替换率综合" }
  ], "esg-card");

  esgBars.innerHTML = esgTrend.map((row) => `
    <div class="bar-row">
      <span>${row.month}</span>
      <div class="bar-track"><div class="bar-fill" style="width: ${row.score}%"></div></div>
      <strong>${row.score}</strong>
    </div>
  `).join("");

  esgNarrative.innerHTML = `
    <p><strong>Environmental:</strong> ${data.greenArea.toFixed(1)} m² 活体绿墙、${data.waterSaved} L 节水估算、Plant Pod 替换记录可追踪。</p>
    <p><strong>Social:</strong> 覆盖约 ${data.wellnessReach} 名员工/访客触点，用健康分和维护响应证明空间体验稳定。</p>
    <p><strong>Governance:</strong> 每次维护有照片、工单、AI 诊断和复查记录，可作为 FM 供应商服务质量审计材料。</p>
  `;
}

function podClass(index, wall) {
  if (wall.renewalRisk === "high" && index % 7 === 0) return "pod risk";
  if (wall.renewalRisk !== "low" && index % 5 === 0) return "pod low";
  return "pod";
}

function renderPortfolio() {
  const walls = portfolio.filter((wall) => {
    if (state.activeFilter === "at-risk") return wall.renewalRisk !== "low";
    if (state.activeFilter === "smart") return wall.version === "Smart";
    return true;
  });

  wallGrid.innerHTML = walls.map((wall) => `
    <article class="wall-card">
      <div class="item-row">
        <div>
          <strong>${wall.client}</strong>
          <span>${wall.site}</span>
        </div>
        <span class="tag ${wall.renewalRisk === "high" ? "danger" : wall.renewalRisk === "medium" ? "warn" : ""}">${wall.version}</span>
      </div>
      <div class="wall-visual" aria-label="${wall.client} wall health map">
        ${Array.from({ length: 27 }, (_, index) => `<span class="${podClass(index, wall)}"></span>`).join("")}
      </div>
      <div class="wall-meta">
        <div><span>健康</span><strong>${wall.health}</strong></div>
        <div><span>Pod</span><strong>${wall.pods}</strong></div>
        <div><span>下次</span><strong>${wall.nextVisit}</strong></div>
      </div>
      <span>${wall.plan} · ${wall.tags.join(" / ")}</span>
    </article>
  `).join("");
}

function renderWorkorders() {
  workorderList.innerHTML = workorders.map((order) => `
    <div class="workorder-item">
      <div class="item-row">
        <strong>${order.id} · ${order.type}</strong>
        <span class="tag ${order.priority === "high" ? "danger" : order.priority === "medium" ? "warn" : ""}">${order.status}</span>
      </div>
      <span>${order.site}</span>
      <small>${order.due} · ${order.tasks}</small>
    </div>
  `).join("");

  diagnosisList.innerHTML = diagnoses.map((item) => `
    <div class="diagnosis-item">
      <div class="item-row">
        <strong>${item.wall}</strong>
        <span class="tag">${item.confidence}%</span>
      </div>
      <span>${item.finding}</span>
      <small>${item.action}</small>
    </div>
  `).join("");
}

function renderReport() {
  const data = metrics();
  reportMetrics.innerHTML = [
    ["健康分", `${data.health}`],
    ["维护响应", `${data.visits} 次`],
    ["绿色面积", `${data.greenArea.toFixed(1)} m²`],
    ["节水估算", `${data.waterSaved} L`]
  ].map(([label, value]) => `
    <div class="report-metric">
      <span>${label}</span>
      <strong>${value}</strong>
    </div>
  `).join("");
}

function renderAll() {
  renderOverview();
  renderEsg();
  renderPortfolio();
  renderWorkorders();
  renderReport();
}

simulateVisitBtn.addEventListener("click", () => {
  state.simulatedVisits += 1;
  syncStatus.textContent = `刚刚完成 ${state.simulatedVisits} 次巡检同步`;
  renderAll();
});

generateReportBtn.addEventListener("click", () => {
  state.reportGenerated = true;
  reportStatus.textContent = "ESG 月报已生成";
  reportStatus.classList.add("good");
  reportSummary.textContent = "已生成客户可读版本：包含绿色墙面面积、维护响应、健康趋势、节水估算、员工触达和治理审计记录。";
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.activeFilter = button.dataset.filter || "all";
    filterButtons.forEach((item) => item.classList.toggle("active", item === button));
    renderPortfolio();
  });
});

renderAll();
