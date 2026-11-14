// 晶境漫遊 Prismwander, deeper crafts: every job learns up to job level 20 (new actives, support abilities and a
// high tier that only comes with real grinding), support slots any learned passive can fill, a mastery bonus that
// stays once a job is mastered, more monsters (rare ones that run, and field guardians), a common and a rare drop
// and a steal for every monster, new materials and gear that only drops. Every name is [中文, English].
import { bilingual } from './i18n.js';
import { JOBS, ABILITIES, ITEMS, MONSTERS, TECHS, extendAffinity } from './data.js';
import { LORE_MP, FORGE } from './data2.js';

// ---------- job levels ----------
export const JL_MAX = 20;
// how many support abilities a hero can set: two, a third at level 20, a fourth at level 40
export const supSlots = (m) => 2 + (m.lv >= 20 ? 1 : 0) + (m.lv >= 40 ? 1 : 0);

// what a job is for, where its crystal (or teacher) is, and what mastering it leaves behind (percent, for good)
export const JOB_INFO = {
  fencer:    { role: ['前排・武器傷害', 'Front row · weapon damage'], where: ['一開始就會的職業。', 'Known from the start.'], bonus: { hp: 5, str: 5 } },
  mage:      { role: ['後排・屬性魔法', 'Back row · elemental magic'], where: ['一開始就會的職業。', 'Known from the start.'], bonus: { mag: 6, mp: 4 } },
  cleric:    { role: ['後排・回復與守護', 'Back row · healing and wards'], where: ['一開始就會的職業。', 'Known from the start.'], bonus: { spr: 6, mp: 4 } },
  rogue:     { role: ['速攻・偷竊與異常', 'Speed · stealing and ailments'], where: ['一開始就會的職業。', 'Known from the start.'], bonus: { agi: 6, str: 3 } },
  guardian:  { role: ['坦克・吸引攻擊', 'Tank · draws the attacks'], where: ['水晶：低語林的石柱上。', 'Crystal: on a stone pillar in Whisperwood.'], bonus: { hp: 8, def: 4 } },
  ranger:    { role: ['後排也不減傷的物理', 'Physical damage from the back row'], where: ['水晶：白貝海岸外的海蝕柱上。', 'Crystal: on a sea stack off Shellshore.'], bonus: { str: 4, agi: 4 } },
  monk:      { role: ['空手・連擊與自癒', 'Bare hands · combos and self-healing'], where: ['水晶：灰脊山的岩棚上。', 'Crystal: on a ledge in Greyridge.'], bonus: { hp: 5, str: 5 } },
  bard:      { role: ['支援・歌與強化', 'Support · songs and boosts'], where: ['水晶：鏡湖中央的小島上。', 'Crystal: on an islet in Mirror Lake.'], bonus: { spr: 4, agi: 4 } },
  chrono:    { role: ['支援・時間與速度', 'Support · time and speed'], where: ['水晶：古都遺跡的塔裡。', 'Crystal: in the tower of Old Lumera.'], bonus: { agi: 5, mag: 3 } },
  alchemist: { role: ['道具・炸彈與藥', 'Items · bombs and medicine'], where: ['水晶：赤砂台地的高處。', 'Crystal: high on Redsand Mesa.'], bonus: { mag: 4, def: 4 } },
  astro:     { role: ['後排・高威力魔法', 'Back row · heavy magic'], where: ['水晶：灰脊山的最高處。', 'Crystal: at the highest point of Greyridge.'], bonus: { mag: 6, mp: 5 } },
  scholar:   { role: ['解析・弱點與屬性', 'Analysis · weaknesses and elements'], where: ['爐心村的學者，在你們找到 6 塊記憶碎片之後。', 'The Hearthvale scholar, once you have found 6 memory shards.'], bonus: { mag: 4, spr: 4 } },
  paladin:   { role: ['坦克・聖光與回復', 'Tank · holy light and healing'], where: ['讓古都遺跡的亡騎安息。', 'Lay the fallen knight of Old Lumera to rest.'], bonus: { def: 5, spr: 4 } },
  samurai:   { role: ['前排・蓄力一擊', 'Front row · charged strikes'], where: ['打倒熔岩峰的飛龍。', 'Defeat the drake of Emberpeak.'], bonus: { str: 6, agi: 2 } },
  druid:     { role: ['大地・異常與再生', 'Earth · ailments and regen'], where: ['喚醒孢子林的菇王。', 'Wake the Sporelord of Sporewood.'], bonus: { spr: 4, hp: 4 } },
  dancer:    { role: ['速攻・多段攻擊', 'Speed · many-hit attacks'], where: ['水晶：孢子林的菇頂上。', 'Crystal: on the mushroom tops of Sporewood.'], bonus: { agi: 6, str: 3 } },
  dragoon:   { role: ['跳躍・閃避與重擊', 'Jumps · dodge and crash down'], where: ['水晶：雲上群島的高處。', 'Crystal: high in Cloudreach.'], bonus: { str: 5, def: 3 } },
  summoner:  { role: ['後排・全體召喚', 'Back row · summons that hit everything'], where: ['水晶：沉沒之都薇爾，在它的主人倒下之後。', 'Crystal: in drowned Vael, once its mistress falls.'], bonus: { mag: 5, mp: 5 } },
  machinist: { role: ['遠距離・機關', 'Ranged · gadgets'], where: ['水晶：機關塔裡。', 'Crystal: inside the Clockwork Tower.'], bonus: { str: 4, agi: 3 } },
  geomancer: { role: ['地形・屬性隨地而變', 'Terrain · element from the ground'], where: ['水晶：深岩島的石柱上。', 'Crystal: on a stone pillar on Deepholm.'], bonus: { mag: 4, spr: 4 } },
  hexer:     { role: ['詛咒・削弱與即死', 'Curses · weaken and doom'], where: ['打倒薇爾的潮之魔女。', 'Defeat the Tidewitch of Vael.'], bonus: { mag: 5, spr: 3 } },
  duskknight:{ role: ['前排・以 HP 換力量', 'Front row · pays HP for power'], where: ['正午宮殿裡，一位老隊長的魂。', 'The spirit of an old captain in the Noon Halls.'], bonus: { str: 5, hp: 4 } },
  mimic:     { role: ['學習・魔物的招式', 'Learning · monster techniques'], where: ['水晶：珊瑚群島外的海蝕柱上。', 'Crystal: on a sea stack off the Coral Isles.'], bonus: { mag: 3, agi: 3, spr: 3 } },
  chef:      { role: ['回復・料理與餐點', 'Recovery · food and meals'], where: ['鹽灣港的廚師波姆的委託。', 'Requests from Pomme, the Saltmere cook.'], bonus: { hp: 5, spr: 4 } },
};
for (const v of Object.values(JOB_INFO)) bilingual({ v }, ['role', 'where']);

