// Tests für graph.ts — nearestStretchLoad (Path-Proxy, Step 4b) — gegen dist.
//   node --test test/graph.test.mjs   (nach `npm run build`)
import test from 'node:test';
import assert from 'node:assert/strict';
import { nearestStretchLoad, restLoad } from '../dist/app/graph.js';

// Zwei klar getrennte Strecken: A im Norden (~lat 48.01), B im Süden (~lat 48.00).
const net = {
  stretches: [
    { id: 'A', points: [[48.0100, 14.0000], [48.0100, 14.0010]] },
    { id: 'B', points: [[48.0000, 14.0000], [48.0000, 14.0010]] },
  ],
};
const avg = new Map([['A', 0.8], ['B', 0.2]]);

test('POI nahe Strecke A → erbt A-Last (0.8)', () => {
  assert.equal(nearestStretchLoad(48.0101, 14.0005, net, avg), 0.8);
});

test('POI nahe Strecke B → erbt B-Last (0.2)', () => {
  assert.equal(nearestStretchLoad(48.0001, 14.0005, net, avg), 0.2);
});

test('fehlende Last für die nächste Strecke → 0', () => {
  assert.equal(nearestStretchLoad(48.0101, 14.0005, net, new Map()), 0);
});

test('leeres Netz → 0', () => {
  assert.equal(nearestStretchLoad(48.01, 14.0, { stretches: [] }, avg), 0);
});

// restLoad (W3, areal): A und B liegen ~1,1 km auseinander (0.01° Breite).
test('restLoad: enger Radius bei A → nur A-Last (0.8)', () => {
  assert.ok(Math.abs(restLoad(48.0100, 14.0005, net, avg, 200) - 0.8) < 1e-9);
});

test('restLoad: weiter Radius umfasst A und B → Mittel (0.5)', () => {
  // gleich viele Punkte je Strecke → arithmetisches Mittel (0.8+0.2)/2.
  const mid = restLoad(48.0050, 14.0005, net, avg, 2000);
  assert.ok(Math.abs(mid - 0.5) < 1e-9, `mid=${mid}`);
});

test('restLoad: nichts im Radius → 0', () => {
  assert.equal(restLoad(48.0100, 14.0005, net, avg, 1), 0);
});
