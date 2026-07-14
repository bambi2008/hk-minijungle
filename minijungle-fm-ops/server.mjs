import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import {
  buildDataQualityReport,
  buildProductionSeed,
  loadOpsDataset,
  productionDataModel
} from "./lib/ops-data-model.mjs";
import { summarizeOpsState } from "./lib/ops-state-store.mjs";
import {
  appendSqliteOpsEvent,
  applySqliteOpsStateAction,
  readSqliteOpsEvents,
  readSqliteOpsState,
  readSqliteOpsStorageHealth,
  saveSqliteOpsStateSnapshot
} from "./lib/ops-sqlite-store.mjs";
import {
  importSqliteMasterData,
  readSqliteMasterDataHealth,
  readSqliteMasterDataset,
  upsertSqliteClient,
  upsertSqliteLivingAsset,
  upsertSqliteSensorReading,
  upsertSqliteWorkOrder
} from "./lib/ops-master-data-store.mjs";
import {
  authPolicySummary,
  canAccessClient,
  filterByClientScope,
  requireActionAccess,
  requireClientAccess,
  requireEventWriteAccess,
  requirePermission,
  requireSnapshotWriteAccess,
  resolveAuthContext
} from "./lib/ops-auth.mjs";

const root = process.cwd();
const dataRoot = join(root, "data");
const runtimeRoot = process.env.DR_FOREST_RUNTIME_DIR || join(root, ".ops-data");
const runtimeDbPath = process.env.DR_FOREST_RUNTIME_DB_PATH || join(runtimeRoot, "ops-runtime.sqlite");
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

const sqliteMasterDataKeys = new Set(["clients", "walls", "workorders", "proof", "sensors", "incidents"]);

const scopedDataFiles = {
  billing: "billing.json",
  schedule: "schedule.json",
  compliance: "compliance.json",
  aiInsights: "ai-insights.json"
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
  if (sqliteMasterDataKeys.has(key)) {
    const dataset = await readSqliteMasterDataset(runtimeDbPath, dataRoot);
    const data = {
      clients: dataset.clients,
      walls: dataset.walls,
      workorders: dataset.workorders,
      proof: { records: dataset.proofRecords },
      sensors: { readings: dataset.sensorReadings },
      incidents: { incidents: dataset.incidents }
    };
    return data[key];
  }

  const filename = dataFileMap[key];
  if (!filename) throw new Error(`Unknown data file: ${key}`);
  return JSON.parse(await readFile(join(dataRoot, filename), "utf8"));
}

async function readJsonFile(filename) {
  return JSON.parse(await readFile(join(dataRoot, filename), "utf8"));
}

async function readOpsEvents() {
  return readSqliteOpsEvents(runtimeDbPath);
}

async function appendOpsEvent(event) {
  return appendSqliteOpsEvent(runtimeDbPath, event);
}

async function readOpsState() {
  return readSqliteOpsState(runtimeDbPath);
}

async function saveOpsStateSnapshot(input, event = null) {
  return saveSqliteOpsStateSnapshot(runtimeDbPath, input, event);
}

async function applyOpsStateAction(input, event = null) {
  return applySqliteOpsStateAction(runtimeDbPath, input, event);
}

