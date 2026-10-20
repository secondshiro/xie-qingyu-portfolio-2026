import { expect, test } from '@playwright/test';
import type { FrameLocator, Page } from '@playwright/test';

const route = '/projects/real-estate-gis/prototypes/task/index.html?building=宇济一号&code=17幢';

// 校验场景用原型统一的 .ui-select 组件：点触发器展开，再点选项
async function pickScenario(surface: Page | FrameLocator, label: string) {
  await surface.getByRole('button', { name: '切换校验场景' }).click();
  await surface.getByRole('option', { name: label, exact: true }).click();
}

test('作品集内嵌原型可返回校验、切换多项警示，再回到户室转办', async ({ page }) => {
  await page.goto('/work/real-estate-gis/');
  const iframe = page.locator('iframe[title="实测替换预测交互原型"]');
  await iframe.scrollIntoViewIfNeeded();
  const task = page.frameLocator('iframe[title="实测替换预测交互原型"]');
  await task.getByRole('button', { name: '返回校验', exact: true }).click();
  await pickScenario(task, '多项警示 · 多户明细');
  await expect(task.locator('#checkSummary')).toContainText('警示 2 项');
  await task.locator('#checkList details').nth(1).locator('summary').click();
  await expect(task.locator('#checkList details').nth(1).locator('li')).toHaveCount(8);
  await expect(task.locator('#toStep3')).toBeEnabled();
  await task.locator('#toStep3').click();
  await expect(task.locator('#validationNotice')).toContainText('2 项校验警示待处理');
  await expect(task.locator('#validationNotice')).toBeInViewport();
  await expect(task.locator('#submitBtn')).toBeDisabled();
  await task.locator('[data-card-id="m25_2_2"][data-card-side="meas"]').click();
  await expect(task.getByRole('button', { name: '转人工核对', exact: true })).toBeVisible();
  await expect(task.getByRole('button', { name: '转入楼盘变更', exact: true })).toBeVisible();
});

test('校验列出检测对象和通过结果，接着进入户室核对', async ({ page }) => {
  await page.goto(route);
  await page.getByRole('button', { name: '下一步 · 校验', exact: true }).click();
  await expect(page.locator('#checkSummary')).toHaveText('共检查 3 项，通过 3 项，警示 0 项');
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
  test(`${title}警示时仍可核对和转人工，保留警示及提交限制`, async ({ page }) => {
    await page.goto(`${route}&step=3&check=${scenario}`);
    await expect(page.locator('#step3')).toBeVisible();
    await expect(page.locator('#validationNotice')).toContainText(title);
    await page.getByRole('button', { name: '返回校验', exact: true }).click();
    await expect(page.locator('#checkSummary')).toContainText('通过 2 项，警示 1 项');
    const failed = page.locator('#checkList .check-item--warning');
    await expect(failed).toHaveCount(1);
    await expect(failed).toContainText(title);
    await expect(failed).toContainText(reason);
    if (scenario === 'rooms') await expect(failed).toContainText('1单元 2701室');
    await expect(page.locator('#toStep3')).toBeEnabled();
    await expect(page.locator('#submitBtn')).toBeDisabled();
    await page.getByRole('button', { name: '返回修改', exact: true }).click();
    await expect(page.locator('#step1')).toBeVisible();
    await expect(page.getByLabel('实测测绘幢', { exact: true })).toBeFocused();
  });
}

test('原型场景切换重新计算结果，恢复后可继续且保留结构项阻断', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(`${route}&step=2`);
  for (const [scenario, label] of [['rooms', '户室分层数据缺失'], ['normal', '全部通过']] as const) {
    await expect(page.locator('.prototype-note')).toContainText('不会修改真实房屋记录');
    await pickScenario(page, label);
    await expect(page.locator('.prototype-note')).not.toHaveAttribute('open');
    await expect(page.getByRole('button', { name: '切换校验场景' })).toHaveText(label);
    await expect(page).toHaveURL(new RegExp('check=' + scenario));
    await expect(page.locator('#toStep3')).toBeEnabled();
  }
  await page.locator('#toStep3').click();
  await expect(page.locator('#step3')).toBeVisible();
  await expect(page.locator('#submitBtn')).toBeDisabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
});

for (const width of [1070, 1672]) {
  test(`多项警示在 ${width}px 保留摘要，明细可独立展开和滚动`, async ({ page }) => {
    await page.setViewportSize({ width, height: 988 });
    await page.goto(`${route}&step=2&check=multiple`);
    await expect(page.locator('#step2')).toBeVisible();
    await expect(page.locator('#checkSummary')).toHaveText('共检查 3 项，通过 1 项，警示 2 项');
    const rows = page.locator('#checkList > tr');
    await expect(rows.nth(0)).toHaveClass(/check-item--warning/);
    await expect(rows.nth(1)).toHaveClass(/check-item--warning/);
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
    await expect(page.locator('#toStep3')).toBeEnabled();
    await expect(page.locator('#submitBtn')).toBeDisabled();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  });
}

 test('校验页直接切换多项警示，刷新保留样例并能恢复全部通过', async ({ page }) => {
  await page.goto(`${route}&step=2`);
  await pickScenario(page, '多项警示 · 多户明细');
  await page.reload();
  await expect(page.getByRole('button', { name: '切换校验场景' })).toHaveText('多项警示 · 多户明细');
  await expect(page.locator('#checkSummary')).toContainText('警示 2 项');
  await expect(page.locator('#toStep3')).toBeEnabled();
  await pickScenario(page, '全部通过');
  await page.locator('#toStep3').click();
  await expect(page.locator('#step3')).toBeVisible();
  await expect(page.locator('#validationNotice')).toBeHidden();
});
