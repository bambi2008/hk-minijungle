import { createServer } from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { buildKnowledgeGraphView, flattenKnowledgeGraph, knowledgeGraph } from "./knowledge-graph.mjs";

const root = process.cwd();
const portArgIndex = process.argv.indexOf("--port");
const cliPort = portArgIndex >= 0 ? process.argv[portArgIndex + 1] : null;
const port = Number(cliPort || process.env.PORT || 8004);
const host = "127.0.0.1";
const dataDir = process.env.GROW_CLINIC_DATA_DIR
  ? normalize(process.env.GROW_CLINIC_DATA_DIR)
  : join(root, "data");
const dbPath = join(dataDir, "diagnosis-reports.json");
const notificationPath = join(dataDir, "notification-jobs.json");
const sqlitePath = join(dataDir, "grow-clinic.sqlite");
const openAiEndpoint = "https://api.openai.com/v1/responses";
const defaultVisionModel = "gpt-4.1-mini";
let sqliteDb = null;
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8"
};

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const text = Buffer.concat(chunks).toString("utf8");
  return text ? JSON.parse(text) : {};
}

async function readLegacyJson(path, fallback = []) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch {
    return fallback;
  }
}

async function readEnvValue(name) {
  if (process.env[name]) return process.env[name];

  for (const fileName of [".env.local", ".env"]) {
    try {
      const text = await readFile(join(root, fileName), "utf8");
      const line = text.split(/\r?\n/).find((item) => item.trim().startsWith(`${name}=`));
      if (!line) continue;
      const raw = line.slice(line.indexOf("=") + 1).trim();
      return raw.replace(/^['"]|['"]$/g, "");
    } catch {
      // Env files are optional; absence should fall back to local diagnosis.
    }
  }

  return "";
}

async function getDb() {
  await mkdir(dataDir, { recursive: true });
  if (sqliteDb) return sqliteDb;

  sqliteDb = new DatabaseSync(sqlitePath);
  sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      crop_key TEXT,
      medium_key TEXT,
      stage_key TEXT,
      top_risk TEXT,
      severity TEXT,
      payload_json TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_reports_crop ON reports(crop_key);
    CREATE INDEX IF NOT EXISTS idx_reports_medium ON reports(medium_key);
    CREATE INDEX IF NOT EXISTS idx_reports_created ON reports(created_at);

    CREATE TABLE IF NOT EXISTS notification_jobs (
      id TEXT PRIMARY KEY,
      report_id TEXT,
      reminder_key TEXT,
      due_at TEXT,
      status TEXT,
      channels_json TEXT,
      message TEXT,
      payload_json TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_notifications_due ON notification_jobs(due_at);
    CREATE INDEX IF NOT EXISTS idx_notifications_status ON notification_jobs(status);
  `);

  await migrateLegacyJson();
  return sqliteDb;
}

async function migrateLegacyJson() {
  const reportCount = sqliteDb.prepare("SELECT COUNT(*) AS count FROM reports").get().count;
  if (reportCount === 0) {
    const reports = await readLegacyJson(dbPath);
    const insert = sqliteDb.prepare(`
      INSERT OR IGNORE INTO reports
      (id, created_at, crop_key, medium_key, stage_key, top_risk, severity, payload_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    reports.forEach((report) => {
      const id = report.id || randomUUID();
      const createdAt = report.createdAt || new Date().toISOString();
      const payload = { ...report, id, createdAt };
      insert.run(
        id,
        createdAt,
        payload.cropKey || null,
        payload.mediumKey || null,
        payload.stageKey || null,
        payload.topRisk || null,
        payload.severity || null,
        JSON.stringify(payload)
      );
    });
  }

  const notificationCount = sqliteDb.prepare("SELECT COUNT(*) AS count FROM notification_jobs").get().count;
  if (notificationCount === 0) {
    const jobs = await readLegacyJson(notificationPath);
    const insert = sqliteDb.prepare(`
      INSERT OR IGNORE INTO notification_jobs
      (id, report_id, reminder_key, due_at, status, channels_json, message, payload_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    jobs.forEach((job) => {
      const id = job.id || randomUUID();
      const payload = { ...job, id };
      insert.run(
        id,
        payload.reportId || null,
        payload.reminderKey || null,
        payload.dueAt || null,
        payload.status || "scheduled",
        JSON.stringify(payload.channels || []),
        payload.message || "",
        JSON.stringify(payload)
      );
    });
  }
}

async function readReports() {
  const db = await getDb();
  return db.prepare("SELECT payload_json FROM reports ORDER BY created_at ASC")
    .all()
    .map((row) => JSON.parse(row.payload_json));
}

function fallbackCaseId(report) {
  return `case-${report.cropKey || "crop"}-${report.deviceKey || "device"}-${report.mediumKey || "medium"}`;
}

function caseName(report) {
  return report.caseName || report.plantCaseName || `${report.crop || report.cropKey || "Plant"} / ${report.device || report.medium || "Indoor case"}`;
}

function severityScore(severity) {
  const text = String(severity || "").toLowerCase();
  if (text.includes("high") || text.includes("高")) return 3;
  if (text.includes("medium") || text.includes("中")) return 2;
  if (text.includes("low") || text.includes("低") || text.includes("观察")) return 1;
  return 2;
}

function reportOpenFollowups(report) {
  return report.reminderPlan?.items?.filter((item) => !item.completedAt).length || 0;
}

function reportLogSignal(report) {
  const logs = Array.isArray(report.logs) ? report.logs.slice(-3) : [];
  const values = logs.flatMap((log) => [log.leaf, log.flower, log.pest]);
  const better = values.filter((item) => item === "better").length;
  const worse = values.filter((item) => item === "worse").length;
  return { better, worse, balance: better - worse };
}

function finiteMetric(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function reportColorSignals(report) {
  const logs = Array.isArray(report.logs) ? report.logs : [];
  const latestLogSignals = logs.slice().reverse().find((log) => log?.autoSignals)?.autoSignals || {};
  const signals = report.photoQuality?.signals || latestLogSignals;
  return {
    greenRatio: finiteMetric(signals.greenRatio),
    yellowRatio: finiteMetric(signals.yellowRatio),
    darkRatio: finiteMetric(signals.darkRatio),
    brightness: finiteMetric(signals.brightness),
    contrast: finiteMetric(signals.contrast)
  };
}

function reportLatestProgress(report) {
  const logs = Array.isArray(report.logs) ? report.logs : [];
  const latest = logs[logs.length - 1] || {};
  return {
    leaf: latest.leaf || "unknown",
    flower: latest.flower || "unknown",
    pest: latest.pest || "unknown",
    note: latest.notes || ""
  };
}

function reportRouteAssessment(report) {
  if (report.routeAssessment) return report.routeAssessment;
  const logs = Array.isArray(report.logs) ? report.logs : [];
  return logs.slice().reverse().find((log) => log?.routeAssessment)?.routeAssessment || null;
}

function reportTrendPoint(report) {
  const confidenceRaw = report.photoQuality?.confidence;
  const confidence = Number.isFinite(Number(confidenceRaw)) ? Math.max(0, Math.min(100, Number(confidenceRaw))) : 50;
  const openFollowups = reportOpenFollowups(report);
  const signal = reportLogSignal(report);
  const riskScore = Math.round(
    severityScore(report.severity) * 28
    + openFollowups * 4
    - confidence * 0.12
    + signal.worse * 8
    - signal.better * 6
  );

  return {
    riskScore,
    openFollowups,
    logSignal: signal.balance,
    betterCount: signal.better,
    worseCount: signal.worse,
    colorSignals: reportColorSignals(report),
    progress: reportLatestProgress(report)
  };
}

function trendReminderPhoto(latest) {
  const text = `${latest?.topRisk || ""} ${latest?.next || ""}`;
  if (text.includes("虫") || text.includes("飞虫") || text.includes("叶背")) return "叶背、嫩梢、黄粘板";
  if (text.includes("藻") || text.includes("霉") || text.includes("根") || text.includes("Xponge")) return "根区和基质表面";
  if (text.includes("花") || text.includes("果") || text.includes("授粉")) return "同一花序和小果";
  if (text.includes("光") || text.includes("徒长") || text.includes("节间")) return "整株侧面和顶部新叶";
  return "整株、叶片特写、根区";
}

function trendReminderFor(trend, latest) {
  const anchor = Date.parse(latest?.createdAt) || Date.now();
  const photo = trendReminderPhoto(latest);
  const configs = {
    empty: {
      priority: "none",
      key: "baseline",
      label: "先建档",
      offsetHours: 0,
      task: "保存第一份诊断报告，建立植物病例基线。",
      reason: "没有病例记录时不能安排趋势复查。"
    },
    baseline: {
      priority: "normal",
      key: "48h",
      label: "48 小时",
      offsetHours: 48,
      task: "按处方执行后拍同角度照片，建立第一次趋势对比。",
      reason: "只有一次诊断时，48 小时复查能最快验证方向。"
    },
    worsening: {
      priority: "urgent",
      key: "24h",
      label: "24 小时",
      offsetHours: 24,
      task: "暂停叠加新动作，补拍最高风险对应部位并重新诊断。",
      reason: "趋势恶化时需要提前复查，避免继续执行错误处方。"
    },
    improving: {
      priority: "low",
      key: "day7",
      label: "第 7 天",
      offsetHours: 7 * 24,
      task: "保持当前处方，到第 7 天确认改善是否稳定。",
      reason: "趋势改善时延长复查间隔，减少客户被频繁打扰。"
    },
    stable: {
      priority: "normal",
      key: "day3",
      label: "第 3 天",
      offsetHours: 3 * 24,
      task: "继续同角度复拍，判断是否进入改善或恶化。",
      reason: "变化不明显时，第 3 天复查比固定 7 天更能及时发现偏差。"
    },
    uncertain: {
      priority: "high",
      key: "48h",
      label: "48 小时",
      offsetHours: 48,
      task: "补拍系统缺失的关键照片，并确认处方动作是否完成。",
      reason: "趋势不确定通常来自证据不足或动作未闭环。"
    }
  };
  const config = configs[trend.state] || configs.uncertain;
  const dueAt = config.offsetHours ? new Date(anchor + config.offsetHours * 60 * 60 * 1000).toISOString() : null;
  return {
    priority: config.priority,
    key: config.key,
    label: config.label,
    dueAt,
    task: config.task,
    photo,
    reason: config.reason
  };
}

function withTrendReminder(timeline, trend) {
  return {
    ...trend,
    reminder: trendReminderFor(trend, timeline[timeline.length - 1] || null)
  };
}

function caseTrend(timeline) {
  if (!timeline.length) {
    return withTrendReminder(timeline, {
      state: "empty",
      label: "暂无趋势",
      summary: "还没有诊断记录，无法判断趋势。",
      next: "先保存第一份诊断报告。",
      scoreDelta: 0,
      confidenceDelta: 0,
      evidence: ["无诊断记录"]
    });
  }

  const latest = timeline[timeline.length - 1];
  const previous = timeline[timeline.length - 2] || null;
  if (!previous) {
    return withTrendReminder(timeline, {
      state: "baseline",
      label: "建立基线",
      summary: "当前只有一次诊断，系统已建立基线，下一次复查后才能判断走势。",
      next: "按处方执行，并在提醒时间上传同角度复查照片。",
      scoreDelta: 0,
      confidenceDelta: 0,
      evidence: [
        `当前风险分 ${latest.riskScore}`,
        `当前可信度 ${latest.confidence ?? "-"}%`,
        `待复查 ${latest.openFollowups || 0} 项`
      ]
    });
  }

  const scoreDelta = previous.riskScore - latest.riskScore;
  const first = timeline[0];
  const sinceFirstDelta = first.riskScore - latest.riskScore;
  const confidenceDelta = (latest.confidence ?? 0) - (previous.confidence ?? 0);
  const evidence = [
    `风险分 ${previous.riskScore} → ${latest.riskScore}`,
    `可信度变化 ${confidenceDelta >= 0 ? "+" : ""}${confidenceDelta}%`,
    `复查信号 改善 ${latest.betterCount || 0} / 变差 ${latest.worseCount || 0}`,
    `累计变化 ${sinceFirstDelta >= 0 ? "+" : ""}${sinceFirstDelta}`
  ];

  if (latest.worseCount >= 2 || scoreDelta <= -8) {
    return withTrendReminder(timeline, {
      state: "worsening",
      label: "正在恶化",
      summary: "最近一次记录显示风险分上升或复查变差信号较多，应暂停叠加新动作。",
      next: "回到最高风险原因，补拍对应部位，并重新生成处方。",
      scoreDelta,
      confidenceDelta,
      evidence
    });
  }

  if (latest.betterCount >= 2 || scoreDelta >= 8) {
    return withTrendReminder(timeline, {
      state: "improving",
      label: "正在改善",
      summary: "最近一次记录显示风险分下降或复查改善信号明确，当前处方方向有效。",
      next: "保持当前处方，不要频繁改参数，按下一提醒节点复拍。",
      scoreDelta,
      confidenceDelta,
      evidence
    });
  }

  if (Math.abs(scoreDelta) < 8 && Math.abs(confidenceDelta) < 12) {
    return withTrendReminder(timeline, {
      state: "stable",
      label: "变化不明显",
      summary: "最近两次记录变化不大，需要继续用同角度照片确认趋势。",
      next: "保留当前动作，等待下一个 48h/3d/7d 复查点。",
      scoreDelta,
      confidenceDelta,
      evidence
    });
  }

  return withTrendReminder(timeline, {
    state: "uncertain",
    label: "趋势不确定",
    summary: "风险分和可信度变化方向不一致，当前证据不足以判断好转或恶化。",
    next: "补拍系统建议的关键照片，并确认是否已完成上次处方动作。",
    scoreDelta,
    confidenceDelta,
    evidence
  });
}

function groupReportsByCase(reports) {
  const cases = new Map();
  reports.forEach((report) => {
    const id = report.caseId || report.plantCaseId || fallbackCaseId(report);
    if (!cases.has(id)) {
      cases.set(id, {
        id,
        name: caseName(report),
        crop: report.crop,
        cropKey: report.cropKey,
        device: report.device,
        deviceKey: report.deviceKey,
        medium: report.medium,
        mediumKey: report.mediumKey,
        createdAt: report.createdAt,
        updatedAt: report.createdAt,
        reportCount: 0,
        latestRisk: "",
        latestSeverity: "",
        latestConfidence: null,
        latestDecision: null,
        pendingFollowups: 0,
        reports: []
      });
    }

    const target = cases.get(id);
    target.reportCount += 1;
    target.updatedAt = report.createdAt > target.updatedAt ? report.createdAt : target.updatedAt;
    target.latestRisk = report.topRisk || target.latestRisk;
    target.latestSeverity = report.severity || target.latestSeverity;
    target.latestConfidence = report.photoQuality?.confidence ?? target.latestConfidence;
    target.latestDecision = report.photoQuality?.decision?.status || target.latestDecision;
    target.pendingFollowups += reportOpenFollowups(report);
    target.reports.push(report);
  });

  return Array.from(cases.values())
    .map((item) => {
      const timeline = item.reports
        .slice()
        .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt))
        .map((report) => ({
          id: report.id,
          eventType: report.eventType || "diagnosis",
          followupLogId: report.followupLogId || null,
          followupSource: report.followupSource || null,
          createdAt: report.createdAt,
          topRisk: report.topRisk,
          severity: report.severity,
          confidence: report.photoQuality?.confidence ?? null,
          decision: report.photoQuality?.decision?.status || null,
          next: report.photoQuality?.decision?.next || null,
          routeAssessment: reportRouteAssessment(report),
          followupCount: report.reminderPlan?.items?.length || 0,
          ...reportTrendPoint(report)
        }));

      return {
        ...item,
        timeline,
        trend: caseTrend(timeline)
      };
    })
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
}

async function writeReports(reports) {
  const db = await getDb();
  const insert = db.prepare(`
    INSERT OR REPLACE INTO reports
    (id, created_at, crop_key, medium_key, stage_key, top_risk, severity, payload_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  db.exec("DELETE FROM reports");
  reports.forEach((report) => {
    const id = report.id || randomUUID();
    const createdAt = report.createdAt || new Date().toISOString();
    const payload = { ...report, id, createdAt };
    insert.run(
      id,
      createdAt,
      payload.cropKey || null,
      payload.mediumKey || null,
      payload.stageKey || null,
      payload.topRisk || null,
      payload.severity || null,
      JSON.stringify(payload)
    );
  });
  await writeFile(dbPath, JSON.stringify(reports, null, 2), "utf8");
}

async function readNotificationJobs() {
  const db = await getDb();
  return db.prepare("SELECT payload_json FROM notification_jobs ORDER BY due_at ASC")
    .all()
    .map((row) => JSON.parse(row.payload_json));
}

async function writeNotificationJobs(jobs) {
  const db = await getDb();
  const insert = db.prepare(`
    INSERT OR REPLACE INTO notification_jobs
    (id, report_id, reminder_key, due_at, status, channels_json, message, payload_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  db.exec("DELETE FROM notification_jobs");
  jobs.forEach((job) => {
    const id = job.id || randomUUID();
    const payload = { ...job, id };
    insert.run(
      id,
      payload.reportId || null,
      payload.reminderKey || null,
      payload.dueAt || null,
      payload.status || "scheduled",
      JSON.stringify(payload.channels || []),
      payload.message || "",
      JSON.stringify(payload)
    );
  });
  await writeFile(notificationPath, JSON.stringify(jobs, null, 2), "utf8");
}

function sendJson(res, status, payload) {
  res.writeHead(status, { "content-type": types[".json"] });
  res.end(JSON.stringify(payload, null, 2));
}

function topCounts(items, keyGetter, limit = 5) {
  const counts = new Map();
  items.forEach((item) => {
    const key = keyGetter(item);
    if (!key) return;
    counts.set(key, (counts.get(key) || 0) + 1);
  });
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([label, count]) => ({ label, count }));
}

function numberStats(values) {
  const clean = values.filter((value) => Number.isFinite(value));
  if (!clean.length) return null;
  const sum = clean.reduce((total, value) => total + value, 0);
  return {
    min: Math.min(...clean),
    max: Math.max(...clean),
    avg: sum / clean.length
  };
}

function includesAny(text, needles) {
  return needles.some((needle) => text.includes(needle));
}

const competitorBenchmarks = [
  {
    name: "PictureThis",
    score: 76,
    role: "视觉诊断入口",
    strengths: [
      "拍照后快速完成植物识别、病害诊断和治疗建议",
      "用置信度、症状标签和步骤化建议降低用户判断成本",
      "把用户的植物沉淀成 My Plants/护理提醒资产"
    ],
    limits: [
      "建议偏泛植物护理，对室内水培和结果型作物阶段理解不足",
      "不直接连接灯、水泵、营养液、pH/EC 和复查任务",
      "对番茄、草莓、辣椒的授粉/坐果问题不够专门"
    ],
    takeaways: [
      "首屏坚持照片优先，用户只需要说一个大概困扰",
      "每次诊断必须输出置信度、缺失照片和下一张该拍什么",
      "把照片、症状、处方和复查结果沉淀成可训练数据"
    ]
  },
  {
    name: "Gardyn",
    score: 78,
    role: "作物旅程和任务系统",
    strengths: [
      "通过摄像头、传感器、App 档案和 Kelby 助手做持续监测",
      "按作物生命周期自动优化灯光和浇水节奏",
      "把用户可执行动作变成 just-in-time 任务和提醒"
    ],
    limits: [
      "强依赖封闭硬件、订阅和专用种植仓，成本高",
      "对非 Gardyn 设备、阳台、公司、Xponge 等开放场景支持弱",
      "用户仍会质疑 AI 是否真正理解单株水质、营养和健康状态"
    ],
    takeaways: [
      "我们要做设备无关的作物旅程，而不是封闭种植柜",
      "复查时间跟随处方动作自动生成，不用固定机械提醒",
      "把开花、坐果、采收、修剪、根区检查变成阶段任务"
    ]
  },
  {
    name: "LetPot",
    score: 74,
    role: "低门槛设备自动化",
    strengths: [
      "App 可控 LED 日程、水泵/浇水提醒和种植日记",
      "价格和台面体验更接近大众用户，适合香草和叶菜入门",
      "把硬件操作简化为少数日常维护动作"
    ],
    limits: [
      "核心仍是控灯控水，不是真正解释黄叶、不结果、烂根和虫害",
      "对果菜类需要的授粉、营养阶段和环境压力判断较弱",
      "很少把失败案例回流成诊断模型"
    ],
    takeaways: [
      "我们应兼容 LetPot/iDOO/AeroGarden/DIY/Xponge，而不是只做自家设备",
      "把设备动作翻译成处方：调灯距、换水、遮光、补水、通风",
      "种植日记要自动从照片和复查生成，减少用户手填"
    ]
  }
];

function buildProductStrategy(reports) {
  const evidenceText = reports.map((report) => [
    report.topRisk,
    report.report,
    report.notes,
    ...(report.symptoms || []),
    ...(report.visuals || []),
    ...(report.customerActions || [])
  ].filter(Boolean).join(" ")).join("\n");

  const evidenceCount = (keywords) =>
    reports.filter((report) => {
      const text = [
        report.topRisk,
        report.report,
        report.notes,
        ...(report.symptoms || []),
        ...(report.visuals || []),
        ...(report.customerActions || [])
      ].filter(Boolean).join(" ");
      return includesAny(text, keywords);
    }).length;

  const modules = [
    {
      title: "PictureThis 层：照片优先的症状识别",
      currentScore: 64,
      targetScore: 86,
      evidence: evidenceCount(["yellow", "黄", "斑", "虫", "algae", "photo", "照片"]),
      currentAssets: ["照片类型", "照片质量", "颜色信号", "缺失照片提示", "视觉接口占位"],
      nextOptimizations: [
        "接入真实视觉模型识别照片类型、黄叶、卷叶、斑点、虫害、藻霉",
        "每个结论显示置信度和证据照片，而不是只给文本判断",
        "把失败/复查照片作为轻量标注数据沉淀"
      ]
    },
    {
      title: "Gardyn 层：作物阶段和处方复查",
      currentScore: 72,
      targetScore: 90,
      evidence: evidenceCount(["flower", "fruit", "开花", "结果", "复查", "授粉", "修剪"]),
      currentAssets: ["五类作物知识图谱", "处方任务", "动态复查时间", "后台提醒任务"],
      nextOptimizations: [
        "把五类作物拆成独立诊断路径和阶段阈值",
        "用户完成处方动作后重新计算复查时间",
        "给复查照片做前后对比，自动判断改善/加重/无变化"
      ]
    },
    {
      title: "LetPot 层：设备动作和低操作日记",
      currentScore: 58,
      targetScore: 82,
      evidence: evidenceCount(["light", "water", "灯", "水", "pH", "EC", "Xponge", "reservoir"]),
      currentAssets: ["灯光/湿度/温湿度/EC/pH 输入", "SQLite 报告库", "通知任务接口"],
      nextOptimizations: [
        "建立常见设备模板：LetPot、iDOO、AeroGarden、Click & Grow、Xponge DIY",
        "把设备动作转换成一键处方：调灯、换水、遮光、补水、通风",
        "让日记由照片、处方完成状态和提醒结果自动生成"
      ]
    },
    {
      title: "hk minijungle 差异层：五类可食用作物专家",
      currentScore: 69,
      targetScore: 92,
      evidence: evidenceCount(["tomato", "basil", "rosemary", "strawberry", "pepper", "番茄", "罗勒", "迷迭香", "草莓", "辣椒"]),
      currentAssets: ["矮生番茄", "罗勒", "迷迭香", "草莓", "辣椒", "Xponge 参数"],
      nextOptimizations: [
        "优先做开花不结果、黄叶、过湿根区、虫害四个高频问题闭环",
        "限制品种范围，降低误诊和客户操作负担",
        "围绕 Xponge 超薄根区建立独有数据资产"
      ]
    }
  ];

  const roadmap = modules
    .map((module) => ({
      module: module.title,
      priorityScore: module.targetScore - module.currentScore + Math.min(18, module.evidence * 3),
      why: module.evidence
        ? `已有 ${module.evidence} 条报告/信号可作为优化证据。`
        : "当前样本少，但属于核心能力缺口。",
      nextStep: module.nextOptimizations[0]
    }))
    .sort((a, b) => b.priorityScore - a.priorityScore);

  return {
    positioning: "结合 PictureThis 的拍照诊断、Gardyn 的阶段任务、LetPot 的设备自动化，做一个面向五类室内可食用作物的诊断处方系统。",
    moat: [
      "聚焦五类作物和室内/阳台/办公室/Xponge 场景，避免泛植物 App 的宽而浅",
      "每次诊断都进入处方和复查闭环，避免只给一次性建议",
      "照片、设备参数、处方动作、复查结果形成可迭代数据库"
    ],
    competitorBenchmarks,
    modules,
    roadmap,
    reportSignals: {
      totalReports: reports.length,
      hasEvidenceText: Boolean(evidenceText.trim())
    }
  };
}

function buildOpportunities(reports) {
  const rules = [
    {
      title: "补光处方与灯距校准",
      category: "功能",
      keywords: ["光照", "徒长", "不开花"],
      solution: "把光照时长、灯距、作物阶段转成可执行处方，并提供第 7 天株型复查模板。"
    },
    {
      title: "Xponge 边缘干缩与储液缓冲套件",
      category: "产品/结构",
      keywords: ["水分波动", "Xponge", "根毯面积"],
      solution: "围绕薄层根区设计储液、毛细补水、遮光盖和边缘干湿监测。"
    },
    {
      title: "藻霉遮光与表面管理包",
      category: "耗材",
      keywords: ["藻霉", "过湿", "表面发绿", "白毛"],
      solution: "提供遮光片、表面干湿卡、清洁流程和 48 小时复查提醒。"
    },
    {
      title: "室内番茄授粉教练",
      category: "功能/配件",
      keywords: ["授粉", "不结果", "落花", "结果期"],
      solution: "结合花序照片、风扇/震花提醒和坐果记录，降低开花不结果的挫败感。"
    },
    {
      title: "虫害快速隔离与复查包",
      category: "耗材/服务",
      keywords: ["虫害", "红蜘蛛", "小飞虫", "菌蚊"],
      solution: "把黄粘板、叶背拍照、BTI/安全喷剂和 24 小时复查做成一套流程。"
    },
    {
      title: "EC/pH 新手安全修正模式",
      category: "功能",
      keywords: ["EC", "pH", "营养液"],
      solution: "用小步调整和复测提醒替代一次性猛调，减少结果期翻车。"
    }
  ];

  const corpus = reports.map((report) => [
    report.topRisk,
    report.report,
    report.notes,
    ...(report.visuals || []),
    ...(report.symptoms || [])
  ].filter(Boolean).join(" ")).join("\n");

  return rules.map((rule) => {
    const evidence = reports.filter((report) => {
      const text = [
        report.topRisk,
        report.report,
        report.notes,
        ...(report.visuals || []),
        ...(report.symptoms || [])
      ].filter(Boolean).join(" ");
      return includesAny(text, rule.keywords);
    }).length;
    const score = evidence * 18 + (includesAny(corpus, rule.keywords) ? 12 : 0);
    return {
      ...rule,
      evidence,
      score,
      priority: score >= 70 ? "高" : score >= 35 ? "中" : "观察"
    };
  }).sort((a, b) => b.score - a.score);
}

function buildExperiments(reports) {
  const opportunities = buildOpportunities(reports).slice(0, 5);
  return opportunities.map((item, index) => {
    const common = {
      id: `exp-${index + 1}`,
      opportunity: item.title,
      priority: item.priority,
      evidence: item.evidence,
      sampleSize: item.evidence >= 10 ? "20-30 份同类诊断" : "10-15 份同类诊断",
      duration: item.priority === "高" ? "7-14 天" : "14-21 天"
    };

    if (item.title.includes("补光")) {
      return {
        ...common,
        hypothesis: "如果把灯距和光照时长转成阶段处方，徒长和不开花报告会下降。",
        mvp: "给番茄/Xponge 用户提供灯距、光照小时和第 7 天株型复查任务。",
        successMetric: "7 天后节间变短或新叶变厚的用户占比 >= 60%。"
      };
    }

    if (item.title.includes("边缘干缩")) {
      return {
        ...common,
        hypothesis: "如果增加储液缓冲和边缘补水策略，Xponge 边缘干缩会明显减少。",
        mvp: "测试 2L、3L、5L 储液量与 30x40cm 根毯的干湿稳定性。",
        successMetric: "48 小时内边缘干缩范围减少 >= 30%，且无过湿藻霉上升。"
      };
    }

    if (item.title.includes("藻霉")) {
      return {
        ...common,
        hypothesis: "如果加入遮光盖和 48 小时复查，表面发绿/白毛会下降。",
        mvp: "提供三种遮光材料，对比藻斑扩散速度和用户观感评分。",
        successMetric: "藻斑扩散停止或下降的样本占比 >= 70%。"
      };
    }

    if (item.title.includes("授粉")) {
      return {
        ...common,
        hypothesis: "如果把授粉动作变成每日提醒和花序记录，坐果率会提高。",
        mvp: "每天中午震花提醒 + 花序照片模板 + 小果保留数记录。",
        successMetric: "5-7 天内小果保留数提升，落花反馈下降 >= 40%。"
      };
    }

    if (item.title.includes("虫害")) {
      return {
        ...common,
        hypothesis: "如果用户在虫害早期进入隔离和复查流程，扩散率会下降。",
        mvp: "叶背拍照、黄粘板记录、24 小时复查和安全处理步骤。",
        successMetric: "24-48 小时后虫量不再上升的样本占比 >= 70%。"
      };
    }

    return {
      ...common,
      hypothesis: "如果把复杂参数转成小步修正流程，用户翻车率会下降。",
      mvp: "提供参数复测、小步调整和 24 小时后复查任务。",
      successMetric: "用户在 7 天内无新增严重症状，且能完成至少 2 次复查。"
    };
  });
}

const cropModels = {
  tomato: {
    name: "Dwarf tomato",
    allowedScope: ["Micro Tom", "Orange Hat", "Tiny Tim", "Red Robin"],
    primaryRisks: ["low light", "poor pollination", "water swing", "heat stress"],
    requiredPhotos: ["plant", "leaf", "root", "flower"],
    followup: ["day3", "day7"]
  },
  basil: {
    name: "Basil",
    allowedScope: ["Genovese basil", "Thai basil", "Greek basil", "compact potted basil"],
    primaryRisks: ["low light", "leggy growth", "missed pruning", "dry air"],
    requiredPhotos: ["plant", "leaf", "root"],
    followup: ["day3", "day7"]
  },
  rosemary: {
    name: "Rosemary",
    allowedScope: ["young potted rosemary", "small rooted cutting"],
    primaryRisks: ["overwatering", "low airflow", "root hypoxia", "low light"],
    requiredPhotos: ["plant", "leaf", "root"],
    followup: ["48h", "day7"]
  },
  strawberry: {
    name: "Strawberry",
    allowedScope: ["day-neutral strawberry", "everbearing strawberry", "compact potted strawberry"],
    primaryRisks: ["poor pollination", "wet crown", "deformed fruit", "fungal spots"],
    requiredPhotos: ["plant", "leaf", "root", "flower"],
    followup: ["day3", "day7"]
  },
  pepper: {
    name: "Compact pepper",
    allowedScope: ["dwarf pepper", "ornamental pepper", "small sweet pepper"],
    primaryRisks: ["flower drop", "heat stress", "low light", "water swing"],
    requiredPhotos: ["plant", "leaf", "root", "flower"],
    followup: ["24h", "day3", "day7"]
  }
};

function localVisionPayload(body) {
  const labels = [];
  const signals = body.signals || {};
  const fileName = String(body.fileName || "").toLowerCase();
  const context = body.context || {};
  const cropModel = cropModels[context.cropKey] || null;

  if (signals.yellowRatio > 0.22 || fileName.includes("yellow")) {
    labels.push({ label: "yellowing", confidence: 0.72 });
  }
  if (signals.greenRatio > 0.36 && body.photoType === "root") {
    labels.push({ label: "surface-algae", confidence: 0.68 });
  }
  if (signals.darkRatio > 0.45) {
    labels.push({ label: "dark-or-dry-area", confidence: 0.58 });
  }
  if (fileName.includes("pest") || fileName.includes("bug") || fileName.includes("fly")) {
    labels.push({ label: "possible-pest", confidence: 0.64 });
  }
  if (fileName.includes("flower") || fileName.includes("fruit")) {
    labels.push({ label: "flower-or-fruit", confidence: 0.7 });
  }

  const observations = labels.map((item) => ({
    code: item.label,
    confidence: item.confidence,
    source: "local-heuristic"
  }));

  const diagnosisHints = [];
  labels.forEach((item) => {
    if (item.label === "yellowing") diagnosisHints.push("yellow-leaves");
    if (item.label === "surface-algae") diagnosisHints.push("algae");
    if (item.label === "possible-pest") diagnosisHints.push("pests");
    if (item.label === "dark-or-dry-area") diagnosisHints.push("water-swing");
    if (item.label === "flower-or-fruit") diagnosisHints.push("flowering-context");
  });

  const suppliedTypes = new Set(body.capturedPhotoTypes || []);
  if (body.photoType) suppliedTypes.add(body.photoType);
  const missingPhotos = (cropModel?.requiredPhotos || ["plant", "leaf", "root"])
    .filter((type) => !suppliedTypes.has(type));

  return {
    provider: "local-heuristic-placeholder",
    readyForAiProvider: true,
    modelInput: {
      cropKey: context.cropKey || null,
      stageKey: context.stageKey || null,
      mediumKey: context.mediumKey || null,
      concern: context.concern || null,
      photoType: body.photoType || "unknown",
      hasImage: Boolean(body.imageData)
    },
    photoType: body.photoType || "unknown",
    labels,
    observations,
    diagnosisHints: Array.from(new Set(diagnosisHints)),
    missingPhotos,
    confidence: labels.length ? Math.min(0.9, 0.45 + labels.length * 0.12) : 0.35,
    quality: {
      brightness: signals.brightness ?? null,
      contrast: signals.contrast ?? null,
      width: signals.width ?? null,
      height: signals.height ?? null
    },
    aiFallbackReason: null,
    aiFallbackDetail: null,
    nextIntegration: "Replace this endpoint with a vision model that detects photo type, yellowing, curling, spots, pests, algae, and before/after changes."
  };
}

function jsonFromModelText(text) {
  if (!text) return null;
  const clean = text.replace(/```json|```/g, "").trim();
  try {
    return JSON.parse(clean);
  } catch {
    const match = clean.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

function outputTextFromResponse(payload) {
  if (payload.output_text) return payload.output_text;
  return (payload.output || [])
    .flatMap((item) => item.content || [])
    .map((item) => item.text || item.output_text || "")
    .filter(Boolean)
    .join("\n");
}

function validChoice(value, choices, fallback) {
  return choices.includes(value) ? value : fallback;
}

function normalizeAiVisionResult(raw, body, local) {
  const photoTypes = ["plant", "leaf", "root", "flower", "pest", "unknown"];
  const cropKeys = ["tomato", "basil", "rosemary", "strawberry", "pepper", "unknown"];
  const stageKeys = ["seedling", "vegetative", "flowering", "fruiting", "unknown"];
  const hintChoices = new Set([
    "yellow-leaves",
    "leggy",
    "wilting",
    "leaf-curl",
    "spots",
    "no-flower",
    "no-fruit",
    "pests",
    "algae",
    "water-swing",
    "flowering-context",
    "root-risk"
  ]);
  const labelChoices = new Set([
    "yellowing",
    "leaf-curl",
    "spots",
    "possible-pest",
    "surface-algae",
    "white-fuzz",
    "leggy-growth",
    "flower-drop",
    "flower-or-fruit",
    "wilting",
    "dry-edge",
    "root-risk",
    "healthy-signal"
  ]);

  const labels = Array.isArray(raw.labels)
    ? raw.labels
      .map((item) => ({
        label: labelChoices.has(item.label) ? item.label : null,
        confidence: Number.isFinite(Number(item.confidence)) ? Math.max(0, Math.min(1, Number(item.confidence))) : 0.5
      }))
      .filter((item) => item.label)
    : [];

  const observations = Array.isArray(raw.observations)
    ? raw.observations.slice(0, 8).map((item) => ({
      code: String(item.code || "visual-observation").slice(0, 80),
      confidence: Number.isFinite(Number(item.confidence)) ? Math.max(0, Math.min(1, Number(item.confidence))) : 0.5,
      source: "openai-vision",
      evidence: String(item.evidence || "").slice(0, 160)
    }))
    : labels.map((item) => ({
      code: item.label,
      confidence: item.confidence,
      source: "openai-vision"
    }));

  const suppliedTypes = new Set(body.capturedPhotoTypes || []);
  const photoType = validChoice(raw.photoType, photoTypes, body.photoType || local.photoType || "unknown");
  if (photoType && photoType !== "unknown") suppliedTypes.add(photoType);
  const cropKey = validChoice(raw.cropKey, cropKeys, body.context?.cropKey || "unknown");
  const cropModel = cropModels[cropKey] || cropModels[body.context?.cropKey] || null;
  const modelMissing = (cropModel?.requiredPhotos || ["plant", "leaf", "root"])
    .filter((type) => !suppliedTypes.has(type));
  const aiMissing = Array.isArray(raw.missingPhotos)
    ? raw.missingPhotos.filter((type) => photoTypes.includes(type) && type !== "unknown")
    : [];

  return {
    provider: "openai-responses",
    model: raw.model || defaultVisionModel,
    readyForAiProvider: true,
    fallbackProvider: local.provider,
    modelInput: {
      ...local.modelInput,
      cropKey,
      stageKey: validChoice(raw.stageKey, stageKeys, body.context?.stageKey || "unknown"),
      photoType,
      hasImage: Boolean(body.imageData)
    },
    photoType,
    cropKey,
    stageKey: validChoice(raw.stageKey, stageKeys, body.context?.stageKey || "unknown"),
    labels,
    observations,
    diagnosisHints: Array.from(new Set([
      ...(Array.isArray(raw.diagnosisHints) ? raw.diagnosisHints.filter((item) => hintChoices.has(item)) : []),
      ...local.diagnosisHints
    ])),
    missingPhotos: Array.from(new Set([...modelMissing, ...aiMissing])),
    confidence: Number.isFinite(Number(raw.confidence))
      ? Math.max(0, Math.min(1, Number(raw.confidence)))
      : labels.length ? Math.min(0.94, 0.52 + labels.length * 0.1) : local.confidence,
    quality: {
      ...local.quality,
      aiBrightness: raw.quality?.brightness || "unknown",
      aiFocus: raw.quality?.focus || "unknown",
      aiFraming: raw.quality?.framing || "unknown"
    },
    nextAction: String(raw.nextAction || "").slice(0, 180),
    localBackup: {
      labels: local.labels,
      diagnosisHints: local.diagnosisHints,
      confidence: local.confidence
    }
  };
}

function visionPrompt(body) {
  const cropKey = body.context?.cropKey || "unknown";
  const cropModel = cropModels[cropKey];
  return [
    "You are an indoor edible crop diagnosis vision adapter for hk minijungle.",
    "Analyze only visible evidence in the photo. Do not invent sensor readings.",
    "Supported crops: tomato, basil, rosemary, strawberry, pepper. If unsure, use unknown.",
    `User context: crop=${cropKey}, stage=${body.context?.stageKey || "unknown"}, medium=${body.context?.mediumKey || "unknown"}, concern=${body.context?.concern || "unknown"}, expectedPhotoType=${body.photoType || "unknown"}.`,
    cropModel ? `Crop model risks: ${cropModel.primaryRisks.join(", ")}. Required photos: ${cropModel.requiredPhotos.join(", ")}.` : "",
    "Return ONLY a JSON object with this shape:",
    JSON.stringify({
      photoType: "plant|leaf|root|flower|pest|unknown",
      cropKey: "tomato|basil|rosemary|strawberry|pepper|unknown",
      stageKey: "seedling|vegetative|flowering|fruiting|unknown",
      labels: [
        {
          label: "yellowing|leaf-curl|spots|possible-pest|surface-algae|white-fuzz|leggy-growth|flower-drop|flower-or-fruit|wilting|dry-edge|root-risk|healthy-signal",
          confidence: 0.0
        }
      ],
      observations: [
        { code: "short-code", confidence: 0.0, evidence: "short visible evidence" }
      ],
      diagnosisHints: ["yellow-leaves|leggy|wilting|leaf-curl|spots|no-flower|no-fruit|pests|algae|water-swing|flowering-context|root-risk"],
      missingPhotos: ["plant|leaf|root|flower|pest"],
      confidence: 0.0,
      quality: { brightness: "good|dark|overexposed|unknown", focus: "good|blurry|unknown", framing: "good|too-close|too-far|unknown" },
      nextAction: "one short Chinese instruction"
    })
  ].filter(Boolean).join("\n");
}

async function analyzeVisionWithOpenAI(body, local) {
  if (!body.imageData || !String(body.imageData).startsWith("data:image/")) {
    local.aiFallbackReason = "no-image-data";
    return null;
  }
  const apiKey = await readEnvValue("OPENAI_API_KEY");
  if (!apiKey) {
    local.aiFallbackReason = "missing-openai-api-key";
    return null;
  }

  const model = await readEnvValue("OPENAI_VISION_MODEL") || defaultVisionModel;
  const response = await fetch(openAiEndpoint, {
    method: "POST",
    headers: {
      "authorization": `Bearer ${apiKey}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: visionPrompt(body) },
            { type: "input_image", image_url: body.imageData }
          ]
        }
      ],
      max_output_tokens: 900
    })
  });

  if (!response.ok) {
    local.aiFallbackReason = `openai-http-${response.status}`;
    try {
      const errorPayload = await response.json();
      local.aiFallbackDetail = String(errorPayload.error?.message || errorPayload.error?.type || "").slice(0, 220);
    } catch {
      local.aiFallbackDetail = "openai-error-body-unavailable";
    }
    return null;
  }
  const payload = await response.json();
  const parsed = jsonFromModelText(outputTextFromResponse(payload));
  if (!parsed) {
    local.aiFallbackReason = "openai-invalid-json";
    return null;
  }
  return normalizeAiVisionResult({ ...parsed, model }, body, local);
}

