import type { SegmentedNet, LatLng } from './anthem';
import { type SimilarityTier } from './similarity.js';
/** Ein POI in der Manege — Eingabe-Form für den Dompteur. */
export interface CircusPoi {
    id: string;
    subcategory: string;
    coord: LatLng;
}
/** Was der Dompteur auswählt: der ruhigere Ersatz-POI samt Kennzahlen. */
export interface DompteurPick {
    id: string;
    subcategory: string;
    tier: SimilarityTier;
    deltaM: number;
    newTotalM: number;
}
/**
 * Wie dompteurPick, aber die GANZE Rangliste (bestplatziert zuerst, gekappt auf
 * `limit`) — für das Durchblättern der Alternativen (Tap-to-cycle). Leeres Array,
 * wenn es keinen ähnlichen, ruhigen, erreichbaren Ersatz gibt.
 */
export declare function dompteurPicks(net: SegmentedNet, chainIds: string[], pois: CircusPoi[], bottleneckId: string, dimmedStretchIds: Set<string>, limit?: number): DompteurPick[];
/**
 * Der Dompteur wählt den besten ruhigeren Ersatz für `bottleneckId` aus der
 * geordneten Kette `chainIds`. `pois` = alle wählbaren POIs (CircusPoi).
 * `dimmedStretchIds` = ausgedimmtes Netz (Shell-seitig aus loads+comfort gebildet).
 * Null, wenn es keinen ähnlichen, ruhigen, erreichbaren Ersatz gibt.
 */
export declare function dompteurPick(net: SegmentedNet, chainIds: string[], pois: CircusPoi[], bottleneckId: string, dimmedStretchIds: Set<string>): DompteurPick | null;
