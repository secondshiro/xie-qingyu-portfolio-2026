import { test, expect } from '@playwright/test';

const audio = page => page.locator('[data-music-audio]');
const widget = page => page.locator('[data-case-music]');
const play = page => page.locator('[data-music-play]');
const playing = async page => expect.poll(() => audio(page).evaluate(el => !el.paused && el.currentTime > 0)).toBe(true);
const cases = ['real-estate-gis', 'edgecase-planner', 'brand-system', 'execution-query', 'yuejian', 'low-altitude-operations'];

test.use({ launchOptions: {
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  args: ['--autoplay-policy=no-user-gesture-required', '--use-mock-keychain', '--password-store=basic'],
} });

test('六个案例各有对应配乐，直接访问不出声，点击后实际解码播放', async ({ page }) => {
  for (const slug of cases) {
    await page.goto(`/work/${slug}/`);
    await expect(widget(page)).toBeVisible();
    expect(await audio(page).evaluate(el => el.paused)).toBe(true);
    await expect(audio(page)).toHaveAttribute('src', `/audio/${slug}.m4a`);
    await play(page).click();
    await playing(page);
    await expect(widget(page)).toHaveAttribute('data-state', 'playing');
    expect(await audio(page).evaluate(el => el.error)).toBeNull();
  }
});

test('首页到案例续播进度和音量，暂停后返回首页不会被悬停撤销', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.locator('.sleeve[href="/work/real-estate-gis/"]').hover();
  await playing(page);
  await page.locator('[data-music-volume]').fill('40');
  await audio(page).evaluate(el => { el.currentTime = 18; });
  await expect.poll(() => audio(page).evaluate(el => !el.seeking && el.currentTime >= 18)).toBe(true);
  await page.locator('.sleeve[href="/work/real-estate-gis/"]').click();
  await page.waitForURL('**/work/real-estate-gis/');
  await playing(page);
  const state = await audio(page).evaluate(el => ({ time: el.currentTime, volume: el.volume }));
  await expect.poll(() => audio(page).evaluate(el => el.currentTime)).toBeGreaterThanOrEqual(18);
  expect(state.time).toBeLessThan(24);
  expect(state.volume).toBe(.4);
  await play(page).click();
  await expect(widget(page)).toHaveAttribute('data-state', 'paused');
  await page.locator('.site-nav__links a').click();
  await page.waitForURL(url => url.pathname === '/');
  await page.locator('.sleeve[href="/work/real-estate-gis/"]').hover();
  expect(await audio(page).evaluate(el => el.paused)).toBe(true);
  await expect(page.locator('[data-music-mute]')).toHaveAttribute('aria-label', '开启声音');
  await page.locator('[data-music-mute]').click();
  await playing(page);
});

test('暂停和静音分别保留，调音量不撤销暂停，刷新后可从原进度恢复', async ({ page }) => {
  await page.goto('/work/brand-system/');
  await play(page).click();
  await playing(page);
  await audio(page).evaluate(el => { el.currentTime = 29; });
  await expect.poll(() => audio(page).evaluate(el => !el.seeking && el.currentTime >= 29)).toBe(true);
  await play(page).click();
  await page.locator('[data-music-volume]').fill('45');
  expect(await audio(page).evaluate(el => el.paused && el.volume === .45)).toBe(true);
  await page.reload();
  await expect(widget(page)).toBeVisible();
  expect(await audio(page).evaluate(el => el.paused)).toBe(true);
  await play(page).click();
  await playing(page);
  await expect.poll(() => audio(page).evaluate(el => el.currentTime)).toBeGreaterThanOrEqual(29);
  await page.locator('[data-music-mute]').click();
  expect(await audio(page).evaluate(el => el.muted && el.paused)).toBe(true);
  await page.locator('[data-music-volume]').fill('35');
  expect(await audio(page).evaluate(el => el.muted && el.paused)).toBe(true);
  await page.locator('[data-music-mute]').click();
  await playing(page);
});

