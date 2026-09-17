/**
 * Situation triage — the five concrete situations (ETO.md §3.2), each mapping
 * collected facts to a dual-panel answer: curated citations from the law in
 * force and the pending bill (never merged), a computed next step, a named
 * body, and a generated letter.
 */
import bodies from "../data/bodies.json";
import status from "../data/status.json";
import { CorpusUnit, resolveCitation } from "./corpus";
import {
  addDays,
  advanceRent,
  assessNotice,
  NOTICE_TABLE,
  TenancyType,
} from "./rules";

export type SituationId =
  | "rent-increase"
  | "quit-notice"
  | "lockout"
  | "agency-fee"
  | "agent-check";

/** Areas the Law in force does not cover (s.1(3), Cap. T1). */
export const EXCLUDED_AREAS = ["Apapa", "Ikeja GRA", "Ikoyi", "Victoria Island"] as const;

export interface Facts {
  /** true when the premises are in an s.1(3) excluded area */
  excludedArea?: boolean;
  areaName?: string;
  tenancyType?: TenancyType;
  /** ISO dates */
  noticeServedOn?: string;
  statedExpiry?: string;
  /** figures */
  currentRent?: number;
  newRent?: number;
  annualRent?: number;
  feeDemanded?: number;
  monthsDemanded?: number;
  sittingTenant?: boolean;
  /** lock-out details */
  incidentDate?: string;
  incidentWhat?: string;
  userName?: string;
  landlordName?: string;
  premisesAddress?: string;
}

export interface Panel {
  heading: string;
  status: "IN_FORCE" | "PROPOSED_COMMITTEE";
  asOf: string;
  points: { text: string; ref: string; pcm?: string }[];
}

export interface NamedBody {
  id: string;
  name: string;
  role: string;
  bring: string[];
}

export interface Answer {
  situation: SituationId;
  coverageNote?: string;
  coverageNotePcm?: string;
  inForce: Panel;
  proposed: Panel;
  computed: { label: string; value: string }[];
  body: NamedBody;
  letter?: { title: string; text: string };
}

const LAW_AS_OF = status.as_of;

function cite(ref: string): CorpusUnit {
  const unit = resolveCitation(ref);
  // Fail closed: an unresolvable reference is a bug, never shipped silently.
  if (!unit) throw new Error(`unresolvable citation: ${ref}`);
  return unit;
}

function point(
  text: string,
  ref: string,
  pcm?: string,
): { text: string; ref: string; pcm?: string } {
  cite(ref);
  return { text, ref, pcm };
}

function getBody(id: string): NamedBody {
  return bodies.bodies.find((b) => b.id === id)!;
}

function coverage(facts: Facts): string | undefined {
  if (facts.excludedArea) {
    return (
      `Because the premises are in ${facts.areaName ?? "an exempted area"}, the Tenancy Law ` +
      `(Cap. T1) does not apply there — s.1(3) exempts Apapa, Ikeja GRA, Ikoyi and Victoria ` +
      `Island. Your tenancy agreement and general law govern instead. The bill (cl.2) would ` +
      `remove these exemptions and cover the whole State.`
    );
  }
  return undefined;
}

function coveragePcm(facts: Facts): string | undefined {
  if (facts.excludedArea) {
    return (
      `Because the house dey ${facts.areaName ?? "one exempted area"}, the Tenancy Law ` +
      `(Cap. T1) no cover that area — s.1(3) comot Apapa, Ikeja GRA, Ikoyi and Victoria ` +
      `Island from the law. Na your agreement and general law dey control am for there. ` +
      `The bill (cl.2) wan remove this exemption make the law cover everywhere for Lagos.`
    );
  }
  return undefined;
}

function fmtN(n: number): string {
  return `₦${n.toLocaleString("en-NG")}`;
}

const today = () => new Date().toISOString().slice(0, 10);

/* ---------------------------------------------------------------- */

