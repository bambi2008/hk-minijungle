import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { chromium } from "playwright";

const host = "127.0.0.1";
const projectRoot = process.cwd();
const runtimeDir = join(projectRoot, ".ops-data-feedback-ui-test");
function assert(condition, message) { if (!condition) throw new Error(message); }
async function freePort() { return new Promise((resolve, reject) => { const probe = createServer(); probe.once("error", reject); probe.listen(0, host, () => { const address = probe.address(); const port = typeof address === "object" && address ? address.port : 0; probe.close(() => resolve(port)); }); }); }
async function waitForServer(url) { const deadline = Date.now() + 8000; while (Date.now() < deadline) { try { if ((await fetch(url)).ok) return; } catch {} await new Promise((resolve) => setTimeout(resolve, 150)); } throw new Error("Feedback UI smoke server did not start"); }
async function stopServer(server) { if (server.exitCode !== null) return; await new Promise((resolve) => { const timeout = setTimeout(resolve, 4000); server.once("exit", () => { clearTimeout(timeout); resolve(); }); server.kill(); }); }
async function main() {
  await rm(runtimeDir, { recursive: true, force: true }); await mkdir(runtimeDir, { recursive: true });
  const port = await freePort(); const baseUrl = `http://${host}:${port}`; const serverOutput = [];
  const server = spawn(process.execPath, ["server.mjs", "--port", String(port)], { cwd: projectRoot, env: { ...process.env, DR_FOREST_RUNTIME_DIR: runtimeDir }, stdio: ["ignore", "pipe", "pipe"] });
  server.stdout.on("data", (chunk) => serverOutput.push(String(chunk))); server.stderr.on("data", (chunk) => serverOutput.push(String(chunk)));
  try {
    await waitForServer(`${baseUrl}/`); const browser = await chromium.launch({ headless: true });
    try {
      const client = await browser.newPage({ viewport: { width: 1280, height: 900 } });
      await client.goto(`${baseUrl}/portal.html?role=client`); await client.waitForFunction(() => document.querySelector("#asset-state")?.textContent !== "Loading", null, { timeout: 30000 });
      await client.locator("#feedback-service-ref").fill("WO-1047"); await client.locator("#feedback-rating").selectOption("4"); await client.locator("#feedback-outcome").selectOption("follow_up_required"); await client.locator("#feedback-follow-up").check(); await client.locator("#feedback-comment").fill("Focused UI smoke feedback for follow-up scheduling."); await client.locator("#feedback-submit").click();
      await client.waitForFunction(() => document.querySelector("#feedback-notice")?.textContent.includes("Feedback received"), null, { timeout: 30000 });
      await client.waitForFunction(() => document.querySelector("#feedback-list")?.textContent.includes("WO-1047"), null, { timeout: 30000 });
      const clientText = await client.locator("#feedback-list").textContent(); assert(clientText.includes("WO-1047"), `Client feedback was not rendered: ${clientText} state=${await client.locator("#feedback-state").textContent()} notice=${await client.locator("#feedback-notice").textContent()}\n${serverOutput.join("")}`);
      const operations = await browser.newPage({ viewport: { width: 1280, height: 900 } }); await operations.goto(`${baseUrl}/operations.html`); await operations.waitForFunction(() => document.querySelector("#client-feedback-state")?.textContent !== "Loading", null, { timeout: 30000 });
      assert(await operations.locator(".client-feedback-item").count() === 1, "FM Today did not render feedback"); const item = operations.locator(".client-feedback-item").first(); await item.locator("[data-client-feedback-note]").fill("FM reviewed and scheduled the follow-up visit."); await item.locator("[data-client-feedback-review]").click(); await operations.waitForFunction(() => document.querySelector("#client-feedback-list")?.textContent.includes("acknowledged"), null, { timeout: 30000 });
      const acknowledged = operations.locator(".client-feedback-item").first(); await acknowledged.locator("[data-client-feedback-note]").fill("Follow-up window confirmed with the client."); await acknowledged.locator("[data-client-feedback-review]").click(); await operations.waitForFunction(() => document.querySelector("#client-feedback-list")?.textContent.includes("closed"), null, { timeout: 30000 }); assert((await operations.locator("#client-feedback-state").textContent()).includes("0 open"), "FM Today did not close feedback");
    } finally { await browser.close(); }
    console.log(`Client feedback UI smoke test passed at ${baseUrl}`);
  } finally { await stopServer(server); await rm(runtimeDir, { recursive: true, force: true }); }
}
main().catch((error) => { console.error(error.stack || error.message); process.exit(1); });
