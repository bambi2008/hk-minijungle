import { mkdir } from "node:fs/promises";
import { DatabaseSync } from "node:sqlite";
import { dirname } from "node:path";
import {
  buildOpsStateSnapshot,
  defaultOpsState,
  reduceOpsStateAction,
  sanitizeSnapshot
} from "./ops-state-store.mjs";

const migrationVersion = "2026-07-14.sqlite-runtime-v1";

function parseJson(value, fallback) {
  try {
    return JSON.parse(value || "");
  } catch {
    return fallback;
  }
}

function eventFromRow(row) {
  return {
    id: row.id,
    timestamp: row.timestamp,
    type: row.type,
    actor: row.actor,
    entityType: row.entity_type,
    entityId: row.entity_id,
    clientId: row.client_id || null,
    wallId: row.wall_id || null,
    source: row.source,
    note: row.note || "",
    payload: parseJson(row.payload_json, {})
  };
}

function snapshotFromRow(row) {
  if (!row) return defaultOpsState();
  return sanitizeSnapshot({
    version: row.version,
    revision: row.revision,
    updatedAt: row.updated_at,
    lastEventId: row.last_event_id,
    state: parseJson(row.state_json, defaultOpsState().state)
  });
}

async function withDatabase(dbPath, callback) {
  await mkdir(dirname(dbPath), { recursive: true });
  const db = new DatabaseSync(dbPath);
  try {
    initializeOpsDatabase(db);
    return callback(db);
  } finally {
    db.close();
  }
}

function initializeOpsDatabase(db) {
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ops_events (
      id TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL,
      type TEXT NOT NULL,
      actor TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      client_id TEXT,
      wall_id TEXT,
      source TEXT NOT NULL,
      note TEXT,
      payload_json TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_ops_events_entity
      ON ops_events(entity_type, entity_id);

    CREATE INDEX IF NOT EXISTS idx_ops_events_client
      ON ops_events(client_id);

    CREATE TABLE IF NOT EXISTS ops_state_snapshots (
      revision INTEGER PRIMARY KEY,
      version TEXT NOT NULL,
      updated_at TEXT,
      last_event_id TEXT,
      state_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ops_actions (
      id TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL,
      type TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      client_id TEXT,
      wall_id TEXT,
      revision INTEGER NOT NULL,
      event_id TEXT,
      audit_event_id TEXT,
      value_json TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_ops_actions_revision
      ON ops_actions(revision);
  `);

  db.prepare(`
    INSERT OR IGNORE INTO schema_migrations (version, applied_at)
    VALUES (?, ?)
  `).run(migrationVersion, new Date().toISOString());
}

function insertSnapshot(db, snapshot) {
  const sanitized = sanitizeSnapshot(snapshot);
  db.prepare(`
    INSERT INTO ops_state_snapshots (revision, version, updated_at, last_event_id, state_json)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    sanitized.revision,
    sanitized.version,
    sanitized.updatedAt,
    sanitized.lastEventId,
    JSON.stringify(sanitized.state)
  );
  return sanitized;
}

function insertAction(db, action, event, revision) {
  if (!action?.type) return;
  const id = `${event?.id || "ACT"}-${action.type}-${action.entityId}`;
  db.prepare(`
    INSERT OR REPLACE INTO ops_actions (
      id,
      timestamp,
      type,
      entity_type,
      entity_id,
      client_id,
      wall_id,
      revision,
      event_id,
      audit_event_id,
      value_json
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    event?.timestamp || new Date().toISOString(),
    action.type,
    action.entityType,
    action.entityId,
    action.clientId || null,
    event?.wallId || null,
    revision,
    event?.id || null,
    action.auditEvent?.id || null,
    JSON.stringify(action.value || {})
  );
}

function latestSnapshot(db) {
  return snapshotFromRow(db.prepare(`
    SELECT revision, version, updated_at, last_event_id, state_json
    FROM ops_state_snapshots
    ORDER BY revision DESC
    LIMIT 1
  `).get());
}

export async function readSqliteOpsEvents(dbPath) {
  return withDatabase(dbPath, (db) => db.prepare(`
    SELECT id, timestamp, type, actor, entity_type, entity_id, client_id, wall_id, source, note, payload_json
    FROM ops_events
    ORDER BY timestamp ASC, id ASC
  `).all().map(eventFromRow));
}

export async function appendSqliteOpsEvent(dbPath, event) {
  return withDatabase(dbPath, (db) => {
    db.prepare(`
      INSERT INTO ops_events (
        id,
        timestamp,
        type,
        actor,
        entity_type,
        entity_id,
        client_id,
        wall_id,
        source,
        note,
        payload_json
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      event.note || "",
      JSON.stringify(event.payload || {})
    );
    return event;
  });
}

export async function readSqliteOpsState(dbPath) {
  return withDatabase(dbPath, latestSnapshot);
}

export async function saveSqliteOpsStateSnapshot(dbPath, input, event = null) {
  return withDatabase(dbPath, (db) => {
    db.exec("BEGIN IMMEDIATE");
    try {
      const snapshot = insertSnapshot(db, buildOpsStateSnapshot(latestSnapshot(db), input, event));
      db.exec("COMMIT");
      return snapshot;
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  });
}

export async function applySqliteOpsStateAction(dbPath, input, event = null) {
  return withDatabase(dbPath, (db) => {
    db.exec("BEGIN IMMEDIATE");
    try {
      const actionPayload = input.action && typeof input.action === "object" ? input.action : input;
      const result = reduceOpsStateAction(latestSnapshot(db), input, event);
      insertSnapshot(db, result.snapshot);
      insertAction(db, actionPayload, event, result.snapshot.revision);
      db.exec("COMMIT");
      return result;
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  });
}

export async function readSqliteOpsStorageHealth(dbPath) {
  return withDatabase(dbPath, (db) => {
    const tableRows = db.prepare(`
      SELECT name
      FROM sqlite_master
      WHERE type = 'table'
      ORDER BY name ASC
    `).all();
    const eventCount = db.prepare("SELECT COUNT(*) AS count FROM ops_events").get().count;
    const actionCount = db.prepare("SELECT COUNT(*) AS count FROM ops_actions").get().count;
    const snapshotCount = db.prepare("SELECT COUNT(*) AS count FROM ops_state_snapshots").get().count;
    const latest = latestSnapshot(db);
    const migrations = db.prepare(`
      SELECT version, applied_at
      FROM schema_migrations
      ORDER BY applied_at ASC
    `).all();

    return {
      backend: "sqlite",
      migrationVersion,
      tables: tableRows.map((row) => row.name),
      counts: {
        opsEvents: eventCount,
        opsActions: actionCount,
        opsStateSnapshots: snapshotCount
      },
      latestStateRevision: latest.revision,
      migrations
    };
  });
}
