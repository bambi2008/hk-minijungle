import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getPostgresPool } from "./ops-postgres-store.mjs";

export const postgresMasterDataMigrationVersion = "2026-08-19.postgres-master-data-v1";
export const postgresMasterDataCrudVersion = "2026-08-19.postgres-master-crud-v1";

function parseJson(value, fallback) { if (value && typeof value === "object") return value; try { return JSON.parse(value || ""); } catch { return fallback; } }
function validationError(message, code = "MASTER_DATA_VALIDATION_ERROR", status = 400) { const error = new Error(message); error.code = code; error.status = status; return error; }
function required(value, field) { const result = String(value || "").trim(); if (!result) throw validationError(`${field} is required`); return result; }
function bounded(value, field, min, max) { const result = Number(value); if (!Number.isFinite(result) || result < min || result > max) throw validationError(`${field} must be between ${min} and ${max}`); return result; }
function positive(value, field) { const result = Number(value); if (!Number.isInteger(result) || result <= 0) throw validationError(`${field} must be a positive integer`); return result; }
async function seedJson(dataRoot, name) { return JSON.parse(await readFile(join(dataRoot, name), "utf8")); }
async function loadSeed(dataRoot) {
  const [clients, walls, workorders, proof, sensors, incidents] = await Promise.all([
    seedJson(dataRoot, "clients.json"), seedJson(dataRoot, "walls.json"), seedJson(dataRoot, "workorders.json"), seedJson(dataRoot, "proof.json"), seedJson(dataRoot, "sensors.json"), seedJson(dataRoot, "incidents.json")
  ]);
  return { clients, walls, workorders, proofRecords: proof.records || [], sensorReadings: sensors.readings || [], incidents: incidents.incidents || [] };
}

