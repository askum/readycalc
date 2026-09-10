(() => {
  'use strict';

  const form = document.querySelector('[data-new-tool]');
  if (!form) return;
  const type = form.dataset.newTool;
  if (!['color-converter', 'color-picker', 'palette-extractor', 'image-color-picker'].includes(type)) return;

  const resultEmpty = document.querySelector('[data-result-empty]');
  const resultContent = document.querySelector('[data-result-content]');
  const resultValue = document.querySelector('[data-result-value]');
  const resultList = document.querySelector('[data-result-list]');
  const resultNote = document.querySelector('[data-result-note]');
  let resultText = '';

  const normalizeHex = (value) => {
    const raw = String(value).trim().replace(/^#/, '');
    if (/^[\da-f]{3}$/i.test(raw)) return '#' + [...raw].map((char) => char + char).join('').toUpperCase();
    if (/^[\da-f]{6}$/i.test(raw)) return '#' + raw.toUpperCase();
    return null;
  };
  const rgbToHex = (r, g, b) => '#' + [r, g, b].map((value) => Math.round(value).toString(16).padStart(2, '0')).join('').toUpperCase();
  const hexToRgb = (hex) => [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
  const rgbToHsl = (r, g, b) => {
    const channels = [r, g, b].map((value) => value / 255);
    const max = Math.max(...channels); const min = Math.min(...channels);
    let h = 0; let s = 0; const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > .5 ? d / (2 - max - min) : d / (max + min);
      if (max === channels[0]) h = (channels[1] - channels[2]) / d + (channels[1] < channels[2] ? 6 : 0);
      else if (max === channels[1]) h = (channels[2] - channels[0]) / d + 2;
      else h = (channels[0] - channels[1]) / d + 4;
      h *= 60;
    }
    return [Math.round(h), Math.round(s * 100), Math.round(l * 100)];
  };
  const hslToRgb = (h, s, l) => {
    h = ((h % 360) + 360) % 360; s /= 100; l /= 100;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l - c / 2;
    let rgb = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
    return rgb.map((value) => Math.round((value + m) * 255));
  };
  const colorText = (hex, r, g, b) => {
    const [h, s, l] = rgbToHsl(r, g, b);
    return `HEX: ${hex}\nRGB: rgb(${r}, ${g}, ${b})\nHSL: hsl(${h}, ${s}%, ${l}%)`;
  };
  const escapeHtml = (text) => String(text).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const clearErrors = () => {
    form.querySelectorAll('[aria-invalid="true"]').forEach((field) => field.removeAttribute('aria-invalid'));
    form.querySelectorAll('.error').forEach((error) => { error.textContent = ''; });
  };
  const invalidate = (field, message) => {
    field.setAttribute('aria-invalid', 'true');
    const error = document.getElementById(field.id + '-error');
    if (error) error.textContent = message;
    field.focus();
    return false;
  };
  const showResult = (headline, items, note, text, custom = '') => {
    resultValue.textContent = headline;
    resultList.innerHTML = custom + items.map(([label, value]) => `<li><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></li>`).join('');
    resultNote.textContent = note;
    resultText = text;
    resultEmpty.hidden = true;
    resultContent.hidden = false;
    resultContent.focus({ preventScroll: true });
    if (matchMedia('(max-width: 899px)').matches) {
      requestAnimationFrame(() => resultContent.closest('.result-panel').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }));
    }
  };
  const bindCopyShare = () => {
    document.querySelector('[data-copy-result]')?.addEventListener('click', () => resultText && window.copyText(resultText, '결과를 복사했습니다.'));
    document.querySelector('[data-share-result]')?.addEventListener('click', async () => {
      if (!resultText) return;
      if (navigator.share) {
        try { await navigator.share({ title: document.title, text: resultText, url: location.origin + location.pathname }); return; }
        catch (error) { if (error.name === 'AbortError') return; }
      }
      window.copyText(resultText, '공유할 결과를 복사했습니다.');
    });
  };

  if (type === 'color-converter') {
    const hex = form.elements.hex; const r = form.elements.r; const g = form.elements.g; const b = form.elements.b;
    const h = form.elements.h; const s = form.elements.s; const l = form.elements.l; const preview = document.querySelector('[data-color-preview]');
    let source = 'hex';
    const setAll = (red, green, blue) => {
      const hexValue = rgbToHex(red, green, blue); const hsl = rgbToHsl(red, green, blue);
      hex.value = hexValue; r.value = red; g.value = green; b.value = blue; h.value = hsl[0]; s.value = hsl[1]; l.value = hsl[2];
      preview.style.background = hexValue;
      try { localStorage.setItem('living-calc-utility-settings:color-converter', hexValue); } catch (_) {}
      return hexValue;
    };
    try { const saved = normalizeHex(localStorage.getItem('living-calc-utility-settings:color-converter')); if (saved) setAll(...hexToRgb(saved)); } catch (_) {}
    hex.addEventListener('input', () => { source = 'hex'; const value = normalizeHex(hex.value); if (value && hex.value.replace('#', '').length === 6) setAll(...hexToRgb(value)); });
    [r, g, b].forEach((field) => field.addEventListener('input', () => { source = 'rgb'; if ([r, g, b].every((item) => item.value !== '' && Number.isInteger(+item.value) && +item.value >= 0 && +item.value <= 255)) setAll(+r.value, +g.value, +b.value); }));
    [h, s, l].forEach((field) => field.addEventListener('input', () => { source = 'hsl'; if (h.value !== '' && +h.value >= 0 && +h.value <= 360 && [s, l].every((item) => item.value !== '' && +item.value >= 0 && +item.value <= 100)) setAll(...hslToRgb(+h.value, +s.value, +l.value)); }));
    form.addEventListener('submit', (event) => {
      event.preventDefault(); clearErrors(); let rgb;
      if (source === 'hex') { const value = normalizeHex(hex.value); if (!value) return invalidate(hex, '3자리 또는 6자리 HEX 색상 코드를 입력해 주세요.'); rgb = hexToRgb(value); }
      else if (source === 'rgb') { if (![r, g, b].every((item) => item.value !== '' && Number.isInteger(+item.value) && +item.value >= 0 && +item.value <= 255)) return invalidate(r, 'RGB는 각각 0~255 사이의 정수로 입력해 주세요.'); rgb = [+r.value, +g.value, +b.value]; }
      else { if (h.value === '' || +h.value < 0 || +h.value > 360 || ![s, l].every((item) => item.value !== '' && +item.value >= 0 && +item.value <= 100)) return invalidate(h, 'H는 0~360, S와 L은 0~100 범위로 입력해 주세요.'); rgb = hslToRgb(+h.value, +s.value, +l.value); }
      const hexValue = setAll(...rgb); const hsl = rgbToHsl(...rgb);
      preview.textContent = hexValue + ' 미리보기';
      showResult(hexValue, [['RGB', `rgb(${rgb.join(', ')})`], ['HSL', `hsl(${hsl[0]}, ${hsl[1]}%, ${hsl[2]}%)`]], '화면과 인쇄물의 색상은 기기와 색상 프로필에 따라 다를 수 있습니다.', colorText(hexValue, ...rgb));
    });
    bindCopyShare();
  }

  if (type === 'color-picker') {
    const picker = form.elements.color; const live = document.querySelector('[data-live-color]'); const preview = document.querySelector('[data-color-preview]');
    const update = () => {
      const hex = picker.value.toUpperCase(); const rgb = hexToRgb(hex); const hsl = rgbToHsl(...rgb);
      preview.style.background = hex; preview.textContent = hex + ' 미리보기';
      live.innerHTML = `<span><strong>HEX</strong><button type="button" data-copy-color="${hex}">${hex}</button></span><span><strong>RGB</strong><button type="button" data-copy-color="rgb(${rgb.join(', ')})">rgb(${rgb.join(', ')})</button></span><span><strong>HSL</strong><button type="button" data-copy-color="hsl(${hsl[0]}, ${hsl[1]}%, ${hsl[2]}%)">hsl(${hsl[0]}, ${hsl[1]}%, ${hsl[2]}%)</button></span>`;
      resultText = colorText(hex, ...rgb);
      resultValue.textContent = hex; resultNote.textContent = '값을 누르면 해당 형식만 복사할 수 있습니다.'; resultEmpty.hidden = true; resultContent.hidden = false;
      try { localStorage.setItem('living-calc-utility-settings:color-picker', hex); } catch (_) {}
    };
    try { const saved = normalizeHex(localStorage.getItem('living-calc-utility-settings:color-picker')); if (saved) picker.value = saved; } catch (_) {}
    picker.addEventListener('input', update); update();
    live.addEventListener('click', (event) => { const button = event.target.closest('[data-copy-color]'); if (button) window.copyText(button.dataset.copyColor, button.dataset.copyColor + '을(를) 복사했습니다.'); });
    bindCopyShare();
  }

  const loadImage = (file, maxPixels = 25000000) => new Promise((resolve, reject) => {
    if (!file || !/^image\/(jpeg|png|webp)$/.test(file.type)) return reject(new Error('JPG, PNG 또는 WebP 이미지를 선택해 주세요.'));
    if (file.size > 25 * 1024 * 1024) return reject(new Error('이미지 파일은 25MB 이하여야 합니다.'));
    const url = URL.createObjectURL(file); const image = new Image();
    image.onload = () => { image._objectUrl = url; if (image.naturalWidth * image.naturalHeight > maxPixels) { URL.revokeObjectURL(url); reject(new Error('가로×세로 2,500만 화소 이하 이미지를 사용해 주세요.')); } else resolve(image); };
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('이미지를 읽을 수 없습니다.')); }; image.src = url;
  });

  if (type === 'palette-extractor') {
    const fileInput = form.elements.image; const countInput = form.elements.count; const preview = document.querySelector('[data-image-preview]');
    let image = null;
    fileInput.addEventListener('change', async () => { clearErrors(); try { if (image?._objectUrl) URL.revokeObjectURL(image._objectUrl); image = await loadImage(fileInput.files[0]); preview.src = image.src; preview.hidden = false; } catch (error) { image = null; invalidate(fileInput, error.message); } });
    form.addEventListener('submit', (event) => {
      event.preventDefault(); clearErrors(); if (!image) return invalidate(fileInput, '먼저 분석할 이미지 파일을 선택해 주세요.');
      const canvas = document.createElement('canvas'); const scale = Math.min(1, 140 / Math.max(image.naturalWidth, image.naturalHeight));
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale)); canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const context = canvas.getContext('2d', { willReadFrequently: true }); context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data; const buckets = new Map();
      for (let i = 0; i < pixels.length; i += 16) { if (pixels[i + 3] < 160) continue; const color = [pixels[i], pixels[i + 1], pixels[i + 2]].map((v) => Math.min(255, Math.round(v / 32) * 32)); const key = color.join(','); buckets.set(key, (buckets.get(key) || 0) + 1); }
      const sorted = [...buckets].sort((a, b) => b[1] - a[1]).map(([key]) => key.split(',').map(Number)); const selected = [];
      if (!sorted.length) return invalidate(fileInput, '투명하지 않은 픽셀을 찾지 못했습니다. 다른 이미지를 선택해 주세요.');
      for (const color of sorted) { if (selected.every((existing) => Math.hypot(...color.map((v, i) => v - existing[i])) >= 48)) selected.push(color); if (selected.length >= +countInput.value) break; }
      for (const color of sorted) { if (selected.length >= +countInput.value) break; if (!selected.some((existing) => existing.join() === color.join())) selected.push(color); }
      const colors = selected.map((rgb) => ({ rgb, hex: rgbToHex(...rgb) }));
      const custom = `<li class="result-custom"><div class="palette-grid">${colors.map(({ hex, rgb }) => `<button type="button" class="palette-swatch" data-copy-color="${hex}" style="--swatch:${hex}"><span aria-hidden="true"></span><strong>${hex}</strong><small>rgb(${rgb.join(', ')})</small></button>`).join('')}</div></li>`;
      resultText = colors.map(({ hex, rgb }, index) => `${index + 1}. ${hex} · rgb(${rgb.join(', ')})`).join('\n');
      showResult(colors.length + '개 대표 색상', [], '픽셀을 단순화해 뽑은 참고 팔레트이며 디자인 전문가의 색상 분류와 다를 수 있습니다.', resultText, custom);
    });
    resultList.addEventListener('click', (event) => { const button = event.target.closest('[data-copy-color]'); if (button) window.copyText(button.dataset.copyColor, button.dataset.copyColor + '을(를) 복사했습니다.'); });
    bindCopyShare();
  }

  if (type === 'image-color-picker') {
    const fileInput = form.elements.image; const canvas = document.querySelector('[data-pixel-canvas]'); const context = canvas.getContext('2d', { willReadFrequently: true }); const canvasWrap = canvas.closest('.pixel-canvas-wrap');
    canvas.setAttribute('aria-label', '색상을 추출할 이미지. Enter 또는 Space로 현재 지점을 선택하고 방향키로 이동하세요. Shift와 방향키는 10픽셀씩 이동합니다.');
    let cursorX = 0; let cursorY = 0;
    const pickPixel = (x, y) => {
      cursorX = Math.max(0, Math.min(canvas.width - 1, Math.round(x))); cursorY = Math.max(0, Math.min(canvas.height - 1, Math.round(y)));
      const [r, g, b, a] = context.getImageData(cursorX, cursorY, 1, 1).data; const hex = rgbToHex(r, g, b); const hsl = rgbToHsl(r, g, b);
      canvasWrap.style.setProperty('--pick-x', ((cursorX + .5) / canvas.width * 100) + '%'); canvasWrap.style.setProperty('--pick-y', ((cursorY + .5) / canvas.height * 100) + '%'); canvasWrap.classList.add('has-pick');
      showResult(hex, [['RGB', `rgb(${r}, ${g}, ${b})`], ['HSL', `hsl(${hsl[0]}, ${hsl[1]}%, ${hsl[2]}%)`], ['투명도', Math.round(a / 255 * 100) + '%'], ['이미지 좌표', `${cursorX}, ${cursorY}px`]], '표시 좌표는 분석용으로 축소된 이미지 기준입니다.', colorText(hex, r, g, b));
    };
    fileInput.addEventListener('change', async () => { clearErrors(); try { const image = await loadImage(fileInput.files[0]); const scale = Math.min(1, 1600 / Math.max(image.naturalWidth, image.naturalHeight)); canvas.width = Math.max(1, Math.round(image.naturalWidth * scale)); canvas.height = Math.max(1, Math.round(image.naturalHeight * scale)); context.drawImage(image, 0, 0, canvas.width, canvas.height); URL.revokeObjectURL(image._objectUrl); canvasWrap.hidden = false; canvasWrap.classList.remove('has-pick'); cursorX = Math.floor(canvas.width / 2); cursorY = Math.floor(canvas.height / 2); resultEmpty.textContent = '이미지에서 원하는 지점을 클릭하거나 터치해 주세요.'; canvas.focus({ preventScroll: true }); } catch (error) { canvasWrap.hidden = true; invalidate(fileInput, error.message); } });
    canvas.addEventListener('pointerdown', (event) => {
      const rect = canvas.getBoundingClientRect(); const x = Math.max(0, Math.min(canvas.width - 1, Math.floor((event.clientX - rect.left) * canvas.width / rect.width))); const y = Math.max(0, Math.min(canvas.height - 1, Math.floor((event.clientY - rect.top) * canvas.height / rect.height)));
      pickPixel(x, y);
    });
    canvas.addEventListener('keydown', (event) => {
      if (!canvas.width || !canvas.height) return;
      const step = event.shiftKey ? 10 : 1;
      const moves = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
      if (moves[event.key]) { event.preventDefault(); pickPixel(cursorX + moves[event.key][0], cursorY + moves[event.key][1]); }
      else if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); pickPixel(cursorX, cursorY); }
    });
    bindCopyShare();
  }
})();
