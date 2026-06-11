// Colour-Mesh Rendering — EINE Quelle (shell-kit/mesh, Leaflet-abhängig).
//
// Pro 10 m-Segment (Vertex-Pair) eine Polylinie, gefärbt über das Skalen-Modell
// (colorAt + ScaleSpec, OHNE Wrap — der Wrap ist Comfort-exklusiv). lineCap 'round'.
// BCK: Strecken über Comfort (dimmedStretchIds) behalten ihre Last-Farbe und
// PULSIEREN nervös (Step 2, ann_132) — sie verschwinden nicht mehr.
import L from 'leaflet';
import { colorAt, DEFAULT_SCALE } from './scale';
export function renderColorMesh(layer, net, loads, opts = {}) {
    layer.clearLayers();
    const weight = opts.weight ?? 4;
    const scale = opts.scale ?? DEFAULT_SCALE;
    const hidden = (id) => opts.hiddenStretchIds?.has(id) ?? false;
    const dimmed = (id) => !hidden(id) && (opts.dimmedStretchIds?.has(id) ?? false);
    // Pass 1: weißer Rand (Unterlage) — nur für sichtbare, nicht gedimmte Segmente.
    for (const s of net.stretches) {
        if (hidden(s.id) || dimmed(s.id))
            continue;
        for (let i = 0; i < s.points.length - 1; i++) {
            L.polyline([s.points[i], s.points[i + 1]], { color: '#ffffff', weight: weight + 2, opacity: 1, lineCap: 'round' }).addTo(layer);
        }
    }
    // Pass 2: Last-Farbe oben drauf; statische Sackgassen ausgelassen. Über Comfort
    // (dimmed) → KEINE Ausblendung mehr (Step 2, ann_132): das Segment behält seine
    // Last-Farbe und PULSIERT nervös („nervös = Problem"). Der Keyframe `scim-seg-pulse`
    // + die Phasen-Versatz-Klassen werden runtime-seitig injiziert (className-Vertrag);
    // der idx-basierte Versatz desynchronisiert → Schimmern statt gleichtaktiges Atmen.
    let idx = 0;
    for (const s of net.stretches) {
        const segCount = s.points.length - 1;
        const isHidden = hidden(s.id);
        const isDimmed = dimmed(s.id);
        for (let i = 0; i < segCount; i++) {
            const load = loads[idx] ?? 0;
            const segIdx = idx;
            idx++;
            if (isHidden)
                continue;
            L.polyline([s.points[i], s.points[i + 1]], {
                color: colorAt(load, scale),
                weight,
                opacity: 1,
                lineCap: 'round',
                className: isDimmed ? `scim-seg scim-seg-d${segIdx % 4}` : '',
            }).addTo(layer);
        }
    }
}
