// Turn-based battles on a small stage of their own: the party on the right, the monsters on the left, all
// as 3D models, with the windows as HTML on top. Everyone picks a command, then the round plays out by speed.
import * as THREE from 'three';
import { make } from './models.js';
import { MONSTERS, TECHS, ABILITIES, ITEMS, HEROES, monsterStats, affinity, EL_NAME } from './data.js';
import { S, stats, abilitiesOf, hasPassive, heroName, gain, addItem, count, gearHas, immuneTo, resists } from './party.js';
import { input } from './input.js';
import { sfx, playMusic, jingle } from './audio.js';
import { L } from './i18n.js';
import { UI, list } from './ui.js';
import { Q } from './quality.js';

const $ = (id) => document.getElementById(id);
let B = null, tex = null;
const ticks = new Set();
export function battleTick() { for (const f of [...ticks]) f(); }
const onTick = (f) => { ticks.add(f); return () => ticks.delete(f); };
export const inBattle = () => !!B;
const rnd = (a, b) => a + Math.random() * (b - a);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// the stage: a floor of the ground you were standing on, a sky colour, two lights
const SKY = { grass: 0x8cc8f0, forest: 0x305a3a, sand: 0x9ad0f0, redsand: 0xe8a070, stone: 0x8890a8, snow: 0xc8d8f0, crystal: 0x40306a, marsh: 0x5a6e62, spore: 0x5a3e7a, ember: 0x6a2a1a };
const FLOOR = { grass: 'grass_top', forest: 'grass_top', sand: 'sand', redsand: 'redsand', stone: 'greystone', snow: 'snow', crystal: 'stone_diamond', marsh: 'mossstone', spore: 'grass_top', ember: 'redstone' };
export function setBattleAtlas(t, info) { tex = { t, info }; }
const TREES = ['hex/tree_single_A.gltf', 'hex/trees_A_small.gltf', 'hex/tree_single_B.gltf', 'hex/trees_B_medium.gltf'];
const ROCKS = ['hex/rock_single_A.gltf', 'hex/rock_single_C.gltf', 'hex/rock_single_E.gltf'];
function floorMaterial(kind) {
  const { t, info } = tex, fi = info.faces[FLOOR[kind] || 'grass_top'], cols = info.cols, rows = info.rows;
  const c = document.createElement('canvas'); c.width = c.height = info.size;
  c.getContext('2d').drawImage(t.image, (fi % cols) * info.size, Math.floor(fi / cols) * info.size, info.size, info.size, 0, 0, info.size, info.size);
  const ct = new THREE.CanvasTexture(c); ct.magFilter = THREE.NearestFilter; ct.wrapS = ct.wrapT = THREE.RepeatWrapping; ct.repeat.set(14, 10); ct.colorSpace = THREE.SRGBColorSpace;
  void rows;
  return new THREE.MeshLambertMaterial({ map: ct });
}
function buildStage(kind) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(SKY[kind] || SKY.grass);
  scene.fog = new THREE.Fog(scene.background, 16, 34);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x445566, 1.6));
  const sun = new THREE.DirectionalLight(0xfff0d8, 2.2); sun.position.set(-4, 10, 6); sun.castShadow = Q.shadow > 0; sun.shadow.mapSize.set(1024, 1024); Object.assign(sun.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10 }); scene.add(sun);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 26), floorMaterial(kind)); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; floor.userData.own = true; scene.add(floor);
  // the land you were standing on, behind the fight: trees, pines or rocks
  const back = { grass: TREES, forest: TREES, marsh: TREES, spore: ['grave/pumpkin'], snow: ['grave/pine', 'grave/pine-crooked'], stone: ROCKS, crystal: ROCKS, sand: ROCKS, redsand: ROCKS, ember: ROCKS }[kind] || TREES;
  for (let k = 0; k < (Q.shadow ? 14 : 9); k++) {
    const path = back[k % back.length], tree = back === TREES || path.includes('pine'), inst = make(path);
    inst.fit(tree ? 3 + (k * 7 % 5) * 0.5 : path.includes('pumpkin') ? 0.9 : 0.8 + (k % 3) * 0.4);
    inst.obj.position.set(-13 + k * 2 + Math.sin(k * 3.1) * 0.8, 0, -5.5 - (k % 3) * 2.2); inst.obj.rotation.y = k * 1.7; scene.add(inst.obj);
  }
  const cam = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 0.1, 80);
  cam.position.set(1.0, 12.6, 11.8); cam.lookAt(1.0, 0.4, 1.1);
  return { scene, cam };
}

