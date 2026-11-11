// The world: one continent of blocks, 966 x 966 columns and 64 high, generated from fixed seeds so it is the
// same for everyone. Regions shape the ground (meadow, forests, a marsh, a mushroom grove, the coast, the lake,
// the mesa, a volcano, the old capital's ruins, mountains, a frozen plain, the spire); villages, ruins and the
// spire are built on top, and the whole thing is turned into chunk meshes for three.js as you walk.
import * as THREE from 'three';

// the land was first laid out on a 432-block map; every place is scaled up by K so the area is five times larger
export const K = 966 / 432;
export const WX = 966, WZ = 966, WY = 64, SEA = 6;
export const sc = (v) => Math.round(v * K);
// block ids; the atlas faces are [top, side, bottom]
export const B = { post: 21, air: 0, grass: 1, dirt: 2, stone: 3, sand: 4, snow: 5, ice: 6, wood: 7, leaves: 8, redsand: 9, redstone: 10, brick: 11, gravel: 12, crystal: 13, cobble: 14, orange: 15, birch: 16, plank: 17, lava: 18, mushroom: 19, water: 20, cactus: 22, moss: 23, mud: 24 };
const FACES = {
  1: ['grass_top', 'dirt_grass', 'dirt'], 2: ['dirt', 'dirt', 'dirt'], 3: ['greystone', 'greystone', 'greystone'], 4: ['sand', 'sand', 'sand'], 5: ['snow', 'dirt_snow', 'dirt'],
  6: ['ice', 'ice', 'ice'], 7: ['trunk_top', 'trunk_side', 'trunk_top'], 8: ['leaves', 'leaves', 'leaves'], 9: ['redsand', 'redsand', 'redsand'], 10: ['redstone', 'redstone', 'redstone'],
  11: ['brick_grey', 'brick_grey', 'brick_grey'], 12: ['gravel_stone', 'gravel_stone', 'gravel_stone'], 13: ['stone_diamond', 'stone_diamond', 'stone_diamond'], 14: ['stone', 'stone', 'stone'],
  15: ['leaves_orange', 'leaves_orange', 'leaves_orange'], 16: ['trunk_top', 'trunk_white_side', 'trunk_top'], 17: ['table', 'brick_red', 'table'], 18: ['lava', 'lava', 'lava'],
  19: ['mushcap', 'mushcap', 'mushcap'], 22: ['cactus_top', 'cactus_side', 'cactus_top'], 23: ['mossstone', 'stone_grass', 'greystone'], 24: ['dirt', 'dirt', 'dirt'],
};
// water and lava are not solid: you cannot stand in them, and the player treats both as walls
export const solid = (id) => id !== 0 && id !== B.water && id !== B.lava;
// blocks you see; the post is solid but invisible, standing inside a model's trunk; lava is drawn though not solid
const opaque = (id) => (solid(id) && id !== B.post) || id === B.lava;
// the camera looks through leaves and mushroom caps
export const seeThrough = (id) => id === B.leaves || id === B.orange || id === B.mushroom;

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
// each place has a centre, a radius, a music and a battle backdrop; whichever is nearest (scaled by radius) names the ground
export const REGIONS = {
  meadow:   { name: ['晨風原', 'Dawnbreeze Fields'], c: [216, 330], r: 85, music: 'field', bg: 'grass' },
  hearth:   { name: ['爐心村', 'Hearthvale'], c: [216, 384], r: 14, music: 'village', bg: 'grass', town: true, base: 9 },
  fenside:  { name: ['芬邊村', 'Fenside'], c: [140, 372], r: 10, music: 'village', bg: 'grass', town: true, base: 8 },
  forest:   { name: ['低語林', 'Whisperwood'], c: [88, 286], r: 70, music: 'forest', bg: 'forest' },
  mistfen:  { name: ['霧沼', 'Mistfen'], c: [70, 398], r: 50, music: 'sad', bg: 'marsh' },
  sporewood:{ name: ['孢子林', 'Sporewood'], c: [336, 392], r: 46, music: 'forest', bg: 'spore' },
  lake:     { name: ['鏡湖', 'Mirror Lake'], c: [216, 232], r: 40, music: 'lake', bg: 'grass' },
  coast:    { name: ['白貝海岸', 'Shellshore'], c: [392, 280], r: 52, music: 'coast', bg: 'sand' },
  saltmere: { name: ['鹽灣港', 'Saltmere'], c: [378, 336], r: 10, music: 'village', bg: 'sand', town: true, base: 8 },
  dunewell: { name: ['沙泉鎮', 'Dunewell'], c: [318, 226], r: 10, music: 'village', bg: 'sand', town: true, base: 13 },
  mesa:     { name: ['赤砂台地', 'Redsand Mesa'], c: [332, 138], r: 72, music: 'mesa', bg: 'redsand' },
  ember:    { name: ['熔岩峰', 'Emberpeak'], c: [396, 52], r: 46, music: 'cave', bg: 'ember' },
  ruins:    { name: ['古都遺跡', 'Old Lumera'], c: [218, 132], r: 42, music: 'cave', bg: 'stone' },
  spire:    { name: ['稜晶尖塔', 'The Prism Spire'], c: [218, 40], r: 30, music: 'spire', bg: 'crystal' },
  mountain: { name: ['灰脊山', 'Greyridge'], c: [90, 122], r: 84, music: 'mountain', bg: 'stone' },
  frostgate:{ name: ['霜門村', 'Frostgate'], c: [138, 178], r: 10, music: 'village', bg: 'snow', town: true, base: 14 },
  rimefield:{ name: ['霜原', 'Rimefield'], c: [58, 32], r: 48, music: 'mountain', bg: 'snow' },
};
// the east coast: the shore runs north to south and bends out to sea north of the coast
const shoreX = (z) => 404 * K + Math.sin(z / (23 * K)) * 5 * K + Math.max(0, 196 * K - z) * 1.6;
for (const r of Object.values(REGIONS)) { r.c0 = r.c; r.c = r.c.map(sc); if (!r.town) r.r = Math.round(r.r * K); }
// the port sits right by the water so its pier reaches the sea
REGIONS.saltmere.c[0] = Math.round(shoreX(REGIONS.saltmere.c[1])) - 30;
// a village is built from its old plan, moved to where its centre is now
export const tw = (town) => { const r = REGIONS[town]; return (x, z) => [x + r.c[0] - r.c0[0], z + r.c[1] - r.c0[1]]; };
const TOWNS = Object.keys(REGIONS).filter((k) => REGIONS[k].town);
const REG_IDS = Object.keys(REGIONS), REG_C = REG_IDS.map((id) => REGIONS[id]);
function regionSlow(x, z) {
  let best = 0, bd = Infinity;
  for (let i = 0; i < REG_C.length; i++) { const r = REG_C[i], dx = x - r.c[0], dz = z - r.c[1], d = Math.sqrt(dx * dx + dz * dz) / r.r * (r.town ? 0.7 : 1); if (d < bd) { bd = d; best = i; } }
  return best;
}
// once the world is made, every column remembers its region
const REG = new Uint8Array(WX * WZ); let regReady = false;
export function regionAt(x, z) {
  x = Math.floor(x); z = Math.floor(z);
  if (regReady && x >= 0 && z >= 0 && x < WX && z < WZ) return REG_IDS[REG[z * WX + x]];
  return REG_IDS[regionSlow(x, z)];
}
const near = (x, z, id) => { const r = REGIONS[id]; return Math.max(0, 1 - Math.hypot(x - r.c[0], z - r.c[1]) / r.r); };

