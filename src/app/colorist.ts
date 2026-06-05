// Colorist — die eine Farbwahrheit: Last (0..1) → Farbe. `colour = G(load)`.
// Rein (kein Leaflet/DOM), damit Sim, Tests, Editor und Runtime sie ohne UI teilen.
// EINE Quelle (shell-kit) — der Editor-`loadColour.ts` ist nur noch ein Re-Export-Shim.
//
// Drei DURCHGEHENDE Palette-Modelle (nie geschnitten). Default: green_violet.

type Stops = Array<{ at: number; color: [number, number, number] }>;

const HEAT: Stops = [
  { at: 0.0, color: [30, 58, 95] },     // #1e3a5f — deep navy
  { at: 0.25, color: [0, 153, 255] },   // #0099ff — electric blue
  { at: 0.5, color: [0, 212, 170] },    // #00d4aa — cyan-teal
  { at: 0.75, color: [192, 132, 252] }, // #c084fc — lavender
  { at: 1.0, color: [236, 72, 153] },   // #ec4899 — magenta
];

// p10-Farben, durchgehend: grün (ruhig) → … → violett (busy).
const GREEN_VIOLET: Stops = [
  { at: 0.0, color: [46, 204, 64] },    // #2ecc40 — grün
  { at: 0.25, color: [168, 224, 0] },   // #a8e000 — gelbgrün
  { at: 0.5, color: [255, 212, 0] },    // #ffd400 — gelb
  { at: 0.7, color: [255, 123, 0] },    // #ff7b00 — orange
  { at: 0.85, color: [255, 45, 45] },   // #ff2d2d — rot
  { at: 1.0, color: [142, 36, 170] },   // #8e24aa — violett
];

// Dezent / niedrig gesättigt.
const CALM: Stops = [
  { at: 0.0, color: [74, 111, 165] },   // #4a6fa5 — gedämpftes blau
  { at: 0.5, color: [126, 138, 160] },  // #7e8aa0 — graublau
  { at: 1.0, color: [176, 106, 122] },  // #b06a7a — gedämpftes rosé
];

export type PaletteId = 'heat' | 'green_violet' | 'calm';

export const PALETTES: Record<PaletteId, { label: string; stops: Stops }> = {
  green_violet: { label: 'Grün→Violett', stops: GREEN_VIOLET },
  heat: { label: 'Heat', stops: HEAT },
  calm: { label: 'Ruhig', stops: CALM },
};

export const DEFAULT_PALETTE: PaletteId = 'green_violet';

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

function rampColor(stops: Stops, t: number): string {
  const u = clamp01(t);
  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i], b = stops[i + 1];
    if (u <= b.at) {
      const f = (u - a.at) / (b.at - a.at || 1);
      return `rgb(${Math.round(lerp(a.color[0], b.color[0], f))},${Math.round(lerp(a.color[1], b.color[1], f))},${Math.round(lerp(a.color[2], b.color[2], f))})`;
    }
  }
  const last = stops[stops.length - 1].color;
  return `rgb(${last[0]},${last[1]},${last[2]})`;
}

// heatColor bleibt (HEAT-Palette) — rückwärtskompatibel für colourMeshOverlay.
export function heatColor(t: number): string {
  return rampColor(HEAT, t);
}

// Parametrisierter Colorist. Beugt die Last STETIG und mappt sie auf die Palette:
//   - palette:  Palette-Modell (Default green_violet)
//   - spectrum ∈ [0,1]: 0 ruhig (langsam heiß) · 0.5 linear · 1 aggressiv
//   - bias     ∈ [−1,1]: regionale Tendenz, kühler/heißer
export interface ColorizeParams {
  palette?: PaletteId;
  spectrum?: number;
  bias?: number;
}

// Beugt nur die Last (gibt 0..1 zurück) — getrennt von der Farbe, damit
// System-Normalisierung darauf aufsetzen kann.
export function shapeLoad(load: number, params: ColorizeParams = {}): number {
  const spectrum = params.spectrum ?? 0.5;
  const bias = params.bias ?? 0;
  const gamma = Math.pow(2, 1 - 2 * clamp01(spectrum));
  const v = Math.pow(clamp01(load), gamma);
  return clamp01(v + bias * 0.5);
}

export function colorize(load: number, params: ColorizeParams = {}): string {
  const stops = (PALETTES[params.palette ?? DEFAULT_PALETTE] ?? PALETTES[DEFAULT_PALETTE]).stops;
  return rampColor(stops, shapeLoad(load, params));
}
