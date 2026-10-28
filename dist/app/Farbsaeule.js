import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// Farbsaeule — der Einsteller der Farbwelt (28.10.2026, o-o-o-o.app bauhuette/border-mesh-point Blatt 131, Teil B, sein
// „bau es"). Ersetzt die Säule aus SCIM3 P01 (ThresholdColumn) in der Ziel-App; SCIM3 behält seine eigene.
//
// Eingestellt werden 2 bis 6 Farben, unten wenig Last, oben viel, und ihre Stösse. Die Säule zeigt sie als Verlauf von
// Feldmitte zu Feldmitte — ohne Haken als harte Felder —, an jedem Stoss ein Schieber, der die beiden Nachbarfelder ändert und
// sonst nichts. Daneben die sechs Felder, mit denen das System rechnet (sechsFelder), nur zum Ansehen. Die Griffe sind die
// Rechnungen aus ./scale (stossSetzen, feldDazu, feldWeg), dieselben, die o-o-o-o.app nimmt. Kein Mittelfeld, keine
// Kopplung, kein Umsortieren.
import { useEffect, useRef, useState } from 'react';
import { feldDazu, feldWeg, saeulenHintergrund, sechsFelder, stossSetzen, FELDER_MAX } from './scale';
const HOEHE = 220;
function toHex(c) {
    const s = c.trim();
    if (/^#[0-9a-fA-F]{6}$/.test(s))
        return s.toLowerCase();
    if (/^#[0-9a-fA-F]{3}$/.test(s))
        return '#' + s.slice(1).split('').map((x) => x + x).join('').toLowerCase();
    const m = s.match(/rgba?\(([^)]+)\)/);
    if (m) {
        const [r, g, b] = m[1].split(',').map((x) => Math.max(0, Math.min(255, Math.round(parseFloat(x)))));
        return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
    }
    return '#888888';
}
export default function Farbsaeule({ einstellung, onChange, onReset, resetLabel, mitVerlauf = true }) {
    const [zug, setZug] = useState(null);
    const zugIdx = useRef(null);
    const balken = useRef(null);
    useEffect(() => { setZug(null); zugIdx.current = null; }, [einstellung]);
    const e = zug ?? einstellung;
    const n = e.stops.length;
    const sechs = sechsFelder(e);
    const lastAn = (clientY) => {
        const r = balken.current?.getBoundingClientRect();
        return r ? Math.max(0, Math.min(1, 1 - (clientY - r.top) / r.height)) : 0.5;
    };
    const runter = (i) => (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        ev.target.setPointerCapture(ev.pointerId);
        zugIdx.current = i;
        setZug(einstellung);
    };
    const ziehen = (i) => (ev) => {
        if (zugIdx.current !== i)
            return;
        setZug((z) => stossSetzen(z ?? einstellung, i, lastAn(ev.clientY)));
    };
    const hoch = (i) => (ev) => {
        if (zugIdx.current !== i)
            return;
        try {
            ev.target.releasePointerCapture(ev.pointerId);
        }
        catch { /* */ }
        zugIdx.current = null;
        if (zug)
            onChange(zug);
        setZug(null);
    };
    const farbe = (i, c) => onChange({ stops: einstellung.stops.map((x, k) => (k === i ? c.toLowerCase() : x)), borders: [...einstellung.borders] });
    const oben = Array.from({ length: n }, (_, k) => n - 1 - k);
    return (_jsxs("div", { style: { display: 'flex', gap: 12, alignItems: 'flex-start', flexShrink: 0 }, children: [_jsxs("div", { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'flex-start', height: HOEHE }, children: [_jsx("div", { ref: balken, style: { width: 46, height: HOEHE, borderRadius: 4, border: '1px solid #cbd5e0', background: saeulenHintergrund(e, mitVerlauf) } }), _jsx("div", { style: { position: 'relative', width: 24, height: HOEHE }, children: e.borders.map((b, i) => (_jsx("div", { onPointerDown: runter(i), onPointerMove: ziehen(i), onPointerUp: hoch(i), onPointerCancel: hoch(i), title: `Stoss ${i + 1}: ${Math.round(b * 100)} %`, style: { position: 'absolute', left: 1, right: 0, top: `calc(${(1 - b) * 100}% - 8px)`, height: 16, display: 'flex', alignItems: 'center', cursor: 'ns-resize', touchAction: 'none' }, children: _jsx("div", { style: { flex: 1, height: zugIdx.current === i ? 3 : 2, background: '#1a365d', borderRadius: 1 } }) }, i))) })] }), onReset && (_jsxs("button", { onClick: onReset, style: { fontSize: 10, padding: '2px 7px', borderRadius: 3, border: '1px solid #e2e8f0', background: '#f7fafc', color: '#718096', cursor: 'pointer' }, children: ["\u21BA ", resetLabel ?? 'zurück'] }))] }), _jsxs("div", { style: { width: 84 }, children: [_jsx("div", { style: { fontSize: 8.5, color: '#a0aec0', marginBottom: 2 }, children: "\u2191 viel Last" }), _jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: 5 }, children: [oben.map((i) => (_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 4, padding: '2px 4px', borderRadius: 4, background: '#fff', border: '1px solid #edf2f7' }, children: [_jsx("input", { type: "color", value: toHex(e.stops[i]), onChange: (ev) => farbe(i, ev.target.value), style: { width: 30, height: 24, border: 'none', background: 'none', cursor: 'pointer' } }), n > 2 && (_jsx("button", { onClick: () => onChange(feldWeg(einstellung, i)), title: "diese Farbe weg", style: { marginLeft: 'auto', fontSize: 13, border: 'none', background: 'none', color: '#a0aec0', cursor: 'pointer' }, children: "\u00D7" }))] }, i))), n < FELDER_MAX && (_jsx("button", { onClick: () => onChange(feldDazu(einstellung)), title: "eine Farbe dazu, oben", style: { marginTop: 2, alignSelf: 'flex-start', width: 30, height: 26, borderRadius: 4, border: '1px dashed #cbd5e0', background: '#f7fafc', color: '#4a5568', cursor: 'pointer', fontSize: 16 }, children: "+" }))] }), _jsx("div", { style: { fontSize: 8.5, color: '#a0aec0', marginTop: 2 }, children: "\u2193 wenig Last" })] }), _jsxs("div", { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }, children: [_jsx("div", { title: "die sechs Felder, mit denen das System rechnet", style: { width: 22, height: HOEHE, borderRadius: 4, border: '1px solid #cbd5e0', background: saeulenHintergrund({ stops: sechs.stops, borders: sechs.borders ?? [] }, false) } }), _jsx("div", { style: { fontSize: 9, color: '#a0aec0' }, children: "6" })] })] }));
}
