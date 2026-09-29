import { test, expect } from '@playwright/test';

const projects = ['房产 GIS 体验重构', '把设计经验整理成可复用的 AI 工作流', '新禾智飞品牌系统提案', '执行网查询助手'];
const select = (page, index) => page.locator(`[data-select="${index}"]`);
const deck = page => page.locator('[data-deck]');

test('四张印刷封面加载成功，中文目录标签在封面之外且保留作品选择', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 810 });
  await page.goto('/');
  for (let i = 0; i < 4; i++) {
    const sleeve = select(page, i);
    await expect(sleeve.locator('.sleeve__cover')).toHaveText('');
    expect(await sleeve.locator('img').evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
    const geometry = await sleeve.evaluate(el => ({
      cover: el.querySelector('.sleeve__cover').getBoundingClientRect().bottom,
      caption: el.querySelector('.sleeve__caption').getBoundingClientRect().top,
      bottom: el.querySelector('.sleeve__caption').getBoundingClientRect().bottom,
      panel: document.querySelector('.panel').getBoundingClientRect().top,
    }));
    expect(geometry.caption - geometry.cover).toBe(12);
    expect(geometry.panel - geometry.bottom).toBeGreaterThanOrEqual(40);
    await sleeve.click();
    await expect(sleeve).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator(`[data-work="${i}"]`)).toBeVisible();
  }
});

for (const width of [320, 375, 390, 768, 1010, 1024, 1280, 1440]) {
  test(`${width}px 个人定位、四个封套与全部详情可读，无横向溢出`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('h1')).toHaveText('产品体验设计师');
    for (let i = 0; i < 4; i++) {
      await expect(select(page, i).locator('.sleeve__title')).toBeVisible();
      await select(page, i).click();
      for (const face of ['a', 'b']) {
        await page.locator(`[data-side="${face}"]`).click();
        await expect(page.locator(`[data-work="${i}"] [data-face="${face}"]`)).toBeVisible();
        expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
      }
    }
    const fits = await page.locator('.sleeve__cover').evaluateAll(elements => elements.every(el => {
      const box = el.getBoundingClientRect();
      return [...el.children].every(child => {
        const rect = child.getBoundingClientRect();
        return rect.left >= box.left && rect.right <= box.right + 1 && rect.bottom <= box.bottom + 1;
      });
    }));
    expect(fits).toBe(true);
  });
}

test('先抽片再抬臂换片，阅读反馈立即生效，最终唱片与选择一致', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    window.phases = [];
    new MutationObserver(() => window.phases.push(document.querySelector('[data-deck]').dataset.phase))
      .observe(document.querySelector('[data-deck]'), { attributes: true, attributeFilter: ['data-phase'] });
  });
  await select(page, 1).click();
  await expect(select(page, 1)).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#work-1 h2')).toHaveText(projects[1]);
  await expect(deck(page)).toHaveAttribute('data-phase', 'extracting');
  await expect(deck(page)).toHaveAttribute('data-loaded', '0');
  const vinyl = select(page, 1).locator('.sleeve__record');
  const initialY = await vinyl.evaluate(el => new DOMMatrix(getComputedStyle(el).transform).m42);
  await page.waitForTimeout(200);
  expect(await vinyl.evaluate(el => new DOMMatrix(getComputedStyle(el).transform).m42)).toBeLessThan(initialY - 5);
  await expect(deck(page)).toHaveAttribute('data-phase', 'idle');
  expect(await page.evaluate(() => window.phases)).toEqual(['extracting', 'lifting', 'outgoing', 'incoming', 'lowering', 'idle']);
  await expect(deck(page)).toHaveAttribute('data-loaded', '1');
  expect(await page.evaluate(() => document.getAnimations().filter(a => a.effect?.target.classList?.contains('sleeve__record')).length)).toBe(0);
});

