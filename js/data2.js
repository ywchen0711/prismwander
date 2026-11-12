// 晶境漫遊 Prismwander, the Eastern Sea and after: eight more jobs, master arts, link arts, monsters of the
// sea, the sky, the drowned city, the clockwork tower, the deep and the abyss, and the items, food and gear
// that go with them. Every name is [中文, English]. Monster strength is fixed by where they live.
import { bilingual } from './i18n.js';
import { JOBS, ABILITIES, ITEMS, MONSTERS, TECHS, SHOPS, EL_NAME, JOB_GIFTS, extendAffinity } from './data.js';

Object.assign(EL_NAME, { wind: ['風', 'Wind'], dark: ['闇', 'Dark'] });

// ---------- jobs ----------
const NEW_JOBS = {
  dragoon:   { name: ['龍騎士', 'Dragoon'], desc: ['躍上高空再直墜而下的槍兵，跳躍中不會被打中。', 'A lancer who leaps high and falls like a spear; nothing can touch them mid-jump.'], st: { hp: 115, mp: 70, str: 122, def: 110, mag: 60, spr: 85, agi: 100 }, wep: ['spear'], learn: [[1, 'jump'], [2, 'lancet'], [3, 'dragonbreath'], [5, 'highjump'], [7, 'dragonheart'], [9, 'skyfall']] },
  summoner:  { name: ['召喚士', 'Summoner'], desc: ['呼喚古老的精靈，一口氣打擊所有敵人。', 'Calls ancient spirits to strike every foe at once.'], st: { hp: 80, mp: 140, str: 60, def: 75, mag: 132, spr: 122, agi: 90 }, wep: ['staff'], learn: [[1, 'sylph'], [2, 'undine'], [3, 'ignis'], [5, 'terra'], [7, 'lumen'], [10, 'nox']] },
  machinist: { name: ['機工士', 'Machinist'], desc: ['用槍和機關作戰，後排也不吃虧。', 'Fights with guns and gadgets; the back row costs them nothing.'], st: { hp: 100, mp: 80, str: 108, def: 95, mag: 95, spr: 85, agi: 105 }, wep: ['gun', 'hammer'], learn: [[1, 'drill'], [2, 'flashbomb'], [3, 'turret'], [5, 'repair'], [7, 'overclock'], [10, 'hypercannon']] },
  geomancer: { name: ['風水師', 'Geomancer'], desc: ['借用腳下土地的力量；在哪裡戰鬥，就用哪種屬性。', 'Borrows the power of the ground underfoot; the land decides the element.'], st: { hp: 100, mp: 118, str: 85, def: 90, mag: 118, spr: 112, agi: 95 }, wep: ['staff', 'fist'], learn: [[1, 'geo'], [2, 'quicksand'], [3, 'stalagmite'], [5, 'gaiagrace'], [7, 'earthbind'], [10, 'worldheart']] },
  hexer:     { name: ['咒術師', 'Hexer'], desc: ['操控闇與詛咒：封住咒語、削弱敵人、倒數死亡。', 'Wields darkness and curses: silence, weaken, and count down to doom.'], st: { hp: 85, mp: 128, str: 65, def: 80, mag: 128, spr: 110, agi: 100 }, wep: ['staff', 'dagger'], learn: [[1, 'dark'], [2, 'silence'], [3, 'curse'], [5, 'drain2'], [7, 'doom'], [10, 'abyss']] },
  duskknight:{ name: ['暗黑騎士', 'Duskknight'], desc: ['以自己的生命換取力量的騎士。', 'A knight who pays for power with their own life.'], st: { hp: 128, mp: 60, str: 132, def: 110, mag: 80, spr: 80, agi: 90 }, wep: ['sword', 'spear'], learn: [[1, 'darkblade'], [2, 'souleater'], [3, 'shadowguard'], [5, 'dreadstrike'], [7, 'laststand'], [10, 'eclipseblade']] },
  mimic:     { name: ['擬態師', 'Mimic'], desc: ['被魔物的招式打中就能學會，之後用「擬態」施展。', 'Learns monster techniques by being hit by them, then uses them with Lore.'], st: { hp: 100, mp: 115, str: 95, def: 95, mag: 108, spr: 100, agi: 108 }, wep: ['dagger', 'staff'], learn: [[1, 'mimicry'], [3, 'mirrorimage'], [5, 'echo'], [8, 'mimicmaster']] },
  chef:      { name: ['廚師', 'Chef'], desc: ['戰場上也能開伙：料理效果加倍，還會丟辣椒炸彈。', 'Cooks even on the battlefield: food works twice as well, and chilli bombs fly.'], st: { hp: 118, mp: 90, str: 102, def: 100, mag: 90, spr: 108, agi: 95 }, wep: ['hammer', 'dagger'], learn: [[1, 'tastetest'], [2, 'spicebomb'], [3, 'gourmet'], [5, 'tenderize'], [7, 'feast'], [10, 'fullcourse']] },
};
Object.assign(JOBS, bilingual(NEW_JOBS));
// a job taught by a guardian of the east when it falls
Object.assign(JOB_GIFTS, { morwen: 'hexer' });
// the four lost faces of the Prism, found in the east
export const LOST_JOBS = ['dragoon', 'summoner', 'machinist', 'geomancer'];

