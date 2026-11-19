# 谢擎宇个人作品集

以产品界面、设计取舍和交互原型为证据的 Astro 静态作品集。首页通过唱机、封套速览与 A/B 面介绍串联六个案例，并提供公共简历与邮箱入口。

正式版本见 [作品集网站](https://xie-qingyu-portfolio-2026.pages.dev/)。公开文案和上线状态以正式网址核验为准。交付范围和验证记录见 [当前状态](TASK_STATUS.md)。

## 页面

| 路由 | 内容 |
| --- | --- |
| `/` | 个人定位、作品索引、关于、邮箱和 PDF 简历 |
| `/work/low-altitude-operations/` | 低空智航运营服务平台，综合大屏、移动端和后台的界面与交互设计 |
| `/work/real-estate-gis/` | 房产 GIS 体验重构，附总图、整幢、实测替换预测三个桌面原型 |
| `/work/edgecase-planner/` | 从设计评审提炼 AI 检查规则的工具实践 |
| `/work/brand-system/` | 新禾智飞品牌规范与物料提案 |
| `/work/execution-query/` | 执行网查询助手的人工验证、批量查询与本地导出 |
| `/work/yuejian/` | 粤见非遗概念小程序的十一屏高保真原型与纸张动效 |

## 本地运行

需要 Node.js 与 npm。在项目根目录安装锁定依赖并启动开发服务。

```bash
npm ci
npm run dev
```

`npm run build` 先运行 Astro 类型检查，再生成 `dist/`。运行 `npm run preview` 可预览构建产物。

## 验证

```bash
npm test
npm run build
npm run test:e2e
```

基础测试检查公开内容边界和资源。浏览器测试检查响应式、键盘与减弱动效、页面转场、六首配乐、GIS 内嵌与独立入口，以及粤见移动端原型。默认使用本机 Google Chrome，并在 `127.0.0.1:4331` 启动临时服务。

## 目录

| 目录 | 用途 |
| --- | --- |
| `src/pages/` | 首页与案例路由 |
| `src/components/`、`src/layouts/` | 站点与案例组件 |
| `src/styles/`、`src/scripts/`、`src/lib/` | 样式变量与运行逻辑 |
| `public/projects/` | 公开作品媒体和站内原型 |
| `public/audio/`、`public/images/home/` | 六首配乐和首页装饰封面 |
| `public/resume/` | 单页 A4 公共简历 |
| `tests/`、`tools/` | 验证、静态服务与离线简历排版 |
| `docs/` | 维护入口、设计依据和交付历史 |
| `work/`、`backups/` | 本地工作材料和恢复副本 |

从 [文档索引](docs/README.md) 查找专题维护入口。视觉规则见 [设计规范](DESIGN.md)，协作约束见 [项目协作规则](AGENTS.md)。
