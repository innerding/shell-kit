import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
// FlapClock — Abfahrtstafel-Klappuhr (HH:MM). Weiße, gefüllte Inter-800-Ziffern
// (tabellarisch) auf schwarzen Klappkarten, echtes Mittelscharnier-Split-Flap:
// die obere Hälfte fällt herab, die untere klappt nach. Doppelpunkt asymmetrisch
// (oberer Pip an der Naht). Bei Route-Wechsel (POI an/abwählen) zusätzlich ein Puls.
//
// KASKADE: ein Wertwechsel rollt je Stelle durch die Zwischenziffern in der GLOBALEN
// Richtung (Begehung/Countdown → abwärts: ein Minus = ein Klapp, kein 9× Rundlauf).
// Die Sequenz-Logik (rollSteps/flapDirection) ist der Spiegel von shell-kit/app/flap.ts.
//
// Rendering-Schicht (Runtime-Adapter).
import { useEffect, useRef, useState } from 'react';
import { FLAP_DIGITS, FLAP_COLON } from './flapGlyphs';
import { rollSteps, flapDirection } from './flap';
const DIGIT_VB = 92; // Glyph-Zellbreite Ziffer (advance 87.2 zentriert)
const COLON_VB = 36; // Glyph-Zellbreite Doppelpunkt
// Gerenderte Pixel-Breite einer FlapClock für einen Wert (für die fix reservierte
// linke Dock-Region = Uhr-Breite, damit der Play pixel-mittig steht).
export function clockWidthPx(value, height, gap) {
    const chars = [...value];
    let w = 0;
    for (const ch of chars)
        w += (height * (ch === ':' ? COLON_VB : DIGIT_VB)) / 100;
    return w + Math.max(0, chars.length - 1) * gap;
}
// Theming: die schwarzen Teile (Karten + Play) nehmen einen Tint (z. B. die Comfort-
// Farbe colorAt(comfort)); die Naht = abgedunkelter Tint; und wird der Tint zu hell,
// kippen die weißen Ziffern auf schwarz (relative Luminanz) — wie im alten Modell.
const DEFAULT_TINT = '#161616';
function hexToRgb(h) {
    let s = h.replace('#', '');
    if (s.length === 3)
        s = s.split('').map((c) => c + c).join('');
    const n = parseInt(s, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function relLuminance([r, g, b]) {
    const f = (v) => { const x = v / 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
export function themeFromTint(tint = DEFAULT_TINT) {
    const rgb = hexToRgb(tint);
    return {
        face: tint,
        seam: tint, // Naht exakt = Boxfarbe (keine eigene Linie, gleiche Farbe)
        ink: relLuminance(rgb) > 0.45 ? '#0a0a0a' : '#f4f4f4',
    };
}
// Volle Tusche-Höhe der Inter-Ziffern inkl. Overshoot (runde Ober-/Unterkanten ragen
// über die Figurenbox 0–100 hinaus, die '0'/'9' bis ~101,6). Wir bilden [0..INK_BOT]
// in die Box ab, damit die Rundungen NICHT abgeschnitten werden. Rand = seam.
const INK_BOT = 102;
const KEYFRAMES = `
@keyframes flapFoldTop { from { transform: rotateX(0deg); } to { transform: rotateX(-90deg); } }
@keyframes flapFoldBottom { from { transform: rotateX(90deg); } to { transform: rotateX(0deg); } }
@keyframes flapPulse { 0% { transform: scale(1); } 30% { transform: scale(1.06); } 100% { transform: scale(1); } }
`;
function GlyphSVG({ glyph, vb, w, h }) {
    const tx = (vb - glyph.advance) / 2;
    return (_jsx("svg", { viewBox: `0 0 ${vb} ${INK_BOT}`, width: w, height: h, style: { display: 'block' }, "aria-hidden": true, children: _jsx("path", { d: glyph.d, fill: "currentColor", transform: `translate(${tx.toFixed(2)},0)` }) }));
}
function Half({ glyph, vb, w, h, seam, which }) {
    const halfH = (h - seam) / 2;
    const gh = h - 2 * seam;
    const innerTop = which === 'top' ? seam : seam - (halfH + seam);
    return (_jsx("div", { style: {
            position: 'absolute', left: 0, width: w, height: halfH, overflow: 'hidden',
            top: which === 'top' ? 0 : halfH + seam, background: 'var(--flap-face)',
        }, children: _jsx("div", { style: { position: 'absolute', left: 0, top: innerTop }, children: _jsx(GlyphSVG, { glyph: glyph, vb: vb, w: w, h: gh }) }) }));
}
function Leaf({ glyph, vb, w, h, seam, which, dur, delay }) {
    const halfH = (h - seam) / 2;
    const gh = h - 2 * seam;
    const innerTop = which === 'top' ? seam : seam - (halfH + seam);
    const anim = which === 'top' ? 'flapFoldTop' : 'flapFoldBottom';
    const ease = which === 'top' ? 'ease-in' : 'ease-out';
    return (_jsx("div", { style: {
            position: 'absolute', left: 0, width: w, height: halfH, overflow: 'hidden',
            top: which === 'top' ? 0 : halfH + seam, background: 'var(--flap-face)',
            transformOrigin: which === 'top' ? 'bottom' : 'top',
            backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
            zIndex: 2,
            animation: `${anim} ${dur}ms ${ease} ${delay}ms both`,
        }, children: _jsx("div", { style: { position: 'absolute', left: 0, top: innerTop }, children: _jsx(GlyphSVG, { glyph: glyph, vb: vb, w: w, h: gh }) }) }));
}
function Cell({ children, w, h }) {
    return (_jsx("div", { style: {
            position: 'relative', width: w, height: h, flexShrink: 0,
            background: 'var(--flap-seam)', borderRadius: Math.round(h * 0.08), overflow: 'hidden',
            perspective: h * 3,
        }, children: children }));
}
// Ziffer mit Kaskade: pro Effekt-Zyklus EIN Klapp (display → nächster Schritt) in
// Richtung `direction`, bis display === digit. Ein Minus = ein Klapp; ein Sprung
// rollt durch die Zwischenziffern.
// Ungleiche Taktung: der ERSTE Klapp eines Übergangs läuft mit `firstStep`, alle
// folgenden Kaskaden-Klappen mit `restStep` — realistischer als gleichförmig.
function FlapDigit({ digit, direction, h, seam, firstStep, restStep }) {
    const w = (h * DIGIT_VB) / 100;
    const [display, setDisplay] = useState(digit);
    const [flip, setFlip] = useState(null);
    const stepIdx = useRef(0);
    const target = useRef(digit);
    useEffect(() => {
        if (digit === display) {
            stepIdx.current = 0;
            return;
        }
        if (flip)
            return;
        if (target.current !== digit) {
            target.current = digit;
            stepIdx.current = 0;
        }
        const steps = rollSteps(display, digit, direction);
        if (!steps.length)
            return;
        const dur = stepIdx.current === 0 ? firstStep : restStep;
        const next = steps[0];
        setFlip({ from: display, to: next, dur });
        const t = setTimeout(() => { setDisplay(next); setFlip(null); stepIdx.current += 1; }, dur);
        return () => clearTimeout(t);
        // ⚠ `flip` BEWUSST NICHT in den deps: stünde es drin, würde setFlip den Effekt sofort
        //  neu auslösen, der cleanup den Klapp-Timer abbrechen → Ziffer friert ein (die alte
        //  „tote Uhr"/„+01"). Der `if (flip) return`-Guard liest trotzdem den aktuellen Wert.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [digit, display, direction, firstStep, restStep]);
    const topGlyph = FLAP_DIGITS[flip ? flip.to : display];
    const botGlyph = FLAP_DIGITS[display];
    if (!topGlyph || !botGlyph)
        return _jsx(Cell, { w: w, h: h, children: null });
    return (_jsxs(Cell, { w: w, h: h, children: [_jsx(Half, { glyph: topGlyph, vb: DIGIT_VB, w: w, h: h, seam: seam, which: "top" }), _jsx(Half, { glyph: botGlyph, vb: DIGIT_VB, w: w, h: h, seam: seam, which: "bottom" }), flip && (_jsxs(_Fragment, { children: [_jsx(Leaf, { glyph: FLAP_DIGITS[flip.from], vb: DIGIT_VB, w: w, h: h, seam: seam, which: "top", dur: flip.dur / 2, delay: 0 }), _jsx(Leaf, { glyph: FLAP_DIGITS[flip.to], vb: DIGIT_VB, w: w, h: h, seam: seam, which: "bottom", dur: flip.dur / 2, delay: flip.dur / 2 })] }))] }));
}
function FlapColon({ h, seam }) {
    const w = (h * COLON_VB) / 100;
    return (_jsxs(Cell, { w: w, h: h, children: [_jsx(Half, { glyph: FLAP_COLON, vb: COLON_VB, w: w, h: h, seam: seam, which: "top" }), _jsx(Half, { glyph: FLAP_COLON, vb: COLON_VB, w: w, h: h, seam: seam, which: "bottom" })] }));
}
export default function FlapClock({ value, direction, height = 64, emphasis = 'quiet', firstStep = 100, restStep = 40, tint = DEFAULT_TINT, }) {
    const theme = themeFromTint(tint);
    const seam = Math.max(2, Math.round(height * 0.022));
    const gap = Math.max(2, Math.round(height * 0.045));
    // Richtung pro Übergang: explizit (Aufrufer kennt Begehung/Sprung) oder abgeleitet.
    const prevValue = useRef(value);
    const dirRef = useRef(direction ?? 1);
    if (value !== prevValue.current) {
        dirRef.current = direction ?? flapDirection(prevValue.current, value);
        prevValue.current = value;
    }
    const dir = direction ?? dirRef.current;
    // Puls nur bei Route-Wechsel.
    const [pulsing, setPulsing] = useState(false);
    const prevPulse = useRef(value);
    useEffect(() => {
        if (value !== prevPulse.current) {
            prevPulse.current = value;
            if (emphasis === 'route') {
                setPulsing(false);
                const raf = requestAnimationFrame(() => setPulsing(true));
                const t = setTimeout(() => setPulsing(false), 520);
                return () => { cancelAnimationFrame(raf); clearTimeout(t); };
            }
        }
    }, [value, emphasis]);
    return (_jsxs("div", { "aria-label": value, role: "img", style: {
            display: 'inline-flex', lineHeight: 0, transformOrigin: 'center', color: theme.ink,
            animation: pulsing ? 'flapPulse 480ms ease' : undefined,
            ['--flap-face']: theme.face, ['--flap-seam']: theme.seam,
        }, children: [_jsx("style", { children: KEYFRAMES }), _jsx("div", { style: { display: 'flex', gap, alignItems: 'stretch' }, children: [...value].map((ch, i) => ch === ':'
                    ? _jsx(FlapColon, { h: height, seam: seam }, i)
                    : _jsx(FlapDigit, { digit: ch, direction: dir, h: height, seam: seam, firstStep: firstStep, restStep: restStep }, i)) })] }));
}
