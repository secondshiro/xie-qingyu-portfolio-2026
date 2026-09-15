# 执行网浏览器伴生载体实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法跟踪进度。项目规则禁止未经授权执行 Git 提交，因此以测试结果、计划勾选和 `TASK_STATUS.md` 检查点代替提交。

**目标：** 建立一个只在执行网当前标签页运行的 Chrome MV3 扩展，通过环回 FastAPI 调用现有滑块与文字点选处理器，并在用户正常 Chrome 会话内完成验证、列表和详情闭环。

**架构：** 扩展侧负责当前页 DOM、可见区域裁图和临时调试输入；FastAPI 负责一次性会话、图片校验和本地视觉处理。扩展不读取 Chrome 配置、Cookie 或页面存储；题图只在内存中存在。

**技术栈：** Python 3.13、FastAPI、Pydantic、OpenCV、macOS Vision（Tesseract 回退）、Chrome Extension Manifest V3、原生 JavaScript ES modules、Node.js 内置测试运行器、pytest。

---

## 文件结构

- 创建 `execution-query-tool/src/execution_query/companion_session.py`：单活动会话、nonce 和过期边界。
- 创建 `execution-query-tool/src/execution_query/companion_models.py`：伴生 API 请求与响应模型。
- 创建 `execution-query-tool/src/execution_query/companion_solver.py`：图片解码、尺寸限制和两类处理器适配。
- 修改 `execution-query-tool/src/execution_query/api.py`：伴生 health、session、solve、result 端点和严格 CORS。
- 创建 `execution-query-tool/extension/manifest.json`：最小 MV3 权限与稳定开发身份。
- 创建 `execution-query-tool/extension/src/page-actions.mjs`：页面契约、表单、验证码几何、列表和详情读取。
- 创建 `execution-query-tool/extension/src/debugger-input.mjs`：固定类型的 CDP 鼠标动作与成对 attach/detach。
- 创建 `execution-query-tool/extension/src/workflow.mjs`：最多两次、刷新后重新分类的前端工作流。
- 创建 `execution-query-tool/extension/src/service-worker.mjs`：Chrome API 接线、截图裁切和任务消息。
- 创建 `execution-query-tool/extension/sidepanel.html`、`sidepanel.css`、`src/sidepanel.mjs`：最小任务界面。
- 创建 `execution-query-tool/extension/package.json` 与 `tests/*.test.mjs`：零第三方依赖的扩展测试。

## 任务 1：一次性伴生会话

- [x] **步骤 1：编写失败测试**

在 `tests/test_companion_session.py` 覆盖：

```python
def test_only_one_live_session_and_nonce_expires(fake_clock):
    store = CompanionSessionStore(ttl_seconds=300, clock=fake_clock)
    session = store.create()
    with pytest.raises(SessionBusy):
        store.create()
    fake_clock.advance(301)
    with pytest.raises(SessionExpired):
        store.require(session.nonce)
```

同时覆盖未知 nonce、完成后失效、nonce 不进入 `repr`。

- [x] **步骤 2：运行红灯**

    .venv/bin/pytest tests/test_companion_session.py -q

预期：`execution_query.companion_session` 不存在。

- [x] **步骤 3：实现最小会话存储**

使用 `secrets.token_urlsafe(32)` 生成 nonce；内存中只保留一个活动会话。`create()`、`require()`、`finish()` 都先清理过期会话。数据类的 nonce 字段设置 `repr=False`。

- [x] **步骤 4：运行绿灯**

    .venv/bin/pytest tests/test_companion_session.py -q

## 任务 2：图片与动作合同

- [x] **步骤 1：编写失败测试**

在 `tests/test_companion_solver.py` 覆盖：

- 拒绝超过 1.5 MiB 的单张图片。
- 拒绝非 PNG/JPEG、无法解码和尺寸不一致的图片。
- 滑块只返回 `distance`、`trajectory`、`confidence`。
- 文字点选只返回有序 `points` 与 `confidence`。
- JSON 中不出现图片、OCR 文字、路径、captchaId 或坐标以外的站点数据。

示例：

```python
def test_slider_response_contains_only_action_metadata(slider_images):
    response = solve_companion_challenge(slider_request(slider_images))
    assert response.outcome == "passed_candidate"
    assert set(response.action) == {"kind", "distance", "trajectory"}
```

