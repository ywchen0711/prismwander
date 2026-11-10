// Models: Kenney's CC0 blocky characters, pets and props (GLB), each clone with its own animation mixer,
// and monsters built here out of blocks (slimes, crabs, golems, wisps, scorpions, a treant, a wyrm, the heart).
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as skClone } from 'three/addons/utils/SkeletonUtils.js';

const loader = new GLTFLoader();
const cache = new Map();
export function preload(paths) {
  return Promise.all(paths.map((p) => new Promise((res) => {
    if (cache.has(p)) { res(); return; }
    loader.load(`assets/models/${p}.glb`, (g) => {
      g.scene.traverse((o) => { if (o.isMesh) { o.castShadow = false; if (o.material && o.material.map) { o.material.map.magFilter = THREE.NearestFilter; o.material.map.colorSpace = THREE.SRGBColorSpace; } } });
      cache.set(p, g); res();
    }, undefined, () => { console.warn('missing model', p); cache.set(p, null); res(); });
  })));
}
// an instance: { obj, mixer, play(name), update(dt) }
export function make(path, opts = {}) {
  if (path.startsWith('vox:')) return voxel(path.slice(4), opts);
  const g = cache.get(path);
  if (!g) return voxel('slime', { color: '#ff00ff' });
  const obj = skClone(g.scene);
  // every pack has its own scale; measure once so callers can ask for a height in blocks
  if (!g.userData.h) { const bb = new THREE.Box3().setFromObject(g.scene); g.userData.h = Math.max(0.1, bb.max.y - bb.min.y); }
  const wrap = new THREE.Group(); wrap.add(obj);
  const mixer = new THREE.AnimationMixer(obj), clips = Object.fromEntries(g.animations.map((a) => [a.name, a]));
  let cur = null, curName = '';
  const inst = {
    obj: wrap, mixer, clips, h: g.userData.h,
    fit(target) { wrap.scale.setScalar(target / g.userData.h); return inst; },
    play(name, { once = false, fade = 0.15 } = {}) {
      const c = clips[name] || clips[{ sprint: 'walk', run: 'walk', jump: 'walk', fall: 'walk' }[name]] || clips.idle || clips.static;
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
  const light = new THREE.PointLight(color, 1.4, 7); light.position.y = 1; g.add(light);
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
