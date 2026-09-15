# 个人作品集网站首版 Implementation Plan

> **归档说明：** 这是已完成的实施计划，不是当前待办。继续工作请先读根目录 `TASK_STATUS.md` 和 `AGENTS.md`。

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建可独立静态运行的 Astro 作品集首版，包含展开式作品索引首页、房产 GIS 完整案例页、真实公开安全素材与三个站内互动原型。

**Architecture:** 使用 Astro 纯静态输出，站点壳层、首页折页、案例章节、媒体舞台和原型框架各自保持单一职责。所有房产 GIS 媒体与原型复制到 `public/projects/real-estate-gis/`，页面只引用站内绝对 URL；测试同时检查内容边界、资源完整性、响应式溢出和源路径泄漏。

**Tech Stack:** Astro、TypeScript、CSS、Node.js test runner、Playwright、静态 HTML/CSS/JavaScript 原型。

**Repository note:** 当前目录不是独立 Git 仓库，上层 `/Users/second` 存在大量无关变更。执行过程中不得运行 `git add` 或 `git commit`；只有用户明确同意在本目录初始化独立仓库后，才增加提交步骤。

---

## File map

- `package.json`：构建、检查、单元测试和浏览器测试入口。
- `astro.config.mjs`、`tsconfig.json`：Astro 静态站点与严格 TypeScript 配置。
- `src/layouts/SiteLayout.astro`：文档元信息、跳转链接、方向合同与全站资源入口。
- `src/components/SiteNav.astro`、`SiteFooter.astro`：全站导航和联系页尾。
- `src/components/ProjectFold.astro`：首页连续折页项目段。
- `src/components/CaseHero.astro`、`CaseSection.astro`：案例事实首屏和统一章节节奏。
- `src/components/MediaStage.astro`：图片、视频、图注与证据类型。
- `src/components/PrototypeFrame.astro`：桌面 iframe、静态降级和完整原型入口。
- `src/pages/index.astro`：个人定位与作品索引首页。
- `src/pages/work/real-estate-gis.astro`：房产 GIS 完整案例叙事。
- `src/styles/tokens.css`、`global.css`、`case-study.css`：唯一设计变量、全站基础与案例专用布局。
- `public/projects/real-estate-gis/media/`：经允许公开的真实截图、视频和旧系统证据。
- `public/projects/real-estate-gis/prototypes/`：总图、整幢与实测替换预测三个原型及依赖。
- `tests/content-boundaries.test.mjs`：事实边界、联系方式和绝对源路径检查。
- `tests/public-assets.test.mjs`：页面资源与三个深链入口检查。
- `tests/portfolio.spec.ts`：四个目标宽度、键盘、减弱动效、iframe 降级和横向溢出检查。
- `playwright.config.ts`：以 `astro preview` 作为浏览器测试服务。
- `DESIGN.md`：完成审查后记录正式设计系统与使用规则。

## Task 1: 建立静态站点骨架与第一组失败测试

**Files:**
- Create: `package.json`
- Create: `astro.config.mjs`
- Create: `tsconfig.json`
- Create: `tests/content-boundaries.test.mjs`

- [x] **Step 1: 写内容边界失败测试**

```js
// tests/content-boundaries.test.mjs
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const pages = ['src/pages/index.astro', 'src/pages/work/real-estate-gis.astro'];

test('公开页面只展示批准的邮箱和定位', async () => {
  const text = (await Promise.all(pages.map((file) => readFile(file, 'utf8')))).join('\n');
  assert.match(text, /AI 原生产品体验设计师/);
  assert.match(text, /second988@qq\.com/);
  assert.doesNotMatch(text, /(?:\+?86[- ]?)?1[3-9]\d{9}/);
});

test('站点代码不引用只读源项目绝对路径', async () => {
  const text = (await Promise.all(pages.map((file) => readFile(file, 'utf8')))).join('\n');
  assert.doesNotMatch(text, /\/Users\/second\/Documents\/0工作/);
  assert.doesNotMatch(text, /\.\.\/.*信创迭代/);
});
```

- [x] **Step 2: 运行测试并确认因页面不存在而失败**

Run: `node --test tests/content-boundaries.test.mjs`

Expected: FAIL，错误包含 `ENOENT` 和 `src/pages/index.astro`。

- [x] **Step 3: 创建依赖与命令配置**

