import { readFile, access } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const slugs = ['mbti-test','travel-style-test','spending-style-test','work-style-test','ai-style-test','hobby-test'];
const failures = [];
const sitemap = await readFile(resolve(root, 'sitemap.xml'), 'utf8');
const redirects = await readFile(resolve(root, '_redirects'), 'utf8');
const main = await readFile(resolve(root, 'index.html'), 'utf8');
const runtime = await readFile(resolve(root, 'assets/personality-tests.js'), 'utf8');

const matchCount = (text, pattern) => (text.match(pattern) || []).length;
const exists = async (path) => {
  try { await access(path); return true; } catch { return false; }
};
const extractConfig = (html) => {
  const match = html.match(/<script type="application\/json" data-test-config>([\s\S]*?)<\/script>/);
  if (!match) throw new Error('테스트 설정 JSON 누락');
  return JSON.parse(match[1]);
};

for (const slug of slugs) {
  const path = resolve(root, 'calculator', slug, 'index.html');
  let html;
  try { html = await readFile(path, 'utf8'); } catch { failures.push(`${slug}: 페이지 파일 누락`); continue; }
  let config;
  try { config = extractConfig(html); } catch (error) { failures.push(`${slug}: ${error.message}`); continue; }

  const expectedQuestions = slug === 'mbti-test' ? 20 : 12;
  if (config.questions.length !== expectedQuestions) failures.push(`${slug}: 질문 ${config.questions.length}개 (기대 ${expectedQuestions}개)`);
  if (Object.keys(config.results).length !== (slug === 'mbti-test' ? 16 : 4)) failures.push(`${slug}: 결과 유형 개수 오류`);
  if (config.related.length < 3 || config.related.length > 5) failures.push(`${slug}: 관련 도구 3~5개 아님`);
  if (slug === 'mbti-test') {
    const counts = Object.fromEntries('EISNTFJP'.split('').map((key) => [key, 0]));
    config.questions.forEach((question) => question.options.forEach((option) => {
      Object.keys(option.scores).forEach((key) => { counts[key] = (counts[key] || 0) + 1; });
    }));
    Object.entries(counts).forEach(([key, count]) => {
      if (count !== 5) failures.push(`${slug}: ${key} 문항 ${count}개 (기대 5개)`);
    });
    if (Object.keys(config.tieBreakers || {}).length !== 4) failures.push(`${slug}: 동점 보정 질문 4개 아님`);
  } else if (config.questions.some((question) => question.options.length !== 4)) {
    failures.push(`${slug}: 모든 질문이 4개 선택지를 갖지 않음`);
  }
  if (matchCount(html, /<h1[ >]/g) !== 1) failures.push(`${slug}: h1 개수 오류`);
  if (!/<title>[^<]+<\/title>/.test(html)) failures.push(`${slug}: title 누락`);
  if (!/<meta name="description" content="[^"]+">/.test(html)) failures.push(`${slug}: description 누락`);
  if (!html.includes(`<link rel="canonical" href="https://readytools.kr/${slug}/">`)) failures.push(`${slug}: canonical 오류`);
  if (!html.includes('property="og:title"') || !html.includes('name="twitter:card"')) failures.push(`${slug}: 공유 메타태그 누락`);
  if (matchCount(html, /<details>/g) < 5) failures.push(`${slug}: FAQ 5개 미만`);
  if (!html.includes('FAQPage') || !html.includes('WebApplication') || !html.includes('BreadcrumbList')) failures.push(`${slug}: 구조화 데이터 누락`);
  for (const match of html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
    try { JSON.parse(match[1]); } catch { failures.push(`${slug}: JSON-LD 문법 오류`); }
  }
  if (!html.includes('data-test-previous') || !html.includes('data-test-live')) failures.push(`${slug}: 이전/aria-live UI 누락`);
  if (html.includes('localStorage') || html.includes('URLSearchParams')) failures.push(`${slug}: 답변 저장 또는 query string 사용 흔적`);
  if (!sitemap.includes(`https://readytools.kr/${slug}/`)) failures.push(`${slug}: sitemap 누락`);
  if (!redirects.includes(`/${slug}/ /calculator/${slug}/ 200`)) failures.push(`${slug}: redirect 누락`);
  for (const [key, result] of Object.entries(config.results)) {
    if (result.description.length < 300) failures.push(`${slug}/${key}: 결과 설명 ${result.description.length}자 (300자 미만)`);
    if ((result.features || []).length < 4 || (result.features || []).length > 6) failures.push(`${slug}/${key}: 특징 4~6개 아님`);
    for (const property of ['strengths','cautions','fit','actions']) {
      if (!result[property]?.length) failures.push(`${slug}/${key}: ${property} 누락`);
    }
    if (slug === 'hobby-test' && result.hobbies?.length !== 6) failures.push(`${slug}/${key}: 취미 추천 6개 아님`);
    if (slug === 'ai-style-test' && result.prompts?.length < 3) failures.push(`${slug}/${key}: 프롬프트 예시 3개 미만`);
  }
  for (const [href] of config.related) {
    const target = href.split('/').filter(Boolean).join('/');
    const targetExists = await exists(resolve(root, target, 'index.html')) || await exists(resolve(root, 'calculator', target, 'index.html'));
    if (!targetExists) failures.push(`${slug}: 존재하지 않는 관련 링크 ${href}`);
  }
}

const hub = await readFile(resolve(root, 'calculator/tests/index.html'), 'utf8');
if (matchCount(hub, /class="test-hub-card"/g) !== 6) failures.push('tests: 카드 6개 아님');
if (!sitemap.includes('https://readytools.kr/tests/')) failures.push('tests: sitemap 누락');
if (!redirects.includes('/tests/ /calculator/tests/ 200')) failures.push('tests: redirect 누락');
if (!main.includes('data-category-filter="test"')) failures.push('메인: 테스트 카테고리 누락');
if (matchCount(main, /data-category="[^"]*test/g) < 4) failures.push('메인: 테스트 대표 카드 4개 미만');
if (!runtime.includes('navigator.share') || !runtime.includes('navigator.clipboard')) failures.push('공통 JS: 공유/복사 기능 누락');
if (!runtime.includes('tieDimensions') || !runtime.includes('renderTieQuestion')) failures.push('공통 JS: MBTI 동점 질문 처리 누락');
if (runtime.includes('localStorage') || runtime.includes('URLSearchParams')) failures.push('공통 JS: 저장/query string 사용 흔적');

for (const asset of ['assets/personality-tests.css','assets/personality-tests.js']) {
  try { await access(resolve(root, asset)); } catch { failures.push(`${asset}: 파일 누락`); }
}

if (failures.length) {
  console.error(`테스트 콘텐츠 점검 실패 (${failures.length}건)`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log('테스트 콘텐츠 점검 통과: 6개 테스트, 허브, SEO, 공유, 개인정보 조건을 확인했습니다.');
}
