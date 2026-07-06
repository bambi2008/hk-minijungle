(function () {
  const eventKey = "fiveCropP2Events";
  const correctionKey = "fiveCropExpertCorrections";

  const annotationSchema = {
    version: "fivecrop-label-v1",
    requiredFields: [
      "cropKey",
      "stageKey",
      "photoType",
      "symptoms",
      "visuals",
      "predictedDiagnosis",
      "finalOutcome"
    ],
    fields: {
      cropKey: ["tomato", "basil", "rosemary", "strawberry", "pepper"],
      stageKey: ["seedling", "vegetative", "flowering", "fruiting"],
      photoType: ["plant", "leaf", "root", "flower", "pest", "none"],
      symptoms: "string[]",
      visuals: "string[]",
      predictedDiagnosis: "string",
      correctedDiagnosis: "string|null",
      finalOutcome: ["unknown", "improved", "unchanged", "worse", "confirmed_by_expert"],
      followupWindow: ["none", "24h", "48h", "day3", "day7"],
      source: ["app", "user-correction", "expert-correction"]
    }
  };

  const pricingBoundary = {
    version: "fivecrop-pricing-v1",
    free: {
      name: "Free",
      diagnosisLimit: 3,
      includes: ["photo diagnosis", "one next action", "basic follow-up reminder"]
    },
    pro: {
      name: "FiveCrop Plus",
      trigger: "advanced follow-up, image comparison, unlimited diagnosis history",
      includes: ["advanced follow-up", "before/after comparison", "case history"]
    },
    expert: {
      name: "Expert Review",
      trigger: "human correction or expert advice",
      includes: ["expert diagnosis correction", "custom care note"]
    }
  };

  function readArray(key) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  }

  function writeArray(key, items) {
    localStorage.setItem(key, JSON.stringify(items.slice(-250)));
  }

  function trackEvent(type, detail = {}) {
    const events = readArray(eventKey);
    const event = {
      id: crypto.randomUUID ? crypto.randomUUID() : `event-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      type,
      at: new Date().toISOString(),
      detail
    };
    events.push(event);
    writeArray(eventKey, events);
    return event;
  }

  function getEvents() {
    return readArray(eventKey);
  }

  function buildAnnotationRecord({ state, findings, context = {}, correction = null }) {
    const top = findings?.[0] || {};
    const reminder = context.reminderPlan || null;
    const completedFollowup = (context.logs || []).slice().reverse().find((item) => item.routeAssessment?.state);
    return {
      id: crypto.randomUUID ? crypto.randomUUID() : `label-${Date.now()}`,
      schemaVersion: annotationSchema.version,
      createdAt: new Date().toISOString(),
      cropKey: state?.crop || "unknown",
      stageKey: state?.stage || "unknown",
      photoType: context.photoType || state?.photoType || "none",
      capturedPhotoTypes: context.capturedPhotoTypes || [],
      symptoms: state?.symptoms || [],
      visuals: state?.visuals || [],
      predictedDiagnosis: top.title || "",
      conditionId: context.pathologyConditionId || null,
      pathologyMatches: context.pathologyMatches || [],
      correctedDiagnosis: correction?.correctedDiagnosis || null,
      correctionReason: correction?.reason || null,
      finalOutcome: correction?.finalOutcome || completedFollowup?.routeAssessment?.state || "unknown",
      followupWindow: reminder?.items?.[0]?.key || "none",
      confidence: context.confidence ?? null,
      photoQuality: context.photoQuality || null,
      source: correction?.source || "app"
    };
  }

  function saveCorrection(record) {
    const corrections = readArray(correctionKey);
    corrections.push(record);
    writeArray(correctionKey, corrections);
    trackEvent("expert_correction_saved", {
      cropKey: record.cropKey,
      stageKey: record.stageKey,
      finalOutcome: record.finalOutcome
    });
    return record;
  }

  function getCorrections() {
    return readArray(correctionKey);
  }

  function rate(numerator, denominator) {
    if (!denominator) return 0;
    return Math.round((numerator / denominator) * 100);
  }

  function count(events, type) {
    return events.filter((event) => event.type === type).length;
  }

  function analyticsSnapshot({ reports = [], events = getEvents(), corrections = getCorrections() } = {}) {
    const diagnosisStarted = Math.max(count(events, "diagnosis_started"), reports.length);
    const photoCompleted = Math.max(count(events, "photo_completed"), reports.filter((item) => item.photoType && item.photoType !== "none").length);
    const actionCompleted = Math.max(count(events, "action_completed"), reports.filter((item) => item.reminderPlan?.actionCompletedAt).length);
    const followupReturned = Math.max(count(events, "followup_returned"), reports.filter((item) => item.logs?.length).length);
    const paidIntent = count(events, "paid_boundary_seen");

    return {
      diagnosisStarted,
      photoCompleted,
      actionCompleted,
      followupReturned,
      corrections: corrections.length,
      paidIntent,
      photoCompletionRate: rate(photoCompleted, diagnosisStarted),
      actionCompletionRate: rate(actionCompleted, diagnosisStarted),
      followupReturnRate: rate(followupReturned, diagnosisStarted),
      correctionRate: rate(corrections.length, diagnosisStarted)
    };
  }

  function usageGate({ reports = [], events = getEvents() } = {}) {
    const diagnosisCount = Math.max(count(events, "diagnosis_started"), reports.length);
    if (diagnosisCount >= pricingBoundary.free.diagnosisLimit) {
      return {
        tier: "pro",
        message: "Free diagnosis limit reached. Upgrade for unlimited history and advanced follow-up."
      };
    }
    return {
      tier: "free",
      message: `${pricingBoundary.free.diagnosisLimit - diagnosisCount} free diagnosis left before Plus boundary.`
    };
  }

  window.FiveCropP2 = {
    annotationSchema,
    pricingBoundary,
    trackEvent,
    getEvents,
    buildAnnotationRecord,
    saveCorrection,
    getCorrections,
    analyticsSnapshot,
    usageGate
  };
}());