```json
{
  "name": "qingyu-portfolio",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "astro dev",
    "build": "astro check && astro build",
    "preview": "astro preview",
    "test": "node --test tests/*.test.mjs",
    "test:e2e": "playwright test"
  },
  "dependencies": {
    "@astrojs/check": "latest",
    "astro": "latest",
    "typescript": "latest"
  },
  "devDependencies": {
    "@playwright/test": "latest"
  }
}
```

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';

export default defineConfig({ output: 'static' });
```

```json
{
  "extends": "astro/tsconfigs/strict"
}
```

- [x] **Step 4: 安装依赖并确认 Astro 可执行**

Run: `npm install && npx astro --version`

Expected: 安装成功并输出 Astro 版本号；`package-lock.json` 被创建。

## Task 2: 建立共享设计系统与站点壳层

**Files:**
- Create: `src/styles/tokens.css`
- Create: `src/styles/global.css`
- Create: `src/layouts/SiteLayout.astro`
- Create: `src/components/SiteNav.astro`
- Create: `src/components/SiteFooter.astro`

- [x] **Step 1: 定义唯一站点变量**

```css
/* src/styles/tokens.css */
:root {
  --color-paper: #f7f7f4;
  --color-ink: #26251e;
  --color-stone: #e8e6e0;
  --color-panel: #eeede8;
  --color-accent: #f54e00;
  --color-line: rgb(38 37 30 / 10%);
  --font-sans: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
  --page-inline: clamp(1rem, 3vw, 3rem);
  --container: 82.5rem;
  --reading: 45rem;
  --section-space: clamp(5rem, 9vw, 7.5rem);
  --radius-media: 0.625rem;
  --focus: 0 0 0 3px var(--color-paper), 0 0 0 6px var(--color-ink);
}
```

- [x] **Step 2: 建立无 JavaScript 也可读的全局基础**

`src/styles/global.css` 必须包含 `box-sizing`、暖白背景、系统字体、单一 `.site-container`、可见 `:focus-visible`、44px 最小操作高度、跳转链接、图片失败时仍保持比例、`prefers-reduced-motion` 和 `overflow-wrap`。禁止增加第二套容器宽度变量。

- [x] **Step 3: 创建站点壳层并放入方向合同**

```astro
---
import '../styles/tokens.css';
import '../styles/global.css';
import SiteNav from '../components/SiteNav.astro';
import SiteFooter from '../components/SiteFooter.astro';

interface Props { title: string; description: string; current?: 'home' | 'work'; }
const { title, description, current } = Astro.props;
---
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width" />
    <meta name="description" content={description} />
    <title>{title}</title>
  </head>
  <body>
    <!-- THESIS: 作品集是一份连续展开的产品设计专刊；真实作品先证明能力，拒绝卡片墙和长简历首页。
    OWN-WORLD: 暖白与柔和石色色面、墨色无衬线、克制橙色折页标记、大型无设备框产品画面、极少边界。
    STORY: 访客先理解 AI 原生产品体验定位，再看到真实 GIS 证据，进入完整案例或发送邮件。
    FIRST VIEWPORT: 52px 导航；上部约 40% 为中等尺度定位与邮箱；下部约 60% 为全宽 GIS 画面；第二折露出案例标题。
    FORM: 展开式作品册，七个候选方向中的第 4 个，seed aeb67359；批准构图为 unfolding-folio-b.webp。
    FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md -->
    <a class="skip-link" href="#main">跳到主要内容</a>
    <SiteNav current={current} />
    <slot />
    <SiteFooter />
  </body>
</html>
```

- [x] **Step 4: 创建紧凑导航和页尾**

导航固定为姓名、“作品”和邮箱三个可达入口；首页“作品”指向 `#selected-work`，案例页指向 `/`。页尾只显示一句联系邀请、`mailto:second988@qq.com` 和版权信息，不加入手机号、社交账号或虚构入口。

- [x] **Step 5: 运行类型检查**

Run: `npx astro check`

Expected: PASS，0 errors。

## Task 3: 复制真实媒体与三个原型

**Files:**
- Create: `public/projects/real-estate-gis/media/**`
- Create: `public/projects/real-estate-gis/prototypes/map/**`
- Create: `public/projects/real-estate-gis/prototypes/building/**`
- Create: `public/projects/real-estate-gis/prototypes/task/**`
- Create: `tests/public-assets.test.mjs`

- [x] **Step 1: 写资源清单失败测试**

