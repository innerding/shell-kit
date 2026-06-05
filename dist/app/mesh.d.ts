import L from 'leaflet';
import { type ColorizeParams } from './colorist';
import { type SegmentedNet } from './anthem';
export declare function renderColorMesh(layer: L.LayerGroup, net: SegmentedNet, loads: number[], opts?: {
    colour?: ColorizeParams;
    weight?: number;
    /** BCK: Strecken-IDs deren Ø-Last > Comfort-Schwelle → stark gedimmt. */
    dimmedStretchIds?: Set<string>;
}): void;
