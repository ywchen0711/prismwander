// Words for everything the player picks or compares: jobs, abilities, items, gear, monsters, ailments, elements,
// and the pages of the Help menu. Numbers come straight from the data so they stay right when the data changes.
import { JOBS, ABILITIES, ITEMS, MONSTERS, TECHS, EL_NAME, jpFor, monsterStats, affinity, kindOf } from './data.js';
import { LINKS, MASTER_ART, MASTER_WINS, RECIPES, FORGE } from './data2.js';
import { JL_MAX, JOB_INFO, DROPS, RARE_AT, FIELD_AT } from './data3.js';
import { S, stats, jlvOf, learned, mastered, masteryBonus, canEquip, heroName, cmdAbilities, masteryCount, bookCount, bookNeed, abilitiesOf } from './party.js';
import { MONSTER_LORE } from './lore.js';
import { POST_AT, BOOK_REWARDS, MASTERY_REWARDS, HUNTS } from './data4.js';
import { L } from './i18n.js';

const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const SEP = () => L('・', ' · ');
export const elName = (el) => (EL_NAME[el] ? L(EL_NAME[el][0], EL_NAME[el][1]) : '');
// ailments and other lasting effects: a name, a colour and what it does
export const STATUS = {
  poison:  { n: ['中毒', 'Poison'], col: '#c890ff', d: ['每回合結束失去最大 HP 的 1/12（魔物 1/14）。不會自己好，戰鬥結束後也會留著。', 'Lose 1/12 of max HP at the end of each round (monsters 1/14). It does not wear off, and stays after battle.'] },
  sleep:   { n: ['睡眠', 'Sleep'], col: '#a0c0ff', d: ['不能行動，約 2 回合。受到傷害就會醒來。', 'Cannot act for about 2 rounds. Taking damage wakes you.'] },
  stun:    { n: ['暈眩', 'Stun'], col: '#ffe070', d: ['下一回合不能行動。', 'Lose the next turn.'] },
  slow:    { n: ['減速', 'Slow'], col: '#f8b060', d: ['速度減半，比較晚才行動（4 回合）。', 'Speed halved, so you act later (4 rounds).'] },
  blind:   { n: ['失明', 'Blind'], col: '#b8b8c8', d: ['物理攻擊多 45% 機率落空（3～4 回合）。', 'Physical attacks get a 45% extra chance to miss (3-4 rounds).'] },
  silence: { n: ['沉默', 'Silence'], col: '#f8a0d0', d: ['不能使用魔法、回復、召喚等法術類技能（3 回合）。', 'No spells: magic, healing, summons and the like (3 rounds).'] },
  burn:    { n: ['灼傷', 'Burn'], col: '#ff8050', d: ['每回合失去最大 HP 的 1/14，攻擊力 ×0.8（3 回合）。', 'Lose 1/14 of max HP each round and attack x0.8 (3 rounds).'] },
  freeze:  { n: ['凍結', 'Freeze'], col: '#a0e8ff', d: ['下一回合不能行動。被火打中會解凍。', 'Lose the next turn. A fire hit thaws you.'] },
  doom:    { n: ['死亡宣告', 'Doom'], col: '#ff5a5a', d: ['倒數 4 回合，數到 0 就倒下。聖水或萬能藥可以解除。', 'Counts down from 4; at 0 you fall. Holy Water or a Remedy lifts it.'] },
  regen:   { n: ['再生', 'Regen'], col: '#80f8a0', d: ['每回合結束回復最大 HP 的 9%（4 回合）。', 'Restore 9% of max HP at the end of each round (4 rounds).'] },
  mark:    { n: ['標記', 'Mark'], col: '#ffb070', d: ['被標記的魔物受到的所有傷害 +30%（4 回合，頭目也有效）。', 'A marked monster takes 30% more damage from everything (4 rounds, guardians too).'] },
  reraise: { n: ['守護天使', 'Guardian Angel'], col: '#fff0a0', d: ['倒下時以 25% HP 自動復活一次（9 回合內）。', 'Rise again at 25% HP the first time you fall (within 9 rounds).'] },
  thorns:  { n: ['荊棘', 'Thorns'], col: '#a0e070', d: ['近身攻擊你的敵人會受到傷害的 40% 反傷（4 回合）。', 'Foes who hit you in melee take 40% of the damage back (4 rounds).'] },
  dusk:    { n: ['暮光', 'Dusk'], col: '#c8a0ff', d: ['艾茵的暮光之紗：擋住永晝的灼燒。', "Ein's veil of dusk: shields you from the endless noon."] },
};
export const stName = (s) => (STATUS[s] ? L(STATUS[s].n[0], STATUS[s].n[1]) : s);
const STAT_N = { str: ['攻擊', 'attack'], def: ['防禦', 'defence'], agi: ['速度', 'speed'], mag: ['魔力', 'magic'], spr: ['魔防', 'magic defence'] };
const statN = (k) => (STAT_N[k] ? L(...STAT_N[k]) : '');
export const kindName = (k) => ({ sword: L('劍', 'swords'), staff: L('杖', 'staves'), dagger: L('短劍', 'daggers'), hammer: L('鎚', 'hammers'), bow: L('弓', 'bows'), fist: L('拳套', 'fists'), spear: L('槍', 'spears'), gun: L('火槍', 'guns') }[k] || k);
const TGT = (t) => ({ enemy: L('單體', 'one foe'), enemies: L('全體敵人', 'all foes'), ally: L('一位夥伴', 'one friend'), allies: L('全體夥伴', 'all friends'), self: L('自己', 'self'), dead: L('倒下的夥伴', 'a fallen friend'), none: '' }[t] || '');
const STANCE = { riposte: ['每次被近身攻擊都反擊', 'counter every melee blow'], evade: ['一半機率閃過物理攻擊', 'dodge half of physical attacks'], bastion: ['全隊受到的傷害 -30%', 'party takes 30% less damage'], beast: ['攻擊 ×1.6、防禦 ×0.8', 'attack x1.6, defence x0.8'] };
const SONG = { heal: ['每回合全隊回復 HP', 'party HP back each round'], mp: ['每回合全隊回復 MP', 'party MP back each round'], dirge: ['每回合敵人全體受傷', 'every foe hurt each round'] };

