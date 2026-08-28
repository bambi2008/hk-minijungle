import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { importSqliteMasterData, readSqliteMasterDataset } from "../lib/ops-master-data-store.mjs";
import { generateSqliteMaintenanceOccurrences, listSqliteMaintenanceOccurrences, listSqliteMaintenancePlans, readSqliteMaintenancePlanningHealth, upsertSqliteMaintenancePlan } from "../lib/ops-maintenance-planning-store.mjs";

const projectRoot = join(fileURLToPath(new URL("..", import.meta.url)));
const root = await mkdtemp(join(tmpdir(), "dr-forest-maintenance-planning-"));
const dbPath = join(root, "runtime.sqlite");

try {
  await importSqliteMasterData(dbPath, join(projectRoot, "data"));
  const created = await upsertSqliteMaintenancePlan(dbPath, { clientId: "show-suite", wallId: "MJ-HK-021", serviceType: "Preventive plant care", cadenceDays: 7, nextDueDate: "2026-07-25", durationMinutes: 90, tasks: ["Plant health check", "Fixed-angle proof photo"], requiredSkills: ["plant-care", "visual-diagnosis"], createdBy: "smoke", updatedBy: "smoke" });
  assert.equal(created.created, true);
  const generated = await generateSqliteMaintenanceOccurrences(dbPath, { fromDate: "2026-08-01", throughDate: "2026-08-15", actor: "smoke", runId: "MGR-SMOKE-1" });
  assert.equal(generated.run.generatedCount, 4, "overdue and current occurrences should be generated without a date gap");
  assert.equal(generated.generated[0].workOrderId.includes("20260725"), true);
  const repeated = await generateSqliteMaintenanceOccurrences(dbPath, { fromDate: "2026-08-01", throughDate: "2026-08-15", actor: "smoke", runId: "MGR-SMOKE-2" });
  assert.equal(repeated.run.generatedCount, 0, "advanced plan cursor should prevent duplicate work orders");
  const occurrences = await listSqliteMaintenanceOccurrences(dbPath, { fromDate: "2026-07-01", throughDate: "2026-08-31" });
  assert.equal(occurrences.length, 4);
  const dataset = await readSqliteMasterDataset(dbPath, join(projectRoot, "data"));
  assert.equal(dataset.workorders.filter((item) => item.sourcePlanId === created.plan.id).length, 4, "maintenance generation should persist ordinary work orders for mobile dispatch");
  const plans = await listSqliteMaintenancePlans(dbPath);
  assert.equal(plans[0].nextDueDate, "2026-08-22");
  await assert.rejects(() => generateSqliteMaintenanceOccurrences(dbPath, { fromDate: "2026-08-01", throughDate: "2026-12-31", actor: "smoke" }), (error) => error.code === "MAINTENANCE_HORIZON_TOO_LARGE");
  const health = await readSqliteMaintenancePlanningHealth(dbPath);
  assert.equal(health.relationshipIntegrity.unknownAssets, 0);
  assert.equal(health.relationshipIntegrity.unknownWorkOrders, 0);
  console.log(JSON.stringify({ status: "passed", generated: generated.run.generatedCount, duplicateGeneration: repeated.run.generatedCount, health }, null, 2));
} finally {
  await rm(root, { recursive: true, force: true });
}