```js
// tests/public-assets.test.mjs
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

const required = [
  'public/projects/real-estate-gis/media/final/02-map-object-context.png',
  'public/projects/real-estate-gis/media/final/12-building-current-overview.png',
  'public/projects/real-estate-gis/media/final/13-task-relations-focus.png',
  'public/projects/real-estate-gis/media/public/legacy-map-observed.webp',
  'public/projects/real-estate-gis/media/public/legacy-building-overview-observed.webp',
  'public/projects/real-estate-gis/prototypes/map/index.html',
  'public/projects/real-estate-gis/prototypes/building/index.html',
  'public/projects/real-estate-gis/prototypes/task/index.html'
];

test('公开媒体和原型入口完整', async () => {
  await Promise.all(required.map((path) => access(path)));
});

test('复制后的原型不引用源项目相对位置', async () => {
  const files = required.filter((path) => path.endsWith('.html'));
  const text = (await Promise.all(files.map((path) => readFile(path, 'utf8')))).join('\n');
  assert.doesNotMatch(text, /\.\.\/\.superpowers|\.\.\/screen/);
  assert.doesNotMatch(text, /\/Users\/second/);
});
```

- [x] **Step 2: 运行测试并确认资源不存在**

Run: `node --test tests/public-assets.test.mjs`

Expected: FAIL，错误包含 `ENOENT`。

- [x] **Step 3: 从只读源复制公开素材**

将源项目 `portfolio/assets/final/`、`portfolio/assets/public/` 完整复制到 `public/projects/real-estate-gis/media/`；保留 `public/DEIDENTIFICATION_CHECKLIST.md` 作为审计依据。不要复制 `final/08-core-demo-master*.mov`，网页视频只保留 `final/08-core-demo-80s.mp4`。

- [x] **Step 4: 复制总图原型及依赖**

复制 `screen/gis-spatial-workspace-v0.2.html` 为 `prototypes/map/index.html`，复制 `screen/workspace-tdesign.css` 与 `screen/assets/gis-base-map-shipai.jpg` 到同一原型目录对应位置。把总图中的整幢入口改为 `../building/index.html?...`，任务入口改为 `../task/index.html?...`，保留 `building`、`code`、`from` 与 `restore` 参数。

- [x] **Step 5: 复制整幢和任务原型及依赖**

复制 `.superpowers/brainstorm/78846-1786605806/content/building-view-fullscreen-workspace.html` 为 `prototypes/building/index.html`，复制其 `assets/17-building-plan-reference.png` 和 `screen/workspace-tdesign.css`，把 CSS 路径改为本目录 `workspace-tdesign.css`。复制 `screen/06-unit-mapping.html` 为 `prototypes/task/index.html`，并复制 `colors_and_type.css`、`system.css`、`tdesign-tokens.css`、`workspace-tdesign.css`；将返回总图入口改为 `../map/index.html?restore=1...`。

- [x] **Step 6: 运行资源测试**

Run: `npm test`

Expected: `public-assets` 中两个测试 PASS；内容测试仍因页面未创建而失败。

## Task 4: 实现首页首屏和展开式作品索引

**Files:**
- Create: `src/components/ProjectFold.astro`
- Create: `src/components/MediaStage.astro`
- Create: `src/pages/index.astro`
- Modify: `src/styles/global.css`

- [x] **Step 1: 创建媒体舞台**

`MediaStage.astro` 接收 `src`、`alt`、`caption`、`kind: 'confirmed' | 'observed' | 'redesigned'`、`width`、`height` 和可选 `priority`。输出语义化 `figure`、固定宽高图片、证据标签与 `figcaption`；不得把证据类型只用颜色表达。

- [x] **Step 2: 创建折页组件**

`ProjectFold.astro` 接收 `id`、`title`、`eyebrow`、`summary`、`href` 和 `tone: 'stone' | 'paper'`，由父级 `gap/padding` 管理节奏。唯一主悬停动作是橙色折页标记水平移动 6px；减弱动效下立即变化。

- [x] **Step 3: 实现首页真实内容**

首页只有一个 `h1`，准确包含“AI 原生产品体验设计师”。首屏副句表达“把复杂问题转化为清晰的产品结构，在多端体验、视觉系统与 AI 协作之间建立可执行的设计方案”，提供邮箱链接，并使用 `/projects/real-estate-gis/media/final/02-map-object-context.png` 作为首个真实产品画面。第二折显示“房产 GIS 体验重构”和“空间 → 对象 → 任务”，链接到 `/work/real-estate-gis/`。

- [x] **Step 4: 补齐低权重能力与经历摘要**

