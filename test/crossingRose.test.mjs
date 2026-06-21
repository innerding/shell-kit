// Tests für crossingRose.ts (Kreuzungsrose, Wirbel-Abstufung + Morph, M-D).
//   node --test test/crossingRose.test.mjs   (nach `npm run build`)
import test from 'node:test';
import assert from 'node:assert/strict';
import { crossingRoseState } from '../dist/app/crossingRose.js';

// T-Kreuzung: Arme nach N(0), S(180), O(90). Heading = Nord.
const T_ARMS = [0, 180, 90];

test('geradeaus durch eine eindeutige Kreuzung ⇒ ruhig (level 0, p 0)', () => {
  // von Süd kommend (entry 0), nach Nord weiter (exit 0) — der O-Arm liegt 90° weg.
  const r = crossingRoseState({ arms: T_ARMS, entryBearing: 0, exitBearing: 0, heading: 0, distanceM: 10 });
  assert.equal(r.level, 0);
  assert.equal(r.p, 0);
  assert.ok(r.wirbel < 0.2);
  assert.ok(Math.abs(r.exitAngleRel) < 1);          // Pfeil zeigt hoch
  assert.deepEqual(r.stubAnglesRel.map(Math.round), [90]);  // O-Arm als Stub rechts
});

test('scharfe Abbiegung ⇒ höherer Wirbel (heikel)', () => {
  // von Süd kommend (entry 0), nach Ost (exit 90).
  const r = crossingRoseState({ arms: T_ARMS, entryBearing: 0, exitBearing: 90, heading: 0, distanceM: 0 });
  assert.ok(r.wirbel >= 0.45, `wirbel=${r.wirbel}`);
  assert.equal(r.level, 2);
});

test('verwechselbarer Arm (Y-Gabel) ⇒ höherer Wirbel, auch ohne Abbiegung', () => {
  // Arme N(0), eng daneben(20), S(180). Geradeaus (exit 0), aber 20°-Arm verwirrt.
  const r = crossingRoseState({ arms: [0, 20, 180], entryBearing: 0, exitBearing: 0, heading: 0, distanceM: 0 });
  assert.ok(r.wirbel >= 0.45, `wirbel=${r.wirbel}`);
  assert.equal(Math.round(r.stubAnglesRel[0]), 20);
});

test('Morph p wächst zur Kreuzungs-Mitte (heikel, W=30)', () => {
  const far = crossingRoseState({ arms: T_ARMS, entryBearing: 0, exitBearing: 90, heading: 0, distanceM: 30 });
  const near = crossingRoseState({ arms: T_ARMS, entryBearing: 0, exitBearing: 90, heading: 0, distanceM: 0 });
  assert.ok(far.p <= 0.05);
  assert.ok(near.p >= 0.95);
});

test('Spitze hängt an der GEH-Richtung, nicht am Abbiegewinkel', () => {
  // Abbiegung nach Ost (exit 90) aus Süd kommend (entry 0). Vorn = Heading 0.
  const fwd = crossingRoseState({ arms: T_ARMS, entryBearing: 0, exitBearing: 90, heading: 0, distanceM: 0 });   // schaust nach vorn
  const away = crossingRoseState({ arms: T_ARMS, entryBearing: 0, exitBearing: 90, heading: 180, distanceM: 0 }); // umgedreht
  assert.ok(fwd.tipOpacity > 0.95, `fwd=${fwd.tipOpacity}`);   // Spitze BLEIBT beim normalen Abbiegen
  assert.equal(away.tipOpacity, 0);                            // nur echtes Wegschauen lässt sie verschwinden
});

test('ohne Arm-Daten ⇒ schlichter Pfeil (level 0), zeigt geradeaus (= DU-Richtung)', () => {
  const r = crossingRoseState({ arms: [], entryBearing: 0, exitBearing: 90, heading: 0, distanceM: 5 });
  assert.equal(r.level, 0);
  assert.equal(r.p, 0);
  assert.equal(Math.round(r.exitAngleRel), 0);   // p=0 → kein Vor-Drehen, deckt sich mit DU
  assert.deepEqual(r.stubAnglesRel, []);
});

test('Pfeil deckt sich mit DU bis zur Kreuzung: exit dreht erst mit dem Morph (p)', () => {
  // Abbiegung nach Ost (exit 90), heikel (W=30). Weit weg (p≈0) → Pfeil geradeaus;
  // an der Kreuzung (p=1) → Pfeil voll auf den Austritts-Arm.
  const far = crossingRoseState({ arms: T_ARMS, entryBearing: 0, exitBearing: 90, heading: 0, distanceM: 30 });
  const near = crossingRoseState({ arms: T_ARMS, entryBearing: 0, exitBearing: 90, heading: 0, distanceM: 0 });
  assert.ok(Math.abs(far.exitAngleRel) <= 5, `far=${far.exitAngleRel}`);     // weit: geradeaus
  assert.equal(Math.round(near.exitAngleRel), 90);                            // nah: voller Austritt
});
