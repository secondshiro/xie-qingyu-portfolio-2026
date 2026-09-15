# 执行网查询助手作品集写作实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. This project forbids Git staging and commits without explicit user authorization, so tasks end with tests and review checkpoints instead of commits.

**Goal:** 把已经完成的执行网查询助手页面，改写成一个以产品判断、真实证据和明确边界为主的作品集案例。

**Architecture:** 保留 Astro 和现有案例组件，不重建页面模板。叙事按“痛点 → 旧工具 → 网站变化 → 路线判断 → 新工作流 → 现场证据与边界”的因果链展开；每章只承担一个判断，并由一项可追溯证据支持。

**Tech Stack:** Astro、现有 `CaseHero` / `CaseSection` / `CaseToc`、项目 CSS 变量、Node.js 内容测试、Playwright。

---

## 0. 权威上下文

以下结论已经确认、实现并完成小样本验收，本轮不得回退：

1. 项目定位是律师日常查询的本地生产助手，不是验证码演示。
2. FastAPI 本地控制台是主入口；Chrome 扩展是连接官网会话的后台桥梁。
3. 用户不必预先打开执行网。桥梁会自动打开或复用综合查询页。
4. 安全验证由人在执行网页面完成；工具在验证后自动继续。
5. 自动识别验证码因资源、稳定性和行为校验代价退出生产流程，只作为迭代史料。
6. 2026 年 9 月 12 日的真实浏览器小样本闭环已通过：一次人工文字点选验证后，两项合成任务连续完成；分别覆盖有记录及详情、确认无记录，三表 Excel 完成核对。
7. 当前可以写“小样本闭环通过”，不可写“已上线”“长期稳定”“无人值守”或“完全自动”。

### 事实源优先级

出现冲突时按以下顺序取信：

1. `docs/projects/execution-query/next-turn-handoff.md`
2. `docs/projects/execution-query/decision-record.md`
3. `docs/projects/execution-query/assistant-mvp-status.md`
4. `docs/projects/execution-query/portfolio-evidence-brief.md`
5. 2026-09-10 与 2026-09-12 设计规格
6. 旧可行性、验证码尖峰和开源评估文档
7. 旧项目 HTML 文案

第 6–7 级只解释“曾经试过什么”，不能定义当前产品。旧文档中“验证码必须自动通过才发布”的闸门已经失效。

## 1. 页面命题

### 内部写作纲领

> 当第三方网站的安全验证无法稳定自动化时，我把验证收缩为一个人工节点，重新设计了它前后的批量调度、状态语义、历史比较和结果交付。

这句话不必原样放到页面。公开文案要让流程和证据帮助读者自己得出结论。

### 读者在 90 秒内应理解

- 工具来自真实重复劳动，并经历四代迭代。
- 风险不只是“能否点过验证码”，还包括验证、网络或页面失败时不能误报结果。
- 作者主动停止高耗识别路线，保留一个清楚的人工节点。
- 新版是“本地控制台 + 浏览器桥梁 + 本地任务与导出”，不是扩展换皮。
- 现场验收只证明一次有限范围闭环，不代表上线或长期稳定。

### 案例应证明的个人能力

- 从真实工作中提炼产品问题，而不是从展示效果倒推需求。
- 在技术可行性变化时重画产品边界。
- 为风险场景设计状态语义、恢复与证据交付。
- 独立把判断做成可运行、可验证的工具。

## 2. 公开证据账本

| 主张 | 证据 | 公开方式 | 边界 |
| --- | --- | --- | --- |
| 经历四代迭代 | v1–v4 代码与差异 | 结构演进图 | 不展示客户名单和历史数据 |
| 痛点来自真实使用 | 历史查询与 Excel 痕迹 | 描述重复操作链 | 原始材料不公开 |
| 主动停止自动识别 | 尖峰实验与路线评估 | 三路线取舍表 | 不展示题图、坐标或求解细节 |
| 新工作流已实现 | 控制台、扩展、SQLite、Excel | 真实产品界面 + 合成数据 | 明确标注数据属性 |
| 失败不等于无记录 | 状态机、存储和导出测试 | 三分状态流 | 测试项数不是业务成果 |
| 小样本闭环通过 | 2026-09-12 现场任务 | 限定时间线 | 不公开任务 ID 和查询内容 |
| 长期生产价值 | 尚缺长期使用证据 | 不下结论 | 只写按网站变化维护 |

