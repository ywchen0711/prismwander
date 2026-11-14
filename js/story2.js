// 晶境漫遊 Prismwander, Acts II and III and everything around them. After the Prism is whole again, the fog
// over the eastern sea lifts. The Prism had twelve faces, not eight: before the rite, the king's chancellor Varek
// cut four away and carried them east to power his Noon Engine in the clockwork tower. Ein, mortal now, and the
// four travellers sail east to find the lost faces, meet the drowned queen of Vael, the bird folk of Cloudreach and
// the Delvers under Deepholm, and climb the tower. When Varek falls the sun stops at noon, and the Noon King Aurel
// wakes beneath Old Lumera. Beneath the Spire, three hundred years of the Prism's loneliness wait as Umbra.
import { S, addItem, count, fullHeal, hasJob, MASTER_ARTS } from './party.js';
import { JOBS, ITEMS, SHOPS, ABILITIES, MONSTERS } from './data.js';
import { MASTER_WINS, ARENA } from './data2.js';
import { FIELD_LINES } from './data3.js';
import { L } from './i18n.js';
import { say, talk, ask, toast, fishGame, fade } from './ui.js';
import { shop, inn, forgeMenu, cookMenu } from './menu.js';
import { jingle, sfx } from './audio.js';
import { SCRIPTS, QUESTS, SIGNS } from './story.js';

// the scripts as the first act wrote them, kept so the new ones can fall back to them
const ORIG = { ...SCRIPTS };
const LOWE = () => L('洛', 'Lowe'), FLORA = () => L('芙蘿', 'Flora'), BAL = () => L('巴爾', 'Bal'), SHIA = () => L('希雅', 'Shia'), EIN = () => L('艾茵', 'Ein');
const gift = async (id, k = 1) => { addItem(id, k); sfx('chest'); await say(null, L(`得到了${ITEMS[id].name}${k > 1 ? '×' + k : ''}！`, `Got ${ITEMS[id].name}${k > 1 ? ' x' + k : ''}!`)); };
const gold = async (g) => { S.gold += g; sfx('chest'); await say(null, L(`得到了 ${g} 金幣！`, `Got ${g} gold!`)); };
const q = (id) => S.quests[id];
const start = (id) => { if (!S.quests[id]) { S.quests[id] = 'on'; toast(L(`新的委託：${QUESTS[id].title}`, `New request: ${QUESTS[id].title}`)); } };
const done = (id) => { S.quests[id] = 'done'; jingle('crystal'); };
const learnJob = async (job) => { if (S.jobs.includes(job)) return; S.jobs.push(job); jingle('crystal'); await say(null, L(`學會了新的職業「${JOBS[job].name}」！`, `A new job: ${JOBS[job].name}!`)); await say(null, JOBS[job].desc); };
const say2 = (zh, en, who = null) => say(who, L(zh, en));
const lines = async (who, arr) => { for (const [zh, en] of arr) await say(who, L(zh, en)); };

// ---------- new requests ----------
const Q2 = (title, desc, progress) => ({ get title() { return L(...title); }, get desc() { return L(...desc); }, ...(progress ? { get progress() { return progress(); } } : {}) });
Object.assign(QUESTS, {
  q_shell: Q2(['彩虹貝', 'The Rainbow Shell'], ['小提想要一個白貝海岸的彩虹貝，送給姊姊當禮物。海岸在鹽灣港北邊。', 'Tibb wants a rainbow shell from Shellshore, north of Saltmere, as a present for their sister.']),
  q_locket: Q2(['奶奶的墜子', "Granny's Locket"], ['芬邊村的老奶奶在霧沼弄丟了一個舊墜子。她給了你一張藏寶圖：地圖上的紅叉，按 E 挖挖看。', 'The Fenside granny lost an old locket in the Mistfen. She gave you a treasure map: dig with E at the red X on the map.']),
  q_journal: Q2(['登山日記', "The Climber's Journal"], ['霜門村登山家的弟弟十年前在霜原失蹤了。找回三頁被風吹散的日記。', "The Frostgate climber's brother vanished on the Rimefield ten years ago. Find the three pages of his journal the wind scattered."], () => `${Math.min(3, count('journalpage'))}/3`),
  q_forge: Q2(['鐵匠的爐火', "The Smith's Fire"], ['沙泉鎮的鐵匠布蘭借了你一把十字鎬。挖三塊銅礦回去，他就幫你打造裝備。銅礦在山裡和台地上。', 'Brann the Dunewell smith lent you a pickaxe. Dig up three copper ore and he will forge for you. Copper lies in the mountains and on the mesa.'], () => `${Math.min(3, count('copperore'))}/3`),
  q_cook: Q2(['港口的廚房', 'The Harbour Kitchen'], ['鹽灣港的廚師波姆想要兩條鏡湖鯉。', 'Pomme the Saltmere cook wants two mirror carp.'], () => `${Math.min(2, count('carp'))}/2`),
  q_chef: Q2(['主廚之道', "The Chef's Way"], ['做出六種不同的料理，再去找波姆。', 'Cook six different dishes, then go back to Pomme.'], () => `${Math.min(6, Object.keys(S.cooked).length)}/6`),
  q_arena: Q2(['鹽灣港競技場', 'The Saltmere Arena'], ['從 E 級一路打到 S 級。每一級要連打三場。', 'Fight your way from rank E to rank S. Each rank is three fights in a row.'], () => `${Object.keys(S.arena).length}/6`),
  q_east: Q2(['東方之海', 'The Eastern Sea'], ['坐上漫遊者號，往東航行到潮汐港。在鹽灣港的碼頭按 E 就能上船。', 'Take the Wanderer east to Tidehaven. Press E at the Saltmere dock to board.']),
  q_faces: Q2(['失落的四面', 'The Four Lost Faces'], ['稜晶本來有十二面。被瓦雷克切走的四面散落在：雲上群島、沉沒之都薇爾、深岩島的地底、機關塔。', 'The Prism had twelve faces. The four Varek cut away lie in Cloudreach, the drowned city of Vael, under Deepholm, and in the clockwork tower.'], () => `${S.lost.length}/4`),
  q_tide: Q2(['潮汐閥門', 'The Tide Valves'], ['沉沒之都薇爾被一圈珊瑚牆圍著。轉開環外三座小島上的閥門，就能把水排掉。', 'Vael lies inside a ring of coral. Turn the valves on the three islets outside the ring to drain it.'], () => `${['valve1', 'valve2', 'valve3'].filter((v) => S.flags[v]).length}/3`),
  q_tower: Q2(['機關塔', 'The Clockwork Tower'], ['每一層都有機關。讀牌子上的謎題，拉對拉桿，通往上一層的活門就會打開。', 'Every floor has a mechanism. Read the plaque, set the levers right, and the trapdoor to the next floor opens.']),
  q_log: Q2(['海鷗之翼號', "The Gull's Wing"], ['港長柯拉的父親的船，三十年前在珊瑚群島觸礁了。找到船上的航海日誌。', "Harbourmaster Cora's father's ship struck a reef in the Coral Isles thirty years ago. Find its log."]),
  q_music: Q2(['薇爾之歌', 'The Song of Vael'], ['小馬洛想聽沉沒之都的歌。在排乾的薇爾找到音樂盒。', 'Little Marlo wants to hear the song of the drowned city. Find the music box in drained Vael.']),
  q_cogs: Q2(['七號的記憶', "Unit 7's Memory"], ['機關人七號遺失了三個記憶齒輪，就在機關塔裡。', 'The automaton Unit 7 has lost three memory cogs somewhere in the clockwork tower.'], () => `${Math.min(3, count('memcog'))}/3`),
  q_fledge: Q2(['雛鳥', 'The Fledgling'], ['天空之巢的雛鳥不敢飛。在各個浮島上找三根勇氣之羽。', 'A fledgling of Skyhaven is afraid to fly. Find three feathers of courage on the floating isles.'], () => `${Math.min(3, count('couragefeather'))}/3`),
  q_fossil: Q2(['化石收藏家', 'The Fossil Collector'], ['掘地人的收藏家想要三塊化石。幽深地底的地上有時候露出一角。', "The Delvers' collector wants three fossils. In Hollowdeep they sometimes poke out of the ground."], () => `${Math.min(3, count('fossil'))}/3`),
  q_morel: Q2(['深淵菇', 'Abyss Morels'], ['菇林隱士想要三朵幽深地底的深淵菇。', 'The hermit of the grove wants three abyss morels from Hollowdeep.'], () => `${Math.min(3, count('deepshroom'))}/3`),
  q_beasts: Q2(['魔物圖鑑', 'The Bestiary'], ['潮汐港的學者艾莉絲想看你的魔物圖鑑。遇過 40 種、80 種時去找她。', 'Iris, the Tidehaven scholar, wants to see your bestiary. Visit her at 40 and at 80 kinds met.'], () => `${Object.keys(S.seen).length}`),
  q_echoes: Q2(['蒼藍的迴響', 'The Blue Echoes'], ['東方各地有發著藍光的迴響碎片。艾莉絲想知道它們說了什麼。12 塊、24 塊時去找她。', 'Blue echo shards glow across the east. Iris wants to hear them. Visit her at 12 and at 24.'], () => `${S.echoes.length}/24`),
  q_noon: Q2(['永晝', 'The Endless Noon'], ['太陽停在正午了。正午之王在古都遺跡底下的正午宮殿。入口在遺跡北邊。', 'The sun has stopped at noon. The Noon King waits in the Noon Halls beneath Old Lumera; the way down is on the north side of the ruins.']),
  q_abyss: Q2(['稜晶深淵', 'The Prism Abyss'], ['尖塔底下打開了一條往下的階梯。稜晶三百年的孤單，在最深處等著。', 'A stair has opened beneath the Spire. Three hundred years of the Prism\'s loneliness wait at the bottom.']),
});

