// walker.ts — der Sim-Walker (S1 von Guidance/Play). PURE, keine Leaflet-/React-/
// DOM-Abhängigkeit → in Node testbar (test/walker.test.mjs), in Shell-Studio nutzbar.
//
// Aufgabe: aus einer Route-Polylinie (Modell B, points: LatLng[]) + verstrichener
// Zeit + Gehtempo → die aktuelle Position, Peilung (für den Marker), Fortschritt.
// Dieselbe Schnittstelle bedient später auch echtes GPS (watchPosition, S5) —
// dann ersetzt die Geräte-Position das `walkAlong`-Ergebnis, der Rest bleibt gleich.
//
// Orientierung: ALLE Koordinaten [lat, lng] — identisch zu net.stretches[].points
// und bak.ts.
import type { LatLng } from './anthem';

const EARTH_R = 6371000; // m
const toRad = (d: number) => (d * Math.PI) / 180;

/** Haversine-Distanz in Metern zwischen zwei [lat, lng]. */
export function distM([lat1, lng1]: LatLng, [lat2, lng2]: LatLng): number {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_R * Math.asin(Math.min(1, Math.sqrt(a)));
}

/** Gesamtlänge einer Polylinie in Metern. */
export function polylineLengthM(pts: LatLng[]): number {
  let s = 0;
  for (let i = 1; i < pts.length; i++) s += distM(pts[i - 1], pts[i]);
  return s;
}

/** Peilung in Grad (0 = Nord, im Uhrzeigersinn) von a nach b. */
export function bearingDeg([lat1, lng1]: LatLng, [lat2, lng2]: LatLng): number {
  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const dLng = toRad(lng2 - lng1);
  const y = Math.sin(dLng) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

export interface WalkState {
  pos: LatLng;       // aktuelle Position auf der Route
  bearing: number;   // Grad (0 = Nord) — Richtung des aktuellen Segments
  doneM: number;     // bisher zurückgelegt (m)
  totalM: number;    // Gesamtlänge der Route (m)
  progress: number;  // 0..1
  finished: boolean; // Ende erreicht
}

/**
 * Position entlang der Polylinie nach `elapsedSec` bei `speedMps` (m/s).
 * Linear interpoliert auf dem aktuellen Segment. `speedMps` darf einen
 * Zeitraffer-Faktor enthalten (Sim-Tempo). Bei <2 Punkten: statisch am Start.
 */
export function walkAlong(polyline: LatLng[], elapsedSec: number, speedMps: number): WalkState {
  if (!polyline || polyline.length === 0) {
    return { pos: [0, 0], bearing: 0, doneM: 0, totalM: 0, progress: 0, finished: true };
  }
  const start = polyline[0];
  const totalM = polylineLengthM(polyline);
  if (polyline.length < 2 || totalM === 0) {
    return { pos: start, bearing: 0, doneM: 0, totalM, progress: totalM === 0 ? 1 : 0, finished: true };
  }

  const target = Math.max(0, elapsedSec) * Math.max(0, speedMps);
  if (target >= totalM) {
    const last = polyline[polyline.length - 1];
    const prev = polyline[polyline.length - 2];
    return { pos: last, bearing: bearingDeg(prev, last), doneM: totalM, totalM, progress: 1, finished: true };
  }

  let acc = 0;
  for (let i = 1; i < polyline.length; i++) {
    const a = polyline[i - 1];
    const b = polyline[i];
    const segLen = distM(a, b);
    if (segLen === 0) continue;
    if (acc + segLen >= target) {
      const t = (target - acc) / segLen; // 0..1 auf diesem Segment
      const pos: LatLng = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
      return { pos, bearing: bearingDeg(a, b), doneM: target, totalM, progress: target / totalM, finished: false };
    }
    acc += segLen;
  }
  // Fallback (sollte durch target<totalM nicht erreicht werden)
  const last = polyline[polyline.length - 1];
  const prev = polyline[polyline.length - 2];
  return { pos: last, bearing: bearingDeg(prev, last), doneM: totalM, totalM, progress: 1, finished: true };
}

/** Nächster Wegpunkt (POI) zur Position — rein nach Distanz (NICHT in Gehrichtung).
 *  Für „nächster Halt in Gehrichtung" → nextWaypointAhead nutzen. */
export function nearestWaypoint(pos: LatLng, waypoints: LatLng[]): { idx: number; distM: number } {
  let idx = -1;
  let best = Infinity;
  for (let i = 0; i < waypoints.length; i++) {
    const d = distM(pos, waypoints[i]);
    if (d < best) { best = d; idx = i; }
  }
  return { idx, distM: best };
}

/** Lauf-Distanz (m) der Projektion von `p` auf die Polylinie — wie weit ENTLANG der
 *  Route der zu p nächstgelegene Punkt liegt. Equirektangulär in lokale Meter je
 *  Segment (für kurze Wegsegmente genau genug). */
function alongDistanceM(polyline: LatLng[], p: LatLng): number {
  let acc = 0, bestPerp = Infinity, bestAlong = 0;
  for (let i = 1; i < polyline.length; i++) {
    const a = polyline[i - 1], b = polyline[i];
    const segLen = distM(a, b);
    if (segLen === 0) continue;
    const latRef = toRad(a[0]);
    const bx = toRad(b[1] - a[1]) * Math.cos(latRef) * EARTH_R;
    const by = toRad(b[0] - a[0]) * EARTH_R;
    const px = toRad(p[1] - a[1]) * Math.cos(latRef) * EARTH_R;
    const py = toRad(p[0] - a[0]) * EARTH_R;
    const abLen2 = bx * bx + by * by;
    let t = abLen2 === 0 ? 0 : (px * bx + py * by) / abLen2;
    t = Math.max(0, Math.min(1, t));
    const perp = Math.hypot(px - bx * t, py - by * t);
    if (perp < bestPerp) { bestPerp = perp; bestAlong = acc + t * segLen; }
    acc += segLen;
  }
  return bestAlong;
}

/**
 * Nächster Wegpunkt IN GEHRICHTUNG: der erste Wegpunkt, dessen Lauf-Position entlang
 * `polyline` VOR der zurückgelegten Distanz `doneM` liegt (nicht der nächstgelegene —
 * der kann hinter einem liegen). `distM` = Rest-Distanz dorthin entlang der Route.
 * Sind alle passiert, gilt das Ziel (letzter Wegpunkt) als nächster.
 */
export function nextWaypointAhead(
  polyline: LatLng[], waypoints: LatLng[], doneM: number, epsM = 5,
): { idx: number; distM: number } {
  let bestIdx = -1, bestAlong = Infinity;
  for (let i = 0; i < waypoints.length; i++) {
    const along = alongDistanceM(polyline, waypoints[i]);
    if (along > doneM + epsM && along < bestAlong) { bestAlong = along; bestIdx = i; }
  }
  if (bestIdx === -1) {
    if (waypoints.length === 0) return { idx: -1, distM: 0 };
    const last = waypoints.length - 1;
    return { idx: last, distM: Math.max(0, alongDistanceM(polyline, waypoints[last]) - doneM) };
  }
  return { idx: bestIdx, distM: Math.max(0, bestAlong - doneM) };
}