async function initialize(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL);
    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, segment TEXT, district TEXT, contact TEXT, plan TEXT, contract TEXT,
      renewal_date TEXT, renewal_risk TEXT, revenue DOUBLE PRECISION, proof_need TEXT, raw_json TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS living_assets (
      id TEXT PRIMARY KEY, client_id TEXT NOT NULL REFERENCES clients(id) ON UPDATE CASCADE ON DELETE RESTRICT,
      name TEXT NOT NULL, location TEXT, version TEXT, modules BIGINT NOT NULL, pods BIGINT NOT NULL,
      health DOUBLE PRECISION, survival DOUBLE PRECISION, issues BIGINT DEFAULT 0, next_visit TEXT, cadence TEXT,
      green_area DOUBLE PRECISION, water_saved DOUBLE PRECISION, service_miles_saved DOUBLE PRECISION,
      staff_reach BIGINT, co2e_proxy DOUBLE PRECISION, status TEXT, sensors_json TEXT NOT NULL,
      tags_json TEXT NOT NULL, raw_json TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS asset_zones (
      asset_id TEXT NOT NULL REFERENCES living_assets(id) ON UPDATE CASCADE ON DELETE CASCADE,
      sequence BIGINT NOT NULL, name TEXT NOT NULL, pods BIGINT, health DOUBLE PRECISION, issue TEXT, raw_json TEXT NOT NULL,
      PRIMARY KEY (asset_id, sequence)
    );
    CREATE TABLE IF NOT EXISTS work_orders (
      id TEXT PRIMARY KEY, wall_id TEXT NOT NULL REFERENCES living_assets(id) ON UPDATE CASCADE ON DELETE RESTRICT,
      type TEXT NOT NULL, due TEXT, status TEXT, priority TEXT, tasks_json TEXT NOT NULL, raw_json TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS proof_records (
      id TEXT PRIMARY KEY, workorder_id TEXT NOT NULL REFERENCES work_orders(id) ON UPDATE CASCADE ON DELETE RESTRICT,
      wall_id TEXT NOT NULL REFERENCES living_assets(id) ON UPDATE CASCADE ON DELETE RESTRICT,
      category TEXT, captured_at TEXT, source TEXT, status TEXT, tone TEXT, reviewer TEXT,
      evidence_json TEXT NOT NULL, note TEXT, raw_json TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sensor_readings (
      id TEXT PRIMARY KEY, wall_id TEXT NOT NULL REFERENCES living_assets(id) ON UPDATE CASCADE ON DELETE RESTRICT,
      type TEXT, value DOUBLE PRECISION, unit TEXT, target TEXT, status TEXT, last_seen TEXT, action TEXT, raw_json TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS incidents (
      id TEXT PRIMARY KEY, wall_id TEXT NOT NULL REFERENCES living_assets(id) ON UPDATE CASCADE ON DELETE RESTRICT,
      source_type TEXT, source_id TEXT, linked_workorder_id TEXT NOT NULL REFERENCES work_orders(id) ON UPDATE CASCADE ON DELETE RESTRICT,
      category TEXT, severity TEXT, status TEXT, opened_at TEXT, due_date TEXT, owner TEXT, sla_hours BIGINT,
      impact TEXT, recommended_action TEXT, proof_required_json TEXT NOT NULL, raw_json TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_pg_living_assets_client ON living_assets(client_id);
    CREATE INDEX IF NOT EXISTS idx_pg_work_orders_wall ON work_orders(wall_id);
    CREATE INDEX IF NOT EXISTS idx_pg_proof_records_wall ON proof_records(wall_id);
    CREATE INDEX IF NOT EXISTS idx_pg_sensor_readings_wall ON sensor_readings(wall_id);
    CREATE INDEX IF NOT EXISTS idx_pg_incidents_wall ON incidents(wall_id);
    INSERT INTO schema_migrations (version, applied_at) VALUES ($1, NOW()) ON CONFLICT (version) DO NOTHING;
    INSERT INTO schema_migrations (version, applied_at) VALUES ($2, NOW()) ON CONFLICT (version) DO NOTHING;
  `, [postgresMasterDataMigrationVersion, postgresMasterDataCrudVersion]);
}

function clientFromRow(row) { return { ...parseJson(row.raw_json, {}), id: row.id, name: row.name, segment: row.segment, district: row.district, contact: row.contact, plan: row.plan, contract: row.contract, renewalDate: row.renewal_date, renewalRisk: row.renewal_risk, revenue: Number(row.revenue || 0), proofNeed: row.proof_need }; }
function wallFromRow(row, zones = []) { return { ...parseJson(row.raw_json, {}), id: row.id, clientId: row.client_id, name: row.name, location: row.location, version: row.version, modules: Number(row.modules || 0), pods: Number(row.pods || 0), health: Number(row.health || 0), survival: Number(row.survival || 0), issues: Number(row.issues || 0), nextVisit: row.next_visit, cadence: row.cadence, greenArea: Number(row.green_area || 0), waterSaved: Number(row.water_saved || 0), serviceMilesSaved: Number(row.service_miles_saved || 0), staffReach: Number(row.staff_reach || 0), co2eProxy: Number(row.co2e_proxy || 0), status: row.status, sensors: parseJson(row.sensors_json, []), tags: parseJson(row.tags_json, []), zones }; }
function workorderFromRow(row) { return { ...parseJson(row.raw_json, {}), id: row.id, wallId: row.wall_id, type: row.type, due: row.due, status: row.status, priority: row.priority, tasks: parseJson(row.tasks_json, []) }; }
function proofFromRow(row) { return { ...parseJson(row.raw_json, {}), id: row.id, workorderId: row.workorder_id, wallId: row.wall_id, category: row.category, capturedAt: row.captured_at, source: row.source, status: row.status, tone: row.tone, reviewer: row.reviewer, evidence: parseJson(row.evidence_json, []), note: row.note }; }
function sensorFromRow(row) { return { ...parseJson(row.raw_json, {}), id: row.id, wallId: row.wall_id, type: row.type, value: Number(row.value || 0), unit: row.unit, target: row.target, status: row.status, lastSeen: row.last_seen, action: row.action }; }
function incidentFromRow(row) { return { ...parseJson(row.raw_json, {}), id: row.id, wallId: row.wall_id, sourceType: row.source_type, sourceId: row.source_id, linkedWorkorderId: row.linked_workorder_id, category: row.category, severity: row.severity, status: row.status, openedAt: row.opened_at, dueDate: row.due_date, owner: row.owner, slaHours: Number(row.sla_hours || 0), impact: row.impact, recommendedAction: row.recommended_action, proofRequired: parseJson(row.proof_required_json, []) }; }

async function readDataset(pool) {
  const [clients, walls, zones, workorders, proofRecords, sensorReadings, incidents] = await Promise.all([
    pool.query("SELECT * FROM clients ORDER BY id ASC"), pool.query("SELECT * FROM living_assets ORDER BY id ASC"), pool.query("SELECT * FROM asset_zones ORDER BY asset_id ASC, sequence ASC"), pool.query("SELECT * FROM work_orders ORDER BY id ASC"), pool.query("SELECT * FROM proof_records ORDER BY id ASC"), pool.query("SELECT * FROM sensor_readings ORDER BY id ASC"), pool.query("SELECT * FROM incidents ORDER BY id ASC")
  ]);
  const zonesByAsset = new Map();
  for (const row of zones.rows) zonesByAsset.set(row.asset_id, [...(zonesByAsset.get(row.asset_id) || []), { name: row.name, pods: Number(row.pods || 0), health: Number(row.health || 0), issue: row.issue }]);
  return { clients: clients.rows.map(clientFromRow), walls: walls.rows.map((row) => wallFromRow(row, zonesByAsset.get(row.id) || [])), workorders: workorders.rows.map(workorderFromRow), proofRecords: proofRecords.rows.map(proofFromRow), sensorReadings: sensorReadings.rows.map(sensorFromRow), incidents: incidents.rows.map(incidentFromRow) };
}
async function ensureSeeded(pool, dataRoot) {
  const count = Number((await pool.query("SELECT COUNT(*)::int AS count FROM clients")).rows[0].count);
  return { seeded: false, empty: count === 0 };
}
async function importSeed(pool, seed) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    // Refuse to delete dependent operational tables. Foreign-key errors are safer than cascading through modules or devices.
    await client.query("DELETE FROM incidents");
    await client.query("DELETE FROM proof_records");
    await client.query("DELETE FROM sensor_readings");
    await client.query("DELETE FROM work_orders");
    await client.query("DELETE FROM asset_zones");
    await client.query("DELETE FROM living_assets");
    await client.query("DELETE FROM clients");
    for (const item of seed.clients) await client.query("INSERT INTO clients (id, name, segment, district, contact, plan, contract, renewal_date, renewal_risk, revenue, proof_need, raw_json) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)", [item.id, item.name, item.segment || null, item.district || null, item.contact || null, item.plan || null, item.contract || null, item.renewalDate || null, item.renewalRisk || null, Number(item.revenue || 0), item.proofNeed || null, JSON.stringify(item)]);
    for (const item of seed.walls) {
      await client.query("INSERT INTO living_assets (id, client_id, name, location, version, modules, pods, health, survival, issues, next_visit, cadence, green_area, water_saved, service_miles_saved, staff_reach, co2e_proxy, status, sensors_json, tags_json, raw_json) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)", [item.id, item.clientId, item.name, item.location || null, item.version || null, Number(item.modules || 0), Number(item.pods || 0), Number(item.health || 0), Number(item.survival || 0), Number(item.issues || 0), item.nextVisit || null, item.cadence || null, Number(item.greenArea || 0), Number(item.waterSaved || 0), Number(item.serviceMilesSaved || 0), Number(item.staffReach || 0), Number(item.co2eProxy || 0), item.status || null, JSON.stringify(item.sensors || []), JSON.stringify(item.tags || []), JSON.stringify(item)]);
      for (const [index, zone] of (item.zones || []).entries()) await client.query("INSERT INTO asset_zones (asset_id, sequence, name, pods, health, issue, raw_json) VALUES ($1,$2,$3,$4,$5,$6,$7)", [item.id, index + 1, zone.name, Number(zone.pods || 0), Number(zone.health || 0), zone.issue || null, JSON.stringify(zone)]);
    }
    for (const item of seed.workorders) await client.query("INSERT INTO work_orders (id, wall_id, type, due, status, priority, tasks_json, raw_json) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)", [item.id, item.wallId, item.type, item.due || null, item.status || null, item.priority || null, JSON.stringify(item.tasks || []), JSON.stringify(item)]);
    for (const item of seed.proofRecords) await client.query("INSERT INTO proof_records (id, workorder_id, wall_id, category, captured_at, source, status, tone, reviewer, evidence_json, note, raw_json) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)", [item.id, item.workorderId, item.wallId, item.category || null, item.capturedAt || null, item.source || null, item.status || null, item.tone || null, item.reviewer || null, JSON.stringify(item.evidence || []), item.note || null, JSON.stringify(item)]);
    for (const item of seed.sensorReadings) await client.query("INSERT INTO sensor_readings (id, wall_id, type, value, unit, target, status, last_seen, action, raw_json) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)", [item.id, item.wallId, item.type || null, Number(item.value || 0), item.unit || null, item.target || null, item.status || null, item.lastSeen || null, item.action || null, JSON.stringify(item)]);
    for (const item of seed.incidents) await client.query("INSERT INTO incidents (id, wall_id, source_type, source_id, linked_workorder_id, category, severity, status, opened_at, due_date, owner, sla_hours, impact, recommended_action, proof_required_json, raw_json) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)", [item.id, item.wallId, item.sourceType || null, item.sourceId || null, item.linkedWorkorderId, item.category || null, item.severity || null, item.status || null, item.openedAt || null, item.dueDate || null, item.owner || null, Number(item.slaHours || 0), item.impact || null, item.recommendedAction || null, JSON.stringify(item.proofRequired || []), JSON.stringify(item)]);
    await client.query("COMMIT");
  } catch (error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); }
}

export async function readPostgresMasterDataset(dbPath, dataRoot) { const pool = getPostgresPool(); await initialize(pool); await ensureSeeded(pool, dataRoot); return readDataset(pool); }
export async function importPostgresMasterData(dbPath, dataRoot) { const pool = getPostgresPool(); await initialize(pool); await importSeed(pool, await loadSeed(dataRoot)); return readPostgresMasterDataHealth(dbPath, dataRoot); }
export async function readPostgresMasterDataHealth(dbPath, dataRoot) {
  const pool = getPostgresPool(); await initialize(pool); await ensureSeeded(pool, dataRoot);
  const counts = {};
  for (const [key, table] of Object.entries({ clients: "clients", livingAssets: "living_assets", assetZones: "asset_zones", workOrders: "work_orders", proofRecords: "proof_records", sensorReadings: "sensor_readings", incidents: "incidents" })) counts[key] = Number((await pool.query(`SELECT COUNT(*)::int AS count FROM ${table}`)).rows[0].count);
  const checks = await Promise.all([
    pool.query("SELECT COUNT(*)::int AS count FROM living_assets a LEFT JOIN clients c ON c.id = a.client_id WHERE c.id IS NULL"),
    pool.query("SELECT COUNT(*)::int AS count FROM asset_zones z LEFT JOIN living_assets a ON a.id = z.asset_id WHERE a.id IS NULL"),
    pool.query("SELECT COUNT(*)::int AS count FROM work_orders o LEFT JOIN living_assets a ON a.id = o.wall_id WHERE a.id IS NULL"),
    pool.query("SELECT COUNT(*)::int AS count FROM proof_records p LEFT JOIN living_assets a ON a.id = p.wall_id LEFT JOIN work_orders o ON o.id = p.workorder_id WHERE a.id IS NULL OR o.id IS NULL"),
    pool.query("SELECT COUNT(*)::int AS count FROM sensor_readings s LEFT JOIN living_assets a ON a.id = s.wall_id WHERE a.id IS NULL"),
    pool.query("SELECT COUNT(*)::int AS count FROM incidents i LEFT JOIN living_assets a ON a.id = i.wall_id LEFT JOIN work_orders o ON o.id = i.linked_workorder_id WHERE a.id IS NULL OR o.id IS NULL")
  ]);
  return { migrationVersion: postgresMasterDataMigrationVersion, crudVersion: postgresMasterDataCrudVersion, source: "postgres-master-data", seedSource: "managed-postgres", tables: ["clients", "living_assets", "asset_zones", "work_orders", "proof_records", "sensor_readings", "incidents"], counts, relationshipIntegrity: { foreignKeysEnabled: true, foreignKeyIssues: checks.reduce((total, result) => total + Number(result.rows[0].count), 0) } };
}

export async function upsertPostgresClient(dbPath, dataRoot, input) {
  const pool = getPostgresPool(); await initialize(pool); await ensureSeeded(pool, dataRoot);
  const client = { id: required(input.id, "client.id"), name: required(input.name, "client.name"), segment: input.segment || null, district: input.district || null, contact: input.contact || null, plan: input.plan || null, contract: input.contract || null, renewalDate: input.renewalDate || null, renewalRisk: input.renewalRisk || null, revenue: Number(input.revenue || 0), proofNeed: input.proofNeed || null };
  await pool.query("INSERT INTO clients (id,name,segment,district,contact,plan,contract,renewal_date,renewal_risk,revenue,proof_need,raw_json) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) ON CONFLICT(id) DO UPDATE SET name=EXCLUDED.name,segment=EXCLUDED.segment,district=EXCLUDED.district,contact=EXCLUDED.contact,plan=EXCLUDED.plan,contract=EXCLUDED.contract,renewal_date=EXCLUDED.renewal_date,renewal_risk=EXCLUDED.renewal_risk,revenue=EXCLUDED.revenue,proof_need=EXCLUDED.proof_need,raw_json=EXCLUDED.raw_json", [client.id, client.name, client.segment, client.district, client.contact, client.plan, client.contract, client.renewalDate, client.renewalRisk, client.revenue, client.proofNeed, JSON.stringify(client)]);
  return client;
}
export async function upsertPostgresLivingAsset(dbPath, dataRoot, input) {
  const pool = getPostgresPool(); await initialize(pool); await ensureSeeded(pool, dataRoot);
  const wall = { id: required(input.id, "asset.id"), clientId: required(input.clientId, "asset.clientId"), name: required(input.name, "asset.name"), location: input.location || null, version: input.version || "Standard", modules: positive(input.modules, "asset.modules"), pods: positive(input.pods, "asset.pods"), health: bounded(input.health ?? 80, "asset.health", 0, 100), survival: bounded(input.survival ?? 90, "asset.survival", 0, 100), issues: Number(input.issues || 0), nextVisit: input.nextVisit || null, cadence: input.cadence || null, greenArea: Number(input.greenArea || 0), waterSaved: Number(input.waterSaved || 0), serviceMilesSaved: Number(input.serviceMilesSaved || 0), staffReach: Number(input.staffReach || 0), co2eProxy: Number(input.co2eProxy || 0), status: input.status || "stable", sensors: Array.isArray(input.sensors) ? input.sensors : [], tags: Array.isArray(input.tags) ? input.tags : [], zones: Array.isArray(input.zones) ? input.zones : [] };
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("INSERT INTO living_assets (id,client_id,name,location,version,modules,pods,health,survival,issues,next_visit,cadence,green_area,water_saved,service_miles_saved,staff_reach,co2e_proxy,status,sensors_json,tags_json,raw_json) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21) ON CONFLICT(id) DO UPDATE SET client_id=EXCLUDED.client_id,name=EXCLUDED.name,location=EXCLUDED.location,version=EXCLUDED.version,modules=EXCLUDED.modules,pods=EXCLUDED.pods,health=EXCLUDED.health,survival=EXCLUDED.survival,issues=EXCLUDED.issues,next_visit=EXCLUDED.next_visit,cadence=EXCLUDED.cadence,green_area=EXCLUDED.green_area,water_saved=EXCLUDED.water_saved,service_miles_saved=EXCLUDED.service_miles_saved,staff_reach=EXCLUDED.staff_reach,co2e_proxy=EXCLUDED.co2e_proxy,status=EXCLUDED.status,sensors_json=EXCLUDED.sensors_json,tags_json=EXCLUDED.tags_json,raw_json=EXCLUDED.raw_json", [wall.id, wall.clientId, wall.name, wall.location, wall.version, wall.modules, wall.pods, wall.health, wall.survival, wall.issues, wall.nextVisit, wall.cadence, wall.greenArea, wall.waterSaved, wall.serviceMilesSaved, wall.staffReach, wall.co2eProxy, wall.status, JSON.stringify(wall.sensors), JSON.stringify(wall.tags), JSON.stringify(wall)]);
    await client.query("DELETE FROM asset_zones WHERE asset_id = $1", [wall.id]);
    for (const [index, zone] of wall.zones.entries()) await client.query("INSERT INTO asset_zones (asset_id,sequence,name,pods,health,issue,raw_json) VALUES ($1,$2,$3,$4,$5,$6,$7)", [wall.id, index + 1, required(zone.name || `Zone ${index + 1}`, "zone.name"), Number(zone.pods || 0), bounded(zone.health ?? wall.health, "zone.health", 0, 100), zone.issue || null, JSON.stringify(zone)]);
    await client.query("COMMIT");
  } catch (error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); }
  return wall;
}
export async function upsertPostgresWorkOrder(dbPath, dataRoot, input) {
  const pool = getPostgresPool(); await initialize(pool); await ensureSeeded(pool, dataRoot);
  const order = { id: required(input.id, "workorder.id"), wallId: required(input.wallId, "workorder.wallId"), type: required(input.type, "workorder.type"), due: input.due || null, status: input.status || "Scheduled", priority: input.priority || "medium", tasks: Array.isArray(input.tasks) ? input.tasks : [] };
  const result = await pool.query("INSERT INTO work_orders (id,wall_id,type,due,status,priority,tasks_json,raw_json) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT(id) DO UPDATE SET wall_id=EXCLUDED.wall_id,type=EXCLUDED.type,due=EXCLUDED.due,status=EXCLUDED.status,priority=EXCLUDED.priority,tasks_json=EXCLUDED.tasks_json,raw_json=EXCLUDED.raw_json RETURNING *", [order.id, order.wallId, order.type, order.due, order.status, order.priority, JSON.stringify(order.tasks), JSON.stringify(order)]);
  return workorderFromRow(result.rows[0]);
}
export async function upsertPostgresSensorReading(dbPath, dataRoot, input) {
  const pool = getPostgresPool(); await initialize(pool); await ensureSeeded(pool, dataRoot);
  const reading = { id: required(input.id, "sensor.id"), wallId: required(input.wallId, "sensor.wallId"), type: input.type || null, value: Number(input.value || 0), unit: input.unit || null, target: input.target || null, status: input.status || "ok", lastSeen: input.lastSeen || null, action: input.action || null };
  const result = await pool.query("INSERT INTO sensor_readings (id,wall_id,type,value,unit,target,status,last_seen,action,raw_json) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT(id) DO UPDATE SET wall_id=EXCLUDED.wall_id,type=EXCLUDED.type,value=EXCLUDED.value,unit=EXCLUDED.unit,target=EXCLUDED.target,status=EXCLUDED.status,last_seen=EXCLUDED.last_seen,action=EXCLUDED.action,raw_json=EXCLUDED.raw_json RETURNING *", [reading.id, reading.wallId, reading.type, reading.value, reading.unit, reading.target, reading.status, reading.lastSeen, reading.action, JSON.stringify(reading)]);
  return sensorFromRow(result.rows[0]);
}
