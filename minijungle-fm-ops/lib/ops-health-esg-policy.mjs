export const operationalHealthMethodVersion = "2026-08-29.operational-health-esg-v1";
export const healthScoreSnapshotType = "operational-health";
export const esgLedgerMigrationVersion = "2026-08-29.esg-operational-ledger-v1";
export const postgresEsgLedgerMigrationVersion = "2026-08-29.postgres-esg-operational-ledger-v1";

export const esgObservationCategories = [
  { key: "xponge", label: "Xponge root-zone check", group: "environment" },
  { key: "pest-disease", label: "Pest / disease observation", group: "environment" },
  { key: "chemical-intervention", label: "Chemical intervention", group: "environment" },
  { key: "staff-pulse", label: "Staff / visitor pulse", group: "social" },
  { key: "brand-touchpoint", label: "Green brand touchpoint", group: "social" }
];

const categoryKeys = new Set(esgObservationCategories.map((item) => item.key));
const scoreByReadingStatus = { ok: 100, watch: 60, alert: 25, offline: 0 };
const healthWeights = { visual: 45, environment: 25, service: 20, control: 10 };

function text(value) { return String(value ?? "").trim(); }
function finite(value) { const number = Number(value); return Number.isFinite(number) ? number : null; }
function iso(value, field) {
  const date = new Date(value || "");
  if (Number.isNaN(date.getTime())) throw new Error(`${field} must be a valid ISO date`);
  return date.toISOString();
}
function inWindow(value, start, end) {
  const time = Date.parse(value || "");
  return Number.isFinite(time) && time >= Date.parse(start) && time <= Date.parse(end);
}
function statusBand(score) {
  if (score === null) return "no-data";
  if (score >= 90) return "healthy";
  if (score >= 80) return "watch";
  if (score >= 70) return "recovery";
  return "critical";
}
function factor(key, value, evidenceRefs, detail, available = value !== null) {
  return { key, weight: healthWeights[key], value, available, evidenceRefs: [...new Set(evidenceRefs.filter(Boolean))], detail };
}

function latestVisualScores(wallId, modules, captures) {
  const moduleIds = new Set(modules.map((module) => module.id));
  const moduleValues = new Map();
  let wallValue = null;
  let wallEvidence = null;
  const ordered = captures
    .filter((batch) => batch.wallId === wallId)
    .sort((left, right) => Date.parse(right.capturedAt || "") - Date.parse(left.capturedAt || ""));
  for (const batch of ordered) {
    const healthItem = (batch.items || []).find((item) => item.type === "health-check" && finite(item.value) !== null);
    if (!healthItem) continue;
    const value = Math.max(0, Math.min(100, finite(healthItem.value)));
    if (batch.moduleId && moduleIds.has(batch.moduleId) && !moduleValues.has(batch.moduleId)) moduleValues.set(batch.moduleId, { value, evidence: batch.id });
    if (!batch.moduleId && wallValue === null) { wallValue = value; wallEvidence = batch.id; }
  }
  if (!moduleValues.size && wallValue !== null) return { value: wallValue, evidenceRefs: [wallEvidence], detail: "Latest whole-wall technician health check." };
  if (!moduleValues.size) return { value: null, evidenceRefs: [], detail: "No numeric technician health check is recorded." };
  const values = [...moduleValues.values()];
  return { value: Math.round(values.reduce((sum, item) => sum + item.value, 0) / values.length), evidenceRefs: values.map((item) => item.evidence), detail: `${values.length} module-level technician health check${values.length === 1 ? "" : "s"}.` };
}

function environmentScore(modules) {
  const moduleScores = modules.map((module) => {
    const readings = (module.latestReadings || []).filter((reading) => scoreByReadingStatus[reading.status] !== undefined);
    if (!readings.length) return null;
    return { value: Math.round(readings.reduce((sum, reading) => sum + scoreByReadingStatus[reading.status], 0) / readings.length), evidence: readings.map((reading) => reading.id) };
  }).filter(Boolean);
  if (!moduleScores.length) return { value: null, evidenceRefs: [], detail: "No module telemetry is recorded." };
  const evidenceRefs = moduleScores.flatMap((item) => item.evidence);
  return { value: Math.round(moduleScores.reduce((sum, item) => sum + item.value, 0) / moduleScores.length), evidenceRefs, detail: `${moduleScores.length}/${modules.length} modules have current telemetry status.` };
}

