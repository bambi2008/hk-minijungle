import { flattenPathologyLibrary, pathologyLibrary } from "./pathology-library.mjs";

const cropIdentityTraits = {
  tomato: ["serrated compound leaves", "hairy stem", "flower truss"],
  basil: ["opposite oval leaves", "soft square stem", "fresh herb canopy"],
  rosemary: ["needle-like leaves", "woody sprig", "upright narrow foliage"],
  strawberry: ["trifoliate leaves", "visible crown", "white flower or runner"],
  pepper: ["smooth oval leaves", "white pepper flower", "young pepper node"]
};

const photoDefaults = {
  plant: { width: 1280, height: 960, greenRatio: 0.46, yellowRatio: 0.08, darkRatio: 0.1 },
  leaf: { width: 1200, height: 900, greenRatio: 0.42, yellowRatio: 0.18, darkRatio: 0.12 },
  root: { width: 1100, height: 820, greenRatio: 0.28, yellowRatio: 0.12, darkRatio: 0.22 },
  flower: { width: 1000, height: 850, greenRatio: 0.34, yellowRatio: 0.16, darkRatio: 0.08 },
  pest: { width: 1000, height: 850, greenRatio: 0.38, yellowRatio: 0.12, darkRatio: 0.16 }
};

function first(value, fallback = "unknown") {
  return Array.isArray(value) && value.length ? value[0] : fallback;
}

function stateFromCondition(condition, photoType) {
  const environment = condition.match?.environment || {};
  return {
    crop: condition.cropKey,
    stage: first(condition.match?.stage, condition.stage || "vegetative"),
    concern: first(condition.match?.concern, "unknown"),
    symptoms: condition.match?.symptoms || [],
    visuals: condition.match?.visuals || [],
    photoType,
    light: first(environment.light, "ok"),
    moisture: first(environment.moisture, "ok"),
    climate: first(environment.climate, "stable"),
    medium: first(environment.medium, "xponge"),
    growDevice: first(environment.growDevice, "xponge-diy"),
    temperature: environment.temperatureHigh !== undefined
      ? String(Number(environment.temperatureHigh) + 2)
      : environment.temperatureLow !== undefined
        ? String(Number(environment.temperatureLow) - 2)
        : "",
    lightHours: environment.lightHoursMax !== undefined ? String(Math.max(1, Number(environment.lightHoursMax) - 1)) : "",
    sensorMoisture: environment.sensorMoistureHigh !== undefined
      ? String(Number(environment.sensorMoistureHigh) + 5)
      : environment.sensorMoistureLow !== undefined
        ? String(Math.max(0, Number(environment.sensorMoistureLow) - 5))
        : "",
    ec: environment.ecHigh !== undefined
      ? String(Number(environment.ecHigh) + 0.2)
      : environment.ecLow !== undefined
        ? String(Math.max(0, Number(environment.ecLow) - 0.2))
        : "",
    ph: environment.phHigh !== undefined
      ? String(Number(environment.phHigh) + 0.2)
      : environment.phLow !== undefined
        ? String(Math.max(0, Number(environment.phLow) - 0.2))
        : ""
  };
}

function fixtureSignals(condition, photoType, variant) {
  const base = { ...(photoDefaults[photoType] || photoDefaults.plant), brightness: 132, contrast: 44 };
  const labels = new Set(condition.match?.visionLabels || []);
  if (labels.has("yellowing") || condition.match?.symptoms?.includes("yellow-leaves")) base.yellowRatio = 0.3;
  if (labels.has("surface-algae") || labels.has("root-risk")) base.greenRatio = Math.max(base.greenRatio, 0.42);
  if (labels.has("dry-edge") || condition.match?.visuals?.includes("edge-dry")) base.darkRatio = 0.34;
  if (variant === "followup-improved") {
    base.yellowRatio = Math.max(0.04, base.yellowRatio - 0.1);
    base.darkRatio = Math.max(0.04, base.darkRatio - 0.08);
  }
  if (variant === "followup-worse") {
    base.yellowRatio += 0.08;
    base.darkRatio += 0.08;
  }
  return base;
}

