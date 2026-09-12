(() => {
  'use strict';

  const root = document.querySelector('[data-personality-test]');
  const configNode = document.querySelector('[data-test-config]');
  if (!root || !configNode) return;

  let config;
  try {
    config = JSON.parse(configNode.textContent);
  } catch (error) {
    console.error('테스트 설정을 읽지 못했습니다.', error);
    return;
  }

  const startScreen = root.querySelector('[data-test-start]');
  const questionScreen = root.querySelector('[data-test-question]');
  const resultScreen = root.querySelector('[data-test-result]');
  const questionTitle = root.querySelector('[data-question-title]');
  const questionKicker = root.querySelector('[data-question-kicker]');
  const answerList = root.querySelector('[data-answer-list]');
  const progressFill = root.querySelector('[data-progress-fill]');
  const progressText = root.querySelector('[data-progress-text]');
  const progressBar = root.querySelector('[data-progress-bar]');
  const previousButton = root.querySelector('[data-test-previous]');
  const liveRegion = root.querySelector('[data-test-live]');

  let answers = [];
  let currentIndex = 0;
  let tieDimensions = [];
  let tieIndex = 0;
  let tieAnswers = {};
  let resultData = null;

  const showScreen = (screen) => {
    [startScreen, questionScreen, resultScreen].forEach((item) => {
      item.hidden = item !== screen;
    });
    screen.setAttribute('tabindex', '-1');
    screen.focus({ preventScroll: true });
    screen.removeAttribute('tabindex');
    root.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const announce = (message) => {
    liveRegion.textContent = '';
    window.requestAnimationFrame(() => {
      liveRegion.textContent = message;
    });
  };

  const createAnswerButton = (option, index, selectedValue, onSelect) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'answer-button';
    button.textContent = option.text;
    button.setAttribute('aria-pressed', String(selectedValue === option.value));
    button.addEventListener('click', () => onSelect(option, index));
    return button;
  };

  const renderQuestion = () => {
    const question = config.questions[currentIndex];
    const total = config.questions.length;
    const current = currentIndex + 1;
    const percent = Math.round((current / total) * 100);

    questionKicker.textContent = `QUESTION ${current}`;
    questionTitle.textContent = question.text;
    progressText.textContent = `${current} / ${total}`;
    progressFill.style.width = `${percent}%`;
    progressBar.setAttribute('aria-valuenow', String(percent));
    answerList.classList.toggle('answer-list-binary', question.options.length === 2);
    answerList.replaceChildren();

    question.options.forEach((option, index) => {
      answerList.append(createAnswerButton(option, index, answers[currentIndex]?.value, (selected) => {
        answers[currentIndex] = { value: selected.value, scores: selected.scores || {} };
        answers = answers.slice(0, currentIndex + 1);
        currentIndex += 1;
        if (currentIndex < total) {
          renderQuestion();
          questionTitle.focus({ preventScroll: true });
        } else {
          resolveResult();
        }
      }));
    });

    previousButton.disabled = currentIndex === 0;
    showScreen(questionScreen);
  };

  const calculateScores = () => {
    const scores = {};
    answers.forEach((answer) => {
      Object.entries(answer.scores).forEach(([key, value]) => {
        scores[key] = (scores[key] || 0) + Number(value || 0);
      });
    });
    Object.entries(tieAnswers).forEach(([key, value]) => {
      scores[value] = (scores[value] || 0) + 1;
      scores[key] = scores[key] || 0;
    });
    return scores;
  };

  const renderTieQuestion = () => {
    const dimensionKey = tieDimensions[tieIndex];
    const tieQuestion = config.tieBreakers[dimensionKey];
    const current = config.questions.length + tieIndex + 1;
    const total = config.questions.length + tieDimensions.length;
    const percent = Math.round((current / total) * 100);

    questionKicker.textContent = '동점 확인 질문';
    questionTitle.textContent = tieQuestion.text;
    progressText.textContent = `${current} / ${total}`;
    progressFill.style.width = `${percent}%`;
    progressBar.setAttribute('aria-valuenow', String(percent));
    answerList.classList.add('answer-list-binary');
    answerList.replaceChildren();
    tieQuestion.options.forEach((option, index) => {
      answerList.append(createAnswerButton(option, index, tieAnswers[dimensionKey], (selected) => {
        tieAnswers[dimensionKey] = selected.value;
        tieIndex += 1;
        if (tieIndex < tieDimensions.length) renderTieQuestion();
        else renderMbtiResult();
      }));
    });
    previousButton.disabled = false;
    showScreen(questionScreen);
  };

  const mergeUnique = (...lists) => [...new Set(lists.flat())];
  const interleave = (first = [], second = []) => {
    const mixed = [];
    const length = Math.max(first.length, second.length);
    for (let index = 0; index < length; index += 1) {
      if (first[index] !== undefined) mixed.push(first[index]);
      if (second[index] !== undefined) mixed.push(second[index]);
    }
    return mixed;
  };

  const buildBlendedResult = (first, second) => ({
    key: `${first.key}-${second.key}`,
    icon: `${first.icon}${second.icon}`,
    name: `${first.name} × ${second.name}`,
    catchphrase: `${first.catchphrase} 두 장점을 상황에 맞게 오가는 혼합형입니다.`,
    description: `두 유형의 점수가 같아 한쪽으로 단정하기보다 복합 성향으로 해석하는 편이 자연스럽습니다. ${first.description} ${second.description}`,
    features: mergeUnique(first.features, second.features).slice(0, 6),
    strengths: mergeUnique(first.strengths, second.strengths).slice(0, 5),
    cautions: mergeUnique(first.cautions, second.cautions).slice(0, 5),
    fit: mergeUnique(first.fit, second.fit).slice(0, 5),
    actions: mergeUnique(first.actions, second.actions).slice(0, 5),
    hobbies: interleave(first.hobbies, second.hobbies).slice(0, 6),
    prompts: interleave(first.prompts, second.prompts).slice(0, 4)
  });

  const resolveResult = () => {
    if (answers.length !== config.questions.length || answers.some((answer) => !answer)) {
      announce('모든 질문에 답해야 결과를 볼 수 있습니다.');
      currentIndex = Math.max(0, answers.findIndex((answer) => !answer));
      renderQuestion();
      return;
    }

    if (config.scoring === 'mbti') {
      const scores = calculateScores();
      tieDimensions = Object.entries(config.dimensions)
        .filter(([, pair]) => (scores[pair[0]] || 0) === (scores[pair[1]] || 0))
        .map(([key]) => key);
      tieIndex = 0;
      if (tieDimensions.length) renderTieQuestion();
      else renderMbtiResult();
      return;
    }

    renderCategoryResult();
  };

  const renderMbtiResult = () => {
    const scores = calculateScores();
    const type = Object.values(config.dimensions).map(([left, right]) => {
      return (scores[left] || 0) >= (scores[right] || 0) ? left : right;
    }).join('');
    resultData = { ...config.results[type], key: type };
    renderResult(scores, config.scoreLabels);
  };

  const renderCategoryResult = () => {
    const scores = calculateScores();
    const ranked = Object.keys(config.results).sort((a, b) => (scores[b] || 0) - (scores[a] || 0));
    const topScore = scores[ranked[0]] || 0;
    const tied = ranked.filter((key) => (scores[key] || 0) === topScore);
    if (tied.length > 1) {
      const first = { ...config.results[tied[0]], key: tied[0] };
      const second = { ...config.results[tied[1]], key: tied[1] };
      resultData = buildBlendedResult(first, second);
    } else {
      resultData = { ...config.results[ranked[0]], key: ranked[0] };
    }
    renderResult(scores, config.scoreLabels);
  };

  const addListSection = (container, title, items, className = 'trait-list') => {
    if (!items?.length) return;
    const section = document.createElement('section');
    section.className = 'result-section';
    const heading = document.createElement('h3');
    heading.textContent = title;
    const list = document.createElement('ul');
    list.className = className;
    items.forEach((item) => {
      const li = document.createElement('li');
      li.textContent = item;
      list.append(li);
    });
    section.append(heading, list);
    container.append(section);
  };

  const renderScoreBars = (container, scores, labels) => {
    const entries = Object.entries(labels || {});
    if (!entries.length) return;
    const max = config.scoring === 'mbti'
      ? Math.max(1, ...Object.values(config.dimensions).map((pair) => pair.reduce((sum, key) => sum + (scores[key] || 0), 0)))
      : Math.max(1, ...Object.values(scores));
    const group = document.createElement('div');
    group.className = 'score-bars';
    group.setAttribute('aria-label', '성향별 점수');
    entries.forEach(([key, label]) => {
      const value = scores[key] || 0;
      const percent = Math.round((value / max) * 100);
      const row = document.createElement('div');
      row.className = 'score-row';
      row.innerHTML = `<span class="score-label"></span><span class="score-track"><span class="score-fill"></span></span><span class="score-value"></span>`;
      row.querySelector('.score-label').textContent = label;
      row.querySelector('.score-fill').style.width = `${percent}%`;
      row.querySelector('.score-value').textContent = `${value}점`;
      group.append(row);
    });
    container.append(group);
  };

  const renderHobbies = (container, hobbies) => {
    if (!hobbies?.length) return;
    const heading = document.createElement('h3');
    heading.textContent = '추천 취미 6가지';
    heading.className = 'section-subtitle';
    const grid = document.createElement('div');
    grid.className = 'hobby-grid';
    hobbies.forEach((hobby) => {
      const card = document.createElement('article');
      card.className = 'hobby-card';
      card.innerHTML = '<h3></h3><p data-reason></p><p data-detail></p>';
      card.querySelector('h3').textContent = `${hobby.icon || '✨'} ${hobby.name}`;
      card.querySelector('[data-reason]').textContent = hobby.reason;
      card.querySelector('[data-detail]').innerHTML = `<strong>난이도</strong> ${hobby.difficulty} · <strong>비용</strong> ${hobby.cost} · <strong>혼자 가능</strong> ${hobby.solo} · <strong>추천 장소</strong> ${hobby.place}`;
      grid.append(card);
    });
    container.append(heading, grid);
  };

  const renderResult = (scores, labels) => {
    resultScreen.replaceChildren();
    const hero = document.createElement('div');
    hero.className = 'result-hero';
    hero.innerHTML = '<div class="result-icon" aria-hidden="true"></div><p class="result-eyebrow">나의 테스트 결과</p><h2 tabindex="-1"></h2><p class="result-catchphrase"></p><p class="result-description"></p>';
    hero.querySelector('.result-icon').textContent = resultData.icon || '✨';
    hero.querySelector('h2').textContent = resultData.name;
    hero.querySelector('.result-catchphrase').textContent = resultData.catchphrase;
    hero.querySelector('.result-description').textContent = resultData.description;
    resultScreen.append(hero);
    renderScoreBars(resultScreen, scores, labels);

    const sections = document.createElement('div');
    sections.className = 'result-sections';
    addListSection(sections, '주요 특징', resultData.features);
    addListSection(sections, '강점', resultData.strengths);
    addListSection(sections, '주의할 점', resultData.cautions);
    addListSection(sections, '잘 맞는 환경과 활동', resultData.fit);
    addListSection(sections, '바로 해볼 행동', resultData.actions, 'action-list');
    addListSection(sections, 'AI에게 이렇게 요청해 보세요', resultData.prompts, 'action-list');
    resultScreen.append(sections);
    renderHobbies(resultScreen, resultData.hobbies);

    const actions = document.createElement('div');
    actions.className = 'test-actions';
    actions.innerHTML = '<button class="button button-primary" type="button" data-share-result>결과 공유하기</button><button class="button button-secondary" type="button" data-copy-result>결과 텍스트 복사</button><button class="button button-secondary" type="button" data-restart-test>테스트 다시 하기</button>';
    resultScreen.append(actions);

    actions.querySelector('[data-share-result]').addEventListener('click', shareResult);
    actions.querySelector('[data-copy-result]').addEventListener('click', copyResult);
    actions.querySelector('[data-restart-test]').addEventListener('click', restartTest);
    progressFill.style.width = '100%';
    progressBar.setAttribute('aria-valuenow', '100');
    showScreen(resultScreen);
    resultScreen.querySelector('h2').focus({ preventScroll: true });
    announce(`${resultData.name} 결과가 완성되었습니다.`);
  };

  const resultText = () => {
    const features = resultData.features?.slice(0, 4).map((item) => `- ${item}`).join('\n') || '';
    return `[생활계산소 ${config.title}]\n${resultData.icon || '✨'} ${resultData.name}\n${resultData.catchphrase}\n\n주요 특징\n${features}\n\n${window.location.origin}${window.location.pathname}`;
  };

  const copyText = async (text) => {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.append(textarea);
    textarea.select();
    document.execCommand('copy');
    textarea.remove();
  };

  async function copyResult() {
    try {
      await copyText(resultText());
      announce('결과 텍스트를 복사했습니다.');
    } catch (error) {
      announce('복사하지 못했습니다. 브라우저 권한을 확인해 주세요.');
    }
  }

  async function shareResult() {
    const data = { title: `${config.title} 결과`, text: resultText(), url: `${window.location.origin}${window.location.pathname}` };
    if (navigator.share) {
      try {
        await navigator.share(data);
        announce('공유 메뉴를 열었습니다.');
        return;
      } catch (error) {
        if (error.name === 'AbortError') return;
      }
    }
    await copyResult();
  }

  const restartTest = () => {
    answers = [];
    currentIndex = 0;
    tieDimensions = [];
    tieIndex = 0;
    tieAnswers = {};
    resultData = null;
    showScreen(startScreen);
    startScreen.querySelector('[data-start-test]').focus({ preventScroll: true });
    announce('테스트가 초기화되었습니다.');
  };

  root.querySelector('[data-start-test]').addEventListener('click', () => {
    answers = [];
    currentIndex = 0;
    tieAnswers = {};
    renderQuestion();
    announce('첫 번째 질문입니다.');
  });

  previousButton.addEventListener('click', () => {
    if (tieDimensions.length && currentIndex >= config.questions.length) {
      if (tieIndex > 0) {
        tieIndex -= 1;
        delete tieAnswers[tieDimensions[tieIndex]];
        renderTieQuestion();
      } else {
        tieDimensions = [];
        currentIndex = config.questions.length - 1;
        renderQuestion();
      }
      return;
    }
    if (currentIndex > 0) {
      currentIndex -= 1;
      renderQuestion();
    }
  });
})();
