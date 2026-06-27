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

  /* ── 읽기 진행률 바: 스크롤 위치를 최상단 바 너비로 반영 ── */
  var progressBar = document.querySelector('[data-progress]');
  if (progressBar) {
    var updateProgress = function () {
      var doc = document.documentElement;
      var max = doc.scrollHeight - doc.clientHeight;
      var pct = max > 0 ? (window.scrollY / max) * 100 : 0;
      if (pct < 0) pct = 0; else if (pct > 100) pct = 100;
      progressBar.style.width = pct + '%';
    };
    var progressTicking = false;
    var onProgressScroll = function () {
      if (!progressTicking) {
        window.requestAnimationFrame(function () { updateProgress(); progressTicking = false; });
        progressTicking = true;
      }
    };
    window.addEventListener('scroll', onProgressScroll, { passive: true });
    window.addEventListener('resize', onProgressScroll);
    updateProgress();
  }

  /* ── 글 목차(TOC): 스크롤 위치에 따라 현재 섹션 하이라이트 ──
     모바일 박스 + 데스크톱 레일 두 목차([data-toc])의 링크를 함께 처리한다. */
  var tocBoxes = Array.prototype.slice.call(document.querySelectorAll('[data-toc]'));
  if (tocBoxes.length) {
    var linksById = {};   // heading id → [a, a]
    var headings = [];
    var seenId = {};
    tocBoxes.forEach(function (box) {
      Array.prototype.slice.call(box.querySelectorAll('a')).forEach(function (a) {
        var raw = (a.getAttribute('href') || '').replace(/^#/, '');
        if (!raw) return;
        var id = raw;
        try { id = decodeURIComponent(raw); } catch (e) {}
        var el = document.getElementById(id) || document.getElementById(raw);
        if (!el) return;
        (linksById[el.id] = linksById[el.id] || []).push(a);
        if (!seenId[el.id]) { seenId[el.id] = true; headings.push(el); }
      });
    });
    headings.sort(function (a, b) {
      return a.getBoundingClientRect().top - b.getBoundingClientRect().top;
    });

    if (headings.length) {
      var activeId = null;
      var setActive = function (id) {
        if (activeId === id) return;
        if (activeId && linksById[activeId]) {
          linksById[activeId].forEach(function (a) { a.classList.remove('is-active'); });
        }
        if (id && linksById[id]) {
          linksById[id].forEach(function (a) { a.classList.add('is-active'); });
        }
        activeId = id;
      };
      var spy = function () {
        var pos = window.scrollY + 120;
        var cur = headings[0];
        for (var i = 0; i < headings.length; i++) {
          if (headings[i].getBoundingClientRect().top + window.scrollY <= pos) cur = headings[i];
          else break;
        }
        setActive(cur.id);
      };
      var ticking = false;
      window.addEventListener('scroll', function () {
        if (!ticking) {
          window.requestAnimationFrame(function () { spy(); ticking = false; });
          ticking = true;
        }
      }, { passive: true });
      spy();
    }
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
