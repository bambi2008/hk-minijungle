import { buildOpsStateSnapshot, defaultOpsState, reduceOpsStateAction, sanitizeSnapshot } from "./ops-state-store.mjs";
import pg from "pg";

export const postgresMigrationVersion = "2026-08-17.postgres-runtime-v1";
const pools = new Map();

function parseJson(value, fallback) { if (value && typeof value === "object") return value; try { return JSON.parse(value || ""); } catch { return fallback; } }
function poolFor(url) {
  if (!pools.has(url)) pools.set(url, new pg.Pool({ connectionString: url, max: Number(process.env.DR_FOREST_DB_POOL_MAX || 20), idleTimeoutMillis: 30_000, connectionTimeoutMillis: 5_000, application_name: "dr-forest-fm-ops" }));
  return pools.get(url);
}
export function getPostgresPool() { return poolFor(databaseUrl()); }
function databaseUrl() {
  const url = String(process.env.DR_FOREST_DATABASE_URL || "").trim();
  if (!/^(postgres|postgresql):\/\//i.test(url)) throw new Error("DR_FOREST_DATABASE_URL must use postgres:// or postgresql://");
  return url;
}
async function withDatabase(callback) {
  const pool = poolFor(databaseUrl());
  return callback(pool);
}
async function initialize(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL);
    CREATE TABLE IF NOT EXISTS ops_events (
      id TEXT PRIMARY KEY, timestamp TIMESTAMPTZ NOT NULL, type TEXT NOT NULL, actor TEXT NOT NULL,
      entity_type TEXT NOT NULL, entity_id TEXT NOT NULL, client_id TEXT, wall_id TEXT,
      source TEXT NOT NULL, note TEXT, payload_json JSONB NOT NULL DEFAULT '{}'::jsonb
    );
    CREATE INDEX IF NOT EXISTS idx_ops_events_entity ON ops_events(entity_type, entity_id);
    CREATE INDEX IF NOT EXISTS idx_ops_events_client ON ops_events(client_id);
    CREATE INDEX IF NOT EXISTS idx_ops_events_timeline ON ops_events(timestamp DESC, id DESC);
    CREATE INDEX IF NOT EXISTS idx_ops_events_type_timeline ON ops_events(type, timestamp DESC, id DESC);
    CREATE TABLE IF NOT EXISTS ops_state_snapshots (
      revision INTEGER PRIMARY KEY, version TEXT NOT NULL, updated_at TIMESTAMPTZ,
      last_event_id TEXT, state_json JSONB NOT NULL
    );
    CREATE TABLE IF NOT EXISTS ops_actions (
      id TEXT PRIMARY KEY, timestamp TIMESTAMPTZ NOT NULL, type TEXT NOT NULL,
      entity_type TEXT NOT NULL, entity_id TEXT NOT NULL, client_id TEXT, wall_id TEXT,
      revision INTEGER NOT NULL, event_id TEXT, audit_event_id TEXT, value_json JSONB NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_ops_actions_revision ON ops_actions(revision);
    INSERT INTO schema_migrations (version, applied_at) VALUES ($1, NOW()) ON CONFLICT (version) DO NOTHING;
  `, [postgresMigrationVersion]);
}
async function latestSnapshot(client) {
  const result = await client.query("SELECT revision, version, updated_at, last_event_id, state_json FROM ops_state_snapshots ORDER BY revision DESC LIMIT 1");
  const row = result.rows[0];
  if (!row) return defaultOpsState();
  return sanitizeSnapshot({ version: row.version, revision: row.revision, updatedAt: row.updated_at?.toISOString?.() || row.updated_at, lastEventId: row.last_event_id, state: parseJson(row.state_json, defaultOpsState().state) });
}
function eventFromRow(row) {
  return { id: row.id, timestamp: row.timestamp?.toISOString?.() || row.timestamp, type: row.type, actor: row.actor, entityType: row.entity_type, entityId: row.entity_id, clientId: row.client_id || null, wallId: row.wall_id || null, source: row.source, note: row.note || "", payload: parseJson(row.payload_json, {}) };
}
async function insertSnapshot(client, snapshot) {
  const sanitized = sanitizeSnapshot(snapshot);
  await client.query("INSERT INTO ops_state_snapshots (revision, version, updated_at, last_event_id, state_json) VALUES ($1, $2, $3, $4, $5::jsonb)", [sanitized.revision, sanitized.version, sanitized.updatedAt, sanitized.lastEventId, JSON.stringify(sanitized.state)]);
  return sanitized;
}
async function insertAction(client, action, event, revision) {
  if (!action?.type) return;
  const id = `${event?.id || "ACT"}-${action.type}-${action.entityId}`;
  await client.query(`INSERT INTO ops_actions (id, timestamp, type, entity_type, entity_id, client_id, wall_id, revision, event_id, audit_event_id, value_json) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb) ON CONFLICT (id) DO UPDATE SET value_json = EXCLUDED.value_json`, [id, event?.timestamp || new Date().toISOString(), action.type, action.entityType, action.entityId, action.clientId || null, event?.wallId || null, revision, event?.id || null, action.auditEvent?.id || null, JSON.stringify(action.value || {})]);
}

export async function readPostgresOpsEvents() {
  return withDatabase(async (pool) => { await initialize(pool); const result = await pool.query("SELECT * FROM ops_events ORDER BY timestamp ASC, id ASC"); return result.rows.map(eventFromRow); });
}
export async function listPostgresOpsEvents(options = {}) {
  const requestedLimit = Number(options.limit);
  const limit = Math.min(Math.max(Number.isFinite(requestedLimit) && requestedLimit > 0 ? Math.floor(requestedLimit) : 100, 1), 500);
  const types = [...new Set((options.types || []).map((value) => String(value || "").trim()).filter(Boolean))].slice(0, 50);
  const entityType = String(options.entityType || "").trim();
  const clientIds = Array.isArray(options.clientIds) ? [...new Set(options.clientIds.map((value) => String(value || "").trim()).filter(Boolean))] : null;
  const before = String(options.before || "").trim();
  const beforeMs = before ? Date.parse(before) : NaN;
  const clauses = [];
  const params = [];
  const bind = (value) => { params.push(value); return `$${params.length}`; };
  if (types.length) clauses.push(`type IN (${types.map(bind).join(",")})`);
  if (entityType) clauses.push(`entity_type = ${bind(entityType)}`);
  if (clientIds && !clientIds.includes("*")) {
    if (clientIds.length) clauses.push(`(client_id = ANY(${bind(clientIds)}::text[]) OR client_id IS NULL)`);
    else clauses.push("client_id IS NULL");
  }
  if (Number.isFinite(beforeMs)) {
    const beforeIso = new Date(beforeMs).toISOString();
    const beforeValue = bind(beforeIso);
    const beforeId = bind(String(options.beforeId || ""));
    clauses.push(`(timestamp < ${beforeValue} OR (timestamp = ${beforeValue} AND id < ${beforeId}))`);
  }
  const limitValue = bind(limit);
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  return withDatabase(async (pool) => { await initialize(pool); const result = await pool.query(`SELECT * FROM ops_events ${where} ORDER BY timestamp DESC, id DESC LIMIT ${limitValue}`, params); return result.rows.map(eventFromRow); });
}
export async function appendPostgresOpsEvent(event) {
  return withDatabase(async (pool) => { await initialize(pool); await pool.query("INSERT INTO ops_events (id, timestamp, type, actor, entity_type, entity_id, client_id, wall_id, source, note, payload_json) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb)", [event.id, event.timestamp, event.type, event.actor, event.entityType, event.entityId, event.clientId, event.wallId, event.source, event.note || "", JSON.stringify(event.payload || {})]); return event; });
}
export async function readPostgresOpsState() { return withDatabase(async (pool) => { await initialize(pool); return latestSnapshot(pool); }); }
export async function savePostgresOpsStateSnapshot(input, event = null) {
  return withDatabase(async (pool) => { const client = await pool.connect(); try { await client.query("BEGIN"); const latest = await latestSnapshot(client); const snapshot = await insertSnapshot(client, buildOpsStateSnapshot(latest, input, event)); await client.query("COMMIT"); return snapshot; } catch (error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); } });
}
export async function applyPostgresOpsStateAction(input, event = null) {
  return withDatabase(async (pool) => { const client = await pool.connect(); try { await client.query("BEGIN"); const latest = await latestSnapshot(client); const actionPayload = input.action && typeof input.action === "object" ? input.action : input; const result = reduceOpsStateAction(latest, input, event); await insertSnapshot(client, result.snapshot); await insertAction(client, actionPayload, event, result.snapshot.revision); await client.query("COMMIT"); return result; } catch (error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); } });
}
export async function readPostgresOpsStorageHealth() {
  return withDatabase(async (pool) => { await initialize(pool); const [tables, events, actions, snapshots, latest, migrations] = await Promise.all([
    pool.query("SELECT tablename AS name FROM pg_tables WHERE schemaname = current_schema() ORDER BY tablename"),
    pool.query("SELECT COUNT(*)::int AS count FROM ops_events"),
    pool.query("SELECT COUNT(*)::int AS count FROM ops_actions"),
    pool.query("SELECT COUNT(*)::int AS count FROM ops_state_snapshots"),
    pool.query("SELECT revision FROM ops_state_snapshots ORDER BY revision DESC LIMIT 1"),
    pool.query("SELECT version, applied_at FROM schema_migrations ORDER BY applied_at ASC")
  ]); return { backend: "postgresql", migrationVersion: postgresMigrationVersion, tables: tables.rows.map((row) => row.name), counts: { opsEvents: events.rows[0].count, opsActions: actions.rows[0].count, opsStateSnapshots: snapshots.rows[0].count }, latestStateRevision: latest.rows[0]?.revision || 0, migrations: migrations.rows }; });
}
export async function closePostgresPools() { await Promise.all([...pools.values()].map((pool) => pool.end())); pools.clear(); }
