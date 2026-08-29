import { mkdir } from "node:fs/promises";
import { DatabaseSync } from "node:sqlite";
import { dirname } from "node:path";
import { readSqliteMasterDataset } from "./ops-master-data-store.mjs";
import { encodeModuleCursor, moduleQueryCursorPositionMax, moduleQueryFilters, normalizeModuleQuery } from "./ops-module-query.mjs";

export const moduleMigrationVersion = "2026-08-17.asset-modules-v1";

function parseJson(value, fallback) {
  try { return JSON.parse(value || ""); } catch { return fallback; }
}

function validationError(message) {
  const error = new Error(message);
  error.status = 400;
  error.code = "MODULE_VALIDATION_ERROR";
  return error;
}

function requireString(value, field) {
  const text = String(value || "").trim();
  if (!text) throw validationError(`${field} is required`);
  return text;
}

async function withDatabase(dbPath, callback) {
  await mkdir(dirname(dbPath), { recursive: true });
  const db = new DatabaseSync(dbPath);
  try {
    initializeModuleDatabase(db);
    return callback(db);
  } finally {
    db.close();
  }
}

function initializeModuleDatabase(db) {
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY, applied_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS asset_modules (
      id TEXT PRIMARY KEY,
      asset_id TEXT NOT NULL,
      client_id TEXT NOT NULL,
      label TEXT NOT NULL,
      zone TEXT,
      position INTEGER,
      status TEXT NOT NULL,
      monitoring_devices_json TEXT NOT NULL,
      camera_id TEXT,
      source TEXT NOT NULL,
      raw_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (asset_id) REFERENCES living_assets(id) ON UPDATE CASCADE ON DELETE CASCADE,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON UPDATE CASCADE ON DELETE RESTRICT
    );
    CREATE INDEX IF NOT EXISTS idx_asset_modules_asset ON asset_modules(asset_id, position);
    CREATE INDEX IF NOT EXISTS idx_asset_modules_client ON asset_modules(client_id);
    CREATE INDEX IF NOT EXISTS idx_asset_modules_status ON asset_modules(status);
  `);
  db.prepare("INSERT OR IGNORE INTO schema_migrations (version, applied_at) VALUES (?, ?)").run(moduleMigrationVersion, new Date().toISOString());
}

function moduleFromRow(row) {
  return {
    ...parseJson(row.raw_json, {}),
    id: row.id,
    assetId: row.asset_id,
    clientId: row.client_id,
    label: row.label,
    zone: row.zone || null,
    position: row.position || null,
    status: row.status,
    monitoringDevices: parseJson(row.monitoring_devices_json, {}),
    cameraId: row.camera_id || null,
    source: row.source,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function generatedDevices(moduleId) {
  return {
    temperature: { sensorId: `${moduleId}-TEMP`, unit: "C", state: "not_connected" },
    humidity: { sensorId: `${moduleId}-RH`, unit: "%", state: "not_connected" },
    co2: { sensorId: `${moduleId}-CO2`, unit: "ppm", state: "not_connected" },
    mc: { sensorId: `${moduleId}-MC`, unit: "MC", state: "not_connected" },
    camera: { deviceId: `${moduleId}-CAM`, state: "not_connected" }
  };
}

async function ensureModulesSeeded(dbPath, dataRoot) {
  const dataset = await readSqliteMasterDataset(dbPath, dataRoot);
  return withDatabase(dbPath, (db) => {
    const existing = db.prepare("SELECT COUNT(*) AS count FROM asset_modules").get().count;
    if (existing > 0) return { seeded: false, count: existing };
    const now = new Date().toISOString();
    const insert = db.prepare(`
      INSERT INTO asset_modules (id, asset_id, client_id, label, zone, position, status, monitoring_devices_json, camera_id, source, raw_json, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    db.exec("BEGIN IMMEDIATE");
    try {
      for (const wall of dataset.walls) {
        const moduleCount = Math.max(0, Number(wall.modules || 0));
        for (let index = 1; index <= moduleCount; index += 1) {
          const id = `${wall.id}-M${String(index).padStart(2, "0")}`;
          const record = {
            id,
            assetId: wall.id,
            clientId: wall.clientId,
            label: `Module ${String(index).padStart(2, "0")}`,
            zone: wall.zones?.[Math.floor((index - 1) / Math.max(1, Math.ceil(moduleCount / Math.max(1, wall.zones?.length || 1))))]?.name || null,
            position: index,
            status: "active",
            monitoringDevices: generatedDevices(id),
            cameraId: `${id}-CAM`,
            source: "generated-from-asset-module-count",
            createdAt: now,
            updatedAt: now
          };
          insert.run(record.id, record.assetId, record.clientId, record.label, record.zone, record.position, record.status, JSON.stringify(record.monitoringDevices), record.cameraId, record.source, JSON.stringify(record), now, now);
        }
      }
      db.exec("COMMIT");
      return { seeded: true, count: db.prepare("SELECT COUNT(*) AS count FROM asset_modules").get().count };
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  });
}

export async function listSqliteModules(dbPath, dataRoot, { wallId = null, clientIds = null } = {}) {
  await ensureModulesSeeded(dbPath, dataRoot);
  return withDatabase(dbPath, (db) => {
    const rows = wallId
      ? db.prepare("SELECT * FROM asset_modules WHERE asset_id = ? ORDER BY position ASC, id ASC").all(wallId)
      : db.prepare("SELECT * FROM asset_modules ORDER BY asset_id ASC, position ASC, id ASC").all();
    const allowed = clientIds ? new Set(clientIds) : null;
    return rows.map(moduleFromRow).filter((item) => !allowed || allowed.has(item.clientId));
  });
}

