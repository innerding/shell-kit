// Colour-Mesh Rendering — EINE Quelle (shell-kit/mesh, Leaflet-abhängig).
//
// Pro 10 m-Segment (Vertex-Pair) eine Polylinie, gefärbt mit dem individuellen
// Lastwert. lineCap 'butt' überall → kein Überstand, keine Crossing-Blends.
// BCK-Dimming über dimmedStretchIds (Ø-Last der Strecke > Comfort-Schwelle).
import L from 'leaflet';
import { colorize } from './colorist';
import { stretchAverages } from './anthem';
export function renderColorMesh(layer, net, loads, opts = {}) {
    layer.clearLayers();
    const weight = opts.weight ?? 4;
    // BCK: Ø-Last je Strecke für Dimm-Entscheidung.
    const avgById = new Map(stretchAverages(net, loads).map((a) => [a.id, a.average]));
    let idx = 0;
    for (const s of net.stretches) {
        const segCount = s.points.length - 1;
        const dimmed = opts.dimmedStretchIds?.has(s.id) ?? false;
        for (let i = 0; i < segCount; i++) {
            const load = loads[idx++] ?? 0;
            L.polyline([s.points[i], s.points[i + 1]], {
                color: dimmed ? '#7a8699' : colorize(load, opts.colour),
                weight: dimmed ? 2 : weight,
                opacity: dimmed ? 0.12 : 1,
                lineCap: 'round',
            }).addTo(layer);
        }
    }
}
