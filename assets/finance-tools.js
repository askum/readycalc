(() => {
  'use strict';
  const form = document.querySelector('[data-new-tool]'); if (!form) return;
  const type = form.dataset.newTool; if (!['loan-calculator','compound-interest','inflation-calculator','roi-calculator'].includes(type)) return;
  const resultEmpty = document.querySelector('[data-result-empty]'); const resultContent = document.querySelector('[data-result-content]'); const resultValue = document.querySelector('[data-result-value]'); const resultList = document.querySelector('[data-result-list]'); const resultNote = document.querySelector('[data-result-note]'); let resultText = '';
  const number = (name) => Number(String(form.elements[name].value).replaceAll(',', '').trim());
  const won = (value) => Math.round(value).toLocaleString('ko-KR') + '원';
  const percent = (value) => Number(value.toFixed(2)).toLocaleString('ko-KR', { maximumFractionDigits: 2 }) + '%';
  const escapeHtml = (text) => String(text).replace(/[&<>"']/g, (char) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[char]));
  const clearErrors = () => { form.querySelectorAll('[aria-invalid="true"]').forEach((field) => field.removeAttribute('aria-invalid')); form.querySelectorAll('.error').forEach((error) => { error.textContent = ''; }); };
  const valid = (name, min, max) => { const field = form.elements[name]; const value = number(name); if (!String(field.value).trim() || !Number.isFinite(value) || value < min || value > max) { field.setAttribute('aria-invalid','true'); const error = document.getElementById(field.id + '-error'); if (error) error.textContent = `${min.toLocaleString('ko-KR')}~${max.toLocaleString('ko-KR')} 범위로 입력해 주세요.`; return false; } return true; };
  const focusFirstError = () => form.querySelector('[aria-invalid="true"]')?.focus();
  const show = (headline, items, note, custom = '') => { resultValue.textContent = headline; resultList.innerHTML = custom + items.map(([label,value]) => `<li><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></li>`).join(''); resultNote.textContent = note; resultText = [`[생활계산소] ${document.querySelector('h1').textContent}`, headline, ...items.map(([label,value]) => `${label}: ${value}`), note].join('\n'); resultEmpty.hidden = true; resultContent.hidden = false; resultContent.focus({ preventScroll: true }); if (matchMedia('(max-width: 899px)').matches) requestAnimationFrame(() => resultContent.closest('.result-panel').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' })); };
  const formatGrouped = (field) => { const raw = field.value.replaceAll(',','').replace(/\D/g,''); field.value = raw ? raw.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : ''; };
  form.querySelectorAll('[data-money-input]').forEach((field) => { formatGrouped(field); field.addEventListener('input', () => formatGrouped(field)); });
  document.querySelector('[data-copy-result]')?.addEventListener('click', () => resultText && window.copyText(resultText, '계산 결과를 복사했습니다.'));
  document.querySelector('[data-share-result]')?.addEventListener('click', async () => { if (!resultText) return; if (navigator.share) { try { await navigator.share({ title: document.title, text: resultText, url: location.origin + location.pathname }); return; } catch (error) { if (error.name === 'AbortError') return; } } window.copyText(resultText, '공유할 결과를 복사했습니다.'); });

  if (type === 'loan-calculator') form.addEventListener('submit', (event) => {
    event.preventDefault(); clearErrors(); if (![valid('principal',10000,100000000000),valid('rate',0,100),valid('years',0.08,50)].every(Boolean)) return focusFirstError();
    const principal = number('principal'); const monthlyRate = number('rate') / 1200; const months = Math.max(1, Math.round(number('years') * 12)); const method = form.elements.method.value; let first; let last; let totalInterest; let label;
    if (method === 'equal-payment') { const payment = monthlyRate === 0 ? principal / months : principal * monthlyRate * (1 + monthlyRate) ** months / ((1 + monthlyRate) ** months - 1); first = last = payment; totalInterest = payment * months - principal; label = '원리금균등'; }
    else if (method === 'equal-principal') { const principalPart = principal / months; first = principalPart + principal * monthlyRate; last = principalPart + principalPart * monthlyRate; totalInterest = monthlyRate * principal * (months + 1) / 2; label = '원금균등'; }
    else { first = principal * monthlyRate; last = principal + first; totalInterest = first * months; label = '만기일시상환'; }
    const total = principal + totalInterest; const average = total / months;
    show(method === 'equal-payment' ? won(first) + ' / 월' : won(first) + ' / 첫 달', [['상환 방식',label],['상환 개월',months.toLocaleString('ko-KR') + '개월'],['첫 달 예상 상환금',won(first)],['마지막 달 예상 상환금',won(last)],['월평균 상환액',won(average)],['총 이자',won(totalInterest)],['총 상환액',won(total)]], '금리 고정·수수료 없음으로 계산한 참고치입니다. 실제 금융기관의 일수 계산, 중도상환수수료와 우대금리에 따라 달라집니다.');
  });

  if (type === 'compound-interest') form.addEventListener('submit', (event) => {
    event.preventDefault(); clearErrors(); if (![valid('initial',0,100000000000),valid('monthly',0,1000000000),valid('rate',-99,100),valid('years',1,60)].every(Boolean)) return focusFirstError();
    const initial = number('initial'); const monthly = number('monthly'); const annualRate = number('rate'); const years = Math.round(number('years')); const monthlyRate = annualRate / 1200; let balance = initial; let contributed = initial; const rows = [];
    for (let month = 1; month <= years * 12; month += 1) { balance = balance * (1 + monthlyRate) + monthly; contributed += monthly; if (month % 12 === 0) rows.push([month / 12, contributed, balance, balance - contributed]); }
    const profit = balance - contributed; const table = `<li class="result-custom"><div class="table-scroll"><table><caption>연도별 예상 자산 변화</caption><thead><tr><th scope="col">연도</th><th scope="col">투자원금</th><th scope="col">예상자산</th><th scope="col">예상수익</th></tr></thead><tbody>${rows.map(([year,base,total,gain]) => `<tr><th scope="row">${year}년</th><td>${won(base)}</td><td>${won(total)}</td><td>${won(gain)}</td></tr>`).join('')}</tbody></table></div></li>`;
    show(won(balance), [['최종 예상자산',won(balance)],['투자원금',won(contributed)],['예상수익',won(profit)],['적용 연수익률',percent(annualRate)],['투자기간',years + '년']], '월말 추가 투자와 월복리를 가정한 세전·수수료 차감 전 추정치이며 수익률은 보장되지 않습니다.', table);
  });

  if (type === 'inflation-calculator') form.addEventListener('submit', (event) => {
    event.preventDefault(); clearErrors(); if (![valid('amount',1,100000000000),valid('rate',-50,100),valid('years',1,100)].every(Boolean)) return focusFirstError();
    const amount = number('amount'); const rate = number('rate') / 100; const years = Math.round(number('years')); const factor = (1 + rate) ** years; const needed = amount * factor; const futureValue = amount / factor; const lost = amount - futureValue;
    show(won(needed), [['현재 금액',won(amount)],['동일 구매력에 필요한 미래 금액',won(needed)],['현재 금액의 미래 구매력',won(futureValue)],['구매력 변화',won(-lost)],['남는 구매력',percent(100 / factor)]], '매년 같은 물가상승률이 복리로 이어진다는 가정입니다. 실제 품목별 가격과 공식 소비자물가지수는 다르게 움직일 수 있습니다.');
  });

  if (type === 'roi-calculator') form.addEventListener('submit', (event) => {
    event.preventDefault(); clearErrors(); if (![valid('investment',1,100000000000),valid('finalValue',0,1000000000000),valid('cost',0,100000000000),valid('years',0.01,100)].every(Boolean)) return focusFirstError();
    const investment = number('investment'); const finalValue = number('finalValue'); const cost = number('cost'); const years = number('years'); const totalCost = investment + cost; const profit = finalValue - totalCost; const roi = profit / totalCost * 100; const annualized = ((finalValue / totalCost) ** (1 / years) - 1) * 100;
    show(percent(roi) + ' ROI', [['총 투입금',won(totalCost)],['최종 평가금',won(finalValue)],['순수익',won(profit)],['단순 ROI',percent(roi)],['연환산 수익률',percent(annualized)],['투자기간',Number(years.toFixed(2)).toLocaleString('ko-KR') + '년']], '현금흐름이 시작과 종료 시점에 한 번씩 발생한다고 단순화한 세전·수수료 차감 전 결과입니다. 중간 입출금이 있으면 IRR 계산이 필요합니다.');
  });
})();
