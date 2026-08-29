import { getPostgresPool } from "./ops-postgres-store.mjs";
import { encodeModuleCursor, moduleQueryCursorPositionMax, moduleQueryFilters, normalizeModuleQuery } from "./ops-module-query.mjs";

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

export async function listPostgresModulePage(dbPath, dataRoot, options = {}) {
  const pool = getPostgresPool(); await initialize(pool);
  const query = normalizeModuleQuery(options);
  const values = [];
  const clauses = [];
  const add = (value) => { values.push(value); return `$${values.length}`; };
  if (query.wallId) clauses.push(`asset_id = ${add(query.wallId)}`);
  if (query.clientId) clauses.push(`client_id = ${add(query.clientId)}`);
  if (query.clientIds) {
    if (!query.clientIds.length) return { items: [], page: { limit: query.limit, total: 0, hasMore: false, nextCursor: null }, filters: moduleQueryFilters(query) };
    clauses.push(`client_id = ANY(${add(query.clientIds)}::text[])`);
  }
  if (query.statuses.length) clauses.push(`status = ANY(${add(query.statuses)}::text[])`);
  if (query.search) clauses.push(`(id ILIKE ${add(`%${query.search}%`)} OR label ILIKE ${add(`%${query.search}%`)} OR asset_id ILIKE ${add(`%${query.search}%`)} OR zone ILIKE ${add(`%${query.search}%`)})`);
  if (query.cursor) {
    const assetId = add(query.cursor.assetId); const position = add(query.cursor.position); const id = add(query.cursor.id);
    clauses.push(`(asset_id > ${assetId} OR (asset_id = ${assetId} AND COALESCE(position, ${moduleQueryCursorPositionMax()}) > ${position}) OR (asset_id = ${assetId} AND COALESCE(position, ${moduleQueryCursorPositionMax()}) = ${position} AND id > ${id}))`);
  }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const countResult = await pool.query(`SELECT COUNT(*)::int AS count FROM asset_modules ${where}`, values);
  const pageValues = [...values, query.limit + 1];
  const rowsResult = await pool.query(`SELECT * FROM asset_modules ${where} ORDER BY asset_id ASC, position ASC NULLS LAST, id ASC LIMIT $${pageValues.length}`, pageValues);
  const items = rowsResult.rows.slice(0, query.limit).map(moduleFromRow);
  return {
    items,
    page: { limit: query.limit, total: Number(countResult.rows[0].count), hasMore: rowsResult.rows.length > query.limit, nextCursor: rowsResult.rows.length > query.limit ? encodeModuleCursor(items.at(-1)) : null },
    filters: moduleQueryFilters(query)
  };
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
