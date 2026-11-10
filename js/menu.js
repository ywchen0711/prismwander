// The field menu (party, jobs, equipment, items, map, warp, save, settings), shops and inns.
import { JOBS, ITEMS, ABILITIES, HEROES, jpFor } from './data.js';
import { S, stats, heroName, jlvOf, learned, setJob, canEquip, addItem, count, fullHeal, save } from './party.js';
import { list, say, ask, toast } from './ui.js';
import { sfx, vol, setVolumes, music, setMusic } from './audio.js';
import { L, LANG, setLang } from './i18n.js';
import { REGIONS, WX, WZ, W, ground, SEA, get, B } from './world.js';
import { QUESTS, SHARDS } from './story.js';

export const MAPCOL = { [B.grass]: [96, 176, 72], [B.sand]: [232, 214, 160], [B.redsand]: [208, 112, 64], [B.redstone]: [168, 80, 56], [B.snow]: [236, 244, 252], [B.stone]: [140, 146, 160], [B.gravel]: [150, 150, 150], [B.cobble]: [120, 120, 130], [B.leaves]: [56, 130, 56], [B.orange]: [220, 130, 50], [B.brick]: [150, 150, 160], [B.crystal]: [150, 230, 255], [B.ice]: [190, 230, 250], [B.plank]: [180, 120, 80], [B.wood]: [110, 80, 50], [B.birch]: [220, 220, 200], [B.lava]: [255, 110, 30], [B.mushroom]: [210, 50, 50], [B.moss]: [96, 128, 84], [B.mud]: [128, 126, 108], [B.cactus]: [80, 150, 60] };
const bar = (v, max, col) => `<div class="bar"><i style="width:${Math.max(0, Math.min(100, v / max * 100))}%;background:${col}"></i></div>`;
function memberCard(m, sel = false) {
  const s = stats(m);
  return `<div class="mem${sel ? ' sel' : ''}"><div class="row"><span class="nm">${heroName(m)}</span><span class="small">Lv ${m.lv}</span></div>` +
    `<div class="jb">${JOBS[m.job].name} ${jlvOf(m, m.job)}${m.sub ? ' / ' + JOBS[m.sub].name + ' ' + jlvOf(m, m.sub) : ''}</div>` +
    `<div class="row small"><span>HP ${m.hp}/${s.maxhp}</span><span>MP ${m.mp}/${s.maxmp}</span></div>${bar(m.hp, s.maxhp, '#7cf29a')}${bar(m.mp, s.maxmp, '#7cc4ff')}</div>`;
}
const partySide = () => `<div class="cols" style="flex-direction:column;gap:6px">${S.members.map((m) => memberCard(m)).join('')}</div><div class="small" style="margin-top:6px">${L('金幣', 'Gold')} ${S.gold}　${L('水晶', 'Crystals')} ${S.crystals.length}/8　${L('記憶', 'Memories')} ${S.shards.length}/24</div>`;
// the requests you have taken on, the unfinished ones first
async function questMenu() {
  const ids = Object.keys(S.quests).sort((a, b) => (S.quests[a] === 'done') - (S.quests[b] === 'done'));
  if (!ids.length) { await say(null, L('還沒有接下任何委託。去跟各地的人聊聊吧。', 'You have not taken on any requests yet. Talk to people around the land.')); return; }
  await list(L('委託', 'Requests'), ids.map((id) => { const qd = QUESTS[id], fin = S.quests[id] === 'done'; return { label: (fin ? '✔ ' : '◇ ') + qd.title, right: fin ? L('完成', 'Done') : qd.progress || '', desc: qd.desc }; }), { width: 420, footer: L('選一個看看內容。', 'Pick one to read about it.') });
}
// the memory shards you have found, in the order they were written
async function memoryMenu() {
  const ids = [...S.shards].sort((a, b) => a - b);
  for (;;) {
    const r = await list(L(`回憶　${ids.length}／24`, `Memories  ${ids.length} / 24`), ids.map((i) => ({ label: L(`記憶碎片 ${i + 1}`, `Memory Shard ${i + 1}`), desc: L(SHARDS[i][0], SHARDS[i][1]).slice(0, 26) + '…' })), { width: 360 });
    if (r < 0) return;
    await say(L(`記憶碎片 ${ids[r] + 1}`, `Memory Shard ${ids[r] + 1}`), L(SHARDS[ids[r]][0], SHARDS[ids[r]][1]));
  }
}

