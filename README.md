# 생활계산소

한국 사용자를 위한 서버리스 정적 생활 계산기 사이트입니다. 순수 HTML, CSS, JavaScript만 사용하며 모든 계산은 브라우저에서 실행됩니다.

## 제공 페이지

- 메인
- 인원별 고기량 계산기
- 여행 주유비 계산기
- 캠핑 음식량 계산기
- 행사 음료 및 얼음 수량 계산기
- 이사 박스 수 계산기
- 여행 경비 분배 계산기
- 랜덤 팀 배정기
- 소개, 문의, 개인정보처리방침, 이용약관, 면책조항

## 로컬에서 확인

빌드나 패키지 설치가 필요하지 않습니다. 프로젝트 루트에서 정적 파일 서버만 실행합니다.

```bash
python3 -m http.server 8080
```

브라우저에서 `http://localhost:8080`을 엽니다. 폴더 경로를 사용하는 페이지가 있으므로 HTML 파일을 Finder에서 직접 열기보다 로컬 서버 사용을 권장합니다.

## Cloudflare Pages 배포

### Git 저장소 연결

1. 이 폴더를 GitHub 또는 GitLab 저장소에 올립니다.
2. Cloudflare 대시보드에서 **Workers & Pages → Create → Pages → Connect to Git**을 선택합니다.
3. 저장소와 배포 브랜치를 선택합니다.
4. Build settings를 아래처럼 설정합니다.
   - Framework preset: `None`
   - Build command: 비워 둠
   - Build output directory: `.`
5. **Save and Deploy**를 선택합니다.

### Wrangler로 직접 배포

Wrangler가 설치되어 있다면 다음 명령으로 현재 폴더를 배포할 수 있습니다.

```bash
npx wrangler pages deploy . --project-name readycalc
```

`readycalc`은 원하는 Pages 프로젝트 이름으로 바꿔도 됩니다.

## 배포 전 꼭 바꿀 값

현재 SEO 기준 주소는 `https://readycalc.pages.dev`로 설정되어 있습니다. 다른 Pages 프로젝트 이름이나 맞춤 도메인을 사용한다면 전체 파일에서 이 주소를 새 도메인으로 일괄 교체하세요. 함께 바꿀 위치는 다음과 같습니다.

- 각 HTML의 `canonical`, `og:url`, 구조화 데이터 URL
- `sitemap.xml`
- `robots.txt`
- `contact/index.html`의 예시 이메일 `hello@readycalc.example`

## Google AdSense 추가

공통 head 진입점은 `assets/head.js`입니다. 승인 후 제공되는 AdSense 스크립트를 이 파일에서 동적으로 생성해 `<head>`에 추가하면 모든 페이지에 적용됩니다. 각 계산기 아래의 `.ad-slot`에는 `min-height: 120px`가 설정되어 있어 광고가 로드될 때 레이아웃 이동(CLS)을 줄입니다. 실제 광고 크기에 맞춰 최소 높이를 더 크게 조정할 수 있습니다.

## 개인정보와 저장소

- 계산 입력값은 서버로 전송하거나 localStorage에 저장하지 않습니다.
- localStorage는 밝은/어두운 화면 설정에만 사용합니다.
- 공유 URL을 선택하면 일부 계산기의 입력값이 쿼리 문자열에 포함됩니다.
- 외부 API와 외부 JavaScript 라이브러리를 사용하지 않습니다.

## 주요 파일

```text
assets/
  calculators.js   계산, 검증, 결과 공유 로직
  head.js          광고 등 공통 head 코드 진입점
  site.js          공통 메뉴, 푸터, 테마와 복사 기능
  styles.css       모바일 우선 공통 스타일
각-페이지/index.html
_headers           Cloudflare Pages 보안·캐시 헤더
robots.txt
sitemap.xml
```
