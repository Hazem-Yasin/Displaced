import * as d3 from "d3";
import { FIELDS, JOBS, SKILLS } from "../data/dataset";
import type { MapNode, Selection } from "../types";

const RISK_SCALE = d3.interpolateRgbBasis(["#2dd4a7", "#d9c93f", "#f08a3c", "#e0243c", "#a3124f"]);
export const AUGMENT_COLOR = "#4cc9f0";

export const riskColor = (risk: number): string => RISK_SCALE(Math.max(0, Math.min(1, risk / 100)));
export const nodeColor = (n: Pick<MapNode, "risk" | "tone">): string =>
  n.tone === "augment" ? AUGMENT_COLOR : riskColor(n.risk);

export const riskLabel = (risk: number): string =>
  risk >= 75 ? "Severe" : risk >= 50 ? "High" : risk >= 25 ? "Moderate" : "Low";

export const fmtWorkers = (k: number): string => (k >= 1000 ? `${(k / 1000).toFixed(1)}M` : `${k}K`);

function weighted(values: { v: number; w: number }[]): number {
  const w = d3.sum(values, (d) => d.w) || 1;
  return d3.sum(values, (d) => d.v * d.w) / w;
}

export function fieldStats(fieldId: string) {
  const js = JOBS.filter((j) => j.fieldId === fieldId);
  return {
    jobs: js,
    workersK: d3.sum(js, (j) => j.workersK),
    risk: Math.round(weighted(js.map((j) => ({ v: j.risk, w: j.workersK })))),
    velocity: Math.round(weighted(js.map((j) => ({ v: j.velocity, w: j.workersK })))),
  };
}

export function fieldNodes(): MapNode[] {
  return FIELDS.map((f) => {
    const s = fieldStats(f.id);
    return {
      id: f.id,
      label: f.name,
      sub: `${s.jobs.length} roles`,
      risk: s.risk,
      velocity: s.velocity,
      size: s.workersK,
      tone: f.augmenting ? "augment" : s.risk < 25 ? "resist" : "plague",
    };
  });
}

export function jobNodes(fieldId: string): MapNode[] {
  return JOBS.filter((j) => j.fieldId === fieldId).map((j) => ({
    id: j.id,
    label: j.title,
    risk: j.risk,
    velocity: j.velocity,
    size: j.workersK,
    tone: j.augmenting ? "augment" : j.risk < 25 ? "resist" : "plague",
  }));
}

export function skillNodes(): MapNode[] {
  return SKILLS.map((s) => {
    const needing = JOBS.filter((j) => j.skillIds.includes(s.id));
    return {
      id: s.id,
      label: s.name,
      risk: s.automatability,
      velocity: s.velocity,
      size: Math.max(100, d3.sum(needing, (j) => j.workersK)),
      tone: s.kind === "human" ? "resist" : s.demand === "rising" ? "augment" : "plague",
      group: s.kind,
    };
  });
}

/** Jobs connected to a selection (null = nothing selected). */
export function connectedJobIds(sel: Selection | null): Set<string> | null {
  if (!sel) return null;
  if (sel.type === "job") return new Set([sel.id]);
  if (sel.type === "field") return new Set(JOBS.filter((j) => j.fieldId === sel.id).map((j) => j.id));
  return new Set(JOBS.filter((j) => j.skillIds.includes(sel.id)).map((j) => j.id));
}

export function connectedFieldIds(sel: Selection | null): Set<string> | null {
  const jobs = connectedJobIds(sel);
  if (!jobs) return null;
  return new Set(JOBS.filter((j) => jobs.has(j.id)).map((j) => j.fieldId));
}

export function connectedSkillIds(sel: Selection | null): Set<string> | null {
  if (!sel) return null;
  if (sel.type === "skill") return new Set([sel.id]);
  const jobs = connectedJobIds(sel)!;
  const out = new Set<string>();
  JOBS.filter((j) => jobs.has(j.id)).forEach((j) => j.skillIds.forEach((s) => out.add(s)));
  return out;
}

export function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
}

export function searchJobs(query: string, limit = 6) {
  const q = normalize(query);
  if (!q) return [];
  const tokens = q.split(" ");
  return JOBS.map((job) => {
    const names = [job.title, ...job.aliases].map(normalize);
    let score = 0;
    for (const n of names) {
      if (n === q) score = Math.max(score, 100);
      else if (n.startsWith(q)) score = Math.max(score, 80);
      else if (n.includes(q)) score = Math.max(score, 60);
      else {
        const hit = tokens.filter((t) => t.length > 2 && n.split(" ").some((w) => w.startsWith(t))).length;
        if (hit) score = Math.max(score, 20 + (hit / tokens.length) * 30);
      }
    }
    return { job, score };
  })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r) => r.job);
}
