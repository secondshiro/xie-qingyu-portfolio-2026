import { expect, test } from '@playwright/test';
const route = '/projects/real-estate-gis/prototypes/task/index.html?building=宇济一号&code=17幢&step=3&filter=review';

for (const [id, counts] of [['m25_2_2', '2 户现有记录、1 户测绘记录'], ['p20_1_1', '1 户现有记录、2 户测绘记录'], ['p22_1_3', '1 户现有记录、0 户测绘记录']]) {
  test(`${id} 转楼盘变更包含整组对象，可取消、确认并撤回`, async ({ page }) => {
    await page.goto(route);
    const card = page.locator(`[data-card-id="${id}"][data-card-side="${id.startsWith('m') ? 'meas' : 'pred'}"]`);
    await card.click();
    await expect(page.locator('#drawerCmp .cmp__row').first()).toContainText('17幢');
    await expect(page.locator('#drawerCmp .cmp__row').nth(2)).toContainText('单元');
    await expect(page.getByRole('button', { name: '转人工核对', exact: true })).toBeVisible();
    await page.getByRole('button', { name: '转入楼盘变更', exact: true }).click();
    await expect(page.locator('#routeScope')).toContainText(counts);
    await page.getByRole('button', { name: '取消转办', exact: true }).click();
    await expect(page.locator('#routeStatus')).toBeHidden();
    await page.getByRole('button', { name: '转入楼盘变更', exact: true }).click();
    await page.getByLabel('转办原因').fill(' ');
    await page.getByRole('button', { name: '确认转入楼盘变更', exact: true }).click();
    await expect(page.getByLabel('转办原因')).toBeFocused();
    await expect(page.locator('#routeError')).toHaveText('请填写转办原因。');
    await page.getByLabel('转办原因').fill('核对户室结构 <img src=x onerror=alert(1)>');
    await page.getByRole('button', { name: '确认转入楼盘变更', exact: true }).click();
    await expect(page.locator('#routeStatus')).toContainText('待楼盘变更');
    await expect(page.locator('#routeStatus img')).toHaveCount(0);
    await expect(page.getByRole('button', { name: '撤回转办', exact: true })).toBeFocused();
    await page.getByRole('button', { name: '关闭详情', exact: true }).click();
    await expect(card).toContainText('待楼盘变更');
    await expect(card).toBeFocused();
    await expect(page.locator('#submitBtn')).toBeDisabled();
    await expect(page.locator('#blockCount')).toHaveText('6');
    await card.click();
    await page.getByRole('button', { name: '撤回转办', exact: true }).click();
    await expect(page.locator('#routeStatus')).toBeHidden();
    await expect(page.getByRole('button', { name: '转入楼盘变更', exact: true })).toBeVisible();
    await expect(page.locator('#submitBtn')).toBeDisabled();
  });
}

test('面积待核对转人工后维持待处理，刷新不冒充真实转办记录', async ({ page }) => {
  await page.setViewportSize({width: 950, height: 757});
  await page.goto(route);
  const card = page.locator('[data-card-id="p15_1_1"][data-card-side="pred"]');
  await card.click();
  await page.getByRole('button', { name: '转人工核对', exact: true }).click();
  await expect(page.getByLabel('转办原因')).toBeFocused();
  await page.getByRole('button', { name: '确认转人工', exact: true }).click();
  await expect(page.locator('#routeStatus')).toContainText('待人工核对');
  await expect(page.getByRole('button', { name: '确认关联', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: '关闭详情', exact: true }).click();
  await expect(card).toContainText('待人工核对');
  await expect(page.locator('#submitBtn')).toBeDisabled();
  await page.reload();
  await expect(card).not.toContainText('待人工核对');
  await card.click();
  await expect(page.getByRole('button', {name: '确认关联', exact:true})).toBeVisible();
});