// ---------- new abilities ----------
// new types: stance (lasts a few rounds), song (works at each round's end), trap (springs on the next foe to act),
// delay (lands a few rounds later), pctheal, coin, kill, ward (a lasting effect on a friend);
// new flags: ramp, scatter, execute, desperate, opening, gamble, rowBonus, useDef, useFoeAtk, mark, statuses, dispel,
// mpall, mpgive, stealGold, healParty, kill, buffAll, shieldParty
const P = (zh, en, nzh, nen) => ({ name: [`${zh}（被動）`, `${en} (passive)`], passive: true, note: [nzh, nen] });
const NEW = {
  // support abilities any job can set once someone has learned them
  atkup:      P('力量提升', 'Power Up', '攻擊力 +10%。', 'Attack +10%.'),
  magup:      P('魔力提升', 'Magic Up', '魔力 +10%。', 'Magic +10%.'),
  defup:      P('堅韌', 'Toughness', '防禦力 +10%。', 'Defence +10%.'),
  agiup:      P('迅捷', 'Fleet Foot', '速度 +10%。', 'Speed +10%.'),
  hpup:       P('HP 提升', 'HP Up', '最大 HP +15%。', 'Max HP +15%.'),
  mpup:       P('MP 提升', 'MP Up', '最大 MP +20%。', 'Max MP +20%.'),
  medic:      P('治療精通', 'Healing Touch', '回復類技能的效果 +25%。', 'Healing abilities restore 25% more.'),
  autoregen:  P('祝福', 'Blessing', '每回合結束回復 5% 最大 HP。', 'Restore 5% of max HP at the end of each round.'),
  thiefluck:  P('盜賊之運', "Thief's Luck", '偷竊更容易成功，也更容易偷到稀有品。', 'Steals succeed more often and find rarer things.'),
  firststrike:P('先制', 'First Strike', '每回合最先行動。', 'Act first every round.'),
  treasure:   P('尋寶者', 'Treasure Hunter', '全隊的掉落機率 ×1.5。', 'Party drop rates x1.5.'),
  hawkeye:    P('鷹眼', 'Hawk Eye', '物理攻擊不會落空（失明時也一樣）。', 'Physical attacks never miss, even when blind.'),
  keeneye:    P('銳眼', 'Keen Eye', '會心一擊的機率從 7% 提高到 18%。', 'Critical hit chance rises from 7% to 18%.'),
  brawler:    P('格鬥家', 'Brawler', '空手或戴拳套時，物理攻擊 ×1.3。', 'Physical attacks x1.3 when unarmed or wearing fist weapons.'),
  encore:     P('安可', 'Encore', '自己唱的歌多持續 2 回合。', 'Your songs last two more rounds.'),
  jpboost:    P('旅人的故事', "Wanderer's Tale", '自己得到的 JP +50%。', 'You earn 50% more JP.'),
  expboost:   P('勤學', 'Studious', '自己得到的經驗值 +25%。', 'You earn 25% more EXP.'),
  goldfind:   P('點金手', 'Midas Touch', '戰鬥得到的金幣 +40%。', 'Battles give 40% more gold.'),
  catalyst:   P('催化劑', 'Catalyst', '投擲瓶類道具的傷害 ×1.5。', 'Thrown flasks deal 1.5x damage.'),
  spellfocus: P('精準', 'Precision', '自己造成的異常狀態更容易命中（+20%）。', 'Ailments you cause land 20% more often.'),
  elemguard:  P('元素護壁', 'Element Ward', '受到的屬性魔法傷害減少四成。', 'Elemental magic hurts you 40% less.'),
  magicguard: P('心之盾', 'Mind Shield', '受到的魔法傷害減少兩成。', 'Magic hurts you 20% less.'),
  stalwart:   P('不屈', 'Stalwart', '不會睡著，也不會暈眩。', 'Cannot be put to sleep or stunned.'),
  endure:     P('忍耐', 'Endure', '每場戰鬥第一次受到致命傷害時，以 1 HP 撐住。', 'The first lethal blow each battle leaves you at 1 HP.'),
  purity:     P('淨身', 'Purity', '不會中毒、失明或沉默。', 'Immune to poison, blindness and silence.'),
  evade:      P('輕盈', 'Light Feet', '閃避物理攻擊的機率 +12%。', '12% more likely to dodge physical attacks.'),
  mpregen:    P('澄澈之心', 'Clear Mind', '每回合結束回復 4% 最大 MP。', 'Restore 4% of max MP at the end of each round.'),
  vampiric:   P('吸血', 'Vampiric', '普通攻擊吸收 15% 傷害回復 HP。', 'Plain attacks drain 15% of the damage as HP.'),
  siphon:     P('汲魂', 'Soul Siphon', '普通攻擊命中時回復一點 MP。', 'Plain attacks restore a little MP when they land.'),
  // fencer
  riposte:    { name: ['迎擊架式', 'Riposte'], mp: 6, type: 'stance', stance: 'riposte', rounds: 3, target: 'self', note: ['三回合內，每次被近身攻擊都一定反擊。', 'For three rounds, strike back at every melee blow you take.'] },
  chainslash: { name: ['連環斬', 'Chain Slash'], mp: 8, type: 'phys', power: 0.7, hits: 3, ramp: 0.35, target: 'enemy', note: ['一刀比一刀重。', 'Each cut lands harder than the last.'] },
  feint:      { name: ['虛招', 'Feint'], mp: 6, type: 'phys', power: 1.3, sure: true, debuff: 'agi', target: 'enemy' },
  bladestorm: { name: ['劍刃風暴', 'Blade Storm'], mp: 18, type: 'phys', power: 0.75, hits: 5, scatter: true, target: 'enemies', note: ['五道劍氣隨機落在敵人身上。', 'Five sword gusts fall on random foes.'] },
  ageless:    { name: ['萬古一劍', 'Ageless Edge'], mp: 30, type: 'phys', power: 3.6, sure: true, execute: true, target: 'enemy', note: ['劍士修行的盡頭。', 'Where a fencer\'s training ends.'] },
  // mage
  icestorm2:  { name: ['冰風暴', 'Ice Storm'], mp: 10, type: 'magic', power: 30, el: 'ice', target: 'enemies' },
  manaburst:  { name: ['魔力爆發', 'Mana Burst'], mp: 10, type: 'magic', power: 20, mpall: true, el: 'none', target: 'enemy', note: ['耗盡所有 MP，每 1 點 MP 增加 2.5 威力。', 'Spends all your MP; every point adds 2.5 power.'] },
  ignite:     { name: ['點燃', 'Ignite'], mp: 9, type: 'magic', power: 34, el: 'fire', status: 'burn', target: 'enemy' },
  prismray:   { name: ['稜光射線', 'Prism Ray'], mp: 20, type: 'magic', power: 34, el: 'random3', hits: 3, scatter: true, target: 'enemies', note: ['三道火、冰、雷的光線，各自打向隨機的敵人。', 'Three rays of fire, ice and bolt, each at a random foe.'] },
  cataclysm:  { name: ['天地崩壞', 'Cataclysm'], mp: 52, type: 'magic', power: 125, el: 'none', target: 'enemies' },
  // cleric
  shell:      { name: ['魔法屏障', 'Shell'], mp: 8, type: 'buff', stat: 'spr', target: 'allies' },
  raise:      { name: ['守護天使', 'Guardian Angel'], mp: 14, type: 'ward', ward: 'reraise', target: 'ally', note: ['9 回合內倒下時，會以 25% HP 自動復活一次。', 'If they fall within 9 rounds, they rise again at 25% HP.'] },
  martyr:     { name: ['殉道', 'Martyr'], mp: 0, hpcost: 0.3, type: 'heal', power: 90, cure: true, target: 'allies', note: ['用自己的生命治療全隊。', 'Heals the whole party with your own life.'] },
  holyrain:   { name: ['聖光雨', 'Holy Rain'], mp: 22, type: 'magic', power: 52, el: 'holy', target: 'enemies' },
  benediction:{ name: ['大祝福', 'Benediction'], mp: 48, type: 'heal', power: 999, cure: true, ward: 'reraise', target: 'allies', note: ['全員完全回復，並受到守護天使的保護。', 'Everyone fully healed and under a guardian angel.'] },
  // rogue
  pickpocket: { name: ['扒竊', 'Pickpocket'], mp: 3, type: 'phys', power: 0.8, stealGold: true, target: 'enemy', note: ['攻擊並偷走金幣。', 'Strikes and lifts some gold.'] },
  snare:      { name: ['捕獸夾', 'Snare Trap'], mp: 6, type: 'trap', power: 1.5, status: 'stun', target: 'none', note: ['設下陷阱：下一個行動的敵人會受到傷害並暈眩。', 'Set a trap: the next foe to act is hurt and stunned.'] },
  backstab:   { name: ['背刺', 'Backstab'], mp: 7, type: 'phys', power: 1.6, opening: true, target: 'enemy' },
  assassinate:{ name: ['暗殺', 'Assassinate'], mp: 24, type: 'phys', power: 3.0, kill: 0.3, target: 'enemy' },
  // guardian
  bodyslam:   { name: ['猛撞', 'Body Slam'], mp: 6, type: 'phys', power: 1.3, useDef: true, target: 'enemy' },
  bastion:    { name: ['城塞', 'Bastion'], mp: 12, type: 'stance', stance: 'bastion', rounds: 3, target: 'self', note: ['三回合內，全隊受到的傷害減少三成。', 'For three rounds, the whole party takes 30% less damage.'] },
  vengeance:  { name: ['復仇', 'Vengeance'], mp: 8, type: 'phys', power: 1.4, desperate: true, target: 'enemy' },
  unbreakable:{ name: ['不破之壁', 'Unbreakable'], mp: 30, type: 'buff', stats: ['def', 'spr'], big: true, taunt: true, target: 'allies', note: ['全隊防禦與魔防大幅上升，自己吸引攻擊。', 'Party defence and magic defence well up; you draw the attacks.'] },
  // ranger
  markprey:   { name: ['標記獵物', 'Mark Prey'], mp: 4, type: 'status', mark: true, target: 'enemy' },
  longshot:   { name: ['遠射', 'Longshot'], mp: 6, type: 'phys', power: 1.8, rowBonus: 'back', ranged: true, target: 'enemy' },
  venomarrow: { name: ['毒箭', 'Venom Arrow'], mp: 5, type: 'phys', power: 1.1, status: 'poison', ranged: true, target: 'enemy' },
  barrage:    { name: ['連射', 'Barrage'], mp: 14, type: 'phys', power: 0.55, hits: 5, scatter: true, ranged: true, target: 'enemies' },
  skypiercer: { name: ['破天箭', 'Sky Piercer'], mp: 26, type: 'phys', power: 3.2, ignoreDef: true, mark: true, ranged: true, target: 'enemy' },
  // monk
  comborush:  { name: ['連擊', 'Combo Rush'], mp: 8, type: 'phys', power: 0.5, hits: 4, ramp: 0.4, target: 'enemy' },
  flowingwater:{ name: ['流水', 'Flowing Water'], mp: 6, type: 'stance', stance: 'evade', rounds: 3, target: 'self', note: ['三回合內，有一半機率閃過物理攻擊。', 'For three rounds, dodge half of all physical attacks.'] },
  kiblast:    { name: ['氣功彈', 'Ki Blast'], mp: 6, type: 'phys', power: 1.5, ranged: true, target: 'enemy' },
  tigerpalm:  { name: ['猛虎掌', 'Tiger Palm'], mp: 14, type: 'phys', power: 2.4, status: 'stun', target: 'enemy' },
  finalheaven:{ name: ['極天', 'Final Heaven'], mp: 28, type: 'phys', power: 1.6, hits: 3, ramp: 0.5, target: 'enemy' },
  // bard
  hymn:       { name: ['療癒讚歌', 'Healing Hymn'], mp: 8, type: 'song', song: 'heal', power: 22, rounds: 3, target: 'none', note: ['三回合內，每回合結束全隊回復 HP。', 'For three rounds, the party recovers HP at the end of each round.'] },
  manaode:    { name: ['魔力頌', 'Ode of Mana'], mp: 4, type: 'song', song: 'mp', power: 6, rounds: 3, target: 'none', note: ['三回合內，每回合結束全隊回復 MP。', 'For three rounds, the party recovers MP at the end of each round.'] },
  dirge:      { name: ['哀歌', 'Dirge'], mp: 10, type: 'song', song: 'dirge', power: 30, rounds: 3, target: 'none', note: ['三回合內，每回合結束所有敵人受到傷害。', 'For three rounds, every foe takes damage at the end of each round.'] },
  discord:    { name: ['不協和音', 'Discord'], mp: 10, type: 'status', status: 'silence', target: 'enemies' },
  heromarch:  { name: ['英雄進行曲', "Hero's March"], mp: 12, type: 'buff', stats: ['str', 'mag'], big: true, target: 'ally' },
  crescendo:  { name: ['漸強', 'Crescendo'], mp: 40, type: 'magic', power: 85, el: 'none', healParty: 50, target: 'enemies' },
  // chronomancer
  rewind:     { name: ['倒轉', 'Rewind'], mp: 7, type: 'pctheal', pct: 0.35, cure: true, target: 'ally', note: ['讓夥伴的身體回到幾秒之前。', "Turns a friend's body back a few seconds."] },
  timecollapse:{ name: ['時間崩塌', 'Time Collapse'], mp: 12, type: 'delay', power: 90, el: 'none', rounds: 2, target: 'enemy', note: ['兩回合後，時間在目標身上崩塌。', 'Two rounds later, time collapses on the target.'] },
  graviga:    { name: ['重力場', 'Graviga'], mp: 20, type: 'gravity', pct: 0.25, target: 'enemies' },
  slowga:     { name: ['全體減速', 'Slowga'], mp: 12, type: 'status', status: 'slow', target: 'enemies' },
  horizon:    { name: ['事象地平線', 'Event Horizon'], mp: 40, type: 'gravity', pct: 0.5, bossPct: 0.15, status: 'slow', target: 'enemies' },
  // alchemist
  goldtoss:   { name: ['金幣投擲', 'Gold Toss'], mp: 0, type: 'coin', target: 'enemy', note: ['丟出身上 2% 的金幣（至少 20），造成三倍的傷害，無視防禦。', 'Throws 2% of your gold (at least 20) for three times that in damage, ignoring defence.'] },
  timebomb:   { name: ['定時炸彈', 'Time Bomb'], mp: 8, type: 'delay', power: 60, el: 'fire', rounds: 2, target: 'enemies', note: ['兩回合後，所有敵人腳下爆炸。', 'Two rounds later, it goes off under every foe.'] },
  corrode:    { name: ['腐蝕', 'Corrode'], mp: 10, type: 'status', debuffs: ['def'], target: 'enemies' },
  dispelflask:{ name: ['驅散瓶', 'Dispel Flask'], mp: 9, type: 'magic', power: 30, el: 'none', dispel: true, target: 'enemies' },
  panacea:    { name: ['萬靈藥', 'Panacea'], mp: 16, type: 'heal', power: 100, cure: true, target: 'allies' },
  detonation: { name: ['大爆破', 'Grand Detonation'], mp: 42, type: 'magic', power: 140, el: 'fire', target: 'enemies' },
  // astromancer
  lunartide:  { name: ['月潮', 'Lunar Tide'], mp: 10, type: 'heal', power: 26, mpgive: 8, target: 'allies' },
  starfall:   { name: ['星墜', 'Starfall'], mp: 14, type: 'magic', power: 20, el: 'holy', hits: 6, scatter: true, target: 'enemies' },
  astralgamble:{ name: ['星之賭局', 'Astral Gamble'], mp: 16, type: 'magic', power: 70, el: 'none', gamble: [0.4, 2.6], target: 'enemy' },
  starveil:   { name: ['星幕', 'Star Veil'], mp: 20, type: 'buff', stats: ['def', 'spr'], big: true, target: 'allies' },
  genesis:    { name: ['創世', 'Genesis'], mp: 54, type: 'magic', power: 140, el: 'holy', target: 'enemies' },
  // scholar
  expose:     { name: ['弱點暴露', 'Expose'], mp: 4, type: 'status', mark: true, scanIt: true, target: 'enemy' },
  dispel:     { name: ['驅散', 'Dispel'], mp: 5, type: 'magic', power: 20, el: 'none', dispel: true, target: 'enemy' },
  tactics:    { name: ['戰術指揮', 'Tactics'], mp: 18, type: 'buff', stats: ['str', 'mag'], target: 'allies' },
  grandthesis:{ name: ['大論證', 'Grand Thesis'], mp: 46, type: 'magic', power: 112, el: 'auto', target: 'enemies' },
  // paladin
  smite:      { name: ['破邪斬', 'Smite'], mp: 6, type: 'phys', power: 1.6, el: 'holy', antiUndead: true, target: 'enemy' },
  layonhands: { name: ['聖手', 'Lay on Hands'], mp: 0, hpcost: 0.15, type: 'heal', power: 120, cure: true, target: 'ally' },
  holyshield: { name: ['聖盾', 'Holy Shield'], mp: 8, type: 'buff', stats: ['def', 'spr'], big: true, target: 'ally' },
  lastjudgment:{ name: ['最後審判', 'Last Judgment'], mp: 34, type: 'phys', power: 1.7, el: 'holy', healParty: 60, target: 'enemies' },
  // samurai
  bloodoath:  { name: ['血誓', 'Blood Oath'], mp: 0, hpcost: 0.1, type: 'buff', stat: 'str', big: true, target: 'self' },
  zantetsu:   { name: ['斬鐵', 'Zantetsu'], mp: 18, type: 'phys', power: 1.1, kill: 0.2, target: 'enemies' },
  issen:      { name: ['一閃・極', 'Issen'], mp: 12, type: 'phys', power: 2.0, sure: true, execute: true, target: 'enemy' },
  stillwater: { name: ['明鏡止水', 'Still Water'], mp: 30, type: 'phys', power: 0.9, hits: 5, ramp: 0.25, sure: true, target: 'enemy' },
  // druid
  vinelash:   { name: ['藤鞭', 'Vine Lash'], mp: 7, type: 'magic', power: 30, el: 'earth', status: 'slow', target: 'enemy' },
  wildgrowth: { name: ['野性生長', 'Wild Growth'], mp: 12, type: 'heal', power: 20, regen: true, target: 'allies' },
  thornskin:  { name: ['荊棘之膚', 'Thornskin'], mp: 8, type: 'ward', ward: 'thorns', target: 'ally', note: ['4 回合內，近身攻擊這位夥伴的敵人會受到反傷。', 'For four rounds, foes who strike this friend in melee are hurt back.'] },
  wildshape:  { name: ['野性變身', 'Wild Shape'], mp: 10, type: 'stance', stance: 'beast', rounds: 3, target: 'self', note: ['三回合內攻擊力 ×1.6、防禦 ×0.8。', 'Three rounds of attack x1.6 and defence x0.8.'] },
  gaiawrath:  { name: ['蓋亞之怒', "Gaia's Wrath"], mp: 46, type: 'magic', power: 120, el: 'earth', healParty: 80, target: 'enemies' },
  // bladedancer
  allure:     { name: ['魅惑舞步', 'Allure'], mp: 8, type: 'status', debuffs: ['str'], target: 'enemies' },
  healwaltz:  { name: ['療癒圓舞', 'Healing Waltz'], mp: 9, type: 'heal', power: 30, buff: 'agi', target: 'allies' },
  fortunestep:{ name: ['幸運舞步', 'Fortune Step'], mp: 7, type: 'phys', power: 1.6, gamble: [0.3, 3.0], target: 'enemy' },
  swipestep:  { name: ['掠奪舞步', 'Swipe Step'], mp: 9, type: 'phys', power: 0.8, hits: 2, steal: true, target: 'enemy' },
  whirlwind:  { name: ['旋風之舞', 'Whirlwind'], mp: 18, type: 'phys', power: 0.6, hits: 6, scatter: true, el: 'wind', target: 'enemies' },
  lastdance:  { name: ['最後之舞', 'Last Dance'], mp: 30, type: 'phys', power: 0.55, hits: 8, ramp: 0.15, target: 'enemy' },
  // dragoon
  lancecharge:{ name: ['突擊槍', 'Lance Charge'], mp: 6, type: 'phys', power: 1.6, rowBonus: 'front', target: 'enemy' },
  impale:     { name: ['貫刺', 'Impale'], mp: 10, type: 'phys', power: 1.3, ignoreDef: true, debuff: 'def', target: 'enemy' },
  souljump:   { name: ['龍魂跳', 'Soul Jump'], mp: 14, type: 'jump', power: 2.4, drain: 0.3, target: 'enemy' },
  wyrmdive:   { name: ['龍墜', 'Wyrm Dive'], mp: 30, type: 'jump', power: 3.0, target: 'enemies' },
  // summoner
  glimmer:    { name: ['召喚：晶兔', 'Summon: Glimmer'], mp: 16, type: 'summon', model: 'quat/Bunny', tint: '#a0f0ff', shieldParty: true, target: 'allies', note: ['晶兔張開光之簾：全隊防禦與魔防上升。', 'The crystal hare raises a veil of light: party defence and magic defence up.'] },
  volta:      { name: ['召喚：伏特', 'Summon: Volta'], mp: 30, type: 'summon', model: 'quat/Hywirl', tint: '#fff060', power: 74, el: 'bolt', status: 'stun', target: 'enemies' },
  aster:      { name: ['召喚：艾絲特', 'Summon: Aster'], mp: 42, type: 'summon', model: 'quat/Alpaking_Evolved', tint: '#ffd8ff', power: 110, el: 'holy', target: 'enemies' },
  prismara:   { name: ['召喚：稜晶龍', 'Summon: Prismara'], mp: 60, type: 'summon', model: 'quat/Dragon_Evolved', tint: '#e0c0ff', power: 150, el: 'none', target: 'enemies' },
  // machinist
  scattergun: { name: ['散彈槍', 'Scattergun'], mp: 8, type: 'phys', power: 0.6, hits: 4, scatter: true, ranged: true, target: 'enemies' },
  shockmine:  { name: ['電擊地雷', 'Shock Mine'], mp: 8, type: 'trap', power: 1.8, el: 'bolt', status: 'slow', target: 'none', note: ['埋下地雷：下一個行動的敵人會被炸到並減速。', 'Bury a mine: the next foe to act is blasted and slowed.'] },
  tranq:      { name: ['麻醉彈', 'Tranquilizer'], mp: 6, type: 'phys', power: 0.8, status: 'sleep', ranged: true, target: 'enemy' },
  deflector:  { name: ['偏轉力場', 'Deflector'], mp: 18, type: 'buff', stat: 'spr', big: true, target: 'allies' },
  orbital:    { name: ['衛星砲', 'Orbital Beam'], mp: 40, type: 'delay', power: 160, el: 'bolt', rounds: 1, target: 'enemies', note: ['這一回合結束時，光束從天而降。', 'At the end of this round, a beam falls from the sky.'] },
  // geomancer
  landslide:  { name: ['山崩', 'Landslide'], mp: 14, type: 'magic', power: 36, el: 'terrain', target: 'enemies' },
  fissure:    { name: ['地裂', 'Fissure'], mp: 9, type: 'magic', power: 40, el: 'earth', status: 'stun', target: 'enemy' },
  leyline:    { name: ['地脈之流', 'Ley Line'], mp: 16, type: 'heal', power: 20, regen: true, mpgive: 12, target: 'allies' },
  drift:      { name: ['大陸漂移', 'Continental Drift'], mp: 50, type: 'magic', power: 130, el: 'terrain', status: 'slow', target: 'enemies' },
  // hexer
  hexfrailty: { name: ['衰弱之咒', 'Hex of Frailty'], mp: 6, type: 'status', mark: true, target: 'enemy' },
  death:      { name: ['死神', 'Death'], mp: 16, type: 'kill', kill: 0.45, target: 'enemy' },
  plague:     { name: ['瘟疫', 'Plague'], mp: 20, type: 'status', statuses: ['poison', 'blind', 'silence'], target: 'enemies' },
  oblivion:   { name: ['遺忘', 'Oblivion'], mp: 54, type: 'magic', power: 132, el: 'dark', target: 'enemies' },
  // duskknight
  sanguine:   { name: ['血刃', 'Sanguine Edge'], mp: 0, hpcost: 0.06, type: 'phys', power: 1.5, desperate: true, el: 'dark', target: 'enemy' },
  shadowsurge:{ name: ['影潮', 'Shadow Surge'], mp: 0, hpcost: 0.22, type: 'phys', power: 1.8, el: 'dark', target: 'enemies' },
  soulreap:   { name: ['收割靈魂', 'Soul Reap'], mp: 16, type: 'phys', power: 2.4, kill: 0.2, drain: 0.3, el: 'dark', target: 'enemy' },
  nighteternal:{ name: ['永夜劍', 'Night Eternal'], mp: 0, hpcost: 0.35, type: 'phys', power: 5.4, el: 'dark', sure: true, target: 'enemy' },
  // mimic
  mirrorstrike:{ name: ['鏡擊', 'Mirror Strike'], mp: 4, type: 'phys', power: 1.2, el: 'auto', target: 'enemy' },
  mimicbite:  { name: ['擬態咬', 'Mimic Bite'], mp: 8, type: 'phys', power: 1.4, useFoeAtk: true, target: 'enemy' },
  doubleecho: { name: ['雙重回聲', 'Double Echo'], mp: 20, type: 'echo', twice: true, target: 'none' },
  kaleidoscope:{ name: ['萬花筒', 'Kaleidoscope'], mp: 44, type: 'magic', power: 118, el: 'auto', target: 'enemies' },
  // chef
  energysnack:{ name: ['能量點心', 'Energy Snack'], mp: 6, type: 'heal', power: 60, mpgive: 12, target: 'ally' },
  cleaver:    { name: ['剁骨刀', 'Cleaver'], mp: 9, type: 'phys', power: 1.8, execute: true, target: 'enemy' },
  flambe:     { name: ['火焰燒', 'Flambé'], mp: 20, type: 'magic', power: 60, el: 'fire', status: 'burn', target: 'enemies' },
  banquet:    { name: ['皇家宴會', 'Royal Banquet'], mp: 50, type: 'heal', power: 999, cure: true, regen: true, buffAll: true, target: 'allies' },
};
Object.assign(ABILITIES, bilingual(NEW, ['name', 'note']));
// what the older passives do, in words
const OLD_NOTES = {
  counter: ['被普通攻擊打中時，有 30% 機率反擊。', 'A 30% chance to strike back when hit by a plain attack.'],
  cover: ['夥伴 HP 低於 35% 時，常常會替他擋下攻擊。', 'Often takes the blow for a friend under 35% HP.'],
  innerpeace: ['每回合結束回復 5% 最大 HP。', 'Restore 5% of max HP at the end of each round.'],
  pharmacy: ['使用道具的效果加倍。', 'Items you use work twice as well.'],
  mpthrift: ['MP 消耗減少 25%。', 'Abilities cost 25% less MP.'],
  dragonheart: ['跳躍的傷害 ×1.3。', 'Jumps hit 1.3x harder.'],
  laststand: ['HP 低於 25% 時，攻擊力 ×1.5。', 'Attack x1.5 while under 25% HP.'],
  mimicry: ['被魔物的招式打中時，可能學會它（之後用「擬態」施展）。', 'May learn a monster technique that hits you (then use it with Lore).'],
  mimicmaster: ['擬態招式的 MP 減半。', 'Lore techniques cost half the MP.'],
  gourmet: ['料理效果加倍，餐點的效果再強一點。', 'Food works twice as well, and meals a little better.'],
};
for (const [id, n] of Object.entries(OLD_NOTES)) bilingual({ [id]: Object.assign(ABILITIES[id], { note: n }) }, ['note']);

