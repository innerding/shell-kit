// Skalen-Modell — EINE Quelle für alle Schieber-Oberflächen (Comfort · Mesh · P01).
// Die Oberflächen sind Kopien DIESES Modells.
//
// Eine Skala = Farb-Stops (2–6) + Spreizung (Verteilung) + Verjüngung (Wrap, nur Anzeige).
//
//   colorAt(load)           → Farbe (Mesh + Slider-Basis; OHNE Wrap)
//   posForLoad(load, wrap)  → Position 0..1 auf dem Schieber
//   loadForPos(pos, wrap)   → Entzerrung (Position → echte Last)
//
// Alle Abbildungen monoton + invertierbar (Tests prüfen das). Die Kurven-Stärke ist
// über zwei Konstanten tunebar (HET_STRENGTH, VJ_STRENGTH) — die Feinheit stimmen wir
// an der Oberfläche ab; die STRUKTUR (Pivot=mitte, Enden via het, Wrap getrennt) steht.
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
// Tunebar: wie stark het/Verjüngung wirken (param 0..1 → Kurven-Exponent).
const HET_STRENGTH = 0.7; // het 1 → Exponent 0.3 (Enden stark gespreizt)
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
// ── Spreizung: Last → Display-Position (Verteilung) ──────────────────────────
// Pivot mitte → 0.5. het spreizt das jeweilige Ende (Exponent < 1 = mehr Spread).
const gHet = (het) => 1 - HET_STRENGTH * clamp01(het);
export function spreize(load, sp) {
    const m = clamp(sp.mitte, 0.02, 0.98);
    const l = clamp01(load);
    if (l <= m) {
        const lo = l / m; // 0..1 unterer Teil
        return 0.5 * Math.pow(lo, gHet(sp.untenHet));
    }
    const hi = (l - m) / (1 - m); // 0..1 oberer Teil
    return 0.5 + 0.5 * (1 - Math.pow(1 - hi, gHet(sp.obenHet)));
}
export function entspreize(disp, sp) {
    const m = clamp(sp.mitte, 0.02, 0.98);
    const d = clamp01(disp);
    if (d <= 0.5) {
        const lo = Math.pow(d / 0.5, 1 / gHet(sp.untenHet));
        return lo * m;
    }
    const hi = 1 - Math.pow(1 - (d - 0.5) / 0.5, 1 / gHet(sp.obenHet));
    return m + hi * (1 - m);
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
/** Default-Skala: grün→gelb→rot, neutrale Spreizung/Verjüngung. */
export const DEFAULT_SCALE = {
    stops: ['#2ecc40', '#ffd400', '#ff2d2d'],
    spreizung: { mitte: 0.5, obenHet: 0, untenHet: 0 },
    verjuengung: { unten: 0, oben: 0 },
};
