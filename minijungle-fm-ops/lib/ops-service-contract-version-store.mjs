import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";
import {
  contractChangeStatuses,
  contractChangeTypes,
  contractError,
  effectiveContractState,
  normalizeServiceContract,
  serviceContractVersionMigrationVersion
} from "./ops-service-contract-policy.mjs";

function parseJson(value, fallback) { try { return JSON.parse(value || ""); } catch { return fallback; } }
function now() { return new Date().toISOString(); }
function tableExists(db, name) { return Number(db.prepare("SELECT COUNT(*) AS count FROM sqlite_master WHERE type='table' AND name=?").get(name).count) === 1; }
function snapshotFromRow(row, wallIds = []) {
  return {
    clientId: row.client_id,
    contractNumber: row.contract_number,
    planName: row.plan_name,
    status: row.status,
    startDate: row.start_date,
    endDate: row.end_date,
    currency: row.currency,
    monthlyFee: Number(row.monthly_fee),
    visitsPerMonth: Number(row.visits_per_month),
    serviceWindowStart: row.service_window_start,
    serviceWindowEnd: row.service_window_end,
    evidenceRequired: Boolean(row.evidence_required),
    sla: parseJson(row.sla_json, {}),
    wallIds
  };
}
function versionFromRow(row) {
  return row ? {
    id: row.id,
    contractId: row.contract_id,
    versionNo: Number(row.version_no),
    versionKind: row.version_kind,
    status: row.status,
    terms: parseJson(row.terms_json, {}),
    note: row.note,
    createdBy: row.created_by,
    createdAt: row.created_at,
    approvedBy: row.approved_by || null,
    approvedAt: row.approved_at || null
  } : null;
}
function changeFromRow(row) {
  return row ? {
    id: row.id,
    contractId: row.contract_id,
    requestType: row.request_type,
    status: row.status,
    baseVersionNo: Number(row.base_version_no),
    baseUpdatedAt: row.base_updated_at,
    requestedTerms: parseJson(row.requested_terms_json, {}),
    note: row.note,
    requestedBy: row.requested_by,
    requestedAt: row.requested_at,
    reviewedBy: row.reviewed_by || null,
    reviewedAt: row.reviewed_at || null,
    reviewNote: row.review_note || null,
    resultingVersionId: row.resulting_version_id || null,
    updatedAt: row.updated_at
  } : null;
}
function initialize(db) {
  db.exec(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY, applied_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS ops_service_contract_versions (
      id TEXT PRIMARY KEY,
      contract_id TEXT NOT NULL REFERENCES ops_service_contracts(id) ON UPDATE CASCADE ON DELETE RESTRICT,
      version_no INTEGER NOT NULL CHECK (version_no > 0),
      version_kind TEXT NOT NULL CHECK (version_kind IN ('initial','amendment','renewal')),
      status TEXT NOT NULL CHECK (status IN ('draft','approved','retired')),
      terms_json TEXT NOT NULL,
      note TEXT NOT NULL,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL,
      approved_by TEXT,
      approved_at TEXT,
      UNIQUE(contract_id, version_no)
    );
    CREATE INDEX IF NOT EXISTS idx_service_contract_versions_contract ON ops_service_contract_versions(contract_id, version_no DESC);
    CREATE TABLE IF NOT EXISTS ops_service_contract_version_assets (
      version_id TEXT NOT NULL REFERENCES ops_service_contract_versions(id) ON UPDATE CASCADE ON DELETE RESTRICT,
      wall_id TEXT NOT NULL REFERENCES living_assets(id) ON UPDATE CASCADE ON DELETE RESTRICT,
      included_by TEXT NOT NULL,
      included_at TEXT NOT NULL,
      PRIMARY KEY(version_id, wall_id)
    );
    CREATE INDEX IF NOT EXISTS idx_service_contract_version_assets_wall ON ops_service_contract_version_assets(wall_id, version_id);
    CREATE TABLE IF NOT EXISTS ops_service_contract_change_requests (
      id TEXT PRIMARY KEY,
      contract_id TEXT NOT NULL REFERENCES ops_service_contracts(id) ON UPDATE CASCADE ON DELETE RESTRICT,
      request_type TEXT NOT NULL CHECK (request_type IN ('amendment','renewal')),
      status TEXT NOT NULL CHECK (status IN ('pending','approved','rejected')),
      base_version_no INTEGER NOT NULL CHECK (base_version_no > 0),
      base_updated_at TEXT NOT NULL,
      requested_terms_json TEXT NOT NULL,
      note TEXT NOT NULL,
      requested_by TEXT NOT NULL,
      requested_at TEXT NOT NULL,
      reviewed_by TEXT,
      reviewed_at TEXT,
      review_note TEXT,
      resulting_version_id TEXT REFERENCES ops_service_contract_versions(id) ON UPDATE CASCADE ON DELETE RESTRICT,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_service_contract_changes_contract ON ops_service_contract_change_requests(contract_id, status, requested_at DESC);
    CREATE TABLE IF NOT EXISTS ops_service_contract_sla_links (
      task_id TEXT PRIMARY KEY REFERENCES ops_remediation_tasks(id) ON UPDATE CASCADE ON DELETE RESTRICT,
      contract_id TEXT REFERENCES ops_service_contracts(id) ON UPDATE CASCADE ON DELETE RESTRICT,
      client_id TEXT NOT NULL REFERENCES clients(id) ON UPDATE CASCADE ON DELETE RESTRICT,
      wall_id TEXT NOT NULL REFERENCES living_assets(id) ON UPDATE CASCADE ON DELETE RESTRICT,
      coverage_state TEXT NOT NULL CHECK (coverage_state IN ('active','scheduled','expired','suspended','terminated','missing')),
      priority TEXT NOT NULL CHECK (priority IN ('critical','high','normal','low')),
      committed_due_at TEXT,
      response_hours REAL,
      resolution_hours REAL,
      linked_by TEXT NOT NULL,
      linked_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_service_contract_sla_links_scope ON ops_service_contract_sla_links(client_id, wall_id, linked_at DESC);
    CREATE INDEX IF NOT EXISTS idx_service_contract_sla_links_contract ON ops_service_contract_sla_links(contract_id, linked_at DESC);
  `);
  db.prepare("INSERT OR IGNORE INTO schema_migrations(version, applied_at) VALUES(?, ?)").run(serviceContractVersionMigrationVersion, now());
}
async function withDatabase(dbPath, callback) { await mkdir(dirname(dbPath), { recursive: true }); const db = new DatabaseSync(dbPath); try { initialize(db); return await callback(db); } finally { db.close(); } }
function wallIdsFor(db, contractId) { return db.prepare("SELECT wall_id FROM ops_service_contract_assets WHERE contract_id=? ORDER BY wall_id").all(contractId).map((row) => row.wall_id); }
function rawContract(db, contractId) { const row = db.prepare("SELECT * FROM ops_service_contracts WHERE id=?").get(contractId); return row ? { row, wallIds: wallIdsFor(db, contractId) } : null; }
function currentVersion(db, contractId) { return db.prepare("SELECT * FROM ops_service_contract_versions WHERE contract_id=? ORDER BY version_no DESC LIMIT 1").get(contractId); }
function insertVersion(db, { id, contractId, versionNo, versionKind, status, terms, note, createdBy, createdAt, approvedBy = null, approvedAt = null }) {
  db.prepare("INSERT INTO ops_service_contract_versions(id,contract_id,version_no,version_kind,status,terms_json,note,created_by,created_at,approved_by,approved_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)").run(id, contractId, versionNo, versionKind, status, JSON.stringify(terms), note, createdBy, createdAt, approvedBy, approvedAt);
  for (const wallId of terms.wallIds || []) db.prepare("INSERT INTO ops_service_contract_version_assets(version_id,wall_id,included_by,included_at) VALUES(?,?,?,?)").run(id, wallId, createdBy, createdAt);
}
function ensureInitialVersions(db) {
  const contracts = db.prepare("SELECT * FROM ops_service_contracts ORDER BY id").all();
  let created = 0;
  for (const row of contracts) {
    if (currentVersion(db, row.id)) continue;
    const createdAt = row.created_at || now();
    const versionId = `${row.id}:version:1`;
    insertVersion(db, { id: versionId, contractId: row.id, versionNo: 1, versionKind: "initial", status: row.status === "draft" ? "draft" : "approved", terms: snapshotFromRow(row, wallIdsFor(db, row.id)), note: row.note, createdBy: row.created_by, createdAt, approvedBy: row.status === "draft" ? null : row.created_by, approvedAt: row.status === "draft" ? null : createdAt });
    created += 1;
  }
  return created;
}
function normalizedTerms(raw, input) {
  const terms = normalizeServiceContract({ ...snapshotFromRow(raw.row, raw.wallIds), ...(input.terms || {}), id: raw.row.id, clientId: raw.row.client_id, contractNumber: raw.row.contract_number, createdBy: input.requestedBy || raw.row.created_by, note: input.note || raw.row.note });
  return { ...terms, status: "active", clientId: raw.row.client_id, contractNumber: raw.row.contract_number };
}
function assertWallScope(db, clientId, wallIds) {
  const valid = new Set(db.prepare("SELECT id FROM living_assets WHERE client_id=?").all(clientId).map((row) => row.id));
  if (wallIds.some((wallId) => !valid.has(wallId))) throw contractError("every changed covered wall must belong to the contract client", "SERVICE_CONTRACT_ASSET_SCOPE_MISMATCH", 409);
}
function assertNoOverlap(db, contractId, terms) {
  if (!terms.wallIds.length) throw contractError("changed terms must cover at least one living asset");
  const placeholders = terms.wallIds.map(() => "?").join(",");
  const conflict = db.prepare(`SELECT c.contract_number FROM ops_service_contracts c JOIN ops_service_contract_assets a ON a.contract_id=c.id WHERE c.id<>? AND c.status='active' AND c.start_date<=? AND c.end_date>=? AND a.wall_id IN (${placeholders}) LIMIT 1`).get(contractId, terms.endDate, terms.startDate, ...terms.wallIds);
  if (conflict) throw contractError(`coverage overlaps active contract ${conflict.contract_number}`, "SERVICE_CONTRACT_COVERAGE_CONFLICT", 409);
}

export async function ensureSqliteServiceContractVersionSchema(dbPath) { return withDatabase(dbPath, (db) => ({ created: ensureInitialVersions(db), migrationVersion: serviceContractVersionMigrationVersion })); }

export async function listSqliteServiceContractVersions(dbPath, contractId) { return withDatabase(dbPath, (db) => { ensureInitialVersions(db); return db.prepare("SELECT * FROM ops_service_contract_versions WHERE contract_id=? ORDER BY version_no DESC").all(contractId).map(versionFromRow); }); }

export async function listSqliteServiceContractChanges(dbPath, { clientIds = null, contractId = null, statuses = null, limit = 500 } = {}) {
  return withDatabase(dbPath, (db) => {
    ensureInitialVersions(db);
    const clauses = ["1=1"]; const params = [];
    if (clientIds && !clientIds.includes("*")) { clauses.push(`c.client_id IN (${clientIds.map(() => "?").join(",")})`); params.push(...clientIds); }
    if (contractId) { clauses.push("r.contract_id=?"); params.push(contractId); }
    if (statuses?.length) { clauses.push(`r.status IN (${statuses.map(() => "?").join(",")})`); params.push(...statuses); }
    params.push(Math.min(Math.max(Number(limit) || 100, 1), 1000));
    return db.prepare(`SELECT r.* FROM ops_service_contract_change_requests r JOIN ops_service_contracts c ON c.id=r.contract_id WHERE ${clauses.join(" AND ")} ORDER BY r.requested_at DESC,r.id DESC LIMIT ?`).all(...params).map(changeFromRow);
  });
}

export async function readSqliteServiceContractChange(dbPath, id) { return withDatabase(dbPath, (db) => { ensureInitialVersions(db); return changeFromRow(db.prepare("SELECT * FROM ops_service_contract_change_requests WHERE id=?").get(id)); }); }

export async function requestSqliteServiceContractChange(dbPath, input) {
  return withDatabase(dbPath, (db) => {
    db.exec("BEGIN IMMEDIATE");
    try {
      ensureInitialVersions(db);
      const id = String(input.id || `CHG-${randomUUID()}`).trim();
      const duplicate = db.prepare("SELECT * FROM ops_service_contract_change_requests WHERE id=?").get(id);
      if (duplicate) { db.exec("COMMIT"); return { duplicate: true, change: changeFromRow(duplicate) }; }
      const raw = rawContract(db, String(input.contractId || ""));
      if (!raw) throw contractError("service contract was not found", "SERVICE_CONTRACT_NOT_FOUND", 404);
      if (raw.row.status !== "active") throw contractError("only an active contract can receive a change request", "SERVICE_CONTRACT_CHANGE_STATE_INVALID", 409);
      const requestType = String(input.requestType || "").trim().toLowerCase();
      if (!contractChangeTypes.has(requestType)) throw contractError("requestType must be amendment or renewal");
      const requestedBy = String(input.requestedBy || "").trim();
      if (!requestedBy) throw contractError("requestedBy is required");
      const note = String(input.note || "").trim();
      if (!note) throw contractError("note is required");
      const terms = normalizedTerms(raw, input);
      assertWallScope(db, raw.row.client_id, terms.wallIds);
      const latest = currentVersion(db, raw.row.id);
      const requestedAt = now();
      db.prepare("INSERT INTO ops_service_contract_change_requests(id,contract_id,request_type,status,base_version_no,base_updated_at,requested_terms_json,note,requested_by,requested_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)").run(id, raw.row.id, requestType, "pending", Number(latest?.version_no || 1), raw.row.updated_at, JSON.stringify(terms), note, requestedBy, requestedAt, requestedAt);
      db.prepare("INSERT INTO ops_service_contract_events(id,contract_id,type,from_status,to_status,note,actor,occurred_at,payload_json) VALUES(?,?,?,?,?,?,?,?,?)").run(`${raw.row.id}:change:${id}:requested`, raw.row.id, "change.requested", raw.row.status, raw.row.status, note, requestedBy, requestedAt, JSON.stringify({ changeRequestId: id, requestType, baseVersionNo: Number(latest?.version_no || 1), wallIds: terms.wallIds }));
      db.exec("COMMIT");
      return { duplicate: false, change: changeFromRow(db.prepare("SELECT * FROM ops_service_contract_change_requests WHERE id=?").get(id)) };
    } catch (error) { db.exec("ROLLBACK"); throw error; }
  });
}

export async function reviewSqliteServiceContractChange(dbPath, id, input) {
  return withDatabase(dbPath, (db) => {
    db.exec("BEGIN IMMEDIATE");
    try {
      ensureInitialVersions(db);
      const existing = db.prepare("SELECT * FROM ops_service_contract_change_requests WHERE id=?").get(id);
      if (!existing) throw contractError("change request was not found", "SERVICE_CONTRACT_CHANGE_NOT_FOUND", 404);
      if (!contractChangeStatuses.has(existing.status) || existing.status !== "pending") throw contractError("only pending change requests can be reviewed", "SERVICE_CONTRACT_CHANGE_STATE_INVALID", 409);
      const decision = String(input.decision || "").trim().toLowerCase();
      if (!["approve", "reject"].includes(decision)) throw contractError("decision must be approve or reject");
      const reviewedBy = String(input.reviewedBy || "").trim();
      const reviewNote = String(input.reviewNote || "").trim();
      if (!reviewedBy || !reviewNote) throw contractError("reviewedBy and reviewNote are required");
      const raw = rawContract(db, existing.contract_id);
      if (!raw) throw contractError("service contract was not found", "SERVICE_CONTRACT_NOT_FOUND", 404);
      const expectedContractUpdatedAt = String(input.expectedContractUpdatedAt || existing.base_updated_at);
      if (raw.row.updated_at !== expectedContractUpdatedAt) throw contractError("service contract changed after this request was submitted", "SERVICE_CONTRACT_CHANGE_STALE", 409);
      const reviewedAt = now();
      if (decision === "reject") {
        db.prepare("UPDATE ops_service_contract_change_requests SET status='rejected',reviewed_by=?,reviewed_at=?,review_note=?,updated_at=? WHERE id=? AND status='pending'").run(reviewedBy, reviewedAt, reviewNote, reviewedAt, id);
        db.prepare("INSERT INTO ops_service_contract_events(id,contract_id,type,from_status,to_status,note,actor,occurred_at,payload_json) VALUES(?,?,?,?,?,?,?,?,?)").run(`${raw.row.id}:change:${id}:rejected`, raw.row.id, "change.rejected", raw.row.status, raw.row.status, reviewNote, reviewedBy, reviewedAt, JSON.stringify({ changeRequestId: id, requestType: existing.request_type, baseVersionNo: Number(existing.base_version_no) }));
        db.exec("COMMIT");
        return { change: changeFromRow(db.prepare("SELECT * FROM ops_service_contract_change_requests WHERE id=?").get(id)), contractId: raw.row.id };
      }
      const terms = parseJson(existing.requested_terms_json, {});
      assertWallScope(db, raw.row.client_id, terms.wallIds || []);
      assertNoOverlap(db, raw.row.id, terms);
      const latest = currentVersion(db, raw.row.id);
      const nextVersionNo = Number(latest?.version_no || 0) + 1;
      const versionId = `${raw.row.id}:version:${nextVersionNo}`;
      const termsJson = JSON.stringify({ ...terms, status: "active" });
      db.prepare("UPDATE ops_service_contracts SET plan_name=?,status='active',start_date=?,end_date=?,currency=?,monthly_fee=?,visits_per_month=?,service_window_start=?,service_window_end=?,evidence_required=?,sla_json=?,note=?,updated_at=? WHERE id=? AND updated_at=?").run(terms.planName, terms.startDate, terms.endDate, terms.currency, terms.monthlyFee, terms.visitsPerMonth, terms.serviceWindowStart, terms.serviceWindowEnd, terms.evidenceRequired ? 1 : 0, JSON.stringify(terms.sla), terms.note, reviewedAt, raw.row.id, expectedContractUpdatedAt);
      db.prepare("DELETE FROM ops_service_contract_assets WHERE contract_id=?").run(raw.row.id);
      for (const wallId of terms.wallIds) db.prepare("INSERT INTO ops_service_contract_assets(contract_id,wall_id,included_by,included_at) VALUES(?,?,?,?)").run(raw.row.id, wallId, reviewedBy, reviewedAt);
      db.prepare("UPDATE ops_service_contract_versions SET status='retired' WHERE contract_id=? AND status='approved'").run(raw.row.id);
      insertVersion(db, { id: versionId, contractId: raw.row.id, versionNo: nextVersionNo, versionKind: existing.request_type, status: "approved", terms: { ...terms, status: "active" }, note: reviewNote, createdBy: reviewedBy, createdAt: reviewedAt, approvedBy: reviewedBy, approvedAt: reviewedAt });
      db.prepare("UPDATE ops_service_contract_change_requests SET status='approved',reviewed_by=?,reviewed_at=?,review_note=?,resulting_version_id=?,updated_at=? WHERE id=? AND status='pending'").run(reviewedBy, reviewedAt, reviewNote, versionId, reviewedAt, id);
      db.prepare("INSERT INTO ops_service_contract_events(id,contract_id,type,from_status,to_status,note,actor,occurred_at,payload_json) VALUES(?,?,?,?,?,?,?,?,?)").run(`${raw.row.id}:change:${id}:approved`, raw.row.id, "change.approved", raw.row.status, "active", reviewNote, reviewedBy, reviewedAt, JSON.stringify({ changeRequestId: id, versionId, versionNo: nextVersionNo, requestType: existing.request_type, wallIds: terms.wallIds }));
      db.exec("COMMIT");
      const contractRow = db.prepare("SELECT * FROM ops_service_contracts WHERE id=?").get(raw.row.id);
      return { change: changeFromRow(db.prepare("SELECT * FROM ops_service_contract_change_requests WHERE id=?").get(id)), version: versionFromRow(db.prepare("SELECT * FROM ops_service_contract_versions WHERE id=?").get(versionId)), contract: { ...snapshotFromRow(contractRow, wallIdsFor(db, raw.row.id)), id: contractRow.id, status: contractRow.status, createdAt: contractRow.created_at, updatedAt: contractRow.updated_at, effectiveState: effectiveContractState({ ...snapshotFromRow(contractRow, wallIdsFor(db, raw.row.id)), status: contractRow.status }) } };
    } catch (error) { db.exec("ROLLBACK"); throw error; }
  });
}

export async function syncSqliteServiceContractVersion(dbPath, contractId) { return withDatabase(dbPath, (db) => { ensureInitialVersions(db); const raw = rawContract(db, contractId); if (!raw) return null; const latest = currentVersion(db, contractId); if (latest && raw.row.status !== "draft" && latest.status === "draft") db.prepare("UPDATE ops_service_contract_versions SET status='approved',approved_by=?,approved_at=? WHERE id=?").run(raw.row.created_by, raw.row.updated_at, latest.id); return latest ? versionFromRow(db.prepare("SELECT * FROM ops_service_contract_versions WHERE id=?").get(latest.id)) : null; }); }

export async function linkSqliteServiceContractSla(dbPath, input) { return withDatabase(dbPath, (db) => { const taskId = String(input.taskId || "").trim(); if (!taskId) throw contractError("taskId is required"); const existing = db.prepare("SELECT * FROM ops_service_contract_sla_links WHERE task_id=?").get(taskId); if (existing) return { duplicate: true, link: existing }; if (!tableExists(db, "ops_remediation_tasks")) throw contractError("remediation task storage is not initialized", "REMEDIATION_STORAGE_NOT_READY", 503); const clientId = String(input.clientId || "").trim(); const wallId = String(input.wallId || "").trim(); if (!clientId || !wallId) throw contractError("clientId and wallId are required"); const coverageState = String(input.coverageState || "missing"); if (!["active", "scheduled", "expired", "suspended", "terminated", "missing"].includes(coverageState)) throw contractError("invalid contract coverage state"); db.prepare("INSERT INTO ops_service_contract_sla_links(task_id,contract_id,client_id,wall_id,coverage_state,priority,committed_due_at,response_hours,resolution_hours,linked_by,linked_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)").run(taskId, input.contractId || null, clientId, wallId, coverageState, input.priority || "normal", input.committedDueAt || null, input.responseHours ?? null, input.resolutionHours ?? null, String(input.linkedBy || "system"), input.linkedAt || now()); return { duplicate: false, link: db.prepare("SELECT * FROM ops_service_contract_sla_links WHERE task_id=?").get(taskId) }; }); }

function performanceRows(db, { clientIds = null, from, through }) {
  if (!tableExists(db, "ops_remediation_tasks")) return [];
  const clauses = ["t.created_at>=?", "t.created_at<=?"]; const params = [from, through];
  if (clientIds && !clientIds.includes("*")) { clauses.push(`l.client_id IN (${clientIds.map(() => "?").join(",")})`); params.push(...clientIds); }
  return db.prepare(`SELECT l.*,t.status,t.review_status,t.resolved_at,t.due_at,t.created_at,t.updated_at,c.contract_number,c.plan_name FROM ops_service_contract_sla_links l JOIN ops_remediation_tasks t ON t.id=l.task_id LEFT JOIN ops_service_contracts c ON c.id=l.contract_id WHERE ${clauses.join(" AND ")} ORDER BY t.created_at DESC,t.id DESC`).all(...params);
}
function summarizePerformance(rows, asOf) {
  const summary = { totalTasks: rows.length, coveredTasks: rows.filter((row) => row.contract_id && row.coverage_state === "active").length, completedTasks: 0, onTimeTasks: 0, lateTasks: 0, openOverdueTasks: 0, reviewedTasks: 0, attainmentRate: null };
  const byContract = new Map(); const byPriority = new Map();
  for (const row of rows) {
    const resolved = row.status === "resolved" && row.resolved_at;
    const onTime = resolved && (!row.committed_due_at || row.resolved_at <= row.committed_due_at);
    const late = resolved && !onTime;
    const overdue = !resolved && !["cancelled"].includes(row.status) && row.committed_due_at && row.committed_due_at <= asOf;
    if (resolved) summary.completedTasks += 1;
    if (onTime) summary.onTimeTasks += 1;
    if (late) summary.lateTasks += 1;
    if (overdue) summary.openOverdueTasks += 1;
    if (row.review_status === "approved") summary.reviewedTasks += 1;
    const key = row.contract_id || "uncovered";
    const bucket = byContract.get(key) || { contractId: row.contract_id || null, contractNumber: row.contract_number || null, planName: row.plan_name || null, totalTasks: 0, completedTasks: 0, onTimeTasks: 0, lateTasks: 0, openOverdueTasks: 0 };
    bucket.totalTasks += 1; if (resolved) bucket.completedTasks += 1; if (onTime) bucket.onTimeTasks += 1; if (late) bucket.lateTasks += 1; if (overdue) bucket.openOverdueTasks += 1; byContract.set(key, bucket);
    const priority = row.priority || "normal"; const priorityBucket = byPriority.get(priority) || { priority, totalTasks: 0, completedTasks: 0, onTimeTasks: 0, lateTasks: 0 }; priorityBucket.totalTasks += 1; if (resolved) priorityBucket.completedTasks += 1; if (onTime) priorityBucket.onTimeTasks += 1; if (late) priorityBucket.lateTasks += 1; byPriority.set(priority, priorityBucket);
  }
  summary.attainmentRate = summary.completedTasks ? Number((summary.onTimeTasks / summary.completedTasks).toFixed(4)) : null;
  return { summary, byContract: [...byContract.values()].map((item) => ({ ...item, attainmentRate: item.completedTasks ? Number((item.onTimeTasks / item.completedTasks).toFixed(4)) : null })), byPriority: [...byPriority.values()].map((item) => ({ ...item, attainmentRate: item.completedTasks ? Number((item.onTimeTasks / item.completedTasks).toFixed(4)) : null })) };
}

export async function readSqliteServiceContractPerformance(dbPath, { clientIds = null, from = new Date(Date.now() - 30 * 86400000).toISOString(), through = new Date().toISOString(), asOf = new Date().toISOString() } = {}) {
  return withDatabase(dbPath, (db) => { const rows = performanceRows(db, { clientIds, from, through }); const result = summarizePerformance(rows, asOf); const unlinkedTasks = tableExists(db, "ops_remediation_tasks") ? Number(db.prepare(`SELECT COUNT(*) AS count FROM ops_remediation_tasks t LEFT JOIN ops_service_contract_sla_links l ON l.task_id=t.id WHERE l.task_id IS NULL AND t.created_at>=? AND t.created_at<=?${clientIds && !clientIds.includes("*") ? ` AND t.client_id IN (${clientIds.map(() => "?").join(",")})` : ""}`).get(...[from, through, ...(clientIds && !clientIds.includes("*") ? clientIds : [])]).count) : 0; return { generatedAt: now(), period: { from, through, asOf }, ...result, unlinkedTasks }; });
}

export async function readSqliteServiceContractVersionHealth(dbPath) { return withDatabase(dbPath, (db) => { ensureInitialVersions(db); const count = (table) => Number(db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get().count); const names = ["ops_service_contract_versions", "ops_service_contract_version_assets", "ops_service_contract_change_requests", "ops_service_contract_sla_links"]; return { backend: "sqlite", migrationVersion: serviceContractVersionMigrationVersion, tables: names, counts: { versions: count(names[0]), versionAssets: count(names[1]), changeRequests: count(names[2]), slaLinks: count(names[3]) }, relationshipIntegrity: { foreignKeyIssues: db.prepare("PRAGMA foreign_key_check").all().filter((row) => String(row.table).startsWith("ops_service_contract")).length } }; }); }
