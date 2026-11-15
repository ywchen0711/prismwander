// Battle orders: each hero keeps a short list of rules, CONDITION -> ACTION, checked from the top every turn.
// The first rule whose condition holds and whose action can be done right now is taken; with none, a plain attack.
// Rules only see what the player could know: weaknesses after a scan, HP only of scanned monsters (otherwise
// how much damage they have taken), and whether a steal has already worked on a monster.
import { ABILITIES, ITEMS, MONSTERS, JOBS, affinity } from './data.js';
import { S, stats, abilitiesOf, cmdAbilities, heroName, MASTER_ARTS } from './party.js';
import { L } from './i18n.js';

// ---------- the save ----------
const AILS = ['poison', 'blind', 'silence', 'burn', 'freeze', 'doom', 'slow', 'sleep', 'stun'];
export const MODES = ['manual', 'auto', 'mix'];
export const modeName = (k) => ({ manual: L('手動', 'Manual'), auto: L('作戰', 'Tactics'), mix: L('混合', 'Mixed') }[k]);
// more rule slots come with the journey
export function maxSlots() { return 6 + [S.crystals.length >= 4, S.crystals.length >= 8, !!(S.flags && S.flags.cleared), (S.crystals2 || []).length >= 4].filter(Boolean).length; }
export const SLOT_STEPS = () => [[L('一開始', 'At the start'), 6], [L('找到 4 顆水晶', '4 crystals found'), 7], [L('找到 8 顆水晶', '8 crystals found'), 8], [L('打倒稜晶之心之後', 'After the Prism Heart falls'), 9], [L('找到 4 顆東方水晶', '4 eastern crystals found'), 10]];
// the tactics part of the save, made on first use; an older save starts in manual mode
export function T() {
  if (!S.tactics || typeof S.tactics !== 'object') S.tactics = { mode: 'manual', fast: false, per: {}, rules: {} };
  const t = S.tactics;
  if (!MODES.includes(t.mode)) t.mode = 'manual';
  t.per = t.per || {}; t.rules = t.rules || {};
  S.members.forEach((m, i) => {
    if (!Array.isArray(t.rules[m.id])) t.rules[m.id] = presetRules(suggested(m.job)[0]);
    const rs = t.rules[m.id]; for (let k = rs.length - 1; k >= 0; k--) if (!rs[k] || !COND[rs[k].c] || !actionKnown(rs[k].a)) rs.splice(k, 1);
    if (t.per[m.id] !== 'manual' && t.per[m.id] !== 'auto') t.per[m.id] = i === 0 ? 'manual' : 'auto';
  });
  return t;
}
export const rulesOf = (m) => T().rules[m.id];
// does this hero act by the rules in the mode now set?
export function isAuto(m) { const t = T(); return t.mode === 'auto' || (t.mode === 'mix' && t.per[m.id] === 'auto'); }