只使用 `PRODUCT.md` 已确认内容：12 年跨视觉、品牌与产品体验积累；复杂系统设计、多端体验、视觉系统、AI 工作流与 Agent / Workflow。该区不显示项目卡片、不生成详情链接、不写成果数字。

- [x] **Step 5: 实现四档首屏布局**

桌面首屏导航 52px，定位区约 40%、产品舞台约 60%；1010px 保持全宽画面；390px 取消重叠和透视，先标题后完整静态画面。所有宽度使用 `max-width: 100%` 和 `min-width: 0` 防止横向溢出。

- [x] **Step 6: 运行内容边界与 Astro 检查**

Run: `npm test && npx astro check`

Expected: 所有 Node 测试 PASS，Astro 0 errors。

## Task 5: 实现案例组件与完整 GIS 叙事

**Files:**
- Create: `src/components/CaseHero.astro`
- Create: `src/components/CaseSection.astro`
- Create: `src/components/PrototypeFrame.astro`
- Create: `src/pages/work/real-estate-gis.astro`
- Create: `src/styles/case-study.css`

- [x] **Step 1: 创建案例事实首屏**

`CaseHero.astro` 接收标题、摘要和事实数组。事实固定为角色、输入、贡献、输出与证据边界；内容必须从源案例与基线提炼，不写上线结果或未提供的团队规模。

- [x] **Step 2: 创建统一章节栅格**

`CaseSection.astro` 接收 `id`、`label`、`title` 和可选 `tone`。桌面使用 160px 标签列加弹性正文列，1010px 以下转单列；章节外距只由该组件根节点的 `padding-block: var(--section-space)` 管理。

- [x] **Step 3: 创建可降级原型框架**

`PrototypeFrame.astro` 接收 `src`、`title`、`poster`、`posterAlt` 和 `linkLabel`。宽度大于 720px 时显示 iframe 和完整入口；720px 以下隐藏 iframe，显示静态证据、桌面原型说明和独立打开入口。iframe 必须有准确 `title`、`loading="lazy"` 和同源 URL。

- [x] **Step 4: 迁移案例叙事**

按以下顺序建立章节并保留来源口径：案例事实；真实最终产品画面；项目源头与 Confirmed/Observed/Inferred/Redesigned 证据方法；问题与机会；SuperMap、DataV Atlas、飞书多维表格三类公开参照；空间—对象—任务三个工作面；状态色、平面图层级、卡片与表格三个取舍；价值假设与待验证边界；AI 协作与人工判断；返回作品索引和邮箱。

- [x] **Step 5: 接入三个原型深链**

```text
/projects/real-estate-gis/prototypes/map/index.html?restore=1&building=宇济一号&code=17幢
/projects/real-estate-gis/prototypes/building/index.html?building=宇济一号&code=17幢&owner=1&room=1501
/projects/real-estate-gis/prototypes/task/index.html?building=宇济一号&code=17幢&from=gis&step=3&view=cards&filter=review
```

每个入口都配套真实静态证据，分别使用 `02-map-object-context.png`、`12-building-current-overview.png`、`13-task-relations-focus.png`。

- [x] **Step 6: 验证案例结构与构建**

Run: `npm test && npm run build`

Expected: Node 测试全部 PASS；Astro check 0 errors；生成 `dist/index.html` 与 `dist/work/real-estate-gis/index.html`。

## Task 6: 增加浏览器级响应式与无障碍验证

**Files:**
- Create: `playwright.config.ts`
- Create: `tests/portfolio.spec.ts`

- [x] **Step 1: 配置本地预览测试**

```ts
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  use: { baseURL: 'http://127.0.0.1:4321' },
  webServer: {
    command: 'npm run build && npm run preview -- --host 127.0.0.1',
    url: 'http://127.0.0.1:4321',
    reuseExistingServer: true
  }
});
```

- [x] **Step 2: 写四宽度和溢出测试**

```ts
import { expect, test } from '@playwright/test';

for (const width of [1440, 1280, 1010, 390]) {
  test(`首页和案例在 ${width}px 无横向溢出`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ['/', '/work/real-estate-gis/']) {
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      expect(overflow).toBeLessThanOrEqual(1);
      await expect(page.locator('h1')).toHaveCount(1);
    }
  });
}

test('窄屏隐藏 iframe 并保留完整原型入口', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/work/real-estate-gis/');
  await expect(page.locator('iframe')).toBeHidden();
  await expect(page.getByRole('link', { name: /打开完整/ })).toHaveCount(3);
});
```

- [x] **Step 3: 补充键盘、焦点和减弱动效测试**

