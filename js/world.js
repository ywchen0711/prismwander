// The world: one continent of blocks, 192 x 192 columns and 56 high, generated from fixed seeds so it is the
// same for everyone. Regions shape the ground (meadow, forest, coast, lake, mesa, mountains, the spire),
// villages and the spire are built on top, and the whole thing is turned into chunk meshes for three.js.
import * as THREE from 'three';

export const WX = 192, WZ = 192, WY = 56, SEA = 6;
// block ids; the atlas faces are [top, side, bottom]
export const B = { post: 21, air: 0, grass: 1, dirt: 2, stone: 3, sand: 4, snow: 5, ice: 6, wood: 7, leaves: 8, redsand: 9, redstone: 10, brick: 11, gravel: 12, crystal: 13, cobble: 14, orange: 15, birch: 16, plank: 17, water: 20 };
const FACES = {
  1: ['grass_top', 'dirt_grass', 'dirt'], 2: ['dirt', 'dirt', 'dirt'], 3: ['greystone', 'greystone', 'greystone'], 4: ['sand', 'sand', 'sand'], 5: ['snow', 'dirt_snow', 'dirt'],
  6: ['ice', 'ice', 'ice'], 7: ['trunk_top', 'trunk_side', 'trunk_top'], 8: ['leaves', 'leaves', 'leaves'], 9: ['redsand', 'redsand', 'redsand'], 10: ['redstone', 'redstone', 'redstone'],
  11: ['brick_grey', 'brick_grey', 'brick_grey'], 12: ['gravel_stone', 'gravel_stone', 'gravel_stone'], 13: ['stone_diamond', 'stone_diamond', 'stone_diamond'], 14: ['stone', 'stone', 'stone'],
  15: ['leaves_orange', 'leaves_orange', 'leaves_orange'], 16: ['trunk_top', 'trunk_white_side', 'trunk_top'], 17: ['table', 'brick_red', 'table'],
};
export const solid = (id) => id !== 0 && id !== B.water;
// blocks you see; the post is solid but invisible, standing inside a model's trunk
const opaque = (id) => solid(id) && id !== B.post;

