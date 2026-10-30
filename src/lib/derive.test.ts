import { describe, expect, it } from "vitest";
import { FIELDS, JOBS, SKILLS, fieldById, jobById, skillById } from "../data/dataset";
import { HUMAN, MILITARY } from "../data/layers";
import { JOB_EVIDENCE, SKILL_EVIDENCE, SOURCES, sourceById } from "../data/sources";
import { connectedFieldIds, connectedJobIds, connectedSkillIds, fieldStats, riskLabel, searchJobs } from "./derive";

describe("searchJobs", () => {
  it("returns nothing for empty or whitespace queries", () => {
    expect(searchJobs("")).toEqual([]);
    expect(searchJobs("   ")).toEqual([]);
  });

  it("finds an exact title first", () => {
    expect(searchJobs("paralegal")[0]?.id).toBe("paralegal");
  });

  it("matches aliases", () => {
    expect(searchJobs("electronic warfare")[0]?.id).toBe("ew-officer");
  });

  it("is case and punctuation insensitive", () => {
    expect(searchJobs("  PARALEGAL!! ")[0]?.id).toBe("paralegal");
  });

  it("respects the limit", () => {
    expect(searchJobs("engineer", 2).length).toBeLessThanOrEqual(2);
  });

  it("returns nothing for gibberish", () => {
    expect(searchJobs("zzzqqq")).toEqual([]);
  });
});

describe("connections", () => {
  it("returns null when nothing is selected", () => {
    expect(connectedJobIds(null)).toBeNull();
    expect(connectedFieldIds(null)).toBeNull();
    expect(connectedSkillIds(null)).toBeNull();
  });

  it("a selected job connects to exactly its own skills and field", () => {
    const job = jobById("paralegal")!;
    const sel = { type: "job" as const, id: job.id };
    expect([...connectedSkillIds(sel)!].sort()).toEqual([...job.skillIds].sort());
    expect([...connectedFieldIds(sel)!]).toEqual([job.fieldId]);
  });

  it("a selected skill connects to every job that lists it", () => {
    const sel = { type: "skill" as const, id: "accountability" };
    const expected = JOBS.filter((j) => j.skillIds.includes("accountability")).map((j) => j.id);
    expect([...connectedJobIds(sel)!].sort()).toEqual(expected.sort());
    expect(connectedSkillIds(sel)).toEqual(new Set(["accountability"]));
  });

  it("a selected field connects to all of its jobs", () => {
    const sel = { type: "field" as const, id: "military" };
    expect(connectedJobIds(sel)!.size).toBe(JOBS.filter((j) => j.fieldId === "military").length);
  });
});

describe("derived stats", () => {
  it("field risk stays within 0-100", () => {
    for (const f of FIELDS) {
      const s = fieldStats(f.id);
      expect(s.risk).toBeGreaterThanOrEqual(0);
      expect(s.risk).toBeLessThanOrEqual(100);
    }
  });

  it("labels risk bands", () => {
    expect(riskLabel(10)).toBe("Low");
    expect(riskLabel(30)).toBe("Moderate");
    expect(riskLabel(60)).toBe("High");
    expect(riskLabel(90)).toBe("Severe");
  });
});

describe("dataset integrity", () => {
  it("has unique ids", () => {
    for (const list of [FIELDS, JOBS, SKILLS]) {
      const ids = list.map((x) => x.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it("every job points at a real field and real skills", () => {
    for (const j of JOBS) {
      expect(fieldById(j.fieldId), j.id).toBeDefined();
      for (const s of j.skillIds) expect(skillById(s), `${j.id} -> ${s}`).toBeDefined();
    }
  });

  it("scores are within 0-100", () => {
    for (const j of JOBS) {
      expect(j.risk).toBeGreaterThanOrEqual(0);
      expect(j.risk).toBeLessThanOrEqual(100);
      expect(j.velocity).toBeLessThanOrEqual(100);
    }
    for (const s of SKILLS) {
      expect(s.automatability).toBeGreaterThanOrEqual(0);
      expect(s.automatability).toBeLessThanOrEqual(100);
    }
  });
});

describe("evidence integrity", () => {
  it("every evidence reference points to a real source and a real job or skill", () => {
    for (const [id, refs] of Object.entries(SKILL_EVIDENCE)) {
      expect(skillById(id), `skill ${id}`).toBeDefined();
      for (const r of refs) expect(sourceById(r.sourceId), `${id} -> ${r.sourceId}`).toBeDefined();
    }
    for (const [id, refs] of Object.entries(JOB_EVIDENCE)) {
      expect(jobById(id), `job ${id}`).toBeDefined();
      for (const r of refs) expect(sourceById(r.sourceId), `${id} -> ${r.sourceId}`).toBeDefined();
    }
  });

  it("every source has a finding, a stated limit and an https link", () => {
    for (const s of SOURCES) {
      expect(s.finding.length, s.id).toBeGreaterThan(20);
      expect(s.caveat.length, s.id).toBeGreaterThan(20);
      expect(s.url, s.id).toMatch(/^https:\/\//);
    }
  });

  it("source ids are unique", () => {
    expect(new Set(SOURCES.map((s) => s.id)).size).toBe(SOURCES.length);
  });
});

describe("dedicated layers", () => {
  it("cites only sources that exist", () => {
    for (const r of MILITARY.reasons) for (const id of r.sourceIds ?? []) expect(sourceById(id), id).toBeDefined();
  });

  it("evidence-labelled reasons actually cite a source", () => {
    for (const r of MILITARY.reasons) if (r.kind === "evidence") expect(r.sourceIds?.length, r.title).toBeGreaterThan(0);
  });

  it("has a role note for every military job", () => {
    for (const j of JOBS.filter((x) => x.fieldId === "military")) expect(MILITARY.roleNotes[j.id], j.id).toBeTruthy();
  });

  it("every human skill case has an objection and a way to be wrong", () => {
    expect(HUMAN.cases.length).toBe(5);
    for (const c of HUMAN.cases) {
      expect(skillById(c.skillId)?.whyResistant, c.skillId).toBeTruthy();
      expect(c.counter.length, c.skillId).toBeGreaterThan(20);
      expect(c.breaks.length, c.skillId).toBeGreaterThan(20);
    }
  });
});