// ---------- the ground ----------
function columnHeight(x, z) {
  let h = 9 + (fbm(x / 110, z / 110, 1) - 0.5) * 10 + (fbm(x / 26, z / 26, 2) - 0.5) * 3;
  // the forests roll a little more
  const fo = near(x, z, 'forest'), sw = near(x, z, 'sporewood');
  if (fo > 0) h += fo * (fbm(x / 20, z / 20, 3) * 4);
  if (sw > 0) h += sw * (fbm(x / 16, z / 16, 6) * 3);
  // mountains: ridges climbing toward snowy peaks
  const m = near(x, z, 'mountain');
  if (m > 0) h += Math.pow(m, 1.3) * 44 * (0.65 + fbm(x / 18, z / 18, 4) * 0.5);
  // the frozen plain: a high flat shelf
  const ri = near(x, z, 'rimefield');
  if (ri > 0) h += (15 + (fbm(x / 12, z / 12, 7) - 0.5) * 2 - h) * Math.min(1, ri * 2.2);
  // the mesa: terraces three blocks tall with sheer sides
  const me = near(x, z, 'mesa');
  if (me > 0.15) { const t = 12 + Math.floor((me - 0.15) * 7 + fbm(x / 22, z / 22, 5) * 2.2) * 3; h = Math.max(h, t); }
  // the volcano: a cone with a crater of lava
  const v = near(x, z, 'ember');
  if (v > 0) { let cone = 9 + Math.pow(v, 1.1) * 40 + (fbm(x / 9, z / 9, 8) - 0.5) * 3; if (v > 0.84) cone -= (v - 0.84) / 0.16 * 9; h = Math.max(h, cone); }
  // the old capital stood on a broad flat terrace
  const ru = near(x, z, 'ruins');
  if (ru > 0) h += (14 - h) * Math.min(1, ru * 2);
  // the spire stands on a high plateau
  const sp = near(x, z, 'spire');
  if (sp > 0) h = Math.max(h, 10 + Math.min(1, sp * 2.2) * 14);
  // the marsh: low, wet ground broken by pools
  const f = near(x, z, 'mistfen');
  if (f > 0) { h += (7.6 - h) * Math.min(1, f * 2.5); if (f > 0.12 && fbm(x / 8, z / 8, 31) > 0.6) h = SEA - 1; }
  // the lake, and the sea along the east coast
  const lk = near(x, z, 'lake');
  if (lk > 0.25) h = Math.min(h, SEA - 1 - Math.floor((lk - 0.25) * 5));
  const shore = x - shoreX(z);
  if (shore > 0) h = Math.min(h, SEA + 1 - shore * 0.6);
  // villages sit on flat ground
  for (const t of TOWNS) { const k = near(x, z, t); if (k > 0) h = h + (REGIONS[t].base - h) * Math.min(1, k * 2.5); }
  // the edge of the world: cliffs, and deep water to the east
  const east = shoreX(z) > WX - 12 ? WX - 1 - x : 99;
  const edge = Math.min(x, z, WZ - 1 - z, east);
  if (edge < 6) h = Math.max(h, 26 - edge * 2);
  if (x > WX - 10 && shoreX(z) < WX - 12) h = Math.min(h, SEA - 3);
  return Math.max(1, Math.min(WY - 6, Math.round(h)));
}
function topBlock(x, z, h, steep) {
  const reg = regionAt(x, z), r = rand(x, z, 5);
  if (h <= SEA + 1 && (reg === 'coast' || reg === 'saltmere' || x > shoreX(z) - 14 || near(x, z, 'lake') > 0.15)) return B.sand;
  if (reg === 'mesa' || reg === 'dunewell') return steep ? B.redstone : B.redsand;
  if (reg === 'ember') return steep ? B.redstone : r < 0.35 ? B.gravel : B.redstone;
  if (reg === 'mountain' || reg === 'frostgate') return h > 34 ? B.snow : steep ? B.stone : h > 26 ? B.gravel : B.grass;
  if (reg === 'rimefield') return steep ? B.stone : B.snow;
  if (reg === 'spire') return B.cobble;
  if (reg === 'ruins') return steep ? B.stone : r < 0.3 ? B.gravel : r < 0.42 ? B.moss : B.grass;
  if (reg === 'mistfen') return steep ? B.moss : r < 0.3 ? B.mud : B.grass;
  return steep ? B.stone : B.grass;
}

