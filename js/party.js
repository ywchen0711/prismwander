// The party: levels, a main job and a sub job each, job levels earned with JP, equipment, items and saving.
import { HEROES, JOBS, ABILITIES, ITEMS, START_JOBS, jpFor, expFor } from './data.js';
import { L } from './i18n.js';

export const S = { members: [], inv: {}, gold: 0, jobs: [], crystals: [], chests: {}, homes: [], flags: {}, beaten: {}, pos: null, yaw: 0, time: 0 };

export function newParty() {
  Object.assign(S, { members: [], inv: { potion: 4, ether: 1, antidote: 2 }, gold: 120, jobs: [...START_JOBS], crystals: [], chests: {}, homes: [], flags: {}, beaten: {}, pos: null, yaw: 0, time: 0 });
  const gear = { lowe: ['shortsword', 'tunic'], flora: ['rod', 'tunic'], bal: ['mallet', 'tunic'], shia: ['dagger', 'tunic'] };
  for (const id of Object.keys(HEROES)) {
    const job = HEROES[id].job;
    const m = { id, lv: 1, exp: 0, job, sub: null, jlv: { [job]: 1 }, jp: { [job]: 0 }, equip: { weapon: gear[id][0], armor: gear[id][1], acc: null }, status: {}, buffs: {} };
    const s = stats(m); m.hp = s.maxhp; m.mp = s.maxmp; S.members.push(m);
  }
}
export const heroName = (m) => HEROES[m.id].name;
export const jlvOf = (m, job) => (m.jlv && m.jlv[job]) || 1;

export function stats(m) {
  const b = HEROES[m.id].base, j = JOBS[m.job].st, g = 1 + (m.lv - 1) * 0.12;
  const s = {
    maxhp: Math.round((b.hp + (m.lv - 1) * b.hp * 0.16) * j.hp / 100), maxmp: Math.round((b.mp + (m.lv - 1) * b.mp * 0.1) * j.mp / 100),
    str: Math.round(b.str * g * j.str / 100), def: Math.round(b.def * g * j.def / 100), mag: Math.round(b.mag * g * j.mag / 100), spr: Math.round(b.spr * g * j.spr / 100), agi: Math.round(b.agi * g * j.agi / 100),
  };
  let wa = 0, ad = 0;
  for (const slot of ['weapon', 'armor', 'acc']) {
    const it = ITEMS[m.equip[slot]];
    if (!it) continue;
    wa += it.atk || 0; ad += it.def || 0;
    for (const k of ['str', 'mag', 'spr', 'agi']) s[k] += it[k] || 0;
    if (slot === 'acc' && it.def) s.def += it.def;
  }
  s.atk = s.str + Math.round(wa * 1.7);
  s.dfn = s.def + ad;
  return s;
}
// what a job has taught so far
export const learned = (job, jl) => JOBS[job].learn.filter(([l]) => jl >= l).map(([, a]) => a);
export function abilitiesOf(m) {
  const own = learned(m.job, jlvOf(m, m.job)), sub = m.sub ? learned(m.sub, jlvOf(m, m.sub)) : [];
  return [...new Set([...own, ...sub])];
}
export const hasPassive = (m, id) => abilitiesOf(m).includes(id) && ABILITIES[id].passive;
export function canEquip(m, item) {
  const it = ITEMS[item];
  if (!it || !it.slot) return false;
  if (it.slot !== 'weapon') return true;
  return JOBS[m.job].wep.includes(it.kind) || (m.sub && JOBS[m.sub].wep.includes(it.kind));
}
export function setJob(m, job, sub = false) {
  if (sub) { m.sub = job === m.job ? null : job; }
  else { m.job = job; if (m.sub === job) m.sub = null; }
  m.jlv[job] = m.jlv[job] || 1; m.jp[job] = m.jp[job] || 0;
  // a weapon the new jobs cannot hold goes back to the bag
  if (m.equip.weapon && !canEquip(m, m.equip.weapon)) { addItem(m.equip.weapon); m.equip.weapon = null; }
  const s = stats(m); m.hp = Math.min(m.hp, s.maxhp); m.mp = Math.min(m.mp, s.maxmp);
}

// returns lines to show after a battle
export function gain(exp, jp) {
  const out = [];
  for (const m of S.members) {
    if (m.hp <= 0) continue;
    m.exp += exp;
    while (m.exp >= expFor(m.lv + 1) && m.lv < 60) {
      const before = stats(m); m.lv++; const after = stats(m);
      m.hp += after.maxhp - before.maxhp; m.mp += after.maxmp - before.maxmp;
      out.push({ lv: true, t: L(`${heroName(m)}升到了 ${m.lv} 級！`, `${heroName(m)} reached level ${m.lv}!`) });
    }
    for (const [job, k] of [[m.job, 1], [m.sub, 0.5]]) {
      if (!job) continue;
      m.jp[job] = (m.jp[job] || 0) + Math.round(jp * k);
      while (m.jlv[job] < 12 && m.jp[job] >= jpFor(m.jlv[job] + 1)) {
        const had = learned(job, m.jlv[job]); m.jlv[job]++;
        const now = learned(job, m.jlv[job]).filter((a) => !had.includes(a));
        out.push({ lv: true, t: L(`${heroName(m)}的${JOBS[job].name}升到了 ${m.jlv[job]} 級！`, `${heroName(m)}'s ${JOBS[job].name} reached job level ${m.jlv[job]}!`) });
        for (const a of now) out.push({ t: L(`${heroName(m)}學會了「${ABILITIES[a].name}」！`, `${heroName(m)} learned ${ABILITIES[a].name}!`) });
      }
    }
  }
  return out;
}
export function addItem(id, n = 1) { S.inv[id] = (S.inv[id] || 0) + n; if (S.inv[id] <= 0) delete S.inv[id]; }
export const count = (id) => S.inv[id] || 0;
export function fullHeal() { for (const m of S.members) { const s = stats(m); m.hp = s.maxhp; m.mp = s.maxmp; m.status = {}; m.buffs = {}; } }

const KEY = 'prismwander-save';
export function save() { try { localStorage.setItem(KEY, JSON.stringify({ ...S, savedAt: Date.now() })); return true; } catch (e) { return false; } }
export function hasSave() { try { return !!localStorage.getItem(KEY); } catch (e) { return false; } }
export function load() {
  try { const d = JSON.parse(localStorage.getItem(KEY)); if (!d) return false; Object.assign(S, { members: [], inv: {}, flags: {}, chests: {}, beaten: {} }, d); return true; } catch (e) { return false; }
}
