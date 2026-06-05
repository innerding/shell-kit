export type GeometryShape = {
    kind: 'circle';
    cx: number;
    cy: number;
    r: number;
} | {
    kind: 'rect';
    x: number;
    y: number;
    width: number;
    height: number;
    rx?: number;
} | {
    kind: 'polygon';
    points: [number, number][];
} | {
    kind: 'path';
    d: string;
};
export interface Geometry {
    id: string;
    name_display: string;
    viewBox: string;
    fill_role: 'fill' | 'stroke';
    shape: GeometryShape;
    /** Pixel-Y-Versatz des Icons gegenüber (24,24); Default 0. */
    icon_offset_y?: number;
}
export declare const GEOMETRIES: Geometry[];
export declare function geometryOf(id: string): Geometry | undefined;
