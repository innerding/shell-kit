import type { SegmentedNet, LatLng } from './anthem';
export interface RouteLeg {
    stretchId: string;
    from: number;
    to: number;
}
export interface Route {
    stretchIds: string[];
    points: LatLng[];
    legs?: RouteLeg[];
}
/**
 * Löst eine Route über den Segment-Graph durch die geordnete Waypoint-Kette.
 * `waypoints` = POI-Koordinaten [lat,lng] in Tipp-Reihenfolge (≥ 2).
 * Jeder Waypoint wird auf den nächsten Netzknoten geschnappt, dann segmentweise
 * der kürzeste Weg (Dijkstra) verkettet. Null, wenn < 2 Waypoints oder ein Bein
 * unerreichbar ist.
 */
export declare function solveRoute(net: SegmentedNet, waypoints: LatLng[]): Route | null;
/**
 * BAK-Stufe 1 — Ausweichroute: dieselbe Waypoint-Kette, aber das ausgedimmte
 * (zu belebte) Netz wird gemieden (`penalty`-fach teurer). Liefert die ruhigste
 * Route über dieselben POIs — oder null wie solveRoute. Die Shell prüft danach
 * mit routeBreachesComfort, ob die Ausweichung den Comfort wirklich rettet.
 */
export declare function solveRouteAvoiding(net: SegmentedNet, waypoints: LatLng[], dimmedStretchIds: Set<string>, penalty?: number): Route | null;
/**
 * BAK-Stufe 2 — Engpass-Suche: routet jedes Bein (POI→POI) einzeln und summiert
 * die Länge des ausgedimmten Netzes je Bein. Liefert das Ziel-Waypoint-Index des
 * am stärksten belebten Beins (= der POI, dessen Zuweg klemmt) — damit die Shell
 * EINE gezielte Frage stellen kann („Weg zu X ist belebt — auslassen?"). Null,
 * wenn kein Bein das ausgedimmte Netz berührt.
 */
export interface LegBreach {
    toIndex: number;
    dimmedLenM: number;
}
/**
 * ALLE belebten Beine (Ziel-Index + ausgedimmte Länge), absteigend nach Schwere
 * sortiert — für die Manege (Sammelkarte bei Überlast: mehrere Engpässe auf einmal).
 */
export declare function breachingLegs(net: SegmentedNet, waypoints: LatLng[], dimmedStretchIds: Set<string>): LegBreach[];
/**
 * BAK-Stufe 2 — Engpass-Suche: das am stärksten belebte Bein (= der POI, dessen
 * Zuweg klemmt), damit die Shell EINE gezielte Frage stellen kann. Null, wenn kein
 * Bein das ausgedimmte Netz berührt.
 */
export declare function worstBreachingLeg(net: SegmentedNet, waypoints: LatLng[], dimmedStretchIds: Set<string>): LegBreach | null;
/**
 * bak-test-Kern: läuft die Route durch ausgedimmtes Netz (Ø-Last > comfort)?
 * `dimmedStretchIds` bildet die Shell bereits aus stretchAverages + comfort.
 */
export declare function routeBreachesComfort(routeStretchIds: string[], dimmedStretchIds: Set<string>): boolean;
/**
 * Auswahl-Reducer für die geordnete POI-Kette: ist die id schon gewählt → entfernen,
 * sonst hinten anhängen (Tipp-Reihenfolge = Reise-Reihenfolge).
 */
export declare function toggleWaypoint(selected: string[], id: string): string[];
