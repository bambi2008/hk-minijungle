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
    const title = await page.textContent("h1");
    assert(title?.includes("Living Wall Control Center"), "Unexpected main title");

    await page.click("#generate-report-btn");
    await page.waitForTimeout(150);
    const reportStatus = await page.textContent("#report-status");
    assert(reportStatus?.includes("Generated"), "ESG report action did not update status");

    await page.click('[data-client-select="show-suite"]');
    await page.waitForTimeout(150);
    const wallTitle = await page.textContent("#wall-detail-title");
    assert(wallTitle?.includes("MJ-HK-021"), "Client selection did not update selected wall");

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