// ---------- abilities ----------
// new types: jump (gone until the end of the round, then lands), summon (a spirit appears), turret, taste, plus
// flags on old types: hpcost (part of max HP instead of MP), drain (heal from the damage), steal, debuffs (several),
// el 'terrain' (the ground decides), cure (lifts ailments), revive (wakes the fallen)
const NEW_ABILITIES = {
  // dragoon
  jump:        { name: ['跳躍', 'Jump'], mp: 4, type: 'jump', power: 2.0, target: 'enemy' },
  lancet:      { name: ['吸血槍', 'Lancet'], mp: 5, type: 'phys', power: 1.2, drain: 0.5, target: 'enemy' },
  dragonbreath:{ name: ['龍息', 'Dragon Breath'], mp: 10, type: 'magic', power: 34, el: 'fire', target: 'enemies' },
  highjump:    { name: ['高跳', 'High Jump'], mp: 10, type: 'jump', power: 3.0, target: 'enemy' },
  dragonheart: { name: ['龍之心（被動）', 'Dragon Heart (passive)'], passive: true },
  skyfall:     { name: ['天墜', 'Skyfall'], mp: 20, type: 'jump', power: 1.8, target: 'enemies' },
  // summoner
  sylph:       { name: ['召喚：希兒芙', 'Summon: Sylph'], mp: 12, type: 'summon', model: 'quat/Hywirl', tint: '#a8ffd8', power: 30, el: 'wind', buff: 'agi', target: 'enemies' },
  undine:      { name: ['召喚：溫蒂妮', 'Summon: Undine'], mp: 15, type: 'summon', model: 'quat/Glub_Evolved', tint: '#70c8ff', power: 38, el: 'water', target: 'enemies' },
  ignis:       { name: ['召喚：伊格尼斯', 'Summon: Ignis'], mp: 18, type: 'summon', model: 'quat/Dragon', tint: '#ff8040', power: 48, el: 'fire', target: 'enemies' },
  terra:       { name: ['召喚：泰拉', 'Summon: Terra'], mp: 22, type: 'summon', model: 'quat/Goleling_Evolved', tint: '#c8a070', power: 58, el: 'earth', target: 'enemies' },
  lumen:       { name: ['召喚：盧緬', 'Summon: Lumen'], mp: 26, type: 'summon', model: 'quat/Alpaking_Evolved', tint: '#fff4c0', power: 60, heal: true, regen: true, target: 'allies' },
  nox:         { name: ['召喚：諾克絲', 'Summon: Nox'], mp: 38, type: 'summon', model: 'quat/Demon_Flying', tint: '#6040a0', power: 92, el: 'dark', target: 'enemies' },
  // machinist
  drill:       { name: ['鑽頭', 'Drill'], mp: 5, type: 'phys', power: 1.4, ignoreDef: true, ranged: true, target: 'enemy' },
  flashbomb:   { name: ['閃光彈', 'Flash Bomb'], mp: 6, type: 'status', status: 'blind', target: 'enemies' },
  turret:      { name: ['自動砲台', 'Auto Turret'], mp: 10, type: 'turret', power: 0.8, rounds: 3, target: 'none' },
  repair:      { name: ['修理', 'Repair'], mp: 6, type: 'heal', power: 40, cure: true, target: 'ally' },
  overclock:   { name: ['超頻', 'Overclock'], mp: 14, type: 'buff', stats: ['agi', 'str'], target: 'allies' },
  hypercannon: { name: ['超級加農砲', 'Hyper Cannon'], mp: 24, type: 'phys', power: 2.4, el: 'bolt', ranged: true, target: 'enemies' },
  // geomancer
  geo:         { name: ['地脈', 'Geo'], mp: 5, type: 'magic', power: 28, el: 'terrain', target: 'enemy' },
  quicksand:   { name: ['流沙', 'Quicksand'], mp: 8, type: 'status', status: 'slow', target: 'enemies' },
  stalagmite:  { name: ['石筍', 'Stalagmite'], mp: 10, type: 'magic', power: 52, el: 'earth', target: 'enemy' },
  gaiagrace:   { name: ['大地之恩', "Gaia's Grace"], mp: 12, type: 'heal', power: 34, cure: true, target: 'allies' },
  earthbind:   { name: ['地縛', 'Earthbind'], mp: 9, type: 'status', status: 'stun', target: 'enemy' },
  worldheart:  { name: ['世界之心', 'Worldheart'], mp: 30, type: 'magic', power: 82, el: 'terrain', target: 'enemies' },
  // hexer
  dark:        { name: ['闇', 'Dark'], mp: 5, type: 'magic', power: 26, el: 'dark', target: 'enemy' },
  silence:     { name: ['沉默', 'Silence'], mp: 6, type: 'status', status: 'silence', target: 'enemy' },
  curse:       { name: ['詛咒', 'Curse'], mp: 8, type: 'status', debuffs: ['str', 'def'], target: 'enemy' },
  drain2:      { name: ['吸魂', 'Soul Drain'], mp: 10, type: 'magic', power: 36, el: 'dark', drain: 0.6, target: 'enemy' },
  doom:        { name: ['死亡宣告', 'Doom'], mp: 14, type: 'status', status: 'doom', target: 'enemy' },
  abyss:       { name: ['深淵', 'Abyss'], mp: 28, type: 'magic', power: 70, el: 'dark', target: 'enemies' },
  // duskknight
  darkblade:   { name: ['暗黑劍', 'Darkblade'], mp: 0, hpcost: 0.08, type: 'phys', power: 1.9, el: 'dark', target: 'enemy' },
  souleater:   { name: ['噬魂', 'Soul Eater'], mp: 6, type: 'phys', power: 1.4, drain: 0.5, el: 'dark', target: 'enemy' },
  shadowguard: { name: ['影之盾', 'Shadow Guard'], mp: 6, type: 'buff', stat: 'def', big: true, target: 'self' },
  dreadstrike: { name: ['恐懼斬', 'Dread Strike'], mp: 0, hpcost: 0.12, type: 'phys', power: 1.25, el: 'dark', debuff: 'str', target: 'enemies' },
  laststand:   { name: ['背水（被動）', 'Last Stand (passive)'], passive: true },
  eclipseblade:{ name: ['蝕日劍', 'Eclipse Blade'], mp: 0, hpcost: 0.2, type: 'phys', power: 4.2, el: 'dark', target: 'enemy' },
  // mimic
  mimicry:     { name: ['擬態（被動）', 'Mimicry (passive)'], passive: true },
  mirrorimage: { name: ['鏡像', 'Mirror Image'], mp: 6, type: 'buff', stat: 'agi', big: true, target: 'self' },
  echo:        { name: ['回聲', 'Echo'], mp: 12, type: 'echo', target: 'none' },
  mimicmaster: { name: ['擬態大師（被動）', 'Mimic Master (passive)'], passive: true },
  // chef
  tastetest:   { name: ['試吃', 'Taste Test'], mp: 3, type: 'taste', power: 50, target: 'self' },
  spicebomb:   { name: ['辣椒炸彈', 'Chilli Bomb'], mp: 6, type: 'magic', power: 28, el: 'fire', status: 'blind', target: 'enemy' },
  gourmet:     { name: ['美食家（被動）', 'Gourmet (passive)'], passive: true },
  tenderize:   { name: ['拍鬆', 'Tenderize'], mp: 7, type: 'phys', power: 1.2, debuff: 'def', target: 'enemy' },
  feast:       { name: ['盛宴', 'Feast'], mp: 18, type: 'heal', power: 46, regen: true, buff: 'str', target: 'allies' },
  fullcourse:  { name: ['全餐', 'Full Course'], mp: 34, type: 'heal', power: 999, cure: true, target: 'allies' },
  // master arts: taught by a master once the job has proved itself
  swordsaint:  { name: ['劍聖・一刀', 'Sword Saint'], mp: 26, type: 'phys', power: 2.2, hits: 2, sure: true, target: 'enemy' },
  elemruin:    { name: ['元素終焉', 'Elemental Ruin'], mp: 34, type: 'magic', power: 86, el: 'auto', target: 'enemies' },
  miracle:     { name: ['奇蹟', 'Miracle'], mp: 40, type: 'heal', power: 999, revive: true, cure: true, target: 'allies' },
  mug:         { name: ['強奪', 'Mug'], mp: 8, type: 'phys', power: 1.6, steal: true, target: 'enemy' },
  aegis:       { name: ['神盾', 'Aegis'], mp: 22, type: 'buff', stat: 'def', big: true, taunt: true, target: 'allies' },
  heavensbow:  { name: ['天穹箭', "Heaven's Bow"], mp: 24, type: 'phys', power: 0.75, hits: 6, ranged: true, target: 'enemy' },
  anthem:      { name: ['英雄讚歌', 'Heroic Anthem'], mp: 26, type: 'buff', stats: ['str', 'def', 'agi'], target: 'allies' },
  dragonfist:  { name: ['昇龍拳', 'Rising Dragon'], mp: 20, type: 'phys', power: 3.6, el: 'fire', target: 'enemy' },
  philosopher: { name: ['賢者之石', "Philosopher's Stone"], mp: 36, type: 'heal', power: 400, revive: true, target: 'allies' },
  timewarp:    { name: ['時空扭曲', 'Time Warp'], mp: 30, type: 'timewarp', target: 'none' },
  tempest:     { name: ['暴風劍舞', 'Tempest Dance'], mp: 26, type: 'phys', power: 0.7, hits: 3, el: 'wind', target: 'enemies' },
  bigbang:     { name: ['大爆炸', 'Big Bang'], mp: 48, type: 'magic', power: 130, el: 'none', target: 'enemies' },
};
Object.assign(ABILITIES, bilingual(NEW_ABILITIES, ['name']));
// the master of each classic craft, and the art they teach
export const MASTER_ART = { fencer: 'swordsaint', mage: 'elemruin', cleric: 'miracle', rogue: 'mug', guardian: 'aegis', ranger: 'heavensbow', bard: 'anthem', monk: 'dragonfist', alchemist: 'philosopher', chrono: 'timewarp', dancer: 'tempest', astro: 'bigbang' };
export const MASTER_WINS = 12;

// link arts: two friends with the right jobs (main or sub) act together; the partner gives up their turn
export const LINKS = bilingual({
  frozentime: { name: ['連攜：凍結時光', 'Link: Frozen Time'], jobs: ['mage', 'chrono'], mp: 22, type: 'magic', power: 92, el: 'ice', status: 'slow', target: 'enemies' },
  twinblades: { name: ['連攜：雙劍交錯', 'Link: Twin Blades'], jobs: ['fencer', 'dancer'], mp: 18, type: 'phys', power: 1.05, hits: 4, target: 'enemy' },
  dawnhymn:   { name: ['連攜：黎明聖歌', 'Link: Hymn of Dawn'], jobs: ['cleric', 'bard'], mp: 20, type: 'heal', power: 90, regen: true, target: 'allies' },
  crossfire:  { name: ['連攜：交叉火網', 'Link: Crossfire'], jobs: ['ranger', 'machinist'], mp: 18, type: 'phys', power: 3.4, sure: true, ranged: true, target: 'enemy' },
  bulwark:    { name: ['連攜：聖光壁壘', 'Link: Holy Bulwark'], jobs: ['guardian', 'paladin'], mp: 20, type: 'magic', power: 46, el: 'holy', shield: true, target: 'enemies' },
  thunderclap:{ name: ['連攜：雷鳴拳', 'Link: Thunderclap'], jobs: ['monk', 'samurai'], mp: 20, type: 'phys', power: 1.9, el: 'bolt', target: 'enemies' },
  spicestorm: { name: ['連攜：香料風暴', 'Link: Spice Storm'], jobs: ['alchemist', 'chef'], mp: 18, type: 'magic', power: 72, el: 'fire', status: 'burn', target: 'enemies' },
  starcall:   { name: ['連攜：星辰召來', 'Link: Starcall'], jobs: ['astro', 'summoner'], mp: 30, type: 'magic', power: 118, el: 'holy', target: 'enemies' },
  eternalnight:{ name: ['連攜：永夜', 'Link: Eternal Night'], jobs: ['hexer', 'duskknight'], mp: 28, type: 'magic', power: 104, el: 'dark', status: 'doom', target: 'enemies' },
  verdant:    { name: ['連攜：翠綠之怒', 'Link: Verdant Wrath'], jobs: ['druid', 'geomancer'], mp: 26, type: 'magic', power: 88, el: 'earth', healParty: 40, target: 'enemies' },
  divingraid: { name: ['連攜：俯衝奇襲', 'Link: Diving Raid'], jobs: ['dragoon', 'rogue'], mp: 16, type: 'phys', power: 2.8, steal: true, target: 'enemy' },
  mirrorlore: { name: ['連攜：鏡之學識', 'Link: Mirror Lore'], jobs: ['scholar', 'mimic'], mp: 24, type: 'magic', power: 76, el: 'auto', target: 'enemies' },
}, ['name']);

