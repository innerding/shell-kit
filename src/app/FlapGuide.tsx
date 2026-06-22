// FlapGuide — linke Begehungs-Anzeige: Richtung + Meter bis zur nächsten Entscheidung.
// BOXLOSE, STATISCHE Ziffern (kein Klappen — das verträgt sich nicht mit transparentem
// Hintergrund, gibt Geister-Fragmente). Gleiche Inter-Glyphen, gleiche Größe + Position
// wie die ±-Delta-Ziffern, nur ohne Box und farbig nach Nähe (weit = weiß, dann beige/
// gelb/orange, am Abzweig rot). Ohne Einheit/„m". Pfeil = hand-gezeichneter Polarstern-
// Pfeil, als Strich in der Meterfarbe, deutlich größer als die Ziffern.
import { FLAP_DIGITS } from './flapGlyphs';
import { roadArrowPath, type TurnHint } from './roadArrow';

// Stetiger Verlauf über 0–150 m: jeder Meterwert hat seine eigene Farbe (rot am Abzweig
// → orange → gelb → beige → weiß weit weg). Linear im RGB zwischen den Stützstellen.
const METER_STOPS: [number, [number, number, number]][] = [
  [0.0, [223, 46, 31]],    // rot
  [0.25, [232, 130, 26]],  // orange
  [0.5, [236, 194, 31]],   // gelb
  [0.75, [221, 206, 160]], // beige
  [1.0, [255, 255, 255]],  // weiß
];
function meterColor(m: number): string {
  const t = Math.max(0, Math.min(1, m / 150));
  for (let i = 1; i < METER_STOPS.length; i++) {
    if (t <= METER_STOPS[i][0]) {
      const [t0, c0] = METER_STOPS[i - 1];
      const [t1, c1] = METER_STOPS[i];
      const f = (t1 - t0) ? (t - t0) / (t1 - t0) : 0;
      const c = c0.map((v, k) => Math.round(v + (c1[k] - v) * f));
      return `rgb(${c[0]},${c[1]},${c[2]})`;
    }
  }
  return 'rgb(255,255,255)';
}

function Glyph({ d, advance, h, color }: { d: string; advance: number; h: number; color: string }) {
  const w = Math.round((h * 92) / 100);
  const tx = (92 - advance) / 2;
  return (
    <svg width={w} height={h} viewBox="0 0 92 102" style={{ display: 'block' }} aria-hidden>
      <path d={d} fill={color} transform={`translate(${tx.toFixed(2)},0)`} />
    </svg>
  );
}

export default function FlapGuide({ meters, dockHeight, offRoute, colorMeters, turn }: {
  meters: number; dockHeight: number; offRoute?: boolean;
  colorMeters?: number;              // Distanz NUR für die Farbe (geglättet); Ziffern bleiben `meters`
  turn?: TurnHint | null;            // kommende Abbiegung → Grad-Lehrer-Pfeil; fehlt/null → geradeaus
}) {
  const m = Math.max(0, Math.round(meters));
  const cm = Math.max(0, colorMeters ?? m);             // Farb-Distanz (eased) — entkoppelt vom Ziffern-Sprung
  const color = offRoute ? '#df2e1f' : meterColor(cm);  // off-route → zwingend rot (zurück zum Weg)
  const hM = Math.round(dockHeight * 0.66);            // = Größe der ±-Delta-Ziffern
  const dgap = Math.max(2, Math.round(hM * 0.045));
  const gap = Math.max(2, Math.round(hM * 0.06));
  const aW = Math.round(hM * 1.8 * 1.33);              // Pfeil-Breite
  const aH = Math.round(aW * 1.1);                     // Pfeil etwas höher (viewBox 100×110)
  const digitW = Math.round((hM * 92) / 100);
  const slotW = 3 * digitW + 2 * dgap;                // IMMER 3-Stellen-Raum (Pfeil klebt links, Einer fix)
  const boxW = aW + gap + slotW;                      // feste Gesamtbreite → Pfeil wandert NICHT mit den Ziffern
  const digits = String(m);
  const dh = digits.length > 3 ? Math.round((hM * 3) / digits.length) : hM;  // ab 4 Stellen schrumpfen
  return (
    <div style={{
      width: boxW, display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-start', gap,
      filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.45))',
    }}>
      {/* Straßenmarkierungs-Pfeil: ein Körper, schwarzer Stroke / weiße Fill, ein Gelenk = Grad.
          Keine eigene Farbe (die trägt die Meter-Zahl). */}
      <svg width={aW} height={aH} viewBox="0 0 100 110" aria-hidden style={{ display: 'block', flexShrink: 0 }}>
        <path d={roadArrowPath(turn ?? { side: 'straight' })} fill="#ffffff" stroke="#111111" strokeWidth={4} strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      <div style={{ width: slotW, flexShrink: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', gap: dgap }}>
        {[...digits].map((ch, i) => {
          const g = FLAP_DIGITS[ch];
          return g ? <Glyph key={i} d={g.d} advance={g.advance} h={dh} color={color} /> : null;
        })}
      </div>
    </div>
  );
}