### 证据标签

页面只使用三种标签：

- **真实运行·已脱敏**：真实运行证据已经不可还原敏感内容。
- **真实产品·合成数据**：真实产品界面使用固定虚构数据。
- **结构复现**：从已验证流程或模型重画，不冒充现场截图。

每张图注都必须回答“这是什么”和“它证明什么”。

## 3. 六章叙事骨架

当前 8 章压缩为 6 个阅读任务。原“边界重画”和“迭代取舍”重复，应合并；原“批量工作流”和“结果与导出”属于同一系统链，不再重复解释入口与桥梁。

### 00 / 先看结果：把人工介入收缩到验证瞬间

- 判断：产品价值不以自动通过验证码为前提。
- 证据：真实控制台的合成数据截图，加一条“名单 → 人工验证 → 自动接续 → Excel”流程。
- 文案任务：只说用户从哪里开始、何时介入、工具最后交付什么。

### 01 / 起点与演进：一次查询简单，重复复核才是成本

- 判断：初衷来自工作中的重复劳动，不是作品集选题。
- 证据：v1–v4 从单次查询、批量、历史比较到导出与详情的演进。
- 文案任务：先描述操作链，再解释四代工具为何逐步长出这些能力。

### 02 / 网站变化：旧架构的假设失效

- 判断：问题不是替换一个验证码模块；验证、网页会话、列表和详情已经成为一条不可拆链路。
- 证据：字符图片验证变成随机滑块和文字点选，旧请求链失效。
- 文案任务：只保留与产品决策有关的失败，不列 OCR 引擎、模型大小和坐标细节。

### 03 / 边界决定：停止与验证码比拼

- 判断：生产标准是一批任务能否可靠完成，不是某张验证图能否被识别。
- 证据：本地识别、第三方打码、人工接管的成本与风险对照。
- 文案任务：写清助手负责什么、用户何时介入，以及为什么这个决定仍保留最初价值。

### 04 / 工作流重构：控制台管整批任务，浏览器保留真实会话

- 判断：入口与任务状态应该脱离官网页面，查询会话不能被伪造。
- 证据：控制台负责名单、进度、历史和 Excel；浏览器桥梁负责官网的打开、复用、验证等待和读取。
- 文案任务：用一张职责流和一张真实界面说明系统，不把 FastAPI、SQLite 或扩展权限写成一级标题。
- 子论点：系统明确区分“有记录 / 无记录 / 未完成”，失败项不参与历史比较，三张 Excel 表分别交付。

### 05 / 证据与边界：一次闭环证明了什么

- 判断：现场验收关闭了“当前网站能否跑通”的问题，没有替代长期使用证据。
- 证据：创建两项合成任务 → 人工完成一次文字点选 → 第一项取得列表和 1/1 详情、第二项复用会话确认无记录 → 任务 2/2 完成、0 失败，三表 Excel 通过核对。
- 文案任务：同时写“已验证”和“未证明”。197 项自动化回归降为方法注记，不做成果大数字。

## 4. 文案编辑规则

- 所有公开中文文案必须使用 `human-writing` skill 起草和复核。动笔前读取 `/Users/second/.codex/skills/human-writing/SKILL.md` 与任务命中的现实题材参考；初稿完成后再读取 `references/revision.md` 并运行它提供的检查。
- 成稿标题、正文、图注和引用转述不得出现破折号、提示性冒号、翻案腔及“不是……而是……”的变体。机器字段、代码和网址不受提示性冒号规则影响。
- 每章按“事实 → 判断 → 行动 → 证据 → 边界”组织，但不把五个词都做成标签。
- 每段至少包含一个可核对对象，如“两项合成任务”“三张 Excel 工作表”“确认无记录”。
- 首屏摘要最多 2 句、75 个汉字；章节导语 1 句、45 个汉字。
- 每段 70–140 个汉字，每章最多 3 段。
- 标题陈述变化或判断，不写成“批量查询”“FastAPI”等功能或技术名。
- 少用“不是 X，而是 Y”的口号句，直接陈述决定与原因。
- 技术名只出现在职责分工和项目事实中。
- 个人贡献写具体动作：对照、拆分、重画、实现、验收；不写“全权负责”“全面赋能”。

