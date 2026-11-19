import { musicTracks } from '../lib/music-tracks.js';

// A one-use handoff continues audio across full-page navigation. New tabs do
// not receive that handoff and must explicitly start their own playback.
const stateKey = 'portfolio:music';
const handoffKey = 'portfolio:music-handoff';
const paths = new Set(['/', ...musicTracks.map(track => `/work/${track.slug}/`)]);
const read = key => {
  try { return JSON.parse(sessionStorage.getItem(key) || 'null'); }
  catch { return null; }
};
const write = (key, value) => {
  try { sessionStorage.setItem(key, JSON.stringify(value)); }
  catch { /* Sound and navigation still work with storage disabled. */ }
};
const takeHandoff = () => {
  const handoff = read(handoffKey);
  try { sessionStorage.removeItem(handoffKey); } catch { /* Optional storage. */ }
  return handoff?.to === location.pathname && Date.now() - handoff.created < 20000;
};

export function createMusicSession(root) {
  const audio = root?.querySelector('audio');
  if (!root || !audio) return { select() {}, phase() {}, preview() {} };
  const find = name => root.querySelector(`[data-music-${name}]`);
  const isCase = root.hasAttribute('data-case-music');
  const initial = read(stateKey);
  const continuing = takeHandoff();
  let index = -1;
  let ready = isCase;
  let requested = continuing && initial?.requested === true;
  let userPaused = initial?.userPaused === true;
  let blocked = false;
  let failed = false;
  let waiting = false;
  let leaving = false;
  let request = 0;
  let restoreTime = 0;
  let firstSelection = true;
  let lastSavedSecond = -1;
  let channel;
  const validVolume = value => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1;
  audio.volume = validVolume(initial?.volume) ? initial.volume : .25;
  audio.muted = initial?.muted === true;
  let audibleVolume = audio.volume || .25;
  find('volume').value = String(Math.round(audio.volume * 100));
  root.hidden = false;

  function save() {
    if (index < 0) return;
    write(stateKey, {
      index, time: restoreTime || audio.currentTime, volume: audio.volume,
      muted: audio.muted, requested, userPaused,
    });
  }

  function paint() {
    const silent = audio.muted || audio.volume === 0;
    const unavailable = index < 0;
    const state = unavailable ? 'unavailable' : blocked ? 'blocked' : failed ? 'error'
      : !ready || waiting && requested && !userPaused ? 'waiting' : !audio.paused && !silent ? 'playing' : 'paused';
    root.dataset.state = state;
    root.dataset.silent = String(unavailable || silent || !isCase && (blocked || userPaused));
    root.style.setProperty('--music-volume', `${audio.volume * 100}%`);
    const mute = find('mute');
    const muteLabel = unavailable ? '此作品暂无配乐'
      : !isCase && (blocked || userPaused) ? '开启声音' : silent ? '取消静音' : '静音';
    mute.disabled = unavailable;
    find('volume').disabled = unavailable;
    mute.setAttribute('aria-label', muteLabel);
    mute.setAttribute('title', muteLabel);
    mute.setAttribute('aria-pressed', String(silent));
    const status = find('status');
    if (isCase) {
      const active = requested && !userPaused && !silent && !failed && !blocked;
      const label = state === 'error' ? '重试播放' : state === 'blocked' ? '播放配乐' : active ? '暂停配乐' : '播放配乐';
      find('play').setAttribute('aria-label', label);
      find('play').setAttribute('title', label);
      find('play').setAttribute('aria-pressed', String(active));
      status.textContent = state === 'error' ? '播放失败，点按重试' : state === 'blocked' ? '点按播放'
        : state === 'waiting' && active ? '加载中' : state === 'playing' ? '正在播放'
        : silent ? '已静音' : userPaused ? '已暂停' : '播放配乐';
    } else {
      status.textContent = unavailable ? '此作品暂无配乐'
        : blocked ? '点击声音开关即可开启配乐' : failed ? '配乐暂时无法播放' : '';
    }
  }

  async function resume() {
    if (!requested || userPaused || !ready || index < 0 || audio.muted || audio.volume === 0 || !audio.paused) {
      paint(); return;
    }
    const token = ++request;
    try {
      if (audio.error) { failed = false; audio.load(); }
      await audio.play();
      if (token !== request) return;
      if (!requested || userPaused || !ready || audio.muted) audio.pause();
      blocked = false;
      failed = false;
    } catch (error) {
      if (token !== request || error.name === 'AbortError') return;
      blocked = error.name === 'NotAllowedError';
      failed = !blocked;
      waiting = false;
    }
    paint(); save();
  }

  function pauseByChoice() {
    requested = false;
    userPaused = true;
    ++request;
    audio.pause();
    paint(); save();
  }

  find('play')?.addEventListener('click', () => {
    if (requested && !userPaused && !audio.muted && audio.volume > 0 && !failed && !blocked) {
      pauseByChoice(); return;
    }
    requested = true;
    userPaused = false;
    audio.muted = false;
    if (audio.volume === 0) audio.volume = audibleVolume;
    find('volume').value = String(Math.round(audio.volume * 100));
    void resume();
  });
  find('mute').addEventListener('click', () => {
    if (!isCase && (blocked || userPaused)) {
      userPaused = false;
      requested = true;
      audio.muted = false;
    } else if (audio.volume === 0) {
      audio.volume = audibleVolume;
      find('volume').value = String(Math.round(audio.volume * 100));
      audio.muted = false;
      if (!isCase) requested = true;
    } else {
      audio.muted = !audio.muted;
      if (!isCase) requested = true;
    }
    if (audio.muted) { ++request; audio.pause(); }
    else void resume();
    paint(); save();
  });
  find('volume').addEventListener('input', event => {
    audio.volume = Number(event.target.value) / 100;
    if (audio.volume > 0) audibleVolume = audio.volume;
    if (!isCase && !userPaused) requested = true;
    if (audio.volume === 0) { ++request; audio.pause(); }
    else void resume();
    paint(); save();
  });

  audio.addEventListener('loadedmetadata', () => {
    if (restoreTime > 0 && Number.isFinite(audio.duration)) {
      audio.currentTime = Math.min(restoreTime, Math.max(0, audio.duration - .1));
      restoreTime = 0;
    }
  });
  audio.addEventListener('timeupdate', () => {
    const second = Math.floor(audio.currentTime);
    if (second !== lastSavedSecond && !leaving) { lastSavedSecond = second; save(); }
  });
  audio.addEventListener('playing', () => {
    waiting = false; blocked = false; failed = false;
    channel?.postMessage('playing');
    paint();
  });
  audio.addEventListener('pause', paint);
  audio.addEventListener('waiting', () => { waiting = true; paint(); });
  audio.addEventListener('canplay', () => { waiting = false; paint(); });
  audio.addEventListener('error', () => { failed = true; waiting = false; paint(); });

  // Only the home turntable retries hover playback on a normal gesture.
  if (!isCase) {
    const unlock = event => {
      if (event.target instanceof Element && event.target.closest('[data-music]')) return;
      if (requested && !userPaused && audio.paused) void resume();
    };
    document.addEventListener('pointerdown', unlock);
    document.addEventListener('keydown', unlock);
  }
  document.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
    const link = event.target instanceof Element && event.target.closest('a[href]');
    if (!link || link.hasAttribute('download') || link.target && link.target !== '_self') return;
    const to = new URL(link.href, location.href);
    if (to.origin !== location.origin || !paths.has(to.pathname) || to.pathname === location.pathname) return;
    save();
    write(handoffKey, { to: to.pathname, created: Date.now() });
  });
  window.addEventListener('pagehide', () => {
    save(); leaving = true; ++request; audio.pause();
  });
  window.addEventListener('pageshow', event => {
    if (!event.persisted) return;
    leaving = false;
    const saved = read(stateKey);
    requested = takeHandoff() && saved?.requested === true;
    userPaused = saved?.userPaused === true;
    if (validVolume(saved?.volume)) audio.volume = saved.volume;
    audio.muted = saved?.muted === true;
    find('volume').value = String(Math.round(audio.volume * 100));
    if (saved?.index === index && Number.isFinite(saved.time)) audio.currentTime = saved.time;
    void resume();
    paint();
  });
  try {
    channel = new BroadcastChannel('portfolio:music');
    channel.addEventListener('message', event => { if (event.data === 'playing') pauseByChoice(); });
  } catch { /* Browsers without BroadcastChannel keep per-tab playback. */ }

  paint();
  return {
    select(next) {
      if (next === index) return;
      ++request;
      if (!isCase) ready = false;
      audio.pause();
      index = next;
      blocked = false;
      failed = false;
      waiting = false;
      restoreTime = firstSelection && initial?.index === next && Number.isFinite(initial?.time) && initial.time >= 0 ? initial.time : 0;
      firstSelection = false;
      if (musicTracks[index]) audio.src = `/audio/${musicTracks[index].slug}.m4a`;
      else audio.removeAttribute('src');
      if (requested || !isCase) audio.load();
      paint();
      if (isCase) void resume();
    },
    preview() { if (!userPaused) requested = true; void resume(); },
    phase(phase) {
      ready = phase === 'idle';
      if (!ready) { ++request; audio.pause(); paint(); }
      else void resume();
    },
  };
}
