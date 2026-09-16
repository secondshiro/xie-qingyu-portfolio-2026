# 文档索引

更新于 2026-09-16。接手先读根目录 README.md、TASK_STATUS.md、DESIGN.md 与 AGENTS.md；涉及定位和事实再读 PRODUCT.md。

## 当前结构与维护

| 入口 | 用途 |
| --- | --- |
| [当前状态](../TASK_STATUS.md) | 实现、验证、发布边界和待办的唯一汇总 |
| [设计规范](../DESIGN.md) | 字阶、颜色、媒体、目录、折叠与响应式合同 |
| [首页简报](briefs/homepage.md) | 文字项目索引与职业定位 |
| [GIS 素材索引](guides/gis-media-index.md) | 案例页的当前媒体与历史素材 |
| [执行网维护](projects/execution-query/next-turn-handoff.md) | 独立本地工具与案例证据 |

公开路由为 `/`、`/work/real-estate-gis/`、`/work/edgecase-planner/`、`/work/brand-system/`、`/work/execution-query/`。源码入口为 `src/pages/`，公共结构由 `src/components/` 维护，样式位于 `src/styles/`。三个 GIS 原型位于 `public/projects/real-estate-gis/prototypes/`，无新增后端或 API。

执行网生产助手位于 `execution-query-tool/`，有独立依赖与运行方式，不随作品集静态发布。本次文案和文档整理没有改变工具 API、环境变量或数据结构。

## 如何使用历史材料

`superpowers/` 的规格和计划、`reviews/` 的审查、旧写作草稿与验收记录用于追溯当时的判断。它们的未勾选任务、自动验证路线、旧首页大图、项目数量和旧定位都不构成当前实施指令。遇到差异，以当前代码、根目录规则与当前状态为准。

根目录 `portfolio-agent-modification-plan.md` 保留用户提供的修改建议，实际采纳范围见 2026-09-16 交付记录；文件中的发布指令不等于新增发布授权。`portfolio-site-handoff/` 保留 2026-09-02 原始输入，`.impeccable/mocks/` 保留历史构图。PROGRESS.md 与 BLOCKED.md 只作短入口，不重复维护状态。

## 文件目录

下表逐项标明文件用途。历史文件保留原日期、来源和验收证据，避免把旧结论改写成当时已经知道的事实。

