// Route-Rendering (bak-test) — EINE Quelle, Leaflet-abhängig (eigener Subpath
// shell-kit/route, damit der App-Barrel leaflet-frei bleibt — wie mesh/cluster).
//
// Zeichnet die von solveRoute gelöste Route als durchgehende Linie über dem Mesh
// + nummerierte Waypoint-Marken in Tipp-/Reise-Reihenfolge.
import L from 'leaflet';
import type { Route } from './bak';
import type { LatLng, SegmentedNet } from './anthem';

export interface RenderRouteOpts {
  color?: string;     // Routen-Farbe (Default: neutrales Navy)
  weight?: number;    // Routen-Stärke
  /** Optionaler Leaflet-Renderer für die Route-Polylinien. SVG (statt Map-Default
   *  Canvas) ist nötig, damit das Busy-Overlay per CSS-Klasse animieren kann —
   *  auf Canvas greifen keine CSS-Keyframes. Das schwere Mesh bleibt auf Canvas. */
  renderer?: L.Renderer;
  // Busy-Overlay (ann_135): Route-Stretches über Comfort ZAPPELN in der Stroke-
  // Stärke (gut sichtbar). `net` liefert die Geometrie, `dimmedStretchIds` welche
  // Stretches über Comfort sind — gezappelt werden nur die, die AUF der Route liegen.
  net?: SegmentedNet;
  dimmedStretchIds?: Set<string>;
  // Liefert das Roh-SVG einer Ziffer (currentColor, füllt die Zelle). Wenn
  // gesetzt, werden die Waypoint-Nummern aus diesen Custom-Ziffern gebaut statt
  // aus System-Text — passend zur Rest-Dauer-Uhr (gleiche hand-gezeichnete Glyphen).
  digitRaw?: (d: string) => string;
  /** Default true. false = KEINE Nummern-Scheiben zeichnen — die Reihenfolge-Nummer
   *  trägt dann der POI-Marker selbst (rechts oben in der Ecke), statt sie zentriert
   *  über das POI zu legen. */
  waypointNumbers?: boolean;
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
  const renderer = opts.renderer;

  if (route && route.points.length >= 2) {
    const line = route.points as L.LatLngExpression[];
    // weiße Unterlage für Kontrast, dann farbige Route darüber.
    L.polyline(line, { color: '#ffffff', weight: weight + 3, opacity: 0.9, lineCap: 'round', lineJoin: 'round', renderer }).addTo(layer);
    L.polyline(line, { color, weight, opacity: 0.95, lineCap: 'round', lineJoin: 'round', renderer }).addTo(layer);
  }

  // Busy-Overlay: Engpass-Stretches AUF der Route (route ∩ dimmed) als pulsierende
  // Linie darüber. Stroke-Stärke zappelt (Keyframe `scim-route-busy`, runtime-seitig);
  // Phasen-Versatz pro Stück → Schimmern. Geometrie aus dem Netz.
  //
  // Jeder Engpass bekommt ZWEI mit-pulsierende Linien: ein weißes Casing (breiter, in
  // Phase) + der farbige Puls darüber. Das Casing bindet das Zappeln sichtbar AN die
  // Route — ohne es löst das Auge die nackte Pulslinie ab und liest sie als loses
  // Fragment abseits der weiß-gefassten Route (Befund 2026-06-11). Die Geometrie liegt
  // immer auf route.points (s ∈ route.stretchIds); das Casing macht das auch sichtbar.
  if (route && opts.net && opts.dimmedStretchIds && opts.dimmedStretchIds.size > 0) {
    const onRoute = new Set(route.stretchIds);
    let k = 0;
    for (const s of opts.net.stretches) {
      if (!onRoute.has(s.id) || !opts.dimmedStretchIds.has(s.id) || s.points.length < 2) continue;
      const seg = s.points as L.LatLngExpression[];
      const d = k++ % 4;
      L.polyline(seg, {
        color: '#ffffff', weight: weight + 3, opacity: 0.95, lineCap: 'round', lineJoin: 'round', renderer,
        className: `scim-route-busy-casing scim-seg-d${d}`,
      }).addTo(layer);
      L.polyline(seg, {
        color, weight, opacity: 0.95, lineCap: 'round', lineJoin: 'round', renderer,
        className: `scim-route-busy scim-seg-d${d}`,
      }).addTo(layer);
    }
  }

  if (opts.waypointNumbers !== false) {
    waypoints.forEach((wp, i) => {
      L.marker(wp as L.LatLngExpression, { icon: waypointBadge(i + 1, color, opts.digitRaw), interactive: false, zIndexOffset: 1000 }).addTo(layer);
    });
  }
}
