// The paper doll: what a hero wears shows on them, in the field, in battle and in the equip menu.
// Swords, staves, knives, shields and hats are borrowed from the four KayKit adventurers (each one carries a
// different set, all on the same rig); hammers, spears, bows, guns, knuckles and crowns are made here from a few
// boxes in the same chunky style. Armour tints the body, and the rarest pieces glow. Every look is worked out from
// the item's kind, id and numbers, so gear added later gets a sensible look without being listed anywhere.
import * as THREE from 'three';
import { ITEMS, HEROES } from './data.js';
import { make, sceneOf } from './models.js';
import { Q } from './quality.js';

export const EL_COL = { fire: 0xff6a30, ice: 0x8ad8ff, bolt: 0xffe040, water: 0x4aa0ff, holy: 0xfff0a0, earth: 0xd0a060, wind: 0x90f0b0, dark: 0xa060ff };
const SRC = ['kaykit/Knight', 'kaykit/Mage', 'kaykit/Barbarian', 'kaykit/Rogue_Hooded'];
// a colour hidden in a name: coral things are coral, void things are void
const WORDS = [[/prism|crystal/, 0xbff4ff], [/star/, 0xfff2c0], [/coral/, 0xffa8a8], [/pearl|shell/, 0xfff4ee], [/mythril/, 0xa0ffe0], [/void|dusk|shadow|abyss|assassin|ghost/, 0x9070d0],
  [/ember|flame|cinder|salamander|dragon/, 0xff9a70], [/sun|noon|gold/, 0xffe080], [/frost|ice|aurora|snow|rime/, 0xc8f0ff], [/gear|tick|brass/, 0xe8c070], [/storm|thunder/, 0xf0e8a0], [/bone|troll/, 0xe8dcc0],
  [/moon/, 0xd8e0ff], [/wind|sky|gull|cloud/, 0xd8fff4], [/mire|venom|spore|mycel|resin/, 0xc0e090], [/sage|dream|wisdom/, 0xe8d0ff], [/deep/, 0x80b0c0], [/wolf/, 0xb0a090], [/chef/, 0xffffff], [/wool/, 0xf0e4c8]];
const wordCol = (id) => { for (const [re, c] of WORDS) if (re.test(id)) return c; return null; };
const rareGear = (it, n) => (!it.price && n >= 28) || n >= 46;

