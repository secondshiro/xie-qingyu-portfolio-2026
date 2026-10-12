import { expect, test } from '@playwright/test';

const path = '/work/edgecase-planner/#change-review';

test('真实补充评审留在原 AI 案例，无脚本可读，独立项目入口已撤回', async ({ browser, baseURL, request }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(`${baseURL}${path}`);
  const review = page.locator('#change-review');
  await expect(review).toContainText('重新检测会清空此前的手动处理');
  await expect(review).toContainText('AI 建议稿 · 交互示意');
  await expect(review).toContainText('我确认用户可以删框、改框、补画和打标签');
  await expect(review.locator('[data-demo-controls]')).toBeHidden();
  await expect(review.locator('[data-demo-fallback]')).toBeVisible();
  await expect(review.locator('[data-demo-fallback]')).toContainText('取消保留当前处理');
  await page.goto(`${baseURL}/`);
  await expect(page.locator('.additional-work')).toHaveCount(0);
  await expect(page.locator('a[href="/work/zhihang-change-detection/"]')).toHaveCount(0);
  expect((await request.get('/work/zhihang-change-detection/')).status()).toBe(404);
  await context.close();
});

test('取消与 Esc 保留处理，只有明确确认才清空，重置可重复检查', async ({ page }) => {
  await page.goto(path);
  const demo = page.locator('[data-redetection-demo]');
  const work = demo.locator('[data-manual-work]');
  const original = await work.locator('li').allTextContents();
  const dialog = demo.getByRole('dialog');
  const open = demo.getByRole('button', { name: '重新检测', exact: true });
  await open.click();
  await expect(dialog.getByRole('button', { name: '取消', exact: true })).toBeFocused();
  await expect(dialog).toContainText('重新检测将清空此前的手动处理');
  await dialog.getByRole('button', { name: '取消', exact: true }).click();
  await expect(work).toBeVisible();
  await expect(work.locator('li')).toHaveText(original);
  await expect(open).toBeFocused();
  await open.press('Enter');
  await page.keyboard.press('Escape');
  await expect(work).toBeVisible();
  await expect(work.locator('li')).toHaveText(original);
  await expect(open).toBeFocused();
  await open.press('Enter');
  await page.keyboard.press('Tab');
  await expect(dialog.getByRole('button', { name: '清空并重新检测', exact: true })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(work).toBeHidden();
  await expect(demo.locator('[data-empty-work]')).toBeVisible();
  await expect(demo.getByRole('status')).toHaveText('手动处理已清空。');
  await expect(open).toBeFocused();
  // Cancelling a later run must not restore already cleared work.
  await open.press('Enter');
  await page.keyboard.press('Escape');
  await expect(work).toBeHidden();
  await expect(demo.getByRole('status')).toContainText('仍为空状态');
  await demo.getByRole('button', { name: '重置演示', exact: true }).click();
  await expect(work).toBeVisible();
  await expect(work.locator('li')).toHaveText(original);
  await demo.screenshot({ path: 'artifacts/screenshots/edgecase-redetection-proposal.png' });
});

for (const width of [1440, 390]) {
  test(`${width}px 原稿可放大，键盘滚动和 Esc 返回可用`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(path);
    const open = page.locator('[data-evidence-open="evidence-change-result"]');
    await open.focus();
    await open.press('Enter');
    const dialog = page.getByRole('dialog', { name: '变化检测结果原稿', exact: true });
    await expect(dialog.getByRole('button', { name: '关闭', exact: true })).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Enter');
    await expect(dialog.getByRole('button', { name: '原尺寸', exact: true })).toHaveAttribute('aria-pressed', 'true');
    const region = dialog.getByRole('region');
    await region.focus();
    await page.keyboard.press('ArrowRight');
    await expect.poll(() => region.evaluate(el => el.scrollLeft)).toBeGreaterThan(0);
    expect(await dialog.locator('img').evaluate(el => el.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true })))).toBe(false);
    await page.keyboard.press('Escape');
    await expect(open).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    await page.locator('#change-review').screenshot({ path: `artifacts/screenshots/edgecase-change-review-${width}.png` });
  });
}

test('缺图依据与供应商检测状态分开呈现，原稿和提案来源明确', async ({ page }) => {
  await page.goto(path);
  const review = page.locator('#change-review');
  await review.getByText('区分检测失败与源照片缺失', { exact: true }).click();
  await expect(review.locator('details')).toContainText('原照片已被删除');
  await expect(review.locator('details')).toContainText('成功、失败和偏差来自供应商检测服务');
  await expect(review.locator('[data-redetection-demo]')).toContainText('以两项手动处理为例');
  await expect(review.locator('.review-verification')).toContainText('取消保留当前处理，确认后才清空');
  const content = await review.innerText();
  expect(content).not.toMatch(/[：:—–]/);
  for (const image of await review.locator('.media-stage img').all()) {
    await image.scrollIntoViewIfNeeded();
    await expect.poll(() => image.evaluate(el => (el as HTMLImageElement).complete && (el as HTMLImageElement).naturalWidth === 1920)).toBe(true);
  }
});
