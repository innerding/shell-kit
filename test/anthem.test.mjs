// Tests für anthem.ts — settleDimmed (Hysterese/Deadband, W2) — node:test gegen dist.
//   node --test test/anthem.test.mjs   (nach `npm run build`)
import test from 'node:test';
import assert from 'node:assert/strict';
import { settleDimmed } from '../dist/app/anthem.js';

const comfort = 0.5, margin = 0.04;       // Deadband [0.46 .. 0.54]
const avg = (m) => new Map(Object.entries(m));

test('Eintritt erst über comfort+margin', () => {
  // wasOut: 0.52 (über comfort, aber im Deadband) → bleibt draußen.
  assert.deepEqual([...settleDimmed(new Set(), avg({ a: 0.52 }), comfort, margin)], []);
  // 0.55 (> 0.54) → kommt rein.
  assert.deepEqual([...settleDimmed(new Set(), avg({ a: 0.55 }), comfort, margin)], ['a']);
});

test('Austritt erst unter comfort−margin', () => {
  // wasIn: 0.48 (unter comfort, aber im Deadband) → bleibt drin (kein Flackern).
  assert.deepEqual([...settleDimmed(new Set(['a']), avg({ a: 0.48 }), comfort, margin)], ['a']);
  // 0.45 (< 0.46) → fällt raus.
  assert.deepEqual([...settleDimmed(new Set(['a']), avg({ a: 0.45 }), comfort, margin)], []);
});

test('Pendeln im Deadband hält den Zustand (kein Flackern)', () => {
  let s = new Set();
  // steigt knapp über comfort, aber nie über enter → bleibt ruhig.
  for (const v of [0.51, 0.53, 0.49, 0.52, 0.47]) s = settleDimmed(s, avg({ a: v }), comfort, margin);
  assert.equal(s.has('a'), false);
  // einmal klar drüber → belebt, bleibt dann im Deadband belebt.
  s = settleDimmed(s, avg({ a: 0.6 }), comfort, margin);
  for (const v of [0.53, 0.49, 0.52]) s = settleDimmed(s, avg({ a: v }), comfort, margin);
  assert.equal(s.has('a'), true);
});

test('margin 0 = nackter Schwellenschnitt', () => {
  assert.deepEqual([...settleDimmed(new Set(), avg({ a: 0.51, b: 0.49 }), 0.5, 0)], ['a']);
});
