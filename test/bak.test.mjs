// Tests für bak.ts (bak-test-Logik) — node:test gegen das kompilierte dist.
//   node --test test/bak.test.mjs   (nach `npm run build`)
import test from 'node:test';
import assert from 'node:assert/strict';
import { solveRoute, solveRouteAvoiding, worstBreachingLeg, breachingLegs, routeBreachesComfort, toggleWaypoint } from '../dist/app/bak.js';

// Topologie: Quadrat-Ecke A-B-C, plus weite Umweg-Ecke D, plus isolierte Kante E-F.
//   A→C kurz über B (s1+s2); der Umweg über D (s4+s3) ist viel länger.
const A = [48.400, 14.200];
const B = [48.401, 14.200];
const C = [48.401, 14.201];
const D = [48.300, 14.201]; // weit südlich → Umweg lang
const E = [48.500, 14.300];
const F = [48.501, 14.300];

const net = {
  stretches: [
    { id: 's1', points: [A, [48.4005, 14.200], B] }, // A–B (mit Zwischenpunkt)
    { id: 's2', points: [B, C] },                     // B–C
    { id: 's3', points: [D, C] },                     // D–C (lang)
    { id: 's4', points: [A, D] },                     // A–D (lang)
    { id: 's6', points: [E, F] },                     // isoliert
  ],
};

test('solveRoute: kürzester Weg A→C läuft über s1+s2', () => {
  const r = solveRoute(net, [A, C]);
  assert.ok(r, 'Route gefunden');
  assert.deepEqual(r.stretchIds, ['s1', 's2']);
  assert.deepEqual(r.points[0], A, 'startet am ersten Waypoint');
  assert.deepEqual(r.points[r.points.length - 1], C, 'endet am letzten Waypoint');
  assert.ok(r.points.length >= 3, 'Zwischenpunkt erhalten');
});

test('solveRoute: geordnete Kette A→C→D verkettet die Beine', () => {
  const r = solveRoute(net, [A, C, D]);
  assert.ok(r);
  assert.deepEqual(r.stretchIds, ['s1', 's2', 's3']);
  assert.deepEqual(r.points[r.points.length - 1], D);
});

test('solveRoute: < 2 Waypoints → null', () => {
  assert.equal(solveRoute(net, [A]), null);
  assert.equal(solveRoute(net, []), null);
});

test('solveRoute: unerreichbarer Waypoint → null', () => {
  assert.equal(solveRoute(net, [A, E]), null);
});

test('solveRoute: Waypoints werden auf den nächsten Netzknoten geschnappt', () => {
  // leicht versetzte Koordinaten (≈ wenige Meter) snappen auf A bzw. C
  const r = solveRoute(net, [[48.40001, 14.20001], [48.40099, 14.20099]]);
  assert.ok(r);
  assert.deepEqual(r.stretchIds, ['s1', 's2']);
});

test('routeBreachesComfort: Route ∩ ausgedimmt', () => {
  assert.equal(routeBreachesComfort(['s1', 's2'], new Set(['s2'])), true);
  assert.equal(routeBreachesComfort(['s1', 's2'], new Set(['s3'])), false);
  assert.equal(routeBreachesComfort([], new Set(['s1'])), false);
});

test('solveRouteAvoiding: meidet ausgedimmtes s2 → nimmt den Umweg s4+s3', () => {
  // ohne Last: kurzer Weg s1+s2
  assert.deepEqual(solveRoute(net, [A, C]).stretchIds, ['s1', 's2']);
  // s2 (B–C) belebt → Ausweichroute über D (s4 + s3), s2 vermieden
  const r = solveRouteAvoiding(net, [A, C], new Set(['s2']));
  assert.ok(r, 'Ausweichroute gefunden');
  assert.ok(!r.stretchIds.includes('s2'), 's2 wird gemieden');
  assert.deepEqual(r.stretchIds, ['s4', 's3']);
  assert.deepEqual(r.points[r.points.length - 1], C, 'endet trotzdem am Ziel');
});

test('solveRouteAvoiding: kein komfortabler Umweg → least-busy Route (enthält dimmed)', () => {
  // alle Wege nach C dimmen → es bleibt nur belebtes Netz; trotzdem eine Route
  const r = solveRouteAvoiding(net, [A, C], new Set(['s2', 's3']));
  assert.ok(r, 'liefert trotzdem eine Route');
});

test('worstBreachingLeg: findet das belebte Bein (Ziel-Index)', () => {
  // Kette A→C→D; s2 (im Bein A→C) belebt → schlechtestes Bein endet bei Index 1
  const w = worstBreachingLeg(net, [A, C, D], new Set(['s2']));
  assert.ok(w, 'Engpass gefunden');
  assert.equal(w.toIndex, 1);
  assert.ok(w.dimmedLenM > 0);
  // ohne Last → kein Engpass
  assert.equal(worstBreachingLeg(net, [A, C, D], new Set()), null);
});

test('breachingLegs: ALLE belebten Beine, nach Schwere sortiert', () => {
  // Kette A→C→D: Bein1 (A→C) über s2, Bein2 (C→D) über s3 — beide belebt.
  const legs = breachingLegs(net, [A, C, D], new Set(['s2', 's3']));
  assert.equal(legs.length, 2);
  assert.deepEqual(legs.map((l) => l.toIndex).sort(), [1, 2]);
  // s3 (D–C, lang) ist schwerer als s2 (B–C, kurz) → toIndex 2 zuerst
  assert.equal(legs[0].toIndex, 2);
  assert.ok(legs[0].dimmedLenM >= legs[1].dimmedLenM);
  // worstBreachingLeg == breachingLegs[0]
  assert.deepEqual(worstBreachingLeg(net, [A, C, D], new Set(['s2', 's3'])), legs[0]);
  // ohne Last → leer
  assert.deepEqual(breachingLegs(net, [A, C, D], new Set()), []);
});

test('toggleWaypoint: anhängen und entfernen, Reihenfolge erhalten', () => {
  assert.deepEqual(toggleWaypoint([], 'p1'), ['p1']);
  assert.deepEqual(toggleWaypoint(['p1'], 'p2'), ['p1', 'p2']);
  assert.deepEqual(toggleWaypoint(['p1', 'p2'], 'p1'), ['p2']);
});