测试 Tab 首次聚焦“跳到主要内容”，Enter 后焦点/滚动进入 `#main`；项目入口、三个完整原型入口和邮箱依次可聚焦；`reducedMotion: 'reduce'` 时首页舞台与橙色标记的 computed transition duration 为 `0s`。

- [x] **Step 4: 安装浏览器并运行测试**

Run: `npx playwright install chromium && npm run test:e2e`

Expected: 四宽度、窄屏降级、键盘和减弱动效测试全部 PASS。

## Task 7: 视觉截图回归与集中修正

**Files:**
- Create: `artifacts/screenshots/home-1440.png`
- Create: `artifacts/screenshots/home-1280.png`
- Create: `artifacts/screenshots/home-1010.png`
- Create: `artifacts/screenshots/home-390.png`
- Create: `artifacts/screenshots/case-1440.png`
- Create: `artifacts/screenshots/case-390.png`
- Modify: `src/styles/global.css`
- Modify: `src/styles/case-study.css`

- [x] **Step 1: 一次性捕获全部目标宽度**

使用 Playwright 在 1440、1280、1010、390px 捕获首页全页截图，并捕获案例页 1440 与 390px 全页截图。浏览器字体与缩放保持默认 100%。

- [x] **Step 2: 对照批准稿检查首屏**

对照 `.impeccable/mocks/homepage/unfolding-folio-b.webp`，只比较结构、尺度、色面、图像占比和第二折露出量；不复制生成稿中的 GIS 字段或地图。列出所有问题后一次性修改。

- [x] **Step 3: 检查长案例节奏**

确认同级章节对齐、每屏只有一个阅读任务、媒体没有被重复卡片化、产品蓝只存在于作品证据、390px 没有 iframe 或横向滚动。集中修正后只再捕获一轮确认截图。

- [x] **Step 4: 重跑完整验证**

Run: `npm test && npm run test:e2e && npm run build`

Expected: 全部 PASS，`dist/` 不含源项目绝对路径。

## Task 8: 完成审计、文档与状态交接

**Files:**
- Create: `DESIGN.md`
- Modify: `TASK_STATUS.md`
- Modify: `docs/superpowers/specs/2026-09-02-portfolio-site-redesign-design.md`

- [x] **Step 1: 扫描发布产物安全边界**

Run: `rg -n '/Users/second|0工作|信创迭代|tel:' dist src public || true`

Expected: 无绝对源路径、手机号或电话链接；原型内业务演示文字不作为错误处理。

- [x] **Step 2: 检查方向合同保留**

Run: `rg -n 'THESIS:|OWN-WORLD:|FINISH:' dist/index.html dist/work/real-estate-gis/index.html`

Expected: 两个页面的构建产物均包含方向合同。

- [x] **Step 3: 运行 Impeccable detector、finish reviewer 与 documenter**

以实际首页与案例页、最终截图和构建结果为输入完成检测；修复 blocker/high 问题。若工具不可用，记录缺失工具与人工等价检查，不伪称自动审查通过。

- [x] **Step 4: 写入 `DESIGN.md`**

记录视觉命题、颜色与字体变量、单一容器、折页结构、案例章节网格、媒体/证据标签、响应式规则、可访问性、允许与禁止的扩展方式，以及最终审查结论。

- [x] **Step 5: 更新规格与任务状态**

将设计规格状态改为“已实现并验证”，并在 `TASK_STATUS.md` 记录实际创建文件、复制素材、执行命令、测试结果、截图路径、未决风险和下一步。不得保留“尚未创建 package.json/src”等过期描述。

- [x] **Step 6: 最终验收**

Run: `npm test && npm run test:e2e && npm run build`

Expected: 所有测试与构建 PASS；首页和案例页均可从 `dist/` 静态访问；源项目文件未被修改。

---

## Self-review result

- Spec coverage: 首页、案例页、共享组件、真实媒体、三个原型、四档响应式、错误降级、可访问性、安全检查、方向合同、截图审查和 `DESIGN.md` 均有对应任务。
- Placeholder scan: 计划未使用 TBD/TODO/PLACEHOLDER；所有路径、测试命令、深链和关键内容边界已明确。
- Type consistency: `MediaStage`、`ProjectFold`、`CaseHero`、`CaseSection`、`PrototypeFrame` 的属性名称在定义与页面使用任务中保持一致。
- Known constraint: 计划有意不包含 Git 提交，因为当前项目没有独立仓库且上层仓库存在大量无关状态。
