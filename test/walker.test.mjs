// Tests für walker.ts (Sim-Walker, Guidance-Play S1) — node:test gegen dist.
//   node --test test/walker.test.mjs   (nach `npm run build`)
import test from 'node:test';
import assert from 'node:assert/strict';
import { walkAlong, nearestWaypoint, nextWaypointAhead, distM, polylineLengthM, bearingDeg, locateOnRoute } from '../dist/app/walker.js';

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

// ── locateOnRoute (S5: GPS → Route, gleiche WalkState-Schnittstelle) ──────────
test('locateOnRoute: Punkt auf der Linie bei B → doneM≈SEG, gesnappt auf B', () => {
  const w = locateOnRoute(LINE, B);
  assert.ok(Math.abs(w.doneM - SEG) < 0.5, `doneM=${w.doneM}`);
  assert.ok(distM(w.pos, B) < 0.5, `pos=${w.pos}`);
  assert.ok(Math.abs(w.progress - 0.5) < 0.01, `progress=${w.progress}`);
  assert.equal(w.finished, false);
});

test('locateOnRoute: seitlich versetzter Punkt wird aufs nächste Segment gesnappt', () => {
  const off = [48.0005, 14.0003];          // bei ~1/4, leicht östlich daneben
  const w = locateOnRoute(LINE, off);
  assert.ok(distM(w.pos, [48.0005, 14.000]) < 1.0, `pos=${w.pos}`);  // auf die Linie projiziert
  assert.ok(w.doneM > 0 && w.doneM < TOTAL, `doneM=${w.doneM}`);
});

test('locateOnRoute: nahe am Ende → finished', () => {
  const w = locateOnRoute(LINE, C, 8);
  assert.ok(w.finished, `progress=${w.progress}`);
  assert.ok(Math.abs(w.doneM - TOTAL) < 0.5, `doneM=${w.doneM}`);
});

test('locateOnRoute: headingOverride ersetzt das Segment-Bearing', () => {
  const w = locateOnRoute(LINE, B, 8, 123);
  assert.equal(w.bearing, 123);
});

test('locateOnRoute: <2 Punkte → statisch am Start, finished', () => {
  const w = locateOnRoute([A], B);
  assert.deepEqual(w.pos, A);
  assert.equal(w.finished, true);
});

test('locateOnRoute: offM ≈ 0 auf der Linie, > 0 seitlich daneben', () => {
  assert.ok((locateOnRoute(LINE, B).offM ?? -1) < 0.5, 'auf der Linie ~0');
  const off = [48.0005, 14.0010];           // ~74 m östlich der Nord-Linie
  const w = locateOnRoute(LINE, off);
  assert.ok((w.offM ?? 0) > 40 && (w.offM ?? 0) < 110, `offM=${w.offM}`);
});
