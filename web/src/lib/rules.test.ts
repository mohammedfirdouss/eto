import { describe, expect, it } from "vitest";
import { resolveCitation } from "./corpus";
import {
  addDays,
  addMonths,
  advanceRent,
  arrearsLapse,
  assessNotice,
  daysBetween,
  NOTICE_TABLE,
} from "./rules";

describe("date arithmetic", () => {
  it("adds days across month and year boundaries", () => {
    expect(addDays("2026-09-28", 7)).toBe("2026-10-05");
    expect(addDays("2026-12-30", 7)).toBe("2027-01-06");
  });

  it("adds calendar months, clamping short months", () => {
    expect(addMonths("2026-09-17", 1)).toBe("2026-10-17");
    expect(addMonths("2026-08-31", 1)).toBe("2026-09-30");
    expect(addMonths("2026-01-31", 1)).toBe("2026-02-28");
    expect(addMonths("2024-01-31", 1)).toBe("2024-02-29"); // leap year
    expect(addMonths("2026-09-17", 6)).toBe("2027-03-17");
  });

  it("computes signed day differences", () => {
    expect(daysBetween("2026-09-01", "2026-09-17")).toBe(16);
    expect(daysBetween("2026-09-17", "2026-09-01")).toBe(-16);
  });
});

describe("notice assessment (s.13 / cl.14)", () => {
  it("yearly tenant: six months' notice", () => {
    const a = assessNotice("yearly", "2026-09-17");
    expect(a.requirement.months).toBe(6);
    expect(a.earliestExpiry).toBe("2027-03-17");
    expect(a.earliestProceedings).toBe("2027-03-24"); // + 7-day Form TL4
  });

  it("monthly tenant: one month's notice", () => {
    const a = assessNotice("monthly", "2026-09-17");
    expect(a.earliestExpiry).toBe("2026-10-17");
  });

  it("tenant at will: a week's notice", () => {
    const a = assessNotice("at-will", "2026-09-17");
    expect(a.earliestExpiry).toBe("2026-09-24");
  });

  it("flags a short notice with the shortfall in days", () => {
    // landlord gives a yearly tenant one month to leave
    const a = assessNotice("yearly", "2026-09-17", "2026-10-17");
    expect(a.stated?.valid).toBe(false);
    expect(a.stated?.shortfallDays).toBe(151); // 2026-10-17 → 2027-03-17
  });

  it("accepts a notice that is exactly right or generous", () => {
    expect(assessNotice("yearly", "2026-09-17", "2027-03-17").stated?.valid).toBe(true);
    expect(assessNotice("monthly", "2026-09-17", "2026-12-01").stated?.valid).toBe(true);
  });

  it("every citation in the notice table resolves against the corpus", () => {
    for (const req of Object.values(NOTICE_TABLE)) {
      for (const ref of req.citations) {
        expect(resolveCitation(ref), ref).toBeDefined();
      }
    }
  });
});

describe("arrears lapse — law vs bill divergence", () => {
  it("monthly tenant 3 months in arrears: no lapse today, lapses under the bill", () => {
    const r = arrearsLapse("monthly", 3);
    expect(r.inForce.lapses).toBe(false); // s.13(2): 6 months
    expect(r.proposed.lapses).toBe(true); // cl.14(2): 2 months
  });

  it("monthly tenant 6 months in arrears lapses under both", () => {
    const r = arrearsLapse("monthly", 6);
    expect(r.inForce.lapses).toBe(true);
    expect(r.proposed.lapses).toBe(true);
  });

  it("citations resolve", () => {
    const r = arrearsLapse("monthly", 3);
    expect(resolveCitation(r.inForce.citation)).toBeDefined();
    expect(resolveCitation(r.proposed.citation)).toBeDefined();
  });
});

describe("advance rent caps (s.4 / cl.5)", () => {
  it("sitting monthly tenant asked for 4 months: lawful today, unlawful under bill", () => {
    const r = advanceRent(true, "monthly", 4);
    expect(r.inForce.unlawful).toBe(false); // s.4(1): 6-month cap
    expect(r.proposed.unlawful).toBe(true); // cl.5(1): 3-month cap
  });

  it("new tenant asked for 2 years: unlawful under both", () => {
    const r = advanceRent(false, "yearly", 24);
    expect(r.inForce.unlawful).toBe(true);
    expect(r.proposed.unlawful).toBe(true);
  });

  it("new tenant asked for 1 year: lawful under both", () => {
    const r = advanceRent(false, "yearly", 12);
    expect(r.inForce.unlawful).toBe(false);
    expect(r.proposed.unlawful).toBe(false);
  });
});
