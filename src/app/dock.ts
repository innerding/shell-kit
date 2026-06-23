// dock — die Dock-Höhe aus der Schirmbreite (eine Quelle). Play pixel-mittig + Uhr
// bündig rechts: aus h/2 + cgap + clockW + cgap = sw/2, clockW = SUM·h + 3·cgap folgt
// (SUM + 0.5)·h + 5·cgap = sw/2. `dockHeight` = pure (deterministisch, für SSR-freie
// Positionsrechnung), `useDockHeight` = reaktiver Hook (Resize).
import { useLayoutEffect, useState } from 'react';

// Haupt-Uhr „H:MM" = 3 Ziffern + Doppelpunkt → Summe der Zell-viewBox / 100.
export const DOCK_MAIN_SUM_VB = (92 * 3 + 36) / 100;   // = 3.12

export function dockHeight(vw: number, maxHeight = 56): number {
  let cg = 3;
  let v = (vw / 2 - 5 * cg) / (DOCK_MAIN_SUM_VB + 0.5);
  cg = Math.max(2, Math.round(v * 0.045));
  v = (vw / 2 - 5 * cg) / (DOCK_MAIN_SUM_VB + 0.5);
  return Math.max(34, Math.min(maxHeight, Math.round(v)));
}

export function useDockHeight(maxHeight = 56): number {
  const [h, setH] = useState(maxHeight);
  useLayoutEffect(() => {
    const compute = () => setH(dockHeight(window.innerWidth, maxHeight));
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, [maxHeight]);
  return h;
}
