import { createMusicSession } from './music-session.js';

// The turntable keeps its landing/flip gate; both surfaces share audio state.
export function createHomeMusic() {
  return createMusicSession(document.querySelector('[data-music]'));
}
