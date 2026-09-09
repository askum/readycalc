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
- 치킨 몇 마리 계산기
- 회식 술 계산기
- 피자 몇 판 계산기
- 여행 짐 체크리스트
- 환전 계산기
- 여행 예산 계산기
- 해외여행 경비 계산기
- 단위 변환기
- 날짜 계산기
- QR 코드 생성기
- 비밀번호 생성기
- 텍스트 도구
- 이미지 크기 변경·압축·형식 변환 도구
- JSON·Base64·URL 개발자 도구
- HEX·RGB 변환·색상 선택기
- 전기요금 계산기
- 택배 박스 크기 추천 계산기
- 돌잔치 음식량 계산기
- 케이크 호수 계산기
- 구독 서비스 N빵 계산기
- 전기차 EV vs 내연기관 유지비 비교 계산기
- 반려동물 수제 간식 건조 수율 계산기
- 해외직구 면세 한도·관부가세 계산기
- 사이트 소개
- 계산 기준과 편집 원칙
- 문의하기
- 개인정보처리방침
- 이용약관
- 면책조항

## 이번 개선에서 수정된 파일

- `assets/site-config.js`: 사이트 기본 URL과 공통 검토일 설정
- `assets/site.js`: 공통 푸터, 계산기 안내, BreadcrumbList 구조화 데이터
- `assets/calculators.js`: 빈 값 검증, 오류 안내, 여행 경비 결과 복사 및 URL 개인정보 보호
- `assets/utilities.js`: 단위·날짜·QR·비밀번호·텍스트 도구의 로컬 처리, 검증, 복사와 공유
- `assets/image-tools.js`: 이미지 크기 변경, JPG·PNG·WebP 변환·압축, 회전·뒤집기와 다운로드
- `assets/developer-tools.js`: JSON 정리·압축, UTF-8 Base64와 URL 인코딩·디코딩
- `assets/color-tools.js`: HEX·RGB 양방향 변환, 색상 선택, HSL과 글자 대비 계산
- `assets/home.js`: 메인 카테고리 필터, 실시간 검색과 검색 결과 안내
- `index.html`: 인기 TOP 5, 최신 계산기, 8개 카테고리와 30개 계산기·도구 검색 UI
- `assets/styles.css`: 모바일 터치 영역, 긴 결과, 카드·표·버튼 반응형 처리
- `assets/favicon.svg`, `assets/head.js`: 공통 파비콘과 브라우저 테마 색상 적용
- `_headers`: 파일명 고정 CSS·JavaScript가 이전 버전으로 남지 않도록 재검증 캐시 정책 적용
- `privacy/index.html`: 개인정보처리방침 상세 고지
- 쿠팡파트너스 제휴 영역: 관련 계산기 12곳에 상품 카드 2개씩, 공통 수수료 고지와 주의사항 적용
- `contact/index.html`: 확정되지 않은 운영자 이메일 제거
- `travel-expense-splitter/index.html`: 공유 URL 버튼 제거 및 안내 수정
- `calculator/`: 30개 계산기·도구 페이지를 한 폴더 아래에 모아 관리
- `_redirects`: 계산기 소스 위치를 옮겨도 기존 공개 URL이 유지되도록 Cloudflare Pages 내부 rewrite 적용
- 메인·소개·약관·면책조항·404 HTML: 공통 설정 로드와 정적 자산 버전 정리
- `methodology/index.html`: 계산식 선정, 검수, 수정과 운영 책임을 공개하는 편집 원칙
- `scripts/sync-site-url.mjs`: 기본 URL을 SEO 메타와 검색엔진 파일에 동기화
- `README.md`: 운영 및 재배포 안내 갱신

## 새로 생성한 페이지

- `methodology/index.html`: 운영자 정보, 계산 기준 선정 방식, 출시 전 검수와 수정 원칙

