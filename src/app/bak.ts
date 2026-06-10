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

import type { SegmentedNet, LatLng } from './anthem';

const R_EARTH = 6371000; // m

function distM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R_EARTH * Math.asin(Math.sqrt(a));
}

// Knoten-Schlüssel — 5 Dezimalstellen ≈ 1 m, konsistent mit graph.ts (buildNodeStretchMap).
function nodeKey([lat, lng]: LatLng): string {
  return `${lat.toFixed(5)},${lng.toFixed(5)}`;
}

// Länge einer Strecke (Summe der 10 m-Segmente).
function stretchLength(points: LatLng[]): number {
  let len = 0;
  for (let i = 1; i < points.length; i++) {
    len += distM(points[i - 1][0], points[i - 1][1], points[i][0], points[i][1]);
  }
  return len;
}

export interface Route {
  stretchIds: string[]; // Strecken, über die die Route läuft (in Reise-Reihenfolge)
  points: LatLng[];     // durchgehende Polylinie (Reise-Reihenfolge, ohne Knoten-Dubletten)
}

interface Edge {
  to: string;       // Ziel-Knoten-Schlüssel
  weight: number;   // Streckenlänge (m)
  stretchId: string;
  pts: LatLng[];    // Strecken-Punkte in DIESER Reise-Richtung (start→to)
}

interface RouteGraph {
  adj: Map<string, Edge[]>;        // Knoten → ausgehende Kanten
  coordOf: Map<string, LatLng>;    // Knoten → Repräsentant-Koordinate (fürs Snappen)
}

// Baut den routbaren Knoten-Graph aus dem Netz: Knoten = Strecken-Endpunkte, je Strecke
// eine Kante in beide Richtungen (Gewicht = Streckenlänge).
//
// BAK-Stufe-1 (Ausweichroute): liegt `dimmed` vor, werden Kanten über ausgedimmte
// (zu belebte) Strecken mit `penalty` multipliziert teurer → Dijkstra meidet sie,
// solange irgendein komfortabler Umweg existiert; ist keiner da, nimmt es den
// am wenigsten belebten Weg. Wichtig: das Gewicht beeinflusst NUR die Wegwahl;
// die gemeldete Routenlänge/Zeit rechnet die Shell aus den echten Punkten.
function buildRouteGraph(net: SegmentedNet, dimmed?: Set<string>, penalty = 1): RouteGraph {
  const adj = new Map<string, Edge[]>();
  const coordOf = new Map<string, LatLng>();
  const add = (from: string, e: Edge) => {
    const list = adj.get(from);
    if (list) list.push(e);
    else adj.set(from, [e]);
  };
  for (const s of net.stretches) {
    const pts = s.points as LatLng[];
    if (pts.length < 2) continue;
    const a = pts[0], b = pts[pts.length - 1];
    const sk = nodeKey(a), ek = nodeKey(b);
    if (sk === ek) continue; // entartete Schleife — nicht routbar
    if (!coordOf.has(sk)) coordOf.set(sk, a);
    if (!coordOf.has(ek)) coordOf.set(ek, b);
    const w = stretchLength(pts) * (dimmed && dimmed.has(s.id) ? penalty : 1);
    add(sk, { to: ek, weight: w, stretchId: s.id, pts });
    add(ek, { to: sk, weight: w, stretchId: s.id, pts: [...pts].reverse() });
  }
  return { adj, coordOf };
}

// Strecken-Länge je id (für die Engpass-Bewertung von Stufe 2).
function buildStretchLengths(net: SegmentedNet): Map<string, number> {
  const m = new Map<string, number>();
  for (const s of net.stretches) m.set(s.id, stretchLength(s.points as LatLng[]));
  return m;
}

// Nächster Netzknoten zu einer Koordinate (für POI→Netz-Snap).
function nearestNode(g: RouteGraph, [lat, lng]: LatLng): string | null {
  let best: string | null = null;
  let bestD = Infinity;
  for (const [key, c] of g.coordOf) {
    const d = distM(lat, lng, c[0], c[1]);
    if (d < bestD) { bestD = d; best = key; }
  }
  return best;
}

// Dijkstra zwischen zwei Knoten. Liefert die Kanten-Folge oder null (unerreichbar).
function shortestPath(g: RouteGraph, from: string, to: string): Edge[] | null {
  if (from === to) return [];
  const dist = new Map<string, number>([[from, 0]]);
  const prev = new Map<string, { node: string; edge: Edge }>();
  const visited = new Set<string>();
  // Einfache Prioritätswahl per linearem Scan (Netz ist klein, ~hunderte Knoten).
  const frontier = new Set<string>([from]);
  while (frontier.size > 0) {
    let u: string | null = null;
    let ud = Infinity;
    for (const n of frontier) {
      const d = dist.get(n) ?? Infinity;
      if (d < ud) { ud = d; u = n; }
    }
    if (u == null) break;
    frontier.delete(u);
    if (u === to) break;
    visited.add(u);
    for (const e of g.adj.get(u) ?? []) {
      if (visited.has(e.to)) continue;
      const nd = ud + e.weight;
      if (nd < (dist.get(e.to) ?? Infinity)) {
        dist.set(e.to, nd);
        prev.set(e.to, { node: u, edge: e });
        frontier.add(e.to);
      }
    }
  }
  if (!prev.has(to) && from !== to) return null;
  // Rückwärts rekonstruieren.
  const edges: Edge[] = [];
  let cur = to;
  while (cur !== from) {
    const p = prev.get(cur);
    if (!p) return null;
    edges.unshift(p.edge);
    cur = p.node;
  }
  return edges;
}

