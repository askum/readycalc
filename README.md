# 생활계산소 ReadyTools

한국 사용자를 위한 서버리스 생활 계산기 사이트입니다. 순수 HTML, CSS, JavaScript로 구성되며 계산과 입력 검증은 사용자의 브라우저에서 처리됩니다. 서버·데이터베이스·외부 계산 API를 사용하지 않고 Cloudflare Pages에 정적 배포합니다.

## 2026-11-09 콘텐츠 큐레이션

AdSense 승인을 위해 페이지 수만 늘리는 방식이 아니라, 반복해서 사용할 이유가 분명하고 결과를 사용자가 검증할 수 있는 20개 도구만 공개합니다. 각 공개 도구에는 계산 원리, 입력 기준, 실제 예시 3개 이상, FAQ 5개 이상, 주의사항과 관련 글을 제공합니다.

### 현재 공개 도구 20개

- 부동산 취득세 계산기
- 부동산 중개보수 계산기
- 여행 예산 계산기
- 날짜 계산기
- 여행 경비 분배 계산기
- 가전제품 전기요금 계산기
- 단위 변환기
- 여행 주유비 계산기
- 여행 짐 체크리스트
- 택배 박스 크기·예상 운임 계산기
- 이사 박스 수 계산기
- 치킨 주문량 계산기
- 인원별 고기량 계산기
- 캠핑 음식량 계산기
- 행사 음료·얼음 계산기
- 대출 이자·월 상환금 계산기
- 월 적립식 복리 계산기
- 물가상승률·화폐가치 계산기
- 견적서·청구서 생성기
- QR 코드 생성기

현재 선정 기준을 충족하지 않은 나머지 51개 페이지는 공개 경로에서 제외했습니다. 원본은 삭제하지 않고 `content/withdrawn-calculators/`에 `noindex` 보관하여 필요할 때 다시 검토할 수 있습니다. `_worker.js`는 비공개 도구 경로를 404와 `X-Robots-Tag: noindex`로 처리합니다.

## 매거진

`/magazine/`에는 현재 공개 도구와 직접 연결되는 21개 글만 표시합니다. 전기 사용량, 단위 변환, 주유비, 여행·포장·모임 준비와 함께 대출 상환, 복리 시나리오, 물가와 구매력, 견적서 점검, QR 안전 안내를 다룹니다. 글마다 실제 판단 기준, 계산 결과의 한계, FAQ와 관련 도구 링크를 제공합니다.

원본 데이터는 다음 파일에서 관리합니다.

- `content/magazine*.json`: 기존 매거진 원본
- `content/magazine-curated-a.json`, `content/magazine-curated-b.json`: 실용 콘텐츠 10편
- `content/magazine-added-20261109.json`: 신규 금융·업무 도구 연결 글 4편
- `scripts/magazine-data.mjs`: 공개 도구와 연결되는 글만 선택
- `scripts/generate-magazine.mjs`: 목록·상세 HTML 생성 및 더 이상 공개하지 않는 생성 디렉터리 정리

## 검색 노출과 공개 경로 관리

- 기본 사이트 URL: `https://readytools.kr`
- 공개 도구 목록: `scripts/search-visibility.json`
- 도구 메타데이터: `scripts/curated-tools.mjs`, `scripts/tool-seo.json`
- 사이트맵: `sitemap.xml` — 공개 URL 49개
- 크롤러 설정: `robots.txt`
- Cloudflare 공개 경로: `_worker.js`
- 계산기 공개 URL rewrite: `_redirects`
- OG 이미지: `assets/og/` — 페이지별 1200×630 PNG

각 공개 페이지에는 고유한 title과 description, canonical, Open Graph, Twitter Card, BreadcrumbList가 있습니다. 계산기 페이지에는 WebApplication 구조화 데이터를 함께 제공합니다. 허위 리뷰나 평점 정보는 사용하지 않습니다.

큐레이션 결과를 다시 생성할 때에는 다음 순서로 실행합니다.