- `calculator/chicken-calculator/index.html`: 인원과 식사 상황에 따른 치킨 주문량 계산
- `calculator/company-dinner-drink-calculator/index.html`: 회식 주류·생수·무알코올 음료 준비량 계산
- `calculator/pizza-calculator/index.html`: 인원과 사이드 메뉴에 따른 피자 판 수 계산
- `calculator/travel-packing-checklist/index.html`: 여행 조건별 준비물과 체크 진행률
- `calculator/currency-exchange-calculator/index.html`: 환율 스프레드·우대율·수수료 반영
- `calculator/travel-budget-calculator/index.html`: 총예산·1인당 비용 계산
- `calculator/international-travel-cost-calculator/index.html`: 환율·해외 카드 수수료 포함 경비 계산
- `calculator/unit-converter/index.html`: 길이·무게·넓이·온도 등 생활 단위 변환
- `calculator/date-calculator/index.html`: 날짜 차이와 날짜 더하기·빼기
- `calculator/qr-code-generator/index.html`: 외부 API 없는 QR SVG 생성
- `calculator/password-generator/index.html`: Web Crypto 기반 무작위 비밀번호 생성
- `calculator/text-tools/index.html`: 글자 수 분석과 공백·줄 정리
- `calculator/image-tools/index.html`: 이미지 크기 변경, JPG·PNG·WebP 변환·압축과 회전·뒤집기
- `calculator/developer-tools/index.html`: JSON 정리·압축, Base64 및 URL 인코딩·디코딩
- `calculator/color-tools/index.html`: HEX·RGB 변환, 색상 선택기, HSL과 대비 확인
- `calculator/electricity-cost-calculator/index.html`: 10개 가전의 월 전력사용량과 예상 추가 요금 계산
- `calculator/parcel-box-calculator/index.html`: 물품 크기별 대표 박스 호수급과 우체국 창구 등기소포 예상 요금 계산
- `calculator/first-birthday-food-calculator/index.html`: 돌잔치 성인·어린이 인원별 식사·후식·음료 준비량 계산
- `calculator/cake-size-calculator/index.html`: 인원과 제공 방식에 따른 케이크 호수·지름·조각 수 계산
- `calculator/subscription-split-calculator/index.html`: 공식 공유 조건에 따른 구독료 1인 부담액과 월·연 절약액 계산
- `calculator/ev-vs-ice-cost-calculator/index.html`: 주행거리, 연료·충전비, 세금·보험·정비비와 구매가 차이 비교
- `calculator/pet-treat-dehydration-calculator/index.html`: 생재료의 건조 수율, 예상 완성 중량과 소분 수 계산
- `calculator/overseas-purchase-duty-calculator/index.html`: 발송국·통관 유형·직접 입력 환율에 따른 면세 한도와 참고 관부가세 계산

위 신규 페이지는 각자 고유한 SEO 메타, WebApplication·BreadcrumbList 구조화 데이터, 800자 이상의 계산 설명, 예시 3개 이상, FAQ 5개 이상과 관련 계산기 링크를 포함합니다.

## 운영자 정보

- 운영자 이름: `Askumi`
- 문의 이메일: `hnmshop55@gmail.com`
- 대표 도메인: `https://readytools.kr`

개인정보처리방침의 시행일은 `2026년 8월 6일`, 마지막 수정일은 `2026년 9월 10일`로 표시되어 있습니다. 실제 공개 정책이 변경될 때 날짜도 함께 갱신하세요.

## 사이트 기본 URL 관리

현재 기본 URL은 `https://readytools.kr`입니다. Cloudflare Pages 기본 주소 `https://readycalc.pages.dev`도 계속 사용할 수 있으며, SEO 원본 설정은 `assets/site-config.js` 한 곳에서 관리합니다.

기본 도메인을 변경할 때는 다음 순서로 갱신합니다.

1. `assets/site-config.js`의 `baseUrl`을 새 `https://` 주소로 변경합니다.
2. 프로젝트 루트에서 아래 명령을 실행합니다.

```bash
node scripts/sync-site-url.mjs
```

이 명령은 각 공개 페이지의 canonical URL, `og:url`, Open Graph 이미지 주소, WebApplication/WebSite 구조화 데이터 URL, `sitemap.xml` 및 `robots.txt`의 Sitemap 주소를 정적으로 갱신합니다. 생성 결과를 확인한 뒤 커밋하여 배포하세요.

## 개인정보와 브라우저 저장소

- 계산 입력값은 서버나 데이터베이스에 저장하지 않습니다.
- 모든 계산은 현재 브라우저에서 처리됩니다.
- localStorage는 화면 설정과 치킨·회식 술·피자, 여행 도구, 택배 박스·돌잔치 음식·케이크 및 구독·차량·건조 수율·해외직구 계산기의 입력값·체크 상태 자동 복원에 사용합니다.
- 새 유틸리티는 선택 단위와 작업 방식 같은 설정만 저장하며 변환 숫자, 날짜, QR 내용, 비밀번호, 원본 텍스트와 이미지 파일은 저장하지 않습니다.
- 새 계산기의 ‘입력 초기화’를 누르면 해당 계산기의 localStorage 입력값도 삭제됩니다.
- 여행 경비 분배 계산기는 참가자 이름과 결제금액을 URL에 포함하지 않습니다.
- 현재 별도의 방문자 분석 스크립트는 적용되어 있지 않습니다. Google AdSense 계정 확인 및 광고 스크립트는 공통 head에 적용되어 있습니다.
- 반려동물 간식 수율, 캠핑 음식량, 택배 박스 크기, 전기요금, 이사 박스 수, 여행 짐 체크, 인원별 고기량, 행사 음료·얼음, 돌잔치 음식량, 케이크 호수, 여행 주유비, 단위 변환기 페이지에는 쿠팡파트너스 제휴 링크가 표시됩니다. 상품 이미지는 쿠팡 CDN에서 불러오며 자세한 내용은 개인정보처리방침에 고지합니다.

