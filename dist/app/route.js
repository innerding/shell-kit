// Route-Rendering (bak-test) — EINE Quelle, Leaflet-abhängig (eigener Subpath
// shell-kit/route, damit der App-Barrel leaflet-frei bleibt — wie mesh/cluster).
//
// Zeichnet die von solveRoute gelöste Route als durchgehende Linie über dem Mesh
// + nummerierte Waypoint-Marken in Tipp-/Reise-Reihenfolge.
import L from 'leaflet';
// Nummerierte Waypoint-Marke (kleine gefüllte Scheibe mit Reihenfolge-Ziffer).
function waypointBadge(n, color, digitRaw) {
    const inner = digitRaw
        ? `<div style="display:flex;align-items:center;justify-content:center;gap:1px;width:100%;height:100%;color:#fff;">` +
            String(n).split('').map((d) => `<span style="display:inline-block;width:7px;height:9px;line-height:0;">${digitRaw(d)}</span>`).join('') +
            `</div>`
        : `<div style="color:#fff;font:700 12px/18px system-ui,sans-serif;text-align:center;width:100%;">${n}</div>`;
    const html = `<div style="width:22px;height:22px;border-radius:50%;background:${color};box-sizing:border-box;` +
        `border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;">${inner}</div>`;
    return L.divIcon({ html, className: '', iconSize: [22, 22], iconAnchor: [11, 11] });
}
/**
 * Zeichnet Route + Waypoint-Marken in `layer`. `waypoints` = die gewählten
 * POI-Koordinaten [lat,lng] in Reise-Reihenfolge (für die Nummern).
 * Bei `route === null` werden nur die Marken gesetzt (noch keine lösbare Route).
 */
export function renderRoute(layer, route, waypoints, opts = {}) {
    layer.clearLayers();
    // Route ENTKOPPELT von Comfort (ann_133): ein NEUTRALER Pfad — zeigt nur WO man
    // geht, durchgezogen. Die Last erzählt allein das Mesh (per-Segment); KEIN
    // Whole-Route-Breach-Strich mehr (war falsch granuliert + visuell willkürlich).
    const color = opts.color ?? '#1b2a6b';
    const weight = opts.weight ?? 5;
    const renderer = opts.renderer;
    if (route && route.points.length >= 2) {
        const line = route.points;
        // weiße Unterlage für Kontrast, dann farbige Route darüber.
        L.polyline(line, { color: '#ffffff', weight: weight + 3, opacity: 0.9, lineCap: 'round', lineJoin: 'round', renderer }).addTo(layer);
        L.polyline(line, { color, weight, opacity: 0.95, lineCap: 'round', lineJoin: 'round', renderer }).addTo(layer);
    }
    // Busy-Overlay: Engpass-Teile AUF der Route (route ∩ dimmed) als pulsierende Linie
    // darüber. Stroke-Stärke zappelt (Keyframe `scim-route-busy`, runtime-seitig);
    // Phasen-Versatz pro Stück → Schimmern.
    //
    // WICHTIG (Befund 2026-06-11 „Netz vs. Route"): die Geometrie kommt aus route.legs
    // (Slice der ROUTE), NICHT aus net.stretches[].points (die ganze Netz-Strecke). Sonst
    // zeigt das Overlay den Strecken-Anteil mit, der NICHT auf der Route liegt (Netz und
    // Route vermischt). Aus legs ist der Puls per Konstruktion ein Subset der Route.
    //
    // Jeder Engpass bekommt ZWEI mit-pulsierende Linien: ein weißes Casing (breiter, in
    // Phase) + der farbige Puls darüber. Das Casing bindet das Zappeln sichtbar AN die
    // weiß-gefasste Route.
    if (route && opts.dimmedStretchIds && opts.dimmedStretchIds.size > 0) {
        const dimmed = opts.dimmedStretchIds;
        const drawBusy = (seg, k) => {
            const d = k % 4;
            L.polyline(seg, {
                color: '#ffffff', weight: weight + 3, opacity: 0.95, lineCap: 'round', lineJoin: 'round', renderer,
                className: `scim-route-busy-casing scim-seg-d${d}`,
            }).addTo(layer);
            L.polyline(seg, {
                color, weight, opacity: 0.95, lineCap: 'round', lineJoin: 'round', renderer,
                className: `scim-route-busy scim-seg-d${d}`,
            }).addTo(layer);
        };
        if (route.legs && route.legs.length > 0) {
            // Routen-treu: nur die Punkte-Slices der Route, die zu belebten Strecken gehören.
            let k = 0;
            for (const leg of route.legs) {
                if (!dimmed.has(leg.stretchId))
                    continue;
                const seg = route.points.slice(leg.from, leg.to + 1);
                if (seg.length < 2)
                    continue;
                drawBusy(seg, k++);
            }
        }
        else if (opts.net) {
            // Fallback (Route ohne legs, z. B. manuell konstruiert): ganze Netz-Strecke.
            const onRoute = new Set(route.stretchIds);
            let k = 0;
            for (const s of opts.net.stretches) {
                if (!onRoute.has(s.id) || !dimmed.has(s.id) || s.points.length < 2)
                    continue;
                drawBusy(s.points, k++);
            }
        }
    }
    if (opts.waypointNumbers !== false) {
        waypoints.forEach((wp, i) => {
            L.marker(wp, { icon: waypointBadge(i + 1, color, opts.digitRaw), interactive: false, zIndexOffset: 1000 }).addTo(layer);
        });
    }
}
