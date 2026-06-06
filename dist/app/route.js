// Route-Rendering (bak-test) — EINE Quelle, Leaflet-abhängig (eigener Subpath
// shell-kit/route, damit der App-Barrel leaflet-frei bleibt — wie mesh/cluster).
//
// Zeichnet die von solveRoute gelöste Route als durchgehende Linie über dem Mesh
// + nummerierte Waypoint-Marken in Tipp-/Reise-Reihenfolge.
import L from 'leaflet';
// Nummerierte Waypoint-Marke (kleine gefüllte Scheibe mit Reihenfolge-Ziffer).
function waypointBadge(n, color) {
    const html = `<div style="width:22px;height:22px;border-radius:50%;background:${color};` +
        `border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.5);color:#fff;` +
        `font:700 12px/18px system-ui,sans-serif;text-align:center;">${n}</div>`;
    return L.divIcon({ html, className: '', iconSize: [22, 22], iconAnchor: [11, 11] });
}
/**
 * Zeichnet Route + Waypoint-Marken in `layer`. `waypoints` = die gewählten
 * POI-Koordinaten [lat,lng] in Reise-Reihenfolge (für die Nummern).
 * Bei `route === null` werden nur die Marken gesetzt (noch keine lösbare Route).
 */
export function renderRoute(layer, route, waypoints, opts = {}) {
    layer.clearLayers();
    const breach = opts.breach ?? false;
    const color = opts.color ?? (breach ? '#d2502a' : '#1b2a6b');
    const weight = opts.weight ?? 5;
    if (route && route.points.length >= 2) {
        const line = route.points;
        // weiße Unterlage für Kontrast, dann farbige Route darüber.
        L.polyline(line, { color: '#ffffff', weight: weight + 3, opacity: 0.9, lineCap: 'round', lineJoin: 'round' }).addTo(layer);
        L.polyline(line, { color, weight, opacity: 0.95, lineCap: 'round', lineJoin: 'round', dashArray: breach ? '10 8' : undefined }).addTo(layer);
    }
    waypoints.forEach((wp, i) => {
        L.marker(wp, { icon: waypointBadge(i + 1, color), interactive: false, zIndexOffset: 1000 }).addTo(layer);
    });
}
