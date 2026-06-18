import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// FlapGuide — linke Begehungs-Anzeige: Richtung + Meter bis zur nächsten Entscheidung.
// BOXLOSE, STATISCHE Ziffern (kein Klappen — das verträgt sich nicht mit transparentem
// Hintergrund, gibt Geister-Fragmente). Gleiche Inter-Glyphen, gleiche Größe + Position
// wie die ±-Delta-Ziffern, nur ohne Box und farbig nach Nähe (weit = weiß, dann beige/
// gelb/orange, am Abzweig rot). Ohne Einheit/„m". Pfeil = hand-gezeichneter Polarstern-
// Pfeil, als Strich in der Meterfarbe, deutlich größer als die Ziffern.
import { FLAP_DIGITS } from './flapGlyphs';
import { ARROW_GLYPHS } from './arrowGlyphs';
// Stetiger Verlauf über 0–150 m: jeder Meterwert hat seine eigene Farbe (rot am Abzweig
// → orange → gelb → beige → weiß weit weg). Linear im RGB zwischen den Stützstellen.
const METER_STOPS = [
    [0.0, [223, 46, 31]], // rot
    [0.25, [232, 130, 26]], // orange
    [0.5, [236, 194, 31]], // gelb
    [0.75, [221, 206, 160]], // beige
    [1.0, [255, 255, 255]], // weiß
];
function meterColor(m) {
    const t = Math.max(0, Math.min(1, m / 150));
    for (let i = 1; i < METER_STOPS.length; i++) {
        if (t <= METER_STOPS[i][0]) {
            const [t0, c0] = METER_STOPS[i - 1];
            const [t1, c1] = METER_STOPS[i];
            const f = (t1 - t0) ? (t - t0) / (t1 - t0) : 0;
            const c = c0.map((v, k) => Math.round(v + (c1[k] - v) * f));
            return `rgb(${c[0]},${c[1]},${c[2]})`;
        }
    }
    return 'rgb(255,255,255)';
}
function Glyph({ d, advance, h, color }) {
    const w = Math.round((h * 92) / 100);
    const tx = (92 - advance) / 2;
    return (_jsx("svg", { width: w, height: h, viewBox: "0 0 92 102", style: { display: 'block' }, "aria-hidden": true, children: _jsx("path", { d: d, fill: color, transform: `translate(${tx.toFixed(2)},0)` }) }));
}
export default function FlapGuide({ meters, direction = 'left', dockHeight, offRoute }) {
    const m = Math.max(0, Math.round(meters));
    const color = offRoute ? '#df2e1f' : meterColor(m); // off-route → zwingend rot (zurück zum Weg)
    const hM = Math.round(dockHeight * 0.66); // = Größe der ±-Delta-Ziffern
    const dgap = Math.max(2, Math.round(hM * 0.045));
    const gap = Math.max(2, Math.round(hM * 0.06));
    const aSize = Math.round(hM * 1.8); // Pfeil deutlich größer als die Ziffern
    const isH = direction === 'left' || direction === 'right';
    const digitW = Math.round((hM * 92) / 100);
    const slotW = 3 * digitW + 2 * dgap; // IMMER 3-Stellen-Raum (Pfeil fix ganz links)
    return (_jsxs("div", { style: {
            width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', gap,
            filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.45))',
        }, children: [_jsx("svg", { width: aSize, height: aSize, viewBox: "20 20 60 60", "aria-hidden": true, style: { display: 'block', flexShrink: 0, transform: isH ? `translateY(${Math.round((aSize - hM) / 2)}px)` : undefined }, children: _jsx("path", { d: ARROW_GLYPHS[direction], stroke: color, strokeWidth: 8, fill: "none", strokeLinecap: "round", strokeLinejoin: "round" }) }), _jsx("div", { style: { width: slotW, display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', gap: dgap }, children: [...String(m)].map((ch, i) => {
                    const g = FLAP_DIGITS[ch];
                    return g ? _jsx(Glyph, { d: g.d, advance: g.advance, h: hM, color: color }, i) : null;
                }) })] }));
}
