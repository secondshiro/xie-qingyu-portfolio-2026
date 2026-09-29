import { expect, test, type Page } from '@playwright/test';

type CurtainSample = { phase: string; url: string; time: number; elapsed: number; transform: string; stone: string; title: string | null };

declare global {
  interface Window {
    transitionProbe: { firstPhase: string | null; phases: string[]; coverStarted: number | null };
    reportCurtain?: (sample: CurtainSample) => void;
  }
}

const cases = [
  { path: '/work/real-estate-gis/', name: '房产 GIS', index: 0 },
  { path: '/work/edgecase-planner/', name: 'AI 评审', index: 1 },
  { path: '/work/brand-system/', name: '品牌系统', index: 2 },
  { path: '/work/execution-query/', name: '执行网助手', index: 3 },
];
const gis = cases[0].path;
const openCase = (page: Page, index = 0) => page.locator(`#work-${index} .work__open`);
const curtain = (page: Page) => page.locator('html');
const settled = (page: Page) => expect(curtain(page)).not.toHaveAttribute('data-page-transition-phase', /.+/);

async function observeTransitions(page: Page) {
  await page.addInitScript(() => {
    window.transitionProbe = { firstPhase: null, phases: [], coverStarted: null };
    new MutationObserver(records => {
      for (const record of records) {
        if (record.target !== document.documentElement) continue;
        const phase = document.documentElement.dataset.pageTransitionPhase;
        if (phase) window.transitionProbe.phases.push(phase);
        if (phase === 'cover') window.transitionProbe.coverStarted = performance.now();
        if (phase) window.reportCurtain?.({
          phase, url: location.pathname, time: Date.now(),
          elapsed: performance.now() - window.transitionProbe.coverStarted!,
          transform: getComputedStyle(document.documentElement, '::before').transform,
          stone: getComputedStyle(document.documentElement, '::before').backgroundColor,
          title: document.querySelector('h1')?.textContent || null,
        });
      }
    }).observe(document, { subtree: true, attributes: true, attributeFilter: ['data-page-transition-phase'] });
    requestAnimationFrame(() => {
      window.transitionProbe.firstPhase = document.documentElement.dataset.pageTransitionPhase || null;
    });
  });
}

