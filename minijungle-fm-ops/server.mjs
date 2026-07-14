import { createServer } from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, extname, join, normalize } from "node:path";

const root = process.cwd();
const dataRoot = join(root, "data");
const runtimeRoot = process.env.DR_FOREST_RUNTIME_DIR || join(root, ".ops-data");
const runtimeEventPath = join(runtimeRoot, "ops-events.jsonl");
const portArgIndex = process.argv.indexOf("--port");
const cliPort = portArgIndex >= 0 ? process.argv[portArgIndex + 1] : null;
const port = Number(cliPort || process.env.PORT || 8010);
const host = process.env.HOST || "127.0.0.1";
const maxJsonBodyBytes = 64 * 1024;

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png"
};

const dataFileMap = {
  clients: "clients.json",
  walls: "walls.json",
  workorders: "workorders.json",
  proof: "proof.json",
  sensors: "sensors.json",
  incidents: "incidents.json",
  productModel: "product-model.json"
};

function resolvePath(url) {
  const requestUrl = (url || "/").replace(/^\/+/, "/");
  const pathname = new URL(requestUrl, `http://${host}:${port}`).pathname;
  const requested = pathname === "/" ? "/index.html" : pathname;
  const normalized = normalize(join(root, requested));
  if (!normalized.startsWith(root)) return null;
  return normalized;
}

async function readJsonData(key) {
  const filename = dataFileMap[key];
  if (!filename) throw new Error(`Unknown data file: ${key}`);
  return JSON.parse(await readFile(join(dataRoot, filename), "utf8"));
}

async function readOpsEvents() {
  try {
    const body = await readFile(runtimeEventPath, "utf8");
    return body
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => JSON.parse(line));
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

async function appendOpsEvent(event) {
  await mkdir(dirname(runtimeEventPath), { recursive: true });
  await writeFile(runtimeEventPath, `${JSON.stringify(event)}\n`, { flag: "a" });
}

function sendJson(res, status, payload) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(JSON.stringify(payload, null, 2));
}