// ---------- conditions ----------
const ratio = (m) => m.hp / Math.max(1, stats(m).maxhp);
const mpRatio = (m) => { const s = stats(m); return s.maxmp ? m.mp / s.maxmp : 1; };
const lowest = (arr, key) => arr.reduce((b, x) => (b === null || key(x) < key(b) ? x : b), null);
const foeAil = (f) => Object.keys(f.status || {}).some((k) => ['poison', 'sleep', 'stun', 'slow', 'blind', 'silence', 'burn', 'freeze', 'doom'].includes(k));
// what the player can tell of a monster's health: its HP once scanned, otherwise only the damage it has taken
const hpSeen = (f) => (S.scanned[f.id] ? f.hp / f.maxhp : 1 - Math.min(0.99, (f.taken || 0) / 1e6));
export const knownWeak = (f) => (S.scanned[f.id] ? affinity(f.id).weak : []);
export const knownRes = (f) => (S.scanned[f.id] ? affinity(f.id).res : []);
const allyIf = (x, f) => { const c = x.party.filter((q) => q.m.hp > 0 && !q.m.jumping && f(q)); const q = lowest(c, (q2) => ratio(q2.m)); return q ? { kind: 'ally', t: q } : null; };
const ailing = (x, sts) => allyIf(x, (q) => !x.plan.cured.has(q) && sts.some((k) => q.m.status[k]));
const foeIf = (x, f, key) => { const c = x.foes.filter(f); if (!c.length) return null; return { kind: 'foe', t: key ? lowest(c, key) : (c.includes(x.leaderTarget) ? x.leaderTarget : c[0]) }; };
const ANY = { kind: 'none' };
// g: who the condition is about (sets the group in the lists); n: name; d: what it means
export const COND = {
  ally_hp70: { g: 'ally', n: ['夥伴 HP < 70%', 'Ally HP < 70%'], d: ['HP 低於七成、還沒有人要替他回復的夥伴（最低的那位）。', 'The ally lowest on HP, under 70%, that no one is healing yet this round.'], test: (x) => allyIf(x, (q) => ratio(q.m) < 0.7 && !x.plan.healed.has(q)) },
  ally_hp50: { g: 'ally', n: ['夥伴 HP < 50%', 'Ally HP < 50%'], d: ['HP 低於一半的夥伴。', 'An ally under half HP.'], test: (x) => allyIf(x, (q) => ratio(q.m) < 0.5 && !x.plan.healed.has(q)) },
  ally_hp30: { g: 'ally', n: ['夥伴 HP < 30%', 'Ally HP < 30%'], d: ['HP 低於三成、很危險的夥伴。', 'An ally in danger, under 30% HP.'], test: (x) => allyIf(x, (q) => ratio(q.m) < 0.3 && !x.plan.healed.has(q)) },
  party_hurt: { g: 'ally', n: ['兩人以上 HP < 60%', '2+ allies HP < 60%'], d: ['至少兩位夥伴的 HP 低於六成：適合全體回復。', 'At least two allies under 60% HP: a time to heal everyone.'], test: (x) => (x.party.filter((q) => q.m.hp > 0 && ratio(q.m) < 0.6).length >= 2 && !x.plan.healAll ? { kind: 'allies' } : null) },
  ally_ko: { g: 'ally', n: ['有夥伴倒下', 'Ally KO\'d'], d: ['倒下、還沒有人要讓他復活的夥伴。', 'A fallen ally no one is reviving yet this round.'], test: (x) => { const q = x.party.find((p) => p.m.hp <= 0 && !x.plan.revived.has(p)); return q ? { kind: 'dead', t: q } : null; } },
  ally_ail: { g: 'ally', n: ['夥伴有異常狀態', 'Ally has an ailment'], d: ['中毒、失明、沉默、灼傷、凍結、死亡宣告、減速、睡眠或暈眩中的夥伴。', 'An ally with poison, blind, silence, burns, freezing, doom, slow, sleep or stun.'], test: (x) => ailing(x, AILS) },
  ally_poison: { g: 'ally', n: ['夥伴中毒', 'Ally poisoned'], d: ['中毒的夥伴。', 'A poisoned ally.'], test: (x) => ailing(x, ['poison']) },
  ally_blind: { g: 'ally', n: ['夥伴失明', 'Ally blinded'], d: ['失明的夥伴（物理攻擊容易落空）。', 'A blinded ally (physical attacks miss more).'], test: (x) => ailing(x, ['blind']) },
  ally_silence: { g: 'ally', n: ['夥伴沉默', 'Ally silenced'], d: ['沉默、不能施法的夥伴。', 'A silenced ally who cannot cast.'], test: (x) => ailing(x, ['silence']) },
  ally_doom: { g: 'ally', n: ['夥伴被死亡宣告', 'Ally doomed'], d: ['被死亡宣告的夥伴：倒數完就會倒下。', 'An ally under doom: they fall when it runs out.'], test: (x) => ailing(x, ['doom']) },
  ally_asleep: { g: 'ally', n: ['夥伴睡著或暈眩', 'Ally asleep or stunned'], d: ['睡著、暈眩或凍結而不能行動的夥伴。', 'An ally who cannot act: asleep, stunned or frozen.'], test: (x) => ailing(x, ['sleep', 'stun', 'freeze']) },
  self_hp50: { g: 'self', n: ['自己 HP < 50%', 'Self HP < 50%'], d: ['自己的 HP 低於一半。', 'Your own HP is under half.'], test: (x) => (ratio(x.me.m) < 0.5 && !x.plan.healed.has(x.me) ? { kind: 'self', t: x.me } : null) },
  self_hp25: { g: 'self', n: ['自己 HP < 25%', 'Self HP < 25%'], d: ['自己的 HP 低於四分之一。', 'Your own HP is under a quarter.'], test: (x) => (ratio(x.me.m) < 0.25 && !x.plan.healed.has(x.me) ? { kind: 'self', t: x.me } : null) },
  self_mp30: { g: 'self', n: ['自己 MP < 30%', 'Self MP < 30%'], d: ['自己的 MP 低於三成。', 'Your own MP is under 30%.'], test: (x) => (stats(x.me.m).maxmp && mpRatio(x.me.m) < 0.3 ? { kind: 'self', t: x.me } : null) },
  foe_unstolen: { g: 'foe', n: ['敵人還沒被偷過', 'Enemy not stolen from'], d: ['還沒有偷竊成功過的敵人。偷到一次之後就不算了。', 'An enemy no one has stolen from yet. After one steal works it no longer counts.'], test: (x) => foeIf(x, (f) => !f.stolen && !x.plan.steal.has(f)) },
  foe_unscanned: { g: 'foe', n: ['敵人還沒被看破', 'Enemy not scanned'], d: ['弱點與 HP 還不清楚的敵人（同一種魔物看破一次就好）。', 'An enemy whose weaknesses and HP you do not know yet (one scan covers its kind).'], test: (x) => foeIf(x, (f) => !S.scanned[f.id] && !x.plan.scan.has(f.id)) },
  foe_weak: { g: 'foe', n: ['敵人的弱點已知', 'Enemy weakness known'], d: ['看破過、知道弱點屬性的敵人。', 'An enemy you have scanned and know a weakness of.'], test: (x) => foeIf(x, (f) => knownWeak(f).length > 0) },
  foe_lowhp: { g: 'foe', n: ['HP 最低的敵人', 'Enemy with lowest HP'], d: ['看破過的看 HP，沒看破的看受到多少傷害：最接近倒下的那個。', 'Scanned enemies by HP, others by the damage they have taken: the one closest to falling.'], test: (x) => foeIf(x, () => true, hpSeen) },
  foe_highhp: { g: 'foe', n: ['HP 最高的敵人', 'Enemy with highest HP'], d: ['和上面相反：最健康的那個敵人。', 'The opposite: the healthiest enemy.'], test: (x) => foeIf(x, () => true, (f) => -hpSeen(f) - (MONSTERS[f.id].boss ? 1 : 0)) },
  foe_boss: { g: 'foe', n: ['敵人是頭目', 'Enemy is a guardian'], d: ['頭目（守護者）級的敵人。', 'A guardian (boss) enemy.'], test: (x) => foeIf(x, (f) => !!MONSTERS[f.id].boss) },
  foe_ail: { g: 'foe', n: ['敵人有異常狀態', 'Enemy has an ailment'], d: ['中毒、睡著、暈眩、失明等狀態中的敵人（趁虛而入的技能更痛）。', 'An enemy that is poisoned, asleep, stunned, blinded and so on (openings hit harder).'], test: (x) => foeIf(x, foeAil) },
  foe_nodebuff: { g: 'foe', n: ['敵人沒被削弱', 'Enemy not weakened'], d: ['名字旁沒有 ↓ 的敵人：還沒被破防或削弱。', 'An enemy without a ↓ by its name: not yet broken or weakened.'], test: (x) => foeIf(x, (f) => !Object.values(f.buffs || {}).some((b) => b.k < 1)) },
  foe_air: { g: 'foe', n: ['敵人在空中', 'Enemy is airborne'], d: ['飛上高空、近戰打不到的敵人。', 'An enemy high in the air that melee cannot reach.'], test: (x) => foeIf(x, (f) => !!f.air) },
  leader_target: { g: 'foe', n: ['隊長的目標', "Leader's target"], d: ['隊伍第一位這回合（或上次）攻擊的敵人。', 'The enemy the party leader is attacking this round (or last did).'], test: (x) => (x.leaderTarget && x.foes.includes(x.leaderTarget) ? { kind: 'foe', t: x.leaderTarget } : null) },
  foe_any: { g: 'foe', n: ['任何敵人', 'Any enemy'], d: ['只要還有敵人就成立；目標是隊長的目標或第一個敵人。', 'Holds while any enemy stands; the target is the leader\'s or the first enemy.'], test: (x) => foeIf(x, () => true) },
  foes2: { g: 'field', n: ['敵人 2 隻以上', '2+ enemies'], d: ['場上的敵人有兩隻以上。', 'Two or more enemies on the field.'], test: (x) => (x.foes.length >= 2 ? ANY : null) },
  foes3: { g: 'field', n: ['敵人 3 隻以上', '3+ enemies'], d: ['場上的敵人有三隻以上。', 'Three or more enemies on the field.'], test: (x) => (x.foes.length >= 3 ? ANY : null) },
  first: { g: 'field', n: ['戰鬥的第一回合', 'First round'], d: ['戰鬥剛開始的第一回合。', 'The very first round of the battle.'], test: (x) => (x.round === 1 ? ANY : null) },
  row_front: { g: 'self', n: ['自己在前排', 'I am in the front row'], d: ['自己站在前排。', 'You stand in the front row.'], test: (x) => (x.me.m.row !== 'back' ? ANY : null) },
  row_back: { g: 'self', n: ['自己在後排', 'I am in the back row'], d: ['自己站在後排。', 'You stand in the back row.'], test: (x) => (x.me.m.row === 'back' ? ANY : null) },
  always: { g: 'field', n: ['任何時候', 'Always'], d: ['一定成立。放在最下面當作預設行動。', 'Always holds. Put it last as the default action.'], test: () => ANY },
};
export const condName = (id) => (COND[id] ? L(...COND[id].n) : '?');
export const GROUPS = { ally: ['夥伴', 'Ally'], self: ['自己', 'Self'], foe: ['敵人', 'Enemy'], field: ['戰場', 'Field'] };

