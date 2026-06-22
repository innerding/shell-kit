// acousticGuidance.ts — die akustische Guidance (Geräte-Audio + Abbiege-Erkennung).
// Modell (beschlossen 2026-06-23, am Ohr getunt): pro Abbiegung DREI klare Ereignisse —
//   1. Anflug: neutrales, RHYTHMUSFREIES Anschwellen (Einbremsen auf Kies), ~1.24 s.
//   2. Stopp: harter Halt + kurzer tiefer Knirsch (kein Ausfaden).
//   3. Stille (~0.14 s) → Richtung (rhythmisch): links = Herz, rechts = Schlag; Grad 2 Stufen.
// Falsch-Weg = rasendes Herz (Off-Course-Anker). Mono-fest (Charakter trägt links/rechts);
// Kopfhörer-Spatialisierung später obendrauf. Spec: docs/guidance_akustik_spec.md (scim_source).
import type { LatLng } from './anthem';

// Kleine Geometrie-Helfer (lokale Kopie aus walker — hält das Modul selbst-enthaltend +
// in Node testbar, ohne dist-Geschwister-Auflösung).
const toRad = (d: number) => (d * Math.PI) / 180;
function distM([lat1, lng1]: LatLng, [lat2, lng2]: LatLng): number {
  const R = 6371000, dLat = toRad(lat2 - lat1), dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}
