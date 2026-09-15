# 执行网查询可行性尖峰实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框语法跟踪进度。

**目标：** 在不修改旧归档、不伪造查询结果的前提下，建立一个可测试的独立 Python 工具骨架，并用真实浏览器证据判断当前执行网站的验证与查询流程能否进入生产重构。

**架构：** 新工具放在作品集项目内的 execution-query-tool/，但不参与 Astro 构建。领域状态、网站契约、浏览器观察和证据记录分别隔离；FastAPI 依赖在本阶段只建立可启动的健康检查与任务合同，真实浏览器探针负责记录当前网站状态。验证码处理通过显式接口隔离，任何真实验证码操作必须在操作发生前获得用户确认。

**技术栈：** Python 3.12+、FastAPI、Pydantic、Uvicorn、Playwright、pytest、SQLite（后续生产阶段）、Astro（仅后续作品集页面）。

---

## 范围与闸门

本计划只覆盖“阶段 0：隔离与测试基线”和“阶段 1：当前网站可行性尖峰”。生产任务队列、历史比较、Excel 导出、完整工作台和作品集页面将根据本计划的闸门结论分别编写后续计划。

闸门结论只有三种：

- 通过：真实浏览器能稳定进入验证流程、会话与查询请求可关联，且存在可实现、可测试、符合访问边界的自动验证路线。
- 有条件通过：浏览器、会话和查询链路成立，但部分随机验证类型尚无可靠自动处理；不得称为生产可用。
- 未通过：正常浏览器流程仍被访问限制阻断，或只能依靠规避安全机制才能继续。

本计划不会把“识别出验证码类型”当成“验证码已解决”。

## 文件结构

- 创建 execution-query-tool/pyproject.toml：依赖、测试配置和 Python 版本边界。
- 创建 execution-query-tool/.gitignore：隔离虚拟环境、运行证据、数据库和敏感文件。
- 创建 execution-query-tool/README.md：本地运行、证据边界和当前闸门状态。
- 创建 execution-query-tool/src/execution_query/__init__.py：包版本。
- 创建 execution-query-tool/src/execution_query/domain.py：任务状态与状态转换。
- 创建 execution-query-tool/src/execution_query/site_contract.py：当前页面契约与验证类型识别。
- 创建 execution-query-tool/src/execution_query/evidence.py：脱敏事件和运行报告。
- 创建 execution-query-tool/src/execution_query/browser_probe.py：真实浏览器只读观察。
- 创建 execution-query-tool/src/execution_query/api.py：FastAPI 健康检查和探针状态接口。
- 创建 execution-query-tool/src/execution_query/cli.py：诊断命令入口。
- 创建 execution-query-tool/tests/：领域、契约、证据、API 与浏览器探针测试。
- 创建 execution-query-tool/tests/fixtures/：不含主体或案号的最小 HTML / JSON 夹具。
- 创建 docs/projects/execution-query/feasibility-result.md：真实运行后的闸门证据与结论。

## 任务 1：创建隔离工程与依赖基线

**文件：**

- 创建：execution-query-tool/pyproject.toml
- 创建：execution-query-tool/.gitignore
- 创建：execution-query-tool/README.md
- 创建：execution-query-tool/src/execution_query/__init__.py

- [x] **步骤 1：创建项目配置**

pyproject.toml 必须声明：

    requires-python = ">=3.12"
    dependencies = [
      "fastapi>=0.115,<1",
      "pydantic>=2.10,<3",
      "uvicorn>=0.34,<1",
      "playwright>=1.55,<2"
    ]

开发依赖声明 pytest、pytest-asyncio 与 httpx，并配置 src 布局。

- [x] **步骤 2：隔离运行数据**

.gitignore 必须忽略 .venv/、var/、*.sqlite3、__pycache__/、.pytest_cache/ 和任何 .env 文件。

- [x] **步骤 3：安装锁定依赖**

