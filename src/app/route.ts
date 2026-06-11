// Route-Rendering (bak-test) — EINE Quelle, Leaflet-abhängig (eigener Subpath
// shell-kit/route, damit der App-Barrel leaflet-frei bleibt — wie mesh/cluster).
//
// Zeichnet die von solveRoute gelöste Route als durchgehende Linie über dem Mesh
// + nummerierte Waypoint-Marken in Tipp-/Reise-Reihenfolge.
import L from 'leaflet';
import type { Route } from './bak';
import type { LatLng } from './anthem';

export interface RenderRouteOpts {
  color?: string;     // Routen-Farbe (Default: neutrales Navy)
  weight?: number;    // Routen-Stärke
  // Liefert das Roh-SVG einer Ziffer (currentColor, füllt die Zelle). Wenn
  // gesetzt, werden die Waypoint-Nummern aus diesen Custom-Ziffern gebaut statt
  // aus System-Text — passend zur Rest-Dauer-Uhr (gleiche hand-gezeichnete Glyphen).
  digitRaw?: (d: string) => string;
}

// Nummerierte Waypoint-Marke (kleine gefüllte Scheibe mit Reihenfolge-Ziffer).
function waypointBadge(n: number, color: string, digitRaw?: (d: string) => string): L.DivIcon {
  const inner = digitRaw
    ? `<div style="display:flex;align-items:center;justify-content:center;gap:1px;width:100%;height:100%;color:#fff;">` +
      String(n).split('').map((d) =>
        `<span style="display:inline-block;width:7px;height:9px;line-height:0;">${digitRaw(d)}</span>`).join('') +
      `</div>`
    : `<div style="color:#fff;font:700 12px/18px system-ui,sans-serif;text-align:center;width:100%;">${n}</div>`;
  const html =
    `<div style="width:22px;height:22px;border-radius:50%;background:${color};box-sizing:border-box;` +
    `border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;">${inner}</div>`;
  return L.divIcon({ html, className: '', iconSize: [22, 22], iconAnchor: [11, 11] });
}

/**
 * Zeichnet Route + Waypoint-Marken in `layer`. `waypoints` = die gewählten
 * POI-Koordinaten [lat,lng] in Reise-Reihenfolge (für die Nummern).
 * Bei `route === null` werden nur die Marken gesetzt (noch keine lösbare Route).
 */
export function renderRoute(
  layer: L.LayerGroup,
  route: Route | null,
  waypoints: LatLng[],
  opts: RenderRouteOpts = {},
): void {
  layer.clearLayers();
  // Route ENTKOPPELT von Comfort (ann_133): ein NEUTRALER Pfad — zeigt nur WO man
  // geht, durchgezogen. Die Last erzählt allein das Mesh (per-Segment); KEIN
  // Whole-Route-Breach-Strich mehr (war falsch granuliert + visuell willkürlich).
  const color = opts.color ?? '#1b2a6b';
  const weight = opts.weight ?? 5;

  if (route && route.points.length >= 2) {
    const line = route.points as L.LatLngExpression[];
    // weiße Unterlage für Kontrast, dann farbige Route darüber.
    L.polyline(line, { color: '#ffffff', weight: weight + 3, opacity: 0.9, lineCap: 'round', lineJoin: 'round' }).addTo(layer);
    L.polyline(line, { color, weight, opacity: 0.95, lineCap: 'round', lineJoin: 'round' }).addTo(layer);
  }

  waypoints.forEach((wp, i) => {
    L.marker(wp as L.LatLngExpression, { icon: waypointBadge(i + 1, color, opts.digitRaw), interactive: false, zIndexOffset: 1000 }).addTo(layer);
  });
}
