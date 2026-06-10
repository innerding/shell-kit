// poiVisual — die POI-GESTALT (Step 4a, ann_126). Reine Funktion: aus onRoute +
// Last + Comfort (+ optionale Interaktions-Rolle) → WIE das POI auf der Karte
// aussieht: Größe · Deckkraft · Hektik. Das Rendering (Step 4b) malt nur diese
// Zahlen; es ersetzt die flachen Marker. Grundsatz (ann_126): „unattraktiv ≠
// uninteressant" — die UMSTÄNDE (zu voll) degradieren ein POI, nicht es selbst;
// ALLE out-of-comfort POIs zappeln (klein wenn off-route, groß/HEKTISCH wenn auf
// der Route). Der Comfort-Schnitt läuft über `poiBreaches` — die NAHT, in die
// Step 3 (Hysterese/Deadband) später eingesetzt wird, OHNE die Gestalt anzufassen.
import { stageOf } from './scale.js';
const clamp01 = (x) => Math.max(0, Math.min(1, x));
/** Größen-Faktoren der Gestalt (ann_126): degradiert ×1.0 · normal ×1.2 · auf der
 *  Route / hektisch / intaken ×1.6. */
export const POI_SIZE = { degraded: 1.0, normal: 1.2, route: 1.6 };
/** Comfort-Schnitt — die NAHT für Step 3 (Hysterese). HEUTE: nackter Schwellen-
 *  Vergleich, EINE Schwelle, kein Deadband. Step 3 ersetzt NUR diese Funktion
 *  (stateful, Eintritts- ≠ Austritts-Schwelle), ohne poiVisualState anzufassen. */
export function poiBreaches(load, comfort) {
    return load > comfort;
}
/** Hektik-Intensität 0..1 — nur sinnvoll für breaching POIs: je weiter die Last
 *  über Comfort, desto zappeliger (ann_126: „je voller, desto hektischer"). Floor
 *  0.3, damit ein gerade-breaching POI sichtbar zappelt; 1.0 bei Sättigung. */
function hektikOf(load, comfort) {
    const frac = clamp01((load - comfort) / Math.max(1e-4, 1 - comfort));
    return 0.3 + 0.7 * frac;
}
/** Die POI-Gestalt aus Daten + Rolle. Reihenfolge: Interaktions-Rolle (Overlay)
 *  schlägt den Daten-Zustand; sonst on-route vs off-route × breaching. */
export function poiVisualState(inp) {
    const stage = stageOf(inp.load, inp.scale);
    const breaching = poiBreaches(inp.load, inp.comfort);
    switch (inp.role ?? 'normal') {
        case 'candidate': // Alternativ-Kandidat VOR Aktivierung: ×1.2, 50 % Wasserzeichen, ruhig.
            return { size: POI_SIZE.normal, opacity: 0.5, hektik: 0, stage, breaching, kind: 'candidate' };
        case 'intaken': // als Ersatz gewählt: ×1.6, opak, ruhig.
            return { size: POI_SIZE.route, opacity: 1, hektik: 0, stage, breaching, kind: 'intaken' };
        default: break;
    }
    if (inp.onRoute) {
        return breaching
            // HEKTISCH (out-of-comfort, auf Route): ×1.6, opak, zappelt groß.
            ? { size: POI_SIZE.route, opacity: 1, hektik: hektikOf(inp.load, inp.comfort), stage, breaching, kind: 'hektisch' }
            // im Comfort, auf Route: ×1.6, opak, ruhig.
            : { size: POI_SIZE.route, opacity: 1, hektik: 0, stage, breaching, kind: 'route' };
    }
    return breaching
        // degradiert (out-of-comfort, off-route): ×1.0, leicht gedimmt, zappelt klein.
        ? { size: POI_SIZE.degraded, opacity: 0.9, hektik: hektikOf(inp.load, inp.comfort), stage, breaching, kind: 'degraded' }
        // „normal" (im Comfort, off-route): ×1.2, ungedimmt, ruhig.
        : { size: POI_SIZE.normal, opacity: 1, hektik: 0, stage, breaching, kind: 'normal' };
}