// what each job learns on top of what it already taught, up to job level 20
const LEARN = {
  fencer: [[5, 'riposte'], [7, 'atkup'], [8, 'chainslash'], [11, 'feint'], [14, 'bladestorm'], [17, 'hpup'], [20, 'ageless']],
  mage: [[5, 'icestorm2'], [7, 'magup'], [8, 'manaburst'], [11, 'ignite'], [14, 'prismray'], [17, 'mpup'], [20, 'cataclysm']],
  cleric: [[5, 'shell'], [7, 'medic'], [9, 'raise'], [11, 'martyr'], [14, 'holyrain'], [17, 'autoregen'], [20, 'benediction']],
  rogue: [[5, 'pickpocket'], [7, 'thiefluck'], [8, 'snare'], [11, 'backstab'], [14, 'firststrike'], [17, 'treasure'], [20, 'assassinate']],
  guardian: [[3, 'defup'], [5, 'bodyslam'], [7, 'hpup'], [8, 'stalwart'], [11, 'bastion'], [14, 'vengeance'], [17, 'endure'], [20, 'unbreakable']],
  ranger: [[3, 'markprey'], [5, 'hawkeye'], [7, 'longshot'], [8, 'venomarrow'], [11, 'barrage'], [14, 'keeneye'], [17, 'agiup'], [20, 'skypiercer']],
  monk: [[3, 'brawler'], [5, 'comborush'], [7, 'flowingwater'], [8, 'kiblast'], [11, 'counter'], [14, 'tigerpalm'], [17, 'atkup'], [20, 'finalheaven']],
  bard: [[3, 'hymn'], [5, 'manaode'], [7, 'dirge'], [8, 'encore'], [11, 'discord'], [14, 'heromarch'], [17, 'jpboost'], [20, 'crescendo']],
  chrono: [[3, 'rewind'], [5, 'timecollapse'], [7, 'agiup'], [8, 'graviga'], [11, 'mpregen'], [14, 'slowga'], [17, 'firststrike'], [20, 'horizon']],
  alchemist: [[3, 'goldtoss'], [5, 'timebomb'], [7, 'catalyst'], [8, 'corrode'], [11, 'dispelflask'], [14, 'panacea'], [17, 'goldfind'], [20, 'detonation']],
  astro: [[2, 'magup'], [6, 'lunartide'], [7, 'starfall'], [9, 'mpup'], [11, 'astralgamble'], [14, 'starveil'], [17, 'mpregen'], [20, 'genesis']],
  scholar: [[4, 'expose'], [6, 'expboost'], [7, 'dispel'], [9, 'spellfocus'], [11, 'elemguard'], [14, 'tactics'], [17, 'magicguard'], [20, 'grandthesis']],
  paladin: [[3, 'defup'], [5, 'smite'], [7, 'layonhands'], [8, 'holyshield'], [11, 'endure'], [14, 'raise'], [17, 'hpup'], [20, 'lastjudgment']],
  samurai: [[4, 'atkup'], [6, 'bloodoath'], [7, 'keeneye'], [9, 'zantetsu'], [11, 'issen'], [14, 'firststrike'], [17, 'laststand'], [20, 'stillwater']],
  druid: [[4, 'autoregen'], [5, 'vinelash'], [7, 'wildgrowth'], [9, 'purity'], [11, 'thornskin'], [14, 'wildshape'], [17, 'hpup'], [20, 'gaiawrath']],
  dancer: [[2, 'agiup'], [4, 'allure'], [6, 'healwaltz'], [7, 'evade'], [9, 'fortunestep'], [11, 'swipestep'], [14, 'whirlwind'], [17, 'keeneye'], [20, 'lastdance']],
  dragoon: [[4, 'atkup'], [6, 'lancecharge'], [8, 'elemguard'], [11, 'impale'], [14, 'souljump'], [17, 'hpup'], [20, 'wyrmdive']],
  summoner: [[4, 'mpup'], [6, 'glimmer'], [8, 'mpthrift'], [9, 'magup'], [12, 'volta'], [15, 'mpregen'], [18, 'aster'], [20, 'prismara']],
  machinist: [[4, 'hawkeye'], [6, 'scattergun'], [8, 'shockmine'], [9, 'keeneye'], [12, 'tranq'], [15, 'firststrike'], [18, 'deflector'], [20, 'orbital']],
  geomancer: [[4, 'elemguard'], [6, 'landslide'], [8, 'purity'], [9, 'fissure'], [12, 'mpregen'], [15, 'leyline'], [18, 'magup'], [20, 'drift']],
  hexer: [[4, 'magup'], [6, 'hexfrailty'], [8, 'spellfocus'], [9, 'death'], [12, 'siphon'], [15, 'plague'], [18, 'magicguard'], [20, 'oblivion']],
  duskknight: [[4, 'hpup'], [6, 'sanguine'], [8, 'vampiric'], [9, 'atkup'], [12, 'shadowsurge'], [15, 'endure'], [18, 'soulreap'], [20, 'nighteternal']],
  mimic: [[2, 'mirrorstrike'], [4, 'evade'], [6, 'mimicbite'], [7, 'expboost'], [9, 'mpup'], [12, 'doubleecho'], [15, 'mpregen'], [18, 'stalwart'], [20, 'kaleidoscope']],
  chef: [[4, 'hpup'], [6, 'energysnack'], [8, 'medic'], [9, 'cleaver'], [12, 'goldfind'], [15, 'flambe'], [18, 'treasure'], [20, 'banquet']],
};
for (const [job, add] of Object.entries(LEARN)) { JOBS[job].learn.push(...add); JOBS[job].learn.sort((a, b) => a[0] - b[0]); }

