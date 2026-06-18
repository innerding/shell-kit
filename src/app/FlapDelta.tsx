// FlapDelta — linke Planungs-Anzeige: wie viel Zeit ein POI-An/Abwählen netto
// hinzufügt/abzieht. Aufbau: [ ± ][ Minutenboxen ], rechtsbündig an den Play gerückt.
//   Boxen IMMER in der kleineren (3er-)Höhe — egal ob 2 oder 3 Ziffern (≤99 zwei, sonst
//   drei, bis 999). Das ± nimmt die Boxfarbe an (Tint), steht ohne Box auf der Karte
//   (heller Halo für Lesbarkeit) und rückt dicht an die Boxen.
//   Wert wird DIREKT gezeigt (kein Flap-in aus Nullen — der hängte bei einer
//   Zwischenziffer und zeigte z. B. „01" statt „09").
import FlapClock, { themeFromTint } from './FlapClock';

export default function FlapDelta({ minutes, dockHeight, tint, blink, onCommit }: {
  minutes: number; dockHeight: number; tint?: string; blink?: boolean;
  /** Tap auf die Zahl = Umweg sofort committen (Route umlegen + Zeit addieren). */
  onCommit?: () => void;
}) {
  const sign = minutes < 0 ? '−' : '+';            // − (U+2212) / +
  const abs = Math.min(999, Math.abs(Math.round(minutes)));
  const digits = abs > 99 ? String(abs) : String(abs).padStart(2, '0');
  const boxH = Math.round(dockHeight * 0.66);       // konstant kleinere Höhe (2 & 3 Boxen)
  const signSize = Math.round(boxH * 0.92);
  const gap = Math.max(2, Math.round(boxH * 0.06));
  const theme = themeFromTint(tint);

  return (
    <div
      onClick={onCommit ? (e) => { e.stopPropagation(); onCommit(); } : undefined}
      role={onCommit ? 'button' : undefined}
      aria-label={onCommit ? 'Umweg wählen' : undefined}
      style={{
        width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', gap,
        cursor: onCommit ? 'pointer' : undefined,
        // Blink: orange → voll transparent (nicht dunkel), Timing wie gehabt.
        animation: blink ? 'flapDeltaBlink 1.1s ease-in-out infinite' : undefined,
      }}
    >
      <style>{'@keyframes flapDeltaBlink{0%,100%{opacity:1}50%{opacity:0}}'}</style>
      <span style={{
        fontFamily: 'Polarstern, system-ui, sans-serif', fontWeight: 600, fontSize: signSize, lineHeight: 0.84,
        color: theme.face, textShadow: '0 1px 2px rgba(255,255,255,0.9), 0 0 2px rgba(255,255,255,0.85)',
      }}>{sign}</span>
      <FlapClock value={digits} height={boxH} tint={tint} />
    </div>
  );
}
