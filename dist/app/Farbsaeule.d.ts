import { type Einstellung } from './scale';
export default function Farbsaeule({ einstellung, onChange, onReset, resetLabel, mitVerlauf }: {
    einstellung: Einstellung;
    onChange: (e: Einstellung) => void;
    /** Zurück auf die Einstellung darüber (in der Ziel-App: die Farben der Karte). */
    onReset?: () => void;
    resetLabel?: string;
    /** Ohne Haken zeigt die Säule harte Felder statt des Verlaufs (der Operator prüft damit die Technik). */
    mitVerlauf?: boolean;
}): import("react").JSX.Element;
