/** Font-Stack: Polarstern voran, system-ui als Fallback (Ladephase / fehlende Glyphen). */
export declare const POLARSTERN_STACK = "'Polarstern', system-ui, -apple-system, sans-serif";
/**
 * Polarstern einmal in das Dokument hängen: @font-face je Gewicht (base64-WOFF2) +
 * `--polarstern`-Variable und html/body-Default. Vorhandene font-weight-Angaben
 * wählen automatisch den passenden Schnitt. Idempotent; no-op ohne document (SSR).
 */
export declare function installPolarsternFont(): void;
