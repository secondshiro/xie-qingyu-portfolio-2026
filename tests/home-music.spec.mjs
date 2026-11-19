import { test, expect } from '@playwright/test';

const audio = page => page.locator('[data-music-audio]');
const mute = page => page.locator('[data-music-mute]');
const idle = async page => expect(page.locator('[data-deck]')).toHaveAttribute('data-phase', 'idle', { timeout: 12000 });
const playing = async page => expect.poll(() => audio(page).evaluate(el => !el.paused && el.currentTime > 0)).toBe(true);
const sleeve = (page, slug) => page.locator(`.sleeve[href="/work/${slug}/"]`);
const hover = (page, slug) => sleeve(page, slug).hover();

// Exercise actual audio in browsers where hover playback is permitted.
test.use({ launchOptions: {
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  args: ['--autoplay-policy=no-user-gesture-required'],
} });

test('不在加载时出声，移入有配乐的封套自动播放，仅保留音量和静音', async ({ page }) => {
  await page.goto('/');
  expect(await audio(page).evaluate(el => el.paused)).toBe(true);
  await expect(page.locator('[data-music]')).toHaveAttribute('data-state', 'paused');
  await expect(page.locator('[data-music] button')).toHaveCount(1);
  await expect(page.locator('[data-music] input')).toHaveCount(1);
  await expect(page.locator('[data-music-title], [data-music-play], [data-music-seek], [data-music-direction]')).toHaveCount(0);
  await hover(page, 'real-estate-gis');
  await playing(page);
  expect(await audio(page).evaluate(el => el.currentSrc)).toContain('/audio/real-estate-gis.m4a');
  await page.locator('[data-music-volume]').fill('20');
  expect(await audio(page).evaluate(el => el.volume)).toBe(.2);
  await mute(page).click();
  expect(await audio(page).evaluate(el => el.muted && el.paused)).toBe(true);
  await mute(page).click();
  await playing(page);
});

test('移入粤见后等换片和落针结束才播放，翻面也等动效结束', async ({ page }) => {
  await page.goto('/');
  await hover(page, 'real-estate-gis');
  await playing(page);
  await page.evaluate(() => {
    window.musicStarts = [];
    document.querySelector('audio').addEventListener('playing', () => window.musicStarts.push({
      phase: document.querySelector('[data-deck]').dataset.phase,
      loaded: document.querySelector('[data-deck]').dataset.loaded,
      src: document.querySelector('audio').currentSrc,
    }));
  });
  await hover(page, 'yuejian');
  await expect(page.locator('[data-deck]')).toHaveAttribute('data-phase', 'extracting');
  expect(await audio(page).evaluate(el => el.paused)).toBe(true);
  await idle(page);
  await playing(page);
  await page.locator('[data-side="b"]').click();
  expect(await audio(page).evaluate(el => el.paused)).toBe(true);
  await idle(page);
  await playing(page);
  const starts = await page.evaluate(() => window.musicStarts);
  expect(starts.length).toBeGreaterThanOrEqual(2);
  expect(starts.every(item => item.phase === 'idle' && item.loaded === '5' && item.src.endsWith('/yuejian.m4a'))).toBe(true);
});

test('快速改选后只播放最后一首，音量调整与减弱动效不会撤销静音', async ({ page }) => {
  await page.goto('/');
  await hover(page, 'real-estate-gis');
  await playing(page);
  await hover(page, 'yuejian');
  await hover(page, 'edgecase-planner');
  await idle(page);
  await playing(page);
  expect(await audio(page).evaluate(el => el.currentSrc)).toContain('/audio/edgecase-planner.m4a');
  await hover(page, 'yuejian');
  await mute(page).click();
  await idle(page);
  expect(await audio(page).evaluate(el => el.muted && el.paused)).toBe(true);
  await page.locator('[data-music-volume]').fill('35');
  expect(await audio(page).evaluate(el => el.muted && el.paused)).toBe(true);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await hover(page, 'real-estate-gis');
  await idle(page);
  expect(await audio(page).evaluate(el => el.muted && el.paused)).toBe(true);
  await mute(page).click();
  await playing(page);
});

test('浏览器拦截移入播放时，声音开关可开启；加载失败后重新移入可重试', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    const el = document.querySelector('audio');
    const original = el.play.bind(el);
    el.play = () => { el.play = original; return Promise.reject(new DOMException('Blocked', 'NotAllowedError')); };
  });
  await hover(page, 'real-estate-gis');
  await expect(mute(page)).toHaveAttribute('aria-label', '开启声音');
  expect(await audio(page).evaluate(el => el.paused)).toBe(true);
  await mute(page).click();
  await playing(page);
  await page.route('**/audio/yuejian.m4a', route => route.abort());
  await hover(page, 'yuejian');
  await idle(page);
  await expect(page.locator('[data-music]')).toHaveAttribute('data-state', 'error');
  await page.unroute('**/audio/yuejian.m4a');
  await page.mouse.move(1, 1);
  await hover(page, 'yuejian');
  await playing(page);
});