### 首屏文案基线

```text
标题：执行网查询助手
摘要：当执行网要求真人验证，用户只在这一步接管。助手从名单出发，在验证后继续查询、读取详情，并把结果整理成可回看的任务和 Excel。
阶段：本地重构完成；2026 年 9 月 12 日完成一次真实浏览器小样本闭环
```

### 首页摘要基线

```text
官网验证留给人，助手承接前后的批量任务、详情整理、历史比较和 Excel 交付。
```

## 5. 过去返工的防错清单

| 过去的问题 | 本轮防错 |
| --- | --- |
| 从作品集选题或视觉倒推项目初衷 | 第 01 章先写真实重复工作和 v1–v4 演进 |
| 把测试通过当成用户成果 | 主结果改为现场时间线；197 项只作方法注记 |
| 把失败写成无记录 | 页面和测试共同固定三分语义 |
| 旧文档覆盖新结论 | 本计划固定事实源优先级 |
| 多章重复同一流程 | 每章先写“独占主张”；重复即合并 |
| 技术栈压过产品判断 | 技术只解释职责，不进入一级标题 |
| 合成界面冒充现场截图 | 所有视觉证据必须带证据标签 |
| 用大数字、成功率和省时营造成果 | 只写有出处的日期、样本和结果类型 |
| 验证码求解过程抢走主题 | 求解实验只占一张取舍表 |
| 旧 Safari 外壳被当成真实产品 | 优先使用结构演进图和当前真实界面 |
| 卡片越堆越多代替信息架构 | 两组以上并列卡片改成时间线、流程或单一证据面 |
| CSS 文件尾继续补丁 | 修改原语义规则并删除废弃规则 |
| 页面与状态文档不同步 | 页面、测试、`TASK_STATUS.md` 和交接文档同轮更新 |
| 敏感资料进入公开资产 | 只用合成夹具；真实图必须逐图确认不可还原 |

## 6. 文件变更地图

| 文件 | 动作 |
| --- | --- |
| `src/pages/work/execution-query.astro` | 重写首屏，把 8 章压成 6 章，重排决定与证据 |
| `src/styles/execution-query.css` | 把卡片组改成证据流和时间线，删除失效规则 |
| `public/projects/execution-query/` | 新建公开安全的真实产品截图和证据清单 |
| `src/pages/index.astro` | 详情页稳定后同步一句摘要 |
| `tests/content-boundaries.test.mjs` | 固定事实、禁用语和敏感信息边界 |
| `tests/public-assets.test.mjs` | 检查证据清单和公开文件 |
| `tests/portfolio.spec.ts` | 检查六章顺序、证据标签、时间线和键盘入口 |
| `tests/visual.spec.ts` | 保留三档全页截图，增加首屏和证据章局部截图 |
| `docs/projects/execution-query/portfolio-evidence-brief.md` | 同步最终素材与图注 |
| `TASK_STATUS.md`、`next-turn-handoff.md` | 验收后同步当前状态 |

## 7. 执行任务

### Task 1: 先锁定内容边界

**Files:**

- Modify: `tests/content-boundaries.test.mjs`
- Verify: `docs/projects/execution-query/decision-record.md`
- Verify: `docs/projects/execution-query/next-turn-handoff.md`

- [x] **Step 1: 写失败测试**

```javascript
test('执行网案例公开有限闭环和人工边界', async () => {
  const text = await readFile('src/pages/work/execution-query.astro', 'utf8');
  for (const fact of [
    '安全验证由人完成',
    '一次人工验证',
    '两项合成任务',
    '有记录',
    '无记录',
    '未完成',
    '2026 年 9 月 12 日',
  ]) assert.match(text, new RegExp(fact));

  for (const claim of [
    '完全自动', '零人工', '无人值守', '永久可用',
    '已上线', '长期稳定', '成功率', '24/7',
  ]) assert.equal(text.includes(claim), false);
});
```

