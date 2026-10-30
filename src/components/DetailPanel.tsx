import { FIELDS, JOBS, SKILLS, fieldById, jobById, skillById } from "../data/dataset";
import { ConfidenceBadge, EvidenceList, hasEvidence } from "./Evidence";
import { FieldLiveSignals, JobLiveSignals, JobNews } from "./Live";
import { fieldStats, fmtWorkers, riskColor, riskLabel } from "../lib/derive";
import type { Job, Selection, Skill } from "../types";

interface Props {
  selection: Selection | null;
  onSelect: (s: Selection) => void;
  onClear: () => void;
  onOpenSources: () => void;
}

function RiskDial({ value }: { value: number }) {
  const c = riskColor(value);
  return (
    <div className="dial" role="img" aria-label={`Displacement risk ${value} out of 100, ${riskLabel(value)}`}>
      <div className="dial-num" style={{ color: c }}>
        {value}
        <small>/100</small>
      </div>
      <div className="dial-bar">
        <div style={{ width: `${value}%`, background: c }} />
      </div>
      <div className="dial-label" style={{ color: c }}>
        {riskLabel(value)} displacement risk
      </div>
    </div>
  );
}

function Chip({ onClick, children, tone }: { onClick?: () => void; children: React.ReactNode; tone?: string }) {
  return onClick ? (
    <button className={`chip ${tone ?? ""}`} onClick={onClick}>
      {children}
    </button>
  ) : (
    <span className={`chip static ${tone ?? ""}`}>{children}</span>
  );
}

