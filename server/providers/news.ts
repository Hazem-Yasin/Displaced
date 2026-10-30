import type { NewsItem } from "../../src/liveTypes";

const decode = (s: string) =>
  s
    .replace(/<!\[CDATA\[(.*?)\]\]>/gs, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();

const tag = (xml: string, name: string) => {
  const m = new RegExp(`<${name}[^>]*>(.*?)</${name}>`, "s").exec(xml);
  return m ? decode(m[1]) : "";
};

export const newsProvider = (): "newsapi" | "google-news-rss" =>
  process.env.NEWS_API_KEY ? "newsapi" : "google-news-rss";

/**
 * Headlines are SEARCH RESULTS for the role, not verified claims.
 * Default: Google News RSS (no key; fine for a prototype, check its terms before production).
 * Set NEWS_API_KEY to use NewsAPI.org (its free plan is for development only).
 */
export async function fetchNews(jobTitle: string): Promise<NewsItem[]> {
  const q = `"${jobTitle}" AI jobs`;
  if (process.env.NEWS_API_KEY) {
    const u = new URL("https://newsapi.org/v2/everything");
    u.search = new URLSearchParams({ q, language: "en", sortBy: "publishedAt", pageSize: "8" }).toString();
    const res = await fetch(u, { headers: { "X-Api-Key": process.env.NEWS_API_KEY }, signal: AbortSignal.timeout(20_000) });
    if (!res.ok) throw new Error(`NewsAPI HTTP ${res.status}`);
    const j = (await res.json()) as { articles?: { title: string; url: string; publishedAt: string; source?: { name?: string } }[] };
    return (j.articles ?? []).map((a) => ({
      title: a.title,
      url: a.url,
      source: a.source?.name ?? "",
      publishedAt: a.publishedAt,
    }));
  }

  const u = new URL("https://news.google.com/rss/search");
  u.search = new URLSearchParams({ q: `${q} when:365d`, hl: "en-US", gl: "US", ceid: "US:en" }).toString();
  const res = await fetch(u, { signal: AbortSignal.timeout(20_000) });
  if (!res.ok) throw new Error(`Google News RSS HTTP ${res.status}`);
  const xml = await res.text();
  const items = [...xml.matchAll(/<item>(.*?)<\/item>/gs)].map((m) => m[1]);
  return items
    .map((it) => {
      const full = tag(it, "title");
      const source = tag(it, "source");
      const title = source && full.endsWith(` - ${source}`) ? full.slice(0, -(source.length + 3)) : full;
      const pub = tag(it, "pubDate");
      return {
        title,
        url: tag(it, "link"),
        source,
        publishedAt: pub ? new Date(pub).toISOString() : "",
      };
    })
    .filter((n) => n.title && n.url)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, 8);
}
