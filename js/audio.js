// Music is recorded tracks from the Ninja Adventure pack (CC0); jingles too. Sound effects are synthesized.
export const vol = { music: 0.5, sfx: 0.6 };
let A = null, el = null, want = null, cur = null;
export function initAudio() {
  if (!A) { try { A = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; } }
  if (A.state === 'suspended') A.resume();
  if (want && !el) playMusic(want, { force: true });
}
export function playMusic(name, { force = false } = {}) {
  want = name;
  if (!force && cur === name && el) return;
  stopMusic();
  if (!name) return;
  cur = name;
  const a = new Audio('assets/music/' + name + '.ogg'); a.loop = true; a.volume = vol.music;
  el = a;
  if (A) a.play().catch(() => {});
}
export function stopMusic() { if (el) { const a = el; let v = a.volume; const t = setInterval(() => { v -= 0.08; if (v <= 0) { a.pause(); clearInterval(t); } else a.volume = v; }, 40); } el = null; cur = null; }
export function setVolumes() { if (el) el.volume = vol.music; }
export function jingle(n) { const a = new Audio('assets/jingle/' + n + '.wav'); a.volume = vol.sfx; a.play().catch(() => {}); }
function tone(f0, f1, len, type = 'square', v = 0.12, t0 = 0) {
  if (!A) return;
  const t = A.currentTime + t0, o = A.createOscillator(), g = A.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + len);
  g.gain.setValueAtTime(v * vol.sfx * 2, t); g.gain.exponentialRampToValueAtTime(0.001, t + len);
  o.connect(g); g.connect(A.destination); o.start(t); o.stop(t + len + 0.02);
}
function noise(len, f, v = 0.3, t0 = 0) {
  if (!A) return;
  const t = A.currentTime + t0, b = A.createBuffer(1, Math.floor(A.sampleRate * len), A.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const s = A.createBufferSource(); s.buffer = b; const fl = A.createBiquadFilter(); fl.type = 'bandpass'; fl.frequency.value = f; const g = A.createGain(); g.gain.value = v * vol.sfx * 2;
  s.connect(fl); fl.connect(g); g.connect(A.destination); s.start(t);
}
export function sfx(n) {
  switch (n) {
    case 'cursor': tone(880, 880, 0.04, 'square', 0.05); break;
    case 'ok': tone(660, 990, 0.08, 'square', 0.07); break;
    case 'cancel': tone(500, 300, 0.08, 'square', 0.06); break;
    case 'buzz': tone(140, 120, 0.15, 'sawtooth', 0.08); break;
    case 'jump': tone(300, 700, 0.12, 'triangle', 0.12); break;
    case 'land': noise(0.06, 400, 0.15); break;
    case 'hit': noise(0.12, 1800, 0.5); tone(220, 80, 0.1, 'square', 0.1); break;
    case 'crit': noise(0.2, 3000, 0.6); tone(440, 60, 0.18, 'sawtooth', 0.12); break;
    case 'miss': tone(1200, 1800, 0.1, 'triangle', 0.06); break;
    case 'magic': for (let i = 0; i < 4; i++) tone(500 + i * 200, 900 + i * 260, 0.12, 'triangle', 0.07, i * 0.05); break;
    case 'fire': noise(0.45, 600, 0.5); break;
    case 'ice': for (let i = 0; i < 5; i++) tone(1600 + i * 300, 2400, 0.08, 'sine', 0.06, i * 0.04); break;
    case 'bolt': noise(0.3, 2500, 0.6); tone(1400, 90, 0.3, 'square', 0.1); break;
    case 'heal': for (let i = 0; i < 5; i++) tone(520 * Math.pow(1.26, i), 520 * Math.pow(1.26, i), 0.12, 'sine', 0.08, i * 0.06); break;
    case 'buff': for (let i = 0; i < 3; i++) tone(400 + i * 200, 600 + i * 200, 0.1, 'triangle', 0.08, i * 0.06); break;
    case 'die': noise(0.4, 900, 0.4); tone(300, 50, 0.4, 'square', 0.08); break;
    case 'encounter': tone(200, 1600, 0.35, 'square', 0.1); noise(0.35, 1200, 0.2); break;
    case 'chest': for (const [i, f] of [[0, 523], [1, 659], [2, 784], [3, 1046]]) tone(f, f, 0.1, 'square', 0.08, i * 0.07); break;
    case 'step': noise(0.03, 500, 0.06); break;
    case 'warp': tone(200, 2000, 0.6, 'sine', 0.1); break;
  }
}
