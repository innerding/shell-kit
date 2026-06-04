# shell-kit

Geteilte Shell-Bausteine — die **einzige Quelle der Wahrheit für das Shell-Paket**.
Konsumiert per git-Tag (`"shell-kit": "github:innerding/shell-kit#vX.Y.Z"`) von
Editor (Shell-Studio) und Runtime; beide **referenzieren**, kopieren nie.

## Struktur
- `src/app/` — die per-Rep-Shell, die ins Paket reist (Render-Kern, colorize, BCK/BAK,
  ComfortSliders, intro/reveal, guidance, drossler …).
- `src/launcher/` — our-side-Flächen (Launcher, „powered by"-Kacheln), reisen **nicht**
  per Rep mit. (kommt später)

## Gesetz (siehe scim_source `docs/wege_und_begriffe.md`, `ann_103`)
Das Shell-Paket kommt ausschließlich aus shell-kit. Origin (Daten) + Anthem (Last)
sind eigene Quellen; volle Auslieferung = Shell ⊕ Origin ⊕ Anthem. shell-kit ist
generisch/identitätsfrei (Identität wird beim Publishing gestempelt). `app/` ist eine
Teilmenge: was per Rep ausgespielt wird; `launcher/` bleibt unsere Seite.

## Bauen
`npm install && npm run build` → `dist/` (wird committet, damit git-Tag-Konsumenten
ohne Build-Schritt installieren können). React ist `peerDependency` (jeder Konsument
bringt sein eigenes React — Editor 18, Runtime 19).

## Mitglieder
- `ComfortSliders` (v0.1.0) — die Comfort-Button-UI (Move/Rest), präsentational
  (Props rein), React-only. Kernel (`brodaComfortKernel`) folgt mit eigenem
  generischem Eingangs-Kontrakt.
