import L from 'leaflet';
import { type ColorizeParams } from './colorist';
import { type SegmentedNet } from './anthem';
export declare function renderColorMesh(layer: L.LayerGroup, net: SegmentedNet, loads: number[], opts?: {
    colour?: ColorizeParams;
    weight?: number;
    dimmedStretchIds?: Set<string>;
}): void;
