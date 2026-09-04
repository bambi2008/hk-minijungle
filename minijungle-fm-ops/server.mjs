import { createServer } from "node:http";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { createHash, createHmac, randomUUID } from "node:crypto";
import { extname, join, normalize } from "node:path";
import {
  buildDataQualityReport,
  buildProductionSeed,
  loadOpsDataset,
  productionDataModel
} from "./lib/ops-data-model.mjs";
import { summarizeOpsState } from "./lib/ops-state-store.mjs";
import {
  appendSqliteOpsEvent,
  applySqliteOpsStateAction,
  listSqliteOpsEvents,
  readSqliteOpsEvents,
  readSqliteOpsState,
  readSqliteOpsStorageHealth,
  saveSqliteOpsStateSnapshot
} from "./lib/ops-sqlite-store.mjs";
import {
  appendPostgresOpsEvent,
  applyPostgresOpsStateAction,
  closePostgresPools,
  listPostgresOpsEvents,
  readPostgresOpsEvents,
  readPostgresOpsState,
  readPostgresOpsStorageHealth,
  savePostgresOpsStateSnapshot
} from "./lib/ops-postgres-store.mjs";
import {
  importSqliteMasterData,
  readSqliteMasterDataHealth,
  readSqliteMasterDataset,
  upsertSqliteClient,
  upsertSqliteLivingAsset,
  upsertSqliteSensorReading,
  upsertSqliteWorkOrder
} from "./lib/ops-master-data-store.mjs";
import {
  importPostgresMasterData,
  readPostgresMasterDataHealth,
  readPostgresMasterDataset,
  upsertPostgresClient,
  upsertPostgresLivingAsset,
  upsertPostgresSensorReading,
  upsertPostgresWorkOrder
} from "./lib/ops-postgres-master-data-store.mjs";
import {
  listPostgresModules,
  listPostgresModulePage,
  readPostgresModuleStorageHealth,
  upsertPostgresModule
} from "./lib/ops-postgres-module-store.mjs";
import {
  appendPostgresSensorReading,
  appendPostgresSensorReadings,
  calculatePostgresSensorStability,
  listPostgresLatestReadingsByModules,
  listPostgresSensorHistory,
  readPostgresTelemetryStorageHealth
} from "./lib/ops-postgres-telemetry-store.mjs";
import {
  listPostgresDevices,
  listPostgresDeviceCameraCaptures,
  consumePostgresDeviceReplay,
  readPostgresDeviceByKey,
  readPostgresDeviceCameraBytes,
  readPostgresDeviceCameraCapture,
  readPostgresDeviceStorageHealth,
  recordPostgresDeviceIngestion,
  recordPostgresDeviceIngestions,
  registerPostgresDevice,
  savePostgresDeviceCameraCapture,
  touchPostgresDevice,
  updatePostgresDevice
} from "./lib/ops-postgres-device-store.mjs";
import {
  listSqliteMobileCaptureBatches,
  readSqliteMobileCaptureStorageHealth,
  saveSqliteMobileCaptureBatch
} from "./lib/ops-mobile-store.mjs";
import {
  listPostgresMobileCaptureBatches,
  readPostgresMobileCaptureStorageHealth,
  savePostgresMobileCaptureBatch
} from "./lib/ops-postgres-mobile-store.mjs";
import {
  appendSqliteSensorReading,
  appendSqliteSensorReadings,
  calculateSqliteSensorStability,
  listSqliteLatestReadingsByModules,
  listSqliteSensorHistory,
  readSqliteTelemetryStorageHealth
} from "./lib/ops-telemetry-store.mjs";
import {
  evaluateSqliteTelemetryAlerts,
  evaluateSqliteTelemetryAlertsBatch,
  listSqliteAlertRules,
  listSqliteAlerts,
  readSqliteAlertStorageHealth,
  registerSqliteAlertRule,
  updateSqliteAlert
} from "./lib/ops-alert-store.mjs";
import {
  evaluatePostgresTelemetryAlerts,
  evaluatePostgresTelemetryAlertsBatch,
  listPostgresAlertRules,
  listPostgresAlerts,
  readPostgresAlertStorageHealth,
  registerPostgresAlertRule,
  updatePostgresAlert
} from "./lib/ops-postgres-alert-store.mjs";
import {
  createSqliteVisualDiagnosis,
  listSqliteVisualDiagnoses,
  readSqliteAiVisionStorageHealth,
  updateSqliteVisualDiagnosis
} from "./lib/ops-ai-store.mjs";
import {
  createPostgresVisualDiagnosis,
  listPostgresVisualDiagnoses,
  readPostgresAiVisionStorageHealth,
  updatePostgresVisualDiagnosis
} from "./lib/ops-postgres-ai-store.mjs";
import {
  listSqliteModules,
  listSqliteModulePage,
  readSqliteModuleStorageHealth,
  upsertSqliteModule
} from "./lib/ops-module-store.mjs";
import {
  listSqliteCommissioning,
  listSqliteCommissioningEvents,
  planSqliteCommissioning,
  readSqliteCommissioningByCode,
  readSqliteCommissioningHealth,
  transitionSqliteCommissioning
} from "./lib/ops-commissioning-store.mjs";
import {
  listPostgresCommissioning,
  listPostgresCommissioningEvents,
  planPostgresCommissioning,
  readPostgresCommissioningByCode,
  readPostgresCommissioningHealth,
  transitionPostgresCommissioning
} from "./lib/ops-postgres-commissioning-store.mjs";
import {
  applySqliteDeviceLifecycleAction,
  listSqliteDeviceLifecycle,
  listSqliteDeviceLifecycleEvents,
  readSqliteDeviceLifecycleHealth,
  upsertSqliteDeviceLifecycleProfile
} from "./lib/ops-device-lifecycle-store.mjs";
import {
  applyPostgresDeviceLifecycleAction,
  listPostgresDeviceLifecycle,
  listPostgresDeviceLifecycleEvents,
  readPostgresDeviceLifecycleHealth,
  upsertPostgresDeviceLifecycleProfile
} from "./lib/ops-postgres-device-lifecycle-store.mjs";
import {
  listSqliteDevices,
  listSqliteDeviceCameraCaptures,
  consumeSqliteDeviceReplay,
  readSqliteDeviceByKey,
  readSqliteDeviceCameraBytes,
  readSqliteDeviceCameraCapture,
  readSqliteDeviceStorageHealth,
  recordSqliteDeviceIngestion,
  recordSqliteDeviceIngestions,
  registerSqliteDevice,
  saveSqliteDeviceCameraCapture,
  touchSqliteDevice,
  updateSqliteDevice
} from "./lib/ops-device-store.mjs";
import {
  listSqliteReminderActions,
  readSqliteReminderStorageHealth,
  saveSqliteReminderAction
} from "./lib/ops-reminder-store.mjs";
import {
  listPostgresReminderActions,
  readPostgresReminderStorageHealth,
  savePostgresReminderAction
} from "./lib/ops-postgres-reminder-store.mjs";
import {
  createPostgresRemediationTask,
  listPostgresRemediationTasks,
  markPostgresRemediationEscalation,
  readPostgresRemediationDispatchSummary,
  readPostgresRemediationTask,
  readPostgresRemediationStorageHealth,
  updatePostgresRemediationTask
} from "./lib/ops-postgres-remediation-store.mjs";
import {
  createSqliteRemediationTask,
  listSqliteRemediationTasks,
  markSqliteRemediationEscalation,
  readSqliteRemediationDispatchSummary,
  readSqliteRemediationTask,
  readSqliteRemediationStorageHealth,
  updateSqliteRemediationTask
} from "./lib/ops-remediation-store.mjs";
import {
  enqueueSqliteNotification,
  listSqliteNotifications,
  readSqliteNotificationStorageHealth
} from "./lib/ops-notification-store.mjs";
import {
  enqueuePostgresNotification,
  listPostgresNotifications,
  readPostgresNotificationStorageHealth
} from "./lib/ops-postgres-notification-store.mjs";
import {
  abandonSqliteIdempotentCommand,
  acquireSqliteJobLease,
  beginSqliteIdempotentCommand,
  completeSqliteIdempotentCommand,
  createSqliteMaintenanceImport,
  listSqliteMaintenanceImports,
  readSqliteIntegrationStorageHealth,
  readSqliteMaintenanceImport,
  releaseSqliteJobLease
} from "./lib/ops-integration-store.mjs";
import {
  abandonPostgresIdempotentCommand,
  acquirePostgresJobLease,
  beginPostgresIdempotentCommand,
  completePostgresIdempotentCommand,
  createPostgresMaintenanceImport,
  listPostgresMaintenanceImports,
  readPostgresIntegrationStorageHealth,
  readPostgresMaintenanceImport,
  releasePostgresJobLease
} from "./lib/ops-postgres-integration-store.mjs";
import {
  applyPostgresMaintenanceImport,
  applySqliteMaintenanceImport
} from "./lib/ops-maintenance-import-apply.mjs";
import { defaultReliabilityJobs } from "./lib/ops-reliability-policy.mjs";
import {
  beginSqliteReliabilityRun,
  finishSqliteReliabilityRun,
  readSqliteReliabilityHealth,
  readSqliteReliabilityOverview,
  scanSqliteReliability,
  seedSqliteReliabilityJobs
} from "./lib/ops-reliability-store.mjs";
import {
  beginPostgresReliabilityRun,
  finishPostgresReliabilityRun,
  readPostgresReliabilityHealth,
  readPostgresReliabilityOverview,
  scanPostgresReliability,
  seedPostgresReliabilityJobs
} from "./lib/ops-postgres-reliability-store.mjs";
import { maintenanceImportTemplateCsv, normalizeMaintenanceCsv } from "./lib/ops-maintenance-import.mjs";
import { findStaleMaintenanceImportRows } from "./lib/ops-maintenance-import-policy.mjs";
import {
  evaluateSqliteWorkforceCandidates,
  listSqliteTechnicians,
  listSqliteWorkforceAssignments,
  readSqliteWorkforceAssignment,
  readSqliteWorkforceStorageHealth,
  upsertSqliteTechnician,
  upsertSqliteWorkforceAssignment
} from "./lib/ops-workforce-store.mjs";
import {
  evaluatePostgresWorkforceCandidates,
  listPostgresTechnicians,
  listPostgresWorkforceAssignments,
  readPostgresWorkforceAssignment,
  readPostgresWorkforceStorageHealth,
  upsertPostgresTechnician,
  upsertPostgresWorkforceAssignment
} from "./lib/ops-postgres-workforce-store.mjs";
import {
  generateSqliteMaintenanceOccurrences,
  listSqliteMaintenanceOccurrences,
  listSqliteMaintenancePlans,
  readSqliteMaintenancePlanningHealth,
  upsertSqliteMaintenancePlan
} from "./lib/ops-maintenance-planning-store.mjs";
import {
  generatePostgresMaintenanceOccurrences,
  listPostgresMaintenanceOccurrences,
  listPostgresMaintenancePlans,
  readPostgresMaintenancePlanningHealth,
  upsertPostgresMaintenancePlan
} from "./lib/ops-postgres-maintenance-planning-store.mjs";
import { addDays, cadenceDaysFromLabel, dateOnly, legacyNextDue } from "./lib/ops-maintenance-policy.mjs";
import {
  applySqliteInventoryMovement,
  consumeSqliteInventory,
  readSqliteInventoryHealth,
  readSqliteInventoryOverview,
  receiveSqliteInventoryLot,
  reviewSqliteInventoryStockCount,
  reserveSqliteInventory,
  seedSqliteInventory,
  submitSqliteInventoryStockCount
} from "./lib/ops-inventory-store.mjs";
import {
  applyPostgresInventoryMovement,
  consumePostgresInventory,
  readPostgresInventoryHealth,
  readPostgresInventoryOverview,
  readPostgresInventoryTraceability,
  receivePostgresInventoryLot,
  reviewPostgresInventoryStockCount,
  submitPostgresInventoryStockCount,
  reservePostgresInventory
} from "./lib/ops-postgres-inventory-store.mjs";
import {
  actionSqliteServiceContract,
  createSqliteServiceContract,
  evaluateSqliteServiceContract,
  listSqliteServiceContractEvents,
  listSqliteServiceContracts,
  readSqliteServiceContract,
  readSqliteServiceContractHealth,
  seedSqliteServiceContracts
} from "./lib/ops-service-contract-store.mjs";
import {
  actionPostgresServiceContract,
  createPostgresServiceContract,
  evaluatePostgresServiceContract,
  listPostgresServiceContractEvents,
  listPostgresServiceContracts,
  readPostgresServiceContract,
  readPostgresServiceContractHealth
} from "./lib/ops-postgres-service-contract-store.mjs";
import {
  ensureSqliteServiceContractVersionSchema,
  linkSqliteServiceContractSla,
  listSqliteServiceContractChanges,
  listSqliteServiceContractVersions,
  readSqliteServiceContractChange,
  readSqliteServiceContractPerformance,
  readSqliteServiceContractVersionHealth,
  requestSqliteServiceContractChange,
  reviewSqliteServiceContractChange,
  syncSqliteServiceContractVersion
} from "./lib/ops-service-contract-version-store.mjs";
import {
  ensurePostgresServiceContractVersionSchema,
  linkPostgresServiceContractSla,
  listPostgresServiceContractChanges,
  listPostgresServiceContractVersions,
  readPostgresServiceContractChange,
  readPostgresServiceContractPerformance,
  readPostgresServiceContractVersionHealth,
  requestPostgresServiceContractChange,
  reviewPostgresServiceContractChange,
  syncPostgresServiceContractVersion
} from "./lib/ops-postgres-service-contract-version-store.mjs";
import {
  ensurePostgresReleaseEvidenceSchema,
  listPostgresReleaseEvidence,
  listPostgresReleaseEvidenceEvents,
  readPostgresReleaseEvidenceHealth,
  readPostgresReleaseEvidenceSummary,
  reviewPostgresReleaseEvidence,
  submitPostgresReleaseEvidence
} from "./lib/ops-postgres-release-evidence-store.mjs";
import {
  ensureSqliteReleaseEvidenceSchema,
  listSqliteReleaseEvidence,
  listSqliteReleaseEvidenceEvents,
  readSqliteReleaseEvidenceHealth,
  readSqliteReleaseEvidenceSummary,
  reviewSqliteReleaseEvidence,
  submitSqliteReleaseEvidence
} from "./lib/ops-release-evidence-store.mjs";
import {
  buildEsgLedger,
  buildOperationalHealthReport,
  normalizeEsgPeriod,
  normalizeEsgObservation,
  operationalHealthMethodVersion
} from "./lib/ops-health-esg-policy.mjs";
import { buildPilotReconciliation } from "./lib/ops-pilot-reconciliation-policy.mjs";
import {
  createPostgresEsgObservation,
  ensurePostgresHealthEsgSchema,
  listPostgresEsgObservations,
  listPostgresEsgPeriodLedgers,
  listPostgresOperationalHealthSnapshots,
  readPostgresHealthEsgStorageHealth,
  savePostgresEsgPeriodLedger,
  savePostgresOperationalHealthSnapshot
} from "./lib/ops-postgres-health-esg-store.mjs";
import {
  createSqliteEsgObservation,
  ensureSqliteHealthEsgSchema,
  listSqliteEsgObservations,
  listSqliteEsgPeriodLedgers,
  listSqliteOperationalHealthSnapshots,
  readSqliteHealthEsgStorageHealth,
  saveSqliteEsgPeriodLedger,
  saveSqliteOperationalHealthSnapshot
} from "./lib/ops-health-esg-store.mjs";
import {
  createSqliteProofMediaIntent,
  listSqliteProofMediaObjects,
  markSqliteProofMediaStorageProvider,
  recordSqliteProofMediaScan,
  readSqliteProofMediaObject,
  readSqliteProofMediaStorageHealth,
  registerSqliteProofMediaEvidence,
  verifySqliteProofMediaEvidence
} from "./lib/ops-proof-media-store.mjs";
import {
  createPostgresProofMediaIntent,
  listPostgresProofMediaObjects,
  markPostgresProofMediaStorageProvider,
  recordPostgresProofMediaScan,
  readPostgresProofMediaObject,
  readPostgresProofMediaStorageHealth,
  registerPostgresProofMediaEvidence,
  verifyPostgresProofMediaEvidence
} from "./lib/ops-postgres-proof-media-store.mjs";
import { mediaScanPolicyVersion, mediaScanStatuses } from "./lib/ops-media-scan-policy.mjs";
import {
  createSqliteEvidenceSnapshot,
  listSqliteEvidenceSnapshots,
  readSqliteEvidenceSnapshot,
  readSqliteEvidenceStorageHealth,
  sweepSqliteEvidenceSnapshots,
  verifySqliteEvidenceSnapshot
} from "./lib/ops-evidence-snapshot-store.mjs";
import {
  createPostgresEvidenceSnapshot,
  listPostgresEvidenceSnapshots,
  readPostgresEvidenceSnapshot,
  readPostgresEvidenceStorageHealth,
  sweepPostgresEvidenceSnapshots,
  verifyPostgresEvidenceSnapshot
} from "./lib/ops-postgres-evidence-snapshot-store.mjs";
import {
  importSqliteFieldServiceCycles,
  listSqliteFieldServiceCycles,
  readSqliteFieldServiceStorageHealth
} from "./lib/ops-field-service-store.mjs";
import {
  importPostgresFieldServiceCycles,
  listPostgresFieldServiceCycles,
  readPostgresFieldServiceStorageHealth
} from "./lib/ops-postgres-field-service-store.mjs";
import { normalizeFieldCycleCsv } from "./lib/ops-field-cycle-import.mjs";
import { validateFieldCycleEvidence } from "./lib/ops-field-cycle-evidence.mjs";
import { normalizeEvidenceRetention } from "./lib/ops-evidence-integrity.mjs";
import { getS3Object, putS3Object } from "./lib/ops-object-storage.mjs";
import {
  createPilotSession,
  ensurePilotAccount,
  readPilotSession,
  revokePilotSession,
  sessionCookie,
  sessionTokenFromRequest
} from "./lib/ops-session-store.mjs";
import {
  authContextFromSession,
  authPolicySummary,
  canAccessClient,
  filterByClientScope,
  hasPermission,
  requireActionAccess,
  requireClientAccess,
  requireEventWriteAccess,
  requirePermission,
  requireSnapshotWriteAccess,
  resolveAuthContext
} from "./lib/ops-auth.mjs";
import {
  assertBrowserOrigin,
  constantTimeEqual,
  enforceRateLimit,
  productionConfigReport
} from "./lib/ops-production-config.mjs";
import { oidcHealth, resolveOidcAuthContext } from "./lib/ops-oidc.mjs";
import { observabilitySnapshot, recordApplicationError, recordHttpRequest, recordOperationalEvent } from "./lib/ops-observability.mjs";

const root = process.cwd();
const dataRoot = join(root, "data");
const runtimeRoot = process.env.DR_FOREST_RUNTIME_DIR || join(root, ".ops-data");
const runtimeDbPath = process.env.DR_FOREST_RUNTIME_DB_PATH || join(runtimeRoot, "ops-runtime.sqlite");
const portArgIndex = process.argv.indexOf("--port");
const cliPort = portArgIndex >= 0 ? process.argv[portArgIndex + 1] : null;
const port = Number(cliPort || process.env.PORT || 8010);
const host = process.env.HOST || "127.0.0.1";
const maxJsonBodyBytes = 64 * 1024;
const maxProofUploadBytes = 5 * 1024 * 1024;
const maxProofUploadPayloadBytes = 7 * 1024 * 1024;
const maxDeviceReadingBatchSize = Math.min(Math.max(Number(process.env.DR_FOREST_DEVICE_MAX_READING_BATCH || 100) || 100, 1), 1000);
const deviceIngestionRateLimitPerIp = Math.min(Math.max(Number(process.env.DR_FOREST_DEVICE_INGESTION_IP_LIMIT || 1200) || 1200, 1), 10000);
const deviceIngestionRateLimitPerDevice = Math.min(Math.max(Number(process.env.DR_FOREST_DEVICE_INGESTION_DEVICE_LIMIT || 300) || 300, 1), 5000);
const deviceIngestionRateLimitPerGateway = Math.min(Math.max(Number(process.env.DR_FOREST_DEVICE_INGESTION_GATEWAY_LIMIT || 1200) || 1200, 1), 10000);
const proofMediaRoot = join(runtimeRoot, "proof-media");
let draining = false;
let shutdownPromise = null;
// Pilot SQLite uses one file across bounded stores. Serialize API work until PostgreSQL is enabled.
let pilotApiQueue = Promise.resolve();
function enqueuePilotApi(task) {
  const next = pilotApiQueue.then(task, task);
  pilotApiQueue = next.catch(() => {});
  return next;
}

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png"
};

const dataFileMap = {
  clients: "clients.json",
  walls: "walls.json",
  workorders: "workorders.json",
  proof: "proof.json",
  sensors: "sensors.json",
  incidents: "incidents.json",
  productModel: "product-model.json"
};

const sqliteMasterDataKeys = new Set(["clients", "walls", "workorders", "proof", "sensors", "incidents"]);

const scopedDataFiles = {
  billing: "billing.json",
  schedule: "schedule.json",
  compliance: "compliance.json",
  aiInsights: "ai-insights.json"
};

function productionMasterDataEnabled() {
  return productionConfigReport().production;
}

async function readMasterDataDataset() {
  return productionMasterDataEnabled()
    ? readPostgresMasterDataset(runtimeDbPath, dataRoot)
    : readSqliteMasterDataset(runtimeDbPath, dataRoot);
}

async function readMasterDataHealth() {
  return productionMasterDataEnabled()
    ? readPostgresMasterDataHealth(runtimeDbPath, dataRoot)
    : readSqliteMasterDataHealth(runtimeDbPath, dataRoot);
}

async function importMasterData() {
  return productionMasterDataEnabled()
    ? importPostgresMasterData(runtimeDbPath, dataRoot)
    : importSqliteMasterData(runtimeDbPath, dataRoot);
}

async function upsertMasterDataClient(input) {
  return productionMasterDataEnabled()
    ? upsertPostgresClient(runtimeDbPath, dataRoot, input)
    : upsertSqliteClient(runtimeDbPath, dataRoot, input);
}

async function upsertMasterDataLivingAsset(input) {
  return productionMasterDataEnabled()
    ? upsertPostgresLivingAsset(runtimeDbPath, dataRoot, input)
    : upsertSqliteLivingAsset(runtimeDbPath, dataRoot, input);
}

async function upsertMasterDataWorkOrder(input) {
  return productionMasterDataEnabled()
    ? upsertPostgresWorkOrder(runtimeDbPath, dataRoot, input)
    : upsertSqliteWorkOrder(runtimeDbPath, dataRoot, input);
}

async function upsertMasterDataSensorReading(input) {
  return productionMasterDataEnabled()
    ? upsertPostgresSensorReading(runtimeDbPath, dataRoot, input)
    : upsertSqliteSensorReading(runtimeDbPath, dataRoot, input);
}

async function listModules(options = {}) {
  return productionMasterDataEnabled()
    ? listPostgresModules(runtimeDbPath, dataRoot, options)
    : listSqliteModules(runtimeDbPath, dataRoot, options);
}

async function listModulePage(options = {}) {
  return productionMasterDataEnabled()
    ? listPostgresModulePage(runtimeDbPath, dataRoot, options)
    : listSqliteModulePage(runtimeDbPath, dataRoot, options);
}

async function upsertModule(input) {
  return productionMasterDataEnabled()
    ? upsertPostgresModule(runtimeDbPath, dataRoot, input)
    : upsertSqliteModule(runtimeDbPath, dataRoot, input);
}

async function readModuleStorageHealth() {
  return productionMasterDataEnabled()
    ? readPostgresModuleStorageHealth(runtimeDbPath, dataRoot)
    : readSqliteModuleStorageHealth(runtimeDbPath, dataRoot);
}

async function listCommissioning(options = {}) {
  await listModules();
  return productionMasterDataEnabled()
    ? listPostgresCommissioning(runtimeDbPath, options)
    : listSqliteCommissioning(runtimeDbPath, options);
}

async function listCommissioningEvents(moduleId) {
  await listModules();
  return productionMasterDataEnabled()
    ? listPostgresCommissioningEvents(runtimeDbPath, moduleId)
    : listSqliteCommissioningEvents(runtimeDbPath, moduleId);
}

async function readCommissioningByCode(publicCode) {
  await listModules();
  return productionMasterDataEnabled()
    ? readPostgresCommissioningByCode(runtimeDbPath, publicCode)
    : readSqliteCommissioningByCode(runtimeDbPath, publicCode);
}

async function planCommissioning(input) {
  await listModules();
  return productionMasterDataEnabled()
    ? planPostgresCommissioning(runtimeDbPath, input)
    : planSqliteCommissioning(runtimeDbPath, input);
}

async function transitionCommissioning(moduleId, input) {
  await listModules();
  return productionMasterDataEnabled()
    ? transitionPostgresCommissioning(runtimeDbPath, moduleId, input)
    : transitionSqliteCommissioning(runtimeDbPath, moduleId, input);
}

async function readCommissioningHealth() {
  await listModules();
  return productionMasterDataEnabled()
    ? readPostgresCommissioningHealth(runtimeDbPath)
    : readSqliteCommissioningHealth(runtimeDbPath);
}

async function listDeviceLifecycle(options = {}) {
  await listDevices();
  return productionMasterDataEnabled()
    ? listPostgresDeviceLifecycle(runtimeDbPath, options)
    : listSqliteDeviceLifecycle(runtimeDbPath, options);
}

async function listDeviceLifecycleEvents(deviceId) {
  await listDevices();
  return productionMasterDataEnabled()
    ? listPostgresDeviceLifecycleEvents(runtimeDbPath, deviceId)
    : listSqliteDeviceLifecycleEvents(runtimeDbPath, deviceId);
}

async function upsertDeviceLifecycleProfile(deviceId, input) {
  await listDevices();
  return productionMasterDataEnabled()
    ? upsertPostgresDeviceLifecycleProfile(runtimeDbPath, deviceId, input)
    : upsertSqliteDeviceLifecycleProfile(runtimeDbPath, deviceId, input);
}

async function applyDeviceLifecycleAction(deviceId, input) {
  await listDevices();
  return productionMasterDataEnabled()
    ? applyPostgresDeviceLifecycleAction(runtimeDbPath, deviceId, input)
    : applySqliteDeviceLifecycleAction(runtimeDbPath, deviceId, input);
}

async function readDeviceLifecycleHealth() {
  await listDevices();
  return productionMasterDataEnabled()
    ? readPostgresDeviceLifecycleHealth(runtimeDbPath)
    : readSqliteDeviceLifecycleHealth(runtimeDbPath);
}

async function assertFieldDeviceModuleAccess(auth, moduleId, workOrderId = null) {
  if (auth.roleId !== "field-tech") return;
  const module = (await listModules()).find((item) => item.id === moduleId);
  if (!module) throw apiError(404, "device module not found", "DEVICE_LIFECYCLE_MODULE_NOT_FOUND");
  const dataset = await readMasterDataDataset();
  const workOrders = dataset.workorders.filter((item) => item.wallId === module.assetId && (!workOrderId || item.id === workOrderId));
  const assignments = await Promise.all(workOrders.map((item) => readWorkforceAssignment("work-order", item.id)));
  const allowed = assignments.some((assignment) => assignment && assignment.technicianId === auth.id && assignment.status !== "cancelled");
  if (!allowed) throw apiError(403, "device module has no matching technician work-order assignment", "DEVICE_LIFECYCLE_ASSIGNMENT_REQUIRED");
}

const commissioningDeviceTypes = ["temperature", "humidity", "co2", "mc", "camera"];

async function commissioningOverviewFor(auth, options = {}) {
  const clientIds = auth.clientScope === "all" ? null : auth.clientIds;
  const [commissioning, devices] = await Promise.all([
    listCommissioning({ ...options, clientIds }),
    listDevices({ clientIds })
  ]);
  const records = commissioning.records.map((record) => {
    const moduleDevices = devices.filter((device) => device.moduleId === record.moduleId && device.status !== "retired");
    const mappedDeviceTypes = [...new Set(moduleDevices.map((device) => device.type))];
    const missingDeviceTypes = commissioningDeviceTypes.filter((type) => !mappedDeviceTypes.includes(type));
    return { ...record, mappedDeviceTypes, missingDeviceTypes, verificationReady: record.status === "installed" && missingDeviceTypes.length === 0 };
  });
  return {
    generatedAt: new Date().toISOString(),
    records,
    summary: { ...commissioning.summary, deviceMappingGaps: records.filter((record) => record.status !== "retired" && record.missingDeviceTypes.length > 0).length }
  };
}

async function appendSensorReading(input) {
  return productionMasterDataEnabled()
    ? appendPostgresSensorReading(runtimeDbPath, input)
    : appendSqliteSensorReading(runtimeDbPath, input);
}

async function appendSensorReadings(inputs) {
  return productionMasterDataEnabled()
    ? appendPostgresSensorReadings(runtimeDbPath, inputs)
    : appendSqliteSensorReadings(runtimeDbPath, inputs);
}

async function listLatestReadingsByModules(moduleIds) {
  return productionMasterDataEnabled()
    ? listPostgresLatestReadingsByModules(runtimeDbPath, moduleIds)
    : listSqliteLatestReadingsByModules(runtimeDbPath, moduleIds);
}

async function listSensorHistory(wallId, limit, moduleId) {
  return productionMasterDataEnabled()
    ? listPostgresSensorHistory(runtimeDbPath, wallId, limit, moduleId)
    : listSqliteSensorHistory(runtimeDbPath, wallId, limit, moduleId);
}

async function calculateSensorStability(wallId) {
  return productionMasterDataEnabled()
    ? calculatePostgresSensorStability(runtimeDbPath, wallId)
    : calculateSqliteSensorStability(runtimeDbPath, wallId);
}

async function readTelemetryStorageHealth() {
  return productionMasterDataEnabled()
    ? readPostgresTelemetryStorageHealth(runtimeDbPath)
    : readSqliteTelemetryStorageHealth(runtimeDbPath);
}

async function listDevices(options = {}) {
  return productionMasterDataEnabled()
    ? listPostgresDevices(runtimeDbPath, dataRoot, options)
    : listSqliteDevices(runtimeDbPath, dataRoot, options);
}

async function registerDevice(input, options = {}) {
  return productionMasterDataEnabled()
    ? registerPostgresDevice(runtimeDbPath, dataRoot, input, options)
    : registerSqliteDevice(runtimeDbPath, dataRoot, input, options);
}

async function updateDevice(id, input) {
  return productionMasterDataEnabled()
    ? updatePostgresDevice(runtimeDbPath, dataRoot, id, input)
    : updateSqliteDevice(runtimeDbPath, dataRoot, id, input);
}

async function readDeviceByKey(deviceKey) {
  return productionMasterDataEnabled()
    ? readPostgresDeviceByKey(runtimeDbPath, deviceKey)
    : readSqliteDeviceByKey(runtimeDbPath, deviceKey);
}

async function consumeDeviceReplay(input) {
  return productionMasterDataEnabled()
    ? consumePostgresDeviceReplay(runtimeDbPath, input)
    : consumeSqliteDeviceReplay(runtimeDbPath, input);
}

async function touchDevice(deviceId, input) {
  return productionMasterDataEnabled()
    ? touchPostgresDevice(runtimeDbPath, deviceId, input)
    : touchSqliteDevice(runtimeDbPath, deviceId, input);
}

async function recordDeviceIngestion(input) {
  return productionMasterDataEnabled()
    ? recordPostgresDeviceIngestion(runtimeDbPath, input)
    : recordSqliteDeviceIngestion(runtimeDbPath, input);
}

async function recordDeviceIngestions(inputs) {
  return productionMasterDataEnabled()
    ? recordPostgresDeviceIngestions(runtimeDbPath, inputs)
    : recordSqliteDeviceIngestions(runtimeDbPath, inputs);
}

async function saveDeviceCameraCapture(input, fileBytes = null) {
  return productionMasterDataEnabled()
    ? savePostgresDeviceCameraCapture(runtimeDbPath, dataRoot, runtimeRoot, input, fileBytes)
    : saveSqliteDeviceCameraCapture(runtimeDbPath, dataRoot, runtimeRoot, input, fileBytes);
}

async function readDeviceCameraCapture(captureId) {
  return productionMasterDataEnabled()
    ? readPostgresDeviceCameraCapture(runtimeDbPath, captureId)
    : readSqliteDeviceCameraCapture(runtimeDbPath, captureId);
}

async function readDeviceCameraBytes(captureId) {
  return productionMasterDataEnabled()
    ? readPostgresDeviceCameraBytes(runtimeDbPath, captureId)
    : readSqliteDeviceCameraBytes(runtimeDbPath, captureId);
}

async function listDeviceCameraCaptures(options = {}) {
  return productionMasterDataEnabled()
    ? listPostgresDeviceCameraCaptures(runtimeDbPath, dataRoot, options)
    : listSqliteDeviceCameraCaptures(runtimeDbPath, dataRoot, options);
}

async function readDeviceStorageHealth() {
  return productionMasterDataEnabled()
    ? readPostgresDeviceStorageHealth(runtimeDbPath, dataRoot)
    : readSqliteDeviceStorageHealth(runtimeDbPath, dataRoot);
}

async function evaluateTelemetryAlerts(reading, clientId) {
  return productionMasterDataEnabled()
    ? evaluatePostgresTelemetryAlerts(runtimeDbPath, reading, clientId)
    : evaluateSqliteTelemetryAlerts(runtimeDbPath, reading, clientId);
}

async function evaluateTelemetryAlertsBatch(readings, clientId) {
  return productionMasterDataEnabled()
    ? evaluatePostgresTelemetryAlertsBatch(runtimeDbPath, readings, clientId)
    : evaluateSqliteTelemetryAlertsBatch(runtimeDbPath, readings, clientId);
}

async function listAlertRules(options = {}) {
  return productionMasterDataEnabled()
    ? listPostgresAlertRules(runtimeDbPath, options)
    : listSqliteAlertRules(runtimeDbPath, options);
}

async function registerAlertRule(input) {
  return productionMasterDataEnabled()
    ? registerPostgresAlertRule(runtimeDbPath, input)
    : registerSqliteAlertRule(runtimeDbPath, input);
}

async function listAlerts(options = {}) {
  return productionMasterDataEnabled()
    ? listPostgresAlerts(runtimeDbPath, options)
    : listSqliteAlerts(runtimeDbPath, options);
}

async function updateAlert(id, input) {
  return productionMasterDataEnabled()
    ? updatePostgresAlert(runtimeDbPath, id, input)
    : updateSqliteAlert(runtimeDbPath, id, input);
}

async function readAlertStorageHealth() {
  return productionMasterDataEnabled()
    ? readPostgresAlertStorageHealth(runtimeDbPath)
    : readSqliteAlertStorageHealth(runtimeDbPath);
}

async function createVisualDiagnosis(input) {
  return productionMasterDataEnabled()
    ? createPostgresVisualDiagnosis(runtimeDbPath, input)
    : createSqliteVisualDiagnosis(runtimeDbPath, input);
}

async function listVisualDiagnoses(options = {}) {
  return productionMasterDataEnabled()
    ? listPostgresVisualDiagnoses(runtimeDbPath, options)
    : listSqliteVisualDiagnoses(runtimeDbPath, options);
}

async function updateVisualDiagnosis(id, input) {
  return productionMasterDataEnabled()
    ? updatePostgresVisualDiagnosis(runtimeDbPath, id, input)
    : updateSqliteVisualDiagnosis(runtimeDbPath, id, input);
}

async function readAiVisionStorageHealth() {
  return productionMasterDataEnabled()
    ? readPostgresAiVisionStorageHealth(runtimeDbPath)
    : readSqliteAiVisionStorageHealth(runtimeDbPath);
}

async function listMobileCaptureBatches() {
  return productionMasterDataEnabled()
    ? listPostgresMobileCaptureBatches(runtimeDbPath)
    : listSqliteMobileCaptureBatches(runtimeDbPath);
}

async function saveMobileCaptureBatch(input) {
  return productionMasterDataEnabled()
    ? savePostgresMobileCaptureBatch(runtimeDbPath, input)
    : saveSqliteMobileCaptureBatch(runtimeDbPath, input);
}

async function readMobileCaptureStorageHealth() {
  return productionMasterDataEnabled()
    ? readPostgresMobileCaptureStorageHealth(runtimeDbPath)
    : readSqliteMobileCaptureStorageHealth(runtimeDbPath);
}

async function listReminderActions() {
  return productionMasterDataEnabled()
    ? listPostgresReminderActions(runtimeDbPath)
    : listSqliteReminderActions(runtimeDbPath);
}

