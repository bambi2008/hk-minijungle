import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import { DatabaseSync } from "node:sqlite";
import { dirname } from "node:path";

export const integrationMigrationVersion = "2026-08-29.ops-control-import-v1";

function storeError(message, code = "OPS_CONTROL_VALIDATION_ERROR", status = 400) { const error = new Error(message); error.code = code; error.status = status; return error; }
function required(value, field) { const text = String(value || "").trim(); if (!text) throw storeError(`${field} is required`); return text; }
function parseJson(value, fallback) { try { return JSON.parse(value || ""); } catch { return fallback; } }
async function withDatabase(dbPath, callback) { await mkdir(dirname(dbPath), { recursive: true }); const db = new DatabaseSync(dbPath); try { initializeSqliteIntegrationDatabase(db); return await callback(db); } finally { db.close(); } }
export function initializeSqliteIntegrationDatabase(db) {
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY, applied_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS ops_job_leases (
      job_name TEXT PRIMARY KEY, owner_id TEXT NOT NULL, acquired_at TEXT NOT NULL,
      heartbeat_at TEXT NOT NULL, lease_until TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS ops_idempotency_commands (
      scope TEXT NOT NULL, command_key TEXT NOT NULL, request_hash TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('processing','completed')), owner_id TEXT NOT NULL,
      lease_until TEXT NOT NULL, response_json TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
      PRIMARY KEY (scope, command_key)
    );
    CREATE TABLE IF NOT EXISTS ops_maintenance_imports (
      id TEXT PRIMARY KEY, source TEXT NOT NULL, source_filename TEXT NOT NULL, checksum TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('previewed','applied')), row_count INTEGER NOT NULL,
      valid_count INTEGER NOT NULL, invalid_count INTEGER NOT NULL, rows_json TEXT NOT NULL,
      errors_json TEXT NOT NULL, created_by TEXT NOT NULL, created_at TEXT NOT NULL,
      applied_by TEXT, applied_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_job_lease_until ON ops_job_leases(lease_until);
    CREATE INDEX IF NOT EXISTS idx_idempotency_lease ON ops_idempotency_commands(status, lease_until);
    CREATE INDEX IF NOT EXISTS idx_maintenance_import_checksum ON ops_maintenance_imports(checksum, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_maintenance_import_created ON ops_maintenance_imports(created_at DESC, id DESC);
  `);
  db.prepare("INSERT OR IGNORE INTO schema_migrations (version, applied_at) VALUES (?, ?)").run(integrationMigrationVersion, new Date().toISOString());
}
function leaseFromRow(row) { return row ? { jobName: row.job_name, ownerId: row.owner_id, acquiredAt: row.acquired_at, heartbeatAt: row.heartbeat_at, leaseUntil: row.lease_until } : null; }
function importFromRow(row, includeRows = false) {
  const result = { id: row.id, source: row.source, sourceFilename: row.source_filename, checksum: row.checksum, status: row.status, rowCount: Number(row.row_count), validCount: Number(row.valid_count), invalidCount: Number(row.invalid_count), errors: parseJson(row.errors_json, []), createdBy: row.created_by, createdAt: row.created_at, appliedBy: row.applied_by || null, appliedAt: row.applied_at || null };
  if (includeRows) result.rows = parseJson(row.rows_json, []);
  return result;
}

export async function acquireSqliteJobLease(dbPath, { jobName, ownerId, leaseSeconds = 120 } = {}) {
  return withDatabase(dbPath, (db) => {
    const job = required(jobName, "jobName"); const owner = required(ownerId, "ownerId"); const now = new Date(); const nowIso = now.toISOString(); const leaseUntil = new Date(now.getTime() + Math.max(30, Number(leaseSeconds) || 120) * 1000).toISOString();
    db.exec("BEGIN IMMEDIATE");
    try {
      const existing = db.prepare("SELECT * FROM ops_job_leases WHERE job_name=?").get(job);
      if (existing && existing.owner_id !== owner && existing.lease_until > nowIso) { db.exec("COMMIT"); return { acquired: false, lease: leaseFromRow(existing) }; }
      db.prepare("INSERT INTO ops_job_leases (job_name,owner_id,acquired_at,heartbeat_at,lease_until) VALUES (?,?,?,?,?) ON CONFLICT(job_name) DO UPDATE SET owner_id=excluded.owner_id,acquired_at=excluded.acquired_at,heartbeat_at=excluded.heartbeat_at,lease_until=excluded.lease_until").run(job, owner, nowIso, nowIso, leaseUntil);
      db.exec("COMMIT"); return { acquired: true, lease: leaseFromRow(db.prepare("SELECT * FROM ops_job_leases WHERE job_name=?").get(job)) };
    } catch (error) { db.exec("ROLLBACK"); throw error; }
  });
}

export async function releaseSqliteJobLease(dbPath, { jobName, ownerId } = {}) {
  return withDatabase(dbPath, (db) => ({ released: db.prepare("DELETE FROM ops_job_leases WHERE job_name=? AND owner_id=?").run(required(jobName, "jobName"), required(ownerId, "ownerId")).changes === 1 }));
}

export async function beginSqliteIdempotentCommand(dbPath, { scope, commandKey, requestHash, ownerId = randomUUID(), leaseSeconds = 300 } = {}) {
  return withDatabase(dbPath, (db) => {
    const safeScope = required(scope, "scope"); const key = required(commandKey, "commandKey"); const hash = required(requestHash, "requestHash"); const owner = required(ownerId, "ownerId");
    if (key.length > 128) throw storeError("Idempotency-Key must not exceed 128 characters", "IDEMPOTENCY_KEY_INVALID");
    const now = new Date(); const nowIso = now.toISOString(); const leaseUntil = new Date(now.getTime() + Math.max(30, Number(leaseSeconds) || 300) * 1000).toISOString();
    db.exec("BEGIN IMMEDIATE");
    try {
      const existing = db.prepare("SELECT * FROM ops_idempotency_commands WHERE scope=? AND command_key=?").get(safeScope, key);
      if (existing?.request_hash !== undefined && existing.request_hash !== hash) throw storeError("Idempotency-Key was already used with a different request", "IDEMPOTENCY_KEY_REUSED", 409);
      if (existing?.status === "completed") { db.exec("COMMIT"); return { acquired: false, duplicate: true, response: parseJson(existing.response_json, {}) }; }
      if (existing?.lease_until > nowIso && existing.owner_id !== owner) throw storeError("An identical command is still processing", "IDEMPOTENCY_COMMAND_BUSY", 409);
      db.prepare("INSERT INTO ops_idempotency_commands (scope,command_key,request_hash,status,owner_id,lease_until,created_at,updated_at) VALUES (?,?,?,'processing',?,?,?,?) ON CONFLICT(scope,command_key) DO UPDATE SET owner_id=excluded.owner_id,lease_until=excluded.lease_until,updated_at=excluded.updated_at").run(safeScope, key, hash, owner, leaseUntil, nowIso, nowIso);
      db.exec("COMMIT"); return { acquired: true, duplicate: false, ownerId: owner };
    } catch (error) { db.exec("ROLLBACK"); throw error; }
  });
}

export async function completeSqliteIdempotentCommand(dbPath, { scope, commandKey, ownerId, response } = {}) {
  return withDatabase(dbPath, (db) => { const now = new Date().toISOString(); const result = db.prepare("UPDATE ops_idempotency_commands SET status='completed',response_json=?,lease_until=?,updated_at=? WHERE scope=? AND command_key=? AND owner_id=? AND status='processing'").run(JSON.stringify(response || {}), now, now, required(scope, "scope"), required(commandKey, "commandKey"), required(ownerId, "ownerId")); if (!result.changes) throw storeError("Idempotent command ownership was lost", "IDEMPOTENCY_OWNERSHIP_LOST", 409); return response; });
}

export async function abandonSqliteIdempotentCommand(dbPath, { scope, commandKey, ownerId } = {}) {
  return withDatabase(dbPath, (db) => ({ abandoned: db.prepare("DELETE FROM ops_idempotency_commands WHERE scope=? AND command_key=? AND owner_id=? AND status='processing'").run(required(scope, "scope"), required(commandKey, "commandKey"), required(ownerId, "ownerId")).changes === 1 }));
}

export async function createSqliteMaintenanceImport(dbPath, input) {
  return withDatabase(dbPath, (db) => {
    const checksum = required(input?.checksum, "import.checksum"); const existing = db.prepare("SELECT * FROM ops_maintenance_imports WHERE checksum=? ORDER BY created_at DESC LIMIT 1").get(checksum);
    if (existing) return { duplicate: true, batch: importFromRow(existing, true) };
    const id = input?.id || `MIMP-${Date.now()}-${randomUUID().slice(0, 8)}`; const now = new Date().toISOString();
    db.prepare("INSERT INTO ops_maintenance_imports (id,source,source_filename,checksum,status,row_count,valid_count,invalid_count,rows_json,errors_json,created_by,created_at) VALUES (?,?,?,?,'previewed',?,?,?,?,?,?,?)").run(id, input.source || "airtable-csv", required(input.sourceFilename, "import.sourceFilename"), checksum, Number(input.rowCount), Number(input.validCount), Number(input.invalidCount), JSON.stringify(input.rows || []), JSON.stringify(input.errors || []), required(input.createdBy, "import.createdBy"), now);
    return { duplicate: false, batch: importFromRow(db.prepare("SELECT * FROM ops_maintenance_imports WHERE id=?").get(id), true) };
  });
}

export async function readSqliteMaintenanceImport(dbPath, id) { return withDatabase(dbPath, (db) => { const row = db.prepare("SELECT * FROM ops_maintenance_imports WHERE id=?").get(required(id, "import.id")); return row ? importFromRow(row, true) : null; }); }
export async function listSqliteMaintenanceImports(dbPath, limit = 20) { return withDatabase(dbPath, (db) => db.prepare("SELECT * FROM ops_maintenance_imports ORDER BY created_at DESC,id DESC LIMIT ?").all(Math.min(Math.max(Number(limit) || 20, 1), 100)).map((row) => importFromRow(row, false))); }
export async function markSqliteMaintenanceImportApplied(dbPath, id, appliedBy) { return withDatabase(dbPath, (db) => { const now = new Date().toISOString(); db.prepare("UPDATE ops_maintenance_imports SET status='applied',applied_by=?,applied_at=? WHERE id=? AND status='previewed'").run(required(appliedBy, "import.appliedBy"), now, required(id, "import.id")); const row = db.prepare("SELECT * FROM ops_maintenance_imports WHERE id=?").get(id); if (!row) throw storeError("Maintenance import batch not found", "MAINTENANCE_IMPORT_NOT_FOUND", 404); return importFromRow(row, true); }); }
export async function readSqliteIntegrationStorageHealth(dbPath) { return withDatabase(dbPath, (db) => { const imports = db.prepare("SELECT status,COUNT(*) AS count FROM ops_maintenance_imports GROUP BY status").all(); const counts = { previewed: 0, applied: 0 }; for (const row of imports) counts[row.status] = Number(row.count); return { backend: "sqlite", migrationVersion: integrationMigrationVersion, tables: ["ops_job_leases", "ops_idempotency_commands", "ops_maintenance_imports"], counts: { ...counts, activeLeases: Number(db.prepare("SELECT COUNT(*) AS count FROM ops_job_leases WHERE lease_until > ?").get(new Date().toISOString()).count), totalImports: counts.previewed + counts.applied } }; }); }
