(() => {
  'use strict';

  const REGIONS = [
    '서울특별시', '부산광역시', '대구광역시', '인천광역시', '광주광역시', '대전광역시',
    '울산광역시', '세종특별자치시', '경기도', '강원특별자치도', '충청북도', '충청남도',
    '전북특별자치도', '전라남도', '경상북도', '경상남도', '제주특별자치도'
  ];

  const HOUSE_RULES = {
    sale: [
      { below: 50000000, rate: 0.6, cap: 250000, band: '5천만원 미만' },
      { below: 200000000, rate: 0.5, cap: 800000, band: '5천만원 이상 2억원 미만' },
      { below: 900000000, rate: 0.4, cap: null, band: '2억원 이상 9억원 미만' },
      { below: 1200000000, rate: 0.5, cap: null, band: '9억원 이상 12억원 미만' },
      { below: 1500000000, rate: 0.6, cap: null, band: '12억원 이상 15억원 미만' },
      { below: Infinity, rate: 0.7, cap: null, band: '15억원 이상' }
    ],
    lease: [
      { below: 50000000, rate: 0.5, cap: 200000, band: '5천만원 미만' },
      { below: 100000000, rate: 0.4, cap: 300000, band: '5천만원 이상 1억원 미만' },
      { below: 600000000, rate: 0.3, cap: null, band: '1억원 이상 6억원 미만' },
      { below: 1200000000, rate: 0.4, cap: null, band: '6억원 이상 12억원 미만' },
      { below: 1500000000, rate: 0.5, cap: null, band: '12억원 이상 15억원 미만' },
      { below: Infinity, rate: 0.6, cap: null, band: '15억원 이상' }
    ]
  };

  const PROPERTY_LABELS = {
    house: '주택·주택 부속토지·주택분양권',
    officetel: '요건을 모두 충족하는 오피스텔',
    other: '토지·상가·공장·요건 미충족 오피스텔 등'
  };

  const transactionAmount = ({ transaction, price = 0, deposit = 0, monthlyRent = 0 }) => {
    if (transaction === 'sale') return { amount: price, multiplier: null };
    if (transaction === 'jeonse') return { amount: deposit, multiplier: null };
    const hundredValue = deposit + monthlyRent * 100;
    const multiplier = hundredValue < 50000000 ? 70 : 100;
    return { amount: deposit + monthlyRent * multiplier, multiplier };
  };

  const ruleFor = ({ propertyType, transaction, amount }) => {
    const transactionGroup = transaction === 'sale' ? 'sale' : 'lease';
    if (propertyType === 'house') return HOUSE_RULES[transactionGroup].find((rule) => amount < rule.below);
    if (propertyType === 'officetel') {
      return { rate: transactionGroup === 'sale' ? 0.5 : 0.4, cap: null, band: '별도 금액 구간 없음' };
    }
    return { rate: 0.9, cap: null, band: '별도 금액 구간 없음' };
  };

  const calculate = (input) => {
    const converted = transactionAmount(input);
    const rule = ruleFor({ ...input, amount: converted.amount });
    const agreedRate = input.agreedRate === null || input.agreedRate === undefined || input.agreedRate === ''
      ? rule.rate
      : Number(input.agreedRate);
    if (!Number.isFinite(agreedRate) || agreedRate < 0 || agreedRate > rule.rate) throw new RangeError('협의요율은 상한요율 이내여야 합니다.');
    const maximumFee = Math.min(Math.floor(converted.amount * rule.rate / 100), rule.cap ?? Infinity);
    const negotiatedFee = Math.min(Math.floor(converted.amount * agreedRate / 100), rule.cap ?? Infinity);
    const vatRate = Number(input.vatRate || 0);
    if (!Number.isFinite(vatRate) || vatRate < 0 || vatRate > 100) throw new RangeError('부가세율을 확인해 주세요.');
    const vat = Math.floor(negotiatedFee * vatRate / 100);
    return {
      transactionAmount: converted.amount,
      rentMultiplier: converted.multiplier,
      maximumRate: rule.rate,
      agreedRate,
      cap: rule.cap,
      band: rule.band,
      maximumFee,
      negotiatedFee,
      vatRate,
      vat,
      total: negotiatedFee + vat,
      propertyLabel: PROPERTY_LABELS[input.propertyType]
    };
  };

  globalThis.ReadyToolsBrokerageRules = { REGIONS, HOUSE_RULES, transactionAmount, ruleFor, calculate };

  const doc = typeof document === 'undefined' ? null : document;
  const form = doc?.querySelector('[data-brokerage-calculator]');
  if (!form) return;

  const resultEmpty = doc.querySelector('[data-result-empty]');
  const resultContent = doc.querySelector('[data-result-content]');
  const resultValue = doc.querySelector('[data-result-value]');
  const resultList = doc.querySelector('[data-result-list]');
  const resultNote = doc.querySelector('[data-result-note]');
  const regionNote = doc.querySelector('[data-region-note]');
  const saleField = doc.querySelector('[data-sale-field]');
  const rentalFields = [...doc.querySelectorAll('[data-rental-field]')];
  const monthlyField = doc.querySelector('[data-monthly-field]');
  const customVatField = doc.querySelector('[data-custom-vat-field]');
  let resultText = '';

  const parseNumber = (field) => Number(String(field.value).replaceAll(',', '').trim());
  const won = (value) => `${Math.floor(value).toLocaleString('ko-KR')}원`;
  const percent = (value) => `${Number(value.toFixed(3)).toLocaleString('ko-KR', { maximumFractionDigits: 3 })}%`;
  const escapeHtml = (text) => String(text).replace(/[&<>"']/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
  const formatMoneyInput = (field) => {
    const raw = field.value.replaceAll(',', '').replace(/\D/g, '');
    field.value = raw ? raw.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '';
  };
  const setFieldVisibility = (container, visible) => {
    container.hidden = !visible;
    container.querySelectorAll('input, select').forEach((field) => { field.disabled = !visible; });
  };
  const clearErrors = () => {
    form.querySelectorAll('[aria-invalid="true"]').forEach((field) => field.removeAttribute('aria-invalid'));
    form.querySelectorAll('.error').forEach((error) => { error.textContent = ''; });
  };
  const showError = (field, message) => {
    field.setAttribute('aria-invalid', 'true');
    const error = doc.getElementById(`${field.id}-error`);
    if (error) error.textContent = message;
  };
  const requireMoney = (field, { allowZero = false } = {}) => {
    const value = parseNumber(field);
    if (!field.value.trim() || !Number.isFinite(value) || value < (allowZero ? 0 : 1) || value > 10000000000000) {
      showError(field, allowZero ? '0원 이상 10조원 이하로 입력해 주세요.' : '1원 이상 10조원 이하로 입력해 주세요.');
      return false;
    }
    return true;
  };

  const updateFields = () => {
    const transaction = form.elements.transaction.value;
    setFieldVisibility(saleField, transaction === 'sale');
    rentalFields.forEach((field) => setFieldVisibility(field, transaction !== 'sale'));
    setFieldVisibility(monthlyField, transaction === 'monthly');
    setFieldVisibility(customVatField, form.elements.vatMode.value === 'custom');
  };

  const updateRegionNote = () => {
    regionNote.textContent = `${form.elements.region.value}에 있는 중개사무소 기준으로 확인합니다. 현재 계산에는 전국 공통 상한 구간표를 적용합니다.`;
  };

  form.querySelectorAll('[data-money-input]').forEach((field) => {
    formatMoneyInput(field);
    field.addEventListener('input', () => formatMoneyInput(field));
  });
  form.elements.transaction.addEventListener('change', updateFields);
  form.elements.vatMode.addEventListener('change', updateFields);
  form.elements.region.addEventListener('change', updateRegionNote);
  updateFields();
  updateRegionNote();

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    clearErrors();
    const transaction = form.elements.transaction.value;
    const checks = [];
    if (transaction === 'sale') checks.push(requireMoney(form.elements.price));
    if (transaction === 'jeonse') checks.push(requireMoney(form.elements.deposit));
    if (transaction === 'monthly') {
      checks.push(requireMoney(form.elements.deposit, { allowZero: true }));
      checks.push(requireMoney(form.elements.monthlyRent));
    }

    const agreedRaw = form.elements.agreedRate.value.trim();
    const agreedRate = agreedRaw === '' ? null : Number(agreedRaw);
    if (agreedRate !== null && (!Number.isFinite(agreedRate) || agreedRate < 0 || agreedRate > 0.9)) {
      showError(form.elements.agreedRate, '0~0.9% 범위로 입력해 주세요.');
      checks.push(false);
    }
    let vatRate = Number(form.elements.vatMode.value);
    if (form.elements.vatMode.value === 'custom') {
      vatRate = Number(form.elements.customVat.value);
      if (!Number.isFinite(vatRate) || vatRate < 0 || vatRate > 100) {
        showError(form.elements.customVat, '0~100% 범위로 입력해 주세요.');
        checks.push(false);
      }
    }
    if (checks.includes(false)) {
      form.querySelector('[aria-invalid="true"]')?.focus();
      return;
    }

    const input = {
      region: form.elements.region.value,
      propertyType: form.elements.propertyType.value,
      transaction,
      price: transaction === 'sale' ? parseNumber(form.elements.price) : 0,
      deposit: transaction !== 'sale' ? parseNumber(form.elements.deposit) : 0,
      monthlyRent: transaction === 'monthly' ? parseNumber(form.elements.monthlyRent) : 0,
      agreedRate,
      vatRate
    };

    let result;
    try {
      result = calculate(input);
    } catch (error) {
      showError(form.elements.agreedRate, error.message);
      form.elements.agreedRate.focus();
      return;
    }

    const transactionLabel = form.elements.transaction.selectedOptions[0].textContent;
    const capText = result.cap ? won(result.cap) : '별도 한도액 없음';
    const rentFormula = result.rentMultiplier
      ? `보증금 + (월세 × ${result.rentMultiplier})`
      : transaction === 'sale' ? '입력한 매매·교환 거래금액' : '입력한 전세보증금';
    const items = [
      ['적용 지역', `${input.region} 중개사무소 기준`],
      ['대상·거래', `${result.propertyLabel} · ${transactionLabel}`],
      ['중개보수 거래금액', won(result.transactionAmount)],
      ['거래금액 산식', rentFormula],
      ['적용 금액 구간', result.band],
      ['법정 상한요율', percent(result.maximumRate)],
      ['구간 한도액', capText],
      ['법정 상한액', won(result.maximumFee)],
      ['계산 적용요율', percent(result.agreedRate)],
      ['예상 중개보수', won(result.negotiatedFee)],
      [`부가세 참고 (${percent(result.vatRate)})`, won(result.vat)],
      ['예상 합계', won(result.total)]
    ];
    resultValue.textContent = `${won(result.total)} 예상 합계`;
    resultList.innerHTML = items.map(([label, value]) => `<li><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></li>`).join('');
    resultNote.textContent = '상한액은 최대 받을 수 있는 범위이며 실제 보수는 그 안에서 협의합니다. 계약 전 중개사무소 게시 요율, 사업자 과세유형과 최신 지역 조례를 확인하세요.';
    resultText = [
      '[생활계산소] 부동산 중개보수 계산 결과',
      ...items.map(([label, value]) => `${label}: ${value}`),
      resultNote.textContent
    ].join('\n');
    resultEmpty.hidden = true;
    resultContent.hidden = false;
    resultContent.focus({ preventScroll: true });
    if (matchMedia('(max-width: 899px)').matches) {
      requestAnimationFrame(() => resultContent.closest('.result-panel').scrollIntoView({
        behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        block: 'start'
      }));
    }
  });

  doc.querySelector('[data-copy-result]')?.addEventListener('click', () => {
    if (resultText) window.copyText(resultText, '중개보수 계산 결과를 복사했습니다.');
  });
  doc.querySelector('[data-share-result]')?.addEventListener('click', async () => {
    if (!resultText) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: doc.title, text: resultText, url: location.origin + location.pathname });
        return;
      } catch (error) {
        if (error.name === 'AbortError') return;
      }
    }
    window.copyText(resultText, '공유할 계산 결과를 복사했습니다.');
  });
})();