async function saveReminderAction(input) {
  return productionMasterDataEnabled()
    ? savePostgresReminderAction(runtimeDbPath, input)
    : saveSqliteReminderAction(runtimeDbPath, input);
}

async function readReminderStorageHealth() {
  return productionMasterDataEnabled()
    ? readPostgresReminderStorageHealth(runtimeDbPath)
    : readSqliteReminderStorageHealth(runtimeDbPath);
}

async function createRemediationTask(input) {
  return productionMasterDataEnabled()
    ? createPostgresRemediationTask(runtimeDbPath, input)
    : createSqliteRemediationTask(runtimeDbPath, input);
}

async function listRemediationTasks(options = {}) {
  return productionMasterDataEnabled()
    ? listPostgresRemediationTasks(runtimeDbPath, options)
    : listSqliteRemediationTasks(runtimeDbPath, options);
}

async function updateRemediationTask(id, input) {
  return productionMasterDataEnabled()
    ? updatePostgresRemediationTask(runtimeDbPath, id, input)
    : updateSqliteRemediationTask(runtimeDbPath, id, input);
}

async function markRemediationEscalation(id, input) {
  return productionMasterDataEnabled()
    ? markPostgresRemediationEscalation(runtimeDbPath, id, input)
    : markSqliteRemediationEscalation(runtimeDbPath, id, input);
}

async function readRemediationDispatchSummary(options = {}) {
  return productionMasterDataEnabled()
    ? readPostgresRemediationDispatchSummary(runtimeDbPath, options)
    : readSqliteRemediationDispatchSummary(runtimeDbPath, options);
}

async function readRemediationTask(id) {
  return productionMasterDataEnabled()
    ? readPostgresRemediationTask(runtimeDbPath, id)
    : readSqliteRemediationTask(runtimeDbPath, id);
}

async function readRemediationStorageHealth() {
  return productionMasterDataEnabled()
    ? readPostgresRemediationStorageHealth(runtimeDbPath)
    : readSqliteRemediationStorageHealth(runtimeDbPath);
}

async function enqueueNotification(input) {
  return productionMasterDataEnabled()
    ? enqueuePostgresNotification(runtimeDbPath, input)
    : enqueueSqliteNotification(runtimeDbPath, input);
}

async function readNotificationStorageHealth() {
  return productionMasterDataEnabled()
    ? readPostgresNotificationStorageHealth(runtimeDbPath)
    : readSqliteNotificationStorageHealth(runtimeDbPath);
}

async function listNotifications(options = {}) {
  return productionMasterDataEnabled()
    ? listPostgresNotifications(runtimeDbPath, options)
    : listSqliteNotifications(runtimeDbPath, options);
}

async function acquireJobLease(input) { return productionMasterDataEnabled() ? acquirePostgresJobLease(runtimeDbPath, input) : acquireSqliteJobLease(runtimeDbPath, input); }
async function releaseJobLease(input) { return productionMasterDataEnabled() ? releasePostgresJobLease(runtimeDbPath, input) : releaseSqliteJobLease(runtimeDbPath, input); }
async function beginIdempotentCommand(input) { return productionMasterDataEnabled() ? beginPostgresIdempotentCommand(runtimeDbPath, input) : beginSqliteIdempotentCommand(runtimeDbPath, input); }
async function completeIdempotentCommand(input) { return productionMasterDataEnabled() ? completePostgresIdempotentCommand(runtimeDbPath, input) : completeSqliteIdempotentCommand(runtimeDbPath, input); }
async function abandonIdempotentCommand(input) { return productionMasterDataEnabled() ? abandonPostgresIdempotentCommand(runtimeDbPath, input) : abandonSqliteIdempotentCommand(runtimeDbPath, input); }
async function createMaintenanceImport(input) { return productionMasterDataEnabled() ? createPostgresMaintenanceImport(runtimeDbPath, input) : createSqliteMaintenanceImport(runtimeDbPath, input); }
async function readMaintenanceImport(id) { return productionMasterDataEnabled() ? readPostgresMaintenanceImport(runtimeDbPath, id) : readSqliteMaintenanceImport(runtimeDbPath, id); }
async function listMaintenanceImports(limit) { return productionMasterDataEnabled() ? listPostgresMaintenanceImports(runtimeDbPath, limit) : listSqliteMaintenanceImports(runtimeDbPath, limit); }
async function applyMaintenanceImport(input) { return productionMasterDataEnabled() ? applyPostgresMaintenanceImport(runtimeDbPath, input) : applySqliteMaintenanceImport(runtimeDbPath, input); }
async function readIntegrationStorageHealth() { return productionMasterDataEnabled() ? readPostgresIntegrationStorageHealth(runtimeDbPath) : readSqliteIntegrationStorageHealth(runtimeDbPath); }
async function ensureReliabilityJobs() { return productionMasterDataEnabled() ? seedPostgresReliabilityJobs(runtimeDbPath, defaultReliabilityJobs()) : seedSqliteReliabilityJobs(runtimeDbPath, defaultReliabilityJobs()); }
async function beginReliabilityRun(input) { await ensureReliabilityJobs(); return productionMasterDataEnabled() ? beginPostgresReliabilityRun(runtimeDbPath, input) : beginSqliteReliabilityRun(runtimeDbPath, input); }
async function finishReliabilityRun(id, input) { return productionMasterDataEnabled() ? finishPostgresReliabilityRun(runtimeDbPath, id, input) : finishSqliteReliabilityRun(runtimeDbPath, id, input); }
async function readReliabilityOverview(options = {}) { await ensureReliabilityJobs(); return productionMasterDataEnabled() ? readPostgresReliabilityOverview(runtimeDbPath, options) : readSqliteReliabilityOverview(runtimeDbPath, options); }
async function scanReliability(options = {}) { await ensureReliabilityJobs(); return productionMasterDataEnabled() ? scanPostgresReliability(runtimeDbPath, options) : scanSqliteReliability(runtimeDbPath, options); }
async function readReliabilityHealth() { await ensureReliabilityJobs(); return productionMasterDataEnabled() ? readPostgresReliabilityHealth(runtimeDbPath) : readSqliteReliabilityHealth(runtimeDbPath); }
async function upsertTechnician(input) { return productionMasterDataEnabled() ? upsertPostgresTechnician(runtimeDbPath, input) : upsertSqliteTechnician(runtimeDbPath, input); }
async function listTechnicians(options = {}) { return productionMasterDataEnabled() ? listPostgresTechnicians(runtimeDbPath, options) : listSqliteTechnicians(runtimeDbPath, options); }
async function upsertWorkforceAssignment(input) { return productionMasterDataEnabled() ? upsertPostgresWorkforceAssignment(runtimeDbPath, input) : upsertSqliteWorkforceAssignment(runtimeDbPath, input); }
async function readWorkforceAssignment(targetType, targetId) { return productionMasterDataEnabled() ? readPostgresWorkforceAssignment(runtimeDbPath, targetType, targetId) : readSqliteWorkforceAssignment(runtimeDbPath, targetType, targetId); }
async function listWorkforceAssignments(options = {}) { return productionMasterDataEnabled() ? listPostgresWorkforceAssignments(runtimeDbPath, options) : listSqliteWorkforceAssignments(runtimeDbPath, options); }
async function evaluateWorkforceCandidates(input) { return productionMasterDataEnabled() ? evaluatePostgresWorkforceCandidates(runtimeDbPath, input) : evaluateSqliteWorkforceCandidates(runtimeDbPath, input); }
async function readWorkforceStorageHealth() { return productionMasterDataEnabled() ? readPostgresWorkforceStorageHealth(runtimeDbPath) : readSqliteWorkforceStorageHealth(runtimeDbPath); }
async function upsertMaintenancePlan(input) { return productionMasterDataEnabled() ? upsertPostgresMaintenancePlan(runtimeDbPath, input) : upsertSqliteMaintenancePlan(runtimeDbPath, input); }
async function listMaintenancePlans(options = {}) { return productionMasterDataEnabled() ? listPostgresMaintenancePlans(runtimeDbPath, options) : listSqliteMaintenancePlans(runtimeDbPath, options); }
async function listMaintenanceOccurrences(options = {}) { return productionMasterDataEnabled() ? listPostgresMaintenanceOccurrences(runtimeDbPath, options) : listSqliteMaintenanceOccurrences(runtimeDbPath, options); }
async function generateMaintenanceOccurrences(input) { return productionMasterDataEnabled() ? generatePostgresMaintenanceOccurrences(runtimeDbPath, input) : generateSqliteMaintenanceOccurrences(runtimeDbPath, input); }
async function readMaintenancePlanningHealth() { return productionMasterDataEnabled() ? readPostgresMaintenancePlanningHealth(runtimeDbPath) : readSqliteMaintenancePlanningHealth(runtimeDbPath); }
async function readInventoryOverview(options = {}) { if (!productionMasterDataEnabled()) return readSqliteInventoryOverview(runtimeDbPath, options); const [overview,traceability]=await Promise.all([readPostgresInventoryOverview(runtimeDbPath,options),readPostgresInventoryTraceability(runtimeDbPath,options)]);return{...overview,...traceability,summary:{...overview.summary,...traceability.summary}}; }
async function applyInventoryMovement(input) { return productionMasterDataEnabled() ? applyPostgresInventoryMovement(runtimeDbPath, input) : applySqliteInventoryMovement(runtimeDbPath, input); }
async function reserveInventory(input) { return productionMasterDataEnabled() ? reservePostgresInventory(runtimeDbPath, input) : reserveSqliteInventory(runtimeDbPath, input); }
async function consumeInventory(input) { return productionMasterDataEnabled() ? consumePostgresInventory(runtimeDbPath, input) : consumeSqliteInventory(runtimeDbPath, input); }
async function receiveInventoryLot(input) { return productionMasterDataEnabled() ? receivePostgresInventoryLot(runtimeDbPath,input) : receiveSqliteInventoryLot(runtimeDbPath,input); }
async function submitInventoryStockCount(input) { return productionMasterDataEnabled() ? submitPostgresInventoryStockCount(runtimeDbPath,input) : submitSqliteInventoryStockCount(runtimeDbPath,input); }
async function reviewInventoryStockCount(countId,input) { return productionMasterDataEnabled() ? reviewPostgresInventoryStockCount(runtimeDbPath,countId,input) : reviewSqliteInventoryStockCount(runtimeDbPath,countId,input); }
async function readInventoryHealth() { return productionMasterDataEnabled() ? readPostgresInventoryHealth(runtimeDbPath) : readSqliteInventoryHealth(runtimeDbPath); }
async function createServiceContract(input){await ensurePilotServiceContracts();const result=productionMasterDataEnabled()?await createPostgresServiceContract(runtimeDbPath,input):await createSqliteServiceContract(runtimeDbPath,input);await syncServiceContractVersion(result.contract.id);return result;}
async function ensureServiceContractVersions(){await ensurePilotServiceContracts();return productionMasterDataEnabled()?ensurePostgresServiceContractVersionSchema(runtimeDbPath):ensureSqliteServiceContractVersionSchema(runtimeDbPath);}
async function syncServiceContractVersion(id){await ensureServiceContractVersions();return productionMasterDataEnabled()?syncPostgresServiceContractVersion(runtimeDbPath,id):syncSqliteServiceContractVersion(runtimeDbPath,id);}
async function listServiceContracts(options={}){await ensurePilotServiceContracts();const result=productionMasterDataEnabled()?await listPostgresServiceContracts(runtimeDbPath,options):await listSqliteServiceContracts(runtimeDbPath,options);await ensureServiceContractVersions();return result;}
async function readServiceContract(id){await ensurePilotServiceContracts();const result=productionMasterDataEnabled()?await readPostgresServiceContract(runtimeDbPath,id):await readSqliteServiceContract(runtimeDbPath,id);if(result)await ensureServiceContractVersions();return result;}
async function listServiceContractEvents(id){await ensurePilotServiceContracts();return productionMasterDataEnabled()?listPostgresServiceContractEvents(runtimeDbPath,id):listSqliteServiceContractEvents(runtimeDbPath,id);}
async function actionServiceContract(id,input){await ensurePilotServiceContracts();const result=productionMasterDataEnabled()?await actionPostgresServiceContract(runtimeDbPath,id,input):await actionSqliteServiceContract(runtimeDbPath,id,input);await syncServiceContractVersion(id);return result;}
async function evaluateServiceContract(input){await ensurePilotServiceContracts();return productionMasterDataEnabled()?evaluatePostgresServiceContract(runtimeDbPath,input):evaluateSqliteServiceContract(runtimeDbPath,input);}
async function listServiceContractVersions(id){await ensureServiceContractVersions();return productionMasterDataEnabled()?listPostgresServiceContractVersions(runtimeDbPath,id):listSqliteServiceContractVersions(runtimeDbPath,id);}
async function listServiceContractChanges(options={}){await ensureServiceContractVersions();return productionMasterDataEnabled()?listPostgresServiceContractChanges(runtimeDbPath,options):listSqliteServiceContractChanges(runtimeDbPath,options);}
async function readServiceContractChange(id){await ensureServiceContractVersions();return productionMasterDataEnabled()?readPostgresServiceContractChange(runtimeDbPath,id):readSqliteServiceContractChange(runtimeDbPath,id);}
async function requestServiceContractChange(input){await ensureServiceContractVersions();return productionMasterDataEnabled()?requestPostgresServiceContractChange(runtimeDbPath,input):requestSqliteServiceContractChange(runtimeDbPath,input);}
async function reviewServiceContractChange(id,input){await ensureServiceContractVersions();return productionMasterDataEnabled()?reviewPostgresServiceContractChange(runtimeDbPath,id,input):reviewSqliteServiceContractChange(runtimeDbPath,id,input);}
async function linkServiceContractSla(input){await ensureServiceContractVersions();return productionMasterDataEnabled()?linkPostgresServiceContractSla(runtimeDbPath,input):linkSqliteServiceContractSla(runtimeDbPath,input);}
async function readServiceContractPerformance(options={}){await ensureServiceContractVersions();return productionMasterDataEnabled()?readPostgresServiceContractPerformance(runtimeDbPath,options):readSqliteServiceContractPerformance(runtimeDbPath,options);}
async function readServiceContractHealth(){await ensurePilotServiceContracts();const base=productionMasterDataEnabled()?await readPostgresServiceContractHealth(runtimeDbPath):await readSqliteServiceContractHealth(runtimeDbPath);const versions=productionMasterDataEnabled()?await readPostgresServiceContractVersionHealth(runtimeDbPath):await readSqliteServiceContractVersionHealth(runtimeDbPath);return{...base,versioning:versions};}
async function ensureReleaseEvidenceSchema(){return productionMasterDataEnabled()?ensurePostgresReleaseEvidenceSchema(runtimeDbPath):ensureSqliteReleaseEvidenceSchema(runtimeDbPath);}
async function submitReleaseEvidence(input){await ensureReleaseEvidenceSchema();return productionMasterDataEnabled()?submitPostgresReleaseEvidence(runtimeDbPath,input):submitSqliteReleaseEvidence(runtimeDbPath,input);}
async function listReleaseEvidence(options={}){await ensureReleaseEvidenceSchema();return productionMasterDataEnabled()?listPostgresReleaseEvidence(runtimeDbPath,options):listSqliteReleaseEvidence(runtimeDbPath,options);}
async function readReleaseEvidenceSummary(){await ensureReleaseEvidenceSchema();return productionMasterDataEnabled()?readPostgresReleaseEvidenceSummary(runtimeDbPath):readSqliteReleaseEvidenceSummary(runtimeDbPath);}
async function reviewReleaseEvidence(id,input){await ensureReleaseEvidenceSchema();return productionMasterDataEnabled()?reviewPostgresReleaseEvidence(runtimeDbPath,id,input):reviewSqliteReleaseEvidence(runtimeDbPath,id,input);}
async function listReleaseEvidenceEvents(id){await ensureReleaseEvidenceSchema();return productionMasterDataEnabled()?listPostgresReleaseEvidenceEvents(runtimeDbPath,id):listSqliteReleaseEvidenceEvents(runtimeDbPath,id);}
async function readReleaseEvidenceHealth(){return productionMasterDataEnabled()?readPostgresReleaseEvidenceHealth(runtimeDbPath):readSqliteReleaseEvidenceHealth(runtimeDbPath);}
async function ensureHealthEsgSchema(){return productionMasterDataEnabled()?ensurePostgresHealthEsgSchema(runtimeDbPath):ensureSqliteHealthEsgSchema(runtimeDbPath);}
async function saveOperationalHealthSnapshot(snapshot){await ensureHealthEsgSchema();return productionMasterDataEnabled()?savePostgresOperationalHealthSnapshot(runtimeDbPath,snapshot):saveSqliteOperationalHealthSnapshot(runtimeDbPath,snapshot);}
async function listOperationalHealthSnapshots(options={}){await ensureHealthEsgSchema();return productionMasterDataEnabled()?listPostgresOperationalHealthSnapshots(runtimeDbPath,options):listSqliteOperationalHealthSnapshots(runtimeDbPath,options);}
async function createEsgObservation(input){await ensureHealthEsgSchema();return productionMasterDataEnabled()?createPostgresEsgObservation(runtimeDbPath,input):createSqliteEsgObservation(runtimeDbPath,input);}
async function listEsgObservations(options={}){await ensureHealthEsgSchema();return productionMasterDataEnabled()?listPostgresEsgObservations(runtimeDbPath,options):listSqliteEsgObservations(runtimeDbPath,options);}
async function saveEsgPeriodLedger(ledger){await ensureHealthEsgSchema();return productionMasterDataEnabled()?savePostgresEsgPeriodLedger(runtimeDbPath,ledger):saveSqliteEsgPeriodLedger(runtimeDbPath,ledger);}
async function listEsgPeriodLedgers(options={}){await ensureHealthEsgSchema();return productionMasterDataEnabled()?listPostgresEsgPeriodLedgers(runtimeDbPath,options):listSqliteEsgPeriodLedgers(runtimeDbPath,options);}
async function readHealthEsgStorageHealth(){await readMasterDataHealth();await listModules();return productionMasterDataEnabled()?readPostgresHealthEsgStorageHealth(runtimeDbPath):readSqliteHealthEsgStorageHealth(runtimeDbPath);}
async function importFieldServiceCycles(input){return productionMasterDataEnabled()?importPostgresFieldServiceCycles(runtimeDbPath,input):importSqliteFieldServiceCycles(runtimeDbPath,input);}
async function listFieldServiceCycles(options={}){return productionMasterDataEnabled()?listPostgresFieldServiceCycles(runtimeDbPath,options):listSqliteFieldServiceCycles(runtimeDbPath,options);}
async function readFieldServiceStorageHealth(){
  await readMasterDataHealth();
  await listModules();
  return productionMasterDataEnabled()?readPostgresFieldServiceStorageHealth(runtimeDbPath):readSqliteFieldServiceStorageHealth(runtimeDbPath);
}

async function createProofMediaIntent(input) {
  return productionMasterDataEnabled()
    ? createPostgresProofMediaIntent(runtimeDbPath, input)
    : createSqliteProofMediaIntent(runtimeDbPath, input);
}

async function listProofMediaObjects() {
  return productionMasterDataEnabled()
    ? listPostgresProofMediaObjects(runtimeDbPath)
    : listSqliteProofMediaObjects(runtimeDbPath);
}

async function readProofMediaObject(mediaId) {
  return productionMasterDataEnabled()
    ? readPostgresProofMediaObject(runtimeDbPath, mediaId)
    : readSqliteProofMediaObject(runtimeDbPath, mediaId);
}

async function registerProofMediaEvidence(input) {
  return productionMasterDataEnabled()
    ? registerPostgresProofMediaEvidence(runtimeDbPath, input)
    : registerSqliteProofMediaEvidence(runtimeDbPath, input);
}

async function markProofMediaStorageProvider(mediaId, provider) {
  return productionMasterDataEnabled()
    ? markPostgresProofMediaStorageProvider(runtimeDbPath, mediaId, provider)
    : markSqliteProofMediaStorageProvider(runtimeDbPath, mediaId, provider);
}

async function recordProofMediaScan(mediaId, input) {
  return productionMasterDataEnabled()
    ? recordPostgresProofMediaScan(runtimeDbPath, mediaId, input)
    : recordSqliteProofMediaScan(runtimeDbPath, mediaId, input);
}

async function verifyProofMediaEvidence(mediaId, input) {
  return productionMasterDataEnabled()
    ? verifyPostgresProofMediaEvidence(runtimeDbPath, mediaId, input)
    : verifySqliteProofMediaEvidence(runtimeDbPath, mediaId, input);
}

async function readProofMediaStorageHealth() {
  return productionMasterDataEnabled()
    ? readPostgresProofMediaStorageHealth(runtimeDbPath)
    : readSqliteProofMediaStorageHealth(runtimeDbPath);
}

async function createEvidenceSnapshotRecord(input) {
  return productionMasterDataEnabled()
    ? createPostgresEvidenceSnapshot(input)
    : createSqliteEvidenceSnapshot(runtimeDbPath, input);
}

async function readEvidenceSnapshot(snapshotId) {
  return productionMasterDataEnabled()
    ? readPostgresEvidenceSnapshot(snapshotId)
    : readSqliteEvidenceSnapshot(runtimeDbPath, snapshotId);
}

async function listEvidenceSnapshots(options = {}) {
  return productionMasterDataEnabled()
    ? listPostgresEvidenceSnapshots(options)
    : listSqliteEvidenceSnapshots(runtimeDbPath, options);
}

async function readEvidenceSnapshotStorageHealth() {
  return productionMasterDataEnabled()
    ? readPostgresEvidenceStorageHealth()
    : readSqliteEvidenceStorageHealth(runtimeDbPath);
}

async function verifyEvidenceSnapshot(snapshotId, options = {}) {
  return productionMasterDataEnabled()
    ? verifyPostgresEvidenceSnapshot(snapshotId, options)
    : verifySqliteEvidenceSnapshot(runtimeDbPath, snapshotId, options);
}

async function sweepEvidenceSnapshots() {
  return productionMasterDataEnabled()
    ? sweepPostgresEvidenceSnapshots()
    : sweepSqliteEvidenceSnapshots(runtimeDbPath);
}

function resolvePath(url) {
  const requestUrl = (url || "/").replace(/^\/+/, "/");
  const pathname = new URL(requestUrl, `http://${host}:${port}`).pathname;
  const requested = pathname === "/" ? "/index.html" : pathname;
  const normalized = normalize(join(root, requested));
  if (!normalized.startsWith(root)) return null;
  return normalized;
}

async function readJsonData(key) {
  if (sqliteMasterDataKeys.has(key)) {
    const dataset = await readMasterDataDataset();
    const data = {
      clients: dataset.clients,
      walls: dataset.walls,
      workorders: dataset.workorders,
      proof: { records: dataset.proofRecords },
      sensors: { readings: dataset.sensorReadings },
      incidents: { incidents: dataset.incidents }
    };
    return data[key];
  }

  const filename = dataFileMap[key];
  if (!filename) throw new Error(`Unknown data file: ${key}`);
  return JSON.parse(await readFile(join(dataRoot, filename), "utf8"));
}

async function readJsonFile(filename) {
  return JSON.parse(await readFile(join(dataRoot, filename), "utf8"));
}

async function readOpsEvents() {
  return productionConfigReport().production ? readPostgresOpsEvents() : readSqliteOpsEvents(runtimeDbPath);
}

async function listOpsEvents(options = {}) {
  return productionConfigReport().production ? listPostgresOpsEvents(options) : listSqliteOpsEvents(runtimeDbPath, options);
}

async function appendOpsEvent(event) {
  recordOperationalEvent(event?.type);
  const result = productionConfigReport().production ? await appendPostgresOpsEvent(event) : await appendSqliteOpsEvent(runtimeDbPath, event);
  if (event?.type === "telemetry.alert.opened") {
    await enqueueNotification({
      id: `NTF-ALERT-${event.entityId}`,
      channel: "webhook",
      eventType: event.type,
      severity: event.payload?.severity || "warning",
      clientId: event.clientId,
      wallId: event.wallId,
      alertId: event.entityId,
      payload: event
    });
  }
  if (event?.type === "mobile.capture.synced" && Number(event.payload?.exceptionCount || 0) > 0) {
    await enqueueNotification({
      id: `NTF-CAPTURE-${event.payload.batchId || event.entityId}`,
      channel: "webhook",
      eventType: "mobile.capture.exception",
      severity: "warning",
      clientId: event.clientId,
      wallId: event.wallId,
      payload: {
        ...event,
        type: "mobile.capture.exception",
        note: `${event.payload.exceptionCount} exception item(s) require FM review before client close-out.`
      }
    });
  }
  return result;
}

async function readOpsState() {
  return productionConfigReport().production ? readPostgresOpsState() : readSqliteOpsState(runtimeDbPath);
}

async function saveOpsStateSnapshot(input, event = null) {
  return productionConfigReport().production ? savePostgresOpsStateSnapshot(input, event) : saveSqliteOpsStateSnapshot(runtimeDbPath, input, event);
}

async function applyOpsStateAction(input, event = null) {
  return productionConfigReport().production ? applyPostgresOpsStateAction(input, event) : applySqliteOpsStateAction(runtimeDbPath, input, event);
}

async function readOpsStorageHealth() {
  return productionConfigReport().production ? readPostgresOpsStorageHealth() : readSqliteOpsStorageHealth(runtimeDbPath);
}

async function buildEntityClientResolver() {
  const [walls, workorders, proofData, sensorData, incidentData, billingData, scheduleData, complianceData, aiData] = await Promise.all([
    readJsonData("walls"),
    readJsonData("workorders"),
    readJsonData("proof"),
    readJsonData("sensors"),
    readJsonData("incidents"),
    readJsonFile(scopedDataFiles.billing),
    readJsonFile(scopedDataFiles.schedule),
    readJsonFile(scopedDataFiles.compliance),
    readJsonFile(scopedDataFiles.aiInsights)
  ]);

  const wallClientById = new Map(walls.map((wall) => [wall.id, wall.clientId]));
  const workorderClientById = new Map(workorders.map((order) => [order.id, wallClientById.get(order.wallId) || null]));
  const proofClientById = new Map((proofData.records || []).map((record) => [record.id, wallClientById.get(record.wallId) || null]));
  const sensorClientById = new Map((sensorData.readings || []).map((reading) => [reading.id, wallClientById.get(reading.wallId) || null]));
  const incidentClientById = new Map((incidentData.incidents || []).map((incident) => [incident.id, wallClientById.get(incident.wallId) || null]));
  const invoiceClientById = new Map((billingData.invoices || []).map((invoice) => [invoice.id, invoice.clientId || null]));
  const scheduleClientById = new Map((scheduleData.slots || []).map((slot) => [slot.id, workorderClientById.get(slot.workorderId) || null]));
  const complianceClientById = new Map((complianceData.items || []).map((item) => [item.id, item.clientId || null]));
  const aiClientById = new Map((aiData.recommendations || []).map((item) => [item.id, item.clientId || null]));

  return (entityType, entityId) => {
    if (entityType === "client") return entityId;
    if (entityType === "wall" || entityType === "asset") return wallClientById.get(entityId) || null;
    if (entityType === "workorder") return workorderClientById.get(entityId) || null;
    if (entityType === "proof") return proofClientById.get(entityId) || null;
    if (entityType === "sensor") return sensorClientById.get(entityId) || null;
    if (entityType === "invoice") return invoiceClientById.get(entityId) || null;
    if (entityType === "schedule") return scheduleClientById.get(entityId) || null;
    if (entityType === "incident") return incidentClientById.get(entityId) || null;
    if (entityType === "compliance") return complianceClientById.get(entityId) || null;
    if (entityType === "ai-recommendation") return aiClientById.get(entityId) || null;
    return null;
  };
}

function filterOpsEventsForAuth(events, auth, resolveEntityClientId) {
  return filterByClientScope(auth, events, (event) => event.clientId || resolveEntityClientId(event.entityType, event.entityId));
}

async function buildOpsTimeline(auth, options = {}) {
  const resolveEntityClientId = await buildEntityClientResolver();
  const requestedLimit = Number(options.limit);
  const limit = Math.min(Math.max(Number.isFinite(requestedLimit) && requestedLimit > 0 ? Math.floor(requestedLimit) : 24, 1), 100);
  const types = new Set((Array.isArray(options.types) ? options.types : []).map((item) => String(item || "").trim()).filter(Boolean));
  const entityType = String(options.entityType || "").trim();
  const clientId = String(options.clientId || "").trim();
  const before = String(options.before || "").trim();
  const beforeId = String(options.beforeId || "").trim();
  const beforeMs = before ? Date.parse(before) : NaN;
  const candidateLimit = Math.min(Math.max(limit * 10, 100), 500);
  const candidateEvents = await listOpsEvents({
    limit: candidateLimit,
    types: [...types],
    entityType,
    before,
    beforeId,
    clientIds: clientId ? [clientId] : auth.clientScope === "all" ? null : auth.clientIds
  });
  const visible = filterOpsEventsForAuth(candidateEvents, auth, resolveEntityClientId)
    .filter((event) => !types.size || types.has(event.type))
    .filter((event) => !entityType || event.entityType === entityType)
    .filter((event) => !clientId || (event.clientId || resolveEntityClientId(event.entityType, event.entityId)) === clientId)
    .filter((event) => !Number.isFinite(beforeMs) || Date.parse(event.timestamp) < beforeMs || (Date.parse(event.timestamp) === beforeMs && (!beforeId || event.id < beforeId)))
    .sort((left, right) => {
      const timeDelta = Date.parse(right.timestamp) - Date.parse(left.timestamp);
      return timeDelta || String(right.id).localeCompare(String(left.id));
    });
  const counts = {};
  for (const event of visible) counts[event.type] = (counts[event.type] || 0) + 1;
  const events = visible.slice(0, limit);
  const last = events.at(-1) || null;
  return {
    scope: auth.clientScope === "all" ? "all" : "client-scoped",
    filters: { limit, types: [...types], entityType: entityType || null, clientId: clientId || null, before: before || null, beforeId: beforeId || null },
    total: visible.length,
    counts,
    hasMore: visible.length > limit || candidateEvents.length >= candidateLimit,
    nextCursor: last ? { before: last.timestamp, beforeId: last.id } : null,
    events
  };
}

function qualityGateStatus(current, total) {
  if (!total) return "no-data";
  if (current >= total) return "ready";
  return current > 0 ? "partial" : "blocked";
}

function qualityThresholds() {
  const numberFromEnv = (name, fallback, minimum, maximum) => {
    const value = Number(process.env[name]);
    return Number.isFinite(value) && value >= minimum && value <= maximum ? value : fallback;
  };
  return {
    telemetryStaleMinutes: numberFromEnv("DR_FOREST_TELEMETRY_STALE_MINUTES", 180, 5, 10080),
    cameraStaleMinutes: numberFromEnv("DR_FOREST_CAMERA_STALE_MINUTES", 1440, 15, 43200),
    exceptionSlaHours: numberFromEnv("DR_FOREST_EXCEPTION_SLA_HOURS", 24, 1, 720)
  };
}

function ageMinutes(value, nowMs = Date.now()) {
  const timestamp = Date.parse(value || "");
  if (!Number.isFinite(timestamp)) return null;
  return Math.max(0, (nowMs - timestamp) / 60000);
}

function remediationSlaThresholds() {
  const configured = String(process.env.DR_FOREST_REMEDIATION_ESCALATION_HOURS || "0,4,24").split(",").map(Number);
  const values = configured.length === 3 && configured.every((value, index) => Number.isFinite(value) && value >= 0 && (index === 0 || value > configured[index - 1])) ? configured : [0, 4, 24];
  return { level1Hours: values[0], level2Hours: values[1], level3Hours: values[2] };
}

function remediationSla(task, nowMs = Date.now()) {
  const dueMs = Date.parse(task?.dueAt || "");
  if (!Number.isFinite(dueMs)) return { state: "unscheduled", level: 0, overdueHours: 0, dueInHours: null };
  const deltaHours = (nowMs - dueMs) / 3_600_000;
  if (deltaHours < 0) return { state: deltaHours >= -2 ? "due_soon" : "scheduled", level: 0, overdueHours: 0, dueInHours: Math.max(0, -deltaHours) };
  const thresholds = remediationSlaThresholds();
  const level = deltaHours >= thresholds.level3Hours ? 3 : deltaHours >= thresholds.level2Hours ? 2 : 1;
  return { state: `overdue_l${level}`, level, overdueHours: deltaHours, dueInHours: 0 };
}

function encodeRemediationCursor(task) {
  return Buffer.from(JSON.stringify({ before: task.updatedAt, beforeId: task.id }), "utf8").toString("base64url");
}

function decodeRemediationCursor(value) {
  if (!value) return { before: null, beforeId: null };
  try {
    const parsed = JSON.parse(Buffer.from(String(value), "base64url").toString("utf8"));
    if (!parsed.before || !parsed.beforeId || !Number.isFinite(Date.parse(parsed.before))) throw new Error("invalid cursor");
    return { before: String(parsed.before), beforeId: String(parsed.beforeId) };
  } catch { throw validationError("cursor is invalid", "REMEDIATION_CURSOR_INVALID"); }
}

