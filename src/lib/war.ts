import { FIELDS, JOBS } from "../data/dataset";
import { fieldStats } from "./derive";

/**
 * Pure helpers for the War map. Nothing here is measured: the order in which the
 * front "reaches" a field is the field's editorial velocity score, ranked. It is
 * a relative order, not a calendar forecast.
 */

export const WAR_W = 1000;
export const WAR_H = 600;
export const ORIGIN_ID = "tech";

/** Fixed territory seeds on the map (SVG units). */
export const SEEDS: Record<string, [number, number]> = {
  tech: [190, 270],
  admin: [360, 200],
  law: [545, 185],
  education: [720, 215],
  military: [830, 320],
  creative: [235, 425],
  finance: [400, 345],
  healthcare: [590, 325],
  trades: [760, 435],
  logistics: [580, 475],
};

/** Landmass outline: a deterministic wobbly ellipse. */
export const LAND = { cx: 500, cy: 325, rx: 410, ry: 220 };

export interface WarField {
  id: string;
  name: string;
  blurb: string;
  seed: [number, number];
  risk: number;
  velocity: number;
  workersK: number;
  /** 0 = origin; otherwise 10-90, later = slower to arrive. */
  arrival: number;
  origin: boolean;
  augmenting: boolean;
  /** The line holds: AI augments here, or editorial risk is under 25. */
  holds: boolean;
  jobCount: number;
}

export function warFields(): WarField[] {
  const stats = FIELDS.map((f) => ({ f, s: fieldStats(f.id) }));
  const vmax = Math.max(1, ...stats.filter(({ f }) => f.id !== ORIGIN_ID).map(({ s }) => s.velocity));
  return stats.map(({ f, s }) => {
    const origin = f.id === ORIGIN_ID;
    return {
      id: f.id,
      name: f.name,
      blurb: f.blurb,
      seed: SEEDS[f.id] ?? [WAR_W / 2, WAR_H / 2],
      risk: s.risk,
      velocity: s.velocity,
      workersK: s.workersK,
      arrival: origin ? 0 : Math.round(10 + 80 * (1 - s.velocity / vmax)),
      origin,
      augmenting: !!f.augmenting,
      holds: !!f.augmenting || s.risk < 25,
      jobCount: s.jobs.length,
    };
  });
}

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

/** How fully the front has flooded a territory at this point of the advance (0–1). */
export const occupancy = (advance: number, arrival: number): number => clamp01((advance - arrival) / 10);

export function warStats(advance: number) {
  const fields = warFields();
  const reached = fields.filter((f) => advance >= f.arrival);
  const reachedIds = new Set(reached.map((f) => f.id));
  const exposed = JOBS.filter((j) => j.risk >= 50);
  const exposedTotalK = exposed.reduce((a, j) => a + j.workersK, 0);
  const exposedReachedK = exposed.filter((j) => reachedIds.has(j.fieldId)).reduce((a, j) => a + j.workersK, 0);
  return {
    reached: reached.length,
    total: fields.length,
    holding: reached.filter((f) => f.holds).length,
    exposedReachedK,
    exposedTotalK,
  };
}

/** Roles of a field placed as "cities" around its seed, biggest workforce nearest the centre. */
export function cityPositions(fieldId: string) {
  const seed = SEEDS[fieldId] ?? [WAR_W / 2, WAR_H / 2];
  const jobs = JOBS.filter((j) => j.fieldId === fieldId).sort((a, b) => b.workersK - a.workersK);
  return jobs.map((job, i) => {
    const r = 12 * Math.sqrt(i + 0.3);
    const a = i * 2.39996;
    return { job, x: seed[0] + r * Math.cos(a), y: seed[1] + r * Math.sin(a) };
  });
}

export const clusterRadius = (n: number): number => 12 * Math.sqrt(Math.max(1, n)) + 6;

export type Pt = [number, number];
export interface Route {
  p0: Pt;
  c: Pt;
  p2: Pt;
}

/** Curved route between two seeds, padded so it starts and ends outside the city clusters. */
export function route(from: Pt, to: Pt, padFrom: number, padTo: number): Route {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const d = Math.hypot(dx, dy) || 1;
  const ux = dx / d;
  const uy = dy / d;
  const bend = 0.18 * d;
  return {
    p0: [from[0] + ux * padFrom, from[1] + uy * padFrom],
    p2: [to[0] - ux * padTo, to[1] - uy * padTo],
    c: [(from[0] + to[0]) / 2 - uy * bend, (from[1] + to[1]) / 2 + ux * bend],
  };
}

const lerp = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

/** The first fraction `t` of a quadratic route (de Casteljau), with the heading at its tip. */
export function routeAt(r: Route, t: number) {
  const q0 = lerp(r.p0, r.c, t);
  const q1 = lerp(r.c, r.p2, t);
  const tip = lerp(q0, q1, t);
  const hx = q1[0] - q0[0];
  const hy = q1[1] - q0[1];
  const h = Math.hypot(hx, hy) || 1;
  return { q0, tip, dir: [hx / h, hy / h] as Pt };
}
