// ThresholdColumn — der Felder/Grenzen-Editor einer Skala (Verlauf-Schauglas + Farb-Liste).
// Eine Säule der Thresholds-Kaskade. Aus SCIM3 (P01) nach shell-kit gezogen, damit SCIM3
// (voller Editor) UND die Runtime-Farbwelt (nur `editable='borders'` = die „letzte Instanz")
// DIESELBE Komponente teilen. Modell-agnostisch: arbeitet auf {stops, borders, middleField}.
//
//   editable='full'    → +Farbe / × / Mittelschieber / Drag-Reorder / Farbwähler (SCIM3 P01)
//   editable='borders' → nur Grenzen ziehen + zurücksetzen (Runtime-Farbwelt, kein Rückfluss)
import { useState, useRef, useEffect } from 'react';

export interface ThresholdColumnSettings {
  /** 2–6 Farb-Felder (grün→rot, unten→oben). */
  stops: string[];
  /** N−1 innere Feldgrenzen (Load 0..1, sortiert) — die Grenzen sind die Wahrheit. */
  borders: number[];
  /** Zentriert gehaltenes Mittelfeld (Index) oder null/undefined. */
  middleField?: number | null;
}

const PV_H = 220;
const GAP = 0.02;
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

export function evenBorders(n: number): number[] {
  if (n <= 1) return [];
  return Array.from({ length: n - 1 }, (_, i) => (i + 1) / n);
}

const fieldHi = (b: number[], i: number, n: number) => (i === n - 1 ? 1 : b[i]);
const fieldLo = (b: number[], i: number) => (i === 0 ? 0 : b[i - 1]);
const fieldCenter = (b: number[], i: number, n: number) => (fieldLo(b, i) + fieldHi(b, i, n)) / 2;

function gradientCss(stops: string[], borders: number[]): string {
  const n = stops.length;
  const parts = [`${stops[0]} 0%`];
  for (let i = 0; i < n; i++) parts.push(`${stops[i]} ${(fieldCenter(borders, i, n) * 100).toFixed(2)}%`);
  parts.push(`${stops[n - 1]} 100%`);
  return `linear-gradient(to top, ${parts.join(', ')})`;
}

function centerFieldBorders(n: number, c: number): number[] {
  c = Math.max(0, Math.min(n - 1, c));
  const half = 1 / (2 * n);
  const lo = 0.5 - half, hi = 0.5 + half;
  const below = c, above = n - 1 - c;
  const out: number[] = [];
  for (let i = 0; i <= n - 2; i++) {
    if (i < c) out.push(below > 0 ? (i + 1) * (lo / below) : lo);
    else if (i === c) out.push(hi);
    else out.push(above > 0 ? hi + (i - c) * ((1 - hi) / above) : hi);
  }
  return out.map((x) => Math.min(0.999, Math.max(0.001, x)));
}

function toHex(c: string): string {
  const s = c.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(s)) return s;
  if (/^#[0-9a-fA-F]{3}$/.test(s)) return '#' + s.slice(1).split('').map((x) => x + x).join('');
  const m = s.match(/rgba?\(([^)]+)\)/);
  if (m) {
    const [r, g, b] = m[1].split(',').map((x) => Math.max(0, Math.min(255, Math.round(parseFloat(x)))));
    return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
  }
  return '#888888';
}

