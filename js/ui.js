// On-screen windows drawn as HTML over the 3D view: the dialogue box with typewriter text, choices,
// lists for menus and shops, a toast, the area name, and the prompt above the action button.
import { input } from './input.js';
import { sfx } from './audio.js';
import { L } from './i18n.js';

// short coloured status tags so the panels show who is poisoned, asleep, buffed... at a glance
const STTAG = {
  poison: ['毒', 'PSN', '#c890ff'], sleep: ['眠', 'SLP', '#a0c0ff'], stun: ['暈', 'STN', '#ffe070'], slow: ['緩', 'SLW', '#f8b060'],
  blind: ['盲', 'BLD', '#b8b8c8'], regen: ['再生', 'RGN', '#80f8a0'], silence: ['默', 'MUT', '#f8a0d0'], burn: ['灼', 'BRN', '#ff8050'],
  freeze: ['凍', 'FRZ', '#a0e8ff'], doom: ['死', 'DOOM', '#ff5a5a'], dusk: ['暮', 'DUSK', '#c8a0ff'],
};
const BUFN = { str: ['攻', 'ATK'], def: ['防', 'DEF'], agi: ['速', 'SPD'], mag: ['魔', 'MAG'] };
// status: { poison: turns }, buffs: { str: { k, t } }, extra: [[text, colour]]
export function statusTags(status, buffs, extra = []) {
  const out = Object.keys(status || {}).filter((k) => status[k] && STTAG[k]).map((k) => ({ s: L(STTAG[k][0], STTAG[k][1]) + (k === 'doom' ? status[k] : ''), col: STTAG[k][2] }));
  for (const [k, b] of Object.entries(buffs || {})) if (BUFN[k] && b && b.k !== 1) out.push({ s: L(BUFN[k][0], BUFN[k][1]) + (b.k > 1 ? '↑' : '↓'), col: b.k > 1 ? '#ffd070' : '#90a0e8' });
  for (const [s, col] of extra) out.push({ s, col });
  return out;
}
export function statusHTML(status, buffs, extra) {
  const t = statusTags(status, buffs, extra);
  return t.length ? `<span class="sts">${t.map((x) => `<b style="color:${x.col}">${x.s}</b>`).join('')}</span>` : '';
}

const $ = (id) => document.getElementById(id);
const stack = [];
export const UI = { get active() { return stack.length > 0; }, clear() { while (stack.length) stack.pop().close(); } };
export function uiUpdate() { const w = stack[stack.length - 1]; if (w) w.update(); }
function push(w) { stack.push(w); return w; }
function pop(w) { const i = stack.indexOf(w); if (i >= 0) stack.splice(i, 1); }
const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

// a line of dialogue; resolves when the player presses A
export function say(who, text, { options = null, cancel = false } = {}) {
  return new Promise((res) => {
    const box = $('dialog');
    let shown = 0, sel = 0, t = 0;
    const full = String(text);
    const draw = () => {
      const done = shown >= full.length;
      box.innerHTML = (who ? `<div class="who">${esc(who)}</div>` : '') + `<div>${esc(full.slice(0, shown)).replace(/\n/g, '<br>')}</div>` +
        (done && options ? `<div class="opts">${options.map((o, i) => `<div class="opt${i === sel ? ' sel' : ''}" data-i="${i}">${esc(o)}</div>`).join('')}</div>` : '') +
        (done && !options ? '<div class="more">▼</div>' : '');
      box.classList.add('on');
    };
    box.onclick = (e) => { const o = e.target.closest('.opt'); if (o && shown >= full.length) { sel = +o.dataset.i; finish(sel); } else if (!options) tap = true; };
    let tap = false;
    const finish = (v) => { box.classList.remove('on'); box.onclick = null; pop(w); res(v); };
    const w = {
      update() {
        t++;
        if (shown < full.length) { shown = Math.min(full.length, shown + 2); if (t % 3 === 0) sfx('cursor'); draw(); if (input.pressed('a') || tap) { shown = full.length; tap = false; draw(); } return; }
        if (options) {
          if (input.pressed('down')) { sel = (sel + 1) % options.length; sfx('cursor'); draw(); }
          if (input.pressed('up')) { sel = (sel + options.length - 1) % options.length; sfx('cursor'); draw(); }
          if (input.pressed('a')) { sfx('ok'); finish(sel); }
          if (cancel && input.pressed('b')) { sfx('cancel'); finish(-1); }
        } else if (input.pressed('a') || input.pressed('b') || tap) { tap = false; finish(0); }
      },
      close() { box.classList.remove('on'); },
    };
    push(w); draw();
  });
}
export const ask = (who, text, options, cancel = true) => say(who, text, { options, cancel });
export async function talk(who, ...lines) { for (const l of lines) await say(who, l); }

