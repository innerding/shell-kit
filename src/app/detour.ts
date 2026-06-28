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
import { similarityTier } from './similarity.js';
import type { CircusPoi } from './poiDompteur.js';
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

// ── Routen-Vorschlagsystem (ann_onboarding, v1) ───────────────────────────────
// Ein angetipptes Ziel → ein FÄCHER von Routen dorthin: die direkte (schnellste,
// evtl. belebte) + die gestaffelt ruhigeren Varianten (über detourPicks). Jede mit
// Länge, Spitzen-Last und Comfort-Stufe. Nach LÄNGE sortiert (kürzeste zuerst).
// Comfort ist hier ANKER (Filter der Umwege), nicht Verbot: die direkte Route
// bleibt immer als erster Vorschlag erhalten.
// v2 (offen): Cross-Ziel-Alternativen („erste-3-Durations"), Runde, Substitution.
export interface RouteSuggestion {
  route: Route;        // {stretchIds, points, legs}
  lengthM: number;     // Gesamtlänge (m)
  peakLoad: number;    // 0..1, höchste Ø-Last auf der Route
  stage: number;       // stageOf(peakLoad) — Comfort-Stufe (sehr ruhig…voll)
  deltaM: number;      // Mehrweg ggü. der direkten Route (≥ 0)
}

export function routeSuggestions(
  net: SegmentedNet,
  start: LatLng,
  target: LatLng,
  avgById: Map<string, number>,
  scale: ScaleSpec,
  comfort: number,
  max = 6,
): RouteSuggestion[] {
  const direct = solveRoute(net, [start, target]);
  if (!direct) return [];
  const directLen = polylineLengthM(direct.points);
  const directPeak = peakLoadOf(direct.stretchIds, avgById);
  const out: RouteSuggestion[] = [{
    route: direct, lengthM: directLen, peakLoad: directPeak, stage: stageOf(directPeak, scale), deltaM: 0,
  }];
  const seen = new Set<string>([direct.stretchIds.join(',')]);   // direkte Route ist schon drin
  for (const d of detourPicks(net, [start, target], avgById, scale, comfort, max)) {
    const sig = d.stretchIds.join(',');
    if (seen.has(sig)) continue;
    seen.add(sig);
    out.push({
      route: { stretchIds: d.stretchIds, points: d.points, legs: d.legs },
      lengthM: directLen + d.deltaM, peakLoad: d.peakLoad, stage: d.stage, deltaM: d.deltaM,
    });
  }
  out.sort((a, b) => a.lengthM - b.lengthM);                      // Dauer aufsteigend (v1-Default)
  return out.slice(0, Math.max(1, max));
}

// Luftlinie (m) zwischen zwei [lat,lng] — für die „nächstes Kinship-POI"-Wahl.
function haversineM([lat1, lng1]: LatLng, [lat2, lng2]: LatLng): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180, dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// Gibt es unter den Vorschlägen mindestens einen comfortablen (peak ≤ comfort)?
const hasComfortable = (sug: RouteSuggestion[], comfort: number) => sug.some((s) => s.peakLoad <= comfort);

export interface TargetSuggestion {
  targetId: string;                 // tatsächlich bedientes Ziel (evtl. das Substitut)
  substituted: boolean;             // wurde das Wunsch-Ziel ersetzt?
  suggestions: RouteSuggestion[];   // Routen-Fächer zu targetId
}

/**
 * Vorschläge zu einem Wunsch-Ziel — mit KLASSEN-KONFORMER Substitution (ann_x). Hat das
 * Wunsch-Ziel keinen comfortablen Weg, wird es durch das **nächstgelegene POI kompatibler
 * Klasse** (`similarityTier ≥ 1`, dieselbe Kinship-Schranke wie der POI-Dompteur) ersetzt,
 * das einen comfortablen Weg hat — Gipfel↛Café. Klappt keiner, kommt best-effort das
 * Wunsch-Ziel zurück (evtl. belebt; nie „nichts").
 */
export function suggestForTarget(
  net: SegmentedNet,
  start: LatLng,
  target: CircusPoi,
  candidates: CircusPoi[],
  avgById: Map<string, number>,
  scale: ScaleSpec,
  comfort: number,
  max = 6,
): TargetSuggestion {
  const own = routeSuggestions(net, start, target.coord, avgById, scale, comfort, max);
  if (hasComfortable(own, comfort)) return { targetId: target.id, substituted: false, suggestions: own };
  // Kein comfortabler Weg → klassen-konforme Substitution, nächstes Kinship-POI zuerst.
  const kin = candidates
    .filter((c) => c.id !== target.id && similarityTier(target.subcategory, c.subcategory) >= 1)
    .sort((a, b) => haversineM(target.coord, a.coord) - haversineM(target.coord, b.coord));
  for (const c of kin) {
    const s = routeSuggestions(net, start, c.coord, avgById, scale, comfort, max);
    if (hasComfortable(s, comfort)) return { targetId: c.id, substituted: true, suggestions: s };
  }
  return { targetId: target.id, substituted: false, suggestions: own };   // best effort
}
