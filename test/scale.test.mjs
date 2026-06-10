// Tests für scale.ts — stageOf (Step 1, ann_128 Option A) — gegen das kompilierte dist.
//   node --test test/scale.test.mjs   (nach `npm run build`)
import test from 'node:test';
import assert from 'node:assert/strict';
import { stageOf, stageCount } from '../dist/app/scale.js';

// 6-Stufen-Skala über das Felder-/Grenzen-Modell: 6 stops, 5 innere Grenzen.
const SCALE6 = {
  stops: ['#1', '#2', '#3', '#4', '#5', '#6'],
  borders: [0.1, 0.3, 0.5, 0.7, 0.9],
  spreizung: { mitte: 0.5, oben: 0.5, unten: 0.5 },
  verjuengung: { unten: 0, oben: 0 },
};

test('stageCount = Anzahl stops', () => {
  assert.equal(stageCount(SCALE6), 6);
  assert.equal(stageCount({ stops: ['#a', '#b'] }), 2);
  assert.equal(stageCount({ stops: [] }), 1); // Floor 1
});

test('borders: leere Last → Stufe 1, volle Last → Stufe N', () => {
  assert.equal(stageOf(0, SCALE6), 1);
  assert.equal(stageOf(1, SCALE6), 6);
});

test('borders: Grenzwert gehört zum OBEREN Feld (>= promotet)', () => {
  assert.equal(stageOf(0.09, SCALE6), 1);
  assert.equal(stageOf(0.1, SCALE6), 2);   // genau auf der 1. Grenze → Stufe 2
  assert.equal(stageOf(0.29, SCALE6), 2);
  assert.equal(stageOf(0.3, SCALE6), 3);
  assert.equal(stageOf(0.5, SCALE6), 4);
  assert.equal(stageOf(0.7, SCALE6), 5);
  assert.equal(stageOf(0.9, SCALE6), 6);
});

test('borders: monoton steigend, nie über N oder unter 1', () => {
  let prev = 0;
  for (let i = 0; i <= 20; i++) {
    const s = stageOf(i / 20, SCALE6);
    assert.ok(s >= 1 && s <= 6, `Stufe ${s} im Bereich`);
    assert.ok(s >= prev, `monoton (${prev}→${s})`);
    prev = s;
  }
});

test('borders: Last ausserhalb 0..1 wird geklemmt', () => {
  assert.equal(stageOf(-5, SCALE6), 1);
  assert.equal(stageOf(99, SCALE6), 6);
});

test('Spreizungs-Fallback (keine borders): N gleiche Display-Bänder', () => {
  const lin3 = {
    stops: ['#a', '#b', '#c'],
    spreizung: { mitte: 0.5, oben: 0.5, unten: 0.5 }, // linear → Display = Last
    verjuengung: { unten: 0, oben: 0 },
  };
  assert.equal(stageOf(0, lin3), 1);
  assert.equal(stageOf(0.2, lin3), 1);   // 0.2*3 → Band 1
  assert.equal(stageOf(0.5, lin3), 2);   // Mitte → Band 2
  assert.equal(stageOf(0.9, lin3), 3);
  assert.equal(stageOf(1, lin3), 3);     // oberer Rand bleibt N (kein N+1)
});

test('Einzel-Stop = immer Stufe 1', () => {
  const one = { stops: ['#x'], spreizung: { mitte: 0.5, oben: 0.5, unten: 0.5 }, verjuengung: { unten: 0, oben: 0 } };
  assert.equal(stageOf(0, one), 1);
  assert.equal(stageOf(1, one), 1);
});

test('ungültige borders (falsche Länge) → Spreizungs-Fallback', () => {
  const bad = {
    stops: ['#a', '#b', '#c'],
    borders: [0.5],                       // braucht 2, hat 1 → ignoriert
    spreizung: { mitte: 0.5, oben: 0.5, unten: 0.5 },
    verjuengung: { unten: 0, oben: 0 },
  };
  assert.equal(stageOf(0.5, bad), 2);     // Fallback-Band, nicht borders
});
