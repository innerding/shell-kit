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
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
// Wrap-Stärke (Comfort-Verjüngung): param 0..1 → Kurven-Exponent.
const VJ_STRENGTH = 3; // verjüngung 1 → Exponent 4 (Enden stark gestaucht)
// ── Farben ──────────────────────────────────────────────────────────────────
function parseRGB(c) {
    const s = c.trim();
    if (s.startsWith('#')) {
        const h = s.slice(1);
        const f = h.length === 3 ? h.split('').map((x) => x + x).join('') : h;
        return [parseInt(f.slice(0, 2), 16), parseInt(f.slice(2, 4), 16), parseInt(f.slice(4, 6), 16)];
    }
    const m = s.match(/rgba?\(([^)]+)\)/);
    if (m) {
        const p = m[1].split(',').map((x) => parseFloat(x));
        return [p[0], p[1], p[2]];
    }
    return [0, 0, 0];
}
const lerp = (a, b, t) => a + (b - a) * t;
/** Farbe an Position t∈[0,1] über die Stops (lineare RGB-Interpolation). */
export function colorFromStops(stops, t) {
    if (stops.length === 0)
        return 'rgb(0,0,0)';
    if (stops.length === 1)
        return stops[0];
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
function loadStops(sp) {
    const mitte = clamp(sp.mitte, 0.04, 0.96);
    const unten = clamp(clamp01(sp.unten) * mitte, EPS, mitte - EPS);
    const oben = clamp(mitte + clamp01(sp.oben) * (1 - mitte), mitte + EPS, 1 - EPS);
    return [0, unten, mitte, oben, 1];
}
/** Stückweise-lineare Abbildung x→y über sortierte Stützstellen. */
function pwl(x, xs, ys) {
    if (x <= xs[0])
        return ys[0];
    for (let i = 0; i < xs.length - 1; i++) {
        if (x <= xs[i + 1]) {
            const t = (x - xs[i]) / (xs[i + 1] - xs[i]);
            return ys[i] + t * (ys[i + 1] - ys[i]);
        }
    }
    return ys[ys.length - 1];
}
export function spreize(load, sp) {
    return pwl(clamp01(load), loadStops(sp), DISP);
}
export function entspreize(disp, sp) {
    return pwl(clamp01(disp), DISP, loadStops(sp));
}
// ── Verjüngung (Wrap): Display-Position → gestauchte Anzeige (nur Comfort) ────
const aVj = (vj) => 1 + VJ_STRENGTH * clamp01(vj);
function wrap(pos, vj) {
    const p = clamp01(pos);
    if (p <= 0.5)
        return 0.5 * Math.pow(p / 0.5, aVj(vj.unten));
    return 1 - 0.5 * Math.pow((1 - p) / 0.5, aVj(vj.oben));
}
function unwrap(disp, vj) {
    const d = clamp01(disp);
    if (d <= 0.5)
        return 0.5 * Math.pow(d / 0.5, 1 / aVj(vj.unten));
    return 1 - 0.5 * Math.pow((1 - d) / 0.5, 1 / aVj(vj.oben));
}
// ── Öffentliche API ──────────────────────────────────────────────────────────
/** Farbe für eine Last (Mesh + Slider-Basis) — folgt der Spreizung, OHNE Wrap. */
export function colorAt(load, s) {
    return colorFromStops(s.stops, spreize(load, s.spreizung));
}
/** Display-Position 0..1 für eine Last. wrap=true: Comfort-Verjüngung an. */
export function posForLoad(load, s, useWrap = false) {
    const base = spreize(load, s.spreizung);
    return useWrap ? wrap(base, s.verjuengung) : base;
}
/** Entzerrung: Display-Position → echte Last (für die Comfort-Schwelle). */
export function loadForPos(pos, s, useWrap = false) {
    const base = useWrap ? unwrap(pos, s.verjuengung) : clamp01(pos);
    return entspreize(base, s.spreizung);
}
/** Default-Skala: grün→gelb→rot, lineare Verteilung (Mitte 0.5, Anteile neutral 0.5), kein Wrap. */
export const DEFAULT_SCALE = {
    stops: ['#2ecc40', '#ffd400', '#ff2d2d'],
    spreizung: { mitte: 0.5, oben: 0.5, unten: 0.5 },
    verjuengung: { unten: 0, oben: 0 },
};
