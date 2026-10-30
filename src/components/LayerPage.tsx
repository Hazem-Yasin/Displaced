import { useEffect, useRef } from "react";
import { JOBS, skillById } from "../data/dataset";
import { HUMAN, MILITARY, type Reason } from "../data/layers";
import { sourceById } from "../data/sources";
import { riskColor } from "../lib/derive";
import type { Selection } from "../types";
import { ConfidenceBadge } from "./Evidence";

export type LayerId = "military" | "human";

interface Props {
  layer: LayerId;
  onClose: () => void;
  onSelect: (s: Selection) => void;
  onOpenSources: () => void;
}

function SourceLinks({ ids }: { ids?: string[] }) {
  if (!ids?.length) return null;
  return (
    <p className="fine">
      Source:{" "}
      {ids.map((id, i) => {
        const s = sourceById(id);
        if (!s) return null;
        return (
          <span key={id}>
            {i > 0 && ", "}
            <a href={s.url} target="_blank" rel="noreferrer">
              {s.authors}, {s.year}
            </a>
          </span>
        );
      })}
    </p>
  );
}

function ReasonCard({ r }: { r: Reason }) {
  return (
    <li className="reason">
      <h4>
        {r.title} <ConfidenceBadge level={r.kind === "evidence" ? "evidence" : "argument"} />
      </h4>
      <p>{r.body}</p>
      <SourceLinks ids={r.sourceIds} />
    </li>
  );
}

function Military({ onSelect, close }: { onSelect: (s: Selection) => void; close: () => void }) {
  const jobs = JOBS.filter((j) => j.fieldId === "military").sort((a, b) => b.risk - a.risk);
  return (
    <>
      <p className="eyebrow">{MILITARY.eyebrow}</p>
      <h2>{MILITARY.title}</h2>
      <p>{MILITARY.lede}</p>

      <h3>Augmenting, not replacing: why these roles are durable</h3>
      <ul className="reasons">
        {MILITARY.reasons.map((r) => (
          <ReasonCard key={r.title} r={r} />
        ))}
      </ul>

      <h3>The honest counter-view</h3>
      <ul className="counter">
        {MILITARY.counter.map((c) => (
          <li key={c}>{c}</li>
        ))}
      </ul>

      <h3>Roles in this layer</h3>
      <ul className="rolelist">
        {jobs.map((j) => (
          <li key={j.id}>
            <button
              onClick={() => {
                onSelect({ type: "job", id: j.id });
                close();
              }}
            >
              <span>
                {j.title}
                <small className="role-note">{MILITARY.roleNotes[j.id]}</small>
              </span>
              <b style={{ color: riskColor(j.risk) }}>{j.risk}</b>
            </button>
          </li>
        ))}
      </ul>
      <p className="muted">Scores are editorial estimates unless the role page shows linked evidence.</p>

      <h3>What we couldn't check</h3>
      <ul className="counter">
        {MILITARY.limits.map((c) => (
          <li key={c}>{c}</li>
        ))}
      </ul>
    </>
  );
}

function Human({ onSelect, close }: { onSelect: (s: Selection) => void; close: () => void }) {
  return (
    <>
      <p className="eyebrow">{HUMAN.eyebrow}</p>
      <h2>{HUMAN.title}</h2>
      <p>{HUMAN.lede}</p>
      {HUMAN.cases.map((c) => {
        const s = skillById(c.skillId);
        if (!s) return null;
        return (
          <section key={c.skillId} className="skillcase">
            <h3>
              {s.name} <ConfidenceBadge level="argument" />
            </h3>
            <p className="note resist">{s.whyResistant}</p>
            <h4>Best objection</h4>
            <p>{c.counter}</p>
            <h4>What would prove the argument wrong</h4>
            <p>{c.breaks}</p>
            <button
              className="linkish"
              onClick={() => {
                onSelect({ type: "skill", id: s.id });
                close();
              }}
            >
              Open {s.name} on the map →
            </button>
          </section>
        );
      })}
      <p className="muted">{HUMAN.closing}</p>
    </>
  );
}

export function LayerPage({ layer, onClose, onSelect, onOpenSources }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    return () => opener?.focus?.();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="overlay" onMouseDown={onClose}>
      <div
        className="drawer layer"
        role="dialog"
        aria-modal="true"
        aria-label={layer === "military" ? MILITARY.title : HUMAN.title}
        tabIndex={-1}
        ref={ref}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button className="close" onClick={onClose} aria-label="Close layer">
          ✕
        </button>
        {layer === "military" ? (
          <Military onSelect={onSelect} close={onClose} />
        ) : (
          <Human onSelect={onSelect} close={onClose} />
        )}
        <p className="fine">
          <button className="linkish" onClick={onOpenSources}>
            See sources &amp; method
          </button>
        </p>
      </div>
    </div>
  );
}