// ---------- the twenty-four echoes: memories from the other side of that day ----------
export const ECHOES = [
  ['（瓦雷克）王后走後，陛下每晚都點著一千根蠟燭。我數過。一千根，一根都不能熄。', '(Varek) After the queen died, His Majesty lit a thousand candles every night. I counted. A thousand, and not one could go out.'],
  ['（瓦雷克）我是工匠，不是祭司。我能做的，就是做一台讓太陽不下山的機器。', '(Varek) I am an artificer, not a priest. What I can do is build a machine that keeps the sun from setting.'],
  ['（瓦雷克）稜晶的十二個面裡，有四個面不屬於任何英雄。那四個面，管的是天、海、地，和時間本身。', '(Varek) Four of the Prism\'s twelve faces belong to no hero. Those four govern the sky, the sea, the earth, and time itself.'],
  ['（瓦雷克）儀式前一夜，我切下了那四面。艾茵睡著了。她不知道，她守著的稜晶已經少了一部分。', '(Varek) The night before the rite, I cut those four faces away. Ein was asleep. She never knew the Prism she guarded was already missing a part.'],
  ['（瓦雷克）我把它們運到東方的島上，蓋了一座塔。萬一儀式失敗，正午引擎會接手。', '(Varek) I carried them to an island in the east and built a tower. If the rite failed, the Noon Engine would take over.'],
  ['（茉雯）每年夏天，我都去盧梅拉。艾茵會偷偷帶我去看稜晶，說它喜歡聽我唱歌。', '(Morwen) Every summer I went to Lumera. Ein would sneak me in to see the Prism. She said it liked to hear me sing.'],
  ['（茉雯）瓦雷克答應薇爾的人民：正午的光能讓大家永遠不老。我信了他。我是女王，我應該更聰明一點的。', '(Morwen) Varek promised the people of Vael that the noon light would keep them young forever. I believed him. I was their queen. I should have been wiser.'],
  ['（茉雯）倒流的光打到海上。海浪站了起來，像一堵牆。我看見盧梅拉的城牆一瞬間老了三百年。', '(Morwen) The backward light struck the sea. The waves stood up like a wall. I saw the walls of Lumera grow three hundred years old in an instant.'],
  ['（茉雯）我不能讓我的人民也那樣老去。所以我把海放了進來，讓整座城睡在水底下，時間就進不來了。', '(Morwen) I could not let my people grow old like that. So I let the sea in, and the whole city slept beneath the water where time could not reach.'],
  ['（茉雯）三百年。我的人民變成了水裡的影子。我到底救了他們，還是困住了他們？', '(Morwen) Three hundred years. My people became shadows in the water. Did I save them, or trap them?'],
  ['（七號）指令：守護陛下的睡眠。指令：在正午鐘響時喚醒陛下。指令：……指令不明。記憶損壞。', '(Unit 7) Order: guard His Majesty\'s sleep. Order: wake His Majesty when the noon bell strikes. Order: ...order unclear. Memory damaged.'],
  ['（七號）宰相大人每天都會擦一遍陛下的王冠。他說，總有一天，陛下會再笑。', '(Unit 7) Every day the Chancellor polished His Majesty\'s crown. He said that one day, His Majesty would smile again.'],
  ['（七號）宰相大人造了我，給了我名字。七號。前六個，都在試驗中壞掉了。', '(Unit 7) The Chancellor built me and gave me a name. Seven. The six before me broke during testing.'],
  ['（七號）宰相大人說：「如果我錯了，七號，你要阻止我。」我不懂這個指令。現在，我好像懂了。', '(Unit 7) The Chancellor said, "If I am wrong, Seven, you must stop me." I did not understand that order. Now, I think I do.'],
  ['（天空之巢的長老）有一天，天上掉下一顆發光的石頭。風之龍把它吞了下去，從此守著我們的島。', '(Matron of Skyhaven) One day a glowing stone fell from the sky. The wind dragon swallowed it, and ever since it has guarded our isles.'],
  ['（天空之巢的長老）我們的翅膀很小，飛不遠。可是雲會托著我們。只要不怕，就不會掉下去。', '(Matron of Skyhaven) Our wings are small; we cannot fly far. But the clouds hold us up. As long as you are not afraid, you will not fall.'],
  ['（風之龍）吞下那顆石頭以後，我就再也落不了地。天空的面，不讓我休息。', '(The Wind Dragon) Since I swallowed that stone, I have never been able to land. The face of the sky will not let me rest.'],
  ['（掘地人的族長）祖先說，地底的時間是會長大的。一棵草一天就長成大樹，一隻蜥蜴一年就長成巨龍。', '(Chief of the Delvers) Our ancestors said that time grows down here. A blade of grass becomes a tree in a day; a lizard becomes a dragon in a year.'],
  ['（掘地人的族長）因為有一塊會讓時間長大的石頭，掉進了深岩島的心臟。', '(Chief of the Delvers) Because a stone that makes time grow fell into the heart of Deepholm.'],
  ['（掘地人的族長）暴龍守著那塊石頭。牠很老、很老了，老得忘了自己為什麼要守著。', '(Chief of the Delvers) The Tyrant guards that stone. It is old, so very old, too old to remember why it guards it.'],
  ['（奧瑞爾王）伊莉絲喜歡星星。她說，夜晚是天空把寶石拿出來曬的時候。', '(King Aurel) Elyse loved the stars. She said night was when the sky took out its jewels to air them.'],
  ['（奧瑞爾王）她走的那晚，星星好亮。亮得讓我恨它們。', '(King Aurel) The night she died, the stars were so bright. So bright that I hated them.'],
  ['（奧瑞爾王）如果太陽永遠不下山，就不會再有那樣的夜晚。也就不會再有人在夜裡離開。', '(King Aurel) If the sun never set, there would never be another night like that. No one would ever leave in the night again.'],
  ['（奧瑞爾王）……可是沒有夜晚，我也再也看不到她喜歡的星星了。我為什麼……一直沒有想到呢。', '(King Aurel) ...But with no night, I would never see the stars she loved again. Why did I... never think of that.'],
];

// ---------- signs and plaques of the east ----------
Object.assign(SIGNS, {
  s_tide: ['【潮汐港】東方之海唯一的港口。\n西：鹽灣港（坐船）　東南：沉沒之都　北：機關島', '[Tidehaven] The only harbour on the Eastern Sea.\nWest: Saltmere (by ship)   South-east: the drowned city   North: Clockwork Isle'],
  s_coral: ['【珊瑚群島】\n退潮時，礁石上會露出一些奇怪的東西。', '[The Coral Isles]\nAt low tide, strange things show on the reefs.'],
  s_vael: ['【薇爾】\n一圈珊瑚牆圍著沉在水底的城。牆外的三座小島上，各有一座生鏽的閥門。', '[Vael]\nA ring of coral holds a city beneath the water. On three islets outside the ring stand three rusted valves.'],
  s_cog: ['【齒輪村】修塔工人的營地。\n「塔裡的機關都還會動。小心活門。」', "[Cogwick] The tower workers' camp.\n\"The tower's mechanisms all still work. Mind the trapdoors.\""],
  s_clock: ['【機關塔】\n門上刻著：「正午之前，誰也不准上去。——宰相 瓦雷克」', '[The Clockwork Tower]\nCarved over the door: "None shall climb before noon. - Chancellor Varek"'],
  s_gale: ['【疾風島】\n站到氣流上，風會把你送上雲端。有斗篷的話，回來也不怕。', '[Gale Isle]\nStep into the updraught and the wind will lift you to the clouds. With a cape, the way back down is easy too.'],
  s_sky: ['【天空之巢】鳥族的家。\n北邊有一股往上的風，通往最高的小島。', '[Skyhaven] Home of the bird folk.\nTo the north a wind rises toward the highest islet.'],
  s_deep: ['【深岩島】\n洞口往裡走，是一整個地底的世界。', '[Deepholm]\nThrough the cave mouth lies a whole world under the ground.'],
  s_delve: ['【掘地人之窟】\n「東邊有一股往上吹的風，通到島頂。」', "[Delvers' Hollow]\n\"In the east a wind blows up through the rock to the top of the isle.\""],
  s_abyss: ['【稜晶深淵】\n「孤單的光，會變成影子。」', '[The Prism Abyss]\n"Light left alone too long becomes a shadow."'],
  s_noon: ['【正午宮殿】\n「此處，太陽永不西沉。」', '[The Noon Halls]\n"Here the sun never sets."'],
  p_tw1: ['【一樓的牌子】\n「正午之時，兩根指針都朝著天。」', '[Plaque, first floor]\n"At noon, both hands point to the sky."'],
  p_tw2: ['【二樓的牌子】\n「三口鐘：頭一口和最後一口響著，中間那口睡著。」', '[Plaque, second floor]\n"Three bells: the first and the last ring, the middle one sleeps."'],
  p_tw4: ['【四樓的牌子】\n「四季輪轉，唯有冬天沉睡。」', '[Plaque, fourth floor]\n"The seasons turn; only winter sleeps."'],
  p_tw5: ['【五樓：正午引擎】\n巨大的鐘面上有四個凹槽：天、海、地、時。', '[Fifth floor: the Noon Engine]\nThe great clock face has four sockets: sky, sea, earth and time.'],
});
// what each lever is called, and how the floors must be set
const LEVER_NAME = { l1a: ['時針', 'the hour hand'], l1b: ['分針', 'the minute hand'], l2a: ['第一口鐘', 'the first bell'], l2b: ['中間的鐘', 'the middle bell'], l2c: ['最後一口鐘', 'the last bell'], l4a: ['春', 'Spring'], l4b: ['夏', 'Summer'], l4c: ['秋', 'Autumn'], l4d: ['冬', 'Winter'] };
const PUZZLES = [['tw1', { l1a: 1, l1b: 1 }], ['tw2', { l2a: 1, l2b: 0, l2c: 1 }], ['tw4', { l4a: 1, l4b: 1, l4c: 1, l4d: 0 }]];
// treasure under each map's X
const DIG_LOOT = { 1: [['locket', 1], ['elixir', 1]], 2: [['goldore', 2], ['megalixir', 1]], 3: [['deathward', 1], ['silverore', 3]], 4: [['expcharm', 1], ['xpotion', 2]], 5: [['seacharm', 1], ['coral', 4]], 6: [['hermes', 1], ['feather', 4]], 7: [['mythril', 3], ['crystaldust', 3]], 8: [['sagestaff', 1], ['sunshard', 2]] };
const ORE_ITEM = { copper: 'copperore', silver: 'silverore', mythril: 'mythril', gold: 'goldore', adamant: 'adamant' };

