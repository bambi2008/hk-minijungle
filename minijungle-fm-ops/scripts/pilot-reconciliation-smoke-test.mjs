import { buildPilotReconciliation } from "../lib/ops-pilot-reconciliation-policy.mjs";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function cleanQuality() {
  return {
    summary: {
      modules: 3,
      moduleReady: 3,
      telemetryAny: 3,
      telemetryComplete: 3,
      telemetryFresh: 3,
      cameraFresh: 3,
      openSensorAlerts: 0,
      queuedAiDiagnoses: 0,
      openIncidents: 0,
      openRemediationTasks: 0,
      activeExceptions: 0
    }
  };
}

const empty = buildPilotReconciliation();
assert(empty.status === "awaiting-data", "Empty reconciliation must await data");
assert(empty.checks.length === 7, "Reconciliation must expose seven checks");
assert(empty.nextAction?.key === "module-master", "Empty reconciliation must point to module master data first");
assert(empty.claimBoundary.includes("does not certify production"), "Reconciliation must keep the production claim boundary");

const attention = buildPilotReconciliation({
  quality: { summary: { ...cleanQuality().summary, moduleReady: 0, telemetryAny: 1, telemetryComplete: 1, telemetryFresh: 0, cameraFresh: 0, openSensorAlerts: 1, queuedAiDiagnoses: 1, openRemediationTasks: 1, activeExceptions: 2 } },
  fieldCycles: [
    { cycleId: "C-1", status: "completed", proofRefs: ["CAP-1"] },
    { cycleId: "C-2", status: "exception", proofRefs: [] }
  ],
  captures: [{ id: "CAP-1", syncStatus: "synced", items: [{ type: "photo" }] }],
  esgLedger: { status: "partial", counts: { observations: 2 }, gaps: ["Missing staff pulse"] },
  evidenceSnapshots: [{ snapshotId: "EVP-1", verificationStatus: "pending" }],
  scope: "client-scoped"
});
assert(attention.status === "attention", "Incomplete reconciliation must require attention");
assert(attention.summary.exceptionFieldCycles === 1, "Exception cycles must be counted");
assert(attention.summary.syncedCaptureBatches === 1, "Synced captures must be counted");
assert(attention.summary.verifiedEvidenceSnapshots === 0, "Pending snapshots must not count as verified");
assert(attention.checks.find((item) => item.key === "device-signals")?.state === "attention", "Partial device signals must require attention");

const ready = buildPilotReconciliation({
  quality: cleanQuality(),
  fieldCycles: [{ cycleId: "C-READY", status: "completed", proofRefs: ["CAP-READY"] }],
  captures: [{ id: "CAP-READY", syncStatus: "synced", items: [{ type: "photo" }] }],
  esgLedger: { status: "complete", counts: { observations: 5 }, gaps: [] },
  evidenceSnapshots: [{ snapshotId: "EVP-READY", verificationStatus: "verified" }]
});
assert(ready.status === "ready", "Complete reconciliation fixture must be a closeout candidate");
assert(ready.summary.readyChecks === ready.summary.totalChecks, "Ready fixture must have every check ready");
assert(ready.nextAction === null, "Ready fixture must not expose a next blocking action");

console.log("Pilot reconciliation smoke test passed");