// ---------- what monsters can do ----------
const NEW_TECHS = {
  tsunami:   { name: ['海嘯', 'Tsunami'], kind: 'magic', power: 40, el: 'water', target: 'all' },
  gale:      { name: ['狂風', 'Gale'], kind: 'magic', power: 34, el: 'wind', target: 'all' },
  cyclone:   { name: ['旋風', 'Cyclone'], kind: 'magic', power: 30, el: 'wind', target: 'one' },
  darkwave:  { name: ['闇之波動', 'Dark Wave'], kind: 'magic', power: 38, el: 'dark', target: 'all' },
  shadowbolt:{ name: ['暗影箭', 'Shadow Bolt'], kind: 'magic', power: 30, el: 'dark', target: 'one' },
  shock:     { name: ['電擊', 'Shock'], kind: 'magic', power: 24, el: 'bolt', target: 'one' },
  laser:     { name: ['光線', 'Beam'], kind: 'magic', power: 32, el: 'none', target: 'one' },
  steam:     { name: ['蒸汽噴發', 'Steam Blast'], kind: 'magic', power: 36, el: 'fire', target: 'all' },
  needles:   { name: ['飛針', 'Needles'], kind: 'magic', power: 22, el: 'none', target: 'all' },
  noonray:   { name: ['正午之光', 'Noon Ray'], kind: 'magic', power: 40, el: 'holy', target: 'one' },
  solarflare:{ name: ['太陽閃焰', 'Solar Flare'], kind: 'magic', power: 46, el: 'holy', target: 'all' },
  eclipse:   { name: ['日蝕', 'Eclipse'], kind: 'magic', power: 72, el: 'dark', target: 'all' },
  silence:   { name: ['封口', 'Hush'], kind: 'status', status: 'silence', target: 'one' },
  burn:      { name: ['烈焰咬', 'Ember Bite'], kind: 'status', status: 'burn', target: 'one' },
  freeze:    { name: ['凍結', 'Frost Lock'], kind: 'status', status: 'freeze', target: 'one' },
  timelock:  { name: ['時間鎖', 'Time Lock'], kind: 'status', status: 'freeze', target: 'one' },
  sonic:     { name: ['音波', 'Sonic Croak'], kind: 'status', status: 'stun', target: 'one' },
  doom:      { name: ['死亡宣告', 'Death Sentence'], kind: 'status', status: 'doom', target: 'one' },
  curse:     { name: ['詛咒', 'Curse'], kind: 'curse', target: 'one' },
  heal:      { name: ['再生', 'Mend'], kind: 'heal', target: 'self' },
  dive:      { name: ['俯衝', 'Dive'], kind: 'smash', power: 1.9, target: 'one' },
  charge:    { name: ['衝撞', 'Ram'], kind: 'smash', power: 1.7, target: 'one' },
  iai2:      { name: ['拔刀術', 'Quickdraw'], kind: 'smash', power: 2.1, target: 'one' },
  grab:      { name: ['纏繞', 'Constrict'], kind: 'status', status: 'stun', target: 'one' },
  summon:    { name: ['召集齒輪', 'Call Cogs'], kind: 'summon', target: 'self' },
  overclock: { name: ['超頻運轉', 'Overclock'], kind: 'rally', target: 'self' },
};
Object.assign(TECHS, bilingual(NEW_TECHS, ['name']));
// what a mimic pays to use a technique it has learned
export const LORE_MP = { poison: 4, sleep: 6, drain: 8, fire: 5, ice: 5, water: 5, quake: 12, icestorm: 18, firestorm: 18, blind: 4, harden: 4, roar: 4, tsunami: 18, gale: 16, cyclone: 8, darkwave: 18, shadowbolt: 8, shock: 6, laser: 8, steam: 16, needles: 10, noonray: 10, solarflare: 22, eclipse: 34, silence: 6, burn: 5, freeze: 8, timelock: 10, sonic: 6, doom: 16, curse: 8, heal: 6, dive: 8, charge: 8, iai2: 12, grab: 6, overclock: 6, steal: 0 };

