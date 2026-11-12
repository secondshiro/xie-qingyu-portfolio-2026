import { test, expect } from '@playwright/test';

const projects = ['房产 GIS 体验重构', '把设计经验整理成可复用的 AI 工作流', '新禾智飞品牌系统提案', '执行网查询助手', '粤见 · 广府非遗体验小程序'];
const select = (page, index) => page.locator(`[data-select="${index}"]`);
const deck = page => page.locator('[data-deck]');
const settled = async page => {
  await page.waitForLoadState('load');
  await expect(page.locator('html')).not.toHaveAttribute('data-page-transition-phase', /.+/);
};

test('五张印刷封面加载成功，中文目录标签在封面之外且保留作品选择', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 810 });
  await page.goto('/');
  await expect(page.locator('.sleeve__arrow')).toHaveCount(5);
  await expect(page.locator('.work__open, .sleeve__open')).toHaveCount(0);
  expect(await page.locator('.sleeve__cover').evaluateAll(items => new Set(items.map(el => Math.round(el.getBoundingClientRect().top))).size)).toBe(1);
  await expect(page.locator('.collection__hint-hover')).toHaveText('悬停换片 · 点击看案例');
  for (let i = 0; i < projects.length; i++) {
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
    await sleeve.hover();
    await expect(sleeve).toHaveAttribute('aria-current', 'true');
    await expect(page.locator(`[data-work="${i}"]`)).toBeVisible();
    await expect(page).toHaveURL('/');
  }
});