## 쿠팡파트너스 제휴 영역

제휴 상품 카드는 계산 결과와 본문 설명을 가리지 않도록 계산 원리·예시 다음, FAQ 앞에 배치했습니다. 각 페이지에는 아래 수수료 고지를 상품 링크보다 먼저 표시합니다.

> 이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.

공통 디자인은 `assets/styles.css`의 `.affiliate-*` 규칙에서 관리합니다. 외부 링크에는 `rel="sponsored nofollow noopener"`와 새 창 안내를 적용했고, 상품 이미지는 원본 크기를 지정한 지연 로딩으로 레이아웃 이동을 줄였습니다. 상품명, 판매 상태와 이미지 주소가 변경되면 각 계산기 HTML의 링크·대체 텍스트를 함께 점검하세요.

## Google AdSense 삽입 위치

공통 head 진입점인 `assets/head.js`에서 AdSense 게시자 `ca-pub-4297698834736188`의 계정 메타태그와 광고 스크립트를 모든 페이지의 `<head>`에 추가합니다. 루트 `ads.txt`에는 같은 게시자 ID의 Google DIRECT 항목이 있습니다.

AdSense 승인 검토 중에는 빈 광고 자리 56개가 미완성 영역처럼 보이지 않도록 `assets/site-config.js`의 `showAdSlots`가 `false`로 설정되어 있습니다. 계정 확인용 공통 스크립트, 메타태그와 `ads.txt`는 그대로 유지됩니다.

승인 후 수동 광고 코드를 각 `.ad-slot`에 연결했다면 `showAdSlots`를 `true`로 변경하여 예약 영역을 표시할 수 있습니다. `.ad-slot`에는 최소 높이가 설정되어 있어 광고가 로드될 때 레이아웃 이동을 줄입니다. Google 자동 광고만 사용하는 경우에는 이 값을 켤 필요가 없습니다.

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
node --check assets/utilities.js
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
  utilities.js       단위·날짜·QR·비밀번호·텍스트 도구 로직
  image-tools.js     이미지 크기·형식·품질·방향 변환 로직
  developer-tools.js JSON·Base64·URL 문자열 변환 로직
  color-tools.js     HEX·RGB 변환과 색상 대비 계산 로직
  home.js            메인 카테고리와 검색 필터 로직
  favicon.svg        공통 파비콘
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
  chicken-calculator/index.html
  company-dinner-drink-calculator/index.html
  pizza-calculator/index.html
  travel-packing-checklist/index.html
  currency-exchange-calculator/index.html
  travel-budget-calculator/index.html
  international-travel-cost-calculator/index.html
  unit-converter/index.html
  date-calculator/index.html
  qr-code-generator/index.html
  password-generator/index.html
  text-tools/index.html
  image-tools/index.html
  developer-tools/index.html
  color-tools/index.html
  electricity-cost-calculator/index.html
  parcel-box-calculator/index.html
  first-birthday-food-calculator/index.html
  cake-size-calculator/index.html
  subscription-split-calculator/index.html
  ev-vs-ice-cost-calculator/index.html
  pet-treat-dehydration-calculator/index.html
  overseas-purchase-duty-calculator/index.html
about/ methodology/ contact/ privacy/ terms/ disclaimer/
_headers
_redirects
robots.txt
sitemap.xml
```

계산기 HTML의 실제 위치는 `calculator/` 아래이지만 공개 URL은 기존과 동일합니다. 예를 들어 `calculator/meat-calculator/index.html`은 Cloudflare Pages에서 `/meat-calculator/`로 제공됩니다. 새 계산기를 추가할 때는 `calculator/`에 페이지를 만든 뒤 `_redirects`, 메인 목록, `sitemap.xml`, `scripts/sync-site-url.mjs`의 경로 목록을 함께 갱신하세요.
