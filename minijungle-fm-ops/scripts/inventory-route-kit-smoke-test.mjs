import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { applySqliteInventoryMovement, consumeSqliteInventory, readSqliteInventoryHealth, readSqliteInventoryOverview, reserveSqliteInventory, seedSqliteInventory } from "../lib/ops-inventory-store.mjs";

function assert(condition, message) { if (!condition) throw new Error(message); }

const root = await mkdtemp(join(tmpdir(), "dr-forest-inventory-"));
const dataRoot = join(root, "data");
const dbPath = join(root, "runtime.sqlite");
try {
  await mkdir(dataRoot, { recursive: true });
  await writeFile(join(dataRoot, "supply.json"), JSON.stringify({ items: [
    { sku: "NUT-A", label: "Nutrient A", category: "Consumable", onHand: 12, reorderAt: 6, reorderQty: 12 },
    { sku: "POD-S", label: "Replacement pod", category: "Plant Pod", onHand: 42, reorderAt: 18, reorderQty: 36 }
  ] }), "utf8");
  await seedSqliteInventory(dbPath, dataRoot);
  let overview = await readSqliteInventoryOverview(dbPath);
  assert(overview.balances.find((item) => item.locationId === "warehouse-hk" && item.sku === "NUT-A")?.onHand === 12000, "Pilot nutrient seed should convert bottles to ml");

  const reservation = await reserveSqliteInventory(dbPath, { id: "RES-SMOKE-1", workOrderId: "WO-SMOKE", sku: "NUT-A", sourceLocationId: "warehouse-hk", technicianId: "field-tech-show-suite", quantity: 1000, actor: "smoke" });
  assert(!reservation.duplicate && reservation.reservation.remainingQuantity === 1000, "Reservation should hold warehouse stock");
  const reservationReplay = await reserveSqliteInventory(dbPath, { id: "RES-SMOKE-1", workOrderId: "WO-SMOKE", sku: "NUT-A", sourceLocationId: "warehouse-hk", technicianId: "field-tech-show-suite", quantity: 1000, actor: "smoke" });
  assert(reservationReplay.duplicate, "Reservation replay should be idempotent");

  const transfer = await applySqliteInventoryMovement(dbPath, { id: "INV-SMOKE-TRANSFER", type: "transfer", sourceLocationId: "warehouse-hk", destinationLocationId: "kit-field-tech-show-suite", workOrderId: "WO-SMOKE", sku: "NUT-A", quantity: 1000, actor: "smoke", note: "Load reserved route kit" });
  assert(transfer.transactions.length === 2 && transfer.transactions.some((item) => item.type === "transfer-out") && transfer.transactions.some((item) => item.type === "transfer-in"), "Transfer should create a balanced two-sided ledger entry");
  const transferReplay = await applySqliteInventoryMovement(dbPath, { id: "INV-SMOKE-TRANSFER", type: "transfer", sourceLocationId: "warehouse-hk", destinationLocationId: "kit-field-tech-show-suite", workOrderId: "WO-SMOKE", sku: "NUT-A", quantity: 1000, actor: "smoke", note: "Load reserved route kit" });
  assert(transferReplay.duplicate, "Transfer replay should not move stock twice");

  const consumed = await consumeSqliteInventory(dbPath, { id: "CON-SMOKE", locationId: "kit-field-tech-show-suite", workOrderId: "WO-SMOKE", technicianId: "field-tech-show-suite", captureBatchId: "MCB-SMOKE", items: [{ sku: "NUT-A", quantity: 125 }], actor: "field-tech-show-suite" });
  assert(!consumed.duplicate && consumed.transactions[0].quantity === -125, "Field consumption should post a negative immutable ledger row");
  assert((await consumeSqliteInventory(dbPath, { id: "CON-SMOKE", locationId: "kit-field-tech-show-suite", workOrderId: "WO-SMOKE", technicianId: "field-tech-show-suite", captureBatchId: "MCB-SMOKE", items: [{ sku: "NUT-A", quantity: 125 }], actor: "field-tech-show-suite" })).duplicate, "Capture replay should not consume twice");

  let overdraw = null; try { await consumeSqliteInventory(dbPath, { id: "CON-OVERDRAW", locationId: "kit-field-tech-show-suite", workOrderId: "WO-SMOKE", technicianId: "field-tech-show-suite", items: [{ sku: "NUT-A", quantity: 5000 }] }); } catch (error) { overdraw = error; }
  assert(overdraw?.code === "INVENTORY_INSUFFICIENT_STOCK", "Overdraw should be rejected with an explicit stock code");
  let scopeDenied = null; try { await consumeSqliteInventory(dbPath, { id: "CON-SCOPE", locationId: "kit-field-tech-show-suite", workOrderId: "WO-SMOKE", technicianId: "another-tech", items: [{ sku: "NUT-A", quantity: 1 }] }); } catch (error) { scopeDenied = error; }
  assert(scopeDenied?.code === "INVENTORY_TECHNICIAN_SCOPE_DENIED", "Technician should not consume another route kit");

  overview = await readSqliteInventoryOverview(dbPath);
  const warehouse = overview.balances.find((item) => item.locationId === "warehouse-hk" && item.sku === "NUT-A");
  const kit = overview.balances.find((item) => item.locationId === "kit-field-tech-show-suite" && item.sku === "NUT-A");
  assert(warehouse.onHand === 11000 && warehouse.reserved === 0 && kit.onHand === 875, "Reserve, transfer and consumption should reconcile exactly");
  assert(overview.reservations.find((item) => item.id === "RES-SMOKE-1")?.status === "consumed", "Loading reserved stock should close the reservation");
  const health = await readSqliteInventoryHealth(dbPath);
  assert(health.relationshipIntegrity.invalidBalances === 0 && health.counts.transactions === 3, "Inventory health should report valid balances and three ledger rows");
  console.log(JSON.stringify({ ok: true, warehouse, kit, health }, null, 2));
} finally {
  await rm(root, { recursive: true, force: true });
}
