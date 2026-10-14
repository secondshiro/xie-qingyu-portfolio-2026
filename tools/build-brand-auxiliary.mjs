import { readFile, writeFile } from 'node:fs/promises';

const output = new URL('../public/projects/brand-system/media/auxiliary/', import.meta.url);
const original = await readFile(new URL('original-mark.svg', output), 'utf8');
const mark = original.match(/d="([^"]+)" fill="black"/)[1];
const face = 'M0 0H112L272 160L384 48L440 104L272 272Z';
const helper = `<path d="${face}"/><path d="${face}" transform="translate(700 460) rotate(180)"/>`;
const font = "system-ui,-apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei',sans-serif";
const text = (x, y, content, size, fill, weight = 400, spacing = 0) =>
  `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" font-weight="${weight}" letter-spacing="${spacing}">${content}</text>`;
const useMark = (x, y, w, fill = '#000') =>
  `<use href="#mark" transform="translate(${x} ${y}) scale(${w / 634.992})" fill="${fill}"/>`;
const useHelper = (x, y, w, fill = '#000') =>
  `<use href="#helper" transform="translate(${x} ${y}) scale(${w / 700})" fill="${fill}"/>`;
const svg = (width, height, title, body, viewBox = `0 0 ${width} ${height}`) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${viewBox}" style="font-family:${font}"><title>${title}</title><defs><g id="mark"><path d="${mark}"/></g><g id="helper">${helper}</g></defs>${body}</svg>\n`;

const assets = {
  'fold-unit.svg': svg(440, 272, '从标志提取的折角单元', `<path d="${face}" fill="#000"/>`),
  'double-fold.svg': svg(700, 460, '双折面辅助图形', `<g fill="#000">${helper}</g>`),
  'landscape.svg': svg(960, 540, '双折面横版海报延展提案', `
    <rect width="960" height="540" fill="#000"/>
    ${useHelper(445, -120, 1020, '#fff')}
    ${useMark(40, 40, 62, '#fff')}
    ${text(40, 139, '我自为道', 40, '#fff', 500)}
    ${text(40, 191, '视界无疆', 40, '#fff', 500)}
    ${text(40, 228, 'BORN TO HOVER', 14, '#fff', 400, 1.8)}
    ${text(40, 496, 'XHOVER', 16, '#fff', 500, 5)}
    <rect x="40" y="326" width="5" height="30" fill="#007BFF"/>
  `),
  'portrait.svg': svg(696, 928, '双折面竖版封面延展提案', `
    <rect width="464" height="618.666667" fill="#f0f0f0"/>
    ${useMark(32, 32, 62)}
    ${text(32, 126, '我自为道', 32, '#000', 500)}
    ${text(32, 166, '视界无疆', 32, '#000', 500)}
    ${text(32, 204, 'BORN TO HOVER', 12, '#555', 400, 1.5)}
    ${useHelper(-96, 280, 740)}
    ${text(32, 584, 'XHOVER', 13, '#000', 500, 4)}
  `, '0 0 464 618.666667'),
};

for (const [name, content] of Object.entries(assets)) {
  await writeFile(new URL(name, output), content);
}
console.log(`Generated ${Object.keys(assets).length} brand auxiliary assets.`);
