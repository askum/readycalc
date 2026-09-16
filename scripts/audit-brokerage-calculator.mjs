import { readFile, access } from 'node:fs/promises';
import { resolve } from 'node:path';
import vm from 'node:vm';

const root = resolve(import.meta.dirname, '..');
const route = 'real-estate-brokerage-fee-calculator';
const failures = [];
const html = await readFile(resolve(root, 'calculator', route, 'index.html'), 'utf8');
const script = await readFile(resolve(root, 'assets/real-estate-brokerage-fee.js'), 'utf8');
const sitemap = await readFile(resolve(root, 'sitemap.xml'), 'utf8');
const redirects = await readFile(resolve(root, '_redirects'), 'utf8');
const home = await readFile(resolve(root, 'index.html'), 'utf8');

const context = { document: { querySelector: () => null } };
context.globalThis = context;
vm.runInNewContext(script, context, { filename: 'real-estate-brokerage-fee.js' });
const rules = context.ReadyToolsBrokerageRules;
if (!rules) failures.push('계산 규칙 API를 불러오지 못함');

const check = (name, input, expected) => {
  try {
    const result = rules.calculate(input);
    for (const [key, value] of Object.entries(expected)) {
      if (result[key] !== value) failures.push(`${name}: ${key}=${result[key]} (기대 ${value})`);
    }
  } catch (error) {
    failures.push(`${name}: 계산 오류 (${error.message})`);
  }
};

if (rules) {
  if (rules.REGIONS.length !== 17) failures.push(`지역 ${rules.REGIONS.length}개 (기대 17개)`);
  const saleBoundaries = [[1,0.6],[50000000,0.5],[200000000,0.4],[900000000,0.5],[1200000000,0.6],[1500000000,0.7]];
  const leaseBoundaries = [[1,0.5],[50000000,0.4],[100000000,0.3],[600000000,0.4],[1200000000,0.5],[1500000000,0.6]];
  saleBoundaries.forEach(([amount, rate]) => {
    if (rules.ruleFor({ propertyType:'house', transaction:'sale', amount }).rate !== rate) failures.push(`주택 매매 ${amount}원 경계요율 오류`);
  });
  leaseBoundaries.forEach(([amount, rate]) => {
    if (rules.ruleFor({ propertyType:'house', transaction:'jeonse', amount }).rate !== rate) failures.push(`주택 임대차 ${amount}원 경계요율 오류`);
  });
  check('주택 4천만원 매매', { propertyType:'house', transaction:'sale', price:40000000, agreedRate:null, vatRate:0 }, { transactionAmount:40000000, maximumRate:0.6, maximumFee:240000 });
  check('주택 4천9백만원 매매 한도', { propertyType:'house', transaction:'sale', price:49000000, agreedRate:null, vatRate:0 }, { maximumFee:250000 });
  check('주택 5억원 매매', { propertyType:'house', transaction:'sale', price:500000000, agreedRate:null, vatRate:0 }, { maximumRate:0.4, maximumFee:2000000 });
  check('주택 저가 월세 70배', { propertyType:'house', transaction:'monthly', deposit:5000000, monthlyRent:350000, agreedRate:null, vatRate:0 }, { transactionAmount:29500000, rentMultiplier:70, maximumFee:147500 });
  check('주택 월세 100배', { propertyType:'house', transaction:'monthly', deposit:20000000, monthlyRent:400000, agreedRate:null, vatRate:0 }, { transactionAmount:60000000, rentMultiplier:100, maximumFee:240000 });
  check('오피스텔 월세', { propertyType:'officetel', transaction:'monthly', deposit:5000000, monthlyRent:350000, agreedRate:null, vatRate:0 }, { maximumRate:0.4, maximumFee:118000 });
  check('상가 매매', { propertyType:'other', transaction:'sale', price:100000000, agreedRate:null, vatRate:10 }, { maximumRate:0.9, maximumFee:900000, vat:90000, total:990000 });
  check('협의요율', { propertyType:'house', transaction:'sale', price:300000000, agreedRate:0.3, vatRate:0 }, { maximumRate:0.4, negotiatedFee:900000 });
  let rejected = false;
  try { rules.calculate({ propertyType:'house', transaction:'sale', price:300000000, agreedRate:0.5, vatRate:0 }); } catch { rejected = true; }
  if (!rejected) failures.push('상한 초과 협의요율을 거부하지 않음');
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
if ((html.match(/<option>/g) || []).length < 17) failures.push('17개 지역 선택지 누락');
const articleText = (html.match(/<article[\s\S]*?<\/article>/)?.[0] || '').replace(/<[^>]+>/g, '').replace(/\s+/g, '');
if (articleText.length < 1800) failures.push(`본문 설명 ${articleText.length}자 (1,800자 미만)`);
if (!home.includes(`href="/${route}/"`)) failures.push('메인 내부 링크 누락');
if (!sitemap.includes(`https://readytools.kr/${route}/`)) failures.push('sitemap 누락');
if (!redirects.includes(`/${route}/ /calculator/${route}/ 200`)) failures.push('Cloudflare rewrite 누락');
await access(resolve(root, 'assets/real-estate-brokerage-fee.js'));

if (failures.length) {
  console.error(`중개보수 계산기 점검 실패 (${failures.length}건)`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log('중개보수 계산기 점검 통과: 17개 지역, 주택 12개 구간 경계와 8개 계산 사례, SEO·콘텐츠·공개 경로 확인');
}
