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
  // Route (Eintritt + Austritt) = Meter-Farbe (an der Kreuzung rot); die anderen Arme
  // = fester Gelbton (restColor). Spitze nur am Austritt.
  const { p, entryAngleRel, exitAngleRel, stubAnglesRel, tipOpacity, exitColor: color, restColor: stubColor } = state;
  const c = size / 2;
  const full = size * 0.42;          // Arm-Länge
  const stubLen = full * (2 / 3);    // andere Arme: 2/3
  const sw = Math.max(2, size * 0.11); // Strichstärke

  const [ex, ey] = at(c, c, full, exitAngleRel);            // Austritts-Ende (Spitze)
  const [enx, eny] = at(c, c, full * p, entryAngleRel);     // Eintritts-Ende (wächst mit p)
  // Pfeilspitze: gefülltes Dreieck am Austritts-Ende — klar als Spitze lesbar.
  const headLen = sw * 2.2, headW = sw * 1.5;
  const [bcx, bcy] = at(ex, ey, headLen, exitAngleRel + 180);     // Basis-Mitte (zurück)
  const [t1x, t1y] = at(bcx, bcy, headW, exitAngleRel + 90);
  const [t2x, t2y] = at(bcx, bcy, headW, exitAngleRel - 90);
  const tipPath = `M ${ex.toFixed(1)} ${ey.toFixed(1)} L ${t1x.toFixed(1)} ${t1y.toFixed(1)} L ${t2x.toFixed(1)} ${t2y.toFixed(1)} Z`;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden
      style={{ display: 'block', overflow: 'visible', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.45))' }}>
      {/* andere Arme (Stubs) — wachsen mit p */}
      {p > 0.01 && stubAnglesRel.map((ang, i) => {
        const [x, y] = at(c, c, stubLen * p, ang);
        return <line key={i} x1={c} y1={c} x2={x} y2={y}
          stroke={stubColor} strokeWidth={sw} strokeLinecap="round" opacity={0.5 + 0.5 * p} />;
      })}
      {/* Eintritts-Linie (zweite Hälfte des Route-„V") — Meter-Farbe, wächst mit p */}
      {p > 0.01 && <line x1={c} y1={c} x2={enx} y2={eny} stroke={color} strokeWidth={sw} strokeLinecap="round" />}
      {/* Austritts-Linie (immer) — endet an der Spitzen-Basis, damit die Spitze scharf bleibt */}
      <line x1={c} y1={c} x2={bcx} y2={bcy} stroke={color} strokeWidth={sw} strokeLinecap="round" />
      {/* Spitze (gefülltes Dreieck, scharfe Ecken) — fadet beim Wegschauen */}
      <path d={tipPath} fill={color} opacity={tipOpacity} />
    </svg>
  );
}