// ---------- monsters ----------
// v2 monsters use the stronger second curve (see monsterStats); sz is the height on the field, tint recolours a model
const M2 = {
  // the old land gains some new faces
  dewdrop:    { name: ['露珠仔', 'Dewdrop'], model: 'quat/Green_Blob', lv: 2, hp: 0.8, kind: 'plant', drop: ['slimegel', 0.3], sz: 0.9 },
  nightshade: { name: ['夜影', 'Night Shade'], model: 'quat/Ghost', tint: '#7a6ad8', lv: 7, mag: 1.3, acts: [['atk', 2], ['sleep', 1], ['drain', 1]], kind: 'spirit', drop: ['ecto', 0.25], sz: 1.4 },
  woodogre:   { name: ['林地食人魔', 'Woodland Ogre'], model: 'quat/Orc', lv: 10, hp: 1.4, atk: 1.3, acts: [['atk', 3], ['roar', 1]], kind: 'beast', drop: ['meat', 0.4], sz: 1.8 },
  bogfrog:    { name: ['沼蛙', 'Bog Frog'], model: 'quat/Frog_Real', lv: 11, acts: [['atk', 3], ['poison', 1]], kind: 'plant', drop: ['slimegel', 0.3], sz: 0.9 },
  piranha:    { name: ['鏡湖食人魚', 'Lake Piranha'], model: 'quat/Fish', lv: 12, agi: 1.3, acts: [['atk', 3], ['water', 1]], kind: 'water', drop: ['scale', 0.3], sz: 1.0 },
  mushnub:    { name: ['菇菇仔', 'Mushnub'], model: 'quat/Mushnub', lv: 13, acts: [['atk', 2], ['sleep', 1]], kind: 'fungus', drop: ['sporecap', 0.4], sz: 1.0 },
  cactoro:    { name: ['仙人掌怪', 'Cactoro'], model: 'quat/Cactoro', lv: 15, def: 1.3, acts: [['atk', 3], ['needles', 1]], kind: 'sand', drop: ['toughhide', 0.3], sz: 1.2 },
  ruingoblin: { name: ['遺跡哥布林', 'Ruin Goblin'], model: 'quat/Goblin', lv: 19, agi: 1.3, acts: [['atk', 3], ['steal', 1]], kind: 'beast', drop: ['beastfang', 0.3], sz: 1.4 },
  ridgeogre:  { name: ['山脊巨人', 'Ridge Ogre'], model: 'quat/Yeti_Blocky', lv: 20, hp: 1.5, atk: 1.3, acts: [['atk', 3], ['ice', 1]], kind: 'ice', drop: ['toughhide', 0.35], sz: 2.0 },
  rimeyeti:   { name: ['霜原雪怪', 'Rime Yeti'], model: 'quat/Yeti', lv: 21, hp: 1.4, acts: [['atk', 3], ['freeze', 1]], kind: 'ice', drop: ['meat', 0.4], sz: 1.8 },
  emberimp:   { name: ['熔岩小惡魔', 'Ember Imp'], model: 'quat/Demon_Flying', lv: 23, mag: 1.4, acts: [['atk', 2], ['fire', 2], ['burn', 1]], kind: 'demon', drop: ['ecto', 0.3], sz: 1.4 },
  spiredemon: { name: ['尖塔惡魔', 'Spire Demon'], model: 'quat/Blue_Demon', tint: '#7a50c0', lv: 28, hp: 1.4, atk: 1.3, acts: [['atk', 3], ['shadowbolt', 1], ['roar', 1]], kind: 'demon', drop: ['shadowshard', 0.2], sz: 1.9 },
  // the eastern sea: these rise out of the water around the ship
  glubfin:    { name: ['鰭泡', 'Glubfin'], model: 'quat/Glub', lv: 26, v2: true, acts: [['atk', 2], ['water', 2]], kind: 'sea', drop: ['coral', 0.3] },
  gloomfish:  { name: ['憂鬱魚', 'Gloomfish'], model: 'quat/Blobfish', lv: 27, v2: true, hp: 1.3, acts: [['atk', 2], ['sleep', 1], ['water', 1]], kind: 'sea', drop: ['scale', 0.3] },
  ironcatfish:{ name: ['鐵甲鯰', 'Ironclad Catfish'], model: 'quat/Armored_Catfish', tint: '#8a98a8', lv: 29, v2: true, def: 1.8, acts: [['atk', 3], ['harden', 1]], kind: 'sea', drop: ['scale', 0.5] },
  squidling:  { name: ['墨烏賊', 'Ink Squid'], model: 'quat/Squidle', tint: '#b080d0', lv: 28, v2: true, acts: [['atk', 2], ['blind', 1]], kind: 'sea', drop: ['coral', 0.3] },
  razorfin:   { name: ['利齒魚', 'Razorfin'], model: 'quat/Fish', tint: '#e05050', lv: 27, v2: true, agi: 1.4, acts: [['atk', 1]], kind: 'sea', drop: ['scale', 0.3] },
  // the coral isles
  coraltoad:  { name: ['珊瑚蟾', 'Coral Toad'], model: 'quat/Frog', tint: '#ff8a78', lv: 27, v2: true, acts: [['atk', 2], ['poison', 1], ['water', 1]], kind: 'sea', drop: ['slimegel', 0.4], sz: 1.2 },
  coralcrab:  { name: ['珊瑚蟹', 'Coral Crab'], model: 'vox:crab', color: '#ff6a8a', lv: 28, v2: true, def: 1.8, kind: 'sea', drop: ['coral', 0.5] },
  mongoose:   { name: ['島獴', 'Isle Mongoose'], model: 'quat/Monkroose', lv: 26, v2: true, agi: 1.4, acts: [['atk', 3], ['steal', 1]], kind: 'beast', drop: ['meat', 0.4], sz: 1.3 },
  reefmask:   { name: ['礁石面具', 'Reef Mask'], model: 'quat/Tribal', lv: 29, v2: true, mag: 1.3, acts: [['atk', 1], ['water', 1], ['silence', 1]], kind: 'spirit', drop: ['coral', 0.4], sz: 1.5 },
  coraljelly: { name: ['珊瑚果凍', 'Coral Jelly'], model: 'quat/Pink_Slime', lv: 26, v2: true, acts: [['atk', 2], ['heal', 1]], kind: 'sea', drop: ['slimegel', 0.5], sz: 1.0 },
  kraken:     { name: ['礁海巨妖', 'The Reef Kraken'], model: 'quat/Squidle', tint: '#d04070', lv: 32, v2: true, boss: true, hp: 5, mech: 'arms', acts: [['atk', 2], ['tsunami', 1], ['blind', 1]], kind: 'sea', drop: ['coraltrident', 1] },
  krakenarm:  { name: ['巨妖觸手', 'Kraken Arm'], model: 'vox:tentacle', color: '#d04070', lv: 30, v2: true, hp: 0.55, acts: [['atk', 3], ['grab', 1]], kind: 'sea', add: true },
  // Cloudreach, the islands in the sky
  galebirb:   { name: ['疾風雀', 'Gale Birb'], model: 'quat/Birb', tint: '#8ac8ff', lv: 30, v2: true, agi: 1.5, acts: [['atk', 3], ['cyclone', 1]], kind: 'sky', drop: ['feather', 0.5], sz: 1.1 },
  skywasp:    { name: ['天蜂', 'Sky Wasp'], model: 'quat/Armabee', lv: 31, v2: true, acts: [['atk', 2], ['poison', 1], ['needles', 1]], kind: 'sky', drop: ['feather', 0.3], fly: true, sz: 1.2 },
  cloudalpaca:{ name: ['雲駝', 'Cloud Alpaca'], model: 'quat/Alpaking', lv: 31, v2: true, hp: 1.3, acts: [['atk', 2], ['gale', 1], ['heal', 1]], kind: 'sky', drop: ['feather', 0.4], fly: true, sz: 1.4 },
  whirlwisp:  { name: ['旋風精', 'Whirlwisp'], model: 'quat/Hywirl', lv: 32, v2: true, mag: 1.5, def: 0.7, acts: [['cyclone', 2], ['gale', 1]], kind: 'gale', drop: ['feather', 0.3], fly: true, sz: 1.3 },
  skystone:   { name: ['浮岩', 'Skystone'], model: 'quat/Goleling', tint: '#c8d0e0', lv: 32, v2: true, def: 1.7, agi: 0.7, acts: [['atk', 3], ['harden', 1], ['quake', 1]], kind: 'stone', drop: ['silverore', 0.3], fly: true, sz: 1.3 },
  wyvernling: { name: ['小飛龍', 'Wyvernling'], model: 'quat/Dragon', lv: 33, v2: true, acts: [['atk', 2], ['fire', 1], ['dive', 1]], kind: 'dragon', drop: ['dragonscale', 0.2], fly: true, sz: 1.5 },
  tempest:    { name: ['天穹風龍', 'The Tempest Wyvern'], model: 'quat/Dragon_Evolved', tint: '#e8f4ff', lv: 36, v2: true, boss: true, hp: 6, mech: 'airborne', acts: [['atk', 2], ['gale', 2], ['cyclone', 1], ['roar', 1]], kind: 'sky', fly: true, drop: ['windlance', 1] },
  // Vael, the drowned city
  drownedwraith:{ name: ['溺魂', 'Drowned Wraith'], model: 'quat/Ghost_Skull', tint: '#70c8c8', lv: 33, v2: true, mag: 1.4, acts: [['atk', 1], ['drain', 1], ['silence', 1], ['water', 1]], kind: 'drowned', undead: true, drop: ['ecto', 0.4], sz: 1.5 },
  tidespecter:{ name: ['潮汐幽影', 'Tide Specter'], model: 'quat/Ghost', tint: '#48a8b8', lv: 34, v2: true, mag: 1.5, def: 0.6, acts: [['water', 2], ['sleep', 1], ['tsunami', 1]], kind: 'drowned', undead: true, drop: ['ecto', 0.4], sz: 1.5 },
  drownedguard:{ name: ['溺衛', 'Drowned Guard'], model: 'quat/Zombie_Blocky', tint: '#78a898', lv: 35, v2: true, hp: 1.5, acts: [['atk', 3], ['poison', 1]], kind: 'drowned', undead: true, drop: ['coral', 0.4], sz: 1.8 },
  coralskel:  { name: ['珊瑚骷髏', 'Coral Skeleton'], model: 'quat/Skeleton_Blocky', tint: '#ffb0a8', lv: 35, v2: true, acts: [['atk', 3], ['curse', 1]], kind: 'drowned', undead: true, drop: ['coral', 0.5], sz: 1.8 },
  abyssglub:  { name: ['深淵鰭泡', 'Abyssal Glub'], model: 'quat/Glub_Evolved', tint: '#4060b0', lv: 36, v2: true, mag: 1.4, acts: [['water', 2], ['shadowbolt', 1]], kind: 'sea', drop: ['scale', 0.4], fly: true, sz: 1.5 },
  inkhorror:  { name: ['墨影', 'Ink Horror'], model: 'quat/Squidle', tint: '#30305a', lv: 36, v2: true, hp: 1.3, acts: [['atk', 2], ['blind', 2], ['silence', 1]], kind: 'drowned', drop: ['ecto', 0.3], fly: true, sz: 1.5 },
  morwen:     { name: ['潮之魔女 茉雯', 'Morwen the Tidewitch'], model: 'quat/Alien_Tall', tint: '#58d0c8', lv: 38, v2: true, boss: true, hp: 6, mech: 'tide', acts: [['atk', 1], ['water', 2], ['tsunami', 1], ['silence', 1], ['drain', 1], ['curse', 1]], kind: 'drowned', drop: ['tidering', 1] },
  // the clockwork tower
  cogling:    { name: ['齒輪仔', 'Cogling'], model: 'quat/Enemy_Small', tint: '#d0b060', lv: 34, v2: true, agi: 1.3, acts: [['atk', 3], ['shock', 1]], kind: 'machine', machine: true, drop: ['cog', 0.5], sz: 1.0 },
  gearmech:   { name: ['機關兵', 'Clockwork Soldier'], model: 'quat/Mech', lv: 36, v2: true, hp: 1.3, def: 1.4, acts: [['atk', 2], ['laser', 1], ['harden', 1]], kind: 'machine', machine: true, drop: ['cog', 0.5], sz: 1.7 },
  steamgolem: { name: ['蒸汽巨像', 'Steam Golem'], model: 'quat/Enemy_Large', tint: '#b88a68', lv: 37, v2: true, hp: 1.6, def: 1.5, agi: 0.6, acts: [['atk', 2], ['steam', 1]], kind: 'machine', machine: true, drop: ['cog', 0.6], sz: 2.0 },
  geardrone:  { name: ['齒輪蜂', 'Gear Drone'], model: 'quat/Enemy_Flying', tint: '#e0c070', lv: 35, v2: true, agi: 1.4, acts: [['atk', 2], ['shock', 1]], kind: 'machine', machine: true, fly: true, drop: ['cog', 0.4], sz: 1.3 },
  brassgiant: { name: ['黃銅巨人', 'Brass Giant'], model: 'quat/Giant', tint: '#e0b050', lv: 38, v2: true, hp: 1.8, atk: 1.3, acts: [['atk', 3], ['quake', 1]], kind: 'machine', machine: true, drop: ['silverore', 0.4], sz: 2.2 },
  colossus:   { name: ['齒輪巨像', 'The Gear Colossus'], model: 'quat/Enemy_Large', tint: '#f0c040', lv: 39, v2: true, boss: true, hp: 6, mech: 'vent', acts: [['atk', 2], ['steam', 1], ['quake', 1]], kind: 'machine', machine: true, drop: ['gearhammer', 1] },
  varek:      { name: ['宰相瓦雷克', 'Chancellor Varek'], model: 'quat/Mech', tint: '#ffd070', lv: 44, v2: true, boss: true, hp: 7, mech: 'gears', acts: [['atk', 1], ['laser', 2], ['timelock', 1], ['summon', 1], ['overclock', 1]], kind: 'machine', machine: true, drop: ['aethergun', 1] },
  // Hollowdeep, where time ran wild and old beasts still walk
  raptor:     { name: ['地底迅猛龍', 'Deep Raptor'], model: 'quat/Velociraptor', lv: 37, v2: true, agi: 1.6, acts: [['atk', 4], ['charge', 1]], kind: 'dino', drop: ['meat', 0.5], sz: 1.4 },
  behemoth:   { name: ['劍龍', 'Plated Behemoth'], model: 'quat/Stegosaurus', lv: 39, v2: true, hp: 1.8, def: 1.6, agi: 0.6, acts: [['atk', 3], ['quake', 1], ['harden', 1]], kind: 'dino', drop: ['dinobone', 0.4], sz: 2.0 },
  crusher:    { name: ['三角龍', 'Horned Crusher'], model: 'quat/Triceratops', lv: 40, v2: true, hp: 1.6, atk: 1.4, acts: [['atk', 3], ['charge', 1]], kind: 'dino', drop: ['dinobone', 0.4], sz: 1.9 },
  glowshroom: { name: ['光菇仔', 'Glowshroom'], model: 'quat/Mushnub', tint: '#80e8ff', lv: 36, v2: true, mag: 1.3, acts: [['atk', 1], ['sleep', 1], ['heal', 1]], kind: 'fungus', drop: ['sporecap', 0.5], sz: 1.1 },
  spikecap:   { name: ['刺菇', 'Spikecap'], model: 'quat/Mushnub_Evolved', lv: 38, v2: true, acts: [['atk', 3], ['poison', 1], ['needles', 1]], kind: 'fungus', drop: ['sporecap', 0.5], sz: 1.4 },
  thornblob:  { name: ['刺球', 'Thornblob'], model: 'quat/Spiky_Blob', tint: '#709050', lv: 37, v2: true, def: 1.4, acts: [['atk', 2], ['needles', 1]], kind: 'plant', drop: ['slimegel', 0.5], sz: 1.2 },
  cavefrog:   { name: ['洞穴蛙', 'Cave Frog'], model: 'quat/Frog_Real', tint: '#7090b8', lv: 36, v2: true, acts: [['atk', 2], ['poison', 1], ['sonic', 1]], kind: 'deep', drop: ['slimegel', 0.4], sz: 1.0 },
  dinoling:   { name: ['小恐龍', 'Dinoling'], model: 'quat/Dino', lv: 34, v2: true, acts: [['atk', 3], ['roar', 1]], kind: 'dino', drop: ['meat', 0.5], sz: 1.3 },
  moonhare:   { name: ['月兔', 'Moon Hare'], model: 'quat/Bunny', lv: 33, v2: true, agi: 1.5, acts: [['atk', 3], ['heal', 1]], kind: 'beast', drop: ['egg', 0.4], sz: 1.2 },
  fungallord: { name: ['菇之領主', 'Fungal Lord'], model: 'quat/Mushroom_King', tint: '#9070ff', lv: 41, v2: true, hp: 1.5, acts: [['atk', 2], ['sleep', 1], ['poison', 1], ['quake', 1]], kind: 'fungus', drop: ['sporecap', 0.8], sz: 1.8 },
  tyrant:     { name: ['深淵暴龍', 'The Deepmaw Tyrant'], model: 'quat/TRex', lv: 44, v2: true, boss: true, hp: 7, mech: 'enrage', acts: [['atk', 3], ['quake', 1], ['roar', 1], ['charge', 1]], kind: 'dino', drop: ['titanmaul', 1] },
  // the Noon Halls under Old Lumera
  courtier:   { name: ['正午廷臣', 'Noon Courtier'], model: 'kaykit/Skeleton_Mage', tint: '#ffd860', lv: 43, v2: true, mag: 1.5, acts: [['atk', 1], ['noonray', 2], ['silence', 1]], kind: 'noon', undead: true, drop: ['sunshard', 0.3] },
  sunknight:  { name: ['日輪騎士', 'Sunlit Knight'], model: 'kaykit/Skeleton_Warrior', tint: '#ffe080', lv: 44, v2: true, hp: 1.5, acts: [['atk', 3], ['noonray', 1]], kind: 'noon', undead: true, drop: ['sunshard', 0.3] },
  gildedsentinel:{ name: ['鍍金守像', 'Gilded Sentinel'], model: 'vox:golem', color: '#e8c040', lv: 45, v2: true, hp: 1.8, def: 1.7, agi: 0.6, acts: [['atk', 3], ['quake', 1], ['harden', 1]], kind: 'noon', drop: ['goldore', 0.5] },
  solarwisp:  { name: ['日冕精', 'Solar Wisp'], model: 'vox:wisp', color: '#fff0a0', lv: 43, v2: true, mag: 1.6, def: 0.7, acts: [['noonray', 2], ['solarflare', 1]], kind: 'noon', drop: ['sunshard', 0.4] },
  aurel:      { name: ['正午之王 奧瑞爾', 'Aurel, the Noon King'], model: 'kaykit/Knight', tint: '#ffd040', lv: 50, v2: true, boss: true, hp: 8, mech: 'noon', acts: [['atk', 2], ['noonray', 1], ['solarflare', 1], ['timelock', 1], ['roar', 1]], kind: 'noon', drop: ['noonregalia', 1] },
  // the Prism Abyss beneath the Spire
  abyssfiend: { name: ['深淵惡鬼', 'Abyss Fiend'], model: 'quat/Demon_Blocky', tint: '#6a4080', lv: 50, v2: true, hp: 1.5, atk: 1.3, acts: [['atk', 3], ['darkwave', 1], ['roar', 1]], kind: 'shadow', drop: ['shadowshard', 0.4], sz: 1.8 },
  voiddrake:  { name: ['虛空飛龍', 'Void Drake'], model: 'quat/Dragon_Real', tint: '#5040b0', lv: 53, v2: true, hp: 1.6, acts: [['atk', 2], ['darkwave', 1], ['shadowbolt', 1], ['firestorm', 1]], kind: 'dragon', fly: true, drop: ['dragonscale', 0.5], sz: 2.0 },
  voidspecter:{ name: ['虛空幽影', 'Void Specter'], model: 'quat/Ghost', tint: '#3a2860', lv: 51, v2: true, mag: 1.6, def: 0.6, acts: [['shadowbolt', 2], ['doom', 1], ['drain', 1]], kind: 'shadow', undead: true, drop: ['ecto', 0.5], sz: 1.6 },
  obsidiangolem:{ name: ['黑曜魔像', 'Obsidian Golem'], model: 'vox:golem', color: '#3a3044', lv: 52, v2: true, hp: 1.9, def: 1.9, agi: 0.5, acts: [['atk', 3], ['quake', 1], ['harden', 1]], kind: 'stone', drop: ['adamant', 0.4] },
  umbralogre: { name: ['影之食人魔', 'Umbral Ogre'], model: 'quat/Blue_Demon', tint: '#4a3a60', lv: 54, v2: true, hp: 1.7, atk: 1.4, acts: [['atk', 3], ['roar', 1], ['darkwave', 1]], kind: 'shadow', drop: ['shadowshard', 0.5], sz: 2.1 },
  echomask:   { name: ['迴響面具', 'Echo Mask'], model: 'quat/Tribal', tint: '#7050b0', lv: 51, v2: true, mag: 1.5, acts: [['silence', 1], ['shadowbolt', 2], ['curse', 1]], kind: 'shadow', drop: ['shadowshard', 0.4], fly: true, sz: 1.5 },
  voidwalker: { name: ['虛空行者', 'Void Walker'], model: 'quat/Alien', tint: '#3a2a58', lv: 55, v2: true, agi: 1.4, acts: [['atk', 3], ['doom', 1], ['darkwave', 1]], kind: 'shadow', drop: ['adamant', 0.3], sz: 1.9 },
  echodrake:  { name: ['熔岩飛龍的迴響', 'Echo of the Ember Drake'], model: 'vox:dragon', color: '#6a3a7a', lv: 54, v2: true, boss: true, hp: 5, acts: [['atk', 2], ['firestorm', 1], ['darkwave', 1], ['roar', 1]], kind: 'shadow', drop: ['dragonfists', 1] },
  echowyrm:   { name: ['冰霜飛龍的迴響', 'Echo of the Frost Wyrm'], model: 'vox:dragon', color: '#4a4a8a', lv: 54, v2: true, boss: true, hp: 5, acts: [['atk', 2], ['icestorm', 1], ['darkwave', 1], ['freeze', 1]], kind: 'shadow', drop: ['starbow', 1] },
  echoknight: { name: ['亡騎的迴響', 'Echo of the Fallen Knight'], model: 'kaykit/Skeleton_Warrior', tint: '#6a4a90', lv: 55, v2: true, boss: true, hp: 5, acts: [['atk', 3], ['drain', 1], ['darkwave', 1]], kind: 'shadow', undead: true, drop: ['duskblade', 1] },
  umbra:      { name: ['稜影', 'Umbra, Shadow of the Prism'], model: 'vox:heart', color: '#5a2a8a', lv: 58, v2: true, boss: true, hp: 10, mech: 'umbra', acts: [['atk', 2], ['eclipse', 1], ['darkwave', 2], ['doom', 1], ['drain', 1], ['curse', 1]], kind: 'shadow', drop: ['prismedge', 1] },
  // the arena's champion
  champion:   { name: ['假面劍豪', 'The Masked Blade'], model: 'quat/Ninja', lv: 52, v2: true, boss: true, hp: 5, agi: 1.5, mech: 'stance', acts: [['atk', 4], ['iai2', 1], ['roar', 1]], kind: 'human', drop: ['assassinblade', 1] },
};
Object.assign(MONSTERS, bilingual(M2, ['name']));
extendAffinity(Object.fromEntries(Object.entries(M2).map(([k, v]) => [k, v.kind])), {
  sea: { weak: ['bolt'], res: ['water', 'fire'] }, sky: { weak: ['bolt', 'ice'], res: ['wind', 'earth'] }, gale: { weak: ['ice'], res: ['wind', 'earth'] },
  machine: { weak: ['bolt', 'water'], res: ['earth', 'fire'] }, dino: { weak: ['ice'], res: ['earth'] }, fungus: { weak: ['fire', 'wind'], res: ['earth', 'water', 'dark'] },
  drowned: { weak: ['holy', 'bolt'], res: ['water', 'ice', 'dark'] }, noon: { weak: ['dark'], res: ['holy', 'fire'] }, shadow: { weak: ['holy'], res: ['dark', 'ice'] },
  demon: { weak: ['holy', 'ice'], res: ['fire', 'dark'] }, dragon: { weak: ['ice', 'wind'], res: ['fire', 'earth'] }, deep: { weak: ['fire'], res: ['earth', 'dark'] }, human: { weak: [], res: [] },
});
// monsters that only walk at night (added to world.js NIGHT)
export const NIGHT2 = ['nightshade'];