export function answerRentIncrease(facts: Facts): Answer {
  const pct =
    facts.currentRent && facts.newRent
      ? Math.round(((facts.newRent - facts.currentRent) / facts.currentRent) * 100)
      : undefined;
  return {
    situation: "rent-increase",
    coverageNote: coverage(facts),
    coverageNotePcm: coveragePcm(facts),
    inForce: {
      heading: "In force today",
      status: "IN_FORCE",
      asOf: LAW_AS_OF,
      points: [
        point(
          "There is no rent cap in Lagos, but a tenant may ask the Court to declare an increase unreasonable. The Court looks at the premises, comparable rents in the area, and any improvements.",
          "s.37",
          "No rent cap for Lagos, but tenant fit go Court make dem declare say the increase too much. Court go look the house, wetin others dey pay for that area, and any repair wey landlord do.",
        ),
        point(
          "Until the Court rules, you remain a lawful tenant if you keep paying your existing rent. Refusing to pay anything is what puts you at risk.",
          "s.13",
          "Before Court talk, you still be correct tenant as long as you continue dey pay your old rent. Na to stop payment completely fit put you for wahala.",
        ),
      ],
    },
    proposed: {
      heading: "Proposed, not yet law",
      status: "PROPOSED_COMMITTEE",
      asOf: LAW_AS_OF,
      points: [
        point(
          "The bill keeps the same mechanism: apply to Court to declare an increase unreasonable. It adds no rent cap either — headlines suggesting a cap on increases are wrong.",
          "cl.33",
          "The bill still be the same arrangement: na Court go decide whether the increase make sense. E no add any rent cap — those headline wey talk say dem don cap rent increase no correct.",
        ),
      ],
    },
    computed: pct !== undefined ? [{ label: "Proposed increase", value: `${pct}%` }] : [],
    body: getBody("cmc"),
    letter: {
      title: "Response to rent increase",
      text: `${today()}

Dear ${facts.landlordName ?? "[Landlord's name]"},

RE: PROPOSED RENT INCREASE — ${facts.premisesAddress ?? "[address of premises]"}

I acknowledge your notice increasing the rent from ${
        facts.currentRent ? fmtN(facts.currentRent) : "[current rent]"
      } to ${facts.newRent ? fmtN(facts.newRent) : "[new rent]"}${
        pct !== undefined ? ` (an increase of ${pct}%)` : ""
      }.

Under section 37 of the Tenancy Law (Cap. T1, Laws of Lagos State 2015), a tenant may apply to the Court for an order declaring an increase unreasonable. I consider this increase unreasonable having regard to comparable rents in the area, and I invite you to discuss it with me, or to meet me at the Lagos State Citizens Mediation Centre, before I take that step.

I will continue to pay my current rent while this is resolved.

Yours faithfully,
${facts.userName ?? "[Your name]"}`,
    },
  };
}

export function answerQuitNotice(facts: Facts): Answer {
  const type = facts.tenancyType ?? "yearly";
  const served = facts.noticeServedOn ?? today();
  const a = assessNotice(type, served, facts.statedExpiry);
  const req = NOTICE_TABLE[type];
  const computed: { label: string; value: string }[] = [
    { label: "Notice required", value: req.label },
    { label: "Earliest lawful end of tenancy", value: a.earliestExpiry },
    { label: "Earliest date court proceedings could begin", value: a.earliestProceedings },
  ];
  if (a.stated) {
    computed.push({
      label: "The notice you received",
      value: a.stated.valid
        ? `valid on its dates (ends ${a.stated.expiry})`
        : `SHORT by ${a.stated.shortfallDays} days (ends ${a.stated.expiry}, earliest lawful is ${a.earliestExpiry})`,
    });
  }
  return {
    situation: "quit-notice",
    coverageNote: coverage(facts),
    coverageNotePcm: coveragePcm(facts),
    inForce: {
      heading: "In force today",
      status: "IN_FORCE",
      asOf: LAW_AS_OF,
      points: [
        point(
          `A ${type} tenant is entitled to ${req.label} where the agreement is silent. The tenancy type is judged by how rent is paid or demanded.`,
          "s.13",
          `For ${type} tenant, na ${req.label} you suppose get if una agreement no talk anything. Na how you dey pay rent dem take know which kind tenant you be.`,
        ),
        point(
          "After any valid notice expires, the landlord must still serve a 7-day notice of intention to go to court, then obtain a court order. Only a court can put you out.",
          "s.16",
          "Even after correct notice finish, landlord must still give you 7-day notice say e dey go court, then e go need court order. Na only court fit comot you.",
        ),
        point(
          "Forcible ejection, threats, or cutting off your premises is a criminal offence — fine up to ₦250,000 or 6 months' imprisonment.",
          "s.44",
          "To force you comot, threaten you, abi scatter your place na crime — fine fit reach ₦250,000 abi 6 months for prison.",
        ),
      ],
    },
    proposed: {
      heading: "Proposed, not yet law",
      status: "PROPOSED_COMMITTEE",
      asOf: LAW_AS_OF,
      points: [
        point(
          "The bill keeps the same notice periods for every tenancy type.",
          "cl.14",
          "The bill keep the same notice time for every kind of tenancy.",
        ),
        point(
          "It raises the penalty for self-help eviction to at least ₦1,000,000 or up to 6 months.",
          "cl.43",
          "E raise the punishment for landlord wey comot tenant by force go at least ₦1,000,000 abi up to 6 months.",
        ),
      ],
    },
    computed,
    body: getBody("cmc"),
    letter:
      a.stated && !a.stated.valid
        ? {
            title: "Reply to short notice to quit",
            text: `${today()}

Dear ${facts.landlordName ?? "[Landlord's name]"},

RE: NOTICE TO QUIT DATED ${served} — ${facts.premisesAddress ?? "[address of premises]"}

I received your notice to quit stating that my tenancy ends on ${a.stated.expiry}.

As a ${type} tenant I am entitled to ${req.label} under section 13(1) of the Tenancy Law (Cap. T1, Laws of Lagos State 2015). A notice served on ${served} cannot lawfully expire before ${a.earliestExpiry}. The notice as served is therefore short by ${a.stated.shortfallDays} days and is not valid to determine my tenancy.

I remain willing to discuss this with you, including at the Lagos State Citizens Mediation Centre. Meanwhile I will continue to observe all my obligations as tenant.

Yours faithfully,
${facts.userName ?? "[Your name]"}`,
          }
        : undefined,
  };
}