async function analyzeVisionPayload(body) {
  const local = localVisionPayload(body);
  try {
    const ai = await analyzeVisionWithOpenAI(body, local);
    if (ai?.labels?.length || ai?.observations?.length) return ai;
  } catch {
    // Keep the diagnosis flow usable when network, quota, or model access fails.
    local.aiFallbackReason = "openai-request-failed";
  }
  return local;
}

function compareVisionPayload(body) {
  const before = body.before?.signals || {};
  const after = body.after?.signals || {};
  const deltas = {
    yellowRatio: (after.yellowRatio ?? 0) - (before.yellowRatio ?? 0),
    greenRatio: (after.greenRatio ?? 0) - (before.greenRatio ?? 0),
    darkRatio: (after.darkRatio ?? 0) - (before.darkRatio ?? 0)
  };
  const worseSignals = [
    deltas.yellowRatio > 0.08,
    deltas.darkRatio > 0.08,
    body.context === "root" && deltas.greenRatio > 0.08
  ].filter(Boolean).length;
  const betterSignals = [
    deltas.yellowRatio < -0.08,
    deltas.darkRatio < -0.08,
    body.context === "root" && deltas.greenRatio < -0.08
  ].filter(Boolean).length;

  return {
    provider: "local-heuristic-placeholder",
    readyForAiProvider: true,
    trend: worseSignals > betterSignals ? "worse" : betterSignals > worseSignals ? "improved" : "unchanged",
    deltas,
    nextIntegration: "Replace with image-pair model that compares same-angle follow-up photos."
  };
}

