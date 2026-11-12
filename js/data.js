// 晶境漫遊 Prismwander: jobs, abilities, monsters, items and gear. Every name is [中文, English].
// Monster strength is fixed by where they live and never scales with the party.
import { bilingual } from './i18n.js';

// the four travellers; model is a Kenney blocky character
export const HEROES = {
  lowe:  { name: ['洛', 'Lowe'], model: 'kaykit/Knight', job: 'fencer', base: { hp: 52, mp: 10, str: 11, def: 9, mag: 6, spr: 7, agi: 9 } },
  flora: { name: ['芙蘿', 'Flora'], model: 'kaykit/Mage', job: 'mage', base: { hp: 40, mp: 22, str: 6, def: 6, mag: 13, spr: 10, agi: 9 } },
  bal:   { name: ['巴爾', 'Bal'], model: 'kaykit/Barbarian', job: 'cleric', base: { hp: 48, mp: 18, str: 8, def: 8, mag: 9, spr: 13, agi: 7 } },
  shia:  { name: ['希雅', 'Shia'], model: 'kaykit/Rogue_Hooded', job: 'rogue', base: { hp: 44, mp: 12, str: 9, def: 7, mag: 7, spr: 7, agi: 14 } },
};
bilingual(HEROES, ['name']);

// stat multipliers in percent, weapons each can hold, and abilities by job level
export const JOBS = {
  fencer:   { name: ['劍士', 'Fencer'], desc: ['擅長用劍的前衛。', 'A front-liner who lives by the sword.'], st: { hp: 110, mp: 70, str: 115, def: 105, mag: 70, spr: 80, agi: 100 }, wep: ['sword'], learn: [[1, 'powerslash'], [2, 'guardup'], [3, 'powerbreak'], [4, 'twinslash'], [6, 'counter'], [9, 'crossblade']] },
  mage:     { name: ['魔導士', 'Mage'], desc: ['操控火、冰、雷的術士。', 'A caster of fire, ice and lightning.'], st: { hp: 80, mp: 130, str: 70, def: 80, mag: 125, spr: 105, agi: 95 }, wep: ['staff'], learn: [[1, 'fire'], [1, 'ice'], [2, 'aqua'], [3, 'thunder'], [4, 'bolt1'], [6, 'fira'], [9, 'meteorite']] },
  cleric:   { name: ['祭司', 'Cleric'], desc: ['治療與守護的專家。', 'A healer and protector.'], st: { hp: 95, mp: 120, str: 80, def: 90, mag: 95, spr: 125, agi: 90 }, wep: ['staff', 'hammer'], learn: [[1, 'heal'], [2, 'cure'], [3, 'holy'], [4, 'healall'], [6, 'revive'], [8, 'barrier']] },
  rogue:    { name: ['盜賊', 'Rogue'], desc: ['敏捷，會偷東西和施毒。', 'Quick hands for stealing and poison.'], st: { hp: 90, mp: 80, str: 100, def: 85, mag: 80, spr: 85, agi: 130 }, wep: ['dagger'], learn: [[1, 'steal'], [2, 'venom'], [3, 'sandtoss'], [4, 'flee'], [6, 'doublestab'], [9, 'shadowstep']] },
  guardian: { name: ['守衛', 'Guardian'], desc: ['用身體替夥伴擋下攻擊。', 'Takes the hits so friends do not.'], st: { hp: 135, mp: 65, str: 105, def: 135, mag: 60, spr: 95, agi: 75 }, wep: ['sword', 'hammer'], learn: [[1, 'provoke'], [2, 'ironwall'], [4, 'shieldbash'], [6, 'cover'], [9, 'fortress']] },
  ranger:   { name: ['弓手', 'Ranger'], desc: ['從遠處瞄準弱點。', 'Aims for weak spots from afar.'], st: { hp: 95, mp: 85, str: 110, def: 90, mag: 80, spr: 90, agi: 115 }, wep: ['bow'], learn: [[1, 'aim'], [2, 'arrowrain'], [4, 'sleepshot'], [6, 'piercing'], [9, 'starshot']] },
  monk:     { name: ['武僧', 'Monk'], desc: ['空手的格鬥家，越戰越勇。', 'An unarmed fighter who grows stronger mid-fight.'], st: { hp: 125, mp: 70, str: 120, def: 95, mag: 65, spr: 100, agi: 110 }, wep: ['fist'], learn: [[1, 'chakra'], [2, 'roundkick'], [4, 'focus'], [6, 'thousandfists'], [9, 'innerpeace']] },
  bard:     { name: ['吟遊詩人', 'Bard'], desc: ['用歌聲鼓舞全隊。', 'Sings the whole party into shape.'], st: { hp: 90, mp: 110, str: 80, def: 85, mag: 100, spr: 110, agi: 105 }, wep: ['bow', 'dagger'], learn: [[1, 'warsong'], [2, 'lullaby'], [4, 'ballad'], [6, 'swiftsong'], [9, 'requiem']] },
  chrono:   { name: ['時術師', 'Chronomancer'], desc: ['讓時間變快或變慢。', 'Speeds time up or slows it down.'], st: { hp: 85, mp: 125, str: 70, def: 80, mag: 115, spr: 115, agi: 110 }, wep: ['staff'], learn: [[1, 'haste'], [2, 'slow'], [4, 'gravity'], [6, 'hasteall'], [9, 'stop']] },
  alchemist:{ name: ['鍊金術士', 'Alchemist'], desc: ['道具效果加倍，還會丟炸彈。', 'Doubles item effects and throws bombs.'], st: { hp: 100, mp: 95, str: 90, def: 95, mag: 110, spr: 100, agi: 95 }, wep: ['hammer', 'dagger'], learn: [[1, 'bomb'], [2, 'pharmacy'], [4, 'acid'], [6, 'elixirmix'], [9, 'megabomb']] },
  astro:    { name: ['星術師', 'Astromancer'], desc: ['借用星星的力量。', 'Borrows power from the stars.'], st: { hp: 85, mp: 140, str: 65, def: 80, mag: 135, spr: 120, agi: 95 }, wep: ['staff'], learn: [[1, 'starlight'], [3, 'comet'], [5, 'stardust'], [8, 'supernova']] },
  scholar:  { name: ['學者', 'Scholar'], desc: ['看穿敵人的弱點，用對的屬性打。', 'Reads a foe\'s weaknesses and strikes with the right element.'], st: { hp: 85, mp: 125, str: 70, def: 85, mag: 115, spr: 115, agi: 100 }, wep: ['staff', 'dagger'], learn: [[1, 'scan'], [2, 'elemental'], [3, 'meditate'], [5, 'mpthrift'], [8, 'omniscience']] },
  paladin:  { name: ['聖騎士', 'Paladin'], desc: ['以聖光守護夥伴，對不死者特別強。', 'Guards friends with holy light; deadly to the undead.'], st: { hp: 125, mp: 90, str: 110, def: 125, mag: 85, spr: 115, agi: 80 }, wep: ['sword', 'hammer'], learn: [[1, 'holyblade'], [2, 'regen'], [4, 'cover'], [6, 'sentinel'], [9, 'judgment']] },
  samurai:  { name: ['武士', 'Samurai'], desc: ['蓄力、破甲，一刀定勝負。', 'Charges up, breaks armour, and ends it in one stroke.'], st: { hp: 110, mp: 70, str: 130, def: 95, mag: 60, spr: 85, agi: 105 }, wep: ['sword'], learn: [[1, 'iai'], [2, 'charge'], [3, 'armorbreak'], [5, 'flashcut'], [8, 'bushido']] },
  druid:    { name: ['德魯伊', 'Druid'], desc: ['借大地之力：讓敵人看不見，讓夥伴慢慢回復。', 'Draws on the earth: blinds foes and slowly mends friends.'], st: { hp: 100, mp: 115, str: 85, def: 90, mag: 110, spr: 120, agi: 95 }, wep: ['staff', 'fist'], learn: [[1, 'thorn'], [2, 'regen'], [3, 'mist'], [6, 'quake2'], [8, 'lifebloom']] },
  dancer:   { name: ['劍舞者', 'Bladedancer'], desc: ['舞步與劍光合而為一。', 'Where dance steps and sword strokes become one.'], st: { hp: 105, mp: 90, str: 120, def: 90, mag: 90, spr: 95, agi: 135 }, wep: ['sword', 'dagger'], learn: [[1, 'flurry'], [3, 'sworddance'], [5, 'mirage'], [8, 'finale']] },
};
bilingual(JOBS);
export const START_JOBS = ['fencer', 'mage', 'cleric', 'rogue'];
export const jpFor = (jl) => 20 + (jl - 1) * 30 + (jl - 1) * (jl - 1) * 6;

