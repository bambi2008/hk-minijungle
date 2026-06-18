const stages = {
  seedling: "幼苗期",
  vegetative: "营养生长期",
  flowering: "开花期",
  fruiting: "结果期"
};

export const knowledgeGraph = {
  version: "2026-06-03",
  name: "hk minijungle indoor crop diagnosis graph",
  scope: "首批五类室内作物：矮生番茄、罗勒、迷迭香、草莓、紧凑型辣椒",
  designPrinciples: [
    "先用照片自动获取信息，只有置信度不足时再补问",
    "复查时间跟随处方动作，而不是固定机械提醒",
    "每条路径都必须落到可执行动作和可拍照复查信号",
    "先限制品种和场景，降低误诊和客户操作负担"
  ],
  photoTypes: {
    plant: "整株照片",
    leaf: "叶片特写",
    root: "根区/基质表面",
    flower: "花序/果实",
    pest: "虫害线索"
  },
  crops: {
    tomato: {
      name: "矮生番茄",
      scope: "只支持 Micro Tom、Orange Hat、Tiny Tim、Red Robin 等微型/矮生品种；首批不支持普通无限生长番茄。",
      pathways: [
        {
          id: "tomato-flower-no-fruit",
          stage: "flowering",
          userProblem: "开花但不坐果、花朵脱落",
          painType: ["泪点", "槽点"],
          likelyCauses: ["室内缺少震动授粉", "光照不足", "温度过高或过低", "氮肥偏高"],
          photoSignals: ["花序有花但无小果", "花柄发黄脱落", "节间偏长", "叶色偏深但花弱"],
          requiredPhotos: ["plant", "flower", "leaf"],
          autoIntake: ["识别花序数量", "判断是否有小果膨大", "估算节间长度", "读取光照小时数"],
          prescription: ["每天中午轻弹花序 5 秒或低速风扇辅助", "把补光提高到 14-16 小时", "保持冠层 22-28C", "结果前避免继续加高氮肥"],
          followup: { when: "3-7 天", photo: "同一花序照片", success: "小果开始膨大，新增落花减少" },
          productGap: "多数水培机只提醒加水/加营养液，不会判断授粉动作是否需要介入。"
        },
        {
          id: "tomato-fruit-slow-ripen",
          stage: "fruiting",
          userProblem: "果实不转色、味道淡、水味重",
          painType: ["槽点", "笑点"],
          likelyCauses: ["光照强度不足", "钾供应不足", "挂果过多", "室内昼夜温差不足"],
          photoSignals: ["果实长期停留浅绿/浅黄", "叶片开始衰弱但果不熟", "果串过密"],
          requiredPhotos: ["plant", "flower"],
          autoIntake: ["估算挂果数量", "识别果实颜色阶段", "记录结果天数"],
          prescription: ["保留强壮果串，必要时疏掉弱小果", "提高有效补光并稳定 14-16 小时", "检查结果期营养是否偏低钾", "避免频繁大幅换液"],
          followup: { when: "7 天", photo: "果串同角度照片", success: "果色加深或新果继续膨大" },
          productGap: "用户买设备后仍不知道味道差是光、营养还是负载问题。"
        },
        {
          id: "tomato-xponge-water-swing",
          stage: "fruiting",
          userProblem: "Xponge 边缘忽干忽湿、叶片卷曲",
          painType: ["痛点", "泪点"],
          likelyCauses: ["超薄根区缓冲小", "储液量不足", "强灯蒸腾过快", "边缘毛细补水不稳定"],
          photoSignals: ["叶缘上卷", "边缘干缩", "根区局部发白或发绿", "下部叶黄"],
          requiredPhotos: ["plant", "leaf", "root"],
          autoIntake: ["识别边缘干缩", "记录 Xponge 面积和厚度", "读取储液量"],
          prescription: ["Xponge 作为根区界面，外接 2-5L 储液缓冲", "边缘做毛细补水和遮光", "补水改成小剂量高频", "48 小时内不要整片长期浸没"],
          followup: { when: "48 小时", photo: "根区边缘照片", success: "边缘干缩不再扩大，叶卷不加重" },
          productGap: "超薄基质需要专门的水肥波动模型，普通水分计无法解释边缘问题。"
        }
      ]
    },
    basil: {
      name: "罗勒",
      scope: "支持甜罗勒、泰国罗勒、希腊罗勒等盆栽紧凑型罗勒；首批重点不是救濒死，而是保持香味和连续采收。",
      pathways: [
        {
          id: "basil-leggy-low-light",
          stage: "vegetative",
          userProblem: "徒长、叶片变小、香味变淡",
          painType: ["槽点", "笑点"],
          likelyCauses: ["有效光不足", "灯距过远", "修剪过晚", "密植抢光"],
          photoSignals: ["节间很长", "顶端追光", "下部叶稀疏", "新叶薄而小"],
          requiredPhotos: ["plant", "leaf"],
          autoIntake: ["估算节间长度", "判断株形是否上窜", "识别下部叶密度"],
          prescription: ["补光稳定到 12-14 小时", "把灯距调整到 20-35cm", "从节点上方修剪促分枝", "过密时分盆"],
          followup: { when: "7 天", photo: "整株侧面照片", success: "侧芽增加，新节间变短" },
          productGap: "现有传感器能说光弱，但不会告诉用户剪哪里。"
        },
        {
          id: "basil-flowering-bitter",
          stage: "flowering",
          userProblem: "一直开花，叶子变苦、采收周期变短",
          painType: ["痛点"],
          likelyCauses: ["修剪不及时", "植株进入生殖阶段", "高温或缺水压力", "老株衰退"],
          photoSignals: ["顶端花穗", "叶片变窄", "下部黄叶", "枝条木质化"],
          requiredPhotos: ["plant", "leaf"],
          autoIntake: ["识别花穗", "判断是否应重剪或换新苗", "记录上次采收时间"],
          prescription: ["立即剪掉花穗和上方老枝", "保留健康节点促侧枝", "若连续开花，提示启动下一批苗", "保持水分稳定避免逼花"],
          followup: { when: "3-5 天", photo: "修剪点照片", success: "剪口下方侧芽萌发" },
          productGap: "香草产品常强调发芽，缺少连续采收阶段的动作提醒。"
        }
      ]
    },
    rosemary: {
      name: "迷迭香",
      scope: "支持小苗、扦插苗、小盆迷迭香；必须与罗勒分开模型，因为它怕长期湿根、需要更强光和通风。",
      pathways: [
        {
          id: "rosemary-wet-root-decline",
          stage: "vegetative",
          userProblem: "看似缺水但越浇越差、叶尖发黑或整株发灰",
          painType: ["泪点", "痛点"],
          likelyCauses: ["过湿", "排水差", "根区缺氧", "与需水量高的香草混种"],
          photoSignals: ["叶色灰绿", "下部叶黄黑", "基质表面长期湿", "枝条软塌"],
          requiredPhotos: ["plant", "root", "leaf"],
          autoIntake: ["判断基质表面湿度", "识别叶尖黑化", "检测是否同盆混种"],
          prescription: ["停止浇水 48 小时并加强通风", "改到独立容器和疏松介质", "只在上层明显变干后浇透", "避免与罗勒同盆"],
          followup: { when: "48 小时", photo: "根区和枝梢照片", success: "枝梢不再继续发黑，基质表面变干" },
          productGap: "迷迭香常被当普通香草养，产品端缺少“少水强通风”的反直觉提示。"
        },
        {
          id: "rosemary-low-light-indoors",
          stage: "vegetative",
          userProblem: "室内一直不长、香味弱、枝条细",
          painType: ["槽点"],
          likelyCauses: ["直射光不足", "普通台灯无效", "空气不流动", "冬季室内环境不匹配"],
          photoSignals: ["新梢细弱", "叶片间距变大", "整体向窗倾斜"],
          requiredPhotos: ["plant"],
          autoIntake: ["识别倾斜追光", "判断灯具距离和光照小时数", "记录窗向"],
          prescription: ["补强光到 12-14 小时", "加低速循环风", "避免每天少量浇水", "若无强光条件，提示作为短期厨房香草而非长期木本盆栽"],
          followup: { when: "7 天", photo: "整株侧面照片", success: "新梢直立，叶色更饱满" },
          productGap: "这是“客户以为自己不会养，其实作物不适配环境”的典型诊断价值点。"
        }
      ]
    },
    strawberry: {
      name: "草莓",
      scope: "优先支持日中性/四季草莓和紧凑盆栽草莓；首批重点做授粉、果形、冠部潮湿和叶斑。",
      pathways: [
        {
          id: "strawberry-flower-no-fruit",
          stage: "flowering",
          userProblem: "花很多但不结果，花谢后没有小果",
          painType: ["泪点", "槽点"],
          likelyCauses: ["室内缺少有效授粉", "湿度/温度不合适", "光照不足", "植株还未建立"],
          photoSignals: ["花心变黑", "花瓣脱落但花托不膨大", "花序多但无小果"],
          requiredPhotos: ["plant", "flower"],
          autoIntake: ["识别开放花数量", "判断花托是否膨大", "记录开花天数"],
          prescription: ["每天中午用软刷轻刷花心", "低速风扇增加空气流动", "保持补光 12-14 小时", "首批弱花可疏掉让植株建立"],
          followup: { when: "3-5 天", photo: "同一花序照片", success: "花托开始膨大，小果保留" },
          productGap: "草莓自花能力不等于室内自动坐果，现有产品很少提示人工授粉。"
        },
        {
          id: "strawberry-deformed-fruit",
          stage: "fruiting",
          userProblem: "果形畸形、局部不膨大",
          painType: ["笑点", "槽点"],
          likelyCauses: ["授粉不完整", "蓟马等虫害", "花期湿度异常", "营养/光照不足"],
          photoSignals: ["果实一侧凹陷", "种子分布不均", "花瓣残留异常", "叶片有斑点"],
          requiredPhotos: ["flower", "leaf", "pest"],
          autoIntake: ["识别果形对称性", "放大检查花心和叶背", "判断是否有斑点/虫痕"],
          prescription: ["下一批花加强逐花授粉", "补拍叶背排查蓟马", "畸形果可保留观察但不作为成功样本", "保持冠部干爽"],
          followup: { when: "7 天", photo: "新一批果实照片", success: "新果更对称，畸形比例下降" },
          productGap: "畸形果是非常适合视觉识别和用户教育的高记忆点场景。"
        },
        {
          id: "strawberry-crown-wet",
          stage: "vegetative",
          userProblem: "冠部潮湿、叶柄发软、根区有白毛",
          painType: ["痛点"],
          likelyCauses: ["冠部长期潮湿", "通风不足", "基质表面见光发霉", "种植点过低"],
          photoSignals: ["冠部被水覆盖", "白色絮状物", "叶柄基部发褐"],
          requiredPhotos: ["plant", "root"],
          autoIntake: ["识别冠部位置", "检测白毛/绿藻", "判断通风和遮光"],
          prescription: ["露出冠部，不让水长期覆盖", "表面遮光但保留通风", "暂停喷淋式浇水", "48 小时复查霉斑是否扩散"],
          followup: { when: "48 小时", photo: "冠部近照", success: "白毛不扩散，冠部变干爽" },
          productGap: "很多系统关注水位，却忽略草莓冠部不能长期潮湿。"
        }
      ]
    },
    pepper: {
      name: "辣椒",
      scope: "首批限制为矮生辣椒、观赏椒、小型甜椒；不支持大型露地甜椒和高大辣椒品种。",
      pathways: [
        {
          id: "pepper-flower-drop",
          stage: "flowering",
          userProblem: "开花很多但连续掉花、不坐果",
          painType: ["泪点", "槽点"],
          likelyCauses: ["光照不足", "温度过高或过低", "空气湿度不合适", "水分波动", "授粉不足"],
          photoSignals: ["花柄整体脱落", "花朵不开完全就萎缩", "植株徒长", "叶片卷曲"],
          requiredPhotos: ["plant", "flower", "leaf"],
          autoIntake: ["识别落花位置", "估算节间长度", "记录温度/湿度", "判断是否已有小椒"],
          prescription: ["补光提高到 14-16 小时", "保持 22-30C，避开灯下高温", "每天轻摇植株或软刷授粉", "水分改为稳定小幅波动"],
          followup: { when: "5-7 天", photo: "花序和新小椒照片", success: "花柄保留，小椒开始膨大" },
          productGap: "辣椒与番茄相似但温湿度窗口更敏感，不能完全套用番茄处方。"
        },
        {
          id: "pepper-compact-variety-fit",
          stage: "seedling",
          userProblem: "买了普通品种，室内设备太矮、一直长叶不开花",
          painType: ["槽点", "笑点"],
          likelyCauses: ["品种不适合室内", "设备高度不足", "营养生长过旺", "补光只够育苗不够结果"],
          photoSignals: ["株高接近灯板", "叶片遮满设备", "没有花芽", "下层互相遮光"],
          requiredPhotos: ["plant"],
          autoIntake: ["识别设备高度占用", "判断是否高大型品种", "估算冠层遮光"],
          prescription: ["首批用户只推荐矮生/观赏/小型品种", "已有大株可移出设备或强剪", "减少同机混种数量", "提示换成适配种子包"],
          followup: { when: "7 天", photo: "整株与灯距照片", success: "灯距恢复，侧枝通风改善" },
          productGap: "种子选择本身就是诊断前置环节，能显著减少售后挫败。"
        }
      ]
    }
  }
};