function buildNotificationJobs(reportId, reminderPlan, channels, channelTargets = {}) {
  const requestedChannels = channels?.length ? channels : ["in-app"];
  return (reminderPlan?.items || []).map((item) => {
    const template = notificationTemplate({
      source: "report-reminder",
      caseName: item.caseName || "诊断报告",
      cropKey: item.cropKey || "generic",
      trendState: item.trendState || "scheduled",
      trendLabel: item.trendLabel || "复查提醒",
      reminderKey: item.key,
      reminderLabel: item.label,
      task: item.task,
      photo: item.photo,
      channels: requestedChannels
    });
    return {
      id: randomUUID(),
      reportId,
      reminderKey: item.key,
      dueAt: item.dueAt,
      status: "scheduled",
      channels: requestedChannels,
      channelTargets,
      channelStatuses: channelStatusList(requestedChannels, channelTargets),
      template,
      message: template.channelMessages["in-app"] || `${item.label}: ${item.task}; photo: ${item.photo}`
    };
  });
}

const notificationCropCopy = {
  tomato: { name: "矮生番茄", focus: "授粉、坐果、光照和水分波动" },
  basil: { name: "罗勒", focus: "修剪、徒长和连续采收" },
  rosemary: { name: "迷迭香", focus: "过湿、通风和根区缺氧" },
  strawberry: { name: "草莓", focus: "授粉、冠部潮湿和果形变化" },
  pepper: { name: "辣椒", focus: "落花、坐果、温度和水分波动" },
  generic: { name: "植物", focus: "关键症状和复查照片" }
};

