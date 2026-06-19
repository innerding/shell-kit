#!/usr/bin/env -S fontforge -lang=py -script
# Polarstern · Stroke-JSON → WOFF2/WOFF pro Gewicht.
# Bildet die Geometrie von renderText.ts EXAKT nach: Mittellinien-Pfad (130-Raum)
#   → matrix(0.76923) → 100-Box (y nach unten, Grundlinie y=75) → ×10 → EM 1000
#   → stroke("circular", weight×10, round) = Kontur. Tracking (gapStandard/-Lower)
# pro Gewicht ins advance gebacken; Heavy = capsOnly (Gemeine → Versal-Outline);
# Kerning als kern-Paare; Gewichts-Klasse 100/400/500/700/900.
#
#   fontforge -lang=py -script build_polarstern.py <font.json> <out-dir>
import fontforge, json, sys, os, re

SRC = sys.argv[1]; OUT = sys.argv[2]
# Strich-Kalibrierung. Der Editor (renderText) nutzt non-scaling-stroke = ABSOLUTE
# Pixel-Breite (größenunabhängig); ein Webfont bäckt den Strich PROPORTIONAL in die
# Kontur (skaliert mit der Größe). 1:1 zur 100er-Box stimmt nur bei ~100 px — bei UI-
# Größen (14 px) ~7× zu dünn. MULT skaliert die Strichstärke (hält die Gewichts-
# Verhältnisse); BOOST = additiver Feinschliff danach. pen = (stroke·MULT + BOOST)·S.
MULT  = float(os.environ.get('POLAR_STROKE_MULT', '1'))
BOOST = float(os.environ.get('POLAR_BOOST', '0'))
os.makedirs(OUT, exist_ok=True)
font = json.load(open(SRC))
M = font['metrics']; BOX = M['boxHeight']; BASE = M['baselineY']
S = 1000.0 / BOX                          # 100-Box → EM 1000
ASC = round(BASE * S); DESC = round((BOX - BASE) * S)   # 750 / 250
GLYPHS = font['glyphs']; KERN = font.get('kerning', {}) or {}
WEIGHT_CLASS = {'Thin':100, 'Regular':400, 'Medium':500, 'Bold':700, 'Heavy':900}
LOWER_RE = re.compile(r'[a-zäöü]')        # ß hat keine 1-Zeichen-Versalie

def is_lower(ch): return bool(LOWER_RE.fullmatch(ch))

def glyph_svg(gdef, lead, weight_units):
    """SVG mit der (gestrichelten) Mittellinie, fertig in EM-Raum transformiert."""
    paths = []
    ax = gdef.get('inkX', 0); ay = BASE
    sx = gdef.get('stretchX', 1); sy = gdef.get('stretchY', 1)
    stretch = ''
    if sx != 1 or sy != 1:
        stretch = ' translate(%g,%g) scale(%g,%g) translate(%g,%g)' % (ax, ay, sx, sy, -ax, -ay)
    for s in (gdef.get('strokes') or ([{'d': gdef['d']}] if gdef.get('d') else [])):
        d = s.get('d')
        if not d: continue
        st = (' ' + s['transform']) if s.get('transform') else ''
        tf = 'scale(%g) translate(%g,0)%s%s' % (S, lead, stretch, st)
        paths.append('<path d="%s" fill="none" transform="%s"/>' % (d, tf))
    return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000">%s</svg>'
            % ''.join(paths))

faces = []
for w in font['weights']:
    name = w['name']; stroke = w['stroke']; caps_only = w.get('capsOnly', False)
    gapU = w.get('gapStandard', 0)
    gapL = w.get('gapStandardLower', gapU)
    f = fontforge.font()
    f.encoding = 'UnicodeFull'; f.em = 1000; f.ascent = ASC; f.descent = DESC
    f.familyname = 'Polarstern'; f.fontname = 'Polarstern-' + name
    f.fullname = 'Polarstern ' + name
    f.weight = name; f.os2_weight = WEIGHT_CLASS.get(name, 400)
    f.copyright = 'Polarstern · Dietmar Broda · SCIM3 internal'

    pen_w = (stroke * MULT + BOOST) * S
    built = 0
    for ch, gdef in GLYPHS.items():
        if len(ch) != 1: continue
        cp = ord(ch)
        src = gdef; lead = gdef.get('lead', 0)
        trk = gapU
        if caps_only and is_lower(ch):
            up = ch.upper()
            if len(up) == 1 and up in GLYPHS:   # Gemein → Versal-Outline
                src = GLYPHS[up]; lead = src.get('lead', 0); trk = gapU
            else:
                trk = gapL
        elif is_lower(ch):
            trk = gapL
        g = f.createChar(cp, ch)
        g.width = round((src.get('advance', 0) + trk) * S)
        svg = glyph_svg(src, lead, pen_w)
        tmp = '/tmp/_pf_%d.svg' % cp
        open(tmp, 'w').write(svg)
        g.importOutlines(tmp, scale=False)
        if g.foreground.isEmpty():
            continue                       # z.B. Komma kann leer geraten — sonst stroke crasht
        try:
            g.stroke('circular', pen_w, 'round', 'round')
            g.removeOverlap(); g.round()
        except Exception as e:
            sys.stderr.write('stroke %r (%s): %s\n' % (ch, name, e))
        built += 1
    # Leerzeichen
    sp = f.createChar(32, 'space'); sp.width = round(0.3 * BOX * S)

    # Kerning
    if KERN:
        f.addLookup('kern', 'gpos_pair', (), (('kern', (('latn', ('dflt',)), ('DFLT', ('dflt',)))),))
        f.addLookupSubtable('kern', 'kern-0')
        for pair, val in KERN.items():
            if len(pair) != 2: continue
            l, r = pair[0], pair[1]
            if ord(l) in f and ord(r) in f:
                try: f[ord(l)].addPosSub('kern-0', r, 0, 0, round(val * S), 0, 0, 0, 0, 0)
                except Exception: pass

    woff2 = os.path.join(OUT, 'polarstern-%s.woff2' % name.lower())
    f.generate(woff2)
    f.generate(os.path.join(OUT, 'polarstern-%s.woff' % name.lower()))
    print('%-8s glyphs=%-3d class=%d → %s' % (name, built, f.os2_weight, os.path.basename(woff2)))
    faces.append((name, WEIGHT_CLASS.get(name, 400)))

# CSS @font-face (Gewichts-Mapping: vorhandene font-weight greift automatisch)
css = ['/* Polarstern · generiert von build_polarstern.py — nicht von Hand ändern */']
for name, cls in faces:
    css.append(
        "@font-face{font-family:'Polarstern';font-style:normal;font-weight:%d;"
        "font-display:swap;src:url('./polarstern-%s.woff2') format('woff2'),"
        "url('./polarstern-%s.woff') format('woff');}" % (cls, name.lower(), name.lower()))
open(os.path.join(OUT, 'polarstern.css'), 'w').write('\n'.join(css) + '\n')
print('CSS → polarstern.css (%d faces)' % len(faces))
