import { createHash, randomBytes } from "node:crypto";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { DatabaseSync } from "node:sqlite";
import { dirname, join } from "node:path";
import { readSqliteMasterDataset } from "./ops-master-data-store.mjs";
import { listSqliteModules } from "./ops-module-store.mjs";

export const deviceMigrationVersion = "2026-08-17.device-ingestion-v1";
export const deviceTypes = ["temperature", "humidity", "co2", "mc", "camera", "gateway"];
export const deviceStatuses = ["pending", "active", "disabled", "offline"];
export const deviceProtocols = ["http-push", "mqtt", "camera-http", "simulator"];

function parseJson(value, fallback) { try { return JSON.parse(value || ""); } catch { return fallback; } }
function error(message, code = "DEVICE_VALIDATION_ERROR", status = 400) { const result = new Error(message); result.code = code; result.status = status; return result; }
function required(value, field) { const text = String(value || "").trim(); if (!text) throw error(`${field} is required`); return text; }
function hash(value) {
  const pepper = String(process.env.DR_FOREST_DEVICE_SIGNING_SECRET || "");
  return createHash("sha256").update(`${pepper}:${String(value)}`).digest("hex");
}
function withDatabase(dbPath, callback) {
  return (async () => { await mkdir(dirname(dbPath), { recursive: true }); const db = new DatabaseSync(dbPath); try { initialize(db); return await callback(db); } finally { db.close(); } })();
}
function initialize(db) {
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY, applied_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS asset_devices (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL,
      wall_id TEXT NOT NULL,
      module_id TEXT,
      type TEXT NOT NULL CHECK (type IN ('temperature', 'humidity', 'co2', 'mc', 'camera', 'gateway')),
      label TEXT NOT NULL,
      protocol TEXT NOT NULL CHECK (protocol IN ('http-push', 'mqtt', 'camera-http', 'simulator')),
      status TEXT NOT NULL CHECK (status IN ('pending', 'active', 'disabled', 'offline')),
      device_key_hash TEXT NOT NULL UNIQUE,
      endpoint_url TEXT,
      capabilities_json TEXT NOT NULL,
      config_json TEXT NOT NULL,
      metadata_json TEXT NOT NULL,
      last_seen_at TEXT,
      last_ingested_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON UPDATE CASCADE ON DELETE RESTRICT,
      FOREIGN KEY (wall_id) REFERENCES living_assets(id) ON UPDATE CASCADE ON DELETE RESTRICT,
      FOREIGN KEY (module_id) REFERENCES asset_modules(id) ON UPDATE CASCADE ON DELETE SET NULL
    );
    CREATE INDEX IF NOT EXISTS idx_asset_devices_scope ON asset_devices(client_id, wall_id, module_id);
    CREATE INDEX IF NOT EXISTS idx_asset_devices_status ON asset_devices(status, last_seen_at);
    CREATE TABLE IF NOT EXISTS device_ingestion_log (
      id TEXT PRIMARY KEY,
      device_id TEXT NOT NULL,
      kind TEXT NOT NULL CHECK (kind IN ('reading', 'camera')),
      idempotency_key TEXT NOT NULL,
      module_id TEXT,
      observed_at TEXT,
      accepted_at TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('accepted', 'duplicate', 'rejected')),
      payload_hash TEXT,
      error_code TEXT,
      payload_json TEXT NOT NULL,
      UNIQUE(device_id, idempotency_key),
      FOREIGN KEY (device_id) REFERENCES asset_devices(id) ON UPDATE CASCADE ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_device_ingestion_device_time ON device_ingestion_log(device_id, accepted_at);
    CREATE TABLE IF NOT EXISTS device_request_replays (
      device_id TEXT NOT NULL,
      nonce TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      PRIMARY KEY (device_id, nonce),
      FOREIGN KEY (device_id) REFERENCES asset_devices(id) ON UPDATE CASCADE ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_device_request_replays_expiry ON device_request_replays(expires_at);
    CREATE TABLE IF NOT EXISTS device_camera_captures (
      id TEXT PRIMARY KEY,
      device_id TEXT NOT NULL,
      client_id TEXT NOT NULL,
      wall_id TEXT NOT NULL,
      module_id TEXT NOT NULL,
      workorder_id TEXT,
      captured_at TEXT NOT NULL,
      content_type TEXT NOT NULL,
      byte_size INTEGER,
      sha256 TEXT,
      object_key TEXT,
      image_url TEXT,
      media_status TEXT NOT NULL CHECK (media_status IN ('metadata-only', 'stored', 'rejected')),
      metadata_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (device_id) REFERENCES asset_devices(id) ON UPDATE CASCADE ON DELETE CASCADE,
      FOREIGN KEY (module_id) REFERENCES asset_modules(id) ON UPDATE CASCADE ON DELETE RESTRICT
    );
    CREATE INDEX IF NOT EXISTS idx_device_camera_scope ON device_camera_captures(client_id, wall_id, module_id, captured_at);
    CREATE TABLE IF NOT EXISTS device_camera_files (
      capture_id TEXT PRIMARY KEY,
      file_path TEXT NOT NULL,
      byte_size INTEGER NOT NULL,
      sha256 TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (capture_id) REFERENCES device_camera_captures(id) ON UPDATE CASCADE ON DELETE CASCADE
    );
  `);
  db.prepare("INSERT OR IGNORE INTO schema_migrations (version, applied_at) VALUES (?, ?)").run(deviceMigrationVersion, new Date().toISOString());
}

function deviceFromRow(row, secret = null) {
  return {
    id: row.id,
    clientId: row.client_id,
    wallId: row.wall_id,
    moduleId: row.module_id || null,
    type: row.type,
    label: row.label,
    protocol: row.protocol,
    status: row.status,
    endpointUrl: row.endpoint_url || null,
    capabilities: parseJson(row.capabilities_json, []),
    config: parseJson(row.config_json, {}),
    metadata: parseJson(row.metadata_json, {}),
    lastSeenAt: row.last_seen_at || null,
    lastIngestedAt: row.last_ingested_at || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...(secret ? { deviceKey: secret } : {})
  };
}

function cameraFromRow(row) {
  return {
    id: row.id,
    deviceId: row.device_id,
    clientId: row.client_id,
    wallId: row.wall_id,
    moduleId: row.module_id,
    workorderId: row.workorder_id || null,
    capturedAt: row.captured_at,
    contentType: row.content_type,
    byteSize: row.byte_size,
    sha256: row.sha256 || null,
    objectKey: row.object_key || null,
    imageUrl: row.image_url || null,
    mediaStatus: row.media_status,
    metadata: parseJson(row.metadata_json, {}),
    createdAt: row.created_at
  };
}

async function ensureParents(dbPath, dataRoot) {
  const dataset = await readSqliteMasterDataset(dbPath, dataRoot);
  await listSqliteModules(dbPath, dataRoot);
  return dataset;
}

async function ensureDeviceRegistrySeeded(dbPath, dataRoot) {
  await ensureParents(dbPath, dataRoot);
  const modules = await listSqliteModules(dbPath, dataRoot);
  return withDatabase(dbPath, (db) => {
    const existing = db.prepare("SELECT COUNT(*) AS count FROM asset_devices").get().count;
    if (existing > 0) return { seeded: false, count: existing };
    const now = new Date().toISOString();
    const insert = db.prepare(`
      INSERT INTO asset_devices (id, client_id, wall_id, module_id, type, label, protocol, status, device_key_hash, endpoint_url, capabilities_json, config_json, metadata_json, last_seen_at, last_ingested_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    db.exec("BEGIN IMMEDIATE");
    try {
      for (const module of modules) {
        const deviceMap = module.monitoringDevices || {};
        for (const type of ["temperature", "humidity", "co2", "mc", "camera"]) {
          const deviceConfig = deviceMap[type] || {};
          const id = deviceConfig.sensorId || deviceConfig.deviceId || `${module.id}-${type.toUpperCase()}`;
          const simulatorKey = `drf_sim_${id}`;
          insert.run(id, module.clientId, module.assetId, module.id, type, `${module.label} ${type} simulator`, "simulator", "pending", hash(simulatorKey), null, JSON.stringify([type]), JSON.stringify({ simulator: true, generated: true }), JSON.stringify({ source: "generated-from-module-device-map", simulatorKeyHint: "drf_sim_<device-id>" }), null, null, now, now);
        }
      }
      db.exec("COMMIT");
      return { seeded: true, count: db.prepare("SELECT COUNT(*) AS count FROM asset_devices").get().count };
    } catch (seedError) {
      db.exec("ROLLBACK");
      throw seedError;
    }
  });
}

