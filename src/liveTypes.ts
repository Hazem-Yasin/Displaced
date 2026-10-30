/** Shapes shared by the API server and the frontend. */

export type LiveStatus = "live" | "stale" | "unavailable";

export interface Live<T> {
  status: LiveStatus;
  data?: T;
  /** ISO time the data was last fetched from its source. */
  fetchedAt?: string;
  error?: string;
}

export interface BlsPoint {
  id: string;
  label: string;
  /** Employment, thousands of jobs (BLS CES, seasonally adjusted). */
  latest: number;
  /** e.g. "2025-12" */
  period: string;
  /** Change over the last 12 months, percent. */
  change12mPct: number | null;
}
/** fieldId -> industry series that proxy for it. Empty when BLS has no such series. */
export type BlsByField = Record<string, BlsPoint[]>;

export interface IndeedPoint {
  /** Index vs Feb 1 2020 (= 100). */
  latest: number;
  date: string;
  /** Percent change of the index vs ~12 months before `date`. */
  yoyPct: number | null;
}
/** Indeed sector display name -> postings trend. */
export type IndeedBySector = Record<string, IndeedPoint>;

export interface NewsItem {
  title: string;
  url: string;
  source: string;
  publishedAt: string;
}

export interface LiveSummary {
  bls: Live<BlsByField>;
  indeed: Live<IndeedBySector>;
  /** job id -> Indeed sector name (so the client does not duplicate the mapping). */
  jobSector: Record<string, string>;
  newsProvider: "newsapi" | "google-news-rss";
  generatedAt: string;
}
