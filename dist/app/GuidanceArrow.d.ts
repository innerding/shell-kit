import type { CSSProperties, MouseEvent } from 'react';
import { type TurnHint } from './roadArrow';
export default function GuidanceArrow({ hint, width, height, fill, strokeWidth, style, onClick, }: {
    hint: TurnHint;
    width: number;
    height: number;
    fill: string;
    strokeWidth?: number;
    style?: CSSProperties;
    onClick?: (e: MouseEvent) => void;
}): import("react").JSX.Element;
