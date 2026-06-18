// Polarstern-Pfeile — hand-gezeichnete Mittellinien aus dem Pathworks-Font
// (arrowleft/right/up/down.svg, 100er-Box, Schaft + Pfeilkopf). Werden als STRICH
// gerendert (stroke = Meterfarbe, runde Enden) — passend zur Polarstern-Handschrift.
export type ArrowDir = 'left' | 'right' | 'up' | 'down';

export const ARROW_GLYPHS: Record<ArrowDir, string> = {
  left: 'M75,50H25M37.963,36l-12.873,14,12.872,14',
  right: 'M25,50h50M62.037,36l12.873,14-12.872,14',
  up: 'M50,75V25M36,37.963l14-12.873,14,12.872',
  down: 'M50,25v50M36,62.037l14,12.873,14-12.872',
};
