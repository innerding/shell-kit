export { heatColor as loadColour } from './colorist.js';
export type LatLng = [number, number];
export interface SegmentedNet {
    stretches: Array<{
        id: string;
        points: LatLng[];
    }>;
}
export declare function simSegmentLoads(net: SegmentedNet): number[];
export interface StretchLoad {
    id: string;
    average: number;
    segmentCount: number;
}
export declare function stretchAverages(net: SegmentedNet, loads: number[]): StretchLoad[];
/**
 * Hysterese / Deadband (BCK Step 3 / W2): das „belebt"-Set (Strecken über Comfort)
 * STATEFUL fortschreiben, statt jeden Tick frisch `avg > comfort` zu schneiden — sonst
 * flackern Strecken, deren Last um die Comfort-Schwelle pendelt. Symmetrisches Deadband:
 * eine Strecke KOMMT in belebt erst bei `avg > comfort + margin`, VERLÄSST es erst bei
 * `avg < comfort − margin`; dazwischen behält sie ihren Vorzustand `prev`.
 *
 * Rein → die Runtime hält `prev` in einem Ref über die Snapshots. `avgById` = id → Ø-Last
 * (aus stretchAverages). `margin` = Deadband-Halbbreite (0..1; 0 ⇒ nackter Schwellenschnitt).
 * Gibt das NEUE belebt-Set zurück (nur ids aus avgById).
 */
export declare function settleDimmed(prev: Set<string>, avgById: Map<string, number>, comfort: number, margin: number): Set<string>;
export interface NormalizeParams {
    spread?: number;
    floor?: number;
    minPartial?: number;
}
export declare function normalizeLoads(loads: number[], params?: NormalizeParams): number[];
export type StretchState = 'normal' | 'degraded' | 'excluded';
export interface ClassifiedStretch {
    id: string;
    average: number;
    state: StretchState;
}
export interface ClassifyParams {
    degradier?: number;
    ausschluss?: number;
}
export declare function classifyStretches(stretches: StretchLoad[], params?: ClassifyParams): ClassifiedStretch[];
export declare function dayPhase(simMin: number): number;
export declare function produceAnthemLoads(net: SegmentedNet, simMin: number, norm?: NormalizeParams): number[];
