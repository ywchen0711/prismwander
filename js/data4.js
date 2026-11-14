// 晶境漫遊 Prismwander, for the long road: dishes from the new materials, three hunts that wait until the shadow is at
// rest, rewards for filling the bestiary and for mastering jobs, and the bounties of the Saltmere hunt board.
import { bilingual } from './i18n.js';
import { ITEMS, MONSTERS, TECHS, extendAffinity } from './data.js';
import { RECIPES } from './data2.js';
import { DROPS, FIELD_LINES } from './data3.js';

// ---------- dishes ----------
// meals can now also bring more gold (gold) and better drops (luck)
const FOOD = {
  ambercandy: { name: ['琥珀糖', 'Amber Candy'], price: 70, use: 'mp', power: 40, target: 'ally', food: true, meal: { mag: 1.1, jp: 1.1 }, desc: ['樹脂熬成的硬糖，含著會讓腦袋變清楚。', 'A hard candy boiled from resin; it clears the head.'] },
  spicejerky: { name: ['火辣肉乾', 'Spiced Jerky'], price: 110, use: 'heal', power: 280, target: 'ally', food: true, meal: { str: 1.15 }, desc: ['用餘燼核烘乾的肉乾。辣到冒汗。', 'Jerky dried over an ember core. Hot enough to make you sweat.'] },
  frostsorbet: { name: ['寒霜冰沙', 'Frost Sorbet'], price: 100, use: 'mp', power: 60, target: 'ally', food: true, meal: { def: 1.1, mag: 1.1 }, desc: ['寒霜核刨成的冰，淋上雲莓醬。', 'Ice shaved from a frost core, with cloudberry syrup.'] },
  stormsoda: { name: ['雷暴汽水', 'Storm Soda'], price: 100, use: 'mp', power: 50, target: 'ally', food: true, meal: { agi: 1.2 }, desc: ['喝下去舌頭會劈啪作響。', 'Your tongue crackles as you drink it.'] },
  pearlchowder: { name: ['珍珠海鮮濃湯', 'Pearl Chowder'], price: 180, use: 'heal', power: 360, target: 'ally', food: true, meal: { def: 1.15, gold: 1.3 }, desc: ['加了一顆真珍珠的濃湯。吃完覺得自己很有錢。', 'A chowder with a real pearl in it. You feel rich afterwards.'] },
  fluffcake: { name: ['雲朵蛋糕', 'Cloud Cake'], price: 130, use: 'heal', power: 250, target: 'ally', food: true, meal: { agi: 1.1, exp: 1.2 }, desc: ['輕得像要飄走的蛋糕。', 'A cake so light it might float off.'] },
  venombroth: { name: ['解毒菇湯', 'Antidote Broth'], price: 90, use: 'cureall', heal: 120, target: 'ally', food: true, meal: { regen: true }, desc: ['以毒攻毒。意外地好喝。', 'Fight poison with poison. Surprisingly tasty.'] },
  spirittea: { name: ['靈光茶', 'Spirit Tea'], price: 140, use: 'mp', power: 80, target: 'ally', food: true, meal: { mag: 1.2 }, desc: ['靈質和光苔泡的茶。喝了會看到奇怪的東西。', 'Tea of ectoplasm and glowmoss. You may see strange things.'] },
  dinoroast: { name: ['古龍烤肉', 'Dino Roast'], price: 220, use: 'heal', power: 450, target: 'ally', food: true, meal: { str: 1.2, def: 1.1 }, desc: ['用古龍骨熬汁的烤肉。份量驚人。', 'A roast basted with ancient bone broth. Enormous.'] },
  starjelly: { name: ['星屑果凍', 'Star Jelly'], price: 300, use: 'elixir', target: 'ally', food: true, meal: { jp: 1.4 }, desc: ['裡面閃著星之碎片的果凍。', 'A jelly with a star fragment twinkling inside.'] },
  hunterplatter: { name: ['獵人拼盤', "Hunter's Platter"], price: 200, use: 'heal', power: 400, target: 'ally', food: true, meal: { exp: 1.3, gold: 1.2 }, desc: ['肉、蛋和魚，獵人的最愛。', 'Meat, egg and fish: a hunter\'s favourite.'] },
  cloversalad: { name: ['幸運沙拉', 'Lucky Salad'], price: 160, use: 'cureall', heal: 200, target: 'ally', food: true, meal: { luck: 1.3 }, desc: ['吃了之後，好東西好像比較容易掉下來。', 'Eat it and good things seem to fall your way.'] },
  voidstew: { name: ['虛空燉肉', 'Void Stew'], price: 500, use: 'heal', power: 999, target: 'allies', food: true, meal: { str: 1.2, mag: 1.2, def: 1.2, agi: 1.2, jp: 1.2 }, desc: ['用虛空核燉的肉。不要盯著湯看。', 'Meat stewed over a void core. Do not stare into the broth.'] },
};
// ---------- rewards and the gear of the last hunts ----------
const GEAR = {
  mastersash: { name: ['師範腰帶', "Master's Sash"], price: 0, slot: 'acc', str: 5, mag: 5, def: 5, spr: 5, agi: 5, desc: ['精通六個職業的證明。', 'Proof of six jobs mastered.'] },
  wanderstar: { name: ['漫遊之星', "Wanderer's Star"], price: 0, slot: 'acc', str: 10, mag: 10, def: 10, spr: 10, agi: 10, jpUp: true, expUp: true, desc: ['精通二十四個職業的人才能戴上的星。', 'A star only those with twenty-four masteries may wear.'] },
  hunterbadge: { name: ['獵人徽章', "Hunter's Badge"], price: 0, slot: 'acc', str: 6, agi: 6, luck: true, goldUp: true, desc: ['認識了大半魔物的獵人的徽章。', 'The badge of a hunter who knows most monsters.'] },
  collectorcrown: { name: ['收藏家之冠', "Collector's Crown"], price: 0, slot: 'acc', str: 8, mag: 8, def: 8, spr: 8, agi: 8, luck: true, regen: true, desc: ['打倒過所有魔物的證明。', 'Proof of every monster defeated.'] },
  aurorawing: { name: ['極光之翼', 'Aurora Wing'], price: 0, slot: 'acc', agi: 10, spr: 6, res: ['wind', 'ice', 'bolt'], first: true, drop: true },
  sporecrown: { name: ['菌絲之冠', 'Spore Crown'], price: 0, slot: 'acc', spr: 10, mag: 6, regen: true, immune: ['poison', 'sleep', 'blind'], drop: true },
  stareaterblade: { name: ['吞星劍', 'Star-Eater'], price: 0, slot: 'weapon', kind: 'sword', atk: 70, mag: 10, drain: true, drop: true },
  aurorabow: { name: ['極光弓', 'Aurora Bow'], price: 0, slot: 'weapon', kind: 'bow', atk: 58, agi: 6, el: 'ice', drop: true },
  myceliumstaff: { name: ['菌絲杖', 'Mycelium Staff'], price: 0, slot: 'weapon', kind: 'staff', atk: 14, mag: 44, el: 'earth', drop: true },
  starmail: { name: ['星辰鎧', 'Starmail'], price: 0, slot: 'armor', def: 56, spr: 12, res: ['holy', 'dark'], immune: ['doom'], drop: true },
};
Object.assign(ITEMS, bilingual({ ...FOOD, ...GEAR }));
RECIPES.push(
  ['ambercandy', [['resin', 2]]], ['spicejerky', [['meat', 1], ['embercore', 1]]], ['frostsorbet', [['frostcore', 1], ['cloudberry', 1]]], ['stormsoda', [['stormcore', 1], ['cloudberry', 1]]],
  ['pearlchowder', [['pearl', 1], ['scale', 1], ['carp', 1]]], ['fluffcake', [['egg', 1], ['fluff', 1], ['cloudberry', 1]]], ['venombroth', [['venomsac', 1], ['sporecap', 1]]], ['spirittea', [['ecto', 1], ['glowmoss', 1]]],
  ['dinoroast', [['meat', 2], ['dinobone', 1]]], ['starjelly', [['slimegel', 2], ['starshard', 1]]], ['hunterplatter', [['meat', 1], ['egg', 1], ['trout', 1]]], ['cloversalad', [['moonherb', 1], ['glowmoss', 1], ['cloudberry', 1]]],
  ['voidstew', [['voidcore', 1], ['meat', 2], ['glowmoss', 1]]],
);

