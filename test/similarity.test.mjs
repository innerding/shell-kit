// Tests für similarity.ts (B1-Klassifikator) — gegen das kompilierte dist.
//   node --test test/similarity.test.mjs   (nach `npm run build`)
import test from 'node:test';
import assert from 'node:assert/strict';
import { bucketOf, bucketsSimilar, similarityTier } from '../dist/app/similarity.js';

test('bucketOf: Präfix vor dem "_", sonst die Subkategorie selbst', () => {
  assert.equal(bucketOf('Points_historical'), 'Points');
  assert.equal(bucketOf('Square_Move'), 'Square');
  assert.equal(bucketOf('Transport_Parking'), 'Transport');
  assert.equal(bucketOf('Transport'), 'Transport');   // ohne "_"
});

test('similarityTier: gleiche Subkategorie = 3', () => {
  assert.equal(similarityTier('Points_historical', 'Points_historical'), 3);
});

test('similarityTier: gleiche Hauptkategorie (zwei Subs) = 2', () => {
  assert.equal(similarityTier('Points_historical', 'Points_others'), 2);
  assert.equal(similarityTier('Service_Sleep', 'Service_Others'), 2);
});

test('similarityTier: äquivalente Hauptkategorie = 1', () => {
  assert.equal(similarityTier('Points_historical', 'Square_Move'), 1); // Points≡Square
  assert.equal(similarityTier('Square_Rest', 'Regenerate_Water'), 1);  // Square≡Regenerate
  assert.equal(similarityTier('Transport_Parking', 'Service_Sleep'), 1); // Transport≡Service
});

test('similarityTier: KEINE Transitivität — Points & Regenerate = 0', () => {
  // Points≡Square und Square≡Regenerate, aber Points↔Regenerate sind 2 Schritte → unähnlich
  assert.equal(similarityTier('Points_historical', 'Regenerate_Water'), 0);
  assert.equal(similarityTier('Points_historical', 'Service_Sleep'), 0); // ganz fremd
});

test('bucketsSimilar: symmetrisch, nur direkte Paare', () => {
  assert.equal(bucketsSimilar('Points', 'Square'), true);
  assert.equal(bucketsSimilar('Square', 'Points'), true);
  assert.equal(bucketsSimilar('Square', 'Regenerate'), true);
  assert.equal(bucketsSimilar('Points', 'Regenerate'), false); // 2 Schritte
  assert.equal(bucketsSimilar('Transport', 'Service'), true);
  assert.equal(bucketsSimilar('Points', 'Service'), false);
});
