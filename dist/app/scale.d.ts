export interface ScaleSpec {
    /** 2–6 Farben, von niedrig (unten/grün) nach hoch (oben/rot). */
    stops: string[];
    /** mitte = globaler Pivot (Last, →Anzeige 0.5). oben/unten = ANTEIL 0..1 der
     *  Mitte ihrer Hälfte (0.5 = neutral). Relativ → bleiben bei Mitte-Verschub gleich. */
    spreizung: {
        mitte: number;
        oben: number;
        unten: number;
    };
    /** Wrap (nur Comfort-Anzeige): staucht die Enden. 0..1 je Ende. */
    verjuengung: {
        unten: number;
        oben: number;
    };
}
/** Farbe an Position t∈[0,1] über die Stops (lineare RGB-Interpolation). */
export declare function colorFromStops(stops: string[], t: number): string;
export declare function spreize(load: number, sp: ScaleSpec['spreizung']): number;
export declare function entspreize(disp: number, sp: ScaleSpec['spreizung']): number;
/** Farbe für eine Last (Mesh + Slider-Basis) — folgt der Spreizung, OHNE Wrap. */
export declare function colorAt(load: number, s: ScaleSpec): string;
/** Display-Position 0..1 für eine Last. wrap=true: Comfort-Verjüngung an. */
export declare function posForLoad(load: number, s: ScaleSpec, useWrap?: boolean): number;
/** Entzerrung: Display-Position → echte Last (für die Comfort-Schwelle). */
export declare function loadForPos(pos: number, s: ScaleSpec, useWrap?: boolean): number;
/** Default-Skala: grün→gelb→rot, lineare Verteilung (Mitte 0.5, Anteile neutral 0.5), kein Wrap. */
export declare const DEFAULT_SCALE: ScaleSpec;