for (const phase of ['extracting', 'lifting', 'outgoing', 'incoming', 'lowering']) {
  test(`在 ${phase} 阶段改选，最后一次选择生效且无动画残留`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/');
    await select(page, 1).click();
    await page.waitForFunction(phase => document.querySelector('[data-deck]').dataset.phase === phase, phase, { polling: 'raf' });
    await select(page, 3).click();
    await expect(select(page, 3)).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#work-3 h2')).toBeVisible();
    await expect(deck(page)).toHaveAttribute('data-phase', 'idle');
    await expect(deck(page)).toHaveAttribute('data-loaded', '3');
    expect(await page.locator('[data-extracting]').count()).toBe(0);
    expect(await page.locator('[data-record]').evaluate(el => ({ opacity: getComputedStyle(el).opacity, transform: getComputedStyle(el).transform }))).toEqual({ opacity: '1', transform: 'none' });
    expect(errors).toEqual([]);
  });
}

test('减弱动效在切换中生效，直接同步最终状态', async ({ page }) => {
  await page.goto('/');
  await select(page, 1).click();
  await expect(deck(page)).toHaveAttribute('data-phase', 'extracting');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(deck(page)).toHaveAttribute('data-phase', 'idle');
  await expect(deck(page)).toHaveAttribute('data-loaded', '1');
  expect(await page.locator('.deck .record__label').evaluate(el => getComputedStyle(el, '::before').animationName)).toBe('none');
  await select(page, 2).click();
  await expect(deck(page)).toHaveAttribute('data-loaded', '2');

});

test('键盘焦点可见，左右键选片，上下键切换 A/B 且不滚动', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 700 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.locator('.skip')).toBeFocused();
  await page.keyboard.press('Enter');
  await select(page, 0).focus();
  await page.keyboard.press('ArrowRight');
  await expect(select(page, 1)).toBeFocused();
  await expect(select(page, 1)).toHaveAttribute('aria-pressed', 'true');
  expect(await select(page, 1).evaluate(el => getComputedStyle(el).boxShadow)).toBe('none');
  expect(await select(page, 1).locator('.sleeve__title').evaluate(el => getComputedStyle(el).textDecorationLine)).toBe('underline');
  await page.locator('.intro__actions a[href^="mailto:"]').focus();
  await page.keyboard.press('ArrowRight');
  await expect(select(page, 2)).toHaveAttribute('aria-pressed', 'true');
  const before = await page.evaluate(() => scrollY);
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('[data-side="b"]')).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(() => scrollY)).toBe(before);
  await page.keyboard.press('ArrowUp');
  await expect(page.locator('[data-side="a"]')).toHaveAttribute('aria-pressed', 'true');
});

test('无 JavaScript 有四个案例入口，简历下载与案例链接可用', async ({ browser, request }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4331/');
  await expect(page.locator('noscript a')).toHaveCount(4);
  for (const link of await page.locator('noscript a').all()) {
    await expect(link).toBeVisible();
    const response = await request.get(await link.getAttribute('href'));
    expect(response.ok()).toBe(true);
  }
  const pdf = await request.get('/resume/xie-qingyu-resume.pdf');
  expect((await pdf.body()).subarray(0, 5).toString()).toBe('%PDF-');
  await context.close();
});

