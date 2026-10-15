# 备份 · 新增投诉页对比图替换（2026-10-15）

本目录保存 03 / Plan 设计前一节替换素材前的旧文件。

## 归档文件

| 路径 | SHA-256 | 说明 |
|---|---|---|
| `public/projects/edgecase-planner/complaint-form.png` | `f7eaa72db3b53ce5ce7e41d41155c53d562e2c29a7b018f90afc5136eeebe83a` | 原 03 节素材，750×1160。2026-10-15 从「完整页面预览.svg」按 `y=570`、`height=580` 裁切，只含附件区与提交栏。 |

`docs/briefs/edgecase-metrics-rewrite-2026-10-15/REWRITE.md` 只在此表外被引用，文件未移动。

## 替换后的文件

| 路径 | SHA-256 |
|---|---|
| `public/projects/edgecase-planner/complaint-form-compare.png` | `22b6e1eb2dd876a308e392247b3e12e6bd8f9aefc5c5f45f8b0f065eaa6ccd87` |
| `src/pages/work/edgecase-planner.astro` | `1814e4cd97e01a2adfef709a737f466d6e5e5e77267744ec5e806da065c52c1f` |

对比图当日重出过几次，上表只记最终值，沿革见下节。

## 对比图的版本沿革

右半（改版）当日先后用过三个输入，画布也随之改过一次。

| 版本 | 右半内容 | 画布 | 校验值 |
|---|---|---|---|
| 第一版 | 我按 `0工作/客诉/docs/design-system.md` 绘制的改版 | 870×1682 | 曾写到 `complaint-form-compare.png`，SHA `b7d0a1356269757e0cdc80969f54ea8d0d248ad704880fe08b65d9c5fb91ccbe`，已被覆盖 |
| 第二版 | 用户本人的改版 `完整页面预览2.svg`（17:07 稿，缺字数计数） | 912×1698 | SHA `9ddf13ef9f11d95b16263b7a95bf676cd7aa3435127762fb985d421b9abe9299`，已被覆盖 |
| 第三版 | 同一份 SVG 的 17:33 稿，补上投诉内容的「0 / 500」字数计数 | 912×1698 | 见上表 |

第一版的生成脚本与产物归档在 `artifacts/edgecase-compare-20261015/`（该目录在 `.gitignore` 中）。其中 `compare-board@2x.png` 是同一模板的重建，画布同为 870×1682，SHA `55ef32b5833a7f9354f47814a5a17583f173128f053ad09513300472b03d8ff8`，与上表那一次写出的文件编码不同。第二、三版的生成链在 `artifacts/edgecase-compare2-20261015/`。

## 恢复命令

```bash
cp backups/edgecase-compare-2026-10-15/public/projects/edgecase-planner/complaint-form.png \
   public/projects/edgecase-planner/complaint-form.png
```

恢复后需把 `src/pages/work/edgecase-planner.astro` 中 03 节的 `MediaStage` 换回单图版本，并恢复 `src/styles/edgecase-examples.css` 的 `.complaint-check` 两栏规则。两处改动的完整前后文本见 `docs/briefs/edgecase-compare-2026-10-15/COMPARE.md`。

## 说明

旧素材未被删除，只是不再被页面引用。它仍是原设计稿下半部分的单张留存材料，如需在别处使用可直接取用。
