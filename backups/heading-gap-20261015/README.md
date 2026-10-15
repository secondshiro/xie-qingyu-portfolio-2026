# 章节标题间距修正前备份（2026-10-15）

## 备份内容

| 项目 | 值 |
| --- | --- |
| 备份文件 | `src/styles/case-study.css.bak` |
| 相对源码路径 | `src/styles/case-study.css` |
| 改前 SHA-256 | `3369e20814868ddd48f5f3b4894d3f662294b347b2e1439d434b1cefb173fa4f` |
| 改后 SHA-256 | `f4d764b4e1bbbb3c89ca2a623cd55e83e7afe7ec29b3161918c218db6574b60d` |

## 恢复命令

在仓库根目录执行：

```sh
cp backups/heading-gap-20261015/src/styles/case-study.css.bak src/styles/case-study.css
```

恢复后需要重新构建：`npm run build`。

## 为什么用 `.bak` 后缀

备份若保留 `.css` 后缀会被 `astro check` 扫到并可能触发无关告警。`.bak` 后缀不在扫描范围内。

## 本轮修订依据

用户对比案例页两处标题后指出，章节标题与正文的间距是 0，要求改为工作面标题与正文之间使用的那个间距。

实测确认（脚本 `artifacts/gis-heading-gap-20261015/measure-gap.mjs`）：

| 位置 | 改前 | 改后 |
| --- | --- | --- |
| 章节标题容器 `gap` | 0px | 12.8px |
| 章节 眉标 → 标题 | 12px（来自子级 `margin-bottom`） | 12.8px |
| 章节 标题 → 导语 | 0px | 12.8px |
| 工作面 标题 → 正文 | 12.8px | 12.8px（未变，作为基准） |

原实现由父级 `gap: 0` 与子级 `margin-bottom: 0.75rem` 混用控制间距。按 `DESIGN.md`「相邻距离只由父级 `gap/padding` 或子级 `margin` 的一方负责」，改为统一由父级 `gap: 0.8rem` 承担，并删除眉标的 `margin-bottom` 规则。
