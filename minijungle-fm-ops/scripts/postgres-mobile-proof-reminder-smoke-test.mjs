import { readPostgresMobileCaptureStorageHealth } from "../lib/ops-postgres-mobile-store.mjs";
import { readPostgresProofMediaStorageHealth } from "../lib/ops-postgres-proof-media-store.mjs";
import { readPostgresReminderStorageHealth } from "../lib/ops-postgres-reminder-store.mjs";

if (!process.env.DR_FOREST_DATABASE_URL) {
  console.log(JSON.stringify({ ok: true, skipped: true, reason: "DR_FOREST_DATABASE_URL is not configured in pilot workspace" }, null, 2));
  process.exit(0);
}

const [mobileCapture, proofMedia, reminders] = await Promise.all([
  readPostgresMobileCaptureStorageHealth(""),
  readPostgresProofMediaStorageHealth(""),
  readPostgresReminderStorageHealth("")
]);
for (const [name, health] of Object.entries({ mobileCapture, proofMedia, reminders })) {
  if (health.backend !== "postgresql") throw new Error(`${name} adapter returned ${health.backend}`);
  if (health.relationshipIntegrity.foreignKeyIssues !== 0) throw new Error(`${name} has ${health.relationshipIntegrity.foreignKeyIssues} relationship issues`);
}
console.log(JSON.stringify({ ok: true, skipped: false, backends: { mobileCapture: mobileCapture.backend, proofMedia: proofMedia.backend, reminders: reminders.backend }, counts: { mobileCapture: mobileCapture.counts, proofMedia: proofMedia.counts, reminders: reminders.counts } }, null, 2));