// ---------- the world grid ----------
export const W = { data: new Uint8Array(WX * WY * WZ), height: new Int16Array(WX * WZ), ents: [], crystals: [], homes: [], chests: [], spawns: [], decor: [], shards: [], signs: [], herbs: [], fish: [], ein: [] };
const idx = (x, y, z) => (z * WX + x) * WY + y;
let OX = 0, OZ = 0;
const building = (town) => { if (town) { const r = REGIONS[town]; OX = r.c[0] - r.c0[0]; OZ = r.c[1] - r.c0[1]; } else OX = OZ = 0; };
export function get(x, y, z) { x += OX; z += OZ; if (x < 0 || z < 0 || x >= WX || z >= WZ || y < 0) return B.stone; if (y >= WY) return B.air; return W.data[idx(x, y, z)]; }
export function set(x, y, z, id) { x += OX; z += OZ; if (x < 0 || z < 0 || x >= WX || z >= WZ || y < 0 || y >= WY) return; W.data[idx(x, y, z)] = id; }
export const ground = (x, z) => { x = Math.max(0, Math.min(WX - 1, Math.floor(x))); z = Math.max(0, Math.min(WZ - 1, Math.floor(z))); for (let y = WY - 1; y > 0; y--) if (solid(get(x, y, z))) return y + 1; return 1; };
// standing ground that is dry: not sea, lake, marsh pool or lava
const dry = (x, z) => { const g = ground(x, z), here = get(Math.floor(x), g, Math.floor(z)), top = get(Math.floor(x), g - 1, Math.floor(z)); return g > SEA + 1 && here !== B.water && here !== B.lava && !seeThrough(top) && top !== B.wood && top !== B.birch && top !== B.post && top !== B.cactus; };
// the nearest dry ground to (x0, z0), searching outward in rings
function dryNear(x0, z0, maxR = 70) {
  for (let r = 0; r <= maxR; r++) for (let a = 0; a < Math.max(1, r * 8); a++) {
    const x = Math.round(x0 + Math.cos(a / Math.max(1, r * 8) * Math.PI * 2) * r), z = Math.round(z0 + Math.sin(a / Math.max(1, r * 8) * Math.PI * 2) * r);
    if (x > 6 && z > 6 && x < WX - 7 && z < WZ - 7 && dry(x, z) && !solid(get(x, ground(x, z), z)) && !solid(get(x, ground(x, z) + 1, z))) return [x, z];
  }
  return [x0, z0];
}
const spot = (x, z, dy = 0) => { const [a, b] = dryNear(x, z); return [a + 0.5, ground(a, b) + dy, b + 0.5]; };

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
// a giant mushroom: a pale stem and a wide red cap
function mushroom(x, y, z, h = 5 + Math.floor(rand(x, z, 13) * 4)) {
  for (let k = 0; k < h; k++) set(x, y + k, z, B.birch);
  const r = h > 7 ? 3 : 2;
  for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) { const d = Math.hypot(dx, dz); if (d <= r + 0.4 && get(x + dx, y + h, z + dz) === B.air) set(x + dx, y + h, z + dz, B.mushroom); if (d <= r - 0.8 && get(x + dx, y + h + 1, z + dz) === B.air) set(x + dx, y + h + 1, z + dz, B.mushroom); }
  return y + h + 2;
}
// a little house: walls, a door gap, a sloped roof
function house(x, y, z, w = 5, d = 5, wall = B.plank, roof = B.brick) {
  fill(x - 1, y - 1, z - 1, x + w, y - 1, z + d, B.cobble);
  fill(x - 1, y, z - 1, x + w, y + 3 + (w >> 1) + 2, z + d, B.air);
  for (let k = 0; k < 3; k++) for (let i = 0; i < w; i++) for (let j = 0; j < d; j++) { if (i === 0 || j === 0 || i === w - 1 || j === d - 1) set(x + i, y + k, z + j, wall); }
  set(x + (w >> 1), y, z + d - 1, B.air); set(x + (w >> 1), y + 1, z + d - 1, B.air);
  for (let r = 0; r <= (w >> 1) + 1; r++) for (let j = -1; j <= d; j++) { set(x - 1 + r, y + 3 + r, z + j, roof); set(x + w - r, y + 3 + r, z + j, roof); }
  return [x + (w >> 1) + 0.5, y, z + d + 0.5];
}
const npc = (id, model, pos, talk, extra = {}) => W.ents.push({ type: 'npc', id, model: 'chars/' + model, pos: [pos[0] + OX, pos[1], pos[2] + OZ], face: 0, talk, ...extra });
const prop = (...ps) => { for (const p of ps) W.ents.push({ ...p, pos: [p.pos[0] + OX, p.pos[1], p.pos[2] + OZ] }); };

// key places other modules look up: villages' people, crystals, chests, home stones, monster spawns and the rest
export function generate() {
  const { data, height } = W;
  data.fill(0);
  regReady = false; for (let z = 0; z < WZ; z++) for (let x = 0; x < WX; x++) REG[z * WX + x] = regionSlow(x, z); regReady = true;
  for (let z = 0; z < WZ; z++) for (let x = 0; x < WX; x++) height[z * WX + x] = columnHeight(x, z);
  for (let z = 0; z < WZ; z++) for (let x = 0; x < WX; x++) {
    const h = height[z * WX + x];
    let steep = 0; for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const n = height[Math.min(WZ - 1, Math.max(0, z + dz)) * WX + Math.min(WX - 1, Math.max(0, x + dx))]; steep = Math.max(steep, h - n); }
    const top = topBlock(x, z, h, steep >= 3), reg = regionAt(x, z);
    const base = (z * WX + x) * WY, under = top === B.redsand || top === B.redstone ? B.redstone : top === B.sand ? B.sand : top === B.cobble || top === B.gravel ? B.stone : B.dirt;
    for (let y = 0; y < h; y++) {
      let id = y === h - 1 ? top : y > h - 4 ? under : B.stone;
      if (reg === 'mesa' && y < h - 1 && y % 3 === 0) id = B.redsand;
      data[base + y] = id;
    }
    for (let y = h; y <= SEA; y++) data[base + y] = B.water;
    if (top === B.snow && h > 36 && rand(x, z, 9) > 0.7) set(x, h - 1, z, B.ice);
    // frozen ponds on the plain
    if (reg === 'rimefield' && fbm(x / 10, z / 10, 33) > 0.64) set(x, h - 1, z, B.ice);
    // the volcano's crater glows
    if (reg === 'ember' && near(x, z, 'ember') > 0.93) set(x, h - 1, z, B.lava);
  }
  // trees and mushrooms; block trees thin out where the KayKit trees stand in for them
  for (let z = 6; z < WZ - 6; z++) for (let x = 6; x < WX - 6; x++) {
    const h = height[z * WX + x], reg = regionAt(x, z), top = get(x, h - 1, z);
    if (h <= SEA + 1 || isClear(x, z)) continue;
    const r = rand(x, z, 11);
    if (reg === 'sporewood' && top === B.grass) { if (r < 0.012) mushroom(x, h, z); continue; }
    if (reg === 'mesa' || reg === 'dunewell') { if (top === B.redsand && r < 0.004) { const k = 2 + Math.floor(rand(x, z, 14) * 2); for (let y = 0; y < k; y++) set(x, h + y, z, B.cactus); } continue; }
    if (top !== B.grass) continue;
    const p = reg === 'forest' ? 0.03 : reg === 'lake' ? 0.008 : reg === 'mountain' ? 0.012 : reg === 'mistfen' ? 0.014 : 0;
    if (r < p) tree(x, h, z, reg === 'lake' ? 'birch' : reg === 'forest' && rand(x, z, 12) > 0.8 ? 'autumn' : 'oak');
  }
  W.ents = []; W.crystals = []; W.homes = []; W.chests = []; W.spawns = []; W.decor = []; W.shards = []; W.signs = []; W.herbs = []; W.fish = []; W.ein = [];
  for (const [town, f] of [['hearth', buildHearthvale], ['fenside', buildFenside], ['saltmere', buildSaltmere], ['dunewell', buildDunewell], ['frostgate', buildFrostgate]]) { building(town); f(); building(null); }
  buildHermit(); buildRuins(); buildSpire();
  placeCrystals(); placeChests(); placeHomes(); placeSpawns(); placeShards(); placeSigns(); placeHerbs(); placeFishing(); placeEin(); placeDecor();
  return W;
}
// villages, the ruins' heart and the spire keep their ground free of trees
function isClear(x, z) {
  for (const t of TOWNS) if (near(x, z, t) > 0) return true;
  if (Math.hypot(x - REGIONS.sporewood.c[0], z - REGIONS.sporewood.c[1]) < 7) return true;
  return Math.hypot(x - SPIRE.x, z - SPIRE.z) < sc(30) || Math.hypot(x - REGIONS.ruins.c[0], z - REGIONS.ruins.c[1]) < 12;
}

