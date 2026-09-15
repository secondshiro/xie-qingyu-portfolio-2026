import { test } from '@playwright/test';

const homeWidths = [1440, 1280, 1010, 390];

async function waitForImages(page: import('@playwright/test').Page) {
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < height; y += 700) {
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await page.waitForTimeout(80);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForFunction(
    () => [...document.images].every((image) => image.complete || !image.currentSrc),
    undefined,
    { timeout: 5000 },
  ).catch(() => undefined);
}

for (const width of homeWidths) {
  test(`捕获首页 ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    await page.goto('/');
    await waitForImages(page);
    await page.screenshot({ path: `artifacts/screenshots/home-${width}.png`, fullPage: true });
  });
}

for (const width of [1440, 390]) {
  test(`捕获案例 ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    await page.goto('/work/real-estate-gis/');
    await waitForImages(page);
    await page.screenshot({ path: `artifacts/screenshots/case-${width}.png`, fullPage: true });
  });
}

for (const width of [1440, 1010, 390]) {
  test(`捕获执行网助手案例 ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    await page.goto('/work/execution-query/');
    await waitForImages(page);
    await page.screenshot({
      path: `artifacts/screenshots/execution-query-${width}.png`,
      fullPage: true,
    });
    if (width !== 1010) {
      await page.addStyleTag({ content: '.skip-link { display: none !important; }' });
      await page.locator('#result').screenshot({
        path: `artifacts/screenshots/execution-query-result-${width}.png`,
      });
      await page.locator('#evidence').screenshot({
        path: `artifacts/screenshots/execution-query-evidence-${width}.png`,
      });
    }
  });
}
