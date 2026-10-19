import { writeFile, mkdir, access } from 'node:fs/promises';
import { resolve } from 'node:path';
import { visibility } from './search-visibility.mjs';
import { loadMagazineArticles } from './magazine-data.mjs';

const root = resolve(import.meta.dirname, '..');
const baseUrl = 'https://readytools.kr';
const magazineRoot = resolve(root, 'magazine');
const articles = await loadMagazineArticles();
const escape = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const dateLabel = (value) => new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(`${value}T00:00:00+09:00`));
const jsonLd = (data) => JSON.stringify(data).replaceAll('<', '\\u003c');

function head({ title, description, url, image, schema, type = 'article' }) {
  return `<head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escape(title)} | 생활계산소</title>
  <meta name="description" content="${escape(description)}">
  <link rel="canonical" href="${url}">
  <meta property="og:type" content="${type}"><meta property="og:locale" content="ko_KR"><meta property="og:site_name" content="생활계산소">
  <meta property="og:title" content="${escape(title)}"><meta property="og:description" content="${escape(description)}"><meta property="og:url" content="${url}"><meta property="og:image" content="${baseUrl}${image}">
  <meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escape(title)}"><meta name="twitter:description" content="${escape(description)}"><meta name="twitter:image" content="${baseUrl}${image}">
  <link rel="stylesheet" href="/assets/styles.css?v=magazine-list-20261019">
  <script src="/assets/site-config.js"></script><script src="/assets/head.js"></script><script src="/assets/site.js?v=magazine-20261019" defer></script>
  <script type="application/ld+json">${jsonLd(schema)}</script>
</head>`;
}

function card(article) {
  const href = `/magazine/${article.slug}/`;
  return `<article class="magazine-card"><a class="magazine-card-image" href="${href}" aria-label="${escape(article.title)} 글 읽기"><img src="${article.thumbnail}" alt="${escape(article.title)} 대표 이미지" width="1200" height="630" loading="lazy" decoding="async"></a><div class="magazine-card-body"><p class="magazine-category">${escape(article.category)}</p><h2><a href="${href}">${escape(article.title)}</a></h2><p>${escape(article.summary)}</p><time datetime="${article.date}">${dateLabel(article.date)}</time></div></article>`;
}

function section(block) {
  const paragraphs = block.paragraphs.map((text) => `<p>${escape(text)}</p>`).join('');
  const list = block.list?.length ? `<ul class="magazine-points">${block.list.map(({ title, text }) => `<li><h3>${escape(title)}</h3><p>${escape(text)}</p></li>`).join('')}</ul>` : '';
  return `<section><h2>${escape(block.heading)}</h2>${paragraphs}${list}</section>`;
}

function detail(article) {
  const url = `${baseUrl}/magazine/${article.slug}/`;
  const schema = { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: article.title, description: article.summary, image: `${baseUrl}${article.thumbnail}`, datePublished: article.date, dateModified: article.date, author: { '@type': 'Organization', name: '생활계산소', url: `${baseUrl}/about/` }, publisher: { '@type': 'Organization', name: '생활계산소', url: `${baseUrl}/` }, mainEntityOfPage: url, inLanguage: 'ko-KR' };
  const sources = article.sources?.length ? `<section class="magazine-sources"><h2>참고 자료</h2><ul>${article.sources.map(({ label, url }) => `<li><a href="${escape(url)}" target="_blank" rel="noopener noreferrer">${escape(label)}</a></li>`).join('')}</ul></section>` : '';
  const faq = article.faq?.length ? `<section class="magazine-faq"><h2>자주 묻는 질문</h2>${article.faq.map(({ question, answer }) => `<details><summary>${escape(question)}</summary><p>${escape(answer)}</p></details>`).join('')}</section>` : '';
  const related = [...articles].filter((candidate) => candidate.slug !== article.slug).sort((a, b) => Number(b.category === article.category) - Number(a.category === article.category)).slice(0, 3);
  const relatedMarkup = `<section class="magazine-related" aria-labelledby="related-magazine-title"><h2 id="related-magazine-title">함께 읽으면 좋은 글</h2><ul>${related.map((candidate) => `<li><a href="/magazine/${candidate.slug}/">${escape(candidate.title)}</a></li>`).join('')}</ul></section>`;
  return `<!doctype html><html lang="ko">${head({ title: article.title, description: article.summary, url, image: article.thumbnail, schema })}<body><div data-site-header></div><main id="main"><div class="container magazine-shell"><nav class="breadcrumb" aria-label="현재 위치"><ol><li><a href="/">생활계산소</a></li><li><a href="/magazine/">매거진</a></li><li aria-current="page">${escape(article.title)}</li></ol></nav><header class="magazine-article-header"><p class="eyebrow">${escape(article.category)}</p><h1>${escape(article.title)}</h1><p class="magazine-deck">${escape(article.summary)}</p><p class="magazine-byline">생활계산소 · <time datetime="${article.date}">${dateLabel(article.date)}</time></p></header><article class="magazine-article"><figure class="magazine-cover"><img src="${article.thumbnail}" alt="${escape(article.title)} 대표 이미지" width="1200" height="630"></figure>${article.sections.map(section).join('')}${faq}${sources}<aside class="magazine-tool-cta"><h2>관련 계산기 도구로 이동하기</h2><p>글에서 살펴본 조건을 자신의 상황에 맞는 숫자로 직접 확인해 보세요.</p><a class="button button-primary" href="${article.tool.href}">${escape(article.tool.label)}</a></aside></article>${relatedMarkup}<nav class="magazine-back"><a href="/magazine/">← 매거진 목록으로 돌아가기</a></nav></div></main><div data-site-footer></div></body></html>`;
}

