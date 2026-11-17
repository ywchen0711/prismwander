// Music is recorded tracks from the Ninja Adventure pack (CC0); jingles too. Sound effects are synthesized.
// iPhone and iPad: Safari before 18.4 cannot play Ogg, so the music also comes as .m4a and the format is picked by
// canPlayType. iOS only lets sound start inside a tap or key press and ignores HTMLAudio volume, so the game keeps
// a few audio elements that are unlocked on the first touch and reused (only their src changes), and plays them
// through a gain node when Web Audio is there. Without Web Audio the game just stays quiet instead of failing.
export const vol = { music: 0.5, sfx: 0.6 };
// music can be switched off altogether; the volume is kept for when it comes back on
export const music = { on: true };
try { music.on = localStorage.getItem('prismwander-music') !== 'off'; } catch (e) { /* private mode */ }
const mv = () => (music.on ? vol.music : 0);
const EXT = (() => { try { return new Audio().canPlayType('audio/ogg; codecs="vorbis"') ? 'ogg' : 'm4a'; } catch (e) { return 'm4a'; } })();
const SILENT = 'data:audio/wav;base64,UklGRuwAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YcgAAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgA==';
let A = null, want = null, cur = null, unlocked = false;
// two music players (one fades out while the other starts) and one for jingles
const mk = () => { const a = new Audio(); a.preload = 'auto'; a.setAttribute('playsinline', ''); return { a, g: null, fade: 0, vol: 0 }; };
const players = [mk(), mk()], jing = mk();
let el = null; // the player holding the current track
function hook(p) { // route an element through a gain node so volume and fades work on iOS
  if (!A || p.g) return;
  try { const s = A.createMediaElementSource(p.a), g = A.createGain(); s.connect(g); g.connect(A.destination); p.g = g; g.gain.value = p.vol; p.a.volume = 1; } catch (e) { /* plain element volume */ }
}
function setVol(p, v) { p.vol = v; if (p.g) p.g.gain.value = v; else { try { p.a.volume = v; } catch (e) { /* read-only */ } } }
const play = (p) => { try { const r = p.a.play(); if (r && r.catch) r.catch(() => {}); } catch (e) { /* not allowed yet */ } };
function makeCtx() {
  if (A) return;
  try { A = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { A = null; return; }
  for (const p of [...players, jing]) hook(p);
}
// called from every tap, click and key press (and from the music button): unlock everything iOS needs a gesture for
export function initAudio() {
  try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) { /* older iOS */ }
  makeCtx();
  if (A) {
    if (A.state !== 'running') { try { const r = A.resume(); if (r && r.catch) r.catch(() => {}); } catch (e) { /* ignore */ } }
    if (!unlocked) { try { const b = A.createBuffer(1, 1, 22050), s = A.createBufferSource(); s.buffer = b; s.connect(A.destination); s.start(0); } catch (e) { /* ignore */ } }
  }
  if (!unlocked) {
    unlocked = true;
    for (const p of [...players, jing]) if (p !== el && !p.a.getAttribute('src')) { p.a.src = SILENT; play(p); }
  }
  if (want && !el) playMusic(want, { force: true });
  else if (el && el.a.paused && music.on && !document.hidden) play(el);
}
export function playMusic(name, { force = false } = {}) {
  want = name;
  if (!force && cur === name && el) return;
  stopMusic();
  if (!name) return;
  cur = name;
  const p = players.find((q) => !q.fade) || players[0];
  if (p.fade) { clearInterval(p.fade); p.fade = 0; }
  p.a.loop = true; p.a.src = 'assets/music/' + name + '.' + EXT; setVol(p, mv());
  el = p;
  if (unlocked && music.on) play(p);
}
export function stopMusic() {
  if (el) {
    const p = el; let v = p.vol;
    if (p.fade) clearInterval(p.fade);
    p.fade = setInterval(() => { v -= 0.08; if (v <= 0) { p.a.pause(); clearInterval(p.fade); p.fade = 0; } else setVol(p, v); }, 40);
  }
  el = null; cur = null;
}
export function setVolumes() { if (el) setVol(el, mv()); }
export function setMusic(on) {
  music.on = on; setVolumes();
  // iOS plays at full volume whatever the element volume says, so switching off also pauses
  if (el) { if (on) { if (unlocked) play(el); } else el.a.pause(); }
  try { localStorage.setItem('prismwander-music', on ? 'on' : 'off'); } catch (e) { /* private mode */ }
  const b = document.getElementById('musicBtn'); if (b) b.classList.toggle('off', !on);
}
export function jingle(n) { if (jing.fade) { clearInterval(jing.fade); jing.fade = 0; } jing.a.loop = false; jing.a.src = 'assets/jingle/' + n + '.wav'; setVol(jing, vol.sfx); play(jing); }
// iOS stops sound when the tab is hidden, a call comes in or the phone is locked ('interrupted'): pause, then pick up again
function wake() {
  if (document.hidden) return;
  if (A && A.state !== 'running') { try { const r = A.resume(); if (r && r.catch) r.catch(() => {}); } catch (e) { /* needs a tap */ } }
  if (el && el.a.paused && music.on && unlocked) play(el);
}
document.addEventListener('visibilitychange', () => { if (document.hidden) { if (el) el.a.pause(); } else wake(); });
addEventListener('pageshow', wake);
addEventListener('focus', wake);
// iOS only unlocks sound on touchend / click / keydown (not touchstart or pointerdown); capture phase so the
// on-screen pad, which cancels its touches, still counts
for (const ev of ['touchend', 'click', 'keydown', 'pointerup']) addEventListener(ev, initAudio, { capture: true, passive: true });
function tone(f0, f1, len, type = 'square', v = 0.12, t0 = 0) {
  if (!A || A.state !== 'running') return;
  const t = A.currentTime + t0, o = A.createOscillator(), g = A.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + len);
  g.gain.setValueAtTime(v * vol.sfx * 2, t); g.gain.exponentialRampToValueAtTime(0.001, t + len);
  o.connect(g); g.connect(A.destination); o.start(t); o.stop(t + len + 0.02);
}
function noise(len, f, v = 0.3, t0 = 0) {
  if (!A || A.state !== 'running') return;
  const t = A.currentTime + t0, b = A.createBuffer(1, Math.floor(A.sampleRate * len), A.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const s = A.createBufferSource(); s.buffer = b; const fl = A.createBiquadFilter(); fl.type = 'bandpass'; fl.frequency.value = f; const g = A.createGain(); g.gain.value = v * vol.sfx * 2;
  s.connect(fl); fl.connect(g); g.connect(A.destination); s.start(t);
}
export function sfx(n) { try { sfx1(n); } catch (e) { /* a sound never stops the game */ } }
function sfx1(n) {
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
