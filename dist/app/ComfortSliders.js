import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useRef, useEffect, useCallback } from 'react';
import { colorAt, stageOf } from './scale';
// Stufen-Band-MITTEN (Load 0..1) je Stufe 1..n — robust für borders ODER Spreizung
// (per Sampling). Dort sitzt das jeweilige Kaskaden-Wort auf Schauglas-Höhe.
function bandCenters(scale, n) {
    const lo = new Array(n + 1).fill(2), hi = new Array(n + 1).fill(-1);
    const STEPS = 240;
    for (let i = 0; i <= STEPS; i++) {
        const h = i / STEPS, s = stageOf(h, scale);
        if (s >= 1 && s <= n) {
            if (h < lo[s])
                lo[s] = h;
            if (h > hi[s])
                hi[s] = h;
        }
    }
    const out = [];
    for (let s = 1; s <= n; s++)
        out.push(lo[s] > hi[s] ? (s - 0.5) / n : (lo[s] + hi[s]) / 2);
    return out;
}
// Fallback, falls keine Skala übergeben wird (alte Aufrufer).
const GRADIENT = 'linear-gradient(to top, #2ecc40 0%, #a8e63c 14%, #f1c40f 28%, #ffaa00 42%, #ff5500 56%, #ff0044 72%, #ff0099 100%)';
// Verlauf aus DERSELBEN Skala wie das Mesh (colorAt mit stops/borders) — so spricht
// das BCK-Schauglas dieselbe Farbwelt wie das Mesh (Last 0 unten … 1 oben).
function gradientFromScale(scale) {
    if (!scale)
        return GRADIENT;
    const N = 14;
    const parts = [];
    for (let i = 0; i <= N; i++) {
        const load = i / N;
        parts.push(`${colorAt(load, scale)} ${((load) * 100).toFixed(0)}%`);
    }
    return `linear-gradient(to top, ${parts.join(', ')})`;
}
const STRIP_W = 12;
const RIGHT_GAP = 12;
const L_GAP_COL = 12;
const L_GAP_EXP = 24;
const SPACER = 6;
const COL_W = 36;
const W_COL = L_GAP_COL + STRIP_W + RIGHT_GAP;
const W_EXP = L_GAP_EXP + STRIP_W + RIGHT_GAP + SPACER + COL_W;
const LABEL_W = RIGHT_GAP + SPACER + COL_W;
const EDGE_GAP = 4; // px Abstand des Schiebers zu Ober-/Unterkante (läuft nie raus)
const TOP_EXTRA = 1; // oben 1px mehr (Schieber ist bottom-verankert, wächst nach oben)
// Schieber-/Marker-Position mit Rand-Gap: bottom-Wert, der bei value 0..1
// zwischen EDGE_GAP und (Höhe − EDGE_GAP − TOP_EXTRA) bleibt.
const insetBottom = (v) => `calc(${EDGE_GAP}px + ${Math.max(0, Math.min(1, v))} * (100% - ${EDGE_GAP * 2 + TOP_EXTRA}px))`;
// Lesbare Textfarbe auf einer Farb-Box (einfache Luminanz).
function readable(hex) {
    const h = hex.replace('#', '');
    const n = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
    const r = parseInt(n.slice(0, 2), 16), g = parseInt(n.slice(2, 4), 16), b = parseInt(n.slice(4, 6), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) > 150 ? '#14223e' : '#fff';
}
function SliderStrip({ value, maxValue, onChange, expanded, onExpandChange, gradient, loadLevel, manifest, cascade }) {
    const trackRef = useRef(null);
    const dragging = useRef(false);
    const collapseTimer = useRef(null);
    const linePos = Math.min(value, maxValue);
    const scheduleCollapse = useCallback(() => {
        if (collapseTimer.current)
            clearTimeout(collapseTimer.current);
        collapseTimer.current = setTimeout(() => onExpandChange(false), 2800);
    }, [onExpandChange]);
    const readPosition = useCallback((clientY) => {
        const track = trackRef.current;
        if (!track)
            return;
        const rect = track.getBoundingClientRect();
        onChange(Math.max(0, Math.min(maxValue, 1 - (clientY - rect.top) / rect.height)));
        scheduleCollapse();
    }, [onChange, maxValue, scheduleCollapse]);
    useEffect(() => () => { if (collapseTimer.current)
        clearTimeout(collapseTimer.current); }, []);
    return (_jsxs("div", { style: { position: 'relative', width: expanded ? W_EXP : W_COL, height: 155, flexShrink: 0, transition: 'width 0.22s ease', userSelect: 'none', WebkitUserSelect: 'none' }, children: [_jsxs("div", { ref: trackRef, style: { position: 'absolute', left: expanded ? L_GAP_EXP : L_GAP_COL, top: 0, bottom: 0, width: STRIP_W, overflow: 'hidden', transition: 'left 0.22s ease', pointerEvents: 'none' }, children: [_jsx("div", { style: { position: 'absolute', inset: 0, borderRadius: 3, background: gradient } }), _jsx("div", { style: { position: 'absolute', inset: 1, borderRadius: 2, background: gradient } }), loadLevel != null && loadLevel < 0.999 && (
                    // Sofortfix: nur ein 3px-Band am RECHTEN Rand (linker Rand nach rechts gerückt)
                    // — die volle Mesh-Farbe bleibt links sichtbar; der Bleach deutet den Pegel an.
                    _jsx("div", { style: { position: 'absolute', left: STRIP_W - 4, right: 1, top: 1, bottom: insetBottom(loadLevel), borderRadius: 1, background: 'rgba(255,255,255,0.62)' } })), maxValue < 0.99 && (_jsx("div", { style: { position: 'absolute', left: 0, right: 0, bottom: insetBottom(maxValue), height: 1, borderTop: '1px dashed rgba(255,255,255,0.4)' } })), _jsx("div", { style: { position: 'absolute', left: 0, right: 0, bottom: insetBottom(linePos), height: expanded ? 3 : 2, background: '#fff', boxShadow: '0 0 6px 1px rgba(255,255,255,0.9)', zIndex: 2 } })] }), manifest && manifest.length > 0 && (_jsx("div", { "aria-hidden": true, style: {
                    position: 'absolute', top: '50%', right: W_EXP - L_GAP_EXP + 10, transform: 'translateY(-50%)',
                    textAlign: 'right', whiteSpace: 'nowrap', pointerEvents: 'none',
                    opacity: expanded ? 1 : 0, transition: 'opacity 0.18s ease',
                    color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.55), 0 0 2px rgba(0,0,0,0.5)',
                    font: '800 15px/1.16 system-ui,sans-serif', letterSpacing: '0.01em',
                }, children: manifest.map((line, i) => _jsx("div", { children: line }, i)) })), cascade && cascade.map((c, i) => c.word ? (_jsx("span", { "aria-hidden": true, style: {
                    position: 'absolute', left: L_GAP_EXP + STRIP_W + 6, bottom: insetBottom(c.pos), transform: 'translateY(50%)',
                    whiteSpace: 'nowrap', pointerEvents: 'none',
                    opacity: expanded ? 1 : 0, transition: 'opacity 0.18s ease',
                    color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.55), 0 0 2px rgba(0,0,0,0.5)',
                    font: '700 10.5px/1 system-ui,sans-serif', letterSpacing: '0.02em',
                }, children: c.word }, i)) : null), !expanded && (_jsx("div", { onPointerDown: () => { onExpandChange(true); scheduleCollapse(); }, style: { position: 'absolute', inset: 0, cursor: 'pointer', touchAction: 'none' } })), expanded && (_jsxs(_Fragment, { children: [_jsx("div", { onPointerDown: (e) => { dragging.current = true; e.currentTarget.setPointerCapture(e.pointerId); readPosition(e.clientY); }, onPointerMove: (e) => { if (dragging.current)
                            readPosition(e.clientY); }, onPointerUp: () => { dragging.current = false; }, style: { position: 'absolute', left: 0, top: 0, bottom: 0, width: L_GAP_EXP + STRIP_W + RIGHT_GAP, cursor: 'ns-resize', touchAction: 'none' } }), _jsx("div", { onPointerDown: () => onExpandChange(false), style: { position: 'absolute', right: 0, top: 0, bottom: 0, width: COL_W, cursor: 'pointer', touchAction: 'none' } })] }))] }));
}
export default function ComfortSliders({ movementValue, stayValue, stayMaxValue, onMovementChange, onStayChange, step2Active = false, scale, loadLevel, stayLoadLevel, labelOf, stayManifest, movementManifest, onMovementExpandChange, onStayExpandChange }) {
    const gradient = gradientFromScale(scale);
    const [movExpanded, setMovExpanded] = useState(false);
    const [stayExpanded, setStayExpanded] = useState(false);
    const setMov = (e) => { setMovExpanded(e); onMovementExpandChange?.(e); };
    const setStay = (e) => { setStayExpanded(e); onStayExpandChange?.(e); };
    // Kaskade (gleich für beide Slider): je Stufe ein Wort auf seiner Band-Mitte.
    const cascade = (labelOf && scale)
        ? bandCenters(scale, scale.stops.length).map((pos) => ({ word: labelOf(pos).word, pos }))
        : undefined;
    // Beide Slider permanent; jeder klappt unabhängig auf. Reihenfolge: RAST OBEN, WEG UNTEN
    // (die POI-/Rast-Hinweise sitzen oben, der Rast-Slider gehört daneben).
    return (_jsxs("div", { style: { position: 'absolute', right: 0, top: 62, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, zIndex: 600 }, children: [step2Active && (_jsx(SliderStrip, { value: stayValue, maxValue: stayMaxValue, onChange: onStayChange, expanded: stayExpanded, onExpandChange: setStay, manifest: stayManifest, cascade: cascade, gradient: gradient, loadLevel: stayLoadLevel })), _jsx(SliderStrip, { value: movementValue, maxValue: 1, onChange: onMovementChange, expanded: movExpanded, onExpandChange: setMov, manifest: movementManifest, cascade: cascade, gradient: gradient, loadLevel: loadLevel })] }));
}
