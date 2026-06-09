// shell-kit/app — die per-Rep-Shell (reist im Shell-Paket).
export { default as ComfortSliders } from './ComfortSliders';
export { default as RouteComfortBanner } from './RouteComfortBanner'; // bak-test-Banner
export * from './geometry'; // Geometrie-Vokabular (Formen) + geometryOf
export * from './decorations'; // Deco-Typen
export * from './render'; // Render-Kern: Container/Composite + RenderAssets + mergeOverlapping
export * from './colorist'; // Colorist: Last → Farbe (PALETTES/colorize/shapeLoad/heatColor)
export * from './anthem'; // Anthem: Last-Mathematik (simSegmentLoads/normalizeLoads/dayPhase/produceAnthemLoads)
export * from './scale'; // Skalen-Modell: colorAt/posForLoad/loadForPos (eine Quelle für alle Schieber)
export * from './graph'; // Netz-Graph: buildNodeStretchMap/buildProtectedNodes/pruneDeadEnds
export * from './bak'; // BAK: solveRoute/routeBreachesComfort/toggleWaypoint (bak-test)
export * from './walker'; // Sim-Walker: walkAlong/nearestWaypoint/bearingDeg/distM (Guidance-Play S1)
export * from './similarity'; // poi-circus-kinship: bucketOf/similarityTier (deskriptive Helfer)
export * from './poiDompteur'; // POI-Dompteur: dompteurPick (Filter-Pipeline, B1/Stufe-3-Tausch)
