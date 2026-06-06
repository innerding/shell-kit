// Tests für bak.ts (bak-test-Logik) — node:test gegen das kompilierte dist.
//   node --test test/bak.test.mjs   (nach `npm run build`)
import test from 'node:test';
import assert from 'node:assert/strict';
import { solveRoute, routeBreachesComfort, toggleWaypoint } from '../dist/app/bak.js';

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

test('toggleWaypoint: anhängen und entfernen, Reihenfolge erhalten', () => {
  assert.deepEqual(toggleWaypoint([], 'p1'), ['p1']);
  assert.deepEqual(toggleWaypoint(['p1'], 'p2'), ['p1', 'p2']);
  assert.deepEqual(toggleWaypoint(['p1', 'p2'], 'p1'), ['p2']);
});
