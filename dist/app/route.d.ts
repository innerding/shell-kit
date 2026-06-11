import L from 'leaflet';
import type { Route } from './bak';
import type { LatLng, SegmentedNet } from './anthem';
export interface RenderRouteOpts {
    color?: string;
    weight?: number;
    net?: SegmentedNet;
    dimmedStretchIds?: Set<string>;
    digitRaw?: (d: string) => string;
    /** Default true. false = KEINE Nummern-Scheiben zeichnen — die Reihenfolge-Nummer
     *  trägt dann der POI-Marker selbst (rechts oben in der Ecke), statt sie zentriert
     *  über das POI zu legen. */
    waypointNumbers?: boolean;
}
/**
 * Zeichnet Route + Waypoint-Marken in `layer`. `waypoints` = die gewählten
 * POI-Koordinaten [lat,lng] in Reise-Reihenfolge (für die Nummern).
 * Bei `route === null` werden nur die Marken gesetzt (noch keine lösbare Route).
 */
export declare function renderRoute(layer: L.LayerGroup, route: Route | null, waypoints: LatLng[], opts?: RenderRouteOpts): void;
