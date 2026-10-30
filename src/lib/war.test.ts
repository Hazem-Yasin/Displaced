import { describe, expect, it } from "vitest";
import { FIELDS, JOBS } from "../data/dataset";
import { ORIGIN_ID, SEEDS, cityPositions, occupancy, route, routeAt, warFields, warStats } from "./war";

describe("war map", () => {
  it("every field has a seed and the origin exists", () => {
    for (const f of FIELDS) expect(SEEDS[f.id]).toBeDefined();
    expect(FIELDS.some((f) => f.id === ORIGIN_ID)).toBe(true);
  });

  it("origin arrives first and everything is reached by the end", () => {
    const fs = warFields();
    expect(fs.find((f) => f.origin)?.arrival).toBe(0);
    for (const f of fs) {
      expect(f.arrival).toBeGreaterThanOrEqual(0);
      expect(f.arrival).toBeLessThanOrEqual(90);
    }
    expect(warStats(100).reached).toBe(fs.length);
    expect(warStats(0).reached).toBe(1);
  });

  it("faster fields are reached sooner", () => {
    const fs = warFields().filter((f) => !f.origin);
    const fastest = fs.reduce((a, b) => (b.velocity > a.velocity ? b : a));
    const slowest = fs.reduce((a, b) => (b.velocity < a.velocity ? b : a));
    expect(fastest.arrival).toBeLessThan(slowest.arrival);
  });

  it("occupancy is clamped and exposed workers only grow as the front advances", () => {
    expect(occupancy(-5, 20)).toBe(0);
    expect(occupancy(500, 20)).toBe(1);
    let prev = -1;
    for (let a = 0; a <= 100; a += 10) {
      const k = warStats(a).exposedReachedK;
      expect(k).toBeGreaterThanOrEqual(prev);
      prev = k;
    }
    expect(warStats(100).exposedReachedK).toBe(warStats(100).exposedTotalK);
  });

  it("places each role exactly once", () => {
    const n = FIELDS.reduce((a, f) => a + cityPositions(f.id).length, 0);
    expect(n).toBe(JOBS.length);
  });

  it("route sub-curve starts at p0 and ends at p2 when complete", () => {
    const r = route([0, 0], [100, 0], 10, 10);
    const full = routeAt(r, 1);
    expect(full.tip[0]).toBeCloseTo(r.p2[0], 5);
    expect(full.tip[1]).toBeCloseTo(r.p2[1], 5);
    expect(routeAt(r, 0).tip[0]).toBeCloseTo(r.p0[0], 5);
  });
});