for (const width of [320, 1440]) {
  test(`${width}px 选中唱片离开封套，改选滑回且无横向溢出`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await page.evaluate(() => {
      window.maxOverflow = 0;
      window.monitorAnimation = true;
      const sample = () => {
        window.maxOverflow = Math.max(window.maxOverflow, document.documentElement.scrollWidth - innerWidth);
        if (window.monitorAnimation) requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    });
    await select(page, 3).click();
    await page.waitForFunction(() => document.querySelector('[data-deck]').dataset.phase === 'lifting', null, { polling: 'raf' });
    const vinyl = select(page, 3).locator('.sleeve__record');
    const pulled = await vinyl.evaluate(el => new DOMMatrix(getComputedStyle(el).transform).m42);
    expect(pulled).toBeLessThan(-20);
    await expect(deck(page)).toHaveAttribute('data-phase', 'idle');
    expect(await vinyl.evaluate(el => new DOMMatrix(getComputedStyle(el).transform).m42)).toBeCloseTo(pulled, 0);
    expect(await vinyl.evaluate(el => getComputedStyle(el).opacity)).toBe('0');
    await select(page, 2).click();
    await page.waitForTimeout(180);
    const returning = await vinyl.evaluate(el => new DOMMatrix(getComputedStyle(el).transform).m42);
    expect(returning).toBeGreaterThan(pulled);
    expect(returning).toBeLessThan(0);
    await expect(deck(page)).toHaveAttribute('data-phase', 'idle');
    expect(await vinyl.evaluate(el => new DOMMatrix(getComputedStyle(el).transform).m42 / el.getBoundingClientRect().height)).toBeCloseTo(-0.24, 2);
    expect(await vinyl.evaluate(el => getComputedStyle(el).opacity)).toBe('1');
    expect(await page.evaluate(() => { window.monitorAnimation = false; return window.maxOverflow; })).toBeLessThanOrEqual(1);
  });
}

for (const [width, height] of [[1440,810], [1440,900], [1536,864], [1920,1080]]) {
  test(`${width}×${height} 切换全部作品及两面无需滚动，动效与完整说明同屏`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    const visibleInScreen = async selector => {
      const boxes = await page.locator(selector).evaluateAll(elements => elements.map(el => {
        const { top, bottom, left, right } = el.getBoundingClientRect();
        return { top, bottom, left, right };
      }));
      expect(boxes.length).toBeGreaterThan(0);
      for (const box of boxes) {
        expect(box.top).toBeGreaterThanOrEqual(0);
        expect(box.bottom).toBeLessThanOrEqual(height);
        expect(box.left).toBeGreaterThanOrEqual(0);
        expect(box.right).toBeLessThanOrEqual(width);
      }
    };
    await visibleInScreen('h1, .intro__lead, .intro__actions, .deck, .sleeve__cover, .sides');
    for (let i = 0; i < 4; i++) {
      await select(page, i).click();
      for (const face of ['a', 'b']) {
        await page.locator(`[data-side="${face}"]`).click();
        expect(await page.evaluate(() => scrollY)).toBe(0);
        await visibleInScreen(`[data-work="${i}"] .work__heading, [data-work="${i}"] [data-face="${face}"], [data-work="${i}"] .work__open`);
        await expect(page.locator(`[data-work="${i}"] [data-face="${face}"]`)).toBeVisible();
      }
    }
    await expect(deck(page)).toHaveAttribute('data-phase', 'idle');
    expect(await page.evaluate(() => scrollY)).toBe(0);
  });
}

for (const width of [1452]) {
  test(`${width}×993 包含关于完整正文，封套保持简洁`, async ({ page }) => {
    await page.setViewportSize({ width, height: 993 });
    await page.goto('/');
    expect(await page.locator('.about').evaluate(el => el.getBoundingClientRect().bottom)).toBeLessThanOrEqual(993);
    await expect(page.locator('.about')).toContainText('12 年设计经验');
    await expect(page.locator('.sleeve__state')).toHaveCount(0);
    expect(await page.locator('.sleeve__cover').first().evaluate(el => getComputedStyle(el).borderLeftWidth)).toBe('0px');
  });
}

