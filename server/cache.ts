import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

export const CACHE_DIR = fileURLToPath(new URL("./.cache/", import.meta.url));

export type Status = "live" | "stale" | "unavailable";
export interface Result<T> {
  status: Status;
  data?: T;
  fetchedAt?: string;
  error?: string;
}

interface Entry<T> {
  value: T;
  at: number;
}

const mem = new Map<string, Entry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();
const failedAt = new Map<string, number>();
const RETRY_AFTER_FAILURE_MS = 60_000;

const file = (key: string) => `${CACHE_DIR}${key.replace(/[^a-z0-9-_]/gi, "_")}.json`;

async function load<T>(key: string): Promise<Entry<T> | undefined> {
  const hit = mem.get(key) as Entry<T> | undefined;
  if (hit) return hit;
  try {
    const e = JSON.parse(await readFile(file(key), "utf8")) as Entry<T>;
    mem.set(key, e);
    return e;
  } catch {
    return undefined;
  }
}

async function save<T>(key: string, e: Entry<T>) {
  mem.set(key, e);
  try {
    await mkdir(CACHE_DIR, { recursive: true });
    await writeFile(file(key), JSON.stringify(e));
  } catch {
    // Disk cache is best-effort; memory cache still works.
  }
}

/**
 * Fresh cache -> "live". Expired -> refetch. Refetch fails -> serve old copy as "stale".
 * No copy at all -> "unavailable". The UI shows exactly this status; nothing is faked.
 */
export async function cached<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<Result<T>> {
  const entry = await load<T>(key);
  const iso = (e: Entry<T>) => new Date(e.at).toISOString();
  if (entry && Date.now() - entry.at < ttlMs) return { status: "live", data: entry.value, fetchedAt: iso(entry) };

  const lastFail = failedAt.get(key);
  if (lastFail && Date.now() - lastFail < RETRY_AFTER_FAILURE_MS) {
    return entry
      ? { status: "stale", data: entry.value, fetchedAt: iso(entry) }
      : { status: "unavailable", error: "Upstream recently failed; retrying shortly." };
  }

  try {
    let p = inflight.get(key) as Promise<T> | undefined;
    if (!p) {
      p = fetcher().finally(() => inflight.delete(key));
      inflight.set(key, p);
    }
    const value = await p;
    const fresh = { value, at: Date.now() };
    await save(key, fresh);
    failedAt.delete(key);
    return { status: "live", data: value, fetchedAt: iso(fresh) };
  } catch (err) {
    failedAt.set(key, Date.now());
    const msg = err instanceof Error ? err.message : String(err);
    return entry
      ? { status: "stale", data: entry.value, fetchedAt: iso(entry), error: msg }
      : { status: "unavailable", error: msg };
  }
}