// the pieces that describe an ability, shortest first; used for the one-line list text and the detail panel
export function abilityParts(a) {
  if (a.passive) return [L('支援能力', 'support ability'), a.note || ''].filter(Boolean);
  const out = [];
  const what = { phys: L('物理', 'physical'), magic: L('魔法', 'magic'), heal: L('回復', 'healing'), buff: L('強化', 'boost'), status: a.mark ? L('標記', 'mark') : a.debuffs && !a.status && !a.statuses ? L('削弱', 'weaken') : L('異常', 'ailment'), scan: L('看穿弱點、抗性與 HP', 'reveals weaknesses, resistances and HP'), regen: L('再生', 'regen'), charge: L('下一次物理攻擊 ×2.2', 'next physical hit x2.2'), sentinel: L('吸引攻擊・防禦 ×1.8', 'draws attacks · defence x1.8'), meditate: L('回復自己的 MP', 'restores own MP'), steal: L('偷東西', 'steal'), taunt: L('吸引攻擊', 'draws attacks'), gravity: L(`削去目前 HP 的 ${Math.round((a.pct || 0.4) * 100)}%（頭目 ${Math.round((a.bossPct || 0.12) * 100)}%）`, `cuts ${Math.round((a.pct || 0.4) * 100)}% of current HP (guardians ${Math.round((a.bossPct || 0.12) * 100)}%)`), cure: L('解除所有異常', 'cures every ailment'), revive: L('以 50% HP 復活', 'revives at 50% HP'), flee: L('逃離戰鬥（頭目戰不行）', 'escape (not from guardians)'),
    jump: L('跳躍：回合結束時落下，跳躍中不會被打中', 'jump: lands at round end, untouchable meanwhile'), summon: L('召喚', 'summon'), turret: L(`砲台：之後 ${a.rounds || 3} 回合結束時射擊`, `turret: fires at the end of the next ${a.rounds || 3} rounds`), taste: L('回復自己並隨機強化', 'heals you and gives a random boost'), echo: a.twice ? L('連續施放兩次最後看到的敵人招式', 'casts the last enemy technique seen, twice') : L('施放最後看到的敵人招式', 'casts the last enemy technique seen'), timewarp: L('全隊加速並再生，敵人減速', 'party hasted and regenerating, foes slowed'),
    stance: L(`架式 ${a.rounds} 回合：${L(...(STANCE[a.stance] || ['', '']))}`, `stance, ${a.rounds} rounds: ${L(...(STANCE[a.stance] || ['', '']))}`), song: L(`歌 ${a.rounds} 回合：${L(...(SONG[a.song] || ['', '']))}`, `song, ${a.rounds} rounds: ${L(...(SONG[a.song] || ['', '']))}`), trap: L('陷阱：下一個行動的敵人觸發', 'trap: springs on the next foe to act'), delay: L(`${a.rounds} 回合後發動`, `goes off after ${a.rounds} round${a.rounds > 1 ? 's' : ''}`),
    pctheal: L(`回復 ${Math.round(a.pct * 100)}% 最大 HP`, `restores ${Math.round(a.pct * 100)}% of max HP`), coin: L('丟金幣，無視防禦', 'throws gold, ignores defence'), kill: L(`${Math.round(a.kill * 100)}% 機率讓非頭目直接倒下`, `${Math.round(a.kill * 100)}% chance to fell a non-guardian outright`), ward: L(`附加${stName(a.ward)}`, `grants ${stName(a.ward)}`) }[a.type] || '';
  out.push(what);
  const el = a.el === 'auto' ? L('自動選弱點屬性', 'element picked to hit a weakness') : a.el === 'terrain' ? L('屬性隨地形', 'element from the ground') : a.el === 'random3' ? L('火・冰・雷隨機', 'fire, ice or bolt at random') : a.el && a.el !== 'none' ? elName(a.el) + L('屬性', '') : '';
  if (el) out.push(el);
  const t = TGT(a.target); if (t) out.push(t);
  const hits = a.hits > 1 ? L(`${a.hits} 連擊`, `${a.hits} hits`) : '';
  if (a.type === 'phys' || a.type === 'jump' || a.type === 'trap') out.push(L(`威力 ×${a.power}`, `power x${a.power}`) + (hits ? `・${hits}` : ''));
  else if (a.type === 'magic' || a.type === 'summon' && a.power && !a.heal || a.type === 'delay') out.push(L(`威力 ${a.power}`, `power ${a.power}`) + (hits ? `・${hits}` : ''));
  else if (a.type === 'heal' || (a.type === 'summon' && a.heal)) out.push(a.power >= 999 ? L('完全回復', 'full heal') : L(`回復 ${a.power}＋魔力・精神加成`, `heals ${a.power} + MAG/SPR bonus`));
  else if (a.type === 'song') out.push(a.song === 'mp' ? L(`每回合 MP +${a.power}`, `MP +${a.power} a round`) : a.song === 'heal' ? L(`每回合 HP +${a.power}＋`, `HP +${a.power}+ a round`) : L(`每回合威力 ${a.power}`, `power ${a.power} a round`));
  else if (hits) out.push(hits);
  if (a.type === 'buff') out.push(L(`${(a.stats || [a.stat]).map(statN).join('、')} ×${a.big ? 1.6 : 1.3}（4 回合）`, `${(a.stats || [a.stat]).map(statN).join(', ')} x${a.big ? 1.6 : 1.3} (4 rounds)`));
  const sts = [...(a.status ? [a.status] : []), ...(a.statuses || [])];
  if (sts.length) out.push(L('附加', 'inflicts ') + sts.map(stName).join(L('、', ', ')));
  if (a.mark) out.push(L('標記：受傷 +30%', 'mark: +30% damage taken'));
  if (a.debuff) out.push(L(`降低${statN(a.debuff)}`, `lowers ${statN(a.debuff)}`));
  if (a.debuffs) out.push(L(`降低${a.debuffs.map(statN).join('與')}`, `lowers ${a.debuffs.map(statN).join(' and ')}`));
  const fl = [
    [a.sure, '必中', 'never misses'], [a.ignoreDef, '無視防禦', 'ignores defence'], [a.ramp, '一下比一下重', 'each hit harder'], [a.scatter, '每擊隨機目標', 'random target each hit'],
    [a.execute, '對殘血（30% 以下）威力加倍', 'double power below 30% HP'], [a.desperate, '自己 HP 越少越強', 'stronger the more HP you have lost'], [a.opening, '對睡眠・暈眩・失明・凍結的敵人威力加倍', 'double power on a sleeping, stunned, blind or frozen foe'],
    [a.gamble, a.gamble && `威力隨機 ×${a.gamble[0]}～×${a.gamble[1]}`, a.gamble && `power x${a.gamble[0]}-x${a.gamble[1]} at random`], [a.rowBonus, a.rowBonus === 'back' ? '在後排時 ×1.4' : '在前排時 ×1.4', a.rowBonus === 'back' ? 'x1.4 from the back row' : 'x1.4 from the front row'],
    [a.useDef, '以防禦力計算', 'uses your defence'], [a.useFoeAtk, '以敵人的攻擊力計算', "uses the foe's own attack"], [a.antiUndead, '對不死者 ×2', 'x2 against the undead'],
    [a.type !== 'kill' && a.kill, a.kill && `${Math.round(a.kill * 100)}% 即死（非頭目）`, a.kill && `${Math.round(a.kill * 100)}% instant kill (not guardians)`], [a.dispel, '解除敵人的強化', "removes foes' boosts"], [a.mpall, '耗盡所有 MP，每點 +2.5 威力', 'spends all MP, +2.5 power each'],
    [a.drain, '吸收傷害回復 HP', 'heals you from the damage'], [a.steal, '順手偷東西', 'steals too'], [a.stealGold, '偷金幣', 'steals gold'], [a.healParty, a.healParty && `全隊回復 ${a.healParty}＋`, a.healParty && `heals the party ${a.healParty}+`],
    [a.regen, '附加再生', 'plus regen'], [a.cure, '解除異常', 'cures ailments'], [a.revive, '也能復活', 'also revives'], [a.mpgive, a.mpgive && `MP +${a.mpgive}`, a.mpgive && `MP +${a.mpgive}`], [a.buffAll, '全能力 ×1.3', 'all stats x1.3'], [a.buff, a.buff && `${statN(a.buff)} ×1.3`, a.buff && `${statN(a.buff)} x1.3`],
    [a.shieldParty, '全隊防禦與魔防 ×1.6', 'party defence and magic defence x1.6'], [a.taunt, '吸引攻擊', 'draws attacks'], [a.shield, '全隊防禦 ×1.6', 'party defence x1.6'], [a.ward && a.type !== 'ward', a.ward && `附加${stName(a.ward)}`, a.ward && `grants ${stName(a.ward)}`],
    [a.ranged, '遠距離（後排不減傷，打得到空中）', 'ranged (no back-row penalty, reaches fliers)'], [a.hpcost, a.hpcost && `消耗 ${Math.round(a.hpcost * 100)}% 最大 HP`, a.hpcost && `costs ${Math.round(a.hpcost * 100)}% of max HP`],
  ];
  for (const [on, zh, en] of fl) if (on) out.push(L(zh, en));
  if (a.jobs) out.push(L('連攜：', 'with: ') + a.jobs.map((j) => JOBS[j].name).join(' + '));
  return out.filter(Boolean);
}
// one line for a list: cost first, then the rest
export function abilityLine(a, cost = true) {
  const c = a.passive ? '' : a.hpcost ? `HP ${Math.round(a.hpcost * 100)}%` : `MP ${a.mp}`;
  return [cost ? c : '', ...abilityParts(a)].filter(Boolean).join(SEP());
}
// a monster technique, for the Lore list
export function techLine(id, mp) {
  const t = TECHS[id], tgt = t.target === 'all' ? L('全體敵人', 'all foes') : t.target === 'self' ? L('自己', 'self') : L('單體', 'one foe');
  const what = { magic: L(`魔法・威力 ${Math.round((t.power || 0) * 1.3)}`, `magic · power ${Math.round((t.power || 0) * 1.3)}`), status: L(`附加${stName(t.status)}`, `inflicts ${stName(t.status)}`), drain: L('吸收 HP', 'drains HP'), curse: L('降低攻擊與防禦', 'lowers attack and defence'), break: L('降低防禦', 'lowers defence'), smash: L(`物理・威力 ×${t.power}`, `physical · power x${t.power}`), steal: L('偷東西', 'steal'), guard: L('防禦 ×1.8', 'defence x1.8'), rally: L('攻擊 ×1.4', 'attack x1.4'), heal: L('回復 30% HP', 'restores 30% HP') }[t.kind] || '';
  return [`MP ${mp}`, what, t.el && t.el !== 'none' ? elName(t.el) + L('屬性', '') : '', tgt].filter(Boolean).join(SEP());
}