export function buildOperationalHealthReport({ walls = [], modules = [], captures = [], alerts = [], diagnoses = [], now = new Date().toISOString() } = {}) {
  const assets = walls.map((wall) => {
    const wallModules = modules.filter((module) => module.assetId === wall.id && module.status !== "retired");
    const wallCaptures = captures.filter((batch) => batch.wallId === wall.id);
    const wallAlerts = alerts.filter((alert) => alert.wallId === wall.id && ["open", "acknowledged"].includes(alert.status));
    const wallDiagnoses = diagnoses.filter((diagnosis) => diagnosis.wallId === wall.id && ["queued", "running"].includes(diagnosis.status));
    const visual = latestVisualScores(wall.id, wallModules, wallCaptures);
    const environment = environmentScore(wallModules);
    const exceptionCount = wallCaptures.reduce((sum, batch) => sum + (batch.items || []).filter((item) => item.type === "exception").length, 0);
    const service = wallCaptures.length ? { value: Math.max(0, 100 - Math.min(70, Math.round((exceptionCount / wallCaptures.length) * 70))), evidenceRefs: wallCaptures.map((batch) => batch.id), detail: `${wallCaptures.length} technician capture batch${wallCaptures.length === 1 ? "" : "es"}; ${exceptionCount} exception item${exceptionCount === 1 ? "" : "s"}.` } : { value: null, evidenceRefs: [], detail: "No technician service capture is recorded." };
    const controlPenalty = Math.min(100, wallAlerts.length * 25 + wallDiagnoses.length * 15);
    const control = { value: 100 - controlPenalty, evidenceRefs: [...wallAlerts.map((item) => item.id), ...wallDiagnoses.map((item) => item.id)], detail: `${wallAlerts.length} active sensor alert${wallAlerts.length === 1 ? "" : "s"}; ${wallDiagnoses.length} pending AI review${wallDiagnoses.length === 1 ? "" : "s"}.` };
    const factors = [
      factor("visual", visual.value, visual.evidenceRefs, visual.detail),
      factor("environment", environment.value, environment.evidenceRefs, environment.detail),
      factor("service", service.value, service.evidenceRefs, service.detail),
      factor("control", control.value, control.evidenceRefs, control.detail, true)
    ];
    const availableWeight = factors.filter((item) => item.available).reduce((sum, item) => sum + item.weight, 0);
    const score = availableWeight >= 50 ? Math.round(factors.filter((item) => item.available).reduce((sum, item) => sum + item.value * item.weight, 0) / availableWeight) : null;
    const drivers = factors.filter((item) => item.available && item.value < 80).sort((left, right) => left.value - right.value).map((item) => `${item.key}: ${item.detail}`);
    if (!drivers.length && availableWeight < 50) drivers.push("Insufficient evidence: at least 50% of weighted inputs is required before publishing a score.");
    else if (!drivers.length && availableWeight < 100) drivers.push("Score is partial because one or more operational evidence sources are missing.");
    return {
      wallId: wall.id,
      clientId: wall.clientId,
      name: wall.name,
      score,
      band: statusBand(score),
      status: score === null ? "no-data" : availableWeight === 100 ? "measured" : "partial",
      confidence: Number((availableWeight / 100).toFixed(2)),
      factors,
      drivers,
      evidenceRefs: [...new Set(factors.flatMap((item) => item.evidenceRefs))],
      calculatedAt: now
    };
  });
  const scored = assets.filter((asset) => asset.score !== null);
  return {
    generatedAt: now,
    methodVersion: operationalHealthMethodVersion,
    scoreType: healthScoreSnapshotType,
    claimBoundary: "Operational triage score only. It is not a horticultural certification, medical claim or ESG assurance opinion.",
    summary: {
      assets: assets.length,
      modules: modules.length,
      scoredAssets: scored.length,
      noDataAssets: assets.length - scored.length,
      completeScores: assets.filter((asset) => asset.status === "measured").length,
      partialScores: assets.filter((asset) => asset.status === "partial").length,
      averageScore: scored.length ? Math.round(scored.reduce((sum, asset) => sum + asset.score, 0) / scored.length) : null,
      averageConfidence: assets.length ? Number((assets.reduce((sum, asset) => sum + asset.confidence, 0) / assets.length).toFixed(2)) : 0
    },
    assets
  };
}

