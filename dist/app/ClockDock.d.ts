import type { ReactNode } from 'react';
import type { FlapDirection } from './flap';
export default function ClockDock({ mainValue, mainDirection, mainEmphasis, left, running, onToggle, maxHeight, tint, clockTint, playTint, blink, locate, }: {
    /** Haupt-Uhr rechts, Format „H:MM" (einstellige Stunde). */
    mainValue: string;
    mainDirection?: FlapDirection;
    mainEmphasis?: 'quiet' | 'route';
    /** Inhalt der linken Region (Delta / Wegweisung) als Funktion der berechneten Höhe;
     *  rechtsbündig, füllt die reservierte Breite. Undefined = transparent reserviert. */
    left?: (height: number) => ReactNode;
    running: boolean;
    onToggle: () => void;
    /** Obergrenze der Höhe (auf breiten Schirmen); auf dem Handy ergibt sie sich aus der Breite. */
    maxHeight?: number;
    /** Fallback-Tint, wenn clockTint/playTint nicht gesetzt sind. */
    tint?: string;
    /** Tint der Duration-Uhr = Maximallast der Route (Footer-Farbe 2). */
    clockTint?: string;
    /** Tint der Play-Box = Comfort-Einstellung (Footer-Farbe 1). */
    playTint?: string;
    /** Play blinkt (offene Sorge → erst klären). */
    blink?: boolean;
    /** Spar-Modus: Mittelknopf zeigt das Fadenkreuz „Wo bin ich?" statt Play/Pause. */
    locate?: boolean;
}): import("react").JSX.Element;
