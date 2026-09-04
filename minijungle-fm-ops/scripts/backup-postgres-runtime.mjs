import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildPostgresBackupManifest, encryptBackupFile, listPgRestoreArchive, runPgDump, assertPostgresToolsAvailable, verifyOffHostBackupReadback } from "../lib/ops-postgres-backup.mjs";
import { uploadBackupTree } from "../lib/ops-object-storage.mjs";
import { readBackupRetentionPolicy } from "../lib/ops-backup-retention-policy.mjs";

function option(name, fallback = "") { const index = process.argv.indexOf(name); return index >= 0 ? String(process.argv[index + 1] || "").trim() : fallback; }
function required(value, label) { if (!String(value || "").trim()) throw new Error(`${label} is required`); return String(value).trim(); }
function stamp() { return new Date().toISOString().replace(/[:.]/g, "-"); }

export async function main() {
  const databaseUrl = required(process.env.DR_FOREST_DATABASE_URL, "DR_FOREST_DATABASE_URL");
  const key = required(process.env.DR_FOREST_BACKUP_ENCRYPTION_KEY, "DR_FOREST_BACKUP_ENCRYPTION_KEY");
  if (Buffer.byteLength(key, "utf8") < 32) throw new Error("DR_FOREST_BACKUP_ENCRYPTION_KEY must contain at least 32 bytes");
  const outputRoot = resolve(option("--out", join(process.cwd(), "backups", `postgres-${stamp()}`)));
  const archive = join(outputRoot, "dr-forest-postgres.dump");
  const encryptedArchive = `${archive}.enc`;
  await mkdir(outputRoot, { recursive: true });
  const tools = await assertPostgresToolsAvailable();
  const dump = await runPgDump({ databaseUrl, outputPath: archive });
  const archiveCheck = await listPgRestoreArchive(archive);
  const encrypted = await encryptBackupFile(archive, encryptedArchive);
  await rm(archive, { force: true });
  const manifest = buildPostgresBackupManifest({ source: dump.source, archive: dump, encryptedArchive: encrypted, archiveEntries: archiveCheck.entries });
  const manifestPath = join(outputRoot, "manifest.json");
  await writeFile(manifestPath, `${JSON.stringify({ ...manifest, tools, retentionPolicy: readBackupRetentionPolicy() }, null, 2)}\n`, "utf8");
  let offHost = null;
  if (process.argv.includes("--upload")) {
    const destination = required(process.env.DR_FOREST_BACKUP_DESTINATION, "DR_FOREST_BACKUP_DESTINATION");
    offHost = await uploadBackupTree(destination, outputRoot, [manifest.files[0], { path: "manifest.json" }]);
    offHost.readback = await verifyOffHostBackupReadback(destination, outputRoot, [manifest.files[0], { path: "manifest.json" }]);
  }
  return { ok: true, outputRoot, manifest: manifestPath, archiveEntries: archiveCheck.entries, encrypted: true, offHost };
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main().then((result) => console.log(JSON.stringify(result, null, 2))).catch((error) => { console.error(error.stack || error.message); process.exitCode = 1; });
