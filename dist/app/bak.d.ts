import type { SegmentedNet, LatLng } from './anthem';
export interface Route {
    stretchIds: string[];
    points: LatLng[];
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
 * bak-test-Kern: läuft die Route durch ausgedimmtes Netz (Ø-Last > comfort)?
 * `dimmedStretchIds` bildet die Shell bereits aus stretchAverages + comfort.
 */
export declare function routeBreachesComfort(routeStretchIds: string[], dimmedStretchIds: Set<string>): boolean;
/**
 * Auswahl-Reducer für die geordnete POI-Kette: ist die id schon gewählt → entfernen,
 * sonst hinten anhängen (Tipp-Reihenfolge = Reise-Reihenfolge).
 */
export declare function toggleWaypoint(selected: string[], id: string): string[];
