import { access, cp, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { createCipheriv, createDecipheriv, createHash } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { join, resolve } from "node:path";
import { productionConfigReport } from "../lib/ops-production-config.mjs";

const projectRoot = process.cwd();
const runtimeRoot = resolve(process.env.DR_FOREST_RUNTIME_DIR || join(projectRoot, ".ops-data"));
const targetDb = resolve(process.env.DR_FOREST_RUNTIME_DB_PATH || join(runtimeRoot, "ops-runtime.sqlite"));
const backupRoot = resolve(process.argv[process.argv.indexOf("--backup") + 1] || "");
if (!backupRoot || backupRoot === resolve(projectRoot)) throw new Error("Usage: node scripts/restore-runtime.mjs --backup <backup-directory>");

async function required(path, label) { try { await access(path); } catch { throw new Error(`${label} not found: ${path}`); } }
async function sha256(path) { return createHash("sha256").update(await readFile(path)).digest("hex"); }
function encryptionKey() {
  const value = String(process.env.DR_FOREST_BACKUP_ENCRYPTION_KEY || "");
  if (value.length < 32) throw new Error("DR_FOREST_BACKUP_ENCRYPTION_KEY must contain at least 32 bytes when restoring encrypted backups");
  return createHash("sha256").update(value).digest();
}
async function decryptFile(source, target, key) {
  const bytes = await readFile(source);
  if (bytes.subarray(0, 7).toString() !== "DRFENC1") throw new Error(`Encrypted backup file has an invalid header: ${source}`);
  const iv = bytes.subarray(7, 19);
  const tag = bytes.subarray(19, 35);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  await mkdir(resolve(target, ".."), { recursive: true });
  await writeFile(target, Buffer.concat([decipher.update(bytes.subarray(35)), decipher.final()]), { flag: "wx" });
}
await required(join(backupRoot, "manifest.json"), "Backup manifest");
const manifest = JSON.parse(await readFile(join(backupRoot, "manifest.json"), "utf8"));
const production = productionConfigReport();
if (production.production && !manifest.encryption) throw new Error("Production restore requires an encrypted backup");
const stagingRoot = join(backupRoot, ".restore-staging");
await rm(stagingRoot, { recursive: true, force: true });
await mkdir(stagingRoot, { recursive: true });
const key = manifest.encryption ? encryptionKey() : null;
for (const file of manifest.files || []) {
  const source = join(backupRoot, file.path);
  await required(source, `Backup file ${file.path}`);
  if (file.sha256 !== await sha256(source)) throw new Error(`Backup checksum does not match manifest: ${file.path}`);
  const target = join(stagingRoot, file.sourcePath || file.path);
  if (file.encrypted) await decryptFile(source, target, key);
  else { await mkdir(resolve(target, ".."), { recursive: true }); await cp(source, target); }
  if (file.plainSha256 && file.plainSha256 !== await sha256(target)) throw new Error(`Decrypted backup checksum does not match manifest: ${file.path}`);
}
const backupDb = join(stagingRoot, "ops-runtime.sqlite");
await required(backupDb, "Restored backup database");
const manifestDb = manifest.files.find((item) => (item.sourcePath || item.path) === "ops-runtime.sqlite");
if (!manifestDb) throw new Error("Backup manifest does not contain ops-runtime.sqlite");
const restoredDatabase = new DatabaseSync(backupDb);
try {
  const integrity = restoredDatabase.prepare("PRAGMA integrity_check").get();
  if (integrity?.integrity_check !== "ok") throw new Error(`Restored SQLite integrity check failed: ${integrity?.integrity_check}`);
} finally { restoredDatabase.close(); }

if (process.argv.includes("--verify-only")) {
  await rm(stagingRoot, { recursive: true, force: true });
  console.log(JSON.stringify({ ok: true, verifiedOnly: true, backupRoot, files: manifest.files.length, encrypted: Boolean(manifest.encryption), databaseIntegrity: "ok" }, null, 2));
  process.exit(0);
}

await mkdir(runtimeRoot, { recursive: true });
const safetyRoot = join(runtimeRoot, `pre-restore-${new Date().toISOString().replace(/[:.]/g, "-")}`);
await mkdir(safetyRoot, { recursive: true });
try { await stat(targetDb); await cp(targetDb, join(safetyRoot, "ops-runtime.sqlite")); } catch (error) { if (error?.code !== "ENOENT") throw error; }
await cp(backupDb, targetDb);
const backupMedia = join(stagingRoot, "proof-media");
const targetMedia = join(runtimeRoot, "proof-media");
try { await stat(backupMedia); await cp(backupMedia, targetMedia, { recursive: true, force: true }); } catch (error) { if (error?.code !== "ENOENT") throw error; }
await writeFile(join(safetyRoot, "restore-manifest.json"), JSON.stringify({ restoredAt: new Date().toISOString(), backupRoot, targetDb, safetyRoot }, null, 2));
await rm(stagingRoot, { recursive: true, force: true });
console.log(JSON.stringify({ ok: true, restoredFrom: backupRoot, targetDb, safetyRoot }, null, 2));