// Hängt die Punkte einer Kante an die Route an (ohne den Verbindungsknoten zu doppeln).
function appendEdge(route: LatLng[], stretchIds: string[], e: Edge): void {
  const pts = e.pts;
  const start = route.length === 0 ? 0 : 1; // ersten Punkt überspringen, wenn er = letzter ist
  for (let i = start; i < pts.length; i++) route.push(pts[i]);
  // Strecken-id nur einmal hintereinander (eine Strecke kann nicht zweimal in Folge liegen).
  if (stretchIds[stretchIds.length - 1] !== e.stretchId) stretchIds.push(e.stretchId);
}

/**
 * Löst eine Route über den Segment-Graph durch die geordnete Waypoint-Kette.
 * `waypoints` = POI-Koordinaten [lat,lng] in Tipp-Reihenfolge (≥ 2).
 * Jeder Waypoint wird auf den nächsten Netzknoten geschnappt, dann segmentweise
 * der kürzeste Weg (Dijkstra) verkettet. Null, wenn < 2 Waypoints oder ein Bein
 * unerreichbar ist.
 */
export function solveRoute(net: SegmentedNet, waypoints: LatLng[]): Route | null {
  return solveChain(buildRouteGraph(net), waypoints);
}

/**
 * BAK-Stufe 1 — Ausweichroute: dieselbe Waypoint-Kette, aber das ausgedimmte
 * (zu belebte) Netz wird gemieden (`penalty`-fach teurer). Liefert die ruhigste
 * Route über dieselben POIs — oder null wie solveRoute. Die Shell prüft danach
 * mit routeBreachesComfort, ob die Ausweichung den Comfort wirklich rettet.
 */
export function solveRouteAvoiding(
  net: SegmentedNet,
  waypoints: LatLng[],
  dimmedStretchIds: Set<string>,
  penalty = 1000,
): Route | null {
  return solveChain(buildRouteGraph(net, dimmedStretchIds, penalty), waypoints);
}

// Gemeinsamer Kern: schnappt jeden Waypoint auf den nächsten Netzknoten und
// verkettet die kürzesten Wege (Gewichtung steckt im übergebenen Graph).
function solveChain(g: RouteGraph, waypoints: LatLng[]): Route | null {
  if (waypoints.length < 2) return null;
  const nodes: string[] = [];
  for (const w of waypoints) {
    const n = nearestNode(g, w);
    if (!n) return null;
    nodes.push(n);
  }
  const points: LatLng[] = [];
  const stretchIds: string[] = [];
  for (let i = 1; i < nodes.length; i++) {
    if (nodes[i] === nodes[i - 1]) continue; // gleicher Knoten → kein Bein
    const edges = shortestPath(g, nodes[i - 1], nodes[i]);
    if (edges == null) return null;
    for (const e of edges) appendEdge(points, stretchIds, e);
  }
  if (stretchIds.length === 0) return null;
  return { stretchIds, points };
}

/**
 * BAK-Stufe 2 — Engpass-Suche: routet jedes Bein (POI→POI) einzeln und summiert
 * die Länge des ausgedimmten Netzes je Bein. Liefert das Ziel-Waypoint-Index des
 * am stärksten belebten Beins (= der POI, dessen Zuweg klemmt) — damit die Shell
 * EINE gezielte Frage stellen kann („Weg zu X ist belebt — auslassen?"). Null,
 * wenn kein Bein das ausgedimmte Netz berührt.
 */
export interface LegBreach { toIndex: number; dimmedLenM: number }

/**
 * ALLE belebten Beine (Ziel-Index + ausgedimmte Länge), absteigend nach Schwere
 * sortiert — für die Manege (Sammelkarte bei Überlast: mehrere Engpässe auf einmal).
 */
export function breachingLegs(
  net: SegmentedNet,
  waypoints: LatLng[],
  dimmedStretchIds: Set<string>,
): LegBreach[] {
  if (waypoints.length < 2) return [];
  const g = buildRouteGraph(net);
  const len = buildStretchLengths(net);
  const out: LegBreach[] = [];
  for (let i = 1; i < waypoints.length; i++) {
    const leg = solveChain(g, [waypoints[i - 1], waypoints[i]]);
    if (!leg) continue;
    let dl = 0;
    for (const id of leg.stretchIds) if (dimmedStretchIds.has(id)) dl += len.get(id) ?? 0;
    if (dl > 0) out.push({ toIndex: i, dimmedLenM: dl });
  }
  out.sort((a, b) => b.dimmedLenM - a.dimmedLenM);
  return out;
}

/**
 * BAK-Stufe 2 — Engpass-Suche: das am stärksten belebte Bein (= der POI, dessen
 * Zuweg klemmt), damit die Shell EINE gezielte Frage stellen kann. Null, wenn kein
 * Bein das ausgedimmte Netz berührt.
 */
export function worstBreachingLeg(
  net: SegmentedNet,
  waypoints: LatLng[],
  dimmedStretchIds: Set<string>,
): LegBreach | null {
  return breachingLegs(net, waypoints, dimmedStretchIds)[0] ?? null;
}

/**
 * bak-test-Kern: läuft die Route durch ausgedimmtes Netz (Ø-Last > comfort)?
 * `dimmedStretchIds` bildet die Shell bereits aus stretchAverages + comfort.
 */
export function routeBreachesComfort(routeStretchIds: string[], dimmedStretchIds: Set<string>): boolean {
  for (const id of routeStretchIds) if (dimmedStretchIds.has(id)) return true;
  return false;
}

/**
 * Auswahl-Reducer für die geordnete POI-Kette: ist die id schon gewählt → entfernen,
 * sonst hinten anhängen (Tipp-Reihenfolge = Reise-Reihenfolge).
 */
export function toggleWaypoint(selected: string[], id: string): string[] {
  return selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id];
}
