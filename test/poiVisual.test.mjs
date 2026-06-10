// Tests für poiVisual.ts — die POI-Gestalt (Step 4a, ann_126) — gegen dist.
//   node --test test/poiVisual.test.mjs   (nach `npm run build`)
import test from 'node:test';
import assert from 'node:assert/strict';
import { poiVisualState, poiBreaches, POI_SIZE } from '../dist/app/poiVisual.js';
import { stageOf } from '../dist/app/scale.js';

// 6-Stufen-Skala (wie Coloursample liefert).
const SCALE = {
  stops: ['#1', '#2', '#3', '#4', '#5', '#6'],
  borders: [1 / 6, 2 / 6, 3 / 6, 4 / 6, 5 / 6],
  spreizung: { mitte: 0.5, oben: 0.5, unten: 0.5 },
  verjuengung: { unten: 0, oben: 0 },
};
const base = { comfort: 0.5, scale: SCALE };

test('poiBreaches: > comfort = true, gleich/darunter = false (die Naht)', () => {
  assert.equal(poiBreaches(0.6, 0.5), true);
  assert.equal(poiBreaches(0.5, 0.5), false);
  assert.equal(poiBreaches(0.4, 0.5), false);
});

test('normal: im Comfort, off-route → ×1.2, opak, ruhig', () => {
  const v = poiVisualState({ ...base, onRoute: false, load: 0.3 });
  assert.equal(v.kind, 'normal');
  assert.equal(v.size, POI_SIZE.normal);
  assert.equal(v.opacity, 1);
  assert.equal(v.hektik, 0);
  assert.equal(v.breaching, false);
});

test('route: im Comfort, auf Route → ×1.6, opak, ruhig', () => {
  const v = poiVisualState({ ...base, onRoute: true, load: 0.3 });
  assert.equal(v.kind, 'route');
  assert.equal(v.size, POI_SIZE.route);
  assert.equal(v.hektik, 0);
});

test('hektisch: out-of-comfort, auf Route → ×1.6, opak, zappelt', () => {
  const v = poiVisualState({ ...base, onRoute: true, load: 0.8 });
  assert.equal(v.kind, 'hektisch');
  assert.equal(v.size, POI_SIZE.route);
  assert.equal(v.opacity, 1);
  assert.equal(v.breaching, true);
  assert.ok(v.hektik > 0, 'zappelt');
});

test('degradiert: out-of-comfort, off-route → ×1.0, gedimmt, zappelt klein', () => {
  const v = poiVisualState({ ...base, onRoute: false, load: 0.8 });
  assert.equal(v.kind, 'degraded');
  assert.equal(v.size, POI_SIZE.degraded);
  assert.equal(v.opacity, 0.9);
  assert.ok(v.hektik > 0, 'zappelt');
});

test('Rolle candidate: ×1.2, 50% Wasserzeichen, ruhig — schlägt Daten-Zustand', () => {
  const v = poiVisualState({ ...base, onRoute: false, load: 0.9, role: 'candidate' });
  assert.equal(v.kind, 'candidate');
  assert.equal(v.size, POI_SIZE.normal);
  assert.equal(v.opacity, 0.5);
  assert.equal(v.hektik, 0);
});

test('Rolle intaken: ×1.6, opak, ruhig', () => {
  const v = poiVisualState({ ...base, onRoute: false, load: 0.9, role: 'intaken' });
  assert.equal(v.kind, 'intaken');
  assert.equal(v.size, POI_SIZE.route);
  assert.equal(v.opacity, 1);
  assert.equal(v.hektik, 0);
});

test('hektik steigt mit der Last, Floor ~0.3 bei gerade-breaching, ~1.0 bei Sättigung', () => {
  const justOver = poiVisualState({ ...base, onRoute: true, load: 0.51 }).hektik;
  const mid = poiVisualState({ ...base, onRoute: true, load: 0.75 }).hektik;
  const full = poiVisualState({ ...base, onRoute: true, load: 1.0 }).hektik;
  assert.ok(justOver >= 0.3 && justOver < 0.4, `Floor ~0.3 (war ${justOver})`);
  assert.ok(mid > justOver && mid < full, 'monoton');
  assert.ok(Math.abs(full - 1) < 1e-9, `Sättigung 1.0 (war ${full})`);
});

test('stage wird aus stageOf durchgereicht', () => {
  for (const load of [0.05, 0.4, 0.95]) {
    const v = poiVisualState({ ...base, onRoute: false, load });
    assert.equal(v.stage, stageOf(load, SCALE));
  }
});
