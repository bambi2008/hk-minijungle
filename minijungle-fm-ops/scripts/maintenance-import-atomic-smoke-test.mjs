import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { applySqliteMaintenanceImport } from "../lib/ops-maintenance-import-apply.mjs";
import { createSqliteMaintenanceImport } from "../lib/ops-integration-store.mjs";
import { importSqliteMasterData } from "../lib/ops-master-data-store.mjs";

const dataRoot = join(dirname(fileURLToPath(import.meta.url)), "../data");
const tempRoot = await mkdtemp(join(tmpdir(), "dr-forest-maintenance-atomic-"));
const dbPath = join(tempRoot, "maintenance.sqlite");

function event(id, batchId) {
  return {
    id,
    timestamp: "2026-08-29T09:00:00.000Z",
    type: "maintenance.import.applied",
    actor: "FM Lead",
    entityType: "maintenance-import",
    entityId: batchId,
    source: "airtable-csv",
    note: "Atomic maintenance import smoke test.",
    payload: { batchId, source: "smoke-test" }
  };
}

function counts() {
  const db = new DatabaseSync(dbPath);
  try {
    return {
      workOrders: Number(db.prepare("SELECT COUNT(*) AS count FROM work_orders").get().count),
      events: Number(db.prepare("SELECT COUNT(*) AS count FROM ops_events").get().count),
      previewed: Number(db.prepare("SELECT COUNT(*) AS count FROM ops_maintenance_imports WHERE status='previewed'").get().count),
      applied: Number(db.prepare("SELECT COUNT(*) AS count FROM ops_maintenance_imports WHERE status='applied'").get().count)
    };
  } finally {
    db.close();
  }
}

