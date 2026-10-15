# 执行网案例改写前备份

2026-10-15。改写前的 `src/pages/work/execution-query.astro`。

## 文件

| 项 | 值 |
| --- | --- |
| 原文件 | `src/pages/work/execution-query.astro` |
| 备份 | `backups/execution-query-before-metrics-rewrite-2026-10-15/src/pages/work/execution-query.astro.bak` |
| SHA-256 | `61ba34075e5a94dfbee2c8fee8f98eed7bfb535e9e01ccc0083b70b69ce904a5` |
| 行数 | 273 |

备份保留相对 `src/` 的目录结构，后缀用 `.bak`，避免被 `astro check` 扫到后面因相对导入失败而让构建报错。

## 恢复

```bash
cd /Users/second/Documents/作品集网站
cp backups/execution-query-before-metrics-rewrite-2026-10-15/src/pages/work/execution-query.astro.bak \
   src/pages/work/execution-query.astro
shasum -a 256 src/pages/work/execution-query.astro
```

恢复后应得到上表的 SHA-256。

## 本次改动范围

只改案文章的公开文字，涉及首屏、六节正文与卡片说明，另把 01 末段的两段合并为一段，并新增一段需求来源。页面 `title`、首屏 `eyebrow` 与 `facts`、六节 `label` 与锚点、目录、图片引用与替代文本、图注、四段结构化组件的标签、页尾、组件、样式与脚本均未改。

改写依据与逐处对照见 [改写稿](../../docs/briefs/execution-query-metrics-rewrite-2026-10-15/REWRITE.md)，执行与验证记录见同目录 `REVIEW.md`。