export function answerLockout(facts: Facts): Answer {
  return {
    situation: "lockout",
    coverageNote: coverage(facts),
    coverageNotePcm: coveragePcm(facts),
    inForce: {
      heading: "In force today",
      status: "IN_FORCE",
      asOf: LAW_AS_OF,
      points: [
        point(
          "Locking you out, removing doors or roofing, demolishing, threatening or molesting you to make you leave is a criminal offence — fine up to ₦250,000 or 6 months' imprisonment. Only a court order can end your possession.",
          "s.44",
          "To lock you outside, remove door abi roof, scatter the house, threaten abi harass you make you pack comot — na crime. Fine fit reach ₦250,000 abi 6 months prison. Na only court order fit end your stay.",
        ),
        point(
          "You are entitled to quiet and peaceable enjoyment of the premises, including freedom from unreasonable disturbance.",
          "s.6",
          "You get right to enjoy the house in peace — nobody suppose dey disturb you anyhow.",
        ),
      ],
    },
    proposed: {
      heading: "Proposed, not yet law",
      status: "PROPOSED_COMMITTEE",
      asOf: LAW_AS_OF,
      points: [
        point(
          "The bill raises the penalty for the same conduct to a fine of at least ₦1,000,000 or up to 6 months — but that is not the law yet.",
          "cl.43",
          "The bill raise the punishment for this same behaviour go at least ₦1,000,000 abi up to 6 months — but e never be law.",
        ),
      ],
    },
    computed: [
      { label: "Record the incident", value: facts.incidentDate ?? today() },
      { label: "Then", value: "report to the Citizens Mediation Centre — same-week, free" },
    ],
    body: getBody("cmc"),
    letter: {
      title: "Incident record — unlawful exclusion from premises",
      text: `INCIDENT RECORD — prepared ${today()}

Tenant: ${facts.userName ?? "[Your name]"}
Premises: ${facts.premisesAddress ?? "[address of premises]"}
Landlord/agent involved: ${facts.landlordName ?? "[name]"}
Date of incident: ${facts.incidentDate ?? "[date]"}

What happened:
${facts.incidentWhat ?? "[describe: locks changed / door removed / threats made — who, what, when, witnesses]"}

Relevant law: section 44(1) of the Tenancy Law (Cap. T1, Laws of Lagos State 2015) makes it an offence to forcibly eject a tenant, threaten or molest a tenant with a view to ejecting them, or wilfully damage the premises. No court order authorising recovery of possession has been shown to me.

I request that possession be restored and that this matter be mediated at the Lagos State Citizens Mediation Centre.

Signed: ______________________  Date: ${today()}`,
    },
  };
}

