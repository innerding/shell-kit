export declare const ROSE_TUNING: {
    alphaCapDeg: number;
    manyArmsWeight: number;
    levelThresholds: [number, number, number];
    onsetWindowM: [number, number, number, number];
    tipFadeDeg: number;
};
export type RoseLevel = 0 | 1 | 2 | 3;
export interface CrossingRoseState {
    wirbel: number;
    level: RoseLevel;
    p: number;
    entryAngleRel: number;
    exitAngleRel: number;
    stubAnglesRel: number[];
    tipOpacity: number;
}
export interface CrossingRoseInput {
    arms: number[];
    entryBearing: number;
    exitBearing: number;
    heading: number;
    distanceM: number;
}
export declare function crossingRoseState(inp: CrossingRoseInput): CrossingRoseState;
