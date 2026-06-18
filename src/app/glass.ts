// Gemeinsamer Glass-Look — EINE Quelle für die schwebenden Flächen (Modale, Rep-
// Wechsler-Frame + dessen Bottom-Sheet, Info-Sheet …). Transluzent + Blur + Saturation,
// heller Rand, dunkler Text. Änderung hier wirkt überall in der ausgelieferten Shell.
import type { CSSProperties } from 'react';

export const GLASS: CSSProperties = {
  // Heller Frost: viel Weiß + brightness hebt den Hintergrund auf (statt grau).
  background: 'rgba(255,255,255,0.62)',
  border: '1px solid rgba(255,255,255,0.75)',
  backdropFilter: 'blur(16px) saturate(1.5) brightness(1.12)',
  WebkitBackdropFilter: 'blur(16px) saturate(1.5) brightness(1.12)',
  boxShadow: '0 8px 26px rgba(0,0,0,0.2)',
  color: '#1a202c',
};
