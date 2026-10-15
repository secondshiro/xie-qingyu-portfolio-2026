# 案例页备份：阅读记录修订前

备份时间 2026-10-15。对应提交 `f869087`（按改写验收指标重写房产 GIS 案例文案）。

## 内容

| 文件 | 说明 |
| --- | --- |
| `src/pages/work/real-estate-gis.astro.bak` | 修订前源码，保留相对 `src/` 的目录结构 |

SHA-256 校验值，与备份时工作区文件一致。

```
e74cf971f583b7e4e796b57997bdad3bdf7ad0c3ef9c0693d57c1494437b8868
```

## 为什么用 `.bak` 后缀

`.astro` 结尾的备份会被 `astro check` 扫到，因相对导入指向不到组件而让 `npm run build` 报 6 条 `ts(2307) Cannot find module`。`.bak` 不在扫描范围内。

## 恢复

```bash
cp backups/real-estate-gis-before-reader-pass-fixes-2026-10-15/src/pages/work/real-estate-gis.astro.bak \
   src/pages/work/real-estate-gis.astro
```

或直接从版本库取：

```bash
git checkout f869087 -- src/pages/work/real-estate-gis.astro
```

## 本次修订依据

依据 `docs/briefs/gis-reader-pass-2026-10-15/READER-PASS.md` 的 21 项阅读复核结论，处理其中的文字与图示问题。R-18（00 章节标签）未改。
