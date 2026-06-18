import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
let injected = false;
function ensureWarnStyle() {
    if (typeof document === 'undefined' || injected)
        return;
    injected = true;
    if (document.getElementById('scim-warn-style'))
        return;
    const el = document.createElement('style');
    el.id = 'scim-warn-style';
    el.textContent = '@keyframes scim-warn{0%,100%{opacity:0}50%{opacity:0.17}}';
    document.head.appendChild(el);
}
export default function WarnTriangle({ intensity, color = 'currentColor' }) {
    ensureWarnStyle();
    const i = Math.max(0, Math.min(1, intensity));
    if (i <= 0)
        return null;
    const dur = (1.7 - 1.1 * i).toFixed(2);
    const wrap = {
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        pointerEvents: 'none', overflow: 'hidden', borderRadius: 'inherit', zIndex: 0,
    };
    return (_jsx("span", { "aria-hidden": true, style: wrap, children: _jsxs("svg", { viewBox: "0 0 100 100", width: "74%", style: { maxWidth: 200, color, animation: `scim-warn ${dur}s ease-in-out infinite`, opacity: 0 }, children: [_jsx("path", { d: "M50 11 L93 87 L7 87 Z", fill: "none", stroke: "currentColor", strokeWidth: "7", strokeLinejoin: "round" }), _jsx("rect", { x: "45.5", y: "38", width: "9", height: "26", rx: "4", fill: "currentColor" }), _jsx("circle", { cx: "50", cy: "76", r: "5.2", fill: "currentColor" })] }) }));
}
