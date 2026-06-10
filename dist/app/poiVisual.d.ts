import { type ScaleSpec } from './scale.js';
/** Größen-Faktoren der Gestalt (ann_126): degradiert ×1.0 · normal ×1.2 · auf der
 *  Route / hektisch / intaken ×1.6. */
export declare const POI_SIZE: {
    readonly degraded: 1;
    readonly normal: 1.2;
    readonly route: 1.6;
};
/** Interaktions-Rolle (vom Director-Controls-Flow, Step 4c gesetzt). 'normal' =
 *  Zustand kommt aus Last/Route; 'candidate' = Alternativ-Kandidat (Wasserzeichen,
 *  bis aktiviert); 'intaken' = als Ersatz gewählt. */
export type PoiRole = 'normal' | 'candidate' | 'intaken';
export type PoiKind = 'degraded' | 'normal' | 'route' | 'hektisch' | 'candidate' | 'intaken';
export interface PoiVisual {
    /** Größen-Faktor (×1.0 / ×1.2 / ×1.6). */
    size: number;
    /** Deckkraft 0..1. */
    opacity: number;
    /** Zappel-Intensität 0..1 — nur > 0, wenn breaching (Floor 0.3, Sättigung 1.0).
     *  Das Rendering mappt das auf Amplitude/Frequenz (klein/groß über `size`). */
    hektik: number;
    /** Stufe 1..N (Referenz / Live-Marke). */
    stage: number;
    /** Last über Comfort? (= die Naht für Step 3). */
    breaching: boolean;
    /** Welcher Gestalt-Fall — für Renderer + Tests. */
    kind: PoiKind;
}
export interface PoiVisualInput {
    /** Liegt das POI auf der committeten Route? */
    onRoute: boolean;
    /** Relevante POI-Last 0..1 (Rest-Last; MVP: Path-Proxy der nächsten Strecke). */
    load: number;
    /** Tolerierte Last des Users 0..1. */
    comfort: number;
    /** Skala (stops/borders) — für die Stufe. */
    scale: ScaleSpec;
    /** Interaktions-Overlay (default 'normal'). */
    role?: PoiRole;
}
/** Comfort-Schnitt — die NAHT für Step 3 (Hysterese). HEUTE: nackter Schwellen-
 *  Vergleich, EINE Schwelle, kein Deadband. Step 3 ersetzt NUR diese Funktion
 *  (stateful, Eintritts- ≠ Austritts-Schwelle), ohne poiVisualState anzufassen. */
export declare function poiBreaches(load: number, comfort: number): boolean;
/** Die POI-Gestalt aus Daten + Rolle. Reihenfolge: Interaktions-Rolle (Overlay)
 *  schlägt den Daten-Zustand; sonst on-route vs off-route × breaching. */
export declare function poiVisualState(inp: PoiVisualInput): PoiVisual;
