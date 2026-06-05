import type { Geometry } from './geometry';
import type { DecorationMatch } from './decorations';
export interface RenderAssets {
    /** Rohes Glyph-SVG nach ID (z.B. 'meter','anno','frame','stern') oder null. */
    glyphRaw(id: string): string | null;
    /** Rohes Ziffern-Glyph-SVG (0–9) oder null. */
    digitRaw(digit: number): string | null;
}
export declare function extractIconInner(svg: string): string;
export declare function buildContainerSvg(geo: Geometry, color: string): string;
export declare function buildGlyphRow(deco: DecorationMatch, assets: RenderAssets): {
    inner: string;
    widthUnits: number;
};
export interface CompositeInput {
    geo: Geometry;
    containerColor: string;
    size: number;
    iconInner: string;
    deco: DecorationMatch | null;
    assets: RenderAssets;
}
export declare function buildComposite(input: CompositeInput): string;
export interface ClusterEntity<T> {
    x: number;
    y: number;
    members: T[];
}
export declare function mergeOverlapping<T>(start: ClusterEntity<T>[], swallowDist: number): ClusterEntity<T>[];