try {
  await importSqliteMasterData(dbPath, dataRoot);
  const validBatch = await createSqliteMaintenanceImport(dbPath, {
    id: "MIMP-ATOMIC-VALID-001",
    source: "airtable-csv",
    sourceFilename: "atomic-valid.csv",
    checksum: "atomic-valid-checksum",
    rowCount: 1,
    validCount: 1,
    invalidCount: 0,
    createdBy: "fm-lead",
    rows: [{
      rowNumber: 2,
      sourceRecordId: "atomic-valid-001",
      workOrder: {
        id: "AIR-atomic-valid-001",
        wallId: "MJ-HK-021",
        type: "Maintenance",
        due: "2026-08-29T00:00:00.000Z",
        status: "Completed",
        priority: "medium",
        tasks: ["Water check", "Photo capture"],
        externalSource: "airtable-csv",
        externalRecordId: "atomic-valid-001",
        sourceUpdatedAt: "2026-08-29T08:00:00.000Z"
      }
    }]
  });
  const applied = await applySqliteMaintenanceImport(dbPath, { batchId: validBatch.batch.id, appliedBy: "fm-lead", event: event("OPS-ATOMIC-VALID-001", validBatch.batch.id) });
  assert.equal(applied.duplicate, false);
  assert.equal(applied.imported, 1);
  assert.deepEqual(applied.workOrderIds, ["AIR-atomic-valid-001"]);
  assert.equal(applied.batch.status, "applied");
  assert.equal(applied.event.id, "OPS-ATOMIC-VALID-001");

  const afterFirstApply = counts();
  assert.deepEqual(afterFirstApply, { workOrders: 5, events: 1, previewed: 0, applied: 1 });
  const duplicate = await applySqliteMaintenanceImport(dbPath, { batchId: validBatch.batch.id, appliedBy: "fm-lead", event: event("OPS-ATOMIC-VALID-RETRY", validBatch.batch.id) });
  assert.equal(duplicate.duplicate, true);
  assert.equal(duplicate.event, null);
  assert.deepEqual(counts(), afterFirstApply);

  const staleBatch = await createSqliteMaintenanceImport(dbPath, {
    id: "MIMP-ATOMIC-STALE-001",
    source: "airtable-csv",
    sourceFilename: "atomic-stale.csv",
    checksum: "atomic-stale-checksum",
    rowCount: 1,
    validCount: 1,
    invalidCount: 0,
    createdBy: "fm-lead",
    rows: [{
      rowNumber: 2,
      sourceRecordId: "atomic-valid-001",
      workOrder: {
        id: "AIR-atomic-valid-001",
        wallId: "MJ-HK-021",
        type: "Maintenance",
        due: "2026-08-30T00:00:00.000Z",
        status: "Scheduled",
        priority: "high",
        tasks: ["Stale source must not overwrite"],
        externalSource: "airtable-csv",
        externalRecordId: "atomic-valid-001",
        sourceUpdatedAt: "2026-08-28T08:00:00.000Z"
      }
    }]
  });
  await assert.rejects(
    () => applySqliteMaintenanceImport(dbPath, { batchId: staleBatch.batch.id, appliedBy: "fm-lead", event: event("OPS-ATOMIC-STALE-001", staleBatch.batch.id) }),
    /older than existing work orders/i
  );
  assert.deepEqual(counts(), { workOrders: 5, events: 1, previewed: 1, applied: 1 });

  const freshBatch = await createSqliteMaintenanceImport(dbPath, {
    id: "MIMP-ATOMIC-FRESH-001",
    source: "airtable-csv",
    sourceFilename: "atomic-fresh.csv",
    checksum: "atomic-fresh-checksum",
    rowCount: 1,
    validCount: 1,
    invalidCount: 0,
    createdBy: "fm-lead",
    rows: [{
      rowNumber: 2,
      sourceRecordId: "atomic-valid-001",
      workOrder: {
        id: "AIR-atomic-valid-001",
        wallId: "MJ-HK-021",
        type: "Maintenance",
        due: "2026-08-30T00:00:00.000Z",
        status: "Scheduled",
        priority: "high",
        tasks: ["Fresh source updates the work order"],
        externalSource: "airtable-csv",
        externalRecordId: "atomic-valid-001",
        sourceUpdatedAt: "2026-08-30T08:00:00.000Z"
      }
    }]
  });
  const freshApplied = await applySqliteMaintenanceImport(dbPath, { batchId: freshBatch.batch.id, appliedBy: "fm-lead", event: event("OPS-ATOMIC-FRESH-001", freshBatch.batch.id) });
  assert.equal(freshApplied.duplicate, false);
  assert.equal(freshApplied.batch.status, "applied");
  assert.deepEqual(counts(), { workOrders: 5, events: 2, previewed: 1, applied: 2 });

  const rollbackBatch = await createSqliteMaintenanceImport(dbPath, {
    id: "MIMP-ATOMIC-ROLLBACK-001",
    source: "airtable-csv",
    sourceFilename: "atomic-rollback.csv",
    checksum: "atomic-rollback-checksum",
    rowCount: 1,
    validCount: 1,
    invalidCount: 0,
    createdBy: "fm-lead",
    rows: [{
      rowNumber: 2,
      sourceRecordId: "atomic-rollback-001",
      workOrder: {
        id: "AIR-atomic-rollback-001",
        wallId: "MISSING-WALL",
        type: "Maintenance",
        due: "2026-08-29T00:00:00.000Z",
        status: "Completed",
        priority: "medium",
        tasks: ["Should roll back"]
      }
    }]
  });
  await assert.rejects(
    () => applySqliteMaintenanceImport(dbPath, { batchId: rollbackBatch.batch.id, appliedBy: "fm-lead", event: event("OPS-ATOMIC-ROLLBACK-001", rollbackBatch.batch.id) }),
    /constraint|foreign key/i
  );
  const afterRollback = counts();
  assert.deepEqual(afterRollback, { workOrders: 5, events: 2, previewed: 2, applied: 2 });
  const db = new DatabaseSync(dbPath);
  try {
    assert.equal(db.prepare("SELECT COUNT(*) AS count FROM work_orders WHERE id='AIR-atomic-rollback-001'").get().count, 0);
    assert.equal(db.prepare("SELECT COUNT(*) AS count FROM ops_events WHERE id='OPS-ATOMIC-ROLLBACK-001'").get().count, 0);
    assert.equal(db.prepare("SELECT status FROM ops_maintenance_imports WHERE id=?").get(rollbackBatch.batch.id).status, "previewed");
  } finally {
    db.close();
  }
  console.log(JSON.stringify({ ok: true, atomicVersion: "2026-08-29.atomic-maintenance-import-v1", firstApply: afterFirstApply, duplicateProtected: true, staleSourceBlocked: true, freshSourceAccepted: true, rollbackPreserved: afterRollback }, null, 2));
} finally {
  await rm(tempRoot, { recursive: true, force: true });
}