// ---------- what abilities do, for the action kinds ----------
const A = (id) => ABILITIES[id];
const dmg = (a) => (a.type === 'phys' || a.type === 'magic' || (a.type === 'summon' && a.power && !a.heal && !a.shieldParty)) && !a.steal;
const isHealOne = (a) => (a.type === 'heal' && a.target === 'ally') || a.type === 'pctheal';
const isHealAll = (a) => (a.type === 'heal' && a.target === 'allies' && !a.revive) || (a.type === 'summon' && a.heal);
const isRevive = (a) => a.type === 'revive' || (a.type === 'heal' && a.revive);
const isCure = (a) => a.type === 'cure' || (a.cure && (a.type === 'heal' || a.type === 'pctheal') && a.target === 'ally');
const isBuff = (a) => a.type === 'buff' || a.type === 'ward' || a.type === 'regen';
const isDebuff = (a) => (a.type === 'status' && a.debuffs && !a.status && !a.statuses) || (a.type === 'phys' && a.debuff);
const isAil = (a) => a.type === 'status' && (a.status || a.statuses);
const isScan = (a) => a.type === 'scan' || a.scanIt;
const elOf = (a, f) => (a.el === 'auto' ? knownWeak(f)[0] || 'none' : a.el);
// a rough idea of how hard an ability lands, to pick the best one (phys power is a multiplier, magic a base number)
function score(m, a, f) {
  const s = stats(m), hits = a.hits || 1;
  let v = a.type === 'phys' ? a.power * hits * s.atk : (a.power + s.mag * 1.6) * hits;
  if (f) { const el = elOf(a, f); if (knownWeak(f).includes(el)) v *= 1.6; else if (knownRes(f).includes(el)) v *= 0.4; }
  return v;
}
const healAmt = (m, a) => (a.power >= 999 ? 9999 : a.type === 'pctheal' ? 0 : a.power + stats(m).mag * 0.6 + stats(m).spr * 1.2);
// things a rule would waste its turn on
function sensible(a, t, x) {
  if (!t || typeof t !== 'object') return true;
  if (t.m) {
    const m = t.m;
    if (isRevive(a) && a.type === 'revive') return m.hp <= 0;
    if (m.hp <= 0) return false;
    if (isCure(a) && !isHealOne(a)) return AILS.some((k) => m.status[k]);
    if (isHealOne(a)) return ratio(m) < 0.95;
    if (a.type === 'buff') return (a.stats || [a.stat]).some((k) => !m.buffs[k]);
    if (a.type === 'regen') return !m.status.regen;
    if (a.type === 'ward') return !m.status[a.ward];
    return true;
  }
  if (a.type === 'steal' || a.steal) return !t.stolen && !x.plan.steal.has(t);
  if (isScan(a)) return !S.scanned[t.id] && !x.plan.scan.has(t.id);
  if (isAil(a)) return ![a.status, ...(a.statuses || [])].filter(Boolean).every((k) => t.status[k]);
  if (isDebuff(a)) return [].concat(a.debuffs || a.debuff).some((k) => !t.buffs[k]);
  return true;
}
// the target an ability takes, given what the condition pointed at
function targetFor(a, r, x, f = null) {
  const ok = (t) => sensible(a, t, x) && (!f || f(t));
  const want = a.target;
  if (want === 'enemies') return x.foes.length ? 'allFoes' : null;
  if (want === 'allies') { if (isHealAll(a) || (a.type === 'heal' && !a.revive)) return x.party.some((q) => q.m.hp > 0 && ratio(q.m) < 0.8) ? 'allHeroes' : null; if (isRevive(a)) return x.party.some((q) => q.m.hp <= 0 && !x.plan.revived.has(q)) ? 'allHeroes' : null; if (a.type === 'buff') return x.party.some((q) => q.m.hp > 0 && (a.stats || [a.stat]).some((k) => !q.m.buffs[k])) ? 'allHeroes' : null; return 'allHeroes'; }
  if (want === 'none') return a.type === 'buff' && !sensible(a, x.me, x) ? null : 'none';
  if (want === 'self') return ok(x.me) ? x.me : null;
  if (want === 'dead') { if (r && r.kind === 'dead') return ok(r.t) ? r.t : null; return x.party.find((q) => q.m.hp <= 0 && !x.plan.revived.has(q)) || null; }
  if (want === 'ally') {
    if (r && (r.kind === 'ally' || r.kind === 'self')) return ok(r.t) ? r.t : null;
    if (r && r.kind === 'dead') return null;
    const c = x.party.filter((q) => q.m.hp > 0 && !q.m.jumping && ok(q) && !(isHealOne(a) && x.plan.healed.has(q)));
    return isHealOne(a) || isCure(a) ? lowest(c, (q) => ratio(q.m)) : (c.includes(x.me) ? x.me : c[0]) || null;
  }
  // one enemy
  if (r && r.kind === 'foe') return ok(r.t) ? r.t : null;
  const c = x.foes.filter(ok);
  return c.includes(x.leaderTarget) ? x.leaderTarget : c[0] || null;
}
// the abilities a hero can use from their jobs, master arts and extra command right now
export const heroAbilities = (m) => [...abilitiesOf(m), ...cmdAbilities(m)].filter((a) => A(a) && !A(a).passive);
const battleItem = (k) => ITEMS[k] && ITEMS[k].use && !ITEMS[k].food && !ITEMS[k].fish && !ITEMS[k].meal;
const haveItem = (x, k) => (S.inv[k] || 0) - (x.plan.items[k] || 0) > 0;
// try each ability of a kind, best first, and take the first with a sensible target
function tryAbils(ids, r, x, f) { for (const id of ids) { const t = targetFor(A(id), r, x, f); if (t) return { type: 'ability', id, target: t }; } return null; }
const usableIds = (x, pred) => heroAbilities(x.me.m).filter((id) => pred(A(id)) && x.usable(x.me.m, A(id)));