// ---------- noise ----------
function hash2(x, z, s) { let h = (x * 374761393 + z * 668265263 + s * 1442695040) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
function vnoise(x, z, s) {
  const X = Math.floor(x), Z = Math.floor(z), fx = x - X, fz = z - Z, u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz);
  const a = hash2(X, Z, s), b = hash2(X + 1, Z, s), c = hash2(X, Z + 1, s), d = hash2(X + 1, Z + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
const fbm = (x, z, s, o = 4) => { let t = 0, a = 0.5, f = 1, n = 0; for (let i = 0; i < o; i++) { t += vnoise(x * f, z * f, s + i * 17) * a; n += a; a *= 0.5; f *= 2; } return t / n; };
export const rand = (x, z, s = 0) => hash2(x, z, s + 99);

// ---------- the regions ----------
// each place has a centre, a radius and a music; whichever is nearest (scaled by radius) names the ground you stand on
export const REGIONS = {
  meadow:   { name: ['晨風原', 'Dawnbreeze Fields'], c: [96, 150], r: 40, music: 'field', bg: 'grass' },
  hearth:   { name: ['爐心村', 'Hearthvale'], c: [96, 166], r: 12, music: 'village', bg: 'grass', town: true },
  forest:   { name: ['低語林', 'Whisperwood'], c: [42, 120], r: 34, music: 'forest', bg: 'forest' },
  coast:    { name: ['白貝海岸', 'Shellshore'], c: [168, 128], r: 26, music: 'coast', bg: 'sand' },
  lake:     { name: ['鏡湖', 'Mirror Lake'], c: [100, 96], r: 20, music: 'lake', bg: 'grass' },
  mesa:     { name: ['赤砂台地', 'Redsand Mesa'], c: [150, 56], r: 36, music: 'mesa', bg: 'redsand' },
  dunewell: { name: ['沙泉鎮', 'Dunewell'], c: [140, 92], r: 9, music: 'village', bg: 'sand', town: true },
  mountain: { name: ['灰脊山', 'Greyridge'], c: [40, 48], r: 40, music: 'mountain', bg: 'stone' },
  frostgate:{ name: ['霜門村', 'Frostgate'], c: [62, 80], r: 9, music: 'village', bg: 'snow', town: true },
  spire:    { name: ['稜晶尖塔', 'The Prism Spire'], c: [100, 22], r: 18, music: 'spire', bg: 'crystal' },
};
for (const r of Object.values(REGIONS)) { const v = r.name; Object.defineProperty(r, 'label', { value: v }); }
export function regionAt(x, z) {
  let best = 'meadow', bd = Infinity;
  for (const [id, r] of Object.entries(REGIONS)) { const d = Math.hypot(x - r.c[0], z - r.c[1]) / r.r * (r.town ? 0.7 : 1); if (d < bd) { bd = d; best = id; } }
  return best;
}
const near = (x, z, id) => { const r = REGIONS[id]; return Math.max(0, 1 - Math.hypot(x - r.c[0], z - r.c[1]) / r.r); };

// ---------- the ground ----------
function columnHeight(x, z) {
  let h = 9 + (fbm(x / 38, z / 38, 1) - 0.5) * 8 + (fbm(x / 12, z / 12, 2) - 0.5) * 2;
  // the forest rolls a little more
  h += near(x, z, 'forest') * (fbm(x / 14, z / 14, 3) * 3);
  // mountains: ridges climbing toward snowy peaks
  const m = near(x, z, 'mountain');
  if (m > 0) h += Math.pow(m, 1.3) * 34 * (0.65 + fbm(x / 10, z / 10, 4) * 0.5);
  // the mesa: terraces three blocks tall with sheer sides
  const me = near(x, z, 'mesa');
  if (me > 0.18) { const t = 12 + Math.floor((me - 0.18) * 6 + fbm(x / 14, z / 14, 5) * 2.2) * 3; h = Math.max(h, t); }
  // the spire stands on a high plateau
  const sp = near(x, z, 'spire');
  if (sp > 0) h = Math.max(h, 10 + Math.min(1, sp * 2.2) * 12);
  // the lake, and the sea along the east coast
  const lk = near(x, z, 'lake');
  if (lk > 0.25) h = Math.min(h, SEA - 1 - Math.floor((lk - 0.25) * 5));
  const shore = x - (166 + Math.sin(z / 17) * 5);
  if (shore > 0) h = Math.min(h, SEA + 1 - shore * 0.6);
  // villages sit on flat ground
  for (const t of ['hearth', 'dunewell', 'frostgate']) { const k = near(x, z, t); if (k > 0) { const base = { hearth: 9, dunewell: 13, frostgate: 17 }[t]; h = h + (base - h) * Math.min(1, k * 2.5); } }
  // the edge of the world: cliffs and deep water
  const edge = Math.min(x, z, WZ - 1 - z);
  if (edge < 6) h = Math.max(h, 26 - edge * 2);
  if (x > WX - 10) h = Math.min(h, SEA - 3);
  return Math.max(1, Math.min(WY - 6, Math.round(h)));
}
function topBlock(x, z, h, steep) {
  const reg = regionAt(x, z);
  if (h <= SEA + 1 && (reg === 'coast' || x > 150 || near(x, z, 'lake') > 0.15)) return B.sand;
  if (reg === 'mesa' || reg === 'dunewell') return steep ? B.redstone : B.redsand;
  if (reg === 'mountain' || reg === 'frostgate') return h > 28 ? B.snow : steep ? B.stone : h > 22 ? B.gravel : B.grass;
  if (reg === 'spire') return B.cobble;
  return steep ? B.stone : B.grass;
}

// ---------- the world grid ----------
export const W = { data: new Uint8Array(WX * WY * WZ), height: new Int16Array(WX * WZ), ents: [], crystals: [], homes: [], chests: [], spawns: [] };
const idx = (x, y, z) => (z * WX + x) * WY + y;
export function get(x, y, z) { if (x < 0 || z < 0 || x >= WX || z >= WZ || y < 0) return B.stone; if (y >= WY) return B.air; return W.data[idx(x, y, z)]; }
export function set(x, y, z, id) { if (x < 0 || z < 0 || x >= WX || z >= WZ || y < 0 || y >= WY) return; W.data[idx(x, y, z)] = id; }
export const ground = (x, z) => { x = Math.max(0, Math.min(WX - 1, Math.floor(x))); z = Math.max(0, Math.min(WZ - 1, Math.floor(z))); for (let y = WY - 1; y > 0; y--) if (solid(get(x, y, z))) return y + 1; return 1; };

function fill(x0, y0, z0, x1, y1, z1, id) { for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) set(x, y, z, id); }
function tree(x, y, z, kind = 'oak') {
  const h = 4 + Math.floor(rand(x, z, 3) * 3), trunk = kind === 'birch' ? B.birch : B.wood, leaf = kind === 'autumn' ? B.orange : B.leaves;
  for (let k = 0; k < h; k++) set(x, y + k, z, trunk);
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) for (let dy = -1; dy <= 1; dy++) {
    if (Math.abs(dx) + Math.abs(dz) + Math.abs(dy) > 3) continue;
    if (get(x + dx, y + h + dy, z + dz) === B.air) set(x + dx, y + h + dy, z + dz, leaf);
  }
  set(x, y + h + 2, z, leaf);
}
// a little house: walls, a door gap, a sloped roof
function house(x, y, z, w = 5, d = 5, wall = B.plank, roof = B.brick) {
  fill(x - 1, y - 1, z - 1, x + w, y - 1, z + d, B.cobble);
  for (let k = 0; k < 3; k++) for (let i = 0; i < w; i++) for (let j = 0; j < d; j++) { if (i === 0 || j === 0 || i === w - 1 || j === d - 1) set(x + i, y + k, z + j, wall); }
  set(x + (w >> 1), y, z + d - 1, B.air); set(x + (w >> 1), y + 1, z + d - 1, B.air);
  for (let r = 0; r <= (w >> 1) + 1; r++) for (let j = -1; j <= d; j++) { set(x - 1 + r, y + 3 + r, z + j, roof); set(x + w - r, y + 3 + r, z + j, roof); }
  return [x + (w >> 1) + 0.5, y, z + d + 0.5];
}

