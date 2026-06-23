import { jsx as _jsx } from "react/jsx-runtime";
import { roadArrowPath } from './roadArrow';
const ARROW_SHADOW = 'drop-shadow(0 1.5px 1px rgba(0,0,0,0.7))'; // = die Meter-Ziffern
export default function GuidanceArrow({ hint, width, height, fill, strokeWidth = 3.2, style, onClick, }) {
    return (_jsx("svg", { onClick: onClick, width: width, height: height, viewBox: "0 0 100 110", "aria-hidden": true, style: { filter: ARROW_SHADOW, ...style }, children: _jsx("path", { d: roadArrowPath(hint, { center: false }), fill: fill, stroke: "#ffffff", strokeWidth: strokeWidth, strokeLinejoin: "round", strokeLinecap: "round" }) }));
}
