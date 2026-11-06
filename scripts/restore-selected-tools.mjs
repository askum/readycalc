import { execFileSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { visibility } from './search-visibility.mjs';

const root = resolve(import.meta.dirname, '..');
const commit = visibility.restoreCommit;
const established = new Set(['real-estate-acquisition-tax-calculator', 'real-estate-brokerage-fee-calculator', 'travel-budget-calculator', 'date-calculator', 'travel-expense-splitter']);
const selected = visibility.indexable.filter((slug) => !established.has(slug));
for (const slug of selected) {
  const target = resolve(root, 'calculator', slug, 'index.html');
  const original = execFileSync('git', ['show', `${commit}:calculator/${slug}/index.html`], { cwd: root, encoding: 'utf8', maxBuffer: 8_000_000 });
  if (!original.includes('</head>') || !/name="robots" content="noindex/.test(original)) throw new Error(`${slug}: archived source is not an expected hidden page`);
  let html = original.replace(/<meta\s+name="robots"[^>]*>\s*/i, '');
  html = html.replace(/<section class="section affiliate-section"[\s\S]*?<\/section>\s*/g, '');
  if (!html.includes('/assets/result-receipts.css')) html = html.replace('</head>', '  <link rel="stylesheet" href="/assets/result-receipts.css?v=20261020">\n  <script src="/assets/result-receipts.js?v=20261020" defer></script>\n</head>');
  html = html.replace(/data-reviewed="[^"]+"/g, 'data-reviewed="2026-11-07"');
  // Keep tool result features while preserving the existing calculator implementation.
  await mkdir(resolve(target, '..'), { recursive: true });
  await writeFile(target, html);
}
console.log(`Restored ${selected.length} selected calculator source pages.`);
