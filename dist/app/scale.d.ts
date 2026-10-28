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
/** Stufen-DACH: die Last-Obergrenze der Stufe, in der `load` liegt (0..1). Damit lässt
 *  sich ein STUFEN-Schnitt bauen: `x > stageTop(comfort)` ⟺ x liegt in einer HÖHEREN
 *  Stufe als comfort. So alarmiert „flüssig" nicht „flüssig", nur „belebt"/„voll".
 *  Oberste Stufe → 1. Borders-Modell: die nächste Grenze; Spreizung: Display-Grenze
 *  stage/n zurück in Last (entspreize). */
export declare function stageTop(load: number, s: ScaleSpec): number;
/**
 * ── DIE GRIFFE DER SÄULE (28.10.2026, o-o-o-o.app bauhuette/border-mesh-point Blatt 131, Teil B, sein „bau es") ──
 * Eine Einstellung sind 2 bis 6 Farben, unten wenig Last, oben viel, und ihre Stösse. Diese drei Griffe sind die eine Wahrheit
 * für die Säule in der Ziel-App und in o-o-o-o.app; keiner setzt die anderen Stösse zurück.
 *   stossSetzen — ein Stoss bewegt sich nur zwischen seinen Nachbarn, jedes Feld bleibt mindestens FELD_MIN hoch;
 *   feldDazu    — ein neues Feld oben, es nimmt die obere Hälfte des obersten Feldes und hat zunächst dessen Farbe;
 *   feldWeg     — das Feld darunter übernimmt die Höhe, beim untersten das Feld darüber.
 */
export interface Einstellung {
    stops: string[];
    borders: number[];
}
export declare const FELD_MIN = 0.02;
export declare const FELDER_MAX = 6;
/** Die Einstellung mit gültigen Stössen; fehlen sie, gleich verteilt. */
export declare function einstellungAus(s: {
    stops: string[];
    borders?: number[];
}): Einstellung;
export declare function stossSetzen(s: Einstellung, i: number, wert: number): Einstellung;
export declare function feldDazu(s: Einstellung): Einstellung;
export declare function feldWeg(s: Einstellung, i: number): Einstellung;
/** Die Felder als Hintergrund: als Verlauf von Mitte zu Mitte, oder hart. Von unten nach oben. */
export declare function saeulenHintergrund(e: Einstellung, mitVerlauf: boolean): string;
/**
 * ── SECHS FELDER (28.10.2026, o-o-o-o.app bauhuette/border-mesh-point Blatt 131, sein „ja, bau es" auf den Vorgang) ──
 * Eingestellt werden 2 bis 6 Farbfelder und ihre Stösse; gerechnet wird immer mit sechs gleich hohen Feldern. Der Vorgang:
 *   1. der gedachte Verlauf: jede Farbe an der Mitte ihres Feldes, dazwischen gleitend; unter der untersten und über der
 *      obersten Mitte bleibt die Farbe stehen (nichts geraten);
 *   2. die Höhe in sechs gleiche Teile;
 *   3. jedes Feld bekommt die Durchschnittsfarbe des Verlaufs in seinem Abschnitt — die beste Näherung an den Verlauf;
 *   4. bleibt der Verlauf über zwei ganze Sechstel gleich, werden die beiden gleich; jede andere Farbe läge weiter weg.
 * Sind es schon sechs gleich hohe Felder, bleiben sie, wie sie sind: Sie sind die sechs Felder.
 */
export declare function sechsFelder(s: Pick<ScaleSpec, 'stops' | 'borders'> & Partial<ScaleSpec>, n?: number): ScaleSpec;
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
export declare const DEFAULT_SCALE: ScaleSpec;
