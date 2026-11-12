// Models: KayKit's adventurers, skeletons and decorations and Kenney's blocky villagers, pets and props
// (all CC0), each clone with its own animation mixer, and monsters built here out of blocks.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as skClone } from 'three/addons/utils/SkeletonUtils.js';
import { Q } from './quality.js';

const loader = new GLTFLoader();
const cache = new Map();
export function preload(paths) {
  return Promise.all(paths.map((p) => new Promise((res) => {
    if (cache.has(p)) { res(); return; }
    loader.load(p.endsWith('.gltf') ? `assets/models/${p}` : `assets/models/${p}.glb`, (g) => {
      hideSpares(p, g.scene);
      g.scene.traverse((o) => { if (o.isMesh) { o.castShadow = o.receiveShadow = Q.shadow > 0; if (o.material && o.material.map) { o.material.map.magFilter = THREE.NearestFilter; o.material.map.colorSpace = THREE.SRGBColorSpace; } } });
      cache.set(p, g); res();
    }, undefined, () => { console.warn('missing model', p); cache.set(p, null); res(); });
  })));
}
// a KayKit character carries every weapon it could hold; keep the ones each hero uses
const KEEP = { Knight: ['1H_Sword', 'Round_Shield'], Mage: ['2H_Staff'], Barbarian: ['1H_Axe', 'Barbarian_Round_Shield'], Rogue_Hooded: ['Knife', 'Knife_Offhand'], Rogue: ['Knife', 'Knife_Offhand'] };
function hideSpares(path, scene) {
  const n = path.split('/').pop(), keep = KEEP[n];
  if (!keep) return;
  const own = n.split('_')[0];
  scene.traverse((o) => { if (o.isMesh || o.isSkinnedMesh) { const nm = o.name || (o.parent && o.parent.name) || ''; if (!nm.startsWith(own) && !keep.includes(nm)) o.visible = false; } });
}
// the names this game asks for, and what each pack calls them (KayKit, Kenney, Quaternius)
const ALIAS = {
  idle: ['Idle', 'idle', 'static', 'Flying_Idle', 'Swimming_Normal'], walk: ['Walking_A', 'walk', 'Walk', 'Run', 'Fast_Flying', 'Flying', 'Swimming_Fast'],
  sprint: ['Running_A', 'sprint', 'run', 'Run', 'walk', 'Walk', 'Fast_Flying', 'Flying', 'Swimming_Fast'], run: ['Running_A', 'run', 'Run', 'walk', 'Walk', 'Fast_Flying', 'Flying'],
  jump: ['Jump_Idle', 'jump', 'Jump', 'walk', 'Walk', 'Fast_Flying', 'Flying'], fall: ['Jump_Idle', 'fall', 'Jump', 'walk', 'Flying'], die: ['Death_A', 'die', 'Death'],
  'attack-melee-right': ['1H_Melee_Attack_Slice_Diagonal', 'attack-melee-right', 'Attack', 'Punch', 'Bite_Front', 'Headbutt', 'Weapon', 'Kick', 'SwordSlash', 'walk', 'Walk', 'Fast_Flying'],
  'interact-right': ['Spellcast_Shoot', 'interact-right', 'Shoot_Big', 'Weapon', 'Attack2', 'Attack', 'Punch', 'Headbutt', 'Yes', 'Wave', 'idle', 'Idle'],
  'emote-yes': ['Cheer', 'emote-yes', 'Yes', 'Dance', 'idle', 'Idle'], hit: ['Hit_A', 'HitReact', 'HitRecieve', 'HitRecieve_1', 'Hit'],
};
// Quaternius names its clips "Armature|TRex_Idle"; keep the last part, and the part after a creature's name
const NOT_PREFIX = new Set(['Fast', 'Flying', 'Jump', 'Bite', 'Shoot', 'Swimming', 'Out', 'Run', 'Hit', 'HitRecieve', 'Death', 'Attack', 'Walking', 'Running', 'Spellcast', '1H', '2H', 'Dualwield', 'Unarmed', 'Block', 'Lie', 'Sit', 'Throw', 'Use']);
function clipTable(anims) {
  const t = {};
  for (const a of anims) {
    const short = a.name.split('|').pop(); t[a.name] = a; if (!t[short]) t[short] = a;
    const m = /^([A-Za-z]+)_(.+)$/.exec(short);
    if (m && !NOT_PREFIX.has(m[1]) && !t[m[2]]) t[m[2]] = a;
  }
  return t;
}
const tinted = new Map();
// a recoloured copy of a model's materials: the main colour takes the tint, the second colour a darker shade of it
function tintMaterial(mat, tint, all) {
  const key = mat.uuid + tint;
  if (tinted.has(key)) return tinted.get(key);
  const m = mat.clone(), c = new THREE.Color(tint), n = mat.name || '';
  if (all || /main|atlas|diffuse|^material/i.test(n)) { if (m.map) m.color.copy(c); else m.color.copy(c); }
  else if (/secondary|belly|light|horn|claws|wings|ears|hair|stripe|beak|flaps/i.test(n)) { m.color.lerp(c.clone().multiplyScalar(0.7), 0.6); }
  tinted.set(key, m);
  return m;
}
function applyTint(obj, tint) {
  const mats = []; obj.traverse((o) => { if (o.isMesh) for (const mm of [].concat(o.material)) mats.push(mm); });
  const all = !mats.some((m) => /main|atlas|diffuse/i.test(m.name || ''));
  obj.traverse((o) => { if (o.isMesh) o.material = Array.isArray(o.material) ? o.material.map((m) => tintMaterial(m, tint, all)) : tintMaterial(o.material, tint, all); });
}
// how tall a model really stands: skinned meshes are measured through their bones (some packs model in centimetres
// and scale down in the skeleton, which a plain bounding box misses)
export function measureHeight(o) {
  o.updateMatrixWorld(true);
  const box = new THREE.Box3();
  o.traverse((m) => { if (!m.visible) return; if (m.isSkinnedMesh) { m.computeBoundingBox(); box.union(m.boundingBox.clone().applyMatrix4(m.matrixWorld)); } else if (m.isMesh) box.expandByObject(m); });
  return box.isEmpty() ? 1 : box.max.y - box.min.y;
}
// models of the east come in only when first needed
const pending = new Map();
export const ready = (path) => path.startsWith('vox:') || cache.has(path);
export function ensure(paths) { const want = [].concat(paths).filter((p) => !ready(p)); if (!want.length) return Promise.resolve(); const ps = want.map((p) => { if (!pending.has(p)) pending.set(p, preload([p]).then(() => pending.delete(p))); return pending.get(p); }); return Promise.all(ps); }
// an instance: { obj, mixer, play(name), update(dt) }
export function make(path, opts = {}) {
  if (path.startsWith('vox:')) return voxel(path.slice(4), opts);
  const g = cache.get(path);
  if (!g) return voxel('slime', { color: '#ff00ff' });
  const obj = skClone(g.scene);
  if (opts.tint) applyTint(obj, opts.tint);
  // every pack has its own scale; measure once so callers can ask for a height in blocks
  if (!g.userData.h) g.userData.h = Math.max(0.1, measureHeight(obj));
  const wrap = new THREE.Group(); wrap.add(obj);
  if (!g.userData.clips) g.userData.clips = clipTable(g.animations);
  const mixer = new THREE.AnimationMixer(obj), clips = g.userData.clips;
  const find = (name) => { for (const k of ALIAS[name] || [name]) if (clips[k]) return clips[k]; return clips[name] || null; };
  let cur = null, curName = '';
  const inst = {
    obj: wrap, mixer, clips, h: g.userData.h,
    fit(target) { wrap.scale.setScalar(target / g.userData.h); return inst; },
    has: (name) => !!find(name),
    play(name, { once = false, fade = 0.15 } = {}) {
      const c = find(name) || find('idle');
      if (!c || (curName === name && !once)) return;
      const a = mixer.clipAction(c); a.reset(); a.setLoop(once ? THREE.LoopOnce : THREE.LoopRepeat); a.clampWhenFinished = once;
      if (cur && cur !== a) cur.crossFadeTo(a, fade, false); a.play(); cur = a; curName = name;
    },
    update(dt) { mixer.update(dt); },
  };
  inst.play('idle');
  return inst;
}

