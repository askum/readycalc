/* 공통 head 요소: Google AdSense 계정 확인, 광고 스크립트, 파비콘과 테마 색상 */
(() => {
  const adsenseAccount = 'ca-pub-4297698834736188';

  if (!document.querySelector('meta[name="google-adsense-account"]')) {
    const adsenseMeta = document.createElement('meta');
    adsenseMeta.name = 'google-adsense-account';
    adsenseMeta.content = adsenseAccount;
    document.head.append(adsenseMeta);
  }

  if (!document.querySelector('script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]')) {
    const adsenseScript = document.createElement('script');
    adsenseScript.async = true;
    adsenseScript.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseAccount}`;
    adsenseScript.crossOrigin = 'anonymous';
    document.head.append(adsenseScript);
  }

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
