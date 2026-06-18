interface PoiDetailCardProps {
    svgHtml: string;
    title: string;
    description?: string;
    photo?: string;
    link?: string;
    onClose: () => void;
    variant?: 'detail' | 'arrival';
    members?: string[];
    hint?: string;
    flagSvg?: string;
    comfort?: {
        word: string;
        color: string;
        intensity: number;
    };
    frameColor?: string;
    summary?: {
        html: string;
        size: number;
    }[];
    clearRight?: number;
    /** Lokalisierte Labels — der Host reicht sie aus seiner i18n rein (Texte app-seitig). */
    labels: {
        noDescription: string;
        learnMore: string;
        targets: (n: number) => string;
    };
}
export default function PoiDetailCard({ svgHtml, title, description, photo, link, onClose, variant, members, hint, flagSvg, comfort, frameColor, summary, clearRight, labels, }: PoiDetailCardProps): import("react").JSX.Element;
export {};
