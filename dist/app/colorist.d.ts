type Stops = Array<{
    at: number;
    color: [number, number, number];
}>;
export type PaletteId = 'heat' | 'green_violet' | 'calm';
export declare const PALETTES: Record<PaletteId, {
    label: string;
    stops: Stops;
}>;
export declare const DEFAULT_PALETTE: PaletteId;
export declare function heatColor(t: number): string;
export interface ColorizeParams {
    palette?: PaletteId;
    spectrum?: number;
    bias?: number;
}
export declare function shapeLoad(load: number, params?: ColorizeParams): number;
export declare function colorize(load: number, params?: ColorizeParams): string;
export {};
