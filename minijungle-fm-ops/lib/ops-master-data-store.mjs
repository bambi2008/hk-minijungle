import { mkdir, readFile } from "node:fs/promises";
import { DatabaseSync } from "node:sqlite";
import { dirname, join } from "node:path";

export const masterDataMigrationVersion = "2026-07-15.master-data-v1";
export const masterDataCrudVersion = "2026-07-15.master-crud-v1";

const masterDataFiles = {
  clients: "clients.json",
  walls: "walls.json",
  workorders: "workorders.json",
  proof: "proof.json",
  sensors: "sensors.json",
  incidents: "incidents.json"
};

function parseJson(value, fallback) {
  try {
    return JSON.parse(value || "");
  } catch {
    return fallback;
  }
}

async function readSeedJson(dataRoot, key) {
  return JSON.parse(await readFile(join(dataRoot, masterDataFiles[key]), "utf8"));
}

async function loadMasterSeed(dataRoot) {
  const [clients, walls, workorders, proof, sensors, incidents] = await Promise.all([
    readSeedJson(dataRoot, "clients"),
    readSeedJson(dataRoot, "walls"),
    readSeedJson(dataRoot, "workorders"),
    readSeedJson(dataRoot, "proof"),
    readSeedJson(dataRoot, "sensors"),
    readSeedJson(dataRoot, "incidents")
  ]);

  return {
    clients,
    walls,
    workorders,
    proofRecords: proof.records || [],
    sensorReadings: sensors.readings || [],
    incidents: incidents.incidents || []
  };
}

async function withDatabase(dbPath, callback) {
  await mkdir(dirname(dbPath), { recursive: true });
  const db = new DatabaseSync(dbPath);
  try {
    initializeMasterDataDatabase(db);
    return callback(db);
  } finally {
    db.close();
  }
}

