const dataFiles = {
  clients: "data/clients.json",
  walls: "data/walls.json",
  workorders: "data/workorders.json",
  diagnoses: "data/diagnoses.json",
  schedule: "data/schedule.json",
  incidents: "data/incidents.json",
  compliance: "data/compliance.json",
  dispatch: "data/dispatch.json",
  commercial: "data/commercial.json",
  billing: "data/billing.json",
  proof: "data/proof.json",
  sensors: "data/sensors.json",
  supply: "data/supply.json",
  audit: "data/audit.json",
  mvpControl: "data/mvp-control.json",
  esgMetrics: "data/esg-metrics.json",
  productModel: "data/product-model.json",
  aiInsights: "data/ai-insights.json",
  healthScore: "data/health-score.json",
  spatialDesign: "data/spatial-design.json",
  impactValue: "data/impact-value.json",
  roboticCare: "data/robotic-care.json"
};

let clients = [];
let walls = [];
let workorders = [];
let diagnoses = [];
let scheduleToday = "2026-07-07";
let scheduleSlots = [];
let scheduleRules = [];
let scheduleBlackouts = [];
let incidentRecords = [];
let incidentRules = [];
let complianceItems = [];
let complianceRules = [];
let esgTrend = [];
let esgMethods = [];
let esgLedger = [];
let esgProofPack = [];
let esgFrameworkMapping = [];
let esgClaimControls = [];
let reportModes = [];
let reportMonths = [];
let strategyCards = [];
let platformThesis = [];
let assetClasses = [];
let expansionRoadmap = [];
let investorBenchmarks = [];
let architectureLayers = [];
let crewMembers = [];
let dispatchRoute = [];
let dispatchInventory = [];
let commercialToday = "2026-07-07";
let commercialAccounts = [];
let commercialPlaybook = [];
let billingInvoices = [];
let billingPolicies = [];
let proofRecords = [];
let proofRequirements = [];
let sensorReadings = [];
let sensorRules = [];
let supplyItems = [];
let supplyPolicies = [];
let auditBaselineEvents = [];
let auditControls = [];
let mvpRoles = [];
let mvpReadiness = [];
let mvpQuickTemplates = [];
let mvpHandoffCriteria = [];
let aiSummary = [];
let aiRecommendations = [];
let aiGovernance = [];
let aiFlywheel = [];
let healthFormula = [];
let healthSources = [];
let healthCaptureWorkflow = [];
let healthCameraRoadmap = [];
let healthQualityControls = [];
let healthBands = [];
let spatialSummary = [];
let spatialDiagnostics = [];
let spatialInterventions = [];
let spatialPrinciples = [];
let spatialWorkflow = [];
let spatialProofPack = [];
let impactSummary = [];
let impactPillars = [];
let impactMetrics = [];
let impactAssessments = [];
let impactWorkflow = [];
let impactEvidencePack = [];
let impactClaimControls = [];
let roboticSummary = [];
let roboticCapabilities = [];
let roboticInterfaces = [];
let roboticFleet = [];
let roboticWorkflow = [];
let roboticRoadmap = [];
let roboticEvidencePack = [];
let roboticClaimControls = [];
let workorderCompletions = {};
let dispatchStaging = {};
let proofApprovals = {};
let sensorAcknowledgements = {};
let supplyRequests = {};
let invoicePayments = {};
let scheduleConfirmations = {};
let incidentResolutions = {};
let complianceClearances = {};
let activeRoleId = null;
let quickOpsTasks = [];
let auditEvents = [];
let aiQueuedActions = {};

const workorderCompletionStorageKey = "dr-forest-fm-ops.workorder-completions.v1";
const dispatchStagingStorageKey = "dr-forest-fm-ops.dispatch-staging.v1";
const proofApprovalStorageKey = "dr-forest-fm-ops.proof-approvals.v1";
const sensorAcknowledgementStorageKey = "dr-forest-fm-ops.sensor-acknowledgements.v1";
const supplyRequestStorageKey = "dr-forest-fm-ops.supply-requests.v1";
const invoicePaymentStorageKey = "dr-forest-fm-ops.invoice-payments.v1";
const scheduleConfirmationStorageKey = "dr-forest-fm-ops.schedule-confirmations.v1";
const incidentResolutionStorageKey = "dr-forest-fm-ops.incident-resolutions.v1";
const complianceClearanceStorageKey = "dr-forest-fm-ops.compliance-clearances.v1";
const activeRoleStorageKey = "dr-forest-fm-ops.active-role.v1";
const quickOpsTaskStorageKey = "dr-forest-fm-ops.quick-ops-tasks.v1";
const auditEventStorageKey = "dr-forest-fm-ops.audit-events.v1";
const aiQueuedActionStorageKey = "dr-forest-fm-ops.ai-queued-actions.v1";
const languageStorageKey = "dr-forest-fm-ops.language.v1";
const serverOpsStateEndpoint = "/api/ops-state";
const serverOpsSnapshotEndpoint = "/api/ops-state/snapshot";

let currentLanguage = "en";
let serverOpsStateAvailable = false;
let serverOpsStateRevision = 0;

const simplifiedToTraditionalMap = {
  "与": "與",
  "专": "專",
  "业": "業",
  "东": "東",
  "个": "個",
  "临": "臨",
  "为": "為",
  "举": "舉",
  "义": "義",
  "乌": "烏",
  "乐": "樂",
  "习": "習",
  "书": "書",
  "买": "買",
  "乱": "亂",
  "争": "爭",
  "于": "於",
  "亏": "虧",
  "云": "雲",
  "亚": "亞",
  "产": "產",
  "亩": "畝",
  "亲": "親",
  "亿": "億",
  "仅": "僅",
  "从": "從",
  "仓": "倉",
  "仪": "儀",
  "们": "們",
  "价": "價",
  "众": "眾",
  "优": "優",
  "会": "會",
  "传": "傳",
  "伤": "傷",
  "伦": "倫",
  "体": "體",
  "余": "餘",
  "佣": "傭",
  "侠": "俠",
  "侣": "侶",
  "侦": "偵",
  "侧": "側",
  "侨": "僑",
  "侩": "儈",
  "侪": "儕",
  "侬": "儂",
  "侠": "俠",
  "俭": "儉",
  "债": "債",
  "倾": "傾",
  "偻": "僂",
  "储": "儲",
  "儿": "兒",
  "兑": "兌",
  "党": "黨",
  "兰": "蘭",
  "关": "關",
  "兴": "興",
  "养": "養",
  "兽": "獸",
  "内": "內",
  "冈": "岡",
  "册": "冊",
  "写": "寫",
  "军": "軍",
  "农": "農",
  "决": "決",
  "况": "況",
  "冻": "凍",
  "净": "淨",
  "准": "準",
  "减": "減",
  "几": "幾",
  "凤": "鳳",
  "凭": "憑",
  "凯": "凱",
  "击": "擊",
  "凿": "鑿",
  "删": "刪",
  "则": "則",
  "刚": "剛",
  "创": "創",
  "删": "刪",
  "别": "別",
  "剂": "劑",
  "剑": "劍",
  "剧": "劇",
  "剩": "剩",
  "办": "辦",
  "务": "務",
  "动": "動",
  "励": "勵",
  "劲": "勁",
  "劳": "勞",
  "势": "勢",
  "勋": "勳",
  "区": "區",
  "医": "醫",
  "华": "華",
  "协": "協",
  "单": "單",
  "卖": "賣",
  "卫": "衛",
  "却": "卻",
  "厂": "廠",
  "厅": "廳",
  "历": "歷",
  "压": "壓",
  "厌": "厭",
  "县": "縣",
  "叁": "參",
  "参": "參",
  "双": "雙",
  "发": "發",
  "变": "變",
  "叙": "敘",
  "叶": "葉",
  "号": "號",
  "叹": "嘆",
  "后": "後",
  "听": "聽",
  "启": "啟",
  "吴": "吳",
  "员": "員",
  "呗": "唄",
  "呕": "嘔",
  "呗": "唄",
  "员": "員",
  "响": "響",
  "问": "問",
  "启": "啟",
  "园": "園",
  "围": "圍",
  "国": "國",
  "图": "圖",
  "圆": "圓",
  "圣": "聖",
  "场": "場",
  "坏": "壞",
  "块": "塊",
  "坚": "堅",
  "坛": "壇",
  "坝": "壩",
  "坞": "塢",
  "垄": "壟",
  "垒": "壘",
  "垦": "墾",
  "垫": "墊",
  "垮": "垮",
  "埘": "塒",
  "堑": "塹",
  "墙": "牆",
  "壮": "壯",
  "声": "聲",
  "壳": "殼",
  "处": "處",
  "备": "備",
  "复": "複",
  "够": "夠",
  "头": "頭",
  "夹": "夾",
  "夺": "奪",
  "奖": "獎",
  "妇": "婦",
  "妈": "媽",
  "妆": "妝",
  "姗": "姍",
  "娱": "娛",
  "娄": "婁",
  "婴": "嬰",
  "孙": "孫",
  "学": "學",
  "宁": "寧",
  "宝": "寶",
  "实": "實",
  "审": "審",
  "宪": "憲",
  "宫": "宮",
  "宽": "寬",
  "宾": "賓",
  "对": "對",
  "寻": "尋",
  "导": "導",
  "寿": "壽",
  "将": "將",
  "尔": "爾",
  "尘": "塵",
  "尝": "嘗",
  "层": "層",
  "属": "屬",
  "岁": "歲",
  "岂": "豈",
  "岛": "島",
  "峡": "峽",
  "崭": "嶄",
  "巩": "鞏",
  "币": "幣",
  "师": "師",
  "帐": "帳",
  "带": "帶",
  "帮": "幫",
  "帧": "幀",
  "库": "庫",
  "应": "應",
  "庙": "廟",
  "废": "廢",
  "广": "廣",
  "庄": "莊",
  "庆": "慶",
  "庐": "廬",
  "庞": "龐",
  "廪": "廩",
  "开": "開",
  "异": "異",
  "弃": "棄",
  "张": "張",
  "弥": "彌",
  "弯": "彎",
  "弹": "彈",
  "强": "強",
  "归": "歸",
  "录": "錄",
  "径": "徑",
  "彻": "徹",
  "征": "徵",
  "径": "徑",
  "忆": "憶",
  "忧": "憂",
  "怀": "懷",
  "态": "態",
  "总": "總",
  "恋": "戀",
  "恒": "恆",
  "恳": "懇",
  "恶": "惡",
  "恼": "惱",
  "悦": "悅",
  "悬": "懸",
  "惊": "驚",
  "惧": "懼",
  "惨": "慘",
  "惩": "懲",
  "惯": "慣",
  "愈": "癒",
  "愿": "願",
  "戏": "戲",
  "战": "戰",
  "户": "戶",
  "扎": "紮",
  "扑": "撲",
  "执": "執",
  "扩": "擴",
  "扫": "掃",
  "扬": "揚",
  "扰": "擾",
  "抚": "撫",
  "抛": "拋",
  "抢": "搶",
  "护": "護",
  "报": "報",
  "担": "擔",
  "拟": "擬",
  "拢": "攏",
  "拣": "揀",
  "拥": "擁",
  "拨": "撥",
  "择": "擇",
  "挂": "掛",
  "挚": "摯",
  "挛": "攣",
  "挝": "撾",
  "挞": "撻",
  "挟": "挾",
  "挠": "撓",
  "挡": "擋",
  "挤": "擠",
  "挥": "揮",
  "挦": "撏",
  "捞": "撈",
  "损": "損",
  "换": "換",
  "据": "據",
  "掳": "擄",
  "掴": "摑",
  "掷": "擲",
  "掸": "撣",
  "掺": "摻",
  "揽": "攬",
  "搀": "攙",
  "摄": "攝",
  "摆": "擺",
  "摇": "搖",
  "摊": "攤",
  "撵": "攆",
  "撑": "撐",
  "撒": "撒",
  "撷": "擷",
  "撸": "擼",
  "擞": "擻",
  "攒": "攢",
  "敌": "敵",
  "数": "數",
  "斋": "齋",
  "斩": "斬",
  "断": "斷",
  "无": "無",
  "旧": "舊",
  "时": "時",
  "旷": "曠",
  "昙": "曇",
  "昼": "晝",
  "显": "顯",
  "晋": "晉",
  "晒": "曬",
  "晓": "曉",
  "暂": "暫",
  "术": "術",
  "朴": "樸",
  "机": "機",
  "杀": "殺",
  "杂": "雜",
  "权": "權",
  "条": "條",
  "来": "來",
  "杨": "楊",
  "杰": "傑",
  "极": "極",
  "构": "構",
  "枢": "樞",
  "枪": "槍",
  "枫": "楓",
  "柜": "櫃",
  "标": "標",
  "栈": "棧",
  "栋": "棟",
  "栏": "欄",
  "树": "樹",
  "样": "樣",
  "核": "核",
  "根": "根",
  "格": "格",
  "档": "檔",
  "桥": "橋",
  "桦": "樺",
  "检": "檢",
  "楼": "樓",
  "榄": "欖",
  "槛": "檻",
  "横": "橫",
  "樯": "檣",
  "欢": "歡",
  "欧": "歐",
  "歼": "殲",
  "残": "殘",
  "殴": "毆",
  "殻": "殼",
  "毁": "毀",
  "毕": "畢",
  "毙": "斃",
  "毡": "氈",
  "气": "氣",
  "氢": "氫",
  "氩": "氬",
  "氲": "氳",
  "汇": "匯",
  "汉": "漢",
  "汤": "湯",
  "沟": "溝",
  "没": "沒",
  "沣": "灃",
  "沤": "漚",
  "沥": "瀝",
  "沦": "淪",
  "沧": "滄",
  "沪": "滬",
  "泞": "濘",
  "泪": "淚",
  "泶": "澩",
  "泻": "瀉",
  "泼": "潑",
  "泽": "澤",
  "洁": "潔",
  "洒": "灑",
  "浅": "淺",
  "浆": "漿",
  "浇": "澆",
  "测": "測",
  "济": "濟",
  "浓": "濃",
  "浊": "濁",
  "涂": "塗",
  "涛": "濤",
  "涝": "澇",
  "涞": "淶",
  "涟": "漣",
  "涡": "渦",
  "涣": "渙",
  "涤": "滌",
  "润": "潤",
  "涧": "澗",
  "涨": "漲",
  "涩": "澀",
  "渊": "淵",
  "渍": "漬",
  "渎": "瀆",
  "渐": "漸",
  "渔": "漁",
  "渗": "滲",
  "温": "溫",
  "湾": "灣",
  "湿": "濕",
  "溃": "潰",
  "溅": "濺",
  "滞": "滯",
  "滚": "滾",
  "滟": "灧",
  "滠": "灄",
  "满": "滿",
  "滢": "瀅",
  "滤": "濾",
  "滥": "濫",
  "滦": "灤",
  "滨": "濱",
  "滩": "灘",
  "滪": "澦",
  "漤": "灠",
  "潆": "瀠",
  "潇": "瀟",
  "潜": "潛",
  "潴": "瀦",
  "澜": "瀾",
  "灭": "滅",
  "灯": "燈",
  "灵": "靈",
  "灾": "災",
  "灿": "燦",
  "炉": "爐",
  "点": "點",
  "炼": "煉",
  "炽": "熾",
  "烁": "爍",
  "烂": "爛",
  "烃": "烴",
  "烛": "燭",
  "烟": "煙",
  "烦": "煩",
  "烧": "燒",
  "烨": "燁",
  "烩": "燴",
  "烫": "燙",
  "热": "熱",
  "焕": "煥",
  "爱": "愛",
  "爷": "爺",
  "牵": "牽",
  "牍": "牘",
  "犊": "犢",
  "状": "狀",
  "犷": "獷",
  "犸": "獁",
  "犹": "猶",
  "狈": "狽",
  "狞": "獰",
  "独": "獨",
  "狭": "狹",
  "狮": "獅",
  "狯": "獪",
  "狰": "猙",
  "狱": "獄",
  "猎": "獵",
  "猪": "豬",
  "猫": "貓",
  "献": "獻",
  "环": "環",
  "现": "現",
  "玺": "璽",
  "珐": "琺",
  "珑": "瓏",
  "珰": "璫",
  "珲": "琿",
  "琏": "璉",
  "瑶": "瑤",
  "瑷": "璦",
  "璎": "瓔",
  "瓒": "瓚",
  "电": "電",
  "画": "畫",
  "畅": "暢",
  "畴": "疇",
  "疖": "癤",
  "疗": "療",
  "疟": "瘧",
  "疠": "癘",
  "疡": "瘍",
  "疬": "癧",
  "疮": "瘡",
  "疯": "瘋",
  "痈": "癰",
  "痉": "痙",
  "痒": "癢",
  "痨": "癆",
  "瘅": "癉",
  "瘗": "瘞",
  "瘘": "瘺",
  "瘪": "癟",
  "瘫": "癱",
  "瘾": "癮",
  "瘿": "癭",
  "癞": "癩",
  "癣": "癬",
  "皱": "皺",
  "盏": "盞",
  "盐": "鹽",
  "监": "監",
  "盖": "蓋",
  "盗": "盜",
  "盘": "盤",
  "着": "著",
  "睁": "睜",
  "睐": "睞",
  "瞒": "瞞",
  "瞩": "矚",
  "矫": "矯",
  "矶": "磯",
  "矿": "礦",
  "码": "碼",
  "砖": "磚",
  "砗": "硨",
  "砚": "硯",
  "砜": "碸",
  "砺": "礪",
  "砻": "礱",
  "础": "礎",
  "确": "確",
  "碍": "礙",
  "碛": "磧",
  "礼": "禮",
  "祯": "禎",
  "祷": "禱",
  "祸": "禍",
  "禀": "稟",
  "种": "種",
  "积": "積",
  "称": "稱",
  "秽": "穢",
  "稳": "穩",
  "穷": "窮",
  "窃": "竊",
  "窍": "竅",
  "窑": "窯",
  "窜": "竄",
  "窝": "窩",
  "窥": "窺",
  "窦": "竇",
  "竞": "競",
  "笃": "篤",
  "笋": "筍",
  "笔": "筆",
  "笕": "筧",
  "笺": "箋",
  "笼": "籠",
  "筑": "築",
  "筛": "篩",
  "筚": "篳",
  "筹": "籌",
  "签": "簽",
  "简": "簡",
  "箓": "籙",
  "箦": "簀",
  "箧": "篋",
  "箨": "籜",
  "箩": "籮",
  "箪": "簞",
  "箫": "簫",
  "篑": "簣",
  "篮": "籃",
  "篱": "籬",
  "簖": "籪",
  "籁": "籟",
  "籴": "糴",
  "类": "類",
  "籼": "秈",
  "粜": "糶",
  "粝": "糲",
  "粤": "粵",
  "粪": "糞",
  "粮": "糧",
  "紧": "緊",
  "纠": "糾",
  "纡": "紆",
  "红": "紅",
  "纣": "紂",
  "纤": "纖",
  "约": "約",
  "级": "級",
  "纪": "紀",
  "纬": "緯",
  "纯": "純",
  "纱": "紗",
  "纲": "綱",
  "纳": "納",
  "纵": "縱",
  "纶": "綸",
  "纷": "紛",
  "纸": "紙",
  "纹": "紋",
  "纺": "紡",
  "纽": "紐",
  "线": "線",
  "练": "練",
  "组": "組",
  "绅": "紳",
  "细": "細",
  "织": "織",
  "终": "終",
  "绊": "絆",
  "绍": "紹",
  "经": "經",
  "绑": "綁",
  "绒": "絨",
  "结": "結",
  "绕": "繞",
  "绘": "繪",
  "给": "給",
  "绚": "絢",
  "络": "絡",
  "绝": "絕",
  "统": "統",
  "绢": "絹",
  "绣": "繡",
  "继": "繼",
  "绩": "績",
  "绪": "緒",
  "续": "續",
  "绰": "綽",
  "绳": "繩",
  "维": "維",
  "绵": "綿",
  "绶": "綬",
  "绷": "繃",
  "绸": "綢",
  "综": "綜",
  "绽": "綻",
  "绿": "綠",
  "缀": "綴",
  "缄": "緘",
  "缅": "緬",
  "缆": "纜",
  "缇": "緹",
  "缈": "緲",
  "缉": "緝",
  "缎": "緞",
  "缓": "緩",
  "缔": "締",
  "缕": "縷",
  "编": "編",
  "缘": "緣",
  "缚": "縛",
  "缛": "縟",
  "缜": "縝",
  "缝": "縫",
  "缟": "縞",
  "缠": "纏",
  "缡": "縭",
  "缢": "縊",
  "缣": "縑",
  "缤": "繽",
  "缥": "縹",
  "缦": "縵",
  "缧": "縲",
  "缨": "纓",
  "缩": "縮",
  "缪": "繆",
  "缫": "繅",
  "缬": "纈",
  "缭": "繚",
  "缮": "繕",
  "缯": "繒",
  "缴": "繳",
  "缵": "纘",
  "罂": "罌",
  "网": "網",
  "罗": "羅",
  "罚": "罰",
  "罢": "罷",
  "羁": "羈",
  "羟": "羥",
  "翘": "翹",
  "耸": "聳",
  "耻": "恥",
  "聂": "聶",
  "职": "職",
  "联": "聯",
  "聪": "聰",
  "肃": "肅",
  "肠": "腸",
  "肤": "膚",
  "肾": "腎",
  "肿": "腫",
  "胀": "脹",
  "胜": "勝",
  "胆": "膽",
  "胧": "朧",
  "胨": "腖",
  "胪": "臚",
  "胫": "脛",
  "胶": "膠",
  "脉": "脈",
  "脏": "臟",
  "脐": "臍",
  "脑": "腦",
  "脚": "腳",
  "脱": "脫",
  "脸": "臉",
  "腊": "臘",
  "腌": "醃",
  "腘": "膕",
  "腻": "膩",
  "腾": "騰",
  "舆": "輿",
  "舰": "艦",
  "舱": "艙",
  "艰": "艱",
  "艺": "藝",
  "节": "節",
  "芈": "羋",
  "芜": "蕪",
  "芦": "蘆",
  "苁": "蓯",
  "苇": "葦",
  "苈": "藶",
  "苋": "莧",
  "苌": "萇",
  "苍": "蒼",
  "苎": "苧",
  "苏": "蘇",
  "苹": "蘋",
  "茎": "莖",
  "茏": "蘢",
  "茑": "蔦",
  "茔": "塋",
  "茕": "煢",
  "茧": "繭",
  "荆": "荊",
  "荐": "薦",
  "荙": "薘",
  "荚": "莢",
  "荛": "蕘",
  "荜": "蓽",
  "荞": "蕎",
  "荟": "薈",
  "荠": "薺",
  "荡": "蕩",
  "荣": "榮",
  "荤": "葷",
  "荥": "滎",
  "荦": "犖",
  "荧": "熒",
  "荨": "蕁",
  "荩": "藎",
  "荪": "蓀",
  "荫": "蔭",
  "荬": "蕒",
  "荭": "葒",
  "荮": "葤",
  "药": "藥",
  "莅": "蒞",
  "莱": "萊",
  "莲": "蓮",
  "获": "獲",
  "莹": "瑩",
  "莺": "鶯",
  "莼": "蓴",
  "萚": "蘀",
  "萝": "蘿",
  "萤": "螢",
  "营": "營",
  "萦": "縈",
  "萧": "蕭",
  "萨": "薩",
  "葱": "蔥",
  "蒋": "蔣",
  "蓝": "藍",
  "蓟": "薊",
  "蓠": "蘺",
  "蓣": "蕷",
  "蓥": "鎣",
  "蓦": "驀",
  "蔂": "虆",
  "蔷": "薔",
  "蔹": "蘞",
  "蔺": "藺",
  "蔼": "藹",
  "蕰": "薀",
  "蕲": "蘄",
  "蕴": "蘊",
  "薮": "藪",
  "藓": "蘚",
  "虑": "慮",
  "虚": "虛",
  "虫": "蟲",
  "虽": "雖",
  "虾": "蝦",
  "蚀": "蝕",
  "蚁": "蟻",
  "蚂": "螞",
  "蚕": "蠶",
  "蚬": "蜆",
  "蛊": "蠱",
  "蛎": "蠣",
  "蛮": "蠻",
  "蛰": "蟄",
  "蛱": "蛺",
  "蛲": "蟯",
  "蛳": "螄",
  "蛴": "蠐",
  "蝈": "蟈",
  "蝉": "蟬",
  "蝼": "螻",
  "蝾": "蠑",
  "螀": "螿",
  "螨": "蟎",
  "衅": "釁",
  "衔": "銜",
  "补": "補",
  "衬": "襯",
  "袭": "襲",
  "袯": "襏",
  "装": "裝",
  "裆": "襠",
  "裢": "褳",
  "裣": "襝",
  "裤": "褲",
  "褛": "褸",
  "见": "見",
  "观": "觀",
  "规": "規",
  "觅": "覓",
  "视": "視",
  "览": "覽",
  "觉": "覺",
  "觊": "覬",
  "觋": "覡",
  "觌": "覿",
  "觎": "覦",
  "觏": "覯",
  "觐": "覲",
  "觑": "覷",
  "觞": "觴",
  "触": "觸",
  "订": "訂",
  "讣": "訃",
  "计": "計",
  "讯": "訊",
  "讨": "討",
  "训": "訓",
  "议": "議",
  "讯": "訊",
  "记": "記",
  "讲": "講",
  "讳": "諱",
  "讴": "謳",
  "讶": "訝",
  "许": "許",
  "讹": "訛",
  "论": "論",
  "讼": "訟",
  "讽": "諷",
  "设": "設",
  "访": "訪",
  "诀": "訣",
  "证": "證",
  "评": "評",
  "识": "識",
  "诈": "詐",
  "诉": "訴",
  "诊": "診",
  "词": "詞",
  "译": "譯",
  "试": "試",
  "诗": "詩",
  "诚": "誠",
  "诛": "誅",
  "话": "話",
  "诞": "誕",
  "诠": "詮",
  "询": "詢",
  "诣": "詣",
  "该": "該",
  "详": "詳",
  "诧": "詫",
  "诫": "誡",
  "诬": "誣",
  "语": "語",
  "误": "誤",
  "诱": "誘",
  "诲": "誨",
  "说": "說",
  "诵": "誦",
  "请": "請",
  "诸": "諸",
  "诺": "諾",
  "读": "讀",
  "诽": "誹",
  "课": "課",
  "谁": "誰",
  "调": "調",
  "谅": "諒",
  "谈": "談",
  "谊": "誼",
  "谋": "謀",
  "谍": "諜",
  "谎": "謊",
  "谏": "諫",
  "谐": "諧",
  "谑": "謔",
  "谒": "謁",
  "谓": "謂",
  "谕": "諭",
  "谗": "讒",
  "谘": "諮",
  "谙": "諳",
  "谚": "諺",
  "谜": "謎",
  "谟": "謨",
  "谠": "讜",
  "谡": "謖",
  "谢": "謝",
  "谣": "謠",
  "谤": "謗",
  "谥": "諡",
  "谦": "謙",
  "谨": "謹",
  "谩": "謾",
  "谪": "謫",
  "谬": "謬",
  "谭": "譚",
  "谱": "譜",
  "谴": "譴",
  "谷": "穀",
  "贝": "貝",
  "贞": "貞",
  "负": "負",
  "贡": "貢",
  "财": "財",
  "责": "責",
  "贤": "賢",
  "败": "敗",
  "账": "賬",
  "货": "貨",
  "质": "質",
  "贩": "販",
  "贪": "貪",
  "贫": "貧",
  "贬": "貶",
  "购": "購",
  "贮": "貯",
  "贯": "貫",
  "贰": "貳",
  "贱": "賤",
  "贵": "貴",
  "贷": "貸",
  "贸": "貿",
  "费": "費",
  "贺": "賀",
  "贻": "貽",
  "贼": "賊",
  "贾": "賈",
  "贿": "賄",
  "赁": "賃",
  "赂": "賂",
  "资": "資",
  "赈": "賑",
  "赉": "賚",
  "赋": "賦",
  "赌": "賭",
  "赎": "贖",
  "赏": "賞",
  "赐": "賜",
  "赔": "賠",
  "赖": "賴",
  "赚": "賺",
  "赛": "賽",
  "赞": "讚",
  "赠": "贈",
  "赡": "贍",
  "赢": "贏",
  "赵": "趙",
  "赶": "趕",
  "趋": "趨",
  "趱": "趲",
  "跃": "躍",
  "跄": "蹌",
  "跖": "蹠",
  "踪": "蹤",
  "车": "車",
  "轧": "軋",
  "轨": "軌",
  "轩": "軒",
  "转": "轉",
  "轮": "輪",
  "软": "軟",
  "轰": "轟",
  "轴": "軸",
  "轻": "輕",
  "载": "載",
  "较": "較",
  "辅": "輔",
  "辆": "輛",
  "辈": "輩",
  "辉": "輝",
  "辊": "輥",
  "辋": "輞",
  "辍": "輟",
  "辐": "輻",
  "辑": "輯",
  "输": "輸",
  "辕": "轅",
  "辖": "轄",
  "辗": "輾",
  "辘": "轆",
  "辙": "轍",
  "辽": "遼",
  "达": "達",
  "迁": "遷",
  "过": "過",
  "迈": "邁",
  "运": "運",
  "还": "還",
  "这": "這",
  "进": "進",
  "远": "遠",
  "违": "違",
  "连": "連",
  "迟": "遲",
  "适": "適",
  "选": "選",
  "逊": "遜",
  "递": "遞",
  "逻": "邏",
  "遗": "遺",
  "遥": "遙",
  "邓": "鄧",
  "邮": "郵",
  "邻": "鄰",
  "郁": "鬱",
  "郏": "郟",
  "郑": "鄭",
  "酝": "醞",
  "酦": "醱",
  "酱": "醬",
  "酽": "釅",
  "释": "釋",
  "里": "裏",
  "鉴": "鑒",
  "针": "針",
  "钉": "釘",
  "钓": "釣",
  "钙": "鈣",
  "钝": "鈍",
  "钞": "鈔",
  "钟": "鐘",
  "钢": "鋼",
  "钥": "鑰",
  "钦": "欽",
  "钧": "鈞",
  "钮": "鈕",
  "钱": "錢",
  "钲": "鉦",
  "钳": "鉗",
  "钵": "缽",
  "钻": "鑽",
  "钾": "鉀",
  "铁": "鐵",
  "铃": "鈴",
  "铅": "鉛",
  "铆": "鉚",
  "铉": "鉉",
  "铊": "鉈",
  "铎": "鐸",
  "铜": "銅",
  "铝": "鋁",
  "铡": "鍘",
  "铭": "銘",
  "铲": "鏟",
  "银": "銀",
  "铸": "鑄",
  "铺": "鋪",
  "链": "鏈",
  "销": "銷",
  "锁": "鎖",
  "锄": "鋤",
  "锅": "鍋",
  "锈": "鏽",
  "锋": "鋒",
  "锌": "鋅",
  "锐": "銳",
  "错": "錯",
  "锚": "錨",
  "锡": "錫",
  "锣": "鑼",
  "锤": "錘",
  "锥": "錐",
  "锦": "錦",
  "键": "鍵",
  "锯": "鋸",
  "锰": "錳",
  "锹": "鍬",
  "锻": "鍛",
  "镀": "鍍",
  "镁": "鎂",
  "镂": "鏤",
  "镇": "鎮",
  "镉": "鎘",
  "镊": "鑷",
  "镌": "鐫",
  "镍": "鎳",
  "镎": "鎿",
  "镜": "鏡",
  "镭": "鐳",
  "镶": "鑲",
  "长": "長",
  "门": "門",
  "闭": "閉",
  "问": "問",
  "闯": "闖",
  "闲": "閒",
  "间": "間",
  "闷": "悶",
  "闸": "閘",
  "闹": "鬧",
  "闻": "聞",
  "阀": "閥",
  "阁": "閣",
  "阅": "閱",
  "队": "隊",
  "阳": "陽",
  "阴": "陰",
  "阵": "陣",
  "阶": "階",
  "际": "際",
  "陆": "陸",
  "陈": "陳",
  "陕": "陝",
  "陨": "隕",
  "险": "險",
  "随": "隨",
  "隐": "隱",
  "隶": "隸",
  "难": "難",
  "雏": "雛",
  "雾": "霧",
  "霁": "霽",
  "霉": "黴",
  "静": "靜",
  "面": "面",
  "韦": "韋",
  "韧": "韌",
  "韩": "韓",
  "页": "頁",
  "顶": "頂",
  "顷": "頃",
  "项": "項",
  "顺": "順",
  "须": "須",
  "顽": "頑",
  "顾": "顧",
  "顿": "頓",
  "颁": "頒",
  "预": "預",
  "领": "領",
  "颇": "頗",
  "频": "頻",
  "颓": "頹",
  "颜": "顏",
  "额": "額",
  "风": "風",
  "飒": "颯",
  "飘": "飄",
  "飞": "飛",
  "饥": "飢",
  "饭": "飯",
  "饮": "飲",
  "饰": "飾",
  "饱": "飽",
  "饲": "飼",
  "饵": "餌",
  "饶": "饒",
  "饿": "餓",
  "馁": "餒",
  "馆": "館",
  "馈": "饋",
  "馋": "饞",
  "马": "馬",
  "驭": "馭",
  "驰": "馳",
  "驱": "驅",
  "驳": "駁",
  "驻": "駐",
  "驼": "駝",
  "驾": "駕",
  "骂": "罵",
  "骄": "驕",
  "验": "驗",
  "骏": "駿",
  "骑": "騎",
  "骗": "騙",
  "骚": "騷",
  "骡": "騾",
  "骤": "驟",
  "鱼": "魚",
  "鲁": "魯",
  "鲜": "鮮",
  "鸟": "鳥",
  "鸡": "雞",
  "鸣": "鳴",
  "鸭": "鴨",
  "鸥": "鷗",
  "鸦": "鴉",
  "鸯": "鴦",
  "鸽": "鴿",
  "鸿": "鴻",
  "鹃": "鵑",
  "鹅": "鵝",
  "鹊": "鵲",
  "鹏": "鵬",
  "鹤": "鶴",
  "鹰": "鷹",
  "麦": "麥",
  "黄": "黃",
  "齐": "齊",
  "齿": "齒",
  "龙": "龍",
  "龟": "龜"
};