// key places other modules look up: villages' people, crystals, chests, home stones, monster spawns
export function generate() {
  const { data, height } = W;
  data.fill(0);
  for (let z = 0; z < WZ; z++) for (let x = 0; x < WX; x++) height[z * WX + x] = columnHeight(x, z);
  for (let z = 0; z < WZ; z++) for (let x = 0; x < WX; x++) {
    const h = height[z * WX + x];
    let steep = 0; for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const n = height[Math.min(WZ - 1, Math.max(0, z + dz)) * WX + Math.min(WX - 1, Math.max(0, x + dx))]; steep = Math.max(steep, h - n); }
    const top = topBlock(x, z, h, steep >= 3), reg = regionAt(x, z);
    for (let y = 0; y < h; y++) {
      let id = y === h - 1 ? top : y > h - 4 ? (top === B.redsand || top === B.redstone ? B.redstone : top === B.sand ? B.sand : top === B.cobble ? B.stone : B.dirt) : B.stone;
      if (reg === 'mesa' && y < h - 1 && y % 3 === 0) id = B.redsand;
      set(x, y, z, id);
    }
    for (let y = h; y <= SEA; y++) set(x, y, z, B.water);
    if (top === B.snow && h > 33 && rand(x, z, 9) > 0.7) set(x, h - 1, z, B.ice);
  }
  // trees: thick in the forest, scattered on the meadow, birches by the lake, none on rock
  for (let z = 4; z < WZ - 4; z++) for (let x = 4; x < WX - 4; x++) {
    const h = height[z * WX + x], reg = regionAt(x, z), top = get(x, h - 1, z);
    if (top !== B.grass || h <= SEA + 1) continue;
    const r = rand(x, z, 11);
    // block trees thin out where the KayKit trees stand in for them
    const p = reg === 'forest' ? 0.03 : reg === 'lake' ? 0.008 : reg === 'mountain' ? 0.012 : 0;
    if (r < p && !isClear(x, z)) tree(x, h, z, reg === 'lake' ? 'birch' : reg === 'forest' && rand(x, z, 12) > 0.8 ? 'autumn' : 'oak');
  }
  W.ents = []; W.crystals = []; W.homes = []; W.chests = []; W.spawns = []; W.decor = [];
  buildHearthvale(); buildDunewell(); buildFrostgate(); buildSpire();
  placeCrystals(); placeChests(); placeHomes(); placeSpawns(); placeDecor();
  return W;
}
// villages keep their ground free of trees
function isClear(x, z) { for (const t of ['hearth', 'dunewell', 'frostgate']) if (near(x, z, t) > 0) return true; return Math.hypot(x - 100, z - 22) < 22; }

