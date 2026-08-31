// Run once from the linked Vercel project. Never prints secret values.
import { randomBytes } from "node:crypto";
import { writeFile, readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
const path = ".env.feedback.secrets.local";
let content;
try { content = await readFile(path, "utf8"); }
catch (error) {
  if (error.code !== "ENOENT") throw error;
  content = ["FIVECROP_LEARNING_SECRET", "FIVECROP_REVIEW_TOKEN"].map((name) => `${name}=${randomBytes(32).toString("hex")}`).join("\n") + "\n";
  await writeFile(path, content, { flag: "wx", mode: 0o600 });
}
for (const line of content.trim().split("\n")) {
  const [name, value] = line.split("=");
  if (!["FIVECROP_LEARNING_SECRET", "FIVECROP_REVIEW_TOKEN"].includes(name) || !/^[a-f0-9]{64}$/.test(value)) throw Error("Invalid local secret configuration");
  const result = spawnSync("npx", ["--yes", "vercel@59.10.0", "env", "add", name, "production", "--yes"], { input: value, encoding: "utf8" });
  if (result.status !== 0) { console.error(`${name}: configuration failed; inspect Vercel environment names (values omitted)`); process.exit(1); }
  console.log(`${name}: configured (value hidden)`);
}
