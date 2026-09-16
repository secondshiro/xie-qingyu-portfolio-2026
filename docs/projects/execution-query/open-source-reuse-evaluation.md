# 执行网验证码开源复用评估

历史实验材料。自动验证码路线已退出生产流程，文中的阶段闸门与下一步不再作为执行任务。当前方案见 [专项交接](next-turn-handoff.md)。

> 评估日期：2026-09-10  
> 目标：优先复用成熟组件，避免为当前 Tianai Captcha 适配重复制造通用能力。

## 结论

没有发现可直接安装后完整接管“执行网查询 + Tianai 随机滑块/文字点选 + 同会话列表与详情”的单一项目。最稳妥的路线是组合复用：

1. 以 Tianai 官方源码作为页面协议和行为验收的事实来源；
2. 文字点选复用 ddddocr 1.6.1 的本地 ONNX 识别能力；
3. 滑块以 `hongshuo-wang/local-captcha-solver` 的定位、可信拖拽、反馈纠偏和结果确认作为实现基线，补充 Tianai 专属适配；
4. 现有透明轮廓定位保留为 Tianai 定向候选，和开源项目的多路定位结果做置信度择优；
5. Mieru-OCR 与 Slidex 继续作为浏览器交互、轨迹生成和异常处理的补充参照，不整包引入。

这不是继续重造通用验证码库，而是只保留执行网专属的薄适配层：定位当前弹层、把题图送入本机识别、把受限动作回放到当前标签，并在同一会话读取结果。

## 候选比较