async function buildEntityClientResolver() {
  const [walls, workorders, proofData, sensorData, incidentData, billingData, scheduleData, complianceData, aiData] = await Promise.all([
    readJsonData("walls"),
    readJsonData("workorders"),
    readJsonData("proof"),
    readJsonData("sensors"),
    readJsonData("incidents"),
    readJsonFile(scopedDataFiles.billing),
    readJsonFile(scopedDataFiles.schedule),
    readJsonFile(scopedDataFiles.compliance),
    readJsonFile(scopedDataFiles.aiInsights)
  ]);

  const wallClientById = new Map(walls.map((wall) => [wall.id, wall.clientId]));
  const workorderClientById = new Map(workorders.map((order) => [order.id, wallClientById.get(order.wallId) || null]));
  const proofClientById = new Map((proofData.records || []).map((record) => [record.id, wallClientById.get(record.wallId) || null]));
  const sensorClientById = new Map((sensorData.readings || []).map((reading) => [reading.id, wallClientById.get(reading.wallId) || null]));
  const incidentClientById = new Map((incidentData.incidents || []).map((incident) => [incident.id, wallClientById.get(incident.wallId) || null]));
  const invoiceClientById = new Map((billingData.invoices || []).map((invoice) => [invoice.id, invoice.clientId || null]));
  const scheduleClientById = new Map((scheduleData.slots || []).map((slot) => [slot.id, workorderClientById.get(slot.workorderId) || null]));
  const complianceClientById = new Map((complianceData.items || []).map((item) => [item.id, item.clientId || null]));
  const aiClientById = new Map((aiData.recommendations || []).map((item) => [item.id, item.clientId || null]));

  return (entityType, entityId) => {
    if (entityType === "client") return entityId;
    if (entityType === "wall" || entityType === "asset") return wallClientById.get(entityId) || null;
    if (entityType === "workorder") return workorderClientById.get(entityId) || null;
    if (entityType === "proof") return proofClientById.get(entityId) || null;
    if (entityType === "sensor") return sensorClientById.get(entityId) || null;
    if (entityType === "invoice") return invoiceClientById.get(entityId) || null;
    if (entityType === "schedule") return scheduleClientById.get(entityId) || null;
    if (entityType === "incident") return incidentClientById.get(entityId) || null;
    if (entityType === "compliance") return complianceClientById.get(entityId) || null;
    if (entityType === "ai-recommendation") return aiClientById.get(entityId) || null;
    return null;
  };
}

function filterOpsEventsForAuth(events, auth, resolveEntityClientId) {
  return filterByClientScope(auth, events, (event) => event.clientId || resolveEntityClientId(event.entityType, event.entityId));
}

function filterStateMap(auth, map, entityType, resolveEntityClientId) {
  return Object.fromEntries(
    Object.entries(map || {}).filter(([id]) => canAccessClient(auth, resolveEntityClientId(entityType, id)))
  );
}

