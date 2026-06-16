// Tests für flap.ts — Split-Flap-Sequenz (Klappuhr), gegen das kompilierte dist.
//   npm run build && node --test test/flap.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { flapDirection, rollSteps, flapSteps } from '../dist/app/flap.js';

test('flapDirection: sinkender Wert → abwärts, steigender → aufwärts', () => {
  assert.equal(flapDirection('16:42', '16:35'), -1);   // Zeit wird weniger
  assert.equal(flapDirection('16:35', '16:42'), 1);
  assert.equal(flapDirection('05:00', '04:59'), -1);   // Countdown
  assert.equal(flapDirection('42', '42'), 1);          // unverändert → +1 (egal, keine Schritte)
});

test('rollSteps: ein Schritt in beide Richtungen', () => {
  assert.deepEqual(rollSteps('2', '1', -1), ['1']);    // abwärts 1
  assert.deepEqual(rollSteps('1', '2', 1), ['2']);     // aufwärts 1
  assert.deepEqual(rollSteps('5', '5', -1), []);       // kein Wechsel
});

test('rollSteps: Übertrag rollt kohärent in EINEM Schritt (0→9 abwärts, 9→0 aufwärts)', () => {
  assert.deepEqual(rollSteps('0', '9', -1), ['9']);    // abwärts: 0 → 9 (Wrap), 1 Schritt
  assert.deepEqual(rollSteps('9', '0', 1), ['0']);     // aufwärts: 9 → 0 (Wrap), 1 Schritt
});

test('DER KERN: ein Minus klappt EINMAL, nicht 9× — Richtung entscheidet', () => {
  // Begehung: Minute sinkt 2→1. Abwärts = 1 Klapp.
  assert.deepEqual(rollSteps('2', '1', -1), ['1']);
  assert.equal(rollSteps('2', '1', -1).length, 1);
  // Gegenprobe: dieselbe Änderung AUFWÄRTS gerollt = der absurde Rundlauf (9 Klappen).
  assert.equal(rollSteps('2', '1', 1).length, 9);
  assert.deepEqual(rollSteps('2', '1', 1), ['3','4','5','6','7','8','9','0','1']);
});

test('rollSteps: mehrstufige Kaskade (Sprung) zählt Schritte in Richtung', () => {
  assert.deepEqual(rollSteps('2', '5', -1), ['1','0','9','8','7','6','5']);   // 7 abwärts (mit Wrap)
  assert.deepEqual(rollSteps('5', '2', 1),  ['6','7','8','9','0','1','2']);   // 7 aufwärts (mit Wrap)
});

test('rollSteps: Fremdsymbol (Doppelpunkt) klappt nicht, wechselt direkt', () => {
  assert.deepEqual(rollSteps(':', ':', -1), []);       // unverändert
  assert.deepEqual(rollSteps('A', 'B', -1), ['B']);    // nicht im Alphabet → direkt
});

test('flapSteps: nur geänderte Stellen, globale Richtung aus dem Vorzeichen', () => {
  const s = flapSteps('16:42', '16:35');               // −7 min → abwärts
  assert.deepEqual(s.map(x => x.index), [3, 4]);        // nur die Minuten-Stellen
  assert.deepEqual(s.find(x => x.index === 3).steps, ['3']);                       // 4→3
  assert.deepEqual(s.find(x => x.index === 4).steps, ['1','0','9','8','7','6','5']); // 2→5 abwärts (Kaskade)
});

test('flapSteps: Übertrag 40→39 rollt komplett ABWÄRTS (kein gegenläufiges Hochrollen)', () => {
  const s = flapSteps('40', '39');                     // −1 → abwärts
  assert.deepEqual(s.find(x => x.index === 0).steps, ['3']);   // Zehner 4→3
  assert.deepEqual(s.find(x => x.index === 1).steps, ['9']);   // Einer 0→9 als EIN Abwärts-Schritt
});

test('flapSteps: Minuten-Tick (Countdown) = genau ein Einzel-Klapp', () => {
  const s = flapSteps('42', '41');                     // ein Minus
  assert.equal(s.length, 1);
  assert.equal(s[0].index, 1);
  assert.deepEqual(s[0].steps, ['1']);                 // EIN Klapp, nicht 9
});

test('flapSteps: explizite Richtung überschreibt den Default (z. B. Mitternacht)', () => {
  // 23:59 → 00:00 ist real +1 min; der reine Zahlenvergleich sähe es als abwärts.
  const up = flapSteps('2359', '0000', 1);             // Aufwärts erzwungen (= real)
  const down = flapSteps('2359', '0000');              // Default: 0 < 2359 → abwärts
  assert.deepEqual(up.find(x => x.index === 3).steps, ['0']);          // Einer 9→0 aufwärts: 1 Schritt
  assert.equal(down.find(x => x.index === 3).steps.length, 9);         // abwärts: 9 Schritte
});
