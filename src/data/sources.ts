import type { EvidenceRef, Source } from "../types";
import { MORE_JOB_EVIDENCE, MORE_SKILL_EVIDENCE, MORE_SOURCES } from "./sources2";

/**
 * Every source here was opened and its abstract read. Numbers are copied from the
 * abstract, not remembered. Add a source only after reading it.
 */
export const SOURCES: Source[] = [
  {
    id: "swe-bench",
    title: "SWE-bench: Can Language Models Resolve Real-World GitHub Issues?",
    authors: "Jimenez et al.",
    venue: "ICLR 2024 (arXiv:2310.06770)",
    year: 2023,
    url: "https://arxiv.org/abs/2310.06770",
    finding:
      "2,294 real issues from 12 popular Python repositories. In the original evaluation the best model, Claude 2, solved 1.96% of them.",
    caveat:
      "This is the 2023 baseline. It shows how a benchmark starts, not what AI can do today. Benchmark scores move fast, so always check the project's current leaderboard.",
  },
  {
    id: "spider-2",
    title: "Spider 2.0: Evaluating Language Models on Real-World Enterprise Text-to-SQL Workflows",
    authors: "Lei et al.",
    venue: "ICLR 2025 Oral (arXiv:2411.07763)",
    year: 2025,
    url: "https://arxiv.org/abs/2411.07763",
    finding:
      "632 real enterprise SQL workflow problems. A code agent built on o1-preview solved 21.3%, versus 91.2% on the older Spider 1.0 and 73.0% on BIRD.",
    caveat:
      "Tested one generation of models. It separates easy, well-specified SQL (largely solved) from messy enterprise work (not yet). Models have changed since.",
  },
  {
    id: "copilot-rct",
    title: "The Impact of AI on Developer Productivity: Evidence from GitHub Copilot",
    authors: "Peng, Kalliamvakou, Cihon, Demirer",
    venue: "arXiv:2302.06590",
    year: 2023,
    url: "https://arxiv.org/abs/2302.06590",
    finding:
      "Controlled experiment: developers asked to implement an HTTP server in JavaScript finished 55.8% faster with Copilot than the control group.",
    caveat: "A single task, in 2023, with an early tool. It does not show what happens on large, existing codebases.",
  },
  {
    id: "metr-rct",
    title: "Measuring the Impact of Early-2025 AI on Experienced Open-Source Developer Productivity",
    authors: "Becker, Rush, Barnes, Rein (METR)",
    venue: "arXiv:2507.09089",
    year: 2025,
    url: "https://arxiv.org/abs/2507.09089",
    finding:
      "Randomized trial: 16 experienced developers, 246 tasks in mature projects they knew well. AI increased completion time by 19%. Developers had predicted a 24% speed-up. Economics and ML experts predicted 39% and 38% shorter times.",
    caveat:
      "Small sample (16 people), early-2025 tools, expert developers on familiar code. The authors say experimental artifacts cannot be fully ruled out. It may not hold for other people, tasks or newer tools.",
  },
  {
    id: "gpts-are-gpts",
    title: "GPTs are GPTs: An Early Look at the Labor Market Impact Potential of Large Language Models",
    authors: "Eloundou, Manning, Mishkin, Rock",
    venue: "arXiv:2303.10130",
    year: 2023,
    url: "https://arxiv.org/abs/2303.10130",
    finding:
      "About 80% of the US workforce could have at least 10% of their tasks affected by LLMs; about 19% could have at least 50% of tasks affected. Higher-income jobs showed greater exposure.",
    caveat:
      "This measures task EXPOSURE, not job loss. The authors state they make no prediction about development or adoption timelines. Exposure is not displacement.",
  },
];

SOURCES.push(...MORE_SOURCES);

export const sourceById = (id: string): Source | undefined => SOURCES.find((s) => s.id === id);

/** Sources we plan to integrate but have NOT yet read or wired in. No number in the app cites them. */
export const PLANNED_SOURCES = [
  "BLS Employment Projections and Occupational Outlook Handbook for the other 54 roles (only the Aerospace Engineers page has been read and cited; the live BLS feed is industry-level only)",
  "O*NET task and skill descriptions",
  "Stanford AI Index (annual benchmark and adoption trends)",
  "Live benchmark leaderboards (SWE-bench and others)",
];

export const SKILL_EVIDENCE: Record<string, EvidenceRef[]> = {
  python: [
    {
      sourceId: "swe-bench",
      signal: "less",
      note: "Real Python repos. The 2023 baseline was low (1.96%), but this is exactly the kind of number that moves quickly. Treat as dated.",
    },
    {
      sourceId: "metr-rct",
      signal: "less",
      note: "In real, mature codebases, expert developers were slower with AI in early 2025, which suggests writing code is not the whole job.",
    },
  ],
  javascript: [
    {
      sourceId: "copilot-rct",
      signal: "more",
      note: "A JavaScript task was completed 55.8% faster with AI assistance.",
    },
  ],
  sql: [
    {
      sourceId: "spider-2",
      signal: "mixed",
      note: "Simple, well-specified SQL is largely solved (91.2% on Spider 1.0). Enterprise-grade work was not (21.3% on Spider 2.0).",
    },
  ],
};

export const JOB_EVIDENCE: Record<string, EvidenceRef[]> = {
  "software-dev": [
    {
      sourceId: "copilot-rct",
      signal: "more",
      note: "Large speed-up on one well-defined coding task.",
    },
    {
      sourceId: "metr-rct",
      signal: "less",
      note: "Slowdown for experts working on code they know. The two studies disagree, which is why this role is scored 'moderate', not 'severe'.",
    },
    {
      sourceId: "gpts-are-gpts",
      signal: "mixed",
      note: "Software work is highly exposed to LLMs. Exposure says tasks can be sped up, not that the job disappears.",
    },
  ],
  "data-analyst": [
    {
      sourceId: "spider-2",
      signal: "mixed",
      note: "Routine querying is automatable. Messy enterprise data work still defeated agents in this benchmark.",
    },
  ],
};

for (const [id, refs] of Object.entries(MORE_SKILL_EVIDENCE)) SKILL_EVIDENCE[id] = [...(SKILL_EVIDENCE[id] ?? []), ...refs];
for (const [id, refs] of Object.entries(MORE_JOB_EVIDENCE)) JOB_EVIDENCE[id] = [...(JOB_EVIDENCE[id] ?? []), ...refs];

export const evidenceFor = (kind: "skill" | "job", id: string): EvidenceRef[] =>
  (kind === "skill" ? SKILL_EVIDENCE : JOB_EVIDENCE)[id] ?? [];

export { LIVE_SOURCES } from "./sources2";

export const isDated = (year: number): boolean => new Date().getFullYear() - year >= 2;
