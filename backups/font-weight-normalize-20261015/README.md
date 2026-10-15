# 字重归一前备份（2026-10-15）

## 备份内容

| 项目 | 值 |
| --- | --- |
| 备份文件 | `src/styles/case-study.css.bak` |
| 相对源码路径 | `src/styles/case-study.css` |
| 改前 SHA-256 | `6cda48ce3d9bf0f54eb78b1e5f04cf30d55082caf8dfbf72e629397e0f176eee` |
| 改后 SHA-256 | `3369e20814868ddd48f5f3b4894d3f662294b347b2e1439d434b1cefb173fa4f` |

## 恢复命令

在仓库根目录执行：

```sh
cp backups/font-weight-normalize-20261015/src/styles/case-study.css.bak src/styles/case-study.css
```

恢复后需要重新构建：`npm run build`。

## 为什么用 `.bak` 后缀

备份若保留 `.astro`/`.css` 后缀会被 `astro check` 扫到。`.bak` 后缀不在扫描范围内，避免构建时报无关错误。

## 本轮修订依据

用户指出 05 设计取舍的第 01 张卡片标题「业务状态和当前选中分别表达」字重过粗、不合规范，并要求排查全文同类用法。

实测四个案例页的标题字重后发现，`global.css` 的 `h1, h2, h3 { font-weight: 560 }` 只被首屏 `h1`、章节 `h2`、工作面 `h3` 三处覆盖为 400 或 500，以下位置漏在外层，落在 560 或浏览器默认 700 上。

- 卡片标题 560：`.reference-card h3`、`.value-card h3`、`.decision-card h3`、`.boundary-card h3`
- 正文小标题 560：`.case-copy h3`（仅 Edgecase 页使用）
- 标签加粗 700：`.evidence-key b`、`.workspace-notes b`
- 页尾标题 560：`.case-closing h2`

依据 `DESIGN.md` 的 Typography 层级（Headline 章节标题 400、Title 工作面标题 500）统一为两档，页尾 `h2` 与全站 `h2` 口径对齐为 400。