// ---------- villages ----------
function buildHearthvale() {
  const y = 9;
  const doorA = house(206, y, 376, 6, 5), doorB = house(223, y, 376, 5, 5, B.plank, B.brick), doorC = house(212, y, 388, 5, 5, B.birch, B.brick);
  // a well in the square, a field of wheat
  fill(215, y, 384, 217, y, 386, B.cobble); set(216, y, 385, B.water);
  for (let x = 224; x <= 230; x++) for (let z = 386; z <= 392; z++) if (z % 2 === 0) set(x, y - 1, z, B.dirt);
  npc('elder', 'character-q', [216.5, y, 381.5], 'hv_elder');
  npc('shop1', 'character-f', [doorB[0], y, doorB[2] + 1], 'hv_shop', { shop: 'hearthvale' });
  npc('inn1', 'character-m', [doorA[0], y, doorA[2] + 1], 'hv_inn', { inn: true });
  npc('kid1', 'character-n', [220.5, y, 385.5], 'hv_kid', { face: 1 });
  npc('farmer1', 'character-c', [227.5, y, 389.5], 'hv_farmer', { face: 2 });
  npc('sage1', 'character-p', [doorC[0], y, doorC[2] + 1], 'hv_sage');
  npc('mom1', 'character-k', [210.5, y, 384.5], 'hv_mom', { face: 3 });
  prop({ type: 'prop', model: 'grave/lightpost-single', pos: [213.5, y, 381.5] }, { type: 'prop', model: 'grave/lightpost-single', pos: [219.5, y, 381.5] },
    { type: 'prop', model: 'grave/hay-bale', pos: [231.5, y, 385.5] }, { type: 'prop', model: 'dungeon/barrel', pos: [209.5, y, 382.5] });
  // a road north out of the village
  for (let z = 236; z < 376; z++) for (let w = -1; w <= 1; w++) { const x = 216 + w + Math.round(Math.sin(z / 9) * 2), g = ground(x, z); if (get(x, g - 1, z) === B.grass) set(x, g - 1, z, B.gravel); }
}
function buildFenside() {
  const y = 8;
  const a = house(132, y, 364, 5, 5, B.wood, B.moss), b = house(144, y, 366, 5, 5, B.wood, B.moss);
  npc('healer', 'character-k', [a[0], y, a[2] + 1], 'fs_healer');
  npc('granny', 'character-a', [b[0], y, b[2] + 1], 'fs_granny');
  npc('fenkid', 'character-d', [139.5, y, 376.5], 'fs_kid', { face: 2 });
  npc('shop4', 'character-g', [146.5, y, 377.5], 'fs_shop', { shop: 'fenside' });
  prop({ type: 'prop', model: 'grave/lantern-candle', pos: [137.5, y, 371.5] }, { type: 'prop', model: 'grave/bench', pos: [141.5, y, 372.5] });
}
function buildSaltmere() {
  const y = 8;
  const a = house(366, y, 326, 6, 5, B.plank, B.brick), b = house(380, y, 324, 5, 5, B.birch, B.brick), c = house(370, y, 340, 5, 5, B.plank, B.stone);
  // a pier out over the sea
  for (let x = 384; x <= 422; x++) for (let z = 335; z <= 337; z++) { if (ground(x, z) <= y) { set(x, y - 1, z, B.plank); for (let yy = 1; yy < y - 1; yy++) if (!solid(get(x, yy, z)) && (x % 4 === 0) && z !== 336) set(x, yy, z, B.wood); } }
  npc('shop5', 'character-b', [a[0], y, a[2] + 1], 'sm_shop', { shop: 'saltmere' });
  npc('inn5', 'character-o', [b[0], y, b[2] + 1], 'sm_inn', { inn: true });
  npc('fisher', 'character-r', [419.5, y, 337.5], 'sm_fisher', { face: 1 });
  npc('sister', 'character-h', [c[0], y, c[2] + 1], 'sm_sister');
  npc('sailor', 'character-e', [388.5, y, 333.5], 'sm_sailor', { face: 1 });
  prop({ type: 'prop', model: 'dungeon/barrel', pos: [386.5, y, 337.5] }, { type: 'prop', model: 'dungeon/barrel', pos: [387.5, y, 338.5] }, { type: 'prop', model: 'grave/lightpost-single', pos: [384.5, y, 334.5] });
}
function buildDunewell() {
  const y = 13;
  fill(314, y - 1, 222, 322, y - 1, 230, B.water); fill(315, y - 1, 223, 321, y - 1, 229, B.water);
  for (let x = 312; x <= 324; x++) for (let z = 220; z <= 232; z++) if ((x === 312 || x === 324 || z === 220 || z === 232) && get(x, y - 1, z) !== B.water) set(x, y - 1, z, B.sand);
  const dA = house(304, y, 220, 5, 5, B.redstone, B.redsand), dB = house(326, y, 222, 5, 5, B.redstone, B.redsand);
  tree(313, y, 221, 'oak'); tree(323, y, 231, 'oak');
  npc('shop2', 'character-g', [dA[0], y, dA[2] + 1], 'dw_shop', { shop: 'dunewell' });
  npc('inn2', 'character-l', [dB[0], y, dB[2] + 1], 'dw_inn', { inn: true });
  npc('digger', 'character-j', [318.5, y, 233.5], 'dw_digger');
  npc('nomad', 'character-e', [311.5, y, 226.5], 'dw_nomad', { face: 3 });
}
function buildFrostgate() {
  const y = 14;
  const fA = house(131, y, 172, 5, 5, B.birch, B.stone), fB = house(142, y, 173, 5, 5, B.birch, B.stone);
  npc('shop3', 'character-i', [fA[0], y, fA[2] + 1], 'fg_shop', { shop: 'frostgate' });
  npc('inn3', 'character-o', [fB[0], y, fB[2] + 1], 'fg_inn', { inn: true });
  npc('climber', 'character-b', [138.5, y, 185.5], 'fg_climber');
  npc('guard', 'character-d', [133.5, y, 183.5], 'fg_guard', { face: 3 });
  prop({ type: 'prop', model: 'grave/fire-basket', pos: [138.5, y, 180.5] });
}
// a hermit's hut in the middle of the mushroom grove
function buildHermit() {
  const [cx, cz] = REGIONS.sporewood.c, x = cx - 2, z = cz - 4, y = ground(cx, cz);
  fill(x - 3, y - 1, z - 3, x + 7, y - 1, z + 9, B.grass);
  const d = house(x, y, z, 5, 5, B.birch, B.mushroom);
  npc('hermit', 'character-a', [d[0], y, d[2] + 1], 'sw_hermit');
}
// the old capital: broken walls on a grid of streets, a toppled gate and a ruined tower at its heart
function buildRuins() {
  const [cx, cz] = REGIONS.ruins.c, y = 14;
  for (let gx = -4; gx <= 4; gx++) for (let gz = -4; gz <= 4; gz++) {
    const x0 = cx + gx * 8, z0 = cz + gz * 8;
    if (Math.hypot(gx, gz) < 1.2 || Math.hypot(gx, gz) > 4.3 || rand(gx, gz, 61) < 0.25) continue;
    const alongX = rand(gx, gz, 62) < 0.5, len = 4 + Math.floor(rand(gx, gz, 63) * 4);
    for (let k = 0; k < len; k++) {
      const x = x0 + (alongX ? k : 0), z = z0 + (alongX ? 0 : k), g = ground(x, z), hh = 1 + Math.floor(rand(x, z, 64) * 4);
      for (let yy = 0; yy < hh; yy++) set(x, g + yy, z, rand(x, z + yy, 65) < 0.3 ? B.moss : rand(x, yy, 66) < 0.5 ? B.brick : B.cobble);
    }
  }
  // the tower: a hollow square of brick, its top broken off; stairs wind up the outside
  for (let yy = y; yy < y + 11; yy++) for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) if (Math.abs(dx) === 2 || Math.abs(dz) === 2 || yy === y + 10) if (!(yy > y + 8 && rand(dx, dz, 67) < 0.4)) set(cx + dx, yy, cz + dz, yy % 5 === 0 ? B.moss : B.brick);
  fill(cx - 1, y + 10, cz - 1, cx + 1, y + 10, cz + 1, B.brick);
  const ring = [[-3, -3], [-1, -3], [1, -3], [3, -3], [3, -1], [3, 1], [3, 3], [1, 3], [-1, 3], [-3, 3], [-3, 1]];
  ring.forEach(([dx, dz], i) => { const top = y + 1 + i; for (let yy = y; yy < top; yy++) set(cx + dx, yy, cz + dz, B.cobble); });
  // a gate of two columns facing the road south
  for (const s of [-3, 3]) { const g = ground(cx + s, cz + 30); for (let yy = 0; yy < 6; yy++) set(cx + s, g + yy, cz + 30, B.brick); }
  W.ents.push({ type: 'prop', model: 'grave/pillar-obelisk', pos: [cx - 6.5, y, cz + 8.5] }, { type: 'prop', model: 'grave/pillar-obelisk', pos: [cx + 7.5, y, cz + 8.5] });
}
// the spire: a ring of stone climbing in a spiral to a platform where the last guardian waits
export const SPIRE = { x: sc(218), z: sc(40), base: 24, top: 54 };
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

