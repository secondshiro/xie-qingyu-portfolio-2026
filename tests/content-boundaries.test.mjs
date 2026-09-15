import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const pages = [
  'src/pages/index.astro',
  'src/pages/work/real-estate-gis.astro',
  'src/pages/work/brand-system.astro',
  'src/pages/work/edgecase-planner.astro',
  'src/pages/work/execution-query.astro',
];

test('公开页面只展示批准的邮箱和定位', async () => {
  const text = (await Promise.all(pages.map((file) => readFile(file, 'utf8')))).join('\n');
  assert.match(text, /AI 原生产品体验设计师/);
  assert.match(text, /second988@qq\.com/);
  assert.doesNotMatch(text, /(?:\+?86[- ]?)?1[3-9]\d{9}/);
});

test('站点代码不引用只读源项目绝对路径', async () => {
  const text = (await Promise.all(pages.map((file) => readFile(file, 'utf8')))).join('\n');
  assert.doesNotMatch(text, /\/Users\/second\/Documents\/0工作/);
  assert.doesNotMatch(text, /\.\.\/.*信创迭代/);
});

test('执行网案例公开人工验证边界且不包含敏感查询证据', async () => {
  const text = await readFile('src/pages/work/execution-query.astro', 'utf8');
  assert.match(text, /安全验证由人完成/);
  assert.match(text, /一次人工验证/);
  assert.match(text, /两项合成任务/);
  assert.match(text, /名单排队/);
  assert.match(text, /本地控制台/);
  assert.match(text, /浏览器负责接着读取官网结果/);
  assert.match(text, /自动打开或复用查询页/);
  assert.match(text, /Excel/);
  assert.match(text, /变化比较/);
  assert.match(text, /本次未见/);
  assert.match(text, /真实浏览器中检查/);
  assert.match(text, /这次试用覆盖两项任务/);
  assert.match(text, /2026 年 9 月 12 日/);
  assert.match(text, /有记录/);
  assert.match(text, /无记录/);
  assert.match(text, /未完成/);
  assert.doesNotMatch(
    text,
    /自动(?:破解|识别|通过)验证码|(?:实现|支持|达到|可以)无人值守|无人值守运行|完全自动|零人工|永久可用|已上线|长期稳定运行|成功率|24\/7/,
  );
  assert.doesNotMatch(text, /不是.{0,30}而是|并非.{0,30}而是|不在于.{0,30}而在于|与其说.{0,30}不如说|看似.{0,30}实则/);
  assert.doesNotMatch(text, /captchaId|pCode|公民身份号码|统一社会信用代码/);
  assert.doesNotMatch(text, /\b\d{17}[\dXx]\b/);
});
