import { type Route, type RouteLeg } from './bak.js';
import type { CircusPoi } from './poiDompteur.js';
import { type ScaleSpec } from './scale.js';
import type { SegmentedNet, LatLng } from './anthem';
export interface DetourPick {
    points: LatLng[];
    stretchIds: string[];
    legs?: RouteLeg[];
    deltaM: number;
    peakLoad: number;
    stage: number;
}
/**
 * Rangliste komfortabler Umwege für die direkte Route durch `waypoints`. `avgById` =
 * Ø-Last je Stretch, `comfort` = tolerierte Last-Obergrenze (0..1). Sortiert nach
 * Mehrweg (kürzester zuerst), gekappt auf `limit`. Leer = kein komfortabler Umweg.
 */
export declare function detourPicks(net: SegmentedNet, waypoints: LatLng[], avgById: Map<string, number>, scale: ScaleSpec, comfort: number, limit?: number): DetourPick[];
export interface RouteSuggestion {
    route: Route;
    lengthM: number;
    peakLoad: number;
    stage: number;
    deltaM: number;
}
export declare function routeSuggestions(net: SegmentedNet, start: LatLng, target: LatLng, avgById: Map<string, number>, scale: ScaleSpec, comfort: number, max?: number, bandStages?: number): RouteSuggestion[];
export interface TargetSuggestion {
    targetId: string;
    substituted: boolean;
    suggestions: RouteSuggestion[];
}
/**
 * Vorschläge zu einem Wunsch-Ziel — mit KLASSEN-KONFORMER Substitution (ann_x). Hat das
 * Wunsch-Ziel keinen comfortablen Weg, wird es durch das **nächstgelegene POI kompatibler
 * Klasse** (`similarityTier ≥ 1`, dieselbe Kinship-Schranke wie der POI-Dompteur) ersetzt,
 * das einen comfortablen Weg hat — Gipfel↛Café. Klappt keiner, kommt best-effort das
 * Wunsch-Ziel zurück (evtl. belebt; nie „nichts").
 */
export declare function suggestForTarget(net: SegmentedNet, start: LatLng, target: CircusPoi, candidates: CircusPoi[], avgById: Map<string, number>, scale: ScaleSpec, comfort: number, max?: number): TargetSuggestion;
export type Emphasis = 'poi' | 'duration' | 'comfort';
export interface MixSuggestion {
    route: Route;
    lengthM: number;
    peakLoad: number;
    stage: number;
    deltaM: number;
    targetId: string;
    isRound: boolean;
    emphases: Emphasis[];
}
export declare function sixMix(net: SegmentedNet, start: LatLng, target: CircusPoi, candidates: CircusPoi[], avgById: Map<string, number>, scale: ScaleSpec, comfort: number, dimmedStretchIds: Set<string>, maxRatio?: number, max?: number): MixSuggestion[];