function scopeForInput(dataset, input) {
  const wall = dataset.walls.find((item) => item.id === input.wallId);
  if (!wall) throw error("device references an unknown wall", "DEVICE_UNKNOWN_WALL");
  if (input.clientId && input.clientId !== wall.clientId) throw error("device client and wall do not match", "DEVICE_SCOPE_MISMATCH");
  return wall;
}

async function validateModule(dbPath, dataRoot, wallId, moduleId) {
  const module = (await listSqliteModules(dbPath, dataRoot, { wallId })).find((item) => item.id === moduleId);
  if (!module) throw error("device module does not belong to the selected wall", "DEVICE_UNKNOWN_MODULE");
  return module;
}

export async function registerSqliteDevice(dbPath, dataRoot, input, { rotateKey = false } = {}) {
  const dataset = await ensureParents(dbPath, dataRoot);
  await ensureDeviceRegistrySeeded(dbPath, dataRoot);
  const wall = scopeForInput(dataset, input);
  const type = required(input?.type, "device.type").toLowerCase();
  const protocol = String(input?.protocol || (type === "camera" ? "camera-http" : "http-push")).trim().toLowerCase();
  if (!deviceTypes.includes(type)) throw error(`device.type must be one of ${deviceTypes.join(", ")}`);
  if (!deviceProtocols.includes(protocol)) throw error(`device.protocol must be one of ${deviceProtocols.join(", ")}`);
  if (type !== "gateway" && !input?.moduleId) throw error("moduleId is required for sensor and camera devices");
  const module = input?.moduleId ? await validateModule(dbPath, dataRoot, wall.id, input.moduleId) : null;
  const id = required(input?.id, "device.id");
  const now = new Date().toISOString();
  const secret = input?.deviceKey ? String(input.deviceKey).trim() : `drf_dev_${randomBytes(24).toString("base64url")}`;
  return withDatabase(dbPath, (db) => {
    const existing = db.prepare("SELECT * FROM asset_devices WHERE id = ?").get(id);
    if (existing && !rotateKey && !input?.deviceKey) {
      return { duplicate: true, device: deviceFromRow(existing) };
    }
    const record = {
      id,
      clientId: wall.clientId,
      wallId: wall.id,
      moduleId: module?.id || null,
      type,
      label: String(input?.label || id).trim(),
      protocol,
      status: String(input?.status || existing?.status || "pending").trim().toLowerCase(),
      endpointUrl: input?.endpointUrl ? String(input.endpointUrl).trim() : null,
      capabilities: Array.isArray(input?.capabilities) ? input.capabilities : [type],
      config: input?.config && typeof input.config === "object" ? input.config : {},
      metadata: input?.metadata && typeof input.metadata === "object" ? input.metadata : {},
      createdAt: existing?.created_at || now,
      updatedAt: now
    };
    if (!deviceStatuses.includes(record.status)) throw error(`device.status must be one of ${deviceStatuses.join(", ")}`);
    try {
      db.prepare(`
        INSERT INTO asset_devices (id, client_id, wall_id, module_id, type, label, protocol, status, device_key_hash, endpoint_url, capabilities_json, config_json, metadata_json, last_seen_at, last_ingested_at, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET client_id = excluded.client_id, wall_id = excluded.wall_id, module_id = excluded.module_id,
          type = excluded.type, label = excluded.label, protocol = excluded.protocol, status = excluded.status,
          device_key_hash = excluded.device_key_hash, endpoint_url = excluded.endpoint_url, capabilities_json = excluded.capabilities_json,
          config_json = excluded.config_json, metadata_json = excluded.metadata_json, updated_at = excluded.updated_at
      `).run(record.id, record.clientId, record.wallId, record.moduleId, record.type, record.label, record.protocol, record.status, hash(secret), record.endpointUrl, JSON.stringify(record.capabilities), JSON.stringify(record.config), JSON.stringify(record.metadata), existing?.last_seen_at || null, existing?.last_ingested_at || null, record.createdAt, record.updatedAt);
    } catch (constraint) {
      if (String(constraint?.message || "").includes("UNIQUE")) throw error("device id or device key already exists", "DEVICE_ALREADY_EXISTS", 409);
      throw constraint;
    }
    return { duplicate: false, device: deviceFromRow(db.prepare("SELECT * FROM asset_devices WHERE id = ?").get(record.id), secret), rotated: Boolean(existing) };
  });
}

