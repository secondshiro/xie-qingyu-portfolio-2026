import { expect, test } from '@playwright/test';

test('三个 mockup 与各自的新窗口入口使用同一个站内原型', async ({ page }) => {
  await page.goto('/work/real-estate-gis/');
  const prototypes = page.locator('.prototype-frame');
  await expect(prototypes).toHaveCount(3);
  for (const prototype of await prototypes.all()) {
    const iframe = prototype.locator('iframe');
    const link = prototype.locator('.prototype-frame__link');
    const src = await iframe.getAttribute('src');
    expect(src).toMatch(/^\/projects\/real-estate-gis\/prototypes\/(map|building|task)\/index\.html\?/);
    await expect(link).toHaveAttribute('href', src!);
    await expect(link).toHaveAttribute('target', '_blank');
    const popupPromise = page.waitForEvent('popup');
    await link.click();
    const popup = await popupPromise;
    await expect(popup).toHaveURL(new URL(src!, page.url()).href);
    await expect(popup.locator('header').first()).toContainText('数字住房一体化平台');
    await popup.close();
  }
});

for (const width of [1352, 1488]) {
  test(`${width}px 的内嵌与独立核对原型都保留转办按钮和完整流程`, async ({ page }) => {
    await page.setViewportSize({ width, height: 998 });
    await page.goto('/work/real-estate-gis/');
    const prototype = page.locator('.prototype-frame').filter({
      has: page.locator('iframe[title="实测替换预测交互原型"]'),
    });
    const iframe = prototype.locator('iframe');
    await iframe.scrollIntoViewIfNeeded();
    const embedded = page.frameLocator('iframe[title="实测替换预测交互原型"]');
    const popupPromise = page.waitForEvent('popup');
    await prototype.locator('.prototype-frame__link').click();
    const popup = await popupPromise;
    await popup.setViewportSize({ width, height: 998 });
    const cardSelector = '[data-card-id="m25_2_2"][data-card-side="meas"]';

    await expect(popup.locator(cardSelector)).toHaveText(await embedded.locator(cardSelector).innerText(), { useInnerText: true });
    for (const surface of [embedded, popup]) {
      await surface.locator(cardSelector).click();
      const manual = surface.getByRole('button', { name: '转人工核对', exact: true });
      const change = surface.getByRole('button', { name: '转入楼盘变更', exact: true });
      await expect(manual).toBeVisible();
      await expect(manual).toBeInViewport();
      await expect(change).toBeVisible();
      await expect(change).toBeInViewport();
      await change.click();
      await expect(surface.locator('#routeScope')).toContainText('2 户现有记录、1 户测绘记录');
      await surface.getByRole('button', { name: '确认转入楼盘变更', exact: true }).click();
      await expect(surface.locator('#routeStatus')).toContainText('待楼盘变更');
      await expect(surface.locator('#submitBtn')).toBeDisabled();
      await surface.getByRole('button', { name: '撤回转办', exact: true }).click();
      await expect(surface.locator('#routeStatus')).toBeHidden();
      await expect(change).toBeVisible();
    }
    await expect(popup.locator('#drawerCmp')).toHaveText(await embedded.locator('#drawerCmp').innerText(), { useInnerText: true });
    await expect(popup.locator('#drawerActions')).toHaveText(await embedded.locator('#drawerActions').innerText(), { useInnerText: true });
    await popup.close();
  });
}
