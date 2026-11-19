# 房产 GIS 素材索引

更新于 2026-11-19。

这份索引区分仓库当前引用与历史留存。历史文件保留在原目录，不能作为当前方案截图引用。

首页封面属于装饰图，不作为 GIS 案例证据。以下是案例页的当前引用。

## 当前版本

| 用途 | 文件或入口 | 说明 |
| --- | --- | --- |
| 案例页总图原型海报 | `public/projects/real-estate-gis/media/final/map-current-overview.png` | 2026-11-11 从站内原型重截，展开图层并选中 17 幢，显示楼幢摘要、两项入口和常用资料 |
| 案例页总图交互入口 | `public/projects/real-estate-gis/prototypes/map/index.html` | 当前可交互原型，页面上的完整入口以此为准 |
| 总图演示底图 | `public/projects/real-estate-gis/prototypes/map/assets/gis-base-map-shipai.jpg` | 2026-11-11 对象面板改版时保留，沿用已对齐的楼幢选区和定位视角 |
| 案例页整幢对比图与原型海报 | `public/projects/real-estate-gis/media/final/building-current-overview.png` | 2026-11-11 从站内原型重新截取，打开 17 幢并选中 1 单元 1501 室，显示浅蓝底、单层蓝框与格底状态条 |
| 案例页任务原型海报 | `public/projects/real-estate-gis/media/final/13-task-relations-focus.png` | 2026-11-18 从正式原型入口重截，显示 17 幢设入库模式的固定楼层范围、待核对筛选和关系卡，用于窄屏降级 |
| 设计取舍的矩阵局部 | `public/projects/real-estate-gis/media/final/15-decision-matrix.png` | 2026-11-11 从站内原型重新截取顶部矩阵，实际层与名义层并列，房号下方显示多段状态条 |
| 设计取舍的关系卡局部 | `public/projects/real-estate-gis/media/final/16-decision-relation-card.png` | 2026-11-18 从当前任务原型截取 1 单元 1501 室，显示现有记录 94.20㎡、测绘记录 95.90㎡ 和待核对状态，画幅为 1196×144 |

任务原型最新实现位于 `public/projects/real-estate-gis/prototypes/task/index.html`，包含转人工与楼盘变更流程。转办与校验的交接记录见 [原型交接记录](../briefs/gis-prototype-2026-10-16/REVIEW.md)。操作以当前站内原型为准。

三个原型共用 `prototypes/demo-data.js` 的 27 层、322 户基础记录。图例含义与截图色值沿用原始材料，户室状态分配为合成演示数据。实测侧另含差异与复杂关系样例，未连接真实校验或提交。

## 底图选择与版本检查

10 月独立 v2 提案使用脚本生成的矢量底图，本地存档入口为 `work/gis-ui-review-2026-10-26/v2/index.html`。11 月总图改版曾对照另一张生成底图，发现屋顶与楼幢选中轮廓错位，正式版沿用已对齐的底图。案例页总图海报和可操作原型显示同一张底图。

两张任务原型截图于 2026-11-18 重截。总图使用顶栏搜索定位楼幢，地图工具提供缩放和复位。

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
| `public/projects/real-estate-gis/media/public/legacy-map-observed.webp` | 旧系统留存材料 | 用于“问题重定义”的旧系统对照 |
| `public/projects/real-estate-gis/media/public/legacy-building-observed.webp` | 旧系统留存材料 | 用于“问题重定义”的旧系统对照 |
| `public/projects/real-estate-gis/media/public/legacy-building-overview-observed.webp` | 旧系统留存材料 | 用于“核心方案”的整幢前后对照 |

## 命名约定

- `final/` 保存设计截图，包含历史留存；编号不代表版本新旧，当前引用以本索引为准。
- `public/legacy-` 保存旧系统或旧方案的留存材料，只能标为 `observed`。
- `prototypes/` 保存可运行的站内原型；静态海报必须与对应入口保持一致。
- 新增截图优先使用语义名称，并在本索引登记用途和日期。
