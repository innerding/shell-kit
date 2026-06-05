import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef, useEffect, useCallback } from 'react';
const GRADIENT = 'linear-gradient(to top, #2ecc40 0%, #a8e63c 14%, #f1c40f 28%, #ffaa00 42%, #ff5500 56%, #ff0044 72%, #ff0099 100%)';
const STRIP_W = 12;
const RIGHT_GAP = 12; // strip → screen edge (both states)
const L_GAP_COL = 12; // left of strip in collapsed state
const L_GAP_EXP = 24; // left of strip in expanded state
const SPACER = 6; // no-interaction zone (expanded only)
const COL_W = 36; // collapse hitbox width (= expand hitbox width)
const W_COL = L_GAP_COL + STRIP_W + RIGHT_GAP; // 36px
const W_EXP = L_GAP_EXP + STRIP_W + RIGHT_GAP + SPACER + COL_W; // 90px
const LABEL_W = RIGHT_GAP + SPACER + COL_W; // 54px — between strip right edge and screen
function SliderStrip({ value, systemLoad, maxValue, onChange, expanded, onExpandChange, labels }) {
    const trackRef = useRef(null);
    const dragging = useRef(false);
    const collapseTimer = useRef(null);
    // Eingefrorener Gradient-Stand: gesetzt beim Expand, gelöscht beim Collapse.
    // collapsed = System bewegt das Fenster (3 Bewegungen aktiv).
    // expanded  = Fenster eingefroren, nur User-Schieber bewegt sich.
    const frozenGrad = useRef(null);
    const linePos = Math.min(value, maxValue);
    const load = Math.min(1, Math.max(0, systemLoad));
    const gradTop = `-${(1 - linePos) * 200}%`;
    const gradTransform = `translateY(${(load - linePos) * 100}%)`;
    // Expand: Gradient-Stand einfrieren; Collapse: freigeben.
    const handleExpandChange = useCallback((exp) => {
        if (exp && !frozenGrad.current) {
            frozenGrad.current = { top: gradTop, transform: gradTransform };
        }
        else if (!exp) {
            frozenGrad.current = null;
        }
        onExpandChange(exp);
    }, [gradTop, gradTransform, onExpandChange]);
    const scheduleCollapse = useCallback(() => {
        if (collapseTimer.current)
            clearTimeout(collapseTimer.current);
        collapseTimer.current = setTimeout(() => handleExpandChange(false), 2800);
    }, [handleExpandChange]);
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
    return (_jsxs("div", { style: {
            position: 'relative',
            width: expanded ? W_EXP : W_COL,
            height: 155,
            flexShrink: 0,
            transition: 'width 0.22s ease',
        }, children: [_jsxs("div", { ref: trackRef, style: {
                    position: 'absolute',
                    left: expanded ? L_GAP_EXP : L_GAP_COL,
                    top: 0, bottom: 0,
                    width: STRIP_W,
                    overflow: 'hidden',
                    transition: 'left 0.22s ease',
                    pointerEvents: 'none',
                }, children: [_jsx("div", { style: {
                            position: 'absolute',
                            top: frozenGrad.current?.top ?? gradTop,
                            height: '300%',
                            left: 1, right: 1,
                            borderRadius: 3,
                            background: GRADIENT,
                            transform: frozenGrad.current?.transform ?? gradTransform,
                            transition: expanded ? 'none' : 'top 0.4s ease, transform 0.4s ease',
                        } }), maxValue < 0.99 && (_jsx("div", { style: {
                            position: 'absolute', left: 0, right: 0,
                            bottom: `${maxValue * 100}%`,
                            height: 1,
                            borderTop: '1px dashed rgba(255,255,255,0.4)',
                        } })), _jsx("div", { style: {
                            position: 'absolute', left: 0, right: 0,
                            bottom: `${linePos * 100}%`,
                            height: expanded ? 3 : 2,
                            background: '#fff',
                            boxShadow: '0 0 6px 1px rgba(255,255,255,0.9)',
                            zIndex: 2,
                        } })] }), expanded && (_jsxs("div", { style: {
                    position: 'absolute',
                    right: 0,
                    width: LABEL_W,
                    top: 0, bottom: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 0',
                    pointerEvents: 'none',
                }, children: [_jsx("span", { style: {
                            writingMode: 'vertical-rl',
                            fontSize: 11, fontWeight: 700,
                            color: 'rgba(0,0,0,0.80)',
                            letterSpacing: '0.02em',
                        }, children: labels.top }), _jsx("span", { style: {
                            fontSize: 13, fontWeight: 900,
                            color: 'rgba(0,0,0,0.80)',
                            letterSpacing: '0.04em',
                            textAlign: 'center',
                        }, children: labels.middle }), _jsx("span", { style: {
                            writingMode: 'vertical-rl',
                            fontSize: 11, fontWeight: 700,
                            color: 'rgba(0,0,0,0.80)',
                            letterSpacing: '0.02em',
                        }, children: labels.bottom })] })), !expanded && (_jsx("div", { onPointerDown: () => { handleExpandChange(true); scheduleCollapse(); }, style: {
                    position: 'absolute', inset: 0,
                    cursor: 'pointer',
                    touchAction: 'none',
                } })), expanded && (_jsx("div", { onPointerDown: (e) => {
                    dragging.current = true;
                    e.currentTarget.setPointerCapture(e.pointerId);
                    readPosition(e.clientY);
                }, onPointerMove: (e) => { if (dragging.current)
                    readPosition(e.clientY); }, onPointerUp: () => { dragging.current = false; }, style: {
                    position: 'absolute',
                    left: 0, top: 0, bottom: 0,
                    width: L_GAP_EXP + STRIP_W + RIGHT_GAP, // 48px
                    cursor: 'ns-resize',
                    touchAction: 'none',
                } })), expanded && (_jsx("div", { onPointerDown: () => { handleExpandChange(false); }, style: {
                    position: 'absolute',
                    right: 0, top: 0, bottom: 0,
                    width: COL_W,
                    cursor: 'pointer',
                    touchAction: 'none',
                } }))] }));
}
export default function ComfortSliders({ movementValue, movementLoad, stayValue, stayLoad, stayMaxValue, onMovementChange, onStayChange, step2Active = false, }) {
    const [movExpanded, setMovExpanded] = useState(false);
    const [stayVisible, setStayVisible] = useState(false);
    const [stayExpanded, setStayExpanded] = useState(false);
    const stayHideTimer = useRef(null);
    const handleMovExpandChange = (expanded) => {
        setMovExpanded(expanded);
        if (expanded) {
            if (stayHideTimer.current)
                clearTimeout(stayHideTimer.current);
            setStayVisible(true);
            setStayExpanded(true);
        }
        else {
            stayHideTimer.current = setTimeout(() => {
                setStayExpanded(false);
                setTimeout(() => setStayVisible(false), 250);
            }, 3000);
        }
    };
    useEffect(() => () => { if (stayHideTimer.current)
        clearTimeout(stayHideTimer.current); }, []);
    return (_jsxs("div", { style: {
            position: 'absolute',
            right: 0,
            top: 62,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: 8,
            zIndex: 600,
        }, children: [_jsx(SliderStrip, { value: movementValue, systemLoad: movementLoad, maxValue: 1, onChange: onMovementChange, expanded: movExpanded, onExpandChange: handleMovExpandChange, labels: { top: 'belebter', middle: 'WEG', bottom: 'ruhiger' } }), step2Active && stayVisible && (_jsx(SliderStrip, { value: stayValue, systemLoad: stayLoad, maxValue: stayMaxValue, onChange: onStayChange, expanded: stayExpanded, onExpandChange: setStayExpanded, labels: { top: 'belebter', middle: 'RAST', bottom: 'ruhiger' } }))] }));
}