export const goldenPathCases = [
  {
    id: "golden-tomato-flower-drop",
    cropKey: "tomato",
    pathwayId: "tomato-flower-no-fruit",
    title: "矮生番茄落花",
    entryPhoto: "flower",
    photoSequence: ["flower", "plant", "leaf"],
    diagnosisTarget: "开花但不坐果、花朵脱落",
    customerPromise: "先判断是不是授粉、光照或温度窗口问题，只给今天一个动作。",
    sampleInput: {
      device: "xponge-diy",
      stage: "flowering",
      medium: "xponge",
      light: "low",
      moisture: "swing",
      climate: "hot",
      concern: "fruit",
      symptoms: ["leggy", "no-fruit", "leaf-curl"],
      visuals: ["long-internodes", "flower-drop", "edge-dry"],
      sensorMoisture: 32,
      lightHours: 11,
      temperature: 33,
      humidity: 48,
      ec: 1.2,
      ph: 6.4,
      reservoir: 3,
      notes: "矮生番茄开花后连续落花，没有小果膨大。"
    }
  },
  {
    id: "golden-basil-leggy",
    cropKey: "basil",
    pathwayId: "basil-leggy-low-light",
    title: "罗勒徒长",
    entryPhoto: "plant",
    photoSequence: ["plant", "leaf"],
    diagnosisTarget: "徒长、叶片变小、香味变淡",
    customerPromise: "先把光照和修剪点说清楚，不让用户被一堆参数淹没。",
    sampleInput: {
      device: "letpot",
      stage: "vegetative",
      medium: "water",
      light: "low",
      moisture: "stable",
      climate: "dry",
      concern: "leggy",
      symptoms: ["leggy", "yellow-leaves"],
      visuals: ["long-internodes", "pale-new-growth"],
      sensorMoisture: 48,
      lightHours: 8,
      temperature: 25,
      humidity: 38,
      ec: 1.1,
      ph: 6.2,
      reservoir: 2,
      notes: "罗勒节间变长，叶片变淡，两周没有掐顶。"
    }
  },
  {
    id: "golden-rosemary-wet-root",
    cropKey: "rosemary",
    pathwayId: "rosemary-wet-root-decline",
    title: "迷迭香过湿",
    entryPhoto: "root",
    photoSequence: ["root", "plant", "leaf"],
    diagnosisTarget: "看似缺水但越浇越差、叶尖发黑或整株发灰",
    customerPromise: "把“别再浇水”这个反直觉动作说得足够明确。",
    sampleInput: {
      device: "balcony",
      stage: "vegetative",
      medium: "soil",
      light: "medium",
      moisture: "wet",
      climate: "humid",
      concern: "root",
      symptoms: ["yellow-leaves", "wilting", "algae"],
      visuals: ["lower-yellowing", "white-fuzz", "green-surface"],
      sensorMoisture: 82,
      lightHours: 10,
      temperature: 23,
      humidity: 72,
      ec: 0.9,
      ph: 6.5,
      reservoir: 1.5,
      notes: "迷迭香下部叶片发黄，根区长期潮湿，表面有白色絮状物。"
    }
  },
  {
    id: "golden-strawberry-pollination-crown",
    cropKey: "strawberry",
    pathwayId: "strawberry-crown-wet",
    relatedPathwayIds: ["strawberry-flower-no-fruit"],
    title: "草莓授粉/冠部湿",
    entryPhoto: "flower",
    photoSequence: ["flower", "root", "plant"],
    diagnosisTarget: "冠部潮湿叠加花后不坐果风险",
    customerPromise: "先处理冠部湿和授粉动作，再用同一花序/冠部照片复查。",
    sampleInput: {
      device: "clickgrow",
      stage: "flowering",
      medium: "xponge",
      light: "medium",
      moisture: "wet",
      climate: "humid",
      concern: "fruit",
      symptoms: ["no-fruit", "spots", "algae"],
      visuals: ["flower-drop", "white-fuzz", "green-surface"],
      sensorMoisture: 76,
      lightHours: 12,
      temperature: 26,
      humidity: 68,
      ec: 1.6,
      ph: 6.1,
      reservoir: 3,
      notes: "草莓开花后坐果差，冠部附近潮湿并有白色絮状物。"
    }
  },
  {
    id: "golden-pepper-flower-drop",
    cropKey: "pepper",
    pathwayId: "pepper-flower-drop",
    title: "辣椒落花",
    entryPhoto: "flower",
    photoSequence: ["flower", "plant", "leaf"],
    diagnosisTarget: "开花很多但连续掉花、不坐果",
    customerPromise: "把授粉、温度和水分波动合成一个今天能做的动作。",
    sampleInput: {
      device: "aerogarden",
      stage: "flowering",
      medium: "water",
      light: "low",
      moisture: "swing",
      climate: "hot",
      concern: "fruit",
      symptoms: ["leggy", "no-fruit", "leaf-curl", "wilting"],
      visuals: ["long-internodes", "flower-drop", "edge-dry"],
      sensorMoisture: 36,
      lightHours: 10,
      temperature: 34,
      humidity: 42,
      ec: 1.4,
      ph: 6.3,
      reservoir: 3,
      notes: "矮生辣椒开花后连续落花，灯下温度偏高，根区忽干忽湿。"
    }
  }
];

