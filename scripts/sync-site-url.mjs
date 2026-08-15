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
  'random-team-generator', 'chicken-calculator', 'company-dinner-drink-calculator',
  'pizza-calculator', 'travel-packing-checklist', 'currency-exchange-calculator',
  'travel-budget-calculator',
  'international-travel-cost-calculator', 'unit-converter', 'date-calculator',
  'qr-code-generator', 'password-generator', 'text-tools', 'electricity-cost-calculator',
  'parcel-box-calculator', 'first-birthday-food-calculator', 'cake-size-calculator',
  'about', 'contact', 'privacy', 'terms', 'disclaimer'
];
const calculatorRoutes = new Set([
  'meat-calculator', 'fuel-cost-calculator', 'camping-food-calculator',
  'event-drink-calculator', 'moving-box-calculator', 'travel-expense-splitter',
  'random-team-generator', 'chicken-calculator', 'company-dinner-drink-calculator',
  'pizza-calculator', 'travel-packing-checklist', 'currency-exchange-calculator',
  'travel-budget-calculator',
  'international-travel-cost-calculator', 'unit-converter', 'date-calculator',
  'qr-code-generator', 'password-generator', 'text-tools', 'electricity-cost-calculator',
  'parcel-box-calculator', 'first-birthday-food-calculator', 'cake-size-calculator'
]);

for (const route of routes) {
  const file = calculatorRoutes.has(route)
    ? resolve(root, 'calculator', route, 'index.html')
    : resolve(root, route, 'index.html');
  const pageUrl = `${baseUrl}/${route ? `${route}/` : ''}`;
  let html = await readFile(file, 'utf8');
  html = html
    .replace(/(<link rel="canonical" href=")[^"]+("\s*>)/, `$1${pageUrl}$2`)
    .replace(/(<meta property="og:url" content=")[^"]+("\s*>)/, `$1${pageUrl}$2`)
    .replace(/(<meta property="og:image" content=")[^"]+("\s*>)/, `$1${baseUrl}/assets/og.png$2`)
    .replace(/(<meta name="twitter:image" content=")[^"]+("\s*>)/, `$1${baseUrl}/assets/og.png$2`);

  html = html.replace(/<script type="application\/ld\+json"([^>]*)>([\s\S]*?)<\/script>/g, (block, attributes, jsonText) => {
    try {
      const data = JSON.parse(jsonText);
      const updateUrls = (node) => {
        if (!node || typeof node !== 'object') return;
        if (node['@type'] === 'WebSite' || node['@type'] === 'WebApplication') node.url = pageUrl;
        Object.entries(node).forEach(([key, entry]) => {
          if ((key === 'url' || key === 'item') && typeof entry === 'string' && /^https?:\/\//.test(entry)) {
            const parsed = new URL(entry);
            node[key] = `${baseUrl}${parsed.pathname}${parsed.hash}`;
          } else if (typeof entry === 'object') updateUrls(entry);
        });
      };
      updateUrls(data);
      return `<script type="application/ld+json"${attributes}>${JSON.stringify(data)}</script>`;
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