运行：

    UV_CACHE_DIR=/tmp/execution-query-uv-cache uv sync --project execution-query-tool

预期：生成 execution-query-tool/uv.lock 和 .venv，命令退出码为 0。

- [x] **步骤 4：验证空测试基线**

运行：

    execution-query-tool/.venv/bin/pytest execution-query-tool/tests -q

预期：若测试目录尚无测试，退出码 5；这一步只证明测试命令可调用，随后任务必须以红灯测试开始。

## 任务 2：用 TDD 固定任务状态与“失败不等于无结果”

**文件：**

- 创建：execution-query-tool/tests/test_domain.py
- 创建：execution-query-tool/src/execution_query/domain.py

- [x] **步骤 1：编写失败测试**

测试必须覆盖：

    def test_only_verified_empty_response_can_be_no_records():
        task = QueryTask(subject="示例主体")
        task.transition(QueryStatus.OPENING_SITE)
        task.transition(QueryStatus.VERIFYING)
        task.transition(QueryStatus.SEARCHING)
        task.complete(records=[])
        assert task.status is QueryStatus.COMPLETED_NO_RECORDS

    @pytest.mark.parametrize(
        "failure",
        [
            QueryStatus.VERIFICATION_FAILED,
            QueryStatus.SITE_CHANGED,
            QueryStatus.NETWORK_FAILED,
        ],
    )
    def test_failures_never_become_no_records(failure):
        task = QueryTask(subject="示例主体")
        task.fail(failure, "可复核原因")
        assert task.status is failure
        assert task.status is not QueryStatus.COMPLETED_NO_RECORDS

还要覆盖非法跳转抛出 InvalidTransition，错误信息不能为空。

- [x] **步骤 2：运行测试验证红灯**

运行：

    execution-query-tool/.venv/bin/pytest execution-query-tool/tests/test_domain.py -q

预期：FAIL，原因是 execution_query.domain 尚不存在。

- [x] **步骤 3：实现最小领域模型**

domain.py 定义 QueryStatus 字符串枚举、QueryTask 数据模型和 InvalidTransition。允许的主流程为：

    queued → opening_site → verifying → searching
    searching → fetching_details
    searching/fetching_details → completed_with_records
    searching/fetching_details → completed_no_records

verification_failed、site_changed、network_failed、cancelled 为终止状态。complete 只能从 searching 或 fetching_details 调用。

- [x] **步骤 4：验证绿灯**

运行同一步骤 2。

预期：全部通过，无警告。

## 任务 3：用 TDD 固定当前网站契约

**文件：**

- 创建：execution-query-tool/tests/fixtures/current-page.html
- 创建：execution-query-tool/tests/fixtures/captcha-response.json
- 创建：execution-query-tool/tests/test_site_contract.py
- 创建：execution-query-tool/src/execution_query/site_contract.py

- [x] **步骤 1：创建最小脱敏夹具**

current-page.html 只保留查询表单字段、脚本名称和结果容器。captcha-response.json 只保留 type、id 和布尔成功字段，不保存验证码图片或真实令牌。

- [x] **步骤 2：编写失败测试**

测试必须证明：

    contract = SiteContract.from_html(html)
    assert contract.search_path == "/gkw/zhcx/searchZhcx"
    assert contract.detail_path == "/gkw/zhcx/detailZhcx"
    assert contract.captcha_create_path == "/gkw/zhcx/captcha/captcha"
    assert contract.captcha_check_path == "/gkw/zhcx/captcha/captcha/check"
    assert contract.supported_challenges == {
        ChallengeType.SLIDER,
        ChallengeType.ROTATE,
        ChallengeType.CONCAT,
        ChallengeType.WORD_IMAGE_CLICK,
    }

缺少查询表单、验证码脚本或结果容器时，分别返回明确的 contract_errors。

- [x] **步骤 3：运行测试验证红灯**

运行：

    execution-query-tool/.venv/bin/pytest execution-query-tool/tests/test_site_contract.py -q

