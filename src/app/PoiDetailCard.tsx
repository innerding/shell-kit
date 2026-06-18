// POI-Detail-Card (ann_143) — das POI-Modal. Öffnet per Long-tap ODER bei Überlast
// vom System; sieht in beiden Fällen gleich aus (Last-Zustand entscheidet, nicht der
// Trigger). Reiner HINWEIS: KEIN Knopf, KEIN × — Tap aufs Modal = weg. An-/abgewählt
// wird auf der KARTE. Rahmen in der Comfort-EINSTELL-Farbe (frameColor), innen die
// leuchtende Diode (tatsächliche Last) + ein obligatorisches Achtung-Triangle, das über
// Comfort pulst. Wiederverwendbar als S4-Ankunfts-Card (variant='arrival').
// i18n-agnostisch: die paar Labels reicht der Host als `labels`-Prop rein (Texte bleiben app-seitig).
import ComfortDiode from './ComfortDiode';
import WarnTriangle from './WarnTriangle';
import { GLASS } from './glass';

interface PoiDetailCardProps {
  svgHtml: string;          // Composite-Icon (Container + Icon), vorgerendert
  title: string;            // Tagline (text)
  description?: string;     // description_short aus dem Origin-Datensatz
  photo?: string;           // optionale Bild-URL (vorwärtskompatibel)
  link?: string;            // optionaler Link (vorwärtskompatibel)
  onClose: () => void;      // Tap aufs Modal = weg
  variant?: 'detail' | 'arrival';
  members?: string[];       // Cluster-Ghost: Taglines der gebündelten Ziele (kompakt)
  hint?: string;            // Cluster-Ghost: Handlungs-Hinweis („Zoom hinein …")
  flagSvg?: string;         // Ankunft: Ziel-Flagge (target-flag.svg) in der Kopfzeile
  comfort?: { word: string; color: string; intensity: number };  // Live-Last als Diode (+ Triangle bei >0)
  frameColor?: string;      // Rahmen in der Comfort-EINSTELL-Farbe
  summary?: { html: string; size: number }[];  // Sammelmodal: POI-Reihe oben — vorkomponierte Karten-Marker (Icon+Zappel+Nummer), 1 Quelle mit der Karte
  clearRight?: number;      // px rechts freihalten (Achtung-Modal darf nicht über den offenen Slider reichen)
  /** Lokalisierte Labels — der Host reicht sie aus seiner i18n rein (Texte app-seitig). */
  labels: { noDescription: string; learnMore: string; targets: (n: number) => string };
}

const NAVY = '#1b2a6b';

