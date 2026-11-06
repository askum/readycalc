import { execFileSync } from 'node:child_process';
import { access, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { visibility } from './search-visibility.mjs';

const root = resolve(import.meta.dirname, '..');
const archiveRoot = resolve(root, 'content', 'withdrawn-calculators');
const additions = JSON.parse(await readFile(resolve(root, 'content', 'curated-tool-additions.json'), 'utf8'));
const established = new Set(['real-estate-acquisition-tax-calculator', 'real-estate-brokerage-fee-calculator', 'travel-budget-calculator', 'date-calculator', 'travel-expense-splitter']);
const exists = (path) => access(path).then(() => true, () => false);
const escape = (value) => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

function addDepth(html, slug) {
  const entry = additions[slug];
  if (!entry) throw new Error(`${slug}: curated explanatory addition missing`);
  const section = `<section class="content-depth" data-curated-depth><h2>${escape(entry.heading)}</h2>${entry.paragraphs.map((p) => `<p>${escape(p)}</p>`).join('')}<h3>단계별 확인 순서</h3><ol>${entry.steps.map((step) => `<li>${escape(step)}</li>`).join('')}</ol></section>`;
  html = html.replace(/<section class="content-depth" data-curated-depth>[\s\S]*?<\/section>/, '');
  if (!html.includes('</article>')) throw new Error(`${slug}: explanatory article closing tag missing`);
  return html.replace('</article>', `${section}</article>`);
}

for (const slug of visibility.indexable.filter((slug) => !established.has(slug))) {
  const source = execFileSync('git', ['show', `${visibility.restoreCommit}:calculator/${slug}/index.html`], { cwd: root, encoding: 'utf8', maxBuffer: 8_000_000 });
  let html = source.replace(/<meta\s+name="robots"[^>]*>\s*/i, '');
  html = html.replace(/<section class="section affiliate-section"[\s\S]*?<\/section>\s*/g, '');
  html = html.replace(/data-reviewed="[^"]+"/g, 'data-reviewed="2026-11-07"');
  html = addDepth(html, slug);
  if (!html.includes('/assets/result-receipts.css')) html = html.replace('</head>', '  <link rel="stylesheet" href="/assets/result-receipts.css?v=20261020">\n  <script src="/assets/result-receipts.js?v=20261020" defer></script>\n</head>');
  const target = resolve(root, 'calculator', slug, 'index.html');
  await mkdir(resolve(target, '..'), { recursive: true });
  await writeFile(target, html);
}

for (const slug of visibility.excluded) {
  const publicFile = resolve(root, 'calculator', slug, 'index.html');
  if (await exists(publicFile)) {
    let html = await readFile(publicFile, 'utf8');
    html = html.replace(/<meta\b[^>]*name=["'](?:robots|googlebot)["'][^>]*>\s*/gi, '');
    html = html.replace('</head>', '<meta name="robots" content="noindex, follow">\n</head>');
    if (!html.includes('/assets/result-receipts.css')) html = html.replace('</head>', '  <link rel="stylesheet" href="/assets/result-receipts.css?v=20261020">\n  <script src="/assets/result-receipts.js?v=20261020" defer></script>\n</head>');
    const archived = resolve(archiveRoot, slug, 'index.html');
    await mkdir(resolve(archived, '..'), { recursive: true });
    await writeFile(archived, html);
    await rm(resolve(publicFile, '..'), { recursive: true });
  }
  await rm(resolve(root, 'assets', 'og', `${slug.replaceAll('/', '-')}.png`), { force: true });
}

console.log(`Published ${visibility.indexable.length} curated tools and withdrew ${visibility.excluded.length} others.`);
