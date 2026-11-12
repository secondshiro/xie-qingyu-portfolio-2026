import { test, expect } from '@playwright/test';

const yaw = page => page.locator('.retro-world').evaluate(el => {
  const matrix = new DOMMatrix(getComputedStyle(el).transform);
  return Math.atan2(-matrix.m21, matrix.m11) * 180 / Math.PI;
});
const move = async (page, x, y = .5) => {
  const bounds = await page.locator('[data-deck]').boundingBox();
  await page.mouse.move(bounds.x + bounds.width * x, bounds.y + bounds.height * y);
};
const centered = page => expect.poll(async () => Math.abs(await yaw(page) + 12)).toBeLessThan(.02);

test('鼠标左右移动时唱机同向缓动，幅度不超过三度，上下移动不倾斜，离开后回正', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await move(page, .05);
  await expect.poll(() => yaw(page)).toBeGreaterThan(-9.5);
  expect(await yaw(page)).toBeLessThanOrEqual(-8.99);
  const frontX = () => page.locator('.retro-cabinet > .retro-face--front').evaluate(el => {
    const bounds = el.getBoundingClientRect();
    return bounds.left + bounds.width / 2;
  });
  const leftX = await frontX();
  await move(page, .95);
  // The view passes through intermediate angles instead of snapping to the target.
  await expect.poll(async () => page.locator('.retro-world').evaluate(el => el.getAnimations().some(a => a.playState === 'running'))).toBe(true);
  await expect.poll(() => yaw(page)).toBeLessThan(-14.5);
  expect(await yaw(page)).toBeGreaterThanOrEqual(-15.01);
  expect(await frontX()).toBeGreaterThan(leftX);
  await move(page, .95, .25);
  await expect.poll(async () => Math.abs(await yaw(page) + 14.7)).toBeLessThan(.02);
  expect(await page.locator('.retro-world').evaluate(el => Math.acos(new DOMMatrix(getComputedStyle(el).transform).m33) * 180 / Math.PI)).toBeCloseTo(62);
  await page.locator('.bar__name').hover();
  await centered(page);
  await expect.poll(() => page.locator('.retro-world').evaluate(el => el.getAnimations().length)).toBe(0);
});

test('鼠标停在唱机上时换片或翻面会回正并暂停跟随，结束后可再次跟随', async ({ page }) => {
  await page.goto('/');
  await move(page, .95);
  await expect.poll(() => yaw(page)).toBeLessThan(-14.5);
  for (const key of ['ArrowRight', 'ArrowDown']) {
    await page.keyboard.press(key);
    await expect(page.locator('[data-deck]')).not.toHaveAttribute('data-phase', 'idle');
    await move(page, .05);
    await centered(page);
    await move(page, .95);
    await centered(page);
    await expect(page.locator('[data-deck]')).toHaveAttribute('data-phase', 'idle');
    await move(page, .9);
    await expect.poll(() => yaw(page)).toBeLessThan(-14);
  }
  await expect(page.locator('[data-deck]')).toHaveAttribute('data-loaded', '1');
  await expect(page.locator('[data-deck]')).toHaveAttribute('data-face', 'b');
});

test('启用减弱动效立即回正，后续鼠标移动不改变角度', async ({ page }) => {
  await page.goto('/');
  await move(page, .95);
  await expect.poll(() => yaw(page)).toBeLessThan(-14.5);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await centered(page);
  await move(page, .05);
  await centered(page);
  expect(await page.locator('.retro-world').evaluate(el => getComputedStyle(el).transitionDuration)).toBe('0s');
});

test('触屏只开合唱机盖，不跟随手指转动', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto(baseURL);
  const bounds = await page.locator('[data-deck]').boundingBox();
  await page.touchscreen.tap(bounds.x + bounds.width * .8, bounds.y + bounds.height * .5);
  await expect(page.locator('[data-deck]')).toHaveAttribute('data-lid', 'open');
  await centered(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  await context.close();
});

for (const width of [1280, 1440]) {
  test(`${width}px 开盖左右转动仍在页面内且可点击关闭`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await page.locator('[data-deck]').click();
    for (const x of [.05, .95]) {
      await move(page, x);
      await expect.poll(async () => Math.abs(await yaw(page) - (-12 - (x * 2 - 1) * 3))).toBeLessThan(.02);
      const bounds = await page.locator('.retro-lid__glass').evaluate(el => {
        const r = el.getBoundingClientRect();
        return { left: r.left, right: r.right, top: r.top + scrollY, header: document.querySelector('.bar').getBoundingClientRect().bottom + scrollY, overflow: document.documentElement.scrollWidth - innerWidth };
      });
      expect(bounds.left).toBeGreaterThanOrEqual(0);
      expect(bounds.right).toBeLessThanOrEqual(width);
      expect(bounds.top).toBeGreaterThan(bounds.header);
      expect(bounds.overflow).toBeLessThanOrEqual(1);
    }
    await page.locator('.retro-lid__glass').click();
    await expect(page.locator('[data-deck]')).toHaveAttribute('data-lid', 'closed');
  });
}
