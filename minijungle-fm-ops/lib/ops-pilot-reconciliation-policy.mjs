const statusSet = new Set(["ready", "attention", "awaiting-data"]);

function count(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? Math.floor(number) : 0;
}

function list(value) {
  return Array.isArray(value) ? value : [];
}

function checkState({ ready, attention, hasData }) {
  if (ready) return "ready";
  if (attention || hasData) return "attention";
  return "awaiting-data";
}

function check(key, label, state, countValue, detail, next) {
  const normalizedState = statusSet.has(state) ? state : "awaiting-data";
  return { key, label, state: normalizedState, count: count(countValue), detail, next };
}

export function buildPilotReconciliation({
  quality = {},
  fieldCycles = [],
  captures = [],
  esgLedger = {},
  evidenceSnapshots = [],
  scope = "all"
} = {}) {
  const qualitySummary = quality.summary || {};
  const moduleTotal = count(qualitySummary.modules);
  const moduleReady = count(qualitySummary.moduleReady);
  const telemetryAny = count(qualitySummary.telemetryAny);
  const telemetryComplete = count(qualitySummary.telemetryComplete);
  const telemetryFresh = count(qualitySummary.telemetryFresh);
  const cameraFresh = count(qualitySummary.cameraFresh);
  const cycles = list(fieldCycles);
  const completedCycles = cycles.filter((cycle) => cycle.status === "completed");
  const exceptionCycles = cycles.filter((cycle) => cycle.status === "exception");
  const cyclesWithProof = cycles.filter((cycle) => list(cycle.proofRefs).length > 0);
  const captureBatches = list(captures);
  const syncedCaptures = captureBatches.filter((batch) => batch.syncStatus === "synced");
  const capturePhotos = syncedCaptures.filter((batch) => list(batch.items).some((item) => item.type === "photo"));
  const captureExceptions = syncedCaptures.filter((batch) => list(batch.items).some((item) => item.type === "exception"));
  const snapshots = list(evidenceSnapshots);
  const verifiedSnapshots = snapshots.filter((snapshot) => snapshot.verificationStatus === "verified");
  const esgObservations = count(esgLedger.counts?.observations);
  const esgGaps = list(esgLedger.gaps);
  const openSensorAlerts = count(qualitySummary.openSensorAlerts);
  const queuedAiDiagnoses = count(qualitySummary.queuedAiDiagnoses);
  const openIncidents = count(qualitySummary.openIncidents);
  const openRemediation = count(qualitySummary.openRemediationTasks);
  const activeExceptions = count(qualitySummary.activeExceptions);
  const hasOperationalData = moduleTotal > 0 || cycles.length > 0 || captureBatches.length > 0 || esgObservations > 0 || snapshots.length > 0;

  const checks = [
    check(
      "module-master",
      "Module master data",
      checkState({ ready: moduleTotal > 0, hasData: moduleTotal > 0 }),
      moduleTotal,
      `${moduleTotal} module record${moduleTotal === 1 ? "" : "s"} in the current scope · ${moduleReady} currently ready on stored quality signals.`,
      "Confirm the pilot module IDs and client/site relationships in Admin."
    ),
    check(
      "field-cycles",
      "Field-service cycles",
      checkState({ ready: completedCycles.length > 0 && exceptionCycles.length === 0, attention: exceptionCycles.length > 0, hasData: cycles.length > 0 }),
      cycles.length,
      `${completedCycles.length} completed · ${exceptionCycles.length} exception${exceptionCycles.length === 1 ? "" : "s"} · ${cyclesWithProof.length} with proof references.`,
      "Import or review the next Airtable field-service export."
    ),
    check(
      "field-evidence",
      "Technician evidence",
      checkState({ ready: syncedCaptures.length > 0 && capturePhotos.length === syncedCaptures.length, attention: syncedCaptures.length > 0 && capturePhotos.length < syncedCaptures.length, hasData: captureBatches.length > 0 }),
      syncedCaptures.length,
      `${syncedCaptures.length} synced capture batch${syncedCaptures.length === 1 ? "" : "es"} · ${capturePhotos.length} with photos · ${captureExceptions.length} with exception notes.`,
      "Complete the technician visit and sync its photo and service items."
    ),
    check(
      "device-signals",
      "Sensor and camera signals",
      checkState({ ready: moduleTotal > 0 && telemetryFresh === moduleTotal && cameraFresh === moduleTotal, attention: telemetryAny > 0 || cameraFresh > 0, hasData: moduleTotal > 0 }),
      telemetryFresh + cameraFresh,
      `${telemetryFresh}/${moduleTotal} modules have all four metrics fresh · ${cameraFresh}/${moduleTotal} cameras are fresh. Stored configuration is not physical connectivity proof.`,
      "When hardware is installed, send signed readings and camera heartbeats for the pilot modules."
    ),
    check(
      "exceptions",
      "Exceptions and remediation",
      checkState({ ready: activeExceptions === 0 && openRemediation === 0, attention: activeExceptions > 0 || openRemediation > 0, hasData: moduleTotal > 0 }),
      activeExceptions + openRemediation,
      `${openSensorAlerts} sensor alert${openSensorAlerts === 1 ? "" : "s"} · ${queuedAiDiagnoses} AI review${queuedAiDiagnoses === 1 ? "" : "s"} queued · ${openIncidents} open incident${openIncidents === 1 ? "" : "s"} · ${openRemediation} remediation task${openRemediation === 1 ? "" : "s"}.`,
      "Assign, review and close every active exception with dated evidence."
    ),
    check(
      "esg-baseline",
      "ESG baseline",
      checkState({ ready: esgLedger.status === "complete", attention: esgLedger.status === "partial" || esgObservations > 0, hasData: esgObservations > 0 }),
      esgObservations,
      `${esgLedger.status || "not generated"} · ${esgObservations} structured ESG observation${esgObservations === 1 ? "" : "s"} · ${esgGaps.length} gap${esgGaps.length === 1 ? "" : "s"}.`,
      "Record the Xponge, pest/disease, intervention, staff-pulse and brand-touchpoint evidence for the period."
    ),
    check(
      "proof-snapshot",
      "Evidence snapshot",
      checkState({ ready: verifiedSnapshots.length > 0, attention: snapshots.length > 0 && verifiedSnapshots.length === 0, hasData: snapshots.length > 0 }),
      snapshots.length,
      `${snapshots.length} persisted snapshot${snapshots.length === 1 ? "" : "s"} · ${verifiedSnapshots.length} independently verified.`,
      "Persist and independently verify a scoped evidence snapshot after the pilot cycle."
    )
  ];

  const readyChecks = checks.filter((item) => item.state === "ready").length;
  const outstandingChecks = checks.length - readyChecks;
  const status = !hasOperationalData ? "awaiting-data" : checks.some((item) => item.state !== "ready") ? "attention" : "ready";
  const next = checks.find((item) => item.state !== "ready") || null;

  return {
    generatedAt: new Date().toISOString(),
    scope,
    mode: "pilot-reconciliation",
    status,
    claimBoundary: "Pilot closeout control only. It does not certify production readiness, physical installation, ESG assurance or customer acceptance.",
    summary: {
      modules: moduleTotal,
      modulesReady: moduleReady,
      modulesWithAnyTelemetry: telemetryAny,
      modulesWithCompleteTelemetry: telemetryComplete,
      modulesWithFreshTelemetry: telemetryFresh,
      modulesWithFreshCamera: cameraFresh,
      fieldCycles: cycles.length,
      completedFieldCycles: completedCycles.length,
      exceptionFieldCycles: exceptionCycles.length,
      fieldCyclesWithProof: cyclesWithProof.length,
      captureBatches: captureBatches.length,
      syncedCaptureBatches: syncedCaptures.length,
      captureBatchesWithPhotos: capturePhotos.length,
      openSensorAlerts,
      queuedAiDiagnoses,
      openIncidents,
      openRemediation,
      esgObservations,
      esgLedgerStatus: esgLedger.status || "not-generated",
      esgGaps: esgGaps.length,
      persistedEvidenceSnapshots: snapshots.length,
      verifiedEvidenceSnapshots: verifiedSnapshots.length,
      readyChecks,
      totalChecks: checks.length,
      outstandingChecks
    },
    checks,
    nextAction: next ? { key: next.key, label: next.label, detail: next.next } : null
  };
}
