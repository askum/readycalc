import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { visibility } from './search-visibility.mjs';
import { loadMagazineArticles } from './magazine-data.mjs';

const root = resolve(import.meta.dirname, '..');
const read = (path) => readFile(resolve(root, path), 'utf8');
const tools = new Set(visibility.indexable);
const articles = await loadMagazineArticles();
const publicRoutes = new Set(['/', '/about/', '/privacy/', '/terms/', '/contact/', '/methodology/', '/disclaimer/', '/magazine/']);
for (const slug of visibility.indexable) publicRoutes.add(`/${slug}/`);
for (const article of articles) publicRoutes.add(`/magazine/${article.slug}/`);

const titles = new Set();
const descriptions = new Set();
for (const slug of visibility.indexable) {
  const path = `calculator/${slug}/index.html`;
  const html = await read(path);
  const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
  const description = html.match(/<meta\s+name="description"\s+content="([^"]+)"/)?.[1];
  assert.ok(title && !titles.has(title), `${slug}: title missing or duplicate`); titles.add(title);
  assert.ok(description && !descriptions.has(description), `${slug}: description missing or duplicate`); descriptions.add(description);
  assert.ok(html.includes(`<link rel="canonical" href="https://readytools.kr/${slug}/">`), `${slug}: canonical`);
  assert.ok(html.includes(`property="og:url" content="https://readytools.kr/${slug}/"`), `${slug}: og:url`);
  assert.ok(html.includes(`property="og:image" content="https://readytools.kr/assets/og/${slug.replaceAll('/', '-')}.png"`), `${slug}: og:image`);
  assert.ok(html.includes('name="twitter:card" content="summary_large_image"'), `${slug}: Twitter card`);
  assert.equal((html.match(/<h1(?:\s|>)/g) || []).length, 1, `${slug}: h1`);
  assert.ok(/aria-live="(?:polite|assertive)"/.test(html), `${slug}: aria-live`);
  assert.ok(!/coupang|affiliate|rel="[^"]*sponsored/i.test(html), `${slug}: affiliate content remains`);
  for (const match of html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) JSON.parse(match[1]);
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]));
  for (const match of html.matchAll(/<label[^>]*for="([^"]+)"/g)) assert.ok(ids.has(match[1]), `${slug}: label target ${match[1]}`);
  for (const match of html.matchAll(/<(?:input|select|textarea)\b[^>]*\sid="([^"]+)"[^>]*>/g)) assert.ok(html.includes(`for="${match[1]}"`), `${slug}: unlabeled ${match[1]}`);
  for (const match of html.matchAll(/<(?:script[^>]+src|link[^>]+href)="(\/assets\/[^"?]+)(?:\?[^""]*)?"/g)) await access(resolve(root, match[1].slice(1)));
}

const sitemap = await read('sitemap.xml');
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
assert.equal(sitemapUrls.length, publicRoutes.size, 'sitemap count');
assert.equal(new Set(sitemapUrls).size, sitemapUrls.length, 'duplicate sitemap URL');
for (const route of publicRoutes) assert.ok(sitemap.includes(`<loc>https://readytools.kr${route}</loc>`), `sitemap missing ${route}`);
for (const slug of visibility.excluded) assert.ok(!sitemap.includes(`https://readytools.kr/${slug}/`), `withdrawn sitemap route ${slug}`);

const worker = await read('_worker.js');
for (const route of publicRoutes) assert.ok(worker.includes(JSON.stringify(route)), `worker missing ${route}`);
for (const slug of visibility.excluded) assert.ok(!worker.includes(JSON.stringify(`/${slug}/`)), `worker exposes ${slug}`);

const head = await read('assets/head.js');
assert.ok(head.includes('ca-pub-4297698834736188'), 'AdSense account missing');
assert.ok(head.includes('pagead2.googlesyndication.com/pagead/js/adsbygoogle.js'), 'AdSense loader missing');
assert.equal((await read('ads.txt')).trim(), 'google.com, pub-4297698834736188, DIRECT, f08c47fec0942fa0');
assert.ok((await read('robots.txt')).includes('Sitemap: https://readytools.kr/sitemap.xml'));
assert.equal(tools.size, 20);
assert.equal(articles.length, 21);
console.log('Curated release verified: 20 tools, 21 magazine articles, SEO, accessibility, local assets, AdSense connection, sitemap and worker routes.');
