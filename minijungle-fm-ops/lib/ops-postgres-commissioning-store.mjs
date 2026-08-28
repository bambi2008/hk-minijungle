import { randomUUID } from "node:crypto";
import { getPostgresPool } from "./ops-postgres-store.mjs";
import {
  commissioningError,
  postgresCommissioningMigrationVersion,
  summarizeCommissioning,
  validateCommissioningPlan,
  validateCommissioningTransition
} from "./ops-commissioning-policy.mjs";

function parseJson(value, fallback = {}) { if (value && typeof value === "object") return value; try { return JSON.parse(value || ""); } catch { return fallback; } }
function iso(value) { return value instanceof Date ? value.toISOString() : value || null; }

async function initialize(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ops_module_commissioning (
      module_id TEXT PRIMARY KEY REFERENCES asset_modules(id) ON UPDATE CASCADE ON DELETE RESTRICT,
      client_id TEXT NOT NULL REFERENCES clients(id) ON UPDATE CASCADE ON DELETE RESTRICT,
      wall_id TEXT NOT NULL REFERENCES living_assets(id) ON UPDATE CASCADE ON DELETE RESTRICT,
      serial_number TEXT NOT NULL UNIQUE,public_code TEXT NOT NULL UNIQUE,hardware_revision TEXT,install_location TEXT,
      status TEXT NOT NULL CHECK(status IN ('planned','installed','verified','suspended','retired')),
      checklist_json JSONB NOT NULL DEFAULT '{}'::jsonb,installed_at TIMESTAMPTZ,installed_by TEXT,verified_at TIMESTAMPTZ,
      verified_by TEXT,suspended_at TIMESTAMPTZ,retired_at TIMESTAMPTZ,lifecycle_note TEXT,created_at TIMESTAMPTZ NOT NULL,updated_at TIMESTAMPTZ NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_pg_commissioning_scope ON ops_module_commissioning(client_id,wall_id,status);
    CREATE TABLE IF NOT EXISTS ops_module_commissioning_events (
      id TEXT PRIMARY KEY,module_id TEXT NOT NULL REFERENCES ops_module_commissioning(module_id) ON UPDATE CASCADE ON DELETE CASCADE,
      from_status TEXT,to_status TEXT NOT NULL,actor_id TEXT NOT NULL,actor_name TEXT NOT NULL,event_at TIMESTAMPTZ NOT NULL,
      idempotency_key TEXT NOT NULL,note TEXT,checklist_json JSONB NOT NULL DEFAULT '{}'::jsonb,UNIQUE(module_id,idempotency_key)
    );
    CREATE INDEX IF NOT EXISTS idx_pg_commissioning_events_module_time ON ops_module_commissioning_events(module_id,event_at DESC);
    INSERT INTO schema_migrations(version,applied_at) VALUES ($1,NOW()) ON CONFLICT(version) DO NOTHING;
  `, [postgresCommissioningMigrationVersion]);
}

const selectRecords = `SELECT m.id AS module_id,m.asset_id AS wall_id,m.client_id,m.label AS module_label,m.zone,m.position,m.source AS module_source,
  c.serial_number,c.public_code,c.hardware_revision,c.install_location,c.status,c.checklist_json,c.installed_at,c.installed_by,
  c.verified_at,c.verified_by,c.suspended_at,c.retired_at,c.lifecycle_note,c.created_at,c.updated_at
  FROM asset_modules m LEFT JOIN ops_module_commissioning c ON c.module_id=m.id`;

function recordFromRow(row) {
  return {
    moduleId: row.module_id, wallId: row.wall_id, clientId: row.client_id, moduleLabel: row.module_label,
    zone: row.zone || null, position: row.position === null ? null : Number(row.position), moduleSource: row.module_source,
    serialNumber: row.serial_number || null, publicCode: row.public_code || null, hardwareRevision: row.hardware_revision || null,
    installLocation: row.install_location || null, status: row.status || "unplanned", checklist: parseJson(row.checklist_json),
    installedAt: iso(row.installed_at), installedBy: row.installed_by || null, verifiedAt: iso(row.verified_at), verifiedBy: row.verified_by || null,
    suspendedAt: iso(row.suspended_at), retiredAt: iso(row.retired_at), lifecycleNote: row.lifecycle_note || null,
    createdAt: iso(row.created_at), updatedAt: iso(row.updated_at)
  };
}

function eventFromRow(row) { return { id: row.id, moduleId: row.module_id, fromStatus: row.from_status || null, toStatus: row.to_status, actorId: row.actor_id, actorName: row.actor_name, eventAt: iso(row.event_at), idempotencyKey: row.idempotency_key, note: row.note || null, checklist: parseJson(row.checklist_json) }; }

async function readRecord(client, moduleId) { const result = await client.query(`${selectRecords} WHERE m.id=$1`, [moduleId]); return result.rows[0] ? recordFromRow(result.rows[0]) : null; }

export async function listPostgresCommissioning(dbPath, { clientIds = null, wallId = null, status = null } = {}) {
  const pool = getPostgresPool(); await initialize(pool); const conditions = []; const values = [];
  if (wallId) { values.push(String(wallId)); conditions.push(`m.asset_id=$${values.length}`); }
  if (status === "unplanned") conditions.push("c.status IS NULL");
  else if (status) { values.push(String(status)); conditions.push(`c.status=$${values.length}`); }
  const result = await pool.query(`${selectRecords}${conditions.length ? ` WHERE ${conditions.join(" AND ")}` : ""} ORDER BY m.asset_id,m.position NULLS LAST,m.id`, values);
  const allowed = clientIds ? new Set(clientIds) : null; const records = result.rows.map(recordFromRow).filter((record) => !allowed || allowed.has(record.clientId));
  return { records, summary: summarizeCommissioning(records) };
}

export async function listPostgresCommissioningEvents(dbPath, moduleId) {
  const pool = getPostgresPool(); await initialize(pool); const result = await pool.query("SELECT * FROM ops_module_commissioning_events WHERE module_id=$1 ORDER BY event_at DESC,id DESC", [String(moduleId)]); return result.rows.map(eventFromRow);
}

export async function readPostgresCommissioningByCode(dbPath, publicCode) {
  const pool = getPostgresPool(); await initialize(pool); const result = await pool.query(`${selectRecords} WHERE c.public_code=$1`, [String(publicCode || "").trim().toUpperCase()]); return result.rows[0] ? recordFromRow(result.rows[0]) : null;
}

export async function planPostgresCommissioning(dbPath, input) {
  const plan = validateCommissioningPlan(input); const actorId = String(input.actorId || "").trim(); const actorName = String(input.actorName || actorId).trim(); const idempotencyKey = String(input.idempotencyKey || "").trim();
  if (!actorId || !idempotencyKey) throw commissioningError("actorId and idempotencyKey are required");
  const pool = getPostgresPool(); await initialize(pool); const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const replay = await client.query("SELECT * FROM ops_module_commissioning_events WHERE module_id=$1 AND idempotency_key=$2", [plan.moduleId,idempotencyKey]);
    if (replay.rows[0]) { const record = await readRecord(client, plan.moduleId); await client.query("COMMIT"); return { duplicate: true, record, event: eventFromRow(replay.rows[0]) }; }
    const moduleResult = await client.query("SELECT id,asset_id,client_id FROM asset_modules WHERE id=$1", [plan.moduleId]); const module = moduleResult.rows[0];
    if (!module) throw commissioningError("module not found", "COMMISSIONING_MODULE_NOT_FOUND", 404);
    const existing = await client.query("SELECT module_id FROM ops_module_commissioning WHERE module_id=$1", [plan.moduleId]);
    if (existing.rows[0]) throw commissioningError("module already has a commissioning record", "COMMISSIONING_ALREADY_PLANNED", 409);
    const now = new Date().toISOString(); const checklist = {};
    await client.query(`INSERT INTO ops_module_commissioning (module_id,client_id,wall_id,serial_number,public_code,hardware_revision,install_location,status,checklist_json,lifecycle_note,created_at,updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,'planned',$8::jsonb,$9,$10,$10)`, [plan.moduleId,module.client_id,module.asset_id,plan.serialNumber,plan.publicCode,plan.hardwareRevision,plan.installLocation,JSON.stringify(checklist),plan.note,now]);
    const event = { id: randomUUID(), moduleId: plan.moduleId, fromStatus: null, toStatus: "planned", actorId, actorName, eventAt: now, idempotencyKey, note: plan.note, checklist };
    await client.query("INSERT INTO ops_module_commissioning_events (id,module_id,from_status,to_status,actor_id,actor_name,event_at,idempotency_key,note,checklist_json) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb)", [event.id,event.moduleId,event.fromStatus,event.toStatus,event.actorId,event.actorName,event.eventAt,event.idempotencyKey,event.note,JSON.stringify(event.checklist)]);
    const record = await readRecord(client, plan.moduleId); await client.query("COMMIT"); return { duplicate: false, record, event };
  } catch (error) {
    await client.query("ROLLBACK");
    if (error?.code === "23505") throw commissioningError("serialNumber or publicCode already exists", "COMMISSIONING_IDENTITY_CONFLICT", 409);
    throw error;
  } finally { client.release(); }
}

export async function transitionPostgresCommissioning(dbPath, moduleId, input) {
  const actorId = String(input.actorId || "").trim(); const actorName = String(input.actorName || actorId).trim(); const idempotencyKey = String(input.idempotencyKey || "").trim();
  if (!actorId || !idempotencyKey) throw commissioningError("actorId and idempotencyKey are required");
  const pool = getPostgresPool(); await initialize(pool); const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const replay = await client.query("SELECT * FROM ops_module_commissioning_events WHERE module_id=$1 AND idempotency_key=$2", [moduleId,idempotencyKey]);
    if (replay.rows[0]) { const record = await readRecord(client, moduleId); await client.query("COMMIT"); return { duplicate: true, record, event: eventFromRow(replay.rows[0]) }; }
    const current = await readRecord(client, moduleId); const transition = validateCommissioningTransition(current,input);
    if (current.updatedAt !== transition.expectedUpdatedAt) throw commissioningError("commissioning record changed; refresh before retrying", "COMMISSIONING_VERSION_CONFLICT", 409);
    if (transition.toStatus === "verified" && current.installedBy === actorId) throw commissioningError("installer cannot independently verify the same module", "COMMISSIONING_REVIEW_SEPARATION_REQUIRED", 409);
    const now = new Date().toISOString();
    const result = await client.query(`UPDATE ops_module_commissioning SET status=$1,checklist_json=$2::jsonb,lifecycle_note=$3,
      installed_at=CASE WHEN $1='installed' THEN $4::timestamptz ELSE installed_at END,installed_by=CASE WHEN $1='installed' THEN $5 ELSE installed_by END,
      verified_at=CASE WHEN $1='verified' THEN $4::timestamptz ELSE verified_at END,verified_by=CASE WHEN $1='verified' THEN $5 ELSE verified_by END,
      suspended_at=CASE WHEN $1='suspended' THEN $4::timestamptz WHEN $1='installed' THEN NULL ELSE suspended_at END,
      retired_at=CASE WHEN $1='retired' THEN $4::timestamptz ELSE retired_at END,updated_at=$4::timestamptz
      WHERE module_id=$6 AND updated_at=$7::timestamptz`, [transition.toStatus,JSON.stringify(transition.checklist),transition.note,now,actorId,moduleId,transition.expectedUpdatedAt]);
    if (result.rowCount !== 1) throw commissioningError("commissioning record changed; refresh before retrying", "COMMISSIONING_VERSION_CONFLICT", 409);
    const event = { id: randomUUID(), moduleId, fromStatus: current.status, toStatus: transition.toStatus, actorId, actorName, eventAt: now, idempotencyKey, note: transition.note, checklist: transition.checklist };
    await client.query("INSERT INTO ops_module_commissioning_events (id,module_id,from_status,to_status,actor_id,actor_name,event_at,idempotency_key,note,checklist_json) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb)", [event.id,event.moduleId,event.fromStatus,event.toStatus,event.actorId,event.actorName,event.eventAt,event.idempotencyKey,event.note,JSON.stringify(event.checklist)]);
    const record = await readRecord(client,moduleId); await client.query("COMMIT"); return { duplicate: false, record, event };
  } catch (error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); }
}

export async function readPostgresCommissioningHealth(dbPath) {
  const pool = getPostgresPool(); await initialize(pool);
  const [recordsResult,eventCount,integrity] = await Promise.all([
    pool.query(`${selectRecords} ORDER BY m.id`),
    pool.query("SELECT COUNT(*)::int AS count FROM ops_module_commissioning_events"),
    pool.query("SELECT COUNT(*)::int AS count FROM ops_module_commissioning c LEFT JOIN asset_modules m ON m.id=c.module_id LEFT JOIN clients cl ON cl.id=c.client_id LEFT JOIN living_assets a ON a.id=c.wall_id WHERE m.id IS NULL OR cl.id IS NULL OR a.id IS NULL")
  ]);
  const records = recordsResult.rows.map(recordFromRow);
  return { backend: "postgresql", migrationVersion: postgresCommissioningMigrationVersion, tables: ["ops_module_commissioning","ops_module_commissioning_events"], counts: { records: records.filter((item) => item.status !== "unplanned").length, events: Number(eventCount.rows[0].count), unplanned: records.filter((item) => item.status === "unplanned").length, verified: records.filter((item) => item.status === "verified").length }, relationshipIntegrity: { foreignKeysEnabled: true, foreignKeyIssues: Number(integrity.rows[0].count) } };
}
