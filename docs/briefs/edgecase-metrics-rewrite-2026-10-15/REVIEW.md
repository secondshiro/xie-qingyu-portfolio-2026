# Edgecase 案例按改写指标回填的执行记录

2026-10-15。承接同目录 `REWRITE.md`（改写依据、逐条对照与九项复核）与 `backups/edgecase-metrics-rewrite-2026-10-15/`（改前源码与草稿对照）。下文保留改写阶段的一屏截图与两栏布局记录，03 节随后替换为 [需求检查前后对比图](../edgecase-compare-2026-10-15/COMPARE.md)，后续统一 Git 交付见 [同步记录](../../history/git-delivery-2026-10-15.md)。

## 用户决定

用户在本轮开始时对三项待定逐一答复。

| 待定项 | 用户答复 | 本轮执行 |
| --- | --- | --- |
| `EdgecaseDemo` 中三条与正文重复的 `demo-prompt` | 按推荐处理 | 删除 download、recovery、upload 三条，保留 `selection` 的操作提示「试着全选、翻页，再回来。选择会丢失。」 |
| 05 回查举例「导入与导出」没有材料支撑 | 可以截取 `0工作/客诉/out/新增投诉/完整页面预览.svg` 的部分来用 | 回查场景收到有记录的上传与预审。该截图的用途落到 03，即它所属的物业投诉环节 |
| 四次 Plan 输出是否写进页面 | 看是否能证明能力，但控制字数 | 只在首屏 summary 末句改为「规则在四个真实任务上跑过，也随使用反馈修订。」，比原句多 2 个汉字 |

## 执行内容

- 文字：按 `REWRITE.md` 替换 40 处文本，新增 07 的一段集中边界说明；删除 03 原「我把附件上传与投诉提交分开检查」段（同义复述）。
- 组件：`src/components/EdgecaseDemo.astro` 删 3 行 `demo-prompt`，无其他改动。
- 媒体：从 `0工作/客诉/out/新增投诉/完整页面预览.svg`（375×1166）按 `y=570`、高 580 裁切，导出 `public/projects/edgecase-planner/complaint-form.png`，750×1160，28 KB。只含图片与视频添加入口和底部固定提交栏。
- 布局：`src/styles/edgecase-examples.css` 新增 `.complaint-check`（1fr／1.35fr，`align-items: start`）与其中 `.question-compare` 的单列规则，并把 `.complaint-check` 加入既有的 55rem 折叠选择器。
- 备份：`backups/edgecase-metrics-rewrite-2026-10-15/` 保存 `edgecase-planner.astro`、`EdgecaseDemo.astro`、`edgecase-examples.css` 三个改前文件与草稿文本，`README.md` 记录改前与改后的 SHA-256 及恢复命令。样式文件的备份取自 `HEAD`，与改动前磁盘内容一致。

## 验证

- `npm test` 为 7/7 通过。
- `npm run build` 生成五页，0 错误、0 警告，保留 1 条既有临时脚本类型提示。
- `npm run test:e2e -- --workers=1` 为 **80 通过、5 失败**。失败项为四个案例的键盘往返与触屏封套单点，与既有多轮记录完全一致，均卡在转场阶段断言。
- 首次运行曾出现 78 通过、7 失败，多出的 2 项是 `portfolio.spec.ts` 的 1010px 与 390px 溢出检查，报错为 `net::ERR_CONNECTION_REFUSED`，即静态预览服务在运行中掉线，不是页面断言失败。清理测试产物后重跑，恢复到 80/5。
- 专项复核（脚本与截图在 `artifacts/edgecase-metrics-rewrite-20261015/`，不纳入版本库）覆盖 1440、1010、656、390px。横向溢出均为 0，`main h1` 均为 1，页面无脚本错误；六张案例图（新增的 `complaint-form.png` 与原有五张）`naturalWidth` 均大于 0。
- 文字扫描：案例页 `main` 可见文字中无「：」「—」「–」，无「不是……而是」类对举句式；`http://` 与 `https://` 按既有豁免处理。03 新增图注与替代文本同样通过。
- 目视复核：01 三张示意图去掉说明句后不再复述正文，高度略有收缩；03 在 1440px 为图左文右、在 390px 折为单列；07 末段的集中边界说明落在文末。截图见 `artifacts/edgecase-metrics-rewrite-20261015/` 的 `origin-1440.png`、`method-1440.png`、`method-390.png`、`flight-1440.png`、`boundary-1440.png`。

## 交付状态与遗留

- 改写阶段仅完成本地修改；随后单张截图移入 `backups/edgecase-compare-2026-10-15/`，页面采用 `public/projects/edgecase-planner/complaint-form-compare.png`。页面与配套记录纳入上方统一 Git 交付。
- 工作区中另有 `docs/briefs/brand-metrics-rewrite-2026-10-15/` 与 `docs/briefs/execution-query-metrics-rewrite-2026-10-15/`，由其他会话产生，本轮未触碰。
- 素材归属及先后关系已于 2026-10-15 确认，两版均为用户本人在英山客诉项目里的设计稿，左版在需求检查之前，右版为检查后的改版。07 原导语中请求复用的确切含义仍待确认。
- 本轮不处理 01 卡片 01、03 缺少当时处理结果的问题；`REVIEW.md` 与 `docs/reviews/2026-09-04-edgecase-sources.md` 都没有这项记录，不补造。
