// Selection requests sound; the turntable releases playback only after landing.
export function createHomeMusic() {
  const root = document.querySelector('[data-music]');
  const audio = root?.querySelector('audio');
  if (!root || !audio) return { select() {}, phase() {}, preview() {} };
  const find = name => root.querySelector(`[data-music-${name}]`);
  const tracks = {
    0: '/audio/real-estate-gis.m4a',
    1: '/audio/edgecase-planner.m4a',
    2: '/audio/brand-system.m4a',
    3: '/audio/execution-query.m4a',
    4: '/audio/yuejian.m4a',
  };
  let index = -1;
  let ready = false;
  let requested = false;
  let blocked = false;
  let failed = false;
  let request = 0;
  audio.volume = .25;
  root.hidden = false;

  function paint() {
    const silent = audio.muted || audio.volume === 0 || blocked;
    const label = blocked ? '开启声音' : silent ? '取消静音' : '静音';
    find('mute').setAttribute('aria-label', label);
    find('mute').setAttribute('title', label);
    find('mute').setAttribute('aria-pressed', String(silent));
    root.dataset.silent = String(silent);
    root.style.setProperty('--music-volume', `${audio.volume * 100}%`);
    find('status').textContent = blocked ? '点击声音开关即可开启配乐' : failed ? '配乐暂时无法播放' : '';
    root.dataset.state = blocked ? 'blocked' : failed ? 'error' : !tracks[index] ? 'unavailable' : !ready ? 'waiting' : !audio.paused ? 'playing' : 'paused';
  }
  async function resume() {
    if (!requested || !ready || !tracks[index] || audio.muted || audio.volume === 0 || !audio.paused) { paint(); return; }
    const token = ++request;
    try {
      if (audio.error) audio.load();
      await audio.play();
      if (!requested || !ready || !tracks[index] || audio.muted) audio.pause();
      if (token !== request) return;
      blocked = false;
      failed = false;
    } catch (error) {
      if (token !== request || error.name === 'AbortError') return;
      blocked = error.name === 'NotAllowedError';
      failed = !blocked;
    }
    paint();
  }
  find('mute').addEventListener('click', () => {
    requested = true;
    if (audio.volume === 0) { audio.volume = .25; find('volume').value = '25'; audio.muted = false; }
    else if (blocked) audio.muted = false;
    else audio.muted = !audio.muted;
    if (audio.muted) { ++request; audio.pause(); }
    else void resume();
    paint();
  });
  find('volume').addEventListener('input', event => {
    audio.volume = Number(event.target.value) / 100;
    // Changing volume never reverses the visitor's explicit mute choice.
    requested = true;
    if (audio.volume === 0) { ++request; audio.pause(); }
    else void resume();
    paint();
  });
  // Hover alone may be blocked by the browser. Retry on the next normal gesture.
  const unlock = event => {
    if (event.target instanceof Element && event.target.closest('[data-music]')) return;
    if (requested && audio.paused) void resume();
  };
  document.addEventListener('pointerdown', unlock);
  document.addEventListener('keydown', unlock);
  for (const event of ['playing', 'pause', 'waiting']) audio.addEventListener(event, paint);
  audio.addEventListener('error', () => { if (tracks[index]) { failed = true; paint(); } });
  window.addEventListener('pagehide', () => { requested = false; ++request; audio.pause(); paint(); });
  paint();
  return {
    select(next) {
      if (next === index) return;
      ++request;
      ready = false;
      audio.pause();
      index = next;
      failed = false;
      if (tracks[index]) audio.src = tracks[index];
      else audio.removeAttribute('src');
      audio.load();
      paint();
    },
    preview() { requested = true; void resume(); },
    phase(phase) {
      ready = phase === 'idle';
      if (!ready) { ++request; audio.pause(); paint(); }
      else void resume();
    },
  };
}