预期：FAIL，原因是 SiteContract 尚不存在。

- [x] **步骤 4：实现最小契约解析**

site_contract.py 定义 ChallengeType、SiteContract 和 ContractObservation。解析只做结构识别，不下载或破解验证码。

- [x] **步骤 5：验证绿灯**

运行同一步骤 3。

预期：全部通过，无警告。

## 任务 4：用 TDD 建立脱敏证据记录

**文件：**

- 创建：execution-query-tool/tests/test_evidence.py
- 创建：execution-query-tool/src/execution_query/evidence.py

- [x] **步骤 1：编写失败测试**

测试必须覆盖：

- 事件包含 UTC 时间、运行 ID、阶段、结果和错误分类。
- subject、captchaId、pCode、案号和身份标识不允许出现在 JSON 报告。
- 报告可以记录 challenge_type、页面 URL 的路径部分、HTTP 状态和耗时。
- 证据写入临时目录后可重新读取。

- [x] **步骤 2：运行测试验证红灯**

运行：

    execution-query-tool/.venv/bin/pytest execution-query-tool/tests/test_evidence.py -q

预期：FAIL，原因是 evidence 模块尚不存在。

- [x] **步骤 3：实现最小证据模型**

实现 ProbeEvent、ProbeReport 和 EvidenceWriter。所有自由文本先经过 redact_text；报告默认只写 var/evidence/，文件名使用运行 ID。

- [x] **步骤 4：验证绿灯**

运行同一步骤 2。

预期：全部通过，无敏感字符串残留。

## 任务 5：用 TDD 实现真实浏览器观察器

**文件：**

- 创建：execution-query-tool/tests/test_browser_probe.py
- 创建：execution-query-tool/src/execution_query/browser_probe.py

- [x] **步骤 1：编写失败测试**

通过注入 FakePage 测试：

- 页面包含预期表单与脚本时返回 contract_ok。
- 页面为 JavaScript 检查页时分类为 access_check。
- 页面结构缺失时分类为 site_changed。
- 发现验证码容器后只记录类型，不自动操作。
- 页面截图只允许写入 var/evidence/，且报告不包含测试主体。

- [x] **步骤 2：运行测试验证红灯**

运行：

    execution-query-tool/.venv/bin/pytest execution-query-tool/tests/test_browser_probe.py -q

预期：FAIL，原因是 BrowserProbe 尚不存在。

- [x] **步骤 3：实现最小观察器**

BrowserProbe 接收 PageProtocol，不在构造函数中直接创建浏览器。observe_page 读取 URL、标题、HTML、验证码容器与脚本，不点击验证码。live_probe 才负责启动 Playwright，默认使用已安装 Chrome、可见窗口、单页和 30 秒上限。

- [x] **步骤 4：验证绿灯**

运行同一步骤 2。

预期：全部通过。

## 任务 6：用 TDD 建立 FastAPI 诊断边界

**文件：**

- 创建：execution-query-tool/tests/test_api.py
- 创建：execution-query-tool/src/execution_query/api.py

- [x] **步骤 1：编写失败测试**

测试：

    response = client.get("/api/health")
    assert response.json() == {
        "status": "ok",
        "stage": "captcha_feasibility",
    }

    response = client.get("/api/feasibility")
    assert response.status_code == 200
    assert response.json()["decision"] in {
        "not_run",
        "passed",
        "conditional",
        "failed",
    }

接口不得返回本地绝对路径或原始敏感字段。

- [x] **步骤 2：运行测试验证红灯**

运行：

    execution-query-tool/.venv/bin/pytest execution-query-tool/tests/test_api.py -q

预期：FAIL，原因是 api 模块尚不存在。

- [x] **步骤 3：实现最小 API**

实现 app、GET /api/health 和 GET /api/feasibility。feasibility 从脱敏结果文档的机器可读摘要读取；文件不存在时返回 not_run。

- [x] **步骤 4：验证绿灯**

运行同一步骤 2。