// ---------- start ----------
// the two sides stand in lines facing each other across the field; each line slants a little so no one hides another,
// and the back row stands a step further from the monsters
const lineZ = (i, n) => 0.9 + (i - (n - 1) / 2) * 1.7;
const heroSpot = (i, m) => [2.7 + i * 0.35 + (m.row === 'back' ? 0.9 : 0), lineZ(i, S.members.length)];
const ELC = { fire: '#ff9050', ice: '#a0e8ff', bolt: '#fff080', water: '#70b0ff', holy: '#fff8d0', earth: '#d0a060' };
const elName = (el) => (EL_NAME[el] ? L(EL_NAME[el][0], EL_NAME[el][1]) : '');
// how hard an element lands on a monster, and a word to show when it matters
function elemMult(f, el) {
  if (!el || el === 'none' || f.kind !== 'foe') return 1;
  const a = affinity(f.id);
  if (a.weak.includes(el)) { popupLater(f, L('弱點！', 'WEAK!'), '#ffe27a'); return 1.6; }
  if (a.res.includes(el)) { popupLater(f, L('抵抗', 'RESIST'), '#a0b0c8'); return 0.4; }
  return 1;
}
const popupLater = (who, s, col) => setTimeout(() => B && popup(who, s, col), 260);
// what a player knows about a monster: everything once it has been scanned
function foeInfo(f) {
  const debuffs = Object.entries(f.buffs).map(([k, b]) => (b.k < 1 ? '↓' : '↑') + { str: L('攻', 'Atk'), def: L('防', 'Def'), agi: L('速', 'Spd') }[k]).join('');
  const st = Object.keys(f.status).map(statusWord).filter(Boolean).join(' ');
  if (!S.scanned[f.id]) return `${f.name}　HP ???　${debuffs} ${st}`;
  const a = affinity(f.id);
  return `${f.name}　HP ${f.hp}/${f.maxhp}　${a.weak.length ? L('弱：', 'Weak: ') + a.weak.map(elName).join(L('、', ', ')) : ''}${a.res.length ? L('　抗：', '  Resist: ') + a.res.map(elName).join(L('、', ', ')) : ''}　${debuffs} ${st}`;
}
const mpCost = (m, a) => (hasPassive(m, 'mpthrift') || gearHas(m, 'mpcut') ? Math.ceil(a.mp * 0.75) : a.mp);
// a line telling what an ability does
function describe(a) {
  const tgt = { enemy: L('單體', 'one foe'), enemies: L('全體敵人', 'all foes'), ally: L('一位夥伴', 'one friend'), allies: L('全體夥伴', 'all friends'), self: L('自己', 'self'), dead: L('倒下的夥伴', 'a fallen friend'), none: '' }[a.target] || '';
  const what = { phys: L('物理', 'physical'), magic: L('魔法', 'magic'), heal: L('回復', 'healing'), buff: L('強化', 'boost'), status: L('異常狀態', 'status'), scan: L('看穿弱點、抗性與 HP', 'reveal weaknesses, resistances and HP'), regen: L('每回合回復 HP', 'restore HP every round'), charge: L('下一次物理攻擊 2.2 倍', 'next physical hit x2.2'), sentinel: L('吸引攻擊並大幅提升防禦', 'draw attacks and raise defence a lot'), meditate: L('回復自己的 MP', 'restore own MP'), steal: L('偷東西', 'steal'), taunt: L('吸引攻擊', 'draw attacks'), gravity: L('削去目前 HP 的四成', 'cut 40% of current HP'), cure: L('解除異常', 'cure ailments'), revive: L('復活', 'revive'), flee: L('逃跑', 'escape') }[a.type] || '';
  const el = a.el === 'auto' ? L('自動選弱點屬性', 'element picked to hit a weakness') : a.el && a.el !== 'none' ? elName(a.el) + L('屬性', ' element') : '';
  const extra = [a.hits > 1 ? L(`${a.hits} 連擊`, `${a.hits} hits`) : '', a.power && a.type === 'phys' ? `×${a.power}` : '', a.status ? statusWord(a.status) : '', a.debuff ? L(`降低${{ str: '攻擊', def: '防禦' }[a.debuff]}`, `lowers ${{ str: 'attack', def: 'defence' }[a.debuff]}`) : '', a.sure ? L('必中', 'never misses') : '', a.regen ? L('附加再生', 'plus regen') : ''];
  return [what, el, tgt, ...extra].filter(Boolean).join('・');
}
export function startBattle(ids, { boss = false, bg = 'grass', canFlee = true } = {}) {
  return new Promise((resolve) => {
    const st = buildStage(bg);
    const foes = ids.map((id, i) => {
      const m = MONSTERS[id], s = monsterStats(id), inst = make(m.model, { color: m.color });
      // the monsters stand in a line on the left, facing the party
      const n = ids.length, x = boss ? -3.4 : -2.7 - i * 0.35, z = boss ? 0.9 : lineZ(i, n);
      inst.obj.position.set(x, 0, z);
      if (m.model.startsWith('vox:')) inst.obj.scale.setScalar(m.boss ? 1.6 : 1.2); else inst.fit(m.boss ? 3.6 : m.model.startsWith('pets/') ? 1.4 : 2.0);
      st.scene.add(inst.obj); inst.play('idle');
      return { id, kind: 'foe', name: m.name + (ids.filter((t) => t === id).length > 1 ? 'ABCD'[ids.slice(0, i).filter((t) => t === id).length] : ''), ...s, maxhp: s.hp, inst, home: [x, z], status: {}, buffs: {}, h: m.boss ? 3.6 : 1.8 };
    });
    const party = S.members.map((m, i) => {
      // the party stands in a line on the right, mirroring the monsters
      const inst = make(HEROES[m.id].model).fit(1.9); const [x, z] = heroSpot(i, m);
      inst.obj.position.set(x, 0, z);
      st.scene.add(inst.obj); inst.play(m.hp > 0 ? 'idle' : 'die', { once: m.hp <= 0 });
      m.buffs = {}; m.defending = false; delete m.status.sleep; delete m.status.stun; m.taunt = 0; m.charge = false;
      return { m, inst, home: [x, z], h: 1.9 };
    });
    // everyone looks straight across at the other line
    for (const f of foes) { f.face = Math.PI / 2; f.inst.obj.rotation.y = f.face; }
    for (const p of party) { p.face = -Math.PI / 2; p.inst.obj.rotation.y = p.face; }
    // how tall each one really stands, for the arrow and the numbers
    for (const o of [...foes, ...party]) { const bb = new THREE.Box3().setFromObject(o.inst.obj); o.h = Math.max(0.6, bb.max.y - bb.min.y); }
    B = { ...st, foes, party, boss, canFlee: canFlee && !boss, resolve, round: 0, pops: [], over: false, t: 0, drops: [] };
    $('battleui').innerHTML = '<div id="bmsg" class="panel"></div><div id="bparty" class="panel"></div><div id="bcmd" class="panel"></div><div id="bfx"></div>';
    $('battleui').classList.add('on');
    playMusic(boss ? 'boss' : 'battle');
    drawParty();
    run();
  });
}
export function battleRender(renderer, dt) {
  if (!B) return;
  B.t += dt;
  for (const f of B.foes) f.inst.update(dt);
  for (const p of B.party) p.inst.update(dt);
  B.cam.aspect = innerWidth / innerHeight; B.cam.updateProjectionMatrix();
  renderer.render(B.scene, B.cam);
  // keep popups and the target arrow over their models
  for (const el of document.querySelectorAll('#bfx [data-x]')) { const p = screenOf(+el.dataset.x, +el.dataset.y, +el.dataset.z); el.style.left = p[0] + 'px'; el.style.top = p[1] + 'px'; }
}
function screenOf(x, y, z) { const v = new THREE.Vector3(x, y, z).project(B.cam); return [(v.x + 1) / 2 * innerWidth, (1 - v.y) / 2 * innerHeight]; }
function popup(who, s, col = '#ffffff') {
  const o = who.inst.obj.position, el = document.createElement('div');
  el.className = 'pop'; el.textContent = s; el.style.color = col; el.dataset.x = o.x; el.dataset.y = (who.h || 1.8) + 0.3; el.dataset.z = o.z;
  const p = screenOf(o.x, (who.h || 1.8) + 0.3, o.z); el.style.left = p[0] + 'px'; el.style.top = p[1] + 'px';
  $('bfx').appendChild(el); setTimeout(() => el.remove(), 950);
}
function msg(s) { const m = $('bmsg'); if (!m) return; m.textContent = s || ''; m.classList.toggle('on', !!s); }
function drawParty() {
  const el = $('bparty'); if (!el) return;
  el.innerHTML = S.members.map((m) => {
    const s = stats(m), act = B.active === m, dead = m.hp <= 0;
    const st = Object.keys(m.status).map((k) => ({ poison: L('毒', 'Psn'), sleep: L('睡', 'Zz'), stun: L('暈', 'Stn'), slow: L('緩', 'Slw'), blind: L('盲', 'Bld'), regen: L('生', 'Rgn') }[k])).filter(Boolean).concat(m.charge ? [L('蓄', 'Chg')] : []).join(' ');
    return `<div class="hb${act ? ' act' : ''}${dead ? ' dead' : ''}"><div class="row"><span>${heroName(m)} <span class="small">${m.row === 'back' ? L('後', 'B') : L('前', 'F')}</span></span><span class="small">${st}</span></div>` +
      `<div class="row small"><span>HP ${m.hp}/${s.maxhp}</span><span>MP ${m.mp}</span></div><div class="bar"><i style="width:${Math.max(0, m.hp / s.maxhp * 100)}%;background:${m.hp < s.maxhp / 4 ? '#ff7a8a' : '#7cf29a'}"></i></div></div>`;
  }).join('');
}

