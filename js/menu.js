// The field menu (party, jobs, equipment, items, map, warp, save, settings), shops and inns.
import { JOBS, ITEMS, ABILITIES, HEROES, MONSTERS, jpFor, monsterStats, affinity, EL_NAME } from './data.js';
import { RECIPES, FORGE } from './data2.js';
import { S, stats, heroName, jlvOf, learned, setJob, canEquip, addItem, count, fullHeal, save, MASTER_ARTS, abilitiesOf, learnedPassives, supSlots, mastered } from './party.js';
import { HELP, jobHTML, jobLine, abilityHTML, abilityLine, itemHTML, itemLine, gearLine, monsterHTML, masteryLine, extraWhere, kindName as kindN } from './help.js';
import { JL_MAX } from './data3.js';
import { list, say, ask, toast, statusHTML } from './ui.js';
import { sfx, vol, setVolumes, music, setMusic } from './audio.js';
import { L, LANG, setLang } from './i18n.js';
import { REGIONS, WX, WZ, W, ground, SEA, get, B, SPAWN, OLD_W } from './world.js';
import { QUESTS, SHARDS } from './story.js';
import { ECHOES } from './story2.js';
import { qualityChoice, autoLevel, setQuality } from './quality.js';

export const MAPCOL = { [B.grass]: [96, 176, 72], [B.sand]: [232, 214, 160], [B.redsand]: [208, 112, 64], [B.redstone]: [168, 80, 56], [B.snow]: [236, 244, 252], [B.stone]: [140, 146, 160], [B.gravel]: [150, 150, 150], [B.cobble]: [120, 120, 130], [B.leaves]: [56, 130, 56], [B.orange]: [220, 130, 50], [B.brick]: [150, 150, 160], [B.crystal]: [150, 230, 255], [B.ice]: [190, 230, 250], [B.plank]: [180, 120, 80], [B.wood]: [110, 80, 50], [B.birch]: [220, 220, 200], [B.lava]: [255, 110, 30], [B.mushroom]: [210, 50, 50], [B.moss]: [96, 128, 84], [B.mud]: [128, 126, 108], [B.cactus]: [80, 150, 60],
  [B.coral]: [230, 96, 104], [B.sandstone]: [220, 200, 150], [B.skystone]: [130, 160, 230], [B.gold]: [240, 200, 70], [B.iron]: [130, 130, 140], [B.brass]: [180, 160, 90], [B.ruby]: [150, 60, 80], [B.coal]: [60, 60, 70], [B.plank2]: [190, 150, 100], [B.redwood]: [160, 70, 50], [B.frame]: [170, 180, 190], [B.hedge]: [70, 150, 70], [B.emerald]: [90, 200, 120], [B.silver]: [190, 200, 210] };
const bar = (v, max, col) => `<div class="bar"><i style="width:${Math.max(0, Math.min(100, v / max * 100))}%;background:${col}"></i></div>`;
function memberCard(m, sel = false) {
  const s = stats(m);
  return `<div class="mem${sel ? ' sel' : ''}"><div class="row"><span><span class="nm">${heroName(m)}</span> ${m.hp > 0 ? statusHTML(m.status) : ''}</span><span class="small">Lv ${m.lv}</span></div>` +
    `<div class="jb">${JOBS[m.job].name} ${jlvOf(m, m.job)}${m.sub ? ' / ' + JOBS[m.sub].name + ' ' + jlvOf(m, m.sub) : ''}</div>` +
    `<div class="row small"><span>HP ${m.hp}/${s.maxhp}</span><span>MP ${m.mp}/${s.maxmp}</span></div>${bar(m.hp, s.maxhp, '#7cf29a')}${bar(m.mp, s.maxmp, '#7cc4ff')}</div>`;
}
const partySide = () => `<div class="cols" style="flex-direction:column;gap:6px">${S.members.map((m) => memberCard(m)).join('')}</div><div class="small" style="margin-top:6px">${L('金幣', 'Gold')} ${S.gold}　${L('水晶', 'Crystals')} ${S.crystals.length}/8　${L('記憶', 'Memories')} ${S.shards.length}/24</div>`;
// front and back rows: the back row takes less physical damage but hits softer in melee (bows do not mind)
async function formationMenu() {
  let start = 0;
  for (;;) {
    const r = await list(L('隊形', 'Formation'), S.members.map((m) => ({ label: heroName(m), right: m.row === 'back' ? L('後排', 'Back row') : L('前排', 'Front row') })), { width: 320, start, footer: L('後排：受到的物理傷害少四成、比較不會被盯上，但近戰傷害也少四成（弓不受影響）。選擇切換。', 'Back row: 40% less physical damage taken and targeted less often, but melee hits 40% softer (bows are unaffected). Select to switch.') });
    if (r < 0) return;
    const m = S.members[r]; m.row = m.row === 'back' ? 'front' : 'back'; start = r;
  }
}
// the requests you have taken on, the unfinished ones first
async function questMenu() {
  const ids = Object.keys(S.quests).sort((a, b) => (S.quests[a] === 'done') - (S.quests[b] === 'done'));
  if (!ids.length) { await say(null, L('還沒有接下任何委託。去跟各地的人聊聊吧。', 'You have not taken on any requests yet. Talk to people around the land.')); return; }
  await list(L('委託', 'Requests'), ids.map((id) => { const qd = QUESTS[id], fin = S.quests[id] === 'done'; return { label: (fin ? '✔ ' : '◇ ') + qd.title, right: fin ? L('完成', 'Done') : qd.progress || '', desc: qd.desc }; }), { width: 420, footer: L('選一個看看內容。', 'Pick one to read about it.') });
}
// the memory shards you have found, in the order they were written
async function memoryMenu() {
  if (S.echoes.length) {
    const k = await list(L('回憶', 'Memories'), [{ label: L('稜晶的記憶碎片', 'Shards of the Prism'), right: `${S.shards.length}/24`, disabled: !S.shards.length }, { label: L('蒼藍的迴響', 'Blue Echoes'), right: `${S.echoes.length}/24` }], { width: 320 });
    if (k < 0) return;
    if (k === 1) return echoMenu();
  }
  const ids = [...S.shards].sort((a, b) => a - b);
  for (;;) {
    const r = await list(L(`回憶　${ids.length}／24`, `Memories  ${ids.length} / 24`), ids.map((i) => ({ label: L(`記憶碎片 ${i + 1}`, `Memory Shard ${i + 1}`), desc: L(SHARDS[i][0], SHARDS[i][1]).slice(0, 26) + '…' })), { width: 360 });
    if (r < 0) return;
    await say(L(`記憶碎片 ${ids[r] + 1}`, `Memory Shard ${ids[r] + 1}`), L(SHARDS[ids[r]][0], SHARDS[ids[r]][1]));
  }
}

