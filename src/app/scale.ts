// Skalen-Modell — EINE Quelle für alle Schieber-Oberflächen (Comfort · Mesh · P01).
// Die Oberflächen sind Kopien DIESES Modells.
//
// Eine Skala = Farb-Stops (2–6) + Spreizung (drei Mitten-Pivots) + Verjüngung (Wrap).
//
//   Drei Pivots (Last-Werte) bestimmen die ANSICHT, auf der sich die Last verteilt:
//     unten  → Anzeige 0.25   (Mitte des unteren Teils)
//     mitte  → Anzeige 0.50   (globale Mitte, für alles)
//     oben   → Anzeige 0.75   (Mitte des oberen Teils)
//   dazu fix 0→0 und 1→1. Dazwischen STÜCKWEISE LINEAR, streng monoton, invertierbar.
//   → bestimmt das Aussehen von BEIDEM (Mesh objektiv + Comfort).
//
//   Wrap (Verjüngung) = NUR Comfort-Button: staucht die Enden der ANZEIGE, damit der
//   Comfort-Schieber nicht „knallt". Subjektiv. Fasst das Mesh NIE an.
//
//   colorAt(load)           → Farbe (Mesh + Slider-Basis; OHNE Wrap)
//   posForLoad(load, wrap)  → Position 0..1 auf dem Schieber
//   loadForPos(pos, wrap)   → Entzerrung (Position → echte Last)

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));

// Wrap-Stärke (Comfort-Verjüngung): param 0..1 → Kurven-Exponent.
const VJ_STRENGTH = 3; // verjüngung 1 → Exponent 4 (Enden stark gestaucht)

export interface ScaleSpec {
  /** 2–6 Farben, von niedrig (unten/grün) nach hoch (oben/rot). */
  stops: string[];
  /** mitte = globaler Pivot (Last, →Anzeige 0.5). oben/unten = ANTEIL 0..1 der
   *  Mitte ihrer Hälfte (0.5 = neutral). Relativ → bleiben bei Mitte-Verschub gleich. */
  spreizung: { mitte: number; oben: number; unten: number };
  /** Wrap (nur Comfort-Anzeige): staucht die Enden. 0..1 je Ende. */
  verjuengung: { unten: number; oben: number };
  /** Felder-/Grenzen-Modell: N−1 innere Feldgrenzen (Load 0..1). Wenn gesetzt
   *  (Länge = stops−1), bestimmt es die Farbe (statt spreizung). */
  borders?: number[];
}

// ── Farben ──────────────────────────────────────────────────────────────────
function parseRGB(c: string): [number, number, number] {
  const s = c.trim();
  if (s.startsWith('#')) {
    const h = s.slice(1);
    const f = h.length === 3 ? h.split('').map((x) => x + x).join('') : h;
    return [parseInt(f.slice(0, 2), 16), parseInt(f.slice(2, 4), 16), parseInt(f.slice(4, 6), 16)];
  }
  const m = s.match(/rgba?\(([^)]+)\)/);
  if (m) { const p = m[1].split(',').map((x) => parseFloat(x)); return [p[0], p[1], p[2]]; }
  return [0, 0, 0];
}
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Farbe an Position t∈[0,1] über die Stops (lineare RGB-Interpolation). */
export function colorFromStops(stops: string[], t: number): string {
  if (stops.length === 0) return 'rgb(0,0,0)';
  if (stops.length === 1) return stops[0];
  const x = clamp01(t) * (stops.length - 1);
  const i = Math.min(stops.length - 2, Math.floor(x));
  const f = x - i;
  const a = parseRGB(stops[i]), b = parseRGB(stops[i + 1]);
  return `rgb(${Math.round(lerp(a[0], b[0], f))},${Math.round(lerp(a[1], b[1], f))},${Math.round(lerp(a[2], b[2], f))})`;
}

// ── Spreizung: Last → Display-Position (drei Pivots, stückweise linear) ───────
const EPS = 0.001;
const DISP = [0, 0.25, 0.5, 0.75, 1];

/** Last-Stützstellen. mitte = Pivot; oben/unten = Anteil ihrer Hälfte (0..1).
 *  Garantiert strenge Ordnung 0<unten<mitte<oben<1. */
function loadStops(sp: ScaleSpec['spreizung']): number[] {
  const mitte = clamp(sp.mitte, 0.04, 0.96);
  const unten = clamp(clamp01(sp.unten) * mitte, EPS, mitte - EPS);
  const oben = clamp(mitte + clamp01(sp.oben) * (1 - mitte), mitte + EPS, 1 - EPS);
  return [0, unten, mitte, oben, 1];
}