// ---------- crystals ----------
// eight job crystals, each somewhere you have to work to reach
export const CRYSTALS = [
  { job: 'guardian', pos: [62, 300], how: 'pillar' },
  { job: 'ranger', pos: [420, 296], how: 'seastack' },
  { job: 'bard', pos: [216, 232], how: 'island' },
  { job: 'monk', pos: [124, 96], how: 'ledge' },
  { job: 'alchemist', pos: [372, 128], how: 'mesatop' },
  { job: 'chrono', pos: [218, 132], how: 'tower' },
  { job: 'dancer', pos: [322, 374], how: 'treetops' },
  { job: 'astro', pos: [90, 122], how: 'summit' },
];
for (const c of CRYSTALS) c.pos = c.pos.map(sc);
let summit = [0, 0];
function placeCrystals() {
  for (const c of CRYSTALS) {
    let [x, z] = c.pos;
    let y = ground(x, z);
    if (c.how === 'pillar') { y = column(x, z, y + 7, B.stone); stairs(x, z, -1, 0, 2, B.stone); }
    if (c.how === 'ledge') { y = column(x, z, y + 7, B.stone); stairs(x, z, 0, 1, 2, B.stone); }
    if (c.how === 'mesatop') { y = column(x, z, y + 3, B.redstone); stairs(x, z, 1, 0, 3, B.redstone); }
    // stepping stones out over the water, one block apart, each a little higher than the last
    if (c.how === 'seastack') { y = column(x, z, SEA + 6, B.stone); hops(x, z, -1, 0, SEA + 6, B.stone); }
    if (c.how === 'island') { for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) column(x + dx, z + dz, SEA + 2, B.sand); y = SEA + 2; hops(x, z, 0, 1, SEA + 3, B.stone, 1, 2); tree(x + 1, y, z + 1, 'birch'); }
    // the tops of mushroom stems, rising one block each, with gaps to jump
    if (c.how === 'treetops') { for (let dx = -26; dx <= 3; dx++) for (let dz = -4; dz <= 4; dz++) for (let yy = 8; yy < 40; yy++) { const id = get(x + dx, yy, z + dz); if (id === B.mushroom || id === B.birch) set(x + dx, yy, z + dz, B.air); } const g0 = ground(x, z); y = column(x, z, g0 + 9, B.birch); hops(x, z, -1, 0, g0 + 8, B.birch, 1); for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (dx || dz) set(x + dx, y - 1, z + dz, B.mushroom); }
    if (c.how === 'tower') y = 25;
    // the highest point of the mountain
    if (c.how === 'summit') { let best = 0; for (let dx = -36; dx <= 36; dx++) for (let dz = -36; dz <= 36; dz++) { const g = ground(x + dx, z + dz); if (g > best) { best = g; summit = [x + dx, z + dz]; } } [x, z] = summit; y = ground(x, z); }
    W.crystals.push({ job: c.job, pos: [x + 0.5, y + 0.8, z + 0.5] });
  }
}
// fill a column up to (not including) height top; returns the standing height on it
function column(x, z, top, id) { for (let y = 1; y < top; y++) if (!solid(get(x, y, z)) || seeThrough(get(x, y, z))) set(x, y, z, id); return top; }
// steps leading away from (x, z) in direction (dx, dz), each `step` lower than the one before, until they meet the ground
function stairs(x, z, dx, dz, step, id) {
  let h = ground(x, z) - step;
  for (let k = 1; k < 20; k++) { const sx = x + dx * k, sz = z + dz * k; if (h <= ground(sx, sz)) break; column(sx, sz, h, id); h -= step; }
}
// posts with a one-block gap between them, each `drop` lower than the last, until one reaches dry ground
function hops(x, z, dx, dz, h, id, drop = 1, k0 = 1) {
  for (let k = k0; k < 70; k++) { const sx = x + dx * k * 2, sz = z + dz * k * 2; h -= drop; const g = ground(sx, sz); if (g > SEA + 1 && h <= g + 1) break; column(sx, sz, Math.max(SEA + 2, h), id); }
}

