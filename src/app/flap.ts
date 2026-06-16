// flap.ts — Split-Flap-Sequenz-Logik für die Klappuhr. Reine Logik (kein DOM/React);
// der Runtime-FlapClock konsumiert sie.
//
// Eine Klappe rollt zyklisch durch ihr Alphabet (Ziffern 0–9) und nimmt pro Wechsel
// nur EINE Richtung. Die Richtung ergibt sich aus dem Vorzeichen der WERT-Änderung —
// GLOBAL über alle Stellen, damit Überträge kohärent mitrollen (0→9 als EIN Abwärts-
// Schritt, nicht als 9 Aufwärts-Schritte). So klappt ein Countdown (Begehung: Zeit
// wird weniger) je Minute genau einmal abwärts statt 9× rundherum.

export type FlapDirection = 1 | -1;   // +1 = vorwärts/aufwärts durchs Alphabet, -1 = rückwärts/abwärts

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

export const FLAP_DIGITS = '0123456789';

/**
 * Rollrichtung aus dem Vorzeichen der Wertänderung (nur Ziffern verglichen): sinkt der
 * Wert (neu < alt) → abwärts (−1), sonst aufwärts (+1). Komfort-Default; der Aufrufer
 * kann die Richtung explizit übergeben (z. B. Countdown immer −1, oder echter
 * Mitternachts-Übertrag, den der reine Zahlenvergleich nicht kennt).
 */
export function flapDirection(oldStr: string, newStr: string): FlapDirection {
  const num = (s: string) => Number(s.replace(/\D/g, '') || '0');
  return num(newStr) < num(oldStr) ? -1 : 1;
}

/**
 * Schrittfolge EINER Klappe von `from` nach `to` im zyklischen Alphabet, in Richtung
 * `dir`. Fremdsymbole (nicht im Alphabet, z. B. ':') klappen nicht — sie wechseln direkt
 * (oder gar nicht). Das letzte Element ist immer `to`.
 */
export function rollSteps(from: string, to: string, dir: FlapDirection, alphabet: string = FLAP_DIGITS): string[] {
  if (from === to) return [];
  const a = alphabet.indexOf(from), b = alphabet.indexOf(to);
  if (a < 0 || b < 0) return [to];               // Fremdsymbol → direkter Wechsel, kein Rollen
  const n = alphabet.length;
  const count = dir === 1
    ? (((b - a) % n) + n) % n
    : (((a - b) % n) + n) % n;
  const out: string[] = [];
  let i = a;
  for (let k = 0; k < count; k++) {
    i = (((i + dir) % n) + n) % n;
    out.push(alphabet[i]);
  }
  return out;
}

/**
 * Pro GEÄNDERTER Stelle die Klapp-Schritte (unveränderte Stellen fehlen). Die Richtung
 * gilt global für alle Stellen; Default = `flapDirection(old, new)`. `old`/`new` sollten
 * gleich lang sein (die Uhr füllt mit führenden Nullen).
 */
export function flapSteps(
  oldStr: string,
  newStr: string,
  direction: FlapDirection = flapDirection(oldStr, newStr),
  alphabet: string = FLAP_DIGITS,
): FlapStep[] {
  const len = Math.max(oldStr.length, newStr.length);
  const res: FlapStep[] = [];
  for (let i = 0; i < len; i++) {
    const from = oldStr[i] ?? '';
    const to = newStr[i] ?? '';
    if (from === to) continue;
    res.push({ index: i, from, to, steps: rollSteps(from, to, direction, alphabet) });
  }
  return res;
}
