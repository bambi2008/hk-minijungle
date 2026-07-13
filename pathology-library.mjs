const stages = {
  seedling: "幼苗期",
  vegetative: "营养生长期",
  flowering: "开花期",
  fruiting: "结果期"
};

const sourceIndex = {
  "umn-tomato": {
    title: "University of Minnesota Extension: Growing tomatoes in home gardens",
    url: "https://extension.umn.edu/vegetables/growing-tomatoes"
  },
  "umn-pepper": {
    title: "University of Minnesota Extension: Growing peppers in home gardens",
    url: "https://extension.umn.edu/vegetables/growing-peppers"
  },
  "umn-strawberry": {
    title: "University of Minnesota Extension: Growing strawberries in the home garden",
    url: "https://extension.umn.edu/fruit/growing-strawberries-home-garden"
  },
  "ncsu-basil": {
    title: "NC State Extension Gardener Plant Toolbox: Ocimum basilicum",
    url: "https://plants.ces.ncsu.edu/plants/ocimum-basilicum/"
  },
  "purdue-basil-black-leg": {
    title: "Purdue Southwest Purdue Agricultural Program: Black Leg on Basil",
    url: "https://ag.purdue.edu/department/arge/swpap/black-leg-basil.html"
  },
  "ncsu-rosemary": {
    title: "NC State Extension Gardener Plant Toolbox: Salvia rosmarinus",
    url: "https://plants.ces.ncsu.edu/plants/salvia-rosmarinus/"
  },
  "rosemary-lifecycle-research": {
    title: "FiveCrop rosemary lifecycle and common problems research",
    url: "local://fivecrop/rosemary-lifecycle-research"
  },
  "fivecrop-field": {
    title: "FiveCrop MVP field rules",
    url: "local://fivecrop/pathology-field-rules"
  }
};

function condition({
  id,
  cropKey,
  stage,
  category,
  title,
  summary,
  action,
  followup,
  evidence,
  differentials,
  missingInfo,
  photoTypes,
  match,
  sourceIds
}) {
  return {
    id,
    cropKey,
    stage,
    stageName: stages[stage] || stage,
    category,
    title,
    summary,
    action,
    followup,
    evidence,
    differentials,
    missingInfo,
    photoTypes,
    match,
    sourceIds
  };
}