// ---------- what a set of gear looks like ----------
const SHIELD_JOBS = new Set(['guardian', 'paladin', 'fencer', 'duskknight']);
function weaponLook(id, job, sub) {
  const it = ITEMS[id];
  if (!it || it.slot !== 'weapon') return { kind: 'fist', proc: 'bare', anim: 'punch' };
  const k = it.kind, atk = it.atk || 0, glow = it.el && EL_COL[it.el] ? EL_COL[it.el] : rareGear(it, atk) ? 0xfff0c0 : 0;
  const w = { kind: k, el: it.el || null, glow, tint: wordCol(id), scale: 1 + Math.min(0.22, atk / 280), two: false, prop: null, proc: null, off: null, anim: 'slash' };
  if (k === 'sword') { w.two = atk >= 44 || job === 'samurai' || job === 'duskknight'; w.prop = w.two ? '2H_Sword' : '1H_Sword'; w.anim = w.two ? 'slash2' : 'slash'; if (job === 'dancer') w.off = '1H_Sword_Offhand'; }
  else if (k === 'dagger') { w.prop = 'Knife'; w.anim = 'stab'; if (['rogue', 'dancer', 'bard'].includes(job) || sub === 'rogue') { w.off = 'Knife_Offhand'; w.anim = 'stab2'; } }
  else if (k === 'staff') { w.prop = /rod/.test(id) && atk < 10 ? '1H_Wand' : '2H_Staff'; w.anim = 'cast'; w.two = w.prop === '2H_Staff'; if (job === 'scholar') w.off = 'Spellbook_open'; else if (job === 'summoner' || job === 'astro') w.off = 'Spellbook'; }
  else if (k === 'hammer') { w.two = atk >= 30; w.proc = /mallet|club|troll/.test(id) ? (w.two ? 'club' : 'mallet') : 'hammer'; w.anim = w.two ? 'smash2' : 'smash'; }
  else if (k === 'spear') { w.two = true; w.proc = /trident/.test(id) ? 'trident' : 'spear'; w.anim = 'thrust'; }
  else if (k === 'bow') { w.two = true; w.proc = 'bow'; w.anim = 'shoot'; }
  else if (k === 'gun') { w.proc = /cannon|rifle/.test(id) ? 'rifle' : 'pistol'; w.two = w.proc === 'rifle'; w.anim = w.two ? 'shoot' : 'shoot1'; }
  else if (k === 'fist') { w.proc = /claw|fang/.test(id) ? 'claws' : /wrap/.test(id) ? 'wraps' : 'knuckles'; w.anim = 'punch'; }
  else w.prop = '1H_Sword';
  void sub;
  return w;
}
// armour: cloth, leather, hide, mail, plate or robe, a colour, maybe a glow, and the hat that goes with it
function armourLook(id) {
  const it = ITEMS[id];
  if (!it) return { cls: 'none', col: null, glow: 0, head: null };
  const d = it.def || 0;
  const cls = /regalia/.test(id) ? 'plate' : /robe|cloak|apron/.test(id) ? 'robe' : /plate|armou?r/.test(id) ? 'plate' : /mail|scale/.test(id) ? (d >= 24 ? 'plate' : 'mail') : /hide|coat|salamander/.test(id) ? 'hide' : /vest/.test(id) ? 'leather' : 'cloth';
  const base = { cloth: null, leather: 0xc89a6a, hide: 0xb89070, mail: 0xc8d0dc, plate: d >= 36 ? 0xe8e0c8 : 0xd8e0ec, robe: 0xd8c8f0 }[cls];
  const resEl = it.res && it.res.length === 1 ? EL_COL[it.res[0]] : null;
  const col = wordCol(id) || (resEl ? new THREE.Color(resEl).lerp(new THREE.Color(0xffffff), 0.45).getHex() : base);
  const glow = rareGear(it, d) ? (wordCol(id) || resEl || 0xfff0c0) : 0;
  const head = cls === 'plate' || (cls === 'mail' && d >= 14) ? 'Knight_Helmet' : cls === 'robe' && d >= 14 ? 'Mage_Hat' : cls === 'hide' && d >= 13 ? 'Barbarian_Hat' : null;
  return { cls, col, glow, head };
}
// a few charms show too: crowns, goggles, a ribbon, a circlet, a sash
function accLook(id) {
  if (!id || !ITEMS[id]) return null;
  if (/crown/.test(id)) return { head: 'crown', col: /spore/.test(id) ? 0xd0a0ff : /prism/.test(id) ? 0xa8f0ff : 0xffd050 };
  if (/goggle/.test(id)) return { head: 'goggles' };
  if (/ribbon/.test(id)) return { head: 'ribbon' };
  if (/plume|wing|feather/.test(id)) return { head: 'plume', col: /aurora/.test(id) ? 0xa8ffe8 : 0xf8f8ff };
  if (/star|soul|angel|heart/.test(id)) return { orb: wordCol(id) || 0xfff0c0 };
  return null;
}
export function lookOf(m, equip = m.equip) {
  const w = weaponLook(equip.weapon, m.job, m.sub), a = armourLook(equip.armor), c = accLook(equip.acc);
  const shield = !w.two && !w.off && ['sword', 'hammer'].includes(w.kind) && (SHIELD_JOBS.has(m.job) || SHIELD_JOBS.has(m.sub))
    ? (w.el === 'dark' || a.col === 0x9070d0 ? 'Spike_Shield' : a.cls === 'hide' ? 'Barbarian_Round_Shield' : a.cls === 'plate' ? 'Rectangle_Shield' : a.cls === 'mail' ? 'Badge_Shield' : 'Round_Shield') : null;
  const head = c && c.head && c.head !== 'goggles' ? c.head : a.head || (c && c.head) || null;
  const look = { w, a, c, shield, head };
  look.key = JSON.stringify([equip.weapon, equip.armor, equip.acc, m.job, m.sub]);
  return look;
}