- [x] **步骤 2：运行红灯**

    .venv/bin/pytest tests/test_companion_solver.py -q

- [x] **步骤 3：实现 Pydantic 模型与适配器**

`SolveRequest` 只接受 `SLIDER` 和 `WORD_IMAGE_CLICK`。图片使用 data URL 输入，解码后立即进入 NumPy；不写证据目录。低置信或处理器无法唯一匹配时返回 `retryable`，不返回动作。

- [x] **步骤 4：运行绿灯**

    .venv/bin/pytest tests/test_companion_solver.py tests/test_slider_solver.py tests/test_word_click_solver.py -q

## 任务 3：FastAPI 伴生边界

- [x] **步骤 1：编写失败 API 测试**

在 `tests/test_companion_api.py` 覆盖：

```python
async def test_session_requires_exact_extension_origin(app):
    denied = await post(app, "/api/companion/session", origin="https://example.com")
    assert denied.status_code == 403
```

并覆盖 health 无本机路径、单会话 409、无效 nonce 401、solve 请求上限 413、result 完成后 nonce 失效。

- [x] **步骤 2：运行红灯**

    .venv/bin/pytest tests/test_companion_api.py -q

- [x] **步骤 3：实现 API**

新增：

- `GET /api/companion/health`
- `POST /api/companion/session`
- `POST /api/companion/solve`
- `POST /api/companion/result`

允许 origin 由 `EXECUTION_QUERY_EXTENSION_ORIGIN` 配置；默认值来自清单公钥固定的精确 `chrome-extension://pajpkpaekjnjhpkfopldfaloafoogail` origin，显式设空时拒绝会话、求解和结果端点。除精确扩展 origin 外全部拒绝。服务文档继续关闭。

- [x] **步骤 4：全量 Python 绿灯**

    .venv/bin/pytest tests -q

- [x] **步骤 5：阶段性上下文整理**

勾选任务 1–3，更新 `TASK_STATUS.md` 与 `docs/projects/execution-query/next-turn-handoff.md`，记录测试数、API 路径和仍未执行真实验证码。

## 任务 4：扩展权限与页面合同

- [x] **步骤 1：创建扩展测试基线**

`extension/package.json`：

```json
{
  "name": "execution-query-companion",
  "private": true,
  "type": "module",
  "scripts": {"test": "node --test tests/*.test.mjs"}
}
```

`tests/manifest.test.mjs` 断言只包含 `activeTab`、`scripting`、`sidePanel`、`debugger`，host 只包含执行网和 `127.0.0.1`，且没有 cookies、history、downloads 或通配域名。

- [x] **步骤 2：运行红灯**

    npm test

工作目录：`execution-query-tool/extension`。预期：manifest 和页面合同模块不存在。

- [x] **步骤 3：实现 manifest 与纯页面函数**

`page-actions.mjs` 导出自包含函数：

- `inspectQueryPage()`
- `fillAndTriggerQuery({subject, cardNumber})`
- `inspectChallenge()`
- `readRenderedRows()`
- `readDetailRows()`

每个函数首先校验 `location.origin === "https://zxgk.court.gov.cn"`。`inspectChallenge()` 只返回题型、元素可见矩形和设备像素比，不返回 captchaId 或图片正文。

- [x] **步骤 4：运行绿灯**

    npm test

## 任务 5：可信输入与两次路由

- [x] **步骤 1：编写失败测试**

`tests/debugger-input.test.mjs` 断言：

- 滑块动作只生成 `mouseMoved → mousePressed → mouseMoved... → mouseReleased`。
- 点选动作每点生成一对 pressed/released。
- URL 非执行网时在 attach 前拒绝。
- 成功、异常和取消路径都只 attach 一次并 detach 一次。

`tests/workflow.test.mjs` 断言第一次 `SLIDER` 重试后第二次重新识别为 `WORD_IMAGE_CLICK`，最多调用 solver 两次，未知题型立即停止。

- [x] **步骤 2：运行红灯**

    npm test

- [x] **步骤 3：实现固定动作执行器和工作流**