| 文件 | 角色 |
| --- | --- |
| [briefs/edgecase-narrative.md](briefs/edgecase-narrative.md) | 历史计划、草稿或验收记录 |
| [briefs/edgecase-planner.md](briefs/edgecase-planner.md) | 历史计划、草稿或验收记录 |
| [briefs/homepage.md](briefs/homepage.md) | 当前首页结构与定位 |
| [briefs/narrative-rewrite/brand-system.md](briefs/narrative-rewrite/brand-system.md) | 历史计划、草稿或验收记录 |
| [briefs/narrative-rewrite/delivery-report.md](briefs/narrative-rewrite/delivery-report.md) | 历史计划、草稿或验收记录 |
| [briefs/narrative-rewrite/edgecase-planner.md](briefs/narrative-rewrite/edgecase-planner.md) | 历史计划、草稿或验收记录 |
| [briefs/narrative-rewrite/execution-query.md](briefs/narrative-rewrite/execution-query.md) | 历史计划、草稿或验收记录 |
| [briefs/narrative-rewrite/homepage.md](briefs/narrative-rewrite/homepage.md) | 历史计划、草稿或验收记录 |
| [briefs/narrative-rewrite/real-estate-gis.md](briefs/narrative-rewrite/real-estate-gis.md) | 历史计划、草稿或验收记录 |
| [briefs/narrative-rewrite/source-and-structure.md](briefs/narrative-rewrite/source-and-structure.md) | 历史计划、草稿或验收记录 |
| [briefs/recruiting-rewrite/background-value-addendum.md](briefs/recruiting-rewrite/background-value-addendum.md) | 历史计划、草稿或验收记录 |
| [briefs/recruiting-rewrite/delivery-report.md](briefs/recruiting-rewrite/delivery-report.md) | 历史计划、草稿或验收记录 |
| [briefs/recruiting-rewrite/evidence-map.md](briefs/recruiting-rewrite/evidence-map.md) | 历史计划、草稿或验收记录 |
| [briefs/recruiting-rewrite/reading-acceptance.md](briefs/recruiting-rewrite/reading-acceptance.md) | 阅读复核方法；表内结果为当时记录 |
| [briefs/submission-polish-2026-09-16.md](briefs/submission-polish-2026-09-16.md) | 2026-09-16 修改与验证记录 |
| [guides/gis-map-visual-redesign-guide.md](guides/gis-map-visual-redesign-guide.md) | GIS 产品视觉参考，不能覆盖网站设计合同 |
| [guides/gis-media-index.md](guides/gis-media-index.md) | 当前 GIS 媒体引用 |
| [history/design-notes-2026-09-07.md](history/design-notes-2026-09-07.md) | 历史计划、草稿或验收记录 |
| [history/narrative-progress-2026-09-14-15.md](history/narrative-progress-2026-09-14-15.md) | 历史计划、草稿或验收记录 |
| [history/status-through-2026-09-16.md](history/status-through-2026-09-16.md) | 历史计划、草稿或验收记录 |
| [projects/execution-query/README.md](projects/execution-query/README.md) | 工具文档入口 |
| [projects/execution-query/assistant-mvp-status.md](projects/execution-query/assistant-mvp-status.md) | 历史计划、草稿或验收记录 |
| [projects/execution-query/challenge-observation-result.md](projects/execution-query/challenge-observation-result.md) | 历史计划、草稿或验收记录 |
| [projects/execution-query/decision-record.md](projects/execution-query/decision-record.md) | 分日期记录的产品决定 |
| [projects/execution-query/feasibility-result.md](projects/execution-query/feasibility-result.md) | 历史计划、草稿或验收记录 |
| [projects/execution-query/next-turn-handoff.md](projects/execution-query/next-turn-handoff.md) | 当前工具维护与交接 |
| [projects/execution-query/open-source-reuse-evaluation.md](projects/execution-query/open-source-reuse-evaluation.md) | 历史计划、草稿或验收记录 |
| [projects/execution-query/portfolio-evidence-brief.md](projects/execution-query/portfolio-evidence-brief.md) | 当前案例证据与章节 |
| [projects/execution-query/production-rebuild-brief.md](projects/execution-query/production-rebuild-brief.md) | 历史计划、草稿或验收记录 |
| [projects/execution-query/source-inventory.md](projects/execution-query/source-inventory.md) | 只读史料索引 |
| [reviews/2026-09-02-portfolio-site-audit.md](reviews/2026-09-02-portfolio-site-audit.md) | 历史计划、草稿或验收记录 |
| [reviews/2026-09-04-edgecase-sources.md](reviews/2026-09-04-edgecase-sources.md) | 历史计划、草稿或验收记录 |
| [reviews/2026-09-07-edgecase-planner-finish.md](reviews/2026-09-07-edgecase-planner-finish.md) | 历史计划、草稿或验收记录 |
| [superpowers/plans/2026-09-02-portfolio-site-v1.md](superpowers/plans/2026-09-02-portfolio-site-v1.md) | 历史计划、草稿或验收记录 |
| [superpowers/plans/2026-09-04-edgecase-planner-case.md](superpowers/plans/2026-09-04-edgecase-planner-case.md) | 历史计划、草稿或验收记录 |
| [superpowers/plans/2026-09-09-execution-query-browser-companion.md](superpowers/plans/2026-09-09-execution-query-browser-companion.md) | 历史计划、草稿或验收记录 |
| [superpowers/plans/2026-09-09-execution-query-browser-runtime-and-solvers.md](superpowers/plans/2026-09-09-execution-query-browser-runtime-and-solvers.md) | 历史计划、草稿或验收记录 |
| [superpowers/plans/2026-09-09-execution-query-challenge-validation.md](superpowers/plans/2026-09-09-execution-query-challenge-validation.md) | 历史计划、草稿或验收记录 |
| [superpowers/plans/2026-09-09-execution-query-feasibility.md](superpowers/plans/2026-09-09-execution-query-feasibility.md) | 历史计划、草稿或验收记录 |
| [superpowers/plans/2026-09-10-execution-query-assistant-mvp.md](superpowers/plans/2026-09-10-execution-query-assistant-mvp.md) | 历史计划、草稿或验收记录 |
| [superpowers/plans/2026-09-10-execution-query-portfolio-case.md](superpowers/plans/2026-09-10-execution-query-portfolio-case.md) | 历史计划、草稿或验收记录 |
| [superpowers/plans/2026-09-10-execution-query-production-workbench.md](superpowers/plans/2026-09-10-execution-query-production-workbench.md) | 历史计划、草稿或验收记录 |
| [superpowers/plans/2026-09-12-execution-query-local-console-implementation.md](superpowers/plans/2026-09-12-execution-query-local-console-implementation.md) | 历史计划、草稿或验收记录 |
| [superpowers/plans/2026-09-13-execution-query-portfolio-writing.md](superpowers/plans/2026-09-13-execution-query-portfolio-writing.md) | 历史计划、草稿或验收记录 |
| [superpowers/specs/2026-09-02-portfolio-site-redesign-design.md](superpowers/specs/2026-09-02-portfolio-site-redesign-design.md) | 历史计划、草稿或验收记录 |
| [superpowers/specs/2026-09-09-execution-query-browser-companion-design.md](superpowers/specs/2026-09-09-execution-query-browser-companion-design.md) | 历史计划、草稿或验收记录 |
| [superpowers/specs/2026-09-10-execution-query-assistant-human-verification-design.md](superpowers/specs/2026-09-10-execution-query-assistant-human-verification-design.md) | 历史计划、草稿或验收记录 |
| [superpowers/specs/2026-09-10-execution-query-production-tool-and-case-design.md](superpowers/specs/2026-09-10-execution-query-production-tool-and-case-design.md) | 历史计划、草稿或验收记录 |
| [superpowers/specs/2026-09-12-execution-query-local-console-design.md](superpowers/specs/2026-09-12-execution-query-local-console-design.md) | 历史计划、草稿或验收记录 |
| [history/context-cleanup-2026-09-16.md](history/context-cleanup-2026-09-16.md) | 本次文档同步与检查记录 |
