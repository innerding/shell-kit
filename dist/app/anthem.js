// Anthem — die reine Last-Mathematik (Sim-Telco + Deutung + Tageskurve). EINE Quelle:
// Editor (Coder/Studio) UND Runtime teilen sie. Kein DOM/Leaflet/Snapshot-Encoding —
// die Verpackung in einen AnthemSnapshot (Worker-Format) bleibt im Editor.
//
// Kette: simSegmentLoads (Sim-Telco) → normalizeLoads (deuten, spread/floor) →
// Tageskurve (dayPhase, 5-Min-Atem). `produceAnthemLoads` = die loads-only-Variante,
// die die Runtime fürs Mesh braucht (ein Last-Wert je 10 m-Segment).
export { heatColor as loadColour } from './colorist';
const clamp01 = (x) => Math.max(0, Math.min(1, x));
// Glattes, deterministisches Last-Feld am Segment-Mittelpunkt.
function fieldAt(lat, lng) {
    const a = Math.sin(lat * 300) * Math.cos(lng * 300); // Hauptmuster
    const b = Math.sin((lat - lng) * 220); // Diagonal-Schwebung
    return clamp01(0.5 + 0.5 * (0.6 * a + 0.4 * b));
}
// Ein Last-Wert (0..1) je Segment, in Strecken-/Segment-Reihenfolge des Netzes
// (dieselbe Reihenfolge, in der man die Segmente zeichnet/indexiert).
export function simSegmentLoads(net) {
    const loads = [];
    for (const s of net.stretches) {
        for (let i = 1; i < s.points.length; i++) {
            const a = s.points[i - 1], b = s.points[i];
            loads.push(fieldAt((a[0] + b[0]) / 2, (a[1] + b[1]) / 2));
        }
    }
    return loads;
}
// Ø-Last je Strecke (zwischen Kreuzungsknoten). `loads` MUSS vom selben Netz stammen
// (gleiche Strecken-/Segment-Reihenfolge wie simSegmentLoads).
export function stretchAverages(net, loads) {
    const out = [];
    let idx = 0;
    for (const s of net.stretches) {
        const segs = Math.max(0, s.points.length - 1);
        let sum = 0;
        for (let i = 0; i < segs; i++)
            sum += loads[idx++] ?? 0;
        out.push({ id: s.id, average: segs > 0 ? sum / segs : 0, segmentCount: segs });
    }
    return out;
}
// System-Normalisierung — macht die Anzeige aussagekräftig, ohne die Daten zu ändern.
//   - spread: blendet zwischen roher Last und min/max-Normalisierung (1 = jede Rep
//     spannt ihren eigenen Bereich kalt→heiß; relativ statt absolut).
//   - floor (Mindest-Rot): hat das Netz genug Last (Peak ≥ minPartial), wird die
//     Verteilung so angehoben, dass der Peak mindestens `floor` erreicht.
export function normalizeLoads(loads, params = {}) {
    if (loads.length === 0)
        return [];
    const spread = clamp01(params.spread ?? 0);
    const floor = clamp01(params.floor ?? 0);
    const minPartial = params.minPartial ?? 0.05;
    let min = Infinity, max = -Infinity;
    for (const l of loads) {
        if (l < min)
            min = l;
        if (l > max)
            max = l;
    }
    const range = max - min;
    const out = loads.map((l) => {
        const norm = range > 0 ? (l - min) / range : l;
        return clamp01(l + (norm - l) * spread);
    });
    if (floor > 0 && max >= minPartial) {
        let curMax = 0;
        for (const v of out)
            if (v > curMax)
                curMax = v;
        if (curMax > 0 && curMax < floor) {
            const lift = floor / curMax;
            return out.map((v) => clamp01(v * lift));
        }
    }
    return out;
}
// Klassifiziert je STRECKE über die Ø-Last (crossing-gated). Ausschluss schlägt
// Degradierung. Das ist die ENTSCHEIDUNG, nicht der Gradient (der bleibt stetig).
export function classifyStretches(stretches, params = {}) {
    const deg = params.degradier;
    const exc = params.ausschluss;
    return stretches.map((s) => {
        let state = 'normal';
        if (exc != null && s.average >= exc)
            state = 'excluded';
        else if (deg != null && s.average >= deg)
            state = 'degraded';
        return { id: s.id, average: s.average, state };
    });
}
// Tageskurve 6–20 h: die Last „atmet" mit der Sim-Zeit (0 nachts → 1 mittags, Peak 13:00).
// Deterministisch → Editor, Worker und Runtime rechnen denselben Wert.
export function dayPhase(simMin) {
    const h = Math.min(20, Math.max(6, simMin / 60));
    return Math.sin(((h - 6) / 14) * Math.PI);
}
// loads-only-Produktion für die Runtime/Mesh: ein Last-Wert je 10 m-Segment,
// genormt (spread/floor) und über die Tageskurve moduliert. = produceAnthem ohne
// Snapshot-Encoding (das bleibt im Editor/Worker).
export function produceAnthemLoads(net, simMin, norm = {}) {
    const base = normalizeLoads(simSegmentLoads(net), norm);
    const phase = dayPhase(simMin);
    return base.map((l) => clamp01(l * (0.35 + 0.65 * phase)));
}
