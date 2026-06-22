export type TurnSideHint = 'left' | 'right' | 'straight';
export type TurnDegreeHint = 'bearing' | 'hard';
export interface TurnHint {
    side: TurnSideHint;
    degree?: TurnDegreeHint;
}
export declare function roadArrowPath(hint: TurnHint, opts?: {
    center?: boolean;
}): string;