const notificationTrendCopy = {
  worsening: { label: "恶化复查", timing: "提前复查", tone: "先暂停叠加新动作，确认最高风险是否扩大。" },
  improving: { label: "改善确认", timing: "延后复查", tone: "保持当前处方，不要频繁改参数。" },
  stable: { label: "趋势确认", timing: "第 3 天复查", tone: "继续同角度复拍，判断是否进入改善或恶化。" },
  uncertain: { label: "证据补齐", timing: "48 小时复查", tone: "先补齐关键照片，再判断处方是否有效。" },
  baseline: { label: "建立基线", timing: "48 小时复查", tone: "先完成第一次处方动作，再建立趋势对比。" },
  scheduled: { label: "复查提醒", timing: "按计划复查", tone: "按计划完成复查照片和记录。" }
};

function notificationTemplate(input) {
  const crop = notificationCropCopy[input.cropKey] || notificationCropCopy.generic;
  const trend = notificationTrendCopy[input.trendState] || notificationTrendCopy.scheduled;
  const title = `${crop.name}${input.trendLabel ? `｜${input.trendLabel}` : `｜${trend.label}`}`;
  const body = `${input.caseName || crop.name}需要${input.reminderLabel || trend.timing}：${trend.tone}`;
  const action = input.task || `围绕${crop.focus}完成复查。`;
  const photo = input.photo || "整株、叶片特写、根区";
  const template = {
    id: `${input.cropKey || "generic"}-${input.trendState || "scheduled"}-${input.reminderKey || "reminder"}`,
    title,
    body,
    action,
    photo,
    focus: crop.focus,
    channelMessages: {}
  };

  (input.channels?.length ? input.channels : ["in-app"]).forEach((channel) => {
    if (channel === "email") {
      template.channelMessages[channel] = `主题：${title}\n${body}\n动作：${action}\n请拍：${photo}`;
    } else if (channel === "sms") {
      template.channelMessages[channel] = `${crop.name}复查：${action}。拍${photo}。`;
    } else if (channel === "wechat") {
      template.channelMessages[channel] = `${title}\n${body}\n下一步：${action}\n照片：${photo}`;
    } else {
      template.channelMessages[channel] = `${title}：${action}；拍 ${photo}`;
    }
  });

  return template;
}

