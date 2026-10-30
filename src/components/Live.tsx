import type { Live } from "../liveTypes";
import { useLive, useNews } from "../lib/live";

const pct = (n: number | null | undefined) => (n == null ? "n/a" : `${n > 0 ? "+" : ""}${n}%`);
const trend = (n: number | null | undefined) => (n == null ? "" : n > 0.5 ? "up" : n < -0.5 ? "down" : "flat");
const jobsFmt = (k: number) => (k >= 1000 ? `${(k / 1000).toFixed(2)}M` : `${k}K`);
const when = (iso?: string) => (iso ? new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "");

function freshness(l: Live<unknown>): string | null {
  if (l.status === "stale") return `Source unreachable, showing cached copy from ${when(l.fetchedAt)}.`;
  return null;
}

/** Header pill: tells the truth about whether live feeds are working. */
export function LiveStatus() {
  const live = useLive();
  let cls = "loading";
  let text = "Connecting to live data…";
  let title = "";
  if (live.phase === "offline") {
    cls = "offline";
    text = "Offline: editorial estimates only";
    title = `API unreachable (${live.error}). Run "npm run dev" to start the API.`;
  } else if (live.phase === "ready") {
    const { bls, indeed } = live.summary;
    const ok = [bls, indeed].filter((l) => l.status === "live").length;
    const none = [bls, indeed].filter((l) => l.status === "unavailable").length;
    if (ok === 2) {
      cls = "ok";
      text = "Live: BLS + Indeed";
    } else if (none === 2) {
      cls = "offline";
      text = "Live feeds unavailable";
    } else {
      cls = "partial";
      text = "Live data: partial";
    }
    title = [
      `BLS: ${bls.status}${bls.fetchedAt ? ` (${when(bls.fetchedAt)})` : ""}${bls.error ? ` - ${bls.error}` : ""}`,
      `Indeed: ${indeed.status}${indeed.fetchedAt ? ` (${when(indeed.fetchedAt)})` : ""}${indeed.error ? ` - ${indeed.error}` : ""}`,
    ].join("\n");
  }
  return (
    <span className={`live-pill ${cls}`} title={title} role="status">
      <i /> {text}
    </span>
  );
}

function Signal({ label, value, tone, note }: { label: string; value: string; tone?: string; note: string }) {
  return (
    <li>
      <div className="sig-head">
        <span>{label}</span>
        <b className={tone}>{value}</b>
      </div>
      <small>{note}</small>
    </li>
  );
}

/** Market signals for one job: Indeed sector postings + BLS industry employment of its field. */
export function JobLiveSignals({ jobId, fieldId }: { jobId: string; fieldId: string }) {
  const live = useLive();
  if (live.phase === "loading") return <p className="muted">Loading live market data…</p>;
  if (live.phase === "offline")
    return <p className="muted">Live data is offline, so only editorial estimates are shown.</p>;

  const { indeed, bls, jobSector } = live.summary;
  const sector = jobSector[jobId];
  const ind = sector ? indeed.data?.[sector] : undefined;
  const pts = bls.data?.[fieldId] ?? [];
  const notes = [freshness(indeed), freshness(bls)].filter(Boolean);

  if (!ind && !pts.length) {
    return (
      <p className="muted">
        No live series maps to this role
        {fieldId === "military" ? " (BLS industry data does not cover active-duty military)" : ""}.
      </p>
    );
  }
  return (
    <>
      <ul className="signals">
        {ind && sector && (
          <Signal
            label={`Indeed postings: ${sector}`}
            value={`${ind.latest}  (${pct(ind.yoyPct)} vs 1 yr ago)`}
            tone={trend(ind.yoyPct)}
            note={`Index, Feb 2020 = 100. Week of ${ind.date}. A broad Indeed category, not just this exact title.`}
          />
        )}
        {pts.map((p) => (
          <Signal
            key={p.id}
            label={`BLS jobs: ${p.label}`}
            value={`${jobsFmt(p.latest)}  (${pct(p.change12mPct)} in 12 mo)`}
            tone={trend(p.change12mPct)}
            note={`Whole-industry employment, ${p.period}. Not specific to this job title.`}
          />
        ))}
      </ul>
      {notes.map((n) => (
        <p key={n} className="fine">
          {n}
        </p>
      ))}
      <p className="fine">
        These are market signals, not proof of AI displacement. Postings and hiring also move with interest rates, seasons and the
        economy. Indeed data: CC-BY-4.0, Indeed Hiring Lab.
      </p>
    </>
  );
}

/** Field-level BLS series. */
export function FieldLiveSignals({ fieldId }: { fieldId: string }) {
  const live = useLive();
  if (live.phase !== "ready") return null;
  const pts = live.summary.bls.data?.[fieldId] ?? [];
  if (!pts.length) return null;
  return (
    <>
      <h3>Live industry employment</h3>
      <ul className="signals">
        {pts.map((p) => (
          <Signal
            key={p.id}
            label={p.label}
            value={`${jobsFmt(p.latest)}  (${pct(p.change12mPct)} in 12 mo)`}
            tone={trend(p.change12mPct)}
            note={`BLS Current Employment Statistics, ${p.period}. Whole-industry, not AI-specific.`}
          />
        ))}
      </ul>
    </>
  );
}

export function JobNews({ jobId, title }: { jobId: string; title: string }) {
  const news = useNews(jobId);
  const live = useLive();
  const fallback = `https://news.google.com/search?q=${encodeURIComponent(`AI "${title}" jobs`)}`;
  const provider = live.phase === "ready" ? live.summary.newsProvider : "google-news-rss";

  if (news.phase === "loading") return <p className="muted">Loading headlines…</p>;
  if (news.phase === "offline" || news.result.status === "unavailable") {
    return (
      <p className="muted">
        Headlines unavailable right now.{" "}
        <a href={fallback} target="_blank" rel="noreferrer">
          Search news for this role ↗
        </a>
      </p>
    );
  }
  const items = news.result.data ?? [];
  return (
    <>
      {freshness(news.result) && <p className="fine">{freshness(news.result)}</p>}
      {items.length === 0 ? (
        <p className="muted">No recent headlines found for this exact title.</p>
      ) : (
        <ul className="news">
          {items.slice(0, 6).map((n) => (
            <li key={n.url}>
              <a href={n.url} target="_blank" rel="noreferrer">
                {n.title}
              </a>
              <small>
                {n.source} · {n.publishedAt ? when(n.publishedAt) : ""}
              </small>
            </li>
          ))}
        </ul>
      )}
      <p className="fine">
        Search results via {provider === "newsapi" ? "NewsAPI.org" : "Google News"}. Headlines are not verified, and some are opinion
        or speculation.
      </p>
    </>
  );
}
