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
  // Spitze: IMMER solide. Kein Abdimmen, kein Wegschauen-Fade — das sah übel aus und der
  // Wirbel-/Morph-Effekt trägt die Information bereits. (Beschluss 2026-06-22.)
  bloomFadeOutM: 8,       // „kein Drehen"-Modell: die Rosen-Blüte (Stubs+Eintritt) fadet in den letzten
                          // Metern vor der Kreuzungs-Mitte aus → an der Kreuzung bleibt nur der Hoch-Pfeil.
  stubColor: '#caa01c',   // „andere Wege" (Stubs): fester warmer Gelbton, eigenständig (nicht auf der Meter-Rampe)
};

// Meter-Farbe: an der Kreuzung rot → weit weg weiß (gleiche Rampe wie FlapGuide).
// Narration: viele Wege, keiner schlecht → gleiche Rampe; der richtige ist der röteste.
const METER_STOPS: Array<[number, [number, number, number]]> = [
  [0.0, [223, 46, 31]],    // rot (an der Kreuzung)
  [0.25, [232, 130, 26]],  // orange
  [0.5, [236, 194, 31]],   // gelb
  [0.75, [221, 206, 160]], // beige
  [1.0, [255, 255, 255]],  // weiß (weit weg)
];
export function meterColor(m: number): string {
  const t = Math.max(0, Math.min(1, m / 150));
  for (let i = 1; i < METER_STOPS.length; i++) {
    if (t <= METER_STOPS[i][0]) {
      const [t0, c0] = METER_STOPS[i - 1], [t1, c1] = METER_STOPS[i];
      const f = (t1 - t0) ? (t - t0) / (t1 - t0) : 0;
      const c = c0.map((v, k) => Math.round(v + (c1[k] - v) * f));
      return `rgb(${c[0]},${c[1]},${c[2]})`;
    }
  }
  return 'rgb(255,255,255)';
}

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
  exitAngleRel: number;    // Austritts-/Vorwärts-Pfeil: im „kein Drehen"-Modell IMMER 0 (senkrecht hoch)
  stubAnglesRel: number[]; // andere Arme (Stubs, nicht begangen), relativ zum Heading (deg)
  bloomOpacity: number;    // 0..1 Deckkraft der Blüte (Stubs+Eintritt) — fadet an der Kreuzung aus
  tipOpacity: number;      // 0..1 (Spitze — konstant 1)
  exitColor: string;       // Farbe des begangenen Wegs = Meter-Farbe (der RÖTESTE)
  restColor: string;       // Farbe der anderen Arme + Eintritt = gleiche Rampe, heller
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

  const exitColor = meterColor(distanceM);
  const restColor = T.stubColor;

  // Ohne Arm-Daten (alter Bundle / Korridor): schlichter Abbiege-Pfeil, keine Rose.
  if (arms.length < 2) {
    return {
      wirbel: 0, level: 0, p: 0,
      entryAngleRel: angleDelta((entryBearing + 180) % 360, heading),
      exitAngleRel: 0,   // Vorwärts-Pfeil: immer senkrecht hoch
      stubAnglesRel: [],
      bloomOpacity: 1,
      tipOpacity: 1,     // Spitze immer solide
      exitColor, restColor,
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

  // „Kein Drehen"-Modell (Beschluss 2026-06-22): der Vorwärts-Pfeil zeigt IMMER senkrecht
  // hoch (= deine Laufrichtung), er dreht nie. Oben = stabile Anflug-Richtung (vom Aufrufer
  // als heading übergeben) → kein Zappeln. Die anderen Arme + der Eintritt blühen als Rose
  // auf (Achtung-Hinweis) und faden an der Kreuzung wieder aus; die Abbiegung selbst zeigt
  // die Route auf der Karte.
  const exitAngleRel = 0;
  const entryAngleRel = angleDelta(arms[entryI], heading);
  const stubAnglesRel: number[] = [];
  for (let i = 0; i < arms.length; i++) { if (i === exitI || i === entryI) continue; stubAnglesRel.push(angleDelta(arms[i], heading)); }
  // Blüten-Deckkraft: in den letzten bloomFadeOutM vor der Kreuzungs-Mitte stetig auf 0
  // → die Rose „fadet aus", übrig bleibt der Hoch-Pfeil fürs nächste Wegstück.
  const bloomOpacity = Math.max(0, Math.min(1, distanceM / T.bloomFadeOutM));

  const tipOpacity = 1;   // Spitze immer solide (kein Abdimmen/Wegschauen-Fade)

  return { wirbel, level, p, entryAngleRel, exitAngleRel, stubAnglesRel, bloomOpacity, tipOpacity, exitColor, restColor };
}
