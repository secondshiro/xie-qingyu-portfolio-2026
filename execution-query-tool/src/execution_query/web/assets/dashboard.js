(function initializeDashboard() {
  const DASHBOARD_SOURCE = "execution-query-dashboard";
  const EXTENSION_SOURCE = "execution-query-extension";
  const pending = new Map();
  let currentTaskId = null;
  let pollingTimer = null;
  let latestStage = "正在准备";

  const elements = Object.fromEntries([
    "bridge-status", "connection-dot", "query-form", "subjects", "subject-count",
    "form-error", "start-query", "cancel-query", "resume-task",
    "focus-verification", "verification-alert", "empty-task", "task-content",
    "task-status", "task-stage", "progress-value", "task-progress",
    "progress-fill", "metric-total", "metric-completed", "metric-records",
    "metric-empty", "metric-failed", "export-task", "task-items",
    "comparison-panel", "comparison-date", "comparison-new",
    "comparison-unchanged", "comparison-missing", "comparison-baseline",
    "comparison-subjects",
    "task-history", "history-empty", "refresh-history",
  ].map((id) => [id, document.getElementById(id)]));

  const statusCopy = {
    queued: "等待开始",
    running: "正在查询",
    paused: "已暂停",
    completed: "已完成",
    completed_with_failures: "完成，有未处理项",
    cancelled: "已取消",
    awaiting_verification: "等待验证",
    searching: "正在查询",
    fetching_details: "整理详情",
    completed_with_records: "有记录",
    completed_no_records: "无记录",
    verification_timeout: "验证超时",
    site_changed: "页面已变化",
    network_failed: "连接失败",
  };

  function requestId() {
    return globalThis.crypto?.randomUUID?.()
      ?? `request-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function bridgeRequest(action, payload = {}, timeoutMs = 5000) {
    const id = requestId();
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        pending.delete(id);
        reject(new Error("浏览器桥梁没有响应"));
      }, timeoutMs);
      pending.set(id, { resolve, reject, timeout });
      window.postMessage({
        source: DASHBOARD_SOURCE,
        type: "REQUEST",
        requestId: id,
        action,
        payload,
      }, window.location.origin);
    });
  }

  function parseSubjects(value) {
    const subjects = [];
    const seen = new Set();
    for (const rawLine of value.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line) continue;
      const parts = line.split(/[,，\t]/, 2).map((part) => part.trim());
      const name = parts[0];
      const identity = parts[1] || null;
      if (!name) continue;
      const key = `${name.toLocaleLowerCase()}\u0000${identity ?? ""}`;
      if (seen.has(key)) continue;
      seen.add(key);
      subjects.push({ name, identity });
    }
    if (!subjects.length) throw new Error("请至少输入一个查询主体");
    if (subjects.length > 500) throw new Error("单批最多查询 500 个主体");
    return subjects;
  }

  function setBridgeState(kind, copy) {
    elements["bridge-status"].textContent = copy;
    const container = elements["connection-dot"].parentElement;
    container.classList.toggle("is-online", kind === "online");
    container.classList.toggle("is-error", kind === "error");
  }

  function itemClass(status) {
    if (status?.startsWith("completed_")) return "is-success";
    if (["verification_timeout", "site_changed", "network_failed", "cancelled"].includes(status)) return "is-failure";
    return "";
  }

  function renderTask(task) {
    currentTaskId = task.id;
    elements["empty-task"].hidden = true;
    elements["task-content"].hidden = false;
    elements["task-status"].textContent = statusCopy[task.status] ?? task.status;
    const items = task.items ?? [];
    const successes = items.filter((item) => item.status?.startsWith("completed_"));
    const withRecords = items.filter((item) => item.status === "completed_with_records");
    const empty = items.filter((item) => item.status === "completed_no_records");
    const failed = items.filter((item) => [
      "verification_timeout", "site_changed", "network_failed", "cancelled",
    ].includes(item.status));
    const percent = items.length ? Math.round((successes.length + failed.length) / items.length * 100) : 0;
    elements["metric-total"].textContent = String(items.length);
    elements["metric-completed"].textContent = String(successes.length);
    elements["metric-records"].textContent = String(withRecords.length);
    elements["metric-empty"].textContent = String(empty.length);
    elements["metric-failed"].textContent = String(failed.length);
    elements["progress-value"].textContent = `${successes.length + failed.length} / ${items.length}`;
    elements["progress-fill"].style.width = `${percent}%`;
    elements["task-progress"].setAttribute("aria-valuenow", String(percent));
    elements["task-stage"].textContent = latestStage;
    elements["cancel-query"].disabled = !["queued", "running"].includes(task.status);
    elements["resume-task"].hidden = task.status !== "paused";
    const siteChanged = items.some((item) => item.status === "site_changed");
    elements["resume-task"].disabled = siteChanged;
    elements["resume-task"].title = siteChanged ? "执行网页面变化后需要先更新适配器" : "";
    elements["export-task"].href = `/api/tasks/${task.id}/export.xlsx`;
    elements["export-task"].setAttribute("aria-disabled", "false");
    elements["task-items"].replaceChildren(...items.map((item) => {
      const row = document.createElement("li");
      row.className = "task-row";
      const position = document.createElement("span");
      position.className = "task-position";
      position.textContent = String(item.position).padStart(2, "0");
      const name = document.createElement("span");
      name.className = "task-name";
      name.textContent = item.subject.name;
      const status = document.createElement("span");
      status.className = `item-status ${itemClass(item.status)}`;
      status.textContent = statusCopy[item.status] ?? item.status;
      row.append(position, name, status);
      return row;
    }));
  }

  function renderComparison(comparison) {
    const comparable = comparison.subjects.filter((subject) => subject.comparable);
    if (!comparable.length) {
      elements["comparison-panel"].hidden = true;
      return;
    }
    elements["comparison-panel"].hidden = false;
    elements["comparison-new"].textContent = String(comparison.new_count);
    elements["comparison-unchanged"].textContent = String(comparison.unchanged_count);
    elements["comparison-missing"].textContent = String(comparison.missing_count);
    elements["comparison-baseline"].textContent = String(comparison.baseline_count);

    const previousDates = comparable
      .map((subject) => subject.previous_completed_at)
      .filter(Boolean);
    elements["comparison-date"].textContent = previousDates.length
      ? `最近基线 ${new Date(previousDates[0]).toLocaleDateString("zh-CN")}`
      : "首次成功查询";

    elements["comparison-subjects"].replaceChildren(...comparison.subjects.map((subject) => {
      const row = document.createElement("li");
      const name = document.createElement("strong");
      const summary = document.createElement("span");
      name.textContent = subject.subject.name;
      if (!subject.comparable) {
        summary.textContent = "本次未完成，不参与比较";
        row.className = "is-skipped";
      } else if (!subject.previous_task_id) {
        summary.textContent = `首次记录 ${subject.records.length} 条`;
      } else {
        const count = (status) => subject.records.filter((entry) => entry.status === status).length;
        summary.textContent = `新增 ${count("new")} · 存续 ${count("unchanged")} · 本次未见 ${count("missing")}`;
      }
      row.append(name, summary);
      return row;
    }));
  }

  async function loadComparison(taskId) {
    const response = await fetch(`/api/tasks/${encodeURIComponent(taskId)}/comparison`);
    if (!response.ok) throw new Error("无法读取变化比较");
    renderComparison(await response.json());
  }

  async function loadTask(taskId) {
    const response = await fetch(`/api/tasks/${encodeURIComponent(taskId)}`);
    if (!response.ok) throw new Error("无法读取任务");
    const task = await response.json();
    renderTask(task);
    await loadComparison(taskId).catch(() => {
      elements["comparison-panel"].hidden = true;
    });
    if (["completed", "completed_with_failures", "cancelled", "paused"].includes(task.status)) {
      stopPolling();
      await loadHistory();
    }
    return task;
  }

  function startPolling() {
    if (pollingTimer) return;
    pollingTimer = setInterval(() => {
      if (currentTaskId) loadTask(currentTaskId).catch(() => {});
    }, 1200);
  }

  function stopPolling() {
    if (!pollingTimer) return;
    clearInterval(pollingTimer);
    pollingTimer = null;
  }

  async function loadHistory() {
    const response = await fetch("/api/tasks?limit=20");
    if (!response.ok) return;
    const tasks = await response.json();
    elements["history-empty"].hidden = tasks.length > 0;
    elements["task-history"].replaceChildren(...tasks.map((task) => {
      const row = document.createElement("li");
      row.className = "history-row";
      const button = document.createElement("button");
      button.type = "button";
      button.className = "history-button";
      button.addEventListener("click", () => loadTask(task.id));
      const date = new Date(task.created_at).toLocaleString("zh-CN", {
        month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
      });
      button.innerHTML = `<span class="history-date">${date}</span><span class="history-meta">${task.subject_count} 项</span><span class="history-meta">完成 ${task.completed_count}</span><span class="history-meta">${statusCopy[task.status] ?? task.status}</span>`;
      row.append(button);
      return row;
    }));
  }

  window.addEventListener("message", (event) => {
    if (event.source !== window || event.origin !== window.location.origin) return;
    const data = event.data;
    if (data?.source !== EXTENSION_SOURCE) return;
    if (data.type === "RESPONSE") {
      const waiter = pending.get(data.requestId);
      if (!waiter) return;
      clearTimeout(waiter.timeout);
      pending.delete(data.requestId);
      waiter.resolve(data.response);
      return;
    }
    if (data.type !== "PROGRESS") return;
    const progress = data.event;
    if (progress.type === "BATCH_UPDATE") {
      currentTaskId = progress.taskId;
      latestStage = `正在处理 ${progress.subjectName}`;
      startPolling();
      loadTask(currentTaskId).catch(() => {});
    }
    if (progress.type === "TASK_UPDATE") {
      latestStage = progress.stage || latestStage;
      elements["task-stage"].textContent = latestStage;
      const needsVerification = progress.stage === "请完成安全验证";
      elements["verification-alert"].hidden = !needsVerification;
    }
  });

  elements.subjects.addEventListener("input", () => {
    try {
      elements["subject-count"].textContent = `${parseSubjects(elements.subjects.value).length} 项`;
      elements["form-error"].hidden = true;
    } catch {
      elements["subject-count"].textContent = "0 项";
    }
  });

  elements["query-form"].addEventListener("submit", async (event) => {
    event.preventDefault();
    let subjects;
    try {
      subjects = parseSubjects(elements.subjects.value);
      elements["form-error"].hidden = true;
    } catch (error) {
      elements["form-error"].textContent = error.message;
      elements["form-error"].hidden = false;
      elements.subjects.focus();
      return;
    }
    elements["start-query"].disabled = true;
    latestStage = "正在准备执行网页面";
    setBridgeState("online", "浏览器桥梁已连接");
    startPolling();
    try {
      const response = await bridgeRequest("START_BATCH", { subjects }, 30 * 60 * 1000);
      if (!response?.ok) throw new Error(response?.error || "查询未能开始");
      if (response.result?.taskId) await loadTask(response.result.taskId);
    } catch (error) {
      elements["form-error"].textContent = error.message;
      elements["form-error"].hidden = false;
    } finally {
      elements["start-query"].disabled = false;
    }
  });

  elements["cancel-query"].addEventListener("click", async () => {
    await bridgeRequest("CANCEL_BATCH").catch(() => null);
    if (currentTaskId) setTimeout(() => loadTask(currentTaskId), 350);
  });

  elements["resume-task"].addEventListener("click", async () => {
    if (!currentTaskId) return;
    latestStage = "正在继续任务";
    elements["resume-task"].disabled = true;
    startPolling();
    try {
      const response = await bridgeRequest("RESUME_TASK", { taskId: currentTaskId }, 30 * 60 * 1000);
      if (!response?.ok) throw new Error(response?.error || "任务未能继续");
      await loadTask(currentTaskId);
    } catch (error) {
      elements["form-error"].textContent = error.message;
      elements["form-error"].hidden = false;
    }
  });

  elements["focus-verification"].addEventListener("click", () => {
    bridgeRequest("FOCUS_TARGET").catch(() => null);
  });
  elements["refresh-history"].addEventListener("click", loadHistory);

  Promise.all([
    bridgeRequest("CHECK_STATUS"),
    loadHistory(),
  ]).then(([status]) => {
    if (status?.serviceOnline && status?.paired) {
      setBridgeState("online", "浏览器桥梁已连接");
    } else {
      setBridgeState("error", "浏览器桥梁未就绪");
    }
  }).catch(() => {
    setBridgeState("error", "请安装或重新加载浏览器伴侣");
  });
}());
