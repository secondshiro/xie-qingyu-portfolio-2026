import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';

const project = '/projects/real-estate-gis';

test('GIS 原型及案例图片与待发布文件逐字节一致', async ({ page, request }) => {
  test.setTimeout(60_000);
  const source = `public${project}/prototypes`;
  const entries = await readdir(source, { recursive: true, withFileTypes: true });
  const directories = entries.filter(entry => entry.isDirectory() && entry.parentPath === source);
  expect(directories.map(entry => entry.name).sort()).toEqual(['building', 'map', 'task']);
  const prototypeFiles = entries.filter(entry => entry.isFile())
    .map(entry => join(entry.parentPath, entry.name).slice('public'.length));

  await page.goto('/work/real-estate-gis/');
  const mediaFiles = await page.locator(`img[src^="${project}/media/"]`).evaluateAll(
    images => images.map(image => image.getAttribute('src')),
  );
  expect(mediaFiles.length).toBeGreaterThan(0);
  const files = [...new Set([...prototypeFiles, ...mediaFiles])];
  const checks = await Promise.allSettled(files.map(async path => {
    const expected = await readFile(`public${path}`);
    const response = await request.get(path, { timeout: 20_000, maxRetries: 1 });
    try {
      if (!response.ok()) throw new Error(`HTTP ${response.status()} · ${path}`);
      const body = await response.body();
      if (!body.equals(expected)) throw new Error(`与发布副本不同 · ${path}`);
    } finally {
      await response.dispose();
    }
  }));
  const failures = checks.flatMap(check => check.status === 'rejected' ? [String(check.reason)] : []);
  expect(failures).toEqual([]);
});