for (const width of [320, 375, 390, 768, 1010, 1024, 1280, 1440]) {
  test(`${width}px 个人定位、五个封套与全部详情可读，无横向溢出`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('h1')).toHaveText('产品体验设计师');
    for (let i = 0; i < projects.length; i++) {
      await expect(select(page, i).locator('.sleeve__title')).toBeVisible();
      await select(page, i).hover();
      for (const face of ['a', 'b']) {
        await page.locator(`[data-side="${face}"]`).click();
        await expect(page.locator(`[data-work="${i}"] [data-face="${face}"]`)).toBeVisible();
        expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
      }
    }
    const fits = await page.locator('.sleeve__cover').evaluateAll(elements => elements.every(el => {
      const box = el.getBoundingClientRect();
      return [...el.querySelectorAll('img')].every(child => {
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
  await select(page, 1).hover();
  await expect(select(page, 1)).toHaveAttribute('aria-current', 'true');
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
    await select(page, 1).hover();
    await page.waitForFunction(phase => document.querySelector('[data-deck]').dataset.phase === phase, phase, { polling: 'raf' });
    await select(page, 3).hover();
    await expect(select(page, 3)).toHaveAttribute('aria-current', 'true');
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
  await select(page, 1).hover();
  await expect(deck(page)).toHaveAttribute('data-phase', 'extracting');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(deck(page)).toHaveAttribute('data-phase', 'idle');
  await expect(deck(page)).toHaveAttribute('data-loaded', '1');
  expect(await page.locator('.retro-record-face .record__label').evaluate(el => getComputedStyle(el, '::before').animationName)).toBe('none');
  await select(page, 2).hover();
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
  await expect(select(page, 1)).toHaveAttribute('aria-current', 'true');
  expect(await select(page, 1).evaluate(el => getComputedStyle(el).boxShadow)).toBe('none');
  expect(await select(page, 1).locator('.sleeve__title').evaluate(el => getComputedStyle(el).textDecorationLine)).toBe('underline');
  await page.locator('.intro__actions a[href^="mailto:"]').focus();
  await page.keyboard.press('ArrowRight');
  await expect(select(page, 2)).toHaveAttribute('aria-current', 'true');
  const before = await page.evaluate(() => scrollY);
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('[data-side="b"]')).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(() => scrollY)).toBe(before);
  await page.keyboard.press('ArrowUp');
  await expect(page.locator('[data-side="a"]')).toHaveAttribute('aria-pressed', 'true');
});

test('无 JavaScript 有五个案例入口，简历下载与案例链接可用', async ({ browser, request, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(`${baseURL}/`);
  await expect(page.locator('noscript a')).toHaveCount(5);
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
    await select(page, 3).hover();
    await page.waitForFunction(() => document.querySelector('[data-deck]').dataset.phase === 'lifting', null, { polling: 'raf' });
    const vinyl = select(page, 3).locator('.sleeve__record');
    const pulled = await vinyl.evaluate(el => new DOMMatrix(getComputedStyle(el).transform).m42);
    expect(pulled).toBeLessThan(-20);
    await expect(deck(page)).toHaveAttribute('data-phase', 'idle');
    expect(await vinyl.evaluate(el => new DOMMatrix(getComputedStyle(el).transform).m42)).toBeCloseTo(pulled, 0);
    expect(await vinyl.evaluate(el => getComputedStyle(el).opacity)).toBe('0');
    await select(page, 2).hover();
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
  test(`${width}×${height} 切换全部作品及两面可完整阅读，高窗口同屏`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    const visibleInScreen = async selector => {
      const boxes = await page.locator(selector).evaluateAll(elements => elements.map(el => {
        const { top, bottom, left, right } = el.getBoundingClientRect();
        return { top: top + scrollY, bottom: bottom + scrollY, left, right };
      }));
      expect(boxes.length).toBeGreaterThan(0);
      for (const box of boxes) {
        expect(box.top).toBeGreaterThanOrEqual(0);
        expect(box.bottom).toBeLessThanOrEqual(await page.evaluate(() => document.documentElement.scrollHeight));
        expect(box.left).toBeGreaterThanOrEqual(0);
        expect(box.right).toBeLessThanOrEqual(width);
      }
    };
    await visibleInScreen('h1, .intro__lead, .intro__actions, .deck, .sleeve__cover, .sides');
    for (let i = 0; i < projects.length; i++) {
      await select(page, i).hover();
      for (const face of ['a', 'b']) {
        await page.locator(`[data-side="${face}"]`).click();
        if (height >= 1080) expect(await page.evaluate(() => scrollY)).toBe(0);
        await visibleInScreen(`[data-work="${i}"] .work__heading, [data-work="${i}"] [data-face="${face}"]`);
        await expect(page.locator(`[data-work="${i}"] [data-face="${face}"]`)).toBeVisible();
      }
    }
    await expect(deck(page)).toHaveAttribute('data-phase', 'idle');
    if (height >= 1080) expect(await page.evaluate(() => scrollY)).toBe(0);
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
  for (let current = 0; current < projects.length; current++) {
    await select(page, current).hover();
    for (let i = 0; i < projects.length; i++) {
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
  test(`${width}×${height} 桌面主次比例保持，高窗口关于同屏`, async ({ page }) => {
    await page.setViewportSize({width,height});
    await page.goto('/');
    const bounds = await page.evaluate(() => ({
      bottom:document.querySelector('.about').getBoundingClientRect().bottom,
      ratio:document.querySelector('.deck').getBoundingClientRect().width / document.querySelector('.sleeve__cover').getBoundingClientRect().width,
      controls:document.querySelector('.panel__head').getBoundingClientRect().height,
      deckWidth:document.querySelector('.deck').getBoundingClientRect().width,
      bottomDelta:Math.abs(document.querySelector('.deck').getBoundingClientRect().bottom-document.querySelector('.crate li:last-child .sleeve__caption').getBoundingClientRect().bottom)
    }));
    if (height >= 1080) expect(bounds.bottom).toBeLessThanOrEqual(height);
    expect(bounds.ratio).toBeGreaterThan(3);
    expect(bounds.deckWidth).toBe(640);
    expect(bounds.bottomDelta).toBeLessThan(1);
    const captionsFit = await page.locator('.sleeve__title').evaluateAll(items => items.every(el => el.clientHeight <= 54 && el.scrollWidth <= el.clientWidth));
    expect(captionsFit).toBe(true);
    await expect(page.locator(".sleeve__deliverable, #sleeve-help, .intro__eyebrow")).toHaveCount(0);
    expect(bounds.controls).toBeLessThanOrEqual(34);
    await expect(page.locator('footer')).toHaveCount(0);
  });
}

test('高窗口将新增空白分配到作品上下，保持唱机与介绍的距离', async ({ page }) => {
  for (const width of [1200, 1430, 1920]) {
    let previous;
    let minimumHeight;
    for (const height of [600, 810, 900, 1080, 1440]) {
      await page.setViewportSize({ width, height });
      await page.goto('/');
      const bounds = await page.evaluate(() => {
        const rect = selector => document.querySelector(selector).getBoundingClientRect();
        const deck = rect('.deck');
        const panel = rect('.panel');
        const about = rect('.about');
        return {
          deckTop: deck.top,
          deckWidth: deck.width,
          deckHeight: deck.height,
          panelGap: panel.top - deck.bottom,
          aboutGap: about.top - panel.bottom,
          aboutTop: about.top,
          aboutBottom: about.bottom,
          introTop: rect('.intro').top,
          actionsBottom: rect('.intro__actions').bottom,
          showcaseHeight: rect('.showcase').height,
        };
      });
      minimumHeight ??= bounds.showcaseHeight + 160;
      expect(bounds.panelGap).toBeCloseTo(48, 0);
      expect(bounds.deckTop - bounds.actionsBottom).toBeGreaterThanOrEqual(23.9);
      if (height >= 1080 && width >= 1430) expect(bounds.aboutBottom).toBeLessThanOrEqual(height);
      if (previous) {
        const extra = Math.max(0, height - minimumHeight) - Math.max(0, previous.height - minimumHeight);
        expect(bounds.deckTop - previous.deckTop).toBeCloseTo(extra * 0.4, 0);
        expect(bounds.aboutGap - previous.aboutGap).toBeCloseTo(extra * 0.6, 0);
        expect(bounds.introTop).toBe(previous.introTop);
        expect(bounds.deckWidth).toBe(previous.deckWidth);
        expect(bounds.deckHeight).toBe(previous.deckHeight);
      }
      previous = { ...bounds, height };
    }
  }
});

test('唱片持续循环旋转，超过一圈及换片后都保持播放', async ({ page }) => {
  await page.goto('/');
  const spinState = () => page.locator('.retro-record-face .record__label').evaluate(el => {
    const style = getComputedStyle(el, '::before');
    return {iterations:style.animationIterationCount, state:style.animationPlayState, transform:style.transform};
  });
  expect(await spinState()).toMatchObject({iterations:'infinite', state:'running'});
  await page.waitForTimeout(6300);
  const afterFirstTurn = await spinState();
  await page.waitForTimeout(160);
  expect((await spinState()).transform).not.toBe(afterFirstTurn.transform);
  await select(page, 2).hover();
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
  await expect(page.locator('[data-select]').nth(1)).toHaveAttribute('aria-current', 'true');
  await page.locator('[data-direction="right"]').click();
  await expect(page.locator('[data-select]').nth(2)).toHaveAttribute('aria-current', 'true');
  await page.locator('[data-direction="left"]').click();
  await expect(page.locator('[data-select]').nth(1)).toHaveAttribute('aria-current', 'true');
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('[data-select]').first()).toHaveAttribute('aria-current', 'true');
  await expect(page.locator('#collection-title')).toHaveCount(0);
  await expect(page.locator('.sleeve__record .record__label')).toHaveCount(5);
  expect(await page.locator('.sleeve__record').allTextContents()).toEqual(['', '', '', '', '']);
});

test('点击唱机开合盖板，作品和 A/B 面保持，Enter 与空格同样可操作', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await select(page, 2).hover();
  await page.locator('[data-side="b"]').click();
  await expect(deck(page)).toHaveAttribute('aria-expanded', 'false');
  await deck(page).click();
  await expect(deck(page)).toHaveAttribute('data-lid', 'open');
  await expect(deck(page)).toHaveAttribute('aria-expanded', 'true');
  await expect(deck(page)).toHaveAccessibleName(/合上唱机盖/);
  await expect(select(page, 2)).toHaveAttribute('aria-current', 'true');
  await expect(page.locator('[data-side="b"]')).toHaveAttribute('aria-pressed', 'true');
  await deck(page).press('Enter');
  await expect(deck(page)).toHaveAttribute('data-lid', 'closed');
  await deck(page).press('Space');
  await expect(deck(page)).toHaveAttribute('data-lid', 'open');
  await expect(deck(page)).toBeFocused();
  await page.locator('.retro-lid__glass').click();
  await expect(deck(page)).toHaveAttribute('data-lid', 'closed');
});

test('换片先开盖，并在落针后执行用户最后一次开合要求', async ({ page }) => {
  await page.goto('/');
  await select(page, 1).hover();
  await expect(deck(page)).toHaveAttribute('data-phase', 'extracting');
  await expect(deck(page)).toHaveAttribute('data-lid', 'open');
  // 盖板正在为换片打开，点击要求合上，第二次点击要求保留打开。
  await deck(page).click();
  await deck(page).click();
  await expect(deck(page)).toHaveAttribute('data-lid-requested', 'open');
  await expect(deck(page)).toHaveAttribute('data-phase', 'idle');
  await expect(deck(page)).toHaveAttribute('data-lid', 'open');
  await select(page, 3).hover();
  await expect(deck(page)).toHaveAttribute('data-phase', 'extracting');
  await deck(page).click();
  await expect(deck(page)).toHaveAttribute('data-lid', 'open');
  await expect(deck(page)).toHaveAttribute('data-lid-requested', 'closed');
  await expect(deck(page)).toHaveAttribute('data-phase', 'idle');
  await expect(deck(page)).toHaveAttribute('data-lid', 'closed');
  await expect(deck(page)).toHaveAttribute('data-loaded', '3');
  await expect(deck(page)).toHaveAttribute('aria-busy', 'false');
});

for (const width of [320, 390, 1440]) {
  test(`${width}px 开盖不遮住页头或造成横向溢出`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await deck(page).click();
    const layout = await page.evaluate(() => {
      const lid = document.querySelector('.retro-lid__glass').getBoundingClientRect();
      return { left: lid.left, right: lid.right, top: lid.top + scrollY, header: document.querySelector('.bar').getBoundingClientRect().bottom + scrollY, overflow: document.documentElement.scrollWidth - innerWidth };
    });
    expect(layout.left).toBeGreaterThanOrEqual(0);
    expect(layout.right).toBeLessThanOrEqual(width);
    expect(layout.top).toBeGreaterThan(layout.header);
    expect(layout.overflow).toBeLessThanOrEqual(1);
  });
}

test('悬停预览保持最新作品，离开封套不跳转或重置', async ({ page }) => {
  await page.goto('/');
  await page.setViewportSize({ width: 1440, height: 900 });
  await select(page, 2).hover();
  await page.locator('.bar__name').hover();
  await expect(page).toHaveURL('/');
  await expect(select(page, 2)).toHaveAttribute('aria-current', 'true');
  await expect(page.locator('#work-2')).toBeVisible();
  await expect(deck(page)).toHaveAttribute('data-phase', 'idle');
  await expect(deck(page)).toHaveAttribute('data-loaded', '2');
  await select(page, 2).hover();
  await page.screenshot({ path: 'artifacts/screenshots/home-sleeve-hover.png', fullPage: true });
});

test('触屏封套一次点击进入对应案例，返回保留该作品', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const paths = ['real-estate-gis', 'edgecase-planner', 'brand-system', 'execution-query', 'yuejian'];
  await page.goto(`${baseURL}/`);
  await expect(page.locator('.collection__hint-touch')).toBeVisible();
  await expect(page.locator('.collection__hint-hover')).toBeHidden();
  await page.screenshot({ path: 'artifacts/screenshots/home-sleeve-touch.png', fullPage: true });
  for (let i = 0; i < paths.length; i++) {
    await select(page, i).tap();
    await expect(page).toHaveURL(`${baseURL}/work/${paths[i]}/`);
    await settled(page);
    await page.locator('.site-nav__links a').tap();
    await expect(page).toHaveURL(`${baseURL}/`);
    await settled(page);
    await expect(select(page, i)).toHaveAttribute('aria-current', 'true');
    await expect(page.locator(`#work-${i}`)).toBeVisible();
  }
  await context.close();
});

test('封套保留原生链接操作，中键可在新标签打开案例', async ({ page }) => {
  await page.goto('/');
  const popup = page.context().waitForEvent('page');
  await select(page, 1).click({ button: 'middle' });
  const opened = await popup;
  await expect(opened).toHaveURL(/\/work\/edgecase-planner\/$/);
  await expect(page).toHaveURL('/');
  await expect(page.locator('html')).not.toHaveAttribute('data-page-transition-phase', /.+/);
  await opened.close();
});

test('移除唱机点击提示，保留按钮名称及开盖交互', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('点击唱机，开合盖板')).toHaveCount(0);
  await expect(deck(page)).toHaveAccessibleName(/打开唱机盖/);
  await deck(page).click();
  await expect(deck(page)).toHaveAttribute('aria-expanded', 'true');
});

test('鼠标点击唱机后按方向键不出现黑框，Tab 进入仍有焦点提示', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await deck(page).click();
  for (const key of ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp']) {
    await page.keyboard.press(key);
    await expect(deck(page)).toBeFocused();
    expect(await deck(page).evaluate(el => ({ shadow: getComputedStyle(el).boxShadow, outline: getComputedStyle(el).outlineStyle }))).toEqual({ shadow: 'none', outline: 'none' });
  }
  await expect(select(page, 0)).toHaveAttribute('aria-current', 'true');
  await expect(page.locator('[data-side="a"]')).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Enter');
  await expect(deck(page)).toHaveAttribute('data-lid', 'closed');
  await page.keyboard.press('Tab');
  await expect(deck(page)).not.toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(deck(page)).toBeFocused();
  expect(await deck(page).evaluate(el => getComputedStyle(el).boxShadow)).not.toBe('none');
  await page.keyboard.press('Space');
  await expect(deck(page)).toHaveAttribute('data-lid', 'open');
});

