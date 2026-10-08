import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { chromium } from '@playwright/test';

const out = 'artifacts/gis-revision-20261008';
const checkCopy = text => {
  assert.ok(!/切换模块后却要重新找到|每次切换还需要重新确认|省去再次搜索和确认|识别分散入口与状态衔接问题/.test(text), '检测到已撤回的旧系统判断');
};
if (process.argv[2] === '--check-copy') {
  checkCopy(await readFile(process.argv[3], 'utf8'));
  console.log('公开事实检查通过');
} else {
  const base = process.env.GIS_VERIFY_URL || 'http://127.0.0.1:4338';
  await mkdir(out, { recursive: true });
  const baseline = JSON.parse(await readFile(`${out}/baseline/manifest.json`, 'utf8'));
  const protectedPaths = Object.keys(baseline).filter(path => path.startsWith('tests/') || ['package.json', 'package-lock.json', 'playwright.config.ts', 'src/pages/work/brand-system.astro', 'src/pages/work/edgecase-planner.astro', 'src/pages/work/execution-query.astro'].includes(path));
  for (const path of protectedPaths) {
    const digest = createHash('sha256').update(await readFile(path)).digest('hex');
    assert.equal(digest, baseline[path], `只读文件改变 ${path}`);
  }
  for (const path of ['src/pages/work/real-estate-gis.astro', 'src/pages/index.astro', 'tools/build-resume.py']) checkCopy(await readFile(path, 'utf8'));
  const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
  const errors = [], report = [];
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce', locale: 'zh-CN', timezoneId: 'Asia/Shanghai' });
  page.on('pageerror', error => errors.push(error.message));
  const fullCopy = () => page.evaluate(() => { const body=document.body.cloneNode(true); body.querySelectorAll('script,style').forEach(n=>n.remove()); return body.textContent; });
  const proto = name => `${base}/projects/real-estate-gis/prototypes/${name}/index.html?building=宇济一号&code=17幢`;
  try {
    await page.goto(proto('map'));
    await page.locator('#closeObject').click();
    assert.equal(await page.locator('#rightPanel').isVisible(), false);
    await page.locator('[data-code="17幢"]').focus();
    await page.keyboard.press('Enter');
    assert.match(await page.locator('#objectTitle').innerText(), /17幢/);
    await page.locator('#businessToggle').click();
    assert.equal(await page.locator('[data-business]').count(), 4);
    await page.locator('[data-business="无图幢手工建楼盘"]').click();
    assert.match(await page.locator('#toast').innerText(), /完整流程未展开/);
    await page.locator('#viewFloor').click();
    await page.waitForURL(/building/);
    const cells = await page.locator('.room').evaluateAll(nodes => nodes.map(node => ({ unit: Number(node.dataset.unit), number: node.dataset.room, area: Number(node.dataset.area) })));
    assert.equal(cells.length, 322);
    assert.equal(await page.locator('.row').count(), 27);
    const invalidBands = await page.locator('.room').evaluateAll(nodes => nodes.flatMap(node => [...node.querySelectorAll('.state-band i')].filter((band, index) => band.style.getPropertyValue('--state') !== GIS_DEMO.statuses.find(status => status.key === node.dataset.states.split(',')[index])?.color)));
    assert.equal(invalidBands.length, 0, '户室色带必须与图例定义一致');
    await page.locator('#owner').check();
    assert.equal(await page.locator('.room').first().locator('.room__label').innerText(), await page.locator('.room').first().getAttribute('data-owner'));
    await page.locator('#owner').uncheck();
    assert.match(await page.locator('.room').first().locator('.room__label').innerText(), /^[★●△□]/);
    await page.locator('[data-unit="1"][data-room="1501"]').click();
    assert.match(await page.locator('#roomArea').innerText(), /94.20/);
    const selectedBand = await page.locator('.room.selected .state-band i').count();
    assert.ok(selectedBand > 0, '选中不能覆盖业务色带');
    await page.locator('#legendToggle').check();
    const labels = await page.locator('#legend .legend-item').allTextContents();
    assert.equal(labels.length, 20);
    for (const label of ['已确权', '已预查封', '已租赁', '已在建工程抵押', '已客体灭失', '未缴纳维修基金']) assert.ok(labels.includes(label), label);
    assert.equal(await page.locator('#legend input[value="filing"]').locator('..').locator('.swatch').evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(206, 231, 255)');
    assert.equal(await page.getByRole('button', { name: /可售|可定/ }).count(), 0);
    await page.locator('#back').click();
    await page.waitForURL(/map/);
    assert.match(await page.locator('#objectTitle').innerText(), /17幢/);
    await page.locator('#objectMeasured').click();
    await page.waitForURL(/task/);
    await page.locator('#toStep2').click();
    assert.match(await page.locator('#step2').innerText(), /未检查真实关联/);
    assert.match(await page.locator('#step2').innerText(), /未查询历史替换记录/);
    await page.locator('#toStep3').click();
    assert.equal(await page.locator('#submitBtn').isDisabled(), true);
    assert.match(await page.locator('#gateHint').innerText(), /结构关系待业务确认/);
    const taskRooms = await page.evaluate(() => PREDICTS.map(room => ({ unit: room.unit, number: room.number, area: room.mj, floor: room.dy })));
    assert.equal(taskRooms.length, cells.length);
    assert.equal(Math.max(...taskRooms.map(room => room.floor)), 27);
    for (const cell of cells) assert.equal(taskRooms.find(room => room.unit === cell.unit && room.number === cell.number)?.area, cell.area);
    const counts = await page.evaluate(() => ({ total: Number(document.getElementById('fTotal').textContent), linked: Number(document.getElementById('fLinked').textContent), review: Number(document.getElementById('fReview').textContent), unlinked: Number(document.getElementById('fUnlinked').textContent) }));
    assert.equal(counts.total, counts.linked + counts.review + counts.unlinked);
    await page.evaluate(() => { LINKS.forEach(link => link.confirmed = true); renderAll(); });
    assert.equal(await page.locator('#submitBtn').isDisabled(), true, '确认关联不能放行结构变化');
    const interactionCopy = [];
    await page.goto(proto('task') + '&step=3&view=cards&filter=review');
    // Exercise the real controls with a transient one-pair dataset; no functions or responses are replaced.
    await page.evaluate(() => { const p = PREDICTS.find(room => room.id === 'p15_1_1'), m = MEASURES.find(room => room.id === 'm15_1_1'); PREDICTS = [p]; MEASURES = [m]; LINKS = [{ id: 'check-pair', pred: p.id, meas: m.id, kind: 'match', confirmed: false }]; renderAll(); });
    assert.equal(await page.locator('#submitBtn').isDisabled(), true);
    await page.locator('[data-card-id="p15_1_1"] .rg__head').click();
    interactionCopy.push(await fullCopy());
    await page.locator('#drawerActions').getByRole('button', { name: '确认关联', exact: true }).click();
    assert.equal(await page.locator('#drawerMask').getAttribute('aria-hidden'), 'true');
    assert.equal(await page.locator('#submitBtn').isDisabled(), false);
    await page.locator('#submitBtn').click();
    assert.match(await page.locator('#auditModal').innerText(), /不会提交入库或审核/);
    interactionCopy.push(await fullCopy());
    await page.locator('#auditConfirm').click();
    assert.match(await page.locator('#toastMsg').innerText(), /未实际提交入库/);
    report.push({ prototypes: '选中与取消、四个全局入口、20 项图例、322 户共享属性、27 层、结构项阻断、人工确认与演示摘要通过', counts });
    const prototypeText = interactionCopy;
    for (const name of ['map', 'building', 'task']) {
      await page.goto(proto(name) + (name === 'task' ? '&step=3&view=cards&filter=review' : ''));
      if (name === 'building') await page.locator('#legendToggle').check();
      prototypeText.push(await fullCopy());
      prototypeText.push(await page.locator('[title],[aria-label],[placeholder]').evaluateAll(nodes => nodes.map(n => ['title','aria-label','placeholder'].map(a => n.getAttribute(a)).filter(Boolean).join('\n')).join('\n')));
    }
    await writeFile(`${out}/prototype-copy.txt`, prototypeText.join('\n'));
    for (const width of [1440, 1010, 390]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`${base}/work/real-estate-gis/`);
      await page.locator('#strategy summary').click();
      assert.equal(await page.locator('h1').count(), 1);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth) <= 1);
      for (const image of await page.locator('main img').all()) {
        if (await image.isVisible()) { await image.scrollIntoViewIfNeeded(); await image.evaluate(img => img.decode()); }
        else assert.equal((await page.request.get(new URL(await image.getAttribute('src'), base).href)).status(), 200, '隐藏的窄屏海报资源也必须可加载');
      }
      const media = await page.locator('.evidence-grid .media-stage').evaluateAll(figures => figures.map(figure => {
        const frame = figure.querySelector('.media-stage__frame'), img = frame.querySelector('img'), f = frame.getBoundingClientRect(), i = img.getBoundingClientRect();
        return { ratio: f.width / f.height, fit: getComputedStyle(img).objectFit, inside: i.top >= f.top - 1 && i.bottom <= f.bottom + 1 && i.left >= f.left - 1 && i.right <= f.right + 1, protected: !!figure.closest('[data-protected-media]'), loaded: img.naturalWidth > 0 };
      }));
      for (const item of media) { assert.ok(Math.abs(item.ratio - 16/9) < 0.01); assert.equal(item.fit, 'contain'); assert.ok(item.inside && item.protected && item.loaded); }
      const frameCounts = await page.locator('iframe').count(); assert.equal(frameCounts, 3);
      if (width === 390) for (const frame of await page.locator('iframe').all()) assert.equal(await frame.isVisible(), false);
      for (const id of ['problem', 'workspaces', 'tradeoffs', 'impact']) await page.locator(`#${id}`).screenshot({ path: `${out}/case-${id}-${width}.png` });
      await page.evaluate(() => scrollTo(0, 0));
      await page.screenshot({ path: `${out}/case-${width}.png`, fullPage: true });
      const copy = await fullCopy();
      const metadata = await page.locator('[alt]').evaluateAll(nodes => nodes.map(n => n.getAttribute('alt')).join('\n'));
      await writeFile(`${out}/case-copy-${width}.txt`, copy + '\n' + metadata);
      report.push({ width, mediaCount: media.length, overflow: 0, h1: 1, prototypeFrames: 3 });
    }
    await page.goto(`${base}/`);
    const home = await page.locator('[data-work="0"]').textContent();
    checkCopy(home);
    await writeFile(`${out}/home-gis-copy.txt`, home);
    assert.equal(errors.length, 0, errors.join('\n'));
    report.push({ runtimeErrors: errors.length, frozenFiles: protectedPaths.length });
    await writeFile(`${out}/verification.json`, JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
  } finally { await browser.close(); }
}
