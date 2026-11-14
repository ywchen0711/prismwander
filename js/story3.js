// 晶境漫遊 Prismwander: the Saltmere hunt board. Take a bounty, fell the monster, come back for the reward.
import { S, addItem } from './party.js';
import { MONSTERS, ITEMS } from './data.js';
import { HUNTS } from './data4.js';
import { L } from './i18n.js';
import { say, list, toast } from './ui.js';
import { jingle, sfx } from './audio.js';
import { monsterHTML } from './help.js';

const WHO = () => L('獵人公會的盧克', 'Rook of the Hunters');
// a bounty is on once taken; it is done when the monster has been felled since then
const state = (h) => { const s = S.hunts && S.hunts[h[0]]; if (!s) return 'new'; if (s === 'paid') return 'paid'; return (S.defeated[h[0]] || 0) > s.base ? 'ready' : 'on'; };
const open = (h) => !h[4] || S.flags.umbra;
export const SCRIPTS3 = {
  async sm_hunt() {
    S.hunts = S.hunts || {};
    if (!S.flags.huntIntro) { S.flags.huntIntro = true; await say(WHO(), L('這是獵人公會的懸賞板。稀有的魔物、野外的守護者……打倒了就回來找我領賞。', "This is the Hunters' bounty board. Rare monsters, guardians out in the wild... fell one and come back to me for the reward.")); }
    for (;;) {
      const hs = HUNTS.filter(open);
      const tag = { new: L('未接', 'Open'), on: L('進行中', 'Hunting'), ready: L('可領賞', 'Claim!'), paid: L('完成', 'Done') };
      const r = await list(L('懸賞板', 'Hunt Board'), hs.map((h) => ({ label: (state(h) === 'paid' ? '✔ ' : state(h) === 'ready' ? '★ ' : '◇ ') + (S.seen[h[0]] ? MONSTERS[h[0]].name : '？？？'), right: tag[state(h)], desc: L(`賞金 ${h[1]} 金幣＋${ITEMS[h[2]].name}${h[3] > 1 ? '×' + h[3] : ''}`, `Reward: ${h[1]} gold + ${ITEMS[h[2]].name}${h[3] > 1 ? ' x' + h[3] : ''}`) })),
        { width: 340, dwidth: 400, footer: L('選一張懸賞單。', 'Pick a bounty.'),
          detail: (i) => { const h = hs[i]; return `<div class="sub">${L('懸賞', 'Bounty')}</div><div class="kv"><span>${h[1]} G</span><span>${ITEMS[h[2]].name}${h[3] > 1 ? ' ×' + h[3] : ''}</span><span>${tag[state(h)]}</span></div><p class="small">${L('接下懸賞後，再打倒一次目標就能領賞。', 'Once taken, fell the target once more to claim the reward.')}</p>` + monsterHTML(h[0], ''); } });
      if (r < 0) return;
      const h = hs[r], st = state(h), name = S.seen[h[0]] ? MONSTERS[h[0]].name : L('一隻還沒見過的魔物', 'a monster you have not met');
      if (st === 'new') { S.hunts[h[0]] = { base: S.defeated[h[0]] || 0 }; sfx('ok'); toast(L(`接下了懸賞：${name}`, `Bounty taken: ${name}`)); }
      else if (st === 'ready') { S.hunts[h[0]] = 'paid'; S.gold += h[1]; addItem(h[2], h[3]); jingle('levelup'); await say(WHO(), L(`幹得好！這是賞金 ${h[1]} 金幣，還有${ITEMS[h[2]].name}。`, `Well done! Here is your ${h[1]} gold, and the ${ITEMS[h[2]].name}.`)); }
      else if (st === 'on') await say(WHO(), L(`${name}還在外面。打倒了再回來吧。`, `${name} is still out there. Come back once it falls.`));
      else await say(WHO(), L('這張已經完成了。謝啦。', 'That one is done. Thanks.'));
    }
  },
};
