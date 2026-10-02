import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import { withContentExamples } from './content-examples.mjs';

const root = resolve(import.meta.dirname, '..');
async function pages(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  return (await Promise.all(entries.map(entry => entry.isDirectory() ? pages(resolve(dir, entry.name)) : entry.name === 'index.html' ? [resolve(dir, entry.name)] : []))).flat();
}
const data = JSON.parse(await readFile(resolve(root, 'scripts/content-examples.json'), 'utf8'));
const decode = text => text.replace(/&(?:amp|lt|gt|quot|apos|#39|nbsp);/g, token => ({'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&apos;':"'",'&#39;':"'",'&nbsp;':' '})[token]);
let count = 0;
let minimum = Infinity;
for (const path of await pages(resolve(root, 'calculator'))) {
  const html = await readFile(path, 'utf8');
  const article = html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/)?.[1];
  if (!article) continue;
  const length = decode(article.replace(/<[^>]*>/g, '')).replace(/\s/g, '').length;
  assert.ok(length >= 1000, `${path}: ${length} characters`);
  assert.equal((article.match(/class="calculation-example"/g) || []).length, 3, `${path}: three examples required`);
  assert.ok((html.match(/<details>/g) || []).length >= 5, `${path}: five FAQs required`);
  const slug = path.slice(resolve(root, 'calculator').length + 1).replace(/\/index\.html$/, '');
  if (data[slug]) assert.equal(withContentExamples(html, slug), html, `${slug}: generated examples are stale`);
  minimum = Math.min(minimum, length);
  count++;
}
assert.equal(count, 71);
console.log(`${count}개 페이지: 공백 제외 본문 최소 ${minimum}자, 예시 각 3개, FAQ 각 5개 이상, 생성 원본 일치 확인`);