function sendText(res, status, message) {
  res.writeHead(status, {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(message);
}

async function readJsonBody(req) {
  let size = 0;
  const chunks = [];

  for await (const chunk of req) {
    size += chunk.length;
    if (size > maxJsonBodyBytes) {
      const error = new Error("Request body too large");
      error.status = 413;
      throw error;
    }
    chunks.push(chunk);
  }

  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function activeWorkorders(workorders) {
  return workorders.filter((item) => String(item.status || "").toLowerCase() !== "completed");
}

function openIncidents(incidents) {
  return incidents.filter((item) => !["resolved", "closed"].includes(String(item.status || "").toLowerCase()));
}

async function buildPortfolioSummary() {
  const [clients, walls, workorders, proofData, sensorData, incidentData, productModel, events] = await Promise.all([
    readJsonData("clients"),
    readJsonData("walls"),
    readJsonData("workorders"),
    readJsonData("proof"),
    readJsonData("sensors"),
    readJsonData("incidents"),
    readJsonData("productModel"),
    readOpsEvents()
  ]);

  const proofRecords = proofData.records || [];
  const sensors = sensorData.readings || [];
  const incidents = incidentData.incidents || [];
  const reportModes = productModel.reportModes || [];
  const avgHealth = walls.length
    ? Math.round(walls.reduce((total, wall) => total + Number(wall.health || 0), 0) / walls.length)
    : 0;

  return {
    generatedAt: new Date().toISOString(),
    scope: "demo-data-api",
    counts: {
      clients: clients.length,
      assets: walls.length,
      modules: walls.reduce((total, wall) => total + Number(wall.modules || 0), 0),
      pods: walls.reduce((total, wall) => total + Number(wall.pods || 0), 0),
      workorders: workorders.length,
      activeWorkorders: activeWorkorders(workorders).length,
      proofRecords: proofRecords.length,
      sensorReadings: sensors.length,
      activeSensorAlerts: sensors.filter((item) => ["alert", "watch", "offline"].includes(item.status)).length,
      incidents: incidents.length,
      openIncidents: openIncidents(incidents).length,
      reportModes: reportModes.length,
      serverSideOpsEvents: events.length
    },
    health: {
      averageScore: avgHealth,
      riskAssets: walls.filter((wall) => wall.status === "risk").length,
      watchAssets: walls.filter((wall) => wall.status === "watch").length,
      stableAssets: walls.filter((wall) => wall.status === "stable").length
    }
  };
}

async function buildAssetIndex() {
  const [clients, walls, workorders, proofData, sensorData, incidentData] = await Promise.all([
    readJsonData("clients"),
    readJsonData("walls"),
    readJsonData("workorders"),
    readJsonData("proof"),
    readJsonData("sensors"),
    readJsonData("incidents")
  ]);

  const proofRecords = proofData.records || [];
  const sensors = sensorData.readings || [];
  const incidents = incidentData.incidents || [];
  const clientById = new Map(clients.map((client) => [client.id, client]));

  return walls.map((wall) => {
    const client = clientById.get(wall.clientId);
    const wallWorkorders = workorders.filter((item) => item.wallId === wall.id);
    const wallProof = proofRecords.filter((item) => item.wallId === wall.id);
    const wallSensors = sensors.filter((item) => item.wallId === wall.id);
    const wallIncidents = incidents.filter((item) => item.wallId === wall.id);

    return {
      id: wall.id,
      name: wall.name,
      clientId: wall.clientId,
      clientName: client?.name || wall.clientId,
      district: client?.district || null,
      location: wall.location,
      version: wall.version,
      modules: wall.modules,
      pods: wall.pods,
      health: wall.health,
      status: wall.status,
      nextVisit: wall.nextVisit,
      openWorkorders: activeWorkorders(wallWorkorders).length,
      proofRecords: wallProof.length,
      sensorAlerts: wallSensors.filter((item) => ["alert", "watch", "offline"].includes(item.status)).length,
      openIncidents: openIncidents(wallIncidents).length
    };
  });
}

function normalizeOpsEvent(input) {
  const type = String(input.type || "").trim();
  const actor = String(input.actor || "").trim();
  const entityType = String(input.entityType || "").trim();
  const entityId = String(input.entityId || "").trim();

  if (!type || !actor || !entityType || !entityId) {
    const error = new Error("type, actor, entityType and entityId are required");
    error.status = 400;
    throw error;
  }

  return {
    id: `OPS-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    type,
    actor,
    entityType,
    entityId,
    clientId: input.clientId || null,
    wallId: input.wallId || null,
    source: input.source || "api",
    note: input.note || "",
    payload: input.payload && typeof input.payload === "object" ? input.payload : {}
  };
}

async function handleApi(req, res, pathname) {
  try {
    if (req.method === "OPTIONS") {
      res.writeHead(204, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      });
      res.end();
      return;
    }

    if (req.method === "GET" && pathname === "/api/health") {
      sendJson(res, 200, {
        status: "ok",
        service: "dr-forest-fm-ops",
        mode: "api-foundation",
        generatedAt: new Date().toISOString(),
        dataFiles: Object.keys(dataFileMap)
      });
      return;
    }

    if (req.method === "GET" && pathname === "/api/portfolio") {
      sendJson(res, 200, await buildPortfolioSummary());
      return;
    }

    if (req.method === "GET" && pathname === "/api/assets") {
      sendJson(res, 200, {
        generatedAt: new Date().toISOString(),
        assets: await buildAssetIndex()
      });
      return;
    }

    if (req.method === "GET" && pathname === "/api/ops-events") {
      sendJson(res, 200, {
        generatedAt: new Date().toISOString(),
        events: await readOpsEvents()
      });
      return;
    }

    if (req.method === "POST" && pathname === "/api/ops-events") {
      const input = await readJsonBody(req);
      const event = normalizeOpsEvent(input);
      await appendOpsEvent(event);
      sendJson(res, 201, { event });
      return;
    }

    sendJson(res, 404, { error: "API endpoint not found" });
  } catch (error) {
    const status = Number(error.status || 500);
    sendJson(res, status, {
      error: status >= 500 ? "Internal server error" : error.message
    });
  }
}

const server = createServer(async (req, res) => {
  const requestPath = (req.url || "/").replace(/^\/+/, "/");
  const requestUrl = new URL(requestPath, `http://${host}:${port}`);
  if (requestUrl.pathname.startsWith("/api/")) {
    await handleApi(req, res, requestUrl.pathname);
    return;
  }

  const filePath = resolvePath(requestPath);
  if (!filePath) {
    sendText(res, 403, "Forbidden");
    return;
  }

  try {
    const body = await readFile(filePath);
    res.writeHead(200, {
      "Content-Type": types[extname(filePath)] || "application/octet-stream",
      "Cache-Control": "no-store"
    });
    res.end(body);
  } catch {
    sendText(res, 404, "Not found");
  }
});

server.listen(port, host, () => {
  console.log(`DR FOREST FM Ops running at http://${host}:${port}/`);
});
