import { readFile, access } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const routes = [
  'color-converter', 'color-picker', 'color-palette-extractor', 'exif-remover',
  'image-color-picker', 'emoji-picker', 'dice-roller', 'file-size-converter',
  'loan-calculator', 'compound-interest-calculator', 'inflation-calculator',
  'roi-calculator', 'invoice-generator', 'citation-generator', 'readability-checker',
  'real-estate-brokerage-fee-calculator', 'real-estate-acquisition-tax-calculator'
];
const failures = [];
const titles = new Set();
const descriptions = new Set();
const sitemap = await readFile(resolve(root, 'sitemap.xml'), 'utf8');
const redirects = await readFile(resolve(root, '_redirects'), 'utf8');
const home = await readFile(resolve(root, 'index.html'), 'utf8');

for (const route of routes) {
  const file = resolve(root, 'calculator', route, 'index.html');
  await access(file);
  const html = await readFile(file, 'utf8');
  const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
  const description = html.match(/<meta name="description" content="([^"]+)"/)?.[1];
  if (!title || titles.has(title)) failures.push(`${route}: title 누락 또는 중복`); else titles.add(title);
  if (!description || descriptions.has(description)) failures.push(`${route}: description 누락 또는 중복`); else descriptions.add(description);
  if (!html.includes(`<link rel="canonical" href="https://readytools.kr/${route}/">`)) failures.push(`${route}: canonical 오류`);
  if (!html.includes('name="twitter:card"')) failures.push(`${route}: Twitter Card 누락`);
  if (!html.includes('"@type":"WebApplication"') || !html.includes('"@type":"BreadcrumbList"')) failures.push(`${route}: JSON-LD 유형 누락`);
  for (const json of html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
    try { JSON.parse(json[1]); } catch (error) { failures.push(`${route}: JSON-LD 문법 오류 (${error.message})`); }
  }
  if ((html.match(/<h1(?:\s|>)/g) || []).length !== 1) failures.push(`${route}: h1 개수 오류`);
  if ((html.match(/<details>/g) || []).length < 5) failures.push(`${route}: FAQ 5개 미만`);
  if (!html.includes('실제') || !html.includes('주의사항') || !html.includes('사용 방법')) failures.push(`${route}: 설명 구성 누락`);
  const articleText = (html.match(/<article[\s\S]*?<\/article>/)?.[0] || '').replace(/<[^>]+>/g, '').replace(/\s+/g, '');
  if (articleText.length < 800) failures.push(`${route}: 본문 설명 ${articleText.length}자 (800자 미만)`);
  if (!sitemap.includes(`https://readytools.kr/${route}/`)) failures.push(`${route}: sitemap 누락`);
  if (!redirects.includes(`/${route}/ /calculator/${route}/ 200`)) failures.push(`${route}: rewrite 누락`);
  if ((sitemap.match(new RegExp(`https://readytools\\.kr/${route}/`, 'g')) || []).length !== 1) failures.push(`${route}: sitemap URL 중복`);
  if ((redirects.match(new RegExp(`^/${route}/ /calculator/${route}/ 200$`, 'gm')) || []).length !== 1) failures.push(`${route}: rewrite 중복`);
  if (!home.includes(`href="/${route}/"`)) failures.push(`${route}: 메인 내부 링크 누락`);
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]));
  for (const label of html.matchAll(/<label[^>]*for="([^"]+)"/g)) if (!ids.has(label[1])) failures.push(`${route}: label 대상 #${label[1]} 누락`);
  for (const input of html.matchAll(/<(?:input|select|textarea)\b[^>]*\sid="([^"]+)"[^>]*>/g)) {
    if (!html.includes(`for="${input[1]}"`)) failures.push(`${route}: #${input[1]} label 누락`);
  }
}

const cardCount = (home.match(/data-tool-card/g) || []).length;
if (cardCount !== 71) failures.push(`메인 카드 수 ${cardCount}개 (기대 71개)`);
if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`신규 ${routes.length}개 페이지, 메인 ${cardCount}개 카드, SEO·FAQ·label·공개 경로 검사 통과`);
}
