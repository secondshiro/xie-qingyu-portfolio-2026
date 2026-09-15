# 执行网查询助手 MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将现有验证码求解实验收敛为人工验证、票据复用的批量查询助手，并交付本地任务历史与 Excel 导出。

**Architecture:** Chrome 伴侣仅在用户的当前执行网标签中填表、等待人工验证、读取列表与详情。FastAPI 使用 SQLite 持久化批量任务与结果，并生成 Excel。扩展不保存验证票据，只复用页面已持有的当前会话。

**Tech Stack:** Python 3.13、FastAPI、Pydantic、SQLite、openpyxl、Chrome MV3、原生 HTML/CSS/JavaScript、pytest、Node.js test runner

## 2026-09-10 执行状态

- Tasks 1–6 已完成：人工验证接续、生产链路去求解器、批量任务、SQLite、任务 API、安全取消与三表 Excel 均已有自动化覆盖。
- Task 7 的功能、样式、历史任务与 390px 防溢出测试已完成；实际已加载扩展的视觉检查等待 macOS 解锁。
- Task 8 仍是唯一发布验收阻塞：重新加载扩展后完成一次人工验证接续、第二项会话复用和真实导出检查。
- Task 9 延后到 MVP 现场验收通过后。定时能力保持“创建待办与提醒”的辅助边界。
- Task 10 已完成阶段性案例、首页入口、内容防泄漏检查、三档截图与整站验证；页面明确标注真实浏览器终验待完成。

---

## File structure

- Create `execution-query-tool/src/execution_query/task_models.py`: 批量输入、任务、项目状态与结果合同。
- Create `execution-query-tool/src/execution_query/task_repository.py`: SQLite 建表、任务和记录事务。
- Create `execution-query-tool/src/execution_query/exporter.py`: 三张表的 Excel 生成。
- Modify `execution-query-tool/src/execution_query/api.py`: 挂载任务、结果和导出端点。
- Modify `execution-query-tool/extension/src/page-actions.mjs`: 暴露票据就绪状态。
- Modify `execution-query-tool/extension/src/service-worker.mjs`: 人工验证等待、结果/弹窗竞速和批量调度。
- Modify `execution-query-tool/extension/sidepanel.html`: 批量输入、任务进度与导出入口。
- Modify `execution-query-tool/extension/src/sidepanel.mjs`: 解析输入、渲染队列、触发导出。
- Modify `execution-query-tool/extension/sidepanel.css`: 生产工具密度与可访问状态。
- Modify `execution-query-tool/extension/manifest.json`: 移除 `debugger` 权限，更新产品描述。

## Task 1: Human-verification browser contract

- [ ] Add a failing page-action test proving `inspectSessionState()` returns `tokenReady: true` only when the page helper reports an interactive token and both hidden values are present.
- [ ] Run `npm test -- --test-name-pattern="session state"` in `execution-query-tool/extension`; expect failure because the function does not exist.
- [ ] Implement `inspectSessionState(environment)` in `extension/src/page-actions.mjs` without returning token values.
- [ ] Add a failing service-worker test where the first submission opens `WORD_IMAGE_CLICK`, no `/solve` request is made, and the workflow continues only after `tokenReady` becomes true.
- [ ] Replace image capture and trusted CAPTCHA actions in the production query path with a bounded `waitForHumanVerification()` poll.
- [ ] Add a race helper that waits for either a visible challenge or a stable query outcome, so a reused ticket does not wait 15 seconds for a nonexistent dialog.
- [ ] Run all extension tests and confirm the new human path is green.

## Task 2: Remove active solver permissions and resource use

- [ ] Add a manifest test asserting `debugger` is absent and the extension description does not claim local recognition.
- [ ] Remove `debugger` from `extension/manifest.json` and remove production imports of screenshot crop and trusted input helpers from `service-worker.mjs`.
- [ ] Keep solver source and its tests as archived engineering evidence for this iteration, but do not expose `/api/companion/solve` to the normal extension workflow.
- [ ] Delete temporary local CAPTCHA captures and verify `rg --files /private/tmp/execution-query-captcha-debug` finds nothing.
- [ ] Run extension tests and Python tests related to the companion API.

## Task 3: Batch task domain and SQLite repository

- [ ] Add failing tests for normalized input, duplicate removal, the 500-subject cap, and the separation of completed-empty from failed.
- [ ] Implement `SubjectInput`, `BatchInput`, `TaskStatus`, `ItemStatus`, `QueryRecord` and API response models in `task_models.py`.
- [ ] Add a failing repository test that creates a task, completes one item with records, completes one item empty, and fails one item without creating a success snapshot.
- [ ] Implement an explicit-path SQLite repository with foreign keys, WAL, versioned schema and transactional result writes.
- [ ] Add repository reads for task detail and recent task history.
- [ ] Run the new task-model and repository tests.

