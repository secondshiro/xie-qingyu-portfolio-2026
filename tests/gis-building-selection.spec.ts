import { expect, test } from '@playwright/test';

const route = '/projects/real-estate-gis/prototypes/building/index.html?building=宇济一号&code=17幢&room=1501&legend=1';

test('组合图例与单户选择各自保留状态，不匹配户室退出点击和键盘路径', async ({ page }) => {
  await page.goto(route);
  const initial = page.locator('.room[data-unit="1"][data-room="1501"]');
  await page.locator('#legend input[value="filing"]').check();
  await page.locator('#legend input[value="premortgage"]').check();
  await expect(page.locator('#visible')).toHaveText('32');
  await expect(initial).toHaveAttribute('aria-pressed', 'true');
  await expect(initial).toBeEnabled();
  await expect(page.locator('#selectionHint')).toHaveText('在当前筛选内');

  const target = page.locator('.room[data-unit="1"][data-room="1602"]');
  await target.click();
  await expect(target).toHaveAttribute('aria-pressed', 'true');
  await expect(target).toHaveCSS('outline-width', '2px');
  await expect(target.locator('.state-band i')).toHaveCount(2);
  await expect(page.locator('#legend input:checked')).toHaveCount(2);
  await expect(page.locator('#visible')).toHaveText('32');
  await expect(initial).toHaveCSS('opacity', '1');
  await expect(page.locator('.room[aria-pressed="true"]')).toHaveCount(1);

  const excluded = page.locator('.room[data-unit="1"][data-room="2701"]');
  await expect(excluded).toBeDisabled();
  await expect(excluded).toHaveAttribute('tabindex', '-1');
  await target.click();
  await expect(page.locator('#selected')).toHaveText('0');
  await expect(page.locator('#legend input:checked')).toHaveCount(2);
  await expect(initial).toHaveCSS('opacity', '1');
});

test('筛选改变后保留当前房屋并说明范围，清除筛选与搜索定位可恢复操作', async ({ page }) => {
  await page.goto(route);
  const initial = page.locator('.room[data-unit="1"][data-room="1501"]');
  await page.locator('#legend input[value="filing"]').check();
  await expect(initial).toHaveAttribute('aria-pressed', 'true');
  await expect(initial).toBeDisabled();
  await expect(page.locator('#selectionHint')).toHaveText('不在当前筛选结果中');
  await expect(page.locator('#roomName')).toHaveText('1单元 · 1501室');
  await page.getByRole('button', { name: '业务属性', exact: true }).click();
  await expect(page.locator('#businessProps')).toBeVisible();
  await page.getByRole('button', { name: '基本属性', exact: true }).click();
  await expect(page.locator('#selectionHint')).toHaveText('不在当前筛选结果中');

  await page.getByRole('button', { name: '清除筛选', exact: true }).click();
  await expect(page.locator('#legend input:checked')).toHaveCount(0);
  await expect(page.locator('.room:disabled')).toHaveCount(0);
  await expect(page.locator('#visible')).toHaveText('322');
  await expect(initial).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#selectionHint')).toHaveText('在当前筛选内');

  await page.getByRole('textbox', { name: '搜索房号或权利人' }).fill('1501');
  await expect(page.locator('#visible')).toHaveText('3');
  await page.getByRole('button', { name: '查看匹配户室', exact: true }).click();
  await expect(initial).toBeFocused();
  await page.locator('.room[data-unit="2"][data-room="1501"]').click();
  await expect(page.locator('#roomArea')).toHaveText('97.20 m²');
  await page.getByRole('textbox', { name: '搜索房号或权利人' }).fill('不存在的房号');
  await expect(page.locator('#empty')).toBeVisible();
  await expect(page.getByRole('button', { name: '查看匹配户室', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: '清除筛选', exact: true }).click();
  await page.locator('#quick').click();
  await page.getByRole('button', { name: '多状态户室', exact: true }).click();
  await page.getByRole('button', { name: '清除筛选', exact: true }).click();
  await expect(page.locator('#quick svg')).toHaveCount(1);
  await expect(page.locator('#quick')).toHaveText('全部户室');
  await expect(page.locator('#visible')).toHaveText('322');
});

test('案例内嵌和实际新窗口都能组合筛选、选户并关闭重开图例', async ({ page }) => {
  await page.setViewportSize({ width: 1488, height: 998 });
  await page.goto('/work/real-estate-gis/');
  const prototype = page.locator('.prototype-frame').filter({
    has: page.locator('iframe[title="分层分户图交互原型"]'),
  });
  const popupPromise = page.waitForEvent('popup');
  await prototype.locator('.prototype-frame__link').click();
  const popup = await popupPromise;
  await popup.setViewportSize({ width: 1440, height: 900 });
  await prototype.locator('iframe').evaluate(el => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
  const embedded = page.frameLocator('iframe[title="分层分户图交互原型"]');
  for (const surface of [embedded, popup]) {
    await surface.locator('label.wk-switch:has(#legendToggle)').click();
    await surface.locator('#legend input[value="filing"]').check();
    await surface.locator('#legend input[value="premortgage"]').check();
    const target = surface.locator('.room[data-unit="1"][data-room="1602"]');
    await target.click();
    await expect(target).toHaveAttribute('aria-pressed', 'true');
    await expect(surface.locator('#visible')).toHaveText('32');
    await expect(surface.locator('.room[data-unit="1"][data-room="1501"]')).toHaveCSS('opacity', '1');
    await surface.getByRole('button', { name: '关闭图例' }).click();
    await expect(surface.locator('#legend')).toBeHidden();
    await expect(target).toHaveAttribute('aria-pressed', 'true');
    await surface.locator('label.wk-switch:has(#legendToggle)').click();
    await expect(surface.locator('#legend input:checked')).toHaveCount(2);
    await expect(target).toHaveCSS('outline-width', '2px');
  }
  await popup.close();
});
