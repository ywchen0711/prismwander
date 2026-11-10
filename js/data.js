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
  fencer:   { name: ['劍士', 'Fencer'], desc: ['擅長用劍的前衛。', 'A front-liner who lives by the sword.'], st: { hp: 110, mp: 70, str: 115, def: 105, mag: 70, spr: 80, agi: 100 }, wep: ['sword'], learn: [[1, 'powerslash'], [2, 'guardup'], [4, 'twinslash'], [6, 'counter'], [9, 'crossblade']] },
  mage:     { name: ['魔導士', 'Mage'], desc: ['操控火、冰、雷的術士。', 'A caster of fire, ice and lightning.'], st: { hp: 80, mp: 130, str: 70, def: 80, mag: 125, spr: 105, agi: 95 }, wep: ['staff'], learn: [[1, 'fire'], [1, 'ice'], [3, 'thunder'], [6, 'fira'], [9, 'meteorite']] },
  cleric:   { name: ['祭司', 'Cleric'], desc: ['治療與守護的專家。', 'A healer and protector.'], st: { hp: 95, mp: 120, str: 80, def: 90, mag: 95, spr: 125, agi: 90 }, wep: ['staff', 'hammer'], learn: [[1, 'heal'], [2, 'cure'], [4, 'healall'], [6, 'revive'], [8, 'barrier']] },
  rogue:    { name: ['盜賊', 'Rogue'], desc: ['敏捷，會偷東西和施毒。', 'Quick hands for stealing and poison.'], st: { hp: 90, mp: 80, str: 100, def: 85, mag: 80, spr: 85, agi: 130 }, wep: ['dagger'], learn: [[1, 'steal'], [2, 'venom'], [4, 'flee'], [6, 'doublestab'], [9, 'shadowstep']] },
  guardian: { name: ['守衛', 'Guardian'], desc: ['用身體替夥伴擋下攻擊。', 'Takes the hits so friends do not.'], st: { hp: 135, mp: 65, str: 105, def: 135, mag: 60, spr: 95, agi: 75 }, wep: ['sword', 'hammer'], learn: [[1, 'provoke'], [2, 'ironwall'], [4, 'shieldbash'], [6, 'cover'], [9, 'fortress']] },
  ranger:   { name: ['弓手', 'Ranger'], desc: ['從遠處瞄準弱點。', 'Aims for weak spots from afar.'], st: { hp: 95, mp: 85, str: 110, def: 90, mag: 80, spr: 90, agi: 115 }, wep: ['bow'], learn: [[1, 'aim'], [2, 'arrowrain'], [4, 'sleepshot'], [6, 'piercing'], [9, 'starshot']] },
  monk:     { name: ['武僧', 'Monk'], desc: ['空手的格鬥家，越戰越勇。', 'An unarmed fighter who grows stronger mid-fight.'], st: { hp: 125, mp: 70, str: 120, def: 95, mag: 65, spr: 100, agi: 110 }, wep: ['fist'], learn: [[1, 'chakra'], [2, 'roundkick'], [4, 'focus'], [6, 'thousandfists'], [9, 'innerpeace']] },
  bard:     { name: ['吟遊詩人', 'Bard'], desc: ['用歌聲鼓舞全隊。', 'Sings the whole party into shape.'], st: { hp: 90, mp: 110, str: 80, def: 85, mag: 100, spr: 110, agi: 105 }, wep: ['bow', 'dagger'], learn: [[1, 'warsong'], [2, 'lullaby'], [4, 'ballad'], [6, 'swiftsong'], [9, 'requiem']] },
  chrono:   { name: ['時術師', 'Chronomancer'], desc: ['讓時間變快或變慢。', 'Speeds time up or slows it down.'], st: { hp: 85, mp: 125, str: 70, def: 80, mag: 115, spr: 115, agi: 110 }, wep: ['staff'], learn: [[1, 'haste'], [2, 'slow'], [4, 'gravity'], [6, 'hasteall'], [9, 'stop']] },
  alchemist:{ name: ['鍊金術士', 'Alchemist'], desc: ['道具效果加倍，還會丟炸彈。', 'Doubles item effects and throws bombs.'], st: { hp: 100, mp: 95, str: 90, def: 95, mag: 110, spr: 100, agi: 95 }, wep: ['hammer', 'dagger'], learn: [[1, 'bomb'], [2, 'pharmacy'], [4, 'acid'], [6, 'elixirmix'], [9, 'megabomb']] },
  astro:    { name: ['星術師', 'Astromancer'], desc: ['借用星星的力量。', 'Borrows power from the stars.'], st: { hp: 85, mp: 140, str: 65, def: 80, mag: 135, spr: 120, agi: 95 }, wep: ['staff'], learn: [[1, 'starlight'], [3, 'comet'], [5, 'stardust'], [8, 'supernova']] },
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
  tent:     { name: ['帳篷', 'Tent'], price: 80, use: 'tent', target: 'none', desc: ['在野外紮營，全員完全回復', 'Camp anywhere outside and fully recover'] },
  // weapons
  shortsword: { name: ['短劍', 'Short Sword'], price: 40, slot: 'weapon', kind: 'sword', atk: 6 },
  broadsword: { name: ['闊劍', 'Broadsword'], price: 260, slot: 'weapon', kind: 'sword', atk: 16 },
  crystalblade: { name: ['水晶劍', 'Crystal Blade'], price: 0, slot: 'weapon', kind: 'sword', atk: 34, mag: 6 },
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
  prismmail:  { name: ['稜晶鎧', 'Prism Mail'], price: 0, slot: 'armor', def: 28, spr: 6 },
  charm:      { name: ['幸運符', 'Lucky Charm'], price: 0, slot: 'acc', agi: 5 },
  powerring:  { name: ['力量戒指', 'Power Ring'], price: 0, slot: 'acc', str: 8 },
  sagering:   { name: ['賢者戒指', 'Sage Ring'], price: 0, slot: 'acc', mag: 8 },
  guardring:  { name: ['守護戒指', 'Guard Ring'], price: 0, slot: 'acc', def: 8 },
  // things that change how you can move
  boots:      { name: ['彈跳靴', 'Spring Boots'], key: true, desc: ['跳得比以前高一格。', 'Jump one block higher than before.'] },
  cape:       { name: ['滑翔斗篷', 'Glide Cape'], key: true, desc: ['在空中按住跳躍可以慢慢滑翔。', 'Hold jump in the air to glide down slowly.'] },
  compass:    { name: ['晶石羅盤', 'Crystal Compass'], key: true, desc: ['小地圖上會顯示最近的水晶。', 'Shows the nearest crystal on the minimap.'] },
};
bilingual(ITEMS);
export const SHOPS = {
  hearthvale: ['potion', 'antidote', 'ether', 'tent', 'shortsword', 'rod', 'dagger', 'mallet', 'shortbow', 'wraps', 'tunic', 'leathervest'],
  dunewell:   ['potion', 'hipotion', 'ether', 'phoenix', 'antidote', 'tent', 'broadsword', 'silverstaff', 'kris', 'warhammer', 'longbow', 'tigerclaw', 'leathervest', 'chainmail'],
  frostgate:  ['hipotion', 'ether', 'phoenix', 'antidote', 'tent', 'broadsword', 'silverstaff', 'kris', 'warhammer', 'longbow', 'tigerclaw', 'chainmail'],
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
  lion:      { name: ['沙丘獅', 'Dune Lion'], model: 'pets/animal-lion', lv: 14, hp: 1.3, atk: 1.3 },
  scorpion:  { name: ['赤蠍', 'Red Scorpion'], model: 'vox:scorpion', color: '#d84a2a', lv: 15, acts: [['atk', 3], ['poison', 1]] },
  tiger:     { name: ['岩虎', 'Rock Tiger'], model: 'pets/animal-tiger', lv: 17, agi: 1.3, atk: 1.3 },
  skeleton:  { name: ['骷髏兵', 'Skeleton'], model: 'kaykit/Skeleton_Warrior', lv: 18, hp: 1.1, undead: true },
  skelmage:  { name: ['骷髏術士', 'Skeleton Mage'], model: 'kaykit/Skeleton_Mage', lv: 19, mag: 1.5, def: 0.8, undead: true, acts: [['atk', 1], ['fire', 2], ['ice', 1]] },
  skelrogue: { name: ['骷髏刺客', 'Skeleton Rogue'], model: 'kaykit/Skeleton_Rogue', lv: 24, agi: 1.5, undead: true, acts: [['atk', 3], ['poison', 1]] },
  minion:    { name: ['骷髏小兵', 'Skeleton Minion'], model: 'kaykit/Skeleton_Minion', lv: 11, hp: 0.9, undead: true },
  golem:     { name: ['石魔像', 'Stone Golem'], model: 'vox:golem', color: '#9aa0ae', lv: 19, hp: 1.8, def: 1.6, agi: 0.6 },
  zombie:    { name: ['殭屍', 'Zombie'], model: 'grave/character-zombie', lv: 20, hp: 1.6, undead: true, acts: [['atk', 3], ['poison', 1]] },
  yeti:      { name: ['雪原巨獸', 'Snow Brute'], model: 'pets/animal-elephant', lv: 21, hp: 1.7, atk: 1.3, acts: [['atk', 3], ['ice', 1]] },
  vampire:   { name: ['吸血鬼', 'Vampire'], model: 'grave/character-vampire', lv: 24, mag: 1.4, acts: [['atk', 2], ['drain', 2], ['fire', 1]], undead: true },
  crysgolem: { name: ['晶石魔像', 'Crystal Golem'], model: 'vox:golem', color: '#7ce8ff', lv: 25, hp: 1.9, def: 1.8, acts: [['atk', 3], ['quake', 1]] },
  // guardians of the hardest crystals, and what waits at the top of the spire
  treant:    { name: ['古樹守衛', 'Elder Treant'], model: 'vox:treant', color: '#4a8a3a', lv: 9, boss: true, hp: 4.5, acts: [['atk', 3], ['poison', 1], ['quake', 1]] },
  mesaking:  { name: ['台地之王', 'Mesa King'], model: 'vox:golem', color: '#c86a3a', lv: 17, boss: true, hp: 5, acts: [['atk', 3], ['quake', 2], ['fire', 1]] },
  frostwyrm: { name: ['冰霜飛龍', 'Frost Wyrm'], model: 'vox:dragon', color: '#9ad8ff', lv: 22, boss: true, hp: 6, acts: [['atk', 3], ['ice', 2], ['icestorm', 1]] },
  prismheart:{ name: ['稜晶之心', 'The Prism Heart'], model: 'vox:heart', color: '#e8b0ff', lv: 28, boss: true, hp: 8, acts: [['atk', 2], ['icestorm', 1], ['firestorm', 1], ['quake', 1], ['drain', 1]] },
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
};
bilingual(TECHS, ['name']);
// stats of a monster of level lv
export function monsterStats(id) {
  const m = MONSTERS[id], lv = m.lv;
  return {
    lv, hp: Math.round((24 + lv * 20 + lv * lv * 1.2) * (m.hp || 1)), atk: Math.round((8 + lv * 3.4) * (m.atk || 1)), def: Math.round((4 + lv * 2.2) * (m.def || 1)),
    mag: Math.round((6 + lv * 3.0) * (m.mag || 1)), agi: Math.round((6 + lv * 1.6) * (m.agi || 1)),
    exp: Math.round((6 + lv * 5 + lv * lv * 0.6) * (m.boss ? 6 : 1)), jp: Math.round((3 + lv * 1.2) * (m.boss ? 4 : 1)), gold: Math.round((4 + lv * 3.5) * (m.boss ? 5 : 1)),
  };
}
export const expFor = (L) => Math.floor(8 * Math.pow(L - 1, 2.15) + 14 * (L - 1));
