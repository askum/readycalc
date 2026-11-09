import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { curatedTools } from './curated-tools.mjs';

const root = resolve(import.meta.dirname, '..');
const escape = (value) => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const card = (tool, latest = false) => `<a class="tool-card${latest ? ' latest-card' : ''}"${latest ? '' : ` data-tool-card data-category="${tool.category}" data-search="${escape(tool.search)}"`} href="/${tool.slug}/">${latest ? '<span class="new-badge">NEW</span>' : ''}<span class="tool-icon" aria-hidden="true">${tool.icon}</span><h${latest ? 3 : 2}>${escape(tool.title)}</h${latest ? 3 : 2}><p>${escape(tool.summary)}</p></a>`;

const homeFile = resolve(root, 'index.html');
let home = await readFile(homeFile, 'utf8');
home = home.replace(/\d+ useful tools/i, '20 useful tools');
home = home.replace(/<meta name="description" content="[^"]+">/, '<meta name="description" content="부동산·대출·전기요금·여행비부터 모임 음식량, 견적서와 QR 생성까지 반복해서 쓰는 20개 생활 도구를 제공합니다. 계산 기준·예시·주의사항을 함께 확인하세요.">');
home = home.replace(/(<meta property="og:title"[^>]+><meta property="og:description" content=")[^"]+("[^>]+>)/, '$1생활비·여행·금융·업무에 바로 쓰는 20개 생활 도구.$2');
home = home.replace(/(<meta name="twitter:title"[^>]+><meta name="twitter:description" content=")[^"]+("[^>]+>)/, '$1생활비·여행·금융·업무에 바로 쓰는 20개 생활 도구.$2');
const newest = curatedTools.filter(({ slug }) => ['loan-calculator','compound-interest-calculator','inflation-calculator','invoice-generator','qr-code-generator'].includes(slug));
home = home.replace(/<div class="tools-grid latest-grid">[\s\S]*?<\/div><\/div><\/section>/, `<div class="tools-grid latest-grid">${newest.map((tool) => card(tool, true)).join('')}</div></div></section>`);
const tabs = '<div class="category-tabs" role="group" aria-label="도구 카테고리"><button type="button" data-category-filter="all" aria-controls="calculator-grid" aria-pressed="true">전체</button><button type="button" data-category-filter="food" aria-controls="calculator-grid" aria-pressed="false">🍽️ 식사</button><button type="button" data-category-filter="travel" aria-controls="calculator-grid" aria-pressed="false">🚗 여행</button><button type="button" data-category-filter="money" aria-controls="calculator-grid" aria-pressed="false">💰 돈</button><button type="button" data-category-filter="home" aria-controls="calculator-grid" aria-pressed="false">🏠 생활</button><button type="button" data-category-filter="tools" aria-controls="calculator-grid" aria-pressed="false">🛠️ 도구</button></div>';
home = home.replace(/<div class="category-tabs"[\s\S]*?<\/div>\s*<p class="filter-status"/, `${tabs}<p class="filter-status"`);
home = home.replace(/<div class="tools-grid" id="calculator-grid">[\s\S]*?<\/div>\s*<div class="no-results"/, `<div class="tools-grid" id="calculator-grid">${curatedTools.map((tool) => card(tool)).join('')}</div>\n    <div class="no-results"`);
home = home.replace(/<article class="content-copy"><h2>생활계산소에서 할 수 있는 일<\/h2>[\s\S]*?<\/article>/, `<article class="content-copy"><h2>생활계산소에서 할 수 있는 일</h2><p>생활계산소는 집 계약 전 세금과 중개보수, 대출 상환금·복리·물가에 따른 구매력을 비교하고, 전기 사용량과 여행 예산·주유비·경비 정산, 날짜와 생활 단위를 확인할 수 있는 무료 도구 모음입니다. 계산 결과만 제시하지 않고 각 페이지에서 적용한 공식, 입력 단위, 가상 사례와 결과가 달라질 수 있는 조건을 함께 설명합니다.</p><p>여행 짐 목록, 택배·이사 박스 수량, 치킨·고기·캠핑 음식과 행사 음료처럼 준비 과정에서 반복되는 질문도 계산 가능한 형태로 정리했습니다. 견적서·청구서와 QR 코드는 입력 정보를 서버로 보내지 않고 현재 브라우저에서 생성합니다. 일부 체크 상태만 사용자 편의를 위해 현재 기기의 localStorage에 저장합니다.</p><p>세금·금리·요금·배송비 등은 기준일과 실제 계약 조건에 따라 달라질 수 있습니다. 각 도구의 마지막 검토일과 주의사항을 확인하고, 중요한 결정을 내리기 전에는 관계 기관·금융기관·서비스 제공자의 최신 안내와 실제 견적을 다시 확인하세요. 광고는 계산 결과와 분리하며 광고 여부가 공식이나 추천 수량에 영향을 주지 않습니다.</p></article>`);
home = home.replace(/<div class="content-grid three"><article class="info-card"><h3><a href="\/magazine\/[\s\S]*?<\/div><p><a class="text-link"/, '<div class="content-grid three"><article class="info-card"><h3><a href="/magazine/electricity-usage-before-bill/">가전 전력량을 고지서와 비교하는 법</a></h3><p>소비전력·사용시간·가동률을 구분해 월 사용량을 점검합니다.</p></article><article class="info-card"><h3><a href="/magazine/packing-list-before-departure/">출발 전 짐을 줄이는 확인 순서</a></h3><p>필수품과 개인 준비물, 항공 반입 규정을 나누어 확인합니다.</p></article><article class="info-card"><h3><a href="/magazine/group-food-order-planning/">모임 음식 주문량 정하는 법</a></h3><p>인원뿐 아니라 식사 상황과 다른 메뉴를 함께 반영합니다.</p></article></div><p><a class="text-link"');
await writeFile(homeFile, home);

const aboutFile = resolve(root, 'about/index.html');
let about = await readFile(aboutFile, 'utf8');
about = about.replace(/<meta name="description" content="[^"]+">/, '<meta name="description" content="한국 사용자의 생활비·여행·금융·업무 준비를 돕는 생활계산소의 제작 목적, 계산 기준과 20개 공개 도구의 운영 원칙을 소개합니다.">');
about = about.replace(/<section><h2>다양한 생활 도구를 한곳에서<\/h2>[\s\S]*?<\/section>/, '<section><h2>다양한 생활 도구를 한곳에서</h2><p>현재는 부동산 세금·중개보수, 대출·복리·물가, 전기 사용량, 여행비와 날짜·단위 변환처럼 반복해서 확인하는 계산을 중심으로 20개 도구를 공개합니다. 여행 짐과 포장 박스, 모임 음식·음료, 견적서와 QR 생성처럼 준비 과정에서 필요한 작업도 함께 다룹니다.</p><p>도구 수를 늘리는 것보다 실제 기능이 정상 작동하고 계산 기준과 한계를 설명할 수 있는지를 우선합니다. 회원가입이나 별도 프로그램 설치 없이 휴대전화와 컴퓨터의 브라우저에서 이용할 수 있습니다.</p></section>');
about = about.replace(/현재 제공하는 \d+개 도구/, '현재 제공하는 20개 도구');
about = about.replace(/<h2>도구 둘러보기<\/h2>[\s\S]*?<div class="button-row">/, `<h2>도구 둘러보기</h2><p>현재 공개한 20개 도구는 계산·준비 과정에서 반복적으로 사용할 수 있는 항목을 중심으로 검토했습니다.</p><ul>${curatedTools.map((tool) => `<li><a href="/${tool.slug}/">${escape(tool.title)}</a> — ${escape(tool.summary)}</li>`).join('')}</ul><div class="button-row">`);
await writeFile(aboutFile, about);

const seo = Object.fromEntries(curatedTools.map(({ slug, description }) => [slug, description]));
await writeFile(resolve(root, 'scripts/tool-seo.json'), `${JSON.stringify(seo, null, 2)}\n`);
console.log(`Synced home, about page, and SEO descriptions for ${curatedTools.length} tools.`);
