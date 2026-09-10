(() => {
  'use strict';
  const root = document.querySelector('[data-new-tool]'); if (!root) return;
  const type = root.dataset.newTool; if (!['emoji-picker', 'dice-roller', 'file-size-converter'].includes(type)) return;
  const resultEmpty = document.querySelector('[data-result-empty]'); const resultContent = document.querySelector('[data-result-content]');
  const resultValue = document.querySelector('[data-result-value]'); const resultList = document.querySelector('[data-result-list]'); const resultNote = document.querySelector('[data-result-note]');
  let resultText = '';
  const escapeHtml = (text) => String(text).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const show = (headline, items, note, text, custom = '') => {
    resultValue.textContent = headline; resultList.innerHTML = custom + items.map(([label, value]) => `<li><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></li>`).join(''); resultNote.textContent = note; resultText = text;
    resultEmpty.hidden = true; resultContent.hidden = false; resultContent.focus({ preventScroll: true });
    if (matchMedia('(max-width: 899px)').matches) requestAnimationFrame(() => resultContent.closest('.result-panel').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }));
  };
  const bindCopyShare = () => {
    document.querySelector('[data-copy-result]')?.addEventListener('click', () => resultText && window.copyText(resultText, '결과를 복사했습니다.'));
    document.querySelector('[data-share-result]')?.addEventListener('click', async () => { if (!resultText) return; if (navigator.share) { try { await navigator.share({ title: document.title, text: resultText, url: location.origin + location.pathname }); return; } catch (error) { if (error.name === 'AbortError') return; } } window.copyText(resultText, '공유할 결과를 복사했습니다.'); });
  };

  if (type === 'emoji-picker') {
    const emojiData = [
      ['표정','😀','웃는 얼굴'],['표정','😃','활짝 웃음'],['표정','😄','기쁜 얼굴'],['표정','😁','씨익 웃음'],['표정','😂','기쁨의 눈물'],['표정','🤣','바닥을 구르며 웃음'],['표정','😊','미소'],['표정','😍','하트 눈'],['표정','🥰','사랑스러운 얼굴'],['표정','😎','선글라스'],['표정','🤔','생각'],['표정','😭','우는 얼굴'],['표정','😡','화난 얼굴'],['표정','🥳','파티 얼굴'],['표정','😴','졸린 얼굴'],
      ['사람','👋','손 흔들기'],['사람','👍','좋아요 엄지'],['사람','👎','싫어요 엄지'],['사람','👏','박수'],['사람','🙏','감사 부탁'],['사람','💪','힘 근육'],['사람','🤝','악수'],['사람','🙋','손 들기'],['사람','🧑‍💻','개발자'],['사람','👨‍👩‍👧‍👦','가족'],['사람','🫶','하트 손'],
      ['동물','🐶','강아지'],['동물','🐱','고양이'],['동물','🐭','쥐'],['동물','🐰','토끼'],['동물','🦊','여우'],['동물','🐻','곰'],['동물','🐼','판다'],['동물','🐯','호랑이'],['동물','🦁','사자'],['동물','🐸','개구리'],['동물','🐧','펭귄'],['동물','🐥','병아리'],
      ['음식','🍎','사과'],['음식','🍌','바나나'],['음식','🍓','딸기'],['음식','🍕','피자'],['음식','🍔','햄버거'],['음식','🍗','치킨'],['음식','🍚','밥'],['음식','🍜','라면'],['음식','🍰','케이크'],['음식','☕','커피'],['음식','🍺','맥주'],['음식','🥗','샐러드'],
      ['여행','✈️','비행기'],['여행','🚗','자동차'],['여행','🚆','기차'],['여행','🚌','버스'],['여행','🚲','자전거'],['여행','🗺️','지도'],['여행','🧳','여행 가방'],['여행','🏕️','캠핑'],['여행','🏖️','해변'],['여행','⛰️','산'],['여행','🏨','호텔'],['여행','📍','위치 핀'],
      ['사물','📱','휴대전화'],['사물','💻','노트북'],['사물','⌚','시계'],['사물','📷','카메라'],['사물','💡','전구 아이디어'],['사물','🔑','열쇠'],['사물','🎁','선물'],['사물','📦','상자'],['사물','📅','달력'],['사물','✏️','연필'],['사물','🔒','자물쇠'],['사물','💰','돈주머니'],
      ['기호','❤️','빨간 하트'],['기호','🧡','주황 하트'],['기호','💛','노랑 하트'],['기호','💚','초록 하트'],['기호','💙','파랑 하트'],['기호','💜','보라 하트'],['기호','✅','체크 완료'],['기호','❌','엑스 오류'],['기호','⚠️','경고'],['기호','⭐','별'],['기호','🔥','불 인기'],['기호','🎉','축하']
    ];
    const search = root.querySelector('[data-emoji-search]'); const grid = root.querySelector('[data-emoji-grid]'); const status = root.querySelector('[data-emoji-status]'); let category = '전체';
    const render = () => { const query = search.value.trim().toLocaleLowerCase('ko-KR'); const filtered = emojiData.filter(([group, emoji, name]) => (category === '전체' || group === category) && (!query || `${group} ${emoji} ${name}`.toLocaleLowerCase('ko-KR').includes(query))); grid.innerHTML = filtered.map(([group, emoji, name]) => `<button type="button" class="emoji-button" data-emoji="${emoji}" aria-label="${escapeHtml(name)} ${emoji} 복사"><span aria-hidden="true">${emoji}</span><small>${escapeHtml(name)}</small></button>`).join(''); status.textContent = `${category} 이모지 ${filtered.length}개`; };
    root.querySelector('[data-emoji-categories]').addEventListener('click', (event) => { const button = event.target.closest('button[data-category]'); if (!button) return; category = button.dataset.category; root.querySelectorAll('button[data-category]').forEach((item) => item.setAttribute('aria-pressed', String(item === button))); render(); });
    search.addEventListener('input', render); grid.addEventListener('click', (event) => { const button = event.target.closest('[data-emoji]'); if (!button) return; window.copyText(button.dataset.emoji, `${button.dataset.emoji} 이모지를 복사했습니다.`); }); render();
  }

  if (type === 'dice-roller') {
    const form = root; const sides = form.elements.sides; const count = form.elements.count;
    const secureRandom = (max) => { const limit = Math.floor(0x100000000 / max) * max; const array = new Uint32Array(1); do { crypto.getRandomValues(array); } while (array[0] >= limit); return array[0] % max + 1; };
    const pipPositions = { 1:[5], 2:[1,9], 3:[1,5,9], 4:[1,3,7,9], 5:[1,3,5,7,9], 6:[1,3,4,6,7,9] };
    const diceMarkup = (sideCount, roll, index) => {
      const label = `${index + 1}번째 d${sideCount} 주사위 결과 ${roll}`;
      const face = sideCount === 6
        ? `<span class="die-face die-face--d6" aria-hidden="true">${Array.from({ length: 9 }, (_, pipIndex) => `<i class="die-pip${pipPositions[roll].includes(pipIndex + 1) ? ' is-on' : ''}"></i>`).join('')}</span>`
        : `<span class="die-face die-face--poly die-face--d${sideCount}" aria-hidden="true"><strong>${roll}</strong></span>`;
      return `<div class="die-card" role="img" aria-label="${label}" style="--die-order:${index}"><span class="die-type" aria-hidden="true">d${sideCount}</span>${face}</div>`;
    };
    form.addEventListener('submit', (event) => { event.preventDefault(); const diceCount = +count.value; const sideCount = +sides.value; const error = document.getElementById('dice-count-error'); error.textContent = ''; count.removeAttribute('aria-invalid'); if (!Number.isInteger(diceCount) || diceCount < 1 || diceCount > 20) { count.setAttribute('aria-invalid','true'); error.textContent = '주사위 개수는 1~20개로 입력해 주세요.'; count.focus(); return; } const rolls = Array.from({ length: diceCount }, () => secureRandom(sideCount)); const total = rolls.reduce((sum, value) => sum + value, 0); const custom = `<li class="result-custom"><div class="dice-results" aria-label="개별 주사위 결과">${rolls.map((roll, index) => diceMarkup(sideCount, roll, index)).join('')}</div></li>`; show('합계 ' + total, [['주사위', `d${sideCount} × ${diceCount}개`], ['최솟값', String(Math.min(...rolls))], ['최댓값', String(Math.max(...rolls))]], 'crypto.getRandomValues()를 사용한 추첨 결과입니다. 실제 도박이나 금전 거래의 근거로 사용하지 마세요.', `온라인 주사위 결과\nd${sideCount} × ${diceCount}: ${rolls.join(', ')}\n합계: ${total}`, custom); });
    bindCopyShare();
  }

  if (type === 'file-size-converter') {
    const form = root; const units = { B: ['Byte',1], KB:['KB',1e3], MB:['MB',1e6], GB:['GB',1e9], TB:['TB',1e12], KiB:['KiB',1024], MiB:['MiB',1024**2], GiB:['GiB',1024**3] };
    form.addEventListener('submit', (event) => { event.preventDefault(); const amount = Number(form.elements.amount.value); const error = document.getElementById('file-size-amount-error'); error.textContent = ''; form.elements.amount.removeAttribute('aria-invalid'); if (form.elements.amount.value.trim() === '' || !Number.isFinite(amount) || amount < 0 || amount > 1e15) { form.elements.amount.setAttribute('aria-invalid','true'); error.textContent = '0 이상 1,000조 이하의 숫자를 입력해 주세요.'; form.elements.amount.focus(); return; } const from = form.elements.from.value; const bytes = amount * units[from][1]; const format = (value) => Number(value.toPrecision(12)).toLocaleString('ko-KR', { maximumFractionDigits: 12 }); const items = Object.entries(units).filter(([key]) => key !== from).map(([key, unit]) => [unit[0], `${format(bytes / unit[1])} ${key}`]); const headline = `${format(amount)} ${from}`; resultText = [headline, ...items.map(([label,value]) => `${label}: ${value}`)].join('\n'); show(headline, items, 'KB·MB·GB는 1000 단위, KiB·MiB·GiB는 1024 단위를 사용합니다.', resultText); });
    bindCopyShare();
  }
})();
