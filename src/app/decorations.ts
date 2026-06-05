// Deco-Typen (nur Typ, keine Logik) — die Composite-Summit-Leiste (Höhe „927 m",
// Baujahr „A° 1702", Sterne …). Die Erkennung (extractDecoration) lebt editorseitig
// und reicht ein DecorationMatch herein; die Runtime reicht heute null.

export type DecorationKind = 'elevation' | 'distance' | 'anno' | 'grad' | 'prozent' | 'stars';

export interface DecorationMatch {
  kind: DecorationKind;
  value: number;
  digits: string;
  unit_glyph: string | null;
  unit_position: 'left' | 'right';
}
