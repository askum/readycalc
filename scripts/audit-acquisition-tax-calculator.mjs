import { readFile, access } from 'node:fs/promises';
import { resolve } from 'node:path';
import vm from 'node:vm';

const root = resolve(import.meta.dirname, '..');
const route = 'real-estate-acquisition-tax-calculator';
const failures = [];
const html = await readFile(resolve(root, 'calculator', route, 'index.html'), 'utf8');
const script = await readFile(resolve(root, 'assets/real-estate-acquisition-tax.js'), 'utf8');
const sitemap = await readFile(resolve(root, 'sitemap.xml'), 'utf8');
const redirects = await readFile(resolve(root, '_redirects'), 'utf8');
const home = await readFile(resolve(root, 'index.html'), 'utf8');

const context = { document: { querySelector: () => null } };
context.globalThis = context;
vm.runInNewContext(script, context, { filename: 'real-estate-acquisition-tax.js' });
const rules = context.ReadyToolsAcquisitionTaxRules;
if (!rules) failures.push('계산 규칙 API를 불러오지 못함');

const check = (name, input, expected) => {
  try {
    const result = rules.calculate(input);
    for (const [key, value] of Object.entries(expected)) {
      if (Math.abs(result[key] - value) > 1) failures.push(`${name}: ${key}=${result[key]} (기대 ${value})`);
    }
  } catch (error) {
    failures.push(`${name}: 계산 오류 (${error.message})`);
  }
};

if (rules) {
  const defaults = { cause:'purchase', propertyType:'house', area:84, houseCount:'one', regulated:false, corporate:false, firstHomeMode:'none' };
  check('5억원 1주택 84㎡', { ...defaults, taxBase:500000000 }, { acquisitionRate:1, acquisitionTax:5000000, educationTax:500000, ruralTax:0, total:5500000 });
  check('7.5억원 1주택 100㎡', { ...defaults, taxBase:750000000, area:100 }, { acquisitionRate:2, acquisitionTax:15000000, educationTax:1500000, ruralTax:1500000, total:18000000 });
  check('10억원 1주택', { ...defaults, taxBase:1000000000 }, { acquisitionRate:3, acquisitionTax:30000000, educationTax:3000000, total:33000000 });
  check('조정지역 2주택', { ...defaults, taxBase:500000000, houseCount:'two', regulated:true }, { acquisitionRate:8, acquisitionTax:40000000, educationTax:2000000, ruralTax:0, total:42000000 });
  check('비조정 3주택 100㎡', { ...defaults, taxBase:500000000, area:100, houseCount:'three' }, { acquisitionRate:8, acquisitionTax:40000000, educationTax:2000000, ruralTax:3000000, total:45000000 });
  check('조정 3주택', { ...defaults, taxBase:500000000, houseCount:'three', regulated:true }, { acquisitionRate:12, acquisitionTax:60000000, educationTax:2000000, total:62000000 });
  check('법인 주택', { ...defaults, taxBase:500000000, corporate:true }, { acquisitionRate:12, total:62000000 });
  check('오피스텔 유상취득', { cause:'purchase', propertyType:'officetel', taxBase:100000000 }, { acquisitionRate:4, acquisitionTax:4000000, educationTax:400000, ruralTax:200000, total:4600000 });
  check('일반 주택 증여', { cause:'gift', propertyType:'house', taxBase:100000000, area:84, giftRateMode:'standard' }, { acquisitionRate:3.5, educationTax:300000, ruralTax:0, total:3800000 });
  check('중과 주택 증여 100㎡', { cause:'gift', propertyType:'house', taxBase:500000000, area:100, giftRateMode:'heavy' }, { acquisitionRate:12, educationTax:2000000, ruralTax:5000000, total:67000000 });
  check('농지 상속', { cause:'inheritance', propertyType:'farmland', taxBase:100000000 }, { acquisitionRate:2.3, educationTax:60000, ruralTax:200000, total:2560000 });
  check('생애최초 일반 감면', { ...defaults, taxBase:300000000, firstHomeMode:'general' }, { reduction:2000000, acquisitionTax:1000000, total:1300000 });
  check('생애최초 특례 감면', { ...defaults, taxBase:300000000, firstHomeMode:'special' }, { reduction:3000000, acquisitionTax:0, total:300000 });
  check('12억원 초과 감면 제외', { ...defaults, taxBase:1300000000, firstHomeMode:'general' }, { reduction:0 });
}

const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
const description = html.match(/<meta name="description" content="([^"]+)"/)?.[1];
if (!title || !description) failures.push('SEO title 또는 description 누락');
if (!html.includes(`https://readytools.kr/${route}/`)) failures.push('canonical/구조화 URL 누락');
if (!html.includes('WebApplication') || !html.includes('BreadcrumbList') || !html.includes('FAQPage')) failures.push('구조화 데이터 유형 누락');
for (const json of html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
  try { JSON.parse(json[1]); } catch (error) { failures.push(`JSON-LD 문법 오류 (${error.message})`); }
}
if ((html.match(/<h1(?:\s|>)/g) || []).length !== 1) failures.push('h1 개수 오류');
if ((html.match(/<details>/g) || []).length < 5) failures.push('FAQ 5개 미만');
const articleText = (html.match(/<article[\s\S]*?<\/article>/)?.[0] || '').replace(/<[^>]+>/g, '').replace(/\s+/g, '');
if (articleText.length < 2200) failures.push(`본문 설명 ${articleText.length}자 (2,200자 미만)`);
const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]));
for (const label of html.matchAll(/<label[^>]*for="([^"]+)"/g)) if (!ids.has(label[1])) failures.push(`label 대상 #${label[1]} 누락`);
if (!home.includes(`href="/${route}/"`)) failures.push('메인 내부 링크 누락');
if (!sitemap.includes(`https://readytools.kr/${route}/`)) failures.push('sitemap 누락');
if (!redirects.includes(`/${route}/ /calculator/${route}/ 200`)) failures.push('Cloudflare rewrite 누락');
await access(resolve(root, 'assets/real-estate-acquisition-tax.js'));

if (failures.length) {
  console.error(`취득세 계산기 점검 실패 (${failures.length}건)`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log('취득세 계산기 점검 통과: 14개 계산 사례, SEO·접근성·콘텐츠·공개 경로 확인');
}
