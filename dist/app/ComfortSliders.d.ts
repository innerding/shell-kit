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
    /** Last-Pegel des GANZEN Netzes (0..1) — bleicht den Gradienten darüber aus. */
    loadLevel?: number;
}
export default function ComfortSliders({ movementValue, stayValue, stayMaxValue, onMovementChange, onStayChange, step2Active, scale, loadLevel }: Props): import("react").JSX.Element;
export {};