// ---------- the round ----------
const alive = () => B.foes.filter((f) => f.hp > 0);
const heroesUp = () => B.party.filter((p) => p.m.hp > 0);
async function run() {
  await wait(300);
  const names = [...new Set(B.foes.map((f) => MONSTERS[f.id].name))];
  msg(B.boss ? L(`${names[0]}擋在面前！`, `${names[0]} stands in your way!`) : L(`${names.join('、')}出現了！`, `${names.join(', ')} appeared!`));
  await wait(1100); msg('');
  for (;;) {
    B.round++;
    const cmds = await choose();
    if (cmds === 'flee') {
      const ok = Math.random() < 0.6 || cmds.sure;
      if (ok) { sfx('cancel'); msg(L('成功逃走了！', 'Got away!')); await wait(700); return end('flee'); }
      msg(L('逃不掉！', "Can't escape!")); await wait(700);
    }
    const order = [];
    if (cmds !== 'flee') for (const c of cmds) if (c) order.push({ hero: c.p, c, spd: speed(c.p.m) * rnd(0.85, 1.15) + (c.type === 'guard' ? 999 : 0) + (gearHas(c.p.m, 'first') ? 500 : 0) });
    for (const f of alive()) order.push({ foe: f, spd: f.agi * (f.status.slow ? 0.5 : 1) * rnd(0.85, 1.15) });
    order.sort((a, b) => b.spd - a.spd);
    for (const p of B.party) p.m.defending = false;
    for (const o of order) if (o.hero && o.c.type === 'guard') o.hero.m.defending = true;
    for (const o of order) {
      if (o.hero) { if (o.hero.m.hp > 0) await heroAct(o.hero, o.c); }
      else if (o.foe.hp > 0) await foeAct(o.foe);
      drawParty();
      if (await checkEnd()) return;
    }
    // poison, regeneration and buffs wear off
    for (const p of heroesUp()) {
      const m = p.m, s = stats(m);
      if (m.status.poison) { const d = Math.max(1, Math.floor(s.maxhp / 12)); m.hp = Math.max(1, m.hp - d); popup(p, d, '#c080ff'); }
      if (hasPassive(m, 'innerpeace')) { const h = Math.round(s.maxhp * 0.05); m.hp = Math.min(s.maxhp, m.hp + h); }
      if (m.status.regen || gearHas(m, 'regen')) { const h = Math.round(s.maxhp * (m.status.regen ? 0.09 : 0.05)); if (m.hp < s.maxhp) { m.hp = Math.min(s.maxhp, m.hp + h); popup(p, h, '#7cf29a'); } }
      for (const k of ['sleep', 'stun', 'blind', 'regen']) if (m.status[k] && --m.status[k] <= 0) delete m.status[k];
      for (const k of Object.keys(m.buffs)) if (--m.buffs[k].t <= 0) delete m.buffs[k];
      if (m.taunt) m.taunt--;
    }
    for (const f of alive()) {
      if (f.status.poison) { const d = Math.max(1, Math.floor(f.maxhp / 14)); hurt(f, d, '#c080ff'); }
      for (const k of ['sleep', 'stun', 'slow', 'blind']) if (f.status[k] && --f.status[k] <= 0) delete f.status[k];
      for (const k of Object.keys(f.buffs)) if (--f.buffs[k].t <= 0) delete f.buffs[k];
    }
    drawParty();
    if (await checkEnd()) return;
  }
}
const buff = (o, k) => (o.buffs && o.buffs[k] ? o.buffs[k].k : 1);
function speed(m) { return stats(m).agi * buff(m, 'agi') * (m.status.slow ? 0.5 : 1); }
async function checkEnd() {
  if (!alive().length) { await victory(); return true; }
  if (!heroesUp().length) { msg(L('全員倒下了……', 'Everyone has fallen...')); await wait(1600); end('lose'); return true; }
  return false;
}
async function victory() {
  await wait(400);
  jingle('victory');
  const exp = B.foes.reduce((a, f) => a + f.exp, 0), jp = B.foes.reduce((a, f) => a + f.jp, 0), gold = B.foes.reduce((a, f) => a + f.gold, 0);
  for (const p of heroesUp()) p.inst.play('emote-yes', { once: true });
  S.gold += gold;
  const lines = [L(`勝利！獲得 ${exp} 經驗值、${jp} JP、${gold} 金幣。`, `Victory! ${exp} EXP, ${jp} JP and ${gold} gold.`)];
  for (const d of B.drops) lines.push(L(`得到了${ITEMS[d].name}！`, `Got ${ITEMS[d].name}!`));
  for (const l of gain(exp, jp)) lines.push(l.t);
  for (const l of lines) { msg(l); drawParty(); await waitKey(); }
  end('win');
}
function waitKey() { return new Promise((r) => { const t0 = performance.now(); const off = onTick(() => { if ((performance.now() - t0 > 250 && (input.pressed('a') || input.pressed('b'))) || performance.now() - t0 > 2600) { off(); r(); } }); }); }
function disposeStage(scene) {
  scene.traverse((o) => {
    if (o.isLight && o.shadow && o.shadow.map) o.shadow.map.dispose();
    // the floor and the sparkles are the stage's own; the models share theirs with the field and stay
    if (o.isMesh && o.userData.own) { o.geometry.dispose(); if (o.material.map) o.material.map.dispose(); o.material.dispose(); }
  });
}
function end(result) {
  for (const m of S.members) { m.buffs = {}; m.defending = false; m.taunt = 0; m.charge = false; for (const k of ['sleep', 'stun', 'slow', 'blind', 'regen']) delete m.status[k]; }
  $('battleui').classList.remove('on'); $('battleui').innerHTML = '';
  disposeStage(B.scene);
  const r = B.resolve; B = null; r(result);
}

