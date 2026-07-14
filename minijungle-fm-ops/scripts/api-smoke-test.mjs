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

function principalHeaders(principalId, headers = {}) {
  return {
    ...headers,
    "x-dr-forest-principal": principalId
  };
}

function jsonHeaders(principalId = null) {
  const headers = { "Content-Type": "application/json" };
  return principalId ? principalHeaders(principalId, headers) : headers;
}

async function verifyApi(baseUrl) {
  const health = await fetchJson(`${baseUrl}api/health`);
  assert(health.response.ok, "Health endpoint failed");
  assert(health.body.status === "ok", "Health endpoint did not return ok status");
  assert(health.body.mode === "api-foundation", "Health endpoint did not expose API foundation mode");
  assert(health.body.runtimeStore === "sqlite", "Health endpoint did not expose SQLite runtime store");
  assert(health.body.masterDataStore === "sqlite", "Health endpoint did not expose SQLite master data store");
  assert(health.body.authPolicy === "role-client-scope-v1", "Health endpoint did not expose auth policy");

  const authContext = await fetchJson(`${baseUrl}api/auth/context`, {
    headers: principalHeaders("client-show-suite")
  });
  assert(authContext.response.ok, "Auth context endpoint failed");
  assert(authContext.body.auth.roleId === "client-viewer", "Auth context did not resolve client viewer role");
  assert(authContext.body.auth.clientIds.includes("show-suite"), "Auth context did not expose client scope");

  const authPolicy = await fetchJson(`${baseUrl}api/auth/policy`, {
    headers: principalHeaders("fm-lead")
  });
  assert(authPolicy.response.ok, "Auth policy endpoint failed for FM lead");
  assert(authPolicy.body.roles["field-tech"].actionTypes.includes("sensor.acknowledge"), "Auth policy did not expose field action whitelist");

  const unknownAuth = await fetchJson(`${baseUrl}api/assets`, {
    headers: principalHeaders("unknown-principal")
  });
  assert(unknownAuth.response.status === 401, "Unknown principal should receive 401");

  const initialStorage = await fetchJson(`${baseUrl}api/storage`);
  assert(initialStorage.response.ok, "Storage endpoint failed");
  assert(initialStorage.body.backend === "sqlite", "Storage endpoint did not expose SQLite backend");
  assert(initialStorage.body.tables.includes("ops_events"), "Storage endpoint did not expose ops_events table");
  assert(initialStorage.body.tables.includes("ops_state_snapshots"), "Storage endpoint did not expose state snapshot table");
  assert(initialStorage.body.tables.includes("ops_actions"), "Storage endpoint did not expose ops_actions table");
  assert(initialStorage.body.counts.opsEvents === 0, "SQLite ops_events table should start empty in test mode");
  assert(initialStorage.body.counts.opsActions === 0, "SQLite ops_actions table should start empty in test mode");
  assert(initialStorage.body.masterData.migrationVersion === "2026-07-15.master-data-v1", "Storage endpoint did not expose master-data migration");
  assert(initialStorage.body.masterData.tables.includes("clients"), "Storage endpoint did not expose clients master table");
  assert(initialStorage.body.masterData.tables.includes("living_assets"), "Storage endpoint did not expose living_assets master table");
  assert(initialStorage.body.masterData.tables.includes("work_orders"), "Storage endpoint did not expose work_orders master table");
  assert(initialStorage.body.masterData.tables.includes("sensor_readings"), "Storage endpoint did not expose sensor_readings master table");
  assert(initialStorage.body.masterData.counts.clients === 4, "SQLite master clients table did not seed all clients");
  assert(initialStorage.body.masterData.counts.livingAssets === 4, "SQLite master living_assets table did not seed all assets");
  assert(initialStorage.body.masterData.counts.assetZones === 13, "SQLite master asset_zones table did not seed all zones");
  assert(initialStorage.body.masterData.counts.workOrders === 4, "SQLite master work_orders table did not seed all work orders");
  assert(initialStorage.body.masterData.counts.sensorReadings === 4, "SQLite master sensor_readings table did not seed all sensor readings");
  assert(initialStorage.body.masterData.relationshipIntegrity.foreignKeysEnabled === true, "SQLite master-data foreign keys are not enabled");
  assert(initialStorage.body.masterData.relationshipIntegrity.foreignKeyIssues === 0, "SQLite master-data foreign key check found issues");

  const deniedStorage = await fetchJson(`${baseUrl}api/storage`, {
    headers: principalHeaders("client-show-suite")
  });
  assert(deniedStorage.response.status === 403, "Client viewer should not read storage metadata");

  const portfolio = await fetchJson(`${baseUrl}api/portfolio`);
  assert(portfolio.response.ok, "Portfolio endpoint failed");
  assert(portfolio.body.counts.clients === 4, "Portfolio endpoint did not count clients");
  assert(portfolio.body.counts.assets === 4, "Portfolio endpoint did not count assets");
  assert(portfolio.body.counts.modules === 12, "Portfolio endpoint did not count modules");
  assert(portfolio.body.counts.activeSensorAlerts >= 1, "Portfolio endpoint did not count sensor alerts");
  assert(portfolio.body.counts.serverSideOpsEvents === 0, "Runtime event store should start empty in test mode");

  const clientPortfolio = await fetchJson(`${baseUrl}api/portfolio`, {
    headers: principalHeaders("client-show-suite")
  });
  assert(clientPortfolio.response.ok, "Client-scoped portfolio endpoint failed");
  assert(clientPortfolio.body.counts.clients === 1, "Client portfolio should expose exactly one client");
  assert(clientPortfolio.body.counts.assets === 1, "Client portfolio should expose exactly one asset");
  assert(clientPortfolio.body.auth.clientIds.includes("show-suite"), "Client portfolio did not echo scoped client IDs");

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

  const clientAssets = await fetchJson(`${baseUrl}api/assets`, {
    headers: principalHeaders("client-show-suite")
  });
  assert(clientAssets.response.ok, "Client-scoped assets endpoint failed");
  assert(clientAssets.body.assets.length === 1, "Client-scoped assets should return one asset");
  assert(clientAssets.body.assets[0].clientId === "show-suite", "Client-scoped assets leaked another client");

  const viewerDeniedAction = await fetchJson(`${baseUrl}api/ops-state/actions`, {
    method: "POST",
    headers: jsonHeaders("client-show-suite"),
    body: JSON.stringify({
      expectedRevision: 0,
      action: {
        type: "sensor.acknowledge",
        actor: "Client viewer",
        entityType: "sensor",
        entityId: "SNS-021-LIGHT",
        clientId: "show-suite",
        wallId: "MJ-HK-021",
        note: "Viewer should not be able to write operations state",
        value: {
          acknowledgedAt: "2026-07-15T08:00:00.000Z",
          acknowledgedBy: "Client viewer"
        }
      }
    })
  });
  assert(viewerDeniedAction.response.status === 403, "Client viewer should not write ops state actions");

  const fieldCrossTenantDenied = await fetchJson(`${baseUrl}api/ops-state/actions`, {
    method: "POST",
    headers: jsonHeaders("field-tech-show-suite"),
    body: JSON.stringify({
      expectedRevision: 0,
      action: {
        type: "workorder.complete",
        actor: "Show Suite field tech",
        entityType: "workorder",
        entityId: "WO-1051",
        clientId: "central-office",
        wallId: "MJ-HK-001",
        note: "Field tech should not close another client's work order",
        value: {
          completedAt: "2026-07-15T08:05:00.000Z",
          completedBy: "Show Suite field tech"
        }
      }
    })
  });
  assert(fieldCrossTenantDenied.response.status === 403, "Field tech should not write outside assigned client scope");

  const eventCreate = await fetchJson(`${baseUrl}api/ops-events`, {
    method: "POST",
    headers: jsonHeaders(),
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
    headers: jsonHeaders(),
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
    headers: jsonHeaders(),
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
    headers: jsonHeaders(),
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

  const fieldAllowedAction = await fetchJson(`${baseUrl}api/ops-state/actions`, {
    method: "POST",
    headers: jsonHeaders("field-tech-show-suite"),
    body: JSON.stringify({
      expectedRevision: 2,
      action: {
        type: "sensor.acknowledge",
        actor: "Show Suite field tech",
        entityType: "sensor",
        entityId: "SNS-021-LIGHT",
        clientId: "show-suite",
        wallId: "MJ-HK-021",
        note: "Assigned field tech acknowledges show-suite sensor alert",
        value: {
          acknowledgedAt: "2026-07-15T08:10:00.000Z",
          acknowledgedBy: "Show Suite field tech"
        },
        auditEvent: {
          id: "AUD-FIELD-ACTION-001",
          timestamp: "2026-07-15T08:10:01.000Z",
          actor: "Show Suite field tech",
          action: "Sensor alert acknowledged",
          entityType: "sensor",
          entityId: "SNS-021-LIGHT",
          clientId: "show-suite",
          tone: "acknowledged",
          detail: "Assigned field tech action accepted inside client scope."
        }
      }
    })
  });
  assert(fieldAllowedAction.response.ok, "Assigned field tech action should be allowed");
  assert(fieldAllowedAction.body.revision === 3, "Assigned field tech action did not advance revision");
  assert(fieldAllowedAction.body.summary.acknowledgedSensorAlerts === 1, "Assigned field tech action did not acknowledge sensor");

  const clientEvents = await fetchJson(`${baseUrl}api/ops-events`, {
    headers: principalHeaders("client-show-suite")
  });
  assert(clientEvents.response.ok, "Client-scoped ops events endpoint failed");
  assert(clientEvents.body.events.length === 3, "Client viewer should see only show-suite events created in the test");
  assert(clientEvents.body.events.every((event) => event.clientId === "show-suite"), "Client-scoped events leaked another client");

  const clientState = await fetchJson(`${baseUrl}api/ops-state`, {
    headers: principalHeaders("client-show-suite")
  });
  assert(clientState.response.ok, "Client-scoped ops state endpoint failed");
  assert(clientState.body.state.workorderCompletions["WO-1047"], "Client-scoped state should include show-suite work order completion");
  assert(!clientState.body.state.workorderCompletions["WO-1051"], "Client-scoped state leaked central-office work order");

  const updatedQuality = await fetchJson(`${baseUrl}api/data-quality`);
  assert(updatedQuality.body.entityCounts.opsEvents === 3, "Data quality report did not include server-side event count");

  const finalStorage = await fetchJson(`${baseUrl}api/storage`);
  assert(finalStorage.body.counts.opsEvents === 3, "SQLite storage did not retain event rows");
  assert(finalStorage.body.counts.opsActions === 2, "SQLite storage did not retain typed action rows");
  assert(finalStorage.body.counts.opsStateSnapshots === 3, "SQLite storage did not retain state snapshot rows");
  assert(finalStorage.body.latestStateRevision === 3, "SQLite storage did not expose latest state revision");
  assert(finalStorage.body.masterData.counts.clients === 4, "SQLite master clients table count changed unexpectedly");
  assert(finalStorage.body.masterData.relationshipIntegrity.foreignKeyIssues === 0, "SQLite master-data FK check regressed after runtime writes");
  assert(finalStorage.body.migrations.some((item) => item.version === "2026-07-14.sqlite-runtime-v1"), "SQLite migration was not recorded");

  const viewerDeniedMasterWrite = await fetchJson(`${baseUrl}api/admin/master-data/clients/demo-retail`, {
    method: "PUT",
    headers: jsonHeaders("client-show-suite"),
    body: JSON.stringify({
      name: "Demo Retail Client"
    })
  });
  assert(viewerDeniedMasterWrite.response.status === 403, "Client viewer should not write master data");

  const clientUpsert = await fetchJson(`${baseUrl}api/admin/master-data/clients/demo-retail`, {
    method: "PUT",
    headers: jsonHeaders("fm-lead"),
    body: JSON.stringify({
      name: "Demo Retail Client",
      segment: "Retail",
      district: "Central",
      contact: "Store Manager: Ms. Ng",
      plan: "Premium Care",
      contract: "HK$8,800 setup + HK$880/mo",
      renewalDate: "2026-11-30",
      renewalRisk: "medium",
      revenue: 19360,
      proofNeed: "Retail ambience and ESG proof"
    })
  });
  assert(clientUpsert.response.ok, "Admin client upsert failed");
  assert(clientUpsert.body.client.id === "demo-retail", "Admin client upsert returned wrong client");
  assert(clientUpsert.body.event.type === "master-data.client.upserted", "Client upsert did not create audit event");

  const assetUpsert = await fetchJson(`${baseUrl}api/admin/master-data/living-assets/MJ-HK-901`, {
    method: "PUT",
    headers: jsonHeaders("fm-lead"),
    body: JSON.stringify({
      clientId: "demo-retail",
      name: "Retail Entry Living Wall",
      location: "Shop entrance",
      version: "Smart",
      modules: 2,
      pods: 90,
      health: 87,
      survival: 93,
      issues: 2,
      nextVisit: "Jul 18",
      cadence: "Twice monthly",
      greenArea: 4.4,
      waterSaved: 72,
      serviceMilesSaved: 9,
      staffReach: 120,
      co2eProxy: 54,
      status: "stable",
      sensors: ["water level", "light"],
      tags: ["new store"],
      zones: [
        { name: "Left", pods: 45, health: 88, issue: "none" },
        { name: "Right", pods: 45, health: 86, issue: "trim due" }
      ]
    })
  });
  assert(assetUpsert.response.ok, "Admin living asset upsert failed");
  assert(assetUpsert.body.asset.id === "MJ-HK-901", "Admin asset upsert returned wrong asset");

  const invalidAsset = await fetchJson(`${baseUrl}api/admin/master-data/living-assets/MJ-HK-BAD`, {
    method: "PUT",
    headers: jsonHeaders("fm-lead"),
    body: JSON.stringify({
      clientId: "missing-client",
      name: "Invalid Asset",
      modules: 1,
      pods: 45,
      health: 80,
      survival: 90
    })
  });
  assert(invalidAsset.response.status === 400, "Invalid living asset should fail FK validation");

  const workOrderUpsert = await fetchJson(`${baseUrl}api/admin/master-data/work-orders/WO-1901`, {
    method: "PUT",
    headers: jsonHeaders("fm-lead"),
    body: JSON.stringify({
      wallId: "MJ-HK-901",
      type: "New retail care visit",
      due: "Jul 18 11:00",
      status: "Scheduled",
      priority: "medium",
      tasks: ["Check retail lighting", "Capture entrance proof photos"]
    })
  });
  assert(workOrderUpsert.response.ok, "Admin work order upsert failed");
  assert(workOrderUpsert.body.workOrder.wallId === "MJ-HK-901", "Admin work order did not link to new asset");

  const sensorUpsert = await fetchJson(`${baseUrl}api/admin/master-data/sensor-readings/SNS-901-LIGHT`, {
    method: "PUT",
    headers: jsonHeaders("fm-lead"),
    body: JSON.stringify({
      wallId: "MJ-HK-901",
      type: "Light exposure",
      value: 71,
      unit: "%",
      target: "65-90%",
      status: "ok",
      lastSeen: "2026-07-15 09:00",
      action: "No action required"
    })
  });
  assert(sensorUpsert.response.ok, "Admin sensor upsert failed");
  assert(sensorUpsert.body.sensor.wallId === "MJ-HK-901", "Admin sensor did not link to new asset");

  const adminAssets = await fetchJson(`${baseUrl}api/assets`, {
    headers: principalHeaders("fm-lead")
  });
  assert(adminAssets.body.assets.some((asset) => asset.id === "MJ-HK-901"), "Admin assets endpoint did not read newly upserted SQLite asset");

  const adminPortfolio = await fetchJson(`${baseUrl}api/portfolio`, {
    headers: principalHeaders("fm-lead")
  });
  assert(adminPortfolio.body.counts.clients === 5, "Portfolio did not reflect admin-created client");
  assert(adminPortfolio.body.counts.assets === 5, "Portfolio did not reflect admin-created asset");
  assert(adminPortfolio.body.counts.workorders === 5, "Portfolio did not reflect admin-created work order");

  const validationAfterCrud = await fetchJson(`${baseUrl}api/admin/master-data/validate`, {
    headers: principalHeaders("fm-lead")
  });
  assert(validationAfterCrud.response.ok, "Admin master-data validation endpoint failed");
  assert(validationAfterCrud.body.masterData.counts.clients === 5, "Master-data validation did not reflect admin-created client");
  assert(validationAfterCrud.body.masterData.counts.livingAssets === 5, "Master-data validation did not reflect admin-created asset");
  assert(validationAfterCrud.body.masterData.counts.workOrders === 5, "Master-data validation did not reflect admin-created work order");
  assert(validationAfterCrud.body.masterData.counts.sensorReadings === 5, "Master-data validation did not reflect admin-created sensor");
  assert(validationAfterCrud.body.masterData.relationshipIntegrity.foreignKeyIssues === 0, "Master-data CRUD introduced FK issues");

  const importReset = await fetchJson(`${baseUrl}api/admin/master-data/import`, {
    method: "POST",
    headers: jsonHeaders("fm-lead")
  });
  assert(importReset.response.ok, "Admin master-data import endpoint failed");
  assert(importReset.body.masterData.counts.clients === 4, "Master-data import did not reset client seed count");
  assert(importReset.body.masterData.counts.livingAssets === 4, "Master-data import did not reset asset seed count");
  assert(importReset.body.event.type === "master-data.imported", "Master-data import did not create audit event");

  const storageAfterAdmin = await fetchJson(`${baseUrl}api/storage`);
  assert(storageAfterAdmin.body.counts.opsEvents === 8, "Admin CRUD/import events were not retained in ops event log");
  assert(storageAfterAdmin.body.masterData.counts.clients === 4, "Storage did not show imported client seed count");
  assert(storageAfterAdmin.body.masterData.relationshipIntegrity.foreignKeyIssues === 0, "Imported master data has FK issues");
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
