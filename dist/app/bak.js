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
function buildRouteGraph(net) {
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
        const w = stretchLength(pts);
        add(sk, { to: ek, weight: w, stretchId: s.id, pts });
        add(ek, { to: sk, weight: w, stretchId: s.id, pts: [...pts].reverse() });
    }
    return { adj, coordOf };
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
// Hängt die Punkte einer Kante an die Route an (ohne den Verbindungsknoten zu doppeln).
function appendEdge(route, stretchIds, e) {
    const pts = e.pts;
    const start = route.length === 0 ? 0 : 1; // ersten Punkt überspringen, wenn er = letzter ist
    for (let i = start; i < pts.length; i++)
        route.push(pts[i]);
    // Strecken-id nur einmal hintereinander (eine Strecke kann nicht zweimal in Folge liegen).
    if (stretchIds[stretchIds.length - 1] !== e.stretchId)
        stretchIds.push(e.stretchId);
}
/**
 * Löst eine Route über den Segment-Graph durch die geordnete Waypoint-Kette.
 * `waypoints` = POI-Koordinaten [lat,lng] in Tipp-Reihenfolge (≥ 2).
 * Jeder Waypoint wird auf den nächsten Netzknoten geschnappt, dann segmentweise
 * der kürzeste Weg (Dijkstra) verkettet. Null, wenn < 2 Waypoints oder ein Bein
 * unerreichbar ist.
 */
export function solveRoute(net, waypoints) {
    if (waypoints.length < 2)
        return null;
    const g = buildRouteGraph(net);
    const nodes = [];
    for (const w of waypoints) {
        const n = nearestNode(g, w);
        if (!n)
            return null;
        nodes.push(n);
    }
    const points = [];
    const stretchIds = [];
    for (let i = 1; i < nodes.length; i++) {
        if (nodes[i] === nodes[i - 1])
            continue; // gleicher Knoten → kein Bein
        const edges = shortestPath(g, nodes[i - 1], nodes[i]);
        if (edges == null)
            return null;
        for (const e of edges)
            appendEdge(points, stretchIds, e);
    }
    if (stretchIds.length === 0)
        return null;
    return { stretchIds, points };
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
