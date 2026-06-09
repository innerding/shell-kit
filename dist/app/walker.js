const EARTH_R = 6371000; // m
const toRad = (d) => (d * Math.PI) / 180;
/** Haversine-Distanz in Metern zwischen zwei [lat, lng]. */
export function distM([lat1, lng1], [lat2, lng2]) {
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return 2 * EARTH_R * Math.asin(Math.min(1, Math.sqrt(a)));
}
/** Gesamtlänge einer Polylinie in Metern. */
export function polylineLengthM(pts) {
    let s = 0;
    for (let i = 1; i < pts.length; i++)
        s += distM(pts[i - 1], pts[i]);
    return s;
}
/** Peilung in Grad (0 = Nord, im Uhrzeigersinn) von a nach b. */
export function bearingDeg([lat1, lng1], [lat2, lng2]) {
    const phi1 = toRad(lat1);
    const phi2 = toRad(lat2);
    const dLng = toRad(lng2 - lng1);
    const y = Math.sin(dLng) * Math.cos(phi2);
    const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLng);
    return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}
/**
 * Position entlang der Polylinie nach `elapsedSec` bei `speedMps` (m/s).
 * Linear interpoliert auf dem aktuellen Segment. `speedMps` darf einen
 * Zeitraffer-Faktor enthalten (Sim-Tempo). Bei <2 Punkten: statisch am Start.
 */
export function walkAlong(polyline, elapsedSec, speedMps) {
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
        if (segLen === 0)
            continue;
        if (acc + segLen >= target) {
            const t = (target - acc) / segLen; // 0..1 auf diesem Segment
            const pos = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
            return { pos, bearing: bearingDeg(a, b), doneM: target, totalM, progress: target / totalM, finished: false };
        }
        acc += segLen;
    }
    // Fallback (sollte durch target<totalM nicht erreicht werden)
    const last = polyline[polyline.length - 1];
    const prev = polyline[polyline.length - 2];
    return { pos: last, bearing: bearingDeg(prev, last), doneM: totalM, totalM, progress: 1, finished: true };
}
/** Nächster Wegpunkt (POI) zur Position — für die „nächster Halt"-Anzeige. */
export function nearestWaypoint(pos, waypoints) {
    let idx = -1;
    let best = Infinity;
    for (let i = 0; i < waypoints.length; i++) {
        const d = distM(pos, waypoints[i]);
        if (d < best) {
            best = d;
            idx = i;
        }
    }
    return { idx, distM: best };
}
