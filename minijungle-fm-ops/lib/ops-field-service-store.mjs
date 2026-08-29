import { mkdir } from "node:fs/promises";
import { DatabaseSync } from "node:sqlite";
import { dirname } from "node:path";
import { normalizeFieldCycle, validateFieldCycleEvidence } from "./ops-field-cycle-evidence.mjs";

export const fieldServiceCycleMigrationVersion = "2026-08-29.customer-field-service-ledger-v1";

function fieldError(message, code = "FIELD_CYCLE_VALIDATION_ERROR", status = 400) {
  const error = new Error(message);
  error.code = code;
  error.status = status;
  return error;
}

function parseJson(value, fallback) {
  if (value && typeof value === "object") return value;
  try { return JSON.parse(value || ""); } catch { return fallback; }
}

function required(value, field) {
  const text = String(value || "").trim();
  if (!text) throw fieldError(`${field} is required`);
  return text;
}

function cycleFromRow(row) {
  return row ? {
    cycleId: row.cycle_id,
    clientId: row.client_id,
    workOrderId: row.work_order_id,
    moduleId: row.module_id,
    technicianId: row.technician_id,
    serviceAt: row.service_at,
    status: row.status,
    durationMinutes: Number(row.duration_minutes),
    source: row.source,
    outcome: row.outcome,
    notes: row.notes || "",
    proofRefs: parseJson(row.proof_refs_json, []),
    importedBy: row.imported_by,
    importedAt: row.imported_at,
    updatedAt: row.updated_at
  } : null;
}

