// bak-test-Banner — React, Muster wie ComfortSliders (Code in shell-kit, Mount in
// der Runtime). Erscheint NUR, wenn die gewählte Route durch ausgedimmtes Netz läuft
// (Ø-Last > Comfort). Verschwindet automatisch, sobald die Route wieder im Comfort liegt.
// Kein Auto-Reroute — die Meldung fordert den User zur Alternativwahl auf.

const DEFAULT_MESSAGE = 'Deine Route entspricht nicht mehr deiner Comfort-Einstellung. Wähle eine Alternativroute.';

interface Props {
  breach: boolean;
  message?: string;
}

export default function RouteComfortBanner({ breach, message = DEFAULT_MESSAGE }: Props) {
  if (!breach) return null;
  return (
    <div
      role="alert"
      style={{
        position: 'absolute', left: '50%', bottom: 24, transform: 'translateX(-50%)',
        maxWidth: 'min(92vw, 420px)', zIndex: 700,
        display: 'flex', alignItems: 'center', gap: 10,
        background: 'rgba(210,80,42,0.95)', color: '#fff',
        padding: '10px 14px', borderRadius: 10,
        boxShadow: '0 3px 14px rgba(0,0,0,0.3)',
        font: '600 13px/1.35 Polarstern, system-ui,-apple-system,sans-serif',
      }}
    >
      <span style={{ fontSize: 18, flexShrink: 0, lineHeight: 1 }} aria-hidden>⚠</span>
      <span>{message}</span>
    </div>
  );
}
