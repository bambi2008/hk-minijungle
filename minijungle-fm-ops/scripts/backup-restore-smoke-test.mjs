import { access, cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const sourceDb = join(projectRoot, ".ops-data", "ops-runtime.sqlite");
const tempRoot = await mkdtemp(join(tmpdir(), "dr-forest-backup-smoke-"));
const runtimeRoot = join(tempRoot, "runtime");
const backupRoot = join(tempRoot, "backups");
const runtimeDb = join(runtimeRoot, "ops-runtime.sqlite");

async function run(script, args, env) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [join(projectRoot, "scripts", script), ...args], {
      cwd: projectRoot,
      env: { ...process.env, ...env },
      stdio: ["ignore", "pipe", "pipe"]
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.once("error", reject);
    child.once("close", (code) => {
      if (code !== 0) reject(new Error(`${script} exited ${code}: ${stderr || stdout}`));
      else resolve({ stdout, stderr });
    });
  });
}

try {
  await cp(sourceDb, runtimeDb);
  const backup = await run("backup-runtime.mjs", ["--out", backupRoot], {
    DR_FOREST_ENV: "pilot",
    DR_FOREST_RUNTIME_DIR: runtimeRoot,
    DR_FOREST_RUNTIME_DB_PATH: runtimeDb,
    DR_FOREST_BACKUP_DIR: backupRoot
  });
  const backupOutput = JSON.parse(backup.stdout);
  const manifest = JSON.parse(await readFile(join(backupRoot, "manifest.json"), "utf8"));
  if (manifest.version !== "2026-08-23.runtime-backup-v2") throw new Error("Backup manifest version did not advance");
  if (manifest.consistency?.method !== "sqlite-vacuum-into" || manifest.consistency?.sourceIntegrity !== "ok") throw new Error("Backup did not record a consistent SQLite snapshot");
  const verify = await run("restore-runtime.mjs", ["--backup", backupRoot, "--verify-only"], {
    DR_FOREST_ENV: "pilot",
    DR_FOREST_RUNTIME_DIR: runtimeRoot,
    DR_FOREST_RUNTIME_DB_PATH: runtimeDb
  });
  const verifyOutput = JSON.parse(verify.stdout);
  if (!verifyOutput.ok || verifyOutput.databaseIntegrity !== "ok") throw new Error("Restore verification did not validate database integrity");
  await access(join(backupRoot, "manifest.json"));
  console.log(JSON.stringify({ ok: true, snapshot: manifest.consistency.method, sourceIntegrity: manifest.consistency.sourceIntegrity, databaseIntegrity: verifyOutput.databaseIntegrity, files: backupOutput.files }, null, 2));
} finally {
  await rm(tempRoot, { recursive: true, force: true });
}
