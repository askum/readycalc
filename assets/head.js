/*
 * 공통 head 삽입 지점
 * Google AdSense 승인 후 제공되는 스크립트를 이 파일에서 동적으로 추가하세요.
 * 예: const s = document.createElement('script'); s.async = true; ...
 * 계산기 기능은 외부 스크립트나 API에 의존하지 않습니다.
 */
(() => {
  const icon = document.createElement('link');
  icon.rel = 'icon';
  icon.type = 'image/svg+xml';
  icon.href = '/assets/favicon.svg';
  document.head.append(icon);

  const color = document.createElement('meta');
  color.name = 'theme-color';
  color.content = '#087f5b';
  document.head.append(color);
})();
