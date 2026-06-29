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
 * Comfort-Route (ann_#2): wie solveRoute, aber jedes Bein darf höchstens `maxRatio`
 * mal so lang wie der kürzeste Weg werden und minimiert in dieser Spanne die über
 * belebtes (ausgedimmtes) Netz gelaufene Gesamtlänge. So überbrückt die Route keine
 * langen Lücken mehr „souverän", sondern weicht ihnen aus, wo es bezahlbar ist —
 * und nimmt die Lücke nur, wo kein Umweg im Budget liegt. Null wie solveRoute.
 */
export declare function solveRouteComfort(net: SegmentedNet, waypoints: LatLng[], dimmedStretchIds: Set<string>, maxRatio?: number): Route | null;
/**
 * Comfort-RUNDE (ann_onboarding): Schleife Start→Ziel→Start. Der Rückweg MEIDET den Hinweg
 * (zuerst ganz ohne Hinweg-Strecken = comfortabel; sonst penalisiert = reibt sie nur, wo nötig).
 * **Überlappung ist bis `maxOverlap` (Default 25 %) der Gesamtlänge erlaubt** — doppelt begangene
 * Segmente (z. B. ein geteilter Verbindungs-Stub). Liegt die Überlappung darüber (bis hin zum
 * reinen Retrace), wird **null** geliefert (= keine sinnvolle Runde). Null auch, wenn der Hinweg
 * unmöglich ist. (Regel: docs/karussell_auswahlregeln.md.)
 */
export declare function solveRoundComfort(net: SegmentedNet, start: LatLng, target: LatLng, dimmedStretchIds: Set<string>, maxRatio?: number, maxOverlap?: number): Route | null;
export type ManualAnchor = {
    kind: 'poi';
    id: string;
    point: LatLng;
} | {
    kind: 'stretch';
    id: string;
};
export interface ManualRouteResult {
    route: Route | null;
    outside: string[];
}
export declare function solveManualRoute(net: SegmentedNet, start: LatLng, anchors: ManualAnchor[], dimmedStretchIds?: Set<string>, maxBridgeM?: number, maxRatio?: number): ManualRouteResult;
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
