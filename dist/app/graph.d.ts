import type { SegmentedNet } from './anthem';
/** Endknoten-Koordinate → anliegende Strecken-IDs. */
export declare function buildNodeStretchMap(net: SegmentedNet): Map<string, string[]>;
/**
 * Geschützte Knoten aus POI-Koordinaten [lat, lng] und Stretch-Endknoten.
 * Jeder Endknoten innerhalb von `thresholdM` Metern eines POIs wird geschützt.
 * Geschützte Knoten werden beim Pruning niemals ausgedimmt.
 */
export declare function buildProtectedNodes(poiLatLngs: [number, number][], net: SegmentedNet, thresholdM?: number): Set<string>;
/**
 * Iteratives Sackgassen-Pruning nach BCK-Ausdimmen.
 *
 * Eine Strecke wird ausgedimmt, wenn:
 *   - sie selbst noch aktiv ist UND
 *   - mindestens einer ihrer Endknoten keine aktiven Nachbarn mehr hat UND
 *   - dieser Endknoten nicht in `protectedNodes` liegt.
 *
 * Läuft bis Stabilität (kein weiteres Pruning möglich).
 */
export declare function pruneDeadEnds(initialDimmed: Set<string>, net: SegmentedNet, nodeStretchMap: Map<string, string[]>, protectedNodes: Set<string>): Set<string>;