async function filterOpsStateForAuth(snapshot, auth) {
  if (auth.clientScope === "all") return snapshot;
  const resolveEntityClientId = await buildEntityClientResolver();
  const state = snapshot.state || {};

  return {
    ...snapshot,
    state: {
      ...state,
      workorderCompletions: filterStateMap(auth, state.workorderCompletions, "workorder", resolveEntityClientId),
      dispatchStaging: filterStateMap(auth, state.dispatchStaging, "workorder", resolveEntityClientId),
      proofApprovals: filterStateMap(auth, state.proofApprovals, "proof", resolveEntityClientId),
      sensorAcknowledgements: filterStateMap(auth, state.sensorAcknowledgements, "sensor", resolveEntityClientId),
      supplyRequests: {},
      invoicePayments: filterStateMap(auth, state.invoicePayments, "invoice", resolveEntityClientId),
      scheduleConfirmations: filterStateMap(auth, state.scheduleConfirmations, "schedule", resolveEntityClientId),
      incidentResolutions: filterStateMap(auth, state.incidentResolutions, "incident", resolveEntityClientId),
      complianceClearances: filterStateMap(auth, state.complianceClearances, "compliance", resolveEntityClientId),
      quickOpsTasks: (state.quickOpsTasks || []).filter((task) => canAccessClient(auth, task.clientId)),
      auditEvents: (state.auditEvents || []).filter((event) => canAccessClient(auth, event.clientId || resolveEntityClientId(event.entityType, event.entityId))),
      aiQueuedActions: filterStateMap(auth, state.aiQueuedActions, "ai-recommendation", resolveEntityClientId)
    }
  };
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

async function buildPortfolioSummary(auth) {
  const [clients, walls, workorders, proofData, sensorData, incidentData, productModel, events, opsState] = await Promise.all([
    readJsonData("clients"),
    readJsonData("walls"),
    readJsonData("workorders"),
    readJsonData("proof"),
    readJsonData("sensors"),
    readJsonData("incidents"),
    readJsonData("productModel"),
    readOpsEvents(),
    readOpsState()
  ]);

  const scopedClients = filterByClientScope(auth, clients, (client) => client.id);
  const scopedClientIds = new Set(scopedClients.map((client) => client.id));
  const scopedWalls = walls.filter((wall) => scopedClientIds.has(wall.clientId));
  const scopedWallIds = new Set(scopedWalls.map((wall) => wall.id));
  const scopedWorkorders = workorders.filter((item) => scopedWallIds.has(item.wallId));
  const proofRecords = proofData.records || [];
  const sensors = sensorData.readings || [];
  const incidents = incidentData.incidents || [];
  const scopedProofRecords = proofRecords.filter((item) => scopedWallIds.has(item.wallId));
  const scopedSensors = sensors.filter((item) => scopedWallIds.has(item.wallId));
  const scopedIncidents = incidents.filter((item) => scopedWallIds.has(item.wallId));
  const reportModes = productModel.reportModes || [];
  const resolveEntityClientId = await buildEntityClientResolver();
  const scopedEvents = filterOpsEventsForAuth(events, auth, resolveEntityClientId);
  const avgHealth = scopedWalls.length
    ? Math.round(scopedWalls.reduce((total, wall) => total + Number(wall.health || 0), 0) / scopedWalls.length)
    : 0;

  return {
    generatedAt: new Date().toISOString(),
    scope: "demo-data-api",
    auth: {
      principalId: auth.id,
      roleId: auth.roleId,
      clientScope: auth.clientScope,
      clientIds: auth.clientIds
    },
    counts: {
      clients: scopedClients.length,
      assets: scopedWalls.length,
      modules: scopedWalls.reduce((total, wall) => total + Number(wall.modules || 0), 0),
      pods: scopedWalls.reduce((total, wall) => total + Number(wall.pods || 0), 0),
      workorders: scopedWorkorders.length,
      activeWorkorders: activeWorkorders(scopedWorkorders).length,
      proofRecords: scopedProofRecords.length,
      sensorReadings: scopedSensors.length,
      activeSensorAlerts: scopedSensors.filter((item) => ["alert", "watch", "offline"].includes(item.status)).length,
      incidents: scopedIncidents.length,
      openIncidents: openIncidents(scopedIncidents).length,
      reportModes: reportModes.length,
      serverSideOpsEvents: scopedEvents.length,
      serverStateRevision: opsState.revision
    },
    health: {
      averageScore: avgHealth,
      riskAssets: scopedWalls.filter((wall) => wall.status === "risk").length,
      watchAssets: scopedWalls.filter((wall) => wall.status === "watch").length,
      stableAssets: scopedWalls.filter((wall) => wall.status === "stable").length
    }
  };
}

async function buildAssetIndex(auth) {
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

  return walls.filter((wall) => canAccessClient(auth, wall.clientId)).map((wall) => {
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
        "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
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
        runtimeStore: "sqlite",
        masterDataStore: "sqlite",
        authPolicy: "role-client-scope-v1",
        generatedAt: new Date().toISOString(),
        dataFiles: Object.keys(dataFileMap)
      });
      return;
    }

    const auth = resolveAuthContext(req);

    if (req.method === "GET" && pathname === "/api/auth/context") {
      sendJson(res, 200, {
        generatedAt: new Date().toISOString(),
        auth
      });
      return;
    }

    if (req.method === "GET" && pathname === "/api/auth/policy") {
      requirePermission(auth, "auth.policy.read");
      sendJson(res, 200, {
        generatedAt: new Date().toISOString(),
        ...authPolicySummary()
      });
      return;
    }

    if (req.method === "GET" && pathname === "/api/admin/master-data/validate") {
      requirePermission(auth, "master.data.validate");
      sendJson(res, 200, {
        generatedAt: new Date().toISOString(),
        masterData: await readSqliteMasterDataHealth(runtimeDbPath, dataRoot)
      });
      return;
    }

    if (req.method === "POST" && pathname === "/api/admin/master-data/import") {
      requirePermission(auth, "master.data.import");
      const masterData = await importSqliteMasterData(runtimeDbPath, dataRoot);
      const event = normalizeOpsEvent({
        type: "master-data.imported",
        actor: auth.name,
        entityType: "master-data",
        entityId: "json-seed",
        source: "master-data-admin",
        note: "Master data imported from JSON seed files into SQLite tables.",
        payload: {
          principalId: auth.id,
          counts: masterData.counts
        }
      });
      await appendOpsEvent(event);
      sendJson(res, 200, {
        masterData,
        event
      });
      return;
    }

    const clientAdminMatch = pathname.match(/^\/api\/admin\/master-data\/clients\/([^/]+)$/);
    if (req.method === "PUT" && clientAdminMatch) {
      requirePermission(auth, "master.data.write");
      const input = {
        ...(await readJsonBody(req)),
        id: decodeURIComponent(clientAdminMatch[1])
      };
      requireClientAccess(auth, input.id, "client upsert");
      const client = await upsertSqliteClient(runtimeDbPath, dataRoot, input);
      const event = normalizeOpsEvent({
        type: "master-data.client.upserted",
        actor: auth.name,
        entityType: "client",
        entityId: client.id,
        clientId: client.id,
        source: "master-data-admin",
        note: `Client ${client.name} upserted through admin API.`,
        payload: { principalId: auth.id }
      });
      await appendOpsEvent(event);
      sendJson(res, 200, { client, event });
      return;
    }

    const assetAdminMatch = pathname.match(/^\/api\/admin\/master-data\/living-assets\/([^/]+)$/);
    if (req.method === "PUT" && assetAdminMatch) {
      requirePermission(auth, "master.data.write");
      const input = {
        ...(await readJsonBody(req)),
        id: decodeURIComponent(assetAdminMatch[1])
      };
      requireClientAccess(auth, input.clientId, "living asset upsert");
      const asset = await upsertSqliteLivingAsset(runtimeDbPath, dataRoot, input);
      const event = normalizeOpsEvent({
        type: "master-data.asset.upserted",
        actor: auth.name,
        entityType: "wall",
        entityId: asset.id,
        clientId: asset.clientId,
        wallId: asset.id,
        source: "master-data-admin",
        note: `Living asset ${asset.name} upserted through admin API.`,
        payload: { principalId: auth.id }
      });
      await appendOpsEvent(event);
      sendJson(res, 200, { asset, event });
      return;
    }

    const workOrderAdminMatch = pathname.match(/^\/api\/admin\/master-data\/work-orders\/([^/]+)$/);
    if (req.method === "PUT" && workOrderAdminMatch) {
      requirePermission(auth, "master.data.write");
      const input = {
        ...(await readJsonBody(req)),
        id: decodeURIComponent(workOrderAdminMatch[1])
      };
      const resolveEntityClientId = await buildEntityClientResolver();
      const clientId = resolveEntityClientId("wall", input.wallId);
      requireClientAccess(auth, clientId, "work order upsert");
      const workOrder = await upsertSqliteWorkOrder(runtimeDbPath, dataRoot, input);
      const event = normalizeOpsEvent({
        type: "master-data.workorder.upserted",
        actor: auth.name,
        entityType: "workorder",
        entityId: workOrder.id,
        clientId,
        wallId: workOrder.wallId,
        source: "master-data-admin",
        note: `Work order ${workOrder.id} upserted through admin API.`,
        payload: { principalId: auth.id }
      });
      await appendOpsEvent(event);
      sendJson(res, 200, { workOrder, event });
      return;
    }

    const sensorAdminMatch = pathname.match(/^\/api\/admin\/master-data\/sensor-readings\/([^/]+)$/);
    if (req.method === "PUT" && sensorAdminMatch) {
      requirePermission(auth, "master.data.write");
      const input = {
        ...(await readJsonBody(req)),
        id: decodeURIComponent(sensorAdminMatch[1])
      };
      const resolveEntityClientId = await buildEntityClientResolver();
      const clientId = resolveEntityClientId("wall", input.wallId);
      requireClientAccess(auth, clientId, "sensor reading upsert");
      const sensor = await upsertSqliteSensorReading(runtimeDbPath, dataRoot, input);
      const event = normalizeOpsEvent({
        type: "master-data.sensor.upserted",
        actor: auth.name,
        entityType: "sensor",
        entityId: sensor.id,
        clientId,
        wallId: sensor.wallId,
        source: "master-data-admin",
        note: `Sensor reading ${sensor.id} upserted through admin API.`,
        payload: { principalId: auth.id }
      });
      await appendOpsEvent(event);
      sendJson(res, 200, { sensor, event });
      return;
    }

    if (req.method === "GET" && pathname === "/api/storage") {
      requirePermission(auth, "storage.read");
      const [runtimeStorage, masterDataStorage] = await Promise.all([
        readSqliteOpsStorageHealth(runtimeDbPath),
        readSqliteMasterDataHealth(runtimeDbPath, dataRoot)
      ]);
      sendJson(res, 200, {
        generatedAt: new Date().toISOString(),
        ...runtimeStorage,
        masterData: masterDataStorage
      });
      return;
    }

    if (req.method === "GET" && pathname === "/api/portfolio") {
      requirePermission(auth, "portfolio.read");
      sendJson(res, 200, await buildPortfolioSummary(auth));
      return;
    }

    if (req.method === "GET" && pathname === "/api/data-model") {
      requirePermission(auth, "data.model.read");
      sendJson(res, 200, productionDataModel);
      return;
    }

    if (req.method === "GET" && pathname === "/api/data-quality") {
      requirePermission(auth, "data.quality.read");
      sendJson(res, 200, await buildDataQualityReport(dataRoot, await readOpsEvents()));
      return;
    }

    if (req.method === "GET" && pathname === "/api/production-seed") {
      requirePermission(auth, "production.seed.read");
      sendJson(res, 200, buildProductionSeed(await loadOpsDataset(dataRoot), await readOpsEvents()));
      return;
    }

    if (req.method === "GET" && pathname === "/api/assets") {
      requirePermission(auth, "assets.read");
      sendJson(res, 200, {
        generatedAt: new Date().toISOString(),
        auth: {
          principalId: auth.id,
          roleId: auth.roleId,
          clientScope: auth.clientScope,
          clientIds: auth.clientIds
        },
        assets: await buildAssetIndex(auth)
      });
      return;
    }

    if (req.method === "GET" && pathname === "/api/ops-events") {
      requirePermission(auth, "ops.events.read");
      const resolveEntityClientId = await buildEntityClientResolver();
      sendJson(res, 200, {
        generatedAt: new Date().toISOString(),
        auth: {
          principalId: auth.id,
          roleId: auth.roleId,
          clientScope: auth.clientScope,
          clientIds: auth.clientIds
        },
        events: filterOpsEventsForAuth(await readOpsEvents(), auth, resolveEntityClientId)
      });
      return;
    }

    if (req.method === "GET" && pathname === "/api/ops-state") {
      requirePermission(auth, "ops.state.read");
      const snapshot = await filterOpsStateForAuth(await readOpsState(), auth);
      sendJson(res, 200, {
        ...snapshot,
        auth: {
          principalId: auth.id,
          roleId: auth.roleId,
          clientScope: auth.clientScope,
          clientIds: auth.clientIds
        },
        summary: summarizeOpsState(snapshot)
      });
      return;
    }

    if (req.method === "POST" && pathname === "/api/ops-events") {
      const input = await readJsonBody(req);
      const event = normalizeOpsEvent(input);
      requireEventWriteAccess(auth, event);
      await appendOpsEvent(event);
      sendJson(res, 201, { event });
      return;
    }

    if (req.method === "POST" && pathname === "/api/ops-state/snapshot") {
      const input = await readJsonBody(req);
      const event = input.event ? normalizeOpsEvent({
        source: "state-snapshot",
        ...input.event
      }) : null;
      requireSnapshotWriteAccess(auth, event);
      const snapshot = await saveOpsStateSnapshot(input, event);
      if (event) await appendOpsEvent(event);
      sendJson(res, 200, {
        ...snapshot,
        event,
        summary: summarizeOpsState(snapshot)
      });
      return;
    }

    if (req.method === "POST" && pathname === "/api/ops-state/actions") {
      const input = await readJsonBody(req);
      const action = input.action && typeof input.action === "object" ? input.action : input;
      requireActionAccess(auth, action);
      const event = normalizeOpsEvent({
        type: action.type,
        actor: action.actor,
        entityType: action.entityType,
        entityId: action.entityId,
        clientId: action.clientId || null,
        wallId: action.wallId || null,
        source: "state-action",
        note: action.note || "",
        payload: {
          auditEventId: action.auditEvent?.id || null,
          actionType: action.type
        }
      });
      const result = await applyOpsStateAction({
        expectedRevision: input.expectedRevision,
        action
      }, event);
      await appendOpsEvent(event);
      sendJson(res, 200, {
        ...result.snapshot,
        action: result.action,
        event,
        summary: summarizeOpsState(result.snapshot)
      });
      return;
    }

    sendJson(res, 404, { error: "API endpoint not found" });
  } catch (error) {
    const status = Number(error.status || 500);
    const payload = {
      error: status >= 500 ? "Internal server error" : error.message
    };
    if (error.code) payload.code = error.code;
    if (status === 409 && error.snapshot) {
      payload.currentRevision = error.currentRevision;
      payload.snapshot = {
        ...error.snapshot,
        summary: summarizeOpsState(error.snapshot)
      };
    }
    sendJson(res, status, payload);
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
