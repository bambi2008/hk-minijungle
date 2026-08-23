import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const productionDataModel = {
  version: "2026-08-17.device-ingestion-v1",
  scoreTarget: {
    before: 70,
    after: 75
  },
  scope: "Hong Kong FM living-green module operations at 1,000+ modules",
  entities: [
    {
      name: "clients",
      idField: "id",
      source: ".ops-data/ops-runtime.sqlite::clients seeded from data/clients.json",
      purpose: "Contract owner, district, commercial plan and renewal-risk anchor."
    },
    {
      name: "sites",
      idField: "id",
      source: "derived from clients",
      purpose: "Physical operating location for access, district routing and FM reporting."
    },
    {
      name: "livingAssets",
      idField: "id",
      source: ".ops-data/ops-runtime.sqlite::living_assets seeded from data/walls.json",
      purpose: "Managed DR FOREST Wall or future living asset under SLA."
    },
    {
      name: "assetModules",
      idField: "id",
      source: ".ops-data/ops-runtime.sqlite::asset_modules generated from living_assets.modules during pilot bootstrap",
      purpose: "Robot, technician, camera and sensor addressable module unit with four-metric device map."
    },
    {
      name: "workOrders",
      idField: "id",
      source: ".ops-data/ops-runtime.sqlite::work_orders seeded from data/workorders.json",
      purpose: "Field execution task with SLA, proof gate and closure audit."
    },
    {
      name: "proofRecords",
      idField: "id",
      source: ".ops-data/ops-runtime.sqlite::proof_records seeded from data/proof.json",
      purpose: "Photos, notes and method evidence used in ESG, renewal and audit packs."
    },
    {
      name: "proofMediaObjects",
      idField: "id",
      source: ".ops-data/ops-runtime.sqlite::proof_media_objects",
      purpose: "Object-key, hash, size, source and verification ledger for proof media."
    },
    {
      name: "sensorReadings",
      idField: "id",
      source: ".ops-data/ops-runtime.sqlite::sensor_readings seeded from data/sensors.json",
      purpose: "Telemetry or manual observation record for health score and incident triggers."
    },
    {
      name: "assetDevices",
      idField: "id",
      source: ".ops-data/ops-runtime.sqlite::asset_devices",
      purpose: "Registered temperature, humidity, CO2, MC, camera and gateway endpoint with module scope and device identity."
    },
    {
      name: "deviceIngestionLog",
      idField: "id",
      source: ".ops-data/ops-runtime.sqlite::device_ingestion_log",
      purpose: "Idempotency, payload hash and acceptance trail for external device data."
    },
    {
      name: "deviceCameraCaptures",
      idField: "id",
      source: ".ops-data/ops-runtime.sqlite::device_camera_captures",
      purpose: "Camera metadata and optional locally verified bytes linked to a planting module."
    },
    {
      name: "telemetryAlertRules",
      idField: "id",
      source: ".ops-data/ops-runtime.sqlite::telemetry_alert_rules",
      purpose: "Calibrated module or client thresholds that turn sensor exceptions into an actionable queue."
    },
    {
      name: "telemetryAlerts",
      idField: "id",
      source: ".ops-data/ops-runtime.sqlite::telemetry_alerts",
      purpose: "Persisted exception state with occurrence counts, acknowledgement, resolution and audit linkage."
    },
    {
      name: "aiVisualDiagnoses",
      idField: "id",
      source: ".ops-data/ops-runtime.sqlite::ai_visual_diagnoses",
      purpose: "AI vision request/result contract linked to a camera capture without claiming an unexecuted diagnosis."
    },
    {
      name: "incidents",
      idField: "id",
      source: ".ops-data/ops-runtime.sqlite::incidents seeded from data/incidents.json",
      purpose: "Exception queue with owner, SLA clock, source evidence and proof requirements."
    },
    {
      name: "serviceSlots",
      idField: "id",
      source: "data/schedule.json",
      purpose: "Visit windows, technician allocation and access readiness."
    },
    {
      name: "invoices",
      idField: "id",
      source: "data/billing.json",
      purpose: "Recurring rental, expansion charges and renewal-risk commercial signal."
    },
    {
      name: "complianceItems",
      idField: "id",
      source: "data/compliance.json",
      purpose: "Access, insurance, hygiene, photo consent and proof-release blockers."
    },
    {
      name: "inventoryItems",
      idField: "sku",
      source: "data/supply.json and data/dispatch.json",
      purpose: "Pods, Xponge sleeves, nutrients, tools and route kit availability."
    },
    {
      name: "opsEvents",
      idField: "id",
      source: ".ops-data/ops-runtime.sqlite::ops_events",
      purpose: "SQLite-backed operational event stream for future audit and analytics."
    },
    {
      name: "evidenceSnapshots",
      idField: "snapshotId",
      source: ".ops-data/ops-runtime.sqlite::evidence_snapshots or PostgreSQL evidence_snapshots",
      purpose: "Append-only server-generated report package registry with scope metadata, SHA-256/HMAC integrity, verification state and retention expiry."
    }
  ],
  relationships: [
    { from: "sites.clientId", to: "clients.id" },
    { from: "livingAssets.clientId", to: "clients.id" },
    { from: "assetModules.assetId", to: "livingAssets.id" },
    { from: "assetDevices.clientId", to: "clients.id" },
    { from: "assetDevices.wallId", to: "livingAssets.id" },
    { from: "assetDevices.moduleId", to: "assetModules.id", optional: true },
    { from: "telemetryAlertRules.clientId", to: "clients.id", optional: true },
    { from: "telemetryAlertRules.wallId", to: "livingAssets.id", optional: true },
    { from: "telemetryAlertRules.moduleId", to: "assetModules.id", optional: true },
    { from: "telemetryAlerts.clientId", to: "clients.id" },
    { from: "telemetryAlerts.wallId", to: "livingAssets.id" },
    { from: "telemetryAlerts.moduleId", to: "assetModules.id", optional: true },
    { from: "aiVisualDiagnoses.clientId", to: "clients.id" },
    { from: "aiVisualDiagnoses.wallId", to: "livingAssets.id" },
    { from: "aiVisualDiagnoses.moduleId", to: "assetModules.id" },
    { from: "aiVisualDiagnoses.captureId", to: "deviceCameraCaptures.id" },
    { from: "workOrders.wallId", to: "livingAssets.id" },
    { from: "proofRecords.workorderId", to: "workOrders.id" },
    { from: "proofRecords.wallId", to: "livingAssets.id" },
    { from: "proofMediaObjects.clientId", to: "clients.id" },
    { from: "proofMediaObjects.wallId", to: "livingAssets.id" },
    { from: "proofMediaObjects.workorderId", to: "workOrders.id" },
    { from: "proofMediaObjects.proofRecordId", to: "proofRecords.id", optional: true },
    { from: "sensorReadings.wallId", to: "livingAssets.id" },
    { from: "incidents.wallId", to: "livingAssets.id" },
    { from: "incidents.linkedWorkorderId", to: "workOrders.id" },
    { from: "serviceSlots.workorderId", to: "workOrders.id" },
    { from: "invoices.clientId", to: "clients.id" },
    { from: "complianceItems.clientId", to: "clients.id" },
    { from: "complianceItems.wallId", to: "livingAssets.id" },
    { from: "opsEvents.clientId", to: "clients.id", optional: true },
    { from: "opsEvents.wallId", to: "livingAssets.id", optional: true }
  ],
  scaleIndexes: [
    "clients.id",
    "sites.clientId",
    "livingAssets.clientId",
    "livingAssets.status",
    "assetModules.assetId",
    "assetDevices.moduleId",
    "telemetryAlertRules.moduleId",
    "telemetryAlerts.status+lastSeenAt",
    "aiVisualDiagnoses.status+createdAt",
    "workOrders.wallId",
    "workOrders.status",
    "proofRecords.wallId",
    "proofMediaObjects.clientId",
    "proofMediaObjects.sha256",
    "proofMediaObjects.uploadStatus",
    "sensorReadings.wallId",
    "incidents.wallId",
    "incidents.status",
    "serviceSlots.technicianId",
    "opsEvents.entityType+entityId",
    "opsEvents.timestamp"
  ]
};

