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
}
/**
 * Position entlang der Polylinie nach `elapsedSec` bei `speedMps` (m/s).
 * Linear interpoliert auf dem aktuellen Segment. `speedMps` darf einen
 * Zeitraffer-Faktor enthalten (Sim-Tempo). Bei <2 Punkten: statisch am Start.
 */
export declare function walkAlong(polyline: LatLng[], elapsedSec: number, speedMps: number): WalkState;
/** Nächster Wegpunkt (POI) zur Position — für die „nächster Halt"-Anzeige. */
export declare function nearestWaypoint(pos: LatLng, waypoints: LatLng[]): {
    idx: number;
    distM: number;
};