// ---------- actions ----------
// each: name, what it does, and run(cond result, context) -> a battle command or null when it cannot be done
export const ACT = {
  attack: { n: ['攻擊', 'Attack'], d: ['普通攻擊。目標由條件決定；條件沒有指定敵人時，打隊長的目標或第一個敵人。', 'A plain attack. The condition picks the target; if it names no enemy, the leader\'s target or the first enemy.'], run: (r, x) => {
    const melee = !x.ranged;
    const t = r && r.kind === 'foe' ? r.t : (x.foes.find((f) => f === x.leaderTarget && !(melee && f.air)) || x.foes.find((f) => !(melee && f.air)) || x.foes[0]);
    return t ? { type: 'attack', target: t } : null; } },
  guard: { n: ['防禦', 'Guard'], d: ['這回合防禦，最先行動、受到的傷害減少。', 'Guard this round: act first and take less damage.'], run: () => ({ type: 'guard' }) },
  steal: { n: ['偷竊', 'Steal'], d: ['用「偷竊」類技能，對還沒偷過的敵人下手。', 'Use a Steal ability on an enemy not yet stolen from.'], run: (r, x) => tryAbils(usableIds(x, (a) => a.type === 'steal'), r, x) },
  mug: { n: ['強奪', 'Mug'], d: ['邊打邊偷：用會同時造成傷害的偷竊技能（強奪、掠奪舞步……），最強的先。', 'Hit and steal: use a stealing attack (Mug, Swipe Step...), strongest first.'], run: (r, x) => tryAbils(usableIds(x, (a) => a.steal && a.type === 'phys').sort((a, b) => score(x.me.m, A(b)) - score(x.me.m, A(a))), r, x) },
  scan: { n: ['看破', 'Scan'], d: ['用看破類技能看清還沒看破過的敵人；沒有技能時不算。', 'Use a scanning ability on an enemy not yet scanned.'], run: (r, x) => tryAbils(usableIds(x, isScan).sort((a, b) => (A(a).type === 'scan' ? 0 : 1) - (A(b).type === 'scan' ? 0 : 1)), r, x) },
  exploit: { n: ['打弱點', 'Hit a weakness'], d: ['對弱點已知的敵人，用最痛的、帶有那個弱點屬性的技能；武器剛好是那個屬性時就普通攻擊。', 'On an enemy with a known weakness, the strongest ability of that element; or a plain attack when the weapon carries it.'], run: (r, x) => {
    const weakFoe = (f) => knownWeak(f).length > 0;
    const t0 = r && r.kind === 'foe' ? (weakFoe(r.t) ? r.t : null) : x.foes.find((f) => f === x.leaderTarget && weakFoe(f)) || x.foes.find(weakFoe);
    if (!t0) return null;
    const hits = usableIds(x, dmg).filter((id) => knownWeak(t0).includes(elOf(A(id), t0))).sort((a, b) => score(x.me.m, A(b), t0) - score(x.me.m, A(a), t0));
    for (const id of hits) { const t = A(id).target === 'enemies' ? 'allFoes' : t0; return { type: 'ability', id, target: t }; }
    if (x.weaponEl && knownWeak(t0).includes(x.weaponEl)) return { type: 'attack', target: t0 };
    return null; } },
  strong: { n: ['最強單體技', 'Strongest single hit'], d: ['用對一隻敵人最痛的技能（避開已知被抵抗的屬性）；比普通攻擊弱就不用。', 'The ability that hurts one enemy most (skipping elements it is known to resist); not if a plain attack would do as well.'], run: (r, x) => {
    const t = targetFor({ target: 'enemy', type: 'none' }, r, x); if (!t) return null;
    const base = stats(x.me.m).atk * 1.05;
    const ids = usableIds(x, (a) => dmg(a) && a.target === 'enemy').filter((id) => score(x.me.m, A(id), t) > base).sort((a, b) => score(x.me.m, A(b), t) - score(x.me.m, A(a), t));
    return ids.length ? { type: 'ability', id: ids[0], target: t } : null; } },
  area: { n: ['全體攻擊技', 'Hit all enemies'], d: ['用打全體敵人的技能，最強的先。', 'An ability that hits every enemy, strongest first.'], run: (r, x) => { const ids = usableIds(x, (a) => dmg(a) && a.target === 'enemies').sort((a, b) => score(x.me.m, A(b)) - score(x.me.m, A(a))); return ids.length && x.foes.length ? { type: 'ability', id: ids[0], target: 'allFoes' } : null; } },
  heal: { n: ['回復技（單體）', 'Healing (one)'], d: ['用回復一人的技能：剛好夠補滿的最小那個，不夠就用最強的。', 'A single-target heal: the smallest that covers the missing HP, or the strongest.'], run: (r, x) => {
    const ids = usableIds(x, isHealOne); if (!ids.length) return null;
    const t = targetFor(A(ids[0]), r, x); if (!t || typeof t !== 'object') return null;
    const miss = stats(t.m).maxhp - t.m.hp, m = x.me.m;
    const sorted = ids.filter((id) => A(id).type !== 'pctheal').sort((a, b) => healAmt(m, A(a)) - healAmt(m, A(b)));
    const id = sorted.find((k) => healAmt(m, A(k)) >= miss) || sorted[sorted.length - 1] || ids[0];
    return { type: 'ability', id, target: t }; } },
  healall: { n: ['回復技（全體）', 'Healing (all)'], d: ['用回復全隊的技能（有人 HP 低於八成時）。', 'A party-wide heal (when someone is under 80%).'], run: (r, x) => tryAbils(usableIds(x, isHealAll).sort((a, b) => (A(a).hpcost ? 1 : 0) - (A(b).hpcost ? 1 : 0) || A(a).mp - A(b).mp), r, x) },
  revive: { n: ['復活技', 'Revive (ability)'], d: ['用復活技能救起倒下的夥伴。', 'Raise a fallen ally with an ability.'], run: (r, x) => tryAbils(usableIds(x, isRevive).sort((a, b) => A(a).mp - A(b).mp), r && r.kind === 'dead' ? r : null, x) },
  cure: { n: ['淨化技', 'Cure (ability)'], d: ['用解除異常狀態的技能。', 'Lift ailments with an ability.'], run: (r, x) => tryAbils(usableIds(x, isCure), r, x, (t) => !t.m || AILS.some((k) => t.m.status[k])) },
  buff: { n: ['強化技', 'Boost'], d: ['用強化、再生、守護類技能，對還沒有那個效果的人。', 'A boost, regen or ward ability, on someone who lacks it.'], run: (r, x) => tryAbils(usableIds(x, isBuff), r, x) },
  debuff: { n: ['削弱技', 'Weaken'], d: ['用破防、削弱類技能，對還沒被削弱那一項的敵人。', 'A break or weakening ability, on an enemy not yet weakened that way.'], run: (r, x) => tryAbils(usableIds(x, isDebuff), r, x) },
  ailment: { n: ['異常技', 'Inflict ailment'], d: ['用讓敵人中毒、睡著、失明……的技能，對還沒有那個狀態的敵人。', 'An ability that poisons, puts to sleep, blinds... on an enemy without that ailment yet.'], run: (r, x) => tryAbils(usableIds(x, isAil), r, x) },
  master: { n: ['奧義', 'Master art'], d: ['學會的奧義能用時就用（MP 夠）。', 'A master art you know, when you can afford it.'], run: (r, x) => tryAbils(usableIds(x, (a) => Object.values(MASTER_ARTS).some((k) => A(k) === a)), r, x) },
  link: { n: ['連攜', 'Link art'], d: ['職業搭配得上的夥伴可以行動時，一起出連攜招式（夥伴放棄這回合）。', 'When a partner with the right job can act, a link art together (they give up their turn).'], run: (r, x) => { for (const o of x.links) { if (!x.usable(x.me.m, o.a)) continue; const t = targetFor(o.a, r, x); if (t) return { type: 'link', id: o.id, target: t, partner: o.partner }; } return null; } },
  item_heal: { n: ['回復藥', 'Potion'], d: ['用回復 HP 的藥：剛好夠的最小那瓶（料理和魚不會被拿去用）。', 'An HP medicine: the smallest that is enough (dishes and fish are left alone).'], run: (r, x) => {
    const ids = Object.keys(S.inv).filter((k) => battleItem(k) && ITEMS[k].use === 'heal' && ITEMS[k].target === 'ally' && haveItem(x, k)).sort((a, b) => ITEMS[a].power - ITEMS[b].power); if (!ids.length) return null;
    const t = targetFor({ type: 'heal', target: 'ally' }, r, x); if (!t || typeof t !== 'object') return null;
    const miss = stats(t.m).maxhp - t.m.hp; return { type: 'item', id: ids.find((k) => ITEMS[k].power >= miss) || ids[ids.length - 1], target: t }; } },
  item_mp: { n: ['以太', 'Ether'], d: ['用回復 MP 的藥，給 MP 最少（低於一半）的人；條件是「自己」時給自己。', 'An MP tonic for whoever is lowest on MP (under half); for yourself when the condition is about you.'], run: (r, x) => {
    const ids = Object.keys(S.inv).filter((k) => battleItem(k) && ITEMS[k].use === 'mp' && ITEMS[k].target === 'ally' && haveItem(x, k)).sort((a, b) => ITEMS[a].power - ITEMS[b].power); if (!ids.length) return null;
    let t = r && (r.kind === 'self' || r.kind === 'ally') ? r.t : lowest(x.party.filter((q) => q.m.hp > 0 && stats(q.m).maxmp > 0 && mpRatio(q.m) < 0.5), (q) => mpRatio(q.m));
    if (!t || t.m.hp <= 0 || mpRatio(t.m) >= 0.95) return null;
    const miss = stats(t.m).maxmp - t.m.mp; return { type: 'item', id: ids.find((k) => ITEMS[k].power >= miss) || ids[ids.length - 1], target: t }; } },
  item_revive: { n: ['鳳凰尾羽', 'Phoenix Plume'], d: ['用復活的道具救起倒下的夥伴。', 'Revive a fallen ally with an item.'], run: (r, x) => {
    const ids = Object.keys(S.inv).filter((k) => battleItem(k) && ITEMS[k].use === 'revive' && haveItem(x, k)).sort((a, b) => (ITEMS[a].power || 0) - (ITEMS[b].power || 0)); if (!ids.length) return null;
    const t = r && r.kind === 'dead' ? r.t : x.party.find((q) => q.m.hp <= 0 && !x.plan.revived.has(q)); if (!t || t.m.hp > 0) return null;
    return { type: 'item', id: ids[0], target: ITEMS[ids[0]].target === 'allies' ? 'allHeroes' : t }; } },
  item_cure: { n: ['解除異常的藥', 'Ailment cure'], d: ['用剛好能治好那些狀態的最便宜的藥（解毒劑、眼藥水……不夠才用萬能藥）。', 'The cheapest medicine that fixes every ailment the ally has (Antidote, Eye Drops... a Remedy only if needed).'], run: (r, x) => {
    const t = r && (r.kind === 'ally' || r.kind === 'self') ? r.t : allyIf(x, (q) => !x.plan.cured.has(q) && AILS.some((k) => q.m.status[k])); const q = t && t.kind ? t.t : t; if (!q || q.m.hp <= 0) return null;
    const has = AILS.filter((k) => q.m.status[k]); if (!has.length) return null;
    const ids = Object.keys(S.inv).filter((k) => battleItem(k) && haveItem(x, k) && ITEMS[k].target === 'ally' && (ITEMS[k].use === 'cureall' || (ITEMS[k].use === 'cure' && has.every((s) => (ITEMS[k].cures || ['poison', 'blind']).includes(s))))).sort((a, b) => (ITEMS[a].use === 'cureall') - (ITEMS[b].use === 'cureall') || (ITEMS[a].price || 0) - (ITEMS[b].price || 0));
    return ids.length ? { type: 'item', id: ids[0], target: q } : null; } },
  item_scan: { n: ['鑑定鏡', 'Seeing Lens'], d: ['用鑑定鏡看清還沒看破過的敵人。', 'A Seeing Lens on an enemy not yet scanned.'], run: (r, x) => {
    const ids = Object.keys(S.inv).filter((k) => battleItem(k) && ITEMS[k].use === 'scan' && haveItem(x, k)); if (!ids.length) return null;
    const t = targetFor({ type: 'scan', target: 'enemy' }, r, x); return t ? { type: 'item', id: ids[0], target: t } : null; } },
  row_back: { n: ['換到後排', 'Move to back row'], d: ['站到後排（不耗回合，接著看下一條）。', 'Step to the back row (free; the next rules are then checked).'], run: (r, x) => (x.me.m.row !== 'back' && !x.rowDone ? { type: 'row', row: 'back' } : null) },
  row_front: { n: ['換到前排', 'Move to front row'], d: ['站到前排（不耗回合，接著看下一條）。', 'Step to the front row (free; the next rules are then checked).'], run: (r, x) => (x.me.m.row === 'back' && !x.rowDone ? { type: 'row', row: 'front' } : null) },
};
export const ACT_ORDER = Object.keys(ACT);
// an action is a kind above, or one ability by id ("ab:<id>")
const actionKnown = (a) => !!ACT[a] || (typeof a === 'string' && a.startsWith('ab:') && !!A(a.slice(3)));
export const actName = (a) => (ACT[a] ? L(...ACT[a].n) : a && a.startsWith('ab:') && A(a.slice(3)) ? A(a.slice(3)).name : '?');
export function actDesc(a) { return ACT[a] ? L(...ACT[a].d) : L('使用這個技能（目標由條件決定）。', 'Use this ability (the condition picks the target).'); }
// can this hero use the action at all with the jobs on now (not counting MP or the moment)?
export function actAvailable(m, a) {
  if (!a.startsWith('ab:')) return true;
  return heroAbilities(m).includes(a.slice(3));
}

