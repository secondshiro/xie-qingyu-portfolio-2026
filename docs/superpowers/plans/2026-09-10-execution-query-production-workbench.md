# 执行网查询生产工作台实施计划

> **面向 AI 代理的工作者：** 必需子技能为 `superpowers:executing-plans`。逐任务实施并使用复选框跟踪。当前项目规则禁止未经授权执行 Git 提交，因此每个任务以测试结果和状态文档作为检查点。

**目标：** 在两类验证码真实闸门通过后，把现有 FastAPI 与 Chrome 伴侣扩展为可批量查询、可恢复、可比较历史并导出 Excel 的 macOS 本地生产工具。

**架构：** Chrome 伴侣只处理当前执行网页签和真实会话。FastAPI 管理任务、SQLite 快照、历史比较与导出，静态本地工作台调用任务 API。失败状态与确认无记录始终分离，验证码数据不持久化。

**技术栈：** Python 3.13、FastAPI、Pydantic、SQLite、openpyxl、原生 HTML/CSS/JavaScript、Chrome MV3、pytest、Node.js 测试。

---

## 实施前置闸门

- [ ] `WORD_IMAGE_CLICK` 在真实 Chrome 中自动通过。
- [ ] `SLIDER` 在真实 Chrome 中自动通过。
- [ ] 同一会话取得列表和至少一条详情，或取得经过两次稳定观察的真实空结果。
- [ ] `execution-query-tool/var/feasibility.json` 的机器结论为 `passed`。

任一项未满足时，只继续修复伴侣，不实施本计划的任务 1 至任务 10。

## 文件结构

- 创建 `execution-query-tool/src/execution_query/storage.py`，负责 SQLite 连接、迁移和事务。
- 创建 `execution-query-tool/src/execution_query/task_models.py`，负责主体、批量任务、快照和比较模型。
- 创建 `execution-query-tool/src/execution_query/task_repository.py`，负责任务与快照读写。
- 创建 `execution-query-tool/src/execution_query/task_service.py`，负责状态转换、取消和恢复。
- 创建 `execution-query-tool/src/execution_query/comparison.py`，负责新增、存续和撤销。
- 创建 `execution-query-tool/src/execution_query/exporter.py`，负责两类 Excel。
- 创建 `execution-query-tool/src/execution_query/workbench_api.py`，负责工作台 API。
- 创建 `execution-query-tool/workbench/`，放置本地 HTML、CSS 与 JavaScript。
- 修改 `execution-query-tool/src/execution_query/api.py`，挂载工作台路由与静态页面。
- 修改 `execution-query-tool/extension/src/service-worker.mjs`，接收批量任务中的单项调用。

## 任务 1：SQLite 迁移与生产目录

**文件：**

- 创建 `execution-query-tool/src/execution_query/storage.py`
- 创建 `execution-query-tool/tests/test_storage.py`
- 修改 `execution-query-tool/.gitignore`

- [ ] **步骤 1：写失败测试**

```python
def test_database_creates_versioned_schema(tmp_path):
    database = Database(tmp_path / "execution-query.sqlite3")
    database.migrate()
    names = database.table_names()
    assert names == {
        "schema_versions", "subjects", "tasks", "task_items",
        "snapshots", "records",
    }
```

- [ ] **步骤 2：运行红灯**

```bash
.venv/bin/pytest tests/test_storage.py -q
```

预期为 `execution_query.storage` 不存在。

- [ ] **步骤 3：实现数据库边界**

`Database` 只接受显式路径，启用外键和 WAL。`migrate()` 在单个事务中创建六张表与版本记录。验证码、坐标、captchaId 和 pCode 不得成为字段。

