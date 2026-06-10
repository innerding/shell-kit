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
    /** Felder-/Grenzen-Modell: N−1 innere Feldgrenzen (Load 0..1). Wenn gesetzt
     *  (Länge = stops−1), bestimmt es die Farbe (statt spreizung). */
    borders?: number[];
}
/** Farbe an Position t∈[0,1] über die Stops (lineare RGB-Interpolation). */
export declare function colorFromStops(stops: string[], t: number): string;
export declare function spreize(load: number, sp: ScaleSpec['spreizung']): number;
export declare function entspreize(disp: number, sp: ScaleSpec['spreizung']): number;
/** Felder-/Grenzen-Modell: Farbe je Feld an dessen Mitte, Enden voll, dazwischen linear. */
export declare function colorAtBorders(load: number, stops: string[], borders: number[]): string;
/** Farbe für eine Last (Mesh + Slider-Basis). borders (Felder-Modell) hat Vorrang,
 *  sonst Spreizung. OHNE Wrap. */
export declare function colorAt(load: number, s: ScaleSpec): string;
/** Anzahl der Stufen = Anzahl der Farb-Felder (stops). */
export declare function stageCount(s: ScaleSpec): number;
/** Stufe 1..N einer Last auf DIESER Skala — die EINE Stufen-Wahrheit (Mesh-Felder,
 *  Comfort-Schnitt, später POI-Gestalt lesen daraus; ann_128, Option A). Spiegelt die
 *  Branch-Logik von colorAt: mit gültigen `borders` (Felder-Modell, Vorrang) zähle die
 *  Grenzen, die die Last ERREICHT (Grenzwert gehört zum OBEREN Feld); sonst (Spreizung)
 *  die Display-Position in N gleiche Bänder geschnitten. OHNE Wrap, OHNE Hysterese
 *  (Halbstufen/Deadband = Step 3). */
export declare function stageOf(load: number, s: ScaleSpec): number;
/** Coloursample — das Farb-Pendant zu resampleNet (Wegnetz). Schneidet den
 *  AUTORIERTEN (stetigen) Gradienten in n GLEICH große Last-Felder und gibt jedem
 *  die treffendste Farbe = die Gradient-Farbe in der Feld-MITTE ((i+0.5)/n). Ergebnis
 *  = diskrete n-Feld-Skala: n stops + n−1 gleichmäßige borders, neutrale Spreizung
 *  (die Breiten-Form ist jetzt in den Farben eingefangen). Wrap (Comfort) bleibt.
 *  Gedacht als Bake-at-Publish im Capsuler → das Bundle trägt die fertige Stufen-
 *  Welt, die Runtime liest nur. Funktioniert für beide Autorier-Modi (Spreizung
 *  ODER borders), weil es colorAt sampelt. ann_128, Step 1. */
export declare function resampleScale(s: ScaleSpec, n?: number): ScaleSpec;
/** Display-Position 0..1 für eine Last. wrap=true: Comfort-Verjüngung an. */
export declare function posForLoad(load: number, s: ScaleSpec, useWrap?: boolean): number;
/** Entzerrung: Display-Position → echte Last (für die Comfort-Schwelle). */
export declare function loadForPos(pos: number, s: ScaleSpec, useWrap?: boolean): number;
/** Default-Skala: grün→gelb→rot, lineare Verteilung (Mitte 0.5, Anteile neutral 0.5), kein Wrap. */
export declare const DEFAULT_SCALE: ScaleSpec;
