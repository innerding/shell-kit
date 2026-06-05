// Colour-Mesh Rendering — EINE Quelle (shell-kit/mesh, Leaflet-abhängig).
//
// Prinzip: EINE Polylinie je Strecke (= Linie zwischen zwei Kreuzungsnodes),
// gefärbt mit der Ø-Last der Strecke. Kreuzungsnodes schneiden HART ab.
//
//   lineCap  'butt'  — kein Überstand an Streckenenden (= Kreuzungsnodes).
//                      Segmente angrenzender Strecken mischen sich NICHT.
//   lineJoin 'round' — weiche Knie innerhalb der Strecke.
//
// Warum nicht pro 10 m-Segment? Würden alle Segment-Endpunkte (auch
// Kreuzungsnodes) mit round-Kappen gerendert, verschmilzt das Colour-Mesh
// über das ganze Netz. Pro-Strecke-Polyline + butt-Enden ist die saubere Lösung.
//
// BCK-Dimming: Strecken in `dimmedStretchIds` werden grau/transparent gezeichnet
// (= außerhalb des User-Comforts, aus dem verfügbaren Netz entdrängt).
import L from 'leaflet';
import { colorize } from './colorist';
import { stretchAverages } from './anthem';
export function renderColorMesh(layer, net, loads, opts = {}) {
    layer.clearLayers();
    const weight = opts.weight ?? 4;
    const avgById = new Map(stretchAverages(net, loads).map((a) => [a.id, a.average]));
    for (const s of net.stretches) {
        if (s.points.length < 2)
            continue;
        const avg = avgById.get(s.id) ?? 0;
        const dimmed = opts.dimmedStretchIds?.has(s.id) ?? false;
        L.polyline(s.points, {
            color: dimmed ? '#7a8699' : colorize(avg, opts.colour),
            weight: dimmed ? 2 : weight,
            opacity: dimmed ? 0.12 : 1,
            lineCap: 'butt', // Kreuzungsnode = harter Schnitt, kein Überstand
            lineJoin: 'round', // Knie innerhalb der Strecke = weich
        }).addTo(layer);
    }
}
