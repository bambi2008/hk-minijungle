import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { chromium } from "playwright";

const host = "127.0.0.1";
const projectRoot = process.cwd();

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function getFreePort() {
  return new Promise((resolve, reject) => {
    const probe = createServer();
    probe.once("error", reject);
    probe.listen(0, host, () => {
      const address = probe.address();
      const port = typeof address === "object" && address ? address.port : 0;
      probe.close(() => resolve(port));
    });
  });
}

async function waitForServer(baseUrl) {
  const deadline = Date.now() + 8000;
  let lastError = null;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(baseUrl);
      if (response.ok) return;
      lastError = new Error(`Server returned ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 160));
  }

  throw lastError || new Error("Server did not start");
}

async function verifyResource(baseUrl, path, expectedType) {
  const response = await fetch(`${baseUrl}${path}`);
  const body = await response.text();
  const contentType = response.headers.get("content-type") || "";

  assert(response.ok, `${path} returned ${response.status}`);
  assert(body.length > 0, `${path} returned an empty body`);
  assert(contentType.includes(expectedType), `${path} returned ${contentType}`);
}

async function verifyBrowserFlow(baseUrl) {
  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
    const errors = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("pageerror", (error) => errors.push(error.message));

    await page.goto(baseUrl, { waitUntil: "networkidle" });
    await page.evaluate(() => localStorage.removeItem("minijungle-fm-ops.workorder-completions.v1"));
    await page.evaluate(() => localStorage.removeItem("minijungle-fm-ops.dispatch-staging.v1"));
    await page.evaluate(() => localStorage.removeItem("minijungle-fm-ops.proof-approvals.v1"));
    await page.evaluate(() => localStorage.removeItem("minijungle-fm-ops.sensor-acknowledgements.v1"));
    await page.evaluate(() => localStorage.removeItem("minijungle-fm-ops.supply-requests.v1"));
    await page.reload({ waitUntil: "networkidle" });
    const title = await page.textContent("h1");
    assert(title?.includes("Living Wall Control Center"), "Unexpected main title");

    const sensorCardBefore = await page.textContent('[data-sensor-card="SNS-021-LIGHT"]');
    assert(sensorCardBefore?.includes("alert"), "Sensor monitor did not load the light alert");
    await page.click('[data-ack-sensor="SNS-021-LIGHT"]');
    await page.waitForTimeout(150);
    const sensorCardAfter = await page.textContent('[data-sensor-card="SNS-021-LIGHT"]');
    assert(sensorCardAfter?.includes("Acknowledged"), "Acknowledging sensor alert did not update sensor card");

    const supplyCardBefore = await page.textContent('[data-supply-card="NUT-A"]');
    assert(supplyCardBefore?.includes("Reorder now"), "Inventory control did not flag low nutrient stock");
    await page.click('[data-request-supply="NUT-A"]');
    await page.waitForTimeout(150);
    const supplyCardAfter = await page.textContent('[data-supply-card="NUT-A"]');
    assert(supplyCardAfter?.includes("Reorder requested"), "Requesting reorder did not update supply card");

    const proofCardBefore = await page.textContent('[data-proof-card="PRF-1047"]');
    assert(proofCardBefore?.includes("Needs review"), "Proof vault did not load review state");
    await page.click('[data-approve-proof="PRF-1047"]');
    await page.waitForTimeout(150);
    const proofCardAfter = await page.textContent('[data-proof-card="PRF-1047"]');
    assert(proofCardAfter?.includes("Approved"), "Approving proof did not update proof card");

    const commercialCard = await page.textContent('[data-commercial-card="show-suite"]');
    assert(commercialCard?.includes("Save plan"), "Commercial desk did not flag show suite renewal risk");
    await page.click('[data-renewal-pack="show-suite"]');
    await page.waitForTimeout(150);
    const renewalTitle = await page.textContent("#report-title");
    assert(renewalTitle?.includes("Property Show Suite"), "Renewal pack action did not select the client");
    assert(renewalTitle?.includes("Renewal Value"), "Renewal pack action did not select renewal report mode");

    await page.click("#generate-report-btn");
    await page.waitForTimeout(150);
    const reportStatus = await page.textContent("#report-status");
    assert(reportStatus?.includes("Generated"), "ESG report action did not update status");

    await page.click('[data-client-select="show-suite"]');
    await page.waitForTimeout(150);
    const wallTitle = await page.textContent("#wall-detail-title");
    assert(wallTitle?.includes("MJ-HK-021"), "Client selection did not update selected wall");

    await page.click('#dispatch [data-stage-dispatch="WO-1047"]');
    await page.waitForTimeout(150);
    const stagedCard = await page.textContent('[data-dispatch-card="WO-1047"]');
    assert(stagedCard?.includes("Kit staged"), "Dispatch staging did not update route card");

    await page.click('#workorder-list [data-complete-workorder="WO-1047"]');
    await page.waitForTimeout(150);
    const completedCard = await page.textContent('[data-workorder-card="WO-1047"]');
    assert(completedCard?.includes("Completed"), "Completing work order did not update service card");
    const completedDispatchCard = await page.textContent('[data-dispatch-card="WO-1047"]');
    assert(completedDispatchCard?.includes("Completed"), "Completing work order did not update dispatch card");

    await page.selectOption("#report-client-select", "show-suite");
    await page.selectOption("#report-month-select", "2026-05");
    await page.waitForTimeout(150);
    const reportTitle = await page.textContent("#report-title");
    assert(reportTitle?.includes("Property Show Suite"), "Report client selection did not update title");
    const reportPeriod = await page.textContent("#report-period");
    assert(reportPeriod?.includes("May 2026"), "Report month selection did not update period");
    const completedMetric = await page
      .locator("#report-metrics .report-metric")
      .filter({ hasText: "Completed work orders" })
      .textContent();
    assert(completedMetric?.includes("1"), "Completed work order metric did not update");
    const approvedProofMetric = await page
      .locator("#report-metrics .report-metric")
      .filter({ hasText: "Approved proof" })
      .textContent();
    assert(approvedProofMetric?.includes("1"), "Approved proof metric did not update");

    const downloadPromise = page.waitForEvent("download");
    await page.click("#download-report-btn");
    const download = await downloadPromise;
    assert(download.suggestedFilename().includes("show-suite-2026-05"), "Report download filename is not client/month scoped");

    await page.click('[data-filter="risk"]');
    await page.waitForTimeout(150);
    const riskWallCount = await page.locator(".wall-card").count();
    assert(riskWallCount === 2, `Risk filter expected 2 walls, found ${riskWallCount}`);

    await page.click("#simulate-visit-btn");
    await page.waitForTimeout(150);
    const syncStatus = await page.textContent("#sync-status");
    assert(syncStatus?.includes("completed visit"), "Visit simulation did not update sync status");

    assert(errors.length === 0, `Console/page errors: ${errors.join(" | ")}`);
  } finally {
    await browser.close();
  }
}

async function main() {
  const port = await getFreePort();
  const baseUrl = `http://${host}:${port}/`;
  const serverOutput = [];
  const server = spawn(process.execPath, ["server.mjs", "--port", String(port)], {
    cwd: projectRoot,
    stdio: ["ignore", "pipe", "pipe"]
  });
  server.stdout.on("data", (chunk) => serverOutput.push(chunk.toString()));
  server.stderr.on("data", (chunk) => serverOutput.push(chunk.toString()));
  server.on("exit", (code) => {
    if (code && process.exitCode !== 1) {
      console.error(`Server exited with code ${code}`);
    }
  });

  try {
    await waitForServer(baseUrl);
    await verifyResource(baseUrl, "/", "text/html");
    await verifyResource(baseUrl, "/styles.css", "text/css");
    await verifyResource(baseUrl, "/app.js", "text/javascript");
    await verifyResource(baseUrl, "/data/clients.json", "application/json");
    await verifyResource(baseUrl, "/data/walls.json", "application/json");
    await verifyResource(baseUrl, "/data/workorders.json", "application/json");
    await verifyResource(baseUrl, "/data/diagnoses.json", "application/json");
    await verifyResource(baseUrl, "/data/dispatch.json", "application/json");
    await verifyResource(baseUrl, "/data/commercial.json", "application/json");
    await verifyResource(baseUrl, "/data/proof.json", "application/json");
    await verifyResource(baseUrl, "/data/sensors.json", "application/json");
    await verifyResource(baseUrl, "/data/supply.json", "application/json");
    await verifyResource(baseUrl, "/data/esg-metrics.json", "application/json");
    await verifyResource(baseUrl, "/data/product-model.json", "application/json");
    await verifyBrowserFlow(baseUrl);
    console.log(`Smoke test passed at ${baseUrl}`);
  } catch (error) {
    if (serverOutput.length) {
      console.error("Server output:");
      console.error(serverOutput.join(""));
    }
    throw error;
  } finally {
    server.kill();
  }
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
