import { createHomeMusic } from './home-music.js';

(() => {
  'use strict';

  const deck = document.querySelector('[data-deck]');
  const record = document.querySelector('[data-record]');
  const flipper = document.querySelector('[data-record-flip]');
  const crate = document.querySelector('.crate');
  const sleeves = [...document.querySelectorAll('[data-select]')];
  const articles = [...document.querySelectorAll('[data-work]')];
  const sideButtons = [...document.querySelectorAll('[data-side]')];
  const announcement = document.querySelector('[data-announcement]');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!deck || !record || !flipper || !crate || !sleeves.length || sleeves.length !== articles.length) return;
  const music = createHomeMusic();

  // Animate material opacity without turning the entire 3D record into one flat layer.
  try {
    CSS.registerProperty?.({ name: '--retro-record-visibility', syntax: '<number>', inherits: true, initialValue: '1' });
  } catch { /* The property may already be registered during development. */ }
  const motion = { sleeve: 520, arm: 380, outgoing: 620, incoming: 820, flipLift: 320, flipTurn: 720, flipLower: 380 };

  // 阅读状态立即更新，唱机颜色仅在旧唱片完全不可见时提交。
  let selected = 0;
  let loaded = 0;
  let face = 'a';
  const casePaths = new Set(sleeves.map(sleeve => new URL(sleeve.href, location.href).pathname));
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
  let lidRequestedOpen = false;
  let queuedLidOpen = null;
  let motionKind = null;
  const animations = new Set();
  const title = index => articles[index].querySelector('.work__title').textContent.trim();
  const motionOff = () => reducedMotion.matches || typeof record.animate !== 'function';
  const faceRotation = side => `rotateX(${side === 'b' ? 180 : 0}deg)`;
  const player = deck.closest('.player');
  const hoverPointer = window.matchMedia('(any-hover: hover) and (any-pointer: fine)');
  const resetHoverAngle = () => { player?.style.removeProperty('--retro-hover-yaw'); };

  deck.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse' || event.buttons || !hoverPointer.matches || reducedMotion.matches || deck.dataset.phase !== 'idle') {
      resetHoverAngle();
      return;
    }
    // Use the fixed button bounds so the moving model cannot feed back into its angle.
    const bounds = deck.getBoundingClientRect();
    const offset = Math.max(-1, Math.min(1, (event.clientX - bounds.left) / bounds.width * 2 - 1));
    player?.style.setProperty('--retro-hover-yaw', `${(offset * -3).toFixed(3)}deg`);
  });
  deck.addEventListener('pointerleave', resetHoverAngle);
  deck.addEventListener('pointercancel', resetHoverAngle);
  window.addEventListener('blur', resetHoverAngle);
  hoverPointer.addEventListener('change', resetHoverAngle);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) resetHoverAngle();
  });

  function capturePose() {
    const style = getComputedStyle(record);
    return { transform: style.transform, turn: getComputedStyle(flipper).transform, visibility: style.getPropertyValue('--retro-record-visibility').trim() || '1' };
  }

  function freezePose(pose) {
    record.style.transform = pose.transform;
    record.style.setProperty('--retro-record-visibility', pose.visibility);
    flipper.style.transform = pose.turn;
  }

  function syncRecordFace(side) {
    flipper.style.transform = faceRotation(side);
    deck.dataset.face = side;
  }

  function paintLidControl() {
    const busy = deck.dataset.phase !== 'idle';
    const nextOpen = busy ? (queuedLidOpen === null ? deck.dataset.lid !== 'open' : !queuedLidOpen) : !lidRequestedOpen;
    const action = nextOpen ? '打开' : '合上';
    deck.dataset.lidRequested = lidRequestedOpen ? 'open' : 'closed';
    deck.setAttribute('aria-expanded', String(deck.dataset.lid === 'open'));
    deck.setAttribute('aria-busy', String(busy));
    deck.setAttribute('aria-label', `${busy ? '换片完成后' : ''}${action}唱机盖，当前唱片为${title(loaded)}`);
  }

  function setLid(open) {
    deck.dataset.lid = open ? 'open' : 'closed';
    paintLidControl();
  }

  deck.disabled = false;
  deck.dataset.ready = 'true';
  // Arrow shortcuts must not turn a pointer-acquired focus into a large focus ring.
  deck.addEventListener('pointerdown', () => { deck.dataset.focusOrigin = 'pointer'; });
  const clearPointerFocus = () => { delete deck.dataset.focusOrigin; };
  deck.addEventListener('blur', clearPointerFocus);
  deck.addEventListener('keydown', event => {
    if (event.key === 'Tab') clearPointerFocus();
  });
  deck.addEventListener('click', () => {
    if (deck.dataset.phase === 'idle') {
      lidRequestedOpen = !lidRequestedOpen;
      setLid(lidRequestedOpen);
    } else {
      queuedLidOpen = queuedLidOpen === null ? deck.dataset.lid !== 'open' : !queuedLidOpen;
      lidRequestedOpen = queuedLidOpen;
      paintLidControl();
    }
  });

  function paintFaces() {
    articles[selected].querySelectorAll('[data-face]').forEach(node => {
      node.hidden = node.dataset.face !== face;
    });
  }

  function paintSelection(index) {
    music.select(index);
    selected = index;
    sleeves.forEach((sleeve, i) => {
      sleeve.setAttribute('aria-current', String(i === index));
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
    deck.querySelectorAll('[data-retro-key]').forEach(key => {
      key.classList.toggle('is-current', Number(key.dataset.retroKey) === index);
    });
    syncRecordFace(face);
    paintLidControl();
  }

  function setPhase(phase) {
    deck.dataset.phase = phase;
    music.phase(phase);
    if (phase !== 'idle') resetHoverAngle();
    paintLidControl();
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
    motionKind = null;
    record.style.removeProperty('transform');
    record.style.removeProperty('--retro-record-visibility');
    syncDeck(selected);
    deck.classList.add('is-playing');
    setPhase('idle');
    setLid(lidRequestedOpen);
  }

  async function playSelection(index, positions) {
    if (deck.dataset.phase === 'idle') queuedLidOpen = null;
    const pose = capturePose();
    cancelSequence();
    freezePose(pose);
    motionKind = 'swap';
    const token = sequence;
    if (motionOff()) { settle(); return; }
    const forward = (index - loaded + sleeves.length) % sleeves.length;
    const direction = forward * 2 <= sleeves.length ? 1 : -1;
    const current = () => token === sequence;
    try {
      // 抽片期间先开盖；用户在换片时的开合要求留到落针后执行。
      setLid(true);
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
        motion.sleeve, 'cubic-bezier(0.2, 0.75, 0.25, 1)'
        );
      }));
      if (!current()) return;

      setPhase('lifting');
      deck.classList.remove('is-playing');
      const physicalFace = deck.dataset.face || 'a';
      await Promise.all([
        animate(record, [{ transform: pose.transform, '--retro-record-visibility': pose.visibility }, { transform: 'none', '--retro-record-visibility': 1 }], motion.arm),
        animate(flipper, [{ transform: pose.turn }, { transform: faceRotation(physicalFace) }], motion.arm, 'ease', 'none')
      ]);
      if (!current()) return;
      syncRecordFace(physicalFace);

      setPhase('outgoing');
      const lift = Math.max(24, deck.clientWidth / 640 * 47);
      const travel = Math.max(90, deck.clientWidth / 640 * 144);
      await animate(record, [
        { transform: 'none', '--retro-record-visibility': 1 },
        { transform: `translate3d(0, 0, ${lift}px)`, '--retro-record-visibility': 1, offset: 0.45 },
        { transform: `translate3d(${-direction * travel}px, 24px, ${lift}px)`, '--retro-record-visibility': 0 }
      ], motion.outgoing, 'cubic-bezier(0.32, 0, 0.55, 1)');
      if (!current()) return;

      syncDeck(index);
      setPhase('incoming');
      await animate(record, [
        { transform: `translate3d(${direction * travel}px, 24px, ${lift}px)`, '--retro-record-visibility': 0 },
        { transform: `translate3d(0, 0, ${lift}px)`, '--retro-record-visibility': 1, offset: 0.58 },
        { transform: 'none', '--retro-record-visibility': 1 }
      ], motion.incoming, 'cubic-bezier(0.22, 0.72, 0.24, 1)');
      if (!current()) return;

      setPhase('lowering');
      deck.classList.add('is-playing');
      await animate(record, [{ transform: 'none' }, { transform: 'none' }], motion.arm);
      if (current()) {
        if (deck.dataset.face !== face) void flipRecord();
        else settle();
      }
    } catch (error) {
      // 新输入或系统减弱动效触发的取消属于预期路径。
      if (error.name !== 'AbortError') console.error('唱片动画失败', error);
      if (current()) settle();
    }
  }

  async function flipRecord() {
    if (deck.dataset.phase === 'idle') queuedLidOpen = null;
    const alreadyOpen = deck.dataset.lid === 'open';
    const pose = capturePose();
    cancelSequence();
    freezePose(pose);
    motionKind = 'flip';
    const token = sequence;
    const current = () => token === sequence;
    if (motionOff()) { settle(); return; }
    try {
      setLid(true);
      setPhase('lifting');
      deck.classList.remove('is-playing');
      await animate(record, [{ transform: pose.transform }, { transform: pose.transform }], alreadyOpen ? motion.arm : 700);
      if (!current()) return;

      setPhase('flipping');
      // Lift clear of the spindle, then move forward so the turning edge clears the lid.
      const scale = deck.clientWidth / 640;
      const raised = `translate3d(0, ${46 * scale}px, ${110 * scale}px)`;
      await animate(record, [{ transform: pose.transform }, { transform: raised }], motion.flipLift, 'cubic-bezier(0.3, 0, 0.3, 1)');
      if (!current()) return;
      const targetFace = face;
      await animate(flipper, [{ transform: pose.turn }, { transform: faceRotation(targetFace) }], motion.flipTurn, 'cubic-bezier(0.4, 0, 0.25, 1)');
      if (!current()) return;
      deck.dataset.face = targetFace;
      await animate(record, [{ transform: raised }, { transform: 'none' }], motion.flipLower, 'cubic-bezier(0.3, 0, 0.2, 1)');
      if (!current()) return;

      setPhase('lowering');
      deck.classList.add('is-playing');
      await animate(record, [{ transform: 'none' }, { transform: 'none' }], motion.arm);
      if (current()) settle();
    } catch (error) {
      if (error.name !== 'AbortError') console.error('翻片动画失败', error);
      if (current()) settle();
    }
  }

  function select(index) {
    const target = (index + sleeves.length) % sleeves.length;
    if (target === selected) { music.preview(); return; }
    const positions = sleeves.map(sleeve => {
      const style = getComputedStyle(sleeve.querySelector('.sleeve__record'));
      return { transform: style.transform, opacity: style.opacity };
    });
    paintSelection(target);
    void playSelection(target, positions);
    music.preview();
  }

  sleeves.forEach((sleeve, index) => {
    sleeve.addEventListener('pointerenter', event => {
      if (event.pointerType === 'mouse') select(index);
    });
    sleeve.addEventListener('focus', () => select(index));
  });
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
    const changed = nextFace !== face;
    face = nextFace;
    sideButtons.forEach(item => item.setAttribute('aria-pressed', String(item.dataset.side === face)));
    paintFaces();
    announcement.textContent = `${title(selected)}，${face === 'a' ? '设计思路' : '交付与阶段'}`;
    if (!changed) return;
    if (motionOff()) settle();
    else if (motionKind !== 'swap') void flipRecord();
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
    const sleeveIndex = sleeves.indexOf(link);
    if (sleeveIndex >= 0) select(sleeveIndex);
    try {
      const saved = { selected, face };
      history.replaceState({ ...history.state, portfolioHome: saved }, '');
      sessionStorage.setItem(returnStateKey, JSON.stringify(saved));
    } catch {
      // The case remains reachable when session storage is unavailable.
    }
  });

  reducedMotion.addEventListener('change', () => {
    resetHoverAngle();
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
