# 房产 GIS 素材索引

更新于 2026-11-27。

这份索引区分仓库当前引用与历史留存。历史文件保留在原目录，不能作为当前方案截图引用。

首页封面属于装饰图。案例页按整幢矩阵、总图入口、测绘核对、行业参照和「验证与边界」展开。前三节各有一段设计取舍和对应的站内原型入口。对照图排版见 [设计规范](../../DESIGN.md#gis-案例设计取舍与媒体)。

## 当前版本

| 用途 | 文件或入口 | 说明 |
| --- | --- | --- |
| 案例页总图原型海报 | `public/projects/real-estate-gis/media/final/map-current-overview.png` | 2026-11-25 从站内原型重截，展开图层并选中 17 幢，显示楼幢摘要、两项入口和常用资料 |
| 案例页总图交互入口 | `public/projects/real-estate-gis/prototypes/map/index.html` | 当前可交互原型，页面上的完整入口以此为准 |
| 总图演示底图 | `public/projects/real-estate-gis/prototypes/map/assets/gis-base-map-shipai.jpg` | 2026-11-11 对象面板改版时保留，沿用已对齐的楼幢选区和定位视角 |
| 总图旧界面对比图 | `public/projects/real-estate-gis/media/public/legacy-map-observed.webp` | 顶部工具与左侧图层的布局留存 |
| 整幢旧界面对比图 | `public/projects/real-estate-gis/media/public/legacy-building-overview-observed.webp` | 同屏保留工具、平面区、户室属性与楼盘表 |
| 案例页整幢对比图与原型海报 | `public/projects/real-estate-gis/media/final/building-current-overview.png` | 2026-11-25 从站内原型重新截取，打开 17 幢并选中 1 单元 1501 室，显示浅蓝底、单层蓝框与格底状态条 |
| 案例页任务原型海报 | `public/projects/real-estate-gis/media/final/13-task-relations-focus.png` | 2026-11-25 从站内原型重截，显示 17 幢设入库模式的固定楼层范围、待核对筛选和关系卡，用于窄屏降级 |
| 整幢矩阵局部 | `public/projects/real-estate-gis/media/final/15-decision-matrix.png` | 2026-11-27 交付采用的 1190×380 截图，展示实际第 19 至 27 层、双层号以及房号下方的并列状态色条 |
| 核对页结构变化局部 | `public/projects/real-estate-gis/media/final/16-decision-relation-card.png` | 2026-11-27 交付采用的 1200×270 截图，展示 2 单元 2502、2503 两户对应一条测绘记录的疑似多合一关系 |

任务原型最新实现位于 `public/projects/real-estate-gis/prototypes/task/index.html`，包含转人工与楼盘变更流程。转办与校验的交接记录见 [原型交接记录](../briefs/gis-prototype-2026-10-16/REVIEW.md)。操作以当前站内原型为准。

三个原型共用 `prototypes/demo-data.js` 的 27 层、322 户基础记录。图例含义与截图色值沿用原始材料，户室状态分配为合成演示数据。实测侧另含差异与复杂关系样例，未连接真实校验或提交。

## 2026-11-27 案例复核

- **现实题材检查。** 对照[事实与贡献对照](../briefs/gis-evidence-revision/EVIDENCE.md)和当前原型，核对个人回溯的范围、沿用的图例与楼层语义，以及作者负责的布局、入口与异常反馈。总图通过搜索切换楼幢，点图只恢复上次关闭的楼幢面板。转办仍待处理时不能提交。
- **修订复核。** 按[改写验收指标](../../PRODUCT.md#改写验收指标)连读首屏及三节。首屏说明任务、设计改动和阶段。整幢一节用前后对照说明空间与状态取舍，局部图承接色条布局。总图一节按操作是否需要先选幢解释入口分配，搜索流程图承接对象入口。测绘核对一节将面积差示意与结构变化关系卡放在各自的说明附近，交代关系卡和表格的用途。行业资料对应三个设计问题。收尾给出双层号、侧栏联动和转办拦截的验证步骤，并交代待定业务规则和 AI 协作分工。
- **配套文本扫描。** 核对目录、图注、图片尺寸与替代文本、三个海报和独立入口。1501 室用于面积差说明，2502、2503 室用于多合一说明。原型继续使用 11 月 25 日核实的站内文件。

发布副本基础测试 7 项通过，静态构建生成 7 页。全站浏览器回归 167 项通过，最终标题复核后复跑相关测试 12 项通过。另检查桌面与手机的三个设计取舍区块、无白底等高对照图和七张引用图片。GIS 专项覆盖内嵌与新窗口、转办、校验及资源一致性。

## 2026-11-25 界面与操作核对

三套原型共用 `prototypes/shared-ui.css` 的顶栏、标识容器和基础控件样式，各工作区维护专用样式。任务原型的关系计数与列表按当前楼层范围同步。勾选「仅看待核对层」时启用「待核对」，切换到其他状态时取消勾选。

本轮发布副本基础测试 7 项、GIS 浏览器专项 26 项通过，静态构建生成 7 页。核对了内嵌与实际新窗口、楼层筛选、校验、转办及资源一致性。

人工完成现实题材检查、修订复核和配套文本扫描。对照原型核对楼幢选择、关系筛选与案例操作标题，复核演示数据边界，并检查窄屏海报、图注及独立入口。

## 底图选择与版本检查

10 月独立 v2 提案使用脚本生成的矢量底图，本地存档入口为 `work/gis-ui-review-2026-10-26/v2/index.html`。11 月总图改版曾对照另一张生成底图，发现屋顶与楼幢选中轮廓错位，正式版沿用已对齐的底图。案例页总图海报和可操作原型显示同一张底图。

三个原型的窄屏海报于 2026-11-25 同步更新顶栏、标识和工作区样式，画幅为 1440×900。总图默认展示 17 幢。顶栏搜索可切换楼幢，关闭对象面板后点击图面可恢复上次选中的楼幢。地图工具提供缩放和复位。

改动原型界面后，从案例的正式入口按表中状态重截窄屏海报和受影响的局部图。发布前在同一发布副本运行 GIS 浏览器测试，核对实际点击的新窗口、内嵌页面、底图和三张海报。正式网址更新后，用该发布副本运行同一组检查。

```sh
npm run test:e2e -- tests/gis-*.spec.*
PORTFOLIO_BASE_URL=https://xie-qingyu-portfolio-2026.pages.dev npm run test:e2e -- tests/gis-*.spec.* --workers=1
```

校验逐字节比较三个原型的页面、脚本、样式、底图、平面图与案例实际引用的图片。漏发或旧文件会按路径报错，即使对应地址返回 HTTP 200。

## 历史版本

| 文件 | 状态 | 处理原则 |
| --- | --- | --- |
| `public/projects/real-estate-gis/media/final/02-map-object-context.png` | 旧版总图对象上下文截图 | 保留作历史证据，不再作为当前总图原型海报或首页主视觉 |
| `public/projects/real-estate-gis/media/final/03-map-layer-object.png` | 使用旧矢量底图的总图截图 | 保留作历史证据，当前海报改用 `map-current-overview.png` |
| `public/projects/real-estate-gis/media/final/12-building-current-overview.png` | 使用旧平面简图的整幢截图 | 保留作历史证据，当前对比图与海报改用 `building-current-overview.png` |
| `public/projects/real-estate-gis/media/public/legacy-building-observed.webp` | 旧系统留存材料 | 保留作历史证据，整幢对照使用当前索引中的全览图 |

## 命名约定

- `final/` 保存设计截图，包含历史留存；编号不代表版本新旧，当前引用以本索引为准。
- `public/legacy-` 保存旧系统或旧方案的留存材料，只能标为 `observed`。
- `prototypes/` 保存可运行的站内原型；静态海报必须与对应入口保持一致。
- 新增截图优先使用语义名称，并在本索引登记用途和日期。
