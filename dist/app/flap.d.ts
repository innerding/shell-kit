export type FlapDirection = 1 | -1;
export interface FlapStep {
    /** Position im String. */
    index: number;
    /** altes Symbol. */
    from: string;
    /** neues Symbol. */
    to: string;
    /** Zwischen- + Endsymbole in Klapp-Reihenfolge (letztes === to). Leer = kein Wechsel. */
    steps: string[];
}
export declare const FLAP_DIGITS = "0123456789";
/**
 * Rollrichtung aus dem Vorzeichen der Wertänderung (nur Ziffern verglichen): sinkt der
 * Wert (neu < alt) → abwärts (−1), sonst aufwärts (+1). Komfort-Default; der Aufrufer
 * kann die Richtung explizit übergeben (z. B. Countdown immer −1, oder echter
 * Mitternachts-Übertrag, den der reine Zahlenvergleich nicht kennt).
 */
export declare function flapDirection(oldStr: string, newStr: string): FlapDirection;
/**
 * Schrittfolge EINER Klappe von `from` nach `to` im zyklischen Alphabet, in Richtung
 * `dir`. Fremdsymbole (nicht im Alphabet, z. B. ':') klappen nicht — sie wechseln direkt
 * (oder gar nicht). Das letzte Element ist immer `to`.
 */
export declare function rollSteps(from: string, to: string, dir: FlapDirection, alphabet?: string): string[];
/**
 * Pro GEÄNDERTER Stelle die Klapp-Schritte (unveränderte Stellen fehlen). Die Richtung
 * gilt global für alle Stellen; Default = `flapDirection(old, new)`. `old`/`new` sollten
 * gleich lang sein (die Uhr füllt mit führenden Nullen).
 */
export declare function flapSteps(oldStr: string, newStr: string, direction?: FlapDirection, alphabet?: string): FlapStep[];