// ---------- items ----------
const usedIn = (id) => {
  const f = FORGE.filter(([, need]) => need.some(([n]) => n === id)).map(([o]) => ITEMS[o].name), c = RECIPES.filter(([, need]) => need.some(([n]) => n === id)).map(([o]) => ITEMS[o].name);
  return [f.length ? L('鍛造：', 'Forge: ') + f.join(L('、', ', ')) : '', c.length ? L('料理：', 'Cooking: ') + c.join(L('、', ', ')) : ''].filter(Boolean);
};
const MEAL = (meal) => [meal.str ? `${statN('str')} ×${meal.str}` : '', meal.mag ? `${statN('mag')} ×${meal.mag}` : '', meal.def ? `${statN('def')} ×${meal.def}` : '', meal.agi ? `${statN('agi')} ×${meal.agi}` : '', meal.regen ? stName('regen') : '', meal.exp ? `EXP ×${meal.exp}` : '', meal.jp ? `JP ×${meal.jp}` : '', meal.gold ? L(`金幣 ×${meal.gold}`, `gold x${meal.gold}`) : '', meal.luck ? L(`掉落率 ×${meal.luck}`, `drop rates x${meal.luck}`) : ''].filter(Boolean).join(L('、', ', '));
// what a usable item does, in numbers
export function itemEffect(id) {
  const it = ITEMS[id], who = it.target === 'allies' ? L('全員', 'everyone') : '';
  const u = {
    heal: L(`${who}回復 ${it.power >= 999 ? '全部' : it.power} HP`, `restores ${it.power >= 999 ? 'all' : it.power} HP${who ? ' to ' + who : ''}`), mp: L(`${who}回復 ${it.power} MP`, `restores ${it.power} MP${who ? ' to ' + who : ''}`),
    revive: L(`讓倒下的夥伴以 ${it.power >= 999 ? 100 : 40}% HP 復活`, `revives a fallen friend at ${it.power >= 999 ? 100 : 40}% HP`), cure: L(`解除${(it.cures || ['poison', 'blind']).map(stName).join('、')}`, `cures ${(it.cures || ['poison', 'blind']).map(stName).join(', ')}`),
    cureall: L(`解除所有異常${it.heal ? `並回復 ${it.heal} HP` : ''}`, `cures every ailment${it.heal ? ` and restores ${it.heal} HP` : ''}`), elixir: L(`${who}HP 與 MP 全滿`, `fully restores HP and MP${who ? ' for ' + who : ''}`),
    bomb: L(`對全體敵人造成${elName(it.el)}屬性傷害（威力 ${it.power}，無視防禦）`, `${elName(it.el)} damage to all foes (power ${it.power}, ignores defence)`), buff: L(`${statN(it.stat)} ×1.3（4 回合）`, `${statN(it.stat)} x1.3 (4 rounds)`),
    escape: L('從非頭目的戰鬥中一定能逃走', 'always escape a battle that is not against a guardian'), scan: L('看穿一隻魔物的弱點、抗性、HP 與可偷的東西', "reveals a monster's weaknesses, resistances, HP and what it carries"), tent: L('在野外紮營，全員完全回復', 'camp outside and fully recover'),
  }[it.use] || '';
  const where = { scan: L('只能在戰鬥中', 'battle only'), bomb: L('只能在戰鬥中', 'battle only'), buff: L('只能在戰鬥中', 'battle only'), escape: L('只能在戰鬥中', 'battle only'), tent: L('只能在野外', 'outside only') }[it.use];
  return [u, where, it.meal ? L('當餐點：', 'as a meal: ') + MEAL(it.meal) : ''].filter(Boolean).join(SEP());
}
// a short line for any item: what it does or gives
export function itemLine(id) {
  const it = ITEMS[id];
  if (it.slot) return gearLine(id);
  if (it.use) return itemEffect(id);
  if (it.mat) return [L('材料', 'material'), ...usedIn(id)].join(SEP());
  return it.desc || '';
}
// ---------- gear ----------
const FX = (it) => [
  it.el ? L(`攻擊帶${elName(it.el)}屬性`, `attacks carry ${elName(it.el)}`) : '', it.res ? L(`抗${it.res.map(elName).join('、')}（傷害減半）`, `resists ${it.res.map(elName).join(', ')} (half damage)`) : '', it.immune ? L(`防${it.immune.map(stName).join('、')}`, `blocks ${it.immune.map(stName).join(', ')}`) : '',
  it.onhit ? L(`普通攻擊有 25% 機率附加${stName(it.onhit)}`, `plain attacks may inflict ${stName(it.onhit)} (25%)`) : '', it.regen ? L('每回合回復 5% HP', '5% HP back every round') : '', it.mpregen ? L('每回合回復 4% MP', '4% MP back every round') : '',
  it.mpcut ? L('MP 消耗 -25%', 'MP costs -25%') : '', it.first ? L('每回合最先行動', 'acts first every round') : '', it.counter ? L('被攻擊時 30% 反擊', '30% chance to counter') : '', it.drain ? L('攻擊時吸收 15% 傷害', 'drains 15% of damage dealt') : '',
  it.hasteStart ? L('開戰時加速', 'starts battles hasted') : '', it.luck ? L('全隊掉落機率 ×1.3', 'party drop rates x1.3') : '', it.stealUp ? L('偷竊成功率提高', 'better steals') : '', it.jpUp ? L('自己得到的 JP +30%', 'you earn 30% more JP') : '',
  it.goldUp ? L('金幣 +50%', 'gold +50%') : '', it.expUp ? L('經驗值 +30%', 'EXP +30%') : '', it.reraise ? L('每場戰鬥第一次倒下時復活', 'revives you the first time you fall each battle') : '', it.seaCalm ? L('航海時少遇到海怪', 'fewer sea monsters') : '',
].filter(Boolean);
const STATS = (it) => [it.atk ? `${L('攻', 'ATK')}+${it.atk}` : '', it.def ? `${L('防', 'DEF')}+${it.def}` : '', it.mag ? `${L('魔', 'MAG')}+${it.mag}` : '', it.str ? `${L('力', 'STR')}+${it.str}` : '', it.agi ? `${L('速', 'AGI')}+${it.agi}` : '', it.spr ? `${L('精', 'SPR')}+${it.spr}` : ''].filter(Boolean);
export function gearLine(id) { const it = ITEMS[id]; return [STATS(it).join(' '), ...FX(it)].filter(Boolean).join(L('・', ' · ')); }
// the jobs that can hold a weapon (armour and charms suit everyone)
export const jobsFor = (id) => { const it = ITEMS[id]; return it.slot === 'weapon' ? Object.keys(JOBS).filter((j) => JOBS[j].wep.includes(it.kind)) : null; };
const SLOT_N = { weapon: ['武器', 'Weapon'], armor: ['防具', 'Armour'], acc: ['飾品', 'Accessory'] };
// what wearing a piece would change for a hero, against what they wear now
export function compare(m, id) {
  const it = ITEMS[id], slot = it.slot, now = stats(m), then = stats({ ...m, equip: { ...m.equip, [slot]: id } });
  const main = slot === 'weapon' ? 'atk' : 'dfn';
  return [['atk', L('攻擊', 'ATK')], ['dfn', L('防禦', 'DEF')], ['mag', L('魔力', 'MAG')], ['spr', L('精神', 'SPR')], ['agi', L('速度', 'AGI')], ['maxhp', 'HP'], ['maxmp', 'MP']].map(([k, n]) => ({ k, n, a: now[k], b: then[k], d: then[k] - now[k] })).filter((x) => x.d !== 0 || x.k === main);
}
export function compareHTML(m, id, name) {
  const rows = compare(m, id);
  const cur = m.equip[ITEMS[id].slot];
  return `<div class="cmp"><div class="small">${esc(name)}${L('：', ': ')}${cur ? esc(ITEMS[cur].name) : L('（無）', '(none)')} → ${esc(ITEMS[id].name)}</div>` +
    (rows.length ? rows.map((r) => `<span class="cv"><span class="small">${r.n}</span> ${r.a}→<b class="${r.d > 0 ? 'up' : r.d < 0 ? 'dn' : ''}">${r.b}</b>${r.d ? `<i class="${r.d > 0 ? 'up' : 'dn'}">${r.d > 0 ? '▲' : '▼'}${Math.abs(r.d)}</i>` : ''}</span>`).join('') : `<span class="small">${L('能力值不變', 'no stat change')}</span>`) + '</div>';
}
// the full panel for an item or a piece of gear; who: compare against these heroes
export function itemHTML(id, { who = [], price = true } = {}) {
  const it = ITEMS[id], h = [`<h3>${esc(it.name)}</h3>`];
  if (it.slot) {
    h.push(`<div class="tags"><b>${L(...SLOT_N[it.slot])}</b>${it.kind ? `<b>${kindName(it.kind)}</b>` : ''}${it.drop ? `<b class="rare">${L('只能靠掉落取得', 'drop only')}</b>` : ''}</div>`);
    const st = STATS(it); if (st.length) h.push(`<div class="kv">${st.map((s) => `<span>${s}</span>`).join('')}</div>`);
    const fx = FX(it); if (fx.length) h.push(`<ul class="fx">${fx.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>`);
    const js = jobsFor(id); h.push(`<div class="small">${js ? L('可裝備的職業：', 'Jobs that can hold it: ') + js.map((j) => (S.jobs.includes(j) ? JOBS[j].name : '？？？')).join(L('、', ', ')) : L('所有職業都能裝備。', 'Every job can wear it.')}</div>`);
    if (it.desc) h.push(`<div class="small fl">${esc(it.desc)}</div>`);
    for (const m of who) { if (canEquip(m, id)) h.push(compareHTML(m, id, heroName(m))); else h.push(`<div class="cmp small off">${esc(heroName(m))}${L('：現在的職業不能裝備', ': cannot hold it with current jobs')}</div>`); }
  } else {
    const tag = it.key ? L('重要物品', 'Key item') : it.quest ? L('委託物品', 'Requested item') : it.mat ? L('材料', 'Material') : it.food ? L('料理', 'Dish') : it.fish ? L('魚', 'Fish') : L('道具', 'Item');
    h.push(`<div class="tags"><b>${tag}</b></div>`);
    if (it.use) h.push(`<div class="eff">${esc(itemEffect(id))}</div>`);
    if (it.desc) h.push(`<div class="small fl">${esc(it.desc)}</div>`);
    for (const u of usedIn(id)) h.push(`<div class="small">${esc(u)}</div>`);
    const from = Object.keys(DROPS).filter((mid) => S.defeated[mid] && MONSTERS[mid] && (DROPS[mid].c[0] === id || DROPS[mid].r[0] === id || DROPS[mid].steal === id)).map((mid) => MONSTERS[mid].name);
    if (from.length) h.push(`<div class="small">${L('來源：', 'From: ')}${esc(from.slice(0, 5).join(L('、', ', ')))}${from.length > 5 ? '…' : ''}</div>`);
  }
  if (price && !it.key) h.push(`<div class="small">${it.price ? L(`賣價 ${Math.floor(it.price / 2)} 金幣`, `Sells for ${Math.floor(it.price / 2)} gold`) : L('不能賣', 'Cannot be sold')}<span style="margin-left:14px">${L('持有', 'Owned')} ${S.inv[id] || 0}</span></div>`);
  return h.join('');
}

