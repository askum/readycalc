(() => {
  'use strict';

  const searchInput = document.querySelector('[data-tool-search]');
  const categoryButtons = [...document.querySelectorAll('[data-category-filter]')];
  const cards = [...document.querySelectorAll('[data-tool-card]')];
  const status = document.querySelector('[data-filter-status]');
  const emptyState = document.querySelector('[data-no-results]');
  if (!searchInput || !categoryButtons.length || !cards.length) return;

  let activeCategory = 'all';
  const normalize = (text) => String(text).toLocaleLowerCase('ko-KR').replace(/\s+/g, ' ').trim();

  const applyFilters = () => {
    const query = normalize(searchInput.value);
    let visibleCount = 0;

    cards.forEach((card) => {
      const categories = (card.dataset.category || '').split(/\s+/);
      const searchableText = normalize(card.textContent + ' ' + (card.dataset.search || ''));
      const categoryMatches = activeCategory === 'all' || categories.includes(activeCategory);
      const searchMatches = !query || searchableText.includes(query);
      card.hidden = !(categoryMatches && searchMatches);
      if (!card.hidden) visibleCount += 1;
    });

    const categoryLabel = categoryButtons.find((button) => button.dataset.categoryFilter === activeCategory)?.textContent.trim() || '전체';
    status.textContent = query
      ? `‘${searchInput.value.trim()}’ 검색 결과 ${visibleCount}개`
      : `${categoryLabel} 계산기 ${visibleCount}개`;
    emptyState.hidden = visibleCount !== 0;
  };

  categoryButtons.forEach((button) => {
    button.addEventListener('click', () => {
      activeCategory = button.dataset.categoryFilter;
      categoryButtons.forEach((candidate) => candidate.setAttribute('aria-pressed', String(candidate === button)));
      applyFilters();
    });
  });

  searchInput.addEventListener('input', applyFilters);
  document.querySelector('[data-clear-search]')?.addEventListener('click', () => {
    searchInput.value = '';
    searchInput.focus();
    applyFilters();
  });

  applyFilters();
})();
