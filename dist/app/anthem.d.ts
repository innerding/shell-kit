export { heatColor as loadColour } from './colorist';
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
export declare const ANTHEM_PERIOD_MIN = 5;
export declare function nextAtFor(tMin: number): number;
export interface AnthemSnapshot {
    kind: 'anthem_snapshot_v1';
    repId: string;
    t: string;
    tMin: number;
    nextAtMin: number;
    loads: number[];
}
export declare function produceAnthemSnapshot(net: SegmentedNet, repId: string, tMin: number, norm?: NormalizeParams): AnthemSnapshot;
