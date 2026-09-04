import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import assert from "node:assert/strict";
import { createSqliteProofMediaIntent, readSqliteProofMediaStorageHealth, recordSqliteProofMediaScan, registerSqliteProofMediaEvidence } from "../lib/ops-proof-media-store.mjs";

const root = await mkdtemp(join(tmpdir(), "dr-forest-media-scan-"));
const dbPath = join(root, "media.sqlite");
const sha256 = "a".repeat(64);
const media = { id: "MEDIA-SCAN-001", clientId: "show-suite", wallId: "MJ-HK-021", moduleId: "MJ-HK-021-M01", workorderId: "WO-2026-001", filename: "service-photo.jpg", contentType: "image/jpeg", byteSize: 12, sha256, source: "technician-mobile" };

try {
  await createSqliteProofMediaIntent(dbPath, media);
  await registerSqliteProofMediaEvidence(dbPath, media);
  const clean = await recordSqliteProofMediaScan(dbPath, media.id, { scanId: "SCAN-001", provider: "pilot-malware-scanner", status: "clean", sha256, scannedAt: "2026-09-04T08:00:00.000Z", recordedBy: "scanner-service" });
  assert.equal(clean.duplicate, false);
  assert.equal(clean.object.scanStatus, "clean");
  assert.equal(clean.scan.status, "clean");

  const duplicate = await recordSqliteProofMediaScan(dbPath, media.id, { scanId: "SCAN-001", provider: "pilot-malware-scanner", status: "clean", sha256, scannedAt: "2026-09-04T08:00:00.000Z", recordedBy: "scanner-service" });
  assert.equal(duplicate.duplicate, true);
  await assert.rejects(() => recordSqliteProofMediaScan(dbPath, media.id, { scanId: "SCAN-BAD-HASH", provider: "pilot-malware-scanner", status: "clean", sha256: "b".repeat(64), scannedAt: "2026-09-04T08:01:00.000Z", recordedBy: "scanner-service" }), { code: "PROOF_MEDIA_SCAN_HASH_MISMATCH" });

  const quarantined = await recordSqliteProofMediaScan(dbPath, media.id, { scanId: "SCAN-002", provider: "pilot-malware-scanner", status: "quarantined", sha256, scannedAt: "2026-09-04T08:02:00.000Z", recordedBy: "scanner-service", note: "Manual review required." });
  assert.equal(quarantined.object.scanStatus, "quarantined");
  const health = await readSqliteProofMediaStorageHealth(dbPath);
  assert.equal(health.counts.mediaScanResults, 2);
  assert.equal(health.counts.scanQuarantined, 1);
  assert.equal(health.counts.unscanned, 0);
  console.log(JSON.stringify({ ok: true, policy: "2026-09-04.media-malware-scan-v1", clean: clean.scan.scanId, quarantined: quarantined.scan.scanId, health: health.counts }, null, 2));
} finally {
  await rm(root, { recursive: true, force: true });
}
