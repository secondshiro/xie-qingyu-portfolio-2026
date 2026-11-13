import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize, relative, resolve } from 'node:path';

const root = resolve('dist');
const port = 4331;
const types = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.mp4': 'video/mp4',
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4',
  '.png': 'image/png',
  '.pdf': 'application/pdf',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url ?? '/', `http://${request.headers.host}`).pathname);
    let file = resolve(root, `.${normalize(pathname)}`);
    if (relative(root, file).startsWith('..')) throw new Error('outside root');
    const fileStat = await stat(file).catch(() => null);
    if (fileStat?.isDirectory() || pathname.endsWith('/')) file = join(file, 'index.html');
    const { size } = await stat(file);
    const headers = { 'content-type': types[extname(file)] ?? 'application/octet-stream', 'accept-ranges': 'bytes' };
    const range = request.headers.range?.match(/^bytes=(\d*)-(\d*)$/);
    if (range) {
      const start = range[1] ? Number(range[1]) : Math.max(0, size - Number(range[2]));
      const end = range[1] && range[2] ? Math.min(size - 1, Number(range[2])) : size - 1;
      if (start > end || start >= size) {
        response.writeHead(416, { 'content-range': `bytes */${size}` });
        response.end();
        return;
      }
      response.writeHead(206, { ...headers, 'content-range': `bytes ${start}-${end}/${size}`, 'content-length': end - start + 1 });
      createReadStream(file, { start, end }).pipe(response);
    } else {
      response.writeHead(200, { ...headers, 'content-length': size });
      createReadStream(file).pipe(response);
    }
  } catch {
    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('Not found');
  }
});

server.listen(port, '127.0.0.1', () => {
  process.stdout.write(`Static preview: http://127.0.0.1:${port}\n`);
});
