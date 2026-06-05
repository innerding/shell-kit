// Netz-Graph-Algorithmen für BCK-Sackgassen-Pruning — rein, kein Leaflet.
//
// Nach dem Ausdimmen (Last > Comfort) entstehen neue Sackgassen: Strecken
// deren Endknoten nur noch zu ausgedimmten Strecken führen. Diese werden
// iterativ ebenfalls ausgedimmt — außer ihr Endknoten ist "geschützt"
// (Transport-POI oder Routen-Start-POI in der Nähe).
//
// Verwendung im Runtime:
//   const nodeMap   = buildNodeStretchMap(net);
//   const protected = buildProtectedNodes(poiLatLngs, net);
//   const dimmed    = pruneDeadEnds(initialDimmed, net, nodeMap, protected);

import type { SegmentedNet } from './anthem';

const R_EARTH = 6371000; // m

// Knoten-Schlüssel aus [lat, lng] — 5 Dezimalstellen ≈ 1 m Genauigkeit,
// passend zur netResample-Rundung (6 Stellen, Matching mit 5 ist robuster).
function nodeKey([lat, lng]: [number, number]): string {
  return `${lat.toFixed(5)},${lng.toFixed(5)}`;
}

/** Endknoten-Koordinate → anliegende Strecken-IDs. */
export function buildNodeStretchMap(net: SegmentedNet): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const s of net.stretches) {
    if (s.points.length < 2) continue;
    for (const p of [s.points[0], s.points[s.points.length - 1]] as [number, number][]) {
      const key = nodeKey(p);
      const list = map.get(key);
      if (list) list.push(s.id);
      else map.set(key, [s.id]);
    }
  }
  return map;
}

/**
 * Geschützte Knoten aus POI-Koordinaten [lat, lng] und Stretch-Endknoten.
 * Jeder Endknoten innerhalb von `thresholdM` Metern eines POIs wird geschützt.
 * Geschützte Knoten werden beim Pruning niemals ausgedimmt.
 */
export function buildProtectedNodes(
  poiLatLngs: [number, number][],
  net: SegmentedNet,
  thresholdM = 20,
): Set<string> {
  const result = new Set<string>();
  // Alle Endknoten einmal aufsammeln.
  const endpoints: { key: string; lat: number; lng: number }[] = [];
  for (const s of net.stretches) {
    if (s.points.length < 2) continue;
    for (const p of [s.points[0], s.points[s.points.length - 1]] as [number, number][]) {
      endpoints.push({ key: nodeKey(p), lat: p[0], lng: p[1] });
    }
  }
  for (const [lat, lng] of poiLatLngs) {
    for (const ep of endpoints) {
      const dLat = (ep.lat - lat) * Math.PI / 180;
      const dLng = (ep.lng - lng) * Math.PI / 180;
      const a = Math.sin(dLat / 2) ** 2
        + Math.cos(lat * Math.PI / 180) * Math.cos(ep.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
      if (2 * R_EARTH * Math.asin(Math.sqrt(a)) <= thresholdM) {
        result.add(ep.key);
      }
    }
  }
  return result;
}

/**
 * Iteratives Sackgassen-Pruning nach BCK-Ausdimmen.
 *
 * Eine Strecke wird ausgedimmt, wenn:
 *   - sie selbst noch aktiv ist UND
 *   - mindestens einer ihrer Endknoten keine aktiven Nachbarn mehr hat UND
 *   - dieser Endknoten nicht in `protectedNodes` liegt.
 *
 * Läuft bis Stabilität (kein weiteres Pruning möglich).
 */
export function pruneDeadEnds(
  initialDimmed: Set<string>,
  net: SegmentedNet,
  nodeStretchMap: Map<string, string[]>,
  protectedNodes: Set<string>,
): Set<string> {
  const dimmed = new Set(initialDimmed);
  let changed = true;
  while (changed) {
    changed = false;
    for (const s of net.stretches) {
      if (dimmed.has(s.id) || s.points.length < 2) continue;
      const startKey = nodeKey(s.points[0] as [number, number]);
      const endKey   = nodeKey(s.points[s.points.length - 1] as [number, number]);
      for (const key of [startKey, endKey]) {
        if (protectedNodes.has(key)) continue;
        const active = (nodeStretchMap.get(key) ?? []).filter(id => id !== s.id && !dimmed.has(id));
        if (active.length === 0) {
          dimmed.add(s.id);
          changed = true;
          break;
        }
      }
    }
  }
  return dimmed;
}
