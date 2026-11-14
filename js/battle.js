// Turn-based battles on a small stage of their own: the party on the right, the monsters on the left, all
// as 3D models, with the windows as HTML on top. Everyone picks a command, then the round plays out by speed.
// Guardians of the east have tricks of their own (see MECH), a guest may fight beside the party, and two friends
// with the right jobs can act together (link arts).
import * as THREE from 'three';
import { make, measureHeight } from './models.js';
import { MONSTERS, TECHS, ABILITIES, ITEMS, HEROES, JOBS, monsterStats, affinity, EL_NAME } from './data.js';
import { LINKS, LORE_MP } from './data2.js';
import { DROPS } from './data3.js';
import { abilityLine, techLine, itemLine } from './help.js';
import { S, stats, abilitiesOf, hasPassive, heroName, gain, addItem, count, gearHas, immuneTo, resists, hasJob, cmdAbilities, milestones } from './party.js';
import { input } from './input.js';
import { sfx, playMusic, jingle } from './audio.js';
import { L } from './i18n.js';
import { UI, list, statusHTML } from './ui.js';
import { Q } from './quality.js';

const $ = (id) => document.getElementById(id);
let B = null, tex = null;
const ticks = new Set();
export function battleTick() { for (const f of [...ticks]) f(); }
const onTick = (f) => { ticks.add(f); return () => ticks.delete(f); };
export const inBattle = () => !!B;
// for automated checks: end the fight as a win
export function debugWin() { if (B) for (const f of B.foes) f.hp = 0; }
export const debugState = () => B && { round: B.round, foes: B.foes.map((f) => [f.id, f.hp, f.maxhp, f.air || false, f.ward || '']), party: S.members.map((m) => m.hp), tide: B.tide, noon: !!B.noon };
const rnd = (a, b) => a + Math.random() * (b - a);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// the stage: a floor of the ground you were standing on, a sky colour, two lights
const SKY = { grass: 0x8cc8f0, forest: 0x305a3a, sand: 0x9ad0f0, redsand: 0xe8a070, stone: 0x8890a8, snow: 0xc8d8f0, crystal: 0x40306a, marsh: 0x5a6e62, spore: 0x5a3e7a, ember: 0x6a2a1a,
  sea: 0x5aa8e0, sky: 0xb8e0ff, vael: 0x1f5a6a, clock: 0x4a3c30, deep: 0x1c3424, abyss: 0x160c24, noon: 0xe0c070, arena: 0x8cc8f0 };
const FLOOR = { grass: 'grass_top', forest: 'grass_top', sand: 'sand', redsand: 'redsand', stone: 'greystone', snow: 'snow', crystal: 'stone_diamond', marsh: 'mossstone', spore: 'grass_top', ember: 'redstone',
  sea: 'sand', sky: 'cotton_blue', vael: 'cotton_tan', clock: 'brass', deep: 'mossstone', abyss: 'greystone_ruby', noon: 'stone_gold', arena: 'sand' };
// the ground decides a geomancer's element
const TERRAIN_EL = { grass: 'wind', forest: 'earth', marsh: 'water', spore: 'earth', sand: 'water', redsand: 'earth', stone: 'earth', snow: 'ice', crystal: 'holy', ember: 'fire', sea: 'water', sky: 'wind', vael: 'water', clock: 'bolt', deep: 'earth', abyss: 'dark', noon: 'holy', arena: 'earth' };
export function setBattleAtlas(t, info) { tex = { t, info }; }
const TREES = ['hex/tree_single_A.gltf', 'hex/trees_A_small.gltf', 'hex/tree_single_B.gltf', 'hex/trees_B_medium.gltf'];
const ROCKS = ['hex/rock_single_A.gltf', 'hex/rock_single_C.gltf', 'hex/rock_single_E.gltf'];
function floorMaterial(kind) {
  const { t, info } = tex, fi = info.faces[FLOOR[kind] || 'grass_top'], cols = info.cols;
  const c = document.createElement('canvas'); c.width = c.height = info.size;
  c.getContext('2d').drawImage(t.image, (fi % cols) * info.size, Math.floor(fi / cols) * info.size, info.size, info.size, 0, 0, info.size, info.size);
  const ct = new THREE.CanvasTexture(c); ct.magFilter = THREE.NearestFilter; ct.wrapS = ct.wrapT = THREE.RepeatWrapping; ct.repeat.set(24, 24); ct.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshLambertMaterial({ map: ct });
}
function buildStage(kind) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(SKY[kind] || SKY.grass);
  scene.fog = new THREE.Fog(scene.background, 16, 34);
  const dark = ['deep', 'abyss', 'vael', 'clock'].includes(kind);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x445566, dark ? 1.25 : 1.6));
  const sun = new THREE.DirectionalLight(kind === 'noon' ? 0xfff0b0 : 0xfff0d8, 2.2); sun.position.set(-4, 10, 6); sun.castShadow = Q.shadow > 0; sun.shadow.mapSize.set(1024, 1024); Object.assign(sun.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10 }); scene.add(sun);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(70, 70), floorMaterial(kind)); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; floor.userData.own = true; scene.add(floor);
  // the land you were standing on, behind the fight
  const PALMS = ['pirate/palm-straight', 'pirate/palm-bend', 'pirate/rocks-sand-a'];
  const back = { grass: TREES, forest: TREES, marsh: TREES, spore: ['grave/pumpkin'], snow: ['grave/pine', 'grave/pine-crooked'], stone: ROCKS, crystal: ROCKS, sand: PALMS, redsand: ROCKS, ember: ROCKS,
    sea: PALMS, sky: ['hex/cloud_small.gltf', 'hex/cloud_big.gltf'], vael: ['grave/pillar-obelisk', 'pirate/rocks-sand-b'], clock: ['dungeon/column', 'pirate/barrel'], deep: ['hex/trees_A_medium.gltf', 'survival/tree-tall', 'hex/rock_single_C.gltf'],
    abyss: ['grave/rocks-tall', 'grave/pillar-obelisk'], noon: ['dungeon/column', 'grave/pillar-obelisk'], arena: ['pirate/flag-high', 'pirate/barrel', 'pirate/crate'] }[kind] || TREES;
  const tall = (p) => back === TREES || p.includes('pine') || p.includes('palm') || p.includes('tree') || p.includes('column') || p.includes('obelisk') || p.includes('flag');
  for (let k = 0; k < (Q.shadow ? 14 : 9); k++) {
    const path = back[k % back.length], inst = make(path);
    inst.fit(tall(path) ? 3 + (k * 7 % 5) * 0.5 : path.includes('cloud') ? 1.6 : path.includes('pumpkin') ? 0.9 : 0.8 + (k % 3) * 0.4);
    inst.obj.position.set(-13 + k * 2 + Math.sin(k * 3.1) * 0.8, path.includes('cloud') ? -0.6 : 0, -5.5 - (k % 3) * 2.2); inst.obj.rotation.y = k * 1.7; scene.add(inst.obj);
  }
  const ring = Q.shadow ? 22 : 12;
  for (let k = 0; k < ring; k++) {
    const a = k / ring * Math.PI * 2 + 0.3, r = 19 + (k * 5 % 3) * 1.6, path = back[(k + 2) % back.length], inst = make(path);
    if (Math.cos(a) * r + 1.1 < -4 && Math.abs(Math.sin(a) * r) < 14) continue;
    inst.fit(tall(path) ? 3.2 + (k * 7 % 5) * 0.5 : path.includes('cloud') ? 2 : path.includes('pumpkin') ? 1.1 : 1.0 + (k % 3) * 0.5);
    inst.obj.position.set(1 + Math.sin(a) * r, path.includes('cloud') ? -0.8 : 0, 1.1 + Math.cos(a) * r); inst.obj.rotation.y = k * 2.3; scene.add(inst.obj);
  }
  const cam = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 0.1, 80);
  return { scene, cam };
}
// the battle camera circles the middle of the field: drag to swing it round and tilt it, the wheel to come closer, C to set it back
const VIEW0 = { yaw: 0, pitch: 0.85, dist: 16.2 };
const view = { ...VIEW0 };
function placeCamera(cam) {
  view.yaw += input.look; view.pitch = Math.max(0.12, Math.min(1.45, view.pitch + input.lookY)); view.dist = Math.max(6, Math.min(17, view.dist + input.zoom * 0.9));
  if (input.pressed('view')) Object.assign(view, VIEW0);
  const cp = Math.cos(view.pitch), tx = 1.0, ty = 0.4, tz = 1.1;
  cam.position.set(tx + Math.sin(view.yaw) * cp * view.dist, ty + Math.sin(view.pitch) * view.dist, tz + Math.cos(view.yaw) * cp * view.dist);
  cam.lookAt(tx, ty + 0.4, tz);
}

