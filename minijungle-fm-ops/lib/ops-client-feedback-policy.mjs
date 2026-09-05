import { randomUUID } from "node:crypto";

export const clientFeedbackMigrationVersion = "2026-09-04.client-service-feedback-v1";
export const postgresClientFeedbackMigrationVersion = "2026-09-04.postgres-client-service-feedback-v1";
export const clientFeedbackStatuses = new Set(["submitted", "acknowledged", "closed"]);
export const clientFeedbackOutcomes = new Set(["satisfied", "partially_satisfied", "follow_up_required"]);
export const clientFeedbackReviewDecisions = new Set(["acknowledge", "close"]);

function feedbackError(message, code = "CLIENT_FEEDBACK_VALIDATION_ERROR", status = 400) {
  const error = new Error(message);
  error.code = code;
  error.status = status;
  return error;
}

function clean(value) { return String(value ?? "").trim(); }
function required(value, field) {
  const result = clean(value);
  if (!result) throw feedbackError(`${field} is required`);
  return result;
}
function iso(value, field) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) throw feedbackError(`${field} must be an ISO date-time`);
  return parsed.toISOString();
}

export function normalizeClientServiceFeedback(input = {}) {
  const outcome = required(input.outcome || "", "outcome").toLowerCase();
  if (!clientFeedbackOutcomes.has(outcome)) throw feedbackError("outcome must be satisfied, partially_satisfied or follow_up_required");
  const rating = Number(input.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw feedbackError("rating must be an integer from 1 to 5");
  const source = clean(input.source || "portal").toLowerCase();
  if (!["portal", "ops", "import"].includes(source)) throw feedbackError("source must be portal, ops or import");
  const submittedAt = iso(input.submittedAt || new Date().toISOString(), "submittedAt");
  return {
    id: required(input.id || `FB-${randomUUID()}`, "id"),
    clientId: required(input.clientId, "clientId"),
    serviceRef: required(input.serviceRef, "serviceRef").slice(0, 200),
    rating,
    outcome,
    followUpRequired: Boolean(input.followUpRequired) || outcome === "follow_up_required",
    comment: required(input.comment, "comment").slice(0, 1000),
    source,
    status: "submitted",
    submittedBy: required(input.submittedBy || "system", "submittedBy"),
    submittedAt,
    updatedAt: iso(input.updatedAt || submittedAt, "updatedAt"),
    reviewedBy: null,
    reviewedAt: null,
    reviewNote: null
  };
}

export function normalizeClientServiceFeedbackReview(existing, input = {}) {
  if (!existing) throw feedbackError("service feedback was not found", "CLIENT_FEEDBACK_NOT_FOUND", 404);
  const decision = required(input.decision, "decision").toLowerCase();
  if (!clientFeedbackReviewDecisions.has(decision)) throw feedbackError("decision must be acknowledge or close");
  if (existing.status === "closed") throw feedbackError("closed service feedback cannot be reviewed again", "CLIENT_FEEDBACK_ALREADY_CLOSED", 409);
  const reviewer = required(input.reviewedBy, "reviewedBy");
  if (reviewer === existing.submittedBy) throw feedbackError("the submitter cannot review the same feedback", "CLIENT_FEEDBACK_SEPARATION_OF_DUTIES", 409);
  return {
    decision,
    nextStatus: decision === "close" ? "closed" : "acknowledged",
    reviewedBy: reviewer,
    reviewedAt: new Date().toISOString(),
    reviewNote: required(input.reviewNote, "reviewNote").slice(0, 500),
    expectedUpdatedAt: required(input.expectedUpdatedAt, "expectedUpdatedAt")
  };
}

export function summarizeClientServiceFeedback(items = {}) {
  const rows = Array.isArray(items) ? items : [];
  const open = rows.filter((item) => item.status !== "closed");
  const followUp = open.filter((item) => item.followUpRequired || item.outcome === "follow_up_required");
  const rated = rows.filter((item) => Number.isInteger(Number(item.rating)));
  return {
    total: rows.length,
    submitted: rows.filter((item) => item.status === "submitted").length,
    acknowledged: rows.filter((item) => item.status === "acknowledged").length,
    closed: rows.filter((item) => item.status === "closed").length,
    open: open.length,
    followUpOpen: followUp.length,
    averageRating: rated.length ? Math.round((rated.reduce((sum, item) => sum + Number(item.rating), 0) / rated.length) * 100) / 100 : null
  };
}
