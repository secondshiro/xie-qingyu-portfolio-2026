# 谢擎宇个人作品集

一个以真实产品证据为核心的 Astro 静态作品集。当前包含四个案例、个人定位与作品索引首页，以及三个站内互动原型。

## 页面

- `/`：个人定位、代表作品与联系入口。
- 首页“关于”提供 JD 定向简历下载：`public/resume/xie-qingyu-resume.pdf`（两页 A4）。离线排版源为 `tools/build-resume.py`，使用含 ReportLab 的 Python 环境生成，不参与网站构建。
- `/work/real-estate-gis/`：房产 GIS 体验重构完整案例。
- `/work/brand-system/`：新禾智飞品牌系统提案（提案案例；旧触点真实投产，物料未投产）。
- `/work/execution-query/`：执行网查询助手，从四代旧工具到人工验证、批量查询与本地导出的重构。
- `public/projects/real-estate-gis/prototypes/`：总图、整幢、实测替换预测三个桌面原型。

## 本地运行

需要 Node.js 与 npm。依赖已锁定在 `package-lock.json`。

```bash
npm install
npm run dev
```

生产预览使用：

```bash
npm run build
npm run preview
```

## 验证

```bash
npm test
npm run test:e2e
npm run build
```

- `npm test` 检查公开内容边界、素材和原型入口。
- `npm run test:e2e` 检查四档宽度、键盘访问、减弱动效和深链。
- `npm run build` 同时执行 Astro 检查与静态构建，产物位于 `dist/`。

浏览器测试使用本机 Google Chrome，并在 `127.0.0.1:4331` 启动临时静态服务。

## 项目结构

```text
src/components/       站点与案例组件
src/pages/            首页和案例页
src/styles/           设计变量、全站样式、案例样式
public/projects/      公开安全的 GIS 与品牌媒体、原型复制品
tests/                内容、资源、行为和视觉检查
docs/                 规格、实施计划、审查与专题指南
portfolio-site-handoff/  2026-09-02 的历史输入材料
```

## 设计与内容边界

- 网站使用暖白、石色、墨色和克制橙色；房产产品蓝只存在于作品截图与原型。
- 案例首屏标题采用文章型层级：桌面 44px、窄屏 40px、字重 400；案例章节标题固定 26px，不随宽屏继续放大。
- 案例目录是单个页面级吸附树：14px 文字、紧凑分支、单个橙色圆点随当前章节移动。
- 不虚构项目成果、上线数据、用户研究或其他完整案例。
- 不跨目录引用源项目；只修改本项目 `public/` 中的公开复制品。

详细规则见 [DESIGN.md](DESIGN.md)，当前状态见 [TASK_STATUS.md](TASK_STATUS.md)，协作约束见 [AGENTS.md](AGENTS.md)。

房产 GIS 的当前与历史截图、原型入口及引用关系见 [素材索引](docs/guides/gis-media-index.md)。


## 2026-09-04 AI评审案例补充

新增 `/work/edgecase-planner/` 与首页入口，基于真实飞行设计评审和信创原型修复材料。早期“仅GIS具备完整材料”的描述属于首版历史；此次已具备独立工具实践案例证据。沿用现有视觉与文案规范，未发布。其他既有案例保持现状。