export const pathologyLibrary = {
  version: "2026-07-13",
  scope: "FiveCrop indoor edible crop pathology matrix for tomato, basil, rosemary, strawberry, and pepper.",
  sourceIndex,
  crops: {
    tomato: {
      name: "矮生番茄",
      scope: "Micro Tom、Orange Hat、Tiny Tim、Red Robin 等矮生/微型番茄；不覆盖露地无限生长番茄。",
      conditions: [
        condition({
          id: "tomato-blossom-drop-heat-pollination",
          cropKey: "tomato",
          stage: "flowering",
          category: "flowering",
          title: "番茄落花/不坐果",
          summary: "室内缺少振动授粉，叠加高温、低温或弱光时，开花后容易落花不坐果。",
          action: "今天中午轻弹花序 5 秒，先把灯下冠层温度控制在 22-30C。",
          followup: { when: "3-5 天", photo: "同一花序", success: "落花减少，花托或小果开始保留" },
          evidence: ["开花但没有小果", "花梗发黄或脱落", "弱光徒长或灯下过热"],
          differentials: ["氮肥偏高", "水分波动", "品种不是矮生结果型"],
          missingInfo: ["灯下冠层温度", "每天补光小时", "是否有人工授粉"],
          photoTypes: ["flower", "plant"],
          match: {
            concern: ["fruit"],
            symptoms: ["no-fruit", "leggy"],
            visuals: ["flower-drop", "long-internodes"],
            stage: ["flowering"],
            environment: { light: ["low"], climate: ["hot"], temperatureHigh: 30, temperatureLow: 18 },
            visionLabels: ["flower-drop", "flower-or-fruit"]
          },
          sourceIds: ["umn-tomato", "fivecrop-field"]
        }),
        condition({
          id: "tomato-low-light-leggy",
          cropKey: "tomato",
          stage: "vegetative",
          category: "light",
          title: "番茄弱光徒长",
          summary: "矮生番茄在室内光量不足时会拉长节间，后续开花和坐果都变弱。",
          action: "把补光稳定到 14-16 小时，并从侧面拍整株记录节间。",
          followup: { when: "7 天", photo: "整株侧面", success: "新节间变短，新叶更厚" },
          evidence: ["节间变长", "植株向灯或窗口倾斜", "不开花或花弱"],
          differentials: ["过密遮光", "灯距过远", "品种过高大"],
          missingInfo: ["灯距", "光照小时", "植株到灯板距离"],
          photoTypes: ["plant"],
          match: {
            concern: ["leggy"],
            symptoms: ["leggy", "no-flower"],
            visuals: ["long-internodes"],
            environment: { light: ["low"], lightHoursMax: 13 }
          },
          sourceIds: ["umn-tomato", "fivecrop-field"]
        }),
        condition({
          id: "tomato-water-swing-leaf-curl",
          cropKey: "tomato",
          stage: "fruiting",
          category: "water",
          title: "番茄水分波动/卷叶",
          summary: "小盆、薄层根区或储液不足会造成干湿大幅波动，番茄结果期尤其敏感。",
          action: "今天改成少量多次补水；Xponge 先增加外置储液缓冲。",
          followup: { when: "48 小时", photo: "叶片和根区", success: "卷叶或边缘干缩不再扩大" },
          evidence: ["叶片卷曲", "叶缘干缩", "根区忽干忽湿"],
          differentials: ["热胁迫", "盐分过高", "虫害导致卷叶"],
          missingInfo: ["储液量", "最近补水频率", "EC"],
          photoTypes: ["leaf", "root"],
          match: {
            symptoms: ["leaf-curl", "wilting"],
            visuals: ["edge-dry"],
            stage: ["flowering", "fruiting"],
            environment: { moisture: ["dry", "swing"], sensorMoistureLow: 35 }
          },
          sourceIds: ["umn-tomato", "fivecrop-field"]
        }),
        condition({
          id: "tomato-nutrient-ph-ec-drift",
          cropKey: "tomato",
          stage: "fruiting",
          category: "nutrition",
          title: "番茄结果期 EC/pH 漂移",
          summary: "结果期营养液过浓或过淡都会表现为卷叶、黄叶、花弱或果实发育慢。",
          action: "先复测 EC/pH；只做小幅修正，24 小时后再确认。",
          followup: { when: "24-48 小时", photo: "新叶和花序", success: "新叶不再发黄或卷曲，花序保持" },
          evidence: ["新叶发黄", "卷叶", "花序弱或果实发育慢"],
          differentials: ["光照不足", "根区缺氧", "水温过高"],
          missingInfo: ["EC", "pH", "营养液更换时间"],
          photoTypes: ["leaf", "flower"],
          match: {
            symptoms: ["yellow-leaves", "leaf-curl", "no-fruit"],
            stage: ["flowering", "fruiting"],
            environment: { ecHigh: 3.2, ecLow: 1.0, phHigh: 6.8, phLow: 5.5 }
          },
          sourceIds: ["umn-tomato", "fivecrop-field"]
        }),
        condition({
          id: "tomato-root-hypoxia-algae",
          cropKey: "tomato",
          stage: "vegetative",
          category: "root",
          title: "番茄根区缺氧/藻霉",
          summary: "根区长期潮湿、见光和通风不足时，表面发绿发白，黄叶和生长停滞会跟着出现。",
          action: "给根区遮光并加强通风，48 小时内避免整片长期浸没。",
          followup: { when: "48 小时", photo: "根区表面", success: "绿藻/白毛不扩散，表面开始变干爽" },
          evidence: ["基质表面发绿", "白色绒毛", "下部黄叶"],
          differentials: ["缺肥黄叶", "虫害根损伤", "水分过干"],
          missingInfo: ["根区是否见光", "水位高度", "是否有异味"],
          photoTypes: ["root", "leaf"],
          match: {
            symptoms: ["algae", "yellow-leaves", "wilting"],
            visuals: ["green-surface", "white-fuzz"],
            environment: { moisture: ["wet"], climate: ["humid"], sensorMoistureHigh: 78 },
            visionLabels: ["surface-algae", "white-fuzz", "root-risk"]
          },
          sourceIds: ["umn-tomato", "fivecrop-field"]
        }),
        condition({
          id: "tomato-heat-stress-flower-leaf",
          cropKey: "tomato",
          stage: "flowering",
          category: "climate",
          title: "番茄灯下热胁迫",
          summary: "灯下冠层过热会导致卷叶、花粉活性下降和落花。",
          action: "先把灯距拉高 5-10cm 或开低速风扇，今天不要同时大改肥水。",
          followup: { when: "24-48 小时", photo: "顶部叶和花序", success: "新落花减少，顶部叶不再继续卷曲" },
          evidence: ["顶部叶卷曲", "花梗脱落", "灯距很近"],
          differentials: ["缺水", "EC 过高", "品种不适配"],
          missingInfo: ["冠层温度", "灯距", "风扇情况"],
          photoTypes: ["plant", "flower", "leaf"],
          match: {
            symptoms: ["leaf-curl", "no-fruit"],
            visuals: ["flower-drop"],
            stage: ["flowering", "fruiting"],
            environment: { climate: ["hot"], temperatureHigh: 30 }
          },
          sourceIds: ["umn-tomato", "fivecrop-field"]
        }),
        condition({
          id: "tomato-pest-leaf-stippling",
          cropKey: "tomato",
          stage: "vegetative",
          category: "pest",
          title: "番茄叶背害虫/红蜘蛛风险",
          summary: "斑点、细网、卷叶和小飞虫需要先隔离确认，不能只按缺素处理。",
          action: "今天先隔离这盆，补拍叶背；有细网时先用清水冲洗叶背。",
          followup: { when: "24 小时", photo: "叶背或黄粘板", success: "虫点/细网不再增加" },
          evidence: ["叶背小点", "细网", "黄粘板虫量"],
          differentials: ["缺镁斑驳", "水渍斑", "机械伤"],
          missingInfo: ["叶背特写", "是否有黄粘板", "是否与其他盆接触"],
          photoTypes: ["pest", "leaf"],
          match: {
            concern: ["pest"],
            symptoms: ["pests", "leaf-curl", "spots"],
            visuals: ["webbing", "tiny-flies"],
            visionLabels: ["possible-pest", "spots"]
          },
          sourceIds: ["umn-tomato", "fivecrop-field"]
        }),
        condition({
          id: "tomato-variety-device-mismatch",
          cropKey: "tomato",
          stage: "seedling",
          category: "fit",
          title: "番茄品种/设备不匹配",
          summary: "普通高大型番茄在桌面设备里会先占满空间，后续诊断会被高度和根量限制干扰。",
          action: "确认品种；若不是矮生番茄，先移出设备或只保留一株测试。",
          followup: { when: "7 天", photo: "整株与灯距", success: "灯距恢复，顶端不再顶灯" },
          evidence: ["株高逼近灯板", "叶片遮满设备", "迟迟不开花"],
          differentials: ["单纯弱光徒长", "氮肥偏高", "过密种植"],
          missingInfo: ["品种名", "孔位数量", "设备高度"],
          photoTypes: ["plant"],
          match: {
            symptoms: ["leggy", "no-flower"],
            visuals: ["long-internodes"],
            stage: ["seedling", "vegetative"],
            environment: { growDevice: ["office", "letpot", "idoo", "clickgrow"] }
          },
          sourceIds: ["umn-tomato", "fivecrop-field"]
        })
      ]
    },
    basil: {
      name: "罗勒",
      scope: "Genovese、Thai basil、Greek basil 等盆栽罗勒；核心是连续采收、光照和病虫害早筛。",
      conditions: [
        condition({
          id: "basil-leggy-low-light",
          cropKey: "basil",
          stage: "vegetative",
          category: "light",
          title: "罗勒弱光徒长",
          summary: "弱光和灯距过远会让节间拉长、叶片变小、香味变淡。",
          action: "把补光稳定到 12-14 小时，并从节点上方掐顶促侧枝。",
          followup: { when: "7 天", photo: "整株侧面", success: "侧枝增加，新节间变短" },
          evidence: ["节间长", "顶部追光", "下部叶稀疏"],
          differentials: ["过密抢光", "迟迟没有采收", "氮肥偏高"],
          missingInfo: ["灯距", "最近一次修剪时间", "种植密度"],
          photoTypes: ["plant", "leaf"],
          match: {
            concern: ["leggy"],
            symptoms: ["leggy", "no-flower"],
            visuals: ["long-internodes"],
            environment: { light: ["low"], lightHoursMax: 12 },
            visionLabels: ["leggy-growth"]
          },
          sourceIds: ["ncsu-basil", "fivecrop-field"]
        }),
        condition({
          id: "basil-weak-aroma-light-nitrogen-harvest",
          cropKey: "basil",
          stage: "vegetative",
          category: "harvest",
          title: "罗勒香味弱/风味不浓",
          summary: "叶子长得还行但香味弱时，照片通常不能直接判断香味；常见原因是光照不足、氮肥过多或采收太少。",
          action: "今天先增加有效光照，适度控肥，并从健康节点上方打顶或轻采收；充足阳光和连续采收会让罗勒香气更明显。",
          followup: { when: "7 天", photo: "整株侧面和采收节点", success: "新侧枝更密，主观香味评分上升，且没有继续徒长或早花" },
          evidence: ["用户主诉香味弱", "叶片基本健康但风味不浓", "光照不足", "氮肥或营养液偏高", "长期不打顶采收"],
          differentials: ["弱光徒长", "早花变苦", "品种本身香味淡", "采收后存放太久", "根区压力导致生长失衡"],
          missingInfo: ["每日有效光照小时", "最近施肥或 EC", "最近一次打顶/采收时间", "是否已经出现花苞", "品种名称"],
          photoTypes: ["plant", "leaf"],
          match: {
            concern: ["aroma"],
            symptoms: ["weak-aroma"],
            stage: ["vegetative"],
            environment: { light: ["low"], ecHigh: 2.4, lightHoursMax: 12 }
          },
          sourceIds: ["ncsu-basil", "fivecrop-field"]
        }),
        condition({
          id: "basil-bolting-flowering",
          cropKey: "basil",
          stage: "flowering",
          category: "harvest",
          title: "罗勒早花/开花变苦",
          summary: "罗勒很快开花、叶子变少或味道变差，常见原因是温度高、植株成熟、缺水或环境压力；长期不剪会让植株更快开花老化。",
          action: "今天及时摘掉花苞，并打顶采收；罗勒越剪越分枝，长期不剪反而容易开花老化。",
          followup: { when: "3-5 天", photo: "摘花和打顶后的节点", success: "剪口下方出现侧枝，新叶量回升且没有继续抽花" },
          evidence: ["顶端花苞或花穗", "叶子变少", "叶片变窄", "味道变苦或香气下降", "老枝木质化"],
          differentials: ["热/旱压力逼花", "长期不打顶采收", "光周期过长", "植株过老", "根区压力"],
          missingInfo: ["是否已有花苞", "最近是否打顶采收", "室温", "是否缺水或受热", "味道是否变苦"],
          photoTypes: ["plant", "leaf", "flower"],
          match: {
            symptoms: ["bolting", "leggy", "no-flower"],
            visuals: ["flower-buds", "sparse-leaves", "long-internodes"],
            stage: ["flowering"],
            environment: { climate: ["hot"], moisture: ["dry"] },
            visionLabels: ["flower-buds", "sparse-leaves", "flower-or-fruit"]
          },
          sourceIds: ["ncsu-basil", "fivecrop-field"]
        }),
        condition({
          id: "basil-downy-mildew-risk",
          cropKey: "basil",
          stage: "vegetative",
          category: "disease",
          title: "罗勒霜霉/湿度病害风险",
          summary: "高湿、叶面长时间潮湿和通风不足会放大罗勒叶部病害风险。",
          action: "停止喷叶，加强低速通风；补拍叶背和黄斑边界。",
          followup: { when: "48 小时", photo: "叶背特写", success: "黄斑和霉层不继续扩散" },
          evidence: ["叶面黄斑", "叶背灰紫色霉层", "植株过密"],
          differentials: ["缺氮黄叶", "日灼", "水渍伤"],
          missingInfo: ["叶背照片", "是否喷雾", "夜间湿度"],
          photoTypes: ["leaf"],
          match: {
            symptoms: ["yellow-leaves", "spots"],
            visuals: ["lower-yellowing", "white-fuzz"],
            environment: { climate: ["humid"], moisture: ["wet"] },
            visionLabels: ["spots", "white-fuzz"]
          },
          sourceIds: ["ncsu-basil", "fivecrop-field"]
        }),
        condition({
          id: "basil-leaf-powdery-gray-mold-humidity",
          cropKey: "basil",
          stage: "vegetative",
          category: "disease",
          title: "罗勒叶片白粉/灰霉高湿风险",
          summary: "叶片出现白色粉状物、灰白色霉层或灰色绒毛状霉斑时，常见原因是湿度高、通风差和叶片长期带水。",
          action: "今天先减少叶面喷水，拉开株距并加强空气流动；严重叶片剪掉，避免扩散。",
          followup: { when: "48 小时", photo: "同一片叶面和叶背特写", success: "白粉或灰霉不再扩散，新叶没有新增霉斑" },
          evidence: ["叶面白色粉状物", "灰白色霉层", "灰色绒毛状霉斑", "叶片长期带水或株间过密"],
          differentials: ["霜霉叶背灰紫色霉层", "水垢/肥渍残留", "普通黄叶", "虫害蜜露或污斑"],
          missingInfo: ["叶面近照", "叶背照片", "是否叶面喷水", "夜间湿度和通风"],
          photoTypes: ["leaf", "plant"],
          match: {
            symptoms: ["spots"],
            visuals: ["leaf-white-powder", "gray-mold"],
            environment: { climate: ["humid"], moisture: ["wet"] },
            visionLabels: ["powdery-mildew", "gray-mold", "white-fuzz", "spots"]
          },
          sourceIds: ["ncsu-basil", "fivecrop-field"]
        }),
        condition({
          id: "basil-root-zone-too-wet",
          cropKey: "basil",
          stage: "vegetative",
          category: "root",
          title: "罗勒根区过湿/缺氧",
          summary: "罗勒比迷迭香耐湿一些，但长期缺氧会让下部黄叶、萎蔫和藻霉同时出现。",
          action: "先降低水位或暂停浇水 24 小时，让根区恢复空气边界。",
          followup: { when: "48 小时", photo: "根区表面", success: "表面藻霉不扩散，下部黄叶不新增" },
          evidence: ["表面绿藻", "下部黄叶", "萎蔫但根区很湿"],
          differentials: ["缺肥", "热萎蔫", "病害"],
          missingInfo: ["根区湿度", "水位", "是否有异味"],
          photoTypes: ["root", "leaf"],
          match: {
            concern: ["root"],
            symptoms: ["algae", "yellow-leaves", "wilting"],
            visuals: ["green-surface", "white-fuzz"],
            environment: { moisture: ["wet"], sensorMoistureHigh: 78 },
            visionLabels: ["surface-algae", "root-risk"]
          },
          sourceIds: ["ncsu-basil", "fivecrop-field"]
        }),
        condition({
          id: "basil-black-leg-root-rot",
          cropKey: "basil",
          stage: "vegetative",
          category: "root",
          title: "罗勒黑脚/根腐风险",
          summary: "冷、湿和通风差叠加时，罗勒靠近根部或介质表面的茎会出现深色病斑、发黑坏死，根区也可能开始腐烂并导致整株衰退。",
          action: "今天先剪健康枝条扦插备份，原盆暂停浇水并改善排水和通风。",
          followup: { when: "24-48 小时", photo: "茎基部和根区近照", success: "黑色病斑不再上移，根区气味和软腐不加重" },
          evidence: ["茎基部发黑", "靠近介质表面的深色坏死斑", "根区潮湿或有酸臭味", "植株萎蔫衰退"],
          differentials: ["水渍伤", "低温冻伤", "机械压伤", "单纯缺水萎蔫"],
          missingInfo: ["茎基部近照", "根区气味", "最近是否积水", "夜间温度和通风"],
          photoTypes: ["root", "plant", "leaf"],
          match: {
            concern: ["root"],
            symptoms: ["wilting", "algae", "yellow-leaves"],
            visuals: ["green-surface", "white-fuzz", "lower-yellowing", "root-browning", "black-stem"],
            environment: { moisture: ["wet"], climate: ["humid", "cold"], sensorMoistureHigh: 78, temperatureLow: 18 },
            visionLabels: ["black-stem", "stem-necrosis", "root-rot", "root-risk", "surface-algae"]
          },
          sourceIds: ["purdue-basil-black-leg", "fivecrop-field"]
        }),
        condition({
          id: "basil-dry-air-wilting",
          cropKey: "basil",
          stage: "vegetative",
          category: "water",
          title: "罗勒干热萎蔫",
          summary: "强灯、小盆和干空气会让罗勒快速失水，表现为边缘干、叶片下垂。",
          action: "先补一次小水量并移离最热灯点，今天不要重剪。",
          followup: { when: "24 小时", photo: "顶部新叶", success: "叶片重新挺立，边缘干缩不扩大" },
          evidence: ["叶片下垂", "边缘干", "灯下热"],
          differentials: ["根腐导致萎蔫", "移栽缓苗", "虫害"],
          missingInfo: ["温度", "湿度", "最近浇水"],
          photoTypes: ["plant", "leaf"],
          match: {
            concern: ["dry"],
            symptoms: ["wilting", "leaf-curl"],
            visuals: ["edge-dry", "leaf-curl"],
            environment: { moisture: ["dry"], climate: ["dry", "hot"], sensorMoistureLow: 35 }
          },
          sourceIds: ["ncsu-basil", "fivecrop-field"]
        }),
        condition({
          id: "basil-transplant-shock-wilting",
          cropKey: "basil",
          stage: "vegetative",
          category: "establishment",
          title: "罗勒移栽后缓苗/萎蔫",
          summary: "刚换盆、换水培篮、换介质、分株或移苗后，罗勒根毛受损、吸水能力下降，短期叶片下垂是常见缓苗反应。",
          action: "今天先把环境稳住：避开强光和热风，保持介质微湿但不积水；不要马上施肥、重剪或反复换盆。",
          followup: { when: "24-48 小时", photo: "整株同角度和茎基部", success: "萎蔫不再扩大，新梢开始恢复挺立，茎基部没有发黑软腐" },
          evidence: ["刚移栽/换盆/分株", "整株或新梢下垂", "叶片软塌但无明显虫咬或病斑", "根区刚被扰动"],
          differentials: ["干热萎蔫", "根区过湿/缺氧", "黑脚/根腐", "低温伤根"],
          missingInfo: ["移栽日期", "是否修根或分株", "移栽后是否暴晒", "介质是否积水", "茎基部是否发黑"],
          photoTypes: ["plant", "root", "leaf"],
          match: {
            concern: ["dry", "root"],
            symptoms: ["transplant-shock", "wilting"],
            visuals: ["fresh-transplant", "lower-yellowing"],
            environment: { moisture: ["wet", "dry", "swing"], climate: ["hot", "cold"] },
            visionLabels: ["recent-transplant", "wilting"]
          },
          sourceIds: ["ncsu-basil", "fivecrop-field"]
        }),
        condition({
          id: "basil-pest-leaf-distortion",
          cropKey: "basil",
          stage: "vegetative",
          category: "pest",
          title: "罗勒嫩梢虫害",
          summary: "嫩梢卷曲、斑点和小飞虫需要先拍叶背，避免误判成单纯缺肥。",
          action: "隔离这盆并补拍叶背；用黄粘板确认是否有小飞虫。",
          followup: { when: "24 小时", photo: "叶背/黄粘板", success: "新虫量下降，嫩梢不再卷曲" },
          evidence: ["嫩梢卷曲", "叶背小点", "黄粘板虫量"],
          differentials: ["低湿卷叶", "药害", "缺钙"],
          missingInfo: ["叶背特写", "黄粘板", "是否和其他植物靠近"],
          photoTypes: ["pest", "leaf"],
          match: {
            concern: ["pest"],
            symptoms: ["pests", "leaf-curl", "spots"],
            visuals: ["tiny-flies", "webbing", "sticky-residue"],
            visionLabels: ["possible-pest", "spots"]
          },
          sourceIds: ["ncsu-basil", "fivecrop-field"]
        }),
        condition({
          id: "basil-chewing-pest-leaf-holes",
          cropKey: "basil",
          stage: "vegetative",
          category: "pest",
          title: "罗勒咀嚼性虫害/叶片孔洞",
          summary: "叶片出现不规则孔洞、叶缘被啃缺或嫩叶被取食时，优先排查蛞蝓、毛虫、甲虫等咀嚼性虫害，而不是只按缺肥或病斑处理。",
          action: "今天先隔离这盆，补拍叶片正反面、叶缘、茎节和盆土表面；手动摘除可见虫体并清理潮湿残渣。",
          followup: { when: "24 小时", photo: "同一片受损叶、新叶和盆土表面", success: "没有新增孔洞，新叶不再被啃食" },
          evidence: ["不规则叶片孔洞", "叶缘被啃缺", "嫩叶或新叶被取食", "叶背/茎节/盆土表面有虫体或粪粒"],
          differentials: ["机械破损", "日灼焦斑", "霜霉黄斑", "药害斑"],
          missingInfo: ["叶片正反面", "叶缘近照", "茎节和盆土表面", "夜间是否看到虫体"],
          photoTypes: ["pest", "leaf", "plant"],
          match: {
            concern: ["pest"],
            symptoms: ["pests", "spots"],
            visuals: ["leaf-holes", "chewed-edge"],
            visionLabels: ["leaf-holes", "chewing-damage", "possible-pest"]
          },
          sourceIds: ["ncsu-basil", "fivecrop-field"]
        }),
        condition({
          id: "basil-harvest-density",
          cropKey: "basil",
          stage: "vegetative",
          category: "harvest",
          title: "罗勒过密/采收节奏失衡",
          summary: "多株挤在小设备里会互相遮光，顶部旺长但下部空。",
          action: "今天分盆或疏掉弱株，只保留 2-3 株做连续采收。",
          followup: { when: "7 天", photo: "整株俯视", success: "下部通风变好，侧枝更均匀" },
          evidence: ["株间互相遮光", "下部叶少", "顶部拥挤"],
          differentials: ["单纯弱光", "未掐顶", "品种叶型差异"],
          missingInfo: ["株数", "孔位", "是否掐顶"],
          photoTypes: ["plant"],
          match: {
            symptoms: ["leggy"],
            visuals: ["long-internodes"],
            environment: { growDevice: ["letpot", "idoo", "aerogarden", "office"] }
          },
          sourceIds: ["ncsu-basil", "fivecrop-field"]
        }),
        condition({
          id: "basil-yellow-nutrient-or-light",
          cropKey: "basil",
          stage: "vegetative",
          category: "nutrition",
          title: "罗勒叶色变淡",
          summary: "罗勒叶色变淡常由光照不足、营养不足或根区压力叠加引起，需要用新叶/老叶位置区分。",
          action: "先拍新叶和老叶对比；不要同时加肥和大幅调灯。",
          followup: { when: "3 天", photo: "同一片新叶和老叶", success: "新叶颜色更稳定，无新增下部黄叶" },
          evidence: ["新叶偏淡", "下部黄叶", "叶片变小"],
          differentials: ["霜霉黄斑", "过湿缺氧", "弱光徒长"],
          missingInfo: ["新叶还是老叶先黄", "EC", "光照小时"],
          photoTypes: ["leaf"],
          match: {
            concern: ["yellow"],
            symptoms: ["yellow-leaves"],
            visuals: ["pale-new-growth", "lower-yellowing"],
            environment: { light: ["low"], ecLow: 1.0 }
          },
          sourceIds: ["ncsu-basil", "fivecrop-field"]
        })
      ]
    },
    rosemary: {
      name: "迷迭香",
      scope: "小苗、扦插苗和小盆迷迭香；重点识别过湿闷根、冷湿、弱光徒长、香味变淡、白粉和叶螨/吸汁虫。",
      conditions: [
        condition({
          id: "rosemary-wet-root-decline",
          cropKey: "rosemary",
          stage: "vegetative",
          category: "root",
          title: "迷迭香过湿衰弱",
          summary: "迷迭香长期潮湿时会灰黄、叶尖发黑或整株萎蔫；如果土是湿的却蔫，优先怀疑根系缺氧、根腐或根颈腐，而不是继续浇水。",
          action: "立即停水 48 小时，检查排水孔、托盘积水、根颈颜色和气味；根黑软或有臭味时换透气介质，并剪健康枝条扦插备份。",
          followup: { when: "48 小时", photo: "土表、根颈/茎基部和枝梢", success: "土表开始变干，根颈不继续发黑，异味或软腐没有扩大" },
          evidence: ["湿土萎蔫", "老叶发黄或叶尖发黑", "根颈发暗或有异味", "托盘或套盆积水"],
          differentials: ["真实缺水", "室内干空气叶尖焦枯", "弱光徒长", "冷湿越冬压力", "刚移栽短期缓苗"],
          missingInfo: ["盆是否变轻", "表层约 3cm 是否已干", "根颈近照", "容器排水孔", "是否有套盆积水"],
          photoTypes: ["root", "plant"],
          match: {
            concern: ["root"],
            symptoms: ["wilting", "yellow-leaves", "algae"],
            visuals: ["white-fuzz", "green-surface"],
            environment: { moisture: ["wet"], climate: ["humid"], sensorMoistureHigh: 75 },
            visionLabels: ["root-risk", "white-fuzz"]
          },
          sourceIds: ["ncsu-rosemary", "rosemary-lifecycle-research", "fivecrop-field"]
        }),
        condition({
          id: "rosemary-low-light-indoors",
          cropKey: "rosemary",
          stage: "vegetative",
          category: "light",
          title: "迷迭香室内弱光",
          summary: "迷迭香弱光下会新枝拉长、叶子稀、底部光秃、香味变淡；光照不足通常比轻度缺水更影响生物量和单株香气表现。",
          action: "把光照提高到最亮位置或稳定强补光，室内成株可从约 12 小时强补光、小苗 14-16 小时补光开始；恢复后只轻剪有叶新梢。",
          followup: { when: "7 天", photo: "整株侧面和枝梢", success: "新梢更直立紧凑，新增枝条不继续拉长，香味评分回升" },
          evidence: ["新梢细长稀疏", "底部光秃或向窗倾斜", "香味变淡", "长期未轻剪"],
          differentials: ["过湿根损伤", "施肥过多导致嫩水枝", "温度过低", "老枝自然木质化", "开花后正常枝条成熟"],
          missingInfo: ["直射光/补光小时", "灯距", "风扇情况", "最近是否修剪或采收", "是否刚从室内转到户外"],
          photoTypes: ["plant"],
          match: {
            concern: ["leggy", "aroma"],
            symptoms: ["leggy", "weak-aroma"],
            visuals: ["long-internodes"],
            environment: { light: ["low"], lightHoursMax: 12 }
          },
          sourceIds: ["ncsu-rosemary", "rosemary-lifecycle-research", "fivecrop-field"]
        }),
        condition({
          id: "rosemary-pot-drainage-mismatch",
          cropKey: "rosemary",
          stage: "vegetative",
          category: "fit",
          title: "迷迭香介质/容器不适配",
          summary: "黏重保水介质、无排水孔、过大湿盆或套盆积水会让迷迭香长期缺氧，是黄叶、黑尖和根腐的常见底层原因。",
          action: "改用有排水孔的独立容器和高排水介质，可从约 3 份稳定基质加 1 份珍珠岩/粗砂/火山石起步；换盆时不要把根颈埋深。",
          followup: { when: "7 天", photo: "盆口、排水孔和整株", success: "表层能按周期变干，新梢不继续萎软，根颈保持干爽不发黑" },
          evidence: ["无排水孔或套盆积水", "黏重保水介质", "表层一直湿亮", "小根团种进过大湿盆"],
          differentials: ["刚移栽缓苗", "低温慢生长", "真实干旱后介质拒水"],
          missingInfo: ["是否有排水孔", "介质类型和颗粒比例", "是否混种", "根颈是否埋深", "托盘是否积水", "盆是否远大于根团"],
          photoTypes: ["root", "plant"],
          match: {
            symptoms: ["wilting", "yellow-leaves"],
            environment: { medium: ["water", "xponge"], moisture: ["wet"], growDevice: ["letpot", "idoo", "aerogarden"] }
          },
          sourceIds: ["ncsu-rosemary", "rosemary-lifecycle-research", "fivecrop-field"]
        }),
        condition({
          id: "rosemary-powdery-mildew-humidity",
          cropKey: "rosemary",
          stage: "vegetative",
          category: "disease",
          title: "迷迭香高湿白粉/霉斑风险",
          summary: "迷迭香叶背本来可呈均匀灰白绒毛；真正白粉多是不规则、会扩大的粉斑，灰霉则常见于褐色水渍软烂后出现灰色绒毛。",
          action: "先区分正常叶背、白粉和灰霉；停止叶面喷水，剪除重病或软烂组织，清理落叶并加强日照、间距和空气流动。",
          followup: { when: "48 小时", photo: "白斑叶片", success: "白斑不扩散，新叶保持干爽" },
          evidence: ["不规则白粉或灰色绒毛", "枝条过密闷湿", "叶片长期带水", "组织先软烂或褐色水渍"],
          differentials: ["正常灰白叶背", "水垢", "灰尘", "药斑", "叶螨造成的灰白失绿"],
          missingInfo: ["白斑是否扩大", "是否只是均匀叶背白", "湿度", "是否喷雾", "枝条内侧是否通风"],
          photoTypes: ["leaf"],
          match: {
            symptoms: ["spots"],
            visuals: ["white-fuzz", "leaf-white-powder", "gray-mold"],
            environment: { climate: ["humid"], moisture: ["wet"] },
            visionLabels: ["spots", "white-fuzz"]
          },
          sourceIds: ["ncsu-rosemary", "rosemary-lifecycle-research", "fivecrop-field"]
        }),
        condition({
          id: "rosemary-dry-edge-underwatering",
          cropKey: "rosemary",
          stage: "vegetative",
          category: "water",
          title: "迷迭香过干/根团脱水",
          summary: "迷迭香耐旱不等于应反复严重干旱；室内干空气、根团干透或介质拒水都可能造成叶尖发褐、枝梢回枯。",
          action: "先确认盆重、表层约 3cm 和下层湿度；盆很轻且介质干透时浇透根团，严重干缩介质可分两次浇，避免水直接沿盆边流走。",
          followup: { when: "24-48 小时", photo: "枝梢和盆口", success: "枝梢不再继续干枯" },
          evidence: ["叶尖 brown 或干脆", "盆明显变轻", "基质离盆边或水难渗入", "浇透后数小时内挺度改善"],
          differentials: ["过湿后根损伤", "盐分过高", "低湿热风", "冷窗弱光造成的 die-back", "叶螨失绿误判为干尖"],
          missingInfo: ["盆重", "表层 3cm 和下层湿度", "最近浇透时间", "浇水是否直接漏走", "是否靠近暖风或冷窗"],
          photoTypes: ["plant", "root"],
          match: {
            concern: ["dry"],
            symptoms: ["wilting"],
            visuals: ["edge-dry"],
            environment: { moisture: ["dry"], climate: ["dry"], sensorMoistureLow: 35 }
          },
          sourceIds: ["ncsu-rosemary", "rosemary-lifecycle-research", "fivecrop-field"]
        }),
        condition({
          id: "rosemary-transplant-shock",
          cropKey: "rosemary",
          stage: "seedling",
          category: "establishment",
          title: "迷迭香移栽缓苗",
          summary: "移栽后萎蔫常来自根系受损、未炼苗、换盆后立刻暴晒、介质太湿或根颈埋太深；很小的苗不宜直接进远大湿盆。",
          action: "固定位置和浇水节奏，放明亮散射光与通风处；检查根颈不要埋深，先缓苗 48-72 小时，7 天内不要连续换盆、换灯、重肥或重剪。",
          followup: { when: "48-72 小时", photo: "整株、土表和根颈", success: "根颈不发黑，土表开始变干，新梢不再扩大萎蔫" },
          evidence: ["刚购买/刚移栽", "整株轻微萎蔫", "根颈可能埋深或根系受扰动", "移栽前后光照突变"],
          differentials: ["根腐", "严重缺水", "低温伤害", "换盆后暴晒", "猝倒病"],
          missingInfo: ["购买/移栽日期", "根团状态", "是否修根", "是否炼苗", "根颈深度", "换盆后是否暴晒"],
          photoTypes: ["plant", "root"],
          match: {
            symptoms: ["wilting"],
            stage: ["seedling", "vegetative"],
            environment: { moisture: ["swing"] }
          },
          sourceIds: ["ncsu-rosemary", "rosemary-lifecycle-research", "fivecrop-field"]
        }),
        condition({
          id: "rosemary-pest-needle-speckling",
          cropKey: "rosemary",
          stage: "vegetative",
          category: "pest",
          title: "迷迭香针叶斑点/害虫",
          summary: "叶片细小黄白点、发灰和细网常见于叶螨；嫩梢发黏多见吸汁害虫；银白擦伤、褐斑和黑点要怀疑蓟马，白色泡沫多为沫蝉。",
          action: "先隔离，补拍枝条内侧、叶背、嫩梢和白纸拍打检查；可先冲洗/擦除可见害虫，剪除重灾嫩梢，不要把喷叶保湿当作主要处理。",
          followup: { when: "24-48 小时", photo: "同一枝条内侧和叶背", success: "移动小点、细网或黏性分泌物减少" },
          evidence: ["针叶黄白点或发灰", "细网", "嫩梢发黏或小虫聚集", "银白擦伤和黑色小点"],
          differentials: ["白粉", "正常灰白叶背", "水垢", "老叶自然脱落", "干空气叶尖焦枯"],
          missingInfo: ["放大近照", "是否有细网", "是否靠近其他盆", "叶背或嫩梢是否发黏", "白纸拍打是否有细长小虫"],
          photoTypes: ["pest", "leaf"],
          match: {
            concern: ["pest"],
            symptoms: ["pests", "spots"],
            visuals: ["webbing", "tiny-flies", "sticky-residue"],
            visionLabels: ["possible-pest", "spots"]
          },
          sourceIds: ["ncsu-rosemary", "rosemary-lifecycle-research", "fivecrop-field"]
        }),
        condition({
          id: "rosemary-cold-window-stress",
          cropKey: "rosemary",
          stage: "vegetative",
          category: "climate",
          title: "迷迭香冷窗/温差压力",
          summary: "冬季突然衰弱、枝条发黑或干枯，常与冷窗、冷风和湿土叠加有关；入室后低光、暖气干燥和叶螨也会放大问题。",
          action: "把盆移离冷玻璃和冷风，保持最亮偏凉位置但减少浇水；入室前后检查叶背虫害，清枯枝，不要在入室前大幅重剪或换超大盆。",
          followup: { when: "7 天", photo: "整株侧面和土表", success: "枝条不继续发黑或干枯，土表能正常变干" },
          evidence: ["靠冷窗或冷风口", "夜间低温", "湿土叠加枝条发黑/干枯", "入室后叶背虫害或细网"],
          differentials: ["弱光", "根区过湿", "移栽缓苗", "室内干空气 die-back", "叶螨加重"],
          missingInfo: ["夜间温度", "离窗距离", "是否有冷风", "低温时土是否长期湿", "入室前是否检查叶背和清枯枝"],
          photoTypes: ["plant"],
          match: {
            symptoms: ["wilting"],
            environment: { climate: ["cold"], temperatureLow: 16, light: ["low"] }
          },
          sourceIds: ["ncsu-rosemary", "rosemary-lifecycle-research", "fivecrop-field"]
        })
      ]
    },
    strawberry: {
      name: "草莓",
      scope: "日中性/四季草莓和紧凑盆栽草莓；重点是授粉、冠部湿度、果形和叶部病虫害。",
      conditions: [
        condition({
          id: "strawberry-flower-no-fruit",
          cropKey: "strawberry",
          stage: "flowering",
          category: "pollination",
          title: "草莓授粉不足/花后不坐果",
          summary: "室内缺少风和昆虫，草莓自花能力不等于稳定坐果。",
          action: "今天中午用软刷轻刷花心，每朵开放花都刷一次。",
          followup: { when: "3-5 天", photo: "同一花序", success: "花托开始膨大，小果保留" },
          evidence: ["开放花多但无小果", "花托不膨大", "湿度或光照不稳定"],
          differentials: ["植株未建立", "温度不合适", "营养不足"],
          missingInfo: ["开花天数", "是否授粉", "花心特写"],
          photoTypes: ["flower"],
          match: {
            concern: ["fruit"],
            symptoms: ["no-fruit"],
            visuals: ["flower-drop"],
            stage: ["flowering"],
            environment: { light: ["low"], climate: ["humid"] },
            visionLabels: ["flower-or-fruit"]
          },
          sourceIds: ["umn-strawberry", "fivecrop-field"]
        }),
        condition({
          id: "strawberry-deformed-fruit-pollination",
          cropKey: "strawberry",
          stage: "fruiting",
          category: "pollination",
          title: "草莓畸形果",
          summary: "果形局部不膨大常和授粉不完整、蓟马等虫害或花期湿度异常有关。",
          action: "下一批花逐花授粉，并补拍畸形果种子分布和叶背。",
          followup: { when: "7 天", photo: "新一批果实", success: "新果更对称，畸形比例下降" },
          evidence: ["果实一侧凹陷", "种子分布不均", "叶片有斑点或虫迹"],
          differentials: ["品种特性", "钙/硼营养问题", "低温花伤"],
          missingInfo: ["果实近照", "叶背虫害", "花期温湿度"],
          photoTypes: ["flower", "pest", "leaf"],
          match: {
            concern: ["fruit", "pest"],
            symptoms: ["no-fruit", "pests", "spots"],
            stage: ["fruiting"],
            visionLabels: ["flower-or-fruit", "possible-pest", "spots"]
          },
          sourceIds: ["umn-strawberry", "fivecrop-field"]
        }),
        condition({
          id: "strawberry-crown-wet-rot-risk",
          cropKey: "strawberry",
          stage: "vegetative",
          category: "crown",
          title: "草莓冠部潮湿/烂心风险",
          summary: "草莓冠部长期被水覆盖或通风差，会放大烂心和霉斑风险。",
          action: "露出冠部，停止喷淋式浇水，保留通风但给表面遮光。",
          followup: { when: "48 小时", photo: "冠部近照", success: "冠部变干爽，白毛或软腐不扩散" },
          evidence: ["冠部积水", "叶柄基部发软", "白毛或绿藻"],
          differentials: ["移栽过深", "根区过湿", "叶斑病"],
          missingInfo: ["冠部是否埋住", "浇水方式", "根区气味"],
          photoTypes: ["root", "plant"],
          match: {
            concern: ["root"],
            symptoms: ["algae", "wilting", "yellow-leaves"],
            visuals: ["white-fuzz", "green-surface"],
            environment: { moisture: ["wet"], climate: ["humid"] },
            visionLabels: ["root-risk", "white-fuzz", "surface-algae"]
          },
          sourceIds: ["umn-strawberry", "fivecrop-field"]
        }),
        condition({
          id: "strawberry-leaf-spot",
          cropKey: "strawberry",
          stage: "vegetative",
          category: "disease",
          title: "草莓叶斑",
          summary: "叶斑需要用叶面和叶背照片确认，避免和虫害、营养斑混淆。",
          action: "剪掉最严重老叶，补拍叶背；今天避免叶面长期潮湿。",
          followup: { when: "3-5 天", photo: "同一叶片区域", success: "新斑点不再增加" },
          evidence: ["圆形斑点", "老叶更多", "高湿后加重"],
          differentials: ["虫咬斑", "药害", "营养缺素"],
          missingInfo: ["叶背照片", "是否喷叶", "斑点是否扩大"],
          photoTypes: ["leaf"],
          match: {
            symptoms: ["spots", "yellow-leaves"],
            visuals: ["lower-yellowing"],
            environment: { climate: ["humid"] },
            visionLabels: ["spots"]
          },
          sourceIds: ["umn-strawberry", "fivecrop-field"]
        }),
        condition({
          id: "strawberry-runner-energy-drain",
          cropKey: "strawberry",
          stage: "vegetative",
          category: "growth",
          title: "草莓匍匐茎消耗",
          summary: "室内小盆如果保留太多匍匐茎，会抢走开花和坐果资源。",
          action: "如果目标是结果，今天剪掉多余匍匐茎，只保留母株。",
          followup: { when: "7 天", photo: "整株俯视", success: "新叶和花序更集中" },
          evidence: ["匍匐茎多", "花序少", "盆内空间拥挤"],
          differentials: ["光照不足", "品种未到花期", "氮肥偏高"],
          missingInfo: ["是否保留子株", "株龄", "日照/补光"],
          photoTypes: ["plant"],
          match: {
            symptoms: ["no-fruit", "no-flower"],
            stage: ["vegetative", "flowering"],
            environment: { light: ["low"] }
          },
          sourceIds: ["umn-strawberry", "fivecrop-field"]
        }),
        condition({
          id: "strawberry-low-light-fruiting",
          cropKey: "strawberry",
          stage: "flowering",
          category: "light",
          title: "草莓弱光坐果弱",
          summary: "草莓开花结果需要稳定光照；弱光会让花弱、果小、成熟慢。",
          action: "把补光稳定到 12-14 小时，先不要加大水肥。",
          followup: { when: "7 天", photo: "花和小果", success: "新花更挺，小果继续膨大" },
          evidence: ["花弱", "小果慢", "叶柄拉长"],
          differentials: ["授粉不足", "根区过湿", "植株太小"],
          missingInfo: ["光照小时", "花序数量", "株龄"],
          photoTypes: ["plant", "flower"],
          match: {
            concern: ["fruit"],
            symptoms: ["no-fruit", "leggy"],
            visuals: ["long-internodes"],
            environment: { light: ["low"], lightHoursMax: 12 }
          },
          sourceIds: ["umn-strawberry", "fivecrop-field"]
        }),
        condition({
          id: "strawberry-pest-thrips-mites",
          cropKey: "strawberry",
          stage: "flowering",
          category: "pest",
          title: "草莓蓟马/叶螨风险",
          summary: "花心、畸形果和叶背小点需要一起看，单拍果实容易误判。",
          action: "补拍花心和叶背，先隔离并挂黄/蓝粘板观察。",
          followup: { when: "24-48 小时", photo: "花心和叶背", success: "虫量不增加，花心损伤减少" },
          evidence: ["花心褐化", "果形畸形", "叶背小点"],
          differentials: ["授粉不足", "高湿花伤", "营养问题"],
          missingInfo: ["花心放大图", "叶背图", "粘板虫量"],
          photoTypes: ["flower", "pest", "leaf"],
          match: {
            concern: ["pest", "fruit"],
            symptoms: ["pests", "spots", "no-fruit"],
            visuals: ["tiny-flies", "flower-drop"],
            visionLabels: ["possible-pest", "spots"]
          },
          sourceIds: ["umn-strawberry", "fivecrop-field"]
        }),
        condition({
          id: "strawberry-nutrition-fruit-quality",
          cropKey: "strawberry",
          stage: "fruiting",
          category: "nutrition",
          title: "草莓结果期营养不稳",
          summary: "结果期钾钙和根区稳定性会影响果实膨大、硬度和叶片状态。",
          action: "先复测 EC/pH，稳定营养液，不要一次猛加肥。",
          followup: { when: "3-5 天", photo: "果实和新叶", success: "小果继续膨大，新叶不焦边" },
          evidence: ["果实小", "新叶焦边", "成熟慢"],
          differentials: ["授粉不足", "弱光", "根区过湿"],
          missingInfo: ["EC", "pH", "营养液配方"],
          photoTypes: ["flower", "leaf", "root"],
          match: {
            symptoms: ["no-fruit", "yellow-leaves"],
            stage: ["fruiting"],
            environment: { ecHigh: 2.8, ecLow: 1.0, phHigh: 6.8, phLow: 5.5 }
          },
          sourceIds: ["umn-strawberry", "fivecrop-field"]
        })
      ]
    },
    pepper: {
      name: "辣椒",
      scope: "矮生辣椒、观赏辣椒和小型甜椒；不覆盖大型露地品种。",
      conditions: [
        condition({
          id: "pepper-flower-drop",
          cropKey: "pepper",
          stage: "flowering",
          category: "flowering",
          title: "辣椒落花/不坐果",
          summary: "辣椒落花常由温度窗口、弱光、水分波动或授粉不足触发。",
          action: "今天先稳定温度和水分，中午轻摇植株辅助授粉。",
          followup: { when: "5-7 天", photo: "花序和新小椒", success: "花柄保留，小椒开始膨大" },
          evidence: ["花柄脱落", "不开完全就掉", "卷叶或徒长"],
          differentials: ["氮肥偏高", "品种过大", "根区波动"],
          missingInfo: ["温度", "补光小时", "是否已授粉"],
          photoTypes: ["flower", "plant"],
          match: {
            concern: ["fruit"],
            symptoms: ["no-fruit", "leggy", "leaf-curl"],
            visuals: ["flower-drop", "long-internodes"],
            stage: ["flowering"],
            environment: { light: ["low"], climate: ["hot"], temperatureHigh: 32, temperatureLow: 18, moisture: ["swing"] },
            visionLabels: ["flower-drop", "flower-or-fruit"]
          },
          sourceIds: ["umn-pepper", "fivecrop-field"]
        }),
        condition({
          id: "pepper-low-light-vegetative",
          cropKey: "pepper",
          stage: "vegetative",
          category: "light",
          title: "辣椒弱光只长叶",
          summary: "室内光量不足会让辣椒徒长、不开花或花弱。",
          action: "把补光提高到 14-16 小时，并减少同机混种遮光。",
          followup: { when: "7 天", photo: "整株与灯距", success: "新节间变短，花芽更稳定" },
          evidence: ["株形拉长", "不开花", "下层被遮光"],
          differentials: ["氮肥偏高", "品种过高", "温度过低"],
          missingInfo: ["灯距", "光照小时", "品种名"],
          photoTypes: ["plant"],
          match: {
            concern: ["leggy", "fruit"],
            symptoms: ["leggy", "no-flower", "no-fruit"],
            visuals: ["long-internodes"],
            environment: { light: ["low"], lightHoursMax: 13 }
          },
          sourceIds: ["umn-pepper", "fivecrop-field"]
        }),
        condition({
          id: "pepper-heat-cold-stress",
          cropKey: "pepper",
          stage: "flowering",
          category: "climate",
          title: "辣椒温度胁迫",
          summary: "辣椒坐果对温度窗口敏感，灯下过热或夜间偏冷都会增加落花。",
          action: "优先把冠层温度拉回 22-30C，今天只调灯距或风扇。",
          followup: { when: "3-5 天", photo: "花序", success: "新落花减少，花柄保留" },
          evidence: ["落花", "叶片卷曲", "灯下热或夜间冷"],
          differentials: ["水分波动", "授粉不足", "弱光"],
          missingInfo: ["白天/夜间温度", "灯距", "风扇"],
          photoTypes: ["flower", "leaf"],
          match: {
            symptoms: ["leaf-curl", "no-fruit"],
            visuals: ["flower-drop"],
            stage: ["flowering"],
            environment: { climate: ["hot", "cold"], temperatureHigh: 32, temperatureLow: 18 }
          },
          sourceIds: ["umn-pepper", "fivecrop-field"]
        }),
        condition({
          id: "pepper-water-swing-curl",
          cropKey: "pepper",
          stage: "flowering",
          category: "water",
          title: "辣椒水分波动卷叶",
          summary: "辣椒小盆结果期遇到干湿波动，常伴随卷叶、落花和果实发育慢。",
          action: "改成小幅稳定补水，避免一次干透再猛补。",
          followup: { when: "48 小时", photo: "叶片和花序", success: "卷叶不加重，花序保留" },
          evidence: ["叶片上卷", "边缘干", "花柄脱落"],
          differentials: ["热胁迫", "虫害", "盐分过高"],
          missingInfo: ["补水频率", "储液量", "EC"],
          photoTypes: ["leaf", "flower", "root"],
          match: {
            symptoms: ["leaf-curl", "wilting", "no-fruit"],
            visuals: ["edge-dry", "flower-drop"],
            environment: { moisture: ["dry", "swing"], sensorMoistureLow: 35 }
          },
          sourceIds: ["umn-pepper", "fivecrop-field"]
        }),
        condition({
          id: "pepper-variety-device-mismatch",
          cropKey: "pepper",
          stage: "seedling",
          category: "fit",
          title: "辣椒品种/设备不匹配",
          summary: "大型辣椒品种在桌面设备里常先出现高度和遮光问题，后续很难稳定坐果。",
          action: "确认品种；若不是矮生/小型品种，先移出设备或只保留一株。",
          followup: { when: "7 天", photo: "整株与设备", success: "灯距和通风恢复" },
          evidence: ["株高接近灯板", "叶片遮满设备", "迟迟不开花"],
          differentials: ["弱光徒长", "氮肥偏高", "过密"],
          missingInfo: ["品种名", "设备高度", "株数"],
          photoTypes: ["plant"],
          match: {
            symptoms: ["leggy", "no-flower"],
            visuals: ["long-internodes"],
            stage: ["seedling", "vegetative"],
            environment: { growDevice: ["office", "letpot", "idoo", "clickgrow"] }
          },
          sourceIds: ["umn-pepper", "fivecrop-field"]
        }),
        condition({
          id: "pepper-pest-distortion",
          cropKey: "pepper",
          stage: "vegetative",
          category: "pest",
          title: "辣椒嫩叶虫害/叶螨",
          summary: "嫩叶扭曲、斑点和细网需要叶背照片，不能直接当作缺素。",
          action: "隔离植株，补拍叶背和嫩梢，先用清水冲洗叶背。",
          followup: { when: "24-48 小时", photo: "叶背", success: "虫点/细网减少，新叶不继续扭曲" },
          evidence: ["嫩叶扭曲", "细网", "叶背小点"],
          differentials: ["热卷叶", "药害", "缺钙"],
          missingInfo: ["叶背特写", "黄粘板", "是否靠近其他植物"],
          photoTypes: ["pest", "leaf"],
          match: {
            concern: ["pest"],
            symptoms: ["pests", "leaf-curl", "spots"],
            visuals: ["webbing", "tiny-flies"],
            visionLabels: ["possible-pest", "spots"]
          },
          sourceIds: ["umn-pepper", "fivecrop-field"]
        }),
        condition({
          id: "pepper-nutrient-fruiting",
          cropKey: "pepper",
          stage: "fruiting",
          category: "nutrition",
          title: "辣椒结果期营养不稳",
          summary: "结果期 EC/pH 或钾钙供应不稳，会让花弱、果小、叶片卷曲或焦边。",
          action: "先复测 EC/pH，逐步修正，不要一次猛加营养液。",
          followup: { when: "3-5 天", photo: "新叶和小椒", success: "小椒继续膨大，新叶不焦边" },
          evidence: ["小椒膨大慢", "新叶焦边", "卷叶"],
          differentials: ["弱光", "热胁迫", "水分波动"],
          missingInfo: ["EC", "pH", "营养液更换时间"],
          photoTypes: ["leaf", "flower"],
          match: {
            symptoms: ["leaf-curl", "no-fruit", "yellow-leaves"],
            stage: ["fruiting"],
            environment: { ecHigh: 3.2, ecLow: 1.0, phHigh: 6.8, phLow: 5.5 }
          },
          sourceIds: ["umn-pepper", "fivecrop-field"]
        }),
        condition({
          id: "pepper-root-algae-hypoxia",
          cropKey: "pepper",
          stage: "vegetative",
          category: "root",
          title: "辣椒根区藻霉/缺氧",
          summary: "根区长期湿、见光和低通风会让辣椒黄叶、停长并放大落花风险。",
          action: "给根区遮光并提高通风，48 小时内不要让整片介质长期浸没。",
          followup: { when: "48 小时", photo: "根区表面", success: "绿藻/白毛不扩散，叶片不继续下垂" },
          evidence: ["绿藻", "白毛", "黄叶或萎蔫"],
          differentials: ["缺肥", "根量不足", "水分过干"],
          missingInfo: ["根区是否见光", "水位", "气味"],
          photoTypes: ["root", "leaf"],
          match: {
            concern: ["root"],
            symptoms: ["algae", "yellow-leaves", "wilting"],
            visuals: ["green-surface", "white-fuzz"],
            environment: { moisture: ["wet"], climate: ["humid"], sensorMoistureHigh: 78 },
            visionLabels: ["surface-algae", "white-fuzz", "root-risk"]
          },
          sourceIds: ["umn-pepper", "fivecrop-field"]
        })
      ]
    }
  }
};

