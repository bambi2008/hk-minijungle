export const productionAcceptanceVersion = "2026-08-29.external-production-acceptance-v1";

function statusOf(value) { return String(value?.status || "blocked"); }

export function buildProductionAcceptanceReport({ preflight = null, oidc = null, identity = null, device = null, backup = null, fieldData = null, generatedAt = new Date().toISOString() } = {}) {
  const gates = [
    { id: "postgres", label: "Managed PostgreSQL", status: preflight?.status === "ready" ? "verified" : "blocked", detail: preflight?.status === "ready" ? "Production preflight observed the configured PostgreSQL runtime and required schema." : "Run production preflight against the managed PostgreSQL-backed service." },
    { id: "identity", label: "OIDC identity", status: statusOf(oidc) === "verified" && statusOf(identity) === "verified" ? "verified" : "blocked", detail: statusOf(oidc) === "verified" && statusOf(identity) === "verified" ? "OIDC discovery, JWKS, authenticated service access and role/client-scope matrix passed." : "Provider discovery, one authenticated request and a real role/client-scope token matrix are still required." },
    { id: "device", label: "Real devices and camera", status: statusOf(device) === "verified" ? "verified" : "blocked", detail: device?.status === "verified" ? "Signed reading and camera probes have both returned successful production responses." : "A real registered device must send a signed reading and camera capture with readback evidence." },
    { id: "backup", label: "Off-host backup and restore", status: statusOf(backup) === "verified" ? "verified" : "blocked", detail: backup?.status === "verified" ? "Encrypted archive and isolated restore evidence passed the acceptance contract." : "A dated encrypted off-host backup and isolated restore report are still required." },
    { id: "field-data", label: "Customer field operations", status: statusOf(fieldData) === "verified" ? "verified" : "blocked", detail: fieldData?.status === "verified" ? "Validated evidence contains repeated completed cycles for at least two client accounts." : "Import real field-cycle records with proof references and repeated service history for at least two clients." }
  ];
  const verified = gates.filter((item) => item.status === "verified").length;
  return {
    version: productionAcceptanceVersion,
    generatedAt,
    status: verified === gates.length ? "candidate" : "blocked",
    gates,
    summary: { verified, total: gates.length, blocked: gates.length - verified },
    officialProductionScore: "65%",
    scorePolicy: "This report only measures external acceptance gates. It never changes the official score without independent review of dated external evidence and repeated operations."
  };
}