// ---------- items ----------
const NEW_ITEMS = {
  // medicine
  megapotion: { name: ['群體回復藥', 'Mega Potion'], price: 400, use: 'heal', power: 300, target: 'allies', desc: ['全員回復 300 HP', 'Restores 300 HP to everyone'] },
  xpotion:    { name: ['特級回復藥', 'X-Potion'], price: 360, use: 'heal', power: 999, target: 'ally', desc: ['回復 999 HP', 'Restores 999 HP'] },
  hiether:    { name: ['高級以太', 'Hi-Ether'], price: 220, use: 'mp', power: 80, target: 'ally', desc: ['回復 80 MP', 'Restores 80 MP'] },
  elixir:     { name: ['靈藥', 'Elixir'], price: 0, use: 'elixir', target: 'ally', desc: ['HP 與 MP 全滿', 'Fully restores HP and MP'] },
  megalixir:  { name: ['群體靈藥', 'Megalixir'], price: 0, use: 'elixir', target: 'allies', desc: ['全員 HP 與 MP 全滿', 'Fully restores everyone'] },
  remedy:     { name: ['萬能藥', 'Remedy'], price: 90, use: 'cureall', target: 'ally', desc: ['解除所有異常狀態', 'Cures every ailment'] },
  echoherb:   { name: ['迴音草', 'Echo Herb'], price: 30, use: 'cure', cures: ['silence'], target: 'ally', desc: ['解除沉默', 'Cures silence'] },
  burnsalve:  { name: ['燙傷藥', 'Burn Salve'], price: 30, use: 'cure', cures: ['burn', 'freeze'], target: 'ally', desc: ['解除灼傷與凍結', 'Cures burns and freezing'] },
  holywater:  { name: ['聖水', 'Holy Water'], price: 120, use: 'cure', cures: ['doom', 'poison'], target: 'ally', desc: ['解除死亡宣告與中毒', 'Lifts doom and poison'] },
  smokebomb:  { name: ['煙霧彈', 'Smoke Bomb'], price: 50, use: 'escape', target: 'none', desc: ['從非頭目戰鬥中一定能逃走', 'Always escape a battle that is not against a guardian'] },
  firebomb:   { name: ['火焰瓶', 'Fire Flask'], price: 80, use: 'bomb', el: 'fire', power: 140, target: 'enemies', desc: ['對全體敵人造成火屬性傷害', 'Fire damage to all foes'] },
  icebomb:    { name: ['寒冰瓶', 'Frost Flask'], price: 80, use: 'bomb', el: 'ice', power: 140, target: 'enemies', desc: ['對全體敵人造成冰屬性傷害', 'Ice damage to all foes'] },
  boltbomb:   { name: ['雷電瓶', 'Thunder Flask'], price: 80, use: 'bomb', el: 'bolt', power: 140, target: 'enemies', desc: ['對全體敵人造成雷屬性傷害', 'Bolt damage to all foes'] },
  windbomb:   { name: ['旋風瓶', 'Gale Flask'], price: 90, use: 'bomb', el: 'wind', power: 150, target: 'enemies', desc: ['對全體敵人造成風屬性傷害', 'Wind damage to all foes'] },
  holybomb:   { name: ['聖光瓶', 'Holy Flask'], price: 120, use: 'bomb', el: 'holy', power: 170, target: 'enemies', desc: ['對全體敵人造成聖屬性傷害', 'Holy damage to all foes'] },
  speedtonic: { name: ['疾風藥', 'Swift Tonic'], price: 60, use: 'buff', stat: 'agi', target: 'ally', desc: ['戰鬥中提升速度', 'Raises speed in battle'] },
  powertonic: { name: ['怪力藥', 'Power Tonic'], price: 60, use: 'buff', stat: 'str', target: 'ally', desc: ['戰鬥中提升攻擊力', 'Raises attack in battle'] },
  guardtonic: { name: ['鐵壁藥', 'Guard Tonic'], price: 60, use: 'buff', stat: 'def', target: 'ally', desc: ['戰鬥中提升防禦力', 'Raises defence in battle'] },
  // food: eat it in battle for HP, or from the menu as a meal whose effect lasts several battles
  fishstew:   { name: ['鮮魚燉湯', 'Fish Stew'], price: 60, use: 'heal', power: 160, target: 'ally', food: true, meal: { regen: true }, desc: ['回復 160 HP。當餐點：戰鬥中每回合回復 HP', 'Restores 160 HP. As a meal: HP back every round in battle'] },
  seaskewer:  { name: ['海鮮串燒', 'Sea Skewer'], price: 90, use: 'heal', power: 240, target: 'ally', food: true, meal: { str: 1.15 }, desc: ['回復 240 HP。當餐點：攻擊力上升', 'Restores 240 HP. As a meal: attack up'] },
  mushsoup:   { name: ['蘑菇濃湯', 'Mushroom Soup'], price: 80, use: 'mp', power: 40, target: 'ally', food: true, meal: { mag: 1.15 }, desc: ['回復 40 MP。當餐點：魔力上升', 'Restores 40 MP. As a meal: magic up'] },
  herbsalad:  { name: ['藥草沙拉', 'Herb Salad'], price: 70, use: 'cureall', heal: 80, target: 'ally', food: true, meal: { def: 1.15 }, desc: ['解除異常並回復 80 HP。當餐點：防禦力上升', 'Cures ailments and restores 80 HP. As a meal: defence up'] },
  steak:      { name: ['獵人排餐', "Hunter's Steak"], price: 100, use: 'heal', power: 260, target: 'ally', food: true, meal: { str: 1.2 }, desc: ['回復 260 HP。當餐點：攻擊力大幅上升', 'Restores 260 HP. As a meal: attack well up'] },
  skybun:     { name: ['雲朵包', 'Cloud Bun'], price: 90, use: 'heal', power: 200, target: 'ally', food: true, meal: { agi: 1.2 }, desc: ['回復 200 HP。當餐點：速度上升', 'Restores 200 HP. As a meal: speed up'] },
  deepcurry:  { name: ['地底咖哩', 'Deep Curry'], price: 160, use: 'heal', power: 320, target: 'ally', food: true, meal: { str: 1.1, mag: 1.1, def: 1.1, agi: 1.1 }, desc: ['回復 320 HP。當餐點：所有能力上升', 'Restores 320 HP. As a meal: everything up'] },
  omelette:   { name: ['日出蛋包', 'Sunrise Omelette'], price: 120, use: 'heal', power: 300, target: 'ally', food: true, meal: { exp: 1.25 }, desc: ['回復 300 HP。當餐點：經驗值增加', 'Restores 300 HP. As a meal: more EXP'] },
  crystalcake:{ name: ['晶糖蛋糕', 'Crystal Cake'], price: 150, use: 'mp', power: 80, target: 'ally', food: true, meal: { jp: 1.3 }, desc: ['回復 80 MP。當餐點：JP 增加', 'Restores 80 MP. As a meal: more JP'] },
  eelrice:    { name: ['鰻魚飯', 'Eel Rice Bowl'], price: 110, use: 'mp', power: 60, target: 'ally', food: true, meal: { mag: 1.2 }, desc: ['回復 60 MP。當餐點：魔力大幅上升', 'Restores 60 MP. As a meal: magic well up'] },
  kingfeast:  { name: ['國王盛宴', "King's Feast"], price: 400, use: 'heal', power: 999, target: 'allies', food: true, meal: { str: 1.15, mag: 1.15, def: 1.15, agi: 1.15 }, desc: ['全員回復 999 HP。當餐點：所有能力大幅上升', 'Restores 999 HP to everyone. As a meal: everything well up'] },
  prismsushi: { name: ['稜光壽司', 'Prismfin Sushi'], price: 600, use: 'revive', power: 999, target: 'dead', food: true, meal: { str: 1.2, mag: 1.2, def: 1.2, agi: 1.2, regen: true }, desc: ['讓倒下的夥伴完全復活。當餐點：全能力上升並再生', 'Revives a friend at full HP. As a meal: everything up, with regen'] },
  // things monsters leave and the ground gives; cooks and smiths want them
  slimegel:   { name: ['史萊姆凝膠', 'Slime Gel'], price: 8, mat: true, desc: ['黏黏的。鍊金和料理都用得到。', 'Sticky. Good for brewing and cooking.'] },
  beastfang:  { name: ['獸牙', 'Beast Fang'], price: 14, mat: true, desc: ['鍛造材料。', 'A forging material.'] },
  toughhide:  { name: ['厚皮', 'Tough Hide'], price: 16, mat: true, desc: ['鍛造材料。', 'A forging material.'] },
  meat:       { name: ['野味肉', 'Game Meat'], price: 12, mat: true, desc: ['料理材料。', 'For cooking.'] },
  egg:        { name: ['大鳥蛋', 'Big Egg'], price: 14, mat: true, desc: ['料理材料。', 'For cooking.'] },
  feather:    { name: ['風之羽', 'Wind Feather'], price: 24, mat: true, desc: ['輕得像要飛走。鍛造材料。', 'So light it might fly away. A forging material.'] },
  scale:      { name: ['魚鱗', 'Fish Scale'], price: 18, mat: true, desc: ['鍛造材料。', 'A forging material.'] },
  coral:      { name: ['紅珊瑚', 'Red Coral'], price: 26, mat: true, desc: ['東方之海的珊瑚。鍛造材料。', 'Coral of the Eastern Sea. A forging material.'] },
  ecto:       { name: ['靈質', 'Ectoplasm'], price: 30, mat: true, desc: ['幽靈留下的冷冷的東西。', 'Something cold that ghosts leave behind.'] },
  sporecap:   { name: ['孢子菇', 'Spore Cap'], price: 12, mat: true, desc: ['料理材料。', 'For cooking.'] },
  cog:        { name: ['精密齒輪', 'Fine Cog'], price: 34, mat: true, desc: ['機關塔的零件。鍛造材料。', 'A part from the clockwork tower. A forging material.'] },
  dinobone:   { name: ['古龍骨', 'Ancient Bone'], price: 40, mat: true, desc: ['鍛造材料。', 'A forging material.'] },
  dragonscale:{ name: ['龍鱗', 'Dragon Scale'], price: 80, mat: true, desc: ['鍛造材料。', 'A forging material.'] },
  sunshard:   { name: ['日輪碎片', 'Sun Shard'], price: 70, mat: true, desc: ['正午之光凝成的碎片。', 'A sliver of frozen noon light.'] },
  shadowshard:{ name: ['影之碎片', 'Shadow Shard'], price: 90, mat: true, desc: ['冰冷的黑色結晶。', 'A cold black crystal.'] },
  glowmoss:   { name: ['光苔', 'Glowmoss'], price: 20, mat: true, desc: ['幽深地底發光的苔。料理材料。', 'Glowing moss from Hollowdeep. For cooking.'] },
  cloudberry: { name: ['雲莓', 'Cloudberry'], price: 20, mat: true, desc: ['只長在雲上群島的莓果。料理材料。', 'A berry that grows only on Cloudreach. For cooking.'] },
  copperore:  { name: ['銅礦', 'Copper Ore'], price: 16, mat: true, desc: ['鍛造材料。在山裡挖得到。', 'A forging material, dug in the hills.'] },
  silverore:  { name: ['銀礦', 'Silver Ore'], price: 40, mat: true, desc: ['鍛造材料。', 'A forging material.'] },
  mythril:    { name: ['秘銀', 'Mythril'], price: 90, mat: true, desc: ['輕又硬的金屬。幽深地底才有。', 'A light, hard metal found only in Hollowdeep.'] },
  goldore:    { name: ['金礦', 'Gold Ore'], price: 120, mat: true, desc: ['鍛造材料。也可以賣個好價錢。', 'A forging material, and it sells well.'] },
  adamant:    { name: ['精金', 'Adamantite'], price: 200, mat: true, desc: ['世界上最硬的金屬。稜晶深淵才有。', 'The hardest metal in the world, found in the Prism Abyss.'] },
  crystaldust:{ name: ['晶塵', 'Crystal Dust'], price: 50, mat: true, desc: ['挖礦時偶爾會找到的閃亮粉末。', 'A glittering powder sometimes found while mining.'] },
  // weapons of the east
  ironspear:  { name: ['鐵槍', 'Iron Spear'], price: 380, slot: 'weapon', kind: 'spear', atk: 18 },
  coraltrident:{ name: ['珊瑚三叉戟', 'Coral Trident'], price: 0, slot: 'weapon', kind: 'spear', atk: 28, el: 'water' },
  windlance:  { name: ['疾風長槍', 'Wind Lance'], price: 0, slot: 'weapon', kind: 'spear', atk: 34, agi: 4, el: 'wind' },
  dragonlance:{ name: ['屠龍槍', 'Dragon Lance'], price: 0, slot: 'weapon', kind: 'spear', atk: 44, str: 4, el: 'ice' },
  starpiercer:{ name: ['穿星槍', 'Starpiercer'], price: 0, slot: 'weapon', kind: 'spear', atk: 56, el: 'holy' },
  flintlock:  { name: ['燧發槍', 'Flintlock'], price: 420, slot: 'weapon', kind: 'gun', atk: 17 },
  gearrifle:  { name: ['齒輪步槍', 'Gear Rifle'], price: 980, slot: 'weapon', kind: 'gun', atk: 28 },
  stormcannon:{ name: ['雷暴砲', 'Storm Cannon'], price: 0, slot: 'weapon', kind: 'gun', atk: 38, el: 'bolt' },
  aethergun:  { name: ['以太槍', 'Aether Gun'], price: 0, slot: 'weapon', kind: 'gun', atk: 50, mag: 8 },
  mythrilsword:{ name: ['秘銀劍', 'Mythril Sword'], price: 0, slot: 'weapon', kind: 'sword', atk: 32 },
  coralsaber: { name: ['珊瑚彎刀', 'Coral Saber'], price: 1100, slot: 'weapon', kind: 'sword', atk: 28, el: 'water' },
  skyblade:   { name: ['天空之劍', 'Sky Blade'], price: 0, slot: 'weapon', kind: 'sword', atk: 38, agi: 4, el: 'wind' },
  duskblade:  { name: ['黃昏之劍', 'Dusk Blade'], price: 0, slot: 'weapon', kind: 'sword', atk: 46, el: 'dark', drain: true },
  prismedge:  { name: ['稜晶之刃', 'Prism Edge'], price: 0, slot: 'weapon', kind: 'sword', atk: 62, mag: 10, str: 6, el: 'holy' },
  coralrod:   { name: ['珊瑚杖', 'Coral Rod'], price: 1000, slot: 'weapon', kind: 'staff', atk: 8, mag: 18, el: 'water' },
  sagestaff:  { name: ['賢者之杖', "Sage's Staff"], price: 0, slot: 'weapon', kind: 'staff', atk: 10, mag: 28 },
  abyssrod:   { name: ['深淵之杖', 'Abyssal Rod'], price: 0, slot: 'weapon', kind: 'staff', atk: 12, mag: 38, el: 'dark' },
  mythrilknife:{ name: ['秘銀短刀', 'Mythril Knife'], price: 0, slot: 'weapon', kind: 'dagger', atk: 26, agi: 5 },
  windcutter: { name: ['風切', 'Windcutter'], price: 0, slot: 'weapon', kind: 'dagger', atk: 32, agi: 7, el: 'wind' },
  assassinblade:{ name: ['影刺', 'Shadowfang'], price: 0, slot: 'weapon', kind: 'dagger', atk: 44, agi: 8, el: 'dark' },
  gearhammer: { name: ['齒輪鎚', 'Gear Hammer'], price: 0, slot: 'weapon', kind: 'hammer', atk: 34, el: 'bolt' },
  titanmaul:  { name: ['泰坦巨鎚', 'Titan Maul'], price: 0, slot: 'weapon', kind: 'hammer', atk: 48, str: 5, el: 'earth' },
  skybow:     { name: ['天空之弓', 'Sky Bow'], price: 0, slot: 'weapon', kind: 'bow', atk: 34, el: 'wind' },
  coralbow:   { name: ['珊瑚弓', 'Coral Bow'], price: 1050, slot: 'weapon', kind: 'bow', atk: 29, el: 'water' },
  starbow:    { name: ['星之弓', 'Star Bow'], price: 0, slot: 'weapon', kind: 'bow', atk: 46, spr: 6, el: 'holy' },
  mythrilclaws:{ name: ['秘銀爪', 'Mythril Claws'], price: 0, slot: 'weapon', kind: 'fist', atk: 34 },
  dragonfists:{ name: ['龍爪', 'Dragon Claws'], price: 0, slot: 'weapon', kind: 'fist', atk: 46, el: 'fire' },
  // armour and charms of the east
  mythrilmail:{ name: ['秘銀鎧', 'Mythril Mail'], price: 0, slot: 'armor', def: 28 },
  coralscale: { name: ['珊瑚鱗甲', 'Coral Scale'], price: 1200, slot: 'armor', def: 24, res: ['water'] },
  skyrobe:    { name: ['雲之法衣', 'Cloud Robe'], price: 0, slot: 'armor', def: 20, spr: 8, mag: 4, res: ['wind'] },
  deepplate:  { name: ['地底重鎧', 'Deep Plate'], price: 0, slot: 'armor', def: 36, res: ['earth'] },
  noonregalia:{ name: ['正午王袍', 'Noon Regalia'], price: 0, slot: 'armor', def: 38, spr: 8, res: ['holy', 'fire'] },
  duskarmor:  { name: ['黃昏鎧', 'Dusk Armour'], price: 0, slot: 'armor', def: 42, res: ['dark'] },
  chefapron:  { name: ['主廚圍裙', "Chef's Apron"], price: 0, slot: 'armor', def: 18, spr: 6, immune: ['burn'] },
  voidmail:   { name: ['虛空鎧', 'Void Mail'], price: 0, slot: 'armor', def: 52, spr: 10, res: ['dark', 'ice', 'fire', 'bolt'] },
  silencecharm:{ name: ['靜謐護符', 'Echo Charm'], price: 500, slot: 'acc', spr: 3, immune: ['silence'] },
  firering:   { name: ['抗火戒指', 'Fireward Ring'], price: 600, slot: 'acc', res: ['fire'] },
  windring:   { name: ['風之戒指', 'Wind Ring'], price: 0, slot: 'acc', agi: 3, res: ['wind'] },
  darkward:   { name: ['破暗護符', 'Darkward'], price: 0, slot: 'acc', spr: 4, res: ['dark'] },
  deathward:  { name: ['護命符', 'Lifeward'], price: 0, slot: 'acc', spr: 4, immune: ['doom'] },
  hermes:     { name: ['飛翼靴', 'Winged Boots'], price: 0, slot: 'acc', agi: 8, hasteStart: true },
  goldcharm:  { name: ['招財貓', 'Lucky Cat'], price: 0, slot: 'acc', goldUp: true, desc: ['戰鬥得到的金幣增加五成。', 'Battles give half as much gold again.'] },
  expcharm:   { name: ['勤學護符', "Scholar's Charm"], price: 0, slot: 'acc', expUp: true, desc: ['戰鬥得到的經驗值增加三成。', 'Battles give 30% more EXP.'] },
  angelring:  { name: ['天使之戒', 'Angel Ring'], price: 0, slot: 'acc', spr: 4, reraise: true, desc: ['每場戰鬥第一次倒下時會自動復活。', 'Brings you back the first time you fall in each battle.'] },
  seacharm:   { name: ['海鷗羽飾', 'Gull Charm'], price: 0, slot: 'acc', agi: 2, seaCalm: true, desc: ['航海時比較不會遇到海怪。', 'Sea monsters trouble the ship less often.'] },
  tidering:   { name: ['潮汐之戒', 'Tide Ring'], price: 0, slot: 'acc', mag: 8, spr: 4, res: ['water'] },
  dragonheart_acc: { name: ['龍之心臟', 'Dragonheart'], price: 0, slot: 'acc', str: 7, mag: 7 },
  prismcrown: { name: ['稜晶之冠', 'Prism Crown'], price: 0, slot: 'acc', str: 8, mag: 8, spr: 8, agi: 8, def: 8, immune: ['poison', 'sleep', 'stun', 'slow', 'blind', 'silence', 'burn', 'freeze', 'doom'] },
  // things that matter on the journey
  boat:       { name: ['帆船「漫遊者號」', 'The Wanderer (ship)'], key: true, desc: ['妮娜的船。在碼頭或停船處按 E 上船，駛向陸地就會上岸。', "Nina's ship. Press E at a dock or beside it to board; sail into land to go ashore."] },
  pickaxe:    { name: ['十字鎬', 'Pickaxe'], key: true, desc: ['在閃亮的礦脈旁按 E 挖礦。', 'Press E by a glittering ore vein to mine it.'] },
  recipebook: { name: ['食譜', 'Recipe Book'], key: true, desc: ['可以從選單的「料理」做菜。', 'Lets you cook from Cooking in the menu.'] },
  arenapass:  { name: ['競技場通行證', 'Arena Pass'], key: true, desc: ['鹽灣港競技場的參賽證。', 'Entry pass for the Saltmere Arena.'] },
  tmap1: { name: ['藏寶圖：霧沼', 'Treasure Map: Mistfen'], key: true, tmap: 1, desc: ['地圖上用紅色的 ✕ 標著一個地方。到那裡按 E 挖挖看。', 'A red X marks a spot. Go there and press E to dig.'] },
  tmap2: { name: ['藏寶圖：赤砂', 'Treasure Map: Redsand'], key: true, tmap: 2, desc: ['地圖上用紅色的 ✕ 標著一個地方。到那裡按 E 挖挖看。', 'A red X marks a spot. Go there and press E to dig.'] },
  tmap3: { name: ['藏寶圖：霜原', 'Treasure Map: Rimefield'], key: true, tmap: 3, desc: ['地圖上用紅色的 ✕ 標著一個地方。到那裡按 E 挖挖看。', 'A red X marks a spot. Go there and press E to dig.'] },
  tmap4: { name: ['藏寶圖：低語林', 'Treasure Map: Whisperwood'], key: true, tmap: 4, desc: ['地圖上用紅色的 ✕ 標著一個地方。到那裡按 E 挖挖看。', 'A red X marks a spot. Go there and press E to dig.'] },
  tmap5: { name: ['藏寶圖：珊瑚群島', 'Treasure Map: Coral Isles'], key: true, tmap: 5, desc: ['地圖上用紅色的 ✕ 標著一個地方。到那裡按 E 挖挖看。', 'A red X marks a spot. Go there and press E to dig.'] },
  tmap6: { name: ['藏寶圖：雲上', 'Treasure Map: Cloudreach'], key: true, tmap: 6, desc: ['地圖上用紅色的 ✕ 標著一個地方。到那裡按 E 挖挖看。', 'A red X marks a spot. Go there and press E to dig.'] },
  tmap7: { name: ['藏寶圖：幽深地底', 'Treasure Map: Hollowdeep'], key: true, tmap: 7, desc: ['地圖上用紅色的 ✕ 標著一個地方。到那裡按 E 挖挖看。', 'A red X marks a spot. Go there and press E to dig.'] },
  tmap8: { name: ['藏寶圖：古都', 'Treasure Map: Old Lumera'], key: true, tmap: 8, desc: ['地圖上用紅色的 ✕ 標著一個地方。到那裡按 E 挖挖看。', 'A red X marks a spot. Go there and press E to dig.'] },
  // things people ask for
  rainbowshell:{ name: ['彩虹貝', 'Rainbow Shell'], quest: true, desc: ['白貝海岸偶爾撿得到的七彩貝殼。', 'A shell of every colour, sometimes found on Shellshore.'] },
  locket:     { name: ['舊墜子', 'Old Locket'], quest: true, desc: ['裡面嵌著一張褪色的畫像。', 'Inside is a faded little portrait.'] },
  journalpage:{ name: ['登山日記的一頁', 'Journal Page'], quest: true, desc: ['被風吹散的登山日記。', 'A page from a climbing journal, scattered by the wind.'] },
  logbook:    { name: ['航海日誌', "Ship's Log"], quest: true, desc: ['「海鷗之翼號」的航海日誌。', 'The log of the Gull\'s Wing.'] },
  musicbox:   { name: ['薇爾的音樂盒', 'Music Box of Vael'], quest: true, desc: ['打開會流出一首很老的歌。', 'Opened, it plays a very old song.'] },
  memcog:     { name: ['記憶齒輪', 'Memory Cog'], quest: true, desc: ['七號遺失的記憶零件。', 'A memory part Unit 7 has lost.'] },
  couragefeather:{ name: ['勇氣之羽', 'Feather of Courage'], quest: true, desc: ['天空之巢的雛鳥需要它。', 'The fledgling of Skyhaven needs these.'] },
  fossil:     { name: ['化石', 'Fossil'], quest: true, desc: ['掘地人的收藏家想要它。', "The Delvers' collector wants these."] },
  deepshroom: { name: ['深淵菇', 'Abyss Morel'], quest: true, desc: ['幽深地底的稀有菇。菇林隱士想要它。', 'A rare mushroom from Hollowdeep. The hermit of the grove wants it.'] },
};
Object.assign(ITEMS, bilingual(NEW_ITEMS));
// what each new shop sells, and a few new wares in old shops
Object.assign(SHOPS, {
  tidehaven: ['hipotion', 'megapotion', 'hiether', 'phoenix', 'remedy', 'echoherb', 'burnsalve', 'smokebomb', 'icebomb', 'boltbomb', 'tent', 'ironspear', 'coralsaber', 'coralrod', 'coralbow', 'coralscale', 'silencecharm', 'firering'],
  cogwick: ['hipotion', 'xpotion', 'hiether', 'phoenix', 'remedy', 'burnsalve', 'firebomb', 'boltbomb', 'speedtonic', 'powertonic', 'guardtonic', 'tent', 'flintlock', 'gearrifle', 'ironspear', 'coralscale'],
  skyhaven: ['xpotion', 'megapotion', 'hiether', 'phoenix', 'remedy', 'windbomb', 'speedtonic', 'tent', 'ironspear', 'gearrifle', 'coralbow', 'silencecharm'],
  delvers: ['xpotion', 'megapotion', 'hiether', 'phoenix', 'remedy', 'holywater', 'holybomb', 'icebomb', 'guardtonic', 'tent', 'gearrifle', 'coralsaber', 'coralrod'],
});
SHOPS.saltmere.push('remedy', 'echoherb', 'smokebomb');
SHOPS.dunewell.push('remedy', 'smokebomb', 'firebomb');
SHOPS.frostgate.push('remedy', 'burnsalve', 'icebomb');