function metric(key, label, value, unit, status, method, sourceCount, claimLevel = "observed") {
  return { key, label, value, unit: unit || null, status, method, sourceCount, claimLevel };
}
function observationCount(observations, category, start, end) { return observations.filter((item) => item.category === category && inWindow(item.observedAt, start, end)).length; }
function numericItemSum(batches, type, unit) {
  return batches.reduce((sum, batch) => sum + (batch.items || []).filter((item) => item.type === type && String(item.unit || "").toLowerCase() === unit).reduce((inner, item) => inner + (finite(item.value) || 0), 0), 0);
}
function itemCount(batches, type) { return batches.reduce((sum, batch) => sum + (batch.items || []).filter((item) => item.type === type).length, 0); }

export function normalizeEsgPeriod({ periodStart, periodEnd, now = new Date() } = {}) {
  const endDefault = new Date(now);
  const startDefault = new Date(endDefault.getTime() - 90 * 86400000);
  const start = iso(periodStart || startDefault.toISOString(), "periodStart");
  const end = iso(periodEnd || endDefault.toISOString(), "periodEnd");
  if (Date.parse(start) > Date.parse(end)) throw new Error("periodStart must be before periodEnd");
  return { periodStart: start, periodEnd: end };
}

export function buildEsgLedger({ scopeKey = "all", clientId = null, periodStart, periodEnd, walls = [], modules = [], captures = [], alerts = [], diagnoses = [], observations = [], healthReport = null, now = new Date().toISOString() } = {}) {
  const period = normalizeEsgPeriod({ periodStart, periodEnd, now: new Date(now) });
  const clientWallIds = new Set(walls.filter((wall) => !clientId || wall.clientId === clientId).map((wall) => wall.id));
  const scopedWalls = walls.filter((wall) => clientWallIds.has(wall.id));
  const scopedModules = modules.filter((module) => clientWallIds.has(module.assetId));
  const scopedCaptures = captures.filter((batch) => clientWallIds.has(batch.wallId) && inWindow(batch.capturedAt, period.periodStart, period.periodEnd));
  const scopedAlerts = alerts.filter((item) => clientWallIds.has(item.wallId) && inWindow(item.lastSeenAt || item.observedAt, period.periodStart, period.periodEnd));
  const scopedDiagnoses = diagnoses.filter((item) => clientWallIds.has(item.wallId) && inWindow(item.updatedAt || item.createdAt, period.periodStart, period.periodEnd));
  const scopedObservations = observations.filter((item) => (!clientId || item.clientId === clientId) && inWindow(item.observedAt, period.periodStart, period.periodEnd));
  const numericWater = numericItemSum(scopedCaptures, "water", "l");
  const numericNutrient = numericItemSum(scopedCaptures, "nutrient", "ml");
  const greenArea = scopedWalls.reduce((sum, wall) => sum + (finite(wall.greenArea) || 0), 0);
  const staffReach = scopedWalls.reduce((sum, wall) => sum + (finite(wall.staffReach) || 0), 0);
  const waterSavedEstimate = scopedWalls.every((wall) => finite(wall.waterSaved) !== null) ? scopedWalls.reduce((sum, wall) => sum + (finite(wall.waterSaved) || 0), 0) : null;
  const numericHealthValues = scopedCaptures.flatMap((batch) => (batch.items || []).filter((item) => item.type === "health-check").map((item) => finite(item.value))).filter((value) => value !== null);
  const healthAssets = (healthReport?.assets || []).filter((item) => clientWallIds.has(item.wallId));
  const missing = [];
  if (!scopedCaptures.length) missing.push("No technician service capture in this period.");
  if (!observationCount(scopedObservations, "xponge", period.periodStart, period.periodEnd)) missing.push("Xponge root-zone observations are not recorded for this period.");
  if (!observationCount(scopedObservations, "pest-disease", period.periodStart, period.periodEnd)) missing.push("Pest/disease observations are not recorded for this period.");
  if (!observationCount(scopedObservations, "chemical-intervention", period.periodStart, period.periodEnd)) missing.push("Chemical intervention records are not recorded for this period.");
  if (!observationCount(scopedObservations, "staff-pulse", period.periodStart, period.periodEnd)) missing.push("Staff or visitor pulse is not recorded for this period.");
  if (!observationCount(scopedObservations, "brand-touchpoint", period.periodStart, period.periodEnd)) missing.push("Green brand touchpoint review is not recorded for this period.");
  if (!healthAssets.length || healthAssets.every((item) => item.score === null)) missing.push("No calculated operational health score is available for this scope.");
  const healthScore = healthAssets.filter((item) => item.score !== null).length ? Math.round(healthAssets.filter((item) => item.score !== null).reduce((sum, item) => sum + item.score, 0) / healthAssets.filter((item) => item.score !== null).length) : null;
  return {
    generatedAt: now,
    methodVersion: esgLedgerMigrationVersion,
    scopeKey,
    clientId,
    period,
    status: missing.length ? "partial" : "complete",
    claimBoundary: "Supplier operational evidence for client reporting review. It is not an official ESG certificate, carbon inventory or independent assurance opinion.",
    metrics: [
      metric("green-area", "Live green area", greenArea ? Number(greenArea.toFixed(2)) : 0, "m2", scopedWalls.length ? "master-data" : "missing", "Sum of greenArea on scoped asset records; verify against site measurement.", scopedWalls.length, "asset-fact"),
      metric("service-visits", "Technician service visits", scopedCaptures.length, "batches", scopedCaptures.length ? "observed" : "missing", "Count of synced mobile capture batches in period.", scopedCaptures.length),
      metric("proof-photos", "Proof photos", itemCount(scopedCaptures, "photo"), "photos", itemCount(scopedCaptures, "photo") ? "observed" : "missing", "Count of typed photo items in synced mobile captures.", itemCount(scopedCaptures, "photo")),
      metric("water-added", "Water added", Number(numericWater.toFixed(2)), "L", scopedCaptures.length ? "observed" : "missing", "Sum of mobile water items explicitly recorded in litres; not water saved.", itemCount(scopedCaptures, "water")),
      metric("nutrient-added", "Nutrient added", Number(numericNutrient.toFixed(2)), "ml", scopedCaptures.length ? "observed" : "missing", "Sum of mobile nutrient items explicitly recorded in millilitres.", itemCount(scopedCaptures, "nutrient")),
      metric("visual-health", "Average visual health", numericHealthValues.length ? Math.round(numericHealthValues.reduce((sum, value) => sum + value, 0) / numericHealthValues.length) : null, "score", numericHealthValues.length ? "observed" : "missing", "Average numeric technician health-check items in period.", numericHealthValues.length),
      metric("health-score", "Operational health score", healthScore, "score", healthScore === null ? "missing" : "observed", "Weighted visual, environment, service and exception-control score; see health endpoint for factors.", healthAssets.length),
      metric("pest-disease", "Pest / disease observations", observationCount(scopedObservations, "pest-disease", period.periodStart, period.periodEnd), "records", observationCount(scopedObservations, "pest-disease", period.periodStart, period.periodEnd) ? "observed" : "missing", "Structured FM observation records; absence of a record is not proof of absence.", observationCount(scopedObservations, "pest-disease", period.periodStart, period.periodEnd)),
      metric("chemical-intervention", "Chemical interventions", observationCount(scopedObservations, "chemical-intervention", period.periodStart, period.periodEnd), "records", observationCount(scopedObservations, "chemical-intervention", period.periodStart, period.periodEnd) ? "observed" : "missing", "Structured intervention records; no reduction claim is calculated without a baseline.", observationCount(scopedObservations, "chemical-intervention", period.periodStart, period.periodEnd)),
      metric("xponge", "Xponge root-zone checks", observationCount(scopedObservations, "xponge", period.periodStart, period.periodEnd), "records", observationCount(scopedObservations, "xponge", period.periodStart, period.periodEnd) ? "observed" : "missing", "Structured substrate and root-zone observations.", observationCount(scopedObservations, "xponge", period.periodStart, period.periodEnd)),
      metric("staff-pulse", "Staff / visitor pulse", observationCount(scopedObservations, "staff-pulse", period.periodStart, period.periodEnd), "records", observationCount(scopedObservations, "staff-pulse", period.periodStart, period.periodEnd) ? "observed" : "missing", "Structured pulse records; does not prove productivity improvement.", observationCount(scopedObservations, "staff-pulse", period.periodStart, period.periodEnd)),
      metric("brand-touchpoint", "Green brand touchpoints", observationCount(scopedObservations, "brand-touchpoint", period.periodStart, period.periodEnd), "records", observationCount(scopedObservations, "brand-touchpoint", period.periodStart, period.periodEnd) ? "observed" : "missing", "Structured client-approved brand/site observations; does not prove revenue impact.", observationCount(scopedObservations, "brand-touchpoint", period.periodStart, period.periodEnd)),
      metric("staff-reach", "Configured staff / visitor reach", staffReach || 0, "touchpoints", scopedWalls.length ? "master-data" : "missing", "Sum of asset master-data staffReach; validate the counting method with the client.", scopedWalls.length, "asset-fact"),
      metric("water-saved-estimate", "Water saved estimate", waterSavedEstimate, "L/mo", waterSavedEstimate === null ? "missing" : "estimated", "Legacy asset estimate only; not measured in this period and excluded from observed totals.", scopedWalls.length, "estimate")
    ],
    sources: [
      { type: "asset-master-data", count: scopedWalls.length, status: scopedWalls.length ? "available" : "missing" },
      { type: "mobile-capture-batches", count: scopedCaptures.length, status: scopedCaptures.length ? "available" : "missing" },
      { type: "esg-observations", count: scopedObservations.length, status: scopedObservations.length ? "available" : "missing" },
      { type: "telemetry-alerts", count: scopedAlerts.length, status: scopedAlerts.length ? "available" : "no-events" },
      { type: "ai-diagnoses", count: scopedDiagnoses.length, status: scopedDiagnoses.length ? "available" : "no-events" },
      { type: "health-score-assets", count: healthAssets.filter((item) => item.score !== null).length, status: healthAssets.some((item) => item.score !== null) ? "available" : "missing" }
    ],
    counts: { walls: scopedWalls.length, modules: scopedModules.length, captureBatches: scopedCaptures.length, captureItems: scopedCaptures.reduce((sum, batch) => sum + (batch.items || []).length, 0), observations: scopedObservations.length, alerts: scopedAlerts.length, diagnoses: scopedDiagnoses.length },
    gaps: missing,
    evidenceRefs: [...new Set([...scopedCaptures.map((item) => item.id), ...scopedObservations.map((item) => item.id), ...scopedAlerts.map((item) => item.id), ...healthAssets.flatMap((item) => item.evidenceRefs || [])])].slice(0, 200)
  };
}

