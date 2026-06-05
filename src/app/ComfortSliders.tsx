import { useState, useRef, useEffect, useCallback } from 'react';

const GRADIENT = 'linear-gradient(to top, #2ecc40 0%, #a8e63c 14%, #f1c40f 28%, #ffaa00 42%, #ff5500 56%, #ff0044 72%, #ff0099 100%)';

const STRIP_W   = 12;
const RIGHT_GAP = 12;  // strip → screen edge (both states)
const L_GAP_COL = 12;  // left of strip in collapsed state
const L_GAP_EXP = 24;  // left of strip in expanded state
const SPACER    = 6;   // no-interaction zone (expanded only)
const COL_W     = 36;  // collapse hitbox width (= expand hitbox width)

const W_COL = L_GAP_COL + STRIP_W + RIGHT_GAP;                  // 36px
const W_EXP = L_GAP_EXP + STRIP_W + RIGHT_GAP + SPACER + COL_W; // 90px
const LABEL_W = RIGHT_GAP + SPACER + COL_W;                      // 54px — between strip right edge and screen

interface StripProps {
  value: number;
  systemLoad: number;
  maxValue: number;
  onChange: (v: number) => void;
  expanded: boolean;
  onExpandChange: (expanded: boolean) => void;
  labels: { top: string; middle: string; bottom: string };
}