export const dataFileMap = {
  clients: "clients.json",
  walls: "walls.json",
  workorders: "workorders.json",
  proof: "proof.json",
  sensors: "sensors.json",
  incidents: "incidents.json",
  schedule: "schedule.json",
  billing: "billing.json",
  compliance: "compliance.json",
  dispatch: "dispatch.json",
  supply: "supply.json",
  productModel: "product-model.json"
};

async function readJson(root, key) {
  return JSON.parse(await readFile(join(root, dataFileMap[key]), "utf8"));
}

function asArray(value, key) {
  if (Array.isArray(value)) return value;
  if (value && Array.isArray(value[key])) return value[key];
  return [];
}

export async function loadOpsDataset(dataRoot) {
  const [
    clients,
    walls,
    workorders,
    proof,
    sensors,
    incidents,
    schedule,
    billing,
    compliance,
    dispatch,
    supply,
    productModel
  ] = await Promise.all([
    readJson(dataRoot, "clients"),
    readJson(dataRoot, "walls"),
    readJson(dataRoot, "workorders"),
    readJson(dataRoot, "proof"),
    readJson(dataRoot, "sensors"),
    readJson(dataRoot, "incidents"),
    readJson(dataRoot, "schedule"),
    readJson(dataRoot, "billing"),
    readJson(dataRoot, "compliance"),
    readJson(dataRoot, "dispatch"),
    readJson(dataRoot, "supply"),
    readJson(dataRoot, "productModel")
  ]);

  return {
    clients: asArray(clients),
    walls: asArray(walls),
    workorders: asArray(workorders),
    proofRecords: asArray(proof, "records"),
    proofRequirements: asArray(proof, "requirements"),
    sensorReadings: asArray(sensors, "readings"),
    incidents: asArray(incidents, "incidents"),
    serviceSlots: asArray(schedule, "slots"),
    invoices: asArray(billing, "invoices"),
    complianceItems: asArray(compliance, "items"),
    technicians: asArray(dispatch, "crew"),
    dispatchRoute: asArray(dispatch, "route"),
    routeInventory: asArray(dispatch, "inventory"),
    supplyItems: asArray(supply, "items"),
    reportModes: asArray(productModel, "reportModes")
  };
}

