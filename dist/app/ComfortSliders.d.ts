import { type ScaleSpec } from './scale';
interface Props {
    movementValue: number;
    stayValue: number;
    stayMaxValue: number;
    onMovementChange: (v: number) => void;
    onStayChange: (v: number) => void;
    step2Active?: boolean;
    /** Skala (stops/borders) — Schauglas spricht dieselbe Farbwelt wie das Mesh. */
    scale?: ScaleSpec;
}
export default function ComfortSliders({ movementValue, stayValue, stayMaxValue, onMovementChange, onStayChange, step2Active, scale }: Props): import("react").JSX.Element;
export {};
