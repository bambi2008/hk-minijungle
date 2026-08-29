import { mkdir } from "node:fs/promises";
import { DatabaseSync } from "node:sqlite";
import { dirname } from "node:path";
import { getPostgresPool } from "./ops-postgres-store.mjs";
import { initializeSqliteIntegrationDatabase } from "./ops-integration-store.mjs";
import { initializeSqliteMasterDataDatabase } from "./ops-master-data-store.mjs";
import { initializeSqliteOpsDatabase } from "./ops-sqlite-store.mjs";
import { initializePostgresIntegrationDatabase } from "./ops-postgres-integration-store.mjs";
import { initializePostgresMasterDataDatabase } from "./ops-postgres-master-data-store.mjs";
import { initializePostgresOpsDatabase } from "./ops-postgres-store.mjs";
import { findStaleMaintenanceImportRows } from "./ops-maintenance-import-policy.mjs";

export const maintenanceImportApplyVersion = "2026-08-29.atomic-maintenance-import-v1";

function storeError(message, code = "MAINTENANCE_IMPORT_APPLY_ERROR", status = 400) {
  const error = new Error(message);
  error.code = code;
  error.status = status;
  return error;
}

function required(value, field) {
  const text = String(value || "").trim();
  if (!text) throw storeError(`${field} is required`);
  return text;
}

function parseJson(value, fallback) {
  if (value && typeof value === "object") return value;
  try {
    return JSON.parse(value || "");
  } catch {
    return fallback;
  }
}

function isoValue(value) {
  return value?.toISOString?.() || value || null;
}

function importFromRow(row, includeRows = false) {
  const result = {
    id: row.id,
    source: row.source,
    sourceFilename: row.source_filename,
    checksum: row.checksum,
    status: row.status,
    rowCount: Number(row.row_count),
    validCount: Number(row.valid_count),
    invalidCount: Number(row.invalid_count),
    errors: parseJson(row.errors_json, []),
    createdBy: row.created_by,
    createdAt: isoValue(row.created_at),
    appliedBy: row.applied_by || null,
    appliedAt: isoValue(row.applied_at)
  };
  if (includeRows) result.rows = parseJson(row.rows_json, []);
  return result;
}

function normalizeWorkOrders(rows) {
  if (!Array.isArray(rows)) throw storeError("maintenance import rows are invalid", "MAINTENANCE_IMPORT_ROWS_INVALID");
  return rows.map((row, index) => {
    const input = row?.workOrder;
    if (!input || typeof input !== "object") throw storeError(`maintenance row ${index + 1} has no work order`, "MAINTENANCE_IMPORT_ROWS_INVALID");
    const order = {
      ...input,
      id: required(input.id, `maintenance row ${index + 1}.workOrder.id`),
      wallId: required(input.wallId, `maintenance row ${index + 1}.workOrder.wallId`),
      type: required(input.type, `maintenance row ${index + 1}.workOrder.type`),
      due: input.due || null,
      status: input.status || "Scheduled",
      priority: input.priority || "medium",
      tasks: Array.isArray(input.tasks) ? input.tasks : []
    };
    return order;
  });
}

function normalizeEvent(input) {
  const event = input && typeof input === "object" ? input : {};
  return {
    id: required(event.id, "event.id"),
    timestamp: event.timestamp || new Date().toISOString(),
    type: required(event.type, "event.type"),
    actor: required(event.actor, "event.actor"),
    entityType: required(event.entityType, "event.entityType"),
    entityId: required(event.entityId, "event.entityId"),
    clientId: event.clientId || null,
    wallId: event.wallId || null,
    source: required(event.source, "event.source"),
    note: event.note || "",
    payload: event.payload && typeof event.payload === "object" ? event.payload : {}
  };
}

function resultFor({ batch, workOrders, event, duplicate }) {
  return {
    duplicate,
    imported: workOrders.length,
    batch,
    workOrderIds: workOrders.map((order) => order.id),
    event: duplicate ? null : event
  };
}

