import type { LatLng } from './anthem';
/** Haversine-Distanz in Metern zwischen zwei [lat, lng]. */
export declare function distM([lat1, lng1]: LatLng, [lat2, lng2]: LatLng): number;
/** Gesamtlänge einer Polylinie in Metern. */
export declare function polylineLengthM(pts: LatLng[]): number;
/** Peilung in Grad (0 = Nord, im Uhrzeigersinn) von a nach b. */
export declare function bearingDeg([lat1, lng1]: LatLng, [lat2, lng2]: LatLng): number;
export interface WalkState {
    pos: LatLng;
    bearing: number;
    doneM: number;
    totalM: number;
    progress: number;
    finished: boolean;
    offM?: number;
}
/**
 * Position entlang der Polylinie nach `elapsedSec` bei `speedMps` (m/s).
 * Linear interpoliert auf dem aktuellen Segment. `speedMps` darf einen
 * Zeitraffer-Faktor enthalten (Sim-Tempo). Bei <2 Punkten: statisch am Start.
 */
export declare function walkAlong(polyline: LatLng[], elapsedSec: number, speedMps: number): WalkState;
/** Nächster Wegpunkt (POI) zur Position — rein nach Distanz (NICHT in Gehrichtung).
 *  Für „nächster Halt in Gehrichtung" → nextWaypointAhead nutzen. */
export declare function nearestWaypoint(pos: LatLng, waypoints: LatLng[]): {
    idx: number;
    distM: number;
};
/**
 * GPS → Route: projiziert eine reale Position `p` auf die Polylinie und liefert denselben
 * `WalkState` wie `walkAlong` (gesnappte Position, Lauf-Distanz, Segment-Bearing). So
 * treibt echtes GPS dieselbe Guidance-Schnittstelle wie der Simulator. `finishM` = wie nah
 * ans Ende (m), bis `finished` greift. `headingOverride` (z. B. GPS-/Kompass-Kurs in Grad)
 * ersetzt das Segment-Bearing, wenn gesetzt (>= 0).
 */
export declare function locateOnRoute(polyline: LatLng[], p: LatLng, finishM?: number, headingOverride?: number): WalkState;
/**
 * Nächster Wegpunkt IN GEHRICHTUNG: der erste Wegpunkt, dessen Lauf-Position entlang
 * `polyline` VOR der zurückgelegten Distanz `doneM` liegt (nicht der nächstgelegene —
 * der kann hinter einem liegen). `distM` = Rest-Distanz dorthin entlang der Route.
 * Sind alle passiert, gilt das Ziel (letzter Wegpunkt) als nächster.
 */
export declare function nextWaypointAhead(polyline: LatLng[], waypoints: LatLng[], doneM: number, epsM?: number): {
    idx: number;
    distM: number;
};
/** Kreuzung gilt als „auf der Route", wenn ihr Lot ≤ dieser Toleranz ist (m). */
export declare const CROSSING_ON_ROUTE_TOL_M = 20;
/** Projektion eines Punktes auf die Polylinie: along-Distanz (m ab Start) + Lot (m). */
export declare function projectAlong(poly: readonly LatLng[], p: LatLng): {
    along: number;
    perp: number;
};
/** Kreuzungen auf die Route projizieren → sortierte along-Distanzen der nahen (≤ TOL). */
export declare function crossingsAlong(poly: readonly LatLng[], crossings: readonly LatLng[]): number[];
/** Distanz bis zur nächsten Kreuzung VORAUS (along > doneM + eps), oder null wenn keine mehr. */
export declare function nextCrossingAhead(alongs: readonly number[], doneM: number): number | null;
