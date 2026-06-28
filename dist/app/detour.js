// detour — der Path-Detour-Generator (ann_138). Das Geschwister von poiDompteur,
// aber für PFADE: zu einer belebten Route liefert er eine RANGLISTE von UMWEGEN,
// jeder mit Mehrweg (deltaM) + Comfort-Stufe (peak load → stageOf). NUR Umwege, die
// die Comfort-Einstellung erfüllen (peak ≤ comfort) werden angeboten; gibt es keinen,
// ist die Liste leer → der Konsument fällt auf die POI-Entscheidung zurück (Resolver-
// Kette ann_138). Rein/testbar, kein Leaflet.
//
// Mehrere Umwege entstehen durch progressiv strengeres Meiden: bei `comfort` nur die
// breachenden Stretches (kürzester-gerade-noch-komfortabel), tiefer → mehr gemieden
// (ruhiger, länger). solveRouteAvoiding meidet per PENALTY (weich), darum die Filterung.
import { solveRoute, solveRouteAvoiding, solveRoundComfort } from './bak.js';
import { polylineLengthM } from './walker.js';
import { similarityTier } from './similarity.js';
import { stageOf } from './scale.js';
const clamp01 = (x) => Math.max(0, Math.min(1, x));
function peakLoadOf(stretchIds, avgById) {
    let peak = 0;
    for (const id of stretchIds) {
        const a = avgById.get(id) ?? 0;
        if (a > peak)
            peak = a;
    }
    return peak;
}
/**
 * Rangliste komfortabler Umwege für die direkte Route durch `waypoints`. `avgById` =
 * Ø-Last je Stretch, `comfort` = tolerierte Last-Obergrenze (0..1). Sortiert nach
 * Mehrweg (kürzester zuerst), gekappt auf `limit`. Leer = kein komfortabler Umweg.
 */
export function detourPicks(net, waypoints, avgById, scale, comfort, limit = 4) {
    const direct = solveRoute(net, waypoints);
    if (!direct)
        return [];
    const c = clamp01(comfort);
    // Nur wenn die DIREKTE Route überhaupt breacht, gibt es einen Umweg anzubieten —
    // sonst ist alles komfortabel und nichts zu umgehen.
    if (peakLoadOf(direct.stretchIds, avgById) <= c)
        return [];
    const directLen = polylineLengthM(direct.points);
    const seen = new Set([direct.stretchIds.join(',')]); // die direkte Route ist kein „Umweg"
    const out = [];
    // Meide-Schwellen: comfort, dann strenger → Spektrum von „gerade komfortabel" bis „sehr ruhig".
    for (const t of [c, c * 0.8, c * 0.6, c * 0.4]) {
        if (t <= 0)
            continue;
        const avoid = new Set();
        for (const [id, a] of avgById)
            if (a > t)
                avoid.add(id);
        if (avoid.size === 0)
            continue;
        const r = solveRouteAvoiding(net, waypoints, avoid);
        if (!r || r.stretchIds.length === 0)
            continue;
        const sig = r.stretchIds.join(',');
        if (seen.has(sig))
            continue;
        seen.add(sig);
        const peak = peakLoadOf(r.stretchIds, avgById);
        if (peak > c)
            continue; // nur komfortable Umwege anbieten
        out.push({
            points: r.points, stretchIds: r.stretchIds, legs: r.legs,
            deltaM: Math.max(0, polylineLengthM(r.points) - directLen),
            peakLoad: peak, stage: stageOf(peak, scale),
        });
    }
    out.sort((a, b) => a.deltaM - b.deltaM); // kürzester komfortabler Umweg zuerst
    return out.slice(0, Math.max(1, limit));
}
export function routeSuggestions(net, start, target, avgById, scale, comfort, max = 6) {
    const direct = solveRoute(net, [start, target]);
    if (!direct)
        return [];
    const directLen = polylineLengthM(direct.points);
    const directPeak = peakLoadOf(direct.stretchIds, avgById);
    const out = [{
            route: direct, lengthM: directLen, peakLoad: directPeak, stage: stageOf(directPeak, scale), deltaM: 0,
        }];
    const seen = new Set([direct.stretchIds.join(',')]); // direkte Route ist schon drin
    for (const d of detourPicks(net, [start, target], avgById, scale, comfort, max)) {
        const sig = d.stretchIds.join(',');
        if (seen.has(sig))
            continue;
        seen.add(sig);
        out.push({
            route: { stretchIds: d.stretchIds, points: d.points, legs: d.legs },
            lengthM: directLen + d.deltaM, peakLoad: d.peakLoad, stage: d.stage, deltaM: d.deltaM,
        });
    }
    out.sort((a, b) => a.lengthM - b.lengthM); // Dauer aufsteigend (v1-Default)
    return out.slice(0, Math.max(1, max));
}
// Luftlinie (m) zwischen zwei [lat,lng] — für die „nächstes Kinship-POI"-Wahl.
function haversineM([lat1, lng1], [lat2, lng2]) {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180, dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
}
// Gibt es unter den Vorschlägen mindestens einen comfortablen (peak ≤ comfort)?
const hasComfortable = (sug, comfort) => sug.some((s) => s.peakLoad <= comfort);
/**
 * Vorschläge zu einem Wunsch-Ziel — mit KLASSEN-KONFORMER Substitution (ann_x). Hat das
 * Wunsch-Ziel keinen comfortablen Weg, wird es durch das **nächstgelegene POI kompatibler
 * Klasse** (`similarityTier ≥ 1`, dieselbe Kinship-Schranke wie der POI-Dompteur) ersetzt,
 * das einen comfortablen Weg hat — Gipfel↛Café. Klappt keiner, kommt best-effort das
 * Wunsch-Ziel zurück (evtl. belebt; nie „nichts").
 */