- [x] **Step 2: 运行红灯**

Run: `npm test`  
Expected: 只有新增的执行网文案断言失败，其余测试通过。

- [x] **Step 3: 回查证据账本**

任何新增结论先在第 2 节找到来源。找不到来源就删除，不把它改写成更模糊的营销语。

### Task 2: 重写首屏与首页承诺

**Files:**

- Modify: `src/pages/work/execution-query.astro`
- Modify: `src/pages/index.astro`

- [x] **Step 1: 按第 4 节基线改首屏**
- [x] **Step 2: 保留角色、输入、贡献、输出、阶段五项事实**
- [x] **Step 3: 把技术名放到“输出”，把产品判断留在“贡献”**
- [x] **Step 4: 只读首屏，确认可以回答谁何时介入、助手负责什么、交付什么、证据到哪一步**

### Task 3: 按因果链重排六章

**Files:**

- Modify: `src/pages/work/execution-query.astro`
- Modify: `src/styles/execution-query.css`
- Modify: `tests/portfolio.spec.ts`

- [x] **Step 1: 固定目录**

```javascript
const tocSections = [
  { id: 'result', label: '00 / 先看结果' },
  { id: 'origin', label: '01 / 起点与演进' },
  { id: 'breakage', label: '02 / 网站变化' },
  { id: 'decision', label: '03 / 边界决定' },
  { id: 'system', label: '04 / 工作流重构' },
  { id: 'evidence', label: '05 / 证据与边界' },
];
```

- [x] **Step 2: 写浏览器结构测试**

```typescript
test('执行网案例按产品决策的因果链展开', async ({ page }) => {
  await page.goto('/work/execution-query/');
  const ids = await page.locator('.case-section').evaluateAll((sections) =>
    sections.map((section) => section.id),
  );
  expect(ids).toEqual([
    'result', 'origin', 'breakage', 'decision', 'system', 'evidence',
  ]);
});
```

- [x] **Step 3: 合并重复内容**

将现有 `change` 保留为 `breakage`；将 `boundary` 与 `evolution` 合并为 `decision`；将 `workflow` 与 `data` 合并为 `system`；将 `status` 改为 `evidence`。

- [x] **Step 4: 删除失去用途的 CSS**

直接修改原选择器和父级布局。不得在 `execution-query.css` 文件尾新增一组覆盖旧规则的补丁。

### Task 4: 用真实产品界面替换手绘控制台

**Files:**

- Create: `public/projects/execution-query/evidence-manifest.json`
- Create: `public/projects/execution-query/console-synthetic.webp`
- Create: `public/projects/execution-query/export-synthetic.webp`
- Modify: `src/pages/work/execution-query.astro`
- Modify: `tests/public-assets.test.mjs`

- [x] **Step 1: 使用隔离的合成夹具复现状态**

覆盖有记录、无记录、未完成、新增、存续和本次未见。不得读取 `execution-query-tool/var/production/`。

- [x] **Step 2: 截取当前真实控制台和 Excel**

图注统一标记“真实产品·合成数据”。不复制旧 Safari 外壳，不使用真实任务数据库。

- [x] **Step 3: 写证据清单**

每项包含 `file`、`kind`、`supports`、`publicSafe`。`kind` 只允许 `real-run-redacted`、`real-product-synthetic-data`、`structural-reconstruction`。

```json
{
  "updated": "2026-09-13",
  "items": [
    {
      "file": "console-synthetic.webp",
      "kind": "real-product-synthetic-data",
      "supports": "本地控制台的批量任务、状态和人工验证接续结构",
      "publicSafe": true
    },
    {
      "file": "export-synthetic.webp",
      "kind": "real-product-synthetic-data",
      "supports": "三张工作表的导出结构和失败分流",
      "publicSafe": true
    }
  ]
}
```

- [x] **Step 4: 增加公开资产测试**

检查文件存在、类型有效，并扫描验证码票据、身份号码、任务 ID 和真实案号格式。