// ---------- making the pieces ----------
const mats = new Map(), texs = new Map();
// KayKit paints everything from one sheet of colour swatches. A recoloured copy (small: the swatches are smooth
// gradients) moves every swatch toward the colour by its brightness and leaves the skin and fair hair alone, so the
// armour changes colour while faces and hands stay as they were.
function recolourTex(map, col, k) {
  const key = map.uuid + '|' + col + '|' + k;
  if (texs.has(key)) return texs.get(key);
  const N = 256, cv = document.createElement('canvas'); cv.width = cv.height = N;
  const g = cv.getContext('2d'); g.drawImage(map.image, 0, 0, N, N);
  const d = g.getImageData(0, 0, N, N), p = d.data, c = new THREE.Color(col).convertLinearToSRGB(), tr = c.r * 255, tg = c.g * 255, tb = c.b * 255;
  for (let i = 0; i < p.length; i += 4) {
    const r = p[i], gg = p[i + 1], b = p[i + 2];
    if (r > 185 && gg > 125 && b > 80 && r > gg && gg > b && r - b < 150) continue;   // skin and fair hair
    const l = (0.299 * r + 0.587 * gg + 0.114 * b) / 255, s2 = 0.3 + l * 0.95;
    p[i] = r * (1 - k) + Math.min(255, tr * s2) * k; p[i + 1] = gg * (1 - k) + Math.min(255, tg * s2) * k; p[i + 2] = b * (1 - k) + Math.min(255, tb * s2) * k;
  }
  g.putImageData(d, 0, 0);
  const t = map.clone(); t.source = new THREE.Source(cv); t.needsUpdate = true;
  texs.set(key, t); return t;
}
// a recoloured, maybe faintly glowing copy of a material, shared by everyone who wears the same thing
function tinted(mat, col, glow, k = 0.7, gk = 0.12) {
  const key = mat.uuid + '|' + col + '|' + glow + '|' + k + '|' + gk;
  if (!mats.has(key)) {
    const m = mat.clone();
    if (col !== null && col !== undefined) { if (m.map && m.map.image) m.map = recolourTex(mat.map, col, k); else m.color = new THREE.Color(0xffffff).lerp(new THREE.Color(col), k); }
    if (glow && m.emissive) { m.emissive = new THREE.Color(glow); m.emissiveIntensity = gk; }
    mats.set(key, m);
  }
  return mats.get(key);
}
const pm = new Map(), gc = new Map();
const pmat = (col, glow = 0, gk = 0.55) => { const k = col + '|' + glow + '|' + gk; if (!pm.has(k)) pm.set(k, new THREE.MeshStandardMaterial({ color: col, roughness: 0.7, metalness: 0.05, flatShading: true, emissive: glow || 0, emissiveIntensity: glow ? gk : 0 })); return pm.get(k); };
const geo = (k, f) => { if (!gc.has(k)) gc.set(k, f()); return gc.get(k); };
const bx = (w, h, d) => geo(`b${w},${h},${d}`, () => new THREE.BoxGeometry(w, h, d));
const cy = (r, h, n = 6) => geo(`c${r},${h},${n}`, () => new THREE.CylinderGeometry(r, r, h, n));
const cone = (r, h) => geo(`k${r},${h}`, () => new THREE.ConeGeometry(r, h, 4));
function part(g, gm, mt, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) { const m = new THREE.Mesh(gm, mt); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); m.castShadow = Q.shadow > 0; g.add(m); return m; }
const WOOD = 0x8a5a34, DARKWOOD = 0x5a3a22, IRON = 0xb8c0cc, BRASS = 0xd8a850, DARK = 0x3a3a48;
// built pieces sit in the same frame as KayKit's: in the hand, "up" (+y) runs along the blade; guns and bows point +z
function build(kind, w) {
  const g = new THREE.Group(), metal = pmat(w.tint || IRON, w.glow), glowM = w.glow ? pmat(w.glow, w.glow, 0.9) : metal;
  if (kind === 'mallet' || kind === 'club') {
    const L = kind === 'club' ? 1.6 : 1.1;
    part(g, cy(0.07, L), pmat(WOOD), 0, L / 2 - 0.3, 0);
    if (kind === 'club') { part(g, bx(0.42, 0.7, 0.42), pmat(w.tint || 0x9a6a40, w.glow), 0, L - 0.25, 0); for (let i = 0; i < 4; i++) part(g, cone(0.07, 0.22), pmat(0xe8dcc0), Math.cos(i * 1.57) * 0.24, L - 0.2 + (i % 2) * 0.2, Math.sin(i * 1.57) * 0.24, 0, 0, Math.PI / 2 * (i % 2 ? 1 : -1)); }
    else { part(g, bx(0.62, 0.36, 0.36), pmat(w.tint || 0xa87a4a, w.glow), 0, L - 0.32, 0); part(g, bx(0.08, 0.4, 0.4), pmat(DARKWOOD), 0.22, L - 0.32, 0); part(g, bx(0.08, 0.4, 0.4), pmat(DARKWOOD), -0.22, L - 0.32, 0); }
  } else if (kind === 'hammer') {
    const L = w.two ? 1.75 : 1.2, hw = w.two ? 0.95 : 0.66, hh = w.two ? 0.5 : 0.36;
    part(g, cy(0.065, L), pmat(DARKWOOD), 0, L / 2 - 0.3, 0); part(g, bx(0.12, 0.2, 0.12), pmat(DARK), 0, -0.3, 0);
    part(g, bx(hw, hh, hh), metal, 0, L - 0.36, 0); part(g, bx(0.1, hh + 0.06, hh + 0.06), pmat(DARK), 0, L - 0.36, 0);
    part(g, bx(0.14, hh * 0.7, hh * 0.7), glowM, hw / 2 + 0.05, L - 0.36, 0); part(g, bx(0.14, hh * 0.7, hh * 0.7), glowM, -hw / 2 - 0.05, L - 0.36, 0);
    if (w.two) part(g, cone(0.1, 0.36), metal, 0, L - 0.36 + hh / 2 + 0.17, 0);
  } else if (kind === 'spear' || kind === 'trident') {
    part(g, cy(0.05, 2.9), pmat(DARKWOOD), 0, 0.55, 0); part(g, bx(0.16, 0.14, 0.16), pmat(w.tint ? BRASS : DARK), 0, 1.98, 0);
    if (kind === 'trident') { part(g, bx(0.5, 0.08, 0.08), metal, 0, 2.08, 0); for (const x of [-0.22, 0, 0.22]) part(g, cone(0.07, x ? 0.38 : 0.5), glowM, x, x ? 2.3 : 2.36, 0); }
    else { part(g, cone(0.14, 0.55), glowM, 0, 2.32, 0); part(g, bx(0.34, 0.06, 0.06), metal, 0, 2.06, 0); }
    part(g, bx(0.06, 0.25, 0.02), pmat(w.glow || 0xd04040), 0.06, 1.85, 0);
  } else if (kind === 'bow') {
    const arc = new THREE.Group(); arc.scale.set(1, 1, 0.38); arc.position.z = -0.3; g.add(arc);
    part(arc, geo('bowarc', () => new THREE.TorusGeometry(0.82, 0.055, 4, 12, Math.PI)), pmat(w.tint || WOOD, w.glow, 0.45), 0, 0, 0, 0, -Math.PI / 2, -Math.PI / 2);
    part(g, bx(0.02, 1.64, 0.02), pmat(0xf0f0e0), 0, 0, -0.3); part(g, bx(0.1, 0.24, 0.1), pmat(DARK), 0, 0, 0.0);
    if (w.glow) { part(g, bx(0.08, 0.08, 0.08), glowM, 0, 0.82, -0.3); part(g, bx(0.08, 0.08, 0.08), glowM, 0, -0.82, -0.3); }
  } else if (kind === 'pistol' || kind === 'rifle') {
    const r = kind === 'rifle' ? (w.tint === 0xf0e8a0 ? 0.11 : 0.07) : 0.06, L = kind === 'rifle' ? 1.2 : 0.7;
    part(g, cy(r, L, 6), metal, 0, 0.14, 0.1 + L / 2, Math.PI / 2, 0, 0); part(g, bx(0.22, 0.26, 0.46), pmat(BRASS, w.glow, 0.3), 0, 0.12, 0.05);
    part(g, bx(0.13, 0.34, 0.16), pmat(DARKWOOD), 0, -0.1, -0.06, 0.25, 0, 0);
    if (kind === 'rifle') part(g, bx(0.16, 0.22, 0.55), pmat(WOOD), 0, 0.06, -0.42);
    part(g, bx(0.06, 0.06, 0.06), glowM, 0, 0.14 + r + 0.03, 0.1 + L);
  } else if (kind === 'knuckles' || kind === 'claws' || kind === 'wraps') {
    const col = kind === 'wraps' ? 0xe8dcc0 : w.tint || (kind === 'claws' ? 0xc8a070 : IRON);
    part(g, bx(0.36, 0.32, 0.38), pmat(col, w.glow, 0.35), 0, 0.04, 0);
    if (kind !== 'wraps') part(g, bx(0.4, 0.12, 0.42), pmat(DARK), 0, -0.14, 0);
    if (kind === 'claws') for (const x of [-0.12, 0, 0.12]) part(g, cone(0.045, 0.42), glowM, x, 0.38, 0.12, 0.35, 0, 0);
    else if (kind === 'knuckles') for (const x of [-0.12, 0, 0.12]) part(g, bx(0.08, 0.08, 0.08), glowM, x, 0.22, 0.14);
  } else if (kind === 'crown') {
    const gold = pmat(w.col || 0xffd050, w.col || 0xffd050, 0.35);
    part(g, geo('crownband', () => new THREE.CylinderGeometry(0.46, 0.5, 0.14, 8, 1, true)), gold, 0, 0, 0);
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; part(g, cone(0.07, 0.2), gold, Math.cos(a) * 0.47, 0.16, Math.sin(a) * 0.47); }
    part(g, bx(0.12, 0.12, 0.06), pmat(0xff5070, 0xff3050, 0.6), 0, 0.02, 0.5);
  } else if (kind === 'goggles') {
    part(g, geo('gband', () => new THREE.TorusGeometry(0.52, 0.045, 4, 14)), pmat(0x4a3a2a), 0, 0, 0, Math.PI / 2, 0, 0);
    for (const x of [-0.18, 0.18]) { part(g, cy(0.13, 0.12, 8), pmat(BRASS), x, 0, 0.5, Math.PI / 2, 0, 0); part(g, cy(0.1, 0.13, 8), pmat(0x80e0ff, 0x60c0ff, 0.5), x, 0, 0.51, Math.PI / 2, 0, 0); }
  } else if (kind === 'ribbon') {
    const red = pmat(0xff4a7a, 0x802040, 0.2);
    part(g, bx(0.32, 0.2, 0.08), red, 0.2, 0, 0, 0, 0, 0.5); part(g, bx(0.32, 0.2, 0.08), red, -0.2, 0, 0, 0, 0, -0.5); part(g, bx(0.12, 0.12, 0.1), red, 0, 0, 0);
  } else if (kind === 'plume') {
    const f = pmat(w.col || 0xf8f8ff, w.col === 0xa8ffe8 ? 0x60c0a0 : 0, 0.4);
    for (let i = 0; i < 3; i++) part(g, bx(0.08, 0.6 - i * 0.12, 0.18), f, 0, 0.26 - i * 0.04, -0.12 * i, -0.5 - i * 0.25, 0, 0);
  }
  return g;
}

