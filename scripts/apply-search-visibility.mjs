import { readFile, writeFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { visibility, applySearchVisibility } from './search-visibility.mjs';
const root = resolve(import.meta.dirname, '..');
async function walk(dir) {
  const entries = await readdir(dir, {withFileTypes:true});
  return (await Promise.all(entries.filter(e=>!e.name.startsWith('.') && !['node_modules','scripts'].includes(e.name)).map(e=>e.isDirectory()?walk(resolve(dir,e.name)):e.name.endsWith('.html')?[resolve(dir,e.name)]:[]))).flat();
}
for (const path of await walk(root)) {
  const slug = path.startsWith(resolve(root,'calculator')+'/') ? path.slice(resolve(root,'calculator').length+1).replace(/\/index\.html$/,'') : '';
  const original = await readFile(path,'utf8');
  let html = applySearchVisibility(original,slug);
  if (path === resolve(root,'index.html')) {
    const categories = new Set([...html.matchAll(/data-tool-card data-category="([^"]+)"/g)].flatMap(m=>m[1].split(' ')));
    html = html.replace(/<button\b[^>]*data-category-filter="([^"]+)"[^>]*>[\s\S]*?<\/button>/g,(button,cat)=>cat==='all'||categories.has(cat)?button:'');
  }
  if(path===resolve(root,'about/index.html')) html=html.replaceAll('71개',`${visibility.indexable.length}개`);
  if(html!==original) await writeFile(path,html);
}
const file=resolve(root,'sitemap.xml');
let sitemap=await readFile(file,'utf8');
sitemap=sitemap.replace(/\s*<url>[\s\S]*?<\/url>/g, entry=>visibility.excluded.some(slug=>entry.includes(`<loc>https://readytools.kr/${slug}/</loc>`))?'':entry);
await writeFile(file,sitemap);
console.log(`Search visibility applied: ${visibility.indexable.length} public tools, ${visibility.excluded.length} noindex tools.`);