// ---------- what monsters can do, new ----------
// kinds: break (lowers defence), explode (the monster blows itself up), flee (a rare monster runs away)
const NEW_TECHS = {
  mudshot:    { name: ['泥彈', 'Mud Shot'], kind: 'magic', power: 22, el: 'earth', target: 'one' },
  rockfall:   { name: ['落石', 'Rockfall'], kind: 'magic', power: 30, el: 'earth', target: 'all' },
  thunderhead:{ name: ['雷雲', 'Thunderhead'], kind: 'magic', power: 32, el: 'bolt', target: 'all' },
  gust:       { name: ['陣風', 'Gust'], kind: 'magic', power: 22, el: 'wind', target: 'one' },
  hailstone:  { name: ['冰雹', 'Hailstone'], kind: 'magic', power: 26, el: 'ice', target: 'one' },
  whirlpool:  { name: ['漩渦', 'Whirlpool'], kind: 'magic', power: 34, el: 'water', target: 'all' },
  magmaburst: { name: ['熔岩爆', 'Magma Burst'], kind: 'magic', power: 44, el: 'fire', target: 'all' },
  starfall:   { name: ['星落', 'Star Shower'], kind: 'magic', power: 40, el: 'holy', target: 'all' },
  mindblast:  { name: ['精神衝擊', 'Mind Blast'], kind: 'magic', power: 36, el: 'dark', target: 'one' },
  acidspit:   { name: ['酸液', 'Acid Spit'], kind: 'break', target: 'one' },
  bonecrush:  { name: ['碎骨擊', 'Bone Crush'], kind: 'smash', power: 2.3, target: 'one' },
  devour:     { name: ['吞噬', 'Devour'], kind: 'drain', power: 30, target: 'one' },
  chill:      { name: ['寒氣', 'Chill'], kind: 'status', status: 'slow', target: 'one' },
  selfdestruct:{ name: ['自爆', 'Self-Destruct'], kind: 'explode', target: 'one' },
  flee:       { name: ['逃走', 'Flee'], kind: 'flee', target: 'self' },
};
Object.assign(TECHS, bilingual(NEW_TECHS, ['name']));
Object.assign(LORE_MP, { mudshot: 6, rockfall: 14, thunderhead: 15, gust: 6, hailstone: 7, whirlpool: 16, magmaburst: 22, starfall: 20, mindblast: 10, acidspit: 5, bonecrush: 9, devour: 10, chill: 5 });

