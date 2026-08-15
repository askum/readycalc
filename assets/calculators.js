(() => {
  'use strict';
  const form = document.querySelector('[data-calculator]');
  if (!form) return;

  const type = form.dataset.calculator;
  const resultEmpty = document.querySelector('[data-result-empty]');
  const resultContent = document.querySelector('[data-result-content]');
  const resultValue = document.querySelector('[data-result-value]');
  const resultList = document.querySelector('[data-result-list]');
  const resultNote = document.querySelector('[data-result-note]');
  const resultCopy = document.querySelector('[data-copy-result]');
  const shareButton = document.querySelector('[data-share-result]');
  const persistentTypes = new Set([
    'chicken', 'company-drinks', 'pizza', 'packing-list', 'currency-exchange',
    'travel-budget', 'international-cost'
  ]);
  const storageKey = `living-calc-inputs:${type}`;
  let shareText = '';

  const scrollToResultOnMobile = () => {
    if (!window.matchMedia('(max-width: 899px)').matches) return;
    const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    requestAnimationFrame(() => {
      resultContent.closest('.result-panel')?.scrollIntoView({ behavior, block: 'start' });
    });
  };

  form.querySelectorAll('.error').forEach((error) => {
    error.setAttribute('role', 'status');
    error.setAttribute('aria-live', 'polite');
  });

  const won = (value) => `${Math.round(value).toLocaleString('ko-KR')}원`;
  const num = (name) => Number(form.elements[name]?.value);
  const value = (name) => String(form.elements[name]?.value || '').trim();
  const fmt = (value, unit = '') => `${Number(value.toFixed(1)).toLocaleString('ko-KR')}${unit}`;
  const escapeHtml = (text) => String(text).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const labelText = (name) => form.querySelector(`label[for="${form.elements[name]?.id}"]`)?.textContent || name;

  const clearErrors = () => {
    form.querySelectorAll('[aria-invalid="true"]').forEach((el) => el.removeAttribute('aria-invalid'));
    form.querySelectorAll('.error').forEach((el) => { el.textContent = ''; });
  };
  const invalidate = (name, message) => {
    const input = form.elements[name];
    if (!input) return false;
    input.setAttribute('aria-invalid', 'true');
    const error = document.getElementById(`${input.id}-error`);
    if (error) error.textContent = message;
    return false;
  };
  const range = (name, min, max) => {
    if (String(form.elements[name]?.value ?? '').trim() === '') return invalidate(name, `${labelText(name)}을(를) 입력해 주세요.`);
    const n = num(name);
    if (!Number.isFinite(n) || n < min || n > max) return invalidate(name, `${labelText(name)}은(는) ${min}~${max} 범위로 입력해 주세요.`);
    return true;
  };
  const show = (headline, items, note, options = {}) => {
    resultValue.textContent = headline;
    resultList.innerHTML = items.map(([key, val]) => `<li><span>${escapeHtml(key)}</span><strong>${escapeHtml(val)}</strong></li>`).join('');
    resultNote.textContent = note;
    resultEmpty.hidden = true;
    resultContent.hidden = false;
    shareText = options.shareText || [`[생활계산소] ${document.querySelector('h1').textContent}`, headline, ...items.map(([k, v]) => `${k}: ${v}`), note].join('\n');
    if (options.updateUrl !== false) {
      const params = new URLSearchParams();
      [...form.elements].forEach((el) => {
        if (el.name && el.type !== 'submit' && el.type !== 'button' && String(el.value).trim() !== '') params.set(el.name, el.value);
      });
      history.replaceState(null, '', `${location.pathname}?${params.toString()}`);
    } else {
      history.replaceState(null, '', location.pathname);
    }
    resultContent.focus({ preventScroll: true });
  };
  const showCustom = (headline, html, note, customShareText) => {
    resultValue.textContent = headline;
    resultList.innerHTML = `<li class="result-custom">${html}</li>`;
    resultNote.textContent = note;
    resultEmpty.hidden = true;
    resultContent.hidden = false;
    shareText = customShareText;
    history.replaceState(null, '', location.pathname);
    resultContent.focus({ preventScroll: true });
  };

  const calculators = {
    meat() {
      if (![range('adults', 0, 100), range('children', 0, 100), range('meals', 1, 10)].every(Boolean)) return;
      const adults = num('adults'); const children = num('children');
      if (adults + children < 1) return invalidate('adults', '전체 인원은 1명 이상이어야 합니다.');
      const factor = Number(value('appetite'));
      const grams = (adults * 250 + children * 150) * num('meals') * factor;
      show(fmt(grams / 1000, 'kg'), [['600g 팩 기준', `${Math.ceil(grams / 600)}팩`], ['1인·1끼 평균', fmt(grams / (adults + children) / num('meals'), 'g')], ['여유분 포함 여부', factor > 1 ? '넉넉하게 포함' : factor < 1 ? '가볍게 계산' : '표준']], '부위가 여러 가지라면 총량을 삼겹살 60%, 목살 40%처럼 나눠 준비해 보세요.');
    },
    fuel() {
      if (![range('distance', 1, 10000), range('efficiency', 1, 50), range('price', 500, 5000), range('toll', 0, 1000000), range('people', 1, 100)].every(Boolean)) return;
      const liters = num('distance') / num('efficiency');
      const fuelCost = liters * num('price'); const total = fuelCost + num('toll');
      show(won(total), [['예상 연료량', fmt(liters, 'L')], ['순수 주유비', won(fuelCost)], ['통행료 포함', won(total)], ['1인당 분담액', won(total / num('people'))]], '실제 연비와 유가, 우회·정체 상황에 따라 달라질 수 있습니다.');
    },
    camping() {
      if (![range('adults', 0, 30), range('children', 0, 30), range('nights', 1, 14)].every(Boolean)) return;
      const people = num('adults') + num('children');
      if (people < 1) return invalidate('adults', '전체 인원은 1명 이상이어야 합니다.');
      const eq = num('adults') + num('children') * .6;
      const meals = num('nights') * 2 + 1; const factor = Number(value('style'));
      const rice = eq * meals * 180 * factor; const meat = eq * meals * 200 * factor;
      const water = people * (num('nights') + 1) * 2 * factor;
      show(`${people}명 · ${meals}끼`, [['쌀', fmt(rice / 1000, 'kg')], ['고기·단백질', fmt(meat / 1000, 'kg')], ['생수', fmt(water, 'L')], ['라면 비상식', `${Math.ceil(eq * .7)}개`]], '반찬·간식은 취향 차이가 커서 별도로 추가하고, 식수와 세척용 물을 구분해 준비하세요.');
    },
    drinks() {
      if (![range('guests', 1, 1000), range('hours', 1, 24)].every(Boolean)) return;
      const guests = num('guests'); const hours = num('hours'); const weather = Number(value('weather'));
      const beverage = guests * (.6 + Math.max(0, hours - 2) * .15) * weather;
      const cans = Math.ceil(beverage / .355); const ice = guests * .45 * weather;
      show(`${fmt(beverage, 'L')} 준비`, [['355mL 캔 기준', `${cans}캔`], ['얼음', fmt(ice, 'kg')], ['500mL 생수', `${Math.ceil(guests * .8 * weather)}병`], ['예비분', '계산값에 약 10% 반영']], '주류는 참석자 연령과 행사 성격을 확인해 별도로 계산하고, 얼음은 음료용과 보냉용을 나눠 담으세요.');
    },
    chicken() {
      if (![range('adults', 0, 100), range('children', 0, 100)].every(Boolean)) return;
      const adults = num('adults'); const children = num('children');
      if (adults + children < 1) return invalidate('adults', '전체 인원은 1명 이상이어야 합니다.');
      const occasion = value('occasion');
      const adultPortion = occasion === 'meal' ? .5 : .32;
      const childPortion = occasion === 'meal' ? .28 : .18;
      const ratioFactor = Number(value('genderRatio'));
      const alcoholFactor = value('alcohol') === 'yes' ? 1.1 : 1;
      const rawChickens = (adults * adultPortion + children * childPortion) * ratioFactor * alcoholFactor;
      const chickens = Math.max(1, Math.ceil(rawChickens));
      const pieces = chickens * 10;
      const varieties = Math.min(chickens, chickens >= 4 ? 3 : chickens >= 2 ? 2 : 1);
      show(`${chickens}마리`, [['계산상 필요량', `${fmt(rawChickens, '마리')}`], ['약 10조각 기준', `${pieces}조각 내외`], ['추천 맛 구성', `${varieties}종류`], ['1인당 예상', `${fmt(pieces / (adults + children), '조각')}`]], '닭 크기와 브랜드별 조각 수가 다르므로, 다른 메뉴가 거의 없거나 식사량이 큰 모임은 1마리를 추가로 고려하세요.', { updateUrl: false });
    },
    'company-drinks'() {
      if (![range('guests', 1, 200), range('drinkers', 0, 200), range('hours', 1, 8)].every(Boolean)) return;
      const guests = num('guests'); const drinkers = num('drinkers');
      if (drinkers > guests) return invalidate('drinkers', '음주 인원은 전체 참석 인원보다 많을 수 없습니다.');
      const pace = value('pace'); const drink = value('drink');
      const paceIndex = { light: 0, normal: 1, lively: 2 }[pace] ?? 1;
      const timeFactor = 1 + Math.max(0, num('hours') - 2) * .22;
      const sojuRates = [0.45, 0.7, 1];
      const beerRates = [0.8, 1.25, 1.8];
      let soju = 0; let beer = 0;
      if (drink === 'soju') soju = drinkers * sojuRates[paceIndex] * timeFactor;
      if (drink === 'beer') beer = drinkers * beerRates[paceIndex] * timeFactor;
      if (drink === 'mixed') {
        soju = drinkers * sojuRates[paceIndex] * .7 * timeFactor;
        beer = drinkers * beerRates[paceIndex] * .65 * timeFactor;
      }
      const sojuBottles = Math.ceil(soju); const beerBottles = Math.ceil(beer);
      const headline = drink === 'soju' ? `소주 ${sojuBottles}병` : drink === 'beer' ? `맥주 ${beerBottles}병` : `소주 ${sojuBottles}병 · 맥주 ${beerBottles}병`;
      const items = [];
      if (sojuBottles) items.push(['소주 360mL', `${sojuBottles}병`]);
      if (beerBottles) items.push(['맥주 500mL', `${beerBottles}병`]);
      items.push(['생수 500mL', `${Math.max(guests, Math.ceil(guests * num('hours') / 2))}병`]);
      items.push(['무알코올 음료', `${Math.ceil(guests * .5)}병·캔 내외`]);
      show(headline, items, '표시량은 구매 계획을 위한 상한선이 아닌 일반적인 준비 추정치입니다. 음주를 강요하지 말고 귀가 수단과 충분한 물·식사를 먼저 준비하세요.', { updateUrl: false });
    },
    pizza() {
      if (![range('adults', 0, 100), range('children', 0, 100)].every(Boolean)) return;
      const adults = num('adults'); const children = num('children');
      if (adults + children < 1) return invalidate('adults', '전체 인원은 1명 이상이어야 합니다.');
      const occasion = value('occasion');
      const adultSlices = occasion === 'meal' ? 3 : 1.8;
      const childSlices = occasion === 'meal' ? 2 : 1.2;
      const ratioFactor = Number(value('genderRatio'));
      const sideFactor = Number(value('sideMenu'));
      const rawSlices = (adults * adultSlices + children * childSlices) * ratioFactor * sideFactor;
      const slices = Math.ceil(rawSlices);
      const pizzas = Math.max(1, Math.ceil(slices / 8));
      const leftover = pizzas * 8 - slices;
      const varieties = Math.min(pizzas, pizzas >= 4 ? 3 : pizzas >= 2 ? 2 : 1);
      show(`${pizzas}판`, [['8조각 피자 기준', `${pizzas * 8}조각`], ['계산상 필요량', `${slices}조각`], ['예상 여유분', `${leftover}조각`], ['추천 맛 구성', `${varieties}종류`]], '브랜드와 피자 크기에 따라 한 판의 지름과 조각 크기가 다릅니다. 주문 전 해당 매장의 조각 수와 사이드 메뉴 양을 확인하세요.', { updateUrl: false });
    },
    'packing-list'() {
      if (!range('days', 1, 60)) return;
      const days = num('days'); const overseas = value('destination') === 'overseas';
      const season = value('season'); const purpose = value('purpose'); const laundry = value('laundry') === 'yes';
      const tops = laundry ? Math.min(days, 4) : days;
      const bottoms = Math.max(1, Math.ceil(days / (laundry ? 3 : 2)));
      const underwear = laundry ? Math.min(days + 1, 5) : days + 1;
      const categories = [
        ['필수 서류·결제', [overseas ? '여권과 여권 사본' : '신분증', '교통·숙소 예약 확인서', '지갑과 결제 카드', overseas ? '여행자보험 증서' : '비상 연락처']],
        ['의류', [`상의 ${tops}벌`, `하의 ${bottoms}벌`, `속옷 ${underwear}벌`, `양말 ${underwear}켤레`, '잠옷 1벌', season === 'winter' ? '두꺼운 외투·장갑·목도리' : season === 'summer' ? '얇은 겉옷·모자' : '간절기 겉옷 1벌']],
        ['전자기기', ['휴대전화와 충전기', '보조배터리', overseas ? '여행용 멀티 어댑터' : '충전 케이블', '이어폰']],
        ['세면·건강', ['칫솔·치약', '기초 화장품과 자외선 차단제', '개인 복용약', '휴지·물티슈', '작은 구급용품']],
        ['여행 상황별', purpose === 'beach' ? ['수영복', '방수 가방', '슬리퍼', '비치타월'] : purpose === 'business' ? ['업무용 노트북', '명함·업무 서류', '정장 또는 단정한 옷', '구두'] : purpose === 'outdoor' ? ['편한 운동화', '우비', '물병', '휴대용 랜턴'] : ['편한 신발', '접이식 가방', '우산', '간단한 간식']]
      ];
      if (overseas) categories.push(['해외여행 추가', ['현지 통화 또는 해외 결제 카드', 'eSIM·유심 준비', '항공편 온라인 체크인', '대사관·영사관 연락처']]);
      const checkedKey = 'living-calc-checklist:packing-list';
      let checked = new Set();
      try { checked = new Set(JSON.parse(localStorage.getItem(checkedKey) || '[]')); } catch (_) {}
      const allItems = categories.flatMap(([, items]) => items);
      const html = `<div class="checklist-groups">${categories.map(([category, items]) => `<section class="checklist-group"><h3>${escapeHtml(category)}</h3>${items.map((item) => `<label class="checklist-item"><input type="checkbox" data-check-item="${escapeHtml(item)}"${checked.has(item) ? ' checked' : ''}><span>${escapeHtml(item)}</span></label>`).join('')}</section>`).join('')}</div>`;
      const packingLines = categories.flatMap(([category, items]) => ['', `[${category}]`, ...items.map((item) => `□ ${item}`)]);
      const packingShare = ['[생활계산소] 여행 짐 체크리스트', `${days}일 · ${overseas ? '해외여행' : '국내여행'}`, ...packingLines].join('\n');
      showCustom(`${allItems.length}개 준비`, html, '체크 상태는 현재 브라우저에만 저장됩니다. 항공기 반입 금지 물품과 수하물 규정은 이용 항공사에서 별도로 확인하세요.', packingShare);
      const updateProgress = () => {
        const boxes = [...resultList.querySelectorAll('[data-check-item]')];
        const completed = boxes.filter((box) => box.checked);
        resultValue.textContent = `${completed.length}/${boxes.length}개 완료`;
        try { localStorage.setItem(checkedKey, JSON.stringify(completed.map((box) => box.dataset.checkItem))); } catch (_) {}
      };
      resultList.querySelectorAll('[data-check-item]').forEach((box) => box.addEventListener('change', updateProgress));
      updateProgress();
    },
    'currency-exchange'() {
      if (![range('krw', 1, 1000000000), range('rate', .0001, 10000000), range('unit', 1, 1000), range('spread', 0, 20), range('discount', 0, 100), range('fixedFee', 0, 1000000)].every(Boolean)) return;
      if (num('fixedFee') >= num('krw')) return invalidate('fixedFee', '고정 수수료는 환전할 원화보다 작아야 합니다.');
      const code = value('currency'); const unit = num('unit');
      const available = num('krw') - num('fixedFee');
      const spreadRate = num('spread') / 100 * (1 - num('discount') / 100);
      const appliedRate = num('rate') * (1 + spreadRate);
      const foreign = available / appliedRate * unit;
      const noFeeForeign = num('krw') / num('rate') * unit;
      show(`${foreign.toLocaleString('ko-KR', { maximumFractionDigits: 2 })} ${code}`, [[`적용 환율 (${unit} ${code})`, `${appliedRate.toLocaleString('ko-KR', { maximumFractionDigits: 4 })}원`], ['수수료 전 예상', `${noFeeForeign.toLocaleString('ko-KR', { maximumFractionDigits: 2 })} ${code}`], ['환율 스프레드 반영', `${(spreadRate * 100).toFixed(3)}%`], ['고정 수수료', won(num('fixedFee'))]], '실제 수령액은 금융기관의 현찰 매매율, 권종, 최소 수수료와 반올림 방식에 따라 달라질 수 있습니다.', { updateUrl: false });
    },
    'travel-budget'() {
      if (![range('people', 1, 100), range('days', 1, 365), range('nights', 0, 364), range('transport', 0, 100000000), range('lodging', 0, 100000000), range('food', 0, 10000000), range('activities', 0, 10000000), range('other', 0, 1000000000), range('reserve', 0, 100)].every(Boolean)) return;
      if (num('nights') > num('days')) return invalidate('nights', '숙박일은 여행 일수보다 많을 수 없습니다.');
      const people = num('people'); const days = num('days');
      const transport = num('transport') * people;
      const lodging = num('lodging') * num('nights');
      const food = num('food') * people * days;
      const activities = num('activities') * people * days;
      const base = transport + lodging + food + activities + num('other');
      const reserve = base * num('reserve') / 100; const total = base + reserve;
      show(won(total), [['교통비 합계', won(transport)], ['숙박비 합계', won(lodging)], ['식비·활동비', won(food + activities)], ['예비비', won(reserve)], ['1인당 예산', won(total / people)], ['하루 평균', won(total / days)]], '실제 가격 변동과 현장 추가 비용을 고려해 계산 결과와 별도로 비상 결제 수단을 준비하세요.', { updateUrl: false });
    },
    'international-cost'() {
      if (![range('people', 1, 100), range('days', 1, 365), range('nights', 0, 364), range('flight', 0, 100000000), range('lodgingLocal', 0, 100000000), range('dailyLocal', 0, 10000000), range('exchangeRate', .0001, 10000000), range('quoteUnit', 1, 1000), range('cardRatio', 0, 100), range('cardFee', 0, 10), range('insurance', 0, 10000000), range('connectivity', 0, 10000000)].every(Boolean)) return;
      if (num('nights') > num('days')) return invalidate('nights', '숙박일은 여행 일수보다 많을 수 없습니다.');
      const people = num('people'); const days = num('days');
      const local = num('lodgingLocal') * num('nights') + num('dailyLocal') * people * days;
      const localKrw = local / num('quoteUnit') * num('exchangeRate');
      const cardLocal = local * num('cardRatio') / 100;
      const cardFeeKrw = cardLocal / num('quoteUnit') * num('exchangeRate') * num('cardFee') / 100;
      const flights = num('flight') * people;
      const fixed = (num('insurance') + num('connectivity')) * people;
      const total = flights + localKrw + cardFeeKrw + fixed;
      show(won(total), [['항공권 합계', won(flights)], ['현지 지출 원화 환산', won(localKrw)], ['예상 해외결제 수수료', won(cardFeeKrw)], ['보험·통신', won(fixed)], ['1인당 총경비', won(total / people)], ['현지통화 필요액', local.toLocaleString('ko-KR', { maximumFractionDigits: 2 })]], '환율은 직접 입력한 값으로 고정 계산됩니다. 카드사 환율 적용일과 해외서비스 수수료, 현금 인출 수수료에 따라 실제 청구액이 달라집니다.', { updateUrl: false });
    },
    boxes() {
      if (![range('people', 1, 20), range('rooms', 1, 20), range('years', 0, 50)].every(Boolean)) return;
      const factor = Number(value('amount'));
      const boxes = Math.ceil((num('people') * 8 + num('rooms') * 6 + num('years') * 1.5) * factor);
      show(`${boxes}개`, [['소형 박스 권장', `${Math.ceil(boxes * .35)}개`], ['중형 박스 권장', `${Math.ceil(boxes * .5)}개`], ['대형 박스 권장', `${Math.max(0, boxes - Math.ceil(boxes * .35) - Math.ceil(boxes * .5))}개`], ['완충재', `${Math.ceil(boxes / 5)}롤 내외`]], '책과 식기는 작은 박스에, 침구와 옷은 큰 박스에 담아 한 상자가 지나치게 무거워지지 않게 하세요.');
    },
    expenses() {
      const names = value('names').split(',').map((s) => s.trim()).filter(Boolean);
      if (names.length < 2 || names.length > 30) return invalidate('names', '이름을 쉼표로 구분해 2~30명 입력해 주세요.');
      if (new Set(names).size !== names.length) return invalidate('names', '중복되지 않는 이름을 입력해 주세요.');
      const paid = Object.fromEntries(names.map((name) => [name, 0]));
      const lines = value('payments').split('\n').map((s) => s.trim()).filter(Boolean);
      if (!lines.length) return invalidate('payments', '결제 내역을 한 줄 이상 입력해 주세요.');
      for (const [i, line] of lines.entries()) {
        const split = line.split(','); const payer = split[0]?.trim(); const amount = Number(split[1]?.replace(/[^0-9.-]/g, ''));
        if (!(payer in paid) || !Number.isFinite(amount) || amount <= 0) return invalidate('payments', `${i + 1}번째 줄을 “이름, 금액” 형식으로 확인해 주세요.`);
        paid[payer] += amount;
      }
      const total = Object.values(paid).reduce((a, b) => a + b, 0); const share = total / names.length;
      const creditors = names.map((name) => [name, paid[name] - share]).filter(([, d]) => d > .5).sort((a,b) => b[1]-a[1]);
      const debtors = names.map((name) => [name, share - paid[name]]).filter(([, d]) => d > .5).sort((a,b) => b[1]-a[1]);
      const transfers = []; let i = 0; let j = 0;
      while (i < debtors.length && j < creditors.length) {
        const amount = Math.min(debtors[i][1], creditors[j][1]);
        transfers.push(`${debtors[i][0]} → ${creditors[j][0]} ${won(amount)}`);
        debtors[i][1] -= amount; creditors[j][1] -= amount;
        if (debtors[i][1] < 1) i++; if (creditors[j][1] < 1) j++;
      }
      const participantLines = names.map((name) => `${name}: 최종 부담액 ${won(share)} (결제 ${won(paid[name])})`);
      const transferLines = transfers.length ? transfers : ['추가 송금 없음'];
      const expenseShareText = [
        '[생활계산소] 여행 경비 분배 결과',
        `총 경비: ${won(total)}`,
        `1인당 최종 부담액: ${won(share)}`,
        '',
        '[참가자별 최종 부담액]',
        ...participantLines,
        '',
        '[송금할 내역]',
        ...transferLines,
        '',
        '원 단위 반올림으로 실제 송금 합계에 몇 원의 차이가 생길 수 있습니다.'
      ].join('\n');
      show(`1인당 ${won(share)}`, [['총 경비', won(total)], ['참여 인원', `${names.length}명`], ['정산 방법', transfers.length ? transfers.join(' / ') : '추가 송금 없음']], '원 단위 반올림으로 실제 송금 합계에 몇 원의 차이가 생길 수 있습니다.', { updateUrl: false, shareText: expenseShareText });
    },
    teams() {
      const names = value('names').split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);
      if (names.length < 2 || names.length > 200) return invalidate('names', '이름을 2~200명 입력해 주세요.');
      if (new Set(names).size !== names.length) return invalidate('names', '중복된 이름이 있습니다. 구분할 수 있게 수정해 주세요.');
      if (!range('count', 2, Math.min(20, names.length))) return;
      const shuffled = [...names];
      for (let i = shuffled.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; }
      const teams = Array.from({ length: num('count') }, () => []);
      shuffled.forEach((name, i) => teams[i % teams.length].push(name));
      const html = teams.map((team, i) => `<section class="team"><h3>${i + 1}팀</h3><ol>${team.map((name) => `<li>${escapeHtml(name)}</li>`).join('')}</ol></section>`).join('');
      resultValue.textContent = `${teams.length}개 팀 완성`;
      resultList.innerHTML = `<li class="team-columns" style="display:grid">${html}</li>`;
      resultNote.textContent = '다시 배정 버튼을 누르면 순서가 새로 섞입니다.';
      resultEmpty.hidden = true; resultContent.hidden = false; resultContent.focus({ preventScroll: true });
      shareText = [`[생활계산소] 랜덤 팀 배정`, ...teams.map((team, i) => `${i + 1}팀: ${team.join(', ')}`)].join('\n');
      history.replaceState(null, '', `${location.pathname}?count=${num('count')}`);
    }
  };

  const restoreQuery = () => {
    const params = new URLSearchParams(location.search);
    let restored = false;
    params.forEach((val, key) => { if (form.elements[key]) { form.elements[key].value = val; restored = true; } });
    return restored;
  };

  const saveInputs = () => {
    if (!persistentTypes.has(type)) return;
    try {
      const saved = {};
      [...form.elements].forEach((el) => {
        if (el.name && el.type !== 'submit' && el.type !== 'button') saved[el.name] = el.value;
      });
      localStorage.setItem(storageKey, JSON.stringify(saved));
    } catch (_) {}
  };

  const restoreSavedInputs = () => {
    if (!persistentTypes.has(type)) return false;
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
      let restored = false;
      Object.entries(saved).forEach(([name, savedValue]) => {
        if (form.elements[name]) { form.elements[name].value = savedValue; restored = true; }
      });
      return restored;
    } catch (_) { return false; }
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault(); clearErrors(); saveInputs(); calculators[type]?.();
    const invalidInput = form.querySelector('[aria-invalid="true"]');
    if (invalidInput) invalidInput.focus();
    else if (!resultContent.hidden) scrollToResultOnMobile();
  });
  form.addEventListener('input', saveInputs);
  form.addEventListener('change', saveInputs);
  form.addEventListener('reset', () => {
    if (persistentTypes.has(type)) {
      try { localStorage.removeItem(storageKey); } catch (_) {}
      if (type === 'packing-list') {
        try { localStorage.removeItem('living-calc-checklist:packing-list'); } catch (_) {}
      }
    }
    setTimeout(() => { clearErrors(); resultEmpty.hidden = false; resultContent.hidden = true; history.replaceState(null, '', location.pathname); }, 0);
  });
  resultCopy?.addEventListener('click', () => window.copyText(shareText, '결과를 복사했습니다.'));
  shareButton?.addEventListener('click', async () => {
    if (persistentTypes.has(type) && navigator.share) {
      try {
        await navigator.share({ title: document.title, text: shareText, url: `${location.origin}${location.pathname}` });
        return;
      } catch (error) {
        if (error?.name === 'AbortError') return;
      }
    }
    if (persistentTypes.has(type)) return window.copyText(shareText, '공유할 결과를 복사했습니다.');
    window.copyText(location.href, '입력값이 담긴 주소를 복사했습니다.');
  });
  if (type === 'expenses') {
    if (location.search) history.replaceState(null, '', location.pathname);
  } else if (persistentTypes.has(type)) {
    if (location.search) history.replaceState(null, '', location.pathname);
    restoreSavedInputs();
  } else if (restoreQuery() && type !== 'teams') {
    form.requestSubmit();
  }
})();
