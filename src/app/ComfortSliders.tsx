import { useState, useRef, useEffect, useCallback } from 'react';
import { colorAt, stageOf, type ScaleSpec } from './scale';

// Stufen-Band-MITTEN (Load 0..1) je Stufe 1..n — robust für borders ODER Spreizung
// (per Sampling). Dort sitzt das jeweilige Kaskaden-Wort auf Schauglas-Höhe.
export function bandCenters(scale: ScaleSpec, n: number): number[] {
  const lo = new Array(n + 1).fill(2), hi = new Array(n + 1).fill(-1);
  const STEPS = 240;
  for (let i = 0; i <= STEPS; i++) {
    const h = i / STEPS, s = stageOf(h, scale);
    if (s >= 1 && s <= n) { if (h < lo[s]) lo[s] = h; if (h > hi[s]) hi[s] = h; }
  }
  const out: number[] = [];
  for (let s = 1; s <= n; s++) out.push(lo[s] > hi[s] ? (s - 0.5) / n : (lo[s] + hi[s]) / 2);
  return out;
}

// Fallback, falls keine Skala übergeben wird (alte Aufrufer).
const GRADIENT = 'linear-gradient(to top, #2ecc40 0%, #a8e63c 14%, #f1c40f 28%, #ffaa00 42%, #ff5500 56%, #ff0044 72%, #ff0099 100%)';

// Verlauf aus DERSELBEN Skala wie das Mesh (colorAt mit stops/borders) — so spricht
// das BCK-Schauglas dieselbe Farbwelt wie das Mesh (Last 0 unten … 1 oben).
function gradientFromScale(scale?: ScaleSpec): string {
  if (!scale) return GRADIENT;
  const N = 14;
  const parts: string[] = [];
  for (let i = 0; i <= N; i++) {
    const load = i / N;
    parts.push(`${colorAt(load, scale)} ${((load) * 100).toFixed(0)}%`);
  }
  return `linear-gradient(to top, ${parts.join(', ')})`;
}

const STRIP_W   = 12;
const RIGHT_GAP = 12;
const L_GAP_COL = 12;
const L_GAP_EXP = 24;
const SPACER    = 6;
const COL_W     = 36;
const W_COL     = L_GAP_COL + STRIP_W + RIGHT_GAP;
const W_EXP     = L_GAP_EXP + STRIP_W + RIGHT_GAP + SPACER + COL_W;
const LABEL_W   = RIGHT_GAP + SPACER + COL_W;
const EDGE_GAP  = 4;   // px Abstand des Schiebers zu Ober-/Unterkante (läuft nie raus)
const TOP_EXTRA = 1;   // oben 1px mehr (Schieber ist bottom-verankert, wächst nach oben)

// Schieber-/Marker-Position mit Rand-Gap: bottom-Wert, der bei value 0..1
// zwischen EDGE_GAP und (Höhe − EDGE_GAP − TOP_EXTRA) bleibt.
const insetBottom = (v: number) => `calc(${EDGE_GAP}px + ${Math.max(0, Math.min(1, v))} * (100% - ${EDGE_GAP * 2 + TOP_EXTRA}px))`;

export interface StripProps {
  value: number;
  maxValue: number;
  onChange: (v: number) => void;
  expanded: boolean;
  onExpandChange: (expanded: boolean) => void;
  gradient: string;
  /** Aktueller Last-Pegel des GANZEN Netzes (0..1). Darüber wird der Gradient
   *  ausgeblichen (milchig) — das Schauglas zeigt nur die Last, die da ist. Der
   *  volle Gradient bleibt als 1px-Stroke ringsum sichtbar (Skala-Referenz). */
  loadLevel?: number;
  /** LINKS, dominant, weiß+Schatten, vertikal zentriert — das Manifest des Sliders
   *  (z. B. „Comfort/von/Stationen." bzw. „Geh/Deinen/Weg."), zeilenweise. */
  manifest?: string[];
  /** RECHTS, weiß+Schatten, je Wort auf seiner Schauglas-Höhe (Stufen-Band-Mitte). */
  cascade?: { word: string; pos: number }[];
  /** Index in `cascade` der EINGESTELLTEN Stufe — dieses Wort wird in der Stufenfarbe
   *  (`activeColor`) statt weiß gezeichnet (Rückmeldung des gewählten Levels). */
  activeIdx?: number;
  activeColor?: string;
}

// Lesbare Textfarbe auf einer Farb-Box (einfache Luminanz).
function readable(hex: string): string {
  const h = hex.replace('#', '');
  const n = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const r = parseInt(n.slice(0, 2), 16), g = parseInt(n.slice(2, 4), 16), b = parseInt(n.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) > 150 ? '#14223e' : '#fff';
}