function SliderStrip({ value, systemLoad, maxValue, onChange, expanded, onExpandChange, labels }: StripProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const collapseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Eingefrorener Gradient-Stand: gesetzt beim Expand, gelöscht beim Collapse.
  // collapsed = System bewegt das Fenster (3 Bewegungen aktiv).
  // expanded  = Fenster eingefroren, nur User-Schieber bewegt sich.
  const frozenGrad = useRef<{ top: string; transform: string } | null>(null);

  const linePos = Math.min(value, maxValue);
  const load = Math.min(1, Math.max(0, systemLoad));

  const gradTop = `-${(1 - linePos) * 200}%`;
  const gradTransform = `translateY(${(load - linePos) * 100}%)`;

  // Expand: Gradient-Stand einfrieren; Collapse: freigeben.
  const handleExpandChange = useCallback((exp: boolean) => {
    if (exp && !frozenGrad.current) {
      frozenGrad.current = { top: gradTop, transform: gradTransform };
    } else if (!exp) {
      frozenGrad.current = null;
    }
    onExpandChange(exp);
  }, [gradTop, gradTransform, onExpandChange]);

  const scheduleCollapse = useCallback(() => {
    if (collapseTimer.current) clearTimeout(collapseTimer.current);
    collapseTimer.current = setTimeout(() => handleExpandChange(false), 2800);
  }, [handleExpandChange]);

  const readPosition = useCallback((clientY: number) => {
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    onChange(Math.max(0, Math.min(maxValue, 1 - (clientY - rect.top) / rect.height)));
    scheduleCollapse();
  }, [onChange, maxValue, scheduleCollapse]);

  useEffect(() => () => { if (collapseTimer.current) clearTimeout(collapseTimer.current); }, []);

  return (
    <div style={{
      position: 'relative',
      width: expanded ? W_EXP : W_COL,
      height: 155,
      flexShrink: 0,
      transition: 'width 0.22s ease',
    }}>

      {/* Visual strip — slides left/right as container grows */}
      <div
        ref={trackRef}
        style={{
          position: 'absolute',
          left: expanded ? L_GAP_EXP : L_GAP_COL,
          top: 0, bottom: 0,
          width: STRIP_W,
          overflow: 'hidden',
          transition: 'left 0.22s ease',
          pointerEvents: 'none',
        }}
      >
        {/* SCHAUGLAS — collapsed: System bewegt Fenster (3 Bewegungen).
                       expanded: Fenster eingefroren, nur Schieber beweglich. */}
        <div style={{
          position: 'absolute',
          top: frozenGrad.current?.top ?? gradTop,
          height: '300%',
          left: 1, right: 1,
          borderRadius: 3,
          background: GRADIENT,
          transform: frozenGrad.current?.transform ?? gradTransform,
          transition: expanded ? 'none' : 'top 0.4s ease, transform 0.4s ease',
        }} />

        {maxValue < 0.99 && (
          <div style={{
            position: 'absolute', left: 0, right: 0,
            bottom: `${maxValue * 100}%`,
            height: 1,
            borderTop: '1px dashed rgba(255,255,255,0.4)',
          }} />
        )}

        <div style={{
          position: 'absolute', left: 0, right: 0,
          bottom: `${linePos * 100}%`,
          height: expanded ? 3 : 2,
          background: '#fff',
          boxShadow: '0 0 6px 1px rgba(255,255,255,0.9)',
          zIndex: 2,
        }} />
      </div>

      {/* Labels — centered in 54px zone between strip right edge and screen */}
      {expanded && (
        <div style={{
          position: 'absolute',
          right: 0,
          width: LABEL_W,
          top: 0, bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 0',
          pointerEvents: 'none',
        }}>
          <span style={{
            writingMode: 'vertical-rl',
            fontSize: 11, fontWeight: 700,
            color: 'rgba(0,0,0,0.80)',
            letterSpacing: '0.02em',
          }}>{labels.top}</span>
          <span style={{
            fontSize: 13, fontWeight: 900,
            color: 'rgba(0,0,0,0.80)',
            letterSpacing: '0.04em',
            textAlign: 'center',
          }}>{labels.middle}</span>
          <span style={{
            writingMode: 'vertical-rl',
            fontSize: 11, fontWeight: 700,
            color: 'rgba(0,0,0,0.80)',
            letterSpacing: '0.02em',
          }}>{labels.bottom}</span>
        </div>
      )}

      {/* Expand hitbox — collapsed only, full 36px container */}
      {!expanded && (
        <div
          onPointerDown={() => { handleExpandChange(true); scheduleCollapse(); }}
          style={{
            position: 'absolute', inset: 0,
            cursor: 'pointer',
            touchAction: 'none',
          }}
        />
      )}

      {/* Adjust hitbox — expanded only, 48px from left (left gap + strip + right gap) */}
      {expanded && (
        <div
          onPointerDown={(e) => {
            dragging.current = true;
            (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
            readPosition(e.clientY);
          }}
          onPointerMove={(e) => { if (dragging.current) readPosition(e.clientY); }}
          onPointerUp={() => { dragging.current = false; }}
          style={{
            position: 'absolute',
            left: 0, top: 0, bottom: 0,
            width: L_GAP_EXP + STRIP_W + RIGHT_GAP,  // 48px
            cursor: 'ns-resize',
            touchAction: 'none',
          }}
        />
      )}

      {/* Collapse hitbox — expanded only, 36px from right (screen edge) */}
      {expanded && (
        <div
          onPointerDown={() => { handleExpandChange(false); }}
          style={{
            position: 'absolute',
            right: 0, top: 0, bottom: 0,
            width: COL_W,
            cursor: 'pointer',
            touchAction: 'none',
          }}
        />
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
  /** Wenn false (movement_only): RAST-Slider komplett ausgeblendet. */
  step2Active?: boolean;
}

export default function ComfortSliders({
  movementValue, movementLoad,
  stayValue, stayLoad, stayMaxValue,
  onMovementChange, onStayChange,
  step2Active = false,
}: Props) {
  const [movExpanded, setMovExpanded] = useState(false);
  const [stayVisible, setStayVisible] = useState(false);
  const [stayExpanded, setStayExpanded] = useState(false);
  const stayHideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMovExpandChange = (expanded: boolean) => {
    setMovExpanded(expanded);
    if (expanded) {
      if (stayHideTimer.current) clearTimeout(stayHideTimer.current);
      setStayVisible(true);
      setStayExpanded(true);
    } else {
      stayHideTimer.current = setTimeout(() => {
        setStayExpanded(false);
        setTimeout(() => setStayVisible(false), 250);
      }, 3000);
    }
  };

  useEffect(() => () => { if (stayHideTimer.current) clearTimeout(stayHideTimer.current); }, []);

  return (
    <div style={{
      position: 'absolute',
      right: 0,
      top: 62,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
      gap: 8,
      zIndex: 600,
    }}>
      <SliderStrip
        value={movementValue}
        systemLoad={movementLoad}
        maxValue={1}
        onChange={onMovementChange}
        expanded={movExpanded}
        onExpandChange={handleMovExpandChange}
        labels={{ top: 'belebter', middle: 'WEG', bottom: 'ruhiger' }}
      />
      {step2Active && stayVisible && (
        <SliderStrip
          value={stayValue}
          systemLoad={stayLoad}
          maxValue={stayMaxValue}
          onChange={onStayChange}
          expanded={stayExpanded}
          onExpandChange={setStayExpanded}
          labels={{ top: 'belebter', middle: 'RAST', bottom: 'ruhiger' }}
        />
      )}
    </div>
  );
}