export async function listSqliteDevices(dbPath, dataRoot, { clientIds = null, wallId = null, moduleId = null } = {}) {
  await ensureDeviceRegistrySeeded(dbPath, dataRoot);
  return withDatabase(dbPath, (db) => {
    const rows = db.prepare(`
      SELECT * FROM asset_devices
      WHERE (? IS NULL OR wall_id = ?)
        AND (? IS NULL OR module_id = ?)
      ORDER BY wall_id ASC, module_id ASC, type ASC, id ASC
    `).all(wallId, wallId, moduleId, moduleId);
    const allowed = clientIds ? new Set(clientIds) : null;
    return rows.map((row) => deviceFromRow(row)).filter((item) => !allowed || allowed.has(item.clientId));
  });
}

export async function updateSqliteDevice(dbPath, dataRoot, id, input) {
  const devices = await listSqliteDevices(dbPath, dataRoot);
  const existing = devices.find((item) => item.id === id);
  if (!existing) throw error("device not found", "DEVICE_NOT_FOUND", 404);
  const dataset = await readSqliteMasterDataset(dbPath, dataRoot);
  const wall = scopeForInput(dataset, { wallId: input?.wallId || existing.wallId, clientId: existing.clientId });
  const moduleId = input?.moduleId || existing.moduleId;
  const module = moduleId ? await validateModule(dbPath, dataRoot, wall.id, moduleId) : null;
  const type = String(input?.type || existing.type).trim().toLowerCase();
  const protocol = String(input?.protocol || existing.protocol).trim().toLowerCase();
  const status = String(input?.status || existing.status).trim().toLowerCase();
  if (!deviceTypes.includes(type) || !deviceProtocols.includes(protocol) || !deviceStatuses.includes(status)) throw error("device update contains an unsupported type, protocol or status");
  const now = new Date().toISOString();
  const secret = input?.rotateKey ? `drf_dev_${randomBytes(24).toString("base64url")}` : null;
  return withDatabase(dbPath, (db) => {
    db.prepare(`
      UPDATE asset_devices
      SET wall_id = ?, module_id = ?, type = ?, label = ?, protocol = ?, status = ?,
          device_key_hash = COALESCE(?, device_key_hash), endpoint_url = ?, capabilities_json = ?, config_json = ?, metadata_json = ?, updated_at = ?
      WHERE id = ?
    `).run(wall.id, module?.id || null, type, String(input?.label || existing.label).trim(), protocol, status, secret ? hash(secret) : null, input?.endpointUrl === undefined ? existing.endpointUrl : (input.endpointUrl ? String(input.endpointUrl).trim() : null), JSON.stringify(Array.isArray(input?.capabilities) ? input.capabilities : existing.capabilities), JSON.stringify(input?.config && typeof input.config === "object" ? input.config : existing.config), JSON.stringify(input?.metadata && typeof input.metadata === "object" ? input.metadata : existing.metadata), now, id);
    return { duplicate: false, rotated: Boolean(secret), device: deviceFromRow(db.prepare("SELECT * FROM asset_devices WHERE id = ?").get(id), secret) };
  });
}