function initializeMasterDataDatabase(db) {
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      segment TEXT,
      district TEXT,
      contact TEXT,
      plan TEXT,
      contract TEXT,
      renewal_date TEXT,
      renewal_risk TEXT,
      revenue REAL,
      proof_need TEXT,
      raw_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS living_assets (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL,
      name TEXT NOT NULL,
      location TEXT,
      version TEXT,
      modules INTEGER NOT NULL CHECK (modules > 0),
      pods INTEGER NOT NULL CHECK (pods > 0),
      health INTEGER CHECK (health BETWEEN 0 AND 100),
      survival INTEGER CHECK (survival BETWEEN 0 AND 100),
      issues INTEGER DEFAULT 0,
      next_visit TEXT,
      cadence TEXT,
      green_area REAL,
      water_saved REAL,
      service_miles_saved REAL,
      staff_reach INTEGER,
      co2e_proxy REAL,
      status TEXT,
      sensors_json TEXT NOT NULL,
      tags_json TEXT NOT NULL,
      raw_json TEXT NOT NULL,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON UPDATE CASCADE ON DELETE RESTRICT
    );

    CREATE INDEX IF NOT EXISTS idx_living_assets_client
      ON living_assets(client_id);

    CREATE INDEX IF NOT EXISTS idx_living_assets_status
      ON living_assets(status);

    CREATE TABLE IF NOT EXISTS asset_zones (
      asset_id TEXT NOT NULL,
      sequence INTEGER NOT NULL,
      name TEXT NOT NULL,
      pods INTEGER,
      health INTEGER CHECK (health BETWEEN 0 AND 100),
      issue TEXT,
      raw_json TEXT NOT NULL,
      PRIMARY KEY (asset_id, sequence),
      FOREIGN KEY (asset_id) REFERENCES living_assets(id) ON UPDATE CASCADE ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS work_orders (
      id TEXT PRIMARY KEY,
      wall_id TEXT NOT NULL,
      type TEXT NOT NULL,
      due TEXT,
      status TEXT,
      priority TEXT,
      tasks_json TEXT NOT NULL,
      raw_json TEXT NOT NULL,
      FOREIGN KEY (wall_id) REFERENCES living_assets(id) ON UPDATE CASCADE ON DELETE RESTRICT
    );

    CREATE INDEX IF NOT EXISTS idx_work_orders_wall
      ON work_orders(wall_id);

    CREATE INDEX IF NOT EXISTS idx_work_orders_status
      ON work_orders(status);

    CREATE TABLE IF NOT EXISTS proof_records (
      id TEXT PRIMARY KEY,
      workorder_id TEXT NOT NULL,
      wall_id TEXT NOT NULL,
      category TEXT,
      captured_at TEXT,
      source TEXT,
      status TEXT,
      tone TEXT,
      reviewer TEXT,
      evidence_json TEXT NOT NULL,
      note TEXT,
      raw_json TEXT NOT NULL,
      FOREIGN KEY (workorder_id) REFERENCES work_orders(id) ON UPDATE CASCADE ON DELETE RESTRICT,
      FOREIGN KEY (wall_id) REFERENCES living_assets(id) ON UPDATE CASCADE ON DELETE RESTRICT
    );

    CREATE INDEX IF NOT EXISTS idx_proof_records_wall
      ON proof_records(wall_id);

    CREATE TABLE IF NOT EXISTS sensor_readings (
      id TEXT PRIMARY KEY,
      wall_id TEXT NOT NULL,
      type TEXT,
      value REAL,
      unit TEXT,
      target TEXT,
      status TEXT,
      last_seen TEXT,
      action TEXT,
      raw_json TEXT NOT NULL,
      FOREIGN KEY (wall_id) REFERENCES living_assets(id) ON UPDATE CASCADE ON DELETE RESTRICT
    );

    CREATE INDEX IF NOT EXISTS idx_sensor_readings_wall
      ON sensor_readings(wall_id);

    CREATE INDEX IF NOT EXISTS idx_sensor_readings_status
      ON sensor_readings(status);

    CREATE TABLE IF NOT EXISTS incidents (
      id TEXT PRIMARY KEY,
      wall_id TEXT NOT NULL,
      source_type TEXT,
      source_id TEXT,
      linked_workorder_id TEXT NOT NULL,
      category TEXT,
      severity TEXT,
      status TEXT,
      opened_at TEXT,
      due_date TEXT,
      owner TEXT,
      sla_hours INTEGER,
      impact TEXT,
      recommended_action TEXT,
      proof_required_json TEXT NOT NULL,
      raw_json TEXT NOT NULL,
      FOREIGN KEY (wall_id) REFERENCES living_assets(id) ON UPDATE CASCADE ON DELETE RESTRICT,
      FOREIGN KEY (linked_workorder_id) REFERENCES work_orders(id) ON UPDATE CASCADE ON DELETE RESTRICT
    );

    CREATE INDEX IF NOT EXISTS idx_incidents_wall
      ON incidents(wall_id);

    CREATE INDEX IF NOT EXISTS idx_incidents_status
      ON incidents(status);
  `);

  db.prepare(`
    INSERT OR IGNORE INTO schema_migrations (version, applied_at)
    VALUES (?, ?)
  `).run(masterDataMigrationVersion, new Date().toISOString());

  db.prepare(`
    INSERT OR IGNORE INTO schema_migrations (version, applied_at)
    VALUES (?, ?)
  `).run(masterDataCrudVersion, new Date().toISOString());
}

function validationError(message) {
  const error = new Error(message);
  error.status = 400;
  error.code = "MASTER_DATA_VALIDATION_ERROR";
  return error;
}

function rethrowConstraint(error, fallbackMessage) {
  const message = String(error?.message || "");
  if (message.includes("constraint failed") || message.includes("SQLITE_CONSTRAINT")) {
    throw validationError(fallbackMessage);
  }
  throw error;
}

function requireString(value, field) {
  const text = String(value || "").trim();
  if (!text) throw validationError(`${field} is required`);
  return text;
}

function boundedNumber(value, field, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max) {
    throw validationError(`${field} must be between ${min} and ${max}`);
  }
  return number;
}

function positiveInteger(value, field) {
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) {
    throw validationError(`${field} must be a positive integer`);
  }
  return number;
}

function clearMasterData(db) {
  db.exec(`
    DELETE FROM incidents;
    DELETE FROM sensor_readings;
    DELETE FROM proof_records;
    DELETE FROM work_orders;
    DELETE FROM asset_zones;
    DELETE FROM living_assets;
    DELETE FROM clients;
  `);
}

function seedClients(db, clients) {
  const insert = db.prepare(`
    INSERT INTO clients (
      id, name, segment, district, contact, plan, contract, renewal_date, renewal_risk, revenue, proof_need, raw_json
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const client of clients) {
    insert.run(
      client.id,
      client.name,
      client.segment || null,
      client.district || null,
      client.contact || null,
      client.plan || null,
      client.contract || null,
      client.renewalDate || null,
      client.renewalRisk || null,
      Number(client.revenue || 0),
      client.proofNeed || null,
      JSON.stringify(client)
    );
  }
}

function seedLivingAssets(db, walls) {
  const insertAsset = db.prepare(`
    INSERT INTO living_assets (
      id, client_id, name, location, version, modules, pods, health, survival, issues, next_visit, cadence,
      green_area, water_saved, service_miles_saved, staff_reach, co2e_proxy, status, sensors_json, tags_json, raw_json
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertZone = db.prepare(`
    INSERT INTO asset_zones (asset_id, sequence, name, pods, health, issue, raw_json)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  for (const wall of walls) {
    insertAsset.run(
      wall.id,
      wall.clientId,
      wall.name,
      wall.location || null,
      wall.version || null,
      Number(wall.modules || 0),
      Number(wall.pods || 0),
      Number(wall.health || 0),
      Number(wall.survival || 0),
      Number(wall.issues || 0),
      wall.nextVisit || null,
      wall.cadence || null,
      Number(wall.greenArea || 0),
      Number(wall.waterSaved || 0),
      Number(wall.serviceMilesSaved || 0),
      Number(wall.staffReach || 0),
      Number(wall.co2eProxy || 0),
      wall.status || null,
      JSON.stringify(wall.sensors || []),
      JSON.stringify(wall.tags || []),
      JSON.stringify(wall)
    );

    (wall.zones || []).forEach((zone, index) => {
      insertZone.run(
        wall.id,
        index + 1,
        zone.name,
        Number(zone.pods || 0),
        Number(zone.health || 0),
        zone.issue || null,
        JSON.stringify(zone)
      );
    });
  }
}

function seedWorkOrders(db, workorders) {
  const insert = db.prepare(`
    INSERT INTO work_orders (id, wall_id, type, due, status, priority, tasks_json, raw_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const order of workorders) {
    insert.run(
      order.id,
      order.wallId,
      order.type,
      order.due || null,
      order.status || null,
      order.priority || null,
      JSON.stringify(order.tasks || []),
      JSON.stringify(order)
    );
  }
}

function seedProofRecords(db, proofRecords) {
  const insert = db.prepare(`
    INSERT INTO proof_records (
      id, workorder_id, wall_id, category, captured_at, source, status, tone, reviewer, evidence_json, note, raw_json
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const record of proofRecords) {
    insert.run(
      record.id,
      record.workorderId,
      record.wallId,
      record.category || null,
      record.capturedAt || null,
      record.source || null,
      record.status || null,
      record.tone || null,
      record.reviewer || null,
      JSON.stringify(record.evidence || []),
      record.note || null,
      JSON.stringify(record)
    );
  }
}

function seedSensorReadings(db, sensorReadings) {
  const insert = db.prepare(`
    INSERT INTO sensor_readings (id, wall_id, type, value, unit, target, status, last_seen, action, raw_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const reading of sensorReadings) {
    insert.run(
      reading.id,
      reading.wallId,
      reading.type || null,
      Number(reading.value || 0),
      reading.unit || null,
      reading.target || null,
      reading.status || null,
      reading.lastSeen || null,
      reading.action || null,
      JSON.stringify(reading)
    );
  }
}

function seedIncidents(db, incidents) {
  const insert = db.prepare(`
    INSERT INTO incidents (
      id, wall_id, source_type, source_id, linked_workorder_id, category, severity, status, opened_at, due_date,
      owner, sla_hours, impact, recommended_action, proof_required_json, raw_json
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const incident of incidents) {
    insert.run(
      incident.id,
      incident.wallId,
      incident.sourceType || null,
      incident.sourceId || null,
      incident.linkedWorkorderId,
      incident.category || null,
      incident.severity || null,
      incident.status || null,
      incident.openedAt || null,
      incident.dueDate || null,
      incident.owner || null,
      Number(incident.slaHours || 0),
      incident.impact || null,
      incident.recommendedAction || null,
      JSON.stringify(incident.proofRequired || []),
      JSON.stringify(incident)
    );
  }
}

function applyMasterSeed(db, seed) {
  clearMasterData(db);
  seedClients(db, seed.clients);
  seedLivingAssets(db, seed.walls);
  seedWorkOrders(db, seed.workorders);
  seedProofRecords(db, seed.proofRecords);
  seedSensorReadings(db, seed.sensorReadings);
  seedIncidents(db, seed.incidents);
  return seed;
}

async function ensureMasterDataSeeded(dbPath, dataRoot) {
  const seed = await loadMasterSeed(dataRoot);
  return withDatabase(dbPath, (db) => {
    const clientCount = db.prepare("SELECT COUNT(*) AS count FROM clients").get().count;
    if (clientCount > 0) return { seeded: false };

    db.exec("BEGIN IMMEDIATE");
    try {
      applyMasterSeed(db, seed);
      db.exec("COMMIT");
      return { seeded: true };
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  });
}

function clientFromRow(row) {
  return {
    ...parseJson(row.raw_json, {}),
    id: row.id,
    name: row.name,
    segment: row.segment,
    district: row.district,
    contact: row.contact,
    plan: row.plan,
    contract: row.contract,
    renewalDate: row.renewal_date,
    renewalRisk: row.renewal_risk,
    revenue: row.revenue,
    proofNeed: row.proof_need
  };
}

function wallFromRow(row, zones = []) {
  return {
    ...parseJson(row.raw_json, {}),
    id: row.id,
    clientId: row.client_id,
    name: row.name,
    location: row.location,
    version: row.version,
    modules: row.modules,
    pods: row.pods,
    health: row.health,
    survival: row.survival,
    issues: row.issues,
    nextVisit: row.next_visit,
    cadence: row.cadence,
    greenArea: row.green_area,
    waterSaved: row.water_saved,
    serviceMilesSaved: row.service_miles_saved,
    staffReach: row.staff_reach,
    co2eProxy: row.co2e_proxy,
    status: row.status,
    sensors: parseJson(row.sensors_json, []),
    tags: parseJson(row.tags_json, []),
    zones
  };
}

function workorderFromRow(row) {
  return {
    ...parseJson(row.raw_json, {}),
    id: row.id,
    wallId: row.wall_id,
    type: row.type,
    due: row.due,
    status: row.status,
    priority: row.priority,
    tasks: parseJson(row.tasks_json, [])
  };
}

function proofFromRow(row) {
  return {
    ...parseJson(row.raw_json, {}),
    id: row.id,
    workorderId: row.workorder_id,
    wallId: row.wall_id,
    category: row.category,
    capturedAt: row.captured_at,
    source: row.source,
    status: row.status,
    tone: row.tone,
    reviewer: row.reviewer,
    evidence: parseJson(row.evidence_json, []),
    note: row.note
  };
}

function sensorFromRow(row) {
  return {
    ...parseJson(row.raw_json, {}),
    id: row.id,
    wallId: row.wall_id,
    type: row.type,
    value: row.value,
    unit: row.unit,
    target: row.target,
    status: row.status,
    lastSeen: row.last_seen,
    action: row.action
  };
}

function incidentFromRow(row) {
  return {
    ...parseJson(row.raw_json, {}),
    id: row.id,
    wallId: row.wall_id,
    sourceType: row.source_type,
    sourceId: row.source_id,
    linkedWorkorderId: row.linked_workorder_id,
    category: row.category,
    severity: row.severity,
    status: row.status,
    openedAt: row.opened_at,
    dueDate: row.due_date,
    owner: row.owner,
    slaHours: row.sla_hours,
    impact: row.impact,
    recommendedAction: row.recommended_action,
    proofRequired: parseJson(row.proof_required_json, [])
  };
}

function readDatasetFromDb(db) {
  const clients = db.prepare("SELECT * FROM clients ORDER BY id ASC").all().map(clientFromRow);
  const zoneRows = db.prepare("SELECT * FROM asset_zones ORDER BY asset_id ASC, sequence ASC").all();
  const zonesByAsset = new Map();
  for (const row of zoneRows) {
    const zone = {
      name: row.name,
      pods: row.pods,
      health: row.health,
      issue: row.issue
    };
    zonesByAsset.set(row.asset_id, [...(zonesByAsset.get(row.asset_id) || []), zone]);
  }
  const walls = db.prepare("SELECT * FROM living_assets ORDER BY id ASC").all()
    .map((row) => wallFromRow(row, zonesByAsset.get(row.id) || []));
  const workorders = db.prepare("SELECT * FROM work_orders ORDER BY id ASC").all().map(workorderFromRow);
  const proofRecords = db.prepare("SELECT * FROM proof_records ORDER BY id ASC").all().map(proofFromRow);
  const sensorReadings = db.prepare("SELECT * FROM sensor_readings ORDER BY id ASC").all().map(sensorFromRow);
  const incidents = db.prepare("SELECT * FROM incidents ORDER BY id ASC").all().map(incidentFromRow);

  return {
    clients,
    walls,
    workorders,
    proofRecords,
    sensorReadings,
    incidents
  };
}

export async function readSqliteMasterDataset(dbPath, dataRoot) {
  await ensureMasterDataSeeded(dbPath, dataRoot);
  return withDatabase(dbPath, readDatasetFromDb);
}

function readMasterDataHealthFromDb(db) {
  const count = (table) => db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get().count;
  const foreignKeyIssues = db.prepare("PRAGMA foreign_key_check").all();
  const tables = db.prepare(`
    SELECT name
    FROM sqlite_master
    WHERE type = 'table'
      AND name IN ('clients', 'living_assets', 'asset_zones', 'work_orders', 'proof_records', 'sensor_readings', 'incidents')
    ORDER BY name ASC
  `).all().map((row) => row.name);

  return {
    migrationVersion: masterDataMigrationVersion,
    crudVersion: masterDataCrudVersion,
    source: "sqlite-master-data",
    seedSource: "json-import",
    sourceFiles: Object.values(masterDataFiles),
    tables,
    counts: {
      clients: count("clients"),
      livingAssets: count("living_assets"),
      assetZones: count("asset_zones"),
      workOrders: count("work_orders"),
      proofRecords: count("proof_records"),
      sensorReadings: count("sensor_readings"),
      incidents: count("incidents")
    },
    relationshipIntegrity: {
      foreignKeysEnabled: db.prepare("PRAGMA foreign_keys").get().foreign_keys === 1,
      foreignKeyIssues: foreignKeyIssues.length
    }
  };
}

export async function importSqliteMasterData(dbPath, dataRoot) {
  const seed = await loadMasterSeed(dataRoot);
  return withDatabase(dbPath, (db) => {
    db.exec("BEGIN IMMEDIATE");
    try {
      applyMasterSeed(db, seed);
      db.exec("COMMIT");
      return readMasterDataHealthFromDb(db);
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  });
}

export async function readSqliteMasterDataHealth(dbPath, dataRoot) {
  await ensureMasterDataSeeded(dbPath, dataRoot);
  return withDatabase(dbPath, readMasterDataHealthFromDb);
}

export async function upsertSqliteClient(dbPath, dataRoot, input) {
  await ensureMasterDataSeeded(dbPath, dataRoot);
  const client = {
    id: requireString(input.id, "client.id"),
    name: requireString(input.name, "client.name"),
    segment: input.segment || null,
    district: input.district || null,
    contact: input.contact || null,
    plan: input.plan || null,
    contract: input.contract || null,
    renewalDate: input.renewalDate || null,
    renewalRisk: input.renewalRisk || null,
    revenue: Number(input.revenue || 0),
    proofNeed: input.proofNeed || null
  };

  return withDatabase(dbPath, (db) => {
    db.prepare(`
      INSERT INTO clients (
        id, name, segment, district, contact, plan, contract, renewal_date, renewal_risk, revenue, proof_need, raw_json
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        segment = excluded.segment,
        district = excluded.district,
        contact = excluded.contact,
        plan = excluded.plan,
        contract = excluded.contract,
        renewal_date = excluded.renewal_date,
        renewal_risk = excluded.renewal_risk,
        revenue = excluded.revenue,
        proof_need = excluded.proof_need,
        raw_json = excluded.raw_json
    `).run(
      client.id,
      client.name,
      client.segment,
      client.district,
      client.contact,
      client.plan,
      client.contract,
      client.renewalDate,
      client.renewalRisk,
      client.revenue,
      client.proofNeed,
      JSON.stringify(client)
    );

    return clientFromRow(db.prepare("SELECT * FROM clients WHERE id = ?").get(client.id));
  });
}

export async function upsertSqliteLivingAsset(dbPath, dataRoot, input) {
  await ensureMasterDataSeeded(dbPath, dataRoot);
  const wall = {
    id: requireString(input.id, "asset.id"),
    clientId: requireString(input.clientId, "asset.clientId"),
    name: requireString(input.name, "asset.name"),
    location: input.location || null,
    version: input.version || "Standard",
    modules: positiveInteger(input.modules, "asset.modules"),
    pods: positiveInteger(input.pods, "asset.pods"),
    health: boundedNumber(input.health ?? 80, "asset.health", 0, 100),
    survival: boundedNumber(input.survival ?? 90, "asset.survival", 0, 100),
    issues: Number(input.issues || 0),
    nextVisit: input.nextVisit || null,
    cadence: input.cadence || null,
    greenArea: Number(input.greenArea || 0),
    waterSaved: Number(input.waterSaved || 0),
    serviceMilesSaved: Number(input.serviceMilesSaved || 0),
    staffReach: Number(input.staffReach || 0),
    co2eProxy: Number(input.co2eProxy || 0),
    status: input.status || "stable",
    sensors: Array.isArray(input.sensors) ? input.sensors : [],
    tags: Array.isArray(input.tags) ? input.tags : [],
    zones: Array.isArray(input.zones) ? input.zones : []
  };

  return withDatabase(dbPath, (db) => {
    db.exec("BEGIN IMMEDIATE");
    try {
      db.prepare(`
        INSERT INTO living_assets (
          id, client_id, name, location, version, modules, pods, health, survival, issues, next_visit, cadence,
          green_area, water_saved, service_miles_saved, staff_reach, co2e_proxy, status, sensors_json, tags_json, raw_json
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          client_id = excluded.client_id,
          name = excluded.name,
          location = excluded.location,
          version = excluded.version,
          modules = excluded.modules,
          pods = excluded.pods,
          health = excluded.health,
          survival = excluded.survival,
          issues = excluded.issues,
          next_visit = excluded.next_visit,
          cadence = excluded.cadence,
          green_area = excluded.green_area,
          water_saved = excluded.water_saved,
          service_miles_saved = excluded.service_miles_saved,
          staff_reach = excluded.staff_reach,
          co2e_proxy = excluded.co2e_proxy,
          status = excluded.status,
          sensors_json = excluded.sensors_json,
          tags_json = excluded.tags_json,
          raw_json = excluded.raw_json
      `).run(
        wall.id,
        wall.clientId,
        wall.name,
        wall.location,
        wall.version,
        wall.modules,
        wall.pods,
        wall.health,
        wall.survival,
        wall.issues,
        wall.nextVisit,
        wall.cadence,
        wall.greenArea,
        wall.waterSaved,
        wall.serviceMilesSaved,
        wall.staffReach,
        wall.co2eProxy,
        wall.status,
        JSON.stringify(wall.sensors),
        JSON.stringify(wall.tags),
        JSON.stringify(wall)
      );

      db.prepare("DELETE FROM asset_zones WHERE asset_id = ?").run(wall.id);
      const insertZone = db.prepare(`
        INSERT INTO asset_zones (asset_id, sequence, name, pods, health, issue, raw_json)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      wall.zones.forEach((zone, index) => {
        insertZone.run(
          wall.id,
          index + 1,
          requireString(zone.name || `Zone ${index + 1}`, "zone.name"),
          Number(zone.pods || 0),
          boundedNumber(zone.health ?? wall.health, "zone.health", 0, 100),
          zone.issue || null,
          JSON.stringify(zone)
        );
      });

      db.exec("COMMIT");
      return wallFromRow(db.prepare("SELECT * FROM living_assets WHERE id = ?").get(wall.id), wall.zones);
    } catch (error) {
      db.exec("ROLLBACK");
      rethrowConstraint(error, "asset references a missing client or violates asset constraints");
    }
  });
}

export async function upsertSqliteWorkOrder(dbPath, dataRoot, input) {
  await ensureMasterDataSeeded(dbPath, dataRoot);
  const order = {
    id: requireString(input.id, "workorder.id"),
    wallId: requireString(input.wallId, "workorder.wallId"),
    type: requireString(input.type, "workorder.type"),
    due: input.due || null,
    status: input.status || "Scheduled",
    priority: input.priority || "medium",
    tasks: Array.isArray(input.tasks) ? input.tasks : []
  };

  return withDatabase(dbPath, (db) => {
    try {
      db.prepare(`
        INSERT INTO work_orders (id, wall_id, type, due, status, priority, tasks_json, raw_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          wall_id = excluded.wall_id,
          type = excluded.type,
          due = excluded.due,
          status = excluded.status,
          priority = excluded.priority,
          tasks_json = excluded.tasks_json,
          raw_json = excluded.raw_json
      `).run(
        order.id,
        order.wallId,
        order.type,
        order.due,
        order.status,
        order.priority,
        JSON.stringify(order.tasks),
        JSON.stringify(order)
      );
      return workorderFromRow(db.prepare("SELECT * FROM work_orders WHERE id = ?").get(order.id));
    } catch (error) {
      rethrowConstraint(error, "work order references a missing living asset");
    }
  });
}

export async function upsertSqliteSensorReading(dbPath, dataRoot, input) {
  await ensureMasterDataSeeded(dbPath, dataRoot);
  const reading = {
    id: requireString(input.id, "sensor.id"),
    wallId: requireString(input.wallId, "sensor.wallId"),
    type: input.type || null,
    value: Number(input.value || 0),
    unit: input.unit || null,
    target: input.target || null,
    status: input.status || "ok",
    lastSeen: input.lastSeen || null,
    action: input.action || null
  };

  return withDatabase(dbPath, (db) => {
    try {
      db.prepare(`
        INSERT INTO sensor_readings (id, wall_id, type, value, unit, target, status, last_seen, action, raw_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          wall_id = excluded.wall_id,
          type = excluded.type,
          value = excluded.value,
          unit = excluded.unit,
          target = excluded.target,
          status = excluded.status,
          last_seen = excluded.last_seen,
          action = excluded.action,
          raw_json = excluded.raw_json
      `).run(
        reading.id,
        reading.wallId,
        reading.type,
        reading.value,
        reading.unit,
        reading.target,
        reading.status,
        reading.lastSeen,
        reading.action,
        JSON.stringify(reading)
      );
      return sensorFromRow(db.prepare("SELECT * FROM sensor_readings WHERE id = ?").get(reading.id));
    } catch (error) {
      rethrowConstraint(error, "sensor reading references a missing living asset");
    }
  });
}
