// Tests für poiDompteur.ts (POI-Dompteur, B1-Pipeline) — gegen das kompilierte dist.
//   node --test test/poiDompteur.test.mjs   (nach `npm run build`)
import test from 'node:test';
import assert from 'node:assert/strict';
import { dompteurPick } from '../dist/app/poiDompteur.js';

// Netz wie in bak.test: A-B-C (kurz s1+s2), Umweg über D (s4+s3), isoliert E-F.
const A = [48.400, 14.200];
const B = [48.401, 14.200];
const C = [48.401, 14.201];
const D = [48.300, 14.201];
const E = [48.500, 14.300];
const F = [48.501, 14.300];

const net = {
  stretches: [
    { id: 's1', points: [A, [48.4005, 14.200], B] },
    { id: 's2', points: [B, C] },
    { id: 's3', points: [D, C] },
    { id: 's4', points: [A, D] },
    { id: 's6', points: [E, F] },
  ],
};

// POIs an den Knoten — Koordinaten [lat,lng].
const pois = [
  { id: 'a', subcategory: 'Points_historical', coord: A },
  { id: 'c', subcategory: 'Points_historical', coord: C }, // der Engpass
  { id: 'd', subcategory: 'Points_others',     coord: D }, // ähnlich (gleiche Hauptkat), erreichbar
  { id: 'e', subcategory: 'Service_Sleep',     coord: E }, // unähnlich + isoliert
];

test('dompteurPick: ähnlicher, ruhiger Ersatz wird vorgeschlagen', () => {
  // Kette A→C; Bein über s2 belebt. Tausch C→D (gleiche Hauptkat Points) meidet s2.
  const s = dompteurPick(net, ['a', 'c'], pois, 'c', new Set(['s2']));
  assert.ok(s, 'Vorschlag gefunden');
  assert.equal(s.id, 'd');
  assert.equal(s.tier, 2);             // Points_historical ↔ Points_others = gleiche Hauptkat
  assert.equal(typeof s.deltaM, 'number');
});

test('dompteurPick: unähnliche Kandidaten werden ignoriert → null', () => {
  // Nur 'e' (Service) als möglicher Ersatz für den Points-Engpass 'c', dazu isoliert.
  const s = dompteurPick(net, ['a', 'c'], [pois[0], pois[1], pois[3]], 'c', new Set(['s2']));
  assert.equal(s, null);
});

test('dompteurPick: bereits gewählte POIs kommen nicht als Ersatz', () => {
  // 'd' ist schon in der Kette → kein Ersatz mehr verfügbar → null.
  const s = dompteurPick(net, ['a', 'c', 'd'], pois, 'c', new Set(['s2']));
  assert.equal(s, null);
});

test('dompteurPick: kein ruhiger Ersatz (alles belebt) → null', () => {
  // s3 + s4 (die Wege zu D) ebenfalls belebt → Tausch C→D bliebe im Breach.
  const s = dompteurPick(net, ['a', 'c'], pois, 'c', new Set(['s2', 's3', 's4']));
  assert.equal(s, null);
});