```python
class Database:
    def __init__(self, path: Path):
        self.path = path

    def connect(self) -> sqlite3.Connection:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        connection = sqlite3.connect(self.path)
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA foreign_keys = ON")
        connection.execute("PRAGMA journal_mode = WAL")
        return connection

    def migrate(self) -> None:
        with self.transaction() as connection:
            connection.executescript(SCHEMA_V1)

    @contextmanager
    def transaction(self) -> Iterator[sqlite3.Connection]:
        connection = self.connect()
        try:
            with connection:
                yield connection
        finally:
            connection.close()
```

- [ ] **步骤 4：验证绿灯和忽略规则**

```bash
.venv/bin/pytest tests/test_storage.py -q
rg -n "var/production|sqlite" .gitignore
```

## 任务 2：批量任务领域模型

**文件：**

- 创建 `execution-query-tool/src/execution_query/task_models.py`
- 创建 `execution-query-tool/tests/test_task_models.py`

- [ ] **步骤 1：写状态和输入失败测试**

```python
def test_batch_normalizes_and_deduplicates_subjects():
    batch = BatchInput.model_validate({
        "subjects": [
            {"name": " 某公司 ", "identity": ""},
            {"name": "某公司", "identity": None},
        ]
    })
    assert batch.subjects == [SubjectInput(name="某公司", identity=None)]

def test_failure_is_never_completed_no_records():
    item = TaskItem(status=ItemStatus.VERIFICATION_FAILED)
    assert item.is_confirmed_empty is False
```

- [ ] **步骤 2：运行红灯**

```bash
.venv/bin/pytest tests/test_task_models.py -q
```

- [ ] **步骤 3：实现明确模型**

```python
class ItemStatus(StrEnum):
    QUEUED = "queued"
    VERIFYING = "verifying"
    SEARCHING = "searching"
    FETCHING_DETAILS = "fetching_details"
    COMPLETED_WITH_RECORDS = "completed_with_records"
    COMPLETED_NO_RECORDS = "completed_no_records"
    VERIFICATION_FAILED = "verification_failed"
    SITE_CHANGED = "site_changed"
    NETWORK_FAILED = "network_failed"
    CANCELLED = "cancelled"
```

`SubjectInput` 清理两端空白，姓名不能为空。`BatchInput` 按标准化姓名与身份组合去重，最多 500 项。

- [ ] **步骤 4：运行绿灯**

```bash
.venv/bin/pytest tests/test_task_models.py -q
```

## 任务 3：任务与快照仓储

**文件：**

- 创建 `execution-query-tool/src/execution_query/task_repository.py`
- 创建 `execution-query-tool/tests/test_task_repository.py`

- [ ] **步骤 1：写失败测试**

```python
def test_successful_empty_snapshot_differs_from_failed_item(repository):
    task = repository.create_task([SubjectInput(name="测试")])
    repository.complete_empty(task.items[0].id, source_time=FIXED_TIME)
    empty = repository.get_item(task.items[0].id)
    assert empty.status is ItemStatus.COMPLETED_NO_RECORDS
    assert empty.snapshot_id is not None

    failed = repository.create_task([SubjectInput(name="示例")]).items[0]
    repository.fail_item(failed.id, ItemStatus.VERIFICATION_FAILED, "retry_limit")
    assert repository.get_item(failed.id).snapshot_id is None
```

- [ ] **步骤 2：运行红灯**

```bash
.venv/bin/pytest tests/test_task_repository.py -q
```

- [ ] **步骤 3：实现事务化仓储**

仓储公开 `create_task`、`claim_next_item`、`transition_item`、`complete_with_records`、`complete_empty`、`fail_item`、`get_task`、`list_tasks` 和 `successful_snapshots`。成功快照与记录必须在同一事务写入。

- [ ] **步骤 4：运行绿灯**

```bash
.venv/bin/pytest tests/test_task_repository.py -q
```

## 任务 4：任务服务、取消与恢复

**文件：**

- 创建 `execution-query-tool/src/execution_query/task_service.py`
- 创建 `execution-query-tool/tests/test_task_service.py`

- [ ] **步骤 1：写状态转换失败测试**