// ---------- monsters ----------
// rare: a lucky find that may run away; goldk / expk / jpk multiply what it gives; field: an optional guardian out in the land
const M3 = {
  // the old land
  puffcap:     { name: ['蓬蓬菇', 'Puffcap'], model: 'quat/Mushnub', tint: '#f0d8a0', lv: 3, hp: 0.9, acts: [['atk', 3], ['sleep', 1]], kind: 'fungus', sz: 0.9 },
  thornwolf:   { name: ['荊棘狼', 'Thorn Wolf'], model: 'pets/animal-dog', tint: '#5f7f4a', lv: 8, agi: 1.3, atk: 1.1, acts: [['atk', 4], ['poison', 1]], kind: 'beast' },
  leafsprite:  { name: ['葉精', 'Leaf Sprite'], model: 'quat/Hywirl', tint: '#90e070', lv: 7, mag: 1.3, def: 0.7, acts: [['atk', 1], ['gust', 2], ['heal', 1]], kind: 'plant', fly: true, sz: 1.1 },
  mossgolem:   { name: ['苔石魔像', 'Moss Golem'], model: 'vox:golem', color: '#6a8a5a', lv: 10, hp: 1.5, def: 1.6, agi: 0.6, acts: [['atk', 3], ['mudshot', 1], ['harden', 1]], kind: 'stone' },
  shellgull:   { name: ['貝殼鷗', 'Shell Gull'], model: 'pets/animal-parrot', tint: '#f0f0f8', lv: 9, agi: 1.4, acts: [['atk', 3], ['gust', 1]], kind: 'flyer' },
  hermitcrab:  { name: ['寄居蟹', 'Hermit Crab'], model: 'vox:crab', color: '#c89060', lv: 10, def: 2.0, acts: [['atk', 3], ['harden', 1]], kind: 'water' },
  lilyfrog:    { name: ['睡蓮蛙', 'Lily Frog'], model: 'quat/Frog', tint: '#70c890', lv: 10, acts: [['atk', 2], ['water', 1], ['sleep', 1]], kind: 'water', sz: 1.0 },
  lakeglub:    { name: ['湖泡泡', 'Lake Glub'], model: 'quat/Glub', tint: '#90d0f0', lv: 12, mag: 1.2, acts: [['atk', 2], ['water', 2]], kind: 'water', sz: 1.1 },
  mirehand:    { name: ['泥沼之手', 'Mire Hand'], model: 'quat/Zombie_Blocky', tint: '#6a7a4a', lv: 12, hp: 1.3, acts: [['atk', 3], ['acidspit', 1], ['poison', 1]], kind: 'undead', undead: true, sz: 1.6 },
  fenwisp:     { name: ['鬼火', 'Will-o-Wisp'], model: 'vox:wisp', color: '#c8ff80', lv: 11, mag: 1.4, def: 0.6, acts: [['fire', 2], ['sleep', 1]], kind: 'spirit' },
  sporebrute:  { name: ['孢子巨菇', 'Spore Brute'], model: 'quat/Mushnub_Evolved', tint: '#d890ff', lv: 15, hp: 1.4, atk: 1.2, acts: [['atk', 3], ['sleep', 1], ['poison', 1]], kind: 'fungus', sz: 1.5 },
  bloomslime:  { name: ['花苞史萊姆', 'Bloom Slime'], model: 'quat/Pink_Slime', tint: '#ffa0d8', lv: 13, acts: [['atk', 2], ['heal', 1], ['sleep', 1]], kind: 'plant', sz: 1.0 },
  dusthog:     { name: ['沙塵豬', 'Dust Hog'], model: 'pets/animal-pig', tint: '#c08060', lv: 15, hp: 1.3, acts: [['atk', 3], ['charge', 1], ['blind', 1]], kind: 'sand' },
  bigcactoro:  { name: ['巨仙人掌', 'Great Cactoro'], model: 'quat/Cactoro_Big', lv: 17, hp: 1.5, def: 1.4, acts: [['atk', 3], ['needles', 2]], kind: 'sand', sz: 1.7 },
  redhawk:     { name: ['赤砂鷹', 'Redsand Hawk'], model: 'pets/animal-parrot', tint: '#c85a3a', lv: 16, agi: 1.5, acts: [['atk', 3], ['dive', 1]], kind: 'flyer' },
  cinderhound: { name: ['餘燼犬', 'Cinder Hound'], model: 'pets/animal-dog', tint: '#ff6a30', lv: 23, agi: 1.3, atk: 1.2, acts: [['atk', 3], ['burn', 1], ['fire', 1]], kind: 'fire' },
  lavafiend:   { name: ['熔岩魔', 'Lava Fiend'], model: 'quat/Demon', tint: '#ff5a20', lv: 25, mag: 1.4, hp: 1.3, acts: [['atk', 2], ['fire', 1], ['magmaburst', 1]], kind: 'demon', sz: 1.8 },
  lumeranshade:{ name: ['古都幽魂', 'Lumeran Shade'], model: 'quat/Wizard', tint: '#9a88d0', lv: 20, mag: 1.5, def: 0.8, acts: [['atk', 1], ['shadowbolt', 2], ['silence', 1]], kind: 'spirit', undead: true, sz: 1.6 },
  hollowarmor: { name: ['空洞鎧甲', 'Hollow Armour'], model: 'kaykit/Skeleton_Warrior', tint: '#8890a0', lv: 21, hp: 1.3, def: 1.6, agi: 0.7, acts: [['atk', 3], ['bonecrush', 1], ['harden', 1]], kind: 'undead', undead: true },
  ruinprowler: { name: ['遺跡夜貓', 'Ruin Prowler'], model: 'pets/animal-cat', tint: '#5a4a60', lv: 19, agi: 1.6, acts: [['atk', 3], ['steal', 1]], kind: 'beast' },
  cragbull:    { name: ['岩角牛', 'Crag Bull'], model: 'pets/animal-cow', tint: '#8a8a92', lv: 19, hp: 1.5, atk: 1.3, acts: [['atk', 3], ['charge', 1]], kind: 'beast' },
  cragroc:     { name: ['山岩怪鳥', 'Crag Roc'], model: 'quat/Birb', tint: '#a8a8b8', lv: 21, agi: 1.3, acts: [['atk', 2], ['gust', 1], ['dive', 1]], kind: 'flyer', fly: true, sz: 1.3 },
  snowpuff:    { name: ['雪球怪', 'Snowpuff'], model: 'quat/Yeti_Blob', tint: '#f0f8ff', lv: 19, hp: 1.2, acts: [['atk', 2], ['hailstone', 1], ['chill', 1]], kind: 'ice', sz: 1.2 },
  rimegolem:   { name: ['霜晶魔像', 'Rime Golem'], model: 'vox:golem', color: '#c8ecff', lv: 22, hp: 1.7, def: 1.7, agi: 0.6, acts: [['atk', 3], ['hailstone', 1], ['harden', 1]], kind: 'ice' },
  prismmote:   { name: ['稜光粒', 'Prism Mote'], model: 'vox:wisp', color: '#e8c8ff', lv: 25, mag: 1.6, def: 0.7, acts: [['laser', 2], ['starfall', 1]], kind: 'crystal' },
  crystalknight:{ name: ['水晶騎士', 'Crystal Knight'], model: 'kaykit/Skeleton_Warrior', tint: '#a8ecff', lv: 27, hp: 1.4, def: 1.5, acts: [['atk', 3], ['bonecrush', 1]], kind: 'crystal' },
  // the east
  coralglub:   { name: ['珊瑚泡泡', 'Coral Glub'], model: 'quat/Glub_Evolved', tint: '#ff9a88', lv: 28, v2: true, mag: 1.3, acts: [['water', 2], ['whirlpool', 1]], kind: 'sea', fly: true, sz: 1.4 },
  reefbrute:   { name: ['礁岸蠻兵', 'Reef Brute'], model: 'quat/Orc_Brute', tint: '#5aa0a0', lv: 29, v2: true, hp: 1.4, atk: 1.3, acts: [['atk', 3], ['bonecrush', 1], ['roar', 1]], kind: 'human', sz: 1.8 },
  angler:      { name: ['深海鮟鱇', 'Deep Angler'], model: 'quat/Blobfish', tint: '#405888', lv: 29, v2: true, hp: 1.3, acts: [['atk', 2], ['sleep', 1], ['devour', 1]], kind: 'sea' },
  volteel:     { name: ['電鰻', 'Volt Eel'], model: 'quat/Fish', tint: '#e8e070', lv: 28, v2: true, acts: [['atk', 2], ['shock', 2]], kind: 'sea' },
  stormbirb:   { name: ['雷雲雀', 'Storm Birb'], model: 'quat/Birb', tint: '#f0e860', lv: 32, v2: true, agi: 1.4, acts: [['atk', 2], ['shock', 1], ['thunderhead', 1]], kind: 'sky', sz: 1.1 },
  cloudpuff:   { name: ['雲朵怪', 'Cloud Puff'], model: 'quat/Yeti_Blob', tint: '#e8f2ff', lv: 31, v2: true, hp: 1.2, acts: [['atk', 2], ['gust', 1], ['sleep', 1]], kind: 'gale', fly: true, sz: 1.3 },
  cloudstrider:{ name: ['雲步長頸獸', 'Cloud Strider'], model: 'pets/animal-giraffe', tint: '#d8e8ff', lv: 33, v2: true, hp: 1.4, acts: [['atk', 3], ['gust', 1]], kind: 'sky' },
  tickbomb:    { name: ['定時炸彈仔', 'Tick Bomb'], model: 'quat/Enemy_Small', tint: '#ff6a40', lv: 35, v2: true, hp: 0.8, acts: [['atk', 3], ['selfdestruct', 1]], kind: 'machine', machine: true, sz: 1.0 },
  brasssentry: { name: ['黃銅哨兵', 'Brass Sentry'], model: 'quat/Enemy_Flying', tint: '#c8c8d8', lv: 36, v2: true, acts: [['laser', 2], ['thunderhead', 1]], kind: 'machine', machine: true, fly: true, sz: 1.3 },
  fernstalker: { name: ['蕨葉獵手', 'Fern Stalker'], model: 'quat/Velociraptor', tint: '#70a858', lv: 34, v2: true, agi: 1.5, acts: [['atk', 4], ['poison', 1]], kind: 'dino', sz: 1.4 },
  sparkdino:   { name: ['電光小龍', 'Spark Dino'], model: 'quat/Dino', tint: '#e8d860', lv: 35, v2: true, acts: [['atk', 2], ['shock', 2]], kind: 'dino', sz: 1.3 },
  sirenshade:  { name: ['海妖之影', 'Siren Shade'], model: 'quat/Ghost', tint: '#90e8e0', lv: 35, v2: true, mag: 1.5, def: 0.7, acts: [['water', 1], ['whirlpool', 1], ['sleep', 1]], kind: 'drowned', undead: true, sz: 1.5 },
  pearlcrab:   { name: ['珍珠蟹', 'Pearl Crab'], model: 'vox:crab', color: '#f4ecff', lv: 34, v2: true, def: 2.0, acts: [['atk', 3], ['harden', 1]], kind: 'sea' },
  cavetroll:   { name: ['洞窟巨魔', 'Cave Troll'], model: 'quat/Orc_Brute', tint: '#708060', lv: 39, v2: true, hp: 1.7, atk: 1.4, agi: 0.7, acts: [['atk', 3], ['bonecrush', 1], ['roar', 1]], kind: 'deep', sz: 2.0 },
  crystalcrawler:{ name: ['晶殼蟲', 'Crystal Crawler'], model: 'pets/animal-caterpillar', tint: '#88e8ff', lv: 37, v2: true, def: 1.6, acts: [['atk', 2], ['acidspit', 1], ['laser', 1]], kind: 'crystal' },
  gildedmage:  { name: ['鍍金術士', 'Gilded Mage'], model: 'quat/Wizard', tint: '#ffd860', lv: 44, v2: true, mag: 1.6, acts: [['noonray', 1], ['starfall', 1], ['silence', 1]], kind: 'noon', undead: true, sz: 1.7 },
  sunhound:    { name: ['日輪犬', 'Sun Hound'], model: 'pets/animal-dog', tint: '#ffe080', lv: 43, v2: true, agi: 1.4, atk: 1.3, acts: [['atk', 3], ['burn', 1]], kind: 'noon' },
  voidooze:    { name: ['虛空軟泥', 'Void Ooze'], model: 'vox:slime', color: '#40206a', lv: 50, v2: true, hp: 1.4, acts: [['atk', 2], ['devour', 1], ['darkwave', 1]], kind: 'shadow' },
  nightmare:   { name: ['夢魘', 'Nightmare'], model: 'quat/Demon', tint: '#302050', lv: 53, v2: true, mag: 1.6, acts: [['mindblast', 2], ['doom', 1], ['sleep', 1]], kind: 'shadow', sz: 1.9 },
  abyssgiant:  { name: ['深淵巨人', 'Abyssal Giant'], model: 'quat/Giant', tint: '#403060', lv: 55, v2: true, hp: 1.9, atk: 1.4, agi: 0.6, acts: [['atk', 3], ['rockfall', 1], ['bonecrush', 1]], kind: 'shadow', sz: 2.3 },
  // rare finds: they hand out riches, but they run
  goldjelly:   { name: ['鍍金果凍', 'Gilded Jelly'], model: 'vox:slime', color: '#ffd040', lv: 6, hp: 0.4, def: 1.5, agi: 1.6, acts: [['atk', 2], ['flee', 1]], kind: 'plant', rare: true, goldk: 12, expk: 2 },
  silvergolem: { name: ['白銀魔像', 'Silver Golem'], model: 'vox:golem', color: '#e0e8f2', lv: 24, hp: 0.25, def: 1.8, acts: [['atk', 3], ['harden', 1], ['flee', 1]], kind: 'stone', rare: true, goldk: 6, expk: 2 },
  prismslime:  { name: ['稜晶史萊姆', 'Prism Slime'], model: 'vox:slime', color: '#ff9cff', lv: 30, hp: 0.2, def: 1.6, agi: 1.7, acts: [['atk', 1], ['starfall', 1], ['flee', 1]], kind: 'crystal', rare: true, jpk: 8, expk: 3 },
  goldcog:     { name: ['黃金齒輪仔', 'Golden Cogling'], model: 'quat/Enemy_Small', tint: '#ffd700', lv: 38, v2: true, hp: 0.18, def: 1.6, agi: 1.6, acts: [['atk', 2], ['flee', 1]], kind: 'machine', machine: true, rare: true, goldk: 10, sz: 1.0 },
  elderhare:   { name: ['長老月兔', 'Elder Moon Hare'], model: 'quat/Bunny', tint: '#efe6ff', lv: 40, v2: true, hp: 0.2, agi: 1.7, acts: [['atk', 2], ['heal', 1], ['flee', 1]], kind: 'beast', rare: true, expk: 6, jpk: 3, sz: 1.3 },
  shadowprism: { name: ['影之稜晶', 'Shadow Prism'], model: 'vox:wisp', color: '#a060ff', lv: 55, v2: true, hp: 0.15, def: 1.5, mag: 1.5, acts: [['darkwave', 1], ['atk', 1], ['flee', 1]], kind: 'shadow', rare: true, jpk: 7, expk: 3 },
  // field guardians: optional, alone, with something only they carry
  boarking:    { name: ['野豬王', 'The Boar King'], model: 'pets/animal-hog', tint: '#6a3a28', lv: 15, boss: true, field: true, hp: 5.5, atk: 1.3, acts: [['atk', 3], ['charge', 1], ['roar', 1]], kind: 'beast' },
  sandcolossus:{ name: ['砂之巨像', 'The Sand Colossus'], model: 'vox:golem', color: '#d8b070', lv: 23, boss: true, field: true, hp: 5, def: 1.4, acts: [['atk', 3], ['rockfall', 1], ['harden', 1]], kind: 'sand' },
  glacius:     { name: ['白魔 葛拉修斯', 'Glacius the White'], model: 'quat/Yeti', tint: '#d8f8ff', lv: 27, boss: true, field: true, hp: 5, acts: [['atk', 3], ['hailstone', 1], ['icestorm', 1], ['chill', 1]], kind: 'ice' },
  glutton:     { name: ['潮汐饕客', 'The Tide Glutton'], model: 'quat/Blobfish', tint: '#e080a8', lv: 34, v2: true, boss: true, field: true, hp: 5, acts: [['atk', 2], ['devour', 1], ['whirlpool', 1], ['sleep', 1]], kind: 'sea' },
  stormroc:    { name: ['雷暴巨鵬', 'The Storm Roc'], model: 'quat/Birb', tint: '#fff070', lv: 39, v2: true, boss: true, field: true, hp: 5, agi: 1.3, acts: [['atk', 2], ['thunderhead', 1], ['gust', 1], ['dive', 1]], kind: 'sky', fly: true },
  hollowwyrm:  { name: ['空洞之龍', 'The Hollow Wyrm'], model: 'quat/Dragon_Real', tint: '#8a6a40', lv: 47, v2: true, boss: true, field: true, hp: 6, acts: [['atk', 2], ['rockfall', 1], ['firestorm', 1], ['roar', 1]], kind: 'dragon' },
  nameless:    { name: ['無名騎士', 'The Nameless Knight'], model: 'kaykit/Skeleton_Warrior', tint: '#2a2a3a', lv: 60, v2: true, boss: true, field: true, hp: 7, atk: 1.2, acts: [['atk', 3], ['iai2', 1], ['darkwave', 1], ['drain', 1]], kind: 'shadow', undead: true },
};
Object.assign(MONSTERS, bilingual(M3, ['name']));
extendAffinity(Object.fromEntries(Object.entries(M3).map(([k, v]) => [k, v.kind])), {});
// what a field guardian says when you walk up to it
export const FIELD_LINES = bilingual({
  boarking: { name: ['野豬王', 'The Boar King'], line: ['（地面在震動。一頭大得不像話的野豬，用鼻子噴著氣瞪著你們。）', '(The ground shakes. An absurdly large boar snorts and glares at you.)'] },
  sandcolossus: { name: ['砂之巨像', 'The Sand Colossus'], line: ['（沙子聚成了巨人的形狀。牠胸口嵌著一枚舊護符。）', '(The sand gathers into the shape of a giant. An old amulet is set in its chest.)'] },
  glacius: { name: ['白魔 葛拉修斯', 'Glacius the White'], line: ['（霜原的傳說：白色的魔物，牙比冰還冷。）', '(A Rimefield legend: a white beast with fangs colder than ice.)'] },
  glutton: { name: ['潮汐饕客', 'The Tide Glutton'], line: ['（牠肚子裡好像有什麼在發光。……牠也盯上了你們的便當。）', '(Something glows inside its belly. ...It has its eye on your lunch, too.)'] },
  stormroc: { name: ['雷暴巨鵬', 'The Storm Roc'], line: ['（閃電在翅膀之間跳動。雲上的人說，牠守著一把會打雷的槍。）', '(Lightning leaps between its wings. Cloud folk say it guards a gun that thunders.)'] },
  hollowwyrm: { name: ['空洞之龍', 'The Hollow Wyrm'], line: ['（地底最深的洞裡，一條沒有名字的龍睜開了眼睛。）', '(In the deepest hollow, a nameless dragon opens its eyes.)'] },
  nameless: { name: ['無名騎士', 'The Nameless Knight'], line: ['（「……我忘了自己守著什麼。只記得，不能讓任何人過去。」）', '("...I have forgotten what I guard. Only that no one may pass.")'] },
}, ['name', 'line']);

