import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { resolve } from 'node:path';
import { visibility } from './search-visibility.mjs';

const root = resolve(import.meta.dirname, '..');
const workerSource = await readFile(resolve(root, '_worker.js'), 'utf8');
const { default: worker } = await import('data:text/javascript;base64,' + Buffer.from(workerSource).toString('base64'));
const env = { ASSETS: { fetch: async () => new Response('public') } };

for (const slug of visibility.excluded) {
  const archived = await readFile(resolve(root, 'content', 'withdrawn-calculators', slug, 'index.html'), 'utf8');
  assert.ok(archived.includes('/assets/result-receipts.css'), slug);
  assert.ok(archived.includes('/assets/result-receipts.js'), slug);
  assert.ok(archived.includes('name="robots" content="noindex'), slug);
  await assert.rejects(access(resolve(root, 'calculator', slug, 'index.html')), slug);
  const privateUrl = `https://readytools.kr/content/withdrawn-calculators/${slug}/index.html`;
  assert.equal((await worker.fetch(new Request(privateUrl), env)).status, 404, slug);
  assert.equal((await worker.fetch(new Request(`https://readytools.kr/${slug}/`), env)).status, 404, slug);
}
console.log(`비공개 도구 ${visibility.excluded.length}개 결과 보관본과 404 차단 상태 확인 완료.`);