function photoPlan(condition) {
  const types = condition.photoTypes?.length ? condition.photoTypes : ["plant"];
  const unique = Array.from(new Set(["plant", ...types, condition.followup?.photo?.includes("根") ? "root" : types[0]])).slice(0, 3);
  while (unique.length < 3) unique.push(types[0] || "plant");
  return unique;
}

export function buildSimulatedPhotoFixtures(condition) {
  const types = photoPlan(condition);
  const variants = [
    { kind: "overview", photoType: types[0], comparison: null },
    { kind: "diagnostic-detail", photoType: types[1], comparison: null },
    { kind: "differential-check", photoType: types[2], comparison: null },
    { kind: "followup-improved", photoType: condition.followup?.photo?.includes("根") ? "root" : types[1], comparison: "improved" }
  ];
  return variants.map((variant, index) => ({
    id: `${condition.id}-${variant.kind}`,
    conditionId: condition.id,
    cropKey: condition.cropKey,
    cropName: condition.cropName,
    fixtureKind: variant.kind,
    photoType: variant.photoType,
    simulatedImage: {
      fileName: `${condition.id}-${index + 1}-${variant.photoType}.jpg`,
      prompt: [
        `${condition.cropName || condition.cropKey} ${variant.photoType} photo`,
        `visible traits: ${(cropIdentityTraits[condition.cropKey] || []).join(", ")}`,
        `case evidence: ${(condition.evidence || []).slice(0, 3).join(", ")}`
      ].join("; "),
      signals: fixtureSignals(condition, variant.photoType, variant.kind)
    },
    state: stateFromCondition(condition, variant.photoType),
    visionLabels: condition.match?.visionLabels || [],
    expected: {
      conditionId: condition.id,
      shouldMatchTopFive: true,
      nextAction: condition.action,
      followup: condition.followup,
      comparison: variant.comparison
    }
  }));
}

export function buildCaseValidationSuite({ crop = "", conditionId = "" } = {}) {
  const conditions = flattenPathologyLibrary(pathologyLibrary)
    .filter((condition) => (!crop || condition.cropKey === crop) && (!conditionId || condition.id === conditionId));
  const cases = conditions.map((condition) => ({
    conditionId: condition.id,
    cropKey: condition.cropKey,
    title: condition.title,
    expertEvidence: condition.expertEvidence,
    prescriptionProtocol: condition.prescriptionProtocol,
    photoFixtures: buildSimulatedPhotoFixtures(condition)
  }));
  const photoFixtures = cases.flatMap((item) => item.photoFixtures);
  return {
    version: "fivecrop-case-validation-v1",
    minimumPhotosPerCondition: 3,
    generatedAt: new Date().toISOString(),
    stats: {
      conditions: cases.length,
      photoFixtures: photoFixtures.length,
      minPhotosPerCondition: cases.length ? Math.min(...cases.map((item) => item.photoFixtures.length)) : 0,
      crops: new Set(cases.map((item) => item.cropKey)).size
    },
    cases
  };
}

export function caseValidationStats(suite = buildCaseValidationSuite()) {
  const gaps = suite.cases.flatMap((item) => {
    const missing = [];
    if (item.photoFixtures.length < suite.minimumPhotosPerCondition) missing.push("photoFixtures");
    if (!item.expertEvidence?.decisionRule) missing.push("expertEvidence");
    if (!item.prescriptionProtocol?.oneAction || !item.prescriptionProtocol?.doNot?.length) missing.push("prescriptionProtocol");
    return missing.map((field) => `${item.conditionId}:${field}`);
  });
  return {
    ...suite.stats,
    ready: gaps.length === 0,
    gaps
  };
}