// ---------- monsters made of blocks ----------
const box = (w, h, d, col, x = 0, y = 0, z = 0, emissive) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color: col, emissive: emissive || 0x000000 }));
  m.position.set(x, y, z); return m;
};
const shade = (hex, k) => { const c = new THREE.Color(hex); c.multiplyScalar(k); return c; };
function eyes(g, y, z, sep = 0.14, size = 0.1, col = 0x101018) {
  for (const s of [-1, 1]) { g.add(box(size, size * 1.3, 0.04, 0xffffff, s * sep, y, z)); g.add(box(size * 0.55, size * 0.8, 0.05, col, s * sep, y - 0.01, z + 0.01)); }
}
function voxel(kind, { color = '#88cc66' } = {}) {
  const g = new THREE.Group(), c = new THREE.Color(color);
  const parts = {};
  if (kind === 'slime') {
    g.add(box(0.8, 0.5, 0.8, c, 0, 0.25, 0)); g.add(box(0.6, 0.18, 0.6, shade(color, 1.2), 0, 0.58, 0)); eyes(g, 0.34, 0.41, 0.16, 0.12);
    parts.body = g.children[0];
  } else if (kind === 'crab') {
    g.add(box(0.9, 0.35, 0.65, c, 0, 0.35, 0)); eyes(g, 0.6, 0.2, 0.18, 0.1);
    for (const s of [-1, 1]) { g.add(box(0.3, 0.25, 0.25, shade(color, 1.1), s * 0.6, 0.4, 0.35)); for (let k = 0; k < 3; k++) g.add(box(0.08, 0.22, 0.08, shade(color, 0.7), s * 0.4, 0.12, -0.2 + k * 0.2)); }
    for (const s of [-1, 1]) g.add(box(0.06, 0.2, 0.06, shade(color, 0.8), s * 0.18, 0.62, 0.2));
  } else if (kind === 'golem') {
    g.add(box(0.9, 0.9, 0.6, c, 0, 1.0, 0)); g.add(box(0.55, 0.45, 0.5, shade(color, 1.15), 0, 1.66, 0.02)); eyes(g, 1.7, 0.28, 0.13, 0.1, 0xffd040);
    for (const s of [-1, 1]) { g.add(box(0.3, 0.8, 0.3, shade(color, 0.85), s * 0.62, 0.95, 0)); g.add(box(0.34, 0.55, 0.36, shade(color, 0.75), s * 0.24, 0.28, 0)); }
    g.add(box(0.3, 0.2, 0.05, shade(color, 1.4), 0, 1.15, 0.31, shade(color, 0.3)));
  } else if (kind === 'wisp') {
    g.add(box(0.5, 0.5, 0.5, c, 0, 0.9, 0, shade(color, 0.6))); g.add(box(0.3, 0.3, 0.3, shade(color, 1.3), 0, 1.25, 0, shade(color, 0.5))); g.add(box(0.2, 0.25, 0.2, c, 0, 0.55, 0, shade(color, 0.4)));
    eyes(g, 0.95, 0.26, 0.11, 0.09, 0x204060);
  } else if (kind === 'scorpion') {
    g.add(box(0.7, 0.3, 0.9, c, 0, 0.3, 0)); eyes(g, 0.42, 0.46, 0.14, 0.08);
    for (const s of [-1, 1]) { g.add(box(0.22, 0.2, 0.4, shade(color, 1.1), s * 0.45, 0.32, 0.55)); for (let k = 0; k < 3; k++) g.add(box(0.5, 0.06, 0.07, shade(color, 0.7), s * 0.45, 0.16, -0.25 + k * 0.22)); }
    let y = 0.45, z = -0.45; for (let k = 0; k < 4; k++) { g.add(box(0.18, 0.18, 0.18, shade(color, 1 - k * 0.05), 0, y, z)); y += 0.18; z -= 0.08 - k * 0.06; }
    g.add(box(0.12, 0.22, 0.12, 0xf8e070, 0, y + 0.05, z + 0.12));
  } else if (kind === 'treant') {
    g.add(box(1.1, 2.0, 0.9, 0x6a4424, 0, 1.0, 0)); g.add(box(2.2, 1.4, 2.0, c, 0, 2.6, 0)); g.add(box(1.4, 0.8, 1.4, shade(color, 1.2), 0, 3.5, 0));
    eyes(g, 1.5, 0.46, 0.22, 0.16, 0xf8e040);
    for (const s of [-1, 1]) { g.add(box(0.9, 0.25, 0.25, 0x6a4424, s * 0.95, 1.4, 0)); g.add(box(0.3, 0.6, 0.3, 0x6a4424, s * 0.35, 0.3, 0)); }
  } else if (kind === 'dragon') {
    g.add(box(1.0, 0.8, 1.6, c, 0, 1.0, 0)); g.add(box(0.7, 0.6, 0.8, shade(color, 1.1), 0, 1.7, 0.9)); g.add(box(0.5, 0.3, 0.5, shade(color, 1.2), 0, 1.6, 1.4)); eyes(g, 1.85, 1.31, 0.18, 0.12, 0x2040a0);
    for (const s of [-1, 1]) { g.add(box(1.6, 0.08, 0.9, shade(color, 0.8), s * 1.2, 1.5, -0.1)); g.add(box(0.3, 0.6, 0.3, shade(color, 0.8), s * 0.35, 0.3, 0.4)); g.add(box(0.3, 0.6, 0.3, shade(color, 0.8), s * 0.35, 0.3, -0.5)); g.add(box(0.12, 0.35, 0.12, 0xf0f8ff, s * 0.2, 2.1, 0.8)); }
    g.add(box(0.3, 0.3, 1.0, c, 0, 0.9, -1.2)); g.add(box(0.2, 0.2, 0.6, shade(color, 0.9), 0, 0.8, -1.9));
    parts.wings = g.children.filter((m) => m.geometry.parameters.width === 1.6);
  } else if (kind === 'tentacle') {
    parts.segs = [];
    for (let k = 0; k < 7; k++) { const sgm = box(0.5 - k * 0.05, 0.42, 0.5 - k * 0.05, shade(color, 1 - k * 0.06), 0, 0.21 + k * 0.4, 0); g.add(sgm); parts.segs.push(sgm); }
    for (let k = 0; k < 5; k++) g.add(box(0.12, 0.12, 0.06, 0xffd0e0, 0, 0.5 + k * 0.42, 0.24 - k * 0.025));
    } else if (kind === 'heart') {
    const core = box(1.4, 1.4, 1.4, c, 0, 2.2, 0, shade(color, 0.5)); core.rotation.set(0.6, 0.78, 0); g.add(core);
    for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2, s = box(0.4, 1.2, 0.4, shade(color, 1.2), Math.cos(a) * 1.8, 2.2 + Math.sin(k) * 0.4, Math.sin(a) * 1.8, shade(color, 0.4)); s.rotation.z = a; g.add(s); }
    eyes(g, 2.3, 0.75, 0.25, 0.18, 0x400060);
    parts.core = core; parts.shards = g.children.slice(1, 7);
  }
  let t = Math.random() * 10;
  const inst = {
    obj: g, clips: {}, h: 1,
    fit(k) { g.scale.setScalar(k > 2.5 ? 1.8 : 1); return inst; },
    play() {},
    update(dt) {
      t += dt;
      if (kind === 'slime') { const s = 1 + Math.sin(t * 6) * 0.06; g.scale.set(1 / s, s, 1 / s); }
      if (kind === 'wisp') g.position.y = Math.sin(t * 2.5) * 0.12;
      if (kind === 'dragon' && parts.wings) for (const w of parts.wings) w.rotation.z = Math.sin(t * 4) * 0.35 * Math.sign(w.position.x);
      if (kind === 'tentacle') parts.segs.forEach((sg, i) => { sg.position.x = Math.sin(t * 2.2 - i * 0.6) * i * 0.06; sg.rotation.z = Math.sin(t * 2.2 - i * 0.6) * 0.12; });
      if (kind === 'heart') { parts.core.rotation.y += dt * 0.8; parts.shards.forEach((s, i) => { const a = (i / 6) * Math.PI * 2 + t * 0.6; s.position.set(Math.cos(a) * 1.8, 2.2 + Math.sin(t * 2 + i) * 0.4, Math.sin(a) * 1.8); }); }
    },
  };
  return inst;
}
// a glowing crystal for the field, slowly turning
export function crystalMesh(color = 0x8ae8ff) {
  const g = new THREE.Group();
  const geo = new THREE.OctahedronGeometry(0.42, 0); geo.scale(1, 1.6, 1);
  const m = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color, emissive: new THREE.Color(color).multiplyScalar(0.55), transparent: true, opacity: 0.92 }));
  m.position.y = 0.9; g.add(m);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.04, 6, 24), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 }));
  ring.rotation.x = Math.PI / 2; ring.position.y = 0.3; g.add(ring);
  if (Q.lights) { const light = new THREE.PointLight(color, 1.4, 7); light.position.y = 1; g.add(light); } else m.material.emissive.multiplyScalar(1.5);
  return { obj: g, update(dt, t) { m.rotation.y += dt; m.position.y = 0.9 + Math.sin(t * 2) * 0.12; ring.scale.setScalar(1 + Math.sin(t * 3) * 0.08); } };
}
// the home stones: a blue obelisk of light
export function homeMesh() {
  const g = new THREE.Group();
  g.add(box(0.7, 0.2, 0.7, 0x5a6478, 0, 0.1, 0));
  const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.34, 1.4, 0.34), new THREE.MeshLambertMaterial({ color: 0x7ab8ff, emissive: 0x204080 }));
  pillar.position.y = 0.95; g.add(pillar);
  return { obj: g, update(dt, t) { pillar.rotation.y += dt * 0.7; pillar.material.emissive.setRGB(0.12 + Math.sin(t * 2) * 0.06, 0.25, 0.5); } };
}