// a list window; items are { label, right, disabled, desc, html }; resolves to the index or -1
// detail: (index) => HTML for a panel beside the list (below it on a phone) that follows the cursor
export function list(title, items, { cancel = true, start = 0, footer = '', width = 340, onMove = null, side = '', detail = null, dwidth = 400 } = {}) {
  return new Promise((res) => {
    const root = $('menu');
    let sel = Math.min(start, items.length - 1);
    const draw = () => {
      const it = items[sel];
      // a long list keeps its description at the top, where scrolling cannot hide it
      const long = items.length > 12 && (!!footer || items.some((o) => o.desc)), text = esc((it && it.desc) || footer || '');
      const descTop = long ? `<div class="small" style="margin-bottom:8px;min-height:36px;position:sticky;top:-14px;background:#16203a;padding:4px 0;z-index:1">${text}</div>` : '';
      const rows = items.map((o, i) => `<div class="opt${i === sel ? ' sel' : ''}${o.disabled ? ' off' : ''}" data-i="${i}"><div class="row"><span>${o.html || esc(o.label)}</span><span>${o.right !== undefined ? esc(o.right) : ''}</span></div></div>`).join('');
      const listPanel = `<div class="panel win list" style="width:min(${width}px,calc(100vw - 30px))">${title ? `<h2>${esc(title)}</h2>` : ''}${descTop}${rows}${long ? '' : `<div class="small" style="margin-top:8px;min-height:18px">${text}</div>`}</div>`;
      const det = detail ? `<div class="panel win det" style="width:min(${dwidth}px,calc(100vw - 30px))">${detail(sel) || ''}</div>` : '';
      const keep = root.querySelector('.det'), top = keep ? keep.scrollTop : 0, same = keep && keep.dataset.sel === String(sel);
      root.innerHTML = `<div class="mwrap${detail ? ' hasdet' : ''}" style="display:flex;gap:12px;align-items:flex-start;max-width:calc(100% - 20px)">${side ? `<div class="panel win">${side}</div>` : ''}${listPanel}${det}</div>`;
      root.classList.add('on');
      const d = root.querySelector('.det'); if (d) { d.dataset.sel = sel; if (same) d.scrollTop = top; }
      const s = root.querySelector('.opt.sel'); if (s) s.scrollIntoView({ block: 'nearest' });
    };
    root.onclick = (e) => { const o = e.target.closest('.opt'); if (!o) return; const i = +o.dataset.i; if (i === sel) choose(); else { sel = i; sfx('cursor'); if (onMove) onMove(sel); draw(); } };
    const choose = () => { if (!items[sel] || items[sel].disabled) { sfx('buzz'); return; } sfx('ok'); finish(sel); };
    // Page Up / Page Down scroll the detail panel
    const onKey = (e) => { if (!detail || (e.key !== 'PageDown' && e.key !== 'PageUp')) return; const d = root.querySelector('.det'); if (d) { d.scrollTop += e.key === 'PageDown' ? 160 : -160; e.preventDefault(); } };
    window.addEventListener('keydown', onKey);
    const finish = (v) => { window.removeEventListener('keydown', onKey); root.classList.remove('on'); root.onclick = null; pop(w); res(v); };
    const w = {
      update() {
        if (!items.length) { if (input.pressed('b') || input.pressed('a')) finish(-1); return; }
        if (input.pressed('down')) { sel = (sel + 1) % items.length; sfx('cursor'); if (onMove) onMove(sel); draw(); }
        if (input.pressed('up')) { sel = (sel + items.length - 1) % items.length; sfx('cursor'); if (onMove) onMove(sel); draw(); }
        if (input.pressed('a')) choose();
        if (cancel && (input.pressed('b') || input.pressed('menu'))) { sfx('cancel'); finish(-1); }
      },
      close() { window.removeEventListener('keydown', onKey); root.classList.remove('on'); },
    };
    push(w); draw();
  });
}
let toastT = null;
export function toast(s, ms = 2200) { const t = $('toast'); t.textContent = s; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), ms); }
let areaT = null;
export function areaName(s) { const a = $('area'); a.textContent = s; a.classList.add('on'); clearTimeout(areaT); areaT = setTimeout(() => a.classList.remove('on'), 3200); }
// the prompt is touched only when it changes, so the page does not lay itself out again every frame
let promptNow = null;
export function prompt(s) { if (s === promptNow) return; promptNow = s; const p = $('prompt'); if (s) { p.textContent = s; p.classList.add('on', 'panel'); } else p.classList.remove('on'); }
export function fade(on) { $('fade').classList.toggle('on', on); return new Promise((r) => setTimeout(r, 420)); }
export const wait = (ms) => new Promise((r) => setTimeout(r, ms));
void L;

// fishing: wait for the bite, pull when the "!" shows, then stop the needle on the bright mark
// mining uses the same bar, starting straight away and with its own words
export function fishGame(width = 0.2, label = null, quick = false) {
  return new Promise((res) => {
    const el = document.createElement('div'); el.id = 'fishui'; el.className = 'panel'; document.body.appendChild(el);
    const t0 = performance.now(), bite = 1200 + Math.random() * 2200, zone = 0.15 + Math.random() * (0.7 - width);
    let phase = quick ? 'bar' : 'wait', tBite = 0, tBar = quick ? performance.now() : 0, needle = 0;
    const draw = (msg) => {
      el.innerHTML = `<div class="ft">${msg}</div>` + (phase === 'bar' ? `<div class="fbar"><i style="left:${zone * 100}%;width:${width * 100}%"></i><b style="left:${needle * 100}%"></b></div>` : '');
    };
    const finish = (ok) => { pop(w); el.remove(); res(ok); };
    const w = {
      update() {
        const now = performance.now();
        if (phase === 'wait') {
          draw('……');
          if (input.pressed('a')) { sfx('cancel'); finish(false); return; }
          if (now - t0 > bite) { phase = 'bite'; tBite = now; sfx('encounter'); }
        } else if (phase === 'bite') {
          draw('<span class="bang">！</span>');
          if (input.pressed('a')) { phase = 'bar'; tBar = now; sfx('ok'); }
          else if (now - tBite > 900) { finish(false); }
        } else {
          needle = 0.5 - Math.cos((now - tBar) / 700 * Math.PI) * 0.5;
          draw(label || L('按 E 拉起！', 'Press E to reel in!'));
          if (input.pressed('a')) finish(needle >= zone && needle <= zone + width);
          else if (now - tBar > 6000) finish(false);
        }
        if (input.pressed('b')) finish(false);
      },
      close() { el.remove(); },
    };
    push(w); draw('……');
  });
}