const categoryProtocols = {
  flowering: {
    dose: "One intervention per day: hand-pollinate or stabilize environment, then wait for the next flower check.",
    targets: ["Keep canopy temperature in the crop-safe flowering band.", "Keep light steady for the full photoperiod."],
    doNot: ["Do not add fertilizer as the first response to flower drop.", "Do not change light, water, and nutrients on the same day."],
    escalation: "Escalate if two new flower clusters fail after the follow-up window."
  },
  pollination: {
    dose: "Pollinate each open flower once around midday for 3 consecutive days.",
    targets: ["Flowers should stay dry and visibly open.", "Air movement should be gentle, not drying."],
    doNot: ["Do not mist flowers before pollination.", "Do not remove flowers unless they are already brown or rotting."],
    escalation: "Escalate if flowers stay open but fruit does not start swelling after 5-7 days."
  },
  light: {
    dose: "Increase usable light in one step, then hold it steady for 7 days.",
    targets: ["Leaf crops: 12-14 h/day.", "Fruiting crops: 14-16 h/day.", "Keep the plant close enough for compact growth without heat stress."],
    doNot: ["Do not compensate low light with extra nutrients.", "Do not prune heavily on the same day as a major light change."],
    escalation: "Escalate if new growth remains stretched after 7 days of stable light."
  },
  water: {
    dose: "Adjust water once, then observe for 24-48 hours before the next change.",
    targets: ["Root zone should move toward evenly moist, not wet.", "Leaves should stop worsening before expecting full recovery."],
    doNot: ["Do not alternate drought and soaking.", "Do not fertilize a plant that is wilting from root stress."],
    escalation: "Escalate if wilting worsens while the root zone is still wet."
  },
  root: {
    dose: "Pause watering or lower reservoir contact first; increase airflow around the root zone.",
    targets: ["Surface should begin drying within 24-48 hours.", "No spreading white fuzz, odor, or soft crown tissue."],
    doNot: ["Do not seal the crown or root surface under wet media.", "Do not add more nutrient solution before oxygen stress is ruled out."],
    escalation: "Escalate if roots smell sour, crown tissue softens, or shoots blacken."
  },
  disease: {
    dose: "Remove the worst affected leaf only if it is clearly spreading; improve airflow and keep leaves dry.",
    targets: ["No new spots or mildew expansion over the follow-up window.", "Leaf surfaces dry before night."],
    doNot: ["Do not spray oils or soaps under strong grow lights.", "Do not crowd plants together after spotting disease signs."],
    escalation: "Escalate if lesions expand across new leaves or mold reaches crown/stems."
  },
  pest: {
    dose: "Inspect leaf backs and isolate the plant; use sticky trap or gentle wash before stronger treatment.",
    targets: ["New pest count should stop increasing within 24-48 hours.", "New leaves should emerge less distorted."],
    doNot: ["Do not spray unknown chemicals on edible leaves.", "Do not treat without checking leaf backs or traps."],
    escalation: "Escalate if moving pests or webbing remain after two inspection cycles."
  },
  nutrition: {
    dose: "Correct pH/EC gradually; change one nutrient variable, then recheck in 48-72 hours.",
    targets: ["Hydroponic pH usually stays near 5.8-6.5.", "EC changes should be gradual for small indoor crops."],
    doNot: ["Do not double nutrient strength for pale leaves before light and roots are checked.", "Do not chase old leaf color after new growth stabilizes."],
    escalation: "Escalate if new growth remains pale or distorted after pH/EC is stable."
  },
  climate: {
    dose: "Stabilize temperature and airflow first; protect flowers and new growth from hot/cold swings.",
    targets: ["Avoid heat buildup under lights.", "Avoid cold-window night stress."],
    doNot: ["Do not move the plant repeatedly between extreme locations.", "Do not pollinate during heat-stressed midday wilt."],
    escalation: "Escalate if damage continues after the temperature swing is removed."
  },
  fit: {
    dose: "Reduce plant count, choose a compact variety, or move the crop to a better-fit setup.",
    targets: ["Canopy should fit below the light with airflow around leaves.", "Root zone should match crop water demand."],
    doNot: ["Do not force a large outdoor variety into a small countertop system.", "Do not keep incompatible herbs/crops in one wet root zone."],
    escalation: "Escalate by changing variety or device if the same stress returns after correction."
  },
  harvest: {
    dose: "Prune above a node and harvest lightly; let side shoots recover before the next cut.",
    targets: ["New side shoots visible within 3-7 days.", "Lower canopy gets more light and air."],
    doNot: ["Do not cut into old woody stems unless the crop tolerates it.", "Do not remove more than one third of active foliage at once."],
    escalation: "Escalate if regrowth stalls or flowering continues after pruning."
  },
  establishment: {
    dose: "Hold conditions steady and reduce stress while roots re-establish.",
    targets: ["No new collapse after 48 hours.", "New tips resume growth within a week."],
    doNot: ["Do not repot, fertilize, and prune on the same day.", "Do not keep transplant media saturated."],
    escalation: "Escalate if the crown or stem base softens."
  },
  crown: {
    dose: "Dry the crown immediately and keep water off the crown during the next cycle.",
    targets: ["Crown stays dry to touch.", "No soft, brown, or fuzzy tissue expansion."],
    doNot: ["Do not bury the strawberry crown.", "Do not mist into the crown."],
    escalation: "Escalate if the crown softens or white fuzz spreads."
  },
  growth: {
    dose: "Redirect energy with one pruning or spacing change, then wait for new growth response.",
    targets: ["New leaves and flowers become more concentrated.", "Canopy no longer shades itself heavily."],
    doNot: ["Do not remove all runners or leaves at once.", "Do not combine heavy pruning with nutrient changes."],
    escalation: "Escalate if flowering remains absent after a full follow-up week."
  }
};

