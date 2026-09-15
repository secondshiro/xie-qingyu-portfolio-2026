# 执行网查询作品集案例实施计划

> **面向 AI 代理的工作者：** 必需子技能为 `superpowers:executing-plans`。逐任务实施并使用复选框跟踪。项目规则禁止未经授权执行 Git 提交，因此以测试、截图审查和状态文档作为检查点。

**目标：** 在生产工具与真实证据通过发布闸门以后，创建 `/work/execution-query/` 案例页并加入首页作品索引。

**架构：** 页面复用现有 `CaseHero`、`CaseSection`、`CaseToc` 与 `MediaStage`，媒体只来自 `public/projects/execution-query/` 的脱敏副本。案例按旧版演进、验证机制失效、可靠性闸门、生产重构和阶段边界展开。

**技术栈：** Astro、现有 CSS 变量与案例组件、Node.js 内容测试、Playwright、静态构建。

---

## 前置发布闸门

- [ ] 生产工作台计划全部完成。
- [ ] 两类验证码、记录、空结果、详情、历史比较和 Excel 均有真实验收证据。
- [ ] 至少一组真实运行截图已脱敏，人工确认无法还原主体、身份、案号和金额。
- [ ] `docs/projects/execution-query/portfolio-evidence-brief.md` 的七项最低证据全部更新为“已具备”。

前置条件未满足时不得创建页面文件和首页入口。

## 文件结构

- 创建 `public/projects/execution-query/`，只放脱敏公开媒体和来源清单。
- 创建 `src/pages/work/execution-query.astro`，负责八章案例内容。
- 创建 `src/styles/execution-query-case.css`，只放本案例布局。
- 修改 `src/pages/index.astro`，加入第四个作品折页。
- 修改 `tests/content-boundaries.test.mjs` 与 `tests/public-assets.test.mjs`。
- 修改 `tests/portfolio.spec.ts` 与 `tests/visual.spec.ts`。

## 任务 1：建立公开证据清单

**文件：**

- 创建 `public/projects/execution-query/evidence-manifest.json`
- 创建 `tests/execution-query-evidence.test.mjs`

- [ ] **步骤 1：写失败测试**

```javascript
test("execution query evidence is public-safe and traceable", async () => {
  const manifest = JSON.parse(await readFile(MANIFEST, "utf8"));
  assert.ok(manifest.items.length >= 6);
  for (const item of manifest.items) {
    assert.match(item.source, /^(source-code|real-session|generated-diagram)$/);
    assert.equal(item.redacted, true);
    assert.doesNotMatch(JSON.stringify(item), /captchaId|pCode|身份证号/);
  }
});
```

- [ ] **步骤 2：运行红灯**

```bash
node --test tests/execution-query-evidence.test.mjs
```

- [ ] **步骤 3：复制最小脱敏材料**

每项记录公开文件名、内部来源类型、验证日期、脱敏项目和能支持的主张。不得复制生产数据库、原始 Excel、验证码题图或未脱敏截图。

- [ ] **步骤 4：运行绿灯并逐图查看**

```bash
node --test tests/execution-query-evidence.test.mjs
```

逐张查看原始分辨率，确认模糊区域覆盖姓名、身份、案号和金额，且图注仍能解释界面结构。

## 任务 2：锁定页面事实和禁用表述

**文件：**

- 修改 `tests/content-boundaries.test.mjs`
- 创建 `docs/briefs/execution-query-narrative.md`

- [ ] **步骤 1：写内容边界失败测试**

```javascript
test("execution query case avoids unproved automation claims", async () => {
  const source = await readFile(PAGE, "utf8");
  for (const claim of ["零人工", "完全自动", "永久可用", "24/7", "成功率"])
    assert.equal(source.includes(claim), false);
  assert.match(source, /验证日期/);
  assert.match(source, /失败.*无记录|无记录.*失败/s);
});
```

- [ ] **步骤 2：运行红灯**

```bash
npm test
```

- [ ] **步骤 3：完成叙事简报**

简报逐章列出主张、来源、公开证据和不能下的结论。只写已确认的 v1 至 v4 演进、真实浏览器闭环、生产重构、任务状态、历史比较和导出结果。

- [ ] **步骤 4：检查无占位和事实冲突**

```bash
rg -n "TBD|TODO|待补充|零人工|完全自动|永久可用|24/7" docs/briefs/execution-query-narrative.md
```

预期无匹配。

## 任务 3：实现案例页面骨架

**文件：**

- 创建 `src/pages/work/execution-query.astro`
- 修改 `tests/content-boundaries.test.mjs`

- [ ] **步骤 1：写页面结构失败测试**

```javascript
test("execution query case has one h1 and eight sections", async () => {
  const source = await readFile(PAGE, "utf8");
  assert.equal((source.match(/<h1/g) ?? []).length, 0);
  assert.equal((source.match(/<CaseHero/g) ?? []).length, 1);
  assert.equal((source.match(/<CaseSection/g) ?? []).length, 8);
  assert.match(source, /验证日期/);
});
```

