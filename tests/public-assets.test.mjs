import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

const required = [
  'public/projects/real-estate-gis/media/final/02-map-object-context.png',
  'public/projects/real-estate-gis/media/final/12-building-current-overview.png',
  'public/projects/real-estate-gis/media/final/13-task-relations-focus.png',
  'public/projects/real-estate-gis/media/public/legacy-map-observed.webp',
  'public/projects/real-estate-gis/media/public/legacy-building-overview-observed.webp',
  'public/projects/real-estate-gis/prototypes/map/index.html',
  'public/projects/real-estate-gis/prototypes/building/index.html',
  'public/projects/real-estate-gis/prototypes/task/index.html',
  'public/resume/xie-qingyu-resume.pdf',
  'public/projects/execution-query/evidence-manifest.json',
  'public/projects/execution-query/console-synthetic.webp',
  'public/projects/execution-query/export-synthetic.webp',
];

test('公开媒体和原型入口完整', async () => {
  await Promise.all(required.map((path) => access(path)));
});

test('公开简历为实际 PDF 文件', async () => {
  const pdf = await readFile('public/resume/xie-qingyu-resume.pdf');
  assert.equal(pdf.subarray(0, 5).toString(), '%PDF-');
});

test('复制后的原型不引用源项目相对位置', async () => {
  const files = required.filter((path) => path.endsWith('.html'));
  const text = (await Promise.all(files.map((path) => readFile(path, 'utf8')))).join('\n');
  assert.doesNotMatch(text, /\.\.\/\.superpowers|\.\.\/screen/);
  assert.doesNotMatch(text, /\/Users\/second/);
});

test('执行网公开证据使用合成或脱敏材料并保持可追溯', async () => {
  const manifest = JSON.parse(
    await readFile('public/projects/execution-query/evidence-manifest.json', 'utf8'),
  );
  assert.equal(manifest.updated, '2026-09-13');
  assert.equal(manifest.items.length, 2);
  const allowedKinds = new Set([
    'real-run-redacted',
    'real-product-synthetic-data',
    'structural-reconstruction',
  ]);
  for (const item of manifest.items) {
    assert.equal(allowedKinds.has(item.kind), true);
    assert.equal(item.publicSafe, true);
    assert.equal(typeof item.supports, 'string');
    assert.ok(item.supports.length > 12);
    await access(`public/projects/execution-query/${item.file}`);
  }
  const serialized = JSON.stringify(manifest);
  assert.doesNotMatch(serialized, /captchaId|pCode|公民身份号码|统一社会信用代码/);
  assert.doesNotMatch(serialized, /\b\d{17}[\dXx]\b/);
});