async function echoMenu() {
  const ids = [...S.echoes].sort((a, b) => a - b);
  for (;;) {
    const r = await list(L(`蒼藍的迴響　${ids.length}／24`, `Blue Echoes  ${ids.length} / 24`), ids.map((i) => ({ label: L(`迴響 ${i + 1}`, `Echo ${i + 1}`), desc: L(ECHOES[i][0], ECHOES[i][1]).slice(0, 26) + '…' })), { width: 360 });
    if (r < 0) return;
    await say(L(`迴響 ${ids[r] + 1}`, `Echo ${ids[r] + 1}`), L(ECHOES[ids[r]][0], ECHOES[ids[r]][1]));
  }
}
// the bestiary: every monster you have met, and what you have learned of it
const REG_OF = {};
for (const [r, list] of Object.entries(SPAWN)) for (const id of list) (REG_OF[id] = REG_OF[id] || []).push(r);
const BOSS_AT = { treant: 'forest', bogkeeper: 'mistfen', sporelord: 'sporewood', mesaking: 'mesa', fallenknight: 'ruins', frostwyrm: 'mountain', emberdrake: 'ember', prismheart: 'spire', kraken: 'coral', tempest: 'cloud', morwen: 'vael', colossus: 'clocktower', varek: 'clocktower', tyrant: 'deep', aurel: 'noonhall', echodrake: 'abyss', echowyrm: 'abyss', echoknight: 'abyss', umbra: 'abyss', champion: 'saltmere', krakenarm: 'coral' };
export async function bestiaryMenu() {
  const ids = Object.keys(MONSTERS).sort((a, b) => MONSTERS[a].lv - MONSTERS[b].lv || (MONSTERS[a].boss ? 1 : 0) - (MONSTERS[b].boss ? 1 : 0));
  const seen = ids.filter((id) => S.seen[id]).length;
  const regN = (r) => (REGIONS[r] ? REGIONS[r].name[LANG === 'en' ? 1 : 0] : '');
  const where = (id) => [...new Set([...(REG_OF[id] || []), BOSS_AT[id], extraWhere(id)].filter(Boolean))].map(regN).filter(Boolean).slice(0, 3).join(L('、', ', '));
  await list(L(`魔物圖鑑　${seen}／${ids.length}`, `Bestiary  ${seen} / ${ids.length}`), ids.map((id, i) => {
    const m = MONSTERS[id], met = !!S.seen[id];
    if (!met) return { label: `${String(i + 1).padStart(3, '0')} ？？？`, right: '', desc: L('還沒遇過的魔物。', 'A monster you have not met yet.') };
    return { label: `${String(i + 1).padStart(3, '0')} ${m.name}${m.rare ? ' ✦' : m.field ? ' ♛' : ''}`, right: S.defeated[id] ? `×${S.defeated[id]}` : '', desc: `Lv ${m.lv}${where(id) ? L('　出沒：', '  Found: ') + where(id) : ''}` };
  }), { width: 380, dwidth: 400, footer: L('右邊是打倒的次數。✦ 稀有魔物　♛ 野外守護者', 'Times defeated on the right. ✦ rare  ♛ field guardian'), detail: (i) => monsterHTML(ids[i], where(ids[i])) });
}
// cooking: turn fish, herbs and what monsters drop into dishes
export async function cookMenu() {
  for (;;) {
    const r = await list(L('料理', 'Cooking'), RECIPES.map(([out, need]) => { const ok = need.every(([id, n]) => count(id) >= n); return { label: ITEMS[out].name, right: S.cooked[out] ? `×${S.cooked[out]}` : '', disabled: !ok, desc: need.map(([id, n]) => `${ITEMS[id].name} ${count(id)}/${n}`).join('　') }; }), { width: 340, footer: L('材料夠了就能做。做好的菜可以在戰鬥中吃，或從道具選單當作餐點吃。', 'Cook when you have the ingredients. Eat dishes in battle, or as a meal from the Items menu.'), detail: (i) => needHTML(RECIPES[i][1]) + itemHTML(RECIPES[i][0], { price: false }) });
    if (r < 0) return;
    const [out, need] = RECIPES[r];
    for (const [id, n] of need) addItem(id, -n);
    addItem(out); S.cooked[out] = (S.cooked[out] || 0) + 1; sfx('heal'); toast(L(`做好了${ITEMS[out].name}！`, `${ITEMS[out].name} is ready!`));
  }
}
// what a recipe needs against what is in the bag
const needHTML = (need, fee) => `<div class="kv">${need.map(([id, n]) => `<span class="${count(id) >= n ? 'up' : 'dn'}">${ITEMS[id].name} ${count(id)}/${n}</span>`).join('')}${fee ? `<span class="${S.gold >= fee ? 'up' : 'dn'}">${L('費用', 'Fee')} ${fee}G</span>` : ''}</div>`;
// a smith turns ore and monster parts into gear
export async function forgeMenu(name) {
  for (;;) {
    const r = await list(name || L('鍛造', 'Forge'), FORGE.map(([out, need, fee]) => { const ok = need.every(([id, n]) => count(id) >= n) && S.gold >= fee; return { label: ITEMS[out].name, right: fee, disabled: !ok, desc: need.map(([id, n]) => `${ITEMS[id].name} ${count(id)}/${n}`).join('　') }; }), { width: 340, footer: `${L('金幣', 'Gold')} ${S.gold}`, detail: (i) => needHTML(FORGE[i][1], FORGE[i][2]) + itemHTML(FORGE[i][0], { who: S.members, price: false }) });
    if (r < 0) return;
    const [out, need, fee] = FORGE[r];
    for (const [id, n] of need) addItem(id, -n);
    S.gold -= fee; addItem(out); sfx('chest'); toast(L(`打好了${ITEMS[out].name}！`, `Forged ${ITEMS[out].name}!`));
  }
}

