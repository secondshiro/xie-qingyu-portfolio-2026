import { expect, test } from '@playwright/test';

const project = '/projects/real-estate-gis';
const prototypeRoot = `${project}/prototypes`;
const officialFrames = [
  { key: 'map', poster: 'map-current-overview.png' },
  { key: 'building', poster: 'building-current-overview.png' },
  { key: 'task', poster: '13-task-relations-focus.png' },
];

test('三个 mockup 与各自的新窗口入口使用同一个站内原型', async ({ page }) => {
  await page.goto('/work/real-estate-gis/');
  const prototypes = page.locator('.prototype-frame');
  await expect(prototypes).toHaveCount(officialFrames.length);
  for (const [index, { key, poster }] of officialFrames.entries()) {
    const prototype = prototypes.nth(index);
    const iframe = prototype.locator('iframe');
    const link = prototype.locator('.prototype-frame__link');
    const src = await iframe.getAttribute('src');
    expect(new URL(src!, page.url()).pathname).toBe(`${prototypeRoot}/${key}/index.html`);
    await expect(link).toHaveAttribute('href', src!);
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(prototype.locator('.prototype-frame__fallback img'))
      .toHaveAttribute('src', `${project}/media/final/${poster}`);

    const popupPromise = page.waitForEvent('popup');
    await link.click();
    const popup = await popupPromise;
    const expectedURL = new URL(src!, page.url());
    const directoryURL = new URL(expectedURL);
    directoryURL.pathname = `${prototypeRoot}/${key}/`;
    await expect(popup).toHaveURL(url => url.href === expectedURL.href || url.href === directoryURL.href);
    await expect(popup.locator('header').first()).toContainText('数字住房一体化平台');
    if (key === 'map') {
      await expect(page.getByRole('link', { name: '打开 17 幢的总图原型 ↗' }))
        .toHaveAttribute('href', src!);
      const embedded = iframe.contentFrame();
      for (const surface of [embedded, popup]) {
        await expect(surface.locator('#mapLayerBase image'))
          .toHaveAttribute('href', 'assets/gis-base-map-shipai.jpg');
        const footprint = await surface.locator('[data-code="17幢"] .building-footprint').getAttribute('d');
        await expect(surface.locator('#selectionOutline')).toHaveAttribute('d', footprint!);
        const map = surface.locator('#mapSvg');
        const viewBox = await map.getAttribute('viewBox');
        await expect(map.locator('[role="button"], [tabindex]')).toHaveCount(0);
        await surface.locator('#map').click();
        await surface.locator('#map').dblclick();
        await expect(surface.locator('#objectTitle')).toHaveText('宇济一号 · 17幢');
        await expect(surface.locator('#selectionFill')).toHaveClass(/\bactive\b/);
        await expect(map).toHaveAttribute('viewBox', viewBox!);
        await surface.locator('#closeObject').click();
        await expect(surface.locator('#rightPanel')).toBeHidden();
        const search = surface.locator('#search');
        await search.fill('17幢');
        await search.press('Enter');
        await expect(surface.locator('#objectTitle')).toHaveText('宇济一号 · 17幢');
        await expect(surface.locator('#selectionFill')).toHaveClass(/\bactive\b/);
        await expect(map).toHaveAttribute('viewBox', '284 165 820 540');
        await surface.locator('#full').click();
        await expect(map).toHaveAttribute('viewBox', viewBox!);
        await search.fill('18幢');
        await search.press('Enter');
        await expect(surface.locator('#objectTitle')).toHaveText('宇济一号 · 18幢');
        await surface.locator('#closeObject').click();
        await expect(surface.locator('#rightPanel')).toBeHidden();
        await map.click({ position: { x: 180, y: 180 } });
        await expect(surface.locator('#rightPanel')).toBeVisible();
        await expect(surface.locator('#objectTitle')).toHaveText('宇济一号 · 18幢');
        const restoredFootprint = await surface.locator('[data-code="18幢"] .building-footprint').getAttribute('d');
        await expect(surface.locator('#selectionOutline')).toHaveAttribute('d', restoredFootprint!);
        await expect(surface.locator('#viewFloor')).toBeVisible();
        await expect(surface.locator('#objectMeasured')).toBeVisible();
      }
    }
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