预期：全部通过。

## 任务 7：实现诊断命令并执行第一次真实观察

**文件：**

- 创建：execution-query-tool/tests/test_cli.py
- 创建：execution-query-tool/src/execution_query/cli.py
- 修改：execution-query-tool/pyproject.toml
- 生成但不纳入公开素材：execution-query-tool/var/evidence/

- [x] **步骤 1：编写失败测试**

测试 probe --dry-run 返回 0、输出运行 ID 和 evidence 文件；输入参数中出现主体时，控制台和报告都只显示哈希化引用。

- [x] **步骤 2：运行测试验证红灯**

运行：

    execution-query-tool/.venv/bin/pytest execution-query-tool/tests/test_cli.py -q

预期：FAIL，原因是 CLI 尚不存在。

- [x] **步骤 3：实现最小 CLI**

提供：

    execution-query probe --dry-run
    execution-query probe --live
    execution-query serve

live 模式只打开网站并观察页面契约，不提交主体、不拖动滑块、不点击文字验证码。

- [x] **步骤 4：验证 CLI 绿灯**

运行：

    execution-query-tool/.venv/bin/pytest execution-query-tool/tests/test_cli.py -q

预期：全部通过。

- [x] **步骤 5：执行真实只读观察**

运行：

    execution-query-tool/.venv/bin/execution-query probe --live

预期：生成一个不含主体、令牌和验证码图片的 JSON 报告；报告明确给出 contract_ok、access_check、site_changed 或 network_failed。

如启动可见 Chrome 需要系统授权，仅申请该命令的运行权限，不扩大到其他命令。

## 任务 8：形成闸门结论与后续计划入口

**文件：**

- 创建：docs/projects/execution-query/feasibility-result.md
- 修改：docs/projects/execution-query/README.md
- 修改：TASK_STATUS.md
- 修改：本计划中的复选框

- [x] **步骤 1：汇总自动化测试**

运行：

    execution-query-tool/.venv/bin/pytest execution-query-tool/tests -q

预期：全部通过，无错误和警告。

- [x] **步骤 2：验证 FastAPI 可启动**

运行：

    execution-query-tool/.venv/bin/uvicorn execution_query.api:app --app-dir execution-query-tool/src --host 127.0.0.1 --port 51997

另一个请求读取：

    curl --noproxy '*' http://127.0.0.1:51997/api/health

预期：HTTP 200，返回 status=ok 和 stage=captcha_feasibility。随后正常结束服务。

- [x] **步骤 3：写闸门报告**

feasibility-result.md 必须包含：

- 验证日期与环境；
- 自动化测试结果；
- 真实页面观察结果；
- 已证明、未证明和禁止推断的内容；
- 通过、有条件通过或未通过的单一结论；
- 下一份实施计划的准确文件名。

- [x] **步骤 4：选择后续计划**

若为通过，下一份计划是：

    docs/superpowers/plans/2026-09-09-execution-query-production-app.md

若为有条件通过，下一份计划是：

    docs/superpowers/plans/2026-09-09-execution-query-challenge-validation.md

若为未通过，停止生产重构，不创建替代性的人工验证主流程；记录可用的官方或授权路线。

- [x] **步骤 5：更新项目记录**

README.md 链接闸门报告，TASK_STATUS.md 只写已经验证的结果。不得写“验证码已解决”，除非真实提交、验证、查询和结果读取闭环已经完成。

## 计划自检

- 规格覆盖：包含隔离、状态、网站契约、真实浏览器、FastAPI、证据与闸门。
- 敏感边界：不复制旧历史，不把主体或令牌写入报告。
- 类型一致：QueryStatus、ChallengeType、ProbeEvent、ProbeReport 在所有任务中名称一致。
- 验证完整：每个生产行为先有失败测试，再写最少实现并重跑。
- Git 偏离：当前目录不是独立仓库，依照项目 AGENTS.md 不执行 git add、commit、重置或清理。