for (const { project, width } of cases.flatMap(project => [1440, 390].map(width => ({ project, width })))) {
  test(`${project.name} ${width}px 点击先遮住旧页，导航与新页首次绘制都发生在遮盖之下`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const samples: CurtainSample[] = [];
    await page.exposeFunction('reportCurtain', (sample: CurtainSample) => samples.push(sample));
    await observeTransitions(page);
    await page.goto('/');
    expect(await page.evaluate(() => window.transitionProbe.phases)).toEqual([]);

    let releaseDocument!: () => void;
    let releaseImage!: () => void;
    const documentGate = new Promise<void>(resolve => { releaseDocument = resolve; });
    const imageGate = new Promise<void>(resolve => { releaseImage = resolve; });
    let requestedAt = 0;
    await page.route(`**${project.path}`, async route => {
      requestedAt = Date.now();
      await documentGate;
      const response = await route.fetch();
      const html = (await response.text()).replace('</body>', '<img src="/transition-loading-probe.svg" alt="" width="1" height="1" hidden /></body>');
      await route.fulfill({ response, body: html });
    });
    // Simulate a slow eager resource independently of the case's lazy media.
    await page.route('**/transition-loading-probe.svg', async route => {
      await imageGate;
      await route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1" />' });
    });
    await page.locator(`[data-select="${project.index}"]`).click();
    await openCase(page, project.index).click({ noWaitAfter: true });
    await expect.poll(() => samples.filter(sample => sample.url === '/' && sample.phase === 'covered').length).toBe(1);
    await expect.poll(() => requestedAt).toBeGreaterThan(0);
    const covered = samples.find(sample => sample.url === '/' && sample.phase === 'covered')!;
    expect(covered.elapsed).toBeGreaterThanOrEqual(260);
    expect(requestedAt).toBeGreaterThanOrEqual(covered.time);
    expect(covered).toMatchObject({ stone: 'rgb(232, 230, 224)', transform: 'matrix(1, 0, 0, 1, 0, 0)', title: '产品体验设计师' });

    releaseDocument();
    await page.waitForURL(project.path, { waitUntil: 'domcontentloaded' });
    await expect(curtain(page)).toHaveAttribute('data-page-transition-phase', 'covered');
    await expect.poll(() => page.evaluate(() => window.transitionProbe.firstPhase)).toBe('covered');
    expect(await page.evaluate(() => getComputedStyle(document.documentElement, '::before').transform)).toBe('matrix(1, 0, 0, 1, 0, 0)');
    await page.screenshot({ path: `artifacts/screenshots/transition-${project.index}-stone-${width}.png` });

    // Pause the reveal to inspect its direction without changing production timing.
    await page.evaluate(() => document.documentElement.addEventListener('animationstart', event => {
      if (event.animationName !== 'page-reveal') return;
      for (const animation of document.getAnimations()) {
        if (animation instanceof CSSAnimation && animation.animationName === 'page-reveal') {
          animation.pause();
          animation.currentTime = 190;
        }
      }
    }, { once: true }));
    releaseImage();
    await expect(curtain(page)).toHaveAttribute('data-page-transition-phase', 'reveal');
    await expect.poll(() => page.evaluate(() =>
      new DOMMatrix(getComputedStyle(document.documentElement, '::before').transform).m42,
    )).toBeLessThan(0);
    const offset = await page.evaluate(() => new DOMMatrix(getComputedStyle(document.documentElement, '::before').transform).m42);
    expect(offset).toBeLessThan(0);
    expect(offset).toBeGreaterThan(-900);
    await page.screenshot({ path: `artifacts/screenshots/transition-${project.index}-reveal-${width}.png` });
    await page.evaluate(() => document.getAnimations().forEach(animation => {
      if (animation instanceof CSSAnimation && animation.animationName === 'page-reveal') animation.play();
    }));
    await settled(page);
    await expect(page.locator('h1')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  });
}

for (const project of cases) {
  test(`${project.name} 键盘往返保留唱片与 B 面，返回后操作正常`, async ({ page }) => {
    await observeTransitions(page);
    await page.goto('/');
    await page.locator(`[data-select="${project.index}"]`).click();
    await page.locator('[data-side="b"]').click();
    for (let i = 0; i < 2; i++) {
      await openCase(page, project.index).focus();
      await page.keyboard.press('Enter');
      await expect(page).toHaveURL(project.path);
      await settled(page);
      expect(await page.evaluate(() => window.transitionProbe.phases)).toContain('covered');
      expect(await page.evaluate(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', cancelable: true })))).toBe(true);
      expect(await page.locator('[data-protected-media] img').first().evaluate(el =>
        el.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true })),
      )).toBe(false);
      const returnLink = i === 0 ? '.site-nav__links a' : '.case-closing__links a[href="/#selected-work"]';
      await page.locator(returnLink).click();
      await expect(page).toHaveURL(i === 0 ? '/' : '/#selected-work');
      await settled(page);
      expect(await page.evaluate(() => window.transitionProbe.phases)).toContain('covered');
      await expect(page.locator('[data-side="b"]')).toHaveAttribute('aria-pressed', 'true');
      await expect(page.locator(`[data-select="${project.index}"]`)).toHaveAttribute('aria-pressed', 'true');
      await expect(page.locator('[data-deck]')).toHaveAttribute('data-phase', 'idle');
    }
    await page.locator(`[data-select="${project.index}"]`).focus();
    await page.keyboard.press('ArrowRight');
    const next = (project.index + 1) % cases.length;
    await expect(page.locator(`[data-select="${next}"]`)).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator(`[data-select="${next}"]`)).toBeFocused();
  });
}

test('历史返回保留首页选择与 GIS 阅读位置，目录深链继续展开', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-side="b"]').click();
  await openCase(page).click();
  await expect(page).toHaveURL(gis);
  await settled(page);
  await page.locator('#strategy').scrollIntoViewIfNeeded();
  const readingPosition = await page.evaluate(() => scrollY);
  await page.goBack();
  await expect(page).toHaveURL('/');
  await settled(page);
  await expect(page.locator('[data-side="b"]')).toHaveAttribute('aria-pressed', 'true');
  await page.goForward();
  await expect(page).toHaveURL(gis);
  await settled(page);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(readingPosition - 5);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(readingPosition + 5);
  await page.locator('.case-toc a[href="#strategy"]').click();
  await expect(page.locator('.industry-references')).toHaveAttribute('open');
});

