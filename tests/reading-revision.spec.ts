import { expect, test } from '@playwright/test';

test('手机先显示作品和介绍，之后显示唱机', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const positions = await page.locator('.collection, .panel, .player').evaluateAll(elements =>
    Object.fromEntries(elements.map(el => [el.classList.contains('collection') ? 'collection' : el.classList.contains('panel') ? 'panel' : 'player', el.getBoundingClientRect().top])),
  );
  expect(positions.collection).toBeLessThan(positions.panel);
  expect(positions.panel).toBeLessThan(positions.player);
  expect(positions.collection).toBeLessThan(700);
  await page.locator('[data-select="0"]').click();
  await expect(page).toHaveURL(/real-estate-gis/);
});

test('折叠的旧锚点可以直接访问', async ({ page }) => {
  for (const [route, hash] of [['edgecase-planner', 'method'], ['edgecase-planner', 'flight'], ['brand-system', 'ai-collaboration']]) {
    await page.goto(`/work/${route}/#${hash}`);
    const target = page.locator(`#${hash}`);
    await expect(target).toBeVisible();
    expect(await target.evaluate(el => {
      let current: Element | null = el;
      while (current) {
        if (current instanceof HTMLDetailsElement && !current.open) return false;
        current = current.parentElement;
      }
      return true;
    })).toBe(true);
  }
});

test('品牌局部保留原图比例，完整规范可用键盘查看和关闭', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/work/brand-system/#result');
  const details = page.locator('#result .evidence-detail');
  await expect(details).toHaveCount(2);
  for (const detail of await details.all()) {
    const image = detail.locator('img');
    await image.scrollIntoViewIfNeeded();
    expect(await detail.locator('.evidence-detail__window').evaluate(el => [el.scrollTop, el.scrollLeft])).toEqual([0, 0]);
    await expect.poll(() => image.evaluate((el: HTMLImageElement) => el.naturalWidth)).toBe(1920);
    const ratios = await detail.evaluate(el => {
      const frame = el.querySelector('.evidence-detail__frame')!.getBoundingClientRect();
      const img = el.querySelector('img')!.getBoundingClientRect();
      return [frame.width / frame.height, img.width / img.height];
    });
    expect(ratios[0]).toBeCloseTo(16 / 9, 1);
    expect(ratios[1]).toBeCloseTo(16 / 9, 1);
    await expect(detail).toHaveAttribute('data-protected-media');
  }
  const summary = page.getByText('查看完整海报规范', { exact: true });
  await summary.focus();
  await page.keyboard.press('Enter');
  const opener = page.getByRole('button', { name: '放大查看 · 海报模板与使用规则' });
  await opener.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(opener).toBeFocused();
});


test('手机户室局部保持原尺寸，可用键盘横向查看', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/work/real-estate-gis/');
  const frame = page.locator('.evidence-detail--scroll .evidence-detail__frame');
  await frame.focus();
  expect(await frame.evaluate(el => el.scrollWidth)).toBeGreaterThanOrEqual(1000);
  expect(await frame.evaluate(el => el.clientWidth)).toBeLessThan(390);
  await page.keyboard.press('ArrowRight');
  await expect.poll(() => frame.evaluate(el => el.scrollLeft)).toBeGreaterThan(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
});
