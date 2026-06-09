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
// .js-Endung: diese Datei hat (anders als die rein typ-importierenden Geschwister)
// echte Laufzeit-Imports — Node-ESM braucht die Endung, Vite verträgt sie.
import { solveRoute, routeBreachesComfort } from './bak.js';
import { polylineLengthM } from './walker.js';
import { similarityTier } from './similarity.js';
/**
 * Bester Tausch-Vorschlag für `bottleneckId` aus der geordneten Kette `chainIds`.
 * `pois` = alle wählbaren POIs (mit id/subcategory/coord). `dimmedStretchIds` =
 * ausgedimmtes Netz (Shell-seitig aus loads+comfort gebildet). Null, wenn es keinen
 * ähnlichen, ruhigen, erreichbaren Ersatz gibt.
 */
export function suggestSwap(net, chainIds, pois, bottleneckId, dimmedStretchIds) {
    const byId = new Map(pois.map((p) => [p.id, p]));
    const bott = byId.get(bottleneckId);
    if (!bott)
        return null;
    const coordsOf = (ids) => ids.map((id) => byId.get(id)?.coord).filter((c) => Array.isArray(c));
    const curRoute = solveRoute(net, coordsOf(chainIds));
    const curLen = curRoute ? polylineLengthM(curRoute.points) : 0;
    const inChain = new Set(chainIds);
    const out = [];
    for (const c of pois) {
        if (c.id === bottleneckId || inChain.has(c.id))
            continue; // nicht sich selbst / nicht doppelt
        const tier = similarityTier(bott.subcategory, c.subcategory);
        if (tier < 1)
            continue; // 1) nur ähnlich
        const newChain = chainIds.map((id) => (id === bottleneckId ? c.id : id));
        const r = solveRoute(net, coordsOf(newChain));
        if (!r)
            continue; // unerreichbar
        if (routeBreachesComfort(r.stretchIds, dimmedStretchIds))
            continue; // 2) muss ruhig sein
        const newLen = polylineLengthM(r.points);
        out.push({ id: c.id, subcategory: c.subcategory, tier, deltaM: newLen - curLen, newTotalM: newLen });
    }
    if (out.length === 0)
        return null;
    // 3) höchste Ähnlichkeit, dann kleinster Umweg.
    out.sort((a, b) => b.tier - a.tier || a.deltaM - b.deltaM);
    return out[0];
}
