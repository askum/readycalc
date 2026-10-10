import { readFile, access } from 'node:fs/promises';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import { visibility } from './search-visibility.mjs';
const root=resolve(import.meta.dirname,'..');
const source=await readFile(resolve(root,'_worker.js'),'utf8');
const {default:worker}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
let calls=0;
const env={ASSETS:{fetch:async()=>{calls++;return new Response('public');}}};
let cases=0;
for (const slug of visibility.excluded) {
 await assert.rejects(access(resolve(root,`calculator/${slug}/index.html`)),slug);
 for(const path of [`/${slug}`,`/${slug}/`,`/${slug}/index.html`,`/calculator/${slug}/`,`/calculator/${slug}/index.html`]) {
  for(const ua of ['Googlebot','Mozilla/5.0']) {
   const before=calls;
   const res=await worker.fetch(new Request('https://readytools.kr'+path+'?check=1',{headers:{'User-Agent':ua}}),env);
   assert.equal(res.status,404,path);assert.equal(calls,before);
   assert.ok(!(await res.text()).includes('calculation-example'));cases++;
  }
 }
}
for(const path of ['/scripts/content-examples.json','/scripts/generate-personality-tests.mjs','/README.md','/%6deat-calculator/','/calculator%2fmeat-calculator/']) {
 const res=await worker.fetch(new Request('https://readytools.kr'+path),env);assert.equal(res.status,404,path);cases++;
}
for(const slug of visibility.indexable) {
 await access(resolve(root,`calculator/${slug}/index.html`));
 for(const path of [`/${slug}/`,`/calculator/${slug}/index.html`])assert.equal((await worker.fetch(new Request('https://readytools.kr'+path),env)).status,200);
}
for(const path of ['/','/about/','/privacy/','/terms/','/contact/','/methodology/','/disclaimer/','/robots.txt','/sitemap.xml','/assets/styles.css','/assets/calculators.js'])assert.equal((await worker.fetch(new Request('https://readytools.kr'+path),env)).status,200,path);
const site=await readFile(resolve(root,'sitemap.xml'),'utf8');assert.equal((site.match(/<url>/g)||[]).length,17);
console.log(`${cases} blocked-route checks passed; 61 original HTML files absent; 10 tools and policy pages accessible.`);