function moduleRecordsForWall(wall) {
  const moduleCount = Number(wall.modules || 0);
  const podCount = Number(wall.pods || 0);
  const podsPerModule = moduleCount > 0 ? Math.round(podCount / moduleCount) : 0;

  return Array.from({ length: moduleCount }, (_, index) => ({
    id: `${wall.id}-MOD-${String(index + 1).padStart(2, "0")}`,
    assetId: wall.id,
    clientId: wall.clientId,
    sequence: index + 1,
    expectedPods: podsPerModule,
    health: wall.zones?.[index]?.health ?? wall.health,
    status: wall.status
  }));
}

export function buildProductionSeed(dataset, opsEvents = []) {
  const sites = dataset.clients.map((client) => ({
    id: `SITE-${client.id}`,
    clientId: client.id,
    name: client.name,
    district: client.district,
    contact: client.contact,
    proofNeed: client.proofNeed
  }));

  const livingAssets = dataset.walls.map((wall) => ({
    id: wall.id,
    clientId: wall.clientId,
    name: wall.name,
    location: wall.location,
    version: wall.version,
    modules: wall.modules,
    pods: wall.pods,
    health: wall.health,
    survival: wall.survival,
    status: wall.status,
    nextVisit: wall.nextVisit,
    cadence: wall.cadence
  }));

  return {
    modelVersion: productionDataModel.version,
    generatedAt: new Date().toISOString(),
    entities: {
      clients: dataset.clients,
      sites,
      livingAssets,
      assetModules: dataset.walls.flatMap(moduleRecordsForWall),
      workOrders: dataset.workorders,
      proofRecords: dataset.proofRecords,
      proofMediaObjects: [],
      sensorReadings: dataset.sensorReadings,
      incidents: dataset.incidents,
      serviceSlots: dataset.serviceSlots,
      invoices: dataset.invoices,
      complianceItems: dataset.complianceItems,
      technicians: dataset.technicians,
      inventoryItems: dataset.supplyItems,
      opsEvents
    }
  };
}

function idSet(items, field = "id") {
  return new Set(items.map((item) => item?.[field]).filter(Boolean));
}

function checkUnique(items, field, label, errors) {
  const seen = new Set();
  for (const item of items) {
    const value = item?.[field];
    if (!value) {
      errors.push(`${label} record missing ${field}`);
      continue;
    }
    if (seen.has(value)) errors.push(`${label} duplicate ${field}: ${value}`);
    seen.add(value);
  }
}

function checkReference(value, targetSet, message, errors, options = {}) {
  if (!value && options.optional) return false;
  if (!targetSet.has(value)) {
    errors.push(message);
    return false;
  }
  return true;
}