const traditionalRegex = new RegExp(`[${Object.keys(simplifiedToTraditionalMap).join("")}]`, "g");

function toTraditionalText(value) {
  return String(value ?? "")
    .replace(traditionalRegex, (char) => simplifiedToTraditionalMap[char] || char)
    .replaceAll("中文理解：", "繁體中文：")
    .replaceAll("中文：", "繁體：");
}

function isTraditionalLanguage() {
  return currentLanguage === "zh-Hant";
}

function localizedText(enText, zhText = enText) {
  return isTraditionalLanguage() ? toTraditionalText(zhText || enText) : String(enText ?? "");
}

const contentTranslations = {
  "All current Wall assets have AI care, renewal or proof-risk signals.": "目前所有 Wall 資產都有 AI 養護、續約或憑證風險信號。",
  "AI can recommend, but FM leads approve client-impacting actions.": "AI 可以提出建議，但影響客戶的動作必須由 FM 負責人批准。",
  "Operations data compounds into prediction, proof automation and renewal intelligence.": "營運數據會累積成預測能力、憑證自動化與續約智能。",
  "Predictive care": "預測式養護",
  "ESG evidence": "ESG 證據",
  "Renewal risk": "續約風險",
  "Demand planning": "需求規劃",
  "Low-light sensor alert, leggy growth finding and high renewal risk overlap.": "低光照感測器預警、徒長發現與高續約風險同時出現。",
  "Monthly ESG pack is due and the current proof gap is the full-wall report capture.": "月度 ESG 包即將到期，目前缺口是全牆報告照片採集。",
  "Renewal date is near, wall health is the lowest in portfolio and AR was recently overdue.": "續約日期臨近，該牆健康分為組合最低，且近期有逾期應收。",
  "Replacement suggestion, water swing and nutrient stock alert indicate service kit risk.": "更換建議、水分波動與營養液庫存預警顯示服務工具包存在風險。",
  "Move the next recovery visit 48 hours earlier and add an LED schedule proof screenshot.": "將下一次恢復到訪提前 48 小時，並加入 LED 排程憑證截圖。",
  "Prompt technician to capture before/after wall photos, timestamp, site trace and method note in one visit.": "提示技師在一次到訪中採集前後對比牆面照片、時間戳、場地追蹤與方法說明。",
  "Generate a Renewal Proof Pack after risk recovery proof is approved.": "在風險恢復憑證獲批後生成續約證明包。",
  "Reserve replacement pods and nutrient stock before the next clinic care route.": "在下一次診所養護路線前預留替換植物艙與營養液庫存。",
  "Queue recovery visit": "加入恢復到訪隊列",
  "Prepare ESG proof checklist": "準備 ESG 憑證清單",
  "Prepare renewal pack": "準備續約包",
  "Reserve service kit": "預留服務工具包",
  "Requires FM lead approval before dispatch or client-facing report use.": "派工或用於客戶報告前，需要 FM 負責人批准。",
  "AI may prefill the checklist; ESG desk approves all claims.": "AI 可以預填清單；所有主張由 ESG 工作台批准。",
  "Account lead reviews tone before sending to landlord or procurement.": "發送給業主或採購前，客戶負責人需審核措辭。",
  "Inventory desk confirms physical stock before purchase or route promise.": "庫存工作台需在採購或路線承諾前確認實物庫存。",
  "Human-in-the-loop": "人工在環",
  "Evidence boundary": "證據邊界",
  "ESG claims safety": "ESG 主張安全",
  "Model audit trail": "模型審計軌跡",
  "AI recommendations create reviewable actions; they do not directly close work orders, approve proof or send reports.": "AI 建議只生成可複核動作，不直接關閉工單、批准憑證或發送報告。",
  "Every AI output must cite source records such as sensors, photos, work orders, invoices, incidents or method notes.": "每個 AI 輸出都必須引用來源記錄，例如感測器、照片、工單、發票、事件或方法說明。",
  "AI cannot label a metric as certified, carbon neutral, WELL/LEED compliant or independently assured unless that evidence exists.": "除非證據存在，AI 不得把指標標記為已認證、碳中和、符合 WELL/LEED 或已獨立鑑證。",
  "Queued AI actions are written into the audit ledger with actor, timestamp, entity and client scope.": "已入隊的 AI 動作會寫入審計台賬，包含操作人、時間戳、實體與客戶範圍。",
  "01 Observe": "01 觀察",
  "02 Predict": "02 預測",
  "03 Act": "03 行動",
  "04 Prove": "04 證明",
  "05 Learn": "05 學習",
  "Sensors, mobile photos, work orders, route plans and client feedback create the raw living-asset record.": "感測器、手機照片、工單、路線計劃與客戶反饋形成原始活體資產記錄。",
  "The system scores plant health risk, proof gaps, stock demand and renewal risk before they become visible client problems.": "系統在問題變成客戶可見前，先評分植物健康風險、憑證缺口、庫存需求與續約風險。",
  "FM teams approve suggested visits, proof checklists, replacement kits and account actions.": "FM 團隊批准建議到訪、憑證清單、替換工具包與客戶動作。",
  "Completed actions become audit-ready service proof, ESG method notes and renewal evidence.": "完成的動作會沉澱為可審計服務憑證、ESG 方法說明與續約證據。",
  "Outcome data improves future risk scoring, care protocols and DR FOREST portfolio expansion decisions.": "結果數據會改善未來風險評分、養護規程與 DR FOREST 資產組合擴展決策。",
  "Visual AI condition": "視覺 AI 狀態",
  "Sensor stability": "感測器穩定度",
  "Service compliance": "服務履約",
  "Recovery trend": "恢復趨勢",
  "Technician mobile photos are checked for yellowing, wilting, bare patches, uneven growth, pest/disease marks and overall fullness.": "技師手機照片會檢查黃葉、萎蔫、裸露區、不均勻生長、病蟲害痕跡與整體飽滿度。",
  "Water level, moisture, light, temperature, humidity, nutrient signal and gateway heartbeat reduce or support the score.": "水位、濕度、光照、溫度、空氣濕度、營養信號與網關心跳會拉低或支撐分數。",
  "On-time visits, completed care tasks, replacement closure and unresolved work orders affect operational health.": "準時到訪、完成養護任務、更換閉環與未解決工單會影響營運健康。",
  "Survival rate, repeated issue history, replacement cycle and recovery speed show whether a wall is improving or degrading.": "存活率、重複問題歷史、更換週期與恢復速度顯示綠牆正在改善還是惡化。",
  "Standard-angle photo set, asset ID, timestamp and AI finding record.": "標準角度照片組、資產 ID、時間戳與 AI 發現記錄。",
  "Telemetry reading, target band, last-seen time and alert status.": "遙測讀數、目標區間、最後上線時間與預警狀態。",
  "Work order status, technician note, photo proof and audit event.": "工單狀態、技師備註、照片憑證與審計事件。",
  "Historical health score, survival rate, issue recurrence and replacement log.": "歷史健康分、存活率、問題復發與更換記錄。",
  "Mobile photo capture": "手機照片採集",
  "Environmental telemetry": "環境遙測",
  "Work order ledger": "工單台賬",
  "Xponge root-zone log": "Xponge 根區記錄",
  "Robot patrol photo": "機器人巡檢照片",
  "Manual review": "人工複核",
  "Technicians capture fixed-angle photos during visits. AI reads plant condition, while humans approve exceptions before client reporting.": "技師在到訪時採集固定角度照片。AI 讀取植物狀態，例外情況在人員批准後才進入客戶報告。",
  "Water, light, temperature, humidity and gateway data explain why visual health changes and trigger early intervention.": "水、光照、溫度、濕度與網關數據用來解釋視覺健康變化，並觸發早期干預。",
  "Inspection cadence, open issues, completion proof and replacement records anchor the score in actual FM delivery.": "巡檢節奏、未關閉問題、完成憑證與更換記錄，讓分數落在真實 FM 交付上。",
  "Substrate sleeve, pest/disease observation and chemical intervention records explain whether a problem is plant stress, root-zone risk or FM exception.": "基質套件、病蟲害觀察與化學干預記錄，用來判斷問題是植物壓力、根區風險還是 FM 例外。",
  "Future care robots can capture repeatable plant-only photos between human visits to improve health trend detection.": "未來養護機器人可在人員到訪之間採集可重複的植物專區照片，提升健康趨勢識別。",
  "FM leads can confirm, override or request retake when lighting, angle or client context makes AI confidence weak.": "當光線、角度或客戶情境降低 AI 置信度時，FM 負責人可確認、覆蓋或要求重拍。",
  "01 Asset scan": "01 資產掃描",
  "02 Standard photo set": "02 標準照片組",
  "03 AI pre-check": "03 AI 預檢",
  "04 Human approval": "04 人工批准",
  "Technician scans QR or selects the asset ID, so every photo is tied to a client, site, wall and zone.": "技師掃描 QR 或選擇資產 ID，讓每張照片都綁定客戶、場地、綠牆與分區。",
  "The app asks for full-wall, zone close-up and issue photos using fixed prompts for angle, distance and lighting.": "App 以固定提示要求全牆、分區近照與問題照片，控制角度、距離與光線。",
  "AI checks image quality and plant condition, then highlights yellowing, sparse zones, wilt, low-light symptoms and likely causes.": "AI 先檢查影像品質與植物狀態，再標出黃葉、稀疏區、萎蔫、低光症狀與可能原因。",
  "FM lead approves the health score, asks for a retake or converts findings into work orders before the client sees the report.": "客戶看到報告前，FM 負責人會批准健康分、要求重拍或把發現轉成工單。",
  "Mobile phone camera": "手機攝像頭",
  "Optional fixed plant camera": "可選固定植物攝像頭",
  "Plant-only capture": "僅拍植物區域",
  "Trend over time": "長期趨勢",
  "Autonomous plant-only patrol": "自主植物區巡檢",
  "Lowest-cost and privacy-safe path. No built-in wall camera is required for launch.": "成本最低且較保護私隱的路徑。上線不需要內置牆面攝像頭。",
  "A hidden camera can capture only the plant zone at fixed times for high-value clients that approve it.": "對批准的高價值客戶，可用隱藏攝像頭在固定時間只拍植物區域。",
  "Crop to the wall area, avoid people, blur accidental faces and keep photos scoped to maintenance evidence.": "裁切到牆面區域，避開人員，模糊意外入鏡的人臉，並讓照片只服務維護憑證。",
  "Daily or weekly visual trend data can improve early warnings, but it should not be needed for MVP.": "每日或每週的視覺趨勢數據可改善早期預警，但不應成為 MVP 前置條件。",
  "A service robot can capture standard-angle plant photos, check refill state and create exception work orders after privacy and route approval.": "服務機器人在私隱與路線獲批後，可採集標準角度植物照片、檢查補水狀態並建立例外工單。",
  "Photo quality gate": "照片品質門檻",
  "Confidence threshold": "置信度門檻",
  "Explainable score": "可解釋分數",
  "Client-safe reporting": "客戶安全報告",
  "Reject blurry, overexposed, too-dark or wrong-angle photos before AI scoring.": "AI 評分前拒收模糊、過曝、過暗或角度錯誤的照片。",
  "Low-confidence AI findings become review tasks instead of direct score changes.": "低置信度 AI 發現會變成複核任務，而不是直接改分。",
  "Every score must show top drivers such as low light, water swing, yellowing, open work order or recovery trend.": "每個分數都必須展示主要驅動因素，例如低光照、水分波動、黃葉、未關閉工單或恢復趨勢。",
  "Reports show evidence-backed health status, not medical, air-purification or certification claims.": "報告展示有證據支持的健康狀態，不做醫療、空氣淨化或認證主張。",
  "Function first": "功能優先",
  "Viewpoint control": "視角控制",
  "Brand and material fit": "品牌與材質適配",
  "Maintainability": "可維護性",
  "Green assets must improve how the space is used, not only decorate it.": "綠色資產必須改善空間使用，而不只是裝飾。",
  "The system records the most important visitor, staff and camera viewpoints for proof photos.": "系統記錄最重要的訪客、員工與相機視角，用於憑證照片。",
  "Plant density, texture and rhythm should match the client's brand tone and interior palette.": "植物密度、質感與節奏應匹配客戶品牌語氣與室內色彩。",
  "A beautiful installation is not accepted unless the FM team can maintain it repeatedly.": "如果 FM 團隊無法重複維護，即使安裝很美也不算合格。",
  "Checks whether the green asset improves how people enter, wait, meet or circulate in the space.": "檢查綠色資產是否改善人們進入、等待、會面或流動的方式。",
  "Maps what clients and visitors see first, then aligns the wall, pods and photo proof to those viewpoints.": "先映射客戶與訪客第一眼看到什麼，再把牆體、植物艙與照片憑證對齊到這些視角。",
  "Reviews lighting, wall material, brand signage and surrounding finishes before recommending plant density.": "在建議植物密度前，先複核光照、牆面材料、品牌標識與周邊飾面。",
  "Looks at texture, calmness, vertical rhythm and perceived comfort rather than only counting green area.": "不只計算綠化面積，也看質感、安定感、垂直節奏與感知舒適度。",
  "Ensures the design can be maintained by FM teams without blocking access, signage, fire routes or cleaning.": "確保設計可由 FM 團隊維護，且不阻礙通道、標識、消防路線或清潔。",
  "Capture site photos, floor-plan notes, user flow, key view lines and pain points.": "採集場地照片、平面圖備註、使用者動線、關鍵視線與痛點。",
  "Define the role of the green asset: arrival, privacy, premium branding, wellness or sales support.": "定義綠色資產的角色：到達感、私密性、高端品牌、健康體驗或銷售支持。",
  "Translate the design intent into visit checks, photo angles, lighting notes and maintenance constraints.": "把設計意圖轉化為到訪檢查、拍照角度、光照備註與維護限制。",
  "Use before/after views, designer notes and health records in the renewal or upsell pack.": "在續約或加購包中使用前後對比視角、設計師備註與健康記錄。",
  "Same-angle photos show visible spatial uplift rather than generic plant maintenance.": "同角度照片展示可見的空間提升，而不只是一般植物維護。",
  "Each installation states what spatial job it performs for the client.": "每個安裝都說明它為客戶完成什麼空間任務。",
  "Senior architectural or interior design comments explain why a recommendation is credible.": "資深建築或室內設計意見用來解釋建議為何可信。",
  "FM teams receive the exact checks needed to keep the design value alive after installation.": "FM 團隊會收到安裝後維持設計價值所需的明確檢查項。",
  "The monthly report can show space improvement, health score, service proof and ESG evidence together.": "月度報告可把空間改善、健康分、服務憑證與 ESG 證據放在一起展示。",
  "The soil-free substrate story is operationalized as a hygiene and maintenance-risk layer for Hong Kong FM sites.": "無土基質故事被轉化為香港 FM 場地的衛生與維護風險層。",
  "The system turns green space into a measurable workplace experience program for staff-facing environments.": "系統把綠色空間轉化為面向員工環境的可衡量職場體驗項目。",
  "High-touch spaces become green brand media with service proof, design intent and client-safe ESG language.": "高觸點空間會變成綠色品牌媒體，並配有服務憑證、設計意圖與客戶安全的 ESG 語言。",
  "Supports Environmental chemical-reduction evidence and Social indoor-health perception evidence.": "支持環境維度的化學減量證據，以及社會維度的室內健康感知證據。",
  "Supports Social value evidence through occupant feedback, HR/FM notes and space-use context.": "透過使用者反饋、HR/FM 備註與空間使用情境，支持社會價值證據。",
  "Supports governance and communication quality because every public claim links back to operational evidence.": "因為每個公開主張都能回鏈到營運證據，所以支持治理與傳播品質。",
  "Xponge-specific performance should be backed by product datasheets, material tests or controlled service records before external claims.": "對外主張 Xponge 特定性能前，應有產品資料表、材料測試或受控服務記錄支持。",
  "Use 'supports employee experience' until the client connects survey results with HR or productivity data.": "在客戶把調查結果與 HR 或生產力數據連接前，只使用「支持員工體驗」。",
  "Use as brand and stakeholder communication evidence; do not present it as official ESG certification.": "可作為品牌與利益相關方傳播證據；不得表述為官方 ESG 認證。",
  "Each wall can record whether pods use Xponge sleeves rather than loose soil.": "每面牆都可記錄植物艙是否使用 Xponge 套件，而非散土。",
  "Routine chemical spray should be logged as an exception requiring approval, not a hidden maintenance habit.": "例行化學噴灑應被記為需批准的例外，而不是隱藏的維護習慣。",
  "FM complaint logs can show whether soil-free assets reduce insects, odor and mess perception.": "FM 投訴記錄可展示無土資產是否降低昆蟲、氣味與髒亂感知。",
  "Short monthly staff questions can capture mood, stress relief, focus and space satisfaction.": "簡短月度員工問題可捕捉心情、壓力舒緩、專注與空間滿意度。",
  "Combines user feedback, spatial diagnosis and health score rather than relying on one survey answer.": "結合使用者反饋、空間診斷與健康分，而不是只依賴單一問卷答案。",
  "Scores whether the asset is visible, healthy, on-brand and ready for client-facing communication.": "評估資產是否可見、健康、符合品牌，並可用於面向客戶的傳播。",
  "Photos, captions and report excerpts need consent and evidence links before brand use.": "照片、文案與報告摘錄在品牌使用前需要同意與證據鏈接。",
  "Record Xponge sleeve coverage, substrate batch, pest/disease history and whether chemical treatment was used.": "記錄 Xponge 套件覆蓋率、基質批次、病蟲害歷史與是否使用化學處理。",
  "Collect short client-approved pulse questions on mood, stress, focus, comfort or visit impression.": "收集經客戶批准的簡短脈搏問題，覆蓋心情、壓力、專注、舒適或到訪印象。",
  "Identify where clients, staff or visitors actually see the asset and whether the wall is photo/report ready.": "識別客戶、員工或訪客實際看到資產的位置，以及牆面是否可拍照/可入報告。",
  "Mark each statement as measured, surveyed, estimated or not claimed before it enters reports.": "每句話進入報告前，都標記為已量測、已調查、估算或不主張。",
  "Links asset, pod, sleeve batch, replacement date and no-soil installation proof.": "連接資產、植物艙、套件批次、更換日期與無土安裝憑證。",
  "Tracks issue type, severity, root-zone notes, treatment decision and follow-up result.": "追蹤問題類型、嚴重度、根區備註、處理決策與跟進結果。",
  "Makes any pesticide or chemical treatment visible, approved and reportable as an exception.": "讓任何農藥或化學處理都可見、經批准，並作為例外進入報告。",
  "Client-approved lightweight survey captures perceived calmness, stress relief, focus and space satisfaction.": "經客戶批准的輕量問卷可捕捉安定感、壓力舒緩、專注與空間滿意度。",
  "Connects a visible green asset to design intent, approved photos and client-safe ESG language.": "把可見綠色資產連接到設計意圖、已批准照片與客戶安全的 ESG 語言。",
  "Separates measured evidence, survey findings, estimates and blocked claims before investor or client use.": "在投資人或客戶使用前，分開已量測證據、調查發現、估算與禁止主張。",
  "Use pest/disease logs, no-soil coverage and chemical intervention records as supplier evidence.": "使用病蟲害記錄、無土覆蓋率與化學干預記錄作為供應商證據。",
  "Use staff pulse results when question wording, response count, client scope and period are visible.": "當問題措辭、回覆數、客戶範圍與期間清晰時，可使用員工脈搏結果。",
  "Use approved photos, design intent and touchpoint score to support brand and stakeholder communication.": "用已批准照片、設計意圖與觸點分，支持品牌與利益相關方傳播。",
  "Do not claim productivity improvement, disease prevention, medical benefit or certified ESG impact without qualified evidence.": "沒有合資格證據時，不得主張效率提升、疾病預防、醫療效益或已認證 ESG 影響。",
  "The robot captures repeatable full-wall and zone photos for AI health scoring and client reporting.": "機器人採集可重複的全牆與分區照片，用於 AI 健康評分和客戶報告。",
  "The robot connects to standardized refill ports and logs flow volume, refill duration and leak checks.": "機器人連接標準化補水口，並記錄流量、補水時長與漏水檢查。",
  "Nutrient cartridges let the robot dose by recipe while preserving batch traceability and safety limits.": "營養液卡匣讓機器人按配方加注，同時保留批次追溯與安全限制。",
  "The robot escalates pruning, replacement, pest confirmation and customer-sensitive issues to human technicians.": "機器人會把修剪、更換、病蟲確認與客戶敏感問題升級給人工技師。",
  "Asset ledger, health score, proof vault, work orders and ESG claim boundaries are already structured for future automation.": "資產台賬、健康分、憑證庫、工單與 ESG 主張邊界已為未來自動化做好結構準備。",
  "The current MVP creates the operating data that robots will later use.": "當前 MVP 會創造未來機器人需要使用的營運數據。",
  "This turns DR FOREST Wall into hardware that a robot can service repeatably.": "這會把 DR FOREST Wall 變成機器人可重複服務的硬件。",
  "A pilot proves 24h care without claiming full autonomy too early.": "試點可證明 24 小時看護，而不過早主張完全自主。",
  "The long-term story becomes recurring FM revenue plus robotics-enabled operating leverage.": "長期故事會變成持續 FM 收入加上機器人帶來的營運槓桿。",
  "A service robot follows approved indoor routes and checks wall appearance, leak risk, light status and access blockers.": "服務機器人沿批准的室內路線行走，檢查牆面外觀、漏水風險、光照狀態與通行阻礙。",
  "Creates sensor, proof and incident records in the OPS ledger.": "在 OPS 台賬中生成感測器、憑證與事件記錄。",
  "Feeds Health Score, Proof Vault, ESG and renewal packs.": "輸入健康分、憑證庫、ESG 與續約包。",
  "Updates water ledger, health drivers and exception audit trail.": "更新水分台賬、健康驅動因素與例外審計軌跡。",
  "Connects supply inventory, dosing log and plant recovery trend.": "連接供應庫存、加注記錄與植物恢復趨勢。",
  "Creates work orders with photos, likely cause and recommended next action.": "生成帶照片、可能原因與建議下一步動作的工單。",
  "QR, NFC or visual marker on each wall/module lets the robot bind actions to the correct asset.": "每面牆/模組上的 QR、NFC 或視覺標記，讓機器人把動作綁定到正確資產。",
  "Without a stable ID, refill, dosing and proof records cannot be trusted.": "沒有穩定 ID，補水、加液與憑證記錄就不可信。",
  "Standardized physical ports with mechanical alignment and permission control.": "具備機械對位與權限控制的標準化實體接口。",
  "Autonomous water and nutrient actions need a safe, repeatable docking interface.": "自主補水和營養液動作需要安全、可重複的對接接口。",
  "Flow meter, leak sensor, backflow protection and auto-stop threshold.": "流量計、漏水感測器、防回流保護與自動停止閾值。",
  "Hong Kong FM clients will care deeply about water risk in offices, clinics and show suites.": "香港 FM 客戶會非常重視辦公室、診所與示範單位的水患風險。",
  "Camera framing, cropping and privacy controls keep people out of routine proof capture.": "透過取景、裁切與私隱控制，讓日常憑證採集避開人員。",
  "Privacy and client approval are prerequisites for robotic photo proof.": "私隱與客戶批准是機器人照片憑證的前置條件。",
  "FM-approved routes, elevator rules, docking point, charging point and no-go zones.": "FM 批准的路線、電梯規則、對接點、充電點與禁入區。",
  "A robot can only become a care layer if it fits building operations.": "機器人只有融入樓宇營運，才能成為看護層。",
  "Good first pilot because the reception route is controlled, the wall is visible and the client values report proof.": "適合作為首個試點，因為接待路線受控、牆面可見，且客戶重視報告憑證。",
  "Strong health-safety value, but patient privacy and clinic access rules require strict approval.": "健康安全價值強，但病人私隱與診所准入規則需要嚴格批准。",
  "High brand value during sales campaigns; robot proof can protect presentation quality before VIP visits.": "銷售活動期間品牌價值高；機器人憑證可在 VIP 到訪前保障展示品質。",
  "Useful later, but member experience and moving obstacles make it a less obvious first pilot.": "未來有用，但會員體驗與移動障礙物讓它不適合作為第一個試點。",
  "Robot follows FM-approved route, scans asset ID and confirms it is facing the correct wall module.": "機器人沿 FM 批准路線行走，掃描資產 ID，並確認正對正確牆面模組。",
  "Robot captures plant-only photos, checks leak/light/tank status and uploads evidence to Proof Vault.": "機器人採集植物專區照片，檢查漏水/光照/水箱狀態，並上傳證據到憑證庫。",
  "If permitted, robot connects to the port, applies volume or nutrient recipe and records the operation.": "獲准後，機器人連接接口，按容量或營養液配方執行並記錄操作。",
  "OPS compares photos, sensor state and service rules to decide whether to keep watching or create a work order.": "OPS 比對照片、感測器狀態與服務規則，決定繼續觀察還是建立工單。",
  "Technicians handle trimming, replacement, pest confirmation, client-sensitive actions and physical exceptions.": "技師處理修剪、更換、病蟲確認、客戶敏感動作與實體例外。",
  "Define module ID, refill port, dosing cartridge, leak guard, camera framing and privacy rules.": "定義模組 ID、補水口、加液卡匣、漏水保護、相機取景與私隱規則。",
  "Pilot night patrol and photo proof in one controlled client site before enabling refill and dosing.": "先在一個受控客戶場地試點夜間巡檢與照片憑證，再啟用補水與加液。",
  "Scale robots across routes, modules and clients with human exception teams and evidence-led reporting.": "在人工例外團隊與證據導向報告支持下，把機器人擴展到更多路線、模組與客戶。",
  "Stores route, time, asset ID, battery state, photos and detected exceptions.": "儲存路線、時間、資產 ID、電量狀態、照片與偵測到的例外。",
  "Records water volume, refill duration, target module and leak-check result.": "記錄水量、補水時長、目標模組與漏水檢查結果。",
  "Links recipe, cartridge batch, dose amount and plant recovery trend.": "連接配方、卡匣批次、加注量與植物恢復趨勢。",
  "Repeatable photos improve health score consistency and client report credibility.": "可重複照片可提升健康分一致性與客戶報告可信度。",
  "Shows where robot monitoring ends and human technician responsibility begins.": "展示機器人監控在哪裡結束，人工技師責任從哪裡開始。",
  "Use this now: DR FOREST OPS is designed to support future robotic patrol, proof capture, refill and nutrient dosing.": "現在可使用：DR FOREST OPS 的設計支持未來機器人巡檢、憑證採集、補水與營養液加注。",
  "Use robot patrol, photo and exception logs only after a controlled site pilot proves reliable operation.": "只有在受控場地試點證明可靠運行後，才使用機器人巡檢、照片與例外記錄。",
  "Do not claim fully autonomous plant care, 24h guaranteed remediation, or human replacement before hardware pilots and safety validation.": "在硬件試點與安全驗證前，不得主張完全自主植物養護、24 小時保證修復或替代人工。",
  "Every robot action needs permission rules, leak safety, privacy controls and a human escalation path.": "每個機器人動作都需要權限規則、漏水安全、私隱控制與人工升級路徑。"
};

