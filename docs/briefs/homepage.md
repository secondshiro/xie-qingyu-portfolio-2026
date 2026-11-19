# 首页结构与维护

首页入口为 `src/pages/index.astro`，独立样式为 `src/styles/home-turntable.css`，选片与 A/B 面状态由 `src/scripts/turntable.js` 维护。唱机模型和材质分别位于 `RetroTurntable.astro`、`src/lib/retro-turntable.ts` 与 `src/styles/retro-turntable.css`。

## 作品入口

低空智航排首位并默认选中，其后是房产 GIS、AI 评审、品牌系统提案、执行网助手与粤见。封套标题下显示项目性质与一句贡献或交付。A 面介绍设计判断，B 面交代交付与阶段。公开定位文案以正式网址为准。

鼠标悬停、键盘聚焦均可预览，点击或 Enter 打开案例。触屏点按封套直接进入。方向键和页面上的方向控件可换片与切面，封套内的 Home／End 可到首尾。封套在无脚本时仍可访问，作品介绍下另有六条直达链接。

## 布局与动效

首屏在 1200px 起将唱机放在介绍右侧，较窄屏幕纵向排列。封套架与作品介绍置于首屏下方，576px 以上六张横排，576px 及以下两列。封套提示下方留 44px，桌面两栏时封套架与 A/B 面介绍间隔 40px。字体、音轨纹路和缩放规则见[设计规范](../../DESIGN.md#首页唱机与封套)。

唱机是可用指针、Enter 和空格操作的原生按钮。开盖、换片、翻面和鼠标跟随复用同一组几何状态。跨页返回时按案例路径恢复作品与 A/B 面，旧版保存的数字索引也可恢复。减弱动效模式直接同步结果。

配乐列表与案例共用。维护曲目、静音和跨页恢复时查阅[配乐指南](../guides/case-music.md)。封面仅用于首页装饰，制作记录见[封面指南](../guides/home-cover-prompts.md)。

## 验证

运行 `npm test`、`npm run build` 和 `npm run test:e2e`。首页专项位于 `tests/turntable.spec.mjs`、`tests/turntable-hover.spec.mjs` 与 `tests/home-music.spec.mjs`。旧版实现与当时的验收结果见[唱机交付记录](../history/home-retro-release-2026-11-12.md)。