// ---------- drops: a common one, a rare one, and what a thief can lift ----------
// "id common chance rare chance steal"
const DROP_TXT = `
slime slimegel .5 ether .08 potion|bunny meat .4 fluff .15 potion|chick egg .4 feather .1 potion|hog meat .5 toughhide .12 potion
caterpillar venomsac .3 resin .12 antidote|monkey beastfang .3 thiefglove .03 ether|orc beastfang .4 powerring .02 hipotion|bluejelly slimegel .5 ether .15 ether
crab scale .4 pearl .06 antidote|fish scale .4 carp .2 potion|parrot feather .4 goggles .04 eyedrops|wisp ecto .3 ether .15 ether
ghost ecto .4 soulgem .08 eyedrops|lion beastfang .4 hipotion .1 potion|scorpion venomsac .4 emerald .03 antidote|tiger pelt .35 tigerclaw .05 hipotion
skeleton ecto .2 soulgem .08 potion|skelmage ecto .3 silverstaff .04 ether|skelrogue ecto .3 shadowshard .05 hipotion|minion ecto .25 soulgem .05 potion
golem copperore .4 silverore .1 potion|zombie venomsac .3 soulgem .08 antidote|yeti pelt .4 frostcore .08 hipotion|vampire ecto .4 soulgem .15 ether
crysgolem crystaldust .4 starshard .1 hipotion|bogslime slimegel .5 venomsac .15 antidote|sporeling sporecap .5 resin .1 eyedrops|sporetreant sporecap .4 resin .15 potion
ruinguard copperore .4 silverore .12 hipotion|frostjelly slimegel .4 frostcore .1 ether|icewisp ecto .3 frostcore .12 ether|magmaslime slimegel .4 embercore .1 burnsalve
emberwisp ecto .3 embercore .15 ether|magmagolem silverore .3 embercore .15 hipotion
treant resin 1 elixir .3 ether|mesaking copperore 1 goldore .5 hipotion|frostwyrm frostcore 1 dragonscale .5 hiether|bogkeeper soulgem 1 phoenix .5 ether
sporelord sporecap 1 elixir .3 remedy|fallenknight soulgem 1 silverore .6 hipotion|emberdrake embercore 1 dragonscale .5 hiether|prismheart starshard 1 megalixir .5 elixir
dewdrop slimegel .3 fluff .1 potion|nightshade ecto .25 soulgem .1 ether|woodogre meat .4 powerring .03 hipotion|bogfrog slimegel .3 venomsac .15 antidote
piranha scale .3 pearl .05 potion|mushnub sporecap .4 resin .1 eyedrops|cactoro toughhide .3 resin .12 potion|ruingoblin beastfang .3 thiefglove .04 hipotion
ridgeogre toughhide .35 frostcore .08 hipotion|rimeyeti meat .4 snowcoat .05 hipotion|emberimp ecto .3 embercore .12 ether|spiredemon shadowshard .2 starshard .08 hiether
glubfin coral .3 pearl .08 hipotion|gloomfish scale .3 pearl .08 ether|ironcatfish scale .5 silverore .15 hipotion|squidling coral .3 goggles .04 eyedrops
razorfin scale .3 pearl .06 hipotion|coraltoad slimegel .4 remedy .1 antidote|coralcrab coral .5 pearl .1 hipotion|mongoose meat .4 thiefglove .03 hipotion
reefmask coral .4 silencecharm .04 echoherb|coraljelly slimegel .5 hiether .06 ether|kraken coraltrident 1 megalixir .3 hiether|krakenarm coral .3 scale .2 hipotion
galebirb feather .5 stormcore .06 hipotion|skywasp feather .3 stormcore .05 antidote|cloudalpaca feather .4 hiether .08 cloudberry|whirlwisp feather .3 stormcore .1 ether
skystone silverore .3 mythril .05 hipotion|wyvernling dragonscale .2 windring .04 hipotion|tempest windlance 1 skyblade .3 hiether
drownedwraith ecto .4 soulgem .1 echoherb|tidespecter ecto .4 pearl .08 hiether|drownedguard coral .4 soulgem .1 hipotion|coralskel coral .5 soulgem .08 holywater
abyssglub scale .4 pearl .1 hiether|inkhorror ecto .3 shadowshard .06 eyedrops|morwen tidering 1 megalixir .4 hiether
cogling cog .5 stormcore .06 hipotion|gearmech cog .5 silverore .15 xpotion|steamgolem cog .6 embercore .1 xpotion|geardrone cog .4 stormcore .1 hiether
brassgiant silverore .4 goldore .1 xpotion|colossus gearhammer 1 goldore .6 xpotion|varek aethergun 1 megalixir .5 elixir
raptor meat .5 dinobone .15 xpotion|behemoth dinobone .4 mythril .08 xpotion|crusher dinobone .4 mythril .08 xpotion|glowshroom sporecap .5 hiether .08 glowmoss
spikecap sporecap .5 remedy .1 antidote|thornblob slimegel .5 resin .15 remedy|cavefrog slimegel .4 hiether .06 echoherb|dinoling meat .5 dinobone .1 xpotion
moonhare egg .4 elixir .03 egg|fungallord sporecap .8 elixir .1 remedy|tyrant titanmaul 1 megalixir .4 xpotion
courtier sunshard .3 soulgem .15 hiether|sunknight sunshard .3 goldore .1 xpotion|gildedsentinel goldore .5 adamant .05 xpotion|solarwisp sunshard .4 starshard .1 hiether
aurel noonregalia 1 megalixir .5 elixir|abyssfiend shadowshard .4 voidcore .1 xpotion|voiddrake dragonscale .5 voidcore .12 elixir|voidspecter ecto .5 voidcore .1 hiether
obsidiangolem adamant .4 voidcore .08 xpotion|umbralogre shadowshard .5 voidcore .12 xpotion|echomask shadowshard .4 darkward .03 hiether|voidwalker adamant .3 voidcore .15 elixir
echodrake dragonfists 1 megalixir .3 elixir|echowyrm starbow 1 megalixir .3 elixir|echoknight duskblade 1 duskarmor .2 elixir|umbra prismedge 1 voidmail .3 megalixir
champion assassinblade 1 hermes .2 elixir
puffcap fluff .4 woolvest .06 potion|thornwolf pelt .4 venomfang .05 potion|leafsprite resin .3 ether .1 ether|mossgolem copperore .4 resin .12 potion
shellgull feather .4 gullbow .05 eyedrops|hermitcrab scale .4 shellmail .05 antidote|lilyfrog slimegel .4 trout .1 antidote|lakeglub scale .3 pearl .06 ether
mirehand venomsac .4 mirehammer .05 antidote|fenwisp ecto .4 soulgem .1 ether|sporebrute sporecap .5 dreamrod .05 eyedrops|bloomslime slimegel .4 remedy .08 potion
dusthog meat .5 toughhide .15 potion|bigcactoro toughhide .4 resin .15 hipotion|redhawk feather .5 sunspear .05 eyedrops|cinderhound pelt .4 cinderfists .05 burnsalve
lavafiend embercore .3 emberplate .05 ether|lumeranshade ecto .4 ghostrobe .05 echoherb|hollowarmor silverore .3 bonebreaker .05 hipotion|ruinprowler pelt .3 thiefglove .06 hipotion
cragbull meat .5 powerring .03 hipotion|cragroc feather .5 stormcore .06 eyedrops|snowpuff fluff .4 frostcore .1 ether|rimegolem silverore .3 frostcore .15 hipotion
prismmote crystaldust .4 starshard .1 ether|crystalknight crystaldust .4 prismbow .05 hipotion
coralglub coral .4 pearl .12 hiether|reefbrute toughhide .4 thiefglove .05 hipotion|angler scale .4 pearl .15 hiether|volteel scale .4 stormcore .1 hipotion
stormbirb feather .5 stormcore .15 hipotion|cloudpuff fluff .5 skyrobe .03 cloudberry|cloudstrider meat .4 hiether .08 hipotion
tickbomb cog .5 gearplate .04 hipotion|brasssentry cog .5 tickblade .05 hiether|fernstalker meat .5 dinobone .15 xpotion|sparkdino dinobone .3 stormcore .12 hipotion
sirenshade ecto .4 pearlrobe .05 echoherb|pearlcrab pearl .5 pearlrod .05 hiether|cavetroll toughhide .5 trollclub .05 xpotion|crystalcrawler crystaldust .5 starshard .12 remedy
gildedmage sunshard .4 sunbow .04 hiether|sunhound pelt .4 sunshard .15 xpotion|voidooze slimegel .5 voidcore .12 xpotion|nightmare voidcore .3 voidcloak .05 hiether
abyssgiant adamant .3 angelring .02 xpotion
goldjelly goldore .6 clover .15 goldore|silvergolem silverore .8 mythril .3 silverore|prismslime crystaldust .6 jpcharm .15 crystaldust|goldcog goldore .6 goldcharm .12 goldore
elderhare egg .9 expcharm .12 elixir|shadowprism voidcore .6 ribbon .08 megalixir
boarking wildheart 1 elixir .4 hipotion|sandcolossus sandamulet 1 goldore .6 hipotion|glacius frostfang 1 frostcore .8 hiether|glutton tidepearl 1 pearl .8 hiether
stormroc stormgun 1 stormplume .5 xpotion|hollowwyrm wyrmfang 1 dragonscale .8 elixir|nameless voidlance 1 megalixir .6 elixir`;
export const DROPS = {};
for (const e of DROP_TXT.split(/[|\n]/).map((s) => s.trim()).filter(Boolean)) { const [id, c, cr, r, rr, st] = e.split(/\s+/); DROPS[id] = { c: [c, +cr], r: [r, +rr], steal: st }; }

