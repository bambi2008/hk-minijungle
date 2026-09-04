import { access, cp, mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { createCipheriv, createHash, randomBytes } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { basename, dirname, join, resolve } from "node:path";
import { productionConfigReport } from "../lib/ops-production-config.mjs";
import { uploadBackupTree } from "../lib/ops-object-storage.mjs";
import { readBackupRetentionPolicy } from "../lib/ops-backup-retention-policy.mjs";

const projectRoot = process.cwd();
const runtimeRoot = resolve(process.env.DR_FOREST_RUNTIME_DIR || join(projectRoot, ".ops-data"));
const databasePath = resolve(process.env.DR_FOREST_RUNTIME_DB_PATH || join(runtimeRoot, "ops-runtime.sqlite"));
const backupRoot = resolve(process.env.DR_FOREST_BACKUP_DIR || join(projectRoot, "backups"));
const production = productionConfigReport();
if (production.production) throw new Error("PRODUCTION_POSTGRES_BACKUP_REQUIRED: use the monitored backup command, which runs pg_dump and uploads the PostgreSQL archive");

function arg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}

function stamp() { return new Date().toISOString().replace(/[:.]/g, "-"); }
async function sha256(filePath) { return createHash("sha256").update(await readFile(filePath)).digest("hex"); }
async function readable(filePath, label) { try { await access(filePath); } catch { throw new Error(`${label} not found: ${filePath}`); } }
function sqliteString(value) { return String(value).replaceAll("'", "''"); }
function encryptionKey() {
  const value = String(process.env.DR_FOREST_BACKUP_ENCRYPTION_KEY || "");
  if (value.length < 32) throw new Error("DR_FOREST_BACKUP_ENCRYPTION_KEY must contain at least 32 bytes when encryption is enabled");
  return createHash("sha256").update(value).digest();
}
async function encryptFile(source, target, key) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(await readFile(source)), cipher.final()]);
  await writeFile(target, Buffer.concat([Buffer.from("DRFENC1"), iv, cipher.getAuthTag(), encrypted]), { flag: "wx" });
  await rm(source, { force: true });
}

const outputRoot = resolve(arg("--out") || join(backupRoot, `ops-runtime-${stamp()}`));
await mkdir(outputRoot, { recursive: true });
const backupDb = join(outputRoot, basename(databasePath));
const snapshotDb = join(outputRoot, `.${basename(databasePath)}.snapshot`);
await rm(snapshotDb, { force: true });
await readable(databasePath, "Runtime database");
const database = new DatabaseSync(databasePath);
let sourceIntegrity = "unknown";
try {
  const integrity = database.prepare("PRAGMA integrity_check").get();
  sourceIntegrity = integrity?.integrity_check || "unknown";
  if (sourceIntegrity !== "ok") throw new Error(`SQLite integrity check failed: ${sourceIntegrity}`);
  database.exec(`VACUUM INTO '${sqliteString(snapshotDb)}'`);
} finally { database.close(); }
await writeFile(backupDb, await readFile(snapshotDb));
await rm(snapshotDb, { force: true });
const mediaSource = join(runtimeRoot, "proof-media");
const mediaTarget = join(outputRoot, "proof-media");
try { await stat(mediaSource); await cp(mediaSource, mediaTarget, { recursive: true }); } catch (error) { if (error?.code !== "ENOENT") throw error; }

const manifest = {
  version: "2026-08-23.runtime-backup-v2",
  createdAt: new Date().toISOString(),
  source: { runtimeRoot, databasePath },
  consistency: { method: "sqlite-vacuum-into", sourceIntegrity },
  retentionPolicy: readBackupRetentionPolicy(),
  files: [{ path: basename(backupDb), bytes: (await stat(backupDb)).size, sha256: await sha256(backupDb) }]
};
try {
  const files = await readdir(mediaTarget, { recursive: true, withFileTypes: true });
  for (const entry of files) if (entry.isFile()) {
    const relative = join("proof-media", entry.parentPath ? entry.parentPath.slice(mediaTarget.length + 1) : "", entry.name).replace(/\\/g, "/");
    const filePath = join(outputRoot, relative);
    manifest.files.push({ path: relative, bytes: (await stat(filePath)).size, sha256: await sha256(filePath) });
  }
} catch (error) { if (error?.code !== "ENOENT") throw error; }

const encrypt = production.production || process.argv.includes("--encrypt");
if (encrypt) {
  const key = encryptionKey();
  for (const file of [...manifest.files]) {
    const sourcePath = join(outputRoot, file.path);
    const encryptedPath = `${sourcePath}.enc`;
    file.plainBytes = file.bytes;
    file.plainSha256 = file.sha256;
    await encryptFile(sourcePath, encryptedPath, key);
    file.sourcePath = file.path;
    file.path = `${file.path}.enc`;
    file.bytes = (await stat(encryptedPath)).size;
    file.sha256 = await sha256(encryptedPath);
    file.encrypted = true;
  }
}
manifest.encryption = encrypt ? { algorithm: "AES-256-GCM", format: "DRFENC1", keySource: "DR_FOREST_BACKUP_ENCRYPTION_KEY" } : null;
manifest.productionGate = { mode: production.mode, destination: process.env.DR_FOREST_BACKUP_DESTINATION || null };
await writeFile(join(outputRoot, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
let offHost = null;
if (production.production) {
  if (!production.ready) throw new Error(`Production backup configuration is incomplete: ${production.failures.map((item) => item.name).join(", ")}`);
  offHost = await uploadBackupTree(process.env.DR_FOREST_BACKUP_DESTINATION, outputRoot, [...manifest.files, { path: "manifest.json" }]);
}
console.log(JSON.stringify({ ok: true, outputRoot, database: backupDb, files: manifest.files.length, encrypted: encrypt, offHost }, null, 2));
