# 생활계산소

한국 사용자를 위한 서버리스 정적 생활 계산기 사이트입니다. 순수 HTML, CSS, JavaScript만 사용하며 모든 계산은 사용자의 브라우저에서 실행됩니다. 서버, 데이터베이스 및 외부 API를 사용하지 않습니다.

## 공개 페이지

- 메인 페이지
- 인원별 고기량 계산기
- 여행 주유비 계산기
- 캠핑 음식량 계산기
- 행사 음료 및 얼음 수량 계산기
- 이사 박스 수 계산기
- 여행 경비 분배 계산기
- 랜덤 팀 배정기
- 사이트 소개
- 문의하기
- 개인정보처리방침
- 이용약관
- 면책조항

## 이번 개선에서 수정된 파일

- `assets/site-config.js`: 사이트 기본 URL과 공통 검토일 설정
- `assets/site.js`: 공통 푸터, 계산기 안내, BreadcrumbList 구조화 데이터
- `assets/calculators.js`: 빈 값 검증, 오류 안내, 여행 경비 결과 복사 및 URL 개인정보 보호
- `assets/styles.css`: 모바일 터치 영역, 긴 결과, 카드·표·버튼 반응형 처리
- `_headers`: 파일명 고정 CSS·JavaScript가 이전 버전으로 남지 않도록 재검증 캐시 정책 적용
- `privacy/index.html`: 개인정보처리방침 상세 고지
- `contact/index.html`: 확정되지 않은 운영자 이메일 제거
- `travel-expense-splitter/index.html`: 공유 URL 버튼 제거 및 안내 수정
- `calculator/`: 7개 계산기 페이지를 한 폴더 아래에 모아 관리
- `_redirects`: 계산기 소스 위치를 옮겨도 기존 공개 URL이 유지되도록 Cloudflare Pages 내부 rewrite 적용
- 메인·소개·약관·면책조항·404 HTML: 공통 설정 로드와 정적 자산 버전 정리
- `scripts/sync-site-url.mjs`: 기본 URL을 SEO 메타와 검색엔진 파일에 동기화
- `README.md`: 운영 및 재배포 안내 갱신

## 새로 생성한 페이지

새로 생성한 공개 페이지는 없습니다. 사이트 소개, 문의하기, 개인정보처리방침, 이용약관, 면책조항 페이지가 이미 존재하여 기존 URL과 디자인을 유지하면서 필요한 내용만 보완했습니다.

## 운영자가 직접 입력해야 할 항목

`privacy/index.html`과 `contact/index.html`에서 다음 `[운영자 입력 필요]` 항목을 실제 정보가 확정된 후 변경해야 합니다.

- 운영자 이름
- 문의 이메일 주소
- 대표 개인 도메인

개인정보처리방침의 시행일과 마지막 수정일은 현재 `2026년 8월 6일`로 표시되어 있습니다. 실제 공개 정책이 변경될 때 날짜도 함께 갱신하세요.

## 사이트 기본 URL 관리

현재 기본 URL은 `https://readycalc.pages.dev`입니다. 원본 설정은 `assets/site-config.js` 한 곳에서 관리합니다.

개인 도메인을 연결한 뒤 다음 순서로 변경합니다.

1. `assets/site-config.js`의 `baseUrl`을 새 `https://` 주소로 변경합니다.
2. 프로젝트 루트에서 아래 명령을 실행합니다.

```bash
node scripts/sync-site-url.mjs
```

이 명령은 각 공개 페이지의 canonical URL, `og:url`, Open Graph 이미지 주소, WebApplication/WebSite 구조화 데이터 URL, `sitemap.xml` 및 `robots.txt`의 Sitemap 주소를 정적으로 갱신합니다. 생성 결과를 확인한 뒤 커밋하여 배포하세요.

## 개인정보와 브라우저 저장소

- 계산 입력값은 서버나 localStorage에 저장하지 않습니다.
- 모든 계산은 현재 브라우저에서 처리됩니다.
- localStorage는 밝은 화면·어두운 화면 설정 저장에만 사용합니다.
- 여행 경비 분배 계산기는 참가자 이름과 결제금액을 URL에 포함하지 않습니다.
- 현재 별도의 방문자 분석 스크립트와 Google AdSense 코드는 적용되어 있지 않습니다.

## Google AdSense 삽입 위치

공통 head 진입점은 `assets/head.js`입니다. 승인 후 제공되는 AdSense 스크립트를 이 파일에서 동적으로 생성하여 `<head>`에 추가하면 모든 페이지에 적용됩니다.

각 계산기 아래의 `.ad-slot`에는 최소 높이가 설정되어 있어 광고가 로드될 때 레이아웃 이동을 줄입니다. AdSense 적용 시 `privacy/index.html`의 광고 쿠키, 맞춤형 광고 거부 및 실제 광고 제공자 정보를 최종 정책에 맞게 다시 확인하세요.

## 로컬 테스트 방법

Cloudflare Pages의 `_redirects` rewrite까지 포함해 기존 공개 URL을 테스트하려면 Wrangler 개발 서버를 사용합니다.

```bash
npx wrangler pages dev . --port 8787
```

브라우저에서 `http://localhost:8787/meat-calculator/`처럼 기존 공개 URL을 엽니다. 단순 정적 파일 확인만 필요하면 `python3 -m http.server 8080`을 실행하고 `/calculator/meat-calculator/` 같은 실제 폴더 경로로 접근할 수 있습니다.

기본 정적 검사는 다음과 같이 실행할 수 있습니다.

```bash
node --check assets/site.js
node --check assets/calculators.js
node --check assets/site-config.js
node --check scripts/sync-site-url.mjs
node scripts/sync-site-url.mjs
```

## Cloudflare Pages 재배포

Cloudflare Pages 프로젝트 `readycalc`은 GitHub 저장소 `askum/readycalc`의 `main` 브랜치와 연결되어 있습니다. 변경사항을 커밋하고 `main`에 푸시하면 자동으로 재배포됩니다.

```bash
git add --all
git commit -m "Organize calculator pages"
git push origin main
```

현재 배포 설정은 다음과 같습니다.

- Framework preset: `None`
- Production branch: `main`
- Build command: 없음
- Build output directory: 저장소 루트

Wrangler로 직접 배포해야 할 경우 다음 명령을 사용할 수 있습니다.

```bash
npx wrangler pages deploy . --project-name readycalc
```

## 주요 구조

```text
assets/
  calculators.js     계산, 검증, 결과 복사 로직
  head.js            광고 등 공통 head 코드 진입점
  site-config.js     기본 URL과 공통 검토일
  site.js            공통 메뉴, 푸터, 접근성, 구조화 데이터
  styles.css         모바일 우선 공통 스타일
scripts/
  sync-site-url.mjs  SEO URL 동기화 도구
calculator/
  meat-calculator/index.html
  fuel-cost-calculator/index.html
  camping-food-calculator/index.html
  event-drink-calculator/index.html
  moving-box-calculator/index.html
  travel-expense-splitter/index.html
  random-team-generator/index.html
about/ contact/ privacy/ terms/ disclaimer/
_headers
_redirects
robots.txt
sitemap.xml
```

계산기 HTML의 실제 위치는 `calculator/` 아래이지만 공개 URL은 기존과 동일합니다. 예를 들어 `calculator/meat-calculator/index.html`은 Cloudflare Pages에서 `/meat-calculator/`로 제공됩니다. 새 계산기를 추가할 때는 `calculator/`에 페이지를 만든 뒤 `_redirects`, 메인 목록, `sitemap.xml`, `scripts/sync-site-url.mjs`의 경로 목록을 함께 갱신하세요.