function localizedPhrase(value) {
  const text = String(value ?? "");
  return localizedText(text, contentTranslations[text] || text);
}

function localizedField(record, key) {
  const value = record?.[key];
  const zhValue = record?.[`${key}Zh`] || contentTranslations[value];
  return localizedText(value, zhValue || value);
}

function localizedList(values) {
  return (values || []).map((value) => localizedPhrase(value));
}

function splitBilingualText(text) {
  const value = String(text || "").trim();
  const parts = value.split(/\s+\/\s+/);
  if (parts.length < 2) return null;
  return {
    en: parts[0].trim(),
    zh: parts.slice(1).join(" / ").trim()
  };
}

function loadLanguagePreference() {
  try {
    const stored = localStorage.getItem(languageStorageKey);
    currentLanguage = stored === "zh-Hant" ? "zh-Hant" : "en";
  } catch {
    currentLanguage = "en";
  }
}

function saveLanguagePreference(language) {
  currentLanguage = language === "zh-Hant" ? "zh-Hant" : "en";
  try {
    localStorage.setItem(languageStorageKey, currentLanguage);
  } catch {
    // Ignore storage errors in embedded previews.
  }
}

function prepareInlineTranslation(element, zhSelector) {
  const zhElement = element.querySelector(zhSelector);
  if (!zhElement || element.dataset.i18nEn) return;
  const zhText = zhElement.textContent.trim();
  const enText = Array.from(element.childNodes)
    .filter((node) => node !== zhElement)
    .map((node) => node.textContent)
    .join("")
    .trim();
  if (!enText || !zhText) return;
  element.dataset.i18nEn = enText;
  element.dataset.i18nZh = zhText;
}

function prepareSmallTranslation(small) {
  const parent = small.parentElement;
  if (!parent || parent.dataset.i18nEn) return;
  const clone = parent.cloneNode(true);
  clone.querySelectorAll(".zh").forEach((node) => node.remove());
  const enText = clone.textContent.trim();
  const zhText = small.textContent.trim();
  if (!enText || !zhText) return;
  parent.dataset.i18nEn = enText;
  parent.dataset.i18nZh = zhText;
}

function prepareSlashTranslation(element) {
  if (element.dataset.i18nEn || element.children.length > 0) return;
  const pair = splitBilingualText(element.textContent);
  if (!pair) return;
  element.dataset.i18nEn = pair.en;
  element.dataset.i18nZh = pair.zh;
}

function prepareNavTranslation(link) {
  if (link.dataset.i18nEn) return;
  const enText = link.querySelector("span")?.textContent.trim();
  const zhText = link.querySelector("small")?.textContent.trim();
  if (!enText || !zhText) return;
  link.dataset.i18nEn = enText;
  link.dataset.i18nZh = zhText;
}

function prepareLanguageTranslations() {
  document.querySelectorAll("h2, h3").forEach((element) => prepareInlineTranslation(element, ":scope > .zh-inline"));
  document.querySelectorAll(".side-nav nav a").forEach(prepareNavTranslation);
  document.querySelectorAll(".zh").forEach(prepareSmallTranslation);
  document
    .querySelectorAll("button, .status-pill, .panel-title > span, .eyebrow, .brand small, .nav-note span, .nav-note strong, .nav-note small, .filter-btn")
    .forEach(prepareSlashTranslation);
}

function applyLanguageContent() {
  if (!document.body) return;
  prepareLanguageTranslations();

  document.documentElement.lang = isTraditionalLanguage() ? "zh-Hant-HK" : "en-HK";
  document.body.classList.toggle("lang-zh", isTraditionalLanguage());
  document.body.classList.toggle("lang-en", !isTraditionalLanguage());

  document.querySelectorAll("[data-i18n-en]").forEach((element) => {
    element.textContent = localizedText(element.dataset.i18nEn, element.dataset.i18nZh || element.dataset.i18nEn);
  });

  document.querySelectorAll(".zh-copy").forEach((element) => {
    if (!element.dataset.i18nZhOnly) element.dataset.i18nZhOnly = element.textContent;
    element.textContent = toTraditionalText(element.dataset.i18nZhOnly);
  });

  document.querySelectorAll("[data-language-switch]").forEach((button) => {
    button.classList.toggle("active", button.dataset.languageSwitch === currentLanguage);
  });
}

