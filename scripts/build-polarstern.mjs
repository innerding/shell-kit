#!/usr/bin/env node
// Polarstern-WOFF-Pipeline — holt das fertige WOFF-ARTEFAKT aus Cassiopeia (R2)
// und bettet es (TTF→WOFF2 komprimiert) in src/app/polarstern.ts.
//   node scripts/build-polarstern.mjs                 # holt polarstern-woff aus R2
//   node scripts/build-polarstern.mjs <artifact.json> # oder lokales Artefakt
//
// Das Artefakt wird im Kleinen Bären (η „Anwar", opentype.js) gebacken & publiziert
// — EINE Engine. Hier wird nur noch TTF→WOFF2 komprimiert (wawoff2) und eingebettet.
// fontforge/Python entfallen (build_polarstern.py = Alt-Pfad, nicht mehr aufgerufen).
import { compress } from 'wawoff2';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const R2 = 'https://scim3-package-worker.jkygrbh6md.workers.dev/api/fonts/polarstern-woff';
const srcArg = process.argv[2];

async function loadArtifact() {
  if (srcArg) { console.log('Quelle: lokal', srcArg); return JSON.parse(readFileSync(srcArg, 'utf8')); }
  console.log('Quelle: Cassiopeia (R2) · polarstern-woff');
  const res = await fetch(R2);
  if (!res.ok) throw new Error(`R2 ${res.status}`);
  return await res.json();
}

const art = await loadArtifact();
if (!Array.isArray(art.faces) || !art.faces.length) throw new Error('Kein WOFF-Artefakt (faces fehlen)');
console.log(`  ${art.faces.length} Schnitte · ${art.glyphCount ?? '?'} Glyphen · Quelle ${art.source ?? '?'} ${art.createdAt ?? ''}`);

// CSS font-weight je Schnitt; SemiBold (600) deckt 600–700 ab, damit font-weight:bold
// (=700) auf den schwersten gemischt-tauglichen Schnitt fällt, NICHT auf ExtraBold.
const weightCss = (w) => (w === 600 ? '600 700' : String(w));

const faces = [];
for (const f of art.faces) {
  const ttf = new Uint8Array(Buffer.from(f.b64, 'base64'));
  const woff2 = await compress(ttf);
  const b64 = Buffer.from(woff2).toString('base64');
  faces.push({ weight: weightCss(f.cssWeight), b64 });
  console.log(`  ${String(f.name || f.cssWeight).padEnd(12)} weight=${weightCss(f.cssWeight)}  TTF ${(ttf.length / 1024).toFixed(0)} → WOFF2 ${(woff2.length / 1024).toFixed(0)} KB`);
}

const out = `// AUTO-GENERIERT von scripts/build-polarstern.mjs — NICHT von Hand ändern.
// Polarstern als base64-WOFF2, einmal in den <head>. Quelle = WOFF-Artefakt
// 'polarstern-woff' aus Cassiopeia (R2), im Kleinen Bären (η Anwar, opentype.js)
// gebacken; hier nur TTF→WOFF2 komprimiert. font-weight greift automatisch
// (200/400/500 · 600 deckt bold/700 · 800 · 900 = nur Versal).
// Neu bauen: \`node scripts/build-polarstern.mjs\` (holt das Artefakt aus R2).

/** Font-Stack: Polarstern voran, system-ui als Fallback (Ladephase / fehlende Glyphen). */
export const POLARSTERN_STACK = "'Polarstern', system-ui, -apple-system, sans-serif";

const FACES: { weight: number | string; b64: string }[] = [
${faces.map((f) => `  { weight: ${JSON.stringify(f.weight)}, b64: '${f.b64}' },`).join('\n')}
];

let installed = false;
/**
 * Polarstern einmal in das Dokument hängen: @font-face je Gewicht (base64-WOFF2) +
 * \`--polarstern\`-Variable und html/body-Default. Vorhandene font-weight-Angaben
 * wählen automatisch den passenden Schnitt. Idempotent; no-op ohne document (SSR).
 */
export function installPolarsternFont(): void {
  if (typeof document === 'undefined' || installed) return;
  installed = true;
  if (document.getElementById('scim-polarstern-font')) return;
  const css =
    FACES.map((f) =>
      \`@font-face{font-family:'Polarstern';font-style:normal;font-weight:\${f.weight};\` +
      \`font-display:swap;src:url(data:font/woff2;base64,\${f.b64}) format('woff2')}\`
    ).join('') +
    \`:root{--polarstern:\${POLARSTERN_STACK}}html,body{font-family:var(--polarstern)}\`;
  const el = document.createElement('style');
  el.id = 'scim-polarstern-font';
  el.textContent = css;
  document.head.appendChild(el);
}
`;
const target = join(HERE, '..', 'src', 'app', 'polarstern.ts');
writeFileSync(target, out);
console.log('→ src/app/polarstern.ts geschrieben (', (out.length / 1024).toFixed(0), 'KB )');
