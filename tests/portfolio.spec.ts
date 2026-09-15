import { expect, test } from '@playwright/test';

test('关于提供键盘可用的 PDF 下载和联系入口', async ({ page, request }) => {
  await page.goto('/');
  const about = page.locator('#about');
  await expect(about.getByRole('link', { name: /查看完整案例/ })).toHaveCount(0);
  const link = about.getByRole('link', { name: /下载简历/ });
  for (let i = 0; i < 25 && !(await link.evaluate(el => el === document.activeElement)); i++) {
    await page.keyboard.press('Tab');
  }
  await expect(link).toBeFocused();
  expect(await link.evaluate(el => getComputedStyle(el).boxShadow)).not.toBe('none');
  const downloadEvent = page.waitForEvent('download');
  await page.keyboard.press('Enter');
  const download = await downloadEvent;
  expect(download.suggestedFilename()).toBe('谢擎宇-体验设计师简历.pdf');
  expect(await download.failure()).toBeNull();
  const response = await request.get('/resume/xie-qingyu-resume.pdf');
  expect(response.ok()).toBeTruthy();
  expect(response.headers()['content-type']).toContain('application/pdf');
  expect((await response.body()).subarray(0, 5).toString()).toBe('%PDF-');
  for (const width of [1440, 1280, 1010, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await about.screenshot({ path: `/private/tmp/portfolio-about-${width}.png` });
  }
});

for (const width of [1440, 1280, 1010, 390]) {
  test(`首页和案例在 ${width}px 无横向溢出`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    for (const path of ['/', '/work/real-estate-gis/', '/work/edgecase-planner/', '/work/brand-system/', '/work/execution-query/']) {
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      expect(overflow).toBeLessThanOrEqual(1);
      await expect(page.locator('h1')).toHaveCount(1);
    }
  });
}

test('窄屏隐藏三个 iframe 并保留完整原型入口', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/work/real-estate-gis/');
  await expect(page.locator('iframe')).toHaveCount(3);
  for (const iframe of await page.locator('iframe').all()) {
    await expect(iframe).toBeHidden();
  }
  await expect(page.getByRole('link', { name: /打开完整/ })).toHaveCount(3);
});

test('执行网案例展示人工接管、批量状态和三张导出表', async ({ page }) => {
  await page.goto('/work/execution-query/');
  await expect(page.locator('h1')).toHaveText('执行网查询助手');
  const ids = await page.locator('.case-section').evaluateAll((sections) =>
    sections.map((section) => section.id),
  );
  expect(ids).toEqual([
    'origin', 'breakage', 'decision', 'result', 'system', 'evidence',
  ]);
  await expect(page.locator('[data-evidence-kind="real-product-synthetic-data"]')).toHaveCount(2);
  await expect(page.locator('#result')).toContainText('安全验证由人完成');
  await expect(page.locator('#system')).toContainText('变化比较');
  await expect(page.locator('#system')).toContainText('本次未见');
  await expect(page.locator('#system')).toContainText('未完成');
  await expect(page.locator('#evidence [data-field-trial]')).toContainText('两项任务');
  await expect(page.locator('#evidence [data-field-trial]')).toContainText('1 / 1 详情');
  await expect(page.locator('#evidence [data-field-trial]')).toContainText('2 / 2 项完成、0 项失败');
  await expect(page.locator('#evidence')).toContainText('2026 年 9 月 12 日');
  const publicCopy = await page.locator('main').innerText();
  expect(publicCopy).not.toMatch(/[：:—–]/);
  expect(publicCopy).not.toMatch(/不是.{0,30}而是|并非.{0,30}而是|不在于.{0,30}而在于|与其说.{0,30}不如说|看似.{0,30}实则/);
});

test('跳到主要内容和核心入口可通过键盘访问', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: '跳到主要内容' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#main$/);
  await expect(page.locator('#main')).toBeFocused();
  await expect(page.locator('#selected-work').getByRole('link', { name: /查看完整案例/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /second988@qq.com/ }).first()).toBeVisible();
});

test('首页折页之间不显示橙色标记', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.project-fold__marker')).toHaveCount(0);
});