```python
def test_site_change_pauses_remaining_batch(service):
    task = service.create_batch(["甲", "乙", "丙"])
    service.start_item(task.items[0].id)
    service.fail_item(task.items[0].id, ItemStatus.SITE_CHANGED, "contract")
    current = service.get_task(task.id)
    assert current.status == "paused"
    assert [item.status for item in current.items[1:]] == [
        ItemStatus.QUEUED, ItemStatus.QUEUED,
    ]

def test_resume_only_requeues_unfinished_items(service):
    task = service.create_batch(["甲", "乙", "丙"])
    service.complete_empty(task.items[0].id, source_time=FIXED_TIME)
    service.fail_item(task.items[1].id, ItemStatus.NETWORK_FAILED, "offline")
    service.resume(task.id)
    current = service.get_task(task.id)
    assert current.items[0].status is ItemStatus.COMPLETED_NO_RECORDS
    assert [item.status for item in current.items[1:]] == [
        ItemStatus.QUEUED, ItemStatus.QUEUED,
    ]
```

- [ ] **步骤 2：运行红灯**

```bash
.venv/bin/pytest tests/test_task_service.py -q
```

- [ ] **步骤 3：实现服务规则**

`TaskService` 只允许已定义的状态边。取消当前项后不删除成功快照。恢复服务时将意外中断的活动项标记为 `network_failed`，由用户决定重新入队。

- [ ] **步骤 4：运行绿灯**

```bash
.venv/bin/pytest tests/test_task_service.py -q
```

## 任务 5：批量工作台 API

**文件：**

- 创建 `execution-query-tool/src/execution_query/workbench_api.py`
- 创建 `execution-query-tool/tests/test_workbench_api.py`
- 修改 `execution-query-tool/src/execution_query/api.py`

- [ ] **步骤 1：写 API 失败测试**

```python
async def test_create_read_cancel_and_resume_batch(client):
    created = await client.post("/api/tasks", json={
        "subjects": [{"name": "测试", "identity": None}]
    })
    assert created.status_code == 201
    task_id = created.json()["id"]
    assert (await client.get(f"/api/tasks/{task_id}")).status_code == 200
    assert (await client.post(f"/api/tasks/{task_id}/cancel")).status_code == 200
    assert (await client.post(f"/api/tasks/{task_id}/resume")).status_code == 200
```

- [ ] **步骤 2：运行红灯**

```bash
.venv/bin/pytest tests/test_workbench_api.py -q
```

- [ ] **步骤 3：实现路由**

提供 `POST /api/tasks`、`GET /api/tasks`、`GET /api/tasks/{id}`、`POST /api/tasks/{id}/cancel`、`POST /api/tasks/{id}/resume`。工作台 API 仅监听环回地址，不放宽伴侣端点的精确扩展 origin。

- [ ] **步骤 4：运行绿灯**

```bash
.venv/bin/pytest tests/test_workbench_api.py tests/test_companion_api.py -q
```

## 任务 6：历史比较

**文件：**

- 创建 `execution-query-tool/src/execution_query/comparison.py`
- 创建 `execution-query-tool/tests/test_comparison.py`
- 创建 `execution-query-tool/tests/fixtures/history-before.json`
- 创建 `execution-query-tool/tests/fixtures/history-after.json`

- [ ] **步骤 1：写三态失败测试**

```python
def test_comparison_marks_added_retained_and_removed():
    result = compare_snapshots(before=BEFORE, after=AFTER)
    assert [item.status for item in result] == [
        ChangeStatus.ADDED,
        ChangeStatus.RETAINED,
        ChangeStatus.REMOVED,
    ]

def test_failed_snapshot_cannot_be_compared():
    with pytest.raises(ValueError, match="successful snapshots"):
        compare_snapshots(before=FAILED, after=AFTER)
```

- [ ] **步骤 2：运行红灯**

