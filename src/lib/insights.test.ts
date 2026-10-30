import { describe, expect, it } from "vitest";
import { FIELDS, JOBS } from "../data/dataset";
import { bandBreakdown, coverage, fieldRiskRows, treemapData } from "./insights";

describe("insights", () => {
  it("band shares add up to 100% and cover every job", () => {
    const bands = bandBreakdown();
    expect(bands.reduce((a, b) => a + b.share, 0)).toBeCloseTo(1, 5);
    expect(bands.reduce((a, b) => a + b.jobs, 0)).toBe(JOBS.length);
  });

  it("coverage values are sane", () => {
    const c = coverage();
    expect(c.jobs).toBe(JOBS.length);
    expect(c.avgRisk).toBeGreaterThanOrEqual(0);
    expect(c.avgRisk).toBeLessThanOrEqual(100);
    expect(c.highPlusShare).toBeGreaterThanOrEqual(0);
    expect(c.highPlusShare).toBeLessThanOrEqual(1);
    expect(c.augmentingShare).toBeLessThan(0.5);
  });

  it("field rows are sorted by risk, highest first", () => {
    const rows = fieldRiskRows();
    expect(rows.length).toBe(FIELDS.length);
    for (let i = 1; i < rows.length; i++) expect(rows[i - 1].risk).toBeGreaterThanOrEqual(rows[i].risk);
  });

  it("treemap contains each job exactly once", () => {
    const ids = treemapData().children.flatMap((f) => f.children.map((j) => j.id));
    expect(ids.length).toBe(JOBS.length);
    expect(new Set(ids).size).toBe(JOBS.length);
  });
});