// ---------- start ----------
const lineZ = (i, n) => 0.9 + (i - (n - 1) / 2) * 1.7;
const heroSpot = (i, m) => [2.7 + i * 0.35 + (m.row === 'back' ? 0.9 : 0), lineZ(i, S.members.length)];
const ELC = { fire: '#ff9050', ice: '#a0e8ff', bolt: '#fff080', water: '#70b0ff', holy: '#fff8d0', earth: '#d0a060', wind: '#a8ffc8', dark: '#c090ff' };
const EL_COL = { fire: 0xff7030, ice: 0x90e0ff, bolt: 0xfff070, holy: 0xfff8d0, water: 0x60a0ff, earth: 0xc09050, wind: 0xa0ffc0, dark: 0x8050c0, none: 0xd0a0ff };
const elName = (el) => (EL_NAME[el] ? L(EL_NAME[el][0], EL_NAME[el][1]) : '');
// what each status is called, short and long
const statusWord = (s) => ({ poison: L('中毒', 'POISON'), sleep: L('睡著', 'SLEEP'), stun: L('暈眩', 'STUN'), slow: L('減速', 'SLOW'), blind: L('失明', 'BLIND'), regen: L('再生', 'REGEN'), silence: L('沉默', 'SILENCE'), burn: L('灼傷', 'BURN'), freeze: L('凍結', 'FROZEN'), doom: L('死亡宣告', 'DOOM'), dusk: L('暮光', 'DUSK'), mark: L('標記', 'MARKED'), reraise: L('守護天使', 'ANGEL'), thorns: L('荊棘', 'THORNS') }[s]);
// how long each ailment lasts when it lands
const ST_TURNS = { poison: 9, sleep: 2, stun: 1, slow: 4, blind: 4, silence: 3, burn: 3, freeze: 1, doom: 4 };
// abilities a silenced hero cannot use
const SPELL = new Set(['magic', 'heal', 'summon', 'status', 'cure', 'revive', 'regen', 'scan', 'timewarp', 'echo']);
// which ailments a monster shrugs off
function foeImmune(f, st) {
  const m = MONSTERS[f.id];
  if (m.immune && m.immune.includes(st)) return true;
  if (m.machine && ['poison', 'sleep', 'doom', 'blind'].includes(st)) return true;
  if (m.mech === 'umbra') return true;
  if (m.boss) return st === 'doom' || st === 'freeze';
  return false;
}
// how hard an element lands on a monster, and a word to show when it matters; below zero heals it
function elemMult(f, el) {
  if (!el || el === 'none' || f.kind !== 'foe') return 1;
  if (f.id === 'morwen' && B.tide === 'high' && el === 'water') { popupLater(f, L('吸收', 'ABSORB'), '#70e0ff'); return -0.5; }
  if (f.id === 'morwen' && B.tide === 'low' && el === 'bolt') { popupLater(f, L('大弱點！', 'CRUSHING!'), '#ffe27a'); return 2.2; }
  const a = affinity(f.id);
  if (a.weak.includes(el)) { popupLater(f, L('弱點！', 'WEAK!'), '#ffe27a'); return 1.6; }
  if (a.res.includes(el)) { popupLater(f, L('抵抗', 'RESIST'), '#a0b0c8'); return 0.4; }
  return 1;
}
const popupLater = (who, s, col) => setTimeout(() => B && popup(who, s, col), 260);
function foeInfo(f) {
  const debuffs = Object.entries(f.buffs).map(([k, b]) => (b.k < 1 ? '↓' : '↑') + ({ str: L('攻', 'Atk'), def: L('防', 'Def'), agi: L('速', 'Spd'), mag: L('魔', 'Mag') }[k] || '')).join('');
  const st = Object.keys(f.status).map(statusWord).filter(Boolean).join(' ');
  if (!S.scanned[f.id]) return `${f.name}　HP ???　${debuffs} ${st}`;
  const a = affinity(f.id);
  const d = DROPS[f.id];
  return `${f.name}　HP ${f.hp}/${f.maxhp}　${a.weak.length ? L('弱：', 'Weak: ') + a.weak.map(elName).join(L('、', ', ')) : ''}${a.res.length ? L('　抗：', '  Resist: ') + a.res.map(elName).join(L('、', ', ')) : ''}${d && !f.stolen ? L('　可偷：', '  Steal: ') + ITEMS[d.steal].name : ''}　${debuffs} ${st}`;
}
const mpCost = (m, a) => (a.lore ? (hasPassive(m, 'mimicmaster') ? Math.ceil(a.mp / 2) : a.mp) : hasPassive(m, 'mpthrift') || gearHas(m, 'mpcut') ? Math.ceil(a.mp * 0.75) : a.mp);
const hpCost = (m, a) => (a.hpcost ? Math.ceil(stats(m).maxhp * a.hpcost) : 0);
// the one-line text under a battle list (the cost is already on the right)
const describe = (a) => abilityLine(a, false);
// a lore technique as an ability a mimic can use
function loreAbility(id) { const t = TECHS[id]; return { name: t.name, mp: LORE_MP[id] !== undefined ? LORE_MP[id] : 10, type: 'lore', tech: id, lore: true, target: ['magic', 'status', 'drain', 'curse', 'smash', 'steal', 'break'].includes(t.kind) ? (t.target === 'all' ? 'enemies' : 'enemy') : 'self' }; }
const MECH_ADD = { arms: 'krakenarm', gears: 'cogling', umbra: 'voidspecter' };
export const mechAdds = (ids) => ids.map((id) => MECH_ADD[MONSTERS[id].mech]).filter(Boolean);
function makeFoe(id, x, z, label = '') {
  const m = MONSTERS[id], s = monsterStats(id), inst = make(m.model, { color: m.color, tint: m.tint });
  inst.obj.position.set(x, 0, z);
  if (m.model.startsWith('vox:')) inst.obj.scale.setScalar(m.boss ? 1.6 : m.add ? 1.1 : 1.2); else inst.fit(m.boss ? 3.6 : m.model.startsWith('pets/') ? 1.4 : m.sz ? Math.max(1.3, Math.min(2.6, m.sz * 1.3)) : 2.0);
  if (m.fly) inst.obj.position.y = 0.5;
  B.scene.add(inst.obj); inst.play('idle');
  const f = { id, kind: 'foe', name: m.name + label, ...s, maxhp: s.hp, inst, home: [x, z], status: {}, buffs: {}, h: m.boss ? 3.6 : 1.8, face: Math.PI / 2 };
  inst.obj.rotation.y = f.face;
  f.h = Math.max(0.6, measureHeight(inst.obj));
  S.seen[id] = (S.seen[id] || 0) + 1;
  return f;
}
// a monster joins the fight in the middle of it
function addFoe(id) {
  const n = B.foes.length, f = makeFoe(id, -2.4 - (n % 3) * 0.6, lineZ(n % 4, 4) + (n > 3 ? 0.5 : 0));
  f.add = true; B.foes.push(f); sparkle(f, 0xffd070); return f;
}
export function startBattle(ids, { boss = false, bg = 'grass', canFlee = true, guest = null, arena = false } = {}) {
  return new Promise((resolve) => {
    const st = buildStage(bg);
    B = { ...st, foes: [], party: [], boss, bg, canFlee: canFlee && !boss, resolve, round: 0, pops: [], over: false, t: 0, drops: [], turrets: [], arena, lastTech: null, tide: 'high', songs: [], traps: [], delays: [], bastion: 0 };
    ids.forEach((id, i) => {
      const n = ids.length, x = boss && i === 0 ? -3.4 : -2.7 - i * 0.35, z = boss && i === 0 ? 0.9 : lineZ(i, n);
      B.foes.push(makeFoe(id, x, z, ids.filter((t) => t === id).length > 1 ? 'ABCD'[ids.slice(0, i).filter((t) => t === id).length] : ''));
    });
    // the kraken comes with its arms
    if (MONSTERS[ids[0]].mech === 'arms') for (const dz of [-2.6, 2.6]) { const f = makeFoe('krakenarm', -1.7, 0.9 + dz); f.add = true; B.foes.push(f); }
    B.party = S.members.map((m, i) => {
      const inst = make(HEROES[m.id].model).fit(1.9); const [x, z] = heroSpot(i, m);
      inst.obj.position.set(x, 0, z);
      st.scene.add(inst.obj); inst.play(m.hp > 0 ? 'idle' : 'die', { once: m.hp <= 0 });
      m.buffs = {}; m.defending = false; delete m.status.sleep; delete m.status.stun; delete m.status.freeze; m.taunt = 0; m.charge = false; m.jumping = null; m.reraised = false; m.endured = false; m.stance = null;
      return { m, inst, home: [x, z], h: 1.9, face: -Math.PI / 2 };
    });
    // a meal eaten before the fight keeps working, and some gear starts you off quick
    const meal = S.meal && ITEMS[S.meal.id] && ITEMS[S.meal.id].meal;
    for (const p of B.party) {
      const m = p.m;
      if (meal) { for (const k of ['str', 'mag', 'def', 'agi']) if (meal[k]) m.buffs[k] = { k: meal[k] * (hasPassive(m, 'gourmet') ? 1.05 : 1), t: 99 }; if (meal.regen && m.hp > 0) m.status.regen = 99; }
      if (gearHas(m, 'hasteStart')) m.buffs.agi = { k: Math.max(1.3, (m.buffs.agi || { k: 1 }).k), t: 4 };
    }
    // a guest who fights beside the party
    if (guest) { const inst = make(guest.model).fit(1.9); inst.obj.position.set(4.4, 0, lineZ(S.members.length, S.members.length + 1) + 0.6); st.scene.add(inst.obj); B.guest = { ...guest, inst, home: [4.4, inst.obj.position.z], h: 1.9, face: -Math.PI / 2, n: 0 }; }
    for (const p of B.party) p.inst.obj.rotation.y = p.face;
    if (B.guest) B.guest.inst.obj.rotation.y = B.guest.face;
    for (const o of B.party) o.h = Math.max(0.6, measureHeight(o.inst.obj));
    $('battleui').innerHTML = '<div id="bmsg" class="panel"></div><div id="bparty" class="panel"></div><div id="bcmd" class="panel"></div><div id="bfx"></div>'
      + `<div id="bview"><span>${L('拖曳轉動視角・滾輪拉近拉遠', 'Drag to turn the view · wheel to zoom')}</span><button id="bviewReset">${L('視角回正 (C)', 'Reset view (C)')}</button></div>`;
    $('bviewReset').addEventListener('click', (e) => { e.stopPropagation(); Object.assign(view, VIEW0); sfx('cursor'); });
    $('battleui').classList.add('on');
    playMusic(boss ? (['varek', 'aurel', 'umbra', 'morwen', 'champion'].includes(ids[0]) ? 'boss2' : 'boss') : 'battle');
    drawParty();
    run();
  });
}
export function battleRender(renderer, dt) {
  if (!B) return;
  B.t += dt;
  for (const f of B.foes) { f.inst.update(dt); if (MONSTERS[f.id].fly && f.hp > 0) f.inst.obj.position.y = (f.air ? 3.2 : 0.5) + Math.sin(B.t * 2 + f.home[1]) * 0.15; }
  for (const p of B.party) p.inst.update(dt);
  if (B.guest) B.guest.inst.update(dt);
  if (B.spirit) B.spirit.inst.update(dt);
  B.cam.aspect = innerWidth / innerHeight; B.cam.updateProjectionMatrix(); placeCamera(B.cam);
  renderer.render(B.scene, B.cam);
  for (const el of document.querySelectorAll('#bfx [data-x]')) { const p = screenOf(+el.dataset.x, +el.dataset.y, +el.dataset.z); el.style.left = p[0] + 'px'; el.style.top = p[1] + 'px'; }
}
function screenOf(x, y, z) { const v = new THREE.Vector3(x, y, z).project(B.cam); return [(v.x + 1) / 2 * innerWidth, (1 - v.y) / 2 * innerHeight]; }
function popup(who, s, col = '#ffffff') {
  const o = who.inst.obj.position, el = document.createElement('div');
  el.className = 'pop'; el.textContent = s; el.style.color = col; el.dataset.x = o.x; el.dataset.y = (who.h || 1.8) + 0.3 + o.y; el.dataset.z = o.z;
  const p = screenOf(o.x, (who.h || 1.8) + 0.3 + o.y, o.z); el.style.left = p[0] + 'px'; el.style.top = p[1] + 'px';
  $('bfx').appendChild(el); setTimeout(() => el.remove(), 950);
}
function msg(s) { const m = $('bmsg'); if (!m) return; m.textContent = s || ''; m.classList.toggle('on', !!s); }
function drawParty() {
  const el = $('bparty'); if (!el) return;
  el.innerHTML = S.members.map((m) => {
    const s = stats(m), act = B.active === m, dead = m.hp <= 0;
    // every ailment and buff as a coloured tag
    const st = dead ? '' : statusHTML(m.status, m.buffs, [...(m.charge ? [[L('蓄', 'CHG'), '#ffe27a']] : []), ...(m.jumping ? [[L('跳', 'JMP'), '#9fe0ff']] : []), ...(m.stance ? [[{ riposte: L('迎', 'RIP'), evade: L('流', 'EVA'), beast: L('獸', 'BST') }[m.stance.id] || '', '#ffb070']] : []), ...(B.bastion > 0 && m === S.members.find((x) => x.stance && x.stance.id === 'bastion') ? [[L('城', 'BAS'), '#ffb070']] : [])].filter((x) => x[0]));
    return `<div class="hb${act ? ' act' : ''}${dead ? ' dead' : ''}"><div class="row"><span>${heroName(m)} <span class="small">${m.row === 'back' ? L('後', 'B') : L('前', 'F')}</span></span>${st}</div>` +
      `<div class="row small"><span>HP ${m.hp}/${s.maxhp}</span><span>MP ${m.mp}</span></div><div class="bar"><i style="width:${Math.max(0, m.hp / s.maxhp * 100)}%;background:${m.hp < s.maxhp / 4 ? '#ff7a8a' : '#7cf29a'}"></i></div></div>`;
  }).join('') + (B.guest ? `<div class="hb"><div class="row"><span>${B.guest.name}</span><span class="small">${L('同行', 'Guest')}</span></div></div>` : '');
}

