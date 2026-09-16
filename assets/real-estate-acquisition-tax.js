(() => {
  'use strict';

  const LABELS = {
    cause: { purchase: '유상취득(매매)', gift: '무상취득(증여)', inheritance: '상속', original: '원시취득' },
    propertyType: { house: '주택', officetel: '오피스텔', farmland: '농지', other: '그 밖의 부동산' },
    houseCount: { one: '취득 후 1주택', temporaryTwo: '일시적 2주택 특례 확인', two: '취득 후 2주택', three: '취득 후 3주택', fourPlus: '취득 후 4주택 이상' }
  };

  const normalHouseRate = (taxBase) => {
    if (taxBase <= 600000000) return 1;
    if (taxBase <= 900000000) return (taxBase * 2 / 300000000) - 3;
    return 3;
  };

  const purchaseHouseRate = ({ taxBase, houseCount, regulated, corporate }) => {
    if (corporate) return { rate: 12, kind: 'heavy', reason: '법인의 주택 유상취득 12% 중과' };
    if (houseCount === 'fourPlus') return { rate: 12, kind: 'heavy', reason: '취득 후 4주택 이상 12% 중과' };
    if (houseCount === 'three') {
      return regulated
        ? { rate: 12, kind: 'heavy', reason: '조정대상지역 취득 후 3주택 12% 중과' }
        : { rate: 8, kind: 'heavy', reason: '비조정대상지역 취득 후 3주택 8% 중과' };
    }
    if (houseCount === 'two' && regulated) return { rate: 8, kind: 'heavy', reason: '조정대상지역 취득 후 2주택 8% 중과' };
    const rate = normalHouseRate(taxBase);
    return {
      rate,
      kind: 'normal',
      reason: houseCount === 'temporaryTwo' ? '일시적 2주택 특례를 전제로 일반세율 적용' : '주택 유상취득 일반세율 적용'
    };
  };

  const ancillaryRates = ({ propertyType, area, rate, kind, cause, inheritedOneHome }) => {
    const isHouse = propertyType === 'house';
    const overNationalHousingSize = isHouse && area > 85;
    if (cause === 'purchase' && isHouse) {
      if (kind === 'heavy') {
        return { educationRate: 0.4, ruralRate: overNationalHousingSize ? (rate === 8 ? 0.6 : 1) : 0 };
      }
      return { educationRate: rate / 10, ruralRate: overNationalHousingSize ? 0.2 : 0 };
    }
    if (cause === 'purchase') {
      return propertyType === 'farmland'
        ? { educationRate: 0.2, ruralRate: 0.2 }
        : { educationRate: 0.4, ruralRate: 0.2 };
    }
    if (cause === 'gift') {
      if (isHouse && kind === 'heavy') return { educationRate: 0.4, ruralRate: overNationalHousingSize ? 1 : 0 };
      return { educationRate: 0.3, ruralRate: isHouse ? (overNationalHousingSize ? 0.2 : 0) : 0.2 };
    }
    if (cause === 'inheritance') {
      if (propertyType === 'farmland') return { educationRate: 0.06, ruralRate: 0.2 };
      return { educationRate: inheritedOneHome ? 0.16 : 0.16, ruralRate: isHouse ? (overNationalHousingSize ? 0.2 : 0) : 0.2 };
    }
    return { educationRate: 0.16, ruralRate: isHouse ? (overNationalHousingSize ? 0.2 : 0) : 0.2 };
  };

  const baseRateFor = (input) => {
    if (input.cause === 'purchase') {
      if (input.propertyType === 'house') return purchaseHouseRate(input);
      if (input.propertyType === 'farmland') return { rate: 3, kind: 'normal', reason: '농지 유상취득 일반세율' };
      return { rate: 4, kind: 'normal', reason: '주택 외 부동산 유상취득 일반세율' };
    }
    if (input.cause === 'gift') {
      if (input.propertyType === 'house' && input.giftRateMode === 'heavy') {
        return { rate: 12, kind: 'heavy', reason: '조정대상지역 고가주택 증여 중과 선택' };
      }
      return { rate: 3.5, kind: 'normal', reason: '일반 무상취득 세율' };
    }
    if (input.cause === 'inheritance') {
      if (input.propertyType === 'farmland') return { rate: 2.3, kind: 'normal', reason: '농지 상속 세율' };
      if (input.propertyType === 'house' && input.inheritedOneHome) return { rate: 0.8, kind: 'special', reason: '무주택자의 상속 1주택 특례 선택' };
      return { rate: 2.8, kind: 'normal', reason: '농지 외 부동산 상속 세율' };
    }
    return { rate: 2.8, kind: 'normal', reason: '원시취득 세율' };
  };

  const calculate = (input) => {
    const taxBase = Number(input.taxBase);
    const area = Number(input.area || 0);
    if (!Number.isFinite(taxBase) || taxBase <= 0) throw new RangeError('과세표준은 1원 이상이어야 합니다.');
    if (!Number.isFinite(area) || area < 0) throw new RangeError('전용면적은 0㎡ 이상이어야 합니다.');
    const baseRule = baseRateFor({ ...input, taxBase, area });
    const ancillary = ancillaryRates({ ...input, area, rate: baseRule.rate, kind: baseRule.kind });
    const acquisitionTaxBeforeReduction = Math.floor(taxBase * baseRule.rate / 100);

    let reduction = 0;
    let reductionNote = '';
    const firstHomeMode = input.firstHomeMode || 'none';
    if (firstHomeMode !== 'none') {
      const eligibleType = input.cause === 'purchase' && input.propertyType === 'house' && !input.corporate;
      if (!eligibleType) {
        reductionNote = '선택한 취득 유형은 생애최초 주택 취득세 감면 자동 적용 대상이 아닙니다.';
      } else if (taxBase > 1200000000) {
        reductionNote = '취득가액이 12억원을 초과해 생애최초 감면을 적용하지 않았습니다.';
      } else {
        const cap = firstHomeMode === 'special' ? 3000000 : 2000000;
        reduction = Math.min(acquisitionTaxBeforeReduction, cap);
        reductionNote = firstHomeMode === 'special'
          ? '사용자가 최대 300만원 특례 요건 충족을 확인한 것으로 가정했습니다.'
          : '사용자가 생애최초 감면 요건 충족을 확인한 것으로 가정했습니다.';
      }
    }

    const acquisitionTax = Math.max(0, acquisitionTaxBeforeReduction - reduction);
    const educationTax = Math.floor(taxBase * ancillary.educationRate / 100);
    const ruralTax = Math.floor(taxBase * ancillary.ruralRate / 100);
    return {
      taxBase,
      area,
      acquisitionRate: baseRule.rate,
      educationRate: ancillary.educationRate,
      ruralRate: ancillary.ruralRate,
      acquisitionTaxBeforeReduction,
      reduction,
      acquisitionTax,
      educationTax,
      ruralTax,
      total: acquisitionTax + educationTax + ruralTax,
      ruleKind: baseRule.kind,
      rateReason: baseRule.reason,
      reductionNote
    };
  };

  globalThis.ReadyToolsAcquisitionTaxRules = { LABELS, normalHouseRate, purchaseHouseRate, ancillaryRates, baseRateFor, calculate };

  const doc = typeof document === 'undefined' ? null : document;
  const form = doc?.querySelector('[data-acquisition-tax-calculator]');
  if (!form) return;

  const resultEmpty = doc.querySelector('[data-result-empty]');
  const resultContent = doc.querySelector('[data-result-content]');
  const resultValue = doc.querySelector('[data-result-value]');
  const resultList = doc.querySelector('[data-result-list]');
  const resultNote = doc.querySelector('[data-result-note]');
  const fields = {
    houseOnly: [...doc.querySelectorAll('[data-house-only]')],
    purchaseHouse: [...doc.querySelectorAll('[data-purchase-house]')],
    giftHouse: [...doc.querySelectorAll('[data-gift-house]')],
    inheritanceHouse: [...doc.querySelectorAll('[data-inheritance-house]')]
  };
  let resultText = '';

  const won = (value) => `${Math.floor(value).toLocaleString('ko-KR')}원`;
  const percent = (value) => `${Number(value.toFixed(4)).toLocaleString('ko-KR', { maximumFractionDigits: 4 })}%`;
  const escapeHtml = (text) => String(text).replace(/[&<>"']/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
  const parseMoney = (field) => Number(field.value.replaceAll(',', '').trim());
  const formatMoneyInput = (field) => {
    const raw = field.value.replaceAll(',', '').replace(/\D/g, '');
    field.value = raw ? raw.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '';
  };
  const setVisible = (container, visible) => {
    container.hidden = !visible;
    container.querySelectorAll('input, select').forEach((control) => { control.disabled = !visible; });
  };
  const clearErrors = () => {
    form.querySelectorAll('[aria-invalid="true"]').forEach((control) => control.removeAttribute('aria-invalid'));
    form.querySelectorAll('.error').forEach((error) => { error.textContent = ''; });
  };
  const showError = (field, message) => {
    field.setAttribute('aria-invalid', 'true');
    const error = doc.getElementById(`${field.id}-error`);
    if (error) error.textContent = message;
  };
  const updateFields = () => {
    const cause = form.elements.cause.value;
    const propertyType = form.elements.propertyType.value;
    const isHouse = propertyType === 'house';
    fields.houseOnly.forEach((field) => setVisible(field, isHouse));
    fields.purchaseHouse.forEach((field) => setVisible(field, cause === 'purchase' && isHouse));
    fields.giftHouse.forEach((field) => setVisible(field, cause === 'gift' && isHouse));
    fields.inheritanceHouse.forEach((field) => setVisible(field, cause === 'inheritance' && isHouse));
    const taxBaseLabel = doc.querySelector('[data-tax-base-label]');
    const taxBaseHint = doc.querySelector('[data-tax-base-hint]');
    if (cause === 'purchase') {
      taxBaseLabel.textContent = '실제 취득가액·부대비용 포함 과세표준(원)';
      taxBaseHint.textContent = '실제 취득가격에 법정 부대비용을 더한 과세표준을 입력하세요.';
    } else if (cause === 'gift') {
      taxBaseLabel.textContent = '인정시가액 등 증여 과세표준(원)';
      taxBaseHint.textContent = '매매사례가액·감정가액 등 인정시가액을 우선 확인하세요.';
    } else if (cause === 'inheritance') {
      taxBaseLabel.textContent = '상속 부동산 시가표준액 등 과세표준(원)';
      taxBaseHint.textContent = '상속 취득 과세표준은 신고기관에서 확인한 금액을 입력하세요.';
    } else {
      taxBaseLabel.textContent = '원시취득 과세표준(원)';
      taxBaseHint.textContent = '신축 등 원시취득에 실제로 들어간 법정 과세표준을 입력하세요.';
    }
  };

  form.querySelectorAll('[data-money-input]').forEach((field) => {
    formatMoneyInput(field);
    field.addEventListener('input', () => formatMoneyInput(field));
  });
  form.elements.cause.addEventListener('change', updateFields);
  form.elements.propertyType.addEventListener('change', updateFields);
  updateFields();

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    clearErrors();
    const taxBase = parseMoney(form.elements.taxBase);
    if (!form.elements.taxBase.value.trim() || !Number.isFinite(taxBase) || taxBase < 1 || taxBase > 100000000000000) {
      showError(form.elements.taxBase, '1원 이상 100조원 이하의 과세표준을 입력해 주세요.');
    }
    const area = Number(form.elements.area.value);
    if (form.elements.propertyType.value === 'house' && (!Number.isFinite(area) || area <= 0 || area > 10000)) {
      showError(form.elements.area, '0보다 크고 10,000㎡ 이하인 전용면적을 입력해 주세요.');
    }
    if (form.querySelector('[aria-invalid="true"]')) {
      form.querySelector('[aria-invalid="true"]').focus();
      return;
    }

    const input = {
      cause: form.elements.cause.value,
      propertyType: form.elements.propertyType.value,
      taxBase,
      area: form.elements.propertyType.value === 'house' ? area : 0,
      houseCount: form.elements.houseCount?.value || 'one',
      regulated: Boolean(form.elements.regulated?.checked),
      corporate: Boolean(form.elements.corporate?.checked),
      giftRateMode: form.elements.giftRateMode?.value || 'standard',
      inheritedOneHome: Boolean(form.elements.inheritedOneHome?.checked),
      firstHomeMode: form.elements.firstHomeMode?.value || 'none'
    };
    const result = calculate(input);
    const items = [
      ['취득 원인', LABELS.cause[input.cause]],
      ['부동산 유형', LABELS.propertyType[input.propertyType]],
      ['과세표준', won(result.taxBase)],
      ['적용 기준', result.rateReason],
      ['취득세율', percent(result.acquisitionRate)],
      ['감면 전 취득세', won(result.acquisitionTaxBeforeReduction)]
    ];
    if (result.reduction > 0) items.push(['생애최초 감면 예상액', `-${won(result.reduction)}`]);
    items.push(
      ['예상 취득세', won(result.acquisitionTax)],
      [`지방교육세 (${percent(result.educationRate)})`, won(result.educationTax)],
      [`농어촌특별세 (${percent(result.ruralRate)})`, won(result.ruralTax)],
      ['예상 합계', won(result.total)]
    );
    resultValue.textContent = `${won(result.total)} 예상 합계`;
    resultList.innerHTML = items.map(([label, value]) => `<li><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></li>`).join('');
    const notes = [
      '부가세목은 전용면적과 중과 여부를 반영한 참고값입니다. 세대의 주택 수 판정, 취득일, 특례·감면 사후요건에 따라 달라질 수 있습니다.',
      result.reductionNote,
      result.reduction > 0 ? '생애최초 감면 선택 시 지방교육세·농어촌특별세의 감면·비과세 조정은 신고기관에서 최종 확인하세요.' : ''
    ].filter(Boolean);
    resultNote.textContent = notes.join(' ');
    resultText = ['[생활계산소] 부동산 취득세 계산 결과', ...items.map(([label, value]) => `${label}: ${value}`), ...notes].join('\n');
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
    if (resultText) window.copyText(resultText, '취득세 계산 결과를 복사했습니다.');
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
    window.copyText(resultText, '공유할 취득세 계산 결과를 복사했습니다.');
  });
})();
