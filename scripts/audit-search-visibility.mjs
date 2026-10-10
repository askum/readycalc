import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import { visibility, applySearchVisibility } from './search-visibility.mjs';
const root=resolve(import.meta.dirname,'..');
const read=p=>readFile(resolve(root,p),'utf8');
const home=await read('index.html');
const sitemap=await read('sitemap.xml');
const ranked=visibility.ranking.filter(r=>!r.affiliate).slice(0,10).map(r=>r.slug);
assert.deepEqual(visibility.indexable,ranked);
assert.equal(visibility.excluded.length,61);
assert.equal((home.match(/data-tool-card/g)||[]).length,10);
assert.equal((sitemap.match(/<url>/g)||[]).length,17);
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
 if(indexable) assert.ok(!/coupang|affiliate|rel="[^"]*sponsored/i.test(html),slug);
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
console.log('Verified: 10 indexable tools, 61 excluded tools, 17 sitemap URLs; no excluded links or empty categories on public pages.');
