(function () {
  'use strict';

  /* ── 모바일 사이드바 토글 ── */
  var toggle = document.querySelector('[data-menu-toggle]');
  var panel = document.querySelector('[data-menu-panel]');
  if (toggle && panel) {
    toggle.addEventListener('click', function () {
      var open = panel.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  /* ── 글 목록: 클라이언트 검색 + 페이지네이션 ── */
  var listEl = document.querySelector('[data-post-list]');
  if (!listEl) return;

  var cards = Array.prototype.slice.call(listEl.querySelectorAll('[data-post]'));
  var total = cards.length;
  var input = document.querySelector('[data-search]');
  var countEl = document.querySelector('[data-result-count]');
  var emptyEl = document.querySelector('[data-empty]');
  var pagerEl = document.querySelector('[data-pager]');
  var clearBtn = document.querySelector('[data-clear-search]');
  var PAGE_SIZE = 8;
  var query = '';
  var page = 0;

  // URL ?q= 초기값 반영 (사이드바 검색 폼이 홈으로 GET 제출할 때)
  try {
    var q0 = new URLSearchParams(window.location.search).get('q');
    if (q0) { query = q0.trim().toLowerCase(); if (input) input.value = q0; }
  } catch (e) {}

  function matches(card) {
    if (!query) return true;
    return (card.getAttribute('data-search') || '').indexOf(query) !== -1;
  }

  function makeBtn(label, opts) {
    var b = document.createElement('button');
    b.type = 'button';
    b.textContent = label;
    if (opts.current) b.setAttribute('aria-current', 'page');
    if (opts.disabled) b.disabled = true;
    if (opts.aria) b.setAttribute('aria-label', opts.aria);
    if (opts.onClick) b.addEventListener('click', opts.onClick);
    return b;
  }

  function go(p) {
    page = p;
    render();
    listEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function renderPager(pageCount) {
    if (!pagerEl) return;
    pagerEl.innerHTML = '';
    if (pageCount <= 1) { pagerEl.hidden = true; return; }
    pagerEl.hidden = false;
    pagerEl.appendChild(makeBtn('←', { disabled: page === 0, aria: '이전 페이지', onClick: function () { go(page - 1); } }));
    for (var i = 0; i < pageCount; i++) {
      (function (idx) {
        pagerEl.appendChild(makeBtn(String(idx + 1), { current: idx === page, onClick: function () { go(idx); } }));
      })(i);
    }
    pagerEl.appendChild(makeBtn('→', { disabled: page === pageCount - 1, aria: '다음 페이지', onClick: function () { go(page + 1); } }));
  }

  function render() {
    var visible = cards.filter(matches);
    var pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
    if (page > pageCount - 1) page = pageCount - 1;
    if (page < 0) page = 0;

    cards.forEach(function (c) { c.hidden = true; });
    visible.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE).forEach(function (c) { c.hidden = false; });

    if (countEl) {
      countEl.textContent = (visible.length === total) ? (total + '개의 글') : (visible.length + ' / ' + total);
    }
    if (emptyEl) emptyEl.hidden = visible.length !== 0;
    renderPager(pageCount);
  }

  if (input) {
    input.addEventListener('input', function (e) {
      query = (e.target.value || '').trim().toLowerCase();
      page = 0;
      render();
    });
    var form = input.closest('form');
    if (form) {
      form.addEventListener('submit', function (e) { e.preventDefault(); input.blur(); });
    }
  }
  if (clearBtn) {
    clearBtn.addEventListener('click', function () {
      query = '';
      page = 0;
      if (input) input.value = '';
      render();
      if (input) input.focus();
    });
  }

  render();
})();
