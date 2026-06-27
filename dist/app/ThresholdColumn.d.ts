export interface ThresholdColumnSettings {
    /** 2–6 Farb-Felder (grün→rot, unten→oben). */
    stops: string[];
    /** N−1 innere Feldgrenzen (Load 0..1, sortiert) — die Grenzen sind die Wahrheit. */
    borders: number[];
    /** Zentriert gehaltenes Mittelfeld (Index) oder null/undefined. */
    middleField?: number | null;
}
export declare function evenBorders(n: number): number[];
export default function ThresholdColumn({ title, settings, onChange, onReset, resetLabel, dimmed, editable }: {
    title: string;
    settings: ThresholdColumnSettings;
    onChange: (patch: Partial<ThresholdColumnSettings>) => void;
    onReset?: () => void;
    resetLabel?: string;
    dimmed?: boolean;
    editable?: 'full' | 'borders';
}): import("react").JSX.Element;
