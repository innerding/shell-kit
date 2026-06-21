// Colour-Mesh Rendering — EINE Quelle (shell-kit/mesh, Leaflet-abhängig).
//
// Pro 10 m-Segment (Vertex-Pair) eine Polylinie, gefärbt über das Skalen-Modell
// (colorAt + ScaleSpec, OHNE Wrap — der Wrap ist Comfort-exklusiv). lineCap 'round'.
// BCK: Strecken über Comfort (dimmedStretchIds) → ruhiges helles Grau, ohne
// weißen Rand (verschwinden NICHT, zappeln NICHT — das Zappeln gehört an die
// aktive ROUTE, nicht ans Netz). Provisorisch (ann_132-Korrektur).
import L from 'leaflet';
import { colorAt, DEFAULT_SCALE } from './scale';
export function renderColorMesh(layer, net, loads, opts = {}) {
    layer.clearLayers();
    const weight = opts.weight ?? 4;
    const scale = opts.scale ?? DEFAULT_SCALE;
    const hidden = (id) => opts.hiddenStretchIds?.has(id) ?? false;
    const dimmed = (id) => !hidden(id) && (opts.dimmedStretchIds?.has(id) ?? false);
    const corridor = (s) => s.inBoundary === false;
    // Korridor (inBoundary:false = außerhalb der Boundary, kein Lastbild): schlichte
    // graue, gestrichelte Linie — kein Colour-Mesh. In beiden Modi gezeichnet, in den
    // Last-Pässen übersprungen. Grau ~1.2× dunkler als das frühere #9aa5b1.
    for (const s of net.stretches) {
        if (!corridor(s) || s.points.length < 2)
            continue;
        L.polyline(s.points, { color: '#808993', weight: 3, opacity: 0.7, dashArray: '6 5', lineCap: 'round' }).addTo(layer);
    }
    // Einfarbig (Spar-Modus): ein Grau, kein weißer Rand, dünn — sonst nichts.
    if (opts.mono) {
        const mw = Math.max(2, weight - 1);
        for (const s of net.stretches) {
            if (hidden(s.id) || corridor(s))
                continue;
            for (let i = 0; i < s.points.length - 1; i++) {
                L.polyline([s.points[i], s.points[i + 1]], { color: opts.mono, weight: mw, opacity: 0.85, lineCap: 'round' }).addTo(layer);
            }
        }
        return;
    }
    // Pass 1: weißer Rand (Unterlage) — nur für sichtbare, nicht gedimmte Segmente.
    for (const s of net.stretches) {
        if (hidden(s.id) || dimmed(s.id) || corridor(s))
            continue;
        for (let i = 0; i < s.points.length - 1; i++) {
            L.polyline([s.points[i], s.points[i + 1]], { color: '#ffffff', weight: weight + 2, opacity: 1, lineCap: 'round' }).addTo(layer);
        }
    }
    // Pass 2: Last-Farbe oben drauf; statische Sackgassen ausgelassen. Über Comfort
    // (dimmed) → ruhiges helles Grau, dünn, ohne weißen Rand (Pass 1 lässt sie aus):
    // sichtbar, aber zurückhaltend; das Zappeln gehört an die aktive Route.
    let idx = 0;
    for (const s of net.stretches) {
        if (corridor(s))
            continue; // Korridor oben separat (kein Lastbild) — liegt am Netz-Ende, idx bleibt aligned
        const segCount = s.points.length - 1;
        const isHidden = hidden(s.id);
        const isDimmed = dimmed(s.id);
        for (let i = 0; i < segCount; i++) {
            const load = loads[idx++] ?? 0;
            if (isHidden)
                continue;
            L.polyline([s.points[i], s.points[i + 1]], {
                color: isDimmed ? '#c2c9d2' : colorAt(load, scale),
                weight: isDimmed ? 2 : weight,
                opacity: isDimmed ? 0.55 : 1,
                lineCap: 'round',
            }).addTo(layer);
        }
    }
}
