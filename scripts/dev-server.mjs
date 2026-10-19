import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, sep, extname } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const port = Number(process.argv[2] || 8001);
const workerSource = await readFile(resolve(root, '_worker.js'), 'utf8');
const { default: worker } = await import(`data:text/javascript;base64,${Buffer.from(workerSource).toString('base64')}`);
const rules = (await readFile(resolve(root, '_redirects'), 'utf8'))
  .split('\n').map((line) => line.trim().split(/\s+/)).filter((parts) => parts.length === 3 && !parts[0].includes('*'));
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8' };

async function assetResponse(request) {
  const url = new URL(request.url);
  let pathname = url.pathname;
  const rule = rules.find(([from]) => from === pathname);
  if (rule?.[2] === '301') return Response.redirect(new URL(rule[1], url), 301);
  if (rule?.[2] === '200') pathname = rule[1];
  else if (pathname.startsWith('/developer/') && pathname !== '/developer/') pathname = `/calculator${pathname}`;
  if (pathname.includes('%') || pathname.includes('..')) return new Response('Not found', { status: 404 });
  const file = resolve(root, `.${pathname}`, pathname.endsWith('/') ? 'index.html' : '');
  if (!file.startsWith(root + sep)) return new Response('Not found', { status: 404 });
  try {
    const target = (await stat(file)).isDirectory() ? resolve(file, 'index.html') : file;
    const body = await readFile(target);
    return new Response(request.method === 'HEAD' ? null : body, { status: 200, headers: { 'Content-Type': types[extname(target)] || 'application/octet-stream' } });
  } catch { return new Response('Not found', { status: 404 }); }
}

createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://127.0.0.1:${port}`);
    const response = await worker.fetch(new Request(url, { method: req.method }), { ASSETS: { fetch: assetResponse } });
    res.writeHead(response.status, Object.fromEntries(response.headers));
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    console.error(error);
    res.writeHead(500); res.end('Internal server error');
  }
}).listen(port, '127.0.0.1', () => console.log(`생활계산소 미리보기: http://127.0.0.1:${port}/`));
