# 谢擎宇个人作品集

一个以真实产品证据为核心的 Astro 静态作品集。当前包含四个案例、个人定位与作品索引首页，以及三个站内互动原型。

网站主身份为产品体验设计师，差异化方向为复杂业务与 AI 工作流、原型和工具实践。首页使用可选择的封套与唱机呈现四个作品，真实媒体证据仍位于案例页。

## 页面

- `/`：个人定位、代表作品与联系入口。
- 首页定位文案下方提供 JD 定向简历下载：`public/resume/xie-qingyu-resume.pdf`（两页 A4）。离线排版源为 `tools/build-resume.py`，使用含 ReportLab 的 Python 环境生成，不参与网站构建。
- `/work/real-estate-gis/`：房产 GIS 体验重构完整案例。
- `/work/edgecase-planner/` 展示从真实设计评审中整理 AI 检查规则的工具实践。
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
- `npm run test:e2e` 检查整站响应式、键盘访问、减弱动效和深链，以及首页换片中断、持续旋转、无脚本入口与 16∶9 构图，并检查四个案例的转场时序与返回状态。GIS 任务原型另有转办、校验及内嵌／新窗口一致性检查。
- `npm run build` 同时执行 Astro 检查与静态构建，产物位于 `dist/`。

浏览器测试使用本机 Google Chrome，并在 `127.0.0.1:4331` 启动临时静态服务。

## 发布状态

2026-10-19 完成首页文案改写草稿与配套阅读地图，提供 A 紧凑版和 B 完整版的对照、版面实测及待决定项。草稿和截图已入档，首页源码未修改。文档整理与 Git 交付见 [首页文案交接记录](docs/history/home-copy-draft-2026-10-19.md)。

2026-10-16 已恢复 GIS 任务原型的转人工、楼盘变更和校验警示流程，保留已采纳的字号、间距与卡片布局，补齐双入口检查和交接文档。更新已随 `bec3d9c` 推送至 `origin/main`，并核对远端一致。本轮 Git 交付见 [同步记录](docs/history/git-delivery-2026-10-16.md)，当前上下文见 [TASK_STATUS.md](TASK_STATUS.md)。

2026-10-15 已完成 GIS 连续阅读修订、Edgecase 与执行网案例改写、品牌系统改写及章节调整，补入投诉页需求检查前后对比图，并统一案例标题字重与章节间距。网站更新、配套记录和恢复备份已按授权随 `ccef88a` 推送至 `origin/main`，推送后已核对远端一致。该轮验证与交付结果见 [Git 同步记录](docs/history/git-delivery-2026-10-15.md)，当前待办见 [TASK_STATUS.md](TASK_STATUS.md)。

用户于 2026-09-15 确认网站已公开发布。本轮用户提供的公开地址为 [作品集网站](https://xie-qingyu-portfolio-2026.pages.dev/)，仓库尚未记录已核实的部署流程。Git 推送和线上更新分别确认。此前过程见 [历史状态快照](docs/history/status-before-git-sync-2026-10-15.md)。

## 项目结构

```text
src/components/       站点与案例组件
src/pages/            首页和案例页
src/styles/           首页独立样式、设计变量与案例样式
public/images/home/   首页装饰封面
backups/              替换前首页源码与恢复说明
public/projects/      四个案例的公开媒体与原型复制品
tests/                内容、资源、行为和视觉检查
docs/                 规格、实施计划、审查与专题指南
portfolio-site-handoff/  2026-09-02 的历史输入材料
```

## 设计与内容边界

- 网站使用暖白、石色、墨色和克制橙色。首页彩胶与封面使用独立装饰色，不能将房产产品蓝扩展为导航品牌色。
- 案例首屏标题采用文章型层级：桌面 44px、窄屏 40px、字重 400；案例章节标题固定 26px，不随宽屏继续放大。
- 案例目录是单个页面级吸附树：14px 文字、紧凑分支、单个橙色圆点随当前章节移动。
- 案例图片、视频和原型预览会阻止右键菜单与拖拽，普通页面区域保持原有操作。这项处理不是加密，公开资源仍可通过开发者工具读取或被截图。
- 不虚构项目成果、上线数据、用户研究或其他完整案例。
- 不跨目录引用源项目；只修改本项目 `public/` 中的公开复制品。

详细规则见 [DESIGN.md](DESIGN.md)，当前状态见 [TASK_STATUS.md](TASK_STATUS.md)，协作约束见 [AGENTS.md](AGENTS.md)。

房产 GIS 的当前与历史截图、原型入口及引用关系见 [素材索引](docs/guides/gis-media-index.md)。

文档阅读顺序、有效说明与历史材料范围见 [文档索引](docs/README.md)。
