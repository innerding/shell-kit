interface Props {
    movementValue: number;
    movementLoad: number;
    movementLoads?: number[];
    stayValue: number;
    stayLoad: number;
    stayMaxValue: number;
    onMovementChange: (v: number) => void;
    onStayChange: (v: number) => void;
    step2Active?: boolean;
}
export default function ComfortSliders({ movementValue, movementLoad, movementLoads, stayValue, stayLoad, stayMaxValue, onMovementChange, onStayChange, step2Active }: Props): import("react").JSX.Element;
export {};
