---
name: 谢擎宇个人作品集
description: 一份以真实产品证据连续展开的产品体验设计作品册
colors:
  signal-orange: "#f54e00"
  warm-paper: "#f7f7f4"
  ink: "#26251e"
  quiet-ink: "#67665f"
  fold-stone: "#e8e6e0"
  soft-panel: "#eeede8"
  hairline: "rgb(38 37 30 / 10%)"
typography:
  display:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, PingFang SC, Microsoft YaHei, sans-serif"
    fontSize: "2.75rem; 2.5rem below 45rem"
    fontWeight: 400
    lineHeight: 1.08
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, PingFang SC, Microsoft YaHei, sans-serif"
    fontSize: "1.625rem"
    fontWeight: 400
    lineHeight: 1.25
    letterSpacing: "-0.0125em"
  body:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, PingFang SC, Microsoft YaHei, sans-serif"
    fontSize: "1rem"
    lineHeight: 1.75
  label:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, PingFang SC, Microsoft YaHei, sans-serif"
    fontSize: "0.74rem"
    lineHeight: 1.5
rounded:
  control: "0.35rem"
  media: "0.625rem"
spacing:
  inline: "clamp(1rem, 3vw, 3rem)"
  section: "clamp(5rem, 9vw, 7.5rem)"
  group: "2rem"
components:
  action-dark:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.warm-paper}"
    rounded: "{rounded.control}"
    padding: "0 1rem"
    height: "2.75rem"
  action-accent:
    textColor: "{colors.signal-orange}"
    rounded: "{rounded.control}"
    height: "2.75rem"
  evidence-card:
    backgroundColor: "{colors.warm-paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.media}"
    padding: "clamp(1.25rem, 2.5vw, 2rem)"
---

# Design System: 谢擎宇个人作品集

## Overview

**Creative North Star: “展开式作品册”**

首页以个人定位和四个文字项目索引连续展开，案例页承载判断、真实媒体和交互原型。网站界面为阅读服务，页面结构以当前源码为准。

整体气质克制、现代、可信。暖白与石色色面承担层级，墨色无衬线负责阅读，橙色只在折页节点和可操作入口出现。网站视觉与作品内部产品视觉明确分层；房产产品蓝只存在于真实截图和原型。

**Key Characteristics:**

- 连续折页，而不是重复卡片墙。
- 首页先给项目索引，再给关于与联系；案例页展示产品证据。
- 柔和实色、极少边界、克制橙色信号。
- 案例以事实、观察、推导和重构四类证据组织。
- 桌面原型在窄屏降级为静态证据与独立入口。

## Colors

调色板以暖白纸张和墨色文字为基础，石色承担折页层级，橙色承担极少量的交互信号。

### Primary

- **Signal Orange:** 仅用于链接、折页标记、案例章节标签和当前目录圆点，稀缺性是识别力的一部分。

### Neutral

- **Warm Paper:** 全站默认背景，也是视觉留白的主要材料。
- **Ink:** 标题、正文主文字和深色收尾表面。
- **Quiet Ink:** 正文辅助信息、图注和章节标签。
- **Fold Stone:** 相邻折页和案例章节的柔和层级。
- **Soft Panel:** 能力摘要、价值边界等次级内容表面。
- **Hairline:** 仅用于导航、控件和必要分层。

**The One Signal Rule.** 橙色只表达“这里可以继续”或“这里发生折页”，不成为大面积背景，也不与产品蓝竞争。

**The Product Color Boundary Rule.** 作品内部业务色保持真实，但不得扩展为网站导航、标题或装饰系统。

## Typography

**Display Font:** 系统无衬线字体栈，以 PingFang SC / Segoe UI 为主要中文与拉丁回退。
**Body Font:** 与展示字体共享同一系统无衬线栈。
**Character:** 清楚、紧凑、不过度品牌化；层级依靠尺度、字重、留白和行宽，而不是更换字体家族。

### Hierarchy

- **Display:** 案例首屏采用文章型层级，固定为桌面 44px、窄屏 40px、字重 400，不随宽屏继续放大；首页展示标题使用独立折页尺度。
- **Headline:** 案例章节标题固定 26px / 400；章节导语固定 20px / 400，以字号与灰度形成一档层级差。二者使用章节正文外框的完整宽度。
- **Title:** 工作面标题固定 18px / 500；其他内容模块保持 18–22px，并低于章节标题。
- **Body:** 16px、宽松行高，阅读列最大约 720px。
- **Label:** 12px 左右，用于章节编号、证据类型和图注。

**The Moderate Headline Rule.** 标题承担结构，不用夸张巨型字号制造营销感。案例页禁止用 `vw` 或宽屏 `clamp()` 放大主标题、章节标题和页尾邀请。

## Layout

站点只有一套 1320px 主容器，水平页边距随视口在 16–48px 之间流动。首页以纵向折页建立节奏；案例页在桌面使用 160px 标签列与弹性内容列，1010px 以下转为单列。

间距遵循 4/8px 微间距、12/16px 组件内部、24/32px 内容组、80–120px 章节间距。相邻距离只由父级 `gap/padding` 或子级 `margin` 的一方负责。