// ---------- putting it on ----------
const lib = new Map();
// the original of a borrowed piece: the first adventurer who carries one by that name
function original(name) {
  if (lib.has(name)) return lib.get(name);
  let found = null;
  for (const p of SRC) { const s = sceneOf(p); if (!s) continue; s.traverse((o) => { if (!found && o.name === name && o.isMesh) found = o; }); if (found) break; }
  lib.set(name, found); return found;
}
function borrow(name, col, glow, scale = 1) {
  const src = original(name);
  if (!src) return null;
  const o = src.clone(); o.visible = true;
  if (col || glow) o.material = tinted(src.material, col, glow, 0.7, 0.18);
  o.castShadow = Q.shadow > 0;
  if (scale !== 1) o.scale.multiplyScalar(scale);
  return o;
}
const AIM = new THREE.Quaternion(0, Math.SQRT1_2, 0, Math.SQRT1_2);   // how KayKit's crossbows sit in the hand
function holdBuilt(kind, w, aim) {
  const g = build(kind, w), wrap = new THREE.Group(); wrap.add(g);
  if (aim) { wrap.quaternion.copy(AIM); wrap.position.set(-0.1, -0.01, 0); } else { wrap.rotation.y = Math.PI; wrap.position.y = 0.033; }
  if (w.scale && w.scale !== 1) g.scale.multiplyScalar(w.scale);
  return wrap;
}
// find the hands, head and chest of a hero, and what they carry to begin with
function rig(inst) {
  if (inst.doll) return inst.doll;
  const d = { bones: {}, own: [], skins: [], added: [], key: '' };
  inst.obj.traverse((n) => {
    const nm = n.name;
    if (nm === 'handslotr' || nm === 'handslot.r') d.bones.r = n; else if (nm === 'handslotl' || nm === 'handslot.l') d.bones.l = n; else if (nm === 'head') d.bones.head = n; else if (nm === 'chest') d.bones.chest = n;
  });
  inst.obj.traverse((n) => { if (n.isSkinnedMesh) d.skins.push({ mesh: n, mat: n.material, k: /Body/.test(n.name) ? 1 : /Leg/.test(n.name) ? 0.7 : /Arm/.test(n.name) ? 0.45 : 0 }); else if (n.isMesh && n.parent && [d.bones.r, d.bones.l, d.bones.head, d.bones.chest].includes(n.parent)) d.own.push(n); });
  inst.doll = d; return d;
}
export function dress(inst, look) {
  const d = rig(inst);
  if (!d.bones.r || d.key === look.key) return inst;
  d.key = look.key;
  for (const a of d.added) a.parent && a.parent.remove(a);
  d.added = [];
  for (const n of d.own) n.visible = /Cape/.test(n.name);
  const put = (bone, o) => { if (bone && o) { bone.add(o); d.added.push(o); } };
  const { w, a, c } = look;
  // the weapon in the right hand (and a second one, a book or knuckles in the left)
  if (w.prop) put(d.bones.r, borrow(w.prop, w.tint, w.glow, w.scale));
  if (w.off) put(d.bones.l, borrow(w.off, w.tint, w.glow, w.scale));
  if (w.proc && w.proc !== 'bare') {
    const aim = w.proc === 'bow' || w.proc === 'pistol' || w.proc === 'rifle';
    put(d.bones.r, holdBuilt(w.proc, w, aim));
    if (['knuckles', 'claws', 'wraps'].includes(w.proc)) put(d.bones.l, holdBuilt(w.proc, w, false));
  }
  if (look.shield) put(d.bones.l, borrow(look.shield, a.cls === 'plate' || a.cls === 'mail' ? a.col : null, a.glow));
  // the head: a helmet, hat or crown
  if (look.head) {
    if (/_/.test(look.head)) put(d.bones.head, borrow(look.head, a.col && a.head === look.head ? a.col : null, a.head === look.head ? a.glow : 0));
    else { const g = build(look.head, c || {}); g.position.y = { crown: 1.02, ribbon: 1.0, plume: 1.0 }[look.head] || 0.6; if (look.head === 'ribbon') { g.position.x = 0.32; g.position.z = -0.1; } if (look.head === 'plume') g.position.x = 0.36; put(d.bones.head, g); }
  }
  if (c && c.head === 'goggles' && look.head !== 'goggles' && !/Helmet/.test(look.head || '')) { const g = build('goggles', {}); g.position.y = 0.62; put(d.bones.head, g); }
  if (c && c.orb) { const g = new THREE.Group(); part(g, geo('orb', () => new THREE.OctahedronGeometry(0.12, 0)), pmat(c.orb, c.orb, 1)); g.position.set(0.55, 0.45, -0.2); g.userData.orb = true; put(d.bones.chest, g); }
  // the body takes the armour's colour; legs a little less, arms (with their hands) less again
  for (const s of d.skins) s.mesh.material = a.col !== null && s.k ? tinted(s.mat, a.col, a.glow, 0.82, 0.1) : s.mat;
  return inst;
}
// a hero's model, dressed in what they wear (or what they would wear, for the equip preview)
export function heroInst(m, equip) { return dress(make(HEROES[m.id].model), lookOf(m, equip || m.equip)); }
// keep a model dressed as its hero changes gear
export function redress(inst, m) { const l = lookOf(m); if (!inst.doll || inst.doll.key !== l.key) dress(inst, l); }

