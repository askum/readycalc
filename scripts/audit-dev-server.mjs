import assert from 'node:assert/strict';
import { visibility } from './search-visibility.mjs';
import { loadMagazineArticles } from './magazine-data.mjs';

const base = 'http://127.0.0.1:8001';
for (const slug of visibility.indexable) {
  const response = await fetch(`${base}/${slug}/`);
  assert.equal(response.status, 200, slug);
  assert.ok((await response.text()).includes('<main'), slug);
}
for (const slug of visibility.excluded) {
  const response = await fetch(`${base}/${slug}/`);
  assert.equal(response.status, 404, slug);
  const archived = await fetch(`${base}/content/withdrawn-calculators/${slug}/index.html`);
  assert.equal(archived.status, 404, `archive: ${slug}`);
}
const magazineArticles = await loadMagazineArticles();
for (const route of ['/magazine/', ...magazineArticles.map(({ slug }) => `/magazine/${slug}/`)]) {
  const response = await fetch(`${base}${route}`);
  assert.equal(response.status, 200, route);
}
console.log(`공개 계산기 ${visibility.indexable.length}개와 매거진 ${magazineArticles.length+1}개는 200, 비공개 도구 ${visibility.excluded.length}개와 보관본은 404.`);
