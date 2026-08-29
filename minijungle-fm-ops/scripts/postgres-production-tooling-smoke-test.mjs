import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildPostgresBackupManifest, parsePostgresConnection, postgresTargetFingerprint, assertIsolatedPostgresTarget } from "../lib/ops-postgres-backup.mjs";

function assert(condition, message) { if (!condition) throw new Error(message); }
const originalSsl = process.env.DR_FOREST_DATABASE_SSL;
process.env.DR_FOREST_DATABASE_SSL = "true";
try {
  const parsed = parsePostgresConnection("postgresql://ops%40app:secret@db.example.test:5432/dr_forest_ops?sslmode=require");
  assert(parsed.user === "ops@app" && parsed.database === "dr_forest_ops" && parsed.sslmode === "require", "PostgreSQL URL parsing lost connection fields");
  assert(postgresTargetFingerprint("postgres://ops:secret@db.example.test:5432/dr_forest_ops?sslmode=require") === "db.example.test:5432/dr_forest_ops", "Target fingerprint should omit credentials");
  assertIsolatedPostgresTarget("postgres://ops:secret@db.example.test:5432/dr_forest_ops?sslmode=require", "postgres://restore:secret@restore.example.test:5432/dr_forest_ops?sslmode=require");
  let sameTargetRejected = false;
  try { assertIsolatedPostgresTarget("postgres://ops:secret@db.example.test:5432/dr_forest_ops?sslmode=require", "postgres://restore:secret@db.example.test:5432/dr_forest_ops?sslmode=require"); } catch (error) { sameTargetRejected = /different PostgreSQL/.test(error.message); }
  assert(sameTargetRejected, "Restore tooling must reject the source target");
  const root = await mkdtemp(join(tmpdir(), "dr-forest-backup-smoke-"));
  try {
    const archive = join(root, "dr-forest-postgres.dump");
    const encrypted = join(root, "dr-forest-postgres.dump.enc");
    await writeFile(archive, Buffer.from("archive"));
    await writeFile(encrypted, Buffer.from("encrypted"));
    const manifest = buildPostgresBackupManifest({ source: parsed.display, archive: { path: archive, bytes: 7, sha256: "a".repeat(64) }, encryptedArchive: { path: encrypted, bytes: 9, sha256: "b".repeat(64) }, archiveEntries: 3 });
    const parsedManifest = JSON.parse(JSON.stringify(manifest));
    assert(parsedManifest.kind === "postgres-custom-format" && parsedManifest.encryption.format === "DRFENC1" && parsedManifest.consistency.archiveEntries === 3, "Backup manifest contract is incomplete");
    assert((await readFile(archive)).toString() === "archive", "Smoke archive fixture changed unexpectedly");
  } finally { await rm(root, { recursive: true, force: true }); }
  console.log(JSON.stringify({ ok: true, parser: "verified", isolatedTargetGuard: "verified", manifest: "verified", tools: "not-run-without-pg-client" }, null, 2));
} finally {
  if (originalSsl === undefined) delete process.env.DR_FOREST_DATABASE_SSL;
  else process.env.DR_FOREST_DATABASE_SSL = originalSsl;
}