// ---------- how a hero attacks with what they hold ----------
const CLIPS = {
  slash: ['1H_Melee_Attack_Slice_Diagonal', '1H_Melee_Attack_Slice_Horizontal'], slash2: ['2H_Melee_Attack_Slice', '2H_Melee_Attack_Spin'],
  stab: ['1H_Melee_Attack_Stab'], stab2: ['Dualwield_Melee_Attack_Stab', 'Dualwield_Melee_Attack_Slice'], smash: ['1H_Melee_Attack_Chop'], smash2: ['2H_Melee_Attack_Chop'],
  thrust: ['2H_Melee_Attack_Stab'], cast: ['Spellcast_Shoot'], shoot: ['2H_Ranged_Shoot'], shoot1: ['1H_Ranged_Shoot'], punch: ['Unarmed_Melee_Attack_Punch_A', 'Unarmed_Melee_Attack_Punch_B'], kick: ['Unarmed_Melee_Attack_Kick'],
};
export function attackOf(m) {
  const w = weaponLook(m.equip.weapon, m.job, m.sub), list = CLIPS[w.anim] || CLIPS.slash;
  const shot = w.kind === 'bow' ? 'arrow' : w.kind === 'gun' ? 'bullet' : w.kind === 'staff' ? 'orb' : null;
  return { anim: w.anim, clips: list, shot, lunge: !shot, el: w.el, glow: w.glow, kind: w.kind };
}
let swing = 0;
// play the swing that fits the weapon; returns how long to wait before the blow lands (ms)
export function playAttack(inst, m, opts = {}) {
  const at = attackOf(m), clip = opts.kick ? CLIPS.kick[0] : at.clips[(swing++) % at.clips.length];
  if (inst.has && inst.has(clip)) inst.play(clip, { once: true, fade: 0.08 }); else inst.play('attack-melee-right', { once: true });
  return { slash: 260, slash2: 380, stab: 220, stab2: 260, smash: 360, smash2: 460, thrust: 300, cast: 320, shoot: 380, shoot1: 260, punch: 200 }[at.anim] || 260;
}
// where the weapon hand is now, in the world
const tmp = new THREE.Vector3();
export function handPos(inst, out = new THREE.Vector3()) { const d = inst.doll; if (d && d.bones.r) { d.bones.r.getWorldPosition(out); return out; } inst.obj.getWorldPosition(out); out.y += 1.2; return out; }
// an arrow, a bullet or a ball of light flying from the hand to the target; resolves when it arrives
export function shoot(scene, kind, from, to, col = 0xffffff, ms = 260) {
  return new Promise((res) => {
    const g = new THREE.Group();
    if (kind === 'arrow') { part(g, bx(0.04, 0.04, 0.9), pmat(0xc8a070)); part(g, cone(0.07, 0.18), pmat(col === 0xffffff ? IRON : col, col === 0xffffff ? 0 : col, 0.8), 0, 0, 0.52, Math.PI / 2, 0, 0); part(g, bx(0.16, 0.02, 0.16), pmat(0xf0f0f0), 0, 0, -0.4); }
    else if (kind === 'bullet') { part(g, bx(0.12, 0.12, 0.5), pmat(col === 0xffffff ? 0xffe080 : col, col === 0xffffff ? 0xffc040 : col, 1.2)); }
    else { part(g, geo('orbS', () => new THREE.IcosahedronGeometry(0.22, 0)), pmat(col === 0xffffff ? 0xd8c8ff : col, col === 0xffffff ? 0xa080ff : col, 1.4)); }
    g.position.copy(from); g.lookAt(to); scene.add(g);
    let flash = null;
    if (kind === 'bullet') { flash = new THREE.Mesh(geo('flash', () => new THREE.OctahedronGeometry(0.3, 0)), pmat(0xfff0a0, 0xffd060, 2)); flash.position.copy(from); scene.add(flash); }
    const t0 = performance.now(), a = from.clone(), b = to.clone();
    const step = () => {
      const k = Math.min(1, (performance.now() - t0) / ms);
      g.position.lerpVectors(a, b, k); if (kind === 'arrow') g.position.y += Math.sin(k * Math.PI) * 0.6; if (kind === 'orb') g.rotation.z += 0.3;
      if (flash) { flash.scale.setScalar(Math.max(0.01, 1 - k * 3)); }
      if (k < 1) requestAnimationFrame(step); else { scene.remove(g); if (flash) scene.remove(flash); res(); }
    };
    requestAnimationFrame(step);
  });
}
void tmp;

