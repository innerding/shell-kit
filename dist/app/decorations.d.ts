export type DecorationKind = 'elevation' | 'distance' | 'anno' | 'grad' | 'prozent' | 'stars';
export interface IconMeta {
    decoration_below?: DecorationKind;
}
export declare const ICONS_META: Record<string, IconMeta>;
export declare function iconMeta(iconId: string): IconMeta;
export interface DecorationMatch {
    kind: DecorationKind;
    value: number;
    digits: string;
    unit_glyph: string | null;
    unit_position: 'left' | 'right';
}
export declare function extractDecoration(text: string): DecorationMatch | null;
export declare function extractElevation(text: string): number | null;
export interface SummitLayout {
    iconX: number;
    iconY: number;
    iconW: number;
    iconH: number;
    textX: number;
    textY: number;
    textW: number;
    textH: number;
    gap: number;
}
export declare function summitLayout(p: number, iconAspect?: number): SummitLayout;