// ---------- the round ----------
const alive = () => B.foes.filter((f) => f.hp > 0);
const heroesUp = () => B.party.filter((p) => p.m.hp > 0);
// who a monster can reach: not those in the middle of a jump
const targetable = () => heroesUp().filter((p) => !p.m.jumping);
async function run() {
  await wait(300);
  const names = [...new Set(B.foes.filter((f) => !f.add).map((f) => MONSTERS[f.id].name))];
  msg(B.boss ? L(`${names[0]}擋在面前！`, `${names[0]} stands in your way!`) : L(`${names.join('、')}出現了！`, `${names.join(', ')} appeared!`));
  await wait(1100); msg('');
  for (;;) {
    B.round++;
    await roundStart();
    if (await checkEnd()) return;
    const cmds = await choose();
    if (cmds === 'flee') {
      const ok = Math.random() < 0.6;
      if (ok) { sfx('cancel'); msg(L('成功逃走了！', 'Got away!')); await wait(700); return end('flee'); }
      msg(L('逃不掉！', "Can't escape!")); await wait(700);
    }
    const order = [];
    if (cmds !== 'flee') for (const c of cmds) if (c) order.push({ hero: c.p, c, spd: speed(c.p.m) * rnd(0.85, 1.15) + (c.type === 'guard' ? 999 : 0) + (gearHas(c.p.m, 'first') || hasPassive(c.p.m, 'firststrike') ? 500 : 0) });
    for (const f of alive()) { order.push({ foe: f, spd: f.agi * buff(f, 'agi') * (f.status.slow ? 0.5 : 1) * rnd(0.85, 1.15) }); if (f.enraged) order.push({ foe: f, spd: f.agi * 0.6 * rnd(0.85, 1.15) }); }
    if (B.guest) order.push({ guest: true, spd: -1 });
    order.sort((a, b) => b.spd - a.spd);
    for (const p of B.party) p.m.defending = false;
    for (const o of order) if (o.hero && o.c.type === 'guard') o.hero.m.defending = true;
    for (const o of order) {
      if (o.hero) { if (o.hero.m.hp > 0) await heroAct(o.hero, o.c); }
      else if (o.guest) await guestAct();
      else if (o.foe.hp > 0) await foeAct(o.foe);
      if (!B || B.ended) return;
      drawParty();
      if (await checkEnd()) return;
    }
    if (!B || B.ended) return;
    await roundEnd();
    drawParty();
    if (await checkEnd()) return;
  }
}
// what happens as a round begins: the guardians' tricks show themselves
async function roundStart() {
  for (const f of alive()) {
    const mech = MONSTERS[f.id].mech;
    if (mech === 'tide') { B.tide = B.round % 2 ? 'high' : 'low'; msg(B.tide === 'high' ? L('潮水漲起來了！茉雯吸收水的力量。', 'The tide rises! Morwen drinks in the water.') : L('潮水退去了！茉雯露出了破綻，怕雷。', 'The tide falls! Morwen is exposed, and fears lightning.')); f.buffs.def = B.tide === 'low' ? { k: 0.7, t: 1 } : { k: 1.2, t: 1 }; await wait(1100); }
    if (mech === 'umbra') {
      const ph = Math.floor((B.round - 1) / 3) % 2;
      if ((B.round - 1) % 3 === 0) { msg(ph === 0 ? L('稜影張開了鏡之幕：魔法會被反彈！', 'Umbra raises a mirror veil: magic will be thrown back!') : L('稜影纏上了影之甲：物理攻擊幾乎無效！', 'Umbra wraps itself in shadow armour: weapons barely bite!')); await wait(1300); }
      f.ward = ph === 0 ? 'reflect' : 'armor';
      if (!f.split && f.hp < f.maxhp * 0.5) { f.split = true; msg(L('稜影分裂出了虛空幽影！', 'Umbra splits off void specters!')); for (let k = 0; k < 2; k++) addFoe('voidspecter'); await wait(1100); }
    }
    if (mech === 'stance' && B.round % 3 === 0) { f.stance = true; popup(f, L('架式', 'STANCE'), '#ffe27a'); msg(L('假面劍豪擺出了架式……現在攻擊會被反擊！', 'The Masked Blade takes a stance... strike now and it will strike back!')); await wait(1100); }
    if (mech === 'arms' && B.round % 4 === 0 && B.foes.filter((x) => x.id === 'krakenarm' && x.hp > 0).length < 2) { msg(L('巨妖又長出了一條觸手！', 'The kraken grows another arm!')); addFoe('krakenarm'); await wait(900); }
    if (mech === 'noon' && !B.noon && f.hp < f.maxhp * 0.5) { B.noon = true; msg(L('「讓太陽永遠停在頭頂！」——永晝降臨了。', '"Let the sun stand still forever!" - the Endless Noon falls.')); sfx('magic'); await wait(1500); }
    if (mech === 'enrage' && !f.enraged && f.hp < f.maxhp * 0.4) { f.enraged = true; f.buffs.str = { k: 1.3, t: 99 }; msg(L('深淵暴龍狂暴了！牠的動作變快了！', 'The Tyrant flies into a rage! It moves twice as often!')); await wait(1200); }
  }
}
// what happens as a round ends: jumpers land, turrets fire, poison and the rest
async function roundEnd() {
  for (const p of heroesUp()) if (p.m.jumping) await land(p);
  // things set earlier go off: delayed blasts, then the songs
  for (const d of B.delays) {
    if (--d.t > 0 || !alive().length) continue;
    const ts = d.all ? alive() : [d.target && d.target.hp > 0 ? d.target : alive()[0]].filter(Boolean);
    msg(L(`${d.a.name}發動了！`, `${d.a.name} goes off!`)); sfx(d.a.el === 'fire' ? 'fire' : d.a.el === 'bolt' ? 'bolt' : 'magic');
    for (const t of ts) spellHit(d.by, t, d.a.power, d.a.el, d.me);
    await wait(600);
  }
  B.delays = B.delays.filter((d) => d.t > 0);
  for (const sg of B.songs) {
    if (sg.by.m.hp <= 0) { sg.t = 0; continue; }
    if (sg.song === 'heal') for (const q of heroesUp()) healHero(q, Math.round(sg.power + sg.mag * 0.3));
    if (sg.song === 'mp') for (const q of heroesUp()) { const s2 = stats(q.m), g = Math.min(s2.maxmp - q.m.mp, sg.power); if (g > 0) { q.m.mp += g; popup(q, g, '#7cc4ff'); } }
    if (sg.song === 'dirge') for (const f of alive()) hurt(f, Math.max(1, Math.round(magical(sg.power, { mag: sg.mag }, foeFighter(f)) * 0.6 * dmgTaken(f, 'magic'))), '#c0a0ff');
    sg.t--;
  }
  if (B.songs.some((x) => x.t <= 0)) B.songs = B.songs.filter((x) => x.t > 0);
  if (B.songs.length) await wait(400);
  if (B.bastion > 0) B.bastion--;
  for (const t of B.turrets) if (t.rounds-- > 0 && alive().length && t.p.m.hp > 0) { const f = alive()[Math.floor(Math.random() * alive().length)]; sfx('bolt'); const r = physical(heroFighter(t.p.m), foeFighter(f), t.power, { sure: true }); hurt(f, Math.max(1, Math.round(r.dmg * dmgTaken(f, 'phys'))), '#fff080'); await wait(300); }
  B.turrets = B.turrets.filter((t) => t.rounds > 0);
  // the endless noon burns everyone not under Ein's veil of dusk
  if (B.noon && alive().some((f) => f.id === 'aurel')) {
    msg(L('永晝的光灼燒著大家……', 'The endless noon burns...'));
    for (const p of heroesUp()) { if (p.m.status.dusk) { popup(p, L('暮光', 'DUSK'), '#c0a0ff'); continue; } const s = stats(p.m), d = Math.round(s.maxhp * (resists(p.m, 'holy') ? 0.06 : 0.12)); hurt(p, d, '#fff0a0'); }
    const a = B.foes.find((f) => f.id === 'aurel'); if (a && a.hp > 0) { const h = Math.round(a.maxhp * 0.02); a.hp = Math.min(a.maxhp, a.hp + h); popup(a, h, '#7cf29a'); }
    await wait(700); msg('');
  }
  for (const p of heroesUp()) {
    const m = p.m, s = stats(m);
    if (m.status.poison) { const d = Math.max(1, Math.floor(s.maxhp / 12)); m.hp = Math.max(1, m.hp - d); popup(p, d, '#c080ff'); }
    if (m.status.burn) { const d = Math.max(1, Math.floor(s.maxhp / 14)); m.hp = Math.max(1, m.hp - d); popup(p, d, '#ff9050'); }
    if (hasPassive(m, 'innerpeace') || hasPassive(m, 'autoregen')) { const h = Math.round(s.maxhp * 0.05); m.hp = Math.min(s.maxhp, m.hp + h); }
    if (hasPassive(m, 'mpregen') || gearHas(m, 'mpregen')) m.mp = Math.min(s.maxmp, m.mp + Math.max(1, Math.round(s.maxmp * 0.04)));
    if (m.stance && --m.stance.t <= 0) m.stance = null;
    if (m.status.regen || gearHas(m, 'regen')) { const h = Math.round(s.maxhp * (m.status.regen ? 0.09 : 0.05)); if (m.hp < s.maxhp) { m.hp = Math.min(s.maxhp, m.hp + h); popup(p, h, '#7cf29a'); } }
    if (m.status.doom && --m.status.doom <= 0) { delete m.status.doom; popup(p, L('死亡宣告', 'DOOM'), '#c090ff'); hurt(p, m.hp, '#c090ff'); continue; }
    for (const k of ['sleep', 'stun', 'blind', 'regen', 'silence', 'burn', 'freeze', 'dusk', 'reraise', 'thorns']) if (m.status[k] && --m.status[k] <= 0) delete m.status[k];
    for (const k of Object.keys(m.buffs)) if (--m.buffs[k].t <= 0) delete m.buffs[k];
    if (m.taunt) m.taunt--;
  }
  for (const f of alive()) {
    if (f.status.poison) hurt(f, Math.max(1, Math.floor(f.maxhp / 14)), '#c080ff');
    if (f.status.burn && f.hp > 0) hurt(f, Math.max(1, Math.floor(f.maxhp / 16)), '#ff9050');
    if (f.status.doom && f.hp > 0 && --f.status.doom <= 0) { delete f.status.doom; popup(f, L('死亡宣告', 'DOOM'), '#c090ff'); hurt(f, f.hp, '#c090ff'); continue; }
    for (const k of ['sleep', 'stun', 'slow', 'blind', 'silence', 'burn', 'freeze', 'mark']) if (f.status[k] && --f.status[k] <= 0) delete f.status[k];
    for (const k of Object.keys(f.buffs)) if (--f.buffs[k].t <= 0) delete f.buffs[k];
  }
}
const buff = (o, k) => (o.buffs && o.buffs[k] ? o.buffs[k].k : 1);
function speed(m) { return stats(m).agi * buff(m, 'agi') * (m.status.slow ? 0.5 : 1); }
async function checkEnd() {
  if (!B || B.ended) return true;
  if (!alive().length) { await victory(); return true; }
  if (!heroesUp().length) { msg(L('全員倒下了……', 'Everyone has fallen...')); await wait(1600); end('lose'); return true; }
  return false;
}
async function victory() {
  await wait(400);
  jingle('victory');
  const meal = S.meal && ITEMS[S.meal.id] && ITEMS[S.meal.id].meal, anyGear = (k) => S.members.some((m) => m.hp > 0 && gearHas(m, k));
  const foes = B.foes.filter((f) => !f.fled), anyPassive = (k) => S.members.some((m) => m.hp > 0 && hasPassive(m, k));
  let exp = foes.reduce((a, f) => a + f.exp, 0), jp = foes.reduce((a, f) => a + f.jp, 0), gold = foes.reduce((a, f) => a + f.gold, 0);
  if (anyGear('expUp')) exp = Math.round(exp * 1.3); if (anyGear('goldUp')) gold = Math.round(gold * 1.5); if (anyPassive('goldfind')) gold = Math.round(gold * 1.4);
  if (meal && meal.exp) exp = Math.round(exp * meal.exp); if (meal && meal.jp) jp = Math.round(jp * meal.jp); if (meal && meal.gold) gold = Math.round(gold * meal.gold);
  if (B.arena) { exp = Math.round(exp * 0.5); gold = Math.round(gold * 0.5); }
  for (const p of heroesUp()) p.inst.play('emote-yes', { once: true });
  S.gold += gold;
  // what the monsters dropped, and what the bestiary learns
  const luck = (anyPassive('treasure') ? 1.5 : 1) * (anyGear('luck') ? 1.3 : 1) * (meal && meal.luck ? meal.luck : 1);
  for (const f of foes) {
    S.defeated[f.id] = (S.defeated[f.id] || 0) + 1;
    const d = DROPS[f.id] || (MONSTERS[f.id].drop && { c: MONSTERS[f.id].drop, r: null });
    if (!d) continue;
    if (Math.random() < d.c[1] * luck) { B.drops.push(d.c[0]); addItem(d.c[0]); }
    if (d.r && Math.random() < d.r[1] * luck) { B.drops.push(d.r[0]); addItem(d.r[0]); B.rare = (B.rare || []).concat(d.r[0]); }
  }
  for (const p of heroesUp()) S.jobWins[p.m.job] = (S.jobWins[p.m.job] || 0) + 1;
  if (S.meal && --S.meal.n <= 0) { B.mealDone = ITEMS[S.meal.id].name; S.meal = null; }
  const lines = [L(`勝利！獲得 ${exp} 經驗值、${jp} JP、${gold} 金幣。`, `Victory! ${exp} EXP, ${jp} JP and ${gold} gold.`)];
  if (!foes.length) lines[0] = L('魔物逃走了……', 'The monsters got away...');
  for (const d of B.drops) lines.push((B.rare || []).includes(d) ? L(`★ 稀有掉落：${ITEMS[d].name}！`, `★ Rare drop: ${ITEMS[d].name}!`) : L(`得到了${ITEMS[d].name}！`, `Got ${ITEMS[d].name}!`));
  for (const l of gain(exp, jp)) lines.push(l.t);
  for (const l of milestones()) lines.push(l.t);
  if (B.mealDone) lines.push(L(`${B.mealDone}的效果消失了。`, `The ${B.mealDone} has worn off.`));
  for (const l of lines) { msg(l); drawParty(); await waitKey(); }
  end('win');
}
function waitKey() { return new Promise((r) => { const t0 = performance.now(); const off = onTick(() => { if ((performance.now() - t0 > 250 && (input.pressed('a') || input.pressed('b'))) || performance.now() - t0 > 2600) { off(); r(); } }); }); }
function disposeStage(scene) {
  scene.traverse((o) => {
    if (o.isLight && o.shadow && o.shadow.map) o.shadow.map.dispose();
    if (o.isMesh && o.userData.own) { o.geometry.dispose(); if (o.material.map) o.material.map.dispose(); o.material.dispose(); }
  });
}
function end(result) {
  if (!B || B.ended) return;
  B.ended = true;
  for (const m of S.members) { m.buffs = {}; m.defending = false; m.taunt = 0; m.charge = false; m.jumping = null; m.stance = null; for (const k of ['sleep', 'stun', 'slow', 'blind', 'regen', 'silence', 'burn', 'freeze', 'doom', 'dusk', 'reraise', 'thorns']) delete m.status[k]; }
  $('battleui').classList.remove('on'); $('battleui').innerHTML = '';
  disposeStage(B.scene);
  const r = B.resolve; B = null; r(result);
}

