// Every conversation in 晶境漫遊 Prismwander. The land is 稜光大陸 Prismara; three hundred years ago the Prism
// that crowned the Spire shattered, and each of its eight great shards became a crystal holding the craft of a
// hero of old. In Hearthvale, young people set out on a "wandering year"; this year it is Lowe, Flora, Bal and
// Shia. A cloaked traveller called Ein keeps crossing their path; the memory shards tell why.
import { S, addItem, fullHeal, count } from './party.js';
import { JOBS, ITEMS, SHOPS } from './data.js';
import { L } from './i18n.js';
import { say, talk, ask, toast, fishGame } from './ui.js';
import { shop, inn } from './menu.js';
import { jingle, sfx } from './audio.js';

const n = () => S.crystals.length;
const LOWE = () => L('洛', 'Lowe'), FLORA = () => L('芙蘿', 'Flora'), BAL = () => L('巴爾', 'Bal'), SHIA = () => L('希雅', 'Shia'), EIN = () => L('艾茵', 'Ein');
const ELDER = () => L('奧森長老', 'Elder Ozen');
const gift = async (id, k = 1) => { addItem(id, k); sfx('chest'); await say(null, L(`得到了${ITEMS[id].name}${k > 1 ? '×' + k : ''}！`, `Got ${ITEMS[id].name}${k > 1 ? ' x' + k : ''}!`)); };
const gold = async (g) => { S.gold += g; sfx('chest'); await say(null, L(`得到了 ${g} 金幣！`, `Got ${g} gold!`)); };
const q = (id) => S.quests[id];
const start = (id) => { if (!S.quests[id]) { S.quests[id] = 'on'; toast(L(`新的委託：${QUESTS[id].title}`, `New request: ${QUESTS[id].title}`)); } };
const done = (id) => { S.quests[id] = 'done'; jingle('crystal'); };

// ---------- the requests people ask of you ----------
export const QUESTS = {
  q_letter: { get title() { return L('給姊姊的信', 'A Letter for a Sister'); }, get desc() { return L('把小提的信送到鹽灣港的姊姊手上。鹽灣港在爐心村的東北方，沿著海岸。', "Take Tibb's letter to their sister in Saltmere, north-east of Hearthvale on the coast."); } },
  q_fish:   { get title() { return L('金色的夢', 'A Golden Dream'); }, get desc() { return L('鹽灣港的老漁夫想看一眼金鱗錦鯉。聽說鏡湖和沙泉鎮的泉水裡釣得到。', 'The old Saltmere fisher longs to see a Golden Koi. They say one can be caught in Mirror Lake or the Dunewell spring.'); } },
  q_herb:   { get title() { return L('沼地的月光草', 'Moonherb from the Mire'); }, get progress() { return `${Math.min(5, count('moonherb'))}/5`; }, get desc() { return L('芬邊村的藥師需要五株月光草。霧沼裡發著淡光的就是。', 'The Fenside healer needs five Moonherbs. They glow faintly in the Mistfen.'); } },
  q_mush:   { get title() { return L('隱士的晚餐', "The Hermit's Supper"); }, get progress() { return `${Math.min(4, count('glowcap'))}/4`; }, get desc() { return L('孢子林的隱士想要四朵螢光菇。', 'The hermit of Sporewood wants four Glowcaps.'); } },
  q_hunt:   { get title() { return L('霜原的巡邏', 'Patrol of the Rimefield'); }, get progress() { return `${Math.min(6, S.kills.rimefield || 0)}/6`; }, get desc() { return L('霜門村的守衛拜託你在霜原打倒六隻魔物。霜原在灰脊山的北邊。', 'The Frostgate guard asks you to defeat six monsters on the Rimefield, north of Greyridge.'); } },
  q_ember:  { get title() { return L('熄不了的火', 'The Fire That Never Dies'); }, get desc() { return L('沙泉鎮的挖寶人說，熔岩峰的火口住著一條飛龍。打倒牠。', 'The Dunewell digger says a drake lives in the crater of Emberpeak. Defeat it.'); } },
  q_shards: { get title() { return L('稜晶的記憶', 'Memories of the Prism'); }, get progress() { return `${S.shards.length}/24`; }, get desc() { return L('爐心村的學者想知道記憶碎片說了什麼。找到十二塊就回去找他，全部二十四塊更好。', 'The Hearthvale scholar wants to hear what the memory shards say. Return with twelve; all twenty-four is better still.'); } },
};

