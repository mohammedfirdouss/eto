/**
 * Deterministic tenancy rules engine — dates and validity come from code,
 * never from a model (ETO.md §3.3). Every output carries the citation it
 * derives from; the notice table is identical in s.13(1) of the Law and
 * cl.14(1) of the Bill, so results cite both.
 */

export type TenancyType = "at-will" | "monthly" | "quarterly" | "half-yearly" | "yearly";

export interface NoticeRequirement {
  type: TenancyType;
  days?: number; // for at-will (7 days)
  months?: number; // for the rest
  label: string;
  citations: string[]; // resolvable refs, e.g. "s.13", "cl.14"
}

export const NOTICE_TABLE: Record<TenancyType, NoticeRequirement> = {
  "at-will": { type: "at-will", days: 7, label: "a week's notice", citations: ["s.13", "cl.14"] },
  monthly: { type: "monthly", months: 1, label: "one month's notice", citations: ["s.13", "cl.14"] },
  quarterly: { type: "quarterly", months: 3, label: "three months' notice", citations: ["s.13", "cl.14"] },
  "half-yearly": { type: "half-yearly", months: 3, label: "three months' notice", citations: ["s.13", "cl.14"] },
  yearly: { type: "yearly", months: 6, label: "six months' notice", citations: ["s.13", "cl.14"] },
};

/** ISO date (YYYY-MM-DD) helpers — all arithmetic in UTC, no time component. */
function parseISO(d: string): Date {
  const m = d.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) throw new Error(`invalid date: ${d}`);
  return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
}

function toISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function addDays(iso: string, days: number): string {
  const d = parseISO(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return toISO(d);
}

/** Calendar-month addition, clamping to the last day of a shorter month. */
export function addMonths(iso: string, months: number): string {
  const d = parseISO(iso);
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, lastDay));
  return toISO(d);
}

export interface NoticeAssessment {
  requirement: NoticeRequirement;
  /** Earliest date a notice served on `servedOn` may lawfully expire. */
  earliestExpiry: string;
  /** Earliest date recovery proceedings can begin: expiry + the 7-day notice
   *  of intention to apply to recover possession (Form TL4; s.16, s.24). */
  earliestProceedings: string;
  /** Present when the notice states its own expiry date. */
  stated?: {
    expiry: string;
    valid: boolean;
    shortfallDays: number;
  };
  notes: string[];
}

/**
 * Assess a notice to quit.
 * @param type       tenancy type (s.13(6)/cl.14(8): determined by how rent is
 *                   paid or demanded, absent contrary evidence)
 * @param servedOn   ISO date the notice was served/received
 * @param statedExpiry optional ISO date the notice claims the tenancy ends
 */
export function assessNotice(
  type: TenancyType,
  servedOn: string,
  statedExpiry?: string,
): NoticeAssessment {
  const req = NOTICE_TABLE[type];
  const earliestExpiry =
    req.days !== undefined ? addDays(servedOn, req.days) : addMonths(servedOn, req.months!);

  const notes: string[] = [];
  if (type === "quarterly" || type === "half-yearly" || type === "yearly") {
    notes.push(
      "The notice need not end on the anniversary of the tenancy; it may end on or after the date the current term expires (s.13(4)).",
    );
  }
  notes.push(
    "After a valid notice expires, the landlord must still serve a 7-day written notice of intention to apply to court to recover possession (Form TL4; s.16, s.24). Self-help eviction is an offence (s.44; cl.43).",
  );

  const assessment: NoticeAssessment = {
    requirement: req,
    earliestExpiry,
    earliestProceedings: addDays(earliestExpiry, 7),
    notes,
  };

  if (statedExpiry) {
    const shortfall = daysBetween(statedExpiry, earliestExpiry);
    assessment.stated = {
      expiry: statedExpiry,
      valid: shortfall <= 0,
      shortfallDays: Math.max(0, shortfall),
    };
  }
  return assessment;
}

/** Days from a to b (positive when b is after a). */
export function daysBetween(a: string, b: string): number {
  return Math.round((parseISO(b).getTime() - parseISO(a).getTime()) / 86_400_000);
}

export interface ArrearsRule {
  lapses: boolean;
  threshold: string;
  citation: string;
}

/**
 * Arrears-lapse rules — one of the sharpest law-vs-bill divergences:
 * a monthly tenancy lapses after 6 months' arrears today (s.13(2)) but would
 * lapse after only 2 months' under the bill (cl.14(2)).
 */
export function arrearsLapse(
  type: TenancyType,
  monthsInArrears: number,
): { inForce: ArrearsRule; proposed: ArrearsRule } {
  const rule = (lapses: boolean, threshold: string, citation: string): ArrearsRule => ({
    lapses,
    threshold,
    citation,
  });
  switch (type) {
    case "monthly":
      return {
        inForce: rule(monthsInArrears >= 6, "6 months' arrears", "s.13"),
        proposed: rule(monthsInArrears >= 2, "2 months' arrears", "cl.14"),
      };
    case "quarterly":
      return {
        inForce: rule(monthsInArrears >= 12, "1 year's arrears", "s.13"),
        proposed: rule(monthsInArrears >= 3, "3 months' arrears", "cl.14"),
      };
    case "half-yearly":
      return {
        inForce: rule(monthsInArrears >= 12, "1 year's arrears", "s.13"),
        proposed: rule(monthsInArrears >= 3, "3 months' arrears", "cl.14"),
      };
    case "yearly":
      return {
        inForce: rule(false, "no lapse rule for yearly tenants", "s.13"),
        proposed: rule(monthsInArrears >= 3, "3 months' default after expiry", "cl.14"),
      };
    default:
      return {
        inForce: rule(false, "no arrears-lapse rule", "s.13"),
        proposed: rule(false, "no arrears-lapse rule", "cl.14"),
      };
  }
}

export interface AdvanceRentAssessment {
  lawfulMax: string;
  unlawful: boolean;
  citation: string;
}

/**
 * Advance-rent caps. The 2011 Law ALREADY caps advance rent (s.4) — a
 * protection most coverage treats as new in the bill. The bill (cl.5)
 * tightens the sitting-monthly cap from 6 to 3 months.
 */
export function advanceRent(
  sitting: boolean,
  type: TenancyType,
  monthsDemanded: number,
): { inForce: AdvanceRentAssessment; proposed: AdvanceRentAssessment } {
  const capNowMonths = sitting ? (type === "monthly" ? 6 : 12) : 12;
  const capBillMonths = sitting ? (type === "monthly" ? 3 : 12) : 12;
  return {
    inForce: {
      lawfulMax: `${capNowMonths} months`,
      unlawful: monthsDemanded > capNowMonths,
      citation: "s.4",
    },
    proposed: {
      lawfulMax: `${capBillMonths} months`,
      unlawful: monthsDemanded > capBillMonths,
      citation: "cl.5",
    },
  };
}
