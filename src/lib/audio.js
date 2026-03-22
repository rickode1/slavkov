/**
 * iOS-safe audio playback using Web Audio API.
 *
 * AudioContext is created once and "unlocked" on the first user interaction
 * (touchstart / click / keydown). After that, all calls to `playSound()`
 * decode and play the given URL through the shared context – even from
 * non-interaction callbacks like $effect or setTimeout.
 */

let ctx = null;
let unlocked = false;
const cache = new Map();   // url → AudioBuffer

function getContext() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return ctx;
}

/** Resume the AudioContext (must be called from a user gesture on iOS). */
function unlock() {
  if (unlocked) return;
  const ac = getContext();
  if (ac.state === 'suspended') {
    ac.resume().catch(() => {});
  }
  // Create & play a silent buffer to fully unlock on iOS Safari
  const buf = ac.createBuffer(1, 1, ac.sampleRate);
  const src = ac.createBufferSource();
  src.buffer = buf;
  src.connect(ac.destination);
  src.start(0);
  unlocked = true;
}

if (typeof window !== 'undefined') {
  const events = ['touchstart', 'touchend', 'click', 'keydown'];
  const handler = () => {
    unlock();
    events.forEach((e) => window.removeEventListener(e, handler, true));
  };
  events.forEach((e) => window.addEventListener(e, handler, { capture: true, passive: true }));
}

async function loadBuffer(url) {
  if (cache.has(url)) return cache.get(url);
  const res = await fetch(url);
  const arrayBuf = await res.arrayBuffer();
  const audioBuf = await getContext().decodeAudioData(arrayBuf);
  cache.set(url, audioBuf);
  return audioBuf;
}

/**
 * Play a sound file. Safe to call from any context (effects, timers, etc.).
 * @param {string} url – path like '/sounds/ding.mp3'
 * @param {{ loop?: boolean }} opts
 * @returns {{ stop: () => void }} handle to stop a looping sound
 */
export function playSound(url, { loop = false } = {}) {
  const ac = getContext();

  // Ensure context is running
  if (ac.state === 'suspended') {
    ac.resume().catch(() => {});
  }

  let sourceNode = null;

  loadBuffer(url)
    .then((buffer) => {
      sourceNode = ac.createBufferSource();
      sourceNode.buffer = buffer;
      sourceNode.loop = loop;
      sourceNode.connect(ac.destination);
      sourceNode.start(0);
    })
    .catch(() => {});

  return {
    stop() {
      try { sourceNode?.stop(); } catch { /* already stopped */ }
    },
  };
}
