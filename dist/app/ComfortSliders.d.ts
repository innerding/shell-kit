interface Props {
    movementValue: number;
    movementLoad: number;
    stayValue: number;
    stayLoad: number;
    stayMaxValue: number;
    onMovementChange: (v: number) => void;
    onStayChange: (v: number) => void;
    /** Wenn false (movement_only): RAST-Slider komplett ausgeblendet. */
    step2Active?: boolean;
}
export default function ComfortSliders({ movementValue, movementLoad, stayValue, stayLoad, stayMaxValue, onMovementChange, onStayChange, step2Active, }: Props): import("react").JSX.Element;
export {};
