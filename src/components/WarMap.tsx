import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import { fmtWorkers, riskColor, riskLabel } from "../lib/derive";
import {
  LAND,
  WAR_H,
  WAR_W,
  cityPositions,
  clusterRadius,
  occupancy,
  route,
  routeAt,
  warFields,
  warStats,
  type WarField,
} from "../lib/war";
import { ConfidenceBadge } from "./Evidence";

interface Props {
  selectedFieldId: string | null;
  selectedJobId: string | null;
  onSelectField: (id: string) => void;
  onSelectJob: (id: string) => void;
}

const HOLD = "#4cc9f0";
const FRONT = "#e0243c";

/** A slightly irregular coastline, deterministic so it never jumps between renders. */
function landPath(): string {
  const pts: [number, number][] = [];
  const n = 72;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const wob = 1 + 0.07 * Math.sin(a * 3 + 0.6) + 0.05 * Math.sin(a * 7 + 1.9) + 0.03 * Math.sin(a * 13);
    pts.push([LAND.cx + Math.cos(a) * LAND.rx * wob, LAND.cy + Math.sin(a) * LAND.ry * wob]);
  }
  return d3.line().curve(d3.curveCatmullRomClosed.alpha(0.5))(pts) ?? "";
}

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

export function WarMap({ selectedFieldId, selectedJobId, onSelectField, onSelectJob }: Props) {
  const fields = useMemo(warFields, []);
  const byId = useMemo(() => new Map(fields.map((f) => [f.id, f])), [fields]);
  const coast = useMemo(landPath, []);
  const [advance, setAdvance] = useState(100);
  const [playing, setPlaying] = useState(false);
  const [hover, setHover] = useState<string | null>(null);
  const raf = useRef(0);

  const cities = useMemo(() => new Map(fields.map((f) => [f.id, cityPositions(f.id)])), [fields]);
  const radii = useMemo(() => new Map(fields.map((f) => [f.id, clusterRadius(cities.get(f.id)?.length ?? 1)])), [fields, cities]);
  const rScale = useMemo(() => d3.scaleSqrt().domain([0, 3500]).range([2.5, 7]), []);

  const cells = useMemo(() => {
    const vor = d3.Delaunay.from(fields.map((f) => f.seed)).voronoi([0, 0, WAR_W, WAR_H]);
    return new Map(fields.map((f, i) => [f.id, vor.renderCell(i)]));
  }, [fields]);

  /** Each field is invaded from the nearest field that falls earlier. */
  const lines = useMemo(() => {
    const order = [...fields].sort((a, b) => a.arrival - b.arrival);
    return order
      .filter((f) => !f.origin)
      .map((f) => {
        const earlier = order.filter((o) => o.arrival < f.arrival || (o.arrival === f.arrival && o.origin));
        const parent = earlier.reduce((best, o) =>
          Math.hypot(o.seed[0] - f.seed[0], o.seed[1] - f.seed[1]) < Math.hypot(best.seed[0] - f.seed[0], best.seed[1] - f.seed[1]) ? o : best,
        );
        return {
          to: f,
          parent,
          path: route(parent.seed, f.seed, (radii.get(parent.id) ?? 30) + 4, (radii.get(f.id) ?? 30) + 8),
        };
      });
  }, [fields, radii]);

  // Play: advance the front over ~14s, user-initiated only.
  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      let done = false;
      setAdvance((a) => {
        const next = a + dt / 140;
        if (next >= 100) {
          done = true;
          return 100;
        }
        return next;
      });
      if (done) setPlaying(false);
      else raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [playing]);

  const stats = warStats(advance);
  const shownField: WarField | undefined = byId.get(hover ?? selectedFieldId ?? "");
  const exposedPct = stats.exposedTotalK ? Math.round((stats.exposedReachedK / stats.exposedTotalK) * 100) : 0;

  const play = () => {
    if (playing) return setPlaying(false);
    if (advance >= 100) setAdvance(0);
    setPlaying(true);
  };

  return (
    <div className="war">
      <div className="war-head">
        <h2>War map</h2>
        <p className="panel-sub">
          AI is the invading force. Territories are fields; each dot is a role. <ConfidenceBadge level="estimate" /> The order of
          invasion follows our editorial velocity scores. It is a relative order, not dates.
        </p>
      </div>

      <div className="war-stats">
        <div className="ov-stat">
          <b style={{ color: FRONT }}>
            {stats.reached}/{stats.total}
          </b>
          <span>Fields reached</span>
          <small>Territories the front has touched at this point</small>
        </div>
        <div className="ov-stat">
          <b style={{ color: HOLD }}>{stats.holding}</b>
          <span>Lines holding</span>
          <small>Reached, but augmenting or under 25 risk</small>
        </div>
        <div className="ov-stat">
          <b>{exposedPct}%</b>
          <span>Exposed workers reached</span>
          <small>
            Of {fmtWorkers(stats.exposedTotalK)} in roles scoring 50+, {fmtWorkers(stats.exposedReachedK)} sit in reached fields
          </small>
        </div>
      </div>

      <div className="war-controls">
        <button className="war-btn" onClick={play} aria-pressed={playing}>
          {playing ? "Pause" : advance >= 100 ? "Replay invasion" : advance === 0 ? "Start invasion" : "Resume"}
        </button>
        <button className="war-btn" onClick={() => { setPlaying(false); setAdvance(0); }} disabled={advance === 0 && !playing}>
          Reset
        </button>
        <label className="war-slider">
          <span>Advance of the front</span>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={Math.round(advance)}
            onChange={(e) => {
              setPlaying(false);
              setAdvance(Number(e.target.value));
            }}
            aria-valuetext={`${Math.round(advance)} percent of the invasion, ${stats.reached} of ${stats.total} fields reached`}
          />
          <b>{Math.round(advance)}%</b>
        </label>
      </div>

      <svg
        className="war-svg"
        viewBox={`0 0 ${WAR_W} ${WAR_H}`}
        role="group"
        aria-label="War map: AI advancing across fields of work. Colour is displacement risk; a dashed blue outline means the line holds."
      >
        <defs>
          <clipPath id="war-land">
            <path d={coast} />
          </clipPath>
          <pattern id="war-grid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M50 0H0V50" fill="none" stroke="#ffffff0d" />
          </pattern>
          <radialGradient id="war-sea" cx="50%" cy="50%" r="75%">
            <stop offset="0%" stopColor="#101526" />
            <stop offset="100%" stopColor="#080a12" />
          </radialGradient>
        </defs>

        <rect width={WAR_W} height={WAR_H} fill="url(#war-sea)" />
        <rect width={WAR_W} height={WAR_H} fill="url(#war-grid)" />

        {/* Landmass */}
        <path d={coast} fill="#1a1e2e" stroke="#3a4160" strokeWidth={2} />
        <g clipPath="url(#war-land)">
          {fields.map((f) => {
            const occ = occupancy(advance, f.arrival) * (f.holds ? 0.45 : 1);
            const sel = f.id === selectedFieldId;
            return (
              <g
                key={f.id}
                className="war-terr"
                role="button"
                tabIndex={0}
                aria-pressed={sel}
                aria-label={`${f.name}. Risk ${f.risk} of 100, ${riskLabel(f.risk)}. ${
                  f.origin ? "Where the invasion begins." : f.holds ? "The line holds here." : `Reached at ${f.arrival} percent.`
                }`}
                onClick={() => onSelectField(f.id)}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onSelectField(f.id))}
                onMouseEnter={() => setHover(f.id)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(f.id)}
                onBlur={() => setHover(null)}
              >
                <path d={cells.get(f.id) ?? ""} fill="#1a1e2e" />
                <path d={cells.get(f.id) ?? ""} fill={riskColor(f.risk)} fillOpacity={0.5 * occ} className="war-flood" />
                <path
                  d={cells.get(f.id) ?? ""}
                  fill="none"
                  stroke={sel ? "#fff" : f.holds && occ > 0 ? HOLD : "#3a4160"}
                  strokeWidth={sel ? 3 : f.holds && occ > 0 ? 2 : 1}
                  strokeDasharray={f.holds && !sel ? "6 4" : undefined}
                />
              </g>
            );
          })}
        </g>

        {/* Invasion routes */}
        <g pointerEvents="none">
          {lines.map(({ to, parent, path }) => {
            const span = Math.max(1, to.arrival - parent.arrival);
            const t = clamp01((advance - parent.arrival) / span);
            if (t <= 0) return null;
            const { q0, tip, dir } = routeAt(path, t);
            const [dx, dy] = dir;
            const head = `${tip[0]},${tip[1]} ${tip[0] - dx * 13 - dy * 6},${tip[1] - dy * 13 + dx * 6} ${tip[0] - dx * 13 + dy * 6},${tip[1] - dy * 13 - dx * 6}`;
            const stalled = to.holds && t >= 1;
            return (
              <g key={to.id} className={t < 1 ? "war-advancing" : undefined}>
                <path d={`M${path.p0[0]},${path.p0[1]} Q${q0[0]},${q0[1]} ${tip[0]},${tip[1]}`} fill="none" stroke={stalled ? HOLD : FRONT} strokeWidth={3.5} strokeLinecap="round" strokeOpacity={0.9} />
                <polygon points={head} fill={stalled ? HOLD : FRONT} />
              </g>
            );
          })}
        </g>

        {/* Cities (roles) and labels */}
        {fields.map((f) => {
          const occ = occupancy(advance, f.arrival);
          const r0 = radii.get(f.id) ?? 30;
          return (
            <g key={f.id}>
              {f.origin && (
                <circle cx={f.seed[0]} cy={f.seed[1]} r={r0 + 10} fill="none" stroke={FRONT} strokeWidth={2} className="war-beach" pointerEvents="none" />
              )}
              {cities.get(f.id)?.map(({ job, x, y }) => {
                const taken = occ > 0.5;
                const sel = job.id === selectedJobId;
                return (
                  <circle
                    key={job.id}
                    cx={x}
                    cy={y}
                    r={rScale(job.workersK)}
                    fill={taken ? riskColor(job.risk) : "#7a84a8"}
                    stroke={sel ? "#fff" : job.augmenting ? HOLD : "#0a0b10"}
                    strokeWidth={sel ? 2.5 : job.augmenting ? 1.5 : 1}
                    className="war-city"
                    role="button"
                    tabIndex={0}
                    aria-label={`${job.title}. Risk ${job.risk}.`}
                    onClick={() => onSelectJob(job.id)}
                    onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onSelectJob(job.id))}
                    onMouseEnter={() => setHover(f.id)}
                    onMouseLeave={() => setHover(null)}
                  >
                    <title>{`${job.title} · risk ${job.risk}`}</title>
                  </circle>
                );
              })}
              <text x={f.seed[0]} y={f.seed[1] - r0 - 8} textAnchor="middle" className="war-label" pointerEvents="none">
                {f.name.toUpperCase()}
              </text>
              <text x={f.seed[0]} y={f.seed[1] + r0 + 14} textAnchor="middle" className="war-sub" pointerEvents="none">
                {f.origin ? "AI beachhead" : occ <= 0 ? "not yet reached" : f.holds ? "line holds" : occ < 1 ? "under attack" : "overrun"}
              </text>
            </g>
          );
        })}

        {/* Compass */}
        <g transform="translate(940 70)" pointerEvents="none" className="war-compass">
          <circle r="26" fill="none" stroke="#3a4160" />
          <path d="M0 -22 L5 0 L0 22 L-5 0Z" fill="#3a4160" />
          <text y="-30" textAnchor="middle">N</text>
        </g>
        {/* Scale / legend */}
        <g transform="translate(24 560)" className="war-key" pointerEvents="none">
          <line x1="0" x2="26" y1="0" y2="0" stroke={FRONT} strokeWidth="3.5" />
          <text x="34" y="4">AI advance</text>
          <line x1="130" x2="156" y1="0" y2="0" stroke={HOLD} strokeWidth="3.5" />
          <text x="164" y="4">Advance stalls</text>
          <circle cx="280" cy="0" r="4" fill="#7a84a8" />
          <text x="290" y="4">Untouched role</text>
          <circle cx="395" cy="0" r="4" fill={riskColor(85)} />
          <text x="405" y="4">Overrun role (colour = risk)</text>
        </g>
      </svg>

      <p className="ov-readout" aria-live="polite">
        {shownField ? (
          <>
            <b>{shownField.name}</b> · risk{" "}
            <b style={{ color: riskColor(shownField.risk) }}>{shownField.risk}</b> ({riskLabel(shownField.risk)}) · ~
            {fmtWorkers(shownField.workersK)} US workers in {shownField.jobCount} roles ·{" "}
            {shownField.origin
              ? "the beachhead: AI is built and tested here first"
              : shownField.holds
                ? "the advance stalls here: AI assists rather than replaces"
                : `front arrives at ${shownField.arrival}% of the advance`}
          </>
        ) : (
          "Press Start invasion, or drag the slider. Hover a territory; click it or a dot to open the details."
        )}
      </p>
      <p className="fine war-fine">
        This is a picture of relative speed, not a prediction of dates. Arrival order is each field's workforce-weighted velocity score
        from our dataset (editorial estimates). Where a line holds, AI is mostly augmenting people; the map shows the front reaching
        those fields without taking them.
      </p>
    </div>
  );
}