function protocolForCategory(category) {
  return categoryProtocols[category] || categoryProtocols.water;
}

function environmentTargets(match = {}) {
  const environment = match.environment || {};
  const targets = [];
  if (environment.temperatureHigh !== undefined) targets.push(`Keep temperature below ${environment.temperatureHigh}C for this risk.`);
  if (environment.temperatureLow !== undefined) targets.push(`Keep temperature above ${environment.temperatureLow}C for this risk.`);
  if (environment.lightHoursMax !== undefined) targets.push(`Raise daily light above ${environment.lightHoursMax} h if growth remains weak.`);
  if (environment.sensorMoistureHigh !== undefined) targets.push(`Bring moisture reading below ${environment.sensorMoistureHigh} before watering again.`);
  if (environment.sensorMoistureLow !== undefined) targets.push(`Avoid letting moisture reading stay below ${environment.sensorMoistureLow}.`);
  if (environment.ecHigh !== undefined) targets.push(`Avoid EC above ${environment.ecHigh}.`);
  if (environment.ecLow !== undefined) targets.push(`Avoid EC below ${environment.ecLow}.`);
  if (environment.phHigh !== undefined || environment.phLow !== undefined) {
    targets.push(`Keep pH between ${environment.phLow ?? "crop lower bound"} and ${environment.phHigh ?? "crop upper bound"}.`);
  }
  return targets;
}

