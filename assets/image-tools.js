(() => {
  'use strict';

  const form = document.querySelector('[data-image-tool]');
  if (!form) return;

  const fileInput = form.elements.imageFile;
  const widthInput = form.elements.imageWidth;
  const heightInput = form.elements.imageHeight;
  const keepAspectInput = form.elements.keepAspect;
  const formatInput = form.elements.outputFormat;
  const qualityInput = form.elements.imageQuality;
  const rotationInput = form.elements.imageRotation;
  const flipHorizontalInput = form.elements.flipHorizontal;
  const flipVerticalInput = form.elements.flipVertical;
  const processButton = form.querySelector('[data-process-image]');
  const qualityValue = document.querySelector('#image-quality-value');
  const qualityHint = document.querySelector('[data-quality-hint]');
  const selectedFile = document.querySelector('[data-selected-file]');
  const statusMessage = document.querySelector('[data-image-status]');
  const resultEmpty = document.querySelector('[data-image-result-empty]');
  const result = document.querySelector('[data-image-result]');
  const resultValue = document.querySelector('[data-image-result-value]');
  const resultList = document.querySelector('[data-image-result-list]');
  const resultNote = document.querySelector('[data-image-result-note]');
  const preview = document.querySelector('[data-image-preview]');
  const caption = document.querySelector('[data-image-caption]');
  const downloadButton = document.querySelector('[data-download-image]');
  const copyButton = document.querySelector('[data-copy-image-info]');
  const shareButton = document.querySelector('[data-share-image]');
  const storageKey = 'living-calc-image-tool-settings';
  const acceptedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
  const maxFileBytes = 25 * 1024 * 1024;
  const maxDimension = 12000;
  const maxPixels = 40000000;

  let sourceImage = null;
  let sourceUrl = '';
  let resultUrl = '';
  let resultBlob = null;
  let resultFileName = '';
  let resultSummary = '';
  let aspectRatio = 1;
  let adjustingSize = false;

  const formatBytes = (bytes) => {
    if (!Number.isFinite(bytes) || bytes < 0) return '-';
    if (bytes < 1024) return bytes.toLocaleString('ko-KR') + ' B';
    if (bytes < 1024 ** 2) return (bytes / 1024).toLocaleString('ko-KR', { maximumFractionDigits: 1 }) + ' KB';
    return (bytes / 1024 ** 2).toLocaleString('ko-KR', { maximumFractionDigits: 2 }) + ' MB';
  };

  const formatName = (type) => ({
    'image/jpeg': 'JPG', 'image/png': 'PNG', 'image/webp': 'WebP'
  })[type] || '이미지';

  const extensionFor = (type) => ({
    'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp'
  })[type] || 'png';

  const cleanBaseName = (name) => {
    const withoutExtension = name.replace(/\.[^.]+$/, '');
    return (withoutExtension.replace(/[\\/:*?"<>|]/g, '-').trim() || 'readytools-image').slice(0, 80);
  };

  const clearErrors = () => {
    form.querySelectorAll('[aria-invalid="true"]').forEach((input) => input.removeAttribute('aria-invalid'));
    form.querySelectorAll('.error').forEach((error) => { error.textContent = ''; });
    statusMessage.textContent = '';
  };

  const invalidate = (input, message) => {
    input.setAttribute('aria-invalid', 'true');
    const error = document.querySelector('#' + input.id + '-error');
    if (error) error.textContent = message;
    input.focus();
  };

  const revokeUrl = (url) => { if (url) URL.revokeObjectURL(url); };

  const clearResult = () => {
    revokeUrl(resultUrl);
    resultUrl = '';
    resultBlob = null;
    resultFileName = '';
    resultSummary = '';
    preview.removeAttribute('src');
    result.hidden = true;
    resultEmpty.hidden = false;
  };

  const saveSettings = () => {
    const settings = {
      outputFormat: formatInput.value,
      imageQuality: qualityInput.value,
      keepAspect: keepAspectInput.checked,
      imageRotation: rotationInput.value,
      flipHorizontal: flipHorizontalInput.checked,
      flipVertical: flipVerticalInput.checked
    };
    try { localStorage.setItem(storageKey, JSON.stringify(settings)); } catch (_) {}
  };

  const restoreSettings = () => {
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(storageKey) || '{}'); } catch (_) {}
    if (['original', ...acceptedTypes].includes(saved.outputFormat)) formatInput.value = saved.outputFormat;
    if (/^(?:[1-9]\d?|100)$/.test(String(saved.imageQuality || ''))) qualityInput.value = saved.imageQuality;
    if (typeof saved.keepAspect === 'boolean') keepAspectInput.checked = saved.keepAspect;
    if (['0', '90', '180', '270'].includes(saved.imageRotation)) rotationInput.value = saved.imageRotation;
    if (typeof saved.flipHorizontal === 'boolean') flipHorizontalInput.checked = saved.flipHorizontal;
    if (typeof saved.flipVertical === 'boolean') flipVerticalInput.checked = saved.flipVertical;
  };

  const updateQuality = () => {
    qualityValue.textContent = qualityInput.value + '%';
    const selectedType = formatInput.value === 'original' ? fileInput.files[0]?.type : formatInput.value;
    const isPng = selectedType === 'image/png';
    qualityInput.disabled = isPng;
    qualityHint.textContent = isPng
      ? 'PNG는 무손실 저장 형식이므로 품질 값이 적용되지 않습니다. 크기를 줄이면 용량 절감에 도움이 됩니다.'
      : 'JPG·WebP 저장 시 적용됩니다. 값이 낮을수록 파일이 작아지고 화질 손실이 커집니다.';
  };

  const scrollToResultOnMobile = () => {
    if (!window.matchMedia('(max-width: 899px)').matches) return;
    const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const panel = result.closest('.result-panel');
      const headerHeight = document.querySelector('.site-header')?.offsetHeight || 68;
      const top = window.scrollY + panel.getBoundingClientRect().top - headerHeight - 16;
      window.scrollTo({ top: Math.max(0, top), behavior });
    }));
  };

  const syncAspectFrom = (changedInput) => {
    if (adjustingSize || !sourceImage || !keepAspectInput.checked) return;
    const value = Number(changedInput.value);
    if (!Number.isFinite(value) || value < 1) return;
    adjustingSize = true;
    if (changedInput === widthInput) heightInput.value = Math.max(1, Math.round(value / aspectRatio));
    else widthInput.value = Math.max(1, Math.round(value * aspectRatio));
    adjustingSize = false;
  };

  const loadSelectedImage = async () => {
    clearErrors();
    clearResult();
    revokeUrl(sourceUrl);
    sourceUrl = '';
    sourceImage = null;
    widthInput.disabled = true;
    heightInput.disabled = true;
    selectedFile.textContent = '선택된 파일 없음';

    const file = fileInput.files[0];
    if (!file) { updateQuality(); return; }
    if (!acceptedTypes.has(file.type)) return invalidate(fileInput, 'JPG, PNG 또는 WebP 이미지 파일을 선택해 주세요.');
    if (file.size > maxFileBytes) return invalidate(fileInput, '파일 크기는 25MB 이하여야 합니다.');

    sourceUrl = URL.createObjectURL(file);
    const image = new Image();
    image.decoding = 'async';
    image.src = sourceUrl;
    try {
      await image.decode();
    } catch (_) {
      revokeUrl(sourceUrl);
      sourceUrl = '';
      return invalidate(fileInput, '이미지를 읽을 수 없습니다. 파일이 손상되지 않았는지 확인해 주세요.');
    }

    if (!image.naturalWidth || !image.naturalHeight || image.naturalWidth * image.naturalHeight > maxPixels) {
      revokeUrl(sourceUrl);
      sourceUrl = '';
      return invalidate(fileInput, '이미지는 가로×세로 4,000만 화소 이하여야 합니다.');
    }

    sourceImage = image;
    aspectRatio = image.naturalWidth / image.naturalHeight;
    widthInput.value = image.naturalWidth;
    heightInput.value = image.naturalHeight;
    widthInput.disabled = false;
    heightInput.disabled = false;
    selectedFile.textContent = file.name + ' · ' + image.naturalWidth.toLocaleString('ko-KR') + '×' + image.naturalHeight.toLocaleString('ko-KR') + 'px · ' + formatBytes(file.size);
    statusMessage.textContent = '이미지를 읽었습니다. 원하는 설정을 선택한 뒤 이미지 처리하기를 눌러주세요.';
    updateQuality();
  };

  const canvasToBlob = (canvas, type, quality) => new Promise((resolve) => canvas.toBlob(resolve, type, quality));

  const addResultItem = (label, value) => {
    const item = document.createElement('li');
    const name = document.createElement('span');
    const detail = document.createElement('strong');
    name.textContent = label;
    detail.textContent = value;
    item.append(name, detail);
    resultList.append(item);
  };

  const processImage = async () => {
    clearErrors();
    const file = fileInput.files[0];
    if (!file || !sourceImage) return invalidate(fileInput, '먼저 처리할 이미지 파일을 선택해 주세요.');

    const targetWidth = Number(widthInput.value);
    const targetHeight = Number(heightInput.value);
    if (!Number.isInteger(targetWidth) || targetWidth < 1 || targetWidth > maxDimension) return invalidate(widthInput, '가로 크기는 1~12,000 사이의 정수로 입력해 주세요.');
    if (!Number.isInteger(targetHeight) || targetHeight < 1 || targetHeight > maxDimension) return invalidate(heightInput, '세로 크기는 1~12,000 사이의 정수로 입력해 주세요.');
    if (targetWidth * targetHeight > maxPixels) return invalidate(widthInput, '가로×세로 크기는 4,000만 화소 이하여야 합니다.');

    processButton.disabled = true;
    processButton.textContent = '이미지 처리 중…';
    statusMessage.textContent = '이미지를 처리하고 있습니다.';
    try {
      const rotation = Number(rotationInput.value);
      const swapSides = rotation === 90 || rotation === 270;
      const canvas = document.createElement('canvas');
      canvas.width = swapSides ? targetHeight : targetWidth;
      canvas.height = swapSides ? targetWidth : targetHeight;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('이 브라우저에서 이미지 처리 기능을 사용할 수 없습니다.');

      const requestedType = formatInput.value === 'original' ? file.type : formatInput.value;
      if (requestedType === 'image/jpeg') {
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
      }
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';
      context.translate(canvas.width / 2, canvas.height / 2);
      context.rotate(rotation * Math.PI / 180);
      context.scale(flipHorizontalInput.checked ? -1 : 1, flipVerticalInput.checked ? -1 : 1);
      context.drawImage(sourceImage, -targetWidth / 2, -targetHeight / 2, targetWidth, targetHeight);

      const quality = Number(qualityInput.value) / 100;
      const blob = await canvasToBlob(canvas, requestedType, quality);
      if (!blob) throw new Error('결과 파일을 만들지 못했습니다. 다른 형식이나 더 작은 크기로 다시 시도해 주세요.');

      revokeUrl(resultUrl);
      resultBlob = blob;
      resultUrl = URL.createObjectURL(blob);
      const actualType = blob.type || requestedType;
      resultFileName = cleanBaseName(file.name) + '-readytools.' + extensionFor(actualType);
      const difference = file.size - blob.size;
      const percent = file.size ? Math.abs(difference) / file.size * 100 : 0;
      const sizeChange = difference >= 0
        ? percent.toLocaleString('ko-KR', { maximumFractionDigits: 1 }) + '% 감소'
        : percent.toLocaleString('ko-KR', { maximumFractionDigits: 1 }) + '% 증가';
      const directionParts = [rotation ? rotation + '° 회전' : '', flipHorizontalInput.checked ? '좌우 뒤집기' : '', flipVerticalInput.checked ? '상하 뒤집기' : ''].filter(Boolean);

      preview.src = resultUrl;
      preview.alt = '처리된 ' + formatName(actualType) + ' 이미지 미리보기';
      caption.textContent = resultFileName;
      resultValue.textContent = canvas.width.toLocaleString('ko-KR') + ' × ' + canvas.height.toLocaleString('ko-KR') + ' px';
      resultList.replaceChildren();
      addResultItem('원본', formatName(file.type) + ' · ' + formatBytes(file.size));
      addResultItem('결과', formatName(actualType) + ' · ' + formatBytes(blob.size));
      addResultItem('용량 변화', sizeChange);
      addResultItem('방향 처리', directionParts.join(' · ') || '변경 없음');
      resultNote.textContent = actualType === 'image/png'
        ? 'PNG는 무손실 형식이라 원본보다 용량이 커질 수 있습니다. 미리보기를 확인한 뒤 다운로드하세요.'
        : '압축 결과는 이미지 내용과 브라우저 인코더에 따라 달라집니다. 확대해서 화질을 확인하세요.';
      resultSummary = [
        '[생활계산소] 이미지 처리 결과',
        '원본: ' + sourceImage.naturalWidth + '×' + sourceImage.naturalHeight + 'px · ' + formatName(file.type) + ' · ' + formatBytes(file.size),
        '결과: ' + canvas.width + '×' + canvas.height + 'px · ' + formatName(actualType) + ' · ' + formatBytes(blob.size),
        '용량 변화: ' + sizeChange,
        '방향 처리: ' + (directionParts.join(' · ') || '변경 없음')
      ].join('\n');
      resultEmpty.hidden = true;
      result.hidden = false;
      result.focus({ preventScroll: true });
      statusMessage.textContent = '이미지 처리가 완료되었습니다.';
      scrollToResultOnMobile();
    } catch (error) {
      statusMessage.textContent = error.message || '이미지를 처리하는 중 오류가 발생했습니다.';
    } finally {
      processButton.disabled = false;
      processButton.textContent = '이미지 처리하기';
    }
  };

  form.addEventListener('submit', (event) => { event.preventDefault(); processImage(); });
  fileInput.addEventListener('change', loadSelectedImage);
  widthInput.addEventListener('input', () => syncAspectFrom(widthInput));
  heightInput.addEventListener('input', () => syncAspectFrom(heightInput));
  qualityInput.addEventListener('input', () => { updateQuality(); saveSettings(); });
  formatInput.addEventListener('change', () => { updateQuality(); saveSettings(); });
  [keepAspectInput, rotationInput, flipHorizontalInput, flipVerticalInput].forEach((input) => input.addEventListener('change', saveSettings));

  downloadButton.addEventListener('click', () => {
    if (!resultBlob || !resultUrl) return;
    const link = document.createElement('a');
    link.href = resultUrl;
    link.download = resultFileName;
    link.click();
    statusMessage.textContent = '처리된 이미지를 다운로드했습니다.';
  });

  copyButton.addEventListener('click', () => {
    if (!resultSummary) return;
    window.copyText(resultSummary, '이미지 처리 정보를 복사했습니다.');
  });

  shareButton.addEventListener('click', async () => {
    if (!resultBlob) return;
    const imageFile = new File([resultBlob], resultFileName, { type: resultBlob.type });
    if (navigator.share && navigator.canShare?.({ files: [imageFile] })) {
      try {
        await navigator.share({ title: '생활계산소 이미지 처리 결과', text: resultSummary, files: [imageFile] });
        return;
      } catch (error) {
        if (error?.name === 'AbortError') return;
      }
    }
    window.copyText(resultSummary, '이 브라우저는 이미지 파일 공유를 지원하지 않아 처리 정보를 복사했습니다. 이미지를 다운로드해 공유해 주세요.');
  });

  form.addEventListener('reset', () => {
    try { localStorage.removeItem(storageKey); } catch (_) {}
    setTimeout(() => {
      clearErrors();
      clearResult();
      revokeUrl(sourceUrl);
      sourceUrl = '';
      sourceImage = null;
      selectedFile.textContent = '선택된 파일 없음';
      widthInput.disabled = true;
      heightInput.disabled = true;
      qualityInput.value = '82';
      updateQuality();
    }, 0);
  });

  window.addEventListener('beforeunload', () => { revokeUrl(sourceUrl); revokeUrl(resultUrl); });
  restoreSettings();
  updateQuality();
})();