export function normalizeEsgObservation(input = {}) {
  const category = text(input.category).toLowerCase();
  if (!categoryKeys.has(category)) throw new Error(`observation.category must be one of ${[...categoryKeys].join(", ")}`);
  const clientId = text(input.clientId);
  if (!clientId) throw new Error("observation.clientId is required");
  const observedAt = iso(input.observedAt || new Date().toISOString(), "observation.observedAt");
  const numericValue = input.value === "" || input.value === null || input.value === undefined ? null : finite(input.value);
  if (input.value !== "" && input.value !== null && input.value !== undefined && numericValue === null) throw new Error("observation.value must be numeric when provided");
  const rating = input.rating === "" || input.rating === null || input.rating === undefined ? null : finite(input.rating);
  if (rating !== null && (rating < 0 || rating > 100)) throw new Error("observation.rating must be between 0 and 100");
  const note = text(input.note);
  if (!note) throw new Error("observation.note is required");
  return { id: text(input.id), category, clientId, wallId: text(input.wallId) || null, moduleId: text(input.moduleId) || null, workOrderId: text(input.workOrderId) || null, value: numericValue, unit: text(input.unit) || null, rating, note, evidenceRef: text(input.evidenceRef) || null, observedAt, createdBy: text(input.createdBy) || "system" };
}
