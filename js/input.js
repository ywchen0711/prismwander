// Keyboard, gamepad, touch stick and buttons, and mouse drag to turn the camera.
const held = new Set(), down = new Set();
const KEYS = {
  ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
  Space: 'jump', KeyZ: 'a', Enter: 'a', KeyE: 'a', KeyX: 'b', Escape: 'menu', Backspace: 'b', KeyQ: 'turnL', KeyR: 'turnR', KeyT: 'lookUp', KeyG: 'lookDown', KeyC: 'view', Tab: 'map', ShiftLeft: 'run', ShiftRight: 'run', CapsLock: 'autorun', KeyF: 'autorun',
};
addEventListener('keydown', (e) => { const k = KEYS[e.code]; if (!k) return; if (!held.has(k)) down.add(k); held.add(k); e.preventDefault(); });
addEventListener('keyup', (e) => { const k = KEYS[e.code]; if (k) held.delete(k); });
addEventListener('blur', () => held.clear());
// choices that stay between visits: auto-run, and whether the party walks behind the leader
const pref = (k, d) => { try { const v = localStorage.getItem('prismwander-' + k); return v === null ? d : v === '1'; } catch (e) { return d; } };
export const prefs = { autoRun: pref('autorun', false), party: pref('party', true) };
export function setPref(k, v) {
  prefs[k] = !!v;
  try { localStorage.setItem('prismwander-' + (k === 'autoRun' ? 'autorun' : k), v ? '1' : '0'); } catch (e) { /* private mode */ }
  const b = document.getElementById('tRun'); if (b) b.classList.toggle('on', prefs.autoRun);
}
export const input = {
  held: (k) => held.has(k) || pad.held.has(k),
  pressed: (k) => down.has(k) || pad.down.has(k),
  any: () => down.size > 0 || pad.down.size > 0,
  move: { x: 0, z: 0 }, look: 0, lookY: 0, zoom: 0,
  // free look: with the mouse captured, moving it turns the camera without dragging
  get freeLook() { return !!document.pointerLockElement; },
};
// the stick and the camera drag
const stick = { id: null, ox: 0, oy: 0, x: 0, y: 0 };
let drag = null;
export function setupInput(canvas) {
  canvas.addEventListener('pointerdown', (e) => { if (e.pointerType === 'mouse' || !stickArea(e)) drag = { id: e.pointerId, x: e.clientX, y: e.clientY }; });
  // dragging turns the camera both ways: across to swing round, up and down to tilt
  addEventListener('pointermove', (e) => {
    if (document.pointerLockElement === canvas) { input.look -= e.movementX * 0.0035; input.lookY += e.movementY * 0.003; return; }
    if (drag && drag.id === e.pointerId) { input.look -= (e.clientX - drag.x) * 0.008; input.lookY += (e.clientY - drag.y) * 0.006; drag.x = e.clientX; drag.y = e.clientY; }
  });
  // V or the right mouse button captures the mouse for free look; Esc or V again lets it go
  const toggleLock = () => { if (document.pointerLockElement) document.exitPointerLock(); else if (canvas.requestPointerLock) { try { const r = canvas.requestPointerLock(); if (r && r.catch) r.catch(() => {}); } catch (err) { /* not allowed here */ } } };
  addEventListener('keydown', (e) => { if (e.code === 'KeyV' && !e.repeat && !document.querySelector('#menu.on, #dialog.on, #battleui.on, #title.on')) toggleLock(); });
  canvas.addEventListener('contextmenu', (e) => { e.preventDefault(); if (!document.querySelector('#battleui.on, #title.on')) toggleLock(); });
  addEventListener('freelock', () => { if (document.pointerLockElement) document.exitPointerLock(); });
  addEventListener('pointerup', (e) => { if (drag && drag.id === e.pointerId) drag = null; });
  canvas.addEventListener('wheel', (e) => { input.zoom += Math.sign(e.deltaY); e.preventDefault(); }, { passive: false });
  const st = document.getElementById('stick'), knob = document.getElementById('knob');
  const setKnob = () => { knob.style.left = 40 + stick.x * 40 + 'px'; knob.style.top = 40 + stick.y * 40 + 'px'; };
  st.addEventListener('pointerdown', (e) => { stick.id = e.pointerId; const r = st.getBoundingClientRect(); stick.ox = r.left + r.width / 2; stick.oy = r.top + r.height / 2; st.setPointerCapture(e.pointerId); move(e); });
  const move = (e) => { if (stick.id !== e.pointerId) return; let x = (e.clientX - stick.ox) / 50, y = (e.clientY - stick.oy) / 50; const l = Math.hypot(x, y); if (l > 1) { x /= l; y /= l; } stick.x = x; stick.y = y; setKnob(); };
  st.addEventListener('pointermove', move);
  st.addEventListener('pointerup', () => { stick.id = null; stick.x = stick.y = 0; setKnob(); });
  for (const b of document.querySelectorAll('.tbtn[data-k]')) {
    const k = b.dataset.k;
    b.addEventListener('pointerdown', (e) => { e.preventDefault(); if (!held.has(k)) down.add(k); held.add(k); });
    b.addEventListener('pointerup', () => held.delete(k)); b.addEventListener('pointerleave', () => held.delete(k));
  }
  const run = document.getElementById('tRun');
  if (run) { run.classList.toggle('on', prefs.autoRun); run.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); down.add('autorun'); }); }
  addEventListener('touchstart', () => document.body.classList.add('touching'), { once: true });
}
const stickArea = (e) => e.clientX < 200 && e.clientY > innerHeight - 200;
// gamepads (standard layout, e.g. Xbox): A ok, B back, X jump, Y / Start menu, RT run (hold), L3 or Select auto-run,
// LB / RB turn the view (and page the detail panel in menus), right stick looks (with LT held it zooms), R3 resets the
// view. The left stick and the d-pad move, and both step through menus.
const pad = { held: new Set(), down: new Set(), nav: { dir: null, t: 0 }, used: false };
const PADK = { 0: 'a', 1: 'b', 2: 'jump', 3: 'menu', 9: 'menu', 12: 'up', 13: 'down', 14: 'left', 15: 'right', 4: 'turnL', 5: 'turnR', 7: 'run', 10: 'autorun', 8: 'autorun', 11: 'view' };
function pollPad() {
  pad.down.clear();
  const gp = navigator.getGamepads ? [...navigator.getGamepads()].find((g) => g) : null;
  if (!gp) return { x: 0, z: 0 };
  const now = new Set(), b = (i) => gp.buttons[i] && (gp.buttons[i].pressed || gp.buttons[i].value > 0.4);
  for (const i in PADK) if (b(+i)) now.add(PADK[i]);
  for (const k of now) if (!pad.held.has(k)) pad.down.add(k);
  pad.held = now;
  if (now.size && !pad.used) { pad.used = true; document.body.classList.add('pad'); }
  const ax = (i) => (Math.abs(gp.axes[i] || 0) > 0.2 ? gp.axes[i] : 0), lx = ax(0), ly = ax(1);
  // the left stick steps through menus like the d-pad: one step on a push, then repeats while held
  const dir = Math.abs(ly) > 0.6 && Math.abs(ly) >= Math.abs(lx) ? (ly < 0 ? 'up' : 'down') : Math.abs(lx) > 0.6 ? (lx < 0 ? 'left' : 'right') : null;
  const t = performance.now();
  if (dir !== pad.nav.dir) { pad.nav = { dir, t: t + 380 }; if (dir) pad.down.add(dir); }
  else if (dir && t >= pad.nav.t) { pad.nav.t = t + 110; pad.down.add(dir); }
  if (lx || ly) { if (!pad.used) { pad.used = true; document.body.classList.add('pad'); } }
  // right stick: look around; with LT held, up and down zoom instead of tilting
  if (ax(2)) input.look -= ax(2) * 0.04;
  if (ax(3)) { if (b(6)) input.zoom += ax(3) * 0.12; else input.lookY += ax(3) * 0.03; }
  return { x: lx, z: ly };
}
export const usingPad = () => pad.used;
export function pollInput() {
  const g = pollPad();
  let x = g.x + stick.x, z = g.z + stick.y;
  if (input.held('left')) x -= 1; if (input.held('right')) x += 1; if (input.held('up')) z -= 1; if (input.held('down')) z += 1;
  const l = Math.hypot(x, z); if (l > 1) { x /= l; z /= l; }
  input.move.x = x; input.move.z = z;
  input.stickFull = Math.hypot(stick.x, stick.y) > 0.95;
  // turning left swings the view left (a larger yaw); dragging or turning right does the opposite
  if (input.held('turnL')) input.look += 0.035; if (input.held('turnR')) input.look -= 0.035;
  if (input.held('lookUp')) input.lookY -= 0.025; if (input.held('lookDown')) input.lookY += 0.025;
}
export function endInput() { down.clear(); input.look = 0; input.lookY = 0; input.zoom = 0; }
