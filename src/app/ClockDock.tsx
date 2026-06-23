// ClockDock — feste Ecke unten rechts (Screen-Rand rechts + Safe-Area unten, je + cgap).
// Komposition: [ linke Region ] [ Play, pixel-mittig ] [ Haupt-Uhr H:MM ]. Der Play
// WANDERT NIE; die linke Region ist FIX so breit wie die Uhr (transparent, wenn leer),
// damit der Play exakt in der Mitte sitzt. Linke Region modus-abhängig befüllt:
// Planung = Delta ±MM(M), Begehung = Richtung + Meter-Countdown (via `left`).
// Ein Gap überall. Die schwebende „auto-pill" lebt unabhängig darüber.
import type { ReactNode } from 'react';
import FlapClock, { themeFromTint, clockWidthPx } from './FlapClock';
import { useDockHeight } from './dock';
import type { FlapDirection } from './flap';

// Play-Button = der „Du" ohne Außenring: Box in der Comfort-Farbe (face), darin die
// orange Du-Scheibe mit weißem Ring (darf pulsen) + weißes Kite nach rechts (Play) bzw.
// Pausenbalken (Pause). So sind Du und Play/Pause optisch dasselbe.
const DU_ORANGE = '#f60';
function PlayBox({ running, onToggle, size, face, blink, locate }: {
  running: boolean; onToggle: () => void; size: number; face: string; blink?: boolean; locate?: boolean;
}) {
  const seam = Math.max(2, Math.round(size * 0.03));    // weißer Ring etwas kräftiger
  const sw = (seam / size) * 100;                        // in der 100er-viewBox
  return (
    <button
      onClick={onToggle}
      aria-label={locate ? 'Wo bin ich?' : running ? 'Pause' : 'Start'}
      style={{
        width: size, height: size, flexShrink: 0, padding: 0, cursor: 'pointer',
        background: face, border: 'none', borderRadius: Math.round(size * 0.08),
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden>
        {/* orange Scheibe — bei offener Sorge pulst sie orange→VOLL TRANSPARENT
            (nicht nach dunkel) und SCHNELLER als die Zahl-Vorschau. */}
        <circle cx="50" cy="50" r="40" fill={DU_ORANGE}
          style={blink ? { animation: 'clockDockPlayBlink 0.8s ease-in-out infinite' } : undefined} />
        {/* weißer Ring — statisch (bleibt stehen, während die Scheibe atmet) */}
        <circle cx="50" cy="50" r="40" fill="none" stroke="#fff" strokeWidth={sw} />
        {locate
          /* Spar-Modus: Fadenkreuz = „Wo bin ich?" (Einzelfix statt Play). */
          ? <><g stroke="#fff" strokeWidth="6" strokeLinecap="round" fill="none"><circle cx="50" cy="50" r="16" /><line x1="50" y1="22" x2="50" y2="30" /><line x1="50" y1="70" x2="50" y2="78" /><line x1="22" y1="50" x2="30" y2="50" /><line x1="70" y1="50" x2="78" y2="50" /></g><circle cx="50" cy="50" r="4.5" fill="#fff" /></>
          : running
          ? <g fill="#fff"><rect x="38" y="34" width="9" height="32" rx="2" /><rect x="53" y="34" width="9" height="32" rx="2" /></g>
          /* Du-Kite (Chevron) nach rechts gedreht = Play */
          : <polyline points="34.4,62.5 50,31.25 65.6,62.5" transform="rotate(90 50 50)" fill="none" stroke="#fff" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />}
      </svg>
    </button>
  );
}

export default function ClockDock({
  mainValue, mainDirection, mainEmphasis = 'quiet', left, running, onToggle, maxHeight = 56, tint, clockTint, playTint, blink, locate,
}: {
  /** Haupt-Uhr rechts, Format „H:MM" (einstellige Stunde). */
  mainValue: string;
  mainDirection?: FlapDirection;
  mainEmphasis?: 'quiet' | 'route';
  /** Inhalt der linken Region (Delta / Wegweisung) als Funktion der berechneten Höhe;
   *  rechtsbündig, füllt die reservierte Breite. Undefined = transparent reserviert. */
  left?: (height: number) => ReactNode;
  running: boolean;
  onToggle: () => void;
  /** Obergrenze der Höhe (auf breiten Schirmen); auf dem Handy ergibt sie sich aus der Breite. */
  maxHeight?: number;
  /** Fallback-Tint, wenn clockTint/playTint nicht gesetzt sind. */
  tint?: string;
  /** Tint der Duration-Uhr = Maximallast der Route (Footer-Farbe 2). */
  clockTint?: string;
  /** Tint der Play-Box = Comfort-Einstellung (Footer-Farbe 1). */
  playTint?: string;
  /** Play blinkt (offene Sorge → erst klären). */
  blink?: boolean;
  /** Spar-Modus: Mittelknopf zeigt das Fadenkreuz „Wo bin ich?" statt Play/Pause. */
  locate?: boolean;
}) {
  const playTheme = themeFromTint(playTint ?? tint);
  const height = useDockHeight(maxHeight);
  const cgap = Math.max(2, Math.round(height * 0.045));   // ein Gap überall
  // Haupt-Uhr GENAU so groß + bündig wie die linke Zusatzzeit (0.66·Höhe, unten
  // ausgerichtet) — nur der Play bleibt groß. So schneidet die runde Bildschirmecke
  // (ohne Safe-Area) die Uhr nicht mehr an, und Uhr↔Zusatzzeit sind symmetrisch.
  const clockH = Math.round(height * 0.66);
  // Linke Region fix = Breite der (kleinen) Haupt-Uhr → symmetrisch, Play pixel-mittig.
  const leftW = clockWidthPx(mainValue, clockH, cgap);
  // Volle Breite + zentriert: Play sitzt in der SCHIRM-Mitte, Uhr bündig rechts, links spiegelt.
  return (
    <div style={{
      position: 'fixed', left: 0, right: 0,
      bottom: `calc(env(safe-area-inset-bottom) + ${cgap}px)`,
      zIndex: 760,
      display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: cgap,
    }}>
      <style>{'@keyframes clockDockPlayBlink{0%,100%{opacity:1}50%{opacity:0}}'}</style>
      <div style={{ width: leftW, flexShrink: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end' }}>
        {left?.(height)}
      </div>
      <PlayBox running={running} onToggle={onToggle} size={height} face={playTheme.face} blink={blink} locate={locate} />
      <FlapClock value={mainValue} direction={mainDirection} emphasis={mainEmphasis} height={clockH} tint={clockTint ?? tint} />
    </div>
  );
}