// ---------- deciding ----------
// x: { me, party, foes, round, leaderTarget, plan, usable(m, ability), links, ranged, weaponEl }
export function decide(x) {
  const rules = rulesOf(x.me.m);
  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i];
    if (!rule.on || !COND[rule.c]) continue;
    const r = COND[rule.c].test(x);
    if (!r) continue;
    let c = null;
    if (ACT[rule.a]) c = ACT[rule.a].run(r, x);
    else if (rule.a.startsWith('ab:')) { const id = rule.a.slice(3), a = A(id); if (a && heroAbilities(x.me.m).includes(id) && x.usable(x.me.m, a)) { const t = targetFor(a, r, x); if (t) c = { type: 'ability', id, target: t }; } }
    if (c) return { cmd: c, rule: i };
  }
  return { cmd: ACT.attack.run(null, x), rule: -1 };
}
// note what this command takes, so the next hero's rules do not do the same thing again this round
export function reserve(x, c) {
  const a = c.type === 'ability' ? A(c.id) : null, it = c.type === 'item' ? ITEMS[c.id] : null, t = c.target;
  if (it) x.plan.items[c.id] = (x.plan.items[c.id] || 0) + 1;
  if (t && t.m) {
    if ((a && (isHealOne(a))) || (it && it.use === 'heal')) x.plan.healed.add(t);
    if ((a && isRevive(a)) || (it && it.use === 'revive')) x.plan.revived.add(t);
    if ((a && isCure(a)) || (it && (it.use === 'cure' || it.use === 'cureall'))) x.plan.cured.add(t);
  }
  if (t === 'allHeroes' && a && isHealAll(a)) x.plan.healAll = true;
  if (t === 'allHeroes' && a && isRevive(a)) for (const q of x.party) if (q.m.hp <= 0) x.plan.revived.add(q);
  if (t && t.kind === 'foe') {
    if (a && (a.type === 'steal' || a.steal)) x.plan.steal.add(t);
    if ((a && isScan(a)) || (it && it.use === 'scan')) x.plan.scan.add(t.id);
  }
}
export const newPlan = () => ({ healed: new Set(), revived: new Set(), cured: new Set(), steal: new Set(), scan: new Set(), items: {}, healAll: false });

