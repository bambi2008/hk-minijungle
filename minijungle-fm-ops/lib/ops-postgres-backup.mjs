import { access, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { execFile, spawn } from "node:child_process";
import { promisify } from "node:util";
import { dirname, resolve } from "node:path";
import { getS3Object, parseObjectStorageDestination } from "./ops-object-storage.mjs";

export const postgresBackupVersion = "2026-08-29.postgres-backup-v1";
const execFileAsync = promisify(execFile);

function clean(value) { return String(value || "").trim(); }
function required(value, label) {
  const result = clean(value);
  if (!result) throw new Error(`${label} is required`);
  return result;
}
function sha256(value) { return createHash("sha256").update(value).digest("hex"); }
export function parsePostgresConnection(databaseUrl) {
  const value = required(databaseUrl, "databaseUrl");
  if (!/^(postgres|postgresql):\/\//i.test(value)) throw new Error("databaseUrl must use postgres:// or postgresql://");
  const url = new URL(value);
  const database = decodeURIComponent(url.pathname.replace(/^\//, ""));
  if (!url.hostname || !database) throw new Error("databaseUrl must include a host and database name");
  const sslmode = clean(url.searchParams.get("sslmode")).toLowerCase();
  if (!["require", "verify-ca", "verify-full"].includes(sslmode) && clean(process.env.DR_FOREST_DATABASE_SSL).toLowerCase() !== "true") {
    throw new Error("PostgreSQL backup requires TLS with sslmode=require, verify-ca, verify-full or DR_FOREST_DATABASE_SSL=true");
  }
  return {
    host: url.hostname,
    port: url.port || "5432",
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database,
    sslmode: sslmode || "require",
    display: `${url.hostname}:${url.port || "5432"}/${database}`
  };
}

export function postgresTargetFingerprint(databaseUrl) {
  const parsed = parsePostgresConnection(databaseUrl);
  return `${parsed.host.toLowerCase()}:${parsed.port}/${parsed.database}`;
}

export function assertIsolatedPostgresTarget(sourceUrl, targetUrl) {
  const source = postgresTargetFingerprint(sourceUrl);
  const target = postgresTargetFingerprint(targetUrl);
  if (source === target) throw new Error("Restore target must be a different PostgreSQL host/database from the source");
  return { source, target };
}

async function withPostgresEnv(parsed, work) {
  const env = { ...process.env, PGHOST: parsed.host, PGPORT: parsed.port, PGUSER: parsed.user, PGDATABASE: parsed.database, PGSSLMODE: parsed.sslmode };
  if (parsed.password) env.PGPASSWORD = parsed.password;
  return work(env, parsed);
}

async function runBinary(binary, args, env, { cwd = process.cwd() } = {}) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(binary, args, { cwd, env, shell: false, stdio: ["ignore", "pipe", "pipe"] });
    const stdout = [];
    const stderr = [];
    child.stdout.on("data", (chunk) => stdout.push(chunk));
    child.stderr.on("data", (chunk) => stderr.push(chunk));
    child.once("error", (error) => reject(error));
    child.once("close", (code, signal) => {
      const result = { code, signal, stdout: Buffer.concat(stdout).toString("utf8"), stderr: Buffer.concat(stderr).toString("utf8") };
      if (code !== 0) {
        const error = new Error(`${binary} exited with ${code || signal}: ${result.stderr.trim() || result.stdout.trim()}`);
        error.code = code === null ? "POSTGRES_TOOL_ABORTED" : "POSTGRES_TOOL_FAILED";
        error.result = result;
        reject(error);
      } else resolvePromise(result);
    });
  });
}

export async function assertPostgresToolsAvailable() {
  const versions = {};
  for (const binary of ["pg_dump", "pg_restore"]) {
    try {
      const result = await execFileAsync(binary, ["--version"], { windowsHide: true, timeout: 5000 });
      versions[binary] = clean(result.stdout || result.stderr);
    } catch (error) {
      const missing = error?.code === "ENOENT";
      const wrapped = new Error(`${binary} is ${missing ? "not installed or not on PATH" : "unavailable"}`);
      wrapped.code = missing ? "POSTGRES_TOOL_MISSING" : "POSTGRES_TOOL_UNAVAILABLE";
      throw wrapped;
    }
  }
  return versions;
}

export async function runPgDump({ databaseUrl, outputPath }) {
  const parsed = parsePostgresConnection(databaseUrl);
  const target = resolve(required(outputPath, "outputPath"));
  await mkdir(dirname(target), { recursive: true });
  await access(dirname(target));
  const result = await withPostgresEnv(parsed, (env) => runBinary("pg_dump", ["--format=custom", "--no-owner", "--no-acl", "--file", target, "--host", parsed.host, "--port", parsed.port, "--username", parsed.user, "--dbname", parsed.database], env));
  const file = await stat(target);
  if (!file.size) throw new Error("pg_dump produced an empty archive");
  return { path: target, bytes: file.size, sha256: await sha256(await readFile(target)), source: parsed.display, output: clean(result.stdout || result.stderr) };
}

export async function runPgRestore({ databaseUrl, backupPath, cleanTarget = true }) {
  const parsed = parsePostgresConnection(databaseUrl);
  const source = resolve(required(backupPath, "backupPath"));
  await access(source);
  const args = ["--format=custom", "--exit-on-error", "--no-owner", "--no-acl"];
  if (cleanTarget) args.push("--clean", "--if-exists");
  args.push("--host", parsed.host, "--port", parsed.port, "--username", parsed.user, "--dbname", parsed.database, source);
  const result = await withPostgresEnv(parsed, (env) => runBinary("pg_restore", args, env));
  return { path: source, source: parsed.display, output: clean(result.stdout || result.stderr), cleanedTarget: cleanTarget };
}

export async function listPgRestoreArchive(backupPath) {
  const source = resolve(required(backupPath, "backupPath"));
  await access(source);
  const result = await execFileAsync("pg_restore", ["--list", source], { windowsHide: true, timeout: 30_000, maxBuffer: 10 * 1024 * 1024 });
  const entries = String(result.stdout || "").split(/\r?\n/).filter((line) => line && !line.startsWith(";")).length;
  if (!entries) throw new Error("pg_restore archive contains no readable entries");
  return { entries, output: clean(result.stdout) };
}

function encryptionKey() {
  const value = clean(process.env.DR_FOREST_BACKUP_ENCRYPTION_KEY);
  if (Buffer.byteLength(value, "utf8") < 32) throw new Error("DR_FOREST_BACKUP_ENCRYPTION_KEY must contain at least 32 bytes");
  return createHash("sha256").update(value).digest();
}

export async function encryptBackupFile(sourcePath, targetPath) {
  const key = encryptionKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(await readFile(sourcePath)), cipher.final()]);
  await writeFile(targetPath, Buffer.concat([Buffer.from("DRFENC1"), iv, cipher.getAuthTag(), encrypted]), { flag: "wx" });
  return { path: resolve(targetPath), bytes: (await stat(targetPath)).size, sha256: await sha256(await readFile(targetPath)) };
}

