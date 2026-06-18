interface Props {
    color: string;
    word: string;
    intensity: number;
    textColor?: string;
    size?: 'sm' | 'md';
}
export default function ComfortDiode({ color, word, intensity, textColor, size }: Props): import("react").JSX.Element;
export {};
