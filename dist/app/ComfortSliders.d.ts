import { type ScaleSpec } from './scale';
export declare function bandCenters(scale: ScaleSpec, n: number): number[];
export interface StripProps {
    value: number;
    maxValue: number;
    onChange: (v: number) => void;
    expanded: boolean;
    onExpandChange: (expanded: boolean) => void;
    gradient: string;
    /** Aktueller Last-Pegel des GANZEN Netzes (0..1). Darüber wird der Gradient
     *  ausgeblichen (milchig) — das Schauglas zeigt nur die Last, die da ist. Der
     *  volle Gradient bleibt als 1px-Stroke ringsum sichtbar (Skala-Referenz). */
    loadLevel?: number;
    /** LINKS, dominant, weiß+Schatten, vertikal zentriert — das Manifest des Sliders
     *  (z. B. „Comfort/von/Stationen." bzw. „Geh/Deinen/Weg."), zeilenweise. */
    manifest?: string[];
    /** RECHTS, weiß+Schatten, je Wort auf seiner Schauglas-Höhe (Stufen-Band-Mitte). */
    cascade?: {
        word: string;
        pos: number;
    }[];
    /** Index in `cascade` der EINGESTELLTEN Stufe — dieses Wort wird in der Stufenfarbe
     *  (`activeColor`) statt weiß gezeichnet (Rückmeldung des gewählten Levels). */
    activeIdx?: number;
    activeColor?: string;
    /** Lässt den verschiebbaren Stroke HART blinken (An/Aus, kein Fade) — z. B. als
     *  Aufforderung am Master-Schauglas, einen Basis-Wert festzulegen. */
    strokeBlink?: boolean;
}
export declare function SliderStrip({ value, maxValue, onChange, expanded, onExpandChange, gradient, loadLevel, manifest, cascade, activeIdx, activeColor, strokeBlink }: StripProps): import("react").JSX.Element;
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
    /** Wert → Comfort-Wort + -Farbe; speist die Kaskade rechts (je Wort auf Schauglas-Höhe). */
    labelOf?: (value: number) => {
        word: string;
        color: string;
    };
    /** Manifest LINKS je Slider (zeilenweise, weiß+Schatten, dominant). */
    stayManifest?: string[];
    movementManifest?: string[];
    /** Expand-Meldung nach oben (für die Sichtbarkeits-Maschine: WEG offen → nur Ziel-POIs). */
    onMovementExpandChange?: (expanded: boolean) => void;
    onStayExpandChange?: (expanded: boolean) => void;
}
export default function ComfortSliders({ movementValue, stayValue, stayMaxValue, onMovementChange, onStayChange, step2Active, scale, loadLevel, stayLoadLevel, labelOf, stayManifest, movementManifest, onMovementExpandChange, onStayExpandChange }: Props): import("react").JSX.Element;
export {};
