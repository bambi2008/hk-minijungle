import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  applySqliteInventoryMovement,
  consumeSqliteInventory,
  readSqliteInventoryHealth,
  readSqliteInventoryOverview,
  receiveSqliteInventoryLot,
  reviewSqliteInventoryStockCount,
  seedSqliteInventory,
  submitSqliteInventoryStockCount
} from "../lib/ops-inventory-store.mjs";

const root = await mkdtemp(join(tmpdir(), "dr-forest-lot-test-"));
const dbPath = join(root, "ops.db");
const dataRoot = fileURLToPath(new URL("../data/", import.meta.url));

try {
  await seedSqliteInventory(dbPath, dataRoot);
  await assert.rejects(() => receiveSqliteInventoryLot(dbPath, { id:"LOT-EXPIRED",locationId:"warehouse-hk",sku:"NUT-A",lotCode:"EXPIRED",supplier:"Approved supplier",quantity:1,receivedDate:"2000-01-01",expiryDate:"2000-02-01",actor:"fm-lead" }), (error) => error.code === "INVENTORY_LOT_EXPIRED");
  const receipt = await receiveSqliteInventoryLot(dbPath, { id:"LOT-TEST-EARLY",locationId:"warehouse-hk",sku:"NUT-A",lotCode:"NUT-HK-2098",supplier:"Approved supplier",quantity:20,receivedDate:new Date().toISOString().slice(0,10),expiryDate:"2098-10-01",actor:"fm-lead" });
  assert.equal(receipt.duplicate, false);

  const transfer = await applySqliteInventoryMovement(dbPath, { id:"MOVE-TRACE-1",type:"transfer",sourceLocationId:"warehouse-hk",destinationLocationId:"kit-field-tech-show-suite",sku:"NUT-A",quantity:10,note:"Traceable route kit load",actor:"fm-lead" });
  assert.equal(transfer.transactions[0].metadata.traceability.allocations[0].lotCode, "NUT-HK-2098");
  assert.equal(transfer.transactions[0].metadata.traceability.untrackedQuantity, 0);

  const consumed = await consumeSqliteInventory(dbPath, { id:"CON-TRACE-1",locationId:"kit-field-tech-show-suite",workOrderId:"WO-TRACE",technicianId:"field-tech-show-suite",items:[{sku:"NUT-A",quantity:3}],actor:"field-tech-show-suite" });
  assert.equal(consumed.transactions[0].metadata.traceability.allocations[0].quantity, 3);

  let overview = await readSqliteInventoryOverview(dbPath, { technicianId:"field-tech-show-suite" });
  const kitLot = overview.lots.find((lot) => lot.id === "LOT-TEST-EARLY");
  assert.equal(kitLot.onHand, 7);
  const count = await submitSqliteInventoryStockCount(dbPath, { id:"CNT-TRACE-1",locationId:"kit-field-tech-show-suite",technicianId:"field-tech-show-suite",countedBy:"field-tech-show-suite",note:"End of route count",lines:[{lotId:kitLot.id,countedQuantity:6,reason:"One ml handling variance"}] });
  assert.equal(count.count.status, "submitted");
  assert.equal(count.count.lines[0].variance, -1);

  await assert.rejects(() => reviewSqliteInventoryStockCount(dbPath, count.count.id, { decision:"approved",note:"Self approval",reviewedBy:"field-tech-show-suite" }), (error) => error.code === "INVENTORY_COUNT_REVIEW_SEPARATION_REQUIRED");
  const reviewed = await reviewSqliteInventoryStockCount(dbPath, count.count.id, { decision:"approved",note:"Physical count evidence checked",reviewedBy:"fm-lead" });
  assert.equal(reviewed.count.status, "approved");

  overview = await readSqliteInventoryOverview(dbPath, { technicianId:"field-tech-show-suite" });
  assert.equal(overview.lots.find((lot) => lot.id === kitLot.id).onHand, 6);
  assert.equal(overview.balances.find((row) => row.sku === "NUT-A").onHand, 6);
  const health = await readSqliteInventoryHealth(dbPath);
  assert.equal(health.relationshipIntegrity.invalidBalances, 0);
  assert.equal(health.relationshipIntegrity.invalidLotBalances, 0);
  assert.equal(health.counts.stockCounts, 1);
  console.log(JSON.stringify({ status:"passed",expiredReceiptBlocked:true,receiptLot:receipt.lot.lotCode,transferLot:transfer.transactions[0].metadata.traceability.allocations[0].lotCode,remaining:6,countStatus:reviewed.count.status,health:health.relationshipIntegrity }));
} finally {
  await rm(root, { recursive:true, force:true });
}
