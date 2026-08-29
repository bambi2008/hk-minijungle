import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { listSqliteReleaseEvidenceEvents, readSqliteReleaseEvidenceHealth, readSqliteReleaseEvidenceSummary, reviewSqliteReleaseEvidence, submitSqliteReleaseEvidence } from "../lib/ops-release-evidence-store.mjs";

const root = await mkdtemp(join(tmpdir(), "dr-forest-release-evidence-"));
const dbPath = join(root, "evidence.sqlite");
const now = new Date();
const evidence = await submitSqliteReleaseEvidence(dbPath, {
  id: "RE-SMOKE-POSTGRES",
  requirementKey: "full-postgres-migration",
  artifactRef: "evidence://smoke/postgres-migration",
  artifactSha256: "a".repeat(64),
  observedAt: new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
  note: "Smoke evidence submitted for review.",
  submittedBy: "fm-lead"
});
assert.equal(evidence.duplicate, false, "First evidence submission should create a record");
const duplicate = await submitSqliteReleaseEvidence(dbPath, {
  id: "RE-SMOKE-POSTGRES",
  requirementKey: "full-postgres-migration",
  artifactRef: "evidence://smoke/postgres-migration",
  artifactSha256: "a".repeat(64),
  observedAt: new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
  note: "Retry should return the existing record.",
  submittedBy: "fm-lead"
});
assert.equal(duplicate.duplicate, true, "Evidence submission should be idempotent by record ID");
const submittedSummary = await readSqliteReleaseEvidenceSummary(dbPath);
assert.equal(submittedSummary.submittedCount, 1, "Summary should expose submitted evidence");
assert.equal(submittedSummary.missingCount, 6, "Summary should expose missing release gates");
await assert.rejects(() => reviewSqliteReleaseEvidence(dbPath, "RE-SMOKE-POSTGRES", { decision: "verified", reviewedBy: "fm-lead", reviewNote: "Cannot self-verify.", expectedUpdatedAt: evidence.record.updatedAt }), (error) => error.code === "RELEASE_EVIDENCE_SEPARATION_OF_DUTIES");
const reviewed = await reviewSqliteReleaseEvidence(dbPath, "RE-SMOKE-POSTGRES", { decision: "verified", reviewedBy: "ops-admin", reviewNote: "Migration evidence reviewed for smoke.", expectedUpdatedAt: evidence.record.updatedAt });
assert.equal(reviewed.record.status, "verified", "Independent review should verify evidence");
const events = await listSqliteReleaseEvidenceEvents(dbPath, "RE-SMOKE-POSTGRES");
assert.equal(events.length, 2, "Submission and review should both be retained as events");
const health = await readSqliteReleaseEvidenceHealth(dbPath);
assert.equal(health.counts.records, 1, "Health should count release evidence records");
assert.equal(health.counts.events, 2, "Health should count release evidence events");
assert.equal(health.relationshipIntegrity.foreignKeyIssues, 0, "Release evidence foreign keys should be intact");
await rm(root, { recursive: true, force: true });
console.log(JSON.stringify({ ok: true, verified: reviewed.record.requirementKey, missing: submittedSummary.missingCount, events: events.length }, null, 2));