// type: phys (power is a multiplier), magic (power + mag), heal, buff, status, special
export const ABILITIES = {
  powerslash: { name: ['強力斬', 'Power Slash'], mp: 3, type: 'phys', power: 1.6, target: 'enemy' },
  guardup:    { name: ['架式', 'Stance'], mp: 3, type: 'buff', stat: 'def', target: 'self' },
  twinslash:  { name: ['二連斬', 'Twin Slash'], mp: 6, type: 'phys', power: 0.9, hits: 2, target: 'enemy' },
  counter:    { name: ['反擊（被動）', 'Counter (passive)'], passive: true },
  crossblade: { name: ['十字劍', 'Cross Blade'], mp: 14, type: 'phys', power: 2.6, target: 'enemy' },
  fire:       { name: ['火焰', 'Fire'], mp: 4, type: 'magic', power: 20, el: 'fire', target: 'enemy' },
  ice:        { name: ['冰錐', 'Ice'], mp: 4, type: 'magic', power: 20, el: 'ice', target: 'enemy' },
  thunder:    { name: ['落雷', 'Thunder'], mp: 7, type: 'magic', power: 18, el: 'bolt', target: 'enemies' },
  fira:       { name: ['烈焰', 'Inferno'], mp: 14, type: 'magic', power: 48, el: 'fire', target: 'enemy' },
  meteorite:  { name: ['隕石雨', 'Meteor Shower'], mp: 26, type: 'magic', power: 52, el: 'none', target: 'enemies' },
  heal:       { name: ['治癒', 'Heal'], mp: 4, type: 'heal', power: 30, target: 'ally' },
  cure:       { name: ['淨化', 'Purify'], mp: 3, type: 'cure', target: 'ally' },
  healall:    { name: ['群體治癒', 'Heal All'], mp: 11, type: 'heal', power: 24, target: 'allies' },
  revive:     { name: ['復活', 'Revive'], mp: 16, type: 'revive', target: 'dead' },
  barrier:    { name: ['守護結界', 'Barrier'], mp: 10, type: 'buff', stat: 'def', target: 'allies' },
  steal:      { name: ['偷竊', 'Steal'], mp: 0, type: 'steal', target: 'enemy' },
  venom:      { name: ['毒刃', 'Venom Edge'], mp: 4, type: 'phys', power: 1.0, status: 'poison', target: 'enemy' },
  flee:       { name: ['煙幕', 'Smoke Screen'], mp: 2, type: 'flee', target: 'none' },
  doublestab: { name: ['連刺', 'Double Stab'], mp: 7, type: 'phys', power: 0.85, hits: 3, target: 'enemy' },
  shadowstep: { name: ['影步', 'Shadow Step'], mp: 12, type: 'phys', power: 2.2, sure: true, target: 'enemy' },
  provoke:    { name: ['挑釁', 'Provoke'], mp: 2, type: 'taunt', target: 'self' },
  ironwall:   { name: ['鐵壁', 'Iron Wall'], mp: 5, type: 'buff', stat: 'def', big: true, target: 'self' },
  shieldbash: { name: ['盾擊', 'Shield Bash'], mp: 6, type: 'phys', power: 1.2, status: 'stun', target: 'enemy' },
  cover:      { name: ['掩護（被動）', 'Cover (passive)'], passive: true },
  fortress:   { name: ['堡壘', 'Fortress'], mp: 16, type: 'buff', stat: 'def', big: true, target: 'allies' },
  aim:        { name: ['瞄準', 'Aim'], mp: 3, type: 'phys', power: 1.5, sure: true, target: 'enemy' },
  arrowrain:  { name: ['箭雨', 'Arrow Rain'], mp: 8, type: 'phys', power: 0.8, target: 'enemies' },
  sleepshot:  { name: ['催眠箭', 'Sleep Shot'], mp: 5, type: 'phys', power: 0.6, status: 'sleep', target: 'enemy' },
  piercing:   { name: ['貫穿箭', 'Piercing Shot'], mp: 10, type: 'phys', power: 2.0, ignoreDef: true, target: 'enemy' },
  starshot:   { name: ['流星箭', 'Shooting Star'], mp: 18, type: 'phys', power: 1.4, target: 'enemies' },
  chakra:     { name: ['氣功', 'Chakra'], mp: 3, type: 'heal', power: 40, target: 'self' },
  roundkick:  { name: ['迴旋踢', 'Round Kick'], mp: 6, type: 'phys', power: 0.9, target: 'enemies' },
  focus:      { name: ['集中', 'Focus'], mp: 4, type: 'buff', stat: 'str', target: 'self' },
  thousandfists: { name: ['百裂拳', 'Thousand Fists'], mp: 14, type: 'phys', power: 0.7, hits: 5, target: 'enemy' },
  innerpeace: { name: ['心如止水（被動）', 'Inner Peace (passive)'], passive: true },
  warsong:    { name: ['戰歌', 'War Song'], mp: 6, type: 'buff', stat: 'str', target: 'allies' },
  lullaby:    { name: ['搖籃曲', 'Lullaby'], mp: 6, type: 'status', status: 'sleep', target: 'enemies' },
  ballad:     { name: ['安魂詩', 'Soothing Ballad'], mp: 9, type: 'heal', power: 20, target: 'allies' },
  swiftsong:  { name: ['疾風曲', 'Swift Song'], mp: 10, type: 'buff', stat: 'agi', target: 'allies' },
  requiem:    { name: ['鎮魂曲', 'Requiem'], mp: 18, type: 'magic', power: 40, el: 'holy', target: 'enemies' },
  haste:      { name: ['加速', 'Haste'], mp: 5, type: 'buff', stat: 'agi', target: 'ally' },
  slow:       { name: ['減速', 'Slow'], mp: 5, type: 'status', status: 'slow', target: 'enemy' },
  gravity:    { name: ['重力', 'Gravity'], mp: 12, type: 'gravity', target: 'enemy' },
  hasteall:   { name: ['全體加速', 'Haste All'], mp: 16, type: 'buff', stat: 'agi', target: 'allies' },
  stop:       { name: ['時間停止', 'Stop'], mp: 18, type: 'status', status: 'stun', target: 'enemies' },
  bomb:       { name: ['炸彈', 'Bomb'], mp: 4, type: 'magic', power: 24, el: 'fire', target: 'enemies' },
  pharmacy:   { name: ['藥學（被動）', 'Pharmacy (passive)'], passive: true },
  acid:       { name: ['強酸', 'Acid'], mp: 6, type: 'status', status: 'poison', target: 'enemies' },
  elixirmix:  { name: ['調配靈藥', 'Brew Elixir'], mp: 14, type: 'heal', power: 60, target: 'allies' },
  megabomb:   { name: ['超級炸彈', 'Mega Bomb'], mp: 22, type: 'magic', power: 70, el: 'fire', target: 'enemies' },
  starlight:  { name: ['星光', 'Starlight'], mp: 5, type: 'magic', power: 26, el: 'holy', target: 'enemy' },
  comet:      { name: ['彗星', 'Comet'], mp: 12, type: 'magic', power: 60, el: 'none', target: 'enemy' },
  stardust:   { name: ['星塵', 'Stardust'], mp: 16, type: 'magic', power: 40, el: 'holy', target: 'enemies' },
  supernova:  { name: ['超新星', 'Supernova'], mp: 34, type: 'magic', power: 95, el: 'none', target: 'enemies' },
  aqua:       { name: ['水流', 'Aqua'], mp: 4, type: 'magic', power: 20, el: 'water', target: 'enemy' },
  bolt1:      { name: ['電擊', 'Zap'], mp: 5, type: 'magic', power: 26, el: 'bolt', target: 'enemy' },
  holy:       { name: ['聖光', 'Holy'], mp: 8, type: 'magic', power: 34, el: 'holy', target: 'enemy' },
  powerbreak: { name: ['破力斬', 'Power Break'], mp: 5, type: 'phys', power: 0.9, debuff: 'str', target: 'enemy' },
  sandtoss:   { name: ['撒沙', 'Sand Toss'], mp: 3, type: 'status', status: 'blind', target: 'enemy' },
  scan:       { name: ['看破', 'Scan'], mp: 1, type: 'scan', target: 'enemy' },
  elemental:  { name: ['屬性解析', 'Element Strike'], mp: 7, type: 'magic', power: 30, el: 'auto', target: 'enemy' },
  meditate:   { name: ['冥想', 'Meditate'], mp: 0, type: 'meditate', target: 'self' },
  mpthrift:   { name: ['節約詠唱（被動）', 'MP Thrift (passive)'], passive: true },
  omniscience:{ name: ['全知', 'Omniscience'], mp: 24, type: 'magic', power: 56, el: 'auto', target: 'enemies' },
  holyblade:  { name: ['聖劍', 'Holy Blade'], mp: 5, type: 'phys', power: 1.4, el: 'holy', target: 'enemy' },
  regen:      { name: ['再生', 'Regen'], mp: 6, type: 'regen', target: 'ally' },
  sentinel:   { name: ['堅守', 'Sentinel'], mp: 6, type: 'sentinel', target: 'self' },
  judgment:   { name: ['審判', 'Judgment'], mp: 26, type: 'magic', power: 60, el: 'holy', target: 'enemies' },
  iai:        { name: ['居合', 'Iai'], mp: 4, type: 'phys', power: 1.35, sure: true, target: 'enemy' },
  charge:     { name: ['蓄力', 'Charge'], mp: 3, type: 'charge', target: 'self' },
  armorbreak: { name: ['破甲', 'Armour Break'], mp: 6, type: 'phys', power: 0.9, debuff: 'def', target: 'enemy' },
  flashcut:   { name: ['一閃', 'Flash Cut'], mp: 12, type: 'phys', power: 1.0, target: 'enemies' },
  bushido:    { name: ['武士道', 'Bushido'], mp: 22, type: 'phys', power: 3.4, target: 'enemy' },
  thorn:      { name: ['荊棘', 'Thorn'], mp: 4, type: 'magic', power: 22, el: 'earth', target: 'enemy' },
  mist:       { name: ['迷霧', 'Mist'], mp: 7, type: 'status', status: 'blind', target: 'enemies' },
  quake2:     { name: ['大地之怒', 'Earthwrath'], mp: 16, type: 'magic', power: 42, el: 'earth', target: 'enemies' },
  lifebloom:  { name: ['生命綻放', 'Lifebloom'], mp: 22, type: 'heal', power: 34, regen: true, target: 'allies' },
  flurry:     { name: ['亂舞', 'Flurry'], mp: 6, type: 'phys', power: 0.6, hits: 4, target: 'enemy' },
  sworddance: { name: ['劍之舞', 'Sword Dance'], mp: 10, type: 'phys', power: 1.0, target: 'enemies' },
  mirage:     { name: ['幻影', 'Mirage'], mp: 8, type: 'buff', stat: 'agi', big: true, target: 'self' },
  finale:     { name: ['終幕', 'Finale'], mp: 24, type: 'phys', power: 1.0, hits: 6, target: 'enemy' },
};
bilingual(ABILITIES, ['name']);

