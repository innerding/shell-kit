// BAK (Broda Avoidance Kernel) — reine Logik, kein DOM/Leaflet. EINE Quelle.
//
// `bak-test` = Testfunktion der Shell: der User wählt POIs zu einer geordneten Kette,
// die Shell löst eine Route über den Segment-Graph (Modell B), und solange die Route
// durch Netz läuft, dessen Ø-Last über dem Comfort-Level liegt (= ausgedimmt), meldet
// die Shell „Route außerhalb der Comfort-Zone". Kein Auto-Reroute — der User wählt selbst.
//
// Bezug:
//   - origin: das `net` (SegmentedNet, ~10 m-resampelt) + POI-Koordinaten.
//   - anthem: die Last (über `dimmedStretchIds`, von der Shell aus loads+comfort gebildet).
//
// Orientierung: ALLE Koordinaten hier sind [lat, lng] — identisch zu net.stretches[].points.
// Der Runtime-Adapter swappt eingehende [lon,lat]-POIs VOR dem Aufruf.
const R_EARTH = 6371000; // m
function distM(lat1, lng1, lat2, lng2) {
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    return 2 * R_EARTH * Math.asin(Math.sqrt(a));
}
// Knoten-Schlüssel — 5 Dezimalstellen ≈ 1 m, konsistent mit graph.ts (buildNodeStretchMap).
function nodeKey([lat, lng]) {
    return `${lat.toFixed(5)},${lng.toFixed(5)}`;
}
// Länge einer Strecke (Summe der 10 m-Segmente).
function stretchLength(points) {
    let len = 0;
    for (let i = 1; i < points.length; i++) {
        len += distM(points[i - 1][0], points[i - 1][1], points[i][0], points[i][1]);
    }
    return len;
}
// Baut den routbaren Knoten-Graph aus dem Netz: Knoten = Strecken-Endpunkte, je Strecke
// eine Kante in beide Richtungen (Gewicht = Streckenlänge).
//
// BAK-Stufe-1 (Ausweichroute): liegt `dimmed` vor, werden Kanten über ausgedimmte
// (zu belebte) Strecken mit `penalty` multipliziert teurer → Dijkstra meidet sie,
// solange irgendein komfortabler Umweg existiert; ist keiner da, nimmt es den
// am wenigsten belebten Weg. Wichtig: das Gewicht beeinflusst NUR die Wegwahl;
// die gemeldete Routenlänge/Zeit rechnet die Shell aus den echten Punkten.
function buildRouteGraph(net, dimmed, penalty = 1) {
    const adj = new Map();
    const coordOf = new Map();
    const add = (from, e) => {
        const list = adj.get(from);
        if (list)
            list.push(e);
        else
            adj.set(from, [e]);
    };
    for (const s of net.stretches) {
        const pts = s.points;
        if (pts.length < 2)
            continue;
        const a = pts[0], b = pts[pts.length - 1];
        const sk = nodeKey(a), ek = nodeKey(b);
        if (sk === ek)
            continue; // entartete Schleife — nicht routbar
        if (!coordOf.has(sk))
            coordOf.set(sk, a);
        if (!coordOf.has(ek))
            coordOf.set(ek, b);
        const realLen = stretchLength(pts);
        const isDim = !!(dimmed && dimmed.has(s.id));
        const w = realLen * (isDim ? penalty : 1);
        const dimM = isDim ? realLen : 0;
        add(sk, { to: ek, weight: w, stretchId: s.id, pts, lenM: realLen, dimM });
        add(ek, { to: sk, weight: w, stretchId: s.id, pts: [...pts].reverse(), lenM: realLen, dimM });
    }
    return { adj, coordOf };
}
// Strecken-Länge je id (für die Engpass-Bewertung von Stufe 2).
function buildStretchLengths(net) {
    const m = new Map();
    for (const s of net.stretches)
        m.set(s.id, stretchLength(s.points));
    return m;
}
// Nächster Netzknoten zu einer Koordinate (für POI→Netz-Snap).
function nearestNode(g, [lat, lng]) {
    let best = null;
    let bestD = Infinity;
    for (const [key, c] of g.coordOf) {
        const d = distM(lat, lng, c[0], c[1]);
        if (d < bestD) {
            bestD = d;
            best = key;
        }
    }
    return best;
}
// Dijkstra zwischen zwei Knoten. Liefert die Kanten-Folge oder null (unerreichbar).
function shortestPath(g, from, to) {
    if (from === to)
        return [];
    const dist = new Map([[from, 0]]);
    const prev = new Map();
    const visited = new Set();
    // Einfache Prioritätswahl per linearem Scan (Netz ist klein, ~hunderte Knoten).
    const frontier = new Set([from]);
    while (frontier.size > 0) {
        let u = null;
        let ud = Infinity;
        for (const n of frontier) {
            const d = dist.get(n) ?? Infinity;
            if (d < ud) {
                ud = d;
                u = n;
            }
        }
        if (u == null)
            break;
        frontier.delete(u);
        if (u === to)
            break;
        visited.add(u);
        for (const e of g.adj.get(u) ?? []) {
            if (visited.has(e.to))
                continue;
            const nd = ud + e.weight;
            if (nd < (dist.get(e.to) ?? Infinity)) {
                dist.set(e.to, nd);
                prev.set(e.to, { node: u, edge: e });
                frontier.add(e.to);
            }
        }
    }
    if (!prev.has(to) && from !== to)
        return null;
    // Rückwärts rekonstruieren.
    const edges = [];
    let cur = to;
    while (cur !== from) {
        const p = prev.get(cur);
        if (!p)
            return null;
        edges.unshift(p.edge);
        cur = p.node;
    }
    return edges;
}
// Hängt die Punkte einer Kante an die Route an (ohne den Verbindungsknoten zu doppeln)
// und vermerkt den befahrenen Streckenzug als Index-Bereich in route (für legs).
function appendEdge(route, stretchIds, legs, e) {
    const pts = e.pts;
    const beforeLen = route.length;
    const start = beforeLen === 0 ? 0 : 1; // ersten Punkt überspringen, wenn er = letzter ist
    for (let i = start; i < pts.length; i++)
        route.push(pts[i]);
    // Strecken-id nur einmal hintereinander (eine Strecke kann nicht zweimal in Folge liegen).
    if (stretchIds[stretchIds.length - 1] !== e.stretchId)
        stretchIds.push(e.stretchId);
    // leg = [geteilter Anfangsknoten .. neues Ende]; Slice = genau dieser Strecken-Anteil
    // der Route. Aufeinanderfolgende legs teilen den Knoten → lückenloses Kacheln.
    const from = beforeLen === 0 ? 0 : beforeLen - 1;
    legs.push({ stretchId: e.stretchId, from, to: route.length - 1 });
}
/**
 * Löst eine Route über den Segment-Graph durch die geordnete Waypoint-Kette.
 * `waypoints` = POI-Koordinaten [lat,lng] in Tipp-Reihenfolge (≥ 2).
 * Jeder Waypoint wird auf den nächsten Netzknoten geschnappt, dann segmentweise
 * der kürzeste Weg (Dijkstra) verkettet. Null, wenn < 2 Waypoints oder ein Bein
 * unerreichbar ist.
 */
