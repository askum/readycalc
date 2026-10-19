import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import { visibility, applySearchVisibility } from './search-visibility.mjs';
import { loadMagazineArticles } from './magazine-data.mjs';
const root=resolve(import.meta.dirname,'..');
const read=p=>readFile(resolve(root,p),'utf8');
const home=await read('index.html');
const sitemap=await read('sitemap.xml');
const magazineArticles=await loadMagazineArticles();
assert.equal(visibility.indexable.length,15);
assert.equal(visibility.excluded.length,56);
assert.equal(new Set(visibility.indexable).size,15);
assert.equal(new Set(visibility.excluded).size,56);
assert.ok(visibility.indexable.every(slug => !visibility.excluded.includes(slug)));
assert.equal((home.match(/data-tool-card/g)||[]).length,15);
assert.equal((sitemap.match(/<url>/g)||[]).length,23+magazineArticles.length);
for(const slug of [...visibility.indexable,...visibility.excluded]) {
 if(visibility.mode==='withdrawn' && visibility.excluded.includes(slug)) {
  await assert.rejects(read(`calculator/${slug}/index.html`));
  assert.ok(!sitemap.includes(`<loc>https://readytools.kr/${slug}/</loc>`));
  continue;
 }
 const html=await read(`calculator/${slug}/index.html`);
 const indexable=visibility.indexable.includes(slug);
 assert.equal(/<meta name="robots" content="noindex, follow">/.test(html),!indexable,slug);
 assert.equal(sitemap.includes(`<loc>https://readytools.kr/${slug}/</loc>`),indexable,slug);
 assert.equal(home.includes(`href="/${slug}/"`),indexable,slug);
 if(indexable) {
  assert.ok(!/coupang|affiliate|rel="[^"]*sponsored/i.test(html),slug);
  const article=html.match(/<article class="section content-copy">([\s\S]*?)<\/article>/)?.[1];
  assert.ok(article,`${slug}: explanatory article missing`);
  const characters=Array.from(article.replace(/<[^>]*>/g,'').replace(/&(?:amp|lt|gt|quot|#39);/g,' ').replace(/\s+/g,'')).length;
  assert.ok(characters>=1500,`${slug}: explanatory article has only ${characters} non-whitespace characters`);
  assert.ok(/<h2>[^<]*(?:사용 방법|사용법|사용 가이드|입력 방법)[^<]*<\/h2>/.test(article),`${slug}: step-by-step usage guide missing`);
 }
 // Generators must retain the same search policy when pages are rebuilt.
 assert.equal(applySearchVisibility(html,slug),html,`${slug}: not idempotent`);
}
for(const route of ['', 'about','privacy','terms','contact','methodology','disclaimer',...visibility.indexable.map(s=>'calculator/'+s)]) {
 const html=await read(route?`${route}/index.html`:'index.html');
 for(const slug of visibility.excluded) assert.ok(!html.includes(`href="/${slug}/"`),`${route}: links to ${slug}`);
 assert.ok(!/<meta name="robots" content="[^"]*noindex/.test(html),`${route}: accidentally excluded`);
}
const categories=new Set([...home.matchAll(/data-tool-card data-category="([^"]+)"/g)].flatMap(m=>m[1].split(' ')));
for(const m of home.matchAll(/data-category-filter="([^"]+)"/g)) assert.ok(m[1]==='all'||categories.has(m[1]),`Empty category ${m[1]}`);
assert.ok(!(await read('robots.txt')).includes('Disallow: /'),'Crawlers must read noindex');
console.log(`Verified: 15 indexable tools with 1,500+ explanatory characters, 56 excluded tools, ${23+magazineArticles.length} sitemap URLs.`);