function channelStatusList(channels, targets = {}, existingStatuses = []) {
  const existingByChannel = new Map(existingStatuses.map((item) => [item.channel, item]));
  return channels.map((channel) => {
    const existing = existingByChannel.get(channel) || {};
    return {
      channel,
      target: targets[channel] || existing.target || "",
      status: existing.status || "queued",
      provider: existing.provider || (channel === "in-app" ? "local-in-app" : "placeholder"),
      lastAttemptAt: existing.lastAttemptAt || null,
      completedAt: existing.completedAt || null,
      note: existing.note || (channel === "in-app" ? "站内通知占位" : "待接入真实发送通道")
    };
  });
}

function completeChannelStatuses(statuses, body) {
  const completedAt = body.completedAt || new Date().toISOString();
  return (statuses || []).map((item) => ({
    ...item,
    status: body.status === "completed" ? "completed" : body.status === "sent" ? "sent" : item.status,
    completedAt: body.status === "completed" ? completedAt : item.completedAt || null,
    lastAttemptAt: body.status === "sent" ? completedAt : item.lastAttemptAt || null
  }));
}

function channelFailureSuggestion(channel) {
  if (channel === "email") {
    return { channel, title: "缺邮箱地址", action: "在通知渠道配置里填写客户邮箱后重试。" };
  }
  if (channel === "sms") {
    return { channel, title: "缺手机号", action: "在通知渠道配置里填写客户手机号后重试。" };
  }
  if (channel === "wechat") {
    return { channel, title: "微信未绑定", action: "填写微信 OpenID 或小程序用户标识后重试。" };
  }
  return { channel, title: "渠道不可用", action: "检查该渠道目标和供应商配置后重试。" };
}

