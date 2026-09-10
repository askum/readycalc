(() => {
  'use strict';
  const form = document.querySelector('[data-new-tool="exif-remover"]');
  if (!form) return;
  const input = form.elements.image;
  const quality = form.elements.quality;
  const qualityOutput = document.getElementById('exif-quality-output');
  const error = document.getElementById('exif-image-error');
  const status = document.querySelector('[data-exif-status]');
  const resultEmpty = document.querySelector('[data-result-empty]');
  const resultContent = document.querySelector('[data-result-content]');
  const resultValue = document.querySelector('[data-result-value]');
  const resultList = document.querySelector('[data-result-list]');
  const resultNote = document.querySelector('[data-result-note]');
  const download = document.querySelector('[data-download-result]');
  let sourceImage = null; let resultUrl = ''; let originalFile = null;

  const readAscii = (view, offset, length) => Array.from({ length }, (_, index) => String.fromCharCode(view.getUint8(offset + index))).join('');
  const inspectExif = (buffer) => {
    const view = new DataView(buffer); const found = { exif: false, gps: false, date: false, camera: false };
    if (view.byteLength < 4 || view.getUint16(0) !== 0xFFD8) return found;
    let offset = 2;
    while (offset + 4 <= view.byteLength) {
      if (view.getUint8(offset) !== 0xFF) break;
      const marker = view.getUint8(offset + 1); if (marker === 0xDA || marker === 0xD9) break;
      const length = view.getUint16(offset + 2); if (length < 2 || offset + 2 + length > view.byteLength) break;
      if (marker === 0xE1 && length >= 8 && readAscii(view, offset + 4, 6) === 'Exif\0\0') {
        found.exif = true;
        try {
          const tiff = offset + 10; const order = view.getUint16(tiff); const little = order === 0x4949;
          if (!little && order !== 0x4D4D) break;
          const u16 = (position) => view.getUint16(position, little); const u32 = (position) => view.getUint32(position, little);
          const visitIfd = (relative, depth = 0) => {
            if (!relative || depth > 2) return; const start = tiff + relative; if (start + 2 > view.byteLength) return;
            const count = Math.min(u16(start), 256);
            for (let index = 0; index < count; index += 1) {
              const entry = start + 2 + index * 12; if (entry + 12 > view.byteLength) break; const tag = u16(entry);
              if ([0x010F, 0x0110].includes(tag)) found.camera = true;
              if ([0x0132, 0x9003, 0x9004].includes(tag)) found.date = true;
              if (tag === 0x8825) { found.gps = true; visitIfd(u32(entry + 8), depth + 1); }
              if (tag === 0x8769) visitIfd(u32(entry + 8), depth + 1);
            }
          };
          visitIfd(u32(tiff + 4));
        } catch (_) {}
        break;
      }
      offset += 2 + length;
    }
    return found;
  };
  const loadImage = (file) => new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file); const image = new Image();
    image.onload = () => { URL.revokeObjectURL(url); resolve(image); }; image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('이미지를 읽을 수 없습니다.')); }; image.src = url;
  });
  const formatBytes = (bytes) => bytes < 1024 * 1024 ? (bytes / 1024).toLocaleString('ko-KR', { maximumFractionDigits: 1 }) + 'KB' : (bytes / 1024 / 1024).toLocaleString('ko-KR', { maximumFractionDigits: 2 }) + 'MB';
  const invalidate = (message) => { input.setAttribute('aria-invalid', 'true'); error.textContent = message; input.focus(); };
  const clear = () => { input.removeAttribute('aria-invalid'); error.textContent = ''; };

  quality.addEventListener('input', () => { qualityOutput.value = quality.value + '%'; qualityOutput.textContent = qualityOutput.value; });
  input.addEventListener('change', async () => {
    clear(); sourceImage = null; originalFile = input.files[0];
    if (!originalFile) return;
    if (originalFile.type !== 'image/jpeg') return invalidate('EXIF 확인과 제거를 위해 JPG 또는 JPEG 파일을 선택해 주세요.');
    if (originalFile.size > 25 * 1024 * 1024) return invalidate('25MB 이하 JPG 파일을 선택해 주세요.');
    try {
      const [buffer, image] = await Promise.all([originalFile.arrayBuffer(), loadImage(originalFile)]); sourceImage = image;
      if (image.naturalWidth * image.naturalHeight > 40000000) { sourceImage = null; return invalidate('가로×세로 4,000만 화소 이하 이미지를 선택해 주세요.'); }
      const exif = inspectExif(buffer);
      status.innerHTML = `<strong>${exif.exif ? 'EXIF 메타데이터가 발견되었습니다.' : '일반 EXIF 블록을 찾지 못했습니다.'}</strong><ul><li>GPS 위치 태그: ${exif.gps ? '발견' : '찾지 못함'}</li><li>촬영 날짜 태그: ${exif.date ? '발견' : '찾지 못함'}</li><li>카메라 제조사·모델 태그: ${exif.camera ? '발견' : '찾지 못함'}</li></ul>`;
      status.hidden = false;
    } catch (readError) { invalidate(readError.message); }
  });
  form.addEventListener('submit', (event) => {
    event.preventDefault(); clear(); if (!originalFile || !sourceImage) return invalidate('먼저 확인할 JPG 파일을 선택해 주세요.');
    const canvas = document.createElement('canvas'); canvas.width = sourceImage.naturalWidth; canvas.height = sourceImage.naturalHeight;
    canvas.getContext('2d').drawImage(sourceImage, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return invalidate('메타데이터 제거 이미지를 만들 수 없습니다.');
      if (resultUrl) URL.revokeObjectURL(resultUrl); resultUrl = URL.createObjectURL(blob);
      const name = originalFile.name.replace(/\.(jpe?g)$/i, '') + '-no-exif.jpg'; download.href = resultUrl; download.download = name;
      resultValue.textContent = '메타데이터 제거 완료';
      resultList.innerHTML = `<li><span>원본 파일</span><strong>${formatBytes(originalFile.size)}</strong></li><li><span>새 파일</span><strong>${formatBytes(blob.size)}</strong></li><li><span>이미지 크기</span><strong>${canvas.width.toLocaleString('ko-KR')} × ${canvas.height.toLocaleString('ko-KR')}px</strong></li><li><span>저장 형식</span><strong>JPG · 품질 ${quality.value}%</strong></li>`;
      resultNote.textContent = 'Canvas로 픽셀만 다시 저장해 EXIF·IPTC·XMP 등 일반 메타데이터를 제외했습니다. 원본 파일은 변경되지 않습니다.';
      resultEmpty.hidden = true; resultContent.hidden = false; resultContent.focus({ preventScroll: true });
      if (matchMedia('(max-width: 899px)').matches) resultContent.closest('.result-panel').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    }, 'image/jpeg', +quality.value / 100);
  });
  form.addEventListener('reset', () => requestAnimationFrame(() => { clear(); sourceImage = null; originalFile = null; status.hidden = true; resultEmpty.hidden = false; resultContent.hidden = true; qualityOutput.value = '92%'; qualityOutput.textContent = '92%'; if (resultUrl) URL.revokeObjectURL(resultUrl); resultUrl = ''; }));
})();
