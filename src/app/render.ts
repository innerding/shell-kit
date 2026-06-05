// Render-Kern — generisch, registry-/Leaflet-frei. EINE Quelle für die
// POI-Render-Mechanik: Container-SVG, Composite (Container ⊕ Icon ⊕ Deco), Glyph-
// Reihe, Cluster-Mathematik. Assets (Icons/Glyphen) werden HEREINGEREICHT
// (Dependency-Inversion über RenderAssets) — Editor füttert aus der data/-Registry,
// die Runtime aus dem Origin-Bundle. Kein zweiter, von Hand gepflegter Render-Pfad.

import type { Geometry } from './geometry';
import type { DecorationMatch } from './decorations';

// ── Asset-Zugriff (injiziert) ───────────────────────────────────────────────
export interface RenderAssets {
  /** Rohes Glyph-SVG nach ID (z.B. 'meter','anno','frame','stern') oder null. */
  glyphRaw(id: string): string | null;
  /** Rohes Ziffern-Glyph-SVG (0–9) oder null. */
  digitRaw(digit: number): string | null;
}

// ── SVG-Helfer ──────────────────────────────────────────────────────────────
export function extractIconInner(svg: string): string {
  return svg
    .replace(/<\?xml[^>]*\?>/g, '')
    .replace(/<!--[^>]*-->/g, '')
    .replace(/<svg[^>]*>/, '')
    .replace(/<\/svg>/, '')
    .trim();
}

export function buildContainerSvg(geo: Geometry, color: string): string {
  const isStroke = geo.fill_role === 'stroke';
  const fill = isStroke ? 'none' : color;
  const stroke = isStroke ? color : '#000';
  const strokeWidth = isStroke ? 3 : 1;
  const common = `fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linejoin="round"`;
  const s = geo.shape;
  switch (s.kind) {
    case 'circle':
      return `<circle cx="${s.cx}" cy="${s.cy}" r="${s.r}" ${common}/>`;
    case 'rect':
      return `<rect x="${s.x}" y="${s.y}" width="${s.width}" height="${s.height}"${s.rx != null ? ` rx="${s.rx}"` : ''} ${common}/>`;
    case 'polygon':
      return `<polygon points="${s.points.map((p) => p.join(',')).join(' ')}" ${common}/>`;
    case 'path':
      return `<path d="${s.d}" ${common}/>`;
  }
}

// ── Glyph-Reihe einer Deco ──────────────────────────────────────────────────
export function buildGlyphRow(deco: DecorationMatch, assets: RenderAssets): { inner: string; widthUnits: number } {
  const parts: string[] = [];
  let x = 0;
  const placeGlyph = (svgRaw: string) => {
    parts.push(`<svg x="${x}" y="0" width="4" height="5" viewBox="0 0 4 5">${extractIconInner(svgRaw)}</svg>`);
    x += 4;
  };

  if (deco.kind === 'stars') {
    const star = deco.unit_glyph ? assets.glyphRaw(deco.unit_glyph) : null;
    if (star) {
      const n = Math.max(1, Math.min(5, deco.value));
      for (let i = 0; i < n; i++) placeGlyph(star);
    }
    return { inner: parts.join(''), widthUnits: x };
  }

  if (deco.unit_glyph && deco.unit_position === 'left') {
    const u = assets.glyphRaw(deco.unit_glyph);
    if (u) placeGlyph(u);
  }
  for (const ch of deco.digits) {
    const g = assets.digitRaw(parseInt(ch, 10));
    if (g) placeGlyph(g);
  }
  if (deco.unit_glyph && deco.unit_position === 'right') {
    const u = assets.glyphRaw(deco.unit_glyph);
    if (u) placeGlyph(u);
  }
  return { inner: parts.join(''), widthUnits: x };
}

// ── POI-Composite ───────────────────────────────────────────────────────────
export interface CompositeInput {
  geo: Geometry;
  containerColor: string;
  size: number;
  iconInner: string;
  deco: DecorationMatch | null;
  assets: RenderAssets;
}

export function buildComposite(input: CompositeInput): string {
  const { geo, containerColor, size, iconInner, deco, assets } = input;
  const container = buildContainerSvg(geo, containerColor);

  if (deco == null) {
    const offsetY = geo.icon_offset_y ?? 0;
    const iconPart = !iconInner
      ? ''
      : offsetY === 0
        ? iconInner
        : `<g transform="translate(0,${offsetY})">${iconInner}</g>`;
    return `<svg viewBox="0 0 48 48" width="${size}" height="${size}">${container}${iconPart}</svg>`;
  }

  // Summit-Composite mit Zifferncontainer (Frame). Siehe ann_044.
  const { inner: glyphRow, widthUnits: contentUnits } = buildGlyphRow(deco, assets);
  const FRAME_PADDING_X = 4;
  const FRAME_PADDING_Y = 2;
  const frameUnitsW = contentUnits + 2 * FRAME_PADDING_X;
  const frameUnitsH = 5 + 2 * FRAME_PADDING_Y;
  const UNIT_SCALE = 1.2;
  const frameW = frameUnitsW * UNIT_SCALE;
  const frameH = frameUnitsH * UNIT_SCALE;
  const frameX = 24 - frameW / 2;
  const FRAME_ANCHOR_Y = 45;
  const frameY = FRAME_ANCHOR_Y - frameH;
  const DECO_TEXT_SCALE = 0.9;
  const contentW = contentUnits * UNIT_SCALE * DECO_TEXT_SCALE;
  const contentH = 5 * UNIT_SCALE * DECO_TEXT_SCALE;
  const contentX = frameX + (frameW - contentW) / 2;
  const contentY = frameY + (frameH - contentH) / 2;
  const summitIconShift = 0;
  const iconPart = `<g transform="translate(0,${-summitIconShift})">${iconInner}</g>`;
  const frameRaw = assets.glyphRaw('frame');
  const frameInner = frameRaw
    ? extractIconInner(frameRaw).replace('<path ', '<path vector-effect="non-scaling-stroke" ')
    : '';
  return `<svg viewBox="0 0 48 48" width="${size}" height="${size}">` +
    container +
    iconPart +
    `<svg x="${frameX}" y="${frameY}" width="${frameW}" height="${frameH}" viewBox="0 0 8 9" preserveAspectRatio="none">${frameInner}</svg>` +
    `<svg x="${contentX}" y="${contentY}" width="${contentW}" height="${contentH}" viewBox="0 0 ${contentUnits} 5">${glyphRow}</svg>` +
    `</svg>`;
}

// ── Cluster-Mathematik ──────────────────────────────────────────────────────
export interface ClusterEntity<T> {
  x: number;
  y: number;
  members: T[];
}

export function mergeOverlapping<T>(start: ClusterEntity<T>[], swallowDist: number): ClusterEntity<T>[] {
  let ents = start;
  let merged = true;
  while (merged) {
    merged = false;
    outer:
    for (let i = 0; i < ents.length; i++) {
      for (let j = i + 1; j < ents.length; j++) {
        const d = Math.hypot(ents[i].x - ents[j].x, ents[i].y - ents[j].y);
        if (d < swallowDist) {
          const a = ents[i], b = ents[j];
          const na = a.members.length, nb = b.members.length;
          const fused: ClusterEntity<T> = {
            x: (a.x * na + b.x * nb) / (na + nb),
            y: (a.y * na + b.y * nb) / (na + nb),
            members: [...a.members, ...b.members],
          };
          ents = ents.filter((_, k) => k !== i && k !== j);
          ents.push(fused);
          merged = true;
          break outer;
        }
      }
    }
  }
  return ents;
}