function buildHearthvale() {
  const y = 9;
  const doorA = house(86, y, 158, 6, 5), doorB = house(103, y, 158, 5, 5, B.plank, B.brick), doorC = house(92, y, 170, 5, 5, B.birch, B.brick);
  // a well in the square, a field of wheat
  fill(95, y, 166, 97, y, 168, B.cobble); set(96, y, 167, B.water);
  for (let x = 104; x <= 110; x++) for (let z = 168; z <= 174; z++) if (z % 2 === 0) set(x, y - 1, z, B.dirt);
  W.ents.push(
    { type: 'npc', id: 'elder', model: 'chars/character-q', pos: [96.5, y, 163.5], face: 0, talk: 'hv_elder' },
    { type: 'npc', id: 'shop1', model: 'chars/character-f', pos: doorB.slice(0, 2).concat([doorB[2] + 1]), face: 0, talk: 'hv_shop', shop: 'hearthvale' },
    { type: 'npc', id: 'inn1', model: 'chars/character-m', pos: [doorA[0], y, doorA[2] + 1], face: 0, talk: 'hv_inn', inn: true },
    { type: 'npc', id: 'kid1', model: 'chars/character-n', pos: [100.5, y, 167.5], face: 1, talk: 'hv_kid' },
    { type: 'npc', id: 'farmer1', model: 'chars/character-c', pos: [107.5, y, 171.5], face: 2, talk: 'hv_farmer' },
    { type: 'npc', id: 'sage1', model: 'chars/character-p', pos: [doorC[0], y, doorC[2] + 1], face: 0, talk: 'hv_sage' },
    { type: 'prop', model: 'grave/lightpost-single', pos: [93.5, y, 163.5] }, { type: 'prop', model: 'grave/lightpost-single', pos: [99.5, y, 163.5] },
    { type: 'prop', model: 'grave/hay-bale', pos: [111.5, y, 167.5] }, { type: 'prop', model: 'dungeon/barrel', pos: [89.5, y, 164.5] },
  );
}
function buildDunewell() {
  const y = 13;
  fill(136, y - 1, 88, 144, y - 1, 96, B.water); fill(137, y - 1, 89, 143, y - 1, 95, B.water);
  for (let x = 134; x <= 146; x++) for (let z = 86; z <= 98; z++) if ((x === 134 || x === 146 || z === 86 || z === 98) && get(x, y - 1, z) !== B.water) set(x, y - 1, z, B.sand);
  const dA = house(126, y, 86, 5, 5, B.redstone, B.redsand), dB = house(148, y, 88, 5, 5, B.redstone, B.redsand);
  tree(135, y, 87, 'oak'); tree(145, y, 97, 'oak');
  W.ents.push(
    { type: 'npc', id: 'shop2', model: 'chars/character-g', pos: [dA[0], y, dA[2] + 1], face: 0, talk: 'dw_shop', shop: 'dunewell' },
    { type: 'npc', id: 'inn2', model: 'chars/character-l', pos: [dB[0], y, dB[2] + 1], face: 0, talk: 'dw_inn', inn: true },
    { type: 'npc', id: 'digger', model: 'chars/character-j', pos: [140.5, y, 99.5], face: 0, talk: 'dw_digger' },
    { type: 'npc', id: 'nomad', model: 'chars/character-e', pos: [133.5, y, 92.5], face: 3, talk: 'dw_nomad' },
  );
}
function buildFrostgate() {
  const y = 17;
  const fA = house(55, y, 76, 5, 5, B.birch, B.stone), fB = house(66, y, 77, 5, 5, B.birch, B.stone);
  W.ents.push(
    { type: 'npc', id: 'shop3', model: 'chars/character-i', pos: [fA[0], y, fA[2] + 1], face: 0, talk: 'fg_shop', shop: 'frostgate' },
    { type: 'npc', id: 'inn3', model: 'chars/character-o', pos: [fB[0], y, fB[2] + 1], face: 0, talk: 'fg_inn', inn: true },
    { type: 'npc', id: 'climber', model: 'chars/character-b', pos: [62.5, y, 87.5], face: 0, talk: 'fg_climber' },
    { type: 'prop', model: 'grave/fire-basket', pos: [62.5, y, 82.5] },
  );
}
// the spire: a ring of stone climbing in a spiral to a platform where the last guardian waits
export const SPIRE = { x: 100, z: 22, base: 22, top: 50 };
function buildSpire() {
  const { x: cx, z: cz, base, top } = SPIRE;
  for (let y = base; y <= top; y++) for (let dx = -7; dx <= 7; dx++) for (let dz = -7; dz <= 7; dz++) {
    const r = Math.hypot(dx, dz);
    if (r <= 3.2) set(cx + dx, y, cz + dz, y % 4 === 0 ? B.crystal : B.brick);
  }
  // the spiral path: one block up every few steps around the core
  for (let k = 0; k < (top - base) * 5; k++) {
    const a = k / 5 * 0.55, y = base + Math.floor(k / 5), r = 5;
    const x = Math.round(cx + Math.cos(a) * r), z = Math.round(cz + Math.sin(a) * r);
    for (let w = -1; w <= 1; w++) { set(x + w, y, z, B.cobble); set(x, y, z + w, B.cobble); }
  }
  fill(cx - 5, top + 1, cz - 5, cx + 5, top + 1, cz + 5, B.cobble);
  for (let dx = -5; dx <= 5; dx += 10) for (let dz = -5; dz <= 5; dz += 10) for (let y = top + 2; y <= top + 4; y++) set(cx + dx, y, cz + dz, B.crystal);
  // a gate of crystal across the foot of the spiral that opens for eight crystals
  W.ents.push({ type: 'gate', id: 'spiregate', pos: [cx + 5.5, base + 1, cz + 0.5], need: 8 });
  W.ents.push({ type: 'boss', id: 'prismheart', monster: 'prismheart', pos: [cx + 0.5, top + 2, cz + 0.5] });
}
// eight job crystals, each somewhere you have to work to reach
export const CRYSTALS = [
  { job: 'guardian', pos: [36, 124], how: 'pillar' },
  { job: 'ranger', pos: [176, 112], how: 'seastack' },
  { job: 'bard', pos: [100, 96], how: 'island' },
  { job: 'monk', pos: [52, 64], how: 'ledge' },
  { job: 'alchemist', pos: [160, 70], how: 'mesatop' },
  { job: 'chrono', pos: [128, 40], how: 'mesatop' },
  { job: 'dancer', pos: [72, 112], how: 'treetops' },
  { job: 'astro', pos: [30, 34], how: 'summit' },
];
function placeCrystals() {
  for (const c of CRYSTALS) {
    const [x, z] = c.pos;
    let y = ground(x, z);
    if (c.how === 'pillar') { y = column(x, z, y + 7, B.stone); stairs(x, z, -1, 0, 2, B.stone); }
    if (c.how === 'ledge') { y = column(x, z, y + 7, B.stone); stairs(x, z, 0, 1, 2, B.stone); }
    if (c.how === 'mesatop') { y = column(x, z, y + 3, B.redstone); stairs(x, z, 1, 0, 3, B.redstone); }
    // stepping stones out over the water, one block apart, each a little higher than the last
    if (c.how === 'seastack') { y = column(x, z, SEA + 6, B.stone); hops(x, z, -1, 0, SEA + 6, B.stone); }
    if (c.how === 'island') { for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) column(x + dx, z + dz, SEA + 2, B.sand); y = SEA + 2; hops(x, z, 1, 0, SEA + 3, B.stone, 1, 2); tree(x + 1, y, z + 1, 'birch'); }
    // the tops of tree trunks, rising one block each, with gaps to jump
    if (c.how === 'treetops') { y = column(x, z, ground(x, z) + 9, B.wood); hops(x, z, -1, 0, ground(x, z) + 8, B.wood, 1); set(x, y - 1, z, B.leaves); }
    if (c.how === 'summit') { y = ground(x, z); }
    W.crystals.push({ job: c.job, pos: [x + 0.5, y + 0.8, z + 0.5] });
  }
}
// fill a column up to (not including) height top; returns the standing height on it
function column(x, z, top, id) { for (let y = 1; y < top; y++) if (!solid(get(x, y, z)) || get(x, y, z) === B.leaves) set(x, y, z, id); return top; }
// steps leading away from (x, z) in direction (dx, dz), each `step` lower than the one before, until they meet the ground
function stairs(x, z, dx, dz, step, id) {
  let h = ground(x, z) - step;
  for (let k = 1; k < 20; k++) { const sx = x + dx * k, sz = z + dz * k; if (h <= ground(sx, sz)) break; column(sx, sz, h, id); h -= step; }
}
// posts with a one-block gap between them, each `drop` lower than the last, until one reaches dry ground
function hops(x, z, dx, dz, h, id, drop = 1, k0 = 1) {
  for (let k = k0; k < 30; k++) { const sx = x + dx * k * 2, sz = z + dz * k * 2; h -= drop; const g = ground(sx, sz); if (g > SEA + 1 && h <= g + 1) break; column(sx, sz, Math.max(SEA + 2, h), id); }
}
function placeChests() {
  const L = [
    [80, 140, 'potion', 3], [118, 150, 'ether', 2], [60, 132, 'leathervest'], [30, 108, 'powerring'], [48, 140, 'kris'], [160, 140, 'charm'], [178, 150, 'hipotion', 2],
    [112, 104, 'sagering'], [147, 101, 'boots'], [170, 46, 'warhammer'], [130, 64, 'phoenix', 2], [44, 30, 'cape'], [26, 60, 'chainmail'], [70, 40, 'guardring'],
    [90, 36, 'prismmail'], [110, 32, 'crystalblade'], [102, 30, 'prismstaff'], [150, 110, 'tent', 2], [24, 150, 'tigerclaw'], [124, 120, 'longbow'],
  ];
  for (const [x0, z0, item, n = 1] of L) {
    // a chest that would land in the water moves to the nearest dry ground
    let x = x0, z = z0;
    for (let r = 0; r < 20 && ground(x, z) <= SEA + 1; r++) for (let a = 0; a < 8 && ground(x, z) <= SEA + 1; a++) { x = x0 + Math.round(Math.cos(a / 8 * Math.PI * 2) * r); z = z0 + Math.round(Math.sin(a / 8 * Math.PI * 2) * r); }
    W.chests.push({ id: `c${x0}_${z0}`, item, n, pos: [x + 0.5, ground(x, z), z + 0.5] });
  }
}
// stones that heal, save and let you warp between the ones you have touched
function placeHomes() {
  for (const [id, x, z] of [['h_hearth', 98, 162], ['h_forest', 44, 128], ['h_coast', 160, 124], ['h_dune', 142, 100], ['h_frost', 60, 84], ['h_peak', 40, 52], ['h_spire', 112, 30]]) W.homes.push({ id, pos: [x + 0.5, ground(x, z), z + 0.5] });
}
// where monsters walk, by region
const SPAWN = {
  meadow: ['slime', 'bunny', 'chick', 'hog'], forest: ['caterpillar', 'monkey', 'orc', 'bluejelly'], coast: ['crab', 'fish', 'parrot', 'bluejelly'], lake: ['wisp', 'fish', 'ghost', 'minion'],
  mesa: ['lion', 'scorpion', 'tiger'], mountain: ['skeleton', 'skelmage', 'golem', 'zombie', 'yeti'], spire: ['vampire', 'crysgolem', 'skelrogue', 'ghost'],
};
function placeSpawns() {
  let k = 0;
  for (let z = 8; z < WZ - 8; z += 9) for (let x = 8; x < WX - 8; x += 9) {
    const reg = regionAt(x, z), list = SPAWN[reg];
    if (!list || REGIONS[reg].town) continue;
    if (rand(x, z, 21) > 0.42) continue;
    const gy = ground(x, z);
    if (gy <= SEA + 1) continue;
    W.spawns.push({ id: 's' + (k++), monster: list[Math.floor(rand(x, z, 22) * list.length)], pos: [x + 0.5, gy, z + 0.5] });
  }
  // the bosses that guard the way
  W.spawns.push({ id: 'b_treant', monster: 'treant', boss: true, pos: [34.5, ground(34, 116), 116.5] });
  W.spawns.push({ id: 'b_mesa', monster: 'mesaking', boss: true, pos: [150.5, ground(150, 42), 42.5] });
  W.spawns.push({ id: 'b_wyrm', monster: 'frostwyrm', boss: true, pos: [34.5, ground(34, 40), 40.5] });
}

