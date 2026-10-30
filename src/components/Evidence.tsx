import { evidenceFor, isDated, sourceById } from "../data/sources";
import type { Signal } from "../types";

export type Confidence = "evidence" | "estimate" | "forecast" | "argument";

const META: Record<Confidence, { label: string; help: string }> = {
  evidence: {
    label: "Evidence-linked",
    help: "At least one cited study bears on this. The score itself is still our judgment of that evidence.",
  },
  estimate: {
    label: "Editorial estimate",
    help: "Our own judgment. No cited source directly supports this number yet.",
  },
  forecast: {
    label: "Forecast",
    help: "A prediction about the future. Nobody knows if it is true. Treat as a scenario, not a fact.",
  },
  argument: {
    label: "Reasoned argument",
    help: "A logical argument for why something is hard to automate. It has not been tested by an experiment.",
  },
};

export function ConfidenceBadge({ level }: { level: Confidence }) {
  return (
    <span className={`badge ${level}`} title={META[level].help}>
      {META[level].label}
    </span>
  );
}

const SIGNAL: Record<Signal, string> = {
  more: "Points toward: more automatable",
  less: "Points toward: less automatable",
  mixed: "Mixed result",
};

export function EvidenceList({ kind, id }: { kind: "skill" | "job"; id: string }) {
  const refs = evidenceFor(kind, id);
  if (!refs.length) {
    return (
      <p className="muted evidence-none">
        No study is linked to this yet, so the score above is our <strong>editorial estimate</strong>. We would rather say that than
        invent a citation.
      </p>
    );
  }
  return (
    <ul className="evidence">
      {refs.map((r) => {
        const s = sourceById(r.sourceId);
        if (!s) return null;
        return (
          <li key={r.sourceId}>
            <span className={`signal ${r.signal}`}>{SIGNAL[r.signal]}</span>
            <a href={s.url} target="_blank" rel="noreferrer">
              {s.title}
            </a>
            <small>
              {s.authors}, {s.year}
              {isDated(s.year) && <em> · older than 2 years — models have changed</em>}
            </small>
            <p className="finding">{s.finding}</p>
            <p className="why">{r.note}</p>
            <p className="caveat">
              <b>Limits:</b> {s.caveat}
            </p>
          </li>
        );
      })}
    </ul>
  );
}

export function hasEvidence(kind: "skill" | "job", id: string): boolean {
  return evidenceFor(kind, id).length > 0;
}
