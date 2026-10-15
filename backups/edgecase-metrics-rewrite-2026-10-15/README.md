# Edgecase 案例按改写指标改写前的备份

2026-10-15。本轮把 `PRODUCT.md` 的九项改写验收指标回填到 Edgecase 案例页，同时删掉 `EdgecaseDemo` 中三条重复的图注说明，并为 03 增加一屏物业投诉页截图与两栏布局。此目录保存改动前的三个源文件与草稿阶段的对照文本。

## 文件

| 备份文件 | 对应源文件 | 改前 SHA-256 | 改后 SHA-256 |
| --- | --- | --- | --- |
| `src/pages/work/edgecase-planner.astro.bak` | `src/pages/work/edgecase-planner.astro` | `8761dd5cef4c77f97e937c59074b0bfa5243e484adf11e270f190989721a778f` | `4b014b9a9230d8926543f46666c5076b791c547722944907c029abb619ea8bef` |
| `src/components/EdgecaseDemo.astro.bak` | `src/components/EdgecaseDemo.astro` | `f70b8fa88430a325192a939dab61da0a1d77dea40d9097bc62c2232421e7a7d0` | `d488d7bc576771a63651790f3178527eb35288c26be45746832620afe553fc36` |
| `src/styles/edgecase-examples.css.bak` | `src/styles/edgecase-examples.css` | `a688ddde3037673e476fecc5977a39f44f700f108358e7330922b2240f0f6e0c` | `91d3830de8915fed69dad12856f15b8d6907477ead372cd030f78c1d885cbb93` |

新增素材 `public/projects/edgecase-planner/complaint-form.png` 是本轮新增文件，SHA-256 为 `f7eaa72db3b53ce5ce7e41d41155c53d562e2c29a7b018f90afc5136eeebe83a`，改前不存在。

`REWRITE-DRAFT.md` 是回填前的草稿版本，保留下来便于对照草稿与成稿的差异，不作为当前页面描述。

样式文件的备份从 `HEAD` 取出，与改动前的磁盘内容一致。

## 恢复命令

在仓库根目录执行以下命令，可把三个源文件恢复到本轮改动前，并撤掉新增素材。参考实现与产物记录仍留在 `docs/briefs/edgecase-metrics-rewrite-2026-10-15/`。

```bash
cp backups/edgecase-metrics-rewrite-2026-10-15/src/pages/work/edgecase-planner.astro.bak src/pages/work/edgecase-planner.astro
cp backups/edgecase-metrics-rewrite-2026-10-15/src/components/EdgecaseDemo.astro.bak src/components/EdgecaseDemo.astro
cp backups/edgecase-metrics-rewrite-2026-10-15/src/styles/edgecase-examples.css.bak src/styles/edgecase-examples.css
mv public/projects/edgecase-planner/complaint-form.png /tmp/complaint-form.png
```

恢复后运行 `npm test` 与 `npm run build` 复核。素材文件用 `mv` 移出而不是删除，方便确认后再处理。