// ---------- items: new materials, gear that only drops, and forged pieces ----------
const NEW_ITEMS = {
  fluff:      { name: ['蓬鬆絨毛', 'Puff Fluff'], price: 10, mat: true, desc: ['軟綿綿的。織布用。', 'Soft as a cloud. Good for weaving.'] },
  pelt:       { name: ['狼皮', 'Wolf Pelt'], price: 22, mat: true, desc: ['厚實的毛皮。', 'A thick fur hide.'] },
  resin:      { name: ['琥珀樹脂', 'Amber Resin'], price: 18, mat: true, desc: ['樹木流出的黏稠汁液，乾了會發亮。', 'Sticky tree sap that shines when it dries.'] },
  venomsac:   { name: ['毒囊', 'Venom Sac'], price: 16, mat: true, desc: ['小心別捏破。', 'Do not squeeze it.'] },
  pearl:      { name: ['海珍珠', 'Sea Pearl'], price: 60, mat: true, desc: ['圓潤的珍珠。很值錢。', 'A round, lustrous pearl. Worth a lot.'] },
  embercore:  { name: ['餘燼核', 'Ember Core'], price: 48, mat: true, desc: ['還帶著熱度的紅色核心。', 'A red core, still warm.'] },
  frostcore:  { name: ['寒霜核', 'Frost Core'], price: 48, mat: true, desc: ['摸了會凍傷手指的核心。', 'A core cold enough to numb your fingers.'] },
  stormcore:  { name: ['雷暴核', 'Storm Core'], price: 56, mat: true, desc: ['裡面劈啪作響。', 'It crackles inside.'] },
  soulgem:    { name: ['魂石', 'Soul Gem'], price: 44, mat: true, desc: ['不死者留下的、微微發光的石頭。', 'A faintly glowing stone the undead leave behind.'] },
  starshard:  { name: ['星之碎片', 'Star Fragment'], price: 80, mat: true, desc: ['水晶魔物體內的碎星。', 'A sliver of star from inside crystal monsters.'] },
  voidcore:   { name: ['虛空核', 'Void Core'], price: 150, mat: true, desc: ['看著它，會覺得自己被看著。', 'Look at it and you feel it looking back.'] },
  // weapons that only drop
  venomfang:  { name: ['毒牙匕首', 'Venom Fang'], price: 200, slot: 'weapon', kind: 'dagger', atk: 15, agi: 2, onhit: 'poison', drop: true },
  gullbow:    { name: ['海鷗弓', 'Gull Bow'], price: 260, slot: 'weapon', kind: 'bow', atk: 18, agi: 2, el: 'wind', drop: true },
  mirehammer: { name: ['泥沼鎚', 'Mire Hammer'], price: 300, slot: 'weapon', kind: 'hammer', atk: 20, onhit: 'blind', drop: true },
  dreamrod:   { name: ['夢之杖', 'Dream Rod'], price: 320, slot: 'weapon', kind: 'staff', atk: 4, mag: 14, onhit: 'sleep', drop: true },
  sunspear:   { name: ['赤日槍', 'Sun Spear'], price: 360, slot: 'weapon', kind: 'spear', atk: 24, el: 'fire', drop: true },
  bonebreaker:{ name: ['碎骨鎚', 'Bonebreaker'], price: 420, slot: 'weapon', kind: 'hammer', atk: 27, onhit: 'stun', drop: true },
  frostfang:  { name: ['霜牙', 'Frost Fang'], price: 500, slot: 'weapon', kind: 'dagger', atk: 30, agi: 5, el: 'ice', drop: true },
  cinderfists:{ name: ['餘燼拳套', 'Cinder Fists'], price: 480, slot: 'weapon', kind: 'fist', atk: 32, el: 'fire', onhit: 'burn', drop: true },
  prismbow:   { name: ['稜光弓', 'Prism Bow'], price: 520, slot: 'weapon', kind: 'bow', atk: 34, spr: 4, el: 'holy', drop: true },
  pearlrod:   { name: ['珍珠杖', 'Pearl Rod'], price: 600, slot: 'weapon', kind: 'staff', atk: 8, mag: 22, spr: 4, el: 'water', drop: true },
  stormgun:   { name: ['雷暴手砲', 'Storm Gun'], price: 700, slot: 'weapon', kind: 'gun', atk: 40, el: 'bolt', onhit: 'stun', drop: true },
  tickblade:  { name: ['秒針劍', 'Tick Blade'], price: 760, slot: 'weapon', kind: 'sword', atk: 40, agi: 4, first: true, drop: true },
  trollclub:  { name: ['巨魔棍', 'Troll Club'], price: 800, slot: 'weapon', kind: 'hammer', atk: 46, str: 4, drop: true },
  sunbow:     { name: ['日輪弓', 'Sun Bow'], price: 900, slot: 'weapon', kind: 'bow', atk: 48, el: 'holy', onhit: 'blind', drop: true },
  wyrmfang:   { name: ['龍牙拳', 'Wyrm Fang'], price: 1000, slot: 'weapon', kind: 'fist', atk: 52, str: 4, el: 'earth', drop: true },
  voidlance:  { name: ['虛空槍', 'Void Lance'], price: 1400, slot: 'weapon', kind: 'spear', atk: 60, el: 'dark', drain: true, drop: true },
  // armour that only drops
  woolvest:   { name: ['羊毛背心', 'Wool Vest'], price: 80, slot: 'armor', def: 7, spr: 2, drop: true },
  shellmail:  { name: ['貝殼甲', 'Shell Mail'], price: 300, slot: 'armor', def: 18, res: ['water'], drop: true },
  ghostrobe:  { name: ['幽靈法衣', 'Ghost Robe'], price: 400, slot: 'armor', def: 20, mag: 6, immune: ['silence'], drop: true },
  emberplate: { name: ['熔岩鎧', 'Ember Plate'], price: 520, slot: 'armor', def: 30, res: ['fire'], drop: true },
  pearlrobe:  { name: ['珍珠法衣', 'Pearl Robe'], price: 640, slot: 'armor', def: 26, spr: 8, mag: 4, res: ['water'], drop: true },
  gearplate:  { name: ['齒輪鎧', 'Gear Plate'], price: 700, slot: 'armor', def: 38, res: ['bolt'], drop: true },
  voidcloak:  { name: ['虛空斗篷', 'Void Cloak'], price: 1200, slot: 'armor', def: 48, mag: 8, res: ['dark'], immune: ['doom'], drop: true },
  // charms that only drop
  clover:     { name: ['四葉草', 'Four-leaf Clover'], price: 300, slot: 'acc', agi: 2, luck: true, drop: true },
  thiefglove: { name: ['盜賊手套', "Thief's Glove"], price: 400, slot: 'acc', agi: 3, stealUp: true, drop: true },
  wildheart:  { name: ['野性之心', 'Wild Heart'], price: 500, slot: 'acc', str: 6, counter: true, drop: true },
  sandamulet: { name: ['砂之護符', 'Sand Amulet'], price: 500, slot: 'acc', def: 6, res: ['earth'], immune: ['blind'], drop: true },
  tidepearl:  { name: ['潮汐珠', 'Tide Pearl'], price: 800, slot: 'acc', spr: 6, res: ['water'], regen: true, drop: true },
  stormplume: { name: ['雷暴羽飾', 'Storm Plume'], price: 900, slot: 'acc', agi: 6, res: ['bolt'], first: true, drop: true },
  jpcharm:    { name: ['晶光護符', 'Crystal Charm'], price: 1000, slot: 'acc', jpUp: true, drop: true },
  // pieces the smiths can make from the new materials
  wolfcoat:   { name: ['狼皮大衣', 'Wolf Coat'], price: 0, slot: 'armor', def: 13, agi: 3 },
  soulring:   { name: ['魂之戒', 'Soul Ring'], price: 0, slot: 'acc', spr: 4, mpregen: true },
  emberband:  { name: ['餘燼手環', 'Ember Band'], price: 0, slot: 'acc', str: 4, mag: 4, res: ['fire'] },
  frostband:  { name: ['寒霜手環', 'Frost Band'], price: 0, slot: 'acc', spr: 4, res: ['ice'], immune: ['freeze'] },
  stormband:  { name: ['雷暴手環', 'Storm Band'], price: 0, slot: 'acc', agi: 4, res: ['bolt'] },
  pearlbrooch:{ name: ['珍珠胸針', 'Pearl Brooch'], price: 0, slot: 'acc', spr: 6, immune: ['burn', 'freeze'] },
  starcharm:  { name: ['星之護符', 'Star Charm'], price: 0, slot: 'acc', mag: 6, spr: 8, immune: ['doom'] },
  resinbow:   { name: ['琥珀弓', 'Amber Bow'], price: 0, slot: 'weapon', kind: 'bow', atk: 30, el: 'earth' },
  trollhide:  { name: ['巨魔皮甲', 'Troll Hide'], price: 0, slot: 'armor', def: 44, res: ['earth'] },
  voidedge:   { name: ['虛空之刃', 'Void Edge'], price: 0, slot: 'weapon', kind: 'sword', atk: 58, mag: 6, el: 'dark' },
};
Object.assign(ITEMS, bilingual(NEW_ITEMS));
FORGE.push(
  ['wolfcoat', [['pelt', 3], ['toughhide', 1]], 300], ['resinbow', [['resin', 3], ['feather', 2]], 600], ['soulring', [['soulgem', 3], ['silverore', 1]], 700],
  ['emberband', [['embercore', 2], ['goldore', 1]], 800], ['frostband', [['frostcore', 2], ['silverore', 1]], 700], ['stormband', [['stormcore', 2], ['silverore', 1]], 700],
  ['pearlbrooch', [['pearl', 3], ['silverore', 1]], 900], ['starcharm', [['starshard', 3], ['goldore', 1]], 1500], ['trollhide', [['toughhide', 4], ['mythril', 2]], 1400],
  ['voidedge', [['voidcore', 3], ['adamant', 2]], 3400],
);