test('A/B 翻面先抬臂抬片，绕左右轴纵向旋转半圈后归位，两面均可继续播放', async ({ page }) => {
  await page.goto('/');
  for (const side of ['b', 'a']) {
    await page.locator(`[data-side="${side}"]`).click();
    await expect(page.locator(`[data-work="0"] [data-face="${side}"]`)).toBeVisible();
    await expect(deck(page)).toHaveAttribute('data-lid', 'open');
    await page.waitForFunction(() => document.querySelector('[data-record-flip]').getAnimations().some(a => a.playState === 'running'));
    const pose = await page.locator('[data-record-flip]').evaluate(el => {
      const animation = el.getAnimations().find(a => a.playState === 'running');
      animation.pause();
      animation.currentTime = animation.effect.getTiming().duration * .5;
      const turn = new DOMMatrix(getComputedStyle(el).transform);
      const lift = new DOMMatrix(getComputedStyle(el.parentElement).transform);
      return { tilt: Math.abs(turn.m23), horizontalTilt: Math.abs(turn.m13), lift: lift.m43, playing: document.querySelector('[data-deck]').classList.contains('is-playing') };
    });
    expect(pose.tilt).toBeGreaterThan(.5);
    expect(pose.horizontalTilt).toBeLessThan(.001);
    expect(pose.lift).toBeGreaterThan(40);
    expect(pose.playing).toBe(false);
    await page.locator('[data-record-flip]').evaluate(el => el.getAnimations().filter(a => a.playState === 'paused').forEach(a => a.play()));
    await expect(deck(page)).toHaveAttribute('data-phase', 'idle');
    await expect(deck(page)).toHaveAttribute('data-face', side);
    await expect(deck(page)).toHaveAttribute('data-lid', 'closed');
    await expect(deck(page)).toHaveClass(/is-playing/);
    expect(await page.locator('[data-record]').evaluate(el => getComputedStyle(el).transform)).toBe('none');
    expect(await page.locator('[data-record-flip]').evaluate(el => new DOMMatrix(getComputedStyle(el).transform).m22)).toBeCloseTo(side === 'b' ? -1 : 1);
  }
});