// many copies of one decoration drawn in a single call: each mesh of the model becomes an InstancedMesh
export function instanced(path, list) {
  const g = cache.get(path), out = new THREE.Group();
  if (!g || !list.length) return out;
  if (!g.userData.h) { const bb = new THREE.Box3().setFromObject(g.scene); g.userData.h = Math.max(0.1, bb.max.y - bb.min.y); }
  g.scene.updateMatrixWorld(true);
  const T = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), v = new THREE.Vector3(), sc = new THREE.Vector3();
  g.scene.traverse((o) => {
    if (!o.isMesh || !o.visible) return;
    const im = new THREE.InstancedMesh(o.geometry, o.material, list.length);
    list.forEach((d, i) => { const k = d.h / g.userData.h; q.setFromAxisAngle(up, d.rot || 0); T.compose(v.set(...d.pos), q, sc.set(k, k, k)); T.multiply(o.matrixWorld); im.setMatrixAt(i, T); });
    im.castShadow = !list[0].flat && Q.shadow > 0; im.receiveShadow = Q.shadow > 0; im.computeBoundingSphere();
    out.add(im);
  });
  return out;
}
// a memory shard: a small rose-coloured sliver of the old Prism, turning over and over
export function shardMesh() {
  const g = new THREE.Group();
  const geo = new THREE.OctahedronGeometry(0.22, 0); geo.scale(0.7, 1.5, 0.7);
  const m = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: 0xffb0e0, emissive: 0x803060 })); m.position.y = 1.0; g.add(m);
  const halo = new THREE.Mesh(new THREE.RingGeometry(0.28, 0.36, 16), new THREE.MeshBasicMaterial({ color: 0xffd0f0, transparent: true, opacity: 0.6, side: THREE.DoubleSide })); halo.position.y = 1.0; g.add(halo);
  return { obj: g, update(dt, t) { m.rotation.y += dt * 2.2; m.rotation.z = Math.sin(t * 1.7) * 0.4; m.position.y = halo.position.y = 1.0 + Math.sin(t * 2.4) * 0.1; halo.lookAt(m.position.x, 1, m.position.z + 1); halo.rotation.z += t; } };
}
// a wooden signpost with a board
export function signMesh() {
  const g = new THREE.Group();
  g.add(box(0.14, 1.3, 0.14, 0x6a4a2a, 0, 0.65, 0)); g.add(box(0.9, 0.5, 0.08, 0xb08050, 0, 1.15, 0.08)); g.add(box(0.7, 0.06, 0.09, 0x5a3a1a, 0, 1.2, 0.09)); g.add(box(0.5, 0.06, 0.09, 0x5a3a1a, -0.06, 1.05, 0.09));
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return { obj: g };
}
// herbs to gather: a pale glowing sprig, or a little luminous mushroom
export function herbMesh(kind) {
  const g = new THREE.Group();
  if (kind === 'glowcap') { g.add(box(0.08, 0.25, 0.08, 0xe8e0d0, 0, 0.12, 0)); g.add(box(0.3, 0.1, 0.3, 0x80f0ff, 0, 0.28, 0, 0x30a0c0)); g.add(box(0.06, 0.15, 0.06, 0xe8e0d0, 0.18, 0.07, 0.1)); g.add(box(0.16, 0.07, 0.16, 0x80f0ff, 0.18, 0.17, 0.1, 0x30a0c0)); }
  else for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2, l = box(0.05, 0.4, 0.05, 0xc8f0ff, Math.cos(a) * 0.08, 0.2, Math.sin(a) * 0.08, 0x4080a0); l.rotation.set(Math.sin(a) * 0.4, 0, -Math.cos(a) * 0.4); g.add(l); }
  return { obj: g, update(dt, t) { g.rotation.y = Math.sin(t * 0.8) * 0.3; } };
}
// rings spreading on the water where fish are biting
export function rippleMesh() {
  const g = new THREE.Group(), rings = [];
  for (let k = 0; k < 3; k++) { const r = new THREE.Mesh(new THREE.RingGeometry(0.3, 0.38, 20), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false })); r.rotation.x = -Math.PI / 2; g.add(r); rings.push(r); }
  return { obj: g, update(dt, t) { rings.forEach((r, i) => { const p = (t * 0.6 + i / 3) % 1; r.scale.setScalar(0.5 + p * 2.2); r.material.opacity = 0.55 * (1 - p); }); } };
}

