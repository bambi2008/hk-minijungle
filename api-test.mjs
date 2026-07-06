import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const host = "127.0.0.1";
const testDataDir = await mkdtemp(join(tmpdir(), "grow-clinic-api-"));
process.env.GROW_CLINIC_DATA_DIR = testDataDir;
const protectedDataFiles = [
  join(process.cwd(), "data", "diagnosis-reports.json"),
  join(process.cwd(), "data", "notification-jobs.json")
];

async function fileHash(path) {
  try {
    return createHash("sha256").update(await readFile(path)).digest("hex");
  } catch {
    return null;
  }
}

async function dataFileSnapshot() {
  return Object.fromEntries(await Promise.all(
    protectedDataFiles.map(async (path) => [path, await fileHash(path)])
  ));
}

async function assertProtectedDataUnchanged(before) {
  const after = await dataFileSnapshot();
  const changed = protectedDataFiles.filter((path) => before[path] !== after[path]);
  if (changed.length) {
    throw new Error(`API tests modified protected demo data: ${changed.join(", ")}`);
  }
}

const protectedDataBefore = await dataFileSnapshot();
const { server, closeStorage } = await import("./server.mjs");

await new Promise((resolve) => server.listen(0, host, resolve));
const { port } = server.address();
const base = `http://${host}:${port}`;
const smokeCaseId = `case-api-smoke-${Date.now()}`;