`debugger-input.mjs` 不接受任意 CDP method，只接受经 schema 校验的 slider 或 points 动作。`workflow.mjs` 每轮重新调用 `inspectChallenge`，低置信不 attach，刷新后重新分类。

- [x] **步骤 4：运行绿灯**

    npm test

## 任务 6：服务工作线程与最小侧栏

- [x] **步骤 1：编写失败静态与状态测试**

覆盖：

- 侧栏只有连接、查询、任务、结果四区。
- 查询按钮必须由用户点击触发。
- service worker 仅对目标标签页执行脚本。
- 截图裁切只使用 `inspectChallenge()` 返回的矩形。
- 任务结束后不写 `chrome.storage`。

- [x] **步骤 2：运行红灯**

    npm test

- [x] **步骤 3：实现工作线程与侧栏**

侧栏向 service worker 发送 `START_QUERY`。工作线程检查本地 health、创建 nonce、运行页面工作流，并把阶段消息回传侧栏。可见截图只在内存中裁切；发送给 FastAPI 后丢弃 data URL。

- [x] **步骤 4：扩展全量绿灯**

    npm test

- [x] **步骤 5：阶段性上下文整理**

更新计划、`TASK_STATUS.md`、交接文档和 `execution-query-tool/README.md`，记录安装目录、权限说明、Python/Node 测试结果和真实验收前的停止点。

## 任务 7：安装检查与真实低频验收

- [x] **步骤 1：静态安装检查**

使用 Chrome“加载已解压的扩展程序”加载 `execution-query-tool/extension/`，核对其 ID 为 `pajpkpaekjnjhpkfopldfaloafoogail`。确认侧栏能打开、本地 health 可见、非执行网标签页拒绝启动、没有 Cookie/历史/下载权限。Chrome 152 不支持命令行 `--load-extension`，不得把该失败作为清单结论。

现场状态：扩展已在 `second`（`Default`）完成加载，ID、源目录、最小权限、侧栏、本地连接和执行网页面状态均已现场核对。早先装入 `QY`（`Profile 1`）的资料错位已排除。

- [x] **步骤 2：FastAPI 本地启动**

    .venv/bin/execution-query serve --host 127.0.0.1 --port 51997

确认 `GET /api/companion/health` 返回协议版本，且非扩展 origin 无法创建 session。

- [ ] **步骤 3：真实验收**

每次验证码动作前取得当下确认。使用非敏感词“测试”，单轮最多两次；持久证据只记录题型、处理器、结果、耗时、列表数量和详情成功数量。

当前现场进展：已修复 `captureVisibleTab` 权限失败、改用页面内存图片源，并修复多个残留弹层导致的题型误判。真实运行现已正确区分眼前的 `WORD_IMAGE_CLICK`；匿名阶段码证明提示图可识别，失败集中在背景旋转字形。处理器已加入 macOS Vision、自定义提示字词表和三连字识别，尚待重启本机服务后的真实复验。滑块旧模板匹配分数约 0.03；已改为透明通道轮廓与缺口边缘距离匹配，尚待真实复验。

- [ ] **步骤 4：闸门结论**

只有 `SLIDER` 和 `WORD_IMAGE_CLICK` 都真实自动通过，并取得列表和详情，才将 `var/feasibility.json` 更新为 passed。否则保留 conditional，并记录准确失败层。

- [ ] **步骤 5：最终验证**

    .venv/bin/pytest tests -q
    npm test

分别在 `execution-query-tool/` 与 `execution-query-tool/extension/` 执行。完成后更新 `TASK_STATUS.md`、观察报告与交接文档。

2026-09-10 阶段回归：Python 109 项、扩展 28 项通过；这只是实现回归，不替代两类验证码真实通过与列表/详情闭环。

## 计划自检

- 规格中的会话、图片、CORS、扩展权限、页面合同、可信输入、两次路由、最小界面和真实验收均有对应任务。
- Python 类型使用 `SolveRequest`、`SolveResponse`；扩展动作统一使用 `kind: "slider"` 或 `kind: "points"`。
- 没有批量、历史、Excel、作品集页面或未观察题型的范围扩张。
- 未包含 Git 命令，符合项目 `AGENTS.md`。
- 所有生产行为先有失败测试；真实验证码只在最终验收并取得即时确认后操作。
