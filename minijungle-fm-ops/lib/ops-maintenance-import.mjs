import { createHash } from "node:crypto";

const headerAliases = {
  recordId: ["record_id", "record id", "airtable_record_id", "airtable id", "id"],
  wallId: ["wall_id", "wall id", "asset_id", "asset id", "module wall id"],
  serviceDate: ["service_date", "service date", "maintenance_date", "maintenance date", "date"],
  status: ["status", "maintenance_status", "maintenance status"],
  priority: ["priority"],
  technicianId: ["technician_id", "technician id", "technician", "assigned_to", "assigned to"],
  tasks: ["tasks", "work_done", "work done", "maintenance_items", "maintenance items"],
  notes: ["notes", "note", "service_note", "service note"],
  sourceUpdatedAt: ["updated_at", "updated at", "last_modified", "last modified"]
};

function normalizedHeader(value) {
  return String(value || "").replace(/^\uFEFF/, "").trim().toLowerCase().replace(/\s+/g, " ");
}

function parseCsvRows(csv) {
  const text = String(csv || "");
  if (!text.trim()) throw new Error("CSV content is required");
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') { field += '"'; index += 1; }
      else if (char === '"') quoted = false;
      else field += char;
      continue;
    }
    if (char === '"') quoted = true;
    else if (char === ",") { row.push(field); field = ""; }
    else if (char === "\n") { row.push(field.replace(/\r$/, "")); rows.push(row); row = []; field = ""; }
    else field += char;
  }
  if (quoted) throw new Error("CSV contains an unclosed quoted field");
  row.push(field.replace(/\r$/, ""));
  if (row.some((value) => value !== "") || rows.length === 0) rows.push(row);
  return rows.filter((values) => values.some((value) => String(value).trim()));
}

function resolveColumns(headers) {
  const normalized = headers.map(normalizedHeader);
  const columns = {};
  for (const [field, aliases] of Object.entries(headerAliases)) {
    columns[field] = normalized.findIndex((header) => aliases.includes(header));
  }
  return columns;
}

function valueAt(row, index) { return index >= 0 ? String(row[index] || "").trim() : ""; }
function validDate(value) { const timestamp = Date.parse(value); return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null; }
function stableWorkOrderId(recordId) {
  const readable = String(recordId).replace(/[^A-Za-z0-9_-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 42) || "record";
  const suffix = createHash("sha256").update(String(recordId)).digest("hex").slice(0, 8);
  return `AIR-${readable}-${suffix}`;
}
function normalizedStatus(value) {
  const key = String(value || "scheduled").trim().toLowerCase().replace(/[ _-]+/g, " ");
  if (["complete", "completed", "done", "closed"].includes(key)) return "Completed";
  if (["in progress", "working", "started"].includes(key)) return "In Progress";
  if (["cancelled", "canceled", "void"].includes(key)) return "Cancelled";
  if (["scheduled", "open", "planned", "pending"].includes(key)) return "Scheduled";
  return null;
}
function normalizedPriority(value) {
  const key = String(value || "medium").trim().toLowerCase();
  return ["critical", "high", "medium", "low"].includes(key) ? key : null;
}

export function maintenanceImportTemplateCsv() {
  return "record_id,wall_id,service_date,status,priority,technician_id,tasks,notes,updated_at\nrecExample001,MJ-HK-021,2026-08-29,Completed,medium,field-tech-show-suite,Water check;Photo capture,Example row - replace before import,2026-08-29T09:00:00+08:00\n";
}

export function normalizeMaintenanceCsv(csv, { knownWallIds = [] } = {}) {
  const parsed = parseCsvRows(csv);
  if (parsed.length < 2) throw new Error("CSV must include a header and at least one maintenance row");
  if (parsed.length > 1001) throw new Error("CSV import is limited to 1,000 maintenance rows per batch");
  const columns = resolveColumns(parsed[0]);
  const missingColumns = ["recordId", "wallId", "serviceDate"].filter((field) => columns[field] < 0);
  if (missingColumns.length) throw new Error(`CSV is missing required columns: ${missingColumns.join(", ")}`);
  const knownWalls = new Set(knownWallIds.map(String));
  const seenRecordIds = new Set();
  const rows = [];
  const errors = [];
  for (let index = 1; index < parsed.length; index += 1) {
    const sourceRow = parsed[index];
    const rowNumber = index + 1;
    const recordId = valueAt(sourceRow, columns.recordId);
    const wallId = valueAt(sourceRow, columns.wallId);
    const serviceDateRaw = valueAt(sourceRow, columns.serviceDate);
    const serviceDate = validDate(serviceDateRaw);
    const sourceUpdatedAtRaw = valueAt(sourceRow, columns.sourceUpdatedAt);
    const sourceUpdatedAt = sourceUpdatedAtRaw ? validDate(sourceUpdatedAtRaw) : null;
    const status = normalizedStatus(valueAt(sourceRow, columns.status));
    const priority = normalizedPriority(valueAt(sourceRow, columns.priority));
    const rowErrors = [];
    if (!recordId) rowErrors.push("record_id is required");
    if (recordId && seenRecordIds.has(recordId)) rowErrors.push("record_id is duplicated in this file");
    if (!wallId) rowErrors.push("wall_id is required");
    else if (knownWalls.size && !knownWalls.has(wallId)) rowErrors.push("wall_id does not exist in DR FOREST master data");
    if (!serviceDate) rowErrors.push("service_date must be a valid date");
    if (!status) rowErrors.push("status is not supported");
    if (!priority) rowErrors.push("priority must be critical, high, medium or low");
    if (sourceUpdatedAtRaw && !sourceUpdatedAt) rowErrors.push("updated_at must be a valid date-time when provided");
    if (recordId) seenRecordIds.add(recordId);
    if (rowErrors.length) {
      errors.push({ rowNumber, recordId: recordId || null, messages: rowErrors });
      continue;
    }
    const taskValues = valueAt(sourceRow, columns.tasks).split(/[;|\n]/).map((item) => item.trim()).filter(Boolean).slice(0, 30);
    rows.push({
      rowNumber,
      sourceRecordId: recordId,
      workOrder: {
        id: stableWorkOrderId(recordId),
        wallId,
        type: "Maintenance",
        due: serviceDate,
        status,
        priority,
        tasks: taskValues,
        externalSource: "airtable-csv",
        externalRecordId: recordId,
        technicianId: valueAt(sourceRow, columns.technicianId) || null,
        serviceNote: valueAt(sourceRow, columns.notes) || null,
        sourceUpdatedAt
      }
    });
  }
  const checksum = createHash("sha256").update(String(csv), "utf8").digest("hex");
  return { checksum, totalRows: parsed.length - 1, validRows: rows.length, invalidRows: errors.length, rows, errors };
}
