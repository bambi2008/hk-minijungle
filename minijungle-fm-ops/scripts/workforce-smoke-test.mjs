import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { evaluateSqliteWorkforceCandidates, listSqliteWorkforceAssignments, readSqliteWorkforceStorageHealth, upsertSqliteTechnician, upsertSqliteWorkforceAssignment } from "../lib/ops-workforce-store.mjs";

const root = await mkdtemp(join(tmpdir(), "dr-forest-workforce-"));
const dbPath = join(root, "runtime.sqlite");
const base = { clientId: "central-office", wallId: "MJ-HK-001", serviceDate: "2026-08-28", requiredSkills: ["plant-care"], district: "Central", status: "planned", assignedBy: "fm-lead" };

try {
  const created = await upsertSqliteTechnician(dbPath, { id: "tech-central", displayName: "Central Technician", skills: ["plant-care", "visual-diagnosis"], districts: ["Central"], shiftStart: "08:00", shiftEnd: "18:00", maxDailyMinutes: 240, createdBy: "fm-lead", updatedBy: "fm-lead" });
  assert.equal(created.created, true);
  const eligible = await evaluateSqliteWorkforceCandidates(dbPath, { ...base, targetType: "work-order", targetId: "WO-A", technicianId: "candidate", estimatedMinutes: 120 });
  assert.equal(eligible.find((item) => item.technician.id === "tech-central")?.eligible, true);
  await upsertSqliteWorkforceAssignment(dbPath, { ...base, targetType: "work-order", targetId: "WO-A", technicianId: "tech-central", scheduledStart: "2026-08-28T09:00:00+08:00", estimatedMinutes: 120 });

  const overlap = await evaluateSqliteWorkforceCandidates(dbPath, { ...base, targetType: "work-order", targetId: "WO-B", technicianId: "candidate", scheduledStart: "2026-08-28T10:00:00+08:00", estimatedMinutes: 60 });
  assert.match(overlap.find((item) => item.technician.id === "tech-central")?.reasons.join(" ") || "", /overlaps/);
  const wrongDistrict = await evaluateSqliteWorkforceCandidates(dbPath, { ...base, targetType: "work-order", targetId: "WO-C", technicianId: "candidate", district: "Wan Chai", estimatedMinutes: 60 });
  assert.match(wrongDistrict.find((item) => item.technician.id === "tech-central")?.reasons.join(" ") || "", /not covered/);
  const overCapacity = await evaluateSqliteWorkforceCandidates(dbPath, { ...base, targetType: "remediation-task", targetId: "RMT-C", technicianId: "candidate", estimatedMinutes: 180 });
  assert.match(overCapacity.find((item) => item.technician.id === "tech-central")?.reasons.join(" ") || "", /capacity exceeded/);

  await assert.rejects(() => upsertSqliteWorkforceAssignment(dbPath, { ...base, targetType: "remediation-task", targetId: "RMT-C", technicianId: "tech-central", estimatedMinutes: 180 }), (error) => error.code === "WORKFORCE_ASSIGNMENT_INELIGIBLE" && error.status === 409);
  const assignments = await listSqliteWorkforceAssignments(dbPath, { technicianId: "tech-central", serviceDate: base.serviceDate });
  assert.equal(assignments.length, 1);
  const health = await readSqliteWorkforceStorageHealth(dbPath);
  assert.equal(health.migrationVersion, "2026-08-30.workforce-dispatch-v1");
  assert.equal(health.relationshipIntegrity.unknownTechnicians, 0);
  console.log(JSON.stringify({ status: "passed", eligible: true, overlapBlocked: true, districtBlocked: true, capacityBlocked: true, health }, null, 2));
} finally {
  await rm(root, { recursive: true, force: true });
}