function staleSourceError(conflicts) {
  const error = storeError("maintenance import contains source versions older than existing work orders", "MAINTENANCE_IMPORT_STALE_SOURCE", 409);
  error.details = { conflictCount: conflicts.length, conflicts: conflicts.slice(0, 50) };
  return error;
}

function chunks(items, size = 300) {
  const result = [];
  for (let index = 0; index < items.length; index += size) result.push(items.slice(index, index + size));
  return result;
}

function readSqliteExistingWorkOrders(db, ids) {
  const rows = [];
  for (const chunk of chunks([...new Set(ids)])) {
    if (!chunk.length) continue;
    const placeholders = chunk.map(() => "?").join(",");
    rows.push(...db.prepare(`SELECT id, raw_json FROM work_orders WHERE id IN (${placeholders})`).all(...chunk));
  }
  return rows.map((row) => ({ ...parseJson(row.raw_json, {}), id: row.id }));
}

function insertSqliteEvent(db, event) {
  db.prepare(`
    INSERT INTO ops_events (
      id, timestamp, type, actor, entity_type, entity_id, client_id, wall_id, source, note, payload_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    event.id,
    event.timestamp,
    event.type,
    event.actor,
    event.entityType,
    event.entityId,
    event.clientId,
    event.wallId,
    event.source,
    event.note,
    JSON.stringify(event.payload)
  );
}

function upsertSqliteWorkOrderInTransaction(db, order) {
  db.prepare(`
    INSERT INTO work_orders (id, wall_id, type, due, status, priority, tasks_json, raw_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      wall_id = excluded.wall_id,
      type = excluded.type,
      due = excluded.due,
      status = excluded.status,
      priority = excluded.priority,
      tasks_json = excluded.tasks_json,
      raw_json = excluded.raw_json
  `).run(order.id, order.wallId, order.type, order.due, order.status, order.priority, JSON.stringify(order.tasks), JSON.stringify(order));
}

export async function applySqliteMaintenanceImport(dbPath, { batchId, appliedBy, event } = {}) {
  await mkdir(dirname(dbPath), { recursive: true });
  const db = new DatabaseSync(dbPath);
  let inTransaction = false;
  try {
    initializeSqliteIntegrationDatabase(db);
    initializeSqliteMasterDataDatabase(db);
    initializeSqliteOpsDatabase(db);
    const id = required(batchId, "import.batchId");
    const actor = required(appliedBy, "import.appliedBy");
    const normalizedEvent = normalizeEvent(event);
    db.exec("BEGIN IMMEDIATE");
    inTransaction = true;
    const row = db.prepare("SELECT * FROM ops_maintenance_imports WHERE id = ?").get(id);
    if (!row) throw storeError("Maintenance import batch not found", "MAINTENANCE_IMPORT_NOT_FOUND", 404);
    const batch = importFromRow(row, true);
    const workOrders = normalizeWorkOrders(batch.rows);
    if (batch.status === "applied") {
      db.exec("COMMIT");
      inTransaction = false;
      return resultFor({ batch, workOrders, event: normalizedEvent, duplicate: true });
    }
    if (batch.invalidCount > 0) throw storeError("maintenance import contains invalid rows and cannot be applied", "MAINTENANCE_IMPORT_HAS_ERRORS", 409);
    const staleConflicts = findStaleMaintenanceImportRows(batch.rows, readSqliteExistingWorkOrders(db, workOrders.map((order) => order.id)));
    if (staleConflicts.length) throw staleSourceError(staleConflicts);
    for (const order of workOrders) upsertSqliteWorkOrderInTransaction(db, order);
    const appliedAt = new Date().toISOString();
    const update = db.prepare("UPDATE ops_maintenance_imports SET status='applied', applied_by=?, applied_at=? WHERE id=? AND status='previewed'").run(actor, appliedAt, id);
    if (update.changes !== 1) throw storeError("Maintenance import batch changed while applying", "MAINTENANCE_IMPORT_STATE_CONFLICT", 409);
    insertSqliteEvent(db, normalizedEvent);
    const appliedRow = db.prepare("SELECT * FROM ops_maintenance_imports WHERE id = ?").get(id);
    db.exec("COMMIT");
    inTransaction = false;
    return resultFor({ batch: importFromRow(appliedRow, true), workOrders, event: normalizedEvent, duplicate: false });
  } catch (error) {
    if (inTransaction) {
      try { db.exec("ROLLBACK"); } catch {}
    }
    throw error;
  } finally {
    db.close();
  }
}

async function insertPostgresEvent(client, event) {
  await client.query(
    "INSERT INTO ops_events (id, timestamp, type, actor, entity_type, entity_id, client_id, wall_id, source, note, payload_json) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb)",
    [event.id, event.timestamp, event.type, event.actor, event.entityType, event.entityId, event.clientId, event.wallId, event.source, event.note, JSON.stringify(event.payload)]
  );
}

async function upsertPostgresWorkOrderInTransaction(client, order) {
  const result = await client.query(`
    INSERT INTO work_orders (id, wall_id, type, due, status, priority, tasks_json, raw_json)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    ON CONFLICT(id) DO UPDATE SET
      wall_id = EXCLUDED.wall_id,
      type = EXCLUDED.type,
      due = EXCLUDED.due,
      status = EXCLUDED.status,
      priority = EXCLUDED.priority,
      tasks_json = EXCLUDED.tasks_json,
      raw_json = EXCLUDED.raw_json
    RETURNING id
  `, [order.id, order.wallId, order.type, order.due, order.status, order.priority, JSON.stringify(order.tasks), JSON.stringify(order)]);
  return result.rows[0].id;
}

async function readPostgresExistingWorkOrders(client, ids) {
  const uniqueIds = [...new Set(ids)];
  if (!uniqueIds.length) return [];
  const result = await client.query("SELECT id, raw_json FROM work_orders WHERE id=ANY($1::text[])", [uniqueIds]);
  return result.rows.map((row) => ({ ...parseJson(row.raw_json, {}), id: row.id }));
}

export async function applyPostgresMaintenanceImport(dbPath, { batchId, appliedBy, event } = {}) {
  const pool = getPostgresPool();
  const client = await pool.connect();
  let inTransaction = false;
  try {
    await initializePostgresIntegrationDatabase(client);
    await initializePostgresMasterDataDatabase(client);
    await initializePostgresOpsDatabase(client);
    const id = required(batchId, "import.batchId");
    const actor = required(appliedBy, "import.appliedBy");
    const normalizedEvent = normalizeEvent(event);
    await client.query("BEGIN");
    inTransaction = true;
    const result = await client.query("SELECT * FROM ops_maintenance_imports WHERE id=$1 FOR UPDATE", [id]);
    const row = result.rows[0];
    if (!row) throw storeError("Maintenance import batch not found", "MAINTENANCE_IMPORT_NOT_FOUND", 404);
    const batch = importFromRow(row, true);
    const workOrders = normalizeWorkOrders(batch.rows);
    if (batch.status === "applied") {
      await client.query("COMMIT");
      inTransaction = false;
      return resultFor({ batch, workOrders, event: normalizedEvent, duplicate: true });
    }
    if (batch.invalidCount > 0) throw storeError("maintenance import contains invalid rows and cannot be applied", "MAINTENANCE_IMPORT_HAS_ERRORS", 409);
    const staleConflicts = findStaleMaintenanceImportRows(batch.rows, await readPostgresExistingWorkOrders(client, workOrders.map((order) => order.id)));
    if (staleConflicts.length) throw staleSourceError(staleConflicts);
    for (const order of workOrders) await upsertPostgresWorkOrderInTransaction(client, order);
    const applied = await client.query("UPDATE ops_maintenance_imports SET status='applied', applied_by=$1, applied_at=NOW() WHERE id=$2 AND status='previewed' RETURNING *", [actor, id]);
    if (!applied.rows[0]) throw storeError("Maintenance import batch changed while applying", "MAINTENANCE_IMPORT_STATE_CONFLICT", 409);
    await insertPostgresEvent(client, normalizedEvent);
    await client.query("COMMIT");
    inTransaction = false;
    return resultFor({ batch: importFromRow(applied.rows[0], true), workOrders, event: normalizedEvent, duplicate: false });
  } catch (error) {
    if (inTransaction) await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}