try {
  const createResponse = await fetch(`${base}/api/reports`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      crop: "矮生番茄",
      cropKey: "tomato",
      device: "Xponge DIY 超薄根区",
      deviceKey: "xponge-diy",
      deviceFit: "caution",
      caseId: smokeCaseId,
      caseName: "API smoke tomato case",
      stage: "开花期",
      stageKey: "flowering",
      medium: "超薄 Xponge",
      mediumKey: "xponge",
      createdAt: "2026-01-01T00:00:00.000Z",
      topRisk: "API 测试",
      severity: "高优先级",
      photoQuality: {
        confidence: 42,
        decision: { status: "需要复查", next: "补拍根区并复查" }
      },
      reminderPlan: {
        items: [
          { key: "24h", label: "24h", task: "check roots" },
          { key: "48h", label: "48h", task: "check leaves" }
        ]
      },
      report: "api smoke test",
      test: true
    })
  });

  if (createResponse.status !== 201) {
    throw new Error(`POST /api/reports failed: ${createResponse.status}`);
  }

  const saved = await createResponse.json();
  const listResponse = await fetch(`${base}/api/reports?crop=tomato&medium=xponge`);
  if (listResponse.status !== 200) {
    throw new Error(`GET /api/reports failed: ${listResponse.status}`);
  }

  const list = await listResponse.json();
  if (!list.some((item) => item.id === saved.id)) {
    throw new Error("Saved report was not found in filtered list");
  }

  const detailResponse = await fetch(`${base}/api/reports/${saved.id}`);
  if (detailResponse.status !== 200) {
    throw new Error(`GET /api/reports/:id failed: ${detailResponse.status}`);
  }

  const detail = await detailResponse.json();
  if (detail.report !== "api smoke test") {
    throw new Error("Report detail payload mismatch");
  }

  const improvedResponse = await fetch(`${base}/api/reports`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      crop: "鐭敓鐣寗",
      cropKey: "tomato",
      device: "Xponge DIY 瓒呰杽鏍瑰尯",
      deviceKey: "xponge-diy",
      deviceFit: "caution",
      caseId: smokeCaseId,
      caseName: "API smoke tomato case",
      stage: "寮€鑺辨湡",
      stageKey: "flowering",
      medium: "瓒呰杽 Xponge",
      mediumKey: "xponge",
      createdAt: "2026-01-02T00:00:00.000Z",
      topRisk: "API trend improved",
      severity: "观察",
      photoQuality: {
        confidence: 90,
        decision: { status: "可以判断", next: "保持当前处方" },
        signals: {
          greenRatio: 0.3,
          yellowRatio: 0.22,
          darkRatio: 0.18
        }
      },
      reminderPlan: {
        items: [
          { key: "24h", label: "24h", task: "check roots", completedAt: new Date().toISOString() }
        ]
      },
      logs: [
        { day: "48h", leaf: "better", flower: "better", pest: "unknown", notes: "new growth improved" }
      ],
      report: "api smoke trend test",
      test: true
    })
  });

  if (improvedResponse.status !== 201) {
    throw new Error(`POST improved /api/reports failed: ${improvedResponse.status}`);
  }

  const followupResponse = await fetch(`${base}/api/reports`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      eventType: "followup",
      followupLogId: `followup-api-smoke-${Date.now()}`,
      followupSource: "customer-photo-upload",
      crop: "Tomato",
      cropKey: "tomato",
      device: "Xponge DIY",
      deviceKey: "xponge-diy",
      caseId: smokeCaseId,
      caseName: "API smoke tomato case",
      stage: "Flowering",
      stageKey: "flowering",
      medium: "Xponge",
      mediumKey: "xponge",
      createdAt: "2026-01-03T00:00:00.000Z",
      topRisk: "Follow-up improved",
      severity: "low",
      photoQuality: {
        confidence: 95,
        decision: { status: "自动复查", next: "Keep current prescription" },
        signals: {
          greenRatio: 0.42,
          yellowRatio: 0.12,
          darkRatio: 0.11
        }
      },
      logs: [
        { day: "day3", leaf: "better", flower: "better", pest: "unknown", notes: "follow-up photo improved" }
      ],
      report: "api smoke followup event",
      test: true
    })
  });

  if (followupResponse.status !== 201) {
    throw new Error(`POST followup /api/reports failed: ${followupResponse.status}`);
  }

  const followupSaved = await followupResponse.json();

  const casesResponse = await fetch(`${base}/api/cases`);
  if (casesResponse.status !== 200) {
    throw new Error(`GET /api/cases failed: ${casesResponse.status}`);
  }

  const cases = await casesResponse.json();
  if (!cases.some((item) => item.id === smokeCaseId && item.reportCount >= 3 && item.trend?.state === "improving")) {
    throw new Error("Cases payload missing saved case");
  }

  const caseDetailResponse = await fetch(`${base}/api/cases/${smokeCaseId}`);
  if (caseDetailResponse.status !== 200) {
    throw new Error(`GET /api/cases/:id failed: ${caseDetailResponse.status}`);
  }

  const caseDetail = await caseDetailResponse.json();
  if (!caseDetail.timeline.some((item) => item.id === saved.id)) {
    throw new Error("Case detail timeline missing saved report");
  }
  if (!caseDetail.timeline.some((item) => item.id === followupSaved.id && item.eventType === "followup")) {
    throw new Error("Case detail timeline missing follow-up event");
  }
  const followupTimeline = caseDetail.timeline.find((item) => item.id === followupSaved.id);
  if (
    followupTimeline.colorSignals?.greenRatio !== 0.42 ||
    followupTimeline.colorSignals?.yellowRatio !== 0.12 ||
    followupTimeline.progress?.leaf !== "better"
  ) {
    throw new Error("Case follow-up visual signal payload mismatch");
  }
  if (
    caseDetail.trend?.state !== "improving" ||
    caseDetail.trend?.reminder?.key !== "day7" ||
    !Date.parse(caseDetail.trend?.reminder?.dueAt || "") ||
    !caseDetail.timeline.every((item) => Number.isFinite(item.riskScore))
  ) {
    throw new Error("Case trend payload mismatch");
  }

  const syncResponse = await fetch(`${base}/api/notifications/sync-case-trends`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      channels: ["in-app", "email", "wechat"],
      channelTargets: { email: "test@example.com", wechat: "openid-smoke" }
    })
  });
  if (syncResponse.status !== 201) {
    throw new Error(`POST /api/notifications/sync-case-trends failed: ${syncResponse.status}`);
  }

  const synced = await syncResponse.json();
  const syncedCaseJob = synced.created.find((job) => job.caseId === smokeCaseId && job.source === "case-trend" && job.reminderKey === "day7");
  if (
    !syncedCaseJob ||
    !syncedCaseJob.template?.id?.includes("tomato") ||
    !syncedCaseJob.template?.channelMessages?.email ||
    !syncedCaseJob.channelStatuses?.some((item) => item.channel === "email" && item.target === "test@example.com") ||
    !syncedCaseJob.channelStatuses?.some((item) => item.channel === "wechat")
  ) {
    throw new Error("Case trend notification sync payload mismatch");
  }

  const insightsResponse = await fetch(`${base}/api/insights`);
  if (insightsResponse.status !== 200) {
    throw new Error(`GET /api/insights failed: ${insightsResponse.status}`);
  }

  const insights = await insightsResponse.json();
  if (!Number.isFinite(insights.totalReports) || !Array.isArray(insights.topRisks) || !Array.isArray(insights.devices)) {
    throw new Error("Insights payload mismatch");
  }

  const opportunitiesResponse = await fetch(`${base}/api/opportunities`);
  if (opportunitiesResponse.status !== 200) {
    throw new Error(`GET /api/opportunities failed: ${opportunitiesResponse.status}`);
  }

  const opportunities = await opportunitiesResponse.json();
  if (!Array.isArray(opportunities) || !opportunities[0]?.title) {
    throw new Error("Opportunities payload mismatch");
  }

  const strategyResponse = await fetch(`${base}/api/product-strategy`);
  if (strategyResponse.status !== 200) {
    throw new Error(`GET /api/product-strategy failed: ${strategyResponse.status}`);
  }

  const strategy = await strategyResponse.json();
  if (
    !strategy.positioning?.includes("PictureThis") ||
    !strategy.competitorBenchmarks.some((item) => item.name === "Gardyn") ||
    !strategy.modules.some((item) => item.title.includes("LetPot"))
  ) {
    throw new Error("Product strategy payload mismatch");
  }

  const experimentsResponse = await fetch(`${base}/api/experiments`);
  if (experimentsResponse.status !== 200) {
    throw new Error(`GET /api/experiments failed: ${experimentsResponse.status}`);
  }

  const experiments = await experimentsResponse.json();
  if (!Array.isArray(experiments) || !experiments[0]?.hypothesis) {
    throw new Error("Experiments payload mismatch");
  }

  const p2GrowthResponse = await fetch(`${base}/api/p2-growth`);
  if (p2GrowthResponse.status !== 200) {
    throw new Error(`GET /api/p2-growth failed: ${p2GrowthResponse.status}`);
  }

  const p2Growth = await p2GrowthResponse.json();
  if (
    p2Growth.version !== "fivecrop-p2-growth-v1" ||
    !p2Growth.labeling?.requiredFields?.includes("finalOutcome") ||
    !p2Growth.monetization?.paidBoundaries?.includes("expert_correction")
  ) {
    throw new Error("P2 growth payload mismatch");
  }

  const cropModelsResponse = await fetch(`${base}/api/crop-models`);
  if (cropModelsResponse.status !== 200) {
    throw new Error(`GET /api/crop-models failed: ${cropModelsResponse.status}`);
  }

  const cropModels = await cropModelsResponse.json();
  if (!cropModels.tomato?.requiredPhotos?.includes("flower")) {
    throw new Error("Crop models payload mismatch");
  }

  const integrationsResponse = await fetch(`${base}/api/integrations/status`);
  if (integrationsResponse.status !== 200) {
    throw new Error(`GET /api/integrations/status failed: ${integrationsResponse.status}`);
  }
  const integrations = await integrationsResponse.json();
  if (
    !integrations.items?.some((item) => item.key === "vision-ai") ||
    !integrations.items?.some((item) => item.key === "auxiliary-llm") ||
    !integrations.items?.some((item) => item.key === "real-notifications") ||
    !integrations.items?.some((item) => item.key === "sensor-bridge") ||
    !integrations.items?.some((item) => item.key === "native-camera")
  ) {
    throw new Error("Integration status payload mismatch");
  }

  const sensorResponse = await fetch(`${base}/api/sensors/ingest`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      source: "xponge-controller",
      deviceId: "sensor-smoke",
      readings: {
        moisture: 61,
        waterLevel: 2.4,
        lightHours: 14,
        temperature: 25,
        humidity: 56,
        ec: 1.5,
        ph: 6.2
      }
    })
  });
  if (sensorResponse.status !== 200) {
    throw new Error(`POST /api/sensors/ingest failed: ${sensorResponse.status}`);
  }
  const sensor = await sensorResponse.json();
  if (
    sensor.integrationContract?.version !== "sensor-bridge-v1" ||
    sensor.diagnosisFields.sensorMoisture !== 61 ||
    sensor.diagnosisFields.reservoir !== 2.4 ||
    !sensor.activeReadings.includes("ec")
  ) {
    throw new Error("Sensor ingest payload mismatch");
  }

  const knowledgeGraphResponse = await fetch(`${base}/api/knowledge-graph?crop=tomato&stage=flowering`);
  if (knowledgeGraphResponse.status !== 200) {
    throw new Error(`GET /api/knowledge-graph failed: ${knowledgeGraphResponse.status}`);
  }

  const knowledgeGraph = await knowledgeGraphResponse.json();
  if (
    knowledgeGraph.stats.visiblePathways < 1 ||
    knowledgeGraph.stats.pathologyConditions < 1 ||
    !knowledgeGraph.pathology?.conditions?.some((item) => item.id === "tomato-blossom-drop-heat-pollination") ||
    !knowledgeGraph.pathways.some((item) => item.id === "tomato-flower-no-fruit") ||
    !knowledgeGraph.graph.nodes.some((node) => node.type === "photo_signal")
  ) {
    throw new Error("Knowledge graph payload mismatch");
  }

  const pathologyResponse = await fetch(`${base}/api/pathology-library?crop=basil`);
  if (pathologyResponse.status !== 200) {
    throw new Error(`GET /api/pathology-library failed: ${pathologyResponse.status}`);
  }
  const pathology = await pathologyResponse.json();
  if (
    pathology.stats.conditions < 45 ||
    pathology.stats.visibleConditions < 13 ||
    pathology.expertLayer?.evidenceVersion !== "fivecrop-expert-evidence-v1" ||
    !pathology.conditions.some((item) => item.id === "basil-leggy-low-light") ||
    !pathology.conditions.some((item) => item.id === "basil-black-leg-root-rot") ||
    !pathology.conditions.some((item) => item.id === "basil-chewing-pest-leaf-holes") ||
    !pathology.conditions.some((item) => item.id === "basil-leaf-powdery-gray-mold-humidity") ||
    !pathology.conditions.some((item) => item.id === "basil-transplant-shock-wilting") ||
    !pathology.conditions.some((item) => item.id === "basil-weak-aroma-light-nitrogen-harvest") ||
    !pathology.conditions.every((item) => item.expertEvidence?.decisionRule && item.prescriptionProtocol?.doNot?.length) ||
    !pathology.conditions.every((item) => item.cropKey === "basil") ||
    !pathology.sourceIndex?.["ncsu-basil"]
  ) {
    throw new Error("Pathology library payload mismatch");
  }

  const validationResponse = await fetch(`${base}/api/case-validation`);
  if (validationResponse.status !== 200) {
    throw new Error(`GET /api/case-validation failed: ${validationResponse.status}`);
  }
  const validation = await validationResponse.json();
  if (
    validation.validation?.ready !== true ||
    validation.stats.conditions !== 45 ||
    validation.stats.photoFixtures < 180 ||
    validation.stats.minPhotosPerCondition < 3 ||
    !validation.cases.every((item) => item.photoFixtures?.length >= 3 && item.expertEvidence?.decisionRule && item.prescriptionProtocol?.oneAction)
  ) {
    throw new Error("Case validation payload mismatch");
  }

  const correctionResponse = await fetch(`${base}/api/expert-corrections`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      cropKey: "basil",
      conditionId: "basil-leggy-low-light",
      predictedDiagnosis: "Basil low-light leggy growth",
      correctedDiagnosis: "Basil leggy growth with missed pruning",
      finalOutcome: "confirmed_by_expert",
      correctionReason: "Internode evidence is valid, but pruning history changes the primary action."
    })
  });
  if (correctionResponse.status !== 201) {
    throw new Error(`POST /api/expert-corrections failed: ${correctionResponse.status}`);
  }
  const savedCorrection = await correctionResponse.json();
  if (savedCorrection.conditionId !== "basil-leggy-low-light" || !savedCorrection.id) {
    throw new Error("Expert correction persistence payload mismatch");
  }
  const correctionListResponse = await fetch(`${base}/api/expert-corrections?conditionId=basil-leggy-low-light`);
  const correctionList = await correctionListResponse.json();
  if (correctionList.stats?.corrections < 1 || !correctionList.corrections.some((item) => item.id === savedCorrection.id)) {
    throw new Error("Expert correction list payload mismatch");
  }
  const correctedPathologyResponse = await fetch(`${base}/api/pathology-library?crop=basil`);
  const correctedPathology = await correctedPathologyResponse.json();
  const correctedCondition = correctedPathology.conditions.find((item) => item.id === "basil-leggy-low-light");
  if (!correctedCondition?.correctionSummary || correctedCondition.correctionSummary.count < 1) {
    throw new Error("Expert correction did not feed back into pathology library");
  }

  const publicPhotoRecordResponse = await fetch(`${base}/api/public-photo-test-records`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      fixtureGroupId: "tomato-blossom-drop-public-print",
      cropKey: "tomato",
      goldenPath: "tomato blossom drop",
      expectedConditionId: "tomato-blossom-drop-heat-pollination",
      sourceNumber: 2,
      captureVariant: "straight",
      result: "captured",
      source: "mobile-capture",
      appCropResult: "tomato",
      appConditionResult: "tomato-blossom-drop-heat-pollination"
    })
  });
  if (publicPhotoRecordResponse.status !== 201) {
    throw new Error(`POST /api/public-photo-test-records failed: ${publicPhotoRecordResponse.status}`);
  }
  const publicPhotoSaved = await publicPhotoRecordResponse.json();
  if (
    !publicPhotoSaved.id ||
    publicPhotoSaved.fixtureGroupId !== "tomato-blossom-drop-public-print" ||
    publicPhotoSaved.sourceNumber !== 2 ||
    publicPhotoSaved.captureVariant !== "straight"
  ) {
    throw new Error("Public photo test record persistence payload mismatch");
  }
  const publicPhotoListResponse = await fetch(`${base}/api/public-photo-test-records`);
  const publicPhotoList = await publicPhotoListResponse.json();
  if (!publicPhotoList.records?.some((item) => item.id === publicPhotoSaved.id && item.source === "mobile-capture")) {
    throw new Error("Public photo test record list payload mismatch");
  }
  const publicPhotoClearResponse = await fetch(`${base}/api/public-photo-test-records`, { method: "DELETE" });
  if (publicPhotoClearResponse.status !== 200) {
    throw new Error(`DELETE /api/public-photo-test-records failed: ${publicPhotoClearResponse.status}`);
  }
  const publicPhotoAfterClear = await (await fetch(`${base}/api/public-photo-test-records`)).json();
  if (publicPhotoAfterClear.records?.length !== 0) {
    throw new Error("Public photo test records were not cleared");
  }

  const goldenPathsResponse = await fetch(`${base}/api/golden-paths`);
  if (goldenPathsResponse.status !== 200) {
    throw new Error(`GET /api/golden-paths failed: ${goldenPathsResponse.status}`);
  }
  const goldenPaths = await goldenPathsResponse.json();
  const expectedGolden = {
    tomato: "tomato-flower-no-fruit",
    basil: "basil-leggy-low-light",
    rosemary: "rosemary-wet-root-decline",
    strawberry: "strawberry-crown-wet",
    pepper: "pepper-flower-drop"
  };
  if (goldenPaths.product !== "FiveCrop: Plant Doctor" || goldenPaths.paths?.length !== 5) {
    throw new Error("Golden paths summary mismatch");
  }
  Object.entries(expectedGolden).forEach(([cropKey, pathwayId]) => {
    const item = goldenPaths.paths.find((path) => path.cropKey === cropKey);
    if (
      !item ||
      item.pathwayId !== pathwayId ||
      !item.pathway?.requiredPhotos?.length ||
      !item.prescription?.length ||
      !item.followup?.when ||
      !item.followup?.photo ||
      !item.followup?.success ||
      !item.runnableFlow?.photo ||
      !item.runnableFlow?.diagnosis ||
      !item.runnableFlow?.action ||
      !item.runnableFlow?.followup ||
      !item.runnableFlow?.success
    ) {
      throw new Error(`Golden path payload mismatch for ${cropKey}`);
    }
  });
  const strawberryGolden = goldenPaths.paths.find((path) => path.cropKey === "strawberry");
  if (
    !strawberryGolden.relatedPathways?.some((pathway) => pathway.id === "strawberry-flower-no-fruit") ||
    !strawberryGolden.photoSequence.includes("flower") ||
    !strawberryGolden.photoSequence.includes("root")
  ) {
    throw new Error("Strawberry golden path should cover pollination and wet crown");
  }

  const visionResponse = await fetch(`${base}/api/vision/analyze`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      photoType: "leaf",
      fileName: "yellow-leaf.jpg",
      capturedPhotoTypes: ["plant"],
      clientPipeline: {
        version: "ai-pipeline-v1",
        readyForRealVision: true,
        photoQualityGate: { version: "photo-gate-v1", state: "pass", score: 94 }
      },
      context: { cropKey: "tomato", stageKey: "flowering", mediumKey: "xponge", concern: "yellow" },
      signals: { yellowRatio: 0.3, greenRatio: 0.2, darkRatio: 0.1, brightness: 120, contrast: 40, width: 1024, height: 768 }
    })
  });
  if (visionResponse.status !== 200) {
    throw new Error(`POST /api/vision/analyze failed: ${visionResponse.status}`);
  }

  const vision = await visionResponse.json();
  if (
    !vision.readyForAiProvider ||
    vision.modelInput.cropKey !== "tomato" ||
    vision.requestedCropKey !== "tomato" ||
    vision.detectedCropKey !== "unknown" ||
    vision.needsCropVerification !== true ||
    vision.hasCropIdentityEvidence !== false ||
    vision.clientPipeline?.version !== "ai-pipeline-v1" ||
    !vision.integrationContract?.canSwapProviderWithoutUiChange ||
    !vision.labels.some((item) => item.label === "yellowing") ||
    !vision.diagnosisHints.includes("yellow-leaves") ||
    !vision.missingPhotos.includes("root")
  ) {
    throw new Error("Vision adapter payload mismatch");
  }

  const compareResponse = await fetch(`${base}/api/vision/compare`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      context: "leaf",
      before: { signals: { yellowRatio: 0.3, greenRatio: 0.2, darkRatio: 0.2 } },
      after: { signals: { yellowRatio: 0.15, greenRatio: 0.25, darkRatio: 0.1 } }
    })
  });
  if (compareResponse.status !== 200) {
    throw new Error(`POST /api/vision/compare failed: ${compareResponse.status}`);
  }

  const comparison = await compareResponse.json();
  if (comparison.trend !== "improved") {
    throw new Error("Vision comparison payload mismatch");
  }

  const assistantResponse = await fetch(`${base}/api/assistant/diagnosis`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      crop: "basil",
      stage: "vegetative",
      findings: [
        {
          title: "罗勒弱光徒长",
          score: 88,
          why: "节间变长且补光不足。",
          action: "把补光稳定到 12-14 小时，并从节点上方掐顶。"
        }
      ],
      pathologyMatches: [
        {
          id: "basil-leggy-low-light",
          title: "罗勒弱光徒长",
          summary: "弱光和灯距过远会让节间拉长、叶片变小、香味变淡。",
          confidence: 91,
          evidence: ["节间长", "顶部追光"],
          differentials: ["过密抢光", "迟迟没有采收"],
          missingInfo: ["灯距", "最近一次修剪时间"],
          action: "把补光稳定到 12-14 小时，并从节点上方掐顶促侧枝。",
          followup: { photo: "整株侧面" }
        }
      ],
      photoQuality: { required: ["plant", "leaf"] }
    })
  });
  if (assistantResponse.status !== 200) {
    throw new Error(`POST /api/assistant/diagnosis failed: ${assistantResponse.status}`);
  }
  const assistant = await assistantResponse.json();
  if (
    assistant.provider !== "local-pathology-assistant" ||
    assistant.integrationContract?.version !== "fivecrop-auxiliary-llm-v1" ||
    !assistant.evidence?.includes("节间长") ||
    !assistant.nextAction?.includes("补光")
  ) {
    throw new Error("Assistant diagnosis fallback payload mismatch");
  }

  const storageResponse = await fetch(`${base}/api/storage/status`);
  if (storageResponse.status !== 200) {
    throw new Error(`GET /api/storage/status failed: ${storageResponse.status}`);
  }

  const storage = await storageResponse.json();
  if (storage.engine !== "sqlite" || !Number.isFinite(storage.counts.reports) || !Number.isFinite(storage.counts.cases)) {
    throw new Error("Storage status payload mismatch");
  }

  const notificationsResponse = await fetch(`${base}/api/notifications/schedule`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      reportId: saved.id,
      channels: ["in-app", "sms"],
      channelTargets: { sms: "+15550000000" },
      reminderPlan: {
        items: [
          { key: "24h", label: "24h", dueAt: new Date().toISOString(), task: "check pests", photo: "leaf back" }
        ]
      }
    })
  });
  if (notificationsResponse.status !== 201) {
    throw new Error(`POST /api/notifications/schedule failed: ${notificationsResponse.status}`);
  }

  const createdJobs = await notificationsResponse.json();
  if (
    !createdJobs[0].template?.channelMessages?.sms ||
    !createdJobs[0].channelStatuses?.some((item) => item.channel === "sms" && item.target === "+15550000000")
  ) {
    throw new Error("Notification channel status payload mismatch");
  }
  const dueResponse = await fetch(`${base}/api/notifications/due`);
  if (dueResponse.status !== 200) {
    throw new Error(`GET /api/notifications/due failed: ${dueResponse.status}`);
  }

  const simulateResponse = await fetch(`${base}/api/notifications/${createdJobs[0].id}/simulate-send`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({})
  });
  if (simulateResponse.status !== 200) {
    throw new Error(`POST /api/notifications/:id/simulate-send failed: ${simulateResponse.status}`);
  }
  const simulatedJob = await simulateResponse.json();
  if (simulatedJob.status !== "sent" || !simulatedJob.channelStatuses?.every((item) => item.status === "sent")) {
    throw new Error("Notification simulate send payload mismatch");
  }

  const patchResponse = await fetch(`${base}/api/notifications/${createdJobs[0].id}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ status: "sent", providerResponse: { ok: true } })
  });
  if (patchResponse.status !== 200) {
    throw new Error(`PATCH /api/notifications/:id failed: ${patchResponse.status}`);
  }
  const patchedJob = await patchResponse.json();
  if (!patchedJob.channelStatuses?.every((item) => item.status === "sent")) {
    throw new Error("Notification channel patch status mismatch");
  }

  const missingTargetResponse = await fetch(`${base}/api/notifications/schedule`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      reportId: saved.id,
      channels: ["email"],
      reminderPlan: {
        items: [
          { key: "48h", label: "48h", dueAt: new Date().toISOString(), task: "missing target smoke", photo: "plant" }
        ]
      }
    })
  });
  const missingTargetJobs = await missingTargetResponse.json();
  const missingTargetSimulate = await fetch(`${base}/api/notifications/${missingTargetJobs[0].id}/simulate-send`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({})
  });
  const missingTargetJob = await missingTargetSimulate.json();
  if (
    missingTargetJob.status !== "failed" ||
    missingTargetJob.channelStatuses?.[0]?.status !== "failed" ||
    !missingTargetJob.failureSuggestions?.some((item) => item.channel === "email")
  ) {
    throw new Error("Notification simulate missing target mismatch");
  }

  const retryMissingTarget = await fetch(`${base}/api/notifications/${missingTargetJobs[0].id}/retry-failed`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ channelTargets: { email: "retry@example.com" } })
  });
  if (retryMissingTarget.status !== 200) {
    throw new Error(`POST /api/notifications/:id/retry-failed failed: ${retryMissingTarget.status}`);
  }
  const retriedJob = await retryMissingTarget.json();
  if (
    retriedJob.status !== "sent" ||
    retriedJob.channelStatuses?.[0]?.status !== "sent" ||
    retriedJob.channelStatuses?.[0]?.target !== "retry@example.com" ||
    retriedJob.failureSuggestions?.length
  ) {
    throw new Error("Notification retry failed channels mismatch");
  }

  console.log("api-test-ok");
} finally {
  await new Promise((resolve) => server.close(resolve));
  closeStorage();
  await rm(testDataDir, { recursive: true, force: true });
  await assertProtectedDataUnchanged(protectedDataBefore);
}
