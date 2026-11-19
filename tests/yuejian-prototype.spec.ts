import { expect, test, type Frame, type Page } from '@playwright/test';

const prototypePath = '/projects/yuejian/prototype/p0.html';

for (const exit of ['collect', 'skip'] as const) {
  test(`P0 ${exit} stays in the miniprogram when missing legacy paths return the portfolio homepage`, async ({ page }) => {
    let legacyRequests = 0;
    // Some static previews return index.html with status 200 for unknown paths.
    await page.route('**/yuejian-plan/v5.html?*', async route => {
      legacyRequests++;
      await route.fulfill({ status: 200, contentType: 'text/html',
        body: '<!doctype html><title>Portfolio fallback</title><h1>作品集首页</h1>' });
    });
    await page.goto('/work/yuejian/#play');
    const iframe = page.locator('[data-yuejian-frame]');
    await iframe.scrollIntoViewIfNeeded();
    const frame = (await (await iframe.elementHandle())!.contentFrame())!;
    await frame.locator('#s0').click();
    await frame.waitForFunction("phase === 'board'");
    if (exit === 'collect') {
      // Sewing itself is covered by the full-flow tests below.
      await frame.evaluate('toSeal()');
      await frame.waitForFunction("getComputedStyle(document.querySelector('#veilcue')).opacity === '1'");
      await frame.locator('#veilcue').click();
    } else {
      await frame.locator('#skip').click();
    }
    const landing = exit === 'collect' ? 'p10' : 'p1';
    await expect.poll(() => frame.url()).toBe(new URL(`/projects/yuejian/prototype/v5.html?shell=off#${landing}`, page.url()).href);
    await expect(frame.locator(`#${landing}`)).toBeVisible();
    expect(legacyRequests).toBe(0);
  });
}

for (const surface of ['embedded', 'popup'] as const) {
  for (const frameClockOffset of [0, -5000]) {
    test(`P0 ${surface}, frame clock ${frameClockOffset}ms: stitches stay on screen and finish on time`, async ({ page, context }) => {
      test.setTimeout(75_000);
      // Reproduce a frame timestamp behind this document's performance clock.
      // Timers keep running normally; only the rAF timestamp has an offset.
      await context.addInitScript(offset => {
        const raf = window.requestAnimationFrame.bind(window);
        window.requestAnimationFrame = callback => raf(t => callback(t + offset));
      }, frameClockOffset);
      await page.setViewportSize({ width: 1488, height: 1100 });
      await page.goto('/work/yuejian/#play');
      const iframe = page.locator('[data-yuejian-frame]');
      await iframe.scrollIntoViewIfNeeded();
      let target: Page | Frame;
      let pointerPage = page;
      if (surface === 'popup') {
        const opened = page.waitForEvent('popup');
        await page.locator('.proto-embed__link').click();
        pointerPage = await opened;
        await pointerPage.setViewportSize({ width: 390, height: 844 });
        await pointerPage.waitForLoadState();
        expect(new URL(pointerPage.url()).pathname).toBe(prototypePath);
        target = pointerPage;
      } else {
        target = (await (await iframe.elementHandle())!.contentFrame())!;
      }
      const errors: string[] = [];
      pointerPage.on('pageerror', error => errors.push(error.message));
      await target.locator('#s0').click();
      await target.waitForFunction("phase === 'board'");
      const stitches: number[][] = await target.evaluate('ST');
      // Observe the actual rendered SVG throughout manual and automatic sewing.
      await target.evaluate(`
        window.needleEscapes = [];
        new MutationObserver(() => {
          const m = needle.transform.baseVal.consolidate().matrix;
          if (![m.e, m.f].every(Number.isFinite) || m.e < 0 || m.e > 390 || m.f < 0 || m.f > 844)
            window.needleEscapes.push([m.e, m.f]);
        }).observe(needle, { attributes: true, attributeFilter: ['transform'] });
      `);
      for (let i = 0; i < 8; i++) {
        const [x1, y1, x2, y2] = stitches[i];
        const box = (await target.locator('#board').boundingBox())!;
        const scale = box.width / 390;
        await pointerPage.mouse.move(box.x + x1 * scale, box.y + y1 * scale);
        await pointerPage.mouse.down();
        for (let k = 1; k <= 12; k++) {
          await pointerPage.mouse.move(box.x + (x1 + (x2 - x1) * k / 12) * scale,
            box.y + (y1 + (y2 - y1) * k / 12) * scale);
          await pointerPage.waitForTimeout(25);
        }
        await target.waitForFunction('dragT >= DONE_T');
        await pointerPage.mouse.up();
        if (i < 7) {
          // Original cadence: 300ms pause + 780ms transit, with scheduling margin.
          await target.waitForFunction('!restPending && transit === null', null, { timeout: 2200 });
          const tip: { ci: number; x: number; y: number } = await target.evaluate('({ci, x:render.x, y:render.y})');
          expect(tip.ci).toBe(i + 1);
          expect(tip.x).toBeCloseTo(stitches[i + 1][0], 1);
          expect(tip.y).toBeCloseTo(stitches[i + 1][1], 1);
          expect(await target.evaluate('window.needleEscapes')).toEqual([]);
        }
      }
      await expect(target.locator('#veil')).toHaveClass('on', { timeout: 15_000 });
      expect(await target.locator('#dones line').count()).toBe(12);
      expect(await target.evaluate('window.needleEscapes')).toEqual([]);
      await target.locator('#veilcue').click();
      await expect.poll(() => target.url()).toBe(new URL('/projects/yuejian/prototype/v5.html?shell=off#p10', page.url()).href);
      await expect(target.locator('#p10')).toBeVisible();
      expect(errors).toEqual([]);
    });
  }
}