export const ITEMS = {
  potion:   { name: ['回復藥', 'Potion'], price: 20, use: 'heal', power: 60, target: 'ally', desc: ['回復 60 HP', 'Restores 60 HP'] },
  hipotion: { name: ['高級回復藥', 'Hi-Potion'], price: 90, use: 'heal', power: 250, target: 'ally', desc: ['回復 250 HP', 'Restores 250 HP'] },
  ether:    { name: ['以太', 'Ether'], price: 60, use: 'mp', power: 30, target: 'ally', desc: ['回復 30 MP', 'Restores 30 MP'] },
  phoenix:  { name: ['鳳凰尾羽', 'Phoenix Plume'], price: 180, use: 'revive', target: 'dead', desc: ['讓倒下的夥伴復活', 'Revives a fallen friend'] },
  antidote: { name: ['解毒劑', 'Antidote'], price: 12, use: 'cure', target: 'ally', desc: ['解除中毒', 'Cures poison'] },
  lens:     { name: ['鑑定鏡', 'Seeing Lens'], price: 30, use: 'scan', target: 'enemy', desc: ['戰鬥中看穿一隻魔物的弱點、抗性與 HP', 'In battle, reveals a monster\'s weaknesses, resistances and HP'] },
  eyedrops: { name: ['眼藥水', 'Eye Drops'], price: 15, use: 'cure', target: 'ally', desc: ['解除失明與中毒', 'Cures blindness and poison'] },
  tent:     { name: ['帳篷', 'Tent'], price: 80, use: 'tent', target: 'none', desc: ['在野外紮營，全員完全回復', 'Camp anywhere outside and fully recover'] },
  // weapons
  shortsword: { name: ['短劍', 'Short Sword'], price: 40, slot: 'weapon', kind: 'sword', atk: 6 },
  broadsword: { name: ['闊劍', 'Broadsword'], price: 260, slot: 'weapon', kind: 'sword', atk: 16 },
  crystalblade: { name: ['水晶劍', 'Crystal Blade'], price: 0, slot: 'weapon', kind: 'sword', atk: 34, mag: 6, el: 'holy' },
  rod:        { name: ['木杖', 'Wooden Rod'], price: 30, slot: 'weapon', kind: 'staff', atk: 2, mag: 4 },
  silverstaff: { name: ['銀杖', 'Silver Staff'], price: 280, slot: 'weapon', kind: 'staff', atk: 6, mag: 12 },
  prismstaff: { name: ['稜晶杖', 'Prism Staff'], price: 0, slot: 'weapon', kind: 'staff', atk: 10, mag: 24 },
  dagger:     { name: ['匕首', 'Dagger'], price: 35, slot: 'weapon', kind: 'dagger', atk: 5, agi: 2 },
  kris:       { name: ['波刃短劍', 'Kris'], price: 240, slot: 'weapon', kind: 'dagger', atk: 14, agi: 4 },
  mallet:     { name: ['木槌', 'Mallet'], price: 40, slot: 'weapon', kind: 'hammer', atk: 7 },
  warhammer:  { name: ['戰鎚', 'War Hammer'], price: 300, slot: 'weapon', kind: 'hammer', atk: 19 },
  shortbow:   { name: ['短弓', 'Short Bow'], price: 60, slot: 'weapon', kind: 'bow', atk: 7 },
  longbow:    { name: ['長弓', 'Longbow'], price: 300, slot: 'weapon', kind: 'bow', atk: 17 },
  wraps:      { name: ['拳套', 'Hand Wraps'], price: 50, slot: 'weapon', kind: 'fist', atk: 8 },
  tigerclaw:  { name: ['虎爪', 'Tiger Claws'], price: 320, slot: 'weapon', kind: 'fist', atk: 20 },
  // armour and charms
  tunic:      { name: ['布衣', 'Tunic'], price: 30, slot: 'armor', def: 3 },
  leathervest: { name: ['皮甲', 'Leather Vest'], price: 120, slot: 'armor', def: 8 },
  chainmail:  { name: ['鎖子甲', 'Chain Mail'], price: 420, slot: 'armor', def: 16 },
  prismmail:  { name: ['稜晶鎧', 'Prism Mail'], price: 0, slot: 'armor', def: 28, spr: 6, res: ['fire', 'ice', 'bolt'] },
  charm:      { name: ['幸運符', 'Lucky Charm'], price: 0, slot: 'acc', agi: 5 },
  powerring:  { name: ['力量戒指', 'Power Ring'], price: 0, slot: 'acc', str: 8 },
  sagering:   { name: ['賢者戒指', 'Sage Ring'], price: 0, slot: 'acc', mag: 8 },
  guardring:  { name: ['守護戒指', 'Guard Ring'], price: 0, slot: 'acc', def: 8 },
  // things that change how you can move
  boots:      { name: ['彈跳靴', 'Spring Boots'], key: true, desc: ['跳得比以前高一格。', 'Jump one block higher than before.'] },
  cape:       { name: ['滑翔斗篷', 'Glide Cape'], key: true, desc: ['在空中按住跳躍可以慢慢滑翔。', 'Hold jump in the air to glide down slowly.'] },
  compass:    { name: ['晶石羅盤', 'Crystal Compass'], key: true, desc: ['小地圖上會顯示最近的水晶。', 'Shows the nearest crystal on the minimap.'] },
  fishrod:    { name: ['釣竿', 'Fishing Rod'], key: true, desc: ['在有魚影的水邊按 E 釣魚。', 'Press E by water where fish are rippling to fish.'] },
  letter:     { name: ['給姊姊的信', 'Letter for a Sister'], key: true, desc: ['爐心村的小孩託你帶給在鹽灣港工作的姊姊。', 'A Hearthvale child asked you to take this to their sister in Saltmere.'] },
  moonherb:   { name: ['月光草', 'Moonherb'], quest: true, desc: ['霧沼裡發著淡光的藥草。芬邊村的藥師在找它。', 'A faintly glowing herb from the Mistfen. The Fenside healer wants it.'] },
  glowcap:    { name: ['螢光菇', 'Glowcap'], quest: true, desc: ['孢子林裡的發光小菇。隱士想要它。', 'A little glowing mushroom from Sporewood. The hermit wants it.'] },
  // fish: eat them for HP, or sell them
  carp:      { name: ['鏡湖鯉', 'Mirror Carp'], price: 24, use: 'heal', power: 70, target: 'ally', fish: true, desc: ['回復 70 HP。湖裡最常見的魚。', 'Restores 70 HP. The commonest fish in the lake.'] },
  trout:     { name: ['虹鱒', 'Rainbow Trout'], price: 40, use: 'heal', power: 120, target: 'ally', fish: true, desc: ['回復 120 HP。', 'Restores 120 HP.'] },
  bream:     { name: ['海鯛', 'Sea Bream'], price: 60, use: 'heal', power: 180, target: 'ally', fish: true, desc: ['回復 180 HP。', 'Restores 180 HP.'] },
  mudcat:    { name: ['泥鬚魚', 'Mud Whisker'], price: 18, use: 'cure', target: 'ally', fish: true, desc: ['解除中毒。沼澤人說這是藥。', 'Cures poison. Marsh folk swear by it.'] },
  sandeel:   { name: ['沙泉鰻', 'Oasis Eel'], price: 70, use: 'mp', power: 25, target: 'ally', fish: true, desc: ['回復 25 MP。', 'Restores 25 MP.'] },
  goldkoi:   { name: ['金鱗錦鯉', 'Golden Koi'], price: 300, fish: true, desc: ['閃著金光的稀有錦鯉。鹽灣港的老漁夫做夢都想要。', 'A rare koi of shining gold. The old Saltmere fisher dreams of one.'] },
  prismfish: { name: ['稜光魚', 'Prismfin'], price: 600, fish: true, desc: ['只在夜裡浮上來的傳說之魚，鱗片映著七彩。', 'A fish of legend that rises only at night, its scales full of colour.'] },
  // gear found out in the wider land
  moonbow:    { name: ['月弧弓', 'Moon Bow'], price: 0, slot: 'weapon', kind: 'bow', atk: 25, spr: 4, el: 'ice' },
  runeblade:  { name: ['古都符文劍', 'Lumeran Runeblade'], price: 0, slot: 'weapon', kind: 'sword', atk: 26, mag: 4, el: 'holy' },
  emberblade: { name: ['熔岩劍', 'Ember Blade'], price: 0, slot: 'weapon', kind: 'sword', atk: 30, str: 3, el: 'fire' },
  starrod:    { name: ['星辰杖', 'Star Rod'], price: 0, slot: 'weapon', kind: 'staff', atk: 8, mag: 20 },
  frostmail:  { name: ['霜鱗甲', 'Frostscale Mail'], price: 0, slot: 'armor', def: 22, res: ['ice'] },
  sporecloak: { name: ['孢子斗篷', 'Spore Cloak'], price: 0, slot: 'armor', def: 14, spr: 5, immune: ['sleep'] },
  flamering:  { name: ['火焰戒指', 'Flame Ring'], price: 0, slot: 'acc', str: 4, mag: 6 },
  fishcharm:  { name: ['漁人護符', "Angler's Charm"], price: 0, slot: 'acc', agi: 3, desc: ['帶著它，釣魚的時機會寬一點。', 'Wear it and the timing for a catch is kinder.'] },
  wisdomring: { name: ['回憶之戒', 'Ring of Memory'], price: 0, slot: 'acc', mag: 10, spr: 10 },
  // weapons that carry an element, and gear with special effects
  icebrand:   { name: ['冰刃', 'Icebrand'], price: 520, slot: 'weapon', kind: 'sword', atk: 20, el: 'ice' },
  flametongue:{ name: ['炎舌短劍', 'Flametongue'], price: 480, slot: 'weapon', kind: 'dagger', atk: 17, agi: 3, el: 'fire' },
  aquastaff:  { name: ['潮汐杖', 'Tide Staff'], price: 460, slot: 'weapon', kind: 'staff', atk: 6, mag: 14, el: 'water' },
  thunderfist:{ name: ['雷拳套', 'Thunder Knuckles'], price: 500, slot: 'weapon', kind: 'fist', atk: 21, el: 'bolt' },
  salamander: { name: ['火蜥皮甲', 'Salamander Hide'], price: 560, slot: 'armor', def: 15, res: ['fire'] },
  snowcoat:   { name: ['雪狐大衣', 'Snowfox Coat'], price: 560, slot: 'armor', def: 15, res: ['ice'] },
  emerald:    { name: ['翠玉墜', 'Emerald Pendant'], price: 0, slot: 'acc', spr: 3, immune: ['poison'] },
  stargazer:  { name: ['醒目護符', 'Wakeful Charm'], price: 400, slot: 'acc', spr: 3, immune: ['sleep'] },
  goggles:    { name: ['護目鏡', 'Goggles'], price: 300, slot: 'acc', agi: 2, immune: ['blind'] },
  ribbon:     { name: ['緞帶', 'Ribbon'], price: 0, slot: 'acc', spr: 6, immune: ['poison', 'sleep', 'stun', 'slow', 'blind'] },
  regenring:  { name: ['再生指環', 'Regen Ring'], price: 0, slot: 'acc', regen: true },
  thriftring: { name: ['節約戒指', 'Thrift Ring'], price: 0, slot: 'acc', mag: 3, mpcut: true },
  quickcharm: { name: ['迅捷護符', 'Quick Charm'], price: 650, slot: 'acc', agi: 6, first: true },
  blackbelt:  { name: ['黑帶', 'Black Belt'], price: 0, slot: 'acc', str: 4, counter: true },
};
bilingual(ITEMS);
export const SHOPS = {
  hearthvale: ['potion', 'antidote', 'eyedrops', 'lens', 'ether', 'tent', 'shortsword', 'rod', 'dagger', 'mallet', 'shortbow', 'wraps', 'tunic', 'leathervest'],
  dunewell:   ['potion', 'hipotion', 'ether', 'phoenix', 'antidote', 'tent', 'broadsword', 'silverstaff', 'kris', 'warhammer', 'longbow', 'tigerclaw', 'icebrand', 'leathervest', 'chainmail', 'snowcoat', 'goggles'],
  frostgate:  ['hipotion', 'ether', 'phoenix', 'antidote', 'tent', 'broadsword', 'silverstaff', 'kris', 'flametongue', 'warhammer', 'longbow', 'tigerclaw', 'chainmail', 'salamander', 'stargazer'],
  fenside:    ['potion', 'antidote', 'ether', 'tent', 'phoenix', 'leathervest', 'shortbow', 'wraps', 'goggles'],
  saltmere:   ['potion', 'hipotion', 'ether', 'antidote', 'tent', 'phoenix', 'broadsword', 'kris', 'longbow', 'aquastaff', 'thunderfist', 'leathervest', 'chainmail', 'quickcharm'],
};

