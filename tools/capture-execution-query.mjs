import { chromium } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';

// Render production HTML/CSS/JS with synthetic API and browser bridge responses.
const root = new URL('../execution-query-tool/src/execution_query/web/', import.meta.url);
const output = new URL('../public/projects/execution-query/', import.meta.url);
const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
try {
  for (const state of ['console', 'verification-waiting', 'trial-completion']) {
    const waiting = state === 'verification-waiting';
    const names = state === 'console' ? ['示例甲公司', '示例乙公司', '示例丙公司'] : ['合成数据示例甲有限公司', '合成数据示例乙有限公司'];
    const task = {
      id: 'synthetic-task', status: waiting ? 'running' : state === 'console' ? 'completed_with_failures' : 'completed',
      created_at: '2026-09-12T06:32:00Z', subject_count: names.length, completed_count: waiting ? 0 : 2,
      items: names.map((name, i) => ({ position: i + 1, subject: { name }, status: waiting ? (i ? 'queued' : 'awaiting_verification') : ['completed_with_records', 'completed_no_records', 'network_failed'][i] })),
    };
    const comparison = {
      new_count: 0, unchanged_count: 1, missing_count: 0, baseline_count: 0,
      subjects: names.map((name, i) => ({ subject: { name }, comparable: !waiting && i < 2, previous_task_id: 'synthetic-baseline', previous_completed_at: '2026-09-05T06:32:00Z', records: i ? [] : [{status: 'unchanged'}] })),
    };
    const page = await browser.newPage({ viewport: { width: 1440, height: 960 }, locale: 'zh-CN', timezoneId: 'Asia/Shanghai' });
    await page.route('http://execution-query.test/**', async route => {
      const path = new URL(route.request().url()).pathname;
      if (path.startsWith('/api/')) return route.fulfill({ json: path.endsWith('/comparison') ? comparison : path === '/api/tasks' ? [task] : task });
      const file = path.startsWith('/app/assets/') ? path.slice(5) : 'index.html';
      await route.fulfill({ body: await readFile(new URL(file, root)), contentType: file.endsWith('.css') ? 'text/css' : file.endsWith('.js') ? 'application/javascript' : 'text/html' });
    });
    await page.addInitScript(() => {
      window.addEventListener('message', event => {
        if (event.data?.source !== 'execution-query-dashboard') return;
        window.postMessage({source: 'execution-query-extension', type: 'RESPONSE', requestId: event.data.requestId, response: {serviceOnline: true, paired: true}}, location.origin);
      });
    });
    await page.goto('http://execution-query.test/app/');
    await page.locator('.history-button').click();
    await page.locator('#subjects').fill(names.join('\n'));
    await page.locator('#subjects').blur();
    await page.evaluate(waiting => {
      window.postMessage({source: 'execution-query-extension', type: 'PROGRESS', event: {type: 'TASK_UPDATE', stage: waiting ? '请完成安全验证' : '本地查询已完成'}}, location.origin);
    }, waiting);
    await page.locator('#task-stage').filter({hasText: waiting ? '请完成安全验证' : '本地查询已完成'}).waitFor();
    await page.evaluate(() => document.fonts.ready);
    assert.equal(await page.locator('#resume-task').isVisible(), false, 'Resume must stay hidden outside paused tasks');
    for (const width of [320, 375, 390, 578, 860, 1024, 1440]) {
      await page.setViewportSize({width, height: 960});
      const layout = await page.locator('h1').evaluate(el => {
        const spans = [...el.children];
        return { overflow: document.documentElement.scrollWidth > innerWidth, lines: spans.map(span => { const range = document.createRange(); range.selectNodeContents(span); return [...range.getClientRects()].map(r => r.y); }), tops: spans.map(s => s.getBoundingClientRect().top) };
      });
      assert.equal(layout.overflow, false, `${state}: overflow at ${width}`);
      assert.ok(layout.lines.every(lines => new Set(lines).size === 1), `${state}: phrase split at ${width}`);
      assert.ok(layout.tops[1] > layout.tops[0], `${state}: comma break missing`);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: `/private/tmp/execution-query-${state}.png`, fullPage: state !== 'console', animations: 'disabled' });
    await sharp(`/private/tmp/execution-query-${state}.png`).webp({quality: 90}).toFile(fileURLToPath(new URL(`${state}-synthetic.webp`, output)));
    console.log(`${state}: captured; heading and overflow passed at 7 widths`);
    await page.close();
  }
} finally { await browser.close(); }
