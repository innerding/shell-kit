// Geometrie-Vokabular der Container — stabiles Render-Vokabular der Shell.
// Die Formen (Kreis/Tropfen/Dreieck/Hexagon …) leben hier EINMAL; Editor (Katalog)
// und Runtime lösen `geometry_id` → Form hierüber auf. Die Subkategorie→Geometrie+
// Farbe-ZUORDNUNG bleibt katalogseitig (Origin klassifiziert); hier nur die Formen.

export type GeometryShape =
  | { kind: 'circle';  cx: number; cy: number; r: number }
  | { kind: 'rect';    x: number; y: number; width: number; height: number; rx?: number }
  | { kind: 'polygon'; points: [number, number][] }
  | { kind: 'path';    d: string };

export interface Geometry {
  id: string;
  name_display: string;
  viewBox: string;
  fill_role: 'fill' | 'stroke';
  shape: GeometryShape;
  /** Pixel-Y-Versatz des Icons gegenüber (24,24); Default 0. */
  icon_offset_y?: number;
}

export const GEOMETRIES: Geometry[] = [
  { id: 'geo_1_circle', name_display: 'Kreis', viewBox: '0 0 48 48', fill_role: 'fill',
    shape: { kind: 'circle', cx: 24, cy: 24, r: 18 } },
  { id: 'geo_2_rectangle', name_display: 'Quadrat', viewBox: '0 0 48 48', fill_role: 'fill',
    shape: { kind: 'rect', x: 8, y: 8, width: 32, height: 32, rx: 6 } },
  { id: 'geo_3_droplet', name_display: 'Tropfen', viewBox: '0 0 48 48', fill_role: 'fill',
    shape: { kind: 'path', d: 'M 24 4 C 20 12, 9 22, 9 29 A 15 15 0 0 0 39 29 C 39 22, 28 12, 24 4 Z' },
    icon_offset_y: 5 },
  { id: 'geo_4_rectangle_high', name_display: 'Rechteck hochkant', viewBox: '0 0 48 48', fill_role: 'fill',
    shape: { kind: 'rect', x: 10, y: 4, width: 28, height: 40, rx: 6 } },
  { id: 'geo_5_rectangle_wide', name_display: 'Rechteck quer', viewBox: '0 0 48 48', fill_role: 'fill',
    shape: { kind: 'rect', x: 4, y: 10, width: 40, height: 28, rx: 6 } },
  { id: 'geo_6_triangle', name_display: 'Dreieck', viewBox: '0 0 48 48', fill_role: 'fill',
    shape: { kind: 'polygon', points: [[24, 7], [44, 41], [4, 41]] }, icon_offset_y: 4 },
  { id: 'geo_special_hexagon_ring', name_display: 'Hexagon-Ring', viewBox: '0 0 48 48', fill_role: 'stroke',
    shape: { kind: 'polygon', points: [[24, 3], [43.32, 13.5], [43.32, 34.5], [24, 45], [4.68, 34.5], [4.68, 13.5]] } },
];

export function geometryOf(id: string): Geometry | undefined {
  return GEOMETRIES.find((g) => g.id === id);
}