```bash
node scripts/update-curation.mjs
node scripts/sync-curated-tools.mjs
node scripts/sync-curated-navigation.mjs
node scripts/sync-tool-seo.mjs
node scripts/enrich-curated-magazine.mjs
node scripts/generate-magazine.mjs
node scripts/apply-search-visibility.mjs
node scripts/sync-curated-sitemap.mjs
node scripts/sync-public-worker.mjs
node scripts/sync-calculator-redirects.mjs
NODE_PATH=/Users/askum/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules node scripts/generate-social-meta.cjs
```

개인 도메인을 변경할 때에는 `assets/site-config.js`의 `baseUrl`을 바꾸고 `node scripts/sync-site-url.mjs`를 실행한 뒤 canonical, `og:url`, 구조화 데이터, `sitemap.xml`, `robots.txt`를 다시 점검합니다.

## 개인정보와 브라우저 저장소

- 계산 입력값은 서버나 데이터베이스로 전송하거나 저장하지 않습니다.
- 모든 계산은 현재 브라우저에서 실행됩니다.
- localStorage는 화면 설정, 일부 도구의 입력 복원과 체크리스트 진행 상태 등 사용자 편의를 위해서만 사용합니다.
- 여행 경비 분배 계산기는 참가자 이름과 결제금액을 URL query string에 넣지 않습니다.
- 현재 별도의 방문자 분석 도구는 적용하지 않았습니다.
- 공개 페이지에는 현재 쿠팡파트너스 제휴 영역이나 sponsored 링크를 표시하지 않습니다.
- 운영자: Askumi / 문의: `hnmshop55@gmail.com`

## Google AdSense 연결

- 게시자 ID: `ca-pub-4297698834736188`
- `assets/head.js`: 모든 공개 페이지에 계정 메타태그와 AdSense 로더를 추가하는 공통 진입점
- `ads.txt`: `google.com, pub-4297698834736188, DIRECT, f08c47fec0942fa0`
- `assets/site-config.js`: 승인 전 빈 광고 영역을 숨기기 위해 `showAdSlots: false` 유지
- `.ad-slot`: 승인 후 수동 광고를 배치할 수 있는 예약 위치

코드 연결, 콘텐츠 분량과 탐색 구조는 자동 검사하지만 AdSense 승인은 Google의 별도 심사 결과이며 보장할 수 없습니다. 승인 후 실제 광고 단위를 연결할 때만 `showAdSlots`를 변경합니다.

## 로컬 테스트

Cloudflare rewrite와 공개 경로 제한을 반영하는 미리보기 서버를 실행합니다.

```bash
node scripts/dev-server.mjs 8001
```

브라우저에서 `http://127.0.0.1:8001/` 또는 `http://127.0.0.1:8001/magazine/`을 확인합니다. 단순 `python3 -m http.server`는 `_redirects`와 `_worker.js` 정책을 재현하지 않습니다.

최종 정적 검사는 다음 명령으로 실행합니다.

```bash
node scripts/audit-example-calculations.mjs
node scripts/audit-curated-release.mjs
node scripts/audit-search-visibility.mjs
node scripts/audit-withdrawn-tools.mjs
node scripts/audit-withdrawn-results.mjs
node scripts/audit-magazine.mjs
node scripts/audit-content-examples.mjs
node scripts/audit-acquisition-tax-calculator.mjs
node scripts/audit-brokerage-calculator.mjs
```

검사 범위에는 계산 예시, 입력 label과 aria-live, 고유 메타데이터, canonical·OG·Twitter, JSON-LD 문법, 관련 도구 링크, 로컬 정적 자산, AdSense 연결값, ads.txt, sitemap, robots.txt, 공개 allowlist와 비공개 경로 차단이 포함됩니다.

## Cloudflare Pages 재배포

Cloudflare Pages 프로젝트 `readycalc`은 GitHub 저장소 `askum/readycalc`의 `main` 브랜치와 연결되어 있습니다. 최종 검사를 통과한 변경을 커밋하고 `main`에 푸시하면 자동 배포됩니다.

```bash
git add --all
git commit -m "Curate high-value ReadyTools content"
git push origin main
```

배포 후에는 `https://readytools.kr/`, `https://readytools.kr/sitemap.xml`, `https://readytools.kr/robots.txt`, `https://readytools.kr/ads.txt`와 대표 계산기 결과를 다시 확인합니다.
