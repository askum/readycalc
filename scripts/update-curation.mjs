import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const file = resolve(root, 'scripts/search-visibility.json');
const data = JSON.parse(await readFile(file, 'utf8'));
data.date = '2026-11-09';
data.criterion = '20 carefully reviewed tools selected for repeat everyday use, including five newly restored finance and utility tools. Selection is based on usefulness, functional completeness, explanatory depth, browser-only processing, and ad-free publication; it is not an AdSense approval guarantee.';
data.indexable = [
  'real-estate-acquisition-tax-calculator',
  'real-estate-brokerage-fee-calculator',
  'travel-budget-calculator',
  'date-calculator',
  'travel-expense-splitter',
  'electricity-cost-calculator',
  'unit-converter',
  'fuel-cost-calculator',
  'travel-packing-checklist',
  'parcel-box-calculator',
  'moving-box-calculator',
  'chicken-calculator',
  'meat-calculator',
  'camping-food-calculator',
  'event-drink-calculator',
  'loan-calculator',
  'compound-interest-calculator',
  'inflation-calculator',
  'invoice-generator',
  'qr-code-generator'
];
const all = data.ranking.map(({ slug }) => slug);
data.excluded = all.filter((slug) => !data.indexable.includes(slug));
data.mode = 'withdrawn';
await writeFile(file, `${JSON.stringify(data, null, 2)}\n`);
console.log(`Curated ${data.indexable.length} public tools and ${data.excluded.length} withdrawn tools.`);
