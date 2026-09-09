(() => {
  'use strict';

  const form = document.querySelector('[data-utility="developer"]');
  if (!form) return;

  const operation = form.elements.operation;
  const source = form.elements.sourceText;
  const indent = form.elements.indent;
  const urlMode = form.elements.urlMode;
  const indentField = document.querySelector('[data-indent-field]');
  const urlModeField = document.querySelector('[data-url-mode-field]');
  const sourceError = document.getElementById('developer-source-error');
  const resultEmpty = document.querySelector('[data-result-empty]');
  const resultContent = document.querySelector('[data-result-content]');
  const resultValue = document.querySelector('[data-result-value]');
  const resultList = document.querySelector('[data-result-list]');
  const resultNote = document.querySelector('[data-result-note]');
  const output = document.querySelector('[data-output]');
  const copyButton = document.querySelector('[data-copy-result]');
  const shareButton = document.querySelector('[data-share-result]');
  const storageKey = 'living-calc-utility-settings:developer';
  const operationNames = {
    'json-beautify': 'JSON 정리',
    'json-minify': 'JSON 압축',
    'base64-encode': 'Base64 인코딩',
    'base64-decode': 'Base64 디코딩',
    'url-encode': 'URL 인코딩',
    'url-decode': 'URL 디코딩'
  };
  let resultText = '';

  const countCharacters = (text) => Array.from(text).length;
  const utf8Bytes = (text) => new TextEncoder().encode(text).length;

  const encodeBase64 = (text) => {
    const bytes = new TextEncoder().encode(text);
    let binary = '';
    const chunkSize = 0x8000;
    for (let index = 0; index < bytes.length; index += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
    }
    return btoa(binary);
  };

  const decodeBase64 = (text) => {
    const compact = text.replace(/\s/g, '');
    if (!compact || !/^[A-Za-z0-9+/]*={0,2}$/.test(compact) || compact.length % 4 === 1) {
      throw new Error('Base64 형식이 올바르지 않습니다. 영문, 숫자, +, /, = 문자로 된 값을 확인해 주세요.');
    }
    const unpadded = compact.replace(/=+$/, '');
    const padded = unpadded + '='.repeat((4 - (unpadded.length % 4)) % 4);
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    try {
      return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    } catch (_) {
      throw new Error('디코딩된 값이 올바른 UTF-8 텍스트가 아닙니다. 원래 인코딩 방식을 확인해 주세요.');
    }
  };

  const clearError = () => {
    source.removeAttribute('aria-invalid');
    sourceError.textContent = '';
  };

  const showError = (message) => {
    source.setAttribute('aria-invalid', 'true');
    sourceError.textContent = message;
    source.focus();
  };

  const saveSettings = () => {
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        operation: operation.value,
        indent: indent.value,
        urlMode: urlMode.value
      }));
    } catch (_) {}
  };

  const restoreSettings = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
      if (operationNames[saved.operation]) operation.value = saved.operation;
      if (['2', '4', 'tab'].includes(saved.indent)) indent.value = saved.indent;
      if (['component', 'full'].includes(saved.urlMode)) urlMode.value = saved.urlMode;
    } catch (_) {}
  };

  const updateFields = () => {
    const isJson = operation.value.startsWith('json-');
    const isUrl = operation.value.startsWith('url-');
    indentField.hidden = !isJson;
    indent.disabled = !isJson;
    urlModeField.hidden = !isUrl;
    urlMode.disabled = !isUrl;
    const placeholders = {
      'json-beautify': '{"name":"생활계산소","items":[1,2]}',
      'json-minify': '{\n  "name": "생활계산소",\n  "active": true\n}',
      'base64-encode': 'Base64로 바꿀 한글·영문 텍스트를 입력하세요.',
      'base64-decode': '7IOd7Zmc6rOE7IKw7IaM',
      'url-encode': '여행 경비?name=홍길동&people=4',
      'url-decode': '%EC%83%9D%ED%99%9C%EA%B3%84%EC%82%B0%EC%86%8C'
    };
    source.placeholder = placeholders[operation.value];
    clearError();
    saveSettings();
  };

  const showResult = (processed) => {
    const actionName = operationNames[operation.value];
    resultValue.textContent = actionName + ' 완료';
    resultList.innerHTML = '';
    const items = [
      ['입력 글자 수', countCharacters(source.value).toLocaleString('ko-KR') + '자'],
      ['결과 글자 수', countCharacters(processed).toLocaleString('ko-KR') + '자'],
      ['결과 UTF-8 크기', utf8Bytes(processed).toLocaleString('ko-KR') + '바이트']
    ];
    items.forEach(([label, value]) => {
      const item = document.createElement('li');
      const labelElement = document.createElement('span');
      const valueElement = document.createElement('strong');
      labelElement.textContent = label;
      valueElement.textContent = value;
      item.append(labelElement, valueElement);
      resultList.append(item);
    });
    output.value = processed;
    resultNote.textContent = '원문과 결과는 서버 또는 localStorage에 저장하지 않습니다.';
    resultText = processed;
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

  const processText = () => {
    const value = source.value;
    switch (operation.value) {
      case 'json-beautify': {
        const spacing = indent.value === 'tab' ? '\t' : Number(indent.value);
        return JSON.stringify(JSON.parse(value), null, spacing);
      }
      case 'json-minify': return JSON.stringify(JSON.parse(value));
      case 'base64-encode': return encodeBase64(value);
      case 'base64-decode': return decodeBase64(value);
      case 'url-encode': return urlMode.value === 'full' ? encodeURI(value) : encodeURIComponent(value);
      case 'url-decode': return urlMode.value === 'full' ? decodeURI(value) : decodeURIComponent(value);
      default: throw new Error('처리할 작업을 선택해 주세요.');
    }
  };

  restoreSettings();
  updateFields();
  operation.addEventListener('change', updateFields);
  indent.addEventListener('change', saveSettings);
  urlMode.addEventListener('change', saveSettings);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    clearError();
    if (!source.value.trim()) return showError('처리할 텍스트를 입력해 주세요.');
    if (source.value.length > 500000) return showError('한 번에 처리할 수 있는 최대 길이는 500,000자입니다.');
    try {
      showResult(processText());
    } catch (error) {
      let message = error.message;
      if (error instanceof SyntaxError && operation.value.startsWith('json-')) {
        message = 'JSON 문법을 확인해 주세요. 쉼표, 따옴표, 중괄호 또는 대괄호 위치가 올바르지 않습니다.';
      } else if (error instanceof URIError) {
        message = 'URL 인코딩 형식이 올바르지 않습니다. % 뒤에 두 자리 16진수가 있는지 확인해 주세요.';
      }
      showError(message);
    }
  });

  form.addEventListener('reset', () => {
    requestAnimationFrame(() => {
      clearError();
      resultText = '';
      output.value = '';
      resultEmpty.hidden = false;
      resultContent.hidden = true;
      updateFields();
    });
  });

  copyButton.addEventListener('click', () => {
    if (resultText) window.copyText(resultText, '처리 결과를 복사했습니다.');
  });

  shareButton.addEventListener('click', async () => {
    if (!resultText) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: operationNames[operation.value] + ' 결과', text: resultText });
        return;
      } catch (error) {
        if (error.name === 'AbortError') return;
      }
    }
    window.copyText(resultText, '공유할 결과를 복사했습니다.');
  });
})();