if (!Array.isArray(articles) || articles.length === 0) throw new Error('매거진 글이 없습니다.');
const seen = new Set();
for (const article of articles) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(article.slug) || seen.has(article.slug)) throw new Error(`잘못된 글 주소: ${article.slug}`);
  seen.add(article.slug);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(article.date) || !article.title || !article.summary || article.sections.length < 2 || (article.faq && article.faq.length < 3)) throw new Error(`글 데이터가 불완전합니다: ${article.slug}`);
  if (!visibility.indexable.some((slug) => article.tool.href === `/${slug}/`)) throw new Error(`공개되지 않은 도구 링크: ${article.slug}`);
  await access(resolve(root, article.thumbnail.slice(1)));
}

await mkdir(magazineRoot, { recursive: true });
const latest = [...articles].sort((a, b) => b.date.localeCompare(a.date));
const indexUrl = `${baseUrl}/magazine/`;
const indexSchema = { '@context': 'https://schema.org', '@type': 'CollectionPage', name: '생활계산소 매거진', description: '생활 계산과 디지털 도구를 더 잘 쓰기 위한 읽을거리', url: indexUrl, inLanguage: 'ko-KR' };
const index = `<!doctype html><html lang="ko">${head({ title: '매거진', description: '여행 예산, 사진 용량과 계정 보안처럼 생활 도구를 더 잘 쓰기 위한 설명을 읽어보세요.', url: indexUrl, image: '/assets/og/home.png', schema: indexSchema, type: 'website' })}<body><div data-site-header></div><main id="main"><div class="container magazine-shell"><nav class="breadcrumb" aria-label="현재 위치"><ol><li><a href="/">생활계산소</a></li><li aria-current="page">매거진</li></ol></nav><header class="magazine-index-header"><p class="eyebrow">ReadyTools Magazine</p><h1>생활계산소 매거진</h1><p>계산기를 사용하기 전에 알아두면 좋은 기준과 실제 활용 방법을 차근차근 설명합니다.</p></header><section aria-labelledby="magazine-latest-title"><div class="section-heading"><h2 id="magazine-latest-title">최근 글</h2><p>도구가 계산한 숫자를 이해하고 스스로 판단할 때 참고할 수 있는 글입니다.</p></div><div class="magazine-grid">${latest.map(card).join('')}</div></section></div></main><div data-site-footer></div></body></html>`;
await writeFile(resolve(magazineRoot, 'index.html'), index);
for (const article of articles) {
  const directory = resolve(magazineRoot, article.slug);
  await mkdir(directory, { recursive: true });
  await writeFile(resolve(directory, 'index.html'), detail(article));
}
console.log(`매거진 목록과 상세 글 ${articles.length}개를 생성했습니다.`);
