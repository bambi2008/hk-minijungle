import { access, mkdir, readFile, rm } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { assertIsolatedPostgresTarget, decryptBackupFile, downloadOffHostBackup, listPgRestoreArchive, runPgRestore } from "../lib/ops-postgres-backup.mjs";

function option(name, fallback = "") { const index = process.argv.indexOf(name); return index >= 0 ? String(process.argv[index + 1] || "").trim() : fallback; }
async function required(path, label) { try { await access(path); } catch { throw new Error(`${label} not found: ${path}`); } return path; }

export async function main() {
  const backupInput = option("--backup");
  const fromOffHost = process.argv.includes("--from-offhost");
  if (!backupInput && !fromOffHost) throw new Error("Usage: --backup <backup-directory> or --from-offhost");
  let offHostRoot = null;
  let backupRoot = backupInput ? resolve(backupInput) : null;
  if (fromOffHost) {
    const destination = process.env.DR_FOREST_BACKUP_DESTINATION;
    if (!destination) throw new Error("DR_FOREST_BACKUP_DESTINATION is required with --from-offhost");
    offHostRoot = resolve(process.env.TEMP || process.env.TMP || ".", `dr-forest-offhost-restore-${process.pid}-${Date.now()}`);
    backupRoot = (await downloadOffHostBackup(destination, offHostRoot)).root;
  }
  const manifestPath = join(backupRoot, "manifest.json");
  await required(manifestPath, "Backup manifest");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  if (manifest.kind !== "postgres-custom-format" || !manifest.encryption?.algorithm) throw new Error("Backup manifest is not an encrypted PostgreSQL custom-format backup");
  const file = manifest.files?.find((item) => item.encrypted && item.sourcePath);
  if (!file) throw new Error("Backup manifest does not contain an encrypted PostgreSQL archive");
  const encryptedPath = await required(join(backupRoot, file.path), "Encrypted PostgreSQL archive");
  const stagingRoot = join(backupRoot, `.restore-postgres-${process.pid}-${Date.now()}`);
  await mkdir(stagingRoot, { recursive: true });
  const archivePath = join(stagingRoot, file.sourcePath);
  try {
    const decrypted = await decryptBackupFile(encryptedPath, archivePath);
    if (file.plainSha256 !== decrypted.sha256 || Number(file.plainBytes) !== decrypted.bytes) throw new Error("Decrypted PostgreSQL archive does not match the manifest");
    const archiveCheck = await listPgRestoreArchive(archivePath);
    if (Number(manifest.consistency?.archiveEntries) !== archiveCheck.entries) throw new Error("PostgreSQL archive entry count does not match the manifest");
    if (process.argv.includes("--verify-only")) return { ok: true, verifiedOnly: true, archiveEntries: archiveCheck.entries, encrypted: true, source: manifest.source?.target || null };
    const sourceUrl = process.env.DR_FOREST_DATABASE_URL;
    const targetUrl = option("--target-url", process.env.DR_FOREST_RESTORE_DATABASE_URL);
    if (!sourceUrl) throw new Error("DR_FOREST_DATABASE_URL is required to compare the restore target");
    if (!targetUrl) throw new Error("--target-url or DR_FOREST_RESTORE_DATABASE_URL is required for an isolated restore");
    const separation = assertIsolatedPostgresTarget(sourceUrl, targetUrl);
    const restored = await runPgRestore({ databaseUrl: targetUrl, backupPath: archivePath, cleanTarget: true });
    return { ok: true, verifiedOnly: false, archiveEntries: archiveCheck.entries, source: separation.source, target: separation.target, restored: restored.cleanedTarget };
  } finally {
    await rm(stagingRoot, { recursive: true, force: true });
    if (offHostRoot) await rm(offHostRoot, { recursive: true, force: true });
  }
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main().then((result) => console.log(JSON.stringify(result, null, 2))).catch((error) => { console.error(error.stack || error.message); process.exitCode = 1; });