export default function ThresholdColumn({ title, settings, onChange, onReset, resetLabel, dimmed = false, editable = 'full' }: {
  title: string;
  settings: ThresholdColumnSettings;
  onChange: (patch: Partial<ThresholdColumnSettings>) => void;
  onReset?: () => void;                 // eltern-bezogenes Zurücksetzen (Default der nächsthöheren Instanz)
  resetLabel?: string;
  dimmed?: boolean;                    // abgedimmt + tot (technischer Ursprung)
  editable?: 'full' | 'borders';       // 'borders' = kein +Farbe / kein × / kein Mittelschieber
}) {
  const s = settings;
  const n = s.stops.length;
  const full = editable === 'full';

  const [tweenB, setTweenB] = useState<number[] | null>(null);
  const [dragB, setDragB] = useState<number[] | null>(null);
  const [leftDrag, setLeftDrag] = useState<number | null>(null);
  const rafRef = useRef(0);
  const barRef = useRef<HTMLDivElement>(null);
  const dragIdx = useRef<number | null>(null);
  const leftDragging = useRef(false);
  const dndIdx = useRef<number | null>(null);

  useEffect(() => { setTweenB(null); setDragB(null); }, [settings]);
  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  const borders = dragB ?? tweenB ?? s.borders;

  const animateTo = (from: number[], to: number[]) => {
    cancelAnimationFrame(rafRef.current);
    const start = performance.now(), dur = 420;
    const step = (now: number) => {
      const k = Math.min(1, (now - start) / dur);
      const e = 1 - Math.pow(1 - k, 3);
      setTweenB(from.map((f, i) => f + (to[i] - f) * e));
      if (k < 1) rafRef.current = requestAnimationFrame(step);
      else setTweenB(null);
    };
    rafRef.current = requestAnimationFrame(step);
  };

  const loadAt = (clientY: number) => {
    const r = barRef.current?.getBoundingClientRect(); if (!r) return 0.5;
    return clamp01(1 - (clientY - r.top) / r.height);
  };

  const centerField = (c: number) => {
    const from = s.borders.slice();
    const to = centerFieldBorders(n, c);
    onChange({ borders: to, middleField: c });
    animateTo(from, to);
  };
  const onLeftDown = (e: React.PointerEvent) => {
    e.preventDefault(); (e.target as HTMLElement).setPointerCapture(e.pointerId);
    leftDragging.current = true; setLeftDrag(loadAt(e.clientY));
  };
  const onLeftMove = (e: React.PointerEvent) => { if (leftDragging.current) setLeftDrag(loadAt(e.clientY)); };
  const onLeftUp = (e: React.PointerEvent) => {
    if (!leftDragging.current) return;
    leftDragging.current = false;
    try { (e.target as HTMLElement).releasePointerCapture(e.pointerId); } catch { /* */ }
    const L = leftDrag ?? 0.5;
    let c = n - 1;
    for (let i = 0; i < n; i++) { if (L < fieldHi(s.borders, i, n)) { c = i; break; } }
    setLeftDrag(null);
    centerField(c);
  };

  const onBorderDown = (i: number) => (e: React.PointerEvent) => {
    e.stopPropagation(); e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragIdx.current = i; setDragB(s.borders.slice());
  };
  const onBorderMove = (i: number) => (e: React.PointerEvent) => {
    if (dragIdx.current !== i) return;
    const lo = (i === 0 ? 0 : s.borders[i - 1]) + GAP;
    const hi = (i === n - 2 ? 1 : s.borders[i + 1]) - GAP;
    const v = Math.min(hi, Math.max(lo, loadAt(e.clientY)));
    const nb = (dragB ?? s.borders).slice(); nb[i] = v; setDragB(nb);
  };
  const onBorderUp = (i: number) => (e: React.PointerEvent) => {
    if (dragIdx.current !== i) return;
    try { (e.target as HTMLElement).releasePointerCapture(e.pointerId); } catch { /* */ }
    if (dragB) onChange({ borders: dragB });
    setDragB(null);
    setTimeout(() => { dragIdx.current = null; }, 0);
  };

  const onMidDown = (i: number) => (e: React.PointerEvent) => {
    e.stopPropagation(); e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragIdx.current = i; setDragB(s.borders.slice());
  };
  const onMidMove = (e: React.PointerEvent) => {
    if (dragIdx.current == null || s.middleField == null) return;
    const mid = s.middleField, lowI = mid - 1, hiI = mid;
    const below = lowI - 1 >= 0 ? s.borders[lowI - 1] : 0;
    const above = hiI + 1 <= n - 2 ? s.borders[hiI + 1] : 1;
    let h = Math.abs(loadAt(e.clientY) - 0.5);
    h = Math.max(0.005, Math.min(h, 0.5 - below - GAP, above - 0.5 - GAP));
    const nb = (dragB ?? s.borders).slice();
    nb[lowI] = 0.5 - h; nb[hiI] = 0.5 + h;
    setDragB(nb);
  };
  const onMidUp = (e: React.PointerEvent) => {
    if (dragIdx.current == null) return;
    try { (e.target as HTMLElement).releasePointerCapture(e.pointerId); } catch { /* */ }
    if (dragB) onChange({ borders: dragB });
    setDragB(null);
    setTimeout(() => { dragIdx.current = null; }, 0);
  };

  const setStop = (i: number, color: string) => { const stops = s.stops.slice(); stops[i] = color; onChange({ stops }); };
  const addStop = () => {
    if (n >= 6) return;
    const stops = [...s.stops, s.stops[n - 1]];
    onChange({ stops, borders: evenBorders(stops.length), middleField: null });
    setTweenB(null); setDragB(null);
  };
  const removeStop = (i: number) => {
    if (n <= 2) return;
    const stops = s.stops.filter((_, j) => j !== i);
    onChange({ stops, borders: evenBorders(stops.length), middleField: null });
    setTweenB(null); setDragB(null);
  };
  const resetEven = () => { (onReset ?? (() => onChange({ borders: evenBorders(n), middleField: null })))(); setTweenB(null); setDragB(null); };
  const reorder = (from: number, to: number) => {
    if (from === to || from < 0 || to < 0) return;
    const stops = s.stops.slice();
    const [m] = stops.splice(from, 1); stops.splice(to, 0, m);
    onChange({ stops });
  };

  const order = Array.from({ length: n }, (_, k) => n - 1 - k);

  return (
    <div style={{ flexShrink: 0, opacity: dimmed ? 0.32 : 1, pointerEvents: dimmed ? 'none' : 'auto', filter: dimmed ? 'grayscale(0.5)' : undefined, transition: 'opacity 0.2s' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, minHeight: 20 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#1a365d', whiteSpace: 'nowrap' }}>{title}</span>
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', height: PV_H }}>
            {/* LINKS · Schritt 1 (Mittelschieber) — nur bei voller Editierbarkeit */}
            <div style={{ position: 'relative', width: full ? 22 : 6, height: PV_H }}>
              {full && (
                <div
                  onPointerDown={onLeftDown} onPointerMove={onLeftMove} onPointerUp={onLeftUp}
                  title="ziehen: Feld zur Mitte wählen"
                  style={{ position: 'absolute', left: 0, right: 1, top: `calc(${(1 - (leftDrag ?? 0.5)) * 100}% - 7px)`, height: 14, display: 'flex', alignItems: 'center', cursor: 'ns-resize', touchAction: 'none' }}
                >
                  <div style={{ flex: 1, height: leftDragging.current ? 3 : 2, background: '#1a365d', borderRadius: 1 }} />
                </div>
              )}
            </div>

            <div ref={barRef} style={{ position: 'relative', width: 46, height: PV_H, borderRadius: 4, border: '1px solid #cbd5e0', background: gradientCss(s.stops, borders) }} />

            <div style={{ position: 'relative', width: 22, height: PV_H }}>
              {borders.map((b, i) => {
                const mid = s.middleField;
                const isMidPair = mid != null && mid - 1 >= 0 && mid <= n - 2 && (i === mid - 1 || i === mid);
                const down = isMidPair ? onMidDown(i) : onBorderDown(i);
                const move = isMidPair ? onMidMove : onBorderMove(i);
                const up = isMidPair ? onMidUp : onBorderUp(i);
                return (
                  <div
                    key={i}
                    onPointerDown={down} onPointerMove={move} onPointerUp={up}
                    title={isMidPair ? 'Mittelfeld-Größe (bleibt zentriert)' : `Grenze ${i + 1}: ${(b * 100).toFixed(0)}%`}
                    style={{ position: 'absolute', left: 1, right: 0, top: `calc(${(1 - b) * 100}% - 7px)`, height: 14, display: 'flex', alignItems: 'center', cursor: 'ns-resize', touchAction: 'none' }}
                  >
                    <div style={{ flex: 1, height: dragIdx.current === i ? 3 : 2, background: isMidPair ? '#2b6cb0' : '#1a365d', borderRadius: 1 }} />
                  </div>
                );
              })}
            </div>
          </div>
          <button onClick={resetEven} title={onReset ? 'auf den Default der nächsthöheren Instanz zurücksetzen' : 'gleichverteilen'} style={{ fontSize: 9, padding: '1px 6px', borderRadius: 3, border: '1px solid #e2e8f0', background: '#f7fafc', color: '#718096', cursor: 'pointer' }}>↺ {resetLabel ?? 'zurücksetzen'}</button>
        </div>

        <div style={{ width: 118 }}>
          <div style={{ fontSize: 8.5, color: '#a0aec0', marginBottom: 2 }}>↑ oben = Last 1</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {order.map((i) => {
              const isMid = s.middleField === i;
              return (
                <div
                  key={i}
                  draggable={full}
                  onDragStart={() => { if (full) dndIdx.current = i; }}
                  onDragOver={(e) => { if (full) e.preventDefault(); }}
                  onDrop={() => { if (full && dndIdx.current != null) reorder(dndIdx.current, i); dndIdx.current = null; }}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 4px', borderRadius: 4, cursor: full ? 'grab' : 'default', background: isMid ? '#ebf8ff' : '#fff', border: '1px solid ' + (isMid ? '#bee3f8' : '#edf2f7') }}
                >
                  {full && <span style={{ color: '#cbd5e0', fontSize: 12, cursor: 'grab' }}>⠿</span>}
                  <input type="color" value={toHex(s.stops[i])} disabled={!full} onChange={(e) => setStop(i, e.target.value)} style={{ width: 28, height: 22, border: 'none', background: 'none', cursor: full ? 'pointer' : 'default' }} />
                  {isMid && <span style={{ fontSize: 9, color: '#2b6cb0' }}>Mitte</span>}
                  {full && n > 2 && (
                    <button onClick={() => removeStop(i)} style={{ marginLeft: 'auto', fontSize: 12, border: 'none', background: 'none', color: '#a0aec0', cursor: 'pointer' }}>×</button>
                  )}
                </div>
              );
            })}
            {full && n < 6 && (
              <button onClick={addStop} style={{ marginTop: 2, alignSelf: 'flex-start', width: 28, height: 26, borderRadius: 4, border: '1px dashed #cbd5e0', background: '#f7fafc', color: '#4a5568', cursor: 'pointer', fontSize: 16 }}>+</button>
            )}
          </div>
          <div style={{ fontSize: 8.5, color: '#a0aec0', marginTop: 2 }}>↓ unten = Last 0</div>
        </div>
      </div>
    </div>
  );
}
