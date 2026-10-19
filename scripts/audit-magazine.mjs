import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { loadMagazineArticles } from './magazine-data.mjs';

const root = resolve(import.meta.dirname, '..');
const read = (path) => readFile(resolve(root, path), 'utf8');
const articles = await loadMagazineArticles();
const home = await read('index.html');
const listing = await read('magazine/index.html');
const sitemap = await read('sitemap.xml');
const nav = await read('assets/site.js');

assert.ok(home.includes('href="/magazine/"'));
assert.ok(nav.includes('href="/magazine/"'));
assert.equal((listing.match(/class="magazine-card"/g) || []).length, articles.length);
for (const article of articles) {
  const path = `/magazine/${article.slug}/`;
  const html = await read(`magazine/${article.slug}/index.html`);
  assert.ok(listing.includes(`href="${path}"`), path);
  assert.ok(sitemap.includes(`<loc>https://readytools.kr${path}</loc>`), path);
  assert.ok(html.includes(`<h1>${article.title}</h1>`), path);
  assert.ok(html.includes(`href="${article.tool.href}"`), path);
  assert.ok(html.includes(`<time datetime="${article.date}">`), path);
  assert.ok(html.includes('application/ld+json'), path);
  const body = html.match(/<article class="magazine-article">([\s\S]*?)<\/article>/)?.[1];
  assert.ok(body, path);
  const length = Array.from(body.replace(/<[^>]*>/g, '').replace(/\s+/g, '')).length;
  assert.ok(length >= 1800, `${path}: only ${length} characters`);
  assert.equal((html.match(/<summary>/g) || []).length, article.faq.length, path);
}
console.log(`매거진 글 ${articles.length}개: 목록·본문·관련 도구·사이트맵 확인 완료.`);
