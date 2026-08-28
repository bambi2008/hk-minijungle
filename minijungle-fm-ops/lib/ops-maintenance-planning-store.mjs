import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import { DatabaseSync } from "node:sqlite";
import { dirname } from "node:path";
import { addDays, maintenancePlanningError, maintenancePlanningMigrationVersion, maintenanceWorkOrderId, normalizeMaintenancePlan, normalizeMaintenanceWindow } from "./ops-maintenance-policy.mjs";

function parseJson(value, fallback) { try { return JSON.parse(value || ""); } catch { return fallback; } }
function planFromRow(row) { return row ? { id: row.id, clientId: row.client_id, wallId: row.wall_id, serviceType: row.service_type, cadenceDays: Number(row.cadence_days), nextDueDate: row.next_due_date, durationMinutes: Number(row.duration_minutes), tasks: parseJson(row.tasks_json, []), requiredSkills: parseJson(row.required_skills_json, []), status: row.status, source: row.source, createdBy: row.created_by, updatedBy: row.updated_by, createdAt: row.created_at, updatedAt: row.updated_at } : null; }
function occurrenceFromRow(row) { return row ? { planId: row.plan_id, serviceDate: row.service_date, workOrderId: row.work_order_id, status: row.status, generatedBy: row.generated_by, generatedAt: row.generated_at, wallId: row.wall_id, clientId: row.client_id, serviceType: row.service_type, due: row.due, workOrderStatus: row.work_order_status, priority: row.priority, tasks: parseJson(row.work_order_tasks_json, []) } : null; }
function runFromRow(row) { return row ? { id: row.id, fromDate: row.from_date, throughDate: row.through_date, status: row.status, generatedCount: Number(row.generated_count), skippedCount: Number(row.skipped_count), actor: row.actor, startedAt: row.started_at, completedAt: row.completed_at } : null; }

