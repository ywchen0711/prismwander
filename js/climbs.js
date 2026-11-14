// Climbs: how many summits the party has reached, and the prizes for reaching many of them.
import { S, addItem } from './party.js';
import { ITEMS } from './data.js';
import { PARKOUR } from './world.js';
import { PARKOUR_REWARDS } from './data5.js';
import { L } from './i18n.js';

export const climbCount = () => PARKOUR.filter((p) => S.chests[p.id]).length;
export const climbNeed = (n) => (n === Infinity ? PARKOUR.length : n);
// hand out any climb prizes now earned; returns lines to show
export function climbMilestones() {
  S.rewards = S.rewards || {}; const out = [], have = climbCount();
  for (const [n, item, c] of PARKOUR_REWARDS) {
    const k = 'climb' + n;
    if (S.rewards[k] || have < climbNeed(n)) continue;
    S.rewards[k] = true; addItem(item, c);
    out.push(L(`登上了 ${climbNeed(n)} 個難關！獲得${ITEMS[item].name}${c > 1 ? ' ×' + c : ''}。`, `${climbNeed(n)} climbs conquered! Received ${ITEMS[item].name}${c > 1 ? ' x' + c : ''}.`));
  }
  return out;
}
export { PARKOUR, PARKOUR_REWARDS };
