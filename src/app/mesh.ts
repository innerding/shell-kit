// Colour-Mesh Rendering — EINE Quelle (shell-kit/mesh, Leaflet-abhängig).
//
// Pro 10 m-Segment (Vertex-Pair) eine Polylinie, gefärbt über das Skalen-Modell
// (colorAt + ScaleSpec, OHNE Wrap — der Wrap ist Comfort-exklusiv). lineCap 'round'.
// BCK-Dimming über dimmedStretchIds (Ø-Last der Strecke > Comfort-Schwelle).
import L from 'leaflet';
import { colorAt, DEFAULT_SCALE, type ScaleSpec } from './scale';
import { stretchAverages, type SegmentedNet } from './anthem';

export function renderColorMesh(
  layer: L.LayerGroup,
  net: SegmentedNet,
  loads: number[],
  opts: {
    scale?: ScaleSpec;
    weight?: number;
    dimmedStretchIds?: Set<string>;
    /** Statische Sackgassen — komplett unsichtbar (nicht gerendert). */
    hiddenStretchIds?: Set<string>;
  } = {},
): void {
  layer.clearLayers();
  const weight = opts.weight ?? 4;
  const scale = opts.scale ?? DEFAULT_SCALE;
  const hidden = (id: string) => opts.hiddenStretchIds?.has(id) ?? false;
  const dimmed = (id: string) => !hidden(id) && (opts.dimmedStretchIds?.has(id) ?? false);

  // Pass 1: weißer Rand (Unterlage) — nur für sichtbare, nicht gedimmte Segmente.
  for (const s of net.stretches) {
    if (hidden(s.id) || dimmed(s.id)) continue;
    for (let i = 0; i < s.points.length - 1; i++) {
      L.polyline(
        [s.points[i], s.points[i + 1]] as L.LatLngExpression[],
        { color: '#ffffff', weight: weight + 2, opacity: 1, lineCap: 'round' },
      ).addTo(layer);
    }
  }

  // Pass 2: Farbe (oder Dimm-Grau) oben drauf; statische Sackgassen ausgelassen.
  let idx = 0;
  for (const s of net.stretches) {
    const segCount = s.points.length - 1;
    const isHidden = hidden(s.id);
    const isDimmed = dimmed(s.id);
    for (let i = 0; i < segCount; i++) {
      const load = loads[idx++] ?? 0;
      if (isHidden) continue;
      L.polyline(
        [s.points[i], s.points[i + 1]] as L.LatLngExpression[],
        {
          color:   isDimmed ? '#7a8699' : colorAt(load, scale),
          weight:  isDimmed ? 2 : weight,
          opacity: isDimmed ? 0.12 : 1,
          lineCap: 'round',
        },
      ).addTo(layer);
    }
  }
}
