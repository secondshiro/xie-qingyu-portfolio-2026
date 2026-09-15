# 公开资产脱敏检查清单

- [x] 项目名、地址、人员/身份、编号、坐标、服务器和时间已做不透明遮挡或替换。
- [x] 保留图层树、地图几何、属性标签、楼层关系、状态色带和旧系统工具语法。
- [x] 三个公开文件均为无元数据 WEBP，宽度不超过 800px。
- [x] 构建只复制公开安全图、被引用的新设计素材、三个原型 HTML 和共享 CSS。
- [x] 原始证据 PNG、母版视频、需求材料和归档页不进入 `dist/`。

每次更新源图后，先在本地运行 `python3 scripts/generate-public-evidence.py`；随后运行
`scripts/build-public.sh` 与 `python3 scripts/check-public-safety.py`，并进行一次人工目视复核。
