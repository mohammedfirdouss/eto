import { describe, expect, it } from "vitest";
import { allUnits, billUnits, lawUnits, resolveCitation } from "./corpus";
import { retrieve } from "./retrieval";

describe("corpus integrity", () => {
  it("holds the complete statute and bill", () => {
    expect(lawUnits).toHaveLength(49);
    expect(billUnits).toHaveLength(45);
    expect(allUnits).toHaveLength(94);
  });

  it("every unit carries status, as_of and a citation", () => {
    for (const u of allUnits) {
      expect(u.status).toMatch(/^(IN_FORCE|PROPOSED_COMMITTEE)$/);
      expect(u.asOf).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(u.citation).toContain(u.ref);
      expect(u.text.length).toBeGreaterThan(20);
    }
  });
});

describe("citation resolution (anti-hallucination guard)", () => {
  it("resolves real refs", () => {
    expect(resolveCitation("s.13")?.title).toBe("Length of Notice");
    expect(resolveCitation("cl.44")?.title).toBe("Repeal");
    expect(resolveCitation(" S. 4 ")?.title).toBe("Advance Rent");
  });

  it("fails closed on refs that do not exist", () => {
    expect(resolveCitation("s.50")).toBeUndefined();
    expect(resolveCitation("cl.46")).toBeUndefined();
    expect(resolveCitation("art.7")).toBeUndefined();
    expect(resolveCitation("")).toBeUndefined();
  });
});

describe("retrieval", () => {
  it("notice-to-quit query surfaces s.13 in the in-force panel", () => {
    const r = retrieve("how much notice to quit for a yearly tenant");
    expect(r.refused).toBe(false);
    expect(r.inForce.map((h) => h.unit.ref)).toContain("s.13");
  });

  it("agency fee query surfaces the bill's 5% cap as proposed, not in force", () => {
    const r = retrieve("agent is charging me a fee commission");
    expect(r.refused).toBe(false);
    const proposedRefs = r.proposed.map((h) => h.unit.ref);
    expect(proposedRefs).toContain("cl.3");
    // the 5% cap must never appear in the in-force panel
    for (const h of r.inForce) expect(h.unit.status).toBe("IN_FORCE");
  });

  it("advance rent query finds both the current cap (s.4) and the bill's (cl.5)", () => {
    const r = retrieve("landlord demands two years rent in advance");
    expect(r.inForce.map((h) => h.unit.ref)).toContain("s.4");
    expect(r.proposed.map((h) => h.unit.ref)).toContain("cl.5");
  });

  it("lock-out query reaches offences/possession provisions", () => {
    const r = retrieve("landlord locked me out and removed my door");
    expect(r.refused).toBe(false);
    expect([...r.inForce, ...r.proposed].length).toBeGreaterThan(0);
  });

  it("panels never mix statuses", () => {
    const r = retrieve("rent increase unreasonable");
    for (const h of r.inForce) expect(h.unit.status).toBe("IN_FORCE");
    for (const h of r.proposed) expect(h.unit.status).not.toBe("IN_FORCE");
  });

  it("refuses out-of-domain queries", () => {
    expect(retrieve("how do I renew my passport visa application").refused).toBe(true);
    expect(retrieve("best jollof rice recipe").refused).toBe(true);
    expect(retrieve("").refused).toBe(true);
  });
});
