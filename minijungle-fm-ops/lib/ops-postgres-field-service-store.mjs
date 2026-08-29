import { getPostgresPool } from "./ops-postgres-store.mjs";
import { normalizeFieldCycle, validateFieldCycleEvidence } from "./ops-field-cycle-evidence.mjs";

export const postgresFieldServiceCycleMigrationVersion = "2026-08-29.postgres-field-service-cycles-v1";

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

function iso(value) { return value?.toISOString?.() || value; }
function cycleFromRow(row) { return row ? { cycleId: row.cycle_id, clientId: row.client_id, workOrderId: row.work_order_id, moduleId: row.module_id, technicianId: row.technician_id, serviceAt: iso(row.service_at), status: row.status, durationMinutes: Number(row.duration_minutes), source: row.source, outcome: row.outcome, notes: row.notes || "", proofRefs: parseJson(row.proof_refs_json, []), importedBy: row.imported_by, importedAt: iso(row.imported_at), updatedAt: iso(row.updated_at) } : null; }

async function initialize(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL);
    CREATE TABLE IF NOT EXISTS ops_field_service_cycles (
      cycle_id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL REFERENCES clients(id) ON UPDATE CASCADE ON DELETE RESTRICT,
      work_order_id TEXT NOT NULL REFERENCES work_orders(id) ON UPDATE CASCADE ON DELETE RESTRICT,
      module_id TEXT NOT NULL REFERENCES asset_modules(id) ON UPDATE CASCADE ON DELETE RESTRICT,
      technician_id TEXT NOT NULL,
      service_at TIMESTAMPTZ NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('completed','exception')),
      duration_minutes INTEGER NOT NULL CHECK (duration_minutes BETWEEN 1 AND 1440),
      source TEXT NOT NULL CHECK (source IN ('airtable','ops','mobile','import')),
      outcome TEXT NOT NULL,
      notes TEXT NOT NULL DEFAULT '',
      proof_refs_json JSONB NOT NULL,
      source_record_json JSONB NOT NULL,
      imported_by TEXT NOT NULL,
      imported_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_pg_field_cycles_client_time ON ops_field_service_cycles(client_id, service_at DESC, cycle_id DESC);
    CREATE INDEX IF NOT EXISTS idx_pg_field_cycles_module_time ON ops_field_service_cycles(module_id, service_at DESC, cycle_id DESC);
    CREATE INDEX IF NOT EXISTS idx_pg_field_cycles_status_time ON ops_field_service_cycles(status, service_at DESC);
    INSERT INTO schema_migrations(version, applied_at) VALUES ($1, NOW()) ON CONFLICT(version) DO NOTHING;
  `, [postgresFieldServiceCycleMigrationVersion]);
}

function normalizedCycles(input) {
  const cycles = Array.isArray(input?.cycles) ? input.cycles : [];
  if (!cycles.length) throw fieldError("cycles must contain at least one record");
  return cycles.map((cycle, index) => normalizeFieldCycle(cycle, index));
}

async function assertCycleParents(client, cycle) {
  const result = await client.query(`SELECT c.id AS client_id, wo.id AS work_order_id, wo.wall_id, am.id AS module_id, am.client_id AS module_client_id, am.asset_id
    FROM clients c
    LEFT JOIN work_orders wo ON wo.id = $2
    LEFT JOIN asset_modules am ON am.id = $3
    WHERE c.id = $1`, [cycle.clientId, cycle.workOrderId, cycle.moduleId]);
  const row = result.rows[0];
  if (!row || row.work_order_id !== cycle.workOrderId || row.module_id !== cycle.moduleId || row.module_client_id !== cycle.clientId || row.asset_id !== row.wall_id) throw fieldError(`cycle ${cycle.cycleId} references a missing or mismatched client, work order or module`, "FIELD_CYCLE_RELATIONSHIP_INVALID", 409);
}

export async function importPostgresFieldServiceCycles(dbPath, input = {}) {
  const pool = getPostgresPool();
  await initialize(pool);
  const cycles = normalizedCycles(input);
  const actorId = required(input.actorId, "import.actorId");
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    let inserted = 0;
    let updated = 0;
    const saved = [];
    for (const cycle of cycles) {
      await assertCycleParents(client, cycle);
      const existing = (await client.query("SELECT cycle_id FROM ops_field_service_cycles WHERE cycle_id=$1 FOR UPDATE", [cycle.cycleId])).rows[0];
      const result = await client.query(`INSERT INTO ops_field_service_cycles (cycle_id,client_id,work_order_id,module_id,technician_id,service_at,status,duration_minutes,source,outcome,notes,proof_refs_json,source_record_json,imported_by,imported_at,updated_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb,$13::jsonb,$14,NOW(),NOW())
        ON CONFLICT(cycle_id) DO UPDATE SET client_id=EXCLUDED.client_id,work_order_id=EXCLUDED.work_order_id,module_id=EXCLUDED.module_id,technician_id=EXCLUDED.technician_id,service_at=EXCLUDED.service_at,status=EXCLUDED.status,duration_minutes=EXCLUDED.duration_minutes,source=EXCLUDED.source,outcome=EXCLUDED.outcome,notes=EXCLUDED.notes,proof_refs_json=EXCLUDED.proof_refs_json,source_record_json=EXCLUDED.source_record_json,imported_by=EXCLUDED.imported_by,updated_at=NOW()
        RETURNING *`, [cycle.cycleId, cycle.clientId, cycle.workOrderId, cycle.moduleId, cycle.technicianId, cycle.serviceAt, cycle.status, cycle.durationMinutes, cycle.source, cycle.outcome, cycle.notes, JSON.stringify(cycle.proofRefs), JSON.stringify(cycle), actorId]);
      if (existing) updated += 1; else inserted += 1;
      saved.push(cycleFromRow(result.rows[0]));
    }
    await client.query("COMMIT");
    return { version: postgresFieldServiceCycleMigrationVersion, backend: "postgresql", inserted, updated, total: saved.length, cycles: saved, gate: validateFieldCycleEvidence({ cycles: saved }) };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function listPostgresFieldServiceCycles(dbPath, { clientIds = null, limit = 500 } = {}) {
  const pool = getPostgresPool();
  await initialize(pool);
  const safeLimit = Math.min(Math.max(Number(limit) || 500, 1), 1000);
  const result = clientIds && !clientIds.includes("*")
    ? await pool.query("SELECT * FROM ops_field_service_cycles WHERE client_id=ANY($1::text[]) ORDER BY service_at DESC,cycle_id ASC LIMIT $2", [clientIds, safeLimit])
    : await pool.query("SELECT * FROM ops_field_service_cycles ORDER BY service_at DESC,cycle_id ASC LIMIT $1", [safeLimit]);
  return result.rows.map(cycleFromRow);
}

export async function readPostgresFieldServiceStorageHealth(dbPath) {
  const pool = getPostgresPool();
  await initialize(pool);
  const [total, completed, exceptions, clients, integrity] = await Promise.all([
    pool.query("SELECT COUNT(*)::int AS count FROM ops_field_service_cycles"),
    pool.query("SELECT COUNT(*)::int AS count FROM ops_field_service_cycles WHERE status='completed'"),
    pool.query("SELECT COUNT(*)::int AS count FROM ops_field_service_cycles WHERE status='exception'"),
    pool.query("SELECT COUNT(DISTINCT client_id)::int AS count FROM ops_field_service_cycles"),
    pool.query("SELECT COUNT(*)::int AS count FROM ops_field_service_cycles c LEFT JOIN clients cl ON cl.id=c.client_id LEFT JOIN work_orders wo ON wo.id=c.work_order_id LEFT JOIN asset_modules am ON am.id=c.module_id WHERE cl.id IS NULL OR wo.id IS NULL OR am.id IS NULL OR am.client_id <> c.client_id OR am.asset_id <> wo.wall_id")
  ]);
  return { backend: "postgresql", migrationVersion: postgresFieldServiceCycleMigrationVersion, tables: ["ops_field_service_cycles"], counts: { total: Number(total.rows[0].count), completed: Number(completed.rows[0].count), exceptions: Number(exceptions.rows[0].count), clients: Number(clients.rows[0].count) }, relationshipIntegrity: { foreignKeysEnabled: true, foreignKeyIssues: Number(integrity.rows[0].count) } };
}
