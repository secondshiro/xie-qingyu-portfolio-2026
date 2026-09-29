(() => {
  'use strict';

  const deck = document.querySelector('[data-deck]');
  const record = document.querySelector('[data-record]');
  const crate = document.querySelector('.crate');
  const sleeves = [...document.querySelectorAll('[data-select]')];
  const articles = [...document.querySelectorAll('[data-work]')];
  const sideButtons = [...document.querySelectorAll('[data-side]')];
  const announcement = document.querySelector('[data-announcement]');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!deck || !record || !crate || !sleeves.length || sleeves.length !== articles.length) return;

  // 阅读状态立即更新，唱机颜色仅在旧唱片完全不可见时提交。
  let selected = 0;
  let loaded = 0;
  let face = 'a';
  const casePaths = new Set(articles.map(article => new URL(article.querySelector('.work__open').href, location.href).pathname));
  const returnStateKey = 'portfolio:home';
  try {
    const previous = document.referrer && new URL(document.referrer);
    const fromCase = previous && previous.origin === location.origin && casePaths.has(previous.pathname);
    const saved = history.state?.portfolioHome ?? (fromCase ? JSON.parse(sessionStorage.getItem(returnStateKey) || 'null') : null);
    if (saved && Number.isInteger(saved.selected) && saved.selected >= 0 && saved.selected < sleeves.length) {
      selected = saved.selected;
      face = saved.face === 'b' ? 'b' : 'a';
    }
    if (fromCase) sessionStorage.removeItem(returnStateKey);
  } catch {
    // Private browsing or restricted storage must not prevent navigation.
  }
  let sequence = 0;
  const animations = new Set();
  const title = index => articles[index].querySelector('.work__title').textContent.trim();
  const motionOff = () => reducedMotion.matches || typeof record.animate !== 'function';

  function paintFaces() {
    articles[selected].querySelectorAll('[data-face]').forEach(node => {
      node.hidden = node.dataset.face !== face;
    });
  }

  function paintSelection(index) {
    selected = index;
    sleeves.forEach((sleeve, i) => {
      sleeve.setAttribute('aria-pressed', String(i === index));
    });
    articles.forEach((article, i) => { article.hidden = i !== index; });
    paintFaces();
    announcement.textContent = `已选择${title(index)}，${face === 'a' ? '设计思路' : '交付与阶段'}`;
  }

  function syncDeck(index) {
    loaded = index;
    deck.dataset.loaded = String(index);
    deck.style.setProperty('--disc', getComputedStyle(sleeves[index]).getPropertyValue('--disc').trim());
    deck.style.setProperty('--needle', sleeves.length > 1 ? String(index / (sleeves.length - 1)) : '0');
    deck.setAttribute('aria-label', `唱机，当前唱片为${title(index)}`);
  }

  function setPhase(phase) {
    deck.dataset.phase = phase;

  }

  function cancelSequence() {
    sequence += 1;
    for (const animation of animations) animation.cancel();
    animations.clear();
    sleeves.forEach(sleeve => { delete sleeve.dataset.extracting; });
  }

  function animate(element, keyframes, duration, easing = 'ease', fill = 'forwards') {
    const animation = element.animate(keyframes, { duration, easing, fill });
    animations.add(animation);
    return animation.finished;
  }

  function settle() {
    cancelSequence();
    syncDeck(selected);
    deck.classList.add('is-playing');
    setPhase('idle');
  }

  async function playSelection(index, positions) {
    cancelSequence();
    const token = sequence;
    if (motionOff()) { settle(); return; }
    const forward = (index - loaded + sleeves.length) % sleeves.length;
    const direction = forward * 2 <= sleeves.length ? 1 : -1;
    const current = () => token === sequence;
    try {
      // 从当前可见位置接续，让快速改选时的抽出与归位都不跳帧。
      sleeves[index].dataset.extracting = 'true';
      setPhase('extracting');
      await Promise.all(sleeves.map((sleeve, i) => {
        if (i !== index && positions[i].opacity === '1' && Math.abs(new DOMMatrix(positions[i].transform).m42 + sleeve.querySelector('.sleeve__record').offsetHeight * 0.24) < 1) return Promise.resolve();
        return animate(
        sleeve.querySelector('.sleeve__record'),
        [
          positions[i],
          { transform: i === index ? 'translate(4%, -70%)' : 'translate(4%, -60%)', opacity: 1, offset: 0.65 },
          { transform: i === index ? 'translate(4%, -103%)' : 'translate(4%, -24%)', opacity: i === index ? 0 : 1 }
        ],
        520, 'cubic-bezier(0.2, 0.75, 0.25, 1)'
        );
      }));
      if (!current()) return;

      setPhase('lifting');
      deck.classList.remove('is-playing');
      await animate(record, [{ opacity: 1 }, { opacity: 1 }], 380);
      if (!current()) return;

      setPhase('outgoing');
      await animate(record, [
        { transform: 'translateX(0)', opacity: 1 },
        { transform: `translateX(${-direction * 62}%)`, opacity: 0 }
      ], 190, 'cubic-bezier(0.45, 0, 0.72, 0.22)');
      if (!current()) return;

      syncDeck(index);
      setPhase('incoming');
      await animate(record, [
        { transform: `translateX(${direction * 62}%)`, opacity: 0 },
        { transform: 'translateX(0)', opacity: 1 }
      ], 350, 'cubic-bezier(0.16, 0.84, 0.26, 1)');
      if (!current()) return;

      setPhase('lowering');
      deck.classList.add('is-playing');
      await animate(record, [{ opacity: 1 }, { opacity: 1 }], 380);
      if (current()) settle();
    } catch (error) {
      // 新输入或系统减弱动效触发的取消属于预期路径。
      if (error.name !== 'AbortError') console.error('唱片动画失败', error);
      if (current()) settle();
    }
  }

  function select(index) {
    const target = (index + sleeves.length) % sleeves.length;
    if (target === selected) return;
    const positions = sleeves.map(sleeve => {
      const style = getComputedStyle(sleeve.querySelector('.sleeve__record'));
      return { transform: style.transform, opacity: style.opacity };
    });
    paintSelection(target);
    void playSelection(target, positions);
  }

  sleeves.forEach((sleeve, index) => sleeve.addEventListener('click', () => select(index)));
  crate.addEventListener('keydown', event => {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    const index = sleeves.indexOf(event.target);
    if (index < 0) return;
    let target;
    if (event.key === 'ArrowLeft') target = (index - 1 + sleeves.length) % sleeves.length;
    else if (event.key === 'ArrowRight') target = (index + 1) % sleeves.length;
    else if (event.key === 'Home') target = 0;
    else if (event.key === 'End') target = sleeves.length - 1;
    else return;
    event.preventDefault();
    sleeves[target].focus({ preventScroll: true });
    select(target);
  });

  function selectFace(nextFace) {
    face = nextFace;
    sideButtons.forEach(item => item.setAttribute('aria-pressed', String(item.dataset.side === face)));
    paintFaces();
    announcement.textContent = `${title(selected)}，${face === 'a' ? '设计思路' : '交付与阶段'}`;
  }
  sideButtons.forEach(button => button.addEventListener('click', () => selectFace(button.dataset.side)));
  document.addEventListener('keydown', event => {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
    if (event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') select(selected + (event.key === 'ArrowRight' ? 1 : -1));
    else selectFace(face === 'a' ? 'b' : 'a');
  });

  document.querySelectorAll('[data-direction]').forEach(button => button.addEventListener('click', () => {
    const direction = button.dataset.direction;
    if (direction === 'left' || direction === 'right') select(selected + (direction === 'right' ? 1 : -1));
    else selectFace(face === 'a' ? 'b' : 'a');
  }));

  document.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
    const link = event.target instanceof Element && event.target.closest('a');
    if (!link || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
    const target = new URL(link.href, location.href);
    if (target.origin !== location.origin || !casePaths.has(target.pathname)) return;
    try {
      const saved = { selected, face };
      history.replaceState({ ...history.state, portfolioHome: saved }, '');
      sessionStorage.setItem(returnStateKey, JSON.stringify(saved));
    } catch {
      // The case remains reachable when session storage is unavailable.
    }
  });

  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) settle();
  });

  document.querySelectorAll('[data-protected-media]').forEach(media => {
    media.addEventListener('contextmenu', event => event.preventDefault());
    media.addEventListener('dragstart', event => event.preventDefault());
  });

  paintSelection(selected);
  selectFace(face);
  settle();
})();
