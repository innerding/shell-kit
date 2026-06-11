import { type RouteLeg } from './bak.js';
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
