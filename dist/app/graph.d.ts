import type { SegmentedNet } from './anthem';
/**
 * Liegt ein Punkt (lat, lng) innerhalb von thresholdM Metern einer
 * ausgedimmten Strecke? Für POI-Dimming: wenn ja, POI ebenfalls dimmen.
 */
export declare function isNearDimmedStretch(lat: number, lng: number, net: SegmentedNet, dimmedStretchIds: Set<string>, thresholdM?: number): boolean;
/**
 * Path-Proxy für die POI-Last (ann_128, MVP): die Ø-Last der dem POI NÄCHSTEN
 * Strecke. Bis es echte Rest-Radien (Step 2) gibt, erbt ein POI die Last der
 * Strecke, an der es liegt (nächster Stützpunkt = nächste Strecke). `averageById`
 * = id → Ø-Last (aus stretchAverages). 0, wenn keine Strecke/Last vorhanden.
 */
export declare function nearestStretchLoad(lat: number, lng: number, net: SegmentedNet, averageById: Map<string, number>): number;
/**
 * Berechnet alle pre-existenten Sackgassen des Netzes (statisch, einmal beim
 * Bundle-Laden). Startet mit Strecken die einen Grad-1-Endknoten haben, kaskadiert
 * dann: Strecken die dadurch ihrerseits zur Sackgasse werden, ebenfalls markiert.
 * Unabhängig von BCK/BAK — reine Netz-Topologie.
 */
export declare function computeStaticDeadEnds(net: SegmentedNet, nodeStretchMap: Map<string, string[]>): Set<string>;
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
