import { parseCsvRows } from "./ops-maintenance-import.mjs";
import { normalizeFieldCycle, fieldCycleEvidenceVersion } from "./ops-field-cycle-evidence.mjs";

const aliases = {
  cycleId: ["cycle_id", "cycle id", "field_cycle_id", "record_id", "record id", "id"],
  clientId: ["client_id", "client id", "customer_id", "customer id"],
  workOrderId: ["work_order_id", "work order id", "workorder_id"],
  moduleId: ["module_id", "module id", "asset_module_id"],
  technicianId: ["technician_id", "technician id", "technician", "assigned_to", "assigned to"],
  serviceAt: ["service_at", "service at", "service_date", "service date", "completed_at", "completed at"],
  status: ["status", "service_status", "service status"],
  durationMinutes: ["duration_minutes", "duration minutes", "duration", "minutes"],
  proofRefs: ["proof_refs", "proof refs", "proof_ref", "proof ref", "evidence_ref", "evidence ref"],
  outcome: ["outcome", "result", "service_outcome", "service outcome"],
  notes: ["notes", "note", "service_note", "service note"]
};

function header(value) { return String(value || "").replace(/^\uFEFF/, "").trim().toLowerCase().replace(/\s+/g, " "); }
function valueAt(row, index) { return index >= 0 ? String(row[index] || "").trim() : ""; }
function columnsFor(headers) {
  const normalized = headers.map(header);
  return Object.fromEntries(Object.entries(aliases).map(([field, values]) => [field, normalized.findIndex((item) => values.includes(item))]));
}

export function normalizeFieldCycleCsv(csv) {
  const parsed = parseCsvRows(csv);
  if (parsed.length < 2) throw new Error("CSV must include a header and at least one field-cycle row");
  if (parsed.length > 1001) throw new Error("CSV import is limited to 1,000 field-cycle rows per batch");
  const columns = columnsFor(parsed[0]);
  const missingColumns = ["cycleId", "clientId", "workOrderId", "moduleId", "technicianId", "serviceAt", "status", "durationMinutes", "proofRefs"].filter((field) => columns[field] < 0);
  if (missingColumns.length) throw new Error(`CSV is missing required columns: ${missingColumns.join(", ")}`);
  const cycles = [];
  const errors = [];
  const seen = new Set();
  for (let index = 1; index < parsed.length; index += 1) {
    const row = parsed[index];
    const rowNumber = index + 1;
    const proofRefs = valueAt(row, columns.proofRefs).split(/[;|\n]/).map((item) => item.trim()).filter(Boolean);
    const input = {
      cycleId: valueAt(row, columns.cycleId),
      clientId: valueAt(row, columns.clientId),
      workOrderId: valueAt(row, columns.workOrderId),
      moduleId: valueAt(row, columns.moduleId),
      technicianId: valueAt(row, columns.technicianId),
      serviceAt: valueAt(row, columns.serviceAt),
      status: valueAt(row, columns.status),
      durationMinutes: valueAt(row, columns.durationMinutes),
      proofRefs,
      outcome: valueAt(row, columns.outcome),
      notes: valueAt(row, columns.notes),
      source: "airtable"
    };
    try {
      const cycle = normalizeFieldCycle(input, index - 1);
      if (seen.has(cycle.cycleId)) throw new Error("cycleId is duplicated in this file");
      seen.add(cycle.cycleId);
      cycles.push(cycle);
    } catch (error) { errors.push({ rowNumber, messages: [error.message] }); }
  }
  return { version: fieldCycleEvidenceVersion, sourceFormat: "airtable-csv", totalRows: parsed.length - 1, validRows: cycles.length, invalidRows: errors.length, cycles, errors };
}
