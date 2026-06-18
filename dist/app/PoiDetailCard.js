import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// POI-Detail-Card (ann_143) — das POI-Modal. Öffnet per Long-tap ODER bei Überlast
// vom System; sieht in beiden Fällen gleich aus (Last-Zustand entscheidet, nicht der
// Trigger). Reiner HINWEIS: KEIN Knopf, KEIN × — Tap aufs Modal = weg. An-/abgewählt
// wird auf der KARTE. Rahmen in der Comfort-EINSTELL-Farbe (frameColor), innen die
// leuchtende Diode (tatsächliche Last) + ein obligatorisches Achtung-Triangle, das über
// Comfort pulst. Wiederverwendbar als S4-Ankunfts-Card (variant='arrival').
// i18n-agnostisch: die paar Labels reicht der Host als `labels`-Prop rein (Texte bleiben app-seitig).
import ComfortDiode from './ComfortDiode';
import WarnTriangle from './WarnTriangle';
import { GLASS } from './glass';
const NAVY = '#1b2a6b';
export default function PoiDetailCard({ svgHtml, title, description, photo, link, onClose, variant = 'detail', members, hint, flagSvg, comfort, frameColor, summary, clearRight = 0, labels, }) {
    const arrival = variant === 'arrival';
    // Ankunfts-/Ziel-Modal trägt KEINE POI-Last-Anzeige (kein Diode, kein Last-Wasserzeichen).
    const intensity = arrival ? 0 : (comfort?.intensity ?? 0);
    const border = arrival ? `2px solid ${NAVY}` : frameColor ? `3px solid ${frameColor}` : '1px solid rgba(20,34,62,0.10)';
    return (_jsx("div", { onClick: onClose, style: {
            position: 'fixed', inset: 0, zIndex: 10010, // ÜBER dem telco-sim-Band (zIndex 10000)
            display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 38,
            // Achtung-Modal: rechts den offenen Slider freihalten (+ links etwas Luft).
            paddingLeft: clearRight ? 12 : undefined, paddingRight: clearRight || undefined,
            backdropFilter: 'blur(1.5px)', WebkitBackdropFilter: 'blur(1.5px)', // nur Blur, kein Abdunkeln
            fontFamily: 'Polarstern, system-ui,-apple-system,sans-serif',
        }, children: _jsx("div", { role: "dialog", "aria-label": title, onClick: (e) => e.stopPropagation(), style: {
                ...GLASS, // Glass-Panel = äußerer Fill (gemeinsamer Look)
                position: 'relative', width: clearRight ? 'min(360px, 100%)' : 'min(86vw, 360px)',
                color: '#14223e', borderRadius: 18, padding: 7, // padding = Passepartout-Luft um den Last-Stroke
                boxShadow: '0 12px 44px rgba(0,0,0,0.34)',
            }, children: _jsxs("div", { style: { position: 'relative', border, borderRadius: 12, overflow: 'hidden', maxHeight: '78vh', overflowY: 'auto', background: 'rgba(255,255,255,0.34)' }, children: [_jsx(WarnTriangle, { intensity: intensity, color: comfort?.color ?? '#d1495b' }), _jsxs("div", { style: { position: 'relative', zIndex: 1 }, children: [summary && summary.length > 0 && (_jsx("div", { style: { display: 'flex', flexWrap: 'wrap', gap: 14, padding: '16px 16px 4px', justifyContent: 'center' }, children: summary.map((s, i) => (_jsx("span", { style: { display: 'block', width: s.size, height: s.size, lineHeight: 0 }, dangerouslySetInnerHTML: { __html: s.html } }, i))) })), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px 10px' }, children: [summary
                                        ? null
                                        : svgHtml
                                            ? _jsx("span", { style: { flexShrink: 0, width: 48, height: 48, lineHeight: 0 }, dangerouslySetInnerHTML: { __html: svgHtml } })
                                            : _jsx("span", { style: { flexShrink: 0, width: 48, height: 48, borderRadius: '50%', background: 'rgba(20,34,62,0.08)' } }), _jsx("div", { style: { flex: 1, minWidth: 0 }, children: _jsxs("div", { style: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, font: '700 16px/1.3 Polarstern, system-ui,sans-serif' }, children: [_jsx("span", { children: title }), arrival && flagSvg ? (
                                                /* Ziel erreicht: die Ziel-Flagge (×1.6, 32px) STATT einer POI-Last-Anzeige,
                                                   vertikal mittig zum Titel (Zeile = alignItems center). */
                                                _jsx("span", { "aria-hidden": true, style: { display: 'inline-block', width: 32, height: 32, lineHeight: 0 }, dangerouslySetInnerHTML: { __html: flagSvg } })) : comfort && comfort.word ? (_jsx(ComfortDiode, { color: comfort.color, word: comfort.word, intensity: comfort.intensity })) : null] }) })] }), photo && (_jsx("div", { style: { padding: '0 16px 4px' }, children: _jsx("img", { src: photo, alt: title, style: { width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 10, display: 'block' } }) })), _jsxs("div", { style: { padding: '2px 16px 14px' }, children: [description
                                        ? _jsx("p", { style: { margin: 0, font: '400 13.5px/1.5 Polarstern, system-ui,sans-serif', color: '#33415c' }, children: description })
                                        : _jsx("p", { style: { margin: 0, font: 'italic 400 12.5px/1.5 Polarstern, system-ui,sans-serif', color: '#9aa6bd' }, children: labels.noDescription }), link && (_jsx("a", { href: link, target: "_blank", rel: "noopener noreferrer", onClick: (e) => e.stopPropagation(), style: { display: 'inline-block', marginTop: 8, font: '600 12.5px/1 Polarstern, system-ui,sans-serif', color: NAVY, textDecoration: 'none' }, children: labels.learnMore })), members && members.length > 0 && (_jsxs("div", { style: { marginTop: 10 }, children: [_jsx("div", { style: { font: '700 10px/1 Polarstern, system-ui,sans-serif', letterSpacing: '0.06em', color: '#9aa6bd', marginBottom: 6 }, children: labels.targets(members.length) }), _jsx("div", { style: { display: 'flex', flexWrap: 'wrap', gap: 4 }, children: members.map((m, i) => (_jsx("span", { style: { font: '500 11.5px/1.1 Polarstern, system-ui,sans-serif', color: '#33415c', background: 'rgba(20,34,62,0.06)', borderRadius: 6, padding: '3px 7px' }, children: m }, i))) })] })), hint && (_jsxs("div", { style: { marginTop: 12, font: '600 12px/1.3 Polarstern, system-ui,sans-serif', color: NAVY, display: 'flex', alignItems: 'center', gap: 6 }, children: [_jsx("span", { "aria-hidden": true, style: { fontSize: 14 }, children: "\u2295" }), hint] }))] })] })] }) }) }));
}