function JobDetail({
  job,
  onSelect,
  onOpenSources,
}: {
  job: Job;
  onSelect: (s: Selection) => void;
  onOpenSources: () => void;
}) {
  const jobEv = hasEvidence("job", job.id);
  const field = fieldById(job.fieldId);
  const skills = job.skillIds.map(skillById).filter((s): s is Skill => !!s);
  const survives = skills.filter((s) => s.automatability < 40);
  const exposed = skills.filter((s) => s.automatability >= 40);

  return (
    <>
      <p className="eyebrow">{field?.name}</p>
      <h2>{job.title}</h2>
      <RiskDial value={job.risk} />
      <p className="badge-row">
        <ConfidenceBadge level={jobEv ? "evidence" : "estimate"} />
      </p>
      <dl className="stats">
        <div>
          <dt>Spread speed</dt>
          <dd>{job.velocity}/100</dd>
        </div>
        <div>
          <dt>US workers</dt>
          <dd>~{fmtWorkers(job.workersK)}</dd>
        </div>
        <div>
          <dt>10-yr outlook (forecast)</dt>
          <dd>
            {job.growth > 0 ? "+" : ""}
            {job.growth}%
          </dd>
        </div>
      </dl>
      {job.augmenting && (
        <p className="note augment">
          AI is <strong>augmenting</strong> this role more than replacing it. Accountability, safety certification and
          adversarial conditions keep people in the loop.
        </p>
      )}

      <h3>Evidence</h3>
      <EvidenceList kind="job" id={job.id} />

      <h3>What's replacing it</h3>
      <div className="chips">
        {job.tools.map((t) => (
          <Chip key={t} tone="plague">
            {t}
          </Chip>
        ))}
      </div>

      <h3>What survives</h3>
      {survives.length ? (
        <div className="chips">
          {survives.map((s) => (
            <Chip key={s.id} tone="resist" onClick={() => onSelect({ type: "skill", id: s.id })}>
              {s.name}
            </Chip>
          ))}
        </div>
      ) : (
        <p className="muted">Most skills in this role are exposed. See pivots below.</p>
      )}
      {exposed.length > 0 && (
        <>
          <h4>Exposed skills</h4>
          <div className="chips">
            {exposed.map((s) => (
              <Chip key={s.id} tone="plague" onClick={() => onSelect({ type: "skill", id: s.id })}>
                {s.name}
              </Chip>
            ))}
          </div>
        </>
      )}

      <h3>
        Where to pivot <ConfidenceBadge level="forecast" />
      </h3>
      <ul className="pivots">
        {job.pivots.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>

      <h3>Live market signals</h3>
      <JobLiveSignals jobId={job.id} fieldId={job.fieldId} />

      <h3>Latest news</h3>
      <JobNews jobId={job.id} title={job.title} />
      <p className="fine">
        Scores are judgments, not measurements. Labels show how well each is supported.{" "}
        <button className="linkish" onClick={onOpenSources}>
          See sources &amp; method
        </button>
      </p>
    </>
  );
}

function SkillDetail({
  skill,
  onSelect,
  onOpenSources,
}: {
  skill: Skill;
  onSelect: (s: Selection) => void;
  onOpenSources: () => void;
}) {
  const skillEv = hasEvidence("skill", skill.id);
  const jobs = JOBS.filter((j) => j.skillIds.includes(skill.id)).sort((a, b) => b.workersK - a.workersK);
  const arrow = skill.demand === "rising" ? "▲ Rising" : skill.demand === "falling" ? "▼ Falling" : "■ Holding";
  return (
    <>
      <p className="eyebrow">{skill.kind === "human" ? "Human skill" : "Technical skill"}</p>
      <h2>{skill.name}</h2>
      <div className={`demand ${skill.demand}`}>
        {arrow}{" "}
        <span>
          {skill.demandChange > 0 ? "+" : ""}
          {skill.demandChange}% demand, 5 yr
        </span>
      </div>
      <div className="dial" role="img" aria-label={`Automatable ${skill.automatability} out of 100`}>
        <div className="dial-label">Automatable today</div>
        <div className="dial-bar">
          <div style={{ width: `${skill.automatability}%`, background: riskColor(skill.automatability) }} />
        </div>
        <div className="dial-label" style={{ color: riskColor(skill.automatability) }}>
          {skill.automatability}/100 · {riskLabel(skill.automatability)}
        </div>
      </div>
      <p className="badge-row">
        <ConfidenceBadge level={skillEv ? "evidence" : "estimate"} />
      </p>

      <h3>How do we know?</h3>
      <EvidenceList kind="skill" id={skill.id} />

      <h3>
        5-year outlook <ConfidenceBadge level="forecast" />
      </h3>
      <p>{skill.outlook}</p>
      <p className="muted">
        This is a prediction, not a measurement. The{" "}
        {skill.demandChange > 0 ? "+" : ""}
        {skill.demandChange}% figure is our scenario, not a published forecast.
      </p>

      {skill.whyResistant && (
        <>
          <h3>
            Why AI structurally can't replace it <ConfidenceBadge level="argument" />
          </h3>
          <p className="note resist">{skill.whyResistant}</p>
          <p className="muted">
            This is a reasoned argument, not a tested result. It could be wrong if technology moves in a direction we did not expect.
          </p>
        </>
      )}

      <h3>Jobs that need it</h3>
      <div className="chips">
        {jobs.map((j) => (
          <Chip key={j.id} tone={j.risk >= 50 ? "plague" : "resist"} onClick={() => onSelect({ type: "job", id: j.id })}>
            {j.title}
          </Chip>
        ))}
      </div>
      <p className="fine">
        <button className="linkish" onClick={onOpenSources}>
          See sources &amp; method
        </button>
      </p>

    </>
  );
}

function FieldDetail({ fieldId, onSelect }: { fieldId: string; onSelect: (s: Selection) => void }) {
  const f = fieldById(fieldId)!;
  const s = fieldStats(fieldId);
  const sorted = [...s.jobs].sort((a, b) => b.risk - a.risk);
  return (
    <>
      <p className="eyebrow">Field</p>
      <h2>{f.name}</h2>
      <RiskDial value={s.risk} />
      <p>{f.blurb}</p>
      {f.augmenting && (
        <p className="note augment">
          Dashed cyan = augmenting. AI changes these jobs without removing the human who must be answerable for them.
        </p>
      )}
      <FieldLiveSignals fieldId={fieldId} />
      <h3>Roles, most exposed first</h3>
      <ul className="rolelist">
        {sorted.map((j) => (
          <li key={j.id}>
            <button onClick={() => onSelect({ type: "job", id: j.id })}>
              <span>{j.title}</span>
              <b style={{ color: riskColor(j.risk) }}>{j.risk}</b>
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}

function Intro({ onOpenSources }: { onOpenSources: () => void }) {
  const worst = [...JOBS].sort((a, b) => b.risk - a.risk).slice(0, 3);
  const rising = SKILLS.filter((s) => s.demand === "rising").length;
  return (
    <>
      <p className="eyebrow">How to read this</p>
      <h2>Where AI is spreading</h2>
      <p>
        Each bubble is a field, job or skill. <strong>Color and density</strong> show how exposed it is.{" "}
        <strong>Speed of the spores</strong> shows how fast displacement is moving. <strong>Size</strong> is how many people
        work in it.
      </p>
      <p>Click anything to dig in, or search for your own job. Every score is paired with what survives and where to go next.</p>
      <h3>Fastest-moving right now</h3>
      <ul className="rolelist">
        {worst.map((j) => (
          <li key={j.id}>
            <span>{j.title}</span>
            <b style={{ color: riskColor(j.risk) }}>{j.risk}</b>
          </li>
        ))}
      </ul>
      <p className="muted">
        {FIELDS.length} fields · {JOBS.length} roles · {SKILLS.length} skills — {rising} of them rising in demand.
      </p>
      <p className="fine">
        Most scores are our editorial estimates, labelled as such. A few link to studies we've read.{" "}
        <button className="linkish" onClick={onOpenSources}>
          See sources &amp; method
        </button>
      </p>
    </>
  );
}

export function DetailPanel({ selection, onSelect, onClear, onOpenSources }: Props) {
  let body: React.ReactNode = <Intro onOpenSources={onOpenSources} />;
  if (selection?.type === "job") {
    const j = jobById(selection.id);
    if (j) body = <JobDetail job={j} onSelect={onSelect} onOpenSources={onOpenSources} />;
  } else if (selection?.type === "skill") {
    const s = skillById(selection.id);
    if (s) body = <SkillDetail skill={s} onSelect={onSelect} onOpenSources={onOpenSources} />;
  } else if (selection?.type === "field") {
    body = <FieldDetail fieldId={selection.id} onSelect={onSelect} />;
  }
  return (
    <aside className="detail" aria-live="polite">
      {selection && (
        <button className="close" onClick={onClear} aria-label="Clear selection">
          ✕
        </button>
      )}
      {body}
    </aside>
  );
}