export function buildGoldenPathCases(graph = knowledgeGraph, cases = goldenPathCases) {
  const pathways = new Map(flattenKnowledgeGraph(graph).map((pathway) => [pathway.id, pathway]));
  return cases.map((item) => {
    const pathway = pathways.get(item.pathwayId);
    const relatedPathways = (item.relatedPathwayIds || []).map((id) => pathways.get(id)).filter(Boolean);
    return {
      ...item,
      cropName: graph.crops[item.cropKey]?.name || item.cropKey,
      pathway,
      relatedPathways,
      prescription: pathway?.prescription || [],
      followup: pathway?.followup || null,
      requiredPhotos: Array.from(new Set([...(pathway?.requiredPhotos || []), ...item.photoSequence])),
      runnableFlow: {
        photo: item.entryPhoto,
        diagnosis: pathway?.userProblem || item.diagnosisTarget,
        action: pathway?.prescription?.[0] || "",
        followup: pathway?.followup?.when || "",
        success: pathway?.followup?.success || ""
      }
    };
  });
}

export function flattenKnowledgeGraph(graph = knowledgeGraph) {
  return Object.entries(graph.crops).flatMap(([cropKey, crop]) =>
    crop.pathways.map((pathway) => ({
      ...pathway,
      cropKey,
      cropName: crop.name,
      cropScope: crop.scope,
      stageName: stages[pathway.stage] || pathway.stage
    }))
  );
}