function initializeSqlite(db) {
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY, applied_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS ops_field_service_cycles (
      cycle_id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL,
      work_order_id TEXT NOT NULL,
      module_id TEXT NOT NULL,
      technician_id TEXT NOT NULL,
      service_at TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('completed','exception')),
      duration_minutes INTEGER NOT NULL CHECK (duration_minutes BETWEEN 1 AND 1440),
      source TEXT NOT NULL CHECK (source IN ('airtable','ops','mobile','import')),
      outcome TEXT NOT NULL,
      notes TEXT NOT NULL DEFAULT '',
      proof_refs_json TEXT NOT NULL,
      source_record_json TEXT NOT NULL,
      imported_by TEXT NOT NULL,
      imported_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON UPDATE CASCADE ON DELETE RESTRICT,
      FOREIGN KEY (work_order_id) REFERENCES work_orders(id) ON UPDATE CASCADE ON DELETE RESTRICT,
      FOREIGN KEY (module_id) REFERENCES asset_modules(id) ON UPDATE CASCADE ON DELETE RESTRICT
    );
    CREATE INDEX IF NOT EXISTS idx_field_cycles_client_time ON ops_field_service_cycles(client_id, service_at DESC, cycle_id DESC);
    CREATE INDEX IF NOT EXISTS idx_field_cycles_module_time ON ops_field_service_cycles(module_id, service_at DESC, cycle_id DESC);
    CREATE INDEX IF NOT EXISTS idx_field_cycles_status_time ON ops_field_service_cycles(status, service_at DESC);
  `);
  db.prepare("INSERT OR IGNORE INTO schema_migrations(version, applied_at) VALUES (?, ?)").run(fieldServiceCycleMigrationVersion, new Date().toISOString());
}

async function withSqlite(dbPath, callback) {
  await mkdir(dirname(dbPath), { recursive: true });
  const db = new DatabaseSync(dbPath);
  try { initializeSqlite(db); return await callback(db); } finally { db.close(); }
}

function assertCycleParents(db, cycle) {
  const client = db.prepare("SELECT id FROM clients WHERE id = ?").get(cycle.clientId);
  const workOrder = db.prepare("SELECT id, wall_id FROM work_orders WHERE id = ?").get(cycle.workOrderId);
  const module = db.prepare("SELECT id, asset_id, client_id FROM asset_modules WHERE id = ?").get(cycle.moduleId);
  if (!client || !workOrder || !module || module.client_id !== cycle.clientId || module.asset_id !== workOrder.wall_id) {
    throw fieldError(`cycle ${cycle.cycleId} references a missing or mismatched client, work order or module`, "FIELD_CYCLE_RELATIONSHIP_INVALID", 409);
  }
}

function normalizedCycles(input) {
  const cycles = Array.isArray(input?.cycles) ? input.cycles : [];
  if (!cycles.length) throw fieldError("cycles must contain at least one record");
  return cycles.map((cycle, index) => normalizeFieldCycle(cycle, index));
}

export async function importSqliteFieldServiceCycles(dbPath, input = {}) {
  return withSqlite(dbPath, async (db) => {
    const cycles = normalizedCycles(input);
    const actorId = required(input.actorId, "import.actorId");
    const now = new Date().toISOString();
    db.exec("BEGIN IMMEDIATE");
    try {
      let inserted = 0;
      let updated = 0;
      const saved = [];
      for (const cycle of cycles) {
        assertCycleParents(db, cycle);
        const existing = db.prepare("SELECT cycle_id FROM ops_field_service_cycles WHERE cycle_id = ?").get(cycle.cycleId);
        db.prepare(`INSERT INTO ops_field_service_cycles (cycle_id,client_id,work_order_id,module_id,technician_id,service_at,status,duration_minutes,source,outcome,notes,proof_refs_json,source_record_json,imported_by,imported_at,updated_at)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
          ON CONFLICT(cycle_id) DO UPDATE SET client_id=excluded.client_id,work_order_id=excluded.work_order_id,module_id=excluded.module_id,technician_id=excluded.technician_id,service_at=excluded.service_at,status=excluded.status,duration_minutes=excluded.duration_minutes,source=excluded.source,outcome=excluded.outcome,notes=excluded.notes,proof_refs_json=excluded.proof_refs_json,source_record_json=excluded.source_record_json,imported_by=excluded.imported_by,updated_at=excluded.updated_at`)
          .run(cycle.cycleId, cycle.clientId, cycle.workOrderId, cycle.moduleId, cycle.technicianId, cycle.serviceAt, cycle.status, cycle.durationMinutes, cycle.source, cycle.outcome, cycle.notes, JSON.stringify(cycle.proofRefs), JSON.stringify(cycle), actorId, now, now);
        if (existing) updated += 1; else inserted += 1;
        saved.push(cycleFromRow(db.prepare("SELECT * FROM ops_field_service_cycles WHERE cycle_id = ?").get(cycle.cycleId)));
      }
      db.exec("COMMIT");
      return { version: fieldServiceCycleMigrationVersion, backend: "sqlite", inserted, updated, total: saved.length, cycles: saved, gate: validateFieldCycleEvidence({ cycles: saved }) };
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  });
}

export async function listSqliteFieldServiceCycles(dbPath, { clientIds = null, limit = 500 } = {}) {
  return withSqlite(dbPath, (db) => {
    const safeLimit = Math.min(Math.max(Number(limit) || 500, 1), 1000);
    const rows = db.prepare("SELECT * FROM ops_field_service_cycles ORDER BY service_at DESC, cycle_id ASC LIMIT ?").all(safeLimit).map(cycleFromRow);
    return clientIds && !clientIds.includes("*") ? rows.filter((item) => clientIds.includes(item.clientId)) : rows;
  });
}

export async function readSqliteFieldServiceStorageHealth(dbPath) {
  return withSqlite(dbPath, (db) => {
    const total = Number(db.prepare("SELECT COUNT(*) AS count FROM ops_field_service_cycles").get().count);
    const completed = Number(db.prepare("SELECT COUNT(*) AS count FROM ops_field_service_cycles WHERE status='completed'").get().count);
    const exceptions = Number(db.prepare("SELECT COUNT(*) AS count FROM ops_field_service_cycles WHERE status='exception'").get().count);
    const clients = Number(db.prepare("SELECT COUNT(DISTINCT client_id) AS count FROM ops_field_service_cycles").get().count);
    const foreignKeyIssues = Number(db.prepare("SELECT COUNT(*) AS count FROM ops_field_service_cycles c LEFT JOIN clients cl ON cl.id=c.client_id LEFT JOIN work_orders wo ON wo.id=c.work_order_id LEFT JOIN asset_modules am ON am.id=c.module_id WHERE cl.id IS NULL OR wo.id IS NULL OR am.id IS NULL OR am.client_id <> c.client_id OR am.asset_id <> wo.wall_id").get().count);
    return { backend: "sqlite", migrationVersion: fieldServiceCycleMigrationVersion, tables: ["ops_field_service_cycles"], counts: { total, completed, exceptions, clients }, relationshipIntegrity: { foreignKeysEnabled: db.prepare("PRAGMA foreign_keys").get().foreign_keys === 1, foreignKeyIssues } };
  });
}
