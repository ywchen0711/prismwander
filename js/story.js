// Every conversation in 晶境漫遊 Prismwander. The land is 稜光大陸 Prismara; long ago the Prism that crowned
// the Spire shattered, and each shard became a crystal holding the craft of a hero of old. In Hearthvale,
// young people set out on a "wandering year"; this year it is Lowe, Flora, Bal and Shia.
import { S, addItem, fullHeal } from './party.js';
import { JOBS, ITEMS, SHOPS } from './data.js';
import { L } from './i18n.js';
import { say, talk, ask, toast } from './ui.js';
import { shop, inn } from './menu.js';
import { jingle, sfx } from './audio.js';

const n = () => S.crystals.length;
export const SCRIPTS = {
  async intro() {
    await say(null, L('稜光大陸。很久很久以前，尖塔頂端的「稜晶」碎成了八塊，散落在大地的每個角落。', 'Prismara. Long, long ago, the Prism atop the Spire shattered into eight pieces and scattered across the land.'));
    await say(null, L('每一塊碎片，都封著古代英雄的一門技藝。', 'Each shard holds the craft of a hero of old.'));
    await say(null, L('爐心村的孩子滿十六歲，就要踏上「漫遊之年」，自己去看看這個世界。', "When Hearthvale's children turn sixteen, they set out on their wandering year to see the world for themselves."));
    await say(null, L('今年出發的，是洛、芙蘿、巴爾和希雅。', 'This year it is Lowe, Flora, Bal and Shia who go.'));
    await talk(L('奧森長老', 'Elder Ozen'), L('四個都到齊了嗎？很好。村子能教你們的，就只有劍、魔法、祈禱和……偷東西的手藝。', 'All four of you? Good. The village can teach you only the sword, magic, prayer and... light fingers.'),
      L('剩下的，要靠你們自己去找。看到發光的水晶，就去碰碰它吧。', 'The rest you must find yourselves. When you see a crystal glowing, go and touch it.'),
      L('聽說集齊八塊的人，能打開稜晶尖塔的大門。……我年輕時只找到三塊呢，哈哈。', 'They say whoever gathers all eight can open the gate of the Prism Spire. ...I only ever found three, ha ha.'));
    await say(null, L('【WASD／方向鍵】移動　【空白鍵】跳躍　【滑鼠拖曳／Q、R】轉動視角\n【E／Z】調查、對話　【Esc】選單', '[WASD / arrows] move   [Space] jump   [drag the mouse / Q, R] turn the camera\n[E / Z] look, talk   [Esc] menu'));
    S.flags.intro = true;
  },
  async hv_elder() {
    if (n() >= 8) { await say(L('奧森長老', 'Elder Ozen'), L('八塊都找齊了！……去吧，尖塔就在北邊的高原上。我會在村子裡等你們回來。', 'All eight! ...Go. The Spire stands on the northern plateau. I will be waiting for you here.')); return; }
    if (n() >= 2 && !S.flags.compass) {
      await talk(L('奧森長老', 'Elder Ozen'), L('已經找到兩塊了？真了不起。這個給你們。', 'Two already? Splendid. Take this.'), L('是我年輕時用的晶石羅盤，會指向最近的水晶喔。', 'The crystal compass I carried when I was young. It points to the nearest crystal.'));
      addItem('compass'); S.flags.compass = true; sfx('chest'); toast(L('得到了晶石羅盤！', 'Got the Crystal Compass!')); return;
    }
    await say(L('奧森長老', 'Elder Ozen'), [L('西邊的低語林、東邊的海岸、中央的鏡湖……先去近一點的地方看看吧。', 'Whisperwood to the west, the coast to the east, Mirror Lake in the middle... start somewhere close.'), L('高的地方上不去？說不定別的路就繞得上去。看看四周吧。', "Can't get up somewhere high? There may be another way round. Look about you."), L('東北的赤砂台地很陡。沙泉鎮的人應該知道怎麼上去。', "The Redsand Mesa in the north-east is steep. The people of Dunewell will know how to climb it.")][Math.min(2, Math.floor(n() / 2))]);
  },
  async hv_shop(e) { await say(L('雜貨店老闆', 'Shopkeeper'), L('出遠門要帶夠回復藥喔！', 'Take plenty of potions on a long trip!')); await shop(SHOPS[e.shop]); },
  async hv_inn(e, ctx) { await inn(ctx, L('旅館老闆', 'Innkeeper')); },
  async hv_kid() { await say(L('村裡的小孩', 'Village Kid'), L('我也想快點長大去漫遊！聽說鏡湖中間的小島上，有一塊水晶閃閃發亮喔。', "I want to grow up and wander too! They say a crystal sparkles on the little island in the middle of Mirror Lake.")); },
  async hv_farmer() { await say(L('農夫', 'Farmer'), L('跳不上去的時候，找找看有沒有可以先踩的石頭。我年輕時就是這樣爬上海邊那根石柱的。', "When you can't jump high enough, look for a stone to step on first. That's how I got up the sea stack when I was young.")); },
  async hv_sage() {
    await talk(L('村裡的學者', 'Village Scholar'), L('每個人都可以有一個主職業和一個副職業。', 'Everyone can have one main job and one sub job.'),
      L('主職業決定能力值、能拿的武器；副職業只借它學會的技能來用。', 'The main job sets your stats and what weapons you can hold; the sub job only lends the abilities it has learned.'),
      L('戰鬥得到的 JP 會讓職業升級。副職業也拿得到一半喔。', 'JP from battle levels up your jobs. The sub job gets half as well.'));
  },
  async dw_shop(e) { await say(L('沙泉鎮的商人', 'Dunewell Trader'), L('沙漠裡什麼都貴，但我的貨最好。', 'Everything costs more in the desert, but my goods are the best.')); await shop(SHOPS[e.shop]); },
  async dw_inn(e, ctx) { await inn(ctx, L('沙泉鎮的旅館', 'Dunewell Inn')); },
  async dw_digger() { await say(L('挖寶人', 'Treasure Digger'), S.inv.boots ? L('穿上彈跳靴，台地的那些高牆就不算什麼了吧？', "With those spring boots on, the mesa's high walls are nothing now, eh?") : L('台地北邊的岩縫裡，我看過一個箱子。可是要先爬上兩層台地才拿得到……', 'I saw a chest in a crack on the north of the mesa. But you have to climb two terraces to reach it...')); },
  async dw_nomad() { await say(L('遊牧民', 'Nomad'), L('台地上有兩塊水晶。一塊在東邊，一塊在西北邊的最高處。', 'There are two crystals on the mesa: one to the east, one on the highest point to the north-west.')); },
  async fg_shop(e) { await say(L('霜門村的商人', 'Frostgate Trader'), L('山上冷，多帶點高級回復藥吧。', 'It is cold up the mountain. Take extra Hi-Potions.')); await shop(SHOPS[e.shop]); },
  async fg_inn(e, ctx) { await inn(ctx, L('霜門村的旅館', 'Frostgate Inn')); },
  async fg_climber() { await say(L('登山家', 'Climber'), S.inv.cape ? L('有了滑翔斗篷，從山頂跳下來也不怕了吧。', 'With a glide cape you can jump off the summit without a care.') : L('灰脊山頂有一塊水晶，可是住著一條冰霜飛龍。……山北邊的箱子裡，好像有一件能在空中滑翔的斗篷。', 'There is a crystal on the summit of Greyridge, and a frost wyrm lives there. ...A chest on the north of the mountain is said to hold a cape you can glide with.')); },

  // touching a crystal
  async crystal(c) {
    if (S.crystals.includes(c.job)) return;
    S.crystals.push(c.job); if (!S.jobs.includes(c.job)) S.jobs.push(c.job);
    jingle('crystal');
    await say(null, L(`水晶發出耀眼的光芒……\n學會了新的職業「${JOBS[c.job].name}」！`, `The crystal blazes with light...\nA new job: ${JOBS[c.job].name}!`));
    await say(null, `${JOBS[c.job].desc}　${L('（從選單的「職業」換上它吧）', '(Set it from Jobs in the menu.)')}`);
    if (n() === 8) await say(null, L('八塊水晶在背包裡一起嗡嗡作響。北方的尖塔，好像在呼喚你們。', 'All eight crystals hum together in your pack. The Spire in the north seems to be calling.'));
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
      treant: [L('古樹守衛', 'Elder Treant'), L('……小小的旅人啊。想帶走森林的水晶，就讓我看看你們的根有多深。', '...Little travellers. If you would take the forest\'s crystal, show me how deep your roots go.')],
      mesaking: [L('台地之王', 'Mesa King'), L('哼，爬到這裡來了嗎。赤砂的寶物，不是給軟腳蝦的！', 'Hmph, you made it up here. The treasures of the red sands are not for weaklings!')],
      frostwyrm: [L('冰霜飛龍', 'Frost Wyrm'), L('……又是想要星之水晶的人。山頂的風，會先把你們凍成冰。', '...More who want the star crystal. The summit wind will freeze you solid first.')],
      prismheart: [L('稜晶之心', 'The Prism Heart'), L('……八塊……回來了……可是，我已經一個人……太久了……', '...Eight... returned... but I have been alone... for so long...')],
    };
    const [who, line] = lines[id] || [null, null];
    if (who) await say(who, line);
  },
  async bossAfter(id) {
    if (id === 'treant') await say(L('古樹守衛', 'Elder Treant'), L('……很好。你們的根，比看起來的還深。', '...Good. Your roots run deeper than they look.'));
    if (id === 'mesaking') await say(L('台地之王', 'Mesa King'), L('我、我輸了……台地的路，從此為你們敞開。', 'I... I yield... The paths of the mesa are open to you now.'));
    if (id === 'frostwyrm') await say(L('冰霜飛龍', 'Frost Wyrm'), L('……去吧。山頂的星光，屬於能撐過寒風的人。', '...Go. The starlight of the summit belongs to those who can stand the wind.'));
  },
  async ending() {
    await talk(L('稜晶之心', 'The Prism Heart'), L('……好溫暖。八塊碎片裡，都留著你們的手的溫度。', '...So warm. Every one of the eight shards still holds the warmth of your hands.'),
      L('我碎掉的時候，以為再也不會有人來找我了。', 'When I shattered, I thought no one would ever come looking for me again.'),
      L('謝謝你們走了這麼遠的路。……我的光，就分給這片大地吧。', 'Thank you for walking so far. ...Let my light be shared with the whole land.'));
    await say(L('洛', 'Lowe'), L('……好像有點捨不得耶。', '...I kind of don\'t want it to end.'));
    await say(L('芙蘿', 'Flora'), L('漫遊之年還沒結束啊。世界上一定還有我們沒去過的地方。', "The wandering year isn't over yet. There must be places in the world we still haven't been."));
    await say(L('巴爾', 'Bal'), L('先回村子吧。長老一定在等我們的故事。', "Let's go home first. The elder will be waiting for our stories."));
    await say(L('希雅', 'Shia'), L('……順便看看，回家的路上還有沒有沒開的寶箱。', '...And on the way, see if there are any chests we missed.'));
  },
};
export const npcName = (id) => ({ elder: L('奧森長老', 'Elder Ozen') }[id] || '');