test('六首原曲按作品对应，压缩音频可解码且保留完整时长', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const tracks = [
    ['real-estate-gis', 100], ['edgecase-planner', 132], ['brand-system', 219],
    ['execution-query', 187], ['yuejian', 213.83],
    ['low-altitude-operations', 176],
  ];
  for (const [slug, duration] of tracks) {
    await hover(page, slug);
    await idle(page);
    await playing(page);
    const state = await audio(page).evaluate(el => ({ src: el.currentSrc, duration: el.duration, error: el.error }));
    expect(state.src).toContain(`/audio/${slug}.m4a`);
    expect(Math.abs(state.duration - duration)).toBeLessThan(.12);
    expect(state.error).toBeNull();
  }
});

test('低空智航换片落针后播放巡弋天穹，进入案例续播并保留音量', async ({ page }) => {
  await page.goto('/');
  await hover(page, 'yuejian');
  await playing(page);
  await page.evaluate(() => {
    window.musicStarts = [];
    document.querySelector('audio').addEventListener('playing', () => window.musicStarts.push({
      phase: document.querySelector('[data-deck]').dataset.phase,
      loaded: document.querySelector('[data-deck]').dataset.loaded,
      src: document.querySelector('audio').currentSrc,
    }));
  });
  await hover(page, 'low-altitude-operations');
  await idle(page);
  await playing(page);
  await expect(page.locator('[data-deck]')).toHaveAttribute('data-loaded', '0');
  await expect(mute(page)).toBeEnabled();
  const starts = await page.evaluate(() => window.musicStarts);
  expect(starts.length).toBeGreaterThan(0);
  expect(starts.every(item => item.phase === 'idle' && item.loaded === '0' && item.src.endsWith('/low-altitude-operations.m4a'))).toBe(true);
  await page.locator('[data-music-volume]').fill('40');
  await audio(page).evaluate(el => { el.currentTime = 12; });
  await expect.poll(() => audio(page).evaluate(el => !el.seeking && el.currentTime >= 12)).toBe(true);
  await sleeve(page, 'low-altitude-operations').click();
  await page.waitForURL('**/work/low-altitude-operations/');
  await expect(page.locator('[data-case-music]')).toBeVisible();
  await playing(page);
  expect(await audio(page).evaluate(el => el.currentSrc)).toContain('/audio/low-altitude-operations.m4a');
  await expect.poll(() => audio(page).evaluate(el => el.currentTime)).toBeGreaterThanOrEqual(12);
  expect(await audio(page).evaluate(el => el.volume)).toBe(.4);
});

test('机身滑块可直接拖动，静音不触发开盖，并与唱机保持同一透视', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  await hover(page, 'real-estate-gis');
  await idle(page);
  const slider = page.locator('[data-music-volume]');
  const box = await slider.boundingBox();
  const y = box.y + box.height / 2;
  await page.mouse.click(box.x + box.width * .85, y);
  expect(await audio(page).evaluate(el => el.volume)).toBeGreaterThan(.7);
  await page.mouse.move(box.x + box.width * .85, y);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * .2, y, { steps: 8 });
  await page.mouse.up();
  expect(await audio(page).evaluate(el => el.volume)).toBeLessThan(.3);
  await mute(page).click();
  await expect(page.locator('[data-deck]')).toHaveAttribute('data-lid', 'closed');
  const deck = await page.locator('[data-deck]').boundingBox();
  await page.mouse.move(deck.x + deck.width * .9, deck.y + deck.height * .4);
  await expect.poll(() => page.evaluate(() =>
    getComputedStyle(document.querySelector('.music-world')).transform === getComputedStyle(document.querySelector('.retro-world')).transform
  )).toBe(true);
});

for (const width of [320, 390, 1440]) {
  test(`${width}px 机身音量控制可见，无溢出且不遮挡介绍，方向键不触发换片`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/');
    await expect(page.locator('[data-music]')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    const bounds = await page.locator('[data-music]').evaluate(el => ({
      bottom: el.getBoundingClientRect().bottom,
      next: document.querySelector('.panel').getBoundingClientRect().top,
    }));
    expect(bounds.bottom).toBeLessThanOrEqual(bounds.next);
    const inset = await page.locator('[data-music]').evaluate(el => {
      const control = el.getBoundingClientRect();
      const face = document.querySelector('.retro-cabinet > .retro-face--front').getBoundingClientRect();
      return control.left >= face.left && control.right <= face.right && control.top >= face.top && control.bottom <= face.bottom;
    });
    expect(inset).toBe(true);
    await hover(page, 'real-estate-gis');
    await idle(page);
    await page.locator('[data-music-volume]').focus();
    await page.keyboard.press('ArrowRight');
    await expect(sleeve(page, 'real-estate-gis')).toHaveAttribute('aria-current', 'true');
  });
}
