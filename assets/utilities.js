(() => {
  'use strict';

  const form = document.querySelector('[data-utility]');
  if (!form) return;

  const type = form.dataset.utility;
  const resultEmpty = document.querySelector('[data-result-empty]');
  const resultContent = document.querySelector('[data-result-content]');
  const resultValue = document.querySelector('[data-result-value]');
  const resultList = document.querySelector('[data-result-list]');
  const resultNote = document.querySelector('[data-result-note]');
  const copyButton = document.querySelector('[data-copy-result]');
  const shareButton = document.querySelector('[data-share-result]');
  const storageKey = 'living-calc-utility-settings:' + type;
  const settingNames = {
    unit: ['category', 'fromUnit', 'toUnit'],
    date: ['mode', 'includeEnd', 'direction', 'offsetUnit'],
    qr: ['contentType', 'qrSize'],
    password: ['passwordLength', 'lowercase', 'uppercase', 'numbers', 'symbols', 'excludeAmbiguous'],
    text: ['operation']
  };
  let resultText = '';
  let shareResult = true;
  let lastQrSvg = '';

  const escapeHtml = (text) => String(text).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);

  const clearErrors = () => {
    form.querySelectorAll('[aria-invalid="true"]').forEach((element) => element.removeAttribute('aria-invalid'));
    form.querySelectorAll('.error').forEach((element) => { element.textContent = ''; });
  };

  const invalidate = (name, message) => {
    const input = form.elements[name];
    if (!input) return false;
    input.setAttribute('aria-invalid', 'true');
    const error = document.getElementById(input.id + '-error');
    if (error) error.textContent = message;
    return false;
  };

  const showResult = (headline, items, note, text, customHtml) => {
    resultValue.textContent = headline;
    resultList.innerHTML = (customHtml || '') + items.map((item) =>
      '<li><span>' + escapeHtml(item[0]) + '</span><strong>' + escapeHtml(item[1]) + '</strong></li>'
    ).join('');
    resultNote.textContent = note;
    resultText = text;
    resultEmpty.hidden = true;
    resultContent.hidden = false;
    resultContent.focus({ preventScroll: true });
  };

  const resetResult = () => {
    clearErrors();
    resultText = '';
    lastQrSvg = '';
    resultEmpty.hidden = false;
    resultContent.hidden = true;
    history.replaceState(null, '', location.pathname);
  };

  const readSavedSettings = () => {
    try { return JSON.parse(localStorage.getItem(storageKey) || '{}'); } catch (_) { return {}; }
  };

  const saveSettings = () => {
    const names = settingNames[type] || [];
    const saved = {};
    names.forEach((name) => {
      const field = form.elements[name];
      if (!field) return;
      saved[name] = field.type === 'checkbox' ? field.checked : field.value;
    });
    try { localStorage.setItem(storageKey, JSON.stringify(saved)); } catch (_) {}
  };

  const restoreSettings = (saved) => {
    Object.entries(saved).forEach(([name, savedValue]) => {
      const field = form.elements[name];
      if (!field) return;
      if (field.type === 'checkbox') field.checked = Boolean(savedValue);
      else field.value = String(savedValue);
    });
  };

  const share = async () => {
    const text = shareResult ? resultText : '생활계산소 ' + document.querySelector('h1').textContent;
    if (navigator.share) {
      try {
        await navigator.share({ title: document.title, text, url: location.origin + location.pathname });
        return;
      } catch (error) {
        if (error && error.name === 'AbortError') return;
      }
    }
    if (shareResult && resultText) window.copyText(resultText, '공유할 결과를 복사했습니다.');
    else window.copyText(location.origin + location.pathname, '도구 주소를 복사했습니다.');
  };

  const formatNumber = (number) => {
    const absolute = Math.abs(number);
    if ((absolute > 0 && absolute < 0.000001) || absolute >= 1e12) return number.toExponential(8).replace(/\.?0+e/, 'e');
    return new Intl.NumberFormat('ko-KR', { maximumSignificantDigits: 12 }).format(number);
  };

  const unitGroups = {
    length: {
      label: '길이',
      units: {
        mm: ['밀리미터 (mm)', 0.001], cm: ['센티미터 (cm)', 0.01], m: ['미터 (m)', 1],
        km: ['킬로미터 (km)', 1000], inch: ['인치 (in)', 0.0254], ft: ['피트 (ft)', 0.3048],
        yd: ['야드 (yd)', 0.9144], mile: ['마일 (mi)', 1609.344]
      }
    },
    weight: {
      label: '무게',
      units: {
        mg: ['밀리그램 (mg)', 0.000001], g: ['그램 (g)', 0.001], kg: ['킬로그램 (kg)', 1],
        ton: ['톤 (t)', 1000], geun: ['근 (600g)', 0.6], oz: ['온스 (oz)', 0.028349523125],
        lb: ['파운드 (lb)', 0.45359237]
      }
    },
    area: {
      label: '넓이',
      units: {
        sqm: ['제곱미터 (㎡)', 1], pyeong: ['평', 3.305785], sqft: ['제곱피트 (ft²)', 0.09290304],
        hectare: ['헥타르 (ha)', 10000], acre: ['에이커 (acre)', 4046.8564224], sqkm: ['제곱킬로미터 (㎢)', 1000000]
      }
    },
    volume: {
      label: '부피',
      units: {
        ml: ['밀리리터 (mL)', 0.001], l: ['리터 (L)', 1], cubicm: ['세제곱미터 (㎥)', 1000],
        cup: ['컵 (240mL)', 0.24], tbsp: ['큰술 (15mL)', 0.015], tsp: ['작은술 (5mL)', 0.005],
        gallon: ['미국 갤런 (gal)', 3.785411784]
      }
    },
    temperature: {
      label: '온도',
      units: { c: ['섭씨 (℃)', null], f: ['화씨 (℉)', null], k: ['켈빈 (K)', null] }
    },
    speed: {
      label: '속도',
      units: {
        ms: ['미터/초 (m/s)', 1], kmh: ['킬로미터/시 (km/h)', 0.2777777777777778],
        mph: ['마일/시 (mph)', 0.44704], knot: ['노트 (kn)', 0.5144444444444445]
      }
    },
    data: {
      label: '데이터 용량',
      units: {
        b: ['바이트 (B)', 1], kb: ['킬로바이트 (KB)', 1000], mb: ['메가바이트 (MB)', 1000000],
        gb: ['기가바이트 (GB)', 1000000000], tb: ['테라바이트 (TB)', 1000000000000],
        kib: ['키비바이트 (KiB)', 1024], mib: ['메비바이트 (MiB)', 1048576], gib: ['기비바이트 (GiB)', 1073741824]
      }
    }
  };

  const convertTemperature = (number, from, to) => {
    const celsius = from === 'c' ? number : from === 'f' ? (number - 32) * 5 / 9 : number - 273.15;
    const kelvin = celsius + 273.15;
    if (kelvin < 0) throw new RangeError('절대영도보다 낮은 온도는 변환할 수 없습니다.');
    return to === 'c' ? celsius : to === 'f' ? celsius * 9 / 5 + 32 : kelvin;
  };

  const populateUnitOptions = (savedFrom, savedTo) => {
    const group = unitGroups[form.elements.category.value];
    const options = Object.entries(group.units).map(([key, unit]) =>
      '<option value="' + key + '">' + escapeHtml(unit[0]) + '</option>'
    ).join('');
    form.elements.fromUnit.innerHTML = options;
    form.elements.toUnit.innerHTML = options;
    const keys = Object.keys(group.units);
    form.elements.fromUnit.value = group.units[savedFrom] ? savedFrom : keys[0];
    form.elements.toUnit.value = group.units[savedTo] ? savedTo : keys[Math.min(1, keys.length - 1)];
  };

  const calculateUnit = () => {
    const raw = form.elements.amount.value.trim();
    const amount = Number(raw);
    if (!raw || !Number.isFinite(amount)) return invalidate('amount', '변환할 숫자를 입력해 주세요.');
    if (Math.abs(amount) > 1e15) return invalidate('amount', '절댓값 1,000조 이하의 숫자를 입력해 주세요.');
    const category = form.elements.category.value;
    const group = unitGroups[category];
    const from = form.elements.fromUnit.value;
    const to = form.elements.toUnit.value;
    let converted;
    try {
      converted = category === 'temperature'
        ? convertTemperature(amount, from, to)
        : amount * group.units[from][1] / group.units[to][1];
    } catch (error) {
      return invalidate('amount', error.message);
    }
    const fromLabel = group.units[from][0];
    const toLabel = group.units[to][0];
    const headline = formatNumber(converted) + ' ' + toLabel.replace(/^.*\((.+)\).*$/, '$1');
    const text = ['[생활계산소] 단위 변환 결과', formatNumber(amount) + ' ' + fromLabel + ' = ' + formatNumber(converted) + ' ' + toLabel].join('\n');
    shareResult = true;
    showResult(headline, [
      ['변환 전', formatNumber(amount) + ' ' + fromLabel],
      ['변환 후', formatNumber(converted) + ' ' + toLabel],
      ['변환 종류', group.label]
    ], '표시값은 읽기 쉽도록 유효 숫자 12자리 안에서 반올림됩니다.', text);
  };

  const parseDate = (value) => {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) return null;
    const year = Number(match[1]); const month = Number(match[2]); const day = Number(match[3]);
    const date = new Date(Date.UTC(year, month - 1, day));
    if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
    return date;
  };

  const formatDateInput = (date) => [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, '0'),
    String(date.getUTCDate()).padStart(2, '0')
  ].join('-');

  const formatKoreanDate = (date) => new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'full', timeZone: 'UTC'
  }).format(date);

  const todayInput = () => {
    const now = new Date();
    return [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');
  };

  const setDefaultDates = () => {
    if (!form.elements.startDate.value) form.elements.startDate.value = todayInput();
    if (!form.elements.endDate.value) {
      const end = parseDate(todayInput());
      end.setUTCDate(end.getUTCDate() + 7);
      form.elements.endDate.value = formatDateInput(end);
    }
    if (!form.elements.baseDate.value) form.elements.baseDate.value = todayInput();
  };

  const toggleDateMode = () => {
    const difference = form.elements.mode.value === 'difference';
    document.querySelector('[data-date-difference]').hidden = !difference;
    document.querySelector('[data-date-offset]').hidden = difference;
    document.querySelectorAll('[data-date-difference] input').forEach((input) => { input.disabled = !difference; });
    document.querySelectorAll('[data-date-offset] input, [data-date-offset] select').forEach((input) => { input.disabled = difference; });
  };

  const countDayTypes = (start, count) => {
    let weekdays = 0; let weekends = 0;
    for (let index = 0; index < count; index += 1) {
      const date = new Date(start.getTime() + index * 86400000);
      const day = date.getUTCDay();
      if (day === 0 || day === 6) weekends += 1;
      else weekdays += 1;
    }
    return { weekdays, weekends };
  };

  const addCalendar = (date, amount, unit) => {
    const result = new Date(date.getTime());
    if (unit === 'days' || unit === 'weeks') {
      result.setUTCDate(result.getUTCDate() + amount * (unit === 'weeks' ? 7 : 1));
      return result;
    }
    const originalDay = result.getUTCDate();
    result.setUTCDate(1);
    if (unit === 'months') result.setUTCMonth(result.getUTCMonth() + amount);
    else result.setUTCFullYear(result.getUTCFullYear() + amount);
    const lastDay = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate();
    result.setUTCDate(Math.min(originalDay, lastDay));
    return result;
  };

  const calculateDate = () => {
    if (form.elements.mode.value === 'difference') {
      const start = parseDate(form.elements.startDate.value);
      const end = parseDate(form.elements.endDate.value);
      if (!start) return invalidate('startDate', '시작 날짜를 선택해 주세요.');
      if (!end) return invalidate('endDate', '종료 날짜를 선택해 주세요.');
      const signedDays = Math.round((end - start) / 86400000);
      const absoluteDays = Math.abs(signedDays);
      const countedDays = absoluteDays + (form.elements.includeEnd.checked ? 1 : 0);
      const earlier = signedDays >= 0 ? start : end;
      const types = countDayTypes(earlier, countedDays);
      const relation = signedDays === 0 ? '같은 날짜' : signedDays > 0 ? '종료일이 시작일 이후' : '종료일이 시작일 이전';
      const text = [
        '[생활계산소] 날짜 차이 계산',
        '시작: ' + formatKoreanDate(start),
        '종료: ' + formatKoreanDate(end),
        '날짜 차이: ' + absoluteDays.toLocaleString('ko-KR') + '일',
        '계산 포함 일수: ' + countedDays.toLocaleString('ko-KR') + '일'
      ].join('\n');
      shareResult = true;
      showResult(absoluteDays.toLocaleString('ko-KR') + '일 차이', [
        ['주와 일', Math.floor(absoluteDays / 7) + '주 ' + (absoluteDays % 7) + '일'],
        ['계산 포함 일수', countedDays.toLocaleString('ko-KR') + '일'],
        ['평일 / 주말', types.weekdays + '일 / ' + types.weekends + '일'],
        ['날짜 관계', relation]
      ], '평일은 공휴일을 제외하지 않은 월요일~금요일 기준입니다.', text);
      return;
    }

    const base = parseDate(form.elements.baseDate.value);
    const rawOffset = form.elements.offset.value.trim();
    const offset = Number(rawOffset);
    if (!base) return invalidate('baseDate', '기준 날짜를 선택해 주세요.');
    if (!rawOffset || !Number.isInteger(offset) || offset < 0 || offset > 10000) return invalidate('offset', '0~10,000 사이의 정수를 입력해 주세요.');
    const direction = form.elements.direction.value === 'subtract' ? -1 : 1;
    const unit = form.elements.offsetUnit.value;
    const result = addCalendar(base, offset * direction, unit);
    const unitLabel = { days: '일', weeks: '주', months: '개월', years: '년' }[unit];
    const action = direction > 0 ? '더한' : '뺀';
    const text = [
      '[생활계산소] 날짜 더하기·빼기',
      '기준일: ' + formatKoreanDate(base),
      offset + unitLabel + ' ' + action + ' 날짜: ' + formatKoreanDate(result)
    ].join('\n');
    shareResult = true;
    showResult(formatKoreanDate(result), [
      ['기준 날짜', formatKoreanDate(base)],
      ['계산', offset.toLocaleString('ko-KR') + unitLabel + ' ' + (direction > 0 ? '더하기' : '빼기')],
      ['결과 날짜', formatDateInput(result)]
    ], '개월·연 계산에서 같은 일자가 없으면 해당 월의 마지막 날로 조정합니다.', text);
  };

  const gfExp = new Uint8Array(512);
  const gfLog = new Uint8Array(256);
  (() => {
    let value = 1;
    for (let index = 0; index < 255; index += 1) {
      gfExp[index] = value;
      gfLog[value] = index;
      value <<= 1;
      if (value & 0x100) value ^= 0x11d;
    }
    for (let index = 255; index < 512; index += 1) gfExp[index] = gfExp[index - 255];
  })();

  const gfMultiply = (left, right) => left && right ? gfExp[gfLog[left] + gfLog[right]] : 0;

  const rsGenerator = (degree) => {
    let polynomial = [1];
    for (let index = 0; index < degree; index += 1) {
      const next = new Array(polynomial.length + 1).fill(0);
      polynomial.forEach((coefficient, position) => {
        next[position] ^= coefficient;
        next[position + 1] ^= gfMultiply(coefficient, gfExp[index]);
      });
      polynomial = next;
    }
    return polynomial;
  };

  const rsRemainder = (data, degree) => {
    const generator = rsGenerator(degree);
    const remainder = new Array(degree).fill(0);
    data.forEach((byte) => {
      const factor = byte ^ remainder[0];
      remainder.shift();
      remainder.push(0);
      for (let index = 0; index < degree; index += 1) {
        remainder[index] ^= gfMultiply(generator[index + 1], factor);
      }
    });
    return remainder;
  };

  const qrBlocksM = {
    1: [[1, 26, 16]], 2: [[1, 44, 28]], 3: [[1, 70, 44]], 4: [[2, 50, 32]],
    5: [[2, 67, 43]], 6: [[4, 43, 27]], 7: [[4, 49, 31]],
    8: [[2, 60, 38], [2, 61, 39]], 9: [[3, 58, 36], [2, 59, 37]],
    10: [[4, 69, 43], [1, 70, 44]]
  };

  const alignmentPositions = {
    1: [], 2: [6, 18], 3: [6, 22], 4: [6, 26], 5: [6, 30], 6: [6, 34],
    7: [6, 22, 38], 8: [6, 24, 42], 9: [6, 26, 46], 10: [6, 28, 50]
  };

  const appendBits = (bits, value, length) => {
    for (let index = length - 1; index >= 0; index -= 1) bits.push((value >>> index) & 1);
  };

  const buildQrCodewords = (bytes, version) => {
    const specs = qrBlocksM[version];
    const dataCapacity = specs.reduce((sum, spec) => sum + spec[0] * spec[2], 0);
    const bits = [];
    appendBits(bits, 0x4, 4);
    appendBits(bits, bytes.length, version < 10 ? 8 : 16);
    bytes.forEach((byte) => appendBits(bits, byte, 8));
    const capacityBits = dataCapacity * 8;
    appendBits(bits, 0, Math.min(4, capacityBits - bits.length));
    while (bits.length % 8) bits.push(0);
    const data = [];
    for (let index = 0; index < bits.length; index += 8) {
      data.push(bits.slice(index, index + 8).reduce((byte, bit) => (byte << 1) | bit, 0));
    }
    let pad = 0xec;
    while (data.length < dataCapacity) {
      data.push(pad);
      pad = pad === 0xec ? 0x11 : 0xec;
    }

    const blocks = [];
    let offset = 0;
    specs.forEach(([count, totalCount, dataCount]) => {
      for (let index = 0; index < count; index += 1) {
        const blockData = data.slice(offset, offset + dataCount);
        offset += dataCount;
        blocks.push({ data: blockData, error: rsRemainder(blockData, totalCount - dataCount) });
      }
    });
    const codewords = [];
    const maxData = Math.max(...blocks.map((block) => block.data.length));
    const maxError = Math.max(...blocks.map((block) => block.error.length));
    for (let index = 0; index < maxData; index += 1) blocks.forEach((block) => {
      if (index < block.data.length) codewords.push(block.data[index]);
    });
    for (let index = 0; index < maxError; index += 1) blocks.forEach((block) => {
      if (index < block.error.length) codewords.push(block.error[index]);
    });
    return codewords;
  };

  const maskBit = (mask, x, y) => [
    (x + y) % 2 === 0,
    y % 2 === 0,
    x % 3 === 0,
    (x + y) % 3 === 0,
    (Math.floor(y / 2) + Math.floor(x / 3)) % 2 === 0,
    (x * y % 2 + x * y % 3) === 0,
    (x * y % 2 + x * y % 3) % 2 === 0,
    ((x + y) % 2 + x * y % 3) % 2 === 0
  ][mask];

  const qrPenalty = (modules) => {
    const size = modules.length;
    let score = 0;
    const scoreLine = (line) => {
      let lineScore = 0; let runColor = line[0]; let runLength = 1;
      for (let index = 1; index < line.length; index += 1) {
        if (line[index] === runColor) runLength += 1;
        else {
          if (runLength >= 5) lineScore += 3 + runLength - 5;
          runColor = line[index]; runLength = 1;
        }
      }
      if (runLength >= 5) lineScore += 3 + runLength - 5;
      const finder = [true, false, true, true, true, false, true];
      for (let index = 0; index <= line.length - 7; index += 1) {
        if (!finder.every((bit, offset) => line[index + offset] === bit)) continue;
        const before = index >= 4 && line.slice(index - 4, index).every((bit) => !bit);
        const after = index + 11 <= line.length && line.slice(index + 7, index + 11).every((bit) => !bit);
        if (before) lineScore += 40;
        if (after) lineScore += 40;
      }
      return lineScore;
    };
    for (let index = 0; index < size; index += 1) {
      score += scoreLine(modules[index]);
      score += scoreLine(modules.map((row) => row[index]));
    }
    for (let y = 0; y < size - 1; y += 1) for (let x = 0; x < size - 1; x += 1) {
      const color = modules[y][x];
      if (modules[y][x + 1] === color && modules[y + 1][x] === color && modules[y + 1][x + 1] === color) score += 3;
    }
    const dark = modules.flat().filter(Boolean).length;
    score += Math.floor(Math.abs(dark * 100 / (size * size) - 50) / 5) * 10;
    return score;
  };

  const buildQrMatrix = (bytes) => {
    let version = 0;
    for (let candidate = 1; candidate <= 10; candidate += 1) {
      const capacity = qrBlocksM[candidate].reduce((sum, spec) => sum + spec[0] * spec[2], 0) * 8;
      const required = 4 + (candidate < 10 ? 8 : 16) + bytes.length * 8;
      if (required <= capacity) { version = candidate; break; }
    }
    if (!version) throw new RangeError('QR에 넣을 내용이 너무 깁니다. UTF-8 기준 약 213바이트 이하로 줄여 주세요.');
    const codewords = buildQrCodewords(bytes, version);
    const size = version * 4 + 17;
    const base = Array.from({ length: size }, () => Array(size).fill(false));
    const isFunction = Array.from({ length: size }, () => Array(size).fill(false));
    const setFunction = (x, y, dark) => {
      if (x < 0 || y < 0 || x >= size || y >= size) return;
      base[y][x] = Boolean(dark);
      isFunction[y][x] = true;
    };
    const drawFinder = (centerX, centerY) => {
      for (let dy = -4; dy <= 4; dy += 1) for (let dx = -4; dx <= 4; dx += 1) {
        const distance = Math.max(Math.abs(dx), Math.abs(dy));
        setFunction(centerX + dx, centerY + dy, distance !== 2 && distance !== 4);
      }
    };
    drawFinder(3, 3); drawFinder(size - 4, 3); drawFinder(3, size - 4);
    for (let index = 0; index < size; index += 1) {
      if (!isFunction[6][index]) setFunction(index, 6, index % 2 === 0);
      if (!isFunction[index][6]) setFunction(6, index, index % 2 === 0);
    }
    alignmentPositions[version].forEach((centerY) => alignmentPositions[version].forEach((centerX) => {
      if (isFunction[centerY][centerX]) return;
      for (let dy = -2; dy <= 2; dy += 1) for (let dx = -2; dx <= 2; dx += 1) {
        setFunction(centerX + dx, centerY + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
      }
    }));

    const drawFormat = (modules, mask) => {
      const data = mask;
      let remainder = data;
      for (let index = 0; index < 10; index += 1) remainder = (remainder << 1) ^ ((remainder >>> 9) ? 0x537 : 0);
      const bits = ((data << 10) | remainder) ^ 0x5412;
      const set = (x, y, index) => {
        modules[y][x] = ((bits >>> index) & 1) !== 0;
        isFunction[y][x] = true;
      };
      for (let index = 0; index <= 5; index += 1) set(8, index, index);
      set(8, 7, 6); set(8, 8, 7); set(7, 8, 8);
      for (let index = 9; index < 15; index += 1) set(14 - index, 8, index);
      for (let index = 0; index < 8; index += 1) set(size - 1 - index, 8, index);
      for (let index = 8; index < 15; index += 1) set(8, size - 15 + index, index);
      modules[size - 8][8] = true;
      isFunction[size - 8][8] = true;
    };
    drawFormat(base, 0);

    if (version >= 7) {
      let remainder = version;
      for (let index = 0; index < 12; index += 1) remainder = (remainder << 1) ^ ((remainder >>> 11) ? 0x1f25 : 0);
      const bits = (version << 12) | remainder;
      for (let index = 0; index < 18; index += 1) {
        const dark = ((bits >>> index) & 1) !== 0;
        const a = size - 11 + index % 3;
        const b = Math.floor(index / 3);
        setFunction(a, b, dark);
        setFunction(b, a, dark);
      }
    }

    let best = null; let bestScore = Infinity;
    for (let mask = 0; mask < 8; mask += 1) {
      const modules = base.map((row) => row.slice());
      drawFormat(modules, mask);
      let bitIndex = 0;
      for (let right = size - 1; right >= 1; right -= 2) {
        if (right === 6) right -= 1;
        for (let vertical = 0; vertical < size; vertical += 1) {
          const y = ((right + 1) & 2) === 0 ? size - 1 - vertical : vertical;
          for (let offset = 0; offset < 2; offset += 1) {
            const x = right - offset;
            if (isFunction[y][x]) continue;
            const bit = bitIndex < codewords.length * 8
              ? ((codewords[Math.floor(bitIndex / 8)] >>> (7 - bitIndex % 8)) & 1) !== 0
              : false;
            modules[y][x] = bit !== maskBit(mask, x, y);
            bitIndex += 1;
          }
        }
      }
      const score = qrPenalty(modules);
      if (score < bestScore) { bestScore = score; best = modules; }
    }
    return best;
  };

  const qrSvg = (modules, pixelSize) => {
    const quiet = 4;
    const viewSize = modules.length + quiet * 2;
    let path = '';
    modules.forEach((row, y) => row.forEach((dark, x) => {
      if (dark) path += 'M' + (x + quiet) + ' ' + (y + quiet) + 'h1v1h-1z';
    }));
    return '<svg xmlns="http://www.w3.org/2000/svg" role="img" aria-label="생성된 QR 코드" width="' + pixelSize +
      '" height="' + pixelSize + '" viewBox="0 0 ' + viewSize + ' ' + viewSize +
      '" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#fff"/><path d="' + path +
      '" fill="#111827"/></svg>';
  };

  const normalizedQrContent = () => {
    const kind = form.elements.contentType.value;
    const content = form.elements.qrContent.value.trim();
    if (!content) throw new TypeError('QR에 넣을 내용을 입력해 주세요.');
    if (content.length > 1000) throw new RangeError('내용은 1,000자 이하로 입력해 주세요.');
    if (kind === 'url') {
      let parsed;
      try { parsed = new URL(content); } catch (_) { throw new TypeError('https://로 시작하는 올바른 주소를 입력해 주세요.'); }
      if (!['http:', 'https:'].includes(parsed.protocol)) throw new TypeError('http 또는 https 주소만 사용할 수 있습니다.');
      return parsed.href;
    }
    if (kind === 'email') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(content)) throw new TypeError('올바른 이메일 주소를 입력해 주세요.');
      return 'mailto:' + content;
    }
    if (kind === 'phone') {
      if (!/^\+?[0-9 ()-]{7,25}$/.test(content)) throw new TypeError('올바른 전화번호를 입력해 주세요.');
      return 'tel:' + content.replace(/[ ()-]/g, '');
    }
    return content;
  };

  const calculateQr = () => {
    let content;
    try { content = normalizedQrContent(); } catch (error) { return invalidate('qrContent', error.message); }
    const bytes = [...new TextEncoder().encode(content)];
    let modules;
    try { modules = buildQrMatrix(bytes); } catch (error) { return invalidate('qrContent', error.message); }
    const size = Number(form.elements.qrSize.value);
    lastQrSvg = qrSvg(modules, size);
    const custom = '<li class="result-custom"><div class="qr-preview">' + lastQrSvg +
      '</div><p class="qr-caption">UTF-8 ' + bytes.length + '바이트 · ' + modules.length + '×' + modules.length + ' 모듈</p></li>';
    resultText = content;
    shareResult = true;
    showResult('QR 코드 완성', [], '휴대전화 카메라로 실제 인식되는지 확인한 뒤 사용하세요. QR 안의 내용은 암호화되지 않습니다.', content, custom);
  };

  const secureRandomIndex = (maximum) => {
    if (maximum < 1 || maximum > 256) throw new RangeError('난수 범위 오류');
    const limit = Math.floor(256 / maximum) * maximum;
    const array = new Uint8Array(1);
    do { crypto.getRandomValues(array); } while (array[0] >= limit);
    return array[0] % maximum;
  };

  const secureShuffle = (characters) => {
    for (let index = characters.length - 1; index > 0; index -= 1) {
      const swap = secureRandomIndex(index + 1);
      [characters[index], characters[swap]] = [characters[swap], characters[index]];
    }
    return characters;
  };

  const calculatePassword = () => {
    const length = Number(form.elements.passwordLength.value);
    if (!Number.isInteger(length) || length < 8 || length > 128) return invalidate('passwordLength', '8~128 사이의 정수를 입력해 주세요.');
    const ambiguous = /[Il1O0o|]/g;
    const sets = [];
    if (form.elements.lowercase.checked) sets.push('abcdefghijklmnopqrstuvwxyz');
    if (form.elements.uppercase.checked) sets.push('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
    if (form.elements.numbers.checked) sets.push('0123456789');
    if (form.elements.symbols.checked) sets.push('!@#$%^&*()-_=+[]{};:,.?');
    if (!sets.length) return invalidate('lowercase', '문자 종류를 하나 이상 선택해 주세요.');
    const filteredSets = sets.map((set) => form.elements.excludeAmbiguous.checked ? set.replace(ambiguous, '') : set);
    if (length < filteredSets.length) return invalidate('passwordLength', '선택한 문자 종류 수보다 긴 길이를 입력해 주세요.');
    const pool = filteredSets.join('');
    const characters = filteredSets.map((set) => set[secureRandomIndex(set.length)]);
    while (characters.length < length) characters.push(pool[secureRandomIndex(pool.length)]);
    const password = secureShuffle(characters).join('');
    const entropy = length * Math.log2(pool.length);
    const strength = entropy >= 80 ? '매우 강함' : entropy >= 60 ? '강함' : entropy >= 45 ? '보통' : '짧음';
    const custom = '<li class="result-custom"><div class="generated-secret"><code data-password-output>' +
      escapeHtml(password) + '</code></div></li>';
    shareResult = false;
    showResult(strength, [
      ['길이', length + '자'],
      ['사용 문자 풀', pool.length + '개'],
      ['예상 엔트로피', Math.round(entropy) + '비트']
    ], '비밀번호는 서버와 localStorage에 저장하지 않습니다. 복사 후 안전한 비밀번호 관리자에 보관하세요.', password, custom);
  };

  const analyzeText = (text) => {
    const lines = text ? text.split(/\r?\n/) : [];
    const trimmed = text.trim();
    const words = trimmed ? trimmed.split(/\s+/u).length : 0;
    const sentences = trimmed ? trimmed.split(/[.!?。！？]+/u).filter((part) => part.trim()).length : 0;
    return {
      characters: Array.from(text).length,
      noSpaces: Array.from(text.replace(/\s/gu, '')).length,
      words,
      lines: lines.length,
      sentences,
      bytes: new TextEncoder().encode(text).length
    };
  };

  const transformText = (text, operation) => {
    if (operation === 'uppercase') return text.toLocaleUpperCase('ko-KR');
    if (operation === 'lowercase') return text.toLocaleLowerCase('ko-KR');
    if (operation === 'clean-spaces') return text.split(/\r?\n/).map((line) => line.replace(/[ \t]+/g, ' ').trim()).join('\n').trim();
    if (operation === 'remove-empty') return text.split(/\r?\n/).filter((line) => line.trim()).join('\n');
    if (operation === 'deduplicate') {
      const seen = new Set();
      return text.split(/\r?\n/).filter((line) => {
        if (seen.has(line)) return false;
        seen.add(line); return true;
      }).join('\n');
    }
    if (operation === 'sort-lines') return text.split(/\r?\n/).sort((left, right) => left.localeCompare(right, 'ko')).join('\n');
    if (operation === 'reverse') return Array.from(text).reverse().join('');
    return text;
  };

  const calculateText = () => {
    const text = form.elements.sourceText.value;
    if (!text.trim()) return invalidate('sourceText', '분석하거나 정리할 텍스트를 입력해 주세요.');
    if (Array.from(text).length > 100000) return invalidate('sourceText', '텍스트는 100,000자 이하로 입력해 주세요.');
    const operation = form.elements.operation.value;
    const transformed = transformText(text, operation);
    const metrics = analyzeText(transformed);
    const operationLabel = form.elements.operation.options[form.elements.operation.selectedIndex].textContent;
    const custom = '<li class="result-custom"><div class="metrics-grid">' +
      [['글자 수', metrics.characters.toLocaleString('ko-KR')], ['공백 제외', metrics.noSpaces.toLocaleString('ko-KR')], ['단어 수', metrics.words.toLocaleString('ko-KR')], ['줄 수', metrics.lines.toLocaleString('ko-KR')], ['문장 수', metrics.sentences.toLocaleString('ko-KR')], ['UTF-8', metrics.bytes.toLocaleString('ko-KR') + 'B']]
        .map((metric) => '<div class="metric"><span>' + metric[0] + '</span><strong>' + metric[1] + '</strong></div>').join('') +
      '</div><label for="text-result">처리 결과</label><textarea id="text-result" class="text-output" readonly>' +
      escapeHtml(transformed) + '</textarea></li>';
    shareResult = true;
    showResult(operationLabel + ' 완료', [], '입력한 텍스트는 현재 화면에서만 처리되며 브라우저 저장소나 서버에 저장하지 않습니다.', transformed, custom);
  };

  const calculators = {
    unit: calculateUnit,
    date: calculateDate,
    qr: calculateQr,
    password: calculatePassword,
    text: calculateText
  };

  form.querySelectorAll('.error').forEach((error) => {
    error.setAttribute('role', 'status');
    error.setAttribute('aria-live', 'polite');
  });

  const saved = readSavedSettings();
  if (type === 'unit') {
    if (saved.category && unitGroups[saved.category]) form.elements.category.value = saved.category;
    populateUnitOptions(saved.fromUnit, saved.toUnit);
    form.elements.category.addEventListener('change', () => { populateUnitOptions(); saveSettings(); });
    document.querySelector('[data-swap-units]')?.addEventListener('click', () => {
      const current = form.elements.fromUnit.value;
      form.elements.fromUnit.value = form.elements.toUnit.value;
      form.elements.toUnit.value = current;
      saveSettings();
      if (form.elements.amount.value.trim()) form.requestSubmit();
    });
  } else {
    restoreSettings(saved);
  }

  if (type === 'date') {
    setDefaultDates();
    toggleDateMode();
    form.elements.mode.addEventListener('change', toggleDateMode);
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    clearErrors();
    saveSettings();
    calculators[type]?.();
    form.querySelector('[aria-invalid="true"]')?.focus();
  });
  form.addEventListener('change', saveSettings);
  form.addEventListener('reset', () => {
    try { localStorage.removeItem(storageKey); } catch (_) {}
    setTimeout(() => {
      if (type === 'unit') populateUnitOptions();
      if (type === 'date') {
        setDefaultDates();
        toggleDateMode();
      }
      resetResult();
    }, 0);
  });

  copyButton?.addEventListener('click', () => {
    if (!resultText) return;
    window.copyText(resultText, type === 'password' ? '비밀번호를 복사했습니다.' : '결과를 복사했습니다.');
  });
  shareButton?.addEventListener('click', share);
  document.querySelector('[data-download-qr]')?.addEventListener('click', () => {
    if (!lastQrSvg) return;
    const url = URL.createObjectURL(new Blob([lastQrSvg], { type: 'image/svg+xml;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'readytools-qr.svg';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  if (location.search) history.replaceState(null, '', location.pathname);
})();