test('静音从首页带到案例，调音量和普通阅读不改变静音', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.locator('.sleeve[href="/work/yuejian/"]').hover();
  await playing(page);
  await page.locator('[data-music-mute]').click();
  await page.locator('.sleeve[href="/work/yuejian/"]').click();
  await page.waitForURL('**/work/yuejian/');
  await expect(widget(page)).toBeVisible();
  expect(await audio(page).evaluate(el => el.muted && el.paused)).toBe(true);
  await page.locator('[data-music-volume]').fill('30');
  await page.locator('main h1').click();
  expect(await audio(page).evaluate(el => el.muted && el.paused)).toBe(true);
  await play(page).click();
  await playing(page);
});

test('加载失败可重试，浏览器阻止播放后由明确点击恢复', async ({ page }) => {
  await page.route('**/audio/execution-query.m4a', route => route.abort());
  await page.goto('/work/execution-query/');
  await play(page).click();
  await expect(widget(page)).toHaveAttribute('data-state', 'error');
  await expect(play(page)).toHaveAttribute('aria-label', '重试播放');
  await page.unroute('**/audio/execution-query.m4a');
  await play(page).click();
  await playing(page);
  await play(page).click();
  await audio(page).evaluate(el => {
    const original = el.play.bind(el);
    el.play = () => { el.play = original; return Promise.reject(new DOMException('Blocked', 'NotAllowedError')); };
  });
  await play(page).click();
  await expect(widget(page)).toHaveAttribute('data-state', 'blocked');
  await page.locator('main h1').click();
  expect(await audio(page).evaluate(el => el.paused)).toBe(true);
  await play(page).click();
  await playing(page);
});

for (const width of [320, 390, 1440]) {
  test(`${width}px 音量与静音直接可用，无需展开且不溢出`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/work/real-estate-gis/');
    await expect(page.locator('[data-music-volume]')).toBeVisible();
    expect((await page.locator('[data-music-volume]').boundingBox()).width).toBeGreaterThanOrEqual(80);
    const bounds = await widget(page).boundingBox();
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
    await page.locator('[data-music-volume]').focus();
    await page.keyboard.press('ArrowRight');
    expect(await audio(page).evaluate(el => el.volume)).toBeGreaterThan(.25);
    expect(await audio(page).evaluate(el => el.paused)).toBe(true);
    await expect(page.locator('[data-music-panel], [data-music-settings]')).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    await play(page).click();
    await playing(page);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    expect(await page.locator('.case-music__disc').evaluate(el => getComputedStyle(el).animationName)).toBe('none');
  });
}

test('单层控件按播放、静音、音量顺序访问，无二级面板', async ({ page }) => {
  await page.goto('/work/execution-query/');
  await play(page).focus();
  await page.keyboard.press('Tab');
  await expect(page.locator('[data-music-mute]')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('[data-music-volume]')).toBeFocused();
  await expect(page.locator('[data-music-volume]')).toBeVisible();
  await expect(page.locator('[data-music-panel], [data-music-settings]')).toHaveCount(0);
});

test('新标签页不自动出声，手动播放新页后旧页暂停，避免叠音', async ({ page, context }) => {
  await page.goto('/work/real-estate-gis/');
  await play(page).click();
  await playing(page);
  const other = await context.newPage();
  await other.goto('/work/yuejian/');
  await expect(widget(other)).toBeVisible();
  expect(await audio(other).evaluate(el => el.paused)).toBe(true);
  await play(other).click();
  await playing(other);
  await expect.poll(() => audio(page).evaluate(el => el.paused)).toBe(true);
  await other.close();
});

test('禁用会话存储仍可播放和暂停', async ({ page }) => {
  await page.addInitScript(() => {
    for (const key of ['getItem', 'setItem', 'removeItem']) {
      Storage.prototype[key] = () => { throw new DOMException('Disabled', 'SecurityError'); };
    }
  });
  await page.goto('/work/yuejian/');
  await play(page).click();
  await playing(page);
  await play(page).click();
  expect(await audio(page).evaluate(el => el.paused)).toBe(true);
});
