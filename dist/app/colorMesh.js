// Colour-Mesh: Netz-Segmente nach Last einfärben (Farbe = Auslastung/Segment).
//
// Generischer Kontrakt (kein Leaflet, kein Anthem, koord-agnostisch):
//  - Eingang: Strecken (id + Punkte [x,y]) + ein Last-Lookup (0..1) je Segment.
//  - „Per-Strecke gleiche Teilung" (kein Kreuzungs-Stub): jede Strecke wird längen-
//    treu in N gleich lange Segmente zerlegt.
//  - Ausgang: Mesh-Segmente (Teil-Polylinie + Last + Farbe) — der Konsument zeichnet.
//
// Größen-Hebel (project_colour_mesh): Geometrie statisch (1×), Last volatil (alle 5 Min).
// Hier nur die Render-Mechanik; die Last reicht der Konsument herein (Anthem oder Sim).
// Die Farbe kommt aus dem einen Colorist (palette/spectrum/bias).
import { colorize } from './colorist';
function lerp(a, b, t) {
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}
/** Längen-treue Teilung einer Polylinie in N gleich lange Stücke. */
function splitPolyline(pts, n) {
    if (n <= 1 || pts.length < 2)
        return [pts];
    const segLen = [];
    let total = 0;
    for (let i = 0; i < pts.length - 1; i++) {
        const d = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
        segLen.push(d);
        total += d;
    }
    if (total === 0)
        return [pts];
    const step = total / n;
    const chunks = [];
    let cur = [pts[0]];
    let acc = 0;
    let target = step;
    for (let i = 0; i < pts.length - 1; i++) {
        const segStart = acc;
        const segEnd = acc + segLen[i];
        while (target < segEnd - 1e-12 && chunks.length < n - 1) {
            const t = (target - segStart) / segLen[i];
            const p = lerp(pts[i], pts[i + 1], t);
            cur.push(p);
            chunks.push(cur);
            cur = [p];
            target += step;
        }
        cur.push(pts[i + 1]);
        acc = segEnd;
    }
    chunks.push(cur);
    return chunks;
}
export function buildColorMesh(stretches, load, opts = {}) {
    const n = Math.max(1, opts.segmentsPerStretch ?? 5);
    const out = [];
    for (const s of stretches) {
        if (!s.points || s.points.length < 2)
            continue;
        const chunks = splitPolyline(s.points, n);
        chunks.forEach((points, index) => {
            const l = Math.max(0, Math.min(1, load(s.id, index, chunks.length)));
            out.push({ stretchId: s.id, index, points, load: l, color: colorize(l, opts.colour) });
        });
    }
    return out;
}
