(() => {
  'use strict';

  const headerHost = document.querySelector('[data-site-header]');
  const footerHost = document.querySelector('[data-site-footer]');
  if (headerHost) headerHost.innerHTML = `
    <a class="skip-link" href="#main">본문 바로가기</a>
    <header class="site-header"><div class="container nav-wrap">
      <a class="brand" href="/"><span class="brand-mark" aria-hidden="true">생</span><span>생활계산소</span></a>
      <nav class="desktop-nav" aria-label="주요 메뉴"><a href="/#tools">계산기</a><a href="/about/">소개</a><a href="/contact/">문의</a></nav>
      <div class="nav-actions"><button class="icon-button" type="button" data-theme-toggle aria-label="어두운 화면으로 전환">🌙</button><button class="menu-button" type="button" data-menu-toggle aria-controls="mobile-menu" aria-expanded="false" aria-label="메뉴 열기">☰</button></div>
    </div><nav class="mobile-menu" id="mobile-menu" aria-label="모바일 메뉴" hidden><div class="container"><a href="/#tools">모든 계산기</a><a href="/about/">소개</a><a href="/contact/">문의</a></div></nav></header>`;
  if (footerHost) footerHost.innerHTML = `
    <footer class="site-footer"><div class="container footer-grid"><div><a class="brand" href="/"><span class="brand-mark" aria-hidden="true">생</span><span>생활계산소</span></a><p class="hint">복잡한 생활 계산을 빠르고 가볍게.</p></div><nav class="footer-links" aria-label="하단 메뉴"><a href="/about/">소개</a><a href="/contact/">문의</a><a href="/privacy/">개인정보처리방침</a><a href="/terms/">이용약관</a><a href="/disclaimer/">면책조항</a></nav></div><div class="container copyright">© 2026 생활계산소. 모든 계산은 사용자의 기기 안에서 처리됩니다.</div></footer><div class="toast" id="toast" role="status" aria-live="polite" hidden></div>`;

  const root = document.documentElement;
  const themeButton = document.querySelector('[data-theme-toggle]');
  const menuButton = document.querySelector('[data-menu-toggle]');
  const mobileMenu = document.getElementById('mobile-menu');
  const toast = document.getElementById('toast');
  let toastTimer;

  try {
    const savedTheme = localStorage.getItem('living-calc-theme');
    if (savedTheme === 'dark' || savedTheme === 'light') root.dataset.theme = savedTheme;
  } catch (_) {}

  const updateThemeLabel = () => {
    if (!themeButton) return;
    const dark = root.dataset.theme === 'dark';
    themeButton.textContent = dark ? '☀️' : '🌙';
    themeButton.setAttribute('aria-label', dark ? '밝은 화면으로 전환' : '어두운 화면으로 전환');
  };
  updateThemeLabel();

  themeButton?.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('living-calc-theme', root.dataset.theme); } catch (_) {}
    updateThemeLabel();
  });

  menuButton?.addEventListener('click', () => {
    const expanded = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!expanded));
    mobileMenu.hidden = expanded;
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && mobileMenu && !mobileMenu.hidden) {
      mobileMenu.hidden = true;
      menuButton?.setAttribute('aria-expanded', 'false');
      menuButton?.focus();
    }
  });

  window.showToast = (message) => {
    if (!toast) return;
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.hidden = false;
    toastTimer = setTimeout(() => { toast.hidden = true; }, 2300);
  };

  window.copyText = async (text, successMessage = '복사했습니다.') => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (_) {
      const area = document.createElement('textarea');
      area.value = text;
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.append(area);
      area.select();
      document.execCommand('copy');
      area.remove();
    }
    window.showToast(successMessage);
  };

  document.querySelectorAll('[data-share-page]').forEach((button) => {
    button.addEventListener('click', () => window.copyText(location.href, '공유 주소를 복사했습니다.'));
  });
})();
