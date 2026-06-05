export interface MeshStretch {
    id: string;
    points: [number, number][];
}
export interface MeshSegment {
    stretchId: string;
    index: number;
    points: [number, number][];
    load: number;
    color: string;
}
/** Last je Segment: (Strecken-ID, Segment-Index, Segmentanzahl) → 0..1. */
export type LoadLookup = (stretchId: string, segIndex: number, segCount: number) => number;
/** Ampel-Rampe: 0 = frei (grün) → 0.5 = gelb → 1 = voll (rot). */
export declare function loadColor(load: number): string;
export declare function buildColorMesh(stretches: MeshStretch[], load: LoadLookup, opts?: {
    segmentsPerStretch?: number;
}): MeshSegment[];