```bash
.venv/bin/pytest tests/test_comparison.py -q
```

- [ ] **步骤 3：实现稳定记录键**

优先使用规范化案号与立案日期组成记录键；缺失关键字段时保留为不可比较记录并显示原因，不能凭姓名合并。

- [ ] **步骤 4：运行绿灯**

```bash
.venv/bin/pytest tests/test_comparison.py -q
```

## 任务 7：Excel 导出

**文件：**

- 创建 `execution-query-tool/src/execution_query/exporter.py`
- 创建 `execution-query-tool/tests/test_exporter.py`
- 修改 `execution-query-tool/pyproject.toml`

- [ ] **步骤 1：加入依赖并写失败测试**

```bash
uv add "openpyxl>=3.1,<4"
```

```python
def test_result_workbook_has_fixed_columns_and_failure_rows(tmp_path):
    path = export_results(FIXED_TASK, tmp_path / "result.xlsx")
    sheet = load_workbook(path).active
    assert [cell.value for cell in sheet[1]] == EXPECTED_RESULT_COLUMNS
    assert sheet.max_row == len(FIXED_TASK.items) + 1

def test_identity_is_masked_by_default(tmp_path):
    task = task_view_with_identity("110101199001011234")
    path = export_results(task, tmp_path / "masked.xlsx")
    values = [cell.value for row in load_workbook(path).active for cell in row]
    assert "110101199001011234" not in values
    assert "110101********1234" in values
```

- [ ] **步骤 2：运行红灯**

```bash
.venv/bin/pytest tests/test_exporter.py -q
```

- [ ] **步骤 3：实现两种工作簿**

```python
def export_results(
    task: TaskView,
    path: Path,
    *,
    reveal_identity: bool = False,
) -> Path:
    workbook = Workbook()
    sheet = workbook.active
    sheet.append(EXPECTED_RESULT_COLUMNS)
    for item in task.items:
        identity = item.identity if reveal_identity else mask_identity(item.identity)
        sheet.append([
            item.name, identity, item.status.value, item.record_count,
            item.queried_at, item.failure_reason,
        ])
    finish_sheet(sheet)
    workbook.save(path)
    return path

def export_comparison(comparison: ComparisonView, path: Path) -> Path:
    workbook = Workbook()
    sheet = workbook.active
    sheet.append(EXPECTED_COMPARISON_COLUMNS)
    for item in comparison.items:
        sheet.append([
            comparison.subject_name, item.status.value,
            item.case_number, item.filing_date,
            comparison.before_time, comparison.after_time,
        ])
    finish_sheet(sheet)
    workbook.save(path)
    return path
```

当前结果包含失败项；历史比较只接收两个成功快照。使用固定列宽、冻结首行和自动筛选，不添加未经验证的统计图。

- [ ] **步骤 4：逐列验证**

```bash
.venv/bin/pytest tests/test_exporter.py -q
```

## 任务 8：本地生产工作台

**文件：**

- 创建 `execution-query-tool/workbench/index.html`
- 创建 `execution-query-tool/workbench/styles.css`
- 创建 `execution-query-tool/workbench/app.mjs`
- 创建 `execution-query-tool/extension/tests/workbench-static.test.mjs`
- 修改 `execution-query-tool/src/execution_query/api.py`

- [ ] **步骤 1：写结构失败测试**

```javascript
test("workbench exposes three views and one page heading", async () => {
  const html = await readFile(workbench("index.html"), "utf8");
  assert.equal((html.match(/<h1/g) ?? []).length, 1);
  assert.deepEqual([...html.matchAll(/data-view="([^"]+)"/g)].map(m => m[1]), [
    "current", "history", "comparison",
  ]);
  assert.match(html, /href="#main"/);
});
```

- [ ] **步骤 2：运行红灯**

```bash
node --test extension/tests/workbench-static.test.mjs
```

- [ ] **步骤 3：实现工作台壳层**

