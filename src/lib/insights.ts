import { FIELDS, JOBS, skillById } from "../data/dataset";
import { fieldStats, riskLabel } from "./derive";

/** Pure aggregations over the dataset, used by the Overview. All inputs are editorial estimates. */

export const BAND_ORDER = ["Low", "Moderate", "High", "Severe"] as const;
export type Band = (typeof BAND_ORDER)[number];

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

export function coverage() {
  const workersK = sum(JOBS.map((j) => j.workersK));
  const weightedRisk = sum(JOBS.map((j) => j.risk * j.workersK)) / (workersK || 1);
  const highPlusK = sum(JOBS.filter((j) => j.risk >= 50).map((j) => j.workersK));
  const augmentingK = sum(JOBS.filter((j) => j.augmenting).map((j) => j.workersK));
  return {
    jobs: JOBS.length,
    fields: FIELDS.length,
    workersK,
    avgRisk: Math.round(weightedRisk),
    highPlusShare: highPlusK / (workersK || 1),
    augmentingShare: augmentingK / (workersK || 1),
  };
}

export function bandBreakdown() {
  const total = sum(JOBS.map((j) => j.workersK)) || 1;
  return BAND_ORDER.map((label) => {
    const js = JOBS.filter((j) => riskLabel(j.risk) === label);
    const workersK = sum(js.map((j) => j.workersK));
    return { label, jobs: js.length, workersK, share: workersK / total };
  });
}

export function fieldRiskRows() {
  return FIELDS.map((f) => {
    const s = fieldStats(f.id);
    return { id: f.id, name: f.name, risk: s.risk, workersK: s.workersK, augmenting: !!f.augmenting };
  }).sort((a, b) => b.risk - a.risk);
}

/** Share of a job's listed skills that are still hard for AI (automatability < 40) vs exposed. */
export function skillMix(jobId: string) {
  const job = JOBS.find((j) => j.id === jobId);
  if (!job) return { surviving: 0, exposed: 0, total: 0 };
  const skills = job.skillIds.map(skillById).filter((s) => !!s);
  const surviving = skills.filter((s) => s!.automatability < 40).length;
  return { surviving, exposed: skills.length - surviving, total: skills.length };
}

export interface TreeJob {
  id: string;
  name: string;
  risk: number;
  workersK: number;
}
export interface TreeField {
  id: string;
  name: string;
  children: TreeJob[];
}
export function treemapData(): { children: TreeField[] } {
  return {
    children: FIELDS.map((f) => ({
      id: f.id,
      name: f.name,
      children: JOBS.filter((j) => j.fieldId === f.id).map((j) => ({
        id: j.id,
        name: j.title,
        risk: j.risk,
        workersK: j.workersK,
      })),
    })),
  };
}
