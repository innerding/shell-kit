// Kleine Geometrie-Helfer (lokale Kopie aus walker — hält das Modul selbst-enthaltend +
// in Node testbar, ohne dist-Geschwister-Auflösung).
const toRad = (d) => (d * Math.PI) / 180;
function distM([lat1, lng1], [lat2, lng2]) {
    const R = 6371000, dLat = toRad(lat2 - lat1), dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}
function bearingDeg([lat1, lng1], [lat2, lng2]) {
    const phi1 = toRad(lat1), phi2 = toRad(lat2), dLng = toRad(lng2 - lng1);
    const y = Math.sin(dLng) * Math.cos(phi2);
    const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLng);
    return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}
export const TURN_TUNING = {
    minAngleDeg: 30, // ab hier eine Abbiegung (darunter = bloße Wegkrümmung)
    hardAngleDeg: 55, // ab hier „scharf"
    windowM: 7, // Peilung über dieses Fenster vor/nach dem Knick (glättet Mikro-Kinks)
    mergeDistM: 12, // nahe Knicke zu EINER Abbiegung zusammenfassen
};
// Vorzeichenbehaftete Winkel-Differenz aTo−aFrom in (−180, 180]. + = nach rechts (im Uhrzeigersinn).
function signedDelta(aFrom, aTo) {
    return ((aTo - aFrom + 540) % 360) - 180;
}
function pointAtAlong(poly, m) {
    if (m <= 0 || poly.length < 2)
        return poly[0];
    let acc = 0;
    for (let i = 1; i < poly.length; i++) {
        const d = distM(poly[i - 1], poly[i]);
        if (acc + d >= m) {
            const t = (m - acc) / (d || 1);
            return [poly[i - 1][0] + (poly[i][0] - poly[i - 1][0]) * t, poly[i - 1][1] + (poly[i][1] - poly[i - 1][1]) * t];
        }
        acc += d;
    }
    return poly[poly.length - 1];
}
// Die echten Richtungswechsel der Route — pro Abbiegung Seite (links/rechts) + Grad (2 Stufen).
// Die Peilung wird über ein Fenster vor/nach dem Knoten gemittelt → robust gegen Mikro-Kinks
// des Netzes. Nahe Knicke werden zu EINER Abbiegung verschmolzen (stärkster gewinnt).
export function findRouteTurns(poly, opts = {}) {
    const T = { ...TURN_TUNING, ...opts };
    if (poly.length < 3)
        return [];
    const along = [0];
    for (let i = 1; i < poly.length; i++)
        along[i] = along[i - 1] + distM(poly[i - 1], poly[i]);
    const total = along[along.length - 1];
    const cand = [];
    for (let i = 1; i < poly.length - 1; i++) {
        const a = along[i];
        if (a < T.windowM || a > total - T.windowM)
            continue;
        const pIn = pointAtAlong(poly, a - T.windowM);
        const pOut = pointAtAlong(poly, a + T.windowM);
        const delta = signedDelta(bearingDeg(pIn, poly[i]), bearingDeg(poly[i], pOut));
        if (Math.abs(delta) >= T.minAngleDeg)
            cand.push({ alongM: a, angleDeg: delta });
    }
    const merged = [];
    for (const c of cand) {
        const last = merged[merged.length - 1];
        if (last && c.alongM - last.alongM <= T.mergeDistM) {
            if (Math.abs(c.angleDeg) > Math.abs(last.angleDeg)) {
                last.alongM = c.alongM;
                last.angleDeg = c.angleDeg;
            }
        }
        else
            merged.push({ ...c });
    }
    return merged.map((m) => ({
        alongM: m.alongM,
        side: (m.angleDeg > 0 ? 'right' : 'left'),
        degree: (Math.abs(m.angleDeg) >= T.hardAngleDeg ? 'hard' : 'bearing'),
        angleDeg: m.angleDeg,
    }));
}
// Erzeugt die Geräte-Stimme an einem gegebenen AudioContext (der Aufrufer hält den Context;
// Browser brauchen eine User-Geste zum Start → die Runtime erzeugt ihn an der Play-Geste).
export function createAcousticGuide(ctx) {
    const master = ctx.createGain();
    master.gain.value = 0.9; // Handy-Lautsprecher sind leise — Grundpegel höher
    master.connect(ctx.destination);
    let base = 0.45;
    const noiseBuf = (sec) => {
        const n = Math.floor(ctx.sampleRate * sec);
        const b = ctx.createBuffer(1, n, ctx.sampleRate);
        const d = b.getChannelData(0);
        for (let i = 0; i < n; i++)
            d[i] = Math.random() * 2 - 1;
        return b;
    };
    // „Handtrommel"-Schlag: Membran-Körper (Triangle = Obertöne, Pitch-Drop) + Anschlag-Klick.
    // LINEARE Hüllkurven (dürfen auf 0) — robust, keine exponentiellen Null-Fallen. Auf Handy-
    // Lautsprechern deutlich lauter/klarer als ein reiner tiefer Sinus; Charakter bleibt „Puls".
    const thump = (t, f, g, dur) => {
        const o = ctx.createOscillator();
        o.type = 'triangle';
        o.frequency.setValueAtTime(f * 1.4, t);
        o.frequency.linearRampToValueAtTime(Math.max(45, f * 0.85), t + dur * 0.6);
        const ga = ctx.createGain();
        ga.gain.setValueAtTime(0, t);
        ga.gain.linearRampToValueAtTime(g, t + 0.006);
        ga.gain.linearRampToValueAtTime(0, t + dur);
        o.connect(ga).connect(master);
        o.start(t);
        o.stop(t + dur + 0.02);
        const ns = ctx.createBufferSource();
        ns.buffer = noiseBuf(0.03);
        const hp = ctx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = 900;
        const ng = ctx.createGain();
        ng.gain.setValueAtTime(g * 0.6, t);
        ng.gain.linearRampToValueAtTime(0, t + 0.025);
        ns.connect(hp).connect(ng).connect(master);
        ns.start(t);
        ns.stop(t + 0.045);
    };
    // links = Herz („lub-dub")
    // Herz höher gelegt (110/86 statt 80/62 Hz) — sonst auf Handy-Lautsprechern unhörbarer Bass;
    // bleibt „lub-dub", trägt aber auf kleinen Speakern. (Kopfhörer/Bone-Conduction vertragen tiefer.)
    const heartbeat = (t, g) => { thump(t, 110, g, 0.16); thump(t + 0.15, 86, g * 0.8, 0.20); };
    // rechts = Schlag (heller Klack + Noise-Tick)
    const tock = (t, g, f) => {
        const o = ctx.createOscillator();
        o.type = 'triangle';
        o.frequency.setValueAtTime(f, t);
        o.frequency.exponentialRampToValueAtTime(f * 0.6, t + 0.05);
        const ga = ctx.createGain();
        ga.gain.setValueAtTime(g, t);
        ga.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
        o.connect(ga).connect(master);
        o.start(t);
        o.stop(t + 0.11);
        const ns = ctx.createBufferSource();
        ns.buffer = noiseBuf(0.06);
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = 2100;
        bp.Q.value = 0.8;
        const ng = ctx.createGain();
        ng.gain.setValueAtTime(g * 0.6, t);
        ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
        ns.connect(bp).connect(ng).connect(master);
        ns.start(t);
        ns.stop(t + 0.06);
    };
    const dirAt = (t, side, degree, level) => {
        if (side === 'left') {
            heartbeat(t, Math.min(0.95, level * 1.7));
            if (degree === 'hard')
                heartbeat(t + 0.34, Math.min(0.95, level * 1.7));
        }
        else {
            tock(t, Math.min(0.82, level * 1.4), 1400);
            if (degree === 'hard')
                tock(t + 0.13, Math.min(0.82, level * 1.4), 1520);
        }
    };
    // Anflug: gefilterte Noise-Schleife, gleichmäßiger (linearer) Swell, KEIN Tremolo →
    // harter Stopp (~20 ms) + tiefer Knirsch → Stille → Richtung.
    const approach = (t, dur, level, side, degree) => {
        const src = ctx.createBufferSource();
        src.buffer = noiseBuf(1.0);
        src.loop = true;
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.Q.value = 0.5;
        bp.frequency.setValueAtTime(380, t);
        bp.frequency.exponentialRampToValueAtTime(170, t + dur);
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 680;
        const env = ctx.createGain();
        env.gain.setValueAtTime(0.0001, t);
        env.gain.linearRampToValueAtTime(level, t + dur - 0.06);
        env.gain.setValueAtTime(level, t + dur - 0.02);
        env.gain.linearRampToValueAtTime(0.0001, t + dur);
        src.connect(bp).connect(lp).connect(env).connect(master);
        src.start(t);
        src.stop(t + dur + 0.02);
        const tStop = t + dur;
        const cs = ctx.createBufferSource();
        cs.buffer = noiseBuf(0.12);
        const cbp = ctx.createBiquadFilter();
        cbp.type = 'lowpass';
        cbp.frequency.value = 340;
        const cg = ctx.createGain();
        cg.gain.setValueAtTime(Math.min(0.9, level * 1.1), tStop);
        cg.gain.exponentialRampToValueAtTime(0.0001, tStop + 0.09);
        cs.connect(cbp).connect(cg).connect(master);
        cs.start(tStop);
        cs.stop(tStop + 0.12);
        dirAt(tStop + 0.14, side, degree, level);
    };
    // Browser suspendieren den Context (Lock/Hintergrund/iOS) — vor jedem Cue aufwecken, sonst Stille.
    const wake = () => { if (ctx.state === 'suspended')
        void ctx.resume(); };
    return {
        setIntensity(v01) { base = 0.08 + Math.max(0, Math.min(1, v01)) * 0.62; },
        approachTurn(side, degree) { wake(); approach(ctx.currentTime + 0.02, 1.24, base, side, degree); },
        direction(side, degree) { wake(); dirAt(ctx.currentTime, side, degree, base); },
        alarm() { wake(); const t = ctx.currentTime; for (let i = 0; i < 7; i++)
            thump(t + i * (0.24 - i * 0.018), 95 + i * 5, 0.7, 0.13); },
    };
}