`CaseHero` 负责页面唯一 `h1`，因此源码中不再手写 `h1`。

- [ ] **步骤 2：运行红灯**

```bash
npm test
```

- [ ] **步骤 3：实现八章内容**

```astro
const sections = [
  { id: 'origin', label: '01 / 工作起点' },
  { id: 'evolution', label: '02 / 旧版演进' },
  { id: 'semantics', label: '03 / 状态语义' },
  { id: 'breakage', label: '04 / 网站变化' },
  { id: 'gate', label: '05 / 可行性闸门' },
  { id: 'rebuild', label: '06 / 生产重构' },
  { id: 'workbench', label: '07 / 工作台' },
  { id: 'boundary', label: '08 / 阶段边界' },
];
```

首屏标题使用“把重复查询改成可信的本地工作流”。导语写清旧版演进、网站变化和生产重写，不写虚构指标。

- [ ] **步骤 4：运行内容测试**

```bash
npm test
```

## 任务 4：实现案例专属布局

**文件：**

- 创建 `src/styles/execution-query-case.css`
- 修改 `src/pages/work/execution-query.astro`
- 修改 `tests/visual.spec.ts`

- [ ] **步骤 1：写视觉合同失败测试**

```typescript
test("execution query case keeps the shared type scale", async ({ page }) => {
  await page.goto("/work/execution-query/");
  await expect(page.locator("h1")).toHaveCSS("font-size", "44px");
  await expect(page.locator(".case-section__title").first())
    .toHaveCSS("font-size", "26px");
});
```

- [ ] **步骤 2：运行红灯**

```bash
npm run test:e2e -- --grep "execution query case"
```

- [ ] **步骤 3：实现三类专属组件布局**

页面内使用语义 HTML 实现：

- 版本演进使用纵向阶段列表，不做重复卡片墙。
- 失败分流使用状态流程图，失败和确认无记录分成两条明确路径。
- 生产工作台截图使用统一 16比9 媒体舞台，历史比较和导出使用并列证据。

所有专属选择器以 `.execution-query-page` 开头，不在 `case-study.css` 末尾堆叠覆盖。

- [ ] **步骤 4：运行视觉测试**

```bash
npm run test:e2e -- --grep "execution query case"
```

## 任务 5：首页入口

**文件：**

- 修改 `src/pages/index.astro`
- 修改 `tests/content-boundaries.test.mjs`
- 修改 `tests/portfolio.spec.ts`

- [ ] **步骤 1：写失败测试**

```javascript
test("homepage links the verified execution query case", async () => {
  const source = await readFile(INDEX, "utf8");
  assert.match(source, /href="\/work\/execution-query\/"/);
  assert.match(source, /可信的本地工作流/);
});
```

- [ ] **步骤 2：运行红灯**

```bash
npm test
```

- [ ] **步骤 3：加入第四个 ProjectFold**

```astro
<ProjectFold
  id="execution-query"
  eyebrow="生产工具 · 04"
  title="把重复查询改成可信的本地工作流"
  summary="从旧版批量查询出发，处理网站验证变化，重新整理任务状态、真实浏览器会话、历史比较和导出。"
  href="/work/execution-query/"
  tone="stone"
/>
```

- [ ] **步骤 4：运行首页与深链测试**

```bash
npm test
npm run test:e2e -- --grep "homepage|deep link"
```

## 任务 6：完整响应式、可访问性与构建验收

**文件：**

- 修改 `tests/portfolio.spec.ts`
- 修改 `tests/visual.spec.ts`
- 修改 `TASK_STATUS.md`
- 修改 `DESIGN.md`
- 修改 `README.md`

- [ ] **步骤 1：补充四档与键盘测试**

覆盖 1440、1280、1010、390px，无横向溢出；检查跳到主内容、目录链接、媒体说明、返回作品索引和邮件入口。390px 不隐藏核心文字证据。

- [ ] **步骤 2：运行整站验证**

```bash
npm test
npm run test:e2e
npm run build
```

预期内容测试、全部 Playwright 测试和 Astro 构建通过，构建产物包含 `/work/execution-query/index.html`。

- [ ] **步骤 3：人工检查四档截图**

确认案例标题为桌面 44px、窄屏 40px；章节标题 26px；橙色只用于章节和继续路径；媒体完整、图注对齐、敏感内容不可辨认。

- [ ] **步骤 4：更新项目状态**

写明验证日期、自动化测试结果、真实证据边界和未部署状态。不得把阶段性成功写成长期稳定性承诺。

## 计划自检

- 八章叙事、真实证据、敏感内容、现有组件、视觉合同、首页入口和整站验证均有对应任务。
- 页面只引用 `public/projects/execution-query/`，不依赖旧归档和生产目录。
- 计划没有未经验证的指标、团队人数、用户研究或上线结果。
- 计划没有 Git 操作，符合项目协作规则。
- 页面和首页入口受前置发布闸门约束。

