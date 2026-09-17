import { describe, expect, it } from "vitest";
import { resolveCitation } from "./corpus";
import { answerQuitNotice, Facts, SITUATIONS } from "./situations";

const SAMPLE: Facts = {
  tenancyType: "yearly",
  noticeServedOn: "2026-09-01",
  statedExpiry: "2026-10-01",
  currentRent: 1_000_000,
  newRent: 1_800_000,
  annualRent: 1_000_000,
  feeDemanded: 100_000,
  monthsDemanded: 24,
  sittingTenant: false,
  incidentDate: "2026-09-10",
  userName: "Test Tenant",
  landlordName: "Test Landlord",
  premisesAddress: "1 Test Street, Surulere",
};

describe("situations", () => {
  it("every situation produces clean dual panels with resolvable citations", () => {
    for (const s of SITUATIONS) {
      const a = s.answer(SAMPLE);
      expect(a.inForce.status).toBe("IN_FORCE");
      expect(a.proposed.status).toBe("PROPOSED_COMMITTEE");
      expect(a.inForce.points.length).toBeGreaterThan(0);
      expect(a.proposed.points.length).toBeGreaterThan(0);
      for (const p of [...a.inForce.points, ...a.proposed.points]) {
        const unit = resolveCitation(p.ref);
        expect(unit, `${s.id}: ${p.ref}`).toBeDefined();
        // in-force panel cites only the statute, proposed only the bill
        const isLaw = p.ref.startsWith("s.");
        const inLawPanel = a.inForce.points.includes(p);
        expect(isLaw).toBe(inLawPanel);
      }
      expect(a.body.name.length).toBeGreaterThan(0);
      expect(a.inForce.asOf).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("short quit notice: computed shortfall appears in answer and letter", () => {
    const a = answerQuitNotice(SAMPLE);
    // yearly, served 2026-09-01 → earliest lawful expiry 2027-03-01
    expect(a.computed.find((c) => c.label.includes("Earliest lawful"))?.value).toBe("2027-03-01");
    const stated = a.computed.find((c) => c.label.includes("notice you received"));
    expect(stated?.value).toContain("SHORT");
    expect(a.letter).toBeDefined();
    expect(a.letter!.text).toContain("2027-03-01");
    expect(a.letter!.text).toContain("Test Tenant");
    expect(a.letter!.text).toContain("not legal advice");
  });

  it("valid quit notice generates no dispute letter", () => {
    const a = answerQuitNotice({ ...SAMPLE, statedExpiry: "2027-04-01" });
    expect(a.letter).toBeUndefined();
  });

  it("excluded area adds a coverage note", () => {
    const a = answerQuitNotice({ ...SAMPLE, excludedArea: true, areaName: "Ikoyi" });
    expect(a.coverageNote).toContain("Ikoyi");
    expect(a.coverageNote).toContain("s.1(3)");
  });

  it("every point carries a Pidgin variant", () => {
    for (const s of SITUATIONS) {
      const a = s.answer(SAMPLE);
      for (const p of [...a.inForce.points, ...a.proposed.points]) {
        expect(p.pcm, `${s.id}: ${p.ref}`).toBeTruthy();
      }
    }
    const excluded = answerQuitNotice({ ...SAMPLE, excludedArea: true, areaName: "Ikoyi" });
    expect(excluded.coverageNotePcm).toContain("Ikoyi");
  });

  it("agency fee over 5% is flagged against the bill only", () => {
    const a = SITUATIONS.find((s) => s.id === "agency-fee")!.answer(SAMPLE);
    expect(a.computed.find((c) => c.label.includes("share"))?.value).toBe("10%");
    expect(a.computed.find((c) => c.label.includes("bill"))?.value).toContain("exceed");
  });
});
