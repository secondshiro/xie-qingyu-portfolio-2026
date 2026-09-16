import { expect, test } from '@playwright/test';

for (const width of [1440, 1280, 1024, 1010, 390, 375]) {
  test(`投递页文案与行业参照在 ${width}px 可读可操作`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await expect(page.locator('h1')).toHaveText('产品体验设计师');
    await expect(page.locator('#ai-review')).toContainText('AI 工作流');
    await expect(page.locator('#execution-query')).toContainText('人工验证');
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    await page.screenshot({ path: `/private/tmp/submission-home-${width}.png`, fullPage: true });
    await page.goto('/work/real-estate-gis/');
    const details = page.locator('#strategy details');
    const summary = details.locator('summary');
    await expect(details).not.toHaveAttribute('open');
    await expect(page.locator('#strategy h2')).toBeVisible();
    await expect(details.locator('.reference-grid')).toBeHidden();
    await summary.focus();
    expect(await summary.evaluate(el => getComputedStyle(el).boxShadow)).not.toBe('none');
    await page.keyboard.press('Enter');
    await expect(details).toHaveAttribute('open');
    await expect(details.getByRole('link')).toHaveCount(3);
    await expect(details.locator('.reference-grid')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    await page.locator('#strategy').screenshot({ path: `/private/tmp/submission-strategy-open-${width}.png` });
    await page.keyboard.press('Space');
    await expect(details).not.toHaveAttribute('open');
    await page.locator('#strategy').screenshot({ path: `/private/tmp/submission-strategy-closed-${width}.png` });
    await summary.click();
    await expect(details).toHaveAttribute('open');
    await page.reload();
    await expect(details).not.toHaveAttribute('open');
    await expect(page.locator('#tradeoffs .decision-grid')).toBeVisible();
  });
}

test('行业参照深链与重复目录点击会展开内容', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/work/real-estate-gis/#strategy');
  const details = page.locator('#strategy details');
  await expect(details).toHaveAttribute('open');
  await details.locator('summary').click();
  await expect(details).not.toHaveAttribute('open');
  await page.locator('.case-toc a[href="#strategy"]').click();
  await expect(details).toHaveAttribute('open');
  await page.locator('.case-toc a[href="#tradeoffs"]').click();
  await details.locator('summary').click();
  await page.locator('.case-toc a[href="#strategy"]').click();
  await expect(details).toHaveAttribute('open');
});

test('行业参照在禁用 JavaScript 时仍可展开', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(`${baseURL}/work/real-estate-gis/`);
  const details = page.locator('#strategy details');
  await details.locator('summary').click();
  await expect(details).toHaveAttribute('open');
  await expect(details.locator('.reference-grid')).toBeVisible();
  await context.close();
});

test('五页公开成稿与品牌图片复核', async ({ page }) => {
  for (const [name, path] of [
    ['home', '/'], ['real-estate-gis', '/work/real-estate-gis/'],
    ['edgecase-planner', '/work/edgecase-planner/'], ['execution-query', '/work/execution-query/'],
    ['brand-system', '/work/brand-system/'],
  ]) {
    await page.goto(path);
    if (name === 'real-estate-gis') await page.locator('#strategy summary').click();
    const text = await page.locator('body').innerText();
    expect(text.replace(/https?:\/\//g, '')).not.toMatch(/[：:—–]/);
    expect(text).not.toMatch(/不是.{0,30}而是|并非.{0,30}而是|不在于.{0,30}而在于|与其说.{0,30}不如说|看似.{0,30}实则/);
  }
  for (const width of [1024, 375]) {
    await page.setViewportSize({ width, height: 900 });
    const images = page.locator('main img');
    for (const img of await images.all()) {
      await img.scrollIntoViewIfNeeded();
      await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  }
});