function bearingDeg([lat1, lng1]: LatLng, [lat2, lng2]: LatLng): number {
  const phi1 = toRad(lat1), phi2 = toRad(lat2), dLng = toRad(lng2 - lng1);
  const y = Math.sin(dLng) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

// ───────────────────────── Abbiege-Erkennung (pure Math) ─────────────────────────

export type TurnSide = 'left' | 'right';
export type TurnDegree = 'bearing' | 'hard';   // sanft | scharf (2 Stufen, Blinden-Guide-Standard)

export interface RouteTurn {
  alongM: number;    // Distanz vom Start bis zur Abbiegung
  side: TurnSide;
  degree: TurnDegree;
  angleDeg: number;  // signierte Abbiegung (+ rechts / − links)
}

export const TURN_TUNING = {
  minAngleDeg: 30,   // ab hier eine Abbiegung (darunter = bloße Wegkrümmung)
  hardAngleDeg: 55,  // ab hier „scharf"
  windowM: 7,        // Peilung über dieses Fenster vor/nach dem Knick (glättet Mikro-Kinks)
  mergeDistM: 12,    // nahe Knicke zu EINER Abbiegung zusammenfassen
};

// Vorzeichenbehaftete Winkel-Differenz aTo−aFrom in (−180, 180]. + = nach rechts (im Uhrzeigersinn).
function signedDelta(aFrom: number, aTo: number): number {
  return ((aTo - aFrom + 540) % 360) - 180;
}

function pointAtAlong(poly: readonly LatLng[], m: number): LatLng {
  if (m <= 0 || poly.length < 2) return poly[0];
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
export function findRouteTurns(poly: readonly LatLng[], opts: Partial<typeof TURN_TUNING> = {}): RouteTurn[] {
  const T = { ...TURN_TUNING, ...opts };
  if (poly.length < 3) return [];
  const along: number[] = [0];
  for (let i = 1; i < poly.length; i++) along[i] = along[i - 1] + distM(poly[i - 1], poly[i]);
  const total = along[along.length - 1];

  const cand: { alongM: number; angleDeg: number }[] = [];
  for (let i = 1; i < poly.length - 1; i++) {
    const a = along[i];
    if (a < T.windowM || a > total - T.windowM) continue;
    const pIn = pointAtAlong(poly, a - T.windowM);
    const pOut = pointAtAlong(poly, a + T.windowM);
    const delta = signedDelta(bearingDeg(pIn, poly[i]), bearingDeg(poly[i], pOut));
    if (Math.abs(delta) >= T.minAngleDeg) cand.push({ alongM: a, angleDeg: delta });
  }

  const merged: { alongM: number; angleDeg: number }[] = [];
  for (const c of cand) {
    const last = merged[merged.length - 1];
    if (last && c.alongM - last.alongM <= T.mergeDistM) {
      if (Math.abs(c.angleDeg) > Math.abs(last.angleDeg)) { last.alongM = c.alongM; last.angleDeg = c.angleDeg; }
    } else merged.push({ ...c });
  }

  return merged.map((m) => ({
    alongM: m.alongM,
    side: (m.angleDeg > 0 ? 'right' : 'left') as TurnSide,
    degree: (Math.abs(m.angleDeg) >= T.hardAngleDeg ? 'hard' : 'bearing') as TurnDegree,
    angleDeg: m.angleDeg,
  }));
}

// ───────────────────────── Die Klang-Sprache (Web Audio) ─────────────────────────

export interface AcousticGuide {
  setIntensity(v01: number): void;            // Grundintensität (User-Regler), 0..1
  approachTurn(side: TurnSide, degree: TurnDegree): void;  // Anflug → Stopp → Richtung
  direction(side: TurnSide, degree: TurnDegree): void;     // nur die Richtung (ohne Anflug)
  alarm(): void;                              // Falsch-Weg (rasendes Herz)
}

// Erzeugt die Geräte-Stimme an einem gegebenen AudioContext (der Aufrufer hält den Context;
// Browser brauchen eine User-Geste zum Start → die Runtime erzeugt ihn an der Play-Geste).
export function createAcousticGuide(ctx: AudioContext): AcousticGuide {
  const master = ctx.createGain();
  master.gain.value = 0.9;   // Handy-Lautsprecher sind leise — Grundpegel höher
  master.connect(ctx.destination);
  let base = 0.45;

  const noiseBuf = (sec: number): AudioBuffer => {
    const n = Math.floor(ctx.sampleRate * sec);
    const b = ctx.createBuffer(1, n, ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    return b;
  };

  const thump = (t: number, f: number, g: number, dur: number) => {
    const o = ctx.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f * 0.7), t + dur);
    const ga = ctx.createGain();
    ga.gain.setValueAtTime(0.0001, t); ga.gain.exponentialRampToValueAtTime(g, t + 0.012); ga.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(ga).connect(master); o.start(t); o.stop(t + dur + 0.04);
  };
  // links = Herz („lub-dub")
  // Herz höher gelegt (110/86 statt 80/62 Hz) — sonst auf Handy-Lautsprechern unhörbarer Bass;
  // bleibt „lub-dub", trägt aber auf kleinen Speakern. (Kopfhörer/Bone-Conduction vertragen tiefer.)
  const heartbeat = (t: number, g: number) => { thump(t, 110, g, 0.16); thump(t + 0.15, 86, g * 0.8, 0.20); };
  // rechts = Schlag (heller Klack + Noise-Tick)
  const tock = (t: number, g: number, f: number) => {
    const o = ctx.createOscillator(); o.type = 'triangle';
    o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * 0.6, t + 0.05);
    const ga = ctx.createGain(); ga.gain.setValueAtTime(g, t); ga.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
    o.connect(ga).connect(master); o.start(t); o.stop(t + 0.11);
    const ns = ctx.createBufferSource(); ns.buffer = noiseBuf(0.06);
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2100; bp.Q.value = 0.8;
    const ng = ctx.createGain(); ng.gain.setValueAtTime(g * 0.6, t); ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
    ns.connect(bp).connect(ng).connect(master); ns.start(t); ns.stop(t + 0.06);
  };

  const dirAt = (t: number, side: TurnSide, degree: TurnDegree, level: number) => {
    if (side === 'left') {
      heartbeat(t, Math.min(0.95, level * 1.7));
      if (degree === 'hard') heartbeat(t + 0.34, Math.min(0.95, level * 1.7));
    } else {
      tock(t, Math.min(0.82, level * 1.4), 1400);
      if (degree === 'hard') tock(t + 0.13, Math.min(0.82, level * 1.4), 1520);
    }
  };

  // Anflug: gefilterte Noise-Schleife, gleichmäßiger (linearer) Swell, KEIN Tremolo →
  // harter Stopp (~20 ms) + tiefer Knirsch → Stille → Richtung.
  const approach = (t: number, dur: number, level: number, side: TurnSide, degree: TurnDegree) => {
    const src = ctx.createBufferSource(); src.buffer = noiseBuf(1.0); src.loop = true;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 0.5;
    bp.frequency.setValueAtTime(380, t); bp.frequency.exponentialRampToValueAtTime(170, t + dur);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 680;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, t);
    env.gain.linearRampToValueAtTime(level, t + dur - 0.06);
    env.gain.setValueAtTime(level, t + dur - 0.02);
    env.gain.linearRampToValueAtTime(0.0001, t + dur);
    src.connect(bp).connect(lp).connect(env).connect(master);
    src.start(t); src.stop(t + dur + 0.02);
    const tStop = t + dur;
    const cs = ctx.createBufferSource(); cs.buffer = noiseBuf(0.12);
    const cbp = ctx.createBiquadFilter(); cbp.type = 'lowpass'; cbp.frequency.value = 340;
    const cg = ctx.createGain(); cg.gain.setValueAtTime(Math.min(0.9, level * 1.1), tStop); cg.gain.exponentialRampToValueAtTime(0.0001, tStop + 0.09);
    cs.connect(cbp).connect(cg).connect(master); cs.start(tStop); cs.stop(tStop + 0.12);
    dirAt(tStop + 0.14, side, degree, level);
  };

  return {
    setIntensity(v01: number) { base = 0.08 + Math.max(0, Math.min(1, v01)) * 0.62; },
    approachTurn(side, degree) { approach(ctx.currentTime + 0.02, 1.24, base, side, degree); },
    direction(side, degree) { dirAt(ctx.currentTime, side, degree, base); },
    alarm() { const t = ctx.currentTime; for (let i = 0; i < 7; i++) thump(t + i * (0.24 - i * 0.018), 95 + i * 5, 0.7, 0.13); },
  };
}
