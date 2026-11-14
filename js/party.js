// The party: levels, a main job and a sub job each, job levels earned with JP, equipment, items and saving.
import { HEROES, JOBS, ABILITIES, ITEMS, MONSTERS, START_JOBS, jpFor, expFor } from './data.js';
import { L } from './i18n.js';
import { JL_MAX, JOB_INFO, supSlots } from './data3.js';
import { BOOK_REWARDS, MASTERY_REWARDS } from './data4.js';

export const S = { scanned: {}, members: [], inv: {}, gold: 0, jobs: [], crystals: [], chests: {}, homes: [], flags: {}, beaten: {}, pos: null, yaw: 0, time: 0, clock: 0.3, quests: {}, shards: [], picked: {}, kills: {}, fish: {}, crystals2: [], lost: [], mastery: {}, masterQ: {}, jobWins: {}, lore: [], seen: {}, defeated: {}, mined: {}, dug: {}, levers: {}, meal: null, boat: null, arena: {}, echoes: [], cooked: {} };
// what a new journey and an older save both start from, for the things added with the Eastern Sea
const fresh = () => ({ crystals2: [], lost: [], mastery: {}, masterQ: {}, jobWins: {}, lore: [], seen: {}, defeated: {}, mined: {}, dug: {}, levers: {}, meal: null, boat: null, arena: {}, echoes: [], cooked: {}, rewards: {}, hunts: {} });

export function newParty() {
  Object.assign(S, { members: [], inv: { potion: 4, ether: 1, antidote: 2 }, gold: 120, jobs: [...START_JOBS], crystals: [], chests: {}, homes: [], flags: {}, beaten: {}, pos: null, yaw: 0, time: 0, clock: 0.3, quests: {}, shards: [], picked: {}, kills: {}, fish: {}, scanned: {}, ...fresh() });
  const gear = { lowe: ['shortsword', 'tunic'], flora: ['rod', 'tunic'], bal: ['mallet', 'tunic'], shia: ['dagger', 'tunic'] };
  for (const id of Object.keys(HEROES)) {
    const job = HEROES[id].job;
    const m = { id, row: id === 'flora' || id === 'bal' ? 'back' : 'front', lv: 1, exp: 0, job, sub: null, jlv: { [job]: 1 }, jp: { [job]: 0 }, equip: { weapon: gear[id][0], armor: gear[id][1], acc: null }, sup: [], cmd: null, status: {}, buffs: {} };
    const s = stats(m); m.hp = s.maxhp; m.mp = s.maxmp; S.members.push(m);
  }
}
export const heroName = (m) => HEROES[m.id].name;
export const jlvOf = (m, job) => (m.jlv && m.jlv[job]) || 1;

