# 旧首页备份

保存于 2026-09-28，内容为替换唱机首页前的完整首页源码、ProjectFold、SiteLayout、导航、页脚和全局样式及 tokens。对应替换前 Git 基线为 `c7fd701`。此目录不在 Astro 路由内，不增加公开页面。

恢复首页时，将本目录 `src/pages/index.astro` 复制回项目同路径。原组件仍保留在项目中，通常无需恢复其他文件；只有依赖被改动后才对照备份逐项恢复，避免覆盖案例页的新改动。公开 PDF 和项目媒体仍使用项目现有 `public/`。

恢复后运行 `npm test`、`npm run test:e2e` 和 `npm run build`。首页交互测试与新首页绑定，需要随恢复方案调整。