// KayKit trees, rocks and props scattered over the open ground; trees get an invisible post to bump into
function placeDecor() {
  const TREES = ['hex/tree_single_A.gltf', 'hex/tree_single_B.gltf', 'hex/trees_A_small.gltf', 'hex/trees_B_small.gltf', 'hex/trees_A_medium.gltf', 'hex/trees_B_medium.gltf'];
  const ROCKS = ['hex/rock_single_A.gltf', 'hex/rock_single_B.gltf', 'hex/rock_single_C.gltf', 'hex/rock_single_D.gltf', 'hex/rock_single_E.gltf'];
  for (let z = 6; z < WZ - 6; z += 3) for (let x = 6; x < WX - 6; x += 3) {
    const reg = regionAt(x, z), r = rand(x, z, 41);
    if (REGIONS[reg].town || isClear(x, z)) continue;
    const y = ground(x, z), top = get(x, y - 1, z);
    if (y <= SEA + 1 || solid(get(x, y, z))) continue;
    if (top === B.grass && (reg === 'meadow' || reg === 'lake' || reg === 'forest') && r < (reg === 'forest' ? 0.16 : 0.1)) {
      W.decor.push({ model: TREES[Math.floor(rand(x, z, 42) * TREES.length)], pos: [x + 0.5, y, z + 0.5], h: 3.2 + rand(x, z, 43) * 1.6, rot: rand(x, z, 44) * 6.28 });
      set(x, y, z, B.post); set(x, y + 1, z, B.post);
    } else if (r > 0.9 && reg !== 'spire') W.decor.push({ model: ROCKS[Math.floor(rand(x, z, 45) * ROCKS.length)], pos: [x + 0.5, y, z + 0.5], h: 0.5 + rand(x, z, 46) * 0.5, rot: rand(x, z, 47) * 6.28 });
  }
  // a lived-in village: crates, barrels, a weapon rack, flags
  const y = 9;
  for (const [m, x, z, h] of [['hex/barrel.gltf', 90, 164, 0.9], ['hex/crate_A_small.gltf', 91, 165, 0.8], ['hex/sack.gltf', 101, 165, 0.6], ['hex/weaponrack.gltf', 100, 160, 1.2], ['hex/flag_blue.gltf', 94, 160, 1.7], ['hex/flag_blue.gltf', 99, 160, 1.7], ['hex/wheelbarrow.gltf', 110, 166, 0.9], ['hex/bucket_water.gltf', 97, 165, 0.5], ['hex/resource_lumber.gltf', 85, 166, 0.8]]) W.decor.push({ model: m, pos: [x + 0.5, y, z + 0.5], h, rot: rand(x, z, 3) * 6.28 });
  for (const [x, z] of [[124, 96], [154, 98], [52, 88]]) W.decor.push({ model: 'hex/tent.gltf', pos: [x + 0.5, ground(x, z), z + 0.5], h: 2.2, rot: rand(x, z, 4) * 6.28 });
  // lily pads on the lake
  for (let k = 0; k < 18; k++) { const a = rand(k, 1, 50) * 6.28, d = 6 + rand(k, 2, 51) * 10, x = Math.floor(100 + Math.cos(a) * d), z = Math.floor(96 + Math.sin(a) * d); if (get(x, SEA, z) === B.water) W.decor.push({ model: 'hex/waterlily_A.gltf', pos: [x + 0.5, SEA + 0.85, z + 0.5], h: 0.12, rot: a, flat: true }); }
}