// a job taken to job level 20 is mastered: it leaves a bonus that stays whatever job the hero has on
export const mastered = (m, job) => jlvOf(m, job) >= JL_MAX;
export function masteryBonus(m) {
  const out = { hp: 0, mp: 0, str: 0, def: 0, mag: 0, spr: 0, agi: 0 };
  for (const job of Object.keys(m.jlv || {})) if (mastered(m, job) && JOB_INFO[job]) for (const [k, v] of Object.entries(JOB_INFO[job].bonus)) out[k] += v;
  return out;
}
export function stats(m) {
  const b = HEROES[m.id].base, j = JOBS[m.job].st, g = 1 + (m.lv - 1) * 0.12, mb = masteryBonus(m), pas = passivesOf(m);
  const k = (key) => 1 + mb[key] / 100;
  const s = {
    maxhp: Math.round((b.hp + (m.lv - 1) * b.hp * 0.16) * j.hp / 100 * k('hp') * (pas.has('hpup') ? 1.15 : 1)), maxmp: Math.round((b.mp + (m.lv - 1) * b.mp * 0.1) * j.mp / 100 * k('mp') * (pas.has('mpup') ? 1.2 : 1)),
    str: Math.round(b.str * g * j.str / 100 * k('str')), def: Math.round(b.def * g * j.def / 100 * k('def')), mag: Math.round(b.mag * g * j.mag / 100 * k('mag')), spr: Math.round(b.spr * g * j.spr / 100 * k('spr')), agi: Math.round(b.agi * g * j.agi / 100 * k('agi')),
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
  // support abilities that raise a stat
  if (pas.has('atkup')) s.atk = Math.round(s.atk * 1.1);
  if (pas.has('magup')) s.mag = Math.round(s.mag * 1.1);
  if (pas.has('defup')) s.dfn = Math.round(s.dfn * 1.1);
  if (pas.has('agiup')) s.agi = Math.round(s.agi * 1.1);
  return s;
}
// what a job has taught so far
export const learned = (job, jl) => JOBS[job].learn.filter(([l]) => jl >= l).map(([, a]) => a);
// a master's art comes with the job it belongs to, main or sub
export const MASTER_ARTS = { fencer: 'swordsaint', mage: 'elemruin', cleric: 'miracle', rogue: 'mug', guardian: 'aegis', ranger: 'heavensbow', bard: 'anthem', monk: 'dragonfist', alchemist: 'philosopher', chrono: 'timewarp', dancer: 'tempest', astro: 'bigbang' };
export function abilitiesOf(m) {
  const own = learned(m.job, jlvOf(m, m.job)), sub = m.sub ? learned(m.sub, jlvOf(m, m.sub)) : [];
  const arts = [m.job, m.sub].filter((j) => j && S.mastery && S.mastery[j] && MASTER_ARTS[j]).map((j) => MASTER_ARTS[j]);
  return [...new Set([...own, ...sub, ...arts])];
}
// a job counts if it is someone's main or sub job
export const hasJob = (m, job) => m.job === job || m.sub === job;
// passives work from the main job, the sub job, and the support slots (any passive the hero has learned in any job)
export function passivesOf(m) { return new Set([...abilitiesOf(m), ...(m.sup || [])].filter((a) => ABILITIES[a] && ABILITIES[a].passive)); }
export const hasPassive = (m, id) => !!(ABILITIES[id] && ABILITIES[id].passive) && (abilitiesOf(m).includes(id) || (m.sup || []).includes(id));
// every passive a hero has learned in any job, which is what the support slots can hold
export function learnedPassives(m) { const out = []; for (const job of Object.keys(m.jlv || {})) if (JOBS[job]) for (const a of learned(job, jlvOf(m, job))) if (ABILITIES[a].passive && !out.includes(a)) out.push(a); return out; }
export { supSlots };
// a mastered job (not the main or sub) can lend all its actions as an extra battle command
export const cmdJobs = (m) => Object.keys(m.jlv || {}).filter((j) => JOBS[j] && mastered(m, j) && j !== m.job && j !== m.sub);
export function cmdAbilities(m) {
  if (!m.cmd || !JOBS[m.cmd] || !mastered(m, m.cmd) || m.cmd === m.job || m.cmd === m.sub) return [];
  const own = new Set(abilitiesOf(m));
  return learned(m.cmd, JL_MAX).filter((a) => !ABILITIES[a].passive && !own.has(a));
}
// masteries across the whole party, and distinct monsters defeated
export const masteryCount = () => S.members.reduce((n, m) => n + Object.keys(m.jlv || {}).filter((j) => mastered(m, j)).length, 0);
export const bookCount = () => Object.keys(S.defeated || {}).filter((id) => MONSTERS[id]).length;
export const bookNeed = (n) => (n === Infinity ? Object.keys(MONSTERS).length : n);
// hand out any reward track prizes that have been earned; returns lines to show
export function milestones() {
  S.rewards = S.rewards || {}; const out = [];
  for (const [n, item, c] of BOOK_REWARDS) { const k = 'book' + n; if (!S.rewards[k] && bookCount() >= bookNeed(n)) { S.rewards[k] = true; addItem(item, c); out.push({ lv: true, t: L(`魔物圖鑑達成 ${bookNeed(n)} 種！獲得${ITEMS[item].name}${c > 1 ? ' ×' + c : ''}。`, `Bestiary: ${bookNeed(n)} kinds defeated! Received ${ITEMS[item].name}${c > 1 ? ' x' + c : ''}.`) }); } }
  for (const [n, item, c] of MASTERY_REWARDS) { const k = 'mast' + n; if (!S.rewards[k] && masteryCount() >= n) { S.rewards[k] = true; addItem(item, c); out.push({ lv: true, t: L(`全隊精通了 ${n} 個職業！獲得${ITEMS[item].name}${c > 1 ? ' ×' + c : ''}。`, `${n} jobs mastered across the party! Received ${ITEMS[item].name}${c > 1 ? ' x' + c : ''}.`) }); } }
  return out;
}
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
    // support abilities and charms that make battles teach more
    const myExp = Math.round(exp * (hasPassive(m, 'expboost') ? 1.25 : 1)), myJp = jp * (hasPassive(m, 'jpboost') ? 1.5 : 1) * (gearHas(m, 'jpUp') ? 1.3 : 1);
    m.exp += myExp;
    while (m.exp >= expFor(m.lv + 1) && m.lv < 70) {
      const before = stats(m); m.lv++; const after = stats(m);
      m.hp += after.maxhp - before.maxhp; m.mp += after.maxmp - before.maxmp;
      out.push({ lv: true, t: L(`${heroName(m)}升到了 ${m.lv} 級！`, `${heroName(m)} reached level ${m.lv}!`) });
    }
    for (const [job, k] of [[m.job, 1], [m.sub, 0.5]]) {
      if (!job) continue;
      m.jp[job] = (m.jp[job] || 0) + Math.round(myJp * k);
      while (m.jlv[job] < JL_MAX && m.jp[job] >= jpFor(m.jlv[job] + 1)) {
        const had = learned(job, m.jlv[job]); m.jlv[job]++;
        const now = learned(job, m.jlv[job]).filter((a) => !had.includes(a));
        out.push({ lv: true, t: L(`${heroName(m)}的${JOBS[job].name}升到了 ${m.jlv[job]} 級！`, `${heroName(m)}'s ${JOBS[job].name} reached job level ${m.jlv[job]}!`) });
        for (const a of now) out.push({ t: L(`${heroName(m)}學會了「${ABILITIES[a].name}」！`, `${heroName(m)} learned ${ABILITIES[a].name}!`) });
        if (m.jlv[job] >= JL_MAX) out.push({ lv: true, t: L(`${heroName(m)}精通了${JOBS[job].name}！能力值永久提升。`, `${heroName(m)} has mastered the ${JOBS[job].name}! A lasting stat bonus.`) });
      }
    }
  }
  return out;
}
export function gearHas(m, key) { for (const sl of ['weapon', 'armor', 'acc']) { const it = ITEMS[m.equip[sl]]; if (it && it[key]) return it[key]; } return null; }
export const immuneTo = (m, st) => ['weapon', 'armor', 'acc'].some((sl) => { const it = ITEMS[m.equip[sl]]; return it && it.immune && it.immune.includes(st); });
export const resists = (m, el) => ['weapon', 'armor', 'acc'].some((sl) => { const it = ITEMS[m.equip[sl]]; return it && it.res && it.res.includes(el); });
export function addItem(id, n = 1) { S.inv[id] = (S.inv[id] || 0) + n; if (S.inv[id] <= 0) delete S.inv[id]; }
export const count = (id) => S.inv[id] || 0;
export function fullHeal() { for (const m of S.members) { const s = stats(m); m.hp = s.maxhp; m.mp = s.maxmp; m.status = {}; m.buffs = {}; } }

const KEY = 'prismwander-save';
export const SAVE_VERSION = 3;
export function save() { try { localStorage.setItem(KEY, JSON.stringify({ ...S, v: SAVE_VERSION, savedAt: Date.now() })); return true; } catch (e) { return false; } }
export function hasSave() { try { return !!localStorage.getItem(KEY); } catch (e) { return false; } }
export function load() {
  try { const d = JSON.parse(localStorage.getItem(KEY)); if (!d) return false; if ((d.v || 1) < SAVE_VERSION) { d.pos = null; d.homes = []; d.chests = {}; d.beaten = {}; } Object.assign(S, { members: [], inv: {}, flags: {}, chests: {}, beaten: {}, clock: 0.3, quests: {}, shards: [], picked: {}, kills: {}, fish: {}, scanned: {}, ...fresh() }, d); for (const m of S.members) { m.row = m.row || 'front'; m.sup = (m.sup || []).filter((a) => ABILITIES[a] && ABILITIES[a].passive); m.cmd = m.cmd && JOBS[m.cmd] ? m.cmd : null; m.jlv = m.jlv || {}; m.jp = m.jp || {}; } return true; } catch (e) { return false; }
}