export async function fieldMenu(ctx) {
  for (;;) {
    const r = await list(L('選單', 'Menu'), [
      { label: L('職業', 'Jobs') }, { label: L('裝備', 'Equipment') }, { label: L('道具', 'Items') }, { label: L('能力', 'Status') },
      { label: L('委託', 'Requests') }, { label: L('回憶', 'Memories'), disabled: !S.shards.length },
      { label: L('地圖', 'Map') }, { label: L('傳送', 'Warp'), disabled: S.homes.length < 2 }, { label: L('記錄', 'Save') }, { label: L('設定', 'Settings') },
    ], { side: partySide(), width: 200 });
    if (r < 0) return;
    if (r === 0) await jobsMenu();
    if (r === 1) await equipMenu();
    if (r === 2) await itemsMenu(ctx);
    if (r === 3) await statusMenu();
    if (r === 4) await questMenu();
    if (r === 5) await memoryMenu();
    if (r === 6) await mapMenu(ctx);
    if (r === 7) { const ok = await warpMenu(ctx); if (ok) return; }
    if (r === 8) { ctx.savePos(); if (save()) { sfx('ok'); toast(L('已記錄', 'Saved')); } }
    if (r === 9) await settings();
  }
}
const pickMember = (title) => list(title, S.members.map((m) => ({ label: heroName(m), right: `${JOBS[m.job].name}${m.sub ? ' / ' + JOBS[m.sub].name : ''}` })), { width: 320 });
async function jobsMenu() {
  for (;;) {
    const i = await pickMember(L('誰要換職業？', 'Whose jobs?'));
    if (i < 0) return;
    const m = S.members[i];
    for (;;) {
      const k = await list(`${heroName(m)}`, [{ label: L('主職業', 'Main job'), right: JOBS[m.job].name }, { label: L('副職業', 'Sub job'), right: m.sub ? JOBS[m.sub].name : L('無', 'None') }], { width: 300, footer: L('主職業決定能力值和裝備；副職業只借用它學會的技能。', 'The main job sets stats and gear; the sub job lends only the abilities it has learned.') });
      if (k < 0) break;
      const opts = (k === 1 ? [null] : []).concat(S.jobs);
      const items = opts.map((j) => j === null ? { label: L('（不設定）', '(none)') } : {
        label: JOBS[j].name, right: `Lv ${jlvOf(m, j)}`, disabled: k === 1 && j === m.job,
        desc: `${JOBS[j].desc}　${L('已學會', 'Learned')}: ${learned(j, jlvOf(m, j)).map((a) => ABILITIES[a].name).join('、') || '-'}　(JP ${m.jp[j] || 0}/${jpFor(jlvOf(m, j) + 1)})`,
      });
      const c = await list(k === 0 ? L('主職業', 'Main job') : L('副職業', 'Sub job'), items, { width: 360 });
      if (c < 0) continue;
      if (k === 1 && opts[c] === null) { m.sub = null; sfx('ok'); continue; }
      setJob(m, opts[c], k === 1); sfx('ok');
    }
  }
}
async function equipMenu() {
  for (;;) {
    const i = await pickMember(L('誰的裝備？', 'Whose equipment?'));
    if (i < 0) return;
    const m = S.members[i];
    for (;;) {
      const slots = ['weapon', 'armor', 'acc'], names = { weapon: L('武器', 'Weapon'), armor: L('防具', 'Armour'), acc: L('飾品', 'Accessory') };
      const s = stats(m);
      const k = await list(heroName(m), slots.map((sl) => ({ label: names[sl], right: m.equip[sl] ? ITEMS[m.equip[sl]].name : '-' })), { width: 320, footer: `${L('攻擊', 'ATK')} ${s.atk}　${L('防禦', 'DEF')} ${s.dfn}　${L('魔力', 'MAG')} ${s.mag}　${L('速度', 'AGI')} ${s.agi}` });
      if (k < 0) break;
      const slot = slots[k];
      const options = Object.keys(S.inv).filter((id) => ITEMS[id].slot === slot && canEquip(m, id));
      const items = [{ label: L('（卸下）', '(remove)') }, ...options.map((id) => ({ label: ITEMS[id].name, right: S.inv[id], desc: describeGear(id) }))];
      const c = await list(names[slot], items, { width: 320, footer: slot === 'weapon' ? L(`可用：${[...new Set([...JOBS[m.job].wep, ...(m.sub ? JOBS[m.sub].wep : [])])].map(kindName).join('、')}`, `Can hold: ${[...new Set([...JOBS[m.job].wep, ...(m.sub ? JOBS[m.sub].wep : [])])].map(kindName).join(', ')}`) : '' });
      if (c < 0) continue;
      if (m.equip[slot]) addItem(m.equip[slot]);
      m.equip[slot] = null;
      if (c > 0) { addItem(options[c - 1], -1); m.equip[slot] = options[c - 1]; }
      sfx('ok');
    }
  }
}
const kindName = (k) => ({ sword: L('劍', 'swords'), staff: L('杖', 'staves'), dagger: L('短劍', 'daggers'), hammer: L('鎚', 'hammers'), bow: L('弓', 'bows'), fist: L('拳套', 'fists') }[k]);
function describeGear(id) { const it = ITEMS[id]; return [it.atk ? `${L('攻', 'ATK')}+${it.atk}` : '', it.def ? `${L('防', 'DEF')}+${it.def}` : '', it.mag ? `${L('魔', 'MAG')}+${it.mag}` : '', it.str ? `${L('力', 'STR')}+${it.str}` : '', it.agi ? `${L('速', 'AGI')}+${it.agi}` : '', it.spr ? `${L('精', 'SPR')}+${it.spr}` : ''].filter(Boolean).join(' '); }
async function itemsMenu(ctx) {
  for (;;) {
    const ids = Object.keys(S.inv);
    const r = await list(L('道具', 'Items'), ids.map((id) => ({ label: ITEMS[id].name, right: S.inv[id], disabled: !ITEMS[id].use, desc: ITEMS[id].desc || describeGear(id) })), { width: 340 });
    if (r < 0) return;
    const id = ids[r], it = ITEMS[id];
    if (it.use === 'tent') { if (ctx.inTown()) { toast(L('村子裡用不著帳篷。', 'No need for a tent in town.')); continue; } addItem(id, -1); await ctx.rest(); continue; }
    const pool = S.members.filter((m) => (it.use === 'revive' ? m.hp <= 0 : m.hp > 0));
    const k = await list(it.name, pool.map((m) => ({ label: heroName(m), right: `HP ${m.hp}/${stats(m).maxhp}` })), { width: 300 });
    if (k < 0) continue;
    const m = pool[k], s = stats(m); addItem(id, -1); sfx('ok');
    if (it.use === 'heal') m.hp = Math.min(s.maxhp, m.hp + it.power);
    if (it.use === 'mp') m.mp = Math.min(s.maxmp, m.mp + it.power);
    if (it.use === 'cure') delete m.status.poison;
    if (it.use === 'revive') m.hp = Math.round(s.maxhp * 0.4);
  }
}
async function statusMenu() {
  const i = await pickMember(L('看誰？', 'Who?'));
  if (i < 0) return;
  const m = S.members[i], s = stats(m);
  const all = S.jobs.map((j) => `${JOBS[j].name} ${jlvOf(m, j)}`).join('　');
  await list(`${heroName(m)}　Lv ${m.lv}`, [
    { label: `HP ${m.hp}/${s.maxhp}　MP ${m.mp}/${s.maxmp}` }, { label: `${L('攻擊', 'ATK')} ${s.atk}　${L('防禦', 'DEF')} ${s.dfn}` },
    { label: `${L('魔力', 'MAG')} ${s.mag}　${L('精神', 'SPR')} ${s.spr}　${L('速度', 'AGI')} ${s.agi}` },
    { label: `${L('經驗值', 'EXP')} ${m.exp}` },
  ], { width: 380, footer: all });
}
// the map: the whole continent from above, with what you have found
async function mapMenu(ctx) {
  const c = document.createElement('canvas'); c.width = WX; c.height = WZ;
  const g = c.getContext('2d'), img = g.createImageData(WX, WZ);
  const COL = MAPCOL;
  for (let z = 0; z < WZ; z++) for (let x = 0; x < WX; x++) {
    const y = ground(x, z) - 1, id = get(x, y, z), i = (z * WX + x) * 4;
    let col = y < SEA ? [60, 120, 220] : COL[id] || [110, 160, 90];
    const shade = 0.7 + Math.min(1, y / 50) * 0.5; col = col.map((v) => Math.min(255, v * shade));
    img.data.set([...col, 255], i);
  }
  g.putImageData(img, 0, 0);
  g.fillStyle = '#7ab8ff'; for (const h of W.homes) if (S.homes.includes(h.id)) g.fillRect(h.pos[0] - 3, h.pos[2] - 3, 6, 6);
  g.fillStyle = '#ff4060'; const p = ctx.playerPos(); g.beginPath(); g.arc(p[0], p[2], 5, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#ffe27a'; for (const cr of W.crystals) if (S.crystals.includes(cr.job)) { g.fillRect(cr.pos[0] - 3, cr.pos[2] - 3, 6, 6); }
  const labels = Object.values(REGIONS).filter((r) => !r.town || true).map((r) => `<div class="small" style="position:absolute;left:${r.c[0] / WX * 100}%;top:${r.c[1] / WZ * 100}%;transform:translate(-50%,-50%);text-shadow:0 1px 0 #000;white-space:nowrap">${r.name[LANG === 'en' ? 1 : 0]}</div>`).join('');
  await list(L('地圖', 'Map'), [], { side: `<div style="position:relative;width:min(70vh,80vw);aspect-ratio:1"><img src="${c.toDataURL()}" style="width:100%;height:100%;image-rendering:pixelated;border-radius:6px">${labels}</div>`, width: 180, footer: L('紅點是你，藍點是到過的家石，金點是找到的水晶。', 'Red is you, blue are home stones you have touched, gold are crystals you have found.') });
}
async function warpMenu(ctx) {
  const homes = W.homes.filter((h) => S.homes.includes(h.id));
  const r = await list(L('傳送到哪裡？', 'Warp where?'), homes.map((h) => ({ label: homeName(h.id) })), { width: 300 });
  if (r < 0) return false;
  await ctx.warp(homes[r].pos);
  return true;
}
export const homeName = (id) => ({ h_hearth: L('爐心村', 'Hearthvale'), h_fen: L('芬邊村', 'Fenside'), h_forest: L('低語林', 'Whisperwood'), h_salt: L('鹽灣港', 'Saltmere'), h_dune: L('沙泉鎮', 'Dunewell'), h_frost: L('霜門村', 'Frostgate'), h_spore: L('孢子林', 'Sporewood'), h_ruins: L('古都遺跡', 'Old Lumera'), h_peak: L('灰脊山腰', 'Greyridge Slopes'), h_rime: L('霜原', 'Rimefield'), h_ember: L('熔岩峰山腳', 'Foot of Emberpeak'), h_spire: L('尖塔之下', 'Below the Spire') }[id] || id);
async function settings() {
  for (;;) {
    const r = await list(L('設定', 'Settings'), [
      { label: L('語言', 'Language'), right: LANG === 'en' ? 'English' : '中文' },
      { label: L('音樂', 'Music'), right: music.on ? L('開', 'On') : L('關', 'Off') },
      { label: L('音樂音量', 'Music volume'), right: Math.round(vol.music * 10) }, { label: L('音效音量', 'Sound volume'), right: Math.round(vol.sfx * 10) },
    ], { width: 300 });
    if (r < 0) return;
    if (r === 0) setLang(LANG === 'en' ? 'zh' : 'en');
    if (r === 1) setMusic(!music.on);
    // volume steps 0.2 to 1.0 and round again
    if (r === 2) { vol.music = Math.round(vol.music * 10) >= 10 ? 0.2 : Math.min(1, Math.round(vol.music * 10 + 2) / 10); setVolumes(); }
    if (r === 3) vol.sfx = Math.round(vol.sfx * 10) >= 10 ? 0 : Math.min(1, Math.round(vol.sfx * 10 + 2) / 10);
    try { localStorage.setItem('prismwander-vol', JSON.stringify(vol)); } catch (e) { /* ignore */ }
  }
}
export function loadSettings() { try { Object.assign(vol, JSON.parse(localStorage.getItem('prismwander-vol')) || {}); } catch (e) { /* ignore */ } }

// ---------- shops and inns ----------
export async function shop(stock) {
  for (;;) {
    const r = await list(L('商店', 'Shop'), [{ label: L('買東西', 'Buy') }, { label: L('賣東西', 'Sell') }], { width: 260, footer: `${L('金幣', 'Gold')} ${S.gold}` });
    if (r < 0) return;
    if (r === 0) {
      for (;;) {
        const k = await list(L('買什麼？', 'Buy what?'), stock.map((id) => ({ label: ITEMS[id].name, right: ITEMS[id].price, disabled: ITEMS[id].price > S.gold, desc: (ITEMS[id].desc || describeGear(id)) + `　${L('持有', 'Have')} ${count(id)}` + (ITEMS[id].slot === 'weapon' ? '　' + kindName(ITEMS[id].kind) : '') })), { width: 360, footer: `${L('金幣', 'Gold')} ${S.gold}` });
        if (k < 0) break;
        S.gold -= ITEMS[stock[k]].price; addItem(stock[k]); sfx('chest');
      }
    } else {
      for (;;) {
        const ids = Object.keys(S.inv).filter((id) => !ITEMS[id].key && ITEMS[id].price);
        const k = await list(L('賣什麼？', 'Sell what?'), ids.map((id) => ({ label: ITEMS[id].name, right: `${Math.floor(ITEMS[id].price / 2)} ×${S.inv[id]}` })), { width: 340, footer: `${L('金幣', 'Gold')} ${S.gold}` });
        if (k < 0) break;
        S.gold += Math.floor(ITEMS[ids[k]].price / 2); addItem(ids[k], -1); sfx('ok');
      }
    }
  }
}
export async function inn(ctx, name) {
  const price = 10 + Math.round(S.members.reduce((a, m) => a + m.lv, 0) * 1.5);
  const r = await ask(name, L(`住一晚 ${price} 金幣，要休息嗎？`, `A night's rest is ${price} gold. Stay?`), [L('住宿', 'Stay'), L('不用了', 'No thanks')]);
  if (r !== 0) return;
  if (S.gold < price) { await say(name, L('……錢好像不太夠呢。', '...You seem a little short.')); return; }
  S.gold -= price; await ctx.rest();
}
void HEROES; void fullHeal;