export async function readSqliteDeviceByKey(dbPath, deviceKey) {
  const value = String(deviceKey || "").trim();
  if (!value) return null;
  return withDatabase(dbPath, (db) => {
    const row = db.prepare("SELECT * FROM asset_devices WHERE device_key_hash = ?").get(hash(value));
    return row ? deviceFromRow(row) : null;
  });
}

export async function consumeSqliteDeviceReplay(dbPath, { deviceId, nonce, expiresAt }) {
  return withDatabase(dbPath, (db) => {
    const now = new Date().toISOString();
    db.prepare("DELETE FROM device_request_replays WHERE expires_at <= ?").run(now);
    try {
      db.prepare("INSERT INTO device_request_replays (device_id, nonce, expires_at, created_at) VALUES (?, ?, ?, ?)").run(String(deviceId), String(nonce), String(expiresAt), now);
      return { accepted: true };
    } catch (constraint) {
      if (String(constraint?.message || "").toLowerCase().includes("unique")) return { accepted: false, reason: "duplicate-nonce" };
      throw constraint;
    }
  });
}

export async function touchSqliteDevice(dbPath, deviceId, { ingestedAt = null } = {}) {
  const now = new Date().toISOString();
  return withDatabase(dbPath, (db) => {
    db.prepare("UPDATE asset_devices SET last_seen_at = ?, last_ingested_at = COALESCE(?, last_ingested_at), updated_at = ? WHERE id = ?").run(now, ingestedAt, now, deviceId);
    return deviceFromRow(db.prepare("SELECT * FROM asset_devices WHERE id = ?").get(deviceId));
  });
}