async function buildOperationsQuality(auth) {
  const clientIds = auth.clientScope === "all" ? null : auth.clientIds;
  const thresholds = qualityThresholds();
  const [modules, devices, alerts, diagnoses, captures, remediationTasks, activeWorkOrderByWall, portfolio, proofStorage, evidenceStorage] = await Promise.all([
    listModules({ clientIds }),
    listDevices({ clientIds }),
    listAlerts({ clientIds, statuses: ["open", "acknowledged"], limit: 500 }),
    listVisualDiagnoses({ clientIds, statuses: ["queued", "running"], limit: 500 }),
    listMobileCaptureBatches(),
    listRemediationTasks({ clientIds, statuses: ["open", "assigned", "in_progress"], limit: 500 }),
    buildActiveWorkOrderContext(auth),
    buildPortfolioSummary(auth),
    readProofMediaStorageHealth(),
    readEvidenceSnapshotStorageHealth()
  ]);
  const scopedCaptures = filterByClientScope(auth, captures, (batch) => batch.clientId);
  const latestReadings = await listLatestReadingsByModules(modules.map((module) => module.id));
  const readingsByModule = new Map();
  for (const reading of latestReadings) {
    const metric = String(reading.metric || reading.type || "").trim().toLowerCase();
    const moduleReadings = readingsByModule.get(reading.moduleId) || new Map();
    if (metric) moduleReadings.set(metric, reading);
    readingsByModule.set(reading.moduleId, moduleReadings);
  }
  const requiredMetrics = ["temperature", "humidity", "co2", "mc"];
  const nowMs = Date.now();
  const telemetryAny = modules.filter((module) => (readingsByModule.get(module.id)?.size || 0) > 0).length;
  const telemetryComplete = modules.filter((module) => requiredMetrics.every((metric) => readingsByModule.get(module.id)?.has(metric))).length;
  const telemetryIncomplete = modules.filter((module) => !requiredMetrics.every((metric) => readingsByModule.get(module.id)?.has(metric))).length;
  const telemetryFresh = modules.filter((module) => requiredMetrics.every((metric) => ageMinutes(readingsByModule.get(module.id)?.get(metric)?.observedAt, nowMs) !== null && ageMinutes(readingsByModule.get(module.id)?.get(metric)?.observedAt, nowMs) <= thresholds.telemetryStaleMinutes)).length;
  const telemetryStale = modules.filter((module) => {
    const readings = readingsByModule.get(module.id);
    if (!requiredMetrics.every((metric) => readings?.has(metric))) return false;
    return requiredMetrics.some((metric) => {
      const age = ageMinutes(readings.get(metric)?.observedAt, nowMs);
      return age === null || age > thresholds.telemetryStaleMinutes;
    });
  }).length;
  const cameraDevicesByModule = new Map(devices.filter((device) => device.type === "camera").map((device) => [device.moduleId, device]));
  const connectedStates = new Set(["connected", "online", "verified", "active"]);
  const cameraFresh = modules.filter((module) => {
    const device = cameraDevicesByModule.get(module.id);
    const age = ageMinutes(device?.lastSeenAt, nowMs);
    return connectedStates.has(String(device?.status || "").toLowerCase()) && age !== null && age <= thresholds.cameraStaleMinutes;
  }).length;
  const cameraStale = modules.filter((module) => {
    const device = cameraDevicesByModule.get(module.id);
    const age = ageMinutes(device?.lastSeenAt, nowMs);
    return !device || !connectedStates.has(String(device.status || "").toLowerCase()) || age === null || age > thresholds.cameraStaleMinutes;
  }).length;
  const remediationByModuleKey = new Map(remediationTasks.map((task) => [`${task.moduleId}:${task.sourceKey}`, task]));
  const moduleReadinessDetails = modules.map((module) => {
    const readings = readingsByModule.get(module.id) || new Map();
    const missingMetrics = requiredMetrics.filter((metric) => !readings.has(metric));
    const staleMetrics = missingMetrics.length ? [] : requiredMetrics.filter((metric) => {
      const age = ageMinutes(readings.get(metric)?.observedAt, nowMs);
      return age === null || age > thresholds.telemetryStaleMinutes;
    });
    const cameraDevice = cameraDevicesByModule.get(module.id);
    const cameraStatus = String(cameraDevice?.status || "").toLowerCase();
    const cameraAge = ageMinutes(cameraDevice?.lastSeenAt, nowMs);
    const cameraReady = Boolean(cameraDevice && connectedStates.has(cameraStatus) && cameraAge !== null && cameraAge <= thresholds.cameraStaleMinutes);
    const reasons = [];
    if (missingMetrics.length) reasons.push(`Telemetry incomplete: ${missingMetrics.join(", ")}`);
    if (staleMetrics.length) reasons.push(`Telemetry stale: ${staleMetrics.join(", ")}`);
    if (!cameraDevice) reasons.push("Camera not registered");
    else if (!connectedStates.has(cameraStatus)) reasons.push(`Camera status: ${cameraStatus || "unknown"}`);
    else if (cameraAge === null) reasons.push("Camera has no heartbeat");
    else if (cameraAge > thresholds.cameraStaleMinutes) reasons.push(`Camera heartbeat ${Math.round(cameraAge)} min old`);
    const latestTelemetryAt = [...readings.values()].map((reading) => reading.observedAt).filter((value) => Number.isFinite(Date.parse(value || ""))).sort().at(-1) || null;
    const status = missingMetrics.length ? "telemetry-incomplete" : staleMetrics.length ? "telemetry-stale" : cameraReady ? "ready" : cameraDevice && cameraAge !== null && cameraAge > thresholds.cameraStaleMinutes ? "camera-stale" : "camera-missing";
    const remediationTask = remediationByModuleKey.get(`${module.id}:${status}`) || null;
    return {
      moduleId: module.id,
      label: module.label,
      clientId: module.clientId,
      assetId: module.assetId,
      workOrderId: activeWorkOrderByWall.get(module.assetId) || null,
      status,
      reasons,
      lastTelemetryAt: latestTelemetryAt,
      cameraLastSeenAt: cameraDevice?.lastSeenAt || null,
      cameraStatus: cameraStatus || null,
      remediationTask: remediationTask ? { id: remediationTask.id, status: remediationTask.status, priority: remediationTask.priority, assignedTo: remediationTask.assignedTo, dueAt: remediationTask.dueAt, workOrderId: remediationTask.workOrderId || null, acceptedAt: remediationTask.acceptedAt, acceptedBy: remediationTask.acceptedBy, reviewStatus: remediationTask.reviewStatus, submittedAt: remediationTask.submittedAt, submittedBy: remediationTask.submittedBy, reviewedAt: remediationTask.reviewedAt, reviewedBy: remediationTask.reviewedBy, reviewNote: remediationTask.reviewNote, resolutionNote: remediationTask.resolutionNote, evidenceRef: remediationTask.evidenceRef } : null
    };
  });
  const moduleReadiness = moduleReadinessDetails.filter((item) => item.status !== "ready").sort((left, right) => {
    const statusOrder = { "telemetry-incomplete": 1, "telemetry-stale": 2, "camera-missing": 3, "camera-stale": 4 };
    return (statusOrder[left.status] || 9) - (statusOrder[right.status] || 9) || left.moduleId.localeCompare(right.moduleId);
  });
  const moduleReady = moduleReadinessDetails.filter((item) => item.status === "ready").length;
  const activeExceptions = alerts.length + diagnoses.length + Number(portfolio.counts.openIncidents || 0);
  const exceptionSlaMinutes = thresholds.exceptionSlaHours * 60;
  const overdueExceptions = [...alerts.map((item) => item.lastSeenAt || item.observedAt), ...diagnoses.map((item) => item.updatedAt || item.createdAt)].filter((value) => {
    const age = ageMinutes(value, nowMs);
    return age !== null && age > exceptionSlaMinutes;
  }).length;
  const evidenceItems = Number(scopedCaptures.length > 0) + Number(Number(proofStorage.counts?.verified || 0) > 0) + Number(Number(evidenceStorage.counts?.snapshots || 0) > 0);
  const gates = [
    { id: "telemetry", label: "Sensor telemetry", status: qualityGateStatus(telemetryFresh, modules.length), current: telemetryFresh, total: modules.length, detail: `${telemetryAny}/${modules.length} modules have any latest reading; ${telemetryFresh}/${modules.length} have all four metrics within ${thresholds.telemetryStaleMinutes} min; ${telemetryIncomplete} are incomplete and ${telemetryStale} are stale.` },
    { id: "camera", label: "Camera connectivity", status: qualityGateStatus(cameraFresh, modules.length), current: cameraFresh, total: modules.length, detail: `${cameraFresh}/${modules.length} modules report an active camera seen within ${thresholds.cameraStaleMinutes} min; ${cameraStale} are stale or missing.` },
    { id: "evidence", label: "Service evidence chain", status: evidenceItems >= 3 ? "ready" : evidenceItems > 0 ? "partial" : "blocked", current: evidenceItems, total: 3, detail: `${scopedCaptures.length} field batches · ${Number(proofStorage.counts?.verified || 0)} verified media · ${Number(evidenceStorage.counts?.snapshots || 0)} persisted snapshots.` },
    { id: "exceptions", label: "Exception closure", status: overdueExceptions > 0 ? "overdue" : activeExceptions > 0 ? "attention" : "clear", current: activeExceptions, total: null, detail: `${alerts.length} sensor alerts · ${diagnoses.length} AI reviews pending · ${Number(portfolio.counts.openIncidents || 0)} open incidents · ${overdueExceptions} past the ${thresholds.exceptionSlaHours}h review SLA.` }
  ];
  return {
    generatedAt: new Date().toISOString(),
    scope: auth.clientScope === "all" ? "all" : "client-scoped",
    thresholds,
    summary: {
      modules: modules.length,
      telemetryAny,
      telemetryComplete,
      telemetryIncomplete,
      telemetryFresh,
      telemetryStale,
      cameraFresh,
      cameraStale,
      moduleReady,
      moduleUnready: moduleReadinessDetails.length - moduleReady,
      moduleReadinessReturned: Math.min(moduleReadiness.length, 20),
      openRemediationTasks: remediationTasks.length,
      unassignedRemediationTasks: remediationTasks.filter((task) => !task.assignedTo).length,
      fieldEvidenceBatches: scopedCaptures.length,
      openSensorAlerts: alerts.length,
      queuedAiDiagnoses: diagnoses.length,
      openIncidents: Number(portfolio.counts.openIncidents || 0),
      activeExceptions,
      overdueExceptions,
      verifiedMedia: Number(proofStorage.counts?.verified || 0),
      persistedSnapshots: Number(evidenceStorage.counts?.snapshots || 0)
    },
    gates,
    moduleReadiness: moduleReadiness.slice(0, 20),
    warnings: gates.filter((gate) => ["blocked", "partial", "attention", "overdue"].includes(gate.status)).map((gate) => `${gate.label}: ${gate.detail}`)
  };
}

async function buildPilotReconciliationFor(auth) {
  const clientIds = auth.clientScope === "all" ? null : auth.clientIds;
  const [quality, fieldCycles, captures, esgLedger, evidenceSnapshots] = await Promise.all([
    buildOperationsQuality(auth),
    listFieldServiceCycles({ clientIds, limit: 1000 }),
    listMobileCaptureBatches(),
    buildEsgLedgerFor(auth, {}),
    listEvidenceSnapshots({ limit: 100 })
  ]);
  return buildPilotReconciliation({
    quality,
    fieldCycles,
    captures: filterByClientScope(auth, captures, (batch) => batch.clientId),
    esgLedger,
    evidenceSnapshots: evidenceSnapshots.filter((snapshot) => canAccessEvidenceSnapshot(auth, snapshot)),
    scope: auth.clientScope === "all" ? "all" : "client-scoped"
  });
}

function filterStateMap(auth, map, entityType, resolveEntityClientId) {
  return Object.fromEntries(
    Object.entries(map || {}).filter(([id]) => canAccessClient(auth, resolveEntityClientId(entityType, id)))
  );
}

async function filterOpsStateForAuth(snapshot, auth) {
  if (auth.clientScope === "all") return snapshot;
  const resolveEntityClientId = await buildEntityClientResolver();
  const state = snapshot.state || {};

  return {
    ...snapshot,
    state: {
      ...state,
      workorderCompletions: filterStateMap(auth, state.workorderCompletions, "workorder", resolveEntityClientId),
      dispatchStaging: filterStateMap(auth, state.dispatchStaging, "workorder", resolveEntityClientId),
      proofApprovals: filterStateMap(auth, state.proofApprovals, "proof", resolveEntityClientId),
      sensorAcknowledgements: filterStateMap(auth, state.sensorAcknowledgements, "sensor", resolveEntityClientId),
      supplyRequests: {},
      invoicePayments: filterStateMap(auth, state.invoicePayments, "invoice", resolveEntityClientId),
      scheduleConfirmations: filterStateMap(auth, state.scheduleConfirmations, "schedule", resolveEntityClientId),
      incidentResolutions: filterStateMap(auth, state.incidentResolutions, "incident", resolveEntityClientId),
      complianceClearances: filterStateMap(auth, state.complianceClearances, "compliance", resolveEntityClientId),
      quickOpsTasks: (state.quickOpsTasks || []).filter((task) => canAccessClient(auth, task.clientId)),
      auditEvents: (state.auditEvents || []).filter((event) => canAccessClient(auth, event.clientId || resolveEntityClientId(event.entityType, event.entityId))),
      aiQueuedActions: filterStateMap(auth, state.aiQueuedActions, "ai-recommendation", resolveEntityClientId)
    }
  };
}

function sendJson(res, status, payload, headers = {}) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer",
    "Permissions-Policy": "camera=(self), microphone=(), geolocation=()",
    ...headers
  });
  res.end(JSON.stringify(payload, null, 2));
}

function sendText(res, status, message) {
  res.writeHead(status, {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer"
  });
  res.end(message);
}

function sendCsv(res, filename, csv) {
  res.writeHead(200, {
    "Content-Type": "text/csv; charset=utf-8",
    "Content-Disposition": `attachment; filename="${String(filename).replace(/[^A-Za-z0-9._-]/g, "-")}"`,
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY"
  });
  res.end(csv);
}

async function readJsonBody(req, maxBytes = maxJsonBodyBytes) {
  const contentType = String(req.headers["content-type"] || "").split(";", 1)[0].trim().toLowerCase();
  if (contentType !== "application/json") {
    const error = new Error("JSON request body must use Content-Type: application/json");
    error.status = 415;
    error.code = "JSON_CONTENT_TYPE_REQUIRED";
    throw error;
  }
  const declaredLength = Number(req.headers["content-length"] || 0);
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    const error = new Error("Request body too large");
    error.status = 413;
    error.code = "REQUEST_BODY_TOO_LARGE";
    throw error;
  }
  let size = 0;
  const chunks = [];

  for await (const chunk of req) {
    size += chunk.length;
    if (size > maxBytes) {
      const error = new Error("Request body too large");
      error.status = 413;
      error.code = "REQUEST_BODY_TOO_LARGE";
      throw error;
    }
    chunks.push(chunk);
  }

  req.rawBody = Buffer.concat(chunks);
  if (!chunks.length) return {};
  return JSON.parse(req.rawBody.toString("utf8"));
}

function activeWorkorders(workorders) {
  return workorders.filter((item) => String(item.status || "").toLowerCase() !== "completed");
}

function remediationWorkOrderFor(workorders) {
  const priorityRank = { critical: 0, high: 1, medium: 2, low: 3 };
  return activeWorkorders(workorders).sort((left, right) => {
    const leftPreventive = Boolean(left.sourcePlanId || left.externalSource === "maintenance-plan");
    const rightPreventive = Boolean(right.sourcePlanId || right.externalSource === "maintenance-plan");
    if (leftPreventive !== rightPreventive) return leftPreventive ? 1 : -1;
    const priorityDifference = (priorityRank[String(left.priority || "medium").toLowerCase()] ?? 2) - (priorityRank[String(right.priority || "medium").toLowerCase()] ?? 2);
    if (priorityDifference) return priorityDifference;
    return String(left.due || "").localeCompare(String(right.due || ""));
  })[0] || null;
}

