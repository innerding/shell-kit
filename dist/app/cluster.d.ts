import L from 'leaflet';
export interface ClusterMember {
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
/** Rendert die geclusterten Mitglieder (mit .cluster) in `layer` — neu aufrufen bei zoom/move. */
export declare function renderClusterPois(map: L.Map, layer: L.LayerGroup, members: ClusterMember[], ghostByCluster: Map<string, ClusterGhost>): void;
