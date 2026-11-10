// Language: every line is written as L('中文', 'English'); data tables get getters so .name follows the language.
function initial() {
  try { const v = localStorage.getItem('prismwander-lang'); if (v === 'zh' || v === 'en') return v; } catch (e) { /* no storage */ }
  try { return /^zh/i.test(navigator.language) ? 'zh' : 'en'; } catch (e) { return 'zh'; }
}
export let LANG = initial();
const hooks = [];
export const onLang = (f) => hooks.push(f);
export function setLang(l) {
  LANG = l;
  try { localStorage.setItem('prismwander-lang', l); } catch (e) { /* private mode */ }
  document.documentElement.lang = l === 'en' ? 'en' : 'zh-Hant';
  for (const f of hooks) f(l);
}
export const isEn = () => LANG === 'en';
export const L = (zh, en) => (LANG === 'en' ? en : zh);
// table: { id: { name: [zh, en], desc: [zh, en] } } -> getters
export function bilingual(table, fields = ['name', 'desc']) {
  for (const o of Object.values(table)) for (const f of fields) {
    const v = o[f];
    if (Array.isArray(v) && v.length === 2 && typeof v[0] === 'string') Object.defineProperty(o, f, { get: () => (LANG === 'en' ? v[1] : v[0]), enumerable: true, configurable: true });
  }
  return table;
}
