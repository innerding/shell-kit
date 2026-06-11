import L from 'leaflet';
export interface ClusterMember {
    /** Stabile id (z. B. POI-Index) — für Auswahl/Routenbildung durch den Konsumenten. */
    id?: string;
    cluster?: string;
    coord: [number, number];
    text: string;
    subcategory: string;
    /** Komponiert dieses POI-Icon+Container bei Größe `size` → SVG-String. */
    renderSvg: (size: number) => string;
}
export interface ClusterGhost {
    text: string;
    renderSvg: (size: number) => string;
}
/**
 * Rendert die geclusterten Mitglieder (mit .cluster) in `layer` — neu aufrufen bei zoom/move.
 * `onMemberClick` (optional) wird NUR an EINZELN gezeigte Mitglieder gehängt (nicht an
 * den Ghost): ein verschlucktes Mitglied ist nicht da, ein einzeln sichtbares ist wie
 * ein normaler POI anwählbar (Routenbildung) — der Konsument bekommt das ClusterMember.
 */
export declare function renderClusterPois(map: L.Map, layer: L.LayerGroup, members: ClusterMember[], ghostByCluster: Map<string, ClusterGhost>, onMemberClick?: (member: ClusterMember) => void, routeNumOf?: (id: string) => number, numBadgeHtml?: (n: number, size: number, stackIndex?: number) => string, onMemberLongPress?: (member: ClusterMember) => void): void;
