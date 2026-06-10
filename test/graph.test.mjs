// Tests für graph.ts — nearestStretchLoad (Path-Proxy, Step 4b) — gegen dist.
//   node --test test/graph.test.mjs   (nach `npm run build`)
import test from 'node:test';
import assert from 'node:assert/strict';
import { nearestStretchLoad } from '../dist/app/graph.js';

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
