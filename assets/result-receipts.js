(() => {
  'use strict';

  const personality = document.querySelector('[data-personality-test]');
  const emoji = document.querySelector('[data-new-tool="emoji-picker"]');
  const form = document.querySelector('[data-calculator], [data-utility], [data-image-tool], [data-new-tool], [data-acquisition-tax-calculator], [data-brokerage-calculator], [data-developer-tool] form') || personality;
  let result = document.querySelector('[data-result-content], [data-image-result]') || personality?.querySelector('[data-test-result]');
  if (emoji && !result) {
    result = document.createElement('div');
    result.className = 'result-content';
    result.hidden = true;
    result.innerHTML = '<span class="result-kicker">선택한 이모지</span><div class="result-value" data-result-value></div><ul class="result-list" data-result-list></ul>';
    emoji.after(result);
    emoji.querySelector('[data-emoji-grid]')?.addEventListener('click', (event) => {
      const button = event.target.closest('[data-emoji]');
      if (!button) return;
      result.querySelector('[data-result-value]').textContent = button.dataset.emoji;
      result.querySelector('[data-result-list]').innerHTML = '';
      const item = document.createElement('li');
      const label = document.createElement('span'); label.textContent = '이름';
      const value = document.createElement('strong'); value.textContent = button.getAttribute('aria-label')?.replace(/ 복사$/, '') || '이모지';
      item.append(label, value);
      result.querySelector('[data-result-list]').append(item);
      result.hidden = false;
    });
  }
  if (!form || !result || form.dataset.utility === 'password') return;

  const resultValue = result.querySelector('[data-result-value], [data-image-result-value]');
  const resultList = result.querySelector('[data-result-list], [data-image-result-list]');
  const pageTitle = document.querySelector('h1')?.textContent.trim() || '계산 결과';
  const chartType = personality ? 'personality' : form.dataset.calculator || form.dataset.newTool || (location.pathname.includes('real-estate-acquisition-tax') ? 'acquisition-tax' : location.pathname.includes('real-estate-brokerage-fee') ? 'brokerage-fee' : '');
  const chartTypes = new Set(['travel-budget', 'expenses', 'subscription-split', 'acquisition-tax', 'brokerage-fee', 'personality', 'fuel', 'international-cost', 'overseas-duty', 'loan-calculator', 'compound-interest', 'invoice-generator', 'boxes', 'teams', 'pet-treat-yield', 'pizza', 'cake-size', 'roi-calculator']);
  const color = ['#187b5e', '#eeaa42', '#5177d6', '#dd786f', '#8a69ba', '#4c9ca9'];
  const number = (raw) => Number(String(raw ?? '').replace(/[^0-9.-]/g, '')) || 0;
  const money = (amount) => `${Math.round(amount).toLocaleString('ko-KR')}원`;
  let chart;
  let chartVersion = 0;
  let renderQueued = false;
  const loaded = new Map();

  const loadScript = (path, globalName) => {
    if (globalThis[globalName]) return Promise.resolve(globalThis[globalName]);
    if (!loaded.has(path)) loaded.set(path, new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = path;
      script.async = true;
      script.onload = () => globalThis[globalName] ? resolve(globalThis[globalName]) : reject(new Error('라이브러리를 불러오지 못했습니다.'));
      script.onerror = () => reject(new Error('라이브러리를 불러오지 못했습니다.'));
      document.head.append(script);
    }));
    return loaded.get(path);
  };

  result.classList.add('receipt-card');
  const header = document.createElement('div');
  header.className = 'receipt-header';
  header.innerHTML = '<strong>생활계산소 <span>Ready Tools</span></strong><span>계산 결과 요약</span>';
  result.prepend(header);
  const title = document.createElement('p');
  title.className = 'receipt-tool-title';
  title.textContent = pageTitle;
  header.after(title);
  const stamp = document.createElement('p');
  stamp.className = 'receipt-stamp';
  result.append(stamp);
  const footer = document.createElement('p');
  footer.className = 'receipt-footer';
  footer.textContent = '생활계산소 · 참고용 결과 · readytools.kr';
  result.append(footer);

  const actions = document.createElement('div');
  actions.className = 'button-row receipt-actions';
  actions.dataset.html2canvasIgnore = '';
  actions.innerHTML = '<button class="button button-secondary" type="button" data-save-receipt>결과 이미지 저장</button><button class="button button-secondary" type="button" data-copy-receipt>이미지 복사</button>';
  result.append(actions);
  const ignoreExistingActions = () => result.querySelectorAll('.button-row:not(.receipt-actions), .test-actions').forEach((row) => { row.dataset.html2canvasIgnore = ''; });
  ignoreExistingActions();

  let chartArea;
  let chartCanvas;
  let chartLegend;
  if (chartTypes.has(chartType)) {
    chartArea = document.createElement('section');
    chartArea.className = 'receipt-chart';
    chartArea.hidden = true;
    chartArea.innerHTML = '<h2>결과 구성비</h2><div class="receipt-chart-layout"><div class="receipt-chart-canvas"><canvas role="img"></canvas></div><ul class="receipt-chart-legend"></ul></div>';
    chartCanvas = chartArea.querySelector('canvas');
    chartLegend = chartArea.querySelector('ul');
    if (personality) result.append(chartArea);
    else (resultList || resultValue).after(chartArea);
  }

  const input = (name) => number(form.elements[name]?.value);
  const fromList = (fragment) => {
    const row = [...(resultList?.querySelectorAll('li') || [])].find((item) => item.querySelector('span')?.textContent.includes(fragment));
    return number(row?.querySelector('strong')?.textContent);
  };
  const chartData = () => {
    if (chartType === 'personality') {
      const rows = [...result.querySelectorAll('.score-row')];
      return { title: '성향별 응답 점수 비율', labels: rows.map((row) => row.querySelector('.score-label')?.textContent || '성향'), values: rows.map((row) => number(row.querySelector('.score-value')?.textContent)), unit: '점' };
    }
    if (chartType === 'travel-budget') {
      const people = input('people'); const days = input('days');
      const values = [input('transport') * people, input('lodging') * input('nights'), input('food') * people * days, input('activities') * people * days, input('other')];
      values.push(values.reduce((sum, value) => sum + value, 0) * input('reserve') / 100);
      return { title: '총 여행 예산의 항목별 비율', labels: ['교통비', '숙박비', '식비', '활동비', '기타', '예비비'], values };
    }
    if (chartType === 'expenses') {
      const names = String(form.elements.names?.value || '').split(',').map((name) => name.trim()).filter(Boolean);
      const paid = Object.fromEntries(names.map((name) => [name, 0]));
      String(form.elements.payments?.value || '').split('\n').forEach((line) => {
        const comma = line.indexOf(',');
        if (comma < 0) return;
        const name = line.slice(0, comma).trim();
        if (Object.hasOwn(paid, name)) paid[name] += number(line.slice(comma + 1));
      });
      return { title: '참가자별 선결제 금액 비율', labels: names, values: names.map((name) => paid[name]) };
    }
    if (chartType === 'subscription-split') {
      const labels = []; const values = [];
      for (let index = 1; index <= 3; index++) {
        if (!form.elements[`sub${index}Enabled`]?.checked) continue;
        labels.push(form.elements[`sub${index}Name`]?.value.trim() || `서비스 ${index}`);
        values.push(form.elements[`sub${index}Policy`]?.value === 'individual' ? input(`sub${index}Current`) : input(`sub${index}Shared`) / input(`sub${index}Members`));
      }
      return { title: '조정 후 내 월 구독료 구성', labels, values };
    }
    if (chartType === 'acquisition-tax') return { title: '예상 세액 구성', labels: ['취득세', '지방교육세', '농어촌특별세'], values: [fromList('예상 취득세'), fromList('지방교육세 ('), fromList('농어촌특별세 (')] };
    if (chartType === 'brokerage-fee') return { title: '예상 비용 구성', labels: ['중개보수', '부가세 참고'], values: [fromList('예상 중개보수'), fromList('부가세 참고')] };
    if (chartType === 'fuel') return { title: '운행비 구성', labels: ['주유비', '통행료'], values: [fromList('순수 주유비'), Math.max(0, number(resultValue?.textContent) - fromList('순수 주유비'))] };
    if (chartType === 'international-cost') return { title: '해외여행 예상 비용 구성', labels: ['항공권', '현지 지출', '카드 수수료', '보험·통신'], values: ['항공권 합계', '현지 지출 원화 환산', '예상 해외결제 수수료', '보험·통신'].map(fromList) };
    if (chartType === 'overseas-duty') return { title: '예상 관부가세 구성', labels: ['관세', '부가세'], values: [fromList('예상 관세'), fromList('예상 부가세')] };
    if (chartType === 'loan-calculator') return { title: '총 상환액 구성', labels: ['대출 원금', '총 이자'], values: [input('principal'), fromList('총 이자')] };
    if (chartType === 'compound-interest') return { title: '최종 예상자산 구성', labels: ['투자원금', '예상수익'], values: [fromList('투자원금'), fromList('예상수익')] };
    if (chartType === 'invoice-generator') {
      const cells = [...result.querySelectorAll('[data-invoice-preview] tfoot tr')];
      return { title: '청구 예정액 구성', labels: ['공급가액', '부가세'], values: cells.slice(0, 2).map((row) => number(row.querySelector('td')?.textContent)) };
    }
    if (chartType === 'boxes') return { title: '이사 박스 권장 구성', labels: ['소형', '중형', '대형'], values: ['소형 박스 권장', '중형 박스 권장', '대형 박스 권장'].map(fromList), unit: '개' };
    if (chartType === 'teams') {
      const teams = [...(resultList?.querySelectorAll('.team') || [])];
      return { title: '팀별 인원 구성', labels: teams.map((team) => team.querySelector('h3')?.textContent || '팀'), values: teams.map((team) => team.querySelectorAll('ol li').length), unit: '명' };
    }
    if (chartType === 'pet-treat-yield') return { title: '건조 전후 중량 구성', labels: ['완성 중량', '줄어든 중량'], values: [number(resultValue?.textContent), fromList('예상 중량 감소')], unit: 'g' };
    if (chartType === 'pizza') return { title: '피자 조각 구성', labels: ['필요 조각', '여유 조각'], values: [fromList('계산상 필요량'), fromList('예상 여유분')], unit: '조각' };
    if (chartType === 'cake-size') return { title: '케이크 조각 구성', labels: ['필요 조각', '여유 조각'], values: [fromList('필요 조각 수'), fromList('추천 구성의 여유')], unit: '조각' };
    if (chartType === 'roi-calculator') return { title: '최종 평가금 구성', labels: ['총 투입금', '순수익'], values: [fromList('총 투입금'), fromList('순수익')] };
    return null;
  };

  const drawChart = async () => {
    const version = ++chartVersion;
    const data = chartData();
    if (!data || result.hidden) return;
    const parts = data.labels.map((label, index) => ({ label, value: data.values[index] })).filter(({ value }) => Number.isFinite(value) && value > 0);
    if (parts.length < 2) { chartArea.hidden = true; chart?.destroy(); chart = null; return; }
    chartArea.hidden = false;
    chartArea.querySelector('h2').textContent = data.title;
    const total = parts.reduce((sum, part) => sum + part.value, 0);
    const formatValue = (value) => data.unit ? `${Number(value.toFixed(1)).toLocaleString('ko-KR')}${data.unit}` : money(value);
    chartLegend.replaceChildren(...parts.map(({ label, value }, index) => {
      const item = document.createElement('li');
      const swatch = document.createElement('i'); swatch.style.backgroundColor = color[index % color.length];
      const name = document.createElement('span'); name.textContent = label;
      const amount = document.createElement('strong'); amount.textContent = `${formatValue(value)} · ${(value / total * 100).toFixed(1)}%`;
      item.append(swatch, name, amount);
      return item;
    }));
    chartCanvas.setAttribute('aria-label', `${data.title}: ${parts.map(({ label, value }) => `${label} ${formatValue(value)}`).join(', ')}`);
    try {
      const Chart = await loadScript('/assets/vendor/chart-umd.js', 'Chart');
      if (result.hidden || version !== chartVersion) return;
      chart?.destroy();
      chart = new Chart(chartCanvas, {
        type: 'doughnut',
        data: { labels: parts.map((part) => part.label), datasets: [{ data: parts.map((part) => part.value), backgroundColor: parts.map((_, index) => color[index % color.length]), borderWidth: 2, borderColor: '#fff' }] },
        options: { responsive: true, maintainAspectRatio: false, animation: false, cutout: '68%', plugins: { legend: { display: false }, tooltip: { callbacks: { label: (context) => `${context.label}: ${formatValue(context.parsed)} (${(context.parsed / total * 100).toFixed(1)}%)` } } } }
      });
    } catch (error) { chartArea.querySelector('h2').textContent = `${data.title} (숫자 목록)`; }
  };

  const textOutput = result.querySelector('textarea[readonly]');
  let outputPreview;
  if (textOutput) {
    textOutput.dataset.html2canvasIgnore = '';
    outputPreview = document.createElement('pre');
    outputPreview.className = 'receipt-output';
    textOutput.closest('.field')?.after(outputPreview);
  }

  const refresh = () => {
    if (personality) {
      if (header.parentNode !== result) result.prepend(header);
      if (title.parentNode !== result) header.after(title);
      if (chartArea && chartArea.parentNode !== result) (result.querySelector('.score-bars') || title).after(chartArea);
      if (stamp.parentNode !== result) result.append(stamp);
      if (footer.parentNode !== result) result.append(footer);
      if (actions.parentNode !== result) result.append(actions);
      ignoreExistingActions();
    }
    if (result.hidden) { chartVersion++; chart?.destroy(); chart = null; if (chartArea) chartArea.hidden = true; return; }
    stamp.textContent = `생성일 ${new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date())}`;
    if (outputPreview) {
      const value = textOutput.value;
      outputPreview.textContent = value.length > 1600 ? `${value.slice(0, 1600)}\n… 이미지에는 처음 1,600자만 표시됩니다. 전체 내용은 텍스트 복사를 이용하세요.` : value;
    }
    if (chartArea) void drawChart();
  };
  const queueRefresh = () => {
    if (renderQueued) return;
    renderQueued = true;
    requestAnimationFrame(() => { renderQueued = false; refresh(); });
  };
  new MutationObserver(queueRefresh).observe(result, { attributes: true, attributeFilter: ['hidden'] });
  if (personality) new MutationObserver(queueRefresh).observe(result, { childList: true });
  if (resultList) new MutationObserver(queueRefresh).observe(resultList, { childList: true, subtree: true, characterData: true });
  if (resultValue) new MutationObserver(queueRefresh).observe(resultValue, { childList: true, characterData: true });
  if (!result.hidden) queueRefresh();

  const setStatus = (message) => {
    if (typeof window.showToast === 'function') window.showToast(message);
    else alert(message);
  };
  const imageBlob = async () => {
    if (result.hidden) throw new Error('먼저 결과를 계산해 주세요.');
    const html2canvas = await loadScript('/assets/vendor/html2canvas-min.js', 'html2canvas');
    const canvas = await html2canvas(result, {
      backgroundColor: '#ffffff', scale: Math.min(2, window.devicePixelRatio || 1), useCORS: true, scrollX: 0, scrollY: 0,
      onclone: (clonedDocument, clonedResult) => {
        const srgb = /^color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\)$/i;
        const properties = ['color', 'background-color', 'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color'];
        for (const element of [clonedResult, ...clonedResult.querySelectorAll('*')]) {
          const computed = clonedDocument.defaultView.getComputedStyle(element);
          for (const property of properties) {
            const match = computed.getPropertyValue(property).trim().match(srgb);
            if (!match) continue;
            const channels = match.slice(1, 4).map((value) => Math.round(Math.min(1, Math.max(0, Number(value))) * 255));
            element.style.setProperty(property, `rgba(${channels.join(', ')}, ${match[4] || 1})`);
          }
          element.style.boxShadow = 'none';
          element.style.textShadow = 'none';
        }
      }
    });
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!blob) throw new Error('이미지를 만들지 못했습니다.');
    return blob;
  };
  const runAction = async (button, task) => {
    button.disabled = true;
    try { await task(); }
    catch (error) { setStatus(error.message || '이미지를 만들지 못했습니다.'); }
    finally { button.disabled = false; }
  };
  actions.querySelector('[data-save-receipt]').addEventListener('click', (event) => runAction(event.currentTarget, async () => {
    const blob = await imageBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const now = new Date();
    const localDate = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');
    link.href = url; link.download = `readytools-result-${localDate}.png`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
    setStatus('결과 이미지를 저장했습니다.');
  }));
  actions.querySelector('[data-copy-receipt]').addEventListener('click', (event) => runAction(event.currentTarget, async () => {
    if (!navigator.clipboard?.write || !globalThis.ClipboardItem) throw new Error('이 브라우저는 이미지 복사를 지원하지 않습니다. 이미지 저장을 이용해 주세요.');
    const blob = await imageBlob();
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
    setStatus('결과 이미지를 클립보드에 복사했습니다.');
  }));
})();
