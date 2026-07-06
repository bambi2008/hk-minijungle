# FiveCrop 公开照片打印测试指南

这个测试是临时替代方案：先用公开网页/公开数据集里的病害照片，下载或截图后打印出来，再用手机里的 FiveCrop App 去拍。它主要用来检查：

- App 会不会把不是五种目标植物的照片硬认成罗勒
- App 会不会在证据不足时仍然给诊断
- App 能不能先确认作物，再进入病理判断
- 五条黄金路径能不能跑到正确诊断和“今天做什么”

注意：公开照片翻拍不能完全替代真实植物照片。后面找到五种植物后，还是要补真实生长周期测试。

## 怎么打开原始清单

原始程序清单在：

`C:\Users\ss\Documents\hk minijungle\data\public-photo-fixtures.json`

如果你用 PowerShell，可以输入：

```powershell
notepad "C:\Users\ss\Documents\hk minijungle\data\public-photo-fixtures.json"
```

不过建议你主要看这份 Markdown 指南。

## 测试方法

每条黄金路径至少找 5 张图。每张图拍 4 次：

1. 正面拍
2. 斜一点拍
3. 暗一点拍
4. 近距离裁切拍

这样最低是：

`5 条路径 x 5 张图 x 4 种拍法 = 100 次手机拍摄`

更理想是 200 次。

每次记录：

- App 识别成什么作物
- 是否要求重拍
- 是否进入正确诊断
- 给出的“今天做什么”是否合理
- 是否又默认成“罗勒光照不足”

管理端里的 `Review` / `captured` 表示手机已经自动回写了一次拍摄记录，但还需要人工点“通过 / 重拍 / 失败 / 默认罗勒”完成复核；不要把它直接当成通过。

## 五条黄金路径

### 1. 番茄落花

目标诊断：

`tomato-blossom-drop-heat-pollination`

优先找这些图：

- 番茄整株
- 番茄花序
- 花开了但没有小果
- 花梗发黄或落花

参考来源：

- [University of Minnesota: Growing tomatoes](https://extension.umn.edu/vegetables/growing-tomatoes)
- [PlantDoc Dataset](https://github.com/pratikkayal/PlantDoc-Dataset)

通过标准：

- 必须先确认是番茄
- 花序照片应该进入番茄落花/授粉/温度相关诊断
- 如果只是叶片病斑，不应该被诊断成落花

### 2. 罗勒徒长

目标诊断：

`basil-leggy-low-light`

优先找这些图：

- 罗勒整株
- 节间很长
- 叶片变小
- 植株向光倾斜

参考来源：

- [NC State: Ocimum basilicum](https://plants.ces.ncsu.edu/plants/ocimum-basilicum/)

通过标准：

- 必须看到罗勒特征才确认罗勒
- 不是罗勒的叶菜/香草不应该被硬认成罗勒
- 证据不够时应该要求重拍整株侧面照

### 3. 迷迭香过湿/湿根

目标诊断：

`rosemary-wet-root-decline`

优先找这些图：

- 迷迭香整株
- 针状叶
- 枝条木质化
- 叶尖发黑/变褐/萎蔫
- 土壤或根区过湿

参考来源：

- [NC State: Salvia rosmarinus](https://plants.ces.ncsu.edu/plants/salvia-rosmarinus/)

通过标准：

- 必须根据针状叶/木质枝条确认迷迭香
- 湿根证据不足时应该要求补拍根区或基质
- 不能把所有针状植物都自信诊断成迷迭香

### 4. 草莓授粉/冠部湿

目标诊断：

`strawberry-deformed-fruit-pollination`

备选目标：

- `strawberry-flower-no-fruit`
- `strawberry-crown-wet-rot-risk`

优先找这些图：

- 草莓三出复叶
- 草莓花
- 畸形果
- 冠部潮湿或发黑

参考来源：

- [University of Kentucky: Poor Pollination, Strawberry](https://fruitscout.mgcafe.uky.edu/poor-pollination-strawberry)
- [University of Minnesota: Growing strawberries](https://extension.umn.edu/fruit/growing-strawberries-home-garden)

通过标准：

- 畸形果应该进入草莓授粉不良
- 冠部过湿应该进入冠部湿/腐烂风险
- 只有叶片时，不应该直接诊断授粉失败

### 5. 辣椒落花

目标诊断：

`pepper-flower-drop`

优先找这些图：

- 辣椒整株
- 白色辣椒花
- 花节点
- 落花
- 小辣椒刚坐果

参考来源：

- [University of Minnesota: Growing peppers](https://extension.umn.edu/vegetables/growing-peppers)
- [PlantDoc Dataset](https://github.com/pratikkayal/PlantDoc-Dataset)

通过标准：

- 必须先确认是辣椒
- 花节点照片应该进入辣椒落花/温度/授粉相关诊断
- 辣椒叶片病害不应该被诊断成落花
- 番茄花或罗勒花不能被接受为辣椒落花

## 最关键的失败信号

如果出现下面情况，说明视觉识别还不够可靠：

- 不是罗勒，却仍然显示罗勒
- 看不到作物身份，却直接给诊断
- 叶片病害被诊断成落花
- 花/果实问题在没有花果照片时也给出结论
- 所有植物都归因成光照不足

这些失败样本最有价值。保留照片、截图和 App 输出，后面可以沉淀进专家纠错和验证集。
