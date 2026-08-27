import { mkdir } from "node:fs/promises";
import { DatabaseSync } from "node:sqlite";
import { dirname } from "node:path";
import { evaluateTechnicianCandidate, normalizeAssignmentInput, normalizeTechnicianInput, workforceError, workforceMigrationVersion } from "./ops-workforce-policy.mjs";

function parseJson(value, fallback) { try { return JSON.parse(value || ""); } catch { return fallback; } }
function technicianFromRow(row) { return row ? { id: row.id, displayName: row.display_name, status: row.status, skills: parseJson(row.skills_json, []), districts: parseJson(row.districts_json, []), shiftStart: row.shift_start, shiftEnd: row.shift_end, maxDailyMinutes: Number(row.max_daily_minutes), createdBy: row.created_by, updatedBy: row.updated_by, createdAt: row.created_at, updatedAt: row.updated_at } : null; }
function assignmentFromRow(row) { return row ? { targetType: row.target_type, targetId: row.target_id, technicianId: row.technician_id, clientId: row.client_id, wallId: row.wall_id, serviceDate: row.service_date, scheduledStart: row.scheduled_start || null, estimatedMinutes: Number(row.estimated_minutes), requiredSkills: parseJson(row.required_skills_json, []), district: row.district, status: row.status, assignedBy: row.assigned_by, createdAt: row.created_at, updatedAt: row.updated_at } : null; }

