export default function FlapDelta({ minutes, dockHeight, tint, blink, onCommit }: {
    minutes: number;
    dockHeight: number;
    tint?: string;
    blink?: boolean;
    /** Tap auf die Zahl = Umweg sofort committen (Route umlegen + Zeit addieren). */
    onCommit?: () => void;
}): import("react").JSX.Element;
