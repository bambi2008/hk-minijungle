import { buildProductionAcceptanceReport } from "../lib/ops-production-acceptance.mjs";
import { validateFieldCycleEvidence } from "../lib/ops-field-cycle-evidence.mjs";
import { normalizeFieldCycleCsv } from "../lib/ops-field-cycle-import.mjs";
import { probeOidcProvider } from "../lib/ops-oidc-probe.mjs";
import { evaluateIdentityAcceptance } from "../lib/ops-identity-acceptance.mjs";

function assert(condition, message) { if (!condition) throw new Error(message); }
const blocked = buildProductionAcceptanceReport({ preflight: { status: "blocked" }, oidc: { status: "blocked" }, device: { status: "blocked" }, backup: { status: "blocked" }, fieldData: { status: "blocked" } });
assert(blocked.status === "blocked" && blocked.summary.verified === 0, "External acceptance must fail closed without external evidence");
const oidcBlocked = await probeOidcProvider({});
assert(oidcBlocked.status === "blocked", "OIDC probe must fail closed without provider configuration");
const identityBlocked = evaluateIdentityAcceptance([{ id: "missing-token", passed: false, detail: "token missing" }]);
assert(identityBlocked.status === "blocked", "Identity acceptance must fail closed when the token matrix is incomplete");
const now = new Date();
const cycles = ["client-a", "client-a", "client-b", "client-b"].map((clientId, index) => ({ cycleId: `cycle-${index}`, clientId, workOrderId: `wo-${index}`, moduleId: `module-${index}`, technicianId: `tech-${index}`, serviceAt: new Date(now.getTime() - (index + 1) * 86_400_000).toISOString(), status: "completed", durationMinutes: 45, proofRefs: [`evidence://field-cycle-${index}`], source: "airtable", outcome: "Service completed" }));
const valid = validateFieldCycleEvidence({ cycles }, { now });
assert(valid.status === "verified" && valid.clientCount === 2 && valid.completedCount === 4, "Repeated two-client field evidence should pass the data contract");
const csv = [
  "cycle_id,client_id,work_order_id,module_id,technician_id,service_at,status,duration_minutes,proof_refs,outcome",
  ...cycles.map((item) => [item.cycleId, item.clientId, item.workOrderId, item.moduleId, item.technicianId, item.serviceAt, item.status, item.durationMinutes, item.proofRefs.join(";"), item.outcome].join(",")),
  "broken,client-a,wo-broken,module-broken,tech-broken,not-a-date,completed,30,evidence://broken,Broken row"
].join("\n");
const imported = normalizeFieldCycleCsv(csv);
assert(imported.validRows === 4 && imported.invalidRows === 1 && imported.errors[0].rowNumber === 6, "Airtable field-cycle CSV import did not preserve row-level validation");
const report = buildProductionAcceptanceReport({ preflight: { status: "ready" }, oidc: { status: "verified" }, identity: { status: "verified" }, device: { status: "verified" }, backup: { status: "verified" }, fieldData: valid });
assert(report.status === "candidate" && report.officialProductionScore === "65%", "All gates should produce a candidate without changing the official score");
console.log(JSON.stringify({ ok: true, failClosed: true, repeatedClientEvidence: "verified", candidate: true, officialScore: report.officialProductionScore }, null, 2));
