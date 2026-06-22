// Tests für findRouteTurns (Abbiege-Erkennung der akustischen Guidance).
//   node --test test/acousticGuidance.test.mjs   (nach `npm run build`)
import test from 'node:test';
import assert from 'node:assert/strict';
import { findRouteTurns } from '../dist/app/acousticGuidance.js';

test('Rechts-dann-Links (je ~90°) ⇒ zwei scharfe Abbiegungen, richtige Seite', () => {
  // Nord (A→B) → Ost (B→C) = rechts; Ost → Nord (C→D) = links. Segmente ~1.1 km.
  const route = [[0, 0], [0.01, 0], [0.01, 0.01], [0.02, 0.01]];
  const turns = findRouteTurns(route);
  assert.equal(turns.length, 2);
  assert.equal(turns[0].side, 'right'); assert.equal(turns[0].degree, 'hard');
  assert.equal(turns[1].side, 'left');  assert.equal(turns[1].degree, 'hard');
  assert.ok(turns[0].alongM < turns[1].alongM);
});

test('Gerade ⇒ keine Abbiegung', () => {
  const route = [[0, 0], [0.01, 0], [0.02, 0]];
  assert.deepEqual(findRouteTurns(route), []);
});

test('Sanfte Rechtskurve (~40°) ⇒ eine Abbiegung, Grad „bearing"', () => {
  // von Nord auf Peilung ~40° (dLng/dLat ≈ tan40°).
  const route = [[0, 0], [0.01, 0], [0.02, 0.00839]];
  const turns = findRouteTurns(route);
  assert.equal(turns.length, 1);
  assert.equal(turns[0].side, 'right');
  assert.equal(turns[0].degree, 'bearing');
  assert.ok(turns[0].angleDeg > 30 && turns[0].angleDeg < 55, `angle=${turns[0].angleDeg}`);
});