// ---------- choosing ----------
async function choose() {
  const cmds = [], skip = new Set();
  for (let i = 0; i < B.party.length; i++) {
    const p = B.party[i], m = p.m;
    if (m.hp <= 0 || m.status.sleep || m.status.stun || m.status.freeze || m.jumping || skip.has(i)) { cmds[i] = null; continue; }
    B.active = m; drawParty();
    const c = await commandFor(p, i > 0);
    if (c === 'back') { let j = i - 1; while (j >= 0 && !cmds[j]) j--; skip.clear(); i = Math.max(-1, j - 1); continue; }
    if (c.type === 'flee') { B.active = null; drawParty(); return 'flee'; }
    cmds[i] = { ...c, p };
    // a link art takes the partner's turn too
    if (c.partner) { const j = B.party.indexOf(c.partner); if (j < i) cmds[j] = null; else skip.add(j); }
  }
  B.active = null; drawParty();
  return cmds;
}
function cmdMenu(items, { cancel = true } = {}) {
  return new Promise((res) => {
    const el = $('bcmd'); let sel = 0;
    const draw = () => { el.innerHTML = items.map((o, i) => `<div class="opt${i === sel ? ' sel' : ''}${o.disabled ? ' off' : ''}" data-i="${i}"><div class="row"><span>${o.label}</span><span class="small">${o.right !== undefined ? o.right : ''}</span></div></div>`).join('') + (items.some((o) => o.desc) ? `<div class="small bdesc">${(items[sel] && items[sel].desc) || ''}</div>` : ''); el.classList.add('on'); const s = el.querySelector('.sel'); if (s) s.scrollIntoView({ block: 'nearest' }); };
    el.onclick = (e) => { const o = e.target.closest('.opt'); if (!o) return; sel = +o.dataset.i; pick(); };
    const pick = () => { if (items[sel].disabled) { sfx('buzz'); return; } sfx('ok'); done(sel); };
    const done = (v) => { el.classList.remove('on'); el.onclick = null; off(); res(v); };
    const off = onTick(() => {
      if (input.pressed('down')) { sel = (sel + 1) % items.length; sfx('cursor'); draw(); }
      if (input.pressed('up')) { sel = (sel + items.length - 1) % items.length; sfx('cursor'); draw(); }
      if (input.pressed('a')) { pick(); return; }
      if (cancel && input.pressed('b')) { sfx('cancel'); done(-1); }
    });
    draw();
  });
}
// link arts this hero could start now, and with whom
function linksFor(p) {
  const out = [];
  for (const [id, a] of Object.entries(LINKS)) for (const [mine, theirs] of [[a.jobs[0], a.jobs[1]], [a.jobs[1], a.jobs[0]]]) {
    if (!hasJob(p.m, mine)) continue;
    const partner = B.party.find((q) => q !== p && q.m.hp > 0 && !q.m.status.sleep && !q.m.status.stun && !q.m.status.freeze && !q.m.jumping && hasJob(q.m, theirs));
    if (partner && !out.some((o) => o.id === id)) out.push({ id, a, partner });
  }
  return out;
}
const usable = (m, a) => mpCost(m, a) <= m.mp && hpCost(m, a) < m.hp && !(m.status.silence && SPELL.has(a.type)) && !(a.type === 'coin' && S.gold < 1);
async function commandFor(p, canBack) {
  const m = p.m;
  for (;;) {
    if (!alive().length) return { type: 'guard' };
    const abil = abilitiesOf(m).filter((a) => !ABILITIES[a].passive);
    const wep = ITEMS[m.equip.weapon], wel = wep && wep.el, links = linksFor(p), lore = hasJob(m, 'mimic') ? S.lore.filter((t) => TECHS[t]) : [];
    const opts = [
      { id: 'attack', label: L('攻擊', 'Attack'), right: wel ? elName(wel) : '', desc: (wel ? elName(wel) + L('屬性・', ' element · ') : '') + (m.row === 'back' && !(wep && (wep.kind === 'bow' || wep.kind === 'gun')) ? L('後排：近戰傷害降低', 'back row: melee does less') : L('普通攻擊', 'a plain attack')) },
      { id: 'abil', label: L('技能', 'Abilities'), disabled: !abil.length, desc: m.status.silence ? L('沉默中：不能使用法術類技能', 'Silenced: no spells') : L('職業技能', 'job abilities') },
    ];
    const extra = cmdAbilities(m);
    if (extra.length) opts.push({ id: 'cmdjob', label: JOBS[m.cmd].name, right: '★', desc: L('精通職業的技能（額外指令）', 'actions of a mastered job (extra command)') });
    if (links.length) opts.push({ id: 'link', label: L('連攜', 'Link'), desc: L('和夥伴一起出招（夥伴這回合不能行動）', 'act together with a friend (they give up their turn)') });
    if (lore.length) opts.push({ id: 'lore', label: L('擬態', 'Lore'), disabled: !!m.status.silence, desc: L('使用學會的魔物招式', 'use monster techniques you have learned') });
    opts.push({ id: 'item', label: L('道具', 'Items'), disabled: !Object.keys(S.inv).some((k) => ITEMS[k].use && ITEMS[k].use !== 'tent'), desc: L('使用道具', 'use an item') },
      { id: 'guard', label: L('防禦', 'Guard'), desc: L('這回合受到的傷害減半，最先行動', 'halve damage this round, act first') },
      { id: 'row', label: m.row === 'back' ? L('換到前排', 'To front row') : L('換到後排', 'To back row'), desc: L('後排受到的物理傷害少四成，但近戰傷害也降低（弓、槍不受影響）。不消耗回合', 'Back row takes 40% less physical damage but deals less in melee (bows and guns are unaffected). Costs no turn') },
      { id: 'flee', label: L('逃跑', 'Run'), disabled: !B.canFlee });
    const r = await cmdMenu(opts, { cancel: canBack });
    if (r < 0) return 'back';
    const id = opts[r].id;
    if (id === 'attack') { const t = await target('enemy', m); if (t) return { type: 'attack', target: t }; }
    if (id === 'cmdjob') {
      const k = await cmdMenu(extra.map((a) => { const A = ABILITIES[a]; return { label: A.name, right: A.hpcost ? `HP${hpCost(m, A)}` : mpCost(m, A), disabled: !usable(m, A), desc: describe(A) }; }));
      if (k < 0) continue;
      const a = extra[k], t = await target(ABILITIES[a].target, m);
      if (t !== null) return { type: 'ability', id: a, target: t };
    }
    if (id === 'abil') {
      const k = await cmdMenu(abil.map((a) => { const A = ABILITIES[a]; return { label: A.name, right: A.hpcost ? `HP${hpCost(m, A)}` : mpCost(m, A), disabled: !usable(m, A), desc: describe(A) }; }));
      if (k < 0) continue;
      const a = abil[k], t = await target(ABILITIES[a].target, m);
      if (t !== null) return { type: 'ability', id: a, target: t };
    }
    if (id === 'link') {
      const k = await cmdMenu(links.map((o) => ({ label: o.a.name, right: mpCost(m, o.a), disabled: !usable(m, o.a), desc: describe(o.a) + L(`　夥伴：${heroName(o.partner.m)}`, `  with ${heroName(o.partner.m)}`) })));
      if (k < 0) continue;
      const o = links[k], t = await target(o.a.target, m);
      if (t !== null) return { type: 'link', id: o.id, target: t, partner: o.partner };
    }
    if (id === 'lore') {
      const k = await cmdMenu(lore.map((tid) => { const A = loreAbility(tid); return { label: A.name, right: mpCost(m, A), disabled: !usable(m, A), desc: techLine(tid, mpCost(m, A)) }; }));
      if (k < 0) continue;
      const A = loreAbility(lore[k]), t = await target(A.target, m);
      if (t !== null) return { type: 'lore', id: lore[k], target: t };
    }
    if (id === 'item') {
      const items = Object.keys(S.inv).filter((k) => ITEMS[k].use && ITEMS[k].use !== 'tent');
      const k = await cmdMenu(items.map((iid) => ({ label: ITEMS[iid].name, right: S.inv[iid], desc: itemLine(iid) })));
      if (k < 0) continue;
      const iid = items[k], t = await target(ITEMS[iid].target, m);
      if (t !== null) return { type: 'item', id: iid, target: t };
    }
    if (id === 'guard') return { type: 'guard' };
    if (id === 'row') { m.row = m.row === 'back' ? 'front' : 'back'; sfx('ok'); const i = B.party.indexOf(p); p.home = heroSpot(i, m); slide(p); drawParty(); continue; }
    if (id === 'flee') return { type: 'flee' };
  }
}
function target(kind, m) {
  if (kind === 'enemies') return Promise.resolve('allFoes');
  if (kind === 'allies') return Promise.resolve('allHeroes');
  if (kind === 'self') return Promise.resolve(B.party.find((p) => p.m === m));
  if (kind === 'none') return Promise.resolve('none');
  const pool = kind === 'enemy' ? alive() : B.party.filter((p) => (kind === 'dead' ? p.m.hp <= 0 : p.m.hp > 0));
  if (!pool.length) { sfx('buzz'); return Promise.resolve(null); }
  return new Promise((res) => {
    let i = 0;
    const arrow = document.createElement('div'); arrow.className = 'tgt'; arrow.textContent = '▼'; $('bfx').appendChild(arrow);
    const place = () => { const o = pool[i].inst.obj.position; arrow.dataset.x = o.x; arrow.dataset.y = (pool[i].h || 1.9) + 0.5 + o.y; arrow.dataset.z = o.z; msg(pool[i].kind === 'foe' ? foeInfo(pool[i]) : heroName(pool[i].m)); };
    const off = onTick(() => {
      if (input.pressed('right') || input.pressed('down')) { i = (i + 1) % pool.length; sfx('cursor'); place(); }
      if (input.pressed('left') || input.pressed('up')) { i = (i + pool.length - 1) % pool.length; sfx('cursor'); place(); }
      if (input.pressed('a')) { sfx('ok'); off(); arrow.remove(); msg(''); res(pool[i]); return; }
      if (input.pressed('b')) { sfx('cancel'); off(); arrow.remove(); msg(''); res(null); }
    });
    place();
  });
}

