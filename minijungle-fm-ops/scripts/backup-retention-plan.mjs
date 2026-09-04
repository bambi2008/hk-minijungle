import { readdir, readFile, rm } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { planBackupRetention, readBackupRetentionPolicy } from "../lib/ops-backup-retention-policy.mjs";

function option(name, fallback) { const index = process.argv.indexOf(name); return index >= 0 ? String(process.argv[index + 1] || "").trim() : fallback; }
const root = resolve(option("--root", process.env.DR_FOREST_BACKUP_DIR || "backups"));
const policy = readBackupRetentionPolicy();
const entries = [];
for (const entry of await readdir(root, { withFileTypes: true }).catch((error) => { if (error?.code === "ENOENT") return []; throw error; })) {
  if (!entry.isDirectory() || entry.name.startsWith(".")) continue;
  const manifest = await readFile(resolve(root, entry.name, "manifest.json"), "utf8").then(JSON.parse).catch(() => null);
  if (manifest?.createdAt) entries.push({ path: entry.name, createdAt: manifest.createdAt, bytes: manifest.files?.reduce((sum, file) => sum + Number(file.bytes || 0), 0) || 0 });
}
const plan = planBackupRetention(entries, policy);
let applied = [];
if (process.argv.includes("--apply")) {
  if (root === resolve(".") || root === resolve("/")) throw new Error("Refusing to apply retention at an unsafe backup root");
  for (const entry of plan.remove) {
    const target = resolve(root, entry.path);
    if (basename(target) !== entry.path || !target.startsWith(`${root}\\`) && !target.startsWith(`${root}/`)) throw new Error(`Unsafe retention target: ${target}`);
    await rm(target, { recursive: true, force: false });
    applied.push(entry.path);
  }
}
console.log(JSON.stringify({ ok: true, root, policy, dryRun: !process.argv.includes("--apply"), plan: { keep: plan.keep, remove: plan.remove }, applied }, null, 2));
