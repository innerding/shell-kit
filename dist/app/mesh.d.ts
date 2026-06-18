import L from 'leaflet';
import { type ScaleSpec } from './scale';
import { type SegmentedNet } from './anthem';
export declare function renderColorMesh(layer: L.LayerGroup, net: SegmentedNet, loads: number[], opts?: {
    scale?: ScaleSpec;
    weight?: number;
    dimmedStretchIds?: Set<string>;
    /** Statische Sackgassen — komplett unsichtbar (nicht gerendert). */
    hiddenStretchIds?: Set<string>;
    /** Einfarbig (z. B. Spar-Modus): ALLE Segmente in dieser Farbe, KEIN weißer Rand,
     *  dünn — die Last-Schicht ist „aus", das Netz bleibt neutral sichtbar. */
    mono?: string;
}): void;
