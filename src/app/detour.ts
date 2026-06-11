// detour — der Path-Detour-Generator (ann_138). Das Geschwister von poiDompteur,
// aber für PFADE: zu einer belebten Route liefert er eine RANGLISTE von UMWEGEN,
// jeder mit Mehrweg (deltaM) + Comfort-Stufe (peak load → stageOf). NUR Umwege, die
// die Comfort-Einstellung erfüllen (peak ≤ comfort) werden angeboten; gibt es keinen,
// ist die Liste leer → der Konsument fällt auf die POI-Entscheidung zurück (Resolver-
// Kette ann_138). Rein/testbar, kein Leaflet.
//
// Mehrere Umwege entstehen durch progressiv strengeres Meiden: bei `comfort` nur die
// breachenden Stretches (kürzester-gerade-noch-komfortabel), tiefer → mehr gemieden
// (ruhiger, länger). solveRouteAvoiding meidet per PENALTY (weich), darum die Filterung.
import { solveRoute, solveRouteAvoiding, type Route, type RouteLeg } from './bak.js';
import { polylineLengthM } from './walker.js';
import { stageOf, type ScaleSpec } from './scale.js';
import type { SegmentedNet, LatLng } from './anthem';

export interface DetourPick {
  points: LatLng[];      // Umweg-Geometrie [lat,lng]
  stretchIds: string[];
  legs?: RouteLeg[];     // per-Strecke Index-Bereiche in points (für routen-treue Overlays)
  deltaM: number;        // Mehrweg ggü. der direkten Route (m; ≥ 0)
  peakLoad: number;      // 0..1, höchste Ø-Last auf dem Umweg
  stage: number;         // stageOf(peakLoad) — fürs Comfort-Label (sehr ruhig…voll)
}

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

function peakLoadOf(stretchIds: string[], avgById: Map<string, number>): number {
  let peak = 0;
  for (const id of stretchIds) { const a = avgById.get(id) ?? 0; if (a > peak) peak = a; }
  return peak;
}

/**
 * Rangliste komfortabler Umwege für die direkte Route durch `waypoints`. `avgById` =
 * Ø-Last je Stretch, `comfort` = tolerierte Last-Obergrenze (0..1). Sortiert nach
 * Mehrweg (kürzester zuerst), gekappt auf `limit`. Leer = kein komfortabler Umweg.
 */
export function detourPicks(
  net: SegmentedNet,
  waypoints: LatLng[],
  avgById: Map<string, number>,
  scale: ScaleSpec,
  comfort: number,
  limit = 4,
): DetourPick[] {
  const direct = solveRoute(net, waypoints);
  if (!direct) return [];
  const c = clamp01(comfort);
  // Nur wenn die DIREKTE Route überhaupt breacht, gibt es einen Umweg anzubieten —
  // sonst ist alles komfortabel und nichts zu umgehen.
  if (peakLoadOf(direct.stretchIds, avgById) <= c) return [];
  const directLen = polylineLengthM(direct.points);

  const seen = new Set<string>([direct.stretchIds.join(',')]);   // die direkte Route ist kein „Umweg"
  const out: DetourPick[] = [];

  // Meide-Schwellen: comfort, dann strenger → Spektrum von „gerade komfortabel" bis „sehr ruhig".
  for (const t of [c, c * 0.8, c * 0.6, c * 0.4]) {
    if (t <= 0) continue;
    const avoid = new Set<string>();
    for (const [id, a] of avgById) if (a > t) avoid.add(id);
    if (avoid.size === 0) continue;
    const r: Route | null = solveRouteAvoiding(net, waypoints, avoid);
    if (!r || r.stretchIds.length === 0) continue;
    const sig = r.stretchIds.join(',');
    if (seen.has(sig)) continue;
    seen.add(sig);
    const peak = peakLoadOf(r.stretchIds, avgById);
    if (peak > c) continue;                                       // nur komfortable Umwege anbieten
    out.push({
      points: r.points, stretchIds: r.stretchIds, legs: r.legs,
      deltaM: Math.max(0, polylineLengthM(r.points) - directLen),
      peakLoad: peak, stage: stageOf(peak, scale),
    });
  }

  out.sort((a, b) => a.deltaM - b.deltaM);                        // kürzester komfortabler Umweg zuerst
  return out.slice(0, Math.max(1, limit));
}