async function loadJson(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Failed to load ${path}: ${response.status}`);
  return response.json();
}

async function loadAppData() {
  const [
    loadedClients,
    loadedWalls,
    loadedWorkorders,
    loadedDiagnoses,
    scheduleData,
    incidentData,
    complianceData,
    dispatchData,
    commercialData,
    billingData,
    proofData,
    sensorData,
    supplyData,
    auditData,
    mvpControlData,
    esgMetrics,
    productModel,
    aiInsights,
    healthScoreData,
    spatialDesignData,
    impactValueData,
    roboticCareData
  ] = await Promise.all([
    loadJson(dataFiles.clients),
    loadJson(dataFiles.walls),
    loadJson(dataFiles.workorders),
    loadJson(dataFiles.diagnoses),
    loadJson(dataFiles.schedule),
    loadJson(dataFiles.incidents),
    loadJson(dataFiles.compliance),
    loadJson(dataFiles.dispatch),
    loadJson(dataFiles.commercial),
    loadJson(dataFiles.billing),
    loadJson(dataFiles.proof),
    loadJson(dataFiles.sensors),
    loadJson(dataFiles.supply),
    loadJson(dataFiles.audit),
    loadJson(dataFiles.mvpControl),
    loadJson(dataFiles.esgMetrics),
    loadJson(dataFiles.productModel),
    loadJson(dataFiles.aiInsights),
    loadJson(dataFiles.healthScore),
    loadJson(dataFiles.spatialDesign),
    loadJson(dataFiles.impactValue),
    loadJson(dataFiles.roboticCare)
  ]);

  clients = loadedClients;
  walls = loadedWalls;
  workorders = loadedWorkorders;
  diagnoses = loadedDiagnoses;
  scheduleToday = scheduleData.today || scheduleToday;
  scheduleSlots = scheduleData.slots || [];
  scheduleRules = scheduleData.rules || [];
  scheduleBlackouts = scheduleData.blackouts || [];
  incidentRecords = incidentData.incidents || [];
  incidentRules = incidentData.rules || [];
  complianceItems = complianceData.items || [];
  complianceRules = complianceData.rules || [];
  crewMembers = dispatchData.crew || [];
  dispatchRoute = dispatchData.route || [];
  dispatchInventory = dispatchData.inventory || [];
  commercialToday = commercialData.today || commercialToday;
  commercialAccounts = commercialData.accounts || [];
  commercialPlaybook = commercialData.playbook || [];
  billingInvoices = billingData.invoices || [];
  billingPolicies = billingData.policies || [];
  proofRecords = proofData.records || [];
  proofRequirements = proofData.requirements || [];
  sensorReadings = sensorData.readings || [];
  sensorRules = sensorData.rules || [];
  supplyItems = supplyData.items || [];
  supplyPolicies = supplyData.policies || [];
  auditBaselineEvents = auditData.baselineEvents || [];
  auditControls = auditData.controls || [];
  mvpRoles = mvpControlData.roles || [];
  mvpReadiness = mvpControlData.readiness || [];
  mvpQuickTemplates = mvpControlData.quickTemplates || [];
  mvpHandoffCriteria = mvpControlData.handoffCriteria || [];
  aiSummary = aiInsights.summary || [];
  aiRecommendations = aiInsights.recommendations || [];
  aiGovernance = aiInsights.governance || [];
  aiFlywheel = aiInsights.flywheel || [];
  healthFormula = healthScoreData.formula || [];
  healthSources = healthScoreData.sources || [];
  healthCaptureWorkflow = healthScoreData.captureWorkflow || [];
  healthCameraRoadmap = healthScoreData.cameraRoadmap || [];
  healthQualityControls = healthScoreData.qualityControls || [];
  healthBands = healthScoreData.bands || [];
  spatialSummary = spatialDesignData.summary || [];
  spatialDiagnostics = spatialDesignData.diagnostics || [];
  spatialInterventions = spatialDesignData.interventions || [];
  spatialPrinciples = spatialDesignData.designPrinciples || [];
  spatialWorkflow = spatialDesignData.workflow || [];
  spatialProofPack = spatialDesignData.proofPack || [];
  impactSummary = impactValueData.summary || [];
  impactPillars = impactValueData.pillars || [];
  impactMetrics = impactValueData.metrics || [];
  impactAssessments = impactValueData.clientAssessments || [];
  impactWorkflow = impactValueData.workflow || [];
  impactEvidencePack = impactValueData.evidencePack || [];
  impactClaimControls = impactValueData.claimControls || [];
  roboticSummary = roboticCareData.summary || [];
  roboticCapabilities = roboticCareData.capabilities || [];
  roboticInterfaces = roboticCareData.moduleInterfaces || [];
  roboticFleet = roboticCareData.fleetScenarios || [];
  roboticWorkflow = roboticCareData.workflow || [];
  roboticRoadmap = roboticCareData.roadmap || [];
  roboticEvidencePack = roboticCareData.evidencePack || [];
  roboticClaimControls = roboticCareData.claimControls || [];
  esgTrend = esgMetrics.trend || [];
  esgMethods = esgMetrics.methods || [];
  esgLedger = esgMetrics.ledger || [];
  esgProofPack = esgMetrics.proofPack || [];
  esgFrameworkMapping = esgMetrics.frameworkMapping || [];
  esgClaimControls = esgMetrics.claimControls || [];
  reportModes = productModel.reportModes || [];
  reportMonths = productModel.reportMonths || [];
  strategyCards = productModel.strategyCards || [];
  platformThesis = productModel.platformThesis || [];
  assetClasses = productModel.assetClasses || [];
  expansionRoadmap = productModel.expansionRoadmap || [];
  investorBenchmarks = productModel.investorBenchmarks || [];
  architectureLayers = productModel.architectureLayers || [];
}

function initializeSelection() {
  state.selectedClientId = clients[0]?.id || null;
  state.selectedWallId = walls[0]?.id || null;
  state.selectedReportClientId = clients[0]?.id || null;
  state.selectedReportMonth = reportMonths[0]?.id || null;
  state.reportMode = reportModes[0]?.id || null;
}

function loadWorkorderCompletions() {
  try {
    workorderCompletions = JSON.parse(localStorage.getItem(workorderCompletionStorageKey) || "{}");
  } catch {
    workorderCompletions = {};
  }
}

function saveWorkorderCompletions() {
  localStorage.setItem(workorderCompletionStorageKey, JSON.stringify(workorderCompletions));
}

function loadDispatchStaging() {
  try {
    dispatchStaging = JSON.parse(localStorage.getItem(dispatchStagingStorageKey) || "{}");
  } catch {
    dispatchStaging = {};
  }
}

function saveDispatchStaging() {
  localStorage.setItem(dispatchStagingStorageKey, JSON.stringify(dispatchStaging));
}

function loadProofApprovals() {
  try {
    proofApprovals = JSON.parse(localStorage.getItem(proofApprovalStorageKey) || "{}");
  } catch {
    proofApprovals = {};
  }
}

function saveProofApprovals() {
  localStorage.setItem(proofApprovalStorageKey, JSON.stringify(proofApprovals));
}

function loadSensorAcknowledgements() {
  try {
    sensorAcknowledgements = JSON.parse(localStorage.getItem(sensorAcknowledgementStorageKey) || "{}");
  } catch {
    sensorAcknowledgements = {};
  }
}

function saveSensorAcknowledgements() {
  localStorage.setItem(sensorAcknowledgementStorageKey, JSON.stringify(sensorAcknowledgements));
}

function loadSupplyRequests() {
  try {
    supplyRequests = JSON.parse(localStorage.getItem(supplyRequestStorageKey) || "{}");
  } catch {
    supplyRequests = {};
  }
}

function saveSupplyRequests() {
  localStorage.setItem(supplyRequestStorageKey, JSON.stringify(supplyRequests));
}

function loadInvoicePayments() {
  try {
    invoicePayments = JSON.parse(localStorage.getItem(invoicePaymentStorageKey) || "{}");
  } catch {
    invoicePayments = {};
  }
}

function saveInvoicePayments() {
  localStorage.setItem(invoicePaymentStorageKey, JSON.stringify(invoicePayments));
}

function loadScheduleConfirmations() {
  try {
    scheduleConfirmations = JSON.parse(localStorage.getItem(scheduleConfirmationStorageKey) || "{}");
  } catch {
    scheduleConfirmations = {};
  }
}

function saveScheduleConfirmations() {
  localStorage.setItem(scheduleConfirmationStorageKey, JSON.stringify(scheduleConfirmations));
}

function loadIncidentResolutions() {
  try {
    incidentResolutions = JSON.parse(localStorage.getItem(incidentResolutionStorageKey) || "{}");
  } catch {
    incidentResolutions = {};
  }
}

function saveIncidentResolutions() {
  localStorage.setItem(incidentResolutionStorageKey, JSON.stringify(incidentResolutions));
}

function loadComplianceClearances() {
  try {
    complianceClearances = JSON.parse(localStorage.getItem(complianceClearanceStorageKey) || "{}");
  } catch {
    complianceClearances = {};
  }
}

function saveComplianceClearances() {
  localStorage.setItem(complianceClearanceStorageKey, JSON.stringify(complianceClearances));
}

function loadActiveRole() {
  activeRoleId = localStorage.getItem(activeRoleStorageKey) || mvpRoles[0]?.id || null;
}

function saveActiveRole() {
  if (activeRoleId) localStorage.setItem(activeRoleStorageKey, activeRoleId);
}

function loadQuickOpsTasks() {
  try {
    quickOpsTasks = JSON.parse(localStorage.getItem(quickOpsTaskStorageKey) || "[]");
  } catch {
    quickOpsTasks = [];
  }
}

function saveQuickOpsTasks() {
  localStorage.setItem(quickOpsTaskStorageKey, JSON.stringify(quickOpsTasks));
}

function loadAuditEvents() {
  try {
    auditEvents = JSON.parse(localStorage.getItem(auditEventStorageKey) || "[]");
  } catch {
    auditEvents = [];
  }
}

function saveAuditEvents() {
  localStorage.setItem(auditEventStorageKey, JSON.stringify(auditEvents));
}

function loadAiQueuedActions() {
  try {
    aiQueuedActions = JSON.parse(localStorage.getItem(aiQueuedActionStorageKey) || "{}");
  } catch {
    aiQueuedActions = {};
  }
}

function saveAiQueuedActions() {
  localStorage.setItem(aiQueuedActionStorageKey, JSON.stringify(aiQueuedActions));
}

function collectOpsStateSnapshot() {
  return {
    workorderCompletions,
    dispatchStaging,
    proofApprovals,
    sensorAcknowledgements,
    supplyRequests,
    invoicePayments,
    scheduleConfirmations,
    incidentResolutions,
    complianceClearances,
    activeRoleId,
    quickOpsTasks,
    auditEvents,
    aiQueuedActions
  };
}

function applyOpsStateSnapshot(snapshot) {
  const serverState = snapshot?.state;
  if (!serverState || typeof serverState !== "object") return false;

  workorderCompletions = serverState.workorderCompletions || {};
  dispatchStaging = serverState.dispatchStaging || {};
  proofApprovals = serverState.proofApprovals || {};
  sensorAcknowledgements = serverState.sensorAcknowledgements || {};
  supplyRequests = serverState.supplyRequests || {};
  invoicePayments = serverState.invoicePayments || {};
  scheduleConfirmations = serverState.scheduleConfirmations || {};
  incidentResolutions = serverState.incidentResolutions || {};
  complianceClearances = serverState.complianceClearances || {};
  activeRoleId = serverState.activeRoleId || activeRoleId;
  quickOpsTasks = Array.isArray(serverState.quickOpsTasks) ? serverState.quickOpsTasks : [];
  auditEvents = Array.isArray(serverState.auditEvents) ? serverState.auditEvents : [];
  aiQueuedActions = serverState.aiQueuedActions || {};
  serverOpsStateRevision = Number(snapshot.revision || 0);

  saveWorkorderCompletions();
  saveDispatchStaging();
  saveProofApprovals();
  saveSensorAcknowledgements();
  saveSupplyRequests();
  saveInvoicePayments();
  saveScheduleConfirmations();
  saveIncidentResolutions();
  saveComplianceClearances();
  saveActiveRole();
  saveQuickOpsTasks();
  saveAuditEvents();
  saveAiQueuedActions();

  return true;
}

async function loadServerOpsState() {
  if (!window.location.protocol.startsWith("http")) return;

  try {
    const response = await fetch(serverOpsStateEndpoint, { cache: "no-store" });
    if (!response.ok) return;
    const snapshot = await response.json();
    serverOpsStateAvailable = true;
    if (Number(snapshot.revision || 0) > 0) {
      applyOpsStateSnapshot(snapshot);
    }
  } catch {
    serverOpsStateAvailable = false;
  }
}

function auditActionType(action = "") {
  return String(action || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "") || "ops.state.updated";
}

function persistServerOpsState(auditEvent) {
  if (!window.location.protocol.startsWith("http")) return;

  const event = auditEvent ? {
    type: auditActionType(auditEvent.action),
    actor: auditEvent.actor,
    entityType: auditEvent.entityType,
    entityId: auditEvent.entityId,
    clientId: auditEvent.clientId,
    source: "browser-ui",
    note: auditEvent.detail,
    payload: {
      auditEventId: auditEvent.id,
      tone: auditEvent.tone
    }
  } : null;

  fetch(serverOpsSnapshotEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      state: collectOpsStateSnapshot(),
      event
    })
  })
    .then((response) => response.ok ? response.json() : null)
    .then((snapshot) => {
      if (!snapshot) return;
      serverOpsStateAvailable = true;
      serverOpsStateRevision = Number(snapshot.revision || serverOpsStateRevision);
    })
    .catch(() => {
      serverOpsStateAvailable = false;
    });
}

function isWorkorderCompleted(id) {
  return Boolean(workorderCompletions[id]);
}

function isDispatchStaged(id) {
  return Boolean(dispatchStaging[id]);
}

function isProofApproved(id) {
  return Boolean(proofApprovals[id]);
}

function proofRecordReady(record) {
  return isProofApproved(record.id) || record.tone === "ready";
}

function isSensorAcknowledged(id) {
  return Boolean(sensorAcknowledgements[id]);
}

function isSupplyRequested(sku) {
  return Boolean(supplyRequests[sku]);
}

function isInvoicePaid(id) {
  const invoice = billingInvoices.find((item) => item.id === id);
  return Boolean(invoicePayments[id]) || invoice?.status === "paid";
}

function isScheduleConfirmed(id) {
  const slot = scheduleSlots.find((item) => item.id === id);
  return Boolean(scheduleConfirmations[id]) || slot?.status === "confirmed";
}

function isIncidentResolved(id) {
  const incident = incidentRecords.find((item) => item.id === id);
  return Boolean(incidentResolutions[id]) || incident?.status === "resolved";
}

function isComplianceCleared(id) {
  const item = complianceItems.find((record) => record.id === id);
  return Boolean(complianceClearances[id]) || item?.status === "ready";
}

function clientIdForWorkorder(id) {
  const order = workorders.find((item) => item.id === id);
  if (!order) return null;
  return wallById(order.wallId)?.clientId || null;
}

function clientIdForProof(id) {
  const record = proofRecords.find((item) => item.id === id);
  if (!record) return null;
  return wallById(record.wallId)?.clientId || null;
}

function clientIdForSensor(id) {
  const reading = sensorReadings.find((item) => item.id === id);
  if (!reading) return null;
  return wallById(reading.wallId)?.clientId || null;
}

function clientIdForInvoice(id) {
  return billingInvoices.find((item) => item.id === id)?.clientId || null;
}

function clientIdForScheduleSlot(id) {
  const slot = scheduleSlots.find((item) => item.id === id);
  const order = slot ? workorders.find((item) => item.id === slot.workorderId) : null;
  return order ? wallById(order.wallId)?.clientId || null : null;
}

function clientIdForIncident(id) {
  const incident = incidentRecords.find((item) => item.id === id);
  return incident ? wallById(incident.wallId)?.clientId || null : null;
}

function clientIdForCompliance(id) {
  return complianceItems.find((item) => item.id === id)?.clientId || null;
}

function clientIdForQuickTask(id) {
  return quickOpsTasks.find((item) => item.id === id)?.clientId || null;
}

function allAuditEvents() {
  return [...auditEvents, ...auditBaselineEvents]
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

function auditEventsForClient(clientId) {
  return allAuditEvents().filter((event) => event.clientId === clientId);
}

function recordAuditEvent(event) {
  const auditEvent = {
    id: `AUD-${Date.now()}-${Math.round(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    actor: event.actor || "FM Ops",
    action: event.action,
    entityType: event.entityType,
    entityId: event.entityId,
    clientId: event.clientId || null,
    tone: event.tone || "ready",
    detail: event.detail
  };
  auditEvents = [auditEvent, ...auditEvents].slice(0, 80);
  saveAuditEvents();
  persistServerOpsState(auditEvent);
}

function workorderView(order) {
  const completion = workorderCompletions[order.id] || null;
  return {
    ...order,
    completion,
    displayStatus: completion ? "Completed" : order.status,
    displayPriority: completion ? "completed" : order.priority
  };
}

function completeWorkorder(id) {
  if (!workorderCompletions[id]) {
    workorderCompletions[id] = {
      completedAt: new Date().toISOString(),
      completedBy: "FM Ops demo",
      proof: "Visit tasks completed and ready for report evidence."
    };
    saveWorkorderCompletions();
    recordAuditEvent({
      actor: "FM Ops demo",
      action: "Work order completed",
      entityType: "workorder",
      entityId: id,
      clientId: clientIdForWorkorder(id),
      tone: "completed",
      detail: "Service visit marked complete and report evidence can reference the closure."
    });
  }
  state.reportGenerated = false;
  renderAll();
}

function stageDispatchKit(id) {
  if (!dispatchStaging[id]) {
    dispatchStaging[id] = {
      stagedAt: new Date().toISOString(),
      stagedBy: "Dispatch desk"
    };
    saveDispatchStaging();
    recordAuditEvent({
      actor: "Dispatch desk",
      action: "Dispatch kit staged",
      entityType: "workorder",
      entityId: id,
      clientId: clientIdForWorkorder(id),
      tone: "ready",
      detail: "Technician kit staged for route handoff."
    });
  }
  renderAll();
}

function approveProofRecord(id) {
  if (!proofApprovals[id]) {
    proofApprovals[id] = {
      approvedAt: new Date().toISOString(),
      approvedBy: "Evidence desk"
    };
    saveProofApprovals();
    recordAuditEvent({
      actor: "Evidence desk",
      action: "Proof approved",
      entityType: "proof",
      entityId: id,
      clientId: clientIdForProof(id),
      tone: "approved",
      detail: "Evidence record approved for client-facing report use."
    });
  }
  state.reportGenerated = false;
  renderAll();
}

function acknowledgeSensorAlert(id) {
  if (!sensorAcknowledgements[id]) {
    sensorAcknowledgements[id] = {
      acknowledgedAt: new Date().toISOString(),
      acknowledgedBy: "FM control"
    };
    saveSensorAcknowledgements();
    recordAuditEvent({
      actor: "FM control",
      action: "Sensor alert acknowledged",
      entityType: "sensor",
      entityId: id,
      clientId: clientIdForSensor(id),
      tone: "acknowledged",
      detail: "Telemetry exception acknowledged by operations control."
    });
  }
  renderAll();
}

function requestSupplyReorder(sku) {
  if (!supplyRequests[sku]) {
    supplyRequests[sku] = {
      requestedAt: new Date().toISOString(),
      requestedBy: "Dispatch desk"
    };
    saveSupplyRequests();
    recordAuditEvent({
      actor: "Dispatch desk",
      action: "Supply reorder requested",
      entityType: "supply",
      entityId: sku,
      clientId: null,
      tone: "requested",
      detail: "Stock replenishment request raised for service continuity."
    });
  }
  renderAll();
}

function markInvoicePaid(id) {
  const invoice = billingInvoices.find((item) => item.id === id);
  if (!invoice) return;

  if (!invoicePayments[id]) {
    invoicePayments[id] = {
      paidAt: new Date().toISOString(),
      paidBy: "Finance desk",
      amount: invoice.amount
    };
    saveInvoicePayments();
    recordAuditEvent({
      actor: "Finance desk",
      action: "Invoice marked paid",
      entityType: "invoice",
      entityId: id,
      clientId: clientIdForInvoice(id),
      tone: "paid",
      detail: `${formatCurrency(invoice.amount)} receivable marked paid and available for client report evidence.`
    });
  }
  state.reportGenerated = false;
  renderAll();
}

function confirmScheduleSlot(id) {
  const slot = scheduleSlots.find((item) => item.id === id);
  if (!slot) return;

  if (!scheduleConfirmations[id]) {
    scheduleConfirmations[id] = {
      confirmedAt: new Date().toISOString(),
      confirmedBy: "Service desk"
    };
    saveScheduleConfirmations();
    recordAuditEvent({
      actor: "Service desk",
      action: "Visit slot confirmed",
      entityType: "schedule",
      entityId: id,
      clientId: clientIdForScheduleSlot(id),
      tone: "confirmed",
      detail: `${slot.date} ${slot.window} service access confirmed for ${slot.workorderId}.`
    });
  }
  state.reportGenerated = false;
  renderAll();
}

function resolveIncident(id) {
  const incident = incidentRecords.find((item) => item.id === id);
  if (!incident) return;

  if (!incidentResolutions[id]) {
    incidentResolutions[id] = {
      resolvedAt: new Date().toISOString(),
      resolvedBy: "SLA desk",
      note: "Incident closed with linked operational evidence."
    };
    saveIncidentResolutions();
    recordAuditEvent({
      actor: "SLA desk",
      action: "Incident resolved",
      entityType: "incident",
      entityId: id,
      clientId: clientIdForIncident(id),
      tone: "resolved",
      detail: `${incident.category} closed against SLA with linked work order ${incident.linkedWorkorderId}.`
    });
  }
  state.reportGenerated = false;
  renderAll();
}

function clearComplianceItem(id) {
  const item = complianceItems.find((record) => record.id === id);
  if (!item) return;

  if (!complianceClearances[id]) {
    complianceClearances[id] = {
      clearedAt: new Date().toISOString(),
      clearedBy: "Compliance desk",
      evidence: "Compliance evidence accepted for FM operation and client reporting."
    };
    saveComplianceClearances();
    recordAuditEvent({
      actor: "Compliance desk",
      action: "Compliance item cleared",
      entityType: "compliance",
      entityId: id,
      clientId: clientIdForCompliance(id),
      tone: "cleared",
      detail: `${item.category} cleared for ${item.document}.`
    });
  }
  state.reportGenerated = false;
  renderAll();
}

function selectedRole() {
  return mvpRoles.find((role) => role.id === activeRoleId) || mvpRoles[0] || null;
}

function setActiveRole(id) {
  const role = mvpRoles.find((item) => item.id === id);
  if (!role) return;
  activeRoleId = id;
  saveActiveRole();
  recordAuditEvent({
    actor: role.person,
    action: "Operator role switched",
    entityType: "role",
    entityId: id,
    clientId: null,
    tone: "ready",
    detail: `${role.label} role is active for MVP demo operations.`
  });
  renderAll();
}

function createQuickOpsTask({ clientId, templateId, priority, note }) {
  const template = mvpQuickTemplates.find((item) => item.id === templateId) || mvpQuickTemplates[0];
  const client = clients.find((item) => item.id === clientId) || clients[0];
  const wall = walls.find((item) => item.clientId === client.id);
  const role = selectedRole();
  const task = {
    id: `QOP-${Date.now()}`,
    clientId: client.id,
    wallId: wall?.id || null,
    templateId: template.id,
    type: template.type,
    priority: priority || template.defaultPriority,
    note: note || template.defaultNote,
    status: "open",
    createdAt: new Date().toISOString(),
    createdBy: role?.person || "FM Ops"
  };
  quickOpsTasks = [task, ...quickOpsTasks].slice(0, 20);
  saveQuickOpsTasks();
  recordAuditEvent({
    actor: task.createdBy,
    action: "Quick task created",
    entityType: "quick-task",
    entityId: task.id,
    clientId: task.clientId,
    tone: "ready",
    detail: `${task.type} created from MVP Control Center.`
  });
  state.reportGenerated = false;
  renderAll();
}

function closeQuickOpsTask(id) {
  const task = quickOpsTasks.find((item) => item.id === id);
  if (!task || task.status === "closed") return;
  const role = selectedRole();
  task.status = "closed";
  task.closedAt = new Date().toISOString();
  task.closedBy = role?.person || "FM Ops";
  saveQuickOpsTasks();
  recordAuditEvent({
    actor: task.closedBy,
    action: "Quick task closed",
    entityType: "quick-task",
    entityId: id,
    clientId: clientIdForQuickTask(id),
    tone: "completed",
    detail: `${task.type} closed from MVP Control Center.`
  });
  state.reportGenerated = false;
  renderAll();
}

function prepareRenewalPack(clientId) {
  state.selectedReportClientId = clientId;
  state.reportMode = "renewal";
  state.reportGenerated = false;
  recordAuditEvent({
    actor: "Account lead",
    action: "Renewal proof pack prepared",
    entityType: "client",
    entityId: clientId,
    clientId,
    tone: "ready",
    detail: "Report center switched to Renewal Proof mode for the account."
  });
  renderAll();
  document.querySelector("#reports").scrollIntoView({ behavior: "smooth", block: "start" });
}

const state = {
  simulatedVisits: 0,
  filter: "all",
  selectedClientId: null,
  selectedWallId: null,
  selectedReportClientId: null,
  selectedReportMonth: null,
  reportMode: null,
  reportGenerated: false
};

const els = {
  summaryGrid: document.querySelector("#summary-grid"),
  proofStrip: document.querySelector("#proof-strip"),
  riskList: document.querySelector("#risk-list"),
  serviceTimeline: document.querySelector("#service-timeline"),
  aiStatus: document.querySelector("#ai-status"),
  aiGrid: document.querySelector("#ai-grid"),
  aiRecommendationList: document.querySelector("#ai-recommendation-list"),
  aiGovernanceList: document.querySelector("#ai-governance-list"),
  aiFlywheelList: document.querySelector("#ai-flywheel-list"),
  healthStatus: document.querySelector("#health-status"),
  healthGrid: document.querySelector("#health-grid"),
  healthFormulaList: document.querySelector("#health-formula-list"),
  healthBreakdownList: document.querySelector("#health-breakdown-list"),
  healthSourceList: document.querySelector("#health-source-list"),
  healthWorkflowList: document.querySelector("#health-workflow-list"),
  healthCameraList: document.querySelector("#health-camera-list"),
  healthQualityList: document.querySelector("#health-quality-list"),
  spatialStatus: document.querySelector("#spatial-status"),
  spatialGrid: document.querySelector("#spatial-grid"),
  spatialDiagnosticList: document.querySelector("#spatial-diagnostic-list"),
  spatialInterventionList: document.querySelector("#spatial-intervention-list"),
  spatialPrincipleList: document.querySelector("#spatial-principle-list"),
  spatialWorkflowList: document.querySelector("#spatial-workflow-list"),
  spatialProofList: document.querySelector("#spatial-proof-list"),
  impactStatus: document.querySelector("#impact-status"),
  impactGrid: document.querySelector("#impact-grid"),
  impactPillarList: document.querySelector("#impact-pillar-list"),
  impactAssessmentList: document.querySelector("#impact-assessment-list"),
  impactMetricList: document.querySelector("#impact-metric-list"),
  impactWorkflowList: document.querySelector("#impact-workflow-list"),
  impactEvidenceList: document.querySelector("#impact-evidence-list"),
  impactClaimList: document.querySelector("#impact-claim-list"),
  roboticStatus: document.querySelector("#robotic-status"),
  roboticGrid: document.querySelector("#robotic-grid"),
  roboticCapabilityList: document.querySelector("#robotic-capability-list"),
  roboticInterfaceList: document.querySelector("#robotic-interface-list"),
  roboticFleetList: document.querySelector("#robotic-fleet-list"),
  roboticWorkflowList: document.querySelector("#robotic-workflow-list"),
  roboticRoadmapList: document.querySelector("#robotic-roadmap-list"),
  roboticEvidenceList: document.querySelector("#robotic-evidence-list"),
  roboticClaimList: document.querySelector("#robotic-claim-list"),
  mvpStatus: document.querySelector("#mvp-status"),
  mvpGrid: document.querySelector("#mvp-grid"),
  activeRoleSelect: document.querySelector("#active-role-select"),
  activeRoleDetail: document.querySelector("#active-role-detail"),
  permissionList: document.querySelector("#permission-list"),
  mvpReadinessList: document.querySelector("#mvp-readiness-list"),
  quickClientSelect: document.querySelector("#quick-client-select"),
  quickTemplateSelect: document.querySelector("#quick-template-select"),
  quickPrioritySelect: document.querySelector("#quick-priority-select"),
  quickNoteInput: document.querySelector("#quick-note-input"),
  createQuickTaskBtn: document.querySelector("#create-quick-task-btn"),
  quickTaskList: document.querySelector("#quick-task-list"),
  mvpHandoffList: document.querySelector("#mvp-handoff-list"),
  platformStatus: document.querySelector("#platform-status"),
  platformThesisGrid: document.querySelector("#platform-thesis-grid"),
  platformGrid: document.querySelector("#platform-grid"),
  assetScopeList: document.querySelector("#asset-scope-list"),
  expansionRoadmapList: document.querySelector("#expansion-roadmap-list"),
  investorBenchmarkList: document.querySelector("#investor-benchmark-list"),
  strategyGrid: document.querySelector("#strategy-grid"),
  positioningCopy: document.querySelector("#positioning-copy"),
  clientTabs: document.querySelector("#client-tabs"),
  clientList: document.querySelector("#client-list"),
  clientDetailTitle: document.querySelector("#client-detail-title"),
  clientDetailStatus: document.querySelector("#client-detail-status"),
  clientDetail: document.querySelector("#client-detail"),
  commercialStatus: document.querySelector("#commercial-status"),
  commercialGrid: document.querySelector("#commercial-grid"),
  renewalList: document.querySelector("#renewal-list"),
  slaList: document.querySelector("#sla-list"),
  successPlaybook: document.querySelector("#success-playbook"),
  billingStatus: document.querySelector("#billing-status"),
  billingGrid: document.querySelector("#billing-grid"),
  invoiceList: document.querySelector("#invoice-list"),
  billingPolicyList: document.querySelector("#billing-policy-list"),
  complianceStatus: document.querySelector("#compliance-status"),
  complianceGrid: document.querySelector("#compliance-grid"),
  complianceList: document.querySelector("#compliance-list"),
  complianceRuleList: document.querySelector("#compliance-rule-list"),
  wallGrid: document.querySelector("#wall-grid"),
  wallDetailTitle: document.querySelector("#wall-detail-title"),
  wallDetailStatus: document.querySelector("#wall-detail-status"),
  wallDetail: document.querySelector("#wall-detail"),
  podHealthList: document.querySelector("#pod-health-list"),
  sensorStatus: document.querySelector("#sensor-status"),
  sensorGrid: document.querySelector("#sensor-grid"),
  sensorList: document.querySelector("#sensor-list"),
  sensorRuleList: document.querySelector("#sensor-rule-list"),
  incidentStatus: document.querySelector("#incident-status"),
  incidentGrid: document.querySelector("#incident-grid"),
  incidentList: document.querySelector("#incident-list"),
  incidentRuleList: document.querySelector("#incident-rule-list"),
  scheduleStatus: document.querySelector("#schedule-status"),
  scheduleGrid: document.querySelector("#schedule-grid"),
  scheduleSlotList: document.querySelector("#schedule-slot-list"),
  scheduleCapacityList: document.querySelector("#schedule-capacity-list"),
  scheduleRuleList: document.querySelector("#schedule-rule-list"),
  workorderList: document.querySelector("#workorder-list"),
  diagnosisList: document.querySelector("#diagnosis-list"),
  dispatchStatus: document.querySelector("#dispatch-status"),
  dispatchGrid: document.querySelector("#dispatch-grid"),
  dispatchRouteList: document.querySelector("#dispatch-route-list"),
  dispatchCrewList: document.querySelector("#dispatch-crew-list"),
  dispatchInventoryList: document.querySelector("#dispatch-inventory-list"),
  supplyStatus: document.querySelector("#supply-status"),
  supplyGrid: document.querySelector("#supply-grid"),
  supplyList: document.querySelector("#supply-list"),
  supplyPolicyList: document.querySelector("#supply-policy-list"),
  proofStatus: document.querySelector("#proof-status"),
  proofGrid: document.querySelector("#proof-grid"),
  proofRecordList: document.querySelector("#proof-record-list"),
  proofRequirementList: document.querySelector("#proof-requirement-list"),
  auditStatus: document.querySelector("#audit-status"),
  auditGrid: document.querySelector("#audit-grid"),
  auditEventList: document.querySelector("#audit-event-list"),
  auditControlList: document.querySelector("#audit-control-list"),
  esgGrid: document.querySelector("#esg-grid"),
  esgBars: document.querySelector("#esg-bars"),
  esgMethods: document.querySelector("#esg-methods"),
  esgLedger: document.querySelector("#esg-ledger"),
  esgProofPackList: document.querySelector("#esg-proof-pack-list"),
  esgFrameworkList: document.querySelector("#esg-framework-list"),
  esgClaimControlList: document.querySelector("#esg-claim-control-list"),
  reportTabs: document.querySelector("#report-tabs"),
  reportClientSelect: document.querySelector("#report-client-select"),
  reportMonthSelect: document.querySelector("#report-month-select"),
  downloadReportBtn: document.querySelector("#download-report-btn"),
  reportClientProfile: document.querySelector("#report-client-profile"),
  reportStatus: document.querySelector("#report-status"),
  reportPeriod: document.querySelector("#report-period"),
  reportTitle: document.querySelector("#report-title"),
  reportSummary: document.querySelector("#report-summary"),
  reportMetrics: document.querySelector("#report-metrics"),
  reportEvidence: document.querySelector("#report-evidence"),
  reportMethods: document.querySelector("#report-methods"),
  architectureLayers: document.querySelector("#architecture-layers"),
  syncStatus: document.querySelector("#sync-status"),
  reviewAiBtn: document.querySelector("#review-ai-btn"),
  simulateVisitBtn: document.querySelector("#simulate-visit-btn"),
  generateReportBtn: document.querySelector("#generate-report-btn"),
  languageButtons: Array.from(document.querySelectorAll("[data-language-switch]")),
  filterButtons: Array.from(document.querySelectorAll("[data-filter]")),
  navLinks: Array.from(document.querySelectorAll(".side-nav nav a"))
};

function formatCurrency(value) {
  return `HK$${Math.round(value).toLocaleString("en-HK")}`;
}

function sum(items, selector) {
  return items.reduce((total, item) => total + selector(item), 0);
}

function avg(items, selector) {
  return Math.round(sum(items, selector) / items.length);
}

function clamp(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

function clientFor(wall) {
  return clients.find((client) => client.id === wall.clientId);
}

function wallById(id) {
  return walls.find((wall) => wall.id === id);
}

function selectedClient() {
  return clients.find((client) => client.id === state.selectedClientId);
}

function selectedWall() {
  return wallById(state.selectedWallId);
}

function selectedReport() {
  return reportModes.find((mode) => mode.id === state.reportMode) || reportModes[0];
}

function selectedReportClient() {
  return clients.find((client) => client.id === state.selectedReportClientId) || clients[0];
}

function selectedReportMonth() {
  return reportMonths.find((month) => month.id === state.selectedReportMonth) || reportMonths[0];
}

function commercialAccountFor(clientId) {
  return commercialAccounts.find((account) => account.clientId === clientId);
}

function dateValue(dateText) {
  const [year, month, day] = dateText.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

function daysUntil(dateText) {
  return Math.round((dateValue(dateText) - dateValue(commercialToday)) / 86400000);
}

function riskLabel(level) {
  if (level === "high") return "High risk";
  if (level === "medium") return "Watch";
  return "Healthy";
}

function statusClass(value) {
  if (value === "risk" || value === "high") return "danger";
  if (value === "at-risk") return "danger";
  if (value === "critical" || value === "escalated" || value === "breach") return "danger";
  if (value === "alert" || value === "offline") return "danger";
  if (value === "overdue") return "danger";
  if (value === "watch" || value === "medium") return "warn";
  if (value === "due") return "warn";
  if (value === "due-today" || value === "triage") return "warn";
  if (value === "unconfirmed") return "warn";
  if (value === "needs-review" || value === "review") return "warn";
  if (value === "missing" || value === "blocked") return "danger";
  if (value === "expiring") return "warn";
  if (value === "phase-2" || value === "open" || value === "adjacent") return "warn";
  if (value === "phase-3" || value === "pilot" || value === "robotics-ready") return "warn";
  if (value === "next") return "warn";
  if (value === "completed" || value === "ready" || value === "approved" || value === "paid") return "good";
  if (value === "resolved") return "good";
  if (value === "cleared") return "good";
  if (value === "complete" || value === "closed") return "good";
  if (value === "confirmed") return "good";
  if (value === "ok" || value === "acknowledged" || value === "requested" || value === "queued") return "good";
  return "";
}

function commercialTone(view) {
  if (
    view.client.renewalRisk === "high" ||
    view.daysToRenewal <= 60 ||
    view.healthGap > 0 ||
    view.data.openWorkorders.length > 0 && view.daysToProof <= 45
  ) return "high";
  if (view.client.renewalRisk === "medium" || view.daysToRenewal <= 90 || view.data.openWorkorders.length > 0) return "medium";
  return "low";
}

function commercialView(client) {
  const account = commercialAccountFor(client.id);
  const data = metricsForClient(client.id);
  const daysToRenewal = daysUntil(client.renewalDate);
  const daysToProof = account ? daysUntil(account.proofPackDue) : daysToRenewal - 30;
  const healthGap = account ? Math.max(0, account.targetHealth - data.health) : 0;
  const view = {
    client,
    account,
    data,
    daysToRenewal,
    daysToProof,
    healthGap
  };
  view.tone = commercialTone(view);
  view.priorityLabel = view.tone === "high" ? "Save plan" : view.tone === "medium" ? "Watch" : "On track";
  return view;
}

function sensorView(reading) {
  const wall = wallById(reading.wallId);
  const client = clientFor(wall);
  const acknowledged = isSensorAcknowledged(reading.id);
  return {
    ...reading,
    wall,
    client,
    acknowledged,
    displayStatus: acknowledged ? "Acknowledged" : reading.status,
    displayTone: acknowledged ? "acknowledged" : reading.status
  };
}

function sensorNeedsAction(reading) {
  return !isSensorAcknowledged(reading.id) && (reading.status === "alert" || reading.status === "offline" || reading.status === "watch");
}

function supplyView(item) {
  const available = item.onHand - item.reserved;
  const requested = isSupplyRequested(item.sku);
  const displayTone = requested ? "requested" : available <= item.reorderAt ? "alert" : available <= item.reorderAt * 2 ? "watch" : "ok";
  return {
    ...item,
    available,
    requested,
    displayTone,
    displayStatus: requested ? "Reorder requested" : available <= item.reorderAt ? "Reorder now" : available <= item.reorderAt * 2 ? "Watch stock" : "Ready"
  };
}

function invoiceView(invoice) {
  const client = clients.find((item) => item.id === invoice.clientId);
  const payment = invoicePayments[invoice.id] || null;
  const paid = isInvoicePaid(invoice.id);
  const displayTone = paid ? "paid" : invoice.status;
  return {
    ...invoice,
    client,
    payment,
    paid,
    displayTone,
    displayStatus: paid ? "Paid" : invoice.status === "overdue" ? "Overdue" : "Due"
  };
}

function scheduleSlotView(slot) {
  const order = workorders.find((item) => item.id === slot.workorderId);
  const wall = order ? wallById(order.wallId) : null;
  const client = wall ? clientFor(wall) : null;
  const technician = crewById(slot.technicianId);
  const confirmation = scheduleConfirmations[slot.id] || null;
  const confirmed = isScheduleConfirmed(slot.id);
  const displayTone = confirmed ? "confirmed" : slot.status === "at-risk" ? "at-risk" : "unconfirmed";
  return {
    ...slot,
    order,
    wall,
    client,
    technician,
    confirmation,
    confirmed,
    plannedMinutes: slot.durationMinutes + slot.travelMinutes,
    displayTone,
    displayStatus: confirmed ? "Confirmed" : slot.status === "at-risk" ? "At risk" : "Unconfirmed"
  };
}

function scheduleCapacityView(member) {
  const memberSlots = scheduleSlots
    .map(scheduleSlotView)
    .filter((slot) => slot.technicianId === member.id);
  const plannedMinutes = sum(memberSlots, (slot) => slot.plannedMinutes);
  const capacityMinutes = member.capacity * 75;
  const utilization = capacityMinutes ? Math.round((plannedMinutes / capacityMinutes) * 100) : 0;
  return {
    member,
    slots: memberSlots,
    plannedMinutes,
    capacityMinutes,
    utilization,
    tone: utilization >= 80 ? "watch" : "confirmed"
  };
}

function incidentSource(incident) {
  if (incident.sourceType === "sensor") return sensorReadings.find((item) => item.id === incident.sourceId);
  if (incident.sourceType === "proof") return proofRecords.find((item) => item.id === incident.sourceId);
  if (incident.sourceType === "workorder") return workorders.find((item) => item.id === incident.sourceId);
  return null;
}

function incidentView(incident) {
  const wall = wallById(incident.wallId);
  const client = wall ? clientFor(wall) : null;
  const order = workorders.find((item) => item.id === incident.linkedWorkorderId);
  const source = incidentSource(incident);
  const resolution = incidentResolutions[incident.id] || null;
  const resolved = isIncidentResolved(incident.id);
  const daysToDue = daysUntil(incident.dueDate);
  const displayTone = resolved
    ? "resolved"
    : incident.status === "escalated" || incident.severity === "critical"
      ? "escalated"
      : daysToDue < 0
        ? "breach"
        : daysToDue === 0
          ? "due-today"
          : incident.status;
  const displayStatus = resolved
    ? "Resolved"
    : displayTone === "escalated"
      ? "Escalated"
      : displayTone === "breach"
        ? "SLA breach"
        : displayTone === "due-today"
          ? "Due today"
          : incident.status === "triage"
            ? "Triage"
            : "Watch";
  return {
    ...incident,
    wall,
    client,
    order,
    source,
    resolution,
    resolved,
    daysToDue,
    displayTone,
    displayStatus
  };
}

function complianceView(item) {
  const client = clients.find((record) => record.id === item.clientId);
  const wall = item.wallId ? wallById(item.wallId) : null;
  const clearance = complianceClearances[item.id] || null;
  const cleared = isComplianceCleared(item.id);
  const daysToDue = daysUntil(item.dueDate);
  const displayTone = cleared
    ? "cleared"
    : item.status === "blocked"
      ? "blocked"
      : item.status === "expiring" || daysToDue <= 14
        ? "expiring"
        : item.status === "review"
          ? "review"
          : item.status;
  const displayStatus = cleared
    ? "Cleared"
    : displayTone === "blocked"
      ? "Blocked"
      : displayTone === "expiring"
        ? "Expiring"
        : displayTone === "review"
          ? "Review"
          : "Ready";
  return {
    ...item,
    client,
    wall,
    clearance,
    cleared,
    daysToDue,
    displayTone,
    displayStatus
  };
}

function quickTaskView(task) {
  const client = clients.find((item) => item.id === task.clientId);
  const wall = task.wallId ? wallById(task.wallId) : walls.find((item) => item.clientId === task.clientId);
  const template = mvpQuickTemplates.find((item) => item.id === task.templateId);
  return {
    ...task,
    client,
    wall,
    template,
    displayTone: task.status === "closed" ? "closed" : task.priority,
    displayStatus: task.status === "closed" ? "Closed" : "Open"
  };
}

function isAiActionQueued(id) {
  return Boolean(aiQueuedActions[id]);
}

function aiRecommendationView(recommendation) {
  const client = recommendation.clientId ? clients.find((item) => item.id === recommendation.clientId) : null;
  const wall = recommendation.wallId ? wallById(recommendation.wallId) : null;
  const queued = isAiActionQueued(recommendation.id);
  return {
    ...recommendation,
    client,
    wall,
    queued,
    displayTone: queued ? "queued" : recommendation.priority,
    displayStatus: queued ? "Queued for review" : `${recommendation.confidence}% confidence`
  };
}

function queueAiAction(id) {
  const recommendation = aiRecommendations.find((item) => item.id === id);
  if (!recommendation || aiQueuedActions[id]) return;
  const role = selectedRole();
  aiQueuedActions[id] = {
    queuedAt: new Date().toISOString(),
    queuedBy: role?.person || "FM Ops",
    action: recommendation.action
  };
  saveAiQueuedActions();
  recordAuditEvent({
    actor: role?.person || "FM Ops",
    action: "AI recommendation queued",
    entityType: "ai-recommendation",
    entityId: id,
    clientId: recommendation.clientId || null,
    tone: "ready",
    detail: `${recommendation.action}: ${recommendation.recommendation}`
  });
  state.reportGenerated = false;
  renderAll();
}

function healthBandFor(score) {
  if (score >= 90) return healthBands.find((band) => band.range === "90-100") || null;
  if (score >= 80) return healthBands.find((band) => band.range === "80-89") || null;
  if (score >= 70) return healthBands.find((band) => band.range === "70-79") || null;
  return healthBands.find((band) => band.range === "<70") || null;
}

function healthScoreBreakdown(wall) {
  const wallOrders = workorders.filter((order) => order.wallId === wall.id);
  const openOrders = wallOrders.filter((order) => !isWorkorderCompleted(order.id));
  const hasSmartSensors = wall.sensors.some((sensor) => sensor !== "manual photo check");
  const visualAi = clamp(Math.round(wall.health - wall.issues * 0.45 + (wall.status === "stable" ? 3 : wall.status === "watch" ? 0 : -4)));
  const sensorStability = clamp(Math.round((hasSmartSensors ? 96 : 88) - wall.issues * 1.7 - (wall.tags.includes("low light") ? 10 : 0)));
  const serviceCompliance = clamp(100 - openOrders.length * 8 - (wall.status === "risk" ? 8 : 0));
  const recoveryTrend = clamp(Math.round(wall.survival - wall.issues * 0.3 + (wall.status === "stable" ? 2 : -2)));
  const weightedScore = Math.round(
    visualAi * 0.45 +
    sensorStability * 0.25 +
    serviceCompliance * 0.2 +
    recoveryTrend * 0.1
  );
  const band = healthBandFor(wall.health);

  return {
    weightedScore,
    band,
    rows: [
      {
        label: "Visual AI condition",
        labelZh: "视觉 AI 状态",
        value: visualAi,
        weight: 45,
        driver: wall.status === "risk"
          ? "Low-light symptoms, uneven growth and follow-up photo due"
          : wall.status === "watch"
            ? "Yellowing or water-swing symptoms need review"
            : "Fullness and zone photos support stable status",
        driverZh: wall.status === "risk"
          ? "低光照症狀、生長不均與跟進照片待補"
          : wall.status === "watch"
            ? "黃葉或水分波動症狀需要複核"
            : "飽滿度與分區照片支持穩定狀態"
      },
      {
        label: "Sensor stability",
        labelZh: "环境稳定度",
        value: sensorStability,
        weight: 25,
        driver: hasSmartSensors
          ? wall.sensors.join(", ")
          : "Manual photo check until smart telemetry is added",
        driverZh: hasSmartSensors
          ? wall.sensors.join(", ")
          : "加入智能遙測前以人工照片檢查為主"
      },
      {
        label: "Service compliance",
        labelZh: "服务履约",
        value: serviceCompliance,
        weight: 20,
        driver: `${openOrders.length} open work order(s), ${wall.cadence} cadence`,
        driverZh: `${openOrders.length} 張未關閉工單，${wall.cadence} 到訪節奏`
      },
      {
        label: "Recovery trend",
        labelZh: "恢复趋势",
        value: recoveryTrend,
        weight: 10,
        driver: `${wall.survival}% survival rate, ${wall.issues} active issue(s)`,
        driverZh: `${wall.survival}% 存活率，${wall.issues} 個活躍問題`
      }
    ]
  };
}

function portfolioMetrics() {
  const activeWalls = walls.length;
  const activeClients = clients.length;
  const pods = sum(walls, (wall) => wall.pods);
  const greenArea = sum(walls, (wall) => wall.greenArea);
  const waterSaved = sum(walls, (wall) => wall.waterSaved);
  const serviceMilesSaved = sum(walls, (wall) => wall.serviceMilesSaved);
  const staffReach = sum(walls, (wall) => wall.staffReach);
  const co2eProxy = sum(walls, (wall) => wall.co2eProxy);
  const health = Math.min(99, avg(walls, (wall) => wall.health + state.simulatedVisits));
  const survival = avg(walls, (wall) => wall.survival);
  const issues = Math.max(0, sum(walls, (wall) => wall.issues) - state.simulatedVisits * 2);
  const revenue = sum(clients, (client) => client.revenue);
  const sensorAlerts = sensorReadings.filter(sensorNeedsAction).length;
  const supplyReorderItems = supplyItems.map(supplyView).filter((item) => item.displayTone === "alert").length;
  const invoiceRows = billingInvoices.map(invoiceView);
  const openInvoices = invoiceRows.filter((invoice) => !invoice.paid);
  const overdueInvoices = openInvoices.filter((invoice) => invoice.displayTone === "overdue");
  const outstandingAmount = sum(openInvoices, (invoice) => invoice.amount);
  const paidAmount = sum(invoiceRows.filter((invoice) => invoice.paid), (invoice) => invoice.amount);
  const scheduleRows = scheduleSlots.map(scheduleSlotView);
  const confirmedScheduleSlots = scheduleRows.filter((slot) => slot.confirmed);
  const openScheduleSlots = scheduleRows.filter((slot) => !slot.confirmed);
  const atRiskScheduleSlots = openScheduleSlots.filter((slot) => slot.displayTone === "at-risk");
  const scheduledMinutes = sum(scheduleRows, (slot) => slot.plannedMinutes);
  const capacityMinutes = sum(crewMembers, (member) => member.capacity * 75);
  const capacityLoad = capacityMinutes ? Math.round((scheduledMinutes / capacityMinutes) * 100) : 0;
  const incidentRows = incidentRecords.map(incidentView);
  const openIncidents = incidentRows.filter((incident) => !incident.resolved);
  const resolvedIncidents = incidentRows.filter((incident) => incident.resolved);
  const criticalIncidents = openIncidents.filter((incident) => incident.severity === "critical" || incident.displayTone === "escalated");
  const dueIncidents = openIncidents.filter((incident) => incident.daysToDue <= 0);
  const complianceRows = complianceItems.map(complianceView);
  const clearedComplianceItems = complianceRows.filter((item) => item.cleared);
  const openComplianceItems = complianceRows.filter((item) => !item.cleared);
  const blockedComplianceItems = openComplianceItems.filter((item) => item.displayTone === "blocked");
  const expiringComplianceItems = openComplianceItems.filter((item) => item.displayTone === "expiring");
  const quickTaskRows = quickOpsTasks.map(quickTaskView);
  const openQuickTasks = quickTaskRows.filter((task) => task.status !== "closed");
  const closedQuickTasks = quickTaskRows.filter((task) => task.status === "closed");
  const completeReadiness = mvpReadiness.filter((item) => item.status === "complete");
  const phaseTwoReadiness = mvpReadiness.filter((item) => item.status === "phase-2");
  const readyAssetClasses = assetClasses.filter((item) => item.status === "ready");
  const nextAssetClasses = assetClasses.filter((item) => item.status === "next");
  const phaseTwoAssetClasses = assetClasses.filter((item) => item.status === "phase-2");
  const adjacentAssetClasses = assetClasses.filter((item) => item.status === "adjacent");
  const aiRecommendationRows = aiRecommendations.map(aiRecommendationView);
  const highConfidenceAiRecommendations = aiRecommendationRows.filter((item) => item.confidence >= 85);
  const queuedAiRecommendations = aiRecommendationRows.filter((item) => item.queued);
  const openAiRecommendations = aiRecommendationRows.filter((item) => !item.queued);
  const reportReadiness = Math.min(99, Math.round((health * 0.45) + (survival * 0.35) + ((100 - issues) * 0.2)));

  return {
    activeWalls,
    activeClients,
    pods,
    greenArea,
    waterSaved,
    serviceMilesSaved,
    staffReach,
    co2eProxy,
    health,
    survival,
    issues,
    revenue,
    sensorAlerts,
    supplyReorderItems,
    openInvoices,
    overdueInvoices,
    outstandingAmount,
    paidAmount,
    scheduleSlots: scheduleRows,
    confirmedScheduleSlots,
    openScheduleSlots,
    atRiskScheduleSlots,
    scheduledMinutes,
    capacityMinutes,
    capacityLoad,
    incidents: incidentRows,
    openIncidents,
    resolvedIncidents,
    criticalIncidents,
    dueIncidents,
    complianceItems: complianceRows,
    clearedComplianceItems,
    openComplianceItems,
    blockedComplianceItems,
    expiringComplianceItems,
    quickTasks: quickTaskRows,
    openQuickTasks,
    closedQuickTasks,
    completeReadiness,
    phaseTwoReadiness,
    readyAssetClasses,
    nextAssetClasses,
    phaseTwoAssetClasses,
    adjacentAssetClasses,
    aiRecommendations: aiRecommendationRows,
    highConfidenceAiRecommendations,
    queuedAiRecommendations,
    openAiRecommendations,
    reportReadiness
  };
}

function metricsForClient(clientId) {
  const clientWalls = walls.filter((wall) => wall.clientId === clientId);
  const impactAssessment = impactAssessments.find((item) => item.clientId === clientId) || null;
  const roboticScenario = roboticFleet.find((item) => item.clientId === clientId) || null;
  const clientWorkorders = workorders.filter((order) => clientWalls.some((wall) => wall.id === order.wallId));
  const completedWorkorders = clientWorkorders.filter((order) => isWorkorderCompleted(order.id));
  const openWorkorders = clientWorkorders.filter((order) => !isWorkorderCompleted(order.id));
  const clientDiagnoses = diagnoses.filter((diagnosis) => clientWalls.some((wall) => wall.id === diagnosis.wallId));
  const clientProofRecords = proofRecords.filter((record) => clientWalls.some((wall) => wall.id === record.wallId));
  const approvedProofRecords = clientProofRecords.filter((record) => isProofApproved(record.id));
  const reportReadyProofRecords = clientProofRecords.filter(proofRecordReady);
  const proofGaps = clientProofRecords.filter((record) => !proofRecordReady(record));
  const clientSensorReadings = sensorReadings.filter((reading) => clientWalls.some((wall) => wall.id === reading.wallId));
  const openSensorAlerts = clientSensorReadings.filter(sensorNeedsAction);
  const clientAuditEvents = auditEventsForClient(clientId);
  const clientInvoices = billingInvoices
    .map(invoiceView)
    .filter((invoice) => invoice.clientId === clientId);
  const paidInvoices = clientInvoices.filter((invoice) => invoice.paid);
  const openInvoices = clientInvoices.filter((invoice) => !invoice.paid);
  const overdueInvoices = openInvoices.filter((invoice) => invoice.displayTone === "overdue");
  const outstandingAmount = sum(openInvoices, (invoice) => invoice.amount);
  const paidAmount = sum(paidInvoices, (invoice) => invoice.amount);
  const clientScheduleSlots = scheduleSlots
    .map(scheduleSlotView)
    .filter((slot) => slot.order && clientWalls.some((wall) => wall.id === slot.order.wallId));
  const confirmedScheduleSlots = clientScheduleSlots.filter((slot) => slot.confirmed);
  const openScheduleSlots = clientScheduleSlots.filter((slot) => !slot.confirmed);
  const clientIncidents = incidentRecords
    .map(incidentView)
    .filter((incident) => clientWalls.some((wall) => wall.id === incident.wallId));
  const openIncidents = clientIncidents.filter((incident) => !incident.resolved);
  const resolvedIncidents = clientIncidents.filter((incident) => incident.resolved);
  const criticalIncidents = openIncidents.filter((incident) => incident.severity === "critical" || incident.displayTone === "escalated");
  const clientComplianceItems = complianceItems
    .map(complianceView)
    .filter((item) => item.clientId === clientId);
  const clearedComplianceItems = clientComplianceItems.filter((item) => item.cleared);
  const openComplianceItems = clientComplianceItems.filter((item) => !item.cleared);
  const blockedComplianceItems = openComplianceItems.filter((item) => item.displayTone === "blocked");
  const clientQuickTasks = quickOpsTasks
    .map(quickTaskView)
    .filter((task) => task.clientId === clientId);
  const openQuickTasks = clientQuickTasks.filter((task) => task.status !== "closed");
  const closedQuickTasks = clientQuickTasks.filter((task) => task.status === "closed");
  const clientAiRecommendations = aiRecommendations
    .map(aiRecommendationView)
    .filter((item) => item.clientId === clientId);
  const openAiRecommendations = clientAiRecommendations.filter((item) => !item.queued);
  const queuedAiRecommendations = clientAiRecommendations.filter((item) => item.queued);
  const greenArea = sum(clientWalls, (wall) => wall.greenArea);
  const waterSaved = sum(clientWalls, (wall) => wall.waterSaved);
  const serviceMilesSaved = sum(clientWalls, (wall) => wall.serviceMilesSaved);
  const staffReach = sum(clientWalls, (wall) => wall.staffReach);
  const co2eProxy = sum(clientWalls, (wall) => wall.co2eProxy);
  const health = clientWalls.length ? Math.min(99, avg(clientWalls, (wall) => wall.health + state.simulatedVisits)) : 0;
  const survival = clientWalls.length ? avg(clientWalls, (wall) => wall.survival) : 0;
  const issues = Math.max(0, sum(clientWalls, (wall) => wall.issues) - state.simulatedVisits * 2);
  const reportReadiness = Math.min(99, Math.round((health * 0.45) + (survival * 0.35) + ((100 - issues) * 0.2)));

  return {
    walls: clientWalls,
    workorders: clientWorkorders,
    completedWorkorders,
    openWorkorders,
    diagnoses: clientDiagnoses,
    proofRecords: clientProofRecords,
    approvedProofRecords,
    reportReadyProofRecords,
    proofGaps,
    sensorReadings: clientSensorReadings,
    openSensorAlerts,
    auditEvents: clientAuditEvents,
    invoices: clientInvoices,
    paidInvoices,
    openInvoices,
    overdueInvoices,
    outstandingAmount,
    paidAmount,
    scheduleSlots: clientScheduleSlots,
    confirmedScheduleSlots,
    openScheduleSlots,
    incidents: clientIncidents,
    openIncidents,
    resolvedIncidents,
    criticalIncidents,
    complianceItems: clientComplianceItems,
    clearedComplianceItems,
    openComplianceItems,
    blockedComplianceItems,
    quickTasks: clientQuickTasks,
    openQuickTasks,
    closedQuickTasks,
    aiRecommendations: clientAiRecommendations,
    openAiRecommendations,
    queuedAiRecommendations,
    impactAssessment,
    roboticScenario,
    greenArea,
    waterSaved,
    serviceMilesSaved,
    staffReach,
    co2eProxy,
    health,
    survival,
    issues,
    reportReadiness
  };
}

function renderStatCards(container, cards, className = "stat-card") {
  container.innerHTML = cards.map((card) => `
    <article class="${className}">
      <span>${localizedText(card.label, card.labelZh || card.label)}</span>
      <strong>${card.value}</strong>
      <em>${localizedText(card.detail, card.detailZh || card.detail)}</em>
    </article>
  `).join("");
}

function renderOverview() {
  const data = portfolioMetrics();
  renderStatCards(els.summaryGrid, [
    { label: "Active clients", labelZh: "活跃客户", value: data.activeClients, detail: `${data.activeWalls} Wall assets under FM care`, detailZh: "已纳入运营管理的绿墙资产" },
    { label: "Portfolio health", labelZh: "资产健康度", value: data.health, detail: `${data.survival}% plant survival rate`, detailZh: "植物存活率和整体健康表现" },
    { label: "AI action queue", labelZh: "AI 行动队列", value: data.openAiRecommendations.length, detail: `${data.highConfidenceAiRecommendations.length} high-confidence recommendation(s)`, detailZh: "需要人工复核的 AI 建议" },
    { label: "Managed value", labelZh: "管理合同价值", value: formatCurrency(data.revenue), detail: `${formatCurrency(data.outstandingAmount)} open AR`, detailZh: "合同收入和未收账款视图" }
  ]);

  els.proofStrip.innerHTML = [
    ["Living asset classes", "活体资产类别", `${assetClasses.length} mapped`],
    ["SLA incidents", "服务事件", `${data.openIncidents.length} open`],
    ["Wall green area", "绿墙面积", `${data.greenArea.toFixed(1)} m2`],
    ["ESG proof mode", "ESG 证明模式", "Evidence first"]
  ].map(([label, zh, value]) => `
    <div>
      <span>${label}<small class="zh">${zh}</small></span>
      <strong>${value}</strong>
    </div>
  `).join("");

  els.riskList.innerHTML = walls
    .filter((wall) => wall.status !== "stable")
    .sort((a, b) => a.health - b.health)
    .map((wall) => `
      <button type="button" class="list-item" data-wall-select="${wall.id}">
        <div class="item-row">
          <strong>${wall.id} - ${wall.name}</strong>
          <span class="tag ${statusClass(wall.status)}">${wall.status}</span>
        </div>
        <span>${clientFor(wall).name} - ${wall.location}</span>
        <small>Health ${wall.health} - ${wall.issues} issues - next visit ${wall.nextVisit}</small>
        <small class="zh-copy">健康分 ${wall.health}，${wall.issues} 个问题，下次巡检 ${wall.nextVisit}</small>
      </button>
    `).join("");

  els.serviceTimeline.innerHTML = workorders.map((order) => {
    const wall = wallById(order.wallId);
    const view = workorderView(order);
    return `
      <button type="button" class="list-item" data-wall-select="${wall.id}">
        <div class="item-row">
          <strong>${view.due}</strong>
          <span class="tag ${statusClass(view.displayPriority === "high" ? "risk" : view.displayPriority)}">${view.displayStatus}</span>
        </div>
        <span>${view.id} - ${view.type}</span>
        <small>${clientFor(wall).name} - ${view.tasks.join(", ")}</small>
        <small class="zh-copy">服务节奏：按计划巡检、拍照、处理养护任务。</small>
      </button>
    `;
  }).join("");
}

function renderAiCommandCenter() {
  const data = portfolioMetrics();
  const queuedCount = data.queuedAiRecommendations.length;
  const openCount = data.openAiRecommendations.length;
  const highestConfidence = data.aiRecommendations.length
    ? Math.max(...data.aiRecommendations.map((item) => item.confidence))
    : 0;

  els.aiStatus.textContent = `${openCount} open AI recommendation(s), ${queuedCount} queued for human review / ${openCount} 条待复核 AI 建议，${queuedCount} 条已入队`;
  els.aiStatus.classList.toggle("good", openCount === 0 && queuedCount > 0);

  const summaryCards = aiSummary.map((card) => ({
    label: card.label,
    labelZh: card.labelZh,
    value: card.value,
    detail: card.detail,
    detailZh: contentTranslations[card.detail]
  }));
  renderStatCards(els.aiGrid, [
    { label: "Open AI recommendations", labelZh: "待复核 AI 建议", value: openCount, detail: "Human-reviewed before client impact", detailZh: "进入客户动作前必须人工复核" },
    { label: "High confidence", labelZh: "高置信建议", value: data.highConfidenceAiRecommendations.length, detail: `${highestConfidence}% top confidence score`, detailZh: "最高置信度建议分数" },
    { label: "Queued actions", labelZh: "已入队动作", value: queuedCount, detail: "Written into audit ledger", detailZh: "已写入审计台账" },
    ...(summaryCards.length ? [summaryCards[2] || summaryCards[0]] : [])
  ].slice(0, 4));

  els.aiRecommendationList.innerHTML = data.aiRecommendations.map((item) => `
    <article class="list-item ai-card ${item.displayTone}" data-ai-card="${item.id}">
      <div class="item-row">
        <strong>${item.id} - ${localizedField(item, "type")}</strong>
        <span class="tag ${statusClass(item.displayTone)}">${item.displayStatus}</span>
      </div>
      <span>${item.client?.name || "Portfolio"}${item.wall ? ` - ${item.wall.name}` : ""}</span>
      <small>${localizedField(item, "trigger")}</small>
      <strong>${localizedField(item, "recommendation")}</strong>
      <div class="kit-list">
        ${item.evidence.map((record) => `<em>${record}</em>`).join("")}
      </div>
      <small>${localizedField(item, "guardrail")}</small>
      <small class="zh-copy">中文理解：AI 负责提前发现风险和建议动作，但客户影响、报告主张和工单关闭仍由人批准。</small>
      <div class="workorder-actions">
        ${item.wall ? `<button type="button" class="mini-action" data-wall-select="${item.wall.id}">View asset</button>` : ""}
        <button type="button" class="mini-action primary" data-queue-ai-action="${item.id}" ${item.queued ? "disabled" : ""}>${item.queued ? localizedText("Queued", "已入隊") : localizedField(item, "action")}</button>
      </div>
    </article>
  `).join("");

  els.aiGovernanceList.innerHTML = aiGovernance.map((item) => `
    <div class="method-row">
      <span>${localizedField(item, "label")}</span>
      <strong>${localizedField(item, "rule")}</strong>
    </div>
  `).join("");

  els.aiFlywheelList.innerHTML = aiFlywheel.map((item) => `
    <div class="method-row flywheel-row">
      <span>${localizedField(item, "stage")}</span>
      <strong>${localizedField(item, "body")}</strong>
    </div>
  `).join("");
}

function renderHealthScoreMethod() {
  const wall = selectedWall() || walls[0];
  if (!wall) return;

  const breakdown = healthScoreBreakdown(wall);
  const band = breakdown.band;
  const formulaText = healthFormula
    .map((item) => `${localizedField(item, "label")} ${item.weight}%`)
    .join(" + ");
  const mvpSourceCount = healthSources.filter((source) => source.status === "MVP" || source.status === "Core").length;

  els.healthStatus.textContent = `Current ledger score ${wall.health}, model explanation ${breakdown.weightedScore} / 当前台账分 ${wall.health}，公式解释分 ${breakdown.weightedScore}`;
  els.healthStatus.classList.toggle("good", wall.health >= 85);

  renderStatCards(els.healthGrid, [
    { label: "Selected health score", labelZh: "当前健康分", value: wall.health, detail: `${band?.label || "Review"} - ${band?.action || "Review current evidence"}`, detailZh: "当前选中绿墙的台账健康分" },
    { label: "Formula", labelZh: "评分公式", value: "4-part", detail: formulaText, detailZh: "四类数据加权，不是单张照片拍脑袋" },
    { label: "MVP data sources", labelZh: "MVP 数据源", value: mvpSourceCount, detail: "Mobile photo, work order and manual review are enough to launch", detailZh: "先手机拍照、工单和人工复核即可上线" },
    { label: "Built-in camera", labelZh: "内置摄像头", value: "Optional", detail: "Premium Smart Wall add-on, not an MVP dependency", detailZh: "高端智能墙可选，不是 MVP 前置条件" }
  ]);

  els.healthFormulaList.innerHTML = healthFormula.map((item) => `
    <div class="method-row health-formula-row">
      <span>${localizedField(item, "label")}<small class="zh">${item.labelZh}</small></span>
      <strong>${item.weight}% - ${localizedField(item, "body")}</strong>
      <em>${localizedField(item, "proof")}</em>
    </div>
  `).join("");

  els.healthBreakdownList.innerHTML = breakdown.rows.map((item) => `
      <article class="list-item health-score-card ${item.value >= 90 ? "ready" : item.value >= 80 ? "review" : "alert"}">
        <div class="item-row">
        <strong>${localizedField(item, "label")}</strong>
        <span class="tag ${statusClass(item.value >= 90 ? "ready" : item.value >= 80 ? "review" : "alert")}">${item.value}</span>
      </div>
      <span>${localizedField(item, "label")} - ${localizedText("weight", "權重")} ${item.weight}%</span>
      <div class="bar-track"><div class="bar-fill" style="width: ${item.value}%"></div></div>
      <small>${localizedField(item, "driver")}</small>
    </article>
  `).join("");

  els.healthSourceList.innerHTML = healthSources.map((source) => `
    <div class="method-row health-source-row">
      <span>${localizedField(source, "label")} - ${source.status}</span>
      <strong>${localizedField(source, "body")}</strong>
    </div>
  `).join("");

  els.healthWorkflowList.innerHTML = healthCaptureWorkflow.map((step) => `
    <div class="method-row health-workflow-row">
      <span>${localizedField(step, "step")}</span>
      <strong>${localizedField(step, "body")}</strong>
    </div>
  `).join("");

  els.healthCameraList.innerHTML = healthCameraRoadmap.map((item) => `
    <div class="method-row health-camera-row">
      <span>${item.phase} - ${item.position}</span>
      <strong>${localizedField(item, "label")}</strong>
      <em>${localizedField(item, "body")}</em>
    </div>
  `).join("");

  els.healthQualityList.innerHTML = healthQualityControls.map((control) => `
    <div class="method-row health-quality-row">
      <span>${localizedField(control, "label")}</span>
      <strong>${localizedField(control, "rule")}</strong>
    </div>
  `).join("");
}

function renderSpatialDesign() {
  if (!els.spatialGrid) return;

  const selected = selectedClient();
  const selectedInterventions = selected
    ? spatialInterventions.filter((item) => item.clientId === selected.id)
    : [];
  const averageDiagnosis = spatialDiagnostics.length
    ? avg(spatialDiagnostics, (item) => item.score)
    : 0;
  const opsHandoffCount = sum(spatialInterventions, (item) => (item.opsHandoff || []).length);

  els.spatialStatus.textContent = `${spatialInterventions.length} design-reviewed intervention(s), ${selectedInterventions.length} linked to selected client / ${spatialInterventions.length} 个设计复核建议，${selectedInterventions.length} 个关联当前客户`;
  els.spatialStatus.classList.toggle("good", spatialInterventions.length > 0 && spatialProofPack.length >= 4);

  const fallbackCards = [
    { label: "Design-reviewed sites", labelZh: "设计复核点位", value: spatialInterventions.length, detail: "Client assets with spatial intent and operations handoff", detailZh: "已有空间意图和运营交接的客户资产" },
    { label: "Avg spatial score", labelZh: "平均空间分", value: averageDiagnosis, detail: "Across use, sightline, material, atmosphere and maintainability", detailZh: "覆盖使用、视线、材质、氛围和可维护性" },
    { label: "Ops handoff items", labelZh: "运营交接项", value: opsHandoffCount, detail: "Design details translated into field checks", detailZh: "把设计要求转成现场检查动作" },
    { label: "Spatial proof pack", labelZh: "空间证明包", value: spatialProofPack.length, detail: "Evidence types available for renewal and upsell", detailZh: "可用于续约和加购的证据类型" }
  ];

  renderStatCards(els.spatialGrid, spatialSummary.length ? spatialSummary : fallbackCards);

  els.spatialDiagnosticList.innerHTML = spatialDiagnostics.map((item) => `
    <div class="method-row spatial-diagnostic-row">
      <span>${localizedField(item, "label")}<small class="zh">${item.labelZh}</small></span>
      <strong>${item.score}/100 - ${localizedField(item, "body")}</strong>
      <div class="bar-track"><div class="bar-fill" style="width: ${item.score}%"></div></div>
      <em>${localizedList(item.evidence).join(" / ")}</em>
    </div>
  `).join("");

  els.spatialInterventionList.innerHTML = spatialInterventions.map((item) => {
    const client = clients.find((record) => record.id === item.clientId);
    const wall = wallById(item.wallId);
    const handoff = item.opsHandoff || [];
    return `
      <article class="list-item spatial-intervention-card ${item.status}">
        <div class="item-row">
          <strong>${item.id} - ${item.spaceType}</strong>
          <span class="tag ${statusClass(item.status)}">${item.status}</span>
        </div>
        <span>${client?.name || "Client"}${wall ? ` - ${wall.name}` : ""}</span>
        <small>${localizedField(item, "intent")}</small>
        <strong>${localizedField(item, "recommendation")}</strong>
        <small>${localizedText("Designer note", "設計師備註")}: ${localizedField(item, "designerNote")}</small>
        <div class="kit-list">
          ${localizedList(handoff).map((task) => `<em>${task}</em>`).join("")}
        </div>
        <div class="workorder-actions">
          ${client ? `<button type="button" class="mini-action" data-client-select="${client.id}">View client</button>` : ""}
          ${wall ? `<button type="button" class="mini-action primary" data-wall-select="${wall.id}">View asset</button>` : ""}
        </div>
      </article>
    `;
  }).join("");

  els.spatialPrincipleList.innerHTML = spatialPrinciples.map((item) => `
    <div class="method-row spatial-principle-row">
      <span>${localizedField(item, "label")}<small class="zh">${item.labelZh}</small></span>
      <strong>${localizedField(item, "rule")}</strong>
    </div>
  `).join("");

  els.spatialWorkflowList.innerHTML = spatialWorkflow.map((item) => `
    <div class="method-row spatial-workflow-row">
      <span>${localizedField(item, "step")}<small class="zh">${item.stepZh}</small></span>
      <strong>${localizedField(item, "body")}</strong>
    </div>
  `).join("");

  els.spatialProofList.innerHTML = spatialProofPack.map((item) => `
    <div class="method-row spatial-proof-row">
      <span>${localizedField(item, "label")}<small class="zh">${item.labelZh}</small></span>
      <strong>${localizedField(item, "body")}</strong>
    </div>
  `).join("");
}

function renderImpactValue() {
  if (!els.impactGrid) return;

  const selected = selectedClient();
  const selectedAssessment = selected
    ? impactAssessments.find((item) => item.clientId === selected.id)
    : null;
  const averageWorkplace = impactAssessments.length
    ? avg(impactAssessments, (item) => item.workplaceScore)
    : 0;
  const averageBrand = impactAssessments.length
    ? avg(impactAssessments, (item) => item.brandScore)
    : 0;
  const averageXponge = impactAssessments.length
    ? avg(impactAssessments, (item) => item.xpongeScore)
    : 0;

  els.impactStatus.textContent = `${impactPillars.length} value pillars, ${impactEvidencePack.length} evidence types / ${impactPillars.length} 个价值支柱，${impactEvidencePack.length} 类证据`;
  els.impactStatus.classList.toggle("good", impactEvidencePack.length >= 5);

  const fallbackCards = [
    { label: "Xponge safety score", labelZh: "Xponge 安全分", value: averageXponge, detail: "Tracks soil-free coverage, pest/disease pressure and chemical intervention records", detailZh: "追踪无土覆盖、病虫害压力和用药干预记录" },
    { label: "Workplace wellbeing", labelZh: "员工体验", value: averageWorkplace, detail: "Staff pulse and spatial comfort indicators, not unverified productivity claims", detailZh: "员工脉搏和空间舒适指标，不直接夸大为效率结论" },
    { label: "Green brand value", labelZh: "绿色品牌价值", value: averageBrand, detail: "Visible green touchpoints for reception, showroom, clinic and club spaces", detailZh: "前台、展厅、诊所和会所的可见绿色触点" },
    { label: "Claim boundary", labelZh: "主张边界", value: "Support", detail: "Evidence supports ESG and brand communication; certification still needs external assurance", detailZh: "支持 ESG 和品牌传播，不替代外部认证" }
  ];

  renderStatCards(els.impactGrid, impactSummary.length ? impactSummary : fallbackCards);

  els.impactPillarList.innerHTML = impactPillars.map((pillar) => `
    <div class="method-row impact-pillar-row ${pillar.status}">
      <span>${localizedField(pillar, "label")}<small class="zh">${pillar.labelZh}</small></span>
      <strong>${pillar.value} - ${localizedField(pillar, "body")}</strong>
      <em>${localizedField(pillar, "esgLink")}</em>
      <div class="kit-list">
        ${localizedList(pillar.signals).map((signal) => `<em>${signal}</em>`).join("")}
      </div>
      <small>${localizedField(pillar, "claimBoundary")}</small>
    </div>
  `).join("");

  els.impactAssessmentList.innerHTML = impactAssessments.map((assessment) => {
    const client = clients.find((item) => item.id === assessment.clientId);
    const isSelected = selected && assessment.clientId === selected.id;
    return `
      <article class="list-item impact-assessment-card ${isSelected ? "selected" : ""}" data-impact-client="${assessment.clientId}">
        <div class="item-row">
          <strong>${client?.name || assessment.clientId}</strong>
          <span class="tag ${isSelected ? "good" : ""}">${isSelected ? "Selected" : "Tracked"}</span>
        </div>
        <div class="impact-score-row">
          <span>Xponge <strong>${assessment.xpongeScore}</strong></span>
          <span>${localizedText("Workplace", "職場")} <strong>${assessment.workplaceScore}</strong></span>
          <span>${localizedText("Brand", "品牌")} <strong>${assessment.brandScore}</strong></span>
        </div>
        <small>${localizedField(assessment, "note")}</small>
        <div class="kit-list">
          ${localizedList(assessment.touchpoints).map((point) => `<em>${point}</em>`).join("")}
        </div>
        <button type="button" class="mini-action" data-client-select="${assessment.clientId}">${localizedText("View client", "查看客戶")}</button>
      </article>
    `;
  }).join("");

  els.impactMetricList.innerHTML = impactMetrics.map((metric) => `
    <div class="method-row impact-metric-row ${metric.tone}">
      <span>${localizedField(metric, "label")}<small class="zh">${metric.labelZh}</small></span>
      <strong>${metric.value} - ${localizedField(metric, "body")}</strong>
      <em>${metric.group}</em>
    </div>
  `).join("");

  els.impactWorkflowList.innerHTML = impactWorkflow.map((item) => `
    <div class="method-row impact-workflow-row">
      <span>${localizedField(item, "step")}<small class="zh">${item.stepZh}</small></span>
      <strong>${localizedField(item, "body")}</strong>
    </div>
  `).join("");

  els.impactEvidenceList.innerHTML = impactEvidencePack.map((item) => `
    <article class="list-item impact-evidence-card ${item.status}">
      <div class="item-row">
        <strong>${localizedField(item, "label")}</strong>
        <span class="tag ${statusClass(item.status)}">${item.status}</span>
      </div>
      <span>${localizedField(item, "category")}<small class="zh">${item.labelZh}</small></span>
      <small>${localizedField(item, "body")}</small>
      <em>${localizedField(item, "proof")}</em>
    </article>
  `).join("");

  els.impactClaimList.innerHTML = impactClaimControls.map((item) => `
    <div class="method-row impact-claim-row ${item.tone}">
      <span>${localizedField(item, "label")}<small class="zh">${item.labelZh}</small></span>
      <strong>${localizedField(item, "body")}</strong>
    </div>
  `).join("");

  if (selectedAssessment) {
    els.impactStatus.textContent = `${selected.name}: Xponge ${selectedAssessment.xpongeScore}, workplace ${selectedAssessment.workplaceScore}, brand ${selectedAssessment.brandScore} / 当前客户影响快照`;
  }
}

function renderRoboticCare() {
  if (!els.roboticGrid) return;

  const selected = selectedClient();
  const selectedFleet = selected
    ? roboticFleet.find((item) => item.clientId === selected.id) || roboticFleet[0]
    : roboticFleet[0];
  const averageReadiness = roboticFleet.length
    ? avg(roboticFleet, (item) => item.readinessScore)
    : 0;
  const robotReadyInterfaces = roboticInterfaces.filter((item) => item.status === "robot-ready" || item.status === "ready");
  const phaseThreeItems = roboticRoadmap.filter((item) => item.status === "phase-3" || item.status === "pilot");

  els.roboticStatus.textContent = `${roboticCapabilities.length} robot care capabilities, ${robotReadyInterfaces.length} robot-ready interfaces / ${roboticCapabilities.length} 项机器人看护能力，${robotReadyInterfaces.length} 个机器人就绪接口`;
  els.roboticStatus.classList.toggle("good", robotReadyInterfaces.length >= 3);

  const fallbackCards = [
    { label: "Autonomous care", labelZh: "自主看护", value: "Phase 3", detail: "Robots patrol, refill, dose and capture proof after the operating ledger is mature", detailZh: "运营台账成熟后，再让机器人巡检、补水、加营养液和采集凭证" },
    { label: "Robot readiness", labelZh: "机器人就绪度", value: averageReadiness, detail: "Average readiness across current demo client scenarios", detailZh: "当前演示客户场景的平均机器人接入准备度" },
    { label: "Module interfaces", labelZh: "模块接口", value: roboticInterfaces.length, detail: "Wall hardware interfaces required before autonomous care", detailZh: "自主看护前需要标准化的绿墙硬件接口" },
    { label: "Human fallback", labelZh: "人工兜底", value: "Required", detail: "Robots handle repeated routines; technicians handle trimming, replacement and exceptions", detailZh: "机器人处理重复动作，人工处理修剪、更换和复杂异常" }
  ];

  renderStatCards(els.roboticGrid, roboticSummary.length ? roboticSummary : fallbackCards);

  els.roboticCapabilityList.innerHTML = roboticCapabilities.map((item) => `
    <div class="method-row robotic-capability-row ${item.status}">
      <span>${localizedField(item, "label")}<small class="zh">${item.labelZh}</small></span>
      <strong>${item.value} - ${localizedField(item, "body")}</strong>
      <em>${localizedField(item, "opsLink")}</em>
      <div class="kit-list">
        ${localizedList(item.inputs).map((input) => `<em>${input}</em>`).join("")}
      </div>
    </div>
  `).join("");

  els.roboticInterfaceList.innerHTML = roboticInterfaces.map((item) => `
    <div class="method-row robotic-interface-row ${item.status}">
      <span>${localizedField(item, "label")}<small class="zh">${item.labelZh}</small></span>
      <strong>${localizedField(item, "requirement")}</strong>
      <em>${localizedField(item, "reason")}</em>
    </div>
  `).join("");

  els.roboticFleetList.innerHTML = roboticFleet.map((scenario) => {
    const client = clients.find((item) => item.id === scenario.clientId);
    const isSelected = selected && scenario.clientId === selected.id;
    return `
      <article class="list-item robotic-fleet-card ${isSelected ? "selected" : ""}" data-robotic-client="${scenario.clientId}">
        <div class="item-row">
          <strong>${client?.name || scenario.clientId}</strong>
          <span class="tag ${statusClass(scenario.status)}">${scenario.status}</span>
        </div>
        <div class="impact-score-row">
          <span>${localizedText("Readiness", "就緒度")} <strong>${scenario.readinessScore}</strong></span>
          <span>${localizedText("Patrol", "巡檢")} <strong>${localizedPhrase(scenario.patrolCadence)}</strong></span>
          <span>${localizedText("Mode", "模式")} <strong>${localizedPhrase(scenario.robotMode)}</strong></span>
        </div>
        <small>${localizedField(scenario, "body")}</small>
        <div class="kit-list">
          ${localizedList(scenario.tasks).map((task) => `<em>${task}</em>`).join("")}
        </div>
        <button type="button" class="mini-action" data-client-select="${scenario.clientId}">${localizedText("View client", "查看客戶")}</button>
      </article>
    `;
  }).join("");

  els.roboticWorkflowList.innerHTML = roboticWorkflow.map((item) => `
    <div class="method-row robotic-workflow-row">
      <span>${localizedField(item, "step")}<small class="zh">${item.stepZh}</small></span>
      <strong>${localizedField(item, "body")}</strong>
    </div>
  `).join("");

  els.roboticRoadmapList.innerHTML = roboticRoadmap.map((item) => `
    <article class="list-item robotic-roadmap-card ${item.status}">
      <div class="item-row">
        <strong>${localizedPhrase(item.phase)} - ${localizedField(item, "label")}</strong>
        <span class="tag ${statusClass(item.status)}">${item.status}</span>
      </div>
      <span>${localizedField(item, "body")}</span>
      <small>${localizedField(item, "investorSignal")}</small>
    </article>
  `).join("");

  els.roboticEvidenceList.innerHTML = roboticEvidencePack.map((item) => `
    <article class="list-item robotic-evidence-card ${item.status}">
      <div class="item-row">
        <strong>${localizedField(item, "label")}</strong>
        <span class="tag ${statusClass(item.status)}">${item.status}</span>
      </div>
      <span>${localizedField(item, "category")}<small class="zh">${item.labelZh}</small></span>
      <small>${localizedField(item, "body")}</small>
      <em>${localizedField(item, "proof")}</em>
    </article>
  `).join("");

  els.roboticClaimList.innerHTML = roboticClaimControls.map((item) => `
    <div class="method-row robotic-claim-row ${item.tone}">
      <span>${localizedField(item, "label")}<small class="zh">${item.labelZh}</small></span>
      <strong>${localizedField(item, "body")}</strong>
    </div>
  `).join("");

  if (selectedFleet) {
    els.roboticStatus.textContent = `${selected?.name || "Selected site"}: readiness ${selectedFleet.readinessScore}, ${selectedFleet.robotMode}, ${selectedFleet.patrolCadence} / 机器人看护准备度`;
  }
}

function renderPlatform() {
  const data = portfolioMetrics();
  const readyCount = data.readyAssetClasses.length;
  const nextCount = data.nextAssetClasses.length;

  els.platformStatus.textContent = `${readyCount} MVP asset class, ${nextCount} expansion classes / ${readyCount} 个 MVP 资产类别，${nextCount} 个可扩展类别`;
  els.platformStatus.classList.toggle("good", readyCount > 0 && nextCount >= 3);

  renderStatCards(els.platformGrid, [
    { label: "Platform scope", labelZh: "平台范围", value: assetClasses.length, detail: "Living and adjacent green asset classes mapped", detailZh: "已映射可纳入系统的产品类别" },
    { label: "Wall wedge", labelZh: "绿墙切入点", value: data.activeWalls, detail: "Current MVP assets with real service, proof and ESG data", detailZh: "先用绿墙证明服务、凭证和 ESG 价值" },
    { label: "Expansion runway", labelZh: "扩展空间", value: nextCount, detail: "Product families that can reuse the same operating ledger", detailZh: "可复用同一资产台账的产品线" },
    { label: "Investor comps", labelZh: "融资参照", value: investorBenchmarks.length, detail: "Funding cases mapped into product lessons", detailZh: "用类似融资案例解释价值逻辑" }
  ]);

  els.assetScopeList.innerHTML = assetClasses.map((asset) => `
    <article class="list-item asset-scope-card ${asset.status}" data-asset-scope="${asset.id}">
      <div class="item-row">
        <strong>${asset.label}</strong>
        <span class="tag ${statusClass(asset.status)}">${asset.stage}</span>
      </div>
      <span>${asset.fit}</span>
      <small class="zh-copy">中文理解：这类产品只要有合同、点位、养护责任、健康状态和续约价值，就能进入系统。</small>
      <small>${asset.signals.join(" / ")}</small>
      <small>${asset.monetization}</small>
    </article>
  `).join("");

  els.expansionRoadmapList.innerHTML = expansionRoadmap.map((phase) => `
    <article class="method-row roadmap-row ${phase.status}" data-expansion-phase="${phase.phase}">
      <span>${phase.phase} - ${phase.label}</span>
      <strong>${phase.proof}</strong>
      <em>${phase.investorQuestion}</em>
      <em class="zh-copy">中文理解：这是从单一绿墙产品走向多产品平台的阶段路径。</em>
    </article>
  `).join("");

  els.investorBenchmarkList.innerHTML = investorBenchmarks.map((item) => `
    <article class="method-row benchmark-row">
      <span>${item.company} - ${item.category}</span>
      <strong>${item.signal}</strong>
      <em>${item.lesson}</em>
      <em class="zh-copy">中文理解：投资人看重的是持续运营数据、客户留存、资产价值和可扩展性。</em>
    </article>
  `).join("");

  const thesisCards = platformThesis.length ? platformThesis : [
    {
      title: "Investor thesis",
      value: "Living Asset OS",
      body: "Wall proves the operating model first, then the same ledger expands across DR FOREST products."
    }
  ];
  els.platformThesisGrid.innerHTML = thesisCards.map((card) => `
    <article class="strategy-card">
      <span>${card.title}</span>
      <strong>${card.value}</strong>
      <p>${card.body}</p>
    </article>
  `).join("");
}

function renderMvpControl() {
  const role = selectedRole();
  const data = portfolioMetrics();
  const readinessRatio = mvpReadiness.length ? Math.round((data.completeReadiness.length / mvpReadiness.length) * 100) : 0;
  const openTasks = data.openQuickTasks;
  const closedTasks = data.closedQuickTasks;

  els.mvpStatus.textContent = `${readinessRatio}% MVP readiness, ${openTasks.length} open quick task(s) / MVP 准备度 ${readinessRatio}%，${openTasks.length} 个快速任务`;
  els.mvpStatus.classList.toggle("good", readinessRatio >= 80);
  renderStatCards(els.mvpGrid, [
    { label: "MVP readiness", labelZh: "MVP 准备度", value: `${readinessRatio}%`, detail: `${data.completeReadiness.length}/${mvpReadiness.length} handoff items complete`, detailZh: "当前可演示功能完成比例" },
    { label: "Active role", labelZh: "当前角色", value: role?.label || "No role", detail: role ? `${role.person} - ${role.scope}` : "Role model not loaded", detailZh: "演示时模拟不同运营角色权限" },
    { label: "Quick tasks", labelZh: "快速任务", value: openTasks.length, detail: `${closedTasks.length} closed task(s) in local demo state`, detailZh: "用于演示创建、关闭和审计记录" },
    { label: "Phase 2 markers", labelZh: "二期标记", value: data.phaseTwoReadiness.length, detail: "Backend, auth and integrations stay out of MVP scope", detailZh: "正式上线前再接后端、权限和集成" }
  ]);

  els.activeRoleSelect.innerHTML = mvpRoles.map((item) => `
    <option value="${item.id}" ${item.id === role?.id ? "selected" : ""}>${item.label} - ${item.person}</option>
  `).join("");

  els.activeRoleDetail.innerHTML = role ? [
    ["Role", role.label],
    ["Actor", role.person],
    ["Scope", role.scope],
    ["Permissions", role.permissions.length]
  ].map(([label, value]) => `<div><span>${label}</span><strong>${value}</strong></div>`).join("") : "";

  els.permissionList.innerHTML = role ? role.permissions.map((permission) => `
    <div class="method-row">
      <span>${role.label}</span>
      <strong>${permission}</strong>
    </div>
  `).join("") : "";

  els.mvpReadinessList.innerHTML = mvpReadiness.map((item) => `
    <div class="list-item mvp-readiness ${item.status}" data-mvp-readiness="${item.id}">
      <div class="item-row">
        <strong>${item.id} - ${item.label}</strong>
        <span class="tag ${statusClass(item.status)}">${item.status === "phase-2" ? "Phase 2" : "Complete"}</span>
      </div>
      <span>${item.owner}</span>
      <small>${item.evidence}</small>
    </div>
  `).join("");

  els.quickClientSelect.innerHTML = clients.map((client) => `
    <option value="${client.id}" ${client.id === state.selectedClientId ? "selected" : ""}>${client.name}</option>
  `).join("");
  els.quickTemplateSelect.innerHTML = mvpQuickTemplates.map((template) => `
    <option value="${template.id}">${template.label}</option>
  `).join("");

  const taskRows = quickOpsTasks.map(quickTaskView);
  els.quickTaskList.innerHTML = taskRows.length ? taskRows.map((task) => `
    <div class="list-item quick-task-card ${task.displayTone}" data-quick-task-card="${task.id}">
      <div class="item-row">
        <strong>${task.id} - ${task.type}</strong>
        <span class="tag ${statusClass(task.displayTone)}">${task.displayStatus}</span>
      </div>
      <span>${task.client.name} - ${task.wall?.location || "Account level"} - ${task.priority} priority</span>
      <small>${task.note}</small>
      <small>Created by ${task.createdBy} - ${new Date(task.createdAt).toLocaleString("en-HK")}</small>
      ${task.status === "closed" ? `<small>Closed by ${task.closedBy} - ${new Date(task.closedAt).toLocaleString("en-HK")}</small>` : ""}
      <div class="workorder-actions">
        <button type="button" class="mini-action" data-client-select="${task.clientId}">View account</button>
        <button type="button" class="mini-action primary" data-close-quick-task="${task.id}" ${task.status === "closed" ? "disabled" : ""}>${task.status === "closed" ? "Closed" : "Close task"}</button>
      </div>
    </div>
  `).join("") : `
    <div class="list-item quick-task-card open">
      <div class="item-row">
        <strong>No quick tasks yet</strong>
        <span class="tag warn">Open</span>
      </div>
      <span>Create one task to test MVP-level CRUD and audit trace.</span>
    </div>
  `;

  els.mvpHandoffList.innerHTML = mvpHandoffCriteria.map((item) => `
    <div class="method-row">
      <span>${item.label}</span>
      <strong>${item.rule}</strong>
    </div>
  `).join("");
}

function renderPositioning() {
  els.strategyGrid.innerHTML = strategyCards.map((card) => `
    <article class="strategy-card">
      <span>${card.title}</span>
      <strong>${card.value}</strong>
      <p>${card.body}</p>
    </article>
  `).join("");

  els.positioningCopy.textContent = "DR FOREST FM Ops sits between living asset rental, field service management, IoT monitoring and ESG reporting. Wall is the first proof point, but the operating model extends to pots, plant clusters, green partitions, seasonal displays and future smart planters. The product promise is verified service quality: every asset has an owner, every visit has proof, every plant issue has a follow-up, and every ESG statement has a method note.";
}

function renderClients() {
  els.clientTabs.innerHTML = clients.map((client) => `
    <button type="button" class="${client.id === state.selectedClientId ? "active" : ""}" data-client-tab="${client.id}">
      ${client.district}
    </button>
  `).join("");

  els.clientList.innerHTML = clients.map((client) => {
    const clientWalls = walls.filter((wall) => wall.clientId === client.id);
    const averageHealth = avg(clientWalls, (wall) => wall.health);
    return `
      <button type="button" class="list-item ${client.id === state.selectedClientId ? "selected" : ""}" data-client-select="${client.id}">
        <div class="item-row">
          <strong>${client.name}</strong>
          <span class="tag ${statusClass(client.renewalRisk)}">${riskLabel(client.renewalRisk)}</span>
        </div>
        <span>${client.segment} - ${client.district}</span>
        <small>${clientWalls.length} wall(s) - health ${averageHealth} - renewal ${client.renewalDate}</small>
      </button>
    `;
  }).join("");

  const client = selectedClient();
  const clientWalls = walls.filter((wall) => wall.clientId === client.id);
  els.clientDetailTitle.textContent = client.name;
  els.clientDetailStatus.textContent = `${client.segment} - ${client.district}`;
  els.clientDetail.innerHTML = [
    ["Plan", client.plan],
    ["Contract", client.contract],
    ["Contact", client.contact],
    ["Renewal date", client.renewalDate],
    ["Proof need", client.proofNeed],
    ["Walls", `${clientWalls.length} wall(s), ${sum(clientWalls, (wall) => wall.pods)} Plant Pods`]
  ].map(([label, value]) => `<div><span>${label}</span><strong>${value}</strong></div>`).join("");
}

function renderCommercial() {
  const severity = { high: 0, medium: 1, low: 2 };
  const views = clients
    .map(commercialView)
    .sort((a, b) => severity[a.tone] - severity[b.tone] || a.daysToRenewal - b.daysToRenewal);
  const riskViews = views.filter((view) => view.tone === "high");
  const renewalWindow = views.filter((view) => view.daysToRenewal <= 90);
  const slaExceptions = views.filter((view) => view.healthGap > 0 || view.data.openWorkorders.length > 0);
  const proofDue = views.filter((view) => view.daysToProof <= 45);
  const revenueAtRisk = sum(riskViews, (view) => view.client.revenue);

  els.commercialStatus.textContent = `${riskViews.length} save plan account(s), ${renewalWindow.length} renewal window / ${riskViews.length} 个挽留客户，${renewalWindow.length} 个续约窗口`;
  els.commercialStatus.classList.toggle("good", riskViews.length === 0);
  renderStatCards(els.commercialGrid, [
    { label: "Revenue at risk", labelZh: "风险收入", value: formatCurrency(revenueAtRisk), detail: "Setup and recurring value under save plan", detailZh: "需要重点挽留的安装和持续服务价值" },
    { label: "Renewal window", labelZh: "续约窗口", value: renewalWindow.length, detail: "Accounts renewing in 90 days", detailZh: "90 天内进入续约期的客户" },
    { label: "SLA exceptions", labelZh: "SLA 异常", value: slaExceptions.length, detail: "Health gaps or open work orders", detailZh: "健康差距或未完成工单" },
    { label: "Proof packs due", labelZh: "凭证包到期", value: proofDue.length, detail: "Client evidence due in 45 days", detailZh: "45 天内需要交付的客户凭证" }
  ]);

  els.renewalList.innerHTML = views.map((view) => `
    <div class="list-item commercial-card ${view.tone}" data-commercial-card="${view.client.id}">
      <div class="item-row">
        <strong>${view.client.name}</strong>
        <span class="tag ${statusClass(view.tone)}">${view.priorityLabel}</span>
      </div>
      <span>${view.account.owner} - ${view.account.renewalStage} - renewal in ${view.daysToRenewal} days</span>
      <small>${view.account.nextTouch}</small>
      <div class="commercial-meta">
        <div><span>Revenue</span><strong>${formatCurrency(view.client.revenue)}</strong></div>
        <div><span>Proof due</span><strong>${view.daysToProof} days</strong></div>
        <div><span>QBR</span><strong>${view.account.qbrDate}</strong></div>
      </div>
      <div class="workorder-actions">
        <button type="button" class="mini-action" data-client-select="${view.client.id}">View account</button>
        <button type="button" class="mini-action primary" data-renewal-pack="${view.client.id}">Prepare renewal pack</button>
      </div>
    </div>
  `).join("");

  els.slaList.innerHTML = views.map((view) => `
    <div class="sla-row ${view.tone}" data-sla-card="${view.client.id}">
      <div class="item-row">
        <strong>${view.client.name}</strong>
        <span class="tag ${statusClass(view.tone)}">${view.data.health}/${view.account.targetHealth} health</span>
      </div>
      <span>${view.account.visitsPerMonth} visit(s)/mo - ${view.account.responseTargetHours}h response target</span>
      <small>${view.data.openWorkorders.length} open work order(s) - ${view.data.issues} open issue(s) - ${view.data.survival}% survival</small>
    </div>
  `).join("");

  els.successPlaybook.innerHTML = commercialPlaybook.map((item) => `
    <div class="method-row">
      <span>${item.trigger}</span>
      <strong>${item.action} - ${item.owner}</strong>
    </div>
  `).join("");
}

function renderBilling() {
  const invoiceRows = billingInvoices
    .map(invoiceView)
    .sort((a, b) => Number(a.paid) - Number(b.paid) || dateValue(a.dueDate) - dateValue(b.dueDate));
  const openInvoices = invoiceRows.filter((invoice) => !invoice.paid);
  const overdueInvoices = openInvoices.filter((invoice) => invoice.displayTone === "overdue");
  const paidInvoices = invoiceRows.filter((invoice) => invoice.paid);
  const invoiceTotal = sum(invoiceRows, (invoice) => invoice.amount);
  const outstandingAmount = sum(openInvoices, (invoice) => invoice.amount);
  const paidAmount = sum(paidInvoices, (invoice) => invoice.amount);

  els.billingStatus.textContent = `${overdueInvoices.length} overdue invoice(s), ${formatCurrency(outstandingAmount)} open AR / ${overdueInvoices.length} 张逾期，${formatCurrency(outstandingAmount)} 应收`;
  els.billingStatus.classList.toggle("good", openInvoices.length === 0);
  renderStatCards(els.billingGrid, [
    { label: "July invoice run", labelZh: "7 月账单批次", value: formatCurrency(invoiceTotal), detail: `${invoiceRows.length} invoice(s) across active accounts`, detailZh: "活跃客户本月账单总额" },
    { label: "Outstanding AR", labelZh: "未收应收", value: formatCurrency(outstandingAmount), detail: "Unpaid rental, DF Pro and expansion charges", detailZh: "租摆、DF Pro 和扩展服务未收款" },
    { label: "Overdue invoices", labelZh: "逾期账单", value: overdueInvoices.length, detail: "Escalate when paired with renewal risk", detailZh: "与续约风险叠加时需升级处理" },
    { label: "Collected", labelZh: "已回款", value: formatCurrency(paidAmount), detail: `${paidInvoices.length} invoice(s) marked paid`, detailZh: "已标记支付的账单金额" }
  ]);

  els.invoiceList.innerHTML = invoiceRows.map((invoice) => {
    const paidDetail = invoice.payment
      ? `Paid by ${invoice.payment.paidBy} - ${new Date(invoice.payment.paidAt).toLocaleString("en-HK")}`
      : invoice.status === "paid"
        ? `Paid through ${invoice.method}`
        : `Due ${invoice.dueDate}`;
    return `
      <div class="list-item invoice-card ${invoice.displayTone}" data-invoice-card="${invoice.id}">
        <div class="item-row">
          <strong>${invoice.id} - ${invoice.category}</strong>
          <span class="tag ${statusClass(invoice.displayTone)}">${invoice.displayStatus}</span>
        </div>
        <span>${invoice.client.name} - ${invoice.period} - ${invoice.method}</span>
        <div class="commercial-meta">
          <div><span>Amount</span><strong>${formatCurrency(invoice.amount)}</strong></div>
          <div><span>Issued</span><strong>${invoice.issueDate}</strong></div>
          <div><span>Payment</span><strong>${paidDetail}</strong></div>
        </div>
        <small>${invoice.notes}</small>
        <div class="workorder-actions">
          <button type="button" class="mini-action" data-client-select="${invoice.clientId}">View account</button>
          <button type="button" class="mini-action primary" data-mark-invoice-paid="${invoice.id}" ${invoice.paid ? "disabled" : ""}>${invoice.paid ? "Paid" : "Mark paid"}</button>
        </div>
      </div>
    `;
  }).join("");

  els.billingPolicyList.innerHTML = billingPolicies.map((policy) => `
    <div class="method-row">
      <span>${policy.label}</span>
      <strong>${policy.rule}</strong>
    </div>
  `).join("");
}

function renderCompliance() {
  const rank = { blocked: 0, expiring: 1, review: 2, ready: 3, cleared: 4 };
  const rows = complianceItems
    .map(complianceView)
    .sort((a, b) => rank[a.displayTone] - rank[b.displayTone] || a.daysToDue - b.daysToDue);
  const openItems = rows.filter((item) => !item.cleared);
  const clearedItems = rows.filter((item) => item.cleared);
  const blockers = openItems.filter((item) => item.displayTone === "blocked");
  const expiring = openItems.filter((item) => item.displayTone === "expiring");

  els.complianceStatus.textContent = `${blockers.length} blocker(s), ${expiring.length} expiring item(s) / ${blockers.length} 个阻塞，${expiring.length} 个即将到期`;
  els.complianceStatus.classList.toggle("good", openItems.length === 0);
  renderStatCards(els.complianceGrid, [
    { label: "Compliance items", labelZh: "合规事项", value: rows.length, detail: "Access, insurance, method and proof release", detailZh: "准入、保险、作业方法和报告发布" },
    { label: "Blockers", labelZh: "阻塞项", value: blockers.length, detail: "Items that can block visits or reports", detailZh: "会阻止到访或报告导出的事项" },
    { label: "Expiring soon", labelZh: "即将到期", value: expiring.length, detail: "Refresh before site or renewal use", detailZh: "现场服务或续约前需要更新" },
    { label: "Cleared", labelZh: "已清理", value: clearedItems.length, detail: "Accepted for FM operations", detailZh: "已满足 FM 运营要求" }
  ]);

  els.complianceList.innerHTML = rows.map((item) => {
    const clearanceDetail = item.clearance
      ? `Cleared by ${item.clearance.clearedBy} - ${new Date(item.clearance.clearedAt).toLocaleString("en-HK")}`
      : item.cleared
        ? "Ready in baseline compliance pack"
        : `Due ${item.dueDate} - ${item.owner}`;
    return `
      <div class="list-item compliance-card ${item.displayTone}" data-compliance-card="${item.id}">
        <div class="item-row">
          <strong>${item.id} - ${item.category}</strong>
          <span class="tag ${statusClass(item.displayTone)}">${item.displayStatus}</span>
        </div>
        <span>${item.client.name} - ${item.wall.location} - ${item.document}</span>
        <div class="commercial-meta">
          <div><span>Owner</span><strong>${item.owner}</strong></div>
          <div><span>Due</span><strong>${item.dueDate}</strong></div>
          <div><span>Scope</span><strong>${item.scope}</strong></div>
        </div>
        <small>${item.impact}</small>
        <div class="kit-list">
          ${item.evidence.map((evidence) => `<em>${evidence}</em>`).join("")}
        </div>
        <small>${clearanceDetail}</small>
        <div class="workorder-actions">
          <button type="button" class="mini-action" data-client-select="${item.clientId}">View account</button>
          <button type="button" class="mini-action" data-wall-select="${item.wall.id}">Wall detail</button>
          <button type="button" class="mini-action primary" data-clear-compliance="${item.id}" ${item.cleared ? "disabled" : ""}>${item.cleared ? "Cleared" : "Clear item"}</button>
        </div>
      </div>
    `;
  }).join("");

  els.complianceRuleList.innerHTML = complianceRules.map((rule) => `
    <div class="method-row">
      <span>${rule.label}</span>
      <strong>${rule.rule}</strong>
    </div>
  `).join("");
}

function podClass(zone) {
  if (zone.health < 78) return "pod risk";
  if (zone.health < 86) return "pod low";
  return "pod";
}

function renderWalls() {
  const filteredWalls = walls.filter((wall) => {
    if (state.filter === "risk") return wall.status !== "stable";
    if (state.filter === "smart") return wall.version === "Smart";
    return true;
  });

  els.wallGrid.innerHTML = filteredWalls.map((wall) => {
    const client = clientFor(wall);
    return `
      <button type="button" class="wall-card ${wall.id === state.selectedWallId ? "selected" : ""}" data-wall-select="${wall.id}">
        <div class="item-row">
          <div>
            <strong>${wall.id}</strong>
            <span>${wall.name}</span>
          </div>
          <span class="tag ${statusClass(wall.status)}">${wall.version}</span>
        </div>
        <div class="wall-visual" aria-label="${wall.name} health map">
          ${wall.zones.flatMap((zone) => Array.from({ length: 9 }, () => `<span class="${podClass(zone)}"></span>`)).join("")}
        </div>
        <div class="wall-meta">
          <div><span>Health</span><strong>${wall.health}</strong></div>
          <div><span>Pods</span><strong>${wall.pods}</strong></div>
          <div><span>Next</span><strong>${wall.nextVisit}</strong></div>
        </div>
        <small>${client.name} - ${wall.location}</small>
      </button>
    `;
  }).join("");

  const wall = selectedWall();
  els.wallDetailTitle.textContent = `${wall.id} - ${wall.name}`;
  els.wallDetailStatus.textContent = `${clientFor(wall).name} - ${wall.status}`;
  els.wallDetail.innerHTML = [
    ["Location", wall.location],
    ["Service cadence", wall.cadence],
    ["Green area", `${wall.greenArea.toFixed(1)} m2`],
    ["Sensors", wall.sensors.join(", ")],
    ["ESG proof", `${wall.waterSaved} L water estimate, ${wall.staffReach} people reach`],
    ["Tags", wall.tags.join(", ")]
  ].map(([label, value]) => `<div><span>${label}</span><strong>${value}</strong></div>`).join("");

  els.podHealthList.innerHTML = wall.zones.map((zone) => `
    <div class="zone-row">
      <div class="zone-map">
        ${Array.from({ length: 15 }, () => `<span class="${podClass(zone)}"></span>`).join("")}
      </div>
      <div>
        <strong>${zone.name}</strong>
        <span>${zone.pods} pods - health ${zone.health}</span>
        <small>${zone.issue}</small>
      </div>
    </div>
  `).join("");
}

function renderSensors() {
  const sensorItems = sensorReadings.map(sensorView);
  const actionItems = sensorItems.filter((item) => sensorNeedsAction(item));
  const acknowledged = sensorItems.filter((item) => item.acknowledged);
  const offline = sensorItems.filter((item) => item.status === "offline" && !item.acknowledged);
  const alertItems = sensorItems.filter((item) => item.status === "alert" && !item.acknowledged);

  els.sensorStatus.textContent = `${actionItems.length} active telemetry exception(s) / ${actionItems.length} 个实时遥测异常`;
  els.sensorStatus.classList.toggle("good", actionItems.length === 0);
  renderStatCards(els.sensorGrid, [
    { label: "Sensor readings", labelZh: "传感器读数", value: sensorItems.length, detail: "Water, light and gateway inputs", detailZh: "水分、光照和网关输入" },
    { label: "Active alerts", labelZh: "活跃预警", value: alertItems.length, detail: "Needs same-day FM review", detailZh: "需要当天运营复核" },
    { label: "Offline gateways", labelZh: "离线网关", value: offline.length, detail: "Manual-check until restored", detailZh: "恢复前需要人工检查" },
    { label: "Acknowledged", labelZh: "已确认", value: acknowledged.length, detail: "Alerts accepted by control desk", detailZh: "运营台已接收的预警" }
  ]);

  els.sensorList.innerHTML = sensorItems.map((item) => `
    <div class="list-item sensor-card ${item.displayTone}" data-sensor-card="${item.id}">
      <div class="item-row">
        <strong>${item.id} - ${item.type}</strong>
        <span class="tag ${statusClass(item.displayTone)}">${item.displayStatus}</span>
      </div>
      <span>${item.client.name} - ${item.wall.location} - ${item.lastSeen}</span>
      <div class="sensor-meter">
        <div><span>Reading</span><strong>${item.value}${item.unit}</strong></div>
        <div><span>Target</span><strong>${item.target}</strong></div>
      </div>
      <small>${item.action}</small>
      <div class="workorder-actions">
        <button type="button" class="mini-action" data-wall-select="${item.wall.id}">Wall detail</button>
        <button type="button" class="mini-action primary" data-ack-sensor="${item.id}" ${item.acknowledged || item.status === "ok" ? "disabled" : ""}>${item.acknowledged ? "Acknowledged" : "Acknowledge alert"}</button>
      </div>
    </div>
  `).join("");

  els.sensorRuleList.innerHTML = sensorRules.map((rule) => `
    <div class="method-row">
      <span>${rule.trigger}</span>
      <strong>${rule.action}</strong>
    </div>
  `).join("");
}

function renderIncidents() {
  const severityRank = { critical: 0, high: 1, medium: 2, low: 3 };
  const incidentRows = incidentRecords
    .map(incidentView)
    .sort((a, b) => Number(a.resolved) - Number(b.resolved) || severityRank[a.severity] - severityRank[b.severity] || a.daysToDue - b.daysToDue);
  const openIncidents = incidentRows.filter((incident) => !incident.resolved);
  const resolvedIncidents = incidentRows.filter((incident) => incident.resolved);
  const criticalIncidents = openIncidents.filter((incident) => incident.severity === "critical" || incident.displayTone === "escalated");
  const dueIncidents = openIncidents.filter((incident) => incident.daysToDue <= 0);

  els.incidentStatus.textContent = `${openIncidents.length} open incident(s), ${criticalIncidents.length} critical / ${openIncidents.length} 个未关闭事件，${criticalIncidents.length} 个关键事件`;
  els.incidentStatus.classList.toggle("good", openIncidents.length === 0);
  renderStatCards(els.incidentGrid, [
    { label: "Open incidents", labelZh: "未关闭事件", value: openIncidents.length, detail: "Sensor, proof and service exceptions", detailZh: "传感器、凭证和服务异常" },
    { label: "Critical queue", labelZh: "关键队列", value: criticalIncidents.length, detail: "Renewal or SLA-sensitive response", detailZh: "影响续约或服务承诺的响应" },
    { label: "Due now", labelZh: "当前到期", value: dueIncidents.length, detail: "Due today or already breaching SLA", detailZh: "今天到期或已触发 SLA 风险" },
    { label: "Resolved", labelZh: "已解决", value: resolvedIncidents.length, detail: "Closed with audit trace", detailZh: "带审计记录的关闭事件" }
  ]);

  els.incidentList.innerHTML = incidentRows.map((incident) => {
    const sourceLabel = incident.source
      ? `${incident.sourceType} ${incident.sourceId}`
      : `${incident.sourceType} source`;
    const resolutionDetail = incident.resolution
      ? `Resolved by ${incident.resolution.resolvedBy} - ${new Date(incident.resolution.resolvedAt).toLocaleString("en-HK")}`
      : `SLA ${incident.slaHours}h - due ${incident.dueDate}`;
    return `
      <div class="list-item incident-card ${incident.displayTone}" data-incident-card="${incident.id}">
        <div class="item-row">
          <strong>${incident.id} - ${incident.category}</strong>
          <span class="tag ${statusClass(incident.displayTone)}">${incident.displayStatus}</span>
        </div>
        <span>${incident.client.name} - ${incident.wall.location} - ${incident.owner}</span>
        <div class="commercial-meta">
          <div><span>Severity</span><strong>${incident.severity}</strong></div>
          <div><span>Source</span><strong>${sourceLabel}</strong></div>
          <div><span>Work order</span><strong>${incident.linkedWorkorderId}</strong></div>
        </div>
        <small>${incident.impact}</small>
        <small>${incident.recommendedAction}</small>
        <div class="kit-list">
          ${incident.proofRequired.map((item) => `<em>${item}</em>`).join("")}
        </div>
        <small>${resolutionDetail}</small>
        <div class="workorder-actions">
          <button type="button" class="mini-action" data-wall-select="${incident.wall.id}">Wall detail</button>
          <button type="button" class="mini-action" data-complete-workorder="${incident.linkedWorkorderId}" ${isWorkorderCompleted(incident.linkedWorkorderId) ? "disabled" : ""}>${isWorkorderCompleted(incident.linkedWorkorderId) ? "Work order closed" : "Close linked work"}</button>
          <button type="button" class="mini-action primary" data-resolve-incident="${incident.id}" ${incident.resolved ? "disabled" : ""}>${incident.resolved ? "Resolved" : "Resolve incident"}</button>
        </div>
      </div>
    `;
  }).join("");

  els.incidentRuleList.innerHTML = incidentRules.map((rule) => `
    <div class="method-row">
      <span>${rule.label}</span>
      <strong>${rule.rule}</strong>
    </div>
  `).join("");
}

function renderService() {
  els.workorderList.innerHTML = workorders.map((order) => {
    const wall = wallById(order.wallId);
    const view = workorderView(order);
    const completed = Boolean(view.completion);
    return `
      <div class="list-item workorder-item ${completed ? "completed" : ""}" data-workorder-card="${view.id}">
        <div class="item-row">
          <strong>${view.id} - ${view.type}</strong>
          <span class="tag ${statusClass(view.displayPriority === "high" ? "risk" : view.displayPriority)}">${view.displayStatus}</span>
        </div>
        <span>${clientFor(wall).name} - ${wall.location}</span>
        <small>${view.due} - ${view.tasks.join(", ")}</small>
        ${completed ? `<small>Completed by ${view.completion.completedBy} - ${new Date(view.completion.completedAt).toLocaleString("en-HK")}</small>` : ""}
        <div class="workorder-actions">
          <button type="button" class="mini-action" data-wall-select="${wall.id}">Wall detail</button>
          <button type="button" class="mini-action primary" data-complete-workorder="${view.id}" ${completed ? "disabled" : ""}>${completed ? "Completed" : "Complete work order"}</button>
        </div>
      </div>
    `;
  }).join("");

  els.diagnosisList.innerHTML = diagnoses.map((diagnosis) => {
    const wall = wallById(diagnosis.wallId);
    return `
      <button type="button" class="list-item" data-wall-select="${wall.id}">
        <div class="item-row">
          <strong>${diagnosis.wallId} - ${diagnosis.finding}</strong>
          <span class="tag">${diagnosis.confidence}%</span>
        </div>
        <span>${diagnosis.evidence}</span>
        <small>${diagnosis.action}</small>
      </button>
    `;
  }).join("");
}

function crewById(id) {
  return crewMembers.find((member) => member.id === id);
}

function renderSchedule() {
  const slotRows = scheduleSlots
    .map(scheduleSlotView)
    .sort((a, b) => dateValue(a.date) - dateValue(b.date) || a.window.localeCompare(b.window));
  const openSlots = slotRows.filter((slot) => !slot.confirmed);
  const atRiskSlots = openSlots.filter((slot) => slot.displayTone === "at-risk");
  const confirmedSlots = slotRows.filter((slot) => slot.confirmed);
  const capacityRows = crewMembers.map(scheduleCapacityView);
  const scheduledMinutes = sum(slotRows, (slot) => slot.plannedMinutes);
  const capacityMinutes = sum(capacityRows, (row) => row.capacityMinutes);
  const capacityLoad = capacityMinutes ? Math.round((scheduledMinutes / capacityMinutes) * 100) : 0;

  els.scheduleStatus.textContent = `${openSlots.length} open slot(s), ${capacityLoad}% capacity planned / ${openSlots.length} 个待确认时段，产能已排 ${capacityLoad}%`;
  els.scheduleStatus.classList.toggle("good", openSlots.length === 0 && capacityLoad < 80);
  renderStatCards(els.scheduleGrid, [
    { label: "Scheduled visits", labelZh: "已排到访", value: slotRows.length, detail: `Planning date ${scheduleToday}`, detailZh: "当前计划日期内的服务安排" },
    { label: "Confirmed slots", labelZh: "已确认时段", value: confirmedSlots.length, detail: "Access and service window locked", detailZh: "准入与服务窗口已锁定" },
    { label: "Action windows", labelZh: "待处理窗口", value: openSlots.length, detail: `${atRiskSlots.length} at-risk visit(s)`, detailZh: "仍需确认或有风险的到访窗口" },
    { label: "Capacity load", labelZh: "产能负载", value: `${capacityLoad}%`, detail: `${scheduledMinutes}/${capacityMinutes} planned minutes`, detailZh: "已规划分钟数与团队产能" }
  ]);

  els.scheduleSlotList.innerHTML = slotRows.map((slot) => {
    const confirmationDetail = slot.confirmation
      ? `Confirmed by ${slot.confirmation.confirmedBy} - ${new Date(slot.confirmation.confirmedAt).toLocaleString("en-HK")}`
      : slot.confirmed
        ? "Confirmed in baseline plan"
        : "Needs service desk confirmation";
    return `
      <div class="list-item schedule-slot ${slot.displayTone}" data-schedule-card="${slot.id}">
        <div class="item-row">
          <strong>${slot.date} ${slot.window}</strong>
          <span class="tag ${statusClass(slot.displayTone)}">${slot.displayStatus}</span>
        </div>
        <span>${slot.client.name} - ${slot.wall.location} - ${slot.order.type}</span>
        <div class="commercial-meta">
          <div><span>Technician</span><strong>${slot.technician.name}</strong></div>
          <div><span>Work order</span><strong>${slot.order.id}</strong></div>
          <div><span>Minutes</span><strong>${slot.plannedMinutes}</strong></div>
        </div>
        <small>${slot.proofGate}</small>
        <small>${slot.clientMessage}</small>
        <small>${confirmationDetail}</small>
        <div class="workorder-actions">
          <button type="button" class="mini-action" data-wall-select="${slot.wall.id}">Wall detail</button>
          <button type="button" class="mini-action primary" data-confirm-schedule="${slot.id}" ${slot.confirmed ? "disabled" : ""}>${slot.confirmed ? "Confirmed" : "Confirm slot"}</button>
        </div>
      </div>
    `;
  }).join("");

  els.scheduleCapacityList.innerHTML = capacityRows.map((row) => `
    <div class="crew-row schedule-capacity ${row.tone}">
      <div class="item-row">
        <strong>${row.member.name}</strong>
        <span class="tag ${statusClass(row.tone)}">${row.utilization}% load</span>
      </div>
      <span>${row.member.role} - ${row.slots.length}/${row.member.capacity} planned stop(s)</span>
      <small>${row.plannedMinutes}/${row.capacityMinutes} planned minutes - ${row.member.skills.join(", ")}</small>
    </div>
  `).join("");

  els.scheduleRuleList.innerHTML = [
    ...scheduleRules.map((rule) => `
      <div class="method-row">
        <span>${rule.label}</span>
        <strong>${rule.rule}</strong>
      </div>
    `),
    ...scheduleBlackouts.map((blackout) => `
      <div class="method-row schedule-blackout">
        <span>${blackout.date} - ${blackout.label}</span>
        <strong>${blackout.impact}</strong>
      </div>
    `)
  ].join("");
}

function routeView(routeItem) {
  const order = workorders.find((item) => item.id === routeItem.workorderId);
  const wall = wallById(order.wallId);
  const client = clientFor(wall);
  const technician = crewById(routeItem.technicianId);
  const completed = isWorkorderCompleted(order.id);
  const staged = isDispatchStaged(order.id);
  return {
    ...routeItem,
    order,
    wall,
    client,
    technician,
    completed,
    staged,
    displayStatus: completed ? "Completed" : staged ? "Kit staged" : routeItem.readiness,
    statusTone: completed || staged ? "completed" : order.priority
  };
}

function renderDispatch() {
  const routeItems = dispatchRoute
    .map(routeView)
    .sort((a, b) => a.sequence - b.sequence);
  const openStops = routeItems.filter((item) => !item.completed);
  const stagedStops = routeItems.filter((item) => item.staged && !item.completed);
  const highPriorityStops = openStops.filter((item) => item.order.priority === "high");
  const reservedUnits = sum(dispatchInventory, (item) => item.reserved);

  els.dispatchStatus.textContent = `${openStops.length} open stop(s), ${stagedStops.length} kit staged / ${openStops.length} 个未完成点位，${stagedStops.length} 个工具包已备`;
  els.dispatchStatus.classList.toggle("good", openStops.length === 0);
  renderStatCards(els.dispatchGrid, [
    { label: "Route stops", labelZh: "路线点位", value: routeItems.length, detail: "Sequenced across today and next visits", detailZh: "今日与后续到访的顺序安排" },
    { label: "Kits staged", labelZh: "工具包已备", value: stagedStops.length, detail: "Ready for technician handoff", detailZh: "可交接给技师的物料准备" },
    { label: "High priority", labelZh: "高优先级", value: highPriorityStops.length, detail: "Needs same-day attention", detailZh: "需要当天关注的任务" },
    { label: "Reserved stock", labelZh: "已预留库存", value: reservedUnits, detail: "Pods, nutrients and tools held for work orders", detailZh: "为工单锁定的植物舱、营养液和工具" }
  ]);

  els.dispatchRouteList.innerHTML = routeItems.map((item) => `
    <div class="list-item dispatch-stop ${item.completed ? "completed" : ""}" data-dispatch-card="${item.order.id}">
      <div class="item-row">
        <strong>#${item.sequence} ${item.window}</strong>
        <span class="tag ${statusClass(item.statusTone === "high" ? "risk" : item.statusTone)}">${item.displayStatus}</span>
      </div>
      <span>${item.order.id} - ${item.client.name} - ${item.wall.location}</span>
      <small>${item.technician.name} - ${item.technician.role} - ${item.travelBuffer} min travel buffer</small>
      <div class="kit-list">
        ${item.kit.map((kitItem) => `<em>${kitItem}</em>`).join("")}
      </div>
      <div class="workorder-actions">
        <button type="button" class="mini-action" data-wall-select="${item.wall.id}">Wall detail</button>
        <button type="button" class="mini-action" data-stage-dispatch="${item.order.id}" ${item.staged || item.completed ? "disabled" : ""}>${item.staged ? "Kit staged" : "Stage kit"}</button>
        <button type="button" class="mini-action primary" data-complete-workorder="${item.order.id}" ${item.completed ? "disabled" : ""}>${item.completed ? "Completed" : "Complete stop"}</button>
      </div>
    </div>
  `).join("");

  els.dispatchCrewList.innerHTML = crewMembers.map((member) => {
    const assigned = routeItems.filter((item) => item.technician.id === member.id);
    return `
      <div class="crew-row">
        <div class="item-row">
          <strong>${member.name}</strong>
          <span class="tag ${assigned.length > member.capacity ? "danger" : ""}">${assigned.length}/${member.capacity} stops</span>
        </div>
        <span>${member.role} - ${member.base}</span>
        <small>${member.skills.join(", ")}</small>
      </div>
    `;
  }).join("");

  els.dispatchInventoryList.innerHTML = dispatchInventory.map((item) => {
    const available = item.onHand - item.reserved;
    const risk = available <= item.reorderAt;
    return `
      <div class="method-row inventory-row ${risk ? "at-risk" : ""}">
        <span>${item.sku} - ${item.label}</span>
        <strong>${available} available - ${item.reserved} reserved - reorder at ${item.reorderAt}</strong>
      </div>
    `;
  }).join("");
}

function renderSupply() {
  const supplyRows = supplyItems.map(supplyView);
  const reorderNow = supplyRows.filter((item) => item.displayTone === "alert");
  const watchStock = supplyRows.filter((item) => item.displayTone === "watch");
  const requested = supplyRows.filter((item) => item.requested);
  const reservedUnits = sum(supplyRows, (item) => item.reserved);

  els.supplyStatus.textContent = `${reorderNow.length} reorder flag(s), ${requested.length} request(s) raised / ${reorderNow.length} 个补货预警，${requested.length} 个已发起请求`;
  els.supplyStatus.classList.toggle("good", reorderNow.length === 0);
  renderStatCards(els.supplyGrid, [
    { label: "Tracked SKUs", labelZh: "跟踪 SKU", value: supplyRows.length, detail: "Pods, sleeves, nutrients and tools", detailZh: "植物舱、套件、营养液和工具" },
    { label: "Reorder now", labelZh: "立即补货", value: reorderNow.length, detail: "Available stock at or below threshold", detailZh: "可用库存低于或等于阈值" },
    { label: "Watch stock", labelZh: "观察库存", value: watchStock.length, detail: "Approaching reorder level", detailZh: "接近补货水位的物料" },
    { label: "Reserved units", labelZh: "预留数量", value: reservedUnits, detail: "Held for dispatch and proof continuity", detailZh: "为派工和凭证连续性预留" }
  ]);

  els.supplyList.innerHTML = supplyRows.map((item) => `
    <div class="list-item supply-card ${item.displayTone}" data-supply-card="${item.sku}">
      <div class="item-row">
        <strong>${item.sku} - ${item.label}</strong>
        <span class="tag ${statusClass(item.displayTone)}">${item.displayStatus}</span>
      </div>
      <span>${item.category} - ${item.supplier} - ${item.leadTimeDays} day lead time</span>
      <div class="commercial-meta">
        <div><span>Available</span><strong>${item.available}</strong></div>
        <div><span>Reserved</span><strong>${item.reserved}</strong></div>
        <div><span>Reorder point</span><strong>${item.reorderAt}</strong></div>
      </div>
      <small>Recommended reorder quantity: ${item.reorderQty}</small>
      <div class="workorder-actions">
        <button type="button" class="mini-action primary" data-request-supply="${item.sku}" ${item.requested || item.displayTone === "ok" ? "disabled" : ""}>${item.requested ? "Requested" : "Request reorder"}</button>
      </div>
    </div>
  `).join("");

  els.supplyPolicyList.innerHTML = supplyPolicies.map((policy) => `
    <div class="method-row">
      <span>${policy.label}</span>
      <strong>${policy.rule}</strong>
    </div>
  `).join("");
}

function proofView(record) {
  const wall = wallById(record.wallId);
  const client = clientFor(wall);
  const order = workorders.find((item) => item.id === record.workorderId);
  const approved = isProofApproved(record.id);
  return {
    ...record,
    wall,
    client,
    order,
    approved,
    displayStatus: approved ? "Approved" : record.status,
    displayTone: approved ? "approved" : record.tone
  };
}

function renderProof() {
  const proofItems = proofRecords.map(proofView);
  const reportReady = proofItems.filter((item) => proofRecordReady(item));
  const approved = proofItems.filter((item) => item.approved);
  const needsReview = proofItems.filter((item) => item.displayTone === "review");
  const missing = proofItems.filter((item) => item.displayTone === "missing");
  const readiness = proofItems.length ? Math.round((reportReady.length / proofItems.length) * 100) : 0;

  els.proofStatus.textContent = `${readiness}% report-ready evidence / ${readiness}% 可用于报告的凭证`;
  els.proofStatus.classList.toggle("good", missing.length === 0 && needsReview.length === 0);
  renderStatCards(els.proofGrid, [
    { label: "Proof records", labelZh: "凭证记录", value: proofItems.length, detail: "Photos, notes and trace evidence", detailZh: "照片、备注和可追溯证据" },
    { label: "Report-ready", labelZh: "报告可用", value: reportReady.length, detail: "Ready or explicitly approved", detailZh: "已准备好或已明确批准" },
    { label: "Needs review", labelZh: "需要复核", value: needsReview.length, detail: "Evidence desk check required", detailZh: "需要凭证台人工检查" },
    { label: "Missing proof", labelZh: "缺失凭证", value: missing.length, detail: "Blocks clean client export", detailZh: "会阻止干净的客户报告导出" }
  ]);

  els.proofRecordList.innerHTML = proofItems.map((item) => `
    <div class="list-item proof-card ${item.displayTone}" data-proof-card="${item.id}">
      <div class="item-row">
        <strong>${item.id} - ${item.category}</strong>
        <span class="tag ${statusClass(item.displayTone)}">${item.displayStatus}</span>
      </div>
      <span>${item.client.name} - ${item.wall.location} - ${item.capturedAt}</span>
      <small>${item.source} - reviewer: ${item.reviewer}</small>
      <div class="kit-list">
        ${item.evidence.map((evidenceItem) => `<em>${evidenceItem}</em>`).join("")}
      </div>
      <small>${item.note}</small>
      <div class="workorder-actions">
        <button type="button" class="mini-action" data-wall-select="${item.wall.id}">Wall detail</button>
        <button type="button" class="mini-action primary" data-approve-proof="${item.id}" ${item.approved || item.displayTone === "missing" ? "disabled" : ""}>${item.approved ? "Approved" : "Approve proof"}</button>
      </div>
    </div>
  `).join("");

  els.proofRequirementList.innerHTML = proofRequirements.map((item) => `
    <div class="method-row proof-requirement">
      <span>${item.label}</span>
      <strong>${item.scope} - ${item.owner} - ${item.cadence}</strong>
      <small>${item.requiredFor.join(", ")} - ${item.status}</small>
    </div>
  `).join("");
}

function renderAudit() {
  const events = allAuditEvents();
  const localCount = auditEvents.length;
  const clientLinked = events.filter((event) => event.clientId).length;
  const reviewEvents = events.filter((event) => event.tone === "review" || event.tone === "alert").length;
  const latest = events[0];

  els.auditStatus.textContent = latest ? `Latest: ${latest.action} / 最新动作` : "No audit events yet / 暂无审计事件";
  els.auditStatus.classList.toggle("good", localCount > 0);
  renderStatCards(els.auditGrid, [
    { label: "Audit events", labelZh: "审计事件", value: events.length, detail: `${localCount} local control action(s)`, detailZh: "本地演示产生的控制动作" },
    { label: "Client-linked", labelZh: "客户关联", value: clientLinked, detail: "Events available for client reports", detailZh: "可写入客户报告的事件" },
    { label: "Review signals", labelZh: "复核信号", value: reviewEvents, detail: "Events that need management attention", detailZh: "需要管理层关注的事件" },
    { label: "Control rules", labelZh: "控制规则", value: auditControls.length, detail: "Traceability rules in force", detailZh: "当前生效的可追溯规则" }
  ]);

  els.auditEventList.innerHTML = events.map((event) => {
    const client = event.clientId ? clients.find((item) => item.id === event.clientId) : null;
    return `
      <div class="list-item audit-card ${event.tone}" data-audit-event="${event.id}">
        <div class="item-row">
          <strong>${event.action}</strong>
          <span class="tag ${statusClass(event.tone)}">${event.entityType}</span>
        </div>
        <span>${event.actor} - ${new Date(event.timestamp).toLocaleString("en-HK")}</span>
        <small>${client ? `${client.name} - ` : ""}${event.entityId}</small>
        <small>${event.detail}</small>
      </div>
    `;
  }).join("");

  els.auditControlList.innerHTML = auditControls.map((control) => `
    <div class="method-row">
      <span>${control.label}</span>
      <strong>${control.rule}</strong>
    </div>
  `).join("");
}

function fillEsgTemplate(template, data) {
  return template
    .replaceAll("{{greenArea}}", data.greenArea.toFixed(1))
    .replaceAll("{{waterSaved}}", String(data.waterSaved))
    .replaceAll("{{staffReach}}", String(data.staffReach));
}

function reportMethodRows() {
  return [
    ...esgMethods,
    {
      label: "AI use / AI 使用",
      body: "AI recommendations are operational decision support. Human users approve work orders, proof release, client reports and ESG claims."
    },
    ...esgClaimControls.map((control) => ({
      label: control.label,
      body: control.body
    })),
    ...impactClaimControls.map((control) => ({
      label: control.label,
      body: control.body
    })),
    ...roboticClaimControls.map((control) => ({
      label: control.label,
      body: control.body
    }))
  ];
}

function renderEsg() {
  const data = portfolioMetrics();
  renderStatCards(els.esgGrid, [
    { label: "Green wall area", labelZh: "绿墙面积", value: `${data.greenArea.toFixed(1)} m2`, detail: "Directly measured wall ledger metric", detailZh: "来自绿墙台账的直接测量指标" },
    { label: "Water saved", labelZh: "节水估算", value: `${data.waterSaved} L/mo`, detail: "Estimated vs loose-pot service baseline", detailZh: "相对散盆服务基线的估算" },
    { label: "Service miles avoided", labelZh: "减少服务里程", value: `${data.serviceMilesSaved} km`, detail: "Estimated by optimized FM route planning", detailZh: "根据优化路线计划估算" },
    { label: "Wellness reach", labelZh: "健康办公触达", value: data.staffReach, detail: "Estimated monthly visitor and staff touchpoints", detailZh: "月度员工与访客触点估算" },
    { label: "CO2e proxy", labelZh: "碳代理指标", value: `${data.co2eProxy} kg`, detail: "Narrative proxy, not a carbon credit claim", detailZh: "仅用于叙事，不等同碳信用主张" }
  ], "esg-card");

  els.esgBars.innerHTML = esgTrend.map((row) => `
    <div class="bar-row">
      <span>${row.month}</span>
      <div class="bar-track"><div class="bar-fill" style="width: ${row.score}%"></div></div>
      <strong>${row.score}</strong>
    </div>
  `).join("");

  els.esgMethods.innerHTML = esgMethods.map((method) => `
    <div class="method-row">
      <span>${method.label}</span>
      <strong>${method.body}</strong>
    </div>
  `).join("");

  els.esgProofPackList.innerHTML = esgProofPack.map((item) => `
    <article class="list-item proof-pack-card ${item.status}" data-esg-proof="${item.id}">
      <div class="item-row">
        <strong>${item.label}</strong>
        <span class="tag ${statusClass(item.status)}">${item.status === "phase-2" ? "Phase 2" : "Ready"}</span>
      </div>
      <span>${item.standard}</span>
      <small>${item.owner} - accepted by: ${item.acceptedBy}</small>
      <small>${item.body}</small>
      <small class="zh-copy">中文理解：被认可的关键不是“漂亮分数”，而是来源、方法、边界和责任人都说得清。</small>
    </article>
  `).join("");

  els.esgFrameworkList.innerHTML = esgFrameworkMapping.map((item) => `
    <div class="method-row framework-row">
      <span>${item.framework} - ${item.status}</span>
      <strong>${item.label}</strong>
      <em>${item.proof}</em>
    </div>
  `).join("");

  els.esgLedger.innerHTML = esgLedger.map((entry) => `
    <div class="ledger-card">
      <span>${entry.label}</span>
      <p>${fillEsgTemplate(entry.template, data)}</p>
    </div>
  `).join("");

  els.esgClaimControlList.innerHTML = esgClaimControls.map((item) => `
    <div class="method-row claim-row ${item.tone}">
      <span>${item.label}</span>
      <strong>${item.body}</strong>
    </div>
  `).join("");
}

function renderReports() {
  const client = selectedReportClient();
  const period = selectedReportMonth();
  const data = metricsForClient(client.id);
  const report = selectedReport();
  els.reportClientSelect.innerHTML = clients.map((item) => `
    <option value="${item.id}" ${item.id === client.id ? "selected" : ""}>${item.name}</option>
  `).join("");
  els.reportMonthSelect.innerHTML = reportMonths.map((month) => `
    <option value="${month.id}" ${month.id === period.id ? "selected" : ""}>${month.label}</option>
  `).join("");
  els.reportTabs.innerHTML = reportModes.map((mode) => `
    <button type="button" class="${mode.id === state.reportMode ? "active" : ""}" data-report-tab="${mode.id}">
      ${localizedText(mode.label, mode.labelZh || mode.label)}
    </button>
  `).join("");

  els.reportStatus.textContent = state.reportGenerated ? localizedText("Generated", "已生成") : localizedText("Draft pack", "報告草稿包");
  els.reportStatus.classList.toggle("good", state.reportGenerated);
  els.reportPeriod.textContent = `${period.label} - ${period.period}`;
  els.reportTitle.textContent = `${client.name} - ${localizedText(report.title, report.titleZh || report.title)}`;
  els.reportSummary.textContent = localizedText(report.summary, report.summaryZh || report.summary);
  const profileLabelZh = {
    Client: "客户",
    Segment: "业态与区域",
    Plan: "方案",
    Renewal: "续约日",
    "Proof need": "凭证需求"
  };
  els.reportClientProfile.innerHTML = [
    ["Client", client.name],
    ["Segment", `${client.segment} - ${client.district}`],
    ["Plan", client.plan],
    ["Renewal", client.renewalDate],
    ["Proof need", client.proofNeed]
  ].map(([label, value]) => `
    <div>
      <span>${label}<small class="zh">${profileLabelZh[label] || ""}</small></span>
      <strong>${value}</strong>
    </div>
  `).join("");
  const metricLabelZh = {
    "Health score": "健康分",
    "Report readiness": "报告准备度",
    "Xponge safety": "Xponge 安全",
    "Workplace wellbeing": "员工体验",
    "Green brand value": "绿色品牌价值",
    "Robot readiness": "机器人就绪度",
    "Green area": "绿化面积",
    "Water estimate": "节水估算",
    "Open issues": "未关闭问题",
    "Open work orders": "未完成工单",
    "Completed work orders": "已完成工单",
    "Approved proof": "已批准凭证",
    "Proof gaps": "凭证缺口",
    "Sensor alerts": "传感器预警",
    "Open incidents": "未关闭事件",
    "Resolved incidents": "已解决事件",
    "Open compliance": "未关闭合规项",
    "Cleared compliance": "已清理合规项",
    "Open quick tasks": "未关闭快速任务",
    "Closed quick tasks": "已关闭快速任务",
    "Open AI recommendations": "待复核 AI 建议",
    "Queued AI actions": "已入队 AI 动作",
    "Confirmed visits": "已确认到访",
    "Open visit slots": "待确认到访",
    "Outstanding AR": "未收应收",
    "Paid invoices": "已支付账单",
    "Audit events": "审计事件"
  };
  els.reportMetrics.innerHTML = [
    ["Health score", data.health],
    ["Report readiness", `${data.reportReadiness}%`],
    ["Xponge safety", data.impactAssessment ? data.impactAssessment.xpongeScore : "-"],
    ["Workplace wellbeing", data.impactAssessment ? data.impactAssessment.workplaceScore : "-"],
    ["Green brand value", data.impactAssessment ? data.impactAssessment.brandScore : "-"],
    ["Robot readiness", data.roboticScenario ? data.roboticScenario.readinessScore : "-"],
    ["Green area", `${data.greenArea.toFixed(1)} m2`],
    ["Water estimate", `${data.waterSaved} L/mo`],
    ["Open issues", data.issues],
    ["Open work orders", data.openWorkorders.length],
    ["Completed work orders", data.completedWorkorders.length],
    ["Approved proof", data.approvedProofRecords.length],
    ["Proof gaps", data.proofGaps.length],
    ["Sensor alerts", data.openSensorAlerts.length],
    ["Open incidents", data.openIncidents.length],
    ["Resolved incidents", data.resolvedIncidents.length],
    ["Open compliance", data.openComplianceItems.length],
    ["Cleared compliance", data.clearedComplianceItems.length],
    ["Open quick tasks", data.openQuickTasks.length],
    ["Closed quick tasks", data.closedQuickTasks.length],
    ["Open AI recommendations", data.openAiRecommendations.length],
    ["Queued AI actions", data.queuedAiRecommendations.length],
    ["Confirmed visits", data.confirmedScheduleSlots.length],
    ["Open visit slots", data.openScheduleSlots.length],
    ["Outstanding AR", formatCurrency(data.outstandingAmount)],
    ["Paid invoices", data.paidInvoices.length],
    ["Audit events", data.auditEvents.length]
  ].map(([label, value]) => `
    <div class="report-metric">
      <span>${label}<small class="zh">${metricLabelZh[label] || ""}</small></span>
      <strong>${value}</strong>
    </div>
  `).join("");

  const evidence = [
    ...(isTraditionalLanguage() && report.evidenceZh ? report.evidenceZh.map(toTraditionalText) : report.evidence),
    ...(data.impactAssessment ? [
      `Xponge safety score ${data.impactAssessment.xpongeScore}`,
      `Workplace wellbeing score ${data.impactAssessment.workplaceScore}`,
      `Green brand value score ${data.impactAssessment.brandScore}`
    ] : []),
    ...(data.roboticScenario ? [
      `Robotic care readiness ${data.roboticScenario.readinessScore}`,
      `Robotic care mode ${data.roboticScenario.robotMode}`,
      `Robotic patrol cadence ${data.roboticScenario.patrolCadence}`
    ] : []),
    `${impactEvidencePack.length} impact evidence type(s)`,
    `${roboticEvidencePack.length} robotic care evidence type(s)`,
    `${data.walls.length} wall ledger record(s)`,
    `${data.diagnoses.length} DR FOREST finding(s)`,
    `${data.completedWorkorders.length} completed work order(s)`,
    `${data.openWorkorders.length} open or scheduled work order(s)`,
    `${data.reportReadyProofRecords.length} report-ready proof record(s)`,
    `${data.proofGaps.length} proof gap(s)`,
    `${data.openSensorAlerts.length} open sensor alert(s)`,
    `${data.openIncidents.length} open SLA incident(s)`,
    `${data.resolvedIncidents.length} resolved incident(s)`,
    `${data.openComplianceItems.length} open compliance item(s)`,
    `${data.clearedComplianceItems.length} cleared compliance item(s)`,
    `${data.openQuickTasks.length} open quick task(s)`,
    `${data.closedQuickTasks.length} closed quick task(s)`,
    `${data.openAiRecommendations.length} open AI recommendation(s)`,
    `${data.queuedAiRecommendations.length} queued AI action(s)`,
    `${data.confirmedScheduleSlots.length} confirmed service visit(s)`,
    `${data.openScheduleSlots.length} open service slot(s)`,
    `${formatCurrency(data.outstandingAmount)} outstanding AR`,
    `${data.paidInvoices.length} paid invoice(s)`,
    `${data.auditEvents.length} client-linked audit event(s)`
  ];
  els.reportEvidence.innerHTML = evidence.map((item) => `
    <div class="evidence-card">
      <span>Included</span>
      <strong>${item}</strong>
    </div>
  `).join("");
  els.reportMethods.innerHTML = reportMethodRows().map((method) => `
    <div class="method-row">
      <span>${method.label}</span>
      <strong>${method.body}</strong>
    </div>
  `).join("");
}

function buildReportHtml() {
  const client = selectedReportClient();
  const period = selectedReportMonth();
  const report = selectedReport();
  const data = metricsForClient(client.id);
  const evidence = [
    ...(isTraditionalLanguage() && report.evidenceZh ? report.evidenceZh.map(toTraditionalText) : report.evidence),
    ...(data.impactAssessment ? [
      `Xponge safety score ${data.impactAssessment.xpongeScore}`,
      `Workplace wellbeing score ${data.impactAssessment.workplaceScore}`,
      `Green brand value score ${data.impactAssessment.brandScore}`
    ] : []),
    ...(data.roboticScenario ? [
      `Robotic care readiness ${data.roboticScenario.readinessScore}`,
      `Robotic care mode ${data.roboticScenario.robotMode}`,
      `Robotic patrol cadence ${data.roboticScenario.patrolCadence}`
    ] : []),
    `${impactEvidencePack.length} impact evidence type(s)`,
    `${roboticEvidencePack.length} robotic care evidence type(s)`,
    `${data.walls.length} wall ledger record(s)`,
    `${data.diagnoses.length} DR FOREST finding(s)`,
    `${data.completedWorkorders.length} completed work order(s)`,
    `${data.openWorkorders.length} open or scheduled work order(s)`,
    `${data.reportReadyProofRecords.length} report-ready proof record(s)`,
    `${data.proofGaps.length} proof gap(s)`,
    `${data.openSensorAlerts.length} open sensor alert(s)`,
    `${data.openIncidents.length} open SLA incident(s)`,
    `${data.resolvedIncidents.length} resolved incident(s)`,
    `${data.openComplianceItems.length} open compliance item(s)`,
    `${data.clearedComplianceItems.length} cleared compliance item(s)`,
    `${data.openQuickTasks.length} open quick task(s)`,
    `${data.closedQuickTasks.length} closed quick task(s)`,
    `${data.openAiRecommendations.length} open AI recommendation(s)`,
    `${data.queuedAiRecommendations.length} queued AI action(s)`,
    `${data.confirmedScheduleSlots.length} confirmed service visit(s)`,
    `${data.openScheduleSlots.length} open service slot(s)`,
    `${formatCurrency(data.outstandingAmount)} outstanding AR`,
    `${data.paidInvoices.length} paid invoice(s)`,
    `${data.auditEvents.length} client-linked audit event(s)`
  ];
  const metricRows = [
    ["Health score", data.health],
    ["Report readiness", `${data.reportReadiness}%`],
    ["Xponge safety", data.impactAssessment ? data.impactAssessment.xpongeScore : "-"],
    ["Workplace wellbeing", data.impactAssessment ? data.impactAssessment.workplaceScore : "-"],
    ["Green brand value", data.impactAssessment ? data.impactAssessment.brandScore : "-"],
    ["Robot readiness", data.roboticScenario ? data.roboticScenario.readinessScore : "-"],
    ["Green area", `${data.greenArea.toFixed(1)} m2`],
    ["Water estimate", `${data.waterSaved} L/mo`],
    ["Service miles avoided", `${data.serviceMilesSaved} km`],
    ["Wellness reach", `${data.staffReach} people/mo`],
    ["CO2e proxy", `${data.co2eProxy} kg`],
    ["Open work orders", data.openWorkorders.length],
    ["Completed work orders", data.completedWorkorders.length],
    ["Approved proof", data.approvedProofRecords.length],
    ["Proof gaps", data.proofGaps.length],
    ["Sensor alerts", data.openSensorAlerts.length],
    ["Open incidents", data.openIncidents.length],
    ["Resolved incidents", data.resolvedIncidents.length],
    ["Open compliance", data.openComplianceItems.length],
    ["Cleared compliance", data.clearedComplianceItems.length],
    ["Open quick tasks", data.openQuickTasks.length],
    ["Closed quick tasks", data.closedQuickTasks.length],
    ["Open AI recommendations", data.openAiRecommendations.length],
    ["Queued AI actions", data.queuedAiRecommendations.length],
    ["Confirmed visits", data.confirmedScheduleSlots.length],
    ["Open visit slots", data.openScheduleSlots.length],
    ["Outstanding AR", formatCurrency(data.outstandingAmount)],
    ["Paid invoices", data.paidInvoices.length],
    ["Audit events", data.auditEvents.length]
  ];

  return `<!doctype html>
<html lang="en-HK">
<head>
  <meta charset="utf-8">
  <title>${client.name} - ${report.label}</title>
  <style>
    body { margin: 40px; color: #18211d; font-family: Inter, Arial, sans-serif; line-height: 1.5; }
    h1 { margin: 0 0 8px; font-size: 32px; }
    h2 { margin: 28px 0 10px; font-size: 20px; }
    .meta, .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
    .card { border: 1px solid #d8e1d8; border-radius: 8px; padding: 14px; background: #f7faf7; }
    span { display: block; color: #63716a; font-size: 12px; font-weight: 700; text-transform: uppercase; }
    strong { display: block; margin-top: 4px; }
    li { margin: 6px 0; }
  </style>
</head>
<body>
  <span>DR FOREST FM Ops</span>
  <h1>${client.name} - ${localizedText(report.title, report.titleZh || report.title)}</h1>
  <p>${period.label} (${period.period})</p>
  <p>${localizedText(report.summary, report.summaryZh || report.summary)}</p>
  <div class="meta">
    <div class="card"><span>Client</span><strong>${client.segment} - ${client.district}</strong></div>
    <div class="card"><span>Plan</span><strong>${client.plan}</strong></div>
    <div class="card"><span>Renewal</span><strong>${client.renewalDate}</strong></div>
    <div class="card"><span>Proof need</span><strong>${client.proofNeed}</strong></div>
  </div>
  <h2>Metrics</h2>
  <div class="grid">
    ${metricRows.map(([label, value]) => `<div class="card"><span>${label}</span><strong>${value}</strong></div>`).join("")}
  </div>
  <h2>Evidence Included</h2>
  <ul>${evidence.map((item) => `<li>${item}</li>`).join("")}</ul>
  <h2>Method Notes</h2>
  <ul>${reportMethodRows().map((method) => `<li><strong>${method.label}:</strong> ${method.body}</li>`).join("")}</ul>
</body>
</html>`;
}

function downloadReportHtml() {
  const client = selectedReportClient();
  const period = selectedReportMonth();
  const html = buildReportHtml();
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${client.id}-${period.id}-dr-forest-report.html`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  state.reportGenerated = true;
  recordAuditEvent({
    actor: "ESG desk",
    action: "HTML report exported",
    entityType: "report",
    entityId: `${client.id}-${period.id}`,
    clientId: client.id,
    tone: "ready",
    detail: "Client-scoped HTML report was exported from Report Center."
  });
  renderAll();
}

function renderArchitecture() {
  els.architectureLayers.innerHTML = architectureLayers.map((layer, index) => `
    <article class="architecture-card">
      <span>0${index + 1}</span>
      <h3>${layer.name}</h3>
      <div>
        ${layer.items.map((item) => `<em>${item}</em>`).join("")}
      </div>
    </article>
  `).join("");
}

function bindDynamicActions() {
  document.querySelectorAll("[data-client-select], [data-client-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      const clientId = button.dataset.clientSelect || button.dataset.clientTab;
      state.selectedClientId = clientId;
      const firstClientWall = walls.find((wall) => wall.clientId === clientId);
      if (firstClientWall) state.selectedWallId = firstClientWall.id;
      renderAll();
    });
  });

  document.querySelectorAll("[data-wall-select]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedWallId = button.dataset.wallSelect;
      state.selectedClientId = wallById(state.selectedWallId).clientId;
      renderAll();
      document.querySelector("#walls").scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  document.querySelectorAll("[data-report-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      state.reportMode = button.dataset.reportTab;
      renderReports();
      applyLanguageContent();
    });
  });

  document.querySelectorAll("[data-complete-workorder]").forEach((button) => {
    button.addEventListener("click", () => {
      completeWorkorder(button.dataset.completeWorkorder);
    });
  });

  document.querySelectorAll("[data-stage-dispatch]").forEach((button) => {
    button.addEventListener("click", () => {
      stageDispatchKit(button.dataset.stageDispatch);
    });
  });

  document.querySelectorAll("[data-renewal-pack]").forEach((button) => {
    button.addEventListener("click", () => {
      prepareRenewalPack(button.dataset.renewalPack);
    });
  });

  document.querySelectorAll("[data-approve-proof]").forEach((button) => {
    button.addEventListener("click", () => {
      approveProofRecord(button.dataset.approveProof);
    });
  });

  document.querySelectorAll("[data-ack-sensor]").forEach((button) => {
    button.addEventListener("click", () => {
      acknowledgeSensorAlert(button.dataset.ackSensor);
    });
  });

  document.querySelectorAll("[data-request-supply]").forEach((button) => {
    button.addEventListener("click", () => {
      requestSupplyReorder(button.dataset.requestSupply);
    });
  });

  document.querySelectorAll("[data-mark-invoice-paid]").forEach((button) => {
    button.addEventListener("click", () => {
      markInvoicePaid(button.dataset.markInvoicePaid);
    });
  });

  document.querySelectorAll("[data-confirm-schedule]").forEach((button) => {
    button.addEventListener("click", () => {
      confirmScheduleSlot(button.dataset.confirmSchedule);
    });
  });

  document.querySelectorAll("[data-resolve-incident]").forEach((button) => {
    button.addEventListener("click", () => {
      resolveIncident(button.dataset.resolveIncident);
    });
  });

  document.querySelectorAll("[data-clear-compliance]").forEach((button) => {
    button.addEventListener("click", () => {
      clearComplianceItem(button.dataset.clearCompliance);
    });
  });

  document.querySelectorAll("[data-close-quick-task]").forEach((button) => {
    button.addEventListener("click", () => {
      closeQuickOpsTask(button.dataset.closeQuickTask);
    });
  });

  document.querySelectorAll("[data-queue-ai-action]").forEach((button) => {
    button.addEventListener("click", () => {
      queueAiAction(button.dataset.queueAiAction);
    });
  });
}

function renderAll() {
  renderOverview();
  renderAiCommandCenter();
  renderHealthScoreMethod();
  renderSpatialDesign();
  renderImpactValue();
  renderRoboticCare();
  renderMvpControl();
  renderPlatform();
  renderPositioning();
  renderClients();
  renderCommercial();
  renderBilling();
  renderCompliance();
  renderWalls();
  renderSensors();
  renderIncidents();
  renderService();
  renderSchedule();
  renderDispatch();
  renderSupply();
  renderProof();
  renderEsg();
  renderAudit();
  renderReports();
  renderArchitecture();
  bindDynamicActions();
  applyLanguageContent();
}

els.simulateVisitBtn.addEventListener("click", () => {
  state.simulatedVisits += 1;
  recordAuditEvent({
    actor: "FM Ops demo",
    action: "Portfolio visit simulated",
    entityType: "portfolio",
    entityId: "visit-simulation",
    clientId: null,
    tone: "completed",
    detail: "Demo visit completion adjusted portfolio health and issue counts."
  });
  els.syncStatus.textContent = `Synced just now after ${state.simulatedVisits} completed visit${state.simulatedVisits > 1 ? "s" : ""}`;
  renderAll();
});

els.reviewAiBtn.addEventListener("click", () => {
  document.querySelector("#ai").scrollIntoView({ behavior: "smooth", block: "start" });
});

els.activeRoleSelect.addEventListener("change", () => {
  setActiveRole(els.activeRoleSelect.value);
});

els.createQuickTaskBtn.addEventListener("click", () => {
  createQuickOpsTask({
    clientId: els.quickClientSelect.value,
    templateId: els.quickTemplateSelect.value,
    priority: els.quickPrioritySelect.value,
    note: els.quickNoteInput.value.trim()
  });
});

els.reportClientSelect.addEventListener("change", () => {
  state.selectedReportClientId = els.reportClientSelect.value;
  renderReports();
  applyLanguageContent();
});

els.reportMonthSelect.addEventListener("change", () => {
  state.selectedReportMonth = els.reportMonthSelect.value;
  renderReports();
  applyLanguageContent();
});

els.downloadReportBtn.addEventListener("click", downloadReportHtml);

els.generateReportBtn.addEventListener("click", () => {
  state.reportGenerated = true;
  state.reportMode = "esg-proof";
  state.selectedReportClientId = state.selectedClientId || state.selectedReportClientId;
  recordAuditEvent({
    actor: "ESG desk",
    action: "ESG pack generated",
    entityType: "report",
    entityId: state.reportMode,
    clientId: state.selectedReportClientId,
    tone: "ready",
    detail: "Report center marked the ESG pack as generated."
  });
  renderReports();
  document.querySelector("#reports").scrollIntoView({ behavior: "smooth", block: "start" });
});

els.languageButtons.forEach((button) => {
  button.addEventListener("click", () => {
    saveLanguagePreference(button.dataset.languageSwitch);
    renderAll();
  });
});

els.filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.filter = button.dataset.filter || "all";
    els.filterButtons.forEach((item) => item.classList.toggle("active", item === button));
    renderWalls();
    bindDynamicActions();
    applyLanguageContent();
  });
});

els.navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    els.navLinks.forEach((item) => item.classList.toggle("active", item === link));
  });
});

async function bootstrap() {
  try {
    loadLanguagePreference();
    await loadAppData();
    loadWorkorderCompletions();
    loadDispatchStaging();
    loadProofApprovals();
    loadSensorAcknowledgements();
    loadSupplyRequests();
    loadInvoicePayments();
    loadScheduleConfirmations();
    loadIncidentResolutions();
    loadComplianceClearances();
    loadActiveRole();
    loadQuickOpsTasks();
    loadAuditEvents();
    loadAiQueuedActions();
    await loadServerOpsState();
    initializeSelection();
    renderAll();
  } catch (error) {
    console.error(error);
    els.syncStatus.textContent = "Data load failed";
    els.summaryGrid.innerHTML = `
      <article class="stat-card">
        <span>Startup error</span>
        <strong>Data unavailable</strong>
        <em>${error.message}</em>
      </article>
    `;
  }
}

bootstrap();
