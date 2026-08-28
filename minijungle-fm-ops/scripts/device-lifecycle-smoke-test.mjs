import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { applySqliteDeviceLifecycleAction, listSqliteDeviceLifecycle, listSqliteDeviceLifecycleEvents, readSqliteDeviceLifecycleHealth, upsertSqliteDeviceLifecycleProfile } from "../lib/ops-device-lifecycle-store.mjs";

const root=await mkdtemp(join(tmpdir(),"drf-device-life-"));const dbPath=join(root,"runtime.sqlite");const db=new DatabaseSync(dbPath);
db.exec(`PRAGMA foreign_keys=ON;
 CREATE TABLE clients(id TEXT PRIMARY KEY);
 CREATE TABLE living_assets(id TEXT PRIMARY KEY,client_id TEXT NOT NULL REFERENCES clients(id));
 CREATE TABLE asset_modules(id TEXT PRIMARY KEY,asset_id TEXT NOT NULL REFERENCES living_assets(id),client_id TEXT NOT NULL REFERENCES clients(id));
 CREATE TABLE asset_devices(id TEXT PRIMARY KEY,client_id TEXT NOT NULL REFERENCES clients(id),wall_id TEXT NOT NULL REFERENCES living_assets(id),module_id TEXT REFERENCES asset_modules(id),type TEXT NOT NULL,label TEXT NOT NULL,protocol TEXT NOT NULL,status TEXT NOT NULL,last_seen_at TEXT,updated_at TEXT NOT NULL);
 INSERT INTO clients VALUES('CLIENT-1');INSERT INTO living_assets VALUES('WALL-1','CLIENT-1');INSERT INTO asset_modules VALUES('MOD-1','WALL-1','CLIENT-1');
 INSERT INTO asset_devices VALUES('TEMP-1','CLIENT-1','WALL-1','MOD-1','temperature','Temperature 1','http-push','active',NULL,'2026-09-04T00:00:00.000Z');
 INSERT INTO asset_devices VALUES('TEMP-2','CLIENT-1','WALL-1','MOD-1','temperature','Temperature 2','http-push','pending',NULL,'2026-09-04T00:00:00.000Z');
 INSERT INTO asset_devices VALUES('CAM-1','CLIENT-1','WALL-1','MOD-1','camera','Camera 1','camera-http','active',NULL,'2026-09-04T00:00:00.000Z');`);db.close();

try{
 const initial=await listSqliteDeviceLifecycle(dbPath);assert.equal(initial.summary.unmanaged,3);
 const profile=await upsertSqliteDeviceLifecycleProfile(dbPath,"TEMP-1",{serialNumber:"TEMP-SN-001",manufacturer:"Dr Forest",model:"T1",calibrationIntervalDays:180,lastCalibratedAt:"2026-01-01T00:00:00.000Z",actorId:"fm-lead",idempotencyKey:"profile-1"});assert.equal(profile.record.calibrationState,"due");
 const replay=await upsertSqliteDeviceLifecycleProfile(dbPath,"TEMP-1",{serialNumber:"CHANGED",actorId:"fm-lead",idempotencyKey:"profile-1"});assert.equal(replay.duplicate,true);assert.equal(replay.record.serialNumber,"TEMP-SN-001");
 await assert.rejects(()=>applySqliteDeviceLifecycleAction(dbPath,"TEMP-1",{action:"calibrated",expectedUpdatedAt:profile.record.updatedAt,actorId:"field-tech",idempotencyKey:"cal-bad"}),(error)=>error.code==="DEVICE_LIFECYCLE_VALIDATION_ERROR");
 const calibrated=await applySqliteDeviceLifecycleAction(dbPath,"TEMP-1",{action:"calibrated",expectedUpdatedAt:profile.record.updatedAt,occurredAt:"2026-09-04T01:00:00.000Z",evidenceRef:"CAL-CERT-001",workOrderId:"WO-1",note:"Reference probe passed.",actorId:"field-tech",actorName:"Field Technician",idempotencyKey:"cal-1"});assert.equal(calibrated.record.nextCalibrationDueAt,"2027-03-03T01:00:00.000Z");
 const fault=await applySqliteDeviceLifecycleAction(dbPath,"TEMP-1",{action:"fault_reported",expectedUpdatedAt:calibrated.record.updatedAt,note:"Intermittent reading drift.",workOrderId:"WO-1",actorId:"field-tech",idempotencyKey:"fault-1"});assert.equal(fault.record.status,"fault");assert.equal(fault.record.registryStatus,"offline");
 const returned=await applySqliteDeviceLifecycleAction(dbPath,"TEMP-1",{action:"returned_to_service",expectedUpdatedAt:fault.record.updatedAt,note:"Connector replaced and verified.",evidenceRef:"CAP-1",actorId:"fm-lead",idempotencyKey:"return-1"});assert.equal(returned.record.status,"in_service");assert.equal(returned.record.registryStatus,"active");
 const replacementProfile=await upsertSqliteDeviceLifecycleProfile(dbPath,"TEMP-2",{serialNumber:"TEMP-SN-002",calibrationIntervalDays:180,actorId:"fm-lead",idempotencyKey:"profile-2"});
 const replaced=await applySqliteDeviceLifecycleAction(dbPath,"TEMP-1",{action:"replaced",expectedUpdatedAt:returned.record.updatedAt,replacementDeviceId:replacementProfile.record.deviceId,note:"Permanent replacement after recurrent drift.",actorId:"fm-lead",idempotencyKey:"replace-1"});assert.equal(replaced.record.status,"replaced");assert.equal(replaced.record.replacementDeviceId,"TEMP-2");
 await assert.rejects(()=>applySqliteDeviceLifecycleAction(dbPath,"TEMP-1",{action:"retired",expectedUpdatedAt:replaced.record.updatedAt,note:"Cannot move terminal record.",actorId:"fm-lead",idempotencyKey:"retire-terminal"}),(error)=>error.code==="DEVICE_LIFECYCLE_TERMINAL");
 assert.equal((await listSqliteDeviceLifecycleEvents(dbPath,"TEMP-1")).length,5);
 const health=await readSqliteDeviceLifecycleHealth(dbPath);assert.equal(health.counts.profiles,2);assert.equal(health.relationshipIntegrity.foreignKeyIssues,0);
 console.log(JSON.stringify({ok:true,summary:(await listSqliteDeviceLifecycle(dbPath)).summary,health},null,2));
}finally{await rm(root,{recursive:true,force:true});}
