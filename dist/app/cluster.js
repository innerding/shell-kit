// Dynamische, zoom-abhängige Cluster-Render-Mechanik — EINE Quelle (Editor + Runtime).
//
// Verhalten (User-Spec, project-cluster-ghost-map):
//  - Getrennte Mitglieder → einzelne Icons, kein Ghost/Ring.
//  - Annäherung (Zentren < ANNOUNCE) → blasser Hexagon-Ring (Ankündigung).
//  - Überlappung (Zentren < SWALLOW) → Ghost (Cluster-Container + -Icon), wächst.
// Alles in Pixeln → bei jedem zoomend/moveend neu laufen.
//
// Generisch: die Komposition (POI → SVG) wird HEREINGEREICHT (renderSvg) — der Editor
// füttert poiCompositeSvg (Registry), die Runtime buildComposite (Bundle-Assets). Den
// Hexagon-Ring baut der Kern selbst (buildContainerSvg + geometryOf).
import L from 'leaflet';
import { buildContainerSvg, mergeOverlapping } from './render';
import { geometryOf } from './geometry';
const ICON = 30;
const SWALLOW = ICON;
const ANNOUNCE = ICON * 2;
const GHOST_MIN = 34;
const GHOST_MAX = 56;
const HEX_COLOR = '#ff00ff';
function markerHtml(svg, size, opacity = 1, badge = '') {
    const inner = `<div style="width:${size}px;height:${size}px;line-height:0;` +
        (opacity < 1 ? `opacity:${opacity};` : 'filter:drop-shadow(0 1px 2px rgba(0,0,0,.55));') +
        `">${svg}</div>`;
    // Eck-Badge (Weg-Nummer) — vom Konsumenten geliefert; relativ positioniert.
    return badge ? `<div style="position:relative;width:${size}px;height:${size}px;">${inner}${badge}</div>` : inner;
}
function placeMarker(layer, latlng, html, size, opts = {}) {
    const m = L.marker(latlng, {
        icon: L.divIcon({ html, className: '', iconSize: [size, size], iconAnchor: [size / 2, size / 2] }),
        interactive: opts.interactive ?? true,
        zIndexOffset: opts.z ?? 0,
    });
    if (opts.tooltip)
        m.bindTooltip(opts.tooltip);
    if (opts.onClick)
        m.on('click', opts.onClick);
    m.addTo(layer);
}
/**
 * Rendert die geclusterten Mitglieder (mit .cluster) in `layer` — neu aufrufen bei zoom/move.
 * `onMemberClick` (optional) wird NUR an EINZELN gezeigte Mitglieder gehängt (nicht an
 * den Ghost): ein verschlucktes Mitglied ist nicht da, ein einzeln sichtbares ist wie
 * ein normaler POI anwählbar (Routenbildung) — der Konsument bekommt das ClusterMember.
 */
