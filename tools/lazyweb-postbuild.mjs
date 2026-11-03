import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('dist');
const origin = 'https://xie-qingyu-portfolio-2026.pages.dev';
const ownDomain = `${origin}/agents`;
const htmlFiles = [];

async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) await walk(file);
    else if (entry.name.endsWith('.html')) htmlFiles.push(file);
  }
}

await walk(root);
const linkHeaders = [];
const sitemapUrls = [];

for (const file of htmlFiles) {
  const relative = path.relative(root, file).split(path.sep).join('/');
  const route = relative === 'index.html'
    ? '/'
    : relative.endsWith('/index.html')
      ? `/${relative.slice(0, -'index.html'.length)}`
      : `/${relative}`;
  const canonical = `${origin}${route}`;
  const markdown = `${ownDomain}/page.md?url=${encodeURIComponent(canonical)}`;
  const links = [
    `<${ownDomain}/agent-access>; rel="describedby"; type="text/html"`,
    `<${ownDomain}/mcp/public>; rel="mcp"`,
    `<${markdown}>; rel="alternate"; type="text/markdown"`,
  ];
  let html = await readFile(file, 'utf8');
  if (!html.includes('rel="describedby"')) {
    const head = `${links.map((link) => `<link ${link.replace(/^<([^>]+)>; /, 'href="$1" ').replaceAll('; ', ' ')}>`).join('\n    ')}\n    <script defer src="https://app.thelazyweb.com/assets/lazyweb.js" data-lazyweb-site="198367e0-0f11-4c1d-bf4e-de10fff8b4bd"></script>`;
    html = html.replace(/<head([^>]*)>/i, `<head$1>\n    ${head}`);
  }
  await writeFile(file, html);
  linkHeaders.push(`${route}\n  Link: ${links.join(', ')}`);
  sitemapUrls.push(canonical);
}

await writeFile(path.join(root, '_headers'), `${linkHeaders.join('\n')}\n`);
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...new Set([...sitemapUrls, `${ownDomain}/agent-access`])].map((url) => `  <url><loc>${url}</loc></url>`).join('\n')}\n</urlset>\n`;
await writeFile(path.join(root, 'sitemap.xml'), sitemap);