test('默认及减弱动效下，只有选中封套为空，其余唱片归位；桌面封套紧凑左对齐', async ({ page }) => {
  await page.setViewportSize({width: 1452, height: 993});
  await page.emulateMedia({reducedMotion: 'reduce'});
  await page.goto('/');
  for (let current = 0; current < 4; current++) {
    await select(page, current).click();
    for (let i = 0; i < 4; i++) {
      const style = await select(page, i).locator('.sleeve__record').evaluate(el => ({opacity: getComputedStyle(el).opacity, y: new DOMMatrix(getComputedStyle(el).transform).m42 / el.getBoundingClientRect().height}));
      expect(style.opacity).toBe(i === current ? '0' : '1');
      if(i !== current) expect(style.y).toBeCloseTo(-0.24, 2);
    }
  }
  const layout = await page.evaluate(() => {
    const covers = [...document.querySelectorAll('.sleeve__cover')].map(el => el.getBoundingClientRect());
    return {gap:covers[1].left-covers[0].right, width:document.querySelector('.collection').getBoundingClientRect().width, left:covers[0].left, heading:document.querySelector('h1').getBoundingClientRect().left};
  });
  expect(layout.gap).toBeLessThan(48);
  expect(layout.width).toBeLessThanOrEqual(720);
  expect(layout.left).toBe(layout.heading);
});

for (const [width, height] of [[1440,810],[1920,1080]]) {
  test(`${width}×${height} 桌面完整构图、主次比例与关于同屏`, async ({ page }) => {
    await page.setViewportSize({width,height});
    await page.goto('/');
    const bounds = await page.evaluate(() => ({
      bottom:document.querySelector('.about').getBoundingClientRect().bottom,
      ratio:document.querySelector('.deck').getBoundingClientRect().width / document.querySelector('.sleeve__cover').getBoundingClientRect().width,
      controls:document.querySelector('.panel__head').getBoundingClientRect().height,
      deckWidth:document.querySelector('.deck').getBoundingClientRect().width,
      bottomDelta:Math.abs(document.querySelector('.deck').getBoundingClientRect().bottom-document.querySelector('.sleeve__caption').getBoundingClientRect().bottom)
    }));
    expect(bounds.bottom).toBeLessThanOrEqual(height);
    expect(bounds.ratio).toBeGreaterThan(3);
    expect(bounds.deckWidth).toBe(640);
    expect(bounds.bottomDelta).toBeLessThan(1);
    const captionsFit = await page.locator('.sleeve__title').evaluateAll(items => items.every(el => el.clientHeight <= 18 && el.scrollWidth <= el.clientWidth));
    expect(captionsFit).toBe(true);
    await expect(page.locator(".sleeve__deliverable, #sleeve-help, .intro__eyebrow")).toHaveCount(0);
    expect(bounds.controls).toBeLessThanOrEqual(34);
    await expect(page.locator('footer')).toHaveCount(0);
  });
}

test('唱片持续循环旋转，超过一圈及换片后都保持播放', async ({ page }) => {
  await page.goto('/');
  const spinState = () => page.locator('.deck .record__label').evaluate(el => {
    const style = getComputedStyle(el, '::before');
    return {iterations:style.animationIterationCount, state:style.animationPlayState, transform:style.transform};
  });
  expect(await spinState()).toMatchObject({iterations:'infinite', state:'running'});
  await page.waitForTimeout(6300);
  const afterFirstTurn = await spinState();
  await page.waitForTimeout(160);
  expect((await spinState()).transform).not.toBe(afterFirstTurn.transform);
  await select(page, 2).click();
  await expect(deck(page)).toHaveAttribute('data-phase', 'idle');
  const afterSwitch = await spinState();
  expect(afterSwitch).toMatchObject({iterations:'infinite', state:'running'});
  await page.waitForTimeout(160);
  expect((await spinState()).transform).not.toBe(afterSwitch.transform);
});

test('页面与控制按钮均可左右选片，唱片共用无数字标签', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-side="b"]').click();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('[data-select]').nth(1)).toHaveAttribute('aria-pressed', 'true');
  await page.locator('[data-direction="right"]').click();
  await expect(page.locator('[data-select]').nth(2)).toHaveAttribute('aria-pressed', 'true');
  await page.locator('[data-direction="left"]').click();
  await expect(page.locator('[data-select]').nth(1)).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('[data-select]').first()).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#collection-title')).toHaveCount(0);
  await expect(page.locator('.sleeve__record .record__label')).toHaveCount(4);
  expect(await page.locator('.sleeve__record').allTextContents()).toEqual(['', '', '', '']);
});
