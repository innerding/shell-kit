import L from 'leaflet';
import type { Route } from './bak';
import type { LatLng } from './anthem';
export interface RenderRouteOpts {
    color?: string;
    weight?: number;
    digitRaw?: (d: string) => string;
}
/**
 * Zeichnet Route + Waypoint-Marken in `layer`. `waypoints` = die gewählten
 * POI-Koordinaten [lat,lng] in Reise-Reihenfolge (für die Nummern).
 * Bei `route === null` werden nur die Marken gesetzt (noch keine lösbare Route).
 */
export declare function renderRoute(layer: L.LayerGroup, route: Route | null, waypoints: LatLng[], opts?: RenderRouteOpts): void;