test('翻面途中连续切面再改选作品，最终实体和文案一致且无残留动画', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await page.locator('[data-side="b"]').click();
  await page.waitForFunction(() => document.querySelector('[data-record-flip]').getAnimations().some(a => a.playState === 'running'));
  await page.locator('[data-side="a"]').click();
  await page.locator('[data-side="b"]').click();
  await select(page, 3).hover();
  await expect(deck(page)).toHaveAttribute('data-phase', 'idle');
  await expect(deck(page)).toHaveAttribute('data-loaded', '3');
  await expect(deck(page)).toHaveAttribute('data-face', 'b');
  await expect(page.locator('[data-work="3"] [data-face="b"]')).toBeVisible();
  expect(await page.locator('[data-record]').evaluate(el => ({ opacity: getComputedStyle(el).opacity, transform: getComputedStyle(el).transform, active: el.getAnimations({ subtree: true }).filter(a => a.effect?.target instanceof Element && !a.effect.pseudoElement).length }))).toEqual({ opacity: '1', transform: 'none', active: 0 });
  expect(errors).toEqual([]);
});

test('换片已经进入时再切 B 面，先落片再翻面并保持最终选择', async ({ page }) => {
  await page.goto('/');
  await select(page, 2).hover();
  await expect(deck(page)).toHaveAttribute('data-phase', 'incoming');
  await page.locator('[data-side="b"]').click();
  await expect(deck(page)).toHaveAttribute('data-phase', 'flipping');
  await expect(deck(page)).toHaveAttribute('data-phase', 'idle');
  await expect(deck(page)).toHaveAttribute('data-loaded', '2');
  await expect(deck(page)).toHaveAttribute('data-face', 'b');
});

