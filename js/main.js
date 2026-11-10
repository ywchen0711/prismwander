// 晶境漫遊 Prismwander: boot, the 3D world, walking and jumping, the camera, everything you can touch,
// roaming monsters, the minimap, the title, the opening and the ending.
import * as THREE from 'three';
import { generate, buildChunk, setAtlas, W, WX, WZ, WY, SEA, CHUNK, get, solid, B, regionAt, REGIONS, ground, SPIRE } from './world.js';
import { preload, make, crystalMesh, homeMesh } from './models.js';
import { input, setupInput, pollInput, endInput } from './input.js';
import { initAudio, playMusic, sfx, jingle, music, setMusic } from './audio.js';
import { UI, uiUpdate, say, ask, toast, areaName, prompt, fade, wait } from './ui.js';
import { S, newParty, stats, fullHeal, save, load, hasSave } from './party.js';
import { HEROES, MONSTERS, ITEMS } from './data.js';
import { startBattle, battleRender, battleTick, inBattle, setBattleAtlas } from './battle.js';
import { fieldMenu, loadSettings, homeName } from './menu.js';
import { SCRIPTS } from './story.js';
import { L, LANG, setLang, onLang } from './i18n.js';

const $ = (id) => document.getElementById(id);
loadSettings();
document.documentElement.lang = LANG === 'en' ? 'en' : 'zh-Hant';

