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
  "ncsu-rosemary": {
    title: "NC State Extension Gardener Plant Toolbox: Salvia rosmarinus",
    url: "https://plants.ces.ncsu.edu/plants/salvia-rosmarinus/"
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
  version: "2026-06-25",
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
          id: "basil-bolting-flowering",
          cropKey: "basil",
          stage: "flowering",
          category: "harvest",
          title: "罗勒开花变苦",
          summary: "罗勒进入开花后，叶片口感和连续采收能力下降，通常需要修剪或换新苗。",
          action: "今天剪掉花穗和老枝，保留健康节点促侧芽。",
          followup: { when: "3-5 天", photo: "修剪点", success: "剪口下方出现侧芽" },
          evidence: ["顶端花穗", "叶片变窄", "老枝木质化"],
          differentials: ["热/旱压力逼花", "光周期过长", "植株过老"],
          missingInfo: ["是否已开花", "采收频率", "室温"],
          photoTypes: ["plant", "leaf"],
          match: {
            symptoms: ["no-flower", "leggy"],
            stage: ["flowering"],
            environment: { climate: ["hot"], moisture: ["dry"] }
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
            symptoms: ["wilting"],
            visuals: ["edge-dry"],
            environment: { moisture: ["dry"], climate: ["dry", "hot"], sensorMoistureLow: 35 }
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
            visuals: ["tiny-flies", "webbing"],
            visionLabels: ["possible-pest", "spots"]
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
      scope: "小苗、扦插苗和小盆迷迭香；重点识别过湿、弱光、通风和木本香草适配。",
      conditions: [
        condition({
          id: "rosemary-wet-root-decline",
          cropKey: "rosemary",
          stage: "vegetative",
          category: "root",
          title: "迷迭香过湿衰弱",
          summary: "迷迭香需要排水和通风，长期潮湿会表现为灰绿、叶尖发黑和整株衰弱。",
          action: "立即暂停浇水 48 小时，加强通风并让表层变干。",
          followup: { when: "48 小时", photo: "根区和枝梢", success: "基质表面变干，枝梢不继续发黑" },
          evidence: ["基质长期湿", "叶尖发黑", "枝条软塌"],
          differentials: ["缺水假象", "弱光", "低温"],
          missingInfo: ["根区是否有异味", "容器排水", "最近浇水"],
          photoTypes: ["root", "plant"],
          match: {
            concern: ["root"],
            symptoms: ["wilting", "yellow-leaves", "algae"],
            visuals: ["white-fuzz", "green-surface"],
            environment: { moisture: ["wet"], climate: ["humid"], sensorMoistureHigh: 75 },
            visionLabels: ["root-risk", "white-fuzz"]
          },
          sourceIds: ["ncsu-rosemary", "fivecrop-field"]
        }),
        condition({
          id: "rosemary-low-light-indoors",
          cropKey: "rosemary",
          stage: "vegetative",
          category: "light",
          title: "迷迭香室内弱光",
          summary: "迷迭香对强光和空气流动要求更高，弱光下会细弱、香味淡、长期不长。",
          action: "把补光稳定到 12-14 小时，并加低速风扇。",
          followup: { when: "7 天", photo: "整株侧面", success: "新梢更直立，叶色更饱满" },
          evidence: ["新梢细弱", "整体向窗倾斜", "香味变淡"],
          differentials: ["过湿根损伤", "温度过低", "老枝木质化"],
          missingInfo: ["直射光/补光小时", "灯距", "风扇情况"],
          photoTypes: ["plant"],
          match: {
            concern: ["leggy"],
            symptoms: ["leggy"],
            visuals: ["long-internodes"],
            environment: { light: ["low"], lightHoursMax: 12 }
          },
          sourceIds: ["ncsu-rosemary", "fivecrop-field"]
        }),
        condition({
          id: "rosemary-pot-drainage-mismatch",
          cropKey: "rosemary",
          stage: "vegetative",
          category: "fit",
          title: "迷迭香介质/容器不适配",
          summary: "保水介质和无排水容器会让迷迭香持续处在根区缺氧状态。",
          action: "改成独立容器和疏松介质；不要和需水高的香草混种。",
          followup: { when: "7 天", photo: "盆口和整株", success: "表层能按周期变干，新梢不继续萎软" },
          evidence: ["无排水孔", "混种罗勒等高需水香草", "表层一直湿"],
          differentials: ["刚移栽缓苗", "低温慢生长"],
          missingInfo: ["是否有排水孔", "介质类型", "是否混种"],
          photoTypes: ["root", "plant"],
          match: {
            symptoms: ["wilting", "yellow-leaves"],
            environment: { medium: ["water", "xponge"], moisture: ["wet"], growDevice: ["letpot", "idoo", "aerogarden"] }
          },
          sourceIds: ["ncsu-rosemary", "fivecrop-field"]
        }),
        condition({
          id: "rosemary-powdery-mildew-humidity",
          cropKey: "rosemary",
          stage: "vegetative",
          category: "disease",
          title: "迷迭香高湿白粉/霉斑风险",
          summary: "高湿和低通风会让针叶状叶片间形成病害小环境。",
          action: "停止喷雾，拉开枝条通风；补拍白斑近照。",
          followup: { when: "48 小时", photo: "白斑叶片", success: "白斑不扩散，新叶保持干爽" },
          evidence: ["叶面白粉", "枝条过密", "夜间高湿"],
          differentials: ["水垢", "灰尘", "药斑"],
          missingInfo: ["白斑是否可擦掉", "湿度", "是否喷雾"],
          photoTypes: ["leaf"],
          match: {
            symptoms: ["spots"],
            visuals: ["white-fuzz"],
            environment: { climate: ["humid"], moisture: ["wet"] },
            visionLabels: ["spots", "white-fuzz"]
          },
          sourceIds: ["ncsu-rosemary", "fivecrop-field"]
        }),
        condition({
          id: "rosemary-dry-edge-underwatering",
          cropKey: "rosemary",
          stage: "vegetative",
          category: "water",
          title: "迷迭香过干/根团脱水",
          summary: "虽然怕湿，但小盆强光下也会根团干透，表现为叶尖干、枝梢发脆。",
          action: "沿盆边少量补水，确认水能穿透根团；不要改成天天浇。",
          followup: { when: "24-48 小时", photo: "枝梢和盆口", success: "枝梢不再继续干枯" },
          evidence: ["叶尖干脆", "盆很轻", "基质离盆边"],
          differentials: ["过湿后根损伤", "盐分过高", "低湿热风"],
          missingInfo: ["盆重", "表层和下层湿度", "最近浇透时间"],
          photoTypes: ["plant", "root"],
          match: {
            concern: ["dry"],
            symptoms: ["wilting"],
            visuals: ["edge-dry"],
            environment: { moisture: ["dry"], climate: ["dry"], sensorMoistureLow: 35 }
          },
          sourceIds: ["ncsu-rosemary", "fivecrop-field"]
        }),
        condition({
          id: "rosemary-transplant-shock",
          cropKey: "rosemary",
          stage: "seedling",
          category: "establishment",
          title: "迷迭香移栽缓苗",
          summary: "新买或新扦插的迷迭香根系弱，突然换光、换盆或浇水过多都会导致短期萎蔫。",
          action: "先固定位置和浇水节奏，7 天内不要连续换盆换灯。",
          followup: { when: "7 天", photo: "整株同角度", success: "新梢稳定，不再扩大萎蔫" },
          evidence: ["刚购买/刚移栽", "整株轻微萎蔫", "根系尚未铺开"],
          differentials: ["根腐", "严重缺水", "低温伤害"],
          missingInfo: ["购买/移栽日期", "根团状态", "是否修根"],
          photoTypes: ["plant", "root"],
          match: {
            symptoms: ["wilting"],
            stage: ["seedling", "vegetative"],
            environment: { moisture: ["swing"] }
          },
          sourceIds: ["ncsu-rosemary", "fivecrop-field"]
        }),
        condition({
          id: "rosemary-pest-needle-speckling",
          cropKey: "rosemary",
          stage: "vegetative",
          category: "pest",
          title: "迷迭香针叶斑点/害虫",
          summary: "针叶密集时，叶螨和介壳等小害虫容易被误认为干尖或灰尘。",
          action: "补拍枝条内侧和叶背，先隔离再处理。",
          followup: { when: "24-48 小时", photo: "枝条内侧", success: "移动小点或黏性分泌物减少" },
          evidence: ["针叶斑点", "枝条内侧小点", "细网或黏液"],
          differentials: ["白粉", "水垢", "老叶自然脱落"],
          missingInfo: ["放大近照", "是否有细网", "是否靠近其他盆"],
          photoTypes: ["pest", "leaf"],
          match: {
            concern: ["pest"],
            symptoms: ["pests", "spots"],
            visuals: ["webbing"],
            visionLabels: ["possible-pest", "spots"]
          },
          sourceIds: ["ncsu-rosemary", "fivecrop-field"]
        }),
        condition({
          id: "rosemary-cold-window-stress",
          cropKey: "rosemary",
          stage: "vegetative",
          category: "climate",
          title: "迷迭香冷窗/温差压力",
          summary: "贴冷窗或夜间低温会放慢生长，弱光和湿根会一起放大衰弱。",
          action: "把盆移离冷窗 20cm，夜间避免根区贴冷玻璃。",
          followup: { when: "7 天", photo: "整株侧面", success: "新梢不再下垂，叶色更稳定" },
          evidence: ["靠冷窗", "夜间低温", "新梢生长停滞"],
          differentials: ["弱光", "根区过湿", "移栽缓苗"],
          missingInfo: ["夜间温度", "离窗距离", "是否有冷风"],
          photoTypes: ["plant"],
          match: {
            symptoms: ["wilting"],
            environment: { climate: ["cold"], temperatureLow: 16, light: ["low"] }
          },
          sourceIds: ["ncsu-rosemary", "fivecrop-field"]
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

export function flattenPathologyLibrary(library = pathologyLibrary) {
  return Object.entries(library.crops).flatMap(([cropKey, crop]) =>
    crop.conditions.map((item) => ({
      ...item,
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

  return {
    ...condition,
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
    .sort((a, b) => b.score - a.score);
}