test('减弱动效在翻面途中启用，立即落片并保留 B 面', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-side="b"]').click();
  await expect(deck(page)).toHaveAttribute('data-phase', 'flipping');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(deck(page)).toHaveAttribute('data-phase', 'idle');
  await expect(deck(page)).toHaveAttribute('data-face', 'b');
  expect(await page.locator('[data-record]').evaluate(el => getComputedStyle(el).transform)).toBe('none');
  await page.locator('[data-side="a"]').click();
  await expect(deck(page)).toHaveAttribute('data-face', 'a');
  await expect(deck(page)).toHaveAttribute('data-phase', 'idle');
});

test('连续两次翻面时，点击盖板均按本次要求在落针后合上', async ({ page }) => {
  await page.goto('/');
  for (const side of ['b', 'a']) {
    await page.locator(`[data-side="${side}"]`).click();
    await expect(deck(page)).toHaveAttribute('data-phase', 'flipping');
    await deck(page).click();
    await expect(deck(page)).toHaveAttribute('data-lid-requested', 'closed');
    await expect(deck(page)).toHaveAttribute('data-phase', 'idle');
    await expect(deck(page)).toHaveAttribute('data-lid', 'closed');
    await expect(deck(page)).toHaveAttribute('data-face', side);
  }
});

test('案例返回恢复 B 面文案及实体朝向', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await select(page, 3).hover();
  await page.locator('[data-side="b"]').click();
  await select(page, 3).click();
  await expect(page).toHaveURL(/\/work\/execution-query\/$/);
  await page.locator('.site-nav__links a').click();
  await expect(page).toHaveURL('/');
  await expect(deck(page)).toHaveAttribute('data-loaded', '3');
  await expect(deck(page)).toHaveAttribute('data-face', 'b');
  await expect(page.locator('[data-side="b"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-work="3"] [data-face="b"]')).toBeVisible();
});

