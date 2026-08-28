import { randomUUID } from "node:crypto";

export const inventoryMigrationVersion = "2026-09-01.inventory-route-kit-v1";
export const postgresInventoryMigrationVersion = "2026-09-01.postgres-inventory-route-kit-v1";

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
    occurredAt: input?.occurredAt ? new Date(input.occurredAt).toISOString() : new Date().toISOString()
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
