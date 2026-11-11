import { expect, test } from '@playwright/test';

const route = '/projects/real-estate-gis/prototypes/task/index.html?building=宇济一号&code=17幢&step=3&filter=linked';

for (const height of [757, 998]) {
  for (const view of ['cards', 'table']) {
    test(`${height}px ${view} 列表滚动时楼层面板与关系导航保持原位`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height });
      await page.goto(`${route}&view=${view}`);
      await page.locator('#step3').evaluate(el => Promise.all(el.getAnimations({ subtree: true }).map(a => a.finished.catch(() => {}))));
      const floor = page.locator('#floorSlider');
      const tools = page.locator('.board-tools');
      const content = page.locator(view === 'cards' ? '#cards .rg' : '#cards tbody tr').first();
      const floorBefore = (await floor.boundingBox())!;
      const toolsBefore = (await tools.boundingBox())!;
      const contentBefore = (await content.boundingBox())!;
      await page.mouse.move(contentBefore.x + contentBefore.width / 2, contentBefore.y + 20);
      await page.mouse.wheel(0, 600);
      await expect.poll(async () => (await content.boundingBox())!.y).toBeLessThan(contentBefore.y - 100);
      expect((await floor.boundingBox())!.y).toBeCloseTo(floorBefore.y, 0);
      expect((await tools.boundingBox())!.y).toBeCloseTo(toolsBefore.y, 0);
      await expect(page.locator('#floorInputMin')).toBeInViewport();
      await expect(page.locator('#floorOnlyAnomaly')).toBeInViewport();
      await tools.getByRole('button', { name: /待核对/ }).click();
      await expect(page.locator('[data-filter="review"]')).toHaveAttribute('aria-pressed', 'true');
      await expect(page.locator('#cards')).toContainText('待核对');
    });
  }
}

test('案例内嵌与实际新窗口的列表均独立滚动，切回校验仍可滚动查看', async ({ page }) => {
  await page.setViewportSize({ width: 1488, height: 998 });
  await page.goto('/work/real-estate-gis/');
  const prototype = page.locator('.prototype-frame').filter({ has: page.locator('iframe[title="实测替换预测交互原型"]') });
  const pending = page.waitForEvent('popup');
  await prototype.locator('.prototype-frame__link').click();
  const popup = await pending;
  await popup.setViewportSize({ width: 1440, height: 810 });
  await prototype.locator('iframe').evaluate(el => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
  const embedded = page.frameLocator('iframe[title="实测替换预测交互原型"]');
  for (const surface of [embedded, popup]) {
    await surface.locator('[data-filter="linked"]').click();
    await surface.locator('#step3').evaluate(el => Promise.all(el.getAnimations({ subtree: true }).map(a => a.finished.catch(() => {}))));
    const floorY = await surface.locator('#floorSlider').evaluate(el => el.getBoundingClientRect().y);
    const toolsY = await surface.locator('.board-tools').evaluate(el => el.getBoundingClientRect().y);
    await surface.locator('.result-list').evaluate(el => { el.scrollTop = 600; });
    await expect.poll(() => surface.locator('.result-list').evaluate(el => el.scrollTop)).toBe(600);
    expect(await surface.locator('#floorSlider').evaluate(el => el.getBoundingClientRect().y)).toBeCloseTo(floorY, 0);
    expect(await surface.locator('.board-tools').evaluate(el => el.getBoundingClientRect().y)).toBeCloseTo(toolsY, 0);
    await surface.getByRole('button', { name: '返回校验', exact: true }).click();
    await expect(surface.locator('#step2')).toBeVisible();
    await expect(surface.locator('.scroll-body')).toHaveCSS('overflow-y', 'auto');
  }
  await popup.close();
});