// ---------- three hunts for after the shadow is at rest ----------
const NEW_TECHS = {
  aurora: { name: ['極光', 'Aurora'], kind: 'magic', power: 60, el: 'holy', target: 'all' },
  sporestorm: { name: ['孢子風暴', 'Spore Storm'], kind: 'status', status: 'sleep', target: 'one' },
  starswallow: { name: ['吞星', 'Swallow the Stars'], kind: 'magic', power: 70, el: 'dark', target: 'all' },
};
Object.assign(TECHS, bilingual(NEW_TECHS, ['name']));
// need: a story flag that must be set before they show themselves
const BOSSES = {
  auroradrake: { name: ['極光古龍', 'The Aurora Wyrm'], model: 'quat/Dragon_Evolved', tint: '#b8ffe8', lv: 64, v2: true, boss: true, field: true, post: true, need: 'umbra', hp: 9, agi: 1.2, acts: [['atk', 2], ['aurora', 1], ['icestorm', 1], ['gale', 1], ['roar', 1]], kind: 'dragon', fly: true },
  myceliumking: { name: ['菌絲之王', 'The Mycelium King'], model: 'quat/Mushroom_King', tint: '#50ff98', lv: 62, v2: true, boss: true, field: true, post: true, need: 'umbra', hp: 9, acts: [['atk', 2], ['sporestorm', 1], ['poison', 1], ['rockfall', 1], ['devour', 1], ['heal', 1]], kind: 'fungus' },
  stareater: { name: ['吞星者', 'The Star-Eater'], model: 'quat/Giant', tint: '#2a2a6a', lv: 66, v2: true, boss: true, field: true, post: true, need: 'umbra', hp: 10, atk: 1.2, acts: [['atk', 3], ['starswallow', 1], ['darkwave', 1], ['doom', 1], ['roar', 1]], kind: 'shadow' },
};
Object.assign(MONSTERS, bilingual(BOSSES, ['name']));
extendAffinity({ auroradrake: 'dragon', myceliumking: 'fungus', stareater: 'shadow' }, {});
Object.assign(DROPS, {
  auroradrake: { c: ['aurorawing', 1], r: ['aurorabow', 0.5], steal: 'megalixir' },
  myceliumking: { c: ['sporecrown', 1], r: ['myceliumstaff', 0.5], steal: 'megalixir' },
  stareater: { c: ['stareaterblade', 1], r: ['starmail', 0.5], steal: 'megalixir' },
});
Object.assign(FIELD_LINES, bilingual({
  auroradrake: { name: ['極光古龍', 'The Aurora Wyrm'], line: ['（天空的盡頭亮起了七彩的光。一條古老的龍，從光裡降了下來。）', '(Colours bloom at the edge of the sky. An ancient dragon descends out of the light.)'] },
  myceliumking: { name: ['菌絲之王', 'The Mycelium King'], line: ['（四周的菇一起轉向你們。整個洞穴，好像在呼吸。）', '(Every mushroom around turns toward you at once. The whole cave seems to breathe.)'] },
  stareater: { name: ['吞星者', 'The Star-Eater'], line: ['（頭頂的星星一顆一顆暗了下去。巨大的影子張開了嘴。）', '(Overhead, the stars go out one by one. A vast shadow opens its mouth.)'] },
}, ['name', 'line']));
export const POST_AT = { auroradrake: 'cloud', myceliumking: 'deep', stareater: 'spire' };