// ---------- jobs ----------
const GRADE = (v) => (v >= 130 ? 'S' : v >= 115 ? 'A' : v >= 100 ? 'B' : v >= 85 ? 'C' : 'D');
export function jobHTML(job, m) {
  const J = JOBS[job], I = JOB_INFO[job], known = S.jobs.includes(job);
  if (!known) return `<h3>？？？</h3><div class="small">${L('還沒找到這個職業。', 'You have not found this job yet.')}</div><div class="small fl">${esc(I.where)}</div>`;
  const jl = m ? jlvOf(m, job) : 1, h = [`<h3>${esc(J.name)}${m && mastered(m, job) ? ' <span class="star">★</span>' : ''}</h3>`, `<div class="tags"><b>${esc(I.role)}</b><b>${L('武器：', 'Weapons: ')}${J.wep.map(kindName).join(L('、', ', '))}</b></div>`, `<div class="small fl">${esc(J.desc)}</div>`];
  h.push('<div class="grades">' + [['hp', 'HP'], ['mp', 'MP'], ['str', L('力', 'STR')], ['def', L('防', 'DEF')], ['mag', L('魔', 'MAG')], ['spr', L('精', 'SPR')], ['agi', L('速', 'AGI')]].map(([k, n]) => { const v = J.st[k]; return `<div class="gr"><span>${n}</span><i class="g${GRADE(v)}">${GRADE(v)}</i><div class="bar"><i style="width:${Math.min(100, (v - 50) / 100 * 100)}%;background:${v >= 115 ? '#ffd070' : v >= 100 ? '#7cf29a' : v >= 85 ? '#7cc4ff' : '#8a90b0'}"></i></div><span class="small">${v}%</span></div>`; }).join('') + '</div>');
  if (m) h.push(`<div class="small">${L('職業等級', 'Job level')} ${jl}/${JL_MAX}${jl < JL_MAX ? `　JP ${m.jp[job] || 0}/${jpFor(jl + 1)}` : L('　精通', '   Mastered')}</div>`);
  h.push(`<div class="sub">${L('學會的技能', 'What it teaches')}</div><div class="lrn">`);
  for (const [lv, a] of J.learn) { const A = ABILITIES[a], got = m ? jl >= lv : true; h.push(`<div class="la${got ? '' : ' lock'}"><span class="jl">JL${lv}</span><span class="an">${esc(A.name)}</span><span class="small ad">${esc(abilityLine(A))}</span></div>`); }
  h.push('</div>');
  const art = MASTER_ART[job];
  if (art) h.push(`<div class="sub">${L('奧義', 'Master art')}</div><div class="la${S.mastery[job] ? '' : ' lock'}"><span class="an">${esc(ABILITIES[art].name)}</span><span class="small ad">${esc(abilityLine(ABILITIES[art]))}${S.mastery[job] ? '' : L(`　（找到東方的大師，以此為主職業打贏 ${MASTER_WINS} 場）`, `  (find its master in the east and win ${MASTER_WINS} battles with it as a main job)`)}</span></div>`);
  const b = Object.entries(I.bonus).map(([k, v]) => `${{ hp: 'HP', mp: 'MP', str: L('力', 'STR'), def: L('防', 'DEF'), mag: L('魔', 'MAG'), spr: L('精', 'SPR'), agi: L('速', 'AGI') }[k]} +${v}%`).join(' ');
  h.push(`<div class="sub">${L('精通獎勵', 'Mastery bonus')}</div><div class="small${m && mastered(m, job) ? '' : ' off'}">${b}${L(`（職業等級 ${JL_MAX} 時永久獲得，換職業也有效。精通後，這個職業的所有技能也能放進「額外指令」）`, ` (yours for good at job level ${JL_MAX}, whatever job you wear. Once mastered, all its actions can also be set as an extra command)`)}</div>`);
  h.push(`<div class="small fl">${esc(I.where)}</div>`);
  return h.join('');
}
// the one-line list text for a job
export function jobLine(job, m) { const J = JOBS[job]; if (!S.jobs.includes(job)) return JOB_INFO[job].where; const n = learned(job, jlvOf(m, job)).length; return `${JOB_INFO[job].role}${SEP()}${L(`已學 ${n}/${J.learn.length}`, `learned ${n}/${J.learn.length}`)}`; }
// what a hero has gained from mastered jobs
export function masteryLine(m) { const b = masteryBonus(m), s = Object.entries(b).filter(([, v]) => v).map(([k, v]) => `${{ hp: 'HP', mp: 'MP', str: L('力', 'STR'), def: L('防', 'DEF'), mag: L('魔', 'MAG'), spr: L('精', 'SPR'), agi: L('速', 'AGI') }[k]}+${v}%`); return s.join(' ') || '-'; }
// an ability's own panel
export function abilityHTML(id, from = '') {
  const A = ABILITIES[id], parts = A.passive ? [A.note || ""] : abilityParts(A);
  return `<h3>${esc(A.name)}</h3><div class="tags">${A.passive ? `<b>${L('支援能力', 'Support')}</b>` : `<b>${A.hpcost ? `HP ${Math.round(A.hpcost * 100)}%` : `MP ${A.mp}`}</b>`}${from ? `<b>${esc(from)}</b>` : ''}</div><ul class="fx">${parts.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>${A.note && !A.passive ? `<div class="small fl">${esc(A.note)}</div>` : ''}`;
}

