import type { BlsByField, BlsPoint } from "../../src/liveTypes";
import { ALL_BLS_IDS, FIELD_BLS } from "../liveMap";

interface BlsResponse {
  status: string;
  message?: string[];
  Results?: { series: { seriesID: string; data: { year: string; period: string; value: string }[] }[] };
}

const num = (s: string) => Number(s.replace(/,/g, ""));

export async function fetchBls(): Promise<BlsByField> {
  const key = process.env.BLS_API_KEY;
  const url = key
    ? "https://api.bls.gov/publicAPI/v2/timeseries/data/"
    : "https://api.bls.gov/publicAPI/v1/timeseries/data/";
  const year = new Date().getFullYear();
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      seriesid: ALL_BLS_IDS,
      startyear: String(year - 2),
      endyear: String(year),
      ...(key ? { registrationkey: key } : {}),
    }),
    signal: AbortSignal.timeout(25_000),
  });
  if (!res.ok) throw new Error(`BLS HTTP ${res.status}`);
  const json = (await res.json()) as BlsResponse;
  if (json.status !== "REQUEST_SUCCEEDED" || !json.Results) {
    throw new Error(`BLS: ${json.message?.slice(0, 2).join("; ") || json.status}`);
  }

  const bySeries = new Map<string, Map<string, number>>();
  for (const s of json.Results.series) {
    const m = new Map<string, number>();
    for (const d of s.data) {
      if (/^M(0[1-9]|1[0-2])$/.test(d.period)) m.set(`${d.year}-${d.period.slice(1)}`, num(d.value));
    }
    bySeries.set(s.seriesID, m);
  }

  const out: BlsByField = {};
  for (const [fieldId, refs] of Object.entries(FIELD_BLS)) {
    const points: BlsPoint[] = [];
    for (const ref of refs) {
      const m = bySeries.get(ref.id);
      if (!m || !m.size) continue;
      const period = [...m.keys()].sort().at(-1)!;
      const [y, mo] = period.split("-");
      const prior = m.get(`${Number(y) - 1}-${mo}`);
      const latest = m.get(period)!;
      points.push({
        id: ref.id,
        label: ref.label,
        latest,
        period,
        change12mPct: prior ? Math.round(((latest - prior) / prior) * 1000) / 10 : null,
      });
    }
    out[fieldId] = points;
  }
  return out;
}
