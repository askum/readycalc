import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const configSource = await readFile(resolve(root, 'assets/site-config.js'), 'utf8');
const baseMatch = configSource.match(/baseUrl:\s*['"]([^'"]+)['"]/);
if (!baseMatch) throw new Error('assets/site-config.js에서 baseUrl을 찾을 수 없습니다.');
const baseUrl = baseMatch[1].replace(/\/$/, '');

const routes = [
  '', 'meat-calculator', 'fuel-cost-calculator', 'camping-food-calculator',
  'event-drink-calculator', 'moving-box-calculator', 'travel-expense-splitter',
  'random-team-generator', 'about', 'contact', 'privacy', 'terms', 'disclaimer'
];

for (const route of routes) {
  const file = resolve(root, route, 'index.html');
  const pageUrl = `${baseUrl}/${route ? `${route}/` : ''}`;
  let html = await readFile(file, 'utf8');
  html = html
    .replace(/(<link rel="canonical" href=")[^"]+("\s*>)/, `$1${pageUrl}$2`)
    .replace(/(<meta property="og:url" content=")[^"]+("\s*>)/, `$1${pageUrl}$2`)
    .replace(/(<meta property="og:image" content=")[^"]+("\s*>)/, `$1${baseUrl}/assets/og.png$2`);

  html = html.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g, (block, jsonText) => {
    try {
      const data = JSON.parse(jsonText);
      if (data['@type'] === 'WebSite' || data['@type'] === 'WebApplication') data.url = pageUrl;
      return `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
    } catch {
      return block;
    }
  });
  await writeFile(file, html);
}

const sitemapFile = resolve(root, 'sitemap.xml');
let sitemap = await readFile(sitemapFile, 'utf8');
sitemap = sitemap.replace(/<loc>[^<]+<\/loc>/g, (loc) => {
  const pathname = new URL(loc.slice(5, -6)).pathname;
  return `<loc>${baseUrl}${pathname}</loc>`;
});
await writeFile(sitemapFile, sitemap);

const robotsFile = resolve(root, 'robots.txt');
let robots = await readFile(robotsFile, 'utf8');
robots = robots.replace(/^Sitemap:\s*.+$/m, `Sitemap: ${baseUrl}/sitemap.xml`);
await writeFile(robotsFile, robots);

console.log(`사이트 기본 URL을 ${baseUrl}(으)로 동기화했습니다.`);
