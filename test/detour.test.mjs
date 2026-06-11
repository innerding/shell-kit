// Tests für detour.ts — detourPicks (Path-Detour-Generator, ann_138) — gegen dist.
//   node --test test/detour.test.mjs   (nach `npm run build`)
import test from 'node:test';
import assert from 'node:assert/strict';
import { detourPicks } from '../dist/app/detour.js';

// Diamant-Netz: A→B über TOP (gerade, kurz) ODER BOTTOM (Süd-Bogen, länger).
const A = [48.0, 14.0], B = [48.0, 14.002];
const Mtop = [48.0, 14.001], Mbot = [47.999, 14.001];
const net = {
  stretches: [
    { id: 'top1', points: [A, Mtop] },
    { id: 'top2', points: [Mtop, B] },
    { id: 'bot1', points: [A, Mbot] },
    { id: 'bot2', points: [Mbot, B] },
  ],
};
const waypoints = [A, B];
const SCALE6 = {
  stops: ['#1', '#2', '#3', '#4', '#5', '#6'],
  borders: [1 / 6, 2 / 6, 3 / 6, 4 / 6, 5 / 6],
  spreizung: { mitte: 0.5, oben: 0.5, unten: 0.5 },
  verjuengung: { unten: 0, oben: 0 },
};

test('belebter TOP + ruhiger BOTTOM → ein komfortabler Umweg über BOTTOM', () => {
  const avg = new Map([['top1', 0.9], ['top2', 0.9], ['bot1', 0.2], ['bot2', 0.2]]);
  const picks = detourPicks(net, waypoints, avg, SCALE6, 0.5);
  assert.ok(picks.length >= 1, 'mindestens ein Umweg');
  const d = picks[0];
  assert.ok(d.stretchIds.includes('bot1') && d.stretchIds.includes('bot2'), 'läuft über BOTTOM');
  assert.ok(!d.stretchIds.includes('top1'), 'meidet TOP');
  assert.ok(d.peakLoad <= 0.5, 'peak ≤ comfort');
  assert.ok(d.deltaM > 0, 'länger als die direkte Route');
  assert.equal(d.stage, 2, 'peak 0.2 → Stufe 2');
});

test('kein komfortabler Umweg (BOTTOM auch belebt) → leer', () => {
  const avg = new Map([['top1', 0.9], ['top2', 0.9], ['bot1', 0.9], ['bot2', 0.9]]);
  const picks = detourPicks(net, waypoints, avg, SCALE6, 0.5);
  assert.equal(picks.length, 0);
});

test('nichts über Comfort (kein Breach) → kein Umweg nötig → leer', () => {
  const avg = new Map([['top1', 0.3], ['top2', 0.3], ['bot1', 0.2], ['bot2', 0.2]]);
  const picks = detourPicks(net, waypoints, avg, SCALE6, 0.5);
  assert.equal(picks.length, 0);
});

test('die direkte Route wird nie als Umweg angeboten', () => {
  const avg = new Map([['top1', 0.9], ['top2', 0.9], ['bot1', 0.2], ['bot2', 0.2]]);
  const picks = detourPicks(net, waypoints, avg, SCALE6, 0.5);
  for (const d of picks) assert.notEqual(d.stretchIds.join(','), 'top1,top2');
});
