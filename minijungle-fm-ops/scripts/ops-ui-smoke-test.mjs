import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { chromium } from "playwright";

const host = "127.0.0.1";
const projectRoot = process.cwd();
const runtimeDir = join(projectRoot, ".ops-data-ui-test");
function assert(condition, message) { if (!condition) throw new Error(message); }
async function freePort() { return new Promise((resolve, reject) => { const probe = createServer(); probe.once("error", reject); probe.listen(0, host, () => { const address = probe.address(); const port = typeof address === "object" && address ? address.port : 0; probe.close(() => resolve(port)); }); }); }
async function waitForServer(url) { const deadline = Date.now() + 8000; while (Date.now() < deadline) { try { if ((await fetch(url)).ok) return; } catch {} await new Promise((resolve) => setTimeout(resolve, 150)); } throw new Error("UI smoke server did not start"); }
async function main() {
  await rm(runtimeDir, { recursive: true, force: true });
  await mkdir(runtimeDir, { recursive: true });
  const port = await freePort();
  const baseUrl = `http://${host}:${port}`;
  const server = spawn(process.execPath, ["server.mjs", "--port", String(port)], { cwd: projectRoot, env: { ...process.env, DR_FOREST_RUNTIME_DIR: runtimeDir }, stdio: "ignore" });
  try {
    await waitForServer(`${baseUrl}/`);
    const browser = await chromium.launch({ headless: true });
    try {
      for (const path of ["/operations.html", "/mobile.html", "/admin.html", "/portal.html?role=client", "/portal.html?role=auditor"]) assert((await fetch(`${baseUrl}${path}`)).ok, `${path} did not return 200`);
      const operations = await browser.newPage({ viewport: { width: 1280, height: 900 } });
      const operationsErrors = []; operations.on("console", (message) => { if (message.type() === "error") operationsErrors.push(message.text()); }); operations.on("pageerror", (error) => operationsErrors.push(error.message));
      await operations.goto(`${baseUrl}/operations.html`); await operations.waitForFunction(() => document.querySelector("#open-count")?.textContent !== "--", null, { timeout: 5000 });
      assert(await operations.locator(".route-item").count() === 4, "Operations page did not load four route stops");
      assert(await operations.locator(".module-item").count() === 12, "Operations page did not load module health rows");
      assert(await operations.locator("#capture-list").textContent().then((text) => text.includes("No technician records") || operations.locator(".capture-item").count() > 0), "Operations page did not load field evidence panel");
      assert(await operations.locator("#notification-state").textContent().then((text) => text.includes("due")), "Operations page did not load notification delivery state");
      assert(await operations.locator("#notification-list").textContent().then((text) => text.includes("No outbound notifications") || operations.locator(".notification-item").count() > 0), "Operations page did not load notification queue");
      assert(!operationsErrors.length, `Operations page errors: ${operationsErrors.join(" | ")}`);
      const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
      const mobileErrors = []; mobile.on("console", (message) => { if (message.type() === "error") mobileErrors.push(message.text()); }); mobile.on("pageerror", (error) => mobileErrors.push(error.message));
      await mobile.goto(`${baseUrl}/mobile.html`); await mobile.evaluate(() => localStorage.removeItem("dr-forest.field-capture.queue.v3")); await mobile.waitForFunction(() => document.querySelectorAll(".stop").length > 0, null, { timeout: 5000 }); await mobile.locator(".stop").first().click(); await mobile.waitForTimeout(300);
      assert(await mobile.locator(".reminder").count() > 0, "Technician app did not load reminders");
      assert(await mobile.locator("#module option").count() > 1, "Technician app did not load module selector");
      assert(await mobile.locator(".stop-signal").count() === await mobile.locator(".stop").count(), "Technician route did not expose operational signals");
      assert(await mobile.locator("#capture-context").textContent().then((text) => text.trim().length > 0), "Technician capture context did not load");
      await mobile.locator("#module").selectOption({ index: 1 }); await mobile.waitForTimeout(150);
      assert(await mobile.locator("#module-status span").count() === 4, "Technician module status did not expose four monitoring metrics");
      await mobile.locator("#queue").click(); await mobile.waitForTimeout(150);
      assert(await mobile.locator("#queue-count").textContent() === "1", "Technician app did not persist an offline capture");
      assert((await mobile.locator("#queue-list").textContent()).includes("pending"), "Offline capture did not expose queue status");
      await mobile.locator("#exception").check(); await mobile.locator("#queue").click(); await mobile.waitForTimeout(100);
      assert((await mobile.locator("#sync-state").textContent()).includes("Add a short note"), "Technician exception capture accepted a missing note");
      await mobile.locator("#notes").fill("Access panel needs follow-up"); await mobile.locator("#queue").click(); await mobile.waitForTimeout(150);
      assert(await mobile.locator("#queue-count").textContent() === "2", "Technician exception capture did not persist offline");
      assert(await mobile.evaluate(() => JSON.parse(localStorage.getItem("dr-forest.field-capture.queue.v3")).some((item) => item.exception === true)), "Offline queue did not retain the exception flag");
      assert(await mobile.evaluate(() => Boolean(localStorage.getItem("dr-forest.field-route.snapshot.v1"))), "Technician app did not cache the last route snapshot");
      await mobile.route("**/api/mobile/*", (request) => request.abort()); await mobile.reload({ waitUntil: "domcontentloaded" }); await mobile.waitForFunction(() => document.querySelector("#sync-state")?.textContent.toLowerCase().includes("cached"), null, { timeout: 5000 });
      assert(await mobile.locator(".stop").count() > 0, "Technician app did not reopen the cached route while offline"); await mobile.unroute("**/api/mobile/*");
      const unexpectedMobileErrors = mobileErrors.filter((error) => !error.includes("net::ERR_FAILED"));
      assert(!unexpectedMobileErrors.length, `Technician app errors: ${unexpectedMobileErrors.join(" | ")}`);
      const clientPortal = await browser.newPage({ viewport: { width: 1280, height: 900 } });
      const clientPortalErrors = []; clientPortal.on("console", (message) => { if (message.type() === "error") clientPortalErrors.push(message.text()); }); clientPortal.on("pageerror", (error) => clientPortalErrors.push(error.message));
      await clientPortal.goto(`${baseUrl}/portal.html?role=client`); await clientPortal.waitForFunction(() => document.querySelector("#asset-state")?.textContent !== "Loading", null, { timeout: 5000 });
      assert(await clientPortal.locator(".asset-row").count() === 1, "Client portal did not keep the client scope");
      assert(await clientPortal.locator("#capture-count").textContent() !== "--", "Client portal did not load field capture count");
      assert(await clientPortal.locator("#capture-list").textContent().then((text) => text.includes("No synced field captures") || clientPortal.locator(".capture-row").count() > 0), "Client portal did not render field capture chain");
      assert(await clientPortal.locator("#auditor-panel").getAttribute("hidden") !== null, "Client portal exposed the auditor panel");
      assert(await clientPortal.locator("#export").isEnabled(), "Client portal did not enable evidence export");
      const [clientDownload] = await Promise.all([clientPortal.waitForEvent("download"), clientPortal.locator("#export").click()]);
      assert(clientDownload.suggestedFilename().includes("evidence-client"), "Client evidence export filename was not role-scoped"); await clientDownload.delete();
      assert(!clientPortalErrors.length, `Client portal errors: ${clientPortalErrors.join(" | ")}`);
      const auditorPortal = await browser.newPage({ viewport: { width: 1280, height: 900 } });
      const auditorPortalErrors = []; auditorPortal.on("console", (message) => { if (message.type() === "error") auditorPortalErrors.push(message.text()); }); auditorPortal.on("pageerror", (error) => auditorPortalErrors.push(error.message));
      await auditorPortal.goto(`${baseUrl}/portal.html?role=auditor`); await auditorPortal.waitForFunction(() => document.querySelector("#quality-status")?.textContent !== "Loading", null, { timeout: 5000 });
      assert(await auditorPortal.locator("#auditor-panel").isVisible(), "Auditor portal did not expose data quality review");
      assert(await auditorPortal.locator("#capture-list").textContent().then((text) => text.includes("No synced field captures") || auditorPortal.locator(".capture-row").count() > 0), "Auditor portal did not render field capture chain");
      assert(await auditorPortal.locator("#export").isEnabled(), "Auditor portal did not enable evidence export");
      const [auditorDownload] = await Promise.all([auditorPortal.waitForEvent("download"), auditorPortal.locator("#export").click()]);
      assert(auditorDownload.suggestedFilename().includes("evidence-auditor"), "Auditor evidence export filename was not role-scoped"); await auditorDownload.delete();
      assert(!auditorPortalErrors.length, `Auditor portal errors: ${auditorPortalErrors.join(" | ")}`);
      const admin = await browser.newPage({ viewport: { width: 1280, height: 900 } });
      const adminErrors = []; admin.on("console", (message) => { if (message.type() === "error") adminErrors.push(message.text()); }); admin.on("pageerror", (error) => adminErrors.push(error.message));
      await admin.goto(`${baseUrl}/admin.html`); await admin.waitForFunction(() => document.querySelectorAll("#clients-list tbody tr").length === 4, null, { timeout: 5000 }); await admin.locator("[data-tab=modules]").click();
      assert(await admin.locator("#modules-list tbody tr").count() === 12, "Admin page did not load module master data");
      assert(!adminErrors.length, `Admin page errors: ${adminErrors.join(" | ")}`);
    } finally { await browser.close(); }
    console.log(`Ops UI smoke test passed at ${baseUrl}`);
  } finally { server.kill(); await rm(runtimeDir, { recursive: true, force: true }); }
}
main().catch((error) => { console.error(error.stack || error.message); process.exit(1); });
