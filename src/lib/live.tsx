import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Live, LiveSummary, NewsItem } from "../liveTypes";

const BASE: string = (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/$/, "") ?? "";

export type LiveState =
  | { phase: "loading" }
  | { phase: "offline"; error: string }
  | { phase: "ready"; summary: LiveSummary };

const LiveContext = createContext<LiveState>({ phase: "loading" });
export const useLive = () => useContext(LiveContext);

export function LiveProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LiveState>({ phase: "loading" });

  useEffect(() => {
    const ac = new AbortController();
    fetch(`${BASE}/api/live`, { signal: ac.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<LiveSummary>;
      })
      .then((summary) => setState({ phase: "ready", summary }))
      .catch((e: unknown) => {
        if (ac.signal.aborted) return;
        setState({ phase: "offline", error: e instanceof Error ? e.message : "Unreachable" });
      });
    return () => ac.abort();
  }, []);

  return <LiveContext.Provider value={state}>{children}</LiveContext.Provider>;
}

export type NewsState = { phase: "loading" } | { phase: "done"; result: Live<NewsItem[]> } | { phase: "offline" };

export function useNews(jobId: string): NewsState {
  const [state, setState] = useState<NewsState>({ phase: "loading" });
  useEffect(() => {
    const ac = new AbortController();
    setState({ phase: "loading" });
    fetch(`${BASE}/api/news/${encodeURIComponent(jobId)}`, { signal: ac.signal })
      .then((r) => r.json() as Promise<Live<NewsItem[]>>)
      .then((result) => setState({ phase: "done", result }))
      .catch(() => {
        if (!ac.signal.aborted) setState({ phase: "offline" });
      });
    return () => ac.abort();
  }, [jobId]);
  return state;
}