/** Stückweise-lineare Abbildung x→y über sortierte Stützstellen. */
function pwl(x: number, xs: number[], ys: number[]): number {
  if (x <= xs[0]) return ys[0];
  for (let i = 0; i < xs.length - 1; i++) {
    if (x <= xs[i + 1]) {
      const t = (x - xs[i]) / (xs[i + 1] - xs[i]);
      return ys[i] + t * (ys[i + 1] - ys[i]);
    }
  }
  return ys[ys.length - 1];
}

export function spreize(load: number, sp: ScaleSpec['spreizung']): number {
  return pwl(clamp01(load), loadStops(sp), DISP);
}

export function entspreize(disp: number, sp: ScaleSpec['spreizung']): number {
  return pwl(clamp01(disp), DISP, loadStops(sp));
}

// ── Verjüngung (Wrap): Display-Position → gestauchte Anzeige (nur Comfort) ────
const aVj = (vj: number) => 1 + VJ_STRENGTH * clamp01(vj);

function wrap(pos: number, vj: ScaleSpec['verjuengung']): number {
  const p = clamp01(pos);
  if (p <= 0.5) return 0.5 * Math.pow(p / 0.5, aVj(vj.unten));
  return 1 - 0.5 * Math.pow((1 - p) / 0.5, aVj(vj.oben));
}
function unwrap(disp: number, vj: ScaleSpec['verjuengung']): number {
  const d = clamp01(disp);
  if (d <= 0.5) return 0.5 * Math.pow(d / 0.5, 1 / aVj(vj.unten));
  return 1 - 0.5 * Math.pow((1 - d) / 0.5, 1 / aVj(vj.oben));
}

// ── Öffentliche API ──────────────────────────────────────────────────────────

function mix(a: string, b: string, f: number): string {
  const x = parseRGB(a), y = parseRGB(b);
  return `rgb(${Math.round(lerp(x[0], y[0], f))},${Math.round(lerp(x[1], y[1], f))},${Math.round(lerp(x[2], y[2], f))})`;
}

/** Felder-/Grenzen-Modell: Farbe je Feld an dessen Mitte, Enden voll, dazwischen linear. */
export function colorAtBorders(load: number, stops: string[], borders: number[]): string {
  const n = stops.length;
  const center = (i: number) => {
    const lo = i === 0 ? 0 : borders[i - 1];
    const hi = i === n - 1 ? 1 : borders[i];
    return (lo + hi) / 2;
  };
  const pos: number[] = [0], cols: string[] = [stops[0]];
  for (let i = 0; i < n; i++) { pos.push(center(i)); cols.push(stops[i]); }
  pos.push(1); cols.push(stops[n - 1]);
  const t = clamp01(load);
  for (let i = 0; i < pos.length - 1; i++) {
    if (t <= pos[i + 1]) {
      const span = pos[i + 1] - pos[i];
      return mix(cols[i], cols[i + 1], span > 1e-9 ? (t - pos[i]) / span : 0);
    }
  }
  return cols[cols.length - 1];
}

/** Farbe für eine Last (Mesh + Slider-Basis). borders (Felder-Modell) hat Vorrang,
 *  sonst Spreizung. OHNE Wrap. */
export function colorAt(load: number, s: ScaleSpec): string {
  if (s.borders && s.stops.length >= 2 && s.borders.length === s.stops.length - 1)
    return colorAtBorders(load, s.stops, s.borders);
  return colorFromStops(s.stops, spreize(load, s.spreizung));
}

/** Anzahl der Stufen = Anzahl der Farb-Felder (stops). */
export function stageCount(s: ScaleSpec): number {
  return Math.max(1, s.stops.length);
}

/** Stufe 1..N einer Last auf DIESER Skala — die EINE Stufen-Wahrheit (Mesh-Felder,
 *  Comfort-Schnitt, später POI-Gestalt lesen daraus; ann_128, Option A). Spiegelt die
 *  Branch-Logik von colorAt: mit gültigen `borders` (Felder-Modell, Vorrang) zähle die
 *  Grenzen, die die Last ERREICHT (Grenzwert gehört zum OBEREN Feld); sonst (Spreizung)
 *  die Display-Position in N gleiche Bänder geschnitten. OHNE Wrap, OHNE Hysterese
 *  (Halbstufen/Deadband = Step 3). */
