import { expect, test } from '@playwright/test';

const route = '/projects/real-estate-gis/prototypes/task/index.html?building=宇济一号&code=17幢';

test('校验列出检测对象和通过结果，接着进入户室核对', async ({ page }) => {
  await page.goto(route);
  await page.getByRole('button', { name: '下一步 · 校验', exact: true }).click();
  await expect(page.locator('#checkSummary')).toHaveText('共检查 3 项，通过 3 项，未通过 0 项');
  await expect(page.locator('#checkList tr')).toHaveCount(3);
  await expect(page.locator('#checkList tr').first()).toContainText('宇济一号 · 17幢（实测）');
  await expect(page.locator('#checkList tr').first()).toContainText('宇济一号 · 17幢（预测）');
  await expect(page.locator('#checkList tr').last()).toContainText('27 层、323 户');
  await page.getByRole('button', { name: '下一步 · 设入库模式', exact: true }).click();
  await expect(page.locator('#step3')).toBeVisible();
  // Passing the building checks does not bypass the unresolved room relationships.
  await expect(page.locator('#submitBtn')).toBeDisabled();
  await expect(page.locator('#blockBar')).toContainText('结构变化');
});

for (const [scenario, title, reason] of [
  ['association', '关联幢检查', '未设置对应的预测幢'],
  ['duplicate', '重复替换检查', '已有替换入库记录'],
  ['rooms', '分层分户图数据', '缺少楼层信息'],
]) {
  test(`${title}未通过时列出原因并阻断下一步及深链`, async ({ page }) => {
    await page.goto(`${route}&step=3&check=${scenario}`);
    await expect(page.locator('#step2')).toBeVisible();
    await expect(page.locator('#step3')).toBeHidden();
    await expect(page.locator('#checkSummary')).toContainText('通过 2 项，未通过 1 项');
    const failed = page.locator('#checkList .check-item--fail');
    await expect(failed).toHaveCount(1);
    await expect(failed).toContainText(title);
    await expect(failed).toContainText(reason);
    if (scenario === 'rooms') await expect(failed).toContainText('1单元 2701室');
    await expect(page.locator('#toStep3')).toBeDisabled();
    await expect(page.locator('#submitBtn')).toBeDisabled();
    await page.getByRole('button', { name: '返回修改', exact: true }).click();
    await expect(page.locator('#step1')).toBeVisible();
    await expect(page.getByLabel('实测测绘幢', { exact: true })).toBeFocused();
  });
}

test('原型场景切换重新计算结果，恢复后可继续且保留结构项阻断', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(`${route}&step=2`);
  for (const scenario of ['rooms', 'normal']) {
    await expect(page.locator('.prototype-note')).toContainText('不会修改真实房屋记录');
    await page.getByLabel('切换校验场景').selectOption(scenario);
    await expect(page.locator('.prototype-note')).not.toHaveAttribute('open');
    await expect(page.getByLabel('切换校验场景')).toBeVisible();
    await expect(page).toHaveURL(new RegExp('check=' + scenario));
    await expect(page.locator('#toStep3')).toBeEnabled({ enabled: scenario === 'normal' });
  }
  await page.locator('#toStep3').click();
  await expect(page.locator('#step3')).toBeVisible();
  await expect(page.locator('#submitBtn')).toBeDisabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
});

for (const width of [1070, 1672]) {
  test(`多项失败在 ${width}px 保留摘要，明细可独立展开和滚动`, async ({ page }) => {
    await page.setViewportSize({ width, height: 988 });
    await page.goto(`${route}&step=3&check=multiple`);
    await expect(page.locator('#step2')).toBeVisible();
    await expect(page.locator('#checkSummary')).toHaveText('共检查 3 项，通过 1 项，未通过 2 项');
    const rows = page.locator('#checkList > tr');
    await expect(rows.nth(0)).toHaveClass(/check-item--fail/);
    await expect(rows.nth(1)).toHaveClass(/check-item--fail/);
    await expect(rows.nth(2)).toHaveClass(/check-item--pass/);
    const details = page.locator('#checkList details');
    await expect(details).toHaveCount(2);
    await expect(details.nth(0)).toHaveAttribute('open');
    await expect(details.nth(1)).not.toHaveAttribute('open');
    await expect(rows.nth(1)).toContainText('8 户数据不完整');
    await expect(rows.nth(1)).toContainText('请按明细补齐测绘数据后重新校验');
    const roomSummary = details.nth(1).locator('summary');
    await roomSummary.focus();
    await page.keyboard.press('Enter');
    await expect(details.nth(1)).toHaveAttribute('open');
    await expect(details.nth(0)).toHaveAttribute('open');
    const list = details.nth(1).locator('ul');
    await expect(list.locator('li')).toHaveCount(8);
    await expect(list).toContainText('缺少楼层信息');
    await expect(list).toContainText('缺少单元信息');
    await list.focus();
    await page.keyboard.press('End');
    await expect.poll(() => list.evaluate(el => el.scrollTop)).toBeGreaterThan(0);
    await expect(list.locator('li').last()).toBeInViewport();
    await roomSummary.focus();
    await page.keyboard.press('Space');
    await expect(details.nth(1)).not.toHaveAttribute('open');
    await expect(page.locator('#toStep3')).toBeDisabled();
    await expect(page.locator('#submitBtn')).toBeDisabled();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  });
}

 test('校验页直接切换多项失败，刷新保留样例并能恢复全部通过', async ({ page }) => {
  await page.goto(`${route}&step=2`);
  await page.getByLabel('切换校验场景').selectOption('multiple');
  await page.reload();
  await expect(page.getByLabel('切换校验场景')).toHaveValue('multiple');
  await expect(page.locator('#checkSummary')).toContainText('未通过 2 项');
  await expect(page.locator('#toStep3')).toBeDisabled();
  await page.getByLabel('切换校验场景').selectOption('normal');
  await page.locator('#toStep3').click();
  await expect(page.locator('#step3')).toBeVisible();
});
