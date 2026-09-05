import assert from "node:assert/strict";
import { mkdir, rm } from "node:fs/promises";
import { DatabaseSync } from "node:sqlite";
import { join } from "node:path";
import {
  createSqliteClientServiceFeedback,
  listSqliteClientServiceFeedback,
  readSqliteClientServiceFeedbackHealth,
  reviewSqliteClientServiceFeedback
} from "../lib/ops-client-feedback-store.mjs";
import { normalizeClientServiceFeedback } from "../lib/ops-client-feedback-policy.mjs";

const runtimeDir = join(process.cwd(), ".ops-data-client-feedback-smoke");
const dbPath = join(runtimeDir, "feedback.sqlite");
await rm(runtimeDir, { recursive: true, force: true });
await mkdir(runtimeDir, { recursive: true });
const db = new DatabaseSync(dbPath);
db.exec("PRAGMA foreign_keys = ON; CREATE TABLE clients(id TEXT PRIMARY KEY, name TEXT NOT NULL); INSERT INTO clients(id,name) VALUES ('client-a','Client A'),('client-b','Client B');");
db.close();

assert.throws(() => normalizeClientServiceFeedback({ clientId: "client-a", serviceRef: "WO-1", rating: 6, outcome: "satisfied", comment: "bad" }), /rating/);
const created = await createSqliteClientServiceFeedback(dbPath, { id: "FB-SMOKE-001", clientId: "client-a", serviceRef: "WO-1001", rating: 4, outcome: "partially_satisfied", followUpRequired: true, comment: "Please revisit the irrigation timing.", submittedBy: "client-a-viewer", submittedAt: "2026-09-04T09:00:00.000Z" });
assert.equal(created.duplicate, false);
assert.equal(created.feedback.status, "submitted");
const duplicate = await createSqliteClientServiceFeedback(dbPath, { id: "FB-SMOKE-001", clientId: "client-a", serviceRef: "WO-1001", rating: 4, outcome: "partially_satisfied", comment: "same id is idempotent", submittedBy: "client-a-viewer", submittedAt: "2026-09-04T09:00:00.000Z" });
assert.equal(duplicate.duplicate, true);
assert.equal((await listSqliteClientServiceFeedback(dbPath, { clientIds: ["client-b"] })).length, 0);
const acknowledged = await reviewSqliteClientServiceFeedback(dbPath, "FB-SMOKE-001", { decision: "acknowledge", reviewedBy: "fm-lead", expectedUpdatedAt: created.feedback.updatedAt, reviewNote: "FM has assigned a revisit." });
assert.equal(acknowledged.feedback.status, "acknowledged");
await assert.rejects(() => reviewSqliteClientServiceFeedback(dbPath, "FB-SMOKE-001", { decision: "close", reviewedBy: "fm-lead", expectedUpdatedAt: created.feedback.updatedAt, reviewNote: "stale" }), (error) => error.code === "CLIENT_FEEDBACK_STALE");
const closed = await reviewSqliteClientServiceFeedback(dbPath, "FB-SMOKE-001", { decision: "close", reviewedBy: "fm-lead", expectedUpdatedAt: acknowledged.feedback.updatedAt, reviewNote: "Revisit completed and client loop closed." });
assert.equal(closed.feedback.status, "closed");
const health = await readSqliteClientServiceFeedbackHealth(dbPath);
assert.deepEqual({ total: health.counts.total, closed: health.counts.closed, followUpOpen: health.counts.followUpOpen, averageRating: health.counts.averageRating }, { total: 1, closed: 1, followUpOpen: 0, averageRating: 4 });
await rm(runtimeDir, { recursive: true, force: true });
console.log(JSON.stringify({ ok: true, idempotentCreate: true, scopeFiltered: true, staleReviewBlocked: true, closedLoop: true, averageRating: health.counts.averageRating }, null, 2));