export default function PoiDetailCard({
  svgHtml, title, description, photo, link,
  onClose, variant = 'detail', members, hint, flagSvg, comfort, frameColor, summary, clearRight = 0, labels,
}: PoiDetailCardProps) {
  const arrival = variant === 'arrival';
  // Ankunfts-/Ziel-Modal trägt KEINE POI-Last-Anzeige (kein Diode, kein Last-Wasserzeichen).
  const intensity = arrival ? 0 : (comfort?.intensity ?? 0);
  const border = arrival ? `2px solid ${NAVY}` : frameColor ? `3px solid ${frameColor}` : '1px solid rgba(20,34,62,0.10)';
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 10010,   // ÜBER dem telco-sim-Band (zIndex 10000)
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 38,
        // Achtung-Modal: rechts den offenen Slider freihalten (+ links etwas Luft).
        paddingLeft: clearRight ? 12 : undefined, paddingRight: clearRight || undefined,
        backdropFilter: 'blur(1.5px)', WebkitBackdropFilter: 'blur(1.5px)',   // nur Blur, kein Abdunkeln
        fontFamily: 'Polarstern, system-ui,-apple-system,sans-serif',
      }}
    >
      <div
        role="dialog"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        style={{
          ...GLASS,                                    // Glass-Panel = äußerer Fill (gemeinsamer Look)
          position: 'relative', width: clearRight ? 'min(360px, 100%)' : 'min(86vw, 360px)',
          color: '#14223e', borderRadius: 18, padding: 7,   // padding = Passepartout-Luft um den Last-Stroke
          boxShadow: '0 12px 44px rgba(0,0,0,0.34)',
        }}
      >
        {/* Farbiger Last-Stroke-Frame (frameColor = Last am POI), VOM Panel-Fill umrahmt:
            das Glass-Panel ist der äußere Rand, der Stroke sitzt innen mit etwas Luft. */}
        <div style={{ position: 'relative', border, borderRadius: 12, overflow: 'hidden', maxHeight: '78vh', overflowY: 'auto', background: 'rgba(255,255,255,0.34)' }}>
          {/* Achtung-Triangle-Wasserzeichen — pulst über Comfort, sonst nichts. Farbe =
              Ton der tatsächlichen Last (comfort.color), nicht fix orange-rot. */}
          <WarnTriangle intensity={intensity} color={comfort?.color ?? '#d1495b'} />

          <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Sammelmodal: alle Ziele oben in einer Reihe — exakt die Karten-Marker
              (Icon + Zappel + Eck-Nummer aus numBadgeHtml), 1 Quelle mit der Karte. */}
          {summary && summary.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, padding: '16px 16px 4px', justifyContent: 'center' }}>
              {summary.map((s, i) => (
                <span key={i} style={{ display: 'block', width: s.size, height: s.size, lineHeight: 0 }} dangerouslySetInnerHTML={{ __html: s.html }} />
              ))}
            </div>
          )}
          {/* Kopf: Icon + Titel + Diode (kein × — Tap aufs Modal schließt). Titel vertikal
              mittig zum POI-Icon (alle Varianten). */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px 10px' }}>
            {summary
              ? null
              : svgHtml
              ? <span style={{ flexShrink: 0, width: 48, height: 48, lineHeight: 0 }} dangerouslySetInnerHTML={{ __html: svgHtml }} />
              : <span style={{ flexShrink: 0, width: 48, height: 48, borderRadius: '50%', background: 'rgba(20,34,62,0.08)' }} />}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, font: '700 16px/1.3 Polarstern, system-ui,sans-serif' }}>
                <span>{title}</span>
                {arrival && flagSvg ? (
                  /* Ziel erreicht: die Ziel-Flagge (×1.6, 32px) STATT einer POI-Last-Anzeige,
                     vertikal mittig zum Titel (Zeile = alignItems center). */
                  <span aria-hidden style={{ display: 'inline-block', width: 32, height: 32, lineHeight: 0 }} dangerouslySetInnerHTML={{ __html: flagSvg }} />
                ) : comfort && comfort.word ? (
                  <ComfortDiode color={comfort.color} word={comfort.word} intensity={comfort.intensity} />
                ) : null}
              </div>
            </div>
          </div>

          {photo && (
            <div style={{ padding: '0 16px 4px' }}>
              <img src={photo} alt={title} style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 10, display: 'block' }} />
            </div>
          )}

          <div style={{ padding: '2px 16px 14px' }}>
            {description
              ? <p style={{ margin: 0, font: '400 13.5px/1.5 Polarstern, system-ui,sans-serif', color: '#33415c' }}>{description}</p>
              : <p style={{ margin: 0, font: 'italic 400 12.5px/1.5 Polarstern, system-ui,sans-serif', color: '#9aa6bd' }}>{labels.noDescription}</p>}
            {link && (
              <a href={link} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                style={{ display: 'inline-block', marginTop: 8, font: '600 12.5px/1 Polarstern, system-ui,sans-serif', color: NAVY, textDecoration: 'none' }}>
                {labels.learnMore}
              </a>
            )}
            {members && members.length > 0 && (
              <div style={{ marginTop: 10 }}>
                <div style={{ font: '700 10px/1 Polarstern, system-ui,sans-serif', letterSpacing: '0.06em', color: '#9aa6bd', marginBottom: 6 }}>
                  {labels.targets(members.length)}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {members.map((m, i) => (
                    <span key={i} style={{ font: '500 11.5px/1.1 Polarstern, system-ui,sans-serif', color: '#33415c', background: 'rgba(20,34,62,0.06)', borderRadius: 6, padding: '3px 7px' }}>{m}</span>
                  ))}
                </div>
              </div>
            )}
            {hint && (
              <div style={{ marginTop: 12, font: '600 12px/1.3 Polarstern, system-ui,sans-serif', color: NAVY, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span aria-hidden style={{ fontSize: 14 }}>⊕</span>{hint}
              </div>
            )}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