页面使用顶部 56px 状态栏、三视图导航、单列批量输入、吸附结果表头和右侧详情抽屉。颜色与字阶遵循设计规格。抽屉支持关闭按钮、Escape、焦点约束和焦点返回。

- [ ] **步骤 4：实现 API 状态渲染**

`app.mjs` 只渲染服务返回的结构化数据。表单提交、取消、恢复、详情和导出都使用动词开头的按钮文案。错误区域显示可行动的中文说明。

- [ ] **步骤 5：运行静态与 API 测试**

```bash
node --test extension/tests/workbench-static.test.mjs
.venv/bin/pytest tests/test_workbench_api.py -q
```

## 任务 9：批量调度与 Chrome 伴侣接线

**文件：**

- 修改 `execution-query-tool/extension/src/service-worker.mjs`
- 创建 `execution-query-tool/extension/src/batch-client.mjs`
- 创建 `execution-query-tool/extension/tests/batch-client.test.mjs`
- 创建 `execution-query-tool/tests/test_task_dispatch.py`

- [ ] **步骤 1：写单项租约失败测试**

```javascript
test("batch client claims one item and always reports a terminal result", async () => {
  const calls = [];
  await runClaimedItem({
    claim: async () => ({ id: "item-1", subject: "测试" }),
    run: async () => ({ outcome: "completed_no_records" }),
    finish: async payload => calls.push(payload),
  });
  assert.deepEqual(calls, [{ id: "item-1", outcome: "completed_no_records" }]);
});
```

- [ ] **步骤 2：运行红灯**

```bash
cd extension && node --test tests/batch-client.test.mjs
```

- [ ] **步骤 3：实现租约与心跳**

扩展每次只领取一个任务项。租约包含过期时间和一次性令牌。完成、失败、取消和扩展关闭都向 FastAPI 发送终态；服务重启后过期租约转为可恢复失败。

- [ ] **步骤 4：运行跨层绿灯**

```bash
cd extension && npm test
cd .. && .venv/bin/pytest tests/test_task_dispatch.py -q
```

## 任务 10：生产验收与文档

**文件：**

- 修改 `execution-query-tool/README.md`
- 修改 `TASK_STATUS.md`
- 修改 `docs/projects/execution-query/next-turn-handoff.md`
- 修改 `docs/projects/execution-query/portfolio-evidence-brief.md`

- [ ] **步骤 1：全量自动化验证**

```bash
cd execution-query-tool
.venv/bin/pytest tests -q
cd extension
npm test
```

- [ ] **步骤 2：视觉与键盘验收**

在 1440、1120、900、390px 检查输入、长队列、空结果、失败、表格和详情抽屉。仅 1440 与 1120 需要支持完整批量整理；390px 保证状态和详情可读。

- [ ] **步骤 3：真实有限任务验收**

使用非敏感测试词或用户明确授权的最小样本。覆盖两类验证码、记录、空结果、部分详情失败、下一项清理、取消和恢复。每项最多两次验证，遇到网站限制立即停止。

- [ ] **步骤 4：制作脱敏证据副本**

只把模糊主体、身份、案号和金额后的截图复制到 `public/projects/execution-query/`。公开副本不得包含验证码题图、提示字、动作坐标、captchaId 或 pCode。

- [ ] **步骤 5：更新阶段结论**

记录真实验证日期、样本边界、已验证能力和已知限制。只有上述验证全部通过，才启动作品集案例计划。

## 计划自检

- 规格中的 SQLite、任务状态、批量 API、历史比较、Excel、工作台、批量伴侣、恢复和证据边界均有对应任务。
- 生产数据只进入 `var/production/`，公开材料只进入 `public/projects/execution-query/`。
- 计划没有把验证码图片或身份数据写入测试夹具。
- 计划没有 Git 操作，符合当前项目协作规则。
- 任务 1 至任务 10 均受真实验证码前置闸门约束。
