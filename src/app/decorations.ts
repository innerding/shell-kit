// Decoration-System — EINE Quelle (shell-kit). Editor + Runtime teilen Logik.
// Editor-`decorations.ts` ist nur noch ein Re-Export-Shim.
//
// Eine Decoration ist ein Zusatzelement auf dem POI-Composite (Höhe, Baujahr,
// Sterne …). Erkennungslogik: extractDecoration(text) → DecorationMatch | null.

export type DecorationKind = 'elevation' | 'distance' | 'anno' | 'grad' | 'prozent' | 'stars';

export interface IconMeta {
  decoration_below?: DecorationKind;
}

export const ICONS_META: Record<string, IconMeta> = {
  aussichtspunkt: { decoration_below: 'elevation' },
};

export function iconMeta(iconId: string): IconMeta {
  return ICONS_META[iconId] ?? {};
}

export interface DecorationMatch {
  kind: DecorationKind;
  value: number;
  digits: string;
  unit_glyph: string | null;
  unit_position: 'left' | 'right';
}

const PATTERNS: Array<{
  kind: DecorationKind;
  re: RegExp;
  group_value: number;
  digits_from?: (m: RegExpMatchArray) => string;
  unit_glyph: string | null;
  unit_position: 'left' | 'right';
}> = [
  { kind: 'anno', re: /\b(?:[Aa](?:[°·º]|\.)\s*|[Ss]eit\s+)(\d{3,4})\b/, group_value: 1, unit_glyph: 'anno', unit_position: 'left' },
  { kind: 'distance', re: /\b(\d{1,3})\s*km\b/, group_value: 1, unit_glyph: 'kilometer', unit_position: 'right' },
  { kind: 'elevation', re: /\b(\d{2,5})\s*m\b/, group_value: 1, unit_glyph: 'meter', unit_position: 'right' },
  { kind: 'prozent', re: /\b(\d{1,3})\s*%/, group_value: 1, unit_glyph: 'prozent', unit_position: 'right' },
  { kind: 'grad', re: /\b(\d{1,2})\s*°/, group_value: 1, unit_glyph: 'grad', unit_position: 'right' },
  { kind: 'stars', re: /\b(\d)[\s-]*Stern[e]?\b/, group_value: 1, unit_glyph: 'stern', unit_position: 'right' },
  {
    kind: 'stars', re: /(\d)\s*★|(★+)/, group_value: 0,
    digits_from: (m) => m[1] ? m[1] : String((m[2] ?? '').length),
    unit_glyph: 'star-5', unit_position: 'right',
  },
];

export function extractDecoration(text: string): DecorationMatch | null {
  for (const p of PATTERNS) {
    const m = text.match(p.re);
    if (!m) continue;
    let digits: string;
    let value: number;
    if (p.digits_from) {
      digits = p.digits_from(m);
      value = parseInt(digits, 10);
    } else {
      digits = m[p.group_value];
      value = parseInt(digits, 10);
    }
    if (!Number.isFinite(value)) continue;
    return { kind: p.kind, value, digits, unit_glyph: p.unit_glyph, unit_position: p.unit_position };
  }
  return null;
}

export function extractElevation(text: string): number | null {
  const d = extractDecoration(text);
  return d && d.kind === 'elevation' ? d.value : null;
}

export interface SummitLayout {
  iconX: number; iconY: number; iconW: number; iconH: number;
  textX: number; textY: number; textW: number; textH: number;
  gap: number;
}

export function summitLayout(p: number, iconAspect = 2 / 3): SummitLayout {
  const W_i = 48 - 2 * p;
  const H_i = W_i * iconAspect;
  const gap = p / 2;
  const H_t = 48 - 5 * p / 2 - H_i;
  return {
    iconX: p, iconY: p, iconW: W_i, iconH: H_i,
    textX: p, textY: 48 - p - H_t, textW: W_i, textH: H_t,
    gap,
  };
}
