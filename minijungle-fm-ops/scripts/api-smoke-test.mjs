import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { mkdir, rm, stat } from "node:fs/promises";
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
  assert(health.body.runtimeStore === "sqlite", "Health endpoint did not expose SQLite runtime store");

  const initialStorage = await fetchJson(`${baseUrl}api/storage`);
  assert(initialStorage.response.ok, "Storage endpoint failed");
  assert(initialStorage.body.backend === "sqlite", "Storage endpoint did not expose SQLite backend");
  assert(initialStorage.body.tables.includes("ops_events"), "Storage endpoint did not expose ops_events table");
  assert(initialStorage.body.tables.includes("ops_state_snapshots"), "Storage endpoint did not expose state snapshot table");
  assert(initialStorage.body.tables.includes("ops_actions"), "Storage endpoint did not expose ops_actions table");
  assert(initialStorage.body.counts.opsEvents === 0, "SQLite ops_events table should start empty in test mode");
  assert(initialStorage.body.counts.opsActions === 0, "SQLite ops_actions table should start empty in test mode");

  const portfolio = await fetchJson(`${baseUrl}api/portfolio`);
  assert(portfolio.response.ok, "Portfolio endpoint failed");
  assert(portfolio.body.counts.clients === 4, "Portfolio endpoint did not count clients");
  assert(portfolio.body.counts.assets === 4, "Portfolio endpoint did not count assets");
  assert(portfolio.body.counts.modules === 12, "Portfolio endpoint did not count modules");
  assert(portfolio.body.counts.activeSensorAlerts >= 1, "Portfolio endpoint did not count sensor alerts");
  assert(portfolio.body.counts.serverSideOpsEvents === 0, "Runtime event store should start empty in test mode");

  const dataModel = await fetchJson(`${baseUrl}api/data-model`);
  assert(dataModel.response.ok, "Data model endpoint failed");
  assert(dataModel.body.scoreTarget.before === 31, "Data model did not preserve production-readiness baseline");
  assert(dataModel.body.scoreTarget.after === 35, "Data model did not expose this step's target score");
  assert(dataModel.body.entities.some((item) => item.name === "assetModules"), "Data model did not include module entity");

  const dataQuality = await fetchJson(`${baseUrl}api/data-quality`);
  assert(dataQuality.response.ok, "Data quality endpoint failed");
  assert(dataQuality.body.status === "pass-with-warnings", "Data quality should pass with honest production warnings");
  assert(dataQuality.body.errors.length === 0, "Data quality report should not contain relationship errors");
  assert(dataQuality.body.entityCounts.assetModules === 12, "Data quality report did not derive asset module count");
  assert(dataQuality.body.scaleReadiness.needsRealDatabase === true, "Data quality report should preserve honest database gap");

  const seed = await fetchJson(`${baseUrl}api/production-seed`);
  assert(seed.response.ok, "Production seed endpoint failed");
  assert(seed.body.entities.livingAssets.length === 4, "Production seed did not expose living assets");
  assert(seed.body.entities.assetModules.length === 12, "Production seed did not expose derived modules");

  const initialState = await fetchJson(`${baseUrl}api/ops-state`);
  assert(initialState.response.ok, "Ops state endpoint failed");
  assert(initialState.body.revision === 0, "Ops state should start at revision 0 in test mode");
  assert(initialState.body.summary.completedWorkorders === 0, "Ops state should start without completed work orders");

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

  const stateAction = await fetchJson(`${baseUrl}api/ops-state/actions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      expectedRevision: 0,
      action: {
        type: "workorder.complete",
        actor: "API smoke test",
        entityType: "workorder",
        entityId: "WO-1047",
        clientId: "show-suite",
        wallId: "MJ-HK-021",
        note: "Typed state action smoke test",
        value: {
            completedAt: "2026-07-14T08:00:00.000Z",
            completedBy: "API smoke test"
        },
        auditEvent: {
          id: "AUD-API-ACTION-001",
          timestamp: "2026-07-14T08:00:01.000Z",
          actor: "API smoke test",
          action: "Work order completed",
          entityType: "workorder",
          entityId: "WO-1047",
          clientId: "show-suite",
          tone: "completed",
          detail: "Typed action persisted by API smoke test."
        }
      }
    })
  });
  assert(stateAction.response.ok, "Ops state action endpoint failed");
  assert(stateAction.body.revision === 1, "Ops state action did not increment revision");
  assert(stateAction.body.action.appliedCollections.includes("workorderCompletions"), "Ops state action did not apply work order collection");
  assert(stateAction.body.action.appliedCollections.includes("auditEvents"), "Ops state action did not apply audit event collection");
  assert(stateAction.body.summary.completedWorkorders === 1, "Ops state action did not summarize completed work order");

  const persistedState = await fetchJson(`${baseUrl}api/ops-state`);
  assert(persistedState.body.state.workorderCompletions["WO-1047"], "Ops state did not persist completed work order");
  assert(persistedState.body.state.auditEvents.some((event) => event.id === "AUD-API-ACTION-001"), "Ops state did not persist typed action audit event");
  assert(persistedState.body.summary.completedWorkorders === 1, "Ops state summary did not persist completed work order");

  const conflictAction = await fetchJson(`${baseUrl}api/ops-state/actions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      expectedRevision: 0,
      action: {
        type: "sensor.acknowledge",
        actor: "API smoke test",
        entityType: "sensor",
        entityId: "SNS-021-LIGHT",
        clientId: "show-suite",
        wallId: "MJ-HK-021",
        note: "This action should fail because the revision is stale",
        value: {
          acknowledgedAt: "2026-07-14T08:02:00.000Z",
          acknowledgedBy: "API smoke test"
        },
        auditEvent: {
          id: "AUD-API-CONFLICT-001",
          timestamp: "2026-07-14T08:02:01.000Z",
          actor: "API smoke test",
          action: "Sensor alert acknowledged",
          entityType: "sensor",
          entityId: "SNS-021-LIGHT",
          clientId: "show-suite",
          tone: "acknowledged",
          detail: "Stale revision conflict probe."
        }
      }
    })
  });
  assert(conflictAction.response.status === 409, "Stale ops state action should return 409");
  assert(conflictAction.body.code === "REVISION_CONFLICT", "Conflict response should expose revision conflict code");
  assert(conflictAction.body.currentRevision === 1, "Conflict response did not expose current revision");

  const snapshotCompatibility = await fetchJson(`${baseUrl}api/ops-state/snapshot`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      state: {
        ...persistedState.body.state,
        activeRoleId: "fm-lead"
      }
    })
  });
  assert(snapshotCompatibility.response.ok, "Ops state snapshot compatibility endpoint failed");
  assert(snapshotCompatibility.body.revision === 2, "Ops state snapshot compatibility did not increment revision");

  const portfolioAfterState = await fetchJson(`${baseUrl}api/portfolio`);
  assert(portfolioAfterState.body.counts.serverSideOpsEvents === 2, "Portfolio endpoint did not include typed state action event");
  assert(portfolioAfterState.body.counts.serverStateRevision === 2, "Portfolio endpoint did not expose state revision");

  const updatedQuality = await fetchJson(`${baseUrl}api/data-quality`);
  assert(updatedQuality.body.entityCounts.opsEvents === 2, "Data quality report did not include server-side event count");

  const finalStorage = await fetchJson(`${baseUrl}api/storage`);
  assert(finalStorage.body.counts.opsEvents === 2, "SQLite storage did not retain event rows");
  assert(finalStorage.body.counts.opsActions === 1, "SQLite storage did not retain typed action row");
  assert(finalStorage.body.counts.opsStateSnapshots === 2, "SQLite storage did not retain state snapshot rows");
  assert(finalStorage.body.latestStateRevision === 2, "SQLite storage did not expose latest state revision");
  assert(finalStorage.body.migrations.some((item) => item.version === "2026-07-14.sqlite-runtime-v1"), "SQLite migration was not recorded");
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
    const dbStats = await stat(join(runtimeDir, "ops-runtime.sqlite"));
    assert(dbStats.size > 0, "SQLite runtime database file was not created");
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