| 项目 | 能复用的部分 | 不适合整包替换的原因 | 许可证 | 决策 |
| --- | --- | --- | --- | --- |
| [dromara/tianai-captcha](https://github.com/dromara/tianai-captcha) | 官方 DOM、图片比例、轨迹数据结构、滑块校验条件、文字点选提交机制 | 它是验证码生成与校验端，不是求解器；目标网站的服务端不可替换 | Apache-2.0 | 作为兼容性事实来源 |
| [hongshuo-wang/local-captcha-solver](https://github.com/hongshuo-wang/local-captcha-solver) | 通用滑块发现、多路缺口定位、可信 CDP 拖拽、轨迹生成、反馈纠偏、结果确认、用户接管与低置信停止 | 文字 OCR 明确不支持中文和行为点选；不负责查询、提交、列表或详情；通用选择器不能正确抽取 Tianai 的 `slider-img-div` 拼图层 | MIT | 选择性移植滑块内核，增加 Tianai 适配器 |
| [sml2h3/ddddocr](https://github.com/sml2h3/ddddocr) | 中文 OCR、目标检测、滑块匹配；Python 3.13 实测可初始化 | 不处理目标站点会话、弹层随机路由和可信输入；包体较大 | MIT | 正式引入文字识别 |
| [MakotoArai-CN/Mieru-OCR](https://github.com/MakotoArai-CN/Mieru-OCR) | 浏览器端 ddddocr、文字点选候选框、曲线移动与滑块轨迹 | 点选与滑块在其 README 中仍标为实验性；通用扩展权限和配置远超本项目所需；合成事件为 `isTrusted=false` | MIT | 只参考交互与检测分层 |
| [dengyie/slidex](https://github.com/dengyie/slidex) | Python 轨迹生成、CDP、Provider 抽象和会话复用 | 内置 Provider 是 Aliyun/Geetest，没有 Tianai；整包会重复现有 Chrome 伴侣与 FastAPI | `pyproject.toml` 声明 MIT | 只参考轨迹与 Provider 边界 |
| [chenwei-zhao/captcha-recognizer](https://github.com/chenwei-zhao/captcha-recognizer) | 单缺口 YOLO 检测 | 只解决缺口坐标，不解决轨迹或文字点选；当前轮廓算法真实置信度已达 0.84 | 以仓库声明为准 | 暂不引入 |
| [fastapi-practices/ddddocr_server](https://github.com/fastapi-practices/ddddocr_server) | ddddocr 的 FastAPI 封装与滑块/点选接口分层 | 当前项目已有更严格的一次性 nonce、扩展来源限制与不持久化合同 | 以仓库声明为准 | 不整包引入 |

## 关键源码事实

Tianai 官方 `BasicCaptchaTrackValidator` / `BasicTrackCaptchaInterceptor` 对滑块至少检查：

- 操作时长不少于 300ms；
- 轨迹点不少于 10；
- 起点接近零点；
- Y 轴不能全程相同；
- 相邻跳变不能过大；
- 后段时间密度要高于前段，即有减速过程。

此前真实运行已经把缺口定位到 0.84 置信度，但浏览器在极短时间内发送完整轨迹，正好违反第一项。扩展现已加入按下停顿、逐点间隔和释放停顿，且轨迹点数与 Y 轴变化符合官方条件。

Tianai 官方文字点选前端在主图遮罩上记录顺序点击，点击确认后提交；默认行为校验器明确跳过非滑动验证码。因此文字点选的主要难点是“找到正确字形”，而不是构造复杂轨迹。ddddocr 在当前 Python 3.13 临时环境对四个旋转中文样本全部识别正确，适合作为本机主识别器。

## local-captcha-solver 代码级结论

候选版本为 `v1.3.1`，滑块能力包含：

- 从页面原图、可见截图和成对背景中择优定位；定位方法包含背景差分、纹理、形状、几何与边缘周长；
- 用浏览器 `debugger` / CDP 发送可信鼠标输入，每次尝试结束后主动断开；
- 12–28 个缓动轨迹点、轻微 Y 轴变化、按下与释放停顿，以及后段额外停顿；这些特征满足 Tianai 公开的最小时长、点数、Y 轴变化、最大跳变和后段减速检查；
- 拖动中根据拼图块实际位移最多纠偏两次，并在挑战变化、用户接管、低置信或结果不确定时停止；
- 本地复验通过其 44 个滑块单元测试、TypeScript 类型检查和 Chrome MV3 生产构建。

它原样安装仍不能作为生产答案。静态 OCR 字符表只有数字、英文字母和算术符号，项目文档也明确排除非拉丁文字、图片点选和行为挑战；同时它不提交查询表单。对 Tianai 滑块的兼容性探针显示：通用发现器能找到背景、轨道和按钮，但会漏掉 `#tianai-captcha-slider-img-div` / `#tianai-captcha-slider-move-img` 拼图层，因而只能回退到较弱的边缘周长定位。正式接入应移植滑块内核并加入精确站点适配，而不是与现有伴侣并装运行。

## 已执行变更

- `pyproject.toml` 与 `uv.lock` 已锁定 `ddddocr>=1.6.1,<2`、`opencv-python>=4.11,<6`。
- 文字点选顺序为：提示字形匹配 → ddddocr → macOS Vision → Tesseract；任一层无法得到唯一高置信结果即停止。
- 滑块不额外引入大模型；下一实现以 local-captcha-solver 的纯前端多路定位和受保护拖拽为骨架，并保留已经在真实题型达到 0.84 的透明轮廓定位作为 Tianai 专属候选。
- 本机 FastAPI 已重启加载新依赖；验证码图片、提示字和动作坐标仍只存在于请求内存。

## 下一验收点

1. 为现有伴侣移植 local-captcha-solver 的轨迹、运行保护、反馈纠偏与结果确认；增加 Tianai 拼图层、轨道和成功/失败状态适配。
2. 为新适配增加基于 Tianai 官方 DOM 的回归夹具，并保留现有动作合同和来源限制。
3. 在 Chrome `second` 资料中重载本地扩展，再用非敏感测试词分别命中并通过一次 `SLIDER` 与一次 `WORD_IMAGE_CLICK`。
4. 只记录类型、结果、匿名失败阶段、耗时与列表/详情数量；不保存题图、提示字、坐标或业务内容。
5. 两类均通过后，解除生产工作台实施闸门；否则继续停在兼容层，不进入作品集结果叙事。