// ---------- renderer and the world scene ----------
const canvas = $('view');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
renderer.setPixelRatio(Math.min(1.5, devicePixelRatio || 1));
renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene();
const SKYC = new THREE.Color(0x9ad4f8);
scene.background = SKYC.clone();
scene.fog = new THREE.Fog(SKYC.clone(), 40, 110);
scene.add(new THREE.HemisphereLight(0xeaf6ff, 0x5a5a40, 1.5));
const sun = new THREE.DirectionalLight(0xfff4e0, 1.6); sun.position.set(-40, 80, 30); scene.add(sun);
const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 260);
function resize() { renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();
setupInput(canvas);

const G = (window.G = { S, W, scene: 'boot' });
let mode = 'boot';
const ents = [];      // { kind, obj, inst, data, ... }
let player = null;
const P = { x: 98.5, y: 12, z: 164.5, vy: 0, ground: false, yaw: Math.PI, safe: [98.5, 12, 164.5], inv: 0, region: '' };
const cam = { yaw: Math.PI, dist: 9, pitch: 0.48 };

async function boot() {
  try { await document.fonts.load('16px Cubic11'); } catch (e) { /* fall back */ }
  // the block atlas
  const info = await (await fetch('assets/tex/blocks.json')).json();
  const tex = await new THREE.TextureLoader().loadAsync('assets/tex/blocks.png');
  tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.NearestFilter; tex.colorSpace = THREE.SRGBColorSpace; tex.generateMipmaps = false;
  setAtlas(info); setBattleAtlas(tex, info);
  generate();
  const mat = new THREE.MeshLambertMaterial({ map: tex, vertexColors: true });
  for (let cz = 0; cz < Math.ceil(WZ / CHUNK); cz++) for (let cx = 0; cx < Math.ceil(WX / CHUNK); cx++) { const m = new THREE.Mesh(buildChunk(cx, cz), mat); m.userData.chunk = [cx, cz]; scene.add(m); chunks.set(cx + ',' + cz, m); }
  const water = new THREE.Mesh(new THREE.PlaneGeometry(WX * 3, WZ * 3), new THREE.MeshLambertMaterial({ color: 0x3a86e0, transparent: true, opacity: 0.72 }));
  water.rotation.x = -Math.PI / 2; water.position.set(WX / 2, SEA + 0.82, WZ / 2); scene.add(water);
  const models = new Set(Object.values(HEROES).map((h) => h.model));
  for (const e of W.ents) if (e.model) models.add(e.model);
  for (const m of Object.values(MONSTERS)) if (!m.model.startsWith('vox:')) models.add(m.model);
  models.add('dungeon/chest');
  await preload([...models]);
  buildEnts();
  $('loading').style.display = 'none';
  showTitle();
  requestAnimationFrame(frame);
  window.READY = 1;
}
const chunks = new Map();
function rebuildChunkAt(x, z) { const k = Math.floor(x / CHUNK) + ',' + Math.floor(z / CHUNK), m = chunks.get(k); if (m) { m.geometry.dispose(); m.geometry = buildChunk(...m.userData.chunk); } }

// ---------- what lives in the world ----------
function buildEnts() {
  for (const e of W.ents) {
    if (e.type === 'npc' || e.type === 'prop') {
      const inst = make(e.model); if (inst.fit) inst.fit(e.type === 'npc' ? 1.75 : 1.6); inst.obj.position.set(...e.pos); inst.obj.rotation.y = [0, Math.PI / 2, Math.PI, -Math.PI / 2][e.face || 0];
      scene.add(inst.obj); ents.push({ kind: e.type, inst, data: e, pos: e.pos });
    }
    if (e.type === 'gate') {
      const g = new THREE.Mesh(new THREE.BoxGeometry(3, 3, 0.3), new THREE.MeshLambertMaterial({ color: 0x9ae8ff, emissive: 0x2050a0, transparent: true, opacity: 0.75 }));
      g.rotation.y = Math.PI / 2; g.position.set(e.pos[0], e.pos[1] + 1.5, e.pos[2]); scene.add(g); ents.push({ kind: 'gate', obj: g, data: e, pos: e.pos });
    }
    if (e.type === 'boss') { const m = MONSTERS[e.monster], inst = make(m.model, { color: m.color }); inst.obj.position.set(...e.pos); inst.obj.scale.setScalar(1.8); scene.add(inst.obj); ents.push({ kind: 'boss', inst, data: { ...e, boss: true }, pos: e.pos }); }
  }
  for (const c of W.crystals) { const cm = crystalMesh(); cm.obj.position.set(...c.pos); scene.add(cm.obj); ents.push({ kind: 'crystal', inst: cm, data: c, pos: c.pos }); }
  for (const h of W.homes) { const hm = homeMesh(); hm.obj.position.set(...h.pos); scene.add(hm.obj); ents.push({ kind: 'home', inst: hm, data: h, pos: h.pos }); }
  for (const ch of W.chests) { const inst = make('dungeon/chest').fit(0.8); inst.obj.position.set(...ch.pos); inst.obj.rotation.y = Math.PI * rnd(ch.pos[0], 2); scene.add(inst.obj); ents.push({ kind: 'chest', inst, data: ch, pos: ch.pos }); }
  for (const sp of W.spawns) spawnMonster(sp);
}
const rnd = (a, b) => ((Math.sin(a * 12.9898 + b * 78.233) * 43758.5453) % 1 + 1) % 1;
function spawnMonster(sp) {
  const m = MONSTERS[sp.monster], inst = make(m.model, { color: m.color });
  inst.obj.position.set(...sp.pos);
  if (m.model.startsWith('vox:')) inst.obj.scale.setScalar(m.boss ? 1.8 : 1); else inst.fit(m.boss ? 3.4 : m.model.startsWith('pets/') ? 1.1 : 1.75);
  scene.add(inst.obj);
  ents.push({ kind: 'monster', inst, data: sp, pos: [...sp.pos], home: [...sp.pos], vel: [0, 0], t: Math.random() * 5, stun: 0, vy: 0 });
}
function refreshEnts() {
  for (const e of ents) {
    if (e.kind === 'chest') e.inst.obj.visible = !S.chests[e.data.id];
    if (e.kind === 'crystal') e.inst.obj.visible = !S.crystals.includes(e.data.job);
    if (e.kind === 'monster') e.inst.obj.visible = !beatenNow(e.data);
    if (e.kind === 'gate') e.obj.visible = !S.flags.spireOpen;
    if (e.kind === 'boss') e.inst.obj.visible = !S.beaten[e.data.id];
  }
}
// ordinary monsters come back three minutes after you beat them; bosses stay beaten
const beatenNow = (d) => { const b = S.beaten[d.id]; if (!b) return false; if (d.boss) return true; return S.time - b < 180; };

// ---------- the player ----------
function makePlayer() {
  if (player) scene.remove(player.obj);
  player = make(HEROES[S.members[0].id].model).fit(1.75);
  scene.add(player.obj);
}
const PW = 0.3, PH = 1.7;
// water counts as a wall: you cannot wade into it
function blockedAt(x, y, z) {
  for (const bx of [Math.floor(x - PW), Math.floor(x + PW)]) for (const bz of [Math.floor(z - PW), Math.floor(z + PW)]) for (let by = Math.floor(y + 0.01); by <= Math.floor(y + PH - 0.01); by++) {
    const id = get(bx, by, bz); if (solid(id) || id === B.water) return true;
    if (gateBlocks(bx, by, bz)) return true;
  }
  return false;
}
function gateBlocks(bx, by, bz) {
  if (S.flags.spireOpen) return false;
  const gx = SPIRE.x + 5, gz = SPIRE.z;
  return Math.abs(bx - gx) <= 1 && Math.abs(bz - gz) <= 1 && by >= SPIRE.base + 1 && by <= SPIRE.base + 3;
}
function jumpSpeed() { return S.inv.boots ? 12.1 : 10.0; }
function movePlayer(dt) {
  const sp = (input.held('run') ? 7.2 : 5.0) * dt;
  // stick and keys move relative to the camera
  const mx = input.move.x, mz = input.move.z;
  const sin = Math.sin(cam.yaw), cos = Math.cos(cam.yaw);
  let dx = (mx * cos + mz * sin) * sp, dz = (-mx * sin + mz * cos) * sp;
  const moving = Math.hypot(dx, dz) > 0.0001;
  if (moving) P.yaw = Math.atan2(dx, dz);
  // across, with a one-block step up when walking into a ledge
  for (const [ax, az] of [[dx, 0], [0, dz]]) {
    if (!ax && !az) continue;
    if (!blockedAt(P.x + ax, P.y, P.z + az)) { P.x += ax; P.z += az; continue; }
    if (P.ground && !blockedAt(P.x + ax, P.y + 1.01, P.z + az) && !blockedAt(P.x, P.y + 1.01, P.z)) { P.y += 1.01; P.x += ax; P.z += az; }
  }
  // gravity, jumping and gliding
  if (P.ground && input.pressed('jump')) { P.vy = jumpSpeed(); P.ground = false; sfx('jump'); }
  P.vy -= 24 * dt;
  if (!P.ground && P.vy < 0 && S.inv.cape && input.held('jump')) P.vy = Math.max(P.vy, -2.4);
  const ny = P.y + P.vy * dt;
  if (blockedAt(P.x, ny, P.z)) { if (P.vy < 0) { P.y = Math.floor(ny) + 1; if (!P.ground && P.vy < -9) sfx('land'); P.ground = true; } P.vy = 0; }
  else { P.y = ny; P.ground = false; }
  // fell into the water or out of the world: back to the last safe spot
  if (get(Math.floor(P.x), Math.floor(P.y + 0.2), Math.floor(P.z)) === B.water || P.y < 0) { [P.x, P.y, P.z] = P.safe; P.vy = 0; toast(L('掉進水裡了！', 'Splash! Back to dry land.'), 1400); sfx('cancel'); }
  else if (P.ground && get(Math.floor(P.x), Math.floor(P.y - 1), Math.floor(P.z)) !== B.water) P.safe = [P.x, P.y, P.z];
  player.obj.position.set(P.x, P.y, P.z);
  player.obj.rotation.y = P.yaw;
  player.play(!P.ground ? 'jump' : moving ? (input.held('run') ? 'sprint' : 'walk') : 'idle');
  if (moving && P.ground && Math.floor(S.time * 4) % 2 === 0 && Math.random() < 0.08) sfx('step');
}
function updateCamera(dt, instant = false) {
  cam.yaw += input.look; cam.dist = Math.max(5, Math.min(16, cam.dist + input.zoom * 0.8));
  const tx = P.x, ty = P.y + 1.4, tz = P.z;
  let d = cam.dist, cx, cy, cz;
  // pull in if the camera would end up inside a hill
  for (; d > 2; d -= 0.5) { cx = tx - Math.sin(cam.yaw) * Math.cos(cam.pitch) * d; cz = tz - Math.cos(cam.yaw) * Math.cos(cam.pitch) * d; cy = ty + Math.sin(cam.pitch) * d; const cb = get(Math.floor(cx), Math.floor(cy), Math.floor(cz)); if (!solid(cb) || cb === B.leaves || cb === B.orange) break; }
  const k = instant ? 1 : Math.min(1, dt * 8);
  camera.position.x += (cx - camera.position.x) * k; camera.position.y += (cy - camera.position.y) * k; camera.position.z += (cz - camera.position.z) * k;
  camera.lookAt(tx, ty, tz);
}

// ---------- things to touch ----------
const dist3 = (a, x, y, z) => Math.hypot(a[0] - x, (a[1] - y) * 0.6, a[2] - z);
let near = null;
function updateWorldEnts(dt) {
  const t = S.time;
  near = null; let nd = 1.9;
  for (const e of ents) {
    if (e.inst && e.inst.update) e.inst.update(dt, t);
    if (e.kind === 'monster') { updateMonster(e, dt); continue; }
    if (e.kind === 'boss') { if (S.beaten[e.data.id]) continue; const d = dist3(e.pos, P.x, P.y, P.z); if (d < 3) { startEncounter(e); return; } continue; }
    if (e.kind === 'crystal') { if (S.crystals.includes(e.data.job)) continue; if (dist3(e.pos, P.x, P.y + 0.8, P.z) < 1.3) { run(() => SCRIPTS.crystal(e.data)).then(refreshEnts); return; } continue; }
    if (e.kind === 'gate' && !S.flags.spireOpen) { if (dist3(e.pos, P.x, P.y, P.z) < 2.4) { const d = e; e.cool = (e.cool || 0) - dt; if (e.cool <= 0) { e.cool = 3; run(() => SCRIPTS.gate(d.data)).then(refreshEnts); return; } } continue; }
    if (e.kind === 'chest' && S.chests[e.data.id]) continue;
    if (['npc', 'chest', 'home'].includes(e.kind)) { const d = dist3(e.pos, P.x, P.y, P.z); if (d < nd) { nd = d; near = e; } }
  }
  prompt(near ? (near.kind === 'npc' ? L('E：對話', 'E: Talk') : near.kind === 'chest' ? L('E：打開', 'E: Open') : L('E：觸摸家石', 'E: Touch the stone')) : null);
  if (near && input.pressed('a')) interact(near);
}
async function interact(e) {
  if (e.kind === 'npc') { if (e.inst) e.inst.obj.lookAt(P.x, e.pos[1], P.z); await run(() => (SCRIPTS[e.data.talk] || (() => say(null, '……')))(e.data, ctx)); }
  if (e.kind === 'chest') { S.chests[e.data.id] = true; refreshEnts(); await run(() => SCRIPTS.chest(e.data)); }
  if (e.kind === 'home') await run(() => SCRIPTS.home(e.data, ctx));
}
let busy = false;
async function run(fn) { busy = true; prompt(null); try { await fn(); } catch (err) { console.error(err); } busy = false; }
// what menus and scripts need from here
const ctx = {
  savePos() { S.pos = [P.x, P.y, P.z]; S.yaw = cam.yaw; },
  save: () => { ctx.savePos(); return save(); },
  playerPos: () => [P.x, P.y, P.z],
  inTown: () => !!REGIONS[regionAt(P.x, P.z)].town,
  async rest() { await fade(true); fullHeal(); sfx('heal'); await wait(600); await fade(false); toast(L('大家都休息好了。', 'Everyone is rested.')); },
  async warp(pos) { sfx('warp'); await fade(true); P.x = pos[0]; P.y = pos[1] + 0.1; P.z = pos[2] + 1.2; P.vy = 0; P.safe = [P.x, P.y, P.z]; updateCamera(0, true); await fade(false); },
};

// ---------- monsters on the field ----------
function updateMonster(e, dt) {
  if (beatenNow(e.data)) { e.inst.obj.visible = false; return; }
  e.inst.obj.visible = true;
  e.t -= dt; if (e.stun > 0) e.stun -= dt;
  const p = e.pos, dx = P.x - p[0], dz = P.z - p[2], d = Math.hypot(dx, dz), dy = Math.abs(P.y - p[1]);
  const m = MONSTERS[e.data.monster];
  let vx = 0, vz = 0;
  if (e.stun <= 0 && P.inv <= 0 && d < 7 && dy < 2.5 && !UI.active && !busy) { vx = dx / d * 3.1; vz = dz / d * 3.1; }
  else { if (e.t <= 0) { e.t = 2 + Math.random() * 3; const a = Math.random() * Math.PI * 2, back = Math.hypot(e.home[0] - p[0], e.home[2] - p[2]) > 5; e.vel = back ? [(e.home[0] - p[0]) * 0.3, (e.home[2] - p[2]) * 0.3] : Math.random() < 0.4 ? [0, 0] : [Math.cos(a) * 1.2, Math.sin(a) * 1.2]; } [vx, vz] = e.vel; }
  // stay on land that is not too steep
  const nx = p[0] + vx * dt, nz = p[2] + vz * dt, gy = ground(nx, nz);
  if (Math.abs(gy - p[1]) <= 1.05 && get(Math.floor(nx), gy - 1, Math.floor(nz)) !== B.water && gy > SEA + 1) { p[0] = nx; p[2] = nz; p[1] = gy; }
  e.inst.obj.position.set(p[0], p[1], p[2]);
  if (vx || vz) e.inst.obj.rotation.y = Math.atan2(vx, vz);
  e.inst.play(vx || vz ? 'walk' : 'idle');
  if (d < 1.0 && dy < 1.6 && P.inv <= 0 && e.stun <= 0 && !m.boss) startEncounter(e);
  else if (m.boss && d < 3 && dy < 3) startEncounter(e);
}
// a fight: the one you touched and maybe a friend or two from the same land
async function startEncounter(e) {
  if (busy || UI.active) return;
  busy = true; prompt(null);
  const m = MONSTERS[e.data.monster], boss = !!m.boss || e.kind === 'boss';
  const id = e.data.monster;
  let group = [id];
  if (!boss) { const pool = W.spawns.filter((s) => regionAt(s.pos[0], s.pos[2]) === regionAt(P.x, P.z) && !MONSTERS[s.monster].boss).map((s) => s.monster); const extra = Math.random() < 0.55 ? 1 + (Math.random() < 0.35 ? 1 : 0) : 0; for (let k = 0; k < extra; k++) group.push(pool[Math.floor(Math.random() * pool.length)] || id); }
  if (boss) await SCRIPTS.bossIntro(id);
  sfx('encounter');
  await fade(true);
  mode = 'battle';
  $('hud').style.display = 'none'; $('touch').style.visibility = 'hidden';
  await fade(false);
  const r = await startBattle(group, { boss, bg: REGIONS[regionAt(P.x, P.z)].bg });
  await fade(true);
  mode = 'field'; $('hud').style.display = ''; $('touch').style.visibility = '';
  if (r === 'lose') { await gameOver(); busy = false; return; }
  if (r === 'win') { S.beaten[e.data.id] = boss ? true : S.time; refreshEnts(); }
  else e.stun = 3;
  P.inv = 2.5;
  playMusic(REGIONS[P.region || 'meadow'].music);
  await fade(false);
  if (r === 'win' && boss) {
    if (id === 'prismheart') { await theEnd(); busy = false; return; }
    await SCRIPTS.bossAfter(id);
  }
  busy = false;
}
async function gameOver() {
  jingle('gameover');
  await say(null, L('全員倒下了……\n在最後碰過的家石醒了過來。（失去一半的金幣）', 'Everyone has fallen...\nYou wake at the last home stone you touched. (Lost half your gold.)'));
  S.gold = Math.floor(S.gold / 2); fullHeal();
  const h = W.homes.find((x) => x.id === S.homes[S.homes.length - 1]) || W.homes[0];
  P.x = h.pos[0]; P.y = h.pos[1] + 0.1; P.z = h.pos[2] + 1.2; P.vy = 0; updateCamera(0, true);
  await fade(false);
}

// ---------- the minimap and the HUD ----------
const mini = $('mini').getContext('2d');
let colourMap = null;
function buildColourMap() {
  const c = new Uint8ClampedArray(WX * WZ * 4);
  const COL = { [B.grass]: [96, 176, 72], [B.sand]: [232, 214, 160], [B.redsand]: [208, 112, 64], [B.redstone]: [168, 80, 56], [B.snow]: [236, 244, 252], [B.stone]: [140, 146, 160], [B.gravel]: [150, 150, 150], [B.cobble]: [120, 120, 130], [B.leaves]: [56, 130, 56], [B.orange]: [220, 130, 50], [B.brick]: [150, 150, 160], [B.crystal]: [150, 230, 255], [B.ice]: [190, 230, 250], [B.plank]: [180, 120, 80], [B.wood]: [110, 80, 50], [B.birch]: [220, 220, 200] };
  for (let z = 0; z < WZ; z++) for (let x = 0; x < WX; x++) { const y = ground(x, z) - 1, id = get(x, y, z), col = y < SEA ? [60, 120, 220] : COL[id] || [110, 160, 90], s = 0.7 + Math.min(1, y / 40) * 0.45; c.set([col[0] * s, col[1] * s, col[2] * s, 255], (z * WX + x) * 4); }
  colourMap = new ImageData(c, WX, WZ);
}
const miniCanvas = document.createElement('canvas'); miniCanvas.width = WX; miniCanvas.height = WZ;
function drawMinimap() {
  if (!colourMap) { buildColourMap(); miniCanvas.getContext('2d').putImageData(colourMap, 0, 0); }
  const s = 3, R = 60;
  mini.save(); mini.fillStyle = '#0a1020'; mini.fillRect(0, 0, 120, 120);
  mini.translate(60, 60); mini.rotate(-cam.yaw + Math.PI);
  mini.imageSmoothingEnabled = false;
  mini.drawImage(miniCanvas, P.x - R / s, P.z - R / s, (R * 2) / s, (R * 2) / s, -R, -R, R * 2, R * 2);
  for (const e of ents) {
    if (!(e.inst && e.inst.obj.visible) && e.kind !== 'gate') continue;
    const x = (e.pos[0] - P.x) * s, z = (e.pos[2] - P.z) * s;
    if (Math.abs(x) > R || Math.abs(z) > R) continue;
    mini.fillStyle = { monster: '#ff5060', npc: '#ffffff', chest: '#ffe27a', home: '#7ab8ff', crystal: '#9ff0ff', boss: '#ff2030' }[e.kind] || null;
    if (!mini.fillStyle || e.kind === 'gate') continue;
    mini.fillRect(x - 2, z - 2, 4, 4);
  }
  // the compass points at the nearest crystal still to find
  if (S.inv.compass) {
    let best = null, bd = Infinity; for (const c of W.crystals) if (!S.crystals.includes(c.job)) { const d = Math.hypot(c.pos[0] - P.x, c.pos[2] - P.z); if (d < bd) { bd = d; best = c; } }
    if (best) { const a = Math.atan2(best.pos[2] - P.z, best.pos[0] - P.x); mini.fillStyle = '#9ff0ff'; mini.beginPath(); mini.arc(Math.cos(a) * 52, Math.sin(a) * 52, 4, 0, Math.PI * 2); mini.fill(); }
  }
  mini.restore();
  mini.fillStyle = '#ff3050'; mini.beginPath(); mini.moveTo(60, 53); mini.lineTo(55, 65); mini.lineTo(65, 65); mini.fill();
  $('crystals').textContent = `◆ ${S.crystals.length} / 8`;
}
function updateRegion() {
  const r = regionAt(P.x, P.z);
  if (r !== P.region) { P.region = r; areaName(REGIONS[r].name[LANG === 'en' ? 1 : 0]); playMusic(REGIONS[r].music); const dark = r === 'forest' ? 0x6a9a7a : r === 'spire' ? 0x9a90d0 : r === 'mesa' ? 0xf0c098 : r === 'mountain' ? 0xc8d4e8 : 0x9ad4f8; scene.background.set(dark); scene.fog.color.set(dark); }
}

// ---------- title, opening, ending ----------
function showTitle() {
  mode = 'title'; $('hud').style.visibility = 'hidden';
  P.x = 96; P.z = 150; P.y = ground(96, 150) + 6;
  const t = $('title');
  const opts = () => [{ id: 'new', label: L('新的旅程', 'New Journey') }, { id: 'cont', label: L('繼續旅程', 'Continue'), off: !hasSave() }, { id: 'lang', label: LANG === 'en' ? 'Language: English' : '語言：中文' }];
  let sel = hasSave() ? 1 : 0;
  const draw = () => {
    t.innerHTML = `<div class="logo">${L('晶境漫遊', 'PRISMWANDER')}</div><div class="sub">${L('PRISMWANDER', '晶境漫遊')}</div>` +
      `<div class="panel opts">${opts().map((o, i) => `<div class="opt${i === sel ? ' sel' : ''}${o.off ? ' off' : ''}" data-i="${i}">${o.label}</div>`).join('')}</div>` +
      `<div class="hint">${L('WASD 移動・空白鍵 跳躍・滑鼠拖曳轉視角・E 調查・Esc 選單・M 音樂開關', 'WASD move · Space jump · drag to turn · E look · Esc menu · M music on/off')}<br>${L('© 2026 原創作品・模型 Kenney (CC0)・音樂 Ninja Adventure (CC0)', '© 2026 an original game · models by Kenney (CC0) · music from Ninja Adventure (CC0)')}</div>`;
    t.classList.add('on');
  };
  t.onclick = (e) => { const o = e.target.closest('.opt'); if (o) { sel = +o.dataset.i; choose(); } initAudio(); };
  const choose = () => { const o = opts()[sel]; if (o.off) { sfx('buzz'); return; } sfx('ok'); initAudio(); if (o.id === 'lang') { setLang(LANG === 'en' ? 'zh' : 'en'); draw(); return; } t.classList.remove('on'); titleKeys = null; if (o.id === 'new') newGame(); else continueGame(); };
  titleKeys = () => { if (input.pressed('down')) { sel = (sel + 1) % 3; sfx('cursor'); draw(); } if (input.pressed('up')) { sel = (sel + 2) % 3; sfx('cursor'); draw(); } if (input.pressed('a') || input.pressed('jump')) choose(); };
  playMusic('title');
  draw();
}
let titleKeys = null;
async function newGame() {
  $('title').classList.remove('on'); titleKeys = null; $('hud').style.visibility = '';
  await fade(true);
  newParty(); makePlayer();
  // start in the square, the camera to the north looking down the village street
  P.x = 96.5; P.z = 163.5; P.y = ground(96, 163); P.vy = 0; P.safe = [P.x, P.y, P.z]; P.region = ''; cam.yaw = 0; P.yaw = Math.PI;
  refreshEnts(); updateCamera(0, true); mode = 'field';
  await fade(false);
  await run(() => SCRIPTS.intro());
}
async function continueGame() {
  $('title').classList.remove('on'); titleKeys = null; $('hud').style.visibility = '';
  await fade(true);
  if (!load()) { await fade(false); showTitle(); return; }
  makePlayer();
  [P.x, P.y, P.z] = S.pos || [96.5, ground(96, 166), 166.5]; P.vy = 0; P.safe = [P.x, P.y, P.z]; P.region = ''; cam.yaw = S.yaw || Math.PI;
  if (S.flags.spireOpen) { /* the gate stays open */ }
  refreshEnts(); updateCamera(0, true); mode = 'field';
  await fade(false);
}
async function theEnd() {
  await SCRIPTS.ending();
  S.flags.cleared = true; ctx.savePos(); save();
  await fade(true);
  playMusic('ending');
  const t = $('title');
  const lines = L(`晶境漫遊\n\n— 旅人 —\n洛　芙蘿　巴爾　希雅\n\n奧森長老與爐心村的人們\n沙泉鎮、霜門村的旅人們\n\n— 守護者 —\n古樹守衛　台地之王\n冰霜飛龍　稜晶之心\n\n3D 模型：Kenney (CC0)\n方塊材質：Kenney Voxel Pack (CC0)\n音樂：Ninja Adventure — Pixel-boy & AAA (CC0)\n字型：俐方體11號\n\n故事、世界與程式：原創作品\n\n稜晶的光回到了大地。\n漫遊之年，還沒有結束。\n\n感謝你的遊玩！`,
    `PRISMWANDER\n\n- TRAVELLERS -\nLowe   Flora   Bal   Shia\n\nElder Ozen and the people of Hearthvale\nand the travellers of Dunewell and Frostgate\n\n- GUARDIANS -\nElder Treant   Mesa King\nFrost Wyrm   The Prism Heart\n\n3D models: Kenney (CC0)\nBlock textures: Kenney Voxel Pack (CC0)\nMusic: Ninja Adventure by Pixel-boy & AAA (CC0)\nFont: Cubic 11\n\nStory, world and code: an original game\n\nThe light of the Prism returns to the land.\nAnd the wandering year is not over yet.\n\nTHANK YOU FOR PLAYING!`);
  t.innerHTML = `<div class="panel" style="padding:24px 30px;font-size:17px;line-height:1.8;text-align:center;white-space:pre-line;max-height:80vh;overflow:hidden"><div id="roll" style="transition:transform 40s linear">${lines}</div></div><div class="hint">${L('按 E 回到標題', 'Press E to return to the title')}</div>`;
  t.classList.add('on'); mode = 'credits';
  await fade(false);
  requestAnimationFrame(() => { const r = $('roll'); if (r) r.style.transform = 'translateY(-55%)'; });
}

// ---------- the loop ----------
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  pollInput();
  if (UI.active) uiUpdate();
  if (mode === 'title') {
    if (titleKeys) titleKeys();
    cam.yaw += dt * 0.05; const tx = 96, tz = 130;
    camera.position.set(tx + Math.sin(cam.yaw) * 60, 46, tz + Math.cos(cam.yaw) * 60); camera.lookAt(tx, 14, tz - 20);
    renderer.render(scene, camera);
    for (const e of ents) if (e.inst && e.inst.update) e.inst.update(dt, now / 1000);
  } else if (mode === 'field') {
    S.time += dt; if (P.inv > 0) P.inv -= dt;
    if (!UI.active && !busy) {
      movePlayer(dt);
      if (input.pressed('menu')) { prompt(null); busy = true; fieldMenu(ctx).then(() => { busy = false; refreshEnts(); }); }
    } else player.play('idle');
    player.update(dt);
    updateCamera(dt); updateRegion();
    if (!UI.active && !busy) updateWorldEnts(dt); else for (const e of ents) if (e.inst && e.inst.update) e.inst.update(dt, S.time);
    renderer.render(scene, camera);
    drawMinimap();
  } else if (mode === 'battle') {
    battleTick();
    battleRender(renderer, dt);
  } else if (mode === 'credits') {
    renderer.render(scene, camera);
    if (input.pressed('a')) { $('title').classList.remove('on'); showTitle(); }
  }
  endInput();
  requestAnimationFrame(frame);
}
addEventListener('keydown', initAudio); addEventListener('pointerdown', initAudio);
// the music switch: the round button at the top and the M key
{ const mb = $('musicBtn'); mb.classList.toggle('off', !music.on); mb.addEventListener('click', (e) => { e.stopPropagation(); initAudio(); setMusic(!music.on); }); mb.addEventListener('pointerdown', (e) => e.stopPropagation()); }
addEventListener('keydown', (e) => { if (e.code === 'KeyM' && !e.repeat) setMusic(!music.on); });
onLang(() => { if (mode === 'title') showTitle(); });
boot();
// hooks for automated checks
Object.defineProperty(G, 'mode', { get: () => mode });
G.world = { get, ground, solid, WX, WZ, WY, SEA, B, regionAt };
Object.assign(G, { P, cam, ents, ctx, startEncounter, refreshEnts, newGame, setMode: (m) => { mode = m; }, ITEMS, inBattle, WY, homeName, rebuildChunkAt });