test('三个原型深链可独立打开', async ({ request }) => {
  const paths = [
    '/projects/real-estate-gis/prototypes/map/index.html?restore=1&building=宇济一号&code=17幢',
    '/projects/real-estate-gis/prototypes/building/index.html?building=宇济一号&code=17幢&owner=1&room=1501',
    '/projects/real-estate-gis/prototypes/task/index.html?building=宇济一号&code=17幢&from=gis&step=3&view=cards&filter=review',
  ];

  for (const path of paths) {
    const response = await request.get(path);
    expect(response.ok()).toBeTruthy();
    expect(response.headers()['content-type']).toContain('text/html');
  }
});

test('案例主标题使用文章型固定字阶', async ({ page }) => {
  await page.setViewportSize({ width: 1033, height: 735 });
  await page.goto('/work/real-estate-gis/');
  await expect(page.locator('.case-hero h1')).toHaveCSS('font-size', '44px');
  await expect(page.locator('.case-hero h1')).toHaveCSS('font-weight', '400');

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('.case-hero h1')).toHaveCSS('font-size', '40px');
});

test('案例章节标题与导语保持一档层级差', async ({ page }) => {
  await page.setViewportSize({ width: 837, height: 735 });
  await page.goto('/work/real-estate-gis/#result');
  const section = page.locator('#result .case-section__header');
  await expect(section.locator('h2')).toHaveCSS('font-size', '26px');
  await expect(section.locator('h2')).toHaveCSS('font-weight', '400');
  await expect(section.locator('p:not(.case-section__label)')).toHaveCSS('font-size', '20px');
});


test('Arco 独立评审展示操作结果并链接原页面', async ({ page }) => {
  await page.goto('/work/edgecase-planner/#arco');
  await expect(page.locator('#arco .arco-trace li')).toHaveCount(3);
  await expect(page.locator('#arco').getByRole('link', { name: '打开官方演示 ↗' })).toHaveAttribute('href', 'https://react-pro.arco.design/form/step');
  await expect(page.locator('#arco')).toContainText('链接填入 not-a-url');
  await expect(page.locator('[data-demo="context"], video')).toHaveCount(0);
  for (const width of [1129, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(page.locator('#arco .arco-trace ol')).toHaveCSS('gap', '32px');
    await page.locator('#arco').screenshot({path: `/private/tmp/edgecase-arco-${width}.png`});
  }
});

test('分页示意展示历史选择丢失', async ({ page }) => {
  await page.goto('/work/edgecase-planner/');
  for (const [section, count] of [['origin', '已选 0 项']]) {
    const demo = page.locator(`#${section} [data-demo="selection"]`);
    await demo.getByLabel('全选').check();
    await expect(demo.locator('[data-count]')).toHaveText('已选 3 项');
    await demo.getByRole('button', { name: '2', exact: true }).click();
    await demo.getByRole('button', { name: '1', exact: true }).click();
    await expect(demo.locator('[data-count]')).toHaveText(count);
    await expect(demo.getByLabel('全选')).toBeChecked({ checked: section === 'method' });
  }
});

test('AI 评审案例按经验、方法和验证连续展开', async ({ page }) => {
  await page.goto('/work/edgecase-planner/');
  const ids = await page.locator('.case-section').evaluateAll((sections) =>
    sections.map((section) => section.id),
  );
  expect(ids).toEqual([
    'origin', 'direction', 'method', 'flight', 'evolution', 'arco', 'boundary',
  ]);
  await expect(page.getByRole('link', { name: '↑ 返回开头，继续阅读' })).toHaveCount(0);
});


test('新增案例模块的间距与布局实际生效', async ({ page }) => {
  await page.goto('/work/edgecase-planner/');
  await expect(page.locator('#method [data-demo="selection"]')).toHaveCount(0);
  for (const width of [1129, 390]) {
    await page.setViewportSize({width, height: 900});
    const example = page.locator('#evolution .method-example');
    await expect(example).toHaveCSS('display', 'grid');
    await expect(example).toHaveCSS('row-gap', width === 390 ? '24px' : '48px');
    await expect(page.locator('#evolution .example-copy')).toHaveCSS('row-gap', '16px');
    const bounds = await example.evaluate(el => {
      const [demo, copy] = Array.from(el.children).map(child => child.getBoundingClientRect());
      return { vertical: copy.top - demo.bottom, horizontal: copy.left - demo.right };
    });
    expect(width === 390 ? bounds.vertical : bounds.horizontal).toBeGreaterThanOrEqual(23);
    await page.locator('#evolution').screenshot({path: `/private/tmp/edgecase-spacing-${width}.png`});
  }
});
