const form = document.querySelector("#diagnosis-form");
const customerAppShell = document.querySelector("#customer-app-shell");
const customerInternalBtn = document.querySelector("#customer-internal-btn");
const customerCameraBtn = document.querySelector("#customer-camera-btn");
const customerStagePhoto = document.querySelector("#customer-stage-photo");
const customerMobileRisk = document.querySelector("#customer-mobile-risk");
const customerMobileAction = document.querySelector("#customer-mobile-action");
const customerMobileFollowup = document.querySelector("#customer-mobile-followup");
const customerMobileEvidence = document.querySelector("#customer-mobile-evidence");
const customerMobilePrivacyBtn = document.querySelector("#customer-mobile-privacy-btn");
const customerMobilePrivacyDetail = document.querySelector("#customer-mobile-privacy-detail");
const customerCheckPlantBtn = document.querySelector("#customer-check-plant-btn");
const customerPhotoStatusLabel = document.querySelector("#customer-photo-status-label");
const customerAnalysisState = document.querySelector("#customer-analysis-state");
const customerProgressSteps = Array.from(document.querySelectorAll("[data-customer-step]"));
const customerPhotoEntryBtn = document.querySelector("#customer-photo-entry-btn");
const customerCareEntryBtn = document.querySelector("#customer-care-entry-btn");
const customerCareCard = document.querySelector("#customer-care-card");
const customerCareKicker = document.querySelector("#customer-care-kicker");
const customerCareTitle = document.querySelector("#customer-care-title");
const customerCareMessage = document.querySelector("#customer-care-message");
const customerCareAction = document.querySelector("#customer-care-action");
const customerCareFollowup = document.querySelector("#customer-care-followup");
const customerCareEvidence = document.querySelector("#customer-care-evidence");
const customerCareModeButtons = Array.from(document.querySelectorAll("[data-customer-care-mode]"));
const localeButtons = Array.from(document.querySelectorAll("[data-locale-option]"));
const customerModeBtn = document.querySelector("#customer-mode-btn");
const expertModeBtn = document.querySelector("#expert-mode-btn");
const customerTitle = document.querySelector("#customer-title");
const customerAppTitle = document.querySelector("#customer-app-title");
const customerAppIntro = document.querySelector("#customer-app-intro");
const customerResultPhoto = document.querySelector("#customer-result-photo");
const customerResultCrop = document.querySelector("#customer-result-crop");
const customerBackBtn = document.querySelector("#customer-back-btn");
const customerPrivacyTopBtn = document.querySelector("#customer-privacy-top-btn");
const customerPhotoPrivacyDetail = document.querySelector("#customer-photo-privacy-detail");
const customerMessage = document.querySelector("#customer-message");
const customerNextAction = document.querySelector("#customer-next-action");
const customerPrimaryActionBtn = document.querySelector("#customer-primary-action-btn");
const customerStartTitle = document.querySelector("#customer-start-title");
const customerStartMessage = document.querySelector("#customer-start-message");
const confidenceValue = document.querySelector("#confidence-value");
const confidenceBar = document.querySelector("#confidence-bar");
const confidenceLabel = document.querySelector("#confidence-label");
const customerJourney = document.querySelector("#customer-journey");
const customerJourneyKicker = document.querySelector("#customer-journey-kicker");
const customerJourneyTitle = document.querySelector("#customer-journey-title");
const customerJourneyList = document.querySelector("#customer-journey-list");
const customerPlanCompact = document.querySelector("#customer-plan-compact");
const customerCompactPhoto = document.querySelector("#customer-compact-photo");
const customerCompactJudgement = document.querySelector("#customer-compact-judgement");
const customerCompactReason = document.querySelector("#customer-compact-reason");
const customerCompactAction = document.querySelector("#customer-compact-action");
const customerCompactFollowup = document.querySelector("#customer-compact-followup");
const customerCompactActionBtn = document.querySelector("#customer-compact-action-btn");
const customerArchiveStatus = document.querySelector("#customer-archive-status");
const customerTrustCard = document.querySelector("#customer-trust-card");
const customerTrustTitle = document.querySelector("#customer-trust-title");
const customerTrustList = document.querySelector("#customer-trust-list");
const customerPrivacyCard = document.querySelector("#customer-privacy-card");
const customerPrivacyCopy = document.querySelector("#customer-privacy-copy");
const customerDeleteLocalDataBtn = document.querySelector("#customer-delete-local-data-btn");
const customerPlantDossier = document.querySelector("#customer-plant-dossier");
const customerDossierKicker = document.querySelector("#customer-dossier-kicker");
const customerDossierTitle = document.querySelector("#customer-dossier-title");
const customerDossierMessage = document.querySelector("#customer-dossier-message");
const customerDossierMeta = document.querySelector("#customer-dossier-meta");
const customerDossierContinueBtn = document.querySelector("#customer-dossier-continue-btn");
const customerDossierNewBtn = document.querySelector("#customer-dossier-new-btn");
const customerCaseTimelineCard = document.querySelector("#customer-case-timeline-card");
const customerCaseTimelineTitle = document.querySelector("#customer-case-timeline-title");
const customerCaseTimelineSummary = document.querySelector("#customer-case-timeline-summary");
const customerCaseTrendBar = document.querySelector("#customer-case-trend-bar");
const customerCaseTimelineList = document.querySelector("#customer-case-timeline-list");
const confidenceDecisionCard = document.querySelector("#confidence-decision-card");
const confidenceTierStatus = document.querySelector("#confidence-tier-status");
const confidenceTierTitle = document.querySelector("#confidence-tier-title");
const confidenceTierReason = document.querySelector("#confidence-tier-reason");
const confidenceTierNext = document.querySelector("#confidence-tier-next");
const confidenceTierList = document.querySelector("#confidence-tier-list");
const customerPhotoRescueCard = document.querySelector("#customer-photo-rescue-card");
const customerPhotoRescueKicker = document.querySelector("#customer-photo-rescue-kicker");
const customerPhotoRescueTitle = document.querySelector("#customer-photo-rescue-title");
const customerPhotoRescueMessage = document.querySelector("#customer-photo-rescue-message");
const customerPhotoRescueSteps = document.querySelector("#customer-photo-rescue-steps");
const customerPhotoRescueActions = document.querySelector("#customer-photo-rescue-actions");
const customerPhotoRescueBtn = document.querySelector("#customer-photo-rescue-btn");
const smartDiagnoseBtn = document.querySelector("#smart-diagnose-btn");
const smartConcern = document.querySelector("#smartConcern");
const quickPhotoBtn = document.querySelector("#quick-photo-btn");
const cropQuickButtons = Array.from(document.querySelectorAll("[data-crop-choice]"));
const steps = Array.from(document.querySelectorAll(".step"));
const sampleBtn = document.querySelector("#sample-btn");
const sampleBasilBtn = document.querySelector("#sample-basil-btn");
const sampleRosemaryBtn = document.querySelector("#sample-rosemary-btn");
const sampleStrawberryBtn = document.querySelector("#sample-strawberry-btn");
const samplePepperBtn = document.querySelector("#sample-pepper-btn");
const growDeviceSelect = document.querySelector("#growDevice");
const deviceHint = document.querySelector("#device-hint");
const deviceProfileTitle = document.querySelector("#device-profile-title");
const deviceProfileSummary = document.querySelector("#device-profile-summary");
const deviceRecommendationTitle = document.querySelector("#device-recommendation-title");
const deviceRecommendationSummary = document.querySelector("#device-recommendation-summary");
const deviceFitList = document.querySelector("#device-fit-list");
const devicePlanTitle = document.querySelector("#device-plan-title");
const devicePlanSummary = document.querySelector("#device-plan-summary");
const devicePlanGrid = document.querySelector("#device-plan-grid");
const devicePlanList = document.querySelector("#device-plan-list");
const applyDevicePlanBtn = document.querySelector("#apply-device-plan-btn");
const basilGuidanceCard = document.querySelector("#basil-guidance-card");
const basilGuidanceModeLabel = document.querySelector("#basil-guidance-mode-label");
const basilGuidanceSummary = document.querySelector("#basil-guidance-summary");
const basilGuidanceCurrent = document.querySelector("#basil-guidance-current");
const basilGuidanceSteps = document.querySelector("#basil-guidance-steps");
const basilGuideModeButtons = Array.from(document.querySelectorAll("[data-basil-guide-mode]"));
const autoIntakeCard = document.querySelector("#auto-intake-card");
const autoIntakeSummary = document.querySelector("#auto-intake-summary");
const autoIntakeList = document.querySelector("#auto-intake-list");
const editAutoIntakeBtn = document.querySelector("#edit-auto-intake-btn");
const cropSelect = document.querySelector("#crop");
const cropHint = document.querySelector("#crop-hint");
const readiness = document.querySelector("#readiness");
const mainRisk = document.querySelector("#main-risk");
const mainSummary = document.querySelector("#main-summary");
const causesList = document.querySelector("#causes-list");
const actionsList = document.querySelector("#actions-list");
const taskList = document.querySelector("#task-list");
const resetTasksBtn = document.querySelector("#reset-tasks-btn");
const matchedPathwayList = document.querySelector("#matched-pathway-list");
const minimalQuestionList = document.querySelector("#minimal-question-list");
const monitorList = document.querySelector("#monitor-list");
const photoList = document.querySelector("#photo-list");
const followupList = document.querySelector("#followup-list");
const historyList = document.querySelector("#history-list");
const reportOutput = document.querySelector("#report-output");
const copyReportBtn = document.querySelector("#copy-report-btn");
const saveReportBtn = document.querySelector("#save-report-btn");
const refreshDbBtn = document.querySelector("#refresh-db-btn");
const exportDbBtn = document.querySelector("#export-db-btn");
const copyStatus = document.querySelector("#copy-status");
const dbStatus = document.querySelector("#db-status");
const dbList = document.querySelector("#db-list");
const dbSearch = document.querySelector("#db-search");
const dbCropFilter = document.querySelector("#db-crop-filter");
const dbMediumFilter = document.querySelector("#db-medium-filter");
const dbDetail = document.querySelector("#db-detail");
const caseManager = document.querySelector("#case-manager");
const activeCaseCard = document.querySelector("#active-case-card");
const caseStatus = document.querySelector("#case-status");
const caseList = document.querySelector("#case-list");
const caseTimeline = document.querySelector("#case-timeline");
const caseDetail = document.querySelector("#case-detail");
const newCaseBtn = document.querySelector("#new-case-btn");
const refreshCasesBtn = document.querySelector("#refresh-cases-btn");
const notificationCenter = document.querySelector("#notification-center");
const notificationChannelPanel = document.querySelector("#notification-channel-panel");
const notificationChannelInApp = document.querySelector("#notification-channel-in-app");
const notificationChannelEmail = document.querySelector("#notification-channel-email");
const notificationChannelSms = document.querySelector("#notification-channel-sms");
const notificationChannelWechat = document.querySelector("#notification-channel-wechat");
const notificationChannelInputs = [notificationChannelInApp, notificationChannelEmail, notificationChannelSms, notificationChannelWechat].filter(Boolean);
const notificationEmailTarget = document.querySelector("#notification-email-target");
const notificationSmsTarget = document.querySelector("#notification-sms-target");
const notificationWechatTarget = document.querySelector("#notification-wechat-target");
const saveNotificationChannelsBtn = document.querySelector("#save-notification-channels-btn");
const syncCaseNotificationsBtn = document.querySelector("#sync-case-notifications-btn");
const refreshNotificationsBtn = document.querySelector("#refresh-notifications-btn");
const notificationStatus = document.querySelector("#notification-status");
const notificationMetrics = document.querySelector("#notification-metrics");
const notificationList = document.querySelector("#notification-list");
const integrationCenter = document.querySelector("#integration-center");
const refreshIntegrationsBtn = document.querySelector("#refresh-integrations-btn");
const integrationStatus = document.querySelector("#integration-status");
const integrationGrid = document.querySelector("#integration-grid");
const refreshInsightsBtn = document.querySelector("#refresh-insights-btn");
const insightsGrid = document.querySelector("#insights-grid");
const insightsList = document.querySelector("#insights-list");
const refreshOpportunitiesBtn = document.querySelector("#refresh-opportunities-btn");
const opportunityRankList = document.querySelector("#opportunity-rank-list");
const refreshExperimentsBtn = document.querySelector("#refresh-experiments-btn");
const experimentList = document.querySelector("#experiment-list");
const p2GrowthPanel = document.querySelector("#p2-growth-panel");
const refreshP2GrowthBtn = document.querySelector("#refresh-p2-growth-btn");
const p2GrowthMetrics = document.querySelector("#p2-growth-metrics");
const annotationSchemaPanel = document.querySelector("#annotation-schema-panel");
const annotationSchemaList = document.querySelector("#annotation-schema-list");
const annotationPreview = document.querySelector("#annotation-preview");
const expertCorrectionPanel = document.querySelector("#expert-correction-panel");
const correctionDiagnosisInput = document.querySelector("#correction-diagnosis-input");
const correctionOutcomeSelect = document.querySelector("#correction-outcome-select");
const correctionReasonInput = document.querySelector("#correction-reason-input");
const saveCorrectionBtn = document.querySelector("#save-correction-btn");
const correctionStatus = document.querySelector("#correction-status");
const correctionList = document.querySelector("#correction-list");
const pricingBoundaryPanel = document.querySelector("#pricing-boundary-panel");
const pricingBoundaryList = document.querySelector("#pricing-boundary-list");
const publicPhotoTestPanel = document.querySelector("#public-photo-test-panel");
const publicPhotoTestMetrics = document.querySelector("#public-photo-test-metrics");
const publicPhotoTestList = document.querySelector("#public-photo-test-list");
const publicPhotoTestLog = document.querySelector("#public-photo-test-log");
const refreshPublicPhotoTestBtn = document.querySelector("#refresh-public-photo-test-btn");
const exportPublicPhotoTestBtn = document.querySelector("#export-public-photo-test-btn");
const resetPublicPhotoTestBtn = document.querySelector("#reset-public-photo-test-btn");
const refreshProductStrategyBtn = document.querySelector("#refresh-product-strategy-btn");
const productStrategyGrid = document.querySelector("#product-strategy-grid");
const productStrategyList = document.querySelector("#product-strategy-list");
const refreshKnowledgeGraphBtn = document.querySelector("#refresh-knowledge-graph-btn");
const knowledgeGraphCropFilter = document.querySelector("#knowledge-graph-crop-filter");
const knowledgeGraphStageFilter = document.querySelector("#knowledge-graph-stage-filter");
const knowledgeGraphStats = document.querySelector("#knowledge-graph-stats");
const knowledgeGraphList = document.querySelector("#knowledge-graph-list");
const opportunityList = document.querySelector("#opportunity-list");
const metricsStrip = document.querySelector("#metrics-strip");
const plantPhoto = document.querySelector("#plantPhoto");
const photoPreview = document.querySelector("#photoPreview");
const photoHint = document.querySelector("#photoHint");
const autoPhotoTypeBadge = document.querySelector("#auto-photo-type-badge");
const photoReviewCard = document.querySelector("#photo-review-card");
const photoReviewKicker = document.querySelector("#photo-review-kicker");
const photoReviewTitle = document.querySelector("#photo-review-title");
const photoReviewMessage = document.querySelector("#photo-review-message");
const photoReviewMeta = document.querySelector("#photo-review-meta");
const photoRetakeBtn = document.querySelector("#photo-retake-btn");
const photoContinueBtn = document.querySelector("#photo-continue-btn");
const guidedPhotoCard = document.querySelector("#guided-photo-card");
const guidedPhotoTitle = document.querySelector("#guided-photo-title");
const guidedPhotoReason = document.querySelector("#guided-photo-reason");
const guidedPhotoSteps = document.querySelector("#guided-photo-steps");
const guidedPhotoStatus = document.querySelector("#guided-photo-status");
const guidedPhotoUploadBtn = document.querySelector("#guided-photo-upload-btn");
const nativeCameraBtn = document.querySelector("#native-camera-btn");
const nativeCameraCard = document.querySelector("#native-camera-card");
const nativeCameraVideo = document.querySelector("#native-camera-video");
const nativeCameraCanvas = document.querySelector("#native-camera-canvas");
const nativeCameraShotBtn = document.querySelector("#native-camera-shot-btn");
const nativeCameraCloseBtn = document.querySelector("#native-camera-close-btn");
const nativeCameraStatus = document.querySelector("#native-camera-status");
const resetPhotoCheckBtn = document.querySelector("#reset-photo-check-btn");
const nextPhotoTitle = document.querySelector("#next-photo-title");
const nextPhotoTip = document.querySelector("#next-photo-tip");
const useNextPhotoBtn = document.querySelector("#use-next-photo-btn");
const photoCheckList = document.querySelector("#photo-check-list");
const photoQualityList = document.querySelector("#photo-quality-list");
const saveLogBtn = document.querySelector("#save-log-btn");
const checkDay = document.querySelector("#checkDay");
const followupPhoto = document.querySelector("#followupPhoto");
const followupLoopCard = document.querySelector("#followup-loop-card");
const followupLoopTitle = document.querySelector("#followup-loop-title");
const followupLoopTime = document.querySelector("#followup-loop-time");
const followupLoopPhoto = document.querySelector("#followup-loop-photo");
const followupLoopSuccess = document.querySelector("#followup-loop-success");
const followupLoopSteps = document.querySelector("#followup-loop-steps");
const followupLoopVerdict = document.querySelector("#followup-loop-verdict");
const followupLoopTarget = document.querySelector("#followup-loop-target");
const followupPhotoGuide = document.querySelector("#followup-photo-guide");
const followupLoopUploadBtn = document.querySelector("#followup-loop-upload-btn");
const customerReminderCard = document.querySelector("#customer-reminder-card");
const customerReminderKicker = document.querySelector("#customer-reminder-kicker");
const customerReminderTitle = document.querySelector("#customer-reminder-title");
const customerReminderMessage = document.querySelector("#customer-reminder-message");
const customerReminderMeta = document.querySelector("#customer-reminder-meta");
const customerProgressCard = document.querySelector("#customer-progress-card");
const customerProgressKicker = document.querySelector("#customer-progress-kicker");
const customerProgressTitle = document.querySelector("#customer-progress-title");
const customerProgressMessage = document.querySelector("#customer-progress-message");
const customerProgressMeta = document.querySelector("#customer-progress-meta");
const reminderStrip = document.querySelector("#reminder-strip");
const reminderScheduleList = document.querySelector("#reminder-schedule-list");
const leafProgress = document.querySelector("#leafProgress");
const flowerProgress = document.querySelector("#flowerProgress");
const pestProgress = document.querySelector("#pestProgress");
const logNotes = document.querySelector("#logNotes");

const defaultDocumentTitle = document.title;
const historyKey = "growClinicLogs";
const tasksKey = "growClinicTasks";
const reminderPlanKey = "growClinicReminderPlan";
const baselinePhotoKey = "growClinicBaselinePhotoSignals";
const activeCaseKey = "growClinicActiveCase";
const customerAutoArchiveKey = "growClinicCustomerAutoArchive";
const notificationChannelKey = "growClinicNotificationChannels";
const publicPhotoTestKey = "fivecropPublicPhotoPrintResults";
let latestState = null;
let latestFindings = [];
let photoSignals = {
  greenRatio: null,
  yellowRatio: null,
  darkRatio: null,
  brightness: null,
  contrast: null,
  width: null,
  height: null
};
let capturedPhotoTypes = new Set();
let hasRunSmartDiagnosis = false;
let requestedPhotoType = "plant";
let knowledgeGraphPathways = [];
let pathologyConditions = [];
let latestMatchedPathways = [];
let latestMatchedPathology = [];
let latestAssistantAdvice = null;
let latestAssistantAdviceSignature = "";
let latestVisionResult = null;
let publicPhotoFixtures = null;
let publicPhotoServerRecords = null;
let publicPhotoCaptureContext = null;
let latestPhotoTypeDetection = null;
let latestPhotoQualityGate = null;
let latestAiPipelineSnapshot = null;
let customerCaseTimelineCache = null;
let customerCaseTimelineInFlightKey = null;
let nativeCameraStream = null;
let customerTimeRefreshId = null;
let customerAutoArchiveInFlightSignature = null;
let customerResetSnapshot = null;
let customerPhotoPickerCancelTimer = null;

const localeStorageKey = "fivecropLocale";
const supportedLocales = new Set(["zh-Hant", "en"]);
let activeLocale = (() => {
  try {
    const saved = localStorage.getItem(localeStorageKey);
    return supportedLocales.has(saved) ? saved : "zh-Hant";
  } catch {
    return "zh-Hant";
  }
})();

const uiCopy = {
  "zh-Hant": {
    htmlLang: "zh-Hant",
    documentTitle: "FiveCrop：植物醫生",
    backAria: "開始新的診斷",
    privacyAria: "照片隱私說明",
    cameraAria: "拍攝或上傳植物照片",
    cropRailAria: "選擇你的作物",
    heroTitle: "讓我看看哪裡在變化。",
    heroIntro: "先拍整株。需要細節時，FiveCrop 只會再要求一張。",
    photoCheckTitle: "拍照診斷",
    photoCheckSubtitle: "植物看起來不對勁時",
    careEntryTitle: "今日養護",
    careEntrySubtitle: "日常種植指導",
    careKicker: "今日養護",
    careDoneKicker: "今日已完成",
    careDoneAction: "今天的動作已完成。先保持環境穩定，到復查時間再回來拍照。",
    today: "今天",
    careModeAria: "起步方式",
    careDefaultMessage: "選擇起步方式，FiveCrop 只給你下一個該做的動作。",
    privacyInline: "預設保護隱私",
    photoPrivacyDetail: "FiveCrop 只會為本次診斷上傳壓縮後的植物照片。預設不會用於模型訓練，你也可以隨時刪除本機病例資料。",
    whyTitle: "為什麼這樣判斷",
    followupHelp: "用同一角度拍攝，方便我們比較變化。",
    diagnosisPrivacy: "照片只用於本次診斷",
    privacyLabel: "隱私",
    diagnosisPrivacyDetail: "只有啟用視覺分析時，FiveCrop 才會發送壓縮後的植物照片。原圖不會存入病例，也不會預設用於模型訓練。",
    takePhoto: "拍照",
    appEyebrow: "專注 5 種可食室內植物",
    customerMode: "客戶",
    expertMode: "內部",
    viewModeAria: "視圖模式",
    waiting: "等待輸入",
    basilGuidanceHeader: "主動種植指導",
    startTypeSeed: "種子培育",
    startTypeTransplant: "移栽/換盆",
    startTypeStore: "成品不移植"
  },
  en: {
    htmlLang: "en",
    documentTitle: "FiveCrop: Plant Doctor",
    backAria: "Start a new diagnosis",
    privacyAria: "Photo privacy details",
    cameraAria: "Take or upload a plant photo",
    cropRailAria: "Choose your crop",
    heroTitle: "Show me what's changing.",
    heroIntro: "Frame the whole plant. We will ask for a detail only if needed.",
    photoCheckTitle: "Photo check",
    photoCheckSubtitle: "When something looks off",
    careEntryTitle: "Today's care",
    careEntrySubtitle: "Routine guidance",
    careKicker: "Today's care",
    careDoneKicker: "Done today",
    careDoneAction: "Done for today. Keep conditions steady until the review.",
    today: "Today",
    careModeAria: "Start type",
    careDefaultMessage: "Pick a start type and FiveCrop will keep the next action simple.",
    privacyInline: "Private by default",
    photoPrivacyDetail: "FiveCrop uploads a compressed plant photo only for diagnosis. It is not used for model training by default, and you can delete local case data at any time.",
    whyTitle: "Why we think this",
    followupHelp: "Use the same angle so we can compare.",
    diagnosisPrivacy: "Photos are used only for this diagnosis",
    privacyLabel: "Privacy",
    diagnosisPrivacyDetail: "FiveCrop sends a compressed plant photo only when vision analysis is enabled. Original photos are not saved in the case or used for model training by default.",
    takePhoto: "Take a photo",
    appEyebrow: "Care for 5 edible plants",
    customerMode: "Customer",
    expertMode: "Expert",
    viewModeAria: "View mode",
    waiting: "Waiting",
    basilGuidanceHeader: "Proactive care guide",
    startTypeSeed: "Seed",
    startTypeTransplant: "Transplant",
    startTypeStore: "Store plant"
  }
};

const cropNameCatalog = {
  "zh-Hant": {
    tomato: "矮生番茄",
    basil: "羅勒",
    rosemary: "迷迭香",
    strawberry: "草莓",
    pepper: "辣椒"
  },
  en: {
    tomato: "Tomato",
    basil: "Basil",
    rosemary: "Rosemary",
    strawberry: "Strawberry",
    pepper: "Pepper"
  }
};

const traditionalPhraseMap = [
  ["种子培育", "種子培育"],
  ["移栽/换盆", "移栽/換盆"],
  ["成品不移植", "成品不移植"],
  ["罗勒主动种植指导", "羅勒主動種植指導"],
  ["当前重点", "當前重點"],
  ["稳出苗", "穩出苗"],
  ["防徒长", "防徒長"],
  ["开花信号", "開花信號"],
  ["第一位", "第一位"],
  ["香味不浓", "香味不濃"],
  ["不能靠照片直接判定", "不能靠照片直接判定"],
  ["营养生长期", "營養生長期"],
  ["连续采收", "連續採收"],
  ["起步方式", "起步方式"],
  ["下一步", "下一步"],
  ["复查", "複查"],
  ["同角度", "同角度"],
  ["整株", "整株"],
  ["叶背", "葉背"],
  ["花苞", "花苞"],
  ["花穗", "花穗"],
  ["茎基部", "莖基部"],
  ["根腐", "根腐"],
  ["黑脚", "黑腳"],
  ["打顶", "打頂"],
  ["补光", "補光"],
  ["浇水", "澆水"],
  ["观察", "觀察"],
  ["根颈", "根頸"],
  ["叶尖", "葉尖"],
  ["枝条", "枝條"],
  ["急着", "急著"],
  ["稳定", "穩定"],
  ["变干", "變乾"],
  ["偏干", "偏乾"],
  ["干湿", "乾濕"],
  ["干透", "乾透"],
  ["干爽", "乾爽"],
  ["干枯", "乾枯"],
  ["干脆", "乾脆"],
  ["发褐", "發褐"],
  ["发黑", "發黑"],
  ["发黏", "發黏"],
  ["黄点", "黃點"],
  ["细网", "細網"],
  ["内侧", "內側"],
  ["喷叶", "噴葉"],
  ["重点", "重點"],
  ["根区", "根區"],
  ["循环", "循環"],
  ["结果", "結果"],
  ["湿亮", "濕亮"],
  ["异味", "異味"],
  ["气味", "氣味"],
  ["备份", "備份"],
  ["从种子", "從種子"],
  ["均匀", "均勻"],
  ["绿色", "綠色"],
  ["顺手", "順手"],
  ["残叶", "殘葉"],
  ["紧凑", "緊湊"],
  ["没有", "沒有"],
  ["每周", "每週"],
  ["浅播", "淺播"],
  ["驯化", "馴化"],
  ["施肥", "施肥"],
  ["通风", "通風"],
  ["排水孔", "排水孔"],
  ["泥炭", "泥炭"],
  ["椰糠", "椰糠"],
  ["珍珠岩", "珍珠岩"],
  ["植物灯", "植物燈"],
  ["育苗", "育苗"],
  ["浅播", "淺播"],
  ["薄覆", "薄覆"],
  ["喷湿", "噴濕"],
  ["透明盖", "透明蓋"],
  ["小苗", "小苗"],
  ["真叶", "真葉"],
  ["侧枝", "側枝"],
  ["光照", "光照"],
  ["氮肥", "氮肥"],
  ["模型训练", "模型訓練"]
];

const traditionalCharMap = {
  "罗": "羅", "种": "種", "换": "換", "养": "養", "导": "導", "选": "選", "择": "擇",
  "阶": "階", "给": "給", "应": "應", "动": "動", "当": "當", "稳": "穩", "长": "長",
  "开": "開", "号": "號", "时": "時", "顶": "頂", "叶": "葉", "为": "為", "浓": "濃",
  "仅": "僅", "补": "補", "诊": "診", "断": "斷", "压": "壓", "缩": "縮", "传": "傳",
  "删": "刪", "数": "數", "据": "據", "显": "顯", "示": "示", "质": "質", "检": "檢",
  "识": "識", "别": "別", "护": "護", "这": "這", "张": "張", "清": "清", "晰": "晰",
  "后": "後", "实": "實", "验": "驗", "议": "議", "态": "態", "处": "處", "间": "間",
  "轻": "輕", "复": "複", "该": "該", "摄": "攝", "较": "較", "变": "變", "隐": "隱",
  "私": "私", "默": "默", "认": "認", "练": "練", "随": "隨", "机": "機", "资": "資",
  "料": "料", "标": "標", "签": "籤", "层": "層", "湿": "濕", "积": "積", "缝": "縫",
  "发": "發", "现": "現", "风": "風", "习": "習", "买": "買", "虫": "蟲", "节": "節",
  "线": "線", "适": "適", "滤": "濾", "挥": "揮", "拟": "擬", "旧": "舊", "与": "與",
  "产": "產", "径": "徑", "团": "團", "伤": "傷", "过": "過", "强": "強", "晒": "曬",
  "蔫": "蔫", "黄": "黃", "园": "園", "亚": "亞", "质": "質", "测": "測", "帮": "幫",
  "结": "結", "钟": "鐘", "够": "夠", "内": "內", "优": "優", "将": "將", "启": "啟",
  "对": "對", "带": "帶", "确": "確", "缓": "緩", "来": "來", "请": "請", "读": "讀",
  "录": "錄", "软": "軟", "刚": "剛", "闭": "閉", "担": "擔", "还": "還", "离": "離",
  "观": "觀", "颈": "頸", "条": "條", "气": "氣", "备": "備", "紧": "緊",
  "点": "點", "细": "細", "区": "區", "环": "環", "喷": "噴", "侧": "側",
  "从": "從", "转": "轉", "匀": "勻", "绿": "綠", "顺": "順", "残": "殘",
  "凑": "湊", "没": "沒", "周": "週", "浅": "淺", "驯": "馴", "几": "幾",
  "无": "無", "剂": "劑", "频": "頻", "盘": "盤"
};

function t(key) {
  return uiCopy[activeLocale]?.[key] || uiCopy.en[key] || key;
}

function toTraditional(input) {
  let output = String(input || "");
  traditionalPhraseMap.forEach(([from, to]) => {
    output = output.split(from).join(to);
  });
  return output.replace(/[\u4e00-\u9fff]/g, (char) => traditionalCharMap[char] || char);
}

function localizeText(value) {
  if (value == null) return "";
  return activeLocale === "zh-Hant" ? toTraditional(value) : String(value);
}

const cropNames = {
  tomato: "矮生番茄",
  basil: "罗勒",
  rosemary: "迷迭香",
  strawberry: "草莓",
  pepper: "辣椒"
};

function syncCropNamesForLocale() {
  Object.assign(cropNames, cropNameCatalog[activeLocale] || cropNameCatalog["zh-Hant"]);
}

function cropName(cropKey) {
  return cropNameCatalog[activeLocale]?.[cropKey] || cropNameCatalog.en[cropKey] || cropKey;
}

syncCropNamesForLocale();

const cropConstraints = {
  tomato: "建议限定 Micro Tom、Orange Hat、Tiny Tim、Red Robin 等微型/矮生番茄；不支持普通无限生长番茄。",
  basil: "建议限定 Genovese、Thai basil、Greek basil 等盆栽罗勒；重点做连续采收和修剪诊断。",
  rosemary: "建议限定小苗/盆栽迷迭香，不从大型木质化老桩开始；重点诊断缺光、闷根和过湿。",
  strawberry: "建议限定日中性/四季草莓或紧凑盆栽草莓；重点诊断授粉、冠部潮湿和果形问题。",
  pepper: "建议限定矮生辣椒、观赏辣椒或小型甜椒；不支持大型露地品种。"
};

const mediumNames = {
  xponge: "超薄 Xponge",
  coco: "椰糠",
  rockwool: "岩棉",
  soil: "土培",
  water: "水培/DWC"
};

const stageNames = {
  seedling: "幼苗期",
  vegetative: "营养生长期",
  flowering: "开花期",
  fruiting: "结果期"
};

const cropOrder = ["tomato", "basil", "rosemary", "strawberry", "pepper"];

const deviceTemplates = {
  "xponge-diy": {
    name: "Xponge DIY 超薄根区",
    summary: "适合验证薄层根系、补水缓冲和遮光防藻；结果类作物需要额外关注储液量和水分波动。",
    defaultMedium: "xponge",
    defaultLight: "medium",
    defaultMoisture: "swing",
    defaultClimate: "normal",
    defaults: { lightHours: 13, reservoir: 3, xpongeThickness: 1.5, xpongeLength: 30, xpongeWidth: 40 },
    cropFit: { tomato: "caution", basil: "fit", rosemary: "caution", strawberry: "caution", pepper: "caution" },
    automation: ["需要外置储液缓冲", "需要遮光防藻", "需要根区复查照片"],
    risks: ["超薄根区缓冲小，强灯下容易忽干忽湿", "表面见光后容易出现藻霉"]
  },
  letpot: {
    name: "LetPot / 类 LetPot 智能水培机",
    summary: "适合香草和小型叶菜；有 App 控灯控水优势，果菜类需要控制株数、授粉和灯距。",
    defaultMedium: "water",
    defaultLight: "medium",
    defaultMoisture: "stable",
    defaultClimate: "normal",
    defaults: { lightHours: 14, reservoir: 4 },
    cropFit: { tomato: "caution", basil: "fit", rosemary: "avoid", strawberry: "caution", pepper: "caution" },
    automation: ["自动灯光日程", "水泵循环", "补水/营养提醒"],
    risks: ["果菜类容易受高度、根量和光强限制", "迷迭香不适合长期高湿根区"]
  },
  idoo: {
    name: "iDOO / Ahopegarden 平价水培机",
    summary: "入门成本低、孔位多；最适合罗勒等香草，番茄/辣椒/草莓建议少株数测试。",
    defaultMedium: "water",
    defaultLight: "medium",
    defaultMoisture: "stable",
    defaultClimate: "normal",
    defaults: { lightHours: 14, reservoir: 3.5 },
    cropFit: { tomato: "caution", basil: "fit", rosemary: "avoid", strawberry: "caution", pepper: "caution" },
    automation: ["定时灯", "循环泵", "基础水箱"],
    risks: ["孔位多不等于适合混种，过密会遮光和缠根", "结果类作物要额外做授粉和支撑"]
  },
  aerogarden: {
    name: "AeroGarden 桌面水培机",
    summary: "成熟桌面水培体验，适合香草和矮生番茄；果菜类要限制品种和株数。",
    defaultMedium: "water",
    defaultLight: "medium",
    defaultMoisture: "stable",
    defaultClimate: "normal",
    defaults: { lightHours: 15, reservoir: 3.5 },
    cropFit: { tomato: "fit", basil: "fit", rosemary: "avoid", strawberry: "caution", pepper: "caution" },
    automation: ["加水提醒", "营养提醒", "固定补光"],
    risks: ["普通高大型番茄/辣椒不适配", "开花结果仍需要人工授粉或风扇"]
  },
  clickgrow: {
    name: "Click & Grow 种植舱",
    summary: "低操作、预制种植舱体验好；适合香草和草莓入门，但开放诊断和水肥调节空间较小。",
    defaultMedium: "coco",
    defaultLight: "medium",
    defaultMoisture: "stable",
    defaultClimate: "normal",
    defaults: { lightHours: 14, reservoir: 2 },
    cropFit: { tomato: "caution", basil: "fit", rosemary: "caution", strawberry: "fit", pepper: "caution" },
    automation: ["预制种植舱", "低频补水", "固定灯光"],
    risks: ["封闭耗材限制调参", "结果类作物仍需要授粉和空间管理"]
  },
  balcony: {
    name: "阳台/窗边盆栽",
    summary: "空间和通风较好，但光照和温度波动大；适合盆栽草莓、迷迭香和部分矮生果菜。",
    defaultMedium: "soil",
    defaultLight: "high",
    defaultMoisture: "swing",
    defaultClimate: "hot",
    defaults: { lightHours: 6, reservoir: "" },
    cropFit: { tomato: "fit", basil: "fit", rosemary: "fit", strawberry: "fit", pepper: "fit" },
    automation: ["自然通风", "自然授粉概率更高"],
    risks: ["夏季高温、冬季低温和盆土忽干忽湿", "虫害进入概率更高"]
  },
  office: {
    name: "办公室小型种植",
    summary: "温度稳定但光照和维护频率不足；适合罗勒小盆和观察型种植。",
    defaultMedium: "soil",
    defaultLight: "low",
    defaultMoisture: "dry",
    defaultClimate: "dry",
    defaults: { lightHours: 8, reservoir: "" },
    cropFit: { tomato: "avoid", basil: "caution", rosemary: "caution", strawberry: "avoid", pepper: "avoid" },
    automation: ["环境稳定", "便于低频观察"],
    risks: ["周末缺水、空调干燥、光照不足", "结果类作物成功率低"]
  },
  generic: {
    name: "不确定/其他",
    summary: "先按通用室内种植判断；建议补拍整株、叶片和根区，让系统减少追问。",
    defaultMedium: "xponge",
    defaultLight: "medium",
    defaultMoisture: "stable",
    defaultClimate: "normal",
    defaults: { lightHours: "", reservoir: "" },
    cropFit: { tomato: "caution", basil: "caution", rosemary: "caution", strawberry: "caution", pepper: "caution" },
    automation: ["未知"],
    risks: ["设备参数不足时，诊断会更依赖照片和复查"]
  }
};

const basePlans = {
  tomato: {
    monitor: [
      "每天同一时间观察新叶颜色、花序状态和根区湿度。",
      "开花后每天轻弹花序或用小风扇低速吹 2-3 小时。",
      "结果期记录裂果、脐腐和落花，优先排查水肥波动。"
    ],
    opportunity: "结果类作物需要阶段处方，普通湿度计无法解释不开花、不结果和裂果。"
  },
  basil: {
    monitor: [
      "育苗期先稳出苗和防徒长；4-6 个节点后开始第一次打顶。",
      "每 3-5 天轻采收一次，观察侧枝是否变多、香味是否更明显。",
      "香味变淡时先看光照、氮肥和采收频率，再决定是否调水肥。",
      "湿度高时保持空气流动，减少霉斑；日常不需要人工授粉，除非留种。"
    ],
    opportunity: "香草用户重视香味和连续采收，诊断可绑定修剪提醒。"
  },
  rosemary: {
    monitor: [
      "每 3 天观察新梢是否直立、叶尖是否发黑或发干。",
      "迷迭香怕长期闷湿，优先记录根区干湿节奏和通风。",
      "弱光下容易细长、香味变淡，建议固定同角度拍整株复查。"
    ],
    opportunity: "迷迭香适合验证“少浇水、强通风、强光照”的自动处方，能补齐香草类中偏木本的场景。"
  },
  strawberry: {
    monitor: [
      "开花后检查授粉，果形畸形通常和授粉不足有关。",
      "观察冠部是否长期潮湿，避免烂心。",
      "结果期保持光照和钾钙供应稳定。"
    ],
    opportunity: "草莓的授粉、果形和冠腐问题很适合视觉诊断。"
  },
  pepper: {
    monitor: [
      "开花前避免氮肥过高导致只长叶不开花。",
      "观察花苞是否掉落，优先看温度、光照和水分波动。",
      "结果期保持支撑，避免枝条压弯。"
    ],
    opportunity: "辣椒与番茄共享结果类模型，可复用处方逻辑。"
  }
};

const basilGuideStorageKey = "fivecropBasilGuideMode";
const basilGuidancePlans = {
  seed: {
    label: "种子培育",
    summary: "从播种到第一次打顶，罗勒最怕闷、缺光和积水；目标是短壮出苗、早分枝、不开花。",
    currentAction: "今天浅播 2-4 粒/杯，薄覆 2-3mm，喷湿后盖透明盖保湿；每天打开通风，不能完全密封。",
    pollination: "罗勒不是结果作物，日常不需要人工授粉；只有想留种时才保留花穗，食用叶片阶段看到花苞就摘。",
    followup: "7 天后回来拍一张育苗杯侧面和一张土表/小苗近照，确认发芽、徒长和霉烂。",
    evidence: ["浅播 2-3mm", "发芽适温约 24C", "盖膜必须通风"],
    reminders: [{
      key: "day7",
      task: "确认是否发芽、是否徒长或霉烂",
      photo: "育苗杯侧面和土表/小苗近照",
      success: "小苗短直偏壮，土表微湿不泥泞，没有白霉或倒伏。",
      reason: "罗勒通常 5-14 天发芽，第 7 天适合先判断方向"
    }],
    stageActions: {
      seedling: {
        currentAction: "如果已经出芽，今天立刻移到最亮处或补植物灯，并每天打开盖子通风；每杯只留最壮 1-2 株，表土微干再补水。",
        followup: "7 天后回来拍整株侧面和顶部近照，重点看节间是否拉长、茎是否直立。",
        evidence: ["发芽后立刻见光", "每杯留 1-2 株", "表土微干再浇"],
        reminders: [{
          key: "day7",
          task: "复查徒长、倒伏和真叶数量",
          photo: "小苗侧面和顶部真叶近照",
          success: "茎短直、叶色均匀，至少开始出现真叶，没有倒伏或霉斑。",
          reason: "苗期光照和通风调整通常 7 天可以看出株型是否变壮"
        }]
      },
      vegetative: {
        currentAction: "如果已有 2-3 对真叶，今天带土团分苗或移栽到 12-18cm 排水盆；移栽后 1-2 天只给明亮散射光。",
        followup: "48 小时后回来拍一张整株照和一张茎基部照，确认是否缓苗成功。",
        evidence: ["2-3 对真叶再移栽", "带土团不裸根硬拔", "缓苗先散射光"],
        reminders: [{
          key: "48h",
          task: "确认移栽后是否恢复挺立、茎基部是否发黑",
          photo: "整株和茎基部特写",
          success: "新梢恢复挺立，茎基部不发黑，盆底排水正常。",
          reason: "移栽伤根、黑脚和根腐风险最先在 48 小时内显现"
        }]
      },
      flowering: {
        currentAction: "今天看到花苞就从花苞下面一对叶子上方剪掉；不要等花全开，也不要为了食用叶片阶段去授粉。",
        followup: "3 天后回来拍顶部节点和整株侧面，确认有没有继续抽花、叶量是否恢复。",
        evidence: ["花苞会消耗叶片产量", "从花苞下一对叶上方剪", "食用阶段不保留花穗"],
        reminders: [{
          key: "day3",
          task: "复查摘花后是否继续抽花、侧枝是否恢复",
          photo: "顶部节点和整株侧面",
          success: "没有新花穗继续拉高，顶部开始分枝，叶片没有明显减少。",
          reason: "摘花和打顶后 3 天可判断植株是否仍在转向开花"
        }]
      },
      aroma: {
        currentAction: "香味不浓不能只靠照片判断；今天先增加有效光照，暂停大氮肥，并从顶部节点轻采收一次。",
        followup: "7 天后回来记录新叶香味，并拍整株侧面看是否还在徒长。",
        evidence: ["香味弱多与光照/氮肥/采收有关", "顶部采收促分枝", "照片只能辅助排除徒长"],
        reminders: [{
          key: "day7",
          task: "复查新叶香味、节间长度和采收后分枝",
          photo: "整株侧面和顶部新枝",
          success: "新叶香味增强，节间不再拉长，顶部出现更多侧枝。",
          reason: "香气变化需要结合新叶和采收节奏观察，通常 7 天更可靠"
        }]
      }
    },
    steps: [
      ["播种前", "准备有排水孔的育苗盘/小杯/浅盆，介质用疏松育苗土，或泥炭/椰糠加珍珠岩；不要用黏重园土和无孔容器。"],
      ["第 0 天", "每格撒 2-4 粒，薄覆 2-3mm，用喷壶喷湿；盖薄膜可以保湿，但每天要打开通风，不能浇成泥浆。"],
      ["第 5-14 天", "一发芽就见强光，移到最亮处或补植物灯；表土干了再喷，不要天天湿漉漉。"],
      ["第 1-3 周", "每杯保留最壮 1-2 株，每 1-2 天转盆；苗应短、直、偏壮，避免阴处徒长和叶面长期潮湿。"],
      ["第 3-4 周", "长出 2-3 对真叶后带土团分苗或移栽，单株 12-18cm 盆起步，缓苗 1-2 天先给明亮散射光。"],
      ["15-20cm 高", "第一次打顶，或在 4-6 对真叶时从一对叶子上方剪掉顶端，让腋芽长成两个分枝。"],
      ["看到花苞", "立刻摘掉；开花会让罗勒从长叶转向繁殖，叶片减少，口感和香味下降。"]
    ]
  },
  transplant: {
    label: "移栽/换盆",
    summary: "罗勒分苗和移栽要等根能包住一点土，第一目标是少伤根、稳排水、缓苗成功。",
    currentAction: "如果已有 2-3 对真叶，今天带土团移到有排水孔的 12-18cm 盆；浇透一次后，等表层 1-2cm 干了再浇。",
    pollination: "移栽稳定前不要让它开花消耗能量；食用叶片阶段不需要授粉，花苞先摘掉。",
    followup: "48 小时后回来拍一张整株照和一张茎基部特写，确认缓苗和黑脚/根腐风险。",
    evidence: ["2-3 对真叶再移栽", "12-18cm 排水盆起步", "缓苗期不重肥"],
    reminders: [{
      key: "48h",
      task: "确认萎蔫是否恢复、茎基部是否发黑",
      photo: "整株和茎基部特写",
      success: "新梢恢复挺立，茎基部不发黑，介质不长期积水。",
      reason: "移栽压力和黑脚/根腐风险先看 48 小时变化"
    }],
    steps: [
      ["移栽时机", "至少 2-3 对真叶，根系已经能包住一点土；太小时移栽根弱，容易萎蔫死亡。"],
      ["盆和介质", "单株 12-18cm 口径起步，想长大用 20cm 以上；必须有排水孔，介质要疏松透气。"],
      ["移栽方法", "带土团移，不裸根硬拔；不要把茎埋太深，茎基部长期潮湿容易腐烂。"],
      ["缓苗 1-2 天", "放明亮散射光，不立刻暴晒；只稳水分和空气流动，不施浓肥、不重剪。"],
      ["恢复后", "看到新梢挺立再逐步加光，之后进入打顶和轻采收节奏。"]
    ]
  },
  store: {
    label: "成品不移植",
    summary: "买回来的成品罗勒先隔离、适应光照和建立采收节奏；后续靠强光、通风、控水和打顶维持叶量。",
    currentAction: "今天先检查叶背、嫩梢和茎节；如果株高 15-20cm 或有 4-6 对真叶，从顶部节点上方轻打顶一次。",
    pollination: "成品罗勒若已经抽花，优先摘花和打顶；日常不需要授粉，只有留种才保留花穗。",
    followup: "3 天后回来拍一张整株照和一张叶背照，确认虫点、新梢和花穗。",
    evidence: ["先查叶背虫害", "15-20cm 可第一次打顶", "花苞会降低叶片产量"],
    reminders: [{
      key: "day3",
      task: "复查叶背虫点、采收后新梢和是否继续抽花",
      photo: "整株、叶背和顶部节点",
      success: "叶背没有新增虫点，新梢保持挺立，没有继续抽花或突然萎蔫。",
      reason: "买回隔离、轻采收和摘花后，3 天内能看出是否稳定"
    }],
    steps: [
      ["第 0 天", "隔离观察，翻看叶背、嫩梢和茎节；原盆状态稳定时先不要急着换盆。"],
      ["第 2-5 天", "逐步增加光照，减少叶面喷水；每天有空气流动，室内可用小风扇弱风。"],
      ["生长期", "光照越亮越好，每天尽量 6 小时以上强光；表层 1-2cm 干了再浇透，盆栽 2-3 周一次淡肥。"],
      ["第一次打顶", "长到 15-20cm 或 4-6 对真叶时，在一对叶子上方剪掉顶端；不要只摘最下面老叶。"],
      ["日常采收", "少量用叶从顶部嫩枝采，大量采收剪带节点枝条；早上叶片恢复挺度后采更稳。"],
      ["看到花苞", "顶部出现小花穗就摘，从花苞下面一对叶子上方剪；不要等花全开才处理。"]
    ]
  }
};

const englishBasilGuidancePlans = {
  seed: {
    label: "Seed",
    summary: "From sowing to the first pinch, basil is most vulnerable to stale humidity, weak light, and waterlogging. The goal is compact seedlings, early branching, and no flowers.",
    currentAction: "Today, sow 2-4 seeds per cell, cover with 2-3 mm of mix, mist gently, and use a clear cover for humidity. Open it every day for airflow; do not seal it shut.",
    pollination: "Basil is not a fruiting crop for daily harvest. It does not need hand pollination unless you are saving seed; for leaf production, remove flower spikes as soon as you see them.",
    followup: "Come back in 7 days. Take one side photo of the seed cup and one close photo of the soil surface or seedlings.",
    evidence: ["Sow only 2-3 mm deep", "Warm germination near 24C", "Humidity cover needs airflow"],
    reminders: [{
      key: "day7",
      task: "Check germination, legginess, and any mold or damping-off.",
      photo: "Seed cup side view and soil-surface close-up",
      success: "Seedlings are short and upright, the surface is moist but not muddy, and there is no white mold or collapse.",
      reason: "Basil usually germinates in 5-14 days, so day 7 is a useful first checkpoint."
    }],
    stageActions: {
      seedling: {
        currentAction: "If seedlings have emerged, move them to the brightest spot or a grow light today. Open the cover for airflow and keep only the strongest 1-2 seedlings per cup.",
        followup: "Come back in 7 days. Take a side photo and a top close-up to check internode length and stem strength.",
        evidence: ["Light immediately after sprouting", "Keep 1-2 seedlings per cup", "Water after the surface starts drying"],
        reminders: [{
          key: "day7",
          task: "Review legginess, collapse, and true-leaf count.",
          photo: "Seedling side view and true-leaf close-up",
          success: "Stems are short and upright, leaf color is even, true leaves are starting, and there is no collapse or mold.",
          reason: "Light and airflow changes usually show in the seedling shape within 7 days."
        }]
      },
      vegetative: {
        currentAction: "If it has 2-3 pairs of true leaves, transplant it today with the root ball into a draining 12-18 cm pot. Give bright indirect light for the first 1-2 days.",
        followup: "Come back in 48 hours. Take one whole-plant photo and one stem-base close-up to confirm recovery.",
        evidence: ["Transplant after 2-3 true-leaf pairs", "Move with the root ball", "Bright indirect light during recovery"],
        reminders: [{
          key: "48h",
          task: "Check whether the transplant has stood back up and whether the stem base is darkening.",
          photo: "Whole plant and stem-base close-up",
          success: "New tips are upright, the stem base is not dark, and the pot drains normally.",
          reason: "Root injury, black leg, and root-rot risk often show within the first 48 hours."
        }]
      },
      flowering: {
        currentAction: "If you see flower buds today, cut just above the leaf pair below the spike. Do not wait for full bloom, and do not pollinate basil grown for leaves.",
        followup: "Come back in 3 days. Take a top-node photo and a whole-plant side photo to see whether it keeps flowering.",
        evidence: ["Flower buds reduce leaf yield", "Cut above the leaf pair below the spike", "Do not keep flower spikes for leaf harvest"],
        reminders: [{
          key: "day3",
          task: "Check whether flowering continues and whether side shoots resume.",
          photo: "Top node and whole-plant side view",
          success: "No new spike is stretching up, the top is branching, and leaf volume is not dropping.",
          reason: "Three days is enough to see whether pinching has slowed the plant's shift into flowering."
        }]
      },
      aroma: {
        currentAction: "Weak aroma cannot be judged from a photo alone. Today, increase effective light, pause heavy nitrogen feeding, and lightly harvest from the top node.",
        followup: "Come back in 7 days. Record aroma on new leaves and take a side photo to check whether it is still stretching.",
        evidence: ["Weak aroma often tracks light, nitrogen, and harvest rhythm", "Top harvest encourages branching", "Photos only help rule out legginess"],
        reminders: [{
          key: "day7",
          task: "Review new-leaf aroma, internode length, and branching after harvest.",
          photo: "Whole-plant side view and top shoots",
          success: "New leaves smell stronger, internodes stop stretching, and more side shoots appear.",
          reason: "Aroma should be checked on new leaves after the light and harvest rhythm have had time to work."
        }]
      }
    },
    steps: [
      ["Before sowing", "Use a tray, cup, or shallow pot with drainage holes. Choose loose seed-starting mix, or peat/coco plus perlite. Avoid heavy garden soil and containers without holes."],
      ["Day 0", "Sow 2-4 seeds per cell, cover with 2-3 mm of mix, and mist gently. A clear cover can hold humidity, but open it daily; do not turn the mix into mud."],
      ["Day 5-14", "As soon as it sprouts, move it into strong light or under a grow light. Mist only after the surface starts to dry; do not keep it soggy every day."],
      ["Week 1-3", "Keep the strongest 1-2 seedlings per cup and rotate the pot every 1-2 days. Seedlings should be short, straight, and sturdy."],
      ["Week 3-4", "After 2-3 pairs of true leaves, transplant with the root ball into a 12-18 cm pot and give bright indirect light for 1-2 days."],
      ["15-20 cm tall", "Pinch for the first time when the plant is 15-20 cm tall or has 4-6 true-leaf pairs. Cut just above a leaf pair to create two side shoots."],
      ["Flower buds", "Remove them immediately. Flowering shifts basil from leaf growth into reproduction, reducing leaf yield, texture, and aroma."]
    ]
  },
  transplant: {
    label: "Transplant",
    summary: "Basil transplanting works best once the roots can hold a little soil. The first goal is to avoid root damage, keep drainage open, and let the plant recover.",
    currentAction: "If it has 2-3 pairs of true leaves, move it today with the root ball into a draining 12-18 cm pot. Water through once, then wait until the top 1-2 cm dries before watering again.",
    pollination: "Do not let a recovering transplant spend energy on flowers. Basil grown for leaves does not need pollination; remove flower buds first.",
    followup: "Come back in 48 hours. Take one whole-plant photo and one stem-base close-up to check recovery and black-leg or root-rot risk.",
    evidence: ["Transplant after 2-3 true-leaf pairs", "Start with a 12-18 cm draining pot", "No heavy feed during recovery"],
    reminders: [{
      key: "48h",
      task: "Confirm whether wilting has recovered and whether the stem base is darkening.",
      photo: "Whole plant and stem-base close-up",
      success: "New tips are upright, the stem base is not dark, and the mix is not staying waterlogged.",
      reason: "Transplant stress and black-leg/root-rot risk are easiest to catch in the first 48 hours."
    }],
    steps: [
      ["Timing", "Wait for at least 2-3 pairs of true leaves and roots that can hold a little soil. Moving tiny seedlings too early often kills them."],
      ["Pot and mix", "Start one plant in a 12-18 cm pot; use 20 cm or larger if you want a bigger plant. Drainage holes and airy mix are non-negotiable."],
      ["Method", "Move it with the root ball. Do not hard-pull bare roots, and do not bury the stem too deep."],
      ["First 1-2 days", "Use bright indirect light, not immediate harsh sun. Stabilize water and airflow; do not add strong fertilizer or hard prune."],
      ["After recovery", "Once new tips stand upright, increase light gradually and return to pinching and light harvesting."]
    ]
  },
  store: {
    label: "Store plant",
    summary: "A store-bought basil plant should first be isolated, adapted to light, and put on a harvest rhythm. Strong light, airflow, careful watering, and pinching keep leaf volume high.",
    currentAction: "Today, inspect leaf undersides, new tips, and stem nodes. If it is 15-20 cm tall or has 4-6 true-leaf pairs, lightly pinch above a top node.",
    pollination: "If a store-bought plant is already flowering, prioritize removing flower spikes and pinching. Daily basil care does not need pollination; keep flowers only for seed saving.",
    followup: "Come back in 3 days. Take one whole-plant photo and one leaf-underside photo to check pests, new tips, and flower spikes.",
    evidence: ["Inspect leaf undersides first", "Pinch at 15-20 cm", "Flower buds reduce leaf yield"],
    reminders: [{
      key: "day3",
      task: "Review leaf-underside pest dots, new shoots after harvest, and whether it keeps flowering.",
      photo: "Whole plant, leaf underside, and top node",
      success: "No new pest dots appear, new tips stay upright, and the plant does not keep pushing flower spikes.",
      reason: "After isolation, light harvest, and flower removal, stability should be visible within 3 days."
    }],
    steps: [
      ["Day 0", "Isolate and inspect leaf undersides, new tips, and stem nodes. If the original pot is stable, do not rush repotting."],
      ["Day 2-5", "Increase light gradually and reduce leaf spraying. Keep air moving; a small fan on low works indoors."],
      ["Growth phase", "Give as much bright light as possible, ideally 6+ hours. Water through after the top 1-2 cm dries. Use light fertilizer every 2-3 weeks."],
      ["First pinch", "At 15-20 cm tall or 4-6 true-leaf pairs, cut above a leaf pair. Do not only remove the lowest old leaves."],
      ["Harvest", "For a few leaves, harvest tender top shoots. For more, cut a stem with a node. Morning harvest is usually steadier."],
      ["Flower buds", "Remove small flower spikes as soon as they appear, cutting above the leaf pair below the spike. Do not wait until full bloom."]
    ]
  }
};

const cropCareGuidancePlans = {
  basil: basilGuidancePlans,
  tomato: {
    seed: {
      label: "Seedling",
      summary: "矮生番茄从种子或小苗开始时，重点是防徒长、少株数、早建立花序复查基线。",
      currentAction: "如果已有 2-4 片真叶，今天只做一件事：增加有效光照并确认每株有独立空间；不要同时加大肥和换大盆。",
      followup: "Come back in 7 days. Take one whole-plant side photo to compare internodes.",
      evidence: ["Light and spacing first", "Keep 1-2 compact plants", "Pollinate only after flowers open"],
      reminders: [{
        key: "day7",
        task: "对比节间长度、株型紧凑度和是否准备进入花序期",
        photo: "整株侧面和顶部新叶",
        success: "节间没有继续拉长，新叶稳定，植株没有因高氮只长叶。",
        reason: "防徒长和少株数调整需要 7 天才能看出株型方向"
      }]
    },
    transplant: {
      label: "Transplant",
      summary: "移栽矮生番茄先稳根，再进入开花授粉；缓苗期最怕强光、缺水和重肥同时发生。",
      currentAction: "移栽后的 48 小时先稳水分和温度，拍整株基线；看到新叶恢复挺立即逐步加光，不要马上重肥。",
      followup: "Come back in 3 days. Take the same whole-plant angle and one stem-base photo.",
      evidence: ["Hold transplant stress", "No heavy feed today", "Flower check after recovery"],
      reminders: [{
        key: "day3",
        task: "确认缓苗是否恢复，再决定是否进入开花/授粉管理",
        photo: "同角度整株和茎基部",
        success: "新叶恢复挺立，茎基部稳定，没有继续萎蔫。",
        reason: "番茄移栽恢复通常第 3 天能判断是否可以加光和进入下一阶段"
      }]
    },
    store: {
      label: "Store plant",
      summary: "买来的矮生番茄先确认是否真的是紧凑品种，再管理光照、支撑和授粉。",
      currentAction: "今天先检查株高、标签和花序；如果已经开花，中午轻弹花序 5 秒，先不要换盆和重剪。",
      followup: "Come back in 3-5 days. Take one flower-cluster photo to check fruit set.",
      evidence: ["Confirm compact variety", "Hand pollinate open flowers", "Watch heat and water swings"],
      reminders: [{
        key: "day3",
        task: "记录同一花序的开花数、落花数和小果保留数",
        photo: "同一花序/小果特写",
        success: "落花减少，小果开始保留或膨大。",
        reason: "番茄轻弹授粉后通常 3-5 天能看到坐果第一轮信号"
      }]
    }
  },
  rosemary: {
    seed: {
      label: "Young plant",
      summary: "迷迭香早期生长慢，主动养护的核心是强光、通风和偏干根区，不追求快速长大。",
      currentAction: "今天把它放到最亮且通风的位置，等表层明显变干再浇水；不要为了促长频繁施肥。",
      followup: "Come back in 7 days. Take one whole-plant side photo and one soil-surface photo.",
      evidence: ["Strong light", "Airflow", "Let the root zone dry down"],
      reminders: [{
        key: "day7",
        task: "确认新梢是否紧凑、叶尖是否继续发黑、根区是否过湿",
        photo: "整株侧面和土表",
        success: "新梢稳定，叶尖不继续发黑，土表能正常干湿循环。",
        reason: "迷迭香强光、通风和控水调整需要 7 天观察"
      }]
    },
    transplant: {
      label: "Transplant",
      summary: "迷迭香移栽后最怕闷湿和根区缺氧，缓苗期要少动、少水、强通风。",
      currentAction: "移栽后的 72 小时先不追肥、不重剪，只保持明亮散射光和空气流动；盆土湿时不要补水。",
      followup: "Come back in 48-72 hours. Take a root-zone or soil-surface photo.",
      evidence: ["Avoid wet roots", "No heavy pruning", "Check stem base"],
      reminders: [{
        key: "48h",
        task: "确认移栽后根区没有长期闷湿，茎基部没有发黑",
        photo: "土表、盆口和茎基部",
        success: "茎基部不发黑，叶尖不继续恶化，土表不是一直湿亮。",
        reason: "迷迭香移栽后的闷湿风险优先看 48-72 小时"
      }]
    },
    store: {
      label: "Store plant",
      summary: "买来的迷迭香常见问题是原盆过湿、室内弱光或突然重剪，先做环境适应。",
      currentAction: "今天先检查盆土是否一直湿、叶尖是否发黑；放到强光通风处，先不要换大盆。",
      followup: "Come back in 3 days. Take the same side photo and soil-surface photo.",
      evidence: ["Check wet soil", "Strong light acclimation", "Do not overwater"],
      reminders: [{
        key: "day3",
        task: "复查盆土干湿、叶尖发黑和环境适应情况",
        photo: "同角度整株和土表",
        success: "叶尖没有继续发黑，盆土开始有干湿变化，植株不继续萎蔫。",
        reason: "买回后控水和强光适应 3 天内能看出是否稳定"
      }]
    }
  },
  strawberry: {
    seed: {
      label: "Runner/seed",
      summary: "草莓早期重点是 crown 不埋不湿、强光和根系稳定；开花后才进入授粉管理。",
      currentAction: "今天确认冠部露在介质表面、没有被水泡住；如果还没开花，先只稳光照和水分。",
      followup: "Come back in 7 days. Take one crown photo and one whole-plant photo.",
      evidence: ["Crown stays dry", "No pollination before flowers", "Watch new leaf quality"],
      reminders: [{
        key: "day7",
        task: "确认冠部干爽、新叶质量和是否进入开花窗口",
        photo: "冠部特写和整株",
        success: "冠部不潮湿腐软，新叶稳定，未开花前不误做授粉动作。",
        reason: "草莓早期先看冠部和根系稳定，7 天后再判断是否进入花期"
      }]
    },
    transplant: {
      label: "Transplant",
      summary: "草莓移栽后先防冠部潮湿和缓苗萎蔫，再看开花和果形。",
      currentAction: "今天把冠部露出来并擦干周围积水，缓苗期不要把水喷进叶心。",
      followup: "Come back in 48 hours. Take a crown close-up from the same angle.",
      evidence: ["Crown above medium", "Avoid misting crown", "Check wilt recovery"],
      reminders: [{
        key: "48h",
        task: "确认冠部是否保持干爽、缓苗萎蔫是否恢复",
        photo: "同角度冠部特写",
        success: "冠部不积水、不发黑，新叶和叶柄不继续塌软。",
        reason: "草莓移栽后冠部潮湿风险 48 小时内最需要复查"
      }]
    },
    store: {
      label: "Store plant",
      summary: "买来的草莓如果已经开花，客户最需要知道何时人工授粉、何时看坐果。",
      currentAction: "如果花已完全打开，今天中午用小刷子轻刷花心 3-5 秒；没开花就只保持冠部干爽。",
      followup: "Come back in 3 days. Take one same-flower photo to check early fruit set.",
      evidence: ["Hand pollinate open flowers", "Dry crown", "Review fruit set in 3 days"],
      reminders: [{
        key: "day3",
        task: "复查同一朵花是否开始坐果，果形是否正常",
        photo: "同一朵花或刚坐果的小果",
        success: "花心开始膨大，小果保留，下一批果形不明显畸形。",
        reason: "草莓软刷授粉后 3 天左右能看到早期坐果信号"
      }]
    }
  },
  pepper: {
    seed: {
      label: "Seedling",
      summary: "矮生辣椒前期要先建立紧凑株形和根区稳定，避免氮肥过高导致只长叶不开花。",
      currentAction: "如果还没开花，今天先把补光稳定到 14 小时左右，并避免继续加高氮肥。",
      followup: "Come back in 7 days. Take one whole-plant side photo to compare compact growth.",
      evidence: ["Compact growth first", "Avoid excess nitrogen", "Pollinate after flowers open"],
      reminders: [{
        key: "day7",
        task: "对比株型紧凑度、顶部新叶和是否出现第一批花苞",
        photo: "整株侧面和顶部新叶",
        success: "节间稳定，没有继续只长叶；若出现花苞，再进入授粉/控温复查。",
        reason: "辣椒补光和控氮调整需要 7 天观察株型方向"
      }]
    },
    transplant: {
      label: "Transplant",
      summary: "辣椒移栽后先稳根区和温度；缓苗未恢复前不要急着催花催果。",
      currentAction: "移栽后 48 小时内保持根区微湿但不忽干忽湿，避开灯下过热；今天不要重肥。",
      followup: "Come back in 3 days. Take one whole-plant side photo and one new-tip photo.",
      evidence: ["Hold moisture steady", "Avoid heat swings", "No heavy feed today"],
      reminders: [{
        key: "day3",
        task: "确认缓苗是否恢复、顶部新叶是否继续生长",
        photo: "整株侧面和新梢",
        success: "新梢恢复挺立，叶片不继续下垂，灯下温度没有造成萎蔫。",
        reason: "辣椒移栽后第 3 天适合判断是否可以恢复正常光照和营养"
      }]
    },
    store: {
      label: "Store plant",
      summary: "买来的小型辣椒如果已经带花苞，重点是控温、稳水和辅助授粉。",
      currentAction: "如果已有开放花，今天中午轻弹花柄 5 秒并确认灯下温度不过热；落花时先稳温水，不急着加肥。",
      followup: "Come back in 3-5 days. Take one flower or young-fruit node photo.",
      evidence: ["Hand pollinate open flowers", "Control heat", "Watch flower drop"],
      reminders: [{
        key: "day3",
        task: "记录开放花、落花和小果保留情况",
        photo: "同一花/幼果节点特写",
        success: "落花减少，小果保留，灯下高温或忽干忽湿没有继续触发落花。",
        reason: "辣椒辅助授粉和稳温水后 3-5 天能看出落花方向"
      }]
    }
  }
};

const detailedCropCareGuidancePlans = {
  tomato: {
    seed: {
      label: "种子/小苗",
      summary: "矮生番茄从小苗开始，核心不是催长，而是强光、少株数、稳水分，并提前准备花序复查基线。",
      currentAction: "今天把小苗移到最亮的位置或补植物灯，单盆只保留 1 株强苗；如果还没开花，不要急着授粉或上高氮肥。",
      pollination: "番茄只有花完全打开后才需要辅助授粉；开花前的重点是光照、根区稳定和株型紧凑。",
      followup: "7 天后回来拍整株侧面照，比较节间、株高和顶部新叶；看到第一串花后改拍花序复查照。",
      evidence: ["先稳株型再催花", "单盆 1 株更容易坐果", "开花后才授粉"],
      reminders: [{
        key: "day7",
        task: "复查节间长度、顶部新叶和是否出现第一串花序",
        photo: "整株侧面和顶部新叶",
        success: "节间不再拉长，新叶厚实，植株没有只长叶不开花。",
        reason: "番茄小苗的光照和株数调整通常 7 天能看出方向"
      }],
      stageActions: {
        seedling: {
          currentAction: "如果只有小苗，今天先补强光并间苗，每盆留下最壮 1 株；不要让多株挤在一起抢光。",
          followup: "7 天后拍整株侧面照，确认是否仍然徒长。",
          evidence: ["小苗先防徒长", "每盆保留 1 株", "不要用高氮催长"]
        },
        vegetative: {
          currentAction: "营养生长期今天先检查灯距和支撑；如果株高继续冲高，增加光照并轻绑支撑，不要重剪主干。",
          followup: "7 天后拍同角度整株侧面照，比较节间是否变短。",
          evidence: ["灯距优先", "轻支撑", "不重剪主干"]
        },
        flowering: {
          currentAction: "如果花已经完全打开，今天中午轻弹花序 5 秒，或用小风扇低速吹 10 分钟；不要在花还没开时反复碰花苞。",
          followup: "3-5 天后拍同一花序，确认落花是否减少、小果是否开始保留。",
          evidence: ["开放花才授粉", "中午操作更稳", "3-5 天看坐果"]
        },
        fruiting: {
          currentAction: "结果后今天先稳水分和灯下温度，保留强壮果串；不要频繁换液、忽干忽湿或一次摘太多叶。",
          followup: "5-7 天后拍同一果串和顶部新叶，确认小果是否继续膨大。",
          evidence: ["结果期怕水分波动", "保留强壮果串", "不要大幅改参数"]
        }
      },
      steps: [
        ["总原则", "矮生番茄要强光、少株数、稳水分。先把株型养紧凑，再进入开花授粉，不要小苗期急着催花。"],
        ["小苗期", "出真叶后每盆只留 1 株，补强光到每天 12-16 小时；如果茎细节间长，先补光而不是加肥。"],
        ["移栽/定植", "2-4 片真叶后可移到 12-18cm 以上排水盆，带土团移，缓苗 2-3 天内不重肥。"],
        ["修剪/支撑", "矮生番茄通常不需要重度打顶；只清理贴土老叶和明显病叶，开花前先做好支撑。"],
        ["授粉时机", "第一串花完全打开后，中午轻弹花序或用软刷/低速风辅助授粉；未开花时不需要授粉。"],
        ["控水控温", "表层略干再浇透，结果期避免忽干忽湿；灯下过热或夜间偏冷都会增加落花。"],
        ["复查", "小苗 7 天看节间；开花后 3-5 天拍同一花序；结果后 5-7 天拍同一果串。"],
        ["不要做", "不要多株挤一盆、不要小苗期高氮猛催、不要花苞没开就授粉、不要结果期频繁大改水肥。"]
      ]
    },
    transplant: {
      label: "移栽/换盆",
      summary: "番茄移栽后先稳根和水分，缓苗恢复后再加光、支撑和授粉；不要把所有变量同时改变。",
      currentAction: "今天只做缓苗：浇透一次后保持明亮散射光，确认排水正常；不要马上重肥、重剪或强行授粉。",
      pollination: "移栽恢复前不做授粉。看到新叶恢复挺立、花完全打开后，再轻弹花序或用软刷辅助。",
      followup: "3 天后拍同角度整株照和茎基部近照，确认是否恢复挺立、茎基部是否健康。",
      evidence: ["先缓苗", "不同时重肥重剪", "恢复后再授粉"],
      reminders: [{
        key: "day3",
        task: "确认缓苗是否恢复、茎基部是否稳定",
        photo: "同角度整株和茎基部",
        success: "新叶恢复挺立，茎基部不发黑，盆底排水正常。",
        reason: "番茄移栽压力通常 3 天能看出是否进入恢复"
      }],
      steps: [
        ["移栽时机", "2-4 片真叶或根系能包住土团后再移栽，避免裸根硬拔。"],
        ["盆和介质", "单株 12-18cm 起步，结果型建议更大盆或更稳定储液；必须有排水孔。"],
        ["当天动作", "带土团移栽，浇透一次，放明亮散射光；先拍整株基线。"],
        ["缓苗 3 天", "保持水分稳定，不重肥、不重剪、不暴晒；看到新梢挺立再逐步加光。"],
        ["后续支撑", "恢复后轻绑主干和花序，避免结果后枝条压弯。"],
        ["授粉", "只有开放花需要轻弹/软刷授粉，花苞阶段不处理。"],
        ["复查", "3 天看缓苗；开花后 3-5 天看同一花序是否坐果。"],
        ["不要做", "不要移栽后马上大肥、不要把茎埋太深、不要根没恢复就暴晒或催花。"]
      ]
    },
    store: {
      label: "成品不移植",
      summary: "买回来的矮生番茄先确认品种、株高和花序状态；如果已经开花，优先做授粉和稳环境。",
      currentAction: "今天检查标签、株高、花序和灯下温度；若有开放花，中午轻弹花序 5 秒，并拍同一花序作为基线。",
      pollination: "开放花可以每天轻弹或软刷 1 次，连续 3-5 天观察同一花序；没有开放花时不要硬碰花苞。",
      followup: "3-5 天后拍同一花序/小果，确认落花是否减少、小果是否保留。",
      evidence: ["先确认矮生品种", "开放花才授粉", "同一花序复查"],
      reminders: [{
        key: "day3",
        task: "复查同一花序的落花和坐果",
        photo: "同一花序或小果特写",
        success: "落花减少，花托膨大或小果开始保留。",
        reason: "番茄授粉后 3-5 天通常能看到第一轮坐果信号"
      }],
      steps: [
        ["第 0 天", "检查标签是否为矮生/紧凑品种，拍整株和花序基线；普通高大型番茄不适合小设备长期养。"],
        ["适应期", "先稳定光照和水分，不急着换盆；叶片恢复挺立后再逐步加光。"],
        ["开花后", "中午轻弹花序 5 秒，或低速风吹 10 分钟；连续几天观察同一花序。"],
        ["修剪", "只去除贴土老叶、遮挡通风的病弱叶；不要大幅打顶或一次摘掉很多叶。"],
        ["控水", "表层略干后浇透，结果期避免忽干忽湿；水分波动会放大卷叶和落花。"],
        ["复查", "3-5 天拍同一花序，7 天拍整株和果串。"],
        ["不要做", "不要花苞没开就授粉、不要频繁换盆、不要用高氮催叶、不要让灯太近烤花。"]
      ]
    }
  },
  rosemary: {
    seed: {
      label: "小苗/扦插苗",
      summary: "迷迭香可以播种，但家庭新手不建议优先从种子开始；更稳的是小苗或扦插苗。核心是强光、通风、高排水介质和偏干根区。",
      currentAction: "今天先确认路线：如果是小苗/扦插苗，放到最亮且有空气流动的位置；等盆明显变轻、表层干透再浇透，不要按固定日期天天浇。",
      pollination: "迷迭香作为香草日常不需要人工授粉；现阶段也不以开花为目标，先让根区、新梢和香味稳定。",
      followup: "7 天后拍整株侧面、盆口和土表照片，确认叶尖是否继续发褐、土表是否能正常干湿循环。",
      evidence: ["小苗/扦插优先于种子", "强光和空气流动", "盆轻且表层干透再浇"],
      reminders: [{
        key: "day7",
        task: "复查新梢、叶尖 brown/die-back 和盆土干湿循环",
        photo: "整株侧面、盆口和土表",
        success: "叶尖不继续发褐或发黑，新梢稳定，土表能从湿变干。",
        reason: "迷迭香对光、风和浇水节奏的变化通常需要 7 天观察枝梢方向"
      }],
      stageActions: {
        seedling: {
          currentAction: "幼苗/刚生根插穗阶段今天先稳微湿和强光通风：出苗后不要长期盖透明盖，补光 14-16 小时；每天看茎基部有没有变细、水渍状或发黑。",
          followup: "7 天后拍整株侧面、茎基部和土表，确认没有猝倒、根颈发黑或继续软塌。",
          evidence: ["出苗后要通风", "14-16 小时补光", "每天查茎基部"]
        },
        vegetative: {
          currentAction: "营养生长期今天转盆到均匀受光，轻掐有叶绿色顶梢促分枝；顺手翻看叶背和枝条内侧，清掉枯枝残叶。",
          followup: "7 天后拍整株侧面和新梢，比较新枝是否更紧凑、叶背是否没有虫点。",
          evidence: ["均匀受光", "轻剪绿色新梢", "每周查叶背"]
        },
        wet: {
          currentAction: "如果整株萎蔫但土是湿的，今天立刻停水并检查排水、根颈和气味；根黑软或有臭味时，剪健康枝条扦插备份。",
          followup: "48 小时后拍土表、根颈/茎基部和枝梢，确认黑尖、软腐或异味是否停止扩大。",
          evidence: ["湿土萎蔫先疑根", "根黑软要备份扦插", "萎蔫不等于缺水"]
        },
        dry: {
          currentAction: "如果叶尖 brown、枝条内膛干枯但盆很轻，今天沿盆边浇透一次并让多余水排出；不要改成天天浇。",
          followup: "24-48 小时后拍枝梢和盆口，确认干枯范围没有继续扩大。",
          evidence: ["叶尖 brown", "盆明显变轻", "浇透但不天天浇"]
        },
        aroma: {
          currentAction: "香味弱时，今天先增加直射光/强补光，减少大肥和过水；不要为了长得快一直催嫩叶。",
          followup: "7 天后记录新梢香味，并拍整株侧面看枝条是否更紧凑。",
          evidence: ["强光积累精油", "偏干不过肥更香", "嫩水枝香味弱"]
        },
        pest: {
          currentAction: "如果叶面密集黄点、发灰、细网或嫩梢发黏，今天先隔离，补拍枝条内侧和叶背；不要先喷叶保湿。",
          followup: "24-48 小时后拍同一枝条内侧，确认小虫、细网或黏液是否减少。",
          evidence: ["细网/黄点看叶螨", "发黏看吸汁虫", "先隔离再处理"]
        },
        flowering: {
          currentAction: "如果迷迭香开花，先不要当成病害。想要叶量和香味时，花后只轻剪有叶新梢；想观赏或留给昆虫，可以保留一部分花。",
          followup: "7 天后拍同一开花枝和整株侧面，确认花后新梢是否恢复、株型没有继续拉长。",
          evidence: ["开花是正常生命周期", "花后轻剪", "不要剪进裸老木"]
        },
        humid: {
          currentAction: "湿热或连续阴雨时，今天把盆移到见光但避长雨的位置，倒掉托盘水，清理内膛枯枝；浇水前先确认表层约 3cm 已干。",
          followup: "3-5 天后拍土表、盆底和枝条内侧，确认没有持续湿亮、灰霉或小虫增加。",
          evidence: ["湿热重在避长雨", "强通风快排水", "表层 3cm 干再浇"]
        },
        leggy: {
          currentAction: "如果新枝拉长、叶片稀、基部光秃，今天先补光并轻剪有叶新梢；不要为了补救一刀剪到无叶老木。",
          followup: "7 天后拍整株侧面，确认新节间是否缩短、底部没有继续光秃。",
          evidence: ["先补光", "只剪有叶新梢", "老木不可靠重萌"]
        },
        cold: {
          currentAction: "冬季或冷窗旁时，今天把盆移离冷玻璃和冷风，先少浇水、保光照；冷而湿比单纯低温更危险。",
          followup: "7 天后拍整株侧面和土表，确认枝条没有继续发黑或干枯。",
          evidence: ["低温叠加湿土危险", "移离冷窗", "冬季少浇水"]
        }
      },
      steps: [
        ["总原则", "迷迭香喜欢强光、通风、快排水和按土浇水；耐旱不等于要反复旱到萎蔫，也不能用水和肥催快。"],
        ["路线选择", "播种适合体验完整生命周期但发芽慢、不整齐；扦插和买小苗更快、更稳定，适合大多数家庭用户。"],
        ["播种", "用洁净轻质介质浅播，多播几粒并记录日期；出苗前保持表面微湿，不要深埋、长期泡水或一两周没发芽就丢弃。"],
        ["扦插", "选 10-15cm 无花、无虫、不过度木质化的新梢，去掉下部叶片，插入珍珠岩等透气介质；保湿但每天通风，别让基部泡烂。"],
        ["生根驯化", "轻拉有阻力、基部不黑不臭并有稳定新梢后，再逐步开盖和加光；看到新梢不等于根已足够，别过早移栽。"],
        ["选苗", "选枝叶紧凑、叶色灰绿、根颈不黑的小苗；不要买盆土长期湿、枝条大面积发褐的苗。"],
        ["配土/选盆", "成熟盆栽逐步用 25-30cm 以上带孔盆；介质可按 3 份稳定基质 + 1 份珍珠岩/粗砂/火山石起步，湿热地区再按干燥速度加颗粒。"],
        ["浇水", "先摸土再浇，表层约 3cm 干、盆明显变轻后一次浇透并倒掉托盘水；不要按固定日期天天浇，也不要湿土萎蔫还补水。"],
        ["施肥", "新鲜盆土和幼苗先不急施肥；看到持续新根新梢后从低端剂量或半浓度低频开始，湿土有异味时绝不能靠加肥解决。"],
        ["修剪/采收", "剪有叶绿色新梢并保留节点，一次采收保守不超过约 20% 生长量；不要只摘底部叶，也不要剪进裸露老木。"],
        ["花期", "开花本身不是病害；想要嫩叶时花后轻剪，想观赏或留给昆虫时可保留部分花，不要把开花当成马上死亡。"],
        ["病虫观察", "正常叶背可呈均匀灰白；白粉是不规则扩大粉斑。黄点、发灰、细网看叶螨；发黏看蚜虫/白粉虱；银白擦伤和黑点看蓟马。"],
        ["每周/月检查", "每周查盆重、叶背、托盘积水、徒长和枯叶；每月查排水速度、土面板结、根颈是否被埋、是否盘根和施肥记录。"],
        ["湿热/雨季", "放在日照最长且避连续淋雨的位置，盆与盆留空，不每天喷雾，不让套盆和托盘长期存水。"],
        ["冬季", "入室前查叶背虫害并清枯枝；室内放最亮偏凉处，少浇水、少施肥、保通风，每周看叶螨。"],
        ["复查", "过湿/根颈风险 48 小时看土表和茎基部；虫害 24-48 小时看叶背；日常光照、修剪、香味调整 7 天看新梢。"],
        ["不要做", "不要喷叶保湿、不要大肥催嫩叶、不要长期放北窗暗厨房或阴湿阳台、不要移栽后立刻暴晒。"]
      ]
    },
    transplant: {
      label: "移栽/换盆",
      summary: "迷迭香移栽的第一目标是保住根系透气和根颈健康；移栽前后要炼苗、保根团、别用远大于根团的湿重花盆。",
      currentAction: "今天只做缓苗：带土团移到高排水介质，种植深度接近原根颈；放明亮散射光和通风处，盆土湿就不浇水。",
      pollination: "移栽期不考虑开花或授粉；如果有花，也先保证根区恢复，不让花消耗缓苗能量。",
      followup: "48-72 小时后拍土表、盆口和根颈/茎基部，确认没有持续湿亮、发黑或软腐。",
      evidence: ["根颈不要埋深", "排水孔必须顺畅", "缓苗不重剪重肥"],
      reminders: [{
        key: "48h",
        task: "复查移栽后根区是否闷湿、根颈是否发黑",
        photo: "土表、盆口和根颈/茎基部",
        success: "根颈不发黑，叶尖不继续恶化，土表开始变干。",
        reason: "迷迭香移栽后的闷根和根颈腐风险最先在 48-72 小时出现"
      }],
      steps: [
        ["移栽时机", "根系能固定土团后再换盆；新买回家当天如果状态稳定，可以先观察，不急着换。"],
        ["炼苗", "从育苗盒、高湿环境或室内转到强光前，先逐步增加开盖时间、通风和直射光。"],
        ["盆和介质", "选排水孔明显的陶盆或塑料盆，别直接种进远大于根团的湿重花盆；介质要疏松，可加入珍珠岩、粗砂、火山石或颗粒提高透气。"],
        ["当天动作", "带土团移，根颈不要埋太深；需要浇水时浇透一次后让多余水完全流出，倒掉托盘积水。"],
        ["缓苗 3 天", "放明亮散射光和通风处，不追肥、不重剪、不连续补水；观察叶尖、根颈和盆土变化。"],
        ["暴晒处理", "不要换盆后立刻全天强烈西晒；看到新梢恢复挺立后，再逐步加直射光或补光强度。"],
        ["修剪", "恢复后只轻剪有叶嫩梢，避免剪到光秃老木质枝，老枝恢复能力差。"],
        ["复查", "48-72 小时看根区和根颈，7 天看新梢是否稳定。"],
        ["不要做", "不要无孔盆、不要保水泥炭过多、不要埋深根颈、不要移栽后马上暴晒和重肥。"]
      ]
    },
    store: {
      label: "成品不移植",
      summary: "买来的迷迭香先观察原盆湿度、根颈、叶尖、叶背虫害和是否盘根；稳定前不要急着换大盆或做造型重剪。",
      currentAction: "今天检查土表是否长期湿亮、根颈是否发黑、叶背是否有虫/蜜露/细网、叶尖是否发褐；把它放到强光通风处，先不要换盆。",
      pollination: "成品迷迭香日常不需要授粉。它的重点是枝梢健康、香味和根区干湿循环，不是开花结果。",
      followup: "3 天后拍同角度整株、根颈和土表，确认叶尖不再恶化、盆土开始有干湿变化。",
      evidence: ["先查湿土和根颈", "强光通风适应", "不要过水或大肥"],
      reminders: [{
        key: "day3",
        task: "复查盆土干湿、叶尖发褐/发黑和环境适应",
        photo: "同角度整株、根颈和土表",
        success: "叶尖没有继续发褐或发黑，盆土开始变干，植株不继续萎蔫。",
        reason: "买回后控水、强光和通风适应 3 天内能看出是否稳定"
      }],
      steps: [
        ["第 0 天", "隔离观察，检查叶尖、枝条内侧、根颈和土表；原盆稳定时不要急换大盆。"],
        ["第 1-3 天", "逐步增强光照和通风；土表湿亮时不要补水，避免闷在套盆积水里。"],
        ["黄叶判断", "老叶先黄且土湿，优先怀疑过湿和根系缺氧；土干、盆轻、叶片灰黄时，再考虑缺水或空气过干。"],
        ["修剪/采收", "只轻剪顶端有叶新梢或枯枝，采收剪带节点嫩枝；一次不要去掉太多叶面积，也不要只摘单片叶。"],
        ["控水", "浇水前确认表层干透、盆变轻；浇透后倒掉托盘积水，不按固定日期天天浇。"],
        ["花期处理", "开花不是病害；要叶量时花后轻剪，要观赏或吸引授粉昆虫时可保留部分花。"],
        ["每周检查", "每周看叶背虫害、托盘积水、徒长新梢和枯叶；发现叶背细网或蜜露先隔离。"],
        ["冬季", "冬季少浇水、保光照、远离冷湿窗边；低温下长期湿土最危险。"],
        ["复查", "3 天看叶尖和土表，7 天看新梢是否更直立、香味是否更浓。"],
        ["不要做", "不要喷叶保湿、不要连续浇水、不要冷窗低温高湿、不要用大肥催嫩叶。"]
      ]
    }
  },
  strawberry: {
    seed: {
      label: "小苗/匍匐茎",
      summary: "草莓早期先保冠部干爽和根系稳定。未开花前不需要授粉，重点是光照、新叶和冠部位置。",
      currentAction: "今天确认冠部露在介质表面且没有积水；如果还没开花，只稳光照和水分，不做授粉。",
      pollination: "草莓只有花完全打开、能看到花心时才需要软刷授粉；花苞和未开花阶段不处理。",
      followup: "7 天后拍冠部特写和整株照，确认冠部干爽、新叶稳定、是否进入花期。",
      evidence: ["冠部不能埋湿", "开花后才授粉", "先看新叶质量"],
      reminders: [{
        key: "day7",
        task: "复查冠部、新叶和是否出现花苞",
        photo: "冠部特写和整株",
        success: "冠部不潮湿腐软，新叶稳定，未开花前没有误做授粉动作。",
        reason: "草莓早期先看冠部和根系稳定，7 天后再判断是否进入花期"
      }],
      stageActions: {
        seedling: {
          currentAction: "如果还是小苗，今天只确认冠部不被埋、不积水，并给足光照；不要为了快结果而催肥。",
          followup: "7 天后拍冠部和新叶，确认是否稳定抽新叶。",
          evidence: ["冠部露出", "小苗不催肥", "新叶稳定"]
        },
        flowering: {
          currentAction: "如果花已完全打开，今天中午用软刷轻刷花心 3-5 秒；同时保持冠部干爽，不要把水喷进花心和叶心。",
          followup: "3 天后拍同一朵花，确认花托是否开始膨大。",
          evidence: ["开放花授粉", "冠部保持干", "同一朵花复查"]
        },
        fruiting: {
          currentAction: "如果已有小果，今天先摘掉贴土烂叶并保持果实离开湿介质；不要让冠部和果实长期带水。",
          followup: "5-7 天后拍同一批果实，确认果形和膨大速度。",
          evidence: ["小果离湿土", "清理病叶", "不要湿果"]
        },
        wet: {
          currentAction: "如果冠部潮湿、发黑或有白毛，今天让冠部露出来并暂停往叶心浇水；加强通风。",
          followup: "48 小时后拍冠部同角度近照，确认白毛或软腐是否停止扩大。",
          evidence: ["冠部先干爽", "停止叶心浇水", "48 小时复查"]
        }
      },
      steps: [
        ["总原则", "草莓最怕冠部长期湿和授粉不足。先保冠部干爽，开花后才进入授粉管理。"],
        ["小苗期", "冠部露在介质表面，不要埋住；保持强光和稳定水分。"],
        ["移栽", "带土团移栽，冠部不要埋深；缓苗期不把水喷进叶心。"],
        ["授粉时机", "花完全打开后，用软刷轻刷花心 3-5 秒，连续几天观察同一花序。"],
        ["修剪", "剪掉病叶、老叶和消耗匍匐茎；想结果时不要让匍匐茎一直消耗能量。"],
        ["控水", "浇根区，不浇冠部；果实和冠部不要长期贴湿介质。"],
        ["复查", "授粉后 3 天拍同一朵花；冠部潮湿 48 小时复查；结果期 5-7 天看果形。"],
        ["不要做", "不要埋冠、不要叶心积水、不要花没开就授粉、不要保留太多匍匐茎。"]
      ]
    },
    transplant: {
      label: "移栽/换盆",
      summary: "草莓移栽后先防冠部潮湿和缓苗萎蔫，再进入授粉、果形和匍匐茎管理。",
      currentAction: "今天把冠部露出来并擦干周围积水，缓苗期只浇根区，不要把水喷进叶心。",
      pollination: "移栽恢复前不做授粉；如果已有开放花，等植株恢复挺立后再软刷花心。",
      followup: "48 小时后拍同角度冠部近照，确认冠部是否干爽、缓苗是否恢复。",
      evidence: ["冠部不能埋", "只浇根区", "恢复后再授粉"],
      reminders: [{
        key: "48h",
        task: "确认冠部是否保持干爽、缓苗萎蔫是否恢复",
        photo: "同角度冠部特写",
        success: "冠部不积水、不发黑，新叶和叶柄不继续塌软。",
        reason: "草莓移栽后冠部潮湿风险 48 小时内最需要复查"
      }],
      steps: [
        ["移栽时机", "根系能带住土团时移栽；冠部必须露出介质表面。"],
        ["当天动作", "带土团移，浇根区，擦干冠部附近积水；拍冠部基线。"],
        ["缓苗 48 小时", "明亮散射光、通风，避免叶心和花心长期带水。"],
        ["授粉", "恢复后如有开放花，再用软刷轻刷花心。"],
        ["修剪", "剪病叶和过多匍匐茎，保留健康新叶。"],
        ["复查", "48 小时看冠部，3-5 天看花后坐果。"],
        ["不要做", "不要把冠部埋深、不要喷湿叶心、不要缓苗期大肥。"]
      ]
    },
    store: {
      label: "成品不移植",
      summary: "买来的草莓如果已经开花，最重要的是人工授粉、冠部干爽和同一花序复查。",
      currentAction: "如果花已完全打开，今天中午用小刷子轻刷花心 3-5 秒；没开花就只保持冠部干爽和强光。",
      pollination: "开放花可以每天轻刷 1 次，连续 3 天；花后看花托是否膨大，而不是只看花瓣掉没掉。",
      followup: "3 天后拍同一朵花或刚坐果的小果，确认是否开始坐果、果形是否正常。",
      evidence: ["开放花授粉", "冠部干爽", "3 天看坐果"],
      reminders: [{
        key: "day3",
        task: "复查同一朵花是否开始坐果，果形是否正常",
        photo: "同一朵花或刚坐果的小果",
        success: "花心开始膨大，小果保留，下一批果形不明显畸形。",
        reason: "草莓软刷授粉后 3 天左右能看到早期坐果信号"
      }],
      steps: [
        ["第 0 天", "检查冠部、叶背、花心和小果；先不急着换盆。"],
        ["开花后", "完全开放花用软刷轻刷花心 3-5 秒，连续 3 天观察。"],
        ["控水", "浇根区，保持冠部和果实干爽；不要频繁叶面喷水。"],
        ["修剪", "剪病叶、烂叶和过多匍匐茎；想结果时优先保花果。"],
        ["复查", "3 天看同一花是否膨大，5-7 天看果形和畸形比例。"],
        ["不要做", "不要把开花当作已经坐果、不要冠部积水、不要保留太多匍匐茎抢营养。"]
      ]
    }
  },
  pepper: {
    seed: {
      label: "种子/小苗",
      summary: "矮生辣椒前期先建立紧凑株形、稳定根区和足够光照。未开花前不需要授粉，先避免只长叶不开花。",
      currentAction: "如果还没开花，今天把补光稳定到 14 小时左右，并暂停继续加高氮肥；不要为了催花频繁换环境。",
      pollination: "辣椒在开放花阶段才需要轻摇或软刷授粉；花苞期不需要人工碰花。",
      followup: "7 天后拍整株侧面和顶部新叶，比较株型是否紧凑、是否出现花苞。",
      evidence: ["先紧凑株型", "避免高氮", "开花后才授粉"],
      reminders: [{
        key: "day7",
        task: "复查株型紧凑度、顶部新叶和是否出现花苞",
        photo: "整株侧面和顶部新叶",
        success: "节间稳定，没有继续只长叶；若出现花苞，再进入授粉/控温复查。",
        reason: "辣椒补光和控氮调整需要 7 天观察株型方向"
      }],
      stageActions: {
        seedling: {
          currentAction: "小苗阶段今天先补强光、稳温度，等表层微干再浇；不要低温湿土催苗。",
          followup: "7 天后拍整株侧面，确认节间是否稳定。",
          evidence: ["小苗怕冷湿", "先补光", "不高氮催长"]
        },
        flowering: {
          currentAction: "如果有开放花，今天中午轻摇植株或软刷花心 5 秒，并确认灯下温度不过热。",
          followup: "3-5 天后拍同一花/幼果节点，确认落花是否减少。",
          evidence: ["开放花授粉", "控温防落花", "3-5 天复查"]
        },
        fruiting: {
          currentAction: "如果已有小果，今天先稳水分、支撑枝条，不要突然加浓肥或让盆土忽干忽湿。",
          followup: "5-7 天后拍同一幼果和顶部新叶，确认小果是否保留。",
          evidence: ["结果期稳水", "支撑枝条", "不大改肥"]
        }
      },
      steps: [
        ["总原则", "矮生辣椒需要强光、温暖和稳定水分。先养紧凑株型，再在开花期做授粉和控温。"],
        ["小苗期", "补光 12-14 小时，避免低温湿土；每盆保留健康强苗。"],
        ["移栽", "根系稳定后换到排水盆，缓苗 2-3 天内不重肥。"],
        ["修剪/支撑", "小型辣椒通常不重剪；只去掉病弱叶，结果后轻支撑枝条。"],
        ["授粉时机", "花完全打开后，中午轻摇植株或用软刷碰花心 5 秒。"],
        ["控水控温", "表层微干再浇透，避免忽干忽湿；灯下过热和夜间偏冷都会增加落花。"],
        ["复查", "花期 3-5 天看落花和幼果；结果期 5-7 天看小果保留。"],
        ["不要做", "不要高氮催叶、不要花苞期硬碰、不要忽冷忽热、不要结果期突然浓肥。"]
      ]
    },
    transplant: {
      label: "移栽/换盆",
      summary: "辣椒移栽后先稳根区和温度；缓苗恢复前不要急着催花、催果或重肥。",
      currentAction: "今天保持根区微湿但不积水，避开灯下过热；只拍整株基线，不要重肥或强行授粉。",
      pollination: "移栽恢复后如有开放花，再轻摇或软刷授粉；缓苗萎蔫时先恢复根系。",
      followup: "3 天后拍整株侧面和新梢，确认缓苗是否恢复、顶部新叶是否继续生长。",
      evidence: ["先稳根区", "避开过热", "恢复后再授粉"],
      reminders: [{
        key: "day3",
        task: "确认缓苗是否恢复、顶部新叶是否继续生长",
        photo: "整株侧面和新梢",
        success: "新梢恢复挺立，叶片不继续下垂，灯下温度没有造成萎蔫。",
        reason: "辣椒移栽后第 3 天适合判断是否恢复正常光照和营养"
      }],
      steps: [
        ["移栽时机", "根系能带土团后再移栽；不要小苗根弱时频繁换盆。"],
        ["当天动作", "带土团移，浇透一次，让多余水排走；拍整株基线。"],
        ["缓苗 3 天", "明亮散射光，根区微湿但不湿闷；不要重肥、暴晒或催花。"],
        ["授粉", "恢复后有开放花，再中午轻摇或软刷。"],
        ["复查", "3 天看缓苗，3-5 天看花后是否落花。"],
        ["不要做", "不要缓苗期浓肥、不要忽干忽湿、不要根没恢复就高温强灯。"]
      ]
    },
    store: {
      label: "成品不移植",
      summary: "买来的小型辣椒若已带花苞，重点是控温、稳水和辅助授粉，而不是盲目加肥。",
      currentAction: "如果已有开放花，今天中午轻摇植株或软刷花心 5 秒，并确认灯下温度不过热；落花时先稳温水，不急着加肥。",
      pollination: "开放花每天轻摇或软刷 1 次即可；重点复查同一花节点是否保留幼果。",
      followup: "3-5 天后拍同一花/幼果节点，确认落花是否减少、小果是否保留。",
      evidence: ["开放花授粉", "控温", "看落花和幼果"],
      reminders: [{
        key: "day3",
        task: "记录开放花、落花和小果保留情况",
        photo: "同一花/幼果节点特写",
        success: "落花减少，小果保留，灯下高温或忽干忽湿没有继续触发落花。",
        reason: "辣椒辅助授粉和稳温水后 3-5 天能看出落花方向"
      }],
      steps: [
        ["第 0 天", "检查株高、花苞、开放花、叶背和土表；先不急换盆。"],
        ["开花后", "中午轻摇植株或软刷花心 5 秒；同一花节点做复查。"],
        ["控温", "灯太近会烤花，夜间偏冷也会落花；先稳环境再考虑肥。"],
        ["控水", "表层微干后浇透，避免忽干忽湿。"],
        ["修剪", "小型辣椒不重剪，只摘病弱叶和过密下部叶，结果枝轻支撑。"],
        ["复查", "3-5 天看落花和幼果，5-7 天看小果是否继续膨大。"],
        ["不要做", "不要把落花都归因于缺肥、不要花苞未开就授粉、不要灯太近、不要突然浓肥。"]
      ]
    }
  }
};

Object.assign(cropCareGuidancePlans, detailedCropCareGuidancePlans);

const englishCropCareGuidancePlans = {
  basil: englishBasilGuidancePlans,
  tomato: {
    seed: {
      label: "Seedling",
      summary: "For dwarf tomatoes, start with compact growth, one strong plant per pot, steady moisture, and a flower-cluster baseline before fruiting.",
      currentAction: "Today, move the seedling into stronger light and keep only one strong plant per pot. Do not hand-pollinate or push high-nitrogen feed before flowers open.",
      pollination: "Tomato only needs help after flowers are fully open. Before that, prioritize light, root stability, and compact growth.",
      followup: "Come back in 7 days. Take a whole-plant side photo; once flowers appear, switch to a flower-cluster follow-up.",
      evidence: ["Compact growth first", "One plant per pot", "Pollinate open flowers only"],
      reminders: [{ key: "day7", task: "Review internodes, new leaves, and first flower-cluster signs.", photo: "Whole-plant side view and top leaves", success: "Internodes are not stretching and new leaves look sturdy.", reason: "Light and spacing changes usually show within 7 days." }],
      stageActions: {
        flowering: { currentAction: "If flowers are fully open, tap the flower cluster for 5 seconds at midday or use low fan airflow for 10 minutes.", followup: "Come back in 3-5 days. Photograph the same flower cluster for fruit-set signs.", evidence: ["Open flowers only", "Midday is steadier", "Review fruit set in 3-5 days"] },
        fruiting: { currentAction: "If fruit has set, keep moisture and lamp heat stable today. Do not make large fertilizer or watering changes.", followup: "Come back in 5-7 days. Photograph the same fruit cluster.", evidence: ["Avoid water swings", "Keep strong fruit clusters", "Do not over-change inputs"] }
      },
      steps: [["Principle", "Strong light, one plant per pot, stable moisture. Build compact growth before pollination."], ["Seedling", "Thin to one strong plant and give 12-16 hours of strong light."], ["Transplant", "Move with the root ball into a draining pot after 2-4 true leaves."], ["Pruning", "Do not hard-top dwarf tomato; remove only low old or diseased leaves."], ["Pollination", "Tap or brush fully open flowers at midday."], ["Water", "Water through after the surface starts drying; avoid water swings during fruiting."], ["Follow-up", "7 days for plant shape; 3-5 days for flower clusters."], ["Do not", "Do not crowd plants, overfeed nitrogen, touch unopened buds, or keep changing water and fertilizer."]]
    },
    transplant: {
      label: "Transplant",
      summary: "After transplanting tomato, stabilize roots first, then return to light, support, and pollination.",
      currentAction: "Today, keep recovery simple: water through once, use bright indirect light, and avoid heavy feeding, hard pruning, or pollination.",
      pollination: "Wait until new growth stands up and flowers are fully open before tapping or brushing flowers.",
      followup: "Come back in 3 days. Take the same whole-plant angle and a stem-base close-up.",
      evidence: ["Recover first", "No heavy feed", "Pollinate after recovery"],
      reminders: [{ key: "day3", task: "Confirm recovery and stem-base health.", photo: "Whole plant and stem base", success: "New leaves stand up and the stem base stays healthy.", reason: "Tomato transplant stress usually declares itself within 3 days." }],
      steps: [["Timing", "Transplant with 2-4 true leaves and a root ball."], ["Day 0", "Move with soil, water through once, and record a baseline photo."], ["Recovery", "No heavy feed, hard pruning, or harsh sun for about 3 days."], ["Support", "Add light support after recovery."], ["Pollination", "Only pollinate open flowers."], ["Do not", "Do not bury the stem too deep or change all conditions at once."]]
    },
    store: {
      label: "Store plant",
      summary: "For a store-bought dwarf tomato, confirm the variety and flower status first. If it is flowering, focus on pollination and stable conditions.",
      currentAction: "Today, check the label, height, flowers, and lamp heat. If flowers are open, tap the flower cluster for 5 seconds at midday and record a baseline photo.",
      pollination: "Tap or brush open flowers once a day for 3-5 days. Do not force unopened buds.",
      followup: "Come back in 3-5 days. Photograph the same flower cluster or young fruit.",
      evidence: ["Confirm compact variety", "Pollinate open flowers", "Same-cluster review"],
      reminders: [{ key: "day3", task: "Review flower drop and young-fruit retention.", photo: "Same flower cluster or young fruit", success: "Flower drop slows and the flower base or young fruit begins to hold.", reason: "Fruit-set signals usually show in 3-5 days." }],
      steps: [["Day 0", "Confirm dwarf variety and record whole-plant plus flower-cluster photos."], ["Flowers", "Tap fully open flowers at midday."], ["Pruning", "Remove only low old or diseased leaves."], ["Water", "Avoid water swings during flowering."], ["Do not", "Do not repot, hard prune, overfeed nitrogen, or bake flowers under a close lamp."]]
    }
  },
  rosemary: {
    seed: {
      label: "Young plant",
      summary: "Rosemary can be started from seed, but for home growers a small plant or cutting is more reliable. The core is strong light, airflow, fast drainage, and a slightly dry root zone.",
      currentAction: "Today, confirm the route. If it is a young plant or cutting, place it in the brightest airy spot and water only after the pot feels lighter and the surface has dried.",
      pollination: "Rosemary grown as an herb does not need hand pollination. Focus on roots, new tips, and aroma before flowers.",
      followup: "Come back in 7 days. Take a whole-plant side photo, pot-rim photo, and soil-surface photo.",
      evidence: ["Young plants beat seeds", "Strong light and airflow", "Water by pot weight"],
      reminders: [{ key: "day7", task: "Review new tips, brown tips or die-back, and the dry-down cycle.", photo: "Whole plant, pot rim, and soil surface", success: "Tips stop browning or blackening, new growth is steady, and the surface can dry between waterings.", reason: "Rosemary usually needs about a week to show response to light, airflow, and watering rhythm." }],
      stageActions: {
        seedling: { currentAction: "At seedling or newly rooted cutting stage, keep the medium evenly moist but not saturated, remove long-term covers after emergence, use 14-16 hours of light, and check the stem base daily.", followup: "Come back in 7 days with whole-plant, stem-base, and soil-surface photos.", evidence: ["Vent after emergence", "14-16 hours of light", "Check for damping-off"] },
        vegetative: { currentAction: "In active growth, rotate the pot for even light, lightly pinch leafy green tips, check undersides and inner stems, and remove dead debris.", followup: "Come back in 7 days with whole-plant and new-tip photos.", evidence: ["Even light", "Trim green tips only", "Weekly underside check"] },
        wet: { currentAction: "If the plant wilts while the soil is wet, stop watering today and check drainage, stem base, and smell. If roots are black, soft, or smelly, take healthy cuttings as backup.", followup: "Come back in 48 hours. Photograph the soil surface, stem base, and shoot tips.", evidence: ["Wet wilt suggests roots", "Back up with cuttings", "Wilt does not always mean thirst"] },
        dry: { currentAction: "If tips are brown and inner stems are drying while the pot is very light, water through once along the pot edge and let excess drain. Do not switch to daily watering.", followup: "Come back in 24-48 hours. Photograph the same shoots and pot rim.", evidence: ["Brown tips", "Light pot", "Water through, not daily"] },
        aroma: { currentAction: "If aroma is weak, increase direct or strong supplemental light today and reduce overwatering or heavy fertilizer. Do not force watery soft growth.", followup: "Come back in 7 days. Note aroma from new tips and photograph plant shape.", evidence: ["Light builds oils", "Slightly dry is aromatic", "Too much nitrogen weakens flavor"] },
        pest: { currentAction: "If you see yellow speckling, gray leaves, fine webbing, or sticky tips, isolate the pot and photograph inner stems and undersides. Do not mist leaves as the first response.", followup: "Come back in 24-48 hours with the same inner-stem close-up.", evidence: ["Webbing points to mites", "Sticky tips point to sap feeders", "Isolate first"] },
        flowering: { currentAction: "If rosemary is flowering, do not treat that as disease. Keep some flowers for display or pollinators, or lightly trim leafy green tips after bloom if leaf yield is the goal.", followup: "Come back in 7 days with the same flowering shoot and a whole-plant side photo.", evidence: ["Flowering is normal", "Light prune after bloom", "Avoid bare old wood"] },
        humid: { currentAction: "In humid or rainy weather, move the pot to the sunniest rain-sheltered airy spot, empty saucers, clear inner dead twigs, and water only after the top 3 cm dries.", followup: "Come back in 3-5 days with soil-surface, pot-bottom, and inner-stem photos.", evidence: ["Rain shelter", "Airflow and drainage", "Top 3 cm dry"] },
        leggy: { currentAction: "If shoots are stretching, leaves are sparse, or the base is bare, increase light and lightly trim leafy green shoots. Do not cut into bare old wood.", followup: "Come back in 7 days with a side photo to compare internodes.", evidence: ["Light first", "Green shoots only", "Old wood may not resprout"] },
        cold: { currentAction: "In winter or near a cold window, move the pot away from cold glass and drafts today. Keep light strong and water less; cold plus wet soil is the risk.", followup: "Come back in 7 days with whole-plant and soil-surface photos.", evidence: ["Cold plus wet is risky", "Move from cold glass", "Water less in winter"] }
      },
      steps: [["Principle", "Rosemary wants strong light, airflow, fast drainage, and watering by soil condition. Drought-tolerant does not mean repeatedly wilting the plant."], ["Route", "Seeds are slow and uneven; cuttings or small plants are faster and more stable for most home growers."], ["Seed", "Sow shallowly in clean light mix, keep the surface lightly moist, sow extra seeds, record dates, and do not discard the tray after only one or two weeks."], ["Cuttings", "Use a clean 10-15 cm non-flowering healthy tip, remove lower leaves, root in an airy medium, keep humidity stable but ventilate daily."], ["Rooting", "Resistance to a gentle tug, healthy pale roots, no black base or odor, and stable new growth mean it can start hardening off. New tips alone are not enough."], ["Pot and mix", "Move mature plants toward 25-30 cm+ draining pots. Start around three parts stable potting mix to one part perlite, coarse sand, pumice, or grit; adjust for drying speed."], ["Water", "Check before watering. Use the top 3 cm dryness and pot weight, water through, then empty saucers."], ["Fertilizer", "Do not rush fertilizer in fresh mix or seedlings. After steady new roots and shoots, start low-dose or half-strength, low-frequency feeding. Never feed wet smelly roots."], ["Prune/harvest", "Cut leafy green shoots with nodes and keep each harvest conservative, about 20% growth or less. Never cut hard into bare old wood."], ["Flowering", "Flowering is normal. Keep some flowers for display or pollinators, or lightly trim after bloom when leaf production is the goal."], ["Pests/disease", "Normal undersides can be gray-white; powdery mildew is irregular expanding powder. Speckling/webbing suggests mites; sticky tips suggest aphids or whiteflies; silvery scratches and black dots suggest thrips."], ["Weekly/monthly", "Weekly: pot weight, undersides, saucers, stretching, dead debris. Monthly: drainage speed, crusted mix, buried stem base, pot-bound roots, fertilizer date."], ["Humid/rainy", "Use sun, spacing, airflow, rain shelter, and fast drainage. Do not mist daily or let cover pots and saucers hold water."], ["Winter", "Before moving indoors, check pests and remove dead material. Indoors, use the brightest cool spot, water less, feed little, ventilate, and check mites weekly."], ["Follow-up", "48 hours for wet-root risk; 24-48 hours for pests; 7 days for light, pruning, aroma, or winter changes."], ["Do not", "Do not mist leaves, overfeed, keep it in a dark or damp corner, put it in harsh sun right after transplanting, or hard-prune old bare wood."]]
    },
    transplant: {
      label: "Transplant",
      summary: "Rosemary transplant care is about root oxygen and stem-base health: harden off first, keep the root ball, avoid oversized wet pots, and do not bury the stem base.",
      currentAction: "Today, move the root ball into an airy fast-draining mix at roughly the original stem-base depth. Use bright indirect light and airflow; if the mix is wet, do not water.",
      pollination: "Ignore flowers during recovery; root recovery comes first.",
      followup: "Come back in 48-72 hours. Take soil-surface, pot-rim, and stem-base photos.",
      evidence: ["Do not bury the stem base", "Drainage holes must work", "Recover before pruning"],
      reminders: [{ key: "48h", task: "Check for wet mix and stem-base darkening after transplant.", photo: "Soil surface, pot rim, and stem base", success: "The stem base is not dark, tips are not worsening, and the surface starts drying.", reason: "Wet-root or crown stress usually declares itself within 48-72 hours after transplant." }],
      steps: [["Timing", "Transplant only when roots can hold a soil ball. If a store plant is stable, observe first instead of rushing."], ["Harden off", "When moving from a humidity box, indoor window, or nursery shelf to strong light, increase venting and direct light gradually."], ["Pot and mix", "Use clear drainage holes and an airy gritty mix. Do not put a tiny root ball straight into a very large wet pot."], ["Day 0", "Move with the root ball, keep the stem base shallow, water through once only if needed, and empty the saucer."], ["Recovery", "Bright indirect light, airflow, no heavy feed, no hard pruning, and no repeated watering for about 3 days."], ["Sun", "Do not put it into harsh afternoon sun immediately after transplanting; increase direct light after new tips stand up."], ["Pruning", "After recovery, trim leafy soft tips only. Bare old wood recovers poorly."], ["Do not", "Do not use a no-hole pot, heavy peat mix, a buried stem base, immediate harsh sun, or heavy fertilizer."]]
    },
    store: {
      label: "Store plant",
      summary: "For store-bought rosemary, inspect original pot moisture, stem base, brown tips, underside pests, and pot-bound roots before repotting or shaping.",
      currentAction: "Today, check whether the soil stays shiny-wet, the stem base is dark, undersides have pests/honeydew/webbing, or tips are browning. Put it in strong light and airflow; do not repot yet.",
      pollination: "No pollination is needed. Focus on shoot health, aroma, and root dry-down.",
      followup: "Come back in 3 days. Take the same whole-plant angle plus stem-base and soil-surface photos.",
      evidence: ["Check wet soil and stem base", "Strong-light acclimation", "Avoid overwatering and heavy feed"],
      reminders: [{ key: "day3", task: "Review dry-down, brown or black tips, and acclimation.", photo: "Same whole-plant angle, stem base, and soil surface", success: "Tips stop worsening, the pot starts drying normally, and the plant is not continuing to wilt.", reason: "Three days is enough to see whether water control, light, and airflow are stabilizing the plant." }],
      steps: [["Day 0", "Isolate and inspect tips, inner stems, undersides, stem base, and soil surface. Do not rush into a larger pot if the plant is stable."], ["Days 1-3", "Increase light and airflow gradually. If the surface is wet or shiny, do not add water or leave it sitting in a cover pot."], ["Yellow leaves", "Wet soil plus older yellowing points first to root oxygen issues. Dry soil, a very light pot, and gray-yellow leaves suggest dryness or very dry air."], ["Pruning/harvest", "Trim leafy soft tips or dead tips only. Harvest young stems with nodes, not single leaves, and do not cut the plant bare."], ["Water", "Water after the top layer is dry and the pot feels lighter; empty saucers after watering."], ["Flowering", "Flowering is normal. Keep some flowers for display or pollinators, or lightly trim after bloom when leaf yield is the goal."], ["Weekly check", "Check undersides for pests, saucers for water, stretching shoots, and dead debris. Isolate if you see webbing or honeydew."], ["Winter", "Water less, keep light high, and move away from cold wet windows."], ["Follow-up", "Use 3 days for tips and soil surface; use 7 days for new tips and aroma."], ["Do not", "Do not mist leaves, water repeatedly, keep it cold and wet, or use heavy fertilizer to force tender growth."]]
    }
  },
  strawberry: {
    seed: {
      label: "Runner/seedling",
      summary: "Strawberry care starts with a dry exposed crown and stable roots. Pollination begins only after flowers open.",
      currentAction: "Today, make sure the crown sits above the medium and is not wet. If there are no open flowers, focus only on light and moisture stability.",
      pollination: "Brush only fully open flowers. Buds and closed flowers do not need pollination.",
      followup: "Come back in 7 days. Take one crown close-up and one whole-plant photo.",
      evidence: ["Keep crown dry", "Pollinate open flowers only", "Watch new leaves"],
      reminders: [{ key: "day7", task: "Review crown dryness, new leaves, and flower signs.", photo: "Crown close-up and whole plant", success: "The crown is dry and firm, with stable new growth.", reason: "Early strawberry care is mostly crown and root stability." }],
      stageActions: { flowering: { currentAction: "If a flower is fully open, brush the center for 3-5 seconds at midday and keep water out of the crown.", followup: "Come back in 3 days. Photograph the same flower.", evidence: ["Open flower", "Dry crown", "Same-flower review"] }, wet: { currentAction: "If the crown is wet, dark, or fuzzy, expose and dry it today and stop watering into the crown.", followup: "Come back in 48 hours. Photograph the crown from the same angle.", evidence: ["Dry crown first", "Stop crown watering", "48-hour check"] } },
      steps: [["Principle", "Dry crown first, pollination after open flowers."], ["Early plant", "Keep the crown above the medium and give strong light."], ["Transplant", "Move with soil and never bury the crown."], ["Pollination", "Brush fully open flowers for 3-5 seconds."], ["Pruning", "Remove diseased leaves and excess runners if fruiting is the goal."], ["Water", "Water roots, not the crown."], ["Follow-up", "3 days after pollination; 48 hours for wet crown."], ["Do not", "Do not bury the crown, keep the leaf center wet, pollinate buds, or keep too many runners."]]
    },
    transplant: {
      label: "Transplant",
      summary: "After transplanting strawberry, prevent crown wetness first; pollination comes after recovery.",
      currentAction: "Today, expose the crown and dry any standing moisture. Water the root zone only, not the leaf center.",
      pollination: "Wait until the plant stands back up before brushing open flowers.",
      followup: "Come back in 48 hours. Take a same-angle crown close-up.",
      evidence: ["Crown above medium", "Water roots only", "Pollinate after recovery"],
      reminders: [{ key: "48h", task: "Confirm crown dryness and transplant recovery.", photo: "Same-angle crown close-up", success: "The crown is not wet or black and new leaves are not collapsing.", reason: "Wet-crown risk is most important in the first 48 hours." }],
      steps: [["Timing", "Move with a root ball and keep the crown exposed."], ["Day 0", "Water the root zone and dry the crown area."], ["Recovery", "Bright indirect light and airflow."], ["Pollination", "Brush open flowers after recovery."], ["Do not", "Do not bury or soak the crown."]]
    },
    store: {
      label: "Store plant",
      summary: "For store-bought strawberry, open flowers mean pollination; wet crowns mean drying first.",
      currentAction: "If flowers are fully open, brush the flower center for 3-5 seconds at midday. If not, keep the crown dry and give strong light.",
      pollination: "Brush open flowers once daily for 3 days and review whether the flower base swells.",
      followup: "Come back in 3 days. Photograph the same flower or young fruit.",
      evidence: ["Open-flower pollination", "Dry crown", "3-day fruit-set check"],
      reminders: [{ key: "day3", task: "Review whether the same flower is setting fruit.", photo: "Same flower or young fruit", success: "The flower center swells and young fruit holds.", reason: "Early strawberry fruit-set signals show in about 3 days." }],
      steps: [["Day 0", "Inspect crown, leaf underside, flowers, and young fruit."], ["Flowers", "Brush fully open flowers for 3-5 seconds."], ["Water", "Keep crown and fruit dry."], ["Pruning", "Remove diseased leaves and excess runners."], ["Do not", "Do not assume flowering equals fruit set or let the crown stay wet."]]
    }
  },
  pepper: {
    seed: {
      label: "Seedling",
      summary: "Compact pepper starts with warm roots, strong light, and moderate nutrition. Pollination starts only after flowers open.",
      currentAction: "If it is not flowering yet, stabilize grow light around 14 hours and pause high-nitrogen feeding. Do not keep changing conditions to force flowers.",
      pollination: "Shake or brush only open flowers. Buds do not need handling.",
      followup: "Come back in 7 days. Take a whole-plant side photo and top-new-growth photo.",
      evidence: ["Compact growth first", "Avoid excess nitrogen", "Pollinate open flowers"],
      reminders: [{ key: "day7", task: "Review compactness, top growth, and flower-bud signs.", photo: "Whole-plant side view and top growth", success: "Internodes stay stable and the plant is not only making leaves.", reason: "Pepper light and nitrogen changes need about a week to show direction." }],
      stageActions: { flowering: { currentAction: "If flowers are open, gently shake the plant or brush the flower center for 5 seconds at midday. Check that lamp heat is not excessive.", followup: "Come back in 3-5 days. Photograph the same flower or young-fruit node.", evidence: ["Open flowers", "Control heat", "Review flower drop"] }, fruiting: { currentAction: "If young fruit is present, keep moisture steady and support branches. Do not suddenly increase fertilizer strength.", followup: "Come back in 5-7 days. Photograph the same young fruit and top leaves.", evidence: ["Stable moisture", "Support fruiting branches", "No sudden strong feed"] } },
      steps: [["Principle", "Strong light, warmth, and steady water first; pollinate after open flowers."], ["Seedling", "Use 12-14 hours of light and avoid cold wet soil."], ["Transplant", "Move after roots stabilize; no heavy feed during recovery."], ["Pruning", "Compact pepper usually does not need hard pruning."], ["Pollination", "Shake or brush open flowers at midday."], ["Water/temperature", "Avoid water swings and lamp heat."], ["Follow-up", "3-5 days for flowers, 5-7 days for young fruit."], ["Do not", "Do not overfeed nitrogen, touch unopened buds, swing temperatures, or suddenly use strong fertilizer."]]
    },
    transplant: {
      label: "Transplant",
      summary: "After transplanting pepper, stabilize roots and temperature before pushing flowers or fruit.",
      currentAction: "Today, keep the root zone lightly moist but not wet, avoid lamp heat, and skip heavy fertilizer or pollination.",
      pollination: "Pollinate only after recovery and open flowers.",
      followup: "Come back in 3 days. Take one side photo and one new-tip photo.",
      evidence: ["Root stability", "Avoid heat", "Pollinate after recovery"],
      reminders: [{ key: "day3", task: "Confirm recovery and new growth.", photo: "Whole-plant side view and new tip", success: "New tips stand up and leaves do not keep drooping.", reason: "Pepper transplant recovery is usually readable after 3 days." }],
      steps: [["Timing", "Transplant with a root ball."], ["Day 0", "Water through and record a baseline."], ["Recovery", "No heavy feed, harsh lamp heat, or pollination."], ["Follow-up", "3 days for recovery; 3-5 days after flowering."], ["Do not", "Do not keep the root zone swinging wet-dry."]]
    },
    store: {
      label: "Store plant",
      summary: "For a store-bought compact pepper with buds or flowers, stabilize heat and water, then help open flowers pollinate.",
      currentAction: "If flowers are open, gently shake the plant or brush the center for 5 seconds at midday and check lamp heat. If flowers are dropping, stabilize water and temperature before adding fertilizer.",
      pollination: "Shake or brush open flowers once daily; review the same node for young-fruit retention.",
      followup: "Come back in 3-5 days. Photograph the same flower or young-fruit node.",
      evidence: ["Pollinate open flowers", "Control heat", "Track drop and fruit set"],
      reminders: [{ key: "day3", task: "Record open flowers, dropped flowers, and young-fruit retention.", photo: "Same flower or young-fruit node", success: "Flower drop slows and young fruit holds.", reason: "Pepper pollination and stable conditions show direction in 3-5 days." }],
      steps: [["Day 0", "Inspect height, buds, open flowers, leaf undersides, and soil surface."], ["Flowers", "Shake or brush open flowers at midday."], ["Temperature", "Avoid lamp heat and cold nights."], ["Water", "Water after the surface slightly dries."], ["Pruning", "Do not hard prune; remove only weak or diseased leaves."], ["Do not", "Do not blame every flower drop on fertilizer deficiency, touch unopened buds, or suddenly increase fertilizer."]]
    }
  }
};

let basilGuideMode = (() => {
  try {
    const saved = localStorage.getItem(basilGuideStorageKey);
    return basilGuidancePlans[saved] ? saved : "seed";
  } catch {
    return "seed";
  }
})();

const customerEntryModeStorageKey = "fivecropCustomerEntryMode";
const customerCareRecordStorageKey = "fivecropCustomerCareRecord";
let customerEntryMode = (() => {
  try {
    const saved = localStorage.getItem(customerEntryModeStorageKey);
    return saved === "care" ? "care" : "photo";
  } catch {
    return "photo";
  }
})();

function numberFrom(data, key) {
  const value = String(data.get(key) || "").trim();
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function getFormState() {
  const data = new FormData(form);
  return {
    growDevice: data.get("growDevice"),
    crop: data.get("crop"),
    stage: data.get("stage"),
    medium: data.get("medium"),
    light: data.get("light"),
    moisture: data.get("moisture"),
    climate: data.get("climate"),
    symptoms: data.getAll("symptoms"),
    notes: String(data.get("notes") || "").trim(),
    sensorMoisture: numberFrom(data, "sensorMoisture"),
    lightHours: numberFrom(data, "lightHours"),
    temperature: numberFrom(data, "temperature"),
    humidity: numberFrom(data, "humidity"),
    ec: numberFrom(data, "ec"),
    ph: numberFrom(data, "ph"),
    xpongeThickness: numberFrom(data, "xpongeThickness"),
    xpongeLength: numberFrom(data, "xpongeLength"),
    xpongeWidth: numberFrom(data, "xpongeWidth"),
    reservoir: numberFrom(data, "reservoir"),
    hasPhoto: Boolean(plantPhoto.files && plantPhoto.files.length),
    photoType: data.get("photoType"),
    visuals: data.getAll("visuals")
  };
}

function has(state, symptom) {
  return state.symptoms.includes(symptom);
}

function sees(state, clue) {
  return state.visuals.includes(clue);
}

function addFinding(findings, title, score, severity, why, action) {
  findings.push({ title, score, severity, why, action });
}

function isFruitingCrop(state) {
  return ["tomato", "strawberry", "pepper"].includes(state.crop);
}

function activeDiagnosisPhotoType(state = getFormState()) {
  if (latestPhotoTypeDetection?.type) return latestPhotoTypeDetection.type;
  if (state.hasPhoto || capturedPhotoTypes.size > 0) {
    return state.photoType === "none" ? null : state.photoType;
  }
  return null;
}

function diagnosisRoute(state = getFormState()) {
  const type = activeDiagnosisPhotoType(state);
  const routes = {
    leaf: {
      key: "leaf",
      title: "叶片路径",
      focus: "优先判断黄叶、卷叶、斑点、干边和缺素/水分压力。",
      keywords: ["光照", "水分波动", "pH", "EC", "温度", "营养"],
      pathwayKeywords: ["low-light", "deformed"],
      boost: 16
    },
    flower: {
      key: "flower",
      title: "花果路径",
      focus: "优先判断授粉、坐果、落花、温度和结果期营养。",
      keywords: ["授粉", "结果", "温度", "营养", "光照"],
      pathwayKeywords: ["flower", "fruit", "ripen", "pepper"],
      boost: 22
    },
    root: {
      key: "root",
      title: "根区路径",
      focus: "优先判断过湿、藻霉、缺氧、根区缓冲和 Xponge 边界。",
      keywords: ["根区", "藻", "Xponge", "pH", "水分波动"],
      pathwayKeywords: ["root", "wet", "crown", "xponge"],
      boost: 22
    },
    pest: {
      key: "pest",
      title: "虫害路径",
      focus: "优先判断叶背虫点、小飞虫、蛛丝和隔离复查。",
      keywords: ["虫", "红蜘蛛"],
      pathwayKeywords: ["deformed"],
      boost: 28
    },
    plant: {
      key: "plant",
      title: "整株路径",
      focus: "优先判断株型、徒长、设备适配、光照和整体长势。",
      keywords: ["光照", "设备", "Xponge", "温度"],
      pathwayKeywords: ["low-light", "compact", "xponge"],
      boost: 12
    }
  };
  return routes[type] || null;
}

function routeMatchesText(route, text) {
  return Boolean(route?.keywords?.some((keyword) => String(text || "").includes(keyword)));
}

function routeBoostsPathway(route, pathway) {
  if (!route || !pathway) return false;
  return pathway.requiredPhotos?.includes(route.key) ||
    route.pathwayKeywords.some((keyword) => pathway.id.includes(keyword));
}

function applyDiagnosisRouteBoost(state, findings) {
  const route = diagnosisRoute(state);
  if (!route) return null;
  findings.forEach((finding) => {
    if (routeMatchesText(route, `${finding.title} ${finding.why} ${finding.action}`)) {
      finding.score += route.boost;
      finding.route = route.key;
    }
  });
  return route;
}

function xpongeAreaLiters(state) {
  if (state.medium !== "xponge") return null;
  const thickness = state.xpongeThickness || 1.5;
  const length = state.xpongeLength || 30;
  const width = state.xpongeWidth || 40;
  const area = length * width;
  const volumeLiters = area * thickness / 1000;
  return { area, volumeLiters, thickness, length, width };
}

function currentDevice(state = getFormState()) {
  return deviceTemplates[state.growDevice] || deviceTemplates.generic;
}

function deviceFitLabel(fit) {
  if (fit === "fit") return "适配";
  if (fit === "avoid") return "不建议";
  return "谨慎";
}

function deviceFitTag(fit) {
  if (fit === "fit") return "推荐";
  if (fit === "avoid") return "不建议";
  return "少量试";
}

function deviceCropFitReason(deviceKey, cropKey, fit) {
  const crop = cropNames[cropKey];
  if (fit === "fit") {
    const fitReasons = {
      tomato: `${crop}适合作为矮生结果作物测试，但仍要限制株数并做授粉复查。`,
      basil: `${crop}生长快、反馈快，适合验证灯光、修剪和连续采收。`,
      rosemary: `${crop}适合通风强、根区偏干的场景，能减少过湿风险。`,
      strawberry: `${crop}适合做花果复查，重点看授粉、冠部和果形。`,
      pepper: `${crop}适合空间和光照较充足的场景，重点看落花和坐果。`
    };
    return fitReasons[cropKey] || `${crop}与当前设备较适配。`;
  }

  if (fit === "avoid") {
    if (cropKey === "rosemary" && ["letpot", "idoo", "aerogarden"].includes(deviceKey)) {
      return "迷迭香怕长期高湿根区，桌面水培机会放大闷根风险。";
    }
    if (deviceKey === "office" && ["tomato", "strawberry", "pepper"].includes(cropKey)) {
      return "办公室光照和周末维护不足，结果类作物容易只长叶、不坐果。";
    }
    return `${crop}不建议作为当前设备的首批作物，失败成本偏高。`;
  }

  if (deviceKey === "xponge-diy" && ["tomato", "strawberry", "pepper"].includes(cropKey)) {
    return "可以验证超薄根区，但要加储液缓冲、遮光防藻，并严格做花果复查。";
  }
  if (["letpot", "idoo", "aerogarden"].includes(deviceKey) && ["tomato", "strawberry", "pepper"].includes(cropKey)) {
    return "可以少株数测试，重点控制高度、根量、授粉和灯距。";
  }
  if (deviceKey === "clickgrow" && ["tomato", "pepper"].includes(cropKey)) {
    return "预制舱低操作，但果菜调参空间小，建议先少株数观察。";
  }
  return `${crop}可以试种，但建议先做一株样本并保留复查照片。`;
}

function recommendedCropsForDevice(device) {
  return cropOrder
    .map((cropKey) => ({
      cropKey,
      fit: device.cropFit[cropKey] || "caution"
    }))
    .sort((a, b) => {
      const score = { fit: 3, caution: 2, avoid: 1 };
      return score[b.fit] - score[a.fit];
    });
}

function deviceFitSeverity(fit) {
  if (fit === "avoid") return "high";
  if (fit === "caution") return "medium";
  return "low";
}

function deviceFitAction(state, device, fit) {
  if (fit === "fit") {
    return `当前设备适合${cropNames[state.crop]}，优先按照片和阶段处方处理，不要一次改太多参数。`;
  }
  if (fit === "avoid") {
    return `建议先把${cropNames[state.crop]}从「${device.name}」这个组合中移出，或改种更适配的作物；继续强行诊断会增加挫败感。`;
  }
  return `「${device.name}」可以试种${cropNames[state.crop]}，但建议减少株数、补拍根区/花果照片，并按复查结果决定是否继续。`;
}

function updateDeviceProfile() {
  const device = deviceTemplates[growDeviceSelect.value] || deviceTemplates.generic;
  const fit = device.cropFit[cropSelect.value] || "caution";
  deviceHint.textContent = `${device.name}：${cropNames[cropSelect.value]}为「${deviceFitLabel(fit)}」。${device.summary}`;
  deviceProfileTitle.textContent = device.name;
  deviceProfileSummary.textContent = `${device.summary} 重点观察：${device.risks.join("；")}。`;
  renderDeviceCropFit();
  renderDeviceCropPlan();
  renderBasilGuidance();
}

function renderDeviceCropFit() {
  const deviceKey = growDeviceSelect.value;
  const device = deviceTemplates[deviceKey] || deviceTemplates.generic;
  const entries = recommendedCropsForDevice(device);
  const recommended = entries.filter((item) => item.fit === "fit");
  const caution = entries.filter((item) => item.fit === "caution");
  const avoid = entries.filter((item) => item.fit === "avoid");

  deviceRecommendationTitle.textContent = recommended.length
    ? `优先：${recommended.map((item) => cropNames[item.cropKey]).join("、")}`
    : `谨慎：${caution.map((item) => cropNames[item.cropKey]).join("、") || "需要补充设备信息"}`;
  deviceRecommendationSummary.textContent = [
    recommended.length ? `推荐 ${recommended.length} 类` : "",
    caution.length ? `少量试 ${caution.length} 类` : "",
    avoid.length ? `不建议 ${avoid.length} 类` : ""
  ].filter(Boolean).join("；");

  deviceFitList.innerHTML = "";
  entries.forEach((item) => {
    const card = document.createElement("article");
    card.className = `device-fit-card ${item.fit}${item.cropKey === cropSelect.value ? " selected" : ""}`;

    const content = document.createElement("div");
    content.innerHTML = `
      <span>${deviceFitTag(item.fit)}</span>
      <strong>${cropNames[item.cropKey]}</strong>
      <p>${deviceCropFitReason(deviceKey, item.cropKey, item.fit)}</p>
    `;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "mini-button";
    button.textContent = item.cropKey === cropSelect.value ? "当前" : "选择";
    button.addEventListener("click", () => {
      cropSelect.value = item.cropKey;
      updateCropHint();
      updateDeviceProfile();
      runDiagnosis();
    });

    card.appendChild(content);
    card.appendChild(button);
    deviceFitList.appendChild(card);
  });
}

function firstPhotoForPlan(state, fit) {
  if (fit === "avoid") return "plant";
  if (smartConcern.value === "root" || state.medium === "xponge" || state.growDevice === "xponge-diy") return "root";
  if (["flowering", "fruiting"].includes(state.stage) || smartConcern.value === "fruit") return "flower";
  if (smartConcern.value === "yellow" || smartConcern.value === "dry") return "leaf";
  if (smartConcern.value === "pest") return "pest";
  return "plant";
}

function concernForDevicePlan(state) {
  if (isFruitingCrop(state)) return "fruit";
  if (state.crop === "basil") return "leggy";
  if (state.crop === "rosemary" || state.growDevice === "xponge-diy" || state.medium === "xponge") return "root";
  return "unknown";
}

function buildDeviceCropPlan(state = getFormState()) {
  const device = currentDevice(state);
  const fit = device.cropFit[state.crop] || "caution";
  const crop = cropNames[state.crop];
  const isXpongeDevice = state.growDevice === "xponge-diy" || state.medium === "xponge";
  const fruitCrop = isFruitingCrop(state);
  const firstPhoto = firstPhotoForPlan(state, fit);
  const photoTypes = new Set(["plant", firstPhoto]);
  const warnings = [];

  if (fruitCrop) photoTypes.add("flower");
  if (isXpongeDevice || fit === "caution") photoTypes.add("root");
  if (fit === "avoid") warnings.push(`${device.name} 不建议把 ${crop} 作为首批主推作物。`);
  if (fit === "caution") warnings.push(`${crop} 可以试种，但要先缩小株数并保留复查照片。`);
  if (device.risks?.length) warnings.push(device.risks[0]);

  let plantCount = "1 株样本";
  if (fit === "avoid") plantCount = "不建议首批种植";
  else if (state.crop === "basil" && fit === "fit") plantCount = "2-3 株";
  else if (["tomato", "pepper", "strawberry"].includes(state.crop) && fit === "fit") plantCount = "1-2 株";
  else if (state.crop === "rosemary") plantCount = "1 株";

  let firstAction = `先按 ${photoTypeLabel(firstPhoto)} 建立基线，再开始处方动作。`;
  if (fit === "avoid") {
    firstAction = `先换成更适配的作物，或更换设备后再种 ${crop}。`;
  } else if (isXpongeDevice && fruitCrop) {
    firstAction = "先确认遮光防藻和外置储液缓冲，再只保留 1 株结果类样本。";
  } else if (fruitCrop) {
    firstAction = "先少株数种植，记录灯距、花序和授粉动作，不要把孔位一次种满。";
  } else if (state.crop === "basil") {
    firstAction = "先建立整株基线，7-10 天后根据节间长度安排掐顶和连续采收。";
  } else if (state.crop === "rosemary") {
    firstAction = "先保证强光、通风和偏干根区，避免让基质长期处于湿亮状态。";
  }

  let followup = "7 天后整株复查";
  if (fit === "avoid") followup = "换作物或换设备后重新建档";
  else if (isXpongeDevice || state.crop === "rosemary") followup = "48 小时根区复查";
  else if (fruitCrop || ["flowering", "fruiting"].includes(state.stage)) followup = "3-5 天花序/坐果复查";
  else if (state.crop === "basil") followup = "7 天株形和采收复查";

  return {
    title: `${device.name} × ${crop}`,
    fit,
    fitLabel: deviceFitTag(fit),
    summary: deviceCropFitReason(state.growDevice, state.crop, fit),
    plantCount,
    firstPhoto,
    firstAction,
    followup,
    photoTypes: Array.from(photoTypes),
    concern: concernForDevicePlan(state),
    warnings
  };
}

function renderDeviceCropPlan() {
  const plan = buildDeviceCropPlan();
  if (!devicePlanTitle || !devicePlanGrid || !devicePlanList) return;

  devicePlanTitle.textContent = `首批方案：${cropNames[cropSelect.value]}`;
  devicePlanSummary.textContent = plan.summary;
  devicePlanGrid.innerHTML = "";

  [
    ["建议株数", plan.plantCount],
    ["第一张照片", photoTypeLabel(plan.firstPhoto)],
    ["第一步动作", plan.firstAction],
    ["复查时间", plan.followup]
  ].forEach(([label, value]) => {
    const item = document.createElement("div");
    item.className = "device-plan-item";
    item.innerHTML = `<span>${label}</span><strong>${value}</strong>`;
    devicePlanGrid.appendChild(item);
  });

  devicePlanList.innerHTML = "";
  plan.warnings.forEach((warning) => {
    const item = document.createElement("li");
    item.textContent = warning;
    devicePlanList.appendChild(item);
  });
}

function basilGuidanceStageHint(state) {
  if (activeLocale === "en") {
    if (state.stage === "seedling") return "The priority now is steady germination, thinning, and preventing legginess.";
    if (state.stage === "flowering") return "Once flowering appears, flower removal, pinching, and leaf recovery come first.";
    if (has(state, "weak-aroma")) return "Weak aroma cannot be confirmed from a photo alone; check light, nitrogen, and harvest rhythm.";
    return "In vegetative growth, focus on strong light, airflow, pinching, and continuous harvest.";
  }
  if (state.stage === "seedling") return "當前重點是穩出苗、定苗和防徒長。";
  if (state.stage === "flowering") return "已到開花信號時，把摘花、打頂和恢復葉量放在第一位。";
  if (has(state, "weak-aroma")) return "香味不濃不能靠照片直接判定，需要結合光照、氮肥和採收頻率判斷。";
  return "營養生長期重點是強光、通風、打頂和連續採收。";
}

function basilGuidanceStageOverrideKey(state, plan) {
  if (!plan?.stageActions) return null;
  if (state.stage === "flowering" || has(state, "bolting") || sees(state, "flower-buds")) {
    return "flowering";
  }
  if (has(state, "weak-aroma")) return "aroma";
  if (state.stage === "seedling") return "seedling";
  if (state.stage === "vegetative") return "vegetative";
  return null;
}

function basilGuidanceStageOverride(state, plan) {
  const key = basilGuidanceStageOverrideKey(state, plan);
  return key ? plan.stageActions?.[key] || null : null;
}

function resolveBasilGuidancePlan(state, plan) {
  const override = basilGuidanceStageOverride(state, plan);
  if (!override) return plan;
  return {
    ...plan,
    currentAction: override.currentAction || plan.currentAction,
    followup: override.followup || plan.followup,
    evidence: override.evidence || plan.evidence,
    reminders: override.reminders || plan.reminders
  };
}

function careGuidanceStageOverrideKey(cropKey, state, plan) {
  if (!plan?.stageActions) return null;
  if (cropKey === "basil") return basilGuidanceStageOverrideKey(state, plan);
  const pestSignal = has(state, "pests") ||
    sees(state, "webbing") ||
    sees(state, "tiny-flies") ||
    sees(state, "sticky-residue") ||
    smartConcern.value === "pest";
  const wetRootSignal = state.moisture === "wet" ||
    state.sensorMoisture !== null && state.sensorMoisture > 75 ||
    has(state, "algae") ||
    sees(state, "green-surface") ||
    sees(state, "white-fuzz");
  const drySignal = state.moisture === "dry" ||
    state.sensorMoisture !== null && state.sensorMoisture < 35 ||
    sees(state, "edge-dry") ||
    smartConcern.value === "dry";
  const aromaSignal = has(state, "weak-aroma") ||
    smartConcern.value === "aroma";
  const coldSignal = state.climate === "cold" ||
    state.temperature !== null && state.temperature < 16;
  const humidSignal = state.climate === "humid";
  const leggySignal = has(state, "leggy") ||
    sees(state, "long-internodes") ||
    smartConcern.value === "leggy";
  const floweringSignal = state.stage === "flowering" ||
    has(state, "no-fruit") ||
    sees(state, "flower-drop") ||
    sees(state, "flower-buds") ||
    smartConcern.value === "fruit";
  if (pestSignal && plan.stageActions.pest) return "pest";
  if ((cropKey === "rosemary" || cropKey === "strawberry") && wetRootSignal && plan.stageActions.wet) return "wet";
  if (cropKey === "rosemary" && coldSignal && plan.stageActions.cold) return "cold";
  if (drySignal && plan.stageActions.dry) return "dry";
  if (aromaSignal && plan.stageActions.aroma) return "aroma";
  if (leggySignal && plan.stageActions.leggy) return "leggy";
  if (floweringSignal && plan.stageActions.flowering) return "flowering";
  if (cropKey === "rosemary" && humidSignal && plan.stageActions.humid) return "humid";
  if (state.stage === "fruiting" && plan.stageActions.fruiting) return "fruiting";
  if (state.stage === "seedling" && plan.stageActions.seedling) return "seedling";
  if (state.stage === "vegetative" && plan.stageActions.vegetative) return "vegetative";
  return null;
}

function resolveCropCareGuidancePlan(cropKey, state, plan) {
  if (cropKey === "basil") return resolveBasilGuidancePlan(state, plan);
  const fallbackStageActions = cropKey === "rosemary" && !plan?.stageActions
    ? (activeLocale === "en"
      ? englishCropCareGuidancePlans.rosemary?.seed?.stageActions
      : cropCareGuidancePlans.rosemary?.seed?.stageActions)
    : null;
  const stagePlan = fallbackStageActions
    ? { ...plan, stageActions: fallbackStageActions }
    : plan;
  const key = careGuidanceStageOverrideKey(cropKey, state, stagePlan);
  const override = key ? stagePlan.stageActions?.[key] : null;
  if (!override) return plan;
  return {
    ...plan,
    currentAction: override.currentAction || plan.currentAction,
    followup: override.followup || plan.followup,
    evidence: override.evidence || plan.evidence,
    reminders: override.reminders || plan.reminders
  };
}

function careGuidanceStageHint(cropKey, state) {
  if (cropKey === "basil") return basilGuidanceStageHint(state);
  if (activeLocale === "en") {
    if (cropKey === "tomato") {
      if (state.stage === "flowering") return "At flowering, pollination, heat, and moisture stability become the first checks.";
      if (state.stage === "fruiting") return "At fruiting, avoid water swings and large fertilizer changes.";
      return "Before flowers, keep the plant compact and well lit.";
    }
    if (cropKey === "rosemary") {
      if (state.moisture === "wet" || has(state, "algae")) return "For rosemary, wet roots come before every other diagnosis.";
      if (has(state, "pests") || sees(state, "webbing") || sees(state, "sticky-residue") || smartConcern.value === "pest") return "Speckling, webbing, or sticky tips need an underside and inner-stem check.";
      if (smartConcern.value === "aroma" || has(state, "weak-aroma")) return "Weak aroma usually points to low light, too much water, or too much fertilizer.";
      if (state.climate === "cold" || state.temperature !== null && state.temperature < 16) return "Cold plus wet soil is the dangerous rosemary combination.";
      if (state.stage === "flowering") return "Rosemary flowering is normal; manage it based on leaf harvest, display, or pollinator value.";
      if (state.climate === "humid") return "In humid or rainy weather, prioritize sun, airflow, rain shelter, and fast drainage.";
      if (state.moisture === "dry" || sees(state, "edge-dry")) return "Brown tips can be dryness, but check pot weight before changing to daily watering.";
      return "Rosemary should feel bright, airy, and slightly dry between waterings.";
    }
    if (cropKey === "strawberry") {
      if (state.stage === "flowering") return "Once flowers open, pollinate and keep the crown dry.";
      if (state.stage === "fruiting") return "During fruiting, keep fruit and crown away from wet surfaces.";
      return "Before flowers, crown position and new leaves matter most.";
    }
    if (cropKey === "pepper") {
      if (state.stage === "flowering") return "At flowering, stabilize heat and water before blaming fertilizer.";
      if (state.stage === "fruiting") return "During fruiting, steady moisture and light support fruit retention.";
      return "Before flowers, build compact growth and avoid excess nitrogen.";
    }
    return "";
  }
  if (cropKey === "tomato") {
    if (state.stage === "flowering") return "花期優先看授粉、燈下溫度和水分穩定。";
    if (state.stage === "fruiting") return "結果期不要大幅改水肥，先穩住同一果串。";
    return "開花前先養緊湊株型和強光，不急著授粉。";
  }
  if (cropKey === "rosemary") {
    if (state.moisture === "wet" || has(state, "algae")) return "迷迭香遇到過濕時，停水通風優先於補肥。";
    if (has(state, "pests") || sees(state, "webbing") || sees(state, "sticky-residue") || smartConcern.value === "pest") return "出現黃點、細網或嫩梢發黏時，先補拍葉背和枝條內側。";
    if (smartConcern.value === "aroma" || has(state, "weak-aroma")) return "香味弱通常先看光照、過水和施肥過多，不靠大肥催香。";
    if (state.climate === "cold" || state.temperature !== null && state.temperature < 16) return "迷迭香冬季最怕冷濕疊加，低溫時更要讓根區偏乾。";
    if (state.stage === "flowering") return "迷迭香開花是正常生命週期，可依葉量、觀賞或昆蟲需求決定是否保留。";
    if (state.climate === "humid") return "濕熱或雨季先顧日照、通風、避長雨和快排水。";
    if (state.moisture === "dry" || sees(state, "edge-dry")) return "葉尖 brown 不等於天天澆，先看盆重和下層濕度再補水。";
    return "迷迭香日常重點是強光、通風和根區偏乾。";
  }
  if (cropKey === "strawberry") {
    if (state.stage === "flowering") return "開花後才進入授粉，冠部仍要保持乾爽。";
    if (state.stage === "fruiting") return "結果期要讓果實和冠部離開濕介質。";
    return "開花前先看冠部位置、新葉和根系穩定。";
  }
  if (cropKey === "pepper") {
    if (state.stage === "flowering") return "花期先穩溫水再授粉，不要急著加肥。";
    if (state.stage === "fruiting") return "結果期重點是穩水、支撐和避免突然濃肥。";
    return "開花前先建立緊湊株型，避免高氮只長葉。";
  }
  return "";
}

function mapReminderText(item, mapper) {
  return {
    ...item,
    task: mapper(item.task),
    photo: mapper(item.photo),
    success: mapper(item.success),
    reason: mapper(item.reason)
  };
}

function mapPlanText(plan, mapper) {
  return {
    ...plan,
    label: mapper(plan.label),
    summary: mapper(plan.summary),
    currentAction: mapper(plan.currentAction),
    pollination: mapper(plan.pollination),
    followup: mapper(plan.followup),
    evidence: (plan.evidence || []).map(mapper),
    reminders: (plan.reminders || []).map((item) => mapReminderText(item, mapper)),
    steps: (plan.steps || []).map(([time, text]) => [mapper(time), mapper(text)])
  };
}

function localizedBasilGuidancePlan(mode, state = getFormState()) {
  const basePlan = basilGuidancePlans[mode] || basilGuidancePlans.seed;
  if (activeLocale === "en") {
    const englishBase = englishBasilGuidancePlans[mode] || englishBasilGuidancePlans.seed;
    const overrideKey = basilGuidanceStageOverrideKey(state, basePlan);
    const englishOverride = overrideKey ? englishBase.stageActions?.[overrideKey] : null;
    return englishOverride
      ? {
        ...englishBase,
        currentAction: englishOverride.currentAction || englishBase.currentAction,
        followup: englishOverride.followup || englishBase.followup,
        evidence: englishOverride.evidence || englishBase.evidence,
        reminders: englishOverride.reminders || englishBase.reminders
      }
      : englishBase;
  }
  return mapPlanText(resolveBasilGuidancePlan(state, basePlan), toTraditional);
}

function localizedCarePlan(cropKey, mode, basePlan, state = getFormState()) {
  if (cropKey === "basil") return localizedBasilGuidancePlan(mode, state);
  const localePlan = activeLocale === "en"
    ? englishCropCareGuidancePlans[cropKey]?.[mode] || basePlan
    : basePlan;
  const resolved = resolveCropCareGuidancePlan(cropKey, state, localePlan);
  return activeLocale === "zh-Hant" ? mapPlanText(resolved, toTraditional) : resolved;
}

function renderBasilGuidance(state = getFormState()) {
  if (!basilGuidanceCard || !basilGuidanceSteps || !basilGuidanceCurrent) return;
  const plans = carePlansForCrop(state.crop);
  basilGuidanceCard.hidden = !plans;
  if (!plans) return;

  const mode = careModeForCrop(state.crop);
  const plan = localizedCarePlan(state.crop, mode, plans[mode], state);
  const title = basilGuidanceCard.querySelector("h3");
  if (title) {
    title.textContent = activeLocale === "en"
      ? `${cropName(state.crop)} proactive care guide`
      : `${cropName(state.crop)}主動種植指導`;
  }
  if (basilGuidanceModeLabel) basilGuidanceModeLabel.textContent = plan.label;
  if (basilGuidanceSummary) {
    basilGuidanceSummary.textContent = `${plan.summary} ${careGuidanceStageHint(state.crop, state)}`.trim();
  }

  basilGuideModeButtons.forEach((button) => {
    const buttonMode = button.dataset.basilGuideMode;
    const buttonPlan = plans[buttonMode] ? localizedCarePlan(state.crop, buttonMode, plans[buttonMode], state) : null;
    button.hidden = !buttonPlan;
    button.textContent = buttonPlan?.label || buttonMode;
    const active = buttonMode === mode;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });

  basilGuidanceCurrent.innerHTML = "";
  const action = document.createElement("strong");
  action.textContent = plan.currentAction;
  const note = document.createElement("span");
  note.textContent = plan.pollination || plan.followup || "";
  basilGuidanceCurrent.append(action, note);

  basilGuidanceSteps.innerHTML = "";
  (plan.steps || []).forEach(([time, text]) => {
    const item = document.createElement("div");
    item.className = "basil-guidance-step";
    const label = document.createElement("span");
    label.textContent = time;
    const copy = document.createElement("p");
    copy.textContent = text;
    item.append(label, copy);
    basilGuidanceSteps.appendChild(item);
  });
}

function setCustomerEntryMode(mode, { persist = true } = {}) {
  customerEntryMode = mode === "care" ? "care" : "photo";
  if (persist) {
    try {
      localStorage.setItem(customerEntryModeStorageKey, customerEntryMode);
    } catch {
      // The selected mode still works for this session if storage is blocked.
    }
  }
  renderCustomerMobileExperience(latestState || getFormState());
}

function customerCareSignature(model) {
  return [model.cropKey, model.mode, model.action].join("|");
}

function readCustomerCareRecord() {
  try {
    return JSON.parse(localStorage.getItem(customerCareRecordStorageKey) || "null");
  } catch {
    return null;
  }
}

function writeCustomerCareRecord(record) {
  try {
    localStorage.setItem(customerCareRecordStorageKey, JSON.stringify(record));
  } catch {
    // Local confirmation is enough for the current render even if storage is blocked.
  }
}

function carePlansForCrop(cropKey) {
  return cropCareGuidancePlans[cropKey] || cropCareGuidancePlans.basil;
}

function careModeForCrop(cropKey, requestedMode = basilGuideMode) {
  const plans = carePlansForCrop(cropKey);
  if (plans[requestedMode]) return requestedMode;
  return Object.keys(plans)[0] || "seed";
}

function activeCarePlan(state = getFormState()) {
  const mode = careModeForCrop(state.crop);
  return {
    mode,
    plan: carePlansForCrop(state.crop)[mode]
  };
}

function customerCareModel(state = getFormState()) {
  const crop = cropName(state.crop) || "Plant";
  const { mode, plan: basePlan } = activeCarePlan(state);
  const plan = localizedCarePlan(state.crop, mode, basePlan, state);
  const model = {
    cropKey: state.crop,
    mode,
    modeLabel: plan.label,
    title: activeLocale === "en" ? `${crop} care today` : `${crop}今日養護`,
    message: `${plan.summary} ${careGuidanceStageHint(state.crop, state)}`.trim(),
    action: plan.currentAction,
    followup: plan.followup,
    evidence: plan.evidence || [plan.label],
    reminders: plan.reminders || []
  };
  return {
    ...model,
    completed: readCustomerCareRecord()?.signature === customerCareSignature(model)
  };
}

function careReminderItemsForModel(model, state = getFormState()) {
  if (Array.isArray(model.reminders) && model.reminders.length) return model.reminders;
  const actionItems = followupItemsForCompletedAction(state, latestFindings, model.action);
  if (actionItems.length) return actionItems;
  return [{
    key: "day7",
    task: "观察今天的养护动作是否让植株保持稳定",
    photo: "整株同角度照片",
    success: "植株没有继续变差，并出现新的稳定生长信号。",
    reason: "主动养护动作通常需要 7 天确认趋势"
  }];
}

function scheduleRemindersFromCareAction(state, model, record = {}) {
  const actionCompletedAt = record.completedAt || new Date().toISOString();
  const anchorMs = Date.parse(actionCompletedAt) || Date.now();
  const sourceItems = careReminderItemsForModel(model, state);
  const items = sourceItems.map((item) => ({
    ...item,
    label: reminderLabel(item.key),
    dueAt: new Date(anchorMs + reminderOffsetMs(item.key)).toISOString(),
    completedAt: null,
    source: "care-action",
    cropKey: model.cropKey,
    careMode: model.mode,
    rescheduledFromActionAt: actionCompletedAt
  }));
  const plan = {
    signature: `care|${customerCareSignature(model)}`,
    source: "care-action",
    cropKey: model.cropKey,
    careMode: model.mode,
    createdAt: actionCompletedAt,
    actionCompletedAt,
    actionCompletedTask: model.action,
    actionFollowupMode: "care-action",
    actionFollowupReason: items[0]?.reason || "已按你完成主动养护动作的时间安排复查。",
    items
  };
  setReminderPlan(plan);
  return plan;
}

function refreshAfterCareAction(state, model, record) {
  const plan = scheduleRemindersFromCareAction(state, model, record);
  touchCustomerArchiveRecord({
    lastEvent: "care-action-completed",
    actionCompletedAt: record?.completedAt || new Date().toISOString(),
    actionText: model.action,
    cropKey: model.cropKey,
    careMode: model.mode
  });
  renderReminderSchedule(state, latestFindings);
  renderFollowupLoop(state, latestFindings);
  renderCustomerReminderSummary(state, latestFindings);
  renderCustomerProgressSummary(state);
  renderCustomerSummary(state, latestFindings);
  renderCustomerPlantDossier(state, latestFindings);
  renderCustomerCaseTimeline();
  renderCustomerCompactPlan(state, latestFindings);
  renderCustomerMobileExperience(state);
  renderCustomerJourney(state, latestFindings);

  const pending = firstPendingReminder(plan);
  const handoff = actionFollowupHandoff(plan);
  if (customerReminderKicker && customerReminderTitle && customerReminderMessage && customerReminderMeta) {
    customerReminderKicker.textContent = "动作已完成";
    customerReminderTitle.textContent = handoff?.title || "我会提醒你复查";
    customerReminderMessage.textContent = handoff?.message || "现在不用继续操作，到点只拍复查照。";
    customerReminderMeta.innerHTML = "";
    [
      handoff?.idleAdvice || "现在不用继续操作",
      handoff?.photo || (pending?.photo ? `拍 ${pending.photo}` : "同角度拍照"),
      handoff?.dueAt || (pending?.dueAt ? `复查时间 ${dueLabel(pending.dueAt)}` : "")
    ].filter(Boolean).forEach((item) => {
      const chip = document.createElement("span");
      chip.textContent = item;
      customerReminderMeta.appendChild(chip);
    });
  }
}

function renderCustomerEntryActions() {
  const isCare = customerEntryMode === "care";
  if (customerPhotoEntryBtn) {
    customerPhotoEntryBtn.classList.toggle("active", !isCare);
    customerPhotoEntryBtn.setAttribute("aria-pressed", String(!isCare));
  }
  if (customerCareEntryBtn) {
    customerCareEntryBtn.classList.toggle("active", isCare);
    customerCareEntryBtn.setAttribute("aria-pressed", String(isCare));
  }
}

function renderCustomerCareCard(state = getFormState(), stage = customerAppShell?.dataset.state) {
  if (!customerCareCard || !customerCareAction || !customerCareFollowup) return;
  const show = stage === "care";
  customerCareCard.hidden = !show;
  renderCustomerEntryActions();
  if (!show) return;

  const model = customerCareModel(state);
  if (customerCareKicker) customerCareKicker.textContent = model.completed ? t("careDoneKicker") : t("careKicker");
  if (customerCareTitle) customerCareTitle.textContent = model.title;
  if (customerCareMessage) customerCareMessage.textContent = model.message;
  customerCareAction.textContent = model.completed ? t("careDoneAction") : model.action;
  customerCareFollowup.textContent = model.followup;

  const modeRow = customerCareModeButtons[0]?.closest(".customer-care-mode-row");
  if (modeRow) modeRow.hidden = !carePlansForCrop(state.crop);
  customerCareModeButtons.forEach((button) => {
    const plans = carePlansForCrop(state.crop);
    const mode = button.dataset.customerCareMode;
    const plan = plans[mode] ? localizedCarePlan(state.crop, mode, plans[mode], state) : null;
    button.hidden = !plan;
    button.textContent = plan?.label || mode;
    const active = mode === model.mode;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });

  if (customerCareEvidence) {
    customerCareEvidence.innerHTML = "";
    model.evidence.slice(0, 3).forEach((item) => {
      const chip = document.createElement("span");
      chip.textContent = item;
      customerCareEvidence.appendChild(chip);
    });
  }
}

function setText(selector, value) {
  const element = document.querySelector(selector);
  if (element) element.textContent = value;
}

function setAttr(selector, attr, value) {
  const element = document.querySelector(selector);
  if (element) element.setAttribute(attr, value);
}

function setButtonCopy(button, title, subtitle) {
  if (!button) return;
  const strong = button.querySelector("strong");
  const span = button.querySelector("span");
  if (strong) strong.textContent = title;
  if (span) span.textContent = subtitle;
}

function setTextBesideIcon(selector, value) {
  const element = document.querySelector(selector);
  if (!element) return;
  const textNode = Array.from(element.childNodes).find((node) => node.nodeType === Node.TEXT_NODE);
  if (textNode) textNode.textContent = value;
  else element.appendChild(document.createTextNode(value));
}

function syncLocaleButtons() {
  localeButtons.forEach((button) => {
    const active = button.dataset.localeOption === activeLocale;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

function renderStaticLocale() {
  document.documentElement.lang = t("htmlLang");
  document.body.dataset.locale = activeLocale;
  document.title = t("documentTitle");
  syncLocaleButtons();

  setAttr("#customer-back-btn", "aria-label", t("backAria"));
  setAttr("#customer-privacy-top-btn", "aria-label", t("privacyAria"));
  setAttr("#customer-camera-btn", "aria-label", t("cameraAria"));
  setAttr(".customer-crop-rail", "aria-label", t("cropRailAria"));
  setAttr(".customer-entry-actions", "aria-label", activeLocale === "en" ? "Choose care action" : "選擇照護動作");
  setAttr(".customer-care-mode-row", "aria-label", t("careModeAria"));
  setAttr(".mode-switch", "aria-label", t("viewModeAria"));

  setText("#customer-app-title", t("heroTitle"));
  setText("#customer-app-intro", t("heroIntro"));
  setButtonCopy(customerPhotoEntryBtn, t("photoCheckTitle"), t("photoCheckSubtitle"));
  setButtonCopy(customerCareEntryBtn, t("careEntryTitle"), t("careEntrySubtitle"));
  setTextBesideIcon(".customer-inline-privacy", t("privacyInline"));
  setText("#customer-photo-privacy-detail", t("photoPrivacyDetail"));
  setText(".customer-care-action > span", t("today"));

  setText(".customer-evidence-section h3", t("whyTitle"));
  setText(".followup-row strong", t("followupHelp"));
  const privacySpan = customerMobilePrivacyBtn?.querySelector("span");
  const privacyStrong = customerMobilePrivacyBtn?.querySelector("strong");
  if (privacySpan) privacySpan.textContent = t("diagnosisPrivacy");
  if (privacyStrong) privacyStrong.textContent = t("privacyLabel");
  setText("#customer-mobile-privacy-detail", t("diagnosisPrivacyDetail"));
  const checkSpan = customerCheckPlantBtn?.querySelector("span");
  if (checkSpan) checkSpan.textContent = t("takePhoto");

  setText(".panel-header .eyebrow", t("appEyebrow"));
  setText("#customer-mode-btn", t("customerMode"));
  setText("#expert-mode-btn", t("expertMode"));
  if (readiness?.textContent === "等待输入" || readiness?.textContent === "等待輸入" || readiness?.textContent === "Waiting") {
    readiness.textContent = t("waiting");
  }
  setText("#basil-guidance-card h3", t("basilGuidanceHeader"));

  document.querySelectorAll("[data-crop-choice]").forEach((button) => {
    const key = button.dataset.cropChoice;
    const label = button.querySelector("strong") || button;
    if (key && cropNameCatalog[activeLocale]?.[key]) label.textContent = cropName(key);
  });
  const cropSelectEl = document.querySelector("#crop");
  cropSelectEl?.querySelectorAll("option").forEach((option) => {
    if (cropNameCatalog[activeLocale]?.[option.value]) option.textContent = cropName(option.value);
  });
}

function applyLocale({ persist = false } = {}) {
  syncCropNamesForLocale();
  if (persist) {
    try {
      localStorage.setItem(localeStorageKey, activeLocale);
    } catch {
      // Locale still applies for the current session if storage is blocked.
    }
  }
  renderStaticLocale();
  const state = latestState || getFormState();
  updateCropHint();
  updateDeviceProfile();
  renderBasilGuidance(state);
  renderCustomerMobileExperience(state);
  if (latestState && latestFindings.length) renderDiagnosis(latestState, latestFindings);
}

function setLocale(locale) {
  if (!supportedLocales.has(locale) || locale === activeLocale) return;
  activeLocale = locale;
  applyLocale({ persist: true });
}

function isCustomerModeActive() {
  return !document.body.classList.contains("expert-mode");
}

function selectedText(selector) {
  const select = document.querySelector(selector);
  return select?.selectedOptions?.[0]?.textContent?.trim() || "";
}

function suggestedStageForCustomer(state) {
  if (smartConcern.value === "fruit") return "flowering";
  if (["basil", "rosemary"].includes(state.crop)) return "vegetative";
  if (["yellow", "leggy", "root", "dry", "pest", "aroma"].includes(smartConcern.value)) return "vegetative";
  return state.stage === "seedling" ? "vegetative" : state.stage;
}

function autoFillCustomerIntake({ forceStage = false } = {}) {
  if (!isCustomerModeActive()) return;
  const state = getFormState();
  const stage = document.querySelector("#stage");
  const light = document.querySelector("#light");
  const moisture = document.querySelector("#moisture");

  if (stage && (forceStage || stage.value === "seedling" || smartConcern.value !== "unknown")) {
    stage.value = suggestedStageForCustomer(state);
  }

  if (light && ["yellow", "leggy"].includes(smartConcern.value)) light.value = "low";
  if (light && smartConcern.value === "fruit" && light.value === "low") light.value = "medium";

  if (moisture && smartConcern.value === "root") moisture.value = "wet";
  if (moisture && smartConcern.value === "dry") moisture.value = state.medium === "xponge" ? "swing" : "dry";
}

function renderAutoIntakeCard(state = getFormState()) {
  if (!autoIntakeCard || !autoIntakeSummary || !autoIntakeList) return;
  const plan = buildDeviceCropPlan(state);
  autoIntakeSummary.textContent = `${currentDevice(state).name} / ${cropNames[state.crop]} / ${plan.fitLabel}`;
  autoIntakeList.innerHTML = "";

  [
    ["阶段", selectedText("#stage")],
    ["介质", selectedText("#medium")],
    ["光照", selectedText("#light")],
    ["根区", selectedText("#moisture")],
    ["照片", photoTypeLabel(plan.firstPhoto)]
  ].forEach(([label, value]) => {
    const item = document.createElement("div");
    item.className = "auto-intake-item";
    item.innerHTML = `<span>${label}</span><strong>${value}</strong>`;
    autoIntakeList.appendChild(item);
  });
}

function customerFirstPhotoPrompt(state = getFormState()) {
  const plan = buildDeviceCropPlan(state);
  const type = plan.firstPhoto || "plant";
  const crop = cropNames[state.crop] || "这棵植物";
  const label = photoTypeLabel(type);
  return {
    type,
    label,
    crop,
    button: `拍${crop}${label}`,
    title: `先拍${crop}${label}`,
    message: `不用填表。第一张只拍${label}：${photoTip(type)} 拍完我会自动判断要不要补拍。`
  };
}

function setCustomerFirstPhotoReady(prompt = customerFirstPhotoPrompt()) {
  document.body.classList.add("customer-first-photo-ready");
  document.body.classList.remove("customer-photo-picker-open");
  requestedPhotoType = prompt.type;
  setPhotoType(prompt.type);
  if (photoHint) photoHint.textContent = `已选择${prompt.crop}，第一张拍${prompt.label}。`;
  if (autoPhotoTypeBadge) autoPhotoTypeBadge.textContent = `首张照片：${prompt.label}`;
  if (quickPhotoBtn) {
    quickPhotoBtn.classList.add("soft-focus");
    window.setTimeout(() => quickPhotoBtn.classList.remove("soft-focus"), 1200);
  }
}

function setCustomerPhotoPickerOpen(prompt = customerFirstPhotoPrompt()) {
  document.body.classList.add("customer-photo-picker-open");
  if (photoHint) photoHint.textContent = `正在等待相机/相册返回${prompt.label}，拍完后会自动质检和诊断。`;
  if (autoPhotoTypeBadge) autoPhotoTypeBadge.textContent = `等待拍摄：${prompt.label}`;
}

function scheduleCustomerPhotoPickerCancelCheck(prompt = customerFirstPhotoPrompt()) {
  if (customerPhotoPickerCancelTimer) window.clearTimeout(customerPhotoPickerCancelTimer);
  customerPhotoPickerCancelTimer = window.setTimeout(() => {
    customerPhotoPickerCancelTimer = null;
    if (!document.body.classList.contains("customer-photo-picker-open")) return;
    if (plantPhoto?.files?.length) return;
    document.body.classList.remove("customer-photo-picker-open");
    document.body.classList.add("customer-first-photo-ready");
    if (photoHint) photoHint.textContent = `还没有选择照片。准备好后再拍${prompt.label}，我会继续自动诊断。`;
    if (autoPhotoTypeBadge) autoPhotoTypeBadge.textContent = `等待照片：${prompt.label}`;
  }, 900);
}

function clearCustomerFirstPhotoReady() {
  if (customerPhotoPickerCancelTimer) {
    window.clearTimeout(customerPhotoPickerCancelTimer);
    customerPhotoPickerCancelTimer = null;
  }
  document.body.classList.remove("customer-first-photo-ready", "customer-photo-picker-open");
}

function renderCropQuickChoices(state = getFormState()) {
  if (!cropQuickButtons.length) return;
  cropQuickButtons.forEach((button) => {
    const selected = button.dataset.cropChoice === state.crop;
    button.classList.toggle("active", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
  const prompt = customerFirstPhotoPrompt(state);
  if (quickPhotoBtn) {
    quickPhotoBtn.textContent = prompt.button;
    quickPhotoBtn.setAttribute("aria-label", prompt.title);
  }
}

function hasCustomerDossierContext(state = getFormState()) {
  if (!document.body.classList.contains("customer-mode")) return false;
  const plan = getReminderPlan();
  return Boolean(
    customerHasStarted(state) &&
    (
      getCustomerArchiveRecord()?.reportId ||
      plan?.items?.length ||
      getLogs().length ||
      Object.keys(getTaskState()).length ||
      capturedPhotoTypes.size > 0 ||
      state.hasPhoto
    )
  );
}

function renderCustomerStartPanel(state = getFormState(), findings = latestFindings) {
  if (!customerStartTitle || !customerStartMessage) return;
  if (!hasCustomerDossierContext(state)) {
    const prompt = customerFirstPhotoPrompt(state);
    customerStartTitle.textContent = prompt.title;
    customerStartMessage.textContent = prompt.message;
    renderCropQuickChoices(state);
    return;
  }

  const plan = getReminderPlan();
  const pendingReminder = firstPendingReminder(plan);
  const followupDue = pendingReminder && isReminderDue(pendingReminder);
  const action = customerPrimaryActionModel(state, findings);
  customerStartTitle.textContent = `${cropNames[state.crop] || "当前植物"}已在照看中`;
  customerStartMessage.textContent = followupDue
    ? `右侧档案卡已经切到复查状态，直接${action.label}。`
    : `不用重新选择作物或重新开始；右侧档案卡会告诉你现在该做什么。`;
}

function chooseCustomerCrop(cropKey) {
  if (!cropNames[cropKey]) return;
  dismissCustomerResetUndo();
  cropSelect.value = cropKey;
  autoFillCustomerIntake({ forceStage: true });
  updateCropHint();
  updateDeviceProfile();
  const state = getFormState();
  const prompt = customerFirstPhotoPrompt(state);
  setCustomerFirstPhotoReady(prompt);
  renderCropQuickChoices(state);
  runDiagnosis();
  quickPhotoBtn?.focus();
}

function applyDevicePlan() {
  const state = getFormState();
  const plan = buildDeviceCropPlan(state);
  requestedPhotoType = plan.firstPhoto;
  setPhotoType(plan.firstPhoto);
  if (plan.concern !== "unknown") smartConcern.value = plan.concern;
  hasRunSmartDiagnosis = true;
  applyDeviceTemplate();
  runDiagnosis();
}

function setFieldIfEmpty(selector, value) {
  const input = document.querySelector(selector);
  if (!input || value === undefined || value === null || value === "") return;
  if (!input.value) input.value = value;
}

function applyDeviceTemplate({ force = false } = {}) {
  const device = deviceTemplates[growDeviceSelect.value] || deviceTemplates.generic;
  const setSelect = (selector, value) => {
    const select = document.querySelector(selector);
    if (select && (force || !select.value)) select.value = value;
  };

  setSelect("#medium", device.defaultMedium);
  setSelect("#light", device.defaultLight);
  setSelect("#moisture", device.defaultMoisture);
  setSelect("#climate", device.defaultClimate);

  const defaults = device.defaults || {};
  if (force) {
    document.querySelector("#lightHours").value = defaults.lightHours ?? "";
    document.querySelector("#reservoir").value = defaults.reservoir ?? "";
    document.querySelector("#xpongeThickness").value = defaults.xpongeThickness ?? "1.5";
    document.querySelector("#xpongeLength").value = defaults.xpongeLength ?? "30";
    document.querySelector("#xpongeWidth").value = defaults.xpongeWidth ?? "40";
  } else {
    setFieldIfEmpty("#lightHours", defaults.lightHours);
    setFieldIfEmpty("#reservoir", defaults.reservoir);
    setFieldIfEmpty("#xpongeThickness", defaults.xpongeThickness);
    setFieldIfEmpty("#xpongeLength", defaults.xpongeLength);
    setFieldIfEmpty("#xpongeWidth", defaults.xpongeWidth);
  }

  autoFillCustomerIntake({ forceStage: force });
  updateDeviceProfile();
}

function scorePathway(pathway, state) {
  const reasons = [];
  let score = 0;

  if (pathway.cropKey !== state.crop) return null;
  score += 35;
  reasons.push(`作物匹配：${pathway.cropName}`);

  if (pathway.stage === state.stage) {
    score += 25;
    reasons.push(`阶段匹配：${pathway.stageName}`);
  } else if (["flowering", "fruiting"].includes(pathway.stage) && ["flowering", "fruiting"].includes(state.stage)) {
    score += 10;
    reasons.push("处于花果相关阶段");
  }

  const route = diagnosisRoute(state);
  if (routeBoostsPathway(route, pathway)) {
    score += 18;
    reasons.push(`照片分流：${route.title}`);
  }

  const add = (condition, points, reason) => {
    if (condition) {
      score += points;
      reasons.push(reason);
    }
  };

  const pathwayRules = {
    "tomato-flower-no-fruit": () => {
      add(has(state, "no-fruit") || sees(state, "flower-drop") || smartConcern.value === "fruit", 30, "花/果照片或主诉指向不坐果");
      add(state.light === "low" || has(state, "leggy") || sees(state, "long-internodes"), 18, "存在弱光或徒长信号");
      add(state.temperature !== null && (state.temperature > 30 || state.temperature < 18), 12, "温度可能影响坐果");
    },
    "tomato-fruit-slow-ripen": () => {
      add(state.stage === "fruiting", 24, "已进入结果期");
      add(state.light === "low" || state.lightHours !== null && state.lightHours < 14, 16, "结果期光照不足");
      add(state.ec !== null && state.ec < 1.3, 10, "营养浓度偏低可能拖慢成熟");
    },
    "tomato-xponge-water-swing": () => {
      add(state.medium === "xponge", 24, "使用 Xponge 根区");
      add(state.moisture === "swing" || state.moisture === "dry" || has(state, "leaf-curl") || sees(state, "edge-dry"), 24, "水分波动或边缘干缩明显");
      add(xpongeAreaLiters(state)?.volumeLiters < 1.8 || (state.reservoir !== null && state.reservoir < 3), 12, "根区或储液缓冲偏小");
    },
    "basil-leggy-low-light": () => {
      add(has(state, "leggy") || sees(state, "long-internodes") || smartConcern.value === "leggy", 30, "罗勒株形徒长");
      add(state.light === "low" || state.lightHours !== null && state.lightHours < 12, 20, "光照不足");
    },
    "basil-flowering-bitter": () => {
      add(state.stage === "flowering", 26, "罗勒进入开花阶段");
      add(has(state, "bolting") || sees(state, "flower-buds") || sees(state, "sparse-leaves"), 26, "早花、花苞或叶量下降");
      add(has(state, "no-flower") || smartConcern.value === "leggy", 8, "需要判断修剪和采收节奏");
      add(state.climate === "hot" || state.moisture === "dry", 10, "热/旱压力可能逼花");
    },
    "rosemary-wet-root-decline": () => {
      add(state.moisture === "wet" || state.sensorMoisture !== null && state.sensorMoisture > 75, 30, "迷迭香根区过湿");
      add(has(state, "yellow-leaves") || has(state, "wilting") || sees(state, "white-fuzz"), 20, "叶色或霉斑提示根区压力");
      add(state.climate === "humid", 10, "通风和湿度风险偏高");
    },
    "rosemary-low-light-indoors": () => {
      add(state.light === "low" || state.lightHours !== null && state.lightHours < 12, 28, "迷迭香室内光照不足");
      add(has(state, "leggy") || sees(state, "long-internodes"), 14, "新梢细弱或追光");
    },
    "strawberry-flower-no-fruit": () => {
      add(has(state, "no-fruit") || sees(state, "flower-drop") || smartConcern.value === "fruit", 30, "草莓花后不坐果");
      add(state.stage === "flowering", 18, "处于授粉窗口");
      add(state.climate === "humid" || state.light === "low", 10, "湿度或光照可能影响授粉/坐果");
    },
    "strawberry-deformed-fruit": () => {
      add(state.stage === "fruiting", 22, "已进入果形判断阶段");
      add(has(state, "spots") || has(state, "pests") || sees(state, "tiny-flies"), 20, "叶斑或虫害可能影响果形");
      add(smartConcern.value === "fruit", 12, "用户主诉集中在果实问题");
    },
    "strawberry-crown-wet": () => {
      add(state.moisture === "wet" || state.climate === "humid" || has(state, "algae"), 30, "冠部/基质潮湿风险");
      add(sees(state, "white-fuzz") || sees(state, "green-surface"), 20, "白毛或绿藻信号");
    },
    "pepper-flower-drop": () => {
      add(has(state, "no-fruit") || sees(state, "flower-drop") || smartConcern.value === "fruit", 30, "辣椒落花或不坐果");
      add(state.light === "low" || has(state, "leggy"), 18, "光照不足或徒长");
      add(state.temperature !== null && (state.temperature > 32 || state.temperature < 18), 16, "温度超出坐果舒适区");
      add(state.moisture === "swing" || has(state, "leaf-curl"), 12, "水分波动或卷叶");
    },
    "pepper-compact-variety-fit": () => {
      add(state.stage === "seedling" || has(state, "no-flower"), 22, "需要先判断品种/设备适配");
      add(has(state, "leggy") || sees(state, "long-internodes") || state.light === "low", 18, "设备光照或高度可能不足");
    }
  };

  pathwayRules[pathway.id]?.();
  if (score < 58) return null;

  return {
    id: pathway.id,
    cropKey: pathway.cropKey,
    cropName: pathway.cropName,
    stage: pathway.stage,
    stageName: pathway.stageName,
    userProblem: pathway.userProblem,
    confidence: Math.min(96, score),
    reasons: reasons.slice(0, 5),
    requiredPhotos: pathway.requiredPhotos,
    photoSignals: pathway.photoSignals,
    prescription: pathway.prescription,
    followup: pathway.followup,
    productGap: pathway.productGap
  };
}

function matchKnowledgePathways(state) {
  if (!knowledgeGraphPathways.length) return [];
  return knowledgeGraphPathways
    .map((pathway) => scorePathway(pathway, state))
    .filter(Boolean)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3);
}

function pathologyVisionLabels() {
  return new Set((latestVisionResult?.labels || []).map((item) => item.label).filter(Boolean));
}

function scorePathologyCondition(condition, state) {
  if (!condition || condition.cropKey !== state.crop) return null;
  const symptoms = new Set(state.symptoms || []);
  const visuals = new Set(state.visuals || []);
  const labels = pathologyVisionLabels();
  const match = condition.match || {};
  const reasons = [`作物匹配：${condition.cropName || cropNames[state.crop] || state.crop}`];
  let score = 18;
  const add = (ok, amount, reason) => {
    if (!ok) return;
    score += amount;
    reasons.push(reason);
  };

  add(match.stage?.includes(state.stage), 12, `阶段匹配：${condition.stageName || state.stage}`);
  add(!match.stage?.includes(state.stage) && ["flowering", "fruiting"].includes(condition.stage) && ["flowering", "fruiting"].includes(state.stage), 7, "花果阶段相近");
  add(match.concern?.includes(smartConcern.value), 16, `主诉匹配：${smartConcern.value}`);
  (match.symptoms || []).forEach((item) => add(symptoms.has(item), 14, `症状匹配：${item}`));
  (match.visuals || []).forEach((item) => add(visuals.has(item), 13, `照片信号匹配：${item}`));
  (match.visionLabels || []).forEach((item) => add(labels.has(item), 10, `视觉标签匹配：${item}`));
  add(condition.photoTypes?.includes(state.photoType), 6, `照片类型匹配：${state.photoType}`);

  const environment = match.environment || {};
  add(environment.light?.includes(state.light), 8, `光照状态：${state.light}`);
  add(environment.moisture?.includes(state.moisture), 8, `水分状态：${state.moisture}`);
  add(environment.climate?.includes(state.climate), 7, `环境状态：${state.climate}`);
  add(environment.medium?.includes(state.medium), 7, `介质状态：${state.medium}`);
  add(environment.growDevice?.includes(state.growDevice), 5, `设备适配：${state.growDevice}`);
  add(state.temperature !== null && environment.temperatureHigh !== undefined && state.temperature > environment.temperatureHigh, 10, `温度偏高：${state.temperature}C`);
  add(state.temperature !== null && environment.temperatureLow !== undefined && state.temperature < environment.temperatureLow, 10, `温度偏低：${state.temperature}C`);
  add(state.lightHours !== null && environment.lightHoursMax !== undefined && state.lightHours < environment.lightHoursMax, 9, `光照小时不足：${state.lightHours}h`);
  add(state.sensorMoisture !== null && environment.sensorMoistureHigh !== undefined && state.sensorMoisture > environment.sensorMoistureHigh, 8, `湿度读数偏高：${state.sensorMoisture}`);
  add(state.sensorMoisture !== null && environment.sensorMoistureLow !== undefined && state.sensorMoisture < environment.sensorMoistureLow, 8, `湿度读数偏低：${state.sensorMoisture}`);
  add(state.ec !== null && environment.ecHigh !== undefined && state.ec > environment.ecHigh, 7, `EC 偏高：${state.ec}`);
  add(state.ec !== null && environment.ecLow !== undefined && state.ec < environment.ecLow, 7, `EC 偏低：${state.ec}`);
  add(state.ph !== null && environment.phHigh !== undefined && state.ph > environment.phHigh, 7, `pH 偏高：${state.ph}`);
  add(state.ph !== null && environment.phLow !== undefined && state.ph < environment.phLow, 7, `pH 偏低：${state.ph}`);

  if (reasons.length < 3 || score < 42) return null;
  return {
    ...condition,
    score: Math.min(98, score),
    confidence: Math.min(96, Math.max(42, score)),
    reasons
  };
}

function matchPathologyConditions(state) {
  if (!pathologyConditions.length) return [];
  return pathologyConditions
    .map((condition) => scorePathologyCondition(condition, state))
    .filter(Boolean)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 4);
}

function applyPathologyFindings(state, findings) {
  latestMatchedPathology = matchPathologyConditions(state);
  latestMatchedPathology.slice(0, 2).forEach((item) => {
    const duplicate = findings.some((finding) =>
      finding.title === item.title ||
      finding.title.includes(item.category) ||
      item.title.includes(finding.title)
    );
    if (duplicate) return;
    const evidence = item.evidence?.slice(0, 2).join("；") || item.summary;
    const missing = item.missingInfo?.slice(0, 2).join("、") || "补拍关键照片";
    addFinding(
      findings,
      item.title,
      item.score,
      item.score >= 72 ? "high" : item.score >= 56 ? "medium" : "low",
      `${item.summary} 证据：${evidence}。待确认：${missing}。`,
      item.action
    );
  });
}

function diagnose(state) {
  const findings = [];
  const xponge = xpongeAreaLiters(state);
  const device = currentDevice(state);
  const fit = device.cropFit[state.crop] || "caution";

  if (fit !== "fit") {
    addFinding(
      findings,
      "设备/作物适配风险",
      fit === "avoid" ? 64 : 42,
      deviceFitSeverity(fit),
      `${device.name} 对 ${cropNames[state.crop]} 的适配度为「${deviceFitLabel(fit)}」。${device.risks.join("；")}。`,
      deviceFitAction(state, device, fit)
    );
  }

  if (state.crop === "basil" && (has(state, "weak-aroma") || smartConcern.value === "aroma")) {
    const weakAromaScore = 72 +
      (state.light === "low" || state.lightHours !== null && state.lightHours < 12 ? 12 : 0) +
      (state.ec !== null && state.ec > 2.4 ? 8 : 0) +
      (has(state, "leggy") || sees(state, "long-internodes") ? 6 : 0);
    addFinding(
      findings,
      "罗勒香味弱/风味不浓",
      weakAromaScore,
      weakAromaScore >= 82 ? "high" : "medium",
      "香味不浓无法靠照片直接判断；常见原因是光照不足、氮肥偏高或长期不打顶采收。照片主要用来排除徒长、早花和根区压力。",
      "今天先增加有效光照，适度控肥，并从健康节点上方打顶或轻采收；充足阳光和连续采收会让罗勒香气更明显。"
    );
  }

  if (state.light === "low" || has(state, "leggy") || has(state, "no-flower") || sees(state, "long-internodes") || (state.lightHours !== null && state.lightHours < 12)) {
    addFinding(
      findings,
      "光照不足或光周期不匹配",
      (state.light === "low" ? 44 : 20) + (has(state, "leggy") ? 24 : 0) + (has(state, "no-flower") ? 18 : 0) + (sees(state, "long-internodes") ? 22 : 0) + (state.lightHours !== null && state.lightHours < 12 ? 18 : 0),
      "high",
      isFruitingCrop(state)
        ? "室内结果类作物对日累计光量很敏感，徒长、不开花和小苗细弱常一起出现。"
        : "香草类在弱光下会徒长、香味变淡，迷迭香还容易在弱光叠加过湿时衰弱。",
      state.crop === "tomato" || state.crop === "pepper" || state.crop === "strawberry"
        ? "把补光提高到每天 14-16 小时，灯距先设为 25-35cm；7 天后看新叶是否更厚、节间是否变短。"
        : "把补光稳定到每天 12-14 小时，先观察新叶和株型变化。"
    );
  }

  if (state.moisture === "wet" || state.climate === "humid" || has(state, "yellow-leaves") || has(state, "algae") || sees(state, "green-surface") || sees(state, "white-fuzz") || (state.sensorMoisture !== null && state.sensorMoisture > 78)) {
    addFinding(
      findings,
      "根区过湿、缺氧或表面藻霉风险",
      (state.moisture === "wet" ? 34 : 0) + (state.climate === "humid" ? 16 : 0) + (has(state, "yellow-leaves") ? 14 : 0) + (has(state, "algae") ? 20 : 0) + (sees(state, "green-surface") ? 20 : 0) + (sees(state, "white-fuzz") ? 14 : 0) + (state.sensorMoisture !== null && state.sensorMoisture > 78 ? 18 : 0),
      state.moisture === "wet" || has(state, "algae") ? "high" : "medium",
      "黄叶和基质表面发绿/发白经常来自长期潮湿、见光和通风不足。",
      state.medium === "xponge"
        ? "给 Xponge 表面加遮光盖，保留通气边界；未来 48 小时只补水到湿润界面，不让整片长期浸没。"
        : "暂停浇水 24-48 小时，检查排水和根区气味；之后改成少量多次。"
    );
  }

  if (state.moisture === "dry" || state.moisture === "swing" || has(state, "wilting") || has(state, "leaf-curl") || sees(state, "edge-dry") || (state.sensorMoisture !== null && state.sensorMoisture < 35)) {
    addFinding(
      findings,
      "水分波动过大",
      (state.moisture === "swing" ? 34 : 0) + (state.moisture === "dry" ? 24 : 0) + (has(state, "wilting") ? 20 : 0) + (has(state, "leaf-curl") ? 10 : 0) + (sees(state, "edge-dry") ? 18 : 0) + (state.sensorMoisture !== null && state.sensorMoisture < 35 ? 18 : 0),
      "medium",
      "超薄基质、小盆和强灯会让根区在一天内出现大幅干湿波动，番茄结果期尤其敏感。",
      "把补水改成高频小剂量；若是 Xponge，优先加 2-5L 外置储液缓冲，而不是单纯加厚基质。"
    );
  }

  if (state.temperature !== null && (state.temperature > 32 || state.temperature < 16)) {
    addFinding(
      findings,
      "温度超出舒适区",
      state.temperature > 32 ? 46 : 34,
      "medium",
      "番茄和辣椒在过热或夜间偏冷时容易落花、卷叶、坐果差。",
      state.temperature > 32
        ? "把灯和植株拉开距离，增加低速风扇，优先把冠层温度压到 24-30°C。"
        : "夜间避免贴冷窗，根区温度尽量维持在 18°C 以上。"
    );
  }

  if (state.ec !== null && (state.ec > 3.2 || state.ec < 1.0) && (state.stage === "flowering" || state.stage === "fruiting")) {
    addFinding(
      findings,
      "营养液浓度偏离结果期需求",
      state.ec > 3.2 ? 42 : 32,
      "medium",
      "结果期 EC 过高会加剧盐胁迫和卷叶，过低则容易开花弱、果实发育慢。",
      state.ec > 3.2
        ? "先用清水或低浓度营养液把 EC 拉回温和区间，再观察 3 天新叶和花序。"
        : "逐步提高营养液浓度，不要一次猛加；优先保证钾、钙、镁稳定供应。"
    );
  }

  if (state.ph !== null && (state.ph < 5.5 || state.ph > 6.8) && state.medium !== "soil") {
    addFinding(
      findings,
      "pH 可能影响养分吸收",
      34,
      "medium",
      "无土和水培系统里 pH 偏离会让钙、镁、铁等元素吸收变差，表现可能像缺素。",
      "把 pH 缓慢调回 5.8-6.5，并在 24 小时后复测，不要一次大幅修正。"
    );
  }

  if (has(state, "pests") || sees(state, "webbing") || sees(state, "tiny-flies") || sees(state, "sticky-residue")) {
    addFinding(
      findings,
      sees(state, "webbing") ? "疑似红蜘蛛或叶背害虫" : sees(state, "sticky-residue") ? "疑似吸汁害虫分泌蜜露" : "虫害正在建立种群",
      72 + (sees(state, "webbing") ? 18 : 0) + (sees(state, "tiny-flies") ? 10 : 0) + (sees(state, "sticky-residue") ? 12 : 0),
      "high",
      "小飞虫常见于菌蚊；细网、斑点和卷叶更像红蜘蛛或叶背害虫；叶/嫩梢发黏常见于蚜虫、白粉虱、蓟马等吸汁害虫，需要尽早隔离。",
      sees(state, "webbing")
        ? "立刻拍叶背特写，隔离植株，用水冲洗叶背；24 小时后复查是否仍有细网或移动小点。"
        : sees(state, "sticky-residue")
          ? "先隔离病株，补拍嫩梢和叶背；擦除可见黏液和虫体，24-48 小时后复查同一枝条。"
        : "先隔离病株，挂黄粘板确认虫量；菌蚊用 BTI 控幼虫，叶背虫害用水洗和安全药剂分阶段处理。"
    );
  }

  if (isFruitingCrop(state) && (state.stage === "flowering" || state.stage === "fruiting") && (has(state, "no-fruit") || sees(state, "flower-drop") || state.crop === "tomato" || state.crop === "strawberry" || state.crop === "pepper")) {
    addFinding(
      findings,
      "授粉或结果期营养不足",
      (has(state, "no-fruit") ? 40 : 14) + (sees(state, "flower-drop") ? 22 : 0) + (state.light === "low" ? 18 : 0) + (state.moisture === "swing" ? 12 : 0),
      has(state, "no-fruit") || sees(state, "flower-drop") ? "high" : "medium",
      "室内没有风和昆虫，开花后不结果常由授粉不足、光照不足或氮肥偏高造成。",
      state.crop === "strawberry"
        ? "每天中午轻刷花心，保持风扇低速；畸形果优先排查授粉。"
        : "每天中午轻弹花序 5 秒；结果期降低氮肥倾向，保证钾、钙、镁稳定供应。"
    );
  }

  if (xponge) {
    const isSmallForTomato = state.crop === "tomato" && (xponge.area < 1200 || xponge.volumeLiters < 1.6);
    addFinding(
      findings,
      isSmallForTomato ? "Xponge 根毯面积偏小" : "超薄 Xponge 根区缓冲偏小",
      38 + (state.crop === "tomato" || state.crop === "pepper" ? 14 : 0) + (state.stage === "fruiting" ? 14 : 0) + (isSmallForTomato ? 24 : 0),
      state.stage === "fruiting" || isSmallForTomato ? "high" : "medium",
      `当前根毯约 ${xponge.length}x${xponge.width}cm，体积约 ${xponge.volumeLiters.toFixed(1)}L。薄层根区可行，但水肥、温度和盐分缓冲很小。`,
      isSmallForTomato
        ? "番茄单株先把根毯面积提高到至少 30x40cm，并配 2-5L 储液；目标是稳定完成一轮坐果。"
        : "把 Xponge 定位为根区界面，配独立储液和微循环；用面积、储液量和补水频率补偿厚度。"
    );
  }

  if (state.hasPhoto) {
    addFinding(
      findings,
      "已记录照片，适合进入视觉复查",
      18,
      "low",
      "照片入口可以沉淀叶色、株型、虫害和根区表面的时间序列。",
      "下一版可用同角度照片对比新叶颜色、节间长度、花序保留率和藻霉扩散速度。"
    );
  }

  if (findings.length === 0) {
    addFinding(
      findings,
      "未发现强风险信号",
      20,
      "low",
      "当前输入更像正常养护状态，需要继续积累照片、湿度和光照历史。",
      "保持现有策略 7 天，记录每天同一角度照片和根区湿度。"
    );
  }

  applyPathologyFindings(state, findings);
  applyDiagnosisRouteBoost(state, findings);
  return findings.sort((a, b) => b.score - a.score).slice(0, 5);
}

function photoTypeName(type) {
  const names = {
    none: "未指定",
    leaf: "叶片特写",
    plant: "整株照片",
    flower: "花序/果实",
    root: "根区/Xponge 表面",
    pest: "虫害线索"
  };
  return names[type] || names.none;
}

function buildPhotoPlan(state) {
  const plan = [];
  plan.push(`当前照片类型：${photoTypeName(state.photoType)}。下一次尽量保持同角度、同光线、同距离。`);
  const graphMatch = latestMatchedPathways[0] || null;
  if (graphMatch) {
    const missing = graphMatch.requiredPhotos.filter((type) => !capturedPhotoTypes.has(type));
    plan.push(`图谱路径 ${graphMatch.id}：优先补齐 ${graphMatch.requiredPhotos.map(photoTypeLabel).join("、")}；${missing.length ? `当前还缺 ${missing.map(photoTypeLabel).join("、")}` : "关键照片已齐"}。`);
    missing.forEach((type) => plan.push(`${photoTypeLabel(type)}用途：${pathwayPhotoReason(type, graphMatch)}`));
  }

  if (state.photoType === "leaf" || sees(state, "pale-new-growth") || sees(state, "lower-yellowing")) {
    plan.push("叶片复查：拍一张新叶、一张老叶，放同一背景下比较颜色，3 天后看新叶是否继续变淡。");
  }

  if (state.photoType === "plant" || sees(state, "long-internodes")) {
    plan.push("株型复查：从侧面拍整株，记录顶部到灯的距离和节间长度，7 天后对比是否继续徒长。");
  }

  if (state.photoType === "flower" || sees(state, "flower-drop")) {
    plan.push("花序复查：每天中午拍同一花序，记录开花数、落花数和小果保留数，连续 5 天。");
  }

  if (state.photoType === "root" || sees(state, "green-surface") || sees(state, "white-fuzz")) {
    plan.push("根区复查：拍 Xponge 表面干湿边界、藻斑范围和根色，遮光处理后 48 小时再拍一次。");
  }

  if (state.photoType === "pest" || sees(state, "webbing") || sees(state, "tiny-flies")) {
    plan.push("虫害复查：拍叶背、嫩梢和黄粘板；24 小时后复拍，判断虫量是否下降。");
  }

  if (plan.length === 1) {
    plan.push("建议补充三张标准照片：整株、叶片特写、根区/基质表面。");
  }

  return plan;
}

function getLogs() {
  try {
    return JSON.parse(localStorage.getItem(historyKey) || "[]");
  } catch {
    return [];
  }
}

function setLogs(logs) {
  localStorage.setItem(historyKey, JSON.stringify(logs.slice(-8)));
}

function getTaskState() {
  try {
    return JSON.parse(localStorage.getItem(tasksKey) || "{}");
  } catch {
    return {};
  }
}

function setTaskState(state) {
  localStorage.setItem(tasksKey, JSON.stringify(state));
}

function isTaskDone(record) {
  return record === true || Boolean(record?.completedAt);
}

function taskCompletedAt(record) {
  if (record === true) return null;
  return record?.completedAt || null;
}

function setTaskCompletion(id, text, done) {
  const next = getTaskState();
  if (done) {
    next[id] = {
      completedAt: new Date().toISOString(),
      text
    };
    trackP2Event("action_completed", { id, text });
  } else {
    delete next[id];
  }
  setTaskState(next);
  return next[id] || null;
}

function getReminderPlan() {
  try {
    return JSON.parse(localStorage.getItem(reminderPlanKey) || "null");
  } catch {
    return null;
  }
}

function setReminderPlan(plan) {
  localStorage.setItem(reminderPlanKey, JSON.stringify(plan));
}

function reminderLabel(key) {
  return {
    "24h": "24 小时",
    "48h": "48 小时",
    day3: "第 3 天",
    day7: "第 7 天"
  }[key] || key;
}

function reminderOffsetMs(key) {
  return {
    "24h": 24 * 60 * 60 * 1000,
    "48h": 48 * 60 * 60 * 1000,
    day3: 3 * 24 * 60 * 60 * 1000,
    day7: 7 * 24 * 60 * 60 * 1000
  }[key] || 0;
}

function reminderSignature(state, findings) {
  return [
    state.crop,
    state.stage,
    state.medium,
    findings[0]?.title,
    buildReminders(state, findings).map((item) => item.key).join(",")
  ].join("|");
}

function dueLabel(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function relativeDueText(dateString) {
  const target = Date.parse(dateString);
  if (!Number.isFinite(target)) return "时间待定";
  const delta = target - Date.now();
  if (delta <= 0) return "已到期";
  const minutes = Math.ceil(delta / (60 * 1000));
  if (minutes < 60) return `还有 ${minutes} 分钟`;
  const hours = Math.ceil(minutes / 60);
  if (hours < 24) return `还有 ${hours} 小时`;
  const days = Math.ceil(hours / 24);
  if (days <= 14) return `还有 ${days} 天`;
  return dueLabel(dateString);
}

function ensureReminderPlan(state, findings) {
  const reminders = buildReminders(state, findings);
  const signature = reminderSignature(state, findings);
  const existing = getReminderPlan();
  if (existing && existing.signature === signature) return existing;
  if (!hasRunSmartDiagnosis) return null;

  const createdAt = new Date().toISOString();
  const createdAtMs = Date.parse(createdAt);
  const plan = {
    signature,
    createdAt,
    items: reminders.map((item) => ({
      ...item,
      dueAt: new Date(createdAtMs + reminderOffsetMs(item.key)).toISOString(),
      completedAt: null
    }))
  };
  setReminderPlan(plan);
  return plan;
}

function currentCareReminderPlan(state = getFormState()) {
  const existing = getReminderPlan();
  if (existing?.source === "care-action" && existing.cropKey === state.crop) return existing;
  return null;
}

function activeReminderPlan(state = getFormState(), findings = latestFindings) {
  const carePlan = currentCareReminderPlan(state);
  if (carePlan && firstPendingReminder(carePlan)) return carePlan;
  return ensureReminderPlan(state, findings);
}

function firstPendingReminder(plan = getReminderPlan()) {
  return plan?.items?.find((item) => !item.completedAt) || null;
}

function isReminderDue(item) {
  return Boolean(item?.dueAt && Date.parse(item.dueAt) <= Date.now() && !item.completedAt);
}

function reminderPhotoType(item, state = getFormState()) {
  const text = `${item?.photo || ""} ${item?.task || ""}`;
  if (text.includes("花") || text.includes("果")) return "flower";
  if (text.includes("根") || text.includes("Xponge") || text.includes("基质") || text.includes("储液")) return "root";
  if (text.includes("虫") || text.includes("叶背") || text.includes("黄粘")) return "pest";
  if (text.includes("叶")) return "leaf";
  if (["flowering", "fruiting"].includes(state.stage) && isFruitingCrop(state)) return "flower";
  return "plant";
}

function completeReminder(key) {
  const plan = getReminderPlan();
  if (!plan) return;
  const target = key === "auto" ? firstPendingReminder(plan) : plan.items.find((item) => item.key === key && !item.completedAt);
  if (!target) return;
  target.completedAt = new Date().toISOString();
  setReminderPlan(plan);
}

function reminderItem(key, task, photo, success, reason) {
  return {
    key,
    label: reminderLabel(key),
    task,
    photo,
    success,
    reason
  };
}

function completedActionRouteKey(state, taskText = "") {
  const text = String(taskText);
  if (text.includes("花果路径") || text.includes("授粉") || text.includes("花序") || text.includes("坐果")) return "flower";
  if (text.includes("根区路径") || text.includes("停水") || text.includes("水位") || text.includes("遮光") || text.includes("Xponge")) return "root";
  if (text.includes("虫害路径") || text.includes("隔离") || text.includes("黄粘") || text.includes("叶背") || text.includes("虫量")) return "pest";
  if (text.includes("叶片路径") || text.includes("新叶") || text.includes("老叶") || text.includes("EC/pH") || text.includes("水分")) return "leaf";
  if (text.includes("整株路径") || text.includes("灯距") || text.includes("补光") || text.includes("节间")) return "plant";
  return diagnosisRoute(state)?.key || null;
}

function followupItemsForCompletedAction(state, findings, taskText) {
  const key = completedActionRouteKey(state, taskText);
  if (key === "flower") {
    return [
      reminderItem(
        "day3",
        "记录同一花序的开花数、落花数和小果保留数",
        "同一花序/小果特写",
        "落花减少，小果保留数开始增加。",
        "授粉或花果动作需要 3 天左右才能看出第一轮信号"
      ),
      reminderItem(
        "day7",
        "判断坐果趋势是否改善",
        "同一花序和小果特写",
        "小果继续膨大，新的落花减少。",
        "坐果趋势通常需要 5-7 天确认"
      )
    ];
  }

  if (key === "root") {
    return [
      reminderItem(
        "48h",
        "看藻斑/白毛是否停止扩散，根区气味是否改善",
        "同一根区、Xponge/基质边界",
        "藻斑或白毛不再扩散，根区干湿边界更清楚。",
        "停水、降水位、遮光或通风动作通常先看 48 小时变化"
      ),
      reminderItem(
        "day3",
        "判断根区干湿节奏是否稳定",
        "整株和根区同角度",
        "植株不继续萎蔫，根区不再长期潮湿见光。",
        "根区缓冲变化需要 3 天左右确认"
      )
    ];
  }

  if (key === "pest") {
    return [
      reminderItem(
        "24h",
        "确认虫量是否继续上升",
        "叶背、嫩梢、黄粘板",
        "虫点或飞虫数量下降，没有继续扩散的新叶背虫点。",
        "隔离和初步处理后 24 小时先看虫量方向"
      ),
      reminderItem(
        "48h",
        "判断隔离和处理是否有效",
        "同一叶背和黄粘板",
        "黄粘板新增虫量下降，叶背没有新的细网或活动小点。",
        "虫害处理通常需要 48 小时确认是否压住扩散"
      )
    ];
  }

  if (key === "leaf") {
    return [
      reminderItem(
        "day3",
        "对比新叶/老叶颜色、卷叶和干边是否继续",
        "同一背景下的新叶和老叶",
        "新叶不再继续发淡、卷叶或干边扩大。",
        "稳水、稳光或复测水肥后 3 天能看到叶片方向"
      ),
      reminderItem(
        "day7",
        "判断新叶是否更厚、更绿或节间更稳",
        "整株侧面和顶部新叶",
        "新叶更厚更绿，老问题没有继续扩散。",
        "叶片改善通常需要 7 天确认趋势"
      )
    ];
  }

  if (key === "plant") {
    return [
      reminderItem(
        "day7",
        "对比节间长度、株型和顶部新叶状态",
        "整株侧面和顶部新叶",
        "节间不再继续拉长，新叶状态稳定。",
        "灯距、补光和设备节奏通常需要 7 天观察"
      )
    ];
  }

  return [];
}

function rescheduleRemindersFromAction(state, findings, taskText) {
  const plan = ensureReminderPlan(state, findings);
  if (!plan) return null;
  const actionCompletedAt = new Date().toISOString();
  const anchorMs = Date.parse(actionCompletedAt);
  const actionItems = followupItemsForCompletedAction(state, findings, taskText);
  plan.actionCompletedAt = actionCompletedAt;
  plan.actionCompletedTask = taskText;
  plan.actionFollowupMode = actionItems.length ? "route-action" : "generic";
  plan.actionFollowupReason = actionItems[0]?.reason || null;

  if (actionItems.length) {
    const completedItems = plan.items.filter((item) => item.completedAt);
    plan.items = [
      ...completedItems,
      ...actionItems.map((item) => ({
        ...item,
        label: reminderLabel(item.key),
        dueAt: new Date(anchorMs + reminderOffsetMs(item.key)).toISOString(),
        completedAt: null,
        rescheduledFromActionAt: actionCompletedAt,
        source: "completed-action"
      }))
    ];
  } else {
    plan.items = plan.items.map((item) => {
      if (item.completedAt) return item;
      return {
        ...item,
        dueAt: new Date(anchorMs + reminderOffsetMs(item.key)).toISOString(),
        rescheduledFromActionAt: actionCompletedAt
      };
    });
  }
  setReminderPlan(plan);
  return plan;
}

function progressText(value) {
  const names = {
    unknown: "未记录",
    better: "改善",
    same: "无明显变化",
    worse: "变差"
  };
  return names[value] || names.unknown;
}

function buildFollowupPlan(state) {
  const logs = getLogs();
  const latest = logs[logs.length - 1];
  const reminders = buildReminders(state, latestFindings);
  const plan = reminders.map((item) => `${item.label}：${item.task}`);

  if (!latest) {
    plan.push("首次诊断后先保存基线照片；系统会按处方启用必要复查节点。");
    return plan;
  }

  const worseCount = [latest.leaf, latest.flower, latest.pest].filter((item) => item === "worse").length;
  const betterCount = [latest.leaf, latest.flower, latest.pest].filter((item) => item === "better").length;

  if (worseCount >= 2) {
    plan.push("最近一次记录显示多个指标变差，建议回到最高优先级原因，先处理光照、水分波动或虫害扩散。");
  } else if (betterCount >= 2) {
    plan.push("最近一次记录显示处方有效，保持当前策略到第 7 天，不要频繁改变变量。");
  } else {
    plan.push("最近一次记录还不够明确，继续按同角度拍照和同一时间记录，避免同时改太多变量。");
  }

  if (state.medium === "xponge") {
    plan.push("Xponge 复查要固定记录边缘干缩范围、储液消耗速度和表面藻斑面积。");
  }

  return plan;
}

function addReminder(map, key, task, photo) {
  if (!map[key]) {
    map[key] = {
      key,
      label: reminderLabel(key),
      tasks: new Set(),
      photos: new Set()
    };
  }
  map[key].tasks.add(task);
  map[key].photos.add(photo);
}

function buildReminders(state, findings) {
  const map = {};
  findings.forEach((finding) => {
    if (finding.title.includes("虫害") || finding.title.includes("红蜘蛛")) {
      addReminder(map, "24h", "确认虫量是否继续上升", "叶背、嫩梢、黄粘板");
      addReminder(map, "48h", "判断隔离和处理是否有效", "同一叶背和黄粘板");
    }
    if (finding.title.includes("过湿") || finding.title.includes("藻霉")) {
      addReminder(map, "48h", "看藻斑/白毛是否停止扩散", "Xponge 表面和根区边界");
    }
    if (finding.title.includes("水分波动") || finding.title.includes("Xponge")) {
      addReminder(map, "48h", "检查边缘干缩和储液消耗", "根毯边缘、储液刻度");
      addReminder(map, "day3", "判断补水策略是否稳定", "整株和根区");
    }
    if (finding.title.includes("EC") || finding.title.includes("pH") || finding.title.includes("温度")) {
      addReminder(map, "24h", "复测读数并确认没有过度修正", "传感器读数截图或根区照片");
    }
    if (finding.title.includes("授粉") || finding.title.includes("结果期")) {
      addReminder(map, "day3", "记录开花数、落花数和小果保留数", "同一花序");
      addReminder(map, "day7", "判断坐果趋势是否改善", "花序和小果特写");
    }
    if (finding.title.includes("光照")) {
      addReminder(map, "day7", "对比节间长度和新叶厚度", "整株侧面和顶部新叶");
    }
  });

  if (!Object.keys(map).length) {
    addReminder(map, "day7", "观察是否维持健康生长", "整株、叶片、根区");
  }

  return ["24h", "48h", "day3", "day7"]
    .filter((key) => map[key])
    .map((item) => ({
      ...map[item],
      task: Array.from(map[item].tasks).join("；"),
      photo: Array.from(map[item].photos).join("；")
    }));
}

function renderReminders(state, findings) {
  const reminders = buildReminders(state, findings);
  reminderStrip.innerHTML = "";
  reminders.forEach((item, index) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = `reminder-card${index === 0 ? " active" : ""}`;
    card.innerHTML = `<span>${item.label}</span><em>${item.photo}</em>`;
    card.addEventListener("click", () => {
      checkDay.value = item.key;
      document.querySelectorAll(".reminder-card").forEach((node) => node.classList.remove("active"));
      card.classList.add("active");
    });
    reminderStrip.appendChild(card);
  });
  if (reminders[0]) checkDay.value = reminders[0].key;
}

function renderReminderSchedule(state, findings) {
  const plan = activeReminderPlan(state, findings);
  reminderScheduleList.innerHTML = "";

  if (!plan) {
    const empty = document.createElement("div");
    empty.className = "schedule-item";
    empty.innerHTML = `
      <div class="schedule-time"><strong>待生成</strong><span>完成智能诊断后</span></div>
      <div class="schedule-content"><strong>系统会自动安排复查时间</strong><span>按处方启用 24h / 48h / 第 3 天 / 第 7 天</span></div>
      <div class="schedule-status">未开始</div>
    `;
    reminderScheduleList.appendChild(empty);
    return;
  }

  const now = Date.now();
  const firstPending = firstPendingReminder(plan);
  plan.items.forEach((item) => {
    const due = Date.parse(item.dueAt) <= now && !item.completedAt;
    const row = document.createElement("div");
    row.className = `schedule-item${due ? " due" : ""}${item.completedAt ? " done" : ""}`;
    const status = item.completedAt ? "已完成" : due ? "到期" : firstPending?.key === item.key ? "下一次" : "待复查";
    row.innerHTML = `
      <div class="schedule-time"><strong>${item.label}</strong><span>${dueLabel(item.dueAt)}</span></div>
      <div class="schedule-content"><strong>${item.task}</strong><span>拍：${item.photo}</span></div>
      <div class="schedule-status">${status}</div>
    `;
    row.addEventListener("click", () => {
      checkDay.value = item.key;
      document.querySelectorAll(".reminder-card").forEach((node) => node.classList.remove("active"));
    });
    reminderScheduleList.appendChild(row);
  });
}

function latestFollowupVerdict() {
  const logs = getLogs();
  const latest = logs[logs.length - 1];
  if (!latest) return "还没有复查记录。执行处方后，系统会提醒你回来拍同角度照片。";
  if (latest.routeAssessment?.message) return `复查判断：${latest.routeAssessment.title}。${latest.routeAssessment.message}`;
  const values = [latest.leaf, latest.flower, latest.pest];
  const better = values.filter((item) => item === "better").length;
  const worse = values.filter((item) => item === "worse").length;
  if (worse >= 2) return "复查判断：变差。建议不要继续叠加动作，先回到最高风险原因重新处理。";
  if (better >= 2) return "复查判断：变好。保持当前处方到下一个复查点，不要频繁改参数。";
  if (better === 1 && worse === 0) return "复查判断：有改善迹象。继续执行当前处方，并按下一节点复拍。";
  if (worse === 1) return "复查判断：局部变差。优先补拍对应部位，再决定是否调整处方。";
  return "复查判断：变化不明显。继续保持同角度、同时间复拍，避免一次改太多变量。";
}

function followupSuccessText(item) {
  if (item?.success) return item.success;
  const match = latestMatchedPathways[0];
  if (match?.followup?.success) return match.followup.success;
  const text = `${item?.task || ""} ${item?.photo || ""}`;
  if (text.includes("虫")) return "虫量下降，叶背没有继续扩散的新虫点。";
  if (text.includes("藻") || text.includes("白毛") || text.includes("根")) return "藻斑或白毛不再扩散，根区气味和干湿边界更稳定。";
  if (text.includes("花") || text.includes("果")) return "落花减少，小果保留数增加或果形更稳定。";
  if (text.includes("光") || text.includes("节间") || text.includes("新叶")) return "新叶更厚更绿，节间不再继续拉长。";
  return "关键症状没有继续变差，并出现至少一个改善信号。";
}

function followupLoopInstruction(state = getFormState(), findings = latestFindings) {
  const plan = activeReminderPlan(state, findings);
  const pending = firstPendingReminder(plan);
  const fallback = buildReminders(state, findings)[0];
  const item = pending || fallback;
  if (!item) {
    return {
      title: "下一次复查",
      time: "完成诊断后自动生成",
      photo: "系统会自动判断",
      success: "上传复查照片后判断趋势",
      type: "plant",
      steps: ["先完成首次诊断", "执行处方动作", "系统会给出复查时间"],
      verdict: latestFollowupVerdict(),
      due: false,
      disabled: true
    };
  }

  const type = reminderPhotoType(item, state);
  const due = isReminderDue(item);
  return {
    title: due ? "现在复查" : `${item.label}复查`,
    time: due ? "现在" : item.dueAt ? dueLabel(item.dueAt) : item.label,
    photo: `${photoTypeLabel(type)}：${item.photo}`,
    success: followupSuccessText(item),
    type,
    steps: due
      ? [
        "点下面按钮拍复查照",
        "尽量同角度同光线",
        "上传后我会自动判断"
      ]
      : [
        "先完成今天的处方动作",
        `到时间后拍 ${photoTypeLabel(type)}`,
        "上传后系统判断变好/没变/变差"
      ],
    verdict: due ? "复查时间到了。现在拍一张同角度照片，我会自动判断有没有变好。" : latestFollowupVerdict(),
    key: item.key,
    due,
    disabled: false
  };
}

function updateCustomerFollowupCue(loop = null) {
  const due = loop
    ? isCustomerModeActive() && loop.due && !loop.disabled
    : isCustomerModeActive() && isReminderDue(firstPendingReminder(getReminderPlan()));
  const localizedTitle = t("documentTitle");
  document.title = due
    ? `${activeLocale === "en" ? "Review due" : "該複查了"} · ${localizedTitle}`
    : localizedTitle;
  if (due && readiness) readiness.textContent = activeLocale === "en" ? "Review due" : "該複查了";
}

function followupPhotoTarget(loop = followupLoopInstruction()) {
  const type = loop?.type || "plant";
  return {
    type,
    label: photoTypeLabel(type),
    key: loop?.key || "auto",
    photo: loop?.photo || "同角度复查照"
  };
}

function followupPhotoGuideItems(loop, state = getFormState()) {
  if (!loop || loop.disabled) return [];
  const target = followupPhotoTarget(loop);
  const crop = cropNames[state.crop] || "这棵植物";
  const byType = {
    plant: [
      ["对齐", `拍完整${crop}、盆口和灯光方向`],
      ["位置", "手机保持上次距离，横竖方向不变"],
      ["看点", loop.success]
    ],
    leaf: [
      ["对齐", "找同一片问题叶，旁边带一片新叶"],
      ["位置", "叶面铺平，避开强反光和手影"],
      ["看点", "新叶是否更绿，老叶黄斑是否扩大"]
    ],
    root: [
      ["对齐", "拍同一段根区边缘、植株基部和水位"],
      ["位置", "镜头垂直向下，带上干湿边界"],
      ["看点", "藻斑、白毛、积水和根色是否改善"]
    ],
    flower: [
      ["对齐", "拍同一组花序或同一串小果"],
      ["位置", "花心/果柄清楚，背景尽量简单"],
      ["看点", "落花是否减少，小果是否继续保留"]
    ],
    pest: [
      ["对齐", "拍同一片叶背、嫩梢或同一张粘虫板"],
      ["位置", "靠近但不要糊，先对焦再拍"],
      ["看点", "虫点、蛛丝或飞虫数量是否下降"]
    ]
  };
  return byType[target.type] || [
    ["对齐", photoTip(target.type)],
    ["位置", "尽量同角度、同光线、同距离"],
    ["看点", loop.success]
  ];
}

function renderFollowupPhotoGuide(loop, state = getFormState()) {
  if (!followupPhotoGuide) return;
  const items = followupPhotoGuideItems(loop, state);
  followupPhotoGuide.hidden = !items.length;
  followupPhotoGuide.innerHTML = "";
  items.forEach(([label, text]) => {
    const item = document.createElement("div");
    item.className = "followup-photo-guide-item";
    item.innerHTML = `<span>${label}</span><strong>${text}</strong>`;
    followupPhotoGuide.appendChild(item);
  });
}

function renderFollowupPhotoTarget(loop) {
  if (!followupLoopTarget) return;
  if (!loop || loop.disabled) {
    followupLoopTarget.textContent = "完成诊断后，我会自动决定下次复查要拍哪一类照片。";
    return;
  }
  const target = followupPhotoTarget(loop);
  followupLoopTarget.textContent = loop.due
    ? `点击按钮后会直接进入${target.label}复查照，不需要重新选择照片类型。`
    : `到期后会自动要求拍${target.label}复查照。`;
}

function applyFollowupPhotoTarget(loop = followupLoopInstruction()) {
  const target = followupPhotoTarget(loop);
  if (target.key) checkDay.value = target.key;
  requestedPhotoType = target.type;
  setPhotoType(target.type);
  if (photoHint) photoHint.textContent = `本次复查已锁定为${target.label}，请尽量按同角度、同光线拍摄。`;
  if (autoPhotoTypeBadge) autoPhotoTypeBadge.textContent = `复查照片：${target.label}`;
  return target;
}

function renderFollowupLoop(state = getFormState(), findings = latestFindings) {
  if (!followupLoopTitle || !followupLoopSteps) return;
  const loop = followupLoopInstruction(state, findings);
  const target = followupPhotoTarget(loop);
  followupLoopTitle.textContent = loop.title;
  followupLoopTime.textContent = loop.time;
  followupLoopPhoto.textContent = loop.photo;
  followupLoopSuccess.textContent = loop.success;
  followupLoopVerdict.textContent = loop.verdict;
  followupLoopUploadBtn.disabled = loop.disabled;
  followupLoopUploadBtn.textContent = loop.disabled ? "等待诊断" : loop.due ? `拍${target.label}复查照` : "上传复查照";
  followupLoopCard.classList.toggle("due", loop.due && !loop.disabled);
  document.body.classList.toggle("customer-followup-due", document.body.classList.contains("customer-mode") && loop.due && !loop.disabled);
  updateCustomerFollowupCue(loop);
  renderFollowupPhotoTarget(loop);
  renderFollowupPhotoGuide(loop, state);
  followupLoopSteps.innerHTML = "";
  loop.steps.forEach((step, index) => {
    const item = document.createElement("div");
    item.className = "followup-loop-step";
    item.innerHTML = `<span>${index + 1}</span><strong>${step}</strong>`;
    followupLoopSteps.appendChild(item);
  });
}

function customerReminderSummary(state = getFormState(), findings = latestFindings) {
  const carePlan = customerEntryMode === "care" ? currentCareReminderPlan(state) : null;
  if (customerEntryMode === "care" && !carePlan) {
    const model = customerCareModel(state);
    return {
      kicker: "提醒",
      title: "完成今天动作后安排复查",
      message: model.followup || "点完成后，我会按这棵植物的阶段提醒你回来拍复查照。",
      meta: ["App 内提醒", "到点拍复查照", "不用手动算时间"]
    };
  }
  const loop = followupLoopInstruction(state, findings);
  if (loop.disabled) {
    if (customerEntryMode === "care") {
      const model = customerCareModel(state);
      return {
        kicker: "提醒",
        title: "完成今天动作后安排复查",
        message: model.followup || "点完成后，我会按这棵植物的阶段提醒你回来拍复查照。",
        meta: ["App 内提醒", "到点拍复查照", "不用手动算时间"]
      };
    }
    return {
      kicker: "提醒",
      title: "先完成这次诊断",
      message: "我会在诊断完成后安排下一次拍照提醒。",
      meta: ["不需要手动设置", "先拍当前照片"]
    };
  }

  const plan = carePlan || activeReminderPlan(state, findings);
  const pending = firstPendingReminder(plan);
  if (loop.due) {
    return {
      kicker: "该复查了",
      title: "现在拍复查照",
      message: "点上面的按钮拍一张同角度照片，我会自动判断有没有变好。",
      meta: [
        loop.photo,
        loop.success,
        "上传后自动保存"
      ]
    };
  }

  if (plan?.actionCompletedAt && pending?.dueAt) {
    const handoff = actionFollowupHandoff(plan);
    return {
      kicker: "动作已完成",
      title: handoff?.title || `我会在 ${relativeDueText(pending.dueAt)} 提醒你复查`,
      message: handoff?.message || "不用手动计算时间，我已经按你完成动作的时间重新安排。",
      meta: [
        handoff?.idleAdvice || "现在不用继续操作",
        handoff?.photo || (pending.photo ? `拍 ${pending.photo}` : "同角度拍照"),
        handoff?.dueAt || `复查时间 ${dueLabel(pending.dueAt)}`,
        handoff?.success || pending.task || "按提醒复查",
        handoff?.completed || `完成 ${dueLabel(plan.actionCompletedAt)}`
      ]
    };
  }

  const photo = loop.photo.replace(/：/g, "，");
  return {
    kicker: loop.title,
    title: `我会在 ${loop.time} 提醒你`,
    message: `到时只需要拍 ${photo}。`,
    meta: [
      loop.success,
      "同角度复拍",
      "我会对比是否变好"
    ]
  };
}

function renderCustomerReminderSummary(state = getFormState(), findings = latestFindings) {
  if (!customerReminderCard || !customerReminderMeta) return;
  const summary = customerReminderSummary(state, findings);
  customerReminderKicker.textContent = summary.kicker;
  customerReminderTitle.textContent = summary.title;
  customerReminderMessage.textContent = summary.message;
  customerReminderMeta.innerHTML = "";
  summary.meta.slice(0, 3).forEach((item) => {
    const chip = document.createElement("span");
    chip.textContent = item;
    customerReminderMeta.appendChild(chip);
  });
}

function progressStateFromLog(log) {
  const values = [log?.leaf, log?.flower, log?.pest];
  const better = values.filter((item) => item === "better").length;
  const worse = values.filter((item) => item === "worse").length;
  if (worse > better) return "worse";
  if (better > worse) return "better";
  return "same";
}

function signalChip(label, value) {
  const pct = percentPoint(value);
  return pct === null ? null : `${label} ${pct}%`;
}

function signalDeltaChip(label, latestValue, previousValue, betterWhen = "down") {
  const latest = percentPoint(latestValue);
  const previous = percentPoint(previousValue);
  if (latest === null || previous === null) return null;
  const delta = latest - previous;
  if (Math.abs(delta) < 3) return `${label}基本稳定`;
  const improved = betterWhen === "down" ? delta < 0 : delta > 0;
  return `${label}${improved ? "改善" : "变差"} ${Math.abs(delta)}pp`;
}

function customerProgressSummary(state = getFormState()) {
  const logs = getLogs();
  if (!logs.length) {
    return {
      state: "waiting",
      kicker: "复查结果",
      title: "完成复查后，我会告诉你有没有变好",
      message: "按提醒上传同角度照片就可以，不需要手动判断。",
      meta: ["不需要手动记录", "同角度拍一张", "我会自动对比"]
    };
  }

  const latest = logs[logs.length - 1];
  const previous = logs[logs.length - 2] || null;
  const outcome = followupOutcome(latest);
  const routeAssessment = latest.routeAssessment || null;
  const status = routeAssessment?.state || progressStateFromLog(latest);
  const crop = cropNames[state.crop] || "这棵植物";
  const signals = latest.autoSignals || {};
  const previousSignals = previous?.autoSignals || {};

  const titleMap = {
    better: `${crop}看起来正在恢复`,
    worse: `${crop}有加重迹象`,
    same: `${crop}变化还不明显`
  };
  const messageMap = {
    better: "先保持当前方案，不要频繁改水、肥、灯；等下一次提醒再复拍确认。",
    worse: "先暂停加新动作，重新看最高风险原因，并补拍系统建议的关键部位。",
    same: "继续按现在的动作执行一次，下一次尽量用同角度、同光线复拍。"
  };

  const meta = [
    `新叶 ${progressText(latest.leaf)}`,
    `花果 ${progressText(latest.flower)}`,
    `虫害/藻霉 ${progressText(latest.pest)}`,
    signalDeltaChip("黄叶", signals.yellowRatio, previousSignals.yellowRatio, "down"),
    signalDeltaChip("绿色", signals.greenRatio, previousSignals.greenRatio, "up"),
    signalChip("当前黄度", signals.yellowRatio),
    signalChip("当前绿度", signals.greenRatio)
  ].filter(Boolean);

  return {
    state: status,
    kicker: latest.autoSaved ? "已自动复查" : "复查结果",
    title: routeAssessment?.title || titleMap[status] || outcome.label,
    message: routeAssessment?.message || messageMap[status] || outcome.next,
    meta: [
      ...(routeAssessment?.evidence || []),
      ...meta
    ].slice(0, 4)
  };
}

function renderCustomerProgressSummary(state = getFormState()) {
  if (!customerProgressCard || !customerProgressMeta) return;
  const summary = customerProgressSummary(state);
  customerProgressCard.className = `customer-progress-card ${summary.state}`;
  customerProgressKicker.textContent = summary.kicker;
  customerProgressTitle.textContent = summary.title;
  customerProgressMessage.textContent = summary.message;
  customerProgressMeta.innerHTML = "";
  summary.meta.forEach((item) => {
    const chip = document.createElement("span");
    chip.textContent = item;
    customerProgressMeta.appendChild(chip);
  });
}

function setMode(mode) {
  document.body.classList.toggle("customer-mode", mode === "customer");
  document.body.classList.toggle("expert-mode", mode === "expert");
  if (mode !== "customer") document.body.classList.remove("customer-followup-due");
  customerModeBtn.classList.toggle("active", mode === "customer");
  expertModeBtn.classList.toggle("active", mode === "expert");
  localStorage.setItem("growClinicMode", mode);
  syncCustomerIntakeState(latestState || getFormState());
  if (latestState && latestFindings.length) {
    renderDiagnosis(latestState, latestFindings);
  }
  updateCustomerFollowupCue();
}

function firstSentence(text) {
  return String(text || "").split(/[。；;]/)[0];
}

function customerHasStarted(state = getFormState()) {
  const plan = getReminderPlan();
  return Boolean(
    state.hasPhoto ||
    capturedPhotoTypes.size > 0 ||
    state.photoType !== "none" ||
    smartConcern.value !== "unknown" ||
    hasRunSmartDiagnosis ||
    plan?.items?.length ||
    getCustomerArchiveRecord()?.reportId ||
    getLogs().length ||
    Object.keys(getTaskState()).length
  );
}

function photoQualityProblems(signals = photoSignals) {
  return evaluatePhotoQuality(signals).filter((item) =>
    !item.includes("可用于初步判断") && !item.includes("还没有上传照片")
  );
}

function uniquePhotoTypes(types) {
  const allowed = new Set(["plant", "leaf", "root", "flower", "pest"]);
  return Array.from(new Set(types.filter((type) => allowed.has(type))));
}

function buildPhotoRescueActions(state, suggestion, isRetake) {
  const missing = requiredPhotoTypes(state).filter((type) => !capturedPhotoTypes.has(type));
  const primary = suggestion.type || requestedPhotoType || state.photoType || "plant";
  const types = uniquePhotoTypes([
    primary,
    ...missing,
    isRetake ? "plant" : null,
    diagnosisRoute(state)?.key
  ]).slice(0, 4);

  return types.map((type, index) => ({
    type,
    label: index === 0
      ? `${isRetake ? "重拍" : "补拍"}${photoTypeLabel(type)}`
      : `再拍${photoTypeLabel(type)}`,
    primary: index === 0
  }));
}

function customerPhotoRescuePlan(state = getFormState()) {
  if (!customerHasStarted(state)) return null;
  const plan = getReminderPlan();
  if (plan?.actionCompletedAt && firstPendingReminder(plan)) return null;
  const suggestion = nextPhotoSuggestion();
  if (!suggestion.type || suggestion.title === "照片已够用") return null;
  const qualityProblems = photoQualityProblems();
  const hasAnyPhoto = capturedPhotoTypes.size > 0 || state.hasPhoto;
  const isRetake = qualityProblems.length > 0 && hasAnyPhoto;
  const typeLabel = photoTypeLabel(suggestion.type);
  const steps = isRetake
    ? [
      "靠近植物，画面里只放这株植物",
      "打开室内灯或靠近窗边，避开强反光",
      "拍完后我会自动继续判断"
    ]
    : [
      `这次只拍 ${typeLabel}`,
      photoTip(suggestion.type),
      "拍完后不用重新填表"
    ];

  return {
    type: suggestion.type,
    kicker: isRetake ? "照片看不准" : "还差一张关键照片",
    title: isRetake ? "请重拍一张更清楚的照片" : suggestion.action,
    message: isRetake ? qualityProblems[0] : suggestion.tip,
    button: isRetake ? "按提示重拍" : `补拍${typeLabel}`,
    steps,
    actions: buildPhotoRescueActions(state, suggestion, isRetake)
  };
}

function renderCustomerPhotoRescue(state = getFormState()) {
  if (!customerPhotoRescueCard) return;
  const plan = document.body.classList.contains("customer-mode")
    ? customerPhotoRescuePlan(state)
    : null;
  document.body.classList.toggle("customer-photo-rescue-needed", Boolean(plan));
  customerPhotoRescueCard.hidden = !plan;
  if (!plan) return;
  customerPhotoRescueKicker.textContent = plan.kicker;
  customerPhotoRescueTitle.textContent = plan.title;
  customerPhotoRescueMessage.textContent = plan.message;
  customerPhotoRescueBtn.textContent = plan.button;
  customerPhotoRescueSteps.innerHTML = "";
  plan.steps.forEach((step) => {
    const item = document.createElement("li");
    item.textContent = step;
    customerPhotoRescueSteps.appendChild(item);
  });
  if (customerPhotoRescueActions) {
    customerPhotoRescueActions.innerHTML = "";
    plan.actions.forEach((action) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `rescue-action-button${action.primary ? " primary-action" : ""}`;
      button.textContent = action.label;
      button.addEventListener("click", () => openPhotoRescueUpload(action.type));
      customerPhotoRescueActions.appendChild(button);
    });
  }
}

function syncCustomerIntakeState(state = getFormState()) {
  const customerMode = document.body.classList.contains("customer-mode");
  document.body.classList.toggle(
    "customer-intake-empty",
    customerMode && !customerHasStarted(state)
  );
  document.body.classList.toggle("customer-dossier-active", customerMode && hasCustomerDossierContext(state));
}

function customerTaskLabels() {
  return {
    today: "今天",
    soon: "24-48 小时内",
    week: "3-7 天内"
  };
}

function isWaitingForActionFollowup(plan = activeReminderPlan()) {
  const pending = firstPendingReminder(plan);
  return Boolean(plan?.actionCompletedAt && pending?.dueAt && !isReminderDue(pending));
}

function actionFollowupHandoff(plan = getReminderPlan()) {
  const pending = firstPendingReminder(plan);
  if (!plan?.actionCompletedAt || !pending?.dueAt) return null;
  const due = isReminderDue(pending);
  const when = due ? "现在" : relativeDueText(pending.dueAt);
  const photo = pending.photo ? `拍 ${pending.photo}` : "拍同角度照片";
  const task = pending.task || "按提醒复查";
  const success = pending.success || followupSuccessText(pending);
  const reason = plan.actionFollowupReason || "已按你完成动作的时间重新计算复查节点。";
  return {
    due,
    when,
    photo,
    task,
    success,
    reason,
    title: due ? "现在拍复查照" : `我会在 ${when} 提醒你复查`,
    message: due
      ? "现在只需要拍一张同角度复查照，我会判断有没有变好。"
      : `${reason} 现在先别叠加新动作，到点只拍复查照。`,
    nextAction: due ? photo.replace(/^拍\s*/, "拍") : `${when}复查`,
    compactReason: due
      ? "复查时间到了，拍完我会自动判断趋势。"
      : `当前动作已完成，先不用继续调参数；${when}回来${photo}。`,
    idleAdvice: due ? "现在只做复查拍照" : "现在不用继续操作",
    completed: `完成 ${dueLabel(plan.actionCompletedAt)}`,
    dueAt: `复查时间 ${dueLabel(pending.dueAt)}`
  };
}

function currentCustomerTask(state = getFormState(), findings = latestFindings) {
  if (isWaitingForActionFollowup()) return null;
  const taskState = getTaskState();
  return taskEntries(buildTasks(state, findings), customerTaskLabels())
    .find((entry) => !isTaskDone(taskState[entry.id])) || null;
}

function customerJourneyModel(state, findings) {
  const started = customerHasStarted(state);
  const hasPhoto = capturedPhotoTypes.size > 0 || state.hasPhoto;
  const decision = diagnosisConfidenceDecision(state, findings);
  const pendingTask = currentCustomerTask(state, findings);
  const plan = getReminderPlan();
  const pendingReminder = firstPendingReminder(plan);
  const followupDue = pendingReminder && isReminderDue(pendingReminder);
  const hasFollowupLog = getLogs().length > 0;
  const waitingForActionFollowup = isWaitingForActionFollowup(plan);
  const rescue = waitingForActionFollowup || followupDue ? null : customerPhotoRescuePlan(state);
  const nextPhoto = nextPhotoSuggestion();

  let title = "等待第一张照片";
  let kicker = "当前状态";
  if (!started) {
    title = "先拍照";
  } else if (rescue) {
    title = rescue.title;
  } else if (followupDue) {
    title = "现在拍复查照";
    kicker = "复查到期";
  } else if (waitingForActionFollowup) {
    title = "等待下一次复查";
    kicker = "动作已完成";
  } else if (pendingTask) {
    title = "今天只做当前动作";
  } else if (pendingReminder) {
    title = "等待下一次复查";
  } else if (hasFollowupLog) {
    title = "已完成复查";
  } else {
    title = decision.title || "诊断已生成";
  }

  const photoStatus = !started ? "current" : hasPhoto ? "done" : "current";
  const diagnosisStatus = !started ? "wait" : decision.tier === "blocked" || decision.tier === "photo" ? "current" : "done";
  const actionStatus = !started || diagnosisStatus === "current"
    ? "wait"
    : pendingTask
      ? "current"
      : "done";
  const followupStatus = followupDue
    ? "current"
    : hasFollowupLog
      ? "done"
      : pendingReminder
        ? "wait"
        : "wait";

  return {
    kicker,
    title,
    steps: [
      {
        label: "拍照",
        status: photoStatus,
        detail: hasPhoto
          ? `已获得 ${capturedPhotoTypes.size || 1} 张`
          : nextPhoto.type
            ? nextPhoto.action
            : "拍一张整株照"
      },
      {
        label: "诊断",
        status: diagnosisStatus,
        detail: decision.status || "等待判断"
      },
      {
        label: "当前动作",
        status: actionStatus,
        detail: pendingTask ? firstSentence(pendingTask.text) : actionStatus === "done" ? "动作已完成" : "等待处方"
      },
      {
        label: "复查",
        status: followupStatus,
        detail: followupDue
          ? "现在上传复查照"
          : pendingReminder?.dueAt
            ? relativeDueText(pendingReminder.dueAt)
            : hasFollowupLog
              ? "已记录"
              : "等待提醒"
      }
    ]
  };
}

function renderCustomerJourney(state = getFormState(), findings = latestFindings) {
  if (!customerJourney || !customerJourneyList) return;
  const model = customerJourneyModel(state, findings);
  customerJourneyKicker.textContent = model.kicker;
  customerJourneyTitle.textContent = model.title;
  customerJourneyList.innerHTML = "";
  model.steps.forEach((step) => {
    const item = document.createElement("div");
    item.className = `customer-journey-step ${step.status}`;
    item.innerHTML = `<span>${step.label}</span><strong>${step.detail}</strong>`;
    customerJourneyList.appendChild(item);
  });
}

function customerPrimaryActionModel(state, findings) {
  const started = customerHasStarted(state);
  const decision = diagnosisConfidenceDecision(state, findings);
  const plan = getReminderPlan();
  const pendingReminder = firstPendingReminder(plan);
  const followupDue = pendingReminder && isReminderDue(pendingReminder);
  const waitingForActionFollowup = isWaitingForActionFollowup(plan);
  const rescue = waitingForActionFollowup || followupDue ? null : customerPhotoRescuePlan(state);
  const pendingTask = currentCustomerTask(state, findings);

  if (followupDue) {
    const type = reminderPhotoType(pendingReminder, state);
    return { label: `拍${photoTypeLabel(type)}复查照`, action: "followup" };
  }
  if (!started) return { label: "拍照开始", action: "guided-photo" };
  if (rescue || decision.tier === "photo" || decision.tier === "blocked") {
    return { label: rescue?.button || decision.next || "按提示拍照", action: "suggested-photo" };
  }
  if (pendingTask) return { label: "我已完成，安排复查", action: "complete-current-task" };
  if (pendingReminder) return { label: "查看复查提醒", action: "followup-panel" };
  if (getLogs().length) return { label: "查看复查结果", action: "progress" };
  return { label: "查看诊断结果", action: "diagnosis" };
}

function renderCustomerPrimaryAction(state = getFormState(), findings = latestFindings) {
  const model = customerPrimaryActionModel(state, findings);
  [customerPrimaryActionBtn, customerCompactActionBtn].filter(Boolean).forEach((button) => {
    button.textContent = model.label;
    button.dataset.action = model.action;
  });
}

function customerCompactPlanModel(state, findings) {
  const started = customerHasStarted(state);
  const actionModel = customerPrimaryActionModel(state, findings);
  const journey = customerJourneyModel(state, findings);
  const photoStep = journey.steps.find((step) => step.label === "拍照");
  const photo = photoStep?.detail || "拍一张整株照";
  if (!started) {
    return {
      photo,
      judgement: "等待第一张照片",
      reason: `先选择${cropNames[state.crop]}，再拍一张清晰照片。`,
      action: actionModel.label,
      followup: "诊断后自动安排"
    };
  }

  const plan = getReminderPlan();
  const pendingReminder = firstPendingReminder(plan);
  const followupDue = pendingReminder && isReminderDue(pendingReminder);
  if (plan?.actionCompletedAt && pendingReminder) {
    const handoff = actionFollowupHandoff(plan);
    return {
      photo,
      judgement: followupDue ? "该复查了" : "等待复查",
      reason: handoff?.compactReason || (followupDue
        ? "现在拍同角度复查照，我会判断有没有变好。"
        : "当前动作已经完成，先不要叠加新动作。"),
      action: actionModel.label,
      followup: handoff?.due ? "现在" : handoff?.when || relativeDueText(pendingReminder.dueAt)
    };
  }

  const rescue = customerPhotoRescuePlan(state);
  if (rescue) {
    return {
      photo,
      judgement: rescue.kicker,
      reason: rescue.message,
      action: rescue.button,
      followup: "补拍后重新安排"
    };
  }

  const top = findings[0];
  const task = currentCustomerTask(state, findings);
  const pending = firstPendingReminder();
  const firstReminder = buildReminders(state, findings)[0];
  return {
    photo,
    judgement: top?.title || "诊断已生成",
    reason: top ? firstSentence(top.why) : "信息已经足够生成当前建议。",
    action: task ? firstSentence(task.text) : actionModel.label,
    followup: pending?.dueAt
      ? relativeDueText(pending.dueAt)
      : firstReminder
        ? firstReminder.label
        : "完成动作后自动安排"
  };
}

function renderCustomerCompactPlan(state = getFormState(), findings = latestFindings) {
  if (!customerPlanCompact || !customerCompactJudgement) return;
  const model = customerCompactPlanModel(state, findings);
  if (customerCompactPhoto) customerCompactPhoto.textContent = model.photo;
  customerCompactJudgement.textContent = model.judgement;
  customerCompactReason.textContent = model.reason;
  customerCompactAction.textContent = model.action;
  customerCompactFollowup.textContent = model.followup;
  renderCustomerArchiveStatus(state, findings);
  renderCustomerTrustAndPrivacy(state, findings);
}

function customerEvidenceLabel(value) {
  const labels = {
    "flower-drop": "落花或花序变化",
    "flower-buds": "花苞/花穗",
    "sparse-leaves": "叶子变少",
    "long-internodes": "节间偏长",
    "pale-leaves": "叶色偏淡",
    "white-fuzz": "根区白色絮状物",
    "green-surface": "基质表面发绿",
    "edge-dry": "叶缘干缩",
    "leaf-curl": "叶片卷曲",
    "yellow-leaves": "叶片发黄",
    "wilting": "叶片下垂",
    "transplant-shock": "刚移栽/缓苗",
    "weak-aroma": "香味不浓",
    "recent-transplant": "近期移栽",
    "spots": "叶面斑点",
    "pests": "虫害痕迹",
    "leaf-white-powder": "叶面白粉",
    "gray-mold": "灰霉绒毛",
    "webbing": "细网/蛛丝",
    "tiny-flies": "小飞虫",
    "sticky-residue": "叶/嫩梢发黏",
    "powdery-mildew": "白粉病信号",
    "leaf-holes": "叶片孔洞",
    "chewed-edge": "叶缘被啃",
    "chewing-damage": "啃食痕迹",
    "no-fruit": "开花后不坐果",
    "bolting": "很快开花/抽薹",
    "leggy": "徒长",
    "algae": "根区藻绿",
    "root-browning": "根区褐变",
    "crown-wet": "冠部偏湿"
  };
  if (!value) return "";
  return labels[value] || String(value).replace(/[-_]/g, " ");
}

function customerVisibleSignals(state = getFormState(), findings = latestFindings) {
  const values = [];
  const pathway = latestMatchedPathways[0];
  values.push(...(pathway?.photoSignals || []));
  values.push(...(state.visuals || []));
  values.push(...(state.symptoms || []));
  values.push(...(latestVisionResult?.observations || []).map((item) => item.label || item.evidence || item.description));
  values.push(...(latestVisionResult?.labels || []).map((item) => item.label));
  if (!values.length && findings[0]?.title) values.push(findings[0].title);

  return Array.from(new Set(values.map(customerEvidenceLabel).filter(Boolean))).slice(0, 2);
}

function customerTrustEvidenceModel(state = getFormState(), findings = latestFindings) {
  const hasPhoto = Boolean(capturedPhotoTypes.size || latestPhotoQualityGate || photoSignals.width);
  const suggestion = nextPhotoSuggestion();
  const capturedType = Array.from(capturedPhotoTypes).slice(-1)[0];
  const currentType = latestPhotoQualityGate?.photoType
    || latestPhotoTypeDetection?.type
    || requestedPhotoType
    || capturedType
    || state.photoType
    || suggestion.type
    || "plant";
  const signals = customerVisibleSignals(state, findings);
  const evidence = [];

  evidence.push(hasPhoto
    ? `照片类型：已按${photoTypeLabel(currentType)}判断，避免把整株、叶片、根区或花序混在一起。`
    : `照片类型：先拍${photoTypeLabel(currentType)}，系统会按照片角度判断。`);

  evidence.push(signals.length
    ? `可见症状：目前抓到${signals.join("、")}。`
    : "可见症状：上传照片后会先看叶片、根区、花序或虫害线索。");

  evidence.push(suggestion.type
    ? `缺失信息：下一张建议拍${photoTypeLabel(suggestion.type)}，用来补齐判断。`
    : "缺失信息：关键照片已够用；复查时按同角度再拍一张。");

  return {
    title: hasPhoto ? "这次判断基于这些证据" : "先拍照，再给出证据",
    evidence: evidence.slice(0, 3)
  };
}

function renderCustomerTrustAndPrivacy(state = getFormState(), findings = latestFindings) {
  if (customerTrustCard && customerTrustTitle && customerTrustList) {
    const model = customerTrustEvidenceModel(state, findings);
    customerTrustTitle.textContent = model.title;
    customerTrustList.innerHTML = "";
    model.evidence.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      customerTrustList.appendChild(li);
    });
  }

  if (customerPrivacyCard && customerPrivacyCopy) {
    const usesRemoteVision = latestVisionResult?.provider && latestVisionResult.provider !== "local-heuristic-placeholder";
    const uploadText = usesRemoteVision
      ? "本次使用真实视觉模型时，会把压缩后的植物照片发送给 FiveCrop 后端和已配置的视觉模型提供商，只用于这次分析。"
      : "当前会先用本地规则；只有配置真实视觉模型并上传照片时，才会发送压缩后的植物照片。";
    customerPrivacyCopy.textContent = `${uploadText} FiveCrop 不保存原图进病例，也不会默认把照片用于训练或改进模型；清除本机记录会删除这个浏览器里的照片预览、基线和复查记录。`;
  }
}

function customerMobileResultModel(state = getFormState()) {
  const models = {
    tomato: {
      risk: "Flower drop from heat stress",
      action: "Move the light 10 cm higher",
      followup: "Come back in 3 days",
      evidence: [
        ["Flower photo", "Flowers are visible in your image."],
        ["Visible flower drop", "Dropped blossoms suggest heat stress."],
        ["Next photo: same angle", "Helps us compare what changes."]
      ]
    },
    basil: {
      risk: "Leggy growth from low light",
      action: "Move the light closer and pinch the top",
      followup: "Come back in 7 days",
      evidence: [
        ["Whole-plant photo", "The full stem shape is visible."],
        ["Long internodes", "Wide leaf spacing points to low light."],
        ["Next photo: side view", "We will compare new compact growth."]
      ]
    },
    rosemary: {
      risk: "Root stress from staying too wet",
      action: "Pause watering and increase airflow",
      followup: "Come back in 48 hours",
      evidence: [
        ["Root-zone photo", "The wet growing surface is visible."],
        ["Drooping growth", "Soft tips can follow low root oxygen."],
        ["Next photo: root zone", "We will check whether it is drying."]
      ]
    },
    strawberry: {
      risk: "Wet crown and weak pollination",
      action: "Dry the crown and hand-pollinate today",
      followup: "Come back in 3 days",
      evidence: [
        ["Flower photo", "The flower centre is readable."],
        ["Crown moisture", "Water is sitting near the crown."],
        ["Next photo: same flower", "We will look for early fruit set."]
      ]
    },
    pepper: {
      risk: "Flower drop from heat swings",
      action: "Stabilize heat and gently pollinate",
      followup: "Come back in 5 days",
      evidence: [
        ["Flower photo", "The flower cluster is visible."],
        ["Dropped blossoms", "Recent flowers are not holding."],
        ["Next photo: young fruit", "We will check whether fruit has set."]
      ]
    }
  };
  return models[state.crop] || models.tomato;
}

function renderCustomerMobileExperience(state = getFormState()) {
  if (!customerAppShell) return;
  let model = customerMobileResultModel(state);
  const needsCropCheck = visionNeedsCropCheck();
  if (needsCropCheck) {
    const selected = cropNames[state.crop] || "this crop";
    const detected = cropNames[latestVisionResult.detectedCropKey] || "";
    model = {
      risk: "Crop not confirmed",
      action: "Retake one clear whole-plant photo",
      followup: "Diagnosis starts after the crop is confirmed",
      evidence: [
        ["Photo check", latestVisionResult.cropMismatch && detected ? `This looks closer to ${detected} than ${selected}.` : `We cannot confirm this is ${selected} yet.`],
        ["Supported crops", "FiveCrop diagnoses tomato, basil, rosemary, strawberry, and pepper."],
        ["Next photo", "Frame the whole plant in bright, even light."]
      ]
    };
  }
  const processing = document.body.classList.contains("photo-processing");
  const uploaded = photoPreview?.classList.contains("visible") ? photoPreview.getAttribute("src") : "";
  const hasPhoto = Boolean(uploaded || document.body.classList.contains("has-plant-photo"));
  const actionModel = customerPrimaryActionModel(state, latestFindings);
  const hasFollowup = ["followup", "followup-panel", "progress"].includes(actionModel.action);
  const baseStage = processing ? "analyzing" : (needsCropCheck && hasPhoto) ? "action" : hasFollowup ? "followup" : (hasPhoto && hasRunSmartDiagnosis ? "action" : "photo");
  const stage = customerEntryMode === "care" && !processing && !needsCropCheck && !hasPhoto ? "care" : baseStage;
  const stageOrder = { photo: 0, care: 0, analyzing: 0, action: 1, followup: 2 };

  customerAppShell.dataset.state = stage;
  customerAppShell.dataset.intent = customerEntryMode;
  customerAppShell.setAttribute("aria-busy", String(processing));
  if (customerAnalysisState) customerAnalysisState.setAttribute("aria-hidden", String(!processing));
  customerProgressSteps.forEach((step, index) => {
    const activeIndex = stageOrder[stage];
    step.classList.toggle("active", index === activeIndex);
    step.classList.toggle("done", index < activeIndex);
    if (index === activeIndex) step.setAttribute("aria-current", "step");
    else step.removeAttribute("aria-current");
  });
  if (customerMobileRisk) customerMobileRisk.textContent = model.risk;
  const stageCopy = activeLocale === "en"
    ? {
      photo: ["Show me what's changing.", "Frame the whole plant. We'll ask for a detail only if needed."],
      care: ["What should I do today?", "No photo needed for this routine step."],
      analyzing: ["Looking closely.", "Checking photo quality and visible symptoms."],
      action: ["Here is what your plant needs.", "One action today, then a follow-up photo."],
      followup: ["Let us see what changed.", "Use the same angle for a clearer comparison."]
    }
    : {
      photo: ["讓我看看哪裡在變化。", "先拍整株。需要細節時，FiveCrop 只會再要求一張。"],
      care: ["今天該做什麼？", "這是日常養護步驟，不需要先拍照。"],
      analyzing: ["正在仔細查看。", "正在檢查照片品質和可見症狀。"],
      action: ["這是植物今天需要的照護。", "今天只做一個動作，之後回來拍複查照。"],
      followup: ["看看有什麼變化。", "用同一角度拍攝，方便比較。"]
    };
  if (needsCropCheck) {
    stageCopy.action = activeLocale === "en"
      ? ["Let's confirm the plant.", "FiveCrop only diagnoses tomato, basil, rosemary, strawberry, and pepper."]
      : ["先確認這是不是支援作物。", "FiveCrop 目前只診斷番茄、羅勒、迷迭香、草莓和辣椒。"];
  }
  if (customerAppTitle) customerAppTitle.textContent = stageCopy[stage][0];
  if (customerAppIntro) customerAppIntro.textContent = stageCopy[stage][1];
  if (customerMobileAction) customerMobileAction.textContent = model.action;
  if (customerMobileFollowup) customerMobileFollowup.textContent = model.followup;
  renderCustomerCareCard(state, stage);
  renderCustomerReminderSummary(state, latestFindings);
  if (customerMobileEvidence) {
    const icons = [
      '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M7 20v-7M7 13c-3 0-5-2-5-5 3 0 5 2 5 5Zm0 3c4 0 7-3 7-7-4 0-7 3-7 7Z"/></svg>',
      '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 4c5 0 8 3 8 8v7M13 12c1-3 4-5 7-5 0 4-2 7-7 7"/><path d="M10 20h6"/></svg>',
      '<svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="10" cy="10" r="6"/><path d="m14.5 14.5 5 5"/></svg>'
    ];
    customerMobileEvidence.innerHTML = model.evidence.map(([title, detail], index) => `
      <div><span class="customer-evidence-icon">${icons[index] || icons[2]}</span><strong>${title}</strong><span>${detail}</span></div>
    `).join("");
  }
  if (customerStagePhoto) {
    customerStagePhoto.src = uploaded || "assets/tomato-diagnosis-preview.jpg";
    customerStagePhoto.alt = uploaded
      ? `${needsCropCheck ? "Unconfirmed crop" : cropNames[state.crop]} uploaded for diagnosis`
      : "Dwarf tomato plant beside an apartment window";
  }
  if (customerResultPhoto) {
    customerResultPhoto.src = uploaded || "assets/tomato-diagnosis-preview.jpg";
    customerResultPhoto.alt = needsCropCheck
      ? "Unconfirmed plant photo awaiting a clear whole-plant retake"
      : `${cropNames[state.crop]} photo used for this diagnosis`;
  }
  if (customerResultCrop) customerResultCrop.textContent = needsCropCheck ? "Crop not confirmed" : cropNames[state.crop];
  if (customerPhotoStatusLabel) {
    customerPhotoStatusLabel.textContent = processing ? "Checking photo" : hasPhoto ? "Photo ready" : "Example";
  }
  if (customerCheckPlantBtn) {
    const labels = {
      "guided-photo": "Take a photo",
      "suggested-photo": "Retake photo",
      "care-complete": "I’ll do this today",
      "complete-current-task": "I’ve done this",
      followup: "Take follow-up photo",
      "followup-panel": "View follow-up plan",
      progress: "View follow-up result",
      diagnosis: "View diagnosis"
    };
    if (stage === "care") {
      const careModel = customerCareModel(state);
      customerCheckPlantBtn.dataset.action = careModel.completed ? "guided-photo" : "care-complete";
    } else {
      customerCheckPlantBtn.dataset.action = needsCropCheck ? "suggested-photo" : (stage === "photo" ? "guided-photo" : actionModel.action);
    }
    customerCheckPlantBtn.querySelector("span").textContent = processing ? "Analyzing photo..." : (labels[customerCheckPlantBtn.dataset.action] || "Continue");
    customerCheckPlantBtn.disabled = processing;
  }
}

function shortReportId(id) {
  if (!id) return "";
  const text = String(id);
  return text.length > 8 ? text.slice(-8) : text;
}

function relativePastText(dateString) {
  const target = Date.parse(dateString);
  if (!Number.isFinite(target)) return "时间待定";
  const delta = Date.now() - target;
  if (delta < 60 * 1000) return "刚刚";
  const minutes = Math.floor(delta / (60 * 1000));
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  if (days <= 14) return `${days} 天前`;
  return dueLabel(dateString);
}

function dossierChip(text, tone = "neutral", title = "") {
  return text ? { text, tone, title } : null;
}

function dossierShortText(text, limit = 18) {
  const sentence = firstSentence(text).trim();
  if (sentence.length <= limit) return sentence;
  return `${sentence.slice(0, limit)}...`;
}

function latestDossierFollowupSummary(record = getCustomerArchiveRecord()) {
  const latest = getLogs().slice(-1)[0] || null;
  const assessment = latest?.routeAssessment || null;
  const title = record?.followupTitle || assessment?.title || null;
  const next = record?.followupNext || assessment?.next || null;
  const state = record?.followupState || assessment?.state || "same";
  if (!title && !next) return null;
  return {
    state,
    title: title || "复查已记录",
    next: next || "继续按下一次提醒复拍。"
  };
}

function customerPlantDossierModel(state, findings) {
  if (!customerHasStarted(state)) return null;
  const actionModel = customerPrimaryActionModel(state, findings);
  const compactPlan = customerCompactPlanModel(state, findings);
  const record = getCustomerArchiveRecord();
  const plan = getReminderPlan();
  const pendingReminder = firstPendingReminder(plan);
  const followupDue = pendingReminder && isReminderDue(pendingReminder);
  const waitingForActionFollowup = isWaitingForActionFollowup(plan);
  const top = findings[0] || diagnose(state)[0];
  const crop = cropNames[state.crop] || "这棵植物";
  const stage = stageNames[state.stage] || "阶段待定";
  const medium = mediumNames[state.medium] || "介质待定";
  const actionText = compactPlan.action || actionModel.label;
  const actionChip = actionText ? `当前：${dossierShortText(actionText)}` : "";
  const followupChip = followupDue
    ? "复查：现在"
    : pendingReminder?.dueAt
      ? `复查：${relativeDueText(pendingReminder.dueAt)}`
      : compactPlan.followup
        ? `复查：${compactPlan.followup}`
        : "";
  const updatedAt = record?.updatedAt || record?.savedAt;
  const updatedChip = updatedAt ? `更新：${relativePastText(updatedAt)}` : "";
  const archiveChip = record?.reportId
    ? `${customerArchiveEventLabel(record.lastEvent)} · 档案 ${shortReportId(record.reportId)}`
    : "待自动建档";
  const meta = [
    dossierChip(actionChip, followupDue ? "warning" : "primary", actionText ? `当前：${actionText}` : ""),
    dossierChip(followupChip, followupDue ? "warning" : "neutral"),
    dossierChip(updatedChip, "neutral"),
    dossierChip(`${stage} / ${medium}`, "neutral"),
    dossierChip(archiveChip, "subtle")
  ];

  if (record?.lastEvent === "followup") {
    const summary = latestDossierFollowupSummary(record);
    if (summary) {
      return {
        state: summary.state === "worse" ? "worse" : "saved",
        kicker: summary.state === "worse" ? "复查需要注意" : "复查已记录",
        title: `${crop}档案`,
        message: `复查已记录：${summary.title}。${summary.next}`,
        action: actionModel.action,
        actionLabel: actionModel.label,
        meta
      };
    }
  }

  if (followupDue) {
    return {
      state: "due",
      kicker: "该复查了",
      title: `${crop}档案`,
      message: `现在拍${pendingReminder.photo || "同角度复查照"}，我会自动判断有没有变好。`,
      action: actionModel.action,
      actionLabel: actionModel.label,
      meta
    };
  }

  if (waitingForActionFollowup && pendingReminder) {
    const actionText = record?.lastEvent === "action-completed" && record.actionText
      ? `已记录：${firstSentence(record.actionText)}。`
      : "";
    return {
      state: "waiting",
      kicker: record?.lastEvent === "action-completed" ? "动作已记录" : "等待复查",
      title: `${crop}档案`,
      message: `${actionText}${relativeDueText(pendingReminder.dueAt)}拍${pendingReminder.photo || "同角度照片"}复查；这段时间先保持当前动作。`,
      action: actionModel.action,
      actionLabel: actionModel.label,
      meta
    };
  }

  return {
    state: record?.reportId ? "saved" : "active",
    kicker: record?.reportId ? "已恢复当前植物" : "当前诊断",
    title: `${crop}档案`,
    message: top ? `当前判断：${top.title}。` : "继续拍照后会自动生成判断。",
    action: actionModel.action,
    actionLabel: actionModel.label,
    meta
  };
}

function renderCustomerPlantDossier(state = getFormState(), findings = latestFindings) {
  if (!customerPlantDossier) return;
  const model = document.body.classList.contains("customer-mode")
    ? customerPlantDossierModel(state, findings)
    : null;
  customerPlantDossier.hidden = !model;
  if (!model) return;
  customerPlantDossier.dataset.state = model.state;
  customerDossierKicker.textContent = model.kicker;
  customerDossierTitle.textContent = model.title;
  customerDossierMessage.textContent = model.message;
  customerDossierContinueBtn.textContent = model.actionLabel || "继续照看";
  customerDossierContinueBtn.dataset.action = model.action || "diagnosis";
  customerDossierMeta.innerHTML = "";
  model.meta.filter(Boolean).slice(0, 5).forEach((item) => {
    const chip = document.createElement("span");
    chip.textContent = typeof item === "string" ? item : item.text;
    if (typeof item !== "string" && item.title) chip.title = item.title;
    if (item.tone) chip.dataset.tone = item.tone;
    customerDossierMeta.appendChild(chip);
  });
}

function activeCustomerCaseId() {
  const record = getCustomerArchiveRecord();
  if (record?.caseId) return record.caseId;
  if (record?.reportId) return getActiveCase().id;
  return null;
}

function customerTrendProgress(trend = {}) {
  const states = {
    improving: 78,
    stable: 56,
    baseline: 34,
    uncertain: 42,
    worsening: 24,
    empty: 8
  };
  return states[trend.state] || 34;
}

function customerTimelineEventLabel(entry = {}) {
  if (entry.eventType === "followup") return "复查";
  if (entry.eventType === "action") return "动作";
  return "诊断";
}

function customerTimelineDetail(entry = {}) {
  if (entry.eventType === "followup" && entry.routeAssessment?.title) {
    return entry.routeAssessment.title;
  }
  if (entry.eventType === "action") return firstSentence(entry.actionText || "已完成处方动作");
  return entry.decision || entry.topRisk || "已记录";
}

function customerTimelineStatus(entry = {}, index = 0, total = 1) {
  if (entry.eventType === "followup") {
    const state = entry.routeAssessment?.state;
    if (state === "better") return "开始好转";
    if (state === "worse") return "需要重看";
    return "继续观察";
  }
  if (entry.eventType === "action") return "动作完成";
  return index === total - 1 ? "建立基线" : "重新判断";
}

function customerTimelineMeta(entry = {}) {
  const parts = [relativePastText(entry.createdAt)];
  if (entry.eventType === "followup") {
    if (entry.routeAssessment?.next) parts.push(entry.routeAssessment.next);
    else if (entry.next) parts.push(entry.next);
  } else if (entry.eventType === "action") {
    parts.push("等待同角度复查照片验证效果");
  } else {
    if (entry.severity) parts.push(entry.severity);
    if (entry.next) parts.push(entry.next);
  }
  return parts.filter(Boolean).join(" · ");
}

function customerTimelineMetric(entry = {}) {
  if (entry.eventType === "action") return "处方已执行";
  if (entry.eventType === "followup") {
    const state = entry.routeAssessment?.state;
    if (state === "better") return "趋势改善";
    if (state === "worse") return "趋势变差";
    return "趋势待确认";
  }
  const confidence = entry.confidence ?? "-";
  return `可信度 ${confidence}%`;
}

function customerRecoveryNextStep(trend = {}) {
  const reminder = trend.reminder;
  if (reminder) {
    const photo = reminder.photo ? `拍${reminder.photo}` : "拍同角度复查照";
    const dueAt = Date.parse(reminder.dueAt);
    const hoursUntilDue = Number.isFinite(dueAt) ? (dueAt - Date.now()) / (60 * 60 * 1000) : null;
    const dueState = hoursUntilDue !== null && hoursUntilDue <= 0
      ? "due"
      : hoursUntilDue !== null && hoursUntilDue <= 24
        ? "soon"
        : "scheduled";
    return {
      title: trendReminderText(reminder),
      detail: `${photo}；${reminder.task || trend.next || "按系统建议继续复查。"}`,
      urgency: dueState,
      urgencyLabel: dueState === "due" ? "现在复查" : dueState === "soon" ? relativeDueText(reminder.dueAt) : "按计划",
      checklist: [
        reminder.photo ? `重点拍：${reminder.photo}` : "重点拍：同一株植物",
        "角度和距离尽量和上次一样",
        "避开强背光，保持叶片/花/根区清晰"
      ]
    };
  }
  return {
    title: "按处方后自动安排",
    detail: trend.next || "继续按提醒节点复拍。",
    urgency: "scheduled",
    urgencyLabel: "等待安排",
    checklist: [
      "先完成今天的处方动作",
      "复查时回到同一个位置拍照",
      "让主要症状区域保持清晰"
    ]
  };
}

function appendCustomerRecoveryEvidence(trend = {}) {
  const evidence = Array.isArray(trend.evidence) ? trend.evidence.filter(Boolean).slice(0, 3) : [];
  if (!evidence.length) return;

  const panel = document.createElement("div");
  panel.className = "customer-recovery-evidence";

  const label = document.createElement("span");
  label.textContent = "判断依据";
  panel.appendChild(label);

  evidence.forEach((item) => {
    const chip = document.createElement("strong");
    chip.textContent = item;
    panel.appendChild(chip);
  });

  customerCaseTimelineList.appendChild(panel);
}

function appendCustomerTimelineRow(entry, index, total) {
  const row = document.createElement("div");
  row.className = `customer-case-timeline-event ${entry.eventType || "diagnosis"}`;

  const label = document.createElement("span");
  label.textContent = customerTimelineEventLabel(entry);

  const body = document.createElement("div");
  const status = document.createElement("small");
  status.textContent = customerTimelineStatus(entry, index, total);

  const title = document.createElement("strong");
  title.textContent = customerTimelineDetail(entry);

  const meta = document.createElement("em");
  meta.textContent = customerTimelineMeta(entry);

  const metric = document.createElement("b");
  metric.textContent = customerTimelineMetric(entry);

  body.append(status, title, meta, metric);
  row.append(label, body);
  customerCaseTimelineList.appendChild(row);
}

function localCustomerActionEvents() {
  const record = getCustomerArchiveRecord();
  const plan = getReminderPlan();
  const actionAt = record?.actionCompletedAt || plan?.actionCompletedAt;
  const actionText = record?.actionText || plan?.actionCompletedTask || "";
  if (!actionAt || !actionText) return [];
  return [{
    id: `local-action-${actionAt}`,
    eventType: "action",
    createdAt: actionAt,
    actionText,
    topRisk: "处方动作已完成",
    decision: "等待复查",
    confidence: confidenceScore(),
    riskScore: null
  }];
}

function mergeCustomerTimelineEvents(timeline = []) {
  const merged = [...timeline, ...localCustomerActionEvents()]
    .filter((entry) => entry?.createdAt)
    .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
  const seen = new Set();
  return merged.filter((entry) => {
    const key = `${entry.eventType}-${entry.id || entry.createdAt}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function renderCustomerCaseTimeline(item = customerCaseTimelineCache) {
  if (!customerCaseTimelineCard || !customerCaseTimelineList) return;
  const visible = document.body.classList.contains("customer-mode") && hasCustomerDossierContext();
  customerCaseTimelineCard.hidden = !visible;
  if (!visible) return;

  const mergedTimeline = mergeCustomerTimelineEvents(item?.timeline || []);
  if (!mergedTimeline.length) {
    customerCaseTimelineCard.dataset.state = "baseline";
    customerCaseTimelineTitle.textContent = "正在建立恢复轨迹";
    customerCaseTimelineSummary.textContent = "首张诊断保存后，会自动形成基线、处方动作和复查判断。";
    if (customerCaseTrendBar) customerCaseTrendBar.style.width = "12%";
    customerCaseTimelineList.innerHTML = "";
    const empty = document.createElement("div");
    empty.className = "customer-case-timeline-empty";
    const title = document.createElement("strong");
    title.textContent = "先拍一张清晰植物照";
    const copy = document.createElement("span");
    copy.textContent = "FiveCrop 会把这张照片作为基线，后续复查都和它对照。";
    empty.append(title, copy);
    customerCaseTimelineList.appendChild(empty);
    return;
  }

  const trend = item?.trend || {};
  customerCaseTimelineCard.dataset.state = trendClassName(trend);
  customerCaseTimelineTitle.textContent = item?.name || `${cropNames[getFormState().crop] || "植物"}恢复轨迹`;
  customerCaseTimelineSummary.textContent = `${trend.label || "建立基线"}：${trend.summary || "等待下一次复查后判断趋势。"}`;
  if (customerCaseTrendBar) customerCaseTrendBar.style.width = `${customerTrendProgress(trend)}%`;
  const events = mergedTimeline.slice(-4).reverse();
  customerCaseTimelineList.innerHTML = "";
  appendCustomerRecoveryEvidence(trend);
  events.forEach((entry, index) => appendCustomerTimelineRow(entry, index, events.length));
  const nextStep = customerRecoveryNextStep(trend);
  const next = document.createElement("div");
  next.className = "customer-case-timeline-next";
  next.dataset.urgency = nextStep.urgency;
  const nextLabel = document.createElement("span");
  nextLabel.textContent = "下一次";
  const nextBody = document.createElement("div");
  const urgency = document.createElement("small");
  urgency.textContent = nextStep.urgencyLabel;
  const nextTitle = document.createElement("strong");
  nextTitle.textContent = nextStep.title;
  const nextDetail = document.createElement("em");
  nextDetail.textContent = nextStep.detail;
  const checklist = document.createElement("ul");
  checklist.className = "customer-recovery-shot-list";
  nextStep.checklist.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    checklist.appendChild(li);
  });
  nextBody.append(urgency, nextTitle, nextDetail, checklist);
  next.append(nextLabel, nextBody);
  customerCaseTimelineList.appendChild(next);
}

async function refreshCustomerCaseTimeline(options = {}) {
  if (!customerCaseTimelineCard) return null;
  const caseId = activeCustomerCaseId();
  if (!caseId) {
    customerCaseTimelineCache = null;
    renderCustomerCaseTimeline(null);
    return null;
  }
  if (!options.force && customerCaseTimelineCache?.id === caseId) {
    renderCustomerCaseTimeline(customerCaseTimelineCache);
    return customerCaseTimelineCache;
  }
  if (customerCaseTimelineInFlightKey === caseId) return customerCaseTimelineCache;
  customerCaseTimelineInFlightKey = caseId;
  if (!options.silent && customerCaseTimelineTitle) {
    customerCaseTimelineTitle.textContent = "正在刷新病例时间线";
  }
  try {
    const response = await fetch(`/api/cases/${encodeURIComponent(caseId)}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const item = await response.json();
    customerCaseTimelineCache = item;
    renderCustomerCaseTimeline(item);
    return item;
  } catch {
    renderCustomerCaseTimeline(customerCaseTimelineCache);
    return null;
  } finally {
    customerCaseTimelineInFlightKey = null;
  }
}

function getCustomerArchiveRecord() {
  try {
    return JSON.parse(localStorage.getItem(customerAutoArchiveKey) || "null");
  } catch {
    return null;
  }
}

function setCustomerArchiveRecord(record) {
  localStorage.setItem(customerAutoArchiveKey, JSON.stringify(record));
}

function touchCustomerArchiveRecord(update = {}) {
  const existing = getCustomerArchiveRecord();
  if (!existing?.reportId) return null;
  const now = new Date().toISOString();
  const next = {
    ...existing,
    ...update,
    updatedAt: now,
    lastEvent: update.lastEvent || existing.lastEvent || "diagnosis"
  };
  setCustomerArchiveRecord(next);
  return next;
}

function customerArchiveEventLabel(event) {
  const labels = {
    diagnosis: "已建档",
    "action-completed": "已完成动作",
    followup: "已保存复查"
  };
  return labels[event] || "已更新";
}

function customerArchiveSignature(state, findings) {
  const activeCase = getActiveCase(state);
  return [
    activeCase.id,
    state.crop,
    state.stage,
    state.medium,
    Array.from(capturedPhotoTypes).sort().join(","),
    latestPhotoTypeDetection?.type || state.photoType,
    findings[0]?.title || ""
  ].join("|");
}

function setCustomerArchiveStatus(text, state = "waiting") {
  if (!customerArchiveStatus) return;
  customerArchiveStatus.textContent = text;
  customerArchiveStatus.dataset.state = state;
}

function setCustomerArchiveUndoStatus() {
  if (!customerArchiveStatus) return;
  customerArchiveStatus.dataset.state = "saved";
  customerArchiveStatus.innerHTML = "已准备记录新植物。<button type=\"button\" id=\"undo-customer-reset-btn\" class=\"inline-undo-button\">撤销</button>";
  customerArchiveStatus.querySelector("#undo-customer-reset-btn")?.addEventListener("click", restorePreviousCustomerPlant);
}

function dismissCustomerResetUndo() {
  if (!customerResetSnapshot) return;
  customerResetSnapshot = null;
  setCustomerArchiveStatus("拍完首张照片后自动建档。", "waiting");
}

function renderCustomerArchiveStatus(state = getFormState(), findings = latestFindings) {
  if (!customerArchiveStatus) return;
  const hasPhoto = capturedPhotoTypes.size > 0 || state.hasPhoto;
  if (!hasPhoto) {
    setCustomerArchiveStatus("拍完首张照片后自动建档。", "waiting");
    return;
  }
  const signature = customerArchiveSignature(state, findings);
  if (customerAutoArchiveInFlightSignature === signature) {
    setCustomerArchiveStatus("正在为这棵植物建档。", "saving");
    return;
  }
  const record = getCustomerArchiveRecord();
  if (record?.signature === signature && record?.reportId) {
    setCustomerArchiveStatus("已为这棵植物建档，复查会继续记录。", "saved");
    return;
  }
  setCustomerArchiveStatus("会自动为这棵植物建档，不需要手动保存。", "ready");
}

function shouldAutoArchiveCustomerDiagnosis(state, findings) {
  return Boolean(
    isCustomerModeActive() &&
    hasRunSmartDiagnosis &&
    findings?.length &&
    (capturedPhotoTypes.size > 0 || state.hasPhoto)
  );
}

async function maybeAutoArchiveCustomerDiagnosis(state, findings) {
  if (!shouldAutoArchiveCustomerDiagnosis(state, findings)) return null;
  const signature = customerArchiveSignature(state, findings);
  const existing = getCustomerArchiveRecord();
  if (existing?.signature === signature || customerAutoArchiveInFlightSignature === signature) return existing;

  customerAutoArchiveInFlightSignature = signature;
  setCustomerArchiveStatus("正在为这棵植物建档。", "saving");
  try {
    const response = await fetch("/api/reports", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...reportPayload(state, findings),
        autoArchive: true,
        archiveSource: "customer-first-diagnosis"
      })
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const saved = await response.json();
    trackP2Event("report_saved", { reportId: saved.id, cropKey: latestState?.crop });
    const savedAt = new Date().toISOString();
    const record = {
      signature,
      reportId: saved.id,
      caseId: saved.caseId,
      savedAt,
      updatedAt: savedAt,
      lastEvent: "diagnosis"
    };
    setCustomerArchiveRecord(record);
    setCustomerArchiveStatus("已为这棵植物建档，复查会继续记录。", "saved");
    await loadReports();
    await loadCases();
    await refreshCustomerCaseTimeline({ force: true, silent: true });
    await syncCaseNotifications({ silent: true });
    await loadNotifications();
    return record;
  } catch {
    setCustomerArchiveStatus("本机已保留诊断，后台暂时未同步。", "failed");
    return null;
  } finally {
    customerAutoArchiveInFlightSignature = null;
  }
}

function renderCustomerSummary(state, findings) {
  if (document.body.classList.contains("customer-mode") && !customerHasStarted(state)) {
    customerTitle.textContent = "拍一张照片就能开始";
    customerMessage.textContent = "先不用选择作物、设备或填写参数。我会从照片和一个可选困扰里自动判断下一步。";
    customerNextAction.textContent = "拍照开始";
    renderCustomerPrimaryAction(state, findings);
    confidenceValue.textContent = "0%";
    confidenceLabel.textContent = "等待第一张照片。";
    confidenceBar.style.width = "0%";
    confidenceBar.classList.remove("medium", "high");
    return;
  }

  const plan = getReminderPlan();
  const pendingReminder = firstPendingReminder(plan);
  const followupDue = pendingReminder && isReminderDue(pendingReminder);
  if (plan?.actionCompletedAt && pendingReminder) {
    const handoff = actionFollowupHandoff(plan);
    customerTitle.textContent = followupDue ? "该复查了" : "动作已完成，等待复查";
    customerMessage.textContent = handoff?.compactReason || (followupDue
      ? "现在拍一张同角度复查照，我会自动判断有没有变好。"
      : "系统已经按你完成动作的时间重新安排复查。");
    customerNextAction.textContent = followupDue
      ? `拍${pendingReminder.photo || "复查照"}`
      : handoff?.nextAction || `${relativeDueText(pendingReminder.dueAt)}复查`;
    renderCustomerPrimaryAction(state, findings);
    const score = confidenceScore();
    confidenceValue.textContent = `${score}%`;
    confidenceLabel.textContent = followupDue ? "等待复查照片确认变化。" : "处方已执行，等待复查验证。";
    confidenceBar.style.width = `${score}%`;
    confidenceBar.classList.toggle("medium", score >= 60 && score < 85);
    confidenceBar.classList.toggle("high", score >= 85);
    return;
  }

  const top = findings[0];
  const reminders = buildReminders(state, findings);
  const firstReminder = reminders[0];
  const score = confidenceScore();
  const device = currentDevice(state);
  const route = diagnosisRoute(state);
  customerTitle.textContent = top.title;
  customerMessage.textContent = route
    ? `${route.title}：${firstSentence(top.why)}。`
    : `${cropNames[state.crop]} / ${device.name}：${firstSentence(top.why)}。`;
  if (firstReminder) {
    const suggestion = nextPhotoSuggestion();
    const pending = firstPendingReminder();
    customerNextAction.textContent = suggestion.title === "照片已够用"
      ? pending
        ? `${pending.label}复查：拍${pending.photo}`
        : `${firstReminder.label}拍${firstReminder.photo}`
      : suggestion.action;
  } else {
    customerNextAction.textContent = top.action;
  }
  renderCustomerPrimaryAction(state, findings);
  confidenceValue.textContent = `${score}%`;
  confidenceLabel.textContent = confidenceMessage(score);
  confidenceBar.style.width = `${score}%`;
  confidenceBar.classList.toggle("medium", score >= 60 && score < 85);
  confidenceBar.classList.toggle("high", score >= 85);
}

function taskId(text) {
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = ((hash << 5) - hash + text.charCodeAt(index)) | 0;
  }
  return `task-${Math.abs(hash)}`;
}

function addTask(groups, group, text) {
  if (!groups[group]) groups[group] = [];
  if (!groups[group].includes(text)) groups[group].push(text);
}

function buildTasks(state, findings) {
  const groups = {
    today: [],
    soon: [],
    week: []
  };
  const device = currentDevice(state);
  const fit = device.cropFit[state.crop] || "caution";
  const devicePlan = buildDeviceCropPlan(state);
  const primaryRouteAction = routePrimaryAction(state, findings);
  if (primaryRouteAction) addTask(groups, "today", primaryRouteAction);
  addTask(groups, "today", devicePlan.firstAction);
  addTask(groups, devicePlan.followup.includes("48") ? "soon" : "week", devicePlan.followup);
  addTask(groups, "today", `首批按 ${devicePlan.plantCount} 执行，先拍 ${photoTypeLabel(devicePlan.firstPhoto)}。`);

  addTask(groups, "today", `确认设备模板：${device.name}。`);
  if (fit === "avoid") {
    addTask(groups, "today", `暂停把${cropNames[state.crop]}作为当前设备的主推作物，先换成更适配的组合。`);
  } else if (fit === "caution") {
    addTask(groups, "today", "减少同机株数，优先保留一株做复查样本。");
    addTask(groups, "soon", "补拍设备全景，确认灯距、孔位密度和水箱/根区空间。");
  }

  findings.forEach((finding) => {
    if (finding.title.includes("光照")) {
      addTask(groups, "today", "记录当前灯距和每日开灯时长。");
      addTask(groups, "today", "把补光调整到建议时长，避免一次同时改水肥。");
      addTask(groups, "week", "7 天后拍整株侧面照片，对比节间是否变短。");
    }

    if (finding.title.includes("过湿") || finding.title.includes("藻霉")) {
      addTask(groups, "today", "给潮湿见光的基质表面加遮光层。");
      addTask(groups, "soon", "48 小时后复查藻斑、白毛和根区气味。");
    }

    if (finding.title.includes("水分波动")) {
      addTask(groups, "today", "把补水改成少量多次，并记录一次补水量。");
      addTask(groups, "soon", "连续 2 天记录边缘干缩范围和储液消耗。");
    }

    if (finding.title.includes("温度")) {
      addTask(groups, "today", "测一次灯下冠层温度，不只看房间温度。");
      addTask(groups, "soon", "调整风扇或灯距后复测温度。");
    }

    if (finding.title.includes("EC") || finding.title.includes("pH")) {
      addTask(groups, "today", "复测 EC/pH，确认读数不是单次误差。");
      addTask(groups, "soon", "缓慢修正营养液，不做大幅一次性调整。");
    }

    if (finding.title.includes("虫害") || finding.title.includes("红蜘蛛")) {
      addTask(groups, "today", "隔离植株，并拍叶背或黄粘板照片。");
      addTask(groups, "soon", "24 小时后复查虫量是否下降。");
    }

    if (finding.title.includes("授粉") || finding.title.includes("结果期")) {
      addTask(groups, "today", "中午轻弹花序或开低速风扇辅助授粉。");
      addTask(groups, "week", "连续 5-7 天记录开花数、落花数和小果保留数。");
    }

    if (finding.title.includes("Xponge")) {
      addTask(groups, "today", "记录 Xponge 根毯面积、厚度和储液量。");
      addTask(groups, "soon", "复查边缘干湿差异，判断是否需要加大储液缓冲。");
    }
  });

  if (state.hasPhoto || state.photoType !== "none") {
    addTask(groups, "week", "用同角度照片做第 3 天和第 7 天对比。");
  } else {
    addTask(groups, "today", "补拍整株、叶片特写、根区三张基线照片。");
  }

  return groups;
}

function renderTasks(state, findings) {
  const taskState = getTaskState();
  const groups = buildTasks(state, findings);
  const customerMode = document.body.classList.contains("customer-mode");
  const labels = {
    today: "今天",
    soon: "24-48 小时内",
    week: "3-7 天内"
  };

  taskList.innerHTML = "";
  if (customerMode) {
    renderCustomerTaskFocus(state, findings, groups, labels, taskState);
    return;
  }

  Object.keys(labels).forEach((groupKey) => {
    const tasks = groups[groupKey];
    if (!tasks.length) return;

    const group = document.createElement("div");
    group.className = "task-group";

    const title = document.createElement("div");
    title.className = "task-group-title";
    title.textContent = labels[groupKey];
    group.appendChild(title);

    tasks.forEach((text) => {
      const id = taskId(`${groupKey}:${text}`);
      const done = isTaskDone(taskState[id]);

      const label = document.createElement("label");
      label.className = `task-item${done ? " done" : ""}`;

      const input = document.createElement("input");
      input.type = "checkbox";
      input.checked = done;
      input.addEventListener("change", () => {
        setTaskCompletion(id, text, input.checked);
        label.classList.toggle("done", input.checked);
      });

      const span = document.createElement("span");
      span.textContent = text;

      label.appendChild(input);
      label.appendChild(span);
      group.appendChild(label);
    });

    taskList.appendChild(group);
  });
}

function flattenTasks(groups) {
  const labels = {
    today: "今天",
    soon: "24-48 小时内",
    week: "3-7 天内"
  };

  return Object.keys(labels).flatMap((key) =>
    (groups[key] || []).map((task) => `${labels[key]}：${task}`)
  );
}

function taskEntries(groups, labels) {
  return Object.keys(labels).flatMap((groupKey) =>
    (groups[groupKey] || []).map((text) => ({
      id: taskId(`${groupKey}:${text}`),
      groupKey,
      groupLabel: labels[groupKey],
      text
    }))
  );
}

function refreshAfterCustomerAction(state, findings, text, record) {
  const plan = rescheduleRemindersFromAction(state, findings, text);
  touchCustomerArchiveRecord({
    lastEvent: "action-completed",
    actionCompletedAt: record?.completedAt || new Date().toISOString(),
    actionText: text
  });
  renderReminderSchedule(state, findings);
  renderFollowupLoop(state, findings);
  renderCustomerReminderSummary(state, findings);
  renderCustomerProgressSummary(state);
  renderCustomerSummary(state, findings);
  renderCustomerPlantDossier(state, findings);
  renderCustomerCaseTimeline();
  renderCustomerCompactPlan(state, findings);
  renderCustomerMobileExperience(state);
  renderCustomerJourney(state, findings);
  renderTasks(state, findings);

  if (!plan) return;
  const pending = firstPendingReminder(plan);
  const handoff = actionFollowupHandoff(plan);
  const when = handoff?.when || (pending?.dueAt ? relativeDueText(pending.dueAt) : "下一次提醒");
  customerReminderKicker.textContent = "动作已完成";
  customerReminderTitle.textContent = handoff?.title || `我会在 ${when} 提醒你复查`;
  customerReminderMessage.textContent = handoff?.message || "不用手动计算时间，我已经按你完成动作的时间重新安排。";
  customerReminderMeta.innerHTML = "";
  [
    handoff?.idleAdvice || "现在不用继续操作",
    handoff?.photo || (pending?.photo ? `拍 ${pending.photo}` : "同角度拍照"),
    handoff?.dueAt || (pending?.dueAt ? `复查时间 ${dueLabel(pending.dueAt)}` : ""),
    handoff?.success ? `看 ${handoff.success}` : pending?.success ? `看 ${pending.success}` : "",
    record?.completedAt ? `完成 ${dueLabel(record.completedAt)}` : handoff?.completed || ""
  ].filter(Boolean).slice(0, 3).forEach((item) => {
    const chip = document.createElement("span");
    chip.textContent = item;
    customerReminderMeta.appendChild(chip);
  });
}

function renderCustomerTaskFocus(state, findings, groups, labels, taskState) {
  const entries = taskEntries(groups, labels);
  const pending = entries.filter((entry) => !isTaskDone(taskState[entry.id]));
  const completed = entries.length - pending.length;
  const plan = getReminderPlan();
  const waitingForFollowup = isWaitingForActionFollowup(plan);
  const reminder = firstPendingReminder(plan);
  const current = waitingForFollowup ? null : pending[0];

  const group = document.createElement("div");
  group.className = "task-group customer-task-focus";

  const title = document.createElement("div");
  title.className = "task-group-title";
  title.textContent = current ? "当前动作" : waitingForFollowup ? "等待复查" : "动作已完成";
  group.appendChild(title);

  if (!current) {
    const handoff = actionFollowupHandoff(plan);
    const done = document.createElement("div");
    done.className = "customer-action-empty";
    done.innerHTML = waitingForFollowup
      ? `<strong>当前动作已完成</strong><span>${handoff?.compactReason || (reminder?.dueAt ? `${relativeDueText(reminder.dueAt)}复查，拍 ${reminder.photo || "同角度照片"}。` : "等复查提醒到了，直接拍一张同角度照片。")}</span>`
      : "<strong>今天的动作都完成了</strong><span>等复查提醒到了，直接拍一张同角度照片。</span>";
    group.appendChild(done);
    if (waitingForFollowup && handoff) {
      const guide = document.createElement("div");
      guide.className = "customer-action-handoff";
      [
        ["现在", handoff.idleAdvice],
        ["回来", `${handoff.when}，${handoff.photo}`],
        ["判断", handoff.success]
      ].forEach(([label, value]) => {
        const item = document.createElement("div");
        item.innerHTML = `<span>${label}</span><strong>${value}</strong>`;
        guide.appendChild(item);
      });
      group.appendChild(guide);
    }
    taskList.appendChild(group);
    return;
  }

  const row = document.createElement("div");
  row.className = "task-item customer-action primary-action";

  const content = document.createElement("span");
  content.textContent = current.text;

  const action = document.createElement("button");
  action.type = "button";
  action.className = "mini-button";
  action.textContent = "我已完成";
  action.addEventListener("click", () => {
    const record = setTaskCompletion(current.id, current.text, true);
    refreshAfterCustomerAction(state, findings, current.text, record);
  });

  row.appendChild(content);
  row.appendChild(action);
  group.appendChild(row);

  const queue = document.createElement("div");
  queue.className = "customer-action-queue";
  const remainingText = pending.length > 1 ? "完成后再给下一步" : "完成后等待复查提醒";
  queue.innerHTML = `<span>${current.groupLabel}</span><strong>${remainingText}</strong><em>${completed ? "已记录进度" : "只做这一步"}</em>`;
  group.appendChild(queue);
  taskList.appendChild(group);
}

function assistantAdviceSignature(state, findings) {
  return JSON.stringify({
    crop: state.crop,
    stage: state.stage,
    medium: state.medium,
    concern: smartConcern.value,
    topFinding: findings[0]?.title || "",
    pathology: latestMatchedPathology.slice(0, 3).map((item) => item.id),
    vision: (latestVisionResult?.labels || []).map((item) => item.label).sort(),
    photoTypes: Array.from(capturedPhotoTypes).sort()
  });
}

function assistantDiagnosisRequestBody(state, findings) {
  return {
    crop: cropNames[state.crop],
    cropKey: state.crop,
    stage: document.querySelector("#stage").selectedOptions[0].textContent,
    stageKey: state.stage,
    medium: mediumNames[state.medium],
    mediumKey: state.medium,
    concern: smartConcern.value,
    findings,
    pathologyMatches: latestMatchedPathology,
    knowledgePathways: latestMatchedPathways,
    vision: latestVisionResult,
    photoQuality: {
      gate: latestPhotoQualityGate,
      required: requiredPhotoTypes(state),
      captured: Array.from(capturedPhotoTypes),
      signals: photoSignals
    },
    notes: state.notes
  };
}

async function refreshAssistantAdvice(state, findings) {
  const signature = assistantAdviceSignature(state, findings);
  if (signature === latestAssistantAdviceSignature) return;
  latestAssistantAdviceSignature = signature;
  latestAssistantAdvice = null;
  try {
    const response = await fetch("/api/assistant/diagnosis", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(assistantDiagnosisRequestBody(state, findings))
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const advice = await response.json();
    if (latestAssistantAdviceSignature !== signature) return;
    latestAssistantAdvice = advice;
    if (latestState && latestFindings.length && reportOutput) {
      reportOutput.value = buildReport(latestState, latestFindings, latestMatchedPathways);
    }
  } catch {
    if (latestAssistantAdviceSignature === signature) latestAssistantAdvice = null;
  }
}

function valueOrDash(value, unit = "") {
  return value === null || value === undefined || value === "" ? "-" : `${value}${unit}`;
}

function defaultCaseName(state = getFormState()) {
  return `${cropNames[state.crop]} · ${currentDevice(state).name}`;
}

function createCaseState(state = getFormState()) {
  const id = crypto.randomUUID ? crypto.randomUUID() : `case-${Date.now()}`;
  return {
    id,
    name: defaultCaseName(state),
    cropKey: state.crop,
    deviceKey: state.growDevice,
    createdAt: new Date().toISOString()
  };
}

function getActiveCase(state = getFormState()) {
  try {
    const saved = JSON.parse(localStorage.getItem(activeCaseKey) || "null");
    if (saved?.id) return { ...saved, name: saved.name || defaultCaseName(state) };
  } catch {
    // Fall through and create a fresh case.
  }
  const next = createCaseState(state);
  localStorage.setItem(activeCaseKey, JSON.stringify(next));
  return next;
}

function setActiveCase(caseState) {
  localStorage.setItem(activeCaseKey, JSON.stringify(caseState));
}

function renderActiveCase(state = getFormState()) {
  if (!activeCaseCard) return;
  const active = getActiveCase(state);
  activeCaseCard.innerHTML = `
    <div>
      <span>当前病例</span>
      <strong>${active.name}</strong>
      <em>${active.id}</em>
    </div>
    <div>
      <span>归档方式</span>
      <strong>诊断、处方、复查连续追踪</strong>
      <em>保存报告时自动写入此病例</em>
    </div>
  `;
}

function buildReport(state, findings, matchedPathways = []) {
  const xponge = xpongeAreaLiters(state);
  const device = currentDevice(state);
  const fit = device.cropFit[state.crop] || "caution";
  const devicePlan = buildDeviceCropPlan(state);
  const confidenceDecision = diagnosisConfidenceDecision(state, findings);
  const route = diagnosisRoute(state);
  const primaryRouteAction = routePrimaryAction(state, findings);
  const tasks = flattenTasks(buildTasks(state, findings));
  const photos = buildPhotoPlan(state);
  const followups = buildFollowupPlan(state);
  const logs = getLogs();

  const lines = [
    "# FiveCrop 诊断报告",
    "",
    `作物：${cropNames[state.crop]}`,
    `阶段：${document.querySelector("#stage").selectedOptions[0].textContent}`,
    `介质：${mediumNames[state.medium]}`,
    `设备/场景：${device.name}（${deviceFitLabel(fit)}）`,
    `照片类型：${photoTypeName(state.photoType)}`,
    latestPhotoTypeDetection
      ? `自动照片类型：${photoTypeLabel(latestPhotoTypeDetection.type)}（${Math.round(latestPhotoTypeDetection.confidence * 100)}%）`
      : "自动照片类型：未识别",
    route
      ? `诊断路径：${route.title}，${route.focus}`
      : "诊断路径：未分流",
    primaryRouteAction
      ? `路径第一动作：${primaryRouteAction}`
      : "路径第一动作：未生成",
    "",
    "## 关键读数",
    `- 根区湿度：${valueOrDash(state.sensorMoisture, "%")}`,
    `- 光照：${valueOrDash(state.lightHours, "h/天")}`,
    `- 温度：${valueOrDash(state.temperature, "°C")}`,
    `- 空气湿度：${valueOrDash(state.humidity, "%")}`,
    `- EC：${valueOrDash(state.ec)}`,
    `- pH：${valueOrDash(state.ph)}`,
    `- 储液量：${valueOrDash(state.reservoir, "L")}`
  ];

  if (xponge) {
    lines.push(`- Xponge：${xponge.thickness}cm，${xponge.length}x${xponge.width}cm，约 ${xponge.volumeLiters.toFixed(1)}L / ${xponge.area}cm²`);
  }
  lines.push(`- 设备默认动作：${device.automation.join("、")}`);
  lines.push(`- 设备风险：${device.risks.join("；")}`);

  lines.push("", "## 首批种植方案");
  lines.push(`- 建议株数：${devicePlan.plantCount}`);
  lines.push(`- 第一张照片：${photoTypeLabel(devicePlan.firstPhoto)}`);
  lines.push(`- 第一动作：${devicePlan.firstAction}`);
  lines.push(`- 复查时间：${devicePlan.followup}`);
  devicePlan.warnings.forEach((warning) => lines.push(`- 风险提醒：${warning}`));

  lines.push("", "## 照片质检");
  lines.push(`- 诊断可信度：${confidenceScore()}%`);
  if (latestPhotoQualityGate) {
    lines.push(`- 拍照质检：${latestPhotoQualityGate.state} / ${latestPhotoQualityGate.score}% / ${latestPhotoQualityGate.message}`);
    lines.push(`- 照片参数：${latestPhotoQualityGate.dimensions}，亮度 ${latestPhotoQualityGate.brightness ?? "-"}，细节 ${latestPhotoQualityGate.contrast ?? "-"}`);
  }
  lines.push(`- 可信度分层：${confidenceDecision.status} / ${confidenceDecision.title}`);
  lines.push(`- 分层原因：${confidenceDecision.reason}`);
  lines.push(`- 分层下一步：${confidenceDecision.next}`);
  lines.push(`- AI 管线：${aiProviderLabel()}；字段已预留为 ${buildAiPipelineSnapshot(state).version}`);
  if (latestVisionResult) {
    lines.push(`- 视觉识别：${latestVisionResult.provider || "unknown"}，置信度 ${Math.round((latestVisionResult.confidence || 0) * 100)}%`);
    if (latestVisionResult.labels?.length) {
      lines.push(`- 视觉标签：${latestVisionResult.labels.map((item) => `${item.label} ${Math.round((item.confidence || 0) * 100)}%`).join("；")}`);
    }
    if (latestVisionResult.nextAction) {
      lines.push(`- AI 下一步：${latestVisionResult.nextAction}`);
    }
  }
  requiredPhotoTypes(state).forEach((type) => {
    lines.push(`- ${photoTypeLabel(type)}：${capturedPhotoTypes.has(type) ? "已获得" : "缺失"}`);
  });
  evaluatePhotoQuality().forEach((item) => lines.push(`- ${item}`));

  lines.push("", "## 最可能原因");
  findings.forEach((finding, index) => {
    lines.push(`${index + 1}. ${finding.title}（${severityLabel(finding.severity)}）`);
    lines.push(`   - ${finding.why}`);
  });

  if (matchedPathways.length) {
    lines.push("", "## 知识图谱命中");
    matchedPathways.forEach((pathway, index) => {
      lines.push(`${index + 1}. ${pathway.id} / ${pathway.cropName} / ${pathway.stageName} / ${pathway.confidence}%`);
      lines.push(`   - 用户问题：${pathway.userProblem}`);
      lines.push(`   - 命中原因：${pathway.reasons.join("；")}`);
      lines.push(`   - 复查：${pathway.followup.when}，拍 ${pathway.followup.photo}，成功标准：${pathway.followup.success}`);
    });
  }

  if (latestMatchedPathology.length) {
    lines.push("", "## 病理候选");
    latestMatchedPathology.slice(0, 4).forEach((item, index) => {
      lines.push(`${index + 1}. ${item.id} / ${item.title} / ${item.confidence}%`);
      lines.push(`   - 证据：${item.evidence.join("；")}`);
      lines.push(`   - 排除项：${item.differentials.join("；")}`);
      lines.push(`   - 缺失信息：${item.missingInfo.join("；")}`);
      lines.push(`   - 命中原因：${item.reasons.join("；")}`);
    });
  }

  if (latestAssistantAdvice) {
    lines.push("", "## 辅助大模型复核");
    lines.push(`- Provider：${latestAssistantAdvice.provider} / ${latestAssistantAdvice.model}`);
    lines.push(`- 摘要：${latestAssistantAdvice.summary}`);
    lines.push(`- 可信度：${Math.round((latestAssistantAdvice.confidence || 0) * 100)}%`);
    if (latestAssistantAdvice.evidence?.length) lines.push(`- 证据：${latestAssistantAdvice.evidence.join("；")}`);
    if (latestAssistantAdvice.differentials?.length) lines.push(`- 排除项：${latestAssistantAdvice.differentials.join("；")}`);
    if (latestAssistantAdvice.missingInfo?.length) lines.push(`- 缺失信息：${latestAssistantAdvice.missingInfo.join("；")}`);
    lines.push(`- 下一步：${latestAssistantAdvice.nextAction}`);
    lines.push(`- 下一张照片：${latestAssistantAdvice.nextPhoto}`);
    if (latestAssistantAdvice.fallbackReason) lines.push(`- fallback：${latestAssistantAdvice.fallbackReason}`);
  }

  lines.push("", "## 下一步处方");
  findings.forEach((finding) => lines.push(`- ${finding.action}`));
  matchedPathways.forEach((pathway) => {
    pathway.prescription.slice(0, 2).forEach((step) => lines.push(`- 图谱处方 ${pathway.id}：${step}`));
  });

  lines.push("", "## 处方任务");
  tasks.forEach((task) => lines.push(`- ${task}`));

  lines.push("", "## 拍照复查");
  photos.forEach((item) => lines.push(`- ${item}`));

  lines.push("", "## 复查判断");
  followups.forEach((item) => lines.push(`- ${item}`));
  const reminderPlan = getReminderPlan();
  if (reminderPlan?.items?.length) {
    lines.push("", "## 复查提醒时间表");
    if (reminderPlan.actionCompletedAt) {
      lines.push(`- 动作完成：${dueLabel(reminderPlan.actionCompletedAt)} / ${reminderPlan.actionCompletedTask || "已完成当前动作"}`);
    }
    if (reminderPlan.actionFollowupReason) {
      lines.push(`- 重算依据：${reminderPlan.actionFollowupReason}`);
    }
    reminderPlan.items.forEach((item) => {
      lines.push(`- ${item.label}（${dueLabel(item.dueAt)}）：${item.task}；拍 ${item.photo}；${item.success ? `成功标准：${item.success}；` : ""}${item.completedAt ? "已完成" : "待复查"}`);
    });
  }

  if (logs.length) {
    lines.push("", "## 最近日志");
    logs.slice(-5).forEach((log) => {
      lines.push(`- ${log.day}：新叶 ${progressText(log.leaf)} / 花果 ${progressText(log.flower)} / 虫藻 ${progressText(log.pest)}${log.notes ? `；${log.notes}` : ""}`);
    });
  }

  if (state.notes) {
    lines.push("", "## 补充描述", state.notes);
  }

  return lines.join("\n");
}

function reportPayload(state, findings) {
  const top = findings[0];
  const device = currentDevice(state);
  const deviceFit = device.cropFit[state.crop] || "caution";
  const confidenceDecision = diagnosisConfidenceDecision(state, findings);
  const activeCase = getActiveCase(state);
  const route = diagnosisRoute(state);
  const primaryRouteAction = routePrimaryAction(state, findings);
  return {
    caseId: activeCase.id,
    caseName: activeCase.name,
    caseCreatedAt: activeCase.createdAt,
    device: device.name,
    deviceKey: state.growDevice,
    deviceFit,
    deviceRisks: device.risks,
    devicePlan: buildDeviceCropPlan(state),
    crop: cropNames[state.crop],
    cropKey: state.crop,
    stage: document.querySelector("#stage").selectedOptions[0].textContent,
    stageKey: state.stage,
    medium: mediumNames[state.medium],
    mediumKey: state.medium,
    topRisk: top.title,
    severity: severityLabel(top.severity),
    sensor: {
      moisture: state.sensorMoisture,
      lightHours: state.lightHours,
      temperature: state.temperature,
      humidity: state.humidity,
      ec: state.ec,
      ph: state.ph
    },
    xponge: xpongeAreaLiters(state),
    symptoms: state.symptoms,
    visuals: state.visuals,
    photoType: state.photoType,
    diagnosisRoute: route,
    primaryRouteAction,
    photoQuality: {
      confidence: confidenceScore(),
      decision: confidenceDecision,
      gate: latestPhotoQualityGate,
      required: requiredPhotoTypes(state),
      captured: Array.from(capturedPhotoTypes),
      messages: evaluatePhotoQuality(),
      signals: photoSignals
    },
    photoTypeDetection: latestPhotoTypeDetection,
    vision: latestVisionResult,
    aiPipeline: updateAiPipelineSnapshot(state, {
      gate: latestPhotoQualityGate,
      detection: latestPhotoTypeDetection,
      vision: latestVisionResult,
      photoType: state.photoType,
      hasImage: photoSignals.width !== null
    }),
    annotation: currentAnnotationRecord(),
    findings,
    customerActions: buildCustomerActions(state, findings, latestMatchedPathways),
    knowledgePathways: latestMatchedPathways,
    pathologyMatches: latestMatchedPathology,
    assistantAdvice: latestAssistantAdvice,
    tasks: flattenTasks(buildTasks(state, findings)),
    photoPlan: buildPhotoPlan(state),
    followupPlan: buildFollowupPlan(state),
    reminderPlan: getReminderPlan(),
    logs: getLogs(),
    notes: state.notes,
    report: buildReport(state, findings, latestMatchedPathways)
  };
}

function followupOutcome(log) {
  if (log?.routeAssessment) {
    const assessment = log.routeAssessment;
    return {
      label: assessment.title,
      severity: assessment.state === "worse" ? "高优先级" : assessment.state === "better" ? "观察" : "中优先级",
      next: assessment.next
    };
  }

  const values = [log.leaf, log.flower, log.pest];
  const better = values.filter((item) => item === "better").length;
  const worse = values.filter((item) => item === "worse").length;

  if (worse > better) {
    return {
      label: "有加重迹象",
      severity: "高优先级",
      next: "暂停叠加新动作，回到最高风险原因重新诊断。"
    };
  }

  if (better > worse) {
    return {
      label: "正在改善",
      severity: "观察",
      next: "保持当前处方，不要频繁改参数，按下一次提醒复拍。"
    };
  }

  return {
    label: "变化不明显",
    severity: "中优先级",
    next: "继续同角度复拍，并确认处方动作是否已经完成。"
  };
}

function ratioPercent(value) {
  return Number.isFinite(Number(value)) ? Math.round(Number(value) * 100) : null;
}

function signalDelta(current, previous, key) {
  const now = ratioPercent(current?.[key]);
  const before = ratioPercent(previous?.[key]);
  if (now === null || before === null) return null;
  return now - before;
}

function deltaPhrase(label, delta, betterWhen = "down") {
  if (delta === null) return null;
  if (Math.abs(delta) < 3) return `${label}基本稳定`;
  const better = betterWhen === "down" ? delta < 0 : delta > 0;
  return `${label}${better ? "改善" : "变差"} ${Math.abs(delta)}pp`;
}

function followupAssessmentRouteKey(state, log = {}) {
  const plan = getReminderPlan();
  const text = `${plan?.actionCompletedTask || ""} ${log.photoType || ""} ${requestedPhotoType || ""}`;
  return completedActionRouteKey(state, text) || diagnosisRoute(state)?.key || activeDiagnosisPhotoType(state) || "plant";
}

function routeFollowupAssessment(state, log, previousLog = null, comparison = null) {
  const routeKey = followupAssessmentRouteKey(state, log);
  const current = log.autoSignals || {};
  const previous = previousLog?.autoSignals || getBaselinePhotoSignals(log.photoType || requestedPhotoType)?.signals || null;
  const yellowDelta = signalDelta(current, previous, "yellowRatio");
  const greenDelta = signalDelta(current, previous, "greenRatio");
  const darkDelta = signalDelta(current, previous, "darkRatio");
  const evidence = [
    deltaPhrase("黄叶信号", yellowDelta, "down"),
    deltaPhrase(routeKey === "root" ? "藻霉/绿斑信号" : "绿色信号", greenDelta, routeKey === "root" ? "down" : "up"),
    deltaPhrase("暗部/干枯信号", darkDelta, "down"),
    comparison?.trend === "improved" ? "前后对比模型判断为改善" : null,
    comparison?.trend === "worse" ? "前后对比模型判断为变差" : null
  ].filter(Boolean);

  const manualBetter = [log.leaf, log.flower, log.pest].filter((item) => item === "better").length;
  const manualWorse = [log.leaf, log.flower, log.pest].filter((item) => item === "worse").length;
  let stateKey = "same";
  if (comparison?.trend === "improved" || manualBetter > manualWorse) stateKey = "better";
  if (comparison?.trend === "worse" || manualWorse > manualBetter) stateKey = "worse";

  const signalScore = [
    yellowDelta !== null ? (yellowDelta < -3 ? 1 : yellowDelta > 3 ? -1 : 0) : 0,
    darkDelta !== null ? (darkDelta < -3 ? 1 : darkDelta > 3 ? -1 : 0) : 0,
    greenDelta !== null
      ? routeKey === "root"
        ? (greenDelta < -3 ? 1 : greenDelta > 3 ? -1 : 0)
        : (greenDelta > 3 ? 1 : greenDelta < -3 ? -1 : 0)
      : 0
  ].reduce((sum, item) => sum + item, 0);
  if (stateKey === "same" && signalScore >= 2) stateKey = "better";
  if (stateKey === "same" && signalScore <= -2) stateKey = "worse";

  const copy = {
    flower: {
      better: ["坐果趋势在改善", "落花减少或小果保留信号更好。继续当前授粉/控温动作，不要频繁换肥。", "保持当前方案，下一次继续拍同一花序和小果。"],
      worse: ["坐果趋势变差", "落花、暗部或花果压力信号变重。先回看温度、补光和根区波动。", "暂停叠加新动作，先补拍同一花序和灯下温度/根区状态。"],
      same: ["坐果趋势还不明显", "花果变化通常需要 3-7 天确认，现在信号还不够分明。", "继续同一时间拍同一花序，不要同时改水肥灯。"]
    },
    root: {
      better: ["根区压力在下降", "藻霉/白毛或暗部信号没有继续扩散，干湿边界更稳定。", "保持遮光、通风和控水节奏，48 小时后再拍同一根区。"],
      worse: ["根区压力加重", "藻霉/暗部或潮湿压力信号变重。", "继续停水或降低水位，补拍根区边界和植株基部。"],
      same: ["根区变化还不明显", "停水、遮光或通风后的变化还需要继续观察。", "保持当前根区动作，下一次同角度拍 Xponge/基质边界。"]
    },
    pest: {
      better: ["虫害扩散被压住", "虫点、叶背或黄粘板信号没有继续增加。", "继续隔离，24-48 小时后复拍叶背和黄粘板。"],
      worse: ["虫害仍在扩散", "虫量或叶背异常信号变重。", "保持隔离，补拍叶背特写；必要时升级安全处理方案。"],
      same: ["虫害变化还不明显", "虫害处理通常需要连续 24-48 小时复查。", "继续隔离，下一次拍同一叶背和黄粘板。"]
    },
    leaf: {
      better: ["叶片状态在恢复", "黄叶、暗部或卷叶相关信号减弱，新叶方向更好。", "保持当前水光策略，3-7 天后拍同一片新叶和老叶。"],
      worse: ["叶片状态变差", "黄叶、暗部或水分压力信号变重。", "先别继续加肥，回到水分、光照和 EC/pH 逐项复核。"],
      same: ["叶片变化还不明显", "叶片恢复通常比根区动作慢，当前信号接近持平。", "继续同一背景拍新叶和老叶，避免一次改太多变量。"]
    },
    plant: {
      better: ["整株长势更稳", "绿色、暗部或整体压力信号朝好方向变化。", "保持灯距和浇水节奏，7 天后拍整株侧面。"],
      worse: ["整株压力变重", "整体暗部/黄叶或长势压力信号变重。", "先复核灯距、温度和浇水节奏，不要叠加新变量。"],
      same: ["整株变化还不明显", "株型和节间变化需要更长时间确认。", "继续保持当前动作，7 天后同角度复拍。"]
    }
  };

  const routeCopy = copy[routeKey] || copy.plant;
  const [title, message, next] = routeCopy[stateKey];
  return {
    routeKey,
    routeTitle: diagnosisRoute(state)?.title || photoTypeLabel(routeKey),
    state: stateKey,
    title,
    message,
    next,
    evidence: evidence.length ? evidence.slice(0, 4) : ["当前照片信号接近持平，建议继续同角度复拍。"]
  };
}

function followupSignalConfidence(log) {
  const signals = log.autoSignals || {};
  const signalCount = ["greenRatio", "yellowRatio", "darkRatio", "brightness", "contrast"]
    .filter((key) => Number.isFinite(Number(signals[key]))).length;
  return Math.min(92, 58 + signalCount * 6 + (log.autoSaved ? 8 : 0));
}

function buildFollowupReport(log, state, findings) {
  const outcome = followupOutcome(log);
  const activeCase = getActiveCase(state);
  const signals = log.autoSignals || {};
  const pct = (value) => Number.isFinite(Number(value)) ? `${Math.round(Number(value) * 100)}%` : "-";
  const top = findings[0] || {};
  const routeAssessment = log.routeAssessment || null;
  const routeLines = routeAssessment ? [
    `路径判断：${routeAssessment.routeTitle} / ${routeAssessment.title}`,
    `判断依据：${routeAssessment.evidence.join("；")}`,
    ""
  ] : [];

  return [
    "# 复查记录",
    "",
    `病例：${activeCase.name}`,
    `作物：${cropNames[state.crop]} / ${currentDevice(state).name}`,
    `复查节点：${log.day}`,
    `记录来源：${log.autoSaved ? "客户上传复查照自动保存" : "内部手动保存"}`,
    `复查判断：${outcome.label}`,
    `下一步：${outcome.next}`,
    "",
    ...routeLines,
    "## 复查信号",
    `- 新叶：${progressText(log.leaf)}`,
    `- 花果：${progressText(log.flower)}`,
    `- 虫害/藻霉：${progressText(log.pest)}`,
    `- 黄度：${pct(signals.yellowRatio)} / 绿度：${pct(signals.greenRatio)} / 暗部：${pct(signals.darkRatio)}`,
    log.notes ? `- 备注：${log.notes}` : "- 备注：无",
    "",
    "## 对应原诊断",
    `- 当前最高风险：${top.title || "未识别"}`,
    `- 当前建议：${top.action || outcome.next}`
  ].join("\n");
}

function followupReportPayload(log, state, findings, options = {}) {
  const base = reportPayload(state, findings);
  const outcome = followupOutcome(log);
  const confidence = Math.max(base.photoQuality?.confidence || 0, followupSignalConfidence(log));

  return {
    ...base,
    eventType: "followup",
    followupLogId: log.id,
    followupSource: log.source,
    followupAutoSaved: log.autoSaved,
    routeAssessment: log.routeAssessment || null,
    createdAt: log.at,
    topRisk: `复查记录：${outcome.label}`,
    severity: outcome.severity,
    photoType: options.photoType || requestedPhotoType || base.photoType,
    photoQuality: {
      ...base.photoQuality,
      confidence,
      decision: {
        ...(base.photoQuality?.decision || {}),
        status: log.autoSaved ? "自动复查" : "人工复查",
        title: outcome.label,
        next: outcome.next,
        reason: log.routeAssessment?.message || base.photoQuality?.decision?.reason
      },
      signals: log.autoSignals || base.photoQuality?.signals
    },
    logs: [log],
    notes: log.notes,
    report: buildFollowupReport(log, state, findings)
  };
}

async function syncFollowupCaseRecord(log, state, findings, options = {}) {
  if (!log) return null;
  try {
    const response = await fetch("/api/reports", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(followupReportPayload(log, state, findings, options))
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const saved = await response.json();
    if (caseStatus) caseStatus.textContent = `复查记录已归档到后台病例：${saved.id}`;
    await loadReports();
    await loadCases();
    await refreshCustomerCaseTimeline({ force: true, silent: true });
    await syncCaseNotifications({ silent: true });
    await loadNotifications();
    return saved;
  } catch {
    if (caseStatus) caseStatus.textContent = "复查已保存在本机，但暂时没有写入后台病例。";
    return null;
  }
}

async function loadReports() {
  try {
    const params = new URLSearchParams();
    if (dbSearch.value.trim()) params.set("q", dbSearch.value.trim());
    if (dbCropFilter.value) params.set("crop", dbCropFilter.value);
    if (dbMediumFilter.value) params.set("medium", dbMediumFilter.value);
    const query = params.toString();
    const response = await fetch(`/api/reports${query ? `?${query}` : ""}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const reports = await response.json();
    dbStatus.textContent = `当前显示 ${reports.length} 份诊断报告。`;
    dbList.innerHTML = "";

    if (!reports.length) {
      const empty = document.createElement("li");
      empty.textContent = "暂无入库报告。";
      dbList.appendChild(empty);
      return;
    }

    reports.slice(0, 6).forEach((report) => {
      const li = document.createElement("li");
      const time = new Date(report.createdAt).toLocaleString("zh-CN");
      const meta = document.createElement("div");
      const eventLabel = report.eventType === "followup" ? "复查" : "诊断";
      meta.innerHTML = `<strong>${eventLabel} · ${report.crop} / ${report.medium}</strong><span>${time} · ${report.topRisk} · ${report.severity}</span>`;

      const actions = document.createElement("div");
      actions.className = "db-actions";

      const view = document.createElement("button");
      view.type = "button";
      view.className = "mini-button";
      view.textContent = "查看";
      view.addEventListener("click", () => viewReport(report.id));

      const load = document.createElement("button");
      load.type = "button";
      load.className = "mini-button";
      load.textContent = "载入";
      load.addEventListener("click", () => loadReportIntoForm(report.id));

      actions.appendChild(view);
      actions.appendChild(load);
      li.appendChild(meta);
      li.appendChild(actions);
      dbList.appendChild(li);
    });
  } catch {
    dbStatus.textContent = "后台数据库暂不可用，请确认本地服务由 server.mjs 启动。";
  }
}

function trendClassName(trend) {
  const state = trend?.state || "baseline";
  if (["improving", "worsening", "stable", "uncertain", "baseline"].includes(state)) return state;
  return "baseline";
}

function trendDeltaText(trend) {
  if (!trend || trend.state === "baseline") return "等待第二次复查";
  const value = Number(trend.scoreDelta || 0);
  if (value > 0) return `风险下降 ${value}`;
  if (value < 0) return `风险上升 ${Math.abs(value)}`;
  return "风险持平";
}

function trendEvidenceHtml(trend) {
  const evidence = Array.isArray(trend?.evidence) ? trend.evidence.slice(0, 4) : [];
  if (!evidence.length) return "";
  return `<div class="case-trend-evidence">${evidence.map((item) => `<span>${item}</span>`).join("")}</div>`;
}

function formatSigned(value, suffix = "") {
  if (!Number.isFinite(value)) return "-";
  if (value > 0) return `+${value}${suffix}`;
  return `${value}${suffix}`;
}

function percentPoint(value) {
  return Number.isFinite(Number(value)) ? Math.round(Number(value) * 100) : null;
}

function colorMetricDelta(current, previous, key, mode) {
  const now = percentPoint(current?.colorSignals?.[key]);
  const before = percentPoint(previous?.colorSignals?.[key]);
  if (now === null || before === null) return null;
  const delta = now - before;
  const isBetter = mode === "down" ? delta < -2 : delta > 2;
  const isWorse = mode === "down" ? delta > 2 : delta < -2;
  return {
    delta,
    current: now,
    state: isBetter ? "better" : isWorse ? "worse" : "same"
  };
}

function comparisonMetric(label, value, detail, state = "same") {
  return `
    <div class="comparison-metric ${state}">
      <span>${label}</span>
      <strong>${value}</strong>
      <em>${detail}</em>
    </div>
  `;
}

function latestCaseComparison(timeline = []) {
  if (timeline.length < 2) return null;
  const current = timeline[timeline.length - 1];
  const previous = timeline[timeline.length - 2];
  const riskDelta = Number(previous.riskScore || 0) - Number(current.riskScore || 0);
  const confidenceDelta = Number(current.confidence || 0) - Number(previous.confidence || 0);
  const yellow = colorMetricDelta(current, previous, "yellowRatio", "down");
  const green = colorMetricDelta(current, previous, "greenRatio", "up");
  const dark = colorMetricDelta(current, previous, "darkRatio", "down");
  const colorSignals = [yellow, green, dark].filter(Boolean);
  const colorBetter = colorSignals.filter((item) => item.state === "better").length;
  const colorWorse = colorSignals.filter((item) => item.state === "worse").length;
  const betterSignals = Number(current.betterCount || 0) + colorBetter;
  const worseSignals = Number(current.worseCount || 0) + colorWorse;

  let state = "stable";
  let title = "变化不明显";
  let summary = "最新记录和上一条相比变化不大，继续按同角度复拍。";

  if (worseSignals >= 2 || riskDelta <= -8) {
    state = "worse";
    title = "有加重迹象";
    summary = "风险分上升或变差信号较多，建议回到最高风险原因重新诊断。";
  } else if (betterSignals >= 2 || riskDelta >= 8) {
    state = "better";
    title = "正在改善";
    summary = "风险分下降或改善信号更明确，当前处方方向可以继续保持。";
  } else if (Math.abs(confidenceDelta) >= 20 && colorSignals.length < 2) {
    state = "uncertain";
    title = "证据还不稳";
    summary = "可信度变化较大但颜色信号不足，下一次复查要补齐同角度照片。";
  }

  return {
    state,
    title,
    summary,
    current,
    previous,
    riskDelta,
    confidenceDelta,
    yellow,
    green,
    dark,
    betterSignals,
    worseSignals
  };
}

function colorComparisonMetric(label, metric, betterText, worseText) {
  if (!metric) return "";
  const detail = metric.delta === 0
    ? "与上次持平"
    : metric.state === "better"
      ? betterText
      : metric.state === "worse"
        ? worseText
        : "变化较小";
  return comparisonMetric(label, `${metric.current}%`, `${formatSigned(metric.delta, "pp")} · ${detail}`, metric.state);
}

function caseComparisonHtml(timeline = []) {
  const comparison = latestCaseComparison(timeline);
  if (!comparison) {
    return `
      <section class="case-comparison-card stable">
        <div>
          <span>最新对比</span>
          <strong>等待第二次记录</strong>
          <p>保存一次复查后，这里会自动显示前后变化。</p>
        </div>
      </section>
    `;
  }

  const eventLabel = comparison.current.eventType === "followup" ? "复查" : "诊断";
  const riskState = comparison.riskDelta > 0 ? "better" : comparison.riskDelta < 0 ? "worse" : "same";
  const confidenceState = comparison.confidenceDelta > 0 ? "better" : comparison.confidenceDelta < -12 ? "worse" : "same";
  const metrics = [
    comparisonMetric("风险分", String(comparison.current.riskScore ?? "-"), `${formatSigned(comparison.riskDelta)} · 正数代表风险下降`, riskState),
    comparisonMetric("可信度", `${comparison.current.confidence ?? "-"}%`, `${formatSigned(comparison.confidenceDelta, "%")} · 与上一条相比`, confidenceState),
    colorComparisonMetric("黄度", comparison.yellow, "黄叶信号下降", "黄叶信号上升"),
    colorComparisonMetric("绿度", comparison.green, "绿色信号增强", "绿色信号下降"),
    colorComparisonMetric("暗部", comparison.dark, "暗部/阴影减少", "暗部/坏死信号增加")
  ].filter(Boolean).join("");

  return `
    <section class="case-comparison-card ${comparison.state}">
      <div class="comparison-head">
        <div>
          <span>最新对比 · ${eventLabel}</span>
          <strong>${comparison.title}</strong>
          <p>${comparison.summary}</p>
        </div>
        <div class="comparison-signal">
          <span>复查信号</span>
          <strong>${comparison.betterSignals} 好转 / ${comparison.worseSignals} 变差</strong>
        </div>
      </div>
      <div class="comparison-grid">${metrics}</div>
    </section>
  `;
}

function trendReminderText(reminder) {
  if (!reminder) return "等待复查策略";
  if (!reminder.dueAt) return reminder.label || "先建档";
  return `${reminder.label} · ${dueLabel(reminder.dueAt)}`;
}

function trendReminderHtml(reminder) {
  if (!reminder) return "";
  return `
    <div class="case-trend-reminder ${reminder.priority || "normal"}">
      <span>自动提醒</span>
      <strong>${trendReminderText(reminder)}</strong>
      <p>${reminder.task || "按系统建议复查。"} 拍：${reminder.photo || "关键部位照片"}</p>
      <em>${reminder.reason || "系统根据病例趋势自动调整复查时间。"}</em>
    </div>
  `;
}

function routeAssessmentHtml(assessment) {
  if (!assessment) return "";
  const state = assessment.state || "same";
  const evidence = (assessment.evidence || [])
    .slice(0, 3)
    .map((item) => `<span>${item}</span>`)
    .join("");
  return `
    <div class="case-route-assessment ${state}">
      <div>
        <span>复查路径判断</span>
        <strong>${assessment.routeTitle || "复查路径"} · ${assessment.title || "等待判断"}</strong>
        <p>${assessment.message || "系统会根据同角度复查照判断变化方向。"}</p>
      </div>
      ${evidence ? `<div class="case-route-evidence">${evidence}</div>` : ""}
      <em>${assessment.next || "按下一次提醒继续复查。"}</em>
    </div>
  `;
}

async function loadCases() {
  try {
    const params = new URLSearchParams();
    if (dbSearch.value.trim()) params.set("q", dbSearch.value.trim());
    if (dbCropFilter.value) params.set("crop", dbCropFilter.value);
    const query = params.toString();
    const response = await fetch(`/api/cases${query ? `?${query}` : ""}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const cases = await response.json();
    caseStatus.textContent = `当前显示 ${cases.length} 个植物病例。`;
    caseList.innerHTML = "";

    if (!cases.length) {
      caseList.innerHTML = "<div class=\"case-card\"><strong>暂无病例</strong><span>先保存一份诊断报告，系统会自动创建病例。</span></div>";
      return;
    }

    cases.slice(0, 6).forEach((item) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = `case-card ${trendClassName(item.trend)}`;
      card.innerHTML = `
        <strong>${item.name}</strong>
        <span>${item.crop || "-"} / ${item.device || item.medium || "-"} / ${item.reportCount} 次诊断</span>
        <span class="case-trend-pill">${item.trend?.label || "建立基线"} · ${trendDeltaText(item.trend)}</span>
        <span class="case-reminder-pill">复查 ${trendReminderText(item.trend?.reminder)}</span>
        <em>${item.latestDecision || "未分层"} · ${item.latestRisk || "暂无风险"}</em>
      `;
      card.addEventListener("click", () => {
        document.querySelectorAll(".case-card").forEach((node) => node.classList.remove("selected"));
        card.classList.add("selected");
        viewCase(item.id);
      });
      caseList.appendChild(card);
    });
  } catch {
    caseStatus.textContent = "病例接口暂不可用，请确认本地服务由新版 server.mjs 启动。";
  }
}

function renderCaseTimeline(item) {
  if (!caseTimeline) return;
  caseTimeline.innerHTML = "";
  if (!item?.timeline?.length) {
    caseTimeline.innerHTML = "<div class=\"case-empty-timeline\">暂无时间线。保存诊断报告后会自动生成。</div>";
    return;
  }

  const trend = item.trend || {};
  const trendCard = document.createElement("section");
  trendCard.className = `case-trend-card ${trendClassName(trend)}`;
  trendCard.innerHTML = `
    <div>
      <span>病例趋势</span>
      <strong>${trend.label || "建立基线"}</strong>
      <p>${trend.summary || "等待下一次复查后判断趋势。"}</p>
    </div>
    <div class="case-trend-next">
      <span>${trendDeltaText(trend)}</span>
      <strong>${trend.next || "按提醒节点复查"}</strong>
    </div>
    ${trendReminderHtml(trend.reminder)}
    ${trendEvidenceHtml(trend)}
  `;
  caseTimeline.appendChild(trendCard);
  caseTimeline.insertAdjacentHTML("beforeend", caseComparisonHtml(item.timeline));

  item.timeline.slice().reverse().forEach((entry, index) => {
    const node = document.createElement("article");
    node.className = "case-timeline-item";
    const date = new Date(entry.createdAt).toLocaleString("zh-CN");
    const confidence = entry.confidence === null || entry.confidence === undefined ? "-" : `${entry.confidence}%`;
    const eventLabel = entry.eventType === "followup" ? "复查记录" : "诊断报告";
    node.innerHTML = `
      <div class="case-timeline-marker">${item.timeline.length - index}</div>
      <div class="case-timeline-content">
        <div class="case-timeline-head">
          <strong>${eventLabel}：${entry.topRisk || "诊断记录"}</strong>
          <span>${date}</span>
        </div>
        <div class="case-timeline-metrics">
          <span>${eventLabel}</span>
          <span>${entry.decision || "未分层"}</span>
          <span>可信度 ${confidence}</span>
          <span>风险分 ${entry.riskScore ?? "-"}</span>
          <span>复查 ${entry.followupCount || 0}</span>
        </div>
        ${routeAssessmentHtml(entry.routeAssessment)}
        <p>${entry.next || "按处方任务和复查节点继续追踪。"}</p>
        <button type="button" class="mini-button" data-report-id="${entry.id}">查看报告</button>
      </div>
    `;
    node.querySelector("button").addEventListener("click", () => viewReport(entry.id));
    caseTimeline.appendChild(node);
  });
}

async function viewCase(id) {
  try {
    const response = await fetch(`/api/cases/${encodeURIComponent(id)}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const item = await response.json();
    const comparison = latestCaseComparison(item.timeline);
    const lines = [
      `# ${item.name}`,
      "",
      `病例 ID：${item.id}`,
      `作物：${item.crop || "-"} / 设备：${item.device || "-"} / 介质：${item.medium || "-"}`,
      `创建：${item.createdAt || "-"}`,
      `更新：${item.updatedAt || "-"}`,
      `诊断次数：${item.reportCount}`,
      `最新风险：${item.latestRisk || "-"}`,
      `最新可信分层：${item.latestDecision || "-"}`,
      `待复查节点：${item.pendingFollowups}`,
      `病例趋势：${item.trend?.label || "-"}`,
      `趋势判断：${item.trend?.summary || "-"}`,
      `建议动作：${item.trend?.next || "-"}`,
      `自动提醒：${trendReminderText(item.trend?.reminder)}`,
      `提醒任务：${item.trend?.reminder?.task || "-"}`,
      `复查照片：${item.trend?.reminder?.photo || "-"}`,
      `最新对比：${comparison ? `${comparison.title} / 风险变化 ${formatSigned(comparison.riskDelta)} / 可信度变化 ${formatSigned(comparison.confidenceDelta, "%")}` : "等待第二次记录"}`,
      "",
      "## 趋势依据",
      ...(item.trend?.evidence || []).map((entry) => `- ${entry}`),
      "",
      "## 时间线",
      ...item.timeline.map((entry, index) =>
        `${index + 1}. ${entry.createdAt} / ${entry.eventType === "followup" ? "复查" : "诊断"} / ${entry.topRisk || "-"} / ${entry.decision || "-"} / ${entry.confidence ?? "-"}% / 风险分 ${entry.riskScore ?? "-"} / 复查 ${entry.followupCount}${entry.routeAssessment ? ` / 路径判断：${entry.routeAssessment.routeTitle} · ${entry.routeAssessment.title} / 下一步：${entry.routeAssessment.next}` : ""}`
      )
    ];
    caseDetail.value = lines.join("\n");
    renderCaseTimeline(item);
  } catch {
    caseDetail.value = "读取病例详情失败。";
    if (caseTimeline) caseTimeline.innerHTML = "<div class=\"case-empty-timeline\">读取病例详情失败。</div>";
  }
}

function defaultNotificationChannelConfig() {
  return {
    channels: ["in-app"],
    targets: { email: "", sms: "", wechat: "" }
  };
}

function getNotificationChannelConfig() {
  try {
    const saved = JSON.parse(localStorage.getItem(notificationChannelKey) || "null");
    if (saved?.channels?.length) {
      return {
        channels: saved.channels,
        targets: { email: "", sms: "", wechat: "", ...(saved.targets || {}) }
      };
    }
  } catch {
    // Fall back to in-app notification.
  }
  return defaultNotificationChannelConfig();
}

function selectedNotificationChannels() {
  const channels = notificationChannelInputs.filter((input) => input.checked).map((input) => input.value);
  return channels.length ? channels : ["in-app"];
}

function notificationChannelTargets() {
  return {
    email: notificationEmailTarget?.value.trim() || "",
    sms: notificationSmsTarget?.value.trim() || "",
    wechat: notificationWechatTarget?.value.trim() || ""
  };
}

function applyNotificationChannelConfig() {
  const config = getNotificationChannelConfig();
  notificationChannelInputs.forEach((input) => {
    input.checked = config.channels.includes(input.value);
  });
  if (notificationEmailTarget) notificationEmailTarget.value = config.targets.email || "";
  if (notificationSmsTarget) notificationSmsTarget.value = config.targets.sms || "";
  if (notificationWechatTarget) notificationWechatTarget.value = config.targets.wechat || "";
}

function saveNotificationChannelConfig(options = {}) {
  const config = {
    channels: selectedNotificationChannels(),
    targets: notificationChannelTargets()
  };
  localStorage.setItem(notificationChannelKey, JSON.stringify(config));
  if (!options.silent && notificationStatus) {
    notificationStatus.textContent = `已保存通知渠道：${config.channels.join(" / ")}。`;
  }
  return config;
}

function channelLabel(channel) {
  return {
    "in-app": "站内",
    email: "邮件",
    sms: "短信",
    wechat: "微信"
  }[channel] || channel;
}

function channelStatusText(status) {
  return {
    queued: "排队",
    scheduled: "待发送",
    sent: "已发送",
    completed: "已完成",
    failed: "失败"
  }[status] || status || "排队";
}

function channelStatusHtml(job) {
  const statuses = job.channelStatuses?.length
    ? job.channelStatuses
    : (job.channels || ["in-app"]).map((channel) => ({ channel, status: "queued" }));
  return `<div class="channel-status-list">${statuses.map((item) =>
    `<span class="${item.status || "queued"}">${channelLabel(item.channel)}：${channelStatusText(item.status)}</span>`
  ).join("")}</div>`;
}

function failureSuggestionHtml(job) {
  const suggestions = job.failureSuggestions || (job.channelStatuses || [])
    .filter((item) => item.status === "failed")
    .map((item) => ({
      title: `${channelLabel(item.channel)}失败`,
      action: item.note || "补齐渠道目标后重试。"
    }));
  if (!suggestions.length) return "";
  return `<div class="failure-suggestion-list">${suggestions.map((item) =>
    `<span><strong>${item.title}</strong>${item.action}</span>`
  ).join("")}</div>`;
}

function notificationTemplateHtml(job) {
  const template = job.template;
  if (!template) return "";
  const channels = Object.entries(template.channelMessages || {}).slice(0, 3);
  return `
    <div class="notification-template-preview">
      <strong>${template.title || "通知模板"}</strong>
      <span>${template.body || ""}</span>
      <em>动作：${template.action || job.task || "-"}；照片：${template.photo || job.photo || "-"}</em>
      ${channels.length ? `<div>${channels.map(([channel, text]) =>
        `<small>${channelLabel(channel)}：${String(text).replace(/\n/g, " / ")}</small>`
      ).join("")}</div>` : ""}
    </div>
  `;
}

function notificationState(job) {
  if (job.status === "completed" || job.completedAt) return "done";
  if (job.status && job.status !== "scheduled") return job.status;
  if (job.dueAt && Date.parse(job.dueAt) <= Date.now()) return "due";
  return "scheduled";
}

function notificationStateText(job) {
  const state = notificationState(job);
  if (state === "done") return "已完成";
  if (state === "due") return "到期";
  if (state === "sent") return "已发送";
  if (state === "partial") return "部分成功";
  if (state === "failed") return "失败";
  if (state === "scheduled") return "待发送";
  return job.status || "待处理";
}

function notificationMetric(label, value) {
  return `<div><span>${label}</span><strong>${value}</strong></div>`;
}

function integrationStatusLabel(status) {
  const labels = {
    connected: "已接入",
    partial: "部分接入",
    placeholder: "本地占位",
    "client-detected": "前端检测"
  };
  return labels[status] || "待推进";
}

function integrationStatusClass(status) {
  if (status === "connected") return "connected";
  if (status === "partial" || status === "client-detected") return "partial";
  return "placeholder";
}

async function loadIntegrationStatus() {
  if (!integrationGrid || !integrationStatus) return;
  integrationStatus.textContent = "正在检查四个关键短板的接入状态...";
  try {
    const response = await fetch("/api/integrations/status");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    integrationGrid.innerHTML = "";
    payload.items.forEach((item) => {
      const card = document.createElement("div");
      card.className = `integration-card ${integrationStatusClass(item.status)}`;
      const envEntries = Object.entries(item.env || {});
      card.innerHTML = `
        <span>${integrationStatusLabel(item.status)}</span>
        <strong>${item.title}</strong>
        <p>${item.summary}</p>
        <em>${item.next}</em>
        <div class="integration-env-list"></div>
      `;
      const envList = card.querySelector(".integration-env-list");
      const rows = envEntries.length
        ? envEntries.map(([key, value]) => ({ key, value }))
        : (item.requiredEnv || []).map((key) => ({ key, value: false }));
      rows.slice(0, 5).forEach(({ key, value }) => {
        const chip = document.createElement("small");
        chip.dataset.ready = String(Boolean(value));
        chip.textContent = `${key}: ${value ? "ready" : "missing"}`;
        envList.appendChild(chip);
      });
      integrationGrid.appendChild(card);
    });
    const connected = payload.items.filter((item) => item.status === "connected").length;
    integrationStatus.textContent = `四大短板推进：${connected}/${payload.items.length} 已真实接入；其余为可配置占位或前端能力。`;
  } catch {
    integrationStatus.textContent = "集成状态接口暂不可用，请确认本地服务已更新。";
  }
}

async function completeNotification(id) {
  const response = await fetch(`/api/notifications/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ status: "completed", completedAt: new Date().toISOString() })
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  await loadNotifications();
}

async function simulateNotificationSend(id) {
  const response = await fetch(`/api/notifications/${encodeURIComponent(id)}/simulate-send`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({})
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  await loadNotifications();
}

async function retryFailedNotification(id) {
  const channelConfig = saveNotificationChannelConfig({ silent: true });
  const response = await fetch(`/api/notifications/${encodeURIComponent(id)}/retry-failed`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ channelTargets: channelConfig.targets })
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  await loadNotifications();
}

async function loadNotifications() {
  try {
    const response = await fetch("/api/notifications");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const jobs = await response.json();
    const due = jobs.filter((job) => notificationState(job) === "due").length;
    const scheduled = jobs.filter((job) => notificationState(job) === "scheduled").length;
    const done = jobs.filter((job) => notificationState(job) === "done").length;
    const caseTrend = jobs.filter((job) => job.source === "case-trend").length;
    const enabledChannels = getNotificationChannelConfig().channels.map(channelLabel).join("/");

    notificationStatus.textContent = `当前通知 ${jobs.length} 条，病例趋势提醒 ${caseTrend} 条。`;
    notificationMetrics.innerHTML = [
      notificationMetric("到期", due),
      notificationMetric("待发送", scheduled),
      notificationMetric("已完成", done),
      notificationMetric("趋势提醒", caseTrend),
      notificationMetric("启用渠道", enabledChannels)
    ].join("");
    notificationList.innerHTML = "";

    if (!jobs.length) {
      notificationList.innerHTML = "<div class=\"notification-empty\">暂无通知任务。先保存诊断报告，或点击“同步病例提醒”。</div>";
      return;
    }

    jobs.slice(0, 8).forEach((job) => {
      const state = notificationState(job);
      const row = document.createElement("article");
      row.className = `notification-item ${state} ${job.priority || "normal"}`;
      row.innerHTML = `
        <div class="notification-time">
          <strong>${job.dueAt ? dueLabel(job.dueAt) : "待定"}</strong>
          <span>${notificationStateText(job)}</span>
        </div>
        <div class="notification-body">
          <strong>${job.caseName || job.reportId || "诊断提醒"}</strong>
          <span>${job.message || job.task || "按复查计划提醒客户。"}</span>
          <em>${job.source === "case-trend" ? `趋势：${job.trendLabel || job.trendState || "-"}` : "报告提醒"} · 拍：${job.photo || "关键照片"}</em>
          ${notificationTemplateHtml(job)}
          ${channelStatusHtml(job)}
          ${failureSuggestionHtml(job)}
        </div>
        <div class="notification-actions"></div>
      `;
      const actions = row.querySelector(".notification-actions");
      const sendButton = document.createElement("button");
      sendButton.type = "button";
      sendButton.className = "mini-button";
      sendButton.textContent = state === "sent" ? "已发送" : "模拟发送";
      sendButton.disabled = state === "done";
      sendButton.addEventListener("click", async () => {
        sendButton.disabled = true;
        await simulateNotificationSend(job.id);
      });

      const retryButton = document.createElement("button");
      retryButton.type = "button";
      retryButton.className = "mini-button";
      retryButton.textContent = "重试失败";
      retryButton.disabled = !job.channelStatuses?.some((item) => item.status === "failed");
      retryButton.addEventListener("click", async () => {
        retryButton.disabled = true;
        await retryFailedNotification(job.id);
      });

      const doneButton = document.createElement("button");
      doneButton.type = "button";
      doneButton.className = "mini-button";
      doneButton.textContent = state === "done" ? "已完成" : "标记完成";
      doneButton.disabled = state === "done";
      doneButton.addEventListener("click", async () => {
        doneButton.disabled = true;
        await completeNotification(job.id);
      });
      actions.appendChild(sendButton);
      actions.appendChild(retryButton);
      actions.appendChild(doneButton);
      notificationList.appendChild(row);
    });
  } catch {
    notificationStatus.textContent = "通知中心暂不可用，请确认本地服务正在运行 server.mjs。";
  }
}

async function syncCaseNotifications(options = {}) {
  const silent = options.silent === true;
  try {
    const channelConfig = saveNotificationChannelConfig({ silent: true });
    if (!silent) {
      syncCaseNotificationsBtn.disabled = true;
      notificationStatus.textContent = "正在同步病例趋势提醒...";
    }
    const response = await fetch("/api/notifications/sync-case-trends", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        channels: channelConfig.channels,
        channelTargets: channelConfig.targets
      })
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const result = await response.json();
    notificationStatus.textContent = `已同步 ${result.counts?.caseTrend || 0} 条病例趋势提醒。`;
    await loadNotifications();
  } catch {
    if (!silent) notificationStatus.textContent = "同步失败：请确认已有病例趋势，并且后台服务可用。";
  } finally {
    if (!silent) syncCaseNotificationsBtn.disabled = false;
  }
}

function insightCard(label, value) {
  return `<div class="insight-card"><span>${label}</span><strong>${value}</strong></div>`;
}

function formatStats(stats, unit) {
  if (!stats) return "-";
  return `${stats.avg.toFixed(1)}${unit} 平均 / ${stats.min.toFixed(1)}-${stats.max.toFixed(1)}${unit}`;
}

async function loadInsights() {
  try {
    const response = await fetch("/api/insights");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();

    insightsGrid.innerHTML = [
      insightCard("报告总数", data.totalReports),
      insightCard("Xponge 样本", data.xpongeReports),
      insightCard("Xponge 体积", formatStats(data.xponge.volumeLiters, "L")),
      insightCard("根毯面积", formatStats(data.xponge.area, "cm²"))
    ].join("");

    const items = [];
    if (data.topRisks.length) {
      items.push(`最高频风险：${data.topRisks.map((item) => `${item.label} ${item.count} 次`).join(" / ")}`);
    }
    if (data.media.length) {
      items.push(`介质分布：${data.media.map((item) => `${item.label} ${item.count}`).join(" / ")}`);
    }
    if (data.devices?.length) {
      items.push(`设备分布：${data.devices.map((item) => `${item.label} ${item.count}`).join(" / ")}`);
    }
    if (data.crops.length) {
      items.push(`作物分布：${data.crops.map((item) => `${item.label} ${item.count}`).join(" / ")}`);
    }
    if (data.severities.length) {
      items.push(`优先级分布：${data.severities.map((item) => `${item.label} ${item.count}`).join(" / ")}`);
    }
    if (data.xpongeReports < 10) {
      items.push("Xponge 样本数还偏少，建议先积累 10-30 份同一作物同一阶段的诊断报告。");
    }

    renderList(insightsList, items.length ? items : ["暂无足够数据生成洞察。"], (item) => item);
  } catch {
    insightsGrid.innerHTML = insightCard("洞察接口", "不可用");
    renderList(insightsList, ["请确认当前服务由新版 server.mjs 启动。"], (item) => item);
  }
}

async function loadOpportunityRanks() {
  try {
    const response = await fetch("/api/opportunities");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const opportunities = await response.json();
    opportunityRankList.innerHTML = "";

    if (!opportunities.length) {
      opportunityRankList.textContent = "暂无机会建议。";
      return;
    }

    opportunities.slice(0, 6).forEach((item) => {
      const card = document.createElement("div");
      card.className = "opportunity-card";
      card.innerHTML = `
        <strong>${item.title}</strong>
        <p>${item.solution}</p>
        <div class="priority-row">
          <span class="priority-chip">优先级：${item.priority}</span>
          <span class="priority-chip">证据：${item.evidence} 份报告</span>
          <span class="priority-chip">分数：${item.score}</span>
          <span class="priority-chip">${item.category}</span>
        </div>
      `;
      opportunityRankList.appendChild(card);
    });
  } catch {
    opportunityRankList.innerHTML = "<div class=\"opportunity-card\"><strong>机会接口不可用</strong><p>请确认当前服务由新版 server.mjs 启动。</p></div>";
  }
}

async function loadExperiments() {
  try {
    const response = await fetch("/api/experiments");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const experiments = await response.json();
    experimentList.innerHTML = "";

    if (!experiments.length) {
      experimentList.innerHTML = "<div class=\"experiment-card\"><strong>暂无实验建议</strong><p>先入库几份诊断报告，再生成路线图。</p></div>";
      return;
    }

    experiments.forEach((item) => {
      const card = document.createElement("div");
      card.className = "experiment-card";
      card.innerHTML = `
        <strong>${item.opportunity}</strong>
        <p>${item.hypothesis}</p>
        <div class="priority-row">
          <span class="priority-chip">优先级：${item.priority}</span>
          <span class="priority-chip">证据：${item.evidence} 份报告</span>
          <span class="priority-chip">周期：${item.duration}</span>
        </div>
        <div class="experiment-grid">
          <div class="experiment-cell"><span>MVP</span><em>${item.mvp}</em></div>
          <div class="experiment-cell"><span>成功指标</span><em>${item.successMetric}</em></div>
          <div class="experiment-cell"><span>样本量</span><em>${item.sampleSize}</em></div>
          <div class="experiment-cell"><span>编号</span><em>${item.id}</em></div>
        </div>
      `;
      experimentList.appendChild(card);
    });
  } catch {
    experimentList.innerHTML = "<div class=\"experiment-card\"><strong>实验接口不可用</strong><p>请确认当前服务由新版 server.mjs 启动。</p></div>";
  }
}

function p2Growth() {
  return window.FiveCropP2 || null;
}

function trackP2Event(type, detail = {}) {
  const p2 = p2Growth();
  if (!p2) return null;
  return p2.trackEvent(type, detail);
}

function p2AnnotationContext(state = latestState || getFormState()) {
  return {
    photoType: latestPhotoQualityGate?.photoType || state.photoType || "none",
    capturedPhotoTypes: Array.from(capturedPhotoTypes),
    pathologyConditionId: latestMatchedPathology[0]?.id || null,
    pathologyMatches: latestMatchedPathology.slice(0, 3).map((item) => ({
      id: item.id,
      title: item.title,
      confidence: item.confidence
    })),
    confidence: confidenceScore(),
    photoQuality: latestPhotoQualityGate,
    reminderPlan: getReminderPlan(),
    logs: getLogs()
  };
}

function currentAnnotationRecord(correction = null) {
  const state = latestState || getFormState();
  const findings = latestFindings.length ? latestFindings : diagnose(state);
  const p2 = p2Growth();
  if (!p2) return null;
  return p2.buildAnnotationRecord({
    state,
    findings,
    context: p2AnnotationContext(state),
    correction
  });
}

function metricCell(label, value) {
  return `<div class="experiment-cell"><span>${label}</span><em>${value}</em></div>`;
}

function renderAnnotationSchema() {
  const p2 = p2Growth();
  if (!p2 || !annotationSchemaList || !annotationPreview) return;
  annotationSchemaList.innerHTML = p2.annotationSchema.requiredFields
    .map((field) => `<span>${field}</span>`)
    .join("");
  const record = currentAnnotationRecord();
  annotationPreview.value = JSON.stringify(record, null, 2);
}

function renderCorrectionList() {
  const p2 = p2Growth();
  if (!p2 || !correctionList) return;
  const corrections = p2.getCorrections().slice(-4).reverse();
  if (!corrections.length) {
    correctionList.innerHTML = "<div class=\"p2-record-card\"><strong>No corrections yet</strong><p>Save an expert correction to create a labeled training record.</p></div>";
    return;
  }
  correctionList.innerHTML = corrections.map((item) => `
    <div class="p2-record-card">
      <strong>${item.correctedDiagnosis || item.predictedDiagnosis || "Correction"}</strong>
      <p>${item.cropKey} / ${item.stageKey} / ${item.photoType} / outcome: ${item.finalOutcome}</p>
    </div>
  `).join("");
}

function renderPricingBoundary(reports = []) {
  const p2 = p2Growth();
  if (!p2 || !pricingBoundaryList) return;
  const gate = p2.usageGate({ reports });
  const pricing = p2.pricingBoundary;
  pricingBoundaryList.innerHTML = [
    `<div class="p2-record-card"><strong>${pricing.free.name}</strong><p>${pricing.free.diagnosisLimit} free diagnoses. Includes: ${pricing.free.includes.join(", ")}.</p></div>`,
    `<div class="p2-record-card"><strong>${pricing.pro.name}</strong><p>Paid boundary: ${pricing.pro.trigger}. Includes: ${pricing.pro.includes.join(", ")}.</p></div>`,
    `<div class="p2-record-card"><strong>${pricing.expert.name}</strong><p>Paid boundary: ${pricing.expert.trigger}. Includes: ${pricing.expert.includes.join(", ")}.</p></div>`,
    `<div class="p2-record-card"><strong>Current gate: ${gate.tier}</strong><p>${gate.message}</p></div>`
  ].join("");
  if (gate.tier !== "free") p2.trackEvent("paid_boundary_seen", { tier: gate.tier });
}

async function loadP2GrowthDashboard() {
  const p2 = p2Growth();
  if (!p2) return;
  let reports = [];
  let backend = null;
  try {
    const [reportResponse, growthResponse] = await Promise.all([
      fetch("/api/reports/export"),
      fetch("/api/p2-growth")
    ]);
    if (reportResponse.ok) reports = await reportResponse.json();
    if (growthResponse.ok) backend = await growthResponse.json();
  } catch {
    reports = [];
  }

  const analytics = p2.analyticsSnapshot({ reports });
  if (p2GrowthMetrics) {
    p2GrowthMetrics.innerHTML = [
      metricCell("Photo completion", `${analytics.photoCompletionRate}%`),
      metricCell("Follow-up return", `${analytics.followupReturnRate}%`),
      metricCell("Action done", `${analytics.actionCompletionRate}%`),
      metricCell("Corrections", analytics.corrections),
      metricCell("Labeled reports", backend?.labeling?.eligibleRecords ?? reports.length),
      metricCell("Paid intent", analytics.paidIntent)
    ].join("");
  }

  renderAnnotationSchema();
  renderCorrectionList();
  renderPricingBoundary(reports);
}

const publicPhotoVariantLabels = {
  straight: "正面",
  angle: "斜拍",
  dim: "暗光",
  close: "近裁切"
};

const publicPhotoResultLabels = {
  captured: "已拍摄",
  pass: "通过",
  retake: "要求重拍",
  fail: "失败",
  basil_default: "又默认罗勒"
};

function escapeMarkup(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  }[char]));
}

function readPublicPhotoTestRecords() {
  if (Array.isArray(publicPhotoServerRecords)) return publicPhotoServerRecords;
  try {
    const records = JSON.parse(localStorage.getItem(publicPhotoTestKey) || "[]");
    return Array.isArray(records) ? records : [];
  } catch {
    return [];
  }
}

function writePublicPhotoTestRecords(records) {
  localStorage.setItem(publicPhotoTestKey, JSON.stringify(records));
}

async function fetchPublicPhotoTestRecords() {
  try {
    const response = await fetch("/api/public-photo-test-records");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    publicPhotoServerRecords = Array.isArray(payload.records) ? payload.records : [];
  } catch {
    publicPhotoServerRecords = null;
  }
  return readPublicPhotoTestRecords();
}

async function persistPublicPhotoTestRecord(record) {
  const localRecords = (() => {
    try {
      const current = JSON.parse(localStorage.getItem(publicPhotoTestKey) || "[]");
      return Array.isArray(current) ? current : [];
    } catch {
      return [];
    }
  })();
  localRecords.push(record);
  writePublicPhotoTestRecords(localRecords);
  try {
    const response = await fetch("/api/public-photo-test-records", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(record)
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const saved = await response.json();
    publicPhotoServerRecords = [...(publicPhotoServerRecords || []), saved];
    return saved;
  } catch {
    publicPhotoServerRecords = null;
    return record;
  }
}

function publicPhotoExpectedCaptures(fixtures = publicPhotoFixtures) {
  if (!fixtures?.fixtureGroups?.length) return 0;
  return fixtures.fixtureGroups.reduce((sum, group) => (
    sum + Number(group.minimumSourcePhotos || 5) * Object.keys(publicPhotoVariantLabels).length
  ), 0);
}

function currentPublicPhotoSnapshot() {
  const state = getFormState();
  const topPathology = latestMatchedPathology[0] || null;
  const riskText = mainRisk?.textContent?.trim() || "";
  return {
    appCropResult: state.crop || "unknown",
    appCropLabel: cropNames[state.crop] || state.crop || "unknown",
    appConditionResult: topPathology?.id || riskText || "not-run",
    appConditionTitle: topPathology?.title || riskText || "not-run",
    appNextAction: customerMobileAction?.textContent?.trim() || customerNextAction?.textContent?.trim() || "",
    askedForRetake: Boolean(latestPhotoQualityGate?.retakeRecommended || shouldBlockDiagnosisForCropIdentity()),
    visionCrop: latestVisionResult?.cropKey || latestVisionResult?.detectedCropKey || null,
    visionProvider: latestVisionResult?.provider || latestAiPipelineSnapshot?.provider || null
  };
}

function publicPhotoCaptureContextFromUrl() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("capture") !== "public-photo") return null;
  const groupId = params.get("group") || "";
  if (!groupId) return null;
  return {
    groupId,
    sourceNumber: Number(params.get("source")) || 1,
    captureVariant: params.get("variant") || "straight"
  };
}

function publicPhotoCaptureUrl({ groupId, sourceNumber, variant }) {
  const params = new URLSearchParams();
  params.set("capture", "public-photo");
  params.set("group", groupId);
  params.set("source", String(Number(sourceNumber) || 1));
  params.set("variant", variant || "straight");
  return `${window.location.origin}/?${params.toString()}`;
}

function publicPhotoContextGroup() {
  if (!publicPhotoCaptureContext) return null;
  return publicPhotoFixtures?.fixtureGroups?.find((item) => item.id === publicPhotoCaptureContext.groupId) || null;
}

function applyPublicPhotoCaptureContext() {
  const group = publicPhotoContextGroup();
  if (!group) return;
  if (cropSelect) cropSelect.value = group.cropKey;
  setPhotoType(group.photoTypes?.[0] || "plant");
  requestedPhotoType = group.photoTypes?.[0] || "plant";
  updateCropHint();
  updateDeviceProfile();
  runDiagnosis();
  if (customerStartTitle) customerStartTitle.textContent = `测试源图 ${publicPhotoCaptureContext.sourceNumber}：${group.goldenPath}`;
  if (customerStartMessage) {
    customerStartMessage.textContent = `拍法：${publicPhotoVariantLabels[publicPhotoCaptureContext.captureVariant] || publicPhotoCaptureContext.captureVariant}。拍完会自动回写到电脑管理端。`;
  }
  if (customerAppIntro) {
    customerAppIntro.textContent = `Test ${publicPhotoCaptureContext.sourceNumber} · ${publicPhotoVariantLabels[publicPhotoCaptureContext.captureVariant] || publicPhotoCaptureContext.captureVariant}`;
  }
}

function renderPublicPhotoTestMetrics(records = readPublicPhotoTestRecords()) {
  if (!publicPhotoTestMetrics) return;
  const expected = publicPhotoExpectedCaptures();
  const passCount = records.filter((item) => item.result === "pass").length;
  const failCount = records.filter((item) => ["fail", "basil_default"].includes(item.result)).length;
  const retakeCount = records.filter((item) => item.result === "retake").length;
  const capturedCount = records.filter((item) => item.result === "captured").length;
  const basilDefaultCount = records.filter((item) => item.result === "basil_default").length;
  const reviewedCount = passCount + failCount + retakeCount;
  const passRate = reviewedCount ? `${Math.round((passCount / reviewedCount) * 100)}%` : "0%";
  const basilDefaultRate = records.length ? `${Math.round((basilDefaultCount / records.length) * 100)}%` : "0%";
  publicPhotoTestMetrics.innerHTML = [
    metricCell("Captures", expected ? `${records.length}/${expected}` : records.length),
    metricCell("Pass", passCount),
    metricCell("Review", capturedCount),
    metricCell("Retake", retakeCount),
    metricCell("Fail", failCount),
    metricCell("Basil default", basilDefaultCount),
    metricCell("Pass rate", passRate),
    metricCell("Default rate", basilDefaultRate),
    metricCell("Groups", publicPhotoFixtures?.fixtureGroups?.length || 0)
  ].join("");
}

function publicPhotoRecordsForGroup(records, groupId) {
  return records.filter((item) => item.fixtureGroupId === groupId);
}

function renderPublicPhotoTestLog(records = readPublicPhotoTestRecords()) {
  if (!publicPhotoTestLog) return;
  const recent = records.slice(-20).reverse();
  publicPhotoTestLog.value = recent.length
    ? JSON.stringify(recent, null, 2)
    : "";
}

function renderPublicPhotoSourceLinks(group) {
  const sourceMap = new Map((publicPhotoFixtures?.sources || []).map((source) => [source.id, source]));
  return group.sourceRefs.map((ref) => {
    const source = sourceMap.get(ref.sourceId);
    if (!source) return "";
    return `<a href="${escapeMarkup(source.url)}" target="_blank" rel="noreferrer">${escapeMarkup(source.title)}</a>`;
  }).filter(Boolean).join("");
}

function renderPublicPhotoGroup(group, records) {
  const groupRecords = publicPhotoRecordsForGroup(records, group.id);
  const expected = Number(group.minimumSourcePhotos || 5) * Object.keys(publicPhotoVariantLabels).length;
  const passCount = groupRecords.filter((item) => item.result === "pass").length;
  const failCount = groupRecords.filter((item) => ["fail", "basil_default"].includes(item.result)).length;
  const retakeCount = groupRecords.filter((item) => item.result === "retake").length;
  const capturedCount = groupRecords.filter((item) => item.result === "captured").length;
  const progress = expected ? Math.min(100, Math.round((groupRecords.length / expected) * 100)) : 0;
  return `
    <article class="public-photo-test-card" data-fixture-group="${escapeMarkup(group.id)}">
      <div class="public-photo-test-card-head">
        <div>
          <span>${escapeMarkup(group.cropKey)} / ${escapeMarkup(group.expectedConditionId)}</span>
          <strong>${escapeMarkup(group.goldenPath)}</strong>
        </div>
        <button type="button" class="mini-button" data-public-photo-action="load" data-group-id="${escapeMarkup(group.id)}">载入作物</button>
      </div>
      <div class="public-photo-progress" aria-label="Public photo test progress">
        <i style="width: ${progress}%"></i>
      </div>
      <div class="public-photo-test-counts">
        <span>${groupRecords.length}/${expected} captures</span>
        <span>${passCount} pass</span>
        <span>${capturedCount} review</span>
        <span>${retakeCount} retake</span>
        <span>${failCount} fail</span>
      </div>
      <div class="public-photo-source-row">${renderPublicPhotoSourceLinks(group)}</div>
      <div class="public-photo-evidence">
        ${(group.evidenceChecklist || []).slice(0, 5).map((item) => `<span>${escapeMarkup(item)}</span>`).join("")}
      </div>
      <label class="public-photo-source-number">
        <span>当前源图编号</span>
        <input type="number" min="1" max="20" value="1" data-public-photo-source-number>
      </label>
      <div class="public-photo-variant-grid">
        ${Object.entries(publicPhotoVariantLabels).map(([variant, label]) => `
          <div class="public-photo-variant-row">
            <strong>${escapeMarkup(label)}</strong>
            <button type="button" data-public-photo-action="copy-link" data-group-id="${escapeMarkup(group.id)}" data-variant="${escapeMarkup(variant)}">复制手机链接</button>
            <button type="button" data-public-photo-action="record" data-group-id="${escapeMarkup(group.id)}" data-variant="${escapeMarkup(variant)}" data-result="pass">通过</button>
            <button type="button" data-public-photo-action="record" data-group-id="${escapeMarkup(group.id)}" data-variant="${escapeMarkup(variant)}" data-result="retake">重拍</button>
            <button type="button" data-public-photo-action="record" data-group-id="${escapeMarkup(group.id)}" data-variant="${escapeMarkup(variant)}" data-result="fail">失败</button>
            <button type="button" data-public-photo-action="record" data-group-id="${escapeMarkup(group.id)}" data-variant="${escapeMarkup(variant)}" data-result="basil_default">默认罗勒</button>
          </div>
        `).join("")}
      </div>
    </article>
  `;
}

function renderPublicPhotoTestPanel(records = readPublicPhotoTestRecords()) {
  if (!publicPhotoTestList) return;
  renderPublicPhotoTestMetrics(records);
  renderPublicPhotoTestLog(records);
  const groups = publicPhotoFixtures?.fixtureGroups || [];
  if (!groups.length) {
    publicPhotoTestList.innerHTML = "<div class=\"p2-record-card\"><strong>公开照片清单未加载</strong><p>请确认 data/public-photo-fixtures.json 存在，并通过本地服务打开 App。</p></div>";
    return;
  }
  publicPhotoTestList.innerHTML = groups.map((group) => renderPublicPhotoGroup(group, records)).join("");
}

async function loadPublicPhotoTestPanel() {
  publicPhotoCaptureContext = publicPhotoCaptureContextFromUrl();
  if (!publicPhotoTestPanel) return;
  try {
    const response = await fetch("/data/public-photo-fixtures.json");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    publicPhotoFixtures = await response.json();
  } catch {
    publicPhotoFixtures = null;
  }
  const records = await fetchPublicPhotoTestRecords();
  applyPublicPhotoCaptureContext();
  renderPublicPhotoTestPanel(records);
}

function initialModeFromUrl() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("capture") === "public-photo") return "customer";
  if (params.get("mode") === "customer") return "customer";
  if (params.get("mode") === "expert" || params.get("panel") === "public-photo-test") return "expert";
  return localStorage.getItem("growClinicMode") || "customer";
}

function applyInitialCustomerUrlState() {
  const params = new URLSearchParams(window.location.search);
  const crop = params.get("crop");
  if (crop && cropNames[crop] && cropSelect) cropSelect.value = crop;
  const careMode = params.get("care");
  if (careMode && carePlansForCrop(cropSelect?.value || "basil")[careMode]) basilGuideMode = careMode;
  const intent = params.get("intent");
  if (intent === "care" || intent === "photo") {
    setCustomerEntryMode(intent, { persist: false });
  }
}

function focusInitialPanelFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const panel = params.get("panel");
  const targetId = panel === "public-photo-test"
    ? "public-photo-test-panel"
    : window.location.hash.replace(/^#/, "");
  if (!targetId) return;
  window.setTimeout(() => {
    document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 150);
}

function enforceInitialUrlMode() {
  const mode = initialModeFromUrl();
  const params = new URLSearchParams(window.location.search);
  if (params.get("mode") || params.get("panel") || params.get("capture")) {
    setMode(mode);
  }
}

function preparePublicPhotoGroup(groupId) {
  const group = publicPhotoFixtures?.fixtureGroups?.find((item) => item.id === groupId);
  if (!group) return;
  if (cropSelect) cropSelect.value = group.cropKey;
  setPhotoType(group.photoTypes?.[0] || "plant");
  updateCropHint();
  updateDeviceProfile();
  runDiagnosis();
  if (publicPhotoTestLog) {
    publicPhotoTestLog.value = `已载入：${group.goldenPath}\n先用手机拍公开照片，再回到这里记录通过、重拍或失败。`;
  }
}

async function copyPublicPhotoCaptureLink({ groupId, variant, sourceNumber }) {
  const url = publicPhotoCaptureUrl({ groupId, sourceNumber, variant });
  const localhostWarning = /^(localhost|127\.0\.0\.1)$/i.test(window.location.hostname)
    ? "\n提示：如果手机打不开，把链接里的 127.0.0.1 换成电脑局域网 IP。"
    : "";
  try {
    await navigator.clipboard.writeText(url);
    if (publicPhotoTestLog) publicPhotoTestLog.value = `已复制手机拍摄链接：\n${url}${localhostWarning}`;
  } catch {
    if (publicPhotoTestLog) publicPhotoTestLog.value = `手机拍摄链接：\n${url}${localhostWarning}`;
  }
}

async function savePublicPhotoTestRecord({ groupId, variant, result, sourceNumber, extra = {} }) {
  const group = publicPhotoFixtures?.fixtureGroups?.find((item) => item.id === groupId);
  if (!group) return;
  const record = {
    id: `public-photo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    fixtureGroupId: group.id,
    cropKey: group.cropKey,
    goldenPath: group.goldenPath,
    expectedConditionId: group.expectedConditionId,
    sourceNumber: Number(sourceNumber) || 1,
    captureVariant: variant,
    captureVariantLabel: publicPhotoVariantLabels[variant] || variant,
    result,
    resultLabel: publicPhotoResultLabels[result] || result,
    ...currentPublicPhotoSnapshot(),
    ...extra
  };
  await persistPublicPhotoTestRecord(record);
  const records = await fetchPublicPhotoTestRecords();
  renderPublicPhotoTestPanel(records);
}

function inferPublicPhotoAutoResult(group, gate, vision) {
  const topPathology = latestMatchedPathology[0] || null;
  const acceptedConditions = new Set([group.expectedConditionId, ...(group.secondaryConditionIds || [])].filter(Boolean));
  const visionCrop = vision?.detectedCropKey || vision?.cropKey || "";
  if (visionCrop === "basil" && group.cropKey !== "basil") return "basil_default";
  if (gate?.retakeRecommended || visionNeedsCropCheck(vision)) return "retake";
  if (topPathology?.id && acceptedConditions.has(topPathology.id)) return "captured";
  return "captured";
}

async function syncPublicPhotoCaptureResult({ fileName, photoType, gate, vision, source, signals }) {
  const group = publicPhotoContextGroup();
  if (!group || !publicPhotoCaptureContext) return;
  const result = inferPublicPhotoAutoResult(group, gate, vision);
  await savePublicPhotoTestRecord({
    groupId: group.id,
    variant: publicPhotoCaptureContext.captureVariant,
    sourceNumber: publicPhotoCaptureContext.sourceNumber,
    result,
    extra: {
      source: "mobile-capture",
      fileName,
      photoType,
      gateState: gate?.state || null,
      gateMessage: gate?.message || null,
      quality: {
        dimensions: gate?.dimensions || null,
        brightness: gate?.brightness ?? null,
        contrast: gate?.contrast ?? null
      },
      sourceDevice: navigator.userAgent,
      captureSource: source,
      signals: {
        greenRatio: signals?.greenRatio ?? null,
        yellowRatio: signals?.yellowRatio ?? null,
        darkRatio: signals?.darkRatio ?? null
      }
    }
  });
  if (photoHint) {
    photoHint.textContent = `已同步测试记录：源图 ${publicPhotoCaptureContext.sourceNumber} / ${publicPhotoVariantLabels[publicPhotoCaptureContext.captureVariant] || publicPhotoCaptureContext.captureVariant}。`;
  }
}

function handlePublicPhotoTestAction(event) {
  const button = event.target.closest("[data-public-photo-action]");
  if (!button) return;
  const groupId = button.dataset.groupId;
  if (button.dataset.publicPhotoAction === "load") {
    preparePublicPhotoGroup(groupId);
    return;
  }
  const card = button.closest("[data-fixture-group]");
  const sourceNumber = card?.querySelector("[data-public-photo-source-number]")?.value || "1";
  if (button.dataset.publicPhotoAction === "copy-link") {
    copyPublicPhotoCaptureLink({
      groupId,
      variant: button.dataset.variant,
      sourceNumber
    });
    return;
  }
  savePublicPhotoTestRecord({
    groupId,
    variant: button.dataset.variant,
    result: button.dataset.result,
    sourceNumber
  });
}

function exportPublicPhotoTestRecords() {
  const records = readPublicPhotoTestRecords();
  const payload = {
    version: "fivecrop-public-print-results-v1",
    exportedAt: new Date().toISOString(),
    total: records.length,
    records
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `fivecrop-public-photo-results-${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function strategyList(items) {
  return `<ul>${items.map((item) => `<li>${item}</li>`).join("")}</ul>`;
}

async function loadProductStrategy() {
  try {
    const response = await fetch("/api/product-strategy");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const strategy = await response.json();

    productStrategyGrid.innerHTML = [
      insightCard("定位", "三合一"),
      insightCard("报告样本", strategy.reportSignals.totalReports),
      insightCard("竞品", strategy.competitorBenchmarks.length),
      insightCard("优先模块", strategy.roadmap[0]?.module?.replace(/：.+$/, "") || "待定")
    ].join("");

    productStrategyList.innerHTML = `
      <div class="strategy-positioning">
        <strong>${strategy.positioning}</strong>
        <p>${strategy.moat.join("；")}</p>
      </div>
      <div class="strategy-section">
        <h4>竞品优点怎么吸收</h4>
        <div class="strategy-card-grid">
          ${strategy.competitorBenchmarks.map((item) => `
            <article class="strategy-card">
              <div class="strategy-card-head">
                <span>${item.role}</span>
                <strong>${item.name}</strong>
                <em>${item.score}/100</em>
              </div>
              <div class="strategy-columns">
                <div><span>优点</span>${strategyList(item.strengths)}</div>
                <div><span>我们吸收</span>${strategyList(item.takeaways)}</div>
              </div>
            </article>
          `).join("")}
        </div>
      </div>
      <div class="strategy-section">
        <h4>当前产品优化优先级</h4>
        ${strategy.roadmap.map((item, index) => `
          <div class="strategy-roadmap-item">
            <span>#${index + 1} / ${item.priorityScore} 分</span>
            <strong>${item.module}</strong>
            <p>${item.why}${item.nextStep}</p>
          </div>
        `).join("")}
      </div>
      <div class="strategy-section">
        <h4>能力模块成熟度</h4>
        <div class="strategy-module-grid">
          ${strategy.modules.map((module) => `
            <article class="strategy-module">
              <span>${module.currentScore} → ${module.targetScore}</span>
              <strong>${module.title}</strong>
              <p>证据：${module.evidence}；现有资产：${module.currentAssets.join("、")}</p>
              ${strategyList(module.nextOptimizations)}
            </article>
          `).join("")}
        </div>
      </div>
    `;
  } catch {
    productStrategyGrid.innerHTML = insightCard("策略接口", "不可用");
    productStrategyList.innerHTML = "<div class=\"strategy-positioning\"><strong>竞品策略接口不可用</strong><p>请确认当前服务由新版 server.mjs 启动。</p></div>";
  }
}

function renderKnowledgeGraphStats(stats) {
  knowledgeGraphStats.innerHTML = [
    insightCard("作物", stats.crops),
    insightCard("路径", stats.visiblePathways),
    insightCard("病理条件", stats.pathologyConditions || 0),
    insightCard("节点", stats.nodes),
    insightCard("关系", stats.edges)
  ].join("");
}

function renderKnowledgeGraphPathway(item) {
  const card = document.createElement("div");
  card.className = "knowledge-card";
  card.innerHTML = `
    <div class="knowledge-card-head">
      <div>
        <span>${item.cropName} / ${item.stageName}</span>
        <strong>${item.userProblem}</strong>
      </div>
      <em>${item.painType.join(" / ")}</em>
    </div>
    <div class="knowledge-grid">
      <div><span>可能原因</span><p>${item.likelyCauses.join("、")}</p></div>
      <div><span>照片信号</span><p>${item.photoSignals.join("、")}</p></div>
      <div><span>自动采集</span><p>${item.autoIntake.join("、")}</p></div>
      <div><span>需要照片</span><p>${item.requiredPhotos.join("、")}</p></div>
    </div>
    <div class="knowledge-prescription">
      <span>处方动作</span>
      <ol>${item.prescription.map((step) => `<li>${step}</li>`).join("")}</ol>
    </div>
    <div class="knowledge-followup">
      <strong>复查：${item.followup.when}</strong>
      <span>${item.followup.photo}；成功标准：${item.followup.success}</span>
    </div>
    <p class="knowledge-gap">${item.productGap}</p>
  `;
  knowledgeGraphList.appendChild(card);
}

async function loadKnowledgeGraph() {
  try {
    const params = new URLSearchParams();
    if (knowledgeGraphCropFilter.value) params.set("crop", knowledgeGraphCropFilter.value);
    if (knowledgeGraphStageFilter.value) params.set("stage", knowledgeGraphStageFilter.value);
    const response = await fetch(`/api/knowledge-graph?${params.toString()}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const isFiltered = Boolean(params.toString());
    if (!isFiltered) {
      knowledgeGraphPathways = data.pathways;
      pathologyConditions = data.pathology?.conditions || [];
      if (latestState && latestFindings.length) {
        renderDiagnosis(latestState, diagnose(latestState));
      }
    }

    renderKnowledgeGraphStats(data.stats);
    knowledgeGraphList.innerHTML = "";
    if (!data.pathways.length) {
      knowledgeGraphList.innerHTML = "<div class=\"knowledge-card\"><strong>暂无匹配路径</strong><p>换一个作物或阶段筛选。</p></div>";
      return;
    }
    data.pathways.forEach(renderKnowledgeGraphPathway);
  } catch {
    knowledgeGraphStats.innerHTML = insightCard("知识图谱", "不可用");
    knowledgeGraphList.innerHTML = "<div class=\"knowledge-card\"><strong>知识图谱接口不可用</strong><p>请确认当前服务由新版 server.mjs 启动。</p></div>";
  }
}

async function fetchReport(id) {
  const response = await fetch(`/api/reports/${encodeURIComponent(id)}`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

async function viewReport(id) {
  try {
    const report = await fetchReport(id);
    dbDetail.value = report.report || JSON.stringify(report, null, 2);
  } catch {
    dbDetail.value = "读取报告详情失败。";
  }
}

function setCheckboxGroup(name, values) {
  document.querySelectorAll(`input[name="${name}"]`).forEach((input) => {
    input.checked = values.includes(input.value);
  });
}

function addChecked(name, values) {
  const next = new Set(values);
  document.querySelectorAll(`input[name="${name}"]`).forEach((input) => {
    if (next.has(input.value)) input.checked = true;
  });
}

function setPhotoType(value) {
  const input = document.querySelector(`input[name="photoType"][value="${value}"]`);
  if (input) input.checked = true;
}

function inferFromConcern() {
  const concern = smartConcern.value;
  const symptomMap = {
    yellow: ["yellow-leaves"],
    leggy: ["leggy", "no-flower"],
    aroma: ["weak-aroma"],
    fruit: ["no-fruit"],
    pest: ["pests"],
    root: ["algae"],
    dry: ["wilting", "leaf-curl"]
  };
  const visualMap = {
    yellow: ["pale-new-growth", "lower-yellowing"],
    leggy: ["long-internodes"],
    fruit: ["flower-drop"],
    pest: ["tiny-flies", "sticky-residue", "leaf-holes", "chewed-edge"],
    root: ["green-surface", "white-fuzz"],
    dry: ["edge-dry"]
  };
  const photoTypeMap = {
    yellow: "leaf",
    leggy: "plant",
    aroma: "plant",
    fruit: "flower",
    pest: "pest",
    root: "root",
    dry: "leaf"
  };

  addChecked("symptoms", symptomMap[concern] || []);
  addChecked("visuals", visualMap[concern] || []);
  if (photoTypeMap[concern]) setPhotoType(photoTypeMap[concern]);
}

function inferFromFileName(file) {
  const name = file?.name?.toLowerCase() || "";
  const selectedCrop = cropSelect?.value || "";
  const isBasilBoltingName = selectedCrop === "basil" || name.includes("basil") || name.includes("luole") || name.includes("罗勒");
  const isBasilTransplantName = selectedCrop === "basil" || name.includes("basil") || name.includes("luole") || name.includes("罗勒");
  const symptoms = [];
  const visuals = [];
  if (name.includes("yellow") || name.includes("huang") || name.includes("leaf")) {
    symptoms.push("yellow-leaves");
    visuals.push("pale-new-growth");
    setPhotoType("leaf");
  }
  if (
    isBasilBoltingName &&
    (
      name.includes("flower") ||
      name.includes("bloom") ||
      name.includes("bud") ||
      name.includes("bolting") ||
      name.includes("bitter") ||
      name.includes("sparse") ||
      name.includes("开花") ||
      name.includes("花苞") ||
      name.includes("花穗") ||
      name.includes("抽薹") ||
      name.includes("叶少") ||
      name.includes("变苦")
    )
  ) {
    symptoms.push("bolting");
    visuals.push("flower-buds", "sparse-leaves");
    setPhotoType("flower");
  } else if (name.includes("flower") || name.includes("fruit") || name.includes("tomato")) {
    symptoms.push("no-fruit");
    visuals.push("flower-drop");
    setPhotoType("flower");
  }
  if (name.includes("root") || name.includes("xponge") || name.includes("algae")) {
    symptoms.push("algae");
    visuals.push("green-surface");
    setPhotoType("root");
  }
  if (
    isBasilTransplantName &&
    (
      name.includes("transplant") ||
      name.includes("repot") ||
      name.includes("potted-up") ||
      name.includes("seedling-move") ||
      name.includes("移栽") ||
      name.includes("换盆") ||
      name.includes("分株") ||
      name.includes("缓苗")
    )
  ) {
    symptoms.push("transplant-shock", "wilting");
    setPhotoType("plant");
  }
  if (
    isBasilBoltingName &&
    (
      name.includes("aroma") ||
      name.includes("fragrance") ||
      name.includes("scent") ||
      name.includes("flavor") ||
      name.includes("flavour") ||
      name.includes("weak-scent") ||
      name.includes("香味") ||
      name.includes("香气") ||
      name.includes("不香") ||
      name.includes("味淡")
    )
  ) {
    symptoms.push("weak-aroma");
    setPhotoType("plant");
  }
  if (name.includes("pest") || name.includes("bug") || name.includes("fly")) {
    symptoms.push("pests");
    visuals.push("tiny-flies");
    setPhotoType("pest");
  }
  if (name.includes("hole") || name.includes("chew") || name.includes("eaten") || name.includes("bite")) {
    symptoms.push("pests");
    visuals.push("leaf-holes", "chewed-edge");
    setPhotoType("pest");
  }
  if (
    name.includes("powder") ||
    name.includes("mildew") ||
    name.includes("botrytis") ||
    name.includes("gray-mold") ||
    name.includes("grey-mold") ||
    name.includes("white-powder") ||
    name.includes("白粉") ||
    name.includes("灰霉") ||
    name.includes("霉斑")
  ) {
    symptoms.push("spots");
    visuals.push("leaf-white-powder", "gray-mold");
    setPhotoType("leaf");
  }
  addChecked("symptoms", symptoms);
  addChecked("visuals", visuals);
}

function addPhotoTypeScore(scores, reasons, type, points, reason) {
  scores[type] = (scores[type] || 0) + points;
  if (reason) reasons.push(`${photoTypeLabel(type)}：${reason}`);
}

function scorePhotoTypeKeywords(file, scores, reasons) {
  const name = file?.name?.toLowerCase() || "";
  const keywordGroups = {
    plant: ["plant", "whole", "full", "overall", "side", "overview", "aroma", "fragrance", "scent", "zhengzhu", "整株", "全株", "全景", "侧面", "植株", "香味", "香气", "不香", "味淡", "苗"],
    leaf: ["leaf", "yellow", "huang", "foliage", "spot", "curl", "powder", "mildew", "botrytis", "gray-mold", "grey-mold", "sparse", "叶", "叶片", "黄叶", "斑点", "卷叶", "焦边", "白粉", "灰霉", "霉斑", "叶少"],
    root: ["root", "xponge", "coco", "rockwool", "soil", "medium", "algae", "mold", "fungus", "gen", "根", "根区", "基质", "介质", "岩棉", "椰糠", "藻", "霉", "白毛"],
    flower: ["flower", "bloom", "bud", "bolting", "fruit", "tomato", "pepper", "strawberry", "berry", "hua", "guo", "花", "花苞", "花穗", "花序", "抽薹", "果", "果实", "番茄", "辣椒", "草莓"],
    pest: ["pest", "bug", "fly", "gnat", "mite", "aphid", "insect", "worm", "虫", "飞虫", "小飞虫", "蚜", "螨", "粘板"]
  };

  Object.entries(keywordGroups).forEach(([type, keywords]) => {
    if (keywords.some((keyword) => name.includes(keyword))) {
      addPhotoTypeScore(scores, reasons, type, 34, "文件名包含相关词");
    }
  });
}

function detectUploadedPhotoType(file, signals = photoSignals, state = getFormState()) {
  const scores = {
    plant: 8,
    leaf: 0,
    root: 0,
    flower: 0,
    pest: 0
  };
  const reasons = ["整株照：默认先保留整株基线"];

  if (requestedPhotoType && requestedPhotoType !== "none") {
    addPhotoTypeScore(scores, reasons, requestedPhotoType, 10, "当前拍照入口建议");
  }

  scorePhotoTypeKeywords(file, scores, reasons);

  const concernScores = {
    yellow: ["leaf", 18, "用户主诉是黄叶"],
    dry: ["leaf", 14, "用户主诉是萎蔫或干边"],
    root: ["root", 20, "用户主诉是根区或藻霉"],
    fruit: ["flower", 20, "用户主诉是开花不结果"],
    pest: ["pest", 22, "用户主诉是虫害"],
    leggy: ["plant", 18, "用户主诉是徒长或不开花"],
    aroma: ["plant", 14, "香味问题需要整株和光照背景"]
  };
  const concern = concernScores[smartConcern.value];
  if (concern) addPhotoTypeScore(scores, reasons, concern[0], concern[1], concern[2]);

  if (["flowering", "fruiting"].includes(state.stage) && isFruitingCrop(state)) {
    addPhotoTypeScore(scores, reasons, "flower", 9, "结果类作物处于花果阶段");
  }
  if (state.stage === "seedling" || state.stage === "vegetative") {
    addPhotoTypeScore(scores, reasons, "plant", 6, "当前阶段更需要整株形态");
  }

  if (signals.yellowRatio !== null && signals.yellowRatio > 0.22) {
    addPhotoTypeScore(scores, reasons, "leaf", 24, "黄色像素占比较高");
  }
  if (signals.greenRatio !== null && signals.greenRatio > 0.36) {
    const rootContext = state.medium === "xponge" || smartConcern.value === "root" || requestedPhotoType === "root";
    addPhotoTypeScore(scores, reasons, rootContext ? "root" : "plant", rootContext ? 20 : 8, rootContext ? "根区/基质场景绿色占比较高" : "绿色主体占比较高");
  }
  if (signals.darkRatio !== null && signals.darkRatio > 0.45) {
    addPhotoTypeScore(scores, reasons, requestedPhotoType || "leaf", 6, "暗部较多，需要结合当前拍照入口判断");
  }

  const ranked = Object.entries(scores)
    .map(([type, score]) => ({ type, score }))
    .sort((a, b) => b.score - a.score);
  const top = ranked[0];
  const second = ranked[1] || { score: 0 };
  const margin = top.score - second.score;
  const confidence = Math.max(0.45, Math.min(0.94, 0.48 + top.score / 160 + margin / 120));

  return {
    type: top.type,
    confidence,
    scores,
    reasons: reasons.filter((reason) => reason.startsWith(`${photoTypeLabel(top.type)}：`)).slice(0, 3)
  };
}

function applyPhotoTypeDetection(detection) {
  if (!detection?.type) return requestedPhotoType || getFormState().photoType || "plant";
  latestPhotoTypeDetection = detection;
  requestedPhotoType = detection.type;
  setPhotoType(detection.type);
  if (autoPhotoTypeBadge) {
    autoPhotoTypeBadge.textContent = `自动识别为：${photoTypeLabel(detection.type)} · ${Math.round(detection.confidence * 100)}%`;
  }
  return detection.type;
}

async function analyzeImageSignals(dataUrl) {
  return new Promise((resolve) => {
    const image = new Image();
    image.addEventListener("load", () => {
      const canvas = document.createElement("canvas");
      const size = 64;
      canvas.width = size;
      canvas.height = size;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      context.drawImage(image, 0, 0, size, size);
      const pixels = context.getImageData(0, 0, size, size).data;
      let green = 0;
      let yellow = 0;
      let dark = 0;
      let brightnessSum = 0;
      let brightnessSquares = 0;
      const total = size * size;

      for (let index = 0; index < pixels.length; index += 4) {
        const red = pixels[index];
        const g = pixels[index + 1];
        const blue = pixels[index + 2];
        const brightness = (red + g + blue) / 3;
        brightnessSum += brightness;
        brightnessSquares += brightness * brightness;
        if (g > red * 1.08 && g > blue * 1.12) green += 1;
        if (red > 110 && g > 100 && blue < 110 && Math.abs(red - g) < 70) yellow += 1;
        if (brightness < 65) dark += 1;
      }
      const avgBrightness = brightnessSum / total;
      const variance = brightnessSquares / total - avgBrightness * avgBrightness;

      resolve({
        greenRatio: green / total,
        yellowRatio: yellow / total,
        darkRatio: dark / total,
        brightness: avgBrightness,
        contrast: Math.sqrt(Math.max(0, variance)),
        width: image.naturalWidth,
        height: image.naturalHeight
      });
    });
    image.addEventListener("error", () => resolve(photoSignals));
    image.src = dataUrl;
  });
}

function applyPhotoSignals() {
  const visuals = [];
  const symptoms = [];
  if (photoSignals.yellowRatio !== null && photoSignals.yellowRatio > 0.22) {
    visuals.push("pale-new-growth", "lower-yellowing");
    symptoms.push("yellow-leaves");
    setPhotoType("leaf");
  }
  if (photoSignals.greenRatio !== null && photoSignals.greenRatio > 0.36 && smartConcern.value === "root") {
    visuals.push("green-surface");
    symptoms.push("algae");
    setPhotoType("root");
  }
  if (photoSignals.darkRatio !== null && photoSignals.darkRatio > 0.45) {
    visuals.push("edge-dry");
  }
  addChecked("visuals", visuals);
  addChecked("symptoms", symptoms);
}

function visionNeedsCropCheck(result = latestVisionResult) {
  return Boolean(result?.needsCropVerification || result?.cropMismatch);
}

function applyVisionHints(result) {
  if (visionNeedsCropCheck(result)) return;
  const symptoms = [];
  const visuals = [];
  (result.diagnosisHints || []).forEach((hint) => {
    if (hint === "yellow-leaves") {
      symptoms.push("yellow-leaves");
      visuals.push("pale-new-growth", "lower-yellowing");
    }
    if (hint === "algae") {
      symptoms.push("algae");
      visuals.push("green-surface");
    }
    if (hint === "pests") {
      symptoms.push("pests");
      visuals.push("tiny-flies");
    }
    if (hint === "water-swing") {
      symptoms.push("wilting");
      visuals.push("edge-dry");
    }
    if (hint === "transplant-shock") {
      symptoms.push("transplant-shock", "wilting");
    }
    if (hint === "leaf-curl") {
      symptoms.push("leaf-curl");
    }
    if (hint === "spots") {
      symptoms.push("spots");
    }
    if (hint === "leggy") {
      symptoms.push("leggy");
      visuals.push("long-internodes");
    }
    if (hint === "root-risk") {
      symptoms.push("algae");
      visuals.push("white-fuzz");
    }
    if (hint === "flowering-context") {
      visuals.push("flower-drop");
    }
  });
  (result.labels || []).forEach((item) => {
    const label = item?.label || item;
    if (label === "flower-buds") {
      symptoms.push("bolting");
      visuals.push("flower-buds");
    }
    if (label === "sparse-leaves") {
      symptoms.push("bolting");
      visuals.push("sparse-leaves");
    }
    if (label === "recent-transplant") {
      symptoms.push("transplant-shock", "wilting");
    }
    if (label === "leaf-holes" || label === "chewing-damage") {
      symptoms.push("pests");
      visuals.push("leaf-holes", "chewed-edge");
    }
    if (label === "powdery-mildew") {
      symptoms.push("spots");
      visuals.push("leaf-white-powder");
    }
    if (label === "gray-mold") {
      symptoms.push("spots");
      visuals.push("gray-mold");
    }
    if (label === "possible-pest") {
      symptoms.push("pests");
      visuals.push("tiny-flies");
    }
    if (label === "sticky-residue") {
      symptoms.push("pests");
      visuals.push("sticky-residue");
    }
  });
  addChecked("symptoms", symptoms);
  addChecked("visuals", visuals);
}

function cropVerificationHint(result, selectedCropName) {
  const detected = cropNames[result?.detectedCropKey] || "";
  if (result?.cropMismatch && detected) {
    return `This photo does not look like ${selectedCropName}. Retake one clear whole-plant photo before diagnosis.`;
  }
  return `FiveCrop cannot confirm this is ${selectedCropName} yet. Retake one clear whole-plant photo before diagnosis.`;
}

function shouldBlockDiagnosisForCropIdentity() {
  return Boolean(visionNeedsCropCheck() && document.body.classList.contains("has-plant-photo"));
}

function renderCropIdentityBlock(state = getFormState()) {
  latestState = state;
  latestFindings = [];
  latestMatchedPathways = [];
  latestMatchedPathology = [];
  latestAssistantAdvice = null;
  latestAssistantAdviceSignature = "";
  syncCustomerIntakeState(state);
  renderCustomerMobileExperience(state);
  if (readiness) readiness.textContent = "Crop not confirmed";
  if (mainRisk) mainRisk.textContent = "Crop not confirmed";
  if (mainSummary) {
    mainSummary.textContent = "FiveCrop needs one clear whole-plant photo before it can give care advice.";
  }
  renderList(causesList, [
    "The current photo does not confirm tomato, basil, rosemary, strawberry, or pepper."
  ], (item) => item);
  renderList(actionsList, ["Retake one clear whole-plant photo"], (item) => item);
  renderList(taskList, ["Retake one clear whole-plant photo"], (item) => item);
  renderMatchedPathways([]);
  renderMinimalQuestions(state, []);
  renderList(monitorList, ["Diagnosis will start after the crop is confirmed."], (item) => item);
  renderList(photoList, ["Whole-plant photo in bright, even light"], (item) => item);
  renderList(followupList, [], (item) => item);
  if (reportOutput) {
    reportOutput.value = [
      "Crop not confirmed",
      "",
      "FiveCrop did not generate a diagnosis or prescription for this photo.",
      "Next action: retake one clear whole-plant photo."
    ].join("\n");
  }
  if (photoHint) {
    photoHint.textContent = cropVerificationHint(latestVisionResult, cropNames[state.crop] || "the selected crop");
  }
  if (copyStatus) copyStatus.textContent = "Crop not confirmed. No report was generated.";
  if (saveReportBtn) saveReportBtn.disabled = true;
}

function resizeImageForVision(dataUrl, maxSize = 1280, quality = 0.78) {
  return new Promise((resolve) => {
    const image = new Image();
    image.addEventListener("load", () => {
      const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
      if (scale >= 1) {
        resolve(dataUrl);
        return;
      }

      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const context = canvas.getContext("2d");
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    });
    image.addEventListener("error", () => resolve(dataUrl));
    image.src = dataUrl;
  });
}

function saveBaselinePhotoSignals(photoType, signals) {
  const saved = getBaselinePhotoSignals();
  const baselines = saved?.signals ? {} : saved || {};
  baselines[photoType] = {
    photoType,
    signals,
    capturedAt: new Date().toISOString()
  };
  localStorage.setItem(baselinePhotoKey, JSON.stringify(baselines));
}

function getBaselinePhotoSignals(photoType = null) {
  try {
    const saved = JSON.parse(localStorage.getItem(baselinePhotoKey) || "null");
    if (photoType && saved && !saved.signals) return saved[photoType] || null;
    return saved;
  } catch {
    return null;
  }
}

async function analyzePhotoWithVision(dataUrl, file, options = {}) {
  const state = getFormState();
  const photoType = options.photoType || requestedPhotoType || state.photoType;
  try {
    const imageData = await resizeImageForVision(dataUrl);
    const response = await fetch("/api/vision/analyze", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        imageData,
        fileName: file?.name || "",
        photoType,
        capturedPhotoTypes: Array.from(capturedPhotoTypes),
        signals: photoSignals,
        clientPipeline: buildAiPipelineSnapshot(state, {
          photoType,
          hasImage: true,
          gate: latestPhotoQualityGate,
          detection: latestPhotoTypeDetection
        }),
        context: {
          cropKey: state.crop,
          stageKey: state.stage,
          mediumKey: state.medium,
          concern: smartConcern.value,
          mode: options.mode || "intake",
          checkDay: options.checkDay || null
        }
      })
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const result = await response.json();
    latestVisionResult = result;
    updateAiPipelineSnapshot(state, { vision: result, photoType, hasImage: true });
    if (result.needsCropVerification || result.cropMismatch) {
      const selected = cropNames[state.crop] || "所选作物";
      photoHint.textContent = result.cropMismatch
        ? `这张照片不像${selected}，请重新选择作物或补拍整株。`
        : `这张照片还不能确认是${selected}，请补拍整株。`;
    } else if (result.provider && result.provider !== "local-heuristic-placeholder") {
      photoHint.textContent = `AI 已识别：${file?.name || "照片"}，置信度 ${Math.round((result.confidence || 0) * 100)}%。`;
    } else {
      photoHint.textContent = `已读取：${file?.name || "照片"}，当前使用本地规则。`;
    }
    if (result.needsCropVerification || result.cropMismatch) {
      photoHint.textContent = cropVerificationHint(result, cropNames[state.crop] || "the selected crop");
    }
    if (!options.skipHints) applyVisionHints(result);
    return result;
  } catch {
    latestVisionResult = null;
    return null;
  }
}

async function compareFollowupWithVision(dataUrl, file, signals) {
  const photoType = getFormState().photoType || requestedPhotoType || "leaf";
  const baseline = getBaselinePhotoSignals(photoType) || getBaselinePhotoSignals();
  if (!baseline?.signals) return null;
  try {
    const imageData = await resizeImageForVision(dataUrl);
    const response = await fetch("/api/vision/compare", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        context: photoType || baseline.photoType,
        checkDay: checkDay.value,
        before: baseline,
        after: {
          fileName: file?.name || "",
          imageData,
          signals
        }
      })
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch {
    return null;
  }
}

function requiredPhotoTypes(state = getFormState()) {
  const required = new Set(latestMatchedPathways[0]?.requiredPhotos || ["plant", "leaf", "root"]);
  if (!latestMatchedPathways.length && ["tomato", "strawberry", "pepper"].includes(state.crop) && ["flowering", "fruiting"].includes(state.stage)) {
    required.add("flower");
  }
  if (smartConcern.value === "pest" || has(state, "pests")) {
    required.add("pest");
  }
  if (smartConcern.value === "yellow") {
    required.delete("root");
  }
  if (smartConcern.value === "root") {
    required.delete("flower");
  }
  return Array.from(required);
}

function photoTypeLabel(type) {
  const englishLabels = {
    plant: "whole-plant photo",
    leaf: "leaf detail",
    root: "root-zone photo",
    flower: "flower or fruit photo",
    pest: "pest detail"
  };
  if (englishLabels[type]) return englishLabels[type];
  const labels = {
    plant: "整株照",
    leaf: "叶片特写",
    root: "根区照",
    flower: "花序/果实照",
    pest: "虫害照"
  };
  return labels[type] || type;
}

function photoTip(type) {
  const tips = {
    plant: "把整株放进画面，包含顶部、主要叶片和根区位置。",
    leaf: "靠近一片有问题的叶子，尽量拍清叶面纹理和叶缘。",
    root: "拍 Xponge/基质表面、边缘干湿差异和植株基部。",
    flower: "拍同一组花序或小果，尽量看清花心、落花和果形。",
    pest: "拍叶背、嫩梢或黄粘板，尽量让虫点清楚。"
  };
  return tips[type] || "按页面提示补拍一张清晰照片。";
}

function pathwayPhotoReason(type, match = latestMatchedPathways[0]) {
  if (!match) return photoTip(type);
  const signalText = match.photoSignals.slice(0, 3).join("、");
  const reasonByType = {
    plant: `用于确认 ${match.userProblem} 的整株状态，并观察 ${signalText}。`,
    leaf: `用于放大确认叶片颜色、卷叶、斑点等信号；当前路径关注 ${signalText}。`,
    root: `用于确认根区、Xponge/基质表面、过湿或藻霉线索；当前路径关注 ${signalText}。`,
    flower: `用于确认花序、落花、小果或果形变化；当前路径关注 ${signalText}。`,
    pest: `用于确认叶背、虫点、蛛丝或粘虫板线索；当前路径关注 ${signalText}。`
  };
  return `${reasonByType[type] || photoTip(type)} 这张照片会影响「${match.id}」的判断。`;
}

function evaluatePhotoQuality(signals = photoSignals) {
  const items = [];
  if (signals.width !== null && (signals.width < 600 || signals.height < 600)) {
    items.push("照片分辨率偏低，建议靠近一点重新拍。");
  }
  if (signals.brightness !== null && signals.brightness < 65) {
    items.push("照片偏暗，建议靠近窗边或开灯后补拍。");
  }
  if (signals.brightness !== null && signals.brightness > 225) {
    items.push("照片过曝，叶片颜色可能失真，建议避开强反光。");
  }
  if (signals.contrast !== null && signals.contrast < 22) {
    items.push("照片细节偏弱，可能太糊或背景太接近，建议重新对焦。");
  }
  if (!items.length && signals.width !== null) {
    items.push("当前照片质量可用于初步判断。");
  }
  if (signals.width === null) {
    items.push("还没有上传照片。");
  }
  return items;
}

function photoQualityGate(signals = photoSignals, photoType = requestedPhotoType || "plant", detection = latestPhotoTypeDetection, vision = latestVisionResult) {
  const fail = [];
  const warn = [];
  const pass = [];
  const width = Number(signals.width);
  const height = Number(signals.height);
  const brightness = Number(signals.brightness);
  const contrast = Number(signals.contrast);

  if (!Number.isFinite(width) || !Number.isFinite(height)) {
    fail.push("照片没有读取成功");
  } else if (width < 480 || height < 480) {
    fail.push("分辨率太低，放大后看不清叶片或根区");
  } else if (width < 900 || height < 900) {
    warn.push("分辨率略低，关键细节可能不够稳");
  } else {
    pass.push("分辨率够用");
  }

  if (Number.isFinite(brightness)) {
    if (brightness < 45) fail.push("画面太暗，颜色判断会失真");
    else if (brightness < 75) warn.push("画面偏暗，建议开灯或靠近窗边");
    else if (brightness > 238) fail.push("画面过曝，叶色和白毛/藻霉容易看错");
    else if (brightness > 220) warn.push("画面偏亮，避开强反光会更稳");
    else pass.push("亮度正常");
  }

  if (Number.isFinite(contrast)) {
    if (contrast < 14) fail.push("照片太糊或背景太近，纹理不够清楚");
    else if (contrast < 22) warn.push("细节偏弱，重新对焦会更好");
    else pass.push("细节可读");
  }

  if (detection?.confidence && detection.confidence < 0.58) {
    warn.push("照片类型识别不够稳，必要时会要求补拍");
  }

  const state = fail.length ? "fail" : warn.length ? "warn" : "pass";
  const score = Math.max(0, Math.min(100, 92 - fail.length * 28 - warn.length * 12 + Math.min(pass.length, 3) * 2));
  const provider = aiProviderLabel(vision);
  const message = state === "fail"
    ? fail[0]
    : state === "warn"
      ? `${warn[0]}；可以继续，也可以一键重拍。`
      : "照片通过质检，可以继续诊断。";

  return {
    version: "photo-gate-v1",
    state,
    score,
    photoType,
    label: photoTypeLabel(photoType),
    message,
    fail,
    warn,
    pass,
    provider,
    dimensions: Number.isFinite(width) && Number.isFinite(height) ? `${Math.round(width)}x${Math.round(height)}` : "-",
    brightness: Number.isFinite(brightness) ? Math.round(brightness) : null,
    contrast: Number.isFinite(contrast) ? Math.round(contrast) : null,
    retakeRecommended: state === "fail",
    canContinue: state !== "fail"
  };
}

function aiProviderLabel(result = latestVisionResult) {
  if (result?.provider === "qwen-dashscope") return "Qwen Vision";
  if (result?.provider === "openai-responses") return "OpenAI Vision";
  if (result?.provider && result.provider !== "local-heuristic-placeholder") return "AI Vision";
  if (result?.readyForAiProvider) return "本地规则 · 可接真实视觉模型";
  return "本地规则";
}

function buildAiPipelineSnapshot(state = getFormState(), options = {}) {
  const vision = options.vision || latestVisionResult;
  const gate = options.gate || latestPhotoQualityGate;
  const detection = options.detection || latestPhotoTypeDetection;
  const photoType = options.photoType || gate?.photoType || detection?.type || requestedPhotoType || state.photoType || "plant";
  return {
    version: "ai-pipeline-v1",
    readyForRealVision: true,
    provider: vision?.provider || "local-heuristic-placeholder",
    providerLabel: aiProviderLabel(vision),
    upgradeTarget: "Qwen-VL / plant-specific vision model",
    modelInput: {
      cropKey: state.crop,
      stageKey: state.stage,
      mediumKey: state.medium,
      concern: smartConcern.value,
      photoType,
      capturedPhotoTypes: Array.from(capturedPhotoTypes),
      hasImage: Boolean(options.hasImage ?? (photoSignals.width !== null))
    },
    photoQualityGate: gate,
    photoTypeDetection: detection,
    labels: vision?.labels || [],
    observations: vision?.observations || [],
    diagnosisHints: vision?.diagnosisHints || [],
    missingPhotos: vision?.missingPhotos || requiredPhotoTypes(state).filter((type) => !capturedPhotoTypes.has(type)),
    expectedOutputs: [
      "photoType",
      "quality",
      "labels",
      "observations",
      "diagnosisHints",
      "missingPhotos",
      "nextAction"
    ]
  };
}

function updateAiPipelineSnapshot(state = getFormState(), options = {}) {
  latestAiPipelineSnapshot = buildAiPipelineSnapshot(state, options);
  return latestAiPipelineSnapshot;
}

function hidePhotoReview() {
  latestPhotoQualityGate = null;
  if (!photoReviewCard) return;
  photoReviewCard.hidden = true;
  photoReviewCard.dataset.state = "";
  if (photoReviewMeta) photoReviewMeta.innerHTML = "";
}

function renderPhotoReview(gate = latestPhotoQualityGate, fileName = "") {
  if (!photoReviewCard || !gate) return;
  photoReviewCard.hidden = false;
  photoReviewCard.dataset.state = gate.state;
  photoReviewKicker.textContent = gate.state === "fail" ? "照片未通过" : gate.state === "warn" ? "照片可用但建议优化" : "照片通过";
  photoReviewTitle.textContent = gate.state === "fail"
    ? `请重拍${gate.label}`
    : gate.state === "warn"
      ? `${gate.label}可以继续`
      : `${gate.label}已通过`;
  photoReviewMessage.textContent = gate.message;
  photoReviewMeta.innerHTML = "";
  [
    `质检 ${gate.score}%`,
    `类型 ${gate.label}`,
    `尺寸 ${gate.dimensions}`,
    `亮度 ${gate.brightness ?? "-"}`,
    `细节 ${gate.contrast ?? "-"}`,
    gate.provider,
    fileName ? `文件 ${fileName}` : ""
  ].filter(Boolean).forEach((item) => {
    const chip = document.createElement("span");
    chip.textContent = item;
    photoReviewMeta.appendChild(chip);
  });
  if (photoRetakeBtn) photoRetakeBtn.textContent = `重拍${gate.label}`;
  if (photoContinueBtn) {
    photoContinueBtn.disabled = !gate.canContinue;
    photoContinueBtn.textContent = gate.canContinue ? "继续诊断" : "先重拍";
  }
}

function nextPhotoSuggestion() {
  const required = requiredPhotoTypes();
  const missing = required.filter((type) => !capturedPhotoTypes.has(type));
  if (missing.length) {
    const type = missing[0];
    const match = latestMatchedPathways[0] || null;
    return {
      type,
      title: match ? `${photoTypeLabel(type)} · ${match.userProblem}` : photoTypeLabel(type),
      tip: match ? pathwayPhotoReason(type, match) : photoTip(type),
      action: match ? `按图谱补拍${photoTypeLabel(type)}` : `补拍${photoTypeLabel(type)}`,
      pathwayId: match?.id || null
    };
  }

  const quality = evaluatePhotoQuality();
  const problem = quality.find((item) => !item.includes("可用于初步判断"));
  if (problem) {
    return {
      type: requestedPhotoType,
      title: "重拍当前照片",
      tip: problem,
      action: "重拍更清晰的照片"
    };
  }

  return {
    type: null,
    title: "照片已够用",
    tip: "可以直接查看诊断和下一步处方；复查时尽量按同角度拍。",
    action: "查看诊断结果"
  };
}

function photoStepList(type) {
  const steps = {
    plant: ["整株放进画面", "能看到顶部和盆口", "手机离植物约 40-80cm"],
    leaf: ["选一片最典型的问题叶", "拍清叶面和叶缘", "避开强反光和手影"],
    root: ["拍基质或 Xponge 表面", "带上植株基部", "让干湿边界和藻霉区域入镜"],
    flower: ["拍同一组花或小果", "尽量看清花心/落花位置", "3-5 天后按同角度复拍"],
    pest: ["优先拍叶背和嫩梢", "如果有黄粘板也一起拍", "靠近一点让虫点清楚"]
  };
  return steps[type] || ["保持画面清晰", "植物主体不要被裁掉", "拍完后系统会判断是否要补拍"];
}

function guidedPhotoInstruction(state = getFormState()) {
  const suggestion = nextPhotoSuggestion();
  const plan = buildDeviceCropPlan(state);
  const type = suggestion.type || plan.firstPhoto || requestedPhotoType || "plant";
  const required = requiredPhotoTypes(state);
  const missing = required.filter((photoType) => !capturedPhotoTypes.has(photoType));
  const qualityMessages = evaluatePhotoQuality();
  const ready = !suggestion.type && capturedPhotoTypes.size > 0;
  const title = ready ? "照片已够用" : `现在请拍：${photoTypeLabel(type)}`;
  const reason = suggestion.type
    ? suggestion.tip
    : "当前关键照片已经齐了，可以直接查看诊断和处方；复查时尽量按同角度再拍。";
  const status = ready
    ? `已获得 ${capturedPhotoTypes.size} 张关键照片，当前可信度 ${confidenceScore()}%。`
    : capturedPhotoTypes.size
      ? `已获得 ${capturedPhotoTypes.size} 张，还缺 ${missing.map(photoTypeLabel).join("、") || photoTypeLabel(type)}。`
      : `还没有照片，先拍这一张就可以开始诊断。当前识别管线：${aiProviderLabel()}。`;
  const actionVerb = document.body.classList.contains("customer-mode") ? "打开相机拍" : "上传";

  return {
    type,
    title,
    reason,
    status,
    steps: ready ? qualityMessages.slice(0, 3) : photoStepList(type),
    action: ready ? "继续诊断" : `${actionVerb}${photoTypeLabel(type)}`
  };
}

function renderGuidedPhotoCapture(state = getFormState()) {
  if (!guidedPhotoTitle || !guidedPhotoSteps || !guidedPhotoUploadBtn) return;
  const instruction = guidedPhotoInstruction(state);
  guidedPhotoTitle.textContent = instruction.title;
  guidedPhotoReason.textContent = instruction.reason;
  guidedPhotoStatus.textContent = instruction.status;
  guidedPhotoUploadBtn.textContent = instruction.action;
  guidedPhotoUploadBtn.disabled = instruction.title === "照片已够用";
  guidedPhotoSteps.innerHTML = "";
  instruction.steps.forEach((step, index) => {
    const item = document.createElement("div");
    item.className = "guided-photo-step";
    item.innerHTML = `<span>${index + 1}</span><strong>${step}</strong>`;
    guidedPhotoSteps.appendChild(item);
  });
}

function confidenceScore() {
  const required = requiredPhotoTypes();
  const captured = required.filter((type) => capturedPhotoTypes.has(type)).length;
  const completion = required.length ? captured / required.length : 0;
  const quality = evaluatePhotoQuality();
  const qualityProblems = quality.filter((item) =>
    !item.includes("可用于初步判断") && !item.includes("还没有上传照片")
  ).length;
  const qualityScore = photoSignals.width === null ? 0 : Math.max(0, 1 - qualityProblems * 0.22);
  const diagnosisScore = hasRunSmartDiagnosis ? 1 : 0.55;
  const score = Math.round((completion * 0.55 + qualityScore * 0.3 + diagnosisScore * 0.15) * 100);
  return Math.max(0, Math.min(100, score));
}

function confidenceMessage(score) {
  if (score >= 85) return "输入较完整，可以给出较可靠的诊断和复查计划。";
  if (score >= 60) return "可做初步判断，补齐关键照片后会更稳。";
  if (score >= 35) return "只能粗略判断，建议先按提示补拍。";
  return "信息不足，先上传清晰照片。";
}

function diagnosisConfidenceDecision(state, findings = latestFindings) {
  const score = confidenceScore();
  const required = requiredPhotoTypes(state);
  const missing = required.filter((type) => !capturedPhotoTypes.has(type));
  const qualityProblems = evaluatePhotoQuality().filter((item) =>
    !item.includes("可用于初步判断") && !item.includes("还没有上传照片")
  );
  const hasAnyPhoto = capturedPhotoTypes.size > 0 || state.hasPhoto;
  const top = findings[0];
  const topAction = top?.action || "先补齐照片和基本信息。";
  const nextSuggestion = nextPhotoSuggestion();
  const evidence = [
    `照片：${capturedPhotoTypes.size}/${required.length} 张关键照片`,
    `知识路径：${latestMatchedPathways[0]?.id || "未命中明确路径"}`,
    `主风险：${top?.title || "待判断"}`
  ];

  if (!hasAnyPhoto && smartConcern.value === "unknown") {
    return {
      tier: "blocked",
      status: "暂无法判断",
      title: "证据还不够",
      reason: "还没有照片，也没有明确主诉；系统不能可靠判断黄叶、虫害、根区或坐果问题。",
      next: "先拍一张整株照",
      evidence
    };
  }

  if (missing.length) {
    return {
      tier: "photo",
      status: "需要补拍",
      title: `还缺 ${missing.map(photoTypeLabel).join("、")}`,
      reason: "当前照片证据不足，直接给最终结论容易误判；先补齐关键照片再判断。",
      next: nextSuggestion.action || `补拍${photoTypeLabel(missing[0])}`,
      evidence: [...evidence, `缺失：${missing.map(photoTypeLabel).join("、")}`]
    };
  }

  if (qualityProblems.length && score < 75) {
    return {
      tier: "photo",
      status: "需要重拍",
      title: "照片质量影响判断",
      reason: qualityProblems[0],
      next: "重拍更清晰的关键照片",
      evidence: [...evidence, `质检：${qualityProblems[0]}`]
    };
  }

  if (score >= 85) {
    return {
      tier: "ready",
      status: "可以判断",
      title: "证据足够给出处方",
      reason: "关键照片、作物阶段和主要风险已经基本闭合，可以执行处方并按复查节点验证。",
      next: topAction,
      evidence
    };
  }

  if (score >= 60) {
    const loop = followupLoopInstruction(state, findings);
    return {
      tier: "followup",
      status: "初步判断",
      title: "需要复查确认",
      reason: "当前能给出方向，但需要用处方后的同角度照片确认是否真的改善。",
      next: loop.disabled ? topAction : `${loop.title}：${loop.photo}`,
      evidence
    };
  }

  if (score >= 35) {
    return {
      tier: "photo",
      status: "证据偏弱",
      title: "先补拍再判断",
      reason: "目前只能粗略判断，建议先按拍照向导补齐最关键的一张。",
      next: nextSuggestion.action || "补拍关键照片",
      evidence
    };
  }

  return {
    tier: "blocked",
    status: "暂无法判断",
    title: "需要更多输入",
    reason: "照片、主诉或作物阶段信息不足，系统暂时不能给出可靠处方。",
    next: "按拍照向导上传照片",
    evidence
  };
}

function renderConfidenceDecision(state, findings) {
  if (!confidenceDecisionCard || !confidenceTierList) return;
  const decision = diagnosisConfidenceDecision(state, findings);
  confidenceDecisionCard.className = `confidence-decision-card ${decision.tier}`;
  confidenceTierStatus.textContent = decision.status;
  confidenceTierTitle.textContent = decision.title;
  confidenceTierReason.textContent = decision.reason;
  confidenceTierNext.textContent = decision.next;
  confidenceTierList.innerHTML = "";
  decision.evidence.forEach((item) => {
    const row = document.createElement("li");
    row.textContent = item;
    confidenceTierList.appendChild(row);
  });
}

function currentStep() {
  if (!capturedPhotoTypes.size) return "photo";
  const suggestion = nextPhotoSuggestion();
  if (suggestion.title !== "照片已够用") return "quality";
  if (!hasRunSmartDiagnosis) return "diagnosis";
  return "followup";
}

function renderSteps() {
  const order = ["photo", "quality", "diagnosis", "followup"];
  const active = currentStep();
  const activeIndex = order.indexOf(active);
  steps.forEach((step) => {
    const index = order.indexOf(step.dataset.step);
    step.classList.toggle("active", index === activeIndex);
    step.classList.toggle("done", index < activeIndex);
  });
}

function renderPhotoQuality() {
  const required = requiredPhotoTypes();
  const graphMatch = latestMatchedPathways[0] || null;
  photoCheckList.innerHTML = "";
  required.forEach((type) => {
    const item = document.createElement("div");
    const done = capturedPhotoTypes.has(type);
    const graphRequired = graphMatch?.requiredPhotos.includes(type);
    item.className = `photo-check-item${done ? " done" : ""}${graphRequired ? " graph-required" : ""}`;
    item.innerHTML = `<strong>${photoTypeLabel(type)}</strong><span>${done ? "已获得" : graphRequired ? "图谱必需" : "建议补拍"}</span>`;
    photoCheckList.appendChild(item);
  });
  const missing = required.filter((type) => !capturedPhotoTypes.has(type));
  const messages = evaluatePhotoQuality();
  if (graphMatch) {
    messages.unshift(`图谱路径：${graphMatch.userProblem}；优先补齐 ${graphMatch.requiredPhotos.map(photoTypeLabel).join("、")}。`);
  }
  if (missing.length) {
    messages.unshift(`还缺：${missing.map(photoTypeLabel).join("、")}。`);
  }
  renderList(photoQualityList, messages, (item) => item);
  const suggestion = nextPhotoSuggestion();
  if (suggestion.type) requestedPhotoType = suggestion.type;
  nextPhotoTitle.textContent = suggestion.title;
  nextPhotoTip.textContent = suggestion.tip;
  useNextPhotoBtn.textContent = suggestion.type ? `上传${photoTypeLabel(suggestion.type)}` : "照片已齐";
  useNextPhotoBtn.disabled = !suggestion.type;
  renderSteps();
}

function smartDiagnose() {
  inferFromConcern();
  const file = plantPhoto.files && plantPhoto.files[0];
  if (file) inferFromFileName(file);
  applyPhotoSignals();

  if (smartConcern.value === "unknown" && !file) {
    document.querySelector("#notes").value = "用户未提供照片，系统按默认番茄/Xponge 场景生成初步诊断，建议补拍整株、叶片和根区照片。";
  }

  hasRunSmartDiagnosis = true;
  runDiagnosis();
}

function updateCropHint() {
  cropHint.textContent = cropConstraints[cropSelect.value] || "";
}

async function loadReportIntoForm(id, options = {}) {
  try {
    const report = await fetchReport(id);
    if (report.deviceKey) document.querySelector("#growDevice").value = report.deviceKey;
    if (report.cropKey) document.querySelector("#crop").value = report.cropKey;
    if (report.stageKey) document.querySelector("#stage").value = report.stageKey;
    if (report.mediumKey) document.querySelector("#medium").value = report.mediumKey;
    if (report.photoType) {
      const photoTypeInput = document.querySelector(`input[name="photoType"][value="${report.photoType}"]`);
      if (photoTypeInput) photoTypeInput.checked = true;
      requestedPhotoType = report.photoType;
    }
    capturedPhotoTypes = new Set(report.photoQuality?.captured?.length
      ? report.photoQuality.captured
      : report.photoType
        ? [report.photoType]
        : []);
    hasRunSmartDiagnosis = true;
    latestPhotoTypeDetection = report.photoTypeDetection || null;
    latestVisionResult = report.vision || null;
    latestPhotoQualityGate = report.photoQuality?.gate || report.aiPipeline?.photoQualityGate || null;
    latestAiPipelineSnapshot = report.aiPipeline || null;

    if (report.sensor) {
      document.querySelector("#sensorMoisture").value = report.sensor.moisture ?? "";
      document.querySelector("#lightHours").value = report.sensor.lightHours ?? "";
      document.querySelector("#temperature").value = report.sensor.temperature ?? "";
      document.querySelector("#humidity").value = report.sensor.humidity ?? "";
      document.querySelector("#ec").value = report.sensor.ec ?? "";
      document.querySelector("#ph").value = report.sensor.ph ?? "";
    }

    if (report.xponge) {
      document.querySelector("#xpongeThickness").value = report.xponge.thickness ?? "";
      document.querySelector("#xpongeLength").value = report.xponge.length ?? "";
      document.querySelector("#xpongeWidth").value = report.xponge.width ?? "";
    }

    setCheckboxGroup("symptoms", report.symptoms || []);
    setCheckboxGroup("visuals", report.visuals || []);
    document.querySelector("#notes").value = report.notes || "";
    if (report.caseId || report.caseName) {
      setActiveCase({
        id: report.caseId || report.plantCaseId || `case-${report.cropKey || "crop"}-${report.deviceKey || "device"}-${report.mediumKey || "medium"}`,
        name: report.caseName || report.plantCaseName || defaultCaseName(getFormState()),
        cropKey: report.cropKey,
        deviceKey: report.deviceKey,
        createdAt: report.caseCreatedAt || report.createdAt || new Date().toISOString()
      });
      renderActiveCase();
    }
    updateDeviceProfile();
    if (latestPhotoQualityGate) renderPhotoReview(latestPhotoQualityGate);
    else hidePhotoReview();
    dbDetail.value = report.report || "";
    runDiagnosis();
    if (options.resume && customerArchiveStatus) {
      setCustomerArchiveStatus("已恢复上次植物档案，继续照看即可。", "saved");
    }
    dbStatus.textContent = options.resume ? `已恢复植物档案：${report.id}` : `已载入历史报告：${report.id}`;
    return report;
  } catch {
    if (options.resume && customerArchiveStatus) {
      setCustomerArchiveStatus("上次档案暂时没有恢复成功，可以重新拍照开始。", "failed");
    }
    dbStatus.textContent = options.resume ? "恢复植物档案失败。" : "载入历史报告失败。";
    return null;
  }
}

async function restoreCustomerArchiveOnStartup() {
  if (!isCustomerModeActive()) return null;
  const record = getCustomerArchiveRecord();
  if (!record?.reportId) {
    renderCustomerArchiveStatus(getFormState(), latestFindings);
    return null;
  }
  setCustomerArchiveStatus("正在恢复上次植物档案。", "saving");
  const report = await loadReportIntoForm(record.reportId, { resume: true });
  if (!report) return null;
  renderCustomerCompactPlan(latestState || getFormState(), latestFindings);
  renderCustomerPlantDossier(latestState || getFormState(), latestFindings);
  await refreshCustomerCaseTimeline({ force: true, silent: true });
  return report;
}

function renderHistory() {
  const logs = getLogs();
  if (!logs.length) {
    renderList(historyList, ["暂无日志。保存一次记录后，这里会显示最近 8 条复查。"], (item) => item);
    return;
  }

  renderList(historyList, logs.slice().reverse(), (log) => {
    const note = log.notes ? `<br>${log.notes}` : "";
    return `<strong>${log.day}</strong>：新叶 ${progressText(log.leaf)} / 花果 ${progressText(log.flower)} / 虫藻 ${progressText(log.pest)}${note}`;
  });
}

function severityLabel(severity) {
  if (severity === "high") return "高优先级";
  if (severity === "medium") return "中优先级";
  return "观察";
}

function renderList(root, items, mapper) {
  root.innerHTML = "";
  items.forEach((item) => {
    const li = document.createElement("li");
    li.innerHTML = mapper(item);
    root.appendChild(li);
  });
}

function renderMatchedPathways(matches) {
  matchedPathwayList.innerHTML = "";
  if (!matches.length) {
    matchedPathwayList.innerHTML = `
      <div class="matched-pathway-card">
        <span>等待图谱匹配</span>
        <strong>当前信号还不足以命中明确路径</strong>
        <em>补充照片、阶段或主要困扰后，系统会自动匹配作物路径。</em>
      </div>
    `;
    return;
  }

  matches.forEach((match) => {
    const card = document.createElement("div");
    card.className = "matched-pathway-card";
    card.innerHTML = `
      <span>${match.cropName} / ${match.stageName} / ${match.confidence}%</span>
      <strong>${match.userProblem}</strong>
      <em>复查：${match.followup.when}，拍 ${match.followup.photo}</em>
      <ul>${match.reasons.map((reason) => `<li>${reason}</li>`).join("")}</ul>
    `;
    matchedPathwayList.appendChild(card);
  });
}

function hasValue(value) {
  return value !== null && value !== undefined && value !== "";
}

function question(id, prompt, why, options, priority = 0) {
  return { id, prompt, why, options, priority };
}

function buildMinimalQuestions(state, matches = latestMatchedPathways) {
  const match = matches[0] || null;
  const questions = [];
  const add = (item) => {
    if (!questions.some((questionItem) => questionItem.id === item.id)) questions.push(item);
  };

  if (!match && smartConcern.value === "unknown") {
    add(question(
      "main-concern",
      "最想先解决哪个问题？",
      "先确定主诉，系统才能决定优先拍叶片、花序、根区还是虫害线索。",
      [
        { label: "黄叶", apply: { smartConcern: "yellow", symptoms: ["yellow-leaves"], visuals: ["pale-new-growth", "lower-yellowing"] } },
        { label: "不开花/不结果", apply: { smartConcern: "fruit", symptoms: ["no-fruit"], visuals: ["flower-drop"] } },
        { label: "虫/霉/根区", apply: { smartConcern: "root", symptoms: ["algae"], visuals: ["green-surface", "white-fuzz"] } }
      ],
      90
    ));
  }

  const id = match?.id || "";

  if ((id.includes("flower") || id.includes("fruit") || id.includes("ripen")) && !hasValue(state.lightHours)) {
    add(question(
      "light-hours",
      "补光灯每天大约开多久？",
      "花果阶段对日累计光量很敏感，这个答案能判断是授粉问题还是光照问题。",
      [
        { label: "少于 10 小时", apply: { fields: { "#lightHours": 9, "#light": "low" } } },
        { label: "12-14 小时", apply: { fields: { "#lightHours": 13, "#light": "medium" } } },
        { label: "14-16 小时", apply: { fields: { "#lightHours": 15, "#light": "high" } } }
      ],
      80
    ));
  }

  if ((id.includes("flower") || id.includes("pepper") || id.includes("tomato")) && !hasValue(state.temperature)) {
    add(question(
      "temperature",
      "灯下冠层温度大约多少？",
      "番茄、辣椒、草莓落花常和灯下过热或夜间偏冷有关。",
      [
        { label: "22-30C", apply: { fields: { "#temperature": 26, "#climate": "normal" } } },
        { label: "高于 32C", apply: { fields: { "#temperature": 34, "#climate": "hot" } } },
        { label: "低于 18C", apply: { fields: { "#temperature": 16, "#climate": "cold" } } }
      ],
      78
    ));
  }

  if ((id.includes("wet") || id.includes("crown") || id.includes("root")) && !hasValue(state.sensorMoisture)) {
    add(question(
      "root-moisture",
      "根区摸起来更像哪种状态？",
      "没有传感器读数时，用触感也能先区分过湿、稳定和忽干忽湿。",
      [
        { label: "一直湿", apply: { fields: { "#moisture": "wet", "#sensorMoisture": 82 } } },
        { label: "基本稳定", apply: { fields: { "#moisture": "stable", "#sensorMoisture": 58 } } },
        { label: "忽干忽湿", apply: { fields: { "#moisture": "swing", "#sensorMoisture": 36 } } }
      ],
      76
    ));
  }

  if (id.includes("xponge") && !hasValue(state.reservoir)) {
    add(question(
      "reservoir",
      "这棵植物对应的储液量大约多少？",
      "Xponge 很薄，储液量决定水肥缓冲能力。",
      [
        { label: "少于 2L", apply: { fields: { "#reservoir": 1.5 } } },
        { label: "2-5L", apply: { fields: { "#reservoir": 3 } } },
        { label: "超过 5L", apply: { fields: { "#reservoir": 6 } } }
      ],
      74
    ));
  }

  if (id.includes("basil") && state.stage === "flowering") {
    add(question(
      "basil-prune",
      "最近 7 天有没有摘顶或剪掉花穗？",
      "罗勒早花、叶少或味道变差时，摘花苞和打顶采收比继续加水加肥更关键。",
      [
        { label: "没有", apply: { notesAppend: "最近 7 天未摘顶/未剪花穗。" } },
        { label: "剪过一次", apply: { notesAppend: "最近 7 天剪过一次花穗或摘顶。" } },
        { label: "频繁采收", apply: { notesAppend: "最近 7 天频繁采收，需判断是否老株衰退。" } }
      ],
      72
    ));
  }

  if (id.includes("rosemary") && !hasValue(state.lightHours)) {
    add(question(
      "rosemary-light",
      "迷迭香每天有多少小时强光？",
      "迷迭香和罗勒不同，室内弱光加潮湿很容易误判成缺水。",
      [
        { label: "少于 6 小时", apply: { fields: { "#lightHours": 5, "#light": "low" } } },
        { label: "8-12 小时", apply: { fields: { "#lightHours": 10, "#light": "medium" } } },
        { label: "12 小时以上", apply: { fields: { "#lightHours": 13, "#light": "high" } } }
      ],
      70
    ));
  }

  const missingPhotos = requiredPhotoTypes(state).filter((type) => !capturedPhotoTypes.has(type));
  if (missingPhotos.length && questions.length < 2) {
    const type = missingPhotos[0];
    add(question(
      "missing-photo",
      `先补拍一张${photoTypeLabel(type)}？`,
      match ? pathwayPhotoReason(type, match) : photoTip(type),
      [
        { label: `上传${photoTypeLabel(type)}`, apply: { photoType: type, openUpload: true } }
      ],
      68
    ));
  }

  return questions
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 2);
}

function applyMinimalAnswer(apply = {}) {
  Object.entries(apply.fields || {}).forEach(([selector, value]) => {
    const input = document.querySelector(selector);
    if (input) input.value = value;
  });
  if (apply.smartConcern) smartConcern.value = apply.smartConcern;
  if (apply.photoType) {
    requestedPhotoType = apply.photoType;
    setPhotoType(apply.photoType);
  }
  if (apply.symptoms?.length) addChecked("symptoms", apply.symptoms);
  if (apply.visuals?.length) addChecked("visuals", apply.visuals);
  if (apply.notesAppend) {
    const notes = document.querySelector("#notes");
    notes.value = [notes.value.trim(), apply.notesAppend].filter(Boolean).join("\n");
  }
  updateCropHint();
  runDiagnosis();
  if (apply.openUpload) plantPhoto.click();
}

function renderMinimalQuestions(state, matches) {
  const questions = buildMinimalQuestions(state, matches);
  minimalQuestionList.innerHTML = "";

  if (!questions.length) {
    minimalQuestionList.innerHTML = `
      <div class="minimal-question-card">
        <span>无需补问</span>
        <strong>当前信息足够进入处方和复查</strong>
        <em>接下来优先按图谱建议补齐照片或执行处方动作。</em>
      </div>
    `;
    return;
  }

  questions.forEach((item) => {
    const card = document.createElement("div");
    card.className = "minimal-question-card";
    card.innerHTML = `
      <span>只问关键问题</span>
      <strong>${item.prompt}</strong>
      <em>${item.why}</em>
      <div class="minimal-question-options"></div>
    `;
    const options = card.querySelector(".minimal-question-options");
    item.options.forEach((option) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = option.label;
      button.addEventListener("click", () => applyMinimalAnswer(option.apply));
      options.appendChild(button);
    });
    minimalQuestionList.appendChild(card);
  });
}

function pathwayCustomerAction(match) {
  const actions = {
    "tomato-flower-no-fruit": "今天中午轻弹花序 5 秒，或用低速风扇轻吹，让花粉动起来。",
    "tomato-fruit-slow-ripen": "先不要频繁换液；保留强壮果串，把补光稳定到每天 14-16 小时。",
    "tomato-xponge-water-swing": "今天先稳住根区：边缘遮光，补水改成少量多次，不让 Xponge 一会儿干一会儿湿。",
    "basil-leggy-low-light": "今天从健康节点上方剪一次顶，并把灯距调近到 20-35cm。",
    "basil-flowering-bitter": "今天及时摘掉花苞，并打顶采收；之后保持经常采收，让侧枝重新长出来。",
    "rosemary-wet-root-decline": "今天先停水 48 小时，并加强通风；不要因为叶子发蔫就继续浇。",
    "rosemary-low-light-indoors": "把迷迭香移到更强光位置，或补强光到每天 12 小时以上。",
    "strawberry-flower-no-fruit": "今天中午用软刷轻刷花心一次，之后连续 3-5 天观察同一花序。",
    "strawberry-deformed-fruit": "下一批花逐花授粉；同时补拍叶背，排查蓟马或叶斑。",
    "strawberry-crown-wet": "今天让草莓冠部露出来，暂停把水浇到冠部，48 小时后复查白毛是否扩散。",
    "pepper-flower-drop": "今天轻摇植株或软刷授粉，并把灯下温度控制在 22-30C。",
    "pepper-compact-variety-fit": "先判断品种是否适合室内；如果株高快顶灯，减少同机混种或移出设备。"
  };
  return actions[match.id] || match.prescription[0];
}

function fallbackCustomerAction(finding) {
  const title = finding.title || "";
  if (title.includes("光照")) return "先把补光时间稳定下来，今天不要同时大改水肥。";
  if (title.includes("过湿") || title.includes("藻")) return "先暂停浇水或降低水位，保持通风，48 小时后再看根区。";
  if (title.includes("水分波动") || title.includes("Xponge")) return "把补水改成少量多次，先解决忽干忽湿。";
  if (title.includes("虫") || title.includes("红蜘蛛")) return "先隔离这盆，补拍叶背或粘虫板，24 小时后复查虫量。";
  if (title.includes("授粉") || title.includes("结果")) return "今天中午做一次轻摇/软刷授粉，之后拍同一花序复查。";
  if (title.includes("温度")) return "先测灯下冠层温度，再调整灯距或风扇。";
  return finding.action;
}

function routePrimaryAction(state, findings = latestFindings) {
  const route = diagnosisRoute(state);
  if (!route) return null;
  const topTitle = findings[0]?.title || "";

  if (route.key === "flower") {
    if (state.temperature !== null && state.temperature > 32) {
      return "花果路径第一步：先把灯下冠层温度降到 22-30C，再做授粉；今天只改灯距或风扇。";
    }
    if (state.temperature !== null && state.temperature < 18) {
      return "花果路径第一步：先让夜间根区和冠层回到 18C 以上，再观察是否继续落花。";
    }
    if (state.light === "low" || (state.lightHours !== null && state.lightHours < 12)) {
      return "花果路径第一步：先把补光稳定到每天 14-16 小时；中午再轻摇或软刷花序一次。";
    }
    if (state.moisture === "swing") {
      return "花果路径第一步：先稳住根区，补水改成少量多次；中午做一次轻摇或软刷授粉。";
    }
    return state.crop === "strawberry"
      ? "花果路径第一步：今天中午用软刷轻刷花心一次，之后连续 3-5 天拍同一花序。"
      : "花果路径第一步：今天中午轻弹花序 5 秒，或用低速风扇轻吹，让花粉动起来。";
  }

  if (route.key === "root") {
    if (state.moisture === "wet" || state.climate === "humid" || sees(state, "green-surface") || sees(state, "white-fuzz") || (state.sensorMoisture !== null && state.sensorMoisture > 78)) {
      return "根区路径第一步：先暂停浇水或降低水位，给表面遮光并加强通风；48 小时后拍同一根区。";
    }
    if (state.medium === "xponge") {
      return "根区路径第一步：给 Xponge 边缘和表面遮光，只保留湿润界面，不让整片长期浸没。";
    }
    return "根区路径第一步：先检查排水、根区气味和基质干湿边界，今天不要继续加水加肥。";
  }

  if (route.key === "pest") {
    if (sees(state, "webbing")) {
      return "虫害路径第一步：先隔离植株，补拍叶背细网和移动小点，再用清水冲洗叶背。";
    }
    return "虫害路径第一步：先隔离这盆，补拍叶背或黄粘板；24 小时后看虫量是否下降。";
  }

  if (route.key === "leaf") {
    if (state.moisture === "dry" || state.moisture === "swing" || sees(state, "edge-dry")) {
      return "叶片路径第一步：先稳住水分，改成少量多次补水；3 天后拍同一片新叶和老叶。";
    }
    if (state.light === "low" || topTitle.includes("光照")) {
      return "叶片路径第一步：先把补光时间稳定下来，今天不要同时大改水肥。";
    }
    if (state.ph !== null || state.ec !== null) {
      return "叶片路径第一步：先复测 EC/pH，确认不是单次误差，再慢慢修正营养液。";
    }
    return "叶片路径第一步：先拍同一背景下的新叶和老叶，对比颜色后再决定是否调水肥。";
  }

  if (route.key === "plant") {
    if (has(state, "leggy") || sees(state, "long-internodes") || state.light === "low") {
      return "整株路径第一步：先调整灯距和补光时长，7 天后从侧面拍整株对比节间。";
    }
    return "整株路径第一步：先固定设备、灯距和浇水节奏，今天不要同时改多个变量。";
  }

  return null;
}

function buildCustomerActions(state, findings, matches = latestMatchedPathways) {
  const actions = [];
  const add = (text) => {
    if (text && !actions.includes(text)) actions.push(text);
  };
  const missing = requiredPhotoTypes(state).filter((type) => !capturedPhotoTypes.has(type));
  const route = diagnosisRoute(state);
  const primaryRouteAction = routePrimaryAction(state, findings);

  if (missing.length) {
    add(`先补拍${photoTypeLabel(missing[0])}，这张照片会提高诊断可信度。`);
  }

  if (!missing.length && primaryRouteAction) {
    add(primaryRouteAction);
  } else if (!missing.length && route) {
    add(`已进入${route.title}：先按这个方向处理，不要同时改太多变量。`);
  }

  if (matches[0]) {
    add(pathwayCustomerAction(matches[0]));
    add(`${matches[0].followup.when} 后拍 ${matches[0].followup.photo}；看到「${matches[0].followup.success}」就说明方向对了。`);
  }

  findings.slice(0, 2).forEach((finding) => add(fallbackCustomerAction(finding)));

  return actions.slice(0, 3);
}

function metric(label, value, unit = "") {
  if (value === null || value === undefined || value === "") return "";
  return `<div class="metric"><span>${label}</span><strong>${value}${unit}</strong></div>`;
}

function renderMetrics(state) {
  const xponge = xpongeAreaLiters(state);
  const device = currentDevice(state);
  const fit = device.cropFit[state.crop] || "caution";
  const items = [
    metric("设备适配", deviceFitLabel(fit), ""),
    metric("根区湿度", state.sensorMoisture, "%"),
    metric("光照", state.lightHours, "h"),
    metric("温度", state.temperature, "°C"),
    metric("空气湿度", state.humidity, "%"),
    metric("EC", state.ec, ""),
    metric("pH", state.ph, ""),
    xponge ? metric("Xponge 体积", xponge.volumeLiters.toFixed(1), "L") : "",
    xponge ? metric("根毯面积", xponge.area, "cm²") : "",
    metric("储液量", state.reservoir, "L")
  ].filter(Boolean);
  metricsStrip.innerHTML = items.length ? items.join("") : "<div class=\"metric\"><span>传感器</span><strong>暂无读数</strong></div>";
}

function renderDiagnosis(state, findings) {
  if (saveReportBtn) saveReportBtn.disabled = false;
  latestState = state;
  latestFindings = findings;
  latestMatchedPathways = matchKnowledgePathways(state);
  const top = findings[0];
  const device = currentDevice(state);
  syncCustomerIntakeState(state);
  renderCustomerStartPanel(state, findings);
  renderCropQuickChoices(state);
  readiness.textContent = customerHasStarted(state) ? "已生成" : "等待照片";
  mainRisk.textContent = top.title;
  mainSummary.textContent = `${cropNames[state.crop]} / ${mediumNames[state.medium]} / ${device.name}：${top.why}`;
  renderMetrics(state);
  renderReminders(state, findings);
  renderReminderSchedule(state, findings);
  renderFollowupLoop(state, findings);
  renderCustomerReminderSummary(state, findings);
  renderCustomerProgressSummary(state);
  renderCustomerSummary(state, findings);
  renderCustomerPlantDossier(state, findings);
  renderCustomerCaseTimeline();
  renderCustomerCompactPlan(state, findings);
  renderCustomerJourney(state, findings);
  renderConfidenceDecision(state, findings);
  renderPhotoQuality();
  renderCustomerPhotoRescue(state);
  renderGuidedPhotoCapture(state);
  renderBasilGuidance(state);

  renderList(causesList, findings, (item) =>
    `<strong>${item.title}</strong><span class="tag ${item.severity}">${severityLabel(item.severity)}</span><br>${item.why}`
  );

  const visibleActions = document.body.classList.contains("customer-mode")
    ? buildCustomerActions(state, findings, latestMatchedPathways)
    : findings.map((item) => item.action);
  renderList(actionsList, visibleActions, (item) => item);
  renderMatchedPathways(latestMatchedPathways);
  renderMinimalQuestions(state, latestMatchedPathways);
  renderTasks(state, findings);

  const plan = [
    ...basePlans[state.crop].monitor,
    state.medium === "xponge"
      ? "Xponge 原型建议记录：根毯面积、补水频率、储液量、表面藻霉、根色和根味。"
      : "每周固定拍照一次，记录光照时长、浇水量和环境温湿度。",
    state.hasPhoto ? "用同角度照片做 3 天、7 天复查，判断处方是否有效。" : "下一次诊断建议补充一张叶片和一张根区照片。"
  ];
  renderList(monitorList, plan, (item) => item);
  renderList(photoList, buildPhotoPlan(state), (item) => item);
  const graphFollowups = latestMatchedPathways.map((pathway) =>
    `图谱 ${pathway.id}：${pathway.followup.when} 后拍 ${pathway.followup.photo}；成功标准：${pathway.followup.success}`
  );
  renderList(followupList, [...buildFollowupPlan(state), ...graphFollowups], (item) => item);
  renderHistory();
  const nextAssistantSignature = assistantAdviceSignature(state, findings);
  if (nextAssistantSignature !== latestAssistantAdviceSignature) latestAssistantAdvice = null;
  reportOutput.value = buildReport(state, findings, latestMatchedPathways);
  maybeAutoArchiveCustomerDiagnosis(state, findings);
  refreshAssistantAdvice(state, findings);

  const opportunities = [
    basePlans[state.crop].opportunity,
    "把传感器读数翻译成阶段处方，是区别于普通湿度计的核心。",
    state.medium === "xponge"
      ? "Xponge 可形成专属模型：薄层根区水肥波动、遮光防藻、根毯面积与作物阶段绑定。"
      : "可加入基质模型：不同介质的干湿曲线和浇水提醒不同。",
    state.photoType !== "none" || state.visuals.length
      ? "结构化照片标签可以作为未来 AI 视觉模型的训练数据入口。"
      : "把照片采集标准化，可以比单纯上传图片更快积累可用数据。",
    has(state, "pests")
      ? "虫害模块适合做耗材闭环：粘虫板、BTI、安全喷剂和复查提醒。"
      : "后续可用照片识别虫害线索，提前提示隔离和复查。"
  ];
  renderList(opportunityList, opportunities, (item) => item);
  loadP2GrowthDashboard();
}

function runDiagnosis() {
  if (shouldBlockDiagnosisForCropIdentity()) {
    renderCropIdentityBlock(getFormState());
    return;
  }
  autoFillCustomerIntake();
  const state = getFormState();
  renderActiveCase(state);
  renderAutoIntakeCard(state);
  renderDiagnosis(state, diagnose(state));
}

function currentDiagnosisSnapshot() {
  const state = latestState || getFormState();
  const findings = latestFindings.length ? latestFindings : diagnose(state);
  return { state, findings };
}

function refreshCustomerTimeState() {
  if (!isCustomerModeActive()) return;
  const plan = getReminderPlan();
  if (!plan?.items?.length && !getLogs().length) return;
  const { state, findings } = currentDiagnosisSnapshot();
  renderReminderSchedule(state, findings);
  renderFollowupLoop(state, findings);
  renderCustomerReminderSummary(state, findings);
  renderCustomerProgressSummary(state);
  renderCustomerSummary(state, findings);
  renderCustomerPlantDossier(state, findings);
  renderCustomerCaseTimeline();
  renderCustomerCompactPlan(state, findings);
  renderCustomerJourney(state, findings);
  renderTasks(state, findings);
}

function startCustomerTimeRefresh() {
  if (customerTimeRefreshId) return;
  customerTimeRefreshId = window.setInterval(refreshCustomerTimeState, 60 * 1000);
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  hasRunSmartDiagnosis = true;
  trackP2Event("diagnosis_started", { source: "manual-submit" });
  runDiagnosis();
});

function setSelectValue(selector, value) {
  document.querySelector(selector).value = value;
}

function loadSample(config) {
  form.reset();
  capturedPhotoTypes = new Set(config.photoType ? [config.photoType] : []);
  hasRunSmartDiagnosis = true;
  requestedPhotoType = config.photoType || "plant";
  setSelectValue("#growDevice", config.device || "xponge-diy");
  setSelectValue("#crop", config.crop);
  setSelectValue("#stage", config.stage);
  setSelectValue("#medium", config.medium || "xponge");
  setSelectValue("#light", config.light);
  setSelectValue("#moisture", config.moisture);
  setSelectValue("#climate", config.climate);
  setSelectValue("#smartConcern", config.concern || "unknown");
  document.querySelector("#sensorMoisture").value = config.sensorMoisture ?? "";
  document.querySelector("#lightHours").value = config.lightHours ?? "";
  document.querySelector("#temperature").value = config.temperature ?? "";
  document.querySelector("#humidity").value = config.humidity ?? "";
  document.querySelector("#ec").value = config.ec ?? "";
  document.querySelector("#ph").value = config.ph ?? "";
  document.querySelector("#xpongeThickness").value = config.xpongeThickness ?? "1.5";
  document.querySelector("#xpongeLength").value = config.xpongeLength ?? "30";
  document.querySelector("#xpongeWidth").value = config.xpongeWidth ?? "40";
  document.querySelector("#reservoir").value = config.reservoir ?? "";
  const photoTypeInput = document.querySelector(`input[name="photoType"][value="${config.photoType || "plant"}"]`);
  if (photoTypeInput) photoTypeInput.checked = true;
  (config.symptoms || []).forEach((value) => {
    const input = document.querySelector(`input[value="${value}"]`);
    if (input) input.checked = true;
  });
  (config.visuals || []).forEach((value) => {
    const input = document.querySelector(`input[value="${value}"]`);
    if (input) input.checked = true;
  });
  document.querySelector("#notes").value = config.notes || "";
  updateCropHint();
  updateDeviceProfile();
  runDiagnosis();
}

sampleBtn.addEventListener("click", () => {
  loadSample({
    device: "xponge-diy",
    crop: "tomato",
    stage: "flowering",
    light: "low",
    moisture: "swing",
    climate: "hot",
    concern: "fruit",
    sensorMoisture: 32,
    lightHours: 11,
    temperature: 33,
    humidity: 48,
    ec: 1.2,
    ph: 6.4,
    reservoir: 3,
    photoType: "flower",
    symptoms: ["leggy", "no-fruit", "leaf-curl", "algae"],
    visuals: ["long-internodes", "flower-drop", "edge-dry", "green-surface"],
    notes: "1.5cm Xponge，30x40cm，矮生番茄开花后不坐果，边缘一天内变干，表面局部发绿。"
  });
});

sampleBasilBtn.addEventListener("click", () => {
  loadSample({
    device: "letpot",
    crop: "basil",
    stage: "vegetative",
    light: "low",
    moisture: "stable",
    climate: "dry",
    concern: "leggy",
    sensorMoisture: 48,
    lightHours: 8,
    temperature: 25,
    humidity: 38,
    ec: 1.1,
    ph: 6.2,
    reservoir: 2,
    photoType: "plant",
    symptoms: ["leggy", "yellow-leaves"],
    visuals: ["long-internodes", "pale-new-growth"],
    notes: "盆栽罗勒节间变长、叶片变淡，已经两周没有掐顶，香味变弱。"
  });
});

sampleRosemaryBtn.addEventListener("click", () => {
  loadSample({
    device: "balcony",
    crop: "rosemary",
    stage: "vegetative",
    light: "medium",
    moisture: "wet",
    climate: "humid",
    concern: "root",
    sensorMoisture: 82,
    lightHours: 10,
    temperature: 23,
    humidity: 72,
    ec: 0.9,
    ph: 6.5,
    reservoir: 1.5,
    photoType: "root",
    symptoms: ["yellow-leaves", "wilting", "algae"],
    visuals: ["lower-yellowing", "white-fuzz", "green-surface"],
    notes: "迷迭香小苗下部叶片发黄，根区长期潮湿，表面有白色絮状物，通风一般。"
  });
});

sampleStrawberryBtn.addEventListener("click", () => {
  loadSample({
    device: "clickgrow",
    crop: "strawberry",
    stage: "flowering",
    light: "medium",
    moisture: "wet",
    climate: "humid",
    concern: "fruit",
    sensorMoisture: 76,
    lightHours: 12,
    temperature: 26,
    humidity: 68,
    ec: 1.6,
    ph: 6.1,
    reservoir: 3,
    photoType: "flower",
    symptoms: ["no-fruit", "spots", "algae"],
    visuals: ["flower-drop", "white-fuzz", "green-surface"],
    notes: "盆栽草莓开花后果形不整齐，部分花心发黑，冠部附近偏潮湿。"
  });
});

samplePepperBtn.addEventListener("click", () => {
  loadSample({
    device: "aerogarden",
    crop: "pepper",
    stage: "flowering",
    light: "low",
    moisture: "swing",
    climate: "hot",
    concern: "fruit",
    sensorMoisture: 36,
    lightHours: 10,
    temperature: 34,
    humidity: 42,
    ec: 1.4,
    ph: 6.3,
    reservoir: 3,
    photoType: "flower",
    symptoms: ["leggy", "no-fruit", "leaf-curl", "wilting"],
    visuals: ["long-internodes", "flower-drop", "edge-dry"],
    notes: "矮生辣椒开花后连续落花，灯下温度偏高，根区一天内忽干忽湿。"
  });
});

cropSelect.addEventListener("change", () => {
  updateCropHint();
  updateDeviceProfile();
  runDiagnosis();
});

growDeviceSelect.addEventListener("change", () => {
  applyDeviceTemplate({ force: true });
  runDiagnosis();
});

applyDevicePlanBtn.addEventListener("click", applyDevicePlan);
editAutoIntakeBtn.addEventListener("click", () => {
  setMode("expert");
  document.querySelector("#stage")?.focus();
});

customerModeBtn.addEventListener("click", () => setMode("customer"));
expertModeBtn.addEventListener("click", () => setMode("expert"));
customerInternalBtn?.addEventListener("click", () => setMode("expert"));
localeButtons.forEach((button) => {
  button.addEventListener("click", () => setLocale(button.dataset.localeOption));
});
customerCameraBtn?.addEventListener("click", openGuidedPhotoUpload);
customerCheckPlantBtn?.addEventListener("click", handleCustomerPrimaryAction);
customerBackBtn?.addEventListener("click", resetCustomerPlantDossier);
customerPrivacyTopBtn?.addEventListener("click", () => {
  const resultStage = ["action", "followup"].includes(customerAppShell?.dataset.state);
  const detail = resultStage ? customerMobilePrivacyDetail : customerPhotoPrivacyDetail;
  if (!detail) return;
  const expanded = detail.hidden === false;
  detail.hidden = expanded;
  customerPrivacyTopBtn.setAttribute("aria-expanded", String(!expanded));
  customerPrivacyTopBtn.setAttribute("aria-controls", detail.id);
});
customerMobilePrivacyBtn?.addEventListener("click", () => {
  const expanded = customerMobilePrivacyDetail?.hidden === false;
  if (customerMobilePrivacyDetail) customerMobilePrivacyDetail.hidden = expanded;
  customerMobilePrivacyBtn.setAttribute("aria-expanded", String(!expanded));
});
customerPhotoEntryBtn?.addEventListener("click", () => setCustomerEntryMode("photo"));
customerCareEntryBtn?.addEventListener("click", () => setCustomerEntryMode("care"));
cropQuickButtons.forEach((button) => {
  button.addEventListener("click", () => chooseCustomerCrop(button.dataset.cropChoice));
});
customerCareModeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const nextMode = button.dataset.customerCareMode;
    if (!carePlansForCrop(getFormState().crop)[nextMode]) return;
    basilGuideMode = nextMode;
    try {
      localStorage.setItem(basilGuideStorageKey, nextMode);
    } catch {
      // The selected care mode still works for this session if storage is blocked.
    }
    renderBasilGuidance();
    renderCustomerMobileExperience(latestState || getFormState());
  });
});
basilGuideModeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const nextMode = button.dataset.basilGuideMode;
    if (!carePlansForCrop(getFormState().crop)[nextMode]) return;
    basilGuideMode = nextMode;
    try {
      localStorage.setItem(basilGuideStorageKey, nextMode);
    } catch {
      // Local storage may be blocked in private browsing; the in-memory mode still works.
    }
    renderBasilGuidance();
    renderCustomerMobileExperience(latestState || getFormState());
  });
});
smartDiagnoseBtn.addEventListener("click", smartDiagnose);
smartConcern.addEventListener("change", () => {
  dismissCustomerResetUndo();
  autoFillCustomerIntake({ forceStage: true });
  updateDeviceProfile();
  hasRunSmartDiagnosis = true;
  runDiagnosis();
});

function openGuidedPhotoUpload() {
  dismissCustomerResetUndo();
  const instruction = guidedPhotoInstruction();
  if (instruction.type) {
    requestedPhotoType = instruction.type;
    setPhotoType(instruction.type);
  }
  let pickerPrompt = null;
  if (document.body.classList.contains("customer-mode")) {
    const prompt = customerFirstPhotoPrompt({ ...getFormState(), photoType: instruction.type || getFormState().photoType });
    pickerPrompt = { ...prompt, type: instruction.type || prompt.type, label: photoTypeLabel(instruction.type || prompt.type) };
    setCustomerPhotoPickerOpen(pickerPrompt);
  }
  plantPhoto.click();
  if (pickerPrompt) scheduleCustomerPhotoPickerCancelCheck(pickerPrompt);
}

function openPhotoRescueUpload(type) {
  dismissCustomerResetUndo();
  const targetType = type || requestedPhotoType || nextPhotoSuggestion().type || "plant";
  requestedPhotoType = targetType;
  setPhotoType(targetType);
  if (photoHint) photoHint.textContent = `本次补拍已锁定为${photoTypeLabel(targetType)}。`;
  if (autoPhotoTypeBadge) autoPhotoTypeBadge.textContent = `补拍照片：${photoTypeLabel(targetType)}`;
  let pickerPrompt = null;
  if (document.body.classList.contains("customer-mode")) {
    pickerPrompt = {
      ...customerFirstPhotoPrompt({ ...getFormState(), photoType: targetType }),
      type: targetType,
      label: photoTypeLabel(targetType)
    };
    setCustomerPhotoPickerOpen(pickerPrompt);
  }
  plantPhoto.click();
  if (pickerPrompt) scheduleCustomerPhotoPickerCancelCheck(pickerPrompt);
}

function openSuggestedPhotoUpload() {
  if (visionNeedsCropCheck()) {
    openPhotoRescueUpload("plant");
    return;
  }
  const plan = customerPhotoRescuePlan() || nextPhotoSuggestion();
  openPhotoRescueUpload(plan.type);
}

function openFollowupUpload() {
  const loop = followupLoopInstruction();
  applyFollowupPhotoTarget(loop);
  followupPhoto.click();
}

function focusCustomerTarget(target) {
  if (!target) return;
  target.scrollIntoView({ behavior: "smooth", block: "center" });
  target.classList.add("soft-focus");
  window.setTimeout(() => target.classList.remove("soft-focus"), 1200);
}

function setPhotoProcessingState(processing, message = "") {
  document.body.classList.toggle("photo-processing", Boolean(processing));
  renderCustomerMobileExperience(latestState || getFormState());
  if (autoPhotoTypeBadge) autoPhotoTypeBadge.textContent = processing ? "正在识别照片" : (message || autoPhotoTypeBadge.textContent);
  if (processing && photoHint) photoHint.textContent = message || "正在读取照片，马上生成诊断。";
}

function focusPhotoDiagnosisResult() {
  if (!document.body.classList.contains("customer-mode")) return;
  window.setTimeout(() => {
    const target = document.querySelector(".customer-diagnosis-result")
      || (customerPlantDossier && !customerPlantDossier.hidden ? customerPlantDossier : customerPlanCompact);
    focusCustomerTarget(target);
  }, 80);
}

function setFollowupProcessingState(processing, message = "") {
  document.body.classList.toggle("followup-processing", Boolean(processing));
  if (processing) {
    followupLoopUploadBtn.disabled = true;
    followupLoopUploadBtn.textContent = "正在对比复查照";
    if (message) followupLoopVerdict.textContent = message;
    return;
  }
  const state = latestState || getFormState();
  const findings = latestFindings.length ? latestFindings : diagnose(state);
  const loop = followupLoopInstruction(state, findings);
  const target = followupPhotoTarget(loop);
  followupLoopUploadBtn.disabled = loop.disabled;
  followupLoopUploadBtn.textContent = loop.disabled ? "等待诊断" : loop.due ? `拍${target.label}复查照` : "上传复查照";
}

async function processPlantPhotoDataUrl(dataUrl, file = {}, options = {}) {
  photoPreview.src = dataUrl;
  photoPreview.classList.add("visible");
  document.body.classList.add("has-plant-photo");
  const source = options.source || "file";
  const fileName = file?.name || (source === "camera" ? `camera-${Date.now()}.jpg` : "照片");
  setPhotoProcessingState(true, `已载入：${fileName}，正在识别照片并生成诊断。`);
  try {
    const signals = await analyzeImageSignals(dataUrl);
    photoSignals = signals;
    setPhotoType(requestedPhotoType || "plant");
    inferFromFileName({ name: fileName });
    applyPhotoSignals();
    const detection = detectUploadedPhotoType({ name: fileName }, signals, getFormState());
    const currentPhotoType = applyPhotoTypeDetection(detection);
    const vision = await analyzePhotoWithVision(dataUrl, { name: fileName }, {
      photoType: currentPhotoType,
      skipHints: true,
      source
    });
    const gate = photoQualityGate(signals, currentPhotoType, detection, vision);
    latestPhotoQualityGate = gate;
    updateAiPipelineSnapshot(getFormState(), {
      vision,
      gate,
      detection,
      photoType: currentPhotoType,
      hasImage: true
    });
    renderPhotoReview(gate, fileName);
    const needsCropCheck = visionNeedsCropCheck(vision);
    if (gate.canContinue) {
      if (vision && !needsCropCheck) applyVisionHints(vision);
      if (needsCropCheck) {
        trackP2Event("photo_crop_unconfirmed", {
          photoType: currentPhotoType,
          source,
          requestedCropKey: vision?.requestedCropKey || getFormState().crop,
          detectedCropKey: vision?.detectedCropKey || "unknown"
        });
      } else {
        capturedPhotoTypes.add(currentPhotoType);
        trackP2Event("photo_completed", { photoType: currentPhotoType, source, gate: gate.state });
        saveBaselinePhotoSignals(currentPhotoType, signals);
      }
      photoHint.textContent = `已自动识别为${photoTypeLabel(currentPhotoType)}：${fileName}。${source === "camera" ? "相机照片" : "照片"}${gate.state === "warn" ? "可继续使用，也可以重拍优化。" : "已通过质检，诊断已更新。"}`;
      hasRunSmartDiagnosis = !needsCropCheck;
      if (needsCropCheck) {
        const selected = cropNames[getFormState().crop] || "所选作物";
        photoHint.textContent = vision?.cropMismatch
          ? `这张照片不像${selected}，请重新选择作物或补拍整株。`
          : `这张照片还不能确认是${selected}，请补拍整株后再诊断。`;
        photoHint.textContent = cropVerificationHint(vision, selected);
      } else {
        trackP2Event("diagnosis_started", { source: "photo", photoType: currentPhotoType });
      }
    } else {
      photoHint.textContent = `这张${photoTypeLabel(currentPhotoType)}暂时看不准：${gate.message}`;
      hasRunSmartDiagnosis = false;
    }
    if (needsCropCheck) renderCustomerMobileExperience(getFormState());
    else runDiagnosis();
    await syncPublicPhotoCaptureResult({
      fileName,
      photoType: currentPhotoType,
      gate,
      vision,
      source,
      signals
    });
    if (gate.canContinue && !needsCropCheck) focusPhotoDiagnosisResult();
    else focusCustomerTarget(photoReviewCard || customerPhotoRescueCard);
  } catch {
    if (autoPhotoTypeBadge) autoPhotoTypeBadge.textContent = "识别失败";
    if (photoHint) photoHint.textContent = "照片没有读取成功，请换一张清晰照片重试。";
    latestPhotoQualityGate = photoQualityGate({ width: null, height: null }, requestedPhotoType || "plant");
    renderPhotoReview(latestPhotoQualityGate, fileName);
  } finally {
    setPhotoProcessingState(false);
  }
}

function nativeCameraSupported() {
  return Boolean(navigator.mediaDevices?.getUserMedia && nativeCameraVideo && nativeCameraCanvas);
}

function stopNativeCamera() {
  if (nativeCameraStream) {
    nativeCameraStream.getTracks().forEach((track) => track.stop());
    nativeCameraStream = null;
  }
  if (nativeCameraVideo) nativeCameraVideo.srcObject = null;
  if (nativeCameraCard) nativeCameraCard.hidden = true;
  document.body.classList.remove("native-camera-open");
}

async function openNativeCamera() {
  dismissCustomerResetUndo();
  if (!nativeCameraSupported()) {
    if (nativeCameraStatus) nativeCameraStatus.textContent = "当前浏览器不支持直接相机，已切换到相册/文件选择。";
    openGuidedPhotoUpload();
    return;
  }
  const instruction = guidedPhotoInstruction();
  if (instruction.type) {
    requestedPhotoType = instruction.type;
    setPhotoType(instruction.type);
  }
  try {
    nativeCameraCard.hidden = false;
    document.body.classList.add("native-camera-open");
    nativeCameraStatus.textContent = `正在打开相机。请拍${photoTypeLabel(requestedPhotoType || "plant")}，拍完会自动质检。`;
    nativeCameraStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: "environment" },
        width: { ideal: 1280 },
        height: { ideal: 960 }
      },
      audio: false
    });
    nativeCameraVideo.srcObject = nativeCameraStream;
    await nativeCameraVideo.play();
    nativeCameraStatus.textContent = `相机已打开：把${photoTypeLabel(requestedPhotoType || "plant")}放进画面，尽量稳定后点击拍下。`;
  } catch {
    stopNativeCamera();
    if (nativeCameraStatus) nativeCameraStatus.textContent = "相机没有打开，已切换到相册/文件选择。";
    openGuidedPhotoUpload();
  }
}

async function captureNativeCameraFrame() {
  if (!nativeCameraVideo || !nativeCameraCanvas || !nativeCameraStream) {
    openGuidedPhotoUpload();
    return;
  }
  const width = nativeCameraVideo.videoWidth || 1280;
  const height = nativeCameraVideo.videoHeight || 960;
  nativeCameraCanvas.width = width;
  nativeCameraCanvas.height = height;
  const context = nativeCameraCanvas.getContext("2d");
  context.drawImage(nativeCameraVideo, 0, 0, width, height);
  const dataUrl = nativeCameraCanvas.toDataURL("image/jpeg", 0.86);
  const photoType = requestedPhotoType || "plant";
  stopNativeCamera();
  await processPlantPhotoDataUrl(dataUrl, { name: `camera-${photoType}-${Date.now()}.jpg` }, { source: "camera" });
}

quickPhotoBtn.addEventListener("click", openNativeCamera);
nativeCameraBtn?.addEventListener("click", openNativeCamera);
nativeCameraShotBtn?.addEventListener("click", captureNativeCameraFrame);
nativeCameraCloseBtn?.addEventListener("click", stopNativeCamera);
guidedPhotoUploadBtn.addEventListener("click", openGuidedPhotoUpload);
customerPhotoRescueBtn.addEventListener("click", openSuggestedPhotoUpload);

followupLoopUploadBtn.addEventListener("click", openFollowupUpload);

function runCustomerPrimaryAction(action) {
  if (action === "guided-photo") {
    openNativeCamera();
    return;
  }
  if (action === "suggested-photo") {
    openSuggestedPhotoUpload();
    return;
  }
  if (action === "followup") {
    openFollowupUpload();
    return;
  }
  if (action === "care-complete") {
    const state = getFormState();
    const model = customerCareModel(state);
    const record = {
      signature: customerCareSignature(model),
      cropKey: model.cropKey,
      mode: model.mode,
      action: model.action,
      completedAt: new Date().toISOString()
    };
    writeCustomerCareRecord(record);
    refreshAfterCareAction(state, model, record);
    focusCustomerTarget(customerReminderCard || customerCareCard);
    return;
  }
  if (action === "complete-current-task") {
    const state = getFormState();
    const findings = latestFindings.length ? latestFindings : diagnose(state);
    const task = currentCustomerTask(state, findings);
    if (!task) {
      focusCustomerTarget(customerReminderCard);
      return;
    }
    const record = setTaskCompletion(task.id, task.text, true);
    refreshAfterCustomerAction(state, findings, task.text, record);
    focusCustomerTarget(customerReminderCard);
    return;
  }
  if (action === "followup-panel") {
    focusCustomerTarget(followupLoopCard);
    return;
  }
  if (action === "progress") {
    focusCustomerTarget(customerProgressCard);
    return;
  }
  focusCustomerTarget(mainRisk);
}

function handleCustomerPrimaryAction(event) {
  runCustomerPrimaryAction(event.currentTarget.dataset.action);
}

function cssSelectorValue(value) {
  const text = String(value ?? "");
  return window.CSS?.escape ? CSS.escape(text) : text.replace(/"/g, "\\\"");
}

function formDraftSnapshot() {
  return Array.from(form.elements)
    .filter((element) => element.name || element.id)
    .filter((element) => element.type !== "file" && element.type !== "button" && element.type !== "submit")
    .map((element) => ({
      selector: element.id ? `#${element.id}` : `[name="${element.name}"][value="${cssSelectorValue(element.value)}"]`,
      name: element.name,
      type: element.type,
      value: element.value,
      checked: Boolean(element.checked)
    }));
}

function restoreFormDraft(draft = []) {
  draft.forEach((item) => {
    let element = document.querySelector(item.selector);
    if (!element && item.name) {
      element = document.querySelector(`[name="${item.name}"][value="${cssSelectorValue(item.value)}"]`);
    }
    if (!element) return;
    if (element.type === "checkbox" || element.type === "radio") {
      element.checked = item.checked;
    } else {
      element.value = item.value;
    }
  });
}

function snapshotCustomerPlantBeforeReset() {
  return {
    formDraft: formDraftSnapshot(),
    localStorage: {
      [reminderPlanKey]: localStorage.getItem(reminderPlanKey),
      [baselinePhotoKey]: localStorage.getItem(baselinePhotoKey),
      [customerAutoArchiveKey]: localStorage.getItem(customerAutoArchiveKey),
      [historyKey]: localStorage.getItem(historyKey),
      [tasksKey]: localStorage.getItem(tasksKey),
      [activeCaseKey]: localStorage.getItem(activeCaseKey)
    },
    capturedPhotoTypes: Array.from(capturedPhotoTypes),
    hasRunSmartDiagnosis,
    requestedPhotoType,
    latestVisionResult,
    latestPhotoTypeDetection,
    latestPhotoQualityGate,
    latestAiPipelineSnapshot,
    customerCaseTimelineCache,
    latestMatchedPathways,
    photoSignals: { ...photoSignals },
    photoPreviewSrc: photoPreview.getAttribute("src"),
    photoPreviewVisible: photoPreview.classList.contains("visible"),
    bodyClasses: {
      hasPlantPhoto: document.body.classList.contains("has-plant-photo"),
      followupDue: document.body.classList.contains("customer-followup-due")
    }
  };
}

function restorePreviousCustomerPlant() {
  const snapshot = customerResetSnapshot;
  if (!snapshot) return;
  Object.entries(snapshot.localStorage || {}).forEach(([key, value]) => {
    if (value === null || value === undefined) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  });
  restoreFormDraft(snapshot.formDraft);
  capturedPhotoTypes = new Set(snapshot.capturedPhotoTypes || []);
  hasRunSmartDiagnosis = Boolean(snapshot.hasRunSmartDiagnosis);
  requestedPhotoType = snapshot.requestedPhotoType || "plant";
  latestVisionResult = snapshot.latestVisionResult || null;
  latestPhotoTypeDetection = snapshot.latestPhotoTypeDetection || null;
  latestPhotoQualityGate = snapshot.latestPhotoQualityGate || null;
  latestAiPipelineSnapshot = snapshot.latestAiPipelineSnapshot || null;
  customerCaseTimelineCache = snapshot.customerCaseTimelineCache || null;
  latestMatchedPathways = snapshot.latestMatchedPathways || [];
  photoSignals = snapshot.photoSignals || {
    greenRatio: null,
    yellowRatio: null,
    darkRatio: null,
    brightness: null,
    contrast: null,
    width: null,
    height: null
  };
  if (snapshot.photoPreviewSrc) {
    photoPreview.src = snapshot.photoPreviewSrc;
    photoPreview.classList.toggle("visible", Boolean(snapshot.photoPreviewVisible));
  } else {
    photoPreview.removeAttribute("src");
    photoPreview.classList.remove("visible");
  }
  if (latestPhotoQualityGate) renderPhotoReview(latestPhotoQualityGate);
  else hidePhotoReview();
  document.body.classList.toggle("has-plant-photo", Boolean(snapshot.bodyClasses?.hasPlantPhoto));
  document.body.classList.toggle("customer-followup-due", Boolean(snapshot.bodyClasses?.followupDue));
  if (plantPhoto) plantPhoto.value = "";
  if (followupPhoto) followupPhoto.value = "";
  updateDeviceProfile();
  runDiagnosis();
  setCustomerArchiveStatus("已撤销，回到上一株植物。", "saved");
  customerResetSnapshot = null;
  focusCustomerTarget(customerPlantDossier || document.querySelector(".customer-summary"));
}

function resetCustomerPlantDossier() {
  stopNativeCamera();
  customerResetSnapshot = snapshotCustomerPlantBeforeReset();
  form.reset();
  capturedPhotoTypes = new Set();
  hasRunSmartDiagnosis = false;
  requestedPhotoType = "plant";
  customerAutoArchiveInFlightSignature = null;
  latestVisionResult = null;
  latestPhotoTypeDetection = null;
  latestPhotoQualityGate = null;
  latestAiPipelineSnapshot = null;
  customerCaseTimelineCache = null;
  customerCaseTimelineInFlightKey = null;
  latestMatchedPathways = [];
  photoSignals = {
    greenRatio: null,
    yellowRatio: null,
    darkRatio: null,
    brightness: null,
    contrast: null,
    width: null,
    height: null
  };
  localStorage.removeItem(reminderPlanKey);
  localStorage.removeItem(baselinePhotoKey);
  localStorage.removeItem(customerAutoArchiveKey);
  localStorage.removeItem(historyKey);
  localStorage.removeItem(tasksKey);
  localStorage.removeItem(activeCaseKey);
  setPhotoType("none");
  if (plantPhoto) plantPhoto.value = "";
  if (followupPhoto) followupPhoto.value = "";
  photoPreview.removeAttribute("src");
  photoPreview.classList.remove("visible");
  hidePhotoReview();
  document.body.classList.remove("has-plant-photo", "customer-followup-due");
  clearCustomerFirstPhotoReady();
  if (autoPhotoTypeBadge) autoPhotoTypeBadge.textContent = "等待自动识别";
  if (photoHint) photoHint.textContent = "上传叶片、花序或根区照片后，系统会自动提取基础线索；也可以直接选择主要困扰。";
  if (caseDetail) caseDetail.value = "";
  if (caseTimeline) caseTimeline.innerHTML = "<div class=\"case-empty-timeline\">新植物还没有诊断记录。</div>";
  renderCustomerCaseTimeline(null);
  if (caseStatus) caseStatus.textContent = "已准备记录新植物。";
  updateDeviceProfile();
  runDiagnosis();
  setCustomerArchiveUndoStatus();
  focusCustomerTarget(document.querySelector(".customer-summary"));
}

customerPrimaryActionBtn.addEventListener("click", handleCustomerPrimaryAction);
customerCompactActionBtn.addEventListener("click", handleCustomerPrimaryAction);
customerDossierContinueBtn.addEventListener("click", handleCustomerPrimaryAction);
customerDossierNewBtn.addEventListener("click", resetCustomerPlantDossier);
customerDeleteLocalDataBtn?.addEventListener("click", () => {
  resetCustomerPlantDossier();
  setCustomerArchiveStatus("本机照片预览、基线和复查记录已清除。", "saved");
});
photoRetakeBtn?.addEventListener("click", () => {
  const type = latestPhotoQualityGate?.photoType || requestedPhotoType || nextPhotoSuggestion().type || "plant";
  openPhotoRescueUpload(type);
});
photoContinueBtn?.addEventListener("click", () => {
  if (latestPhotoQualityGate && !latestPhotoQualityGate.canContinue) {
    openPhotoRescueUpload(latestPhotoQualityGate.photoType);
    return;
  }
  focusPhotoDiagnosisResult();
});

plantPhoto.addEventListener("change", () => {
  const file = plantPhoto.files && plantPhoto.files[0];
  if (!file) {
    clearCustomerFirstPhotoReady();
    hidePhotoReview();
    photoPreview.removeAttribute("src");
    photoPreview.classList.remove("visible");
    document.body.classList.remove("has-plant-photo");
    photoHint.textContent = "可上传叶片、花序或根区照片；当前版本先做预览和视觉线索记录。";
    hasRunSmartDiagnosis = false;
    latestVisionResult = null;
    latestPhotoTypeDetection = null;
    latestAiPipelineSnapshot = null;
    if (autoPhotoTypeBadge) autoPhotoTypeBadge.textContent = "等待自动识别";
    runDiagnosis();
    return;
  }
  dismissCustomerResetUndo();
  clearCustomerFirstPhotoReady();
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    processPlantPhotoDataUrl(reader.result, file, { source: "file" });
  });
  reader.addEventListener("error", () => {
    if (autoPhotoTypeBadge) autoPhotoTypeBadge.textContent = "识别失败";
    if (photoHint) photoHint.textContent = "照片没有读取成功，请换一张清晰照片重试。";
    latestPhotoQualityGate = photoQualityGate({ width: null, height: null }, requestedPhotoType || "plant");
    renderPhotoReview(latestPhotoQualityGate, file.name);
  });
  reader.readAsDataURL(file);
});

useNextPhotoBtn.addEventListener("click", () => {
  openSuggestedPhotoUpload();
});

resetPhotoCheckBtn.addEventListener("click", () => {
  stopNativeCamera();
  capturedPhotoTypes = new Set();
  hasRunSmartDiagnosis = false;
  requestedPhotoType = "plant";
  localStorage.removeItem(reminderPlanKey);
  localStorage.removeItem(baselinePhotoKey);
  localStorage.removeItem(customerAutoArchiveKey);
  latestVisionResult = null;
  latestPhotoTypeDetection = null;
  latestPhotoQualityGate = null;
  latestAiPipelineSnapshot = null;
  customerCaseTimelineCache = null;
  customerCaseTimelineInFlightKey = null;
  photoSignals = {
    greenRatio: null,
    yellowRatio: null,
    darkRatio: null,
    brightness: null,
    contrast: null,
    width: null,
    height: null
  };
  photoPreview.removeAttribute("src");
  photoPreview.classList.remove("visible");
  hidePhotoReview();
  document.body.classList.remove("has-plant-photo");
  clearCustomerFirstPhotoReady();
  if (autoPhotoTypeBadge) autoPhotoTypeBadge.textContent = "等待自动识别";
  plantPhoto.value = "";
  photoHint.textContent = "上传叶片、花序或根区照片后，系统会自动提取基础线索；也可以直接选择主要困扰。";
  renderCustomerCaseTimeline(null);
  runDiagnosis();
});

async function saveFollowupLog(options = {}) {
  const state = latestState || getFormState();
  const findings = latestFindings.length ? latestFindings : diagnose(state);
  const logs = getLogs();
  const dayNames = {
    auto: checkDay.selectedOptions[0].textContent,
    "24h": "24 小时",
    "48h": "48 小时",
    day3: "第 3 天",
    day7: "第 7 天"
  };

  const log = {
    id: crypto.randomUUID ? crypto.randomUUID() : `followup-${Date.now()}`,
    at: new Date().toISOString(),
    day: dayNames[checkDay.value] || "今天",
    photoType: options.photoType || requestedPhotoType || state.photoType || "plant",
    leaf: leafProgress.value,
    flower: flowerProgress.value,
    pest: pestProgress.value,
    notes: logNotes.value.trim(),
    autoSignals: photoSignals,
    autoSaved: options.auto === true,
    source: options.auto ? "customer-photo-upload" : "manual-review"
  };

  const previousLog = logs[logs.length - 1] || null;
  log.routeAssessment = routeFollowupAssessment(state, log, previousLog, options.comparison || null);

  logs.push(log);
  setLogs(logs);
  trackP2Event("followup_returned", {
    photoType: log.photoType,
    outcome: log.routeAssessment?.state || "unknown"
  });
  completeReminder(checkDay.value);
  touchCustomerArchiveRecord({
    lastEvent: "followup",
    followupAt: log.at,
    followupLogId: log.id,
    followupState: log.routeAssessment?.state || null,
    followupTitle: log.routeAssessment?.title || null,
    followupNext: log.routeAssessment?.next || null
  });
  logNotes.value = "";
  runDiagnosis();

  if (options.syncCase !== false) {
    await syncFollowupCaseRecord(log, state, findings, options);
  }

  return log;
}

saveLogBtn.addEventListener("click", async () => {
  saveLogBtn.disabled = true;
  await saveFollowupLog();
  saveLogBtn.disabled = false;
});

followupPhoto.addEventListener("change", () => {
  const file = followupPhoto.files && followupPhoto.files[0];
  if (!file) return;
  setFollowupProcessingState(true, `已载入：${file.name}，正在对比复查照。`);
  const showFollowupPhotoError = () => {
    setFollowupProcessingState(false);
    followupLoopVerdict.textContent = "复查照片没有读取成功，请换一张清晰照片重试。";
  };
  const reader = new FileReader();
  reader.addEventListener("error", showFollowupPhotoError);
  reader.addEventListener("load", () => {
    analyzeImageSignals(reader.result).then(async (signals) => {
      try {
        photoSignals = signals;
        const photoType = requestedPhotoType || getFormState().photoType || "leaf";
        await analyzePhotoWithVision(reader.result, file, {
          photoType,
          mode: "followup",
          checkDay: checkDay.value
        });
        const comparison = await compareFollowupWithVision(reader.result, file, signals);

        if (signals.yellowRatio !== null && signals.yellowRatio > 0.22) {
          leafProgress.value = "worse";
        } else if (signals.greenRatio !== null && signals.greenRatio > 0.32) {
          leafProgress.value = "better";
        }

        if (signals.greenRatio !== null && signals.greenRatio > 0.36 && checkDay.value === "48h") {
          pestProgress.value = "worse";
        }

        if (signals.darkRatio !== null && signals.darkRatio > 0.45) {
          leafProgress.value = "worse";
        }

        if (comparison?.trend === "improved") leafProgress.value = "better";
        if (comparison?.trend === "worse") leafProgress.value = "worse";

        const trendText = {
          improved: "前后对比显示正在改善",
          worse: "前后对比显示有加重迹象",
          unchanged: "前后对比变化不明显"
        }[comparison?.trend];
        const comparisonNote = trendText ? ` ${trendText}。` : "";
        logNotes.value = `复查照片已自动读取：黄度 ${(signals.yellowRatio * 100).toFixed(0)}%，绿度 ${(signals.greenRatio * 100).toFixed(0)}%，暗部 ${(signals.darkRatio * 100).toFixed(0)}%。${comparisonNote}`;
        const existingLogs = getLogs();
        const previewLog = {
          photoType,
          leaf: leafProgress.value,
          flower: flowerProgress.value,
          pest: pestProgress.value,
          notes: logNotes.value.trim(),
          autoSignals: signals,
          autoSaved: true,
          source: "customer-photo-upload"
        };
        const assessment = routeFollowupAssessment(
          getFormState(),
          previewLog,
          existingLogs[existingLogs.length - 1] || null,
          comparison
        );
        followupLoopVerdict.textContent = `刚刚上传的复查照：${assessment.title}。${assessment.message}`;

        if (document.body.classList.contains("customer-mode")) {
          let savedLog;
          try {
            savedLog = await saveFollowupLog({ auto: true, photoType, comparison });
          } catch {
            followupPhoto.value = "";
            followupLoopVerdict.textContent = "复查照片已读取，但复查记录没有保存成功，请稍后再试。";
            customerReminderMessage.textContent = "复查照片已读取，后台保存暂时失败。";
            focusCustomerTarget(followupLoopCard);
            return;
          }
          const savedAssessment = savedLog.routeAssessment || assessment;
          followupPhoto.value = "";
          followupLoopVerdict.textContent = `复查照片已自动保存：${savedAssessment.title}。${savedAssessment.next}`;
          customerReminderMessage.textContent = `复查记录已保存：${savedAssessment.next}`;
          focusCustomerTarget(customerPlantDossier || followupLoopCard);
        }
      } finally {
        setFollowupProcessingState(false);
      }
    }).catch(showFollowupPhotoError);
  });
  reader.readAsDataURL(file);
});

resetTasksBtn.addEventListener("click", () => {
  localStorage.removeItem(tasksKey);
  runDiagnosis();
});

copyReportBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(reportOutput.value);
    copyStatus.textContent = "已复制到剪贴板。";
  } catch {
    reportOutput.focus();
    reportOutput.select();
    document.execCommand("copy");
    copyStatus.textContent = "已选中报告，可手动复制。";
  }
});

saveReportBtn.addEventListener("click", async () => {
  if (shouldBlockDiagnosisForCropIdentity() || !latestFindings.length) {
    renderCropIdentityBlock(getFormState());
    return;
  }
  try {
    const response = await fetch("/api/reports", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(reportPayload(latestState, latestFindings))
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const saved = await response.json();
    copyStatus.textContent = `已入库：${saved.id}`;
    await loadReports();
    await loadCases();
    await syncCaseNotifications({ silent: true });
    await loadInsights();
    await loadOpportunityRanks();
    await loadExperiments();
    await loadP2GrowthDashboard();
  } catch {
    copyStatus.textContent = "入库失败：请确认本地服务正在运行 server.mjs。";
  }
});

refreshDbBtn.addEventListener("click", loadReports);
refreshCasesBtn.addEventListener("click", loadCases);
notificationChannelInputs.forEach((input) => {
  input.addEventListener("change", () => saveNotificationChannelConfig({ silent: true }));
});
notificationEmailTarget.addEventListener("input", () => saveNotificationChannelConfig({ silent: true }));
notificationSmsTarget.addEventListener("input", () => saveNotificationChannelConfig({ silent: true }));
notificationWechatTarget.addEventListener("input", () => saveNotificationChannelConfig({ silent: true }));
saveNotificationChannelsBtn.addEventListener("click", () => {
  saveNotificationChannelConfig();
  loadNotifications();
});
refreshNotificationsBtn.addEventListener("click", loadNotifications);
syncCaseNotificationsBtn.addEventListener("click", syncCaseNotifications);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) refreshCustomerTimeState();
});
newCaseBtn.addEventListener("click", () => {
  const next = createCaseState(getFormState());
  setActiveCase(next);
  localStorage.removeItem(customerAutoArchiveKey);
  renderActiveCase();
  caseDetail.value = "";
  if (caseTimeline) caseTimeline.innerHTML = "<div class=\"case-empty-timeline\">新病例还没有诊断记录。</div>";
  caseStatus.textContent = `已新建病例：${next.name}`;
});
refreshInsightsBtn.addEventListener("click", loadInsights);
refreshOpportunitiesBtn.addEventListener("click", loadOpportunityRanks);
refreshExperimentsBtn.addEventListener("click", loadExperiments);
refreshP2GrowthBtn?.addEventListener("click", loadP2GrowthDashboard);
publicPhotoTestList?.addEventListener("click", handlePublicPhotoTestAction);
refreshPublicPhotoTestBtn?.addEventListener("click", async () => {
  const records = await fetchPublicPhotoTestRecords();
  renderPublicPhotoTestPanel(records);
});
exportPublicPhotoTestBtn?.addEventListener("click", exportPublicPhotoTestRecords);
resetPublicPhotoTestBtn?.addEventListener("click", async () => {
  localStorage.removeItem(publicPhotoTestKey);
  publicPhotoServerRecords = [];
  try {
    await fetch("/api/public-photo-test-records", { method: "DELETE" });
  } catch {
    // Local reset still keeps the test panel usable when the server is unavailable.
  }
  renderPublicPhotoTestPanel([]);
});
saveCorrectionBtn?.addEventListener("click", async () => {
  const p2 = p2Growth();
  if (!p2) return;
  const correctedDiagnosis = correctionDiagnosisInput?.value.trim() || "";
  const reason = correctionReasonInput?.value.trim() || "";
  if (!correctedDiagnosis) {
    if (correctionStatus) correctionStatus.textContent = "请先填写修正后的诊断。";
    return;
  }
  const record = currentAnnotationRecord({
    correctedDiagnosis,
    reason,
    finalOutcome: correctionOutcomeSelect?.value || "confirmed_by_expert",
    source: "expert-correction"
  });
  p2.saveCorrection(record);
  if (correctionStatus) correctionStatus.textContent = `已保存纠错：${record.correctedDiagnosis}`;
  let backendSaved = false;
  try {
    const response = await fetch("/api/expert-corrections", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(record)
    });
    backendSaved = response.ok;
  } catch {
    backendSaved = false;
  }
  if (correctionStatus) {
    correctionStatus.textContent = backendSaved
      ? `Expert correction saved to case library: ${record.correctedDiagnosis}`
      : `Expert correction saved locally; backend sync pending: ${record.correctedDiagnosis}`;
  }
  if (correctionDiagnosisInput) correctionDiagnosisInput.value = "";
  if (correctionReasonInput) correctionReasonInput.value = "";
  renderAnnotationSchema();
  renderCorrectionList();
  loadP2GrowthDashboard();
});
refreshProductStrategyBtn.addEventListener("click", loadProductStrategy);
refreshIntegrationsBtn?.addEventListener("click", loadIntegrationStatus);
refreshKnowledgeGraphBtn.addEventListener("click", loadKnowledgeGraph);
knowledgeGraphCropFilter.addEventListener("change", loadKnowledgeGraph);
knowledgeGraphStageFilter.addEventListener("change", loadKnowledgeGraph);
dbSearch.addEventListener("input", loadReports);
dbCropFilter.addEventListener("change", loadReports);
dbMediumFilter.addEventListener("change", loadReports);
dbSearch.addEventListener("input", loadCases);
dbCropFilter.addEventListener("change", loadCases);

exportDbBtn.addEventListener("click", async () => {
  try {
    let response = await fetch("/api/reports/export");
    if (response.status === 404) {
      response = await fetch("/api/reports");
    }
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    dbDetail.value = JSON.stringify(data, null, 2);
    dbStatus.textContent = "已在详情框显示完整 JSON，可直接复制。";
  } catch {
    dbStatus.textContent = "导出失败：后台数据库暂不可用。";
  }
});

updateCropHint();
applyNotificationChannelConfig();
applyDeviceTemplate({ force: true });
applyInitialCustomerUrlState();
applyLocale({ persist: false });
updateCropHint();
updateDeviceProfile();
runDiagnosis();
setMode(initialModeFromUrl());
restoreCustomerArchiveOnStartup();
startCustomerTimeRefresh();
loadReports();
loadCases();
loadPublicPhotoTestPanel().then(() => {
  enforceInitialUrlMode();
  focusInitialPanelFromUrl();
});
loadNotifications();
loadInsights();
loadOpportunityRanks();
loadExperiments();
loadProductStrategy();
window.setTimeout(enforceInitialUrlMode, 250);
loadKnowledgeGraph();
loadIntegrationStatus();