export async function fieldMenu(ctx) {
  for (;;) {
    const opts = [
      ['jobs', L('職業', 'Jobs')], ['abil', L('技能', 'Abilities')], ['equip', L('裝備', 'Equipment')], ['items', L('道具', 'Items')], ['status', L('能力', 'Status')],
      ['form', L('隊形', 'Formation')], ['quest', L('委託', 'Requests')], ['mem', L('回憶', 'Memories'), !S.shards.length && !S.echoes.length],
      ['map', L('地圖', 'Map')], ['warp', L('傳送', 'Warp'), S.homes.length < 2], ['save', L('記錄', 'Save')], ['set', L('設定', 'Settings')],
      ['book', L('魔物圖鑑', 'Bestiary')], ['cook', L('料理', 'Cooking'), !S.inv.recipebook], ['help', L('說明', 'Help')],
    ];
    const r = await list(L('選單', 'Menu'), opts.map(([, label, off]) => ({ label, disabled: !!off })), { side: partySide(), width: 200 });
    if (r < 0) return;
    const id = opts[r][0];
    if (id === 'jobs') await jobsMenu();
    if (id === 'abil') await abilitiesMenu();
    if (id === 'equip') await equipMenu();
    if (id === 'items') await itemsMenu(ctx);
    if (id === 'status') await statusMenu();
    if (id === 'form') await formationMenu();
    if (id === 'quest') await questMenu();
    if (id === 'mem') await memoryMenu();
    if (id === 'map') await mapMenu(ctx);
    if (id === 'warp') { const ok = await warpMenu(ctx); if (ok) return; }
    if (id === 'save') { ctx.savePos(); if (save()) { sfx('ok'); toast(L('已記錄', 'Saved')); } }
    if (id === 'set') await settings(ctx);
    if (id === 'book') await bestiaryMenu();
    if (id === 'cook') await cookMenu();
    if (id === 'help') await helpMenu();
  }
}
// the help pages: how things work, a guide to every job, a glossary
export async function helpMenu() {
  for (;;) {
    const topics = [{ t: [L('職業圖鑑', 'Job guide')], guide: true }, ...HELP];
    const r = await list(L('說明', 'Help'), topics.map((h) => ({ label: h.guide ? h.t[0] : L(h.t[0], h.t[1]), right: h.guide ? '▶' : '' })), { width: 280, dwidth: 460, footer: L('選一個主題。', 'Pick a topic.'),
      detail: (i) => (topics[i].guide ? `<h3>${L('職業圖鑑', 'Job guide')}</h3><p>${L('全部 24 個職業：能力值、武器、會學到的技能和精通獎勵。還沒找到的職業只會告訴你在哪一帶。', 'All 24 jobs: stats, weapons, what each teaches and its mastery bonus. For jobs you have not found, only a hint of where to look.')}</p>` : `<h3>${L(topics[i].t[0], topics[i].t[1])}</h3>${topics[i].b()}`) });
    if (r < 0) return;
    if (topics[r].guide) await jobGuide();
  }
}
async function jobGuide() {
  const ids = Object.keys(JOBS), m = S.members[0];
  await list(L('職業圖鑑', 'Job guide'), ids.map((j) => ({ label: S.jobs.includes(j) ? JOBS[j].name : '？？？', right: S.jobs.includes(j) ? '' : L('未發現', 'not found'), desc: jobLine(j, m) })), { width: 300, dwidth: 460, detail: (i) => jobHTML(ids[i], null) });
}
const pickMember = (title) => list(title, S.members.map((m) => ({ label: heroName(m), right: `${JOBS[m.job].name}${m.sub ? ' / ' + JOBS[m.sub].name : ''}` })), { width: 320 });
async function jobsMenu() {
  for (;;) {
    const i = await pickMember(L('誰要換職業？', 'Whose jobs?'));
    if (i < 0) return;
    const m = S.members[i];
    let k0 = 0;
    for (;;) {
      const slots = supSlots(m);
      const k = await list(`${heroName(m)}`, [{ label: L('主職業', 'Main job'), right: JOBS[m.job].name }, { label: L('副職業', 'Sub job'), right: m.sub ? JOBS[m.sub].name : L('無', 'None') }, { label: L('支援能力', 'Support abilities'), right: `${(m.sup || []).length}/${slots}` }],
        { width: 300, start: k0, footer: L('主職業決定能力值和裝備；副職業借用它學會的技能和武器。支援欄放任何職業學會的被動技能。', 'The main job sets stats and gear; the sub job lends its learned abilities and weapons. Support slots hold passives learned in any job.'),
          detail: (r) => (r === 0 ? jobHTML(m.job, m) : r === 1 ? (m.sub ? jobHTML(m.sub, m) : `<h3>${L('副職業', 'Sub job')}</h3><p>${L('還沒設定。副職業學會的技能都能用，JP 拿一半。', 'Not set. You can use everything the sub job has learned, and it earns half the JP.')}</p>`) : supportHTML(m)) });
      if (k < 0) break;
      k0 = k;
      if (k === 2) { await supportMenu(m); continue; }
      const opts = (k === 1 ? [null] : []).concat(S.jobs);
      const items = opts.map((j) => j === null ? { label: L('（不設定）', '(none)') } : {
        label: JOBS[j].name + (mastered(m, j) ? ' ★' : ''), right: `Lv ${jlvOf(m, j)}`, disabled: k === 1 && j === m.job, desc: jobLine(j, m),
      });
      const c = await list(k === 0 ? L('主職業', 'Main job') : L('副職業', 'Sub job'), items, { width: 300, dwidth: 460, start: Math.max(0, opts.indexOf(k === 0 ? m.job : m.sub)), detail: (r) => (opts[r] === null ? `<p>${L('不設定副職業。', 'No sub job.')}</p>` : jobHTML(opts[r], m)) });
      if (c < 0) continue;
      if (k === 1 && opts[c] === null) { m.sub = null; sfx('ok'); continue; }
      setJob(m, opts[c], k === 1); sfx('ok');
    }
  }
}
// which job taught a passive (for the support list)
const teacher = (m, a) => Object.keys(m.jlv || {}).filter((j) => JOBS[j] && learned(j, jlvOf(m, j)).includes(a)).map((j) => JOBS[j].name).join(L('、', ', '));
function supportHTML(m) {
  const sup = m.sup || [], n = supSlots(m);
  return `<h3>${L('支援能力', 'Support abilities')}</h3><p class="small">${L(`支援欄 ${n} 格（20 級與 40 級各多一格）。主職業或副職業學會的被動技能本來就有效，不用放進來。`, `${n} slots (one more at level 20 and at 40). Passives your main or sub job has learned already work and need no slot.`)}</p>`
    + (sup.length ? sup.map((a) => `<div class="la"><span class="an">${ABILITIES[a].name}</span><span class="small ad">${ABILITIES[a].note || ''}</span></div>`).join('') : `<p class="small off">${L('（還沒放任何能力）', '(nothing set yet)')}</p>`);
}
async function supportMenu(m) {
  let start = 0;
  for (;;) {
    m.sup = m.sup || [];
    const n = supSlots(m), rows = Array.from({ length: n }, (_, i) => m.sup[i] || null);
    const k = await list(L(`${heroName(m)}的支援能力`, `${heroName(m)}: support`), rows.map((a, i) => ({ label: a ? ABILITIES[a].name : L('（空）', '(empty)'), right: `${i + 1}`, desc: a ? ABILITIES[a].note : L('選擇要放進這一格的被動技能。', 'Choose a passive for this slot.') })),
      { width: 320, start, detail: (i) => (rows[i] ? abilityHTML(rows[i], teacher(m, rows[i])) : supportHTML(m)) });
    if (k < 0) return;
    start = k;
    const own = new Set(abilitiesOf(m)), all = learnedPassives(m);
    if (!all.length) { toast(L('還沒學會任何被動技能。', 'No passives learned yet.')); continue; }
    const opts = [null, ...all];
    const c = await list(L('放哪一個？', 'Which one?'), opts.map((a) => (a === null ? { label: L('（清空）', '(clear)') } : { label: ABILITIES[a].name, right: m.sup.includes(a) ? L('已裝', 'Set') : own.has(a) ? L('職業中', 'From job') : '', desc: ABILITIES[a].note })),
      { width: 340, detail: (i) => (opts[i] ? abilityHTML(opts[i], teacher(m, opts[i])) + (own.has(opts[i]) ? `<p class="small">${L('主職業或副職業已經讓它生效了。', 'Your main or sub job already makes it work.')}</p>` : '') : `<p>${L('把這一格清空。', 'Empty this slot.')}</p>`) });
    if (c < 0) continue;
    const a = opts[c], cur = Array.from({ length: n }, (_, i) => m.sup[i] || null);
    if (a !== null) { const at = cur.indexOf(a); if (at >= 0) cur[at] = null; }
    cur[k] = a;
    m.sup = cur.filter(Boolean); sfx('ok');
  }
}
// every ability a hero can use now, with what it does
async function abilitiesMenu() {
  const i = await pickMember(L('看誰的技能？', 'Whose abilities?'));
  if (i < 0) return;
  const m = S.members[i];
  const src = (a) => [m.job, m.sub].filter((j) => j && learned(j, jlvOf(m, j)).includes(a)).map((j) => JOBS[j].name).concat(Object.values(MASTER_ARTS).includes(a) ? [L('奧義', 'Master art')] : []).concat((m.sup || []).includes(a) ? [L('支援欄', 'Support slot')] : []).join(L('、', ', '));
  const own = abilitiesOf(m), act = own.filter((a) => !ABILITIES[a].passive), pas = [...new Set([...own.filter((a) => ABILITIES[a].passive), ...(m.sup || [])])], ids = [...act, ...pas];
  if (!ids.length) { toast(L('還沒有技能。', 'No abilities yet.')); return; }
  await list(L(`${heroName(m)}的技能`, `${heroName(m)}'s abilities`), ids.map((a) => { const A = ABILITIES[a]; return { label: A.name, right: A.passive ? L('被動', 'Passive') : A.hpcost ? `HP${Math.round(A.hpcost * 100)}%` : `MP ${A.mp}`, desc: abilityLine(A, false) }; }),
    { width: 340, dwidth: 380, footer: L('戰鬥中從「技能」使用。', 'Use them in battle under Abilities.'), detail: (k) => abilityHTML(ids[k], src(ids[k])) });
}
async function equipMenu() {
  for (;;) {
    const i = await pickMember(L('誰的裝備？', 'Whose equipment?'));
    if (i < 0) return;
    const m = S.members[i];
    for (;;) {
      const slots = ['weapon', 'armor', 'acc'], names = { weapon: L('武器', 'Weapon'), armor: L('防具', 'Armour'), acc: L('飾品', 'Accessory') };
      const s = stats(m);
      const k = await list(heroName(m), slots.map((sl) => ({ label: names[sl], right: m.equip[sl] ? ITEMS[m.equip[sl]].name : '-', desc: m.equip[sl] ? gearLine(m.equip[sl]) : '' })), { width: 320, footer: `${L('攻擊', 'ATK')} ${s.atk}　${L('防禦', 'DEF')} ${s.dfn}　${L('魔力', 'MAG')} ${s.mag}　${L('速度', 'AGI')} ${s.agi}`,
        detail: (r) => (m.equip[slots[r]] ? itemHTML(m.equip[slots[r]], { price: false }) : `<h3>${names[slots[r]]}</h3><p class="small off">${L('（沒有裝備）', '(nothing equipped)')}</p>`) + `<div class="sub">${L('目前能力', 'Now')}</div><div class="kv"><span>${L('攻擊', 'ATK')} ${s.atk}</span><span>${L('防禦', 'DEF')} ${s.dfn}</span><span>${L('魔力', 'MAG')} ${s.mag}</span><span>${L('精神', 'SPR')} ${s.spr}</span><span>${L('速度', 'AGI')} ${s.agi}</span></div>` });
      if (k < 0) break;
      const slot = slots[k];
      const options = Object.keys(S.inv).filter((id) => ITEMS[id].slot === slot && canEquip(m, id));
      const items = [{ label: L('（卸下）', '(remove)') }, ...options.map((id) => ({ label: ITEMS[id].name, right: S.inv[id], desc: gearLine(id) }))];
      const cur = m.equip[slot];
      const c = await list(names[slot], items, { width: 320, footer: slot === 'weapon' ? L(`可用：${[...new Set([...JOBS[m.job].wep, ...(m.sub ? JOBS[m.sub].wep : [])])].map(kindName).join('、')}`, `Can hold: ${[...new Set([...JOBS[m.job].wep, ...(m.sub ? JOBS[m.sub].wep : [])])].map(kindName).join(', ')}`) : '',
        detail: (r) => (r === 0 ? (cur ? `<h3>${L('卸下', 'Remove')}</h3>${removeHTML(m, slot)}` : `<p class="small off">${L('（沒有裝備）', '(nothing equipped)')}</p>`) : itemHTML(options[r - 1], { who: [m] })) });
      if (c < 0) continue;
      if (m.equip[slot]) addItem(m.equip[slot]);
      m.equip[slot] = null;
      if (c > 0) { addItem(options[c - 1], -1); m.equip[slot] = options[c - 1]; }
      sfx('ok');
    }
  }
}
// what taking a piece off would change
function removeHTML(m, slot) {
  const now = stats(m), then = stats({ ...m, equip: { ...m.equip, [slot]: null } });
  return `<div class="cmp">${[['atk', L('攻擊', 'ATK')], ['dfn', L('防禦', 'DEF')], ['mag', L('魔力', 'MAG')], ['spr', L('精神', 'SPR')], ['agi', L('速度', 'AGI')]].filter(([k2]) => now[k2] !== then[k2]).map(([k2, n]) => `<span class="cv"><span class="small">${n}</span> ${now[k2]}→<b class="dn">${then[k2]}</b></span>`).join('') || `<span class="small">${L('能力值不變', 'no stat change')}</span>`}</div>`;
}
const kindName = (k) => ({ sword: L('劍', 'swords'), staff: L('杖', 'staves'), dagger: L('短劍', 'daggers'), hammer: L('鎚', 'hammers'), bow: L('弓', 'bows'), fist: L('拳套', 'fists'), spear: L('槍', 'spears'), gun: L('火槍', 'guns') }[k]);
const EL = (e) => ({ fire: L('火', 'fire'), ice: L('冰', 'ice'), bolt: L('雷', 'bolt'), water: L('水', 'water'), holy: L('聖', 'holy'), earth: L('土', 'earth'), wind: L('風', 'wind'), dark: L('闇', 'dark') }[e] || e);
const ST = (s) => ({ poison: L('中毒', 'poison'), sleep: L('睡眠', 'sleep'), stun: L('暈眩', 'stun'), slow: L('減速', 'slow'), blind: L('失明', 'blind'), silence: L('沉默', 'silence'), burn: L('灼傷', 'burns'), freeze: L('凍結', 'freezing'), doom: L('死亡宣告', 'doom') }[s] || s);
const describeGear = (id) => gearLine(id);
async function itemsMenu(ctx) {
  for (;;) {
    const ids = Object.keys(S.inv);
    const r = await list(L('道具', 'Items'), ids.map((id) => ({ label: ITEMS[id].name, right: S.inv[id], disabled: !ITEMS[id].use, desc: itemLine(id) })), { width: 320, dwidth: 400, detail: (i) => (ids[i] ? itemHTML(ids[i], { who: ITEMS[ids[i]].slot ? S.members : [] }) : '') });
    if (r < 0) return;
    const id = ids[r], it = ITEMS[id];
    if (it.use === 'tent') { if (ctx.inTown()) { toast(L('村子裡用不著帳篷。', 'No need for a tent in town.')); continue; } addItem(id, -1); await ctx.rest(); continue; }
    if (['scan', 'bomb', 'escape', 'buff'].includes(it.use)) { toast(L('只能在戰鬥中使用。', 'Only in battle.')); continue; }
    // a dish can be eaten now as a meal: its effect lasts several battles
    if (it.food && it.meal) {
      const c = await ask(null, L(`要怎麼吃${it.name}？`, `How will you have the ${it.name}?`), [L('當作餐點（效果持續五場戰鬥）', 'As a meal (lasts five battles)'), L('現在吃，回復', 'Eat now to recover'), L('不吃', 'Not now')]);
      if (c === 0) { addItem(id, -1); S.meal = { id, n: S.members.some((m) => (m.job === 'chef' || m.sub === 'chef')) ? 8 : 5 }; sfx('heal'); toast(L(`吃了${it.name}。（${S.meal.n} 場戰鬥）`, `You ate the ${it.name}. (${S.meal.n} battles)`)); continue; }
      if (c !== 1) continue;
    }
    if (it.target === 'allies') { addItem(id, -1); sfx('heal'); for (const m of S.members) { if (m.hp <= 0) continue; const st = stats(m); if (it.use === 'heal') m.hp = Math.min(st.maxhp, m.hp + it.power); if (it.use === 'elixir') { m.hp = st.maxhp; m.mp = st.maxmp; } } toast(L('大家都恢復了。', 'Everyone feels better.')); continue; }
    const pool = S.members.filter((m) => (it.use === 'revive' ? m.hp <= 0 : m.hp > 0));
    const k = await list(it.name, pool.map((m) => ({ label: heroName(m), right: `HP ${m.hp}/${stats(m).maxhp}` })), { width: 300 });
    if (k < 0) continue;
    const m = pool[k], s = stats(m); addItem(id, -1); sfx('ok');
    if (it.use === 'heal') m.hp = Math.min(s.maxhp, m.hp + it.power);
    if (it.use === 'mp') m.mp = Math.min(s.maxmp, m.mp + it.power);
    if (it.use === 'cure') for (const st of it.cures || ['poison', 'blind']) delete m.status[st];
    if (it.use === 'cureall') { m.status = {}; if (it.heal) m.hp = Math.min(s.maxhp, m.hp + it.heal); }
    if (it.use === 'elixir') { m.hp = s.maxhp; m.mp = s.maxmp; }
    if (it.use === 'revive') m.hp = Math.round(s.maxhp * (it.power >= 999 ? 1 : 0.4));
  }
}
async function statusMenu() {
  const i = await pickMember(L('看誰？', 'Who?'));
  if (i < 0) return;
  const m = S.members[i], s = stats(m);
  const all = `<span class="small" style="display:flex;flex-wrap:wrap;gap:0 12px">${S.jobs.map((j) => `<span style="white-space:nowrap">${JOBS[j].name} ${jlvOf(m, j)}${mastered(m, j) ? '★' : ''}</span>`).join('')}<span style="white-space:nowrap">${L(`（職業等級最高 ${JL_MAX}）`, `(job levels up to ${JL_MAX})`)}</span></span>`;
  await list(`${heroName(m)}　Lv ${m.lv}`, [
    { label: `HP ${m.hp}/${s.maxhp}　MP ${m.mp}/${s.maxmp}` }, ...(m.hp > 0 && statusHTML(m.status) ? [{ html: L('狀態：', 'Status: ') + statusHTML(m.status) }] : []), { label: `${L('攻擊', 'ATK')} ${s.atk}　${L('防禦', 'DEF')} ${s.dfn}` },
    { label: `${L('魔力', 'MAG')} ${s.mag}　${L('精神', 'SPR')} ${s.spr}　${L('速度', 'AGI')} ${s.agi}` },
    { label: `${L('經驗值', 'EXP')} ${m.exp}` },
    { label: L('奧義：', 'Master arts: ') + (Object.keys(S.mastery).filter((j) => S.mastery[j] && MASTER_ARTS[j]).map((j) => ABILITIES[MASTER_ARTS[j]].name).join('、') || '-') },
    { label: L('餐點：', 'Meal: ') + (S.meal ? `${ITEMS[S.meal.id].name}（${S.meal.n}）` : '-') },
    { label: L('支援：', 'Support: ') + ((m.sup || []).map((a) => ABILITIES[a].name).join(L('、', ', ')) || '-') },
    { label: L('精通：', 'Mastered: ') + (Object.keys(m.jlv).filter((j) => mastered(m, j)).map((j) => JOBS[j].name).join(L('、', ', ')) || '-') },
    { label: L('精通獎勵：', 'Mastery bonus: ') + masteryLine(m) }, { html: all },
  ], { width: 460 });
}
// the map: the whole continent from above, with what you have found
async function mapMenu(ctx) {
  // before the eastern sea is open, the map shows only the old continent
  const mapW = S.flags.cleared ? WX : OLD_W;
  const c = document.createElement('canvas'); c.width = mapW; c.height = WZ;
  const g = c.getContext('2d'), img = g.createImageData(mapW, WZ);
  const COL = MAPCOL;
  for (let z = 0; z < WZ; z++) for (let x = 0; x < mapW; x++) {
    const y = ground(x, z) - 1, id = get(x, y, z), i = (z * mapW + x) * 4;
    let col = y < SEA ? [60, 120, 220] : COL[id] || [110, 160, 90];
    const shade = 0.7 + Math.min(1, y / 50) * 0.5; col = col.map((v) => Math.min(255, v * shade));
    img.data.set([...col, 255], i);
  }
  g.putImageData(img, 0, 0);
  g.fillStyle = '#7ab8ff'; for (const h of W.homes) if (S.homes.includes(h.id)) g.fillRect(h.pos[0] - 6, h.pos[2] - 6, 12, 12);
  g.fillStyle = '#ff4060'; const p = ctx.playerPos(); g.beginPath(); g.arc(p[0], p[2], 10, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#ffe27a'; for (const cr of W.crystals) if ((cr.east ? S.crystals2 : S.crystals).includes(cr.job)) { g.fillRect(cr.pos[0] - 6, cr.pos[2] - 6, 12, 12); }
  // treasure maps: a red X where each one points
  g.strokeStyle = '#ff2030'; g.lineWidth = 5; for (const d of W.digs) if (S.inv['tmap' + d.map] && !S.dug[d.id]) { const [x, , z] = d.pos; g.beginPath(); g.moveTo(x - 9, z - 9); g.lineTo(x + 9, z + 9); g.moveTo(x + 9, z - 9); g.lineTo(x - 9, z + 9); g.stroke(); }
  if (S.boat && S.inv.boat) { g.fillStyle = '#ffffff'; g.fillRect(S.boat.x - 5, S.boat.z - 5, 10, 10); }
  const labels = Object.values(REGIONS).filter((r) => !r.cave && (!r.east || S.flags.cleared) && r.r < 500).map((r) => `<div class="small" style="position:absolute;left:${r.c[0] / mapW * 100}%;top:${r.c[1] / WZ * 100}%;transform:translate(-50%,-50%);text-shadow:0 1px 0 #000;white-space:nowrap">${r.name[LANG === 'en' ? 1 : 0]}</div>`).join('');
  await list(L('地圖', 'Map'), [], { side: `<div style="position:relative;width:min(${Math.round(70 * mapW / WZ)}vh,80vw);aspect-ratio:${mapW}/${WZ}"><img src="${c.toDataURL()}" style="width:100%;height:100%;image-rendering:pixelated;border-radius:6px">${labels}</div>`, width: 180, footer: L('紅點是你，藍點是到過的家石，金點是找到的水晶，紅叉是藏寶圖的位置，白點是船。', 'Red is you, blue are home stones you have touched, gold are crystals you have found, a red X is where a treasure map points, white is your ship.') });
}
async function warpMenu(ctx) {
  const homes = W.homes.filter((h) => S.homes.includes(h.id));
  const r = await list(L('傳送到哪裡？', 'Warp where?'), homes.map((h) => ({ label: homeName(h.id) })), { width: 300 });
  if (r < 0) return false;
  await ctx.warp(homes[r].pos);
  return true;
}
export const homeName = (id) => ({ h_hearth: L('爐心村', 'Hearthvale'), h_fen: L('芬邊村', 'Fenside'), h_forest: L('低語林', 'Whisperwood'), h_salt: L('鹽灣港', 'Saltmere'), h_dune: L('沙泉鎮', 'Dunewell'), h_frost: L('霜門村', 'Frostgate'), h_spore: L('孢子林', 'Sporewood'), h_ruins: L('古都遺跡', 'Old Lumera'), h_peak: L('灰脊山腰', 'Greyridge Slopes'), h_rime: L('霜原', 'Rimefield'), h_ember: L('熔岩峰山腳', 'Foot of Emberpeak'), h_spire: L('尖塔之下', 'Below the Spire'), h_meadow: L('晨風原', 'Dawnbreeze Fields'), h_lake: L('鏡湖南岸', 'Mirror Lake shore'), h_coast: L('白貝海岸', 'Shellshore'), h_mesa: L('台地南麓', 'Below the Mesa'), h_mist: L('霧沼', 'Mistfen'), h_wood: L('低語林深處', 'Deep Whisperwood'), h_mtn: L('灰脊山麓', 'Greyridge foothills'),
  h_tide: L('潮汐港', 'Tidehaven'), h_cog: L('齒輪村', 'Cogwick'), h_gale: L('疾風島', 'Gale Isle'), h_sky: L('天空之巢', 'Skyhaven'), h_vael: L('薇爾的珊瑚環', 'The Ring of Vael'), h_tower: L('機關塔門口', 'Clockwork Tower gate'), h_deepm: L('深岩島海灘', 'Deepholm beach'), h_delve: L('掘地人之窟', "Delvers' Hollow"), h_abyss: L('稜晶深淵', 'The Prism Abyss'), h_noon: L('正午宮殿', 'The Noon Halls') }[id] || id);
const QNAME = { auto: () => L('自動', 'Auto'), high: () => L('高', 'High'), medium: () => L('中', 'Medium'), low: () => L('低（最流暢）', 'Low (smoothest)') };
async function settings(ctx) {
  for (;;) {
    const r = await list(L('設定', 'Settings'), [
      { label: L('語言', 'Language'), right: LANG === 'en' ? 'English' : '中文' },
      { label: L('音樂', 'Music'), right: music.on ? L('開', 'On') : L('關', 'Off') },
      { label: L('音樂音量', 'Music volume'), right: Math.round(vol.music * 10) }, { label: L('音效音量', 'Sound volume'), right: Math.round(vol.sfx * 10) },
      { label: L('畫質', 'Graphics'), right: QNAME[qualityChoice]() + (qualityChoice === 'auto' ? `（${QNAME[autoLevel]()}）` : ''), desc: L('手機和平板若會卡頓，請選「低」。變更後會自動記錄並重新載入。', 'If a phone or tablet stutters, choose Low. Changing it saves and reloads the game.') },
    ], { width: 320 });
    if (r < 0) return;
    if (r === 0) setLang(LANG === 'en' ? 'zh' : 'en');
    if (r === 1) setMusic(!music.on);
    // volume steps 0.2 to 1.0 and round again
    if (r === 2) { vol.music = Math.round(vol.music * 10) >= 10 ? 0.2 : Math.min(1, Math.round(vol.music * 10 + 2) / 10); setVolumes(); }
    if (r === 4) {
      const order = ['auto', 'high', 'medium', 'low'], k = await list(L('畫質', 'Graphics'), order.map((o) => ({ label: QNAME[o]() + (o === 'auto' ? `（${QNAME[autoLevel]()}）` : ''), right: o === qualityChoice ? '✔' : '' })), { width: 300, start: order.indexOf(qualityChoice), footer: L('會先幫你記錄，再重新載入。', 'The game is saved first, then reloads.') });
      if (k >= 0 && order[k] !== qualityChoice) { if (ctx && S.members.length) { ctx.savePos(); save(); } setQuality(order[k]); return; }
      continue;
    }
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
        const k = await list(L(`買什麼？　金幣 ${S.gold}`, `Buy what?  Gold ${S.gold}`), stock.map((id) => ({ label: ITEMS[id].name, right: ITEMS[id].price, disabled: ITEMS[id].price > S.gold, desc: itemLine(id) + `　${L('持有', 'Have')} ${count(id)}` })), { width: 320, dwidth: 400, footer: `${L('金幣', 'Gold')} ${S.gold}`, detail: (i) => itemHTML(stock[i], { who: ITEMS[stock[i]].slot ? S.members : [] }) });
        if (k < 0) break;
        S.gold -= ITEMS[stock[k]].price; addItem(stock[k]); sfx('chest');
      }
    } else {
      for (;;) {
        const ids = Object.keys(S.inv).filter((id) => !ITEMS[id].key && ITEMS[id].price);
        const k = await list(L('賣什麼？', 'Sell what?'), ids.map((id) => ({ label: ITEMS[id].name, right: `${Math.floor(ITEMS[id].price / 2)} ×${S.inv[id]}`, desc: itemLine(id) })), { width: 320, dwidth: 380, footer: `${L('金幣', 'Gold')} ${S.gold}`, detail: (i) => (ids[i] ? itemHTML(ids[i]) : '') });
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
void HEROES; void fullHeal; void kindN; void describeGear; void monsterStats; void affinity; void EL_NAME;
