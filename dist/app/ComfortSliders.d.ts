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
    /** Last-Pegel des GANZEN Netzes (0..1) — bleicht den WEG-Gradienten darüber aus. */
    loadLevel?: number;
    /** Rest-Pegel (0..1, areal) — bleicht den RAST-Gradienten darüber aus. */
    stayLoadLevel?: number;
    /** Wert → Comfort-Wort + -Farbe (für den Status-Text links vom Schauglas). */
    labelOf?: (value: number) => {
        word: string;
        color: string;
    };
}
export default function ComfortSliders({ movementValue, stayValue, stayMaxValue, onMovementChange, onStayChange, step2Active, scale, loadLevel, stayLoadLevel, labelOf }: Props): import("react").JSX.Element;
export {};
