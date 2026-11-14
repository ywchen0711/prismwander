// 晶境漫遊 Prismwander, for climbers: seeds that make a hero stronger for good, the gear found at the top of the
// hardest climbs, and the prizes for reaching many of them.
import { bilingual } from './i18n.js';
import { ITEMS } from './data.js';

const SEEDS = {
  powerseed:  { name: ['力量種子', 'Power Seed'], price: 0, use: 'seed', stat: 'str', power: 2, target: 'ally', desc: ['吃下去，力量永久 +2。', 'Eat it for +2 STR, for good.'] },
  guardseed:  { name: ['守護種子', 'Guard Seed'], price: 0, use: 'seed', stat: 'def', power: 2, target: 'ally', desc: ['吃下去，體格永久 +2。', 'Eat it for +2 DEF, for good.'] },
  mindseed:   { name: ['智慧種子', 'Mind Seed'], price: 0, use: 'seed', stat: 'mag', power: 2, target: 'ally', desc: ['吃下去，魔力永久 +2。', 'Eat it for +2 MAG, for good.'] },
  spiritseed: { name: ['精神種子', 'Spirit Seed'], price: 0, use: 'seed', stat: 'spr', power: 2, target: 'ally', desc: ['吃下去，精神永久 +2。', 'Eat it for +2 SPR, for good.'] },
  swiftseed:  { name: ['疾風種子', 'Swift Seed'], price: 0, use: 'seed', stat: 'agi', power: 2, target: 'ally', desc: ['吃下去，速度永久 +2。', 'Eat it for +2 AGI, for good.'] },
  lifeseed:   { name: ['生命種子', 'Life Seed'], price: 0, use: 'seed', stat: 'hp', power: 12, target: 'ally', desc: ['吃下去，最大 HP 永久 +12。', 'Eat it for +12 max HP, for good.'] },
  manaseed:   { name: ['魔力種子', 'Mana Seed'], price: 0, use: 'seed', stat: 'mp', power: 6, target: 'ally', desc: ['吃下去，最大 MP 永久 +6。', 'Eat it for +6 max MP, for good.'] },
  jpseed:     { name: ['晶芽種子', 'Crystal Sprout'], price: 0, use: 'jpseed', power: 400, target: 'ally', desc: ['發著淡光的種子。吃下去，主職業得到 400 JP。', 'A faintly glowing seed. Eat it and your main job gains 400 JP.'] },
};
// what waits at the top of the climbs
const GEAR = {
  peakblade:    { name: ['山巔之劍', 'Summit Blade'], price: 0, slot: 'weapon', kind: 'sword', atk: 36, agi: 4, el: 'wind', desc: ['在最高的岩頂上找到的劍，劍身上刻著風的紋路。', 'A sword found on the highest crag, its blade etched with the shapes of wind.'] },
  cragmaul:     { name: ['岩峰巨鎚', 'Crag Maul'], price: 0, slot: 'weapon', kind: 'hammer', atk: 40, def: 4, el: 'earth' },
  featherstaff: { name: ['羽翼之杖', 'Featherstaff'], price: 0, slot: 'weapon', kind: 'staff', atk: 8, mag: 26, agi: 4, el: 'wind' },
  swallowbow:   { name: ['燕子弓', 'Swallow Bow'], price: 0, slot: 'weapon', kind: 'bow', atk: 38, agi: 6, el: 'wind' },
  cliffclaws:   { name: ['攀岩爪', 'Cliff Claws'], price: 0, slot: 'weapon', kind: 'fist', atk: 36, agi: 4 },
  ridgespear:   { name: ['稜線之槍', 'Ridge Spear'], price: 0, slot: 'weapon', kind: 'spear', atk: 38, el: 'wind' },
  roofrunner:   { name: ['屋頂飛賊的短劍', "Roof-runner's Knife"], price: 0, slot: 'weapon', kind: 'dagger', atk: 24, agi: 6, stealUp: true },
  skyplate:     { name: ['天空鎧', 'Sky Plate'], price: 0, slot: 'armor', def: 34, agi: 4, res: ['wind'] },
  climbercoat:  { name: ['攀登者外套', "Climber's Coat"], price: 0, slot: 'armor', def: 20, agi: 5 },
  climbergloves:{ name: ['攀登手套', "Climber's Gloves"], price: 0, slot: 'acc', str: 5, agi: 5, desc: ['爬過十個難關的證明。', 'Proof of ten hard climbs.'] },
  skyrunner:    { name: ['天行腰帶', 'Skyrunner Sash'], price: 0, slot: 'acc', agi: 10, first: true, desc: ['爬過二十個難關的證明。繫上它，腳步輕得像要飛起來。', 'Proof of twenty hard climbs. Wear it and your feet feel ready to fly.'] },
  summitcrown:  { name: ['登頂者之冠', "Summiteer's Crown"], price: 0, slot: 'acc', str: 8, mag: 8, def: 8, spr: 8, agi: 8, first: true, desc: ['登上所有難關頂端的人才能戴的冠。', 'A crown for one who has stood atop every hard climb.'] },
};
Object.assign(ITEMS, bilingual({ ...SEEDS, ...GEAR }));
// prizes for reaching many climbs: [how many, item, count]; Infinity means all of them
export const PARKOUR_REWARDS = [[5, 'jpseed', 2], [10, 'climbergloves', 1], [15, 'lifeseed', 3], [20, 'skyrunner', 1], [25, 'jpseed', 4], [Infinity, 'summitcrown', 1]];
