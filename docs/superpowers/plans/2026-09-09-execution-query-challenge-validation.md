# 执行网随机验证码验证实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框语法跟踪进度。

**目标：** 在真实 Chrome 的同一页面会话中，以非敏感测试词触发当前验证码，记录验证码类型、DOM 状态和允许的网络元数据，为后续自动验证方案提供可复核证据。

**架构：** challenge_probe.py 只负责触发并观察验证码，不求解。network_observer.py 只保留允许路径、方法、状态和响应类型，不保存请求体、验证码图片、captchaId、pCode 或查询主体。CLI 将触发观察与现有只读观察分开；真实验证码的拖动、旋转或点选属于下一闸门，执行前必须取得用户确认。

**技术栈：** Python 3.13、Playwright async API、pytest、现有 FastAPI 与脱敏证据模型。

---

## 文件结构

- 创建 execution-query-tool/src/execution_query/challenge_probe.py：验证码 DOM 快照与触发流程。
- 创建 execution-query-tool/src/execution_query/network_observer.py：允许列表内的网络元数据。
- 创建 execution-query-tool/tests/test_challenge_probe.py：DOM 观察和不操作验证码的测试。
- 创建 execution-query-tool/tests/test_network_observer.py：路径允许列表与敏感内容丢弃测试。
- 修改 execution-query-tool/src/execution_query/cli.py：增加 challenge --live。
- 修改 execution-query-tool/tests/test_cli.py：增加命令合同测试。
- 创建 docs/projects/execution-query/challenge-observation-result.md：真实触发结果。
- 修改 execution-query-tool/var/feasibility.json：机器可读闸门摘要。
- 修改 docs/projects/execution-query/README.md 与 TASK_STATUS.md：只记录已验证事实。

## 任务 1：用 TDD 建立网络元数据允许列表

**文件：**

- 创建：execution-query-tool/tests/test_network_observer.py
- 创建：execution-query-tool/src/execution_query/network_observer.py

- [x] **步骤 1：编写失败测试**

测试必须覆盖：

    observation = NetworkObservation.from_exchange(
        url="https://zxgk.court.gov.cn/gkw/zhcx/captcha/captcha?captchaId=secret",
        method="GET",
        status=200,
        content_type="application/json",
        request_body="pName=真实主体&pCode=secret",
    )
    assert observation.path == "/gkw/zhcx/captcha/captcha"
    assert observation.kind == "captcha_create"

序列化结果不得包含查询字符串、request_body、真实主体、captchaId 或 pCode。非允许路径必须返回 None。

- [x] **步骤 2：运行测试验证红灯**

运行：

    execution-query-tool/.venv/bin/pytest execution-query-tool/tests/test_network_observer.py -q

预期：FAIL，原因是 network_observer 模块尚不存在。

- [x] **步骤 3：实现最小观察器**

只允许验证码静态资源与四类业务路径：

    /static/tac/css/tac.css
    /static/tac/js/tac.min.js
    /static/tac/js/tac.js
    /gkw/zhcx/captcha/captcha
    /gkw/zhcx/captcha/captcha/check
    /gkw/zhcx/searchZhcx
    /gkw/zhcx/detailZhcx

NetworkObservation 只保留 kind、path、method、status、content_type 和 UTC 时间。request_body 参数必须被忽略。

- [x] **步骤 4：验证绿灯**

运行同一步骤 2。

预期：全部通过。

## 任务 2：用 TDD 建立验证码 DOM 快照

**文件：**

- 创建：execution-query-tool/tests/test_challenge_probe.py
- 创建：execution-query-tool/src/execution_query/challenge_probe.py

- [x] **步骤 1：编写失败测试**

通过 FakePage 的 evaluate 返回值覆盖：

- tianai-captcha-slider 映射为 SLIDER。
- tianai-captcha-rotate 映射为 ROTATE。
- tianai-captcha-concat 映射为 CONCAT。
- tianai-captcha-word-click 映射为 WORD_IMAGE_CLICK。
- 未知类型映射为 UNKNOWN，并将报告结论保持 failed。
- 快照只保留类型、可见性、背景与模板尺寸、captchaId 是否存在，不保留 id 值或图片内容。

- [x] **步骤 2：运行测试验证红灯**

运行：

    execution-query-tool/.venv/bin/pytest execution-query-tool/tests/test_challenge_probe.py -q

预期：FAIL，原因是 challenge_probe 模块尚不存在。

- [x] **步骤 3：实现最小 DOM 观察**

ChallengeSnapshot 定义 challenge_type、visible、captcha_id_present、background_size 和 template_size。extract_challenge_snapshot 只执行读取 DOM 的 evaluate，不产生鼠标、键盘或触摸事件。

- [x] **步骤 4：验证绿灯**

运行同一步骤 2。

预期：全部通过。

## 任务 3：用 TDD 实现“触发但不求解”的页面流程

**文件：**

- 修改：execution-query-tool/tests/test_challenge_probe.py
- 修改：execution-query-tool/src/execution_query/challenge_probe.py

- [x] **步骤 1：编写失败测试**

FakePage 必须记录以下且仅以下交互：

    wait #pName visible
    fill #pName
    click 查询按钮
    wait .tianai-captcha-ui-overlay visible
    evaluate DOM
    screenshot

