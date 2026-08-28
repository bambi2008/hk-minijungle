import { randomUUID } from "node:crypto";

export const inventoryMigrationVersion = "2026-09-01.inventory-route-kit-v1";
export const postgresInventoryMigrationVersion = "2026-09-01.postgres-inventory-route-kit-v1";
export const inventoryTraceabilityMigrationVersion = "2026-09-05.inventory-traceability-v1";
export const postgresInventoryTraceabilityMigrationVersion = "2026-09-05.postgres-inventory-traceability-v1";

export const inventoryLocationKinds = new Set(["warehouse", "technician-kit", "site-buffer"]);
export const inventoryTransactionTypes = new Set(["receipt", "adjustment", "transfer-out", "transfer-in", "consume"]);

export function inventoryError(message, code = "INVENTORY_VALIDATION_ERROR", status = 400) {
  const error = new Error(message);
  error.code = code;
  error.status = status;
  return error;
}

export function text(value, field) {
  const normalized = String(value || "").trim();
  if (!normalized && field) throw inventoryError(`${field} is required`);
  return normalized;
}

export function quantity(value, field = "quantity", { allowZero = false, allowNegative = false } = {}) {
  const number = Number(value);
  if (!Number.isFinite(number) || Math.abs(number) > 1_000_000_000) throw inventoryError(`${field} must be a finite operational quantity`);
  if (!allowNegative && number < 0) throw inventoryError(`${field} cannot be negative`);
  if (!allowZero && number === 0) throw inventoryError(`${field} must be greater than zero`);
  return Math.round(number * 1000) / 1000;
}

export function normalizeInventoryItem(input, existing = null) {
  const now = new Date().toISOString();
  return {
    sku: text(input?.sku || existing?.sku, "sku").toUpperCase(),
    name: text(input?.name || input?.label || existing?.name, "name"),
    category: text(input?.category || existing?.category || "Consumable"),
    unit: text(input?.unit || existing?.unit || "each"),
    reorderPoint: quantity(input?.reorderPoint ?? input?.reorderAt ?? existing?.reorderPoint ?? 0, "reorderPoint", { allowZero: true }),
    targetLevel: quantity(input?.targetLevel ?? input?.reorderQty ?? existing?.targetLevel ?? 0, "targetLevel", { allowZero: true }),
    active: input?.active === undefined ? existing?.active !== false : Boolean(input.active),
    createdAt: existing?.createdAt || now,
    updatedAt: now
  };
}

export function normalizeInventoryLocation(input, existing = null) {
  const now = new Date().toISOString();
  const kind = text(input?.kind || existing?.kind, "kind");
  if (!inventoryLocationKinds.has(kind)) throw inventoryError(`kind must be one of ${[...inventoryLocationKinds].join(", ")}`);
  return {
    id: text(input?.id || existing?.id, "location.id"),
    label: text(input?.label || existing?.label, "location.label"),
    kind,
    technicianId: input?.technicianId ? text(input.technicianId) : existing?.technicianId || null,
    status: text(input?.status || existing?.status || "active"),
    createdAt: existing?.createdAt || now,
    updatedAt: now
  };
}

export function normalizeInventoryMovement(input) {
  const type = text(input?.type, "type");
  if (!new Set(["receipt", "adjustment", "transfer"]).has(type)) throw inventoryError("type must be receipt, adjustment or transfer");
  const amount = quantity(input?.quantity, "quantity", { allowNegative: type === "adjustment" });
  return {
    id: text(input?.id || `INV-${randomUUID()}`),
    type,
    sku: text(input?.sku, "sku").toUpperCase(),
    quantity: amount,
    locationId: input?.locationId ? text(input.locationId) : null,
    sourceLocationId: input?.sourceLocationId ? text(input.sourceLocationId) : null,
    destinationLocationId: input?.destinationLocationId ? text(input.destinationLocationId) : null,
    workOrderId: input?.workOrderId ? text(input.workOrderId) : null,
    note: text(input?.note || "Inventory movement"),
    actor: text(input?.actor || "system"),
    occurredAt: input?.occurredAt ? new Date(input.occurredAt).toISOString() : new Date().toISOString(),
    lotCode: input?.lotCode ? text(input.lotCode).toUpperCase() : null,
    supplier: input?.supplier ? text(input.supplier) : null,
    expiryDate: input?.expiryDate ? normalizeDate(input.expiryDate, "expiryDate") : null
  };
}