// ---------- chests and home stones ----------
function placeChests() {
  const L = [
    // around Hearthvale and the fields
    [190, 350, 'potion', 3], [252, 342, 'ether', 2], [170, 300, 'leathervest'], [262, 284, 'emerald'], [244, 410, 'shortbow'],
    // Fenside and the marsh
    [152, 392, 'potion', 2], [58, 420, 'powerring'], [30, 386, 'hipotion', 2], [96, 414, 'phoenix'], [44, 360, 'moonbow'],
    // the forest
    [48, 276, 'kris'], [112, 262, 'tent', 2], [72, 322, 'charm'], [30, 300, 'ether', 2],
    // the lake and the coast
    [244, 200, 'sagering'], [182, 246, 'hipotion'], [400, 252, 'hipotion', 2], [372, 296, 'longbow'], [396, 360, 'fishcharm'],
    // the mushroom grove
    [308, 380, 'tigerclaw'], [352, 412, 'ether', 3], [366, 378, 'hipotion', 2],
    // Dunewell and the mesa
    [330, 244, 'boots'], [290, 214, 'tent', 2], [360, 110, 'warhammer'], [300, 150, 'phoenix', 2], [346, 92, 'chainmail'], [384, 160, 'thriftring'],
    // the volcano
    [412, 74, 'flamering'], [380, 28, 'regenring'], [396, 52, 'emberblade'],
    // the ruins
    [200, 110, 'guardring'], [238, 120, 'runeblade'], [212, 154, 'ether', 3], [196, 140, 'blackbelt'],
    // the mountains and the frozen plain
    [98, 84, 'cape'], [56, 112, 'frostmail'], [122, 150, 'phoenix'], [40, 44, 'starrod'], [84, 20, 'ribbon'], [24, 62, 'guardring'],
    // below the spire
    [200, 30, 'prismmail'], [238, 34, 'crystalblade'], [210, 62, 'prismstaff'],
  ];
  for (const [x0, z0, item, n = 1] of L) {
    // a chest that would land in the water moves to the nearest dry ground
    W.chests.push({ id: `c${x0}_${z0}`, item, n, pos: spot(sc(x0), sc(z0)) });
  }
  // supply caches all over the wider land: what is inside depends on how dangerous the place is
  const LOOT = {
    low: [['potion', 3], ['ether', 1], ['antidote', 3], ['eyedrops', 2], ['lens', 2], ['tent', 1], ['potion', 2]],
    mid: [['hipotion', 1], ['ether', 2], ['phoenix', 1], ['lens', 3], ['tent', 1], ['eyedrops', 3], ['goggles', 1], ['stargazer', 1]],
    high: [['hipotion', 2], ['phoenix', 2], ['ether', 3], ['hipotion', 3], ['salamander', 1], ['snowcoat', 1], ['icebrand', 1], ['quickcharm', 1]],
  };
  const TIER = { meadow: 'low', forest: 'low', lake: 'low', mistfen: 'low', coast: 'mid', sporewood: 'mid', mesa: 'mid', ruins: 'mid', mountain: 'high', rimefield: 'high', ember: 'high', spire: 'high' };
  let k = 0;
  for (let gz = 0; gz < 9; gz++) for (let gx = 0; gx < 9; gx++) {
    const x0 = Math.round((gx + 0.2 + rand(gx, gz, 80) * 0.6) * WX / 9), z0 = Math.round((gz + 0.2 + rand(gx, gz, 81) * 0.6) * WZ / 9), reg = regionAt(x0, z0), tier = TIER[reg];
    if (!tier || W.chests.some((c) => Math.hypot(c.pos[0] - x0, c.pos[2] - z0) < 30)) continue;
    const list = LOOT[tier], [item, n] = list[Math.floor(rand(gx, gz, 82) * list.length)];
    W.chests.push({ id: `cache${gx}_${gz}`, item, n, pos: spot(x0, z0) }); k++;
  }
}
// stones that heal, save and let you warp between the ones you have touched
export const HOMES = [['h_fen', 142, 370], ['h_forest', 92, 292], ['h_dune', 320, 236], ['h_frost', 136, 182], ['h_spore', 330, 398],
  ['h_ruins', 218, 160], ['h_peak', 92, 150], ['h_rime', 70, 48], ['h_ember', 376, 84], ['h_spire', 230, 50],
  // waystones out in the wider land
  ['h_meadow', 216, 318], ['h_lake', 244, 262], ['h_coast', 392, 262], ['h_mesa', 304, 176], ['h_mist', 92, 396], ['h_wood', 52, 250], ['h_mtn', 60, 176]];
function placeHomes() {
  W.homes.push({ id: 'h_hearth', pos: spot(...tw('hearth')(218, 380)) }, { id: 'h_salt', pos: spot(...tw('saltmere')(382, 330)) });
  for (const [id, x, z] of HOMES) W.homes.push({ id, pos: spot(sc(x), sc(z)) });
}

// ---------- monsters ----------
const SPAWN = {
  meadow: ['slime', 'bunny', 'chick', 'hog'], forest: ['caterpillar', 'monkey', 'orc', 'bluejelly'], coast: ['crab', 'fish', 'parrot', 'bluejelly'], lake: ['wisp', 'fish', 'ghost', 'minion'],
  mistfen: ['bogslime', 'minion', 'ghost', 'caterpillar'], sporewood: ['sporeling', 'sporetreant', 'monkey', 'bluejelly'],
  mesa: ['lion', 'scorpion', 'tiger'], ember: ['magmaslime', 'emberwisp', 'magmagolem'], ruins: ['skeleton', 'skelmage', 'zombie', 'ruinguard'],
  mountain: ['skeleton', 'skelmage', 'golem', 'yeti'], rimefield: ['yeti', 'frostjelly', 'icewisp', 'golem'], spire: ['vampire', 'crysgolem', 'skelrogue', 'ghost'],
};
// monsters that only walk at night
export const NIGHT = new Set(['ghost', 'wisp']);
function placeSpawns() {
  let k = 0;
  for (let z = 8; z < WZ - 8; z += 10) for (let x = 8; x < WX - 8; x += 10) {
    const reg = regionAt(x, z), list = SPAWN[reg];
    if (!list || REGIONS[reg].town || isClear(x, z)) continue;
    if (rand(x, z, 21) > 0.42) continue;
    if (!dry(x, z)) continue;
    W.spawns.push({ id: 's' + (k++), monster: list[Math.floor(rand(x, z, 22) * list.length)], pos: [x + 0.5, ground(x, z), z + 0.5] });
  }
  // the guardians of the lands
  const boss = (id, monster, x, z, raw = false) => { const p = raw ? spot(x, z) : spot(sc(x), sc(z)); W.spawns.push({ id, monster, boss: true, pos: p }); };
  boss('b_treant', 'treant', 66, 286);
  boss('b_bog', 'bogkeeper', 62, 404);
  boss('b_myco', 'sporelord', 346, 404);
  boss('b_mesa', 'mesaking', 366, 118);
  boss('b_ruin', 'fallenknight', REGIONS.ruins.c[0], REGIONS.ruins.c[1] + 10, true);
  boss('b_wyrm', 'frostwyrm', summit[0] + 4, summit[1] + 5, true);
  boss('b_ember', 'emberdrake', 386, 52);
}

