import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// Punkt im Abstand `len` unter Winkel `deg` (0 = oben, im Uhrzeigersinn) ab (cx,cy).
function at(cx, cy, len, deg) {
    const a = (deg * Math.PI) / 180;
    return [cx + len * Math.sin(a), cy - len * Math.cos(a)];
}
export default function CrossingRose({ state, size = 56 }) {
    // Route (Eintritt + Austritt) = Meter-Farbe (an der Kreuzung rot); die anderen Arme
    // = fester Gelbton (restColor). Spitze nur am Austritt.
    const { p, entryAngleRel, exitAngleRel, stubAnglesRel, tipOpacity, exitColor: color, restColor: stubColor } = state;
    const c = size / 2;
    const full = size * 0.42; // Arm-Länge
    const stubLen = full * (2 / 3); // andere Arme: 2/3
    const sw = Math.max(2, size * 0.11); // Strichstärke
    const [ex, ey] = at(c, c, full, exitAngleRel); // Austritts-Ende (Spitze)
    const [enx, eny] = at(c, c, full * p, entryAngleRel); // Eintritts-Ende (wächst mit p)
    // Pfeilspitze: gefülltes Dreieck am Austritts-Ende — klar als Spitze lesbar (≈ f0.66).
    const headLen = sw * 1.6, headW = sw * 1.0;
    const [bcx, bcy] = at(ex, ey, headLen, exitAngleRel + 180); // Basis-Mitte (zurück)
    const [t1x, t1y] = at(bcx, bcy, headW, exitAngleRel + 90);
    const [t2x, t2y] = at(bcx, bcy, headW, exitAngleRel - 90);
    const tipPath = `M ${ex.toFixed(1)} ${ey.toFixed(1)} L ${t1x.toFixed(1)} ${t1y.toFixed(1)} L ${t2x.toFixed(1)} ${t2y.toFixed(1)} Z`;
    return (_jsxs("svg", { width: size, height: size, viewBox: `0 0 ${size} ${size}`, "aria-hidden": true, style: { display: 'block', overflow: 'visible', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.45))' }, children: [p > 0.01 && stubAnglesRel.map((ang, i) => {
                const [x, y] = at(c, c, stubLen * p, ang);
                return _jsx("line", { x1: c, y1: c, x2: x, y2: y, stroke: stubColor, strokeWidth: sw, strokeLinecap: "round", opacity: 0.5 + 0.5 * p }, i);
            }), p > 0.01 && _jsx("line", { x1: c, y1: c, x2: enx, y2: eny, stroke: color, strokeWidth: sw, strokeLinecap: "round" }), _jsx("line", { x1: c, y1: c, x2: bcx, y2: bcy, stroke: color, strokeWidth: sw, strokeLinecap: "round" }), _jsx("path", { d: tipPath, fill: color, stroke: color, strokeWidth: sw * 0.55, strokeLinejoin: "round", strokeLinecap: "round", opacity: tipOpacity })] }));
}
