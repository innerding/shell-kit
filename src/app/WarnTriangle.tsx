// WarnTriangle (ann_143) — das Achtung-Dreieck als pulsierendes Hintergrund-Wasserzeichen.
// Sichtbar/pulsierend NUR über Comfort (intensity > 0): blendet von unsichtbar auf
// Wasserzeichen, je heftiger die Überlast desto schneller. Im Comfort (0) → nichts.
import type { CSSProperties } from 'react';

let injected = false;
function ensureWarnStyle() {
  if (typeof document === 'undefined' || injected) return;
  injected = true;
  if (document.getElementById('scim-warn-style')) return;
  const el = document.createElement('style');
  el.id = 'scim-warn-style';
  el.textContent = '@keyframes scim-warn{0%,100%{opacity:0}50%{opacity:0.17}}';
  document.head.appendChild(el);
}

export default function WarnTriangle({ intensity, color = 'currentColor' }: { intensity: number; color?: string }) {
  ensureWarnStyle();
  const i = Math.max(0, Math.min(1, intensity));
  if (i <= 0) return null;
  const dur = (1.7 - 1.1 * i).toFixed(2);
  const wrap: CSSProperties = {
    position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
    pointerEvents: 'none', overflow: 'hidden', borderRadius: 'inherit', zIndex: 0,
  };
  return (
    <span aria-hidden style={wrap}>
      <svg viewBox="0 0 100 100" width="74%" style={{ maxWidth: 200, color, animation: `scim-warn ${dur}s ease-in-out infinite`, opacity: 0 }}>
        <path d="M50 11 L93 87 L7 87 Z" fill="none" stroke="currentColor" strokeWidth="7" strokeLinejoin="round" />
        <rect x="45.5" y="38" width="9" height="26" rx="4" fill="currentColor" />
        <circle cx="50" cy="76" r="5.2" fill="currentColor" />
      </svg>
    </span>
  );
}