// ---------- memory shards, signs, herbs, fishing spots, the traveller ----------
const SHARD_AT = [[180, 320], [262, 300], [240, 412], [126, 358], [50, 410], [92, 380], [36, 366], [58, 258], [122, 304], [80, 334], [252, 252], [398, 268], [410, 320],
  [318, 410], [358, 368], [298, 252], [300, 110], [352, 172], [402, 38], [198, 118], [240, 146], [60, 142], [38, 26], [202, 28]];
function placeShards() { SHARD_AT.forEach(([x, z], i) => W.shards.push({ id: i, pos: spot(sc(x), sc(z), 0) })); }
const SIGN_AT = { s_hearth: [219, 360], s_fen: [160, 372], s_lake: [216, 282], s_salt: [360, 334], s_dune: [302, 238], s_ember: [372, 88], s_ruins: [222, 172], s_frost: [150, 196], s_rime: [80, 62], s_spire: [222, 76], s_spore: [314, 368], s_forest: [122, 288], s_mist: [102, 388], s_mtn: [112, 170] };
function placeSigns() { for (const [id, [x, z]] of Object.entries(SIGN_AT)) W.signs.push({ id, pos: spot(sc(x), sc(z)), rot: rand(x, z, 70) * 6.28 }); }
function placeHerbs() {
  for (const [kind, reg, n, s] of [['moonherb', 'mistfen', 12, 80], ['glowcap', 'sporewood', 10, 90]]) {
    let got = 0;
    for (let k = 0; got < n && k < 900; k++) {
      const r = REGIONS[reg], a = rand(k, s, 1) * Math.PI * 2, d = rand(k, s, 2) * r.r * 0.85, x = Math.round(r.c[0] + Math.cos(a) * d), z = Math.round(r.c[1] + Math.sin(a) * d);
      if (regionAt(x, z) !== reg || !dry(x, z) || solid(get(x, ground(x, z), z)) || W.herbs.some((h) => Math.hypot(h.pos[0] - x, h.pos[2] - z) < 9)) continue;
      W.herbs.push({ id: kind + got, kind, pos: [x + 0.5, ground(x, z), z + 0.5] }); got++;
    }
  }
}
// a dry block beside the water to cast from
function shoreSpot(x0, z0, kind) {
  for (let r = 0; r < 60; r++) for (let a = 0; a < Math.max(1, r * 8); a++) {
    const x = Math.round(x0 + Math.cos(a / Math.max(1, r * 8) * Math.PI * 2) * r), z = Math.round(z0 + Math.sin(a / Math.max(1, r * 8) * Math.PI * 2) * r);
    if (!dry(x, z) || solid(get(x, ground(x, z), z))) continue;
    const g = ground(x, z);
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (get(x + dx, g - 1, z + dz) === B.water || (get(x + dx, SEA, z + dz) === B.water && ground(x + dx, z + dz) <= SEA && g <= SEA + 3)) return W.fish.push({ id: 'f' + W.fish.length, kind, pos: [x + 0.5, g, z + 0.5], water: [x + dx + 0.5, z + dz + 0.5] });
  }
}
function placeFishing() {
  const pier = tw('saltmere')(421, 336);
  shoreSpot(sc(216), sc(268), 'lake'); shoreSpot(sc(216), sc(196), 'lake'); W.fish.push({ id: 'pier', kind: 'sea', pos: [pier[0] + 0.5, 8, pier[1] + 0.5], water: [pier[0] + 2.5, pier[1] + 0.5] }); shoreSpot(sc(398), sc(262), 'sea'); shoreSpot(sc(84), sc(400), 'marsh'); shoreSpot(...REGIONS.dunewell.c, 'oasis');
  shoreSpot(sc(250), sc(330), 'lake'); shoreSpot(sc(40), sc(410), 'marsh'); shoreSpot(sc(400), sc(380), 'sea');
}
// where the cloaked traveller is seen, and how many crystals you need before each meeting
export const EIN_STEPS = [0, 1, 2, 4, 6, 8];
function placeEin() { W.ein.push(spot(...tw('hearth')(216, 352))); for (const [x, z] of [[204, 268], [328, 236], [222, 168], [146, 188], [234, 56]]) W.ein.push(spot(sc(x), sc(z))); }