export async function decryptBackupFile(sourcePath, targetPath) {
  const bytes = await readFile(sourcePath);
  if (bytes.subarray(0, 7).toString() !== "DRFENC1") throw new Error("Encrypted PostgreSQL backup has an invalid header");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), bytes.subarray(7, 19));
  decipher.setAuthTag(bytes.subarray(19, 35));
  const target = resolve(targetPath);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, Buffer.concat([decipher.update(bytes.subarray(35)), decipher.final()]), { flag: "wx" });
  return { path: target, bytes: (await stat(target)).size, sha256: await sha256(await readFile(target)) };
}

export function buildPostgresBackupManifest({ source, archive, encryptedArchive, archiveEntries, createdAt = new Date().toISOString() }) {
  return {
    version: postgresBackupVersion,
    kind: "postgres-custom-format",
    createdAt,
    source: { target: source, tls: true },
    consistency: { method: "pg_dump-custom-format", archiveEntries },
    encryption: { algorithm: "AES-256-GCM", format: "DRFENC1", keySource: "DR_FOREST_BACKUP_ENCRYPTION_KEY" },
    files: [{ path: encryptedArchive.path.split(/[\\/]/).pop(), bytes: encryptedArchive.bytes, sha256: encryptedArchive.sha256, encrypted: true, sourcePath: archive.path.split(/[\\/]/).pop(), plainBytes: archive.bytes, plainSha256: archive.sha256 }]
  };
}

function safeRelativePath(value) {
  const result = clean(value).replaceAll("\\", "/");
  if (!result || result.startsWith("/") || /^[A-Za-z]:/.test(result) || result.split("/").includes("..")) throw new Error("Backup manifest contains an unsafe relative path");
  return result;
}

export async function verifyOffHostBackupReadback(destination, backupRoot, files = []) {
  const { bucket, prefix } = parseObjectStorageDestination(destination);
  const verified = [];
  for (const file of files) {
    const relative = safeRelativePath(file.path);
    const localPath = resolve(backupRoot, relative);
    const expected = await readFile(localPath);
    const key = [prefix, relative].filter(Boolean).join("/");
    const remote = await getS3Object({ bucket, key });
    const remoteHash = sha256(remote.bytes);
    const expectedHash = sha256(expected);
    if (remote.bytes.length !== expected.length || remoteHash !== expectedHash) throw new Error(`Off-host backup readback checksum mismatch: ${relative}`);
    verified.push({ path: relative, bytes: remote.bytes.length, sha256: remoteHash });
  }
  return { bucket, prefix, verified };
}

export async function downloadOffHostBackup(destination, targetRoot) {
  const { bucket, prefix } = parseObjectStorageDestination(destination);
  const root = resolve(required(targetRoot, "targetRoot"));
  await mkdir(root, { recursive: true });
  const readRemote = async (relative) => getS3Object({ bucket, key: [prefix, safeRelativePath(relative)].filter(Boolean).join("/") });
  const manifestRemote = await readRemote("manifest.json");
  const manifest = JSON.parse(manifestRemote.bytes.toString("utf8"));
  await writeFile(resolve(root, "manifest.json"), manifestRemote.bytes, { flag: "wx" });
  const downloaded = [{ path: "manifest.json", bytes: manifestRemote.bytes.length, sha256: sha256(manifestRemote.bytes) }];
  for (const file of manifest.files || []) {
    const relative = safeRelativePath(file.path);
    const remote = await readRemote(relative);
    if (file.bytes !== undefined && Number(file.bytes) !== remote.bytes.length) throw new Error(`Off-host backup size mismatch: ${relative}`);
    if (file.sha256 && file.sha256 !== sha256(remote.bytes)) throw new Error(`Off-host backup checksum mismatch: ${relative}`);
    const target = resolve(root, relative);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, remote.bytes, { flag: "wx" });
    downloaded.push({ path: relative, bytes: remote.bytes.length, sha256: sha256(remote.bytes) });
  }
  return { root, bucket, prefix, downloaded };
}
