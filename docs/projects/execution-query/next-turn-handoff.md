# 执行网查询助手下一轮交接

> 更新于 2026-09-17
> 本地生产助手与作品集案例均已完成，一次真实浏览器小样本验收通过。用户已确认作品集网站公开发布。案例页截图从 2 张扩充到 5 张，并补充结构化视觉组件。下一轮无需重做验证码路线讨论。

## 作品集写作状态

`docs/superpowers/plans/2026-09-13-execution-query-portfolio-writing.md` 已执行完成。案例在 2026-09-15 改为需求起点、网站变化、方案取舍、查询过程、结果与交付、试用与维护六章，旧时间线移除，六个锚点保留。2026-09-16 又更新了首页摘要；页面状态见根目录 `TASK_STATUS.md`。

后续调整以当前页面和 `portfolio-evidence-brief.md` 为准。自动验证码路线只保留为迭代史料，无需再次讨论或恢复。

## 产品定位

- FastAPI 本地控制台是推荐入口。用户从名单开始，不必预先打开执行网。
- Chrome 扩展只承担浏览器桥梁和官网适配。它自动刷新、打开或复用综合查询页，并在官网要求验证时把页面带到前台。
- 安全验证始终由用户人工完成。生产流程不识别、不求解、不绕过验证码。
- 验证完成后，扩展继续列表和详情采集；FastAPI 保存 SQLite 任务历史、变化比较并按需生成 Excel。
- 当前版本代表一个经过验证的阶段。目标网站变化时重新核对页面合同，不承诺永久兼容。

## 当前实现

### 本地工具

- 工作区：`execution-query-tool/`
- 控制台：`http://127.0.0.1:51997/app/`
- 扩展：`execution-query-tool/extension/`
- 固定开发扩展 ID：`pajpkpaekjnjhpkfopldfaloafoogail`
- 当前 Chrome 资料：`second`
- 生产数据库：`execution-query-tool/var/production/`，已被版本控制忽略

已有能力包括批量输入与去重、500 项上限、任务状态、暂停与继续、安全取消、最近任务、成功快照比较、详情采集和三表 Excel。

新批次会先刷新既有 `/zhzxgk/` 页面，清除跨批次过期票据；同一批次内部继续复用页面会话。详情采集在官网主页面环境复用网站自己的 `openZhcxDetail` 同源请求，读取短暂的 `sessionStorage` 响应，只向本地任务返回详情页展示的 7 个字符串字段，不再依赖弹出详情标签。

### 作品集

- 案例页：`src/pages/work/execution-query.astro`
- 页面样式：`src/styles/execution-query.css`
- 首页入口：`src/pages/index.astro`
- 叙事与证据：`docs/projects/execution-query/portfolio-evidence-brief.md`
- 公开证据清单：`public/projects/execution-query/evidence-manifest.json`
- V1 旧工具界面：`public/projects/execution-query/v1-interface-synthetic.webp`
- 当前控制台：`public/projects/execution-query/console-synthetic.webp`
- 等待验证状态：`public/projects/execution-query/verification-waiting-synthetic.webp`
- Excel 交付：`public/projects/execution-query/export-synthetic.webp`
- 试用完成状态：`public/projects/execution-query/trial-completion-synthetic.webp`

公开页面使用真实产品界面与固定虚构数据。阶段只主张一次真实浏览器小样本验收，后续按官网变化维护，没有真实主体、身份、案号、金额、验证码内容或现场任务 ID。

## 现场验收证据

验收任务 `b1ea27063ccc4fb881716bf8f6f0cc1f` 于 2026-09-12 在 Chrome `second` 资料中完成。

1. 本地控制台创建两项合成查询。
2. 扩展刷新并填写官网综合查询页。
3. 官网随机出现文字点选验证，由用户人工完成一次。
4. 第一项返回一条列表记录，详情采集为 1/1，且没有详情错误。
5. 第二项复用同一页面会话，没有再次验证，并确认无记录。
6. 整批任务为 2/2 完成、0 失败。
7. 同一任务导出的 Excel 包含“查询汇总”“案件明细”“未完成”三张表，公式错误扫描为 0，逐表渲染无表头重叠或字段截断。

具体查询内容只存在本机生产数据库，不写入公开文档。验收用临时 Excel、渲染图片和检查脚本已删除。

## 已关闭的故障

- 官网显示结果但验证辅助状态仍为假。等待逻辑现同时接受可用票据或可见结果。
- 三分钟人工等待不足。当前最长等待为 20 分钟。
- 本地一次性会话在人工等待期间过期。现在延后到结果提交前创建。
- 详情链接的 `javascript:` 地址在隔离环境中被 CSP 拦截。现在调用官网主环境中的同源详情函数并直接读取短暂响应。
- 详情采集曾依赖新标签页。当前实现抑制详情弹窗，不再把新标签出现当作成功条件。
- 新批次复用旧页面中的过期票据。现在每个新批次开始前刷新综合查询页。
- Excel 中文表头粘连、日期不可排序和重复“案号”标题。当前按东亚字符宽度设列宽，完成时间写为上海时区日期，重复列标为“详情·案号”。

## 当前验证基线

在 `execution-query-tool/`：

```bash
.venv/bin/pytest -q
cd extension && node --test --test-reporter=tap tests/*.test.mjs
```

- Python：142 项通过
- Chrome 扩展：55 项通过

在作品集根目录：

```bash
npm test
npm run build
npm run test:e2e
```

作品集的验证数量与截图范围统一见根目录 `TASK_STATUS.md`。本文件的 Python 与扩展数字仅指本地工具的验收基线。

浏览器测试需要允许本机 `127.0.0.1:4331` 临时监听。沙箱内出现 `listen EPERM` 时，用已批准的 `npm run test:e2e` 权限重新运行，不要把它判成页面失败。

## 下一阶段候选

当前版本已经满足本轮生产工具和作品集案例目标。下一轮只有在用户明确选择后再做以下之一。

1. 辅助式定时提醒。到期时创建待执行任务并提醒用户打开控制台，不在后台处理安全验证。
2. 更长周期的真实使用验证。继续记录日期、随机题型、人工介入次数和失败分类，公开材料仍需脱敏。
3. Excel 使用细化。根据律师真实使用反馈调整字段顺序、冻结列和打印布局，不先凭想象扩展。
4. 线上信息补全。仓库还没有记录线上 URL、缓存策略和部署命令，处理线上问题前先向用户确认实际托管平台。本地生产工具不随静态站点部署。

## 下一轮开工规则

1. 先读根目录 `README.md`、`TASK_STATUS.md`、`DESIGN.md`，涉及公开定位时再读 `PRODUCT.md`。
2. 再读本文件与 `assistant-mvp-status.md`。旧验证码实验文档只作为迭代证据，不是当前执行方案。
3. 不修改 `/Users/second/Downloads/执行网一键查询/` 归档源项目。
4. 不保存验证码图片、提示字、坐标、页面票据或未脱敏查询内容。
5. 任何页面、网络或详情异常都记录为失败，不能降级成“无记录”。
6. 当前目录已是独立 Git 仓库。未经用户明确授权，不运行提交、推送、重置或清理命令。