export function SliderStrip({ value, maxValue, onChange, expanded, onExpandChange, gradient, loadLevel, manifest, cascade, activeIdx, activeColor }: StripProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const collapseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const linePos = Math.min(value, maxValue);

  const scheduleCollapse = useCallback(() => {
    if (collapseTimer.current) clearTimeout(collapseTimer.current);
    collapseTimer.current = setTimeout(() => onExpandChange(false), 2800);
  }, [onExpandChange]);

  const readPosition = useCallback((clientY: number) => {
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    onChange(Math.max(0, Math.min(maxValue, 1 - (clientY - rect.top) / rect.height)));
    scheduleCollapse();
  }, [onChange, maxValue, scheduleCollapse]);

  useEffect(() => () => { if (collapseTimer.current) clearTimeout(collapseTimer.current); }, []);

  return (
    <div style={{ position: 'relative', width: expanded ? W_EXP : W_COL, height: 155, flexShrink: 0, transition: 'width 0.22s ease', userSelect: 'none', WebkitUserSelect: 'none' }}>
      <div ref={trackRef} style={{ position: 'absolute', left: expanded ? L_GAP_EXP : L_GAP_COL, top: 0, bottom: 0, width: STRIP_W, overflow: 'hidden', transition: 'left 0.22s ease', pointerEvents: 'none' }}>
        {/* Stroke-Lage: voller Gradient → bildet den 1px-Umriss (Skala bleibt lesbar). */}
        <div style={{ position: 'absolute', inset: 0, borderRadius: 3, background: gradient }} />
        {/* Füll-Lage: voller Gradient, 1px eingerückt → der Stroke scheint ringsum durch. */}
        <div style={{ position: 'absolute', inset: 1, borderRadius: 2, background: gradient }} />
        {/* Bleach-Scrim: über der Füllung von loadLevel bis oben — milchig ausgeblichen,
            wo das Netz aktuell keine Last trägt. Der Gradient-Stroke bleibt sichtbar. */}
        {loadLevel != null && loadLevel < 0.999 && (
          // Sofortfix: nur ein 3px-Band am RECHTEN Rand (linker Rand nach rechts gerückt)
          // — die volle Mesh-Farbe bleibt links sichtbar; der Bleach deutet den Pegel an.
          <div style={{ position: 'absolute', left: STRIP_W - 4, right: 1, top: 1, bottom: insetBottom(loadLevel), borderRadius: 1, background: 'rgba(255,255,255,0.62)' }} />
        )}
        {maxValue < 0.99 && (
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: insetBottom(maxValue), height: 1, borderTop: '1px dashed rgba(255,255,255,0.4)' }} />
        )}
      </div>

      {/* Verschiebbarer Stroke — AUSSERHALB des (geclippten) Tracks, damit er mit seinen
          Rounded Caps links und rechts über das Schauglas übersteht. */}
      <div style={{
        position: 'absolute', left: (expanded ? L_GAP_EXP : L_GAP_COL) - 6, width: STRIP_W + 12,
        bottom: insetBottom(linePos), height: expanded ? 3 : 2, background: '#fff', borderRadius: 999,
        boxShadow: '0 0 6px 1px rgba(255,255,255,0.9)', zIndex: 3, pointerEvents: 'none',
        transition: 'left 0.22s ease',
      }} />

      {/* MANIFEST links vom Schauglas — dominant, weiß+Schatten, vertikal zentriert,
          zeilenweise (z. B. „Comfort/von/Stationen."). Blendet beim Ausfahren ein. */}
      {manifest && manifest.length > 0 && (
        <div aria-hidden style={{
          position: 'absolute', top: '50%', right: W_EXP - L_GAP_EXP + 10, transform: 'translateY(-50%)',
          textAlign: 'center', whiteSpace: 'nowrap', pointerEvents: 'none',
          opacity: expanded ? 1 : 0, transition: 'opacity 0.18s ease',
          color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.55), 0 0 2px rgba(0,0,0,0.5)',
          font: '800 19px/1.16 Polarstern, system-ui,sans-serif', letterSpacing: '0.01em',
        }}>
          {manifest.map((line, i) => <div key={i}>{line}</div>)}
        </div>
      )}

      {/* KASKADE rechts vom Schauglas — je Wort auf seiner Stufen-Band-Höhe. Das Wort der
          EINGESTELLTEN Stufe trägt die Stufenfarbe (activeColor), die übrigen weiß. */}
      {cascade && cascade.map((c, i) => {
        if (!c.word) return null;
        const on = activeIdx === i && !!activeColor;
        return (
          <span key={i} aria-hidden style={{
            position: 'absolute', left: L_GAP_EXP + STRIP_W + 6, bottom: insetBottom(c.pos), transform: 'translateY(50%)',
            whiteSpace: 'nowrap', pointerEvents: 'none',
            opacity: expanded ? 1 : 0, transition: 'opacity 0.18s ease, color 0.18s ease',
            color: on ? activeColor : '#fff',
            // Gleicher (normaler) Text-Schatten für alle — KEIN dunkler Halo, der wie eine
            // Box hinter dem aktiven Wort wirkt. Das eingestellte Wort wird nur eingefärbt
            // und leicht (×1.25) vergrößert.
            textShadow: '0 1px 2px rgba(0,0,0,0.55), 0 0 2px rgba(0,0,0,0.5)',
            font: `${on ? 800 : 700} ${on ? 18 : 14.5}px/1 Polarstern, system-ui,sans-serif`, letterSpacing: '0.02em',
            textTransform: on ? 'uppercase' : 'none',
            transformOrigin: 'left center',
          }}>{c.word}</span>
        );
      })}

      {!expanded && (
        <div onPointerDown={() => { onExpandChange(true); scheduleCollapse(); }} style={{ position: 'absolute', inset: 0, cursor: 'pointer', touchAction: 'none' }} />
      )}
      {expanded && (
        <>
          <div
            onPointerDown={(e) => { dragging.current = true; (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId); readPosition(e.clientY); }}
            onPointerMove={(e) => { if (dragging.current) readPosition(e.clientY); }}
            onPointerUp={() => { dragging.current = false; }}
            style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: L_GAP_EXP + STRIP_W + RIGHT_GAP, cursor: 'ns-resize', touchAction: 'none' }}
          />
          <div onPointerDown={() => onExpandChange(false)} style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: COL_W, cursor: 'pointer', touchAction: 'none' }} />
        </>
      )}
    </div>
  );
}