// ---------- monsters ----------
const KIND_N = { plant: ['植物', 'plant'], beast: ['野獸', 'beast'], flyer: ['飛禽', 'flier'], water: ['水棲', 'aquatic'], spirit: ['精靈', 'spirit'], undead: ['不死', 'undead'], stone: ['岩石', 'stone'], sand: ['沙漠', 'desert'], crystal: ['水晶', 'crystal'], ice: ['冰雪', 'frost'], fire: ['火焰', 'fire'], heart: ['稜晶', 'prism'], fungus: ['菌類', 'fungus'], sea: ['海洋', 'sea'], sky: ['天空', 'sky'], gale: ['風', 'gale'], machine: ['機械', 'machine'], dino: ['古龍', 'dinosaur'], drowned: ['溺亡', 'drowned'], noon: ['正午', 'noon'], shadow: ['暗影', 'shadow'], demon: ['惡魔', 'demon'], dragon: ['龍', 'dragon'], deep: ['地底', 'deep'], human: ['人型', 'humanoid'] };
const pct = (x) => `${Math.round(Math.min(1, x) * 100)}%`;
export function monsterHTML(id, where = '') {
  const m = MONSTERS[id], met = !!S.seen[id], scan = !!S.scanned[id], st = monsterStats(id), a = affinity(id), d = DROPS[id], k = kindOf(id);
  if (!met) return `<h3>？？？</h3><div class="small">${L('還沒遇過的魔物。', 'A monster you have not met yet.')}</div>${where ? `<div class="small">${L('出沒：', 'Found: ')}${esc(where)}</div>` : ''}`;
  const h = [`<h3>${esc(m.name)}</h3>`, MONSTER_LORE[id] ? `<div class="small fl">${esc(L(MONSTER_LORE[id][0], MONSTER_LORE[id][1]))}</div>` : '', `<div class="tags"><b>Lv ${m.lv}</b>${k && KIND_N[k] ? `<b>${L(...KIND_N[k])}</b>` : ''}${m.boss ? `<b class="rare">${m.post ? L('終極狩獵', 'final hunt') : m.field ? L('野外守護者', 'field guardian') : L('守護者', 'guardian')}</b>` : ''}${m.rare ? `<b class="rare">${L('稀有', 'rare')}</b>` : ''}${m.undead ? `<b>${L('不死者', 'undead')}</b>` : ''}${m.machine ? `<b>${L('機械', 'machine')}</b>` : ''}</div>`];
  h.push(`<div class="kv"><span>HP ${scan ? st.hp : '???'}</span><span>${L('攻', 'ATK')} ${scan ? st.atk : '?'}</span><span>${L('防', 'DEF')} ${scan ? st.def : '?'}</span><span>${L('魔', 'MAG')} ${scan ? st.mag : '?'}</span><span>${L('速', 'AGI')} ${scan ? st.agi : '?'}</span></div>`);
  h.push(`<div class="kv"><span>EXP ${st.exp}</span><span>JP ${st.jp}</span><span>${L('金', 'G')} ${st.gold}</span></div>`);
  if (scan) {
    h.push(`<div class="small">${L('弱點：', 'Weak to: ')}${a.weak.length ? a.weak.map((e) => `<b style="color:#ffe27a">${elName(e)}</b>`).join(L(' ', ', ')) : L('沒有', 'nothing')}　${L('抵抗：', 'Resists: ')}${a.res.length ? a.res.map(elName).join(L(' ', ', ')) : L('沒有', 'nothing')}</div>`);
    const techs = [...new Set((m.acts || []).map(([t]) => t).filter((t) => t !== 'atk' && TECHS[t]))].map((t) => TECHS[t].name);
    if (techs.length) h.push(`<div class="small">${L('招式：', 'Techniques: ')}${esc(techs.join(L('、', ', ')))}</div>`);
    if (m.machine) h.push(`<div class="small">${L('機械：不會中毒、睡著、失明或被死亡宣告。', 'Machine: immune to poison, sleep, blindness and doom.')}</div>`);
    if (m.boss) h.push(`<div class="small">${L('守護者：異常狀態很難生效，只有失明、減速、沉默、灼傷偶爾有用。', 'Guardian: ailments rarely land; only blind, slow, silence and burn sometimes do.')}</div>`);
  } else h.push(`<div class="small off">${L('用「看破」或鑑定鏡查看弱點、抗性與能力值。', 'Scan it or use a Seeing Lens to learn its weaknesses, resistances and stats.')}</div>`);
  if (d) {
    const seen = S.defeated[id] || scan;
    const nm = (iid) => (seen ? esc(ITEMS[iid].name) : '？？？');
    h.push(`<div class="sub">${L('掉落', 'Drops')}</div><div class="drops"><span>${L('普通', 'Common')}：${nm(d.c[0])} <i class="small">${pct(d.c[1])}</i></span><span class="rare">${L('稀有', 'Rare')}：${nm(d.r[0])} <i class="small">${pct(d.r[1])}</i></span><span>${L('可偷', 'Steal')}：${scan ? esc(ITEMS[d.steal].name) : '？？？'}</span></div>`);
  }
  if (m.rare) h.push(`<div class="small fl">${L('稀有魔物：給的東西很多，但是會逃跑。先下手為強！', 'A rare find: it gives a lot, but it runs. Strike fast!')}</div>`);
  if (where) h.push(`<div class="small">${L('出沒：', 'Found: ')}${esc(where)}</div>`);
  h.push(`<div class="small">${L('打倒', 'Defeated')} ×${S.defeated[id] || 0}</div>`);
  return h.join('');
}

