# 改写前备份：房产 GIS 案例页

2026-10-15，按 `PRODUCT.md` 的「改写验收指标」改写 `src/pages/work/real-estate-gis.astro` 前留存。

- 备份内容：改写前的页面源码，对应提交为改写前的 `main` 状态。
- SHA-256：`f154887c8c3f1d2bbb2c6652a6e00f6d9e6331709fc27d93a4d05145848c84ff`
- 文件后缀为 `.bak`，避免被 `astro check` 当作站点页面扫描，因此不影响 `npm run build`。

## 恢复方式

```bash
cp backups/real-estate-gis-before-metrics-rewrite-2026-10-15/src/pages/work/real-estate-gis.astro.bak \
   src/pages/work/real-estate-gis.astro
```

改写范围、逐条对照与九项指标复核见 `docs/briefs/gis-metrics-rewrite-2026-10-15/REWRITE.md`，执行记录见同目录 `REVIEW.md`。
