# 唱机首页设计实验

2026-09-28，已选方案接入正式首页。后续维护使用 `src/pages/index.astro`、`src/styles/home-turntable.css` 和 `src/scripts/turntable.js`，流程见 [正式首页维护](../../docs/briefs/homepage.md)。本目录仅保留实验，不能据此覆盖正式代码。

本地实验可用 `TURNTABLE_PORT=4334 node prototype/turntable/serve.mjs` 打开，光影比较位于 `/assets/covers/vinyl-studies.html`。用户选定 B 斜向柔和高光。正式构建包含最终 v5 封面，旧 PNG、其他候选和实验页面不随站点发布。

正式回归已合并到 `tests/turntable.spec.mjs`，运行根目录三项验证即可。旧首页另存于 `backups/homepage-before-turntable-2026-09-28/`。本目录的旧测试和历史记录只用于追溯实验过程。
