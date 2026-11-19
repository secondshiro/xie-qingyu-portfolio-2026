import { musicTracks } from '../lib/music-tracks.js';
import { createMusicSession } from './music-session.js';

// The turntable keeps its landing/flip gate; both surfaces share audio state.
export function createHomeMusic() {
  const session = createMusicSession(document.querySelector('[data-music]'));
  return {
    ...session,
    select(pathname) {
      session.select(musicTracks.findIndex(track => pathname === `/work/${track.slug}/`));
    },
  };
}