// ---------- the turning portrait in the equip menu ----------
// drawn by the main renderer into a small target and copied onto a canvas in the menu, so no second WebGL context
const PV = { want: null, scene: null, cam: null, inst: null, key: '', rt: null, buf: null, img: null, t: 0, who: '' };
export function setPreview(m, equip) { PV.want = m ? { m, equip: { ...(equip || m.equip) } } : null; }
export function previewTick(renderer, dt) {
  if (!PV.want) return;
  const cv = document.querySelector('canvas.dollpv');
  if (!cv) return;
  const W2 = cv.width, H2 = cv.height;
  if (!PV.scene) {
    PV.scene = new THREE.Scene();
    PV.scene.add(new THREE.HemisphereLight(0xeef6ff, 0x504060, 1.6));
    const sun = new THREE.DirectionalLight(0xfff0d8, 2.2); sun.position.set(2, 4, 5); PV.scene.add(sun);
    PV.cam = new THREE.PerspectiveCamera(30, W2 / H2, 0.1, 50); PV.cam.position.set(0, 1.25, 5.6); PV.cam.lookAt(0, 0.95, 0);
  }
  if (!PV.rt || PV.rt.width !== W2 || PV.rt.height !== H2) {
    if (PV.rt) PV.rt.dispose();
    PV.rt = new THREE.WebGLRenderTarget(W2, H2); PV.rt.texture.colorSpace = THREE.SRGBColorSpace; PV.buf = new Uint8Array(W2 * H2 * 4); PV.img = new ImageData(W2, H2);
  }
  const { m, equip } = PV.want;
  if (PV.who !== m.id) { if (PV.inst) PV.scene.remove(PV.inst.obj); PV.inst = make(HEROES[m.id].model).fit(1.9); PV.scene.add(PV.inst.obj); PV.who = m.id; PV.key = ''; }
  const look = lookOf(m, equip);
  if (look.key !== PV.key) { dress(PV.inst, look); PV.key = look.key; }
  PV.t += dt; PV.inst.obj.rotation.y = Math.sin(PV.t * 0.7) * 0.9; PV.inst.update(dt);
  const old = renderer.getRenderTarget(), oldTone = renderer.toneMapping;
  renderer.setRenderTarget(PV.rt); renderer.setClearColor(0x000000, 0); renderer.clear(); renderer.render(PV.scene, PV.cam);
  renderer.readRenderTargetPixels(PV.rt, 0, 0, W2, H2, PV.buf);
  renderer.setRenderTarget(old); renderer.toneMapping = oldTone; renderer.setClearColor(0x000000, 1);
  // the target's rows come bottom first
  const row = W2 * 4, d = PV.img.data;
  for (let y = 0; y < H2; y++) d.set(PV.buf.subarray((H2 - 1 - y) * row, (H2 - y) * row), y * row);
  cv.getContext('2d').putImageData(PV.img, 0, 0);
}