function initialize(db) {
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
    CREATE TABLE IF NOT EXISTS schema_migrations(version TEXT PRIMARY KEY,applied_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS ops_technicians(id TEXT PRIMARY KEY,display_name TEXT NOT NULL,status TEXT NOT NULL CHECK(status IN ('active','inactive')),skills_json TEXT NOT NULL,districts_json TEXT NOT NULL,shift_start TEXT NOT NULL,shift_end TEXT NOT NULL,max_daily_minutes INTEGER NOT NULL CHECK(max_daily_minutes BETWEEN 60 AND 960),created_by TEXT NOT NULL,updated_by TEXT NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS ops_workforce_assignments(target_type TEXT NOT NULL,target_id TEXT NOT NULL,technician_id TEXT NOT NULL,client_id TEXT NOT NULL,wall_id TEXT NOT NULL,service_date TEXT NOT NULL,scheduled_start TEXT,estimated_minutes INTEGER NOT NULL CHECK(estimated_minutes BETWEEN 15 AND 480),required_skills_json TEXT NOT NULL,district TEXT NOT NULL,status TEXT NOT NULL CHECK(status IN ('planned','accepted','in_progress','completed','cancelled')),assigned_by TEXT NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL,PRIMARY KEY(target_type,target_id),FOREIGN KEY(technician_id) REFERENCES ops_technicians(id) ON UPDATE CASCADE ON DELETE RESTRICT);
    CREATE INDEX IF NOT EXISTS idx_workforce_technician_date ON ops_workforce_assignments(technician_id,service_date,status);
    CREATE INDEX IF NOT EXISTS idx_workforce_client_date ON ops_workforce_assignments(client_id,service_date,status);
    CREATE INDEX IF NOT EXISTS idx_workforce_schedule ON ops_workforce_assignments(technician_id,scheduled_start);
  `);
  const now = new Date().toISOString();
  db.prepare("INSERT OR IGNORE INTO schema_migrations(version,applied_at) VALUES(?,?)").run(workforceMigrationVersion, now);
  db.prepare("INSERT OR IGNORE INTO ops_technicians(id,display_name,status,skills_json,districts_json,shift_start,shift_end,max_daily_minutes,created_by,updated_by,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)").run("field-tech-show-suite", "Show Suite Field Technician (Demo)", "active", JSON.stringify(["*"]), JSON.stringify(["*"]), "08:00", "18:00", 480, "system:demo-seed", "system:demo-seed", now, now);
  db.prepare("INSERT OR IGNORE INTO ops_workforce_assignments(target_type,target_id,technician_id,client_id,wall_id,service_date,scheduled_start,estimated_minutes,required_skills_json,district,status,assigned_by,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)").run("work-order", "WO-1047", "field-tech-show-suite", "show-suite", "MJ-HK-021", now.slice(0, 10), null, 90, JSON.stringify(["plant-care"]), "Tsim Sha Tsui", "planned", "system:demo-seed", now, now);
}

async function withDatabase(dbPath, callback) { await mkdir(dirname(dbPath), { recursive: true }); const db = new DatabaseSync(dbPath); try { initialize(db); return await callback(db); } finally { db.close(); } }

export async function upsertSqliteTechnician(dbPath, input) {
  return withDatabase(dbPath, (db) => {
    const existing = technicianFromRow(db.prepare("SELECT * FROM ops_technicians WHERE id=?").get(String(input?.id || "")));
    const item = normalizeTechnicianInput(input, existing);
    db.prepare("INSERT INTO ops_technicians(id,display_name,status,skills_json,districts_json,shift_start,shift_end,max_daily_minutes,created_by,updated_by,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET display_name=excluded.display_name,status=excluded.status,skills_json=excluded.skills_json,districts_json=excluded.districts_json,shift_start=excluded.shift_start,shift_end=excluded.shift_end,max_daily_minutes=excluded.max_daily_minutes,updated_by=excluded.updated_by,updated_at=excluded.updated_at").run(item.id,item.displayName,item.status,JSON.stringify(item.skills),JSON.stringify(item.districts),item.shiftStart,item.shiftEnd,item.maxDailyMinutes,item.createdBy,item.updatedBy,item.createdAt,item.updatedAt);
    return { created: !existing, technician: technicianFromRow(db.prepare("SELECT * FROM ops_technicians WHERE id=?").get(item.id)) };
  });
}

export async function readSqliteTechnician(dbPath, id) { return withDatabase(dbPath, (db) => technicianFromRow(db.prepare("SELECT * FROM ops_technicians WHERE id=?").get(String(id)))); }
export async function listSqliteTechnicians(dbPath, { status = null } = {}) { return withDatabase(dbPath, (db) => (status ? db.prepare("SELECT * FROM ops_technicians WHERE status=? ORDER BY display_name,id").all(status) : db.prepare("SELECT * FROM ops_technicians ORDER BY status,display_name,id").all()).map(technicianFromRow)); }
export async function readSqliteWorkforceAssignment(dbPath, targetType, targetId) { return withDatabase(dbPath, (db) => assignmentFromRow(db.prepare("SELECT * FROM ops_workforce_assignments WHERE target_type=? AND target_id=?").get(String(targetType),String(targetId)))); }
export async function listSqliteWorkforceAssignments(dbPath, { technicianId = null, serviceDate = null, targetType = null, statuses = null, clientIds = null, limit = 500 } = {}) {
  return withDatabase(dbPath, (db) => {
    const clauses=["1=1"],params=[]; if(technicianId){clauses.push("technician_id=?");params.push(String(technicianId));} if(serviceDate){clauses.push("service_date=?");params.push(String(serviceDate));} if(targetType){clauses.push("target_type=?");params.push(String(targetType));} if(Array.isArray(statuses)&&statuses.length){clauses.push(`status IN (${statuses.map(()=>"?").join(",")})`);params.push(...statuses);} if(clientIds&&!clientIds.includes("*")){clauses.push(`client_id IN (${clientIds.map(()=>"?").join(",")})`);params.push(...clientIds);} params.push(Math.min(Math.max(Number(limit)||500,1),1000));
    return db.prepare(`SELECT * FROM ops_workforce_assignments WHERE ${clauses.join(" AND ")} ORDER BY service_date,scheduled_start,target_id LIMIT ?`).all(...params).map(assignmentFromRow);
  });
}

export async function evaluateSqliteWorkforceCandidates(dbPath, input) {
  return withDatabase(dbPath, (db) => {
    const context = normalizeAssignmentInput({ ...input, technicianId: input?.technicianId || "candidate", assignedBy: input?.assignedBy || "candidate" });
    const technicians = db.prepare("SELECT * FROM ops_technicians ORDER BY status,display_name,id").all().map(technicianFromRow);
    const assignments = db.prepare("SELECT * FROM ops_workforce_assignments WHERE service_date=?").all(context.serviceDate).map(assignmentFromRow);
    return technicians.map((technician) => evaluateTechnicianCandidate(technician, assignments.filter((item) => item.technicianId === technician.id), context));
  });
}

export async function upsertSqliteWorkforceAssignment(dbPath, input) {
  return withDatabase(dbPath, (db) => {
    db.exec("BEGIN IMMEDIATE");
    try {
      const existing = assignmentFromRow(db.prepare("SELECT * FROM ops_workforce_assignments WHERE target_type=? AND target_id=?").get(String(input?.targetType || ""),String(input?.targetId || "")));
      const item = normalizeAssignmentInput(input, existing);
      const technician = technicianFromRow(db.prepare("SELECT * FROM ops_technicians WHERE id=?").get(item.technicianId));
      if (!technician) throw workforceError("technician is not registered", "WORKFORCE_TECHNICIAN_NOT_FOUND", 404);
      if (!["completed","cancelled"].includes(item.status)) {
        const assignments = db.prepare("SELECT * FROM ops_workforce_assignments WHERE technician_id=? AND service_date=?").all(item.technicianId,item.serviceDate).map(assignmentFromRow);
        const evaluation = evaluateTechnicianCandidate(technician, assignments, item);
        if (!evaluation.eligible) throw workforceError(`assignment rejected: ${evaluation.reasons.join("; ")}`, "WORKFORCE_ASSIGNMENT_INELIGIBLE", 409);
      }
      db.prepare("INSERT INTO ops_workforce_assignments(target_type,target_id,technician_id,client_id,wall_id,service_date,scheduled_start,estimated_minutes,required_skills_json,district,status,assigned_by,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(target_type,target_id) DO UPDATE SET technician_id=excluded.technician_id,client_id=excluded.client_id,wall_id=excluded.wall_id,service_date=excluded.service_date,scheduled_start=excluded.scheduled_start,estimated_minutes=excluded.estimated_minutes,required_skills_json=excluded.required_skills_json,district=excluded.district,status=excluded.status,assigned_by=excluded.assigned_by,updated_at=excluded.updated_at").run(item.targetType,item.targetId,item.technicianId,item.clientId,item.wallId,item.serviceDate,item.scheduledStart,item.estimatedMinutes,JSON.stringify(item.requiredSkills),item.district,item.status,item.assignedBy,item.createdAt,item.updatedAt);
      db.exec("COMMIT");
      return { created: !existing, assignment: assignmentFromRow(db.prepare("SELECT * FROM ops_workforce_assignments WHERE target_type=? AND target_id=?").get(item.targetType,item.targetId)) };
    } catch (error) { db.exec("ROLLBACK"); throw error; }
  });
}

export async function readSqliteWorkforceStorageHealth(dbPath) {
  return withDatabase(dbPath, (db) => {
    const technicians=Number(db.prepare("SELECT COUNT(*) AS count FROM ops_technicians").get().count); const assignments=Number(db.prepare("SELECT COUNT(*) AS count FROM ops_workforce_assignments").get().count); const active=Number(db.prepare("SELECT COUNT(*) AS count FROM ops_workforce_assignments WHERE status NOT IN ('completed','cancelled')").get().count); const unknownTechnicians=Number(db.prepare("SELECT COUNT(*) AS count FROM ops_workforce_assignments a LEFT JOIN ops_technicians t ON t.id=a.technician_id WHERE t.id IS NULL").get().count);
    return { backend:"sqlite",migrationVersion:workforceMigrationVersion,tables:["ops_technicians","ops_workforce_assignments"],counts:{technicians,assignments,activeAssignments:active},relationshipIntegrity:{unknownTechnicians} };
  });
}
