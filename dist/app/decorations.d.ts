export type DecorationKind = 'elevation' | 'distance' | 'anno' | 'grad' | 'prozent' | 'stars';
export interface DecorationMatch {
    kind: DecorationKind;
    value: number;
    digits: string;
    unit_glyph: string | null;
    unit_position: 'left' | 'right';
}
