// roadArrow.ts — der „Straßenmarkierungs"-Pfeil: EIN Körper (Arm + Gelenk + integrierte
// Spitze) als ein einziger geschlossener Umriss. Ein Gelenk = der Abbiege-Grad. Reines
// Pfad-Modell (viewBox 0 0 100 110), wird schwarz umrandet/weiß gefüllt gerendert.
// Genutzt vom Dock-Pfeil (Grad-Lehrer) UND später den Lehr-Pfeilen im Schild.
// Knick-Winkel je Grad (2 Stufen). Geradeaus = 0.
const BEND_DEG = { bearing: 30, hard: 66 };
// SVG-Pfad des Pfeils für viewBox "0 0 100 110".
export function roadArrowPath(hint) {
    const dir = hint.side === 'left' ? -1 : hint.side === 'right' ? 1 : 0;
    const bend = hint.side === 'straight' ? 0 : BEND_DEG[hint.degree ?? 'bearing'];
    const B = [50, 99], J = [50, 57], seg = 27, hw = 8, headHw = 16, headLen = 17;
    const a = (dir * bend) * Math.PI / 180;
    const d2 = [Math.sin(a), -Math.cos(a)]; // obere Richtung (a=0 → hoch)
    const Tb = [J[0] + d2[0] * seg, J[1] + d2[1] * seg]; // Spitzen-Basis
    const n1 = [-1, 0], n2 = [d2[1], -d2[0]]; // Links-Normalen der beiden Segmente
    let mm = [n1[0] + n2[0], n1[1] + n2[1]]; // Gelenk-Miter (Winkelhalbierende)
    const ml = Math.hypot(mm[0], mm[1]) || 1;
    mm = [mm[0] / ml, mm[1] / ml];
    const den = Math.max(0.45, mm[0] * n1[0] + mm[1] * n1[1]), sc = hw / den;
    const Jl = [J[0] + mm[0] * sc, J[1] + mm[1] * sc], Jr = [J[0] - mm[0] * sc, J[1] - mm[1] * sc];
    const Bl = [B[0] + n1[0] * hw, B[1]], Br = [B[0] - n1[0] * hw, B[1]];
    const Tl = [Tb[0] + n2[0] * hw, Tb[1] + n2[1] * hw], Tr = [Tb[0] - n2[0] * hw, Tb[1] - n2[1] * hw];
    const bL = [Tb[0] + n2[0] * headHw, Tb[1] + n2[1] * headHw], bR = [Tb[0] - n2[0] * headHw, Tb[1] - n2[1] * headHw];
    const tip = [Tb[0] + d2[0] * headLen, Tb[1] + d2[1] * headLen];
    // Den Umriss horizontal in die viewBox zentrieren — sonst „läuft" der Pfeil bei scharfem
    // Knick zur Seite aus dem Bild. So bleibt links wie rechts gleich viel Luft.
    const pts = [Bl, Jl, Tl, bL, tip, bR, Tr, Jr, Br];
    let minX = Infinity, maxX = -Infinity;
    for (const p of pts) {
        if (p[0] < minX)
            minX = p[0];
        if (p[0] > maxX)
            maxX = p[0];
    }
    const shift = 50 - (minX + maxX) / 2;
    const P = (p) => `${(p[0] + shift).toFixed(1)} ${p[1].toFixed(1)}`;
    return `M ${P(Bl)} L ${P(Jl)} L ${P(Tl)} L ${P(bL)} L ${P(tip)} L ${P(bR)} L ${P(Tr)} L ${P(Jr)} L ${P(Br)} Z`;
}