export function stageOf(load: number, s: ScaleSpec): number {
  const n = stageCount(s);
  const t = clamp01(load);
  if (s.borders && s.stops.length >= 2 && s.borders.length === s.stops.length - 1) {
    let stage = 1;
    for (const b of s.borders) if (t >= b) stage++;
    return Math.min(n, stage);
  }
  const disp = spreize(t, s.spreizung);          // 0..1 Display-Position
  return Math.min(n, Math.floor(disp * n) + 1);
}

/** Stufen-DACH: die Last-Obergrenze der Stufe, in der `load` liegt (0..1). Damit lässt
 *  sich ein STUFEN-Schnitt bauen: `x > stageTop(comfort)` ⟺ x liegt in einer HÖHEREN
 *  Stufe als comfort. So alarmiert „flüssig" nicht „flüssig", nur „belebt"/„voll".
 *  Oberste Stufe → 1. Borders-Modell: die nächste Grenze; Spreizung: Display-Grenze
 *  stage/n zurück in Last (entspreize). */
export function stageTop(load: number, s: ScaleSpec): number {
  const n = stageCount(s);
  const stage = stageOf(load, s);   // 1..n
  if (stage >= n) return 1;
  if (s.borders && s.stops.length >= 2 && s.borders.length === s.stops.length - 1) return s.borders[stage - 1];
  return entspreize(stage / n, s.spreizung);
}

/** Coloursample — das Farb-Pendant zu resampleNet (Wegnetz). Schneidet den
 *  AUTORIERTEN (stetigen) Gradienten in n GLEICH große Last-Felder und gibt jedem
 *  die treffendste Farbe = die Gradient-Farbe in der Feld-MITTE ((i+0.5)/n). Ergebnis
 *  = diskrete n-Feld-Skala: n stops + n−1 gleichmäßige borders, neutrale Spreizung
 *  (die Breiten-Form ist jetzt in den Farben eingefangen). Wrap (Comfort) bleibt.
 *  Gedacht als Bake-at-Publish im Capsuler → das Bundle trägt die fertige Stufen-
 *  Welt, die Runtime liest nur. Funktioniert für beide Autorier-Modi (Spreizung
 *  ODER borders), weil es colorAt sampelt. ann_128, Step 1. */
export function resampleScale(s: ScaleSpec, n = 6): ScaleSpec {
  const N = Math.max(2, Math.floor(n));
  const stops: string[] = [];
  for (let i = 0; i < N; i++) stops.push(colorAt((i + 0.5) / N, s));   // Mitte jedes gleich großen Feldes
  const borders = Array.from({ length: N - 1 }, (_, i) => (i + 1) / N); // gleichmäßige innere Grenzen
  return { stops, borders, spreizung: { mitte: 0.5, oben: 0.5, unten: 0.5 }, verjuengung: s.verjuengung };
}

/** Display-Position 0..1 für eine Last. wrap=true: Comfort-Verjüngung an. */
export function posForLoad(load: number, s: ScaleSpec, useWrap = false): number {
  const base = spreize(load, s.spreizung);
  return useWrap ? wrap(base, s.verjuengung) : base;
}

/** Entzerrung: Display-Position → echte Last (für die Comfort-Schwelle). */
export function loadForPos(pos: number, s: ScaleSpec, useWrap = false): number {
  const base = useWrap ? unwrap(pos, s.verjuengung) : clamp01(pos);
  return entspreize(base, s.spreizung);
}

// Generelle Default-Skala = 6 Stufen, passend zur systemweiten Comfort-Sprache
// (still·ruhig·moderat·flüssig·belebt·voll) und zur Alarm-Logik (stageTop). Farben
// aus dem bestehenden 7-Farb-Comfort-Verlauf destilliert (grün→rot, ohne Magenta),
// damit Mesh, Schauglas und Fallback dieselbe Farbwelt sprechen. Borders gleichmäßig
// (jedes Sechstel) — neutraler Default, per-Rep via Bundle überschreibbar.
export const DEFAULT_SCALE: ScaleSpec = {
  stops: ['#2ecc40', '#a8e63c', '#f1c40f', '#ffaa00', '#ff5500', '#ff0044'],
  borders: [1 / 6, 2 / 6, 3 / 6, 4 / 6, 5 / 6],
  spreizung: { mitte: 0.5, oben: 0.5, unten: 0.5 },
  verjuengung: { unten: 0, oben: 0 },
};
