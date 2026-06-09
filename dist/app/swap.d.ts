import type { SegmentedNet, LatLng } from './anthem';
import { type SimilarityTier } from './similarity.js';
export interface SwapPoi {
    id: string;
    subcategory: string;
    coord: LatLng;
}
export interface SwapSuggestion {
    id: string;
    subcategory: string;
    tier: SimilarityTier;
    deltaM: number;
    newTotalM: number;
}
/**
 * Bester Tausch-Vorschlag für `bottleneckId` aus der geordneten Kette `chainIds`.
 * `pois` = alle wählbaren POIs (mit id/subcategory/coord). `dimmedStretchIds` =
 * ausgedimmtes Netz (Shell-seitig aus loads+comfort gebildet). Null, wenn es keinen
 * ähnlichen, ruhigen, erreichbaren Ersatz gibt.
 */
export declare function suggestSwap(net: SegmentedNet, chainIds: string[], pois: SwapPoi[], bottleneckId: string, dimmedStretchIds: Set<string>): SwapSuggestion | null;
