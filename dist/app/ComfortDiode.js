import { jsx as _jsx } from "react/jsx-runtime";
// Lesbare Textfarbe auf der Box (einfache Luminanz).
function readable(hex) {
    const h = hex.replace('#', '');
    const n = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
    const r = parseInt(n.slice(0, 2), 16), g = parseInt(n.slice(2, 4), 16), b = parseInt(n.slice(4, 6), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) > 150 ? '#14223e' : '#fff';
}
// Keyframes einmal ins Dokument (Glow via --glow-Variable, Text-Opacity getrennt).
let injected = false;
function ensureDiodeStyle() {
    if (typeof document === 'undefined' || injected)
        return;
    injected = true;
    if (document.getElementById('scim-diode-style'))
        return;
    const el = document.createElement('style');
    el.id = 'scim-diode-style';
    el.textContent =
        '@keyframes scim-diode-glow{0%,100%{box-shadow:0 0 0 0 transparent}50%{box-shadow:0 0 14px 3px var(--glow)}}' +
            '@keyframes scim-diode-text{0%,100%{opacity:1}50%{opacity:0.22}}';
    document.head.appendChild(el);
}
export default function ComfortDiode({ color, word, intensity, textColor, size = 'md' }) {
    ensureDiodeStyle();
    const fg = textColor ?? readable(color);
    const i = Math.max(0, Math.min(1, intensity));
    const pulsing = i > 0;
    const dur = (1.4 - 0.9 * i).toFixed(2);
    // Echte Pill: volle runde Kappen (Halbschalen links/rechts) + kompakter (~f0.9),
    // Schrift bleibt gleich. Als Label direkt in der Titelzeile nutzbar.
    const pad = size === 'sm' ? '2px 8px' : '3px 9px';
    const fontPx = size === 'sm' ? 10.5 : 11.5;
    const boxStyle = {
        display: 'inline-flex', alignItems: 'center', background: color, color: fg,
        borderRadius: 999, padding: pad, font: `700 ${fontPx}px/1 Polarstern, system-ui,sans-serif`,
        letterSpacing: '0.02em', boxShadow: '0 1px 2px rgba(0,0,0,0.18)', whiteSpace: 'nowrap',
        ...(pulsing ? { ['--glow']: color, animation: `scim-diode-glow ${dur}s ease-in-out infinite` } : {}),
    };
    return (_jsx("span", { style: boxStyle, children: _jsx("span", { style: pulsing ? { animation: `scim-diode-text ${dur}s ease-in-out infinite` } : undefined, children: word }) }));
}