export function renderClusterPois(map, layer, members, ghostByCluster, onMemberClick, 
// Weg-Nummer eines Mitglieds (0 = nicht auf der Route) + Badge-HTML-Builder (vom
// Konsumenten, mit dessen Ziffern). Einzeln gezeigte Mitglieder tragen ihre Nummer;
// ein Ghost trägt die KLEINSTE Nummer seiner verschluckten Mitglieder (überträgt
// sich beim Einzoomen auf das dann sichtbare Mitglied).
routeNumOf, numBadgeHtml) {
    layer.clearLayers();
    const byCluster = new Map();
    for (const m of members) {
        if (!m.cluster)
            continue;
        const list = byCluster.get(m.cluster);
        if (list)
            list.push(m);
        else
            byCluster.set(m.cluster, [m]);
    }
    const hexGeo = geometryOf('geo_special_hexagon_ring');
    for (const [clusterName, ms] of byCluster) {
        const ents = mergeOverlapping(ms.map((m) => {
            const p = map.latLngToLayerPoint([m.coord[1], m.coord[0]]);
            return { x: p.x, y: p.y, members: [m] };
        }), SWALLOW);
        const ghost = ghostByCluster.get(clusterName);
        // Pro manuellem Cluster nur EIN Ghost: alle ≥2-Entities (Ghost-würdig) werden zu
        // einem zusammengefasst. Größe = Summe aller verschluckten Mitglieder, Position =
        // die größte (dichteste) Gruppe. Einzeln-isolierte Mitglieder bleiben Icons.
        const ghostEnts = ents.filter((e) => e.members.length >= 2);
        const singleEnts = ents.filter((e) => e.members.length < 2);
        if (ghostEnts.length > 0) {
            const total = ghostEnts.reduce((s, e) => s + e.members.length, 0);
            const anchor = ghostEnts.reduce((a, b) => (b.members.length > a.members.length ? b : a));
            const latlng = map.layerPointToLatLng(L.point(anchor.x, anchor.y));
            const size = Math.min(GHOST_MAX, GHOST_MIN + (total - 2) * 5);
            const svg = ghost ? ghost.renderSvg(size) : '';
            const names = ghostEnts.flatMap((e) => e.members.map((m) => m.text)).join(' · ');
            // Ghost-Nummern = ALLE Weg-Nummern der verschluckten Mitglieder als versetzter
            // Stapel (kleinste oben, weitere rechts-unten versetzt → deutet „mehrere" an;
            // übertragen sich beim Einzoomen auf die einzeln sichtbaren Mitglieder).
            const ghostNums = [];
            for (const e of ghostEnts)
                for (const mm of e.members) {
                    const n = mm.id != null ? (routeNumOf?.(mm.id) ?? 0) : 0;
                    if (n > 0)
                        ghostNums.push(n);
                }
            ghostNums.sort((a, b) => a - b);
            let ghostBadge = '';
            if (numBadgeHtml) {
                // letztes zuerst (tiefster Versatz, hinten), kleinste zuletzt = obenauf.
                for (let i = ghostNums.length - 1; i >= 0; i--)
                    ghostBadge += numBadgeHtml(ghostNums[i], size, i);
            }
            placeMarker(layer, latlng, markerHtml(svg, size, 1, ghostBadge), size, {
                z: 1000,
                tooltip: `<strong>${ghost?.text ?? clusterName}</strong><br/>` +
                    `<span style="color:#718096">${total} POIs</span><br/><em>${names}</em>`,
            });
        }
        for (const e of singleEnts) {
            const latlng = map.layerPointToLatLng(L.point(e.x, e.y));
            const m = e.members[0];
            const svg = m.renderSvg(ICON);
            if (!svg)
                continue;
            // Einzeln sichtbares Mitglied = wie ein normaler POI anwählbar (Routenbildung).
            const num = m.id != null ? (routeNumOf?.(m.id) ?? 0) : 0;
            const badge = num > 0 && numBadgeHtml ? numBadgeHtml(num, ICON) : '';
            placeMarker(layer, latlng, markerHtml(svg, ICON, 1, badge), ICON, {
                tooltip: `<strong>${m.text}</strong><br/><span style="color:#718096">${m.subcategory}</span>`,
                onClick: onMemberClick ? () => onMemberClick(m) : undefined,
            });
        }
        // Ankündigung: blasser Hexagon-Ring über sich nähernde Paare (>= SWALLOW, < ANNOUNCE).
        if (hexGeo) {
            for (let i = 0; i < ents.length; i++) {
                for (let j = i + 1; j < ents.length; j++) {
                    const d = Math.hypot(ents[i].x - ents[j].x, ents[i].y - ents[j].y);
                    if (d >= SWALLOW && d < ANNOUNCE) {
                        const cx = (ents[i].x + ents[j].x) / 2;
                        const cy = (ents[i].y + ents[j].y) / 2;
                        const latlng = map.layerPointToLatLng(L.point(cx, cy));
                        const ringSize = Math.min(GHOST_MAX + 18, d + ICON);
                        const ringInner = buildContainerSvg(hexGeo, HEX_COLOR).replace('fill="none"', `fill="${HEX_COLOR}"`);
                        const ringSvg = `<svg viewBox="0 0 48 48" width="${ringSize}" height="${ringSize}">${ringInner}</svg>`;
                        placeMarker(layer, latlng, markerHtml(ringSvg, ringSize, 0.33), ringSize, { interactive: false, z: 500 });
                    }
                }
            }
        }
    }
}