// ---------- the twenty-four memory shards ----------
export const SHARDS = [
  ['……今天被選為稜晶的守護者。我叫艾茵，十六歲。爸爸說這是古都最光榮的工作。', '...Today I was chosen as keeper of the Prism. My name is Ein. I am sixteen. Father says it is the proudest work in the capital.'],
  ['稜晶會說話。不是用聲音，是用溫度。它開心的時候，整座盧梅拉的夜晚都是亮的。', 'The Prism speaks. Not in sound, in warmth. When it is glad, every night in Lumera is bright.'],
  ['八位英雄的技藝封在稜晶的八個面裡：守衛、弓手、詩人、武僧、鍊金、時術、劍舞、星術。', "Eight heroes' crafts are sealed in its eight faces: guardian, ranger, bard, monk, alchemist, chronomancer, bladedancer, astromancer."],
  ['奧瑞爾王來看稜晶。他問我：「它能讓太陽不下山嗎？」我笑著說不行。他沒有笑。', 'King Aurel came to see the Prism. He asked me, "Can it keep the sun from setting?" I laughed and said no. He did not laugh.'],
  ['王后在冬天的夜裡過世了。從那天起，王很怕天黑。', 'The queen died on a winter night. From that day on the king was afraid of the dark.'],
  ['學者們說，只要讓稜晶的光逆著流，時間就會停在正午。永遠的白晝。', "The scholars say that if the Prism's light is made to flow backward, time will stop at noon. An endless day."],
  ['永遠的白晝，就沒有明天了。花不會開，孩子不會長大。為什麼沒有人聽我說？', 'An endless day means no tomorrow. Flowers would never open, children never grow up. Why will no one listen?'],
  ['王的隊長來找我。他說：「艾茵，我也覺得這是錯的。可是我發過誓要守護陛下。」', 'The king\'s captain came to me. He said, "Ein, I think it is wrong too. But I swore to guard His Majesty."'],
  ['儀式定在夏至的正午。還有七天。', 'The rite is set for noon on midsummer. Seven days left.'],
  ['我問稜晶：「你想要這樣嗎？」它變得好冷好冷。', 'I asked the Prism, "Do you want this?" It went cold, so very cold.'],
  ['我做了一根守護者的杖。如果真的到了那一刻……', "I made a keeper's staff. If it truly comes to that..."],
  ['正午。光開始倒流，鳥停在半空中，噴泉的水不再落下。', 'Noon. The light began to flow backward. Birds hung in the air; the fountains stopped falling.'],
  ['我舉起杖，打了下去。對不起。對不起。對不起。', 'I raised the staff and struck. I am sorry. I am sorry. I am sorry.'],
  ['稜晶碎成了八塊大的，和數不清的小碎片。大的飛向遠方，小的像粉紅色的雪落下來。', 'The Prism broke into eight great pieces and more small ones than I could count. The great ones flew far away; the small ones fell like pink snow.'],
  ['停住的時間一下子全部湧回來。盧梅拉的城牆，在一瞬間老了三百年。', 'All the stopped time came rushing back at once. In a moment the walls of Lumera grew three hundred years old.'],
  ['我站在最中間。時間繞過了我，像河水繞過一塊石頭。', 'I stood at the very centre. Time flowed around me, the way a river flows around a stone.'],
  ['逃出古都的人往西北走，在霜原上建了村子。他們不知道我為什麼不會老。', 'Those who fled the capital went north-west and built villages on the Rimefield. They never knew why I did not grow old.'],
  ['一百年。我在沙泉鎮喝茶，老闆娘的曾曾祖母也在這裡倒過茶給我。', "One hundred years. I drank tea in Dunewell; the innkeeper's great-great-grandmother once poured tea for me here too."],
  ['兩百年。隊長還在古都裡守著，連骨頭都不肯休息。我沒辦法靠近他。', 'Two hundred years. The captain still stands guard in the capital, his very bones refusing to rest. I cannot go near him.'],
  ['八塊水晶各自找到了守護它的東西：古樹、飛龍、台地之王……它們也在等。', 'Each of the eight crystals found something to guard it: an old tree, a wyrm, the Mesa King... They are waiting too.'],
  ['我不能自己去碰水晶。它們認得打碎稜晶的手。', 'I cannot touch the crystals myself. They know the hand that broke the Prism.'],
  ['爐心村的「漫遊之年」，是我三百年前隨口講給第一任村長聽的故事變成的。', 'Hearthvale\'s "wandering year" grew from a story I told the first village head, three hundred years ago.'],
  ['如果有人集齊八塊，稜晶就能再一次完整。不是為了停住時間——是為了讓它好好休息。', 'If someone gathers all eight, the Prism can be whole once more. Not to stop time, but so that it can finally rest.'],
  ['今年出發的是四個孩子。洛、芙蘿、巴爾、希雅。……這一次，我想跟著他們看到最後。', 'This year four children set out: Lowe, Flora, Bal and Shia. ...This time I want to see it through to the end with them.'],
];
// the signposts and old tablets
export const SIGNS = {
  s_hearth: ['【爐心村北口】\n↑ 晨風原・鏡湖・古都遺跡・稜晶尖塔\n← 芬邊村・霧沼　→ 孢子林・鹽灣港', '[Hearthvale, north gate]\n↑ Dawnbreeze Fields, Mirror Lake, Old Lumera, the Spire\n← Fenside, the Mistfen   → Sporewood, Saltmere'],
  s_fen: ['【芬邊村】\n← 霧沼（夜裡別進去）　↑ 低語林', '[Fenside]\n← the Mistfen (not at night)   ↑ Whisperwood'],
  s_lake: ['【鏡湖】\n傳說湖面曾在夜裡映著稜晶的光，像第二個月亮。', "[Mirror Lake]\nThey say the lake once held the Prism's light at night, like a second moon."],
  s_salt: ['【鹽灣港】漁人與水手的港口。\n北：白貝海岸　西北：沙泉鎮', '[Saltmere] A port of fishers and sailors.\nNorth: Shellshore   North-west: Dunewell'],
  s_dune: ['【沙泉鎮】\n北：赤砂台地　東北：熔岩峰（危險！）', '[Dunewell]\nNorth: Redsand Mesa   North-east: Emberpeak (danger!)'],
  s_ember: ['【警告】熔岩峰。\n三百年前的那天起，這座山的火就沒有熄過。', '[WARNING] Emberpeak.\nIts fire has not gone out since that day three hundred years ago.'],
  s_ruins: ['【古都盧梅拉】\n石碑上刻著：「此地時間曾經停駐。」\n下面有一行小字：「對不起。——艾」', '[Old Lumera]\nThe stone reads: "Here, time once stood still."\nBelow, in small letters: "I am sorry. - E"'],
  s_frost: ['【霜門村】\n西北：灰脊山登山道・霜原', '[Frostgate]\nNorth-west: the Greyridge trail, the Rimefield'],
  s_rime: ['【霜原】\n冰下埋著古都逃難者的第一座村莊。', '[Rimefield]\nBeneath the ice lies the first village of those who fled the capital.'],
  s_spire: ['【稜晶尖塔】\n唯有集齊八道光的人，才能走上螺旋的路。', '[The Prism Spire]\nOnly one who gathers all eight lights may climb the spiral path.'],
  s_spore: ['【孢子林】\n別在大菇下面睡著。（真的會睡著）', "[Sporewood]\nDon't fall asleep under the big mushrooms. (You really will.)"],
  s_forest: ['【低語林】\n樹會記得走過的人。說話小聲一點。', '[Whisperwood]\nThe trees remember those who pass. Speak softly.'],
  s_mist: ['【霧沼】\n霧裡常有人看見一位披斗篷的旅人。問她名字，她總是笑而不答。', '[Mistfen]\nIn the mist people often see a cloaked traveller. Ask her name and she only smiles.'],
  s_mtn: ['【灰脊山登山口】\n山頂住著冰霜飛龍。斗篷能讓你從高處平安滑下來。', '[Greyridge trailhead]\nA frost wyrm lives on the summit. A cape will carry you safely down from high places.'],
};
// what bites where: [fish, weight, how wide the window is for the catch, night only]
const CATCH = {
  lake: [['carp', 60, 0.24], ['trout', 30, 0.17], ['goldkoi', 7, 0.09], ['prismfish', 5, 0.07, true]],
  sea: [['bream', 70, 0.18], ['trout', 20, 0.18], ['prismfish', 6, 0.07, true]],
  marsh: [['mudcat', 80, 0.24], ['carp', 20, 0.22]],
  oasis: [['sandeel', 75, 0.18], ['goldkoi', 12, 0.09]],
};

