// roadArrow.ts — der „Straßenmarkierungs"-Pfeil: EIN Körper (Arm + Gelenk + integrierte
// Spitze) als ein einziger geschlossener Umriss. Ein Gelenk = der Abbiege-Grad. Reines
// Pfad-Modell (viewBox 0 0 100 110), wird schwarz umrandet/weiß gefüllt gerendert.
// Genutzt vom Dock-Pfeil (Grad-Lehrer) UND später den Lehr-Pfeilen im Schild.

export type TurnSideHint = 'left' | 'right' | 'straight';
export type TurnDegreeHint = 'bearing' | 'hard';   // sanft | scharf
export interface TurnHint { side: TurnSideHint; degree?: TurnDegreeHint; }

// Knick-Winkel je Grad (2 Stufen). Geradeaus = 0.
const BEND_DEG: Record<TurnDegreeHint, number> = { bearing: 30, hard: 66 };

// SVG-Pfad des Pfeils für viewBox "0 0 100 110".
//   center=true (Default): der Umriss wird horizontal zentriert (für die Lehr-Boxen — Pfeil
//     sitzt mittig in seiner Box).
//   center=false: der senkrechte Schaft (Basis) hält seine Position bei x=50, nur der OBERE
//     Teil + Spitze knickt — für den lebenden Dock-Pfeil.
export function roadArrowPath(hint: TurnHint, opts?: { center?: boolean }): string {
  const dir = hint.side === 'left' ? -1 : hint.side === 'right' ? 1 : 0;
  const bend = hint.side === 'straight' ? 0 : BEND_DEG[hint.degree ?? 'bearing'];
  const B = [50, 98], J = [50, 57], seg = 27, hw = 8, headHw = 17.2, headLen = 17;
  const a = (dir * bend) * Math.PI / 180;
  const d2 = [Math.sin(a), -Math.cos(a)];                 // obere Richtung (a=0 → hoch)
  const Tb = [J[0] + d2[0] * seg, J[1] + d2[1] * seg];    // Spitzen-Basis
  const n1 = [-1, 0], n2 = [d2[1], -d2[0]];               // Links-Normalen der beiden Segmente
  let mm = [n1[0] + n2[0], n1[1] + n2[1]];                // Gelenk-Miter (Winkelhalbierende)
  const ml = Math.hypot(mm[0], mm[1]) || 1; mm = [mm[0] / ml, mm[1] / ml];
  const den = Math.max(0.45, mm[0] * n1[0] + mm[1] * n1[1]), sc = hw / den;
  const Jl = [J[0] + mm[0] * sc, J[1] + mm[1] * sc], Jr = [J[0] - mm[0] * sc, J[1] - mm[1] * sc];
  const Bl = [B[0] + n1[0] * hw, B[1]], Br = [B[0] - n1[0] * hw, B[1]];
  // Kopf-Basis tiefer ziehen (barbDrop) → die zwei Querkanten der Spitze gehen runter, der Kopf
  // wird größer; die Spitze selbst bleibt oben (Größenordnung ~3× Strokestärke).
  const barbDrop = 10;
  const Hb = [Tb[0] - d2[0] * barbDrop, Tb[1] - d2[1] * barbDrop];
  const Tl = [Hb[0] + n2[0] * hw, Hb[1] + n2[1] * hw], Tr = [Hb[0] - n2[0] * hw, Hb[1] - n2[1] * hw];
  const bL = [Hb[0] + n2[0] * headHw, Hb[1] + n2[1] * headHw], bR = [Hb[0] - n2[0] * headHw, Hb[1] - n2[1] * headHw];
  const tip = [Tb[0] + d2[0] * headLen, Tb[1] + d2[1] * headLen];
  // Optional horizontal zentrieren (Lehr-Boxen). Beim Dock-Pfeil NICHT: dann hält der
  // Schaft (Basis x=50) seine Position, nur der obere Teil + Spitze knickt zur Seite.
  let shift = 0;
  if (opts?.center ?? true) {
    const pts = [Bl, Jl, Tl, bL, tip, bR, Tr, Jr, Br];
    let minX = Infinity, maxX = -Infinity;
    for (const p of pts) { if (p[0] < minX) minX = p[0]; if (p[0] > maxX) maxX = p[0]; }
    shift = 50 - (minX + maxX) / 2;
  }
  const P = (p: number[]) => `${(p[0] + shift).toFixed(1)} ${p[1].toFixed(1)}`;
  return `M ${P(Bl)} L ${P(Jl)} L ${P(Tl)} L ${P(bL)} L ${P(tip)} L ${P(bR)} L ${P(Tr)} L ${P(Jr)} L ${P(Br)} Z`;
}
