import { type ArrowDir } from './arrowGlyphs';
import type { CrossingRoseState } from './crossingRose';
export default function FlapGuide({ meters, direction, dockHeight, offRoute, rose, colorMeters }: {
    meters: number;
    direction?: ArrowDir;
    dockHeight: number;
    offRoute?: boolean;
    rose?: CrossingRoseState | null;
    colorMeters?: number;
}): import("react").JSX.Element;
