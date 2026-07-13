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
    await page.evaluate(() => localStorage.removeItem("dr-forest-fm-ops.workorder-completions.v1"));
    await page.evaluate(() => localStorage.removeItem("dr-forest-fm-ops.dispatch-staging.v1"));
    await page.evaluate(() => localStorage.removeItem("dr-forest-fm-ops.proof-approvals.v1"));
    await page.evaluate(() => localStorage.removeItem("dr-forest-fm-ops.sensor-acknowledgements.v1"));
    await page.evaluate(() => localStorage.removeItem("dr-forest-fm-ops.supply-requests.v1"));
    await page.evaluate(() => localStorage.removeItem("dr-forest-fm-ops.invoice-payments.v1"));
    await page.evaluate(() => localStorage.removeItem("dr-forest-fm-ops.schedule-confirmations.v1"));
    await page.evaluate(() => localStorage.removeItem("dr-forest-fm-ops.incident-resolutions.v1"));
    await page.evaluate(() => localStorage.removeItem("dr-forest-fm-ops.compliance-clearances.v1"));
    await page.evaluate(() => localStorage.removeItem("dr-forest-fm-ops.active-role.v1"));
    await page.evaluate(() => localStorage.removeItem("dr-forest-fm-ops.quick-ops-tasks.v1"));
    await page.evaluate(() => localStorage.removeItem("dr-forest-fm-ops.audit-events.v1"));
    await page.evaluate(() => localStorage.removeItem("dr-forest-fm-ops.ai-queued-actions.v1"));
    await page.reload({ waitUntil: "networkidle" });
    const title = await page.textContent("h1");
    assert(title?.includes("DR FOREST Living Asset OS"), "Unexpected main title");
    const logoCount = await page.locator('img[src="assets/dr-forest-logo.png"]').count();
    assert(logoCount >= 2, `Expected logo in brand and hero, found ${logoCount}`);
    const navText = await page.textContent(".side-nav nav");
    assert(navText?.includes("导读"), "Bilingual navigation did not load");
    const guideText = await page.textContent("#guide");
    assert(guideText?.includes("中文导读"), "Bilingual guide did not load");
    assert(guideText?.includes("正式发布"), "Bilingual release note did not load");
    const aiText = await page.textContent("#ai");
    assert(aiText?.includes("AI Command Center"), "AI Command Center did not load");
    assert(aiText?.includes("AI-CARE-021"), "AI recommendation queue did not load care recommendation");
    assert(aiText?.includes("Human-in-the-loop"), "AI governance did not load human review rule");
    await page.click('[data-queue-ai-action="AI-ESG-001"]');
    await page.waitForTimeout(150);
    const queuedAiCard = await page.textContent('[data-ai-card="AI-ESG-001"]');
    assert(queuedAiCard?.includes("Queued for review"), "Queuing AI recommendation did not update card");
    const aiAudit = await page.textContent("#audit-event-list");
    assert(aiAudit?.includes("AI recommendation queued"), "AI recommendation did not create audit event");
    const healthText = await page.textContent("#health");
    assert(healthText?.includes("Health Score Method"), "Health Score Method section did not load");
    assert(healthText?.includes("Visual AI condition"), "Health score formula did not load visual AI component");
    assert(healthText?.includes("45%"), "Health score visual AI weight did not load");
    assert(healthText?.includes("Mobile phone camera"), "Health camera MVP strategy did not load");
    assert(healthText?.includes("Built-in camera"), "Health score camera stance did not load");
    const spatialText = await page.textContent("#space");
    assert(spatialText?.includes("Space Design Intelligence"), "Space Design Intelligence section did not load");
    assert(spatialText?.includes("Architect and interior designer"), "Spatial design expertise did not load");
    assert(spatialText?.includes("Spatial Diagnosis"), "Spatial diagnosis panel did not load");
    assert(spatialText?.includes("Before / after view"), "Spatial proof pack did not load before/after evidence");
    const impactText = await page.textContent("#impact");
    assert(impactText?.includes("Xponge, Workplace and Brand Impact"), "Impact Value section did not load");
    assert(impactText?.includes("Xponge Health & Safety"), "Xponge health-safety pillar did not load");
    assert(impactText?.includes("Workplace Wellbeing Impact"), "Workplace wellbeing pillar did not load");
    assert(impactText?.includes("Green Brand Asset Value"), "Green brand asset pillar did not load");
    assert(impactText?.includes("Chemical intervention control"), "Impact evidence pack did not load chemical intervention control");
    const esgText = await page.textContent("#esg");
    assert(esgText?.includes("可持续统计"), "Bilingual ESG section did not load");
    assert(esgText?.includes("Recognized Proof Pack"), "ESG proof pack governance did not load");
    assert(esgText?.includes("Xponge health-safety evidence"), "ESG proof pack did not load Xponge evidence");
    assert(esgText?.includes("HKEX ESG Reporting Code"), "ESG framework mapping did not load");
    const reportTabsText = await page.textContent("#report-tabs");
    assert(reportTabsText?.includes("Impact Value"), "Report Center did not load Impact Value report mode");
    const platformStatus = await page.textContent("#platform-status");
    assert(platformStatus?.includes("expansion classes"), "Platform status did not load expansion scope");
    const assetScope = await page.textContent("#asset-scope-list");
    assert(assetScope?.includes("DR FOREST Wall"), "Asset scope did not include Wall wedge");
    assert(assetScope?.includes("Plant Pod / Pot Rental"), "Asset scope did not include next DR FOREST product class");
    const benchmarkList = await page.textContent("#investor-benchmark-list");
    assert(benchmarkList?.includes("MaintainX"), "Investor benchmark mapping did not load MaintainX");
    assert(benchmarkList?.includes("Measurabl"), "Investor benchmark mapping did not load Measurabl");

    const sensorCardBefore = await page.textContent('[data-sensor-card="SNS-021-LIGHT"]');
    assert(sensorCardBefore?.includes("alert"), "Sensor monitor did not load the light alert");
    await page.click('[data-ack-sensor="SNS-021-LIGHT"]');
    await page.waitForTimeout(150);
    const sensorCardAfter = await page.textContent('[data-sensor-card="SNS-021-LIGHT"]');
    assert(sensorCardAfter?.includes("Acknowledged"), "Acknowledging sensor alert did not update sensor card");
    const sensorAudit = await page.textContent("#audit-event-list");
    assert(sensorAudit?.includes("Sensor alert acknowledged"), "Sensor acknowledgement did not create audit event");

    const supplyCardBefore = await page.textContent('[data-supply-card="NUT-A"]');
    assert(supplyCardBefore?.includes("Reorder now"), "Inventory control did not flag low nutrient stock");
    await page.click('[data-request-supply="NUT-A"]');
    await page.waitForTimeout(150);
    const supplyCardAfter = await page.textContent('[data-supply-card="NUT-A"]');
    assert(supplyCardAfter?.includes("Reorder requested"), "Requesting reorder did not update supply card");
    const supplyAudit = await page.textContent("#audit-event-list");
    assert(supplyAudit?.includes("Supply reorder requested"), "Supply reorder did not create audit event");

    const proofCardBefore = await page.textContent('[data-proof-card="PRF-1047"]');
    assert(proofCardBefore?.includes("Needs review"), "Proof vault did not load review state");
    await page.click('[data-approve-proof="PRF-1047"]');
    await page.waitForTimeout(150);
    const proofCardAfter = await page.textContent('[data-proof-card="PRF-1047"]');
    assert(proofCardAfter?.includes("Approved"), "Approving proof did not update proof card");

    const invoiceCardBefore = await page.textContent('[data-invoice-card="INV-2026-071"]');
    assert(invoiceCardBefore?.includes("Overdue"), "Billing center did not load overdue show-suite invoice");
    await page.click('[data-mark-invoice-paid="INV-2026-071"]');
    await page.waitForTimeout(150);
    const invoiceCardAfter = await page.textContent('[data-invoice-card="INV-2026-071"]');
    assert(invoiceCardAfter?.includes("Paid"), "Marking invoice paid did not update invoice card");
    const invoiceAudit = await page.textContent("#audit-event-list");
    assert(invoiceAudit?.includes("Invoice marked paid"), "Invoice payment did not create audit event");

    const scheduleCardBefore = await page.textContent('[data-schedule-card="SCH-2026-072"]');
    assert(scheduleCardBefore?.includes("At risk"), "Service calendar did not load at-risk show-suite slot");
    await page.click('[data-confirm-schedule="SCH-2026-072"]');
    await page.waitForTimeout(150);
    const scheduleCardAfter = await page.textContent('[data-schedule-card="SCH-2026-072"]');
    assert(scheduleCardAfter?.includes("Confirmed"), "Confirming schedule slot did not update calendar card");
    const scheduleAudit = await page.textContent("#audit-event-list");
    assert(scheduleAudit?.includes("Visit slot confirmed"), "Schedule confirmation did not create audit event");

    const incidentCardBefore = await page.textContent('[data-incident-card="INC-2026-021"]');
    assert(incidentCardBefore?.includes("Escalated"), "Incident center did not load escalated show-suite incident");
    await page.click('[data-resolve-incident="INC-2026-021"]');
    await page.waitForTimeout(150);
    const incidentCardAfter = await page.textContent('[data-incident-card="INC-2026-021"]');
    assert(incidentCardAfter?.includes("Resolved"), "Resolving incident did not update incident card");
    const incidentAudit = await page.textContent("#audit-event-list");
    assert(incidentAudit?.includes("Incident resolved"), "Incident resolution did not create audit event");

    const complianceCardBefore = await page.textContent('[data-compliance-card="CMP-2026-021"]');
    assert(complianceCardBefore?.includes("Blocked"), "Compliance center did not load blocked show-suite item");
    await page.click('[data-clear-compliance="CMP-2026-021"]');
    await page.waitForTimeout(150);
    const complianceCardAfter = await page.textContent('[data-compliance-card="CMP-2026-021"]');
    assert(complianceCardAfter?.includes("Cleared"), "Clearing compliance item did not update card");
    const complianceAudit = await page.textContent("#audit-event-list");
    assert(complianceAudit?.includes("Compliance item cleared"), "Compliance clearance did not create audit event");

    await page.selectOption("#active-role-select", "field-tech");
    await page.waitForTimeout(150);
    const roleDetail = await page.textContent("#active-role-detail");
    assert(roleDetail?.includes("Field Technician"), "Role switch did not update active role detail");
    const roleAudit = await page.textContent("#audit-event-list");
    assert(roleAudit?.includes("Operator role switched"), "Role switch did not create audit event");

    await page.selectOption("#quick-client-select", "show-suite");
    await page.selectOption("#quick-template-select", "QO-CARE");
    await page.selectOption("#quick-priority-select", "high");
    await page.fill("#quick-note-input", "Smoke created service note");
    await page.click("#create-quick-task-btn");
    await page.waitForTimeout(150);
    const quickTaskCreated = await page.textContent("#quick-task-list");
    assert(quickTaskCreated?.includes("Smoke created service note"), "Quick task creation did not update task list");
    assert(quickTaskCreated?.includes("Open"), "Quick task was not created in open state");
    const quickTaskAudit = await page.textContent("#audit-event-list");
    assert(quickTaskAudit?.includes("Quick task created"), "Quick task creation did not create audit event");
    await page.click("#quick-task-list [data-close-quick-task]");
    await page.waitForTimeout(150);
    const quickTaskClosed = await page.textContent("#quick-task-list");
    assert(quickTaskClosed?.includes("Closed"), "Closing quick task did not update task list");
    const quickTaskClosedAudit = await page.textContent("#audit-event-list");
    assert(quickTaskClosedAudit?.includes("Quick task closed"), "Quick task closure did not create audit event");

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
    const outstandingMetric = await page
      .locator("#report-metrics .report-metric")
      .filter({ hasText: "Outstanding AR" })
      .textContent();
    assert(outstandingMetric?.includes("HK$0"), "Outstanding AR metric did not update after payment");
    const paidInvoiceMetric = await page
      .locator("#report-metrics .report-metric")
      .filter({ hasText: "Paid invoices" })
      .textContent();
    assert(paidInvoiceMetric?.includes("1"), "Paid invoice metric did not update");
    const confirmedVisitsMetric = await page
      .locator("#report-metrics .report-metric")
      .filter({ hasText: "Confirmed visits" })
      .textContent();
    assert(confirmedVisitsMetric?.includes("1"), "Confirmed visits metric did not update");
    const openVisitSlotsMetric = await page
      .locator("#report-metrics .report-metric")
      .filter({ hasText: "Open visit slots" })
      .textContent();
    assert(openVisitSlotsMetric?.includes("0"), "Open visit slots metric did not update");
    const openIncidentsMetric = await page
      .locator("#report-metrics .report-metric")
      .filter({ hasText: "Open incidents" })
      .textContent();
    assert(openIncidentsMetric?.includes("0"), "Open incident metric did not update after resolution");
    const resolvedIncidentsMetric = await page
      .locator("#report-metrics .report-metric")
      .filter({ hasText: "Resolved incidents" })
      .textContent();
    assert(resolvedIncidentsMetric?.includes("1"), "Resolved incident metric did not update");
    const openComplianceMetric = await page
      .locator("#report-metrics .report-metric")
      .filter({ hasText: "Open compliance" })
      .textContent();
    assert(openComplianceMetric?.includes("0"), "Open compliance metric did not update after clearance");
    const clearedComplianceMetric = await page
      .locator("#report-metrics .report-metric")
      .filter({ hasText: "Cleared compliance" })
      .textContent();
    assert(clearedComplianceMetric?.includes("1"), "Cleared compliance metric did not update");
    const openQuickTasksMetric = await page
      .locator("#report-metrics .report-metric")
      .filter({ hasText: "Open quick tasks" })
      .textContent();
    assert(openQuickTasksMetric?.includes("0"), "Open quick task metric did not update after closure");
    const closedQuickTasksMetric = await page
      .locator("#report-metrics .report-metric")
      .filter({ hasText: "Closed quick tasks" })
      .textContent();
    assert(closedQuickTasksMetric?.includes("1"), "Closed quick task metric did not update");
    const auditMetric = await page
      .locator("#report-metrics .report-metric")
      .filter({ hasText: "Audit events" })
      .textContent();
    assert(auditMetric?.includes("11"), "Client-linked audit event metric did not update");

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
    await verifyResource(baseUrl, "/data/schedule.json", "application/json");
    await verifyResource(baseUrl, "/data/incidents.json", "application/json");
    await verifyResource(baseUrl, "/data/compliance.json", "application/json");
    await verifyResource(baseUrl, "/data/dispatch.json", "application/json");
    await verifyResource(baseUrl, "/data/commercial.json", "application/json");
    await verifyResource(baseUrl, "/data/billing.json", "application/json");
    await verifyResource(baseUrl, "/data/proof.json", "application/json");
    await verifyResource(baseUrl, "/data/sensors.json", "application/json");
    await verifyResource(baseUrl, "/data/supply.json", "application/json");
    await verifyResource(baseUrl, "/data/audit.json", "application/json");
    await verifyResource(baseUrl, "/data/mvp-control.json", "application/json");
    await verifyResource(baseUrl, "/data/esg-metrics.json", "application/json");
    await verifyResource(baseUrl, "/data/product-model.json", "application/json");
    await verifyResource(baseUrl, "/data/ai-insights.json", "application/json");
    await verifyResource(baseUrl, "/data/health-score.json", "application/json");
    await verifyResource(baseUrl, "/data/spatial-design.json", "application/json");
    await verifyResource(baseUrl, "/data/impact-value.json", "application/json");
    await verifyResource(baseUrl, "/assets/dr-forest-logo.png", "image/png");
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
