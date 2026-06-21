// CrossingRose.tsx — das Kreuzungsrose-Glyph (Guidance-OSM-Kopplung, M-D.2). Zeichnet
// aus dem CrossingRoseState (crossingRose.ts): begangener Weg als Pfeil (Austritts-
// Linie + Spitze, dazu die Eintritts-Linie = das Route-„V"), die anderen Arme als
// Stubs (2/3 Länge). Eintritts-Linie + Stubs WACHSEN mit dem Morph p (0 = schlichter
// Pfeil, 1 = volle Rose). Alles relativ zur Blickrichtung (oben = wohin du schaust).
// Spec: docs/guidance_kreuzungsrose_spec.md.
import type { CrossingRoseState } from './crossingRose';

// Punkt im Abstand `len` unter Winkel `deg` (0 = oben, im Uhrzeigersinn) ab (cx,cy).
function at(cx: number, cy: number, len: number, deg: number): [number, number] {
  const a = (deg * Math.PI) / 180;
  return [cx + len * Math.sin(a), cy - len * Math.cos(a)];
}

export default function CrossingRose({ state, size = 56 }: {
  state: CrossingRoseState;
  size?: number;
}) {
  // Narration: viele Wege, keiner schlecht → gleiche Rampe; der richtige (Austritt) ist
  // der RÖTESTE (exitColor), Eintritt + andere Arme eine Stufe heller (restColor).
  const { p, entryAngleRel, exitAngleRel, stubAnglesRel, tipOpacity, exitColor: color, restColor: stubColor } = state;
  const c = size / 2;
  const full = size * 0.42;          // Arm-Länge
  const stubLen = full * (2 / 3);    // andere Arme: 2/3
  const sw = Math.max(2, size * 0.11); // Strichstärke

  const [ex, ey] = at(c, c, full, exitAngleRel);            // Austritts-Ende (Spitze)
  const [enx, eny] = at(c, c, full * p, entryAngleRel);     // Eintritts-Ende (wächst mit p)
  // Pfeilspitze: zwei Barbs, die am Austritts-Ende zusammentreffen.
  const [b1x, b1y] = at(ex, ey, sw * 1.9, exitAngleRel + 150);
  const [b2x, b2y] = at(ex, ey, sw * 1.9, exitAngleRel - 150);
  const tipPath = `M ${b1x.toFixed(1)} ${b1y.toFixed(1)} L ${ex.toFixed(1)} ${ey.toFixed(1)} L ${b2x.toFixed(1)} ${b2y.toFixed(1)}`;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden
      style={{ display: 'block', overflow: 'visible', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.45))' }}>
      {/* andere Arme (Stubs) — wachsen mit p */}
      {p > 0.01 && stubAnglesRel.map((ang, i) => {
        const [x, y] = at(c, c, stubLen * p, ang);
        return <line key={i} x1={c} y1={c} x2={x} y2={y}
          stroke={stubColor} strokeWidth={sw} strokeLinecap="round" opacity={0.5 + 0.5 * p} />;
      })}
      {/* Eintritts-Linie (woher du kamst) — heller (restColor), wächst mit p */}
      {p > 0.01 && <line x1={c} y1={c} x2={enx} y2={eny} stroke={stubColor} strokeWidth={sw} strokeLinecap="round" />}
      {/* Austritts-Linie (immer) */}
      <line x1={c} y1={c} x2={ex} y2={ey} stroke={color} strokeWidth={sw} strokeLinecap="round" />
      {/* Spitze — fadet beim Wegschauen */}
      <path d={tipPath} stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={tipOpacity} />
    </svg>
  );
}