// ---------- meshing ----------
let atlasInfo = null;
export function setAtlas(info) { atlasInfo = info; }
const DIRS = [
  { n: [0, 1, 0], c: [[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0]], f: 0, shade: 1.0 },
  { n: [0, -1, 0], c: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]], f: 2, shade: 0.5 },
  { n: [1, 0, 0], c: [[1, 0, 1], [1, 0, 0], [1, 1, 0], [1, 1, 1]], f: 1, shade: 0.8 },
  { n: [-1, 0, 0], c: [[0, 0, 0], [0, 0, 1], [0, 1, 1], [0, 1, 0]], f: 1, shade: 0.72 },
  { n: [0, 0, 1], c: [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]], f: 1, shade: 0.88 },
  { n: [0, 0, -1], c: [[1, 0, 0], [0, 0, 0], [0, 1, 0], [1, 1, 0]], f: 1, shade: 0.66 },
];
export const CHUNK = 16;
export function buildChunk(cx, cz) {
  const pos = [], uv = [], col = [], ind = [];
  const { size, cols, rows, faces } = atlasInfo, du = 1 / cols, dv = 1 / rows, pad = 0.5 / (size * cols);
  for (let x = cx * CHUNK; x < Math.min(WX, cx * CHUNK + CHUNK); x++) for (let z = cz * CHUNK; z < Math.min(WZ, cz * CHUNK + CHUNK); z++) for (let y = 0; y < WY; y++) {
    const id = get(x, y, z);
    if (!opaque(id)) continue;
    for (const d of DIRS) {
      const nb = get(x + d.n[0], y + d.n[1], z + d.n[2]);
      if (opaque(nb) && !(nb === B.leaves && id !== B.leaves)) continue;
      if (y + d.n[1] < 0) continue;
      const fi = faces[FACES[id][d.f]], u0 = (fi % cols) * du + pad, v0 = 1 - (Math.floor(fi / cols) + 1) * dv + pad, u1 = u0 + du - pad * 2, v1 = v0 + dv - pad * 2;
      const base = pos.length / 3;
      // ambient occlusion: each corner darkens with the blocks crowding it from the layer in front of the face
      const s = d.shade * (0.95 + rand(x, z, y) * 0.05), ax = d.n.map((v) => (v ? 0 : 1)), ox = x + d.n[0], oy = y + d.n[1], oz = z + d.n[2];
      for (const [a, b2, c] of d.c) {
        const off = [a, b2, c].map((v, i) => (ax[i] ? (v ? 1 : -1) : 0)), axes = [0, 1, 2].filter((i) => ax[i]);
        const u = [0, 0, 0], v2 = [0, 0, 0]; u[axes[0]] = off[axes[0]]; v2[axes[1]] = off[axes[1]];
        const s1 = opaque(get(ox + u[0], oy + u[1], oz + u[2])) ? 1 : 0, s2 = opaque(get(ox + v2[0], oy + v2[1], oz + v2[2])) ? 1 : 0, cr = opaque(get(ox + u[0] + v2[0], oy + u[1] + v2[1], oz + u[2] + v2[2])) ? 1 : 0;
        const ao = s1 && s2 ? 0 : 3 - (s1 + s2 + cr), k = s * [0.5, 0.68, 0.84, 1][ao];
        pos.push(x + a, y + b2, z + c); col.push(k, k, k);
      }
      uv.push(u0, v0, u1, v0, u1, v1, u0, v1);
      ind.push(base, base + 1, base + 2, base, base + 2, base + 3);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(ind);
  g.computeVertexNormals();
  g.computeBoundingSphere();
  return g;
}
