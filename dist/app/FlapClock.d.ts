import { type FlapDirection } from './flap';
export declare function clockWidthPx(value: string, height: number, gap: number): number;
export interface FlapTheme {
    face: string;
    seam: string;
    ink: string;
}
export declare function themeFromTint(tint?: string): FlapTheme;
export default function FlapClock({ value, direction, height, emphasis, firstStep, restStep, tint, }: {
    value: string;
    /** Rollrichtung; Default = aus dem Vorzeichen der Wertänderung (flapDirection). */
    direction?: FlapDirection;
    height?: number;
    emphasis?: 'quiet' | 'route';
    /** Dauer des ersten Klapps eines Übergangs (ms) — betonter „auslösender" Klapp (Default 100). */
    firstStep?: number;
    /** Dauer der folgenden Kaskaden-Klappen (ms) — schnelles Rollen/Whirren (Default 40). */
    restStep?: number;
    /** Tint der schwarzen Teile (z. B. Comfort-Farbe). Zu hell → Ziffern kippen auf schwarz. */
    tint?: string;
}): import("react").JSX.Element;
