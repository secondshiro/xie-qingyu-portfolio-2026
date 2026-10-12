import { chromium } from '@playwright/test';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn, execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { runBatchTask, runStoredTask } from '../execution-query-tool/extension/src/service-worker.mjs';

// Local fault simulation. Real dashboard, extension batch dispatcher, API, SQLite,
// comparison and XLSX exporter. Only the per-subject website reader is simulated.
// This does not contact the court website or exercise security verification.
const root = fileURLToPath(new URL('../', import.meta.url));
const output = join(root, 'public/projects/execution-query');
const python = join(root, 'execution-query-tool/.venv/bin/python');
const scratch = await mkdtemp(join(tmpdir(), 'execution-query-recovery-'));
const origin = 'chrome-extension://abcdefghijklmnopabcdefghijklmnop';
const base = 'http://127.0.0.1:52017';
const server = spawn(python, ['-m', 'uvicorn', 'execution_query.api:app', '--host', '127.0.0.1', '--port', '52017'], {
  cwd: join(root, 'execution-query-tool'),
  env: { ...process.env, EXECUTION_QUERY_DATABASE_PATH: join(scratch, 'isolated.sqlite3'), EXECUTION_QUERY_EXTENSION_ORIGIN: origin },
  stdio: 'pipe',
});
let serverLog = '';
server.stderr.on('data', chunk => { serverLog += chunk; });
const names = ['合成示例甲公司', '合成示例乙公司', '合成示例丙公司'];
const trace = { kind: 'local-fault-simulation', capturedAt: new Date().toISOString(), websiteContacted: false, syntheticData: true, queries: [], requests: [], checks: [], snapshots: {}, sourceHashes: {} };
let browser;
try {
  let ready = false;
  for (let i = 0; i < 60; i++) {
    if (server.exitCode !== null) throw new Error(serverLog);
    try { if ((await fetch(`${base}/api/tasks`)).ok) { ready = true; break; } } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert.ok(ready, `Isolated server did not start: ${serverLog}`);
  const apiFetch = async (url, options = {}) => {
    const path = new URL(url, base).pathname;
    trace.requests.push({ method: options.method ?? 'GET', path });
    return fetch(`${base}${path}`, { ...options, headers: { ...options.headers, Origin: origin } });
  };
  const post = async (path, body) => {
    const response = await apiFetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    assert.ok(response.ok, await response.clone().text());
    return response.json();
  };
  const record = (index) => ({ ref: `synthetic-${index}`, name: names[index], filingDate: '2026-10-01', caseNumber: `合成案号-${index + 1}`, detail: { '执行法院': '合成示例法院', '执行标的': '10000' } });
  // A previous successful result for the subject that will fail is necessary to
  // verify failure cannot be misrepresented as disappearance.
  const baseline = await post('/api/tasks', { subjects: [{ name: names[2] }] });
  await post(`/api/tasks/${baseline.id}/items/${baseline.items[0].id}/result`, { record_count: 1, detail_count: 1, records: [{ ref: 'synthetic-2', name: names[2], case_number: '合成案号-3', detail: record(2).detail }] });
  const baselineBefore = await (await apiFetch(`/api/tasks/${baseline.id}`)).json();
  browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 }, locale: 'zh-CN', timezoneId: 'Asia/Shanghai', acceptDownloads: true });
  const emit = async event => page.evaluate(event => window.postMessage({ source: 'execution-query-extension', type: 'PROGRESS', event }, location.origin), event);
  const chromeApi = { runtime: { lastError: null, sendMessage(event, callback) { emit(event).then(() => callback()).catch(() => callback()); } } };
  let currentTaskId;
  let recovering = false;
  const queryRunner = async ({ query }) => {
    trace.queries.push({ subject: query.subject, recovering });
    const index = names.indexOf(query.subject);
    if (index === 2 && !recovering) throw new Error('manual verification timed out');
    return index === 1 ? { recordCount: 0, detailCount: 0, records: [] } : { recordCount: 1, detailCount: 1, records: [record(index)] };
  };
  const deps = { chromeApi, fetchImpl: apiFetch, tab: { id: 1, url: 'https://zxgk.court.gov.cn/zhzxgk/' }, queryRunner };
  await page.exposeFunction('syntheticBridge', async ({ action, payload }) => {
    if (action === 'CHECK_STATUS') return { serviceOnline: true, paired: true };
    try {
      if (action === 'START_BATCH') {
        const result = await runBatchTask({ ...deps, subjects: payload.subjects });
        currentTaskId = result.taskId;
        return { ok: true, result };
      }
      if (action === 'RESUME_TASK') {
        recovering = true;
        const result = await runStoredTask({ ...deps, taskId: payload.taskId });
        return { ok: true, result };
      }
      throw new Error(`Unexpected bridge action ${action}`);
    } catch (error) {
      currentTaskId = error.taskId;
      return { ok: false, error: error.message };
    }
  });
  await page.addInitScript(() => window.addEventListener('message', async event => {
    if (event.source !== window || event.data?.source !== 'execution-query-dashboard' || event.data.type !== 'REQUEST') return;
    const response = await window.syntheticBridge(event.data);
    window.postMessage({ source: 'execution-query-extension', type: 'RESPONSE', requestId: event.data.requestId, response }, location.origin);
  }));
  await page.goto(`${base}/app/`);
  await page.locator('#subjects').fill(names.join('\n'));
  await page.locator('#start-query').click();
  await page.locator('#task-status').filter({ hasText: '处理结束，有未完成项' }).waitFor();
  assert.equal(await page.locator('#progress-value').innerText(), '已处理 3 / 3');
  assert.equal(await page.locator('#metric-completed').innerText(), '2');
  assert.equal(await page.locator('#metric-failed').innerText(), '1');
  assert.equal(await page.locator('#resume-task').innerText(), '重试未完成项');
  assert.equal(await page.locator('#resume-task').isEnabled(), true);
  assert.match(await page.locator('#comparison-subjects').innerText(), /本次未完成，不参与比较/);
  const task = () => apiFetch(`/api/tasks/${currentTaskId}`).then(response => response.json());
  const comparison = () => apiFetch(`/api/tasks/${currentTaskId}/comparison`).then(response => response.json());
  trace.snapshots.before = await task();
  trace.snapshots.comparisonBefore = await comparison();
  assert.equal(trace.snapshots.comparisonBefore.missing_count, 0);
  const preservedSuccess = trace.snapshots.before.items.slice(0, 2);
  const exportWorkbook = async label => {
    const download = page.waitForEvent('download');
    await page.locator('#export-task').click();
    const file = join(scratch, `${label}.xlsx`);
    await (await download).saveAs(file);
    const rows = JSON.parse(execFileSync(python, ['-c', 'import json,sys; from openpyxl import load_workbook; w=load_workbook(sys.argv[1]); print(json.dumps({s.title:list(s.values) for s in w},ensure_ascii=False,default=str))', file], { encoding: 'utf8' }));
    trace.snapshots[`${label}Export`] = rows;
    return rows;
  };
  const beforeExport = await exportWorkbook('before');
  assert.equal(beforeExport['未完成'].length, 2);
  assert.equal(beforeExport['案件明细'].length, 2);
  assert.equal(beforeExport['查询汇总'][3][3], '等待验证超时');
  const capture = async filename => {
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.locator('.workspace').screenshot({ path: join(scratch, `${filename}.png`), animations: 'disabled' });
    await sharp(join(scratch, `${filename}.png`)).webp({ quality: 90 }).toFile(join(output, `${filename}.webp`));
  };
  await capture('console-synthetic');
  await page.locator('#resume-task').click();
  await page.locator('#task-status').filter({ hasText: /^已完成$/ }).waitFor();
  trace.snapshots.after = await task();
  trace.snapshots.comparisonAfter = await comparison();
  assert.deepEqual(trace.snapshots.after.items.slice(0, 2), preservedSuccess);
  assert.deepEqual(trace.queries.filter(query => query.recovering).map(query => query.subject), [names[2]]);
  assert.deepEqual(await (await apiFetch(`/api/tasks/${baseline.id}`)).json(), baselineBefore);
  assert.equal(trace.snapshots.comparisonAfter.unchanged_count, 1);
  assert.equal(trace.snapshots.comparisonAfter.missing_count, 0);
  assert.equal(await page.locator('#resume-task').isVisible(), false);
  assert.equal(await page.locator('#form-error').isVisible(), false);
  const afterExport = await exportWorkbook('after');
  assert.equal(afterExport['未完成'].length, 1);
  assert.equal(afterExport['案件明细'].length, 3);
  await page.locator('#refresh-history').click();
  await page.locator('.history-button').first().click();
  assert.equal(await page.locator('#metric-completed').innerText(), '3');
  await capture('recovery-completed-synthetic');
  for (const width of [320, 375, 390, 578, 860, 1024, 1440]) {
    await page.setViewportSize({ width, height: 960 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `overflow at ${width}`);
  }
  trace.checks = ['processed3_success2_failed1', 'last_failure_retry_visible', 'failure_excluded_from_comparison', 'before_export_failure_not_empty', 'only_failed_subject_requeried', 'successful_items_unchanged', 'baseline_history_unchanged', 'after_export_preserves_records', 'history_reopens_completed_task', 'no_overflow_at_7_widths'];
  for (const file of ['tools/capture-execution-query.mjs', 'execution-query-tool/src/execution_query/web/assets/dashboard.js', 'execution-query-tool/src/execution_query/web/index.html', 'execution-query-tool/extension/src/service-worker.mjs', 'execution-query-tool/src/execution_query/task_repository.py', 'execution-query-tool/src/execution_query/api.py', 'execution-query-tool/src/execution_query/exporter.py']) {
    trace.sourceHashes[file] = createHash('sha256').update(await readFile(join(root, file))).digest('hex');
  }
  await writeFile(join(output, 'recovery-evidence.json'), `${JSON.stringify(trace, null, 2)}\n`);
  console.log(`Recovery passed: ${trace.checks.join(', ')}. Isolated data retained at ${scratch}`);
} finally {
  await browser?.close();
  server.kill('SIGTERM');
}
