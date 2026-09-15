# 当前网站可行性尖峰结果

## 结论

**阶段性结论：有条件通过；后续验证已将总闸门更新为未通过。**

真实 Chrome 已能正常打开 https://zxgk.court.gov.cn/zhzxgk/，页面返回 HTTP 200，查询表单完整可见，当前查询与详情接口契约可以从页面解析。FastAPI 诊断边界和脱敏证据链已经可运行。

这还不等于验证码已经解决：本阶段没有提交查询主体，没有触发或操作验证码，也没有取得 captchaId、pCode、查询结果或详情结果。因此不能进入“生产可用”结论，下一阶段必须专门验证随机验证码和同一会话中的查询闭环。

> 2026-09-09 后续更新：触发观察已执行，验证码脚本资源返回 400，弹层未创建，因此总闸门已更新为“未通过”。详见 [验证码触发观察](challenge-observation-result.md)。

## 验证环境

- 验证时间：2026-09-09 01:09（Asia/Shanghai）。
- 操作系统：macOS。
- Python：uv 管理的 CPython 3.13.12。
- 浏览器：系统 Google Chrome，由 Playwright 以可见窗口启动。
- 页面：全国法院信息综合查询首页。

## 自动化验证

- 工具测试：34/34 通过。
- 覆盖：任务状态、非法跳转、失败分类、网站契约、API 基址写法、证据脱敏、浏览器观察器、FastAPI 接口与 CLI。
- FastAPI：127.0.0.1:51997 临时启动成功。
- GET /api/health：HTTP 200，返回 status=ok、stage=captcha_feasibility。
- GET /api/feasibility：接口能在结果未写入时安全返回 not_run；机器摘要写入后应返回 conditional。

## 真实页面证据

- 最终有效运行 ID：probe-d1d67882a070。
- HTTP 状态：200。
- 页面契约：contract_ok。
- 查询输入框：可见。
- 查询表单：zhcx-search-form 存在。
- 结果容器：result-block 存在。
- 接口基址：页面使用 location.origin + /gkw/zhcx。
- 本地证据：execution-query-tool/var/evidence/probe-d1d67882a070.json 与同名 PNG。

var/ 已被忽略，证据不会进入公开作品集。截图中没有填写查询主体。

## 本阶段发现并修正的问题

第一次有效页面观察暴露出契约解析误报：夹具使用直接字符串，而真实页面使用 location.origin 加路径。先增加失败回归测试，再扩展解析规则，相关 11 个契约与浏览器测试全部通过。

第二次截图在 DOMContentLoaded 后过早生成，表单尚未完成视觉呈现。增加“pName 输入框可见”的等待条件和失败测试后，第三次截图完整显示查询页面。

## 已证明

- 旧版原始网络请求方案不是唯一入口，真实浏览器可以正常进入当前页面。
- 当前页面结构、查询入口与新接口族可被独立适配器识别。
- 工具能把访问检查、网站变化、网络失败和正常契约分开记录。
- 诊断证据可保存，且不包含主体、captchaId、pCode、案号或身份标识。
- FastAPI 适合承载后续任务状态和诊断接口。

## 尚未证明

- 一次真实查询会出现哪一种随机验证码。
- SLIDER、ROTATE、CONCAT、WORD_IMAGE_CLICK 是否都在生产环境启用。
- 任一验证码能否自动、稳定且符合访问边界地完成。
- 验证后的 captchaId 与 pCode 是否能在同一浏览器会话中驱动搜索与详情。
- 查询成功、确实无结果与验证失败在真实响应中的完整差异。
- 连续批量任务成功率、等待时间和重试上限。

## 禁止推断

- 不能写“验证码已解决”或“零人工验证”。
- 不能写生产成功率、节省时间或批量吞吐量。
- 不能以首页成功打开证明搜索、详情或导出可用。
- 不能把诊断截图直接当作公开作品集成果。

## 下一阶段

下一份计划文件已经执行：

docs/superpowers/plans/2026-09-09-execution-query-challenge-validation.md

该计划实际完成了“输入非敏感测试词 → 尝试触发 → 保存脱敏诊断”。由于验证码资源阻断，没有进入求解、同一会话查询或详情读取。当前不创建 challenge handler 计划；重启条件见 [验证码触发观察](challenge-observation-result.md)。
