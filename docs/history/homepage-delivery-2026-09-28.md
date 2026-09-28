# 首页替换与上下文整理

日期为 2026-09-28。用户授权将唱机方案替换正式首页并上传 Git，同时要求保留旧首页。

## 实现

正式入口为 `src/pages/index.astro`，首页样式与交互独立放在 `src/styles/home-turntable.css`、`src/scripts/turntable.js`，最终四张封面在 `public/images/home/covers/`。案例仍使用原布局与视觉合同。旧首页及依赖共七个源码文件完整保存在 `backups/homepage-before-turntable-2026-09-28/`。

公开路由仍为首页与四个案例。没有新增业务成果或修改独立查询工具。公开中文沿用已确认案例材料，两处标点修改按 human-writing 完成事实核对、修订复核与配套文本扫描。

## 验证

- `npm test` 7/7 通过。
- `npm run test:e2e` 65/65 通过，原整站 35 项加首页 30 项。
- `npm run build` 零错误、零警告、零提示，输出五页。
- 已目视检查 1440×810 与 1920×1080 构图，案例入口在文案下方左对齐。
- 旧失败一为执行网截图断言过期，实际素材清单已有 5 张，旧测试仍要求 2 张；现已同步。
- 旧失败二为执行网正文和图注中的两处提示性冒号，已改写，公开文案检查通过。

## 文档整理

按 neat-freak 枚举根目录、docs 与相关实验文档，检查当前入口和历史归属。Codex 使用项目 AGENTS.md，没有独立记忆索引；未修改全局配置。

| 文件 | 调整 |
| --- | --- |
| `README.md` | 正式首页、简历入口、验证与交付边界 |
| `TASK_STATUS.md` | 当前实现、完整回归结果与保留事项 |
| `DESIGN.md` | 首页与案例的容器差异、封套、光影、动效和排版合同 |
| `PRODUCT.md` | 首页形式与装饰素材的事实边界 |
| `AGENTS.md` | 首页容器例外、音轨保护和旧版备份要求 |
| `BLOCKED.md` | 合并过时环境记录，保留状态入口 |
| `docs/README.md` | 当前维护入口与历史归属 |
| `docs/briefs/homepage.md` | 当前结构、运行、交互机制与恢复路径 |
| `docs/guides/home-cover-prompts.md` | 最终四张装饰封面的制作提示词 |
| `backups/homepage-before-turntable-2026-09-28/README.md` | 备份范围与恢复方法 |
| `prototype/turntable/README.md` | 合并历轮追加记录，明确仅为本地历史实验 |

PROGRESS.md 继续作为 TASK_STATUS.md 的短入口。历史计划、原始修改建议、案例证据指南与独立工具文档不受首页替换影响，保留原日期和来源，不将旧结论改写成当前合同。AGENTS.md 净增 1 行。

## 保留事项

本地图标概念、旧封面候选及 PNG、实验服务器和代理状态仍留在工作区，未随首页上传。正式构建完全不依赖这些文件。仓库未记录线上地址与托管平台，Git 推送结果需要与线上部署状态区分。