test('唱片侧壁在进出和淡出时保持立体，速度留出抬片与落片过程', async ({ page }) => {
  await page.goto('/');
  await select(page, 3).hover();
  for (const phase of ['outgoing', 'incoming']) {
    await page.waitForFunction(phase => document.querySelector('[data-deck]').dataset.phase === phase, phase, { polling: 'raf' });
    const shape = await page.locator('[data-record]').evaluate((el, phase) => {
      const animation = el.getAnimations().find(a => a.playState === 'running');
      animation.pause();
      animation.currentTime = animation.effect.getTiming().duration * (phase === 'incoming' ? .15 : .7);
      const style = getComputedStyle(el);
      const wall = el.querySelector('.retro-vinyl-wall');
      return { duration: animation.effect.getTiming().duration, opacity: style.opacity, depth: style.transformStyle, visibility: Number(style.getPropertyValue('--retro-record-visibility')), wallOpacity: Number(getComputedStyle(wall).opacity), wallHeight: wall.offsetHeight, wallNormal: new DOMMatrix(getComputedStyle(wall).transform).m23 };
    }, phase);
    expect(shape.duration).toBeGreaterThanOrEqual(600);
    expect(shape.opacity).toBe('1');
    expect(shape.depth).toBe('preserve-3d');
    expect(shape.visibility).toBeGreaterThan(0);
    expect(shape.visibility).toBeLessThan(1);
    expect(shape.wallOpacity).toBeCloseTo(shape.visibility, 3);
    expect(shape.wallHeight).toBeGreaterThan(0);
    expect(Math.abs(shape.wallNormal)).toBeCloseTo(1);
    await page.locator('[data-record]').evaluate(el => el.getAnimations().filter(a => a.playState === 'paused').forEach(a => a.play()));
  }
  await expect(deck(page)).toHaveAttribute('data-phase', 'idle');
  await expect(deck(page)).toHaveAttribute('data-loaded', '3');
});
