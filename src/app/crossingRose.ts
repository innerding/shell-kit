// crossingRose.ts — die „Kreuzungsrose" (Guidance-OSM-Kopplung, M-D). PURE Geräte-Math:
// aus den via Origin mitgereisten Arm-Peilungen + Route + Heading + Abstand → der
// Render-Zustand des Glyphs (Wirbel-Abstufung wie Comfort + Morph + relative Winkel).
// Keine Leaflet-/React-/DOM-Abhängigkeit → in Node testbar.
// Spec: docs/guidance_kreuzungsrose_spec.md (scim_source).

// Tunbar (wie Comfort-Schwellen — später am lebenden Objekt nachziehen).
export const ROSE_TUNING = {
  alphaCapDeg: 60,        // ab diesem Arm-Abstand zum Austritt: kein Verwechslungsrisiko mehr
  manyArmsWeight: 0.15,   // Zuschlag für viele Arme (n>3)
  levelThresholds: [0.20, 0.45, 0.70] as [number, number, number], // ruhig|leicht|heikel|kritisch
  onsetWindowM: [0, 15, 30, 45] as [number, number, number, number], // Morph-Fenster ±W je Stufe (ruhig=0)
  tipFadeDeg: 90,         // Spitze fadet 0°→tipFadeDeg (wegschauen → weg)
};

// Vorzeichenbehaftete Winkel-Differenz a−b in (−180, 180].
function angleDelta(a: number, b: number): number {
  return ((a - b + 540) % 360) - 180;
}
// Absolute Winkel-Differenz in [0, 180].
function angleDist(a: number, b: number): number {
  return Math.abs(angleDelta(a, b));
}

export type RoseLevel = 0 | 1 | 2 | 3; // ruhig | leicht | heikel | kritisch

export interface CrossingRoseState {
  wirbel: number;          // 0..1
  level: RoseLevel;
  p: number;               // 0..1 Morph (0 = schlichter Pfeil, 1 = volle Rose)
  entryAngleRel: number;   // Eintritts-Arm (woher), relativ zum Heading (deg)
  exitAngleRel: number;    // Austritts-Arm (mit Spitze), relativ zum Heading (deg)
  stubAnglesRel: number[]; // andere Arme (Stubs, nicht begangen), relativ zum Heading (deg)
  tipOpacity: number;      // 0..1 (Spitze fadet beim Wegschauen)
}

export interface CrossingRoseInput {
  arms: number[];          // absolute Arm-Peilungen der Kreuzung (deg)
  entryBearing: number;    // Route-Richtung beim Ankommen (absolut, deg)
  exitBearing: number;     // Route-Richtung beim Verlassen (absolut, deg)
  heading: number;         // aktuelles Heading/Blickrichtung (absolut, deg)
  distanceM: number;       // Abstand zur Kreuzungs-Mitte (m, ≥0)
}

export function crossingRoseState(inp: CrossingRoseInput): CrossingRoseState {
  const { arms, entryBearing, exitBearing, heading, distanceM } = inp;
  const T = ROSE_TUNING;

  // Ohne Arm-Daten (alter Bundle / Korridor): schlichter Abbiege-Pfeil, keine Rose.
  if (arms.length < 2) {
    return {
      wirbel: 0, level: 0, p: 0,
      entryAngleRel: angleDelta((entryBearing + 180) % 360, heading),
      exitAngleRel: angleDelta(exitBearing, heading),
      stubAnglesRel: [],
      tipOpacity: Math.max(0, 1 - angleDist(exitBearing, heading) / T.tipFadeDeg),
    };
  }

  // Austritts-/Eintritts-Arm = nächster Arm zur Route-Richtung (Eintritt = woher man kam).
  const nearestArm = (bearing: number) => {
    let best = 0, bestD = Infinity;
    for (let i = 0; i < arms.length; i++) { const d = angleDist(arms[i], bearing); if (d < bestD) { bestD = d; best = i; } }
    return best;
  };
  const exitI = nearestArm(exitBearing);
  const entryI = nearestArm((entryBearing + 180) % 360);

  // α = kleinster Winkel zwischen Austritts-Richtung und einem ANDEREN (Nicht-Eintritts-)Arm.
  let alpha = 180;
  for (let i = 0; i < arms.length; i++) {
    if (i === exitI || i === entryI) continue;
    alpha = Math.min(alpha, angleDist(arms[i], exitBearing));
  }

  // Wirbel: entweder scharfe Abbiegung (τ) ODER verwechselbarer Arm (α), + viele Arme.
  const tau = angleDist(exitBearing, entryBearing);
  const turn = tau / 180;
  const ambig = 1 - Math.min(alpha, T.alphaCapDeg) / T.alphaCapDeg;
  const manyArms = Math.max(0, Math.min(1, (arms.length - 3) / 2));
  const wirbel = Math.max(0, Math.min(1, Math.max(turn, ambig) + T.manyArmsWeight * manyArms));

  // Stufe + Onset-Fenster.
  const [t1, t2, t3] = T.levelThresholds;
  const level: RoseLevel = wirbel < t1 ? 0 : wirbel < t2 ? 1 : wirbel < t3 ? 2 : 3;
  const W = T.onsetWindowM[level];

  // Morph p (ruhig → 0; sonst stetig über ±W).
  const p = W <= 0 ? 0 : 1 - Math.max(0, Math.min(1, distanceM / W));

  // Relative Winkel (oben = Heading). Arme = echte Wegrichtungen.
  const exitAngleRel = angleDelta(arms[exitI], heading);
  const entryAngleRel = angleDelta(arms[entryI], heading);
  const stubAnglesRel: number[] = [];
  for (let i = 0; i < arms.length; i++) { if (i === exitI || i === entryI) continue; stubAnglesRel.push(angleDelta(arms[i], heading)); }

  // Spitze fadet, je weiter du vom Austritt wegschaust.
  const tipOpacity = Math.max(0, 1 - angleDist(arms[exitI], heading) / T.tipFadeDeg);

  return { wirbel, level, p, entryAngleRel, exitAngleRel, stubAnglesRel, tipOpacity };
}
