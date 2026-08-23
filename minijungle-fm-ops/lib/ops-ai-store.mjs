import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import { DatabaseSync } from "node:sqlite";
import { dirname } from "node:path";

export const aiVisionMigrationVersion = "2026-08-17.ai-visual-diagnosis-v1";
const statuses = new Set(["queued", "running", "completed", "failed"]);
function error(message, code = "AI_DIAGNOSIS_VALIDATION_ERROR", status = 400) { const result = new Error(message); result.code = code; result.status = status; return result; }
function required(value, field) { const text = String(value || "").trim(); if (!text) throw error(`${field} is required`); return text; }
function parseJson(value, fallback) { try { return JSON.parse(value || ""); } catch { return fallback; } }
function withDatabase(dbPath, callback) { return (async () => { await mkdir(dirname(dbPath), { recursive: true }); const db = new DatabaseSync(dbPath); try { initialize(db); return callback(db); } finally { db.close(); } })(); }
function initialize(db) {
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY, applied_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS ai_visual_diagnoses (
      id TEXT PRIMARY KEY, client_id TEXT NOT NULL, wall_id TEXT NOT NULL, module_id TEXT NOT NULL,
      capture_id TEXT NOT NULL, status TEXT NOT NULL, provider TEXT, model TEXT, confidence REAL,
      requested_by TEXT NOT NULL, request_json TEXT NOT NULL, result_json TEXT NOT NULL,
      error_code TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, completed_at TEXT,
      CHECK (status IN ('queued', 'running', 'completed', 'failed')),
      CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
      FOREIGN KEY (client_id) REFERENCES clients(id) ON UPDATE CASCADE ON DELETE RESTRICT,
      FOREIGN KEY (wall_id) REFERENCES living_assets(id) ON UPDATE CASCADE ON DELETE RESTRICT,
      FOREIGN KEY (module_id) REFERENCES asset_modules(id) ON UPDATE CASCADE ON DELETE RESTRICT,
      FOREIGN KEY (capture_id) REFERENCES device_camera_captures(id) ON UPDATE CASCADE ON DELETE RESTRICT
    );
    CREATE INDEX IF NOT EXISTS idx_ai_diagnoses_scope ON ai_visual_diagnoses(client_id, wall_id, module_id, status, created_at);
  `);
  db.prepare("INSERT OR IGNORE INTO schema_migrations (version, applied_at) VALUES (?, ?)").run(aiVisionMigrationVersion, new Date().toISOString());
}
function diagnosisFromRow(row) { return { id: row.id, clientId: row.client_id, wallId: row.wall_id, moduleId: row.module_id, captureId: row.capture_id, status: row.status, provider: row.provider || null, model: row.model || null, confidence: row.confidence, requestedBy: row.requested_by, request: parseJson(row.request_json, {}), result: parseJson(row.result_json, {}), errorCode: row.error_code || null, createdAt: row.created_at, updatedAt: row.updated_at, completedAt: row.completed_at || null }; }

export async function createSqliteVisualDiagnosis(dbPath, input) {
  const id = String(input?.id || `AIV-${Date.now()}-${randomUUID().slice(0, 8)}`).trim();
  const now = new Date().toISOString();
  return withDatabase(dbPath, (db) => {
    const existing = db.prepare("SELECT * FROM ai_visual_diagnoses WHERE id = ?").get(id);
    if (existing) return { duplicate: true, diagnosis: diagnosisFromRow(existing) };
    const record = { id, clientId: required(input?.clientId, "diagnosis.clientId"), wallId: required(input?.wallId, "diagnosis.wallId"), moduleId: required(input?.moduleId, "diagnosis.moduleId"), captureId: required(input?.captureId, "diagnosis.captureId"), status: "queued", provider: input?.provider ? String(input.provider).trim() : null, model: input?.model ? String(input.model).trim() : null, confidence: null, requestedBy: required(input?.requestedBy, "diagnosis.requestedBy"), request: input?.request && typeof input.request === "object" ? input.request : {}, result: {}, errorCode: null, createdAt: now, updatedAt: now, completedAt: null };
    db.prepare("INSERT INTO ai_visual_diagnoses (id, client_id, wall_id, module_id, capture_id, status, provider, model, confidence, requested_by, request_json, result_json, error_code, created_at, updated_at, completed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(record.id, record.clientId, record.wallId, record.moduleId, record.captureId, record.status, record.provider, record.model, record.confidence, record.requestedBy, JSON.stringify(record.request), JSON.stringify(record.result), record.errorCode, record.createdAt, record.updatedAt, record.completedAt);
    return { duplicate: false, diagnosis: record };
  });
}

export async function listSqliteVisualDiagnoses(dbPath, { clientIds = null, statuses: requestedStatuses = null, wallId = null, moduleId = null, limit = 100 } = {}) {
  return withDatabase(dbPath, (db) => {
    const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 500);
    const statusList = Array.isArray(requestedStatuses) && requestedStatuses.length ? requestedStatuses.filter((value) => statuses.has(value)) : Array.from(statuses);
    const placeholders = statusList.map(() => "?").join(", ");
    const rows = db.prepare(`SELECT * FROM ai_visual_diagnoses WHERE status IN (${placeholders}) AND (? IS NULL OR wall_id = ?) AND (? IS NULL OR module_id = ?) ORDER BY created_at DESC LIMIT ?`).all(...statusList, wallId, wallId, moduleId, moduleId, safeLimit);
    const allowed = clientIds ? new Set(clientIds) : null;
    return rows.map(diagnosisFromRow).filter((diagnosis) => !allowed || allowed.has(diagnosis.clientId));
  });
}

export async function updateSqliteVisualDiagnosis(dbPath, id, input) {
  const status = String(input?.status || "").trim().toLowerCase();
  if (!statuses.has(status)) throw error("diagnosis.status is invalid");
  const confidence = input?.confidence === null || input?.confidence === undefined || input?.confidence === "" ? null : Number(input.confidence);
  if (confidence !== null && (!Number.isFinite(confidence) || confidence < 0 || confidence > 1)) throw error("diagnosis.confidence must be between 0 and 1");
  return withDatabase(dbPath, (db) => {
    const existing = db.prepare("SELECT * FROM ai_visual_diagnoses WHERE id = ?").get(id);
    if (!existing) throw error("diagnosis not found", "AI_DIAGNOSIS_NOT_FOUND", 404);
    const now = new Date().toISOString();
    const completedAt = ["completed", "failed"].includes(status) ? now : null;
    db.prepare("UPDATE ai_visual_diagnoses SET status = ?, provider = ?, model = ?, confidence = ?, result_json = ?, error_code = ?, updated_at = ?, completed_at = ? WHERE id = ?").run(status, input?.provider ? String(input.provider).trim() : existing.provider, input?.model ? String(input.model).trim() : existing.model, confidence, JSON.stringify(input?.result && typeof input.result === "object" ? input.result : parseJson(existing.result_json, {})), input?.errorCode ? String(input.errorCode).trim() : null, now, completedAt, id);
    return diagnosisFromRow(db.prepare("SELECT * FROM ai_visual_diagnoses WHERE id = ?").get(id));
  });
}

export async function readSqliteAiVisionStorageHealth(dbPath) {
  return withDatabase(dbPath, (db) => {
    const count = db.prepare("SELECT COUNT(*) AS count FROM ai_visual_diagnoses").get().count;
    const status = db.prepare("SELECT status, COUNT(*) AS count FROM ai_visual_diagnoses GROUP BY status ORDER BY status ASC").all();
    return { backend: "sqlite", migrationVersion: aiVisionMigrationVersion, tables: ["ai_visual_diagnoses"], counts: { diagnoses: count }, status: Object.fromEntries(status.map((row) => [row.status, row.count])), relationshipIntegrity: { foreignKeysEnabled: db.prepare("PRAGMA foreign_keys").get().foreign_keys === 1, foreignKeyIssues: db.prepare("PRAGMA foreign_key_check").all().length } };
  });
}