// ---------- the masters of the classic crafts ----------
const MASTERS = {
  fencer: { who: ['老劍客 加里克', 'Old Garrick'], intro: [['我年輕時也走過漫遊之年。那時候，我只會揮劍。', 'I walked my own wandering year, long ago. Back then all I knew was swinging a sword.'], ['後來我才懂，劍不是用來贏的，是用來保護誰的。', 'Later I learned a sword is not for winning. It is for protecting someone.'], ['讓我看看你們的劍吧。用劍士身分打贏十二場，再回來。', 'Show me your swordwork. Win twelve battles as a Fencer, then come back.']], done: [['……好劍。比我年輕時好太多了。', '...Fine swordwork. Far better than mine ever was.'], ['這一招，是我一輩子只用過一次的劍。帶走吧。', 'This is a stroke I used only once in my whole life. Take it.']] },
  mage: { who: ['海之魔導士 佩爾', 'Pell the Sea-Wizard'], intro: [['火、冰、雷……年輕人總以為魔法是要大聲的東西。', 'Fire, ice, lightning... the young think magic is meant to be loud.'], ['真正的魔法，是知道什麼時候該安靜。然後一口氣全部放出來。', 'True magic is knowing when to be quiet. And then letting it all out at once.'], ['以魔導士身分打贏十二場吧。', 'Win twelve battles as a Mage.']], done: [['嗯。你已經懂得安靜了。', 'Mm. You have learned to be quiet.'], ['這是元素的終點。所有屬性都會找到它的弱點。', 'This is where the elements end. Every element finds its weakness.']] },
  cleric: { who: ['修女 露米', 'Sister Lumi'], intro: [['瑪拉藥師是我的老師。她治身體，我治的是……害怕。', 'Mara the healer was my teacher. She mends bodies; I mend... fear.'], ['祭司不是站在後面的人。是讓大家敢往前走的人。', 'A cleric is not the one who stands at the back. It is the one who lets everyone dare to walk forward.'], ['以祭司身分打贏十二場，再回來找我。', 'Win twelve battles as a Cleric, then come back to me.']], done: [['你們誰都沒有丟下誰。我看得出來。', 'None of you ever left anyone behind. I can tell.'], ['這是「奇蹟」。不是神給的，是你們自己掙來的。', 'This is the Miracle. Not given by any god. You earned it yourselves.']] },
  rogue: { who: ['影子', 'The Shade'], intro: [['噓。別看我，看你的錢包。……開玩笑的。', 'Shh. Do not look at me, look at your purse. ...Just kidding.'], ['盜賊的手，是用來拿回別人搶走的東西的。我師父這樣說。', 'A rogue\'s hands are for taking back what others have stolen. So my master said.'], ['用盜賊打贏十二場，我教你一招真正的「拿」。', 'Win twelve as a Rogue and I will teach you some real taking.']], done: [['手很快嘛。比我快一點點。只有一點點。', 'Quick hands. A tiny bit quicker than mine. Only a tiny bit.'], ['「強奪」：打的同時把東西拿走。別用在好人身上喔。', 'Mug: strike and take at the same time. Never on good folk, mind.']] },
  guardian: { who: ['守衛隊長 布蘭諾克', 'Captain Brannoc'], intro: [['霜門村的守衛，一代傳一代。我的祖先是從古都逃出來的士兵。', 'The guards of Frostgate pass the duty down. My forebears were soldiers who fled the old capital.'], ['他們說，古都最後的隊長，到死都沒有離開崗位。', 'They say the capital\'s last captain never left his post, even in death.'], ['守衛的本事，是站著不倒。以守衛身分打贏十二場。', 'A guardian\'s craft is staying on your feet. Win twelve as a Guardian.']], done: [['你站得很穩。隊長大人會以你為榮的。', 'You stand firm. The old captain would be proud.'], ['「神盾」：讓全隊都站得像你一樣穩。', 'Aegis: let the whole party stand as firm as you.']] },
  ranger: { who: ['瞭望手 霍克', 'Hawk the Lookout'], intro: [['我在這根桅杆上看海四十年了。什麼都看得到。', 'I have watched the sea from this mast for forty years. I see everything.'], ['弓手最重要的不是手，是眼睛。和耐心。', 'The most important thing for a ranger is not the hand. It is the eye. And patience.'], ['用弓手打贏十二場吧。', 'Win twelve battles as a Ranger.']], done: [['好眼力。你們看見的東西，比我多。', 'A good eye. You see more than I do.'], ['「天穹箭」：讓箭像雨一樣，但每一支都找得到目標。', "Heaven's Bow: arrows like rain, and every one finds its mark."]] },
  bard: { who: ['老歌手 奈兒', 'Old Nell'], intro: [['我奶奶的奶奶，是從薇爾逃出來的歌手。她只帶走了一首歌。', "My grandmother's grandmother was a singer who fled Vael. She took only one song with her."], ['歌是會記得事情的。比人還會記得。', 'Songs remember. Better than people do.'], ['以吟遊詩人打贏十二場，我就把最古老的那首教給你。', 'Win twelve battles as a Bard and I will teach you the oldest one.']], done: [['你的歌聲裡有海的聲音。', 'There is the sound of the sea in your singing.'], ['這是「英雄讚歌」。薇爾的戰士出海前，大家都會一起唱。', 'This is the Heroic Anthem. Everyone in Vael sang it when the warriors put to sea.']] },
  monk: { who: ['武僧 慈', 'Master Tsu'], intro: [['我在灰脊山上坐了二十年。風很冷，可是心很熱。', 'I sat on Greyridge for twenty years. The wind was cold, but my heart was warm.'], ['拳頭不是用來打人的。是用來讓自己不要倒下的。', 'Fists are not for hitting people. They are for keeping yourself from falling.'], ['以武僧身分打贏十二場，再來。', 'Win twelve as a Monk, then return.']], done: [['你的拳頭很溫暖。', 'Your fists are warm.'], ['「昇龍拳」：把一整座山的力氣，放進一拳裡。', 'Rising Dragon: a whole mountain\'s strength in one fist.']] },
  alchemist: { who: ['釀造師 莫斯', 'Moss the Brewer'], intro: [['隱士爺爺說我很吵。可是釀東西就是要熱鬧！', 'The hermit says I am noisy. But brewing should be lively!'], ['鍊金術的秘密是：失敗一百次，第一百零一次就會成功。', 'The secret of alchemy: fail a hundred times, and the hundred and first will work.'], ['用鍊金術士打贏十二場！', 'Win twelve battles as an Alchemist!']], done: [['哇，你們身上都是火藥味！好棒！', 'Wow, you all smell of gunpowder! Wonderful!'], ['「賢者之石」：讓全隊復活，再全部治好。我花了三十年才做出來的！', "The Philosopher's Stone: revives and heals the whole party. It took me thirty years to brew!"]] },
  chrono: { who: ['機關人 七號', 'Unit 7'], intro: [['分析：時術師的時間運算，與本機的構造相似。', "Analysis: a Chronomancer's reckoning of time resembles this unit's design."], ['宰相大人說：時間不是用來停住的，是用來流動的。他說完就哭了。我不懂。', 'The Chancellor said: time is not for stopping; it is for flowing. Then he wept. I did not understand.'], ['提議：以時術師身分勝利十二次。本機將傳授時間的扭曲法。', 'Proposal: win twelve times as a Chronomancer. This unit will teach the bending of time.']], done: [['確認：時間在你們手中正確流動。', 'Confirmed: time flows correctly in your hands.'], ['傳授：「時空扭曲」。我方加速，敵方減速。', 'Teaching: Time Warp. Friends quicken, foes slow.']] },
  dancer: { who: ['舞者 雲雀', 'Lark the Dancer'], intro: [['我們鳥族不太會飛，所以我們跳舞。在雲上跳舞，就像在飛！', 'We bird folk cannot really fly, so we dance. Dancing on the clouds is just like flying!'], ['劍舞的秘密是：不要怕摔下去。', 'The secret of the sword dance: do not be afraid of falling.'], ['以劍舞者打贏十二場，我教你風的舞！', 'Win twelve as a Bladedancer and I will teach you the dance of the wind!']], done: [['你們跳得好輕！像羽毛！', 'You dance so lightly! Like feathers!'], ['「暴風劍舞」：跳一支讓所有敵人都站不穩的舞。', 'Tempest Dance: a dance that knocks every foe off balance.']] },
  astro: { who: ['天空之巢的長老', 'The Matron of Skyhaven'], intro: [['在雲上，星星離我們好近。近到可以借一點光。', 'Up on the clouds the stars are so close. Close enough to borrow a little light.'], ['可是借了，就要還。星術師要記得這件事。', 'But what you borrow, you must return. An Astromancer must remember that.'], ['以星術師打贏十二場，我把最大的那顆星借給你。', 'Win twelve as an Astromancer and I will lend you the biggest star of all.']], done: [['星星說，你們借了光都有好好還。', 'The stars say you always return the light you borrow.'], ['「大爆炸」：一整個天空的光。用完記得道謝喔。', 'Big Bang: the light of a whole sky. Remember to say thank you afterwards.']] },
};
async function master(job, extra) {
  const M = MASTERS[job], who = L(...M.who), qid = 'q_m_' + job;
  if (!QUESTS[qid]) QUESTS[qid] = Q2([`${M.who[0]}的試煉`, `${M.who[1]}'s Trial`], [`以${JOBS[job].name}為主職業打贏 ${MASTER_WINS} 場，再回去找${M.who[0]}。`, `Win ${MASTER_WINS} battles with ${JOBS[job].name} as someone's main job, then return to ${M.who[1]}.`], () => `${Math.min(MASTER_WINS, (S.jobWins[job] || 0) - (S.masterQ[job] || 0))}/${MASTER_WINS}`);
  if (S.mastery[job]) { await say(who, L(`「${ABILITIES[MASTER_ARTS[job]].name}」用得還順手嗎？主職業或副職業是${JOBS[job].name}時就能用。`, `How is ${ABILITIES[MASTER_ARTS[job]].name} serving you? It works whenever ${JOBS[job].name} is your main or sub job.`)); if (extra) await extra(); return; }
  if (S.masterQ[job] === undefined) {
    if (!S.jobs.includes(job)) { await say(who, L(`……你們還不會${JOBS[job].name}的技藝。等學會了再來吧。`, `...You do not know the ${JOBS[job].name}'s craft yet. Come back when you do.`)); if (extra) await extra(); return; }
    await lines(who, M.intro);
    S.masterQ[job] = S.jobWins[job] || 0; start(qid); return;
  }
  const n = (S.jobWins[job] || 0) - S.masterQ[job];
  if (n >= MASTER_WINS) { await lines(who, M.done); S.mastery[job] = true; done(qid); await say(null, L(`學會了奧義「${ABILITIES[MASTER_ARTS[job]].name}」！（${JOBS[job].name}是主職業或副職業時可以使用）`, `Learned the master art ${ABILITIES[MASTER_ARTS[job]].name}! (Usable while ${JOBS[job].name} is your main or sub job.)`)); return; }
  await say(who, L(`以${JOBS[job].name}的身分，還要再贏 ${MASTER_WINS - n} 場。`, `${MASTER_WINS - n} more wins as a ${JOBS[job].name}.`));
  if (extra) await extra();
}

// ---------- the arena ----------
async function arena(ctx) {
  const G = L('競技場主 甘特', 'Gant the Arena Master');
  if (!S.inv.arenapass) {
    await talk(G, L('來挑戰的嗎？鹽灣港競技場，從 E 級打到 S 級。每一級連打三場，中途不能休息。', 'Here to fight? The Saltmere Arena runs from rank E to rank S. Three fights in a row each rank, no rest in between.'), L('輸了不會掉錢，只會丟臉。哈哈！這張通行證拿去。', 'Lose and you lose no gold, only face. Ha ha! Take this pass.'));
    addItem('arenapass'); start('q_arena'); sfx('chest');
  }
  for (;;) {
    const opts = ARENA.map((a, i) => ({ label: L(`${a.rank} 級`, `Rank ${a.rank}`) + (S.arena[a.rank] ? ' ✔' : ''), off: i > 0 && !S.arena[ARENA[i - 1].rank] }));
    const r = await ask(G, L('要挑戰哪一級？', 'Which rank will you take on?'), [...opts.map((o) => o.label + (o.off ? L('（未開放）', ' (locked)') : '')), L('算了', 'Not now')]);
    if (r < 0 || r >= ARENA.length) return;
    if (opts[r].off) { await say(G, L('先打過前一級再說！', 'Clear the rank below first!')); continue; }
    const A = ARENA[r];
    fullHeal();
    for (let i = 0; i < A.fights.length; i++) {
      await say(G, L(`${A.rank} 級，第 ${i + 1} 場！開始！`, `Rank ${A.rank}, fight ${i + 1}! Begin!`));
      const res = await ctx.fight(A.fights[i], { bg: 'arena', arena: true, boss: A.fights[i][0] === 'champion' });
      await fade(false);
      if (res !== 'win') { fullHeal(); await say(G, L('哎呀，下次再來！大家我都幫你們治好了。', 'Ouch! Come back next time. I have patched everyone up.')); return; }
    }
    fullHeal();
    if (!S.arena[A.rank]) { S.arena[A.rank] = true; await say(G, L(`${A.rank} 級制霸！這是獎品！`, `Rank ${A.rank} conquered! Here is your prize!`)); await gift(A.prize[0], A.prize[1]); await gold(A.gold); if (A.rank === 'S') { done('q_arena'); await say(G, L('……你們打贏了假面劍豪？鹽灣港從今天起，要多一個傳說了。', '...You beat the Masked Blade? Saltmere has a new legend from today.')); } }
    else { await say(G, L('又制霸了一次！這次就給你一點零用錢。', 'Conquered again! Here is a little pocket money.')); await gold(Math.round(A.gold / 4)); }
    return;
  }
}