function initialize(db) {
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
    CREATE TABLE IF NOT EXISTS schema_migrations(version TEXT PRIMARY KEY,applied_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS ops_maintenance_plans(id TEXT PRIMARY KEY,client_id TEXT NOT NULL,wall_id TEXT NOT NULL,service_type TEXT NOT NULL,cadence_days INTEGER NOT NULL CHECK(cadence_days BETWEEN 1 AND 365),next_due_date TEXT NOT NULL,duration_minutes INTEGER NOT NULL CHECK(duration_minutes BETWEEN 15 AND 480),tasks_json TEXT NOT NULL,required_skills_json TEXT NOT NULL,status TEXT NOT NULL CHECK(status IN ('active','paused')),source TEXT NOT NULL,created_by TEXT NOT NULL,updated_by TEXT NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL,UNIQUE(wall_id,service_type),FOREIGN KEY(client_id) REFERENCES clients(id) ON UPDATE CASCADE ON DELETE RESTRICT,FOREIGN KEY(wall_id) REFERENCES living_assets(id) ON UPDATE CASCADE ON DELETE RESTRICT);
    CREATE TABLE IF NOT EXISTS ops_maintenance_occurrences(plan_id TEXT NOT NULL,service_date TEXT NOT NULL,work_order_id TEXT NOT NULL UNIQUE,status TEXT NOT NULL CHECK(status IN ('generated','cancelled')),generated_by TEXT NOT NULL,generated_at TEXT NOT NULL,PRIMARY KEY(plan_id,service_date),FOREIGN KEY(plan_id) REFERENCES ops_maintenance_plans(id) ON UPDATE CASCADE ON DELETE RESTRICT,FOREIGN KEY(work_order_id) REFERENCES work_orders(id) ON UPDATE CASCADE ON DELETE RESTRICT);
    CREATE TABLE IF NOT EXISTS ops_maintenance_generation_runs(id TEXT PRIMARY KEY,from_date TEXT NOT NULL,through_date TEXT NOT NULL,status TEXT NOT NULL CHECK(status IN ('completed','failed')),generated_count INTEGER NOT NULL,skipped_count INTEGER NOT NULL,actor TEXT NOT NULL,started_at TEXT NOT NULL,completed_at TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS idx_maintenance_plan_due ON ops_maintenance_plans(status,next_due_date);
    CREATE INDEX IF NOT EXISTS idx_maintenance_occurrence_date ON ops_maintenance_occurrences(service_date,status);
  `);
  db.prepare("INSERT OR IGNORE INTO schema_migrations(version,applied_at) VALUES(?,?)").run(maintenancePlanningMigrationVersion, new Date().toISOString());
}

async function withDatabase(dbPath, callback) { await mkdir(dirname(dbPath), { recursive: true }); const db = new DatabaseSync(dbPath); try { initialize(db); return await callback(db); } finally { db.close(); } }

export async function upsertSqliteMaintenancePlan(dbPath, input) {
  return withDatabase(dbPath, (db) => {
    const existing = planFromRow(db.prepare("SELECT * FROM ops_maintenance_plans WHERE id=?").get(String(input?.id || ""))) || planFromRow(db.prepare("SELECT * FROM ops_maintenance_plans WHERE wall_id=? AND service_type=?").get(String(input?.wallId || ""), String(input?.serviceType || "Preventive plant care")));
    const item = normalizeMaintenancePlan(input, existing);
    try {
      db.prepare("INSERT INTO ops_maintenance_plans(id,client_id,wall_id,service_type,cadence_days,next_due_date,duration_minutes,tasks_json,required_skills_json,status,source,created_by,updated_by,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET client_id=excluded.client_id,wall_id=excluded.wall_id,service_type=excluded.service_type,cadence_days=excluded.cadence_days,next_due_date=excluded.next_due_date,duration_minutes=excluded.duration_minutes,tasks_json=excluded.tasks_json,required_skills_json=excluded.required_skills_json,status=excluded.status,source=excluded.source,updated_by=excluded.updated_by,updated_at=excluded.updated_at").run(item.id,item.clientId,item.wallId,item.serviceType,item.cadenceDays,item.nextDueDate,item.durationMinutes,JSON.stringify(item.tasks),JSON.stringify(item.requiredSkills),item.status,item.source,item.createdBy,item.updatedBy,item.createdAt,item.updatedAt);
    } catch (error) { if (/constraint/i.test(String(error?.message))) throw maintenancePlanningError("maintenance plan references an unknown client/asset or duplicates the asset service type", "MAINTENANCE_PLAN_CONSTRAINT", 409); throw error; }
    return { created: !existing, plan: planFromRow(db.prepare("SELECT * FROM ops_maintenance_plans WHERE id=?").get(item.id)) };
  });
}

export async function listSqliteMaintenancePlans(dbPath, { status = null, clientIds = null, dueBefore = null, limit = 500 } = {}) {
  return withDatabase(dbPath, (db) => { const clauses=["1=1"],params=[]; if(status){clauses.push("status=?");params.push(status);} if(clientIds&&!clientIds.includes("*")){clauses.push(`client_id IN (${clientIds.map(()=>"?").join(",")})`);params.push(...clientIds);} if(dueBefore){clauses.push("next_due_date<=?");params.push(dueBefore);} params.push(Math.min(Math.max(Number(limit)||500,1),1000)); return db.prepare(`SELECT * FROM ops_maintenance_plans WHERE ${clauses.join(" AND ")} ORDER BY next_due_date,wall_id LIMIT ?`).all(...params).map(planFromRow); });
}

export async function listSqliteMaintenanceOccurrences(dbPath, { fromDate = null, throughDate = null, clientIds = null, limit = 500 } = {}) {
  return withDatabase(dbPath, (db) => { const clauses=["1=1"],params=[]; if(fromDate){clauses.push("o.service_date>=?");params.push(fromDate);} if(throughDate){clauses.push("o.service_date<=?");params.push(throughDate);} if(clientIds&&!clientIds.includes("*")){clauses.push(`p.client_id IN (${clientIds.map(()=>"?").join(",")})`);params.push(...clientIds);} params.push(Math.min(Math.max(Number(limit)||500,1),1000)); return db.prepare(`SELECT o.*,p.wall_id,p.client_id,p.service_type,w.due,w.status AS work_order_status,w.priority,w.tasks_json AS work_order_tasks_json FROM ops_maintenance_occurrences o JOIN ops_maintenance_plans p ON p.id=o.plan_id JOIN work_orders w ON w.id=o.work_order_id WHERE ${clauses.join(" AND ")} ORDER BY o.service_date,p.wall_id LIMIT ?`).all(...params).map(occurrenceFromRow); });
}

export async function generateSqliteMaintenanceOccurrences(dbPath, input) {
  const window = normalizeMaintenanceWindow(input); const actor = String(input.actor || "system").trim() || "system"; const runId = String(input.runId || `MGR-${randomUUID()}`); const startedAt = new Date().toISOString();
  return withDatabase(dbPath, (db) => {
    db.exec("BEGIN IMMEDIATE");
    try {
      const clientIds = Array.isArray(input.clientIds) && !input.clientIds.includes("*") ? input.clientIds : null;
      const plans = clientIds
        ? db.prepare(`SELECT * FROM ops_maintenance_plans WHERE status='active' AND next_due_date<=? AND client_id IN (${clientIds.map(()=>"?").join(",")}) ORDER BY next_due_date,id`).all(window.throughDate,...clientIds).map(planFromRow)
        : db.prepare("SELECT * FROM ops_maintenance_plans WHERE status='active' AND next_due_date<=? ORDER BY next_due_date,id").all(window.throughDate).map(planFromRow);
      let generatedCount=0, skippedCount=0; const generated=[];
      for (const plan of plans) {
        let serviceDate=plan.nextDueDate;
        while (serviceDate <= window.throughDate) {
          if (generatedCount + skippedCount >= 1000) throw maintenancePlanningError("generation would exceed 1000 occurrences", "MAINTENANCE_GENERATION_LIMIT", 409);
          const workOrderId=maintenanceWorkOrderId(plan.id,serviceDate); const existingOccurrence=db.prepare("SELECT work_order_id FROM ops_maintenance_occurrences WHERE plan_id=? AND service_date=?").get(plan.id,serviceDate);
          if (existingOccurrence) { skippedCount += 1; serviceDate=addDays(serviceDate,plan.cadenceDays); continue; }
          const existingWorkOrder=db.prepare("SELECT raw_json FROM work_orders WHERE id=?").get(workOrderId);
          if (existingWorkOrder && parseJson(existingWorkOrder.raw_json,{}).sourcePlanId !== plan.id) throw maintenancePlanningError(`work order id collision for ${workOrderId}`, "MAINTENANCE_WORK_ORDER_COLLISION", 409);
          const priority=serviceDate < window.fromDate ? "high" : "medium"; const due=`${serviceDate}T09:00:00+08:00`; const order={id:workOrderId,wallId:plan.wallId,type:plan.serviceType,due,status:"Scheduled",priority,tasks:plan.tasks,sourcePlanId:plan.id,serviceDate,externalSource:"maintenance-plan",durationMinutes:plan.durationMinutes,requiredSkills:plan.requiredSkills};
          db.prepare("INSERT OR IGNORE INTO work_orders(id,wall_id,type,due,status,priority,tasks_json,raw_json) VALUES(?,?,?,?,?,?,?,?)").run(order.id,order.wallId,order.type,order.due,order.status,order.priority,JSON.stringify(order.tasks),JSON.stringify(order));
          db.prepare("INSERT INTO ops_maintenance_occurrences(plan_id,service_date,work_order_id,status,generated_by,generated_at) VALUES(?,?,?,?,?,?)").run(plan.id,serviceDate,workOrderId,"generated",actor,startedAt);
          generatedCount += 1; generated.push({ planId: plan.id, serviceDate, workOrderId, wallId: plan.wallId, clientId: plan.clientId }); serviceDate=addDays(serviceDate,plan.cadenceDays);
        }
        db.prepare("UPDATE ops_maintenance_plans SET next_due_date=?,updated_by=?,updated_at=? WHERE id=?").run(serviceDate,actor,startedAt,plan.id);
      }
      db.prepare("INSERT INTO ops_maintenance_generation_runs(id,from_date,through_date,status,generated_count,skipped_count,actor,started_at,completed_at) VALUES(?,?,?,?,?,?,?,?,?)").run(runId,window.fromDate,window.throughDate,"completed",generatedCount,skippedCount,actor,startedAt,new Date().toISOString());
      db.exec("COMMIT");
      return { run: runFromRow(db.prepare("SELECT * FROM ops_maintenance_generation_runs WHERE id=?").get(runId)), generated };
    } catch (error) { db.exec("ROLLBACK"); throw error; }
  });
}

export async function readSqliteMaintenancePlanningHealth(dbPath) {
  return withDatabase(dbPath, (db) => { const plans=Number(db.prepare("SELECT COUNT(*) count FROM ops_maintenance_plans").get().count); const activePlans=Number(db.prepare("SELECT COUNT(*) count FROM ops_maintenance_plans WHERE status='active'").get().count); const occurrences=Number(db.prepare("SELECT COUNT(*) count FROM ops_maintenance_occurrences").get().count); const runs=Number(db.prepare("SELECT COUNT(*) count FROM ops_maintenance_generation_runs").get().count); const unknownAssets=Number(db.prepare("SELECT COUNT(*) count FROM ops_maintenance_plans p LEFT JOIN living_assets a ON a.id=p.wall_id WHERE a.id IS NULL").get().count); const unknownWorkOrders=Number(db.prepare("SELECT COUNT(*) count FROM ops_maintenance_occurrences o LEFT JOIN work_orders w ON w.id=o.work_order_id WHERE w.id IS NULL").get().count); return { backend:"sqlite",migrationVersion:maintenancePlanningMigrationVersion,tables:["ops_maintenance_plans","ops_maintenance_occurrences","ops_maintenance_generation_runs"],counts:{plans,activePlans,occurrences,runs},relationshipIntegrity:{unknownAssets,unknownWorkOrders} }; });
}
