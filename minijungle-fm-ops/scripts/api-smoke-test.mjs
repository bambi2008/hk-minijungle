import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { createHash } from "node:crypto";
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
  assert(health.body.authPolicy === "role-client-scope-plus-pilot-session-v1", "Health endpoint did not expose auth policy");
  assert(health.body.mobileWorkflow === "pwa-offline-capture-v2", "Health endpoint did not expose mobile workflow mode");
  assert(health.body.proofMediaVault === "local-verified-v1", "Health endpoint did not expose proof media vault mode");

  const login = await fetchJson(`${baseUrl}api/auth/login`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({ email: "ops@example.test", password: "pilot-password-123" })
  });
  assert(login.response.ok, "Pilot login should accept configured password credentials");
  const sessionCookie = login.response.headers.get("set-cookie")?.split(";")[0];
  assert(sessionCookie?.startsWith("drf_session="), "Pilot login should issue an HttpOnly session cookie");
  const sessionContext = await fetchJson(`${baseUrl}api/auth/context`, { headers: { Cookie: sessionCookie } });
  assert(sessionContext.body.auth.id === "pilot:ops@example.test", "Session auth context did not resolve pilot account");
  assert(sessionContext.body.auth.roleId === "fm-lead", "Session auth context did not resolve FM lead role");

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
  assert(authPolicy.body.roles["field-tech"].permissions.includes("mobile.capture.write"), "Auth policy did not expose field mobile capture permission");
  assert(authPolicy.body.roles["field-tech"].permissions.includes("proof.media.write"), "Auth policy did not expose field proof media write permission");
  assert(authPolicy.body.roles["client-viewer"].permissions.includes("proof.media.read"), "Auth policy did not expose client proof media read permission");
  assert(authPolicy.body.roles["client-viewer"].permissions.includes("proof.snapshot.read"), "Auth policy did not expose client evidence snapshot read permission");
  assert(authPolicy.body.roles["client-viewer"].permissions.includes("mobile.capture.read"), "Auth policy did not expose client field capture read permission");
  assert(!authPolicy.body.roles["client-viewer"].permissions.includes("proof.snapshot.write"), "Client viewer should not receive evidence snapshot write permission");
  assert(authPolicy.body.roles["fm-lead"].permissions.includes("proof.snapshot.write"), "FM lead auth policy did not expose evidence snapshot write permission");
  assert(authPolicy.body.roles["fm-lead"].permissions.includes("proof.snapshot.verify"), "FM lead auth policy did not expose evidence snapshot verify permission");
  assert(authPolicy.body.roles["fm-lead"].permissions.includes("proof.snapshot.retention"), "FM lead auth policy did not expose evidence snapshot retention permission");
  assert(!authPolicy.body.roles["client-viewer"].permissions.includes("proof.media.write"), "Client viewer should not receive proof media write permission");
  assert(authPolicy.body.roles["fm-lead"].permissions.includes("observability.read"), "FM lead auth policy did not expose observability read permission");
  assert(authPolicy.body.roles["fm-lead"].permissions.includes("notifications.read"), "FM lead auth policy did not expose notification read permission");
  assert(authPolicy.body.roles["fm-lead"].permissions.includes("maintenance.plan.write") && authPolicy.body.roles["fm-lead"].permissions.includes("maintenance.generate"), "FM lead auth policy did not expose preventive maintenance controls");
  assert(authPolicy.body.roles["fm-lead"].permissions.includes("inventory.write") && authPolicy.body.roles["fm-lead"].permissions.includes("inventory.reserve"), "FM lead auth policy did not expose inventory controls");
  assert(authPolicy.body.roles["field-tech"].permissions.includes("inventory.read") && authPolicy.body.roles["field-tech"].permissions.includes("inventory.consume"), "Field technician auth policy did not expose route-kit controls");
  assert(authPolicy.body.roles["field-tech"].permissions.includes("mobile.remediation.read"), "Auth policy did not expose field mobile remediation read permission");
  assert(authPolicy.body.roles["field-tech"].permissions.includes("mobile.remediation.update"), "Auth policy did not expose field mobile remediation update permission");

  const clientFieldCaptures = await fetchJson(`${baseUrl}api/mobile/capture-batches`, { headers: principalHeaders("client-show-suite") });
  assert(clientFieldCaptures.response.ok && Array.isArray(clientFieldCaptures.body.batches), "Client viewer should read scoped field captures");
  assert(clientFieldCaptures.body.batches.every((batch) => batch.clientId === "show-suite"), "Client viewer field captures escaped client scope");
  const auditorFieldCaptures = await fetchJson(`${baseUrl}api/mobile/capture-batches`, { headers: principalHeaders("esg-auditor") });
  assert(auditorFieldCaptures.response.ok && Array.isArray(auditorFieldCaptures.body.batches), "ESG auditor should read field captures");

  const metrics = await fetchJson(`${baseUrl}api/metrics`, { headers: principalHeaders("fm-lead") });
  assert(metrics.response.ok, "FM lead should read protected observability metrics");
  assert(metrics.body.observabilityVersion === "2026-08-19.observability-v1", "Metrics endpoint did not expose observability version");
  assert(metrics.body.requests && Number.isInteger(metrics.body.requests.total), "Metrics endpoint did not expose request counters");
  const deniedMetrics = await fetchJson(`${baseUrl}api/metrics`, { headers: principalHeaders("client-show-suite") });
  assert(deniedMetrics.response.status === 403, "Client viewer should not read platform observability metrics");
  const notifications = await fetchJson(`${baseUrl}api/notifications`, { headers: principalHeaders("fm-lead") });
  assert(notifications.response.ok && Array.isArray(notifications.body.notifications) && notifications.body.summary && Number.isInteger(notifications.body.summary.due), "FM lead should read notification records and delivery summary");
  const deniedNotifications = await fetchJson(`${baseUrl}api/notifications`, { headers: principalHeaders("client-show-suite") });
  assert(deniedNotifications.response.status === 403, "Client viewer should not read the notification outbox");

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
  assert(initialStorage.body.mobileCapture.migrationVersion === "2026-08-17.mobile-capture-v2", "Storage endpoint did not expose mobile capture migration");
  assert(initialStorage.body.mobileCapture.tables.includes("mobile_capture_batches"), "Storage endpoint did not expose mobile capture batch table");
  assert(initialStorage.body.mobileCapture.tables.includes("mobile_capture_items"), "Storage endpoint did not expose mobile capture item table");
  assert(initialStorage.body.mobileCapture.counts.captureBatches === 0, "Mobile capture batches should start empty in test mode");
  assert(initialStorage.body.mobileCapture.counts.captureItems === 0, "Mobile capture items should start empty in test mode");
  assert(initialStorage.body.mobileCapture.relationshipIntegrity.foreignKeysEnabled === true, "SQLite mobile capture foreign keys are not enabled");
  assert(initialStorage.body.modules.counts.modules === 12, "Module master table should seed addressable modules from wall module counts");
  assert(initialStorage.body.modules.relationshipIntegrity.foreignKeyIssues === 0, "Module master table should have no foreign-key issues");
  assert(initialStorage.body.reminders.counts.actions === 0, "Reminder action table should start empty in test mode");
  assert(initialStorage.body.remediation.migrationVersion === "2026-08-28.remediation-dispatch-sla-v1", "Storage endpoint did not expose remediation dispatch/SLA migration");
  assert(initialStorage.body.integrations.migrationVersion === "2026-08-29.ops-control-import-v1", "Storage endpoint did not expose operations control/import migration");
  assert(initialStorage.body.integrations.tables.includes("ops_job_leases") && initialStorage.body.integrations.tables.includes("ops_idempotency_commands") && initialStorage.body.integrations.tables.includes("ops_maintenance_imports"), "Storage endpoint did not expose operations lease, idempotency and maintenance import tables");
  assert(initialStorage.body.workforce.migrationVersion === "2026-08-30.workforce-dispatch-v1", "Storage endpoint did not expose workforce dispatch migration");
  assert(initialStorage.body.workforce.tables.includes("ops_technicians") && initialStorage.body.workforce.tables.includes("ops_workforce_assignments"), "Storage endpoint did not expose workforce roster and assignment tables");
  assert(initialStorage.body.workforce.relationshipIntegrity.unknownTechnicians === 0, "Workforce assignment ledger should not contain unknown technicians");
  assert(initialStorage.body.maintenancePlanning.migrationVersion === "2026-08-31.maintenance-planning-v1", "Storage endpoint did not expose maintenance planning migration");
  assert(initialStorage.body.maintenancePlanning.tables.includes("ops_maintenance_plans") && initialStorage.body.maintenancePlanning.tables.includes("ops_maintenance_occurrences") && initialStorage.body.maintenancePlanning.tables.includes("ops_maintenance_generation_runs"), "Storage endpoint did not expose maintenance planning tables");
  assert(initialStorage.body.remediation.counts.total === 0, "Remediation task table should start empty in test mode");
  assert(initialStorage.body.remediation.relationshipIntegrity.workOrderScopeIssues === 0, "Remediation work-order scope check should start clean");
  assert(initialStorage.body.proofMedia.migrationVersion === "2026-08-17.proof-media-v2", "Storage endpoint did not expose proof media migration");
  assert(initialStorage.body.proofMedia.tables.includes("proof_media_objects"), "Storage endpoint did not expose proof media objects table");
  assert(initialStorage.body.proofMedia.tables.includes("proof_media_links"), "Storage endpoint did not expose proof media links table");
  assert(initialStorage.body.proofMedia.counts.mediaObjects === 0, "Proof media objects should start empty in test mode");
  assert(initialStorage.body.proofMedia.counts.mediaLinks === 0, "Proof media links should start empty in test mode");
  assert(initialStorage.body.proofMedia.relationshipIntegrity.foreignKeysEnabled === true, "SQLite proof media foreign keys are not enabled");
  assert(initialStorage.body.evidenceSnapshots.migrationVersion === "2026-08-23.evidence-snapshot-v3", "Storage endpoint did not expose evidence snapshot migration");
  assert(initialStorage.body.evidenceSnapshots.counts.snapshots === 0, "Evidence snapshots should start empty in test mode");
  assert(initialStorage.body.telemetry.migrationVersion === "2026-08-17.telemetry-history-v2", "Storage endpoint did not expose telemetry history migration");
  assert(initialStorage.body.telemetry.tables.includes("sensor_reading_history"), "Storage endpoint did not expose sensor history table");
  assert(initialStorage.body.telemetry.counts.sensorReadingHistory === 0, "Sensor history should start empty in test mode");
  const initialOperationsQuality = await fetchJson(`${baseUrl}api/ops/quality`, {
    headers: principalHeaders("fm-lead")
  });
  assert(initialOperationsQuality.response.ok, "Operations quality endpoint failed");
  assert(initialOperationsQuality.body.summary.modules === 12, "Operations quality did not count all seeded modules");
  assert(initialOperationsQuality.body.thresholds.telemetryStaleMinutes === 180, "Operations quality did not expose the pilot telemetry freshness threshold");
  assert(initialOperationsQuality.body.thresholds.cameraStaleMinutes === 1440, "Operations quality did not expose the pilot camera freshness threshold");
  assert(initialOperationsQuality.body.summary.telemetryIncomplete === 12, "Operations quality did not separate missing telemetry from stale telemetry");
  assert(initialOperationsQuality.body.summary.telemetryStale === 0, "Operations quality should not label missing telemetry as stale");
  assert(initialOperationsQuality.body.summary.telemetryFresh === 0, "Operations quality should not count missing pilot telemetry as fresh");
  assert(initialOperationsQuality.body.summary.cameraFresh === 0, "Operations quality should not count pending pilot cameras as fresh");
  assert(initialOperationsQuality.body.gates.length === 4, "Operations quality did not expose four readiness gates");
  assert(initialOperationsQuality.body.summary.moduleUnready === 12, "Operations quality did not expose all unready pilot modules");
  assert(initialOperationsQuality.body.moduleReadiness.length === 12, "Operations quality did not return the bounded module action queue");
  assert(initialOperationsQuality.body.moduleReadiness[0]?.status === "telemetry-incomplete", "Module action queue did not prioritize incomplete telemetry");
  assert(initialOperationsQuality.body.moduleReadiness[0]?.reasons.some((reason) => reason.includes("Telemetry incomplete")), "Module action queue did not explain the blocking reason");
  assert(initialOperationsQuality.body.gates.find((gate) => gate.id === "telemetry")?.status === "blocked", "Operations quality should not call pilot telemetry complete before readings");
  assert(initialOperationsQuality.body.gates.find((gate) => gate.id === "camera")?.status === "blocked", "Operations quality should not call generated cameras connected");
  const viewerDeniedOperationsQuality = await fetchJson(`${baseUrl}api/ops/quality`, {
    headers: principalHeaders("client-show-suite")
  });
  assert(viewerDeniedOperationsQuality.response.status === 403, "Client viewer should not read internal operations quality");

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

  const clientEvidenceSnapshot = await fetchJson(`${baseUrl}api/proof/evidence-snapshot`, {
    headers: principalHeaders("client-show-suite")
  });
  assert(clientEvidenceSnapshot.response.ok, "Client evidence snapshot endpoint failed");
  assert(clientEvidenceSnapshot.body.snapshotId.startsWith("EVP-"), "Client evidence snapshot did not expose a stable snapshot ID");
  assert(/^[a-f0-9]{64}$/.test(clientEvidenceSnapshot.body.sha256), "Client evidence snapshot did not expose a SHA-256 fingerprint");
  assert(clientEvidenceSnapshot.body.signatureAlgorithm === "hmac-sha256", "Client evidence snapshot did not expose the signature algorithm");
  assert(clientEvidenceSnapshot.body.package.schemaVersion === "dr-forest-evidence-package-v3", "Client evidence snapshot did not expose the field-capture package schema");
  assert(clientEvidenceSnapshot.body.signatureStatus === "unsigned", "Pilot evidence snapshot should explicitly report unsigned status");
  assert(clientEvidenceSnapshot.body.signature === null, "Unsigned pilot evidence snapshot should not expose a signature");
  assert(clientEvidenceSnapshot.body.package.assets.length === 1, "Client evidence snapshot did not keep client scope");
  assert(Array.isArray(clientEvidenceSnapshot.body.package.fieldCaptures), "Client evidence snapshot did not include field captures");
  assert(clientEvidenceSnapshot.body.package.fieldCaptures.every((batch) => batch.clientId === "show-suite"), "Client evidence snapshot field captures escaped scope");
  assert(!Object.prototype.hasOwnProperty.call(clientEvidenceSnapshot.body.package, "dataQuality"), "Client evidence snapshot leaked auditor data quality");
  const auditorEvidenceSnapshot = await fetchJson(`${baseUrl}api/proof/evidence-snapshot`, {
    headers: principalHeaders("esg-auditor")
  });
  assert(auditorEvidenceSnapshot.response.ok, "Auditor evidence snapshot endpoint failed");
  assert(auditorEvidenceSnapshot.body.package.assets.length === 4, "Auditor evidence snapshot did not expose the review portfolio");
  assert(Array.isArray(auditorEvidenceSnapshot.body.package.fieldCaptures), "Auditor evidence snapshot did not include field captures");
  assert(auditorEvidenceSnapshot.body.package.dataQuality?.status === "pass-with-warnings", "Auditor evidence snapshot did not include data quality");

  const clientEvidenceWriteDenied = await fetchJson(`${baseUrl}api/proof/evidence-snapshots`, {
    method: "POST",
    headers: principalHeaders("client-show-suite")
  });
  assert(clientEvidenceWriteDenied.response.status === 403, "Client viewer should not persist evidence snapshots");
  const persistedEvidenceSnapshot = await fetchJson(`${baseUrl}api/proof/evidence-snapshots`, {
    method: "POST",
    headers: principalHeaders("fm-lead")
  });
  assert(persistedEvidenceSnapshot.response.status === 201, "FM lead should persist an evidence snapshot");
  assert(persistedEvidenceSnapshot.body.persisted === true, "Persisted evidence snapshot did not expose persistence state");
  assert(persistedEvidenceSnapshot.body.retentionDays === 365, "Persisted evidence snapshot did not expose the default retention period");
  assert(persistedEvidenceSnapshot.body.verificationStatus === "unsigned", "Unsigned pilot evidence snapshot should start with unsigned verification status");
  const persistedEvidenceRead = await fetchJson(`${baseUrl}api/proof/evidence-snapshots/${encodeURIComponent(persistedEvidenceSnapshot.body.snapshotId)}`, {
    headers: principalHeaders("fm-lead")
  });
  assert(persistedEvidenceRead.response.ok, "FM lead should read a persisted evidence snapshot");
  assert(persistedEvidenceRead.body.sha256 === persistedEvidenceSnapshot.body.sha256, "Persisted evidence snapshot hash changed on read");
  const clientEvidenceVerifyDenied = await fetchJson(`${baseUrl}api/proof/evidence-snapshots/${encodeURIComponent(persistedEvidenceSnapshot.body.snapshotId)}`, {
    method: "POST",
    headers: jsonHeaders("client-show-suite"),
    body: JSON.stringify({ note: "Client should not verify evidence." })
  });
  assert(clientEvidenceVerifyDenied.response.status === 403, "Client viewer should not verify evidence snapshots");
  const verifiedEvidenceSnapshot = await fetchJson(`${baseUrl}api/proof/evidence-snapshots/${encodeURIComponent(persistedEvidenceSnapshot.body.snapshotId)}`, {
    method: "POST",
    headers: jsonHeaders("fm-lead"),
    body: JSON.stringify({ note: "Pilot hash checked; no signing secret is configured." })
  });
  assert(verifiedEvidenceSnapshot.response.ok, "FM lead evidence verification endpoint failed");
  assert(verifiedEvidenceSnapshot.body.verificationStatus === "unsigned", "Pilot evidence verification should preserve unsigned status");
  assert(verifiedEvidenceSnapshot.body.integrity.hashValid === true, "Evidence verification did not validate the package hash");
  assert(verifiedEvidenceSnapshot.body.integrity.signatureValid === false, "Unsigned evidence verification should not claim a valid signature");
  const retentionSweep = await fetchJson(`${baseUrl}api/proof/evidence-snapshots/retention-sweep`, {
    method: "POST",
    headers: jsonHeaders("fm-lead")
  });
  assert(retentionSweep.response.ok && retentionSweep.body.expiredCount === 0, "Evidence retention sweep should not expire a fresh snapshot");
  const evidenceTimeline = await fetchJson(`${baseUrl}api/ops/timeline?limit=2`, {
    headers: principalHeaders("fm-lead")
  });
  assert(evidenceTimeline.response.ok, "FM lead operations timeline endpoint failed");
  assert(evidenceTimeline.body.total === 3, "Operations timeline should include persisted, verified and retention evidence events");
  assert(evidenceTimeline.body.events.length === 2 && evidenceTimeline.body.hasMore === true, "Operations timeline limit and cursor metadata failed");
  assert(evidenceTimeline.body.events.some((event) => event.type === "evidence.snapshot.retention.swept"), "Operations timeline did not return the latest evidence retention event");
  const evidenceTimelineNextPage = await fetchJson(`${baseUrl}api/ops/timeline?limit=2&before=${encodeURIComponent(evidenceTimeline.body.nextCursor.before)}&beforeId=${encodeURIComponent(evidenceTimeline.body.nextCursor.beforeId)}`, {
    headers: principalHeaders("fm-lead")
  });
  assert(evidenceTimelineNextPage.body.total === 1 && evidenceTimelineNextPage.body.events[0]?.type === "evidence.snapshot.persisted", "Operations timeline cursor did not return the older page without duplication");
  const evidenceTimelineByType = await fetchJson(`${baseUrl}api/ops/timeline?types=evidence.snapshot.persisted,evidence.snapshot.verified&limit=5`, {
    headers: principalHeaders("fm-lead")
  });
  assert(evidenceTimelineByType.body.total === 2, "Operations timeline type filter failed");
  const clientEvidenceTimeline = await fetchJson(`${baseUrl}api/ops/timeline?limit=10`, {
    headers: principalHeaders("client-show-suite")
  });
  assert(clientEvidenceTimeline.response.ok && clientEvidenceTimeline.body.total === 0, "Client timeline should not expose all-portfolio evidence events");
  const clientPersistedEvidenceDenied = await fetchJson(`${baseUrl}api/proof/evidence-snapshots/${encodeURIComponent(persistedEvidenceSnapshot.body.snapshotId)}`, {
    headers: principalHeaders("client-show-suite")
  });
  assert(clientPersistedEvidenceDenied.response.status === 403, "Client viewer should not read an all-portfolio persisted snapshot");
  const clientPersistedEvidenceList = await fetchJson(`${baseUrl}api/proof/evidence-snapshots?limit=5`, {
    headers: principalHeaders("client-show-suite")
  });
  assert(clientPersistedEvidenceList.response.ok, "Client viewer should list persisted evidence snapshots");
  assert(clientPersistedEvidenceList.body.snapshots.length === 0, "Client viewer persisted evidence list leaked an all-portfolio snapshot");
  const auditorPersistedEvidenceList = await fetchJson(`${baseUrl}api/proof/evidence-snapshots?limit=5`, {
    headers: principalHeaders("esg-auditor")
  });
  assert(auditorPersistedEvidenceList.response.ok, "ESG auditor should list persisted evidence snapshots");
  assert(auditorPersistedEvidenceList.body.snapshots.length === 1, "ESG auditor persisted evidence list should include the all-portfolio snapshot");
  assert(!Object.prototype.hasOwnProperty.call(auditorPersistedEvidenceList.body.snapshots[0], "package"), "Persisted evidence list should return metadata only");
  const storageAfterEvidenceSnapshot = await fetchJson(`${baseUrl}api/storage`);
  assert(storageAfterEvidenceSnapshot.body.evidenceSnapshots.counts.snapshots === 1, "Persisted evidence snapshot did not reach SQLite storage");
  assert(storageAfterEvidenceSnapshot.body.evidenceSnapshots.counts.unsigned === 1, "Evidence storage did not retain unsigned verification state");
  assert(storageAfterEvidenceSnapshot.body.evidenceSnapshots.counts.expired === 0, "Fresh evidence snapshot should not be expired");

  const dataModel = await fetchJson(`${baseUrl}api/data-model`);
  assert(dataModel.response.ok, "Data model endpoint failed");
  assert(dataModel.body.scoreTarget.before === 70, "Data model did not preserve Step 10 readiness baseline");
  assert(dataModel.body.scoreTarget.after === 75, "Data model did not expose Step 10 target score");
  assert(dataModel.body.entities.some((item) => item.name === "assetModules"), "Data model did not include module entity");
  assert(dataModel.body.entities.some((item) => item.name === "proofMediaObjects"), "Data model did not include proof media entity");
  assert(dataModel.body.entities.some((item) => item.name === "evidenceSnapshots"), "Data model did not include evidence snapshot entity");

  const dataQuality = await fetchJson(`${baseUrl}api/data-quality`);
  assert(dataQuality.response.ok, "Data quality endpoint failed");
  assert(dataQuality.body.status === "pass-with-warnings", "Data quality should pass with honest production warnings");
  assert(dataQuality.body.errors.length === 0, "Data quality report should not contain relationship errors");
  assert(dataQuality.body.entityCounts.assetModules === 12, "Data quality report did not derive asset module count");
  assert(dataQuality.body.entityCounts.proofMediaObjects === 0, "Data quality report should expose proof media entity count");
  assert(dataQuality.body.scaleReadiness.needsRealDatabase === true, "Data quality report should preserve honest database gap");
  assert(dataQuality.body.scaleReadiness.needsObjectStorage === true, "Data quality report should preserve honest object-storage gap");

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
  assert(events.body.events.length === 4, "Events endpoint did not retain the evidence audit events and created event");
  assert(events.body.events.some((event) => event.entityId === "WO-1047"), "Persisted event did not preserve entity ID");

  const updatedPortfolio = await fetchJson(`${baseUrl}api/portfolio`);
  assert(updatedPortfolio.body.counts.serverSideOpsEvents === 4, "Portfolio endpoint did not reflect server-side event count");

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
  assert(portfolioAfterState.body.counts.serverSideOpsEvents === 5, "Portfolio endpoint did not include typed state action event");
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
  assert(updatedQuality.body.entityCounts.opsEvents === 6, "Data quality report did not include server-side event count");

  const finalStorage = await fetchJson(`${baseUrl}api/storage`);
  assert(finalStorage.body.counts.opsEvents === 6, "SQLite storage did not retain event rows");
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
  assert(storageAfterAdmin.body.counts.opsEvents === 11, "Admin CRUD/import events were not retained in ops event log");
  assert(storageAfterAdmin.body.masterData.counts.clients === 4, "Storage did not show imported client seed count");
  assert(storageAfterAdmin.body.masterData.relationshipIntegrity.foreignKeyIssues === 0, "Imported master data has FK issues");
  assert(storageAfterAdmin.body.mobileCapture.counts.captureBatches === 0, "Mobile capture batches should still be empty before mobile sync");

  const fieldRoute = await fetchJson(`${baseUrl}api/mobile/route`, {
    headers: principalHeaders("field-tech-show-suite")
  });
  assert(fieldRoute.response.ok, `Field technician mobile route endpoint failed: ${fieldRoute.response.status} ${JSON.stringify(fieldRoute.body)}`);
  assert(fieldRoute.body.captureSchema.itemTypes.includes("photo"), "Mobile route did not expose capture item schema");
  assert(fieldRoute.body.route.length === 1, "Field technician route should only include assigned client work orders");
  assert(fieldRoute.body.route.some((item) => item.workOrderId === "WO-1047"), "Field technician route did not include assigned show-suite work order");
  assert(!fieldRoute.body.route.some((item) => item.workOrderId === "WO-1051"), "Field technician route leaked another client's work order");

  const viewerDeniedMobileSync = await fetchJson(`${baseUrl}api/mobile/capture-batches`, {
    method: "POST",
    headers: jsonHeaders("client-show-suite"),
    body: JSON.stringify({
      id: "MCB-DENIED-001",
      technicianId: "client-show-suite",
      clientId: "show-suite",
      wallId: "MJ-HK-021",
      workorderId: "WO-1047",
      capturedAt: "2026-07-15T09:10:00.000Z",
      items: [{ type: "photo", label: "viewer denied", value: "offline://photo/denied.jpg" }]
    })
  });
  assert(viewerDeniedMobileSync.response.status === 403, "Client viewer should not sync mobile capture batches");

  const fieldCrossClientMobileDenied = await fetchJson(`${baseUrl}api/mobile/capture-batches`, {
    method: "POST",
    headers: jsonHeaders("field-tech-show-suite"),
    body: JSON.stringify({
      id: "MCB-DENIED-002",
      technicianId: "field-tech-show-suite",
      clientId: "central-office",
      wallId: "MJ-HK-001",
      workorderId: "WO-1051",
      capturedAt: "2026-07-15T09:12:00.000Z",
      items: [{ type: "photo", label: "cross client denied", value: "offline://photo/cross-client.jpg" }]
    })
  });
  assert(fieldCrossClientMobileDenied.response.status === 403, "Field technician should not sync mobile captures outside assigned client scope");

  const mismatchedMobileSync = await fetchJson(`${baseUrl}api/mobile/capture-batches`, {
    method: "POST",
    headers: jsonHeaders("fm-lead"),
    body: JSON.stringify({
      id: "MCB-DENIED-003",
      technicianId: "fm-lead",
      clientId: "show-suite",
      wallId: "MJ-HK-001",
      workorderId: "WO-1047",
      capturedAt: "2026-07-15T09:14:00.000Z",
      items: [{ type: "photo", label: "mismatch denied", value: "offline://photo/mismatch.jpg" }]
    })
  });
  assert(mismatchedMobileSync.response.status === 400, "Mismatched wall, work order and client should fail validation");
  assert(mismatchedMobileSync.body.code === "MOBILE_CAPTURE_SCOPE_MISMATCH", "Mismatched mobile sync did not expose scope mismatch code");

  const mobileBatch = {
    id: "MCB-9001",
    technicianId: "field-tech-show-suite",
    clientId: "show-suite",
    wallId: "MJ-HK-021",
    moduleId: "MJ-HK-021-M01",
    workorderId: "WO-1047",
    deviceId: "offline-ipad-01",
    capturedAt: "2026-07-15T09:20:00.000Z",
    notes: "Offline visit package captured at show-suite lift lobby.",
    items: [
      {
        type: "photo",
        label: "low-light zone retake",
        value: "offline://photo/001.jpg",
        metadata: { zone: "North", hash: "demo-hash-001" }
      },
      { type: "water", label: "reservoir top-up", value: "2.5", unit: "L" },
      { type: "nutrient", label: "nutrient dose", value: "18", unit: "ml" },
      { type: "health-check", label: "visual health score", value: "82", unit: "score" },
      { type: "exception", label: "LED schedule verified", value: "resolved" }
    ]
  };

  const mobileSync = await fetchJson(`${baseUrl}api/mobile/capture-batches`, {
    method: "POST",
    headers: jsonHeaders("field-tech-show-suite"),
    body: JSON.stringify(mobileBatch)
  });
  assert(mobileSync.response.status === 201, "Assigned field technician mobile sync should create a batch");
  assert(mobileSync.body.duplicate === false, "First mobile sync should not be marked duplicate");
  assert(mobileSync.body.batch.items.length === 5, "Mobile sync did not persist all capture items");
  assert(mobileSync.body.event.type === "mobile.capture.synced", "Mobile sync did not create a capture audit event");

  const duplicateMobileSync = await fetchJson(`${baseUrl}api/mobile/capture-batches`, {
    method: "POST",
    headers: jsonHeaders("field-tech-show-suite"),
    body: JSON.stringify(mobileBatch)
  });
  assert(duplicateMobileSync.response.ok, "Duplicate mobile sync should return the existing batch");
  assert(duplicateMobileSync.body.duplicate === true, "Duplicate mobile sync should be marked duplicate");
  assert(duplicateMobileSync.body.event === null, "Duplicate mobile sync should not create a second audit event");
  assert(mobileSync.body.event.payload.exceptionCount === 1, "Mobile sync event did not count exception items");
  const notificationsAfterMobile = await fetchJson(`${baseUrl}api/notifications`, { headers: principalHeaders("fm-lead") });
  assert(notificationsAfterMobile.body.notifications.some((item) => item.id === "NTF-CAPTURE-MCB-9001" && item.eventType === "mobile.capture.exception" && item.status === "pending"), "Mobile exception did not enqueue a pending notification");

  const mobileBatches = await fetchJson(`${baseUrl}api/mobile/capture-batches`, {
    headers: principalHeaders("fm-lead")
  });
  assert(mobileBatches.response.ok, "FM lead mobile capture batch listing failed");
  assert(mobileBatches.body.batches.length === 1, "Mobile capture listing should include exactly one synced batch");
  assert(mobileBatches.body.batches[0].items.length === 5, "Mobile capture listing did not include captured items");

  const viewerMobileList = await fetchJson(`${baseUrl}api/mobile/capture-batches`, {
    headers: principalHeaders("client-show-suite")
  });
  assert(viewerMobileList.response.ok, "Client viewer should list scoped technician mobile capture batches");
  assert(viewerMobileList.body.batches.length === 1, "Client viewer should see the synced show-suite capture");
  assert(viewerMobileList.body.batches[0].clientId === "show-suite", "Client viewer mobile capture listing escaped client scope");
  assert(viewerMobileList.body.batches[0].items.length === 5, "Client viewer mobile capture listing did not include captured items");
  const clientEvidenceAfterMobile = await fetchJson(`${baseUrl}api/proof/evidence-snapshot`, { headers: principalHeaders("client-show-suite") });
  assert(clientEvidenceAfterMobile.response.ok, "Client evidence snapshot should remain available after mobile sync");
  assert(clientEvidenceAfterMobile.body.package.fieldCaptures.length === 1, "Client evidence snapshot did not include the synced field capture");
  assert(clientEvidenceAfterMobile.body.package.fieldCaptures[0].items.some((item) => item.type === "exception"), "Client evidence snapshot did not retain the field exception item");

  const clientEventsAfterMobile = await fetchJson(`${baseUrl}api/ops-events`, {
    headers: principalHeaders("client-show-suite")
  });
  assert(clientEventsAfterMobile.body.events.some((event) => event.type === "mobile.capture.synced"), "Client-scoped events did not include mobile sync audit event");

  const storageAfterMobile = await fetchJson(`${baseUrl}api/storage`);
  assert(storageAfterMobile.body.counts.opsEvents === 12, "Mobile sync event was not retained in ops event log");
  assert(storageAfterMobile.body.mobileCapture.counts.captureBatches === 1, "Mobile capture batch count did not persist");
  assert(storageAfterMobile.body.mobileCapture.counts.captureItems === 5, "Mobile capture item count did not persist");
  assert(storageAfterMobile.body.mobileCapture.relationshipIntegrity.foreignKeyIssues === 0, "Mobile capture FK check found issues");

  const scopedModules = await fetchJson(`${baseUrl}api/modules?wallId=MJ-HK-021`, { headers: principalHeaders("client-show-suite") });
  assert(scopedModules.response.ok, "Client should read scoped module master data");
  assert(scopedModules.body.modules.length === 3, "Module list should expose all modules for the selected wall");
  assert(scopedModules.body.modules[0].monitoringDevices.temperature, "Module should expose temperature device configuration");

  const fieldReminders = await fetchJson(`${baseUrl}api/mobile/reminders`, { headers: principalHeaders("field-tech-show-suite") });
  assert(fieldReminders.response.ok, "Field technician reminder list failed");
  const visitReminder = fieldReminders.body.items.find((item) => item.sourceType === "workorder");
  assert(visitReminder?.mobileAction?.path.includes("mobile.html"), "Reminder did not expose a mobile action path");
  const reminderAction = await fetchJson(`${baseUrl}api/mobile/reminder-actions`, {
    method: "POST",
    headers: jsonHeaders("field-tech-show-suite"),
    body: JSON.stringify({ reminderId: visitReminder.id, status: "completed", actionType: visitReminder.mobileAction.actionType, clientId: visitReminder.clientId, wallId: visitReminder.wallId, workorderId: visitReminder.workorderId, moduleId: mobileBatch.moduleId, captureBatchId: mobileBatch.id })
  });
  assert(reminderAction.response.status === 201, "Completing a mobile reminder should persist an action");
  assert(reminderAction.body.action.status === "completed", "Mobile reminder action did not become completed");

  const telemetryDenied = await fetchJson(`${baseUrl}api/telemetry/sensor-readings`, {
    method: "POST",
    headers: jsonHeaders("client-show-suite"),
    body: JSON.stringify({ id: "TH-DENIED-001", sensorId: "SNS-021-LIGHT", wallId: "MJ-HK-001", type: "Light exposure", value: 70, unit: "%", status: "ok", observedAt: "2026-07-15T09:30:00.000Z" })
  });
  assert(telemetryDenied.response.status === 403, "Client viewer should not ingest sensor telemetry");

  const telemetryInput = { id: "TH-9001", sensorId: "MJ-HK-021-M01-TEMP", wallId: "MJ-HK-021", moduleId: "MJ-HK-021-M01", metric: "temperature", type: "temperature", value: 24.5, unit: "C", status: "ok", observedAt: "2026-07-15T09:30:00.000Z", source: "gateway-pilot-01" };
  const telemetryIngest = await fetchJson(`${baseUrl}api/telemetry/sensor-readings`, {
    method: "POST",
    headers: jsonHeaders("fm-lead"),
    body: JSON.stringify(telemetryInput)
  });
  assert(telemetryIngest.response.status === 201, "Sensor telemetry ingestion should create a history row");
  assert(telemetryIngest.body.duplicate === false, "First sensor telemetry ingestion should not be duplicate");
  assert(telemetryIngest.body.event.type === "telemetry.sensor.ingested", "Sensor telemetry ingestion should create an audit event");

  const telemetrySecond = await fetchJson(`${baseUrl}api/telemetry/sensor-readings`, {
    method: "POST",
    headers: jsonHeaders("fm-lead"),
    body: JSON.stringify({ ...telemetryInput, id: "TH-9002", value: 66, status: "watch", observedAt: "2026-07-15T09:35:00.000Z" })
  });
  assert(telemetrySecond.response.status === 201, "Second sensor telemetry ingestion should create a history row");
  const telemetryDuplicate = await fetchJson(`${baseUrl}api/telemetry/sensor-readings`, {
    method: "POST",
    headers: jsonHeaders("fm-lead"),
    body: JSON.stringify(telemetryInput)
  });
  assert(telemetryDuplicate.response.ok && telemetryDuplicate.body.duplicate === true, "Repeated sensor timestamp should be idempotent");

  const sensorHistory = await fetchJson(`${baseUrl}api/telemetry/sensor-history/MJ-HK-021`, { headers: principalHeaders("client-show-suite") });
  assert(sensorHistory.response.ok, "Client should read sensor history for its scoped wall");
  assert(sensorHistory.body.readings.length === 2, "Sensor history should return both pilot readings");
  const sensorScore = await fetchJson(`${baseUrl}api/telemetry/health-scores/MJ-HK-021/recompute`, { method: "POST", headers: jsonHeaders("fm-lead") });
  assert(sensorScore.response.ok, "Sensor stability score recompute failed");
  assert(sensorScore.body.score.scoreType === "sensor-stability", "Health score should identify its sensor-only method");
  assert(sensorScore.body.score.score === 50, "Sensor stability score should reflect latest watch status");

  const storageAfterTelemetry = await fetchJson(`${baseUrl}api/storage`, { headers: principalHeaders("fm-lead") });
  assert(storageAfterTelemetry.body.counts.opsEvents === 15, "Telemetry events were not retained in ops event log");
  assert(storageAfterTelemetry.body.telemetry.counts.sensorReadingHistory === 2, "Telemetry history rows did not persist");
  assert(storageAfterTelemetry.body.telemetry.counts.healthScoreSnapshots === 1, "Health score snapshot did not persist");

  const initialMediaVault = await fetchJson(`${baseUrl}api/proof/media-vault`, {
    headers: principalHeaders("client-show-suite")
  });
  assert(initialMediaVault.response.ok, "Client-scoped proof media vault read failed");
  assert(initialMediaVault.body.uploadPolicy.requiredIntegrity.includes("sha256"), "Proof media vault did not expose SHA-256 integrity policy");
  assert(initialMediaVault.body.objects.length === 0, "Proof media vault should start empty before media registration");

  const viewerDeniedMediaIntent = await fetchJson(`${baseUrl}api/proof/media-intents`, {
    method: "POST",
    headers: jsonHeaders("client-show-suite"),
    body: JSON.stringify({
      id: "PM-DENIED-001",
      clientId: "show-suite",
      wallId: "MJ-HK-021",
      workorderId: "WO-1047",
      filename: "viewer-denied.jpg",
      contentType: "image/jpeg",
      byteSize: 1200,
      sha256: "b".repeat(64)
    })
  });
  assert(viewerDeniedMediaIntent.response.status === 403, "Client viewer should not create proof media upload intents");

  const fieldCrossClientMediaDenied = await fetchJson(`${baseUrl}api/proof/media-intents`, {
    method: "POST",
    headers: jsonHeaders("field-tech-show-suite"),
    body: JSON.stringify({
      id: "PM-DENIED-002",
      clientId: "central-office",
      wallId: "MJ-HK-001",
      workorderId: "WO-1051",
      filename: "cross-client.jpg",
      contentType: "image/jpeg",
      byteSize: 1200,
      sha256: "c".repeat(64)
    })
  });
  assert(fieldCrossClientMediaDenied.response.status === 403, "Field technician should not create proof media outside assigned client");

  const mismatchedMediaIntent = await fetchJson(`${baseUrl}api/proof/media-intents`, {
    method: "POST",
    headers: jsonHeaders("fm-lead"),
    body: JSON.stringify({
      id: "PM-DENIED-003",
      clientId: "show-suite",
      wallId: "MJ-HK-001",
      workorderId: "WO-1047",
      proofRecordId: "PRF-1047",
      filename: "mismatch.jpg",
      contentType: "image/jpeg",
      byteSize: 1200,
      sha256: "d".repeat(64)
    })
  });
  assert(mismatchedMediaIntent.response.status === 400, "Mismatched proof media scope should fail validation");
  assert(mismatchedMediaIntent.body.code === "PROOF_MEDIA_SCOPE_MISMATCH", "Mismatched proof media did not expose scope mismatch code");

  const proofBytes = Buffer.from("DR FOREST field evidence: show-suite north zone\n", "utf8");
  const proofMedia = {
    id: "PM-9001",
    clientId: "show-suite",
    wallId: "MJ-HK-021",
    workorderId: "WO-1047",
    proofRecordId: "PRF-1047",
    captureBatchId: "MCB-9001",
    captureItemId: "MCB-9001-ITEM-1",
    category: "after-care-photo",
    filename: "show-suite-low-light-after.jpg",
    contentType: "image/jpeg",
    byteSize: proofBytes.length,
    sha256: createHash("sha256").update(proofBytes).digest("hex"),
    source: "technician-mobile",
    metadata: {
      zone: "North",
      cameraAngle: "fixed-front",
      privacy: "plant-zone-only"
    }
  };

  const mediaIntent = await fetchJson(`${baseUrl}api/proof/media-intents`, {
    method: "POST",
    headers: jsonHeaders("field-tech-show-suite"),
    body: JSON.stringify(proofMedia)
  });
  assert(mediaIntent.response.status === 201, "Assigned field technician proof media intent should be created");
  assert(mediaIntent.body.duplicate === false, "First proof media intent should not be duplicate");
  assert(mediaIntent.body.object.uploadStatus === "intent-created", "Proof media intent should start as intent-created");
  assert(mediaIntent.body.upload.putUrl.startsWith("drf-local-upload://"), "Proof media intent did not return local upload placeholder URL");
  assert(mediaIntent.body.object.links.length === 5, "Proof media intent did not link wall, work order, proof and mobile capture records");

  const duplicateMediaIntent = await fetchJson(`${baseUrl}api/proof/media-intents`, {
    method: "POST",
    headers: jsonHeaders("field-tech-show-suite"),
    body: JSON.stringify(proofMedia)
  });
  assert(duplicateMediaIntent.response.ok, "Duplicate proof media intent should return existing object");
  assert(duplicateMediaIntent.body.duplicate === true, "Duplicate proof media intent should be marked duplicate");

  const mediaHashMismatch = await fetchJson(`${baseUrl}api/proof/media-evidence`, {
    method: "POST",
    headers: jsonHeaders("field-tech-show-suite"),
    body: JSON.stringify({
      id: "PM-9001",
      byteSize: proofBytes.length,
      sha256: "e".repeat(64)
    })
  });
  assert(mediaHashMismatch.response.status === 400, "Proof media registration should reject hash mismatch");
  assert(mediaHashMismatch.body.code === "PROOF_MEDIA_HASH_MISMATCH", "Proof media hash mismatch did not expose mismatch code");

  const mediaRegister = await fetchJson(`${baseUrl}api/proof/media-evidence/PM-9001/upload`, {
    method: "POST",
    headers: jsonHeaders("field-tech-show-suite"),
    body: JSON.stringify({
      fileBase64: proofBytes.toString("base64"),
      uploadedAt: "2026-07-15T09:23:00.000Z"
    })
  });
  assert(mediaRegister.response.status === 201, "Proof media upload should create registered evidence");
  assert(mediaRegister.body.duplicate === false, "First proof media upload should not be duplicate");
  assert(mediaRegister.body.object.uploadStatus === "registered", "Proof media upload did not mark object registered");
  assert(mediaRegister.body.event.type === "proof.media.uploaded", "Proof media upload did not create audit event");

  const uploadedProofFile = await fetch(`${baseUrl}api/proof/media-evidence/PM-9001/file`, {
    headers: principalHeaders("client-show-suite")
  });
  assert(uploadedProofFile.status === 200, "Client should read its uploaded proof media file");
  assert(uploadedProofFile.headers.get("content-type") === "image/jpeg", "Proof media file content type was not retained");
  assert(Buffer.from(await uploadedProofFile.arrayBuffer()).equals(proofBytes), "Stored proof media bytes did not match uploaded evidence");

  const duplicateMediaRegister = await fetchJson(`${baseUrl}api/proof/media-evidence`, {
    method: "POST",
    headers: jsonHeaders("field-tech-show-suite"),
    body: JSON.stringify({
      id: "PM-9001",
      byteSize: proofBytes.length,
      sha256: proofMedia.sha256,
      uploadedAt: "2026-07-15T09:23:00.000Z"
    })
  });
  assert(duplicateMediaRegister.response.ok, "Duplicate proof media registration should return existing object");
  assert(duplicateMediaRegister.body.duplicate === true, "Duplicate proof media registration should be marked duplicate");
  assert(duplicateMediaRegister.body.event === null, "Duplicate proof media registration should not create a second event");

  const viewerDeniedMediaVerify = await fetchJson(`${baseUrl}api/proof/media-evidence/PM-9001/verify`, {
    method: "PUT",
    headers: jsonHeaders("client-show-suite"),
    body: JSON.stringify({
      status: "verified",
      note: "Viewer should not verify evidence."
    })
  });
  assert(viewerDeniedMediaVerify.response.status === 403, "Client viewer should not verify proof media");

  const mediaVerify = await fetchJson(`${baseUrl}api/proof/media-evidence/PM-9001/verify`, {
    method: "PUT",
    headers: jsonHeaders("fm-lead"),
    body: JSON.stringify({
      status: "verified",
      note: "SHA-256 and fixed-angle proof metadata reviewed for client report."
    })
  });
  assert(mediaVerify.response.ok, "FM lead proof media verification failed");
  assert(mediaVerify.body.object.uploadStatus === "verified", "Proof media verification did not mark object verified");
  assert(mediaVerify.body.object.verifiedBy === "Hong Kong FM Lead", "Proof media verification did not default reviewer to FM lead");
  assert(mediaVerify.body.event.type === "proof.media.verified", "Proof media verification did not create verified event");

  const clientMediaVault = await fetchJson(`${baseUrl}api/proof/media-vault`, {
    headers: principalHeaders("client-show-suite")
  });
  assert(clientMediaVault.response.ok, "Client-scoped proof media vault failed after verification");
  assert(clientMediaVault.body.objects.length === 1, "Client-scoped proof media vault should expose one scoped object");
  assert(clientMediaVault.body.objects[0].id === "PM-9001", "Client-scoped proof media vault returned wrong object");
  assert(clientMediaVault.body.objects[0].uploadStatus === "verified", "Client-scoped proof media vault did not expose verified status");
  assert(clientMediaVault.body.objects[0].integrity.sha256 === proofMedia.sha256, "Client-scoped proof media vault did not expose SHA-256 integrity");

  const clientEventsAfterProofMedia = await fetchJson(`${baseUrl}api/ops-events`, {
    headers: principalHeaders("client-show-suite")
  });
  assert(clientEventsAfterProofMedia.body.events.some((event) => event.type === "proof.media.uploaded"), "Client-scoped events did not include proof media upload");
  assert(clientEventsAfterProofMedia.body.events.some((event) => event.type === "proof.media.verified"), "Client-scoped events did not include proof media verification");

  const storageAfterProofMedia = await fetchJson(`${baseUrl}api/storage`);
  assert(storageAfterProofMedia.body.counts.opsEvents === 17, "Proof media, telemetry and reminder events were not retained in ops event log");
  assert(storageAfterProofMedia.body.proofMedia.counts.mediaObjects === 1, "Proof media object count did not persist");
  assert(storageAfterProofMedia.body.proofMedia.counts.mediaLinks === 5, "Proof media link count did not persist");
  assert(storageAfterProofMedia.body.proofMedia.counts.verified === 1, "Proof media verified count did not persist");
  assert(storageAfterProofMedia.body.proofMedia.hashCoverage.mediaObjectsWithSha256 === 1, "Proof media hash coverage did not persist");
  assert(storageAfterProofMedia.body.proofMedia.relationshipIntegrity.foreignKeyIssues === 0, "Proof media FK check found issues");

  const maintenanceTemplate = await fetch(`${baseUrl}api/admin/imports/maintenance/template.csv`, { headers: principalHeaders("fm-lead") });
  assert(maintenanceTemplate.ok && (await maintenanceTemplate.text()).startsWith("record_id,wall_id,service_date"), "Maintenance import template endpoint did not return the Airtable CSV contract");
  const invalidMaintenancePreview = await fetchJson(`${baseUrl}api/admin/imports/maintenance/preview`, { method: "POST", headers: jsonHeaders("fm-lead"), body: JSON.stringify({ filename: "airtable-invalid.csv", csv: "record_id,wall_id,service_date,status,priority\nrec-bad,UNKNOWN-WALL,not-a-date,Unknown,urgent\n" }) });
  assert(invalidMaintenancePreview.response.status === 201 && invalidMaintenancePreview.body.batch.invalidCount === 1 && invalidMaintenancePreview.body.batch.validCount === 0, "Maintenance import preview did not retain invalid Airtable rows without applying them");
  const invalidMaintenanceApply = await fetchJson(`${baseUrl}api/admin/imports/maintenance/${encodeURIComponent(invalidMaintenancePreview.body.batch.id)}/apply`, { method: "POST", headers: jsonHeaders("fm-lead"), body: "{}" });
  assert(invalidMaintenanceApply.response.status === 409 && invalidMaintenanceApply.body.code === "MAINTENANCE_IMPORT_HAS_ERRORS", "Maintenance import with invalid rows should be blocked from apply");
  const maintenanceCsv = "record_id,wall_id,service_date,status,priority,technician_id,tasks,notes,updated_at\nrec-good-001,MJ-HK-021,2026-08-29,Completed,medium,field-tech-show-suite,Water check;Photo capture,\"Imported, from Airtable\",2026-08-29T09:00:00+08:00\n";
  const maintenancePreview = await fetchJson(`${baseUrl}api/admin/imports/maintenance/preview`, { method: "POST", headers: jsonHeaders("fm-lead"), body: JSON.stringify({ filename: "airtable-maintenance.csv", csv: maintenanceCsv }) });
  assert(maintenancePreview.response.status === 201 && maintenancePreview.body.batch.validCount === 1 && maintenancePreview.body.batch.invalidCount === 0, "Valid Airtable maintenance CSV did not produce an applicable preview");
  const duplicateMaintenancePreview = await fetchJson(`${baseUrl}api/admin/imports/maintenance/preview`, { method: "POST", headers: jsonHeaders("fm-lead"), body: JSON.stringify({ filename: "airtable-maintenance-copy.csv", csv: maintenanceCsv }) });
  assert(duplicateMaintenancePreview.response.ok && duplicateMaintenancePreview.body.duplicate === true && duplicateMaintenancePreview.body.batch.id === maintenancePreview.body.batch.id, "Exact Airtable CSV preview should be checksum-idempotent");
  const maintenanceApplied = await fetchJson(`${baseUrl}api/admin/imports/maintenance/${encodeURIComponent(maintenancePreview.body.batch.id)}/apply`, { method: "POST", headers: jsonHeaders("fm-lead"), body: "{}" });
  assert(maintenanceApplied.response.ok && maintenanceApplied.body.imported === 1 && maintenanceApplied.body.workOrderIds[0].startsWith("AIR-rec-good-001-"), "Validated Airtable maintenance batch did not import a stable work order");
  const maintenanceAppliedAgain = await fetchJson(`${baseUrl}api/admin/imports/maintenance/${encodeURIComponent(maintenancePreview.body.batch.id)}/apply`, { method: "POST", headers: jsonHeaders("fm-lead"), body: "{}" });
  assert(maintenanceAppliedAgain.response.ok && maintenanceAppliedAgain.body.duplicate === true && maintenanceAppliedAgain.body.imported === 1, "Repeated maintenance apply should return the persisted result without duplicate work");
  const maintenancePortfolio = await fetchJson(`${baseUrl}api/portfolio`, { headers: principalHeaders("fm-lead") });
  assert(maintenancePortfolio.body.counts.workorders === 5, "Applied Airtable maintenance row did not persist as one work order");
  const clientMaintenanceDenied = await fetchJson(`${baseUrl}api/admin/imports/maintenance`, { headers: principalHeaders("client-show-suite") });
  assert(clientMaintenanceDenied.response.status === 403, "Client viewer should not read maintenance import batches");

  const maintenancePlans = await fetchJson(`${baseUrl}api/maintenance/plans`, { headers: principalHeaders("fm-lead") });
  assert(maintenancePlans.response.ok && maintenancePlans.body.plans.length === 4, "Pilot maintenance plan initialization should cover every living asset");
  const maintenanceViewerDenied = await fetchJson(`${baseUrl}api/maintenance/plans`, { headers: principalHeaders("client-show-suite") });
  assert(maintenanceViewerDenied.response.status === 403, "Client viewer should not read internal maintenance plans");
  const maintenancePlanUpdate = await fetchJson(`${baseUrl}api/maintenance/plans`, { method: "POST", headers: jsonHeaders("fm-lead"), body: JSON.stringify({ wallId: "MJ-HK-021", serviceType: "Preventive plant care", cadenceDays: 7, nextDueDate: "2026-08-31", durationMinutes: 90, tasks: ["Plant health check", "Fixed-angle proof photo"], requiredSkills: ["plant-care", "visual-diagnosis"] }) });
  assert(maintenancePlanUpdate.response.ok && maintenancePlanUpdate.body.plan.nextDueDate === "2026-08-31", "FM Lead should update an asset maintenance plan");
  const generationWithoutKey = await fetchJson(`${baseUrl}api/maintenance/generate`, { method: "POST", headers: jsonHeaders("fm-lead"), body: JSON.stringify({ fromDate: "2026-08-31", throughDate: "2026-09-07" }) });
  assert(generationWithoutKey.response.status === 428, "Maintenance generation should require an idempotency key");
  const generationHeaders = { ...jsonHeaders("fm-lead"), "Idempotency-Key": "api-maintenance-generation-001" };
  const maintenanceGeneration = await fetchJson(`${baseUrl}api/maintenance/generate`, { method: "POST", headers: generationHeaders, body: JSON.stringify({ fromDate: "2026-08-31", throughDate: "2026-09-07" }) });
  assert(maintenanceGeneration.response.status === 201 && maintenanceGeneration.body.run.generatedCount > 0, "Maintenance generation should persist due work orders");
  const duplicateMaintenanceGeneration = await fetchJson(`${baseUrl}api/maintenance/generate`, { method: "POST", headers: generationHeaders, body: JSON.stringify({ fromDate: "2026-08-31", throughDate: "2026-09-07" }) });
  assert(duplicateMaintenanceGeneration.response.ok && duplicateMaintenanceGeneration.body.duplicate === true && duplicateMaintenanceGeneration.body.run.id === maintenanceGeneration.body.run.id, "Maintenance generation retry should return the original result");
  const maintenanceCalendar = await fetchJson(`${baseUrl}api/maintenance/calendar?fromDate=2026-07-01&throughDate=2026-09-07`, { headers: principalHeaders("fm-lead") });
  assert(maintenanceCalendar.response.ok && maintenanceCalendar.body.occurrences.length === maintenanceGeneration.body.run.generatedCount, "Maintenance calendar should expose every generated occurrence");
  assert(maintenanceCalendar.body.summary.unassigned > 0, "Generated maintenance work orders should remain visibly unassigned until dispatch");
  const generatedShowSuite = maintenanceCalendar.body.occurrences.find((item) => item.wallId === "MJ-HK-021");
  assert(generatedShowSuite, "Maintenance calendar should contain a generated show-suite work order");
  const generatedAssignment = await fetchJson(`${baseUrl}api/workforce/assignments`, { method: "POST", headers: jsonHeaders("fm-lead"), body: JSON.stringify({ targetType: "work-order", targetId: generatedShowSuite.workOrderId, technicianId: "field-tech-show-suite", serviceDate: generatedShowSuite.serviceDate, estimatedMinutes: 90 }) });
  assert(generatedAssignment.response.status === 201 && generatedAssignment.body.assignment.targetId === generatedShowSuite.workOrderId, "Generated work order should enter the workforce ledger");
  const generatedPhoneRoute = await fetchJson(`${baseUrl}api/mobile/route`, { headers: principalHeaders("field-tech-show-suite") });
  assert(generatedPhoneRoute.response.ok && generatedPhoneRoute.body.route.some((item) => item.workOrderId === generatedShowSuite.workOrderId), "Assigned generated work order should appear on the technician phone route");

  const workforceViewerDenied = await fetchJson(`${baseUrl}api/workforce/technicians`, { headers: principalHeaders("client-show-suite") });
  assert(workforceViewerDenied.response.status === 403, "Client viewer should not read the workforce roster");
  const bulkTechnician = await fetchJson(`${baseUrl}api/workforce/technicians`, { method: "POST", headers: jsonHeaders("fm-lead"), body: JSON.stringify({ id: "field-tech-bulk", displayName: "Bulk Dispatch Test Technician", status: "active", skills: ["*"], districts: ["*"], shiftStart: "00:00", shiftEnd: "23:59", maxDailyMinutes: 480 }) });
  assert(bulkTechnician.response.status === 201 && bulkTechnician.body.technician.id === "field-tech-bulk", "FM Lead should create a workforce technician profile");
  const limitedTechnician = await fetchJson(`${baseUrl}api/workforce/technicians`, { method: "POST", headers: jsonHeaders("fm-lead"), body: JSON.stringify({ id: "field-tech-limited", displayName: "Limited District Technician", status: "active", skills: ["plant-care"], districts: ["Central"], shiftStart: "08:00", shiftEnd: "18:00", maxDailyMinutes: 120 }) });
  assert(limitedTechnician.response.status === 201, "FM Lead should create a district-limited technician profile");
  const workforceOverview = await fetchJson(`${baseUrl}api/workforce/candidates?serviceDate=2026-08-30`, { headers: principalHeaders("fm-lead") });
  assert(workforceOverview.response.ok && workforceOverview.body.candidates.some((item) => item.technician.id === "field-tech-bulk" && item.eligible), "Workforce candidates should expose eligible daily capacity");
  const workOrderAssignment = await fetchJson(`${baseUrl}api/workforce/assignments`, { method: "POST", headers: jsonHeaders("fm-lead"), body: JSON.stringify({ targetType: "work-order", targetId: "WO-1051", technicianId: "field-tech-bulk", serviceDate: "2026-08-30", scheduledStart: "2026-08-30T09:00:00+08:00", estimatedMinutes: 90 }) });
  assert(workOrderAssignment.response.status === 201 && workOrderAssignment.body.assignment.targetId === "WO-1051", "Eligible work-order assignment should persist in the workforce ledger");
  const workforceAssignments = await fetchJson(`${baseUrl}api/workforce/assignments?technicianId=field-tech-bulk&serviceDate=2026-08-30`, { headers: principalHeaders("fm-lead") });
  assert(workforceAssignments.response.ok && workforceAssignments.body.assignments.length === 1, "Workforce assignment query should return the technician day plan");
  const wrongDistrictAssignment = await fetchJson(`${baseUrl}api/workforce/assignments`, { method: "POST", headers: jsonHeaders("fm-lead"), body: JSON.stringify({ targetType: "work-order", targetId: "WO-1047", technicianId: "field-tech-limited", serviceDate: "2026-08-30", estimatedMinutes: 60 }) });
  assert(wrongDistrictAssignment.response.status === 409 && wrongDistrictAssignment.body.code === "WORKFORCE_ASSIGNMENT_INELIGIBLE", "Workforce assignment should reject a technician outside the service district");

  const showSuiteBulkSeed = initialOperationsQuality.body.moduleReadiness.find((item) => item.clientId === "show-suite");
  const bulkSeeds = [showSuiteBulkSeed, initialOperationsQuality.body.moduleReadiness.find((item) => item.moduleId !== showSuiteBulkSeed?.moduleId)].filter(Boolean);
  assert(bulkSeeds.length === 2, "Remediation bulk test requires two module action items");
  const bulkTasks = [];
  for (const [index, seed] of bulkSeeds.entries()) {
    const created = await fetchJson(`${baseUrl}api/remediation/tasks`, { method: "POST", headers: jsonHeaders("fm-lead"), body: JSON.stringify({ moduleId: seed.moduleId, sourceKey: `bulk-sla-${index}`, reasons: ["Bulk dispatch and SLA escalation test."], priority: "normal" }) });
    assert(created.response.status === 201, "FM lead should create remediation tasks for bulk dispatch");
    bulkTasks.push(created.body.task);
  }
  const bulkTaskIds = bulkTasks.map((task) => task.id);
  const firstRemediationPage = await fetchJson(`${baseUrl}api/remediation/tasks?statuses=open,assigned,in_progress&limit=1`, { headers: principalHeaders("fm-lead") });
  assert(firstRemediationPage.response.ok && firstRemediationPage.body.tasks.length === 1 && firstRemediationPage.body.page.hasMore && firstRemediationPage.body.page.nextCursor, "Remediation queue did not return a bounded cursor page");
  const secondRemediationPage = await fetchJson(`${baseUrl}api/remediation/tasks?statuses=open,assigned,in_progress&limit=1&cursor=${encodeURIComponent(firstRemediationPage.body.page.nextCursor)}`, { headers: principalHeaders("fm-lead") });
  assert(secondRemediationPage.response.ok && secondRemediationPage.body.tasks.length === 1 && secondRemediationPage.body.tasks[0].id !== firstRemediationPage.body.tasks[0].id, "Remediation cursor did not advance to the next task");
  const invalidRemediationCursor = await fetchJson(`${baseUrl}api/remediation/tasks?cursor=not-a-cursor`, { headers: principalHeaders("fm-lead") });
  assert(invalidRemediationCursor.response.status === 400 && invalidRemediationCursor.body.code === "REMEDIATION_CURSOR_INVALID", "Invalid remediation cursor should return an explicit validation error");
  const overdueAt = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
  const missingBulkIdempotency = await fetchJson(`${baseUrl}api/remediation/tasks/bulk`, { method: "POST", headers: jsonHeaders("fm-lead"), body: JSON.stringify({ taskIds: bulkTaskIds, expectedUpdatedAtById: Object.fromEntries(bulkTasks.map((task) => [task.id, task.updatedAt])), priority: "high" }) });
  assert(missingBulkIdempotency.response.status === 428 && missingBulkIdempotency.body.code === "IDEMPOTENCY_KEY_REQUIRED", "Bulk dispatch should require an Idempotency-Key");
  const bulkDispatchHeaders = { ...jsonHeaders("fm-lead"), "Idempotency-Key": "bulk-dispatch-api-smoke-001" };
  const bulkDispatchBody = { taskIds: bulkTaskIds, expectedUpdatedAtById: Object.fromEntries(bulkTasks.map((task) => [task.id, task.updatedAt])), assignedTo: "field-tech-bulk", dueAt: overdueAt, priority: "high" };
  const bulkDispatched = await fetchJson(`${baseUrl}api/remediation/tasks/bulk`, { method: "POST", headers: bulkDispatchHeaders, body: JSON.stringify(bulkDispatchBody) });
  assert(bulkDispatched.response.ok && bulkDispatched.body.updated === 2 && bulkDispatched.body.tasks.every((task) => task.status === "assigned" && task.assignedTo === "field-tech-bulk" && task.escalationLevel === 0), "Bulk dispatch did not assign, schedule and prioritize every selected task");
  const replayedBulkDispatch = await fetchJson(`${baseUrl}api/remediation/tasks/bulk`, { method: "POST", headers: bulkDispatchHeaders, body: JSON.stringify(bulkDispatchBody) });
  assert(replayedBulkDispatch.response.ok && replayedBulkDispatch.body.duplicate === true && replayedBulkDispatch.body.updated === 2, "Repeated bulk dispatch did not return its persisted idempotent response");
  const reusedBulkKey = await fetchJson(`${baseUrl}api/remediation/tasks/bulk`, { method: "POST", headers: bulkDispatchHeaders, body: JSON.stringify({ ...bulkDispatchBody, priority: "low", expectedUpdatedAtById: Object.fromEntries(bulkDispatched.body.tasks.map((task) => [task.id, task.updatedAt])) }) });
  assert(reusedBulkKey.response.status === 409 && reusedBulkKey.body.code === "IDEMPOTENCY_KEY_REUSED", "Reusing a bulk dispatch key with a different request should be rejected");
  const staleBulkUpdate = await fetchJson(`${baseUrl}api/remediation/tasks/bulk`, { method: "POST", headers: { ...jsonHeaders("fm-lead"), "Idempotency-Key": "bulk-dispatch-api-smoke-stale" }, body: JSON.stringify({ taskIds: bulkTaskIds, expectedUpdatedAtById: Object.fromEntries(bulkTasks.map((task) => [task.id, task.updatedAt])), priority: "low" }) });
  assert(staleBulkUpdate.response.status === 409 && staleBulkUpdate.body.code === "REMEDIATION_BULK_VERSION_CONFLICT", "Bulk dispatch should reject stale task versions instead of overwriting newer state");
  const unrelatedFieldQueue = await fetchJson(`${baseUrl}api/remediation/tasks?statuses=open,assigned,in_progress`, { headers: principalHeaders("field-tech-show-suite") });
  assert(unrelatedFieldQueue.response.ok && unrelatedFieldQueue.body.tasks.length === 0 && unrelatedFieldQueue.body.summary.active === 0, "Field technician generic task query and summary should exclude another technician's assignment in the same client scope");
  const clientBulkDenied = await fetchJson(`${baseUrl}api/remediation/tasks/bulk`, { method: "POST", headers: jsonHeaders("client-show-suite"), body: JSON.stringify({ taskIds: bulkTaskIds, priority: "low" }) });
  assert(clientBulkDenied.response.status === 403, "Client viewer should not bulk-dispatch remediation tasks");
  const firstSlaScan = await fetchJson(`${baseUrl}api/remediation/sla-scan`, { method: "POST", headers: jsonHeaders("fm-lead"), body: "{}" });
  assert(firstSlaScan.response.ok && firstSlaScan.body.escalated === 2 && firstSlaScan.body.tasks.every((task) => task.escalationLevel === 2 && task.sla.state === "overdue_l2"), "SLA scan did not persist level-two escalation for six-hour overdue tasks");
  const secondSlaScan = await fetchJson(`${baseUrl}api/remediation/sla-scan`, { method: "POST", headers: jsonHeaders("fm-lead"), body: "{}" });
  assert(secondSlaScan.response.ok && secondSlaScan.body.escalated === 0, "Repeated SLA scan should not duplicate an existing escalation level");
  const remediationNotifications = await fetchJson(`${baseUrl}api/notifications?limit=50`, { headers: principalHeaders("fm-lead") });
  assert(remediationNotifications.body.notifications.filter((item) => item.eventType === "remediation.task.sla-escalated").length === 2, "SLA escalation did not create one idempotent notification per task and level");
  const bulkCancelled = await fetchJson(`${baseUrl}api/remediation/tasks/bulk`, { method: "POST", headers: { ...jsonHeaders("fm-lead"), "Idempotency-Key": "bulk-dispatch-api-smoke-cancel" }, body: JSON.stringify({ taskIds: bulkTaskIds, expectedUpdatedAtById: Object.fromEntries(firstSlaScan.body.tasks.map((task) => [task.id, task.updatedAt])), status: "cancelled" }) });
  assert(bulkCancelled.response.ok && bulkCancelled.body.tasks.every((task) => task.status === "cancelled"), "Bulk cancellation did not close the test dispatch tasks");

  const remediationSeed = initialOperationsQuality.body.moduleReadiness.find((item) => item.clientId === "show-suite") || initialOperationsQuality.body.moduleReadiness[0];
  const crossWorkOrderRemediation = await fetchJson(`${baseUrl}api/remediation/tasks`, {
    method: "POST",
    headers: jsonHeaders("fm-lead"),
    body: JSON.stringify({ moduleId: remediationSeed.moduleId, workOrderId: "WO-1051", sourceKey: "scope-mismatch-test", reasons: ["Cross-work-order binding must be rejected."], priority: "high" })
  });
  assert(crossWorkOrderRemediation.response.status === 400, "Remediation should reject a work order from another wall or client");
  assert(crossWorkOrderRemediation.body.code === "REMEDIATION_WORK_ORDER_SCOPE_MISMATCH", "Cross-work-order remediation rejection did not expose scope mismatch code");
  const createdRemediation = await fetchJson(`${baseUrl}api/remediation/tasks`, {
    method: "POST",
    headers: jsonHeaders("fm-lead"),
    body: JSON.stringify({ moduleId: remediationSeed.moduleId, sourceKey: remediationSeed.status, reasons: remediationSeed.reasons, priority: "high", assignedTo: "field-tech-show-suite" })
  });
  assert(createdRemediation.response.status === 201, "FM lead should create a remediation task");
  assert(createdRemediation.body.task.status === "open" && createdRemediation.body.task.assignedTo === "field-tech-show-suite", "Created remediation task did not retain assignment");
  assert(createdRemediation.body.task.workOrderId === remediationSeed.workOrderId && createdRemediation.body.task.workOrderId === "WO-1047", "Remediation create did not bind the current module work order");
  const duplicateRemediation = await fetchJson(`${baseUrl}api/remediation/tasks`, {
    method: "POST",
    headers: jsonHeaders("fm-lead"),
    body: JSON.stringify({ moduleId: remediationSeed.moduleId, sourceKey: remediationSeed.status, reasons: remediationSeed.reasons })
  });
  assert(duplicateRemediation.response.ok && duplicateRemediation.body.duplicate === true, "Active remediation task creation should be idempotent");
  const fieldRemediationList = await fetchJson(`${baseUrl}api/remediation/tasks?statuses=open,assigned,in_progress`, { headers: principalHeaders("field-tech-show-suite") });
  assert(fieldRemediationList.response.ok && fieldRemediationList.body.tasks.length === 1, "Field technician should read one scoped remediation task");
  const mobileRemediationList = await fetchJson(`${baseUrl}api/mobile/remediation-tasks?statuses=open,assigned,in_progress`, { headers: principalHeaders("field-tech-show-suite") });
  assert(mobileRemediationList.response.ok && mobileRemediationList.body.tasks.length === 1 && mobileRemediationList.body.tasks[0].module.id === remediationSeed.moduleId && mobileRemediationList.body.tasks[0].workOrderId === "WO-1047" && mobileRemediationList.body.tasks[0].mobileAction.workOrderId === "WO-1047", "Technician mobile should read the assigned module task with work-order context");
  const assignedRemediation = await fetchJson(`${baseUrl}api/remediation/tasks/${encodeURIComponent(createdRemediation.body.task.id)}`, {
    method: "PATCH",
    headers: jsonHeaders("fm-lead"),
    body: JSON.stringify({ status: "assigned", assignedTo: "field-tech-show-suite" })
  });
  assert(assignedRemediation.response.ok && assignedRemediation.body.task.status === "assigned", "FM lead should assign a remediation task");
  const invalidRemediationPriority = await fetchJson(`${baseUrl}api/remediation/tasks/${encodeURIComponent(createdRemediation.body.task.id)}`, {
    method: "PATCH",
    headers: jsonHeaders("fm-lead"),
    body: JSON.stringify({ priority: "urgent-but-undefined" })
  });
  assert(invalidRemediationPriority.response.status === 400, "Invalid remediation priority should return a validation error");
  const startedRemediation = await fetchJson(`${baseUrl}api/mobile/remediation-tasks/${encodeURIComponent(createdRemediation.body.task.id)}`, {
    method: "PATCH",
    headers: jsonHeaders("field-tech-show-suite"),
    body: JSON.stringify({ status: "in_progress" })
  });
  assert(startedRemediation.response.ok && startedRemediation.body.task.status === "in_progress", "Assigned field technician should start a remediation task");
  assert(startedRemediation.body.task.acceptedBy === "field-tech-show-suite" && startedRemediation.body.task.acceptedAt, "Technician acceptance actor and timestamp were not persisted");
  const directResolutionDenied = await fetchJson(`${baseUrl}api/mobile/remediation-tasks/${encodeURIComponent(createdRemediation.body.task.id)}`, {
    method: "PATCH",
    headers: jsonHeaders("field-tech-show-suite"),
    body: JSON.stringify({ status: "resolved", resolutionNote: "Field review completed; follow-up capture recorded.", evidenceRef: "CAP-UI-001" })
  });
  assert(directResolutionDenied.response.status === 403 && directResolutionDenied.body.code === "MOBILE_REMEDIATION_REVIEW_REQUIRED", "Technician should not resolve a remediation task without FM review");
  const submittedRemediation = await fetchJson(`${baseUrl}api/mobile/remediation-tasks/${encodeURIComponent(createdRemediation.body.task.id)}`, {
    method: "PATCH",
    headers: jsonHeaders("field-tech-show-suite"),
    body: JSON.stringify({ submitForReview: true, resolutionNote: "Field review completed; follow-up capture recorded.", evidenceRef: "CAP-UI-001" })
  });
  assert(submittedRemediation.response.ok && submittedRemediation.body.task.status === "in_progress" && submittedRemediation.body.task.reviewStatus === "pending", "Technician evidence should remain active while awaiting FM review");
  assert(submittedRemediation.body.task.submittedBy === "field-tech-show-suite" && submittedRemediation.body.task.submittedAt, "Review submission actor and timestamp were not persisted");
  assert(submittedRemediation.body.event.type === "remediation.task.review-submitted", "Review submission did not append a dedicated audit event");
  const qualityPendingReview = await fetchJson(`${baseUrl}api/ops/quality`, { headers: principalHeaders("fm-lead") });
  assert(qualityPendingReview.body.summary.openRemediationTasks === 1 && qualityPendingReview.body.moduleReadiness.some((item) => item.remediationTask?.reviewStatus === "pending"), "Pending FM review should remain in the operations action queue");
  const rejectedRemediation = await fetchJson(`${baseUrl}api/remediation/tasks/${encodeURIComponent(createdRemediation.body.task.id)}`, {
    method: "PATCH",
    headers: jsonHeaders("fm-lead"),
    body: JSON.stringify({ reviewDecision: "rejected", reviewNote: "Retake the fixed-angle photo after reconnecting the gateway." })
  });
  assert(rejectedRemediation.response.ok && rejectedRemediation.body.task.status === "assigned" && rejectedRemediation.body.task.reviewStatus === "rejected", "FM rejection should return the task to the assigned technician");
  assert(rejectedRemediation.body.task.reviewedBy === "fm-lead" && rejectedRemediation.body.task.reviewedAt, "FM rejection reviewer and timestamp were not persisted");
  assert(rejectedRemediation.body.event.type === "remediation.task.review-rejected", "FM rejection did not append a dedicated audit event");
  const restartedRemediation = await fetchJson(`${baseUrl}api/mobile/remediation-tasks/${encodeURIComponent(createdRemediation.body.task.id)}`, { method: "PATCH", headers: jsonHeaders("field-tech-show-suite"), body: JSON.stringify({ status: "in_progress" }) });
  assert(restartedRemediation.response.ok && restartedRemediation.body.task.reviewStatus === "rejected", "Rejected remediation task should be resumable without losing review history");
  const resubmittedRemediation = await fetchJson(`${baseUrl}api/mobile/remediation-tasks/${encodeURIComponent(createdRemediation.body.task.id)}`, { method: "PATCH", headers: jsonHeaders("field-tech-show-suite"), body: JSON.stringify({ submitForReview: true, resolutionNote: "Gateway reconnected and fixed-angle evidence retaken.", evidenceRef: "CAP-UI-002" }) });
  assert(resubmittedRemediation.response.ok && resubmittedRemediation.body.task.reviewStatus === "pending" && resubmittedRemediation.body.task.reviewNote === null, "Resubmission should clear the prior decision while retaining a pending review state");
  const approvedRemediation = await fetchJson(`${baseUrl}api/remediation/tasks/${encodeURIComponent(createdRemediation.body.task.id)}`, {
    method: "PATCH",
    headers: jsonHeaders("fm-lead"),
    body: JSON.stringify({ reviewDecision: "approved", reviewNote: "Fixed-angle evidence confirms gateway recovery and current readings." })
  });
  assert(approvedRemediation.response.ok && approvedRemediation.body.task.status === "resolved" && approvedRemediation.body.task.reviewStatus === "approved", "FM approval should resolve the remediation task");
  assert(approvedRemediation.body.task.reviewedBy === "fm-lead" && approvedRemediation.body.task.resolvedAt, "FM approval audit fields were not persisted");
  assert(approvedRemediation.body.event.type === "remediation.task.review-approved", "FM approval did not append a dedicated audit event");
  const clientRemediationDenied = await fetchJson(`${baseUrl}api/remediation/tasks`, { headers: principalHeaders("client-show-suite") });
  assert(clientRemediationDenied.response.status === 403, "Client viewer should not read internal remediation tasks");
  const clientMobileRemediationDenied = await fetchJson(`${baseUrl}api/mobile/remediation-tasks`, { headers: principalHeaders("client-show-suite") });
  assert(clientMobileRemediationDenied.response.status === 403, "Client viewer should not read technician remediation tasks");

  const clientInventoryDenied = await fetchJson(`${baseUrl}api/inventory/overview`, { headers: principalHeaders("client-show-suite") });
  assert(clientInventoryDenied.response.status === 403, "Client viewer should not read internal inventory");
  const inventoryWorkOrderId = generatedShowSuite.workOrderId;
  const inventoryOverview = await fetchJson(`${baseUrl}api/inventory/overview`, { headers: principalHeaders("fm-lead") });
  assert(inventoryOverview.response.ok && inventoryOverview.body.locations.some((item) => item.kind === "warehouse") && inventoryOverview.body.locations.some((item) => item.technicianId === "field-tech-show-suite"), "FM inventory overview should expose warehouse and technician kit locations");
  assert(inventoryOverview.body.summary.lowStockWarehouse === 0, "Pilot warehouse opening balances should start above reorder points");
  const missingInventoryIdempotency = await fetchJson(`${baseUrl}api/inventory/reservations`, { method: "POST", headers: jsonHeaders("fm-lead"), body: JSON.stringify({ workOrderId: inventoryWorkOrderId, technicianId: "field-tech-show-suite", sourceLocationId: "warehouse-hk", sku: "NUT-A", quantity: 250 }) });
  assert(missingInventoryIdempotency.response.status === 428 && missingInventoryIdempotency.body.code === "IDEMPOTENCY_KEY_REQUIRED", "Inventory reservation should require Idempotency-Key");
  const reservationHeaders = { ...jsonHeaders("fm-lead"), "Idempotency-Key": "inventory-reserve-api-smoke-001" };
  const reservationBody = { workOrderId: inventoryWorkOrderId, technicianId: "field-tech-show-suite", sourceLocationId: "warehouse-hk", sku: "NUT-A", quantity: 250 };
  const inventoryReservation = await fetchJson(`${baseUrl}api/inventory/reservations`, { method: "POST", headers: reservationHeaders, body: JSON.stringify(reservationBody) });
  assert(inventoryReservation.response.status === 201 && inventoryReservation.body.reservation.remainingQuantity === 250, "FM lead should reserve warehouse stock against a work order");
  const replayedInventoryReservation = await fetchJson(`${baseUrl}api/inventory/reservations`, { method: "POST", headers: reservationHeaders, body: JSON.stringify(reservationBody) });
  assert(replayedInventoryReservation.response.ok && replayedInventoryReservation.body.duplicate === true, "Inventory reservation replay should return the original response");
  const reusedInventoryKey = await fetchJson(`${baseUrl}api/inventory/reservations`, { method: "POST", headers: reservationHeaders, body: JSON.stringify({ ...reservationBody, quantity: 251 }) });
  assert(reusedInventoryKey.response.status === 409 && reusedInventoryKey.body.code === "IDEMPOTENCY_KEY_REUSED", "Inventory idempotency key reuse with a different payload should be rejected");
  const inventoryTransfer = await fetchJson(`${baseUrl}api/inventory/transactions`, { method: "POST", headers: { ...jsonHeaders("fm-lead"), "Idempotency-Key": "inventory-transfer-api-smoke-001" }, body: JSON.stringify({ type: "transfer", sourceLocationId: "warehouse-hk", destinationLocationId: "kit-field-tech-show-suite", workOrderId: inventoryWorkOrderId, sku: "NUT-A", quantity: 250, note: "API smoke route kit load" }) });
  assert(inventoryTransfer.response.status === 201 && inventoryTransfer.body.transactions.length === 2, "Reserved warehouse stock should transfer to the technician route kit");
  const fieldRouteKit = await fetchJson(`${baseUrl}api/mobile/route-kit`, { headers: principalHeaders("field-tech-show-suite") });
  assert(fieldRouteKit.response.ok && fieldRouteKit.body.locations.length === 1 && fieldRouteKit.body.locations.every((item) => item.kind === "technician-kit" && item.technicianId === "field-tech-show-suite"), "Field route-kit view should expose only the technician's own kit");
  assert(fieldRouteKit.body.balances.find((item) => item.locationId === "kit-field-tech-show-suite" && item.sku === "NUT-A")?.onHand === 250, "Route-kit load should be visible to the technician");
  const wrongKitConsumption = await fetchJson(`${baseUrl}api/inventory/consume`, { method: "POST", headers: { ...jsonHeaders("field-tech-show-suite"), "Idempotency-Key": "inventory-consume-wrong-kit" }, body: JSON.stringify({ locationId: "warehouse-hk", workOrderId: inventoryWorkOrderId, items: [{ sku: "NUT-A", quantity: 1 }] }) });
  assert(wrongKitConsumption.response.status === 403 && wrongKitConsumption.body.code === "INVENTORY_TECHNICIAN_SCOPE_DENIED", "Field technician should not consume warehouse stock");
  const consumeHeaders = { ...jsonHeaders("field-tech-show-suite"), "Idempotency-Key": "inventory-consume-api-smoke-001" };
  const consumeBody = { locationId: "kit-field-tech-show-suite", workOrderId: inventoryWorkOrderId, items: [{ sku: "NUT-A", quantity: 25 }], note: "Manual field consumption smoke" };
  const inventoryConsumption = await fetchJson(`${baseUrl}api/inventory/consume`, { method: "POST", headers: consumeHeaders, body: JSON.stringify(consumeBody) });
  assert(inventoryConsumption.response.status === 201 && inventoryConsumption.body.transactions[0].quantity === -25, "Assigned technician should consume from the own route kit");
  const replayedInventoryConsumption = await fetchJson(`${baseUrl}api/inventory/consume`, { method: "POST", headers: consumeHeaders, body: JSON.stringify(consumeBody) });
  assert(replayedInventoryConsumption.response.ok && replayedInventoryConsumption.body.duplicate === true, "Consumption replay should not deduct stock twice");
  const overdrawConsumption = await fetchJson(`${baseUrl}api/inventory/consume`, { method: "POST", headers: { ...jsonHeaders("field-tech-show-suite"), "Idempotency-Key": "inventory-consume-overdraw" }, body: JSON.stringify({ ...consumeBody, items: [{ sku: "NUT-A", quantity: 5000 }] }) });
  assert(overdrawConsumption.response.status === 409 && overdrawConsumption.body.code === "INVENTORY_INSUFFICIENT_STOCK", "Route-kit overdraw should fail without changing stock");
  const mobileInventoryBatch = { id: "MCB-INVENTORY-001", technicianId: "field-tech-show-suite", clientId: "show-suite", wallId: "MJ-HK-021", workorderId: inventoryWorkOrderId, deviceId: "offline-phone-inventory", capturedAt: "2026-09-01T09:20:00.000Z", notes: "Inventory-linked visit", consumables: [{ sku: "NUT-A", quantity: 10 }], items: [{ type: "nutrient", label: "Nutrient added", value: "10", unit: "ml" }, { type: "health-check", label: "Visual health score", value: "84", unit: "score" }] };
  const mobileInventorySync = await fetchJson(`${baseUrl}api/mobile/capture-batches`, { method: "POST", headers: jsonHeaders("field-tech-show-suite"), body: JSON.stringify(mobileInventoryBatch) });
  assert(mobileInventorySync.response.status === 201 && mobileInventorySync.body.inventory.status === "recorded" && mobileInventorySync.body.inventory.transactions.length === 1, "Mobile capture should post explicit consumables after saving evidence");
  const duplicateMobileInventorySync = await fetchJson(`${baseUrl}api/mobile/capture-batches`, { method: "POST", headers: jsonHeaders("field-tech-show-suite"), body: JSON.stringify(mobileInventoryBatch) });
  assert(duplicateMobileInventorySync.response.ok && duplicateMobileInventorySync.body.duplicate === true && duplicateMobileInventorySync.body.inventory.duplicate === true, "Duplicate mobile capture should not consume inventory twice");
  const inventoryAfter = await fetchJson(`${baseUrl}api/inventory/overview`, { headers: principalHeaders("fm-lead") });
  assert(inventoryAfter.body.balances.find((item) => item.locationId === "kit-field-tech-show-suite" && item.sku === "NUT-A")?.onHand === 215, "Transfer and two consumption paths should reconcile to 215 ml");
  assert(inventoryAfter.body.reservations.find((item) => item.workOrderId === inventoryWorkOrderId && item.sku === "NUT-A")?.status === "consumed", "Loading reserved stock should close the work-order reservation");
  const inventoryStorage = await fetchJson(`${baseUrl}api/storage`, { headers: principalHeaders("fm-lead") });
  assert(inventoryStorage.body.inventory.backend === "sqlite" && inventoryStorage.body.inventory.relationshipIntegrity.invalidBalances === 0 && inventoryStorage.body.inventory.counts.transactions === 4, "Storage health should expose reconciled inventory tables");
  const qualityAfterRemediation = await fetchJson(`${baseUrl}api/ops/quality`, { headers: principalHeaders("fm-lead") });
  assert(qualityAfterRemediation.body.summary.openRemediationTasks === 0, "FM-approved remediation task should leave no active task in the quality summary");
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
      DR_FOREST_RUNTIME_DIR: runtimeDir,
      DR_FOREST_OPERATOR_EMAIL: "ops@example.test",
      DR_FOREST_OPERATOR_PASSWORD: "pilot-password-123"
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