test('全部案例在减弱动效下直接切页，首次访问与刷新不播放', async ({ page }) => {
  await observeTransitions(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  for (const project of cases) {
    await page.locator(`[data-select="${project.index}"]`).click();
    await openCase(page, project.index).click();
    await expect(page).toHaveURL(project.path);
    await expect(page.locator('[data-page-transition]')).toHaveAttribute('data-page-transition', 'portfolio');
    await settled(page);
    expect(await page.evaluate(() => window.transitionProbe.phases)).toEqual([]);
    await page.locator('.site-nav__links a').click();
    await expect(page).toHaveURL('/');
  }
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  for (const project of cases) {
    await page.goto(project.path);
    expect(await page.evaluate(() => window.transitionProbe.phases)).toEqual([]);
    await page.reload();
    expect(await page.evaluate(() => window.transitionProbe.phases)).toEqual([]);
  }
});

test('章节锚点、下载、外链与原型保持原有操作', async ({ page }) => {
  await observeTransitions(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(gis);
  await page.locator('#strategy').scrollIntoViewIfNeeded();
  await page.locator('.case-toc a[href="#strategy"]').click();
  await expect(page).toHaveURL(`${gis}#strategy`);
  await expect(page.locator('.industry-references')).toHaveAttribute('open');
  expect(await page.evaluate(() => window.transitionProbe.phases)).toEqual([]);

  const prototypeOpened = page.waitForEvent('popup');
  await page.locator('.prototype-frame__link').first().click();
  const prototype = await prototypeOpened;
  await expect(prototype).toHaveURL(/projects\/real-estate-gis\/prototypes\/map\//);
  expect(await page.evaluate(() => window.transitionProbe.phases)).toEqual([]);
  await prototype.close();

  await page.context().route('https://react-pro.arco.design/**', route => route.fulfill({ body: '<!doctype html><title>External link fixture</title>' }));
  await page.goto('/work/edgecase-planner/');
  const externalOpened = page.waitForEvent('popup');
  await page.locator('a[href="https://react-pro.arco.design/form/step"]').click();
  const external = await externalOpened;
  await expect(external).toHaveURL('https://react-pro.arco.design/form/step');
  expect(await page.evaluate(() => window.transitionProbe.phases)).toEqual([]);
  await external.close();

  await page.goto('/');
  const downloaded = page.waitForEvent('download');
  await page.locator('.resume').click();
  await downloaded;
  await page.locator('.bar__name').click();
  await expect(page).toHaveURL('/#main');
  expect(await page.evaluate(() => window.transitionProbe.phases)).toEqual([]);
});

test('禁用 JavaScript 与会话存储时全部案例仍能进入并返回', async ({ browser, baseURL, page }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const plain = await context.newPage();
  await plain.goto(`${baseURL}/`);
  for (const project of cases) {
    await plain.locator(`.no-script a[href="${project.path}"]`).click();
    await expect(plain).toHaveURL(`${baseURL}${project.path}`);
    await plain.locator('.site-nav__links a').click();
    await expect(plain).toHaveURL(`${baseURL}/`);
    await expect(plain.locator('h1')).toBeVisible();
  }
  await context.close();

  await observeTransitions(page);
  await page.addInitScript(() => {
    Object.defineProperty(window, 'sessionStorage', { get() { throw new DOMException('Unavailable', 'SecurityError'); } });
  });
  await page.goto('/');
  for (const project of cases) {
    await page.locator(`[data-select="${project.index}"]`).click();
    await openCase(page, project.index).click();
    await expect(page).toHaveURL(project.path);
    expect(await page.evaluate(() => window.transitionProbe.phases)).toEqual([]);
    await page.locator('.site-nav__links a').click();
    await expect(page.locator('h1')).toBeVisible();
  }
});