export function normalizeReservation(input) {
  return {
    id: text(input?.id || `RES-${randomUUID()}`),
    workOrderId: text(input?.workOrderId, "workOrderId"),
    sku: text(input?.sku, "sku").toUpperCase(),
    sourceLocationId: text(input?.sourceLocationId, "sourceLocationId"),
    technicianId: input?.technicianId ? text(input.technicianId) : null,
    quantity: quantity(input?.quantity),
    actor: text(input?.actor || "system"),
    createdAt: new Date().toISOString()
  };
}

export function normalizeConsumption(input) {
  const items = Array.isArray(input?.items) ? input.items : [];
  if (!items.length) throw inventoryError("items must include at least one consumable");
  const normalized = items.map((item, index) => ({
    sku: text(item?.sku, `items[${index}].sku`).toUpperCase(),
    quantity: quantity(item?.quantity, `items[${index}].quantity`)
  }));
  if (new Set(normalized.map((item) => item.sku)).size !== normalized.length) throw inventoryError("items cannot repeat a SKU");
  return {
    id: text(input?.id || `CON-${randomUUID()}`),
    locationId: text(input?.locationId, "locationId"),
    workOrderId: text(input?.workOrderId, "workOrderId"),
    technicianId: input?.technicianId ? text(input.technicianId) : null,
    captureBatchId: input?.captureBatchId ? text(input.captureBatchId) : null,
    items: normalized,
    note: text(input?.note || "Field consumption"),
    actor: text(input?.actor || "system"),
    occurredAt: input?.occurredAt ? new Date(input.occurredAt).toISOString() : new Date().toISOString()
  };
}

function normalizeDate(value, field) {
  const date = new Date(`${String(value || "").slice(0, 10)}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) throw inventoryError(`${field} must be a valid date`);
  return date.toISOString().slice(0, 10);
}

export function normalizeLotReceipt(input) {
  const receivedDate = normalizeDate(input?.receivedDate || new Date().toISOString(), "receivedDate");
  const expiryDate = normalizeDate(input?.expiryDate, "expiryDate");
  if (expiryDate < receivedDate) throw inventoryError("expiryDate cannot be before receivedDate");
  if (expiryDate < new Date().toISOString().slice(0, 10)) throw inventoryError("expiryDate cannot be in the past", "INVENTORY_LOT_EXPIRED", 409);
  return {
    id: text(input?.id || `LOT-${randomUUID()}`),
    sku: text(input?.sku, "sku").toUpperCase(),
    lotCode: text(input?.lotCode, "lotCode").toUpperCase(),
    supplier: text(input?.supplier, "supplier"),
    locationId: text(input?.locationId, "locationId"),
    quantity: quantity(input?.quantity),
    receivedDate,
    expiryDate,
    note: text(input?.note || "Traceable stock receipt"),
    actor: text(input?.actor || "system"),
    occurredAt: input?.occurredAt ? new Date(input.occurredAt).toISOString() : new Date().toISOString()
  };
}

export function normalizeStockCount(input) {
  const lines = Array.isArray(input?.lines) ? input.lines : [];
  if (!lines.length) throw inventoryError("lines must include at least one counted lot");
  const normalized = lines.map((line, index) => ({
    lotId: text(line?.lotId, `lines[${index}].lotId`),
    countedQuantity: quantity(line?.countedQuantity, `lines[${index}].countedQuantity`, { allowZero: true }),
    reason: line?.reason ? text(line.reason) : null
  }));
  if (new Set(normalized.map((line) => line.lotId)).size !== normalized.length) throw inventoryError("lines cannot repeat a lot");
  return {
    id: text(input?.id || `CNT-${randomUUID()}`),
    locationId: text(input?.locationId, "locationId"),
    lines: normalized,
    note: text(input?.note || "Physical stock count"),
    countedBy: text(input?.countedBy || input?.actor || "system"),
    countedAt: input?.countedAt ? new Date(input.countedAt).toISOString() : new Date().toISOString()
  };
}

export function normalizeStockCountReview(input) {
  const decision = text(input?.decision, "decision");
  if (!new Set(["approved", "rejected"]).has(decision)) throw inventoryError("decision must be approved or rejected");
  return {
    decision,
    note: text(input?.note, "note"),
    reviewedBy: text(input?.reviewedBy || input?.actor || "system"),
    reviewedAt: new Date().toISOString()
  };
}