export function solveRoute(net, waypoints) {
    return solveChain(buildRouteGraph(net), waypoints);
}
/**
 * BAK-Stufe 1 — Ausweichroute: dieselbe Waypoint-Kette, aber das ausgedimmte
 * (zu belebte) Netz wird gemieden (`penalty`-fach teurer). Liefert die ruhigste
 * Route über dieselben POIs — oder null wie solveRoute. Die Shell prüft danach
 * mit routeBreachesComfort, ob die Ausweichung den Comfort wirklich rettet.
 */
export function solveRouteAvoiding(net, waypoints, dimmedStretchIds, penalty = 1000) {
    return solveChain(buildRouteGraph(net, dimmedStretchIds, penalty), waypoints);
}
// Gemeinsamer Kern: schnappt jeden Waypoint auf den nächsten Netzknoten und
// verkettet die kürzesten Wege (Gewichtung steckt im übergebenen Graph).
function solveChain(g, waypoints) {
    if (waypoints.length < 2)
        return null;
    const nodes = [];
    for (const w of waypoints) {
        const n = nearestNode(g, w);
        if (!n)
            return null;
        nodes.push(n);
    }
    const points = [];
    const stretchIds = [];
    const legs = [];
    for (let i = 1; i < nodes.length; i++) {
        if (nodes[i] === nodes[i - 1])
            continue; // gleicher Knoten → kein Bein
        const edges = shortestPath(g, nodes[i - 1], nodes[i]);
        if (edges == null)
            return null;
        for (const e of edges)
            appendEdge(points, stretchIds, legs, e);
    }
    if (stretchIds.length === 0)
        return null;
    return { stretchIds, points, legs };
}
// ── BAK Comfort-Routing (ann_#2) ──────────────────────────────────────────────
// Dijkstra mit λ-gewichteten Kanten: Kosten(e) = lenM + λ·dimM. λ=0 → kürzester Weg
// (comfort-blind); λ→∞ → minimale ausgedimmte Länge (ungeachtet der Mehrlänge).
function shortestPathW(g, from, to, lambda) {
    if (from === to)
        return [];
    const dist = new Map([[from, 0]]);
    const prev = new Map();
    const visited = new Set();
    const frontier = new Set([from]);
    while (frontier.size > 0) {
        let u = null;
        let ud = Infinity;
        for (const n of frontier) {
            const d = dist.get(n) ?? Infinity;
            if (d < ud) {
                ud = d;
                u = n;
            }
        }
        if (u == null)
            break;
        frontier.delete(u);
        if (u === to)
            break;
        visited.add(u);
        for (const e of g.adj.get(u) ?? []) {
            if (visited.has(e.to))
                continue;
            const nd = ud + e.lenM + lambda * e.dimM;
            if (nd < (dist.get(e.to) ?? Infinity)) {
                dist.set(e.to, nd);
                prev.set(e.to, { node: u, edge: e });
                frontier.add(e.to);
            }
        }
    }
    if (!prev.has(to) && from !== to)
        return null;
    const edges = [];
    let cur = to;
    while (cur !== from) {
        const p = prev.get(cur);
        if (!p)
            return null;
        edges.unshift(p.edge);
        cur = p.node;
    }
    return edges;
}
function legMetrics(edges) {
    let lenM = 0, dimM = 0;
    for (const e of edges) {
        lenM += e.lenM;
        dimM += e.dimM;
    }
    return { lenM, dimM };
}
// Ein Bein comfort-optimal: die Länge darf maxRatio × den kürzesten Weg nicht
// überschreiten; INNERHALB dieser Spanne die minimale ausgedimmte Gesamtlänge.
// Lagrange-Suche über λ: das größte λ (= stärkste Meidung), dessen Weg noch im
// Budget liegt, liefert die wenigst-belebte erlaubte Route.
function solveLegComfort(g, from, to, maxRatio) {
    const shortest = shortestPathW(g, from, to, 0);
    if (shortest == null)
        return null;
    const base = legMetrics(shortest);
    if (base.lenM === 0 || base.dimM === 0)
        return shortest; // nichts zu meiden
    const budget = maxRatio * base.lenM;
    let best = shortest;
    let bestDim = base.dimM;
    let bestLen = base.lenM;
    let lo = 0, hi = 1e5;
    for (let it = 0; it < 24; it++) {
        const lambda = (lo + hi) / 2;
        const path = shortestPathW(g, from, to, lambda);
        if (path == null) {
            hi = lambda;
            continue;
        }
        const m = legMetrics(path);
        if (m.lenM <= budget + 1e-6) {
            // im Budget → besser, wenn weniger belebt (oder gleich belebt, aber kürzer)
            if (m.dimM < bestDim - 1e-6 || (Math.abs(m.dimM - bestDim) < 1e-6 && m.lenM < bestLen - 1e-6)) {
                best = path;
                bestDim = m.dimM;
                bestLen = m.lenM;
            }
            lo = lambda; // mehr Meidung wagen
        }
        else {
            hi = lambda; // zu lang → Meidung lockern
        }
    }
    return best;
}
/**
 * Comfort-Route (ann_#2): wie solveRoute, aber jedes Bein darf höchstens `maxRatio`
 * mal so lang wie der kürzeste Weg werden und minimiert in dieser Spanne die über
 * belebtes (ausgedimmtes) Netz gelaufene Gesamtlänge. So überbrückt die Route keine
 * langen Lücken mehr „souverän", sondern weicht ihnen aus, wo es bezahlbar ist —
 * und nimmt die Lücke nur, wo kein Umweg im Budget liegt. Null wie solveRoute.
 */
