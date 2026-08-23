import { getPostgresPool } from "./ops-postgres-store.mjs";

export const postgresModuleMigrationVersion = "2026-08-19.postgres-modules-v1";

function parseJson(value, fallback) { if (value && typeof value === "object") return value; try { return JSON.parse(value || ""); } catch { return fallback; } }
function validationError(message, code = "MODULE_VALIDATION_ERROR", status = 400) { const error = new Error(message); error.code = code; error.status = status; return error; }
function required(value, field) { const result = String(value || "").trim(); if (!result) throw validationError(`${field} is required`); return result; }
function moduleFromRow(row) { return { ...parseJson(row.raw_json, {}), id: row.id, assetId: row.asset_id, clientId: row.client_id, label: row.label, zone: row.zone || null, position: row.position === null ? null : Number(row.position), status: row.status, monitoringDevices: parseJson(row.monitoring_devices_json, {}), cameraId: row.camera_id || null, source: row.source, createdAt: row.created_at, updatedAt: row.updated_at }; }

async function initialize(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL);
    CREATE TABLE IF NOT EXISTS asset_modules (
      id TEXT PRIMARY KEY, asset_id TEXT NOT NULL REFERENCES living_assets(id) ON UPDATE CASCADE ON DELETE CASCADE,
      client_id TEXT NOT NULL REFERENCES clients(id) ON UPDATE CASCADE ON DELETE RESTRICT, label TEXT NOT NULL,
      zone TEXT, position BIGINT, status TEXT NOT NULL, monitoring_devices_json TEXT NOT NULL, camera_id TEXT,
      source TEXT NOT NULL, raw_json TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_pg_asset_modules_asset ON asset_modules(asset_id, position);
    CREATE INDEX IF NOT EXISTS idx_pg_asset_modules_client ON asset_modules(client_id);
    CREATE INDEX IF NOT EXISTS idx_pg_asset_modules_status ON asset_modules(status);
    INSERT INTO schema_migrations (version, applied_at) VALUES ($1, NOW()) ON CONFLICT (version) DO NOTHING;
  `, [postgresModuleMigrationVersion]);
}

export async function listPostgresModules(dbPath, dataRoot, { wallId = null, clientIds = null } = {}) {
  const pool = getPostgresPool(); await initialize(pool);
  const result = wallId
    ? await pool.query("SELECT * FROM asset_modules WHERE asset_id = $1 ORDER BY position ASC NULLS LAST, id ASC", [wallId])
    : await pool.query("SELECT * FROM asset_modules ORDER BY asset_id ASC, position ASC NULLS LAST, id ASC");
  const allowed = clientIds ? new Set(clientIds) : null;
  return result.rows.map(moduleFromRow).filter((item) => !allowed || allowed.has(item.clientId));
}

export async function upsertPostgresModule(dbPath, dataRoot, input) {
  const pool = getPostgresPool(); await initialize(pool);
  const now = new Date().toISOString();
  const module = {
    id: required(input?.id, "module.id"), assetId: required(input?.assetId, "module.assetId"), clientId: required(input?.clientId, "module.clientId"),
    label: required(input?.label, "module.label"), zone: input?.zone ? String(input.zone).trim() : null,
    position: Number.isInteger(Number(input?.position)) ? Number(input.position) : null,
    status: input?.status ? String(input.status).trim() : "active",
    monitoringDevices: input?.monitoringDevices && typeof input.monitoringDevices === "object" ? input.monitoringDevices : {},
    cameraId: input?.cameraId ? String(input.cameraId).trim() : null, source: input?.source ? String(input.source).trim() : "admin",
    createdAt: input?.createdAt || now, updatedAt: now
  };
  try {
    const result = await pool.query(`
      INSERT INTO asset_modules (id, asset_id, client_id, label, zone, position, status, monitoring_devices_json, camera_id, source, raw_json, created_at, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      ON CONFLICT(id) DO UPDATE SET asset_id=EXCLUDED.asset_id,client_id=EXCLUDED.client_id,label=EXCLUDED.label,zone=EXCLUDED.zone,
        position=EXCLUDED.position,status=EXCLUDED.status,monitoring_devices_json=EXCLUDED.monitoring_devices_json,camera_id=EXCLUDED.camera_id,
        source=EXCLUDED.source,raw_json=EXCLUDED.raw_json,updated_at=EXCLUDED.updated_at
      RETURNING *
    `, [module.id, module.assetId, module.clientId, module.label, module.zone, module.position, module.status, JSON.stringify(module.monitoringDevices), module.cameraId, module.source, JSON.stringify(module), module.createdAt, module.updatedAt]);
    return moduleFromRow(result.rows[0]);
  } catch (error) {
    if (error?.code === "23503") throw validationError("module references a missing asset or client");
    throw error;
  }
}

export async function readPostgresModuleStorageHealth(dbPath, dataRoot) {
  const pool = getPostgresPool(); await initialize(pool);
  const [count, checks] = await Promise.all([
    pool.query("SELECT COUNT(*)::int AS count FROM asset_modules"),
    Promise.all([
      pool.query("SELECT COUNT(*)::int AS count FROM asset_modules m LEFT JOIN living_assets a ON a.id = m.asset_id WHERE a.id IS NULL"),
      pool.query("SELECT COUNT(*)::int AS count FROM asset_modules m LEFT JOIN clients c ON c.id = m.client_id WHERE c.id IS NULL")
    ])
  ]);
  return { backend: "postgresql", migrationVersion: postgresModuleMigrationVersion, source: "module-level-master-data", counts: { modules: Number(count.rows[0].count) }, relationshipIntegrity: { foreignKeysEnabled: true, foreignKeyIssues: checks.reduce((sum, result) => sum + Number(result.rows[0].count), 0) } };
}
