import { readFile, access } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const routes = [
  'json-diff', 'json-csv-converter', 'xml-tools', 'yaml-json-converter',
  'html-tools', 'css-minifier', 'sql-formatter', 'regex-tester',
  'url-inspector', 'uuid-generator', 'timestamp-converter', 'base-converter',
  'http-mime-reference', 'cron-tools', 'subnet-calculator', 'jwt-decoder',
  'hash-generator', 'unicode-inspector'
];
const failures = [];
const titles = new Set();
const descriptions = new Set();
const sitemap = await readFile(resolve(root, 'sitemap.xml'), 'utf8');
const redirects = await readFile(resolve(root, '_redirects'), 'utf8');
const home = await readFile(resolve(root, 'index.html'), 'utf8');
const hub = await readFile(resolve(root, 'calculator', 'developer', 'index.html'), 'utf8');
const script = await readFile(resolve(root, 'assets', 'developer-suite.js'), 'utf8');

for (const route of routes) {
  const file = resolve(root, 'calculator', 'developer', route, 'index.html');
  await access(file);
  const html = await readFile(file, 'utf8');
  const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
  const description = html.match(/<meta name="description" content="([^"]+)"/)?.[1];
  if (!title || titles.has(title)) failures.push(route + ': title 누락 또는 중복'); else titles.add(title);
  if (!description || descriptions.has(description)) failures.push(route + ': description 누락 또는 중복'); else descriptions.add(description);
  if (!html.includes('<link rel="canonical" href="https://readytools.kr/developer/' + route + '/">')) failures.push(route + ': canonical 오류');
  if (!html.includes('name="twitter:card"') || !html.includes('property="og:url"')) failures.push(route + ': SNS 메타 누락');
  if (!html.includes('"@type":"WebApplication"') || !html.includes('"@type":"BreadcrumbList"')) failures.push(route + ': 구조화 데이터 누락');
  for (const match of html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
    try { JSON.parse(match[1]); } catch (error) { failures.push(route + ': JSON-LD 문법 오류 (' + error.message + ')'); }
  }
  if ((html.match(/<h1(?:\s|>)/g) || []).length !== 1) failures.push(route + ': h1 개수 오류');
  if ((html.match(/<details>/g) || []).length < 5) failures.push(route + ': FAQ 5개 미만');
  const articleText = (html.match(/<article[\s\S]*?<\/article>/)?.[0] || '').replace(/<[^>]+>/g, '').replace(/\s+/g, '');
  if (articleText.length < 800) failures.push(route + ': 본문 ' + articleText.length + '자 (800자 미만)');
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]));
  for (const label of html.matchAll(/<label[^>]*for="([^"]+)"/g)) if (!ids.has(label[1])) failures.push(route + ': label 대상 #' + label[1] + ' 누락');
  for (const control of html.matchAll(/<(?:input|select|textarea)\b[^>]*\sid="([^"]+)"[^>]*>/g)) {
    if (!html.includes('for="' + control[1] + '"')) failures.push(route + ': #' + control[1] + ' label 누락');
  }
  if (!sitemap.includes('https://readytools.kr/developer/' + route + '/')) failures.push(route + ': sitemap 누락');
  if (!hub.includes('href="/developer/' + route + '/"')) failures.push(route + ': 허브 링크 누락');
  if (!home.includes('href="/developer/' + route + '/"')) failures.push(route + ': 메인 개발 카테고리 직접 링크 누락');
  if (!script.includes("'" + route + "'")) failures.push(route + ': 실행 로직 누락');
}

if (!redirects.includes('/developer/* /calculator/developer/:splat 200')) failures.push('개발 도구 wildcard rewrite 누락');
if (!home.includes('data-category-filter="developer"')) failures.push('메인 개발 카테고리 탭 누락');

if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else {
  console.log('개발 도구 ' + routes.length + '개 페이지의 기능·SEO·콘텐츠·접근성·공개 경로 검사 통과');
}
