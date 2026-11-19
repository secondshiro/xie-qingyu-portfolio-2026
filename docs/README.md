# 文档索引

先阅读[项目说明](../README.md)与[当前状态](../TASK_STATUS.md)。修改界面时查看[设计规范](../DESIGN.md)，修改定位或案例文案时查看[产品原则与改写验收](../PRODUCT.md#案例叙述原则)。协作与发布规则见 [AGENTS.md](../AGENTS.md)。

## 维护指南

| 要做的事 | 入口 |
| --- | --- |
| 查找页面、安装依赖或构建 | [项目说明](../README.md) |
| 修改首页唱机、封套与 A/B 面 | [首页维护](briefs/homepage.md) · [封面制作记录](guides/home-cover-prompts.md) |
| 修改首页或案例配乐 | [随行唱片](guides/case-music.md) |
| 新增案例入口或修改转场 | [统一页面转场](guides/page-transitions.md) |
| 修改 GIS 证据、内嵌原型和独立入口 | [GIS 素材索引](guides/gis-media-index.md) · [任务原型交接](briefs/gis-prototype-2026-10-16/REVIEW.md) |
| 维护执行网案例材料 | [作品证据简报](projects/execution-query/portfolio-evidence-brief.md) · [执行网资料索引](projects/execution-query/README.md) |
| 维护公共简历 | [离线排版脚本](../tools/build-resume.py) |
| 查证某个版本的交付范围 | [当前状态](../TASK_STATUS.md) · [历次记录](history/) |

## 简历维护

网站直接提供 `public/resume/xie-qingyu-resume.pdf`。在装有 ReportLab 的 Python 环境运行 `python3 tools/build-resume.py` 可重排。默认读取 macOS 字体，可用 `RESUME_FONT` 和 `RESUME_FONT_BOLD` 指定匹配字体，并用 `RESUME_OUTPUT` 先输出到待检查的位置。带头像的版本需要本机 `tools/assets/resume-photo.png`，排版后核对 A4 单页、链接、字体嵌入和项目顺序。

## 历史材料

- [项目简报](briefs/)保留改写依据、备选案与分阶段验收。上线文案以正式网址为准。
- [早期审查](reviews/)与[历次设计规格](superpowers/)用于回溯决定。读到与现行实现不同的说明时，回到当前代码、设计规范和状态页核对。
- GIS 原始需求和职责归属见[事实与贡献对照](briefs/gis-evidence-revision/EVIDENCE.md)。执行网生产助手在本地独立目录 `execution-query-tool/`，其运行说明随该工具维护。
- 本地备份、面试材料、试验和未采用稿已有独立目录。原始材料路径及恢复方式见本机备份记录。
