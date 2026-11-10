// 晶境漫遊 Prismwander: boot, the 3D world streamed in chunks around you, day and night, walking and jumping,
// the camera, everything you can touch, roaming monsters, the minimap, the title, the opening and the ending.
import * as THREE from 'three';
import { generate, buildChunk, setAtlas, W, WX, WZ, WY, SEA, CHUNK, get, solid, seeThrough, B, regionAt, REGIONS, ground, SPIRE, NIGHT, EIN_STEPS } from './world.js';
import { preload, make, crystalMesh, homeMesh, instanced, shardMesh, signMesh, herbMesh, rippleMesh } from './models.js';
import { input, setupInput, pollInput, endInput } from './input.js';
import { initAudio, playMusic, sfx, jingle, music, setMusic } from './audio.js';
import { UI, uiUpdate, say, toast, areaName, prompt, fade, wait } from './ui.js';
import { S, newParty, fullHeal, save, load, hasSave } from './party.js';
import { HEROES, MONSTERS, ITEMS } from './data.js';
import { startBattle, battleRender, battleTick, inBattle, setBattleAtlas } from './battle.js';
import { fieldMenu, loadSettings, homeName, MAPCOL } from './menu.js';
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
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
const VIEW = 150;                       // how far the land is drawn
scene.background = new THREE.Color(0x9ad4f8);
scene.fog = new THREE.Fog(0x9ad4f8, 60, VIEW);
const hemi = new THREE.HemisphereLight(0xdcefff, 0x6a5a48, 1.25); scene.add(hemi);
// a warm sun (a cool moon at night) whose shadow box follows the player
const sun = new THREE.DirectionalLight(0xfff0d8, 2.4); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -40, right: 40, top: 40, bottom: -40, near: 1, far: 200 }); sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.04;
scene.add(sun); scene.add(sun.target);
// a lantern the party carries; it only shows at night
const lantern = new THREE.PointLight(0xffc880, 0, 13, 1.4); scene.add(lantern);
// the sky: a dome with a gradient from overhead to the horizon, following the camera
const skyMat = new THREE.ShaderMaterial({
  uniforms: { top: { value: new THREE.Color() }, horizon: { value: new THREE.Color() } }, side: THREE.BackSide, depthWrite: false, fog: false,
  vertexShader: 'varying vec3 vp; void main(){ vp = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: 'uniform vec3 top; uniform vec3 horizon; varying vec3 vp; void main(){ float h = clamp(normalize(vp).y, 0.0, 1.0); gl_FragColor = vec4(mix(horizon, top, pow(h, 0.55)), 1.0); }',
});
const sky = new THREE.Mesh(new THREE.SphereGeometry(VIEW + 60, 24, 12), skyMat); sky.frustumCulled = false; sky.renderOrder = -1; scene.add(sky);
const SKIES = { default: ['#3d7fd8', '#cfe8f8'], forest: ['#2f6a5a', '#b8d8c0'], mesa: ['#c86a48', '#f8dcc0'], mountain: ['#5a78b0', '#e8eef8'], spire: ['#3a2a7a', '#d8c8f0'], marsh: ['#4a5a60', '#b8c4b8'], spore: ['#5a3e8a', '#e0c8f0'], ember: ['#6a2a20', '#f0a070'], ruins: ['#56607a', '#d8d8d0'] };
let skyKind = 'default';
const C = (h) => new THREE.Color(h);
const NIGHT_TOP = C('#070d24'), NIGHT_HOR = C('#22325a'), DUSK = C('#f2a068');
const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, VIEW + 160);
function resize() { renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();
setupInput(canvas);

const G = (window.G = { S, W, scene: 'boot' });
let mode = 'boot';
const ents = [];      // { kind, inst, data, pos, ... }
let player = null;
const P = { x: 216.5, y: 12, z: 378.5, vy: 0, ground: false, yaw: Math.PI, safe: [216.5, 12, 378.5], inv: 0, region: '' };
const cam = { yaw: 0, dist: 12.5, pitch: 0.55 };

// ---------- time of day ----------
// one day lasts eight minutes; the clock runs from 0 (midnight) through 0.5 (noon)
const DAY = 480;
let daylight = 1;
const isNight = () => daylight < 0.35;
function updateSky(dt) {
  if (mode === 'field') S.clock = (S.clock + dt / DAY) % 1;
  const c = mode === 'title' ? 0.42 : S.clock, a = (c - 0.25) * Math.PI * 2, h = Math.sin(a);
  daylight = Math.min(1, Math.max(0, (h + 0.18) / 0.4)); daylight = daylight * daylight * (3 - 2 * daylight);
  const [t, hz] = SKIES[skyKind] || SKIES.default, dusk = Math.max(0, 1 - Math.abs(h) / 0.32) * 0.55;
  const top = NIGHT_TOP.clone().lerp(C(t), daylight), hor = NIGHT_HOR.clone().lerp(C(hz), daylight).lerp(DUSK, dusk);
  skyMat.uniforms.top.value.copy(top); skyMat.uniforms.horizon.value.copy(hor);
  scene.fog.color.copy(hor); scene.background.copy(hor);
  hemi.intensity = 0.42 + 0.83 * daylight; sun.intensity = 0.4 + 2.0 * daylight;
  sun.color.copy(C('#8ea6ff').lerp(C('#fff0d8'), daylight).lerp(C('#ffb070'), dusk * 0.6));
  // the sun crosses the sky by day; at night the moon stands opposite
  const s = h >= 0 ? 1 : -1;
  sun.position.set(P.x - Math.cos(a) * 45 * s, P.y + 22 + Math.abs(h) * 48, P.z + 22); sun.target.position.set(P.x, P.y, P.z);
  lantern.intensity = (1 - daylight) * 2.2; lantern.position.set(P.x, P.y + 2.4, P.z);
  if (G.water) G.water.material.color.copy(C('#123a78').lerp(C('#2f7fd8'), daylight));
  S.flags.night = isNight();
}

// ---------- the land, built in chunks around you ----------
let blockMat = null;
const chunks = new Map();
const NCX = Math.ceil(WX / CHUNK), NCZ = Math.ceil(WZ / CHUNK), CR = Math.ceil(VIEW / CHUNK) + 1;
// the chunks around you, nearest first
const OFFS = []; for (let dz = -CR; dz <= CR; dz++) for (let dx = -CR; dx <= CR; dx++) if (Math.hypot(dx, dz) <= CR) OFFS.push([dx, dz]); OFFS.sort((a, b) => Math.hypot(...a) - Math.hypot(...b));
function updateChunks(fx, fz, budgetMs = 6) {
  const pcx = Math.floor(fx / CHUNK), pcz = Math.floor(fz / CHUNK), t0 = performance.now();
  for (const [dx, dz] of OFFS) {
    const cx = pcx + dx, cz = pcz + dz;
    if (cx < 0 || cz < 0 || cx >= NCX || cz >= NCZ) continue;
    const k = cx + ',' + cz;
    if (chunks.has(k)) continue;
    const m = new THREE.Mesh(buildChunk(cx, cz), blockMat); m.userData.chunk = [cx, cz]; m.castShadow = true; m.receiveShadow = true; scene.add(m); chunks.set(k, m);
    if (performance.now() - t0 > budgetMs) break;
  }
  // let go of chunks well behind you
  for (const [k, m] of chunks) { const [cx, cz] = m.userData.chunk; if (Math.hypot(cx - pcx, cz - pcz) > CR + 2) { scene.remove(m); m.geometry.dispose(); chunks.delete(k); } }
}
function rebuildChunkAt(x, z) { const k = Math.floor(x / CHUNK) + ',' + Math.floor(z / CHUNK), m = chunks.get(k); if (m) { m.geometry.dispose(); m.geometry = buildChunk(...m.userData.chunk); } }
// trees, rocks and props: one instanced mesh per model per patch of land, shown when near
const DECOR_CELL = 72, decorCells = [];
function buildDecor() {
  const cells = new Map();
  for (const d of W.decor) { const k = Math.floor(d.pos[0] / DECOR_CELL) + ',' + Math.floor(d.pos[2] / DECOR_CELL); if (!cells.has(k)) cells.set(k, new Map()); const c = cells.get(k); if (!c.has(d.model)) c.set(d.model, []); c.get(d.model).push(d); }
  for (const [k, byModel] of cells) {
    const g = new THREE.Group(), [cx, cz] = k.split(',').map(Number);
    for (const [model, list] of byModel) g.add(instanced(model, list));
    g.userData.c = [(cx + 0.5) * DECOR_CELL, (cz + 0.5) * DECOR_CELL]; scene.add(g); decorCells.push(g);
  }
}

async function boot() {
  try { await document.fonts.load('16px Cubic11'); } catch (e) { /* fall back */ }
  const info = await (await fetch('assets/tex/blocks.json')).json();
  const tex = await new THREE.TextureLoader().loadAsync('assets/tex/blocks.png');
  tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.NearestFilter; tex.colorSpace = THREE.SRGBColorSpace; tex.generateMipmaps = false;
  setAtlas(info); setBattleAtlas(tex, info);
  generate();
  blockMat = new THREE.MeshLambertMaterial({ map: tex, vertexColors: true });
  const water = new THREE.Mesh(new THREE.PlaneGeometry(WX * 3, WZ * 3), new THREE.MeshPhongMaterial({ color: 0x2f7fd8, specular: 0x9fd8ff, shininess: 60, transparent: true, opacity: 0.78 }));
  water.receiveShadow = true; G.water = water;
  water.rotation.x = -Math.PI / 2; water.position.set(WX / 2, SEA + 0.82, WZ / 2); scene.add(water);
  const models = new Set(Object.values(HEROES).map((h) => h.model));
  for (const e of W.ents) if (e.model) models.add(e.model);
  for (const d of W.decor) models.add(d.model);
  models.add('hex/cloud_big.gltf'); models.add('hex/cloud_small.gltf'); models.add('kaykit/Rogue');
  for (const m of Object.values(MONSTERS)) if (!m.model.startsWith('vox:')) models.add(m.model);
  models.add('dungeon/chest');
  await preload([...models]);
  buildEnts(); buildDecor();
  updateChunks(216, 330, Infinity);
  $('loading').style.display = 'none';
  showTitle();
  requestAnimationFrame(frame);
  window.READY = 1;
}

// ---------- what lives in the world ----------
const add = (kind, inst, data, pos, extra = {}) => { inst.obj.position.set(...pos); scene.add(inst.obj); const e = { kind, inst, data, pos, ...extra }; ents.push(e); return e; };
let einEnt = null;
function buildEnts() {
  for (const e of W.ents) {
    if (e.type === 'npc' || e.type === 'prop') { const inst = make(e.model); if (inst.fit) inst.fit(e.type === 'npc' ? 1.75 : 1.6); inst.obj.rotation.y = [0, Math.PI / 2, Math.PI, -Math.PI / 2][e.face || 0]; add(e.type, inst, e, e.pos); }
    if (e.type === 'gate') {
      const g = new THREE.Mesh(new THREE.BoxGeometry(3, 3, 0.3), new THREE.MeshLambertMaterial({ color: 0x9ae8ff, emissive: 0x2050a0, transparent: true, opacity: 0.75 }));
      g.rotation.y = Math.PI / 2; g.position.set(e.pos[0], e.pos[1] + 1.5, e.pos[2]); scene.add(g); ents.push({ kind: 'gate', obj: g, data: e, pos: e.pos });
    }
    if (e.type === 'boss') { const m = MONSTERS[e.monster], inst = make(m.model, { color: m.color }); inst.obj.scale.setScalar(1.8); add('boss', inst, { ...e, boss: true }, e.pos); }
  }
  for (const c of W.crystals) add('crystal', crystalMesh(), c, c.pos);
  for (const h of W.homes) add('home', homeMesh(), h, h.pos);
  for (const ch of W.chests) { const inst = make('dungeon/chest').fit(0.8); inst.obj.rotation.y = Math.PI * rnd(ch.pos[0], 2); add('chest', inst, ch, ch.pos); }
  for (const s of W.shards) add('shard', shardMesh(), s, s.pos);
  for (const s of W.signs) { const m = signMesh(); m.obj.rotation.y = s.rot; add('sign', m, s, s.pos); }
  for (const h of W.herbs) add('herb', herbMesh(h.kind), h, h.pos);
  for (const f of W.fish) { const r = rippleMesh(); add('fish', r, f, f.pos); r.obj.position.set(f.water[0], SEA + 0.9, f.water[1]); if (f.kind === 'oasis') r.obj.position.y = 12.9; }
  // the cloaked traveller: one figure who turns up in a new place as your journey goes on
  { const inst = make('kaykit/Rogue').fit(1.75); einEnt = add('ein', inst, { id: 'ein', talk: 'ein' }, [...W.ein[0]]); }
  for (const sp of W.spawns) ents.push({ kind: 'monster', inst: null, data: sp, pos: [...sp.pos], home: [...sp.pos], vel: [0, 0], t: Math.random() * 5, stun: 0 });
  // clouds drifting high over the land
  for (let k = 0; k < 70; k++) { const c = make(k % 3 ? 'hex/cloud_small.gltf' : 'hex/cloud_big.gltf'); c.fit(3 + (k % 4)); c.obj.scale.multiplyScalar(2.4); c.obj.position.set(rnd(k, 7) * WX, 80 + rnd(k, 8) * 10, rnd(k, 9) * WZ); c.obj.traverse((o) => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; o.material.emissive = new THREE.Color(0x8890a0); o.material.fog = false; } }); scene.add(c.obj); clouds.push(c.obj); }
}
const clouds = [];
const rnd = (a, b) => ((Math.sin(a * 12.9898 + b * 78.233) * 43758.5453) % 1 + 1) % 1;
// monsters only get a model when you come near them
function monsterInst(e) {
  if (e.inst) return e.inst;
  const m = MONSTERS[e.data.monster], inst = make(m.model, { color: m.color });
  if (m.model.startsWith('vox:')) inst.obj.scale.setScalar(m.boss ? 1.8 : 1); else inst.fit(m.boss ? 3.4 : m.model.startsWith('pets/') ? 1.1 : 1.75);
  inst.obj.position.set(...e.pos); scene.add(inst.obj); e.inst = inst;
  return inst;
}
function einStep() {
  if (S.flags.cleared) return { pos: [212.5, 9, 380.5] };
  const k = S.flags.ein || 0;
  if (k >= EIN_STEPS.length) return S.crystals.length >= 8 ? { pos: W.ein[W.ein.length - 1] } : null;
  return S.crystals.length >= EIN_STEPS[k] ? { pos: W.ein[k] } : null;
}
function refreshEnts() {
  for (const e of ents) {
    if (e.kind === 'chest') e.inst.obj.visible = !S.chests[e.data.id];
    if (e.kind === 'crystal') e.inst.obj.visible = !S.crystals.includes(e.data.job);
    if (e.kind === 'shard') e.inst.obj.visible = !S.shards.includes(e.data.id);
    if (e.kind === 'herb') e.inst.obj.visible = !S.picked[e.data.id];
    if (e.kind === 'monster' && e.inst) e.inst.obj.visible = !beatenNow(e.data);
    if (e.kind === 'gate') e.obj.visible = !S.flags.spireOpen;
    if (e.kind === 'boss') e.inst.obj.visible = !S.beaten[e.data.id];
  }
  const st = einStep();
  einEnt.inst.obj.visible = !!st;
  if (st) { einEnt.pos = [...st.pos]; einEnt.inst.obj.position.set(...st.pos); }
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
const fluid = (id) => id === B.water || id === B.lava;
function blockedAt(x, y, z) {
  for (const bx of [Math.floor(x - PW), Math.floor(x + PW)]) for (const bz of [Math.floor(z - PW), Math.floor(z + PW)]) for (let by = Math.floor(y + 0.01); by <= Math.floor(y + PH - 0.01); by++) {
    if (solid(get(bx, by, bz))) return true;
    if (gateBlocks(bx, by, bz)) return true;
  }
  return false;
}
// water and lava are walls: you cannot walk into them or out over them
function wetAt(x, y, z) {
  for (const bx of [Math.floor(x - PW), Math.floor(x + PW)]) for (const bz of [Math.floor(z - PW), Math.floor(z + PW)]) if (fluid(get(bx, Math.floor(y + 0.01), bz)) || fluid(get(bx, Math.floor(y - 0.05), bz))) return true;
  return false;
}
function gateBlocks(bx, by, bz) {
  if (S.flags.spireOpen) return false;
  const gx = SPIRE.x + 5, gz = SPIRE.z;
  return Math.abs(bx - gx) <= 1 && Math.abs(bz - gz) <= 1 && by >= SPIRE.base + 1 && by <= SPIRE.base + 3;
}
function jumpSpeed() { return S.inv.boots ? 12.1 : 10.0; }
function movePlayer(dt) {
  const sp = (input.held('run') ? 7.4 : 5.2) * dt;
  // stick and keys move relative to the camera
  const mx = input.move.x, mz = input.move.z;
  const sin = Math.sin(cam.yaw), cos = Math.cos(cam.yaw);
  // the camera looks along (sin yaw, cos yaw); its right hand is (-cos yaw, sin yaw). Up on the stick is -z.
  const dx = (-mz * sin - mx * cos) * sp, dz = (-mz * cos + mx * sin) * sp;
  const moving = Math.hypot(dx, dz) > 0.0001;
  if (moving) P.yaw = Math.atan2(dx, dz);
  // across, with a one-block step up when walking into a ledge
  for (const [ax, az] of [[dx, 0], [0, dz]]) {
    if (!ax && !az) continue;
    if (!blockedAt(P.x + ax, P.y, P.z + az) && !wetAt(P.x + ax, P.y, P.z + az)) { P.x += ax; P.z += az; continue; }
    if (P.ground && !blockedAt(P.x + ax, P.y + 1.01, P.z + az) && !blockedAt(P.x, P.y + 1.01, P.z) && blockedAt(P.x + ax, P.y, P.z + az)) { P.y += 1.01; P.x += ax; P.z += az; }
  }
  // gravity, jumping and gliding
  if (P.ground && input.pressed('jump')) { P.vy = jumpSpeed(); P.ground = false; sfx('jump'); }
  P.vy -= 24 * dt;
  if (!P.ground && P.vy < 0 && S.inv.cape && input.held('jump')) P.vy = Math.max(P.vy, -2.4);
  const ny = P.y + P.vy * dt;
  if (blockedAt(P.x, ny, P.z)) { if (P.vy < 0) { P.y = Math.floor(ny) + 1; if (!P.ground && P.vy < -9) sfx('land'); P.ground = true; } P.vy = 0; }
  else { P.y = ny; P.ground = false; }
  // fell into water or lava, or out of the world: back to the last safe spot
  const here = get(Math.floor(P.x), Math.floor(P.y + 0.2), Math.floor(P.z));
  if (fluid(here) || P.y < 0) {
    [P.x, P.y, P.z] = P.safe; P.vy = 0; sfx('cancel');
    if (here === B.lava) { for (const m of S.members) if (m.hp > 0) m.hp = Math.max(1, m.hp - Math.ceil(m.hp * 0.15)); toast(L('好燙！快離開熔岩！', 'Hot! Out of the lava!'), 1400); }
    else toast(L('掉進水裡了！', 'Splash! Back to dry land.'), 1400);
  } else if (P.ground && !fluid(get(Math.floor(P.x), Math.floor(P.y - 1), Math.floor(P.z)))) P.safe = [P.x, P.y, P.z];
  player.obj.position.set(P.x, P.y, P.z);
  player.obj.rotation.y = P.yaw;
  player.play(!P.ground ? 'jump' : moving ? (input.held('run') ? 'sprint' : 'walk') : 'idle');
  if (moving && P.ground && Math.random() < 0.04) sfx('step');
}
function updateCamera(dt, instant = false) {
  cam.yaw += input.look; cam.dist = Math.max(6, Math.min(24, cam.dist + input.zoom * 1.2));
  // a little steeper when far out, so you can see over the hills
  const pitch = cam.pitch + (cam.dist - 12) * 0.012;
  const tx = P.x, ty = P.y + 1.4, tz = P.z;
  let d = cam.dist, cx, cy, cz;
  // pull in if the camera would end up inside a hill
  for (; d > 2; d -= 0.5) { cx = tx - Math.sin(cam.yaw) * Math.cos(pitch) * d; cz = tz - Math.cos(cam.yaw) * Math.cos(pitch) * d; cy = ty + Math.sin(pitch) * d; const cb = get(Math.floor(cx), Math.floor(cy), Math.floor(cz)); if (!solid(cb) || seeThrough(cb)) break; }
  const k = instant ? 1 : Math.min(1, dt * 8);
  camera.position.x += (cx - camera.position.x) * k; camera.position.y += (cy - camera.position.y) * k; camera.position.z += (cz - camera.position.z) * k;
  camera.lookAt(tx, ty, tz);
}

// ---------- things to touch ----------
const dist3 = (a, x, y, z) => Math.hypot(a[0] - x, (a[1] - y) * 0.6, a[2] - z);
const TOUCH = ['npc', 'ein', 'chest', 'home', 'sign', 'herb', 'fish'];
let near = null, fishCool = 0;
function updateWorldEnts(dt) {
  const t = S.time;
  near = null; let nd = 1.9;
  if (fishCool > 0) fishCool -= dt;
  for (const e of ents) {
    const far = Math.hypot(e.pos[0] - P.x, e.pos[2] - P.z);
    if (e.kind === 'monster') { updateMonster(e, dt, far); continue; }
    if (far > 90) continue;
    if (e.inst && e.inst.update) e.inst.update(dt, t);
    if (e.kind === 'boss') { if (S.beaten[e.data.id]) continue; if (dist3(e.pos, P.x, P.y, P.z) < 3) { startEncounter(e); return; } continue; }
    if (e.kind === 'crystal') { if (S.crystals.includes(e.data.job)) continue; if (dist3(e.pos, P.x, P.y + 0.8, P.z) < 1.3) { run(() => SCRIPTS.crystal(e.data)).then(refreshEnts); return; } continue; }
    if (e.kind === 'shard') { if (S.shards.includes(e.data.id)) continue; if (dist3(e.pos, P.x, P.y, P.z) < 1.3) { run(() => SCRIPTS.shard(e.data)).then(refreshEnts); return; } continue; }
    if (e.kind === 'gate' && !S.flags.spireOpen) { if (dist3(e.pos, P.x, P.y, P.z) < 2.4) { e.cool = (e.cool || 0) - dt; if (e.cool <= 0) { e.cool = 3; run(() => SCRIPTS.gate(e.data)).then(refreshEnts); return; } } continue; }
    if (e.kind === 'chest' && S.chests[e.data.id]) continue;
    if (e.kind === 'herb' && S.picked[e.data.id]) continue;
    if (e.kind === 'ein' && !e.inst.obj.visible) continue;
    if (e.kind === 'fish' && fishCool > 0) continue;
    if (TOUCH.includes(e.kind)) { const d = dist3(e.pos, P.x, P.y, P.z); if (d < nd) { nd = d; near = e; } }
  }
  const LABEL = { npc: L('E：對話', 'E: Talk'), ein: L('E：對話', 'E: Talk'), chest: L('E：打開', 'E: Open'), home: L('E：觸摸家石', 'E: Touch the stone'), sign: L('E：閱讀', 'E: Read'), herb: L('E：採集', 'E: Pick'), fish: L('E：釣魚', 'E: Fish') };
  prompt(near ? LABEL[near.kind] : null);
  if (near && input.pressed('a')) interact(near);
}
async function interact(e) {
  if (e.kind === 'npc' || e.kind === 'ein') { if (e.inst) e.inst.obj.lookAt(P.x, e.pos[1], P.z); await run(() => (SCRIPTS[e.data.talk] || (() => say(null, '……')))(e.data, ctx)); if (e.kind === 'ein') refreshEnts(); }
  if (e.kind === 'chest') { S.chests[e.data.id] = true; refreshEnts(); await run(() => SCRIPTS.chest(e.data)); }
  if (e.kind === 'home') await run(() => SCRIPTS.home(e.data, ctx));
  if (e.kind === 'sign') await run(() => SCRIPTS.sign(e.data));
  if (e.kind === 'herb') { await run(() => SCRIPTS.herb(e.data)); refreshEnts(); }
  if (e.kind === 'fish') { P.yaw = Math.atan2(e.data.water[0] - P.x, e.data.water[1] - P.z); player.obj.rotation.y = P.yaw; player.play('interact-right', { once: true }); await run(() => SCRIPTS.fishing(e.data, isNight())); fishCool = 1.2; }
}
let busy = false;
async function run(fn) { busy = true; prompt(null); try { await fn(); } catch (err) { console.error(err); } busy = false; }
// what menus and scripts need from here
const ctx = {
  savePos() { S.pos = [P.x, P.y, P.z]; S.yaw = cam.yaw; },
  save: () => { ctx.savePos(); return save(); },
  playerPos: () => [P.x, P.y, P.z],
  inTown: () => !!REGIONS[regionAt(P.x, P.z)].town,
  async rest() { await fade(true); fullHeal(); sfx('heal'); S.clock = 0.3; await wait(600); await fade(false); toast(L('大家都休息好了。早安！', 'Everyone is rested. Good morning!')); },
  async warp(pos) { sfx('warp'); await fade(true); P.x = pos[0]; P.y = pos[1] + 0.1; P.z = pos[2] + 1.2; P.vy = 0; P.safe = [P.x, P.y, P.z]; updateChunks(P.x, P.z, Infinity); updateCamera(0, true); await fade(false); },
};

// ---------- monsters on the field ----------
function updateMonster(e, dt, far) {
  const nightOnly = NIGHT.has(e.data.monster);
  if (far > 95 || beatenNow(e.data) || (nightOnly && !isNight())) { if (e.inst) e.inst.obj.visible = false; return; }
  const inst = monsterInst(e);
  inst.obj.visible = true;
  inst.update(dt, S.time);
  if (far > 60) return;
  e.t -= dt; if (e.stun > 0) e.stun -= dt;
  const p = e.pos, dx = P.x - p[0], dz = P.z - p[2], d = Math.hypot(dx, dz), dy = Math.abs(P.y - p[1]);
  const m = MONSTERS[e.data.monster];
  let vx = 0, vz = 0;
  if (e.stun <= 0 && P.inv <= 0 && d < 7 && dy < 2.5 && !UI.active && !busy) { vx = dx / d * 3.1; vz = dz / d * 3.1; }
  else { if (e.t <= 0) { e.t = 2 + Math.random() * 3; const a = Math.random() * Math.PI * 2, back = Math.hypot(e.home[0] - p[0], e.home[2] - p[2]) > 5; e.vel = back ? [(e.home[0] - p[0]) * 0.3, (e.home[2] - p[2]) * 0.3] : Math.random() < 0.4 ? [0, 0] : [Math.cos(a) * 1.2, Math.sin(a) * 1.2]; } [vx, vz] = e.vel; }
  // stay on land that is not too steep
  const nx = p[0] + vx * dt, nz = p[2] + vz * dt, gy = ground(nx, nz);
  if (Math.abs(gy - p[1]) <= 1.05 && !fluid(get(Math.floor(nx), gy - 1, Math.floor(nz))) && !fluid(get(Math.floor(nx), gy, Math.floor(nz))) && gy > SEA + 1) { p[0] = nx; p[2] = nz; p[1] = gy; }
  inst.obj.position.set(p[0], p[1], p[2]);
  if (vx || vz) inst.obj.rotation.y = Math.atan2(vx, vz);
  inst.play(vx || vz ? 'walk' : 'idle');
  if (d < 1.0 && dy < 1.6 && P.inv <= 0 && e.stun <= 0 && !m.boss) startEncounter(e);
  else if (m.boss && d < 3 && dy < 3) startEncounter(e);
}
// a fight: the one you touched and maybe a friend or two from the same land
async function startEncounter(e) {
  if (busy || UI.active) return;
  busy = true; prompt(null);
  const m = MONSTERS[e.data.monster], boss = !!m.boss || e.kind === 'boss';
  const id = e.data.monster, reg = regionAt(P.x, P.z);
  const group = [id];
  if (!boss) { const pool = W.spawns.filter((s) => regionAt(s.pos[0], s.pos[2]) === reg && !MONSTERS[s.monster].boss && (isNight() || !NIGHT.has(s.monster))).map((s) => s.monster); const extra = Math.random() < 0.55 ? 1 + (Math.random() < 0.35 ? 1 : 0) : 0; for (let k = 0; k < extra; k++) group.push(pool[Math.floor(Math.random() * pool.length)] || id); }
  if (boss) await SCRIPTS.bossIntro(id);
  sfx('encounter');
  await fade(true);
  mode = 'battle';
  $('hud').style.display = 'none'; $('touch').style.visibility = 'hidden';
  await fade(false);
  const bg = { mistfen: 'marsh', sporewood: 'spore', ember: 'ember' }[reg] || REGIONS[reg].bg;
  const r = await startBattle(group, { boss, bg });
  await fade(true);
  mode = 'field'; $('hud').style.display = ''; $('touch').style.visibility = '';
  if (r === 'lose') { await gameOver(); busy = false; return; }
  if (r === 'win') { S.beaten[e.data.id] = boss ? true : S.time; S.kills[reg] = (S.kills[reg] || 0) + group.length; refreshEnts(); }
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
  P.x = h.pos[0]; P.y = h.pos[1] + 0.1; P.z = h.pos[2] + 1.2; P.vy = 0; updateChunks(P.x, P.z, Infinity); updateCamera(0, true);
  await fade(false);
}

// ---------- the minimap and the HUD ----------
const mini = $('mini').getContext('2d');
let colourMap = null;
function buildColourMap() {
  const c = new Uint8ClampedArray(WX * WZ * 4);
  for (let z = 0; z < WZ; z++) for (let x = 0; x < WX; x++) { const y = ground(x, z) - 1, id = get(x, y, z), wet = fluid(get(x, y + 1, z)) || (y < SEA && get(x, SEA, z) === B.water), col = wet ? (get(x, y + 1, z) === B.lava ? [255, 110, 30] : [60, 120, 220]) : MAPCOL[id] || [110, 160, 90], s = 0.7 + Math.min(1, y / 50) * 0.5; c.set([col[0] * s, col[1] * s, col[2] * s, 255], (z * WX + x) * 4); }
  colourMap = new ImageData(c, WX, WZ);
}
const miniCanvas = document.createElement('canvas'); miniCanvas.width = WX; miniCanvas.height = WZ;
const DOT = { monster: '#ff5060', npc: '#ffffff', ein: '#d8a0ff', chest: '#ffe27a', home: '#7ab8ff', crystal: '#9ff0ff', boss: '#ff2030', shard: '#ff9ad8', fish: '#a8e0ff', herb: '#a0ffb0' };
function drawMinimap() {
  if (!colourMap) { buildColourMap(); miniCanvas.getContext('2d').putImageData(colourMap, 0, 0); }
  const s = 2.2, R = 60;
  mini.save(); mini.fillStyle = '#0a1020'; mini.fillRect(0, 0, 120, 120);
  // turn the map so the way the camera faces is up
  mini.translate(60, 60); mini.rotate(cam.yaw - Math.PI);
  mini.imageSmoothingEnabled = false;
  mini.drawImage(miniCanvas, P.x - R / s, P.z - R / s, (R * 2) / s, (R * 2) / s, -R, -R, R * 2, R * 2);
  if (!isNight()) { /* full colour by day */ } else { mini.fillStyle = 'rgba(10,20,60,0.35)'; mini.fillRect(-R, -R, R * 2, R * 2); }
  for (const e of ents) {
    const col = DOT[e.kind]; if (!col) continue;
    if (!e.inst || !e.inst.obj.visible) continue;
    const x = (e.pos[0] - P.x) * s, z = (e.pos[2] - P.z) * s;
    if (Math.abs(x) > R || Math.abs(z) > R) continue;
    mini.fillStyle = col; mini.fillRect(x - 2, z - 2, 4, 4);
  }
  // the compass points at the nearest crystal still to find
  if (S.inv.compass) {
    let best = null, bd = Infinity; for (const c of W.crystals) if (!S.crystals.includes(c.job)) { const d = Math.hypot(c.pos[0] - P.x, c.pos[2] - P.z); if (d < bd) { bd = d; best = c; } }
    if (best) { const a = Math.atan2(best.pos[2] - P.z, best.pos[0] - P.x); mini.fillStyle = '#9ff0ff'; mini.beginPath(); mini.arc(Math.cos(a) * 52, Math.sin(a) * 52, 4, 0, Math.PI * 2); mini.fill(); }
  }
  mini.restore();
  mini.fillStyle = '#ff3050'; mini.beginPath(); mini.moveTo(60, 53); mini.lineTo(55, 65); mini.lineTo(65, 65); mini.fill();
  const hh = Math.floor(S.clock * 24), mm = Math.floor((S.clock * 24 - hh) * 60);
  $('crystals').innerHTML = `◆ ${S.crystals.length} / 8<br><span style="color:#ff9ad8">✦ ${S.shards.length} / 24</span><br><span style="color:#b8c8e8">${isNight() ? '☾' : '☀'} ${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}</span>`;
}
function updateRegion() {
  const r = regionAt(P.x, P.z);
  if (r !== P.region) {
    P.region = r; areaName(REGIONS[r].name[LANG === 'en' ? 1 : 0]); playMusic(REGIONS[r].music);
    skyKind = { forest: 'forest', mesa: 'mesa', dunewell: 'mesa', mountain: 'mountain', frostgate: 'mountain', rimefield: 'mountain', spire: 'spire', mistfen: 'marsh', sporewood: 'spore', ember: 'ember', ruins: 'ruins' }[r] || 'default';
  }
}
// far things fade from view: decoration patches and the world's little objects
function cullFar() {
  for (const g of decorCells) g.visible = Math.hypot(g.userData.c[0] - P.x, g.userData.c[1] - P.z) < VIEW + DECOR_CELL * 0.75;
}

// ---------- title, opening, ending ----------
const TITLE_AT = [216, 300];
function showTitle() {
  mode = 'title'; $('hud').style.visibility = 'hidden';
  P.x = TITLE_AT[0]; P.z = TITLE_AT[1]; P.y = ground(...TITLE_AT) + 6;
  const t = $('title');
  const opts = () => [{ id: 'new', label: L('新的旅程', 'New Journey') }, { id: 'cont', label: L('繼續旅程', 'Continue'), off: !hasSave() }, { id: 'lang', label: LANG === 'en' ? 'Language: English' : '語言：中文' }];
  let sel = hasSave() ? 1 : 0;
  const draw = () => {
    t.innerHTML = `<div class="logo">${L('晶境漫遊', 'PRISMWANDER')}</div><div class="sub">${L('PRISMWANDER', '晶境漫遊')}</div>` +
      `<div class="panel opts">${opts().map((o, i) => `<div class="opt${i === sel ? ' sel' : ''}${o.off ? ' off' : ''}" data-i="${i}">${o.label}</div>`).join('')}</div>` +
      `<div class="hint">${L('WASD 移動・空白鍵 跳躍・滑鼠拖曳轉視角・滾輪拉遠・E 調查・Esc 選單・M 音樂開關', 'WASD move · Space jump · drag to turn · wheel to zoom · E look · Esc menu · M music on/off')}<br>${L('© 2026 原創作品・模型 KayKit、Kenney (CC0)・音樂 Ninja Adventure (CC0)', '© 2026 an original game · models by KayKit and Kenney (CC0) · music from Ninja Adventure (CC0)')}</div>`;
    t.classList.add('on');
  };
  t.onclick = (e) => { const o = e.target.closest('.opt'); if (o) { sel = +o.dataset.i; choose(); } initAudio(); };
  const choose = () => { const o = opts()[sel]; if (o.off) { sfx('buzz'); return; } sfx('ok'); initAudio(); if (o.id === 'lang') { setLang(LANG === 'en' ? 'zh' : 'en'); draw(); return; } t.classList.remove('on'); titleKeys = null; if (o.id === 'new') newGame(); else continueGame(); };
  titleKeys = () => { if (input.pressed('down')) { sel = (sel + 1) % 3; sfx('cursor'); draw(); } if (input.pressed('up')) { sel = (sel + 2) % 3; sfx('cursor'); draw(); } if (input.pressed('a') || input.pressed('jump')) choose(); };
  playMusic('title');
  draw();
}
let titleKeys = null;
async function enterField() {
  P.vy = 0; P.safe = [P.x, P.y, P.z]; P.region = '';
  updateChunks(P.x, P.z, Infinity); refreshEnts(); updateCamera(0, true); mode = 'field';
}
async function newGame() {
  $('title').classList.remove('on'); titleKeys = null; $('hud').style.visibility = '';
  await fade(true);
  newParty(); makePlayer();
  // start by the elder, the camera to the north looking down into the village square
  P.x = 216.5; P.z = 378.5; P.y = ground(216, 378); cam.yaw = Math.PI; P.yaw = 0; cam.dist = 12.5;
  await enterField();
  await fade(false);
  await run(() => SCRIPTS.intro());
}
async function continueGame() {
  $('title').classList.remove('on'); titleKeys = null; $('hud').style.visibility = '';
  await fade(true);
  if (!load()) { await fade(false); showTitle(); return; }
  makePlayer();
  [P.x, P.y, P.z] = S.pos || [216.5, ground(216, 378), 378.5]; cam.yaw = S.pos ? S.yaw || 0 : Math.PI;
  await enterField();
  await fade(false);
}
async function theEnd() {
  await SCRIPTS.ending();
  S.flags.cleared = true; ctx.savePos(); save();
  await fade(true);
  playMusic('ending');
  const t = $('title');
  const lines = L(`晶境漫遊\n\n— 旅人 —\n洛　芙蘿　巴爾　希雅\n\n— 守護者 —\n艾茵\n\n奧森長老與爐心村的人們\n芬邊村、鹽灣港、沙泉鎮、霜門村的人們\n菇林的隱士\n\n— 守護者們 —\n古樹守衛　沼地守墓人　菇王　台地之王\n古都亡騎　冰霜飛龍　熔岩飛龍\n稜晶之心\n\n3D 模型：KayKit、Kenney (CC0)\n方塊材質：Kenney Voxel Pack (CC0)\n音樂：Ninja Adventure — Pixel-boy & AAA (CC0)\n字型：俐方體11號\n\n故事、世界與程式：原創作品\n\n稜晶的光回到了大地。\n白天和夜晚，都分到了一點。\n漫遊之年，還沒有結束。\n\n感謝你的遊玩！`,
    `PRISMWANDER\n\n- TRAVELLERS -\nLowe   Flora   Bal   Shia\n\n- KEEPER -\nEin\n\nElder Ozen and the people of Hearthvale\nthe people of Fenside, Saltmere, Dunewell and Frostgate\nthe hermit of the grove\n\n- GUARDIANS -\nElder Treant   The Bog Keeper   The Sporelord   Mesa King\nThe Fallen Knight   Frost Wyrm   The Ember Drake\nThe Prism Heart\n\n3D models: KayKit and Kenney (CC0)\nBlock textures: Kenney Voxel Pack (CC0)\nMusic: Ninja Adventure by Pixel-boy & AAA (CC0)\nFont: Cubic 11\n\nStory, world and code: an original game\n\nThe light of the Prism returns to the land,\na little for the days and a little for the nights.\nAnd the wandering year is not over yet.\n\nTHANK YOU FOR PLAYING!`);
  t.innerHTML = `<div class="panel" style="padding:24px 30px;font-size:17px;line-height:1.8;text-align:center;white-space:pre-line;max-height:80vh;overflow:hidden"><div id="roll" style="transition:transform 50s linear">${lines}</div></div><div class="hint">${L('按 E 回到標題', 'Press E to return to the title')}</div>`;
  t.classList.add('on'); mode = 'credits';
  await fade(false);
  requestAnimationFrame(() => { const r = $('roll'); if (r) r.style.transform = 'translateY(-62%)'; });
}

// ---------- the loop ----------
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  pollInput();
  if (UI.active) uiUpdate();
  if (mode === 'title') {
    if (titleKeys) titleKeys();
    cam.yaw += dt * 0.05; const [tx, tz] = TITLE_AT;
    camera.position.set(tx + Math.sin(cam.yaw) * 70, 56, tz + Math.cos(cam.yaw) * 70); camera.lookAt(tx, 14, tz - 30);
    updateSky(dt); sky.position.copy(camera.position); cullFar();
    renderer.render(scene, camera);
    for (const e of ents) if (e.inst && e.inst.update && Math.hypot(e.pos[0] - tx, e.pos[2] - tz) < 90) e.inst.update(dt, now / 1000);
  } else if (mode === 'field') {
    S.time += dt; if (P.inv > 0) P.inv -= dt;
    if (!UI.active && !busy) {
      movePlayer(dt);
      if (input.pressed('menu')) { prompt(null); busy = true; fieldMenu(ctx).then(() => { busy = false; refreshEnts(); }); }
    } else player.play('idle');
    player.update(dt);
    updateCamera(dt); updateRegion(); updateChunks(P.x, P.z); updateSky(dt); cullFar();
    sky.position.copy(camera.position);
    if (!UI.active && !busy) updateWorldEnts(dt); else for (const e of ents) if (e.inst && e.inst.update && Math.hypot(e.pos[0] - P.x, e.pos[2] - P.z) < 40) e.inst.update(dt, S.time);
    for (const c of clouds) { c.position.x += dt * 0.8; if (c.position.x > WX + 20) c.position.x = -20; }
    if (G.water) G.water.material.opacity = 0.76 + Math.sin(S.time * 0.8) * 0.03;
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
Object.assign(G, { skyMat, scn: scene, camera, P, cam, ents, ctx, startEncounter, refreshEnts, newGame, setMode: (m) => { mode = m; }, ITEMS, inBattle, WY, homeName, rebuildChunkAt, chunks, updateChunks, renderer, isNight, setClock: (c) => { S.clock = c; } });
