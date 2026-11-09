import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { visibility } from './search-visibility.mjs';
import { loadMagazineArticles } from './magazine-data.mjs';

const root = resolve(import.meta.dirname, '..');
const base = 'https://readytools.kr';
const articles = await loadMagazineArticles();
const rows = [
  { path: '/', date: '2026-11-09', frequency: 'weekly', priority: '1.0' },
  ...visibility.indexable.map((slug) => ({ path: `/${slug}/`, date: '2026-11-09', frequency: 'monthly', priority: '0.9' })),
  { path: '/magazine/', date: '2026-11-09', frequency: 'weekly', priority: '0.8' },
  ...articles.map((article) => ({ path: `/magazine/${article.slug}/`, date: article.date, frequency: 'monthly', priority: '0.7' })),
  { path: '/about/', date: '2026-11-09', frequency: 'yearly', priority: '0.5' },
  { path: '/methodology/', date: '2026-09-28', frequency: 'yearly', priority: '0.6' },
  { path: '/contact/', date: '2026-10-02', frequency: 'yearly', priority: '0.5' },
  { path: '/privacy/', date: '2026-10-02', frequency: 'yearly', priority: '0.3' },
  { path: '/terms/', date: '2026-10-02', frequency: 'yearly', priority: '0.3' },
  { path: '/disclaimer/', date: '2026-09-28', frequency: 'yearly', priority: '0.3' }
];
const urls = rows.map(({ path, date, frequency, priority }) => `  <url><loc>${base}${path}</loc><lastmod>${date}</lastmod><changefreq>${frequency}</changefreq><priority>${priority}</priority></url>`).join('\n');
await writeFile(resolve(root, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
console.log(`Sitemap: ${rows.length} public URLs.`);