export async function recordSqliteDeviceIngestion(dbPath, input) {
  return withDatabase(dbPath, (db) => {
    const idempotencyKey = required(input?.idempotencyKey, "ingestion.idempotencyKey");
    const deviceId = required(input?.deviceId, "ingestion.deviceId");
    const existing = db.prepare("SELECT * FROM device_ingestion_log WHERE device_id = ? AND idempotency_key = ?").get(deviceId, idempotencyKey);
    if (existing) return { duplicate: true, log: existing };
    const record = { id: String(input?.id || `DIL-${Date.now()}-${randomBytes(4).toString("hex")}`), deviceId, kind: required(input?.kind, "ingestion.kind"), idempotencyKey, moduleId: input?.moduleId ? String(input.moduleId).trim() : null, observedAt: input?.observedAt || null, acceptedAt: new Date().toISOString(), status: input?.status || "accepted", payloadHash: input?.payloadHash || null, errorCode: input?.errorCode || null, payload: input?.payload && typeof input.payload === "object" ? input.payload : {} };
    db.prepare(`INSERT INTO device_ingestion_log (id, device_id, kind, idempotency_key, module_id, observed_at, accepted_at, status, payload_hash, error_code, payload_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(record.id, record.deviceId, record.kind, record.idempotencyKey, record.moduleId, record.observedAt, record.acceptedAt, record.status, record.payloadHash, record.errorCode, JSON.stringify(record.payload));
    return { duplicate: false, log: record };
  });
}

export async function recordSqliteDeviceIngestions(dbPath, inputs = []) {
  return withDatabase(dbPath, (db) => {
    const results = [];
    db.exec("BEGIN IMMEDIATE");
    try {
      for (const input of inputs) {
        const idempotencyKey = required(input?.idempotencyKey, "ingestion.idempotencyKey");
        const deviceId = required(input?.deviceId, "ingestion.deviceId");
        const existing = db.prepare("SELECT * FROM device_ingestion_log WHERE device_id = ? AND idempotency_key = ?").get(deviceId, idempotencyKey);
        if (existing) { results.push({ duplicate: true, log: existing }); continue; }
        const record = { id: String(input?.id || `DIL-${Date.now()}-${randomBytes(4).toString("hex")}`), deviceId, kind: required(input?.kind, "ingestion.kind"), idempotencyKey, moduleId: input?.moduleId ? String(input.moduleId).trim() : null, observedAt: input?.observedAt || null, acceptedAt: new Date().toISOString(), status: input?.status || "accepted", payloadHash: input?.payloadHash || null, errorCode: input?.errorCode || null, payload: input?.payload && typeof input.payload === "object" ? input.payload : {} };
        db.prepare(`INSERT INTO device_ingestion_log (id, device_id, kind, idempotency_key, module_id, observed_at, accepted_at, status, payload_hash, error_code, payload_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(record.id, record.deviceId, record.kind, record.idempotencyKey, record.moduleId, record.observedAt, record.acceptedAt, record.status, record.payloadHash, record.errorCode, JSON.stringify(record.payload));
        results.push({ duplicate: false, log: record });
      }
      db.exec("COMMIT");
      return results;
    } catch (batchError) {
      db.exec("ROLLBACK");
      throw batchError;
    }
  });
}

