# 章节标题与正文间距修正（2026-10-15）

## 起因

用户对比案例页两处标题后指出，章节标题「技术迁移是背景，我重排的是任务路径」与下方正文完全贴在一起，而工作面标题「让当前楼栋的信息与操作靠在一起」与正文之间留有空隙，要求把章节标题的间距改成后者那个参数。

## 实测

用 Playwright 逐页测量标题底边与紧接着正文顶边的距离，脚本与原始数据在 `artifacts/gis-heading-gap-20261015/`。

| 位置 | 改前 | 改后 |
| --- | --- | --- |
| 章节标题容器 `gap` | 0px | 12.8px |
| 章节 眉标 → 标题 | 12px | 12.8px |
| 章节 标题 → 导语 | 0px（四个页面共 30 处） | 12.8px |
| 工作面 标题 → 正文 | 12.8px（房产 GIS 与品牌系统各 3 处） | 12.8px（基准，未变） |

12.8px 即 `0.8rem`，来自 `.workspace__header div { gap: 0.8rem }`。

## 排查范围

扫过 `src/styles/` 下所有 `gap: 0`，共四处。

- `.case-section__header`：本次修正对象。
- `.case-hero__facts`：事实表，行与行之间由 `border-bottom` 分隔，间距为 0 属有意设计。
- `.home-turntable.css` 的 `.showcase`：首页版式，与该问题无关。
- `execution-query.css` 的 `row-gap: 0`：该页组件内部布局，与该问题无关。

首屏 `.case-hero__copy` 的间距为 `1.5rem`，本身已有间距。因此案例页里标题紧贴正文的只有章节标题一处。

## 判定依据

原实现由父级 `gap: 0` 与子级 `.case-section__header .case-section__label { margin-bottom: 0.75rem }` 混用控制间距。`DESIGN.md` 的 Layout 一节写明「相邻距离只由父级 `gap/padding` 或子级 `margin` 的一方负责」，因此改为统一由父级 `gap: 0.8rem` 承担，并删除眉标的 `margin-bottom` 规则。

眉标与标题的间距随之由 12px 变为 12.8px，差异 0.8px，肉眼不可见。

## 改动

只改 `src/styles/case-study.css`。

```css
.case-section__header {
  display: grid;
  width: 100%;
  gap: 0.8rem;
}
```

同时删除 `.case-section__header .case-section__label { margin-bottom: 0.75rem; }` 整条规则。

备份在 `backups/heading-gap-20261015/`，改前 `case-study.css` 的 SHA-256 为 `3369e208…`，改后为 `f4d764b4…`。

## 验证

- `npm test` 7/7 通过。
- `npm run build` 五页，0 错误、0 警告，保留 1 条既有临时脚本类型提示。
- 间距复测：四个案例页的章节标题容器 `gap` 均为 12.8px，眉标到标题、标题到导语均为 12.8px，与工作面标题一致。
- `npm run test:e2e -- --workers=1` 结果与上一轮一致，5 项失败仍是转场探针的既有问题，与本轮无关。
