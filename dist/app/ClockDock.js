import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import FlapClock, { themeFromTint, clockWidthPx } from './FlapClock';
import { useDockHeight } from './dock';
// Play-Button = der „Du" ohne Außenring: Box in der Comfort-Farbe (face), darin die
// orange Du-Scheibe mit weißem Ring (darf pulsen) + weißes Kite nach rechts (Play) bzw.
// Pausenbalken (Pause). So sind Du und Play/Pause optisch dasselbe.
const DU_ORANGE = '#f60';
function PlayBox({ running, onToggle, size, face, blink, locate }) {
    const seam = Math.max(2, Math.round(size * 0.03)); // weißer Ring etwas kräftiger
    const sw = (seam / size) * 100; // in der 100er-viewBox
    return (_jsx("button", { onClick: onToggle, "aria-label": locate ? 'Wo bin ich?' : running ? 'Pause' : 'Start', style: {
            width: size, height: size, flexShrink: 0, padding: 0, cursor: 'pointer',
            background: face, border: 'none', borderRadius: Math.round(size * 0.08),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
        }, children: _jsxs("svg", { width: size, height: size, viewBox: "0 0 100 100", "aria-hidden": true, children: [_jsx("circle", { cx: "50", cy: "50", r: "40", fill: DU_ORANGE, style: blink ? { animation: 'clockDockPlayBlink 0.8s ease-in-out infinite' } : undefined }), _jsx("circle", { cx: "50", cy: "50", r: "40", fill: "none", stroke: "#fff", strokeWidth: sw }), locate
                    /* Spar-Modus: Fadenkreuz = „Wo bin ich?" (Einzelfix statt Play). */
                    ? _jsxs(_Fragment, { children: [_jsxs("g", { stroke: "#fff", strokeWidth: "6", strokeLinecap: "round", fill: "none", children: [_jsx("circle", { cx: "50", cy: "50", r: "16" }), _jsx("line", { x1: "50", y1: "22", x2: "50", y2: "30" }), _jsx("line", { x1: "50", y1: "70", x2: "50", y2: "78" }), _jsx("line", { x1: "22", y1: "50", x2: "30", y2: "50" }), _jsx("line", { x1: "70", y1: "50", x2: "78", y2: "50" })] }), _jsx("circle", { cx: "50", cy: "50", r: "4.5", fill: "#fff" })] })
                    : running
                        ? _jsxs("g", { fill: "#fff", children: [_jsx("rect", { x: "38", y: "34", width: "9", height: "32", rx: "2" }), _jsx("rect", { x: "53", y: "34", width: "9", height: "32", rx: "2" })] })
                        /* Du-Kite (Chevron) nach rechts gedreht = Play */
                        : _jsx("polyline", { points: "34.4,62.5 50,31.25 65.6,62.5", transform: "rotate(90 50 50)", fill: "none", stroke: "#fff", strokeWidth: "9", strokeLinecap: "round", strokeLinejoin: "round" })] }) }));
}
export default function ClockDock({ mainValue, mainDirection, mainEmphasis = 'quiet', left, running, onToggle, maxHeight = 56, tint, clockTint, playTint, blink, locate, }) {
    const playTheme = themeFromTint(playTint ?? tint);
    const height = useDockHeight(maxHeight);
    const cgap = Math.max(2, Math.round(height * 0.045)); // ein Gap überall
    // Haupt-Uhr GENAU so groß + bündig wie die linke Zusatzzeit (0.66·Höhe, unten
    // ausgerichtet) — nur der Play bleibt groß. So schneidet die runde Bildschirmecke
    // (ohne Safe-Area) die Uhr nicht mehr an, und Uhr↔Zusatzzeit sind symmetrisch.
    const clockH = Math.round(height * 0.66);
    // Linke Region fix = Breite der (kleinen) Haupt-Uhr → symmetrisch, Play pixel-mittig.
    const leftW = clockWidthPx(mainValue, clockH, cgap);
    // Volle Breite + zentriert: Play sitzt in der SCHIRM-Mitte, Uhr bündig rechts, links spiegelt.
    return (_jsxs("div", { style: {
            position: 'fixed', left: 0, right: 0,
            bottom: `calc(env(safe-area-inset-bottom) + ${cgap}px)`,
            zIndex: 760,
            display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: cgap,
        }, children: [_jsx("style", { children: '@keyframes clockDockPlayBlink{0%,100%{opacity:1}50%{opacity:0}}' }), _jsx("div", { style: { width: leftW, flexShrink: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end' }, children: left?.(height) }), _jsx(PlayBox, { running: running, onToggle: onToggle, size: height, face: playTheme.face, blink: blink, locate: locate }), _jsx(FlapClock, { value: mainValue, direction: mainDirection, emphasis: mainEmphasis, height: clockH, tint: clockTint ?? tint })] }));
}