function failedChannelSuggestions(statuses) {
  return (statuses || [])
    .filter((item) => item.status === "failed")
    .map((item) => ({
      ...channelFailureSuggestion(item.channel),
      target: item.target || "",
      note: item.note || ""
    }));
}

function simulateChannelSend(statuses, job, options = {}) {
  const attemptedAt = new Date().toISOString();
  const retryFailedOnly = options.retryFailedOnly === true;
  const channelTargets = options.channelTargets || {};
  return (statuses?.length ? statuses : channelStatusList(job.channels || ["in-app"], job.channelTargets || {}))
    .map((item) => {
      if (retryFailedOnly && item.status !== "failed") return item;
      const target = channelTargets[item.channel] || item.target || job.channelTargets?.[item.channel] || "";
      const hasTarget = item.channel === "in-app" || Boolean(target);
      const sent = hasTarget;
      return {
        ...item,
        target,
        status: sent ? "sent" : "failed",
        lastAttemptAt: attemptedAt,
        completedAt: item.completedAt || null,
        note: sent
          ? `${item.provider || "placeholder"} simulated send ok`
          : channelFailureSuggestion(item.channel).action
      };
    });
}

function notificationStatusFromChannels(statuses) {
  const sent = statuses.filter((item) => item.status === "sent" || item.status === "completed").length;
  const failed = statuses.filter((item) => item.status === "failed").length;
  if (failed && sent) return "partial";
  if (failed && failed === statuses.length) return "failed";
  if (sent && sent === statuses.length) return "sent";
  return "scheduled";
}

