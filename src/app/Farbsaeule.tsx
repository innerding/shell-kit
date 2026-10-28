// Farbsaeule — der Einsteller der Farbwelt (28.10.2026, o-o-o-o.app bauhuette/border-mesh-point Blatt 131, Teil B, sein
// „bau es"). Ersetzt die Säule aus SCIM3 P01 (ThresholdColumn) in der Ziel-App; SCIM3 behält seine eigene.
//
// Eingestellt werden 2 bis 6 Farben, unten wenig Last, oben viel, und ihre Stösse. Die Säule zeigt sie als Verlauf von
// Feldmitte zu Feldmitte — ohne Haken als harte Felder —, an jedem Stoss ein Schieber, der die beiden Nachbarfelder ändert und
// sonst nichts. Daneben die sechs Felder, mit denen das System rechnet (sechsFelder), nur zum Ansehen. Die Griffe sind die
// Rechnungen aus ./scale (stossSetzen, feldDazu, feldWeg), dieselben, die o-o-o-o.app nimmt. Kein Mittelfeld, keine
// Kopplung, kein Umsortieren.
import { useEffect, useRef, useState } from 'react';
import { feldDazu, feldWeg, saeulenHintergrund, sechsFelder, stossSetzen, FELDER_MAX, type Einstellung } from './scale';

const HOEHE = 220;

function toHex(c: string): string {
  const s = c.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(s)) return s.toLowerCase();
  if (/^#[0-9a-fA-F]{3}$/.test(s)) return '#' + s.slice(1).split('').map((x) => x + x).join('').toLowerCase();
  const m = s.match(/rgba?\(([^)]+)\)/);
  if (m) {
    const [r, g, b] = m[1].split(',').map((x) => Math.max(0, Math.min(255, Math.round(parseFloat(x)))));
    return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
  }
  return '#888888';
}

export default function Farbsaeule({ einstellung, onChange, onReset, resetLabel, mitVerlauf = true }: {
  einstellung: Einstellung;
  onChange: (e: Einstellung) => void;
  /** Zurück auf die Einstellung darüber (in der Ziel-App: die Farben der Karte). */
  onReset?: () => void;
  resetLabel?: string;
  /** Ohne Haken zeigt die Säule harte Felder statt des Verlaufs (der Operator prüft damit die Technik). */
  mitVerlauf?: boolean;
}) {
  const [zug, setZug] = useState<Einstellung | null>(null);
  const zugIdx = useRef<number | null>(null);
  const balken = useRef<HTMLDivElement>(null);
  useEffect(() => { setZug(null); zugIdx.current = null; }, [einstellung]);

  const e = zug ?? einstellung;
  const n = e.stops.length;
  const sechs = sechsFelder(e);
  const lastAn = (clientY: number): number => {
    const r = balken.current?.getBoundingClientRect();
    return r ? Math.max(0, Math.min(1, 1 - (clientY - r.top) / r.height)) : 0.5;
  };
  const runter = (i: number) => (ev: React.PointerEvent) => {
    ev.preventDefault(); ev.stopPropagation();
    (ev.target as HTMLElement).setPointerCapture(ev.pointerId);
    zugIdx.current = i; setZug(einstellung);
  };
  const ziehen = (i: number) => (ev: React.PointerEvent) => {
    if (zugIdx.current !== i) return;
    setZug((z) => stossSetzen(z ?? einstellung, i, lastAn(ev.clientY)));
  };
  const hoch = (i: number) => (ev: React.PointerEvent) => {
    if (zugIdx.current !== i) return;
    try { (ev.target as HTMLElement).releasePointerCapture(ev.pointerId); } catch { /* */ }
    zugIdx.current = null;
    if (zug) onChange(zug);
    setZug(null);
  };
  const farbe = (i: number, c: string) => onChange({ stops: einstellung.stops.map((x, k) => (k === i ? c.toLowerCase() : x)), borders: [...einstellung.borders] });
  const oben = Array.from({ length: n }, (_, k) => n - 1 - k);

  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexShrink: 0 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', height: HOEHE }}>
          <div ref={balken} style={{ width: 46, height: HOEHE, borderRadius: 4, border: '1px solid #cbd5e0', background: saeulenHintergrund(e, mitVerlauf) }} />
          <div style={{ position: 'relative', width: 24, height: HOEHE }}>
            {e.borders.map((b, i) => (
              <div
                key={i}
                onPointerDown={runter(i)} onPointerMove={ziehen(i)} onPointerUp={hoch(i)} onPointerCancel={hoch(i)}
                title={`Stoss ${i + 1}: ${Math.round(b * 100)} %`}
                style={{ position: 'absolute', left: 1, right: 0, top: `calc(${(1 - b) * 100}% - 8px)`, height: 16, display: 'flex', alignItems: 'center', cursor: 'ns-resize', touchAction: 'none' }}
              >
                <div style={{ flex: 1, height: zugIdx.current === i ? 3 : 2, background: '#1a365d', borderRadius: 1 }} />
              </div>
            ))}
          </div>
        </div>
        {onReset && (
          <button onClick={onReset} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 3, border: '1px solid #e2e8f0', background: '#f7fafc', color: '#718096', cursor: 'pointer' }}>↺ {resetLabel ?? 'zurück'}</button>
        )}
      </div>

      <div style={{ width: 84 }}>
        <div style={{ fontSize: 8.5, color: '#a0aec0', marginBottom: 2 }}>↑ viel Last</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {oben.map((i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 4px', borderRadius: 4, background: '#fff', border: '1px solid #edf2f7' }}>
              <input type="color" value={toHex(e.stops[i])} onChange={(ev) => farbe(i, ev.target.value)} style={{ width: 30, height: 24, border: 'none', background: 'none', cursor: 'pointer' }} />
              {n > 2 && (
                <button onClick={() => onChange(feldWeg(einstellung, i))} title="diese Farbe weg" style={{ marginLeft: 'auto', fontSize: 13, border: 'none', background: 'none', color: '#a0aec0', cursor: 'pointer' }}>×</button>
              )}
            </div>
          ))}
          {n < FELDER_MAX && (
            <button onClick={() => onChange(feldDazu(einstellung))} title="eine Farbe dazu, oben" style={{ marginTop: 2, alignSelf: 'flex-start', width: 30, height: 26, borderRadius: 4, border: '1px dashed #cbd5e0', background: '#f7fafc', color: '#4a5568', cursor: 'pointer', fontSize: 16 }}>+</button>
          )}
        </div>
        <div style={{ fontSize: 8.5, color: '#a0aec0', marginTop: 2 }}>↓ wenig Last</div>
      </div>

      {/* Die sechs Felder, mit denen das System rechnet — nur zum Ansehen. */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        <div title="die sechs Felder, mit denen das System rechnet" style={{ width: 22, height: HOEHE, borderRadius: 4, border: '1px solid #cbd5e0', background: saeulenHintergrund({ stops: sechs.stops, borders: sechs.borders ?? [] }, false) }} />
        <div style={{ fontSize: 9, color: '#a0aec0' }}>6</div>
      </div>
    </div>
  );
}