测试断言不会调用 drag、mouse、touch、captcha/check 或 searchZhcx。报告中只能出现 subject_ref。

- [x] **步骤 2：运行测试验证红灯**

运行：

    execution-query-tool/.venv/bin/pytest execution-query-tool/tests/test_challenge_probe.py -q

预期：新增流程测试 FAIL，原因是 trigger_challenge 尚不存在。

- [x] **步骤 3：实现最小触发流程**

trigger_challenge 接受 PageProtocol、subject、EvidenceWriter 和 run_id。它填写测试词并点击查询，在 15 秒内等待验证码弹窗；检测类型后截图并返回 conditional。超时分类为 verification_failed，未知 DOM 分类为 site_changed。

- [x] **步骤 4：验证绿灯**

运行同一步骤 2。

预期：全部通过。

## 任务 4：用 TDD 增加 CLI 命令

**文件：**

- 修改：execution-query-tool/tests/test_cli.py
- 修改：execution-query-tool/src/execution_query/cli.py

- [x] **步骤 1：编写失败测试**

新增命令：

    execution-query challenge --live --subject 测试

测试通过注入 runner 避免启动浏览器，断言退出码、run_id 和 decision；标准输出与 JSON 不出现 subject 原文。

- [x] **步骤 2：运行测试验证红灯**

运行：

    execution-query-tool/.venv/bin/pytest execution-query-tool/tests/test_cli.py -q

预期：FAIL，原因是 challenge 子命令尚不存在。

- [x] **步骤 3：实现最小命令**

challenge 必须显式提供 --live 和 --subject。它启动可见 Chrome、安装允许列表网络观察、触发弹窗、保存脱敏 JSON 与 PNG，然后关闭浏览器。它不刷新验证码，不求解，也不发 captcha/check。

- [x] **步骤 4：验证绿灯**

运行同一步骤 2。

预期：全部通过。

## 任务 5：执行一次真实验证码触发观察

**文件：**

- 生成但不公开：execution-query-tool/var/evidence/

- [x] **步骤 1：运行完整自动化测试**

运行：

    execution-query-tool/.venv/bin/pytest execution-query-tool/tests -q

预期：全部通过。

- [x] **步骤 2：运行真实触发**

运行：

    execution-query-tool/.venv/bin/execution-query challenge --live --subject 测试

预期：

- 页面打开并出现验证码弹窗；
- 报告记录一种已知类型或 UNKNOWN；
- 网络元数据出现 captcha_create；
- 不出现 captcha_check、search 或 detail；
- 截图不含真实主体、案号或身份标识。

实际结果：命令已执行，但预期条件未成立。最终运行 `challenge-d0f27ac5cb0b` 中，验证码 CSS 返回 200，主脚本与回退脚本均返回 400；页面运行状态表示这不是按钮或等待器未就绪，但验证码弹层未创建。未出现 captcha_create、captcha_check、search 或 detail。

- [x] **步骤 3：人工检查证据**

查看 JSON 与 PNG，确认截图是实际浏览器页面，不是 DOM 注入或模拟浏览器外壳；确认报告无查询字符串、主体原文、captchaId、pCode 和图片 Base64。

实际检查：PNG 为真实浏览器页面，只含非敏感测试词；JSON 仅保存主体哈希引用、允许列表网络元数据和脱敏诊断。

## 任务 6：形成随机验证码观察结论

**文件：**

- 创建：docs/projects/execution-query/challenge-observation-result.md
- 修改：execution-query-tool/var/feasibility.json
- 修改：docs/projects/execution-query/README.md
- 修改：TASK_STATUS.md
- 修改：本计划复选框

- [x] **步骤 1：写观察报告**

报告记录验证时间、运行 ID、实际类型、DOM 尺寸、允许的网络元数据和未执行动作。

- [x] **步骤 2：更新机器摘要**

若成功触发已知类型，decision 保持 conditional，evidence 增加 challenge_types_detected；不得改为 passed。

实际结果：触发失败，decision 更新为 failed，evidence 为 contract_ok 与 captcha_asset_blocked。

- [x] **步骤 3：确定下一计划**

成功识别真实类型时，下一计划原定为：

    docs/superpowers/plans/2026-09-09-execution-query-challenge-handler.md

它必须针对实际观察到的类型编写测试夹具与处理器，并在第一次真实拖动、旋转或点选之前请求用户操作时确认。

实际结果：因未看到验证码弹层或实际类型，不创建该处理器计划。下一步只能是站点恢复后重试触发观察，或取得允许自动化的正式接口。

- [x] **步骤 4：更新状态**

项目状态只写“已执行触发观察，但验证码资源阻断，未识别类型”，不写“已解决”或“已完成真实查询”。

## 计划自检

- 触发和求解被拆成两个闸门，避免一次点击被误写成验证成功。
- 所有证据字段使用允许列表，查询字符串和请求体在入口处丢弃。
- 测试词仅用于让前端打开验证弹窗，不在验证码完成前发送查询。
- 真实验证码操作仍未授权执行，计划明确在操作发生前暂停确认。
- 当前目录遵循 AGENTS.md，不运行 Git 提交、重置或清理。