## Task 4: Task API

- [ ] Add failing API tests for task creation, item completion, item failure, task retrieval and origin rejection.
- [ ] Add `POST /api/tasks`, `GET /api/tasks`, `GET /api/tasks/{task_id}`, `POST /api/tasks/{task_id}/items/{item_id}/result` and `POST /api/tasks/{task_id}/items/{item_id}/failure`.
- [ ] Protect mutations with the exact extension origin; keep read access on loopback only through the local server.
- [ ] Recompute task totals and terminal status after every item write.
- [ ] Run task API tests and the complete Python suite.

## Task 5: Batch orchestration in the extension

- [ ] Add failing tests for parsing one subject per line with an optional comma-separated identity, de-duplication and empty-line removal.
- [ ] Implement `runBatchTask()` to create a FastAPI task, process items sequentially in the same tab, post each result and stop the batch on verification timeout or site change.
- [ ] Emit progress messages containing counts and non-sensitive subject labels; never emit records or identities through diagnostic messages.
- [ ] Ensure the second item takes the result-first path when the page ticket remains valid.
- [ ] Add a cancellation flag checked between items; cancellation never deletes completed results.
- [ ] Run all extension tests.

## Task 6: Excel exporter

- [ ] Add `openpyxl` as a locked runtime dependency.
- [ ] Add a failing exporter test with one record item, one confirmed-empty item and one failed item.
- [ ] Generate worksheets `查询汇总`, `案件明细` and `未完成` with fixed columns, text-safe identifiers, frozen headers and filters.
- [ ] Add `GET /api/tasks/{task_id}/export.xlsx` with a sanitized filename and no server-side export copy.
- [ ] Load the generated workbook in the test and compare sheet names, row values, number formats and failure separation.
- [ ] Run exporter/API tests and the complete Python suite.

## Task 7: Side-panel workbench redesign

- [ ] Add DOM/source tests for one `h1`, visible labels, batch textarea, start/cancel/export buttons, live progress and absence of automatic-recognition claims.
- [ ] Replace the single-query form with a batch textarea and concise format hint; keep a one-line input valid.
- [ ] Render total, completed, records, empty and failed counts plus the current item.
- [ ] Render task items as status rows; details remain collapsed and sensitive values are not repeated in progress copy.
- [ ] Enable export only after a task exists; fetch the workbook on explicit click and revoke the temporary object URL.
- [ ] Verify keyboard focus, 390px overflow and reduced motion styles.
- [ ] Run all extension tests and inspect the loaded extension at 390px width.

## Task 8: Real browser acceptance

- [ ] Reload the unpacked extension after permission changes and reconnect the local FastAPI service.
- [ ] Run a non-sensitive test query, manually complete whichever challenge appears, and verify automatic continuation to list/empty result.
- [ ] Run a second non-sensitive item in the same batch and verify the valid ticket is reused without another challenge when the site permits it.
- [ ] Export the test task, inspect all three worksheets, then delete the test workbook and local production database if they contain live data.
- [ ] Record only anonymous outcomes, timestamps and UI screenshots with sensitive content blurred or replaced.

## Task 9: History comparison and reminder scheduling

- [ ] After the MVP acceptance is green, add tests that compare two successful snapshots for the same normalized subject into `added`, `persisting` and `removed` case keys.
- [ ] Expose comparison in task history and add a separate comparison workbook export; never compare against a failed item.
- [ ] Add a local schedule model that stores a batch template and next run time.
- [ ] When due, create a queued task and issue a local reminder to open the target page and complete verification; do not start browser actions without the user.
- [ ] Label scheduling as assisted and validate restart recovery with a fixed clock.

## Task 10: Portfolio evidence and page

- [ ] Update `docs/projects/execution-query/` to record the human-verification decision, old-version capability matrix and verified MVP scope.
- [ ] Create only redacted or synthetic UI evidence for the queue, human handoff, result states and workbook structure.
- [ ] Build `/work/execution-query/` with the existing case components and visual contract.
- [ ] Add content tests that reject CAPTCHA images, identity values, case-number originals and unsupported automation claims.
- [ ] Run `npm test`, `npm run test:e2e` and `npm run build`, then inspect 1440px, 1010px and 390px screenshots.

## Plan self-review

- The plan covers the approved human-verification boundary, same-page ticket reuse, batch queue, explicit failure states, local persistence, Excel export, history, assisted scheduling and portfolio evidence.
- The MVP is Tasks 1–8. History comparison and scheduling are isolated in Task 9 so they cannot delay a usable batch-and-export release.
- Git commit steps are intentionally omitted because the workspace `AGENTS.md` prohibits commits without explicit authorization.
- No step requires storing CAPTCHA assets, token values or production exports in the portfolio project.