function buildCaseTrendNotificationJobs(cases, existingJobs = [], channels, channelTargets = {}) {
  const requestedChannels = channels?.length ? channels : ["in-app"];
  const existingById = new Map(existingJobs.map((job) => [job.id, job]));
  return cases
    .filter((item) => item.trend?.reminder?.dueAt)
    .map((item) => {
      const reminder = item.trend.reminder;
      const latest = item.timeline?.[item.timeline.length - 1] || {};
      const stableDue = Date.parse(reminder.dueAt) || Date.now();
      const id = `case-trend-${item.id}-${reminder.key}-${stableDue}`;
      const existing = existingById.get(id) || {};
      const channelsForJob = requestedChannels;
      const targetsForJob = { ...(existing.channelTargets || {}), ...channelTargets };
      const template = notificationTemplate({
        source: "case-trend",
        caseName: item.name,
        cropKey: item.cropKey || "generic",
        trendState: item.trend.state,
        trendLabel: item.trend.label,
        reminderKey: reminder.key,
        reminderLabel: reminder.label,
        task: reminder.task,
        photo: reminder.photo,
        channels: channelsForJob
      });
      return {
        id,
        source: "case-trend",
        reportId: latest.id || null,
        caseId: item.id,
        caseName: item.name,
        crop: item.crop,
        cropKey: item.cropKey,
        reminderKey: reminder.key,
        dueAt: reminder.dueAt,
        status: existing.status || "scheduled",
        completedAt: existing.completedAt || null,
        channels: channelsForJob,
        channelTargets: targetsForJob,
        channelStatuses: channelStatusList(
          channelsForJob,
          targetsForJob,
          existing.channelStatuses || []
        ),
        priority: reminder.priority,
        trendState: item.trend.state,
        trendLabel: item.trend.label,
        task: reminder.task,
        photo: reminder.photo,
        reason: reminder.reason,
        template,
        message: template.channelMessages["in-app"] || `${item.name}｜${item.trend.label}｜${reminder.label}: ${reminder.task}; photo: ${reminder.photo}`
      };
    });
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://${host}:${port}`);

    if (url.pathname === "/api/insights" && req.method === "GET") {
      const reports = await readReports();
      const xpongeReports = reports.filter((report) => report.mediumKey === "xponge" && report.xponge);
      const xpongeVolumes = numberStats(xpongeReports.map((report) => report.xponge?.volumeLiters));
      const xpongeAreas = numberStats(xpongeReports.map((report) => report.xponge?.area));

      sendJson(res, 200, {
        totalReports: reports.length,
        xpongeReports: xpongeReports.length,
        topRisks: topCounts(reports, (report) => report.topRisk),
        crops: topCounts(reports, (report) => report.crop),
        devices: topCounts(reports, (report) => report.device || report.deviceKey),
        media: topCounts(reports, (report) => report.medium),
        severities: topCounts(reports, (report) => report.severity),
        xponge: {
          volumeLiters: xpongeVolumes,
          area: xpongeAreas
        }
      });
      return;
    }

    if (url.pathname === "/api/opportunities" && req.method === "GET") {
      sendJson(res, 200, buildOpportunities(await readReports()));
      return;
    }

    if (url.pathname === "/api/product-strategy" && req.method === "GET") {
      sendJson(res, 200, buildProductStrategy(await readReports()));
      return;
    }

    if (url.pathname === "/api/experiments" && req.method === "GET") {
      sendJson(res, 200, buildExperiments(await readReports()));
      return;
    }

    if (url.pathname === "/api/crop-models" && req.method === "GET") {
      sendJson(res, 200, cropModels);
      return;
    }

    if (url.pathname === "/api/knowledge-graph" && req.method === "GET") {
      const crop = (url.searchParams.get("crop") || "").trim();
      const stage = (url.searchParams.get("stage") || "").trim();
      const pathways = flattenKnowledgeGraph(knowledgeGraph)
        .filter((item) => (!crop || item.cropKey === crop) && (!stage || item.stage === stage));
      const graphView = buildKnowledgeGraphView(knowledgeGraph);
      sendJson(res, 200, {
        ...knowledgeGraph,
        pathways,
        graph: graphView,
        stats: {
          crops: Object.keys(knowledgeGraph.crops).length,
          pathways: flattenKnowledgeGraph(knowledgeGraph).length,
          visiblePathways: pathways.length,
          nodes: graphView.nodes.length,
          edges: graphView.edges.length
        }
      });
      return;
    }

    if (url.pathname === "/api/storage/status" && req.method === "GET") {
      const db = await getDb();
      const reports = db.prepare("SELECT COUNT(*) AS count FROM reports").get().count;
      const notifications = db.prepare("SELECT COUNT(*) AS count FROM notification_jobs").get().count;
      const cases = groupReportsByCase(await readReports()).length;
      sendJson(res, 200, {
        engine: "sqlite",
        sqlitePath,
        legacyJsonBackups: [dbPath, notificationPath],
        counts: { reports, notifications, cases }
      });
      return;
    }

    if (url.pathname === "/api/vision/analyze" && req.method === "POST") {
      sendJson(res, 200, await analyzeVisionPayload(await readJsonBody(req)));
      return;
    }

    if (url.pathname === "/api/vision/compare" && req.method === "POST") {
      sendJson(res, 200, compareVisionPayload(await readJsonBody(req)));
      return;
    }

    if (url.pathname === "/api/notifications" && req.method === "GET") {
      sendJson(res, 200, (await readNotificationJobs()).slice().reverse());
      return;
    }

    if (url.pathname === "/api/notifications/due" && req.method === "GET") {
      const now = Date.now();
      const due = (await readNotificationJobs())
        .filter((job) => job.status === "scheduled" && Date.parse(job.dueAt) <= now)
        .sort((a, b) => Date.parse(a.dueAt) - Date.parse(b.dueAt));
      sendJson(res, 200, due);
      return;
    }

    if (url.pathname === "/api/notifications/schedule" && req.method === "POST") {
      const body = await readJsonBody(req);
      const jobs = await readNotificationJobs();
      const created = buildNotificationJobs(body.reportId, body.reminderPlan, body.channels, body.channelTargets);
      jobs.push(...created);
      await writeNotificationJobs(jobs);
      sendJson(res, 201, created);
      return;
    }

    if (url.pathname === "/api/notifications/sync-case-trends" && req.method === "POST") {
      const body = await readJsonBody(req);
      const existingJobs = await readNotificationJobs();
      const cases = groupReportsByCase(await readReports());
      const created = buildCaseTrendNotificationJobs(cases, existingJobs, body.channels, body.channelTargets);
      const merged = [
        ...existingJobs.filter((job) => job.source !== "case-trend"),
        ...created
      ];
      await writeNotificationJobs(merged);
      sendJson(res, 201, {
        created,
        counts: {
          total: merged.length,
          caseTrend: created.length
        }
      });
      return;
    }

    if (url.pathname.startsWith("/api/notifications/") && url.pathname.endsWith("/simulate-send") && req.method === "POST") {
      const id = decodeURIComponent(url.pathname.replace("/api/notifications/", "").replace("/simulate-send", ""));
      const jobs = await readNotificationJobs();
      const target = jobs.find((job) => job.id === id);
      if (!target) {
        sendJson(res, 404, { error: "Notification job not found" });
        return;
      }
      target.channelStatuses = simulateChannelSend(target.channelStatuses, target);
      target.status = notificationStatusFromChannels(target.channelStatuses);
      target.providerResponse = {
        simulated: true,
        at: new Date().toISOString(),
        sent: target.channelStatuses.filter((item) => item.status === "sent").length,
        failed: target.channelStatuses.filter((item) => item.status === "failed").length
      };
      target.failureSuggestions = failedChannelSuggestions(target.channelStatuses);
      await writeNotificationJobs(jobs);
      sendJson(res, 200, target);
      return;
    }

    if (url.pathname.startsWith("/api/notifications/") && url.pathname.endsWith("/retry-failed") && req.method === "POST") {
      const id = decodeURIComponent(url.pathname.replace("/api/notifications/", "").replace("/retry-failed", ""));
      const body = await readJsonBody(req);
      const jobs = await readNotificationJobs();
      const target = jobs.find((job) => job.id === id);
      if (!target) {
        sendJson(res, 404, { error: "Notification job not found" });
        return;
      }
      target.channelTargets = { ...(target.channelTargets || {}), ...(body.channelTargets || {}) };
      target.channelStatuses = simulateChannelSend(target.channelStatuses, target, {
        retryFailedOnly: true,
        channelTargets: body.channelTargets || {}
      });
      target.status = notificationStatusFromChannels(target.channelStatuses);
      target.providerResponse = {
        simulated: true,
        retryFailedOnly: true,
        at: new Date().toISOString(),
        sent: target.channelStatuses.filter((item) => item.status === "sent").length,
        failed: target.channelStatuses.filter((item) => item.status === "failed").length
      };
      target.failureSuggestions = failedChannelSuggestions(target.channelStatuses);
      await writeNotificationJobs(jobs);
      sendJson(res, 200, target);
      return;
    }

    if (url.pathname.startsWith("/api/notifications/") && req.method === "PATCH") {
      const id = decodeURIComponent(url.pathname.replace("/api/notifications/", ""));
      const body = await readJsonBody(req);
      const jobs = await readNotificationJobs();
      const target = jobs.find((job) => job.id === id);
      if (!target) {
        sendJson(res, 404, { error: "Notification job not found" });
        return;
      }
      target.status = body.status || target.status;
      target.completedAt = body.completedAt || target.completedAt || null;
      target.providerResponse = body.providerResponse || target.providerResponse || null;
      target.channelStatuses = body.channelStatuses || completeChannelStatuses(target.channelStatuses, body);
      await writeNotificationJobs(jobs);
      sendJson(res, 200, target);
      return;
    }

    if (url.pathname === "/api/reports" && req.method === "GET") {
      const reports = await readReports();
      const query = (url.searchParams.get("q") || "").trim().toLowerCase();
      const crop = (url.searchParams.get("crop") || "").trim();
      const medium = (url.searchParams.get("medium") || "").trim();
      const filtered = reports.filter((report) => {
        const haystack = [
          report.crop,
          report.stage,
          report.medium,
          report.topRisk,
          report.severity,
          report.notes,
          report.report
        ].filter(Boolean).join(" ").toLowerCase();
        return (!query || haystack.includes(query))
          && (!crop || report.cropKey === crop)
          && (!medium || report.mediumKey === medium);
      });
      sendJson(res, 200, reports.map((report) => ({
        id: report.id,
        eventType: report.eventType || "diagnosis",
        createdAt: report.createdAt,
        crop: report.crop,
        cropKey: report.cropKey,
        stage: report.stage,
        medium: report.medium,
        mediumKey: report.mediumKey,
        topRisk: report.topRisk,
        severity: report.severity
      })).filter((report) => filtered.some((item) => item.id === report.id)).reverse());
      return;
    }

    if (url.pathname === "/api/cases" && req.method === "GET") {
      const reports = await readReports();
      const query = (url.searchParams.get("q") || "").trim().toLowerCase();
      const crop = (url.searchParams.get("crop") || "").trim();
      const cases = groupReportsByCase(reports).filter((item) => {
        const haystack = [
          item.name,
          item.crop,
          item.device,
          item.medium,
          item.latestRisk,
          item.latestSeverity,
          item.latestDecision,
          item.trend?.label,
          item.trend?.summary
        ].filter(Boolean).join(" ").toLowerCase();
        return (!query || haystack.includes(query)) && (!crop || item.cropKey === crop);
      });
      sendJson(res, 200, cases.map(({ reports: _reports, ...item }) => item));
      return;
    }

    if (url.pathname.startsWith("/api/cases/") && req.method === "GET") {
      const id = decodeURIComponent(url.pathname.replace("/api/cases/", ""));
      const target = groupReportsByCase(await readReports()).find((item) => item.id === id);
      if (!target) {
        sendJson(res, 404, { error: "Case not found" });
        return;
      }
      sendJson(res, 200, target);
      return;
    }

    if (url.pathname === "/api/reports" && req.method === "POST") {
      const body = await readJsonBody(req);
      const reports = await readReports();
      const report = {
        id: randomUUID(),
        createdAt: new Date().toISOString(),
        ...body
      };
      reports.push(report);
      await writeReports(reports);
      sendJson(res, 201, report);
      return;
    }

    if (url.pathname === "/api/reports/export" && req.method === "GET") {
      sendJson(res, 200, await readReports());
      return;
    }

    if (url.pathname.startsWith("/api/reports/") && req.method === "GET") {
      const id = decodeURIComponent(url.pathname.replace("/api/reports/", ""));
      const report = (await readReports()).find((item) => item.id === id);
      if (!report) {
        sendJson(res, 404, { error: "Report not found" });
        return;
      }
      sendJson(res, 200, report);
      return;
    }

    const pathname = url.pathname === "/" ? "/index.html" : url.pathname;
    const filePath = normalize(join(root, pathname.replace(/^\/+/, "")));

    if (!filePath.startsWith(normalize(root))) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }

    const data = await readFile(filePath);
    res.writeHead(200, {
      "content-type": types[extname(filePath)] || "application/octet-stream"
    });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
});

function closeStorage() {
  if (!sqliteDb) return;
  sqliteDb.close();
  sqliteDb = null;
}

export { server, closeStorage };

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  server.listen(port, host, () => {
    console.log(`Serving http://${host}:${port}/`);
  });
}
