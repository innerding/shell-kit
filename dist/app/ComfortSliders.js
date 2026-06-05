import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { colorize } from './colorist';
// ── Gradient ──────────────────────────────────────────────────────────────────
// Der Gradient ist das Destillat des Colour-Meshs: er zeigt IMMER seinen vollen
// Umfang (grün=0 unten bis violett=1 oben). Was sich mit der Last ändert ist,
// wieviel Raum kalte vs. warme Werte einnehmen — abhängig davon, wo in der
// aktuellen Verteilung die Segment-Lasten liegen.
// Bewegung 1: Farben verteilen sich in-place neu (kein Scrollen, kein translateY).
const GRADIENT_FALLBACK = 'linear-gradient(to top, #2ecc40 0%, #a8e63c 14%, #f1c40f 28%, #ffaa00 42%, #ff5500 56%, #ff0044 72%, #ff0099 100%)';
function buildGradient(loads) {
    if (loads.length === 0)
        return GRADIENT_FALLBACK;
    const sorted = [...loads].sort((a, b) => a - b);
    const N = sorted.length;
    const STOPS = 10;
    const stops = Array.from({ length: STOPS }, (_, i) => {
        const idx = Math.min(N - 1, Math.round(i / (STOPS - 1) * (N - 1)));
        return `${colorize(sorted[idx])} ${Math.round(i * 100 / (STOPS - 1))}%`;
    });
    return `linear-gradient(to top, ${stops.join(', ')})`;
}
// ── Layout-Konstanten ─────────────────────────────────────────────────────────
const STRIP_W = 12;
const RIGHT_GAP = 12;
const L_GAP_COL = 12;
const L_GAP_EXP = 24;
const SPACER = 6;
const COL_W = 36;
const W_COL = L_GAP_COL + STRIP_W + RIGHT_GAP;
const W_EXP = L_GAP_EXP + STRIP_W + RIGHT_GAP + SPACER + COL_W;
const LABEL_W = RIGHT_GAP + SPACER + COL_W;
function SliderStrip({ value, loads, maxValue, onChange, expanded, onExpandChange, labels }) {
    const trackRef = useRef(null);
    const dragging = useRef(false);
    const collapseTimer = useRef(null);
    // Beim Drag gespeicherte absolute Last-Schwelle (0..1). Basis für Bewegung 2:
    // Fenster trackt diese Last durch sich ändernde Verteilungen.
    const [thresholdLoad, setThresholdLoad] = useState(null);
    // Eingefroren beim Expand: CSS + top. Freigegeben beim Collapse.
    const frozenGrad = useRef(null);
    const linePos = Math.min(value, maxValue);
    // Bewegung 1: dynamischer CSS-Gradient aus sortierten Loads, füllt vollen Streifen.
    const gradCSS = useMemo(() => (loads && loads.length > 0 ? buildGradient(loads) : GRADIENT_FALLBACK), [loads]);
    // Bewegung 2: Fenster-Position. Wo im Gradienten (3× Höhe) liegt thresholdLoad
    // in der aktuellen Verteilung? → top so setzen, dass diese Last am Schieber klebt.
    // Kein thresholdLoad = Fenster am linePos-Anker (Startzustand).
    const windowPos = useMemo(() => {
        if (thresholdLoad === null || !loads || loads.length === 0)
            return linePos;
        const sorted = [...loads].sort((a, b) => a - b);
        const idx = sorted.findIndex(l => l >= thresholdLoad);
        return idx < 0 ? 1 : Math.min(1, idx / Math.max(1, sorted.length - 1));
    }, [thresholdLoad, loads, linePos]);
    const gradTop = `-${(1 - windowPos) * 200}%`;
    // Bewegung 3: nur User bewegt Schieber.
    const readPosition = useCallback((clientY) => {
        const track = trackRef.current;
        if (!track)
            return;
        const rect = track.getBoundingClientRect();
        const v = Math.max(0, Math.min(maxValue, 1 - (clientY - rect.top) / rect.height));
        if (loads && loads.length > 0) {
            const sorted = [...loads].sort((a, b) => a - b);
            const idx = Math.min(sorted.length - 1, Math.round(v * (sorted.length - 1)));
            setThresholdLoad(sorted[idx]);
        }
        onChange(v);
        scheduleCollapse();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [onChange, maxValue, loads]);
    const handleExpandChange = useCallback((exp) => {
        if (exp && !frozenGrad.current) {
            frozenGrad.current = { css: gradCSS, top: gradTop };
        }
        else if (!exp) {
            frozenGrad.current = null;
        }
        onExpandChange(exp);
    }, [gradCSS, gradTop, onExpandChange]);
    const scheduleCollapse = useCallback(() => {
        if (collapseTimer.current)
            clearTimeout(collapseTimer.current);
        collapseTimer.current = setTimeout(() => handleExpandChange(false), 2800);
    }, [handleExpandChange]);
    useEffect(() => () => { if (collapseTimer.current)
        clearTimeout(collapseTimer.current); }, []);
    const activeCSS = frozenGrad.current?.css ?? gradCSS;
    const activeTop = frozenGrad.current?.top ?? gradTop;
    return (_jsxs("div", { style: { position: 'relative', width: expanded ? W_EXP : W_COL, height: 155, flexShrink: 0, transition: 'width 0.22s ease' }, children: [_jsxs("div", { ref: trackRef, style: { position: 'absolute', left: expanded ? L_GAP_EXP : L_GAP_COL, top: 0, bottom: 0, width: STRIP_W, overflow: 'hidden', transition: 'left 0.22s ease', pointerEvents: 'none' }, children: [_jsx("div", { style: {
                            position: 'absolute',
                            top: activeTop,
                            height: '300%',
                            left: 1, right: 1,
                            borderRadius: 3,
                            background: activeCSS,
                            transition: expanded ? 'none' : 'top 0.5s ease',
                        } }), maxValue < 0.99 && (_jsx("div", { style: { position: 'absolute', left: 0, right: 0, bottom: `${maxValue * 100}%`, height: 1, borderTop: '1px dashed rgba(255,255,255,0.4)' } })), _jsx("div", { style: { position: 'absolute', left: 0, right: 0, bottom: `${linePos * 100}%`, height: expanded ? 3 : 2, background: '#fff', boxShadow: '0 0 6px 1px rgba(255,255,255,0.9)', zIndex: 2 } })] }), expanded && (_jsxs("div", { style: { position: 'absolute', right: 0, width: LABEL_W, top: 0, bottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', pointerEvents: 'none' }, children: [_jsx("span", { style: { writingMode: 'vertical-rl', fontSize: 11, fontWeight: 700, color: 'rgba(0,0,0,0.80)', letterSpacing: '0.02em' }, children: labels.top }), _jsx("span", { style: { fontSize: 13, fontWeight: 900, color: 'rgba(0,0,0,0.80)', letterSpacing: '0.04em', textAlign: 'center' }, children: labels.middle }), _jsx("span", { style: { writingMode: 'vertical-rl', fontSize: 11, fontWeight: 700, color: 'rgba(0,0,0,0.80)', letterSpacing: '0.02em' }, children: labels.bottom })] })), !expanded && (_jsx("div", { onPointerDown: () => { handleExpandChange(true); scheduleCollapse(); }, style: { position: 'absolute', inset: 0, cursor: 'pointer', touchAction: 'none' } })), expanded && (_jsx("div", { onPointerDown: (e) => { dragging.current = true; e.currentTarget.setPointerCapture(e.pointerId); readPosition(e.clientY); }, onPointerMove: (e) => { if (dragging.current)
                    readPosition(e.clientY); }, onPointerUp: () => { dragging.current = false; }, style: { position: 'absolute', left: 0, top: 0, bottom: 0, width: L_GAP_EXP + STRIP_W + RIGHT_GAP, cursor: 'ns-resize', touchAction: 'none' } })), expanded && (_jsx("div", { onPointerDown: () => { handleExpandChange(false); }, style: { position: 'absolute', right: 0, top: 0, bottom: 0, width: COL_W, cursor: 'pointer', touchAction: 'none' } }))] }));
}
export default function ComfortSliders({ movementValue, movementLoad, movementLoads, stayValue, stayLoad, stayMaxValue, onMovementChange, onStayChange, step2Active = false }) {
    const [movExpanded, setMovExpanded] = useState(false);
    const [stayVisible, setStayVisible] = useState(false);
    const [stayExpanded, setStayExpanded] = useState(false);
    const stayHideTimer = useRef(null);
    const handleMovExpandChange = (exp) => {
        setMovExpanded(exp);
        if (exp) {
            if (stayHideTimer.current)
                clearTimeout(stayHideTimer.current);
            setStayVisible(true);
            setStayExpanded(true);
        }
        else {
            stayHideTimer.current = setTimeout(() => { setStayExpanded(false); setTimeout(() => setStayVisible(false), 250); }, 3000);
        }
    };
    useEffect(() => () => { if (stayHideTimer.current)
        clearTimeout(stayHideTimer.current); }, []);
    return (_jsxs("div", { style: { position: 'absolute', right: 0, top: 62, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, zIndex: 600 }, children: [_jsx(SliderStrip, { value: movementValue, systemLoad: movementLoad, loads: movementLoads, maxValue: 1, onChange: onMovementChange, expanded: movExpanded, onExpandChange: handleMovExpandChange, labels: { top: 'belebter', middle: 'WEG', bottom: 'ruhiger' } }), step2Active && stayVisible && (_jsx(SliderStrip, { value: stayValue, systemLoad: stayLoad, maxValue: stayMaxValue, onChange: onStayChange, expanded: stayExpanded, onExpandChange: setStayExpanded, labels: { top: 'belebter', middle: 'RAST', bottom: 'ruhiger' } }))] }));
}