interface Props {
  movementValue: number;
  stayValue: number;
  stayMaxValue: number;
  onMovementChange: (v: number) => void;
  onStayChange: (v: number) => void;
  step2Active?: boolean;
  /** Skala (stops/borders) — Schauglas spricht dieselbe Farbwelt wie das Mesh. */
  scale?: ScaleSpec;
  /** Last-Pegel des GANZEN Netzes (0..1) — bleicht den WEG-Gradienten darüber aus. */
  loadLevel?: number;
  /** Rest-Pegel (0..1, areal) — bleicht den RAST-Gradienten darüber aus. */
  stayLoadLevel?: number;
  /** Wert → Comfort-Wort + -Farbe; speist die Kaskade rechts (je Wort auf Schauglas-Höhe). */
  labelOf?: (value: number) => { word: string; color: string };
  /** Manifest LINKS je Slider (zeilenweise, weiß+Schatten, dominant). */
  stayManifest?: string[];
  movementManifest?: string[];
  /** Expand-Meldung nach oben (für die Sichtbarkeits-Maschine: WEG offen → nur Ziel-POIs). */
  onMovementExpandChange?: (expanded: boolean) => void;
  onStayExpandChange?: (expanded: boolean) => void;
}

export default function ComfortSliders({ movementValue, stayValue, stayMaxValue, onMovementChange, onStayChange, step2Active = false, scale, loadLevel, stayLoadLevel, labelOf, stayManifest, movementManifest, onMovementExpandChange, onStayExpandChange }: Props) {
  const gradient = gradientFromScale(scale);
  const [movExpanded, setMovExpanded] = useState(false);
  const [stayExpanded, setStayExpanded] = useState(false);
  const setMov = (e: boolean) => { setMovExpanded(e); onMovementExpandChange?.(e); };
  const setStay = (e: boolean) => { setStayExpanded(e); onStayExpandChange?.(e); };

  // Kaskade (gleich für beide Slider): je Stufe ein Wort auf seiner Band-Mitte.
  const cascade = (labelOf && scale)
    ? bandCenters(scale, scale.stops.length).map((pos) => ({ word: labelOf(pos).word, pos }))
    : undefined;
  // Eingestellte Stufe je Slider → Kaskaden-Wort in der Stufenfarbe (Index = Stufe−1).
  const activeOf = (v: number) => scale ? Math.max(0, stageOf(v, scale) - 1) : undefined;
  const movActive = activeOf(movementValue), stayActive = activeOf(stayValue);
  const movColor = labelOf ? labelOf(movementValue).color : undefined;
  const stayColor = labelOf ? labelOf(stayValue).color : undefined;

  // Beide Slider permanent; jeder klappt unabhängig auf. Reihenfolge: RAST OBEN, WEG UNTEN
  // (die POI-/Rast-Hinweise sitzen oben, der Rast-Slider gehört daneben).
  return (
    <div style={{ position: 'absolute', right: 0, top: 62, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, zIndex: 600 }}>
      {step2Active && (
        <SliderStrip value={stayValue} maxValue={stayMaxValue} onChange={onStayChange} expanded={stayExpanded} onExpandChange={setStay} manifest={stayManifest} cascade={cascade} activeIdx={stayActive} activeColor={stayColor} gradient={gradient} loadLevel={stayLoadLevel} />
      )}
      <SliderStrip value={movementValue} maxValue={1} onChange={onMovementChange} expanded={movExpanded} onExpandChange={setMov} manifest={movementManifest} cascade={cascade} activeIdx={movActive} activeColor={movColor} gradient={gradient} loadLevel={loadLevel} />
    </div>
  );
}