function cameraFilePath(runtimeRoot, capture) { return join(runtimeRoot, "device-camera", `${String(capture.id).replace(/[^a-zA-Z0-9_-]+/g, "-")}.bin`); }

export async function saveSqliteDeviceCameraCapture(dbPath, dataRoot, runtimeRoot, input, fileBytes = null) {
  await ensureParents(dbPath, dataRoot);
  const dataset = await readSqliteMasterDataset(dbPath, dataRoot);
  const wall = scopeForInput(dataset, input);
  const module = await validateModule(dbPath, dataRoot, wall.id, input?.moduleId);
  return withDatabase(dbPath, async (db) => {
    const id = required(input?.id, "capture.id");
    const existing = db.prepare("SELECT * FROM device_camera_captures WHERE id = ?").get(id);
    if (existing) return { duplicate: true, capture: cameraFromRow(existing) };
    const contentType = required(input?.contentType, "capture.contentType").toLowerCase();
    if (!["image/jpeg", "image/png", "image/webp"].includes(contentType)) throw error("capture.contentType must be JPEG, PNG or WebP");
    const actualBytes = fileBytes ? Buffer.from(fileBytes) : null;
    const actualHash = actualBytes ? createHash("sha256").update(actualBytes).digest("hex") : (input?.sha256 ? String(input.sha256).toLowerCase() : null);
    const byteSize = actualBytes ? actualBytes.length : (input?.byteSize ? Number(input.byteSize) : null);
    if (actualBytes && input?.sha256 && actualHash !== String(input.sha256).toLowerCase()) throw error("camera bytes do not match sha256", "DEVICE_CAMERA_HASH_MISMATCH");
    const now = new Date().toISOString();
    const capture = { id, deviceId: required(input?.deviceId, "capture.deviceId"), clientId: wall.clientId, wallId: wall.id, moduleId: module.id, workorderId: input?.workorderId ? String(input.workorderId).trim() : null, capturedAt: required(input?.capturedAt, "capture.capturedAt"), contentType, byteSize, sha256: actualHash, objectKey: input?.objectKey ? String(input.objectKey).trim() : null, imageUrl: input?.imageUrl ? String(input.imageUrl).trim() : null, mediaStatus: actualBytes ? "stored" : "metadata-only", metadata: input?.metadata && typeof input.metadata === "object" ? input.metadata : {}, createdAt: now };
    db.prepare(`INSERT INTO device_camera_captures (id, device_id, client_id, wall_id, module_id, workorder_id, captured_at, content_type, byte_size, sha256, object_key, image_url, media_status, metadata_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(capture.id, capture.deviceId, capture.clientId, capture.wallId, capture.moduleId, capture.workorderId, capture.capturedAt, capture.contentType, capture.byteSize, capture.sha256, capture.objectKey, capture.imageUrl, capture.mediaStatus, JSON.stringify(capture.metadata), capture.createdAt);
    if (actualBytes) {
      const target = cameraFilePath(runtimeRoot, capture);
      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, actualBytes, { flag: "wx" });
      db.prepare("INSERT INTO device_camera_files (capture_id, file_path, byte_size, sha256, created_at) VALUES (?, ?, ?, ?, ?)").run(capture.id, target, actualBytes.length, actualHash, now);
    }
    return { duplicate: false, capture: cameraFromRow(db.prepare("SELECT * FROM device_camera_captures WHERE id = ?").get(capture.id)) };
  });
}

export async function readSqliteDeviceCameraCapture(dbPath, captureId) { return withDatabase(dbPath, (db) => { const row = db.prepare("SELECT * FROM device_camera_captures WHERE id = ?").get(captureId); return row ? cameraFromRow(row) : null; }); }
export async function readSqliteDeviceCameraBytes(dbPath, captureId) { return withDatabase(dbPath, async (db) => { const row = db.prepare("SELECT f.*, c.byte_size, c.sha256 FROM device_camera_files f JOIN device_camera_captures c ON c.id = f.capture_id WHERE f.capture_id = ?").get(captureId); if (!row) return null; const metadata = await stat(row.file_path); if (metadata.size !== row.byte_size) throw error("camera file size does not match ledger", "DEVICE_CAMERA_STORAGE_SIZE_MISMATCH"); const bytes = await readFile(row.file_path); const digest = createHash("sha256").update(bytes).digest("hex"); if (digest !== row.sha256) throw error("camera file sha256 does not match ledger", "DEVICE_CAMERA_STORAGE_HASH_MISMATCH"); return { bytes, contentType: db.prepare("SELECT content_type FROM device_camera_captures WHERE id = ?").get(captureId).content_type }; }); }

export async function listSqliteDeviceCameraCaptures(dbPath, dataRoot, { clientIds = null, wallId = null, moduleId = null } = {}) {
  await ensureParents(dbPath, dataRoot);
  return withDatabase(dbPath, (db) => {
    const rows = db.prepare("SELECT * FROM device_camera_captures WHERE (? IS NULL OR wall_id = ?) AND (? IS NULL OR module_id = ?) ORDER BY captured_at DESC, id ASC").all(wallId, wallId, moduleId, moduleId);
    const allowed = clientIds ? new Set(clientIds) : null;
    return rows.map(cameraFromRow).filter((item) => !allowed || allowed.has(item.clientId));
  });
}

export async function readSqliteDeviceStorageHealth(dbPath, dataRoot) {
  await ensureDeviceRegistrySeeded(dbPath, dataRoot);
  return withDatabase(dbPath, (db) => {
    const count = (table) => db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get().count;
    const statusRows = db.prepare("SELECT status, COUNT(*) AS count FROM asset_devices GROUP BY status ORDER BY status ASC").all();
    const stale = db.prepare("SELECT COUNT(*) AS count FROM asset_devices WHERE status = 'active' AND (last_seen_at IS NULL OR last_seen_at < datetime('now', '-24 hours'))").get().count;
    return { backend: "sqlite", migrationVersion: deviceMigrationVersion, source: "device-registry-and-ingestion", tables: ["asset_devices", "device_ingestion_log", "device_camera_captures", "device_camera_files"], counts: { devices: count("asset_devices"), ingestionLogs: count("device_ingestion_log"), cameraCaptures: count("device_camera_captures"), cameraFiles: count("device_camera_files") }, status: Object.fromEntries(statusRows.map((row) => [row.status, row.count])), staleActiveDevices: stale, relationshipIntegrity: { foreignKeysEnabled: db.prepare("PRAGMA foreign_keys").get().foreign_keys === 1, foreignKeyIssues: db.prepare("PRAGMA foreign_key_check").all().length } };
  });
}
