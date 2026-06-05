import { useState, useRef, useEffect, useCallback } from 'react';

const GRADIENT = 'linear-gradient(to top, #2ecc40 0%, #a8e63c 14%, #f1c40f 28%, #ffaa00 42%, #ff5500 56%, #ff0044 72%, #ff0099 100%)';

const STRIP_W   = 12;
const RIGHT_GAP = 12;
const L_GAP_COL = 12;
const L_GAP_EXP = 24;
const SPACER    = 6;
const COL_W     = 36;
const W_COL     = L_GAP_COL + STRIP_W + RIGHT_GAP;
const W_EXP     = L_GAP_EXP + STRIP_W + RIGHT_GAP + SPACER + COL_W;
const LABEL_W   = RIGHT_GAP + SPACER + COL_W;

interface StripProps {
  value: number;
  systemLoad: number;
  maxValue: number;
  onChange: (v: number) => void;
  expanded: boolean;
  onExpandChange: (expanded: boolean) => void;
  labels: { top: string; middle: string; bottom: string };
}

function SliderStrip({ value, maxValue, onChange, expanded, onExpandChange, labels }: StripProps) {
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
    <div style={{ position: 'relative', width: expanded ? W_EXP : W_COL, height: 155, flexShrink: 0, transition: 'width 0.22s ease' }}>
      <div ref={trackRef} style={{ position: 'absolute', left: expanded ? L_GAP_EXP : L_GAP_COL, top: 0, bottom: 0, width: STRIP_W, overflow: 'hidden', transition: 'left 0.22s ease', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: 3, background: GRADIENT }} />
        {maxValue < 0.99 && (
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: `${maxValue * 100}%`, height: 1, borderTop: '1px dashed rgba(255,255,255,0.4)' }} />
        )}
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: `${linePos * 100}%`, height: expanded ? 3 : 2, background: '#fff', boxShadow: '0 0 6px 1px rgba(255,255,255,0.9)', zIndex: 2 }} />
      </div>

      {expanded && (
        <div style={{ position: 'absolute', right: 0, width: LABEL_W, top: 0, bottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', pointerEvents: 'none' }}>
          <span style={{ writingMode: 'vertical-rl', fontSize: 11, fontWeight: 700, color: 'rgba(0,0,0,0.80)', letterSpacing: '0.02em' }}>{labels.top}</span>
          <span style={{ fontSize: 13, fontWeight: 900, color: 'rgba(0,0,0,0.80)', letterSpacing: '0.04em', textAlign: 'center' }}>{labels.middle}</span>
          <span style={{ writingMode: 'vertical-rl', fontSize: 11, fontWeight: 700, color: 'rgba(0,0,0,0.80)', letterSpacing: '0.02em' }}>{labels.bottom}</span>
        </div>
      )}

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
  movementLoad: number;
  stayValue: number;
  stayLoad: number;
  stayMaxValue: number;
  onMovementChange: (v: number) => void;
  onStayChange: (v: number) => void;
  step2Active?: boolean;
}

export default function ComfortSliders({ movementValue, movementLoad, stayValue, stayLoad, stayMaxValue, onMovementChange, onStayChange, step2Active = false }: Props) {
  const [movExpanded, setMovExpanded] = useState(false);
  const [stayVisible, setStayVisible] = useState(false);
  const [stayExpanded, setStayExpanded] = useState(false);
  const stayHideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMovExpandChange = (exp: boolean) => {
    setMovExpanded(exp);
    if (exp) {
      if (stayHideTimer.current) clearTimeout(stayHideTimer.current);
      setStayVisible(true); setStayExpanded(true);
    } else {
      stayHideTimer.current = setTimeout(() => { setStayExpanded(false); setTimeout(() => setStayVisible(false), 250); }, 3000);
    }
  };

  useEffect(() => () => { if (stayHideTimer.current) clearTimeout(stayHideTimer.current); }, []);

  return (
    <div style={{ position: 'absolute', right: 0, top: 62, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, zIndex: 600 }}>
      <SliderStrip value={movementValue} systemLoad={movementLoad} maxValue={1} onChange={onMovementChange} expanded={movExpanded} onExpandChange={handleMovExpandChange} labels={{ top: 'belebter', middle: 'WEG', bottom: 'ruhiger' }} />
      {step2Active && stayVisible && (
        <SliderStrip value={stayValue} systemLoad={stayLoad} maxValue={stayMaxValue} onChange={onStayChange} expanded={stayExpanded} onExpandChange={setStayExpanded} labels={{ top: 'belebter', middle: 'RAST', bottom: 'ruhiger' }} />
      )}
    </div>
  );
}
