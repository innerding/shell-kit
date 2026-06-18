// shell-kit/app — die per-Rep-Shell (reist im Shell-Paket).
export { default as ComfortSliders } from './ComfortSliders';
export { default as RouteComfortBanner } from './RouteComfortBanner';  // bak-test-Banner
export { default as ComfortDiode } from './ComfortDiode';   // Last-Diode (Comfort-Wort, pulst)
export { default as WarnTriangle } from './WarnTriangle';   // Achtung-Wasserzeichen (über Comfort)
export { default as FlapClock, themeFromTint, clockWidthPx, type FlapTheme } from './FlapClock';  // Klappuhr H:MM
export { default as FlapDelta } from './FlapDelta';         // Klapp-Delta ±MM
export { default as FlapGuide } from './FlapGuide';         // Klapp-Wegweiser (Meter + Pfeil)
// flapGlyphs/arrowGlyphs bleiben INTERN (relativ importiert) — FLAP_DIGITS würde sonst
// mit flap.ts (Ziffern-String) kollidieren.
export * from './geometry';     // Geometrie-Vokabular (Formen) + geometryOf
export * from './decorations';  // Deco-Typen
export * from './render';       // Render-Kern: Container/Composite + RenderAssets + mergeOverlapping
export * from './colorist';     // Colorist: Last → Farbe (PALETTES/colorize/shapeLoad/heatColor)
export * from './anthem';       // Anthem: Last-Mathematik (simSegmentLoads/normalizeLoads/dayPhase/produceAnthemLoads)
export * from './scale';        // Skalen-Modell: colorAt/posForLoad/loadForPos (eine Quelle für alle Schieber)
export * from './graph';        // Netz-Graph: buildNodeStretchMap/buildProtectedNodes/pruneDeadEnds
export * from './bak';          // BAK: solveRoute/routeBreachesComfort/toggleWaypoint (bak-test)
export * from './walker';       // Sim-Walker: walkAlong/nearestWaypoint/bearingDeg/distM (Guidance-Play S1)
export * from './similarity';   // poi-circus-kinship: bucketOf/similarityTier (deskriptive Helfer)
export * from './poiDompteur';  // POI-Dompteur: dompteurPick/dompteurPicks (Filter-Pipeline, B1/Stufe-3)
export * from './poiVisual';    // POI-Gestalt: poiVisualState/poiBreaches (Step 4a, ann_126)
export * from './detour';       // Path-Detour-Generator: detourPicks (Geschwister von poiDompteur, ann_138)
export * from './flap';         // Split-Flap-Sequenz: flapSteps/rollSteps/flapDirection (Klappuhr)
export * from './glass';        // Glass-Look: GLASS (geteilte Frost-Optik der schwebenden Flächen)