export function buildKnowledgeGraphView(graph = knowledgeGraph) {
  const nodes = [];
  const edges = [];
  const addNode = (id, label, type, meta = {}) => {
    if (!nodes.some((node) => node.id === id)) nodes.push({ id, label, type, ...meta });
  };
  const addEdge = (from, to, relation) => edges.push({ from, to, relation });

  Object.entries(graph.crops).forEach(([cropKey, crop]) => {
    const cropId = `crop:${cropKey}`;
    addNode(cropId, crop.name, "crop", { scope: crop.scope });

    crop.pathways.forEach((pathway) => {
      const stageId = `stage:${cropKey}:${pathway.stage}`;
      const problemId = `problem:${pathway.id}`;
      const actionId = `action:${pathway.id}`;
      const followupId = `followup:${pathway.id}`;

      addNode(stageId, stages[pathway.stage] || pathway.stage, "stage");
      addNode(problemId, pathway.userProblem, "problem", { painType: pathway.painType });
      addNode(actionId, pathway.prescription[0], "prescription", { steps: pathway.prescription });
      addNode(followupId, pathway.followup.when, "followup", pathway.followup);
      addEdge(cropId, stageId, "has_stage");
      addEdge(stageId, problemId, "has_problem");
      addEdge(problemId, actionId, "treated_by");
      addEdge(actionId, followupId, "verified_by");

      pathway.photoSignals.forEach((signal) => {
        const signalId = `signal:${signal}`;
        addNode(signalId, signal, "photo_signal");
        addEdge(signalId, problemId, "indicates");
      });
    });
  });

  return { nodes, edges };
}
