import cors from "cors";
import express from "express";
import { JOBS } from "../src/data/dataset";
import type { LiveSummary } from "../src/liveTypes";
import { cached } from "./cache";
import { JOB_SECTOR } from "./liveMap";
import { fetchBls } from "./providers/bls";
import { fetchIndeed } from "./providers/indeed";
import { fetchNews, newsProvider } from "./providers/news";

const HOUR = 3_600_000;
const app = express();

// Comma-separated list of allowed browser origins in production, e.g. https://displaced.vercel.app
const origins = process.env.ALLOWED_ORIGINS?.split(",").map((s) => s.trim()).filter(Boolean);
app.use(cors(origins?.length ? { origin: origins } : undefined));

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    blsKey: Boolean(process.env.BLS_API_KEY),
    newsProvider: newsProvider(),
  });
});

// BLS data changes monthly; Indeed weekly. Cache accordingly.
app.get("/api/live", async (_req, res) => {
  const [bls, indeed] = await Promise.all([
    cached("bls", 12 * HOUR, fetchBls),
    cached("indeed", 24 * HOUR, fetchIndeed),
  ]);
  const body: LiveSummary = {
    bls,
    indeed,
    jobSector: JOB_SECTOR,
    newsProvider: newsProvider(),
    generatedAt: new Date().toISOString(),
  };
  res.json(body);
});

app.get("/api/news/:jobId", async (req, res) => {
  const job = JOBS.find((j) => j.id === req.params.jobId);
  if (!job) {
    res.status(404).json({ status: "unavailable", error: "Unknown job" });
    return;
  }
  res.json(await cached(`news-${newsProvider()}-${job.id}`, 2 * HOUR, () => fetchNews(job.title)));
});

const port = Number(process.env.PORT) || 8787;
app.listen(port, () => {
  console.log(`Displaced API on :${port}  (BLS key: ${process.env.BLS_API_KEY ? "yes" : "no, v1 limits"}; news: ${newsProvider()})`);
});