export function suggestForTarget(net, start, target, candidates, avgById, scale, comfort, max = 6) {
    const own = routeSuggestions(net, start, target.coord, avgById, scale, comfort, max);
    if (hasComfortable(own, comfort))
        return { targetId: target.id, substituted: false, suggestions: own };
    // Kein comfortabler Weg → klassen-konforme Substitution, nächstes Kinship-POI zuerst.
    const kin = candidates
        .filter((c) => c.id !== target.id && similarityTier(target.subcategory, c.subcategory) >= 1)
        .sort((a, b) => haversineM(target.coord, a.coord) - haversineM(target.coord, b.coord));
    for (const c of kin) {
        const s = routeSuggestions(net, start, c.coord, avgById, scale, comfort, max);
        if (hasComfortable(s, comfort))
            return { targetId: c.id, substituted: true, suggestions: s };
    }
    return { targetId: target.id, substituted: false, suggestions: own }; // best effort
}
export function sixMix(net, start, target, candidates, avgById, scale, comfort, dimmedStretchIds, maxRatio = 2, max = 6) {
    const served = suggestForTarget(net, start, target, candidates, avgById, scale, comfort, max);
    const fan = served.suggestions;
    if (fan.length === 0)
        return [];
    const servedId = served.targetId;
    const servedPoi = candidates.find((c) => c.id === servedId) ?? target;
    const directLen = fan[0].lengthM; // fan ist nach Länge aufsteigend → [0] = kürzeste
    const acc = new Map();
    const add = (s, targetId, isRound, emphasis) => {
        if (acc.size >= max)
            return;
        const key = (isRound ? 'R|' : '') + targetId + '|' + s.route.stretchIds.join(',');
        const ex = acc.get(key);
        if (ex) {
            if (!ex.emphases.includes(emphasis))
                ex.emphases.push(emphasis);
            return;
        }
        acc.set(key, { ...s, targetId, isRound, emphases: [emphasis] });
    };
    const calmestOf = (list) => list.reduce((m, s) => (s.peakLoad < m.peakLoad ? s : m), list[0]);
    const bestInBudget = (list) => {
        const ib = list.filter((s) => s.peakLoad <= comfort);
        return calmestOf(ib.length ? ib : list);
    };
    // Achsen-Champions (je Achse die Schwerpunkte):
    add(fan[0], servedId, false, 'duration'); // Duration: schnellste
    add(calmestOf(fan), servedId, false, 'comfort'); // Comfort: ruhigste
    add(bestInBudget(fan), servedId, false, 'poi'); // POI: dein Ziel, bester Weg
    // Duration: längere Runde
    const round = solveRoundComfort(net, start, servedPoi.coord, dimmedStretchIds, maxRatio);
    if (round) {
        const rl = polylineLengthM(round.points);
        const rp = peakLoadOf(round.stretchIds, avgById);
        add({ route: round, lengthM: rl, peakLoad: rp, stage: stageOf(rp, scale), deltaM: Math.max(0, rl - directLen) }, servedId, true, 'duration');
    }
    // POI: verwandtes (kinship) Alternativ-Ziel — nächstes zuerst
    const kin = candidates
        .filter((c) => c.id !== servedId && similarityTier(servedPoi.subcategory, c.subcategory) >= 1)
        .sort((a, b) => haversineM(servedPoi.coord, a.coord) - haversineM(servedPoi.coord, b.coord));
    if (kin.length) {
        const ks = routeSuggestions(net, start, kin[0].coord, avgById, scale, comfort, max);
        if (ks.length)
            add(bestInBudget(ks), kin[0].id, false, 'poi');
    }
    // Auffüllen aus dem Fan (Längen-Spreizung), bis max — Emphasis nach Natur.
    for (const s of fan)
        add(s, servedId, false, s.peakLoad <= comfort ? 'comfort' : 'duration');
    return [...acc.values()].sort((a, b) => a.lengthM - b.lengthM).slice(0, max);
}
