interface Props {
    movementValue: number;
    stayValue: number;
    stayMaxValue: number;
    onMovementChange: (v: number) => void;
    onStayChange: (v: number) => void;
    step2Active?: boolean;
}
export default function ComfortSliders({ movementValue, stayValue, stayMaxValue, onMovementChange, onStayChange, step2Active }: Props): import("react").JSX.Element;
export {};
