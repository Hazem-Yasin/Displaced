import type { IndeedBySector } from "../../src/liveTypes";

const URL_SECTOR = "https://raw.githubusercontent.com/hiring-lab/job_postings_tracker/master/US/job_postings_by_sector_US.csv";
const CHUNK = 1_500_000;

/** The file is ~12MB and the host drops long connections, so fetch it in ranged chunks with retries. */
async function fetchChunked(url: string): Promise<Buffer> {
  const parts: Buffer[] = [];
  let start = 0;
  let total = Infinity;
  while (start < total) {
    const end = start + CHUNK - 1;
    let lastErr: unknown;
    let ok = false;
    for (let attempt = 0; attempt < 4 && !ok; attempt++) {
      try {
        const res = await fetch(url, { headers: { Range: `bytes=${start}-${end}` }, signal: AbortSignal.timeout(40_000) });
        if (res.status !== 206 && res.status !== 200) throw new Error(`HTTP ${res.status}`);
        const buf = Buffer.from(await res.arrayBuffer());
        if (res.status === 200) {
          // Server ignored Range: whole file arrived at once.
          return buf;
        }
        const m = /\/(\d+)$/.exec(res.headers.get("content-range") ?? "");
        if (m) total = Number(m[1]);
        parts.push(buf);
        start += buf.length;
        ok = true;
      } catch (e) {
        lastErr = e;
        await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
      }
    }
    if (!ok) throw new Error(`Indeed data download failed at byte ${start}: ${lastErr instanceof Error ? lastErr.message : lastErr}`);
  }
  return Buffer.concat(parts);
}

const daysBefore = (iso: string, days: number) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
};

/** Indeed Hiring Lab, CC-BY-4.0. Attribution is shown in the UI. */
export async function fetchIndeed(): Promise<IndeedBySector> {
  const text = (await fetchChunked(URL_SECTOR)).toString("utf8");
  const rows: { date: string; value: number; sector: string }[] = [];
  let maxDate = "";
  for (const line of text.split("\n")) {
    // date,country,index,variable,display_name  (display_name may be quoted and contain commas)
    const parts = line.split(",");
    if (parts.length < 5 || parts[3] !== "total postings") continue;
    const value = Number(parts[2]);
    if (!Number.isFinite(value)) continue;
    const sector = parts.slice(4).join(",").replace(/^"|"$/g, "").replace(/\r$/, "").replace(/"$/, "");
    rows.push({ date: parts[0], value, sector });
    if (parts[0] > maxDate) maxDate = parts[0];
  }
  if (!rows.length) throw new Error("Indeed data parsed to zero rows");

  const target = daysBefore(maxDate, 364);
  const latest = new Map<string, { date: string; value: number }>();
  const year = new Map<string, { date: string; value: number }>();
  for (const r of rows) {
    const l = latest.get(r.sector);
    if (!l || r.date > l.date) latest.set(r.sector, { date: r.date, value: r.value });
    // closest observation at or before the target date
    if (r.date <= target) {
      const y = year.get(r.sector);
      if (!y || r.date > y.date) year.set(r.sector, { date: r.date, value: r.value });
    }
  }
  const out: IndeedBySector = {};
  for (const [sector, l] of latest) {
    const y = year.get(sector);
    out[sector] = {
      latest: Math.round(l.value * 10) / 10,
      date: l.date,
      yoyPct: y ? Math.round(((l.value - y.value) / y.value) * 1000) / 10 : null,
    };
  }
  return out;
}