### Task 5: 用现场时间线收尾

**Files:**

- Modify: `src/pages/work/execution-query.astro`
- Modify: `src/styles/execution-query.css`
- Modify: `tests/portfolio.spec.ts`

- [x] **Step 1: 将三张状态卡改为四步时间线**

时间线严格使用第 3 节的现场事实，不展示真实任务 ID 或查询内容。

- [x] **Step 2: 相邻呈现边界**

```text
这次验收证明了当前网站下的人工验证接续、两项批次复用、详情读取与导出链路。它不证明无人值守、长期稳定或对下一次网站变化的兼容。
```

- [x] **Step 3: 降低自动化测试数字权重**

若保留“197 项检查”，仅放在章节末尾的方法注记中，不再用成果大卡呈现。

### Task 6: 反营销与反重复编辑

**Files:**

- Modify: `src/pages/work/execution-query.astro`
- Verify: `src/pages/index.astro`

- [x] **Step 1: 为每章写一句内部“独占主张”**
- [x] **Step 2: 若两章可被同一句概括，合并或删除一章**
- [x] **Step 3: 扫描风险表达**

Run:

```bash
rg -n "赋能|引领|革新|颠覆|极致|高效|智能化|完全自动|零人工|无人值守|成功率|24/7|已上线|长期稳定" src/pages/work/execution-query.astro src/pages/index.astro
```

Expected: 无未解释命中。

- [x] **Step 4: 检查抽象名词密度**

同一段出现两个以上“价值、闭环、可靠、体系”等抽象词时，优先改成对象、操作、状态或交付物。

### Task 7: 完整验收并同步状态

**Files:**

- Modify: `tests/portfolio.spec.ts`
- Modify: `tests/visual.spec.ts`
- Modify: `docs/projects/execution-query/portfolio-evidence-brief.md`
- Modify: `TASK_STATUS.md`
- Modify: `docs/projects/execution-query/next-turn-handoff.md`

- [x] **Step 1: 运行内容与资产检查**

Run: `npm test`  
Expected: 全部通过。

- [x] **Step 2: 运行静态检查与构建**

Run: `npm run build`  
Expected: Astro 0 errors / 0 warnings / 0 hints，并生成 `/work/execution-query/index.html`。

- [x] **Step 3: 运行完整浏览器回归**

Run: `npm run test:e2e`  
Expected: 全部通过；1440、1280、1010、390px 无横向溢出；只有一个 `h1`；跳到主内容、目录、返回索引和邮件入口可用。

- [x] **Step 4: 人工看图**

重点查看 1440px 首屏、1010px 系统章、390px 全页、路线决定章和证据章。确认真实界面是主要证据，移动端时间线不横向滚动，现场结论与未证明边界在同一视野。

- [x] **Step 5: 最终事实回查**

页面中的每个数字、日期和状态都必须指回第 0 节或证据账本。不能指回的内容直接删除。

- [x] **Step 6: 同步状态**

仅在验收完成后同步 `portfolio-evidence-brief.md`、`TASK_STATUS.md` 与 `next-turn-handoff.md`，三者使用相同的章节数、素材状态和测试结果。

## 8. 完成定义

- 首屏独立说明人工节点、助手职责、交付物和当前证据阶段。
- 六章没有重复完成同一个解释任务。
- 验证码实验只服务于路线取舍，不抢占案例中心。
- 真实产品界面使用合成数据并清楚标注。
- 现场小样本结果与长期边界相邻出现。
- 不把测试项数、示意计数或合成数据写成业务成果。
- 每项公开主张可追溯，且不包含敏感信息。
- 视觉继续使用“展开式作品册”，不抄旧 HTML、不堆卡片和 CSS 补丁。
- 内容、构建、浏览器验证与三档人工看图全部完成。

## 9. 计划自检

- 覆盖当前产品定位、人工验证边界、控制台入口、真实浏览器小样本和三表导出。
- 将过去返工转成了具体防错规则和测试。
- 没有占位、虚构指标、团队人数、用户研究或上线结果。
- 公开素材与生产数据明确隔离。
- 计划不包含 Git 操作，符合项目协作规则。
