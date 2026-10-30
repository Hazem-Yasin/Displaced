import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import { JOBS, jobById } from "../data/dataset";
import { fmtWorkers, riskColor, riskLabel } from "../lib/derive";
import { bandBreakdown, coverage, fieldRiskRows, treemapData, type TreeJob } from "../lib/insights";
import { ConfidenceBadge } from "./Evidence";

interface Props {
  selectedJobId: string | null;
  onSelectJob: (id: string) => void;
  onSelectField: (id: string) => void;
}

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.floor(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

const pctText = (x: number) => `${Math.round(x * 100)}%`;

function Stat({ value, label, note }: { value: string; label: string; note: string }) {
  return (
    <div className="ov-stat">
      <b>{value}</b>
      <span>{label}</span>
      <small>{note}</small>
    </div>
  );
}

function Treemap({ width, selectedJobId, onSelectJob }: { width: number; selectedJobId: string | null; onSelectJob: (id: string) => void }) {
  const height = Math.max(320, Math.min(460, width * 0.5));
  const root = useMemo(() => {
    const h = d3
      .hierarchy<{ id?: string; name?: string; children?: unknown[]; risk?: number; workersK?: number }>(treemapData() as never)
      .sum((d) => d.workersK ?? 0)
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
    return d3.treemap<(typeof h)["data"]>().size([width, height]).paddingInner(2).paddingOuter(2).paddingTop(18).round(true)(h);
  }, [width, height]);
  const [hover, setHover] = useState<TreeJob | null>(null);
  const shown = hover ?? (selectedJobId ? (JOBS.find((j) => j.id === selectedJobId) as unknown as TreeJob | undefined) ?? null : null);

  return (
    <div>
      <svg width={width} height={height} role="group" aria-label="Treemap of all roles: size is workforce, colour is displacement risk">
        {root.children?.map((f) => (
          <g key={f.data.id}>
            {f.x1 - f.x0 > 40 && (
              <text x={f.x0 + 4} y={f.y0 + 13} className="tm-field">
                {(() => {
                  const name = f.data.name ?? "";
                  const max = Math.max(3, Math.floor((f.x1 - f.x0 - 8) / 7.5));
                  return name.length > max ? name.slice(0, max - 1) + "…" : name;
                })()}
              </text>
            )}
            {f.leaves().map((l) => {
              const w = l.x1 - l.x0;
              const h = l.y1 - l.y0;
              const job = l.data as unknown as TreeJob;
              const sel = job.id === selectedJobId;
              return (
                <g
                  key={job.id}
                  className="tm-cell"
                  role="button"
                  tabIndex={0}
                  aria-label={`${job.name}. Risk ${job.risk} of 100, ${riskLabel(job.risk)}. About ${fmtWorkers(job.workersK)} US workers.`}
                  aria-pressed={sel}
                  onClick={() => onSelectJob(job.id)}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onSelectJob(job.id))}
                  onMouseEnter={() => setHover(job)}
                  onMouseLeave={() => setHover(null)}
                  onFocus={() => setHover(job)}
                  onBlur={() => setHover(null)}
                >
                  <rect x={l.x0} y={l.y0} width={w} height={h} fill={riskColor(job.risk)} stroke={sel ? "#fff" : "#0a0b10"} strokeWidth={sel ? 2.5 : 1} />
                  {w > 62 && h > 26 && (
                    <text x={l.x0 + 5} y={l.y0 + 14} className="tm-label">
                      {job.name.length > w / 6.2 ? job.name.slice(0, Math.max(3, Math.floor(w / 6.2) - 1)) + "…" : job.name}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        ))}
      </svg>
      <p className="ov-readout" aria-live="polite">
        {shown ? (
          <>
            <b>{shown.name}</b> · risk <b style={{ color: riskColor(shown.risk) }}>{shown.risk}</b> ({riskLabel(shown.risk)}) · ~{fmtWorkers(shown.workersK)} US workers
          </>
        ) : (
          "Hover or focus a rectangle. Click to open the role."
        )}
      </p>
    </div>
  );
}

function Scatter({ width, selectedJobId, onSelectJob }: { width: number; selectedJobId: string | null; onSelectJob: (id: string) => void }) {
  const height = 340;
  const m = { l: 44, r: 14, t: 12, b: 38 };
  const x = d3.scaleLinear().domain([0, 100]).range([m.l, width - m.r]);
  const [gMin, gMax] = d3.extent(JOBS, (j) => j.growth) as [number, number];
  const y = d3.scaleLinear().domain([Math.min(gMin, -5) - 2, gMax + 2]).range([height - m.b, m.t]);
  const r = d3.scaleSqrt().domain([0, d3.max(JOBS, (j) => j.workersK) ?? 1]).range([3, 20]);
  const labelled = [...JOBS].sort((a, b) => b.workersK - a.workersK).slice(0, 6).map((j) => j.id);
  const [hover, setHover] = useState<string | null>(null);
  const shown = jobById(hover ?? selectedJobId ?? "");

  return (
    <div>
      <svg width={width} height={height} role="group" aria-label="Scatter: displacement risk against projected 10-year employment change">
        <line x1={m.l} x2={width - m.r} y1={y(0)} y2={y(0)} className="sc-zero" />
        {y.ticks(5).map((t) => (
          <g key={t}>
            <line x1={m.l} x2={width - m.r} y1={y(t)} y2={y(t)} className="sc-grid" />
            <text x={m.l - 6} y={y(t) + 4} textAnchor="end" className="sc-tick">
              {t > 0 ? "+" : ""}
              {t}%
            </text>
          </g>
        ))}
        {[0, 25, 50, 75, 100].map((t) => (
          <text key={t} x={x(t)} y={height - m.b + 16} textAnchor="middle" className="sc-tick">
            {t}
          </text>
        ))}
        <text x={(m.l + width - m.r) / 2} y={height - 4} textAnchor="middle" className="sc-axis">
          Displacement risk (editorial estimate) →
        </text>
        <text transform={`translate(12 ${(m.t + height - m.b) / 2}) rotate(-90)`} textAnchor="middle" className="sc-axis">
          10-yr employment change (forecast)
        </text>
        {[...JOBS]
          .sort((a, b) => b.workersK - a.workersK)
          .map((j) => (
            <circle
              key={j.id}
              cx={x(j.risk)}
              cy={y(j.growth)}
              r={r(j.workersK)}
              fill={riskColor(j.risk)}
              fillOpacity={0.75}
              stroke={j.id === selectedJobId ? "#fff" : "#0a0b10"}
              strokeWidth={j.id === selectedJobId ? 2.5 : 1}
              className="sc-dot"
              role="button"
              tabIndex={0}
              aria-label={`${j.title}. Risk ${j.risk}, projected change ${j.growth} percent.`}
              onClick={() => onSelectJob(j.id)}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onSelectJob(j.id))}
              onMouseEnter={() => setHover(j.id)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(j.id)}
              onBlur={() => setHover(null)}
            />
          ))}
        {JOBS.filter((j) => labelled.includes(j.id)).map((j) => (
          <text key={j.id} x={x(j.risk)} y={y(j.growth) - r(j.workersK) - 4} textAnchor="middle" className="sc-label">
            {j.title}
          </text>
        ))}
      </svg>
      <p className="ov-readout" aria-live="polite">
        {shown ? (
          <>
            <b>{shown.title}</b> · risk {shown.risk} · outlook {shown.growth > 0 ? "+" : ""}
            {shown.growth}% · ~{fmtWorkers(shown.workersK)} workers
          </>
        ) : (
          "Bubble size = workforce. Upper-left: low risk and growing. Lower-right: high risk and shrinking."
        )}
      </p>
    </div>
  );
}

export function Insights({ selectedJobId, onSelectJob, onSelectField }: Props) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const cov = useMemo(coverage, []);
  const bands = useMemo(bandBreakdown, []);
  const fields = useMemo(fieldRiskRows, []);
  const maxBand = Math.max(...bands.map((b) => b.share));

  return (
    <div className="ov" ref={ref}>
      <div className="ov-head">
        <h2>Overview</h2>
        <p className="panel-sub">
          All {cov.jobs} roles at once. <ConfidenceBadge level="estimate" /> Every score here is our estimate, not a measurement.
        </p>
      </div>

      <div className="ov-stats">
        <Stat value={`${cov.avgRisk}/100`} label="Average risk" note={`Weighted by workforce across the ${cov.jobs} roles we cover`} />
        <Stat value={pctText(cov.highPlusShare)} label="In High or Severe roles" note="Share of covered workers scoring 50 or more" />
        <Stat value={pctText(cov.augmentingShare)} label="In augmenting roles" note="Military & Defense roles, where AI assists rather than replaces" />
        <Stat value={fmtWorkers(cov.workersK)} label="Workers covered" note="A sample of occupations, not the whole economy" />
      </div>

      {width > 0 && (
        <>
          <h3>Every role: size is workforce, colour is risk</h3>
          <Treemap width={width} selectedJobId={selectedJobId} onSelectJob={onSelectJob} />

          <div className="ov-cols">
            <section>
              <h3>Workers by risk band</h3>
              <ul className="bars">
                {bands.map((b) => (
                  <li key={b.label}>
                    <span className="bar-name">{b.label}</span>
                    <span className="bar-track">
                      <i style={{ width: `${(b.share / maxBand) * 100}%`, background: riskColor({ Low: 12, Moderate: 38, High: 62, Severe: 88 }[b.label]) }} />
                    </span>
                    <span className="bar-val">
                      {pctText(b.share)} <small>({b.jobs} roles)</small>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
            <section>
              <h3>Risk by field</h3>
              <ul className="bars">
                {fields.map((f) => (
                  <li key={f.id}>
                    <button className="bar-name linkish" onClick={() => onSelectField(f.id)}>
                      {f.name}
                    </button>
                    <span className="bar-track">
                      <i style={{ width: `${f.risk}%`, background: f.augmenting ? "#4cc9f0" : riskColor(f.risk) }} />
                    </span>
                    <span className="bar-val">{f.risk}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <h3>
            Risk vs. outlook <ConfidenceBadge level="forecast" />
          </h3>
          <Scatter width={width} selectedJobId={selectedJobId} onSelectJob={onSelectJob} />
          <p className="fine">
            The vertical axis uses the 10-year growth figures in our dataset. These are <strong>placeholders, not BLS projections</strong>
            (the only role where we have read a BLS projection is Aerospace Engineer, +8%). Read the picture as "high-exposure roles can
            still grow", not as a forecast for any one job.
          </p>
        </>
      )}
    </div>
  );
}
