/**
 * Case-file export: one document a user can hand to the Citizens Mediation
 * Centre (or a lawyer) — their facts, the computed dates, and every cited
 * section from both panels. This is the "engage the public service" artifact:
 * the mediator starts from a dated, sourced summary instead of a story.
 */
import { jurisdiction } from "./corpus";
import { Lang } from "./i18n";
import { Answer, Facts } from "./situations";

const LABELS = {
  en: {
    title: "CASE FILE",
    prepared: "Prepared with Ẹ̀tọ́ (eto) — informational only, not legal advice",
    facts: "THE FACTS",
    dates: "COMPUTED DATES AND FIGURES",
    inForce: "LAW IN FORCE TODAY",
    proposed: "PROPOSED IN THE PENDING BILL (NOT LAW)",
    nextStep: "WHERE THIS FILE IS GOING",
    bring: "Documents to attach",
  },
  pcm: {
    title: "CASE FILE",
    prepared: "Ẹ̀tọ́ (eto) prepare am — na information, no be legal advice",
    facts: "WETIN HAPPEN",
    dates: "DATE AND MONEY MATTER (CALCULATED)",
    inForce: "LAW WEY DEY WORK TODAY",
    proposed: "WETIN THE BILL PROPOSE (E NEVER BE LAW)",
    nextStep: "WHERE THIS FILE DEY GO",
    bring: "Documents wey you go attach",
  },
} as const;

function factLines(facts: Facts): string[] {
  const rows: [string, string | number | boolean | undefined][] = [
    ["Name", facts.userName],
    ["Premises", facts.premisesAddress],
    ["Area", facts.excludedArea ? `${facts.areaName} (outside Cap. T1 coverage, s.1(3))` : facts.areaName],
    ["Tenancy type", facts.tenancyType],
    ["Landlord/agent", facts.landlordName],
    ["Notice received on", facts.noticeServedOn],
    ["Notice says leave by", facts.statedExpiry],
    ["Current yearly rent", facts.currentRent],
    ["New rent demanded", facts.newRent],
    ["Annual rent", facts.annualRent],
    ["Fee demanded", facts.feeDemanded],
    ["Incident date", facts.incidentDate],
    ["What happened", facts.incidentWhat],
  ];
  return rows.filter(([, v]) => v !== undefined && v !== "").map(([k, v]) => `  ${k}: ${v}`);
}

export function buildCaseFile(answer: Answer, facts: Facts, lang: Lang, date: string): string {
  const L = LABELS[lang];
  const parts: string[] = [
    `${L.title} — ${answer.situation.toUpperCase()} — ${date}`,
    L.prepared,
    "",
    L.facts,
    ...factLines(facts),
    "",
  ];
  if (answer.computed.length > 0) {
    parts.push(L.dates);
    for (const c of answer.computed) parts.push(`  ${c.label}: ${c.value}`);
    parts.push("");
  }
  parts.push(`${L.inForce} — ${jurisdiction.law_citation}`);
  for (const p of answer.inForce.points) {
    parts.push(`  [${p.ref}] ${lang === "pcm" && p.pcm ? p.pcm : p.text}`);
  }
  parts.push("", `${L.proposed} — ${jurisdiction.bill_citation}`);
  for (const p of answer.proposed.points) {
    parts.push(`  [${p.ref}] ${lang === "pcm" && p.pcm ? p.pcm : p.text}`);
  }
  if (answer.coverageNote) {
    parts.push("", `  NOTE: ${lang === "pcm" && answer.coverageNotePcm ? answer.coverageNotePcm : answer.coverageNote}`);
  }
  parts.push("", `${L.nextStep}: ${answer.body.name}`, `  ${answer.body.role}`, "", `  ${L.bring}:`);
  for (const b of answer.body.bring) parts.push(`   - ${b}`);
  if (answer.altBody) {
    parts.push("", `  ${answer.altBody.name}`, `  ${answer.altBody.role}`);
  }
  parts.push("", `Status verified ${answer.inForce.asOf} · ${L.prepared}`, "");
  return parts.join("\n");
}
