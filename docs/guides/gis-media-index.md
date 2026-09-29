# 房产 GIS 素材索引

更新于 2026-09-29。

这份索引区分“当前公开使用的素材”和“历史留存素材”。历史文件保留在原目录，不能作为当前方案截图引用。

首页封面属于装饰图，不作为 GIS 案例证据。以下是案例页的当前引用。

## 当前版本

| 用途 | 文件或入口 | 说明 |
| --- | --- | --- |
| 案例页总图原型海报 | `public/projects/real-estate-gis/media/final/map-current-overview.png` | 2026-09-29 从站内原型截取，使用当前底图，展开图层并选中 17 幢 |
| 案例页总图交互入口 | `public/projects/real-estate-gis/prototypes/map/index.html` | 当前可交互原型，页面上的完整入口以此为准 |
| 案例页整幢对比图与原型海报 | `public/projects/real-estate-gis/media/final/building-current-overview.png` | 2026-09-29 从站内原型截取，使用当前平面参考图，打开 17 幢并选中 1 单元 1501 室 |
| 案例页任务原型海报 | `public/projects/real-estate-gis/media/final/13-task-relations-focus.png` | 当前实测替换预测任务工作面 |
| 设计取舍的矩阵局部 | `public/projects/real-estate-gis/media/final/15-decision-matrix.png` | 2026-09-29 已对照当前原型，楼层与户室状态色带一致 |
| 设计取舍的关系卡局部 | `public/projects/real-estate-gis/media/final/16-decision-relation-card.png` | 2026-09-29 已对照当前原型，户室对应、面积差异与待核对状态一致 |

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
