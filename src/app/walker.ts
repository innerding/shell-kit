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

// Route-Richtung (Grad) an einer along-Distanz (Segment, das die Distanz enthält).
export function routeBearingAtAlong(poly: readonly LatLng[], targetM: number): number {
  let acc = 0;
  for (let i = 1; i < poly.length; i++) {
    const d = distM(poly[i - 1], poly[i]);
    if (acc + d >= targetM) return bearingDeg(poly[i - 1], poly[i]);
    acc += d;
  }
  return poly.length >= 2 ? bearingDeg(poly[poly.length - 2], poly[poly.length - 1]) : 0;
}

export interface WalkState {
  pos: LatLng;       // aktuelle Position auf der Route
  bearing: number;   // Grad (0 = Nord) — Richtung des aktuellen Segments
  doneM: number;     // bisher zurückgelegt (m)
  totalM: number;    // Gesamtlänge der Route (m)
  progress: number;  // 0..1
  finished: boolean; // Ende erreicht
  offM?: number;     // Lot-Distanz der realen Position zur Route (m) — nur GPS (locateOnRoute); Sim = 0/undefined
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
 * GPS → Route: projiziert eine reale Position `p` auf die Polylinie und liefert denselben
 * `WalkState` wie `walkAlong` (gesnappte Position, Lauf-Distanz, Segment-Bearing). So
 * treibt echtes GPS dieselbe Guidance-Schnittstelle wie der Simulator. `finishM` = wie nah
 * ans Ende (m), bis `finished` greift. `headingOverride` (z. B. GPS-/Kompass-Kurs in Grad)
 * ersetzt das Segment-Bearing, wenn gesetzt (>= 0).
 */
export function locateOnRoute(
  polyline: LatLng[], p: LatLng, finishM = 8, headingOverride = -1,
): WalkState {
  if (!polyline || polyline.length === 0) {
    return { pos: [0, 0], bearing: 0, doneM: 0, totalM: 0, progress: 0, finished: true };
  }
  const start = polyline[0];
  const totalM = polylineLengthM(polyline);
  if (polyline.length < 2 || totalM === 0) {
    return { pos: start, bearing: 0, doneM: 0, totalM, progress: totalM === 0 ? 1 : 0, finished: true };
  }
  // Nächstes Segment (kleinste Lot-Distanz) + Lauf-Distanz + gesnappter Punkt.
  let acc = 0, bestPerp = Infinity, bestAlong = 0, bestSeg = 1, bestT = 0;
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
    if (perp < bestPerp) { bestPerp = perp; bestAlong = acc + t * segLen; bestSeg = i; bestT = t; }
    acc += segLen;
  }
  const a = polyline[bestSeg - 1], b = polyline[bestSeg];
  const pos: LatLng = [a[0] + (b[0] - a[0]) * bestT, a[1] + (b[1] - a[1]) * bestT];
  const bearing = headingOverride >= 0 ? headingOverride : bearingDeg(a, b);
  const doneM = Math.max(0, Math.min(totalM, bestAlong));
  return { pos, bearing, doneM, totalM, progress: doneM / totalM, finished: totalM - doneM <= finishM, offM: bestPerp };
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

// ── „bis nächste Kreuzung" (Guidance-OSM-Kopplung) ───────────────────────────
// Die Shell hat kein OSM, nur das Berechnungsmodell: sie projiziert die via Origin
// mitgereisten Kreuzungen (origin-crossings) auf die aktive Route und rechnet die
// Distanz bis zur nächsten voraus. Getrennt vom Netz/Mesh (unabhängig von der
// reduzierten Struktur).

/** Kreuzung gilt als „auf der Route", wenn ihr Lot ≤ dieser Toleranz ist (m). */
export const CROSSING_ON_ROUTE_TOL_M = 20;

/** Projektion eines Punktes auf die Polylinie: along-Distanz (m ab Start) + Lot (m). */
export function projectAlong(poly: readonly LatLng[], p: LatLng): { along: number; perp: number } {
  let acc = 0, bestPerp = Infinity, bestAlong = 0;
  for (let i = 1; i < poly.length; i++) {
    const a = poly[i - 1], b = poly[i];
    const latRef = toRad(a[0]);
    const bx = toRad(b[1] - a[1]) * Math.cos(latRef) * EARTH_R, by = toRad(b[0] - a[0]) * EARTH_R;
    const px = toRad(p[1] - a[1]) * Math.cos(latRef) * EARTH_R, py = toRad(p[0] - a[0]) * EARTH_R;
    const segLen2 = bx * bx + by * by || 1e-9;
    const t = Math.max(0, Math.min(1, (px * bx + py * by) / segLen2));
    const perp = Math.hypot(px - bx * t, py - by * t);
    if (perp < bestPerp) { bestPerp = perp; bestAlong = acc + t * Math.sqrt(segLen2); }
    acc += Math.sqrt(segLen2);
  }
  return { along: bestAlong, perp: bestPerp };
}

/** Kreuzungen auf die Route projizieren → sortierte along-Distanzen der nahen (≤ TOL). */
export function crossingsAlong(poly: readonly LatLng[], crossings: readonly LatLng[]): number[] {
  if (poly.length < 2) return [];
  const out: number[] = [];
  for (const c of crossings) { const r = projectAlong(poly, c); if (r.perp <= CROSSING_ON_ROUTE_TOL_M) out.push(r.along); }
  return out.sort((a, b) => a - b);
}

/** Distanz bis zur nächsten Kreuzung VORAUS (along > doneM + eps), oder null wenn keine mehr. */
export function nextCrossingAhead(alongs: readonly number[], doneM: number): number | null {
  for (const a of alongs) if (a > doneM + 4) return a - doneM;
  return null;
}
