// POI-Dompteur (B1, Stufe 3) — die Logik, die unruhige (belebte) POIs „bändigt":
// eine komponierbare Filter-/Ranking-Pipeline, rein/testbar. Der Dompteur stellt
// dem Wanderer einen ruhigeren Ersatz für einen belebten POI in Aussicht.
//
// Die Filter sind die „poi-circus"-Nummern (erweiterbar — „einer von mehreren"):
//   1. poi-circus-kinship  — nur Kandidaten ähnlicher Kategorie (similarityTier ≥ 1),
//                            damit die Tour ihren Charakter behält.
//   2. poi-circus-energy   — Ruhe/Last: die an den Ersatz angrenzenden Beine müssen
//                            im Comfort liegen (kein Breach) — der Zweck des Tauschs.
//   3. poi-circus-detour   — Umweg: unter den ruhigen Ähnlichen der kleinste Aufschlag.
// Sortierung: höchste Ähnlichkeitsstufe, dann kleinster Umweg.
// (Die zugehörige Animation = `poi-dompteur-energy`, Runtime-seitig.)
//
// Orientierung: ALLE Koordinaten [lat, lng] (wie net.stretches[].points / bak.ts) —
// der Runtime-Adapter swappt eingehende [lon,lat]-POIs VOR dem Aufruf.
// .js-Endung: diese Datei hat (anders als die rein typ-importierenden Geschwister)
// echte Laufzeit-Imports — Node-ESM braucht die Endung, Vite verträgt sie.
import { solveRoute, routeBreachesComfort } from './bak.js';
import { polylineLengthM } from './walker.js';
import { similarityTier } from './similarity.js';
/**
 * Wie dompteurPick, aber die GANZE Rangliste (bestplatziert zuerst, gekappt auf
 * `limit`) — für das Durchblättern der Alternativen (Tap-to-cycle). Leeres Array,
 * wenn es keinen ähnlichen, ruhigen, erreichbaren Ersatz gibt.
 */
export function dompteurPicks(net, chainIds, pois, bottleneckId, dimmedStretchIds, limit = 5) {
    return collectPicks(net, chainIds, pois, bottleneckId, dimmedStretchIds).slice(0, Math.max(1, limit));
}
/**
 * Der Dompteur wählt den besten ruhigeren Ersatz für `bottleneckId` aus der
 * geordneten Kette `chainIds`. `pois` = alle wählbaren POIs (CircusPoi).
 * `dimmedStretchIds` = ausgedimmtes Netz (Shell-seitig aus loads+comfort gebildet).
 * Null, wenn es keinen ähnlichen, ruhigen, erreichbaren Ersatz gibt.
 */
export function dompteurPick(net, chainIds, pois, bottleneckId, dimmedStretchIds) {
    return collectPicks(net, chainIds, pois, bottleneckId, dimmedStretchIds)[0] ?? null;
}
// Gemeinsamer Kern: sammelt + sortiert alle tauglichen Ersatz-Kandidaten.
function collectPicks(net, chainIds, pois, bottleneckId, dimmedStretchIds) {
    const byId = new Map(pois.map((p) => [p.id, p]));
    const bott = byId.get(bottleneckId);
    if (!bott)
        return [];
    const coordsOf = (ids) => ids.map((id) => byId.get(id)?.coord).filter((c) => Array.isArray(c));
    const curRoute = solveRoute(net, coordsOf(chainIds));
    const curLen = curRoute ? polylineLengthM(curRoute.points) : 0;
    const inChain = new Set(chainIds);
    // poi-circus-energy: die Kaskade löst EINEN Engpass pro Runde (worstBreachingLeg) —
    // ein Tausch muss also nur DIESEN Engpass beseitigen, nicht die ganze Route
    // komfortabel machen. „Ruhe" = die an den Ersatz angrenzenden Beine (Vorgänger→Y,
    // Y→Nachfolger) liegen im Comfort. Andere belebte Beine = eigene Engpässe (nächste Runde).
    const idx = chainIds.indexOf(bottleneckId);
    const prev = idx > 0 ? chainIds[idx - 1] : undefined;
    const next = idx >= 0 && idx < chainIds.length - 1 ? chainIds[idx + 1] : undefined;
    const out = [];
    for (const c of pois) {
        if (c.id === bottleneckId || inChain.has(c.id))
            continue; // nicht sich selbst / nicht doppelt
        const tier = similarityTier(bott.subcategory, c.subcategory);
        if (tier < 1)
            continue; // poi-circus-kinship: nur ähnlich
        const newChain = chainIds.map((id) => (id === bottleneckId ? c.id : id));
        const whole = solveRoute(net, coordsOf(newChain));
        if (!whole)
            continue; // unerreichbar
        // poi-circus-energy: lokale Ruhe — die Beine um den Ersatz herum im Comfort.
        const localIds = [prev, c.id, next].filter((id) => id != null);
        const local = solveRoute(net, coordsOf(localIds));
        if (!local || routeBreachesComfort(local.stretchIds, dimmedStretchIds))
            continue;
        const newLen = polylineLengthM(whole.points);
        out.push({ id: c.id, subcategory: c.subcategory, tier, deltaM: newLen - curLen, newTotalM: newLen });
    }
    // poi-circus-detour: höchste Ähnlichkeit, dann kleinster Umweg.
    out.sort((a, b) => b.tier - a.tier || a.deltaM - b.deltaM);
    return out;
}
