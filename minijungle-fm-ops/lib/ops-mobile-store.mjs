import { mkdir } from "node:fs/promises";
import { DatabaseSync } from "node:sqlite";
import { dirname } from "node:path";

export const mobileCaptureMigrationVersion = "2026-07-15.mobile-capture-v1";

const allowedItemTypes = new Set(["photo", "water", "nutrient", "health-check", "exception"]);

function parseJson(value, fallback) {
  try {
    return JSON.parse(value || "");
  } catch {
    return fallback;
  }
}

function validationError(message) {
  const error = new Error(message);
  error.status = 400;
  error.code = "MOBILE_CAPTURE_VALIDATION_ERROR";
  return error;
}

function requireString(value, field) {
  const text = String(value || "").trim();
  if (!text) throw validationError(`${field} is required`);
  return text;
}

async function withDatabase(dbPath, callback) {
  await mkdir(dirname(dbPath), { recursive: true });
  const db = new DatabaseSync(dbPath);
  try {
    initializeMobileCaptureDatabase(db);
    return callback(db);
  } finally {
    db.close();
  }
}

function initializeMobileCaptureDatabase(db) {
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS mobile_capture_batches (
      id TEXT PRIMARY KEY,
      technician_id TEXT NOT NULL,
      client_id TEXT NOT NULL,
      wall_id TEXT NOT NULL,
      workorder_id TEXT NOT NULL,
      device_id TEXT,
      captured_at TEXT NOT NULL,
      received_at TEXT NOT NULL,
      sync_status TEXT NOT NULL,
      notes TEXT,
      payload_json TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_mobile_batches_client
      ON mobile_capture_batches(client_id);

    CREATE INDEX IF NOT EXISTS idx_mobile_batches_workorder
      ON mobile_capture_batches(workorder_id);

    CREATE INDEX IF NOT EXISTS idx_mobile_batches_wall
      ON mobile_capture_batches(wall_id);

    CREATE INDEX IF NOT EXISTS idx_mobile_batches_technician
      ON mobile_capture_batches(technician_id);

    CREATE TABLE IF NOT EXISTS mobile_capture_items (
      id TEXT PRIMARY KEY,
      batch_id TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('photo', 'water', 'nutrient', 'health-check', 'exception')),
      label TEXT,
      value TEXT,
      unit TEXT,
      metadata_json TEXT NOT NULL,
      FOREIGN KEY (batch_id) REFERENCES mobile_capture_batches(id) ON UPDATE CASCADE ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_mobile_items_batch
      ON mobile_capture_items(batch_id);

    CREATE INDEX IF NOT EXISTS idx_mobile_items_type
      ON mobile_capture_items(type);
  `);

  db.prepare(`
    INSERT OR IGNORE INTO schema_migrations (version, applied_at)
    VALUES (?, ?)
  `).run(mobileCaptureMigrationVersion, new Date().toISOString());
}

function normalizeItem(item, index, batchId) {
  const type = requireString(item?.type, `items[${index}].type`);
  if (!allowedItemTypes.has(type)) {
    throw validationError(`items[${index}].type must be one of ${Array.from(allowedItemTypes).join(", ")}`);
  }

  return {
    id: String(item.id || `${batchId}-ITEM-${index + 1}`).trim(),
    type,
    label: item.label ? String(item.label).trim() : null,
    value: item.value === undefined || item.value === null ? null : String(item.value),
    unit: item.unit ? String(item.unit).trim() : null,
    metadata: item.metadata && typeof item.metadata === "object" ? item.metadata : {}
  };
}

function normalizeBatch(input) {
  const batch = {
    id: requireString(input?.id, "batch.id"),
    technicianId: requireString(input?.technicianId, "batch.technicianId"),
    clientId: requireString(input?.clientId, "batch.clientId"),
    wallId: requireString(input?.wallId, "batch.wallId"),
    workorderId: requireString(input?.workorderId, "batch.workorderId"),
    deviceId: input?.deviceId ? String(input.deviceId).trim() : null,
    capturedAt: requireString(input?.capturedAt, "batch.capturedAt"),
    receivedAt: new Date().toISOString(),
    syncStatus: "synced",
    notes: input?.notes ? String(input.notes).trim() : "",
    items: []
  };

  if (!Array.isArray(input?.items) || input.items.length === 0) {
    throw validationError("batch.items must include at least one capture item");
  }

  batch.items = input.items.map((item, index) => normalizeItem(item, index, batch.id));
  return batch;
}

function itemFromRow(row) {
  return {
    id: row.id,
    batchId: row.batch_id,
    type: row.type,
    label: row.label || null,
    value: row.value || null,
    unit: row.unit || null,
    metadata: parseJson(row.metadata_json, {})
  };
}

function batchFromRow(row, items = []) {
  return {
    ...parseJson(row.payload_json, {}),
    id: row.id,
    technicianId: row.technician_id,
    clientId: row.client_id,
    wallId: row.wall_id,
    workorderId: row.workorder_id,
    deviceId: row.device_id || null,
    capturedAt: row.captured_at,
    receivedAt: row.received_at,
    syncStatus: row.sync_status,
    notes: row.notes || "",
    items
  };
}

function readBatchById(db, batchId) {
  const row = db.prepare(`
    SELECT *
    FROM mobile_capture_batches
    WHERE id = ?
  `).get(batchId);

  if (!row) return null;

  const items = db.prepare(`
    SELECT *
    FROM mobile_capture_items
    WHERE batch_id = ?
    ORDER BY id ASC
  `).all(batchId).map(itemFromRow);

  return batchFromRow(row, items);
}

export async function saveSqliteMobileCaptureBatch(dbPath, input) {
  return withDatabase(dbPath, (db) => {
    const batch = normalizeBatch(input);
    const existing = readBatchById(db, batch.id);
    if (existing) {
      return {
        duplicate: true,
        batch: existing
      };
    }

    db.exec("BEGIN IMMEDIATE");
    try {
      db.prepare(`
        INSERT INTO mobile_capture_batches (
          id,
          technician_id,
          client_id,
          wall_id,
          workorder_id,
          device_id,
          captured_at,
          received_at,
          sync_status,
          notes,
          payload_json
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        batch.id,
        batch.technicianId,
        batch.clientId,
        batch.wallId,
        batch.workorderId,
        batch.deviceId,
        batch.capturedAt,
        batch.receivedAt,
        batch.syncStatus,
        batch.notes,
        JSON.stringify(batch)
      );

      const insertItem = db.prepare(`
        INSERT INTO mobile_capture_items (
          id,
          batch_id,
          type,
          label,
          value,
          unit,
          metadata_json
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      for (const item of batch.items) {
        insertItem.run(
          item.id,
          batch.id,
          item.type,
          item.label,
          item.value,
          item.unit,
          JSON.stringify(item.metadata)
        );
      }

      db.exec("COMMIT");
      return {
        duplicate: false,
        batch: readBatchById(db, batch.id)
      };
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  });
}

export async function listSqliteMobileCaptureBatches(dbPath) {
  return withDatabase(dbPath, (db) => {
    const batches = db.prepare(`
      SELECT *
      FROM mobile_capture_batches
      ORDER BY captured_at DESC, id ASC
    `).all();

    const items = db.prepare(`
      SELECT *
      FROM mobile_capture_items
      ORDER BY batch_id ASC, id ASC
    `).all().map(itemFromRow);
    const itemsByBatch = new Map();

    for (const item of items) {
      itemsByBatch.set(item.batchId, [...(itemsByBatch.get(item.batchId) || []), item]);
    }

    return batches.map((batch) => batchFromRow(batch, itemsByBatch.get(batch.id) || []));
  });
}

export async function readSqliteMobileCaptureStorageHealth(dbPath) {
  return withDatabase(dbPath, (db) => {
    const tableRows = db.prepare(`
      SELECT name
      FROM sqlite_master
      WHERE type = 'table'
        AND name IN ('mobile_capture_batches', 'mobile_capture_items')
      ORDER BY name ASC
    `).all();
    const latestBatch = db.prepare(`
      SELECT id, captured_at
      FROM mobile_capture_batches
      ORDER BY captured_at DESC, id ASC
      LIMIT 1
    `).get();
    const foreignKeyIssues = db.prepare("PRAGMA foreign_key_check").all();

    return {
      backend: "sqlite",
      migrationVersion: mobileCaptureMigrationVersion,
      source: "technician-mobile-offline-sync",
      tables: tableRows.map((row) => row.name),
      counts: {
        captureBatches: db.prepare("SELECT COUNT(*) AS count FROM mobile_capture_batches").get().count,
        captureItems: db.prepare("SELECT COUNT(*) AS count FROM mobile_capture_items").get().count
      },
      latestBatch: latestBatch
        ? {
            id: latestBatch.id,
            capturedAt: latestBatch.captured_at
          }
        : null,
      relationshipIntegrity: {
        foreignKeysEnabled: db.prepare("PRAGMA foreign_keys").get().foreign_keys === 1,
        foreignKeyIssues: foreignKeyIssues.length
      }
    };
  });
}
