import { useEffect, useRef } from "react";
import { LIVE_SOURCES, PLANNED_SOURCES, SOURCES } from "../data/sources";
import { ConfidenceBadge } from "./Evidence";

export function SourcesDrawer({ onClose }: { onClose: () => void }) {
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
        className="drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Sources and method"
        tabIndex={-1}
        ref={ref}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button className="close" onClick={onClose} aria-label="Close sources">
          ✕
        </button>
        <p className="eyebrow">Proof, and its limits</p>
        <h2>Sources &amp; method</h2>

        <p>
          Every number in Displaced falls into one of four buckets. The label sits next to the number, so you can tell a measurement
          from a guess.
        </p>
        <ul className="bucket-list">
          <li>
            <ConfidenceBadge level="evidence" /> A cited study bears on it. Still our reading of that study.
          </li>
          <li>
            <ConfidenceBadge level="estimate" /> Our judgment, no direct source yet. <b>Most scores today are here.</b>
          </li>
          <li>
            <ConfidenceBadge level="forecast" /> Predictions about the future: demand changes, 5- and 10-year outlooks, and pivots.
          </li>
          <li>
            <ConfidenceBadge level="argument" /> Why human skills resist automation: logic, not an experiment.
          </li>
        </ul>

        <h3>Worked example: "How good is AI at Python?"</h3>
        <p>
          There is <strong>no single answer</strong>, and anyone who gives you one number is simplifying. Here is what we can and can't say
          from sources we have actually read:
        </p>
        <ol className="worked">
          <li>
            <b>Benchmarks measure narrow tasks.</b> SWE-bench uses 2,294 real issues from 12 Python repositories. At launch (2023) the
            best model solved 1.96%. That number is now badly out of date, and benchmarks like this are the first thing to move. We
            deliberately do not quote a "current" score here because we have not verified one. The live leaderboard is the right place.
          </li>
          <li>
            <b>Benchmarks are not jobs.</b> A randomized trial of 16 experienced developers on real projects (METR, 2025) found AI made
            them 19% <em>slower</em>, while they believed it made them 20% faster. A different controlled experiment (GitHub, 2023) found
            55.8% <em>faster</em> on one well-defined task. The tasks, people and tools differ, so the two don't contradict each other.
          </li>
          <li>
            <b>Exposure is not displacement.</b> The widely cited OpenAI/UPenn analysis estimates how many <em>tasks</em> LLMs could
            speed up (about 19% of US workers with at least half their tasks affected). It explicitly makes no timeline prediction and
            does not say jobs disappear.
          </li>
          <li>
            <b>So what is our Python score (58/100)?</b> It's an <ConfidenceBadge level="estimate" /> informed by 1 and 2. It means "a
            large share of routine Python can be produced by AI, but evidence on real-world work is mixed". It is not a
            measurement.
          </li>
          <li>
            <b>How we'll make it measurable.</b> In the live-data step, the backend will pull current benchmark results and recompute
            these scores from them with a published formula. Each score will show its date, so stale numbers can't hide.
          </li>
        </ol>

        <h3>Sources we have read</h3>
        <ul className="source-list">
          {SOURCES.map((s) => (
            <li key={s.id}>
              <a href={s.url} target="_blank" rel="noreferrer">
                {s.title}
              </a>
              <small>
                {s.authors} · {s.venue} · {s.year}
              </small>
              <p className="finding">{s.finding}</p>
              <p className="caveat">
                <b>Limits:</b> {s.caveat}
              </p>
            </li>
          ))}
        </ul>

        <h3>Live feeds (fetched by our server)</h3>
        <p className="muted">
          These are real measurements, shown as "Live market signals" and never folded silently into the risk scores. The header pill
          shows whether they are reachable right now.
        </p>
        <ul className="source-list">
          {LIVE_SOURCES.map((s) => (
            <li key={s.name}>
              <a href={s.url} target="_blank" rel="noreferrer">
                {s.name}
              </a>
              <p className="finding">{s.used}</p>
              <p className="caveat">
                <b>Limits:</b> {s.limit}
              </p>
            </li>
          ))}
        </ul>

        <h3>Planned, not yet used</h3>
        <p className="muted">
          These are the next sources we intend to connect. <strong>No number in the app currently cites them.</strong> The 10-year growth
          figures on jobs are still our placeholders: the live BLS feed gives recent industry employment, not occupation-level
          projections.
        </p>
        <ul className="pivots">
          {PLANNED_SOURCES.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>

        <h3>What this app can't tell you</h3>
        <p>
          Nobody knows how fast AI will improve, how quickly employers will adopt it, or how regulation and demand will respond. Rising
          or falling "5-year outlook" figures are <ConfidenceBadge level="forecast" />. Use them to compare scenarios, not to make
          life decisions alone.
        </p>
      </div>
    </div>
  );
}