// ---------- things of the east to touch ----------
// a lever on a brass post: the handle points up when on
export function leverMesh() {
  const g = new THREE.Group();
  g.add(box(0.5, 0.3, 0.5, 0x6a5a40, 0, 0.15, 0)); g.add(box(0.2, 0.5, 0.2, 0xb08a40, 0, 0.5, 0));
  const arm = new THREE.Group(); arm.position.y = 0.75; g.add(arm);
  arm.add(box(0.08, 0.6, 0.08, 0x403020, 0, 0.3, 0)); const knob = box(0.18, 0.18, 0.18, 0xe04030, 0, 0.62, 0, 0x401010); arm.add(knob);
  return { obj: g, set(on) { arm.rotation.x = on ? -0.2 : 0.9; knob.material.color.set(on ? 0x50e070 : 0xe04030); } };
}
// a tide valve: a wheel on a pipe sunk into the rock
export function valveMesh() {
  const g = new THREE.Group();
  g.add(box(0.3, 1.0, 0.3, 0x70808a, 0, 0.5, 0));
  const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.07, 6, 16), new THREE.MeshLambertMaterial({ color: 0xc04030 }));
  wheel.position.set(0, 1.05, 0.2); g.add(wheel);
  for (let k = 0; k < 3; k++) { const sp = box(0.8, 0.06, 0.06, 0x806040, 0, 1.05, 0.2); sp.rotation.z = k * Math.PI / 3; g.add(sp); }
  let on = false, t = 0;
  return { obj: g, set(v) { on = v; wheel.material.color.set(v ? 0x40c0e0 : 0xc04030); }, update(dt) { t += dt; if (on) wheel.rotation.z += dt * 2; } };
}
// an updraught: pale rings climbing a column of air
export function ventMesh(height) {
  const g = new THREE.Group(), rings = [];
  const mat = new THREE.MeshBasicMaterial({ color: 0xe8fbff, transparent: true, opacity: 0.45, side: THREE.DoubleSide, depthWrite: false });
  for (let k = 0; k < 7; k++) { const r = new THREE.Mesh(new THREE.RingGeometry(0.55, 0.7, 18), mat.clone()); r.rotation.x = -Math.PI / 2; g.add(r); rings.push(r); }
  g.add(box(1.4, 0.15, 1.4, 0x8a9aa8, 0, 0.07, 0));
  return { obj: g, update(dt, t) { rings.forEach((r, i) => { const p = (t * 0.35 + i / rings.length) % 1; r.position.y = 0.2 + p * height; r.scale.setScalar(0.8 + Math.sin(p * 9 + i) * 0.15); r.material.opacity = 0.5 * (1 - p); r.rotation.z = t * 2 + i; }); } };
}
// a memory of the other side: like a shard, but sea-blue
export function echoMesh() { const m = shardMesh(); m.obj.traverse((o) => { if (o.isMesh) { o.material = o.material.clone(); o.material.color.set(o.material.type === 'MeshBasicMaterial' ? 0xb0e8ff : 0x80c8ff); if (o.material.emissive) o.material.emissive.set(0x205080); } }); return m; }
// something someone lost: a little glowing bundle
export function pickMesh() {
  const g = new THREE.Group(), b = box(0.3, 0.3, 0.3, 0xffe08a, 0, 0.35, 0, 0x806020); g.add(b);
  const halo = new THREE.Mesh(new THREE.RingGeometry(0.3, 0.38, 14), new THREE.MeshBasicMaterial({ color: 0xfff0b0, transparent: true, opacity: 0.6, side: THREE.DoubleSide })); halo.rotation.x = -Math.PI / 2; halo.position.y = 0.05; g.add(halo);
  return { obj: g, update(dt, t) { b.rotation.y += dt * 1.6; b.position.y = 0.35 + Math.sin(t * 3) * 0.06; halo.scale.setScalar(1 + Math.sin(t * 2) * 0.15); } };
}
// where a treasure map's X is: a red cross on the ground
export function digMesh() {
  const g = new THREE.Group();
  for (const s of [-1, 1]) { const b = box(1.1, 0.05, 0.18, 0xff3040, 0, 0.04, 0, 0x601010); b.rotation.y = s * Math.PI / 4; g.add(b); }
  return { obj: g, update(dt, t) { g.children.forEach((c) => c.material.emissive.setRGB(0.3 + Math.sin(t * 4) * 0.2, 0.05, 0.05)); } };
}
// a glittering ore vein on a rock
export function oreMesh(col = 0xc0c8d0) {
  const g = new THREE.Group(), inst = make('survival/resource-stone-large');
  if (inst.fit) inst.fit(0.9); g.add(inst.obj);
  const gems = [];
  for (let k = 0; k < 4; k++) { const b = box(0.14, 0.14, 0.14, col, Math.cos(k * 1.7) * 0.35, 0.45 + (k % 2) * 0.2, Math.sin(k * 1.7) * 0.35, new THREE.Color(col).multiplyScalar(0.5)); b.rotation.set(k, k * 2, 0); g.add(b); gems.push(b); }
  return { obj: g, update(dt, t) { gems.forEach((b, i) => b.material.emissive.setScalar(0.25 + Math.sin(t * 3 + i * 1.6) * 0.2)); } };
}