// ---------- presets ----------
const R = (c, a) => ({ c, a, on: true });
export const PRESETS = {
  thief: { n: ['盜賊：先偷再打', 'Thief: steal first'], d: ['每隻敵人都先偷一次，有人危險就用回復藥，其餘時間攻擊。', 'Steal from every enemy first, use a Potion on anyone in danger, otherwise attack.'], rules: [R('foe_unstolen', 'mug'), R('foe_unstolen', 'steal'), R('ally_hp50', 'item_heal'), R('foe_any', 'attack')] },
  healer: { n: ['治療師：保住全隊', 'Healer: keep everyone up'], d: ['先救倒下的人，再全體或單體回復、解除異常，MP 不夠就喝以太，沒事就攻擊。', 'Revive the fallen, then heal the party or the weakest, lift ailments, drink an Ether when low, otherwise attack.'], rules: [R('ally_ko', 'revive'), R('ally_ko', 'item_revive'), R('party_hurt', 'healall'), R('ally_hp50', 'heal'), R('ally_ail', 'cure'), R('foe_any', 'attack')] },
  attacker: { n: ['攻擊手：全力輸出', 'Attacker: all-out offence'], d: ['敵人多就用全體技，知道弱點就打弱點，其餘用最強的單體技或攻擊；快倒下時喝藥。', 'Hit everyone when there are many, exploit known weaknesses, else the strongest single hit or an attack; a Potion when nearly down.'], rules: [R('self_hp25', 'item_heal'), R('foes3', 'area'), R('foe_weak', 'exploit'), R('foe_lowhp', 'strong'), R('foe_lowhp', 'attack')] },
  scanner: { n: ['看破＋屬性：先看再打', 'Scanner: scan, then exploit'], d: ['先看破每一種敵人，再用弱點屬性攻擊，敵人多時用全體技，MP 低時喝以太。', 'Scan every kind of enemy first, then strike its weakness; hit everyone when there are several; an Ether when low on MP.'], rules: [R('foe_unscanned', 'scan'), R('foe_unscanned', 'item_scan'), R('foe_weak', 'exploit'), R('foes2', 'area'), R('self_mp30', 'item_mp'), R('foe_any', 'attack')] },
  support: { n: ['輔助：強化與削弱', 'Support: boosts and breaks'], d: ['第一回合強化隊伍，削弱頭目，替夥伴解除異常、補血，其餘時間攻擊。', 'Boost the party on the first round, weaken guardians, cure and patch up allies, otherwise attack.'], rules: [R('first', 'buff'), R('foe_boss', 'debuff'), R('ally_ail', 'item_cure'), R('ally_hp30', 'item_heal'), R('always', 'buff'), R('foe_any', 'attack')] },
  guard: { n: ['堅守：保命為先', 'Defender: stay alive'], d: ['自己危險就喝藥，夥伴危險就給藥，其餘時間防禦。適合等級還低、跟著練功的人。', 'Drink a Potion when in danger, give one to an ally in danger, otherwise guard. Good for a low-level hero along for the training.'], rules: [R('self_hp50', 'item_heal'), R('ally_hp30', 'item_heal'), R('ally_ko', 'item_revive'), R('always', 'guard')] },
  showtime: { n: ['大招：奧義與連攜', 'Showtime: arts and links'], d: ['奧義和連攜能用就用，敵人多時全體技，其餘最強單體技或攻擊。', 'Master arts and links whenever possible, hit-all when there are many, else the strongest hit or an attack.'], rules: [R('foe_boss', 'master'), R('foe_any', 'link'), R('foes2', 'area'), R('foe_any', 'strong'), R('foe_any', 'attack')] },
};
export const presetRules = (k) => (PRESETS[k] || PRESETS.attacker).rules.map((r) => ({ ...r }));
// one or two good presets for each job (the first is the default)
const JOB_PRESET = { fencer: ['attacker', 'showtime'], mage: ['scanner', 'attacker'], cleric: ['healer', 'support'], rogue: ['thief', 'attacker'], guardian: ['guard', 'support'], ranger: ['attacker', 'scanner'], bard: ['support', 'healer'], monk: ['attacker', 'showtime'], alchemist: ['healer', 'support'], chrono: ['support', 'scanner'], dancer: ['thief', 'support'], astro: ['scanner', 'attacker'], scholar: ['scanner', 'support'], druid: ['healer', 'support'], paladin: ['healer', 'attacker'], samurai: ['attacker', 'showtime'], dragoon: ['attacker', 'showtime'], summoner: ['scanner', 'attacker'], machinist: ['attacker', 'scanner'], geomancer: ['scanner', 'attacker'], hexer: ['support', 'scanner'], duskknight: ['attacker', 'showtime'], mimic: ['attacker', 'scanner'], chef: ['healer', 'support'] };
export const suggested = (job) => JOB_PRESET[job] || ['attacker'];
// a rule as one line of text
export const ruleText = (r) => `${condName(r.c)} → ${actName(r.a)}`;
void JOBS; void heroName;
// does the hero have the means for an action kind right now (an ability of that kind, an item of that kind)?
export function kindReady(m, k) {
  if (!ACT[k]) return actAvailable(m, k);
  const ab = heroAbilities(m).map(A), inv = (f) => Object.keys(S.inv).some((i) => battleItem(i) && f(ITEMS[i]));
  const mast = (a) => Object.values(MASTER_ARTS).some((id) => A(id) === a);
  return ({
    steal: () => ab.some((a) => a.type === 'steal'), mug: () => ab.some((a) => a.steal && a.type === 'phys'), scan: () => ab.some(isScan),
    exploit: () => ab.some(dmg) || !!(ITEMS[m.equip.weapon] && ITEMS[m.equip.weapon].el), strong: () => ab.some((a) => dmg(a) && a.target === 'enemy'), area: () => ab.some((a) => dmg(a) && a.target === 'enemies'),
    heal: () => ab.some(isHealOne), healall: () => ab.some(isHealAll), revive: () => ab.some(isRevive), cure: () => ab.some(isCure), buff: () => ab.some(isBuff), debuff: () => ab.some(isDebuff), ailment: () => ab.some(isAil), master: () => ab.some(mast),
    item_heal: () => inv((it) => it.use === 'heal' && it.target === 'ally'), item_mp: () => inv((it) => it.use === 'mp' && it.target === 'ally'), item_revive: () => inv((it) => it.use === 'revive'), item_cure: () => inv((it) => it.use === 'cure' || it.use === 'cureall'), item_scan: () => inv((it) => it.use === 'scan'),
  }[k] || (() => true))();
}
