// POI-Tausch-Vorschlag (B1, Stufe 3) — komponierbare Vorschlags-Pipeline, rein/testbar.
//
// Wenn ein gewählter POI (Engpass) zu belebt ist, schlägt das System einen ERSATZ
// vor. Filter-/Ranking-Dimensionen (erweiterbar — „einer von mehreren"):
//   1. ÄHNLICHKEIT  — nur Kandidaten ähnlicher Kategorie (similarityTier ≥ 1),
//                     damit die Tour ihren Charakter behält.
//   2. RUHE         — die getauschte Route muss im Comfort liegen (kein Breach) —
//                     der eigentliche Zweck des Tauschs.
//   3. UMWEG        — unter den ruhigen Ähnlichen der kleinste Zeit-/Längenaufschlag.
// Sortierung: höchste Ähnlichkeitsstufe, dann kleinster Umweg.
//
// Orientierung: ALLE Koordinaten [lat, lng] (wie net.stretches[].points / bak.ts) —
// der Runtime-Adapter swappt eingehende [lon,lat]-POIs VOR dem Aufruf.

import type { SegmentedNet, LatLng } from './anthem';
// .js-Endung: diese Datei hat (anders als die rein typ-importierenden Geschwister)
// echte Laufzeit-Imports — Node-ESM braucht die Endung, Vite verträgt sie.
import { solveRoute, routeBreachesComfort } from './bak.js';
import { polylineLengthM } from './walker.js';
import { similarityTier, type SimilarityTier } from './similarity.js';

export interface SwapPoi {
  id: string;
  subcategory: string;
  coord: LatLng;        // [lat, lng]
}

export interface SwapSuggestion {
  id: string;               // Ersatz-POI
  subcategory: string;
  tier: SimilarityTier;     // Ähnlichkeit zum Engpass (1..3)
  deltaM: number;           // Längenänderung der Route ggü. dem Original (m; <0 = kürzer)
  newTotalM: number;        // Gesamtlänge der getauschten Route (m)
}

/**
 * Bester Tausch-Vorschlag für `bottleneckId` aus der geordneten Kette `chainIds`.
 * `pois` = alle wählbaren POIs (mit id/subcategory/coord). `dimmedStretchIds` =
 * ausgedimmtes Netz (Shell-seitig aus loads+comfort gebildet). Null, wenn es keinen
 * ähnlichen, ruhigen, erreichbaren Ersatz gibt.
 */
export function suggestSwap(
  net: SegmentedNet,
  chainIds: string[],
  pois: SwapPoi[],
  bottleneckId: string,
  dimmedStretchIds: Set<string>,
): SwapSuggestion | null {
  const byId = new Map(pois.map((p) => [p.id, p]));
  const bott = byId.get(bottleneckId);
  if (!bott) return null;

  const coordsOf = (ids: string[]): LatLng[] =>
    ids.map((id) => byId.get(id)?.coord).filter((c): c is LatLng => Array.isArray(c));

  const curRoute = solveRoute(net, coordsOf(chainIds));
  const curLen = curRoute ? polylineLengthM(curRoute.points) : 0;
  const inChain = new Set(chainIds);

  // Die Kaskade löst EINEN Engpass pro Runde (worstBreachingLeg) — ein Tausch muss
  // also nur DIESEN Engpass beseitigen, nicht die ganze Route komfortabel machen.
  // „Ruhe" = die an den Ersatz angrenzenden Beine (Vorgänger→Y, Y→Nachfolger) liegen
  // im Comfort. Andere belebte Beine bleiben eigene Engpässe (nächste Runde).
  const idx = chainIds.indexOf(bottleneckId);
  const prev = idx > 0 ? chainIds[idx - 1] : undefined;
  const next = idx >= 0 && idx < chainIds.length - 1 ? chainIds[idx + 1] : undefined;

  const out: SwapSuggestion[] = [];
  for (const c of pois) {
    if (c.id === bottleneckId || inChain.has(c.id)) continue;       // nicht sich selbst / nicht doppelt
    const tier = similarityTier(bott.subcategory, c.subcategory);
    if (tier < 1) continue;                                          // 1) nur ähnlich
    const newChain = chainIds.map((id) => (id === bottleneckId ? c.id : id));
    const whole = solveRoute(net, coordsOf(newChain));
    if (!whole) continue;                                            // unerreichbar
    // 2) lokale Ruhe: die Beine um den Ersatz herum müssen im Comfort liegen.
    const localIds = [prev, c.id, next].filter((id): id is string => id != null);
    const local = solveRoute(net, coordsOf(localIds));
    if (!local || routeBreachesComfort(local.stretchIds, dimmedStretchIds)) continue;
    const newLen = polylineLengthM(whole.points);
    out.push({ id: c.id, subcategory: c.subcategory, tier, deltaM: newLen - curLen, newTotalM: newLen });
  }
  if (out.length === 0) return null;

  // 3) höchste Ähnlichkeit, dann kleinster Umweg.
  out.sort((a, b) => b.tier - a.tier || a.deltaM - b.deltaM);
  return out[0];
}
