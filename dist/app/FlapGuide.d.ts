import { type TurnHint } from './roadArrow';
export default function FlapGuide({ meters, dockHeight, offRoute, colorMeters, turn }: {
    meters: number;
    dockHeight: number;
    offRoute?: boolean;
    colorMeters?: number;
    turn?: TurnHint | null;
}): import("react").JSX.Element;