// KayKit trees, rocks and props scattered over the open ground; trees get an invisible post to bump into
function placeDecor() {
  const TREES = ['hex/tree_single_A.gltf', 'hex/tree_single_B.gltf', 'hex/trees_A_small.gltf', 'hex/trees_B_small.gltf', 'hex/trees_A_medium.gltf', 'hex/trees_B_medium.gltf'];
  const ROCKS = ['hex/rock_single_A.gltf', 'hex/rock_single_B.gltf', 'hex/rock_single_C.gltf', 'hex/rock_single_D.gltf', 'hex/rock_single_E.gltf'];
  const PINES = ['grave/pine', 'grave/pine-crooked', 'grave/pine-fall'];
  const GRAVES = ['grave/gravestone-cross', 'grave/gravestone-round', 'grave/urn-round', 'grave/rocks-tall'];
  const add = (model, x, y, z, h, post = false) => { W.decor.push({ model, pos: [x + 0.5, y, z + 0.5], h, rot: rand(x, z, 44) * 6.28 }); if (post) { set(x, y, z, B.post); set(x, y + 1, z, B.post); } };
  for (let z = 6; z < WZ - 6; z += 3) for (let x = 6; x < WX - 6; x += 3) {
    const reg = regionAt(x, z), r = rand(x, z, 41);
    if (REGIONS[reg].town || isClear(x, z)) continue;
    const y = ground(x, z), top = get(x, y - 1, z);
    if (!dry(x, z) || solid(get(x, y, z)) || solid(get(x, y + 1, z))) continue;
    const pick = (a) => a[Math.floor(rand(x, z, 42) * a.length)];
    if (top === B.grass && ['meadow', 'lake', 'forest', 'mistfen'].includes(reg) && r < (reg === 'forest' ? 0.16 : reg === 'mistfen' ? 0.08 : 0.07)) add(pick(TREES), x, y, z, 3.2 + rand(x, z, 43) * 1.6, true);
    else if ((top === B.snow || top === B.gravel || (top === B.grass && reg === 'mountain')) && ['mountain', 'rimefield'].includes(reg) && r < 0.07) add(pick(PINES), x, y, z, 3 + rand(x, z, 43) * 2, true);
    else if (reg === 'mistfen' && r > 0.96) add(pick(GRAVES), x, y, z, 0.9 + rand(x, z, 46) * 0.4);
    else if (reg === 'ruins' && r > 0.9) add(r > 0.97 ? 'dungeon/column' : pick(GRAVES), x, y, z, r > 0.97 ? 2.6 : 0.9);
    else if (reg === 'sporewood' && r > 0.93) add('grave/pumpkin', x, y, z, 0.6 + rand(x, z, 46) * 0.4);
    else if (r > 0.92 && reg !== 'spire') add(pick(ROCKS), x, y, z, 0.5 + rand(x, z, 46) * 0.5);
  }
  // a lived-in village: crates, barrels, a weapon rack, flags
  const y = 9, hv = tw('hearth');
  for (const [m, x0, z0, h] of [['hex/barrel.gltf', 210, 382, 0.9], ['hex/crate_A_small.gltf', 211, 383, 0.8], ['hex/sack.gltf', 221, 383, 0.6], ['hex/weaponrack.gltf', 220, 378, 1.2], ['hex/flag_blue.gltf', 214, 378, 1.7], ['hex/flag_blue.gltf', 219, 378, 1.7], ['hex/wheelbarrow.gltf', 230, 384, 0.9], ['hex/bucket_water.gltf', 217, 383, 0.5], ['hex/resource_lumber.gltf', 205, 384, 0.8]]) { const [x, z] = hv(x0, z0); W.decor.push({ model: m, pos: [x + 0.5, y, z + 0.5], h, rot: rand(x, z, 3) * 6.28 }); }
  for (const [x, z] of [tw('dunewell')(302, 230), tw('dunewell')(332, 232), tw('frostgate')(128, 186), tw('saltmere')(372, 346), tw('fenside')(150, 360)]) W.decor.push({ model: 'hex/tent.gltf', pos: [x + 0.5, ground(x, z), z + 0.5], h: 2.2, rot: rand(x, z, 4) * 6.28 });
  // lily pads on the lake and the marsh pools
  for (let k = 0; k < 200; k++) {
    const lake = k < 80, c = REGIONS[lake ? 'lake' : 'mistfen'].c, a = rand(k, 1, 50) * 6.28, d = lake ? sc(8) + rand(k, 2, 51) * sc(20) : rand(k, 2, 51) * sc(40), x = Math.floor(c[0] + Math.cos(a) * d), z = Math.floor(c[1] + Math.sin(a) * d);
    if (get(x, SEA, z) === B.water && get(x, SEA + 1, z) === B.air) W.decor.push({ model: 'hex/waterlily_A.gltf', pos: [x + 0.5, SEA + 0.85, z + 0.5], h: 0.12, rot: a, flat: true });
  }
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
for (const d of DIRS) {
  d.ao = d.c.map(([a, b2, c]) => {
    const ax = d.n.map((v) => (v ? 0 : 1)), off = [a, b2, c].map((v, i) => (ax[i] ? (v ? 1 : -1) : 0)), axes = [0, 1, 2].filter((i) => ax[i]);
    const u = [0, 0, 0], v2 = [0, 0, 0]; u[axes[0]] = off[axes[0]]; v2[axes[1]] = off[axes[1]];
    return [u, v2, [u[0] + v2[0], u[1] + v2[1], u[2] + v2[2]]];
  });
}
export const CHUNK = 16;
export function buildChunk(cx, cz) {
  const pos = [], uv = [], col = [], ind = [];
  const { size, cols, rows, faces } = atlasInfo, du = 1 / cols, dv = 1 / rows, pad = 0.5 / (size * cols);
  void rows;
  // a fast look-up straight into the block array
  const data = W.data, at = (x, y, z) => (x < 0 || z < 0 || x >= WX || z >= WZ || y < 0 ? B.stone : y >= WY ? 0 : data[(z * WX + x) * WY + y]);
  const op = (x, y, z) => { const id = at(x, y, z); return id !== 0 && id !== B.water && id !== B.post; };
  for (let x = cx * CHUNK; x < Math.min(WX, cx * CHUNK + CHUNK); x++) for (let z = cz * CHUNK; z < Math.min(WZ, cz * CHUNK + CHUNK); z++) {
    // nothing is built above the tallest thing in this column
    const cb = (z * WX + x) * WY;
    let ymax = 0; for (let y = WY - 1; y >= 0; y--) if (data[cb + y] !== 0) { ymax = y; break; }
    for (let y = 0; y <= ymax; y++) {
      const id = data[cb + y];
      if (!opaque(id)) continue;
      for (const d of DIRS) {
        const nb = at(x + d.n[0], y + d.n[1], z + d.n[2]);
        if (opaque(nb) && !(seeThrough(nb) && !seeThrough(id))) continue;
        if (y + d.n[1] < 0) continue;
        const fi = faces[FACES[id][d.f]], u0 = (fi % cols) * du + pad, v0 = 1 - (Math.floor(fi / cols) + 1) * dv + pad, u1 = u0 + du - pad * 2, v1 = v0 + dv - pad * 2;
        const base = pos.length / 3;
        // ambient occlusion: each corner darkens with the blocks crowding it from the layer in front of the face
        const s = (id === B.lava ? 1.5 : d.shade) * (0.95 + rand(x, z, y) * 0.05), ox = x + d.n[0], oy = y + d.n[1], oz = z + d.n[2];
        for (let ci = 0; ci < 4; ci++) {
          const [a, b2, c] = d.c[ci], [u, v2, w] = d.ao[ci];
          const s1 = op(ox + u[0], oy + u[1], oz + u[2]) ? 1 : 0, s2 = op(ox + v2[0], oy + v2[1], oz + v2[2]) ? 1 : 0, cr = op(ox + w[0], oy + w[1], oz + w[2]) ? 1 : 0;
          const ao = s1 && s2 ? 0 : 3 - (s1 + s2 + cr), k = s * [0.5, 0.68, 0.84, 1][ao];
          pos.push(x + a, y + b2, z + c); col.push(k, k, k);
        }
        uv.push(u0, v0, u1, v0, u1, v1, u0, v1);
        ind.push(base, base + 1, base + 2, base, base + 2, base + 3);
      }
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
