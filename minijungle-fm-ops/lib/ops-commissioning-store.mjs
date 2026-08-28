import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";
import {
  commissioningError,
  commissioningMigrationVersion,
  summarizeCommissioning,
  validateCommissioningPlan,
  validateCommissioningTransition
} from "./ops-commissioning-policy.mjs";

function parseJson(value, fallback = {}) { try { return JSON.parse(value || ""); } catch { return fallback; } }

function initialize(db) {
  db.exec(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY, applied_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS ops_module_commissioning (
      module_id TEXT PRIMARY KEY REFERENCES asset_modules(id) ON UPDATE CASCADE ON DELETE RESTRICT,
      client_id TEXT NOT NULL REFERENCES clients(id) ON UPDATE CASCADE ON DELETE RESTRICT,
      wall_id TEXT NOT NULL REFERENCES living_assets(id) ON UPDATE CASCADE ON DELETE RESTRICT,
      serial_number TEXT NOT NULL UNIQUE,
      public_code TEXT NOT NULL UNIQUE,
      hardware_revision TEXT,
      install_location TEXT,
      status TEXT NOT NULL CHECK(status IN ('planned','installed','verified','suspended','retired')),
      checklist_json TEXT NOT NULL,
      installed_at TEXT,
      installed_by TEXT,
      verified_at TEXT,
      verified_by TEXT,
      suspended_at TEXT,
      retired_at TEXT,
      lifecycle_note TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_commissioning_scope ON ops_module_commissioning(client_id, wall_id, status);
    CREATE TABLE IF NOT EXISTS ops_module_commissioning_events (
      id TEXT PRIMARY KEY,
      module_id TEXT NOT NULL REFERENCES ops_module_commissioning(module_id) ON UPDATE CASCADE ON DELETE CASCADE,
      from_status TEXT,
      to_status TEXT NOT NULL,
      actor_id TEXT NOT NULL,
      actor_name TEXT NOT NULL,
      event_at TEXT NOT NULL,
      idempotency_key TEXT NOT NULL,
      note TEXT,
      checklist_json TEXT NOT NULL,
      UNIQUE(module_id, idempotency_key)
    );
    CREATE INDEX IF NOT EXISTS idx_commissioning_events_module_time ON ops_module_commissioning_events(module_id, event_at DESC);
  `);
  db.prepare("INSERT OR IGNORE INTO schema_migrations (version, applied_at) VALUES (?, ?)").run(commissioningMigrationVersion, new Date().toISOString());
}

async function withDatabase(dbPath, callback) {
  await mkdir(dirname(dbPath), { recursive: true });
  const db = new DatabaseSync(dbPath);
  try { initialize(db); return callback(db); } finally { db.close(); }
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
    installedAt: row.installed_at || null, installedBy: row.installed_by || null, verifiedAt: row.verified_at || null,
    verifiedBy: row.verified_by || null, suspendedAt: row.suspended_at || null, retiredAt: row.retired_at || null,
    lifecycleNote: row.lifecycle_note || null, createdAt: row.created_at || null, updatedAt: row.updated_at || null
  };
}

function readRecord(db, moduleId) { const row = db.prepare(`${selectRecords} WHERE m.id=?`).get(moduleId); return row ? recordFromRow(row) : null; }
function eventFromRow(row) { return { id: row.id, moduleId: row.module_id, fromStatus: row.from_status || null, toStatus: row.to_status, actorId: row.actor_id, actorName: row.actor_name, eventAt: row.event_at, idempotencyKey: row.idempotency_key, note: row.note || null, checklist: parseJson(row.checklist_json) }; }

export async function listSqliteCommissioning(dbPath, { clientIds = null, wallId = null, status = null } = {}) {
  return withDatabase(dbPath, (db) => {
    const conditions = []; const values = [];
    if (wallId) { conditions.push("m.asset_id=?"); values.push(String(wallId)); }
    if (status === "unplanned") conditions.push("c.status IS NULL");
    else if (status) { conditions.push("c.status=?"); values.push(String(status)); }
    const rows = db.prepare(`${selectRecords}${conditions.length ? ` WHERE ${conditions.join(" AND ")}` : ""} ORDER BY m.asset_id,m.position,m.id`).all(...values).map(recordFromRow);
    const allowed = clientIds ? new Set(clientIds) : null;
    const records = rows.filter((record) => !allowed || allowed.has(record.clientId));
    return { records, summary: summarizeCommissioning(records) };
  });
}

export async function listSqliteCommissioningEvents(dbPath, moduleId) {
  return withDatabase(dbPath, (db) => db.prepare("SELECT * FROM ops_module_commissioning_events WHERE module_id=? ORDER BY event_at DESC,id DESC").all(String(moduleId)).map(eventFromRow));
}

export async function readSqliteCommissioningByCode(dbPath, publicCode) {
  return withDatabase(dbPath, (db) => { const row = db.prepare(`${selectRecords} WHERE c.public_code=?`).get(String(publicCode || "").trim().toUpperCase()); return row ? recordFromRow(row) : null; });
}

export async function planSqliteCommissioning(dbPath, input) {
  const plan = validateCommissioningPlan(input); const actorId = String(input.actorId || "").trim(); const actorName = String(input.actorName || actorId).trim(); const idempotencyKey = String(input.idempotencyKey || "").trim();
  if (!actorId || !idempotencyKey) throw commissioningError("actorId and idempotencyKey are required");
  return withDatabase(dbPath, (db) => {
    db.exec("BEGIN IMMEDIATE");
    try {
      const replay = db.prepare("SELECT * FROM ops_module_commissioning_events WHERE module_id=? AND idempotency_key=?").get(plan.moduleId, idempotencyKey);
      if (replay) { const record = readRecord(db, plan.moduleId); db.exec("COMMIT"); return { duplicate: true, record, event: eventFromRow(replay) }; }
      const module = db.prepare("SELECT id,asset_id,client_id FROM asset_modules WHERE id=?").get(plan.moduleId);
      if (!module) throw commissioningError("module not found", "COMMISSIONING_MODULE_NOT_FOUND", 404);
      if (db.prepare("SELECT module_id FROM ops_module_commissioning WHERE module_id=?").get(plan.moduleId)) throw commissioningError("module already has a commissioning record", "COMMISSIONING_ALREADY_PLANNED", 409);
      const now = new Date().toISOString(); const checklist = {};
      db.prepare(`INSERT INTO ops_module_commissioning (module_id,client_id,wall_id,serial_number,public_code,hardware_revision,install_location,status,checklist_json,lifecycle_note,created_at,updated_at)
        VALUES (?,?,?,?,?,?,?,'planned',?,?,?,?)`).run(plan.moduleId, module.client_id, module.asset_id, plan.serialNumber, plan.publicCode, plan.hardwareRevision, plan.installLocation, JSON.stringify(checklist), plan.note, now, now);
      const event = { id: randomUUID(), moduleId: plan.moduleId, fromStatus: null, toStatus: "planned", actorId, actorName, eventAt: now, idempotencyKey, note: plan.note, checklist };
      db.prepare("INSERT INTO ops_module_commissioning_events (id,module_id,from_status,to_status,actor_id,actor_name,event_at,idempotency_key,note,checklist_json) VALUES (?,?,?,?,?,?,?,?,?,?)").run(event.id,event.moduleId,event.fromStatus,event.toStatus,event.actorId,event.actorName,event.eventAt,event.idempotencyKey,event.note,JSON.stringify(event.checklist));
      const record = readRecord(db, plan.moduleId); db.exec("COMMIT"); return { duplicate: false, record, event };
    } catch (error) {
      db.exec("ROLLBACK");
      if (String(error?.message || "").includes("UNIQUE constraint failed")) throw commissioningError("serialNumber or publicCode already exists", "COMMISSIONING_IDENTITY_CONFLICT", 409);
      throw error;
    }
  });
}

export async function transitionSqliteCommissioning(dbPath, moduleId, input) {
  const actorId = String(input.actorId || "").trim(); const actorName = String(input.actorName || actorId).trim(); const idempotencyKey = String(input.idempotencyKey || "").trim();
  if (!actorId || !idempotencyKey) throw commissioningError("actorId and idempotencyKey are required");
  return withDatabase(dbPath, (db) => {
    db.exec("BEGIN IMMEDIATE");
    try {
      const replay = db.prepare("SELECT * FROM ops_module_commissioning_events WHERE module_id=? AND idempotency_key=?").get(moduleId, idempotencyKey);
      if (replay) { const record = readRecord(db, moduleId); db.exec("COMMIT"); return { duplicate: true, record, event: eventFromRow(replay) }; }
      const current = readRecord(db, moduleId); const transition = validateCommissioningTransition(current, input);
      if (current.updatedAt !== transition.expectedUpdatedAt) throw commissioningError("commissioning record changed; refresh before retrying", "COMMISSIONING_VERSION_CONFLICT", 409);
      if (transition.toStatus === "verified" && current.installedBy === actorId) throw commissioningError("installer cannot independently verify the same module", "COMMISSIONING_REVIEW_SEPARATION_REQUIRED", 409);
      const now = new Date().toISOString();
      const result = db.prepare(`UPDATE ops_module_commissioning SET status=?,checklist_json=?,lifecycle_note=?,
        installed_at=CASE WHEN ?='installed' THEN ? ELSE installed_at END,installed_by=CASE WHEN ?='installed' THEN ? ELSE installed_by END,
        verified_at=CASE WHEN ?='verified' THEN ? ELSE verified_at END,verified_by=CASE WHEN ?='verified' THEN ? ELSE verified_by END,
        suspended_at=CASE WHEN ?='suspended' THEN ? WHEN ?='installed' THEN NULL ELSE suspended_at END,
        retired_at=CASE WHEN ?='retired' THEN ? ELSE retired_at END,updated_at=? WHERE module_id=? AND updated_at=?`)
        .run(transition.toStatus,JSON.stringify(transition.checklist),transition.note,transition.toStatus,now,transition.toStatus,actorId,transition.toStatus,now,transition.toStatus,actorId,transition.toStatus,now,transition.toStatus,transition.toStatus,now,now,moduleId,transition.expectedUpdatedAt);
      if (result.changes !== 1) throw commissioningError("commissioning record changed; refresh before retrying", "COMMISSIONING_VERSION_CONFLICT", 409);
      const event = { id: randomUUID(), moduleId, fromStatus: current.status, toStatus: transition.toStatus, actorId, actorName, eventAt: now, idempotencyKey, note: transition.note, checklist: transition.checklist };
      db.prepare("INSERT INTO ops_module_commissioning_events (id,module_id,from_status,to_status,actor_id,actor_name,event_at,idempotency_key,note,checklist_json) VALUES (?,?,?,?,?,?,?,?,?,?)").run(event.id,event.moduleId,event.fromStatus,event.toStatus,event.actorId,event.actorName,event.eventAt,event.idempotencyKey,event.note,JSON.stringify(event.checklist));
      const record = readRecord(db, moduleId); db.exec("COMMIT"); return { duplicate: false, record, event };
    } catch (error) { db.exec("ROLLBACK"); throw error; }
  });
}

export async function readSqliteCommissioningHealth(dbPath) {
  return withDatabase(dbPath, (db) => {
    const records = db.prepare(`${selectRecords} ORDER BY m.id`).all().map(recordFromRow); const fkIssues = db.prepare("PRAGMA foreign_key_check").all().length;
    return { backend: "sqlite", migrationVersion: commissioningMigrationVersion, tables: ["ops_module_commissioning","ops_module_commissioning_events"], counts: { records: records.filter((item) => item.status !== "unplanned").length, events: db.prepare("SELECT COUNT(*) AS count FROM ops_module_commissioning_events").get().count, unplanned: records.filter((item) => item.status === "unplanned").length, verified: records.filter((item) => item.status === "verified").length }, relationshipIntegrity: { foreignKeysEnabled: db.prepare("PRAGMA foreign_keys").get().foreign_keys === 1, foreignKeyIssues: fkIssues } };
  });
}