// ---------- choosing ----------
async function choose() {
  const cmds = [];
  for (let i = 0; i < B.party.length; i++) {
    const p = B.party[i], m = p.m;
    if (m.hp <= 0 || m.status.sleep || m.status.stun) { cmds[i] = null; continue; }
    B.active = m; drawParty();
    const c = await commandFor(p, i > 0);
    if (c === 'back') { let j = i - 1; while (j >= 0 && !cmds[j] && (B.party[j].m.hp <= 0 || B.party[j].m.status.sleep)) j--; i = Math.max(-1, j - 1); continue; }
    if (c.type === 'flee') { B.active = null; drawParty(); return 'flee'; }
    cmds[i] = { ...c, p };
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
async function commandFor(p, canBack) {
  const m = p.m;
  for (;;) {
    const abil = abilitiesOf(m).filter((a) => !ABILITIES[a].passive);
    const wep = ITEMS[m.equip.weapon], wel = wep && wep.el;
    const r = await cmdMenu([
      { label: L('攻擊', 'Attack'), right: wel ? elName(wel) : '', desc: (wel ? elName(wel) + L('屬性・', ' element · ') : '') + (m.row === 'back' && !(wep && wep.kind === 'bow') ? L('後排：近戰傷害降低', 'back row: melee does less') : L('普通攻擊', 'a plain attack')) },
      { label: L('技能', 'Abilities'), disabled: !abil.length, desc: L('職業技能', 'job abilities') }, { label: L('道具', 'Items'), disabled: !Object.keys(S.inv).some((k) => ITEMS[k].use && ITEMS[k].use !== 'tent'), desc: L('使用道具', 'use an item') },
      { label: L('防禦', 'Guard'), desc: L('這回合受到的傷害減半，最先行動', 'halve damage this round, act first') },
      { label: m.row === 'back' ? L('換到前排', 'To front row') : L('換到後排', 'To back row'), desc: L('後排受到的物理傷害少四成，但近戰傷害也降低（弓不受影響）。不消耗回合', 'Back row takes 40% less physical damage but deals less in melee (bows are unaffected). Costs no turn') },
      { label: L('逃跑', 'Run'), disabled: !B.canFlee },
    ], { cancel: canBack });
    if (r < 0) return 'back';
    if (r === 0) { const t = await target('enemy', m); if (t) return { type: 'attack', target: t }; }
    if (r === 1) {
      const k = await cmdMenu(abil.map((a) => ({ label: ABILITIES[a].name, right: mpCost(m, ABILITIES[a]), disabled: mpCost(m, ABILITIES[a]) > m.mp, desc: describe(ABILITIES[a]) })));
      if (k < 0) continue;
      const a = abil[k], t = await target(ABILITIES[a].target, m);
      if (t !== null) return { type: 'ability', id: a, target: t };
    }
    if (r === 2) {
      const items = Object.keys(S.inv).filter((k) => ITEMS[k].use && ITEMS[k].use !== 'tent');
      const k = await cmdMenu(items.map((id) => ({ label: ITEMS[id].name, right: S.inv[id], desc: ITEMS[id].desc || '' })));
      if (k < 0) continue;
      const id = items[k], t = await target(ITEMS[id].target, m);
      if (t !== null) return { type: 'item', id, target: t };
    }
    if (r === 3) return { type: 'guard' };
    if (r === 4) { m.row = m.row === 'back' ? 'front' : 'back'; sfx('ok'); const i = B.party.indexOf(p); p.home = heroSpot(i, m); slide(p); drawParty(); continue; }
    if (r === 5) return { type: 'flee' };
  }
}
// pick who: an arrow over the target, left and right to move it
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
    const place = () => { const o = pool[i].inst.obj.position; arrow.dataset.x = o.x; arrow.dataset.y = (pool[i].h || 1.9) + 0.5; arrow.dataset.z = o.z; msg(pool[i].kind === 'foe' ? foeInfo(pool[i]) : heroName(pool[i].m)); };
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
const heroFighter = (m) => { const s = stats(m); return { atk: s.atk * buff(m, 'str'), dfn: s.dfn * buff(m, 'def'), mag: s.mag, spr: s.spr, agi: s.agi * buff(m, 'agi') }; };
const foeFighter = (f) => ({ atk: f.atk * buff(f, 'str'), dfn: f.def * buff(f, 'def'), mag: f.mag, spr: f.def * 0.6, agi: f.agi });
function physical(a, t, mult = 1, { sure = false, ignoreDef = false, blind = false } = {}) {
  if (!sure && Math.random() < Math.max(0.03, Math.min(0.25, 0.06 + (t.agi - a.agi) * 0.01)) + (blind ? 0.45 : 0)) return { miss: true };
  const crit = Math.random() < 0.07;
  let d = (a.atk * rnd(0.9, 1.1) - (ignoreDef ? 0 : t.dfn * 0.55)) * mult * (crit ? 1.6 : 1);
  return { dmg: Math.max(1, Math.round(d)), crit };
}
const magical = (power, a, t) => Math.max(1, Math.round((power + a.mag * 1.6) * rnd(0.92, 1.08) - t.spr * 0.45));
// a hero's physical hit: the back row holds back in melee, a charge doubles it, the element can find a weakness
function heroHit(p, t, power = 1, a = {}) {
  const m = p.m, wep = ITEMS[m.equip.weapon];
  let mult = power;
  if (m.row === 'back' && !(wep && wep.kind === 'bow')) mult *= 0.6;
  if (m.charge) { mult *= 2.2; m.charge = false; }
  const r = physical(heroFighter(m), foeFighter(t), mult, { sure: a.sure, ignoreDef: a.ignoreDef, blind: !!m.status.blind });
  if (!r.miss) r.dmg = Math.max(1, Math.round(r.dmg * elemMult(t, a.el || (wep && wep.el))));
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
function hurt(t, d, col = '#ffffff') {
  if (t.kind === 'foe') {
    t.hp = Math.max(0, t.hp - d); popup(t, d, col); shake(t);
    if (t.status.sleep) delete t.status.sleep;
    if (t.hp <= 0) { sfx('die'); t.inst.play('die', { once: true }); const o = t.inst.obj; setTimeout(() => { let k = 0; const fade = setInterval(() => { o.scale.multiplyScalar(0.86); o.position.y -= 0.02; if (++k > 14) { clearInterval(fade); o.visible = false; } }, 30); }, 300); }
  } else {
    const m = t.m;
    m.hp = Math.max(0, m.hp - d); popup(t, d, col); shake(t);
    if (m.status.sleep) delete m.status.sleep;
    if (m.hp <= 0) { m.status = {}; m.buffs = {}; t.inst.play('die', { once: true }); }
  }
}
function healHero(p, n) { const m = p.m, s = stats(m), b = m.hp; m.hp = Math.min(s.maxhp, m.hp + n); popup(p, m.hp - b, '#7cf29a'); }
function sparkle(t, col) {
  const o = t.inst.obj.position;
  for (let k = 0; k < 10; k++) {
    const g = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.12), new THREE.MeshBasicMaterial({ color: col, transparent: true }));
    g.position.set(o.x + rnd(-0.6, 0.6), rnd(0.2, 1.8), o.z + rnd(-0.6, 0.6)); B.scene.add(g);
    let life = 0; const t2 = setInterval(() => { life++; g.position.y += 0.04; g.material.opacity = 1 - life / 20; if (life > 20) { clearInterval(t2); if (B) B.scene.remove(g); g.geometry.dispose(); g.material.dispose(); } }, 30);
  }
}
const EL_COL = { fire: 0xff7030, ice: 0x90e0ff, bolt: 0xfff070, holy: 0xfff8d0, water: 0x60a0ff, none: 0xd0a0ff };
async function heroAct(p, c) {
  const m = p.m;
  if (m.status.sleep || m.status.stun) return;
  const me = heroFighter(m), pick = (t) => (t && t.hp > 0 ? t : alive()[Math.floor(Math.random() * alive().length)]);
  if (c.type === 'guard') return;
  if (c.type === 'flee') return;
  if (c.type === 'attack') {
    const t = pick(c.target); if (!t) return;
    msg(L(`${heroName(m)}的攻擊！`, `${heroName(m)} attacks!`));
    await lunge(p, t); await wait(180);
    const r = heroHit(p, t);
    if (r.miss) { sfx('miss'); popup(t, 'MISS', '#a0b0c8'); } else { sfx(r.crit ? 'crit' : 'hit'); hurt(t, r.dmg, r.crit ? '#ffe27a' : '#ffffff'); }
    await wait(320); await back(p); msg('');
    return;
  }
  if (c.type === 'item') {
    const it = ITEMS[c.id];
    if (!count(c.id)) return;
    addItem(c.id, -1);
    const k = hasPassive(m, 'pharmacy') ? 2 : 1, t = c.target;
    msg(L(`${heroName(m)}使用了${it.name}。`, `${heroName(m)} uses ${it.name}.`)); p.inst.play('interact-right', { once: true }); await wait(350);
    if (it.use === 'scan') { const f = t && t.hp > 0 ? t : alive()[0]; if (f) { sparkle(f, 0xa0f0ff); S.scanned[f.id] = true; msg(foeInfo(f)); await wait(1800); } msg(''); return; }
    if (it.use === 'revive') { if (t.m.hp <= 0) { t.m.hp = Math.round(stats(t.m).maxhp * 0.4 * k); t.inst.play('idle'); sfx('heal'); sparkle(t, 0xfff0a0); popup(t, t.m.hp, '#7cf29a'); } }
    else if (t.m.hp > 0) {
      sfx('heal'); sparkle(t, 0x90ff90);
      if (it.use === 'heal') healHero(t, it.power * k);
      if (it.use === 'mp') { const s = stats(t.m); t.m.mp = Math.min(s.maxmp, t.m.mp + it.power * k); popup(t, it.power * k, '#7cc4ff'); }
      if (it.use === 'cure') { delete t.m.status.poison; delete t.m.status.blind; }
    }
    await wait(500); msg(''); return;
  }
  // abilities
  const a = ABILITIES[c.id], cost = mpCost(m, a);
  if (m.mp < cost) { msg(L('MP 不夠！', 'Not enough MP!')); await wait(600); return; }
  m.mp -= cost;
  msg(`${heroName(m)}：${a.name}`);
  const foesT = c.target === 'allFoes' ? alive() : null;
  if (a.type === 'phys') {
    const ts = foesT || [pick(c.target)].filter(Boolean);
    if (!foesT) await lunge(p, ts[0]); else p.inst.play('attack-melee-right', { once: true });
    await wait(200);
    for (const t of ts) for (let h = 0; h < (a.hits || 1); h++) {
      if (t.hp <= 0) break;
      const r = heroHit(p, t, a.power, a);
      if (r.miss) { sfx('miss'); popup(t, 'MISS', '#a0b0c8'); } else {
        sfx(r.crit ? 'crit' : 'hit'); hurt(t, r.dmg, r.crit ? '#ffe27a' : '#ffffff');
        if (a.status && Math.random() < 0.6 && !MONSTERS[t.id].boss) { t.status[a.status] = a.status === 'poison' ? 9 : 2; popup(t, statusWord(a.status), '#c8a0ff'); }
        // breaks work on bosses too
        if (a.debuff && t.hp > 0 && h === 0) { t.buffs[a.debuff] = { k: 0.65, t: 4 }; popupLater(t, { str: L('攻擊↓', 'ATK DOWN'), def: L('防禦↓', 'DEF DOWN') }[a.debuff], '#c8a0ff'); }
      }
      await wait(170);
    }
    await wait(250); if (!foesT) await back(p);
  } else if (a.type === 'magic') {
    const ts = foesT || [pick(c.target)].filter(Boolean);
    p.inst.play('interact-right', { once: true }); sfx(a.el === 'fire' ? 'fire' : a.el === 'ice' ? 'ice' : a.el === 'bolt' ? 'bolt' : 'magic');
    await wait(300);
    for (const t of ts) {
      // an 'auto' spell takes whatever element the monster fears most
      const el = a.el === 'auto' ? affinity(t.id).weak[0] || 'none' : a.el;
      sparkle(t, EL_COL[el] || 0xffffff); hurt(t, Math.max(1, Math.round(magical(a.power, me, foeFighter(t)) * elemMult(t, el))), ELC[el] || '#ffd8a0');
    }
    await wait(500);
  } else if (a.type === 'heal') {
    const ts = c.target === 'allHeroes' ? heroesUp() : [c.target].filter((t) => t.m.hp > 0);
    sfx('heal'); for (const t of ts) { sparkle(t, 0x90ff90); healHero(t, Math.round((a.power + me.mag * 0.6 + me.spr * 1.2) * rnd(0.95, 1.05))); if (a.regen) t.m.status.regen = 4; }
    await wait(600);
  } else if (a.type === 'cure') { sfx('heal'); sparkle(c.target, 0xc0ffc0); c.target.m.status = {}; await wait(500); }
  else if (a.type === 'revive') { if (c.target.m.hp <= 0) { sfx('heal'); sparkle(c.target, 0xfff0a0); c.target.m.hp = Math.round(stats(c.target.m).maxhp * 0.5); c.target.inst.play('idle'); popup(c.target, c.target.m.hp, '#7cf29a'); } await wait(600); }
  else if (a.type === 'buff') {
    const ts = c.target === 'allHeroes' ? heroesUp() : [c.target === 'none' ? p : c.target];
    sfx('buff'); for (const t of ts) { sparkle(t, 0xffe27a); t.m.buffs[a.stat] = { k: a.big ? 1.6 : 1.3, t: 4 }; }
    msg({ str: L('攻擊力上升！', 'Attack up!'), def: L('防禦力上升！', 'Defence up!'), agi: L('速度上升！', 'Speed up!') }[a.stat]); await wait(700);
  } else if (a.type === 'status') {
    const ts = foesT || [pick(c.target)].filter(Boolean);
    sfx('magic');
    // bosses shrug off most ailments, but blindness and slowness can still catch them sometimes
    for (const t of ts) { const boss = MONSTERS[t.id].boss, ok = boss ? ['blind', 'slow'].includes(a.status) && Math.random() < 0.4 : Math.random() < 0.7; if (ok) { t.status[a.status] = a.status === 'poison' ? 9 : a.status === 'slow' || a.status === 'blind' ? 4 : 2; popup(t, statusWord(a.status), '#c8a0ff'); } else popup(t, 'MISS', '#a0b0c8'); }
    await wait(700);
  } else if (a.type === 'steal') {
    const t = pick(c.target); await lunge(p, t);
    if (Math.random() < 0.55) { const it = Math.random() < 0.2 ? 'hipotion' : Math.random() < 0.5 ? 'ether' : 'potion'; addItem(it); sfx('chest'); msg(L(`偷到了${ITEMS[it].name}！`, `Stole ${ITEMS[it].name}!`)); }
    else { sfx('miss'); msg(L('什麼也沒偷到。', 'Nothing to steal.')); }
    await wait(700); await back(p);
  } else if (a.type === 'flee') { if (B.canFlee) { msg(L('趁著煙幕逃走了！', 'Slipped away in the smoke!')); await wait(700); end('flee'); return; } }
  else if (a.type === 'taunt') { m.taunt = 3; sparkle(p, 0xff8080); msg(L('敵人的目光都集中過來了！', 'All eyes are on them now!')); await wait(700); }
  else if (a.type === 'scan') {
    const t = pick(c.target); sfx('magic'); sparkle(t, 0xa0f0ff); S.scanned[t.id] = true; msg(foeInfo(t)); await wait(1800);
  } else if (a.type === 'regen') { const t = c.target; sfx('heal'); sparkle(t, 0xa0ffa0); t.m.status.regen = 4; popup(t, L('再生', 'REGEN'), '#7cf29a'); await wait(600); }
  else if (a.type === 'charge') { m.charge = true; sfx('buff'); sparkle(p, 0xffc060); popup(p, L('蓄力', 'CHARGE'), '#ffe27a'); await wait(600); }
  else if (a.type === 'sentinel') { m.taunt = 3; m.buffs.def = { k: 1.8, t: 3 }; sfx('buff'); sparkle(p, 0xc0d8ff); msg(L('堅守陣地，敵人的目光都集中過來了！', 'Holding the line - all eyes are on them!')); await wait(700); }
  else if (a.type === 'meditate') { const s = stats(m), g = Math.min(s.maxmp - m.mp, Math.round(8 + me.mag * 0.25)); m.mp += g; sfx('heal'); sparkle(p, 0x80c0ff); popup(p, g, '#7cc4ff'); await wait(600); }
  else if (a.type === 'gravity') { const t = pick(c.target); sfx('magic'); sparkle(t, 0x8060ff); hurt(t, Math.max(1, Math.round(t.hp * (MONSTERS[t.id].boss ? 0.12 : 0.4))), '#c0a0ff'); await wait(600); }
  msg('');
}
const statusWord = (s) => ({ poison: L('中毒', 'POISON'), sleep: L('睡著', 'SLEEP'), stun: L('暈眩', 'STUN'), slow: L('減速', 'SLOW'), blind: L('失明', 'BLIND'), regen: L('再生', 'REGEN') }[s]);
async function foeAct(f) {
  if (f.status.sleep) { popup(f, 'Zz', '#c0c0ff'); await wait(400); return; }
  if (f.status.stun) { popup(f, statusWord('stun'), '#c8a0ff'); await wait(400); return; }
  const m = MONSTERS[f.id], acts = m.acts || [['atk', 1]], total = acts.reduce((a, [, w]) => a + w, 0);
  let r = Math.random() * total, act = 'atk'; for (const [a, w] of acts) { r -= w; if (r <= 0) { act = a; break; } }
  const ups = heroesUp(); if (!ups.length) return;
  const taunter = ups.find((p) => p.m.taunt > 0);
  // monsters go for the front row twice as often
  const pickHero = () => { if (taunter) return taunter; const w = ups.map((p) => (p.m.row === 'back' ? 1 : 2)), tot = w.reduce((a, b) => a + b, 0); let r = Math.random() * tot; for (let i = 0; i < ups.length; i++) { r -= w[i]; if (r <= 0) return ups[i]; } return ups[0]; };
  if (act === 'atk') {
    let t = pickHero();
    // a guardian may step in for a friend who is low
    const cover = ups.find((p) => p !== t && hasPassive(p.m, 'cover') && t.m.hp < stats(t.m).maxhp * 0.35);
    if (cover && Math.random() < 0.6) { msg(L(`${heroName(cover.m)}挺身擋下了攻擊！`, `${heroName(cover.m)} steps in to take the blow!`)); t = cover; }
    else msg(L(`${f.name}的攻擊！`, `${f.name} attacks!`));
    await lunge(f, t); await wait(160);
    const res = physical(foeFighter(f), heroFighter(t.m), (t.m.defending ? 0.5 : 1) * (t.m.row === 'back' ? 0.6 : 1), { blind: !!f.status.blind });
    if (res.miss) { sfx('miss'); popup(t, 'MISS', '#a0b0c8'); } else { sfx(res.crit ? 'crit' : 'hit'); hurt(t, res.dmg, '#ff9a9a'); }
    await wait(250); await back(f);
    if (!res.miss && t.m.hp > 0 && (hasPassive(t.m, 'counter') || gearHas(t.m, 'counter')) && Math.random() < 0.3) { msg(L(`${heroName(t.m)}反擊！`, `${heroName(t.m)} counters!`)); await lunge(t, f); const c2 = heroHit(t, f); if (!c2.miss) { sfx('hit'); hurt(f, c2.dmg); } await wait(200); await back(t); }
    msg(''); return;
  }
  const tech = TECHS[act];
  msg(`${f.name}：${tech.name}`);
  f.inst.play('interact-right', { once: true });
  await wait(450);
  if (tech.kind === 'magic') {
    const ts = tech.target === 'all' ? ups : [pickHero()];
    sfx(tech.el === 'fire' ? 'fire' : tech.el === 'ice' ? 'ice' : 'magic');
    for (const t of ts) { sparkle(t, EL_COL[tech.el] || 0xffffff); const res = resists(t.m, tech.el); if (res) popupLater(t, L('抵抗', 'RESIST'), '#a0b0c8'); const d = magical(tech.power + (MONSTERS[f.id].boss ? f.lv * 1.5 : 0), foeFighter(f), heroFighter(t.m)) * (t.m.defending ? 0.6 : 1) * (res ? 0.5 : 1); hurt(t, Math.max(1, Math.round(d)), '#ff9a9a'); }
  } else if (tech.kind === 'status') {
    const t = pickHero();
    if (immuneTo(t.m, tech.status)) popup(t, L('無效', 'IMMUNE'), '#a0e0ff');
    else if (Math.random() < 0.6) { t.m.status[tech.status] = tech.status === 'sleep' ? 2 : tech.status === 'blind' ? 3 : 1; popup(t, statusWord(tech.status), '#c8a0ff'); } else popup(t, 'MISS', '#a0b0c8');
  } else if (tech.kind === 'guard') { f.buffs.def = { k: 1.8, t: 3 }; sparkle(f, 0xc0c0c0); popup(f, L('防禦↑', 'DEF UP'), '#c0d0ff');
  } else if (tech.kind === 'rally') { f.buffs.str = { k: 1.4, t: 3 }; sparkle(f, 0xff6040); popup(f, L('攻擊↑', 'ATK UP'), '#ffa080');
  } else if (tech.kind === 'drain') {
    const t = pickHero(), d = magical(tech.power, foeFighter(f), heroFighter(t.m)); hurt(t, d, '#ff9a9a'); f.hp = Math.min(f.maxhp, f.hp + d); popup(f, d, '#7cf29a');
  } else if (tech.kind === 'steal') {
    const keys = Object.keys(S.inv).filter((k) => ITEMS[k].use);
    if (keys.length && Math.random() < 0.5) { const k = keys[Math.floor(Math.random() * keys.length)]; addItem(k, -1); msg(L(`被偷走了${ITEMS[k].name}！`, `${ITEMS[k].name} was stolen!`)); } else msg(L('沒被偷走東西。', 'Nothing was stolen.'));
  }
  await wait(600); msg('');
}
void UI; void list;
