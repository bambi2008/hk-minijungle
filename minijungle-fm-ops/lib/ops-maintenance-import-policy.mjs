export const maintenanceImportPolicyVersion = "2026-08-29.maintenance-import-freshness-v1";

function timestamp(value) {
  const result = Date.parse(String(value || ""));
  return Number.isFinite(result) ? result : null;
}

export function findStaleMaintenanceImportRows(incomingRows, existingWorkOrders) {
  const existingById = new Map((existingWorkOrders || []).map((order) => [String(order?.id || ""), order]));
  return (incomingRows || []).flatMap((row, index) => {
    const incoming = row?.workOrder;
    const existing = existingById.get(String(incoming?.id || ""));
    const incomingTime = timestamp(incoming?.sourceUpdatedAt);
    const existingTime = timestamp(existing?.sourceUpdatedAt);
    if (!incoming || !existing || incomingTime === null || existingTime === null || incomingTime >= existingTime) return [];
    return [{
      rowNumber: Number(row.rowNumber || index + 2),
      recordId: row.sourceRecordId || incoming.externalRecordId || null,
      workOrderId: incoming.id,
      incomingSourceUpdatedAt: incoming.sourceUpdatedAt,
      existingSourceUpdatedAt: existing.sourceUpdatedAt,
      message: `source version is older than the existing work order (${incoming.sourceUpdatedAt} < ${existing.sourceUpdatedAt})`
    }];
  });
}