export function solveRouteComfort(net, waypoints, dimmedStretchIds, maxRatio = 2) {
    if (waypoints.length < 2)
        return null;
    const g = buildRouteGraph(net, dimmedStretchIds);
    const nodes = [];
    for (const w of waypoints) {
        const n = nearestNode(g, w);
        if (!n)
            return null;
        nodes.push(n);
    }
    const points = [];
    const stretchIds = [];
    const legs = [];
    for (let i = 1; i < nodes.length; i++) {
        if (nodes[i] === nodes[i - 1])
            continue;
        const edges = solveLegComfort(g, nodes[i - 1], nodes[i], maxRatio);
        if (edges == null)
            return null;
        for (const e of edges)
            appendEdge(points, stretchIds, legs, e);
    }
    if (stretchIds.length === 0)
        return null;
    return { stretchIds, points, legs };
}
/**
 * ALLE belebten Beine (Ziel-Index + ausgedimmte Länge), absteigend nach Schwere
 * sortiert — für die Manege (Sammelkarte bei Überlast: mehrere Engpässe auf einmal).
 */
export function breachingLegs(net, waypoints, dimmedStretchIds) {
    if (waypoints.length < 2)
        return [];
    const g = buildRouteGraph(net);
    const len = buildStretchLengths(net);
    const out = [];
    for (let i = 1; i < waypoints.length; i++) {
        const leg = solveChain(g, [waypoints[i - 1], waypoints[i]]);
        if (!leg)
            continue;
        let dl = 0;
        for (const id of leg.stretchIds)
            if (dimmedStretchIds.has(id))
                dl += len.get(id) ?? 0;
        if (dl > 0)
            out.push({ toIndex: i, dimmedLenM: dl });
    }
    out.sort((a, b) => b.dimmedLenM - a.dimmedLenM);
    return out;
}
/**
 * BAK-Stufe 2 — Engpass-Suche: das am stärksten belebte Bein (= der POI, dessen
 * Zuweg klemmt), damit die Shell EINE gezielte Frage stellen kann. Null, wenn kein
 * Bein das ausgedimmte Netz berührt.
 */
export function worstBreachingLeg(net, waypoints, dimmedStretchIds) {
    return breachingLegs(net, waypoints, dimmedStretchIds)[0] ?? null;
}
/**
 * bak-test-Kern: läuft die Route durch ausgedimmtes Netz (Ø-Last > comfort)?
 * `dimmedStretchIds` bildet die Shell bereits aus stretchAverages + comfort.
 */
export function routeBreachesComfort(routeStretchIds, dimmedStretchIds) {
    for (const id of routeStretchIds)
        if (dimmedStretchIds.has(id))
            return true;
    return false;
}
/**
 * Auswahl-Reducer für die geordnete POI-Kette: ist die id schon gewählt → entfernen,
 * sonst hinten anhängen (Tipp-Reihenfolge = Reise-Reihenfolge).
 */
export function toggleWaypoint(selected, id) {
    return selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id];
}