export function enrichPathologyCondition(condition) {
  const protocol = protocolForCategory(condition.category);
  const decisionSignals = [
    ...(condition.evidence || []).slice(0, 3),
    ...(condition.match?.visionLabels || []).map((item) => `vision label: ${item}`).slice(0, 2)
  ];
  return {
    ...condition,
    expertEvidence: {
      version: "fivecrop-expert-evidence-v1",
      positiveSigns: condition.evidence || [],
      differentialChecks: (condition.differentials || []).map((item) => `Rule out: ${item}`),
      missingInfo: condition.missingInfo || [],
      photoEvidence: (condition.photoTypes || []).map((type) => `${type} photo required for stronger confidence`),
      decisionRule: decisionSignals.length
        ? `Treat as ${condition.id} when at least two visible signs match and the strongest differential is not supported.`
        : `Treat as ${condition.id} only after visible signs and missing info are reviewed.`,
      confidenceBoosters: decisionSignals,
      confidenceReducers: ["single close-up without whole-plant context", "missing follow-up angle", "uncertain crop identity"]
    },
    prescriptionProtocol: {
      version: "fivecrop-prescription-protocol-v1",
      oneAction: condition.action,
      dose: protocol.dose,
      environmentTargets: [...protocol.targets, ...environmentTargets(condition.match)],
      doNot: protocol.doNot,
      followup: condition.followup,
      escalation: protocol.escalation,
      safety: "Use edible-crop-safe practices only; avoid unverified chemical treatments in MVP guidance."
    }
  };
}

