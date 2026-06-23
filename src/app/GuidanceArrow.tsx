// GuidanceArrow — der Straßenmarkierungs-Pfeil als FERTIG GESTYLTES SVG: gefüllt (z.B.
// türkis), WEISSER Stroke, m-Ziffern-Shadow. Eine Quelle für den aktiven Dock-Pfeil UND
// die Lehr-Boxen — Stroke/Shadow-Wahrheit liegt hier, nicht mehr in der Runtime.
// Positionierung (fixed/left/bottom) + onClick reicht der Aufrufer über `style`/`onClick`.
import type { CSSProperties, MouseEvent } from 'react';
import { roadArrowPath, type TurnHint } from './roadArrow';

const ARROW_SHADOW = 'drop-shadow(0 1.5px 1px rgba(0,0,0,0.7))';   // = die Meter-Ziffern

export default function GuidanceArrow({
  hint, width, height, fill, strokeWidth = 3.2, style, onClick,
}: {
  hint: TurnHint;
  width: number;
  height: number;
  fill: string;
  strokeWidth?: number;
  style?: CSSProperties;
  onClick?: (e: MouseEvent) => void;
}) {
  return (
    <svg
      onClick={onClick}
      width={width}
      height={height}
      viewBox="0 0 100 110"
      aria-hidden
      style={{ filter: ARROW_SHADOW, ...style }}
    >
      <path
        d={roadArrowPath(hint, { center: false })}
        fill={fill}
        stroke="#ffffff"
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