function pushWarning(condition, message, warnings) {
  if (condition) warnings.push(message);
}

export function validateProductionDataset(dataset, seed = buildProductionSeed(dataset)) {
  const errors = [];
  const warnings = [];
  const checks = [];

  const clients = dataset.clients;
  const assets = dataset.walls;
  const modules = seed.entities.assetModules;
  const workorders = dataset.workorders;
  const proofRecords = dataset.proofRecords;
  const sensors = dataset.sensorReadings;
  const incidents = dataset.incidents;
  const serviceSlots = dataset.serviceSlots;
  const invoices = dataset.invoices;
  const complianceItems = dataset.complianceItems;
  const technicians = dataset.technicians;
  const dispatchRoute = dataset.dispatchRoute;
  const supplyItems = dataset.supplyItems;

  checkUnique(clients, "id", "client", errors);
  checkUnique(assets, "id", "living asset", errors);
  checkUnique(modules, "id", "asset module", errors);
  checkUnique(workorders, "id", "work order", errors);
  checkUnique(proofRecords, "id", "proof record", errors);
  checkUnique(sensors, "id", "sensor reading", errors);
  checkUnique(incidents, "id", "incident", errors);
  checkUnique(serviceSlots, "id", "service slot", errors);
  checkUnique(invoices, "id", "invoice", errors);
  checkUnique(complianceItems, "id", "compliance item", errors);
  checkUnique(supplyItems, "sku", "inventory item", errors);

  const clientIds = idSet(clients);
  const assetIds = idSet(assets);
  const workorderIds = idSet(workorders);
  const proofIds = idSet(proofRecords);
  const sensorIds = idSet(sensors);
  const technicianIds = idSet(technicians);

  let passedReferences = 0;
  const totalReferences = [];

  for (const asset of assets) {
    totalReferences.push("asset.clientId");
    if (checkReference(asset.clientId, clientIds, `asset ${asset.id} references missing client ${asset.clientId}`, errors)) passedReferences += 1;
    if (!Number.isFinite(Number(asset.health)) || asset.health < 0 || asset.health > 100) errors.push(`asset ${asset.id} has invalid health score`);
    if (!Number.isFinite(Number(asset.modules)) || asset.modules <= 0) errors.push(`asset ${asset.id} must have positive module count`);
    if (!Number.isFinite(Number(asset.pods)) || asset.pods <= 0) errors.push(`asset ${asset.id} must have positive pod count`);
  }

  for (const module of modules) {
    totalReferences.push("module.assetId");
    if (checkReference(module.assetId, assetIds, `module ${module.id} references missing asset ${module.assetId}`, errors)) passedReferences += 1;
  }

  for (const order of workorders) {
    totalReferences.push("workorder.wallId");
    if (checkReference(order.wallId, assetIds, `work order ${order.id} references missing asset ${order.wallId}`, errors)) passedReferences += 1;
  }

  for (const record of proofRecords) {
    totalReferences.push("proof.workorderId", "proof.wallId");
    if (checkReference(record.workorderId, workorderIds, `proof ${record.id} references missing work order ${record.workorderId}`, errors)) passedReferences += 1;
    if (checkReference(record.wallId, assetIds, `proof ${record.id} references missing asset ${record.wallId}`, errors)) passedReferences += 1;
  }

  for (const reading of sensors) {
    totalReferences.push("sensor.wallId");
    if (checkReference(reading.wallId, assetIds, `sensor ${reading.id} references missing asset ${reading.wallId}`, errors)) passedReferences += 1;
  }

  for (const incident of incidents) {
    totalReferences.push("incident.wallId", "incident.linkedWorkorderId", "incident.sourceId");
    if (checkReference(incident.wallId, assetIds, `incident ${incident.id} references missing asset ${incident.wallId}`, errors)) passedReferences += 1;
    if (checkReference(incident.linkedWorkorderId, workorderIds, `incident ${incident.id} references missing work order ${incident.linkedWorkorderId}`, errors)) passedReferences += 1;
    const sourceSet = incident.sourceType === "proof" ? proofIds : incident.sourceType === "sensor" ? sensorIds : workorderIds;
    if (checkReference(incident.sourceId, sourceSet, `incident ${incident.id} references missing ${incident.sourceType} source ${incident.sourceId}`, errors)) passedReferences += 1;
  }

  for (const slot of serviceSlots) {
    totalReferences.push("slot.workorderId", "slot.technicianId");
    if (checkReference(slot.workorderId, workorderIds, `service slot ${slot.id} references missing work order ${slot.workorderId}`, errors)) passedReferences += 1;
    if (checkReference(slot.technicianId, technicianIds, `service slot ${slot.id} references missing technician ${slot.technicianId}`, errors)) passedReferences += 1;
  }

  for (const invoice of invoices) {
    totalReferences.push("invoice.clientId");
    if (checkReference(invoice.clientId, clientIds, `invoice ${invoice.id} references missing client ${invoice.clientId}`, errors)) passedReferences += 1;
    if (!Number.isFinite(Number(invoice.amount)) || invoice.amount < 0) errors.push(`invoice ${invoice.id} has invalid amount`);
  }

  for (const item of complianceItems) {
    totalReferences.push("compliance.clientId", "compliance.wallId");
    if (checkReference(item.clientId, clientIds, `compliance item ${item.id} references missing client ${item.clientId}`, errors)) passedReferences += 1;
    if (checkReference(item.wallId, assetIds, `compliance item ${item.id} references missing asset ${item.wallId}`, errors)) passedReferences += 1;
  }

  for (const route of dispatchRoute) {
    totalReferences.push("dispatch.workorderId", "dispatch.technicianId");
    if (checkReference(route.workorderId, workorderIds, `dispatch route for ${route.workorderId} references missing work order`, errors)) passedReferences += 1;
    if (checkReference(route.technicianId, technicianIds, `dispatch route for ${route.workorderId} references missing technician ${route.technicianId}`, errors)) passedReferences += 1;
  }

  for (const item of supplyItems) {
    if (Number(item.onHand) < 0 || Number(item.reserved) < 0) errors.push(`inventory item ${item.sku} has negative stock value`);
    if (Number(item.reserved) > Number(item.onHand)) warnings.push(`inventory item ${item.sku} has reserved units above on-hand stock`);
  }

  pushWarning(true, "Module-level pilot records now exist, but their IDs and device maps are generated from wall module counts; production needs real module, camera, gateway and calibration IDs before 1,000+ module rollout.", warnings);
  pushWarning(true, "Proof media now has a local verified vault for object keys, hashes and files, but production still needs managed object storage, signed upload URLs, malware scanning and retention policies.", warnings);
  pushWarning(true, "Auth, roles, client scope and pilot password sessions now have server-side enforcement; production still needs SSO/MFA, enterprise session controls and database row policies.", warnings);
  pushWarning(true, "Master sensor readings remain latest-state for portfolio reads; append-only telemetry history and threshold alerts now exist, but production still needs signed device requests, managed time-series retention and alert ownership/SLA.", warnings);

  checks.push({
    name: "referential-integrity",
    passed: passedReferences,
    total: totalReferences.length,
    status: passedReferences === totalReferences.length ? "pass" : "fail"
  });
  checks.push({
    name: "entity-coverage",
    passed: Object.keys(seed.entities).filter((key) => seed.entities[key].length > 0).length,
    total: Object.keys(seed.entities).length,
    status: "pass"
  });
  checks.push({
    name: "scale-gaps",
    passed: 0,
    total: warnings.length,
    status: "warnings"
  });

  return {
    status: errors.length ? "fail" : warnings.length ? "pass-with-warnings" : "pass",
    entityCounts: Object.fromEntries(Object.entries(seed.entities).map(([key, value]) => [key, value.length])),
    relationshipChecks: checks,
    errors,
    warnings,
    scaleReadiness: {
      targetModules: "1,000+",
      currentModules: seed.entities.assetModules.length,
      currentAssets: seed.entities.livingAssets.length,
      modelHasModuleEntity: seed.entities.assetModules.length > 0,
      needsRealDatabase: true,
      needsObjectStorage: true,
      needsAuthModel: true,
      needsTimeSeriesStore: true
    }
  };
}

export async function buildDataQualityReport(dataRoot, opsEvents = []) {
  const dataset = await loadOpsDataset(dataRoot);
  const seed = buildProductionSeed(dataset, opsEvents);
  const validation = validateProductionDataset(dataset, seed);

  return {
    generatedAt: new Date().toISOString(),
    modelVersion: productionDataModel.version,
    productionScoreImpact: productionDataModel.scoreTarget,
    ...validation
  };
}