export function flattenPathologyLibrary(library = pathologyLibrary) {
  return Object.entries(library.crops).flatMap(([cropKey, crop]) =>
    crop.conditions.map((item) => ({
      ...enrichPathologyCondition(item),
      cropKey,
      cropName: crop.name,
      cropScope: crop.scope,
      sources: item.sourceIds.map((id) => library.sourceIndex[id]).filter(Boolean)
    }))
  );
}

export function pathologyStats(library = pathologyLibrary) {
  const conditions = flattenPathologyLibrary(library);
  return {
    crops: Object.keys(library.crops).length,
    conditions: conditions.length,
    categories: new Set(conditions.map((item) => item.category)).size,
    sources: Object.keys(library.sourceIndex).length
  };
}

function setFrom(value) {
  return new Set(Array.isArray(value) ? value : []);
}

function numberValue(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function addScore(score, reasons, amount, reason) {
  if (!amount) return score;
  reasons.push(reason);
  return score + amount;
}

export function scorePathologyCondition(condition, state = {}, context = {}) {
  if (!condition || condition.cropKey !== state.crop) return null;
  const symptoms = setFrom(state.symptoms);
  const visuals = setFrom(state.visuals);
  const labels = setFrom(context.visionLabels || context.labels);
  const match = condition.match || {};
  const reasons = [`作物匹配：${condition.cropName || condition.cropKey}`];
  let score = 18;

  if (match.stage?.includes(state.stage)) {
    score = addScore(score, reasons, 12, `阶段匹配：${condition.stageName}`);
  } else if (["flowering", "fruiting"].includes(condition.stage) && ["flowering", "fruiting"].includes(state.stage)) {
    score = addScore(score, reasons, 7, "花果阶段相近");
  }

  if (match.concern?.includes(state.concern)) {
    score = addScore(score, reasons, 16, `主诉匹配：${state.concern}`);
  }

  (match.symptoms || []).forEach((item) => {
    if (symptoms.has(item)) score = addScore(score, reasons, 14, `症状匹配：${item}`);
  });

  (match.visuals || []).forEach((item) => {
    if (visuals.has(item)) score = addScore(score, reasons, 13, `照片信号匹配：${item}`);
  });

  (match.visionLabels || []).forEach((item) => {
    if (labels.has(item)) score = addScore(score, reasons, 10, `视觉标签匹配：${item}`);
  });

  if (condition.photoTypes?.includes(state.photoType)) {
    score = addScore(score, reasons, 6, `照片类型匹配：${state.photoType}`);
  }

  const environment = match.environment || {};
  if (environment.light?.includes(state.light)) score = addScore(score, reasons, 8, `光照状态：${state.light}`);
  if (environment.moisture?.includes(state.moisture)) score = addScore(score, reasons, 8, `水分状态：${state.moisture}`);
  if (environment.climate?.includes(state.climate)) score = addScore(score, reasons, 7, `环境状态：${state.climate}`);
  if (environment.medium?.includes(state.medium)) score = addScore(score, reasons, 7, `介质状态：${state.medium}`);
  if (environment.growDevice?.includes(state.growDevice)) score = addScore(score, reasons, 5, `设备适配：${state.growDevice}`);

  const temperature = numberValue(state.temperature);
  if (temperature !== null && environment.temperatureHigh !== undefined && temperature > environment.temperatureHigh) {
    score = addScore(score, reasons, 10, `温度偏高：${temperature}C`);
  }
  if (temperature !== null && environment.temperatureLow !== undefined && temperature < environment.temperatureLow) {
    score = addScore(score, reasons, 10, `温度偏低：${temperature}C`);
  }

  const lightHours = numberValue(state.lightHours);
  if (lightHours !== null && environment.lightHoursMax !== undefined && lightHours < environment.lightHoursMax) {
    score = addScore(score, reasons, 9, `光照小时不足：${lightHours}h`);
  }

  const sensorMoisture = numberValue(state.sensorMoisture);
  if (sensorMoisture !== null && environment.sensorMoistureHigh !== undefined && sensorMoisture > environment.sensorMoistureHigh) {
    score = addScore(score, reasons, 8, `湿度读数偏高：${sensorMoisture}`);
  }
  if (sensorMoisture !== null && environment.sensorMoistureLow !== undefined && sensorMoisture < environment.sensorMoistureLow) {
    score = addScore(score, reasons, 8, `湿度读数偏低：${sensorMoisture}`);
  }

  const ec = numberValue(state.ec);
  if (ec !== null && environment.ecHigh !== undefined && ec > environment.ecHigh) score = addScore(score, reasons, 7, `EC 偏高：${ec}`);
  if (ec !== null && environment.ecLow !== undefined && ec < environment.ecLow) score = addScore(score, reasons, 7, `EC 偏低：${ec}`);

  const ph = numberValue(state.ph);
  if (ph !== null && environment.phHigh !== undefined && ph > environment.phHigh) score = addScore(score, reasons, 7, `pH 偏高：${ph}`);
  if (ph !== null && environment.phLow !== undefined && ph < environment.phLow) score = addScore(score, reasons, 7, `pH 偏低：${ph}`);

  if (reasons.length < 3) return null;

  const rawScore = score;
  return {
    ...condition,
    rawScore,
    score: Math.min(98, score),
    confidence: Math.min(96, Math.max(42, score)),
    reasons
  };
}

export function matchPathologyConditions(state = {}, context = {}, library = pathologyLibrary) {
  return flattenPathologyLibrary(library)
    .map((item) => scorePathologyCondition(item, state, context))
    .filter(Boolean)
    .filter((item) => item.score >= 42)
    .sort((a, b) => (b.rawScore || b.score) - (a.rawScore || a.score));
}