首页项目索引在 52rem 以下转为单列。案例窄屏隐藏桌面业务 iframe，保留静态证据与完整原型入口。所有主要入口最小高度为 44px。

## Elevation & Depth

系统以色面和留白建立层级。当前首页没有媒体悬浮画面；媒体阴影变量仅供需要的作品画面使用，卡片和章节不同时叠加边框与阴影。

### Shadow Vocabulary

- **Fold Ambient** (`0 22px 60px rgb(38 37 30 / 8%)`): 仅用于大型折页媒体与真正悬浮的作品画面。

**The Flat-by-Default Rule.** 内容模块默认平面化；没有真实层级变化时不添加阴影。

## Shapes

控件使用约 6px 的克制圆角，大型媒体使用约 10px 圆角。折页依靠整块色面和裁切形成轮廓，不使用胶囊容器或重复描边卡片。当前首页不显示橙色折缝标记。

## Components

### Buttons and Links

- **Shape:** 小圆角、最小 44px 操作高度。
- **Primary:** 深墨色实底与暖白文字，只用于明确的返回或联系动作。
- **Accent:** 橙色文字链接承担主要继续路径，不使用橙色大按钮。
- **Hover / Focus:** 链接沿用全站悬停反馈；键盘焦点使用双层高对比焦点环，原生 summary 同样纳入。

### Chips

- **Style:** 暖白小矩形承载能力标签，使用墨色小号文字，无彩色描边。
- **State:** 仅表示分类信息，不伪装成筛选器或按钮。

### 首页关于与简历

“关于”使用标签与正文双列，手机端单列；正文为一段经历和能力说明，提供简历下载与邮箱。标题桌面 40px / 400、手机 28px / 400。下载入口为深墨色实底，邮箱为橙色链接，两者可自然换行，保持至少 44px 操作高度。PDF 为两页 A4、白底墨字与克制橙色章节标记，嵌入中文字体，正文可选择与搜索。

### Cards / Containers

- **Corner Style:** 媒体与案例内容块使用约 10px 圆角。
- **Background:** 使用暖白、折页石色和柔和面板色分层。
- **Shadow Strategy:** 默认无阴影；只有折页媒体可使用 Fold Ambient。
- **Border:** 必要时只用 Hairline，不与阴影叠加。
- **Internal Padding:** 20–32px 的流体区间。

### Navigation

导航固定 52px 高，姓名在左，作品、关于和邮箱在右。当前页用橙色小点提示；390px 下邮箱文案收为“邮箱”，仍保留完整可访问名称。

### Case TOC

案例页只有一个页面级吸附目录，桌面固定在 160px 标签列，1010px 以下隐藏。目录顶部显示对应案例标题；标题与链接均为 14px，行距紧凑。默认、悬停和当前文字分别使用主文字 40%、60% 和 75%；单个 6px 橙色圆点平滑移动到当前章节文本右侧，不为每项重复创建圆点。

### 行业参照折叠

GIS 的行业判断保留章节标题和导语，三类产品的参照依据放入原生 `details/summary`。普通访问默认收起，`#strategy` 深链与目录点击自动展开；无 JavaScript 时仍可手动展开。控件复用全站焦点样式，展开不增加动画。设计取舍继续完整可见。

### Project Fold

项目折页由编号、项目标题、摘要和案例链接组成，纸色与石色交替。组件不接收图片，也没有折缝标记。

### Media Stage

媒体舞台统一呈现真实图片、证据类型与图注。图片始终带固有尺寸和描述性替代文本；证据等级同时通过文字标签表达，不能只靠颜色。

案例作品媒体阻止右键菜单和拖拽，且只作用于带 `data-protected-media` 的媒体区域。普通页面区域保留原有右键行为。这个交互限制不改变图片的公开资源属性，也不作为加密或防下载方案。

并列对比使用一致的 16:9 外框。图片尺寸或比例不同时以 `contain` 完整居中，不拉伸、不任意裁切；图注区域保持一致，使成对说明落在同一视觉行。

### Prototype Frame

桌面端以同源 iframe 呈现互动原型，并始终提供独立打开入口。窄屏隐藏 iframe，改为静态证据、桌面说明和相同深链，禁止伪装移动版业务产品。

## Do's and Don'ts

### Do:

- **Do** 让案例页的真实媒体就近支持设计判断。
- **Do** 使用唯一主容器和明确的媒体突破规则。
- **Do** 区分已确认事实、观察材料、依据推导和本次重构。
- **Do** 让键盘焦点、减弱动效和窄屏原型降级保持可验证。
- **Do** 用柔和实色、留白和尺度建立层级。

### Don't:

- **Don't** 用生成式 GIS 视觉稿替换真实项目证据。
- **Don't** 把房产产品蓝扩展为个人作品集品牌色。
- **Don't** 构建重复描边卡片墙、全页细线栅格或大面积深色章节拼接。
- **Don't** 使用衬线大标题、极端巨型营销字号、渐变文字或装饰性玻璃模糊。
- **Don't** 为材料不足的项目虚构详情页、过程、指标或成果。