// ---------- the Help pages ----------
const P = (zh, en) => `<p>${L(zh, en)}</p>`;
const elementList = () => `<div class="els">${Object.keys(EL_NAME).map((e) => `<b class="el-${e}">${elName(e)}</b>`).join('')}</div>`;
export const HELP = [
  { t: ['戰鬥的流程', 'How battles work'], b: () => P('每回合先替每個人選好指令，然後大家依速度（AGI）輪流行動。「防禦」會最先行動，這回合受到的物理傷害減半、魔法傷害減四成。', 'Each round you choose a command for everyone, then all act in order of speed (AGI). Guard always goes first and halves physical damage (magic -40%) that round.')
    + P('「逃跑」有六成機率成功；守護者的戰鬥逃不掉。會心一擊的機率是 7%，傷害 ×1.6。', 'Run works 60% of the time, but never against a guardian. Critical hits happen 7% of the time for x1.6 damage.')
    + P('打贏就會得到經驗值、JP、金幣和掉落物。全員倒下時，會在最後碰過的家石醒來，失去一半的金幣。', 'Winning gives EXP, JP, gold and drops. If everyone falls you wake at the last home stone you touched, with half your gold gone.') },
  { t: ['前排與後排', 'Front and back rows'], b: () => P('後排受到的物理傷害少四成，也比較不會被盯上（前排被攻擊的機率是兩倍），但近戰傷害也少四成。', 'The back row takes 40% less physical damage and is targeted half as often, but melee hits from there are 40% softer.')
    + P('弓、火槍、遠距離技能和跳躍不受後排影響。換排在戰鬥中不消耗回合，也可以從選單的「隊形」設定。', 'Bows, guns, ranged abilities and jumps do not mind the back row. Switching rows in battle costs no turn; you can also set rows under Formation.') },
  { t: ['屬性', 'Elements'], b: () => elementList() + P('打中魔物的弱點時傷害 ×1.6，被抵抗時只有 ×0.4，有些魔物在特定時候會吸收屬性而回復。', "Hitting a monster's weakness does x1.6 damage; a resisted element does only x0.4, and a few monsters absorb an element at times.")
    + P('帶屬性的武器會讓普通攻擊也帶屬性。用「看破」或鑑定鏡可以看到弱點與抗性；「屬性解析」之類的技能會自動選弱點。風水師的「地脈」依地形決定屬性。', 'An elemental weapon makes plain attacks elemental too. Scan or a Seeing Lens shows weaknesses and resistances; abilities like Element Strike pick a weakness for you. The geomancer\'s Geo takes its element from the ground.')
    + P('我方穿戴有抗性的裝備時，該屬性的傷害減半。', 'Gear that resists an element halves that damage for you.') },
  { t: ['破防與削弱', 'Breaks and weakening'], b: () => P('破力斬、破甲、詛咒等會讓魔物的攻擊或防禦變成 ×0.65（4 回合），名字旁會出現 ↓。', 'Power Break, Armour Break, Curse and the like put a monster\'s attack or defence at x0.65 for 4 rounds; a ↓ shows next to its name.')
    + P('「標記」讓魔物受到的所有傷害 +30%，對守護者也有效。魔物會用「硬化」「咆哮」強化自己（↑），可以用「驅散」解除。', 'A Mark makes a monster take 30% more damage from everything, guardians included. Monsters boost themselves with Harden and Roar (↑); Dispel removes it.')
    + P('我方的強化是 ×1.3（大強化 ×1.6），持續 4 回合。', 'Your own boosts are x1.3 (big ones x1.6) for 4 rounds.') },
  { t: ['異常狀態', 'Ailments and effects'], b: () => `<div class="gl">${Object.entries(STATUS).map(([, s]) => `<div><b style="color:${s.col}">${L(s.n[0], s.n[1])}</b><span class="small">${L(s.d[0], s.d[1])}</span></div>`).join('')}</div>`
    + P('物理技能附加的異常有六成機率生效，魔法約五成，專門的異常技能約七成；守護者大多無效。裝備可以防止特定的異常。', 'Ailments from physical skills land 60% of the time, from magic about 50%, from dedicated ailment skills about 70%; guardians mostly shrug them off. Gear can block particular ailments.') },
  { t: ['職業等級與 JP', 'Job levels and JP'], b: () => P(`戰鬥得到的 JP，主職業拿全部、副職業拿一半。JP 夠了職業等級就會上升並學會新技能。職業等級最高 ${JL_MAX}，12 級以後需要的 JP 會大幅增加——那裡是真正的修行。`, `JP from battles goes in full to the main job and half to the sub job. Enough JP raises the job level and teaches new abilities. Job levels go up to ${JL_MAX}; past 12 each level asks for far more JP - that is where the real training starts.`)
    + P(`職業等級到 ${JL_MAX} 就算「精通」，會永久得到該職業的能力值獎勵，換成別的職業也有效。精通越多職業，人就越強。`, `At job level ${JL_MAX} a job is mastered and leaves a lasting stat bonus that holds whatever job you wear. The more jobs you master, the stronger the hero.`)
    + P('越強的魔物給的 JP 越多。「旅人的故事」、晶光護符和晶糖蛋糕能讓 JP 更多。', 'Stronger monsters give more JP. Wanderer\'s Tale, the Crystal Charm and the Crystal Cake raise it further.') },
  { t: ['主職業與副職業', 'Main and sub jobs'], b: () => P('主職業決定能力值；主職業和副職業可以用的武器都能裝備，兩邊學會的技能都能用。', 'The main job sets your stats; you can hold the weapons of both jobs and use the abilities either has learned.')
    + P('被動技能（支援能力）只要主職業或副職業學會就有效，也可以放進支援欄。', 'Passive abilities work if the main or sub job has learned them, and can also be set in support slots.') },
  { t: ['支援能力', 'Support abilities'], b: () => P('任何職業學會的被動技能，都能裝進「支援欄」，換職業也帶著走。支援欄一開始有 2 格，20 級和 40 級時各多 1 格。', 'Any passive a hero has learned in any job can go into a support slot and comes along whatever job they wear. There are 2 slots, plus one at level 20 and one at level 40.')
    + P('從選單「職業」→ 選人 →「支援能力」設定。', 'Set them from Jobs → a hero → Support abilities.') },
  { t: ['額外指令', 'Extra command'], b: () => P(`精通（職業等級 ${JL_MAX}）的職業，可以設成「額外指令」：戰鬥中會多一個以該職業命名的指令，裡面是它的全部行動技能。主職業與副職業不能重複設定。`, `A mastered job (job level ${JL_MAX}) can be set as an extra command: in battle you get one more command, named after that job, holding all its action abilities. It cannot be your main or sub job.`)
    + P('從選單「職業」→ 選人 →「額外指令」設定。被動技能請用支援欄。', 'Set it from Jobs → a hero → Extra command. Passives go in support slots.') },
  { t: ['收集與精通獎勵', 'Collection and mastery rewards'], b: () => `<div class="sub">${L('魔物圖鑑（打倒過的種類）', 'Bestiary (kinds defeated)')}　${bookCount()}</div>` + rewardList(BOOK_REWARDS, bookCount(), 'book', bookNeed)
    + `<div class="sub">${L('職業精通（全隊合計）', 'Job masteries (whole party)')}　${masteryCount()}</div>` + rewardList(MASTERY_REWARDS, masteryCount(), 'mast', (n) => n)
    + P('達成時，戰鬥結束後會自動獲得。', 'Prizes arrive automatically after the battle in which you reach them.') },
  { t: ['懸賞板', 'The hunt board'], b: () => P('鹽灣港的獵人公會貼著稀有魔物與野外守護者的懸賞。接下懸賞後再打倒目標一次，就能回去領賞金和獎品。打倒稜影之後，還會貼出三張終極狩獵。', 'The Hunters in Saltmere post bounties on rare monsters and field guardians. Take one, fell the target once more, then go back for gold and a prize. After Umbra falls, three final hunts are posted.')
    + `<div class="gl">${HUNTS.filter((h) => !h[4] || S.flags.umbra).map((h) => `<div><b>${S.seen[h[0]] ? esc(MONSTERS[h[0]].name) : '？？？'}</b><span class="small">${h[1]} G + ${esc(ITEMS[h[2]].name)}${h[3] > 1 ? ' ×' + h[3] : ''}${S.hunts && S.hunts[h[0]] === 'paid' ? L('　✔ 完成', '  ✔ done') : ''}</span></div>`).join('')}</div>` },
  { t: ['連攜', 'Link arts'], b: () => P('兩位夥伴的職業（主或副）組合對了，就能一起出招；夥伴會放棄這回合的行動。', 'When two friends have the right pair of jobs (main or sub), they can act together; the partner gives up their turn.')
    + `<div class="gl">${Object.values(LINKS).map((a) => `<div><b>${esc(a.name)}</b><span class="small">${a.jobs.map((j) => (S.jobs.includes(j) ? JOBS[j].name : '？？？')).join(' + ')}${SEP()}${esc(abilityParts(a).slice(0, 4).join(SEP()))}</span></div>`).join('')}</div>` },
  { t: ['奧義', 'Master arts'], b: () => P(`東方各地住著十二門古老技藝的大師。學會該職業後去找他們，再以此為主職業打贏 ${MASTER_WINS} 場，就能學會奧義。奧義在主職業或副職業是該職業時都能用。`, `Masters of twelve old crafts live across the east. Once you know the job, find its master, then win ${MASTER_WINS} battles with it as someone's main job to learn its master art. It works whenever that job is your main or sub job.`)
    + `<div class="gl">${Object.entries(MASTER_ART).map(([j, a]) => `<div><b>${S.jobs.includes(j) ? esc(JOBS[j].name) : '？？？'}</b><span class="small">${S.mastery[j] ? esc(ABILITIES[a].name) + SEP() : ''}${S.mastery[j] ? esc(abilityLine(ABILITIES[a])) : L('還沒學會', 'not learned yet')}</span></div>`).join('')}</div>` },
  { t: ['掉落與偷竊', 'Drops and stealing'], b: () => P('每種魔物都有「普通」和「稀有」兩種掉落，還有一樣可以偷的東西。魔物圖鑑會顯示機率；「尋寶者」×1.5、四葉草 ×1.3。', 'Every monster has a common drop, a rare drop, and something to steal. The bestiary shows the chances; Treasure Hunter gives x1.5 and the Four-leaf Clover x1.3.')
    + P('有些武器、防具和飾品只能從魔物身上得到，有些材料可以拿去鍛造。偷竊成功率約五成五，「盜賊之運」和盜賊手套會提高。', 'Some weapons, armour and charms only come from monsters, and materials can be forged into gear. Steals work about 55% of the time; Thief\'s Luck and the Thief\'s Glove raise that.') },
  { t: ['稀有魔物與野外守護者', 'Rare monsters and field guardians'], b: () => P('有些地方偶爾會出現閃閃發亮的稀有魔物，經驗值、JP 或金幣特別多，但牠們會逃跑。', 'Now and then a gleaming rare monster appears; it gives far more EXP, JP or gold, but it runs away.')
    + P('世界各地還有七隻不一定要打的「野外守護者」，打倒後一定會留下只有牠才有的裝備。', 'Seven optional field guardians wait around the world; each always leaves a piece of gear that only it carries.') },
  { t: ['料理與餐點', 'Food and meals'], b: () => P('料理可以在戰鬥中吃來回復，也可以從道具選單當作「餐點」吃：效果會持續五場戰鬥（隊裡有廚師時八場）。', 'Dishes heal when eaten in battle, or can be had as a meal from the Items menu: the effect lasts five battles (eight with a chef in the party).') },
  { t: ['能力值', 'Stats'], b: () => `<div class="gl">${[['HP', '體力。歸零就倒下。', 'Hit points. At zero you fall.'], ['MP', '使用技能的點數。', 'Points spent on abilities.'], [L('攻擊', 'ATK'), '力量加上武器攻擊力 ×1.7，決定物理傷害。', 'Strength plus weapon attack x1.7; sets physical damage.'], [L('防禦', 'DEF'), '減少受到的物理傷害。', 'Lowers physical damage taken.'], [L('魔力', 'MAG'), '決定魔法與回復的威力。', 'Sets the power of magic and healing.'], [L('精神', 'SPR'), '減少受到的魔法傷害，也讓回復更有效。', 'Lowers magic damage taken and strengthens healing.'], [L('速度', 'AGI'), '決定行動順序與閃避。', 'Sets turn order and dodging.'], ['EXP', '升級需要的經驗值。最高 70 級。', 'Experience for levels, up to 70.'], ['JP', '升職業等級需要的點數。', 'Points for job levels.']].map(([n, zh, en]) => `<div><b>${n}</b><span class="small">${L(zh, en)}</span></div>`).join('')}</div>` },
];
// a reward track: what you get at each step, done ones ticked
function rewardList(track, have, key, need) {
  return `<div class="gl">${track.map(([n, item, c]) => { const got = S.rewards && S.rewards[key + n]; return `<div><b class="${got ? 'up' : have >= need(n) ? '' : 'off'}">${got ? '✔ ' : ''}${need(n)}</b><span class="small">${esc(ITEMS[item].name)}${c > 1 ? ' ×' + c : ''}${SEP()}${esc(itemLine(item))}</span></div>`; }).join('')}</div>`;
}
// everything about a hero right now: ailments in words, boosts, meal, supports, extra command
export function heroStatusHTML(m) {
  const s = stats(m), h = [`<h3>${esc(heroName(m))}</h3>`];
  h.push(`<div class="kv"><span>HP ${m.hp}/${s.maxhp}</span><span>MP ${m.mp}/${s.maxmp}</span></div>`);
  const sts = Object.keys(m.status || {}).filter((k) => m.status[k] && STATUS[k]);
  h.push(`<div class="sub">${L('狀態', 'Condition')}</div>` + (sts.length ? `<div class="gl">${sts.map((k) => `<div><b style="color:${STATUS[k].col}">${stName(k)}</b><span class="small">${L(STATUS[k].d[0], STATUS[k].d[1])}</span></div>`).join('')}</div>` : `<p class="small">${L('一切正常。', 'All well.')}</p>`));
  const meal = S.meal && ITEMS[S.meal.id];
  h.push(`<div class="sub">${L('餐點', 'Meal')}</div><p class="small">${meal ? `${esc(meal.name)}${L(`（還有 ${S.meal.n} 場）`, ` (${S.meal.n} more battles)`)}${SEP()}${esc(MEAL(meal.meal || {}))}` : L('沒有。從道具選單把料理當餐點吃，效果會持續好幾場戰鬥。', 'None. Have a dish as a meal from the Items menu; it lasts several battles.')}</p>`);
  const pas = [...new Set([...abilitiesOf(m).filter((a) => ABILITIES[a].passive), ...(m.sup || [])])];
  h.push(`<div class="sub">${L('生效中的被動', 'Passives in effect')}</div>` + (pas.length ? pas.map((a) => `<div class="la"><span class="an">${esc(ABILITIES[a].name)}</span><span class="small ad">${esc(ABILITIES[a].note || '')}</span></div>`).join('') : `<p class="small off">-</p>`));
  const ex = cmdAbilities(m);
  h.push(`<div class="sub">${L('額外指令', 'Extra command')}</div><p class="small">${ex.length ? `${esc(JOBS[m.cmd].name)}${SEP()}${ex.map((a) => esc(ABILITIES[a].name)).join(L('、', ', '))}` : L('沒有（需要精通一個職業）', 'None (needs a mastered job)')}</p>`);
  return h.join('');
}
// where the rare finds and field guardians live, for the bestiary
export const extraWhere = (id) => Object.entries(RARE_AT).find(([, v]) => v === id)?.[0] || FIELD_AT[id] || POST_AT[id] || null;