// ---------- cooking: what goes into each dish ----------
export const RECIPES = [
  ['fishstew', [['carp', 2]]], ['herbsalad', [['moonherb', 2]]], ['mushsoup', [['glowcap', 1], ['sporecap', 1]]], ['steak', [['meat', 2]]],
  ['seaskewer', [['bream', 1], ['scale', 1]]], ['eelrice', [['sandeel', 1], ['egg', 1]]], ['omelette', [['egg', 2]]], ['skybun', [['cloudberry', 2], ['egg', 1]]],
  ['crystalcake', [['egg', 1], ['crystaldust', 1], ['cloudberry', 1]]], ['deepcurry', [['meat', 1], ['sporecap', 1], ['glowmoss', 1]]],
  ['kingfeast', [['goldkoi', 1], ['meat', 2], ['egg', 1]]], ['prismsushi', [['prismfish', 1]]],
];
// ---------- forging: what a smith needs for each piece (and a fee) ----------
export const FORGE = [
  ['mythrilsword', [['mythril', 2], ['beastfang', 2]], 600], ['mythrilknife', [['mythril', 1], ['beastfang', 2]], 400], ['mythrilclaws', [['mythril', 2], ['toughhide', 1]], 500],
  ['mythrilmail', [['mythril', 3], ['toughhide', 2]], 800], ['skyblade', [['silverore', 2], ['feather', 3]], 900], ['skybow', [['feather', 4], ['silverore', 1]], 800],
  ['windcutter', [['feather', 3], ['mythril', 1]], 900], ['skyrobe', [['feather', 4], ['cloudberry', 2]], 700], ['stormcannon', [['cog', 4], ['silverore', 2]], 1200],
  ['dragonlance', [['dragonscale', 3], ['mythril', 2]], 1500], ['deepplate', [['dinobone', 3], ['mythril', 2]], 1300], ['sagestaff', [['crystaldust', 2], ['goldore', 1]], 1100],
  ['windring', [['feather', 2], ['silverore', 1]], 500], ['darkward', [['shadowshard', 1], ['silverore', 1]], 700], ['deathward', [['ecto', 3], ['goldore', 1]], 900],
  ['hermes', [['feather', 5], ['goldore', 1]], 1400], ['duskarmor', [['shadowshard', 3], ['adamant', 1]], 2200], ['abyssrod', [['shadowshard', 3], ['crystaldust', 2]], 2000],
  ['starpiercer', [['adamant', 3], ['sunshard', 2]], 3200], ['voidmail', [['adamant', 4], ['shadowshard', 3]], 3600], ['dragonheart_acc', [['dragonscale', 2], ['goldore', 2]], 1600],
  ['angelring', [['sunshard', 2], ['feather', 4], ['goldore', 1]], 2400],
];
// ---------- the Saltmere arena: three fights a rank, each team fixed ----------
export const ARENA = [
  { rank: 'E', fights: [['slime', 'bunny', 'chick'], ['hog', 'hog'], ['caterpillar', 'monkey', 'orc']], prize: ['hipotion', 3], gold: 300 },
  { rank: 'D', fights: [['bogslime', 'bogfrog', 'minion'], ['lion', 'scorpion'], ['woodogre', 'orc', 'orc']], prize: ['goldcharm', 1], gold: 800 },
  { rank: 'C', fights: [['golem', 'skelmage'], ['ridgeogre', 'yeti'], ['vampire', 'zombie', 'skelrogue']], prize: ['expcharm', 1], gold: 1600 },
  { rank: 'B', fights: [['magmagolem', 'emberimp', 'emberwisp'], ['crysgolem', 'spiredemon'], ['razorfin', 'ironcatfish', 'gloomfish']], prize: ['hermes', 1], gold: 3000 },
  { rank: 'A', fights: [['raptor', 'raptor', 'cavefrog'], ['steamgolem', 'gearmech'], ['brassgiant', 'fungallord']], prize: ['angelring', 1], gold: 6000 },
  { rank: 'S', fights: [['voidspecter', 'echomask', 'abyssfiend'], ['umbralogre', 'voidwalker'], ['champion']], prize: ['prismcrown', 1], gold: 12000 },
];
