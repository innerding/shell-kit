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
    // Pfeilspitze: zwei Barbs, die am Austritts-Ende zusammentreffen.
    const [b1x, b1y] = at(ex, ey, sw * 1.9, exitAngleRel + 150);
    const [b2x, b2y] = at(ex, ey, sw * 1.9, exitAngleRel - 150);
    const tipPath = `M ${b1x.toFixed(1)} ${b1y.toFixed(1)} L ${ex.toFixed(1)} ${ey.toFixed(1)} L ${b2x.toFixed(1)} ${b2y.toFixed(1)}`;
    return (_jsxs("svg", { width: size, height: size, viewBox: `0 0 ${size} ${size}`, "aria-hidden": true, style: { display: 'block', overflow: 'visible', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.45))' }, children: [p > 0.01 && stubAnglesRel.map((ang, i) => {
                const [x, y] = at(c, c, stubLen * p, ang);
                return _jsx("line", { x1: c, y1: c, x2: x, y2: y, stroke: stubColor, strokeWidth: sw, strokeLinecap: "round", opacity: 0.5 + 0.5 * p }, i);
            }), p > 0.01 && _jsx("line", { x1: c, y1: c, x2: enx, y2: eny, stroke: color, strokeWidth: sw, strokeLinecap: "round" }), _jsx("line", { x1: c, y1: c, x2: ex, y2: ey, stroke: color, strokeWidth: sw, strokeLinecap: "round" }), _jsx("path", { d: tipPath, stroke: color, strokeWidth: sw, strokeLinecap: "round", strokeLinejoin: "round", fill: "none", opacity: tipOpacity })] }));
}
