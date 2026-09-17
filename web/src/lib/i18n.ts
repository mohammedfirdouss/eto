/**
 * Two languages for the answers and UI: English and Nigerian Pidgin.
 * Depth over breadth (ETO.md §7): Pidgin reaches more Lagos renters than any
 * other second language. Verbatim statute text always stays English — it is
 * the source, and translating it would break the trust chain.
 */
export type Lang = "en" | "pcm";

const STRINGS = {
  tagline: {
    en: "Know the law that actually applies to you today. Ẹ̀tọ́ (Yoruba): right, entitlement, what is due to you.",
    pcm: "Sabi the law wey dey work for you today-today. Ẹ̀tọ́ (Yoruba): your right, wetin dem suppose give you.",
  },
  bannerLead: {
    en: "The new tenancy bill is not law yet.",
    pcm: "The new tenancy bill never turn law o.",
  },
  bannerRest: {
    en: "It is at committee stage (verified {date}). What applies today is the Tenancy Law, Cap. T1, Laws of Lagos State 2015.",
    pcm: "E still dey committee for House of Assembly (we check am {date}). Na the Tenancy Law, Cap. T1, Laws of Lagos State 2015 still dey rule tenant matter today.",
  },
  whatHappening: { en: "What is happening to you?", pcm: "Wetin dey happen to you?" },
  inForceHeading: { en: "In force today", pcm: "Wetin be law today" },
  proposedHeading: { en: "Proposed, not yet law", pcm: "Wetin dem propose — e never be law" },
  inForceChip: { en: "Law · In Force", pcm: "Law · E Dey Work" },
  proposedChip: { en: "Bill · Not Law Yet", pcm: "Bill · No Be Law Yet" },
  yourDates: { en: "Your dates and figures", pcm: "Your date and your money matter" },
  whereToGo: { en: "Where to go", pcm: "Where you go carry am go" },
  bring: { en: "Bring:", pcm: "Carry these ones follow body:" },
  downloadLetter: { en: "Download this letter (.txt)", pcm: "Download this letter (.txt)" },
  back: { en: "← back", pcm: "← go back" },
  startOver: { en: "← start over", pcm: "← start again" },
  showMe: { en: "Show me the law and my next step", pcm: "Show me the law and wetin I go do" },
  ask: { en: "Ask", pcm: "Ask" },
  askPlaceholder: {
    en: "…or describe your situation in your own words",
    pcm: "…abi talk your own matter as e dey do you",
  },
  refusalLead: {
    en: "We can’t answer that from the law we hold.",
    pcm: "We no fit answer that one from the law wey we hold.",
  },
  refusalRest: {
    en: "This tool only covers Lagos tenancy law. For anything else — or if this is urgent — go to the Lagos State Citizens Mediation Centre, which is free, or speak to a lawyer.",
    pcm: "Na only Lagos tenant matter this tool sabi. For any other thing — or if the matter dey hot — go Lagos State Citizens Mediation Centre (e free), abi see lawyer.",
  },
  disclaimer: {
    en: "Informational only — not legal advice. Every statement links to the section of the law or bill it comes from. Where we cannot cite, we say so and point you to the Lagos State Citizens Mediation Centre or a lawyer. Nothing you type here leaves your device.",
    pcm: "Na information be this — no be legal advice. Every talk get the section of law or bill wey e come from. If we no fit show you the section, we go talk true say we no know, and we go point you go Citizens Mediation Centre abi lawyer. Anything wey you type here no dey leave your phone.",
  },
  letterNote: {
    en: "Review this draft, adapt it, and send it yourself. It is not legal advice.",
    pcm: "Check this draft well, change wetin you wan change, then send am yourself. No be legal advice.",
  },
  gapSince: {
    en: "days since the bill passed second reading. Still not law.",
    pcm: "days don pass since the bill cross second reading. E never still turn law.",
  },
  mythsHeading: {
    en: "Wetin dem talk vs wetin the law talk",
    pcm: "Wetin dem talk vs wetin the law talk",
  },
  heardLabel: { en: "You may have heard", pcm: "Dem talk say" },
  factLabel: { en: "The law actually says", pcm: "Wetin the law talk" },
  checkSection: { en: "Check the section:", pcm: "Check the section:" },
  todaysCheck: { en: "Today’s check", pcm: "Today check" },
  changesHeading: { en: "If the bill passes, what changes?", pcm: "If the bill pass, wetin go change?" },
  lawColumn: { en: "Law today", pcm: "Law today" },
  billColumn: { en: "Under the bill", pcm: "Under the bill" },
  inForceStamp: { en: "In Force", pcm: "E Dey Work" },
  notLawStamp: { en: "Not Law Yet", pcm: "No Be Law Yet" },
  situationLabels: {
    en: {
      "rent-increase": "My landlord increased my rent",
      "quit-notice": "I was given a quit notice",
      lockout: "I was locked out / my door was removed",
      "agency-fee": "An agent is charging me a fee",
      "agent-check": "Check if an agent is registered",
    },
    pcm: {
      "rent-increase": "My landlord don increase my rent",
      "quit-notice": "Dem give me quit notice",
      lockout: "Dem lock me outside / dem remove my door",
      "agency-fee": "Agent dey charge me fee",
      "agent-check": "Check whether agent dey registered",
    },
  },
} as const;

type StringKey = Exclude<keyof typeof STRINGS, "situationLabels">;

export function t(key: StringKey, lang: Lang): string {
  return STRINGS[key][lang];
}

export function situationLabel(id: string, lang: Lang): string {
  const labels = STRINGS.situationLabels[lang] as Record<string, string>;
  return labels[id] ?? id;
}
