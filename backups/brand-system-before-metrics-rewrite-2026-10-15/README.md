# 品牌系统案例改写前备份

2026-10-15。按 `PRODUCT.md` 的九项改写验收指标改写品牌系统案例前，备份两个源文件。改写内容与会话记录见 `docs/briefs/brand-metrics-rewrite-2026-10-15/`。

## 文件与校验值

| 备份文件 | 原路径 | SHA-256 |
| --- | --- | --- |
| `src/pages/work/brand-system.astro.bak` | `src/pages/work/brand-system.astro` | `7408cd6e61ed871017b62fa0dc4108c1bae266daec841044e59dfa60e9477474` |
| `src/components/BrandAuxiliary.astro.bak` | `src/components/BrandAuxiliary.astro` | `4f5b759632ed2a7d4f78871cc494d0831d11d779ad1193d94a244e6670c918d6` |
| `src/pages/index.astro.bak` | `src/pages/index.astro` | `f116745a1c31604a38b8aca179d05b93076df1b96150972e823730c860563f19` |

`index.astro` 的备份从 `git show HEAD:src/pages/index.astro` 导出，对应改写前的版本，用于回退首页 B 面介绍里去掉页数的那一处改动。

## 恢复命令

在仓库根目录执行。

```bash
cp backups/brand-system-before-metrics-rewrite-2026-10-15/src/pages/work/brand-system.astro.bak src/pages/work/brand-system.astro
cp backups/brand-system-before-metrics-rewrite-2026-10-15/src/components/BrandAuxiliary.astro.bak src/components/BrandAuxiliary.astro
cp backups/brand-system-before-metrics-rewrite-2026-10-15/src/pages/index.astro.bak src/pages/index.astro
```

恢复后核对校验值。

```bash
shasum -a 256 src/pages/work/brand-system.astro src/components/BrandAuxiliary.astro src/pages/index.astro
```

## 说明

- 备份保留相对 `src/` 的目录结构，后缀为 `.bak`，避免被 `astro check` 扫描后因相对导入失败而阻断构建。
- 本轮改动清单与验证结果见 `docs/briefs/brand-metrics-rewrite-2026-10-15/REVIEW.md`。