export const SCRIPTS = {
  async intro() {
    await say(null, L('稜光大陸。三百年前，尖塔頂端的「稜晶」碎成了八塊，散落在大地的每個角落。', 'Prismara. Three hundred years ago, the Prism atop the Spire shattered into eight pieces and scattered across the land.'));
    await say(null, L('每一塊碎片，都封著古代英雄的一門技藝。', 'Each shard holds the craft of a hero of old.'));
    await say(null, L('爐心村的孩子滿十六歲，就要踏上「漫遊之年」，自己去看看這個世界。', "When Hearthvale's children turn sixteen, they set out on their wandering year to see the world for themselves."));
    await say(null, L('今年出發的，是洛、芙蘿、巴爾和希雅。', 'This year it is Lowe, Flora, Bal and Shia who go.'));
    await talk(ELDER(), L('四個都到齊了嗎？很好。村子能教你們的，就只有劍、魔法、祈禱和……偷東西的手藝。', 'All four of you? Good. The village can teach you only the sword, magic, prayer and... light fingers.'),
      L('剩下的，要靠你們自己去找。看到發光的水晶，就去碰碰它吧。', 'The rest you must find yourselves. When you see a crystal glowing, go and touch it.'),
      L('聽說集齊八塊的人，能打開稜晶尖塔的大門。……我年輕時只找到三塊呢，哈哈。', 'They say whoever gathers all eight can open the gate of the Prism Spire. ...I only ever found three, ha ha.'),
      L('世界很大喔。北邊有古都的遺跡，東邊有港口，西邊有沼澤……慢慢走吧。', 'The world is wide. Ruins of the old capital to the north, a port to the east, a marsh to the west... take your time.'));
    await say(null, L('【WASD／方向鍵】移動　【空白鍵】跳躍　【滑鼠拖曳／Q、R】轉動視角　【滾輪】拉遠拉近\n【E／Z】調查、對話　【Esc】選單　【M】音樂開關', '[WASD / arrows] move   [Space] jump   [drag / Q, R] turn the camera   [wheel] zoom\n[E / Z] look, talk   [Esc] menu   [M] music on/off'));
    S.flags.intro = true;
  },

  // ---------- Hearthvale ----------
  async hv_elder() {
    if (S.flags.cleared) { await say(ELDER(), L('回來啦！……那位叫艾茵的姑娘，在旅館住下了喔。說是要從頭開始過日子。', "You're back! ...That young woman called Ein has taken a room at the inn. Says she wants to start living her days from the beginning.")); return; }
    if (n() >= 8) { await say(ELDER(), L('八塊都找齊了！……去吧，尖塔在遙遠的北方，古都遺跡的再過去。我會在村子裡等你們回來。', 'All eight! ...Go. The Spire stands far to the north, beyond the ruins of the old capital. I will be waiting here.')); return; }
    if (n() >= 2 && !S.flags.compass) {
      await talk(ELDER(), L('已經找到兩塊了？真了不起。這個給你們。', 'Two already? Splendid. Take this.'), L('是我年輕時用的晶石羅盤，會指向最近的水晶喔。', 'The crystal compass I carried when I was young. It points to the nearest crystal.'));
      addItem('compass'); S.flags.compass = true; sfx('chest'); toast(L('得到了晶石羅盤！', 'Got the Crystal Compass!')); return;
    }
    if (S.flags.ein >= 1 && !S.flags.elderEin) {
      S.flags.elderEin = true;
      await talk(ELDER(), L('披斗篷的旅人？……奇怪。我小時候，也見過一個披著斗篷的姊姊。', 'A traveller in a cloak? ...Strange. When I was a boy, I met a young woman in a cloak too.'), L('她教我怎麼用羅盤。那已經是六十年前的事了。', 'She taught me how to use a compass. That was sixty years ago.'));
      return;
    }
    await say(ELDER(), [L('西邊的低語林、北邊的鏡湖、東北的海岸……先去近一點的地方看看吧。', 'Whisperwood to the west, Mirror Lake to the north, the coast to the north-east... start somewhere close.'), L('高的地方上不去？說不定別的路就繞得上去。看看四周吧。', "Can't get up somewhere high? There may be another way round. Look about you."), L('東北的赤砂台地很陡。沙泉鎮的人應該知道怎麼上去。', 'The Redsand Mesa in the north-east is steep. The people of Dunewell will know how to climb it.'), L('古都遺跡裡，聽說有個不肯安息的騎士。小心點。', "In the ruins of the old capital there's said to be a knight who will not rest. Be careful.")][Math.min(3, Math.floor(n() / 2))]);
  },
  async hv_shop(e) { await say(L('雜貨店老闆', 'Shopkeeper'), n() >= 4 ? L('你們的名字都傳到鹽灣港了喔！這次算便宜一點……開玩笑的。', 'Your names have reached Saltmere! A discount this time... just kidding.') : L('出遠門要帶夠回復藥喔！', 'Take plenty of potions on a long trip!')); await shop(SHOPS[e.shop]); },
  async hv_inn(e, ctx) { await inn(ctx, L('旅館老闆', 'Innkeeper')); },
  async hv_kid() {
    const K = L('小提', 'Tibb');
    if (!q('q_letter')) {
      await talk(K, L('你們要去漫遊了嗎？那……可以幫我一個忙嗎？', "You're going wandering? Then... can you do me a favour?"), L('我姊姊去年漫遊完，就留在鹽灣港當水手了。這封信幫我交給她好不好？', 'My sister finished her wandering year and stayed in Saltmere as a sailor. Will you give her this letter?'));
      addItem('letter'); start('q_letter'); sfx('chest'); await say(null, L('收下了給姊姊的信。', 'You take the letter for the sister.')); return;
    }
    if (q('q_letter') === 'on') { await say(K, L('鹽灣港在東北邊的海岸！穿過孢子林旁邊就到了。', 'Saltmere is on the north-east coast! Go past Sporewood and you are there.')); return; }
    await say(K, L('姊姊回信了！她說等我長大，要帶我出海。嘿嘿。', 'My sister wrote back! She says when I grow up she will take me to sea. Hehe.'));
  },
  async hv_farmer() { await say(L('農夫', 'Farmer'), n() >= 3 ? L('最近晚上的星星特別亮。是你們帶著水晶的關係嗎？', 'The stars have been extra bright at night lately. Is it because you carry the crystals?') : L('跳不上去的時候，找找看有沒有可以先踩的石頭。我年輕時就是這樣爬上海邊那根石柱的。', "When you can't jump high enough, look for a stone to step on first. That's how I got up the sea stack when I was young.")); },
  async hv_mom() {
    const M = L('洛的媽媽', "Lowe's Mother");
    if (n() === 0) await say(M, L('洛，便當帶了沒？……已經吃完了？才出門十步耶！', 'Lowe, did you take your lunch? ...You ate it already? You are ten steps from the door!'));
    else if (n() < 4) await say(M, L(`已經找到 ${n()} 塊水晶啦？晚上記得早點睡，夜裡的路很暗。`, `${n()} crystals already? Get to bed early. The roads are dark at night.`));
    else if (n() < 8) await say(M, L('村裡的人都在說你們的事呢。……你們長大了。', 'The whole village is talking about you. ...You have grown up.'));
    else await say(M, L('要去尖塔了嗎。……嗯，媽媽會煮一大鍋湯等你們。', 'Off to the Spire? ...Then I will make a big pot of soup for when you come home.'));
  },
  async hv_sage() {
    const SC = L('村裡的學者', 'Village Scholar');
    if (!q('q_shards') && S.shards.length > 0) {
      await talk(SC, L('那是……粉紅色的碎片？讓我看看！', 'Is that... a pink shard? Let me see!'), L('這是稜晶的「記憶碎片」！傳說稜晶碎掉時，它記得的事也一起碎了。', 'A memory shard of the Prism! They say that when the Prism broke, what it remembered broke with it.'), L('幫我找吧！十二塊就來找我，我會好好答謝你們。', 'Find more for me! Come back with twelve and I will thank you properly.'));
      start('q_shards'); return;
    }
    if (q('q_shards') === 'on' && S.shards.length >= 12 && !S.flags.shard12) { S.flags.shard12 = true; await say(SC, L('十二塊！……守護者艾茵。三百年前的人。原來稜晶是被她打碎的。', 'Twelve! ...A keeper named Ein, from three hundred years ago. So she is the one who broke the Prism.')); await gift('wisdomring'); await say(SC, L('如果二十四塊全部找齊，我們就能知道整個故事了。', 'If all twenty-four are found, we will know the whole story.')); return; }
    if (q('q_shards') === 'on' && S.shards.length >= 24) { done('q_shards'); await talk(SC, L('全部二十四塊……！', 'All twenty-four...!'), L('她不是壞人。她是為了讓明天能來，才打碎稜晶的。', 'She was no villain. She broke the Prism so that tomorrow could come.')); await gold(1000); return; }
    if (q('q_shards') === 'on') { await say(SC, L(`記憶碎片 ${S.shards.length} 塊。碎片在各地都有，靠近時會發出粉紅的光。`, `${S.shards.length} memory shards. They are everywhere, glowing pink when you come near.`)); return; }
    await talk(SC, L('每個人都可以有一個主職業和一個副職業。', 'Everyone can have one main job and one sub job.'),
      L('主職業決定能力值、能拿的武器；副職業只借它學會的技能來用。', 'The main job sets your stats and what weapons you can hold; the sub job only lends the abilities it has learned.'),
      L('戰鬥得到的 JP 會讓職業升級。副職業也拿得到一半喔。', 'JP from battle levels up your jobs. The sub job gets half as well.'));
  },

  // ---------- Fenside ----------
  async fs_healer() {
    const H = L('藥師瑪拉', 'Mara the Healer');
    if (!q('q_herb')) { await talk(H, L('旅人？正好。霧沼裡長著一種叫月光草的藥草，會發出淡淡的光。', 'Travellers? Just in time. A herb called moonherb grows in the Mistfen. It glows faintly.'), L('能幫我摘五株回來嗎？我要做退燒的藥給村裡的孩子。', 'Could you bring me five? I am making fever medicine for the village children.')); start('q_herb'); return; }
    if (q('q_herb') === 'on' && count('moonherb') >= 5) { addItem('moonherb', -5); done('q_herb'); await say(H, L('五株都齊了！謝謝你們。這些是謝禮。以後受傷了就來，我免費幫你們治。', 'All five! Thank you. Here is something for your trouble. And come to me whenever you are hurt; I will treat you for free.')); await gift('phoenix', 3); return; }
    if (q('q_herb') === 'done') { await say(H, L('來，坐下。我幫大家看看傷。', 'Here, sit down. Let me see to those wounds.')); fullHeal(); sfx('heal'); toast(L('大家都恢復了。', 'Everyone is healed.')); return; }
    await say(H, L(`月光草，現在是 ${Math.min(5, count('moonherb'))}／5 株。霧沼在村子的西南邊。`, `Moonherbs: ${Math.min(5, count('moonherb'))} of 5. The Mistfen is south-west of the village.`));
  },
  async fs_granny() {
    const G = L('芬邊村的老奶奶', 'Fenside Granny');
    if (S.flags.ein >= 3) { await say(G, L('艾茵？……我奶奶的奶奶說過，霧裡的旅人叫這個名字。她總是一個人，總是在等什麼。', "Ein? ...My grandmother's grandmother said the traveller in the mist had that name. Always alone, always waiting for something.")); return; }
    await talk(G, L('很久很久以前，北方有一座叫盧梅拉的都城。', 'Long, long ago, there was a capital in the north called Lumera.'), L('那裡的夜晚，被稜晶照得跟白天一樣亮。後來，一夜之間就變成了廢墟。', 'Its nights were as bright as day under the Prism. Then, in a single night, it fell to ruin.'), L('沒有人知道發生了什麼……也許，那些粉紅色的碎片知道吧。', 'No one knows what happened... perhaps those pink shards do.'));
  },
  async fs_kid() { await say(L('芬邊村的孩子', 'Fenside Child'), S.flags.night ? L('晚上沼澤會有幽靈出來喔！真的！白天就看不到了。', 'At night ghosts come out in the marsh! Really! You never see them in the day.') : L('沼澤裡有好多水窪，掉下去會被沖回岸上。我掉過三次。', 'The marsh is full of pools. Fall in and you wash back to shore. I have fallen in three times.')); },
  async fs_shop(e) { await say(L('芬邊村的雜貨商', 'Fenside Trader'), L('沼地的路難走，帶頂帳篷吧。', 'The marsh roads are hard going. Take a tent.')); await shop(SHOPS[e.shop]); },

  // ---------- Saltmere ----------
  async sm_shop(e) { await say(L('港口商人', 'Harbour Trader'), L('船剛靠港，貨很新鮮！', 'A ship just came in; everything is fresh!')); await shop(SHOPS[e.shop]); },
  async sm_inn(e, ctx) { await inn(ctx, L('海鷗亭', 'The Gull Inn')); },
  async sm_fisher() {
    const F = L('老漁夫格雷', 'Old Grey the Fisher');
    if (!S.inv.fishrod) {
      await talk(F, L('喲，年輕人。會釣魚嗎？不會？那可不行。', 'Ho, young ones. Can you fish? No? That will never do.'), L('這根釣竿給你們。看到水面上有一圈一圈的波紋，就站在旁邊按 E。', 'Take this rod. Where you see rings spreading on the water, stand beside them and press E.'), L('魚咬鉤的時候會出現「！」，馬上拉！然後在指針走到亮的地方時再按一次。', 'When a fish bites a "!" appears. Pull at once! Then press again when the needle crosses the bright mark.'));
      addItem('fishrod'); sfx('chest'); await say(null, L('得到了釣竿！', 'Got the Fishing Rod!'));
      await talk(F, L('對了……我這輩子都想看一眼「金鱗錦鯉」。鏡湖跟沙泉鎮的泉水裡好像有。', 'And... all my life I have wanted to see a Golden Koi. They say Mirror Lake and the Dunewell spring have them.'), L('要是釣到了，拿來給我看看吧。', 'If you catch one, bring it to me.'));
      start('q_fish'); return;
    }
    if (q('q_fish') === 'on' && count('goldkoi') > 0) { addItem('goldkoi', -1); done('q_fish'); await talk(F, L('這、這是……金鱗錦鯉！哈哈哈！活了七十年，總算看到了！', 'Th-this is... a Golden Koi! Ha ha ha! Seventy years, and at last I have seen one!'), L('看夠了，我會把牠放回湖裡。這是謝禮！', 'I have seen enough; I will let it go back to the lake. Here, a thank-you!')); await gold(500); await gift('phoenix', 2); return; }
    const caught = Object.values(S.fish).reduce((a, b) => a + b, 0);
    await say(F, caught ? L(`已經釣了 ${caught} 條啦？聽說夜裡會浮上來一種七彩的魚……我只在夢裡見過。`, `${caught} fish already? They say a fish of every colour rises at night... I have only seen it in dreams.`) : L('有波紋的地方才有魚。湖邊、海邊、沼澤、沙漠的泉水都有。', 'Fish are where the ripples are: by the lake, the sea, the marsh, even the desert spring.'));
  },
  async sm_sister() {
    const SI = L('水手妮娜', 'Nina the Sailor');
    if (q('q_letter') === 'on' && S.inv.letter) {
      addItem('letter', -1); done('q_letter');
      await talk(SI, L('小提寫的信？……「姊姊，我會游泳了，可是還是會怕魚」……哈哈，這傢伙。', 'A letter from Tibb? ..."Sister, I can swim now but I am still scared of fish"... ha ha, that kid.'), L('謝謝你們跑這麼遠。我也寫一封回信，下次見到小提就說「姊姊很想你」。', 'Thank you for coming so far. I will write back. When you see Tibb, say their sister misses them.'));
      await gold(200); await gift('hipotion', 2); return;
    }
    await say(SI, n() >= 5 ? L('出海的人都說，最近從海上看尖塔，塔頂又開始發光了。', 'Sailors say that lately, looking back from the sea, the top of the Spire has begun to glow again.') : L('我漫遊那年，在這裡看到第一次日出，就不想走了。', 'In my wandering year I saw my first sunrise here, and never wanted to leave.'));
  },
  async sm_sailor() { await say(L('水手', 'Sailor'), [L('東邊的海外什麼都沒有。……至少船長是這麼說的。', 'There is nothing beyond the eastern sea. ...Or so the captain says.'), L('海岸北邊有一根石柱，柱頂好像有水晶在發光。', 'North along the coast is a sea stack. Something like a crystal glows on top.'), L('晚上別在碼頭睡著，會被海鳥啄。', 'Do not fall asleep on the pier at night. The gulls will peck you.')][Math.floor(S.time / 30) % 3]); },

  // ---------- Dunewell ----------
  async dw_shop(e) { await say(L('沙泉鎮的商人', 'Dunewell Trader'), L('沙漠裡什麼都貴，但我的貨最好。', 'Everything costs more in the desert, but my goods are the best.')); await shop(SHOPS[e.shop]); },
  async dw_inn(e, ctx) {
    if (S.flags.ein >= 3 && !S.flags.innTea) { S.flags.innTea = true; await talk(L('沙泉鎮的旅館', 'Dunewell Inn'), L('披斗篷的客人？她每隔幾十年就會來一次喔。', 'The guest in the cloak? She comes by every few decades.'), L('我奶奶那一代就有她的紀錄了。點的永遠是同一種茶。', "There are records of her from my grandmother's day. She always orders the same tea.")); }
    await inn(ctx, L('沙泉鎮的旅館', 'Dunewell Inn'));
  },
  async dw_digger() {
    const D = L('挖寶人', 'Treasure Digger');
    if (!S.inv.boots) { await say(D, L('台地的牆有三格高，一般人跳不上去。……我在鎮子東南邊的沙丘埋了一雙彈跳靴，忘了挖回來。你們去拿吧！', "The mesa's walls are three blocks high; nobody can jump that. ...I buried a pair of spring boots in the dunes south-east of town and forgot to dig them up. Go and take them!")); return; }
    if (!q('q_ember')) { await talk(D, L('穿上彈跳靴，台地就不算什麼了吧？', 'With those boots on, the mesa is nothing now, eh?'), L('不過更東北邊的熔岩峰……火口裡住著一條飛龍。牠一叫，整個鎮子的沙都會跳起來。', 'But further north-east, on Emberpeak... a drake lives in the crater. When it roars, the sand in town jumps.'), L('打倒牠的話，我把挖到的寶物分你們！', 'Beat it and I will share my treasure with you!')); start('q_ember'); return; }
    if (q('q_ember') === 'on' && S.beaten.b_ember) { done('q_ember'); await say(D, L('那聲音真的不見了！說好的，這是我挖到的寶！', 'The roaring has really stopped! As promised, here is my treasure!')); await gold(800); await gift('phoenix', 3); return; }
    await say(D, q('q_ember') === 'done' ? L('火山安靜下來以後，我又挖到了好多東西。嘿嘿。', 'Since the volcano went quiet I have dug up all sorts. Heh heh.') : L('熔岩峰在東北。路上的熱氣很嗆，帶夠回復藥。', 'Emberpeak is to the north-east. The heat on the way is fierce; take plenty of potions.'));
  },
  async dw_nomad() { await say(L('遊牧民', 'Nomad'), L('台地上有一塊水晶，在東邊最高的地方。台地之王守著它。', 'There is a crystal on the mesa, at the highest point on the east side. The Mesa King guards it.')); },

  // ---------- Frostgate ----------
  async fg_shop(e) { await say(L('霜門村的商人', 'Frostgate Trader'), L('山上冷，多帶點高級回復藥吧。', 'It is cold up the mountain. Take extra Hi-Potions.')); await shop(SHOPS[e.shop]); },
  async fg_inn(e, ctx) { await inn(ctx, L('霜門村的旅館', 'Frostgate Inn')); },
  async fg_climber() { await say(L('登山家', 'Climber'), S.inv.cape ? L('有了滑翔斗篷，從山頂跳下來也不怕了吧。', 'With a glide cape you can jump off the summit without a care.') : L('灰脊山頂有一塊水晶，可是住著一條冰霜飛龍。……山北邊的箱子裡，好像有一件能在空中滑翔的斗篷。', 'There is a crystal on the summit of Greyridge, and a frost wyrm lives there. ...A chest on the north of the mountain is said to hold a cape you can glide with.')); },
  async fg_guard() {
    const G = L('霜門村守衛', 'Frostgate Guard');
    if (!q('q_hunt')) { await talk(G, L('最近霜原的魔物越來越多了，連商隊都不敢走。', 'There are more and more monsters on the Rimefield; not even the caravans dare cross.'), L('你們看起來挺能打的。幫我在霜原打倒六隻吧！霜原在灰脊山的北邊。', 'You look like you can fight. Defeat six of them on the Rimefield for me! It lies north of Greyridge.')); start('q_hunt'); return; }
    if (q('q_hunt') === 'on' && (S.kills.rimefield || 0) >= 6) { done('q_hunt'); await say(G, L('六隻了！商隊又能走了。這是村子湊的謝禮。', 'Six! The caravans can travel again. The village put this together for you.')); await gold(600); await gift('hipotion', 3); return; }
    await say(G, q('q_hunt') === 'done' ? L('霜原安靜多了。謝啦。', 'The Rimefield is much quieter. Thanks.') : L(`霜原的魔物：${Math.min(6, S.kills.rimefield || 0)}／6。`, `Rimefield monsters: ${Math.min(6, S.kills.rimefield || 0)} of 6.`));
  },

  // ---------- Sporewood ----------
  async sw_hermit() {
    const H = L('菇林隱士', 'Hermit of the Grove');
    if (!q('q_mush')) { await talk(H, L('……客人？好久沒有人來了。', '...Visitors? It has been a long time.'), L('我想吃螢光菇燉湯，可是腰不好。幫我在林子裡撿四朵吧。', 'I would love a glowcap stew, but my back is bad. Pick four in the grove for me.')); start('q_mush'); return; }
    if (q('q_mush') === 'on' && count('glowcap') >= 4) { addItem('glowcap', -4); done('q_mush'); await say(H, L('好香……謝謝。這件斗篷是用孢子織的，比看起來的還結實喔。', 'Smells wonderful... thank you. This cloak is woven of spores. It is tougher than it looks.')); await gift('sporecloak'); return; }
    await say(H, q('q_mush') === 'done' ? L('菇王睡在林子的東南邊。牠一打呵欠，整片林子都會想睡。', 'The Sporelord sleeps in the south-east of the grove. When it yawns, the whole wood grows drowsy.') : L(`螢光菇，${Math.min(4, count('glowcap'))}／4 朵。在大菇的影子下面找找。`, `Glowcaps: ${Math.min(4, count('glowcap'))} of 4. Look in the shade of the big mushrooms.`));
  },

  // ---------- Ein, the cloaked traveller ----------
  async ein() {
    const k = S.flags.ein || 0;
    if (S.flags.cleared) { await say(EIN(), L('早安。……能說「早安」，真好。今天要去哪裡呢？', 'Good morning. ...It is so good to be able to say "good morning". Where are you off to today?')); return; }
    if (k >= 6) { await say(EIN(), L('走吧。塔頂在等我們。', 'Let us go. The top of the Spire is waiting.')); return; }
    if (k === 0) {
      await talk(L('披斗篷的旅人', 'Cloaked Traveller'), L('……爐心村的漫遊之年？這麼說，今年是你們啊。', "...Hearthvale's wandering year? So this year it is you."), L('我叫艾茵，只是個旅人。走過很多地方，也看過很多個出發的孩子。', 'My name is Ein. Just a traveller. I have walked many roads and seen many children set out.'), L('尖塔在很遠很遠的北方。……它等了很久了。路上小心。', 'The Spire is far, far to the north. ...It has been waiting a long time. Take care on the road.'));
      await say(FLORA(), L('……她好像知道很多事呢。', '...She seems to know a lot.'));
      await gift('potion', 2);
    } else if (k === 1) {
      await talk(EIN(), L('又見面了。你們看，鏡湖。', 'We meet again. Look: Mirror Lake.'), L('聽說很久以前，這裡的湖面夜裡也是亮的。稜晶的光。', 'They say long ago its surface shone even at night. The light of the Prism.'), L('各地掉著一些粉紅色的小碎片。如果撿到了……聽聽它們說什麼吧。', 'Little pink shards lie all over the land. If you find one... listen to what it says.'), L('一個碎掉的東西，會不會也想要變回完整呢？', 'Do you think a broken thing wants to be whole again?'));
      S.flags.shardsKnown = true;
    } else if (k === 2) {
      await talk(EIN(), L('沙泉鎮的茶很好喝。……我每次來都點同一種。', 'The tea in Dunewell is lovely. ...I order the same one every time.'));
      await say(BAL(), L('每次？你常來嗎？', 'Every time? Do you come often?'));
      await say(EIN(), L('嗯……算是吧。這口井，從來沒有乾過呢。', 'Mm... you could say that. This well has never once run dry.'));
      await say(SHIA(), L('（……她說話的樣子，好像在講很久以前的事。）', '(...The way she talks, it is as if it all happened long ago.)'));
    } else if (k === 3) {
      await talk(EIN(), L('這裡就是盧梅拉。古代的都城。', 'This is Lumera. The ancient capital.'), L('……我以前住在這裡。', '...I used to live here.'));
      await say(LOWE(), L('以前？可是這裡已經變成廢墟三百年了……', 'Used to? But this place has been ruins for three hundred years...'));
      await talk(EIN(), L('那時的國王很怕黑夜。他想讓稜晶把時間停在正午，變成永遠的白晝。', 'The king back then was afraid of the night. He wanted the Prism to stop time at noon: an endless day.'), L('遺跡的塔頂有一塊水晶，騎士還在守著它。……替我跟他說聲「辛苦了」。', 'There is a crystal at the top of the ruined tower, and the knight still guards it. ...Tell him "thank you for your service" for me.'));
      await say(null, L('艾茵沒等你們回答，就轉身走進了霧裡。', 'Ein turns away into the mist before you can answer.'));
    } else if (k === 4) {
      await say(SHIA(), L('艾茵。你……不會變老，對吧？', 'Ein. You... do not grow old, do you?'));
      await talk(EIN(), L('……被發現了啊。', '...So you noticed.'), L('對。三百年了。時間從我身邊繞過去，像河水繞過一塊石頭。', 'Yes. Three hundred years. Time flows around me, the way a river flows around a stone.'), L('等你們集齊八塊，就到尖塔下面來。我有一件事，必須在塔頂做完。', 'When you have all eight, come to the foot of the Spire. There is something I must finish at the top.'));
    } else if (k === 5) {
      await talk(EIN(), L('八塊都到齊了。……謝謝你們。', 'All eight are here. ...Thank you.'), L('我得說實話。三百年前打碎稜晶的人，是我。我是稜晶的守護者。', 'I must tell you the truth. The one who broke the Prism three hundred years ago was me. I was its keeper.'), L('我不後悔。可是我一直想跟它說聲對不起。', 'I do not regret it. But I have always wanted to tell it I am sorry.'), L('帶我上去吧。水晶認得打碎它的手，我一個人碰不了它們……可是跟你們一起，也許可以。', 'Take me up with you. The crystals know the hand that broke them; alone I cannot touch them... but with you, perhaps I can.'));
      await say(LOWE(), L('當然！一起去吧，艾茵。', 'Of course! Let us go together, Ein.'));
      S.flags.einJoin = true;
    }
    S.flags.ein = k + 1;
  },

  // ---------- things in the land ----------
  async crystal(c) {
    if (S.crystals.includes(c.job)) return;
    S.crystals.push(c.job); if (!S.jobs.includes(c.job)) S.jobs.push(c.job);
    jingle('crystal');
    await say(null, L(`水晶發出耀眼的光芒……\n學會了新的職業「${JOBS[c.job].name}」！`, `The crystal blazes with light...\nA new job: ${JOBS[c.job].name}!`));
    await say(null, `${JOBS[c.job].desc}　${L('（從選單的「職業」換上它吧）', '(Set it from Jobs in the menu.)')}`);
    if ([1, 2, 4, 6].includes(n())) await say(null, L('……遠方，好像有誰在看著你們。', '...Far away, someone seems to be watching you.'));
    if (n() === 8) await say(null, L('八塊水晶在背包裡一起嗡嗡作響。北方的尖塔，好像在呼喚你們。', 'All eight crystals hum together in your pack. The Spire in the north seems to be calling.'));
  },
  async shard(s) {
    if (S.shards.includes(s.id)) return;
    S.shards.push(s.id); sfx('warp');
    await say(L(`記憶碎片 ${s.id + 1}／24`, `Memory Shard ${s.id + 1} / 24`), L(SHARDS[s.id][0], SHARDS[s.id][1]));
    if (S.shards.length === 1) await say(null, L('粉紅色的碎片碰到手，就化成光消失了。剛才的聲音，留在了心裡。\n（從選單的「回憶」可以重看）', 'The pink shard melts into light at your touch. The voice stays in your heart.\n(Read it again under Memories in the menu.)'));
    if (S.shards.length === 24) await say(null, L('二十四塊記憶全部找回來了。……好像能聽見，遠方有人在輕輕地哭。', 'All twenty-four memories are found. ...Far away, someone seems to be crying softly.'));
  },
  async sign(s) { await say(null, L(SIGNS[s.id][0], SIGNS[s.id][1])); },
  async herb(h) { S.picked[h.id] = true; addItem(h.kind); sfx('chest'); toast(L(`摘到了${ITEMS[h.kind].name}！（${count(h.kind)}）`, `Picked a ${ITEMS[h.kind].name}! (${count(h.kind)})`)); },
  async fishing(f, night) {
    if (!S.inv.fishrod) { await say(null, L('水面上有魚在冒泡。……要是有釣竿就好了。鹽灣港的漁夫也許有。', 'Fish are rising here. ...If only you had a rod. The Saltmere fisher might.')); return false; }
    const pool = CATCH[f.kind].filter((c) => !c[3] || night), total = pool.reduce((a, c) => a + c[1], 0);
    let r = Math.random() * total, pick = pool[0]; for (const c of pool) { if ((r -= c[1]) < 0) { pick = c; break; } }
    const wide = S.members.some((m) => m.equip.acc === 'fishcharm') ? 1.4 : 1;
    const got = await fishGame(pick[2] * wide);
    if (!got) { await say(null, L('……魚跑掉了。', '...It got away.')); return false; }
    addItem(pick[0]); S.fish[pick[0]] = (S.fish[pick[0]] || 0) + 1;
    if (pick[0] === 'goldkoi' || pick[0] === 'prismfish') jingle('levelup'); else sfx('chest');
    await say(null, L(`釣到了${ITEMS[pick[0]].name}！`, `Caught a ${ITEMS[pick[0]].name}!`));
    if (pick[0] === 'prismfish' && !S.flags.prismfish) { S.flags.prismfish = true; await say(null, L('鱗片映著七彩的光……跟記憶碎片的顏色好像。', 'Its scales shine every colour... just like the memory shards.')); }
    return true;
  },
  async chest(ch) {
    sfx('chest');
    addItem(ch.item, ch.n || 1);
    await say(null, L(`找到了${ITEMS[ch.item].name}${ch.n > 1 ? '×' + ch.n : ''}！`, `Found ${ITEMS[ch.item].name}${ch.n > 1 ? ' x' + ch.n : ''}!`));
    if (ITEMS[ch.item].key) await say(null, ITEMS[ch.item].desc);
  },
  async home(h, ctx) {
    const first = !S.homes.includes(h.id);
    if (first) S.homes.push(h.id);
    fullHeal(); sfx('heal');
    const r = await ask(null, first ? L('家石亮了起來！碰過的家石之間可以互相傳送。\n大家的傷都好了。要記錄嗎？', 'The home stone lights up! You can warp between home stones you have touched.\nEveryone is healed. Save?') : L('家石溫暖地發著光。大家的傷都好了。要記錄嗎？', 'The home stone glows warmly. Everyone is healed. Save?'), [L('記錄', 'Save'), L('不用', 'No')]);
    if (r === 0) { ctx.savePos(); if (ctx.save()) toast(L('已記錄', 'Saved')); }
  },
  async gate(g) {
    if (n() >= g.need) { if (!S.flags.spireOpen) { S.flags.spireOpen = true; sfx('warp'); await say(null, L('八塊水晶一起發光，水晶之門無聲地消失了。', 'The eight crystals shine as one, and the crystal gate silently vanishes.')); } return true; }
    await say(null, L(`一道水晶之門擋住了去路。門上有八個凹槽，亮著的有 ${n()} 個。`, `A gate of crystal bars the way. It has eight sockets; ${n()} of them are lit.`));
    return false;
  },
  async bossIntro(id) {
    const lines = {
      treant: [L('古樹守衛', 'Elder Treant'), L('……小小的旅人啊。想帶走森林的水晶，就讓我看看你們的根有多深。', "...Little travellers. If you would take the forest's crystal, show me how deep your roots go.")],
      bogkeeper: [L('沼地守墓人', 'The Bog Keeper'), L('嘻嘻……霧裡的墓，是給迷路的人準備的。你們迷路了嗎？', 'Hee hee... the graves in the mist are for those who lose their way. Are you lost?')],
      sporelord: [L('菇王', 'The Sporelord'), L('呼啊……誰吵醒我的……睡吧……大家都一起……睡吧……', 'Hwaaah... who woke me... sleep... everyone... sleep together...')],
      mesaking: [L('台地之王', 'Mesa King'), L('哼，爬到這裡來了嗎。赤砂的寶物，不是給軟腳蝦的！', 'Hmph, you made it up here. The treasures of the red sands are not for weaklings!')],
      fallenknight: [L('古都亡騎', 'The Fallen Knight'), L('……陛下的命令……還沒……解除……任何人，都不准……靠近塔頂……', "...His Majesty's order... has not... been lifted... no one... may approach the tower...")],
      frostwyrm: [L('冰霜飛龍', 'Frost Wyrm'), L('……又是想要星之水晶的人。山頂的風，會先把你們凍成冰。', '...More who want the star crystal. The summit wind will freeze you solid first.')],
      emberdrake: [L('熔岩飛龍', 'The Ember Drake'), L('三百年的火，三百年的怒！碎掉的光……休想再拼起來！', 'Three hundred years of fire, three hundred years of rage! The broken light... shall never be mended!')],
      prismheart: [L('稜晶之心', 'The Prism Heart'), L('……八塊……回來了……可是，我已經一個人……太久了……', '...Eight... returned... but I have been alone... for so long...')],
    };
    const [who, line] = lines[id] || [null, null];
    if (who) await say(who, line);
  },
  async bossAfter(id) {
    if (id === 'treant') await say(L('古樹守衛', 'Elder Treant'), L('……很好。你們的根，比看起來的還深。', '...Good. Your roots run deeper than they look.'));
    if (id === 'bogkeeper') await say(L('沼地守墓人', 'The Bog Keeper'), L('……原來你們沒有迷路啊。那就走吧，往有光的地方。', '...So you were not lost after all. Then go on, toward the light.'));
    if (id === 'sporelord') await say(L('菇王', 'The Sporelord'), L('……醒了。好久……沒有這麼清醒了。謝謝……', '...Awake. It has been so long... since I felt this awake. Thank you...'));
    if (id === 'mesaking') await say(L('台地之王', 'Mesa King'), L('我、我輸了……台地的路，從此為你們敞開。', 'I... I yield... The paths of the mesa are open to you now.'));
    if (id === 'fallenknight') { await say(L('古都亡騎', 'The Fallen Knight'), L('……艾茵……要你們……說「辛苦了」……嗎。……是啊……好累……終於……可以……', '...Ein... told you to say "thank you for your service"...? ...Yes... so tired... at last... I can...')); await say(null, L('騎士的盔甲靜靜地倒下，再也沒有起來。', "The knight's armour quietly falls, and does not rise again.")); }
    if (id === 'frostwyrm') await say(L('冰霜飛龍', 'Frost Wyrm'), L('……去吧。山頂的星光，屬於能撐過寒風的人。', '...Go. The starlight of the summit belongs to those who can stand the wind.'));
    if (id === 'emberdrake') await say(L('熔岩飛龍', 'The Ember Drake'), L('……火……好像……沒那麼燙了……', '...The fire... somehow... is not so hot now...'));
  },
  async ending() {
    await talk(L('稜晶之心', 'The Prism Heart'), L('……好溫暖。八塊碎片裡，都留著你們的手的溫度。', '...So warm. Every one of the eight shards still holds the warmth of your hands.'),
      L('我碎掉的時候，以為再也不會有人來找我了。', 'When I shattered, I thought no one would ever come looking for me again.'));
    if (S.flags.einJoin) {
      await say(null, L('艾茵從你們身後走了出來。', 'Ein steps out from behind you.'));
      await talk(EIN(), L('……好久不見。我是艾茵。是我打碎了你。', '...It has been a long time. It is Ein. I am the one who broke you.'), L('對不起。讓你一個人等了三百年。', 'I am sorry. I left you alone and waiting for three hundred years.'));
      await talk(L('稜晶之心', 'The Prism Heart'), L('……艾茵。我記得你的手。', '...Ein. I remember your hands.'), L('那天你打碎我，夜晚才能來。夜晚來了，明天才能來。', 'You broke me that day, so the night could come. And because the night came, tomorrow could come.'), L('我不是在等你道歉。我是在等你……回家。', 'I was not waiting for an apology. I was waiting for you... to come home.'));
      await say(null, L('稜晶的光包住了艾茵。繞著她流了三百年的時間，輕輕地流了回去。', "The Prism's light wraps around Ein. The time that flowed around her for three hundred years gently flows back in."));
      await say(EIN(), L('……心跳的聲音。好吵。好開心。', '...The sound of my heartbeat. So loud. So happy.'));
    }
    if (S.shards.length >= 24) await say(L('稜晶之心', 'The Prism Heart'), L('二十四塊記憶，你們全部帶回來了。……現在，我想起了所有的事。包括那些很好的日子。', 'You brought back all twenty-four memories. ...Now I remember everything. Even the good days.'));
    await say(L('稜晶之心', 'The Prism Heart'), L('謝謝你們走了這麼遠的路。……我的光，就分給這片大地吧。白天和夜晚，都分一點。', 'Thank you for walking so far. ...Let my light be shared with the whole land. A little for the days, and a little for the nights.'));
    await say(LOWE(), L('……好像有點捨不得耶。', "...I kind of don't want it to end."));
    await say(FLORA(), L('漫遊之年還沒結束啊。世界上一定還有我們沒去過的地方。', "The wandering year isn't over yet. There must be places in the world we still haven't been."));
    await say(BAL(), L('先回村子吧。長老一定在等我們的故事。', "Let's go home first. The elder will be waiting for our stories."));
    if (S.flags.einJoin) await say(EIN(), L('……我也可以一起去嗎？我想從頭開始過一個「漫遊之年」。這一次，要有結束的那一天。', '...May I come too? I want to have a wandering year of my own, from the beginning. This time, one that ends.'));
    await say(SHIA(), L('……順便看看，回家的路上還有沒有沒開的寶箱。', '...And on the way, see if there are any chests we missed.'));
  },
};
export const npcName = (id) => ({ elder: L('奧森長老', 'Elder Ozen') }[id] || '');
void ask;
