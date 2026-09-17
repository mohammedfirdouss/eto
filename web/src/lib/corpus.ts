/**
 * Corpus loader for the Lagos jurisdiction pack.
 *
 * The canonical corpus lives in /corpus/lagos-ng (versioned, hashed — see
 * PROVENANCE.md). `npm run sync-corpus` copies the JSON into src/data; this
 * module flattens both documents into uniform retrieval units.
 */
import law from "../data/tenancy-law-2011.json";
import bill from "../data/tenancy-bill-2025.json";
import status from "../data/status.json";
import pack from "../data/pack.json";

export type DocStatus = "IN_FORCE" | "PROPOSED_COMMITTEE" | "PASSED_AWAITING_ASSENT";

export interface CorpusUnit {
  /** stable id, e.g. "law-s13", "bill-c5" */
  id: string;
  docId: string;
  docTitle: string;
  /** human citation, e.g. "s.13, Tenancy Law, Cap. T1, Laws of Lagos State 2015" */
  citation: string;
  /** short ref, e.g. "s.13" | "cl.5" */
  ref: string;
  title: string;
  text: string;
  status: DocStatus;
  asOf: string;
}

const LAW_CITE = pack.law_citation;
const BILL_CITE = pack.bill_citation;

export const lawUnits: CorpusUnit[] = law.sections.map((s) => ({
  id: `law-s${s.section}`,
  docId: law.id,
  docTitle: law.title,
  citation: `s.${s.section} (${s.title}), ${LAW_CITE}`,
  ref: `s.${s.section}`,
  title: s.title,
  text: s.text,
  status: law.status as DocStatus,
  asOf: law.as_of,
}));

export const billUnits: CorpusUnit[] = bill.clauses.map((c) => ({
  id: `bill-c${c.clause}`,
  docId: bill.id,
  docTitle: bill.title,
  citation: `cl.${c.clause} (${c.title}), ${BILL_CITE}`,
  ref: `cl.${c.clause}`,
  title: c.title,
  text: c.text,
  status: bill.status as DocStatus,
  asOf: bill.as_of,
}));

export const allUnits: CorpusUnit[] = [...lawUnits, ...billUnits];

export const corpusStatus = status;
export const jurisdiction = pack;

/** Official source of each document, for "verify it yourself" links. */
export const sourceUrls: Record<string, string> = {
  [law.id]: law.source_url,
  [bill.id]: bill.source_url,
};

/**
 * Resolve a citation ref (e.g. "s.13", "cl.44") to its corpus unit.
 * Returns undefined for anything that does not exist — callers must treat an
 * unresolvable reference as a failed answer, never ship it (ETO.md §10).
 */
export function resolveCitation(ref: string): CorpusUnit | undefined {
  const m = ref.trim().toLowerCase().match(/^(s|cl)\.?\s*(\d{1,2})$/);
  if (!m) return undefined;
  const id = m[1] === "s" ? `law-s${m[2]}` : `bill-c${m[2]}`;
  return allUnits.find((u) => u.id === id);
}