// ---------- doing ----------
const heroFighter = (m) => { const s = stats(m), last = hasPassive(m, 'laststand') && m.hp < s.maxhp * 0.25 ? 1.5 : 1, beast = m.stance && m.stance.id === 'beast'; return { atk: s.atk * buff(m, 'str') * (m.status.burn ? 0.8 : 1) * last * (beast ? 1.6 : 1), dfn: s.dfn * buff(m, 'def') * (beast ? 0.8 : 1), mag: s.mag * buff(m, 'mag'), spr: s.spr * buff(m, 'spr'), agi: s.agi * buff(m, 'agi') }; };
const foeFighter = (f) => ({ atk: f.atk * buff(f, 'str') * (f.status.burn ? 0.8 : 1), dfn: f.def * buff(f, 'def'), mag: f.mag * buff(f, 'mag'), spr: f.def * 0.6, agi: f.agi * buff(f, 'agi') });
function physical(a, t, mult = 1, { sure = false, ignoreDef = false, blind = false, crit: critK = 0.07 } = {}) {
  if (!sure && Math.random() < Math.max(0.03, Math.min(0.25, 0.06 + (t.agi - a.agi) * 0.01)) + (blind ? 0.45 : 0)) return { miss: true };
  const crit = Math.random() < critK;
  const d = (a.atk * rnd(0.9, 1.1) - (ignoreDef ? 0 : t.dfn * 0.55)) * mult * (crit ? 1.6 : 1);
  return { dmg: Math.max(1, Math.round(d)), crit };
}
const magical = (power, a, t) => Math.max(1, Math.round((power + a.mag * 1.6) * rnd(0.92, 1.08) - t.spr * 0.45));
// how much of a blow a monster really takes: shields, armour, overheating
function dmgTaken(f, kind) {
  let k = 1;
  if (f.id === 'kraken' && B.foes.some((x) => x.id === 'krakenarm' && x.hp > 0)) k *= 0.5;
  if (f.id === 'varek' && B.foes.some((x) => x.add && x.hp > 0)) k *= 0.5;
  if (f.overheat) k *= 1.5;
  if (f.status && f.status.mark) k *= 1.3;
  if (f.ward === 'armor' && kind === 'phys') k *= 0.2;
  return k;
}
function heroHit(p, t, power = 1, a = {}) {
  const m = p.m, wep = ITEMS[m.equip.weapon], ranged = a.ranged || (wep && (wep.kind === 'bow' || wep.kind === 'gun'));
  if (t.air && !ranged && !a.jump) return { miss: true, reach: true };
  let mult = power;
  if (m.row === 'back' && !ranged && !a.jump) mult *= 0.6;
  if (a.rowBonus && m.row === a.rowBonus) mult *= 1.4;
  if (m.charge) { mult *= 2.2; m.charge = false; }
  if (a.desperate) mult *= 1 + 1.5 * (1 - m.hp / stats(m).maxhp);
  if (a.execute && t.hp < t.maxhp * 0.3) mult *= 2;
  if (a.opening && (t.status.sleep || t.status.stun || t.status.blind || t.status.freeze)) mult *= 2;
  if (a.antiUndead && MONSTERS[t.id].undead) mult *= 2;
  if (a.gamble) mult *= rnd(a.gamble[0], a.gamble[1]);
  if (hasPassive(m, 'brawler') && (!wep || wep.kind === 'fist')) mult *= 1.3;
  const me = heroFighter(m), hawk = hasPassive(m, 'hawkeye');
  if (a.useDef) me.atk = me.dfn * 1.15;
  if (a.useFoeAtk) me.atk = Math.max(me.atk, foeFighter(t).atk * 1.25);
  const r = physical(me, foeFighter(t), mult, { sure: a.sure || a.jump || hawk, ignoreDef: a.ignoreDef, blind: !!m.status.blind && !hawk, crit: hasPassive(m, 'keeneye') ? 0.18 : 0.07 });
  if (!r.miss) r.dmg = Math.max(1, Math.round(r.dmg * elemMult(t, resolveEl(a.el || (wep && wep.el), t)) * dmgTaken(t, 'phys')));
  return r;
}
async function slide(who) { const o = who.inst.obj.position, [hx, hz] = who.home, sx = o.x, sz = o.z; for (let k = 1; k <= 8; k++) { o.x = sx + (hx - sx) * k / 8; o.z = sz + (hz - sz) * k / 8; await wait(16); } }
async function lunge(who, toward) {
  const o = who.inst.obj.position, [hx, hz] = who.home, tx = toward ? toward.inst.obj.position.x : hx, tz = toward ? toward.inst.obj.position.z : hz;
  const ex = hx + (tx - hx) * 0.55, ez = hz + (tz - hz) * 0.55;
  if (toward) who.inst.obj.rotation.y = Math.atan2(tx - hx, tz - hz);
  who.inst.play('sprint');
  for (let k = 1; k <= 8; k++) { o.x = hx + (ex - hx) * k / 8; o.z = hz + (ez - hz) * k / 8; await wait(16); }
  who.inst.play('attack-melee-right', { once: true });
}
async function back(who) { const o = who.inst.obj.position, [hx, hz] = who.home, sx = o.x, sz = o.z; for (let k = 1; k <= 8; k++) { o.x = sx + (hx - sx) * k / 8; o.z = sz + (hz - sz) * k / 8; await wait(16); } if (who.face !== undefined) who.inst.obj.rotation.y = who.face; who.inst.play('idle'); }
function shake(who) { const o = who.inst.obj.position, x0 = who.home[0]; let k = 0; const t = setInterval(() => { o.x = x0 + (k % 2 ? 0.12 : -0.12); if (++k > 6) { clearInterval(t); o.x = x0; } }, 30); }
function flinch(who) { if (who.inst.has && who.inst.has('hit')) { who.inst.play('hit', { once: true }); setTimeout(() => { if (B && who.inst && (who.kind === 'foe' ? who.hp > 0 : who.m.hp > 0)) who.inst.play('idle'); }, 520); } }
function hurt(t, d, col = '#ffffff') {
  if (t.kind === 'foe') {
    if (t.hp <= 0) return;
    t.hp = Math.max(0, t.hp - d); popup(t, d, col); shake(t);
    if (t.status.sleep) delete t.status.sleep;
    if (t.hp <= 0) { sfx('die'); t.inst.play('die', { once: true }); const o = t.inst.obj; setTimeout(() => { let k = 0; const fade = setInterval(() => { o.scale.multiplyScalar(0.86); o.position.y -= 0.02; if (++k > 14) { clearInterval(fade); o.visible = false; } }, 30); }, 300); }
    else flinch(t);
  } else {
    const m = t.m;
    if (m.hp <= 0) return;
    if (d >= m.hp && hasPassive(m, 'endure') && !m.endured && m.hp > 1) { m.endured = true; d = m.hp - 1; popupLater(t, L('忍耐！', 'ENDURE!'), '#ffe27a'); }
    m.hp = Math.max(0, m.hp - d); popup(t, d, col); shake(t);
    if (m.status.sleep) delete m.status.sleep;
    if (m.hp <= 0) {
      const angel = !!m.status.reraise;
      m.status = {}; m.buffs = {}; m.jumping = null; m.stance = null; t.inst.obj.visible = true; t.inst.play('die', { once: true });
      if (angel) { setTimeout(() => { if (!B) return; m.hp = Math.round(stats(m).maxhp * 0.25); t.inst.play('idle'); sparkle(t, 0xfff0a0); popup(t, L('守護天使！', 'GUARDIAN ANGEL!'), '#fff0a0'); drawParty(); }, 700); return; }
      // the angel ring brings you back once a battle
      if (gearHas(m, 'reraise') && !m.reraised) { m.reraised = true; setTimeout(() => { if (!B) return; m.hp = Math.round(stats(m).maxhp * 0.3); t.inst.play('idle'); sparkle(t, 0xfff0a0); popup(t, L('天使之戒！', 'ANGEL RING!'), '#fff0a0'); drawParty(); }, 700); }
    } else flinch(t);
  }
}
function healHero(p, n) { const m = p.m, s = stats(m), b = m.hp; m.hp = Math.min(s.maxhp, m.hp + n); popup(p, m.hp - b, '#7cf29a'); }
function sparkle(t, col) {
  const o = t.inst.obj.position;
  for (let k = 0; k < 10; k++) {
    const g = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.12), new THREE.MeshBasicMaterial({ color: col, transparent: true }));
    g.position.set(o.x + rnd(-0.6, 0.6), o.y + rnd(0.2, 1.8), o.z + rnd(-0.6, 0.6)); B.scene.add(g);
    let life = 0; const t2 = setInterval(() => { life++; g.position.y += 0.04; g.material.opacity = 1 - life / 20; if (life > 20) { clearInterval(t2); if (B) B.scene.remove(g); g.geometry.dispose(); g.material.dispose(); } }, 30);
  }
}
// an ailment lands on a monster, or does not
function inflict(t, st, chance = 0.7, k = 1) {
  const boss = MONSTERS[t.id].boss;
  if (foeImmune(t, st)) { popup(t, L('無效', 'IMMUNE'), '#a0e0ff'); return false; }
  const ok = boss ? ['blind', 'slow', 'silence', 'burn'].includes(st) && Math.random() < 0.4 * k : Math.random() < chance * k;
  if (!ok) { popup(t, 'MISS', '#a0b0c8'); return false; }
  t.status[st] = ST_TURNS[st] || 2; popup(t, statusWord(st), '#c8a0ff'); return true;
}
function debuffFoe(t, keys) { const ks = [].concat(keys); for (const k of ks) t.buffs[k] = { k: 0.65, t: 4 }; popupLater(t, ks.length > 1 ? L('攻防↓', 'ATK/DEF DOWN') : { str: L('攻擊↓', 'ATK DOWN'), def: L('防禦↓', 'DEF DOWN'), agi: L('速度↓', 'SPD DOWN'), mag: L('魔力↓', 'MAG DOWN') }[ks[0]], '#c8a0ff'); }
const resolveEl = (el, t) => (el === 'auto' ? affinity(t.id).weak[0] || 'none' : el === 'terrain' ? TERRAIN_EL[B.bg] || 'earth' : el);
// a mark: everything hurts the monster 30% more for four rounds, guardians too
function markFoe(t) { if (t.hp <= 0) return; t.status.mark = 4; popupLater(t, L('標記', 'MARKED'), '#ffb070'); }
// a chance to fell a monster outright (never a guardian)
function tryKill(t, chance, m) {
  if (t.hp <= 0) return false;
  if (MONSTERS[t.id].boss || foeImmune(t, 'doom')) { popupLater(t, L('無效', 'IMMUNE'), '#a0e0ff'); return false; }
  if (Math.random() < chance * (hasPassive(m, 'spellfocus') ? 1.2 : 1)) { popup(t, L('一擊必殺！', 'FELLED!'), '#ff8080'); hurt(t, t.hp, '#ff8080'); return true; }
  return false;
}
// a monster's own boosts are wiped away
function dispelFoe(t) { let any = false; for (const k of Object.keys(t.buffs)) if (t.buffs[k].k > 1) { delete t.buffs[k]; any = true; } if (any) popupLater(t, L('驅散', 'DISPELLED'), '#a0e0ff'); }
const statusChance = (m) => (hasPassive(m, 'spellfocus') ? 1.2 : 1);
// a spell landing on a monster: reflection, absorption, a weakness
function spellHit(p, t, power, el0, me) {
  const el = resolveEl(el0, t);
  if (t.ward === 'reflect') { popup(t, L('反彈', 'REFLECT'), '#c0a0ff'); const d = Math.round(magical(power, me, { spr: stats(p.m).spr }) * 0.3); hurt(p, d, '#c0a0ff'); return 0; }
  sparkle(t, EL_COL[el] || 0xffffff);
  const mult = elemMult(t, el);
  if (mult < 0) { const h = Math.round(magical(power, me, foeFighter(t)) * -mult); t.hp = Math.min(t.maxhp, t.hp + h); popup(t, h, '#7cf29a'); return 0; }
  if (t.status.freeze && el === 'fire') delete t.status.freeze;
  const d = Math.max(1, Math.round(magical(power, me, foeFighter(t)) * mult * dmgTaken(t, 'magic')));
  hurt(t, d, ELC[el] || '#ffd8a0');
  return d;
}
// the stance and the counters it brings
async function stanceCounter(f, p) {
  if (!f.stance || f.hp <= 0 || p.m.hp <= 0) return;
  msg(L(`${f.name}反擊了！`, `${f.name} counters!`)); await wait(300);
  const r = physical(foeFighter(f), heroFighter(p.m), 1.2, {}); if (!r.miss) { sfx('crit'); hurt(p, r.dmg, '#ff9a9a'); }
  await wait(300);
}
async function heroAct(p, c) {
  const m = p.m;
  if (m.status.sleep || m.status.stun || m.status.freeze || m.jumping) return;
  const me = heroFighter(m), pick = (t) => (t && t.hp > 0 ? t : alive()[Math.floor(Math.random() * alive().length)]);
  if (c.type === 'guard' || c.type === 'flee') return;
  if (c.type === 'attack') {
    const t = pick(c.target); if (!t) return;
    msg(L(`${heroName(m)}的攻擊！`, `${heroName(m)} attacks!`));
    await lunge(p, t); await wait(180);
    const r = heroHit(p, t);
    if (r.miss) { sfx('miss'); popup(t, r.reach ? L('打不到', 'OUT OF REACH') : 'MISS', '#a0b0c8'); }
    else {
      sfx(r.crit ? 'crit' : 'hit'); hurt(t, r.dmg, r.crit ? '#ffe27a' : '#ffffff'); const w = ITEMS[m.equip.weapon];
      if ((w && w.drain) || hasPassive(m, 'vampiric')) healHero(p, Math.round(r.dmg * 0.15));
      if (hasPassive(m, 'siphon')) m.mp = Math.min(stats(m).maxmp, m.mp + 2 + Math.round(r.dmg * 0.02));
      if (w && w.onhit && t.hp > 0 && !MONSTERS[t.id].boss && !foeImmune(t, w.onhit) && Math.random() < 0.25 * statusChance(m)) { t.status[w.onhit] = ST_TURNS[w.onhit] || 2; popupLater(t, statusWord(w.onhit), '#c8a0ff'); }
      await stanceCounter(t, p);
    }
    await wait(320); await back(p); msg('');
    return;
  }
  if (c.type === 'item') return useItem(p, c);
  if (c.type === 'lore') return useLore(p, c);
  // abilities and link arts
  const a = c.type === 'link' ? LINKS[c.id] : ABILITIES[c.id], cost = mpCost(m, a), hc = hpCost(m, a);
  if (m.mp < cost) { msg(L('MP 不夠！', 'Not enough MP!')); await wait(600); return; }
  if (m.status.silence && SPELL.has(a.type)) { msg(L(`${heroName(m)}被封住了口，唸不出咒語！`, `${heroName(m)} is silenced and cannot cast!`)); await wait(700); return; }
  if (c.type === 'link' && (!c.partner || c.partner.m.hp <= 0)) { msg(L('夥伴無法配合……', 'The partner cannot join in...')); await wait(600); return; }
  const spent = a.mpall ? m.mp : cost;
  m.mp -= spent;
  if (hc) { m.hp = Math.max(1, m.hp - hc); popup(p, hc, '#ff7a8a'); }
  msg(`${heroName(m)}${c.type === 'link' ? L('與', ' & ') + heroName(c.partner.m) : ''}：${a.name}`);
  if (c.type === 'link') { c.partner.inst.play('interact-right', { once: true }); sparkle(c.partner, 0xffe8a0); }
  const foesT = c.target === 'allFoes' ? alive() : null;
  if (a.type === 'phys') {
    const ts = foesT || [pick(c.target)].filter(Boolean);
    if (!foesT) await lunge(p, ts[0]); else p.inst.play('attack-melee-right', { once: true });
    await wait(200);
    // the blows: each one at the same foe, or (scatter) each at a random one; ramp makes each harder
    const blows = [];
    if (a.scatter) for (let h = 0; h < (a.hits || 1); h++) blows.push([null, h]);
    else for (const t of ts) for (let h = 0; h < (a.hits || 1); h++) blows.push([t, h]);
    for (const [t0, h] of blows) {
      const t = t0 || alive()[Math.floor(Math.random() * alive().length)];
      if (!t || t.hp <= 0) { if (t0) continue; break; }
      const first = a.scatter ? !t.hitOnce : h === 0; t.hitOnce = true;
      const r = heroHit(p, t, a.power * (a.ramp ? 1 + a.ramp * h : 1), a);
      if (r.miss) { sfx('miss'); popup(t, r.reach ? L('打不到', 'OUT OF REACH') : 'MISS', '#a0b0c8'); }
      else {
        sfx(r.crit ? 'crit' : 'hit'); hurt(t, r.dmg, r.crit ? '#ffe27a' : '#ffffff');
        if (a.drain) healHero(p, Math.round(r.dmg * a.drain));
        if (a.status && Math.random() < 0.6 * statusChance(m) && !MONSTERS[t.id].boss && !foeImmune(t, a.status) && t.hp > 0) { t.status[a.status] = ST_TURNS[a.status] || 2; popup(t, statusWord(a.status), '#c8a0ff'); }
        if (a.debuff && t.hp > 0 && first) debuffFoe(t, a.debuff);
        if (a.mark && first) markFoe(t);
        if (a.steal && first) stealFrom(t, m);
        if (a.stealGold && first) stealGold(t);
        if (a.kill && first) tryKill(t, a.kill, m);
        if (first) await stanceCounter(t, p);
      }
      await wait(170);
    }
    for (const f of B.foes) delete f.hitOnce;
    if (a.healParty) { sfx('heal'); for (const q of heroesUp()) healHero(q, a.healParty + Math.round(me.spr * 0.6)); }
    await wait(250); if (!foesT) await back(p);
  } else if (a.type === 'magic') {
    const ts = foesT || [pick(c.target)].filter(Boolean);
    p.inst.play('interact-right', { once: true }); sfx({ fire: 'fire', ice: 'ice', bolt: 'bolt' }[a.el] || 'magic');
    await wait(300);
    let total = 0;
    const power = (a.power + (a.mpall ? spent * 2.5 : 0)) * (a.gamble ? rnd(a.gamble[0], a.gamble[1]) : 1);
    const after = (t) => { if (t.hp <= 0) return; if (a.status) inflict(t, a.status, 0.5, statusChance(m)); for (const st2 of a.statuses || []) if (t.hp > 0) inflict(t, st2, 0.5, statusChance(m)); if (a.debuffs) debuffFoe(t, a.debuffs); if (a.dispel) dispelFoe(t); if (a.mark) markFoe(t); if (a.kill) tryKill(t, a.kill, m); };
    if (a.scatter) for (let h = 0; h < (a.hits || 1); h++) { const t = alive()[Math.floor(Math.random() * alive().length)]; if (!t) break; total += spellHit(p, t, power, a.el === 'random3' ? ['fire', 'ice', 'bolt'][h % 3] : a.el, me); if (h === 0 || a.el === 'random3') after(t); await wait(160); }
    else for (const t of ts) { for (let h = 0; h < (a.hits || 1); h++) if (t.hp > 0) total += spellHit(p, t, power, a.el, me); after(t); }
    if (a.drain && total) healHero(p, Math.round(total * a.drain));
    if (a.healParty) for (const q of heroesUp()) healHero(q, a.healParty + Math.round(me.mag * 0.4));
    if (a.shield) for (const q of heroesUp()) q.m.buffs.def = { k: 1.6, t: 3 };
    await wait(500);
  } else if (a.type === 'heal') {
    const ts = c.target === 'allHeroes' ? B.party.filter((q) => q.m.hp > 0 || a.revive) : [c.target].filter((t) => t.m.hp > 0 || a.revive);
    sfx('heal');
    const medic = hasPassive(m, 'medic') ? 1.25 : 1;
    for (const t of ts) {
      if (t.m.hp <= 0) { t.m.hp = 1; t.inst.play('idle'); }
      sparkle(t, 0x90ff90); healHero(t, a.power >= 999 ? 9999 : Math.round((a.power + me.mag * 0.6 + me.spr * 1.2) * rnd(0.95, 1.05) * medic));
      if (a.regen) t.m.status.regen = 4;
      if (a.cure) for (const k of ['poison', 'blind', 'silence', 'burn', 'freeze', 'doom', 'slow', 'sleep', 'stun']) delete t.m.status[k];
      if (a.buff) t.m.buffs[a.buff] = { k: 1.3, t: 4 };
      if (a.buffAll) for (const k of ['str', 'def', 'agi', 'mag']) t.m.buffs[k] = { k: 1.3, t: 4 };
      if (a.mpgive) { const s2 = stats(t.m), g = Math.min(s2.maxmp - t.m.mp, a.mpgive); if (g > 0) { t.m.mp += g; popupLater(t, g, '#7cc4ff'); } }
      if (a.ward) t.m.status[a.ward] = a.ward === 'reraise' ? 9 : 4;
    }
    await wait(600);
  } else if (a.type === 'cure') { sfx('heal'); sparkle(c.target, 0xc0ffc0); c.target.m.status = {}; await wait(500); }
  else if (a.type === 'revive') { if (c.target.m.hp <= 0) { sfx('heal'); sparkle(c.target, 0xfff0a0); c.target.m.hp = Math.round(stats(c.target.m).maxhp * 0.5); c.target.inst.play('idle'); popup(c.target, c.target.m.hp, '#7cf29a'); } await wait(600); }
  else if (a.type === 'buff') {
    const ts = c.target === 'allHeroes' ? heroesUp() : [c.target === 'none' ? p : c.target];
    sfx('buff'); for (const t of ts) { sparkle(t, 0xffe27a); for (const k of a.stats || [a.stat]) t.m.buffs[k] = { k: a.big ? 1.6 : 1.3, t: 4 }; }
    if (a.taunt) m.taunt = 3;
    msg((a.stats ? L('能力全面上升！', 'Everything up!') : { str: L('攻擊力上升！', 'Attack up!'), def: L('防禦力上升！', 'Defence up!'), agi: L('速度上升！', 'Speed up!'), spr: L('魔法防禦上升！', 'Magic defence up!'), mag: L('魔力上升！', 'Magic up!') }[a.stat])); await wait(700);
  } else if (a.type === 'status') {
    const ts = foesT || [pick(c.target)].filter(Boolean);
    sfx('magic');
    for (const t of ts) {
      if (a.debuffs) { sparkle(t, 0x8050c0); debuffFoe(t, a.debuffs); }
      if (a.status) inflict(t, a.status, 0.7, statusChance(m));
      for (const st2 of a.statuses || []) inflict(t, st2, 0.6, statusChance(m));
      if (a.mark) { sparkle(t, 0xffb070); markFoe(t); }
      if (a.scanIt) S.scanned[t.id] = true;
    }
    if (a.scanIt && ts[0]) msg(foeInfo(ts[0]));
    await wait(a.scanIt ? 1400 : 700);
  } else if (a.type === 'steal') { const t = pick(c.target); await lunge(p, t); stealFrom(t, m); await wait(700); await back(p); }
  else if (a.type === 'flee') { if (B.canFlee) { msg(L('趁著煙幕逃走了！', 'Slipped away in the smoke!')); await wait(700); end('flee'); return; } }
  else if (a.type === 'taunt') { m.taunt = 3; sparkle(p, 0xff8080); msg(L('敵人的目光都集中過來了！', 'All eyes are on them now!')); await wait(700); }
  else if (a.type === 'scan') { const t = pick(c.target); sfx('magic'); sparkle(t, 0xa0f0ff); S.scanned[t.id] = true; msg(foeInfo(t)); await wait(1800); }
  else if (a.type === 'regen') { const t = c.target; sfx('heal'); sparkle(t, 0xa0ffa0); t.m.status.regen = 4; popup(t, L('再生', 'REGEN'), '#7cf29a'); await wait(600); }
  else if (a.type === 'charge') { m.charge = true; sfx('buff'); sparkle(p, 0xffc060); popup(p, L('蓄力', 'CHARGE'), '#ffe27a'); await wait(600); }
  else if (a.type === 'sentinel') { m.taunt = 3; m.buffs.def = { k: 1.8, t: 3 }; sfx('buff'); sparkle(p, 0xc0d8ff); msg(L('堅守陣地，敵人的目光都集中過來了！', 'Holding the line - all eyes are on them!')); await wait(700); }
  else if (a.type === 'meditate') { const s = stats(m), g = Math.min(s.maxmp - m.mp, Math.round(8 + me.mag * 0.25)); m.mp += g; sfx('heal'); sparkle(p, 0x80c0ff); popup(p, g, '#7cc4ff'); await wait(600); }
  else if (a.type === 'gravity') {
    sfx('magic');
    for (const t of foesT || [pick(c.target)].filter(Boolean)) { sparkle(t, 0x8060ff); hurt(t, Math.max(1, Math.round(t.hp * (MONSTERS[t.id].boss ? a.bossPct || 0.12 : a.pct || 0.4))), '#c0a0ff'); if (a.status && t.hp > 0) inflict(t, a.status, 0.7, statusChance(m)); }
    await wait(600);
  }
  // a stance lasts a few rounds; a guardian's bastion covers the whole party
  else if (a.type === 'stance') {
    sfx('buff'); sparkle(p, 0xffb070);
    if (a.stance === 'bastion') { B.bastion = a.rounds; m.stance = { id: 'bastion', t: a.rounds }; msg(L('城塞！全隊受到的傷害減少了。', 'Bastion! The whole party takes less damage.')); }
    else { m.stance = { id: a.stance, t: a.rounds }; msg({ riposte: L('擺出迎擊架式：近身攻擊一定會被反擊！', 'Riposte stance: every melee blow will be answered!'), evade: L('如流水一般……', 'Like flowing water...'), beast: L('野性解放！', 'The wild breaks loose!') }[a.stance]); }
    drawParty(); await wait(800);
  }
  // a song plays at the end of every round for a while
  else if (a.type === 'song') {
    sfx('buff'); for (const q of heroesUp()) sparkle(q, 0xffe0a0);
    B.songs = B.songs.filter((x) => x.song !== a.song);
    B.songs.push({ by: p, song: a.song, power: a.power, mag: me.mag, t: a.rounds + (hasPassive(m, 'encore') ? 2 : 0) });
    msg(L(`♪ ${a.name}在戰場上響起。`, `♪ ${a.name} rings across the field.`)); await wait(800);
  }
  else if (a.type === 'trap') { B.traps.push({ by: p, a }); sfx('buff'); sparkle(p, 0xd0b080); msg(L('陷阱設好了……', 'The trap is set...')); await wait(700); }
  else if (a.type === 'delay') { B.delays.push({ by: p, a, me, t: a.rounds, all: !!foesT, target: foesT ? null : pick(c.target) }); sfx('magic'); sparkle(p, 0xc0a0ff); msg(L(`${a.name}：倒數 ${a.rounds} 回合！`, `${a.name}: ${a.rounds} round${a.rounds > 1 ? 's' : ''} to go!`)); await wait(700); }
  else if (a.type === 'pctheal') { const t = c.target; if (t.m.hp > 0) { sfx('heal'); sparkle(t, 0xa0ffd0); healHero(t, Math.round(stats(t.m).maxhp * a.pct * (hasPassive(m, 'medic') ? 1.25 : 1))); if (a.cure) for (const k of ['poison', 'blind', 'silence', 'burn', 'freeze', 'doom', 'slow', 'sleep', 'stun']) delete t.m.status[k]; } await wait(600); }
  else if (a.type === 'coin') {
    const t = pick(c.target), spend = Math.min(S.gold, Math.max(20, Math.floor(S.gold * 0.02)));
    if (t && spend > 0) { S.gold -= spend; sfx('chest'); sparkle(t, 0xffd040); popup(p, `-${spend}G`, '#ffd040'); hurt(t, Math.max(1, Math.round(spend * 3 * dmgTaken(t, 'phys'))), '#ffd040'); }
    await wait(600);
  }
  else if (a.type === 'kill') { const t = pick(c.target); sfx('magic'); sparkle(t, 0x602080); if (t && !tryKill(t, a.kill, m) && t.hp > 0) popupLater(t, 'MISS', '#a0b0c8'); await wait(700); }
  else if (a.type === 'ward') { const t = c.target; if (t.m.hp > 0) { sfx('buff'); sparkle(t, a.ward === 'reraise' ? 0xfff0a0 : 0xa0e070); t.m.status[a.ward] = a.ward === 'reraise' ? 9 : 4; popup(t, statusWord(a.ward), '#fff0a0'); drawParty(); } await wait(600); }
  else if (a.type === 'jump') {
    // up and away: back down at the end of the round
    sfx('jump'); p.inst.play('jump', { once: true });
    const o = p.inst.obj.position; for (let k = 1; k <= 10; k++) { o.y = k * 0.9; await wait(16); }
    p.inst.obj.visible = false; o.y = 0;
    m.jumping = { target: foesT ? 'all' : c.target, power: a.power, drain: a.drain || 0 };
    msg(L(`${heroName(m)}躍上了高空！`, `${heroName(m)} leaps high into the air!`)); await wait(500);
  } else if (a.type === 'summon') await summon(p, a, me);
  else if (a.type === 'turret') { B.turrets.push({ p, power: a.power, rounds: a.rounds }); sfx('buff'); sparkle(p, 0xffe080); msg(L('自動砲台架好了！', 'The auto turret is set up!')); await wait(700); }
  else if (a.type === 'taste') { const k = ['str', 'def', 'agi', 'mag'][Math.floor(Math.random() * 4)]; sfx('heal'); sparkle(p, 0xffc080); healHero(p, Math.round(a.power + me.spr)); m.buffs[k] = { k: 1.3, t: 4 }; popupLater(p, { str: L('攻擊↑', 'ATK UP'), def: L('防禦↑', 'DEF UP'), agi: L('速度↑', 'SPD UP'), mag: L('魔力↑', 'MAG UP') }[k], '#ffe27a'); await wait(700); }
  else if (a.type === 'echo') { if (!B.lastTech) { msg(L('還沒有聽到任何招式……', 'No technique to echo yet...')); await wait(700); } else for (let k = 0; k < (a.twice ? 2 : 1) && alive().length; k++) await useLore(p, { id: B.lastTech, target: TECHS[B.lastTech].target === 'all' ? 'allFoes' : 'auto', free: true }); }
  else if (a.type === 'timewarp') {
    sfx('magic');
    for (const q of heroesUp()) { q.m.buffs.agi = { k: 1.5, t: 4 }; q.m.status.regen = 4; sparkle(q, 0xc0a0ff); }
    for (const t of alive()) { if (!MONSTERS[t.id].boss || Math.random() < 0.4) { t.status.slow = 4; popup(t, statusWord('slow'), '#c8a0ff'); } }
    msg(L('時間扭曲了：我方加速、敵人變慢！', 'Time bends: friends quicken, foes slow!')); await wait(900);
  }
  msg('');
}
// a dragoon lands
async function land(p) {
  const m = p.m, j = m.jumping; m.jumping = null;
  const o = p.inst.obj.position; p.inst.obj.visible = true;
  const ts = j.target === 'all' ? alive() : [j.target && j.target.hp > 0 ? j.target : alive()[0]].filter(Boolean);
  if (!ts.length) { o.y = 0; return; }
  const t0 = ts[0].inst.obj.position; o.x = t0.x + 0.8; o.z = t0.z;
  for (let k = 10; k >= 0; k--) { o.y = k * 0.9; await wait(16); }
  msg(L(`${heroName(m)}從天而降！`, `${heroName(m)} comes crashing down!`)); sfx('crit');
  for (const t of ts) { const r = heroHit(p, t, j.power * (MONSTERS[t.id].fly || t.air ? 1.5 : 1) * (hasPassive(m, 'dragonheart') ? 1.3 : 1), { jump: true, sure: true }); if (!r.miss) { hurt(t, r.dmg, '#ffe27a'); if (j.drain) healHero(p, Math.round(r.dmg * j.drain)); } if (t.air) { t.air = false; popup(t, L('擊落！', 'GROUNDED!'), '#ffe27a'); } }
  await wait(400); await slide(p); if (p.face !== undefined) p.inst.obj.rotation.y = p.face; p.inst.play('idle'); msg('');
}
// a spirit appears in the middle of the field, strikes, and fades
async function summon(p, a, me) {
  p.inst.play('interact-right', { once: true }); sfx('warp');
  const inst = make(a.model, { tint: a.tint }); inst.fit(3.2); inst.obj.position.set(0.4, 0.2, 0.9); inst.obj.rotation.y = a.heal ? -Math.PI / 2 : Math.PI / 2; B.scene.add(inst.obj); B.spirit = { inst };
  inst.play('attack-melee-right', { once: true }); await wait(700);
  if (a.heal) { sfx('heal'); for (const q of B.party) { if (q.m.hp <= 0) continue; sparkle(q, 0xfff4c0); healHero(q, Math.round(a.power + me.mag * 0.9 + me.spr * 0.8)); if (a.regen) q.m.status.regen = 4; } }
  else if (a.shieldParty) { sfx('buff'); for (const q of heroesUp()) { sparkle(q, 0xa0f0ff); q.m.buffs.def = { k: 1.6, t: 4 }; q.m.buffs.spr = { k: 1.6, t: 4 }; } msg(L('光之簾包住了全隊！', 'A veil of light wraps the party!')); }
  else { sfx(a.el === 'fire' ? 'fire' : a.el === 'water' ? 'ice' : a.el === 'bolt' ? 'bolt' : 'magic'); for (const t of alive()) { spellHit(p, t, a.power, a.el, me); if (a.status && t.hp > 0) inflict(t, a.status, 0.5, statusChance(p.m)); } if (a.buff) for (const q of heroesUp()) q.m.buffs[a.buff] = { k: 1.3, t: 4 }; }
  await wait(700);
  B.scene.remove(inst.obj); B.spirit = null;
}
function stealFrom(t, m) {
  if (t.stolen) { sfx('miss'); msg(L('已經什麼都不剩了。', 'There is nothing left to take.')); return; }
  const luck = (m && hasPassive(m, 'thiefluck') ? 0.2 : 0) + (m && gearHas(m, 'stealUp') ? 0.15 : 0);
  if (Math.random() < 0.55 + luck) {
    const d = DROPS[t.id], rare = d && Math.random() < 0.08 + luck * 0.6, it = d ? (rare ? d.r[0] : d.steal) : 'potion';
    t.stolen = true; addItem(it); sfx('chest'); msg(rare ? L(`★ 偷到了稀有的${ITEMS[it].name}！`, `★ Stole a rare ${ITEMS[it].name}!`) : L(`偷到了${ITEMS[it].name}！`, `Stole ${ITEMS[it].name}!`));
  } else { sfx('miss'); msg(L('什麼也沒偷到。', 'Nothing to steal.')); }
}
// lifting a monster's gold, once each
function stealGold(t) {
  if (t.goldTaken) return;
  t.goldTaken = true; const g = Math.round((8 + t.lv * 6) * rnd(0.7, 1.3)); S.gold += g; popupLater(t, `+${g}G`, '#ffd040');
}
async function useItem(p, c) {
  const m = p.m, it = ITEMS[c.id];
  if (!count(c.id)) return;
  addItem(c.id, -1);
  const k = (hasPassive(m, 'pharmacy') || (it.food && hasPassive(m, 'gourmet'))) ? 2 : 1, t = c.target;
  msg(L(`${heroName(m)}使用了${it.name}。`, `${heroName(m)} uses ${it.name}.`)); p.inst.play('interact-right', { once: true }); await wait(350);
  if (it.use === 'scan') { const f = t && t.hp > 0 ? t : alive()[0]; if (f) { sparkle(f, 0xa0f0ff); S.scanned[f.id] = true; msg(foeInfo(f)); await wait(1800); } msg(''); return; }
  if (it.use === 'escape') { if (B.canFlee || (!B.boss && !B.arena)) { msg(L('煙霧瀰漫，大家趁機溜走了！', 'In the smoke, everyone slips away!')); await wait(700); end('flee'); return; } msg(L('在這裡逃不掉！', 'No escaping this one!')); await wait(700); return; }
  if (it.use === 'bomb') { sfx(it.el === 'fire' ? 'fire' : it.el === 'ice' ? 'ice' : it.el === 'bolt' ? 'bolt' : 'magic'); for (const f of alive()) { const mult = elemMult(f, it.el); sparkle(f, EL_COL[it.el] || 0xffffff); if (mult > 0) hurt(f, Math.max(1, Math.round(it.power * k * mult * rnd(0.92, 1.08) * dmgTaken(f, 'magic'))), ELC[it.el]); } await wait(600); msg(''); return; }
  const ts = t === 'allHeroes' ? B.party.filter((q) => q.m.hp > 0 || it.use === 'revive') : [t];
  for (const q of ts) {
    if (it.use === 'revive') { if (q.m.hp <= 0) { q.m.hp = Math.round(stats(q.m).maxhp * (it.power >= 999 ? 1 : 0.4 * k)); q.inst.play('idle'); sfx('heal'); sparkle(q, 0xfff0a0); popup(q, q.m.hp, '#7cf29a'); } continue; }
    if (q.m.hp <= 0) continue;
    sfx('heal'); sparkle(q, 0x90ff90);
    if (it.use === 'heal') healHero(q, it.power * k);
    if (it.use === 'mp') { const s = stats(q.m); q.m.mp = Math.min(s.maxmp, q.m.mp + it.power * k); popup(q, it.power * k, '#7cc4ff'); }
    if (it.use === 'elixir') { const s = stats(q.m); q.m.hp = s.maxhp; q.m.mp = s.maxmp; popup(q, s.maxhp, '#7cf29a'); }
    if (it.use === 'cure') for (const st of it.cures || ['poison', 'blind']) delete q.m.status[st];
    if (it.use === 'cureall') { for (const st of ['poison', 'blind', 'silence', 'burn', 'freeze', 'doom', 'slow', 'sleep', 'stun']) delete q.m.status[st]; if (it.heal) healHero(q, it.heal * k); }
    if (it.use === 'buff') { q.m.buffs[it.stat] = { k: 1.3, t: 4 }; popupLater(q, { str: L('攻擊↑', 'ATK UP'), def: L('防禦↑', 'DEF UP'), agi: L('速度↑', 'SPD UP') }[it.stat], '#ffe27a'); }
  }
  await wait(500); msg('');
}
// a mimic uses a monster's technique
async function useLore(p, c) {
  const m = p.m, t0 = TECHS[c.id], A = loreAbility(c.id), me = heroFighter(m);
  if (!c.free) { const cost = mpCost(m, A); if (m.mp < cost) { msg(L('MP 不夠！', 'Not enough MP!')); await wait(600); return; } m.mp -= cost; }
  msg(`${heroName(m)}：${t0.name}`); p.inst.play('interact-right', { once: true }); await wait(350);
  const ts = c.target === 'allFoes' ? alive() : [c.target && c.target.kind === 'foe' && c.target.hp > 0 ? c.target : alive()[0]].filter(Boolean);
  if (t0.kind === 'magic') { sfx('magic'); for (const t of ts) spellHit(p, t, t0.power * 1.3, t0.el, me); }
  else if (t0.kind === 'status') { sfx('magic'); for (const t of ts) inflict(t, t0.status, 0.6); }
  else if (t0.kind === 'drain') { const t = ts[0]; if (t) { const d = spellHit(p, t, t0.power * 1.4, 'dark', me); healHero(p, d); } }
  else if (t0.kind === 'curse') { for (const t of ts) debuffFoe(t, ['str', 'def']); }
  else if (t0.kind === 'smash') { const t = ts[0]; if (t) { await lunge(p, t); const r = heroHit(p, t, t0.power, {}); if (!r.miss) hurt(t, r.dmg, '#ffe27a'); await back(p); } }
  else if (t0.kind === 'steal') { const t = ts[0]; if (t) stealFrom(t, m); }
  else if (t0.kind === 'break') { for (const t of ts) debuffFoe(t, 'def'); }
  else if (t0.kind === 'guard') { m.buffs.def = { k: 1.8, t: 3 }; sparkle(p, 0xc0c0c0); popup(p, L('防禦↑', 'DEF UP'), '#c0d0ff'); }
  else if (t0.kind === 'rally') { m.buffs.str = { k: 1.4, t: 3 }; sparkle(p, 0xff6040); popup(p, L('攻擊↑', 'ATK UP'), '#ffa080'); }
  else if (t0.kind === 'heal') { healHero(p, Math.round(stats(m).maxhp * 0.3)); sparkle(p, 0x90ff90); }
  await wait(600); msg('');
}
// Ein, when she fights beside you: she keeps the party alive and, under the endless noon, casts dusk over them
async function guestAct() {
  const g = B.guest; if (!g || !alive().length) return;
  g.n++;
  const low = heroesUp().filter((p) => p.m.hp < stats(p.m).maxhp * 0.45), dead = B.party.filter((p) => p.m.hp <= 0);
  g.inst.play('interact-right', { once: true });
  if (B.noon && (g.n % 2 === 1 || !heroesUp().some((p) => p.m.status.dusk))) { msg(L(`${g.name}：「夜晚啊，借我一點點就好。」——暮光之紗！`, `${g.name}: "Night, lend me a little of you." - Veil of Dusk!`)); sfx('magic'); for (const p of heroesUp()) { p.m.status.dusk = 2; sparkle(p, 0x9070d0); } }
  else if (dead.length && g.n % 3 === 0) { const p = dead[0]; msg(L(`${g.name}：「還不能睡喔。」`, `${g.name}: "Not time to sleep yet."`)); sfx('heal'); p.m.hp = Math.round(stats(p.m).maxhp * 0.4); p.inst.play('idle'); sparkle(p, 0xfff0a0); popup(p, p.m.hp, '#7cf29a'); }
  else if (low.length) { msg(L(`${g.name}：月光之癒！`, `${g.name}: Moonlight Mend!`)); sfx('heal'); for (const p of heroesUp()) { sparkle(p, 0xc0e0ff); healHero(p, Math.round(stats(p.m).maxhp * 0.22)); } }
  else { const t = alive()[Math.floor(Math.random() * alive().length)]; msg(L(`${g.name}：月之刃！`, `${g.name}: Moon Blade!`)); sfx('magic'); sparkle(t, 0xc0a0ff); hurt(t, Math.round((90 + t.lv * 9) * rnd(0.9, 1.1) * elemMult(t, 'dark') * dmgTaken(t, 'magic')), '#c090ff'); }
  await wait(900); g.inst.play('idle'); msg('');
}
async function foeAct(f) {
  if (f.status.sleep) { popup(f, 'Zz', '#c0c0ff'); await wait(400); return; }
  if (f.status.stun || f.status.freeze) { popup(f, statusWord(f.status.freeze ? 'freeze' : 'stun'), '#c8a0ff'); await wait(400); return; }
  f.stance = false; f.overheat = false;
  const M = MONSTERS[f.id], ups = targetable();
  if (!ups.length) { await wait(200); return; }
  // a trap springs on the first monster to move
  if (B.traps.length) {
    const tr = B.traps.shift(), me = heroFighter(tr.by.m);
    msg(L(`${f.name}踩到了陷阱！`, `${f.name} springs the trap!`)); sfx(tr.a.el === 'bolt' ? 'bolt' : 'crit'); sparkle(f, tr.a.el ? EL_COL[tr.a.el] : 0xd0b080);
    const r = physical(me, foeFighter(f), tr.a.power, { sure: true, ignoreDef: true });
    hurt(f, Math.max(1, Math.round(r.dmg * elemMult(f, tr.a.el) * dmgTaken(f, 'phys'))), '#ffe27a');
    if (f.hp > 0 && tr.a.status && !M.boss && !foeImmune(f, tr.a.status) && Math.random() < 0.8) { f.status[tr.a.status] = ST_TURNS[tr.a.status] || 1; popupLater(f, statusWord(tr.a.status), '#c8a0ff'); }
    await wait(700); msg('');
    if (f.hp <= 0 || f.status.stun) return;
  }
  // the wyvern's flight: up for a round, then down on someone
  if (M.mech === 'airborne') {
    if (f.air) { f.air = false; const t = pickHeroFrom(ups); msg(L(`${f.name}從高空俯衝而下！`, `${f.name} dives from the sky!`)); await lunge(f, t); await wait(150); const r = physical(foeFighter(f), heroFighter(t.m), 2.0 * (t.m.defending ? 0.5 : 1), {}); if (!r.miss) { sfx('crit'); hurt(t, r.dmg, '#ff9a9a'); } else { sfx('miss'); popup(t, 'MISS', '#a0b0c8'); } await wait(250); await back(f); msg(''); return; }
    if (B.round % 3 === 0) { f.air = true; msg(L(`${f.name}飛上了高空！近戰打不到牠了，用弓、槍、魔法或跳躍！`, `${f.name} soars up high! Melee cannot reach - use bows, guns, magic or a jump!`)); sfx('jump'); await wait(1100); msg(''); return; }
  }
  // the colossus vents its steam, then stands overheated
  if (M.mech === 'vent' && B.round % 4 === 0) {
    msg(L(`${f.name}：蒸汽全開！`, `${f.name}: full steam!`)); f.inst.play('interact-right', { once: true }); await wait(450); sfx('fire');
    for (const t of ups) { const d = magical(52 + f.lv * 1.5, foeFighter(f), heroFighter(t.m)) * (t.m.defending ? 0.6 : 1) * (resists(t.m, 'fire') ? 0.5 : 1) * heroTakes(t, 'magic', 'fire'); sparkle(t, EL_COL.fire); hurt(t, Math.max(1, Math.round(d)), '#ff9a9a'); }
    f.overheat = true; f.status.stun = 1; await wait(700); msg(L('齒輪巨像過熱了！現在是攻擊的好機會！', 'The Colossus has overheated! Now is your chance!')); await wait(900); msg(''); return;
  }
  const acts = (M.acts || [['atk', 1]]).filter(([a]) => !(f.status.silence && a !== 'atk' && TECHS[a] && ['magic', 'status', 'drain', 'curse', 'heal', 'summon'].includes(TECHS[a].kind)));
  const total = acts.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total, act = 'atk'; for (const [a, w] of acts) { r -= w; if (r <= 0) { act = a; break; } }
  if (act === 'summon' && B.foes.filter((x) => x.add && x.hp > 0).length >= 2) act = 'laser';
  if (M.mech === 'umbra' && f.hp < f.maxhp * 0.25 && B.round % 3 === 0) act = 'eclipse';
  if (act === 'atk') {
    let t = pickHeroFrom(ups);
    const cover = ups.find((p) => p !== t && hasPassive(p.m, 'cover') && t.m.hp < stats(t.m).maxhp * 0.35);
    if (cover && Math.random() < 0.6) { msg(L(`${heroName(cover.m)}挺身擋下了攻擊！`, `${heroName(cover.m)} steps in to take the blow!`)); t = cover; }
    else msg(L(`${f.name}的攻擊！`, `${f.name} attacks!`));
    await lunge(f, t); await wait(160);
    const res = dodged(t) ? { miss: true } : physical(foeFighter(f), heroFighter(t.m), (t.m.defending ? 0.5 : 1) * (t.m.row === 'back' ? 0.6 : 1) * heroTakes(t, 'phys'), { blind: !!f.status.blind });
    if (res.miss) { sfx('miss'); popup(t, 'MISS', '#a0b0c8'); } else { sfx(res.crit ? 'crit' : 'hit'); hurt(t, res.dmg, '#ff9a9a'); thorns(t, f, res.dmg); }
    await wait(250); await back(f);
    const ripo = t.m.stance && t.m.stance.id === 'riposte';
    if (!res.miss && t.m.hp > 0 && f.hp > 0 && (ripo || ((hasPassive(t.m, 'counter') || gearHas(t.m, 'counter')) && Math.random() < 0.3))) { msg(L(`${heroName(t.m)}反擊！`, `${heroName(t.m)} counters!`)); await lunge(t, f); const c2 = heroHit(t, f, ripo ? 1.2 : 1); if (!c2.miss) { sfx('hit'); hurt(f, c2.dmg); } await wait(200); await back(t); }
    msg(''); return;
  }
  const tech = TECHS[act];
  B.lastTech = act;
  msg(`${f.name}：${tech.name}`);
  f.inst.play('interact-right', { once: true });
  await wait(450);
  // a mimic who is hit by a technique may learn it
  const learn = (t) => { if (t && t.m.hp > 0 && hasPassive(t.m, 'mimicry') && !S.lore.includes(act) && LORE_MP[act] !== undefined && act !== 'summon' && Math.random() < 0.6) { S.lore.push(act); popupLater(t, L('學會了！', 'LEARNED!'), '#a0ffe0'); setTimeout(() => B && msg(L(`${heroName(t.m)}學會了「${tech.name}」！`, `${heroName(t.m)} learned ${tech.name}!`)), 500); } };
  if (tech.kind === 'magic') {
    const ts = tech.target === 'all' ? ups : [pickHeroFrom(ups)];
    sfx({ fire: 'fire', ice: 'ice', bolt: 'bolt' }[tech.el] || 'magic');
    for (const t of ts) { sparkle(t, EL_COL[tech.el] || 0xffffff); const res = resists(t.m, tech.el); if (res) popupLater(t, L('抵抗', 'RESIST'), '#a0b0c8'); const d = magical(tech.power + (M.boss ? f.lv * 1.5 : 0), foeFighter(f), heroFighter(t.m)) * (t.m.defending ? 0.6 : 1) * (res ? 0.5 : 1) * heroTakes(t, 'magic', tech.el); hurt(t, Math.max(1, Math.round(d)), '#ff9a9a'); if (tech.el === 'fire' && t.m.status.freeze) delete t.m.status.freeze; learn(t); }
  } else if (tech.kind === 'status') {
    const t = pickHeroFrom(ups);
    if (immuneTo(t.m, tech.status) || heroImmune(t.m, tech.status)) popup(t, L('無效', 'IMMUNE'), '#a0e0ff');
    else if (Math.random() < 0.6) { t.m.status[tech.status] = { sleep: 2, blind: 3, silence: 3, burn: 3, freeze: 1, doom: 4, stun: 1, slow: 3, poison: 9 }[tech.status] || 1; popup(t, statusWord(tech.status), '#c8a0ff'); } else popup(t, 'MISS', '#a0b0c8');
    learn(t);
  } else if (tech.kind === 'guard') { f.buffs.def = { k: 1.8, t: 3 }; sparkle(f, 0xc0c0c0); popup(f, L('防禦↑', 'DEF UP'), '#c0d0ff');
  } else if (tech.kind === 'rally') { f.buffs.str = { k: 1.4, t: 3 }; sparkle(f, 0xff6040); popup(f, L('攻擊↑', 'ATK UP'), '#ffa080');
  } else if (tech.kind === 'drain') {
    const t = pickHeroFrom(ups), d = Math.max(1, Math.round(magical(tech.power + (M.boss ? f.lv : 0), foeFighter(f), heroFighter(t.m)) * heroTakes(t, 'magic'))); hurt(t, d, '#ff9a9a'); f.hp = Math.min(f.maxhp, f.hp + d); popup(f, d, '#7cf29a'); learn(t);
  } else if (tech.kind === 'curse') { const t = pickHeroFrom(ups); t.m.buffs.str = { k: 0.7, t: 3 }; t.m.buffs.def = { k: 0.7, t: 3 }; sparkle(t, 0x8050c0); popup(t, L('攻防↓', 'ATK/DEF DOWN'), '#c8a0ff'); learn(t);
  } else if (tech.kind === 'heal') { const h = Math.round(f.maxhp * (M.boss ? 0.06 : 0.15)); f.hp = Math.min(f.maxhp, f.hp + h); sparkle(f, 0x90ff90); popup(f, h, '#7cf29a');
  } else if (tech.kind === 'smash') {
    const t = pickHeroFrom(ups); await lunge(f, t); await wait(150);
    const res = dodged(t) ? { miss: true } : physical(foeFighter(f), heroFighter(t.m), tech.power * (t.m.defending ? 0.5 : 1) * (t.m.row === 'back' ? 0.7 : 1) * heroTakes(t, 'phys'), {});
    if (res.miss) { sfx('miss'); popup(t, 'MISS', '#a0b0c8'); } else { sfx('crit'); hurt(t, res.dmg, '#ff9a9a'); thorns(t, f, res.dmg); }
    await wait(250); await back(f); learn(t);
  } else if (tech.kind === 'break') { const t = pickHeroFrom(ups); t.m.buffs.def = { k: 0.7, t: 3 }; sparkle(t, 0xa0d060); popup(t, L('防禦↓', 'DEF DOWN'), '#c8a0ff'); learn(t);
  } else if (tech.kind === 'explode') {
    const t = pickHeroFrom(ups); sfx('fire'); sparkle(f, 0xff8040); await lunge(f, t);
    const r = physical(foeFighter(f), heroFighter(t.m), 2.4 * (t.m.defending ? 0.5 : 1) * heroTakes(t, 'phys'), { sure: true });
    hurt(t, r.dmg, '#ff9a9a'); hurt(f, f.hp, '#ff8040'); await wait(300);
  } else if (tech.kind === 'flee') {
    f.fled = true; f.hp = 0; sfx('cancel'); msg(L(`${f.name}逃走了！`, `${f.name} ran away!`)); f.inst.obj.visible = false; await wait(700);
  } else if (tech.kind === 'summon') { msg(L(`${f.name}叫來了齒輪仔！`, `${f.name} calls up a cogling!`)); addFoe('cogling'); await wait(500);
  } else if (tech.kind === 'steal') {
    const keys = Object.keys(S.inv).filter((k) => ITEMS[k].use);
    if (keys.length && Math.random() < 0.5) { const k = keys[Math.floor(Math.random() * keys.length)]; addItem(k, -1); msg(L(`被偷走了${ITEMS[k].name}！`, `${ITEMS[k].name} was stolen!`)); } else msg(L('沒被偷走東西。', 'Nothing was stolen.'));
  }
  await wait(600); msg('');
}
// how much of a monster's blow a hero takes: the bastion, and the passives that guard against magic
function heroTakes(p, kind, el) {
  const m = p.m; let k = B.bastion > 0 ? 0.7 : 1;
  if (kind === 'magic') { if (hasPassive(m, 'magicguard')) k *= 0.8; if (el && el !== 'none' && hasPassive(m, 'elemguard')) k *= 0.6; }
  return k;
}
// flowing water and light feet: a chance to dodge a blow outright
const dodged = (p) => Math.random() < (p.m.stance && p.m.stance.id === 'evade' ? 0.5 : 0) + (hasPassive(p.m, 'evade') ? 0.12 : 0);
// thornskin hurts whoever strikes in melee
function thorns(p, f, dmg) { if (p.m.status.thorns && f.hp > 0) { const d = Math.max(1, Math.round(dmg * 0.4)); setTimeout(() => { if (B && f.hp > 0) hurt(f, d, '#a0e070'); }, 200); } }
// supports that keep ailments away
const heroImmune = (m, st) => (hasPassive(m, 'stalwart') && ['sleep', 'stun'].includes(st)) || (hasPassive(m, 'purity') && ['poison', 'blind', 'silence'].includes(st));
// monsters go for the front row twice as often, and for anyone who has drawn their eye
function pickHeroFrom(ups) {
  const taunter = ups.find((p) => p.m.taunt > 0); if (taunter) return taunter;
  const w = ups.map((p) => (p.m.row === 'back' ? 1 : 2)), tot = w.reduce((a, b) => a + b, 0);
  let r = Math.random() * tot; for (let i = 0; i < ups.length; i++) { r -= w[i]; if (r <= 0) return ups[i]; } return ups[0];
}
void UI; void list;
