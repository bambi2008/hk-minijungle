import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { mkdir, rm } from "node:fs/promises";
import { join } from "node:path";

const host = "127.0.0.1";
const projectRoot = process.cwd();
const runtimeDir = join(projectRoot, ".ops-data-test");

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
      const response = await fetch(`${baseUrl}api/health`);
      if (response.ok) return;
      lastError = new Error(`Server returned ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 160));
  }

  throw lastError || new Error("Server did not start");
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const body = await response.json();
  return { response, body };
}

async function verifyApi(baseUrl) {
  const health = await fetchJson(`${baseUrl}api/health`);
  assert(health.response.ok, "Health endpoint failed");
  assert(health.body.status === "ok", "Health endpoint did not return ok status");
  assert(health.body.mode === "api-foundation", "Health endpoint did not expose API foundation mode");

  const portfolio = await fetchJson(`${baseUrl}api/portfolio`);
  assert(portfolio.response.ok, "Portfolio endpoint failed");
  assert(portfolio.body.counts.clients === 4, "Portfolio endpoint did not count clients");
  assert(portfolio.body.counts.assets === 4, "Portfolio endpoint did not count assets");
  assert(portfolio.body.counts.modules === 12, "Portfolio endpoint did not count modules");
  assert(portfolio.body.counts.activeSensorAlerts >= 1, "Portfolio endpoint did not count sensor alerts");
  assert(portfolio.body.counts.serverSideOpsEvents === 0, "Runtime event store should start empty in test mode");

  const assets = await fetchJson(`${baseUrl}api/assets`);
  assert(assets.response.ok, "Assets endpoint failed");
  assert(assets.body.assets.length === 4, "Assets endpoint did not return all assets");
  const showSuite = assets.body.assets.find((asset) => asset.id === "MJ-HK-021");
  assert(showSuite?.clientName === "Property Show Suite", "Assets endpoint did not join client data");
  assert(showSuite?.sensorAlerts >= 1, "Assets endpoint did not expose wall alert count");

  const eventCreate = await fetchJson(`${baseUrl}api/ops-events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "workorder.completed",
      actor: "API smoke test",
      entityType: "workorder",
      entityId: "WO-1047",
      clientId: "show-suite",
      wallId: "MJ-HK-021",
      note: "Server-side event persistence smoke test",
      payload: { source: "api-smoke-test" }
    })
  });
  assert(eventCreate.response.status === 201, "Event create endpoint did not return 201");
  assert(eventCreate.body.event.id?.startsWith("OPS-"), "Created event did not receive server ID");

  const events = await fetchJson(`${baseUrl}api/ops-events`);
  assert(events.response.ok, "Events endpoint failed");
  assert(events.body.events.length === 1, "Events endpoint did not persist created event");
  assert(events.body.events[0].entityId === "WO-1047", "Persisted event did not preserve entity ID");

  const updatedPortfolio = await fetchJson(`${baseUrl}api/portfolio`);
  assert(updatedPortfolio.body.counts.serverSideOpsEvents === 1, "Portfolio endpoint did not reflect server-side event count");
}

async function main() {
  await rm(runtimeDir, { recursive: true, force: true });
  await mkdir(runtimeDir, { recursive: true });

  const port = await getFreePort();
  const baseUrl = `http://${host}:${port}/`;
  const serverOutput = [];
  const server = spawn(process.execPath, ["server.mjs", "--port", String(port)], {
    cwd: projectRoot,
    env: {
      ...process.env,
      DR_FOREST_RUNTIME_DIR: runtimeDir
    },
    stdio: ["ignore", "pipe", "pipe"]
  });

  server.stdout.on("data", (chunk) => serverOutput.push(chunk.toString()));
  server.stderr.on("data", (chunk) => serverOutput.push(chunk.toString()));

  try {
    await waitForServer(baseUrl);
    await verifyApi(baseUrl);
    console.log(`API smoke test passed at ${baseUrl}`);
  } catch (error) {
    if (serverOutput.length) {
      console.error("Server output:");
      console.error(serverOutput.join(""));
    }
    throw error;
  } finally {
    server.kill();
    await rm(runtimeDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