// ---------- where the new monsters live (merged into the world's spawn lists) ----------
export const SPAWN3 = {
  meadow: ['puffcap'], forest: ['thornwolf', 'leafsprite', 'mossgolem'], coast: ['shellgull', 'hermitcrab'], lake: ['lilyfrog', 'lakeglub'], mistfen: ['mirehand', 'fenwisp'],
  sporewood: ['sporebrute', 'bloomslime'], mesa: ['dusthog', 'bigcactoro', 'redhawk'], ember: ['cinderhound', 'lavafiend'], ruins: ['lumeranshade', 'hollowarmor', 'ruinprowler'],
  mountain: ['cragbull', 'cragroc'], rimefield: ['snowpuff', 'rimegolem'], spire: ['prismmote', 'crystalknight'],
  coral: ['coralglub', 'reefbrute'], eastsea: ['angler', 'volteel'], cloud: ['stormbirb', 'cloudpuff', 'cloudstrider'], clock: ['tickbomb'], clocktower: ['tickbomb', 'brasssentry'],
  deepholm: ['fernstalker', 'sparkdino'], vael: ['sirenshade', 'pearlcrab'], deep: ['cavetroll', 'crystalcrawler'], noonhall: ['gildedmage', 'sunhound'], abyss: ['voidooze', 'nightmare', 'abyssgiant'],
};
// the rare find of each place
export const RARE_AT = { meadow: 'goldjelly', mountain: 'silvergolem', spire: 'prismslime', clocktower: 'goldcog', deepholm: 'elderhare', abyss: 'shadowprism' };
// where each field guardian waits
export const FIELD_AT = { boarking: 'forest', sandcolossus: 'mesa', glacius: 'rimefield', glutton: 'coral', stormroc: 'cloud', hollowwyrm: 'deep', nameless: 'abyss' };
void JOBS;
