// FlapGuide — die Meter-Anzeige (Distanz bis zur nächsten Entscheidung) im Dock.
// BOXLOSE, STATISCHE Ziffern (kein Klappen — das gibt auf transparentem Grund Geister-
// Fragmente). Farbig nach Nähe (weit = weiß → beige/gelb/orange → am Abzweig rot), ohne
// Einheit. Der Richtungs-Pfeil ist NICHT mehr Teil hiervon — er wird vom Aufrufer separat
// positioniert (roadArrow), entkoppelt von der Uhr-Breite. Ab 4 Stellen schrumpfen die
// Ziffern in den festen 3-Stellen-Platz.
import { FLAP_DIGITS } from './flapGlyphs';

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
    <svg width={w} height={h} viewBox="0 0 92 102" style={{ display: 'block', filter: 'drop-shadow(0 1.5px 1px rgba(0,0,0,0.7))' }} aria-hidden>
      <path d={d} fill={color} transform={`translate(${tx.toFixed(2)},0)`} />
    </svg>
  );
}

export default function FlapGuide({ meters, dockHeight, offRoute, colorMeters }: {
  meters: number; dockHeight: number; offRoute?: boolean;
  colorMeters?: number;   // Distanz NUR für die Farbe (geglättet); Ziffern bleiben `meters`
}) {
  const m = Math.max(0, Math.round(meters));
  const cm = Math.max(0, colorMeters ?? m);
  const color = offRoute ? '#df2e1f' : meterColor(cm);
  const hM = Math.round(dockHeight * 0.66);            // = Größe der ±-Delta-Ziffern
  const dgap = Math.max(2, Math.round(hM * 0.045));
  const digitW = Math.round((hM * 92) / 100);
  const slotW = 3 * digitW + 2 * dgap;                // IMMER 3-Stellen-Raum (Einer rechtsbündig fix)
  const digits = String(m);
  const dh = digits.length > 3 ? Math.round((hM * 3) / digits.length) : hM;  // ab 4 Stellen schrumpfen
  return (
    <div style={{
      width: slotW, display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', gap: dgap,
    }}>
      {[...digits].map((ch, i) => {
        const g = FLAP_DIGITS[ch];
        return g ? <Glyph key={i} d={g.d} advance={g.advance} h={dh} color={color} /> : null;
      })}
    </div>
  );
}
