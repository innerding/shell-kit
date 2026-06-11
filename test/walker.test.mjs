// Tests für walker.ts (Sim-Walker, Guidance-Play S1) — node:test gegen dist.
//   node --test test/walker.test.mjs   (nach `npm run build`)
import test from 'node:test';
import assert from 'node:assert/strict';
import { walkAlong, nearestWaypoint, nextWaypointAhead, distM, polylineLengthM, bearingDeg } from '../dist/app/walker.js';

// Gerade Nord-Linie: A → B → C, je 0.001° Breite ≈ 111,2 m (Länge konstant).
const A = [48.000, 14.000];
const B = [48.001, 14.000];
const C = [48.002, 14.000];
const LINE = [A, B, C];
const SEG = distM(A, B);          // ~111,2 m
const TOTAL = polylineLengthM(LINE); // ~222,4 m

test('distM ~111 m für 0.001° Breite', () => {
  assert.ok(Math.abs(SEG - 111.2) < 1.5, `SEG=${SEG}`);
  assert.ok(Math.abs(TOTAL - 2 * SEG) < 0.01, `TOTAL=${TOTAL}`);
});

test('bearing A→B ist Nord (~0°)', () => {
  assert.ok(bearingDeg(A, B) < 1 || bearingDeg(A, B) > 359);
});

test('walkAlong: Start (elapsed 0)', () => {
  const w = walkAlong(LINE, 0, 1.4);
  assert.deepEqual(w.pos, A);
  assert.equal(w.finished, false);
  assert.equal(w.progress, 0);
  assert.ok(Math.abs(w.totalM - TOTAL) < 0.01);
});

test('walkAlong: Mitte (~bei B)', () => {
  const tMid = SEG / 1.4;            // Zeit bis genau B
  const w = walkAlong(LINE, tMid, 1.4);
  assert.equal(w.finished, false);
  assert.ok(Math.abs(w.progress - 0.5) < 0.01, `progress=${w.progress}`);
  assert.ok(distM(w.pos, B) < 0.5, `pos=${w.pos}`);
  assert.ok(w.bearing < 1 || w.bearing > 359, `bearing=${w.bearing}`);
});

test('walkAlong: Ende (über die Zeit)', () => {
  const w = walkAlong(LINE, 99999, 1.4);
  assert.equal(w.finished, true);
  assert.equal(w.progress, 1);
  assert.deepEqual(w.pos, C);
});

test('walkAlong: <2 Punkte → statisch, finished', () => {
  const w = walkAlong([A], 10, 1.4);
  assert.equal(w.finished, true);
  assert.deepEqual(w.pos, A);
});

test('nearestWaypoint findet den nächsten', () => {
  const near = nearestWaypoint([48.00105, 14.000], [A, B, C]); // dicht an B (idx 1)
  assert.equal(near.idx, 1);
  assert.ok(near.distM < 10);
});

test('nextWaypointAhead: kurz NACH B → nächster ist C (nicht das nähere B)', () => {
  // doneM knapp über SEG (an B vorbei) → B liegt hinter uns, nächster Halt = C (idx 2).
  const nw = nextWaypointAhead(LINE, [A, B, C], SEG + 10);
  assert.equal(nw.idx, 2);
  assert.ok(Math.abs(nw.distM - (TOTAL - (SEG + 10))) < 1, `distM=${nw.distM}`);
});

test('nextWaypointAhead: am Start (doneM 0) → nächster ist B, nicht A', () => {
  const nw = nextWaypointAhead(LINE, [A, B, C], 0);
  assert.equal(nw.idx, 1);
});

test('nextWaypointAhead: alle passiert → Ziel (letzter)', () => {
  const nw = nextWaypointAhead(LINE, [A, B, C], TOTAL + 50);
  assert.equal(nw.idx, 2);
});