export function answerAgencyFee(facts: Facts): Answer {
  const feePct =
    facts.feeDemanded && facts.annualRent
      ? Math.round((facts.feeDemanded / facts.annualRent) * 100)
      : undefined;
  const overBillCap = feePct !== undefined && feePct > 5;
  return {
    situation: "agency-fee",
    coverageNote: coverage(facts),
    coverageNotePcm: coveragePcm(facts),
    inForce: {
      heading: "In force today",
      status: "IN_FORCE",
      asOf: LAW_AS_OF,
      points: [
        point(
          "Today the law only says whoever engages a professional pays their fee — there is no statutory cap on agency fees. A '10% cap' you may have read about is not in the current law.",
          "s.11",
          "For now, the law just talk say na person wey hire professional go pay am — no cap for agent fee inside the law wey dey work today. That '10% cap' wey you fit don read no dey inside am.",
        ),
        point(
          "Advance rent is capped though: a new tenant cannot lawfully be made to pay more than 1 year's rent upfront.",
          "s.4",
          "But advance rent get cap: dem no fit make new tenant pay pass 1 year rent upfront.",
        ),
      ],
    },
    proposed: {
      heading: "Proposed, not yet law",
      status: "PROPOSED_COMMITTEE",
      asOf: LAW_AS_OF,
      points: [
        point(
          "The bill caps agent commission at 5% of one year's rent, requires agents to be registered, and makes breach an offence (repayment plus up to 2 years or ₦1,000,000). Not yet in force.",
          "cl.3",
          "The bill wan cap agent commission for 5% of one year rent, make every agent register, and punish anybody wey break am (return the money plus up to 2 years abi ₦1,000,000). E never start to work.",
        ),
      ],
    },
    computed:
      feePct !== undefined
        ? [
            { label: "Fee as share of annual rent", value: `${feePct}%` },
            {
              label: "Under the bill (if passed)",
              value: overBillCap ? "would exceed the 5% cap" : "within the proposed 5% cap",
            },
          ]
        : [],
    body: getBody("lasrera"),
    letter: {
      title: "Complaint to LASRERA about an agent",
      text: `${today()}

To: LASRERA (Lagos State Real Estate Regulatory Authority)

RE: COMPLAINT AGAINST AGENT — ${facts.premisesAddress ?? "[address of premises]"}

I am ${facts.userName ?? "[your name]"}, a prospective/sitting tenant of the above premises. The agent handling the letting${
        facts.landlordName ? ` (${facts.landlordName})` : ""
      } has demanded a fee of ${facts.feeDemanded ? fmtN(facts.feeDemanded) : "[amount]"}${
        feePct !== undefined ? `, which is ${feePct}% of the annual rent of ${fmtN(facts.annualRent!)}` : ""
      }.

I ask LASRERA to confirm whether this agent is registered, and to review the fee demanded. Evidence is attached.

Yours faithfully,
${facts.userName ?? "[Your name]"}`,
    },
  };
}

export function answerAgentCheck(facts: Facts): Answer {
  return {
    situation: "agent-check",
    coverageNote: coverage(facts),
    coverageNotePcm: coveragePcm(facts),
    inForce: {
      heading: "In force today",
      status: "IN_FORCE",
      asOf: LAW_AS_OF,
      points: [
        point(
          "LASRERA registers estate agents in Lagos. Before paying anything, ask for the agent's LASRERA registration and verify it with LASRERA directly.",
          "s.11",
          "Na LASRERA dey register estate agent for Lagos. Before you pay anything, ask for the agent LASRERA registration and confirm am from LASRERA direct.",
        ),
      ],
    },
    proposed: {
      heading: "Proposed, not yet law",
      status: "PROPOSED_COMMITTEE",
      asOf: LAW_AS_OF,
      points: [
        point(
          "The bill would make registration mandatory to act as an agent at all, cap commission at 5% of a year's rent, and require receipts within 7 days.",
          "cl.3",
          "The bill go make registration compulsory before person fit do agent work at all, cap commission for 5% of one year rent, and make dem give receipt within 7 days.",
        ),
      ],
    },
    computed: [],
    body: getBody("lasrera"),
  };
}

export const SITUATIONS: {
  id: SituationId;
  label: string;
  answer: (f: Facts) => Answer;
}[] = [
  { id: "rent-increase", label: "My landlord increased my rent", answer: answerRentIncrease },
  { id: "quit-notice", label: "I was given a quit notice", answer: answerQuitNotice },
  { id: "lockout", label: "I was locked out / my door was removed", answer: answerLockout },
  { id: "agency-fee", label: "An agent is charging me a fee", answer: answerAgencyFee },
  { id: "agent-check", label: "Check if an agent is registered", answer: answerAgentCheck },
];