// model: a Kenney model path, or 'vox:' and a shape built from blocks in models.js
// lv decides the stats; hp/atk/def/mag are multipliers on that
export const MONSTERS = {
  slime:     { name: ['果凍史萊姆', 'Jelly'], model: 'vox:slime', color: '#5fd36a', lv: 1, hp: 0.8 },
  bunny:     { name: ['跳跳兔', 'Hopper'], model: 'pets/animal-bunny', lv: 2, agi: 1.3 },
  chick:     { name: ['啄啄雞', 'Pecker'], model: 'pets/animal-chick', lv: 1, hp: 0.7 },
  hog:       { name: ['野豬', 'Wild Boar'], model: 'pets/animal-hog', lv: 4, hp: 1.3, atk: 1.2 },
  caterpillar:{ name: ['毛毛蟲', 'Crawler'], model: 'pets/animal-caterpillar', lv: 6, acts: [['atk', 3], ['poison', 1]] },
  monkey:    { name: ['林猴', 'Treetop Monkey'], model: 'pets/animal-monkey', lv: 7, agi: 1.4, acts: [['atk', 3], ['steal', 1]] },
  orc:       { name: ['森林獸人', 'Forest Orc'], model: 'dungeon/character-orc', lv: 9, hp: 1.4, atk: 1.25 },
  bluejelly: { name: ['藍凝膠', 'Blue Jelly'], model: 'vox:slime', color: '#5fa8ff', lv: 8, mag: 1.3, acts: [['atk', 2], ['ice', 2]] },
  crab:      { name: ['礁石蟹', 'Reef Crab'], model: 'vox:crab', color: '#e8704a', lv: 8, def: 1.6 },
  fish:      { name: ['跳水魚', 'Leaping Fish'], model: 'pets/animal-fish', lv: 9, agi: 1.2, acts: [['atk', 2], ['water', 2]] },
  parrot:    { name: ['海鸚鵡', 'Sea Parrot'], model: 'pets/animal-parrot', lv: 10, agi: 1.5 },
  wisp:      { name: ['湖之精', 'Lake Wisp'], model: 'vox:wisp', color: '#a8f0ff', lv: 12, mag: 1.5, def: 0.6, acts: [['atk', 1], ['ice', 2], ['sleep', 1]] },
  ghost:     { name: ['幽靈', 'Ghost'], model: 'grave/character-ghost', lv: 13, mag: 1.4, acts: [['atk', 2], ['drain', 1], ['sleep', 1]], undead: true },
  lion:      { name: ['沙丘獅', 'Dune Lion'], model: 'pets/animal-lion', lv: 14, hp: 1.3, atk: 1.3, acts: [['atk', 4], ['roar', 1]] },
  scorpion:  { name: ['赤蠍', 'Red Scorpion'], model: 'vox:scorpion', color: '#d84a2a', lv: 15, acts: [['atk', 3], ['poison', 1], ['blind', 1]] },
  tiger:     { name: ['岩虎', 'Rock Tiger'], model: 'pets/animal-tiger', lv: 17, agi: 1.3, atk: 1.3 },
  skeleton:  { name: ['骷髏兵', 'Skeleton'], model: 'kaykit/Skeleton_Warrior', lv: 18, hp: 1.1, undead: true },
  skelmage:  { name: ['骷髏術士', 'Skeleton Mage'], model: 'kaykit/Skeleton_Mage', lv: 19, mag: 1.5, def: 0.8, undead: true, acts: [['atk', 1], ['fire', 2], ['ice', 1]] },
  skelrogue: { name: ['骷髏刺客', 'Skeleton Rogue'], model: 'kaykit/Skeleton_Rogue', lv: 24, agi: 1.5, undead: true, acts: [['atk', 3], ['poison', 1]] },
  minion:    { name: ['骷髏小兵', 'Skeleton Minion'], model: 'kaykit/Skeleton_Minion', lv: 11, hp: 0.9, undead: true },
  golem:     { name: ['石魔像', 'Stone Golem'], model: 'vox:golem', color: '#9aa0ae', lv: 19, hp: 1.8, def: 1.6, agi: 0.6, acts: [['atk', 3], ['harden', 1]] },
  zombie:    { name: ['殭屍', 'Zombie'], model: 'grave/character-zombie', lv: 20, hp: 1.6, undead: true, acts: [['atk', 3], ['poison', 1]] },
  yeti:      { name: ['雪原巨獸', 'Snow Brute'], model: 'pets/animal-elephant', lv: 21, hp: 1.7, atk: 1.3, acts: [['atk', 3], ['ice', 1]] },
  vampire:   { name: ['吸血鬼', 'Vampire'], model: 'grave/character-vampire', lv: 24, mag: 1.4, acts: [['atk', 2], ['drain', 2], ['fire', 1]], undead: true },
  crysgolem: { name: ['晶石魔像', 'Crystal Golem'], model: 'vox:golem', color: '#7ce8ff', lv: 25, hp: 1.9, def: 1.8, acts: [['atk', 3], ['quake', 1]] },
  bogslime:  { name: ['沼泥怪', 'Bog Ooze'], model: 'vox:slime', color: '#7a8a3a', lv: 10, hp: 1.1, acts: [['atk', 3], ['poison', 1]] },
  sporeling: { name: ['孢子球', 'Sporeling'], model: 'vox:slime', color: '#c070e0', lv: 13, mag: 1.2, acts: [['atk', 2], ['sleep', 1]] },
  sporetreant:{ name: ['菇樹精', 'Shroomling'], model: 'vox:treant', color: '#b060c8', lv: 14, hp: 1.3, acts: [['atk', 3], ['poison', 1]] },
  ruinguard: { name: ['古都守像', 'Lumeran Sentinel'], model: 'vox:golem', color: '#b8ae90', lv: 20, hp: 1.6, def: 1.7, agi: 0.6, acts: [['atk', 3], ['quake', 1]] },
  frostjelly:{ name: ['霜凝膠', 'Frost Jelly'], model: 'vox:slime', color: '#d8f4ff', lv: 18, mag: 1.4, acts: [['atk', 2], ['ice', 2]] },
  icewisp:   { name: ['冰晶精', 'Rime Wisp'], model: 'vox:wisp', color: '#e8fbff', lv: 20, mag: 1.6, def: 0.7, acts: [['atk', 1], ['ice', 2], ['sleep', 1]] },
  magmaslime:{ name: ['熔岩史萊姆', 'Magma Ooze'], model: 'vox:slime', color: '#ff6030', lv: 22, hp: 1.2, acts: [['atk', 2], ['fire', 2]] },
  emberwisp: { name: ['火焰精', 'Ember Wisp'], model: 'vox:wisp', color: '#ffa040', lv: 23, mag: 1.6, def: 0.7, acts: [['atk', 1], ['fire', 3]] },
  magmagolem:{ name: ['熔岩魔像', 'Magma Golem'], model: 'vox:golem', color: '#a04020', lv: 24, hp: 1.9, def: 1.6, agi: 0.6, acts: [['atk', 3], ['fire', 1], ['quake', 1]] },
  // guardians of the lands, and what waits at the top of the spire
  treant:    { name: ['古樹守衛', 'Elder Treant'], model: 'vox:treant', color: '#4a8a3a', lv: 9, boss: true, hp: 4.5, acts: [['atk', 3], ['poison', 1], ['quake', 1]] },
  mesaking:  { name: ['台地之王', 'Mesa King'], model: 'vox:golem', color: '#c86a3a', lv: 17, boss: true, hp: 5, acts: [['atk', 3], ['quake', 2], ['fire', 1], ['harden', 1]] },
  frostwyrm: { name: ['冰霜飛龍', 'Frost Wyrm'], model: 'vox:dragon', color: '#9ad8ff', lv: 22, boss: true, hp: 6, acts: [['atk', 3], ['ice', 2], ['icestorm', 1]] },
  bogkeeper: { name: ['沼地守墓人', 'The Bog Keeper'], model: 'grave/character-keeper', lv: 12, boss: true, hp: 4.5, undead: true, acts: [['atk', 3], ['poison', 1], ['drain', 1], ['sleep', 1]] },
  sporelord: { name: ['菇王', 'The Sporelord'], model: 'vox:treant', color: '#d070e0', lv: 14, boss: true, hp: 5, acts: [['atk', 3], ['sleep', 1], ['poison', 1], ['quake', 1]] },
  fallenknight:{ name: ['古都亡騎', 'The Fallen Knight'], model: 'kaykit/Skeleton_Warrior', lv: 20, boss: true, hp: 5.5, undead: true, acts: [['atk', 4], ['drain', 1], ['quake', 1]] },
  emberdrake:{ name: ['熔岩飛龍', 'The Ember Drake'], model: 'vox:dragon', color: '#ff6a30', lv: 25, boss: true, hp: 6, acts: [['atk', 3], ['fire', 2], ['firestorm', 1], ['roar', 1]] },
  prismheart:{ name: ['稜晶之心', 'The Prism Heart'], model: 'vox:heart', color: '#e8b0ff', lv: 30, boss: true, hp: 8, acts: [['atk', 2], ['icestorm', 1], ['firestorm', 1], ['quake', 1], ['drain', 1]] },
};
bilingual(MONSTERS, ['name']);
// what monsters can do besides hit you
export const TECHS = {
  poison:   { name: ['毒牙', 'Toxic Bite'], kind: 'status', status: 'poison', target: 'one' },
  sleep:    { name: ['催眠', 'Hypnosis'], kind: 'status', status: 'sleep', target: 'one' },
  steal:    { name: ['偷東西', 'Pilfer'], kind: 'steal', target: 'one' },
  drain:    { name: ['吸取', 'Drain'], kind: 'drain', power: 16, target: 'one' },
  fire:     { name: ['火球', 'Fireball'], kind: 'magic', power: 18, el: 'fire', target: 'one' },
  ice:      { name: ['冰息', 'Frost Breath'], kind: 'magic', power: 18, el: 'ice', target: 'one' },
  water:    { name: ['水砲', 'Water Jet'], kind: 'magic', power: 16, el: 'water', target: 'one' },
  quake:    { name: ['地震', 'Quake'], kind: 'magic', power: 26, el: 'none', target: 'all' },
  icestorm: { name: ['暴風雪', 'Blizzard'], kind: 'magic', power: 34, el: 'ice', target: 'all' },
  firestorm:{ name: ['炎之嵐', 'Firestorm'], kind: 'magic', power: 36, el: 'fire', target: 'all' },
  blind:    { name: ['煙沙', 'Dust Cloud'], kind: 'status', status: 'blind', target: 'one' },
  harden:   { name: ['硬化', 'Harden'], kind: 'guard', target: 'self' },
  roar:     { name: ['咆哮', 'Roar'], kind: 'rally', target: 'self' },
};
bilingual(TECHS, ['name']);
// what each monster is weak to and shrugs off; weak takes 1.6x, resist 0.4x, absorb heals
const AFF = {
  fire: { weak: ['ice', 'water'], res: ['fire'] }, ice: { weak: ['fire'], res: ['ice', 'water'] }, plant: { weak: ['fire'], res: ['earth', 'water'] }, water: { weak: ['bolt'], res: ['water', 'fire'] },
  undead: { weak: ['holy', 'fire'], res: ['earth'] }, stone: { weak: ['water'], res: ['bolt', 'earth'] }, flyer: { weak: ['bolt'], res: ['earth'] }, beast: { weak: ['fire'], res: [] }, spirit: { weak: ['holy'], res: ['ice'] },
  sand: { weak: ['water', 'ice'], res: ['earth'] }, crystal: { weak: ['earth'], res: ['holy', 'bolt'] }, heart: { weak: [], res: [] },
};
const KIND = {
  slime: 'plant', bunny: 'beast', chick: 'flyer', hog: 'beast', caterpillar: 'plant', monkey: 'beast', orc: 'beast', bluejelly: 'water', crab: 'water', fish: 'water', parrot: 'flyer',
  wisp: 'spirit', ghost: 'undead', lion: 'sand', scorpion: 'sand', tiger: 'beast', skeleton: 'undead', skelmage: 'undead', skelrogue: 'undead', minion: 'undead', golem: 'stone', zombie: 'undead',
  yeti: 'ice', vampire: 'undead', crysgolem: 'crystal', bogslime: 'plant', sporeling: 'plant', sporetreant: 'plant', ruinguard: 'stone', frostjelly: 'ice', icewisp: 'ice', magmaslime: 'fire',
  emberwisp: 'fire', magmagolem: 'fire', treant: 'plant', mesaking: 'sand', frostwyrm: 'ice', bogkeeper: 'undead', sporelord: 'plant', fallenknight: 'undead', emberdrake: 'fire', prismheart: 'heart',
};
export const affinity = (id) => AFF[KIND[id]] || { weak: [], res: [] };
// later lands add their own monsters and kinds
export function extendAffinity(kinds, affs) { Object.assign(KIND, kinds); Object.assign(AFF, affs); }
export const kindOf = (id) => KIND[id];
export const EL_NAME = { fire: ['火', 'Fire'], ice: ['冰', 'Ice'], bolt: ['雷', 'Bolt'], water: ['水', 'Water'], holy: ['聖', 'Holy'], earth: ['土', 'Earth'] };
// the jobs that are not found in crystals, and who teaches them
export const JOB_GIFTS = { sporelord: 'druid', fallenknight: 'paladin', emberdrake: 'samurai' };
// stats of a monster of level lv
export function monsterStats(id) {
  const m = MONSTERS[id], lv = m.lv;
  // the eastern lands use a gentler hit-point curve so long fights stay quick, but hit harder
  if (m.v2) return {
    lv, hp: Math.round((260 + lv * 26 + lv * lv * 0.42) * (m.hp || 1)), atk: Math.round((10 + lv * 3.6) * (m.atk || 1)), def: Math.round((6 + lv * 2.0) * (m.def || 1)),
    mag: Math.round((8 + lv * 3.1) * (m.mag || 1)), agi: Math.round((6 + lv * 1.6) * (m.agi || 1)),
    exp: Math.round((6 + lv * 5 + lv * lv * 0.6) * (m.boss ? 6 : 1)), jp: Math.round((3 + lv * 1.2) * (m.boss ? 4 : 1)), gold: Math.round((4 + lv * 3.5) * (m.boss ? 5 : 1)),
  };
  return {
    lv, hp: Math.round((24 + lv * 20 + lv * lv * 1.2) * (m.hp || 1)), atk: Math.round((8 + lv * 3.4) * (m.atk || 1)), def: Math.round((4 + lv * 2.2) * (m.def || 1)),
    mag: Math.round((6 + lv * 3.0) * (m.mag || 1)), agi: Math.round((6 + lv * 1.6) * (m.agi || 1)),
    exp: Math.round((6 + lv * 5 + lv * lv * 0.6) * (m.boss ? 6 : 1)), jp: Math.round((3 + lv * 1.2) * (m.boss ? 4 : 1)), gold: Math.round((4 + lv * 3.5) * (m.boss ? 5 : 1)),
  };
}
export const expFor = (L) => Math.floor(8 * Math.pow(L - 1, 2.15) + 14 * (L - 1));
