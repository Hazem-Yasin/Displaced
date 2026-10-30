/** Which way a piece of evidence pushes the "how automatable is this" question. */
export type Signal = "more" | "less" | "mixed";

export interface Source {
  id: string;
  title: string;
  authors: string;
  venue: string;
  year: number;
  url: string;
  /** What the source actually reports, in plain language (numbers copied from the abstract). */
  finding: string;
  /** Limits of the source: what it does NOT show. */
  caveat: string;
}

export interface EvidenceRef {
  sourceId: string;
  signal: Signal;
  /** Why this source is relevant to this specific skill or job. */
  note: string;
}

export type SkillKind = "technical" | "human";
export type Demand = "rising" | "falling" | "stable";

export interface Field {
  id: string;
  name: string;
  blurb: string;
  /** AI mostly augments (rather than replaces) roles in this field. */
  augmenting?: boolean;
}

export interface Skill {
  id: string;
  name: string;
  kind: SkillKind;
  /** 0–100: how much of this skill AI can already perform. */
  automatability: number;
  /** 0–100: how fast the market is moving away from (or toward) it. */
  velocity: number;
  demand: Demand;
  /** Estimated 5-year change in demand, percent. */
  demandChange: number;
  outlook: string;
  /** Present on AI-resistant human skills: why it structurally resists automation. */
  whyResistant?: string;
}

export interface Job {
  id: string;
  title: string;
  fieldId: string;
  /** 0–100 displacement risk score. */
  risk: number;
  /** 0–100 speed of displacement in the market (drives plague spread speed). */
  velocity: number;
  /** Approximate US employment, thousands. */
  workersK: number;
  /** Projected 10-yr employment change, percent (illustrative until BLS API is live). */
  growth: number;
  skillIds: string[];
  tools: string[];
  pivots: string[];
  aliases: string[];
  augmenting?: boolean;
}

export type Tone = "plague" | "resist" | "augment";

/** A bubble on the plague map. */
export interface MapNode {
  id: string;
  label: string;
  sub?: string;
  risk: number;
  velocity: number;
  /** Relative weight; area of the bubble is proportional to it. */
  size: number;
  tone: Tone;
  /** Optional cluster key (used to pull nodes into groups). */
  group?: string;
}

export type SelectionType = "field" | "job" | "skill";
export interface Selection {
  type: SelectionType;
  id: string;
}

export type ViewMode = "fields" | "skills" | "split" | "overview" | "war";