function hongKongDate(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  const safeDate = Number.isNaN(date.getTime()) ? new Date() : date;
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Hong_Kong", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(safeDate);
  const part = (type) => parts.find((item) => item.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function serviceDateFor(value) {
  const text = String(value || "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  if (text && Number.isFinite(Date.parse(text))) return hongKongDate(text);
  if (/^tomorrow/i.test(text)) return hongKongDate(new Date(Date.now() + 86400000));
  return hongKongDate();
}

async function ensurePilotMaintenancePlans() {
  const [walls, clients] = await Promise.all([readJsonData("walls"), readJsonData("clients")]);
  if (productionConfigReport().production) return;
  const existing = await listMaintenancePlans({ limit: 1 });
  if (existing.length) return;
  const today = hongKongDate();
  const clientIds = new Set(clients.map((client) => client.id));
  for (const wall of walls) {
    if (!clientIds.has(wall.clientId)) continue;
    await upsertMaintenancePlan({
      clientId: wall.clientId,
      wallId: wall.id,
      serviceType: "Preventive plant care",
      cadenceDays: cadenceDaysFromLabel(wall.cadence),
      nextDueDate: legacyNextDue(wall.nextVisit, today),
      durationMinutes: wall.modules >= 4 ? 120 : wall.modules >= 3 ? 90 : 60,
      tasks: ["Plant health check", "Water and nutrient check", "Trim and clean", "Fixed-angle proof photo"],
      requiredSkills: ["plant-care", "visual-diagnosis"],
      source: "pilot-seed",
      createdBy: "system:pilot-seed",
      updatedBy: "system:pilot-seed"
    });
  }
}

async function ensurePilotInventory() {
  if (!productionConfigReport().production) await seedSqliteInventory(runtimeDbPath, dataRoot);
}

async function ensurePilotServiceContracts() {
  if (productionConfigReport().production) return;
  const [clients,walls]=await Promise.all([readJsonData("clients"),readJsonData("walls")]);
  await seedSqliteServiceContracts(runtimeDbPath,{clients,walls});
}

function serviceContractForAuth(auth,contract){if(auth.roleId!=="esg-auditor")return contract;const{monthlyFee,currency,...auditorContract}=contract;return auditorContract;}
function serviceContractChangeForAuth(auth,change){if(auth.roleId!=="esg-auditor")return change;const requestedTerms={...(change.requestedTerms||{})};delete requestedTerms.monthlyFee;delete requestedTerms.currency;return{...change,requestedTerms};}
function serviceContractVersionForAuth(auth,version){if(auth.roleId!=="esg-auditor")return version;const terms={...(version.terms||{})};delete terms.monthlyFee;delete terms.currency;return{...version,terms};}
async function serviceContractOverviewFor(auth){
  const clientIds=auth.clientScope==="all"?null:auth.clientIds;
  if (!productionMasterDataEnabled()) await ensureServiceContractVersions();
  const [contracts,clients,walls,changeRequests,performance]=await Promise.all([listServiceContracts({clientIds,limit:1000}),readJsonData("clients"),readJsonData("walls"),listServiceContractChanges({clientIds,statuses:["pending"],limit:1000}),readServiceContractPerformance({clientIds})]);
  const scopedClients=clients.filter((item)=>canAccessClient(auth,item.id)); const scopedWalls=walls.filter((item)=>canAccessClient(auth,item.clientId));
  const covered=new Set(contracts.filter((item)=>item.effectiveState==="active").flatMap((item)=>item.wallIds));
  return{generatedAt:new Date().toISOString(),contracts:contracts.map((item)=>serviceContractForAuth(auth,item)),changeRequests:changeRequests.map((item)=>serviceContractChangeForAuth(auth,item)),performance,clients:scopedClients.map((item)=>({id:item.id,name:item.name,district:item.district})),walls:scopedWalls.map((item)=>({id:item.id,clientId:item.clientId,name:item.name,location:item.location})),summary:{total:contracts.length,active:contracts.filter((item)=>item.effectiveState==="active").length,draft:contracts.filter((item)=>item.status==="draft").length,suspended:contracts.filter((item)=>item.status==="suspended").length,expired:contracts.filter((item)=>item.effectiveState==="expired").length,expiringSoon:contracts.filter((item)=>item.effectiveState==="active"&&item.daysToEnd<=60).length,uncoveredWalls:scopedWalls.filter((item)=>!covered.has(item.id)).length}};
}

async function inventoryOverviewFor(auth) {
  await ensurePilotInventory();
  const assignments = await listWorkforceAssignments({ technicianId: auth.roleId === "field-tech" ? auth.id : null, targetType: "work-order", statuses: ["planned", "accepted", "in_progress"], clientIds: auth.clientScope === "all" ? null : auth.clientIds, limit: 1000 });
  const overview = await readInventoryOverview(auth.roleId === "field-tech" ? { technicianId: auth.id, workOrderIds: assignments.map((item) => item.targetId) } : {});
  const reservedWorkOrders = new Set(overview.reservations.filter((item) => item.status === "active").map((item) => item.workOrderId));
  return { ...overview, routeReadiness: { assignedWorkOrders: assignments.length, unreservedWorkOrders: assignments.filter((item) => !reservedWorkOrders.has(item.targetId)).length, assignments: assignments.map((item) => ({ workOrderId: item.targetId, technicianId: item.technicianId, serviceDate: item.serviceDate, reserved: reservedWorkOrders.has(item.targetId) })) } };
}

async function assertInventoryWorkOrderAccess(auth, workOrderId, technicianId = null) {
  const resolveEntityClientId = await buildEntityClientResolver();
  const clientId = resolveEntityClientId("workorder", workOrderId);
  if (!clientId) throw apiError(404, "inventory action references an unknown work order", "INVENTORY_WORKORDER_NOT_FOUND");
  requireClientAccess(auth, clientId, "inventory work order");
  if (auth.roleId === "field-tech") {
    if (technicianId && technicianId !== auth.id) throw apiError(403, "technician inventory scope denied", "INVENTORY_TECHNICIAN_SCOPE_DENIED");
    const assignment = await readWorkforceAssignment("work-order", workOrderId);
    if (!assignment || assignment.technicianId !== auth.id || !["planned", "accepted", "in_progress"].includes(assignment.status)) throw apiError(403, "work order is not actively assigned to this technician", "INVENTORY_ASSIGNMENT_REQUIRED");
  }
  return clientId;
}

function mobileConsumables(batch) {
  const items = Array.isArray(batch?.consumables) ? batch.consumables : [];
  return items.map((item) => ({ sku: String(item?.sku || "").trim().toUpperCase(), quantity: Number(item?.quantity) })).filter((item) => item.sku && Number.isFinite(item.quantity) && item.quantity > 0);
}

async function runIdempotentInventoryCommand({ auth, scope, commandKey, payload, execute }) {
  if (!commandKey) throw apiError(428, "Idempotency-Key header is required for inventory mutations", "IDEMPOTENCY_KEY_REQUIRED");
  const requestHash = createHash("sha256").update(JSON.stringify(payload)).digest("hex");
  const ownerId = `${auth.id}:${randomUUID()}`;
  const command = await beginIdempotentCommand({ scope, commandKey, requestHash, ownerId, leaseSeconds: 120 });
  if (command.duplicate) return { ...command.response, duplicate: true };
  try {
    const response = await execute(requestHash);
    await completeIdempotentCommand({ scope, commandKey, ownerId, response });
    return response;
  } catch (error) {
    await abandonIdempotentCommand({ scope, commandKey, ownerId }).catch(() => {});
    throw error;
  }
}

async function buildMaintenanceCalendar(auth, { fromDate, throughDate }) {
  await ensurePilotMaintenancePlans();
  const clientIds = auth.clientScope === "all" ? null : auth.clientIds;
  const [plans, occurrences, assignments, technicians] = await Promise.all([
    listMaintenancePlans({ clientIds, limit: 1000 }),
    listMaintenanceOccurrences({ fromDate, throughDate, clientIds, limit: 1000 }),
    listWorkforceAssignments({ targetType: "work-order", clientIds, limit: 1000 }),
    listTechnicians({ status: "active" })
  ]);
  const assignmentByWorkOrder = new Map(assignments.map((item) => [item.targetId, item]));
  const items = occurrences.map((item) => ({ ...item, assignment: assignmentByWorkOrder.get(item.workOrderId) || null }));
  const activeItems = items.filter((item) => !["Completed", "Cancelled"].includes(item.workOrderStatus));
  return {
    generatedAt: new Date().toISOString(),
    fromDate,
    throughDate,
    plans,
    occurrences: items,
    technicians,
    summary: {
      plans: plans.length,
      activePlans: plans.filter((item) => item.status === "active").length,
      overduePlans: plans.filter((item) => item.status === "active" && item.nextDueDate < fromDate).length,
      dueThrough: plans.filter((item) => item.status === "active" && item.nextDueDate <= throughDate).length,
      generated: items.length,
      activeWorkOrders: activeItems.length,
      unassigned: activeItems.filter((item) => !item.assignment || ["cancelled", "completed"].includes(item.assignment.status)).length
    }
  };
}

function remediationSkills(task) {
  const text = [task.source, task.sourceKey, ...(task.reasons || [])].join(" ").toLowerCase();
  const skills = ["plant-care"];
  if (/camera|photo|visual|image|ai/.test(text)) skills.push("visual-diagnosis");
  if (/sensor|telemetry|temperature|humidity|co2|conductivity|mc\b/.test(text)) skills.push("sensor-care");
  if (/device|gateway|offline|connect/.test(text)) skills.push("device-care");
  return [...new Set(skills)];
}

function workOrderSkills(order) {
  const text = [order.type, ...(order.tasks || [])].join(" ").toLowerCase();
  const skills = ["plant-care"];
  if (/photo|capture|image|visual/.test(text)) skills.push("visual-diagnosis");
  if (/sensor|telemetry|device|led/.test(text)) skills.push("sensor-care");
  return [...new Set(skills)];
}

function remediationMinutes(task) { return task.priority === "critical" ? 120 : task.priority === "high" ? 90 : task.priority === "low" ? 45 : 60; }

async function resolveWorkforceTarget(auth, input) {
  const targetType = String(input?.targetType || "").trim();
  const targetId = String(input?.targetId || "").trim();
  if (!targetId || !["remediation-task", "work-order"].includes(targetType)) throw apiError(400, "targetType and targetId must identify a remediation-task or work-order", "WORKFORCE_TARGET_INVALID");
  const [clients, walls] = await Promise.all([readJsonData("clients"), readJsonData("walls")]);
  const clientById = new Map(clients.map((client) => [client.id, client]));
  const wallById = new Map(walls.map((wall) => [wall.id, wall]));
  if (targetType === "remediation-task") {
    const task = input.task || await readRemediationTask(targetId);
    if (!task) throw apiError(404, "remediation task not found", "REMEDIATION_TASK_NOT_FOUND");
    requireClientAccess(auth, task.clientId, "workforce assignment target");
    const wall = wallById.get(task.wallId); const client = clientById.get(task.clientId);
    return { targetType, targetId: task.id, technicianId: input.technicianId, clientId: task.clientId, wallId: task.wallId, serviceDate: input.serviceDate || serviceDateFor(input.scheduledStart || task.dueAt), scheduledStart: input.scheduledStart || null, estimatedMinutes: input.estimatedMinutes || remediationMinutes(task), requiredSkills: input.requiredSkills || remediationSkills(task), district: input.district || client?.district || wall?.location || "*", status: input.status || (task.status === "in_progress" ? "in_progress" : task.status === "resolved" ? "completed" : task.status === "cancelled" ? "cancelled" : "planned"), assignedBy: input.assignedBy || auth.id };
  }
  const workorders = await readJsonData("workorders");
  const order = workorders.find((item) => item.id === targetId);
  if (!order) throw apiError(404, "work order not found", "WORKFORCE_WORK_ORDER_NOT_FOUND");
  const wall = wallById.get(order.wallId); if (!wall) throw apiError(409, "work order wall is unavailable", "WORKFORCE_WALL_NOT_FOUND");
  requireClientAccess(auth, wall.clientId, "workforce assignment target");
  const client = clientById.get(wall.clientId);
  return { targetType, targetId: order.id, technicianId: input.technicianId, clientId: wall.clientId, wallId: wall.id, serviceDate: input.serviceDate || serviceDateFor(input.scheduledStart || order.due), scheduledStart: input.scheduledStart || null, estimatedMinutes: input.estimatedMinutes || (order.priority === "high" ? 120 : 90), requiredSkills: input.requiredSkills || workOrderSkills(order), district: input.district || client?.district || wall.location || "*", status: input.status || "planned", assignedBy: input.assignedBy || auth.id };
}

async function assertEligibleWorkforceAssignment(context) {
  const candidates = await evaluateWorkforceCandidates(context);
  const candidate = candidates.find((item) => item.technician.id === context.technicianId);
  if (!candidate) throw apiError(404, "technician is not registered", "WORKFORCE_TECHNICIAN_NOT_FOUND");
  if (!candidate.eligible) throw apiError(409, `assignment rejected: ${candidate.reasons.join("; ")}`, "WORKFORCE_ASSIGNMENT_INELIGIBLE");
  return candidate;
}

async function assertEligibleWorkforceBatch(contexts) {
  if (!contexts.length) return;
  const evaluations = await Promise.all(contexts.map((context) => assertEligibleWorkforceAssignment(context)));
  const groups = new Map();
  for (let index = 0; index < contexts.length; index += 1) {
    const context = contexts[index]; const evaluation = evaluations[index]; const key = `${context.technicianId}:${context.serviceDate}`;
    const group = groups.get(key) || { allocatedMinutes: evaluation.workload.allocatedMinutes, requestedMinutes: 0, maxDailyMinutes: evaluation.workload.maxDailyMinutes };
    group.requestedMinutes += Number(context.estimatedMinutes || 0); groups.set(key, group);
  }
  for (const group of groups.values()) if (group.allocatedMinutes + group.requestedMinutes > group.maxDailyMinutes) throw apiError(409, `assignment rejected: batch capacity exceeded by ${group.allocatedMinutes + group.requestedMinutes - group.maxDailyMinutes} minutes`, "WORKFORCE_ASSIGNMENT_INELIGIBLE");
}

async function syncRemediationWorkforceAssignment(task, auth) {
  const existing = await readWorkforceAssignment("remediation-task", task.id);
  if (!task.assignedTo) {
    if (existing && !["completed", "cancelled"].includes(existing.status)) await upsertWorkforceAssignment({ ...existing, status: "cancelled", assignedBy: auth.id });
    return null;
  }
  const context = await resolveWorkforceTarget(auth, { targetType: "remediation-task", targetId: task.id, technicianId: task.assignedTo, task });
  return upsertWorkforceAssignment(context);
}

async function buildActiveWorkOrderContext(auth) {
  const [walls, workorders] = await Promise.all([readJsonData("walls"), readJsonData("workorders")]);
  const scopedWallIds = new Set(walls.filter((wall) => canAccessClient(auth, wall.clientId)).map((wall) => wall.id));
  return new Map([...scopedWallIds].map((wallId) => [wallId, remediationWorkOrderFor(workorders.filter((order) => order.wallId === wallId))?.id || null]).filter(([, workOrderId]) => workOrderId));
}

function openIncidents(incidents) {
  return incidents.filter((item) => !["resolved", "closed"].includes(String(item.status || "").toLowerCase()));
}

async function buildPortfolioSummary(auth) {
  const [clients, walls, workorders, proofData, sensorData, incidentData, productModel, events, opsState, captureBatches] = await Promise.all([
    readJsonData("clients"),
    readJsonData("walls"),
    readJsonData("workorders"),
    readJsonData("proof"),
    readJsonData("sensors"),
    readJsonData("incidents"),
    readJsonData("productModel"),
    readOpsEvents(),
    readOpsState(),
    listMobileCaptureBatches()
  ]);

  const scopedClients = filterByClientScope(auth, clients, (client) => client.id);
  const scopedClientIds = new Set(scopedClients.map((client) => client.id));
  const scopedWalls = walls.filter((wall) => scopedClientIds.has(wall.clientId));
  const scopedWallIds = new Set(scopedWalls.map((wall) => wall.id));
  const scopedWorkorders = workorders.filter((item) => scopedWallIds.has(item.wallId));
  const proofRecords = proofData.records || [];
  const sensors = sensorData.readings || [];
  const incidents = incidentData.incidents || [];
  const scopedProofRecords = proofRecords.filter((item) => scopedWallIds.has(item.wallId));
  const scopedSensors = sensors.filter((item) => scopedWallIds.has(item.wallId));
  const scopedIncidents = incidents.filter((item) => scopedWallIds.has(item.wallId));
  const scopedCaptureBatches = filterByClientScope(auth, captureBatches, (batch) => batch.clientId);
  const reportModes = productModel.reportModes || [];
  const resolveEntityClientId = await buildEntityClientResolver();
  const scopedEvents = filterOpsEventsForAuth(events, auth, resolveEntityClientId);
  const liveHealth = await buildOperationalHealthFor(auth);

  return {
    generatedAt: new Date().toISOString(),
    scope: "demo-data-api",
    auth: {
      principalId: auth.id,
      roleId: auth.roleId,
      clientScope: auth.clientScope,
      clientIds: auth.clientIds
    },
    counts: {
      clients: scopedClients.length,
      assets: scopedWalls.length,
      modules: scopedWalls.reduce((total, wall) => total + Number(wall.modules || 0), 0),
      pods: scopedWalls.reduce((total, wall) => total + Number(wall.pods || 0), 0),
      workorders: scopedWorkorders.length,
      activeWorkorders: activeWorkorders(scopedWorkorders).length,
      proofRecords: scopedProofRecords.length,
      mobileCaptureBatches: scopedCaptureBatches.length,
      sensorReadings: scopedSensors.length,
      activeSensorAlerts: scopedSensors.filter((item) => ["alert", "watch", "offline"].includes(item.status)).length,
      incidents: scopedIncidents.length,
      openIncidents: openIncidents(scopedIncidents).length,
      reportModes: reportModes.length,
      serverSideOpsEvents: scopedEvents.length,
      serverStateRevision: opsState.revision
    },
    health: {
      averageScore: liveHealth.summary.averageScore,
      scoreStatus: liveHealth.summary.scoredAssets ? (liveHealth.summary.completeScores === liveHealth.summary.scoredAssets ? "measured" : "partial") : "no-data",
      scoreConfidence: liveHealth.summary.averageConfidence,
      riskAssets: liveHealth.assets.filter((asset) => asset.band === "critical").length,
      watchAssets: liveHealth.assets.filter((asset) => ["watch", "recovery"].includes(asset.band)).length,
      stableAssets: liveHealth.assets.filter((asset) => asset.band === "healthy").length,
      noDataAssets: liveHealth.summary.noDataAssets
    }
  };
}

async function buildAssetIndex(auth) {
  const [clients, walls, workorders, proofData, sensorData, incidentData] = await Promise.all([
    readJsonData("clients"),
    readJsonData("walls"),
    readJsonData("workorders"),
    readJsonData("proof"),
    readJsonData("sensors"),
    readJsonData("incidents")
  ]);

  const proofRecords = proofData.records || [];
  const sensors = sensorData.readings || [];
  const incidents = incidentData.incidents || [];
  const clientById = new Map(clients.map((client) => [client.id, client]));

  return walls.filter((wall) => canAccessClient(auth, wall.clientId)).map((wall) => {
    const client = clientById.get(wall.clientId);
    const wallWorkorders = workorders.filter((item) => item.wallId === wall.id);
    const wallProof = proofRecords.filter((item) => item.wallId === wall.id);
    const wallSensors = sensors.filter((item) => item.wallId === wall.id);
    const wallIncidents = incidents.filter((item) => item.wallId === wall.id);

    return {
      id: wall.id,
      name: wall.name,
      clientId: wall.clientId,
      clientName: client?.name || wall.clientId,
      district: client?.district || null,
      location: wall.location,
      version: wall.version,
      modules: wall.modules,
      pods: wall.pods,
      health: wall.health,
      status: wall.status,
      nextVisit: wall.nextVisit,
      openWorkorders: activeWorkorders(wallWorkorders).length,
      proofRecords: wallProof.length,
      sensorAlerts: wallSensors.filter((item) => ["alert", "watch", "offline"].includes(item.status)).length,
      openIncidents: openIncidents(wallIncidents).length
    };
  });
}

async function buildOperationalHealthFor(auth) {
  const clientIds = auth.clientScope === "all" ? null : auth.clientIds;
  const [dataset, modules, captures, alerts, diagnoses] = await Promise.all([
    readMasterDataDataset(),
    listModules({ clientIds }),
    listMobileCaptureBatches(),
    listAlerts({ clientIds, limit: 1000 }),
    listVisualDiagnoses({ clientIds, limit: 1000 })
  ]);
  const walls = dataset.walls.filter((wall) => canAccessClient(auth, wall.clientId));
  const scopedCaptures = filterByClientScope(auth, captures, (batch) => batch.clientId);
  const report = buildOperationalHealthReport({ walls, modules, captures: scopedCaptures, alerts, diagnoses });
  const snapshots = await listOperationalHealthSnapshots({ wallIds: report.assets.map((asset) => asset.wallId), limit: 1000 });
  const latestByWall = new Map();
  for (const snapshot of snapshots) if (!latestByWall.has(snapshot.wallId)) latestByWall.set(snapshot.wallId, snapshot);
  return {
    ...report,
    scope: auth.clientScope === "all" ? "all" : "client-scoped",
    assets: report.assets.map((asset) => ({ ...asset, persistedSnapshot: latestByWall.get(asset.wallId) || null }))
  };
}

function esgScopeKey(auth, clientId = null) {
  if (clientId) return `client:${clientId}`;
  if (auth.clientScope === "all") return "all";
  return `clients:${[...auth.clientIds].sort().join(",")}`;
}

async function buildEsgLedgerFor(auth, input = {}) {
  const requestedClientId = String(input.clientId || "").trim() || null;
  if (requestedClientId) requireClientAccess(auth, requestedClientId, "ESG ledger");
  const clientIds = auth.clientScope === "all" ? null : auth.clientIds;
  const [dataset, modules, captures, alerts, diagnoses, observations] = await Promise.all([
    readMasterDataDataset(),
    listModules({ clientIds }),
    listMobileCaptureBatches(),
    listAlerts({ clientIds, limit: 1000 }),
    listVisualDiagnoses({ clientIds, limit: 1000 }),
    listEsgObservations({ clientIds, clientId: requestedClientId, limit: 1000 })
  ]);
  const walls = dataset.walls.filter((wall) => canAccessClient(auth, wall.clientId) && (!requestedClientId || wall.clientId === requestedClientId));
  const wallIds = new Set(walls.map((wall) => wall.id));
  const scopedModules = modules.filter((module) => wallIds.has(module.assetId));
  const scopedCaptures = filterByClientScope(auth, captures, (batch) => batch.clientId).filter((batch) => wallIds.has(batch.wallId));
  const scopedAlerts = alerts.filter((alert) => wallIds.has(alert.wallId));
  const scopedDiagnoses = diagnoses.filter((diagnosis) => wallIds.has(diagnosis.wallId));
  const healthReport = buildOperationalHealthReport({ walls, modules: scopedModules, captures: scopedCaptures, alerts: scopedAlerts, diagnoses: scopedDiagnoses });
  let period;
  try { period = normalizeEsgPeriod({ periodStart: input.periodStart, periodEnd: input.periodEnd }); }
  catch (caught) { throw validationError(caught.message, "ESG_PERIOD_INVALID"); }
  const ledger = buildEsgLedger({ scopeKey: esgScopeKey(auth, requestedClientId), clientId: requestedClientId, periodStart: period.periodStart, periodEnd: period.periodEnd, walls, modules: scopedModules, captures: scopedCaptures, alerts: scopedAlerts, diagnoses: scopedDiagnoses, observations, healthReport });
  return { ...ledger, persisted: await listEsgPeriodLedgers({ scopeKey: ledger.scopeKey, limit: 5 }) };
}

async function buildEvidenceSnapshot(auth) {
  const clientIds = auth.clientScope === "all" ? null : auth.clientIds;
  const [portfolio, assets, proofObjects, alerts, diagnoses, quality, captureBatches] = await Promise.all([
    buildPortfolioSummary(auth),
    buildAssetIndex(auth),
    listProofMediaObjects(),
    listAlerts({ clientIds, statuses: ["open", "acknowledged"], limit: 200 }),
    listVisualDiagnoses({ clientIds, statuses: ["queued", "running"], limit: 200 }),
    hasPermission(auth, "data.quality.read") ? buildDataQualityReport(dataRoot, await readOpsEvents()) : Promise.resolve(null),
    listMobileCaptureBatches()
  ]);
  const generatedAt = new Date().toISOString();
  const payload = {
    schemaVersion: "dr-forest-evidence-package-v3",
    generatedAt,
    viewerRole: auth.roleId,
    scope: auth.clientScope === "all" ? "server-enforced-all-portfolio" : "server-enforced-client-scope",
    portfolio,
    assets,
    proofMedia: filterByClientScope(auth, proofObjects, (object) => object.clientId),
    fieldCaptures: filterByClientScope(auth, captureBatches, (batch) => batch.clientId),
    activeAlerts: alerts,
    activeVisualDiagnoses: diagnoses,
    ...(quality ? { dataQuality: quality } : {})
  };
  const canonical = JSON.stringify(payload);
  const sha256 = createHash("sha256").update(canonical, "utf8").digest("hex");
  const signingSecret = String(process.env.DR_FOREST_EVIDENCE_SIGNING_SECRET || "").trim();
  const snapshotId = `EVP-${sha256.slice(0, 16)}`;
  const retention = normalizeEvidenceRetention({ generatedAt });
  const signatureStatus = signingSecret ? "signed" : "unsigned";
  const signature = signingSecret ? createHmac("sha256", signingSecret).update(`${snapshotId}.${sha256}`, "utf8").digest("hex") : null;
  const signatureKeyId = signingSecret ? (String(process.env.DR_FOREST_EVIDENCE_SIGNING_KEY_ID || "").trim() || "dr-forest-evidence-hmac-v1") : null;
  return {
    snapshotId,
    generatedAt,
    hashAlgorithm: "sha256",
    sha256,
    signatureAlgorithm: "hmac-sha256",
    signatureStatus,
    signatureKeyId,
    signature,
    retentionClass: retention.retentionClass,
    retentionDays: retention.retentionDays,
    expiresAt: retention.expiresAt,
    package: payload
  };
}

function canAccessEvidenceSnapshot(auth, snapshot) {
  const clientIds = Array.isArray(snapshot?.clientIds) ? snapshot.clientIds : [];
  if (clientIds.includes("*")) return auth.clientScope === "all";
  return clientIds.length > 0 && clientIds.every((clientId) => canAccessClient(auth, clientId));
}

function mobileCaptureSchema() {
  return {
    version: "2026-07-15.mobile-capture-v1",
    requiredBatchFields: ["id", "technicianId", "clientId", "wallId", "workorderId", "capturedAt", "items"],
    itemTypes: ["photo", "water", "nutrient", "health-check", "exception"],
    proofChecklist: [
      "fixed-angle full wall photo",
      "zone close-up photo when health score is below target",
      "water refill volume",
      "nutrient dose volume",
      "exception note when access, pest, light or leak risk is observed"
    ],
    offlineRules: {
      idempotencyKey: "batch.id",
      acceptedSyncStatus: "synced",
      duplicateHandling: "same batch.id returns existing synced batch without adding a second event"
    }
  };
}

async function buildMobileRoute(auth) {
  const [clients, walls, workorders, proofData, sensorData, incidentData, workforceAssignments,serviceContracts] = await Promise.all([
    readJsonData("clients"),
    readJsonData("walls"),
    readJsonData("workorders"),
    readJsonData("proof"),
    readJsonData("sensors"),
    readJsonData("incidents"),
    auth.roleId === "field-tech" ? listWorkforceAssignments({ technicianId: auth.id, targetType: "work-order", statuses: ["planned", "accepted", "in_progress"] }) : Promise.resolve([]),
    listServiceContracts({clientIds:auth.clientScope==="all"?null:auth.clientIds,limit:1000})
  ]);

  const clientById = new Map(clients.map((client) => [client.id, client]));
  const scopedWalls = walls.filter((wall) => canAccessClient(auth, wall.clientId));
  const wallById = new Map(scopedWalls.map((wall) => [wall.id, wall]));
  const proofRecords = proofData.records || [];
  const sensors = sensorData.readings || [];
  const incidents = incidentData.incidents || [];
  const modules = await listModules({ clientIds: auth.clientScope === "all" ? null : auth.clientIds });
  const latestReadings = await listLatestReadingsByModules(modules.map((module) => module.id));
  const readingsByModule = new Map();
  for (const reading of latestReadings) readingsByModule.set(reading.moduleId, [...(readingsByModule.get(reading.moduleId) || []), reading]);
  const modulesByWall = new Map();
  for (const module of modules) modulesByWall.set(module.assetId, [...(modulesByWall.get(module.assetId) || []), module]);
  const assignedWorkOrderIds = new Set(workforceAssignments.map((item) => item.targetId));
  const contractsByWall=new Map();for(const contract of serviceContracts){for(const wallId of contract.wallIds){const current=contractsByWall.get(wallId);if(!current||contract.effectiveState==="active")contractsByWall.set(wallId,contract);}}

  return activeWorkorders(workorders)
    .filter((order) => wallById.has(order.wallId) && (auth.roleId !== "field-tech" || assignedWorkOrderIds.has(order.id)))
    .map((order) => {
      const wall = wallById.get(order.wallId);
      const client = clientById.get(wall.clientId);
      const wallProof = proofRecords.filter((item) => item.wallId === wall.id);
      const wallSensors = sensors.filter((item) => item.wallId === wall.id);
      const wallIncidents = incidents.filter((item) => item.wallId === wall.id);
      const wallModules = modulesByWall.get(wall.id) || [];
      const serviceContract=contractsByWall.get(wall.id)||null;

      return {
        workOrderId: order.id,
        wallId: wall.id,
        clientId: wall.clientId,
        due: order.due || null,
        priority: order.priority || "medium",
        status: order.status || null,
        serviceContract:serviceContract?{id:serviceContract.id,contractNumber:serviceContract.contractNumber,planName:serviceContract.planName,effectiveState:serviceContract.effectiveState,serviceWindow:`${serviceContract.serviceWindowStart}-${serviceContract.serviceWindowEnd}`,evidenceRequired:serviceContract.evidenceRequired,endDate:serviceContract.endDate}:null,
        readiness: wall.status === "risk" || order.priority === "high" ? "exception-first" : "standard-care",
        client: {
          id: wall.clientId,
          name: client?.name || wall.clientId,
          district: client?.district || null
        },
        assetName: wall.name,
        clientName: client?.name || wall.clientId,
        asset: {
          id: wall.id,
          name: wall.name,
          location: wall.location,
          health: wall.health,
          status: wall.status,
          modules: wall.modules,
          pods: wall.pods
        },
        workOrder: order,
        signals: {
          openIncidents: openIncidents(wallIncidents).length,
          activeSensorAlerts: wallSensors.filter((item) => ["alert", "watch", "offline"].includes(item.status)).length,
          proofRecords: wallProof.length
        },
        modules: wallModules.map((module) => ({ id: module.id, label: module.label, zone: module.zone, status: module.status, cameraId: module.cameraId, monitoringDevices: module.monitoringDevices, latestReadings: readingsByModule.get(module.id) || [] })),
        incidents: openIncidents(wallIncidents).map((incident) => ({ id: incident.id, severity: incident.severity, category: incident.category, recommendedAction: incident.recommendedAction })),
        sensorAlerts: wallSensors.filter((item) => ["alert", "watch", "offline"].includes(item.status)).map((sensor) => ({ id: sensor.id, type: sensor.type, status: sensor.status, action: sensor.action }))
      };
    })
    .sort((a, b) => String(a.due || "").localeCompare(String(b.due || "")) || a.workOrderId.localeCompare(b.workOrderId));
}

async function buildMobileReminders(auth, includeCompleted = false) {
  const [route, actions] = await Promise.all([buildMobileRoute(auth), listReminderActions()]);
  const actionById = new Map(actions.map((action) => [action.reminderId, action]));
  const reminders = [];
  for (const stop of route) {
    const workorderReminderId = `reminder:workorder:${stop.workOrderId}`;
    reminders.push({
      id: workorderReminderId,
      sourceType: "workorder",
      sourceId: stop.workOrderId,
      title: `${stop.asset.name} visit`,
      reason: `${stop.workOrder.type || "Service visit"} · ${stop.due || "scheduled"}`,
      priority: stop.priority || "medium",
      due: stop.due || null,
      clientId: stop.clientId,
      wallId: stop.wallId,
      workorderId: stop.workOrderId,
      status: actionById.get(workorderReminderId)?.status || "open",
      mobileAction: {
        actionType: "visit-record",
        label: "Start visit",
        path: `/mobile.html?workOrderId=${encodeURIComponent(stop.workOrderId)}&wallId=${encodeURIComponent(stop.wallId)}`,
        requiredCaptureTypes: ["photo", "water", "nutrient", "health-check"],
        moduleSelection: "optional-before-capture"
      }
    });

    for (const incident of stop.incidents || []) {
      const reminderId = `reminder:incident:${incident.id}`;
      reminders.push({
        id: reminderId,
        sourceType: "incident",
        sourceId: incident.id,
        title: `${stop.asset.name}: ${incident.category || "exception"}`,
        reason: incident.recommendedAction || "Inspect and record the exception",
        priority: incident.severity || "high",
        due: stop.due || null,
        clientId: stop.clientId,
        wallId: stop.wallId,
        workorderId: stop.workOrderId,
        status: actionById.get(reminderId)?.status || "open",
        mobileAction: {
          actionType: "record-exception",
          label: "Inspect on phone",
          path: `/mobile.html?workOrderId=${encodeURIComponent(stop.workOrderId)}&wallId=${encodeURIComponent(stop.wallId)}&mode=exception`,
          requiredCaptureTypes: ["photo", "exception"],
          moduleSelection: "recommended"
        }
      });
    }

    if ((stop.sensorAlerts || []).length) {
      const reminderId = `reminder:sensors:${stop.wallId}`;
      reminders.push({
        id: reminderId,
        sourceType: "sensor",
        sourceId: stop.wallId,
        title: `${stop.asset.name}: device check`,
        reason: `${stop.sensorAlerts.length} sensor alert${stop.sensorAlerts.length === 1 ? "" : "s"} need a field check`,
        priority: "high",
        due: stop.due || null,
        clientId: stop.clientId,
        wallId: stop.wallId,
        workorderId: stop.workOrderId,
        status: actionById.get(reminderId)?.status || "open",
        mobileAction: {
          actionType: "inspect-sensor",
          label: "Check devices",
          path: `/mobile.html?workOrderId=${encodeURIComponent(stop.workOrderId)}&wallId=${encodeURIComponent(stop.wallId)}&mode=sensor`,
          requiredCaptureTypes: ["photo", "health-check"],
          moduleSelection: "recommended"
        }
      });
    }
  }
  const visible = includeCompleted ? reminders : reminders.filter((reminder) => reminder.status !== "completed");
  return { items: visible, counts: { open: reminders.filter((item) => item.status !== "completed").length, completed: reminders.filter((item) => item.status === "completed").length, total: reminders.length } };
}

async function buildMobileRemediationTasks(auth, requestedStatuses = null) {
  const clientIds = auth.clientScope === "all" ? null : auth.clientIds;
  const allowedStatuses = new Set(["open", "assigned", "in_progress", "resolved", "cancelled"]);
  const normalizedStatuses = Array.isArray(requestedStatuses) ? requestedStatuses.filter((status) => allowedStatuses.has(status)) : null;
  const [tasks, modules] = await Promise.all([
    listRemediationTasks({ clientIds, statuses: normalizedStatuses?.length ? normalizedStatuses : null, limit: 200 }),
    listModules({ clientIds })
  ]);
  const moduleById = new Map(modules.map((module) => [module.id, module]));
  const visibleTasks = auth.roleId === "field-tech" ? tasks.filter((task) => task.assignedTo === auth.id) : tasks;
  return visibleTasks.map((task) => {
    const module = moduleById.get(task.moduleId) || null;
    return {
      ...task,
      module: module ? { id: module.id, label: module.label, zone: module.zone || null, assetId: module.assetId, clientId: module.clientId } : null,
      mobileAction: { path: `/mobile.html?${task.workOrderId ? `workOrderId=${encodeURIComponent(task.workOrderId)}&` : ""}wallId=${encodeURIComponent(task.wallId)}&moduleId=${encodeURIComponent(task.moduleId)}`, label: task.reviewStatus === "pending" ? "Awaiting FM review" : task.status === "in_progress" ? "Continue" : task.reviewStatus === "rejected" ? "Resume task" : "Start task", workOrderId: task.workOrderId || null }
    };
  });
}

async function resolveRemediationWorkOrder(auth, module, requestedWorkOrderId = null) {
  const [walls, workorders] = await Promise.all([readJsonData("walls"), readJsonData("workorders")]);
  const wall = walls.find((item) => item.id === module.assetId);
  const wallWorkorders = workorders.filter((order) => order.wallId === module.assetId);
  const normalized = String(requestedWorkOrderId || "").trim();
  if (normalized) {
    const requested = wallWorkorders.find((order) => order.id === normalized);
    if (!requested || wall?.clientId !== module.clientId || !canAccessClient(auth, module.clientId)) {
      throw validationError("work order must belong to the selected module wall and client scope", "REMEDIATION_WORK_ORDER_SCOPE_MISMATCH");
    }
    return requested.id;
  }
  return remediationWorkOrderFor(wallWorkorders)?.id || null;
}

function validationError(message, code = "VALIDATION_ERROR") {
  const error = new Error(message);
  error.status = 400;
  error.code = code;
  return error;
}

function apiError(status, message, code) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

async function validateMobileCaptureScope(auth, batch) {
  if (!batch || typeof batch !== "object") {
    throw validationError("mobile capture batch payload is required", "MOBILE_CAPTURE_VALIDATION_ERROR");
  }

  const clientId = String(batch.clientId || "").trim();
  if (!clientId) {
    throw validationError("mobile capture clientId is required", "MOBILE_CAPTURE_VALIDATION_ERROR");
  }

  requireClientAccess(auth, clientId, "mobile capture sync");
  const resolveEntityClientId = await buildEntityClientResolver();
  const wallClientId = resolveEntityClientId("wall", batch.wallId);
  const workOrderClientId = resolveEntityClientId("workorder", batch.workorderId);

  if (!wallClientId) {
    throw validationError("mobile capture references an unknown wall", "MOBILE_CAPTURE_UNKNOWN_WALL");
  }

  if (!workOrderClientId) {
    throw validationError("mobile capture references an unknown work order", "MOBILE_CAPTURE_UNKNOWN_WORKORDER");
  }

  if (wallClientId !== clientId || workOrderClientId !== clientId) {
    throw validationError("mobile capture wall, work order and client do not match", "MOBILE_CAPTURE_SCOPE_MISMATCH");
  }

  if (batch.moduleId) {
    const module = (await listModules({ wallId: batch.wallId })).find((item) => item.id === batch.moduleId);
    if (!module || module.clientId !== clientId) throw validationError("mobile capture module does not belong to the selected wall and client", "MOBILE_CAPTURE_MODULE_SCOPE_MISMATCH");
  }

  if (auth.roleId === "field-tech") {
    if (String(batch.technicianId || "").trim() !== auth.id) throw apiError(403, "mobile capture technician scope denied", "MOBILE_CAPTURE_TECHNICIAN_SCOPE_DENIED");
    await assertInventoryWorkOrderAccess(auth, batch.workorderId, batch.technicianId);
  }
}

function proofMediaUploadPolicy() {
  const production = productionConfigReport().production;
  return {
    version: production ? "2026-08-18.proof-media-s3-upload-v1" : "2026-08-17.proof-media-local-upload-v1",
    acceptedContentTypes: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
    maxByteSize: maxProofUploadBytes,
    requiredIntegrity: ["sha256", "byteSize", "objectKey"],
    supportedSources: ["technician-mobile", "robotic-care", "fm-admin", "client-approved-upload"],
    storageProvider: production ? "s3-compatible" : "dr-forest-local-vault",
    scan: { policyVersion: mediaScanPolicyVersion, requiredBeforeDownload: production, statuses: mediaScanStatuses },
    productionNote: production ? "Production bytes are uploaded to the configured private S3-compatible bucket; an explicit clean scan result is required before download." : "Pilot storage writes verified bytes to a local server vault. Production switches to S3-compatible storage after the production gate passes."
  };
}

function extensionForContentType(contentType) {
  return ({
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "application/pdf": ".pdf"
  })[contentType] || ".bin";
}

function proofMediaPath(media) {
  const safeId = String(media.id || "proof-media").replace(/[^a-zA-Z0-9_-]+/g, "-").slice(0, 96);
  return join(proofMediaRoot, `${safeId}${extensionForContentType(media.contentType)}`);
}

function decodeBase64ProofMedia(value) {
  const source = String(value || "").trim();
  if (!source || !/^[A-Za-z0-9+/]+={0,2}$/.test(source) || source.length % 4 !== 0) {
    throw validationError("fileBase64 must be a valid base64 payload", "PROOF_MEDIA_INVALID_BASE64");
  }
  const bytes = Buffer.from(source, "base64");
  if (!bytes.length) throw validationError("fileBase64 must not be empty", "PROOF_MEDIA_INVALID_BASE64");
  if (bytes.length > maxProofUploadBytes) {
    const error = validationError(`proof media file exceeds ${maxProofUploadBytes} byte pilot limit`, "PROOF_MEDIA_TOO_LARGE");
    error.status = 413;
    throw error;
  }
  return bytes;
}

async function writeLocalProofMedia(media, bytes) {
  const target = proofMediaPath(media);
  await mkdir(proofMediaRoot, { recursive: true });
  await writeFile(target, bytes, { flag: "wx" });
  return target;
}

async function readLocalProofMedia(media) {
  const target = proofMediaPath(media);
  const metadata = await stat(target);
  if (metadata.size !== media.byteSize) {
    throw validationError("stored proof media byteSize does not match ledger", "PROOF_MEDIA_STORAGE_SIZE_MISMATCH");
  }
  const bytes = await readFile(target);
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  if (sha256 !== media.sha256) {
    throw validationError("stored proof media sha256 does not match ledger", "PROOF_MEDIA_STORAGE_HASH_MISMATCH");
  }
  return bytes;
}

function sendProofMedia(res, media, bytes) {
  res.writeHead(200, {
    "Content-Type": media.contentType,
    "Content-Length": bytes.length,
    "Content-Disposition": `inline; filename="${String(media.filename).replace(/[\"\\]/g, "_")}"`,
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff"
  });
  res.end(bytes);
}

async function validateProofMediaScope(auth, media) {
  if (!media || typeof media !== "object") {
    throw validationError("proof media payload is required", "PROOF_MEDIA_VALIDATION_ERROR");
  }

  const clientId = String(media.clientId || "").trim();
  if (!clientId) {
    throw validationError("proof media clientId is required", "PROOF_MEDIA_VALIDATION_ERROR");
  }

  requireClientAccess(auth, clientId, "proof media");
  const resolveEntityClientId = await buildEntityClientResolver();
  const wallClientId = resolveEntityClientId("wall", media.wallId);
  const workOrderClientId = resolveEntityClientId("workorder", media.workorderId);

  if (!wallClientId) {
    throw validationError("proof media references an unknown wall", "PROOF_MEDIA_UNKNOWN_WALL");
  }

  if (!workOrderClientId) {
    throw validationError("proof media references an unknown work order", "PROOF_MEDIA_UNKNOWN_WORKORDER");
  }

  if (wallClientId !== clientId || workOrderClientId !== clientId) {
    throw validationError("proof media wall, work order and client do not match", "PROOF_MEDIA_SCOPE_MISMATCH");
  }

  if (media.moduleId) {
    const module = (await listModules({ wallId: media.wallId })).find((item) => item.id === media.moduleId);
    if (!module || module.clientId !== clientId) throw validationError("proof media module does not belong to the selected wall and client", "PROOF_MEDIA_MODULE_SCOPE_MISMATCH");
  }

  if (media.proofRecordId) {
    const proofClientId = resolveEntityClientId("proof", media.proofRecordId);
    if (!proofClientId) {
      throw validationError("proof media references an unknown proof record", "PROOF_MEDIA_UNKNOWN_PROOF_RECORD");
    }

    if (proofClientId !== clientId) {
      throw validationError("proof media proof record and client do not match", "PROOF_MEDIA_SCOPE_MISMATCH");
    }
  }

  if (media.captureBatchId) {
    const batches = await listMobileCaptureBatches();
    const batch = batches.find((item) => item.id === media.captureBatchId);
    if (!batch) {
      throw validationError("proof media references an unknown mobile capture batch", "PROOF_MEDIA_UNKNOWN_CAPTURE_BATCH");
    }

    if (batch.clientId !== clientId || batch.wallId !== media.wallId || batch.workorderId !== media.workorderId || (media.moduleId && batch.moduleId !== media.moduleId)) {
      throw validationError("proof media mobile capture batch does not match client, wall and work order", "PROOF_MEDIA_SCOPE_MISMATCH");
    }

    if (media.captureItemId && !batch.items.some((item) => item.id === media.captureItemId)) {
      throw validationError("proof media references an unknown mobile capture item", "PROOF_MEDIA_UNKNOWN_CAPTURE_ITEM");
    }
  }

  return clientId;
}

function normalizeOpsEvent(input) {
  const type = String(input.type || "").trim();
  const actor = String(input.actor || "").trim();
  const entityType = String(input.entityType || "").trim();
  const entityId = String(input.entityId || "").trim();

  if (!type || !actor || !entityType || !entityId) {
    const error = new Error("type, actor, entityType and entityId are required");
    error.status = 400;
    throw error;
  }

  return {
    id: input.id || `OPS-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    type,
    actor,
    entityType,
    entityId,
    clientId: input.clientId || null,
    wallId: input.wallId || null,
    source: input.source || "api",
    note: input.note || "",
    payload: input.payload && typeof input.payload === "object" ? input.payload : {}
  };
}

function deviceKeyFromRequest(req) {
  const direct = req.headers["x-dr-forest-device-key"];
  if (direct) return String(direct).trim();
  const authorization = String(req.headers.authorization || "");
  return authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
}

async function authenticateDeviceRequest(req) {
  const deviceKey = deviceKeyFromRequest(req);
  const device = await readDeviceByKey(deviceKey);
  if (!device) {
    const authError = validationError("Unknown or missing device key", "DEVICE_AUTH_REQUIRED");
    authError.status = 401;
    throw authError;
  }
  if (device.status === "disabled") {
    const disabledError = validationError("Device is disabled", "DEVICE_DISABLED");
    disabledError.status = 403;
    throw disabledError;
  }
  if (productionConfigReport().production) {
    const deviceId = String(req.headers["x-dr-forest-device-id"] || "").trim();
    const timestamp = String(req.headers["x-dr-forest-timestamp"] || "").trim();
    const nonce = String(req.headers["x-dr-forest-nonce"] || "").trim();
    const signature = String(req.headers["x-dr-forest-signature"] || "").trim().toLowerCase();
    if (!deviceId || deviceId !== device.id || !timestamp || !nonce || !signature) {
      throw Object.assign(new Error("Production device requests require id, timestamp, nonce and HMAC signature"), { status: 401, code: "DEVICE_SIGNATURE_REQUIRED" });
    }
    const timestampMs = Number(timestamp);
    const replayWindowMs = Number(process.env.DR_FOREST_DEVICE_REPLAY_WINDOW_SECONDS || 300) * 1000;
    if (!Number.isFinite(timestampMs) || Math.abs(Date.now() - timestampMs) > replayWindowMs) {
      throw Object.assign(new Error("Device request timestamp is outside the replay window"), { status: 401, code: "DEVICE_TIMESTAMP_INVALID" });
    }
    const bodyHash = createHash("sha256").update(req.rawBody || Buffer.alloc(0)).digest("hex");
    const canonical = `${timestamp}.${nonce}.${req.method}.${req.url}.${bodyHash}`;
    const expected = createHmac("sha256", deviceKey).update(canonical).digest("hex");
    if (!constantTimeEqual(signature, expected)) {
      throw Object.assign(new Error("Device request signature is invalid"), { status: 401, code: "DEVICE_SIGNATURE_INVALID" });
    }
    const replay = await consumeDeviceReplay({
      deviceId: device.id,
      nonce,
      expiresAt: new Date(timestampMs + replayWindowMs).toISOString()
    });
    if (!replay.accepted) throw Object.assign(new Error("Device request nonce has already been used"), { status: 409, code: "DEVICE_REPLAY_DETECTED" });
  }
  return device;
}

function deviceReadingInput(device, input, index = 0) {
  const metric = String(input?.metric || input?.type || (device.type !== "gateway" ? device.type : "")).trim().toLowerCase();
  const allowedMetrics = ["temperature", "humidity", "co2", "mc"];
  if (!allowedMetrics.includes(metric)) throw validationError(`readings[${index}].metric must be temperature, humidity, co2 or mc`, "DEVICE_METRIC_INVALID");
  if (device.type !== "gateway" && device.type !== metric) throw validationError(`Device ${device.id} cannot publish ${metric}`, "DEVICE_METRIC_DEVICE_MISMATCH");
  const moduleId = String(input?.moduleId || device.moduleId || "").trim();
  const wallId = String(input?.wallId || device.wallId || "").trim();
  if (!moduleId || !wallId) throw validationError("Device reading requires a module and wall mapping", "DEVICE_SCOPE_INCOMPLETE");
  const observedAt = input?.observedAt || new Date().toISOString();
  const sensorId = String(input?.sensorId || device.id).trim();
  const idempotencyKey = String(input?.idempotencyKey || input?.id || `${sensorId}:${observedAt}`).trim();
  return {
    id: String(input?.id || `READ-${device.id}-${Date.now()}-${index}`).trim(),
    idempotencyKey,
    sensorId,
    wallId,
    moduleId,
    metric,
    type: metric,
    value: input?.value,
    unit: input?.unit || null,
    status: input?.status || "ok",
    observedAt,
    source: input?.source || `device:${device.id}`,
    metadata: input?.metadata && typeof input.metadata === "object" ? input.metadata : {}
  };
}

async function ingestDeviceReading(device, input, index = 0) {
  const reading = deviceReadingInput(device, input, index);
  const module = (await listModules({ wallId: reading.wallId })).find((item) => item.id === reading.moduleId);
  if (!module || module.clientId !== device.clientId) throw validationError("Device reading module does not belong to the registered device scope", "DEVICE_SCOPE_MISMATCH");
  const result = await appendSensorReading(reading);
  const ingestion = await recordDeviceIngestion({ id: `DIL-${device.id}-${reading.idempotencyKey}`, deviceId: device.id, kind: "reading", idempotencyKey: reading.idempotencyKey, moduleId: reading.moduleId, observedAt: reading.observedAt, status: result.duplicate ? "duplicate" : "accepted", payloadHash: createHash("sha256").update(JSON.stringify(input)).digest("hex"), payload: input });
  await touchDevice(device.id, { ingestedAt: reading.observedAt });
  const alerts = result.duplicate ? [] : await evaluateTelemetryAlerts(result.reading, device.clientId);
  return { ...result, ingestion, reading: result.reading, alerts };
}

async function ingestDeviceReadings(device, inputs = []) {
  const readings = inputs.map((input, index) => deviceReadingInput(device, input, index));
  const modules = await listModules({ clientIds: [device.clientId] });
  for (const reading of readings) {
    const module = modules.find((item) => item.id === reading.moduleId && item.assetId === reading.wallId);
    if (!module || module.clientId !== device.clientId || (device.type !== "gateway" && (module.id !== device.moduleId || module.assetId !== device.wallId))) throw validationError("Device reading module does not belong to the registered device scope", "DEVICE_SCOPE_MISMATCH");
  }
  const results = await appendSensorReadings(readings);
  const ingestionInputs = results.map((result, index) => ({ id: `DIL-${device.id}-${readings[index].idempotencyKey}`, deviceId: device.id, kind: "reading", idempotencyKey: readings[index].idempotencyKey, moduleId: readings[index].moduleId, observedAt: readings[index].observedAt, status: result.duplicate ? "duplicate" : "accepted", payloadHash: createHash("sha256").update(JSON.stringify(inputs[index])).digest("hex"), payload: inputs[index] }));
  const ingestions = await recordDeviceIngestions(ingestionInputs);
  const acceptedReadings = results.filter((result) => !result.duplicate).map((result) => result.reading);
  const alertResults = acceptedReadings.length ? await evaluateTelemetryAlertsBatch(acceptedReadings, device.clientId) : [];
  await touchDevice(device.id, { ingestedAt: readings.at(-1)?.observedAt || null });
  return results.map((result, index) => ({ ...result, ingestion: ingestions[index], reading: result.reading, alerts: alertResults.filter((item) => item.alert.sourceReadingId === result.reading.id) }));
}

async function handleApi(req, res, pathname) {
  try {
    res.setHeader("X-Request-ID", String(req.requestId || randomUUID()));
    if (req.method === "POST" && pathname === "/api/auth/login") enforceRateLimit(req, "auth-login", 8, 60_000);
    if (req.method === "POST" && pathname.startsWith("/api/device-ingestion/")) enforceRateLimit(req, "device-ingestion", 240, 60_000);
    if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) assertBrowserOrigin(req);
    if (req.method === "OPTIONS") {
      res.writeHead(204, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, x-dr-forest-principal, x-dr-forest-session, x-dr-forest-device-key"
      });
      res.end();
      return;
    }

    if (req.method === "GET" && pathname === "/api/health") {
      const production = productionConfigReport();
      sendJson(res, 200, {
        status: "ok",
        service: "dr-forest-fm-ops",
        mode: "api-foundation",
        runtimeStore: production.production ? "postgresql" : "sqlite",
        masterDataStore: production.production ? "postgresql" : "sqlite",
        authPolicy: "role-client-scope-plus-pilot-session-v1",
        mobileWorkflow: "pwa-offline-capture-v2",
        proofMediaVault: "local-verified-v1",
        deviceIntegration: {
          version: "registry-http-ingestion-v2",
          maxReadingsPerBatch: maxDeviceReadingBatchSize,
          rateLimitPerIpPerMinute: deviceIngestionRateLimitPerIp,
          rateLimitPerDevicePerMinute: deviceIngestionRateLimitPerDevice,
          rateLimitPerGatewayPerMinute: deviceIngestionRateLimitPerGateway
        },
        productionGate: production,
        oidc: oidcHealth(),
        generatedAt: new Date().toISOString(),
        dataFiles: Object.keys(dataFileMap)
      });
      return;
    }

    if (req.method === "GET" && pathname === "/api/health/ready") {
      if (draining) {
        sendJson(res, 503, { status: "draining", service: "dr-forest-fm-ops", checkedAt: new Date().toISOString(), code: "SERVICE_DRAINING", operationalLimits: ["Server is draining and will not accept new work."] });
        return;
      }
      try {
        const production = productionConfigReport();
        const [runtimeStorage, masterDataStorage, mobileCaptureStorage, proofMediaStorage, telemetryStorage, moduleStorage, reminderStorage, deviceStorage, alertStorage, aiVisionStorage, notificationStorage, evidenceSnapshotStorage, healthEsgStorage, fieldServiceStorage] = await Promise.all([
          readOpsStorageHealth(),
          readMasterDataHealth(),
          readMobileCaptureStorageHealth(),
          readProofMediaStorageHealth(),
          readTelemetryStorageHealth(),
          readModuleStorageHealth(),
          readReminderStorageHealth(),
          readDeviceStorageHealth(),
          readAlertStorageHealth(),
          readAiVisionStorageHealth(),
          readNotificationStorageHealth(),
          readEvidenceSnapshotStorageHealth(),
          readHealthEsgStorageHealth(),
          readFieldServiceStorageHealth()
        ]);
        const ready = production.ready;
        sendJson(res, ready ? 200 : 503, {
          status: ready ? "ready" : "not-ready",
          service: "dr-forest-fm-ops",
          checkedAt: new Date().toISOString(),
          productionGate: production,
          runtime: { database: runtimeStorage.backend, migrations: runtimeStorage.migrations.length },
          masterData: { backend: masterDataStorage.source, foreignKeyIssues: masterDataStorage.relationshipIntegrity.foreignKeyIssues },
          mobileCapture: { batches: mobileCaptureStorage.counts.captureBatches, foreignKeyIssues: mobileCaptureStorage.relationshipIntegrity.foreignKeyIssues },
          proofMedia: { backend: proofMediaStorage.backend, objects: proofMediaStorage.counts.mediaObjects, scans: proofMediaStorage.counts.mediaScanResults, unscanned: proofMediaStorage.counts.unscanned, cleanScans: proofMediaStorage.counts.scanClean, quarantinedScans: proofMediaStorage.counts.scanQuarantined, foreignKeyIssues: proofMediaStorage.relationshipIntegrity.foreignKeyIssues },
          telemetry: { historyRows: telemetryStorage.counts.sensorReadingHistory, healthSnapshots: telemetryStorage.counts.healthScoreSnapshots },
          modules: { count: moduleStorage.counts.modules, foreignKeyIssues: moduleStorage.relationshipIntegrity.foreignKeyIssues },
          reminders: { actions: reminderStorage.counts.actions },
          devices: { count: deviceStorage.counts.devices, ingestionLogs: deviceStorage.counts.ingestionLogs, cameraCaptures: deviceStorage.counts.cameraCaptures, foreignKeyIssues: deviceStorage.relationshipIntegrity.foreignKeyIssues },
          alerts: { rules: alertStorage.counts.rules, alerts: alertStorage.counts.alerts, foreignKeyIssues: alertStorage.relationshipIntegrity.foreignKeyIssues },
          aiVision: { diagnoses: aiVisionStorage.counts.diagnoses, foreignKeyIssues: aiVisionStorage.relationshipIntegrity.foreignKeyIssues },
          notifications: { pending: notificationStorage.counts.pending, processing: notificationStorage.counts.processing, retry: notificationStorage.counts.retry, failed: notificationStorage.counts.failed, delivered: notificationStorage.counts.delivered, due: notificationStorage.counts.due },
          evidenceSnapshots: { count: evidenceSnapshotStorage.counts.snapshots, verified: evidenceSnapshotStorage.counts.verified, unsigned: evidenceSnapshotStorage.counts.unsigned, expired: evidenceSnapshotStorage.counts.expired, migrationVersion: evidenceSnapshotStorage.migrationVersion },
          healthEsg: { observations: healthEsgStorage.counts.observations, ledgers: healthEsgStorage.counts.ledgers, healthSnapshots: healthEsgStorage.counts.healthSnapshots, foreignKeyIssues: healthEsgStorage.relationshipIntegrity.foreignKeyIssues, migrationVersion: healthEsgStorage.migrationVersion },
          fieldService: { cycles: fieldServiceStorage.counts.total, completed: fieldServiceStorage.counts.completed, exceptions: fieldServiceStorage.counts.exceptions, clients: fieldServiceStorage.counts.clients, foreignKeyIssues: fieldServiceStorage.relationshipIntegrity.foreignKeyIssues, migrationVersion: fieldServiceStorage.migrationVersion },
          operationalLimits: [
            ...(ready ? [] : production.failures.map((item) => `${item.name}: ${item.detail}`)),
            ...(production.production ? [] : [
              "Pilot mode: local SQLite runtime is active; switch DR_FOREST_ENV=production only after external service checks pass.",
              "Pilot mode: local proof vault and pilot/demo identity remain intentionally enabled."
            ]),
            "Device registry and HTTP ingestion ports are available; production requires HMAC request signing, network policy and replay protection."
          ]
        });
      } catch (error) {
        sendJson(res, 503, { status: "not-ready", service: "dr-forest-fm-ops", checkedAt: new Date().toISOString(), productionGate: productionConfigReport(), error: error.message, code: error.code || "HEALTH_DEPENDENCY_UNAVAILABLE" });
      }
      return;
    }

    if (req.method === "POST" && pathname === "/api/auth/login") {
      if (productionConfigReport().production) throw Object.assign(new Error("Pilot login is disabled in production; configure the OIDC identity adapter."), { status: 503, code: "AUTH_OIDC_REQUIRED" });
      const configuration = await ensurePilotAccount(runtimeDbPath);
      if (!configuration.configured) throw validationError("Pilot login is not configured. Set DR_FOREST_OPERATOR_EMAIL and DR_FOREST_OPERATOR_PASSWORD before enabling it.", "AUTH_LOGIN_NOT_CONFIGURED");
      const input = await readJsonBody(req);
      const session = await createPilotSession(runtimeDbPath, input.email, input.password);
      sendJson(res, 200, { authenticated: true, expiresAt: session.expiresAt, account: session.account }, { "Set-Cookie": sessionCookie(session.token, session.expiresAt) });
      return;
    }

    if (req.method === "POST" && pathname === "/api/auth/logout") {
      const token = sessionTokenFromRequest(req);
      await revokePilotSession(runtimeDbPath, token);
      sendJson(res, 200, { authenticated: false }, { "Set-Cookie": "drf_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0" });
      return;
    }

    const session = await readPilotSession(runtimeDbPath, sessionTokenFromRequest(req));
    const deviceIngestionRequest = req.method === "POST" && (pathname === "/api/device-ingestion/readings" || pathname === "/api/device-ingestion/camera-captures");
    const auth = deviceIngestionRequest
      ? null
      : (productionConfigReport().production
        ? await resolveOidcAuthContext(req)
        : (session ? authContextFromSession(session) : resolveAuthContext(req)));

    if (req.method === "GET" && pathname === "/api/devices") {
      requirePermission(auth, "device.registry.read");
      const url = new URL(req.url, `http://${host}:${port}`);
      const wallId = url.searchParams.get("wallId");
      const moduleId = url.searchParams.get("moduleId");
      if (wallId) {
        const resolveEntityClientId = await buildEntityClientResolver();
        requireClientAccess(auth, resolveEntityClientId("wall", wallId), "device list");
      }
      sendJson(res, 200, { generatedAt: new Date().toISOString(), devices: await listDevices({ clientIds: auth.clientScope === "all" ? null : auth.clientIds, wallId, moduleId }) });
      return;
    }

    if (req.method === "GET" && pathname === "/api/device-health") {
      requirePermission(auth, "device.registry.read");
      if (auth.clientScope !== "all") throw apiError(403, "device health summary requires platform-wide scope", "DEVICE_HEALTH_SCOPE_DENIED");
      sendJson(res, 200, { generatedAt: new Date().toISOString(), health: await readDeviceStorageHealth() });
      return;
    }

    if (req.method === "POST" && pathname === "/api/admin/devices") {
      requirePermission(auth, "device.registry.write");
      const input = await readJsonBody(req);
      const resolveEntityClientId = await buildEntityClientResolver();
      const clientId = resolveEntityClientId("wall", input.wallId);
      requireClientAccess(auth, clientId, "device registration");
      const result = await registerDevice({ ...input, clientId });
      const event = normalizeOpsEvent({ type: "device.registered", actor: auth.name, entityType: "device", entityId: result.device.id, clientId: result.device.clientId, wallId: result.device.wallId, source: "device-registry", note: `Device ${result.device.id} registered for ${result.device.moduleId || result.device.wallId}.`, payload: { principalId: auth.id, deviceType: result.device.type, protocol: result.device.protocol, rotated: result.rotated || false } });
      if (!result.duplicate) await appendOpsEvent(event);
      sendJson(res, result.duplicate ? 200 : 201, { ...result, event: result.duplicate ? null : event });
      return;
    }

    const deviceAdminMatch = pathname.match(/^\/api\/admin\/devices\/([^/]+)$/);
    if (req.method === "PUT" && deviceAdminMatch) {
      requirePermission(auth, "device.registry.write");
      const id = decodeURIComponent(deviceAdminMatch[1]);
      const input = await readJsonBody(req);
      const existing = (await listDevices()).find((item) => item.id === id);
      if (!existing) throw validationError("device not found", "DEVICE_NOT_FOUND");
      requireClientAccess(auth, existing.clientId, "device update");
      const result = await updateDevice(id, input);
      const event = normalizeOpsEvent({ type: "device.updated", actor: auth.name, entityType: "device", entityId: result.device.id, clientId: result.device.clientId, wallId: result.device.wallId, source: "device-registry", note: `Device ${result.device.id} updated.`, payload: { principalId: auth.id, rotated: result.rotated || false } });
      await appendOpsEvent(event);
      sendJson(res, 200, { ...result, event });
      return;
    }

    if (req.method === "GET" && pathname === "/api/device-lifecycle") {
      requirePermission(auth, "device.lifecycle.read");
      const url = new URL(req.url, `http://${host}:${port}`);
      const wallId = url.searchParams.get("wallId");
      const moduleId = url.searchParams.get("moduleId");
      if (wallId) {
        const resolveEntityClientId = await buildEntityClientResolver();
        requireClientAccess(auth, resolveEntityClientId("wall", wallId), "device lifecycle list");
      }
      if (auth.roleId === "field-tech") {
        if (!moduleId) throw apiError(400, "field technician device lifecycle queries require moduleId", "DEVICE_LIFECYCLE_MODULE_REQUIRED");
        await assertFieldDeviceModuleAccess(auth, moduleId);
      }
      sendJson(res, 200, {
        generatedAt: new Date().toISOString(),
        ...(await listDeviceLifecycle({ clientIds: auth.clientScope === "all" ? null : auth.clientIds, wallId, moduleId, status: url.searchParams.get("status"), dueOnly: url.searchParams.get("dueOnly") === "true" }))
      });
      return;
    }

    const deviceLifecycleEventsMatch = pathname.match(/^\/api\/device-lifecycle\/([^/]+)\/events$/);
    if (req.method === "GET" && deviceLifecycleEventsMatch) {
      requirePermission(auth, "device.lifecycle.read");
      const deviceId = decodeURIComponent(deviceLifecycleEventsMatch[1]);
      const overview = await listDeviceLifecycle({ clientIds: auth.clientScope === "all" ? null : auth.clientIds });
      const record = overview.records.find((item) => item.deviceId === deviceId);
      if (!record) throw apiError(404, "device lifecycle record not found in the current scope", "DEVICE_LIFECYCLE_NOT_FOUND");
      if (auth.roleId === "field-tech") throw apiError(403, "field technicians cannot read the full device audit history", "DEVICE_LIFECYCLE_HISTORY_DENIED");
      sendJson(res, 200, { generatedAt: new Date().toISOString(), record, events: await listDeviceLifecycleEvents(deviceId) });
      return;
    }

    const deviceLifecycleProfileMatch = pathname.match(/^\/api\/device-lifecycle\/([^/]+)\/profile$/);
    if (req.method === "PUT" && deviceLifecycleProfileMatch) {
      requirePermission(auth, "device.lifecycle.write");
      const idempotencyKey = String(req.headers["idempotency-key"] || "").trim();
      if (!idempotencyKey) throw apiError(428, "Idempotency-Key header is required for device lifecycle changes", "IDEMPOTENCY_KEY_REQUIRED");
      const deviceId = decodeURIComponent(deviceLifecycleProfileMatch[1]);
      const existing = (await listDeviceLifecycle()).records.find((item) => item.deviceId === deviceId);
      if (!existing) throw apiError(404, "device not found", "DEVICE_LIFECYCLE_DEVICE_NOT_FOUND");
      requireClientAccess(auth, existing.clientId, "device lifecycle profile");
      const result = await upsertDeviceLifecycleProfile(deviceId, { ...(await readJsonBody(req)), actorId: auth.id, actorName: auth.name, idempotencyKey });
      const event = result.duplicate ? null : normalizeOpsEvent({ type: "device.lifecycle.profile-saved", actor: auth.name, entityType: "device", entityId: deviceId, clientId: result.record.clientId, wallId: result.record.wallId, source: "device-lifecycle", note: `Service profile saved for ${deviceId}.`, payload: { principalId: auth.id, serialNumber: result.record.serialNumber, calibrationIntervalDays: result.record.calibrationIntervalDays } });
      if (event) await appendOpsEvent(event);
      sendJson(res, result.duplicate ? 200 : 201, { ...result, lifecycleEvent: result.event, event });
      return;
    }

    const deviceLifecycleActionMatch = pathname.match(/^\/api\/device-lifecycle\/([^/]+)\/actions$/);
    if (req.method === "POST" && deviceLifecycleActionMatch) {
      requirePermission(auth, "device.lifecycle.field");
      const idempotencyKey = String(req.headers["idempotency-key"] || "").trim();
      if (!idempotencyKey) throw apiError(428, "Idempotency-Key header is required for device lifecycle changes", "IDEMPOTENCY_KEY_REQUIRED");
      const deviceId = decodeURIComponent(deviceLifecycleActionMatch[1]);
      const input = await readJsonBody(req);
      const existing = (await listDeviceLifecycle()).records.find((item) => item.deviceId === deviceId);
      if (!existing) throw apiError(404, "device lifecycle record not found", "DEVICE_LIFECYCLE_NOT_FOUND");
      requireClientAccess(auth, existing.clientId, "device lifecycle action");
      if (auth.roleId === "field-tech") {
        if (!["calibrated", "fault_reported"].includes(String(input.action || "").trim().toLowerCase())) throw apiError(403, "field technician may only record calibration or report a fault", "DEVICE_LIFECYCLE_ACTION_DENIED");
        if (!input.workOrderId) throw apiError(400, "field device action requires workOrderId", "DEVICE_LIFECYCLE_WORKORDER_REQUIRED");
        await assertFieldDeviceModuleAccess(auth, existing.moduleId, input.workOrderId);
      } else if (!["calibrated", "fault_reported"].includes(String(input.action || "").trim().toLowerCase())) {
        requirePermission(auth, "device.lifecycle.write");
      }
      const result = await applyDeviceLifecycleAction(deviceId, { ...input, actorId: auth.id, actorName: auth.name, idempotencyKey });
      const event = result.duplicate ? null : normalizeOpsEvent({ type: `device.lifecycle.${result.event.action}`, actor: auth.name, entityType: "device", entityId: deviceId, clientId: result.record.clientId, wallId: result.record.wallId, source: "device-lifecycle", note: result.event.note || `${deviceId} recorded ${result.event.action}.`, payload: { principalId: auth.id, moduleId: result.record.moduleId, fromStatus: result.event.fromStatus, toStatus: result.event.toStatus, workOrderId: result.event.workOrderId, evidenceRef: result.event.evidenceRef, replacementDeviceId: result.event.replacementDeviceId } });
      if (event) await appendOpsEvent(event);
      sendJson(res, 200, { ...result, lifecycleEvent: result.event, event });
      return;
    }

    if (req.method === "POST" && pathname === "/api/device-ingestion/readings") {
      const input = await readJsonBody(req);
      const device = await authenticateDeviceRequest(req);
      enforceRateLimit(req, `device-ingestion-device:${device.id}`, device.type === "gateway" ? deviceIngestionRateLimitPerGateway : deviceIngestionRateLimitPerDevice, 60_000);
      const readings = Array.isArray(input?.readings) ? input.readings : [input];
      if (!readings.length || readings.length > maxDeviceReadingBatchSize) throw validationError(`device readings batch must contain 1 to ${maxDeviceReadingBatchSize} readings`, "DEVICE_BATCH_INVALID");
      const results = await ingestDeviceReadings(device, readings);
      const acceptedResults = results.filter((item) => !item.duplicate);
      if (acceptedResults.length) {
        await appendOpsEvent(normalizeOpsEvent({ type: "device.readings.batch_ingested", actor: `device:${device.id}`, entityType: "device", entityId: device.id, clientId: device.clientId, wallId: device.wallId, source: "device-ingestion", note: `Device ${device.id} published ${acceptedResults.length} readings in one batch.`, payload: { deviceId: device.id, accepted: acceptedResults.length, duplicates: results.length - acceptedResults.length, readingIds: acceptedResults.slice(0, 100).map((item) => item.reading.id) } }));
        for (const alertResult of results.flatMap((item) => item.alerts || []).filter((item) => item.created)) await appendOpsEvent(normalizeOpsEvent({ type: "telemetry.alert.opened", actor: `device:${device.id}`, entityType: "telemetry-alert", entityId: alertResult.alert.id, clientId: alertResult.alert.clientId, wallId: alertResult.alert.wallId, source: "telemetry-alerts", note: alertResult.alert.reason, payload: { deviceId: device.id, ruleId: alertResult.alert.ruleId, severity: alertResult.alert.severity, moduleId: alertResult.alert.moduleId } }));
      }
      sendJson(res, results.some((item) => !item.duplicate) ? 201 : 200, { receivedAt: new Date().toISOString(), device: { id: device.id, type: device.type, moduleId: device.moduleId }, accepted: results.filter((item) => !item.duplicate).length, duplicates: results.filter((item) => item.duplicate).length, readings: results.map((item) => item.reading), alerts: results.flatMap((item) => item.alerts || []) });
      return;
    }

    if (req.method === "POST" && pathname === "/api/device-ingestion/camera-captures") {
      const input = await readJsonBody(req, maxProofUploadPayloadBytes);
      const device = await authenticateDeviceRequest(req);
      enforceRateLimit(req, `device-ingestion-device:${device.id}`, device.type === "gateway" ? deviceIngestionRateLimitPerGateway : deviceIngestionRateLimitPerDevice, 60_000);
      if (!["camera", "gateway"].includes(device.type)) throw validationError("Only camera or gateway devices may publish camera captures", "DEVICE_CAMERA_TYPE_MISMATCH");
      const fileBytes = input.fileBase64 ? decodeBase64ProofMedia(input.fileBase64) : null;
      const capture = await saveDeviceCameraCapture({ ...input, deviceId: device.id, clientId: device.clientId, wallId: input.wallId || device.wallId, moduleId: input.moduleId || device.moduleId }, fileBytes);
      const ingestion = await recordDeviceIngestion({ id: `DIL-${device.id}-${input.idempotencyKey || input.id}`, deviceId: device.id, kind: "camera", idempotencyKey: input.idempotencyKey || input.id, moduleId: capture.capture.moduleId, observedAt: capture.capture.capturedAt, status: capture.duplicate ? "duplicate" : "accepted", payloadHash: createHash("sha256").update(JSON.stringify({ ...input, fileBase64: undefined })).digest("hex"), payload: { captureId: capture.capture.id, contentType: capture.capture.contentType, byteSize: capture.capture.byteSize, sha256: capture.capture.sha256 } });
      await touchDevice(device.id, { ingestedAt: capture.capture.capturedAt });
      if (!capture.duplicate) await appendOpsEvent(normalizeOpsEvent({ type: "device.camera.ingested", actor: `device:${device.id}`, entityType: "device-camera-capture", entityId: capture.capture.id, clientId: device.clientId, wallId: device.wallId, source: "device-ingestion", note: `Camera ${device.id} published a module capture.`, payload: { deviceId: device.id, moduleId: capture.capture.moduleId, captureId: capture.capture.id, mediaStatus: capture.capture.mediaStatus } }));
      sendJson(res, capture.duplicate ? 200 : 201, { ...capture, ingestion });
      return;
    }

    if (req.method === "GET" && pathname === "/api/device-ingestion/camera-captures") {
      requirePermission(auth, "device.captures.read");
      const url = new URL(req.url, `http://${host}:${port}`);
      const wallId = url.searchParams.get("wallId");
      const moduleId = url.searchParams.get("moduleId");
      if (wallId) {
        const resolveEntityClientId = await buildEntityClientResolver();
        requireClientAccess(auth, resolveEntityClientId("wall", wallId), "camera capture list");
      }
      sendJson(res, 200, { generatedAt: new Date().toISOString(), captures: await listDeviceCameraCaptures({ clientIds: auth.clientScope === "all" ? null : auth.clientIds, wallId, moduleId }) });
      return;
    }

    const deviceCameraFileMatch = pathname.match(/^\/api\/device-ingestion\/camera-captures\/([^/]+)\/file$/);
    if (req.method === "GET" && deviceCameraFileMatch) {
      requirePermission(auth, "proof.media.read");
      const capture = await readDeviceCameraCapture(decodeURIComponent(deviceCameraFileMatch[1]));
      if (!capture) throw validationError("camera capture not found", "DEVICE_CAMERA_NOT_FOUND");
      requireClientAccess(auth, capture.clientId, "camera capture file");
      const file = await readDeviceCameraBytes(capture.id);
      if (!file) throw validationError("camera capture has no stored bytes", "DEVICE_CAMERA_FILE_NOT_STORED");
      res.writeHead(200, { "Content-Type": file.contentType, "Content-Length": file.bytes.length, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" });
      res.end(file.bytes);
      return;
    }

    const telemetryHistoryMatch = pathname.match(/^\/api\/telemetry\/sensor-history\/([^/]+)$/);
    if (req.method === "GET" && telemetryHistoryMatch) {
      requirePermission(auth, "telemetry.read");
      const wallId = decodeURIComponent(telemetryHistoryMatch[1]);
      const resolveEntityClientId = await buildEntityClientResolver();
      requireClientAccess(auth, resolveEntityClientId("wall", wallId), "sensor history");
      const url = new URL(req.url, `http://${host}:${port}`);
      sendJson(res, 200, { generatedAt: new Date().toISOString(), wallId, moduleId: url.searchParams.get("moduleId"), readings: await listSensorHistory(wallId, url.searchParams.get("limit"), url.searchParams.get("moduleId")) });
      return;
    }

    if (req.method === "GET" && pathname === "/api/modules") {
      requirePermission(auth, "telemetry.read");
      const url = new URL(req.url, `http://${host}:${port}`);
      const wallId = url.searchParams.get("wallId");
      const clientId = url.searchParams.get("clientId");
      if (wallId) {
        const resolveEntityClientId = await buildEntityClientResolver();
        requireClientAccess(auth, resolveEntityClientId("wall", wallId), "module list");
      }
      if (clientId) requireClientAccess(auth, clientId, "module list");
      const modulePage = await listModulePage({
        wallId,
        clientId,
        clientIds: auth.clientScope === "all" ? null : auth.clientIds,
        search: url.searchParams.get("search") || url.searchParams.get("q"),
        statuses: url.searchParams.get("status") || url.searchParams.get("statuses"),
        limit: url.searchParams.get("limit"),
        cursor: url.searchParams.get("cursor")
      });
      const modules = modulePage.items;
      const latestReadings = await listLatestReadingsByModules(modules.map((module) => module.id));
      const readingsByModule = new Map();
      for (const reading of latestReadings) readingsByModule.set(reading.moduleId, [...(readingsByModule.get(reading.moduleId) || []), reading]);
      const enriched = modules.map((module) => ({ ...module, latestReadings: readingsByModule.get(module.id) || [] }));
      sendJson(res, 200, { generatedAt: new Date().toISOString(), modules: enriched, page: modulePage.page, filters: modulePage.filters });
      return;
    }

    if (req.method === "GET" && pathname === "/api/commissioning") {
      requirePermission(auth, "commissioning.read");
      const url = new URL(req.url, `http://${host}:${port}`);
      const wallId = url.searchParams.get("wallId");
      if (wallId) requireClientAccess(auth, (await listModules({ wallId })).at(0)?.clientId, "commissioning list");
      sendJson(res, 200, await commissioningOverviewFor(auth, { wallId, status: url.searchParams.get("status") }));
      return;
    }

    const commissioningEventsMatch = pathname.match(/^\/api\/commissioning\/([^/]+)\/events$/);
    if (req.method === "GET" && commissioningEventsMatch) {
      requirePermission(auth, "commissioning.read");
      const moduleId = decodeURIComponent(commissioningEventsMatch[1]);
      const overview = await commissioningOverviewFor(auth);
      const record = overview.records.find((item) => item.moduleId === moduleId);
      if (!record) throw apiError(404, "commissioning module not found in the current client scope", "COMMISSIONING_NOT_FOUND");
      sendJson(res, 200, { generatedAt: new Date().toISOString(), record, events: await listCommissioningEvents(moduleId) });
      return;
    }

    const commissioningCodeMatch = pathname.match(/^\/api\/mobile\/module-code\/([^/]+)$/);
    if (req.method === "GET" && commissioningCodeMatch) {
      requirePermission(auth, "mobile.route.read");
      requirePermission(auth, "commissioning.read");
      const record = await readCommissioningByCode(decodeURIComponent(commissioningCodeMatch[1]));
      if (!record || record.status === "retired") throw apiError(404, "active module code not found", "COMMISSIONING_CODE_NOT_FOUND");
      requireClientAccess(auth, record.clientId, "mobile module code");
      sendJson(res, 200, { generatedAt: new Date().toISOString(), record, mobileUrl: `/mobile.html?moduleCode=${encodeURIComponent(record.publicCode)}` });
      return;
    }

    if (req.method === "POST" && pathname === "/api/commissioning") {
      requirePermission(auth, "commissioning.write");
      const idempotencyKey = String(req.headers["idempotency-key"] || "").trim();
      if (!idempotencyKey) throw apiError(428, "Idempotency-Key header is required for commissioning changes", "IDEMPOTENCY_KEY_REQUIRED");
      const input = await readJsonBody(req);
      const module = (await listModules()).find((item) => item.id === String(input.moduleId || "").trim());
      if (!module) throw apiError(404, "module not found", "COMMISSIONING_MODULE_NOT_FOUND");
      requireClientAccess(auth, module.clientId, "commissioning plan");
      const result = await planCommissioning({ ...input, actorId: auth.id, actorName: auth.name, idempotencyKey });
      const event = result.duplicate ? null : normalizeOpsEvent({ type: "module.commissioning.planned", actor: auth.name, entityType: "module", entityId: result.record.moduleId, clientId: result.record.clientId, wallId: result.record.wallId, source: "module-commissioning", note: `Physical identity ${result.record.serialNumber} planned for ${result.record.moduleId}.`, payload: { principalId: auth.id, publicCode: result.record.publicCode, hardwareRevision: result.record.hardwareRevision } });
      if (event) await appendOpsEvent(event);
      sendJson(res, result.duplicate ? 200 : 201, { ...result, event });
      return;
    }

    const commissioningTransitionMatch = pathname.match(/^\/api\/commissioning\/([^/]+)$/);
    if (req.method === "PATCH" && commissioningTransitionMatch) {
      const moduleId = decodeURIComponent(commissioningTransitionMatch[1]);
      const input = await readJsonBody(req); const toStatus = String(input.toStatus || "").trim().toLowerCase();
      if (toStatus === "installed") requirePermission(auth, "commissioning.install");
      else if (toStatus === "verified") requirePermission(auth, "commissioning.verify");
      else requirePermission(auth, "commissioning.write");
      const idempotencyKey = String(req.headers["idempotency-key"] || "").trim();
      if (!idempotencyKey) throw apiError(428, "Idempotency-Key header is required for commissioning changes", "IDEMPOTENCY_KEY_REQUIRED");
      const overview = await commissioningOverviewFor(auth); const current = overview.records.find((item) => item.moduleId === moduleId);
      if (!current) throw apiError(404, "commissioning module not found in the current client scope", "COMMISSIONING_NOT_FOUND");
      requireClientAccess(auth, current.clientId, "commissioning transition");
      if (toStatus === "verified" && current.missingDeviceTypes.length) throw apiError(409, `device mapping incomplete: ${current.missingDeviceTypes.join(", ")}`, "COMMISSIONING_DEVICE_COVERAGE_INCOMPLETE");
      const result = await transitionCommissioning(moduleId, { ...input, actorId: auth.id, actorName: auth.name, idempotencyKey });
      const event = result.duplicate ? null : normalizeOpsEvent({ type: `module.commissioning.${result.record.status}`, actor: auth.name, entityType: "module", entityId: result.record.moduleId, clientId: result.record.clientId, wallId: result.record.wallId, source: "module-commissioning", note: result.record.lifecycleNote || `Module ${result.record.moduleId} moved to ${result.record.status}.`, payload: { principalId: auth.id, fromStatus: result.event.fromStatus, toStatus: result.event.toStatus, installedBy: result.record.installedBy, verifiedBy: result.record.verifiedBy } });
      if (event) await appendOpsEvent(event);
      sendJson(res, 200, { ...result, event });
      return;
    }

    if (req.method === "GET" && pathname === "/api/telemetry/alert-rules") {
      requirePermission(auth, "telemetry.alerts.read");
      const url = new URL(req.url, `http://${host}:${port}`);
      const wallId = url.searchParams.get("wallId");
      const moduleId = url.searchParams.get("moduleId");
      if (wallId) {
        const resolveEntityClientId = await buildEntityClientResolver();
        requireClientAccess(auth, resolveEntityClientId("wall", wallId), "alert rule list");
      }
      sendJson(res, 200, { generatedAt: new Date().toISOString(), rules: await listAlertRules({ clientIds: auth.clientScope === "all" ? null : auth.clientIds, wallId, moduleId }) });
      return;
    }

    if (req.method === "POST" && pathname === "/api/admin/telemetry/alert-rules") {
      requirePermission(auth, "telemetry.alerts.write");
      const input = await readJsonBody(req);
      const resolveEntityClientId = await buildEntityClientResolver();
      const wallClientId = input.wallId ? resolveEntityClientId("wall", input.wallId) : null;
      if (input.wallId && !wallClientId) throw validationError("alert rule references an unknown wall", "ALERT_UNKNOWN_WALL");
      const clientId = input.clientId || wallClientId || null;
      if (clientId) requireClientAccess(auth, clientId, "alert rule write");
      if (input.wallId && clientId && clientId !== wallClientId) throw validationError("alert rule client and wall do not match", "ALERT_SCOPE_MISMATCH");
      if (input.moduleId) {
        const moduleRows = await listModules({ wallId: input.wallId || null });
        const module = moduleRows.find((item) => item.id === input.moduleId);
        if (!module || (input.wallId && module.assetId !== input.wallId) || (clientId && module.clientId !== clientId)) throw validationError("alert rule module is outside the selected scope", "ALERT_UNKNOWN_MODULE");
      }
      const result = await registerAlertRule({ ...input, clientId });
      const event = normalizeOpsEvent({ type: "telemetry.alert-rule.upserted", actor: auth.name, entityType: "telemetry-alert-rule", entityId: result.rule.id, clientId: result.rule.clientId, wallId: result.rule.wallId, source: "telemetry-alerts", note: `Alert rule ${result.rule.name} was upserted.`, payload: { principalId: auth.id, metric: result.rule.metric, severity: result.rule.severity } });
      await appendOpsEvent(event);
      sendJson(res, result.duplicate ? 200 : 201, { ...result, event });
      return;
    }

    if (req.method === "GET" && pathname === "/api/telemetry/alerts") {
      requirePermission(auth, "telemetry.alerts.read");
      const url = new URL(req.url, `http://${host}:${port}`);
      const wallId = url.searchParams.get("wallId");
      const moduleId = url.searchParams.get("moduleId");
      const statuses = url.searchParams.getAll("status").length ? url.searchParams.getAll("status") : (url.searchParams.get("statuses") || "").split(",").filter(Boolean);
      if (wallId) {
        const resolveEntityClientId = await buildEntityClientResolver();
        requireClientAccess(auth, resolveEntityClientId("wall", wallId), "alert list");
      }
      const alerts = await listAlerts({ clientIds: auth.clientScope === "all" ? null : auth.clientIds, statuses, wallId, moduleId, limit: url.searchParams.get("limit") });
      sendJson(res, 200, { generatedAt: new Date().toISOString(), counts: { open: alerts.filter((item) => item.status === "open").length, acknowledged: alerts.filter((item) => item.status === "acknowledged").length, resolved: alerts.filter((item) => item.status === "resolved").length, total: alerts.length }, alerts });
      return;
    }

    const telemetryAlertMatch = pathname.match(/^\/api\/telemetry\/alerts\/([^/]+)$/);
    if (req.method === "PUT" && telemetryAlertMatch) {
      requirePermission(auth, "telemetry.alerts.write");
      const alertId = decodeURIComponent(telemetryAlertMatch[1]);
      const visible = await listAlerts({ clientIds: auth.clientScope === "all" ? null : auth.clientIds, limit: 500 });
      const existing = visible.find((item) => item.id === alertId);
      if (!existing) throw validationError("alert not found", "ALERT_NOT_FOUND");
      const input = await readJsonBody(req);
      const alert = await updateAlert(alertId, input);
      const event = normalizeOpsEvent({ type: `telemetry.alert.${alert.status}`, actor: auth.name, entityType: "telemetry-alert", entityId: alert.id, clientId: alert.clientId, wallId: alert.wallId, source: "telemetry-alerts", note: `Alert ${alert.id} marked ${alert.status}.`, payload: { principalId: auth.id, status: alert.status, resolutionNote: alert.resolutionNote } });
      await appendOpsEvent(event);
      sendJson(res, 200, { alert, event });
      return;
    }

    if (req.method === "GET" && pathname === "/api/ai/visual-diagnoses") {
      requirePermission(auth, "ai.diagnosis.read");
      const url = new URL(req.url, `http://${host}:${port}`);
      const wallId = url.searchParams.get("wallId");
      const moduleId = url.searchParams.get("moduleId");
      const statuses = (url.searchParams.get("statuses") || "").split(",").filter(Boolean);
      if (wallId) {
        const resolveEntityClientId = await buildEntityClientResolver();
        requireClientAccess(auth, resolveEntityClientId("wall", wallId), "AI diagnosis list");
      }
      sendJson(res, 200, { generatedAt: new Date().toISOString(), diagnoses: await listVisualDiagnoses({ clientIds: auth.clientScope === "all" ? null : auth.clientIds, statuses, wallId, moduleId, limit: url.searchParams.get("limit") }) });
      return;
    }

    if (req.method === "POST" && pathname === "/api/ai/visual-diagnoses") {
      requirePermission(auth, "ai.diagnosis.request");
      const input = await readJsonBody(req);
      const capture = await readDeviceCameraCapture(input.captureId);
      if (!capture) throw validationError("AI diagnosis references an unknown camera capture", "AI_CAPTURE_NOT_FOUND");
      requireClientAccess(auth, capture.clientId, "AI diagnosis request");
      const result = await createVisualDiagnosis({ ...input, clientId: capture.clientId, wallId: capture.wallId, moduleId: capture.moduleId, captureId: capture.id, requestedBy: auth.id });
      const event = result.duplicate ? null : normalizeOpsEvent({ type: "ai.visual-diagnosis.queued", actor: auth.name, entityType: "ai-visual-diagnosis", entityId: result.diagnosis.id, clientId: result.diagnosis.clientId, wallId: result.diagnosis.wallId, source: "ai-vision-port", note: `AI visual diagnosis ${result.diagnosis.id} queued for capture ${capture.id}.`, payload: { principalId: auth.id, captureId: capture.id, moduleId: capture.moduleId, status: result.diagnosis.status } });
      if (event) await appendOpsEvent(event);
      sendJson(res, result.duplicate ? 200 : 201, { ...result, event });
      return;
    }

    const aiDiagnosisMatch = pathname.match(/^\/api\/ai\/visual-diagnoses\/([^/]+)$/);
    if (req.method === "PUT" && aiDiagnosisMatch) {
      requirePermission(auth, "ai.diagnosis.write");
      const diagnosisId = decodeURIComponent(aiDiagnosisMatch[1]);
      const visible = await listVisualDiagnoses({ clientIds: auth.clientScope === "all" ? null : auth.clientIds, limit: 500 });
      const existing = visible.find((item) => item.id === diagnosisId);
      if (!existing) throw validationError("AI diagnosis not found", "AI_DIAGNOSIS_NOT_FOUND");
      const diagnosis = await updateVisualDiagnosis(diagnosisId, await readJsonBody(req));
      const event = normalizeOpsEvent({ type: `ai.visual-diagnosis.${diagnosis.status}`, actor: auth.name, entityType: "ai-visual-diagnosis", entityId: diagnosis.id, clientId: diagnosis.clientId, wallId: diagnosis.wallId, source: "ai-vision-port", note: `AI visual diagnosis ${diagnosis.id} is ${diagnosis.status}.`, payload: { principalId: auth.id, provider: diagnosis.provider, model: diagnosis.model, confidence: diagnosis.confidence } });
      await appendOpsEvent(event);
      sendJson(res, 200, { diagnosis, event });
      return;
    }

    if (req.method === "POST" && pathname === "/api/telemetry/sensor-readings") {
      requirePermission(auth, "telemetry.write");
      const input = await readJsonBody(req);
      const resolveEntityClientId = await buildEntityClientResolver();
      const clientId = resolveEntityClientId("wall", input.wallId);
      if (!clientId) throw validationError("telemetry reading references an unknown wall", "TELEMETRY_UNKNOWN_WALL");
      requireClientAccess(auth, clientId, "sensor reading ingestion");
      if (input.moduleId) {
        const module = (await listModules({ wallId: input.wallId })).find((item) => item.id === input.moduleId);
        if (!module) throw validationError("telemetry reading references an unknown module for this wall", "TELEMETRY_UNKNOWN_MODULE");
      }
      const result = await appendSensorReading(input);
      const alerts = result.duplicate ? [] : await evaluateTelemetryAlerts(result.reading, clientId);
      const event = result.duplicate ? null : normalizeOpsEvent({ type: "telemetry.sensor.ingested", actor: auth.name, entityType: "sensor", entityId: result.reading.sensorId, clientId, wallId: result.reading.wallId, source: "telemetry-gateway", note: `Sensor ${result.reading.sensorId} reading ingested into append-only history.`, payload: { principalId: auth.id, readingId: result.reading.id, observedAt: result.reading.observedAt, status: result.reading.status } });
      if (event) await appendOpsEvent(event);
      for (const alertResult of alerts.filter((item) => item.created)) await appendOpsEvent(normalizeOpsEvent({ type: "telemetry.alert.opened", actor: auth.name, entityType: "telemetry-alert", entityId: alertResult.alert.id, clientId: alertResult.alert.clientId, wallId: alertResult.alert.wallId, source: "telemetry-alerts", note: alertResult.alert.reason, payload: { principalId: auth.id, ruleId: alertResult.alert.ruleId, severity: alertResult.alert.severity, moduleId: alertResult.alert.moduleId } }));
      sendJson(res, result.duplicate ? 200 : 201, { ...result, alerts, event });
      return;
    }

    const healthScoreMatch = pathname.match(/^\/api\/telemetry\/health-scores\/([^/]+)\/recompute$/);
    if (req.method === "POST" && healthScoreMatch) {
      requirePermission(auth, "telemetry.health.read");
      const wallId = decodeURIComponent(healthScoreMatch[1]);
      const resolveEntityClientId = await buildEntityClientResolver();
      const clientId = resolveEntityClientId("wall", wallId);
      requireClientAccess(auth, clientId, "sensor stability score");
      const score = await calculateSensorStability(wallId);
      sendJson(res, 200, { generatedAt: new Date().toISOString(), score });
      return;
    }

    if (req.method === "GET" && pathname === "/api/auth/context") {
      sendJson(res, 200, {
        generatedAt: new Date().toISOString(),
        auth
      });
      return;
    }

    if (req.method === "GET" && pathname === "/api/auth/policy") {
      requirePermission(auth, "auth.policy.read");
      sendJson(res, 200, {
        generatedAt: new Date().toISOString(),
        ...authPolicySummary()
      });
      return;
    }

    if (req.method === "GET" && pathname === "/api/field-service/cycles") {
      requirePermission(auth, "ops.events.read");
      const url = new URL(req.url, `http://${host}:${port}`);
      const cycles = await listFieldServiceCycles({ clientIds: auth.clientScope === "all" ? null : auth.clientIds, limit: url.searchParams.get("limit") || 500 });
      sendJson(res, 200, { generatedAt: new Date().toISOString(), cycles, gate: validateFieldCycleEvidence({ cycles }) });
      return;
    }

    if (req.method === "POST" && pathname === "/api/admin/field-service/cycles/import") {
      requirePermission(auth, "master.data.import");
      const input = await readJsonBody(req, 2 * 1024 * 1024);
      let cycles = input.cycles;
      if (typeof input.csv === "string") {
        const imported = normalizeFieldCycleCsv(input.csv);
        if (imported.errors.length) {
          const error = apiError(409, "field-cycle CSV contains invalid rows", "FIELD_CYCLE_IMPORT_HAS_ERRORS");
          error.details = { errors: imported.errors };
          throw error;
        }
        cycles = imported.cycles;
      }
      if (!Array.isArray(cycles) || !cycles.length) throw validationError("field-cycle import requires a non-empty cycles array or CSV", "FIELD_CYCLE_IMPORT_EMPTY");
      for (const cycle of cycles) requireClientAccess(auth, cycle.clientId, "field-cycle import");
      const result = await importFieldServiceCycles({ cycles, actorId: auth.id });
      const event = normalizeOpsEvent({ type: "field.service.cycles.imported", actor: auth.name, entityType: "field-service-cycles", entityId: `batch-${Date.now()}`, source: "field-service-import", note: `${result.total} customer field-service cycle(s) imported.`, payload: { principalId: auth.id, backend: result.backend, inserted: result.inserted, updated: result.updated, gateStatus: result.gate.status } });
      await appendOpsEvent(event);
      sendJson(res, 201, { ...result, event });
      return;
    }

    if (req.method === "GET" && pathname === "/api/mobile/reminders") {
      requirePermission(auth, "mobile.reminders.read");
      const includeCompleted = new URL(req.url, `http://${host}:${port}`).searchParams.get("includeCompleted") === "true";
      sendJson(res, 200, { generatedAt: new Date().toISOString(), ...(await buildMobileReminders(auth, includeCompleted)) });
      return;
    }

    if (req.method === "POST" && pathname === "/api/mobile/reminder-actions") {
      requirePermission(auth, "mobile.reminders.write");
      const input = await readJsonBody(req);
      if (input.clientId) requireClientAccess(auth, input.clientId, "mobile reminder action");
      const result = await saveReminderAction({ ...input, actorId: input.actorId || auth.id });
      if (result.action.workorderId && result.action.status === "completed") {
        const assignment = await readWorkforceAssignment("work-order", result.action.workorderId);
        if (assignment && (auth.roleId !== "field-tech" || assignment.technicianId === auth.id)) await upsertWorkforceAssignment({ ...assignment, status: "completed", assignedBy: auth.id });
      }
      const event = normalizeOpsEvent({
        type: `mobile.reminder.${result.action.status}`,
        actor: auth.name,
        entityType: "mobile-reminder",
        entityId: result.action.reminderId,
        clientId: result.action.clientId,
        wallId: result.action.wallId,
        source: "technician-mobile",
        note: result.action.note || `Mobile reminder ${result.action.reminderId} marked ${result.action.status}.`,
        payload: { principalId: auth.id, actionType: result.action.actionType, captureBatchId: result.action.captureBatchId }
      });
      await appendOpsEvent(event);
      sendJson(res, result.duplicate ? 200 : 201, { ...result, event });
      return;
    }

    if (req.method === "GET" && pathname === "/api/mobile/remediation-tasks") {
      requirePermission(auth, "mobile.remediation.read");
      const statuses = new URL(req.url, `http://${host}:${port}`).searchParams.get("statuses")?.split(",") || ["open", "assigned", "in_progress"];
      sendJson(res, 200, { generatedAt: new Date().toISOString(), tasks: await buildMobileRemediationTasks(auth, statuses) });
      return;
    }

    const mobileRemediationTaskMatch = pathname.match(/^\/api\/mobile\/remediation-tasks\/([^/]+)$/);
    if (req.method === "PATCH" && mobileRemediationTaskMatch) {
      requirePermission(auth, "mobile.remediation.update");
      const taskId = decodeURIComponent(mobileRemediationTaskMatch[1]);
      const existing = await readRemediationTask(taskId);
      if (!existing) throw apiError(404, "remediation task not found", "MOBILE_REMEDIATION_TASK_NOT_FOUND");
      requireClientAccess(auth, existing.clientId, "mobile remediation task update");
      if (auth.roleId === "field-tech" && existing.assignedTo !== auth.id) throw apiError(403, "field technician is not assigned to this remediation task", "MOBILE_REMEDIATION_ASSIGNMENT_DENIED");
      const input = await readJsonBody(req);
      if (input.status === "resolved" || input.reviewDecision) throw apiError(403, "technicians must submit completion evidence for independent FM review", "MOBILE_REMEDIATION_REVIEW_REQUIRED");
      const result = await updateRemediationTask(taskId, { ...input, updatedBy: auth.id, assignedTo: auth.roleId === "field-tech" ? auth.id : input.assignedTo, acceptedBy: input.status === "in_progress" ? auth.id : undefined, submittedBy: input.submitForReview === true ? auth.id : undefined });
      await syncRemediationWorkforceAssignment(result.task, auth);
      const eventType = input.submitForReview === true ? "remediation.task.review-submitted" : `remediation.task.${result.task.status}`;
      const event = normalizeOpsEvent({ type: eventType, actor: auth.name, entityType: "remediation-task", entityId: result.task.id, clientId: result.task.clientId, wallId: result.task.wallId, source: "technician-mobile", note: result.task.resolutionNote || `Remediation task ${result.task.id} moved to ${result.task.status} from mobile.`, payload: { principalId: auth.id, previousStatus: existing.status, nextStatus: result.task.status, reviewStatus: result.task.reviewStatus, assignedTo: result.task.assignedTo, acceptedBy: result.task.acceptedBy, submittedBy: result.task.submittedBy, evidenceRef: result.task.evidenceRef, channel: "technician-mobile" } });
      await appendOpsEvent(event);
      sendJson(res, 200, { ...result, event });
      return;
    }

    if (req.method === "GET" && pathname === "/api/admin/master-data") {
      requirePermission(auth, "master.data.read");
      const [clients, walls, workorders, sensorData, modules, devices, alertRules, commissioning] = await Promise.all([readJsonData("clients"), readJsonData("walls"), readJsonData("workorders"), readJsonData("sensors"), listModules(), listDevices(), listAlertRules({ clientIds: auth.clientScope === "all" ? null : auth.clientIds }), commissioningOverviewFor(auth)]);
      const scopedClients = filterByClientScope(auth, clients, (client) => client.id);
      const clientIds = new Set(scopedClients.map((client) => client.id));
      sendJson(res, 200, {
        generatedAt: new Date().toISOString(),
        clients: scopedClients,
        assets: walls.filter((asset) => clientIds.has(asset.clientId)),
        workorders: workorders.filter((order) => clientIds.has(walls.find((asset) => asset.id === order.wallId)?.clientId)),
        sensors: (sensorData.readings || []).filter((sensor) => clientIds.has(walls.find((asset) => asset.id === sensor.wallId)?.clientId)),
        modules: modules.filter((module) => clientIds.has(module.clientId)),
        devices: devices.filter((device) => clientIds.has(device.clientId)),
        alertRules: alertRules.filter((rule) => !rule.clientId || clientIds.has(rule.clientId)),
        commissioning: { records: commissioning.records.filter((record) => clientIds.has(record.clientId)), summary: commissioning.summary }
      });
      return;
    }

    const moduleAdminMatch = pathname.match(/^\/api\/admin\/master-data\/modules\/([^/]+)$/);
    if (req.method === "PUT" && moduleAdminMatch) {
      requirePermission(auth, "master.data.write");
      const input = { ...(await readJsonBody(req)), id: decodeURIComponent(moduleAdminMatch[1]) };
      requireClientAccess(auth, input.clientId, "module upsert");
      const module = await upsertModule(input);
      const event = normalizeOpsEvent({ type: "master-data.module.upserted", actor: auth.name, entityType: "module", entityId: module.id, clientId: module.clientId, wallId: module.assetId, source: "master-data-admin", note: `Module ${module.label} upserted through admin API.`, payload: { principalId: auth.id } });
      await appendOpsEvent(event);
      sendJson(res, 200, { module, event });
      return;
    }

    if (req.method === "GET" && pathname === "/api/admin/master-data/validate") {
      requirePermission(auth, "master.data.validate");
      sendJson(res, 200, {
        generatedAt: new Date().toISOString(),
        masterData: await readMasterDataHealth()
      });
      return;
    }

    if (req.method === "POST" && pathname === "/api/admin/master-data/import") {
      requirePermission(auth, "master.data.import");
      const masterData = await importMasterData();
      const event = normalizeOpsEvent({
        type: "master-data.imported",
        actor: auth.name,
        entityType: "master-data",
        entityId: "json-seed",
        source: "master-data-admin",
        note: "Master data imported from JSON seed files into SQLite tables.",
        payload: {
          principalId: auth.id,
          counts: masterData.counts
        }
      });
      await appendOpsEvent(event);
      sendJson(res, 200, {
        masterData,
        event
      });
      return;
    }

    const clientAdminMatch = pathname.match(/^\/api\/admin\/master-data\/clients\/([^/]+)$/);
    if (req.method === "PUT" && clientAdminMatch) {
      requirePermission(auth, "master.data.write");
      const input = {
        ...(await readJsonBody(req)),
        id: decodeURIComponent(clientAdminMatch[1])
      };
      requireClientAccess(auth, input.id, "client upsert");
      const client = await upsertMasterDataClient(input);
      const event = normalizeOpsEvent({
        type: "master-data.client.upserted",
        actor: auth.name,
        entityType: "client",
        entityId: client.id,
        clientId: client.id,
        source: "master-data-admin",
        note: `Client ${client.name} upserted through admin API.`,
        payload: { principalId: auth.id }
      });
      await appendOpsEvent(event);
      sendJson(res, 200, { client, event });
      return;
    }

    const assetAdminMatch = pathname.match(/^\/api\/admin\/master-data\/living-assets\/([^/]+)$/);
    if (req.method === "PUT" && assetAdminMatch) {
      requirePermission(auth, "master.data.write");
      const input = {
        ...(await readJsonBody(req)),
        id: decodeURIComponent(assetAdminMatch[1])
      };
      requireClientAccess(auth, input.clientId, "living asset upsert");
      const asset = await upsertMasterDataLivingAsset(input);
      const event = normalizeOpsEvent({
        type: "master-data.asset.upserted",
        actor: auth.name,
        entityType: "wall",
        entityId: asset.id,
        clientId: asset.clientId,
        wallId: asset.id,
        source: "master-data-admin",
        note: `Living asset ${asset.name} upserted through admin API.`,
        payload: { principalId: auth.id }
      });
      await appendOpsEvent(event);
      sendJson(res, 200, { asset, event });
      return;
    }

    const workOrderAdminMatch = pathname.match(/^\/api\/admin\/master-data\/work-orders\/([^/]+)$/);
    if (req.method === "PUT" && workOrderAdminMatch) {
      requirePermission(auth, "master.data.write");
      const input = {
        ...(await readJsonBody(req)),
        id: decodeURIComponent(workOrderAdminMatch[1])
      };
      const resolveEntityClientId = await buildEntityClientResolver();
      const clientId = resolveEntityClientId("wall", input.wallId);
      requireClientAccess(auth, clientId, "work order upsert");
      const workOrder = await upsertMasterDataWorkOrder(input);
      const event = normalizeOpsEvent({
        type: "master-data.workorder.upserted",
        actor: auth.name,
        entityType: "workorder",
        entityId: workOrder.id,
        clientId,
        wallId: workOrder.wallId,
        source: "master-data-admin",
        note: `Work order ${workOrder.id} upserted through admin API.`,
        payload: { principalId: auth.id }
      });
      await appendOpsEvent(event);
      sendJson(res, 200, { workOrder, event });
      return;
    }

    const sensorAdminMatch = pathname.match(/^\/api\/admin\/master-data\/sensor-readings\/([^/]+)$/);
    if (req.method === "PUT" && sensorAdminMatch) {
      requirePermission(auth, "master.data.write");
      const input = {
        ...(await readJsonBody(req)),
        id: decodeURIComponent(sensorAdminMatch[1])
      };
      const resolveEntityClientId = await buildEntityClientResolver();
      const clientId = resolveEntityClientId("wall", input.wallId);
      requireClientAccess(auth, clientId, "sensor reading upsert");
      const sensor = await upsertMasterDataSensorReading(input);
      const event = normalizeOpsEvent({
        type: "master-data.sensor.upserted",
        actor: auth.name,
        entityType: "sensor",
        entityId: sensor.id,
        clientId,
        wallId: sensor.wallId,
        source: "master-data-admin",
        note: `Sensor reading ${sensor.id} upserted through admin API.`,
        payload: { principalId: auth.id }
      });
      await appendOpsEvent(event);
      sendJson(res, 200, { sensor, event });
      return;
    }

    if (req.method === "GET" && pathname === "/api/admin/imports/maintenance/template.csv") {
      requirePermission(auth, "master.data.write");
      sendCsv(res, "dr-forest-airtable-maintenance-template.csv", maintenanceImportTemplateCsv());
      return;
    }

    if (req.method === "GET" && pathname === "/api/admin/imports/field-service/template.csv") {
      requirePermission(auth, "master.data.import");
      sendCsv(res, "dr-forest-airtable-field-service-template.csv", "cycle_id,client_id,work_order_id,module_id,technician_id,service_at,status,duration_minutes,proof_refs,outcome,notes\n");
      return;
    }

    if (req.method === "POST" && pathname === "/api/admin/field-service/cycles/preview") {
      requirePermission(auth, "master.data.import");
      const input = await readJsonBody(req, 2 * 1024 * 1024);
      const filename = String(input.filename || "airtable-field-service.csv").trim();
      if (!filename.toLowerCase().endsWith(".csv")) throw validationError("field-service import filename must end with .csv", "FIELD_CYCLE_IMPORT_FILE_INVALID");
      let normalized;
      try {
        normalized = normalizeFieldCycleCsv(input.csv);
        for (const cycle of normalized.cycles) requireClientAccess(auth, cycle.clientId, "field-service import preview");
      } catch (error) {
        if (error.status) throw error;
        throw validationError(error.message, "FIELD_CYCLE_IMPORT_PARSE_FAILED");
      }
      sendJson(res, 200, { filename, ...normalized, gate: validateFieldCycleEvidence({ cycles: normalized.cycles }) });
      return;
    }

    if (req.method === "GET" && pathname === "/api/admin/imports/maintenance") {
      requirePermission(auth, "master.data.write");
      const url = new URL(req.url, `http://${host}:${port}`);
      sendJson(res, 200, { generatedAt: new Date().toISOString(), batches: await listMaintenanceImports(url.searchParams.get("limit")) });
      return;
    }

    if (req.method === "POST" && pathname === "/api/admin/imports/maintenance/preview") {
      requirePermission(auth, "master.data.write");
      const input = await readJsonBody(req, 1024 * 1024);
      const filename = String(input.filename || "airtable-maintenance.csv").trim();
      if (!filename.toLowerCase().endsWith(".csv")) throw validationError("maintenance import filename must end with .csv", "MAINTENANCE_IMPORT_FILE_INVALID");
      let normalized;
      try {
        const dataset = await readMasterDataDataset();
        normalized = normalizeMaintenanceCsv(input.csv, { knownWallIds: dataset.walls.map((wall) => wall.id) });
        const clientByWall = new Map(dataset.walls.map((wall) => [wall.id, wall.clientId]));
        for (const row of normalized.rows) requireClientAccess(auth, clientByWall.get(row.workOrder.wallId), "maintenance import preview");
        const staleConflicts = findStaleMaintenanceImportRows(normalized.rows, dataset.workorders);
        if (staleConflicts.length) {
          const staleIds = new Set(staleConflicts.map((conflict) => conflict.workOrderId));
          normalized.rows = normalized.rows.filter((row) => !staleIds.has(row.workOrder.id));
          normalized.errors = [...normalized.errors, ...staleConflicts.map((conflict) => ({ rowNumber: conflict.rowNumber, recordId: conflict.recordId, messages: [conflict.message] }))];
          normalized.validRows -= staleConflicts.length;
          normalized.invalidRows += staleConflicts.length;
        }
      } catch (error) {
        if (error.status) throw error;
        throw validationError(error.message, "MAINTENANCE_IMPORT_PARSE_FAILED");
      }
      const result = await createMaintenanceImport({ source: "airtable-csv", sourceFilename: filename, checksum: normalized.checksum, rowCount: normalized.totalRows, validCount: normalized.validRows, invalidCount: normalized.invalidRows, rows: normalized.rows, errors: normalized.errors, createdBy: auth.id });
      sendJson(res, result.duplicate ? 200 : 201, { duplicate: result.duplicate, batch: result.batch });
      return;
    }

    const maintenanceImportApplyMatch = pathname.match(/^\/api\/admin\/imports\/maintenance\/([^/]+)\/apply$/);
    if (req.method === "POST" && maintenanceImportApplyMatch) {
      requirePermission(auth, "master.data.write");
      const batchId = decodeURIComponent(maintenanceImportApplyMatch[1]);
      const batch = await readMaintenanceImport(batchId);
      if (!batch) throw apiError(404, "maintenance import batch not found", "MAINTENANCE_IMPORT_NOT_FOUND");
      if (batch.status === "applied") { sendJson(res, 200, { duplicate: true, imported: batch.validCount, batch }); return; }
      if (batch.invalidCount > 0) throw apiError(409, "maintenance import contains invalid rows and cannot be applied", "MAINTENANCE_IMPORT_HAS_ERRORS");
      const ownerId = `${auth.id}:${randomUUID()}`;
      const lease = await acquireJobLease({ jobName: `maintenance-import:${batchId}`, ownerId, leaseSeconds: 300 });
      if (!lease.acquired) throw apiError(409, "maintenance import is already being applied", "MAINTENANCE_IMPORT_BUSY");
      try {
        const dataset = await readMasterDataDataset();
        const clientByWall = new Map(dataset.walls.map((wall) => [wall.id, wall.clientId]));
        for (const row of batch.rows) {
          const clientId = clientByWall.get(row.workOrder.wallId);
          if (!clientId) throw validationError(`wall ${row.workOrder.wallId} no longer exists`, "MAINTENANCE_IMPORT_WALL_REMOVED");
          requireClientAccess(auth, clientId, "maintenance import apply");
        }
        const workOrderIds = batch.rows.map((row) => row.workOrder.id);
        const event = normalizeOpsEvent({ id: `OPS-MAINT-IMPORT-${batchId}`, type: "maintenance.import.applied", actor: auth.name, entityType: "maintenance-import", entityId: batchId, source: "airtable-csv", note: `${workOrderIds.length} Airtable maintenance row(s) imported into work orders.`, payload: { principalId: auth.id, checksum: batch.checksum, imported: workOrderIds.length, sourceFilename: batch.sourceFilename, workOrderIds } });
        const applied = await applyMaintenanceImport({ batchId, appliedBy: auth.id, event });
        sendJson(res, 200, applied);
      } finally {
        await releaseJobLease({ jobName: `maintenance-import:${batchId}`, ownerId }).catch(() => {});
      }
      return;
    }

    if (req.method === "GET" && pathname === "/api/maintenance/plans") {
      requirePermission(auth, "maintenance.plan.read");
      await ensurePilotMaintenancePlans();
      const url = new URL(req.url, `http://${host}:${port}`);
      const plans = await listMaintenancePlans({ status: url.searchParams.get("status") || null, dueBefore: url.searchParams.get("dueBefore") || null, clientIds: auth.clientScope === "all" ? null : auth.clientIds, limit: url.searchParams.get("limit") || 500 });
      sendJson(res, 200, { generatedAt: new Date().toISOString(), plans });
      return;
    }

    if (req.method === "POST" && pathname === "/api/maintenance/plans") {
      requirePermission(auth, "maintenance.plan.write");
      const input = await readJsonBody(req);
      const walls = await readJsonData("walls");
      const wall = walls.find((item) => item.id === input.wallId);
      if (!wall) throw apiError(404, "maintenance plan asset not found", "MAINTENANCE_PLAN_ASSET_NOT_FOUND");
      requireClientAccess(auth, wall.clientId, "maintenance plan");
      if (input.clientId && input.clientId !== wall.clientId) throw validationError("maintenance plan client and asset do not match", "MAINTENANCE_PLAN_SCOPE_MISMATCH");
      const result = await upsertMaintenancePlan({ ...input, clientId: wall.clientId, createdBy: auth.id, updatedBy: auth.id, source: input.source || "manual" });
      const event = normalizeOpsEvent({ type: result.created ? "maintenance.plan.created" : "maintenance.plan.updated", actor: auth.name, entityType: "maintenance-plan", entityId: result.plan.id, clientId: result.plan.clientId, wallId: result.plan.wallId, source: "maintenance-planning", note: `${result.plan.serviceType} every ${result.plan.cadenceDays} day(s), next due ${result.plan.nextDueDate}.`, payload: { principalId: auth.id, cadenceDays: result.plan.cadenceDays, nextDueDate: result.plan.nextDueDate, durationMinutes: result.plan.durationMinutes, status: result.plan.status } });
      await appendOpsEvent(event);
      sendJson(res, result.created ? 201 : 200, { ...result, event });
      return;
    }

    if (req.method === "GET" && pathname === "/api/maintenance/calendar") {
      requirePermission(auth, "maintenance.plan.read");
      const url = new URL(req.url, `http://${host}:${port}`);
      const fromDate = dateOnly(serviceDateFor(url.searchParams.get("fromDate") || hongKongDate()), "fromDate");
      const throughDate = dateOnly(serviceDateFor(url.searchParams.get("throughDate") || addDays(fromDate, 30)), "throughDate");
      sendJson(res, 200, await buildMaintenanceCalendar(auth, { fromDate, throughDate }));
      return;
    }

    if (req.method === "POST" && pathname === "/api/maintenance/generate") {
      requirePermission(auth, "maintenance.generate");
      const input = await readJsonBody(req);
      const commandKey = String(req.headers["idempotency-key"] || "").trim();
      if (!commandKey) throw apiError(428, "Idempotency-Key header is required for maintenance generation", "IDEMPOTENCY_KEY_REQUIRED");
      const fromDate = dateOnly(serviceDateFor(input.fromDate || hongKongDate()), "fromDate");
      const throughDate = dateOnly(serviceDateFor(input.throughDate || addDays(fromDate, 30)), "throughDate");
      const commandPayload = { fromDate, throughDate };
      const requestHash = createHash("sha256").update(JSON.stringify(commandPayload)).digest("hex");
      const ownerId = `${auth.id}:${randomUUID()}`;
      const command = await beginIdempotentCommand({ scope: "maintenance-generation", commandKey, requestHash, ownerId, leaseSeconds: 300 });
      if (command.duplicate) { sendJson(res, 200, { ...command.response, duplicate: true }); return; }
      const lease = await acquireJobLease({ jobName: "maintenance-generation", ownerId, leaseSeconds: 300 });
      if (!lease.acquired) { await abandonIdempotentCommand({ scope: "maintenance-generation", commandKey, ownerId }).catch(() => {}); throw apiError(409, "maintenance generation is already running", "MAINTENANCE_GENERATION_BUSY"); }
      let reliabilityRun = null;
      try {
        reliabilityRun = (await beginReliabilityRun({ jobName: "maintenance-generation", ownerId, details: { fromDate, throughDate, trigger: "ops-api" } })).run;
        await ensurePilotMaintenancePlans();
        const result = await generateMaintenanceOccurrences({ fromDate, throughDate, actor: auth.id, runId: `MGR-${randomUUID()}`, clientIds: auth.clientScope === "all" ? null : auth.clientIds });
        const event = normalizeOpsEvent({ type: "maintenance.workorders.generated", actor: auth.name, entityType: "maintenance-generation", entityId: result.run.id, source: "maintenance-planning", note: `${result.run.generatedCount} preventive work order(s) generated through ${throughDate}.`, payload: { principalId: auth.id, fromDate, throughDate, generatedCount: result.run.generatedCount, skippedCount: result.run.skippedCount, workOrderIds: result.generated.slice(0, 100).map((item) => item.workOrderId) } });
        await appendOpsEvent(event);
        const response = { duplicate: false, ...result, event, calendar: await buildMaintenanceCalendar(auth, { fromDate, throughDate }) };
        await completeIdempotentCommand({ scope: "maintenance-generation", commandKey, ownerId, response });
        await finishReliabilityRun(reliabilityRun.id, { status: "succeeded", result: { generatedCount: result.run.generatedCount, skippedCount: result.run.skippedCount } });
        sendJson(res, 201, response);
      } catch (error) {
        if (reliabilityRun) await finishReliabilityRun(reliabilityRun.id, { status: "failed", error: error.message }).catch(() => {});
        await abandonIdempotentCommand({ scope: "maintenance-generation", commandKey, ownerId }).catch(() => {});
        throw error;
      } finally {
        await releaseJobLease({ jobName: "maintenance-generation", ownerId }).catch(() => {});
      }
      return;
    }

    if (req.method === "GET" && pathname === "/api/workforce/technicians") {
      requirePermission(auth, "workforce.read");
      const url = new URL(req.url, `http://${host}:${port}`);
      let technicians = await listTechnicians({ status: url.searchParams.get("status") || null });
      if (auth.roleId === "field-tech") technicians = technicians.filter((item) => item.id === auth.id);
      sendJson(res, 200, { generatedAt: new Date().toISOString(), technicians });
      return;
    }

    if (req.method === "POST" && pathname === "/api/workforce/technicians") {
      requirePermission(auth, "workforce.write");
      const input = await readJsonBody(req);
      const result = await upsertTechnician({ ...input, createdBy: auth.id, updatedBy: auth.id });
      const event = normalizeOpsEvent({ type: result.created ? "workforce.technician.created" : "workforce.technician.updated", actor: auth.name, entityType: "technician", entityId: result.technician.id, source: "ops-workforce", note: `${result.technician.displayName} workforce profile saved.`, payload: { principalId: auth.id, status: result.technician.status, skills: result.technician.skills, districts: result.technician.districts, maxDailyMinutes: result.technician.maxDailyMinutes } });
      await appendOpsEvent(event);
      sendJson(res, result.created ? 201 : 200, { ...result, event });
      return;
    }

    if (req.method === "GET" && pathname === "/api/workforce/assignments") {
      requirePermission(auth, "workforce.read");
      const url = new URL(req.url, `http://${host}:${port}`);
      const technicianId = auth.roleId === "field-tech" ? auth.id : (url.searchParams.get("technicianId") || null);
      const assignments = await listWorkforceAssignments({ technicianId, serviceDate: url.searchParams.get("serviceDate") || null, targetType: url.searchParams.get("targetType") || null, statuses: url.searchParams.get("statuses")?.split(",") || null, clientIds: auth.clientScope === "all" ? null : auth.clientIds, limit: url.searchParams.get("limit") || 500 });
      sendJson(res, 200, { generatedAt: new Date().toISOString(), assignments });
      return;
    }

    if (req.method === "GET" && pathname === "/api/workforce/candidates") {
      requirePermission(auth, "workforce.read");
      const url = new URL(req.url, `http://${host}:${port}`);
      const serviceDate = serviceDateFor(url.searchParams.get("serviceDate") || new Date());
      const taskIds = [...new Set((url.searchParams.get("taskIds") || "").split(",").map((item) => item.trim()).filter(Boolean))].slice(0, 100);
      const contexts = taskIds.length
        ? await Promise.all(taskIds.map((targetId) => resolveWorkforceTarget(auth, { targetType: "remediation-task", targetId, serviceDate })))
        : [{ targetType: "capacity-preview", targetId: `preview:${serviceDate}`, technicianId: "candidate", clientId: "*", wallId: "*", serviceDate, scheduledStart: null, estimatedMinutes: 60, requiredSkills: ["plant-care"], district: "*", status: "planned", assignedBy: auth.id }];
      const evaluations = await Promise.all(contexts.map((context) => evaluateWorkforceCandidates(context)));
      const technicians = await listTechnicians();
      const candidates = technicians.map((technician) => {
        const taskResults = contexts.map((context, index) => {
          const result = evaluations[index].find((item) => item.technician.id === technician.id);
          return { targetId: context.targetId, eligible: Boolean(result?.eligible), reasons: result?.reasons || ["technician is unavailable"], estimatedMinutes: context.estimatedMinutes };
        });
        const base = evaluations[0]?.find((item) => item.technician.id === technician.id);
        const requestedMinutes = contexts.reduce((sum, item) => sum + Number(item.estimatedMinutes || 0), 0);
        const allocatedMinutes = Number(base?.workload?.allocatedMinutes || 0);
        const capacityExceeded = allocatedMinutes + requestedMinutes > technician.maxDailyMinutes;
        const reasons = taskResults.flatMap((item) => item.reasons.map((reason) => `${item.targetId}: ${reason}`));
        if (capacityExceeded) reasons.push(`batch capacity exceeded by ${allocatedMinutes + requestedMinutes - technician.maxDailyMinutes} minutes`);
        return { technician, eligible: taskResults.every((item) => item.eligible) && !capacityExceeded, reasons: [...new Set(reasons)], taskResults, workload: { serviceDate, assignmentCount: Number(base?.workload?.assignmentCount || 0), allocatedMinutes, requestedMinutes, projectedMinutes: allocatedMinutes + requestedMinutes, remainingMinutes: Math.max(0, technician.maxDailyMinutes - allocatedMinutes), maxDailyMinutes: technician.maxDailyMinutes } };
      });
      sendJson(res, 200, { generatedAt: new Date().toISOString(), serviceDate, taskIds, candidates, summary: { technicians: candidates.length, eligible: candidates.filter((item) => item.eligible).length, requestedMinutes: contexts.reduce((sum, item) => sum + Number(item.estimatedMinutes || 0), 0) } });
      return;
    }

    if (req.method === "POST" && pathname === "/api/workforce/assignments") {
      requirePermission(auth, "workforce.assign");
      const input = await readJsonBody(req);
      const context = await resolveWorkforceTarget(auth, { ...input, assignedBy: auth.id });
      if (!["completed", "cancelled"].includes(context.status)) await assertEligibleWorkforceAssignment(context);
      const result = await upsertWorkforceAssignment(context);
      const event = normalizeOpsEvent({ type: result.created ? "workforce.assignment.created" : "workforce.assignment.updated", actor: auth.name, entityType: context.targetType, entityId: context.targetId, clientId: context.clientId, wallId: context.wallId, source: "ops-workforce", note: `${context.targetId} assigned to ${context.technicianId}.`, payload: { principalId: auth.id, technicianId: context.technicianId, serviceDate: context.serviceDate, scheduledStart: context.scheduledStart, estimatedMinutes: context.estimatedMinutes, requiredSkills: context.requiredSkills, district: context.district, status: context.status } });
      await appendOpsEvent(event);
      sendJson(res, result.created ? 201 : 200, { ...result, event });
      return;
    }

    if (req.method === "GET" && pathname === "/api/service-contracts") {
      requirePermission(auth,"contracts.read");
      sendJson(res,200,await serviceContractOverviewFor(auth));
      return;
    }

    if (req.method === "GET" && pathname === "/api/service-contracts/performance") {
      requirePermission(auth,"contracts.read");
      const url=new URL(req.url,`http://${host}:${port}`);
      sendJson(res,200,await readServiceContractPerformance({clientIds:auth.clientScope==="all"?null:auth.clientIds,from:url.searchParams.get("from")||undefined,through:url.searchParams.get("through")||undefined,asOf:url.searchParams.get("asOf")||undefined}));
      return;
    }

    if (req.method === "GET" && pathname === "/api/service-contracts/changes") {
      requirePermission(auth,"contracts.read");
      const url=new URL(req.url,`http://${host}:${port}`);
      const statuses=url.searchParams.get("statuses")?.split(",").filter(Boolean)||null;
      const changes=await listServiceContractChanges({clientIds:auth.clientScope==="all"?null:auth.clientIds,contractId:url.searchParams.get("contractId")||null,statuses,limit:url.searchParams.get("limit")||500});
      sendJson(res,200,{generatedAt:new Date().toISOString(),changes:changes.map((item)=>serviceContractChangeForAuth(auth,item))});
      return;
    }

    if (req.method === "POST" && pathname === "/api/service-contracts") {
      requirePermission(auth,"contracts.write");
      const input=await readJsonBody(req); requireClientAccess(auth,String(input.clientId||""),"service contract create");
      const commandKey=String(req.headers["idempotency-key"]||"").trim();
      const response=await runIdempotentInventoryCommand({auth,scope:"service-contract-create",commandKey,payload:input,execute:async(requestHash)=>{const result=await createServiceContract({...input,id:`SVC-${requestHash.slice(0,20)}`,createdBy:auth.id});const event=normalizeOpsEvent({id:`OPS-SVC-${requestHash.slice(0,20)}`,type:"service-contract.created",actor:auth.name,entityType:"service-contract",entityId:result.contract.id,clientId:result.contract.clientId,source:"contract-control",note:`${result.contract.contractNumber} created as draft.`,payload:{principalId:auth.id,planName:result.contract.planName,wallIds:result.contract.wallIds,endDate:result.contract.endDate}});await appendOpsEvent(event);return{...result,event};}});
      sendJson(res,response.duplicate?200:201,response);return;
    }

    const serviceContractVersionMatch=pathname.match(/^\/api\/service-contracts\/([^/]+)\/versions$/);
    if(req.method==="GET"&&serviceContractVersionMatch){requirePermission(auth,"contracts.read");const contract=await readServiceContract(decodeURIComponent(serviceContractVersionMatch[1]));if(!contract)throw apiError(404,"service contract not found","SERVICE_CONTRACT_NOT_FOUND");requireClientAccess(auth,contract.clientId,"service contract versions");sendJson(res,200,{contract:serviceContractForAuth(auth,contract),versions:(await listServiceContractVersions(contract.id)).map((item)=>serviceContractVersionForAuth(auth,item))});return;}

    const serviceContractChangeMatch=pathname.match(/^\/api\/service-contracts\/([^/]+)\/changes$/);
    if(req.method==="POST"&&serviceContractChangeMatch){requirePermission(auth,"contracts.write");const contractId=decodeURIComponent(serviceContractChangeMatch[1]);const contract=await readServiceContract(contractId);if(!contract)throw apiError(404,"service contract not found","SERVICE_CONTRACT_NOT_FOUND");requireClientAccess(auth,contract.clientId,"service contract change request");const input=await readJsonBody(req);const commandKey=String(req.headers["idempotency-key"]||"").trim();const response=await runIdempotentInventoryCommand({auth,scope:`service-contract-change:${contractId}`,commandKey,payload:input,execute:async(requestHash)=>{const result=await requestServiceContractChange({...input,id:`CHG-${requestHash.slice(0,20)}`,contractId,requestedBy:auth.id});const event=normalizeOpsEvent({id:`OPS-SVC-CHG-${requestHash.slice(0,20)}`,type:"service-contract.change-requested",actor:auth.name,entityType:"service-contract",entityId:contractId,clientId:contract.clientId,source:"contract-control",note:result.change.note,payload:{principalId:auth.id,changeRequestId:result.change.id,requestType:result.change.requestType,baseVersionNo:result.change.baseVersionNo}});await appendOpsEvent(event);return{...result,event};}});sendJson(res,response.duplicate?200:201,response);return;}

    const serviceContractChangeReviewMatch=pathname.match(/^\/api\/service-contract-changes\/([^/]+)\/review$/);
    if(req.method==="POST"&&serviceContractChangeReviewMatch){requirePermission(auth,"contracts.write");const changeId=decodeURIComponent(serviceContractChangeReviewMatch[1]);const change=await readServiceContractChange(changeId);if(!change)throw apiError(404,"change request not found","SERVICE_CONTRACT_CHANGE_NOT_FOUND");const contract=await readServiceContract(change.contractId);if(!contract)throw apiError(404,"service contract not found","SERVICE_CONTRACT_NOT_FOUND");requireClientAccess(auth,contract.clientId,"service contract change review");const input=await readJsonBody(req);const commandKey=String(req.headers["idempotency-key"]||"").trim();const response=await runIdempotentInventoryCommand({auth,scope:`service-contract-change-review:${changeId}`,commandKey,payload:input,execute:async(requestHash)=>{const result=await reviewServiceContractChange(changeId,{...input,reviewedBy:auth.id});const event=normalizeOpsEvent({id:`OPS-SVC-CHG-REV-${requestHash.slice(0,20)}`,type:`service-contract.change-${input.decision}`,actor:auth.name,entityType:"service-contract",entityId:contract.id,clientId:contract.clientId,source:"contract-control",note:input.reviewNote,payload:{principalId:auth.id,changeRequestId:changeId,decision:input.decision,resultingVersionId:result.version?.id||null}});await appendOpsEvent(event);return{...result,event};}});sendJson(res,200,response);return;}

    const serviceContractEventsMatch=pathname.match(/^\/api\/service-contracts\/([^/]+)\/events$/);
    if(req.method==="GET"&&serviceContractEventsMatch){requirePermission(auth,"contracts.read");const contract=await readServiceContract(decodeURIComponent(serviceContractEventsMatch[1]));if(!contract)throw apiError(404,"service contract not found","SERVICE_CONTRACT_NOT_FOUND");requireClientAccess(auth,contract.clientId,"service contract events");sendJson(res,200,{contract:serviceContractForAuth(auth,contract),events:await listServiceContractEvents(contract.id)});return;}

    const serviceContractActionMatch=pathname.match(/^\/api\/service-contracts\/([^/]+)\/actions$/);
    if(req.method==="POST"&&serviceContractActionMatch){requirePermission(auth,"contracts.write");const contractId=decodeURIComponent(serviceContractActionMatch[1]);const existing=await readServiceContract(contractId);if(!existing)throw apiError(404,"service contract not found","SERVICE_CONTRACT_NOT_FOUND");requireClientAccess(auth,existing.clientId,"service contract action");const input=await readJsonBody(req);const commandKey=String(req.headers["idempotency-key"]||"").trim();const response=await runIdempotentInventoryCommand({auth,scope:`service-contract-action:${contractId}`,commandKey,payload:input,execute:async(requestHash)=>{const result=await actionServiceContract(contractId,{...input,actor:auth.id});const event=normalizeOpsEvent({id:`OPS-SVC-ACT-${requestHash.slice(0,20)}`,type:`service-contract.${input.action}`,actor:auth.name,entityType:"service-contract",entityId:contractId,clientId:existing.clientId,source:"contract-control",note:input.note,payload:{principalId:auth.id,previousStatus:existing.status,nextStatus:result.contract.status,effectiveState:result.contract.effectiveState}});await appendOpsEvent(event);return{...result,event};}});sendJson(res,200,response);return;}

    if (req.method === "GET" && (pathname === "/api/inventory/overview" || pathname === "/api/mobile/route-kit")) {
      requirePermission(auth, "inventory.read");
      sendJson(res, 200, await inventoryOverviewFor(auth));
      return;
    }

    if (req.method === "POST" && pathname === "/api/inventory/lots/receive") {
      requirePermission(auth, "inventory.write");
      await ensurePilotInventory();
      const input = await readJsonBody(req);
      const commandKey = String(req.headers["idempotency-key"] || "").trim();
      const response = await runIdempotentInventoryCommand({ auth, scope: "inventory-lot-receipt", commandKey, payload: input, execute: async (requestHash) => {
        const result = await receiveInventoryLot({ ...input, id: `LOT-${requestHash.slice(0, 20)}`, actor: auth.id });
        const event = normalizeOpsEvent({ id: `OPS-LOT-${requestHash.slice(0, 20)}`, type: "inventory.lot.received", actor: auth.name, entityType: "inventory-lot", entityId: result.lot.id, source: "inventory-control", note: `${result.lot.sku} lot ${result.lot.lotCode} received with expiry ${result.lot.expiryDate}.`, payload: { principalId: auth.id, locationId: input.locationId, supplier: result.lot.supplier, quantity: input.quantity, expiryDate: result.lot.expiryDate } });
        await appendOpsEvent(event);
        return { ...result, event };
      }});
      sendJson(res, response.duplicate ? 200 : 201, response);
      return;
    }

    if (req.method === "POST" && pathname === "/api/inventory/counts") {
      requirePermission(auth, "inventory.count");
      await ensurePilotInventory();
      const input = await readJsonBody(req);
      if (auth.roleId === "field-tech") {
        const overview = await inventoryOverviewFor(auth);
        const ownKit = overview.locations.find((item) => item.kind === "technician-kit" && item.technicianId === auth.id);
        if (!ownKit || input.locationId !== ownKit.id) throw apiError(403, "technician can count only their own route kit", "INVENTORY_TECHNICIAN_SCOPE_DENIED");
      }
      const commandKey = String(req.headers["idempotency-key"] || "").trim();
      const response = await runIdempotentInventoryCommand({ auth, scope: "inventory-stock-count", commandKey, payload: input, execute: async (requestHash) => {
        const result = await submitInventoryStockCount({ ...input, id: `CNT-${requestHash.slice(0, 20)}`, countedBy: auth.id, technicianId: auth.roleId === "field-tech" ? auth.id : null });
        const event = normalizeOpsEvent({ id: `OPS-CNT-${requestHash.slice(0, 20)}`, type: "inventory.count.submitted", actor: auth.name, entityType: "inventory-count", entityId: result.count.id, source: auth.roleId === "field-tech" ? "technician-mobile" : "inventory-control", note: `${result.count.lines.length} lot count line(s) submitted for independent review.`, payload: { principalId: auth.id, locationId: result.count.locationId, varianceLines: result.count.lines.filter((line) => line.variance !== 0).length } });
        await appendOpsEvent(event);
        return { ...result, event };
      }});
      sendJson(res, response.duplicate ? 200 : 201, response);
      return;
    }

    const inventoryCountReviewMatch = pathname.match(/^\/api\/inventory\/counts\/([^/]+)\/review$/);
    if (req.method === "POST" && inventoryCountReviewMatch) {
      requirePermission(auth, "inventory.review");
      const countId = decodeURIComponent(inventoryCountReviewMatch[1]);
      const input = await readJsonBody(req);
      const commandKey = String(req.headers["idempotency-key"] || "").trim();
      const response = await runIdempotentInventoryCommand({ auth, scope: `inventory-count-review:${countId}`, commandKey, payload: input, execute: async (requestHash) => {
        const result = await reviewInventoryStockCount(countId, { ...input, reviewedBy: auth.id });
        const event = normalizeOpsEvent({ id: `OPS-CNT-REV-${requestHash.slice(0, 20)}`, type: `inventory.count.${result.count.status}`, actor: auth.name, entityType: "inventory-count", entityId: result.count.id, source: "inventory-control", note: `Stock count ${result.count.id} ${result.count.status}: ${input.note}.`, payload: { principalId: auth.id, locationId: result.count.locationId, variance: result.count.lines.reduce((sum, line) => sum + Number(line.variance || 0), 0) } });
        await appendOpsEvent(event);
        return { ...result, event };
      }});
      sendJson(res, 200, response);
      return;
    }

    if (req.method === "POST" && pathname === "/api/inventory/transactions") {
      requirePermission(auth, "inventory.write");
      await ensurePilotInventory();
      const input = await readJsonBody(req);
      if (input.workOrderId) await assertInventoryWorkOrderAccess(auth, input.workOrderId, input.technicianId || null);
      const commandKey = String(req.headers["idempotency-key"] || "").trim();
      const response = await runIdempotentInventoryCommand({ auth, scope: "inventory-movement", commandKey, payload: input, execute: async (requestHash) => {
        const result = await applyInventoryMovement({ ...input, id: `INV-${requestHash.slice(0, 20)}`, actor: auth.id });
        const event = normalizeOpsEvent({ id: `OPS-INV-${requestHash.slice(0, 20)}`, type: `inventory.${input.type || "movement"}.recorded`, actor: auth.name, entityType: "inventory", entityId: result.transactions[0]?.groupId || result.transactions[0]?.id, source: "inventory-control", note: `${input.sku} ${input.type} recorded for ${input.quantity}.`, payload: { principalId: auth.id, sku: input.sku, quantity: input.quantity, transactionIds: result.transactions.map((item) => item.id) } });
        await appendOpsEvent(event);
        return { duplicate: result.duplicate, ...result, event };
      }});
      sendJson(res, response.duplicate ? 200 : 201, response);
      return;
    }

    if (req.method === "POST" && pathname === "/api/inventory/reservations") {
      requirePermission(auth, "inventory.reserve");
      await ensurePilotInventory();
      const input = await readJsonBody(req);
      const clientId = await assertInventoryWorkOrderAccess(auth, input.workOrderId, input.technicianId || null);
      const commandKey = String(req.headers["idempotency-key"] || "").trim();
      const response = await runIdempotentInventoryCommand({ auth, scope: "inventory-reservation", commandKey, payload: input, execute: async (requestHash) => {
        const result = await reserveInventory({ ...input, id: `RES-${requestHash.slice(0, 20)}`, actor: auth.id });
        const event = normalizeOpsEvent({ id: `OPS-RES-${requestHash.slice(0, 20)}`, type: "inventory.reserved", actor: auth.name, entityType: "workorder", entityId: input.workOrderId, clientId, source: "inventory-control", note: `${input.quantity} ${input.sku} reserved for ${input.workOrderId}.`, payload: { principalId: auth.id, reservationId: result.reservation.id, technicianId: input.technicianId || null, sourceLocationId: input.sourceLocationId } });
        await appendOpsEvent(event);
        return { duplicate: result.duplicate, ...result, event };
      }});
      sendJson(res, response.duplicate ? 200 : 201, response);
      return;
    }

    if (req.method === "POST" && pathname === "/api/inventory/consume") {
      requirePermission(auth, "inventory.consume");
      await ensurePilotInventory();
      const input = await readJsonBody(req);
      const technicianId = auth.roleId === "field-tech" ? auth.id : (input.technicianId || null);
      const clientId = await assertInventoryWorkOrderAccess(auth, input.workOrderId, technicianId);
      if (auth.roleId === "field-tech") {
        const overview = await inventoryOverviewFor(auth);
        const ownKit = overview.locations.find((item) => item.kind === "technician-kit" && item.technicianId === auth.id);
        if (!ownKit || input.locationId !== ownKit.id) throw apiError(403, "field consumption must use the technician's own route kit", "INVENTORY_TECHNICIAN_SCOPE_DENIED");
      }
      const commandKey = String(req.headers["idempotency-key"] || "").trim();
      const response = await runIdempotentInventoryCommand({ auth, scope: "inventory-consumption", commandKey, payload: input, execute: async (requestHash) => {
        const result = await consumeInventory({ ...input, id: `CON-${requestHash.slice(0, 20)}`, technicianId, actor: auth.id });
        const event = normalizeOpsEvent({ id: `OPS-CON-${requestHash.slice(0, 20)}`, type: "inventory.consumed", actor: auth.name, entityType: "workorder", entityId: input.workOrderId, clientId, source: "inventory-control", note: `${result.transactions.length} consumable line(s) posted to ${input.workOrderId}.`, payload: { principalId: auth.id, technicianId, locationId: input.locationId, transactionIds: result.transactions.map((item) => item.id) } });
        await appendOpsEvent(event);
        return { duplicate: result.duplicate, ...result, event };
      }});
      sendJson(res, response.duplicate ? 200 : 201, response);
      return;
    }

    if (req.method === "GET" && pathname === "/api/ops/reliability") {
      requirePermission(auth, "reliability.read");
      sendJson(res, 200, await readReliabilityOverview());
      return;
    }

    if (req.method === "POST" && pathname === "/api/ops/reliability/scan") {
      requirePermission(auth, "reliability.scan");
      const ownerId = `${auth.id}:${randomUUID()}`;
      const lease = await acquireJobLease({ jobName: "reliability-watchdog", ownerId, leaseSeconds: 120 });
      if (!lease.acquired) throw apiError(409, "reliability watchdog is already running", "RELIABILITY_SCAN_BUSY");
      let reliabilityRun = null;
      try {
        reliabilityRun = (await beginReliabilityRun({ jobName: "reliability-watchdog", ownerId, details: { trigger: "ops-api", principalId: auth.id } })).run;
        const first = await scanReliability();
        await finishReliabilityRun(reliabilityRun.id, { status: "succeeded", result: { opened: first.opened.length, recovered: first.recovered.length } });
        const second = await scanReliability();
        const transitions = [...first.opened, ...first.recovered, ...second.opened, ...second.recovered];
        const overview = await readReliabilityOverview();
        const jobs = new Map(overview.jobs.map((job) => [job.jobName, job]));
        const notifications = [];
        for (const incident of transitions) {
          const recovered = incident.status === "recovered";
          const job = jobs.get(incident.jobName);
          const notification = await enqueueNotification({ id: `NTF-REL-${incident.id}-${recovered ? "RECOVERED" : "OPEN"}`, channel: "webhook", eventType: recovered ? "reliability.job.recovered" : "reliability.job.failed", severity: recovered ? "info" : incident.severity, alertId: incident.id, payload: { incidentId: incident.id, jobName: incident.jobName, label: job?.label || incident.jobName, state: job?.state || incident.openedState, reason: incident.reason, openedAt: incident.openedAt, recoveredAt: incident.recoveredAt } });
          notifications.push(notification.notification);
          await appendOpsEvent(normalizeOpsEvent({ type: recovered ? "reliability.job.recovered" : "reliability.job.incident-opened", actor: auth.name, entityType: "reliability-job", entityId: incident.jobName, source: "reliability-watchdog", note: recovered ? `${job?.label || incident.jobName} recovered.` : `${job?.label || incident.jobName}: ${incident.reason}`, payload: { principalId: auth.id, incidentId: incident.id, severity: incident.severity, notificationId: notification.notification.id } }));
        }
        sendJson(res, 200, { ...overview, scan: { opened: first.opened.length + second.opened.length, recovered: first.recovered.length + second.recovered.length, transitions }, notifications });
      } catch (error) {
        if (reliabilityRun) {
          await finishReliabilityRun(reliabilityRun.id, { status: "failed", error: error.message }).catch(() => {});
          await scanReliability().catch(() => {});
        }
        throw error;
      } finally {
        await releaseJobLease({ jobName: "reliability-watchdog", ownerId }).catch(() => {});
      }
      return;
    }

    if (req.method === "GET" && pathname === "/api/storage") {
      requirePermission(auth, "storage.read");
      const [runtimeStorage, masterDataStorage, mobileCaptureStorage, proofMediaStorage, telemetryStorage, moduleStorage, reminderStorage, remediationStorage, deviceStorage, alertStorage, aiVisionStorage, notificationStorage, evidenceSnapshotStorage, integrationStorage, workforceStorage, reliabilityStorage, commissioningStorage, deviceLifecycleStorage, releaseEvidenceStorage, healthEsgStorage, fieldServiceStorage] = await Promise.all([
        readOpsStorageHealth(),
        readMasterDataHealth(),
        readMobileCaptureStorageHealth(),
        readProofMediaStorageHealth(),
        readTelemetryStorageHealth(),
        readModuleStorageHealth(),
        readReminderStorageHealth(),
        readRemediationStorageHealth(),
        readDeviceStorageHealth(),
        readAlertStorageHealth(),
        readAiVisionStorageHealth(),
        readNotificationStorageHealth(),
        readEvidenceSnapshotStorageHealth(),
        readIntegrationStorageHealth(),
        readWorkforceStorageHealth(),
        readReliabilityHealth(),
        readCommissioningHealth(),
        readDeviceLifecycleHealth(),
        readReleaseEvidenceHealth(),
        readHealthEsgStorageHealth(),
        readFieldServiceStorageHealth()
      ]);
      const [maintenancePlanningStorage, inventoryStorage,serviceContractStorage] = await Promise.all([readMaintenancePlanningHealth(), readInventoryHealth(),readServiceContractHealth()]);
      sendJson(res, 200, {
        generatedAt: new Date().toISOString(),
        ...runtimeStorage,
        masterData: masterDataStorage,
        mobileCapture: mobileCaptureStorage,
        proofMedia: proofMediaStorage,
        telemetry: telemetryStorage,
        modules: moduleStorage,
        reminders: reminderStorage,
        remediation: remediationStorage,
        devices: deviceStorage,
        alerts: alertStorage,
        aiVision: aiVisionStorage,
        notifications: notificationStorage,
        evidenceSnapshots: evidenceSnapshotStorage,
        integrations: integrationStorage,
        workforce: workforceStorage,
        maintenancePlanning: maintenancePlanningStorage,
        inventory: inventoryStorage,
        reliability: reliabilityStorage,
        commissioning: commissioningStorage,
        deviceLifecycle: deviceLifecycleStorage
        ,serviceContracts:serviceContractStorage,
        releaseEvidence: releaseEvidenceStorage,
        healthEsg: healthEsgStorage,
        fieldService: fieldServiceStorage
      });
      return;
    }

    if (req.method === "GET" && pathname === "/api/metrics") {
      requirePermission(auth, "observability.read");
      sendJson(res, 200, observabilitySnapshot());
      return;
    }

    if (req.method === "GET" && pathname === "/api/notifications") {
      requirePermission(auth, "notifications.read");
      const url = new URL(req.url, `http://${host}:${port}`);
      const status = url.searchParams.get("status") || null;
      const limit = url.searchParams.get("limit") || 100;
      const [notifications, storage] = await Promise.all([
        listNotifications({ status, limit }),
        readNotificationStorageHealth()
      ]);
      sendJson(res, 200, { generatedAt: new Date().toISOString(), notifications, summary: storage.counts });
      return;
    }

    if (req.method === "GET" && pathname === "/api/production/evidence") {
      requirePermission(auth, "production.evidence.read");
      const url = new URL(req.url, `http://${host}:${port}`);
      const [summary, records, health] = await Promise.all([readReleaseEvidenceSummary(), listReleaseEvidence({ limit: url.searchParams.get("limit") || 100 }), readReleaseEvidenceHealth()]);
      sendJson(res, 200, { ...summary, records, health });
      return;
    }

    if (req.method === "GET" && pathname === "/api/ops/health") {
      requirePermission(auth, "health.score.read");
      sendJson(res, 200, await buildOperationalHealthFor(auth));
      return;
    }

    if (req.method === "POST" && pathname === "/api/ops/health/recompute") {
      requirePermission(auth, "health.score.recompute");
      const input = await readJsonBody(req);
      const commandKey = String(req.headers["idempotency-key"] || "").trim();
      const response = await runIdempotentInventoryCommand({ auth, scope: "operational-health-recompute", commandKey, payload: input, execute: async (requestHash) => {
        const report = await buildOperationalHealthFor(auth);
        const snapshots = [];
        for (const asset of report.assets) {
          const result = await saveOperationalHealthSnapshot({ id: `OHS-${requestHash.slice(0, 12)}-${asset.wallId}`, wallId: asset.wallId, score: asset.score, status: asset.status, calculatedAt: report.generatedAt, inputs: { factors: asset.factors, confidence: asset.confidence, evidenceRefs: asset.evidenceRefs }, methodVersion: operationalHealthMethodVersion });
          snapshots.push(result.snapshot);
        }
        const event = normalizeOpsEvent({ id: `OPS-OHS-${requestHash.slice(0, 20)}`, type: "operations.health.recomputed", actor: auth.name, entityType: "portfolio", entityId: auth.clientScope === "all" ? "all" : auth.clientIds.join(","), source: "operational-health", note: `Operational health recomputed for ${report.summary.scoredAssets}/${report.summary.assets} asset(s).`, payload: { principalId: auth.id, methodVersion: report.methodVersion, averageScore: report.summary.averageScore, scoredAssets: report.summary.scoredAssets } });
        await appendOpsEvent(event);
        return { ...report, snapshots, event };
      }});
      sendJson(res, 200, response);
      return;
    }

    if (req.method === "GET" && pathname === "/api/esg/ledger") {
      requirePermission(auth, "esg.ledger.read");
      const url = new URL(req.url, `http://${host}:${port}`);
      sendJson(res, 200, await buildEsgLedgerFor(auth, { clientId: url.searchParams.get("clientId") || null, periodStart: url.searchParams.get("periodStart") || null, periodEnd: url.searchParams.get("periodEnd") || null }));
      return;
    }

    if (req.method === "POST" && pathname === "/api/esg/ledger/recompute") {
      requirePermission(auth, "esg.ledger.write");
      const input = await readJsonBody(req);
      const commandKey = String(req.headers["idempotency-key"] || "").trim();
      const scopeKey = esgScopeKey(auth, String(input.clientId || "").trim() || null);
      const response = await runIdempotentInventoryCommand({ auth, scope: `esg-ledger-recompute:${scopeKey}`, commandKey, payload: input, execute: async (requestHash) => {
        const ledger = await buildEsgLedgerFor(auth, input);
        const saved = await saveEsgPeriodLedger({ ...ledger, id: `ESG-${requestHash.slice(0, 20)}`, generatedBy: auth.id, generatedAt: new Date().toISOString() });
        const event = normalizeOpsEvent({ id: `OPS-ESG-${requestHash.slice(0, 20)}`, type: "esg.ledger.generated", actor: auth.name, entityType: "esg-ledger", entityId: saved.id, clientId: saved.clientId, source: "esg-operational-ledger", note: `ESG operational ledger generated for ${saved.scopeKey}.`, payload: { principalId: auth.id, period: saved.period, status: saved.status, counts: saved.counts, gaps: saved.gaps } });
        await appendOpsEvent(event);
        return { ledger: saved, event, persisted: await listEsgPeriodLedgers({ scopeKey: saved.scopeKey, limit: 5 }) };
      }});
      sendJson(res, 200, response);
      return;
    }

    if (req.method === "GET" && pathname === "/api/esg/observations") {
      requirePermission(auth, "esg.observations.read");
      const url = new URL(req.url, `http://${host}:${port}`);
      const clientId = url.searchParams.get("clientId") || null;
      const wallId = url.searchParams.get("wallId") || null;
      if (clientId) requireClientAccess(auth, clientId, "ESG observation list");
      if (wallId) {
        const resolveEntityClientId = await buildEntityClientResolver();
        requireClientAccess(auth, resolveEntityClientId("wall", wallId), "ESG observation list");
      }
      sendJson(res, 200, { generatedAt: new Date().toISOString(), observations: await listEsgObservations({ clientIds: auth.clientScope === "all" ? null : auth.clientIds, clientId, wallId, category: url.searchParams.get("category") || null, limit: url.searchParams.get("limit") || 100 }) });
      return;
    }

    if (req.method === "POST" && pathname === "/api/esg/observations") {
      requirePermission(auth, "esg.observations.write");
      const input = await readJsonBody(req);
      let normalized;
      try { normalized = normalizeEsgObservation(input); }
      catch (caught) { throw validationError(caught.message, "ESG_OBSERVATION_INVALID"); }
      requireClientAccess(auth, normalized.clientId, "ESG observation write");
      if (normalized.wallId) {
        const resolveEntityClientId = await buildEntityClientResolver();
        const wallClientId = resolveEntityClientId("wall", normalized.wallId);
        if (!wallClientId) throw validationError("observation references an unknown wall", "ESG_OBSERVATION_WALL_UNKNOWN");
        if (wallClientId !== normalized.clientId) throw validationError("observation client and wall do not match", "ESG_OBSERVATION_SCOPE_MISMATCH");
      }
      if (normalized.moduleId) {
        const module = (await listModules({ wallId: normalized.wallId || null })).find((item) => item.id === normalized.moduleId);
        if (!module || module.clientId !== normalized.clientId || (normalized.wallId && module.assetId !== normalized.wallId)) throw validationError("observation module is outside the selected client/wall scope", "ESG_OBSERVATION_MODULE_SCOPE_MISMATCH");
      }
      if (normalized.workOrderId) {
        const resolveEntityClientId = await buildEntityClientResolver();
        const workOrderClientId = resolveEntityClientId("workorder", normalized.workOrderId);
        if (!workOrderClientId || workOrderClientId !== normalized.clientId) throw validationError("observation work order is outside the selected client scope", "ESG_OBSERVATION_WORKORDER_SCOPE_MISMATCH");
      }
      const commandKey = String(req.headers["idempotency-key"] || "").trim();
      const response = await runIdempotentInventoryCommand({ auth, scope: "esg-observation-create", commandKey, payload: input, execute: async (requestHash) => {
        const result = await createEsgObservation({ ...normalized, id: normalized.id || `ESG-OBS-${requestHash.slice(0, 20)}`, createdBy: auth.id });
        const event = normalizeOpsEvent({ id: `OPS-ESG-OBS-${requestHash.slice(0, 20)}`, type: "esg.observation.created", actor: auth.name, entityType: "esg-observation", entityId: result.observation.id, clientId: result.observation.clientId, wallId: result.observation.wallId, source: "esg-observation-ledger", note: result.observation.note, payload: { principalId: auth.id, category: result.observation.category, evidenceRef: result.observation.evidenceRef, observedAt: result.observation.observedAt } });
        if (!result.duplicate) await appendOpsEvent(event);
        return { ...result, event: result.duplicate ? null : event };
      }});
      sendJson(res, response.duplicate ? 200 : 201, response);
      return;
    }

    const releaseEvidenceEventsMatch = pathname.match(/^\/api\/production\/evidence\/([^/]+)\/events$/);
    if (req.method === "GET" && releaseEvidenceEventsMatch) {
      requirePermission(auth, "production.evidence.read");
      const id = decodeURIComponent(releaseEvidenceEventsMatch[1]);
      const record = (await listReleaseEvidence({ limit: 500 })).find((item) => item.id === id);
      if (!record) throw apiError(404, "release evidence record not found", "RELEASE_EVIDENCE_NOT_FOUND");
      sendJson(res, 200, { record, events: await listReleaseEvidenceEvents(id) });
      return;
    }

    if (req.method === "POST" && pathname === "/api/production/evidence") {
      requirePermission(auth, "production.evidence.write");
      const input = await readJsonBody(req);
      const commandKey = String(req.headers["idempotency-key"] || "").trim();
      const response = await runIdempotentInventoryCommand({ auth, scope: "production-release-evidence-submit", commandKey, payload: input, execute: async (requestHash) => {
        const result = await submitReleaseEvidence({ ...input, id: `RE-${requestHash.slice(0, 20)}`, submittedBy: auth.id });
        const event = normalizeOpsEvent({ id: `OPS-RE-${requestHash.slice(0, 20)}`, type: "production.evidence.submitted", actor: auth.name, entityType: "release-evidence", entityId: result.record.id, source: "production-evidence-ledger", note: result.record.note, payload: { principalId: auth.id, requirementKey: result.record.requirementKey, artifactSha256: result.record.artifactSha256, observedAt: result.record.observedAt, expiresAt: result.record.expiresAt } });
        await appendOpsEvent(event);
        return { ...result, event, summary: await readReleaseEvidenceSummary() };
      }});
      sendJson(res, response.duplicate ? 200 : 201, response);
      return;
    }

    const releaseEvidenceReviewMatch = pathname.match(/^\/api\/production\/evidence\/([^/]+)\/review$/);
    if (req.method === "POST" && releaseEvidenceReviewMatch) {
      requirePermission(auth, "production.evidence.verify");
      const id = decodeURIComponent(releaseEvidenceReviewMatch[1]);
      const record = (await listReleaseEvidence({ limit: 500 })).find((item) => item.id === id);
      if (!record) throw apiError(404, "release evidence record not found", "RELEASE_EVIDENCE_NOT_FOUND");
      const input = await readJsonBody(req);
      const commandKey = String(req.headers["idempotency-key"] || "").trim();
      const response = await runIdempotentInventoryCommand({ auth, scope: `production-release-evidence-review:${id}`, commandKey, payload: input, execute: async (requestHash) => {
        const result = await reviewReleaseEvidence(id, { ...input, reviewedBy: auth.id });
        const event = normalizeOpsEvent({ id: `OPS-RE-REV-${requestHash.slice(0, 20)}`, type: `production.evidence.${input.decision}`, actor: auth.name, entityType: "release-evidence", entityId: id, source: "production-evidence-ledger", note: input.reviewNote, payload: { principalId: auth.id, requirementKey: record.requirementKey, decision: input.decision, submittedBy: record.submittedBy } });
        await appendOpsEvent(event);
        return { ...result, event, summary: await readReleaseEvidenceSummary() };
      }});
      sendJson(res, 200, response);
      return;
    }

    if (req.method === "GET" && pathname === "/api/ops/timeline") {
      requirePermission(auth, "ops.events.read");
      const url = new URL(req.url, `http://${host}:${port}`);
      const clientId = url.searchParams.get("clientId") || "";
      if (clientId) requireClientAccess(auth, clientId, "operations timeline filter");
      sendJson(res, 200, {
        generatedAt: new Date().toISOString(),
        ...(await buildOpsTimeline(auth, {
          limit: url.searchParams.get("limit"),
          types: url.searchParams.get("types")?.split(",") || [],
          entityType: url.searchParams.get("entityType"),
          clientId,
          before: url.searchParams.get("before"),
          beforeId: url.searchParams.get("beforeId")
        }))
      });
      return;
    }

    if (req.method === "GET" && pathname === "/api/ops/quality") {
      requirePermission(auth, "storage.read");
      sendJson(res, 200, await buildOperationsQuality(auth));
      return;
    }

    if (req.method === "GET" && pathname === "/api/ops/pilot-reconciliation") {
      requirePermission(auth, "storage.read");
      sendJson(res, 200, await buildPilotReconciliationFor(auth));
      return;
    }

    if (req.method === "GET" && pathname === "/api/remediation/tasks") {
      requirePermission(auth, "ops.remediation.read");
      const url = new URL(req.url, `http://${host}:${port}`);
      const clientId = url.searchParams.get("clientId") || "";
      if (clientId) requireClientAccess(auth, clientId, "remediation task filter");
      const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 50, 1), 100);
      const cursor = decodeRemediationCursor(url.searchParams.get("cursor"));
      const scopeClientIds = clientId ? [clientId] : auth.clientScope === "all" ? null : auth.clientIds;
      const [candidates, dispatchSummary] = await Promise.all([listRemediationTasks({
        clientIds: scopeClientIds,
        statuses: url.searchParams.get("statuses")?.split(",") || null,
        moduleId: url.searchParams.get("moduleId") || null,
        assignedTo: auth.roleId === "field-tech" ? auth.id : (url.searchParams.get("assignedTo") || null),
        reviewStatuses: url.searchParams.get("reviewStatuses")?.split(",") || null,
        priorities: url.searchParams.get("priorities")?.split(",") || null,
        dueBefore: url.searchParams.get("dueBefore") || null,
        before: cursor.before,
        beforeId: cursor.beforeId,
        orderBy: "updated",
        limit: limit + 1
      }), readRemediationDispatchSummary({ clientIds: scopeClientIds, assignedTo: auth.roleId === "field-tech" ? auth.id : null })]);
      const hasMore = candidates.length > limit;
      const tasks = candidates.slice(0, limit).map((task) => ({ ...task, sla: remediationSla(task) }));
      const last = tasks.at(-1);
      sendJson(res, 200, { generatedAt: new Date().toISOString(), tasks, page: { limit, hasMore, nextCursor: hasMore && last ? encodeRemediationCursor(last) : null }, summary: { ...dispatchSummary, returned: tasks.length }, slaThresholds: remediationSlaThresholds() });
      return;
    }

    if (req.method === "POST" && pathname === "/api/remediation/tasks/bulk") {
      requirePermission(auth, "ops.remediation.update");
      if (!["fm-lead", "platform-admin"].includes(auth.roleId)) throw apiError(403, "only FM Lead or Platform Admin can bulk-dispatch remediation tasks", "REMEDIATION_BULK_ROLE_DENIED");
      const input = await readJsonBody(req);
      const commandKey = String(req.headers["idempotency-key"] || "").trim();
      if (!commandKey) throw apiError(428, "Idempotency-Key header is required for bulk dispatch", "IDEMPOTENCY_KEY_REQUIRED");
      const taskIds = [...new Set(Array.isArray(input.taskIds) ? input.taskIds.map((id) => String(id || "").trim()).filter(Boolean) : [])];
      if (!taskIds.length || taskIds.length > 100) throw validationError("taskIds must contain 1 to 100 unique task IDs", "REMEDIATION_BULK_SIZE_INVALID");
      const hasAssignedTo = Object.prototype.hasOwnProperty.call(input, "assignedTo");
      const hasDueAt = Object.prototype.hasOwnProperty.call(input, "dueAt");
      const hasPriority = Object.prototype.hasOwnProperty.call(input, "priority");
      const hasStatus = Object.prototype.hasOwnProperty.call(input, "status");
      if (![hasAssignedTo, hasDueAt, hasPriority, hasStatus].some(Boolean)) throw validationError("bulk update requires assignedTo, dueAt, priority or status", "REMEDIATION_BULK_EMPTY");
      if (hasStatus && !["assigned", "cancelled"].includes(String(input.status))) throw validationError("bulk status must be assigned or cancelled", "REMEDIATION_BULK_STATUS_INVALID");
      if (hasPriority && !["critical", "high", "normal", "low"].includes(String(input.priority))) throw validationError("bulk priority is invalid", "REMEDIATION_BULK_PRIORITY_INVALID");
      if (hasDueAt && input.dueAt && !Number.isFinite(Date.parse(input.dueAt))) throw validationError("bulk dueAt must be a valid date-time", "REMEDIATION_BULK_DUE_INVALID");
      const dueAt = hasDueAt && input.dueAt ? new Date(input.dueAt).toISOString() : hasDueAt ? null : undefined;
      const expectedUpdatedAtById = input.expectedUpdatedAtById && typeof input.expectedUpdatedAtById === "object" ? input.expectedUpdatedAtById : {};
      for (const taskId of taskIds) if (!expectedUpdatedAtById[taskId]) throw apiError(428, `expectedUpdatedAtById.${taskId} is required`, "REMEDIATION_BULK_VERSION_REQUIRED");
      const commandPayload = { taskIds, assignedTo: hasAssignedTo ? (String(input.assignedTo || "").trim() || null) : undefined, dueAt, priority: hasPriority ? input.priority : undefined, status: hasStatus ? input.status : undefined, expectedUpdatedAtById };
      const requestHash = createHash("sha256").update(JSON.stringify(commandPayload)).digest("hex");
      const ownerId = `${auth.id}:${randomUUID()}`;
      const command = await beginIdempotentCommand({ scope: "remediation-bulk-dispatch", commandKey, requestHash, ownerId, leaseSeconds: 300 });
      if (command.duplicate) { sendJson(res, 200, { ...command.response, duplicate: true }); return; }
      try {
        const existingTasks = [];
        for (const taskId of taskIds) {
          const task = await readRemediationTask(taskId);
          if (!task) throw apiError(404, `remediation task ${taskId} not found`, "REMEDIATION_TASK_NOT_FOUND");
          requireClientAccess(auth, task.clientId, "remediation bulk dispatch");
          if (["resolved", "cancelled"].includes(task.status)) throw validationError(`task ${taskId} is already terminal`, "REMEDIATION_BULK_TERMINAL_TASK");
          if (task.reviewStatus === "pending" && (hasAssignedTo || hasStatus)) throw validationError(`task ${taskId} is awaiting independent FM review`, "REMEDIATION_BULK_REVIEW_PENDING");
          if (String(expectedUpdatedAtById[taskId]) !== task.updatedAt) throw apiError(409, `task ${taskId} changed after it was loaded`, "REMEDIATION_BULK_VERSION_CONFLICT");
          existingTasks.push(task);
        }
        const requestedAssignee = hasAssignedTo ? (String(input.assignedTo || "").trim() || null) : null;
        if (requestedAssignee && (!hasStatus || input.status !== "cancelled")) {
          const contexts = await Promise.all(existingTasks.map((task) => {
            const pendingTask = { ...task, assignedTo: requestedAssignee, dueAt: dueAt === undefined ? task.dueAt : dueAt, priority: hasPriority ? input.priority : task.priority, status: hasStatus ? input.status : task.status };
            return resolveWorkforceTarget(auth, { targetType: "remediation-task", targetId: task.id, technicianId: requestedAssignee, task: pendingTask });
          }));
          await assertEligibleWorkforceBatch(contexts);
        }
        const tasks = [];
        const eventKey = createHash("sha256").update(commandKey).digest("hex").slice(0, 16);
        for (const existing of existingTasks) {
          const assignedTo = hasAssignedTo ? (String(input.assignedTo || "").trim() || null) : existing.assignedTo;
          const status = hasStatus ? String(input.status) : hasAssignedTo && assignedTo && existing.status === "open" ? "assigned" : existing.status;
          if (status === "assigned" && !assignedTo) throw validationError(`task ${existing.id} requires an assignee`, "REMEDIATION_BULK_ASSIGNEE_REQUIRED");
          const result = await updateRemediationTask(existing.id, { status, assignedTo, dueAt, priority: hasPriority ? input.priority : existing.priority, expectedUpdatedAt: expectedUpdatedAtById[existing.id], updatedBy: auth.id });
          await syncRemediationWorkforceAssignment(result.task, auth);
          const event = normalizeOpsEvent({ id: `OPS-BULK-${eventKey}-${existing.id}`, type: "remediation.task.bulk-dispatched", actor: auth.name, entityType: "remediation-task", entityId: result.task.id, clientId: result.task.clientId, wallId: result.task.wallId, source: "ops-remediation", note: `Bulk dispatch updated ${result.task.id}.`, payload: { principalId: auth.id, commandKey, previousStatus: existing.status, nextStatus: result.task.status, assignedTo: result.task.assignedTo, dueAt: result.task.dueAt, priority: result.task.priority } });
          await appendOpsEvent(event);
          tasks.push({ ...result.task, sla: remediationSla(result.task) });
        }
        const response = { duplicate: false, updated: tasks.length, taskIds: tasks.map((task) => task.id), tasks };
        await completeIdempotentCommand({ scope: "remediation-bulk-dispatch", commandKey, ownerId, response });
        sendJson(res, 200, response);
      } catch (error) {
        await abandonIdempotentCommand({ scope: "remediation-bulk-dispatch", commandKey, ownerId }).catch(() => {});
        throw error;
      }
      return;
    }

    if (req.method === "POST" && pathname === "/api/remediation/sla-scan") {
      requirePermission(auth, "ops.remediation.update");
      if (!["fm-lead", "platform-admin"].includes(auth.roleId)) throw apiError(403, "only FM Lead or Platform Admin can run remediation SLA escalation", "REMEDIATION_SLA_ROLE_DENIED");
      const ownerId = `${auth.id}:${randomUUID()}`;
      const lease = await acquireJobLease({ jobName: "remediation-sla-scan", ownerId, leaseSeconds: 300 });
      if (!lease.acquired) throw apiError(409, "remediation SLA scan is already running", "REMEDIATION_SLA_SCAN_BUSY");
      let reliabilityRun = null;
      try {
        reliabilityRun = (await beginReliabilityRun({ jobName: "remediation-sla-scan", ownerId, details: { trigger: "ops-api", principalId: auth.id } })).run;
        const clientIds = auth.clientScope === "all" ? null : auth.clientIds;
        let before = null; let beforeId = null; let scanned = 0; const escalated = [];
        while (true) {
          const page = await listRemediationTasks({ clientIds, statuses: ["open", "assigned", "in_progress"], before, beforeId, orderBy: "updated", limit: 500 });
          if (!page.length) break;
          const cursorTask = page.at(-1);
          scanned += page.length;
          for (const task of page) {
            const sla = remediationSla(task);
            if (!sla.level || sla.level <= Number(task.escalationLevel || 0)) continue;
            const reason = `${sla.overdueHours.toFixed(1)} hours overdue; escalated to level ${sla.level}.`;
            const escalatedTask = await markRemediationEscalation(task.id, { level: sla.level, reason, updatedBy: `system:sla:${auth.id}` });
            if (!escalatedTask) continue;
            const notification = await enqueueNotification({ id: `NTF-RMT-${task.id}-L${sla.level}`, channel: "webhook", eventType: "remediation.task.sla-escalated", severity: sla.level >= 3 ? "critical" : sla.level === 2 ? "high" : "warning", clientId: task.clientId, wallId: task.wallId, alertId: task.id, payload: { taskId: task.id, moduleId: task.moduleId, workOrderId: task.workOrderId, assignedTo: task.assignedTo, dueAt: task.dueAt, escalationLevel: sla.level, overdueHours: Number(sla.overdueHours.toFixed(1)), reason } });
            const event = normalizeOpsEvent({ type: "remediation.task.sla-escalated", actor: auth.name, entityType: "remediation-task", entityId: task.id, clientId: task.clientId, wallId: task.wallId, source: "ops-remediation-sla", note: reason, payload: { principalId: auth.id, level: sla.level, overdueHours: Number(sla.overdueHours.toFixed(1)), notificationId: notification.notification.id, assignedTo: task.assignedTo, dueAt: task.dueAt } });
            await appendOpsEvent(event);
            escalated.push({ ...escalatedTask, sla });
          }
          if (page.length < 500) break;
          before = cursorTask.updatedAt; beforeId = cursorTask.id;
        }
        await finishReliabilityRun(reliabilityRun.id, { status: "succeeded", result: { scanned, escalated: escalated.length } });
        sendJson(res, 200, { generatedAt: new Date().toISOString(), scanned, escalated: escalated.length, tasks: escalated, thresholds: remediationSlaThresholds(), lease: { jobName: lease.lease.jobName, ownerId, leaseUntil: lease.lease.leaseUntil } });
      } catch (error) {
        if (reliabilityRun) await finishReliabilityRun(reliabilityRun.id, { status: "failed", error: error.message }).catch(() => {});
        throw error;
      } finally {
        await releaseJobLease({ jobName: "remediation-sla-scan", ownerId }).catch(() => {});
      }
      return;
    }

    if (req.method === "POST" && pathname === "/api/remediation/tasks") {
      requirePermission(auth, "ops.remediation.write");
      const input = await readJsonBody(req);
      const modules = await listModules({ clientIds: auth.clientScope === "all" ? null : auth.clientIds });
      const module = modules.find((item) => item.id === String(input?.moduleId || "").trim());
      if (!module) throw apiError(404, "module not found in the current client scope", "REMEDIATION_MODULE_NOT_FOUND");
      requireClientAccess(auth, module.clientId, "remediation task create");
      const workOrderId = await resolveRemediationWorkOrder(auth, module, input?.workOrderId);
      const contractEvaluation=await evaluateServiceContract({clientId:module.clientId,wallId:module.assetId,priority:input.priority||"normal"});
      const contractInput={...input,dueAt:input.dueAt||contractEvaluation.sla?.dueAt||null};
      if (contractInput.assignedTo) {
        const pendingTask = { id: contractInput.id || `pending:${module.id}`, clientId: module.clientId, wallId: module.assetId, moduleId: module.id, workOrderId, source: contractInput.source || "module-readiness", sourceKey: contractInput.sourceKey, priority: contractInput.priority || "normal", reasons: contractInput.reasons || [], dueAt: contractInput.dueAt, status: "open" };
        const context = await resolveWorkforceTarget(auth, { targetType: "remediation-task", targetId: pendingTask.id, technicianId: contractInput.assignedTo, task: pendingTask });
        await assertEligibleWorkforceAssignment(context);
      }
      const result = await createRemediationTask({ ...contractInput, clientId: module.clientId, wallId: module.assetId, workOrderId, moduleId: module.id, createdBy: auth.id });
      await linkServiceContractSla({ taskId: result.task.id, contractId: contractEvaluation.contract?.id || null, clientId: result.task.clientId, wallId: result.task.wallId, coverageState: contractEvaluation.coverageState || "missing", priority: result.task.priority, committedDueAt: result.task.dueAt || null, responseHours: contractEvaluation.sla?.responseHours ?? null, resolutionHours: contractEvaluation.sla?.resolutionHours ?? null, linkedBy: auth.id }).catch((error) => { if (!result.duplicate) throw error; });
      if (result.task.assignedTo) await syncRemediationWorkforceAssignment(result.task, auth);
      const event = result.duplicate ? null : normalizeOpsEvent({ type: "remediation.task.created", actor: auth.name, entityType: "remediation-task", entityId: result.task.id, clientId: result.task.clientId, wallId: result.task.wallId, source: "ops-remediation", note: `Remediation task created for module ${result.task.moduleId}.`, payload: { principalId: auth.id, sourceKey: result.task.sourceKey, priority: result.task.priority, workOrderId: result.task.workOrderId, reasons: result.task.reasons,serviceContractId:contractEvaluation.contract?.id||null,contractCoverage:contractEvaluation.coverageState,sla:contractEvaluation.sla } });
      if (event) await appendOpsEvent(event);
      sendJson(res, result.duplicate ? 200 : 201, { ...result, event });
      return;
    }

    const remediationTaskMatch = pathname.match(/^\/api\/remediation\/tasks\/([^/]+)$/);
    if (req.method === "PATCH" && remediationTaskMatch) {
      requirePermission(auth, "ops.remediation.update");
      const taskId = decodeURIComponent(remediationTaskMatch[1]);
      const existing = await readRemediationTask(taskId);
      if (!existing) throw apiError(404, "remediation task not found", "REMEDIATION_TASK_NOT_FOUND");
      requireClientAccess(auth, existing.clientId, "remediation task update");
      if (auth.roleId === "field-tech" && existing.assignedTo && existing.assignedTo !== auth.id) throw apiError(403, "field technician is not assigned to this remediation task", "REMEDIATION_ASSIGNMENT_DENIED");
      const input = await readJsonBody(req);
      const reviewerRoles = new Set(["fm-lead", "platform-admin"]);
      if (input.reviewDecision && !reviewerRoles.has(auth.roleId)) throw apiError(403, "only FM Lead or Platform Admin can review remediation evidence", "REMEDIATION_REVIEW_ROLE_DENIED");
      if (auth.roleId === "field-tech" && (input.status === "resolved" || input.reviewDecision)) throw apiError(403, "technicians must submit completion evidence for independent FM review", "REMEDIATION_REVIEW_REQUIRED");
      const updateInput = { ...input, updatedBy: auth.id, assignedTo: auth.roleId === "field-tech" ? (input.assignedTo || existing.assignedTo || auth.id) : input.assignedTo, acceptedBy: input.status === "in_progress" && auth.roleId === "field-tech" ? auth.id : undefined, submittedBy: input.submitForReview === true ? auth.id : undefined, reviewedBy: input.reviewDecision ? auth.id : undefined };
      const nextAssignedTo = updateInput.assignedTo === undefined ? existing.assignedTo : updateInput.assignedTo;
      const nextStatus = input.reviewDecision === "approved" ? "resolved" : input.reviewDecision === "rejected" ? "assigned" : input.submitForReview === true ? "in_progress" : (input.status || existing.status);
      if (nextAssignedTo && !["resolved", "cancelled"].includes(nextStatus)) {
        const pendingTask = { ...existing, ...input, assignedTo: nextAssignedTo, status: nextStatus, dueAt: input.dueAt === undefined ? existing.dueAt : input.dueAt };
        const context = await resolveWorkforceTarget(auth, { targetType: "remediation-task", targetId: existing.id, technicianId: nextAssignedTo, task: pendingTask });
        await assertEligibleWorkforceAssignment(context);
      }
      const result = await updateRemediationTask(taskId, updateInput);
      await syncRemediationWorkforceAssignment(result.task, auth);
      const eventType = input.submitForReview === true ? "remediation.task.review-submitted" : input.reviewDecision ? `remediation.task.review-${input.reviewDecision}` : `remediation.task.${result.task.status}`;
      const event = normalizeOpsEvent({ type: eventType, actor: auth.name, entityType: "remediation-task", entityId: result.task.id, clientId: result.task.clientId, wallId: result.task.wallId, source: "ops-remediation", note: result.task.reviewNote || result.task.resolutionNote || `Remediation task ${result.task.id} moved to ${result.task.status}.`, payload: { principalId: auth.id, previousStatus: existing.status, nextStatus: result.task.status, reviewStatus: result.task.reviewStatus, assignedTo: result.task.assignedTo, acceptedBy: result.task.acceptedBy, submittedBy: result.task.submittedBy, reviewedBy: result.task.reviewedBy, evidenceRef: result.task.evidenceRef } });
      await appendOpsEvent(event);
      sendJson(res, 200, { ...result, event });
      return;
    }

    if (req.method === "GET" && pathname === "/api/portfolio") {
      requirePermission(auth, "portfolio.read");
      sendJson(res, 200, await buildPortfolioSummary(auth));
      return;
    }

    if (req.method === "GET" && pathname === "/api/data-model") {
      requirePermission(auth, "data.model.read");
      sendJson(res, 200, productionDataModel);
      return;
    }

    if (req.method === "GET" && pathname === "/api/data-quality") {
      requirePermission(auth, "data.quality.read");
      sendJson(res, 200, await buildDataQualityReport(dataRoot, await readOpsEvents()));
      return;
    }

    if (req.method === "GET" && pathname === "/api/proof/evidence-snapshot") {
      requirePermission(auth, "portfolio.read");
      sendJson(res, 200, await buildEvidenceSnapshot(auth));
      return;
    }

    if (req.method === "POST" && pathname === "/api/proof/evidence-snapshots") {
      requirePermission(auth, "proof.snapshot.write");
      const result = await createEvidenceSnapshotRecord(await buildEvidenceSnapshot(auth));
      if (!result.duplicate) {
        const clientIds = Array.isArray(result.snapshot.clientIds) ? result.snapshot.clientIds : [];
        await appendOpsEvent(normalizeOpsEvent({
          type: "evidence.snapshot.persisted",
          actor: auth.name,
          entityType: "evidence-snapshot",
          entityId: result.snapshot.snapshotId,
          clientId: clientIds.length === 1 && clientIds[0] !== "*" ? clientIds[0] : null,
          source: "evidence-ledger",
          note: `Evidence snapshot ${result.snapshot.snapshotId} persisted for ${result.snapshot.scope}.`,
          payload: { principalId: auth.id, snapshotId: result.snapshot.snapshotId, scope: result.snapshot.scope, signatureStatus: result.snapshot.signatureStatus, clientIds }
        }));
      }
      sendJson(res, result.duplicate ? 200 : 201, { ...result.snapshot, duplicate: result.duplicate, persisted: true });
      return;
    }

    if (req.method === "GET" && pathname === "/api/proof/evidence-snapshots") {
      requirePermission(auth, "proof.snapshot.read");
      const url = new URL(req.url, `http://${host}:${port}`);
      const snapshots = (await listEvidenceSnapshots({ limit: url.searchParams.get("limit") })).filter((snapshot) => canAccessEvidenceSnapshot(auth, snapshot));
      sendJson(res, 200, { generatedAt: new Date().toISOString(), snapshots });
      return;
    }

    if (req.method === "POST" && pathname === "/api/proof/evidence-snapshots/retention-sweep") {
      requirePermission(auth, "proof.snapshot.retention");
      const result = await sweepEvidenceSnapshots();
      await appendOpsEvent(normalizeOpsEvent({
        type: "evidence.snapshot.retention.swept",
        actor: auth.name,
        entityType: "evidence-snapshot",
        entityId: "retention-sweep",
        source: "evidence-ledger",
        note: `Evidence retention sweep completed with ${Number(result.expiredCount || 0)} expired record(s).`,
        payload: { principalId: auth.id, expiredCount: Number(result.expiredCount || 0), sweptAt: result.sweptAt }
      }));
      sendJson(res, 200, { ...result, persisted: true });
      return;
    }

    const persistedEvidenceSnapshotMatch = pathname.match(/^\/api\/proof\/evidence-snapshots\/([^/]+)$/);
    if (req.method === "POST" && persistedEvidenceSnapshotMatch) {
      requirePermission(auth, "proof.snapshot.verify");
      const snapshotId = decodeURIComponent(persistedEvidenceSnapshotMatch[1]);
      const existing = await readEvidenceSnapshot(snapshotId);
      if (!existing) throw apiError(404, "Evidence snapshot not found", "EVIDENCE_SNAPSHOT_NOT_FOUND");
      if (!canAccessEvidenceSnapshot(auth, existing)) throw apiError(403, "Evidence snapshot is outside the current client scope", "EVIDENCE_SNAPSHOT_SCOPE_DENIED");
      const input = await readJsonBody(req);
      const result = await verifyEvidenceSnapshot(snapshotId, { verifiedBy: auth.id, note: input.note || null });
      await appendOpsEvent(normalizeOpsEvent({
        type: "evidence.snapshot.verified",
        actor: auth.name,
        entityType: "evidence-snapshot",
        entityId: snapshotId,
        clientId: Array.isArray(existing.clientIds) && existing.clientIds.length === 1 && existing.clientIds[0] !== "*" ? existing.clientIds[0] : null,
        source: "evidence-ledger",
        note: `Evidence snapshot ${snapshotId} verification completed with status ${result.snapshot.verificationStatus}.`,
        payload: { principalId: auth.id, snapshotId, verificationStatus: result.snapshot.verificationStatus, hashValid: result.integrity.hashValid, signatureValid: result.integrity.signatureValid }
      }));
      sendJson(res, 200, { ...result.snapshot, integrity: result.integrity, persisted: true });
      return;
    }
    if (req.method === "GET" && persistedEvidenceSnapshotMatch) {
      requirePermission(auth, "proof.snapshot.read");
      const snapshot = await readEvidenceSnapshot(decodeURIComponent(persistedEvidenceSnapshotMatch[1]));
      if (!snapshot) throw apiError(404, "Evidence snapshot not found", "EVIDENCE_SNAPSHOT_NOT_FOUND");
      if (!canAccessEvidenceSnapshot(auth, snapshot)) throw apiError(403, "Evidence snapshot is outside the current client scope", "EVIDENCE_SNAPSHOT_SCOPE_DENIED");
      sendJson(res, 200, { ...snapshot, persisted: true });
      return;
    }

    if (req.method === "GET" && pathname === "/api/production-seed") {
      requirePermission(auth, "production.seed.read");
      sendJson(res, 200, buildProductionSeed(await loadOpsDataset(dataRoot), await readOpsEvents()));
      return;
    }

    if (req.method === "GET" && pathname === "/api/assets") {
      requirePermission(auth, "assets.read");
      sendJson(res, 200, {
        generatedAt: new Date().toISOString(),
        auth: {
          principalId: auth.id,
          roleId: auth.roleId,
          clientScope: auth.clientScope,
          clientIds: auth.clientIds
        },
        assets: await buildAssetIndex(auth)
      });
      return;
    }

    if (req.method === "GET" && pathname === "/api/mobile/route") {
      requirePermission(auth, "mobile.route.read");
      sendJson(res, 200, {
        generatedAt: new Date().toISOString(),
        auth: {
          principalId: auth.id,
          roleId: auth.roleId,
          clientScope: auth.clientScope,
          clientIds: auth.clientIds
        },
        captureSchema: mobileCaptureSchema(),
        route: await buildMobileRoute(auth)
      });
      return;
    }

    if (req.method === "GET" && pathname === "/api/mobile/capture-batches") {
      requirePermission(auth, "mobile.capture.read");
      sendJson(res, 200, {
        generatedAt: new Date().toISOString(),
        auth: {
          principalId: auth.id,
          roleId: auth.roleId,
          clientScope: auth.clientScope,
          clientIds: auth.clientIds
        },
        batches: filterByClientScope(auth, await listMobileCaptureBatches(), (batch) => batch.clientId)
      });
      return;
    }

    if (req.method === "POST" && pathname === "/api/mobile/capture-batches") {
      requirePermission(auth, "mobile.capture.write");
      const input = await readJsonBody(req);
      const batchInput = input.batch && typeof input.batch === "object" ? input.batch : input;
      await validateMobileCaptureScope(auth, batchInput);
      const result = await saveMobileCaptureBatch(batchInput);
      let event = null;
      let inventory = { status: "not-recorded", items: [] };

      if (!result.duplicate) {
        const exceptionCount = result.batch.items.filter((item) => item.type === "exception").length;
        event = normalizeOpsEvent({
          type: "mobile.capture.synced",
          actor: auth.name,
          entityType: "workorder",
          entityId: result.batch.workorderId,
          clientId: result.batch.clientId,
          wallId: result.batch.wallId,
          source: "technician-mobile",
          note: `Offline capture batch ${result.batch.id} synced from ${result.batch.deviceId || "mobile device"}.`,
          payload: {
            principalId: auth.id,
            batchId: result.batch.id,
            technicianId: result.batch.technicianId,
            itemCount: result.batch.items.length,
            exceptionCount,
            duplicate: false
          }
        });
        await appendOpsEvent(event);
      }

      const consumables = mobileConsumables(batchInput);
      if (consumables.length) {
        requirePermission(auth, "inventory.consume");
        await ensurePilotInventory();
        try {
          const clientId = await assertInventoryWorkOrderAccess(auth, result.batch.workorderId, result.batch.technicianId);
          const overview = await readInventoryOverview({ technicianId: result.batch.technicianId, workOrderIds: [result.batch.workorderId] });
          const kit = overview.locations.find((item) => item.kind === "technician-kit" && item.technicianId === result.batch.technicianId);
          if (!kit) throw apiError(409, "technician route kit is not configured", "INVENTORY_ROUTE_KIT_NOT_CONFIGURED");
          const posted = await consumeInventory({ id: `CON-${result.batch.id}`, locationId: kit.id, workOrderId: result.batch.workorderId, technicianId: result.batch.technicianId, captureBatchId: result.batch.id, items: consumables, actor: auth.id, note: "Consumables posted from technician visit capture", occurredAt: result.batch.capturedAt });
          inventory = { status: "recorded", duplicate: posted.duplicate, locationId: kit.id, items: consumables, transactions: posted.transactions };
          if (!posted.duplicate) await appendOpsEvent(normalizeOpsEvent({ id: `OPS-MOBILE-CON-${result.batch.id}`, type: "inventory.mobile-consumption.recorded", actor: auth.name, entityType: "workorder", entityId: result.batch.workorderId, clientId, wallId: result.batch.wallId, source: "technician-mobile", note: `${consumables.length} consumable line(s) posted from mobile visit.`, payload: { principalId: auth.id, batchId: result.batch.id, technicianId: result.batch.technicianId, locationId: kit.id, items: consumables } }));
        } catch (error) {
          if (!String(error?.code || "").startsWith("INVENTORY_")) throw error;
          inventory = { status: "exception", code: error.code, message: error.message, items: consumables };
          if (!result.duplicate) await appendOpsEvent(normalizeOpsEvent({ id: `OPS-MOBILE-CON-EX-${result.batch.id}`, type: "inventory.mobile-consumption.exception", actor: auth.name, entityType: "workorder", entityId: result.batch.workorderId, clientId: result.batch.clientId, wallId: result.batch.wallId, source: "technician-mobile", note: `Visit evidence saved; inventory posting needs review: ${error.message}`, payload: { principalId: auth.id, batchId: result.batch.id, technicianId: result.batch.technicianId, code: error.code, items: consumables } }));
        }
      }

      sendJson(res, result.duplicate ? 200 : 201, {
        ...result,
        event,
        inventory
      });
      return;
    }

    if (req.method === "GET" && pathname === "/api/proof/media-vault") {
      requirePermission(auth, "proof.media.read");
      sendJson(res, 200, {
        generatedAt: new Date().toISOString(),
        auth: {
          principalId: auth.id,
          roleId: auth.roleId,
          clientScope: auth.clientScope,
          clientIds: auth.clientIds
        },
        uploadPolicy: proofMediaUploadPolicy(),
        objects: filterByClientScope(auth, await listProofMediaObjects(), (object) => object.clientId)
      });
      return;
    }

    if (req.method === "POST" && pathname === "/api/proof/media-intents") {
      requirePermission(auth, "proof.media.write");
      const input = await readJsonBody(req);
      const mediaInput = input.media && typeof input.media === "object" ? input.media : input;
      await validateProofMediaScope(auth, mediaInput);
      const result = await createProofMediaIntent({
        ...mediaInput,
        storageProvider: productionConfigReport().production ? "s3-compatible" : mediaInput.storageProvider
      });
      sendJson(res, result.duplicate ? 200 : 201, result);
      return;
    }

    if (req.method === "POST" && pathname === "/api/proof/media-evidence") {
      requirePermission(auth, "proof.media.write");
      const input = await readJsonBody(req);
      const existing = await readProofMediaObject(input.id);
      if (!existing) {
        throw validationError("proof media object must be created before registration", "PROOF_MEDIA_NOT_FOUND");
      }
      requireClientAccess(auth, existing.clientId, "proof media registration");
      const result = await registerProofMediaEvidence(input);
      let event = null;

      if (!result.duplicate) {
        event = normalizeOpsEvent({
          type: "proof.media.registered",
          actor: auth.name,
          entityType: "proof-media",
          entityId: result.object.id,
          clientId: result.object.clientId,
          wallId: result.object.wallId,
          source: "proof-media-vault",
          note: `Proof media ${result.object.filename} registered with SHA-256 evidence metadata.`,
          payload: {
            principalId: auth.id,
            mediaId: result.object.id,
            objectKey: result.object.objectKey,
            sha256: result.object.sha256,
            byteSize: result.object.byteSize
          }
        });
        await appendOpsEvent(event);
      }

      sendJson(res, result.duplicate ? 200 : 201, {
        ...result,
        event
      });
      return;
    }

    const proofMediaUploadMatch = pathname.match(/^\/api\/proof\/media-evidence\/([^/]+)\/upload$/);
    if (req.method === "POST" && proofMediaUploadMatch) {
      requirePermission(auth, "proof.media.write");
      const mediaId = decodeURIComponent(proofMediaUploadMatch[1]);
      const existing = await readProofMediaObject(mediaId);
      if (!existing) throw validationError("proof media object must be created before upload", "PROOF_MEDIA_NOT_FOUND");
      requireClientAccess(auth, existing.clientId, "proof media upload");
      const input = await readJsonBody(req, maxProofUploadPayloadBytes);
      const bytes = decodeBase64ProofMedia(input.fileBase64);
      const sha256 = createHash("sha256").update(bytes).digest("hex");

      if (bytes.length !== existing.byteSize) {
        throw validationError("uploaded byteSize does not match the upload intent", "PROOF_MEDIA_SIZE_MISMATCH");
      }
      if (sha256 !== existing.sha256) {
        throw validationError("uploaded sha256 does not match the upload intent", "PROOF_MEDIA_HASH_MISMATCH");
      }

      const productionStorage = productionConfigReport().production;
      let duplicate = false;
      if (productionStorage) {
        await putS3Object({
          bucket: process.env.DR_FOREST_OBJECT_STORAGE_BUCKET,
          key: existing.objectKey,
          body: bytes,
          contentType: existing.contentType
        });
        await markProofMediaStorageProvider(existing.id, "s3-compatible");
      } else {
        try {
          await writeLocalProofMedia(existing, bytes);
        } catch (error) {
          if (error?.code !== "EEXIST") throw error;
          const stored = await readLocalProofMedia(existing);
          if (!stored.equals(bytes)) throw validationError("stored proof media conflicts with this upload", "PROOF_MEDIA_STORAGE_CONFLICT");
          duplicate = true;
        }
      }

      const registration = await registerProofMediaEvidence({
        id: existing.id,
        byteSize: bytes.length,
        sha256,
        uploadedAt: input.uploadedAt || new Date().toISOString()
      });
      const event = registration.duplicate ? null : normalizeOpsEvent({
        type: "proof.media.uploaded",
        actor: auth.name,
        entityType: "proof-media",
        entityId: registration.object.id,
        clientId: registration.object.clientId,
        wallId: registration.object.wallId,
          source: productionStorage ? "proof-media-s3" : "proof-media-local-vault",
          note: productionStorage ? `Proof media ${registration.object.filename} uploaded to the private S3-compatible vault and hash checked.` : `Proof media ${registration.object.filename} uploaded to the pilot vault and hash checked.`,
        payload: { principalId: auth.id, mediaId: registration.object.id, sha256, byteSize: bytes.length }
      });
      if (event) await appendOpsEvent(event);
      sendJson(res, duplicate || registration.duplicate ? 200 : 201, {
        duplicate: duplicate || registration.duplicate,
        object: registration.object,
        event
      });
      return;
    }

    const proofMediaFileMatch = pathname.match(/^\/api\/proof\/media-evidence\/([^/]+)\/file$/);
    if (req.method === "GET" && proofMediaFileMatch) {
      requirePermission(auth, "proof.media.read");
      const mediaId = decodeURIComponent(proofMediaFileMatch[1]);
      const media = await readProofMediaObject(mediaId);
      if (!media) throw validationError("proof media object not found", "PROOF_MEDIA_NOT_FOUND");
      requireClientAccess(auth, media.clientId, "proof media download");
      if (!["registered", "verified", "rejected"].includes(media.uploadStatus)) {
        throw validationError("proof media file is not uploaded", "PROOF_MEDIA_NOT_UPLOADED");
      }
      if (productionConfigReport().production && media.scanStatus !== "clean") {
        throw apiError(409, "proof media requires a clean malware scan before download", "PROOF_MEDIA_SCAN_REQUIRED");
      }
      const stored = media.storageProvider === "s3-compatible"
        ? await getS3Object({ bucket: process.env.DR_FOREST_OBJECT_STORAGE_BUCKET, key: media.objectKey })
        : { bytes: await readLocalProofMedia(media) };
      const bytes = stored.bytes;
      const storedHash = createHash("sha256").update(bytes).digest("hex");
      if (bytes.length !== media.byteSize || storedHash !== media.sha256) throw validationError("object storage bytes do not match the proof media ledger", "PROOF_MEDIA_REMOTE_INTEGRITY_MISMATCH");
      sendProofMedia(res, media, bytes);
      return;
    }

    const proofMediaVerifyMatch = pathname.match(/^\/api\/proof\/media-evidence\/([^/]+)\/verify$/);
    if (req.method === "PUT" && proofMediaVerifyMatch) {
      requirePermission(auth, "proof.media.verify");
      const mediaId = decodeURIComponent(proofMediaVerifyMatch[1]);
      const existing = await readProofMediaObject(mediaId);
      if (!existing) {
        throw validationError("proof media object must exist before verification", "PROOF_MEDIA_NOT_FOUND");
      }
      requireClientAccess(auth, existing.clientId, "proof media verification");
      const input = await readJsonBody(req);
      const object = await verifyProofMediaEvidence(mediaId, {
        ...input,
        verifiedBy: input.verifiedBy || auth.name
      });
      const event = normalizeOpsEvent({
        type: `proof.media.${object.uploadStatus}`,
        actor: auth.name,
        entityType: "proof-media",
        entityId: object.id,
        clientId: object.clientId,
        wallId: object.wallId,
        source: "proof-media-vault",
        note: `Proof media ${object.filename} marked ${object.uploadStatus}.`,
        payload: {
          principalId: auth.id,
          mediaId: object.id,
          objectKey: object.objectKey,
          status: object.uploadStatus,
          verificationNote: object.verificationNote
        }
      });
      await appendOpsEvent(event);
      sendJson(res, 200, {
        object,
        event
      });
      return;
    }

    const proofMediaScanMatch = pathname.match(/^\/api\/proof\/media-evidence\/([^/]+)\/scan$/);
    if (req.method === "PUT" && proofMediaScanMatch) {
      requirePermission(auth, "proof.media.verify");
      const mediaId = decodeURIComponent(proofMediaScanMatch[1]);
      const existing = await readProofMediaObject(mediaId);
      if (!existing) throw validationError("proof media object must exist before scanning", "PROOF_MEDIA_NOT_FOUND");
      requireClientAccess(auth, existing.clientId, "proof media scan recording");
      const input = await readJsonBody(req);
      const result = await recordProofMediaScan(mediaId, {
        ...input,
        recordedBy: input.recordedBy || auth.name
      });
      const event = result.duplicate ? null : normalizeOpsEvent({
        type: `proof.media.scan.${result.scan.status}`,
        actor: auth.name,
        entityType: "proof-media",
        entityId: result.object.id,
        clientId: result.object.clientId,
        wallId: result.object.wallId,
        source: "proof-media-scan-callback",
        note: `Proof media ${result.object.filename} received a ${result.scan.status} scan result from ${result.scan.provider}.`,
        payload: {
          principalId: auth.id,
          mediaId: result.object.id,
          scanId: result.scan.scanId,
          provider: result.scan.provider,
          status: result.scan.status,
          sha256: result.scan.sha256,
          scannedAt: result.scan.scannedAt,
          recordedBy: result.scan.recordedBy
        }
      });
      if (event) await appendOpsEvent(event);
      sendJson(res, result.duplicate ? 200 : 201, { ...result, event, policyVersion: mediaScanPolicyVersion });
      return;
    }

    if (req.method === "GET" && pathname === "/api/ops-events") {
      requirePermission(auth, "ops.events.read");
      const resolveEntityClientId = await buildEntityClientResolver();
      sendJson(res, 200, {
        generatedAt: new Date().toISOString(),
        auth: {
          principalId: auth.id,
          roleId: auth.roleId,
          clientScope: auth.clientScope,
          clientIds: auth.clientIds
        },
        events: filterOpsEventsForAuth(await readOpsEvents(), auth, resolveEntityClientId)
      });
      return;
    }

    if (req.method === "GET" && pathname === "/api/ops-state") {
      requirePermission(auth, "ops.state.read");
      const snapshot = await filterOpsStateForAuth(await readOpsState(), auth);
      sendJson(res, 200, {
        ...snapshot,
        auth: {
          principalId: auth.id,
          roleId: auth.roleId,
          clientScope: auth.clientScope,
          clientIds: auth.clientIds
        },
        summary: summarizeOpsState(snapshot)
      });
      return;
    }

    if (req.method === "POST" && pathname === "/api/ops-events") {
      const input = await readJsonBody(req);
      const event = normalizeOpsEvent(input);
      requireEventWriteAccess(auth, event);
      await appendOpsEvent(event);
      sendJson(res, 201, { event });
      return;
    }

    if (req.method === "POST" && pathname === "/api/ops-state/snapshot") {
      const input = await readJsonBody(req);
      const event = input.event ? normalizeOpsEvent({
        source: "state-snapshot",
        ...input.event
      }) : null;
      requireSnapshotWriteAccess(auth, event);
      const snapshot = await saveOpsStateSnapshot(input, event);
      if (event) await appendOpsEvent(event);
      sendJson(res, 200, {
        ...snapshot,
        event,
        summary: summarizeOpsState(snapshot)
      });
      return;
    }

    if (req.method === "POST" && pathname === "/api/ops-state/actions") {
      const input = await readJsonBody(req);
      const action = input.action && typeof input.action === "object" ? input.action : input;
      requireActionAccess(auth, action);
      const event = normalizeOpsEvent({
        type: action.type,
        actor: action.actor,
        entityType: action.entityType,
        entityId: action.entityId,
        clientId: action.clientId || null,
        wallId: action.wallId || null,
        source: "state-action",
        note: action.note || "",
        payload: {
          auditEventId: action.auditEvent?.id || null,
          actionType: action.type
        }
      });
      const result = await applyOpsStateAction({
        expectedRevision: input.expectedRevision,
        action
      }, event);
      await appendOpsEvent(event);
      sendJson(res, 200, {
        ...result.snapshot,
        action: result.action,
        event,
        summary: summarizeOpsState(result.snapshot)
      });
      return;
    }

    sendJson(res, 404, { error: "API endpoint not found" });
  } catch (error) {
    recordApplicationError(error);
    const status = Number(error.status || 500);
    const payload = {
      error: status >= 500 ? "Internal server error" : error.message
    };
    if (error.code) payload.code = error.code;
    if (error.details && status < 500) payload.details = error.details;
    if (error.retryAfter) payload.retryAfterSeconds = error.retryAfter;
    if (status === 409 && error.snapshot) {
      payload.currentRevision = error.currentRevision;
      payload.snapshot = {
        ...error.snapshot,
        summary: summarizeOpsState(error.snapshot)
      };
    }
    sendJson(res, status, payload);
  }
}

const server = createServer(async (req, res) => {
  const startedAt = Date.now();
  const requestId = String(req.headers["x-request-id"] || randomUUID());
  req.requestId = requestId;
  res.setHeader("X-Request-ID", requestId);
  res.once("finish", () => {
    const durationMs = Date.now() - startedAt;
    recordHttpRequest({ method: req.method, path: String(req.url || "/").split("?")[0], status: res.statusCode, durationMs });
    console.log(JSON.stringify({
      event: "http.request",
      requestId,
      method: req.method,
      path: String(req.url || "/").split("?")[0],
      status: res.statusCode,
      durationMs,
      userAgent: String(req.headers["user-agent"] || "").slice(0, 160)
    }));
  });
  const requestPath = (req.url || "/").replace(/^\/+/, "/");
  const requestUrl = new URL(requestPath, `http://${host}:${port}`);
  if (draining && requestUrl.pathname !== "/api/health" && requestUrl.pathname !== "/api/health/ready") {
    sendJson(res, 503, { error: "Service is draining", code: "SERVICE_DRAINING" });
    return;
  }
  if (requestUrl.pathname.startsWith("/api/")) {
    const apiTask = () => handleApi(req, res, requestUrl.pathname);
    if (productionMasterDataEnabled() || ["/api/health", "/api/health/ready"].includes(requestUrl.pathname)) await apiTask();
    else await enqueuePilotApi(apiTask);
    return;
  }

  const filePath = resolvePath(requestPath);
  if (!filePath) {
    sendText(res, 403, "Forbidden");
    return;
  }

  try {
    const body = await readFile(filePath);
    res.writeHead(200, {
      "Content-Type": types[extname(filePath)] || "application/octet-stream",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "Referrer-Policy": "no-referrer",
      "Permissions-Policy": "camera=(self), microphone=(), geolocation=()",
      "Content-Security-Policy": "default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
    });
    res.end(body);
  } catch {
    sendText(res, 404, "Not found");
  }
});

server.listen(port, host, () => {
  console.log(`DR FOREST FM Ops running at http://${host}:${port}/`);
});

async function shutdown(signal) {
  if (shutdownPromise) return shutdownPromise;
  draining = true;
  shutdownPromise = new Promise((resolve) => {
    console.log(JSON.stringify({ event: "server.shutdown.start", signal, port }));
    server.close(async () => {
      try { await closePostgresPools(); } finally {
        console.log(JSON.stringify({ event: "server.shutdown.complete", signal, port }));
        resolve();
      }
    });
    const timeout = setTimeout(() => {
      console.error(JSON.stringify({ event: "server.shutdown.timeout", signal, port }));
      process.exitCode = 1;
      resolve();
    }, Number(process.env.DR_FOREST_SHUTDOWN_TIMEOUT_MS || 15_000));
    timeout.unref?.();
  });
  await shutdownPromise;
  process.exit(process.exitCode || 0);
}

process.once("SIGTERM", () => { void shutdown("SIGTERM"); });
process.once("SIGINT", () => { void shutdown("SIGINT"); });
if (typeof process.send === "function") process.on("message", (message) => { if (message === "shutdown") void shutdown("IPC"); });