export const SCRIPTS2 = {
  // ---------- crystals, echoes, and things of the east ----------
  async crystal(c) {
    if (!c.east) return ORIG.crystal(c);
    if (S.crystals2.includes(c.job)) return;
    if (c.need && !S.beaten[c.need]) { await say(null, L('水晶被一圈旋轉的海水包著，碰不到。……好像有誰在守著它。', 'A ring of swirling water surrounds the crystal; you cannot reach it. ...Someone seems to be guarding it.')); return; }
    S.crystals2.push(c.job); if (!S.jobs.includes(c.job)) S.jobs.push(c.job);
    jingle('crystal');
    if (c.lost && !S.lost.includes(c.job)) S.lost.push(c.job);
    await say(null, L(`${c.lost ? '失落的稜晶之面' : '水晶'}發出耀眼的光芒……\n學會了新的職業「${JOBS[c.job].name}」！`, `${c.lost ? 'The lost face of the Prism' : 'The crystal'} blazes with light...\nA new job: ${JOBS[c.job].name}!`));
    await say(null, `${JOBS[c.job].desc}　${L('（從選單的「職業」換上它吧）', '(Set it from Jobs in the menu.)')}`);
    if (c.lost) {
      const n = S.lost.length;
      if (n < 4) await say(null, L(`失落的四面：${n}／4。遠方的機關塔，好像響了一聲鐘。`, `The four lost faces: ${n} of 4. Far away, the clockwork tower seems to chime.`));
      else { await say(null, L('四面都到齊了。手中的四塊光，同時指向北方的機關塔頂。', 'All four are here. The four lights in your hands all point to the top of the clockwork tower.')); if (q('q_faces') === 'on') done('q_faces'); }
    }
  },
  async echo(s) {
    if (S.echoes.includes(s.id)) return;
    S.echoes.push(s.id); sfx('warp');
    await say(L(`蒼藍的迴響 ${s.id + 1}／24`, `Blue Echo ${s.id + 1} / 24`), L(ECHOES[s.id][0], ECHOES[s.id][1]));
    if (S.echoes.length === 1) await say(null, L('藍色的碎片化成了光。這不是稜晶的記憶……是那一天，站在稜晶另一邊的人們的記憶。\n（可以在選單的「回憶」重看）', 'The blue shard melts into light. These are not the Prism\'s memories... they belong to the people on the other side of that day.\n(Read them again under Memories.)'));
  },
  async pickup(k) {
    S.picked[k.id] = true; addItem(k.item); sfx('chest');
    await say(null, L(`撿到了${ITEMS[k.item].name}！`, `Found ${ITEMS[k.item].name}!`));
    if (ITEMS[k.item].desc) await say(null, ITEMS[k.item].desc);
  },
  async lever(l) {
    S.levers[l.id] = !S.levers[l.id]; sfx('ok');
    const nm = LEVER_NAME[l.id] || ['拉桿', 'a lever'];
    toast(L(`「${nm[0]}」的拉桿${S.levers[l.id] ? '拉上去了' : '放下來了'}。`, `The lever for ${nm[1]} is now ${S.levers[l.id] ? 'up' : 'down'}.`));
    for (const [flag, want] of PUZZLES) {
      if (S.flags[flag] || !Object.keys(want).includes(l.id)) continue;
      if (Object.entries(want).every(([id, on]) => !!S.levers[id] === !!on)) {
        S.flags[flag] = true; jingle('crystal');
        await say(null, L('齒輪咬合的聲音傳遍了整層樓。頭頂的活門打開了！', 'The sound of gears meshing fills the floor. The trapdoor overhead swings open!'));
        if (!q('q_tower')) start('q_tower');
      }
    }
  },
  async valve(v, ctx) {
    if (S.flags[v.id]) { await say(null, L('閥門已經轉開了，水從管子裡嘩嘩地流走。', 'The valve is already open; water gushes away down the pipe.')); return; }
    S.flags[v.id] = true; sfx('ok'); start('q_tide');
    const n = ['valve1', 'valve2', 'valve3'].filter((x) => S.flags[x]).length;
    await say(null, L(`生鏽的閥門吱嘎吱嘎地轉開了。（${n}／3）`, `The rusted valve creaks open. (${n} of 3)`));
    if (n === 3) {
      done('q_tide');
      await say(null, L('海底傳來低沉的轟鳴。珊瑚牆裡的水，像被拔了塞子一樣流走了……', 'A deep rumble rises from beneath the sea. Inside the coral ring, the water drains away as if a plug had been pulled...'));
      S.flags.drained = true; if (ctx) ctx.syncWorld(); sfx('warp');
      await say(null, L('沉睡了三百年的城市，第一次曬到了太陽。', 'For the first time in three hundred years, the sleeping city feels the sun.'));
    }
  },
  async mine(o, kind) {
    if (!S.inv.pickaxe) { await say(null, L('岩石裡閃著礦脈的光。……要是有十字鎬就好了。沙泉鎮的鐵匠也許有。', 'Ore glints in the rock. ...If only you had a pickaxe. The Dunewell smith might.')); return; }
    const ok = await fishGame(0.22, L('在亮的地方按 E 敲下去！', 'Strike with E on the bright mark!'), true);
    const item = ORE_ITEM[kind] || 'copperore', n = ok ? 2 : 1;
    S.mined[o.id] = S.time; addItem(item, n); sfx('chest');
    let t = L(`挖到了${ITEMS[item].name}×${n}！`, `Dug up ${ITEMS[item].name} x${n}!`);
    if (ok && Math.random() < 0.18) { addItem('crystaldust'); t += L('還有一點晶塵！', ' And some crystal dust!'); }
    if (kind === 'mythril' && Math.random() < 0.2) { addItem('goldore'); t += L('還有金礦！', ' And gold ore!'); }
    await say(null, t + L('\n（礦脈過一陣子會再長出來）', '\n(The vein will grow back in a while.)'));
  },
  async dig(d) {
    S.dug[d.id] = true; sfx('chest');
    await say(null, L('挖呀挖……挖到東西了！', 'Dig, dig... there is something here!'));
    for (const [id, n] of DIG_LOOT[d.map] || []) await gift(id, n);
  },

  // ---------- Act II begins: Nina's ship ----------
  async sm_sister(e, ctx) {
    const SI = L('水手妮娜', 'Nina the Sailor');
    if (!S.flags.cleared || S.inv.boat) {
      if (S.inv.boat) { await say(SI, S.flags.act3 ? L('聽說太陽又會下山了？太好了，夜裡的海最美了。', 'They say the sun sets again now? Wonderful. The sea is loveliest at night.') : L('漫遊者號開起來還順手吧？在碼頭吹聲口哨，它就會過來。', 'Is the Wanderer handling well? Whistle at any dock and she will come.')); return; }
      return ORIG.sm_sister(e, ctx);
    }
    await talk(SI, L('你們回來了！……你們看到了嗎？尖塔亮起來的那一晚，東邊海上的霧，一下子全散了。', 'You are back! ...Did you see? The night the Spire lit up, the fog over the eastern sea vanished all at once.'),
      L('三百年來，從來沒有船能穿過那片霧。可是現在，從桅杆上看得到島。好多島。', 'For three hundred years no ship could get through that fog. But now, from the mast, you can see islands. Lots of islands.'),
      L('艾茵小姐昨天搭著漁船先過去了。她要我轉告：「去潮汐港找我。」', 'Miss Ein went ahead on a fishing boat yesterday. She asked me to tell you: "Find me in Tidehaven."'),
      L('我的老船長留下了一艘船，叫「漫遊者號」。……拿去吧。漫遊之年還沒結束，不是嗎？', 'My old captain left me a ship called the Wanderer. ...Take her. Your wandering year is not over yet, is it?'));
    addItem('boat'); sfx('chest'); jingle('levelup');
    await say(null, L('得到了帆船「漫遊者號」！\n在碼頭或船旁邊按 E 上船，朝著陸地航行就會上岸。', 'Got the Wanderer!\nPress E at a dock or beside her to board; sail into land to go ashore.'));
    start('q_east'); if (ctx) ctx.refreshEnts();
  },
  async hv_elder(e, ctx) {
    if (!S.flags.cleared) return ORIG.hv_elder(e, ctx);
    const E = L('奧森長老', 'Elder Ozen');
    if (S.flags.act3) { await say(E, S.flags.umbra ? L('連尖塔底下的影子都安息了嗎……你們這趟漫遊，可以寫成好幾本書了。', 'Even the shadow beneath the Spire is at rest...? Your wandering year could fill a whole shelf of books.') : L('太陽又會下山了。……我從來沒有這麼喜歡過夜晚。', 'The sun sets again. ...I have never loved the night so much.')); return; }
    if (S.flags.noonFreeze) { await say(E, L('太陽一直停在頭頂……雞都不知道什麼時候該叫了。孩子們，拜託你們了。', 'The sun just hangs overhead... the roosters do not know when to crow. Children, we are counting on you.')); return; }
    await say(E, L('艾茵姑娘一早就去鹽灣港了。她說東邊的海上還有事沒做完，要你們去找水手妮娜。', 'Miss Ein left for Saltmere first thing this morning. She said something in the east is still unfinished, and that you should find Nina the sailor.'));
  },

  // ---------- Ein in the east ----------
  async ein2(e, ctx) {
    const k = S.flags.ein2 || 0;
    if (k === 0) {
      await talk(EIN(), L('來了啊。……你們看，我長了第一根白頭髮。', 'You came. ...Look, I have my first grey hair.'), L('好奇怪喔，我居然很開心。', 'How strange. It makes me so happy.'));
      await say(LOWE(), L('艾茵！你怎麼先跑來了？', 'Ein! Why did you come on ahead?'));
      await talk(EIN(), L('稜晶完整的那一刻，我感覺到了。……少了四塊。', 'The moment the Prism became whole, I felt it. ...Four pieces were missing.'), L('稜晶本來有十二面。八面是英雄的技藝，另外四面，管的是天、海、地，還有時間。', 'The Prism had twelve faces. Eight held heroes\' crafts. The other four governed the sky, the sea, the earth, and time.'),
        L('儀式前一夜，王的宰相瓦雷克切走了那四面，帶到這片海上，蓋了一座塔。', 'The night before the rite, the king\'s chancellor, Varek, cut those four away and carried them to this sea, where he built a tower.'),
        L('北邊島上那座會報時的塔，就是他的「正午引擎」。如果它把完整的稜晶的光也吸過去……', 'That chiming tower on the island to the north is his Noon Engine. If it draws in the light of the whole Prism as well...'));
      await say(FLORA(), L('……就會變成永遠的白晝？', '...It becomes an endless day?'));
      await talk(EIN(), L('嗯。所以要在那之前，找回那四面。', 'Yes. So we must find those four faces first.'), L('一面飛上了天，一面沉進了海，一面埋進了地底，最後一面還在塔裡。……這一次，我可以自己碰水晶了。可是我想跟你們一起去。', 'One flew into the sky, one sank into the sea, one was buried under the earth, and the last is still in the tower. ...This time I could touch the crystals myself. But I would rather go with you.'));
      start('q_faces');
    } else if (k === 1) {
      await talk(EIN(), L('天空之巢的鳥族，翅膀那麼小，卻一點都不怕高。', 'The bird folk of Skyhaven have such small wings, and yet they are not afraid of heights at all.'), L('……瓦雷克以前也是這樣的人。笨手笨腳，可是一點都不怕。', '...Varek used to be like that. Clumsy, but never afraid.'));
      await say(SHIA(), L('你認識他？', 'You knew him?'));
      await talk(EIN(), L('他教過我認字。王后過世以後，他比誰都難過。他看著王一天一天地壞掉，什麼都做不了。', 'He taught me to read. After the queen died, he grieved more than anyone. He watched the king break a little more each day and could do nothing.'), L('我想，他做那台機器，不是為了王的命令。是為了讓王不要再哭。', 'I think he did not build that machine because the king ordered it. He built it so the king would stop crying.'));
    } else if (k === 2) {
      await talk(EIN(), L('……薇爾。茉雯的城。', '...Vael. Morwen\'s city.'), L('她每年夏天都來盧梅拉。我們偷偷溜進稜晶的房間，她唱歌，稜晶就會發出暖暖的光。', 'Every summer she came to Lumera. We would sneak into the Prism\'s chamber; she would sing, and the Prism would glow warm.'),
        L('那一天，我打碎了稜晶救了盧梅拉的明天。她卻把海放進城裡，讓她的人民睡在不會變老的水底。', 'That day I broke the Prism to save Lumera\'s tomorrow. And she let the sea into her city, so her people could sleep where they would never grow old.'),
        L('我們都做了一樣的事啊。為了重要的人，做了沒辦法回頭的選擇。', 'We did the same thing, really. For the people we loved, we made choices we could never take back.'));
    } else if (k === 3) {
      await talk(EIN(), L('這裡的時間，跟盧梅拉相反。在這裡，時間是長大的。', 'Time here is the opposite of Lumera. Here, time grows.'), L('一顆種子三天就變成大樹。一隻小蜥蜴，三百年就變成了暴龍。', 'A seed becomes a great tree in three days. A little lizard, in three hundred years, became the Tyrant.'), L('……我在想，如果那一天我沒有打碎稜晶，我會不會也像牠一樣，一直守著什麼，守到忘了為什麼。', '...I wonder, if I had not broken the Prism that day, would I have ended up like it - guarding something for so long I forgot why.'));
    } else if (k === 4) {
      await talk(EIN(), L('四面都到齊了。', 'All four faces are here.'), L('瓦雷克還活著。他就在塔頂。……他一直在等，等有人把稜晶拼回去，好完成他的工作。', 'Varek is alive. He is at the top of the tower. ...He has been waiting, waiting for someone to put the Prism back together so he can finish his work.'),
        L('我們把稜晶拼好了。所以，也只有我們能阻止他。', 'We put the Prism back together. So we are the only ones who can stop him.'));
      await say(BAL(), L('走吧。一層一層爬上去。', 'Let us go. One floor at a time.'));
    } else if (k === 5) {
      await talk(EIN(), L('太陽一直停在頭頂……跟三百年前那天一模一樣。', 'The sun hangs overhead... exactly like that day three hundred years ago.'), L('王就在下面。在他的「正午宮殿」裡。', 'The king is down there, in his Noon Halls.'),
        L('三百年前，我是一個人拿著杖站在他面前的。這一次……我可以跟你們站在一起嗎？', 'Three hundred years ago I stood before him alone with my staff. This time... may I stand with you?'));
      await say(LOWE(), L('當然！艾茵，一起去！', 'Of course! Together, Ein!'));
      S.flags.einJoin2 = true;
      await say(null, L('艾茵會在正午宮殿裡和大家並肩作戰！', 'Ein will fight beside you in the Noon Halls!'));
      start('q_noon');
    } else if (k === 6) {
      await talk(EIN(), L('稜晶跟我說了一件事。', 'The Prism told me something.'), L('它一個人等了三百年。那三百年的孤單，沒有消失，沉到了尖塔的最底下，變成了影子。', 'It waited alone for three hundred years. That loneliness did not vanish. It sank to the very bottom of the Spire and became a shadow.'),
        L('那個影子叫「稜影」。很強，非常強。……不去也沒關係喔。可是如果要去，記得帶夠回復藥。', 'They call it Umbra. It is strong, very strong. ...You need not go. But if you do, take plenty of potions.'));
      start('q_abyss');
    } else { await say(EIN(), L('早安。……今天，天也會黑嗎？太好了。', 'Good morning. ...Will it get dark today too? Wonderful.')); return; }
    S.flags.ein2 = k + 1;
  },

  // ---------- Tidehaven ----------
  async th_inn(e, ctx) { await inn(ctx, L('潮汐亭', 'The Tide Inn')); },
  async th_shop(e) { await say(L('港口雜貨商', 'Harbour Trader'), L('三百年沒有西邊的客人了！大家都說你們是傳說中的「霧那邊的人」。', 'No customers from the west in three hundred years! Everyone says you are the legendary "folk beyond the fog".')); await shop(SHOPS[e.shop]); },
  async th_smith() { await say(L('潮汐港的鐵匠', 'Tidehaven Smith'), L('珊瑚、魚鱗、秘銀……東方之海什麼材料都有。要打什麼？', 'Coral, scales, mythril... the Eastern Sea has every material there is. What shall I forge?')); await forgeMenu(L('潮汐港的鍛造爐', 'Tidehaven Forge')); },
  async th_cook() {
    const C = L('海港廚娘 塔拉', 'Tara the Harbour Cook');
    if (!S.inv.recipebook) { await talk(C, L('你們沒有食譜？那可不行！出海的人，一定要會煮東西。', 'No recipe book? That will never do! Anyone who goes to sea must know how to cook.'), L('這本給你們。材料夠了，從選單的「料理」就能做。', 'Take this one. When you have the ingredients, cook from Cooking in the menu.')); addItem('recipebook'); sfx('chest'); await say(null, L('得到了食譜！', 'Got the Recipe Book!')); return; }
    await say(C, [L('雲莓長在雲上群島；光苔長在幽深地底。蛋嘛，鳥族的雲駝和月兔偶爾會留下。', 'Cloudberries grow on Cloudreach; glowmoss in Hollowdeep. Eggs? Cloud alpacas and moon hares leave them sometimes.'), L('國王盛宴要用到金鱗錦鯉。……很奢侈喔。', "The King's Feast needs a Golden Koi. ...Very extravagant."), L('稜光魚做的壽司，吃了能讓倒下的人跳起來！', 'Sushi made from a Prismfin can make a fallen friend leap right up!')][Math.floor(S.time / 20) % 3]);
    await cookMenu();
  },
  async th_cora() {
    const C = L('港長 柯拉', 'Harbourmaster Cora');
    if (!q('q_log')) {
      await talk(C, L('西邊來的船！……抱歉，我盯著你們的船看太久了。', 'A ship from the west! ...Sorry, I stared at your ship too long.'), L('三十年前，我爸爸開著「海鷗之翼號」，想穿過霧到西邊去。船在珊瑚群島觸了礁，他就再也沒回來。', 'Thirty years ago my father sailed the Gull\'s Wing, trying to get through the fog to the west. She struck a reef in the Coral Isles, and he never came back.'),
        L('船骸還在南邊的小島上。如果……如果他的航海日誌還在，能幫我拿回來嗎？', 'The wreck is still on an islet to the south. If... if his log is still aboard, could you bring it to me?'));
      start('q_log'); return;
    }
    if (q('q_log') === 'on' && count('logbook')) {
      addItem('logbook', -1); done('q_log');
      await talk(C, L('……「霧太濃了。可是我看到了，霧的那邊有光。一座發光的塔。」', '..."The fog is too thick. But I saw it: beyond the fog there is light. A tower of light."'), L('「柯拉，等爸爸回來，就帶你去看。」……原來他真的看到了。尖塔的光。', '"Cora, when Papa comes home, I will take you to see it." ...So he really did see it. The light of the Spire.'),
        L('謝謝你們。這是爸爸的護身符，帶著它，海怪就不太會靠近。', 'Thank you. This was Papa\'s charm. Wear it and sea monsters keep their distance.'));
      await gift('seacharm'); return;
    }
    await say(C, q('q_log') === 'done' ? L('我也想坐一次你們的船，去看看尖塔。……等你們的事情辦完吧。', 'I would like to ride your ship one day and see the Spire. ...When your business is done.') : L('船骸在潮汐港南邊的小島上。', 'The wreck lies on an islet south of Tidehaven.'));
  },
  async th_marlo() {
    const M = L('小馬洛', 'Little Marlo');
    if (!S.flags.drained) { await say(M, L('奶奶說，海底有一座城，城裡的人到現在都還在睡覺。我好想去看喔！', 'Granny says there is a city under the sea, and everyone in it is still asleep. I want to see it so much!')); return; }
    if (!q('q_music')) { await talk(M, L('薇爾的水真的沒了？！', 'The water in Vael is really gone?!'), L('奶奶說，薇爾的女王有一個音樂盒，一打開就會唱出薇爾的歌。你們幫我找找看好不好？', 'Granny says the queen of Vael had a music box that plays the song of Vael. Will you look for it for me?')); start('q_music'); return; }
    if (q('q_music') === 'on' && count('musicbox')) {
      addItem('musicbox', -1); done('q_music');
      await say(M, L('奶奶！奶奶你聽！', 'Granny! Granny, listen!'));
      await say(L('老歌手 奈兒', 'Old Nell'), L('……這首歌。我奶奶的奶奶唱過的歌。原來，是這樣的旋律啊……', '...This song. The one my grandmother\'s grandmother sang. So this is how it goes...'));
      await say(null, L('音樂盒的歌聲，飄過了整個港口。', "The music box's song drifts across the whole harbour."));
      await gift('coralbow'); await gold(800); return;
    }
    await say(M, q('q_music') === 'done' ? L('我長大要當潛水夫！', 'When I grow up I am going to be a diver!') : L('音樂盒，一定在薇爾的某個地方！', 'The music box must be somewhere in Vael!'));
  },
  async th_gran() { await master('bard', async () => { if (!S.flags.drained) await say(L('老歌手 奈兒', 'Old Nell'), L('薇爾被一圈珊瑚牆圍著。牆外有三座小島，各有一個閥門……我奶奶的奶奶說，那是用來「讓城醒過來」的。', 'Vael is ringed by a wall of coral. Outside the wall are three islets, each with a valve... my grandmother\'s grandmother said they were for "waking the city up".')); }); },
  async th_iris() {
    const I = L('海之學者 艾莉絲', 'Iris, Scholar of the Sea');
    if (!q('q_beasts')) { await talk(I, L('你們就是西邊的旅人？太好了，我在寫一本東方之海的魔物書。', 'You are the travellers from the west? Wonderful. I am writing a book on the monsters of the Eastern Sea.'), L('你們的選單裡有「魔物圖鑑」對吧？遇過的魔物都會記下來。用看破看過的，連弱點都會記。', 'Your menu has a Bestiary, yes? Every monster you meet is written down. Scan one, and its weaknesses too.'), L('還有……東方各地散落著藍色的碎片。我叫它們「迴響」。找到了，告訴我它們說了什麼。', 'And... blue shards lie scattered around the east. I call them echoes. When you find them, tell me what they say.')); start('q_beasts'); start('q_echoes'); return; }
    const seen = Object.keys(S.seen).length;
    if (seen >= 40 && !S.flags.iris40) { S.flags.iris40 = true; await say(I, L(`${seen} 種！夠我寫半本書了。謝禮！`, `${seen} kinds! That is half a book. A thank-you!`)); await gift('expcharm'); return; }
    if (seen >= 80 && !S.flags.iris80) { S.flags.iris80 = true; done('q_beasts'); await say(I, L(`${seen} 種……你們走過的地方，比任何學者都多。`, `${seen} kinds... you have walked further than any scholar.`)); await gift('megalixir', 2); await gift('goldcharm'); return; }
    if (S.echoes.length >= 12 && !S.flags.iris12) { S.flags.iris12 = true; await say(I, L('原來那一天，在東方也有人在哭、在後悔、在等待……謝謝你們讓我聽到。', 'So on that day, people in the east wept too, and regretted, and waited... thank you for letting me hear it.')); await gift('sagestaff'); return; }
    if (S.echoes.length >= 24 && !S.flags.iris24) { S.flags.iris24 = true; done('q_echoes'); await say(I, L('二十四個迴響。……一個國王、一個宰相、一個女王、一台機器。每個人都只是想留住什麼。', 'Twenty-four echoes. ...A king, a chancellor, a queen, a machine. Each of them only wanted to hold on to something.')); await gift('darkward'); await gold(2000); return; }
    await say(I, L(`魔物圖鑑：${seen} 種。迴響：${S.echoes.length}／24。`, `Bestiary: ${seen} kinds. Echoes: ${S.echoes.length} of 24.`));
  },

  // ---------- Cogwick ----------
  async cg_inn(e, ctx) { await inn(ctx, L('齒輪亭', 'The Cog Inn')); },
  async cg_shop(e) { await say(L('齒輪村的商人', 'Cogwick Trader'), L('槍要用槍的職業才拿得動喔。機工士，聽過嗎？', 'Guns need a job that can hold them. Ever heard of a Machinist?')); await shop(SHOPS[e.shop]); },
  async cg_ottla() {
    const O = L('修塔匠 歐特拉', 'Ottla the Tower-Mender');
    await say(O, !S.flags.tw1 ? L('塔裡每一層都有活門，用拉桿控制。拉桿要照著牌子上的謎題擺，活門才會開。', 'Every floor of the tower has a trapdoor worked by levers. Set the levers the way the plaque\'s riddle says and the trapdoor opens.') : !S.beaten.b_colossus ? L('三樓有一台齒輪巨像在巡邏。它每隔幾回合就會噴蒸汽，噴完會過熱，那是機會！', 'A gear colossus patrols the third floor. Every few rounds it vents steam, and afterwards it overheats - that is your chance!') : S.lost.length < 4 ? L('五樓的引擎上有四個凹槽。沒有那四塊光，最後的活門絕對打不開。', 'The engine on the fifth floor has four sockets. Without those four lights the last trapdoor will never open.') : L('塔頂……宰相還在那裡嗎？小心，他會叫齒輪仔出來擋刀。先清掉小的！', 'The top... is the Chancellor still up there? Careful, he calls coglings to shield him. Clear the little ones first!'));
    if (!q('q_tower')) start('q_tower');
  },
  async cg_unit7() {
    const U = L('機關人 七號', 'Unit 7');
    if (!q('q_cogs')) { await talk(U, L('偵測：外來者。……問候。本機為七號。', 'Detected: outsiders. ...Greetings. This unit is Seven.'), L('本機的記憶齒輪遺失了三個，在塔內。沒有它們，本機無法想起最後的指令。', 'This unit has lost three memory cogs inside the tower. Without them it cannot recall its final order.'), L('請求：協助尋找。', 'Request: help find them.')); start('q_cogs'); return; }
    if (q('q_cogs') === 'on' && count('memcog') >= 3) {
      addItem('memcog', -3); done('q_cogs');
      await talk(U, L('安裝中……記憶恢復。', 'Installing... memory restored.'), L('最後的指令：「如果我錯了，七號，你要阻止我。」', 'Final order: "If I am wrong, Seven, you must stop me."'), L('本機無法上塔。本機的腳，是為了守門而造的。……請代替本機，執行這個指令。', 'This unit cannot climb the tower. Its legs were built to guard a door. ...Please carry out this order in its place.'));
      await gift('dragonheart_acc'); return;
    }
    if (q('q_cogs') === 'on') { await say(U, L(`記憶齒輪：${count('memcog')}／3。位置推測：一樓、三樓、五樓。`, `Memory cogs: ${count('memcog')} of 3. Estimated locations: floors one, three and five.`)); return; }
    await master('chrono');
  },
  async cg_worker() { await say(L('修塔工人', 'Tower Worker'), S.flags.act3 ? L('鐘終於不響了。晚上能睡個好覺了。', 'The bell has finally stopped. We can sleep at night again.') : L('塔頂的鐘每天正午都會響。響的時候，海會安靜下來，連浪都不敢動。', 'The bell at the top rings every noon. When it rings the sea goes quiet; even the waves dare not move.')); },

  // ---------- Skyhaven ----------
  async sk_matron() { await master('astro', async () => { await say(L('天空之巢的長老', 'The Matron of Skyhaven'), S.beaten.b_tempest ? L('風之龍終於落地休息了。謝謝你們。', 'The wind dragon has finally landed to rest. Thank you.') : L('風之龍住在東邊的浮島上。牠一飛起來，近身的武器就打不到牠。弓、槍、魔法，還有……龍騎士的跳躍。', 'The wind dragon lives on the eastern isle. When it takes flight, close weapons cannot touch it. Bows, guns, magic, and... a dragoon\'s jump.')); }); },
  async sk_shop(e) { await say(L('鳥族商人', 'Bird-folk Trader'), L('啾！歡迎！雲上的東西都很輕，背得動！', 'Cheep! Welcome! Everything up here is light; you can carry it all!')); await shop(SHOPS[e.shop]); },
  async sk_fledge() {
    const F = L('雛鳥 皮皮', 'Pip the Fledgling');
    if (!q('q_fledge')) { await talk(F, L('大家都在雲上飛來飛去……我、我不敢。', 'Everyone flits about on the clouds... I-I cannot.'), L('長老說，只要有三根「勇氣之羽」，就不會怕了。它們掉在各個浮島上。', 'The Matron says if I have three feathers of courage, I will not be afraid. They fell on the floating isles.')); start('q_fledge'); return; }
    if (q('q_fledge') === 'on' && count('couragefeather') >= 3) {
      addItem('couragefeather', -3); done('q_fledge');
      await say(F, L('三根……！我、我飛飛看！', 'Three...! I-I will try!'));
      await say(null, L('皮皮張開小小的翅膀，從島邊跳了下去——然後被雲輕輕托了起來。', 'Pip spreads tiny wings and leaps from the edge - and the clouds lift it gently up.'));
      await say(F, L('我飛起來了！！其實……是雲在飛吧？可是我不怕了！', 'I am flying!! Well... it is the clouds doing it, maybe? But I am not afraid anymore!'));
      await gift('windcutter'); return;
    }
    await say(F, q('q_fledge') === 'done' ? L('啾啾！看我！', 'Cheep cheep! Watch me!') : L(`勇氣之羽……${count('couragefeather')}／3。`, `Feathers of courage... ${count('couragefeather')} of 3.`));
  },
  async sk_lark() { await master('dancer'); },

  // ---------- Delvers' Hollow ----------
  async dv_chief() {
    const C = L('掘地人族長 葛拉布', 'Grub, Chief of the Delvers');
    await say(C, S.beaten.b_tyrant ? L('暴龍睡著了……三百年來第一次。地底的時間，好像也慢下來了。', 'The Tyrant sleeps... for the first time in three hundred years. Even time down here seems to slow.') : L('暴龍住在西北邊的巢裡。牠被逼急了會狂暴，一回合動兩次。要趁牠還冷靜的時候打掉牠大半的血。', 'The Tyrant nests in the north-west. Push it hard and it flies into a rage and moves twice a round. Take most of its strength while it is still calm.'));
  },
  async dv_shop(e) { await say(L('掘地人商人', 'Delver Trader'), L('地底什麼都缺，就是不缺石頭。哈哈。', 'We lack everything down here except rocks. Ha ha.')); await shop(SHOPS[e.shop]); },
  async dv_inn(e, ctx) { await inn(ctx, L('地底旅店', 'The Burrow Inn')); },
  async dv_smith() { await say(L('掘地人鐵匠', 'Delver Smith'), L('秘銀，在這裡挖得到。拿來，幫你打。', 'Mythril can be dug down here. Bring it and I will forge it.')); await forgeMenu(L('掘地人的鍛造爐', "The Delvers' Forge")); },
  async dv_collector() {
    const C = L('化石收藏家 布洛', 'Burrow the Collector');
    if (!q('q_fossil')) { await talk(C, L('化石！我最喜歡化石了！地底到處都有，可是我腳短，走不遠。', 'Fossils! I love fossils! They are all over down here, but my legs are short and I cannot walk far.'), L('幫我找三塊好不好？', 'Will you find three for me?')); start('q_fossil'); return; }
    if (q('q_fossil') === 'on' && count('fossil') >= 3) { addItem('fossil', -3); done('q_fossil'); await say(C, L('這塊……是暴龍小時候的牙齒！原來牠以前那麼小……', 'This one... is a tooth from when the Tyrant was small! It used to be so little...')); await gift('deepplate'); return; }
    await say(C, q('q_fossil') === 'done' ? L('我的收藏室，歡迎隨時來參觀！', 'Come and see my collection any time!') : L(`化石：${count('fossil')}／3。`, `Fossils: ${count('fossil')} of 3.`));
  },
  // the old captain's spirit in the Noon Halls
  async nh_captain() {
    const C = L('多蘭隊長的魂', 'The Spirit of Captain Dorran');
    if (!S.flags.captain) {
      S.flags.captain = true;
      await talk(C, L('……又見面了，年輕人。在古都遺跡，你們讓我休息了。', '...We meet again, young ones. In Old Lumera, you let me rest.'), L('可是陛下醒了。我發過誓要守護陛下……所以我回來了。這一次，我要守護的是他的明天。', 'But His Majesty has woken. I swore to guard His Majesty... so I have returned. This time, it is his tomorrow I will guard.'),
        L('我的技藝不多，只有一門：用自己的命，換別人的路。帶走吧。', 'I have only one craft: paying with my own life to clear the way for others. Take it.'));
      await learnJob('duskknight');
      if (S.flags.einJoin2) await say(EIN(), L('……隊長。辛苦了。', '...Captain. Thank you for your service.'));
      return;
    }
    await say(C, L('陛下在最北邊的王座上。他到了一半，會讓正午的光燒灼大家……艾茵的暮光，會保護你們。', 'His Majesty sits on the throne at the north end. When he is pressed, he will let the noon light burn you... Ein\'s veil of dusk will protect you.'));
  },

  // ---------- new folk in the old villages ----------
  async hv_master() { await master('fencer'); },
  async sm_pell() { await master('mage'); },
  async fs_lumi() { await master('cleric'); },
  async dw_shade() { await master('rogue'); },
  async fg_brannoc() { await master('guardian'); },
  async sm_hawk() { await master('ranger'); },
  async fg_tsu() { await master('monk'); },
  async sw_moss() { await master('alchemist'); },
  async sm_arena(e, ctx) { await arena(ctx); },
  async sm_cook() {
    const P = L('廚師 波姆', 'Pomme the Cook');
    if (!q('q_cook')) { await talk(P, L('旅人！餓不餓？……我也是。可是今天的魚沒進貨。', 'Travellers! Hungry? ...So am I. But no fish came in today.'), L('幫我釣兩條鏡湖鯉來好不好？我教你們做菜。', 'Will you catch me two mirror carp? I will teach you to cook.')); start('q_cook'); return; }
    if (q('q_cook') === 'on' && count('carp') >= 2) {
      addItem('carp', -2); done('q_cook');
      await talk(P, L('好新鮮！來，看好了——', 'So fresh! Now, watch closely -'), L('這本食譜送你們。從選單的「料理」就能做菜。做好的菜當作餐點吃，效果能撐好幾場戰鬥喔。', 'Take this recipe book. Cook from Cooking in the menu. Eat a dish as a meal and it keeps working for several battles.'));
      if (!S.inv.recipebook) addItem('recipebook'); await gift('fishstew', 2); start('q_chef'); return;
    }
    if (q('q_chef') === 'on' && Object.keys(S.cooked).length >= 6) {
      done('q_chef');
      await talk(P, L('六道菜！你們已經是真正的廚師了。', 'Six dishes! You are real cooks now.'), L('廚師的戰鬥，就是讓大家吃飽。吃飽了，什麼都打得贏！', 'A chef fights by keeping everyone fed. With a full belly you can beat anything!'));
      await learnJob('chef'); await gift('chefapron'); return;
    }
    await say(P, q('q_chef') === 'done' ? L('今天想吃什麼？……開玩笑的，你們自己煮吧！', 'What would you like today? ...Just kidding, cook it yourselves!') : q('q_chef') === 'on' ? L(`做過的料理：${Object.keys(S.cooked).length}／6 種。`, `Dishes cooked: ${Object.keys(S.cooked).length} of 6 kinds.`) : L('鏡湖鯉，兩條。在鏡湖釣得到。', 'Two mirror carp. You can catch them in Mirror Lake.'));
  },
  async dw_smith() {
    const D = L('鐵匠 布蘭', 'Brann the Smith');
    if (!q('q_forge')) {
      if (S.crystals.length < 3) { await say(D, L('鐵匠鋪還沒開張。等你們變強一點再來吧。', 'The forge is not open yet. Come back when you are a little stronger.')); return; }
      await talk(D, L('你們就是到處找水晶的孩子？聽我說，好裝備是打出來的，不是買來的。', 'You are the children hunting crystals? Listen: good gear is forged, not bought.'), L('這把十字鎬借你們。山裡、台地上閃閃發光的礦脈，敲下來就是礦石。先挖三塊銅礦給我看看。', 'Borrow this pickaxe. The glittering veins in the mountains and on the mesa give ore when you strike them. Bring me three copper ore first.'));
      addItem('pickaxe'); sfx('chest'); await say(null, L('得到了十字鎬！', 'Got the Pickaxe!')); start('q_forge'); return;
    }
    if (q('q_forge') === 'on' && count('copperore') >= 3) { addItem('copperore', -3); done('q_forge'); await say(D, L('好銅！從今天起，你們拿材料來，我就幫你們打。', 'Good copper! From today on, bring me materials and I will forge for you.')); await gift('flametongue'); }
    if (q('q_forge') === 'on') { await say(D, L(`銅礦：${count('copperore')}／3。`, `Copper ore: ${count('copperore')} of 3.`)); return; }
    await forgeMenu(L('布蘭的鍛造爐', "Brann's Forge"));
  },
  async hv_kid(e, ctx) {
    if (q('q_letter') !== 'done') return ORIG.hv_kid(e, ctx);
    const K = L('小提', 'Tibb');
    if (!q('q_shell')) { await talk(K, L('姊姊回信了！她說她最喜歡彩虹貝。', 'My sister wrote back! She says she loves rainbow shells most of all.'), L('白貝海岸有時候撿得到……你們如果看到了，可以幫我撿一個嗎？我想寄給她。', 'Sometimes you can find them on Shellshore... if you see one, will you pick it up for me? I want to send it to her.')); start('q_shell'); return; }
    if (q('q_shell') === 'on' && count('rainbowshell')) { addItem('rainbowshell', -1); done('q_shell'); await say(K, L('好漂亮！我要把它跟信一起寄過去！這是我存的零用錢……一半就好！', 'So pretty! I will send it with my letter! Here is my pocket money... half of it!')); await gold(300); await gift('hiether', 2); return; }
    await say(K, q('q_shell') === 'done' ? L('姊姊說，她把彩虹貝掛在船頭了！', 'My sister says she hung the rainbow shell at the bow of her ship!') : L('彩虹貝在白貝海岸。鹽灣港北邊的沙灘！', 'Rainbow shells are on Shellshore. The beach north of Saltmere!'));
  },
  async fs_granny(e, ctx) {
    const G = L('芬邊村的老奶奶', 'Fenside Granny');
    if (S.crystals.length < 2 && !q('q_locket')) return ORIG.fs_granny(e, ctx);
    if (!q('q_locket')) { await talk(G, L('孩子們……我年輕時在霧沼弄丟了一個墜子。是我奶奶留給我的。', 'Children... when I was young I lost a locket in the Mistfen. My grandmother left it to me.'), L('我爺爺畫了一張地圖，說他把找到的東西埋在打叉的地方……可是他沒來得及告訴我。', 'My grandfather drew a map and said he buried what he found where the X is... but he never got to tell me.')); if (!S.inv.tmap1) addItem('tmap1'); sfx('chest'); await say(null, L('得到了藏寶圖：霧沼！（地圖上會出現紅叉）', 'Got the Treasure Map: Mistfen! (A red X appears on your map.)')); start('q_locket'); return; }
    if (q('q_locket') === 'on' && count('locket')) {
      addItem('locket', -1); done('q_locket');
      await talk(G, L('就是這個……！裡面這張畫，是我奶奶年輕的時候。旁邊這個披斗篷的姊姊……', 'This is it...! The picture inside is my grandmother when she was young. And beside her, a young woman in a cloak...'), L('奶奶說，這個姊姊在霧裡救了她。……咦，這張臉，好像在哪裡見過？', 'Grandmother said this young woman saved her in the mist. ...Oh, I feel I have seen that face somewhere?'));
      await gift('remedy', 3); await gift('silencecharm'); return;
    }
    if (q('q_locket') === 'done') { await say(G, L('那個披斗篷的姊姊，如果還在世，我真想跟她說聲謝謝。', 'If that cloaked young woman is still alive, I would love to thank her.')); return; }
    return ORIG.fs_granny(e, ctx);
  },
  async fg_climber(e, ctx) {
    const C = L('登山家', 'Climber');
    if (!S.inv.cape || (q('q_journal') === undefined && S.crystals.length < 3)) return ORIG.fg_climber(e, ctx);
    if (!q('q_journal')) { await talk(C, L('……我有個弟弟，叫魯瑞克。十年前他說要去霜原找「冰下的村子」，就再也沒回來。', '...I had a younger brother, Rurik. Ten years ago he went to find "the village under the ice" on the Rimefield, and never came back.'), L('有人在霜原撿到過他日記的一頁。如果還有別的頁……我想知道他最後看到了什麼。', 'Someone once found a page of his journal on the Rimefield. If there are more pages... I want to know what he saw at the end.')); start('q_journal'); return; }
    if (q('q_journal') === 'on' && count('journalpage') >= 3) {
      addItem('journalpage', -3); done('q_journal');
      await talk(C, L('「冰下真的有村子。屋頂上刻著盧梅拉的花紋。」', '"There really is a village under the ice. The roofs bear the patterns of Lumera."'), L('「我在最後一間屋子裡，看到一行字：『謝謝妳，披斗篷的姊姊。』……原來逃出來的人，都記得她。」', '"In the last house I found a line of writing: \'Thank you, lady in the cloak.\' ...So everyone who escaped remembered her."'),
        L('「哥，我要回家了。路有點滑。」……這是最後一行。', '"Brother, I am coming home. The path is a bit slippery." ...That is the last line.'), L('……謝謝你們。他到最後，都很開心。這個給你們。', '...Thank you. He was happy, right to the end. Take this.'));
      await gift('expcharm'); return;
    }
    await say(C, q('q_journal') === 'done' ? L('我想，明年春天，我去霜原給他放一束花。', 'Next spring, I think I will take him some flowers on the Rimefield.') : L(`日記：${count('journalpage')}／3 頁。霜原和灰脊山北邊。`, `Journal: ${count('journalpage')} of 3 pages. The Rimefield and northern Greyridge.`));
  },
  async sw_hermit(e, ctx) {
    if (!S.flags.cleared || q('q_mush') !== 'done') return ORIG.sw_hermit(e, ctx);
    const H = L('菇林隱士', 'Hermit of the Grove');
    if (!q('q_morel')) { await talk(H, L('東邊的海上有一座島，底下是會讓時間長大的地方……那裡長著一種「深淵菇」。', 'There is an island on the eastern sea, and beneath it a place where time grows... a mushroom called the abyss morel grows there.'), L('我年輕時是菇王的看守人。菇王睡了以後，我一直想給牠煮一碗湯，叫牠起床。幫我帶三朵回來吧。', 'When I was young I kept watch over the Sporelord. Since it went to sleep I have wanted to make it a soup to wake it up. Bring me three.')); start('q_morel'); return; }
    if (q('q_morel') === 'on' && count('deepshroom') >= 3) { addItem('deepshroom', -3); done('q_morel'); await say(H, L('好香……菇王一定也聞到了。……謝謝。老人家沒什麼好送的，這個拿去。', 'Smells wonderful... the Sporelord must smell it too. ...Thank you. An old man has little to give, but take this.')); await gift('megalixir'); return; }
    await say(H, q('q_morel') === 'done' ? L('昨晚，林子深處好像有誰打了個呵欠。', 'Last night, deep in the grove, something seemed to yawn.') : L(`深淵菇：${count('deepshroom')}／3。`, `Abyss morels: ${count('deepshroom')} of 3.`));
  },

  // ---------- guardians of the east ----------
  async bossIntro(id) {
    const T = {
      kraken: [L('礁海巨妖', 'The Reef Kraken'), L('（巨大的觸手從礁石間伸了出來。觸手還在的時候，攻擊本體只有一半效果！）', '(Huge arms rise from the reef. While its arms live, blows to its body do only half!)')],
      tempest: [L('天穹風龍', 'The Tempest Wyvern'), L('……落不了地……天空的面，不讓我休息……拿走它……如果你們拿得走！', '...Cannot land... the face of the sky will not let me rest... take it... if you can!')],
      morwen: [L('潮之魔女 茉雯', 'Morwen the Tidewitch'), L('誰把我的海放走了？……是艾茵嗎？妳又來打碎重要的東西了嗎！', 'Who let my sea go? ...Is that you, Ein? Have you come to break something precious again!')],
      colossus: [L('齒輪巨像', 'The Gear Colossus'), L('（喀噠、喀噠……巨大的機器轉過頭來。蒸汽從縫隙裡噴了出來。）', '(Clank, clank... the huge machine turns its head. Steam hisses from its joints.)')],
      varek: [L('宰相瓦雷克', 'Chancellor Varek'), L('……艾茵。妳長大了。妳終於會老了啊。\n謝謝你們把稜晶拼回去。現在，引擎可以完成三百年前的工作了。正午，永遠的正午！', '...Ein. You have grown. You can finally grow old.\nThank you for mending the Prism. Now the Engine can finish what it began three hundred years ago. Noon - noon forever!')],
      tyrant: [L('深淵暴龍', 'The Deepmaw Tyrant'), L('（老得忘了自己為什麼要守著的巨獸，發出了地動山搖的吼聲。）', '(A beast too old to remember why it guards lets out a roar that shakes the earth.)')],
      aurel: [L('正午之王 奧瑞爾', 'Aurel, the Noon King'), L('……艾茵。打碎稜晶的守護者。\n妳把夜晚帶回來了。夜晚帶走了伊莉絲。我不會再讓太陽落下了。永不！', '...Ein. The keeper who broke the Prism.\nYou brought the night back. The night took Elyse. I will never let the sun go down again. Never!')],
      echodrake: [L('熔岩飛龍的迴響', 'Echo of the Ember Drake'), L('（燒盡的怒火的影子，又燃了起來。）', '(The shadow of a rage long burned out flares up again.)')],
      echowyrm: [L('冰霜飛龍的迴響', 'Echo of the Frost Wyrm'), L('（山頂的寒風的影子，在黑暗中呼嘯。）', '(The shadow of the summit wind howls in the dark.)')],
      echoknight: [L('亡騎的迴響', 'Echo of the Fallen Knight'), L('（隊長已經安息了。這只是他的盔甲記得的、那三百年的站崗。）', '(The captain is at rest. This is only the three hundred years of watch his armour remembers.)')],
      umbra: [L('稜影', 'Umbra'), L('……一個人。一直一個人。三百年。\n你們把光帶回去了。那我呢？留在這裡的我呢？', '...Alone. Always alone. Three hundred years.\nYou took the light back up. What about me? The me that stayed down here?')],
    };
    if (!T[id] && FIELD_LINES[id]) { await say(FIELD_LINES[id].name, FIELD_LINES[id].line); return; }
    if (!T[id]) return ORIG.bossIntro(id);
    await say(...T[id]);
  },
  async bossAfter(id, ctx) {
    const after = {
      kraken: [L('礁海巨妖', 'The Reef Kraken'), L('（巨妖縮回了深海。礁石上留下了一把三叉戟。）', '(The kraken sinks back into the deep. A trident is left on the reef.)')],
      tempest: [L('天穹風龍', 'The Tempest Wyvern'), L('……終於……可以落地了。風好溫柔……謝謝……', '...At last... I can land. The wind is so gentle... thank you...')],
      colossus: [L('齒輪巨像', 'The Gear Colossus'), L('（巨像停下來了。頭頂的活門，喀啦一聲打開了。）', '(The colossus stops. Overhead, a trapdoor clicks open.)')],
      tyrant: [L('深淵暴龍', 'The Deepmaw Tyrant'), L('（巨獸慢慢地趴下，閉上了眼睛。牠身後的石柱上，有一道光。）', '(The great beast slowly lies down and closes its eyes. On the pillar behind it, a light glows.)')],
      echodrake: [null, L('迴響散成了黑色的灰。', 'The echo scatters into black ash.')], echowyrm: [null, L('迴響散成了黑色的雪。', 'The echo scatters into black snow.')], echoknight: [null, L('迴響散去了。空蕩蕩的黑暗裡，好像有誰說了一聲「辛苦了」。', 'The echo fades. In the empty dark, someone seems to say "thank you for your service".')],
    };
    if (after[id]) { await say(...after[id]); return; }
    if (id === 'morwen') {
      await talk(L('潮之魔女 茉雯', 'Morwen the Tidewitch'), L('……我輸了啊。', '...So I have lost.'), L('艾茵。妳也老了一點呢。……我好羨慕妳。', 'Ein. You have grown a little older too. ...I envy you.'),
        L('我的人民，睡了三百年。是時候讓他們醒來……然後好好地，老去吧。', 'My people have slept for three hundred years. It is time to let them wake... and grow old properly.'),
        L('這份詛咒的技藝，是我背了三百年的東西。拿去吧。用它來守護，不要用來困住誰。', 'This craft of curses is what I have carried for three hundred years. Take it. Use it to protect, never to trap anyone.'));
      await say(null, L('城裡的水影一個一個化成了光，往天上飄去。', 'One by one, the water-shadows of the city turn to light and drift up into the sky.'));
      return ORIG.bossAfter(id);
    }
    if (id === 'varek') {
      await talk(L('宰相瓦雷克', 'Chancellor Varek'), L('……七號，是你派他們來的嗎。……很好。我就是要你這樣做。', '...Seven, did you send them? ...Good. That is just what I told you to do.'),
        L('可是，太遲了。鐘已經要響了。', 'But it is too late. The bell is about to ring.'));
      await say(null, L('噹——噹——噹——塔頂的大鐘響了十二下。', 'DONG - DONG - DONG - the great bell at the top strikes twelve.'));
      await say(null, L('天空一下子亮得刺眼。太陽……停在了正中央，不動了。', 'The sky blazes painfully bright. The sun... stops dead in the middle of the sky.'));
      await talk(L('宰相瓦雷克', 'Chancellor Varek'), L('陛下醒了。他去了他的王座……盧梅拉底下的正午宮殿。', 'His Majesty is awake. He has gone to his throne... the Noon Halls beneath Lumera.'),
        L('艾茵……幫我跟陛下說……我只是……想讓他再笑一次……', 'Ein... tell His Majesty... I only... wanted to see him smile once more...'));
      S.flags.noonFreeze = true; S.flags.noonOpen = true; start('q_noon');
      if (ctx) ctx.syncWorld();
      await say(null, L('永晝降臨了。古都遺跡北邊，通往地底的金色階梯打開了。', 'The endless noon has fallen. On the north side of Old Lumera, a golden stair into the earth has opened.'));
      return;
    }
    if (id === 'umbra') {
      await talk(L('稜影', 'Umbra'), L('……好溫暖。', '...So warm.'), L('原來，下來找我的人，是會出現的啊。', 'So someone does come down to find me after all.'));
      await say(null, L('影子慢慢地亮了起來，變成一道柔和的光，往尖塔頂端升了上去。', 'The shadow slowly brightens into a soft light and rises toward the top of the Spire.'));
      await say(L('稜晶之心', 'The Prism Heart'), L('……我想起來了。連那些一個人的夜晚，我也全部想起來了。謝謝你們，不只拼回了我的光，也接回了我的影子。', '...I remember now. Even the lonely nights, every one of them. Thank you for mending not only my light, but my shadow too.'));
      S.flags.umbra = true; jingle('levelup');
      if (q('q_abyss') === 'on') done('q_abyss');
      await say(null, L('深淵最深處的光裡，留下了一頂王冠。', 'In the light at the bottom of the abyss, a crown is left behind.'));
      await gift('prismcrown');
      return;
    }
    return ORIG.bossAfter(id);
  },
  async ending2() {
    await say(null, L('王冠從奧瑞爾王的頭上滑落，在金色的地板上滾了幾圈。', 'The crown slips from King Aurel\'s head and rolls across the golden floor.'));
    await talk(L('奧瑞爾王', 'King Aurel'), L('……好暗。', '...It is so dark.'), L('外面……天黑了嗎？', 'Outside... has night fallen?'));
    await say(null, L('頭頂的裂縫裡，太陽慢慢地往西邊滑了下去。三百年來第一次，正午結束了。', 'Through a crack overhead, the sun slowly slides toward the west. For the first time in three hundred years, noon is over.'));
    if (S.flags.einJoin2) {
      await talk(EIN(), L('陛下。……我是艾茵。是我打碎了稜晶。', 'Your Majesty. ...It is Ein. I am the one who broke the Prism.'), L('瓦雷克要我跟您說：他只是想讓您再笑一次。', 'Varek asked me to tell you: he only wanted to see you smile once more.'));
    }
    await talk(L('奧瑞爾王', 'King Aurel'), L('瓦雷克……那個笨蛋。', 'Varek... that fool.'), L('……啊。星星。', '...Ah. The stars.'),
      L('伊莉絲說，夜晚是天空把寶石拿出來曬的時候。……我竟然，三百年都沒有抬頭看。', 'Elyse said night was when the sky took out its jewels to air them. ...And for three hundred years, I never once looked up.'));
    await say(null, L('王的身體化成了點點的光，像星星一樣，從裂縫飄了出去。', "The king's body dissolves into motes of light that drift out through the crack like stars."));
    await say(LOWE(), L('……天黑了耶。', '...It is getting dark.'));
    await say(FLORA(), L('嗯。好漂亮。', 'Mm. It is beautiful.'));
    await say(BAL(), L('今天晚上，全大陸的人都會抬頭看吧。', 'Tonight, everyone on the continent will be looking up.'));
    await say(SHIA(), L('……順便看看，還有沒有掉下來的星星可以撿。', '...And checking whether any stars fell that we could pick up.'));
    if (S.flags.einJoin2) await say(EIN(), L('明天，太陽也會再升起來。……然後再落下去。我想，這就是最好的事了。', 'Tomorrow the sun will rise again. ...And set again. I think that is the very best thing of all.'));
  },
};
// the second roll of credits, after the noon king
export const CREDITS2 = () => L(`晶境漫遊\n— 第二部・失落的四面 —\n\n— 旅人 —\n洛　芙蘿　巴爾　希雅\n艾茵\n\n— 東方的人們 —\n潮汐港的柯拉、奈兒、馬洛、艾莉絲、塔拉\n齒輪村的歐特拉與機關人七號\n天空之巢的長老、皮皮、雲雀\n掘地人的葛拉布與布洛\n多蘭隊長\n\n— 守護者們 —\n礁海巨妖　天穹風龍　潮之魔女 茉雯\n齒輪巨像　深淵暴龍\n宰相瓦雷克\n正午之王 奧瑞爾\n\n3D 模型：KayKit、Kenney、Quaternius (CC0)\n方塊材質：Kenney Voxel Pack (CC0)\n音樂：Ninja Adventure — Pixel-boy & AAA (CC0)\n字型：俐方體11號\n\n故事、世界與程式：原創作品\n\n太陽落下了。星星出來了。\n明天，太陽還會再升起來。\n\n……聽說尖塔的底下，還有什麼在等著。\n\n感謝你的遊玩！`,
  `PRISMWANDER\n- PART TWO: THE FOUR LOST FACES -\n\n- TRAVELLERS -\nLowe   Flora   Bal   Shia\nEin\n\n- PEOPLE OF THE EAST -\nCora, Nell, Marlo, Iris and Tara of Tidehaven\nOttla and Unit 7 of Cogwick\nthe Matron, Pip and Lark of Skyhaven\nGrub and Burrow of the Delvers\nCaptain Dorran\n\n- GUARDIANS -\nThe Reef Kraken   The Tempest Wyvern   Morwen the Tidewitch\nThe Gear Colossus   The Deepmaw Tyrant\nChancellor Varek\nAurel, the Noon King\n\n3D models: KayKit, Kenney and Quaternius (CC0)\nBlock textures: Kenney Voxel Pack (CC0)\nMusic: Ninja Adventure by Pixel-boy & AAA (CC0)\nFont: Cubic 11\n\nStory, world and code: an original game\n\nThe sun has set. The stars are out.\nTomorrow, the sun will rise again.\n\n...They say something still waits beneath the Spire.\n\nTHANK YOU FOR PLAYING!`);
void MONSTERS; void hasJob;
