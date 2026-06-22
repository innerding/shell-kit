import type { LatLng } from './anthem';
export type TurnSide = 'left' | 'right';
export type TurnDegree = 'bearing' | 'hard';
export interface RouteTurn {
    alongM: number;
    side: TurnSide;
    degree: TurnDegree;
    angleDeg: number;
}
export declare const TURN_TUNING: {
    minAngleDeg: number;
    hardAngleDeg: number;
    windowM: number;
    mergeDistM: number;
};
export declare function findRouteTurns(poly: readonly LatLng[], opts?: Partial<typeof TURN_TUNING>): RouteTurn[];
export interface AcousticGuide {
    setIntensity(v01: number): void;
    approachTurn(side: TurnSide, degree: TurnDegree): void;
    direction(side: TurnSide, degree: TurnDegree): void;
    alarm(): void;
}
export declare function createAcousticGuide(ctx: AudioContext): AcousticGuide;