export async function listSqliteModulePage(dbPath, dataRoot, options = {}) {
  await ensureModulesSeeded(dbPath, dataRoot);
  const query = normalizeModuleQuery(options);
  return withDatabase(dbPath, (db) => {
    const clauses = [];
    const params = [];
    if (query.wallId) { clauses.push("asset_id = ?"); params.push(query.wallId); }
    if (query.clientId) { clauses.push("client_id = ?"); params.push(query.clientId); }
    if (query.clientIds) {
      if (!query.clientIds.length) return { items: [], page: { limit: query.limit, total: 0, hasMore: false, nextCursor: null }, filters: moduleQueryFilters(query) };
      clauses.push(`client_id IN (${query.clientIds.map(() => "?").join(",")})`); params.push(...query.clientIds);
    }
    if (query.statuses.length) { clauses.push(`status IN (${query.statuses.map(() => "?").join(",")})`); params.push(...query.statuses); }
    if (query.search) {
      const pattern = `%${query.search}%`;
      clauses.push("(LOWER(id) LIKE LOWER(?) OR LOWER(label) LIKE LOWER(?) OR LOWER(asset_id) LIKE LOWER(?) OR LOWER(zone) LIKE LOWER(?))");
      params.push(pattern, pattern, pattern, pattern);
    }
    if (query.cursor) {
      const { assetId, position, id } = query.cursor;
      const max = moduleQueryCursorPositionMax();
      clauses.push("(asset_id > ? OR (asset_id = ? AND COALESCE(position, ?) > ?) OR (asset_id = ? AND COALESCE(position, ?) = ? AND id > ?))");
      params.push(assetId, assetId, max, position, assetId, max, position, id);
    }
    const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
    const total = Number(db.prepare(`SELECT COUNT(*) AS count FROM asset_modules ${where}`).get(...params).count);
    const rows = db.prepare(`SELECT * FROM asset_modules ${where} ORDER BY asset_id ASC, COALESCE(position, ?) ASC, id ASC LIMIT ?`).all(...params, moduleQueryCursorPositionMax(), query.limit + 1);
    const items = rows.slice(0, query.limit).map(moduleFromRow);
    return {
      items,
      page: { limit: query.limit, total, hasMore: rows.length > query.limit, nextCursor: rows.length > query.limit ? encodeModuleCursor(items.at(-1)) : null },
      filters: moduleQueryFilters(query)
    };
  });
}

export async function upsertSqliteModule(dbPath, dataRoot, input) {
  await ensureModulesSeeded(dbPath, dataRoot);
  const module = {
    id: requireString(input?.id, "module.id"),
    assetId: requireString(input?.assetId, "module.assetId"),
    clientId: requireString(input?.clientId, "module.clientId"),
    label: requireString(input?.label, "module.label"),
    zone: input?.zone ? String(input.zone).trim() : null,
    position: Number.isInteger(Number(input?.position)) ? Number(input.position) : null,
    status: input?.status ? String(input.status).trim() : "active",
    monitoringDevices: input?.monitoringDevices && typeof input.monitoringDevices === "object" ? input.monitoringDevices : generatedDevices(input.id),
    cameraId: input?.cameraId ? String(input.cameraId).trim() : null,
    source: input?.source ? String(input.source).trim() : "admin",
    updatedAt: new Date().toISOString()
  };
  return withDatabase(dbPath, (db) => {
    const now = new Date().toISOString();
    try {
      db.prepare(`
        INSERT INTO asset_modules (id, asset_id, client_id, label, zone, position, status, monitoring_devices_json, camera_id, source, raw_json, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          asset_id = excluded.asset_id, client_id = excluded.client_id, label = excluded.label, zone = excluded.zone,
          position = excluded.position, status = excluded.status, monitoring_devices_json = excluded.monitoring_devices_json,
          camera_id = excluded.camera_id, source = excluded.source, raw_json = excluded.raw_json, updated_at = excluded.updated_at
      `).run(module.id, module.assetId, module.clientId, module.label, module.zone, module.position, module.status, JSON.stringify(module.monitoringDevices), module.cameraId, module.source, JSON.stringify(module), now, module.updatedAt);
      return moduleFromRow(db.prepare("SELECT * FROM asset_modules WHERE id = ?").get(module.id));
    } catch (error) {
      if (String(error?.message || "").includes("constraint failed")) throw validationError("module references a missing asset or client");
      throw error;
    }
  });
}

export async function readSqliteModuleStorageHealth(dbPath, dataRoot) {
  await ensureModulesSeeded(dbPath, dataRoot);
  return withDatabase(dbPath, (db) => ({
    backend: "sqlite",
    migrationVersion: moduleMigrationVersion,
    source: "module-level-master-data",
    counts: { modules: db.prepare("SELECT COUNT(*) AS count FROM asset_modules").get().count },
    relationshipIntegrity: { foreignKeysEnabled: db.prepare("PRAGMA foreign_keys").get().foreign_keys === 1, foreignKeyIssues: db.prepare("PRAGMA foreign_key_check").all().length }
  }));
}
