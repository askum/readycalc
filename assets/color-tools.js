(() => {
  'use strict';

  const form = document.querySelector('[data-utility="color"]');
  if (!form) return;

  const picker = form.elements.colorPicker;
  const hexInput = form.elements.hexColor;
  const redInput = form.elements.red;
  const greenInput = form.elements.green;
  const blueInput = form.elements.blue;
  const hexError = document.getElementById('hex-color-error');
  const rgbError = document.getElementById('rgb-color-error');
  const resultEmpty = document.querySelector('[data-result-empty]');
  const resultContent = document.querySelector('[data-result-content]');
  const resultValue = document.querySelector('[data-result-value]');
  const resultList = document.querySelector('[data-result-list]');
  const resultNote = document.querySelector('[data-result-note]');
  const preview = document.querySelector('[data-color-preview]');
  const copyButton = document.querySelector('[data-copy-result]');
  const shareButton = document.querySelector('[data-share-result]');
  const storageKey = 'living-calc-utility-settings:color';
  let lastSource = 'hex';
  let resultText = '';

  const normalizeHex = (value) => {
    const cleaned = value.trim().replace(/^#/, '');
    if (/^[0-9a-f]{3}$/i.test(cleaned)) return '#' + [...cleaned].map((char) => char + char).join('').toUpperCase();
    if (/^[0-9a-f]{6}$/i.test(cleaned)) return '#' + cleaned.toUpperCase();
    return null;
  };

  const hexToRgb = (hex) => ({
    red: parseInt(hex.slice(1, 3), 16),
    green: parseInt(hex.slice(3, 5), 16),
    blue: parseInt(hex.slice(5, 7), 16)
  });

  const rgbToHex = (red, green, blue) => '#' + [red, green, blue]
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('').toUpperCase();

  const rgbToHsl = (red, green, blue) => {
    const r = red / 255;
    const g = green / 255;
    const b = blue / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const lightness = (max + min) / 2;
    if (max === min) return { hue: 0, saturation: 0, lightness: Math.round(lightness * 100) };
    const difference = max - min;
    const saturation = lightness > 0.5 ? difference / (2 - max - min) : difference / (max + min);
    let hue;
    if (max === r) hue = (g - b) / difference + (g < b ? 6 : 0);
    else if (max === g) hue = (b - r) / difference + 2;
    else hue = (r - g) / difference + 4;
    return { hue: Math.round(hue * 60), saturation: Math.round(saturation * 100), lightness: Math.round(lightness * 100) };
  };

  const relativeLuminance = (red, green, blue) => {
    const channels = [red, green, blue].map((value) => {
      const channel = value / 255;
      return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
  };

  const contrastRatio = (first, second) => ((Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05));
  const validChannel = (input) => input.value !== '' && Number.isInteger(Number(input.value)) && Number(input.value) >= 0 && Number(input.value) <= 255;

  const clearErrors = () => {
    [hexInput, redInput, greenInput, blueInput].forEach((input) => input.removeAttribute('aria-invalid'));
    hexError.textContent = '';
    rgbError.textContent = '';
  };

  const setHexError = (message) => {
    hexInput.setAttribute('aria-invalid', 'true');
    hexError.textContent = message;
    hexInput.focus();
  };

  const setRgbError = (message) => {
    [redInput, greenInput, blueInput].forEach((input) => input.setAttribute('aria-invalid', 'true'));
    rgbError.textContent = message;
    const invalid = [redInput, greenInput, blueInput].find((input) => !validChannel(input));
    (invalid || redInput).focus();
  };

  const saveColor = (hex) => {
    try { localStorage.setItem(storageKey, JSON.stringify({ color: hex })); } catch (_) {}
  };

  const setFromHex = (hex, save = true) => {
    const rgb = hexToRgb(hex);
    picker.value = hex;
    hexInput.value = hex;
    redInput.value = rgb.red;
    greenInput.value = rgb.green;
    blueInput.value = rgb.blue;
    if (save) saveColor(hex);
  };

  const setFromRgb = () => {
    if (![redInput, greenInput, blueInput].every(validChannel)) return false;
    const hex = rgbToHex(Number(redInput.value), Number(greenInput.value), Number(blueInput.value));
    picker.value = hex;
    hexInput.value = hex;
    saveColor(hex);
    return true;
  };

  const restoreColor = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
      const hex = normalizeHex(saved.color || '') || '#2F7D68';
      setFromHex(hex, false);
    } catch (_) { setFromHex('#2F7D68', false); }
  };

  const showResult = (hex, red, green, blue) => {
    const hsl = rgbToHsl(red, green, blue);
    const luminance = relativeLuminance(red, green, blue);
    const blackContrast = contrastRatio(luminance, 0);
    const whiteContrast = contrastRatio(luminance, 1);
    const foreground = blackContrast >= whiteContrast ? '#000000' : '#FFFFFF';
    const rgb = `rgb(${red}, ${green}, ${blue})`;
    const hslText = `hsl(${hsl.hue}, ${hsl.saturation}%, ${hsl.lightness}%)`;
    resultValue.textContent = hex;
    resultList.innerHTML = '';
    [
      ['RGB', `${red}, ${green}, ${blue}`],
      ['CSS RGB', rgb],
      ['HSL 참고값', hslText],
      ['검정과 대비', blackContrast.toFixed(2) + ':1'],
      ['흰색과 대비', whiteContrast.toFixed(2) + ':1']
    ].forEach(([label, value]) => {
      const item = document.createElement('li');
      const labelElement = document.createElement('span');
      const valueElement = document.createElement('strong');
      labelElement.textContent = label;
      valueElement.textContent = value;
      item.append(labelElement, valueElement);
      resultList.append(item);
    });
    preview.style.backgroundColor = hex;
    preview.style.color = foreground;
    preview.textContent = `${hex} 미리보기`;
    resultNote.textContent = `일반 텍스트에는 ${foreground === '#000000' ? '검정' : '흰색'} 글자가 더 높은 대비를 제공합니다.`;
    resultText = `색상 변환 결과\nHEX: ${hex}\nRGB: ${red}, ${green}, ${blue}\nCSS: ${rgb}\nHSL: ${hslText}\n검정 대비: ${blackContrast.toFixed(2)}:1\n흰색 대비: ${whiteContrast.toFixed(2)}:1`;
    resultEmpty.hidden = true;
    resultContent.hidden = false;
    resultContent.focus({ preventScroll: true });
    if (window.matchMedia('(max-width: 899px)').matches) {
      const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
      requestAnimationFrame(() => {
        const headerHeight = document.querySelector('.site-header')?.offsetHeight || 68;
        const top = window.scrollY + resultContent.closest('.result-panel').getBoundingClientRect().top - headerHeight - 16;
        window.scrollTo({ top: Math.max(0, top), behavior });
      });
    }
  };

  restoreColor();

  picker.addEventListener('input', () => {
    lastSource = 'picker';
    clearErrors();
    setFromHex(picker.value.toUpperCase());
  });

  hexInput.addEventListener('input', () => {
    lastSource = 'hex';
    clearErrors();
    const hex = normalizeHex(hexInput.value);
    if (hex && hexInput.value.replace(/^#/, '').length === 6) setFromHex(hex);
  });

  hexInput.addEventListener('change', () => {
    const hex = normalizeHex(hexInput.value);
    if (hex) setFromHex(hex);
  });

  [redInput, greenInput, blueInput].forEach((input) => input.addEventListener('input', () => {
    lastSource = 'rgb';
    clearErrors();
    setFromRgb();
  }));

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    clearErrors();
    let hex;
    if (lastSource === 'rgb') {
      if (![redInput, greenInput, blueInput].every(validChannel)) return setRgbError('R, G, B 값을 각각 0부터 255 사이의 정수로 입력해 주세요.');
      hex = rgbToHex(Number(redInput.value), Number(greenInput.value), Number(blueInput.value));
      setFromHex(hex);
    } else {
      hex = normalizeHex(hexInput.value);
      if (!hex) return setHexError('HEX 색상은 #을 포함하거나 생략한 3자리 또는 6자리 16진수로 입력해 주세요.');
      setFromHex(hex);
    }
    const { red, green, blue } = hexToRgb(hex);
    showResult(hex, red, green, blue);
  });

  form.addEventListener('reset', () => {
    requestAnimationFrame(() => {
      lastSource = 'hex';
      clearErrors();
      setFromHex('#2F7D68');
      resultText = '';
      resultEmpty.hidden = false;
      resultContent.hidden = true;
    });
  });

  copyButton.addEventListener('click', () => {
    if (resultText) window.copyText(resultText, '색상 값을 복사했습니다.');
  });

  shareButton.addEventListener('click', async () => {
    if (!resultText) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: '색상 변환 결과', text: resultText, url: location.origin + location.pathname });
        return;
      } catch (error) {
        if (error.name === 'AbortError') return;
      }
    }
    window.copyText(resultText, '공유할 색상 값을 복사했습니다.');
  });
})();
