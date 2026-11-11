// Graphics quality. Phones start on Low and tablets (iPad included) on Medium so they stay smooth;
// computers start on High. The choice can be changed in Settings and takes effect after a reload.
const KEY = 'prismwander-quality';
const ua = navigator.userAgent || '';
const touch = (navigator.maxTouchPoints || 0) > 1;
export const isPhone = /iPhone|iPod|Android.+Mobile|Windows Phone/i.test(ua);
// iPadOS says it is a Mac; a Mac with a touch screen is an iPad
export const isTablet = !isPhone && (/iPad|Android|Tablet/i.test(ua) || (touch && /Mac/i.test(navigator.platform || ua)));
let choice = 'auto';
try { choice = localStorage.getItem(KEY) || 'auto'; } catch (e) { /* private mode */ }
export const autoLevel = isPhone ? 'low' : isTablet ? 'medium' : 'high';
export const level = choice === 'auto' ? autoLevel : choice;
export const qualityChoice = choice;
const PRESETS = {
  // pr: pixel ratio cap, shadow: shadow map size (0 = none), view: how far the land is drawn, lights: point lights,
  // budget: ms per frame for building land, mini: draw the minimap every n frames, clouds, decor: how far trees show
  high:   { pr: 1.5, shadow: 2048, view: 150, lights: true, budget: 6, mini: 1, clouds: 150, decor: 1 },
  medium: { pr: 1.0, shadow: 0, view: 105, lights: false, budget: 3, mini: 2, clouds: 70, decor: 0.85 },
  low:    { pr: 1.0, shadow: 0, view: 78, lights: false, budget: 2, mini: 3, clouds: 30, decor: 0.75 },
};
export const Q = PRESETS[level] || PRESETS.high;
export function setQuality(c) { try { localStorage.setItem(KEY, c); } catch (e) { /* private mode */ } location.reload(); }