// ---------- rewards for the bestiary (distinct monsters defeated) and for masteries (across the party) ----------
export const BOOK_REWARDS = [[20, 'hipotion', 5], [50, 'expcharm', 1], [80, 'clover', 1], [120, 'megalixir', 3], [150, 'hunterbadge', 1], [Infinity, 'collectorcrown', 1]];
export const MASTERY_REWARDS = [[3, 'megalixir', 2], [6, 'mastersash', 1], [12, 'ribbon', 1], [24, 'wanderstar', 1]];

// ---------- bounties: the hunt board in Saltmere ----------
// [target, gold, item, count]; post: only after the shadow is at rest
export const HUNTS = [
  ['goldjelly', 600, 'hipotion', 3], ['boarking', 800, 'powerring', 1], ['silvergolem', 1500, 'mythril', 2], ['sandcolossus', 1500, 'quickcharm', 1],
  ['glacius', 2500, 'frostband', 1], ['prismslime', 2500, 'crystalcake', 2], ['glutton', 3500, 'pearlbrooch', 1], ['goldcog', 4000, 'xpotion', 3],
  ['elderhare', 4000, 'elixir', 2], ['stormroc', 5000, 'stormband', 1], ['hollowwyrm', 7000, 'trollhide', 1], ['shadowprism', 8000, 'megalixir', 2],
  ['nameless', 12000, 'starcharm', 1], ['auroradrake', 15000, 'angelring', 1, true], ['myceliumking', 15000, 'ribbon', 1, true], ['stareater', 20000, 'voidmail', 1, true],
];
