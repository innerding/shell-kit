#!/usr/bin/env node
// Polarstern-WOFF-Pipeline (wiederholbar) — eine Quelle, ein Befehl:
//   node scripts/build-polarstern.mjs            # holt die kanonische Schrift aus Cassiopeia (R2)
//   node scripts/build-polarstern.mjs <font.json> # oder eine lokale JSON-Quelle
//
// Kette: Cassiopeia (R2, Stroke-JSON, 112 Glyphen)
//   → fontforge (scripts/build_polarstern.py): Mittellinie → matrix(0.76923) → 100-Box
//     → ×10 → EM 1000 → stroke('circular', Gewicht×10, round) = Kontur. Heavy = capsOnly,
//     Tracking pro Gewicht ins advance, Kerning als kern-Paare.
//   → 5× WOFF2 → base64 → src/app/polarstern.ts (installPolarsternFont, @font-face je Gewicht).
// Erfordert fontforge im PATH (brew install fontforge).
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
// Strich-Kalibrierung (an fontforge weitergereicht): Polarstern ist Display-kalibriert
// (Editor = absoluter non-scaling-Strich); proportional gebacken wäre er bei UI-Größen
// ~7× zu dünn. ×3.5 = der abgenommene UI-Wert. Override per Env für Experimente.
process.env.POLAR_STROKE_MULT = process.env.POLAR_STROKE_MULT || '3.5';
const R2 = 'https://scim3-package-worker.jkygrbh6md.workers.dev/api/fonts/polarstern';
// Stroke-Gewicht (Name) → CSS font-weight-Bereich; so greift vorhandene font-weight
// automatisch. Bold deckt 700–800 ab, damit font-weight:800 NICHT auf Heavy (nur
// Versalien) fällt; Heavy bleibt opt-in über genau 900.
const WEIGHT_CLASS = { thin: 100, regular: 400, medium: 500, bold: '700 800', heavy: 900 };
const ORDER = ['thin', 'regular', 'medium', 'bold', 'heavy'];

const work = mkdtempSync(join(tmpdir(), 'polarstern-'));
const srcArg = process.argv[2];

async function loadFont() {
  if (srcArg) { console.log('Quelle: lokal', srcArg); return readFileSync(srcArg, 'utf8'); }
  console.log('Quelle: Cassiopeia (R2)');
  const res = await fetch(R2);
  if (!res.ok) throw new Error(`R2 ${res.status}`);
  return await res.text();
}

const json = await loadFont();
const fontPath = join(work, 'polarstern.json');
writeFileSync(fontPath, json);
const meta = JSON.parse(json);
console.log(`  ${Object.keys(meta.glyphs || {}).length} Glyphen · ${(meta.weights || []).length} Gewichte`);

console.log('fontforge → WOFF2 …');
execFileSync('fontforge', ['-lang=py', '-script', join(HERE, 'build_polarstern.py'), fontPath, work],
  { stdio: ['ignore', 'inherit', 'ignore'] });  // fontforge-„overlap"-Geschwätz auf stderr unterdrückt

const faces = [];
for (const nm of ORDER) {
  const p = join(work, `polarstern-${nm}.woff2`);
  const b64 = readFileSync(p).toString('base64');
  faces.push({ weight: WEIGHT_CLASS[nm], name: nm, b64 });
  console.log(`  ${nm.padEnd(8)} weight=${WEIGHT_CLASS[nm]}  ${(b64.length / 1024).toFixed(1)} KB b64`);
}

const out = `// AUTO-GENERIERT von scripts/build-polarstern.mjs — NICHT von Hand ändern.
// Polarstern (Stroke→Kontur, 5 Gewichte) als base64-WOFF2, einmal in den <head>.
// Quelle = Cassiopeia (R2). Gewicht mappt automatisch auf vorhandene font-weight
// (Thin 100 · Regular 400 · Medium 500 · Bold 700 · Heavy 900 = nur Versal).
// Neu bauen: \`node scripts/build-polarstern.mjs\` (holt die Schrift aus R2).

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
